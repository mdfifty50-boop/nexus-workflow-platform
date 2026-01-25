/**
 * CheckoutFlow - Multi-step Stripe Subscription Checkout
 *
 * This component handles the complete subscription checkout process:
 * 1. Plan confirmation (show what they're buying)
 * 2. Payment information (Stripe Elements)
 * 3. Confirmation/Success
 *
 * Features:
 * - Trial period notice (14-day free trial)
 * - Secure payment badge
 * - Terms acceptance checkbox
 * - Promo code input field
 * - Loading states and error handling
 * - Success redirect to dashboard
 *
 * Usage:
 * <CheckoutFlow
 *   plan={selectedPlan}
 *   onComplete={(result) => navigate('/dashboard')}
 *   onCancel={() => navigate('/pricing')}
 * />
 */

import { useState, useCallback } from 'react'
import {
  Elements,
  CardElement,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe, type StripeElementsOptions, type StripeCardElementOptions } from '@stripe/stripe-js'

// Initialize Stripe with publishable key from environment
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

// ============================================================================
// Types
// ============================================================================

export interface PricingPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  highlighted?: boolean
  trialDays?: number
  stripePriceId?: string
}

export interface PromoCode {
  code: string
  discountPercent?: number
  discountAmount?: number
  valid: boolean
  message?: string
}

export interface SubscriptionResult {
  success: boolean
  subscriptionId: string
  customerId: string
  status: string
  trialEnd?: string
  currentPeriodEnd: string
  plan: PricingPlan
}

export interface CheckoutFlowProps {
  plan: PricingPlan
  customerEmail?: string
  customerName?: string
  onComplete: (result: SubscriptionResult) => void
  onCancel?: () => void
  className?: string
  usePaymentElement?: boolean // Toggle between CardElement and PaymentElement
}

type CheckoutStep = 'plan' | 'payment' | 'success'

// ============================================================================
// Placeholder API Functions (to be implemented with actual backend)
// ============================================================================

async function createPaymentIntent(params: {
  planId: string
  customerEmail?: string
  customerName?: string
  promoCode?: string
}): Promise<{ clientSecret: string; customerId: string }> {
  // Placeholder - replace with actual API call
  const response = await fetch('/api/subscriptions/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) {
    throw new Error('Failed to create payment intent')
  }
  return response.json()
}

async function confirmSubscription(params: {
  paymentIntentId: string
  customerId: string
  planId: string
}): Promise<SubscriptionResult> {
  // Placeholder - replace with actual API call
  const response = await fetch('/api/subscriptions/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) {
    throw new Error('Failed to confirm subscription')
  }
  return response.json()
}

async function validatePromoCode(code: string): Promise<PromoCode> {
  // Placeholder - replace with actual API call
  const response = await fetch(`/api/promo-codes/validate?code=${encodeURIComponent(code)}`)
  if (!response.ok) {
    return { code, valid: false, message: 'Invalid promo code' }
  }
  return response.json()
}

// ============================================================================
// Inner Payment Form Component
// ============================================================================

interface PaymentFormProps {
  plan: PricingPlan
  promoCode: PromoCode | null
  termsAccepted: boolean
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
  onBack: () => void
  usePaymentElement?: boolean
}

function PaymentForm({
  plan,
  promoCode,
  termsAccepted,
  onSuccess,
  onError,
  onBack,
  usePaymentElement = false,
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)

  const calculateFinalPrice = useCallback(() => {
    let price = plan.price
    if (promoCode?.valid) {
      if (promoCode.discountPercent) {
        price = price * (1 - promoCode.discountPercent / 100)
      } else if (promoCode.discountAmount) {
        price = Math.max(0, price - promoCode.discountAmount)
      }
    }
    return price
  }, [plan.price, promoCode])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: plan.currency,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    if (!termsAccepted) {
      setErrorMessage('Please accept the terms and conditions')
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      if (usePaymentElement) {
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin + '/checkout/complete',
          },
          redirect: 'if_required',
        })

        if (error) {
          setErrorMessage(error.message || 'Payment failed')
          onError(error.message || 'Payment failed')
        } else if (paymentIntent) {
          onSuccess(paymentIntent.id)
        }
      } else {
        const cardElement = elements.getElement(CardElement)
        if (!cardElement) {
          throw new Error('Card element not found')
        }

        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        })

        if (error) {
          setErrorMessage(error.message || 'Payment failed')
          onError(error.message || 'Payment failed')
        } else if (paymentMethod) {
          // For subscription, we typically attach the payment method and confirm server-side
          onSuccess(paymentMethod.id)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setErrorMessage(message)
      onError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const cardElementOptions: StripeCardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#dc2626',
        iconColor: '#dc2626',
      },
    },
    hidePostalCode: false,
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Order Summary
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {plan.name} Plan ({plan.interval === 'year' ? 'Annual' : 'Monthly'})
            </span>
            <span className="text-gray-900 dark:text-white font-medium">
              {formatCurrency(plan.price)}
            </span>
          </div>
          {promoCode?.valid && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">
                Promo: {promoCode.code}
              </span>
              <span className="text-green-600 dark:text-green-400">
                -{promoCode.discountPercent
                  ? `${promoCode.discountPercent}%`
                  : formatCurrency(promoCode.discountAmount || 0)}
              </span>
            </div>
          )}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">
                Total Today
              </span>
              <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                {plan.trialDays && plan.trialDays > 0
                  ? formatCurrency(0)
                  : formatCurrency(calculateFinalPrice())}
              </span>
            </div>
            {plan.trialDays && plan.trialDays > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Then {formatCurrency(calculateFinalPrice())}/{plan.interval} after {plan.trialDays}-day trial
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Element or Card Element */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Payment Details
        </label>
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
          {usePaymentElement ? (
            <PaymentElement
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
              }}
            />
          ) : (
            <CardElement
              options={cardElementOptions}
              onChange={(e) => setCardComplete(e.complete)}
            />
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-600 dark:text-red-400 text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>256-bit SSL encrypted</span>
        <span className="mx-1">|</span>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
        </svg>
        <span>Secured by Stripe</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing || (!usePaymentElement && !cardComplete) || !termsAccepted}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            `Start ${plan.trialDays ? `${plan.trialDays}-Day Trial` : 'Subscription'}`
          )}
        </button>
      </div>
    </form>
  )
}

// ============================================================================
// Main CheckoutFlow Component
// ============================================================================

export function CheckoutFlow({
  plan,
  customerEmail,
  customerName,
  onComplete,
  onCancel,
  className = '',
  usePaymentElement = false,
}: CheckoutFlowProps) {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('plan')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [subscriptionResult, setSubscriptionResult] = useState<SubscriptionResult | null>(null)

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: plan.currency,
    }).format(amount)
  }

  // Initialize payment intent when moving to payment step
  const initializePayment = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = await createPaymentIntent({
        planId: plan.id,
        customerEmail,
        customerName,
        promoCode: promoCode?.valid ? promoCode.code : undefined,
      })
      setClientSecret(result.clientSecret)
      setCustomerId(result.customerId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize payment'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [plan.id, customerEmail, customerName, promoCode])

  // Handle promo code validation
  const handleValidatePromo = async () => {
    if (!promoInput.trim()) return

    setIsValidatingPromo(true)
    try {
      const result = await validatePromoCode(promoInput.trim())
      setPromoCode(result)
    } catch {
      setPromoCode({
        code: promoInput,
        valid: false,
        message: 'Failed to validate promo code',
      })
    } finally {
      setIsValidatingPromo(false)
    }
  }

  // Handle successful payment
  const handlePaymentSuccess = async (paymentMethodId: string) => {
    if (!customerId) return

    setIsLoading(true)
    try {
      const result = await confirmSubscription({
        paymentIntentId: paymentMethodId,
        customerId,
        planId: plan.id,
      })
      setSubscriptionResult(result)
      setCurrentStep('success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to confirm subscription'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Move to payment step
  const handleContinueToPayment = async () => {
    await initializePayment()
    if (!loadError) {
      setCurrentStep('payment')
    }
  }

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { key: 'plan', label: 'Plan', icon: '1' },
      { key: 'payment', label: 'Payment', icon: '2' },
      { key: 'success', label: 'Done', icon: '3' },
    ]

    const currentIndex = steps.findIndex((s) => s.key === currentStep)

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index <= currentIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {index < currentIndex ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                step.icon
              )}
            </div>
            <span
              className={`ml-2 text-sm hidden sm:inline ${
                index <= currentIndex
                  ? 'text-gray-900 dark:text-white font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-8 sm:w-12 h-0.5 mx-2 sm:mx-3 ${
                  index < currentIndex
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  // Render plan confirmation step
  const renderPlanStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Confirm Your Plan
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review your selection and proceed to payment
        </p>
      </div>

      {/* Plan Card */}
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {plan.name} Plan
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {plan.description}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(plan.price)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              per {plan.interval}
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="border-t border-blue-200 dark:border-blue-800 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            What's included:
          </h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Trial Notice */}
      {plan.trialDays && plan.trialDays > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-green-800 dark:text-green-200">
                {plan.trialDays}-Day Free Trial
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Try risk-free. Cancel anytime before your trial ends and you won't be charged.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Promo Code Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Have a promo code?
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="button"
            onClick={handleValidatePromo}
            disabled={!promoInput.trim() || isValidatingPromo}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {isValidatingPromo ? 'Checking...' : 'Apply'}
          </button>
        </div>
        {promoCode && (
          <p
            className={`text-sm ${
              promoCode.valid
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {promoCode.valid
              ? `Promo applied: ${promoCode.discountPercent
                  ? `${promoCode.discountPercent}% off`
                  : formatCurrency(promoCode.discountAmount || 0) + ' off'}`
              : promoCode.message || 'Invalid promo code'}
          </p>
        )}
      </div>

      {/* Terms Acceptance */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
          I agree to the{' '}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Privacy Policy
          </a>
          . I understand that my subscription will auto-renew and I can cancel anytime.
        </label>
      </div>

      {/* Error Message */}
      {loadError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{loadError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleContinueToPayment}
          disabled={!termsAccepted || isLoading}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Preparing...
            </span>
          ) : (
            'Continue to Payment'
          )}
        </button>
      </div>
    </div>
  )

  // Render payment step
  const renderPaymentStep = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Initializing secure payment...</p>
        </div>
      )
    }

    if (loadError || !clientSecret) {
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
          <svg
            className="w-12 h-12 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            Payment Initialization Failed
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{loadError || 'Unknown error'}</p>
          <button
            onClick={handleContinueToPayment}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )
    }

    const options: StripeElementsOptions = {
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#2563eb',
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          colorDanger: '#dc2626',
          fontFamily: 'Inter, system-ui, sans-serif',
          borderRadius: '8px',
        },
      },
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Payment Information
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Enter your payment details to complete your subscription
          </p>
        </div>

        <Elements stripe={stripePromise} options={options}>
          <PaymentForm
            plan={plan}
            promoCode={promoCode}
            termsAccepted={termsAccepted}
            onSuccess={handlePaymentSuccess}
            onError={(error) => setLoadError(error)}
            onBack={() => setCurrentStep('plan')}
            usePaymentElement={usePaymentElement}
          />
        </Elements>
      </div>
    )
  }

  // Render success step
  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
        <svg
          className="w-10 h-10 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to {plan.name}!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {plan.trialDays && plan.trialDays > 0
            ? `Your ${plan.trialDays}-day free trial has started.`
            : 'Your subscription is now active.'}
        </p>
      </div>

      {/* Subscription Details */}
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-left max-w-md mx-auto">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Subscription Details
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Plan</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {plan.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Billing</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(plan.price)}/{plan.interval}
            </span>
          </div>
          {subscriptionResult?.trialEnd && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Trial Ends</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(subscriptionResult.trialEnd).toLocaleDateString()}
              </span>
            </div>
          )}
          {subscriptionResult?.currentPeriodEnd && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Next Billing</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(subscriptionResult.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* What's Next */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-left max-w-md mx-auto">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          What's Next?
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>- Set up your first workflow in minutes</li>
          <li>- Explore our template library</li>
          <li>- Connect your favorite apps</li>
        </ul>
      </div>

      {/* Action Button */}
      <button
        onClick={() => {
          if (subscriptionResult) {
            onComplete(subscriptionResult)
          }
        }}
        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Go to Dashboard
      </button>
    </div>
  )

  return (
    <div className={`checkout-flow max-w-2xl mx-auto p-6 ${className}`}>
      {renderStepIndicator()}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 sm:p-8">
        {currentStep === 'plan' && renderPlanStep()}
        {currentStep === 'payment' && renderPaymentStep()}
        {currentStep === 'success' && renderSuccessStep()}
      </div>

      {/* Trust Badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>30-day money-back guarantee</span>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Secure payment</span>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
          <span>Cancel anytime</span>
        </div>
      </div>
    </div>
  )
}

export default CheckoutFlow

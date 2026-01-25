/**
 * StripeCheckout - Embedded Stripe Elements for Secure Card Collection
 *
 * This component provides PCI-compliant card collection using Stripe Elements.
 * Users enter card details securely - card data never touches your server.
 *
 * Usage:
 * <StripeCheckout
 *   amount={299.99}
 *   currency="USD"
 *   description="Flight booking JFK → LAX"
 *   onSuccess={(result) => console.log('Payment successful:', result)}
 *   onError={(error) => console.error('Payment failed:', error)}
 * />
 */

import { useState, useEffect } from 'react'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js'

// Initialize Stripe with publishable key from environment
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

export interface PaymentSuccessResult {
  paymentIntentId: string
  status: string
  amount: number
  currency: string
}

export interface StripeCheckoutProps {
  amount: number
  currency: string
  description: string
  customerEmail?: string
  customerName?: string
  metadata?: Record<string, string>
  onSuccess: (result: PaymentSuccessResult) => void
  onError: (error: string) => void
  onCancel?: () => void
  className?: string
}

// Inner form component that uses Stripe hooks
function CheckoutForm({
  amount,
  currency,
  description,
  onSuccess,
  onError,
  onCancel,
}: Omit<StripeCheckoutProps, 'customerEmail' | 'customerName' | 'metadata' | 'className'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment/complete',
        },
        redirect: 'if_required',
      })

      if (error) {
        setErrorMessage(error.message || 'Payment failed')
        onError(error.message || 'Payment failed')
      } else if (paymentIntent) {
        onSuccess({
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setErrorMessage(message)
      onError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCurrency = (amt: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(amt)
  }

  return (
    <form onSubmit={handleSubmit} className="stripe-checkout-form">
      {/* Order Summary */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600 dark:text-gray-300">Description</span>
          <span className="font-medium text-gray-900 dark:text-white">{description}</span>
        </div>
        <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-2">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(amount, currency)}
          </span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="mb-6">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
          }}
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!stripe || isProcessing}
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
            `Pay ${formatCurrency(amount, currency)}`
          )}
        </button>
      </div>

      {/* Security Badge */}
      <div className="mt-4 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>Secured by Stripe</span>
      </div>
    </form>
  )
}

// Main component that wraps Elements provider
export function StripeCheckout({
  amount,
  currency,
  description,
  customerEmail,
  customerName,
  metadata,
  onSuccess,
  onError,
  onCancel,
  className = '',
}: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    // Create payment intent on component mount
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)

        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            description,
            customerEmail,
            customerName,
            metadata,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create payment intent')
        }

        const data = await response.json()
        setClientSecret(data.clientSecret)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize payment'
        setLoadError(message)
        onError(message)
      } finally {
        setIsLoading(false)
      }
    }

    createPaymentIntent()
  }, [amount, currency, description, customerEmail, customerName, metadata, onError])

  if (isLoading) {
    return (
      <div className={`stripe-checkout-loading ${className}`}>
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
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={`stripe-checkout-error ${className}`}>
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
          <p className="text-red-600 dark:text-red-300 mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!clientSecret) {
    return null
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
    <div className={`stripe-checkout ${className}`}>
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm
          amount={amount}
          currency={currency}
          description={description}
          onSuccess={onSuccess}
          onError={onError}
          onCancel={onCancel}
        />
      </Elements>
    </div>
  )
}

export default StripeCheckout

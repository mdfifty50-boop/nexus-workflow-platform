/**
 * Checkout Page - Stripe subscription checkout flow
 *
 * Handles:
 * - Plan selection and checkout initiation
 * - Success callback after payment
 * - Cancel callback for abandoned checkouts
 *
 * Routes:
 * - /checkout - Main checkout page with plan selection
 * - /checkout/success - Post-payment success page
 * - /checkout/cancel - Checkout cancellation page
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useLanguage } from '@/i18n/useLanguage'
import {
  PRICING_PLANS,
  redirectToCheckout,
  formatPrice,
} from '@/lib/stripe'
import { PricingSection } from '@/components/PricingSection'

// =============================================================================
// CHECKOUT PAGE
// =============================================================================

export function Checkout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isSignedIn, userProfile } = useAuth()
  const { isActive } = useSubscription()
  const { isRTL, language } = useLanguage()

  const [selectedPlan, setSelectedPlan] = useState<string>('launch')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get plan from URL if provided
  useEffect(() => {
    const planFromUrl = searchParams.get('plan')
    if (planFromUrl && PRICING_PLANS[planFromUrl]) {
      setSelectedPlan(planFromUrl)
    }
  }, [searchParams])

  // Redirect if already subscribed
  useEffect(() => {
    if (isActive) {
      navigate('/dashboard', { replace: true })
    }
  }, [isActive, navigate])

  // Redirect to login if not signed in
  useEffect(() => {
    if (!isSignedIn) {
      navigate('/login?redirect=/checkout', { replace: true })
    }
  }, [isSignedIn, navigate])

  const handleCheckout = useCallback(async () => {
    if (!selectedPlan) return

    const plan = PRICING_PLANS[selectedPlan]
    if (!plan?.stripePriceId) {
      setError('This plan is not available for checkout yet. Please contact support.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await redirectToCheckout(plan.stripePriceId, userProfile?.email)
    } catch (err) {
      console.error('[Checkout] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setIsLoading(false)
    }
  }, [selectedPlan, userProfile?.email])

  const plan = PRICING_PLANS[selectedPlan]

  return (
    <div
      className="min-h-screen bg-slate-950 py-12"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <svg
            className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>{language === 'ar' ? 'رجوع' : 'Back'}</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            {language === 'ar' ? 'اختر خطتك' : 'Choose Your Plan'}
          </h1>
          <p className="text-xl text-slate-400">
            {language === 'ar'
              ? 'احصل على وصول كامل إلى سير عمل Nexus AI'
              : 'Get full access to Nexus AI workflows'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Pricing cards */}
        <PricingSection
          compact
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
        />

        {/* Checkout summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 p-6 bg-slate-800/50 rounded-2xl border border-slate-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
          </h3>

          <div className="space-y-3">
            <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-slate-400">{plan?.name || 'Plan'}</span>
              <span className="text-white font-medium">
                {plan ? formatPrice(plan.price, plan.currency) : '--'}/{plan?.interval || 'month'}
              </span>
            </div>

            {plan?.originalPrice && (
              <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-slate-400">
                  {language === 'ar' ? 'التوفير' : 'Savings'}
                </span>
                <span className="text-emerald-400 font-medium">
                  -{formatPrice(plan.originalPrice - plan.price, plan.currency)}/month
                </span>
              </div>
            )}

            <div className="border-t border-slate-700 pt-3">
              <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-white font-semibold">
                  {language === 'ar' ? 'الإجمالي' : 'Total today'}
                </span>
                <span className="text-2xl font-bold text-white">
                  {plan ? formatPrice(plan.price, plan.currency) : '--'}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                {language === 'ar'
                  ? 'يتم الدفع شهريا. يمكنك الإلغاء في أي وقت.'
                  : 'Billed monthly. Cancel anytime.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isLoading || !plan?.stripePriceId}
            className="w-full mt-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
                {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
              </span>
            ) : !plan?.stripePriceId ? (
              language === 'ar' ? 'غير متاح بعد' : 'Coming Soon'
            ) : (
              language === 'ar' ? 'متابعة الدفع الآمن' : 'Continue to Secure Checkout'
            )}
          </button>

          {/* Security badges */}
          <div className={`mt-4 flex items-center justify-center gap-4 text-slate-500 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{language === 'ar' ? 'آمن' : 'Secure'}</span>
            </div>
            <span>Powered by Stripe</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// =============================================================================
// SUCCESS PAGE
// =============================================================================

export function CheckoutSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshSubscription } = useSubscription()
  const { language, isRTL } = useLanguage()

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Refresh subscription status
    const init = async () => {
      try {
        await refreshSubscription()
      } finally {
        setIsLoading(false)
      }
    }

    init()

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('subscription-updated'))
  }, [refreshSubscription])

  const sessionId = searchParams.get('session_id')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
          <p className="text-slate-400">
            {language === 'ar' ? 'جاري التحقق من الدفع...' : 'Verifying payment...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center"
        >
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-4">
          {language === 'ar' ? 'شكرا لك!' : 'Thank You!'}
        </h1>

        <p className="text-xl text-slate-300 mb-2">
          {language === 'ar'
            ? 'تم تفعيل اشتراكك بنجاح'
            : 'Your subscription is now active'}
        </p>

        <p className="text-slate-400 mb-8">
          {language === 'ar'
            ? 'يمكنك الآن الوصول إلى جميع الميزات المميزة'
            : 'You now have access to all premium features'}
        </p>

        {sessionId && (
          <p className="text-slate-500 text-sm mb-8 font-mono">
            {language === 'ar' ? 'رقم الجلسة:' : 'Session:'} {sessionId.slice(0, 20)}...
          </p>
        )}

        <div className="space-y-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all"
          >
            {language === 'ar' ? 'انتقل إلى لوحة التحكم' : 'Go to Dashboard'}
          </button>

          <button
            onClick={() => navigate('/workflows')}
            className="w-full py-4 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors"
          >
            {language === 'ar' ? 'استكشف سير العمل' : 'Explore Workflows'}
          </button>
        </div>

        {/* Confetti effect placeholder */}
        <div className="mt-8 text-slate-500 text-sm">
          {language === 'ar' ? 'مرحبا بك في Nexus Pro!' : 'Welcome to Nexus Pro!'}
        </div>
      </motion.div>
    </div>
  )
}

// =============================================================================
// CANCEL PAGE
// =============================================================================

export function CheckoutCancel() {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()

  return (
    <div
      className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Cancel icon */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-slate-800 flex items-center justify-center">
          <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">
          {language === 'ar' ? 'تم إلغاء الدفع' : 'Checkout Cancelled'}
        </h1>

        <p className="text-slate-400 mb-8">
          {language === 'ar'
            ? 'لم يتم إجراء أي رسوم. يمكنك المحاولة مرة أخرى عندما تكون جاهزا.'
            : 'No charges were made. You can try again when you\'re ready.'}
        </p>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all"
          >
            {language === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors"
          >
            {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
          </button>
        </div>

        {/* FAQ link */}
        <p className="mt-8 text-slate-500 text-sm">
          {language === 'ar' ? 'لديك أسئلة؟' : 'Have questions?'}{' '}
          <a href="/help" className="text-cyan-400 hover:underline">
            {language === 'ar' ? 'اتصل بالدعم' : 'Contact support'}
          </a>
        </p>
      </motion.div>
    </div>
  )
}

export default Checkout

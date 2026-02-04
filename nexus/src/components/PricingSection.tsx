/**
 * PricingSection - Pricing display with RTL support
 *
 * Shows subscription pricing plans with:
 * - Free ($0/month - 10 workflows)
 * - Starter ($29/month - 30 workflows)
 * - Pro ($79/month - unlimited) - Most Popular
 * - Business ($149/month - unlimited + premium)
 * - Feature comparison
 * - RTL support for Arabic
 * - Responsive design
 *
 * Usage:
 *   <PricingSection
 *     onSelectPlan={(planId) => handlePlanSelection(planId)}
 *     selectedPlan="pro"
 *   />
 */

import { useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/i18n/useLanguage'
import { PRICING_PLANS, formatPrice, type PricingPlan } from '@/lib/stripe'
import { SubscriptionContext } from '@/contexts/SubscriptionContext'

// Safe version of useSubscription that doesn't throw when outside provider
function useSubscriptionSafe() {
  const context = useContext(SubscriptionContext)
  // Return default values if not in provider (e.g., landing page)
  if (!context) {
    return { isActive: false, currentPlan: null }
  }
  return context
}

// =============================================================================
// TYPES
// =============================================================================

interface PricingSectionProps {
  onSelectPlan?: (planId: string) => void
  selectedPlan?: string
  showMonthlyToggle?: boolean
  compact?: boolean
  className?: string
}

// =============================================================================
// COMPONENTS
// =============================================================================

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
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
  )
}

function PricingCard({
  plan,
  isSelected,
  onSelect,
  isRTL,
  locale,
}: {
  plan: PricingPlan
  isSelected: boolean
  onSelect: () => void
  isRTL: boolean
  locale: string
}) {
  const { t } = useTranslation()
  const { isActive, currentPlan } = useSubscriptionSafe()
  const isCurrentPlan = currentPlan === plan.id && isActive

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative rounded-2xl overflow-hidden ${
        plan.popular
          ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-cyan-500/50'
          : 'bg-slate-800/50 border border-slate-700'
      } ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950' : ''}`}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute top-0 inset-x-0">
          <div className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold py-1.5 text-center uppercase tracking-wider">
            {plan.badge || t('landing.pricing.badge', 'Most Popular')}
          </div>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-4`}>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30">
            {t('landing.pricing.currentPlan', 'Current Plan')}
          </span>
        </div>
      )}

      <div className={`p-8 ${plan.popular ? 'pt-14' : ''}`}>
        {/* Plan name */}
        <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
        <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

        {/* Price */}
        <div className={`flex items-baseline gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {plan.originalPrice && (
            <span className="text-slate-500 line-through text-lg">
              {formatPrice(plan.originalPrice, plan.currency, locale)}
            </span>
          )}
          <span className="text-4xl font-bold text-white">
            {formatPrice(plan.price, plan.currency, locale)}
          </span>
          <span className="text-slate-400">/{plan.interval}</span>
        </div>

        {plan.originalPrice && (
          <div className="mb-6">
            <span className="inline-block px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded">
              Save {formatPrice(plan.originalPrice - plan.price, plan.currency, locale)}/month
            </span>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={onSelect}
          disabled={isCurrentPlan}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all mb-8 ${
            plan.popular
              ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/25'
              : 'bg-slate-700 text-white hover:bg-slate-600'
          } ${isCurrentPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isCurrentPlan ? t('landing.pricing.currentPlan', 'Current Plan') : plan.popular ? t('landing.pricing.getStarted', 'Get Started') : t('landing.pricing.choosePlan', 'Choose Plan')}
        </button>

        {/* Features */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-300 uppercase tracking-wider">
            {t('landing.pricing.whatsIncluded', "What's included:")}
          </p>
          <ul className="space-y-3">
            {plan.features.map((feature, index) => (
              <li
                key={index}
                className={`flex items-start gap-3 text-slate-300 ${isRTL ? 'flex-row-reverse text-right' : ''}`}
              >
                <CheckIcon className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PricingSection({
  onSelectPlan,
  selectedPlan,
  compact = false,
  className = '',
}: PricingSectionProps) {
  const { t } = useTranslation()
  const { isRTL, currentLanguageConfig } = useLanguage()
  const [localSelectedPlan, setLocalSelectedPlan] = useState(selectedPlan || 'pro')
  const locale = currentLanguageConfig.locale || 'en-US'

  const handleSelectPlan = (planId: string) => {
    setLocalSelectedPlan(planId)
    onSelectPlan?.(planId)
  }

  const plans = Object.values(PRICING_PLANS)

  if (compact) {
    return (
      <div className={`${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isSelected={localSelectedPlan === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
              isRTL={isRTL}
              locale={locale}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className={`py-20 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            {t('landing.pricing.title', 'Choose Your Plan')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto"
          >
            {t('landing.pricing.subtitle', 'Start free with 10 workflows, then upgrade as you grow.')}
          </motion.p>
        </div>

        {/* Pro Plan Highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-12 p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl border border-cyan-500/20 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-sm">
              {t('landing.pricing.badge', 'Most Popular')}
            </span>
          </div>
          <p className="text-white text-lg">
            {t('landing.pricing.proHighlight', 'Go Pro at $79/month for unlimited workflows and all 500+ integrations')}
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isSelected={localSelectedPlan === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
              isRTL={isRTL}
              locale={locale}
            />
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className={`flex items-center justify-center gap-8 text-slate-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">{t('landing.pricing.secure', 'Secure checkout')}</span>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">{t('landing.pricing.cancel', 'Cancel anytime')}</span>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <span className="text-sm">{t('landing.pricing.moneyBack', '30-day money back')}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// =============================================================================
// UPGRADE MODAL
// =============================================================================

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onCheckout?: () => void // Called after successful redirect initiation
}

export function UpgradeModal({ isOpen, onClose, onCheckout }: UpgradeModalProps) {
  const { t } = useTranslation()
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    const plan = PRICING_PLANS[selectedPlan]
    if (!plan?.stripePriceId) {
      setError('This plan is not available yet. Please try again later.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Dynamically import to avoid circular dependency
      const { redirectToCheckout } = await import('@/lib/stripe')
      await redirectToCheckout(plan.stripePriceId)
      onCheckout?.()
    } catch (err) {
      console.error('[UpgradeModal] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl shadow-2xl"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors z-20"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{t('landing.pricing.upgradeTitle', 'Upgrade to Nexus Pro')}</h2>
            <p className="text-slate-400">{t('landing.pricing.upgradeSubtitle', 'Unlock unlimited AI workflows and premium features')}</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
              {error}
            </div>
          )}

          <PricingSection
            compact
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
          />

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
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
                  {t('common.processing', 'Processing...')}
                </span>
              ) : (
                t('landing.pricing.continueCheckout', 'Continue to Checkout')
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default PricingSection

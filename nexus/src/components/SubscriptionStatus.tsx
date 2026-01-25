/**
 * SubscriptionStatus - Display current subscription info and manage billing
 *
 * Shows:
 * - Current plan and status
 * - Next billing date
 * - Upgrade/Manage buttons
 * - Usage limits (if applicable)
 *
 * Usage:
 *   <SubscriptionStatus />
 *   <SubscriptionStatus compact />
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useLanguage } from '@/i18n/useLanguage'
import { formatPrice, PRICING_PLANS } from '@/lib/stripe'
import { UpgradeModal } from '@/components/PricingSection'

// =============================================================================
// TYPES
// =============================================================================

interface SubscriptionStatusProps {
  compact?: boolean
  showManageButton?: boolean
  className?: string
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SubscriptionStatus({
  compact = false,
  showManageButton = true,
  className = '',
}: SubscriptionStatusProps) {
  const navigate = useNavigate()
  const { isRTL, language } = useLanguage()
  const {
    subscription,
    loading,
    isActive,
    isPro,
    isFree,
    isTrialing,
    isPastDue,
    isCanceled,
    planName,
    daysRemaining,
    currentPlan,
    openBillingPortal,
    showUpgradeModal,
    setShowUpgradeModal,
    refreshSubscription: _refreshSubscription,
  } = useSubscription()

  const [isLoading, setIsLoading] = useState(false)

  const plan = currentPlan ? PRICING_PLANS[currentPlan] : null

  const handleManageBilling = async () => {
    setIsLoading(true)
    try {
      await openBillingPortal()
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = () => {
    navigate('/checkout')
  }

  const handleUpgradeModalClose = () => {
    setShowUpgradeModal(false)
  }

  const handleCheckoutStarted = () => {
    // Modal will close automatically as page redirects to Stripe
    // The refreshSubscription will be called on /checkout/success
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-24 bg-slate-800 rounded-xl" />
      </div>
    )
  }

  // Compact version for sidebars/headers
  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            isPro
              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30'
              : 'bg-slate-700 text-slate-300'
          }`}
        >
          {planName}
        </div>
        {isFree && (
          <button
            onClick={handleUpgrade}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-medium rounded-full hover:from-cyan-400 hover:to-purple-500 transition-all"
          >
            {language === 'ar' ? 'ترقية' : 'Upgrade'}
          </button>
        )}
      </div>
    )
  }

  // Full version
  return (
    <>
      <div
        className={`bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden ${className}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header with gradient */}
        <div className={`p-6 ${isPro ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10' : ''}`}>
          <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div>
              <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-xl font-bold text-white">{planName}</h3>
                {isPro && (
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full">
                    PRO
                  </span>
                )}
                {isTrialing && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                    TRIAL
                  </span>
                )}
                {isPastDue && (
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                    PAST DUE
                  </span>
                )}
                {isCanceled && (
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full">
                    CANCELING
                  </span>
                )}
              </div>

              {plan && (
                <p className="text-slate-400">
                  {formatPrice(plan.price, plan.currency)}/{plan.interval}
                </p>
              )}

              {isFree && (
                <p className="text-slate-400">
                  {language === 'ar'
                    ? 'ترقية للحصول على ميزات غير محدودة'
                    : 'Upgrade for unlimited features'}
                </p>
              )}
            </div>

            {/* Action button */}
            {showManageButton && (
              <div>
                {isPro ? (
                  <button
                    onClick={handleManageBilling}
                    disabled={isLoading}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading
                      ? language === 'ar'
                        ? 'جاري التحميل...'
                        : 'Loading...'
                      : language === 'ar'
                        ? 'إدارة الفواتير'
                        : 'Manage Billing'}
                  </button>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all"
                  >
                    {language === 'ar' ? 'ترقية الآن' : 'Upgrade Now'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subscription details */}
        {subscription.hasSubscription && subscription.subscription && (
          <div className="p-6 border-t border-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">
                  {language === 'ar' ? 'حالة' : 'Status'}
                </p>
                <p className={`font-medium ${isActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isActive
                    ? language === 'ar'
                      ? 'نشط'
                      : 'Active'
                    : isPastDue
                      ? language === 'ar'
                        ? 'متأخر'
                        : 'Past Due'
                      : language === 'ar'
                        ? 'ملغى'
                        : 'Canceled'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">
                  {isCanceled
                    ? language === 'ar'
                      ? 'ينتهي في'
                      : 'Ends on'
                    : language === 'ar'
                      ? 'الفاتورة التالية'
                      : 'Next billing'}
                </p>
                <p className="text-white font-medium">
                  {subscription.subscription.currentPeriodEnd
                    ? new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString(
                        language === 'ar' ? 'ar-SA' : 'en-US',
                        { month: 'short', day: 'numeric', year: 'numeric' }
                      )
                    : '--'}
                </p>
              </div>

              {isTrialing && (
                <div className="col-span-2">
                  <p className="text-sm text-slate-400 mb-1">
                    {language === 'ar' ? 'الأيام المتبقية في التجربة' : 'Trial days remaining'}
                  </p>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-white font-medium">{daysRemaining}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (daysRemaining / 14) * 100)}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {isCanceled && (
                <div className="col-span-2 mt-2 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-orange-300 text-sm">
                    {language === 'ar'
                      ? `سينتهي اشتراكك خلال ${daysRemaining} يوم. قم بإعادة التفعيل للاحتفاظ بالوصول.`
                      : `Your subscription will end in ${daysRemaining} days. Reactivate to keep access.`}
                  </p>
                  <button
                    onClick={handleManageBilling}
                    className="mt-2 px-4 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-400 transition-colors"
                  >
                    {language === 'ar' ? 'إعادة التفعيل' : 'Reactivate'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Free tier features */}
        {isFree && (
          <div className="p-6 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-4">
              {language === 'ar' ? 'الميزات الحالية:' : 'Current features:'}
            </p>
            <ul className="space-y-2">
              <li className={`flex items-center gap-2 text-slate-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{language === 'ar' ? '5 سير عمل' : '5 workflows'}</span>
              </li>
              <li className={`flex items-center gap-2 text-slate-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{language === 'ar' ? 'تكاملات أساسية' : 'Basic integrations'}</span>
              </li>
              <li className={`flex items-center gap-2 text-slate-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{language === 'ar' ? 'دعم المجتمع' : 'Community support'}</span>
              </li>
            </ul>

            <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/20">
              <p className="text-cyan-300 text-sm font-medium mb-2">
                {language === 'ar' ? 'ترقية للحصول على:' : 'Upgrade to unlock:'}
              </p>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>{language === 'ar' ? 'سير عمل غير محدود' : 'Unlimited workflows'}</li>
                <li>{language === 'ar' ? 'جميع التكاملات' : 'All integrations'}</li>
                <li>{language === 'ar' ? 'دعم ذو أولوية' : 'Priority support'}</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={handleUpgradeModalClose}
        onCheckout={handleCheckoutStarted}
      />
    </>
  )
}

export default SubscriptionStatus

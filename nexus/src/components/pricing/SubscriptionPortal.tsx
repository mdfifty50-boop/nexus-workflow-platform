/**
 * SubscriptionPortal - Comprehensive subscription management portal
 *
 * Features:
 * - Current subscription status display
 * - Plan change (upgrade/downgrade)
 * - Billing cycle switching
 * - Payment method management (via Stripe portal)
 * - Usage statistics with progress bars
 * - Invoice/billing history
 * - Cancellation flow with reason selection
 *
 * Usage:
 *   <SubscriptionPortal />
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useLanguage } from '@/i18n/useLanguage'
import { formatPrice, PRICING_PLANS, type PricingPlan } from '@/lib/stripe'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'

// =============================================================================
// TYPES
// =============================================================================

interface SubscriptionPortalProps {
  className?: string
}

interface UsageData {
  workflows: {
    used: number
    limit: number
  }
  executions: {
    used: number
    limit: number
  }
  periodStart: Date
  periodEnd: Date
}

interface Invoice {
  id: string
  date: Date
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed'
  pdfUrl?: string
}

type CancellationReason =
  | 'too_expensive'
  | 'not_using'
  | 'missing_features'
  | 'switching_competitor'
  | 'temporary_pause'
  | 'other'

// =============================================================================
// MOCK DATA - Replace with actual API calls
// =============================================================================

const mockUsageData: UsageData = {
  workflows: {
    used: 12,
    limit: 50,
  },
  executions: {
    used: 1847,
    limit: 5000,
  },
  periodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  periodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
}

const mockInvoices: Invoice[] = [
  { id: 'inv_1', date: new Date('2025-12-15'), amount: 79, currency: 'USD', status: 'paid' },
  { id: 'inv_2', date: new Date('2025-11-15'), amount: 79, currency: 'USD', status: 'paid' },
  { id: 'inv_3', date: new Date('2025-10-15'), amount: 79, currency: 'USD', status: 'paid' },
]

// =============================================================================
// API PLACEHOLDER FUNCTIONS
// =============================================================================

/** Placeholder: Fetch usage data from API */
async function fetchUsageData(): Promise<UsageData> {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/subscriptions/usage')
  // return response.json()
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockUsageData), 500)
  })
}

/** Placeholder: Fetch invoices from Stripe */
async function fetchInvoices(): Promise<Invoice[]> {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/subscriptions/invoices')
  // return response.json()
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockInvoices), 500)
  })
}

/** Placeholder: Change subscription plan */
async function changePlan(_newPlanId: string): Promise<boolean> {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/subscriptions/change-plan', {
  //   method: 'POST',
  //   body: JSON.stringify({ planId: newPlanId }),
  // })
  // return response.ok
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000)
  })
}

/** Placeholder: Switch billing cycle */
async function switchBillingCycle(_interval: 'month' | 'year'): Promise<boolean> {
  // TODO: Replace with actual API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000)
  })
}

/** Placeholder: Cancel subscription */
async function cancelSubscription(_reason: CancellationReason, _feedback?: string): Promise<boolean> {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/subscriptions/cancel', {
  //   method: 'POST',
  //   body: JSON.stringify({ reason, feedback }),
  // })
  // return response.ok
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000)
  })
}

/** Placeholder: Pause subscription instead of canceling */
async function pauseSubscription(_months: number): Promise<boolean> {
  // TODO: Replace with actual API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000)
  })
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function StatusBadge({ status }: { status: 'active' | 'trial' | 'canceled' | 'past_due' | 'paused' }) {
  const variants: Record<typeof status, { label: string; className: string }> = {
    active: {
      label: 'Active',
      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    trial: {
      label: 'Trial',
      className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    },
    canceled: {
      label: 'Canceled',
      className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    },
    past_due: {
      label: 'Past Due',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
    paused: {
      label: 'Paused',
      className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    },
  }

  const { label, className } = variants[status]

  return (
    <Badge className={cn('border', className)}>
      {label}
    </Badge>
  )
}

function UsageProgressBar({
  label,
  used,
  limit,
  showWarning = true,
}: {
  label: string
  used: number
  limit: number
  showWarning?: boolean
}) {
  const percentage = Math.min(100, (used / limit) * 100)
  const isWarning = percentage >= 80
  const isCritical = percentage >= 95

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className={cn(
          'font-medium',
          isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-white'
        )}>
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <Progress
        value={used}
        max={limit}
        className={cn(
          'h-2',
          isCritical ? '[&>div]:bg-red-500' : isWarning ? '[&>div]:bg-amber-500' : ''
        )}
      />
      {showWarning && isCritical && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Approaching limit. Consider upgrading.
        </p>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Status Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton width={150} height={24} />
              <Skeleton width={100} height={16} />
            </div>
            <Skeleton width={80} height={28} variant="rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton width={80} height={14} />
              <Skeleton width={120} height={18} />
            </div>
            <div className="space-y-2">
              <Skeleton width={80} height={14} />
              <Skeleton width={120} height={18} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton width={120} height={20} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton width="100%" height={8} />
            <Skeleton width="100%" height={8} />
          </div>
        </CardContent>
      </Card>

      {/* Actions Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton width="100%" height={100} variant="rounded" />
        <Skeleton width="100%" height={100} variant="rounded" />
      </div>
    </div>
  )
}

// =============================================================================
// CANCELLATION MODAL
// =============================================================================

interface CancellationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: CancellationReason, feedback?: string) => Promise<void>
  onPause: (months: number) => Promise<void>
  effectiveDate: Date
}

function CancellationModal({
  isOpen,
  onClose,
  onConfirm,
  onPause,
  effectiveDate,
}: CancellationModalProps) {
  const [step, setStep] = useState<'reason' | 'pause_offer' | 'confirm'>('reason')
  const [reason, setReason] = useState<CancellationReason | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const reasons: { value: CancellationReason; label: string }[] = [
    { value: 'too_expensive', label: 'Too expensive' },
    { value: 'not_using', label: 'Not using it enough' },
    { value: 'missing_features', label: 'Missing features I need' },
    { value: 'switching_competitor', label: 'Switching to another product' },
    { value: 'temporary_pause', label: 'Just need a break' },
    { value: 'other', label: 'Other reason' },
  ]

  const handleReasonSelect = (selectedReason: CancellationReason) => {
    setReason(selectedReason)
    if (selectedReason === 'temporary_pause' || selectedReason === 'not_using') {
      setStep('pause_offer')
    } else {
      setStep('confirm')
    }
  }

  const handlePause = async (months: number) => {
    setIsLoading(true)
    try {
      await onPause(months)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!reason) return
    setIsLoading(true)
    try {
      await onConfirm(reason, feedback || undefined)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'pause_offer') setStep('reason')
    else if (step === 'confirm') {
      if (reason === 'temporary_pause' || reason === 'not_using') {
        setStep('pause_offer')
      } else {
        setStep('reason')
      }
    }
  }

  const handleClose = () => {
    setStep('reason')
    setReason(null)
    setFeedback('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {step === 'reason' && 'Why are you canceling?'}
            {step === 'pause_offer' && 'How about a pause instead?'}
            {step === 'confirm' && 'Confirm Cancellation'}
          </DialogTitle>
          <DialogDescription>
            {step === 'reason' && 'We\'d love to know so we can improve Nexus.'}
            {step === 'pause_offer' && 'You can pause your subscription and come back later.'}
            {step === 'confirm' && 'This action will cancel your subscription.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <AnimatePresence mode="wait">
            {step === 'reason' && (
              <motion.div
                key="reason"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-2"
              >
                {reasons.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => handleReasonSelect(r.value)}
                    className={cn(
                      'w-full p-4 text-left rounded-lg border transition-colors',
                      'border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/50',
                      reason === r.value && 'border-cyan-500 bg-cyan-500/10'
                    )}
                  >
                    <span className="text-white">{r.label}</span>
                  </button>
                ))}
              </motion.div>
            )}

            {step === 'pause_offer' && (
              <motion.div
                key="pause"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <p className="text-cyan-300 font-medium mb-2">
                    Instead of canceling, pause your subscription
                  </p>
                  <p className="text-slate-400 text-sm">
                    Your data will be saved and you can resume anytime without losing anything.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((months) => (
                    <button
                      key={months}
                      onClick={() => handlePause(months)}
                      disabled={isLoading}
                      className={cn(
                        'p-4 rounded-lg border border-slate-700 hover:border-cyan-500/50',
                        'hover:bg-slate-800/50 transition-colors text-center',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      <span className="block text-2xl font-bold text-white">{months}</span>
                      <span className="text-sm text-slate-400">
                        {months === 1 ? 'month' : 'months'}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep('confirm')}
                  className="w-full text-center text-slate-400 hover:text-white transition-colors text-sm"
                >
                  No thanks, I want to cancel
                </button>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-orange-300 font-medium mb-2">
                    Your subscription will end on:
                  </p>
                  <p className="text-white text-lg font-semibold">
                    {effectiveDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    You'll continue to have access until this date.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-400">
                    Any additional feedback? (optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us more about your experience..."
                    className={cn(
                      'w-full p-3 rounded-lg border border-slate-700 bg-slate-800/50',
                      'text-white placeholder:text-slate-500 resize-none',
                      'focus:outline-none focus:border-cyan-500/50'
                    )}
                    rows={3}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogBody>

        <DialogFooter>
          {step !== 'reason' && (
            <Button variant="ghost" onClick={handleBack} disabled={isLoading}>
              Back
            </Button>
          )}
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            Keep Subscription
          </Button>
          {step === 'confirm' && (
            <Button
              variant="destructive"
              onClick={handleConfirm}
              loading={isLoading}
            >
              Cancel Subscription
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// PLAN CHANGE MODAL
// =============================================================================

interface PlanChangeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlanId: string | null
  onChangePlan: (planId: string) => Promise<void>
}

function PlanChangeModal({
  isOpen,
  onClose,
  currentPlanId,
  onChangePlan,
}: PlanChangeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { language } = useLanguage()

  const plans = Object.values(PRICING_PLANS)

  const handleConfirm = async () => {
    if (!selectedPlan) return
    setIsLoading(true)
    try {
      await onChangePlan(selectedPlan)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Change Your Plan</DialogTitle>
          <DialogDescription>
            Select a new plan. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan === plan.id}
                isCurrent={currentPlanId === plan.id}
                onSelect={() => setSelectedPlan(plan.id)}
                locale={language === 'ar' ? 'ar-SA' : 'en-US'}
              />
            ))}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPlan || selectedPlan === currentPlanId || isLoading}
            loading={isLoading}
          >
            Confirm Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PlanCard({
  plan,
  isSelected,
  isCurrent,
  onSelect,
  locale,
}: {
  plan: PricingPlan
  isSelected: boolean
  isCurrent: boolean
  onSelect: () => void
  locale: string
}) {
  return (
    <button
      onClick={onSelect}
      disabled={isCurrent}
      className={cn(
        'relative p-6 text-left rounded-xl border transition-all',
        isSelected
          ? 'border-cyan-500 bg-cyan-500/10'
          : 'border-slate-700 hover:border-slate-600',
        isCurrent && 'opacity-50 cursor-not-allowed'
      )}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-4 px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded">
          {plan.badge || 'POPULAR'}
        </span>
      )}
      {isCurrent && (
        <span className="absolute -top-3 right-4 px-2 py-0.5 bg-slate-600 text-white text-xs font-bold rounded">
          CURRENT
        </span>
      )}

      <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
      <p className="text-sm text-slate-400 mb-4">{plan.description}</p>

      <div className="flex items-baseline gap-1 mb-4">
        {plan.originalPrice && (
          <span className="text-slate-500 line-through text-sm">
            {formatPrice(plan.originalPrice, plan.currency, locale)}
          </span>
        )}
        <span className="text-2xl font-bold text-white">
          {formatPrice(plan.price, plan.currency, locale)}
        </span>
        <span className="text-slate-400">/{plan.interval}</span>
      </div>

      <ul className="space-y-1 text-sm text-slate-400">
        {plan.features.slice(0, 4).map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
    </button>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SubscriptionPortal({ className }: SubscriptionPortalProps) {
  const { isRTL, language } = useLanguage()
  const {
    subscription,
    loading,
    isActive,
    isFree,
    isTrialing,
    isPastDue,
    isCanceled,
    planName,
    currentPlan,
    daysRemaining,
    openBillingPortal,
    refreshSubscription,
  } = useSubscription()

  // Local state
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [usageLoading, setUsageLoading] = useState(true)
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch usage data on mount
  useEffect(() => {
    fetchUsageData().then((data) => {
      setUsageData(data)
      setUsageLoading(false)
    })
    fetchInvoices().then((data) => {
      setInvoices(data)
      setInvoicesLoading(false)
    })
  }, [])

  // Derived values
  const subscriptionStatus = useMemo(() => {
    if (isCanceled) return 'canceled'
    if (isPastDue) return 'past_due'
    if (isTrialing) return 'trial'
    if (isActive) return 'active'
    return 'active'
  }, [isActive, isTrialing, isPastDue, isCanceled])

  const plan = currentPlan ? PRICING_PLANS[currentPlan] : null
  const billingInterval = plan?.interval || 'month'
  const nextBillingDate = subscription.subscription?.currentPeriodEnd
    ? new Date(subscription.subscription.currentPeriodEnd)
    : null

  // Handlers
  const handleManageBilling = useCallback(async () => {
    setActionLoading(true)
    try {
      await openBillingPortal()
    } finally {
      setActionLoading(false)
    }
  }, [openBillingPortal])

  const handleChangePlan = useCallback(async (newPlanId: string) => {
    const success = await changePlan(newPlanId)
    if (success) {
      await refreshSubscription()
    }
  }, [refreshSubscription])

  const handleSwitchBillingCycle = useCallback(async () => {
    const newInterval = billingInterval === 'month' ? 'year' : 'month'
    setActionLoading(true)
    try {
      const success = await switchBillingCycle(newInterval)
      if (success) {
        await refreshSubscription()
      }
    } finally {
      setActionLoading(false)
    }
  }, [billingInterval, refreshSubscription])

  const handleCancelSubscription = useCallback(async (reason: CancellationReason, feedback?: string) => {
    const success = await cancelSubscription(reason, feedback)
    if (success) {
      await refreshSubscription()
    }
  }, [refreshSubscription])

  const handlePauseSubscription = useCallback(async (months: number) => {
    const success = await pauseSubscription(months)
    if (success) {
      await refreshSubscription()
    }
  }, [refreshSubscription])

  // Loading state
  if (loading) {
    return (
      <div className={cn('max-w-4xl mx-auto p-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <LoadingSkeleton />
      </div>
    )
  }

  // Free tier - show upgrade prompt
  if (isFree) {
    return (
      <div className={cn('max-w-4xl mx-auto p-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Free Plan</CardTitle>
                <CardDescription>Upgrade to unlock unlimited workflows</CardDescription>
              </div>
              <StatusBadge status="active" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/20">
              <h3 className="text-lg font-semibold text-white mb-4">Upgrade to Pro</h3>
              <ul className="space-y-2 mb-6">
                {['Unlimited workflows', 'All integrations', 'Priority support', 'Custom AI agents'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-slate-300">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                variant="cta"
                size="lg"
                onClick={() => setShowPlanModal(true)}
                className="w-full"
              >
                Upgrade Now - Starting at $79/mo
              </Button>
            </div>
          </CardContent>
        </Card>

        <PlanChangeModal
          isOpen={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          currentPlanId={null}
          onChangePlan={handleChangePlan}
        />
      </div>
    )
  }

  return (
    <div className={cn('max-w-4xl mx-auto p-6 space-y-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Subscription Status Card */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">{planName}</CardTitle>
                <StatusBadge status={subscriptionStatus} />
              </div>
              <CardDescription>
                {plan && (
                  <span className="text-lg">
                    {formatPrice(plan.price, plan.currency, language === 'ar' ? 'ar-SA' : 'en-US')}
                    <span className="text-slate-500">/{billingInterval}ly</span>
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleManageBilling}
              loading={actionLoading}
            >
              Manage Billing
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Billing Cycle */}
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Billing Cycle</p>
              <p className="text-white font-medium capitalize">{billingInterval}ly</p>
            </div>

            {/* Next Billing Date */}
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">
                {isCanceled ? 'Access Ends' : 'Next Billing'}
              </p>
              <p className="text-white font-medium">
                {nextBillingDate
                  ? nextBillingDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '--'}
              </p>
            </div>

            {/* Payment Method */}
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Payment Method</p>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-medium">**** 4242</span>
              </div>
            </div>

            {/* Days Remaining (if trial or canceling) */}
            {(isTrialing || isCanceled) && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">
                  {isTrialing ? 'Trial Ends In' : 'Access Ends In'}
                </p>
                <p className={cn(
                  'text-lg font-bold',
                  daysRemaining <= 3 ? 'text-red-400' : daysRemaining <= 7 ? 'text-amber-400' : 'text-white'
                )}>
                  {daysRemaining} days
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage This Period</CardTitle>
          {usageData && (
            <CardDescription>
              {usageData.periodStart.toLocaleDateString()} - {usageData.periodEnd.toLocaleDateString()}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {usageLoading ? (
            <div className="space-y-4">
              <Skeleton width="100%" height={40} />
              <Skeleton width="100%" height={40} />
            </div>
          ) : usageData ? (
            <div className="space-y-6">
              <UsageProgressBar
                label="Workflows"
                used={usageData.workflows.used}
                limit={usageData.workflows.limit}
              />
              <UsageProgressBar
                label="Executions"
                used={usageData.executions.used}
                limit={usageData.executions.limit}
              />

              {/* Simple Usage Trend */}
              <div className="pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400 mb-3">Usage Trend (Last 7 Days)</p>
                <div className="flex items-end gap-1 h-16">
                  {[65, 45, 80, 55, 90, 70, 85].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-cyan-500/30 rounded-t transition-all hover:bg-cyan-500/50"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <span>Mon</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400">Unable to load usage data</p>
          )}
        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Change Plan */}
        <Card className="hover:border-slate-600 transition-colors cursor-pointer" onClick={() => setShowPlanModal(true)}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-lg">
                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Change Plan</h3>
                <p className="text-sm text-slate-400">Upgrade or switch to a different plan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Switch Billing Cycle */}
        <Card className="hover:border-slate-600 transition-colors cursor-pointer" onClick={handleSwitchBillingCycle}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Switch to {billingInterval === 'month' ? 'Annual' : 'Monthly'}</h3>
                <p className="text-sm text-slate-400">
                  {billingInterval === 'month' ? 'Save 20% with annual billing' : 'Switch to monthly payments'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Update Payment */}
        <Card className="hover:border-slate-600 transition-colors cursor-pointer" onClick={handleManageBilling}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Update Payment Method</h3>
                <p className="text-sm text-slate-400">Change your credit card or billing info</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Invoices */}
        <Card className="hover:border-slate-600 transition-colors cursor-pointer" onClick={handleManageBilling}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Billing History</h3>
                <p className="text-sm text-slate-400">View and download past invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <Skeleton width={100} height={16} />
                  <Skeleton width={60} height={16} />
                </div>
              ))}
            </div>
          ) : invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-700 rounded">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {invoice.date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-slate-400">
                        {formatPrice(invoice.amount, invoice.currency, language === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={cn(
                        invoice.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : invoice.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                      )}
                    >
                      {invoice.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => invoice.pdfUrl && window.open(invoice.pdfUrl, '_blank')}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4">No invoices yet</p>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="ghost" onClick={handleManageBilling} className="w-full">
            View All Invoices
          </Button>
        </CardFooter>
      </Card>

      {/* Cancel Subscription */}
      {!isCanceled && (
        <Card className="border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold mb-1">Cancel Subscription</h3>
                <p className="text-sm text-slate-400">
                  You'll continue to have access until the end of your billing period.
                </p>
              </div>
              <Button
                variant="outline"
                className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CancellationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        onPause={handlePauseSubscription}
        effectiveDate={nextBillingDate || new Date()}
      />

      <PlanChangeModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        currentPlanId={currentPlan}
        onChangePlan={handleChangePlan}
      />
    </div>
  )
}

export default SubscriptionPortal

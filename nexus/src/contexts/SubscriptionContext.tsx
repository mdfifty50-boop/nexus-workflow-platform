/**
 * SubscriptionContext - Global subscription state management
 *
 * Provides subscription status, plan info, and upgrade prompts throughout the app.
 *
 * Usage:
 *   const { subscription, isActive, canAccess, openUpgrade } = useSubscription()
 *
 *   if (!canAccess('premium-feature')) {
 *     return <UpgradePrompt />
 *   }
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchSubscriptionStatus,
  type SubscriptionInfo,
  PRICING_PLANS,
} from '@/lib/stripe'

// =============================================================================
// TYPES
// =============================================================================

export interface SubscriptionContextType {
  // Subscription data
  subscription: SubscriptionInfo
  loading: boolean
  error: string | null

  // Status helpers
  isActive: boolean
  isPro: boolean
  isFree: boolean
  isTrialing: boolean
  isPastDue: boolean
  isCanceled: boolean

  // Plan info
  currentPlan: string | null
  planName: string
  daysRemaining: number

  // Feature access
  canAccess: (feature: string) => boolean

  // Actions
  refreshSubscription: () => Promise<void>
  openUpgrade: () => void
  openBillingPortal: () => Promise<void>

  // UI state
  showUpgradeModal: boolean
  setShowUpgradeModal: (show: boolean) => void
}

const defaultSubscription: SubscriptionInfo = {
  hasSubscription: false,
  subscription: null,
  isActive: false,
  isPastDue: false,
  isCanceled: false,
  isTrialing: false,
  daysRemaining: 0,
  canAccessFeatures: false,
}

// Features that require a subscription
const PRO_FEATURES = [
  'unlimited-workflows',
  'custom-agents',
  'api-access',
  'team-collaboration',
  'priority-support',
  'analytics',
  'advanced-integrations',
]

// Features available to all users (free tier / trial)
const FREE_FEATURES = [
  'basic-workflows',
  'basic-integrations',
  'community-support',
]

// =============================================================================
// CONTEXT
// =============================================================================

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

// =============================================================================
// PROVIDER
// =============================================================================

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, userId, userProfile } = useAuth()

  const [subscription, setSubscription] = useState<SubscriptionInfo>(defaultSubscription)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Fetch subscription status
  const refreshSubscription = useCallback(async () => {
    if (!isSignedIn || !userId) {
      setSubscription(defaultSubscription)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Pass the user's email to identify the customer in Stripe
      const email = userProfile?.email
      const status = await fetchSubscriptionStatus(email)
      setSubscription(status)
    } catch (err) {
      console.error('[SubscriptionContext] Error fetching subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to load subscription')
      setSubscription(defaultSubscription)
    } finally {
      setLoading(false)
    }
  }, [isSignedIn, userId, userProfile?.email])

  // Fetch on mount and when user changes
  useEffect(() => {
    refreshSubscription()
  }, [refreshSubscription])

  // Listen for subscription update events (from webhooks via SSE or polling)
  useEffect(() => {
    if (!isSignedIn) return

    // Poll for subscription updates every 5 minutes
    const pollInterval = setInterval(refreshSubscription, 5 * 60 * 1000)

    // Also listen for custom events (can be dispatched by webhook handlers)
    const handleSubscriptionUpdate = () => {
      refreshSubscription()
    }

    window.addEventListener('subscription-updated', handleSubscriptionUpdate)

    return () => {
      clearInterval(pollInterval)
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate)
    }
  }, [isSignedIn, refreshSubscription])

  // Derived state
  const isActive = subscription.isActive || subscription.isTrialing
  const isPro = subscription.hasSubscription && isActive
  const isFree = !subscription.hasSubscription
  const isTrialing = subscription.isTrialing
  const isPastDue = subscription.isPastDue
  const isCanceled = subscription.isCanceled

  const currentPlan = subscription.subscription?.planId || null
  const planName = currentPlan ? (PRICING_PLANS[currentPlan]?.name || 'Pro') : 'Free'
  const daysRemaining = subscription.daysRemaining

  // Feature access check
  const canAccess = useCallback(
    (feature: string): boolean => {
      // Free features always accessible
      if (FREE_FEATURES.includes(feature)) {
        return true
      }

      // Pro features require active subscription
      if (PRO_FEATURES.includes(feature)) {
        return isActive
      }

      // Unknown features default to requiring subscription
      return isActive
    },
    [isActive]
  )

  // Open upgrade modal
  const openUpgrade = useCallback(() => {
    setShowUpgradeModal(true)
  }, [])

  // Open billing portal
  const openBillingPortal = useCallback(async () => {
    try {
      const { redirectToBillingPortal } = await import('@/lib/stripe')
      await redirectToBillingPortal()
    } catch (err) {
      console.error('[SubscriptionContext] Error opening billing portal:', err)
      setError(err instanceof Error ? err.message : 'Failed to open billing portal')
    }
  }, [])

  const value = useMemo<SubscriptionContextType>(
    () => ({
      subscription,
      loading,
      error,
      isActive,
      isPro,
      isFree,
      isTrialing,
      isPastDue,
      isCanceled,
      currentPlan,
      planName,
      daysRemaining,
      canAccess,
      refreshSubscription,
      openUpgrade,
      openBillingPortal,
      showUpgradeModal,
      setShowUpgradeModal,
    }),
    [
      subscription,
      loading,
      error,
      isActive,
      isPro,
      isFree,
      isTrialing,
      isPastDue,
      isCanceled,
      currentPlan,
      planName,
      daysRemaining,
      canAccess,
      refreshSubscription,
      openUpgrade,
      openBillingPortal,
      showUpgradeModal,
    ]
  )

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

// =============================================================================
// HOOK
// =============================================================================

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext)

  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }

  return context
}

// =============================================================================
// HIGHER-ORDER COMPONENT
// =============================================================================

/**
 * HOC to require subscription for a component
 */
export function withSubscription<P extends object>(
  Component: React.ComponentType<P>,
  requiredFeature?: string
) {
  return function WithSubscriptionComponent(props: P) {
    const { canAccess, openUpgrade, loading } = useSubscription()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
        </div>
      )
    }

    if (requiredFeature && !canAccess(requiredFeature)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-cyan-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Pro Feature</h3>
          <p className="text-slate-400 mb-6 max-w-md">
            This feature requires a Nexus Pro subscription. Upgrade now to unlock all features.
          </p>
          <button
            onClick={openUpgrade}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all"
          >
            Upgrade to Pro
          </button>
        </div>
      )
    }

    return <Component {...props} />
  }
}

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Badge showing current subscription status
 */
export function SubscriptionBadge() {
  const { planName, isTrialing, isPastDue, isCanceled, daysRemaining } = useSubscription()

  let badgeText = planName
  let badgeClass = 'bg-slate-700 text-slate-300'

  if (isPastDue) {
    badgeText = 'Past Due'
    badgeClass = 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
  } else if (isCanceled) {
    badgeText = `Cancels in ${daysRemaining}d`
    badgeClass = 'bg-red-500/20 text-red-400 border border-red-500/30'
  } else if (isTrialing) {
    badgeText = `Trial - ${daysRemaining}d left`
    badgeClass = 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
  } else if (planName !== 'Free') {
    badgeClass = 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30'
  }

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgeClass}`}>
      {badgeText}
    </span>
  )
}

/**
 * Banner for past due or expiring subscriptions
 */
export function SubscriptionWarningBanner() {
  const { isPastDue, isCanceled, daysRemaining, openBillingPortal, openUpgrade } = useSubscription()

  if (!isPastDue && !isCanceled) {
    return null
  }

  return (
    <div
      className={`w-full p-3 ${
        isPastDue
          ? 'bg-amber-500/10 border-b border-amber-500/20'
          : 'bg-red-500/10 border-b border-red-500/20'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            className={`w-5 h-5 ${isPastDue ? 'text-amber-400' : 'text-red-400'}`}
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
          <span className={isPastDue ? 'text-amber-200' : 'text-red-200'}>
            {isPastDue
              ? 'Your payment is past due. Please update your payment method to continue using Nexus.'
              : `Your subscription will end in ${daysRemaining} days. Renew now to keep your access.`}
          </span>
        </div>
        <button
          onClick={isPastDue ? openBillingPortal : openUpgrade}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg ${
            isPastDue
              ? 'bg-amber-500 text-black hover:bg-amber-400'
              : 'bg-red-500 text-white hover:bg-red-400'
          } transition-colors`}
        >
          {isPastDue ? 'Update Payment' : 'Renew Now'}
        </button>
      </div>
    </div>
  )
}

export default SubscriptionProvider

/**
 * Tier Context
 *
 * React context for subscription tier access throughout the application.
 *
 * Provides:
 * - TierProvider component
 * - useTier() hook for full context access
 * - useFeatureAccess(feature) hook for feature checks
 * - useLimit(limitType) hook for limit checks
 * - UpgradePrompt component for upgrade prompts
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'

import type {
  TierContextValue,
  TierProviderProps,
  SubscriptionTier,
  FeatureKey,
  LimitType,
  FeatureAccessResult,
  LimitCheckResult,
  UpgradeOption,
  TierConfig,
  TierComparison,
  UserSubscriptionState,
} from './tier-types'

import { SUBSCRIPTION_TIERS } from './tier-types'

// Void unused imports for TypeScript
void 0 as unknown as LimitType
void 0 as unknown as TierConfig
void 0 as unknown as TierComparison

import {
  TIER_CONFIGS,
  getTierConfig as getStaticTierConfig,
} from './tier-definitions'

import {
  tierService,
  getUpgradeOptionsForTier,
  getTierComparison as getStaticTierComparison,
} from './tier-service'

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const TierContext = createContext<TierContextValue | null>(null)

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export function TierProvider(props: TierProviderProps): React.ReactElement {
  const { children, userId, initialTier = SUBSCRIPTION_TIERS.FREE, onUpgradeClick } = props

  // State
  const [tier, setTier] = useState<SubscriptionTier>(initialTier)
  const [subscription, setSubscription] = useState<UserSubscriptionState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch subscription on mount and when userId changes
  useEffect(() => {
    async function fetchSubscription(): Promise<void> {
      if (!userId) {
        setTier(initialTier)
        setSubscription(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const state = await tierService.getUserSubscriptionState(userId)

        if (state) {
          setTier(state.tier)
          setSubscription(state)
        } else {
          setTier(SUBSCRIPTION_TIERS.FREE)
          setSubscription(null)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch subscription'
        setError(message)
        console.error('[TierContext] Error fetching subscription:', err)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchSubscription()
  }, [userId, initialTier])

  // Feature access check (synchronous using current tier)
  const hasFeature = useCallback(
    (feature: FeatureKey): boolean => {
      const config = TIER_CONFIGS[tier]
      return config.features.includes(feature)
    },
    [tier]
  )

  // Get detailed feature access
  const getFeatureAccess = useCallback(
    (feature: FeatureKey): FeatureAccessResult => {
      const config = TIER_CONFIGS[tier]
      const hasAccess = config.features.includes(feature)

      // Find minimum tier required
      let requiredTier: SubscriptionTier | undefined
      if (!hasAccess) {
        for (const t of [SUBSCRIPTION_TIERS.FREE, SUBSCRIPTION_TIERS.PRO, SUBSCRIPTION_TIERS.ENTERPRISE]) {
          if (TIER_CONFIGS[t].features.includes(feature)) {
            requiredTier = t
            break
          }
        }
      }

      return {
        hasAccess,
        feature,
        tier,
        requiredTier,
        upgradeRequired: !hasAccess,
      }
    },
    [tier]
  )

  // Get limit value
  const getLimit = useCallback(
    (limitType: LimitType): number | null => {
      const config = TIER_CONFIGS[tier]
      return config.limits[limitType] ?? null
    },
    [tier]
  )

  // Check if within limit
  const isWithinLimit = useCallback(
    (limitType: LimitType, currentUsage?: number): LimitCheckResult => {
      const config = TIER_CONFIGS[tier]
      const limit = config.limits[limitType]
      const usage = currentUsage ?? subscription?.usage[limitType] ?? 0

      if (limit === null) {
        return {
          withinLimit: true,
          limitType,
          currentUsage: usage,
          limit: null,
          remaining: null,
          percentUsed: 0,
          upgradeRequired: false,
        }
      }

      const remaining = Math.max(0, limit - usage)
      const percentUsed = limit > 0 ? Math.round((usage / limit) * 100) : 0
      const withinLimit = usage < limit

      return {
        withinLimit,
        limitType,
        currentUsage: usage,
        limit,
        remaining,
        percentUsed,
        upgradeRequired: !withinLimit,
      }
    },
    [tier, subscription]
  )

  // Get current usage
  const getUsage = useCallback(
    (limitType: LimitType): number => {
      return subscription?.usage[limitType] ?? 0
    },
    [subscription]
  )

  // Get tier config
  const getTierConfig = useCallback(
    (targetTier?: SubscriptionTier): TierConfig => {
      return getStaticTierConfig(targetTier ?? tier)
    },
    [tier]
  )

  // Get upgrade options
  const getUpgradeOptions = useCallback((): UpgradeOption[] => {
    return getUpgradeOptionsForTier(tier)
  }, [tier])

  // Get tier comparison
  const getTierComparison = useCallback((): TierComparison => {
    return getStaticTierComparison()
  }, [])

  // Refresh subscription data
  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (!userId) return

    try {
      setIsLoading(true)
      tierService.clearSubscriptionCache(userId)

      const state = await tierService.getUserSubscriptionState(userId)

      if (state) {
        setTier(state.tier)
        setSubscription(state)
      }
    } catch (err) {
      console.error('[TierContext] Error refreshing subscription:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Context value
  const contextValue = useMemo<TierContextValue>(
    () => ({
      tier,
      subscription,
      isLoading,
      error,
      hasFeature,
      getFeatureAccess,
      getLimit,
      isWithinLimit,
      getUsage,
      getTierConfig,
      getUpgradeOptions,
      getTierComparison,
      refreshSubscription,
    }),
    [
      tier,
      subscription,
      isLoading,
      error,
      hasFeature,
      getFeatureAccess,
      getLimit,
      isWithinLimit,
      getUsage,
      getTierConfig,
      getUpgradeOptions,
      getTierComparison,
      refreshSubscription,
    ]
  )

  // Store onUpgradeClick in a ref for child components
  const upgradeClickRef = React.useRef(onUpgradeClick)
  upgradeClickRef.current = onUpgradeClick

  return (
    <TierContext.Provider value={contextValue}>
      <UpgradeClickContext.Provider value={upgradeClickRef}>
        {children}
      </UpgradeClickContext.Provider>
    </TierContext.Provider>
  )
}

// =============================================================================
// UPGRADE CLICK CONTEXT (Internal)
// =============================================================================

const UpgradeClickContext = createContext<React.MutableRefObject<((option: UpgradeOption) => void) | undefined> | null>(null)

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Main hook to access tier context
 */
export function useTier(): TierContextValue {
  const context = useContext(TierContext)
  if (!context) {
    throw new Error('useTier must be used within a TierProvider')
  }
  return context
}

/**
 * Hook to check feature access
 */
export function useFeatureAccess(feature: FeatureKey): FeatureAccessResult & { isLoading: boolean } {
  const { getFeatureAccess, isLoading } = useTier()

  const result = useMemo(() => getFeatureAccess(feature), [getFeatureAccess, feature])

  return {
    ...result,
    isLoading,
  }
}

/**
 * Hook to check if user has a feature
 */
export function useHasFeature(feature: FeatureKey): boolean {
  const { hasFeature } = useTier()
  return hasFeature(feature)
}

/**
 * Hook to check limit status
 */
export function useLimit(limitType: LimitType, currentUsage?: number): LimitCheckResult & { isLoading: boolean } {
  const { isWithinLimit, isLoading } = useTier()

  const result = useMemo(
    () => isWithinLimit(limitType, currentUsage),
    [isWithinLimit, limitType, currentUsage]
  )

  return {
    ...result,
    isLoading,
  }
}

/**
 * Hook to get current usage for a limit
 */
export function useUsage(limitType: LimitType): number {
  const { getUsage } = useTier()
  return getUsage(limitType)
}

/**
 * Hook to get current tier
 */
export function useCurrentTier(): SubscriptionTier {
  const { tier } = useTier()
  return tier
}

/**
 * Hook to get upgrade options
 */
export function useUpgradeOptions(): UpgradeOption[] {
  const { getUpgradeOptions } = useTier()
  return useMemo(() => getUpgradeOptions(), [getUpgradeOptions])
}

// =============================================================================
// UPGRADE PROMPT COMPONENT
// =============================================================================

interface UpgradePromptProps {
  feature?: FeatureKey
  limit?: LimitType
  currentUsage?: number
  title?: string
  message?: string
  showComparison?: boolean
  className?: string
  onClose?: () => void
}

export function UpgradePrompt(props: UpgradePromptProps): React.ReactElement | null {
  const {
    feature,
    limit,
    currentUsage,
    title: customTitle,
    message: customMessage,
    showComparison = false,
    className = '',
    onClose,
  } = props

  const { tier, getFeatureAccess, isWithinLimit, getUpgradeOptions, getTierComparison } = useTier()
  const upgradeClickRef = useContext(UpgradeClickContext)

  // Determine what triggered the prompt
  const featureAccess = feature ? getFeatureAccess(feature) : null
  const limitCheck = limit ? isWithinLimit(limit, currentUsage) : null

  // If user has access and is within limits, don't show prompt
  if (
    (featureAccess && featureAccess.hasAccess) &&
    (!limitCheck || limitCheck.withinLimit)
  ) {
    return null
  }

  const upgradeOptions = getUpgradeOptions()
  const comparison = showComparison ? getTierComparison() : null

  // Generate title and message
  let title = customTitle
  let message = customMessage

  if (!title) {
    if (featureAccess && !featureAccess.hasAccess) {
      title = 'Upgrade to Access This Feature'
    } else if (limitCheck && !limitCheck.withinLimit) {
      title = 'Limit Reached'
    } else {
      title = 'Upgrade Your Plan'
    }
  }

  if (!message) {
    if (featureAccess && !featureAccess.hasAccess && featureAccess.requiredTier) {
      message = `This feature requires the ${TIER_CONFIGS[featureAccess.requiredTier].name} plan or higher.`
    } else if (limitCheck && !limitCheck.withinLimit) {
      message = `You've reached your ${tier} plan limit. Upgrade to continue.`
    } else {
      message = 'Unlock more features and higher limits by upgrading your plan.'
    }
  }

  const handleUpgradeClick = (option: UpgradeOption): void => {
    if (upgradeClickRef?.current) {
      upgradeClickRef.current(option)
    }
  }

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            {title}
          </h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Limit progress if applicable */}
      {limitCheck && !limitCheck.withinLimit && limitCheck.limit !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-sm text-amber-700 dark:text-amber-300">
            <span>Usage</span>
            <span>{limitCheck.currentUsage} / {limitCheck.limit}</span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-amber-200 dark:bg-amber-800">
            <div
              className="h-2 rounded-full bg-amber-500"
              style={{ width: `${Math.min(100, limitCheck.percentUsed)}%` }}
            />
          </div>
        </div>
      )}

      {/* Upgrade options */}
      <div className="mt-4 space-y-2">
        {upgradeOptions.map((option) => (
          <button
            key={option.toTier}
            onClick={() => handleUpgradeClick(option)}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${
              option.recommended
                ? 'border-amber-500 bg-amber-100 hover:bg-amber-200 dark:bg-amber-800/50 dark:hover:bg-amber-800'
                : 'border-amber-200 bg-white hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-amber-900 dark:text-amber-100">
                  {option.name}
                </span>
                {option.recommended && (
                  <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                    Recommended
                  </span>
                )}
              </div>
              <span className="text-sm text-amber-700 dark:text-amber-300">
                {option.priceDifference > 0
                  ? `+$${option.priceDifference}/mo`
                  : 'Contact Sales'}
              </span>
            </div>
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
              {option.description}
            </p>
          </button>
        ))}
      </div>

      {/* Comparison table */}
      {showComparison && comparison && (
        <div className="mt-4 border-t border-amber-200 pt-4 dark:border-amber-700">
          <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Plan Comparison
          </h4>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-amber-700 dark:text-amber-300">
                  <th className="py-2 pr-4 text-left font-medium">Limit</th>
                  <th className="px-4 py-2 text-center font-medium">Free</th>
                  <th className="px-4 py-2 text-center font-medium">Pro</th>
                  <th className="pl-4 py-2 text-center font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-amber-800 dark:text-amber-200">
                {comparison.limits.slice(0, 5).map((limitComp) => (
                  <tr key={limitComp.type} className="border-t border-amber-100 dark:border-amber-800">
                    <td className="py-2 pr-4">{limitComp.name}</td>
                    <td className="px-4 py-2 text-center">{limitComp.free}</td>
                    <td className="px-4 py-2 text-center">{limitComp.pro}</td>
                    <td className="pl-4 py-2 text-center">{limitComp.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// FEATURE GATE COMPONENT
// =============================================================================

interface FeatureGateProps {
  feature: FeatureKey
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
}

export function FeatureGate(props: FeatureGateProps): React.ReactElement {
  const { feature, children, fallback, showUpgradePrompt = true } = props
  const { hasAccess, isLoading } = useFeatureAccess(feature)

  if (isLoading) {
    return <>{fallback ?? null}</>
  }

  if (hasAccess) {
    return <>{children}</>
  }

  if (showUpgradePrompt) {
    return <UpgradePrompt feature={feature} />
  }

  return <>{fallback ?? null}</>
}

// =============================================================================
// LIMIT GATE COMPONENT
// =============================================================================

interface LimitGateProps {
  limit: LimitType
  currentUsage?: number
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
}

export function LimitGate(props: LimitGateProps): React.ReactElement {
  const { limit, currentUsage, children, fallback, showUpgradePrompt = true } = props
  const { withinLimit, isLoading } = useLimit(limit, currentUsage)

  if (isLoading) {
    return <>{fallback ?? null}</>
  }

  if (withinLimit) {
    return <>{children}</>
  }

  if (showUpgradePrompt) {
    return <UpgradePrompt limit={limit} currentUsage={currentUsage} />
  }

  return <>{fallback ?? null}</>
}

// =============================================================================
// EXPORTS
// =============================================================================

export { TierContext }

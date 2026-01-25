/**
 * Tier Service
 *
 * Service for tier management operations including:
 * - Get current tier for a user
 * - Check feature access
 * - Check limit usage
 * - Get upgrade options
 * - Generate tier comparisons
 */

import type {
  SubscriptionTier,
  FeatureKey,
  LimitType,
  TierConfig,
  FeatureAccessResult,
  LimitCheckResult,
  UpgradeOption,
  TierComparison,
  UserSubscriptionState,
} from './tier-types'

import {
  SUBSCRIPTION_TIERS,
  LIMIT_TYPES,
} from './tier-types'

import {
  TIER_ORDER,
  getTierConfig,
  getTierIndex,
  isTierHigher,
  getMinimumTierForFeature,
  formatLimitValue,
} from './tier-definitions'

import {
  generateTierComparison,
  getFeatureMetadata,
  getLimitMetadata,
  getUpgradeFeatures,
  getUpgradeLimitImprovements,
} from './tier-features'

// =============================================================================
// USER SUBSCRIPTION CACHE
// =============================================================================

// In-memory cache for subscription state
const subscriptionCache = new Map<string, {
  state: UserSubscriptionState
  fetchedAt: number
}>()

const CACHE_TTL_MS = 60 * 1000 // 1 minute cache

/**
 * Clear cached subscription for a user
 */
export function clearSubscriptionCache(userId: string): void {
  subscriptionCache.delete(userId)
}

/**
 * Clear all cached subscriptions
 */
export function clearAllSubscriptionCache(): void {
  subscriptionCache.clear()
}

// =============================================================================
// CURRENT TIER RETRIEVAL
// =============================================================================

/**
 * Get the current tier for a user
 */
export async function getCurrentTier(userId: string): Promise<SubscriptionTier> {
  const state = await getUserSubscriptionState(userId)
  return state?.tier ?? SUBSCRIPTION_TIERS.FREE
}

/**
 * Get full subscription state for a user
 */
export async function getUserSubscriptionState(
  userId: string
): Promise<UserSubscriptionState | null> {
  // Check cache first
  const cached = subscriptionCache.get(userId)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.state
  }

  try {
    // Fetch from API
    const response = await fetch(`/api/subscriptions/user/${userId}`)

    if (!response.ok) {
      if (response.status === 404) {
        // No subscription = Free tier
        return null
      }
      throw new Error('Failed to fetch subscription')
    }

    const data = await response.json()

    const state: UserSubscriptionState = {
      userId,
      tier: data.tier ?? SUBSCRIPTION_TIERS.FREE,
      billingInterval: data.billingInterval ?? 'monthly',
      status: data.status ?? 'active',
      currentPeriodStart: new Date(data.currentPeriodStart),
      currentPeriodEnd: new Date(data.currentPeriodEnd),
      cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
      trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : undefined,
      usage: data.usage ?? {},
    }

    // Cache the result
    subscriptionCache.set(userId, {
      state,
      fetchedAt: Date.now(),
    })

    return state
  } catch (error) {
    console.error('[TierService] Error fetching subscription:', error)
    return null
  }
}

// =============================================================================
// FEATURE ACCESS
// =============================================================================

/**
 * Check if a user can access a feature
 */
export async function canAccessFeature(
  userId: string,
  feature: FeatureKey
): Promise<boolean> {
  const result = await getFeatureAccess(userId, feature)
  return result.hasAccess
}

/**
 * Get detailed feature access result
 */
export async function getFeatureAccess(
  userId: string,
  feature: FeatureKey
): Promise<FeatureAccessResult> {
  const tier = await getCurrentTier(userId)
  const config = getTierConfig(tier)
  const hasAccess = config.features.includes(feature)

  // Find minimum tier required if not accessible
  let requiredTier: SubscriptionTier | undefined
  if (!hasAccess) {
    requiredTier = getMinimumTierForFeature(feature)
  }

  return {
    hasAccess,
    feature,
    tier,
    requiredTier,
    upgradeRequired: !hasAccess,
  }
}

/**
 * Check multiple features at once
 */
export async function checkMultipleFeatures(
  userId: string,
  features: FeatureKey[]
): Promise<Map<FeatureKey, FeatureAccessResult>> {
  const tier = await getCurrentTier(userId)
  const config = getTierConfig(tier)
  const results = new Map<FeatureKey, FeatureAccessResult>()

  for (const feature of features) {
    const hasAccess = config.features.includes(feature)
    let requiredTier: SubscriptionTier | undefined
    if (!hasAccess) {
      requiredTier = getMinimumTierForFeature(feature)
    }

    results.set(feature, {
      hasAccess,
      feature,
      tier,
      requiredTier,
      upgradeRequired: !hasAccess,
    })
  }

  return results
}

// =============================================================================
// LIMIT CHECKING
// =============================================================================

/**
 * Get the limit value for a user's tier
 */
export async function getFeatureLimits(
  userId: string
): Promise<Record<LimitType, number | null>> {
  const tier = await getCurrentTier(userId)
  const config = getTierConfig(tier)
  return { ...config.limits }
}

/**
 * Get a specific limit for a user
 */
export async function getLimit(
  userId: string,
  limitType: LimitType
): Promise<number | null> {
  const tier = await getCurrentTier(userId)
  const config = getTierConfig(tier)
  return config.limits[limitType] ?? null
}

/**
 * Check if usage is within limit
 */
export async function isWithinLimit(
  userId: string,
  limitType: LimitType,
  currentUsage?: number
): Promise<LimitCheckResult> {
  const state = await getUserSubscriptionState(userId)
  const tier = state?.tier ?? SUBSCRIPTION_TIERS.FREE
  const config = getTierConfig(tier)
  const limit = config.limits[limitType]

  // Get current usage from state or parameter
  const usage = currentUsage ?? state?.usage[limitType] ?? 0

  // Unlimited (null) means always within limit
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
}

/**
 * Check multiple limits at once
 */
export async function checkMultipleLimits(
  userId: string,
  limitChecks: Array<{ limitType: LimitType; currentUsage?: number }>
): Promise<Map<LimitType, LimitCheckResult>> {
  const results = new Map<LimitType, LimitCheckResult>()

  for (const check of limitChecks) {
    const result = await isWithinLimit(userId, check.limitType, check.currentUsage)
    results.set(check.limitType, result)
  }

  return results
}

/**
 * Get current usage for a limit type
 */
export async function getUsage(userId: string, limitType: LimitType): Promise<number> {
  const state = await getUserSubscriptionState(userId)
  return state?.usage[limitType] ?? 0
}

/**
 * Get usage summary for all limits
 */
export async function getUsageSummary(
  userId: string
): Promise<Map<LimitType, { usage: number; limit: number | null; percentUsed: number }>> {
  const state = await getUserSubscriptionState(userId)
  const tier = state?.tier ?? SUBSCRIPTION_TIERS.FREE
  const config = getTierConfig(tier)
  const summary = new Map<LimitType, { usage: number; limit: number | null; percentUsed: number }>()

  for (const limitType of Object.values(LIMIT_TYPES)) {
    const limit = config.limits[limitType]
    const usage = state?.usage[limitType] ?? 0
    const percentUsed = limit !== null && limit > 0 ? Math.round((usage / limit) * 100) : 0

    summary.set(limitType, { usage, limit, percentUsed })
  }

  return summary
}

// =============================================================================
// UPGRADE OPTIONS
// =============================================================================

/**
 * Get upgrade options for a user's current tier
 */
export async function getUpgradeOptions(userId: string): Promise<UpgradeOption[]> {
  const currentTier = await getCurrentTier(userId)
  return getUpgradeOptionsForTier(currentTier)
}

/**
 * Get upgrade options from a specific tier
 */
export function getUpgradeOptionsForTier(currentTier: SubscriptionTier): UpgradeOption[] {
  const options: UpgradeOption[] = []
  const currentIndex = getTierIndex(currentTier)
  const currentConfig = getTierConfig(currentTier)

  // Get all tiers higher than current
  for (let i = currentIndex + 1; i < TIER_ORDER.length; i++) {
    const targetTier = TIER_ORDER[i]
    const targetConfig = getTierConfig(targetTier)

    // Get key benefits (new features)
    const newFeatures = getUpgradeFeatures(currentTier, targetTier)
    const keyBenefits = newFeatures.slice(0, 5).map((f) => {
      const meta = getFeatureMetadata(f)
      return meta.name
    })

    // Add limit improvements
    const limitImprovements = getUpgradeLimitImprovements(currentTier, targetTier)
    limitImprovements.slice(0, 2).forEach((imp) => {
      const meta = getLimitMetadata(imp.limitType)
      keyBenefits.push(`${meta.name}: ${imp.improvement}`)
    })

    // Calculate price difference
    const currentPrice = currentConfig.pricing.monthly
    const targetPrice = targetConfig.pricing.isCustomPricing ? 0 : targetConfig.pricing.monthly
    const priceDifference = targetPrice - currentPrice
    const percentageIncrease = currentPrice > 0 ? Math.round((priceDifference / currentPrice) * 100) : 100

    options.push({
      fromTier: currentTier,
      toTier: targetTier,
      name: targetConfig.name,
      description: targetConfig.tagline,
      keyBenefits,
      priceDifference,
      percentageIncrease,
      recommended: targetTier === SUBSCRIPTION_TIERS.PRO, // Pro is always recommended
    })
  }

  return options
}

// =============================================================================
// TIER COMPARISON
// =============================================================================

/**
 * Get complete tier comparison
 */
export function getTierComparison(): TierComparison {
  return generateTierComparison()
}

/**
 * Get tier config by tier name
 */
export function getTierConfigByName(tier: SubscriptionTier): TierConfig {
  return getTierConfig(tier)
}

/**
 * Get all tier configs
 */
export function getAllTierConfigs(): TierConfig[] {
  return TIER_ORDER.map((tier) => getTierConfig(tier))
}

// =============================================================================
// TIER VALIDATION
// =============================================================================

/**
 * Check if user can downgrade to a lower tier
 */
export async function canDowngrade(
  userId: string,
  targetTier: SubscriptionTier
): Promise<{ canDowngrade: boolean; blockers: string[] }> {
  const currentTier = await getCurrentTier(userId)
  const state = await getUserSubscriptionState(userId)

  // Can't downgrade if already at or below target tier
  if (!isTierHigher(currentTier, targetTier)) {
    return { canDowngrade: false, blockers: ['Already at or below target tier'] }
  }

  const blockers: string[] = []
  const targetConfig = getTierConfig(targetTier)

  // Check if current usage exceeds target tier limits
  if (state) {
    for (const [limitType, usage] of Object.entries(state.usage)) {
      const targetLimit = targetConfig.limits[limitType as LimitType]
      if (targetLimit !== null && usage > targetLimit) {
        const meta = getLimitMetadata(limitType as LimitType)
        blockers.push(
          `Current ${meta.name} usage (${usage}) exceeds ${targetConfig.name} limit (${formatLimitValue(targetLimit)})`
        )
      }
    }
  }

  return {
    canDowngrade: blockers.length === 0,
    blockers,
  }
}

// =============================================================================
// USAGE TRACKING
// =============================================================================

/**
 * Increment usage for a limit type
 */
export async function incrementUsage(
  userId: string,
  limitType: LimitType,
  amount: number = 1
): Promise<LimitCheckResult> {
  try {
    const response = await fetch(`/api/subscriptions/usage/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limitType, increment: amount }),
    })

    if (!response.ok) {
      throw new Error('Failed to increment usage')
    }

    // Clear cache to get fresh data
    clearSubscriptionCache(userId)

    // Return updated limit check
    return await isWithinLimit(userId, limitType)
  } catch (error) {
    console.error('[TierService] Error incrementing usage:', error)
    // Return current state even on error
    return await isWithinLimit(userId, limitType)
  }
}

/**
 * Reset usage for a limit type (e.g., monthly reset)
 */
export async function resetUsage(
  userId: string,
  limitType: LimitType
): Promise<void> {
  try {
    await fetch(`/api/subscriptions/usage/${userId}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limitType }),
    })

    // Clear cache
    clearSubscriptionCache(userId)
  } catch (error) {
    console.error('[TierService] Error resetting usage:', error)
  }
}

// =============================================================================
// EXPORT SERVICE OBJECT
// =============================================================================

export const tierService = {
  // Current tier
  getCurrentTier,
  getUserSubscriptionState,

  // Feature access
  canAccessFeature,
  getFeatureAccess,
  checkMultipleFeatures,

  // Limits
  getFeatureLimits,
  getLimit,
  isWithinLimit,
  checkMultipleLimits,
  getUsage,
  getUsageSummary,

  // Upgrade
  getUpgradeOptions,
  getUpgradeOptionsForTier,

  // Comparison
  getTierComparison,
  getTierConfigByName,
  getAllTierConfigs,

  // Validation
  canDowngrade,

  // Usage tracking
  incrementUsage,
  resetUsage,

  // Cache management
  clearSubscriptionCache,
  clearAllSubscriptionCache,
}

export default tierService

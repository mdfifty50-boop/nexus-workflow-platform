/**
 * Subscription Tier Definitions
 *
 * Defines the three subscription tiers:
 * - Free: Basic features, limited usage
 * - Pro ($79/month): Full features, higher limits
 * - Enterprise (Custom): Unlimited, custom features
 *
 * Pricing aligned with Nexus launch strategy:
 * - Pro tier at $79/month (launch special)
 * - Annual billing saves 17%
 */

import type {
  TierConfig,
  TierPricing,
  SubscriptionTier,
  LimitType,
} from './tier-types'

import {
  SUBSCRIPTION_TIERS,
  SUPPORT_LEVELS,
  FEATURE_KEYS,
  LIMIT_TYPES,
} from './tier-types'

// =============================================================================
// PRICING CONFIGURATIONS
// =============================================================================

const FREE_PRICING: TierPricing = {
  monthly: 0,
  annual: 0,
  annualSavingsPercent: 0,
  currency: 'USD',
  isCustomPricing: false,
}

const PRO_PRICING: TierPricing = {
  monthly: 79,
  annual: 790, // $65.83/month - save 17%
  annualSavingsPercent: 17,
  currency: 'USD',
  isCustomPricing: false,
}

const ENTERPRISE_PRICING: TierPricing = {
  monthly: 0, // Custom pricing
  annual: 0, // Custom pricing
  annualSavingsPercent: 0,
  currency: 'USD',
  isCustomPricing: true,
}

// =============================================================================
// LIMIT CONFIGURATIONS
// =============================================================================

const FREE_LIMITS: Record<LimitType, number | null> = {
  [LIMIT_TYPES.WORKFLOWS_PER_MONTH]: 10,
  [LIMIT_TYPES.WORKFLOW_NODES]: 5,
  [LIMIT_TYPES.INTEGRATIONS]: 3,
  [LIMIT_TYPES.TEAM_MEMBERS]: 1,
  [LIMIT_TYPES.STORAGE_GB]: 1,
  [LIMIT_TYPES.API_CALLS_PER_HOUR]: 100,
  [LIMIT_TYPES.API_CALLS_PER_DAY]: 1000,
  [LIMIT_TYPES.EXECUTION_HISTORY_DAYS]: 7,
  [LIMIT_TYPES.WEBHOOK_ENDPOINTS]: 1,
  [LIMIT_TYPES.CUSTOM_AGENTS]: 0,
}

const PRO_LIMITS: Record<LimitType, number | null> = {
  [LIMIT_TYPES.WORKFLOWS_PER_MONTH]: null, // Unlimited
  [LIMIT_TYPES.WORKFLOW_NODES]: null, // Unlimited
  [LIMIT_TYPES.INTEGRATIONS]: 25,
  [LIMIT_TYPES.TEAM_MEMBERS]: 10,
  [LIMIT_TYPES.STORAGE_GB]: 50,
  [LIMIT_TYPES.API_CALLS_PER_HOUR]: 1000,
  [LIMIT_TYPES.API_CALLS_PER_DAY]: 10000,
  [LIMIT_TYPES.EXECUTION_HISTORY_DAYS]: 90,
  [LIMIT_TYPES.WEBHOOK_ENDPOINTS]: 25,
  [LIMIT_TYPES.CUSTOM_AGENTS]: 10,
}

const ENTERPRISE_LIMITS: Record<LimitType, number | null> = {
  [LIMIT_TYPES.WORKFLOWS_PER_MONTH]: null, // Unlimited
  [LIMIT_TYPES.WORKFLOW_NODES]: null, // Unlimited
  [LIMIT_TYPES.INTEGRATIONS]: null, // Unlimited
  [LIMIT_TYPES.TEAM_MEMBERS]: null, // Unlimited
  [LIMIT_TYPES.STORAGE_GB]: null, // Unlimited
  [LIMIT_TYPES.API_CALLS_PER_HOUR]: null, // Unlimited
  [LIMIT_TYPES.API_CALLS_PER_DAY]: null, // Unlimited
  [LIMIT_TYPES.EXECUTION_HISTORY_DAYS]: null, // Unlimited
  [LIMIT_TYPES.WEBHOOK_ENDPOINTS]: null, // Unlimited
  [LIMIT_TYPES.CUSTOM_AGENTS]: null, // Unlimited
}

// =============================================================================
// TIER CONFIGURATIONS
// =============================================================================

export const FREE_TIER: TierConfig = {
  tier: SUBSCRIPTION_TIERS.FREE,
  name: 'Free',
  tagline: 'Get started with automation',
  description: 'Perfect for individuals exploring workflow automation. Includes basic features to get you started.',
  pricing: FREE_PRICING,
  supportLevel: SUPPORT_LEVELS.COMMUNITY,
  features: [
    FEATURE_KEYS.WORKFLOW_BUILDER,
    FEATURE_KEYS.WORKFLOW_TEMPLATES,
    FEATURE_KEYS.AI_SUGGESTIONS_BASIC,
    FEATURE_KEYS.INTEGRATIONS_BASIC,
    FEATURE_KEYS.ANALYTICS_BASIC,
    FEATURE_KEYS.SUPPORT_COMMUNITY,
  ],
  limits: FREE_LIMITS,
  ctaText: 'Start Free',
  ctaVariant: 'outline',
}

export const PRO_TIER: TierConfig = {
  tier: SUBSCRIPTION_TIERS.PRO,
  name: 'Pro',
  tagline: 'For growing teams and power users',
  description: 'Unlock the full power of Nexus with advanced AI, unlimited workflows, and team collaboration.',
  pricing: PRO_PRICING,
  supportLevel: SUPPORT_LEVELS.PRIORITY,
  popular: true,
  badge: 'MOST POPULAR',
  features: [
    // All Free features
    FEATURE_KEYS.WORKFLOW_BUILDER,
    FEATURE_KEYS.WORKFLOW_TEMPLATES,
    FEATURE_KEYS.WORKFLOW_VERSIONING,
    FEATURE_KEYS.WORKFLOW_BRANCHING,
    FEATURE_KEYS.WORKFLOW_SCHEDULING,
    FEATURE_KEYS.WORKFLOW_PRIORITY_QUEUE,
    // AI Features
    FEATURE_KEYS.AI_SUGGESTIONS_BASIC,
    FEATURE_KEYS.AI_SUGGESTIONS_ADVANCED,
    FEATURE_KEYS.AI_AGENTS,
    // Integration Features
    FEATURE_KEYS.INTEGRATIONS_BASIC,
    FEATURE_KEYS.INTEGRATIONS_PREMIUM,
    FEATURE_KEYS.WEBHOOKS,
    FEATURE_KEYS.API_ACCESS,
    // Team Features
    FEATURE_KEYS.TEAM_COLLABORATION,
    FEATURE_KEYS.TEAM_ROLES,
    // Analytics
    FEATURE_KEYS.ANALYTICS_BASIC,
    FEATURE_KEYS.ANALYTICS_ADVANCED,
    FEATURE_KEYS.EXPORT_DATA,
    // Support
    FEATURE_KEYS.SUPPORT_EMAIL,
    FEATURE_KEYS.SUPPORT_PRIORITY,
  ],
  limits: PRO_LIMITS,
  ctaText: 'Start Pro Trial',
  ctaVariant: 'primary',
}

export const ENTERPRISE_TIER: TierConfig = {
  tier: SUBSCRIPTION_TIERS.ENTERPRISE,
  name: 'Enterprise',
  tagline: 'For organizations requiring scale and security',
  description: 'Custom solutions with unlimited everything, dedicated support, SSO, and custom integrations.',
  pricing: ENTERPRISE_PRICING,
  supportLevel: SUPPORT_LEVELS.DEDICATED,
  badge: 'CUSTOM',
  features: [
    // All Pro features
    FEATURE_KEYS.WORKFLOW_BUILDER,
    FEATURE_KEYS.WORKFLOW_TEMPLATES,
    FEATURE_KEYS.WORKFLOW_VERSIONING,
    FEATURE_KEYS.WORKFLOW_BRANCHING,
    FEATURE_KEYS.WORKFLOW_SCHEDULING,
    FEATURE_KEYS.WORKFLOW_PRIORITY_QUEUE,
    // AI Features
    FEATURE_KEYS.AI_SUGGESTIONS_BASIC,
    FEATURE_KEYS.AI_SUGGESTIONS_ADVANCED,
    FEATURE_KEYS.AI_SUGGESTIONS_CUSTOM,
    FEATURE_KEYS.AI_AGENTS,
    // Integration Features
    FEATURE_KEYS.INTEGRATIONS_BASIC,
    FEATURE_KEYS.INTEGRATIONS_PREMIUM,
    FEATURE_KEYS.INTEGRATIONS_CUSTOM,
    FEATURE_KEYS.WEBHOOKS,
    FEATURE_KEYS.API_ACCESS,
    // Team Features
    FEATURE_KEYS.TEAM_COLLABORATION,
    FEATURE_KEYS.TEAM_ROLES,
    FEATURE_KEYS.TEAM_AUDIT_LOG,
    FEATURE_KEYS.SSO,
    // Analytics
    FEATURE_KEYS.ANALYTICS_BASIC,
    FEATURE_KEYS.ANALYTICS_ADVANCED,
    FEATURE_KEYS.CUSTOM_REPORTS,
    FEATURE_KEYS.EXPORT_DATA,
    // Branding
    FEATURE_KEYS.CUSTOM_BRANDING,
    FEATURE_KEYS.WHITE_LABEL,
    // Support
    FEATURE_KEYS.SUPPORT_EMAIL,
    FEATURE_KEYS.SUPPORT_PRIORITY,
    FEATURE_KEYS.SUPPORT_DEDICATED,
  ],
  limits: ENTERPRISE_LIMITS,
  ctaText: 'Contact Sales',
  ctaVariant: 'outline',
}

// =============================================================================
// TIER REGISTRY
// =============================================================================

/**
 * All tier configurations indexed by tier name
 */
export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  [SUBSCRIPTION_TIERS.FREE]: FREE_TIER,
  [SUBSCRIPTION_TIERS.PRO]: PRO_TIER,
  [SUBSCRIPTION_TIERS.ENTERPRISE]: ENTERPRISE_TIER,
}

/**
 * Ordered list of tiers for display
 */
export const TIER_ORDER: SubscriptionTier[] = [
  SUBSCRIPTION_TIERS.FREE,
  SUBSCRIPTION_TIERS.PRO,
  SUBSCRIPTION_TIERS.ENTERPRISE,
]

/**
 * Get tier config by tier name
 */
export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return TIER_CONFIGS[tier]
}

/**
 * Get all tier configs in order
 */
export function getAllTierConfigs(): TierConfig[] {
  return TIER_ORDER.map((tier) => TIER_CONFIGS[tier])
}

/**
 * Get tier by index (0 = Free, 1 = Pro, 2 = Enterprise)
 */
export function getTierByIndex(index: number): SubscriptionTier | null {
  return TIER_ORDER[index] ?? null
}

/**
 * Get tier index
 */
export function getTierIndex(tier: SubscriptionTier): number {
  return TIER_ORDER.indexOf(tier)
}

/**
 * Check if tier A is higher than tier B
 */
export function isTierHigher(tierA: SubscriptionTier, tierB: SubscriptionTier): boolean {
  return getTierIndex(tierA) > getTierIndex(tierB)
}

/**
 * Check if tier A is at least tier B
 */
export function isTierAtLeast(tierA: SubscriptionTier, tierB: SubscriptionTier): boolean {
  return getTierIndex(tierA) >= getTierIndex(tierB)
}

/**
 * Get minimum tier required for a feature
 */
export function getMinimumTierForFeature(feature: string): SubscriptionTier {
  for (const tier of TIER_ORDER) {
    const config = TIER_CONFIGS[tier]
    if (config.features.includes(feature as never)) {
      return tier
    }
  }
  return SUBSCRIPTION_TIERS.ENTERPRISE
}

/**
 * Format limit value for display
 */
export function formatLimitValue(value: number | null): string {
  if (value === null) {
    return 'Unlimited'
  }
  return value.toLocaleString()
}

/**
 * Format price for display
 */
export function formatTierPrice(pricing: TierPricing, interval: 'monthly' | 'annual' = 'monthly'): string {
  if (pricing.isCustomPricing) {
    return 'Custom'
  }

  const price = interval === 'monthly' ? pricing.monthly : pricing.annual
  if (price === 0) {
    return 'Free'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: pricing.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Get monthly equivalent price for annual billing
 */
export function getMonthlyEquivalent(pricing: TierPricing): number {
  if (pricing.isCustomPricing || pricing.annual === 0) {
    return pricing.monthly
  }
  return Math.round((pricing.annual / 12) * 100) / 100
}

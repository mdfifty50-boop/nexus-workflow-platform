/**
 * Subscription Tier Types
 *
 * Type definitions for the subscription tier system.
 * Uses const objects instead of enums per TypeScript rules.
 */

// =============================================================================
// SUBSCRIPTION TIER CONSTANTS
// =============================================================================

/**
 * Available subscription tiers as const object
 */
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[keyof typeof SUBSCRIPTION_TIERS]

/**
 * Billing intervals
 */
export const BILLING_INTERVALS = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
} as const

export type BillingInterval = (typeof BILLING_INTERVALS)[keyof typeof BILLING_INTERVALS]

/**
 * Support levels available
 */
export const SUPPORT_LEVELS = {
  COMMUNITY: 'community',
  EMAIL: 'email',
  PRIORITY: 'priority',
  DEDICATED: 'dedicated',
} as const

export type SupportLevel = (typeof SUPPORT_LEVELS)[keyof typeof SUPPORT_LEVELS]

// =============================================================================
// FEATURE DEFINITIONS
// =============================================================================

/**
 * Available features that can be gated by tier
 */
export const FEATURE_KEYS = {
  // AI Features
  AI_SUGGESTIONS_BASIC: 'ai_suggestions_basic',
  AI_SUGGESTIONS_ADVANCED: 'ai_suggestions_advanced',
  AI_SUGGESTIONS_CUSTOM: 'ai_suggestions_custom',
  AI_AGENTS: 'ai_agents',

  // Workflow Features
  WORKFLOW_BUILDER: 'workflow_builder',
  WORKFLOW_TEMPLATES: 'workflow_templates',
  WORKFLOW_VERSIONING: 'workflow_versioning',
  WORKFLOW_BRANCHING: 'workflow_branching',
  WORKFLOW_SCHEDULING: 'workflow_scheduling',
  WORKFLOW_PRIORITY_QUEUE: 'workflow_priority_queue',

  // Integration Features
  INTEGRATIONS_BASIC: 'integrations_basic',
  INTEGRATIONS_PREMIUM: 'integrations_premium',
  INTEGRATIONS_CUSTOM: 'integrations_custom',
  WEBHOOKS: 'webhooks',
  API_ACCESS: 'api_access',

  // Team Features
  TEAM_COLLABORATION: 'team_collaboration',
  TEAM_ROLES: 'team_roles',
  TEAM_AUDIT_LOG: 'team_audit_log',
  SSO: 'sso',

  // Analytics & Reporting
  ANALYTICS_BASIC: 'analytics_basic',
  ANALYTICS_ADVANCED: 'analytics_advanced',
  CUSTOM_REPORTS: 'custom_reports',
  EXPORT_DATA: 'export_data',

  // Branding & Customization
  CUSTOM_BRANDING: 'custom_branding',
  WHITE_LABEL: 'white_label',

  // Support
  SUPPORT_COMMUNITY: 'support_community',
  SUPPORT_EMAIL: 'support_email',
  SUPPORT_PRIORITY: 'support_priority',
  SUPPORT_DEDICATED: 'support_dedicated',
} as const

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS]

// =============================================================================
// LIMIT DEFINITIONS
// =============================================================================

/**
 * Limit types that can be tracked
 */
export const LIMIT_TYPES = {
  WORKFLOWS_PER_MONTH: 'workflows_per_month',
  WORKFLOW_NODES: 'workflow_nodes',
  INTEGRATIONS: 'integrations',
  TEAM_MEMBERS: 'team_members',
  STORAGE_GB: 'storage_gb',
  API_CALLS_PER_HOUR: 'api_calls_per_hour',
  API_CALLS_PER_DAY: 'api_calls_per_day',
  EXECUTION_HISTORY_DAYS: 'execution_history_days',
  WEBHOOK_ENDPOINTS: 'webhook_endpoints',
  CUSTOM_AGENTS: 'custom_agents',
} as const

export type LimitType = (typeof LIMIT_TYPES)[keyof typeof LIMIT_TYPES]

// =============================================================================
// CONFIGURATION INTERFACES
// =============================================================================

/**
 * Pricing configuration for a tier
 */
export interface TierPricing {
  monthly: number
  annual: number
  annualSavingsPercent: number
  currency: string
  isCustomPricing: boolean
}

/**
 * Feature configuration
 */
export interface FeatureDefinition {
  key: FeatureKey
  name: string
  description: string
  tier: SubscriptionTier
  enabled: boolean
}

/**
 * Limit configuration with value
 */
export interface LimitDefinition {
  type: LimitType
  name: string
  description: string
  value: number | null // null = unlimited
  displayValue: string
}

/**
 * Complete tier configuration
 */
export interface TierConfig {
  tier: SubscriptionTier
  name: string
  tagline: string
  description: string
  pricing: TierPricing
  supportLevel: SupportLevel
  features: FeatureKey[]
  limits: Record<LimitType, number | null>
  popular?: boolean
  badge?: string
  ctaText: string
  ctaVariant: 'default' | 'primary' | 'outline'
}

// =============================================================================
// COMPARISON INTERFACES
// =============================================================================

/**
 * Feature comparison across tiers
 */
export interface FeatureComparison {
  key: FeatureKey
  name: string
  description: string
  free: boolean | string
  pro: boolean | string
  enterprise: boolean | string
}

/**
 * Limit comparison across tiers
 */
export interface LimitComparison {
  type: LimitType
  name: string
  free: string
  pro: string
  enterprise: string
}

/**
 * Complete tier comparison
 */
export interface TierComparison {
  features: FeatureComparison[]
  limits: LimitComparison[]
  pricing: {
    free: TierPricing
    pro: TierPricing
    enterprise: TierPricing
  }
}

// =============================================================================
// UPGRADE INTERFACES
// =============================================================================

/**
 * Upgrade option presented to users
 */
export interface UpgradeOption {
  fromTier: SubscriptionTier
  toTier: SubscriptionTier
  name: string
  description: string
  keyBenefits: string[]
  priceDifference: number
  percentageIncrease: number
  recommended: boolean
}

/**
 * Upgrade prompt configuration
 */
export interface UpgradePromptConfig {
  feature?: FeatureKey
  limit?: LimitType
  currentUsage?: number
  title: string
  message: string
  upgradeOptions: UpgradeOption[]
  showComparison: boolean
}

// =============================================================================
// USER SUBSCRIPTION STATE
// =============================================================================

/**
 * Current user subscription state
 */
export interface UserSubscriptionState {
  userId: string
  tier: SubscriptionTier
  billingInterval: BillingInterval
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEndsAt?: Date
  usage: Record<LimitType, number>
}

/**
 * Feature access result
 */
export interface FeatureAccessResult {
  hasAccess: boolean
  feature: FeatureKey
  tier: SubscriptionTier
  requiredTier?: SubscriptionTier
  upgradeRequired: boolean
}

/**
 * Limit check result
 */
export interface LimitCheckResult {
  withinLimit: boolean
  limitType: LimitType
  currentUsage: number
  limit: number | null
  remaining: number | null
  percentUsed: number
  upgradeRequired: boolean
}

// =============================================================================
// CONTEXT TYPES
// =============================================================================

/**
 * Tier context value
 */
export interface TierContextValue {
  // Current state
  tier: SubscriptionTier
  subscription: UserSubscriptionState | null
  isLoading: boolean
  error: string | null

  // Feature access
  hasFeature: (feature: FeatureKey) => boolean
  getFeatureAccess: (feature: FeatureKey) => FeatureAccessResult

  // Limit checking
  getLimit: (limitType: LimitType) => number | null
  isWithinLimit: (limitType: LimitType, currentUsage?: number) => LimitCheckResult
  getUsage: (limitType: LimitType) => number

  // Tier info
  getTierConfig: (tier?: SubscriptionTier) => TierConfig
  getUpgradeOptions: () => UpgradeOption[]
  getTierComparison: () => TierComparison

  // Actions
  refreshSubscription: () => Promise<void>
}

/**
 * Tier provider props
 */
export interface TierProviderProps {
  children: React.ReactNode
  userId?: string
  initialTier?: SubscriptionTier
  onUpgradeClick?: (option: UpgradeOption) => void
}

/**
 * Subscription Tier System
 *
 * Comprehensive subscription management for Nexus with three tiers:
 * - Free: Basic features, limited usage ($0/month)
 * - Pro: Full features, higher limits ($79/month or $790/year)
 * - Enterprise: Unlimited, custom features (Custom pricing)
 *
 * Usage:
 *
 * 1. Wrap your app with TierProvider:
 *    ```tsx
 *    import { TierProvider } from '@/lib/subscription'
 *
 *    function App() {
 *      return (
 *        <TierProvider userId={user.id}>
 *          <YourApp />
 *        </TierProvider>
 *      )
 *    }
 *    ```
 *
 * 2. Check feature access:
 *    ```tsx
 *    import { useFeatureAccess, FEATURE_KEYS } from '@/lib/subscription'
 *
 *    function MyComponent() {
 *      const { hasAccess } = useFeatureAccess(FEATURE_KEYS.AI_AGENTS)
 *      if (!hasAccess) return <UpgradePrompt feature={FEATURE_KEYS.AI_AGENTS} />
 *      return <AIAgentsFeature />
 *    }
 *    ```
 *
 * 3. Check limits:
 *    ```tsx
 *    import { useLimit, LIMIT_TYPES } from '@/lib/subscription'
 *
 *    function WorkflowCreator() {
 *      const { withinLimit, remaining } = useLimit(LIMIT_TYPES.WORKFLOWS_PER_MONTH)
 *      if (!withinLimit) return <UpgradePrompt limit={LIMIT_TYPES.WORKFLOWS_PER_MONTH} />
 *      return <CreateWorkflowButton />
 *    }
 *    ```
 *
 * 4. Use gate components:
 *    ```tsx
 *    import { FeatureGate, LimitGate, FEATURE_KEYS, LIMIT_TYPES } from '@/lib/subscription'
 *
 *    <FeatureGate feature={FEATURE_KEYS.WORKFLOW_VERSIONING}>
 *      <VersionHistoryPanel />
 *    </FeatureGate>
 *
 *    <LimitGate limit={LIMIT_TYPES.INTEGRATIONS} currentUsage={5}>
 *      <AddIntegrationButton />
 *    </LimitGate>
 *    ```
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Core types
  SubscriptionTier,
  BillingInterval,
  SupportLevel,
  FeatureKey,
  LimitType,

  // Configuration types
  TierPricing,
  FeatureDefinition,
  LimitDefinition,
  TierConfig,

  // Comparison types
  FeatureComparison,
  LimitComparison,
  TierComparison,

  // Upgrade types
  UpgradeOption,
  UpgradePromptConfig,

  // State types
  UserSubscriptionState,
  FeatureAccessResult,
  LimitCheckResult,

  // Context types
  TierContextValue,
  TierProviderProps,
} from './tier-types'

// =============================================================================
// CONSTANT EXPORTS
// =============================================================================

export {
  // Tier constants
  SUBSCRIPTION_TIERS,
  BILLING_INTERVALS,
  SUPPORT_LEVELS,

  // Feature keys
  FEATURE_KEYS,

  // Limit types
  LIMIT_TYPES,
} from './tier-types'

// =============================================================================
// TIER DEFINITION EXPORTS
// =============================================================================

export {
  // Individual tier configs
  FREE_TIER,
  PRO_TIER,
  ENTERPRISE_TIER,

  // Config registry
  TIER_CONFIGS,
  TIER_ORDER,

  // Utility functions
  getTierConfig,
  getAllTierConfigs,
  getTierByIndex,
  getTierIndex,
  isTierHigher,
  isTierAtLeast,
  getMinimumTierForFeature,
  formatLimitValue,
  formatTierPrice,
  getMonthlyEquivalent,
} from './tier-definitions'

// =============================================================================
// FEATURE EXPORTS
// =============================================================================

export {
  // Metadata functions
  getFeatureMetadata,
  getLimitMetadata,

  // Access checks
  tierHasFeature,
  getFeatureAvailability,

  // Comparison generators
  generateFeatureComparison,
  generateLimitComparison,
  generateTierComparison,

  // Feature groups
  getFeaturesByCategory,
  getCategoryDisplayName,

  // Upgrade helpers
  getUpgradeFeatures,
  getUpgradeLimitImprovements,
} from './tier-features'

// =============================================================================
// SERVICE EXPORTS
// =============================================================================

export {
  // Service object
  tierService,

  // Individual service functions
  getCurrentTier,
  getUserSubscriptionState,
  canAccessFeature,
  getFeatureAccess,
  checkMultipleFeatures,
  getFeatureLimits,
  getLimit,
  isWithinLimit,
  checkMultipleLimits,
  getUsage,
  getUsageSummary,
  getUpgradeOptions,
  getUpgradeOptionsForTier,
  getTierComparison,
  getTierConfigByName,
  canDowngrade,
  incrementUsage,
  resetUsage,
  clearSubscriptionCache,
  clearAllSubscriptionCache,
} from './tier-service'

// =============================================================================
// CONTEXT & COMPONENT EXPORTS
// =============================================================================

export {
  // Context
  TierContext,
  TierProvider,

  // Main hook
  useTier,

  // Feature hooks
  useFeatureAccess,
  useHasFeature,

  // Limit hooks
  useLimit,
  useUsage,

  // Tier hooks
  useCurrentTier,
  useUpgradeOptions,

  // Components
  UpgradePrompt,
  FeatureGate,
  LimitGate,
} from './tier-context'

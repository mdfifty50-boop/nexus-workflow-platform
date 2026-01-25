/**
 * Tier Features Configuration
 *
 * Defines the feature matrix across all subscription tiers.
 * Each feature has a name, description, and availability per tier.
 *
 * Feature categories:
 * - AI Suggestions & Agents
 * - Workflow Capabilities
 * - Integrations & APIs
 * - Team & Collaboration
 * - Analytics & Reporting
 * - Branding & Customization
 * - Support
 */

import type {
  FeatureKey,
  FeatureComparison,
  LimitComparison,
  TierComparison,
  LimitType,
} from './tier-types'

import {
  SUBSCRIPTION_TIERS,
  FEATURE_KEYS,
  LIMIT_TYPES,
} from './tier-types'

import { TIER_CONFIGS } from './tier-definitions'

// =============================================================================
// FEATURE METADATA
// =============================================================================

interface FeatureMetadata {
  name: string
  description: string
  category: 'ai' | 'workflow' | 'integration' | 'team' | 'analytics' | 'branding' | 'support'
}

const FEATURE_METADATA: Record<FeatureKey, FeatureMetadata> = {
  // AI Features
  [FEATURE_KEYS.AI_SUGGESTIONS_BASIC]: {
    name: 'Basic AI Suggestions',
    description: 'AI-powered workflow recommendations based on your usage patterns',
    category: 'ai',
  },
  [FEATURE_KEYS.AI_SUGGESTIONS_ADVANCED]: {
    name: 'Advanced AI Suggestions',
    description: 'Proactive optimization suggestions and predictive analytics',
    category: 'ai',
  },
  [FEATURE_KEYS.AI_SUGGESTIONS_CUSTOM]: {
    name: 'Custom AI Models',
    description: 'Train custom AI models on your organization\'s data',
    category: 'ai',
  },
  [FEATURE_KEYS.AI_AGENTS]: {
    name: 'AI Agents',
    description: 'Create autonomous AI agents to handle complex workflows',
    category: 'ai',
  },

  // Workflow Features
  [FEATURE_KEYS.WORKFLOW_BUILDER]: {
    name: 'Visual Workflow Builder',
    description: 'Drag-and-drop interface to create workflows visually',
    category: 'workflow',
  },
  [FEATURE_KEYS.WORKFLOW_TEMPLATES]: {
    name: 'Workflow Templates',
    description: 'Pre-built templates to get started quickly',
    category: 'workflow',
  },
  [FEATURE_KEYS.WORKFLOW_VERSIONING]: {
    name: 'Version Control',
    description: 'Track changes and rollback to previous versions',
    category: 'workflow',
  },
  [FEATURE_KEYS.WORKFLOW_BRANCHING]: {
    name: 'Conditional Branching',
    description: 'Create complex decision trees in your workflows',
    category: 'workflow',
  },
  [FEATURE_KEYS.WORKFLOW_SCHEDULING]: {
    name: 'Scheduled Workflows',
    description: 'Run workflows on a schedule or with cron expressions',
    category: 'workflow',
  },
  [FEATURE_KEYS.WORKFLOW_PRIORITY_QUEUE]: {
    name: 'Priority Execution Queue',
    description: 'Your workflows execute with higher priority',
    category: 'workflow',
  },

  // Integration Features
  [FEATURE_KEYS.INTEGRATIONS_BASIC]: {
    name: 'Basic Integrations',
    description: 'Connect to popular apps like Gmail, Slack, and Sheets',
    category: 'integration',
  },
  [FEATURE_KEYS.INTEGRATIONS_PREMIUM]: {
    name: 'Premium Integrations',
    description: 'Access to Salesforce, HubSpot, and enterprise apps',
    category: 'integration',
  },
  [FEATURE_KEYS.INTEGRATIONS_CUSTOM]: {
    name: 'Custom Integrations',
    description: 'Build custom integrations for your internal systems',
    category: 'integration',
  },
  [FEATURE_KEYS.WEBHOOKS]: {
    name: 'Webhooks',
    description: 'Trigger workflows from external events',
    category: 'integration',
  },
  [FEATURE_KEYS.API_ACCESS]: {
    name: 'API Access',
    description: 'Full REST API access for programmatic control',
    category: 'integration',
  },

  // Team Features
  [FEATURE_KEYS.TEAM_COLLABORATION]: {
    name: 'Team Collaboration',
    description: 'Share and collaborate on workflows with your team',
    category: 'team',
  },
  [FEATURE_KEYS.TEAM_ROLES]: {
    name: 'Role-Based Access',
    description: 'Assign roles and permissions to team members',
    category: 'team',
  },
  [FEATURE_KEYS.TEAM_AUDIT_LOG]: {
    name: 'Audit Logs',
    description: 'Detailed logs of all team actions for compliance',
    category: 'team',
  },
  [FEATURE_KEYS.SSO]: {
    name: 'Single Sign-On (SSO)',
    description: 'SAML/OIDC integration for enterprise identity providers',
    category: 'team',
  },

  // Analytics Features
  [FEATURE_KEYS.ANALYTICS_BASIC]: {
    name: 'Basic Analytics',
    description: 'View execution counts and success rates',
    category: 'analytics',
  },
  [FEATURE_KEYS.ANALYTICS_ADVANCED]: {
    name: 'Advanced Analytics',
    description: 'Deep insights, trends, and performance metrics',
    category: 'analytics',
  },
  [FEATURE_KEYS.CUSTOM_REPORTS]: {
    name: 'Custom Reports',
    description: 'Build and schedule custom reports',
    category: 'analytics',
  },
  [FEATURE_KEYS.EXPORT_DATA]: {
    name: 'Data Export',
    description: 'Export data in CSV, JSON, or PDF format',
    category: 'analytics',
  },

  // Branding Features
  [FEATURE_KEYS.CUSTOM_BRANDING]: {
    name: 'Custom Branding',
    description: 'Add your logo and colors to the interface',
    category: 'branding',
  },
  [FEATURE_KEYS.WHITE_LABEL]: {
    name: 'White Label',
    description: 'Fully rebrand the platform for your clients',
    category: 'branding',
  },

  // Support Features
  [FEATURE_KEYS.SUPPORT_COMMUNITY]: {
    name: 'Community Support',
    description: 'Access to community forums and documentation',
    category: 'support',
  },
  [FEATURE_KEYS.SUPPORT_EMAIL]: {
    name: 'Email Support',
    description: 'Direct email support with 24-hour response time',
    category: 'support',
  },
  [FEATURE_KEYS.SUPPORT_PRIORITY]: {
    name: 'Priority Support',
    description: '4-hour response time with dedicated queue',
    category: 'support',
  },
  [FEATURE_KEYS.SUPPORT_DEDICATED]: {
    name: 'Dedicated Support',
    description: 'Personal account manager and 1-hour response time',
    category: 'support',
  },
}

// =============================================================================
// LIMIT METADATA
// =============================================================================

interface LimitMetadata {
  name: string
  description: string
  unit?: string
}

const LIMIT_METADATA: Record<LimitType, LimitMetadata> = {
  [LIMIT_TYPES.WORKFLOWS_PER_MONTH]: {
    name: 'Workflows per Month',
    description: 'Number of workflow executions allowed per month',
    unit: 'executions',
  },
  [LIMIT_TYPES.WORKFLOW_NODES]: {
    name: 'Nodes per Workflow',
    description: 'Maximum number of nodes (steps) in a single workflow',
    unit: 'nodes',
  },
  [LIMIT_TYPES.INTEGRATIONS]: {
    name: 'Connected Integrations',
    description: 'Number of third-party apps you can connect',
    unit: 'apps',
  },
  [LIMIT_TYPES.TEAM_MEMBERS]: {
    name: 'Team Members',
    description: 'Number of users in your workspace',
    unit: 'users',
  },
  [LIMIT_TYPES.STORAGE_GB]: {
    name: 'Storage',
    description: 'Storage for workflow data and attachments',
    unit: 'GB',
  },
  [LIMIT_TYPES.API_CALLS_PER_HOUR]: {
    name: 'API Calls per Hour',
    description: 'Rate limit for API requests per hour',
    unit: 'calls/hour',
  },
  [LIMIT_TYPES.API_CALLS_PER_DAY]: {
    name: 'API Calls per Day',
    description: 'Rate limit for API requests per day',
    unit: 'calls/day',
  },
  [LIMIT_TYPES.EXECUTION_HISTORY_DAYS]: {
    name: 'Execution History',
    description: 'How long execution logs are retained',
    unit: 'days',
  },
  [LIMIT_TYPES.WEBHOOK_ENDPOINTS]: {
    name: 'Webhook Endpoints',
    description: 'Number of incoming webhook URLs',
    unit: 'endpoints',
  },
  [LIMIT_TYPES.CUSTOM_AGENTS]: {
    name: 'Custom AI Agents',
    description: 'Number of custom AI agents you can create',
    unit: 'agents',
  },
}

// =============================================================================
// FEATURE ACCESS FUNCTIONS
// =============================================================================

/**
 * Get feature metadata by key
 */
export function getFeatureMetadata(feature: FeatureKey): FeatureMetadata {
  return FEATURE_METADATA[feature]
}

/**
 * Get limit metadata by type
 */
export function getLimitMetadata(limitType: LimitType): LimitMetadata {
  return LIMIT_METADATA[limitType]
}

/**
 * Check if a tier has a specific feature
 */
export function tierHasFeature(tier: string, feature: FeatureKey): boolean {
  const config = TIER_CONFIGS[tier as keyof typeof TIER_CONFIGS]
  if (!config) return false
  return config.features.includes(feature)
}

/**
 * Get feature availability display value for a tier
 */
export function getFeatureAvailability(tier: string, feature: FeatureKey): boolean | string {
  const config = TIER_CONFIGS[tier as keyof typeof TIER_CONFIGS]
  if (!config) return false

  // Check if feature is in the tier's feature list
  const hasFeature = config.features.includes(feature)

  // Special display values for AI features
  if (feature === FEATURE_KEYS.AI_SUGGESTIONS_BASIC && hasFeature) {
    if (tier === SUBSCRIPTION_TIERS.FREE) return 'Basic'
    return true
  }

  if (feature === FEATURE_KEYS.AI_SUGGESTIONS_ADVANCED && hasFeature) {
    return 'Advanced'
  }

  if (feature === FEATURE_KEYS.AI_SUGGESTIONS_CUSTOM && hasFeature) {
    return 'Custom Models'
  }

  return hasFeature
}

/**
 * Get limit value for display
 */
function getLimitDisplayValue(value: number | null, limitType: LimitType): string {
  if (value === null) return 'Unlimited'

  // Void unused variable to satisfy TypeScript
  void LIMIT_METADATA[limitType]

  // Format based on limit type
  if (limitType === LIMIT_TYPES.STORAGE_GB) {
    return `${value} GB`
  }

  if (limitType === LIMIT_TYPES.EXECUTION_HISTORY_DAYS) {
    return `${value} days`
  }

  return value.toLocaleString()
}

// =============================================================================
// COMPARISON GENERATORS
// =============================================================================

/**
 * Generate feature comparison matrix
 */
export function generateFeatureComparison(): FeatureComparison[] {
  const features: FeatureComparison[] = []

  // Get all unique features across all tiers
  const allFeatures = new Set<FeatureKey>()
  Object.values(TIER_CONFIGS).forEach((config) => {
    config.features.forEach((f) => allFeatures.add(f))
  })

  // Build comparison for each feature
  allFeatures.forEach((feature) => {
    const metadata = FEATURE_METADATA[feature]
    features.push({
      key: feature,
      name: metadata.name,
      description: metadata.description,
      free: getFeatureAvailability(SUBSCRIPTION_TIERS.FREE, feature),
      pro: getFeatureAvailability(SUBSCRIPTION_TIERS.PRO, feature),
      enterprise: getFeatureAvailability(SUBSCRIPTION_TIERS.ENTERPRISE, feature),
    })
  })

  return features
}

/**
 * Generate limit comparison matrix
 */
export function generateLimitComparison(): LimitComparison[] {
  const limits: LimitComparison[] = []

  Object.values(LIMIT_TYPES).forEach((limitType) => {
    const metadata = LIMIT_METADATA[limitType]
    const freeTier = TIER_CONFIGS[SUBSCRIPTION_TIERS.FREE]
    const proTier = TIER_CONFIGS[SUBSCRIPTION_TIERS.PRO]
    const enterpriseTier = TIER_CONFIGS[SUBSCRIPTION_TIERS.ENTERPRISE]

    limits.push({
      type: limitType,
      name: metadata.name,
      free: getLimitDisplayValue(freeTier.limits[limitType], limitType),
      pro: getLimitDisplayValue(proTier.limits[limitType], limitType),
      enterprise: getLimitDisplayValue(enterpriseTier.limits[limitType], limitType),
    })
  })

  return limits
}

/**
 * Generate complete tier comparison
 */
export function generateTierComparison(): TierComparison {
  return {
    features: generateFeatureComparison(),
    limits: generateLimitComparison(),
    pricing: {
      free: TIER_CONFIGS[SUBSCRIPTION_TIERS.FREE].pricing,
      pro: TIER_CONFIGS[SUBSCRIPTION_TIERS.PRO].pricing,
      enterprise: TIER_CONFIGS[SUBSCRIPTION_TIERS.ENTERPRISE].pricing,
    },
  }
}

// =============================================================================
// FEATURE GROUPS
// =============================================================================

type FeatureCategory = 'ai' | 'workflow' | 'integration' | 'team' | 'analytics' | 'branding' | 'support'

/**
 * Get features grouped by category
 */
export function getFeaturesByCategory(): Record<FeatureCategory, FeatureComparison[]> {
  const comparison = generateFeatureComparison()
  const grouped: Record<FeatureCategory, FeatureComparison[]> = {
    ai: [],
    workflow: [],
    integration: [],
    team: [],
    analytics: [],
    branding: [],
    support: [],
  }

  comparison.forEach((feature) => {
    const metadata = FEATURE_METADATA[feature.key]
    grouped[metadata.category].push(feature)
  })

  return grouped
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: FeatureCategory): string {
  const names: Record<FeatureCategory, string> = {
    ai: 'AI & Intelligence',
    workflow: 'Workflow Capabilities',
    integration: 'Integrations & APIs',
    team: 'Team & Collaboration',
    analytics: 'Analytics & Reporting',
    branding: 'Branding & Customization',
    support: 'Support',
  }
  return names[category]
}

// =============================================================================
// UPGRADE RECOMMENDATIONS
// =============================================================================

/**
 * Get features user would gain by upgrading from one tier to another
 */
export function getUpgradeFeatures(fromTier: string, toTier: string): FeatureKey[] {
  const fromConfig = TIER_CONFIGS[fromTier as keyof typeof TIER_CONFIGS]
  const toConfig = TIER_CONFIGS[toTier as keyof typeof TIER_CONFIGS]

  if (!fromConfig || !toConfig) return []

  // Get features in toTier that aren't in fromTier
  return toConfig.features.filter((f) => !fromConfig.features.includes(f))
}

/**
 * Get limit improvements when upgrading
 */
export function getUpgradeLimitImprovements(
  fromTier: string,
  toTier: string
): Array<{ limitType: LimitType; from: string; to: string; improvement: string }> {
  const fromConfig = TIER_CONFIGS[fromTier as keyof typeof TIER_CONFIGS]
  const toConfig = TIER_CONFIGS[toTier as keyof typeof TIER_CONFIGS]

  if (!fromConfig || !toConfig) return []

  const improvements: Array<{
    limitType: LimitType
    from: string
    to: string
    improvement: string
  }> = []

  Object.values(LIMIT_TYPES).forEach((limitType) => {
    const fromValue = fromConfig.limits[limitType]
    const toValue = toConfig.limits[limitType]

    // Skip if both are the same
    if (fromValue === toValue) return

    const fromDisplay = getLimitDisplayValue(fromValue, limitType)
    const toDisplay = getLimitDisplayValue(toValue, limitType)

    let improvement: string
    if (toValue === null) {
      improvement = 'Unlimited'
    } else if (fromValue === null) {
      improvement = 'Same'
    } else {
      const multiplier = Math.round(toValue / fromValue)
      improvement = `${multiplier}x more`
    }

    improvements.push({
      limitType,
      from: fromDisplay,
      to: toDisplay,
      improvement,
    })
  })

  return improvements
}

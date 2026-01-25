/**
 * Template Recommendation Types
 *
 * Type definitions for the smart template recommendations system.
 * Uses const objects with type aliases instead of enums per TypeScript requirements.
 */

// ============================================================================
// Constants (Using const objects instead of enums)
// ============================================================================

/**
 * Business industries supported by the recommendation system
 */
export const BUSINESS_INDUSTRIES = {
  ECOMMERCE: 'ecommerce',
  SAAS: 'saas',
  PROFESSIONAL_SERVICES: 'professional_services',
  MARKETING_AGENCY: 'marketing_agency',
  REAL_ESTATE: 'real_estate',
  HEALTHCARE: 'healthcare',
  EDUCATION: 'education',
  FINANCE: 'finance',
  OTHER: 'other',
} as const

export type BusinessIndustry = typeof BUSINESS_INDUSTRIES[keyof typeof BUSINESS_INDUSTRIES]

/**
 * Business sizes
 */
export const BUSINESS_SIZES = {
  SOLO: 'solo',
  SMALL: 'small',
  MEDIUM: 'medium',
  ENTERPRISE: 'enterprise',
} as const

export type BusinessSize = typeof BUSINESS_SIZES[keyof typeof BUSINESS_SIZES]

/**
 * Template complexity levels
 */
export const COMPLEXITY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const

export type ComplexityLevel = typeof COMPLEXITY_LEVELS[keyof typeof COMPLEXITY_LEVELS]

/**
 * Recommendation categories for grouping templates
 */
export const RECOMMENDATION_CATEGORIES = {
  GETTING_STARTED: 'getting_started',
  INDUSTRY_SPECIFIC: 'industry_specific',
  CONNECTED_APPS: 'connected_apps',
  QUICK_WINS: 'quick_wins',
  ADVANCED_AUTOMATION: 'advanced_automation',
  STAFF_PICKS: 'staff_picks',
} as const

export type RecommendationCategory = typeof RECOMMENDATION_CATEGORIES[keyof typeof RECOMMENDATION_CATEGORIES]

/**
 * User goals for matching templates
 */
export const USER_GOALS = {
  SAVE_TIME: 'save_time',
  REDUCE_ERRORS: 'reduce_errors',
  IMPROVE_COMMUNICATION: 'improve_communication',
  INCREASE_REVENUE: 'increase_revenue',
  BETTER_INSIGHTS: 'better_insights',
  CUSTOMER_SATISFACTION: 'customer_satisfaction',
  TEAM_PRODUCTIVITY: 'team_productivity',
} as const

export type UserGoal = typeof USER_GOALS[keyof typeof USER_GOALS]

// ============================================================================
// Business Profile Types
// ============================================================================

/**
 * User's business profile for personalized recommendations
 */
export interface BusinessProfile {
  /** Business industry/vertical */
  industry: BusinessIndustry | null
  /** Business size */
  size: BusinessSize | null
  /** User's primary goals */
  goals: UserGoal[]
  /** Connected integration IDs */
  connectedApps: string[]
  /** Has prior automation experience */
  hasAutomationExperience: boolean
}

// ============================================================================
// Template Types
// ============================================================================

/**
 * Workflow step preview for template visualization
 */
export interface WorkflowStepPreview {
  id: string
  name: string
  description: string
  icon?: string
  appId?: string
}

/**
 * Template metadata for display
 */
export interface TemplateMetadata {
  /** Unique template identifier */
  id: string
  /** Template display name */
  name: string
  /** Description of what the template does */
  description: string
  /** Category (e-commerce, marketing, support, etc.) */
  category: string
  /** Source platform (shopify, woocommerce, custom) */
  source: string
  /** Complexity level */
  complexity: ComplexityLevel
  /** Required app/integration IDs */
  requiredApps: string[]
  /** Estimated setup time (e.g., "5 min") */
  estimatedSetupTime: string
  /** Estimated time saved per week (e.g., "2-3 hours/week") */
  estimatedTimeSaved: string
  /** Tags for filtering and searching */
  tags: string[]
  /** Preview of workflow steps */
  steps: WorkflowStepPreview[]
  /** Industries this template is best suited for */
  targetIndustries: BusinessIndustry[]
  /** Goals this template helps achieve */
  targetGoals: UserGoal[]
  /** User rating (0-5) */
  rating: number
  /** Number of users using this template */
  usageCount: number
  /** Is this a staff-picked/featured template */
  isStaffPick: boolean
  /** Is this template new */
  isNew: boolean
  /** Preview image URL (optional) */
  previewImageUrl?: string
}

// ============================================================================
// Recommendation Types
// ============================================================================

/**
 * A single template recommendation with context
 */
export interface TemplateRecommendation {
  /** The template being recommended */
  template: TemplateMetadata
  /** Relevance score (0-100) */
  score: number
  /** Why this template is recommended */
  matchReason: string
  /** Recommendation category */
  category: RecommendationCategory
  /** Rank within category */
  rank: number
}

/**
 * A group of recommendations by category
 */
export interface RecommendationGroup {
  /** Category identifier */
  category: RecommendationCategory
  /** Display title */
  title: string
  /** Description of the category */
  description: string
  /** Recommendations in this group */
  recommendations: TemplateRecommendation[]
  /** Icon for the category */
  icon: string
}

/**
 * Complete recommendation result
 */
export interface RecommendationResult {
  /** All recommendation groups */
  groups: RecommendationGroup[]
  /** Total number of recommendations */
  totalCount: number
  /** User's business profile used for matching */
  profile: BusinessProfile
  /** Timestamp when recommendations were generated */
  generatedAt: number
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for TemplateRecommendationStep component
 */
export interface TemplateRecommendationStepProps {
  /** User's business profile */
  businessProfile: BusinessProfile
  /** Currently selected template ID */
  selectedTemplateId?: string | null
  /** Callback when a template is selected */
  onSelectTemplate: (templateId: string, template: TemplateMetadata) => void
  /** Callback when user wants to preview a template */
  onPreviewTemplate?: (templateId: string) => void
  /** Callback to skip and create custom workflow */
  onSkip?: () => void
  /** Callback to save template for later */
  onSaveForLater?: (templateId: string) => void
}

/**
 * Props for TemplatePreviewCard component
 */
export interface TemplatePreviewCardProps {
  /** Template data to display */
  template: TemplateMetadata
  /** Whether this template is selected */
  isSelected?: boolean
  /** Whether to show as recommended */
  isRecommended?: boolean
  /** Match reason text (why recommended) */
  matchReason?: string
  /** Callback when card is clicked */
  onClick: () => void
  /** Callback for preview button */
  onPreview?: () => void
  /** Callback for save for later */
  onSaveForLater?: () => void
  /** Show compact view */
  compact?: boolean
}

/**
 * Props for template preview modal
 */
export interface TemplatePreviewModalProps {
  /** Template to preview */
  template: TemplateMetadata | null
  /** Whether modal is open */
  isOpen: boolean
  /** Callback to close modal */
  onClose: () => void
  /** Callback to use template */
  onUseTemplate: (templateId: string) => void
  /** Callback to customize template */
  onCustomize?: (templateId: string) => void
}

// ============================================================================
// App/Integration Types
// ============================================================================

/**
 * App/integration info for display
 */
export interface AppInfo {
  id: string
  name: string
  icon: string
  color: string
  category: string
}

/**
 * Mapping of app IDs to their display info
 */
export const APP_INFO_MAP: Record<string, AppInfo> = {
  shopify: { id: 'shopify', name: 'Shopify', icon: 'ShoppingBag', color: '#96bf48', category: 'ecommerce' },
  woocommerce: { id: 'woocommerce', name: 'WooCommerce', icon: 'ShoppingCart', color: '#96588a', category: 'ecommerce' },
  stripe: { id: 'stripe', name: 'Stripe', icon: 'CreditCard', color: '#635bff', category: 'payments' },
  gmail: { id: 'gmail', name: 'Gmail', icon: 'Mail', color: '#ea4335', category: 'email' },
  slack: { id: 'slack', name: 'Slack', icon: 'MessageSquare', color: '#4a154b', category: 'communication' },
  hubspot: { id: 'hubspot', name: 'HubSpot', icon: 'Users', color: '#ff7a59', category: 'crm' },
  salesforce: { id: 'salesforce', name: 'Salesforce', icon: 'Cloud', color: '#00a1e0', category: 'crm' },
  zendesk: { id: 'zendesk', name: 'Zendesk', icon: 'HelpCircle', color: '#03363d', category: 'support' },
  intercom: { id: 'intercom', name: 'Intercom', icon: 'MessageCircle', color: '#6afdef', category: 'support' },
  notion: { id: 'notion', name: 'Notion', icon: 'FileText', color: '#000000', category: 'productivity' },
  googlesheets: { id: 'googlesheets', name: 'Google Sheets', icon: 'Table', color: '#0f9d58', category: 'productivity' },
  sheets: { id: 'sheets', name: 'Google Sheets', icon: 'Table', color: '#0f9d58', category: 'productivity' },
  quickbooks: { id: 'quickbooks', name: 'QuickBooks', icon: 'Calculator', color: '#2ca01c', category: 'accounting' },
  trello: { id: 'trello', name: 'Trello', icon: 'Columns', color: '#0052cc', category: 'productivity' },
  calendly: { id: 'calendly', name: 'Calendly', icon: 'Calendar', color: '#006bff', category: 'scheduling' },
  calendar: { id: 'calendar', name: 'Google Calendar', icon: 'Calendar', color: '#4285f4', category: 'scheduling' },
}

// ============================================================================
// Category Display Info
// ============================================================================

/**
 * Display info for recommendation categories
 */
export const CATEGORY_DISPLAY_INFO: Record<RecommendationCategory, { title: string; description: string; icon: string }> = {
  [RECOMMENDATION_CATEGORIES.GETTING_STARTED]: {
    title: 'Getting Started',
    description: 'Perfect for beginners - quick to set up and easy to understand',
    icon: 'Rocket',
  },
  [RECOMMENDATION_CATEGORIES.INDUSTRY_SPECIFIC]: {
    title: 'Popular in Your Industry',
    description: 'Templates tailored for your business type',
    icon: 'Building',
  },
  [RECOMMENDATION_CATEGORIES.CONNECTED_APPS]: {
    title: 'Using Your Connected Apps',
    description: 'Ready to use with the apps you\'ve already connected',
    icon: 'Link',
  },
  [RECOMMENDATION_CATEGORIES.QUICK_WINS]: {
    title: 'Quick Wins',
    description: 'Start saving time immediately with these automations',
    icon: 'Zap',
  },
  [RECOMMENDATION_CATEGORIES.ADVANCED_AUTOMATION]: {
    title: 'Advanced Automations',
    description: 'Complex workflows for maximum impact',
    icon: 'Settings',
  },
  [RECOMMENDATION_CATEGORIES.STAFF_PICKS]: {
    title: 'Staff Picks',
    description: 'Hand-picked templates recommended by our team',
    icon: 'Star',
  },
}

// ============================================================================
// Complexity Display Info
// ============================================================================

/**
 * Display info for complexity levels
 */
export const COMPLEXITY_DISPLAY_INFO: Record<ComplexityLevel, { label: string; color: string; bgColor: string; borderColor: string }> = {
  [COMPLEXITY_LEVELS.BEGINNER]: {
    label: 'Beginner',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
  },
  [COMPLEXITY_LEVELS.INTERMEDIATE]: {
    label: 'Intermediate',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
  },
  [COMPLEXITY_LEVELS.ADVANCED]: {
    label: 'Advanced',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500/30',
  },
}

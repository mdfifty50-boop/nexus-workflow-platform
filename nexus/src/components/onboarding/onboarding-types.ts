/**
 * Onboarding Wizard Type Definitions
 *
 * Contains all TypeScript types, interfaces, and const objects used by the
 * OnboardingWizard component. Following project conventions:
 * - NO enums - use const objects with type aliases
 * - NO parameter properties in constructors
 * - Use `import type` for type-only imports
 */

// =============================================================================
// STEP DEFINITIONS (using const objects instead of enums)
// =============================================================================

export const OnboardingStepId = {
  WELCOME: 'welcome',
  BUSINESS_PROFILE: 'business_profile',
  GOALS: 'goals',
  INTEGRATIONS: 'integrations',
  TEMPLATES: 'templates',
  FIRST_WORKFLOW: 'first_workflow',
  COMPLETION: 'completion',
} as const

export type OnboardingStepIdType = typeof OnboardingStepId[keyof typeof OnboardingStepId]

// =============================================================================
// BUSINESS TYPES (using const objects instead of enums)
// =============================================================================

export const BusinessTypeId = {
  ECOMMERCE: 'ecommerce',
  SERVICES: 'services',
  AGENCY: 'agency',
  SAAS: 'saas',
  STARTUP: 'startup',
  PERSONAL: 'personal',
  OTHER: 'other',
} as const

export type BusinessTypeIdType = typeof BusinessTypeId[keyof typeof BusinessTypeId]

// =============================================================================
// COMPANY SIZE (using const objects instead of enums)
// =============================================================================

export const CompanySize = {
  SOLO: 'solo',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  ENTERPRISE: 'enterprise',
} as const

export type CompanySizeType = typeof CompanySize[keyof typeof CompanySize]

// =============================================================================
// AUTOMATION GOALS (using const objects instead of enums)
// =============================================================================

export const AutomationGoal = {
  SAVE_TIME: 'save_time',
  REDUCE_ERRORS: 'reduce_errors',
  SCALE_OPERATIONS: 'scale_operations',
  IMPROVE_COMMUNICATION: 'improve_communication',
  CUSTOMER_EXPERIENCE: 'customer_experience',
  DATA_MANAGEMENT: 'data_management',
  MARKETING_AUTOMATION: 'marketing_automation',
  SALES_PIPELINE: 'sales_pipeline',
  PROJECT_MANAGEMENT: 'project_management',
  REPORTING: 'reporting',
} as const

export type AutomationGoalType = typeof AutomationGoal[keyof typeof AutomationGoal]

// =============================================================================
// INDUSTRY (using const objects instead of enums)
// =============================================================================

export const Industry = {
  TECHNOLOGY: 'technology',
  HEALTHCARE: 'healthcare',
  FINANCE: 'finance',
  RETAIL: 'retail',
  MANUFACTURING: 'manufacturing',
  EDUCATION: 'education',
  MARKETING: 'marketing',
  CONSULTING: 'consulting',
  REAL_ESTATE: 'real_estate',
  NON_PROFIT: 'non_profit',
  OTHER: 'other',
} as const

export type IndustryType = typeof Industry[keyof typeof Industry]

// =============================================================================
// PRIMARY ROLE (using const objects instead of enums)
// =============================================================================

export const PrimaryRole = {
  FOUNDER: 'founder',
  EXECUTIVE: 'executive',
  MANAGER: 'manager',
  DEVELOPER: 'developer',
  MARKETER: 'marketer',
  SALES: 'sales',
  OPERATIONS: 'operations',
  SUPPORT: 'support',
  OTHER: 'other',
} as const

export type PrimaryRoleType = typeof PrimaryRole[keyof typeof PrimaryRole]

// =============================================================================
// STEP STATUS (using const objects instead of enums)
// =============================================================================

export const StepStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
} as const

export type StepStatusType = typeof StepStatus[keyof typeof StepStatus]

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Step configuration for the wizard
 */
export interface OnboardingStepConfig {
  id: OnboardingStepIdType
  title: string
  description: string
  icon: string
  estimatedTime: string
  skippable: boolean
  validationRequired: boolean
}

/**
 * Business profile data collected in step 2
 */
export interface BusinessProfile {
  companyName: string
  industry: IndustryType | null
  businessType: BusinessTypeIdType | null
  companySize: CompanySizeType | null
  primaryRole: PrimaryRoleType | null
  website?: string
}

/**
 * Goals selection data from step 3
 */
export interface GoalsSelection {
  primaryGoals: AutomationGoalType[]
  expectedTimeSavings: string
  topPriority: AutomationGoalType | null
}

/**
 * Integration selection data from step 4
 */
export interface IntegrationSelection {
  selectedIntegrations: string[]
  connectedIntegrations: string[]
  skippedForLater: boolean
}

/**
 * Template selection data from step 5
 */
export interface TemplateSelection {
  selectedTemplateId: string | null
  templateCategory: string | null
}

/**
 * First workflow data from step 6
 */
export interface FirstWorkflowData {
  workflowName: string
  workflowDescription: string
  workflowCreated: boolean
  workflowId?: string
}

/**
 * Complete wizard state
 */
export interface OnboardingWizardState {
  currentStepIndex: number
  stepStatuses: Record<OnboardingStepIdType, StepStatusType>
  businessProfile: BusinessProfile
  goalsSelection: GoalsSelection
  integrationSelection: IntegrationSelection
  templateSelection: TemplateSelection
  firstWorkflow: FirstWorkflowData
  startedAt: string
  completedAt: string | null
  tourOffered: boolean
  tourAccepted: boolean
}

/**
 * Step navigation handlers
 */
export interface StepNavigationProps {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  isFirstStep: boolean
  isLastStep: boolean
  canProceed: boolean
  currentStepIndex: number
  totalSteps: number
}

/**
 * Props for individual step components
 */
export interface OnboardingStepProps {
  state: OnboardingWizardState
  updateState: (updates: Partial<OnboardingWizardState>) => void
  navigation: StepNavigationProps
}

/**
 * Integration option configuration
 */
export interface IntegrationOption {
  id: string
  name: string
  icon: string
  description: string
  gradient: string
  category: string
  popular: boolean
  businessTypes: BusinessTypeIdType[]
}

/**
 * Template option configuration
 */
export interface TemplateOption {
  id: string
  name: string
  description: string
  icon: string
  gradient: string
  category: string
  businessTypes: BusinessTypeIdType[]
  goals: AutomationGoalType[]
  estimatedSetupTime: string
  popularity: number
}

/**
 * Goal option configuration
 */
export interface GoalOption {
  id: AutomationGoalType
  name: string
  description: string
  icon: string
  color: string
}

/**
 * Business type option configuration
 */
export interface BusinessTypeOption {
  id: BusinessTypeIdType
  name: string
  description: string
  icon: string
  gradient: string
  examples: string
}

/**
 * Company size option configuration
 */
export interface CompanySizeOption {
  id: CompanySizeType
  name: string
  description: string
  employeeRange: string
}

/**
 * Industry option configuration
 */
export interface IndustryOption {
  id: IndustryType
  name: string
  icon: string
}

/**
 * Role option configuration
 */
export interface RoleOption {
  id: PrimaryRoleType
  name: string
  icon: string
}

/**
 * Onboarding wizard props
 */
export interface OnboardingWizardProps {
  onComplete: (state: OnboardingWizardState) => void
  onSkip?: () => void
  initialStep?: number
  showTourOffer?: boolean
  onTourStart?: () => void
}

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  WIZARD_STATE: 'nexus_onboarding_wizard_state',
  WIZARD_COMPLETED: 'nexus_onboarding_wizard_completed',
  WIZARD_SKIPPED: 'nexus_onboarding_wizard_skipped',
} as const

export type StorageKeyType = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

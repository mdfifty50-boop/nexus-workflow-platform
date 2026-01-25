/**
 * Onboarding Wizard Utility Functions
 *
 * Helper functions for the OnboardingWizard component including:
 * - State management utilities
 * - Validation functions
 * - Progress calculation
 * - Local storage operations
 * - Data filtering and recommendations
 */

import type {
  OnboardingWizardState,
  OnboardingStepIdType,
  BusinessTypeIdType,
  AutomationGoalType,
  BusinessProfile,
  GoalsSelection,
  IntegrationOption,
  TemplateOption,
  GoalOption,
  BusinessTypeOption,
  CompanySizeOption,
  IndustryOption,
  OnboardingStepConfig,
} from './onboarding-types'

import {
  OnboardingStepId,
  BusinessTypeId,
  CompanySize,
  AutomationGoal,
  Industry,
  StepStatus,
  STORAGE_KEYS,
} from './onboarding-types'

// =============================================================================
// STEP CONFIGURATIONS
// =============================================================================

export const STEP_CONFIGS: OnboardingStepConfig[] = [
  {
    id: OnboardingStepId.WELCOME,
    title: 'Welcome',
    description: 'Get started with Nexus',
    icon: 'Rocket',
    estimatedTime: '30 sec',
    skippable: false,
    validationRequired: false,
  },
  {
    id: OnboardingStepId.BUSINESS_PROFILE,
    title: 'Business Profile',
    description: 'Tell us about your business',
    icon: 'Building2',
    estimatedTime: '1 min',
    skippable: true,
    validationRequired: true,
  },
  {
    id: OnboardingStepId.GOALS,
    title: 'Your Goals',
    description: 'What do you want to automate?',
    icon: 'Target',
    estimatedTime: '1 min',
    skippable: true,
    validationRequired: true,
  },
  {
    id: OnboardingStepId.INTEGRATIONS,
    title: 'Connect Apps',
    description: 'Connect your favorite tools',
    icon: 'Plug',
    estimatedTime: '2 min',
    skippable: true,
    validationRequired: false,
  },
  {
    id: OnboardingStepId.TEMPLATES,
    title: 'Templates',
    description: 'Choose a starting template',
    icon: 'LayoutTemplate',
    estimatedTime: '1 min',
    skippable: true,
    validationRequired: false,
  },
  {
    id: OnboardingStepId.FIRST_WORKFLOW,
    title: 'First Workflow',
    description: 'Create your first automation',
    icon: 'Workflow',
    estimatedTime: '2 min',
    skippable: true,
    validationRequired: false,
  },
  {
    id: OnboardingStepId.COMPLETION,
    title: 'All Done',
    description: 'Start automating!',
    icon: 'PartyPopper',
    estimatedTime: '30 sec',
    skippable: false,
    validationRequired: false,
  },
]

// =============================================================================
// OPTIONS DATA
// =============================================================================

export const BUSINESS_TYPE_OPTIONS: BusinessTypeOption[] = [
  {
    id: BusinessTypeId.ECOMMERCE,
    name: 'E-commerce',
    description: 'Online stores and marketplaces',
    icon: 'ShoppingCart',
    gradient: 'from-orange-500 to-pink-500',
    examples: 'Shopify, WooCommerce, Amazon sellers',
  },
  {
    id: BusinessTypeId.SERVICES,
    name: 'Professional Services',
    description: 'Consulting, freelancing, client work',
    icon: 'Briefcase',
    gradient: 'from-blue-500 to-cyan-500',
    examples: 'Consultants, lawyers, accountants',
  },
  {
    id: BusinessTypeId.AGENCY,
    name: 'Agency',
    description: 'Marketing, creative, digital agencies',
    icon: 'Building2',
    gradient: 'from-purple-500 to-pink-500',
    examples: 'Marketing agencies, design studios',
  },
  {
    id: BusinessTypeId.SAAS,
    name: 'SaaS',
    description: 'Software as a service companies',
    icon: 'Cloud',
    gradient: 'from-indigo-500 to-blue-500',
    examples: 'Tech startups, software companies',
  },
  {
    id: BusinessTypeId.STARTUP,
    name: 'Startup',
    description: 'Early-stage companies',
    icon: 'Rocket',
    gradient: 'from-emerald-500 to-teal-500',
    examples: 'Seed stage, Series A companies',
  },
  {
    id: BusinessTypeId.PERSONAL,
    name: 'Personal Use',
    description: 'Individual productivity',
    icon: 'User',
    gradient: 'from-amber-500 to-orange-500',
    examples: 'Solo entrepreneurs, freelancers',
  },
  {
    id: BusinessTypeId.OTHER,
    name: 'Other',
    description: 'Something else entirely',
    icon: 'Sparkles',
    gradient: 'from-gray-500 to-slate-500',
    examples: 'Non-profits, education, government',
  },
]

export const COMPANY_SIZE_OPTIONS: CompanySizeOption[] = [
  {
    id: CompanySize.SOLO,
    name: 'Solo',
    description: 'Just me',
    employeeRange: '1',
  },
  {
    id: CompanySize.SMALL,
    name: 'Small',
    description: 'Small team',
    employeeRange: '2-10',
  },
  {
    id: CompanySize.MEDIUM,
    name: 'Medium',
    description: 'Growing company',
    employeeRange: '11-50',
  },
  {
    id: CompanySize.LARGE,
    name: 'Large',
    description: 'Established business',
    employeeRange: '51-200',
  },
  {
    id: CompanySize.ENTERPRISE,
    name: 'Enterprise',
    description: 'Large organization',
    employeeRange: '200+',
  },
]

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { id: Industry.TECHNOLOGY, name: 'Technology', icon: 'Cpu' },
  { id: Industry.HEALTHCARE, name: 'Healthcare', icon: 'Heart' },
  { id: Industry.FINANCE, name: 'Finance', icon: 'DollarSign' },
  { id: Industry.RETAIL, name: 'Retail', icon: 'ShoppingBag' },
  { id: Industry.MANUFACTURING, name: 'Manufacturing', icon: 'Factory' },
  { id: Industry.EDUCATION, name: 'Education', icon: 'GraduationCap' },
  { id: Industry.MARKETING, name: 'Marketing', icon: 'Megaphone' },
  { id: Industry.CONSULTING, name: 'Consulting', icon: 'Users' },
  { id: Industry.REAL_ESTATE, name: 'Real Estate', icon: 'Home' },
  { id: Industry.NON_PROFIT, name: 'Non-Profit', icon: 'Heart' },
  { id: Industry.OTHER, name: 'Other', icon: 'HelpCircle' },
]

export const GOAL_OPTIONS: GoalOption[] = [
  {
    id: AutomationGoal.SAVE_TIME,
    name: 'Save Time',
    description: 'Automate repetitive tasks',
    icon: 'Clock',
    color: 'text-blue-500',
  },
  {
    id: AutomationGoal.REDUCE_ERRORS,
    name: 'Reduce Errors',
    description: 'Minimize manual mistakes',
    icon: 'ShieldCheck',
    color: 'text-green-500',
  },
  {
    id: AutomationGoal.SCALE_OPERATIONS,
    name: 'Scale Operations',
    description: 'Handle more without hiring',
    icon: 'TrendingUp',
    color: 'text-purple-500',
  },
  {
    id: AutomationGoal.IMPROVE_COMMUNICATION,
    name: 'Better Communication',
    description: 'Sync teams and tools',
    icon: 'MessageSquare',
    color: 'text-cyan-500',
  },
  {
    id: AutomationGoal.CUSTOMER_EXPERIENCE,
    name: 'Customer Experience',
    description: 'Faster, better service',
    icon: 'Smile',
    color: 'text-yellow-500',
  },
  {
    id: AutomationGoal.DATA_MANAGEMENT,
    name: 'Data Management',
    description: 'Keep data in sync',
    icon: 'Database',
    color: 'text-indigo-500',
  },
  {
    id: AutomationGoal.MARKETING_AUTOMATION,
    name: 'Marketing',
    description: 'Automate campaigns',
    icon: 'Mail',
    color: 'text-pink-500',
  },
  {
    id: AutomationGoal.SALES_PIPELINE,
    name: 'Sales Pipeline',
    description: 'Automate sales process',
    icon: 'Target',
    color: 'text-orange-500',
  },
  {
    id: AutomationGoal.PROJECT_MANAGEMENT,
    name: 'Project Management',
    description: 'Streamline workflows',
    icon: 'Kanban',
    color: 'text-teal-500',
  },
  {
    id: AutomationGoal.REPORTING,
    name: 'Reporting',
    description: 'Automated reports',
    icon: 'BarChart',
    color: 'text-rose-500',
  },
]

export const INTEGRATION_OPTIONS: IntegrationOption[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: 'Mail',
    description: 'Connect your Google email',
    gradient: 'from-red-500 to-yellow-500',
    category: 'email',
    popular: true,
    businessTypes: [BusinessTypeId.ECOMMERCE, BusinessTypeId.SERVICES, BusinessTypeId.AGENCY, BusinessTypeId.SAAS, BusinessTypeId.STARTUP, BusinessTypeId.PERSONAL, BusinessTypeId.OTHER],
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: 'MessageSquare',
    description: 'Connect your Slack workspace',
    gradient: 'from-purple-500 to-pink-500',
    category: 'communication',
    popular: true,
    businessTypes: [BusinessTypeId.AGENCY, BusinessTypeId.SAAS, BusinessTypeId.STARTUP, BusinessTypeId.SERVICES],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    icon: 'Calendar',
    description: 'Sync your calendar events',
    gradient: 'from-blue-500 to-cyan-500',
    category: 'calendar',
    popular: true,
    businessTypes: [BusinessTypeId.ECOMMERCE, BusinessTypeId.SERVICES, BusinessTypeId.AGENCY, BusinessTypeId.SAAS, BusinessTypeId.STARTUP, BusinessTypeId.PERSONAL, BusinessTypeId.OTHER],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: 'Users',
    description: 'Connect your CRM',
    gradient: 'from-orange-500 to-red-500',
    category: 'crm',
    popular: true,
    businessTypes: [BusinessTypeId.SERVICES, BusinessTypeId.AGENCY, BusinessTypeId.SAAS, BusinessTypeId.STARTUP],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: 'ShoppingBag',
    description: 'Connect your store',
    gradient: 'from-green-500 to-emerald-500',
    category: 'ecommerce',
    popular: true,
    businessTypes: [BusinessTypeId.ECOMMERCE],
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: 'FileText',
    description: 'Connect your workspace',
    gradient: 'from-gray-700 to-gray-900',
    category: 'productivity',
    popular: true,
    businessTypes: [BusinessTypeId.AGENCY, BusinessTypeId.SAAS, BusinessTypeId.STARTUP, BusinessTypeId.PERSONAL],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: 'Cloud',
    description: 'Connect Salesforce CRM',
    gradient: 'from-blue-400 to-blue-600',
    category: 'crm',
    popular: false,
    businessTypes: [BusinessTypeId.SERVICES, BusinessTypeId.SAAS],
  },
  {
    id: 'asana',
    name: 'Asana',
    icon: 'CheckSquare',
    description: 'Project management',
    gradient: 'from-rose-500 to-pink-500',
    category: 'project',
    popular: false,
    businessTypes: [BusinessTypeId.AGENCY, BusinessTypeId.SAAS, BusinessTypeId.STARTUP],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: 'CreditCard',
    description: 'Payment processing',
    gradient: 'from-indigo-500 to-purple-500',
    category: 'payments',
    popular: false,
    businessTypes: [BusinessTypeId.ECOMMERCE, BusinessTypeId.SAAS, BusinessTypeId.SERVICES],
  },
  {
    id: 'trello',
    name: 'Trello',
    icon: 'Trello',
    description: 'Kanban boards',
    gradient: 'from-blue-500 to-sky-500',
    category: 'project',
    popular: false,
    businessTypes: [BusinessTypeId.AGENCY, BusinessTypeId.PERSONAL, BusinessTypeId.STARTUP],
  },
]

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'email-summary',
    name: 'Daily Email Summary',
    description: 'Get AI-powered summaries of your inbox every morning',
    icon: 'Mail',
    gradient: 'from-blue-500 to-cyan-500',
    category: 'email',
    businessTypes: [BusinessTypeId.ECOMMERCE, BusinessTypeId.SERVICES, BusinessTypeId.AGENCY, BusinessTypeId.SAAS, BusinessTypeId.STARTUP, BusinessTypeId.PERSONAL, BusinessTypeId.OTHER],
    goals: [AutomationGoal.SAVE_TIME, AutomationGoal.IMPROVE_COMMUNICATION],
    estimatedSetupTime: '45s',
    popularity: 95,
  },
  {
    id: 'meeting-scheduler',
    name: 'Smart Meeting Scheduler',
    description: 'AI finds optimal times and sends calendar invites',
    icon: 'Calendar',
    gradient: 'from-purple-500 to-pink-500',
    category: 'calendar',
    businessTypes: [BusinessTypeId.SERVICES, BusinessTypeId.AGENCY, BusinessTypeId.SAAS, BusinessTypeId.STARTUP, BusinessTypeId.OTHER],
    goals: [AutomationGoal.SAVE_TIME, AutomationGoal.IMPROVE_COMMUNICATION],
    estimatedSetupTime: '30s',
    popularity: 88,
  },
  {
    id: 'order-notifications',
    name: 'Order Notifications',
    description: 'Instant alerts for new orders via Slack or email',
    icon: 'ShoppingCart',
    gradient: 'from-orange-500 to-pink-500',
    category: 'ecommerce',
    businessTypes: [BusinessTypeId.ECOMMERCE],
    goals: [AutomationGoal.CUSTOMER_EXPERIENCE, AutomationGoal.SCALE_OPERATIONS],
    estimatedSetupTime: '20s',
    popularity: 92,
  },
  {
    id: 'crm-sync',
    name: 'CRM Activity Sync',
    description: 'Auto-log emails and calls to your CRM',
    icon: 'Users',
    gradient: 'from-emerald-500 to-teal-500',
    category: 'crm',
    businessTypes: [BusinessTypeId.SERVICES, BusinessTypeId.AGENCY, BusinessTypeId.SAAS],
    goals: [AutomationGoal.DATA_MANAGEMENT, AutomationGoal.SALES_PIPELINE],
    estimatedSetupTime: '60s',
    popularity: 85,
  },
  {
    id: 'lead-capture',
    name: 'Lead Capture Pipeline',
    description: 'Auto-qualify and route new leads',
    icon: 'Target',
    gradient: 'from-amber-500 to-orange-500',
    category: 'sales',
    businessTypes: [BusinessTypeId.AGENCY, BusinessTypeId.ECOMMERCE, BusinessTypeId.SERVICES, BusinessTypeId.SAAS],
    goals: [AutomationGoal.SALES_PIPELINE, AutomationGoal.SCALE_OPERATIONS],
    estimatedSetupTime: '45s',
    popularity: 90,
  },
  {
    id: 'invoice-processor',
    name: 'Invoice Processor',
    description: 'Extract data from invoices automatically',
    icon: 'FileText',
    gradient: 'from-pink-500 to-rose-500',
    category: 'finance',
    businessTypes: [BusinessTypeId.SERVICES, BusinessTypeId.AGENCY, BusinessTypeId.OTHER],
    goals: [AutomationGoal.REDUCE_ERRORS, AutomationGoal.DATA_MANAGEMENT],
    estimatedSetupTime: '75s',
    popularity: 78,
  },
  {
    id: 'social-scheduler',
    name: 'Social Media Scheduler',
    description: 'Schedule and auto-post to social platforms',
    icon: 'Share2',
    gradient: 'from-indigo-500 to-violet-500',
    category: 'marketing',
    businessTypes: [BusinessTypeId.AGENCY, BusinessTypeId.ECOMMERCE, BusinessTypeId.PERSONAL],
    goals: [AutomationGoal.MARKETING_AUTOMATION, AutomationGoal.SAVE_TIME],
    estimatedSetupTime: '90s',
    popularity: 82,
  },
  {
    id: 'customer-onboarding',
    name: 'Customer Onboarding',
    description: 'Automated welcome sequences for new customers',
    icon: 'UserPlus',
    gradient: 'from-cyan-500 to-blue-500',
    category: 'customer',
    businessTypes: [BusinessTypeId.SAAS, BusinessTypeId.SERVICES, BusinessTypeId.AGENCY],
    goals: [AutomationGoal.CUSTOMER_EXPERIENCE, AutomationGoal.SCALE_OPERATIONS],
    estimatedSetupTime: '120s',
    popularity: 86,
  },
]

// =============================================================================
// STATE INITIALIZATION
// =============================================================================

/**
 * Create initial wizard state
 */
export function createInitialState(): OnboardingWizardState {
  return {
    currentStepIndex: 0,
    stepStatuses: {
      [OnboardingStepId.WELCOME]: StepStatus.ACTIVE,
      [OnboardingStepId.BUSINESS_PROFILE]: StepStatus.PENDING,
      [OnboardingStepId.GOALS]: StepStatus.PENDING,
      [OnboardingStepId.INTEGRATIONS]: StepStatus.PENDING,
      [OnboardingStepId.TEMPLATES]: StepStatus.PENDING,
      [OnboardingStepId.FIRST_WORKFLOW]: StepStatus.PENDING,
      [OnboardingStepId.COMPLETION]: StepStatus.PENDING,
    },
    businessProfile: {
      companyName: '',
      industry: null,
      businessType: null,
      companySize: null,
      website: '',
      role: '',
    },
    goalsSelection: {
      primaryGoals: [],
      expectedTimeSavings: '',
      topPriority: null,
    },
    integrationSelection: {
      selectedIntegrations: [],
      connectedIntegrations: [],
      skippedForLater: false,
    },
    templateSelection: {
      selectedTemplateId: null,
      templateCategory: null,
    },
    firstWorkflow: {
      workflowName: '',
      workflowDescription: '',
      workflowCreated: false,
      workflowId: undefined,
    },
    startedAt: new Date().toISOString(),
    completedAt: null,
    tourOffered: false,
    tourAccepted: false,
  }
}

// =============================================================================
// STORAGE OPERATIONS
// =============================================================================

/**
 * Save wizard state to localStorage
 */
export function saveWizardState(state: OnboardingWizardState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WIZARD_STATE, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save onboarding wizard state:', error)
  }
}

/**
 * Load wizard state from localStorage
 */
export function loadWizardState(): OnboardingWizardState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WIZARD_STATE)
    if (stored) {
      return JSON.parse(stored) as OnboardingWizardState
    }
  } catch (error) {
    console.error('Failed to load onboarding wizard state:', error)
  }
  return null
}

/**
 * Clear wizard state from localStorage
 */
export function clearWizardState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.WIZARD_STATE)
  } catch (error) {
    console.error('Failed to clear onboarding wizard state:', error)
  }
}

/**
 * Mark wizard as completed
 */
export function markWizardCompleted(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WIZARD_COMPLETED, 'true')
    clearWizardState()
  } catch (error) {
    console.error('Failed to mark wizard as completed:', error)
  }
}

/**
 * Mark wizard as skipped
 */
export function markWizardSkipped(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WIZARD_SKIPPED, 'true')
    clearWizardState()
  } catch (error) {
    console.error('Failed to mark wizard as skipped:', error)
  }
}

/**
 * Check if wizard has been completed
 */
export function isWizardCompleted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.WIZARD_COMPLETED) === 'true'
  } catch {
    return false
  }
}

/**
 * Check if wizard has been skipped
 */
export function isWizardSkipped(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.WIZARD_SKIPPED) === 'true'
  } catch {
    return false
  }
}

/**
 * Reset wizard state completely
 */
export function resetWizard(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.WIZARD_STATE)
    localStorage.removeItem(STORAGE_KEYS.WIZARD_COMPLETED)
    localStorage.removeItem(STORAGE_KEYS.WIZARD_SKIPPED)
  } catch (error) {
    console.error('Failed to reset wizard:', error)
  }
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate business profile step
 */
export function validateBusinessProfile(profile: BusinessProfile): boolean {
  return (
    profile.companyName.trim().length > 0 &&
    profile.businessType !== null &&
    profile.companySize !== null
  )
}

/**
 * Validate goals selection step
 */
export function validateGoalsSelection(goals: GoalsSelection): boolean {
  return goals.primaryGoals.length > 0
}

/**
 * Check if current step can proceed
 */
export function canStepProceed(
  stepId: OnboardingStepIdType,
  state: OnboardingWizardState
): boolean {
  const stepConfig = STEP_CONFIGS.find((s) => s.id === stepId)
  if (!stepConfig || !stepConfig.validationRequired) {
    return true
  }

  switch (stepId) {
    case OnboardingStepId.BUSINESS_PROFILE:
      return validateBusinessProfile(state.businessProfile)
    case OnboardingStepId.GOALS:
      return validateGoalsSelection(state.goalsSelection)
    default:
      return true
  }
}

// =============================================================================
// PROGRESS CALCULATION
// =============================================================================

/**
 * Calculate overall progress percentage
 */
export function calculateProgress(state: OnboardingWizardState): number {
  return ((state.currentStepIndex + 1) / STEP_CONFIGS.length) * 100
}

/**
 * Get completed steps count
 */
export function getCompletedStepsCount(state: OnboardingWizardState): number {
  return Object.values(state.stepStatuses).filter(
    (status) => status === StepStatus.COMPLETED
  ).length
}

// =============================================================================
// RECOMMENDATIONS
// =============================================================================

/**
 * Get recommended integrations based on business profile
 */
export function getRecommendedIntegrations(
  businessType: BusinessTypeIdType | null
): IntegrationOption[] {
  if (!businessType) {
    return INTEGRATION_OPTIONS.filter((i) => i.popular)
  }

  const relevant = INTEGRATION_OPTIONS.filter(
    (i) => i.businessTypes.includes(businessType)
  )

  // Sort by popular first, then alphabetically
  return relevant.sort((a, b) => {
    if (a.popular && !b.popular) return -1
    if (!a.popular && b.popular) return 1
    return a.name.localeCompare(b.name)
  })
}

/**
 * Get recommended templates based on business profile and goals
 */
export function getRecommendedTemplates(
  businessType: BusinessTypeIdType | null,
  goals: AutomationGoalType[]
): TemplateOption[] {
  let templates = [...TEMPLATE_OPTIONS]

  // Filter by business type
  if (businessType) {
    templates = templates.filter((t) =>
      t.businessTypes.includes(businessType)
    )
  }

  // Score templates based on goal match
  const scored = templates.map((template) => {
    const goalMatches = template.goals.filter((g) => goals.includes(g)).length
    return {
      template,
      score: goalMatches * 10 + template.popularity,
    }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  return scored.map((s) => s.template)
}

// =============================================================================
// KEYBOARD NAVIGATION HELPERS
// =============================================================================

/**
 * Key codes for keyboard navigation
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  TAB: 'Tab',
  SPACE: ' ',
} as const

/**
 * Handle keyboard navigation for grid selection
 */
export function handleGridKeyNavigation(
  event: React.KeyboardEvent,
  currentIndex: number,
  itemCount: number,
  columnsPerRow: number,
  onSelect: (index: number) => void
): void {
  let newIndex = currentIndex

  switch (event.key) {
    case KEYBOARD_KEYS.ARROW_RIGHT:
      newIndex = Math.min(currentIndex + 1, itemCount - 1)
      break
    case KEYBOARD_KEYS.ARROW_LEFT:
      newIndex = Math.max(currentIndex - 1, 0)
      break
    case KEYBOARD_KEYS.ARROW_DOWN:
      newIndex = Math.min(currentIndex + columnsPerRow, itemCount - 1)
      break
    case KEYBOARD_KEYS.ARROW_UP:
      newIndex = Math.max(currentIndex - columnsPerRow, 0)
      break
    case KEYBOARD_KEYS.ENTER:
    case KEYBOARD_KEYS.SPACE:
      onSelect(currentIndex)
      event.preventDefault()
      return
    default:
      return
  }

  if (newIndex !== currentIndex) {
    event.preventDefault()
    onSelect(newIndex)
  }
}

// =============================================================================
// TIME ESTIMATES
// =============================================================================

/**
 * Get estimated time remaining
 */
export function getEstimatedTimeRemaining(currentStepIndex: number): string {
  const remainingSteps = STEP_CONFIGS.slice(currentStepIndex)
  let totalSeconds = 0

  for (const step of remainingSteps) {
    const match = step.estimatedTime.match(/(\d+)\s*(sec|min)/)
    if (match) {
      const value = parseInt(match[1], 10)
      const unit = match[2]
      totalSeconds += unit === 'min' ? value * 60 : value
    }
  }

  if (totalSeconds < 60) {
    return `${totalSeconds} seconds`
  } else if (totalSeconds < 120) {
    return '1 minute'
  } else {
    return `${Math.ceil(totalSeconds / 60)} minutes`
  }
}

// =============================================================================
// ANALYTICS HELPERS
// =============================================================================

/**
 * Create analytics event data for wizard completion
 */
export function createCompletionAnalytics(state: OnboardingWizardState): Record<string, unknown> {
  const completedSteps = getCompletedStepsCount(state)
  const skippedSteps = Object.values(state.stepStatuses).filter(
    (s) => s === StepStatus.SKIPPED
  ).length

  return {
    completed_steps: completedSteps,
    skipped_steps: skippedSteps,
    business_type: state.businessProfile.businessType,
    company_size: state.businessProfile.companySize,
    industry: state.businessProfile.industry,
    goals_count: state.goalsSelection.primaryGoals.length,
    primary_goals: state.goalsSelection.primaryGoals,
    integrations_selected: state.integrationSelection.selectedIntegrations.length,
    integrations_connected: state.integrationSelection.connectedIntegrations.length,
    template_selected: state.templateSelection.selectedTemplateId,
    workflow_created: state.firstWorkflow.workflowCreated,
    tour_accepted: state.tourAccepted,
    started_at: state.startedAt,
    completed_at: state.completedAt,
    duration_seconds: state.completedAt
      ? Math.round(
          (new Date(state.completedAt).getTime() -
            new Date(state.startedAt).getTime()) /
            1000
        )
      : null,
  }
}

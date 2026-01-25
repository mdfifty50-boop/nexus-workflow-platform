/**
 * Onboarding Components Barrel Export
 *
 * Central export point for all onboarding-related components.
 * Use this for cleaner imports throughout the codebase.
 *
 * Example usage:
 * import { WelcomeStep, ConnectAppStep, SetupWizard } from '@/components/onboarding'
 */

// Core onboarding step components
export { WelcomeStep } from './WelcomeStep'
export { ConnectAppStep } from './ConnectAppStep'
export { FirstWorkflowStep } from './FirstWorkflowStep'
export { SuccessStep } from './SuccessStep'

// Re-export types from the hook for convenience
export type {
  BusinessType,
  OnboardingStep,
  OnboardingState,
  WorkflowPreview,
} from '@/hooks/useOnboarding'

// Re-export the hook for convenience
export { useOnboarding, recommendedApps, templateWorkflows } from '@/hooks/useOnboarding'

// Setup wizard component - comprehensive onboarding experience
export { SetupWizard, useSetupWizard } from './SetupWizard'

// Integration quick connect component
export { IntegrationConnectStep } from './IntegrationConnectStep'
export type { IntegrationConnectStepProps } from './IntegrationConnectStep'

// Integration card component
export { IntegrationCard, CONNECTION_STATUS } from './IntegrationCard'
export type { IntegrationCardProps, ConnectionState, ConnectionStatus } from './IntegrationCard'

// Integration catalog and types
export {
  INTEGRATION_CATEGORIES,
  INDUSTRIES,
  BUSINESS_SIZES,
  CATEGORY_INFO,
  INTEGRATIONS,
  INTEGRATION_BUNDLES,
  getIntegrationsByCategory,
  getRecommendedForIndustry,
  getPopularIntegrations,
  getBundlesForIndustry,
  getIntegrationById,
  getIntegrationsByIds,
  searchIntegrations,
  mapBusinessTypeToIndustry,
} from './integration-catalog'
export type {
  IntegrationCategory,
  Industry,
  BusinessSize,
  Integration,
  IntegrationBundle,
  CategoryInfo,
} from './integration-catalog'

// Existing integration connector (kept for backward compatibility)
export { IntegrationConnector } from './IntegrationConnector'

// Business profile step component
export { BusinessProfileStep } from './BusinessProfileStep'
export type { BusinessProfileStepProps } from './BusinessProfileStep'

// Business profile types
export {
  COMPANY_SIZES,
  COMPANY_SIZE_LABELS,
  PRIMARY_ROLES,
  PRIMARY_ROLE_LABELS,
  INDUSTRIES as BUSINESS_INDUSTRIES,
  INDUSTRY_LABELS,
  AUTOMATION_PRIORITIES,
  AUTOMATION_PRIORITY_LABELS,
  PAIN_POINTS,
  PAIN_POINT_LABELS,
  TIME_SAVINGS_GOALS,
  TIME_SAVINGS_LABELS,
  BUDGET_RANGES,
  BUDGET_RANGE_LABELS,
  ECOMMERCE_PLATFORMS,
  ECOMMERCE_PLATFORM_LABELS,
  ORDER_VOLUMES,
  ORDER_VOLUME_LABELS,
  USER_BASE_SIZES,
  USER_BASE_SIZE_LABELS,
  TECH_STACKS,
  TECH_STACK_LABELS,
  CLIENT_COUNTS,
  CLIENT_COUNT_LABELS,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  DEFAULT_BUSINESS_PROFILE,
  validateBusinessProfile,
  isProfileValid,
} from './business-profile-types'
export type {
  CompanySize,
  PrimaryRole,
  Industry as BusinessIndustry,
  AutomationPriority,
  PainPoint,
  TimeSavingsGoal,
  BudgetRange,
  EcommercePlatform,
  OrderVolume,
  UserBaseSize,
  TechStack,
  ClientCount,
  ServiceType,
  EcommerceFields,
  SaasFields,
  AgencyFields,
  BusinessProfileData,
  ValidationErrors,
} from './business-profile-types'

// Industry configuration
export {
  INDUSTRY_ICONS,
  INDUSTRY_GRADIENTS,
  INDUSTRY_CONFIGS,
  COMMON_TIMEZONES,
  getIndustryConfig,
  getRecommendedIntegrations,
  getRecommendedTemplates,
  getSuggestedPriorities,
  getCommonPainPoints,
  hasCustomFields,
  getCustomFieldsComponent,
  getCurrentTimezone,
  getTimezoneLabel,
} from './industry-config'
export type { IndustryConfig } from './industry-config'

// Template selector component
export { TemplateSelector } from './TemplateSelector'

// Template recommendation components (Smart Template Suggestions)
export { TemplateRecommendationStep } from './TemplateRecommendationStep'
export { TemplatePreviewCard } from './TemplatePreviewCard'

// Template recommendation types
export {
  BUSINESS_INDUSTRIES as TEMPLATE_BUSINESS_INDUSTRIES,
  BUSINESS_SIZES as TEMPLATE_BUSINESS_SIZES,
  COMPLEXITY_LEVELS,
  RECOMMENDATION_CATEGORIES,
  USER_GOALS,
  APP_INFO_MAP,
  CATEGORY_DISPLAY_INFO,
  COMPLEXITY_DISPLAY_INFO,
} from './template-recommendation-types'
export type {
  BusinessIndustry as TemplateBusinessIndustry,
  BusinessSize as TemplateBusinessSize,
  ComplexityLevel,
  RecommendationCategory,
  UserGoal,
  BusinessProfile,
  WorkflowStepPreview,
  TemplateMetadata,
  TemplateRecommendation,
  RecommendationGroup,
  RecommendationResult,
  TemplateRecommendationStepProps,
  TemplatePreviewCardProps,
  TemplatePreviewModalProps,
  AppInfo,
} from './template-recommendation-types'

// Template matching utilities
export {
  generateRecommendations,
  searchTemplates,
  filterByCategory,
  filterByComplexity,
  getMockTemplates,
} from './template-matcher'

// =============================================================================
// COMPREHENSIVE ONBOARDING WIZARD
// =============================================================================

// Onboarding Wizard Component - Multi-step wizard with full feature set
export { OnboardingWizard, useOnboardingWizard } from './OnboardingWizard'

// Onboarding Wizard Types
export type {
  OnboardingWizardProps,
  OnboardingWizardState,
  OnboardingStepProps,
  OnboardingStepConfig,
  BusinessProfile as OnboardingBusinessProfile,
  GoalsSelection,
  IntegrationSelection,
  TemplateSelection,
  FirstWorkflowData,
  StepNavigationProps,
  IntegrationOption as OnboardingIntegrationOption,
  TemplateOption as OnboardingTemplateOption,
  GoalOption,
  BusinessTypeOption,
  CompanySizeOption as OnboardingCompanySizeOption,
  IndustryOption as OnboardingIndustryOption,
  OnboardingStepIdType,
  BusinessTypeIdType,
  CompanySizeType as OnboardingCompanySizeType,
  IndustryType as OnboardingIndustryType,
  AutomationGoalType,
  StepStatusType,
} from './onboarding-types'

// Onboarding Wizard Constants
export {
  OnboardingStepId,
  BusinessTypeId,
  CompanySize as OnboardingWizardCompanySize,
  AutomationGoal,
  Industry as OnboardingWizardIndustry,
  StepStatus,
  STORAGE_KEYS,
} from './onboarding-types'

// Onboarding Wizard Utilities
export {
  STEP_CONFIGS,
  BUSINESS_TYPE_OPTIONS,
  COMPANY_SIZE_OPTIONS as ONBOARDING_COMPANY_SIZE_OPTIONS,
  INDUSTRY_OPTIONS as ONBOARDING_INDUSTRY_OPTIONS,
  GOAL_OPTIONS,
  INTEGRATION_OPTIONS as ONBOARDING_INTEGRATION_OPTIONS,
  TEMPLATE_OPTIONS as ONBOARDING_TEMPLATE_OPTIONS,
  createInitialState,
  saveWizardState,
  loadWizardState,
  clearWizardState,
  markWizardCompleted,
  markWizardSkipped,
  isWizardCompleted,
  isWizardSkipped,
  resetWizard,
  validateBusinessProfile as validateOnboardingBusinessProfile,
  validateGoalsSelection,
  canStepProceed,
  calculateProgress,
  getCompletedStepsCount,
  getRecommendedIntegrations as getOnboardingRecommendedIntegrations,
  getRecommendedTemplates as getOnboardingRecommendedTemplates,
  KEYBOARD_KEYS,
  handleGridKeyNavigation,
  getEstimatedTimeRemaining,
  createCompletionAnalytics,
} from './onboarding-utils'

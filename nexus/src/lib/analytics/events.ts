/**
 * Analytics Event Definitions
 *
 * Comprehensive event definitions for tracking user behavior
 * and workflow performance in Nexus.
 */

// =============================================================================
// Event Categories
// =============================================================================

export type EventCategory =
  | 'user'
  | 'workflow'
  | 'template'
  | 'integration'
  | 'subscription'
  | 'onboarding'
  | 'engagement'
  | 'error'
  | 'performance';

// =============================================================================
// User Events
// =============================================================================

export const USER_EVENTS = {
  // Authentication
  SIGNUP: 'user_signup',
  SIGNUP_STARTED: 'user_signup_started',
  SIGNUP_COMPLETED: 'user_signup_completed',
  LOGIN: 'user_login',
  LOGIN_COMPLETED: 'user_login_completed',
  LOGIN_FAILED: 'user_login_failed',
  LOGOUT: 'user_logout',
  PASSWORD_RESET_REQUESTED: 'user_password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'user_password_reset_completed',
  EMAIL_VERIFIED: 'user_email_verified',

  // Profile
  PROFILE_VIEWED: 'user_profile_viewed',
  PROFILE_UPDATED: 'user_profile_updated',
  AVATAR_UPDATED: 'user_avatar_updated',
  PREFERENCES_UPDATED: 'user_preferences_updated',
  LANGUAGE_CHANGED: 'user_language_changed',
  TIMEZONE_CHANGED: 'user_timezone_changed',

  // Session
  SESSION_STARTED: 'user_session_started',
  SESSION_ENDED: 'user_session_ended',
  SESSION_TIMEOUT: 'user_session_timeout',
  SESSION_RESUMED: 'user_session_resumed',
} as const;

// =============================================================================
// Workflow Events
// =============================================================================

export const WORKFLOW_EVENTS = {
  // Lifecycle
  CREATED: 'workflow_created',
  UPDATED: 'workflow_updated',
  DELETED: 'workflow_deleted',
  DUPLICATED: 'workflow_duplicated',
  ARCHIVED: 'workflow_archived',
  RESTORED: 'workflow_restored',

  // Execution
  EXECUTED: 'workflow_executed',
  EXECUTION_STARTED: 'workflow_execution_started',
  EXECUTION_COMPLETED: 'workflow_execution_completed',
  EXECUTION_FAILED: 'workflow_execution_failed',
  EXECUTION_CANCELLED: 'workflow_execution_cancelled',
  EXECUTION_PAUSED: 'workflow_execution_paused',
  EXECUTION_RESUMED: 'workflow_execution_resumed',

  // Collaboration
  SHARED: 'workflow_shared',
  UNSHARED: 'workflow_unshared',
  COLLABORATOR_ADDED: 'workflow_collaborator_added',
  COLLABORATOR_REMOVED: 'workflow_collaborator_removed',

  // Import/Export
  EXPORTED: 'workflow_exported',
  IMPORTED: 'workflow_imported',

  // Nodes
  NODE_ADDED: 'workflow_node_added',
  NODE_REMOVED: 'workflow_node_removed',
  NODE_CONFIGURED: 'workflow_node_configured',
  NODE_CONNECTED: 'workflow_node_connected',
  NODE_DISCONNECTED: 'workflow_node_disconnected',

  // Versioning
  VERSION_CREATED: 'workflow_version_created',
  VERSION_RESTORED: 'workflow_version_restored',

  // Scheduling
  SCHEDULED: 'workflow_scheduled',
  SCHEDULE_UPDATED: 'workflow_schedule_updated',
  SCHEDULE_CANCELLED: 'workflow_schedule_cancelled',
} as const;

// =============================================================================
// Template Events
// =============================================================================

export const TEMPLATE_EVENTS = {
  VIEWED: 'template_viewed',
  SELECTED: 'template_selected',
  APPLIED: 'template_applied',
  CUSTOMIZED: 'template_customized',
  CREATED: 'template_created',
  PUBLISHED: 'template_published',
  UNPUBLISHED: 'template_unpublished',
  RATED: 'template_rated',
  REVIEWED: 'template_reviewed',
  DOWNLOADED: 'template_downloaded',
  SEARCHED: 'template_searched',
  FILTERED: 'template_filtered',
  FAVORITED: 'template_favorited',
  UNFAVORITED: 'template_unfavorited',
} as const;

// =============================================================================
// Integration Events
// =============================================================================

export const INTEGRATION_EVENTS = {
  CONNECTED: 'integration_connected',
  DISCONNECTED: 'integration_disconnected',
  RECONNECTED: 'integration_reconnected',
  AUTH_STARTED: 'integration_auth_started',
  AUTH_COMPLETED: 'integration_auth_completed',
  AUTH_FAILED: 'integration_auth_failed',
  AUTH_REFRESHED: 'integration_auth_refreshed',
  CONFIGURED: 'integration_configured',
  TESTED: 'integration_tested',
  TEST_PASSED: 'integration_test_passed',
  TEST_FAILED: 'integration_test_failed',
  USAGE_LIMIT_REACHED: 'integration_usage_limit_reached',
  ERROR: 'integration_error',
} as const;

// =============================================================================
// Subscription Events
// =============================================================================

export const SUBSCRIPTION_EVENTS = {
  STARTED: 'subscription_started',
  CANCELLED: 'subscription_cancelled',
  RENEWED: 'subscription_renewed',
  UPGRADED: 'subscription_upgraded',
  DOWNGRADED: 'subscription_downgraded',
  TRIAL_STARTED: 'subscription_trial_started',
  TRIAL_ENDED: 'subscription_trial_ended',
  TRIAL_CONVERTED: 'subscription_trial_converted',
  PAYMENT_FAILED: 'subscription_payment_failed',
  PAYMENT_SUCCEEDED: 'subscription_payment_succeeded',
  PLAN_VIEWED: 'subscription_plan_viewed',
  CHECKOUT_STARTED: 'subscription_checkout_started',
  CHECKOUT_COMPLETED: 'subscription_checkout_completed',
  CHECKOUT_ABANDONED: 'subscription_checkout_abandoned',
} as const;

// =============================================================================
// Onboarding Events
// =============================================================================

export const ONBOARDING_EVENTS = {
  STARTED: 'onboarding_started',
  STEP_VIEWED: 'onboarding_step_viewed',
  STEP_COMPLETED: 'onboarding_step_completed',
  STEP_SKIPPED: 'onboarding_step_skipped',
  COMPLETED: 'onboarding_completed',
  SKIPPED: 'onboarding_skipped',
  RESUMED: 'onboarding_resumed',
  RESET: 'onboarding_reset',
  TOOLTIP_SHOWN: 'onboarding_tooltip_shown',
  TOOLTIP_DISMISSED: 'onboarding_tooltip_dismissed',
  TUTORIAL_STARTED: 'onboarding_tutorial_started',
  TUTORIAL_COMPLETED: 'onboarding_tutorial_completed',
  FIRST_WORKFLOW_CREATED: 'onboarding_first_workflow_created',
  FIRST_EXECUTION_COMPLETED: 'onboarding_first_execution_completed',
} as const;

// =============================================================================
// Engagement Events
// =============================================================================

export const ENGAGEMENT_EVENTS = {
  // Page Views
  PAGE_VIEWED: 'engagement_page_viewed',
  DASHBOARD_VIEWED: 'engagement_dashboard_viewed',

  // Features
  FEATURE_USED: 'engagement_feature_used',
  VOICE_INPUT_USED: 'engagement_voice_input_used',
  VOICE_INPUT_SUCCESS: 'engagement_voice_input_success',
  VOICE_INPUT_FAILED: 'engagement_voice_input_failed',
  AI_SUGGESTION_SHOWN: 'engagement_ai_suggestion_shown',
  AI_SUGGESTION_ACCEPTED: 'engagement_ai_suggestion_accepted',
  AI_SUGGESTION_DISMISSED: 'engagement_ai_suggestion_dismissed',
  SEARCH_PERFORMED: 'engagement_search_performed',
  FILTER_APPLIED: 'engagement_filter_applied',
  SORT_APPLIED: 'engagement_sort_applied',

  // Help & Support
  HELP_ACCESSED: 'engagement_help_accessed',
  DOCUMENTATION_VIEWED: 'engagement_documentation_viewed',
  TUTORIAL_VIEWED: 'engagement_tutorial_viewed',
  FEEDBACK_SUBMITTED: 'engagement_feedback_submitted',
  SUPPORT_TICKET_CREATED: 'engagement_support_ticket_created',

  // Achievements
  ACHIEVEMENT_UNLOCKED: 'engagement_achievement_unlocked',
  ACHIEVEMENT_VIEWED: 'engagement_achievement_viewed',
  STREAK_MAINTAINED: 'engagement_streak_maintained',
  MILESTONE_REACHED: 'engagement_milestone_reached',

  // Social
  REFERRAL_LINK_GENERATED: 'engagement_referral_link_generated',
  REFERRAL_LINK_SHARED: 'engagement_referral_link_shared',
  REFERRAL_SIGNUP: 'engagement_referral_signup',

  // Notifications
  NOTIFICATION_RECEIVED: 'engagement_notification_received',
  NOTIFICATION_CLICKED: 'engagement_notification_clicked',
  NOTIFICATION_DISMISSED: 'engagement_notification_dismissed',
  NOTIFICATION_SETTINGS_UPDATED: 'engagement_notification_settings_updated',
} as const;

// =============================================================================
// Error Events
// =============================================================================

export const ERROR_EVENTS = {
  OCCURRED: 'error_occurred',
  API_ERROR: 'error_api',
  VALIDATION_ERROR: 'error_validation',
  NETWORK_ERROR: 'error_network',
  AUTHENTICATION_ERROR: 'error_authentication',
  AUTHORIZATION_ERROR: 'error_authorization',
  RATE_LIMIT_ERROR: 'error_rate_limit',
  TIMEOUT_ERROR: 'error_timeout',
  UNHANDLED_ERROR: 'error_unhandled',
  WORKFLOW_ERROR: 'error_workflow',
  INTEGRATION_ERROR: 'error_integration',
} as const;

// =============================================================================
// Performance Events
// =============================================================================

export const PERFORMANCE_EVENTS = {
  PAGE_LOAD: 'performance_page_load',
  API_LATENCY: 'performance_api_latency',
  WORKFLOW_EXECUTION_TIME: 'performance_workflow_execution_time',
  RENDER_TIME: 'performance_render_time',
  TIME_TO_INTERACTIVE: 'performance_time_to_interactive',
  LARGEST_CONTENTFUL_PAINT: 'performance_largest_contentful_paint',
  FIRST_INPUT_DELAY: 'performance_first_input_delay',
  CUMULATIVE_LAYOUT_SHIFT: 'performance_cumulative_layout_shift',
} as const;

// =============================================================================
// All Events Combined
// =============================================================================

export const ANALYTICS_EVENTS = {
  ...USER_EVENTS,
  ...WORKFLOW_EVENTS,
  ...TEMPLATE_EVENTS,
  ...INTEGRATION_EVENTS,
  ...SUBSCRIPTION_EVENTS,
  ...ONBOARDING_EVENTS,
  ...ENGAGEMENT_EVENTS,
  ...ERROR_EVENTS,
  ...PERFORMANCE_EVENTS,
} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

// =============================================================================
// Event Property Types
// =============================================================================

export interface BaseEventProperties {
  timestamp?: string;
  sessionId?: string;
  userId?: string;
  anonymousId?: string;
  platform?: 'web' | 'mobile' | 'api';
  locale?: string;
  timezone?: string;
  userAgent?: string;
  referrer?: string;
  pathname?: string;
}

export interface UserEventProperties extends BaseEventProperties {
  method?: 'email' | 'google' | 'github' | 'microsoft';
  previousPlan?: string;
  newPlan?: string;
}

export interface WorkflowEventProperties extends BaseEventProperties {
  workflowId?: string;
  workflowName?: string;
  workflowType?: 'BMAD' | 'Simple' | 'Scheduled';
  nodeCount?: number;
  executionDuration?: number;
  executionStatus?: 'success' | 'failed' | 'cancelled';
  errorMessage?: string;
  triggerType?: string;
  tokensUsed?: number;
  costUsd?: number;
}

export interface TemplateEventProperties extends BaseEventProperties {
  templateId?: string;
  templateName?: string;
  templateCategory?: string;
  rating?: number;
  searchQuery?: string;
  filterCriteria?: Record<string, unknown>;
}

export interface IntegrationEventProperties extends BaseEventProperties {
  integrationId?: string;
  provider?: string;
  scopes?: string[];
  errorCode?: string;
  errorMessage?: string;
}

export interface SubscriptionEventProperties extends BaseEventProperties {
  planId?: string;
  planName?: string;
  planPrice?: number;
  currency?: string;
  billingInterval?: 'monthly' | 'yearly';
  discountCode?: string;
  previousPlan?: string;
}

export interface OnboardingEventProperties extends BaseEventProperties {
  stepNumber?: number;
  stepName?: string;
  totalSteps?: number;
  timeSpentSeconds?: number;
  completionPercentage?: number;
}

export interface EngagementEventProperties extends BaseEventProperties {
  featureName?: string;
  interactionType?: 'click' | 'view' | 'hover' | 'scroll' | 'voice';
  value?: number;
  label?: string;
}

export interface ErrorEventProperties extends BaseEventProperties {
  errorCode?: string;
  errorMessage?: string;
  errorStack?: string;
  componentName?: string;
  actionType?: string;
  requestUrl?: string;
  responseStatus?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceEventProperties extends BaseEventProperties {
  metricName?: string;
  metricValue?: number;
  unit?: 'ms' | 's' | 'bytes' | 'count';
  pageUrl?: string;
  resourceType?: string;
}

export type EventProperties =
  | BaseEventProperties
  | UserEventProperties
  | WorkflowEventProperties
  | TemplateEventProperties
  | IntegrationEventProperties
  | SubscriptionEventProperties
  | OnboardingEventProperties
  | EngagementEventProperties
  | ErrorEventProperties
  | PerformanceEventProperties;

// =============================================================================
// Conversion Funnels
// =============================================================================

export interface FunnelStep {
  number: number;
  name: string;
  event: string;
}

export interface ConversionFunnel {
  name: string;
  description: string;
  steps: FunnelStep[];
}

export const CONVERSION_FUNNELS: Record<string, ConversionFunnel> = {
  SIGNUP_TO_FIRST_WORKFLOW: {
    name: 'signup_to_first_workflow',
    description: 'User journey from signup to first workflow creation',
    steps: [
      { number: 1, name: 'Signup Started', event: USER_EVENTS.SIGNUP_STARTED },
      { number: 2, name: 'Signup Completed', event: USER_EVENTS.SIGNUP_COMPLETED },
      { number: 3, name: 'Email Verified', event: USER_EVENTS.EMAIL_VERIFIED },
      { number: 4, name: 'First Login', event: USER_EVENTS.LOGIN_COMPLETED },
      { number: 5, name: 'Onboarding Started', event: ONBOARDING_EVENTS.STARTED },
      { number: 6, name: 'First Workflow Created', event: WORKFLOW_EVENTS.CREATED },
      { number: 7, name: 'First Execution', event: WORKFLOW_EVENTS.EXECUTION_COMPLETED },
    ],
  },

  ONBOARDING_COMPLETION: {
    name: 'onboarding_completion',
    description: 'User onboarding flow completion',
    steps: [
      { number: 1, name: 'Onboarding Started', event: ONBOARDING_EVENTS.STARTED },
      { number: 2, name: 'Step 1 Completed', event: ONBOARDING_EVENTS.STEP_COMPLETED },
      { number: 3, name: 'Step 2 Completed', event: ONBOARDING_EVENTS.STEP_COMPLETED },
      { number: 4, name: 'Step 3 Completed', event: ONBOARDING_EVENTS.STEP_COMPLETED },
      { number: 5, name: 'Onboarding Completed', event: ONBOARDING_EVENTS.COMPLETED },
    ],
  },

  FREE_TO_PAID: {
    name: 'free_to_paid_conversion',
    description: 'Free user conversion to paid subscription',
    steps: [
      { number: 1, name: 'Plan Page Viewed', event: SUBSCRIPTION_EVENTS.PLAN_VIEWED },
      { number: 2, name: 'Checkout Started', event: SUBSCRIPTION_EVENTS.CHECKOUT_STARTED },
      { number: 3, name: 'Payment Completed', event: SUBSCRIPTION_EVENTS.PAYMENT_SUCCEEDED },
      { number: 4, name: 'Subscription Started', event: SUBSCRIPTION_EVENTS.STARTED },
    ],
  },

  WORKFLOW_CREATION: {
    name: 'workflow_creation',
    description: 'Workflow creation from start to first execution',
    steps: [
      { number: 1, name: 'Workflow Created', event: WORKFLOW_EVENTS.CREATED },
      { number: 2, name: 'First Node Added', event: WORKFLOW_EVENTS.NODE_ADDED },
      { number: 3, name: 'Nodes Connected', event: WORKFLOW_EVENTS.NODE_CONNECTED },
      { number: 4, name: 'Execution Started', event: WORKFLOW_EVENTS.EXECUTION_STARTED },
      { number: 5, name: 'Execution Completed', event: WORKFLOW_EVENTS.EXECUTION_COMPLETED },
    ],
  },

  TEMPLATE_TO_WORKFLOW: {
    name: 'template_to_workflow',
    description: 'User journey from template selection to workflow execution',
    steps: [
      { number: 1, name: 'Template Viewed', event: TEMPLATE_EVENTS.VIEWED },
      { number: 2, name: 'Template Selected', event: TEMPLATE_EVENTS.SELECTED },
      { number: 3, name: 'Template Applied', event: TEMPLATE_EVENTS.APPLIED },
      { number: 4, name: 'Workflow Customized', event: WORKFLOW_EVENTS.UPDATED },
      { number: 5, name: 'Workflow Executed', event: WORKFLOW_EVENTS.EXECUTION_COMPLETED },
    ],
  },

  INTEGRATION_SETUP: {
    name: 'integration_setup',
    description: 'Integration connection and first use',
    steps: [
      { number: 1, name: 'Auth Started', event: INTEGRATION_EVENTS.AUTH_STARTED },
      { number: 2, name: 'Auth Completed', event: INTEGRATION_EVENTS.AUTH_COMPLETED },
      { number: 3, name: 'Integration Connected', event: INTEGRATION_EVENTS.CONNECTED },
      { number: 4, name: 'Integration Tested', event: INTEGRATION_EVENTS.TEST_PASSED },
      { number: 5, name: 'Used in Workflow', event: WORKFLOW_EVENTS.NODE_CONFIGURED },
    ],
  },
};

// =============================================================================
// Event Validation Helpers
// =============================================================================

export function isValidEvent(eventName: string): eventName is AnalyticsEventName {
  return Object.values(ANALYTICS_EVENTS).includes(eventName as AnalyticsEventName);
}

export function getEventCategory(eventName: AnalyticsEventName): EventCategory {
  if (Object.values(USER_EVENTS).includes(eventName as typeof USER_EVENTS[keyof typeof USER_EVENTS])) return 'user';
  if (Object.values(WORKFLOW_EVENTS).includes(eventName as typeof WORKFLOW_EVENTS[keyof typeof WORKFLOW_EVENTS])) return 'workflow';
  if (Object.values(TEMPLATE_EVENTS).includes(eventName as typeof TEMPLATE_EVENTS[keyof typeof TEMPLATE_EVENTS])) return 'template';
  if (Object.values(INTEGRATION_EVENTS).includes(eventName as typeof INTEGRATION_EVENTS[keyof typeof INTEGRATION_EVENTS])) return 'integration';
  if (Object.values(SUBSCRIPTION_EVENTS).includes(eventName as typeof SUBSCRIPTION_EVENTS[keyof typeof SUBSCRIPTION_EVENTS])) return 'subscription';
  if (Object.values(ONBOARDING_EVENTS).includes(eventName as typeof ONBOARDING_EVENTS[keyof typeof ONBOARDING_EVENTS])) return 'onboarding';
  if (Object.values(ENGAGEMENT_EVENTS).includes(eventName as typeof ENGAGEMENT_EVENTS[keyof typeof ENGAGEMENT_EVENTS])) return 'engagement';
  if (Object.values(ERROR_EVENTS).includes(eventName as typeof ERROR_EVENTS[keyof typeof ERROR_EVENTS])) return 'error';
  if (Object.values(PERFORMANCE_EVENTS).includes(eventName as typeof PERFORMANCE_EVENTS[keyof typeof PERFORMANCE_EVENTS])) return 'performance';
  return 'engagement'; // Default fallback
}

export default ANALYTICS_EVENTS;

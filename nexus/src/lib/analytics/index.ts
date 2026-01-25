/**
 * Analytics Module
 *
 * Main entry point for the analytics system.
 * Provides a privacy-first analytics solution with:
 * - Event tracking with batch uploads
 * - Session tracking
 * - Conversion funnels
 * - GDPR compliance
 * - Supabase integration
 */

// Core analytics - functions and constants
export {
  initializeAnalytics,
  getAnalytics,
  trackEvent,
  trackPageView,
  identifyUser,
  trackConversion,
  trackError,
  trackPerformance,
  resetAnalytics,
  updatePrivacySettings,
  getPrivacySettings,
  recordConsent,
  hasConsent,
  optOut,
  optIn,
  deleteUserData,
  exportUserData,
  DEFAULT_PRIVACY_SETTINGS,
} from './analytics';

// Core analytics - types
export type {
  AnalyticsConfig,
  AnalyticsProvider,
  PrivacySettings,
  UserIdentity,
  Session,
  AnalyticsEvent,
} from './analytics';

// Event definitions - constants and functions
export {
  ANALYTICS_EVENTS,
  USER_EVENTS,
  WORKFLOW_EVENTS,
  TEMPLATE_EVENTS,
  INTEGRATION_EVENTS,
  SUBSCRIPTION_EVENTS,
  ONBOARDING_EVENTS,
  ENGAGEMENT_EVENTS,
  ERROR_EVENTS,
  PERFORMANCE_EVENTS,
  CONVERSION_FUNNELS,
  isValidEvent,
  getEventCategory,
} from './events';

// Event definitions - types
export type {
  AnalyticsEventName,
  EventCategory,
  EventProperties,
  BaseEventProperties,
  UserEventProperties,
  WorkflowEventProperties,
  TemplateEventProperties,
  IntegrationEventProperties,
  SubscriptionEventProperties,
  OnboardingEventProperties,
  EngagementEventProperties,
  ErrorEventProperties,
  PerformanceEventProperties,
  FunnelStep,
  ConversionFunnel,
} from './events';

// React hooks - functions
export {
  useAnalytics,
  useTrackEvent,
  useTrackOnMount,
  useTrackOnClick,
  useTrackVisibility,
  useTrackTime,
  useTrackForm,
  useTrackScrollDepth,
  useTrackPerformance,
  useOnboardingTracking,
  useWorkflowTracking,
} from './hooks';

// React hooks - types
export type { UseAnalyticsReturn } from './hooks';

// Supabase analytics - functions and constants
export {
  getDashboardData,
  getActiveUsers,
  getDailyActiveUsersTimeSeries,
  getWorkflowStats,
  getWorkflowExecutionsTimeSeries,
  getFunnelData,
  getTopEvents,
  getPopularTemplates,
  getIntegrationUsage,
  getRecentActivity,
  getAverageTimeToFirstWorkflow,
  ANALYTICS_SCHEMA,
  AGGREGATION_FUNCTIONS,
} from './supabase-analytics';

// Supabase analytics - types
export type {
  AnalyticsMetrics,
  TimeSeriesData,
  FunnelData,
  TopEvent,
  DashboardData,
} from './supabase-analytics';

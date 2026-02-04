/**
 * Nexus React Hooks
 *
 * Centralized exports for all custom React hooks.
 */

// Swipe Gesture hooks (Loop 18 - Interaction Polish)
export {
  useSwipeGesture,
  useIsTouchDevice,
  type SwipeGestureOptions,
  type SwipeState,
  type SwipeGestureReturn,
  type SwipeIndicatorProps
} from './useSwipeGesture'

// Tool Catalog hooks (Epic 16, Story 16.1)
export { useToolCatalog, useTool, useToolSearch } from './useToolCatalog'
export { useAdminToolCatalog } from './useAdminToolCatalog'

// Tool Discovery hooks (Epic 16, Story 16.2)
export {
  useToolDiscovery,
  useToolDiscoverySearch,
  useToolApprovalStatus
} from './useToolDiscovery'

// Tool Chain Optimizer hooks (Epic 16, Story 16.3)
export {
  useToolChainOptimizer,
  useWorkflowAnalysis,
  useChainComparison
} from './useToolChainOptimizer'

// Schema Analyzer hooks (Epic 16, Story 16.4)
export {
  useSchemaAnalyzer,
  useTransformationPreview,
  useTransformationCode,
  useFieldMappings
} from './useSchemaAnalyzer'

// Dynamic Integration Connector hooks (Epic 16, Story 16.5)
export {
  useDynamicConnector,
  useConnectionStatus,
  useChainProgress,
  useDataFlowStatus
} from './useDynamicConnector'

// Self-Healing hooks (Epic 16, Story 16.6)
export {
  useSelfHealing,
  useHealingProgress,
  useCircuitBreakerStatus,
  useEscalationOptions,
  useHealingMetrics,
  useAutoHealing
} from './useSelfHealing'

// MCP Integration hooks (Epic 16, Story 16.7)
export {
  useMCPIntegration,
  useMCPTools,
  useMCPConnectionStatus,
  useMCPServerHealth,
  useMCPMetrics,
  useMCPSession,
  useMCPServers
} from './useMCPIntegration'

// Autonomous Execution hooks (Epic 16, Story 16.8)
export {
  useAutonomousExecution,
  useExecutionProgress,
  useCriticalErrors,
  useExecutionLog,
  usePartialResults,
  useExecutionMetrics,
  useRunningExecutions
} from './useAutonomousExecution'

// Tool Chain Visualization hooks (Epic 16, Story 16.9)
export {
  useToolChainVisualization,
  useNodeStatus,
  useVisualizationChainProgress,
  useNodeDetails,
  useSelfHealingStatus,
  useExecutionPath,
  useVisualizationConfig
} from './useToolChainVisualization'

// Accessibility hooks (Loop 26)
export { useFocusTrap, useFocusReturn } from './useFocusTrap'

// Mobile Experience hooks (Loop 25)
export {
  usePullToRefresh,
  PullToRefreshIndicator,
  type PullToRefreshState
} from './usePullToRefresh'

export {
  useHaptics,
  triggerHaptic,
  triggerHapticPattern,
  withHaptic,
  withHapticPattern,
  type HapticIntensity,
  type HapticPattern
} from './useHaptics'

// Debouncing hooks (Loop 31 - Data Validation & Sanitization)
export {
  useDebounce,
  useDebouncedState,
  useDebouncedCallback,
  useThrottle,
  useDebounceEffect,
  DEFAULT_DEBOUNCE_DELAY
} from './useDebounce'

// Auto-save hook for form drafts (Loop 17 - Forms & Reliability)
export {
  useAutoSave,
  DraftSavedIndicator,
  DraftRestorationDialog
} from './useAutoSave'

// Network status hook (Error Handling)
export { useNetworkStatus, OfflineBanner } from './useNetworkStatus'

// Async error handling hooks (Error Handling Loop 2)
export {
  useAsyncError,
  useAsyncFetch,
  useAsyncMutation,
  type AsyncState,
  type UseAsyncErrorOptions,
  type UseAsyncErrorReturn
} from './useAsyncError'

// Error Reporting hooks (Production Error Tracking)
export {
  useErrorReporting,
  useComponentErrorTracker,
  useAsyncTracking,
  type UseErrorReportingOptions,
  type PerformanceTimer,
  type UserFeedback,
  type UseErrorReportingReturn
} from './useErrorReporting'

// Browser Compatibility hooks (Cross-browser support)
export {
  useBrowserCompat,
  useIsIOS,
  useIsAndroid,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useBrowserName,
  useFeatureSupport,
  useSmoothScroll,
  useViewportHeight,
  useSafeAreaInsets,
  useHasTouch,
  useBackdropFilterSupport,
  useFlexGapSupport,
  usePlatformClasses,
  useBreakpoint,
  useMediaQuery,
  usePrefersReducedMotion,
  usePrefersHighContrast,
  usePrefersDarkMode,
  type BrowserInfo,
  type FeatureSupport
} from './useBrowserCompat'

// Batched Request hooks (API Optimization)
export {
  useBatchedRequest,
  useBatchedRequests,
  useDashboardData,
  useWorkflowStatus,
  useWorkflowStatuses,
  useBatchedMutation,
  requestBatcher,
  type BatchedRequestState,
  type BatchedRequestOptions,
  type BatchedRequestReturn
} from './useBatchedRequest'

// Image Preloading hooks (Performance Optimization - LCP)
export {
  useImagePreload,
  usePreloadCriticalImages,
  useLazyImagePreload,
  preloadImage,
  preloadImages
} from './useImagePreload'

// Cached Query hooks (Caching Strategy)
export {
  useCachedQuery,
  useCachedMutation,
  usePrefetch,
  useIsCached,
  useCacheStats,
  CacheTTL,
  StaleTime,
  CacheKeys,
  apiCache,
  createCacheKey,
  invalidateUserCache,
  invalidateWorkflowCache,
  type UseCachedQueryOptions,
  type UseCachedQueryResult,
  type UseCachedMutationOptions,
  type UseCachedMutationResult
} from './useCachedQuery'

// Performance Monitoring hooks (Production Health)
export {
  usePerformanceMonitor,
  useComponentLifecycle,
  useMonitoringSubscription,
  useHealthStatus,
  useAPIStats,
  useWebVitals,
  useMemoryMetrics,
  type RenderMetrics,
  type InteractionMetrics,
  type PerformanceMonitorConfig,
  type UsePerformanceMonitorReturn
} from './usePerformanceMonitor'

// Voice Input hooks (Voice Workflow)
export { useWorkflowVoice } from './useWorkflowVoice'
export { useVoiceInput } from './useVoiceInput'
export { useMeetingVoice } from './useMeetingVoice'

// Auto-OAuth hooks (Seamless Authentication)
export {
  useAutoOAuth,
  useServiceConnection,
  type UseAutoOAuthOptions,
  type UseAutoOAuthReturn
} from './useAutoOAuth'

// Trial Management hooks (Subscription)
export {
  useTrial,
  useCanStartTrial,
  useTrialProgress,
  useTrialUsageSummary,
  type TrialStatus,
  type TrialInfo,
  type TrialUsageMetrics,
  type TrialState,
  type TrialActions,
  type TrialNotifications,
  type UseTrialReturn
} from './useTrial'

// AI Suggestions hooks (Quality-First AI Recommendations)
export {
  useAISuggestions,
  type AISuggestion,
  type SuggestionStats,
  type UserIntelligence,
  type DetectedPattern
} from './useAISuggestions'

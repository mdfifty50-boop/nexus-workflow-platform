/**
 * Usage Tracking System
 *
 * Comprehensive usage tracking and metering system for billing and limits.
 *
 * Modules:
 * - usage-types: Type definitions for all usage-related data
 * - usage-metrics: Metric definitions and utilities
 * - usage-tracker: Real-time usage tracking
 * - usage-aggregator: Period-based aggregation
 * - limit-enforcer: Limit enforcement
 * - usage-alerts: Alert system
 */

// Types
export type {
  MetricType,
  PeriodType,
  AlertType,
  AlertSeverityType,
  TierName,
  UsageMetric,
  UsagePeriod,
  UsageSnapshot,
  UsageSnapshotData,
  UsageAlert,
  UsageThreshold,
  ThresholdConfig,
  AggregatedUsage,
  AggregatedUsageData,
  AggregatedMetric,
  AggregatedMetricData,
  TierLimits,
  TierLimitsData,
  UsageEvent,
  UsageReport,
  LimitCheckResult,
  OverageResult,
  UsageHistoryEntry,
  UsageHistory,
} from './usage-types';

// Type constants
export {
  MetricTypes,
  PeriodTypes,
  AlertTypes,
  AlertSeverity,
  TierNames,
  DEFAULT_TIER_LIMITS,
  DEFAULT_ALERT_THRESHOLDS,
  mapToRecord,
  recordToMap,
} from './usage-types';

// Metrics
export type {
  MetricDefinition,
  MetricCategory,
  MetricDisplayInfo,
} from './usage-metrics';

export {
  MetricCategories,
  METRIC_DEFINITIONS,
  getAllMetricTypes,
  getMetricDefinition,
  isCounterMetric,
  isGaugeMetric,
  getMetricsByCategory,
  getMetricsForResetPeriod,
  getMetricLimit,
  getOverageRate,
  isOverageAllowed,
  getTierLimits,
  getAllTierNames,
  formatMetricValue,
  formatBytes,
  parseMetricType,
  validateMetricValue,
  getDefaultMetricValue,
  calculateUsagePercent,
  calculateOverage,
  getMetricDisplayInfo,
} from './usage-metrics';

// Tracker
export type {
  UsageStorage,
  UsageEventListener,
  ThresholdCallback,
} from './usage-tracker';

export {
  InMemoryUsageStorage,
  UsageTracker,
  createUsageTracker,
  createUsageTrackerWithStorage,
} from './usage-tracker';

// Aggregator
export type {
  AggregatorConfig,
  UsageComparison,
} from './usage-aggregator';

export {
  UsageAggregator,
  createUsageAggregator,
  compareUsage,
  generateUsageSummary,
} from './usage-aggregator';

// Limit Enforcer
export type {
  EnforcerConfig,
} from './limit-enforcer';

export {
  LimitExceededError,
  QuotaExhaustedError,
  LimitEnforcer,
  createLimitEnforcer,
  formatLimitStatus,
  getRecommendedUpgradeTier,
} from './limit-enforcer';

// Alerts
export type {
  AlertHandler,
  AlertChannel,
  AlertStorage,
} from './usage-alerts';

export {
  AlertChannels,
  InMemoryAlertStorage,
  UsageAlerts,
  createUsageAlerts,
  formatAlertForDisplay,
  getAlertPriority,
  sortAlertsByPriority,
} from './usage-alerts';

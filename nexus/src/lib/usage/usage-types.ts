/**
 * Usage Types
 *
 * Type definitions for the usage tracking and metering system.
 * Defines all metrics, periods, snapshots, alerts, and aggregations.
 */

// Use const objects instead of enums per TypeScript rules
export const MetricTypes = {
  WORKFLOW_EXECUTIONS: 'workflow_executions',
  WORKFLOW_NODES_EXECUTED: 'workflow_nodes_executed',
  API_CALLS: 'api_calls',
  STORAGE_BYTES: 'storage_bytes',
  INTEGRATION_CALLS: 'integration_calls',
  AI_SUGGESTIONS_USED: 'ai_suggestions_used',
  WEBHOOK_EVENTS: 'webhook_events',
  TEAM_MEMBERS: 'team_members',
  ACTIVE_WORKFLOWS: 'active_workflows',
} as const;

export type MetricType = typeof MetricTypes[keyof typeof MetricTypes];

export const PeriodTypes = {
  DAILY: 'daily',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export type PeriodType = typeof PeriodTypes[keyof typeof PeriodTypes];

export const AlertTypes = {
  THRESHOLD_50: 'threshold_50',
  THRESHOLD_80: 'threshold_80',
  THRESHOLD_90: 'threshold_90',
  LIMIT_REACHED: 'limit_reached',
  OVERAGE_DETECTED: 'overage_detected',
} as const;

export type AlertType = typeof AlertTypes[keyof typeof AlertTypes];

export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;

export type AlertSeverityType = typeof AlertSeverity[keyof typeof AlertSeverity];

export const TierNames = {
  FREE: 'free',
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
} as const;

export type TierName = typeof TierNames[keyof typeof TierNames];

/**
 * Usage metric with current value and metadata
 */
export interface UsageMetric {
  readonly id: string;
  readonly userId: string;
  readonly metricType: MetricType;
  readonly value: number;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly periodType: PeriodType;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Usage period definition
 */
export interface UsagePeriod {
  readonly type: PeriodType;
  readonly start: Date;
  readonly end: Date;
  readonly isCurrentPeriod: boolean;
}

/**
 * Point-in-time usage snapshot
 */
export interface UsageSnapshot {
  readonly id: string;
  readonly userId: string;
  readonly timestamp: Date;
  readonly metrics: ReadonlyMap<MetricType, number>;
  readonly periodType: PeriodType;
  readonly periodStart: Date;
  readonly periodEnd: Date;
}

/**
 * Serializable version of UsageSnapshot for storage
 */
export interface UsageSnapshotData {
  readonly id: string;
  readonly userId: string;
  readonly timestamp: string;
  readonly metrics: Record<MetricType, number>;
  readonly periodType: PeriodType;
  readonly periodStart: string;
  readonly periodEnd: string;
}

/**
 * Usage alert notification
 */
export interface UsageAlert {
  readonly id: string;
  readonly userId: string;
  readonly alertType: AlertType;
  readonly metricType: MetricType;
  readonly severity: AlertSeverityType;
  readonly message: string;
  readonly currentValue: number;
  readonly thresholdValue: number;
  readonly limitValue: number;
  readonly createdAt: Date;
  readonly acknowledged: boolean;
  readonly acknowledgedAt?: Date;
}

/**
 * User-configurable alert threshold
 */
export interface UsageThreshold {
  readonly metricType: MetricType;
  readonly thresholdPercent: number;
  readonly enabled: boolean;
  readonly notifyEmail: boolean;
  readonly notifyInApp: boolean;
  readonly notifyWebhook: boolean;
  readonly webhookUrl?: string;
}

/**
 * User's threshold configuration
 */
export interface ThresholdConfig {
  readonly userId: string;
  readonly thresholds: readonly UsageThreshold[];
  readonly globalEmailNotifications: boolean;
  readonly globalInAppNotifications: boolean;
  readonly updatedAt: Date;
}

/**
 * Aggregated usage data for a period
 */
export interface AggregatedUsage {
  readonly userId: string;
  readonly periodType: PeriodType;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly metrics: ReadonlyMap<MetricType, AggregatedMetric>;
  readonly totalCost: number;
  readonly overageCost: number;
  readonly generatedAt: Date;
}

/**
 * Serializable version of AggregatedUsage
 */
export interface AggregatedUsageData {
  readonly userId: string;
  readonly periodType: PeriodType;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly metrics: Record<MetricType, AggregatedMetricData>;
  readonly totalCost: number;
  readonly overageCost: number;
  readonly generatedAt: string;
}

/**
 * Aggregated data for a single metric
 */
export interface AggregatedMetric {
  readonly metricType: MetricType;
  readonly total: number;
  readonly average: number;
  readonly peak: number;
  readonly peakTimestamp: Date;
  readonly limit: number;
  readonly usagePercent: number;
  readonly isOverLimit: boolean;
  readonly overageAmount: number;
}

/**
 * Serializable version of AggregatedMetric
 */
export interface AggregatedMetricData {
  readonly metricType: MetricType;
  readonly total: number;
  readonly average: number;
  readonly peak: number;
  readonly peakTimestamp: string;
  readonly limit: number;
  readonly usagePercent: number;
  readonly isOverLimit: boolean;
  readonly overageAmount: number;
}

/**
 * Tier limits configuration
 */
export interface TierLimits {
  readonly tierName: TierName;
  readonly limits: ReadonlyMap<MetricType, number>;
  readonly overageAllowed: boolean;
  readonly overageRates: ReadonlyMap<MetricType, number>;
}

/**
 * Serializable version of TierLimits
 */
export interface TierLimitsData {
  readonly tierName: TierName;
  readonly limits: Record<MetricType, number>;
  readonly overageAllowed: boolean;
  readonly overageRates: Record<MetricType, number>;
}

/**
 * Usage tracking event
 */
export interface UsageEvent {
  readonly id: string;
  readonly userId: string;
  readonly metricType: MetricType;
  readonly delta: number;
  readonly timestamp: Date;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Usage report for a user
 */
export interface UsageReport {
  readonly userId: string;
  readonly generatedAt: Date;
  readonly currentPeriod: AggregatedUsage;
  readonly previousPeriod?: AggregatedUsage;
  readonly alerts: readonly UsageAlert[];
  readonly recommendations: readonly string[];
}

/**
 * Limit check result
 */
export interface LimitCheckResult {
  readonly allowed: boolean;
  readonly metricType: MetricType;
  readonly currentValue: number;
  readonly limitValue: number;
  readonly remainingQuota: number;
  readonly usagePercent: number;
  readonly nextResetDate: Date;
  readonly overageAllowed: boolean;
}

/**
 * Overage calculation result
 */
export interface OverageResult {
  readonly metricType: MetricType;
  readonly overageAmount: number;
  readonly overageRate: number;
  readonly overageCost: number;
  readonly tierName: TierName;
}

/**
 * Usage history entry
 */
export interface UsageHistoryEntry {
  readonly date: Date;
  readonly metrics: ReadonlyMap<MetricType, number>;
}

/**
 * Usage history result
 */
export interface UsageHistory {
  readonly userId: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly entries: readonly UsageHistoryEntry[];
  readonly totalByMetric: ReadonlyMap<MetricType, number>;
}

/**
 * Default tier limits configuration
 */
export const DEFAULT_TIER_LIMITS: Record<TierName, TierLimitsData> = {
  free: {
    tierName: TierNames.FREE,
    limits: {
      workflow_executions: 100,
      workflow_nodes_executed: 1000,
      api_calls: 500,
      storage_bytes: 100 * 1024 * 1024, // 100 MB
      integration_calls: 200,
      ai_suggestions_used: 50,
      webhook_events: 100,
      team_members: 1,
      active_workflows: 5,
    },
    overageAllowed: false,
    overageRates: {
      workflow_executions: 0,
      workflow_nodes_executed: 0,
      api_calls: 0,
      storage_bytes: 0,
      integration_calls: 0,
      ai_suggestions_used: 0,
      webhook_events: 0,
      team_members: 0,
      active_workflows: 0,
    },
  },
  starter: {
    tierName: TierNames.STARTER,
    limits: {
      workflow_executions: 1000,
      workflow_nodes_executed: 10000,
      api_calls: 5000,
      storage_bytes: 1024 * 1024 * 1024, // 1 GB
      integration_calls: 2000,
      ai_suggestions_used: 500,
      webhook_events: 1000,
      team_members: 5,
      active_workflows: 25,
    },
    overageAllowed: true,
    overageRates: {
      workflow_executions: 0.01,
      workflow_nodes_executed: 0.001,
      api_calls: 0.001,
      storage_bytes: 0.0000001, // per byte
      integration_calls: 0.005,
      ai_suggestions_used: 0.02,
      webhook_events: 0.005,
      team_members: 10,
      active_workflows: 2,
    },
  },
  professional: {
    tierName: TierNames.PROFESSIONAL,
    limits: {
      workflow_executions: 10000,
      workflow_nodes_executed: 100000,
      api_calls: 50000,
      storage_bytes: 10 * 1024 * 1024 * 1024, // 10 GB
      integration_calls: 20000,
      ai_suggestions_used: 5000,
      webhook_events: 10000,
      team_members: 25,
      active_workflows: 100,
    },
    overageAllowed: true,
    overageRates: {
      workflow_executions: 0.008,
      workflow_nodes_executed: 0.0008,
      api_calls: 0.0008,
      storage_bytes: 0.00000008,
      integration_calls: 0.004,
      ai_suggestions_used: 0.015,
      webhook_events: 0.004,
      team_members: 8,
      active_workflows: 1.5,
    },
  },
  enterprise: {
    tierName: TierNames.ENTERPRISE,
    limits: {
      workflow_executions: 100000,
      workflow_nodes_executed: 1000000,
      api_calls: 500000,
      storage_bytes: 100 * 1024 * 1024 * 1024, // 100 GB
      integration_calls: 200000,
      ai_suggestions_used: 50000,
      webhook_events: 100000,
      team_members: -1, // unlimited
      active_workflows: -1, // unlimited
    },
    overageAllowed: true,
    overageRates: {
      workflow_executions: 0.005,
      workflow_nodes_executed: 0.0005,
      api_calls: 0.0005,
      storage_bytes: 0.00000005,
      integration_calls: 0.003,
      ai_suggestions_used: 0.01,
      webhook_events: 0.003,
      team_members: 5,
      active_workflows: 1,
    },
  },
};

/**
 * Default alert thresholds
 */
export const DEFAULT_ALERT_THRESHOLDS: readonly number[] = [50, 80, 90, 100];

/**
 * Helper to convert Map to Record for serialization
 */
export function mapToRecord<K extends string, V>(map: ReadonlyMap<K, V>): Record<K, V> {
  const record = {} as Record<K, V>;
  map.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

/**
 * Helper to convert Record to Map for deserialization
 */
export function recordToMap<K extends string, V>(record: Record<K, V>): Map<K, V> {
  return new Map(Object.entries(record) as [K, V][]);
}

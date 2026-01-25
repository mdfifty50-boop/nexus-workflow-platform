/**
 * Usage Metrics
 *
 * Defines and manages tracked metrics for the usage tracking system.
 * Provides metric definitions, validation, and metadata.
 */

import type {
  MetricType,
  PeriodType,
  TierName,
  TierLimitsData,
} from './usage-types';

import {
  MetricTypes,
  PeriodTypes,
  TierNames,
  DEFAULT_TIER_LIMITS,
} from './usage-types';

/**
 * Metric definition with metadata
 */
export interface MetricDefinition {
  readonly type: MetricType;
  readonly name: string;
  readonly description: string;
  readonly unit: string;
  readonly isCounter: boolean; // true = accumulates, false = gauge (current value)
  readonly resetPeriod: PeriodType | null; // null = never resets (gauge)
  readonly category: MetricCategory;
}

export const MetricCategories = {
  EXECUTION: 'execution',
  STORAGE: 'storage',
  INTEGRATION: 'integration',
  AI: 'ai',
  TEAM: 'team',
} as const;

export type MetricCategory = typeof MetricCategories[keyof typeof MetricCategories];

/**
 * All metric definitions
 */
export const METRIC_DEFINITIONS: ReadonlyMap<MetricType, MetricDefinition> = new Map([
  [
    MetricTypes.WORKFLOW_EXECUTIONS,
    {
      type: MetricTypes.WORKFLOW_EXECUTIONS,
      name: 'Workflow Executions',
      description: 'Number of workflow runs completed',
      unit: 'executions',
      isCounter: true,
      resetPeriod: PeriodTypes.MONTHLY,
      category: MetricCategories.EXECUTION,
    },
  ],
  [
    MetricTypes.WORKFLOW_NODES_EXECUTED,
    {
      type: MetricTypes.WORKFLOW_NODES_EXECUTED,
      name: 'Nodes Executed',
      description: 'Total number of workflow nodes processed',
      unit: 'nodes',
      isCounter: true,
      resetPeriod: PeriodTypes.MONTHLY,
      category: MetricCategories.EXECUTION,
    },
  ],
  [
    MetricTypes.API_CALLS,
    {
      type: MetricTypes.API_CALLS,
      name: 'API Calls',
      description: 'Number of API requests made',
      unit: 'calls',
      isCounter: true,
      resetPeriod: PeriodTypes.MONTHLY,
      category: MetricCategories.EXECUTION,
    },
  ],
  [
    MetricTypes.STORAGE_BYTES,
    {
      type: MetricTypes.STORAGE_BYTES,
      name: 'Storage Used',
      description: 'Total storage space consumed',
      unit: 'bytes',
      isCounter: false, // Gauge - current total
      resetPeriod: null,
      category: MetricCategories.STORAGE,
    },
  ],
  [
    MetricTypes.INTEGRATION_CALLS,
    {
      type: MetricTypes.INTEGRATION_CALLS,
      name: 'Integration Calls',
      description: 'Number of third-party integration requests',
      unit: 'calls',
      isCounter: true,
      resetPeriod: PeriodTypes.MONTHLY,
      category: MetricCategories.INTEGRATION,
    },
  ],
  [
    MetricTypes.AI_SUGGESTIONS_USED,
    {
      type: MetricTypes.AI_SUGGESTIONS_USED,
      name: 'AI Suggestions',
      description: 'Number of AI-powered suggestions consumed',
      unit: 'suggestions',
      isCounter: true,
      resetPeriod: PeriodTypes.MONTHLY,
      category: MetricCategories.AI,
    },
  ],
  [
    MetricTypes.WEBHOOK_EVENTS,
    {
      type: MetricTypes.WEBHOOK_EVENTS,
      name: 'Webhook Events',
      description: 'Number of incoming webhook events processed',
      unit: 'events',
      isCounter: true,
      resetPeriod: PeriodTypes.MONTHLY,
      category: MetricCategories.INTEGRATION,
    },
  ],
  [
    MetricTypes.TEAM_MEMBERS,
    {
      type: MetricTypes.TEAM_MEMBERS,
      name: 'Team Members',
      description: 'Current number of team members',
      unit: 'members',
      isCounter: false, // Gauge - current count
      resetPeriod: null,
      category: MetricCategories.TEAM,
    },
  ],
  [
    MetricTypes.ACTIVE_WORKFLOWS,
    {
      type: MetricTypes.ACTIVE_WORKFLOWS,
      name: 'Active Workflows',
      description: 'Number of enabled workflows',
      unit: 'workflows',
      isCounter: false, // Gauge - current count
      resetPeriod: null,
      category: MetricCategories.TEAM,
    },
  ],
]);

/**
 * Get all metric types
 */
export function getAllMetricTypes(): readonly MetricType[] {
  return Object.values(MetricTypes);
}

/**
 * Get metric definition
 */
export function getMetricDefinition(metricType: MetricType): MetricDefinition | undefined {
  return METRIC_DEFINITIONS.get(metricType);
}

/**
 * Check if metric is a counter (accumulates)
 */
export function isCounterMetric(metricType: MetricType): boolean {
  const definition = METRIC_DEFINITIONS.get(metricType);
  return definition?.isCounter ?? false;
}

/**
 * Check if metric is a gauge (current value)
 */
export function isGaugeMetric(metricType: MetricType): boolean {
  return !isCounterMetric(metricType);
}

/**
 * Get metrics by category
 */
export function getMetricsByCategory(category: MetricCategory): readonly MetricType[] {
  const metrics: MetricType[] = [];
  METRIC_DEFINITIONS.forEach((definition, metricType) => {
    if (definition.category === category) {
      metrics.push(metricType);
    }
  });
  return metrics;
}

/**
 * Get metrics that reset in a given period
 */
export function getMetricsForResetPeriod(period: PeriodType): readonly MetricType[] {
  const metrics: MetricType[] = [];
  METRIC_DEFINITIONS.forEach((definition, metricType) => {
    if (definition.resetPeriod === period) {
      metrics.push(metricType);
    }
  });
  return metrics;
}

/**
 * Get limit for a metric based on tier
 */
export function getMetricLimit(metricType: MetricType, tierName: TierName): number {
  const tierLimits = DEFAULT_TIER_LIMITS[tierName];
  return tierLimits?.limits[metricType] ?? 0;
}

/**
 * Get overage rate for a metric based on tier
 */
export function getOverageRate(metricType: MetricType, tierName: TierName): number {
  const tierLimits = DEFAULT_TIER_LIMITS[tierName];
  return tierLimits?.overageRates[metricType] ?? 0;
}

/**
 * Check if overage is allowed for a tier
 */
export function isOverageAllowed(tierName: TierName): boolean {
  const tierLimits = DEFAULT_TIER_LIMITS[tierName];
  return tierLimits?.overageAllowed ?? false;
}

/**
 * Get tier limits
 */
export function getTierLimits(tierName: TierName): TierLimitsData {
  return DEFAULT_TIER_LIMITS[tierName];
}

/**
 * Get all tier names
 */
export function getAllTierNames(): readonly TierName[] {
  return Object.values(TierNames);
}

/**
 * Format metric value with appropriate unit
 */
export function formatMetricValue(metricType: MetricType, value: number): string {
  const definition = METRIC_DEFINITIONS.get(metricType);
  if (!definition) {
    return value.toString();
  }

  // Special formatting for storage bytes
  if (metricType === MetricTypes.STORAGE_BYTES) {
    return formatBytes(value);
  }

  // Format with commas for large numbers
  const formattedValue = value.toLocaleString();
  return `${formattedValue} ${definition.unit}`;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Parse metric type from string
 */
export function parseMetricType(value: string): MetricType | undefined {
  const allTypes = getAllMetricTypes();
  return allTypes.find((type) => type === value);
}

/**
 * Validate metric value
 */
export function validateMetricValue(metricType: MetricType, value: number): boolean {
  // All metrics must be non-negative
  if (value < 0) {
    return false;
  }

  // Integer check for non-storage metrics
  if (metricType !== MetricTypes.STORAGE_BYTES && !Number.isInteger(value)) {
    return false;
  }

  return true;
}

/**
 * Get default initial value for a metric
 */
export function getDefaultMetricValue(metricType: MetricType): number {
  void metricType; // Unused parameter pattern
  return 0;
}

/**
 * Calculate usage percentage
 */
export function calculateUsagePercent(current: number, limit: number): number {
  if (limit <= 0) {
    // Unlimited (-1) or invalid limit
    return 0;
  }
  return Math.min((current / limit) * 100, 100);
}

/**
 * Calculate overage amount
 */
export function calculateOverage(current: number, limit: number): number {
  if (limit <= 0) {
    // Unlimited or invalid
    return 0;
  }
  return Math.max(current - limit, 0);
}

/**
 * Get metric display info
 */
export interface MetricDisplayInfo {
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly color: string;
}

const METRIC_DISPLAY_INFO: Record<MetricType, MetricDisplayInfo> = {
  workflow_executions: {
    name: 'Workflow Executions',
    description: 'Number of workflow runs',
    icon: 'play-circle',
    color: '#3B82F6', // blue
  },
  workflow_nodes_executed: {
    name: 'Nodes Executed',
    description: 'Total nodes processed',
    icon: 'git-branch',
    color: '#8B5CF6', // purple
  },
  api_calls: {
    name: 'API Calls',
    description: 'API requests made',
    icon: 'globe',
    color: '#10B981', // green
  },
  storage_bytes: {
    name: 'Storage',
    description: 'Storage space used',
    icon: 'database',
    color: '#F59E0B', // amber
  },
  integration_calls: {
    name: 'Integration Calls',
    description: 'Third-party API calls',
    icon: 'plug',
    color: '#EF4444', // red
  },
  ai_suggestions_used: {
    name: 'AI Suggestions',
    description: 'AI features used',
    icon: 'sparkles',
    color: '#EC4899', // pink
  },
  webhook_events: {
    name: 'Webhook Events',
    description: 'Incoming webhooks',
    icon: 'webhook',
    color: '#06B6D4', // cyan
  },
  team_members: {
    name: 'Team Members',
    description: 'Active team members',
    icon: 'users',
    color: '#6366F1', // indigo
  },
  active_workflows: {
    name: 'Active Workflows',
    description: 'Enabled workflows',
    icon: 'workflow',
    color: '#14B8A6', // teal
  },
};

/**
 * Get display info for a metric
 */
export function getMetricDisplayInfo(metricType: MetricType): MetricDisplayInfo {
  return METRIC_DISPLAY_INFO[metricType];
}

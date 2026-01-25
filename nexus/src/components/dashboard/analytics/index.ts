/**
 * Dashboard Analytics Components Barrel Export
 *
 * Exports all analytics visualization components for the customer dashboard.
 * Usage: import { ExecutionChart, UsageGauge, ... } from '@/components/dashboard/analytics'
 */

// =============================================================================
// Components
// =============================================================================

export { ExecutionChart } from './ExecutionChart'
export { UsageGauge, UsageGaugeCompact } from './UsageGauge'
export { WorkflowLeaderboard } from './WorkflowLeaderboard'
export { InsightsPanel } from './InsightsPanel'
export { MetricTrend, MetricTrendCompact, MetricTrendArrow } from './MetricTrend'

// =============================================================================
// Types
// =============================================================================

export type {
  // Time Period Types
  TimePeriod,

  // Trend Types
  TrendDirection,
  TrendData,

  // Execution Types
  ExecutionDataPoint,
  ExecutionStats,
  ExecutionChartProps,

  // Usage Gauge Types
  UsageStatus,
  UsageGaugeProps,

  // Workflow Leaderboard Types
  WorkflowPerformance,
  LeaderboardSort,
  WorkflowLeaderboardProps,

  // Insights Types
  InsightSeverity,
  InsightCategory,
  Insight,
  InsightsPanelProps,

  // Metric Trend Types
  MetricTrendProps,

  // Chart Types
  ChartColors,

  // State Types
  EmptyStateConfig,
  LoadingStateConfig,
} from './analytics-types'

// =============================================================================
// Constants
// =============================================================================

export {
  TIME_PERIODS,
  TREND_DIRECTIONS,
  USAGE_STATUS,
  LEADERBOARD_SORT,
  INSIGHT_SEVERITY,
  INSIGHT_CATEGORY,
  DEFAULT_CHART_COLORS,
} from './analytics-types'

/**
 * Analytics Types
 *
 * Type definitions for all dashboard analytics components.
 * Provides consistent type safety across the analytics module.
 */

// =============================================================================
// Time Period Types
// =============================================================================

/**
 * Time period options for analytics data filtering
 */
export const TIME_PERIODS = {
  SEVEN_DAYS: '7d',
  THIRTY_DAYS: '30d',
  NINETY_DAYS: '90d',
} as const

export type TimePeriod = (typeof TIME_PERIODS)[keyof typeof TIME_PERIODS]

// =============================================================================
// Trend Types
// =============================================================================

/**
 * Trend direction indicators
 */
export const TREND_DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  NEUTRAL: 'neutral',
} as const

export type TrendDirection = (typeof TREND_DIRECTIONS)[keyof typeof TREND_DIRECTIONS]

/**
 * Trend data for metric comparisons
 */
export interface TrendData {
  direction: TrendDirection
  percentage: number
  comparisonPeriod: string
  previousValue?: number
  currentValue?: number
}

// =============================================================================
// Execution Data Types
// =============================================================================

/**
 * Single execution data point for charts
 */
export interface ExecutionDataPoint {
  date: string
  timestamp: number
  total: number
  successful: number
  failed: number
}

/**
 * Aggregated execution statistics
 */
export interface ExecutionStats {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  successRate: number
  averagePerDay: number
}

/**
 * Props for the ExecutionChart component
 */
export interface ExecutionChartProps {
  /** Optional data override, otherwise generates mock data */
  data?: ExecutionDataPoint[]
  /** Time period for data display */
  period?: TimePeriod
  /** Callback when period changes */
  onPeriodChange?: (period: TimePeriod) => void
  /** Show loading skeleton */
  isLoading?: boolean
  /** Additional CSS classes */
  className?: string
}

// =============================================================================
// Usage Gauge Types
// =============================================================================

/**
 * Usage status levels for gauge coloring
 */
export const USAGE_STATUS = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const

export type UsageStatus = (typeof USAGE_STATUS)[keyof typeof USAGE_STATUS]

/**
 * Props for the UsageGauge component
 */
export interface UsageGaugeProps {
  /** Current usage value */
  current: number
  /** Maximum limit value */
  limit: number
  /** Label for the metric */
  label: string
  /** Unit suffix (e.g., "executions", "workflows") */
  unit?: string
  /** Animation duration in ms */
  animationDuration?: number
  /** Warning threshold percentage (default 70) */
  warningThreshold?: number
  /** Critical threshold percentage (default 90) */
  criticalThreshold?: number
  /** Show loading skeleton */
  isLoading?: boolean
  /** Additional CSS classes */
  className?: string
}

// =============================================================================
// Workflow Leaderboard Types
// =============================================================================

/**
 * Individual workflow performance data
 */
export interface WorkflowPerformance {
  id: string
  name: string
  executionCount: number
  successRate: number
  timeSavedMinutes: number
  recentTrend: number[]
  lastExecuted?: string
}

/**
 * Sort options for leaderboard
 */
export const LEADERBOARD_SORT = {
  EXECUTIONS: 'executions',
  SUCCESS_RATE: 'successRate',
  TIME_SAVED: 'timeSaved',
} as const

export type LeaderboardSort = (typeof LEADERBOARD_SORT)[keyof typeof LEADERBOARD_SORT]

/**
 * Props for the WorkflowLeaderboard component
 */
export interface WorkflowLeaderboardProps {
  /** Optional data override, otherwise generates mock data */
  workflows?: WorkflowPerformance[]
  /** Maximum items to display */
  maxItems?: number
  /** Initial sort option */
  sortBy?: LeaderboardSort
  /** Callback when workflow is clicked */
  onWorkflowClick?: (workflowId: string) => void
  /** Show loading skeleton */
  isLoading?: boolean
  /** Additional CSS classes */
  className?: string
}

// =============================================================================
// Insights Types
// =============================================================================

/**
 * Insight severity levels
 */
export const INSIGHT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  SUCCESS: 'success',
} as const

export type InsightSeverity = (typeof INSIGHT_SEVERITY)[keyof typeof INSIGHT_SEVERITY]

/**
 * Insight categories
 */
export const INSIGHT_CATEGORY = {
  PERFORMANCE: 'performance',
  OPTIMIZATION: 'optimization',
  ANOMALY: 'anomaly',
  TREND: 'trend',
  RECOMMENDATION: 'recommendation',
} as const

export type InsightCategory = (typeof INSIGHT_CATEGORY)[keyof typeof INSIGHT_CATEGORY]

/**
 * Individual insight item
 */
export interface Insight {
  id: string
  title: string
  description: string
  severity: InsightSeverity
  category: InsightCategory
  actionLabel?: string
  actionUrl?: string
  timestamp: string
  isNew?: boolean
  metadata?: Record<string, unknown>
}

/**
 * Props for the InsightsPanel component
 */
export interface InsightsPanelProps {
  /** Optional insights override, otherwise generates mock data */
  insights?: Insight[]
  /** Maximum insights to display */
  maxItems?: number
  /** Filter by severity */
  severityFilter?: InsightSeverity[]
  /** Filter by category */
  categoryFilter?: InsightCategory[]
  /** Callback when insight action is clicked */
  onActionClick?: (insight: Insight) => void
  /** Callback when insight is dismissed */
  onDismiss?: (insightId: string) => void
  /** Show loading skeleton */
  isLoading?: boolean
  /** Additional CSS classes */
  className?: string
}

// =============================================================================
// Metric Trend Types
// =============================================================================

/**
 * Props for the MetricTrend component
 */
export interface MetricTrendProps {
  /** Trend direction */
  direction: TrendDirection
  /** Percentage change (absolute value) */
  percentage: number
  /** Comparison period label (e.g., "vs last week") */
  comparisonLabel?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether positive change is good (green) or bad (red) */
  positiveIsGood?: boolean
  /** Show animation on mount */
  animate?: boolean
  /** Additional CSS classes */
  className?: string
}

// =============================================================================
// Chart Configuration Types
// =============================================================================

/**
 * Color palette for charts
 */
export interface ChartColors {
  primary: string
  secondary: string
  success: string
  error: string
  warning: string
  info: string
  muted: string
}

/**
 * Default chart colors using cyan/purple gradients
 */
export const DEFAULT_CHART_COLORS: ChartColors = {
  primary: '#06b6d4', // cyan-500
  secondary: '#a855f7', // purple-500
  success: '#22c55e', // green-500
  error: '#ef4444', // red-500
  warning: '#f59e0b', // amber-500
  info: '#3b82f6', // blue-500
  muted: '#64748b', // slate-500
}

// =============================================================================
// Empty State Types
// =============================================================================

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  actionLabel?: string
  onAction?: () => void
}

// =============================================================================
// Loading State Types
// =============================================================================

/**
 * Loading state configuration
 */
export interface LoadingStateConfig {
  showSkeleton: boolean
  skeletonCount?: number
  message?: string
}

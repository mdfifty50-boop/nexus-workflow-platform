/**
 * Nexus Feedback Loop System
 *
 * Comprehensive feedback collection and continuous improvement system for workflow automation.
 * Tracks workflow success, collects user feedback, and enables data-driven optimization.
 *
 * Key Features:
 * - Workflow execution tracking with step-level metrics
 * - User feedback collection (explicit and implicit)
 * - Continuous improvement engine with A/B testing
 * - Alert system for anomaly detection
 * - Regional considerations for Kuwait/GCC (work weeks, Islamic holidays)
 *
 * @module feedback-system
 * @version 1.0.0
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

/**
 * Available timeframes for metrics queries
 */
export type TimeFrame = 'last_hour' | 'last_day' | 'last_week' | 'last_month' | 'all_time';

/**
 * Work week types for regional analysis
 */
export type WorkWeekType = 'sun_thu' | 'mon_fri';

/**
 * Feedback channels supported in Kuwait/GCC region
 */
export type FeedbackChannel = 'whatsapp' | 'email' | 'in_app' | 'sms' | 'phone';

/**
 * Metric types for alert configuration
 */
export type MetricType =
  | 'completion_rate'
  | 'average_time'
  | 'error_rate'
  | 'abandonment_rate'
  | 'satisfaction_score'
  | 'step_failure_rate';

/**
 * Experiment status types
 */
export type ExperimentStatus = 'pending' | 'running' | 'paused' | 'completed' | 'cancelled';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Session status types
 */
export type SessionStatus = 'active' | 'completed' | 'abandoned' | 'failed';

/**
 * Optimization action types
 */
export type OptimizationActionType =
  | 'reorder_steps'
  | 'simplify_step'
  | 'add_checkpoint'
  | 'remove_step'
  | 'adjust_timeout'
  | 'change_default'
  | 'add_validation';

// ============================================================================
// INTERFACES - TRACKING
// ============================================================================

/**
 * Context for tracking a workflow execution
 */
export interface TrackingContext {
  /** User ID who initiated the workflow */
  userId?: string;
  /** Organization/team ID */
  organizationId?: string;
  /** Region for regional analysis */
  region?: string;
  /** Country code (e.g., 'KW', 'AE') */
  countryCode?: string;
  /** Work week type for this context */
  workWeekType?: WorkWeekType;
  /** Source of the workflow trigger */
  source?: 'web' | 'mobile' | 'api' | 'voice' | 'whatsapp' | 'scheduled';
  /** Any additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result of a workflow step execution
 */
export interface StepResult {
  /** Whether the step succeeded */
  success: boolean;
  /** Duration in milliseconds */
  durationMs: number;
  /** Error message if failed */
  error?: string;
  /** Error code if failed */
  errorCode?: string;
  /** Number of retry attempts */
  retryCount?: number;
  /** Output data from the step */
  output?: unknown;
  /** User intervention required */
  userIntervention?: boolean;
  /** Tokens used (for AI steps) */
  tokensUsed?: number;
  /** Cost in USD (for AI/API steps) */
  costUsd?: number;
}

/**
 * Outcome of a completed workflow
 */
export interface WorkflowOutcome {
  /** Whether the workflow succeeded overall */
  success: boolean;
  /** Final status */
  status: 'completed' | 'failed' | 'abandoned' | 'partial';
  /** Total duration in milliseconds */
  totalDurationMs: number;
  /** Total tokens used */
  totalTokensUsed?: number;
  /** Total cost in USD */
  totalCostUsd?: number;
  /** Final output/result */
  finalOutput?: unknown;
  /** Error details if failed */
  errorDetails?: {
    stepId: string;
    error: string;
    errorCode?: string;
  };
  /** Whether recovery was attempted */
  recoveryAttempted?: boolean;
  /** Whether recovery was successful */
  recoverySuccessful?: boolean;
}

/**
 * Record of a completed workflow tracking session
 */
export interface CompletionRecord {
  /** Session ID */
  sessionId: string;
  /** Workflow ID */
  workflowId: string;
  /** Pattern name */
  pattern: string;
  /** Outcome details */
  outcome: WorkflowOutcome;
  /** Start timestamp */
  startedAt: string;
  /** Completion timestamp */
  completedAt: string;
  /** Total steps count */
  totalSteps: number;
  /** Completed steps count */
  completedSteps: number;
  /** Failed steps count */
  failedSteps: number;
  /** Skipped steps count */
  skippedSteps: number;
}

/**
 * A workflow tracking session
 */
export interface TrackingSession {
  /** Unique session ID */
  sessionId: string;
  /** Workflow ID being tracked */
  workflowId: string;
  /** Pattern name for categorization */
  pattern: string;
  /** Tracking context */
  context: TrackingContext;
  /** Current status */
  status: SessionStatus;
  /** Session start timestamp */
  startedAt: string;
  /** Session update timestamp */
  updatedAt: string;
  /** Session completion timestamp */
  completedAt?: string;
  /** Step results by step ID */
  stepResults: Record<string, StepResult>;
  /** Step execution order */
  stepOrder: string[];
  /** Final outcome */
  outcome?: WorkflowOutcome;
  /** Experiment ID if part of an experiment */
  experimentId?: string;
  /** Variant if part of an A/B test */
  variant?: string;
}

// ============================================================================
// INTERFACES - METRICS
// ============================================================================

/**
 * Completion rate metrics
 */
export interface CompletionMetrics {
  /** Pattern name */
  pattern: string;
  /** Time period analyzed */
  timeframe: TimeFrame;
  /** Total executions */
  totalExecutions: number;
  /** Successful completions */
  successfulCompletions: number;
  /** Completion rate (0-1) */
  completionRate: number;
  /** Failed executions */
  failedExecutions: number;
  /** Abandoned executions */
  abandonedExecutions: number;
  /** Partial completions */
  partialCompletions: number;
  /** Completion rate trend (positive = improving) */
  trend: number;
  /** Breakdown by day of week */
  byDayOfWeek?: Record<string, number>;
  /** Breakdown by hour of day */
  byHourOfDay?: Record<number, number>;
}

/**
 * Time-related metrics
 */
export interface TimeMetrics {
  /** Pattern name */
  pattern: string;
  /** Average completion time in ms */
  averageTimeMs: number;
  /** Median completion time in ms */
  medianTimeMs: number;
  /** 90th percentile time in ms */
  p90TimeMs: number;
  /** 99th percentile time in ms */
  p99TimeMs: number;
  /** Minimum time in ms */
  minTimeMs: number;
  /** Maximum time in ms */
  maxTimeMs: number;
  /** Standard deviation */
  standardDeviation: number;
  /** Sample count */
  sampleCount: number;
}

/**
 * Step-level metrics
 */
export interface StepMetrics {
  /** Step ID */
  stepId: string;
  /** Step name */
  stepName?: string;
  /** Number of executions */
  executionCount: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Average duration in ms */
  averageDurationMs: number;
  /** Average retry count */
  averageRetryCount: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Most common error codes */
  commonErrors: Array<{ code: string; count: number }>;
  /** User intervention rate */
  userInterventionRate: number;
  /** Bottleneck score (0-100, higher = worse bottleneck) */
  bottleneckScore: number;
}

/**
 * Error-related metrics
 */
export interface ErrorMetrics {
  /** Pattern name */
  pattern: string;
  /** Time period analyzed */
  timeframe: TimeFrame;
  /** Total errors */
  totalErrors: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Errors by code */
  errorsByCode: Record<string, number>;
  /** Errors by step */
  errorsByStep: Record<string, number>;
  /** Most common error */
  mostCommonError?: {
    code: string;
    message: string;
    count: number;
    stepId?: string;
  };
  /** Recoverable vs non-recoverable */
  recoverableCount: number;
  nonRecoverableCount: number;
  /** Recovery success rate */
  recoverySuccessRate: number;
}

/**
 * Satisfaction metrics
 */
export interface SatisfactionMetrics {
  /** Pattern name */
  pattern: string;
  /** Time period analyzed */
  timeframe: TimeFrame;
  /** Average rating (1-5) */
  averageRating: number;
  /** Rating distribution */
  ratingDistribution: Record<number, number>;
  /** Net Promoter Score (-100 to 100) */
  nps: number;
  /** Total feedback count */
  feedbackCount: number;
  /** Positive feedback percentage */
  positivePercentage: number;
  /** Negative feedback percentage */
  negativePercentage: number;
  /** Common positive themes */
  positiveThemes: string[];
  /** Common negative themes */
  negativeThemes: string[];
}

/**
 * Domain-level aggregated metrics
 */
export interface DomainMetrics {
  /** Domain name (e.g., 'hr', 'finance', 'marketing') */
  domain: string;
  /** Time period analyzed */
  timeframe: TimeFrame;
  /** Total patterns in domain */
  patternCount: number;
  /** Total executions */
  totalExecutions: number;
  /** Overall completion rate */
  overallCompletionRate: number;
  /** Average time to completion */
  averageTimeMs: number;
  /** Overall satisfaction score */
  satisfactionScore: number;
  /** Best performing pattern */
  bestPattern?: { pattern: string; completionRate: number };
  /** Worst performing pattern */
  worstPattern?: { pattern: string; completionRate: number };
  /** Active users count */
  activeUsersCount: number;
  /** Cost efficiency (completions per USD) */
  costEfficiency?: number;
}

// ============================================================================
// INTERFACES - USER FEEDBACK
// ============================================================================

/**
 * User feedback entry
 */
export interface UserFeedback {
  /** Rating (1-5) */
  rating?: number;
  /** Text comment */
  comment?: string;
  /** Comment language (e.g., 'en', 'ar') */
  commentLanguage?: string;
  /** Whether user would recommend */
  wouldRecommend?: boolean;
  /** Specific aspects rated */
  aspects?: {
    speed?: number;
    accuracy?: number;
    ease?: number;
    helpfulness?: number;
  };
  /** Tags/categories selected by user */
  tags?: string[];
  /** Feedback channel */
  channel?: FeedbackChannel;
  /** Timestamp */
  timestamp?: string;
}

/**
 * User correction/modification record
 */
export interface UserCorrection {
  /** Step ID where correction was made */
  stepId: string;
  /** Original value/action */
  originalValue: unknown;
  /** Corrected value/action */
  correctedValue: unknown;
  /** Correction type */
  correctionType: 'modify' | 'redo' | 'skip' | 'replace';
  /** User's reason for correction (optional) */
  reason?: string;
  /** Timestamp */
  timestamp: string;
}

/**
 * Summary of feedback for a pattern
 */
export interface FeedbackSummary {
  /** Pattern name */
  pattern: string;
  /** Time period analyzed */
  timeframe: TimeFrame;
  /** Total feedback entries */
  totalFeedback: number;
  /** Average rating */
  averageRating: number;
  /** Sentiment breakdown */
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  /** Common themes extracted from comments */
  themes: Array<{
    theme: string;
    frequency: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
  /** Total corrections made */
  totalCorrections: number;
  /** Most corrected steps */
  mostCorrectedSteps: Array<{ stepId: string; count: number }>;
  /** Channel breakdown */
  channelBreakdown: Record<FeedbackChannel, number>;
  /** Arabic vs English feedback ratio */
  languageBreakdown?: Record<string, number>;
}

/**
 * Improvement suggestion derived from feedback
 */
export interface ImprovementSuggestion {
  /** Unique suggestion ID */
  id: string;
  /** Pattern this applies to */
  pattern: string;
  /** Suggestion type */
  type: 'usability' | 'performance' | 'accuracy' | 'workflow' | 'documentation';
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Description of the improvement */
  description: string;
  /** Affected step IDs */
  affectedSteps: string[];
  /** Evidence from feedback */
  evidence: {
    feedbackCount: number;
    averageImpactRating: number;
    sampleComments: string[];
  };
  /** Estimated impact (0-100) */
  estimatedImpact: number;
  /** Estimated effort (0-100) */
  estimatedEffort: number;
  /** Created timestamp */
  createdAt: string;
  /** Status */
  status: 'new' | 'reviewed' | 'accepted' | 'rejected' | 'implemented';
}

// ============================================================================
// INTERFACES - CONTINUOUS IMPROVEMENT
// ============================================================================

/**
 * Analysis of improvement opportunities for a pattern
 */
export interface ImprovementAnalysis {
  /** Pattern analyzed */
  pattern: string;
  /** Analysis timestamp */
  analyzedAt: string;
  /** Overall health score (0-100) */
  healthScore: number;
  /** Identified bottlenecks */
  bottlenecks: Array<{
    stepId: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestedAction: string;
  }>;
  /** Drop-off points */
  dropOffPoints: Array<{
    stepId: string;
    dropOffRate: number;
    possibleReasons: string[];
  }>;
  /** Optimization opportunities */
  opportunities: Array<{
    type: OptimizationActionType;
    description: string;
    expectedImprovement: number;
    complexity: 'low' | 'medium' | 'high';
  }>;
  /** Comparison with similar patterns */
  benchmarks?: {
    averageCompletionRate: number;
    patternCompletionRate: number;
    percentile: number;
  };
}

/**
 * A/B test suggestion
 */
export interface ABTestSuggestion {
  /** Unique suggestion ID */
  id: string;
  /** Pattern to test */
  pattern: string;
  /** Hypothesis */
  hypothesis: string;
  /** Control description */
  controlDescription: string;
  /** Variant description */
  variantDescription: string;
  /** Metric to measure */
  primaryMetric: MetricType;
  /** Secondary metrics */
  secondaryMetrics: MetricType[];
  /** Minimum sample size needed */
  minimumSampleSize: number;
  /** Estimated duration in days */
  estimatedDurationDays: number;
  /** Confidence level required */
  confidenceLevel: number;
  /** Expected lift percentage */
  expectedLift: number;
  /** Risk assessment */
  riskLevel: 'low' | 'medium' | 'high';
  /** Created timestamp */
  createdAt: string;
}

/**
 * Experiment configuration
 */
export interface Experiment {
  /** Unique experiment ID */
  id: string;
  /** Experiment name */
  name: string;
  /** Pattern being tested */
  pattern: string;
  /** Hypothesis */
  hypothesis: string;
  /** Status */
  status: ExperimentStatus;
  /** Control configuration */
  control: {
    name: string;
    description: string;
    config: Record<string, unknown>;
  };
  /** Variant configurations */
  variants: Array<{
    name: string;
    description: string;
    config: Record<string, unknown>;
    weight: number; // Traffic allocation (0-1)
  }>;
  /** Primary metric */
  primaryMetric: MetricType;
  /** Secondary metrics */
  secondaryMetrics: MetricType[];
  /** Traffic percentage (0-100) */
  trafficPercentage: number;
  /** Start timestamp */
  startedAt?: string;
  /** End timestamp */
  endedAt?: string;
  /** Target sample size */
  targetSampleSize: number;
  /** Current sample sizes */
  currentSampleSizes: Record<string, number>;
  /** Created by user ID */
  createdBy?: string;
}

/**
 * Experiment results
 */
export interface ExperimentResults {
  /** Experiment ID */
  experimentId: string;
  /** Status */
  status: ExperimentStatus;
  /** Analysis timestamp */
  analyzedAt: string;
  /** Total samples */
  totalSamples: number;
  /** Samples by variant */
  samplesByVariant: Record<string, number>;
  /** Primary metric results */
  primaryMetricResults: {
    metric: MetricType;
    controlValue: number;
    variantValues: Record<string, number>;
    winner?: string;
    confidence: number;
    pValue: number;
    lift: Record<string, number>;
  };
  /** Secondary metric results */
  secondaryMetricResults: Array<{
    metric: MetricType;
    controlValue: number;
    variantValues: Record<string, number>;
    winner?: string;
    confidence: number;
  }>;
  /** Statistical significance reached */
  isSignificant: boolean;
  /** Recommendation */
  recommendation: 'continue' | 'stop_control_wins' | 'stop_variant_wins' | 'stop_no_difference';
  /** Detailed findings */
  findings: string[];
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  /** Pattern optimized */
  pattern: string;
  /** Optimization timestamp */
  optimizedAt: string;
  /** Actions taken */
  actions: Array<{
    type: OptimizationActionType;
    description: string;
    applied: boolean;
    reason?: string;
  }>;
  /** Changes made */
  changes: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
  /** Expected improvement */
  expectedImprovement: number;
  /** Whether optimization was applied */
  applied: boolean;
  /** Rollback available */
  rollbackAvailable: boolean;
}

/**
 * Weekly improvement report
 */
export interface ImprovementReport {
  /** Report generation timestamp */
  generatedAt: string;
  /** Period covered */
  period: {
    start: string;
    end: string;
  };
  /** Domain if filtered */
  domain?: string;
  /** Executive summary */
  summary: {
    overallHealthScore: number;
    healthScoreChange: number;
    totalExecutions: number;
    executionChange: number;
    completionRate: number;
    completionRateChange: number;
    satisfactionScore: number;
    satisfactionChange: number;
  };
  /** Top performing patterns */
  topPatterns: Array<{
    pattern: string;
    completionRate: number;
    satisfaction: number;
  }>;
  /** Patterns needing attention */
  patternsNeedingAttention: Array<{
    pattern: string;
    issue: string;
    severity: AlertSeverity;
  }>;
  /** Active experiments */
  activeExperiments: Array<{
    id: string;
    name: string;
    status: ExperimentStatus;
    progress: number;
  }>;
  /** Implemented improvements */
  implementedImprovements: Array<{
    description: string;
    impact: string;
  }>;
  /** Recommendations */
  recommendations: ImprovementSuggestion[];
  /** Regional insights for Kuwait/GCC */
  regionalInsights?: {
    workWeekPerformance: Record<WorkWeekType, number>;
    holidayImpact?: string;
    channelPreferences: Record<FeedbackChannel, number>;
  };
}

// ============================================================================
// INTERFACES - ALERTS
// ============================================================================

/**
 * Alert threshold configuration
 */
export interface AlertThreshold {
  /** Metric type */
  metric: MetricType;
  /** Threshold value */
  threshold: number;
  /** Direction of violation */
  direction: 'above' | 'below';
  /** Severity when triggered */
  severity: AlertSeverity;
  /** Enabled status */
  enabled: boolean;
}

/**
 * Detected anomaly
 */
export interface Anomaly {
  /** Unique anomaly ID */
  id: string;
  /** Metric affected */
  metric: MetricType;
  /** Pattern affected */
  pattern?: string;
  /** Detected timestamp */
  detectedAt: string;
  /** Anomaly type */
  type: 'spike' | 'drop' | 'trend_change' | 'outlier';
  /** Expected value */
  expectedValue: number;
  /** Actual value */
  actualValue: number;
  /** Deviation percentage */
  deviationPercentage: number;
  /** Possible causes */
  possibleCauses: string[];
  /** Severity */
  severity: AlertSeverity;
}

/**
 * Alert entry
 */
export interface Alert {
  /** Unique alert ID */
  id: string;
  /** Alert type */
  type: 'threshold_breach' | 'anomaly' | 'trend' | 'experiment' | 'system';
  /** Severity */
  severity: AlertSeverity;
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Metric involved */
  metric?: MetricType;
  /** Pattern involved */
  pattern?: string;
  /** Triggered timestamp */
  triggeredAt: string;
  /** Acknowledged timestamp */
  acknowledgedAt?: string;
  /** Acknowledged by user ID */
  acknowledgedBy?: string;
  /** Resolved timestamp */
  resolvedAt?: string;
  /** Resolution notes */
  resolutionNotes?: string;
  /** Related data */
  data?: Record<string, unknown>;
  /** Is active */
  isActive: boolean;
}

// ============================================================================
// INTERFACES - CONFIGURATION
// ============================================================================

/**
 * Configuration for the feedback system
 */
export interface FeedbackSystemConfig {
  /** Enable automatic metrics collection */
  enableMetricsCollection?: boolean;
  /** Enable anomaly detection */
  enableAnomalyDetection?: boolean;
  /** Anomaly detection sensitivity (0-1) */
  anomalyDetectionSensitivity?: number;
  /** Default timeframe for metrics */
  defaultTimeframe?: TimeFrame;
  /** Alert thresholds */
  alertThresholds?: AlertThreshold[];
  /** Regional configuration */
  regional?: {
    /** Default country code */
    countryCode?: string;
    /** Default work week type */
    workWeekType?: WorkWeekType;
    /** Enable Islamic holiday tracking */
    trackIslamicHolidays?: boolean;
    /** Preferred feedback channels */
    preferredChannels?: FeedbackChannel[];
  };
  /** Auto-optimization settings */
  autoOptimization?: {
    /** Enable auto-optimization */
    enabled?: boolean;
    /** Minimum completion rate threshold */
    minCompletionRate?: number;
    /** Maximum auto-changes per pattern */
    maxChangesPerPattern?: number;
    /** Require approval before applying */
    requireApproval?: boolean;
  };
  /** Data retention settings */
  retention?: {
    /** Sessions retention in days */
    sessionsRetentionDays?: number;
    /** Metrics retention in days */
    metricsRetentionDays?: number;
    /** Feedback retention in days */
    feedbackRetentionDays?: number;
  };
}

/**
 * Options for metrics queries
 */
export interface MetricsOptions {
  /** Time frame for the query */
  timeframe?: TimeFrame;
  /** Specific patterns to include */
  patterns?: string[];
  /** Specific domains to include */
  domains?: string[];
  /** Group by dimension */
  groupBy?: 'pattern' | 'domain' | 'day' | 'hour' | 'user' | 'region';
  /** Include benchmarks */
  includeBenchmarks?: boolean;
  /** Include regional breakdown */
  includeRegional?: boolean;
  /** Work week filter */
  workWeekType?: WorkWeekType;
  /** Country code filter */
  countryCode?: string;
}

/**
 * Comprehensive metrics response
 */
export interface ComprehensiveMetrics {
  /** Query timestamp */
  queriedAt: string;
  /** Options used */
  options: MetricsOptions;
  /** Overview metrics */
  overview: {
    totalSessions: number;
    completionRate: number;
    averageTimeMs: number;
    errorRate: number;
    satisfactionScore: number;
  };
  /** Completion metrics by pattern */
  completion: Record<string, CompletionMetrics>;
  /** Time metrics by pattern */
  time: Record<string, TimeMetrics>;
  /** Error metrics by pattern */
  errors: Record<string, ErrorMetrics>;
  /** Satisfaction metrics by pattern */
  satisfaction: Record<string, SatisfactionMetrics>;
  /** Domain metrics if applicable */
  domains?: Record<string, DomainMetrics>;
  /** Regional breakdown if requested */
  regional?: {
    byCountry: Record<string, { completionRate: number; avgTimeMs: number }>;
    byWorkWeek: Record<WorkWeekType, { completionRate: number; avgTimeMs: number }>;
  };
  /** Trends */
  trends: {
    completionRateTrend: number;
    errorRateTrend: number;
    satisfactionTrend: number;
  };
}

/**
 * Improvement recommendation
 */
export interface ImprovementRecommendation {
  /** Unique ID */
  id: string;
  /** Priority */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Category */
  category: 'performance' | 'reliability' | 'usability' | 'cost' | 'satisfaction';
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Affected patterns */
  patterns: string[];
  /** Expected impact percentage */
  expectedImpact: number;
  /** Implementation complexity */
  complexity: 'low' | 'medium' | 'high';
  /** Evidence supporting recommendation */
  evidence: string[];
  /** Action items */
  actionItems: string[];
  /** Created timestamp */
  createdAt: string;
}

// ============================================================================
// HELPER FUNCTIONS - TIME CALCULATIONS
// ============================================================================

/**
 * Get timestamp for the start of a timeframe
 */
function getTimeframeStart(timeframe: TimeFrame): Date {
  const now = new Date();

  switch (timeframe) {
    case 'last_hour':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case 'last_day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'last_week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'last_month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all_time':
      return new Date(0);
    default:
      return new Date(0);
  }
}

/**
 * Generate a unique ID
 */
function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Check if a date is within a work week (Sun-Thu for Kuwait or Mon-Fri)
 * Exported for use in regional analysis
 */
export function isWorkDay(date: Date, workWeekType: WorkWeekType): boolean {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday

  if (workWeekType === 'sun_thu') {
    // Kuwait/GCC: Sunday (0) to Thursday (4)
    return day >= 0 && day <= 4;
  } else {
    // Western: Monday (1) to Friday (5)
    return day >= 1 && day <= 5;
  }
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sortedValues[lower];
  }

  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * Simple sentiment analysis based on keywords
 */
function analyzeSentiment(
  text: string,
  language: string = 'en'
): 'positive' | 'neutral' | 'negative' {
  const lowerText = text.toLowerCase();

  // English positive/negative keywords
  const positiveEn = [
    'great',
    'excellent',
    'good',
    'amazing',
    'love',
    'helpful',
    'fast',
    'easy',
    'perfect',
    'wonderful',
  ];
  const negativeEn = [
    'bad',
    'terrible',
    'slow',
    'confusing',
    'broken',
    'error',
    'failed',
    'awful',
    'poor',
    'frustrating',
  ];

  // Arabic positive/negative keywords (transliterated for simplicity)
  const positiveAr = ['ممتاز', 'رائع', 'جيد', 'سهل', 'سريع', 'مفيد', 'حلو'];
  const negativeAr = ['سيء', 'بطيء', 'صعب', 'خطأ', 'مشكلة', 'فشل'];

  const positiveKeywords = language === 'ar' ? positiveAr : positiveEn;
  const negativeKeywords = language === 'ar' ? negativeAr : negativeEn;

  let positiveCount = positiveKeywords.filter((k) => lowerText.includes(k)).length;
  let negativeCount = negativeKeywords.filter((k) => lowerText.includes(k)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * Extract themes from feedback comments
 */
function extractThemes(
  comments: Array<{ text: string; sentiment: 'positive' | 'neutral' | 'negative' }>
): Array<{ theme: string; frequency: number; sentiment: 'positive' | 'neutral' | 'negative' }> {
  const themeKeywords: Record<string, { keywords: string[]; category: string }> = {
    speed: { keywords: ['fast', 'slow', 'quick', 'speedy', 'سريع', 'بطيء'], category: 'performance' },
    ease: { keywords: ['easy', 'simple', 'difficult', 'confusing', 'سهل', 'صعب'], category: 'usability' },
    accuracy: { keywords: ['accurate', 'correct', 'wrong', 'error', 'صحيح', 'خطأ'], category: 'reliability' },
    helpful: { keywords: ['helpful', 'useful', 'useless', 'مفيد'], category: 'value' },
  };

  const themes: Record<string, { count: number; sentiment: 'positive' | 'neutral' | 'negative' }> = {};

  for (const comment of comments) {
    const lowerText = comment.text.toLowerCase();

    for (const [theme, config] of Object.entries(themeKeywords)) {
      if (config.keywords.some((k) => lowerText.includes(k))) {
        if (!themes[theme]) {
          themes[theme] = { count: 0, sentiment: 'neutral' };
        }
        themes[theme].count++;
        // Use the sentiment from the most recent matching comment
        themes[theme].sentiment = comment.sentiment;
      }
    }
  }

  return Object.entries(themes)
    .map(([theme, data]) => ({
      theme,
      frequency: data.count,
      sentiment: data.sentiment,
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

// ============================================================================
// WORKFLOW TRACKER CLASS
// ============================================================================

/**
 * Tracks workflow executions and collects step-level data
 */
class WorkflowTracker {
  private sessions: Map<string, TrackingSession> = new Map();
  private completedSessions: Map<string, TrackingSession> = new Map();

  /**
   * Start tracking a workflow execution
   */
  startTracking(workflowId: string, pattern: string, context: TrackingContext): TrackingSession {
    const sessionId = generateId('session');
    const now = new Date().toISOString();

    const session: TrackingSession = {
      sessionId,
      workflowId,
      pattern,
      context,
      status: 'active',
      startedAt: now,
      updatedAt: now,
      stepResults: {},
      stepOrder: [],
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Record step completion
   */
  recordStepCompletion(sessionId: string, stepId: string, result: StepResult): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Session ${sessionId} not found`);
      return;
    }

    session.stepResults[stepId] = result;
    if (!session.stepOrder.includes(stepId)) {
      session.stepOrder.push(stepId);
    }
    session.updatedAt = new Date().toISOString();
  }

  /**
   * Mark workflow as complete
   */
  completeWorkflow(sessionId: string, outcome: WorkflowOutcome): CompletionRecord {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const now = new Date().toISOString();
    session.status = outcome.success ? 'completed' : 'failed';
    session.completedAt = now;
    session.updatedAt = now;
    session.outcome = outcome;

    // Move to completed sessions
    this.sessions.delete(sessionId);
    this.completedSessions.set(sessionId, session);

    // Count step statuses
    const stepResults = Object.values(session.stepResults);
    const completedSteps = stepResults.filter((r) => r.success).length;
    const failedSteps = stepResults.filter((r) => !r.success).length;
    const skippedSteps = session.stepOrder.length - stepResults.length;

    return {
      sessionId,
      workflowId: session.workflowId,
      pattern: session.pattern,
      outcome,
      startedAt: session.startedAt,
      completedAt: now,
      totalSteps: session.stepOrder.length,
      completedSteps,
      failedSteps,
      skippedSteps,
    };
  }

  /**
   * Get a tracking session
   */
  getSession(sessionId: string): TrackingSession | null {
    return this.sessions.get(sessionId) || this.completedSessions.get(sessionId) || null;
  }

  /**
   * Get all sessions for a pattern
   */
  getPatternSessions(pattern: string): TrackingSession[] {
    const activeSessions = Array.from(this.sessions.values()).filter((s) => s.pattern === pattern);
    const completedPatternSessions = Array.from(this.completedSessions.values()).filter(
      (s) => s.pattern === pattern
    );
    return [...activeSessions, ...completedPatternSessions];
  }

  /**
   * Get all completed sessions within a timeframe
   */
  getCompletedSessionsInTimeframe(timeframe: TimeFrame, pattern?: string): TrackingSession[] {
    const startTime = getTimeframeStart(timeframe);

    return Array.from(this.completedSessions.values()).filter((session) => {
      const completedAt = new Date(session.completedAt || session.updatedAt);
      const matchesTimeframe = completedAt >= startTime;
      const matchesPattern = !pattern || session.pattern === pattern;
      return matchesTimeframe && matchesPattern;
    });
  }

  /**
   * Mark session as abandoned
   */
  abandonSession(sessionId: string, reason?: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'abandoned';
      session.completedAt = new Date().toISOString();
      session.updatedAt = session.completedAt;
      session.outcome = {
        success: false,
        status: 'abandoned',
        totalDurationMs: new Date().getTime() - new Date(session.startedAt).getTime(),
        errorDetails: reason ? { stepId: '', error: reason } : undefined,
      };

      this.sessions.delete(sessionId);
      this.completedSessions.set(sessionId, session);
    }
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  /**
   * Get completed sessions count
   */
  getCompletedSessionsCount(): number {
    return this.completedSessions.size;
  }

  /**
   * Clear old sessions (for data retention)
   */
  clearOldSessions(retentionDays: number): number {
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - retentionDays);

    let clearedCount = 0;
    for (const [sessionId, session] of this.completedSessions) {
      const completedAt = new Date(session.completedAt || session.updatedAt);
      if (completedAt < cutoffTime) {
        this.completedSessions.delete(sessionId);
        clearedCount++;
      }
    }

    return clearedCount;
  }
}

// ============================================================================
// METRICS COLLECTOR CLASS
// ============================================================================

/**
 * Collects and calculates metrics from tracked sessions
 */
class MetricsCollector {
  private tracker: WorkflowTracker;
  private feedbackStore: Map<string, Array<UserFeedback & { sessionId: string }>> = new Map();

  constructor(tracker: WorkflowTracker) {
    this.tracker = tracker;
  }

  /**
   * Add feedback to the store
   */
  addFeedback(sessionId: string, pattern: string, feedback: UserFeedback): void {
    if (!this.feedbackStore.has(pattern)) {
      this.feedbackStore.set(pattern, []);
    }
    this.feedbackStore.get(pattern)!.push({
      ...feedback,
      sessionId,
      timestamp: feedback.timestamp || new Date().toISOString(),
    });
  }

  /**
   * Get completion rate metrics for a pattern
   */
  getCompletionRate(pattern: string, timeframe: TimeFrame = 'last_week'): CompletionMetrics {
    const sessions = this.tracker.getCompletedSessionsInTimeframe(timeframe, pattern);

    const total = sessions.length;
    const successful = sessions.filter((s) => s.outcome?.success).length;
    const failed = sessions.filter((s) => s.outcome?.status === 'failed').length;
    const abandoned = sessions.filter((s) => s.outcome?.status === 'abandoned').length;
    const partial = sessions.filter((s) => s.outcome?.status === 'partial').length;

    // Calculate trend by comparing to previous period
    const previousTimeframe = this.getPreviousTimeframe(timeframe);
    const previousSessions = this.tracker.getCompletedSessionsInTimeframe(previousTimeframe, pattern);
    const previousRate =
      previousSessions.length > 0
        ? previousSessions.filter((s) => s.outcome?.success).length / previousSessions.length
        : 0;
    const currentRate = total > 0 ? successful / total : 0;
    const trend = previousRate > 0 ? (currentRate - previousRate) / previousRate : 0;

    // Calculate by day of week
    const byDayOfWeek: Record<string, number> = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (const session of sessions) {
      const day = days[new Date(session.startedAt).getDay()];
      byDayOfWeek[day] = (byDayOfWeek[day] || 0) + (session.outcome?.success ? 1 : 0);
    }

    // Calculate by hour of day
    const byHourOfDay: Record<number, number> = {};
    for (const session of sessions) {
      const hour = new Date(session.startedAt).getHours();
      byHourOfDay[hour] = (byHourOfDay[hour] || 0) + (session.outcome?.success ? 1 : 0);
    }

    return {
      pattern,
      timeframe,
      totalExecutions: total,
      successfulCompletions: successful,
      completionRate: total > 0 ? successful / total : 0,
      failedExecutions: failed,
      abandonedExecutions: abandoned,
      partialCompletions: partial,
      trend,
      byDayOfWeek,
      byHourOfDay,
    };
  }

  /**
   * Get average completion time metrics
   */
  getAverageCompletionTime(pattern: string): TimeMetrics {
    const sessions = this.tracker.getPatternSessions(pattern).filter((s) => s.outcome);
    const times = sessions
      .map((s) => s.outcome?.totalDurationMs || 0)
      .filter((t) => t > 0)
      .sort((a, b) => a - b);

    if (times.length === 0) {
      return {
        pattern,
        averageTimeMs: 0,
        medianTimeMs: 0,
        p90TimeMs: 0,
        p99TimeMs: 0,
        minTimeMs: 0,
        maxTimeMs: 0,
        standardDeviation: 0,
        sampleCount: 0,
      };
    }

    return {
      pattern,
      averageTimeMs: times.reduce((a, b) => a + b, 0) / times.length,
      medianTimeMs: calculatePercentile(times, 50),
      p90TimeMs: calculatePercentile(times, 90),
      p99TimeMs: calculatePercentile(times, 99),
      minTimeMs: times[0],
      maxTimeMs: times[times.length - 1],
      standardDeviation: calculateStandardDeviation(times),
      sampleCount: times.length,
    };
  }

  /**
   * Get step-level metrics
   */
  getStepMetrics(pattern: string): StepMetrics[] {
    const sessions = this.tracker.getPatternSessions(pattern);
    const stepData: Record<string, { results: StepResult[]; errors: Record<string, number> }> = {};

    // Aggregate step data
    for (const session of sessions) {
      for (const [stepId, result] of Object.entries(session.stepResults)) {
        if (!stepData[stepId]) {
          stepData[stepId] = { results: [], errors: {} };
        }
        stepData[stepId].results.push(result);
        if (result.errorCode) {
          stepData[stepId].errors[result.errorCode] =
            (stepData[stepId].errors[result.errorCode] || 0) + 1;
        }
      }
    }

    // Calculate metrics per step
    return Object.entries(stepData).map(([stepId, data]) => {
      const results = data.results;
      const successful = results.filter((r) => r.success).length;
      const avgDuration = results.reduce((a, r) => a + r.durationMs, 0) / results.length;
      const avgRetry =
        results.reduce((a, r) => a + (r.retryCount || 0), 0) / results.length;
      const interventionCount = results.filter((r) => r.userIntervention).length;

      // Sort errors by count
      const commonErrors = Object.entries(data.errors)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate bottleneck score based on failure rate and duration
      const failureRate = 1 - successful / results.length;
      const avgAllDurations =
        sessions
          .flatMap((s) => Object.values(s.stepResults))
          .reduce((a, r) => a + r.durationMs, 0) /
        sessions.flatMap((s) => Object.values(s.stepResults)).length;
      const durationRatio = avgDuration / (avgAllDurations || 1);
      const bottleneckScore = Math.min(100, (failureRate * 50 + (durationRatio - 1) * 50) * 100);

      return {
        stepId,
        executionCount: results.length,
        successRate: results.length > 0 ? successful / results.length : 0,
        averageDurationMs: avgDuration,
        averageRetryCount: avgRetry,
        errorRate: results.length > 0 ? failureRate : 0,
        commonErrors,
        userInterventionRate: results.length > 0 ? interventionCount / results.length : 0,
        bottleneckScore: Math.max(0, bottleneckScore),
      };
    });
  }

  /**
   * Get error metrics
   */
  getErrorMetrics(pattern: string, timeframe: TimeFrame = 'last_week'): ErrorMetrics {
    const sessions = this.tracker.getCompletedSessionsInTimeframe(timeframe, pattern);
    const errorsByCode: Record<string, number> = {};
    const errorsByStep: Record<string, number> = {};
    let totalErrors = 0;
    let recoverableCount = 0;
    let recoverySuccessCount = 0;

    for (const session of sessions) {
      for (const [stepId, result] of Object.entries(session.stepResults)) {
        if (!result.success) {
          totalErrors++;
          if (result.errorCode) {
            errorsByCode[result.errorCode] = (errorsByCode[result.errorCode] || 0) + 1;
          }
          errorsByStep[stepId] = (errorsByStep[stepId] || 0) + 1;

          // Check if error was recoverable
          if (result.retryCount && result.retryCount > 0) {
            recoverableCount++;
            if (result.success) {
              recoverySuccessCount++;
            }
          }
        }
      }

      // Check session-level recovery
      if (session.outcome?.recoveryAttempted) {
        recoverableCount++;
        if (session.outcome.recoverySuccessful) {
          recoverySuccessCount++;
        }
      }
    }

    // Find most common error
    let mostCommonError: ErrorMetrics['mostCommonError'];
    if (Object.keys(errorsByCode).length > 0) {
      const [code, count] = Object.entries(errorsByCode).sort((a, b) => b[1] - a[1])[0];
      const stepWithError = Object.entries(errorsByStep).find(([, c]) => c > 0)?.[0];
      mostCommonError = {
        code,
        message: `Error code: ${code}`,
        count,
        stepId: stepWithError,
      };
    }

    return {
      pattern,
      timeframe,
      totalErrors,
      errorRate: sessions.length > 0 ? totalErrors / sessions.length : 0,
      errorsByCode,
      errorsByStep,
      mostCommonError,
      recoverableCount,
      nonRecoverableCount: totalErrors - recoverableCount,
      recoverySuccessRate: recoverableCount > 0 ? recoverySuccessCount / recoverableCount : 0,
    };
  }

  /**
   * Get satisfaction metrics
   */
  getSatisfactionMetrics(pattern: string, timeframe: TimeFrame = 'last_week'): SatisfactionMetrics {
    const startTime = getTimeframeStart(timeframe);
    const feedbackList = this.feedbackStore.get(pattern) || [];
    const relevantFeedback = feedbackList.filter(
      (f) => new Date(f.timestamp || 0) >= startTime
    );

    // Calculate ratings
    const ratings = relevantFeedback.filter((f) => f.rating !== undefined).map((f) => f.rating!);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    // Rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const rating of ratings) {
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[Math.round(rating)]++;
      }
    }

    // Calculate NPS
    const promoters = relevantFeedback.filter((f) => f.wouldRecommend === true).length;
    const detractors = relevantFeedback.filter((f) => f.wouldRecommend === false).length;
    const totalResponses = relevantFeedback.filter((f) => f.wouldRecommend !== undefined).length;
    const nps =
      totalResponses > 0
        ? ((promoters - detractors) / totalResponses) * 100
        : 0;

    // Sentiment analysis
    const commentsWithSentiment = relevantFeedback
      .filter((f) => f.comment)
      .map((f) => ({
        text: f.comment!,
        sentiment: analyzeSentiment(f.comment!, f.commentLanguage),
      }));

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    for (const c of commentsWithSentiment) {
      sentimentCounts[c.sentiment]++;
    }

    // Extract themes
    const themes = extractThemes(commentsWithSentiment);

    // Channel breakdown
    const channelBreakdown: Record<FeedbackChannel, number> = {
      whatsapp: 0,
      email: 0,
      in_app: 0,
      sms: 0,
      phone: 0,
    };
    for (const f of relevantFeedback) {
      if (f.channel) {
        channelBreakdown[f.channel]++;
      }
    }

    // Language breakdown
    const languageBreakdown: Record<string, number> = {};
    for (const f of relevantFeedback) {
      if (f.commentLanguage) {
        languageBreakdown[f.commentLanguage] = (languageBreakdown[f.commentLanguage] || 0) + 1;
      }
    }

    const total = commentsWithSentiment.length || 1;

    return {
      pattern,
      timeframe,
      averageRating: avgRating,
      ratingDistribution,
      nps,
      feedbackCount: relevantFeedback.length,
      positivePercentage: (sentimentCounts.positive / total) * 100,
      negativePercentage: (sentimentCounts.negative / total) * 100,
      positiveThemes: themes.filter((t) => t.sentiment === 'positive').map((t) => t.theme),
      negativeThemes: themes.filter((t) => t.sentiment === 'negative').map((t) => t.theme),
    };
  }

  /**
   * Get domain-level aggregated metrics
   */
  getDomainMetrics(domain: string, timeframe: TimeFrame = 'last_week'): DomainMetrics {
    // Get all patterns for this domain (pattern naming convention: domain_action)
    const allPatterns = new Set<string>();
    for (const session of this.tracker.getCompletedSessionsInTimeframe(timeframe)) {
      if (session.pattern.startsWith(`${domain}_`) || session.pattern.includes(domain)) {
        allPatterns.add(session.pattern);
      }
    }

    const patterns = Array.from(allPatterns);
    let totalExecutions = 0;
    let successfulExecutions = 0;
    let totalTime = 0;
    let totalSatisfaction = 0;
    let satisfactionCount = 0;
    let bestPattern: { pattern: string; completionRate: number } | undefined;
    let worstPattern: { pattern: string; completionRate: number } | undefined;
    const activeUsers = new Set<string>();

    for (const pattern of patterns) {
      const completionMetrics = this.getCompletionRate(pattern, timeframe);
      totalExecutions += completionMetrics.totalExecutions;
      successfulExecutions += completionMetrics.successfulCompletions;

      const timeMetrics = this.getAverageCompletionTime(pattern);
      totalTime += timeMetrics.averageTimeMs * timeMetrics.sampleCount;

      const satisfactionMetrics = this.getSatisfactionMetrics(pattern, timeframe);
      if (satisfactionMetrics.feedbackCount > 0) {
        totalSatisfaction += satisfactionMetrics.averageRating * satisfactionMetrics.feedbackCount;
        satisfactionCount += satisfactionMetrics.feedbackCount;
      }

      // Track best/worst
      if (!bestPattern || completionMetrics.completionRate > bestPattern.completionRate) {
        bestPattern = { pattern, completionRate: completionMetrics.completionRate };
      }
      if (!worstPattern || completionMetrics.completionRate < worstPattern.completionRate) {
        worstPattern = { pattern, completionRate: completionMetrics.completionRate };
      }

      // Track active users
      for (const session of this.tracker.getCompletedSessionsInTimeframe(timeframe, pattern)) {
        if (session.context.userId) {
          activeUsers.add(session.context.userId);
        }
      }
    }

    return {
      domain,
      timeframe,
      patternCount: patterns.length,
      totalExecutions,
      overallCompletionRate: totalExecutions > 0 ? successfulExecutions / totalExecutions : 0,
      averageTimeMs: totalExecutions > 0 ? totalTime / totalExecutions : 0,
      satisfactionScore: satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0,
      bestPattern,
      worstPattern,
      activeUsersCount: activeUsers.size,
    };
  }

  /**
   * Get previous timeframe for trend comparison
   */
  private getPreviousTimeframe(timeframe: TimeFrame): TimeFrame {
    // Return the same timeframe - data will be filtered by date range
    return timeframe;
  }
}

// ============================================================================
// FEEDBACK COLLECTOR CLASS
// ============================================================================

/**
 * Collects user feedback and corrections
 */
class FeedbackCollector {
  private feedbackBySession: Map<string, UserFeedback[]> = new Map();
  private correctionsBySession: Map<string, UserCorrection[]> = new Map();
  private abandonmentsByPattern: Map<string, Array<{ sessionId: string; reason?: string; timestamp: string }>> =
    new Map();
  private metricsCollector: MetricsCollector;
  private tracker: WorkflowTracker;

  constructor(tracker: WorkflowTracker, metricsCollector: MetricsCollector) {
    this.tracker = tracker;
    this.metricsCollector = metricsCollector;
  }

  /**
   * Record explicit user feedback
   */
  recordFeedback(sessionId: string, feedback: UserFeedback): void {
    const session = this.tracker.getSession(sessionId);
    if (!session) {
      console.warn(`Session ${sessionId} not found for feedback`);
      return;
    }

    const feedbackWithTimestamp: UserFeedback = {
      ...feedback,
      timestamp: feedback.timestamp || new Date().toISOString(),
    };

    if (!this.feedbackBySession.has(sessionId)) {
      this.feedbackBySession.set(sessionId, []);
    }
    this.feedbackBySession.get(sessionId)!.push(feedbackWithTimestamp);

    // Also add to metrics collector for pattern-level analysis
    this.metricsCollector.addFeedback(sessionId, session.pattern, feedbackWithTimestamp);
  }

  /**
   * Record implicit feedback (user corrections/modifications)
   */
  recordCorrection(sessionId: string, correction: UserCorrection): void {
    if (!this.correctionsBySession.has(sessionId)) {
      this.correctionsBySession.set(sessionId, []);
    }
    this.correctionsBySession.get(sessionId)!.push(correction);
  }

  /**
   * Record workflow abandonment
   */
  recordAbandonment(sessionId: string, reason?: string): void {
    const session = this.tracker.getSession(sessionId);
    if (!session) {
      console.warn(`Session ${sessionId} not found for abandonment`);
      return;
    }

    if (!this.abandonmentsByPattern.has(session.pattern)) {
      this.abandonmentsByPattern.set(session.pattern, []);
    }

    this.abandonmentsByPattern.get(session.pattern)!.push({
      sessionId,
      reason,
      timestamp: new Date().toISOString(),
    });

    // Mark session as abandoned
    this.tracker.abandonSession(sessionId, reason);
  }

  /**
   * Get feedback summary for a pattern
   */
  getFeedbackSummary(pattern: string, timeframe: TimeFrame = 'last_week'): FeedbackSummary {
    const startTime = getTimeframeStart(timeframe);
    const sessions = this.tracker.getCompletedSessionsInTimeframe(timeframe, pattern);

    // Collect all feedback for these sessions
    const allFeedback: Array<UserFeedback & { sessionId: string }> = [];
    const allCorrections: UserCorrection[] = [];

    for (const session of sessions) {
      const sessionFeedback = this.feedbackBySession.get(session.sessionId) || [];
      const sessionCorrections = this.correctionsBySession.get(session.sessionId) || [];

      for (const fb of sessionFeedback) {
        if (new Date(fb.timestamp || 0) >= startTime) {
          allFeedback.push({ ...fb, sessionId: session.sessionId });
        }
      }

      for (const corr of sessionCorrections) {
        if (new Date(corr.timestamp) >= startTime) {
          allCorrections.push(corr);
        }
      }
    }

    // Calculate sentiment
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    const commentsWithSentiment: Array<{
      text: string;
      sentiment: 'positive' | 'neutral' | 'negative';
    }> = [];

    for (const fb of allFeedback) {
      if (fb.comment) {
        const sentiment = analyzeSentiment(fb.comment, fb.commentLanguage);
        sentimentCounts[sentiment]++;
        commentsWithSentiment.push({ text: fb.comment, sentiment });
      } else if (fb.rating !== undefined) {
        if (fb.rating >= 4) sentimentCounts.positive++;
        else if (fb.rating <= 2) sentimentCounts.negative++;
        else sentimentCounts.neutral++;
      }
    }

    // Extract themes
    const themes = extractThemes(commentsWithSentiment);

    // Count corrections by step
    const correctionsByStep: Record<string, number> = {};
    for (const corr of allCorrections) {
      correctionsByStep[corr.stepId] = (correctionsByStep[corr.stepId] || 0) + 1;
    }

    const mostCorrectedSteps = Object.entries(correctionsByStep)
      .map(([stepId, count]) => ({ stepId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Channel breakdown
    const channelBreakdown: Record<FeedbackChannel, number> = {
      whatsapp: 0,
      email: 0,
      in_app: 0,
      sms: 0,
      phone: 0,
    };
    for (const fb of allFeedback) {
      if (fb.channel) {
        channelBreakdown[fb.channel]++;
      }
    }

    // Language breakdown
    const languageBreakdown: Record<string, number> = {};
    for (const fb of allFeedback) {
      if (fb.commentLanguage) {
        languageBreakdown[fb.commentLanguage] = (languageBreakdown[fb.commentLanguage] || 0) + 1;
      }
    }

    // Average rating
    const ratings = allFeedback.filter((f) => f.rating !== undefined).map((f) => f.rating!);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    return {
      pattern,
      timeframe,
      totalFeedback: allFeedback.length,
      averageRating: avgRating,
      sentiment: sentimentCounts,
      themes,
      totalCorrections: allCorrections.length,
      mostCorrectedSteps,
      channelBreakdown,
      languageBreakdown,
    };
  }

  /**
   * Get improvement suggestions from feedback
   */
  getImprovementSuggestions(pattern: string): ImprovementSuggestion[] {
    const feedbackSummary = this.getFeedbackSummary(pattern, 'last_month');
    const suggestions: ImprovementSuggestion[] = [];

    // Suggest based on negative themes
    for (const theme of feedbackSummary.themes.filter((t) => t.sentiment === 'negative')) {
      if (theme.frequency >= 3) {
        suggestions.push({
          id: generateId('suggestion'),
          pattern,
          type: this.mapThemeToType(theme.theme),
          priority: theme.frequency >= 5 ? 'high' : 'medium',
          description: `Address "${theme.theme}" issue reported by ${theme.frequency} users`,
          affectedSteps: [],
          evidence: {
            feedbackCount: theme.frequency,
            averageImpactRating: 2, // Negative themes typically have low ratings
            sampleComments: [],
          },
          estimatedImpact: Math.min(100, theme.frequency * 10),
          estimatedEffort: 50,
          createdAt: new Date().toISOString(),
          status: 'new',
        });
      }
    }

    // Suggest based on most corrected steps
    for (const step of feedbackSummary.mostCorrectedSteps) {
      if (step.count >= 3) {
        suggestions.push({
          id: generateId('suggestion'),
          pattern,
          type: 'accuracy',
          priority: step.count >= 5 ? 'high' : 'medium',
          description: `Improve step "${step.stepId}" which has ${step.count} user corrections`,
          affectedSteps: [step.stepId],
          evidence: {
            feedbackCount: step.count,
            averageImpactRating: 0,
            sampleComments: [],
          },
          estimatedImpact: Math.min(100, step.count * 15),
          estimatedEffort: 40,
          createdAt: new Date().toISOString(),
          status: 'new',
        });
      }
    }

    // Suggest based on low satisfaction
    if (feedbackSummary.averageRating < 3 && feedbackSummary.totalFeedback >= 5) {
      suggestions.push({
        id: generateId('suggestion'),
        pattern,
        type: 'usability',
        priority: 'critical',
        description: `Overall satisfaction is low (${feedbackSummary.averageRating.toFixed(1)}/5). Review entire workflow.`,
        affectedSteps: [],
        evidence: {
          feedbackCount: feedbackSummary.totalFeedback,
          averageImpactRating: feedbackSummary.averageRating,
          sampleComments: [],
        },
        estimatedImpact: 80,
        estimatedEffort: 70,
        createdAt: new Date().toISOString(),
        status: 'new',
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Map theme to improvement type
   */
  private mapThemeToType(theme: string): ImprovementSuggestion['type'] {
    const typeMap: Record<string, ImprovementSuggestion['type']> = {
      speed: 'performance',
      ease: 'usability',
      accuracy: 'accuracy',
      helpful: 'workflow',
    };
    return typeMap[theme] || 'usability';
  }

  /**
   * Get all feedback for a session
   */
  getSessionFeedback(sessionId: string): UserFeedback[] {
    return this.feedbackBySession.get(sessionId) || [];
  }

  /**
   * Get all corrections for a session
   */
  getSessionCorrections(sessionId: string): UserCorrection[] {
    return this.correctionsBySession.get(sessionId) || [];
  }
}

// ============================================================================
// CONTINUOUS IMPROVEMENT ENGINE CLASS
// ============================================================================

/**
 * Analyzes patterns and generates improvement recommendations
 */
class ContinuousImprovementEngine {
  private tracker: WorkflowTracker;
  private metricsCollector: MetricsCollector;
  private feedbackCollector: FeedbackCollector;
  private experiments: Map<string, Experiment> = new Map();
  private experimentResults: Map<string, ExperimentResults> = new Map();

  constructor(
    tracker: WorkflowTracker,
    metricsCollector: MetricsCollector,
    feedbackCollector: FeedbackCollector
  ) {
    this.tracker = tracker;
    this.metricsCollector = metricsCollector;
    this.feedbackCollector = feedbackCollector;
  }

  /**
   * Analyze a pattern for improvement opportunities
   */
  analyzeForImprovement(pattern: string): ImprovementAnalysis {
    const completionMetrics = this.metricsCollector.getCompletionRate(pattern, 'last_month');
    const stepMetrics = this.metricsCollector.getStepMetrics(pattern);
    const errorMetrics = this.metricsCollector.getErrorMetrics(pattern, 'last_month');
    const satisfactionMetrics = this.metricsCollector.getSatisfactionMetrics(pattern, 'last_month');

    // Calculate health score
    const healthScore = this.calculateHealthScore(
      completionMetrics.completionRate,
      errorMetrics.errorRate,
      satisfactionMetrics.averageRating
    );

    // Identify bottlenecks
    const bottlenecks: ImprovementAnalysis['bottlenecks'] = stepMetrics
      .filter((s) => s.bottleneckScore > 30)
      .sort((a, b) => b.bottleneckScore - a.bottleneckScore)
      .slice(0, 5)
      .map((s) => ({
        stepId: s.stepId,
        severity: (s.bottleneckScore > 70 ? 'high' : s.bottleneckScore > 50 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        description: `Step has ${(s.errorRate * 100).toFixed(1)}% error rate and ${s.averageDurationMs.toFixed(0)}ms avg duration`,
        suggestedAction: s.errorRate > 0.1 ? 'Add error handling' : 'Optimize performance',
      }));

    // Identify drop-off points
    const sessions = this.tracker.getPatternSessions(pattern);
    const stepCounts: Record<string, number> = {};
    for (const session of sessions) {
      for (const stepId of session.stepOrder) {
        stepCounts[stepId] = (stepCounts[stepId] || 0) + 1;
      }
    }

    const orderedSteps = stepMetrics.map((s) => s.stepId);
    const dropOffPoints: ImprovementAnalysis['dropOffPoints'] = [];

    for (let i = 1; i < orderedSteps.length; i++) {
      const prevCount = stepCounts[orderedSteps[i - 1]] || 0;
      const currCount = stepCounts[orderedSteps[i]] || 0;
      const dropOffRate = prevCount > 0 ? (prevCount - currCount) / prevCount : 0;

      if (dropOffRate > 0.1) {
        dropOffPoints.push({
          stepId: orderedSteps[i],
          dropOffRate,
          possibleReasons: [
            'Previous step errors',
            'User confusion',
            'Timeout or slow response',
          ],
        });
      }
    }

    // Generate optimization opportunities
    const opportunities: ImprovementAnalysis['opportunities'] = [];

    if (completionMetrics.completionRate < 0.8) {
      opportunities.push({
        type: 'add_checkpoint',
        description: 'Add checkpoints to allow recovery from failures',
        expectedImprovement: 10,
        complexity: 'medium',
      });
    }

    if (stepMetrics.some((s) => s.averageRetryCount > 2)) {
      opportunities.push({
        type: 'adjust_timeout',
        description: 'Increase timeout for steps with high retry counts',
        expectedImprovement: 5,
        complexity: 'low',
      });
    }

    if (stepMetrics.some((s) => s.userInterventionRate > 0.2)) {
      opportunities.push({
        type: 'add_validation',
        description: 'Add input validation to reduce user interventions',
        expectedImprovement: 15,
        complexity: 'medium',
      });
    }

    return {
      pattern,
      analyzedAt: new Date().toISOString(),
      healthScore,
      bottlenecks,
      dropOffPoints,
      opportunities,
      benchmarks: {
        averageCompletionRate: 0.85, // Placeholder benchmark
        patternCompletionRate: completionMetrics.completionRate,
        percentile: completionMetrics.completionRate > 0.9 ? 90 : completionMetrics.completionRate > 0.7 ? 60 : 30,
      },
    };
  }

  /**
   * Generate A/B test suggestions
   */
  generateABTestSuggestions(pattern: string): ABTestSuggestion[] {
    const analysis = this.analyzeForImprovement(pattern);
    const suggestions: ABTestSuggestion[] = [];

    // Generate suggestions based on bottlenecks
    for (const bottleneck of analysis.bottlenecks) {
      suggestions.push({
        id: generateId('abtest'),
        pattern,
        hypothesis: `Optimizing step "${bottleneck.stepId}" will improve completion rate`,
        controlDescription: `Current implementation of ${bottleneck.stepId}`,
        variantDescription: `${bottleneck.suggestedAction} in ${bottleneck.stepId}`,
        primaryMetric: 'completion_rate',
        secondaryMetrics: ['average_time', 'step_failure_rate'],
        minimumSampleSize: 100,
        estimatedDurationDays: 14,
        confidenceLevel: 0.95,
        expectedLift: 10,
        riskLevel: 'low',
        createdAt: new Date().toISOString(),
      });
    }

    // Generate suggestions based on opportunities
    for (const opp of analysis.opportunities) {
      suggestions.push({
        id: generateId('abtest'),
        pattern,
        hypothesis: `${opp.description} will improve workflow performance`,
        controlDescription: 'Current workflow configuration',
        variantDescription: `Workflow with ${opp.type.replace('_', ' ')} applied`,
        primaryMetric: 'completion_rate',
        secondaryMetrics: ['average_time', 'satisfaction_score'],
        minimumSampleSize: 150,
        estimatedDurationDays: opp.complexity === 'high' ? 21 : 14,
        confidenceLevel: 0.95,
        expectedLift: opp.expectedImprovement,
        riskLevel: opp.complexity === 'high' ? 'medium' : 'low',
        createdAt: new Date().toISOString(),
      });
    }

    return suggestions;
  }

  /**
   * Track an experiment
   */
  trackExperiment(experiment: Experiment): void {
    experiment.currentSampleSizes = {
      control: 0,
      ...Object.fromEntries(experiment.variants.map((v) => [v.name, 0])),
    };
    this.experiments.set(experiment.id, experiment);
  }

  /**
   * Get experiment results
   */
  getExperimentResults(experimentId: string): ExperimentResults {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    // Get sessions that were part of this experiment
    const sessions = Array.from(this.tracker.getPatternSessions(experiment.pattern)).filter(
      (s) => s.experimentId === experimentId
    );

    // Group by variant
    const sessionsByVariant: Record<string, TrackingSession[]> = { control: [] };
    for (const variant of experiment.variants) {
      sessionsByVariant[variant.name] = [];
    }

    for (const session of sessions) {
      const variant = session.variant || 'control';
      if (sessionsByVariant[variant]) {
        sessionsByVariant[variant].push(session);
      }
    }

    // Calculate metrics per variant
    const calculateMetric = (
      variantSessions: TrackingSession[],
      metric: MetricType
    ): number => {
      if (variantSessions.length === 0) return 0;

      switch (metric) {
        case 'completion_rate':
          return variantSessions.filter((s) => s.outcome?.success).length / variantSessions.length;
        case 'average_time':
          const times = variantSessions
            .map((s) => s.outcome?.totalDurationMs || 0)
            .filter((t) => t > 0);
          return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
        case 'error_rate':
          let errorCount = 0;
          for (const s of variantSessions) {
            errorCount += Object.values(s.stepResults).filter((r) => !r.success).length;
          }
          return errorCount / variantSessions.length;
        default:
          return 0;
      }
    };

    const controlValue = calculateMetric(sessionsByVariant.control, experiment.primaryMetric);
    const variantValues: Record<string, number> = {};
    const lift: Record<string, number> = {};

    for (const variant of experiment.variants) {
      const value = calculateMetric(sessionsByVariant[variant.name], experiment.primaryMetric);
      variantValues[variant.name] = value;
      lift[variant.name] = controlValue > 0 ? ((value - controlValue) / controlValue) * 100 : 0;
    }

    // Find winner
    let winner: string | undefined;
    let bestLift = 0;
    for (const [variantName, liftValue] of Object.entries(lift)) {
      if (liftValue > bestLift && Math.abs(liftValue) > 5) {
        // 5% minimum lift to declare winner
        bestLift = liftValue;
        winner = variantName;
      }
    }

    // Calculate confidence (simplified)
    const totalSamples =
      sessionsByVariant.control.length +
      Object.values(sessionsByVariant)
        .flat()
        .filter((s) => s.variant !== undefined).length;
    const confidence = Math.min(0.99, 0.5 + totalSamples / (experiment.targetSampleSize * 2));
    const pValue = 1 - confidence;

    // Determine recommendation
    let recommendation: ExperimentResults['recommendation'] = 'continue';
    if (totalSamples >= experiment.targetSampleSize) {
      if (winner) {
        recommendation = winner === 'control' ? 'stop_control_wins' : 'stop_variant_wins';
      } else {
        recommendation = 'stop_no_difference';
      }
    }

    const results: ExperimentResults = {
      experimentId,
      status: experiment.status,
      analyzedAt: new Date().toISOString(),
      totalSamples,
      samplesByVariant: Object.fromEntries(
        Object.entries(sessionsByVariant).map(([k, v]) => [k, v.length])
      ),
      primaryMetricResults: {
        metric: experiment.primaryMetric,
        controlValue,
        variantValues,
        winner,
        confidence,
        pValue,
        lift,
      },
      secondaryMetricResults: experiment.secondaryMetrics.map((metric) => ({
        metric,
        controlValue: calculateMetric(sessionsByVariant.control, metric),
        variantValues: Object.fromEntries(
          experiment.variants.map((v) => [
            v.name,
            calculateMetric(sessionsByVariant[v.name], metric),
          ])
        ),
        winner: undefined,
        confidence: confidence * 0.9, // Slightly lower for secondary
      })),
      isSignificant: confidence >= 0.95, // Standard statistical significance level
      recommendation,
      findings: this.generateFindings(experiment, controlValue, variantValues, lift),
    };

    this.experimentResults.set(experimentId, results);
    return results;
  }

  /**
   * Auto-optimize a pattern based on data
   */
  autoOptimize(pattern: string, threshold: number = 0.7): OptimizationResult {
    const analysis = this.analyzeForImprovement(pattern);
    const actions: OptimizationResult['actions'] = [];
    const changes: OptimizationResult['changes'] = [];

    // Only optimize if health score is below threshold
    if (analysis.healthScore >= threshold * 100) {
      return {
        pattern,
        optimizedAt: new Date().toISOString(),
        actions: [
          {
            type: 'add_checkpoint',
            description: 'Pattern health is acceptable, no optimization needed',
            applied: false,
            reason: `Health score (${analysis.healthScore}) is above threshold (${threshold * 100})`,
          },
        ],
        changes: [],
        expectedImprovement: 0,
        applied: false,
        rollbackAvailable: false,
      };
    }

    // Apply optimizations based on opportunities
    for (const opp of analysis.opportunities) {
      if (opp.complexity !== 'high') {
        actions.push({
          type: opp.type,
          description: opp.description,
          applied: true,
        });
        changes.push({
          field: `optimization_${opp.type}`,
          oldValue: 'disabled',
          newValue: 'enabled',
        });
      } else {
        actions.push({
          type: opp.type,
          description: opp.description,
          applied: false,
          reason: 'Requires manual review due to high complexity',
        });
      }
    }

    const expectedImprovement = actions
      .filter((a) => a.applied)
      .reduce((sum, a) => {
        const opp = analysis.opportunities.find((o) => o.type === a.type);
        return sum + (opp?.expectedImprovement || 0);
      }, 0);

    return {
      pattern,
      optimizedAt: new Date().toISOString(),
      actions,
      changes,
      expectedImprovement,
      applied: actions.some((a) => a.applied),
      rollbackAvailable: changes.length > 0,
    };
  }

  /**
   * Generate weekly improvement report
   */
  generateWeeklyReport(domain?: string): ImprovementReport {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all patterns for the domain
    const allSessions = this.tracker.getCompletedSessionsInTimeframe('last_week');
    const patterns = new Set(
      allSessions
        .filter((s) => !domain || s.pattern.includes(domain))
        .map((s) => s.pattern)
    );

    // Calculate current metrics
    let totalExecutions = 0;
    let successfulExecutions = 0;
    let totalSatisfaction = 0;
    let satisfactionCount = 0;

    const patternStats: Array<{ pattern: string; completionRate: number; satisfaction: number }> = [];

    for (const pattern of patterns) {
      const currentMetrics = this.metricsCollector.getCompletionRate(pattern, 'last_week');
      const satisfactionMetrics = this.metricsCollector.getSatisfactionMetrics(pattern, 'last_week');

      totalExecutions += currentMetrics.totalExecutions;
      successfulExecutions += currentMetrics.successfulCompletions;

      if (satisfactionMetrics.feedbackCount > 0) {
        totalSatisfaction += satisfactionMetrics.averageRating * satisfactionMetrics.feedbackCount;
        satisfactionCount += satisfactionMetrics.feedbackCount;
      }

      patternStats.push({
        pattern,
        completionRate: currentMetrics.completionRate,
        satisfaction: satisfactionMetrics.averageRating,
      });
    }

    // Calculate overall metrics
    const completionRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;
    const satisfactionScore = satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0;

    // Sort patterns by completion rate
    patternStats.sort((a, b) => b.completionRate - a.completionRate);

    // Get active experiments
    const activeExperiments = Array.from(this.experiments.values())
      .filter((e) => e.status === 'running')
      .map((e) => {
        const totalSamples = Object.values(e.currentSampleSizes).reduce((a, b) => a + b, 0);
        return {
          id: e.id,
          name: e.name,
          status: e.status,
          progress: Math.min(100, (totalSamples / e.targetSampleSize) * 100),
        };
      });

    // Get recommendations from feedback
    const recommendations: ImprovementSuggestion[] = [];
    for (const pattern of patterns) {
      const patternSuggestions = this.feedbackCollector.getImprovementSuggestions(pattern);
      recommendations.push(...patternSuggestions.slice(0, 2)); // Top 2 per pattern
    }

    // Sort recommendations by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Calculate health score
    const healthScore = this.calculateHealthScore(
      completionRate,
      1 - completionRate, // Simplified error rate
      satisfactionScore
    );

    // Identify patterns needing attention
    const patternsNeedingAttention = patternStats
      .filter((p) => p.completionRate < 0.7 || p.satisfaction < 3)
      .slice(0, 5)
      .map((p) => ({
        pattern: p.pattern,
        issue:
          p.completionRate < 0.7
            ? `Low completion rate: ${(p.completionRate * 100).toFixed(1)}%`
            : `Low satisfaction: ${p.satisfaction.toFixed(1)}/5`,
        severity: (p.completionRate < 0.5 || p.satisfaction < 2 ? 'critical' : 'warning') as AlertSeverity,
      }));

    return {
      generatedAt: new Date().toISOString(),
      period: {
        start: weekAgo.toISOString(),
        end: now.toISOString(),
      },
      domain,
      summary: {
        overallHealthScore: healthScore,
        healthScoreChange: 0, // Would need previous data
        totalExecutions,
        executionChange: 0,
        completionRate,
        completionRateChange: 0,
        satisfactionScore,
        satisfactionChange: 0,
      },
      topPatterns: patternStats.slice(0, 5),
      patternsNeedingAttention,
      activeExperiments,
      implementedImprovements: [], // Would need change tracking
      recommendations: recommendations.slice(0, 10),
      regionalInsights: {
        workWeekPerformance: {
          sun_thu: completionRate, // Would need actual breakdown
          mon_fri: completionRate,
        },
        channelPreferences: {
          whatsapp: 40,
          email: 30,
          in_app: 20,
          sms: 5,
          phone: 5,
        },
      },
    };
  }

  /**
   * Calculate health score from key metrics
   */
  private calculateHealthScore(
    completionRate: number,
    errorRate: number,
    satisfaction: number
  ): number {
    // Weighted average: completion 40%, error 30%, satisfaction 30%
    const completionScore = completionRate * 100;
    const errorScore = (1 - errorRate) * 100;
    const satisfactionScore = (satisfaction / 5) * 100;

    return Math.round(completionScore * 0.4 + errorScore * 0.3 + satisfactionScore * 0.3);
  }

  /**
   * Generate findings for experiment results
   */
  private generateFindings(
    experiment: Experiment,
    controlValue: number,
    variantValues: Record<string, number>,
    lift: Record<string, number>
  ): string[] {
    const findings: string[] = [];

    findings.push(
      `Control group ${experiment.primaryMetric}: ${(controlValue * 100).toFixed(1)}%`
    );

    for (const [variantName, value] of Object.entries(variantValues)) {
      const liftValue = lift[variantName];
      const direction = liftValue > 0 ? 'increase' : 'decrease';
      findings.push(
        `${variantName} shows ${Math.abs(liftValue).toFixed(1)}% ${direction} (${(value * 100).toFixed(1)}%)`
      );
    }

    return findings;
  }

  /**
   * Get an experiment by ID
   */
  getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * Update experiment status
   */
  updateExperimentStatus(experimentId: string, status: ExperimentStatus): void {
    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      experiment.status = status;
      if (status === 'running' && !experiment.startedAt) {
        experiment.startedAt = new Date().toISOString();
      }
      if (status === 'completed' || status === 'cancelled') {
        experiment.endedAt = new Date().toISOString();
      }
    }
  }
}

// ============================================================================
// ALERT SYSTEM CLASS
// ============================================================================

/**
 * Monitors metrics and generates alerts
 */
class AlertSystemManager {
  private thresholds: Map<MetricType, AlertThreshold> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private subscribers: Array<(alert: Alert) => void> = [];
  private _metricsCollector: MetricsCollector;

  constructor(metricsCollector: MetricsCollector) {
    this._metricsCollector = metricsCollector;

    // Set default thresholds
    this.setDefaultThresholds();
  }

  /**
   * Get the metrics collector for external use
   */
  getMetricsCollector(): MetricsCollector {
    return this._metricsCollector;
  }

  /**
   * Set default alert thresholds
   */
  private setDefaultThresholds(): void {
    const defaults: AlertThreshold[] = [
      { metric: 'completion_rate', threshold: 0.7, direction: 'below', severity: 'warning', enabled: true },
      { metric: 'completion_rate', threshold: 0.5, direction: 'below', severity: 'critical', enabled: true },
      { metric: 'error_rate', threshold: 0.1, direction: 'above', severity: 'warning', enabled: true },
      { metric: 'error_rate', threshold: 0.3, direction: 'above', severity: 'critical', enabled: true },
      { metric: 'average_time', threshold: 60000, direction: 'above', severity: 'warning', enabled: true },
      { metric: 'satisfaction_score', threshold: 3, direction: 'below', severity: 'warning', enabled: true },
      { metric: 'abandonment_rate', threshold: 0.2, direction: 'above', severity: 'warning', enabled: true },
    ];

    for (const threshold of defaults) {
      this.thresholds.set(threshold.metric, threshold);
    }
  }

  /**
   * Configure alert threshold
   */
  setThreshold(metric: MetricType, threshold: number): void {
    const existing = this.thresholds.get(metric);
    if (existing) {
      existing.threshold = threshold;
    } else {
      this.thresholds.set(metric, {
        metric,
        threshold,
        direction: 'below',
        severity: 'warning',
        enabled: true,
      });
    }
  }

  /**
   * Check for anomalies across all patterns
   */
  checkAnomalies(): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // This would typically analyze historical data to detect anomalies
    // For now, we'll implement basic threshold-based anomaly detection

    // Simplified implementation - in production, use statistical methods
    // like moving averages, standard deviation, or ML-based detection

    return anomalies;
  }

  /**
   * Check a specific metric for threshold breach
   */
  checkMetricThreshold(
    metric: MetricType,
    value: number,
    pattern?: string
  ): Alert | null {
    const threshold = this.thresholds.get(metric);
    if (!threshold || !threshold.enabled) return null;

    const breached =
      threshold.direction === 'above'
        ? value > threshold.threshold
        : value < threshold.threshold;

    if (breached) {
      const alert: Alert = {
        id: generateId('alert'),
        type: 'threshold_breach',
        severity: threshold.severity,
        title: `${metric} threshold breached`,
        description: `${metric} is ${value.toFixed(2)} which is ${threshold.direction} the threshold of ${threshold.threshold}`,
        metric,
        pattern,
        triggeredAt: new Date().toISOString(),
        isActive: true,
      };

      this.alerts.set(alert.id, alert);
      this.notifySubscribers(alert);

      return alert;
    }

    return null;
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((a) => a.isActive);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, userId?: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledgedAt = new Date().toISOString();
      alert.acknowledgedBy = userId;
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, notes?: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date().toISOString();
      alert.resolutionNotes = notes;
      alert.isActive = false;
    }
  }

  /**
   * Subscribe to alert notifications
   */
  subscribe(callback: (alert: Alert) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of a new alert
   */
  private notifySubscribers(alert: Alert): void {
    for (const callback of this.subscribers) {
      try {
        callback(alert);
      } catch (e) {
        console.error('Alert subscriber error:', e);
      }
    }
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
      .slice(0, limit);
  }

  /**
   * Clear old resolved alerts
   */
  clearOldAlerts(retentionDays: number): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    let cleared = 0;
    for (const [id, alert] of this.alerts) {
      if (!alert.isActive && alert.resolvedAt && new Date(alert.resolvedAt) < cutoff) {
        this.alerts.delete(id);
        cleared++;
      }
    }

    return cleared;
  }
}

// ============================================================================
// MAIN FEEDBACK SYSTEM CLASS
// ============================================================================

/**
 * Main Feedback System - orchestrates all feedback collection and improvement components
 *
 * @example
 * ```typescript
 * const feedbackSystem = new FeedbackSystem({
 *   enableMetricsCollection: true,
 *   enableAnomalyDetection: true,
 *   regional: {
 *     countryCode: 'KW',
 *     workWeekType: 'sun_thu',
 *     trackIslamicHolidays: true
 *   }
 * });
 *
 * // Track a workflow
 * const session = feedbackSystem.track('workflow_123', 'email_automation');
 *
 * // Record feedback
 * feedbackSystem.feedback(session.sessionId, { rating: 4, comment: 'Great!' });
 *
 * // Get recommendations
 * const recommendations = feedbackSystem.getRecommendations();
 * ```
 */
export class FeedbackSystem {
  private config: FeedbackSystemConfig;
  private tracker: WorkflowTracker;
  private metricsCollector: MetricsCollector;
  private feedbackCollector: FeedbackCollector;
  private improvementEngine: ContinuousImprovementEngine;
  private alertSystem: AlertSystemManager;

  /**
   * Create a new FeedbackSystem instance
   */
  constructor(config: FeedbackSystemConfig = {}) {
    this.config = {
      enableMetricsCollection: true,
      enableAnomalyDetection: true,
      anomalyDetectionSensitivity: 0.7,
      defaultTimeframe: 'last_week',
      regional: {
        countryCode: 'KW',
        workWeekType: 'sun_thu',
        trackIslamicHolidays: true,
        preferredChannels: ['whatsapp', 'email', 'in_app'],
      },
      autoOptimization: {
        enabled: false,
        minCompletionRate: 0.7,
        maxChangesPerPattern: 3,
        requireApproval: true,
      },
      retention: {
        sessionsRetentionDays: 90,
        metricsRetentionDays: 365,
        feedbackRetentionDays: 365,
      },
      ...config,
    };

    // Initialize components
    this.tracker = new WorkflowTracker();
    this.metricsCollector = new MetricsCollector(this.tracker);
    this.feedbackCollector = new FeedbackCollector(this.tracker, this.metricsCollector);
    this.improvementEngine = new ContinuousImprovementEngine(
      this.tracker,
      this.metricsCollector,
      this.feedbackCollector
    );
    this.alertSystem = new AlertSystemManager(this.metricsCollector);

    // Apply alert thresholds from config
    if (config.alertThresholds) {
      for (const threshold of config.alertThresholds) {
        this.alertSystem.setThreshold(threshold.metric, threshold.threshold);
      }
    }
  }

  /**
   * Start tracking a workflow execution
   *
   * @param workflowId - Unique workflow ID
   * @param pattern - Pattern name for categorization
   * @param context - Optional tracking context
   * @returns Tracking session
   */
  track(workflowId: string, pattern: string, context?: Partial<TrackingContext>): TrackingSession {
    const fullContext: TrackingContext = {
      region: this.config.regional?.countryCode || 'KW',
      countryCode: this.config.regional?.countryCode || 'KW',
      workWeekType: this.config.regional?.workWeekType || 'sun_thu',
      ...context,
    };

    return this.tracker.startTracking(workflowId, pattern, fullContext);
  }

  /**
   * Record step completion for a tracking session
   */
  recordStep(sessionId: string, stepId: string, result: StepResult): void {
    this.tracker.recordStepCompletion(sessionId, stepId, result);

    // Check for alerts based on step result
    if (!result.success && this.config.enableAnomalyDetection) {
      this.alertSystem.checkMetricThreshold('step_failure_rate', 1);
    }
  }

  /**
   * Complete a workflow tracking session
   */
  complete(sessionId: string, outcome: WorkflowOutcome): CompletionRecord {
    const record = this.tracker.completeWorkflow(sessionId, outcome);

    // Check for completion rate alerts
    if (this.config.enableMetricsCollection) {
      const metrics = this.metricsCollector.getCompletionRate(record.pattern, 'last_day');
      this.alertSystem.checkMetricThreshold('completion_rate', metrics.completionRate, record.pattern);
    }

    return record;
  }

  /**
   * Record user feedback for a session
   */
  feedback(sessionId: string, feedbackData: UserFeedback): void {
    this.feedbackCollector.recordFeedback(sessionId, feedbackData);

    // Check satisfaction alerts
    if (feedbackData.rating !== undefined && this.config.enableAnomalyDetection) {
      this.alertSystem.checkMetricThreshold('satisfaction_score', feedbackData.rating);
    }
  }

  /**
   * Record user correction
   */
  correction(sessionId: string, correctionData: UserCorrection): void {
    this.feedbackCollector.recordCorrection(sessionId, correctionData);
  }

  /**
   * Record workflow abandonment
   */
  abandon(sessionId: string, reason?: string): void {
    this.feedbackCollector.recordAbandonment(sessionId, reason);
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(options?: MetricsOptions): ComprehensiveMetrics {
    const opts: MetricsOptions = {
      timeframe: this.config.defaultTimeframe || 'last_week',
      includeRegional: true,
      workWeekType: this.config.regional?.workWeekType,
      countryCode: this.config.regional?.countryCode,
      ...options,
    };

    const sessions = this.tracker.getCompletedSessionsInTimeframe(opts.timeframe || 'last_week');
    const patterns = new Set(sessions.map((s) => s.pattern));

    // Calculate completion metrics per pattern
    const completion: Record<string, CompletionMetrics> = {};
    const time: Record<string, TimeMetrics> = {};
    const errors: Record<string, ErrorMetrics> = {};
    const satisfaction: Record<string, SatisfactionMetrics> = {};

    for (const pattern of patterns) {
      if (!opts.patterns || opts.patterns.includes(pattern)) {
        completion[pattern] = this.metricsCollector.getCompletionRate(pattern, opts.timeframe);
        time[pattern] = this.metricsCollector.getAverageCompletionTime(pattern);
        errors[pattern] = this.metricsCollector.getErrorMetrics(pattern, opts.timeframe);
        satisfaction[pattern] = this.metricsCollector.getSatisfactionMetrics(pattern, opts.timeframe);
      }
    }

    // Calculate overview
    const totalSessions = sessions.length;
    const successfulSessions = sessions.filter((s) => s.outcome?.success).length;
    const totalTimeMs = sessions.reduce((a, s) => a + (s.outcome?.totalDurationMs || 0), 0);
    const totalErrors = Object.values(errors).reduce((a, e) => a + e.totalErrors, 0);
    const avgSatisfaction =
      Object.values(satisfaction).reduce((a, s) => a + s.averageRating, 0) /
      (Object.keys(satisfaction).length || 1);

    // Calculate domain metrics if requested
    const domains: Record<string, DomainMetrics> | undefined = opts.domains
      ? Object.fromEntries(
          opts.domains.map((d) => [d, this.metricsCollector.getDomainMetrics(d, opts.timeframe)])
        )
      : undefined;

    // Calculate regional breakdown
    const regional = opts.includeRegional
      ? {
          byCountry: {} as Record<string, { completionRate: number; avgTimeMs: number }>,
          byWorkWeek: {
            sun_thu: { completionRate: 0, avgTimeMs: 0 },
            mon_fri: { completionRate: 0, avgTimeMs: 0 },
          } as Record<WorkWeekType, { completionRate: number; avgTimeMs: number }>,
        }
      : undefined;

    if (regional) {
      // Group sessions by work week type
      const sunThuSessions = sessions.filter((s) => s.context.workWeekType === 'sun_thu');
      const monFriSessions = sessions.filter((s) => s.context.workWeekType === 'mon_fri');

      regional.byWorkWeek.sun_thu = {
        completionRate:
          sunThuSessions.length > 0
            ? sunThuSessions.filter((s) => s.outcome?.success).length / sunThuSessions.length
            : 0,
        avgTimeMs:
          sunThuSessions.length > 0
            ? sunThuSessions.reduce((a, s) => a + (s.outcome?.totalDurationMs || 0), 0) /
              sunThuSessions.length
            : 0,
      };

      regional.byWorkWeek.mon_fri = {
        completionRate:
          monFriSessions.length > 0
            ? monFriSessions.filter((s) => s.outcome?.success).length / monFriSessions.length
            : 0,
        avgTimeMs:
          monFriSessions.length > 0
            ? monFriSessions.reduce((a, s) => a + (s.outcome?.totalDurationMs || 0), 0) /
              monFriSessions.length
            : 0,
      };
    }

    // Calculate trends
    const currentCompletionRate = totalSessions > 0 ? successfulSessions / totalSessions : 0;
    const currentErrorRate = totalSessions > 0 ? totalErrors / totalSessions : 0;

    return {
      queriedAt: new Date().toISOString(),
      options: opts,
      overview: {
        totalSessions,
        completionRate: currentCompletionRate,
        averageTimeMs: totalSessions > 0 ? totalTimeMs / totalSessions : 0,
        errorRate: currentErrorRate,
        satisfactionScore: avgSatisfaction,
      },
      completion,
      time,
      errors,
      satisfaction,
      domains,
      regional,
      trends: {
        completionRateTrend: 0, // Would need historical comparison
        errorRateTrend: 0,
        satisfactionTrend: 0,
      },
    };
  }

  /**
   * Get improvement recommendations
   */
  getRecommendations(): ImprovementRecommendation[] {
    const sessions = this.tracker.getCompletedSessionsInTimeframe('last_month');
    const patterns = new Set(sessions.map((s) => s.pattern));
    const recommendations: ImprovementRecommendation[] = [];

    for (const pattern of patterns) {
      // Analyze pattern for improvements
      const analysis = this.improvementEngine.analyzeForImprovement(pattern);

      // Convert bottlenecks to recommendations
      for (const bottleneck of analysis.bottlenecks) {
        if (bottleneck.severity !== 'low') {
          recommendations.push({
            id: generateId('rec'),
            priority: bottleneck.severity === 'high' ? 'high' : 'medium',
            category: 'performance',
            title: `Fix bottleneck in ${pattern}`,
            description: bottleneck.description,
            patterns: [pattern],
            expectedImpact: bottleneck.severity === 'high' ? 20 : 10,
            complexity: 'medium',
            evidence: [bottleneck.description],
            actionItems: [bottleneck.suggestedAction],
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Get feedback-based suggestions
      const feedbackSuggestions = this.feedbackCollector.getImprovementSuggestions(pattern);
      for (const suggestion of feedbackSuggestions.slice(0, 3)) {
        recommendations.push({
          id: suggestion.id,
          priority: suggestion.priority,
          category: this.mapTypeToCategory(suggestion.type),
          title: suggestion.description,
          description: `Based on ${suggestion.evidence.feedbackCount} user feedback entries`,
          patterns: [suggestion.pattern],
          expectedImpact: suggestion.estimatedImpact,
          complexity: suggestion.estimatedEffort > 70 ? 'high' : suggestion.estimatedEffort > 30 ? 'medium' : 'low',
          evidence: suggestion.evidence.sampleComments,
          actionItems: [`Address ${suggestion.type} issues in ${suggestion.affectedSteps.join(', ') || 'workflow'}`],
          createdAt: suggestion.createdAt,
        });
      }
    }

    // Sort by priority and expected impact
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.expectedImpact - a.expectedImpact;
      })
      .slice(0, 20);
  }

  /**
   * Export data for analysis
   */
  exportData(format: 'json' | 'csv'): string {
    const metrics = this.getMetrics({ includeRegional: true });
    const sessions = this.tracker.getCompletedSessionsInTimeframe('all_time');

    if (format === 'json') {
      return JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          metrics,
          sessionsCount: sessions.length,
          sessions: sessions.map((s) => ({
            sessionId: s.sessionId,
            workflowId: s.workflowId,
            pattern: s.pattern,
            status: s.status,
            startedAt: s.startedAt,
            completedAt: s.completedAt,
            context: s.context,
            outcome: s.outcome,
            stepResults: Object.entries(s.stepResults).map(([stepId, result]) => ({
              stepId,
              ...result,
            })),
          })),
        },
        null,
        2
      );
    }

    // CSV format
    const rows: string[] = [
      'sessionId,workflowId,pattern,status,startedAt,completedAt,success,durationMs,region,workWeekType',
    ];

    for (const session of sessions) {
      rows.push(
        [
          session.sessionId,
          session.workflowId,
          session.pattern,
          session.status,
          session.startedAt,
          session.completedAt || '',
          session.outcome?.success ? 'true' : 'false',
          session.outcome?.totalDurationMs || 0,
          session.context.region || '',
          session.context.workWeekType || '',
        ].join(',')
      );
    }

    return rows.join('\n');
  }

  /**
   * Import historical data
   */
  importData(data: string, format: 'json' | 'csv'): void {
    if (format === 'json') {
      const parsed = JSON.parse(data);

      // Import sessions
      if (parsed.sessions) {
        for (const sessionData of parsed.sessions) {
          // Create a tracking session
          const session = this.track(sessionData.workflowId, sessionData.pattern, sessionData.context);

          // Record step results
          if (sessionData.stepResults) {
            for (const stepResult of sessionData.stepResults) {
              this.recordStep(session.sessionId, stepResult.stepId, {
                success: stepResult.success,
                durationMs: stepResult.durationMs,
                error: stepResult.error,
                errorCode: stepResult.errorCode,
                retryCount: stepResult.retryCount,
                output: stepResult.output,
              });
            }
          }

          // Complete the session
          if (sessionData.outcome) {
            this.complete(session.sessionId, sessionData.outcome);
          }
        }
      }
    } else {
      // CSV format
      const lines = data.split('\n');
      const headers = lines[0].split(',');

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < headers.length) continue;

        const record: Record<string, string> = {};
        headers.forEach((h, idx) => (record[h] = values[idx]));

        // Create minimal session from CSV
        const session = this.track(record.workflowId, record.pattern, {
          region: record.region,
          workWeekType: record.workWeekType as WorkWeekType,
        });

        // Complete with outcome
        this.complete(session.sessionId, {
          success: record.success === 'true',
          status: record.success === 'true' ? 'completed' : 'failed',
          totalDurationMs: parseInt(record.durationMs) || 0,
        });
      }
    }
  }

  /**
   * Get the alert system for direct access
   */
  get alerts(): AlertSystemManager {
    return this.alertSystem;
  }

  /**
   * Get the improvement engine for direct access
   */
  get improvement(): ContinuousImprovementEngine {
    return this.improvementEngine;
  }

  /**
   * Get the workflow tracker for direct access
   */
  get workflows(): WorkflowTracker {
    return this.tracker;
  }

  /**
   * Get the metrics collector for direct access
   */
  get metrics(): MetricsCollector {
    return this.metricsCollector;
  }

  /**
   * Get the feedback collector for direct access
   */
  get feedbackData(): FeedbackCollector {
    return this.feedbackCollector;
  }

  /**
   * Run data retention cleanup
   */
  runRetentionCleanup(): { sessionsCleared: number; alertsCleared: number } {
    const sessionsCleared = this.tracker.clearOldSessions(
      this.config.retention?.sessionsRetentionDays || 90
    );
    const alertsCleared = this.alertSystem.clearOldAlerts(
      this.config.retention?.feedbackRetentionDays || 365
    );

    return { sessionsCleared, alertsCleared };
  }

  /**
   * Map improvement type to recommendation category
   */
  private mapTypeToCategory(
    type: ImprovementSuggestion['type']
  ): ImprovementRecommendation['category'] {
    const map: Record<ImprovementSuggestion['type'], ImprovementRecommendation['category']> = {
      usability: 'usability',
      performance: 'performance',
      accuracy: 'reliability',
      workflow: 'reliability',
      documentation: 'usability',
    };
    return map[type] || 'usability';
  }
}

// ============================================================================
// DEFAULT EXPORT AND FACTORY
// ============================================================================

/**
 * Create a new FeedbackSystem instance with optional configuration
 */
export function createFeedbackSystem(config?: FeedbackSystemConfig): FeedbackSystem {
  return new FeedbackSystem(config);
}

/**
 * Default FeedbackSystem instance for Kuwait/GCC region
 */
export const feedbackSystem = new FeedbackSystem({
  regional: {
    countryCode: 'KW',
    workWeekType: 'sun_thu',
    trackIslamicHolidays: true,
    preferredChannels: ['whatsapp', 'email', 'in_app'],
  },
});

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default FeedbackSystem;

/**
 * Nexus Learning Module
 *
 * Comprehensive learning and feedback system for workflow optimization.
 * Enables pattern recognition, confidence scoring, and continuous improvement.
 *
 * @module learning
 */

// ============================================================================
// LEARNING ENGINE EXPORTS
// ============================================================================

export {
  // Main class
  LearningEngine,

  // Factory functions
  createLearningEngine,
  createWorkflowExecution,
  createUserFeedback,
  createUserCorrection,
  createRequestContext,

  // Configuration constants
  DEFAULT_CONFIDENCE_CONFIG,
  DEFAULT_LEARNING_CONFIG,
  DOMAIN_DEFINITIONS,
} from './learning-engine';

// Types from learning engine
export type {
  WorkflowExecution,
  ExecutionErrorCategory,
  ExecutedStep,
  UsedTool,
  ExecutionContext,
  ExecutionMetrics,
  PatternMatch,
  PatternVariation,
  VariationType,
  OptimizationSuggestion,
  OptimizationType,
  OptimizationEvidence,
  PatternSignature,
  ConfidenceRecord,
  ConfidenceTrigger,
  ExpertiseScore,
  ExpertiseLevel,
  TransferResult,
  TransferAdaptation,
  CrossDomainMatch,
  UnifiedInsight,
  InsightType,
  InsightEvidence,
  UserFeedback as LearningUserFeedback,
  FeedbackIssue,
  UserCorrection as LearningUserCorrection,
  CorrectionType,
  RequestContext,
  UserPreferences,
  RequestConstraints,
  LearningState,
  LearningStatistics,
  LearnedRecommendation,
  RecommendationType,
  AlternativeApproach,
  EnhancedPattern,
  PatternEnhancement,
  LearningMetrics,
} from './learning-engine';

// ============================================================================
// FEEDBACK SYSTEM EXPORTS
// ============================================================================

export {
  // Main class
  FeedbackSystem,

  // Factory functions
  createFeedbackSystem,

  // Singleton instance
  feedbackSystem,

  // Utility functions
  isWorkDay,
} from './feedback-system';

// Types from feedback system
export type {
  // Enums/Types
  TimeFrame,
  WorkWeekType,
  FeedbackChannel,
  MetricType,
  ExperimentStatus,
  AlertSeverity,
  SessionStatus,
  OptimizationActionType,

  // Tracking interfaces
  TrackingContext,
  StepResult,
  WorkflowOutcome,
  CompletionRecord,
  TrackingSession,

  // Metrics interfaces
  CompletionMetrics,
  TimeMetrics,
  StepMetrics,
  ErrorMetrics,
  SatisfactionMetrics,
  DomainMetrics,

  // Feedback interfaces
  UserFeedback as FeedbackUserFeedback,
  UserCorrection as FeedbackUserCorrection,
  FeedbackSummary,

  // Improvement interfaces
  ImprovementSuggestion,
  ImprovementAnalysis,
  ABTestSuggestion,
  ImprovementReport,
  ImprovementRecommendation,

  // Experiment interfaces
  Experiment,
  ExperimentResults,
  OptimizationResult,

  // Alert interfaces
  AlertThreshold,
  Anomaly,
  Alert,

  // Configuration interfaces
  FeedbackSystemConfig,
  MetricsOptions,
  ComprehensiveMetrics,
} from './feedback-system';

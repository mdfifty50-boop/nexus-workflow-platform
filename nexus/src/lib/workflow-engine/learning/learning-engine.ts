/**
 * Nexus Learning Engine
 *
 * Core learning and pattern recognition system for workflow optimization.
 * This module enables Nexus to learn from workflow executions, build confidence
 * in patterns, transfer learnings across domains, and continuously improve
 * recommendations.
 *
 * Key Capabilities:
 * 1. Pattern Recognition - Analyze workflow executions to identify reusable patterns
 * 2. Confidence Scoring - Track and update confidence based on outcomes and feedback
 * 3. Cross-Domain Learning - Transfer successful patterns between similar domains
 * 4. Learning Store - In-memory storage with persistence interface
 *
 * @module learning-engine
 */

import type {
  ImplicitRequirement,
  ToolRecommendation,
  WorkflowChainStep,
} from '../workflow-intelligence';

// ============================================================================
// CORE TYPES - WORKFLOW EXECUTION
// ============================================================================

/**
 * Represents a single workflow execution with all relevant metadata
 */
export interface WorkflowExecution {
  /** Unique identifier for this execution */
  id: string;
  /** The workflow identifier that was executed */
  workflowId: string;
  /** User's original request that triggered this workflow */
  userRequest: string;
  /** Normalized pattern key derived from the request */
  patternKey: string;
  /** Domain classification (e.g., 'marketing', 'sales', 'hr') */
  domain: string;
  /** Subdomain if applicable (e.g., 'email-campaigns', 'lead-gen') */
  subdomain?: string;
  /** Timestamp when execution started */
  startedAt: Date;
  /** Timestamp when execution completed (if finished) */
  completedAt?: Date;
  /** Execution duration in milliseconds */
  durationMs?: number;
  /** Whether execution completed successfully */
  success: boolean;
  /** Error message if execution failed */
  errorMessage?: string;
  /** Error category for classification */
  errorCategory?: ExecutionErrorCategory;
  /** Steps that were executed */
  steps: ExecutedStep[];
  /** Tools that were used */
  toolsUsed: UsedTool[];
  /** User feedback if provided */
  feedback?: UserFeedback;
  /** Context at time of execution */
  context: ExecutionContext;
  /** Metrics collected during execution */
  metrics: ExecutionMetrics;
  /** Tags for categorization */
  tags: string[];
}

/**
 * Categories of execution errors for analysis
 */
export type ExecutionErrorCategory =
  | 'tool_failure'
  | 'timeout'
  | 'invalid_input'
  | 'permission_denied'
  | 'rate_limited'
  | 'network_error'
  | 'data_error'
  | 'user_cancelled'
  | 'unknown';

/**
 * Represents a single step that was executed
 */
export interface ExecutedStep {
  /** Step number in sequence */
  stepNumber: number;
  /** Description of what this step does */
  description: string;
  /** Layer this step belongs to */
  layer: 'input' | 'processing' | 'output' | 'notification';
  /** Whether step completed successfully */
  success: boolean;
  /** Duration of this step in ms */
  durationMs: number;
  /** Tool used for this step */
  toolUsed?: string;
  /** Input data (sanitized) */
  inputSummary?: string;
  /** Output data (sanitized) */
  outputSummary?: string;
  /** Any warnings generated */
  warnings?: string[];
}

/**
 * Information about a tool that was used in execution
 */
export interface UsedTool {
  /** Tool identifier */
  toolSlug: string;
  /** Tool display name */
  toolName: string;
  /** Whether tool performed as expected */
  performedWell: boolean;
  /** Response time in ms */
  responseTimeMs: number;
  /** Any issues encountered */
  issues?: string[];
  /** Alternative tools that could have been used */
  alternativesConsidered?: string[];
}

/**
 * Context information at time of execution
 */
export interface ExecutionContext {
  /** User's locale/region */
  region?: string;
  /** Language being used */
  language?: string;
  /** Dialect if applicable */
  dialect?: string;
  /** Time of day category */
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  /** Day of week */
  dayOfWeek: string;
  /** Whether this was a retry of a failed execution */
  isRetry: boolean;
  /** Previous execution ID if this is a retry */
  previousExecutionId?: string;
  /** Any additional context properties */
  additionalContext: Record<string, unknown>;
}

/**
 * Metrics collected during execution
 */
export interface ExecutionMetrics {
  /** Total API calls made */
  apiCallCount: number;
  /** Total data processed (bytes) */
  dataProcessedBytes: number;
  /** Number of retries attempted */
  retryCount: number;
  /** Memory peak usage (if tracked) */
  peakMemoryMb?: number;
  /** Token usage for AI operations */
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  /** Cost estimation in USD */
  estimatedCostUsd?: number;
}

// ============================================================================
// CORE TYPES - PATTERN RECOGNITION
// ============================================================================

/**
 * Result of pattern matching analysis
 */
export interface PatternMatch {
  /** The pattern key that matched */
  patternKey: string;
  /** Confidence score for this match (0-100) */
  confidence: number;
  /** Why this pattern was matched */
  matchReason: string;
  /** Keywords that triggered the match */
  matchedKeywords: string[];
  /** Similar patterns that also partially matched */
  similarPatterns: string[];
  /** How many times this pattern has been successfully executed */
  successfulExecutions: number;
  /** Average duration for this pattern */
  averageDurationMs: number;
  /** Recommended tools based on past executions */
  recommendedTools: string[];
}

/**
 * Variation of a pattern across executions
 */
export interface PatternVariation {
  /** Unique identifier for this variation */
  variationId: string;
  /** The base pattern this is a variation of */
  basePatternKey: string;
  /** Description of how this differs from base */
  differenceDescription: string;
  /** Type of variation */
  variationType: VariationType;
  /** How common this variation is (0-100) */
  frequency: number;
  /** Whether this variation tends to succeed */
  successRate: number;
  /** Example executions using this variation */
  exampleExecutionIds: string[];
  /** Specific tool preferences for this variation */
  toolPreferences?: Record<string, string>;
}

/**
 * Types of pattern variations
 */
export type VariationType =
  | 'tool_substitution'
  | 'step_addition'
  | 'step_removal'
  | 'order_change'
  | 'parameter_variation'
  | 'domain_adaptation'
  | 'language_adaptation'
  | 'scale_variation';

/**
 * Suggestion for optimizing a pattern
 */
export interface OptimizationSuggestion {
  /** Unique identifier for this suggestion */
  suggestionId: string;
  /** The pattern this applies to */
  patternKey: string;
  /** Type of optimization */
  optimizationType: OptimizationType;
  /** Human-readable description */
  description: string;
  /** Detailed explanation of the optimization */
  explanation: string;
  /** Expected improvement (percentage) */
  expectedImprovement: number;
  /** Confidence in this suggestion (0-100) */
  confidence: number;
  /** Evidence supporting this suggestion */
  evidence: OptimizationEvidence[];
  /** Steps to implement this optimization */
  implementationSteps: string[];
  /** Potential risks or trade-offs */
  tradeoffs: string[];
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Types of optimization suggestions
 */
export type OptimizationType =
  | 'tool_replacement'
  | 'step_parallelization'
  | 'caching'
  | 'batching'
  | 'error_handling'
  | 'timeout_adjustment'
  | 'cost_reduction'
  | 'performance_improvement'
  | 'reliability_improvement'
  | 'user_experience';

/**
 * Evidence supporting an optimization suggestion
 */
export interface OptimizationEvidence {
  /** Type of evidence */
  type: 'execution_data' | 'comparison' | 'benchmark' | 'user_feedback';
  /** Description of the evidence */
  description: string;
  /** Quantitative data if available */
  data?: Record<string, number>;
  /** Related execution IDs */
  executionIds?: string[];
}

/**
 * Signature that uniquely identifies a pattern
 */
export interface PatternSignature {
  /** Pattern key */
  patternKey: string;
  /** Hash of the pattern for quick comparison */
  signatureHash: string;
  /** Domain this pattern belongs to */
  domain: string;
  /** Keywords that define this pattern */
  keywords: string[];
  /** Typical workflow structure */
  typicalStructure: WorkflowChainStep[];
  /** Required capabilities */
  requiredCapabilities: string[];
  /** Typical tools used */
  typicalTools: string[];
  /** Implicit requirements usually needed */
  typicalImplicitRequirements: ImplicitRequirement[];
  /** Average metrics */
  averageMetrics: {
    durationMs: number;
    stepCount: number;
    toolCount: number;
    successRate: number;
  };
  /** Version of this signature */
  version: number;
  /** When this signature was last updated */
  lastUpdated: Date;
  /** Number of executions this is based on */
  sampleSize: number;
}

// ============================================================================
// CORE TYPES - CONFIDENCE SCORING
// ============================================================================

/**
 * Record of confidence score over time
 */
export interface ConfidenceRecord {
  /** Timestamp of this record */
  timestamp: Date;
  /** Confidence score at this time */
  score: number;
  /** What triggered this confidence update */
  trigger: ConfidenceTrigger;
  /** Delta from previous score */
  delta: number;
  /** Execution ID if applicable */
  executionId?: string;
  /** Additional notes */
  notes?: string;
}

/**
 * What triggered a confidence update
 */
export type ConfidenceTrigger =
  | 'successful_execution'
  | 'failed_execution'
  | 'user_positive_feedback'
  | 'user_negative_feedback'
  | 'user_correction'
  | 'time_decay'
  | 'similar_pattern_success'
  | 'similar_pattern_failure'
  | 'manual_adjustment'
  | 'initial_assessment';

/**
 * Score indicating expertise in a domain
 */
export interface ExpertiseScore {
  /** The domain */
  domain: string;
  /** Overall expertise score (0-100) */
  score: number;
  /** Level classification */
  level: ExpertiseLevel;
  /** Number of successful executions in this domain */
  successfulExecutions: number;
  /** Total executions in this domain */
  totalExecutions: number;
  /** Success rate as percentage */
  successRate: number;
  /** Patterns mastered in this domain */
  masteredPatterns: string[];
  /** Patterns still being learned */
  learningPatterns: string[];
  /** Subdomains with their scores */
  subdomainScores: Record<string, number>;
  /** Trend indicator */
  trend: 'improving' | 'stable' | 'declining';
  /** Last activity in this domain */
  lastActivity: Date;
}

/**
 * Levels of expertise
 */
export type ExpertiseLevel =
  | 'novice'
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert'
  | 'master';

// ============================================================================
// CORE TYPES - CROSS-DOMAIN LEARNING
// ============================================================================

/**
 * Result of transferring learnings between domains
 */
export interface TransferResult {
  /** Whether transfer was successful */
  success: boolean;
  /** Source pattern */
  sourcePattern: string;
  /** Source domain */
  sourceDomain: string;
  /** Target domain */
  targetDomain: string;
  /** Adapted pattern key for target domain */
  adaptedPatternKey?: string;
  /** Confidence in the transfer (0-100) */
  transferConfidence: number;
  /** Adaptations made during transfer */
  adaptations: TransferAdaptation[];
  /** Warnings about the transfer */
  warnings: string[];
  /** Recommendations for using the transferred pattern */
  recommendations: string[];
}

/**
 * Adaptation made during cross-domain transfer
 */
export interface TransferAdaptation {
  /** Type of adaptation */
  type: 'tool_swap' | 'step_modification' | 'parameter_adjustment' | 'context_update';
  /** What was changed */
  description: string;
  /** Original value */
  original?: string;
  /** New value */
  adapted?: string;
  /** Reason for the adaptation */
  reason: string;
}

/**
 * Match found across different domains
 */
export interface CrossDomainMatch {
  /** Pattern key in the other domain */
  patternKey: string;
  /** Domain of the matching pattern */
  domain: string;
  /** Similarity score (0-100) */
  similarityScore: number;
  /** What aspects are similar */
  similarAspects: string[];
  /** What aspects differ */
  differingAspects: string[];
  /** Potential for knowledge transfer */
  transferPotential: 'high' | 'medium' | 'low';
  /** Execution count in that domain */
  executionCount: number;
  /** Success rate in that domain */
  successRate: number;
}

/**
 * Unified insight derived from multiple domains
 */
export interface UnifiedInsight {
  /** Unique identifier */
  insightId: string;
  /** Type of insight */
  type: InsightType;
  /** Human-readable title */
  title: string;
  /** Detailed description */
  description: string;
  /** Domains this insight applies to */
  applicableDomains: string[];
  /** Patterns that contributed to this insight */
  sourcePatterns: string[];
  /** Confidence in this insight (0-100) */
  confidence: number;
  /** Actionable recommendations */
  recommendations: string[];
  /** When this insight was generated */
  generatedAt: Date;
  /** Evidence supporting this insight */
  evidence: InsightEvidence[];
}

/**
 * Types of unified insights
 */
export type InsightType =
  | 'best_practice'
  | 'common_pitfall'
  | 'optimization_opportunity'
  | 'tool_preference'
  | 'timing_pattern'
  | 'user_behavior'
  | 'performance_trend';

/**
 * Evidence supporting an insight
 */
export interface InsightEvidence {
  /** Type of evidence */
  type: 'execution_data' | 'comparison' | 'benchmark' | 'user_feedback';
  /** Domain where evidence was found */
  domain: string;
  /** Pattern key */
  patternKey: string;
  /** Description of the evidence */
  description: string;
  /** Quantitative support */
  metrics?: Record<string, number>;
  /** Related execution IDs */
  executionIds?: string[];
}

// ============================================================================
// CORE TYPES - USER FEEDBACK & CORRECTIONS
// ============================================================================

/**
 * User feedback on a workflow execution
 */
export interface UserFeedback {
  /** Unique identifier */
  feedbackId: string;
  /** Execution this feedback is for */
  executionId: string;
  /** Overall rating (1-5) */
  rating: 1 | 2 | 3 | 4 | 5;
  /** Whether the result met expectations */
  metExpectations: boolean;
  /** Free-form comments */
  comments?: string;
  /** Specific issues mentioned */
  issues?: FeedbackIssue[];
  /** What the user liked */
  positives?: string[];
  /** Suggestions for improvement */
  suggestions?: string[];
  /** Timestamp of feedback */
  providedAt: Date;
}

/**
 * Specific issue mentioned in feedback
 */
export interface FeedbackIssue {
  /** Type of issue */
  type: 'accuracy' | 'speed' | 'reliability' | 'cost' | 'usability' | 'other';
  /** Description of the issue */
  description: string;
  /** Severity */
  severity: 'minor' | 'moderate' | 'major';
  /** Step where issue occurred if known */
  stepNumber?: number;
}

/**
 * User correction to a pattern or execution
 */
export interface UserCorrection {
  /** Unique identifier */
  correctionId: string;
  /** Pattern this correction applies to */
  patternKey: string;
  /** Execution that prompted this correction (if any) */
  executionId?: string;
  /** Type of correction */
  correctionType: CorrectionType;
  /** What was incorrect */
  original: string;
  /** What the correct value should be */
  corrected: string;
  /** Explanation of why this is correct */
  explanation?: string;
  /** Whether this should apply to future executions */
  applyToFuture: boolean;
  /** Timestamp */
  correctedAt: Date;
  /** Whether this correction has been incorporated */
  incorporated: boolean;
}

/**
 * Types of corrections users can make
 */
export type CorrectionType =
  | 'tool_preference'
  | 'step_order'
  | 'parameter_value'
  | 'output_format'
  | 'notification_target'
  | 'timing'
  | 'other';

// ============================================================================
// CORE TYPES - REQUEST CONTEXT
// ============================================================================

/**
 * Context for a user request
 */
export interface RequestContext {
  /** User's region */
  region?: string;
  /** User's preferred language */
  language?: string;
  /** User's preferred dialect */
  dialect?: string;
  /** Time of request */
  timestamp: Date;
  /** User's historical preferences */
  preferences?: UserPreferences;
  /** Previous related requests */
  relatedRequests?: string[];
  /** Active integrations the user has */
  activeIntegrations?: string[];
  /** User's expertise level */
  userExpertiseLevel?: ExpertiseLevel;
  /** Any constraints specified */
  constraints?: RequestConstraints;
}

/**
 * User's historical preferences
 */
export interface UserPreferences {
  /** Preferred tools by category */
  toolPreferences: Record<string, string>;
  /** Preferred notification channels */
  notificationChannels: string[];
  /** Preferred output formats */
  outputFormats: string[];
  /** Preferred complexity level */
  complexityPreference: 'simple' | 'standard' | 'detailed';
  /** Cost sensitivity */
  costSensitivity: 'low' | 'medium' | 'high';
  /** Speed vs quality preference */
  speedVsQuality: 'speed' | 'balanced' | 'quality';
}

/**
 * Constraints specified in a request
 */
export interface RequestConstraints {
  /** Maximum execution time */
  maxDurationMs?: number;
  /** Maximum cost */
  maxCostUsd?: number;
  /** Required tools */
  requiredTools?: string[];
  /** Excluded tools */
  excludedTools?: string[];
  /** Required output format */
  requiredOutputFormat?: string;
}

// ============================================================================
// CORE TYPES - LEARNING STATE & RECOMMENDATIONS
// ============================================================================

/**
 * Complete state of the learning engine for persistence
 */
export interface LearningState {
  /** Version of the state format */
  version: number;
  /** When this state was exported */
  exportedAt: Date;
  /** Pattern signatures */
  patternSignatures: Map<string, PatternSignature> | Record<string, PatternSignature>;
  /** Confidence scores by pattern */
  confidenceScores: Map<string, number> | Record<string, number>;
  /** Confidence history by pattern */
  confidenceHistory: Map<string, ConfidenceRecord[]> | Record<string, ConfidenceRecord[]>;
  /** Execution history by pattern */
  executionHistory: Map<string, WorkflowExecution[]> | Record<string, WorkflowExecution[]>;
  /** User corrections by pattern */
  corrections: Map<string, UserCorrection[]> | Record<string, UserCorrection[]>;
  /** Domain expertise scores */
  domainExpertise: Map<string, ExpertiseScore> | Record<string, ExpertiseScore>;
  /** Cross-domain insights */
  unifiedInsights: UnifiedInsight[];
  /** Optimization suggestions */
  optimizationSuggestions: Map<string, OptimizationSuggestion[]> | Record<string, OptimizationSuggestion[]>;
  /** Statistics */
  statistics: LearningStatistics;
}

/**
 * Statistics about the learning engine
 */
export interface LearningStatistics {
  /** Total executions recorded */
  totalExecutions: number;
  /** Total successful executions */
  successfulExecutions: number;
  /** Total patterns learned */
  totalPatterns: number;
  /** Total corrections applied */
  totalCorrections: number;
  /** Total feedback received */
  totalFeedback: number;
  /** Average confidence score */
  averageConfidence: number;
  /** Most successful domain */
  topDomain?: string;
  /** Most used pattern */
  topPattern?: string;
  /** Last learning activity */
  lastActivity?: Date;
}

/**
 * Recommendation based on learned patterns
 */
export interface LearnedRecommendation {
  /** Unique identifier */
  recommendationId: string;
  /** Type of recommendation */
  type: RecommendationType;
  /** The pattern this is based on */
  patternKey: string;
  /** Confidence in this recommendation (0-100) */
  confidence: number;
  /** Tool recommendations */
  toolRecommendations: ToolRecommendation[];
  /** Suggested workflow structure */
  suggestedStructure: WorkflowChainStep[];
  /** Expected duration based on history */
  expectedDurationMs: number;
  /** Expected success rate */
  expectedSuccessRate: number;
  /** Warnings based on past issues */
  warnings: string[];
  /** Tips based on successful executions */
  tips: string[];
  /** Alternative approaches */
  alternatives: AlternativeApproach[];
}

/**
 * Types of recommendations
 */
export type RecommendationType =
  | 'pattern_match'
  | 'similar_pattern'
  | 'cross_domain_transfer'
  | 'optimization'
  | 'fallback';

/**
 * Alternative approach for a recommendation
 */
export interface AlternativeApproach {
  /** Description of the alternative */
  description: string;
  /** Pattern key if based on a pattern */
  patternKey?: string;
  /** Confidence in this alternative */
  confidence: number;
  /** Trade-offs of this approach */
  tradeoffs: string[];
}

/**
 * Enhanced pattern with learning improvements
 */
export interface EnhancedPattern {
  /** Original pattern key */
  originalPatternKey: string;
  /** Enhanced pattern key (may be same if no enhancement) */
  enhancedPatternKey: string;
  /** Domain this pattern is for */
  domain: string;
  /** Enhancements applied */
  enhancements: PatternEnhancement[];
  /** Confidence in the enhanced pattern */
  confidence: number;
  /** Optimized tool recommendations */
  optimizedTools: ToolRecommendation[];
  /** Optimized workflow structure */
  optimizedStructure: WorkflowChainStep[];
  /** Predicted improvements */
  predictedImprovements: {
    durationReduction?: number;
    successRateIncrease?: number;
    costReduction?: number;
  };
}

/**
 * Enhancement applied to a pattern
 */
export interface PatternEnhancement {
  /** Type of enhancement */
  type: 'tool_optimization' | 'step_optimization' | 'parameter_tuning' | 'error_prevention';
  /** Description */
  description: string;
  /** Impact level */
  impact: 'low' | 'medium' | 'high';
  /** Source of this enhancement */
  source: 'execution_data' | 'user_correction' | 'cross_domain' | 'optimization_analysis';
}

/**
 * Metrics about the learning engine's performance
 */
export interface LearningMetrics {
  /** Overall learning effectiveness */
  effectivenessScore: number;
  /** Total patterns in the system */
  totalPatterns: number;
  /** Patterns with high confidence (>80) */
  highConfidencePatterns: number;
  /** Average pattern confidence */
  averageConfidence: number;
  /** Total executions tracked */
  totalExecutions: number;
  /** Overall success rate */
  overallSuccessRate: number;
  /** Domains with expertise */
  domainsWithExpertise: number;
  /** Cross-domain transfers attempted */
  crossDomainTransfers: number;
  /** Successful transfers */
  successfulTransfers: number;
  /** User corrections incorporated */
  correctionsIncorporated: number;
  /** Recommendations accuracy (based on feedback) */
  recommendationAccuracy: number;
  /** Learning trend */
  learningTrend: 'improving' | 'stable' | 'needs_attention';
  /** Areas needing improvement */
  improvementAreas: string[];
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default confidence configuration
 */
export const DEFAULT_CONFIDENCE_CONFIG = {
  /** Initial confidence for new patterns */
  initialConfidence: 50,
  /** Maximum confidence score */
  maxConfidence: 100,
  /** Minimum confidence score */
  minConfidence: 0,
  /** Confidence gain per successful execution */
  successGain: 5,
  /** Confidence loss per failed execution */
  failureLoss: 8,
  /** Confidence gain from positive feedback */
  positiveFeedbackGain: 3,
  /** Confidence loss from negative feedback */
  negativeFeedbackLoss: 5,
  /** Time decay per day without execution */
  timeDecayPerDay: 0.5,
  /** Maximum time decay */
  maxTimeDecay: 20,
  /** Confidence threshold for "high confidence" */
  highConfidenceThreshold: 80,
  /** Confidence threshold for "reliable" */
  reliableThreshold: 60,
  /** Confidence threshold for "learning" */
  learningThreshold: 40,
};

/**
 * Default learning configuration
 */
export const DEFAULT_LEARNING_CONFIG = {
  /** Maximum execution history to keep per pattern */
  maxExecutionHistoryPerPattern: 100,
  /** Maximum confidence records to keep per pattern */
  maxConfidenceHistoryPerPattern: 50,
  /** Maximum corrections to keep per pattern */
  maxCorrectionsPerPattern: 20,
  /** Minimum executions before pattern is considered learned */
  minExecutionsForLearned: 5,
  /** Minimum success rate for pattern to be considered reliable */
  minSuccessRateForReliable: 0.7,
  /** Similarity threshold for cross-domain matching */
  crossDomainSimilarityThreshold: 0.6,
  /** Minimum confidence for recommendations */
  minRecommendationConfidence: 40,
  /** Maximum similar patterns to return */
  maxSimilarPatterns: 5,
  /** Maximum recommendations to return */
  maxRecommendations: 10,
};

/**
 * Domain definitions with their typical characteristics
 */
export const DOMAIN_DEFINITIONS: Record<string, DomainDefinition> = {
  marketing: {
    name: 'Marketing',
    keywords: ['campaign', 'content', 'social', 'email', 'newsletter', 'audience', 'brand', 'promotion'],
    typicalTools: ['mailchimp', 'hubspot', 'buffer', 'hootsuite', 'canva'],
    relatedDomains: ['sales', 'customer_service'],
  },
  sales: {
    name: 'Sales',
    keywords: ['lead', 'deal', 'pipeline', 'crm', 'prospect', 'opportunity', 'close', 'revenue'],
    typicalTools: ['salesforce', 'hubspot', 'pipedrive', 'zoho'],
    relatedDomains: ['marketing', 'customer_service'],
  },
  hr: {
    name: 'Human Resources',
    keywords: ['employee', 'onboarding', 'hiring', 'recruitment', 'leave', 'payroll', 'performance'],
    typicalTools: ['bamboohr', 'workday', 'gusto', 'lever'],
    relatedDomains: ['operations', 'finance'],
  },
  finance: {
    name: 'Finance',
    keywords: ['invoice', 'payment', 'expense', 'budget', 'accounting', 'tax', 'revenue', 'cost'],
    typicalTools: ['quickbooks', 'xero', 'stripe', 'square'],
    relatedDomains: ['operations', 'hr'],
  },
  operations: {
    name: 'Operations',
    keywords: ['process', 'workflow', 'automation', 'efficiency', 'inventory', 'supply', 'logistics'],
    typicalTools: ['asana', 'monday', 'jira', 'notion'],
    relatedDomains: ['finance', 'hr', 'project_management'],
  },
  customer_service: {
    name: 'Customer Service',
    keywords: ['support', 'ticket', 'customer', 'help', 'inquiry', 'complaint', 'feedback', 'satisfaction'],
    typicalTools: ['zendesk', 'intercom', 'freshdesk', 'helpscout'],
    relatedDomains: ['sales', 'marketing'],
  },
  project_management: {
    name: 'Project Management',
    keywords: ['project', 'task', 'milestone', 'deadline', 'sprint', 'agile', 'team', 'collaboration'],
    typicalTools: ['asana', 'jira', 'trello', 'monday', 'notion'],
    relatedDomains: ['operations', 'development'],
  },
  development: {
    name: 'Development',
    keywords: ['code', 'deploy', 'build', 'test', 'release', 'bug', 'feature', 'repository'],
    typicalTools: ['github', 'gitlab', 'jenkins', 'vercel'],
    relatedDomains: ['project_management', 'operations'],
  },
  legal: {
    name: 'Legal',
    keywords: ['contract', 'agreement', 'compliance', 'legal', 'nda', 'terms', 'policy', 'review'],
    typicalTools: ['docusign', 'pandadoc', 'contractworks'],
    relatedDomains: ['finance', 'hr'],
  },
};

/**
 * Definition of a domain
 */
interface DomainDefinition {
  name: string;
  keywords: string[];
  typicalTools: string[];
  relatedDomains: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID
 */
function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Calculate string similarity using Jaccard index
 */
function calculateJaccardSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().split(/\s+/));
  const set2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate normalized string similarity (0-1)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLen;
}

/**
 * Extract keywords from a request
 */
function extractKeywords(request: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'just', 'i', 'me', 'my', 'myself', 'we', 'our',
    'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
    'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
    'please', 'want', 'need', 'like', 'make', 'create', 'set', 'get',
  ]);

  return request
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Detect domain from request keywords
 */
function detectDomain(request: string): string {
  const keywords = extractKeywords(request);
  let bestDomain = 'general';
  let highestScore = 0;

  for (const [domain, definition] of Object.entries(DOMAIN_DEFINITIONS)) {
    const matchedKeywords = keywords.filter(kw =>
      definition.keywords.some(dk => dk.includes(kw) || kw.includes(dk))
    );
    const score = matchedKeywords.length;
    if (score > highestScore) {
      highestScore = score;
      bestDomain = domain;
    }
  }

  return bestDomain;
}

/**
 * Normalize a pattern key from a request
 */
function normalizePatternKey(request: string): string {
  const keywords = extractKeywords(request)
    .slice(0, 5) // Take top 5 keywords
    .sort();
  return keywords.join('_') || 'generic';
}

/**
 * Get time of day category
 */
function getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Get day of week name
 */
function getDayOfWeek(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Calculate average of numbers
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

/**
 * Calculate expertise level from score
 */
function getExpertiseLevel(score: number): ExpertiseLevel {
  if (score >= 95) return 'master';
  if (score >= 85) return 'expert';
  if (score >= 70) return 'advanced';
  if (score >= 50) return 'intermediate';
  if (score >= 30) return 'beginner';
  return 'novice';
}

/**
 * Deep clone an object
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Map) {
    const mapCopy = new Map();
    obj.forEach((value, key) => mapCopy.set(key, deepClone(value)));
    return mapCopy as unknown as T;
  }
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as unknown as T;
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

// ============================================================================
// PATTERN RECOGNITION SYSTEM
// ============================================================================

/**
 * Pattern Recognition implementation
 */
class PatternRecognitionSystem {
  private signatures: Map<string, PatternSignature>;
  private executionHistory: Map<string, WorkflowExecution[]>;

  constructor(
    signatures?: Map<string, PatternSignature>,
    executionHistory?: Map<string, WorkflowExecution[]>
  ) {
    this.signatures = signatures || new Map();
    this.executionHistory = executionHistory || new Map();
  }

  /**
   * Analyze a workflow execution to identify patterns
   */
  analyzeWorkflowPattern(execution: WorkflowExecution): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const requestKeywords = extractKeywords(execution.userRequest);

    // Check against all known patterns
    for (const [patternKey, signature] of this.signatures) {
      const keywordOverlap = requestKeywords.filter(kw =>
        signature.keywords.some(sk => sk.includes(kw) || kw.includes(sk))
      );

      if (keywordOverlap.length > 0) {
        const history = this.executionHistory.get(patternKey) || [];
        const successfulExecs = history.filter(e => e.success);

        matches.push({
          patternKey,
          confidence: this.calculateMatchConfidence(execution, signature, keywordOverlap),
          matchReason: `Matched ${keywordOverlap.length} keywords`,
          matchedKeywords: keywordOverlap,
          similarPatterns: this.findSimilarPatternKeys(patternKey),
          successfulExecutions: successfulExecs.length,
          averageDurationMs: average(successfulExecs.map(e => e.durationMs || 0)),
          recommendedTools: signature.typicalTools,
        });
      }
    }

    // Sort by confidence
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate confidence for a pattern match
   */
  private calculateMatchConfidence(
    execution: WorkflowExecution,
    signature: PatternSignature,
    matchedKeywords: string[]
  ): number {
    let confidence = 0;

    // Keyword match contribution (up to 40 points)
    const keywordRatio = matchedKeywords.length / Math.max(signature.keywords.length, 1);
    confidence += Math.min(keywordRatio * 50, 40);

    // Domain match contribution (20 points)
    if (execution.domain === signature.domain) {
      confidence += 20;
    }

    // Historical success rate contribution (up to 30 points)
    if (signature.averageMetrics.successRate > 0) {
      confidence += signature.averageMetrics.successRate * 30;
    }

    // Sample size contribution (up to 10 points)
    const sampleSizeBonus = Math.min(signature.sampleSize / 10, 1) * 10;
    confidence += sampleSizeBonus;

    return Math.min(Math.round(confidence), 100);
  }

  /**
   * Find pattern keys similar to the given one
   */
  private findSimilarPatternKeys(patternKey: string): string[] {
    const similar: string[] = [];
    const targetKeywords = patternKey.split('_');

    for (const key of this.signatures.keys()) {
      if (key === patternKey) continue;

      const keyKeywords = key.split('_');
      const overlap = targetKeywords.filter(kw => keyKeywords.includes(kw));

      if (overlap.length >= 2) {
        similar.push(key);
      }
    }

    return similar.slice(0, 5);
  }

  /**
   * Identify variations in similar workflow executions
   */
  identifyVariations(pattern: string, executions: WorkflowExecution[]): PatternVariation[] {
    if (executions.length < 2) return [];

    const variations: PatternVariation[] = [];
    const baseExecution = executions[0];

    // Group by tool variations
    const toolVariations = this.groupByToolVariation(executions);
    for (const [toolKey, varExecs] of toolVariations) {
      if (varExecs.length > 1) {
        variations.push({
          variationId: generateId('var'),
          basePatternKey: pattern,
          differenceDescription: `Uses different tool: ${toolKey}`,
          variationType: 'tool_substitution',
          frequency: (varExecs.length / executions.length) * 100,
          successRate: varExecs.filter(e => e.success).length / varExecs.length,
          exampleExecutionIds: varExecs.slice(0, 3).map(e => e.id),
          toolPreferences: this.extractToolPreferences(varExecs),
        });
      }
    }

    // Identify step count variations
    const stepCounts = new Map<number, WorkflowExecution[]>();
    for (const exec of executions) {
      const count = exec.steps.length;
      if (!stepCounts.has(count)) stepCounts.set(count, []);
      stepCounts.get(count)!.push(exec);
    }

    if (stepCounts.size > 1) {
      const baseStepCount = baseExecution.steps.length;
      for (const [count, varExecs] of stepCounts) {
        if (count !== baseStepCount) {
          variations.push({
            variationId: generateId('var'),
            basePatternKey: pattern,
            differenceDescription: count > baseStepCount
              ? `Additional ${count - baseStepCount} steps`
              : `${baseStepCount - count} fewer steps`,
            variationType: count > baseStepCount ? 'step_addition' : 'step_removal',
            frequency: (varExecs.length / executions.length) * 100,
            successRate: varExecs.filter(e => e.success).length / varExecs.length,
            exampleExecutionIds: varExecs.slice(0, 3).map(e => e.id),
          });
        }
      }
    }

    return variations;
  }

  /**
   * Group executions by their tool combinations
   */
  private groupByToolVariation(executions: WorkflowExecution[]): Map<string, WorkflowExecution[]> {
    const groups = new Map<string, WorkflowExecution[]>();

    for (const exec of executions) {
      const toolKey = exec.toolsUsed.map(t => t.toolSlug).sort().join(',');
      if (!groups.has(toolKey)) groups.set(toolKey, []);
      groups.get(toolKey)!.push(exec);
    }

    return groups;
  }

  /**
   * Extract tool preferences from executions
   */
  private extractToolPreferences(executions: WorkflowExecution[]): Record<string, string> {
    const preferences: Record<string, string> = {};
    const toolPerformance: Record<string, { total: number; success: number }> = {};

    for (const exec of executions) {
      for (const tool of exec.toolsUsed) {
        if (!toolPerformance[tool.toolSlug]) {
          toolPerformance[tool.toolSlug] = { total: 0, success: 0 };
        }
        toolPerformance[tool.toolSlug].total++;
        if (tool.performedWell) {
          toolPerformance[tool.toolSlug].success++;
        }
      }
    }

    for (const [slug, perf] of Object.entries(toolPerformance)) {
      if (perf.total >= 3 && (perf.success / perf.total) >= 0.8) {
        preferences[slug] = `${Math.round((perf.success / perf.total) * 100)}% success rate`;
      }
    }

    return preferences;
  }

  /**
   * Detect optimization opportunities for a pattern
   */
  detectOptimizations(pattern: string): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const executions = this.executionHistory.get(pattern) || [];

    if (executions.length < 5) {
      return []; // Need sufficient data
    }

    const successfulExecs = executions.filter(e => e.success);
    const failedExecs = executions.filter(e => !e.success);

    // Tool performance analysis
    suggestions.push(...this.analyzeToolPerformance(pattern, executions));

    // Duration optimization
    suggestions.push(...this.analyzeDurationOptimization(pattern, successfulExecs));

    // Error pattern analysis
    if (failedExecs.length > 0) {
      suggestions.push(...this.analyzeErrorPatterns(pattern, failedExecs));
    }

    // Parallelization opportunities
    suggestions.push(...this.analyzeParallelizationOpportunities(pattern, successfulExecs));

    return suggestions.sort((a, b) => b.priority.localeCompare(a.priority));
  }

  /**
   * Analyze tool performance for optimization opportunities
   */
  private analyzeToolPerformance(
    pattern: string,
    executions: WorkflowExecution[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const toolStats: Record<string, {
      totalTime: number;
      successCount: number;
      totalCount: number;
      issues: string[];
    }> = {};

    for (const exec of executions) {
      for (const tool of exec.toolsUsed) {
        if (!toolStats[tool.toolSlug]) {
          toolStats[tool.toolSlug] = { totalTime: 0, successCount: 0, totalCount: 0, issues: [] };
        }
        toolStats[tool.toolSlug].totalTime += tool.responseTimeMs;
        toolStats[tool.toolSlug].totalCount++;
        if (tool.performedWell) toolStats[tool.toolSlug].successCount++;
        if (tool.issues) toolStats[tool.toolSlug].issues.push(...tool.issues);
      }
    }

    for (const [slug, stats] of Object.entries(toolStats)) {
      const successRate = stats.successCount / stats.totalCount;
      const avgTime = stats.totalTime / stats.totalCount;

      // Suggest replacement for poorly performing tools
      if (successRate < 0.7) {
        suggestions.push({
          suggestionId: generateId('opt'),
          patternKey: pattern,
          optimizationType: 'tool_replacement',
          description: `Consider replacing ${slug} (${Math.round(successRate * 100)}% success rate)`,
          explanation: `Tool ${slug} has a low success rate. Common issues: ${[...new Set(stats.issues)].slice(0, 3).join(', ') || 'Various'}`,
          expectedImprovement: Math.round((0.9 - successRate) * 100),
          confidence: 70,
          evidence: [{
            type: 'execution_data',
            description: `Based on ${stats.totalCount} executions`,
            data: { successRate, avgTime, totalExecutions: stats.totalCount },
          }],
          implementationSteps: [
            `Evaluate alternative tools for ${slug}`,
            'Test replacement with sample executions',
            'Monitor success rate after switch',
          ],
          tradeoffs: ['May require integration changes', 'Learning curve for new tool'],
          priority: successRate < 0.5 ? 'high' : 'medium',
        });
      }

      // Suggest timeout adjustment for slow tools
      if (avgTime > 5000) {
        suggestions.push({
          suggestionId: generateId('opt'),
          patternKey: pattern,
          optimizationType: 'timeout_adjustment',
          description: `${slug} is slow (avg ${Math.round(avgTime)}ms)`,
          explanation: `Consider increasing timeout or investigating slow responses`,
          expectedImprovement: 10,
          confidence: 60,
          evidence: [{
            type: 'execution_data',
            description: `Average response time analysis`,
            data: { avgTime, samples: stats.totalCount },
          }],
          implementationSteps: [
            'Adjust timeout settings',
            'Investigate API rate limits',
            'Consider caching if applicable',
          ],
          tradeoffs: ['May increase overall workflow duration'],
          priority: 'low',
        });
      }
    }

    return suggestions;
  }

  /**
   * Analyze duration for optimization opportunities
   */
  private analyzeDurationOptimization(
    pattern: string,
    executions: WorkflowExecution[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const durations = executions.map(e => e.durationMs || 0).filter(d => d > 0);

    if (durations.length < 3) return suggestions;

    const avgDuration = average(durations);
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    // High variance suggests optimization opportunity
    const variance = Math.sqrt(
      durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length
    );
    const coefficientOfVariation = variance / avgDuration;

    if (coefficientOfVariation > 0.5) {
      suggestions.push({
        suggestionId: generateId('opt'),
        patternKey: pattern,
        optimizationType: 'performance_improvement',
        description: 'High duration variance detected',
        explanation: `Duration varies from ${minDuration}ms to ${maxDuration}ms (avg: ${Math.round(avgDuration)}ms). Investigating fast executions could reveal optimizations.`,
        expectedImprovement: Math.round(((avgDuration - minDuration) / avgDuration) * 100),
        confidence: 65,
        evidence: [{
          type: 'execution_data',
          description: 'Duration analysis',
          data: { avgDuration, minDuration, maxDuration, variance },
        }],
        implementationSteps: [
          'Analyze fastest executions for common factors',
          'Identify bottlenecks in slow executions',
          'Implement findings from fast executions',
        ],
        tradeoffs: ['May require significant investigation time'],
        priority: 'medium',
      });
    }

    return suggestions;
  }

  /**
   * Analyze error patterns for prevention suggestions
   */
  private analyzeErrorPatterns(
    pattern: string,
    failedExecs: WorkflowExecution[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const errorCategories: Record<string, number> = {};

    for (const exec of failedExecs) {
      const category = exec.errorCategory || 'unknown';
      errorCategories[category] = (errorCategories[category] || 0) + 1;
    }

    const sortedCategories = Object.entries(errorCategories)
      .sort(([, a], [, b]) => b - a);

    if (sortedCategories.length > 0) {
      const [topError, count] = sortedCategories[0];
      const percentage = Math.round((count / failedExecs.length) * 100);

      suggestions.push({
        suggestionId: generateId('opt'),
        patternKey: pattern,
        optimizationType: 'error_handling',
        description: `${percentage}% of failures are "${topError}"`,
        explanation: this.getErrorHandlingSuggestion(topError),
        expectedImprovement: Math.round(percentage * 0.5), // Assume we can prevent half
        confidence: 75,
        evidence: [{
          type: 'execution_data',
          description: 'Error category analysis',
          data: errorCategories,
          executionIds: failedExecs.slice(0, 5).map(e => e.id),
        }],
        implementationSteps: this.getErrorPreventionSteps(topError),
        tradeoffs: ['May add complexity to workflow'],
        priority: percentage > 50 ? 'high' : 'medium',
      });
    }

    return suggestions;
  }

  /**
   * Get suggestion text for error type
   */
  private getErrorHandlingSuggestion(errorType: string): string {
    const suggestions: Record<string, string> = {
      tool_failure: 'Consider adding fallback tools or retry logic',
      timeout: 'Increase timeout limits or break into smaller operations',
      invalid_input: 'Add input validation and cleansing steps',
      permission_denied: 'Verify authentication and permissions before execution',
      rate_limited: 'Implement rate limiting awareness and queuing',
      network_error: 'Add retry logic with exponential backoff',
      data_error: 'Validate data format and completeness upfront',
      user_cancelled: 'Implement checkpointing for resumable workflows',
      unknown: 'Add better error logging and categorization',
    };
    return suggestions[errorType] || suggestions.unknown;
  }

  /**
   * Get error prevention steps
   */
  private getErrorPreventionSteps(errorType: string): string[] {
    const steps: Record<string, string[]> = {
      tool_failure: [
        'Add health check before tool invocation',
        'Implement fallback tool selection',
        'Add retry logic with alternative tools',
      ],
      timeout: [
        'Profile step durations to identify bottlenecks',
        'Implement async processing where possible',
        'Add progress tracking for long operations',
      ],
      invalid_input: [
        'Add schema validation at workflow start',
        'Implement data sanitization',
        'Provide clear error messages for invalid inputs',
      ],
      permission_denied: [
        'Check permissions before workflow execution',
        'Implement graceful degradation',
        'Add user notification for permission issues',
      ],
      rate_limited: [
        'Implement request queuing',
        'Add rate limit monitoring',
        'Consider upgrading API tiers if frequent',
      ],
      network_error: [
        'Add retry with exponential backoff',
        'Implement circuit breaker pattern',
        'Add network health monitoring',
      ],
      data_error: [
        'Validate data completeness before processing',
        'Add data transformation error handling',
        'Implement data repair logic where possible',
      ],
      user_cancelled: [
        'Add checkpointing for long workflows',
        'Implement graceful cancellation',
        'Save progress for resumption',
      ],
      unknown: [
        'Add comprehensive error logging',
        'Implement error categorization',
        'Set up monitoring alerts',
      ],
    };
    return steps[errorType] || steps.unknown;
  }

  /**
   * Analyze opportunities for parallelization
   */
  private analyzeParallelizationOpportunities(
    pattern: string,
    executions: WorkflowExecution[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze step dependencies
    const stepAnalysis = this.analyzeStepDependencies(executions);

    if (stepAnalysis.independentSteps.length >= 2) {
      const potentialSavings = stepAnalysis.independentSteps
        .slice(1)
        .reduce((sum, step) => sum + step.avgDuration, 0);

      suggestions.push({
        suggestionId: generateId('opt'),
        patternKey: pattern,
        optimizationType: 'step_parallelization',
        description: `${stepAnalysis.independentSteps.length} steps could run in parallel`,
        explanation: `Steps ${stepAnalysis.independentSteps.map(s => s.stepNumber).join(', ')} appear to be independent and could be parallelized.`,
        expectedImprovement: Math.round((potentialSavings / stepAnalysis.totalDuration) * 100),
        confidence: 55,
        evidence: [{
          type: 'execution_data',
          description: 'Step dependency analysis',
          data: {
            independentSteps: stepAnalysis.independentSteps.length,
            potentialSavings,
            totalDuration: stepAnalysis.totalDuration,
          },
        }],
        implementationSteps: [
          'Verify step independence',
          'Implement parallel execution',
          'Add proper error handling for parallel steps',
          'Test thoroughly before deployment',
        ],
        tradeoffs: [
          'Increased complexity',
          'May increase API call concurrency',
          'Error handling becomes more complex',
        ],
        priority: potentialSavings > 5000 ? 'medium' : 'low',
      });
    }

    return suggestions;
  }

  /**
   * Analyze step dependencies across executions
   */
  private analyzeStepDependencies(executions: WorkflowExecution[]): {
    independentSteps: Array<{ stepNumber: number; avgDuration: number }>;
    totalDuration: number;
  } {
    const stepStats: Record<number, { durations: number[]; layers: Set<string> }> = {};

    for (const exec of executions) {
      for (const step of exec.steps) {
        if (!stepStats[step.stepNumber]) {
          stepStats[step.stepNumber] = { durations: [], layers: new Set() };
        }
        stepStats[step.stepNumber].durations.push(step.durationMs);
        stepStats[step.stepNumber].layers.add(step.layer);
      }
    }

    // Steps in the same layer are potentially parallelizable
    const layerGroups: Record<string, number[]> = {};
    for (const [stepNum, stats] of Object.entries(stepStats)) {
      const layer = [...stats.layers][0]; // Primary layer
      if (!layerGroups[layer]) layerGroups[layer] = [];
      layerGroups[layer].push(parseInt(stepNum));
    }

    // Find groups with multiple steps (potential parallelization)
    const independentSteps: Array<{ stepNumber: number; avgDuration: number }> = [];
    for (const steps of Object.values(layerGroups)) {
      if (steps.length >= 2) {
        for (const stepNum of steps) {
          independentSteps.push({
            stepNumber: stepNum,
            avgDuration: average(stepStats[stepNum].durations),
          });
        }
      }
    }

    const totalDuration = Object.values(stepStats)
      .reduce((sum, stats) => sum + average(stats.durations), 0);

    return { independentSteps, totalDuration };
  }

  /**
   * Build a pattern signature from successful executions
   */
  buildPatternSignature(executions: WorkflowExecution[]): PatternSignature {
    const successfulExecs = executions.filter(e => e.success);
    if (successfulExecs.length === 0 && executions.length > 0) {
      // Fall back to all executions if no successful ones
      return this.buildSignatureFromExecutions(executions);
    }
    return this.buildSignatureFromExecutions(successfulExecs.length > 0 ? successfulExecs : executions);
  }

  /**
   * Build signature from a set of executions
   */
  private buildSignatureFromExecutions(executions: WorkflowExecution[]): PatternSignature {
    if (executions.length === 0) {
      throw new Error('Cannot build signature from empty executions');
    }

    const firstExec = executions[0];

    // Collect all keywords from requests
    const allKeywords: string[] = [];
    for (const exec of executions) {
      allKeywords.push(...extractKeywords(exec.userRequest));
    }

    // Count keyword frequency and take top ones
    const keywordCounts: Record<string, number> = {};
    for (const kw of allKeywords) {
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
    }
    const topKeywords = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([kw]) => kw);

    // Collect typical tools
    const toolCounts: Record<string, number> = {};
    for (const exec of executions) {
      for (const tool of exec.toolsUsed) {
        toolCounts[tool.toolSlug] = (toolCounts[tool.toolSlug] || 0) + 1;
      }
    }
    const typicalTools = Object.entries(toolCounts)
      .filter(([, count]) => count >= executions.length * 0.5) // Used in at least 50% of executions
      .sort(([, a], [, b]) => b - a)
      .map(([slug]) => slug);

    // Build typical structure from most common execution
    const typicalStructure: WorkflowChainStep[] = firstExec.steps.map((step, idx) => ({
      step: idx + 1,
      layer: step.layer,
      description: step.description,
      requiredCapability: step.description,
      suggestedTools: step.toolUsed ? [step.toolUsed] : [],
      isResolved: true,
    }));

    // Extract required capabilities
    const requiredCapabilities = [...new Set(
      executions.flatMap(e => e.steps.map(s => s.description))
    )].slice(0, 10);

    // Calculate average metrics
    const successfulExecs = executions.filter(e => e.success);
    const avgMetrics = {
      durationMs: average(executions.map(e => e.durationMs || 0)),
      stepCount: average(executions.map(e => e.steps.length)),
      toolCount: average(executions.map(e => e.toolsUsed.length)),
      successRate: successfulExecs.length / executions.length,
    };

    // Generate signature hash
    const signatureHash = this.generateSignatureHash(topKeywords, typicalTools, firstExec.domain);

    return {
      patternKey: firstExec.patternKey,
      signatureHash,
      domain: firstExec.domain,
      keywords: topKeywords,
      typicalStructure,
      requiredCapabilities,
      typicalTools,
      typicalImplicitRequirements: [],
      averageMetrics: avgMetrics,
      version: 1,
      lastUpdated: new Date(),
      sampleSize: executions.length,
    };
  }

  /**
   * Generate a hash for the signature
   */
  private generateSignatureHash(keywords: string[], tools: string[], domain: string): string {
    const content = `${domain}:${keywords.sort().join(',')}:${tools.sort().join(',')}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Update internal state with new signature
   */
  updateSignature(signature: PatternSignature): void {
    this.signatures.set(signature.patternKey, signature);
  }

  /**
   * Update execution history
   */
  addExecution(execution: WorkflowExecution): void {
    if (!this.executionHistory.has(execution.patternKey)) {
      this.executionHistory.set(execution.patternKey, []);
    }
    const history = this.executionHistory.get(execution.patternKey)!;
    history.push(execution);

    // Trim history if too large
    if (history.length > DEFAULT_LEARNING_CONFIG.maxExecutionHistoryPerPattern) {
      history.splice(0, history.length - DEFAULT_LEARNING_CONFIG.maxExecutionHistoryPerPattern);
    }
  }
}

// ============================================================================
// CONFIDENCE SCORING SYSTEM
// ============================================================================

/**
 * Confidence Scoring implementation
 */
class ConfidenceScoringSystem {
  private confidenceScores: Map<string, number>;
  private confidenceHistory: Map<string, ConfidenceRecord[]>;
  private domainExpertise: Map<string, ExpertiseScore>;
  private config: typeof DEFAULT_CONFIDENCE_CONFIG;

  constructor(
    scores?: Map<string, number>,
    history?: Map<string, ConfidenceRecord[]>,
    expertise?: Map<string, ExpertiseScore>,
    config?: typeof DEFAULT_CONFIDENCE_CONFIG
  ) {
    this.confidenceScores = scores || new Map();
    this.confidenceHistory = history || new Map();
    this.domainExpertise = expertise || new Map();
    this.config = config || DEFAULT_CONFIDENCE_CONFIG;
  }

  /**
   * Calculate confidence for a pattern match in given context
   */
  calculatePatternConfidence(pattern: string, context: RequestContext): number {
    let baseConfidence = this.confidenceScores.get(pattern) || this.config.initialConfidence;

    // Adjust for domain expertise
    const domain = detectDomain(pattern);
    const expertise = this.domainExpertise.get(domain);
    if (expertise) {
      // Add up to 10 points based on domain expertise
      baseConfidence += Math.min(expertise.score / 10, 10);
    }

    // Adjust for user expertise level
    if (context.userExpertiseLevel) {
      const expertiseBonus: Record<ExpertiseLevel, number> = {
        novice: -5,
        beginner: -2,
        intermediate: 0,
        advanced: 3,
        expert: 5,
        master: 8,
      };
      baseConfidence += expertiseBonus[context.userExpertiseLevel] || 0;
    }

    // Adjust for time of day patterns (if we have historical data)
    // This could be expanded with more sophisticated analysis

    // Apply time decay
    const lastRecord = this.getLastConfidenceRecord(pattern);
    if (lastRecord) {
      const daysSinceLastActivity = (Date.now() - lastRecord.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      const decay = Math.min(daysSinceLastActivity * this.config.timeDecayPerDay, this.config.maxTimeDecay);
      baseConfidence -= decay;
    }

    return Math.max(this.config.minConfidence, Math.min(this.config.maxConfidence, Math.round(baseConfidence)));
  }

  /**
   * Get the last confidence record for a pattern
   */
  private getLastConfidenceRecord(pattern: string): ConfidenceRecord | null {
    const history = this.confidenceHistory.get(pattern);
    if (!history || history.length === 0) return null;
    return history[history.length - 1];
  }

  /**
   * Update confidence based on execution outcome
   */
  updateConfidence(
    pattern: string,
    success: boolean,
    feedback?: UserFeedback,
    executionId?: string
  ): void {
    const currentConfidence = this.confidenceScores.get(pattern) || this.config.initialConfidence;
    let newConfidence = currentConfidence;
    let trigger: ConfidenceTrigger;

    // Base update from execution result
    if (success) {
      newConfidence += this.config.successGain;
      trigger = 'successful_execution';
    } else {
      newConfidence -= this.config.failureLoss;
      trigger = 'failed_execution';
    }

    // Additional adjustment from feedback
    if (feedback) {
      if (feedback.rating >= 4) {
        newConfidence += this.config.positiveFeedbackGain;
        trigger = 'user_positive_feedback';
      } else if (feedback.rating <= 2) {
        newConfidence -= this.config.negativeFeedbackLoss;
        trigger = 'user_negative_feedback';
      }
    }

    // Clamp to valid range
    newConfidence = Math.max(this.config.minConfidence, Math.min(this.config.maxConfidence, newConfidence));

    // Update score
    this.confidenceScores.set(pattern, newConfidence);

    // Record history
    this.recordConfidenceChange(pattern, newConfidence, trigger, newConfidence - currentConfidence, executionId);

    // Update domain expertise
    this.updateDomainExpertise(pattern, success);
  }

  /**
   * Record a confidence change in history
   */
  private recordConfidenceChange(
    pattern: string,
    score: number,
    trigger: ConfidenceTrigger,
    delta: number,
    executionId?: string
  ): void {
    if (!this.confidenceHistory.has(pattern)) {
      this.confidenceHistory.set(pattern, []);
    }

    const history = this.confidenceHistory.get(pattern)!;
    history.push({
      timestamp: new Date(),
      score,
      trigger,
      delta,
      executionId,
    });

    // Trim history if too large
    if (history.length > DEFAULT_LEARNING_CONFIG.maxConfidenceHistoryPerPattern) {
      history.splice(0, history.length - DEFAULT_LEARNING_CONFIG.maxConfidenceHistoryPerPattern);
    }
  }

  /**
   * Update domain expertise based on execution
   */
  private updateDomainExpertise(pattern: string, success: boolean): void {
    const domain = detectDomain(pattern);
    let expertise = this.domainExpertise.get(domain);

    if (!expertise) {
      expertise = this.createInitialExpertise(domain);
      this.domainExpertise.set(domain, expertise);
    }

    // Update counts
    expertise.totalExecutions++;
    if (success) {
      expertise.successfulExecutions++;
    }

    // Recalculate metrics
    expertise.successRate = expertise.successfulExecutions / expertise.totalExecutions;
    expertise.score = this.calculateExpertiseScore(expertise);
    expertise.level = getExpertiseLevel(expertise.score);
    expertise.lastActivity = new Date();

    // Update trend
    expertise.trend = this.calculateExpertiseTrend(domain);

    // Update mastered/learning patterns
    const patternConfidence = this.confidenceScores.get(pattern) || this.config.initialConfidence;
    if (patternConfidence >= this.config.highConfidenceThreshold) {
      if (!expertise.masteredPatterns.includes(pattern)) {
        expertise.masteredPatterns.push(pattern);
        // Remove from learning if present
        expertise.learningPatterns = expertise.learningPatterns.filter(p => p !== pattern);
      }
    } else if (patternConfidence >= this.config.learningThreshold) {
      if (!expertise.learningPatterns.includes(pattern) && !expertise.masteredPatterns.includes(pattern)) {
        expertise.learningPatterns.push(pattern);
      }
    }
  }

  /**
   * Create initial expertise record for a domain
   */
  private createInitialExpertise(domain: string): ExpertiseScore {
    return {
      domain,
      score: 0,
      level: 'novice',
      successfulExecutions: 0,
      totalExecutions: 0,
      successRate: 0,
      masteredPatterns: [],
      learningPatterns: [],
      subdomainScores: {},
      trend: 'stable',
      lastActivity: new Date(),
    };
  }

  /**
   * Calculate expertise score from record
   */
  private calculateExpertiseScore(expertise: ExpertiseScore): number {
    let score = 0;

    // Success rate contribution (up to 40 points)
    score += expertise.successRate * 40;

    // Volume contribution (up to 30 points, logarithmic)
    const volumeScore = Math.min(Math.log10(expertise.totalExecutions + 1) * 15, 30);
    score += volumeScore;

    // Mastered patterns contribution (up to 20 points)
    const masteryScore = Math.min(expertise.masteredPatterns.length * 4, 20);
    score += masteryScore;

    // Recency contribution (up to 10 points)
    const daysSinceActivity = (Date.now() - expertise.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(10 - daysSinceActivity, 0);
    score += recencyScore;

    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate trend for expertise
   */
  private calculateExpertiseTrend(domain: string): 'improving' | 'stable' | 'declining' {
    const expertise = this.domainExpertise.get(domain);
    if (!expertise) return 'stable';

    // Look at recent history across all patterns in this domain
    let recentSuccesses = 0;
    let recentTotal = 0;

    for (const [pattern, history] of this.confidenceHistory) {
      if (detectDomain(pattern) !== domain) continue;

      const recentRecords = history.filter(
        r => Date.now() - r.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
      );

      for (const record of recentRecords) {
        recentTotal++;
        if (record.trigger === 'successful_execution' || record.trigger === 'user_positive_feedback') {
          recentSuccesses++;
        }
      }
    }

    if (recentTotal < 3) return 'stable';

    const recentRate = recentSuccesses / recentTotal;
    if (recentRate > expertise.successRate + 0.1) return 'improving';
    if (recentRate < expertise.successRate - 0.1) return 'declining';
    return 'stable';
  }

  /**
   * Get confidence history for a pattern
   */
  getConfidenceHistory(pattern: string): ConfidenceRecord[] {
    return [...(this.confidenceHistory.get(pattern) || [])];
  }

  /**
   * Calculate domain expertise score
   */
  calculateDomainExpertise(domain: string): ExpertiseScore {
    const expertise = this.domainExpertise.get(domain);
    if (expertise) {
      // Recalculate to ensure it's current
      expertise.score = this.calculateExpertiseScore(expertise);
      expertise.level = getExpertiseLevel(expertise.score);
      expertise.trend = this.calculateExpertiseTrend(domain);
      return deepClone(expertise);
    }

    // Return empty expertise if domain not yet learned
    return this.createInitialExpertise(domain);
  }

  /**
   * Get current confidence score
   */
  getConfidence(pattern: string): number {
    return this.confidenceScores.get(pattern) || this.config.initialConfidence;
  }

  /**
   * Set confidence score directly
   */
  setConfidence(pattern: string, score: number): void {
    const clamped = Math.max(this.config.minConfidence, Math.min(this.config.maxConfidence, score));
    const previous = this.confidenceScores.get(pattern) || this.config.initialConfidence;

    this.confidenceScores.set(pattern, clamped);
    this.recordConfidenceChange(pattern, clamped, 'manual_adjustment', clamped - previous);
  }

  /**
   * Apply correction to confidence
   */
  applyCorrection(pattern: string, correction: UserCorrection): void {
    const currentConfidence = this.confidenceScores.get(pattern) || this.config.initialConfidence;

    // Corrections indicate the system was wrong, so reduce confidence slightly
    const newConfidence = Math.max(currentConfidence - 3, this.config.minConfidence);
    this.confidenceScores.set(pattern, newConfidence);

    this.recordConfidenceChange(
      pattern,
      newConfidence,
      'user_correction',
      newConfidence - currentConfidence,
      correction.executionId
    );
  }
}

// ============================================================================
// CROSS-DOMAIN LEARNING SYSTEM
// ============================================================================

/**
 * Cross-Domain Learning implementation
 */
class CrossDomainLearningSystem {
  private signatures: Map<string, PatternSignature>;
  private executionHistory: Map<string, WorkflowExecution[]>;
  private unifiedInsights: UnifiedInsight[];

  constructor(
    signatures?: Map<string, PatternSignature>,
    executionHistory?: Map<string, WorkflowExecution[]>,
    insights?: UnifiedInsight[]
  ) {
    this.signatures = signatures || new Map();
    this.executionHistory = executionHistory || new Map();
    this.unifiedInsights = insights || [];
  }

  /**
   * Transfer learnings from one pattern to a different domain
   */
  transferLearnings(sourcePattern: string, targetDomain: string): TransferResult {
    const sourceSignature = this.signatures.get(sourcePattern);

    if (!sourceSignature) {
      return {
        success: false,
        sourcePattern,
        sourceDomain: 'unknown',
        targetDomain,
        transferConfidence: 0,
        adaptations: [],
        warnings: ['Source pattern not found'],
        recommendations: [],
      };
    }

    const sourceDomain = sourceSignature.domain;
    const adaptations: TransferAdaptation[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check domain compatibility
    const domainDef = DOMAIN_DEFINITIONS[sourceDomain];
    const targetDomainDef = DOMAIN_DEFINITIONS[targetDomain];

    if (!domainDef || !targetDomainDef) {
      warnings.push('One or both domains are not well-defined');
    }

    // Check if domains are related
    const areRelated = domainDef?.relatedDomains.includes(targetDomain) || false;
    if (!areRelated) {
      warnings.push(`${sourceDomain} and ${targetDomain} are not closely related domains`);
    }

    // Calculate base transfer confidence
    let transferConfidence = 50;
    if (areRelated) transferConfidence += 20;
    if (sourceSignature.averageMetrics.successRate > 0.8) transferConfidence += 15;
    if (sourceSignature.sampleSize >= 10) transferConfidence += 10;

    // Tool adaptations
    const toolAdaptations = this.adaptTools(sourceSignature.typicalTools, targetDomain);
    adaptations.push(...toolAdaptations);

    if (toolAdaptations.length > sourceSignature.typicalTools.length / 2) {
      warnings.push('Significant tool changes required - test thoroughly');
      transferConfidence -= 10;
    }

    // Generate adapted pattern key
    const adaptedPatternKey = this.generateAdaptedPatternKey(sourcePattern, targetDomain);

    // Add recommendations
    recommendations.push(`Start with small-scale testing in ${targetDomain}`);
    recommendations.push('Monitor success rate closely for first 10 executions');
    if (toolAdaptations.length > 0) {
      recommendations.push('Verify adapted tools have equivalent capabilities');
    }

    return {
      success: transferConfidence >= 40,
      sourcePattern,
      sourceDomain,
      targetDomain,
      adaptedPatternKey,
      transferConfidence: Math.min(100, Math.max(0, transferConfidence)),
      adaptations,
      warnings,
      recommendations,
    };
  }

  /**
   * Adapt tools for a different domain
   */
  private adaptTools(tools: string[], targetDomain: string): TransferAdaptation[] {
    const adaptations: TransferAdaptation[] = [];
    const targetDomainDef = DOMAIN_DEFINITIONS[targetDomain];

    if (!targetDomainDef) return adaptations;

    for (const tool of tools) {
      // Check if tool is appropriate for target domain
      if (!targetDomainDef.typicalTools.includes(tool)) {
        // Find similar tool in target domain
        const similarTool = this.findSimilarTool(tool, targetDomainDef.typicalTools);
        if (similarTool) {
          adaptations.push({
            type: 'tool_swap',
            description: `Replace ${tool} with ${similarTool}`,
            original: tool,
            adapted: similarTool,
            reason: `${similarTool} is more common in ${targetDomain} domain`,
          });
        }
      }
    }

    return adaptations;
  }

  /**
   * Find a similar tool from available options
   */
  private findSimilarTool(originalTool: string, availableTools: string[]): string | undefined {
    // Simple similarity based on tool categories
    const toolCategories: Record<string, string[]> = {
      email: ['mailchimp', 'sendgrid', 'gmail', 'outlook'],
      crm: ['salesforce', 'hubspot', 'pipedrive', 'zoho'],
      project: ['asana', 'jira', 'trello', 'monday', 'notion'],
      communication: ['slack', 'teams', 'discord'],
      storage: ['drive', 'dropbox', 'box', 'onedrive'],
      analytics: ['mixpanel', 'amplitude', 'segment'],
    };

    let originalCategory: string | undefined;
    for (const [category, tools] of Object.entries(toolCategories)) {
      if (tools.some(t => originalTool.toLowerCase().includes(t))) {
        originalCategory = category;
        break;
      }
    }

    if (originalCategory) {
      return availableTools.find(tool =>
        toolCategories[originalCategory]?.some(t => tool.toLowerCase().includes(t))
      );
    }

    return undefined;
  }

  /**
   * Generate adapted pattern key for target domain
   */
  private generateAdaptedPatternKey(sourcePattern: string, targetDomain: string): string {
    const parts = sourcePattern.split('_');
    return `${targetDomain}_${parts.slice(0, 3).join('_')}_adapted`;
  }

  /**
   * Find similar patterns across all domains
   */
  findSimilarPatterns(pattern: string): CrossDomainMatch[] {
    const matches: CrossDomainMatch[] = [];
    const sourceSignature = this.signatures.get(pattern);

    if (!sourceSignature) return matches;

    for (const [key, signature] of this.signatures) {
      if (key === pattern) continue;

      const similarity = this.calculatePatternSimilarity(sourceSignature, signature);

      if (similarity >= DEFAULT_LEARNING_CONFIG.crossDomainSimilarityThreshold * 100) {
        const executions = this.executionHistory.get(key) || [];
        const successfulExecs = executions.filter(e => e.success);

        matches.push({
          patternKey: key,
          domain: signature.domain,
          similarityScore: similarity,
          similarAspects: this.findSimilarAspects(sourceSignature, signature),
          differingAspects: this.findDifferingAspects(sourceSignature, signature),
          transferPotential: similarity >= 80 ? 'high' : similarity >= 60 ? 'medium' : 'low',
          executionCount: executions.length,
          successRate: executions.length > 0 ? successfulExecs.length / executions.length : 0,
        });
      }
    }

    return matches.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, DEFAULT_LEARNING_CONFIG.maxSimilarPatterns);
  }

  /**
   * Calculate similarity between two pattern signatures
   */
  calculateSimilarity(pattern1: string, pattern2: string): number {
    const sig1 = this.signatures.get(pattern1);
    const sig2 = this.signatures.get(pattern2);

    if (!sig1 || !sig2) return 0;

    return this.calculatePatternSimilarity(sig1, sig2);
  }

  /**
   * Calculate similarity between two signatures
   */
  private calculatePatternSimilarity(sig1: PatternSignature, sig2: PatternSignature): number {
    let similarity = 0;

    // Keyword overlap (40 points)
    const keywordOverlap = sig1.keywords.filter(k => sig2.keywords.includes(k));
    const keywordSimilarity = (keywordOverlap.length / Math.max(sig1.keywords.length, sig2.keywords.length)) * 40;
    similarity += keywordSimilarity;

    // Tool overlap (30 points)
    const toolOverlap = sig1.typicalTools.filter(t => sig2.typicalTools.includes(t));
    const toolSimilarity = (toolOverlap.length / Math.max(sig1.typicalTools.length, sig2.typicalTools.length)) * 30;
    similarity += toolSimilarity;

    // Structure similarity (20 points)
    const structureSimilarity = this.calculateStructureSimilarity(sig1.typicalStructure, sig2.typicalStructure) * 20;
    similarity += structureSimilarity;

    // Domain relationship (10 points)
    if (sig1.domain === sig2.domain) {
      similarity += 10;
    } else {
      const domainDef = DOMAIN_DEFINITIONS[sig1.domain];
      if (domainDef?.relatedDomains.includes(sig2.domain)) {
        similarity += 5;
      }
    }

    return Math.round(similarity);
  }

  /**
   * Calculate structure similarity
   */
  private calculateStructureSimilarity(struct1: WorkflowChainStep[], struct2: WorkflowChainStep[]): number {
    if (struct1.length === 0 || struct2.length === 0) return 0;

    // Compare layers
    const layers1 = struct1.map(s => s.layer);
    const layers2 = struct2.map(s => s.layer);

    const commonLayers = layers1.filter((l, i) => layers2[i] === l);
    return commonLayers.length / Math.max(layers1.length, layers2.length);
  }

  /**
   * Find aspects that are similar between patterns
   */
  private findSimilarAspects(sig1: PatternSignature, sig2: PatternSignature): string[] {
    const aspects: string[] = [];

    const keywordOverlap = sig1.keywords.filter(k => sig2.keywords.includes(k));
    if (keywordOverlap.length > 0) {
      aspects.push(`Common keywords: ${keywordOverlap.slice(0, 3).join(', ')}`);
    }

    const toolOverlap = sig1.typicalTools.filter(t => sig2.typicalTools.includes(t));
    if (toolOverlap.length > 0) {
      aspects.push(`Common tools: ${toolOverlap.slice(0, 3).join(', ')}`);
    }

    const layers1 = new Set(sig1.typicalStructure.map(s => s.layer));
    const layers2 = new Set(sig2.typicalStructure.map(s => s.layer));
    const commonLayers = [...layers1].filter(l => layers2.has(l));
    if (commonLayers.length > 0) {
      aspects.push(`Common workflow layers: ${commonLayers.join(', ')}`);
    }

    return aspects;
  }

  /**
   * Find aspects that differ between patterns
   */
  private findDifferingAspects(sig1: PatternSignature, sig2: PatternSignature): string[] {
    const aspects: string[] = [];

    if (sig1.domain !== sig2.domain) {
      aspects.push(`Different domains: ${sig1.domain} vs ${sig2.domain}`);
    }

    const uniqueTools1 = sig1.typicalTools.filter(t => !sig2.typicalTools.includes(t));
    if (uniqueTools1.length > 0) {
      aspects.push(`Unique tools in pattern 1: ${uniqueTools1.slice(0, 2).join(', ')}`);
    }

    const stepDiff = Math.abs(sig1.typicalStructure.length - sig2.typicalStructure.length);
    if (stepDiff > 0) {
      aspects.push(`Different step counts: ${sig1.typicalStructure.length} vs ${sig2.typicalStructure.length}`);
    }

    return aspects;
  }

  /**
   * Build unified insights from patterns across domains
   */
  buildUnifiedInsights(patterns: string[]): UnifiedInsight[] {
    const insights: UnifiedInsight[] = [];
    const relevantSignatures = patterns
      .map(p => this.signatures.get(p))
      .filter((s): s is PatternSignature => s !== undefined);

    if (relevantSignatures.length < 2) return insights;

    // Tool preference insight
    const toolInsight = this.buildToolPreferenceInsight(relevantSignatures);
    if (toolInsight) insights.push(toolInsight);

    // Performance insight
    const performanceInsight = this.buildPerformanceInsight(patterns);
    if (performanceInsight) insights.push(performanceInsight);

    // Best practice insight
    const bestPracticeInsight = this.buildBestPracticeInsight(patterns);
    if (bestPracticeInsight) insights.push(bestPracticeInsight);

    // Store for future reference
    this.unifiedInsights.push(...insights);

    return insights;
  }

  /**
   * Build tool preference insight
   */
  private buildToolPreferenceInsight(signatures: PatternSignature[]): UnifiedInsight | null {
    const toolCounts: Record<string, { domains: Set<string>; count: number }> = {};

    for (const sig of signatures) {
      for (const tool of sig.typicalTools) {
        if (!toolCounts[tool]) {
          toolCounts[tool] = { domains: new Set(), count: 0 };
        }
        toolCounts[tool].domains.add(sig.domain);
        toolCounts[tool].count++;
      }
    }

    // Find tools used across multiple domains
    const crossDomainTools = Object.entries(toolCounts)
      .filter(([, data]) => data.domains.size >= 2)
      .sort(([, a], [, b]) => b.count - a.count);

    if (crossDomainTools.length === 0) return null;

    const topTool = crossDomainTools[0];
    return {
      insightId: generateId('insight'),
      type: 'tool_preference',
      title: `${topTool[0]} works well across domains`,
      description: `${topTool[0]} is successfully used in ${topTool[1].domains.size} different domains: ${[...topTool[1].domains].join(', ')}`,
      applicableDomains: [...topTool[1].domains],
      sourcePatterns: signatures.filter(s => s.typicalTools.includes(topTool[0])).map(s => s.patternKey),
      confidence: Math.min(70 + topTool[1].count * 5, 95),
      recommendations: [
        `Consider ${topTool[0]} for new workflows in these domains`,
        'Standardize on this tool when possible for consistency',
      ],
      generatedAt: new Date(),
      evidence: [{
        type: 'execution_data',
        domain: 'multiple',
        patternKey: 'aggregate',
        description: `Used in ${topTool[1].count} patterns across ${topTool[1].domains.size} domains`,
      }],
    };
  }

  /**
   * Build performance insight
   */
  private buildPerformanceInsight(patterns: string[]): UnifiedInsight | null {
    const performances: Array<{
      pattern: string;
      domain: string;
      successRate: number;
      avgDuration: number;
    }> = [];

    for (const pattern of patterns) {
      const executions = this.executionHistory.get(pattern);
      if (!executions || executions.length < 3) continue;

      const successfulExecs = executions.filter(e => e.success);
      performances.push({
        pattern,
        domain: executions[0].domain,
        successRate: successfulExecs.length / executions.length,
        avgDuration: average(successfulExecs.map(e => e.durationMs || 0)),
      });
    }

    if (performances.length < 2) return null;

    // Find the fastest pattern with good success rate
    const fastestReliable = performances
      .filter(p => p.successRate >= 0.8)
      .sort((a, b) => a.avgDuration - b.avgDuration)[0];

    if (!fastestReliable) return null;

    return {
      insightId: generateId('insight'),
      type: 'performance_trend',
      title: `Pattern ${fastestReliable.pattern} is fast and reliable`,
      description: `With ${Math.round(fastestReliable.successRate * 100)}% success rate and ${Math.round(fastestReliable.avgDuration)}ms average duration, this pattern could serve as a template for similar workflows.`,
      applicableDomains: [fastestReliable.domain],
      sourcePatterns: [fastestReliable.pattern],
      confidence: Math.round(fastestReliable.successRate * 90),
      recommendations: [
        'Study this pattern structure for best practices',
        'Consider using similar tool combinations in new workflows',
      ],
      generatedAt: new Date(),
      evidence: [{
        type: 'benchmark',
        domain: fastestReliable.domain,
        patternKey: fastestReliable.pattern,
        description: 'Performance analysis',
        metrics: {
          successRate: fastestReliable.successRate,
          avgDurationMs: fastestReliable.avgDuration,
        },
      }],
    };
  }

  /**
   * Build best practice insight
   */
  private buildBestPracticeInsight(patterns: string[]): UnifiedInsight | null {
    // Find common successful patterns
    const successfulPatterns: Array<{
      pattern: string;
      structure: string[];
    }> = [];

    for (const pattern of patterns) {
      const executions = this.executionHistory.get(pattern);
      if (!executions) continue;

      const successfulExecs = executions.filter(e => e.success);
      if (successfulExecs.length >= 3 && successfulExecs.length / executions.length >= 0.8) {
        successfulPatterns.push({
          pattern,
          structure: successfulExecs[0].steps.map(s => s.layer),
        });
      }
    }

    if (successfulPatterns.length < 2) return null;

    // Find common structure
    const structureCounts: Record<string, number> = {};
    for (const p of successfulPatterns) {
      const key = p.structure.join(' -> ');
      structureCounts[key] = (structureCounts[key] || 0) + 1;
    }

    const mostCommonStructure = Object.entries(structureCounts)
      .sort(([, a], [, b]) => b - a)[0];

    if (!mostCommonStructure || mostCommonStructure[1] < 2) return null;

    return {
      insightId: generateId('insight'),
      type: 'best_practice',
      title: 'Common successful workflow structure',
      description: `Workflows following the structure "${mostCommonStructure[0]}" have high success rates across ${mostCommonStructure[1]} patterns.`,
      applicableDomains: [...new Set(successfulPatterns.map(p => detectDomain(p.pattern)))],
      sourcePatterns: successfulPatterns.map(p => p.pattern),
      confidence: 60 + mostCommonStructure[1] * 10,
      recommendations: [
        `Follow this structure: ${mostCommonStructure[0]}`,
        'Ensure each layer has appropriate tools assigned',
      ],
      generatedAt: new Date(),
      evidence: [{
        type: 'comparison',
        domain: 'multiple',
        patternKey: 'aggregate',
        description: `Structure found in ${mostCommonStructure[1]} successful patterns`,
      }],
    };
  }

  /**
   * Update signatures
   */
  updateSignatures(signatures: Map<string, PatternSignature>): void {
    this.signatures = signatures;
  }

  /**
   * Update execution history
   */
  updateExecutionHistory(history: Map<string, WorkflowExecution[]>): void {
    this.executionHistory = history;
  }

  /**
   * Get all unified insights
   */
  getUnifiedInsights(): UnifiedInsight[] {
    return [...this.unifiedInsights];
  }
}

// ============================================================================
// LEARNING STORE
// ============================================================================

/**
 * Learning Store implementation - in-memory with persistence interface
 */
class LearningStoreImpl {
  private patternSignatures: Map<string, PatternSignature> = new Map();
  private confidenceScores: Map<string, number> = new Map();
  private confidenceHistory: Map<string, ConfidenceRecord[]> = new Map();
  private executionHistory: Map<string, WorkflowExecution[]> = new Map();
  private corrections: Map<string, UserCorrection[]> = new Map();
  private domainExpertise: Map<string, ExpertiseScore> = new Map();
  private unifiedInsights: UnifiedInsight[] = [];
  private optimizationSuggestions: Map<string, OptimizationSuggestion[]> = new Map();
  private statistics: LearningStatistics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    totalPatterns: 0,
    totalCorrections: 0,
    totalFeedback: 0,
    averageConfidence: 0,
  };

  constructor(initialState?: LearningState) {
    if (initialState) {
      this.importState(initialState);
    }
  }

  /**
   * Create initial statistics
   */
  private createInitialStatistics(): LearningStatistics {
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      totalPatterns: 0,
      totalCorrections: 0,
      totalFeedback: 0,
      averageConfidence: 0,
    };
  }

  /**
   * Record a workflow execution
   */
  recordExecution(execution: WorkflowExecution): void {
    const pattern = execution.patternKey;

    if (!this.executionHistory.has(pattern)) {
      this.executionHistory.set(pattern, []);
    }

    const history = this.executionHistory.get(pattern)!;
    history.push(execution);

    // Trim if needed
    if (history.length > DEFAULT_LEARNING_CONFIG.maxExecutionHistoryPerPattern) {
      history.splice(0, history.length - DEFAULT_LEARNING_CONFIG.maxExecutionHistoryPerPattern);
    }

    // Update statistics
    this.statistics.totalExecutions++;
    if (execution.success) {
      this.statistics.successfulExecutions++;
    }
    if (execution.feedback) {
      this.statistics.totalFeedback++;
    }
    this.statistics.lastActivity = new Date();

    // Check if this creates a new pattern
    if (!this.patternSignatures.has(pattern)) {
      this.statistics.totalPatterns++;
    }
  }

  /**
   * Get execution history for a pattern
   */
  getExecutionHistory(pattern: string, limit?: number): WorkflowExecution[] {
    const history = this.executionHistory.get(pattern) || [];
    if (limit) {
      return history.slice(-limit);
    }
    return [...history];
  }

  /**
   * Get confidence score for a pattern
   */
  getConfidence(pattern: string): number {
    return this.confidenceScores.get(pattern) || DEFAULT_CONFIDENCE_CONFIG.initialConfidence;
  }

  /**
   * Set confidence score for a pattern
   */
  setConfidence(pattern: string, score: number): void {
    this.confidenceScores.set(pattern, score);
    this.updateAverageConfidence();
  }

  /**
   * Update average confidence statistic
   */
  private updateAverageConfidence(): void {
    const scores = [...this.confidenceScores.values()];
    this.statistics.averageConfidence = scores.length > 0 ? average(scores) : 0;
  }

  /**
   * Record a user correction
   */
  recordCorrection(pattern: string, correction: UserCorrection): void {
    if (!this.corrections.has(pattern)) {
      this.corrections.set(pattern, []);
    }

    const corrections = this.corrections.get(pattern)!;
    corrections.push(correction);

    // Trim if needed
    if (corrections.length > DEFAULT_LEARNING_CONFIG.maxCorrectionsPerPattern) {
      corrections.splice(0, corrections.length - DEFAULT_LEARNING_CONFIG.maxCorrectionsPerPattern);
    }

    this.statistics.totalCorrections++;
  }

  /**
   * Get corrections for a pattern
   */
  getCorrections(pattern: string): UserCorrection[] {
    return [...(this.corrections.get(pattern) || [])];
  }

  /**
   * Get pattern signature
   */
  getPatternSignature(pattern: string): PatternSignature | undefined {
    return this.patternSignatures.get(pattern);
  }

  /**
   * Set pattern signature
   */
  setPatternSignature(signature: PatternSignature): void {
    this.patternSignatures.set(signature.patternKey, signature);
  }

  /**
   * Get confidence history
   */
  getConfidenceHistory(pattern: string): ConfidenceRecord[] {
    return [...(this.confidenceHistory.get(pattern) || [])];
  }

  /**
   * Add confidence record
   */
  addConfidenceRecord(pattern: string, record: ConfidenceRecord): void {
    if (!this.confidenceHistory.has(pattern)) {
      this.confidenceHistory.set(pattern, []);
    }

    const history = this.confidenceHistory.get(pattern)!;
    history.push(record);

    if (history.length > DEFAULT_LEARNING_CONFIG.maxConfidenceHistoryPerPattern) {
      history.splice(0, history.length - DEFAULT_LEARNING_CONFIG.maxConfidenceHistoryPerPattern);
    }
  }

  /**
   * Get domain expertise
   */
  getDomainExpertise(domain: string): ExpertiseScore | undefined {
    return this.domainExpertise.get(domain);
  }

  /**
   * Set domain expertise
   */
  setDomainExpertise(expertise: ExpertiseScore): void {
    this.domainExpertise.set(expertise.domain, expertise);
  }

  /**
   * Get all domain expertise
   */
  getAllDomainExpertise(): Map<string, ExpertiseScore> {
    return new Map(this.domainExpertise);
  }

  /**
   * Get unified insights
   */
  getUnifiedInsights(): UnifiedInsight[] {
    return [...this.unifiedInsights];
  }

  /**
   * Add unified insight
   */
  addUnifiedInsight(insight: UnifiedInsight): void {
    this.unifiedInsights.push(insight);
  }

  /**
   * Get optimization suggestions for a pattern
   */
  getOptimizationSuggestions(pattern: string): OptimizationSuggestion[] {
    return [...(this.optimizationSuggestions.get(pattern) || [])];
  }

  /**
   * Set optimization suggestions for a pattern
   */
  setOptimizationSuggestions(pattern: string, suggestions: OptimizationSuggestion[]): void {
    this.optimizationSuggestions.set(pattern, suggestions);
  }

  /**
   * Get statistics
   */
  getStatistics(): LearningStatistics {
    return { ...this.statistics };
  }

  /**
   * Get all pattern signatures
   */
  getAllPatternSignatures(): Map<string, PatternSignature> {
    return new Map(this.patternSignatures);
  }

  /**
   * Get all confidence scores
   */
  getAllConfidenceScores(): Map<string, number> {
    return new Map(this.confidenceScores);
  }

  /**
   * Get all execution history
   */
  getAllExecutionHistory(): Map<string, WorkflowExecution[]> {
    return new Map(this.executionHistory);
  }

  /**
   * Get all confidence history
   */
  getAllConfidenceHistory(): Map<string, ConfidenceRecord[]> {
    return new Map(this.confidenceHistory);
  }

  /**
   * Get all corrections
   */
  getAllCorrections(): Map<string, UserCorrection[]> {
    return new Map(this.corrections);
  }

  /**
   * Get all optimization suggestions
   */
  getAllOptimizationSuggestions(): Map<string, OptimizationSuggestion[]> {
    return new Map(this.optimizationSuggestions);
  }

  /**
   * Export complete state for persistence
   */
  exportState(): LearningState {
    // Update statistics before export
    this.statistics.totalPatterns = this.patternSignatures.size;
    this.updateAverageConfidence();

    // Find top domain
    let topDomain: string | undefined;
    let topDomainScore = 0;
    for (const [domain, expertise] of this.domainExpertise) {
      if (expertise.score > topDomainScore) {
        topDomainScore = expertise.score;
        topDomain = domain;
      }
    }
    this.statistics.topDomain = topDomain;

    // Find top pattern
    let topPattern: string | undefined;
    let topPatternCount = 0;
    for (const [pattern, history] of this.executionHistory) {
      if (history.length > topPatternCount) {
        topPatternCount = history.length;
        topPattern = pattern;
      }
    }
    this.statistics.topPattern = topPattern;

    return {
      version: 1,
      exportedAt: new Date(),
      patternSignatures: Object.fromEntries(this.patternSignatures),
      confidenceScores: Object.fromEntries(this.confidenceScores),
      confidenceHistory: Object.fromEntries(this.confidenceHistory),
      executionHistory: Object.fromEntries(this.executionHistory),
      corrections: Object.fromEntries(this.corrections),
      domainExpertise: Object.fromEntries(this.domainExpertise),
      unifiedInsights: [...this.unifiedInsights],
      optimizationSuggestions: Object.fromEntries(this.optimizationSuggestions),
      statistics: { ...this.statistics },
    };
  }

  /**
   * Import state from persistence
   */
  importState(state: LearningState): void {
    // Convert Records back to Maps (handles both formats)
    this.patternSignatures = state.patternSignatures instanceof Map
      ? state.patternSignatures
      : new Map(Object.entries(state.patternSignatures));

    this.confidenceScores = state.confidenceScores instanceof Map
      ? state.confidenceScores
      : new Map(Object.entries(state.confidenceScores));

    this.confidenceHistory = state.confidenceHistory instanceof Map
      ? state.confidenceHistory
      : new Map(Object.entries(state.confidenceHistory));

    this.executionHistory = state.executionHistory instanceof Map
      ? state.executionHistory
      : new Map(Object.entries(state.executionHistory));

    this.corrections = state.corrections instanceof Map
      ? state.corrections
      : new Map(Object.entries(state.corrections));

    this.domainExpertise = state.domainExpertise instanceof Map
      ? state.domainExpertise
      : new Map(Object.entries(state.domainExpertise));

    this.unifiedInsights = [...state.unifiedInsights];

    this.optimizationSuggestions = state.optimizationSuggestions instanceof Map
      ? state.optimizationSuggestions
      : new Map(Object.entries(state.optimizationSuggestions));

    this.statistics = { ...state.statistics };

    // Convert date strings back to Date objects
    this.convertDates();
  }

  /**
   * Convert date strings back to Date objects after import
   */
  private convertDates(): void {
    // Pattern signatures
    for (const sig of this.patternSignatures.values()) {
      if (typeof sig.lastUpdated === 'string') {
        sig.lastUpdated = new Date(sig.lastUpdated);
      }
    }

    // Confidence history
    for (const history of this.confidenceHistory.values()) {
      for (const record of history) {
        if (typeof record.timestamp === 'string') {
          record.timestamp = new Date(record.timestamp);
        }
      }
    }

    // Execution history
    for (const history of this.executionHistory.values()) {
      for (const exec of history) {
        if (typeof exec.startedAt === 'string') {
          exec.startedAt = new Date(exec.startedAt);
        }
        if (exec.completedAt && typeof exec.completedAt === 'string') {
          exec.completedAt = new Date(exec.completedAt);
        }
        if (exec.feedback?.providedAt && typeof exec.feedback.providedAt === 'string') {
          exec.feedback.providedAt = new Date(exec.feedback.providedAt);
        }
      }
    }

    // Corrections
    for (const corrections of this.corrections.values()) {
      for (const correction of corrections) {
        if (typeof correction.correctedAt === 'string') {
          correction.correctedAt = new Date(correction.correctedAt);
        }
      }
    }

    // Domain expertise
    for (const expertise of this.domainExpertise.values()) {
      if (typeof expertise.lastActivity === 'string') {
        expertise.lastActivity = new Date(expertise.lastActivity);
      }
    }

    // Unified insights
    for (const insight of this.unifiedInsights) {
      if (typeof insight.generatedAt === 'string') {
        insight.generatedAt = new Date(insight.generatedAt);
      }
    }

    // Statistics
    if (this.statistics.lastActivity && typeof this.statistics.lastActivity === 'string') {
      this.statistics.lastActivity = new Date(this.statistics.lastActivity);
    }
  }

  /**
   * Clear all data for a pattern
   */
  clearPattern(pattern: string): void {
    this.patternSignatures.delete(pattern);
    this.confidenceScores.delete(pattern);
    this.confidenceHistory.delete(pattern);
    this.executionHistory.delete(pattern);
    this.corrections.delete(pattern);
    this.optimizationSuggestions.delete(pattern);
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.patternSignatures.clear();
    this.confidenceScores.clear();
    this.confidenceHistory.clear();
    this.executionHistory.clear();
    this.corrections.clear();
    this.domainExpertise.clear();
    this.unifiedInsights = [];
    this.optimizationSuggestions.clear();
    this.statistics = this.createInitialStatistics();
  }
}

// ============================================================================
// MAIN LEARNING ENGINE CLASS
// ============================================================================

/**
 * Main Learning Engine - Orchestrates all learning subsystems
 *
 * @example
 * ```typescript
 * // Initialize with optional persisted state
 * const engine = new LearningEngine();
 *
 * // Record an execution
 * engine.recordExecution({
 *   id: 'exec-123',
 *   workflowId: 'wf-456',
 *   userRequest: 'Send weekly sales report to team',
 *   patternKey: 'report_sales_weekly',
 *   domain: 'sales',
 *   startedAt: new Date(),
 *   success: true,
 *   steps: [...],
 *   toolsUsed: [...],
 *   context: {...},
 *   metrics: {...},
 *   tags: []
 * });
 *
 * // Get recommendations for a new request
 * const recommendations = engine.getRecommendations(
 *   'Send monthly finance report',
 *   { timestamp: new Date() }
 * );
 * ```
 */
export class LearningEngine {
  private store: LearningStoreImpl;
  private patternRecognition: PatternRecognitionSystem;
  private confidenceScoring: ConfidenceScoringSystem;
  private crossDomainLearning: CrossDomainLearningSystem;

  /**
   * Create a new LearningEngine instance
   *
   * @param initialState - Optional persisted state to restore from
   */
  constructor(initialState?: LearningState) {
    this.store = new LearningStoreImpl(initialState);

    // Initialize subsystems with store data
    this.patternRecognition = new PatternRecognitionSystem(
      this.store.getAllPatternSignatures(),
      this.store.getAllExecutionHistory()
    );

    this.confidenceScoring = new ConfidenceScoringSystem(
      this.store.getAllConfidenceScores(),
      this.store.getAllConfidenceHistory(),
      this.store.getAllDomainExpertise()
    );

    this.crossDomainLearning = new CrossDomainLearningSystem(
      this.store.getAllPatternSignatures(),
      this.store.getAllExecutionHistory(),
      this.store.getUnifiedInsights()
    );
  }

  /**
   * Record a workflow execution for learning
   *
   * This method should be called after every workflow execution to enable
   * the learning engine to improve its recommendations over time.
   *
   * @param execution - The workflow execution to record
   */
  recordExecution(execution: WorkflowExecution): void {
    // Store the execution
    this.store.recordExecution(execution);

    // Update confidence based on outcome
    this.confidenceScoring.updateConfidence(
      execution.patternKey,
      execution.success,
      execution.feedback,
      execution.id
    );

    // Sync confidence to store
    this.store.setConfidence(
      execution.patternKey,
      this.confidenceScoring.getConfidence(execution.patternKey)
    );

    // Update pattern signature if enough executions
    const history = this.store.getExecutionHistory(execution.patternKey);
    if (history.length >= DEFAULT_LEARNING_CONFIG.minExecutionsForLearned) {
      const signature = this.patternRecognition.buildPatternSignature(history);
      this.store.setPatternSignature(signature);
      this.patternRecognition.updateSignature(signature);
    }

    // Update pattern recognition
    this.patternRecognition.addExecution(execution);

    // Detect optimizations periodically
    if (history.length % 5 === 0) {
      const suggestions = this.patternRecognition.detectOptimizations(execution.patternKey);
      if (suggestions.length > 0) {
        this.store.setOptimizationSuggestions(execution.patternKey, suggestions);
      }
    }

    // Update cross-domain learning
    this.crossDomainLearning.updateSignatures(this.store.getAllPatternSignatures());
    this.crossDomainLearning.updateExecutionHistory(this.store.getAllExecutionHistory());
  }

  /**
   * Record user feedback for an execution
   *
   * @param executionId - ID of the execution
   * @param feedback - User feedback
   */
  recordFeedback(executionId: string, feedback: UserFeedback): void {
    // Find the execution
    for (const [pattern, history] of this.store.getAllExecutionHistory()) {
      const execution = history.find(e => e.id === executionId);
      if (execution) {
        execution.feedback = feedback;

        // Update confidence based on feedback
        this.confidenceScoring.updateConfidence(pattern, execution.success, feedback, executionId);
        this.store.setConfidence(pattern, this.confidenceScoring.getConfidence(pattern));
        break;
      }
    }
  }

  /**
   * Record a user correction
   *
   * @param correction - The correction to record
   */
  recordCorrection(correction: UserCorrection): void {
    this.store.recordCorrection(correction.patternKey, correction);
    this.confidenceScoring.applyCorrection(correction.patternKey, correction);
    this.store.setConfidence(
      correction.patternKey,
      this.confidenceScoring.getConfidence(correction.patternKey)
    );
  }

  /**
   * Get recommendations based on learned patterns
   *
   * @param request - The user's request
   * @param context - Context for the request
   * @returns Array of learned recommendations sorted by confidence
   */
  getRecommendations(request: string, context: RequestContext): LearnedRecommendation[] {
    const recommendations: LearnedRecommendation[] = [];
    const normalizedRequest = request.toLowerCase();
    const requestKeywords = extractKeywords(normalizedRequest);
    const detectedDomain = detectDomain(normalizedRequest);

    // Create a mock execution for pattern analysis
    const mockExecution: WorkflowExecution = {
      id: 'analysis',
      workflowId: 'analysis',
      userRequest: request,
      patternKey: normalizePatternKey(request),
      domain: detectedDomain,
      startedAt: new Date(),
      success: true,
      steps: [],
      toolsUsed: [],
      context: {
        timeOfDay: getTimeOfDay(context.timestamp),
        dayOfWeek: getDayOfWeek(context.timestamp),
        isRetry: false,
        additionalContext: {},
        ...context,
      },
      metrics: { apiCallCount: 0, dataProcessedBytes: 0, retryCount: 0 },
      tags: [],
    };

    // Get pattern matches
    const patternMatches = this.patternRecognition.analyzeWorkflowPattern(mockExecution);

    // Convert matches to recommendations
    for (const match of patternMatches) {
      if (match.confidence < DEFAULT_LEARNING_CONFIG.minRecommendationConfidence) continue;

      const signature = this.store.getPatternSignature(match.patternKey);
      const history = this.store.getExecutionHistory(match.patternKey);
      const corrections = this.store.getCorrections(match.patternKey);
      const optimizations = this.store.getOptimizationSuggestions(match.patternKey);

      // Calculate contextual confidence
      const contextualConfidence = this.confidenceScoring.calculatePatternConfidence(
        match.patternKey,
        context
      );

      // Build tool recommendations from signature
      const toolRecommendations: ToolRecommendation[] = signature?.typicalTools.map(tool => ({
        toolSlug: tool,
        toolName: tool,
        score: 80,
        reasons: [`Used successfully in ${match.successfulExecutions} executions`],
        regionalFit: context.region ? 90 : 100,
        alternatives: [],
      })) || [];

      // Build warnings from corrections and optimizations
      const warnings: string[] = [];
      for (const correction of corrections) {
        if (!correction.incorporated) {
          warnings.push(`User correction pending: ${correction.correctionType}`);
        }
      }
      for (const opt of optimizations) {
        if (opt.priority === 'high' || opt.priority === 'critical') {
          warnings.push(opt.description);
        }
      }

      // Build tips from successful executions
      const tips: string[] = [];
      const successfulExecs = history.filter(e => e.success);
      if (successfulExecs.length > 0) {
        const fastestExec = successfulExecs.reduce((a, b) =>
          (a.durationMs || Infinity) < (b.durationMs || Infinity) ? a : b
        );
        if (fastestExec.durationMs && fastestExec.durationMs < match.averageDurationMs * 0.8) {
          tips.push(`Fastest execution used tools: ${fastestExec.toolsUsed.map(t => t.toolName).join(', ')}`);
        }
      }

      // Find alternative approaches
      const alternatives: AlternativeApproach[] = [];
      for (const similar of match.similarPatterns) {
        const similarSig = this.store.getPatternSignature(similar);
        if (similarSig) {
          alternatives.push({
            description: `Alternative pattern: ${similar}`,
            patternKey: similar,
            confidence: this.confidenceScoring.getConfidence(similar),
            tradeoffs: [`Different tool set: ${similarSig.typicalTools.slice(0, 3).join(', ')}`],
          });
        }
      }

      recommendations.push({
        recommendationId: generateId('rec'),
        type: 'pattern_match',
        patternKey: match.patternKey,
        confidence: contextualConfidence,
        toolRecommendations,
        suggestedStructure: signature?.typicalStructure || [],
        expectedDurationMs: match.averageDurationMs,
        expectedSuccessRate: signature?.averageMetrics.successRate || 0.5,
        warnings,
        tips,
        alternatives,
      });
    }

    // Add cross-domain recommendations if needed
    if (recommendations.length < 3) {
      const crossDomainRecs = this.getCrossDomainRecommendations(requestKeywords, context);
      recommendations.push(...crossDomainRecs);
    }

    // Sort by confidence and limit
    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, DEFAULT_LEARNING_CONFIG.maxRecommendations);
  }

  /**
   * Get cross-domain recommendations
   */
  private getCrossDomainRecommendations(
    keywords: string[],
    _context: RequestContext
  ): LearnedRecommendation[] {
    const recommendations: LearnedRecommendation[] = [];
    const allPatterns = [...this.store.getAllPatternSignatures().keys()];

    for (const pattern of allPatterns) {
      const similarPatterns = this.crossDomainLearning.findSimilarPatterns(pattern);

      for (const match of similarPatterns) {
        if (match.transferPotential !== 'high') continue;

        const transferResult = this.crossDomainLearning.transferLearnings(
          match.patternKey,
          detectDomain(keywords.join(' '))
        );

        if (transferResult.success) {
          const signature = this.store.getPatternSignature(match.patternKey);

          recommendations.push({
            recommendationId: generateId('rec'),
            type: 'cross_domain_transfer',
            patternKey: match.patternKey,
            confidence: transferResult.transferConfidence,
            toolRecommendations: signature?.typicalTools.map(tool => ({
              toolSlug: tool,
              toolName: tool,
              score: 70,
              reasons: ['Transferred from similar pattern'],
              regionalFit: 80,
              alternatives: [],
            })) || [],
            suggestedStructure: signature?.typicalStructure || [],
            expectedDurationMs: signature?.averageMetrics.durationMs || 5000,
            expectedSuccessRate: match.successRate * 0.8, // Reduce by 20% for cross-domain
            warnings: transferResult.warnings,
            tips: transferResult.recommendations,
            alternatives: [],
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Enhance pattern detection with learning improvements
   *
   * @param pattern - The pattern key to enhance
   * @param domain - The domain for context
   * @returns Enhanced pattern with optimizations
   */
  enhancePatternDetection(pattern: string, domain: string): EnhancedPattern {
    const signature = this.store.getPatternSignature(pattern);
    const corrections = this.store.getCorrections(pattern);
    const optimizations = this.store.getOptimizationSuggestions(pattern);
    const history = this.store.getExecutionHistory(pattern);

    const enhancements: PatternEnhancement[] = [];

    // Apply corrections
    for (const correction of corrections) {
      if (correction.applyToFuture && !correction.incorporated) {
        enhancements.push({
          type: correction.correctionType === 'tool_preference' ? 'tool_optimization' : 'parameter_tuning',
          description: `User correction: ${correction.original} -> ${correction.corrected}`,
          impact: 'high',
          source: 'user_correction',
        });
      }
    }

    // Apply optimizations
    for (const opt of optimizations) {
      if (opt.confidence >= 70) {
        enhancements.push({
          type: opt.optimizationType === 'tool_replacement' ? 'tool_optimization' : 'step_optimization',
          description: opt.description,
          impact: opt.priority === 'high' || opt.priority === 'critical' ? 'high' : 'medium',
          source: 'optimization_analysis',
        });
      }
    }

    // Cross-domain learning
    const similarPatterns = this.crossDomainLearning.findSimilarPatterns(pattern);
    for (const similar of similarPatterns) {
      if (similar.successRate > 0.9 && similar.domain !== domain) {
        enhancements.push({
          type: 'step_optimization',
          description: `Learning from ${similar.domain}: ${similar.similarAspects[0] || 'structure'}`,
          impact: 'medium',
          source: 'cross_domain',
        });
      }
    }

    // Calculate predicted improvements
    const predictedImprovements: EnhancedPattern['predictedImprovements'] = {};
    for (const opt of optimizations) {
      if (opt.optimizationType === 'performance_improvement') {
        predictedImprovements.durationReduction = opt.expectedImprovement;
      }
      if (opt.optimizationType === 'reliability_improvement') {
        predictedImprovements.successRateIncrease = opt.expectedImprovement;
      }
      if (opt.optimizationType === 'cost_reduction') {
        predictedImprovements.costReduction = opt.expectedImprovement;
      }
    }

    // Build optimized tool recommendations
    const optimizedTools: ToolRecommendation[] = signature?.typicalTools.map(tool => {
      // Check if there's a correction for this tool
      const toolCorrection = corrections.find(
        c => c.correctionType === 'tool_preference' && c.original === tool
      );

      return {
        toolSlug: toolCorrection?.corrected || tool,
        toolName: toolCorrection?.corrected || tool,
        score: toolCorrection ? 95 : 85,
        reasons: toolCorrection
          ? ['User-preferred tool']
          : [`Used in ${history.filter(e => e.success).length} successful executions`],
        regionalFit: 90,
        alternatives: [],
      };
    }) || [];

    return {
      originalPatternKey: pattern,
      enhancedPatternKey: enhancements.length > 0 ? `${pattern}_enhanced` : pattern,
      domain,
      enhancements,
      confidence: this.confidenceScoring.getConfidence(pattern),
      optimizedTools,
      optimizedStructure: signature?.typicalStructure || [],
      predictedImprovements,
    };
  }

  /**
   * Get learning metrics
   *
   * @returns Current metrics about the learning engine
   */
  getMetrics(): LearningMetrics {
    const stats = this.store.getStatistics();
    const allConfidences = [...this.store.getAllConfidenceScores().values()];
    const highConfidenceCount = allConfidences.filter(c => c >= DEFAULT_CONFIDENCE_CONFIG.highConfidenceThreshold).length;

    // Calculate learning trend
    const recentHistory = [...this.store.getAllConfidenceHistory().values()]
      .flat()
      .filter(r => Date.now() - r.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000);

    const recentDeltas = recentHistory.map(r => r.delta);
    const avgDelta = recentDeltas.length > 0 ? average(recentDeltas) : 0;

    let learningTrend: 'improving' | 'stable' | 'needs_attention' = 'stable';
    if (avgDelta > 1) learningTrend = 'improving';
    if (avgDelta < -1) learningTrend = 'needs_attention';

    // Identify improvement areas
    const improvementAreas: string[] = [];

    // Check for patterns with declining confidence
    for (const [pattern, history] of this.store.getAllConfidenceHistory()) {
      if (history.length >= 5) {
        const recent = history.slice(-5);
        const avgRecentDelta = average(recent.map(r => r.delta));
        if (avgRecentDelta < -2) {
          improvementAreas.push(`Pattern "${pattern}" has declining confidence`);
        }
      }
    }

    // Check for domains with low expertise
    for (const [domain, expertise] of this.store.getAllDomainExpertise()) {
      if (expertise.level === 'novice' || expertise.level === 'beginner') {
        if (expertise.totalExecutions >= 5) {
          improvementAreas.push(`Low expertise in ${domain} despite activity`);
        }
      }
    }

    // Count cross-domain transfers
    const insights = this.store.getUnifiedInsights();
    const transferInsights = insights.filter(i => i.type === 'tool_preference' || i.type === 'best_practice');

    // Calculate recommendation accuracy from feedback
    let correctRecommendations = 0;
    let totalFeedback = 0;
    for (const history of this.store.getAllExecutionHistory().values()) {
      for (const exec of history) {
        if (exec.feedback) {
          totalFeedback++;
          if (exec.feedback.rating >= 4) {
            correctRecommendations++;
          }
        }
      }
    }

    return {
      effectivenessScore: this.calculateEffectivenessScore(stats, allConfidences),
      totalPatterns: stats.totalPatterns,
      highConfidencePatterns: highConfidenceCount,
      averageConfidence: stats.averageConfidence,
      totalExecutions: stats.totalExecutions,
      overallSuccessRate: stats.totalExecutions > 0
        ? stats.successfulExecutions / stats.totalExecutions
        : 0,
      domainsWithExpertise: this.store.getAllDomainExpertise().size,
      crossDomainTransfers: transferInsights.length,
      successfulTransfers: transferInsights.filter(i => i.confidence >= 70).length,
      correctionsIncorporated: stats.totalCorrections,
      recommendationAccuracy: totalFeedback > 0 ? correctRecommendations / totalFeedback : 0,
      learningTrend,
      improvementAreas: improvementAreas.slice(0, 5),
    };
  }

  /**
   * Calculate overall effectiveness score
   */
  private calculateEffectivenessScore(stats: LearningStatistics, confidences: number[]): number {
    let score = 0;

    // Success rate contribution (up to 40 points)
    const successRate = stats.totalExecutions > 0
      ? stats.successfulExecutions / stats.totalExecutions
      : 0;
    score += successRate * 40;

    // Average confidence contribution (up to 30 points)
    score += (stats.averageConfidence / 100) * 30;

    // Pattern coverage contribution (up to 20 points)
    const patternsWithHighConfidence = confidences.filter(c => c >= 70).length;
    const coverageRatio = confidences.length > 0
      ? patternsWithHighConfidence / confidences.length
      : 0;
    score += coverageRatio * 20;

    // Learning activity contribution (up to 10 points)
    const daysSinceActivity = stats.lastActivity
      ? (Date.now() - stats.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      : 30;
    const activityScore = Math.max(10 - daysSinceActivity, 0);
    score += activityScore;

    return Math.round(score);
  }

  /**
   * Reset learning for a specific pattern or all patterns
   *
   * @param pattern - Optional pattern to reset. If not provided, resets everything.
   */
  reset(pattern?: string): void {
    if (pattern) {
      this.store.clearPattern(pattern);
    } else {
      this.store.clearAll();
    }

    // Reinitialize subsystems
    this.patternRecognition = new PatternRecognitionSystem(
      this.store.getAllPatternSignatures(),
      this.store.getAllExecutionHistory()
    );

    this.confidenceScoring = new ConfidenceScoringSystem(
      this.store.getAllConfidenceScores(),
      this.store.getAllConfidenceHistory(),
      this.store.getAllDomainExpertise()
    );

    this.crossDomainLearning = new CrossDomainLearningSystem(
      this.store.getAllPatternSignatures(),
      this.store.getAllExecutionHistory(),
      this.store.getUnifiedInsights()
    );
  }

  /**
   * Export current state for persistence
   *
   * @returns Complete learning state that can be saved and restored
   */
  exportState(): LearningState {
    return this.store.exportState();
  }

  /**
   * Import state from persistence
   *
   * @param state - Previously exported state to restore
   */
  importState(state: LearningState): void {
    this.store.importState(state);

    // Reinitialize subsystems with imported data
    this.patternRecognition = new PatternRecognitionSystem(
      this.store.getAllPatternSignatures(),
      this.store.getAllExecutionHistory()
    );

    this.confidenceScoring = new ConfidenceScoringSystem(
      this.store.getAllConfidenceScores(),
      this.store.getAllConfidenceHistory(),
      this.store.getAllDomainExpertise()
    );

    this.crossDomainLearning = new CrossDomainLearningSystem(
      this.store.getAllPatternSignatures(),
      this.store.getAllExecutionHistory(),
      this.store.getUnifiedInsights()
    );
  }

  /**
   * Get pattern analysis for a request
   *
   * @param request - User request to analyze
   * @returns Pattern matches with confidence scores
   */
  analyzeRequest(request: string): PatternMatch[] {
    const mockExecution: WorkflowExecution = {
      id: 'analysis',
      workflowId: 'analysis',
      userRequest: request,
      patternKey: normalizePatternKey(request),
      domain: detectDomain(request),
      startedAt: new Date(),
      success: true,
      steps: [],
      toolsUsed: [],
      context: {
        timeOfDay: getTimeOfDay(new Date()),
        dayOfWeek: getDayOfWeek(new Date()),
        isRetry: false,
        additionalContext: {},
      },
      metrics: { apiCallCount: 0, dataProcessedBytes: 0, retryCount: 0 },
      tags: [],
    };

    return this.patternRecognition.analyzeWorkflowPattern(mockExecution);
  }

  /**
   * Get variations for a pattern
   *
   * @param pattern - Pattern key
   * @returns Array of pattern variations
   */
  getPatternVariations(pattern: string): PatternVariation[] {
    const history = this.store.getExecutionHistory(pattern);
    return this.patternRecognition.identifyVariations(pattern, history);
  }

  /**
   * Get optimization suggestions for a pattern
   *
   * @param pattern - Pattern key
   * @returns Array of optimization suggestions
   */
  getOptimizations(pattern: string): OptimizationSuggestion[] {
    return this.patternRecognition.detectOptimizations(pattern);
  }

  /**
   * Get confidence history for a pattern
   *
   * @param pattern - Pattern key
   * @returns Array of confidence records
   */
  getConfidenceHistory(pattern: string): ConfidenceRecord[] {
    return this.confidenceScoring.getConfidenceHistory(pattern);
  }

  /**
   * Get domain expertise
   *
   * @param domain - Domain name
   * @returns Expertise score for the domain
   */
  getDomainExpertise(domain: string): ExpertiseScore {
    return this.confidenceScoring.calculateDomainExpertise(domain);
  }

  /**
   * Find similar patterns across domains
   *
   * @param pattern - Pattern key to find similarities for
   * @returns Array of cross-domain matches
   */
  findSimilarPatterns(pattern: string): CrossDomainMatch[] {
    return this.crossDomainLearning.findSimilarPatterns(pattern);
  }

  /**
   * Transfer learnings to a new domain
   *
   * @param sourcePattern - Pattern to transfer from
   * @param targetDomain - Domain to transfer to
   * @returns Transfer result with adaptations
   */
  transferLearnings(sourcePattern: string, targetDomain: string): TransferResult {
    return this.crossDomainLearning.transferLearnings(sourcePattern, targetDomain);
  }

  /**
   * Build unified insights from patterns
   *
   * @param patterns - Pattern keys to analyze
   * @returns Array of unified insights
   */
  buildUnifiedInsights(patterns: string[]): UnifiedInsight[] {
    return this.crossDomainLearning.buildUnifiedInsights(patterns);
  }

  /**
   * Get all unified insights
   *
   * @returns All stored unified insights
   */
  getUnifiedInsights(): UnifiedInsight[] {
    return this.crossDomainLearning.getUnifiedInsights();
  }

  /**
   * Get pattern signature
   *
   * @param pattern - Pattern key
   * @returns Pattern signature if exists
   */
  getPatternSignature(pattern: string): PatternSignature | undefined {
    return this.store.getPatternSignature(pattern);
  }

  /**
   * Get execution history for a pattern
   *
   * @param pattern - Pattern key
   * @param limit - Optional limit on number of results
   * @returns Array of workflow executions
   */
  getExecutionHistory(pattern: string, limit?: number): WorkflowExecution[] {
    return this.store.getExecutionHistory(pattern, limit);
  }

  /**
   * Get corrections for a pattern
   *
   * @param pattern - Pattern key
   * @returns Array of user corrections
   */
  getCorrections(pattern: string): UserCorrection[] {
    return this.store.getCorrections(pattern);
  }

  /**
   * Get current confidence score for a pattern
   *
   * @param pattern - Pattern key
   * @returns Confidence score (0-100)
   */
  getConfidence(pattern: string): number {
    return this.confidenceScoring.getConfidence(pattern);
  }

  /**
   * Get learning statistics
   *
   * @returns Current learning statistics
   */
  getStatistics(): LearningStatistics {
    return this.store.getStatistics();
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new LearningEngine instance
 *
 * @param initialState - Optional persisted state
 * @returns New LearningEngine instance
 */
export function createLearningEngine(initialState?: LearningState): LearningEngine {
  return new LearningEngine(initialState);
}

/**
 * Create a workflow execution object
 *
 * @param params - Execution parameters
 * @returns WorkflowExecution object
 */
export function createWorkflowExecution(params: {
  id?: string;
  workflowId: string;
  userRequest: string;
  domain?: string;
  steps?: ExecutedStep[];
  toolsUsed?: UsedTool[];
  success?: boolean;
  errorMessage?: string;
  errorCategory?: ExecutionErrorCategory;
  durationMs?: number;
  context?: Partial<ExecutionContext>;
  metrics?: Partial<ExecutionMetrics>;
  tags?: string[];
}): WorkflowExecution {
  const now = new Date();
  const patternKey = normalizePatternKey(params.userRequest);
  const domain = params.domain || detectDomain(params.userRequest);

  return {
    id: params.id || generateId('exec'),
    workflowId: params.workflowId,
    userRequest: params.userRequest,
    patternKey,
    domain,
    startedAt: now,
    completedAt: params.durationMs ? new Date(now.getTime() + params.durationMs) : undefined,
    durationMs: params.durationMs,
    success: params.success ?? true,
    errorMessage: params.errorMessage,
    errorCategory: params.errorCategory,
    steps: params.steps || [],
    toolsUsed: params.toolsUsed || [],
    context: {
      timeOfDay: getTimeOfDay(now),
      dayOfWeek: getDayOfWeek(now),
      isRetry: false,
      additionalContext: {},
      ...params.context,
    },
    metrics: {
      apiCallCount: 0,
      dataProcessedBytes: 0,
      retryCount: 0,
      ...params.metrics,
    },
    tags: params.tags || [],
  };
}

/**
 * Create user feedback object
 *
 * @param params - Feedback parameters
 * @returns UserFeedback object
 */
export function createUserFeedback(params: {
  executionId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  metExpectations?: boolean;
  comments?: string;
  issues?: FeedbackIssue[];
  positives?: string[];
  suggestions?: string[];
}): UserFeedback {
  return {
    feedbackId: generateId('fb'),
    executionId: params.executionId,
    rating: params.rating,
    metExpectations: params.metExpectations ?? params.rating >= 4,
    comments: params.comments,
    issues: params.issues,
    positives: params.positives,
    suggestions: params.suggestions,
    providedAt: new Date(),
  };
}

/**
 * Create user correction object
 *
 * @param params - Correction parameters
 * @returns UserCorrection object
 */
export function createUserCorrection(params: {
  patternKey: string;
  executionId?: string;
  correctionType: CorrectionType;
  original: string;
  corrected: string;
  explanation?: string;
  applyToFuture?: boolean;
}): UserCorrection {
  return {
    correctionId: generateId('corr'),
    patternKey: params.patternKey,
    executionId: params.executionId,
    correctionType: params.correctionType,
    original: params.original,
    corrected: params.corrected,
    explanation: params.explanation,
    applyToFuture: params.applyToFuture ?? true,
    correctedAt: new Date(),
    incorporated: false,
  };
}

/**
 * Create request context object
 *
 * @param params - Context parameters
 * @returns RequestContext object
 */
export function createRequestContext(params?: Partial<RequestContext>): RequestContext {
  return {
    timestamp: new Date(),
    ...params,
  };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export {
  generateId,
  calculateJaccardSimilarity,
  calculateStringSimilarity,
  extractKeywords,
  detectDomain,
  normalizePatternKey,
  getTimeOfDay,
  getDayOfWeek,
  getExpertiseLevel,
  average,
  deepClone,
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default LearningEngine;

/**
 * Nexus Context-Based Predictions Module
 *
 * Intelligent workflow prediction system that triggers workflows based on
 * business context changes. This module monitors entity changes, threshold
 * crossings, pattern detections, and time-based events to proactively
 * suggest and execute workflows.
 *
 * Key Features:
 * - Context triggers for 8 business domains (HR, Sales, Finance, Operations,
 *   Legal, Marketing, Customer Service, Project Management)
 * - 50+ pre-defined triggers with regional (Kuwait/GCC) awareness
 * - Prediction chaining for multi-step workflow sequences
 * - Learning integration for trigger optimization
 *
 * @module context-predictions
 * @version 1.0.0
 */

// ============================================================================
// CORE TYPES - TRIGGERS
// ============================================================================

/**
 * Types of context triggers that can activate workflows
 */
export type TriggerType =
  | 'entity_created'      // New employee, new deal, new invoice
  | 'entity_updated'      // Status change, field update
  | 'threshold_crossed'   // Inventory low, budget exceeded
  | 'milestone_reached'   // Project complete, goal achieved
  | 'time_elapsed'        // X days since action
  | 'pattern_detected';   // Unusual activity, recurring issue

/**
 * Priority levels for triggered predictions
 */
export type PredictionPriority = 'immediate' | 'soon' | 'scheduled';

/**
 * Operators for trigger conditions
 */
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'changed_to'
  | 'changed_from'
  | 'is_empty'
  | 'is_not_empty'
  | 'in_list'
  | 'not_in_list'
  | 'matches_regex'
  | 'between';

/**
 * Condition that must be met for a trigger to activate
 */
export interface TriggerCondition {
  /** Field to evaluate */
  field: string;
  /** Comparison operator */
  operator: ConditionOperator;
  /** Value to compare against */
  value: unknown;
  /** Time window in milliseconds (for time-based conditions) */
  timeWindow?: number;
  /** Whether this condition is required (AND) or optional (OR) */
  required?: boolean;
  /** Weight for scoring when multiple conditions exist */
  weight?: number;
}

/**
 * Suggested workflow when a trigger activates
 */
export interface WorkflowSuggestion {
  /** Unique identifier for this suggestion */
  id: string;
  /** Workflow template identifier */
  workflowTemplateId: string;
  /** Human-readable name */
  name: string;
  /** Description of what this workflow does */
  description: string;
  /** Confidence score (0-100) */
  confidence: number;
  /** Parameters to pass to the workflow */
  parameters: Record<string, unknown>;
  /** Expected duration in minutes */
  estimatedDurationMinutes: number;
  /** Tags for categorization */
  tags: string[];
  /** Whether this can be auto-executed without confirmation */
  autoExecutable: boolean;
}

/**
 * A context trigger that can activate workflow suggestions
 */
export interface ContextTrigger {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Detailed description */
  description: string;
  /** Type of trigger */
  triggerType: TriggerType;
  /** Conditions that must be met */
  conditions: TriggerCondition[];
  /** Workflows to suggest when triggered */
  predictedWorkflows: WorkflowSuggestion[];
  /** Priority level */
  priority: PredictionPriority;
  /** Business domain */
  domain: string;
  /** Sub-domain for more specific categorization */
  subdomain?: string;
  /** Whether this trigger is currently enabled */
  enabled: boolean;
  /** Regional applicability (e.g., ['KW', 'AE', 'SA']) */
  applicableRegions?: string[];
  /** Tags for categorization */
  tags: string[];
  /** Cool-down period in milliseconds before trigger can fire again */
  cooldownMs?: number;
  /** Maximum times this trigger can fire per day */
  maxDailyActivations?: number;
  /** Learning metrics */
  metrics?: TriggerMetrics;
}

/**
 * Metrics for trigger learning and optimization
 */
export interface TriggerMetrics {
  /** Total times trigger has been activated */
  totalActivations: number;
  /** Number of times predicted workflow was accepted */
  acceptedCount: number;
  /** Number of times predicted workflow was rejected */
  rejectedCount: number;
  /** Average confidence score at time of activation */
  averageConfidence: number;
  /** Success rate of executed workflows */
  executionSuccessRate: number;
  /** Last activation timestamp */
  lastActivatedAt?: Date;
  /** Last updated timestamp */
  lastUpdatedAt: Date;
}

// ============================================================================
// CORE TYPES - CONTEXT AND PREDICTIONS
// ============================================================================

/**
 * Business context snapshot
 */
export interface BusinessContext {
  /** Entity type being monitored */
  entityType: string;
  /** Entity identifier */
  entityId: string;
  /** Current entity state */
  currentState: Record<string, unknown>;
  /** Previous entity state (if available) */
  previousState?: Record<string, unknown>;
  /** Domain context */
  domain: string;
  /** Regional context */
  region?: string;
  /** Timestamp of the context */
  timestamp: Date;
  /** Additional metadata */
  metadata: Record<string, unknown>;
}

/**
 * Context change event
 */
export interface ContextChange {
  /** Unique identifier for this change */
  id: string;
  /** Type of change */
  changeType: 'create' | 'update' | 'delete';
  /** Entity type */
  entityType: string;
  /** Entity identifier */
  entityId: string;
  /** Fields that changed */
  changedFields: string[];
  /** Old values (for updates) */
  oldValues?: Record<string, unknown>;
  /** New values */
  newValues: Record<string, unknown>;
  /** Domain */
  domain: string;
  /** Timestamp */
  timestamp: Date;
  /** User or system that made the change */
  changedBy?: string;
  /** Source system */
  source?: string;
}

/**
 * Result of trigger evaluation
 */
export interface TriggerResult {
  /** The trigger that was evaluated */
  triggerId: string;
  /** Whether the trigger was activated */
  activated: boolean;
  /** Confidence score if activated */
  confidence?: number;
  /** Conditions that matched */
  matchedConditions?: TriggerCondition[];
  /** Suggested workflows if activated */
  suggestedWorkflows?: WorkflowSuggestion[];
  /** Reason for activation or non-activation */
  reason: string;
  /** Timestamp of evaluation */
  evaluatedAt: Date;
}

/**
 * Activated trigger with full context
 */
export interface ActivatedTrigger {
  /** The trigger that activated */
  trigger: ContextTrigger;
  /** Context that caused activation */
  context: BusinessContext;
  /** Confidence score */
  confidence: number;
  /** Matched conditions */
  matchedConditions: TriggerCondition[];
  /** Timestamp */
  activatedAt: Date;
}

/**
 * A context-based prediction
 */
export interface ContextPrediction {
  /** Unique identifier */
  id: string;
  /** The trigger that generated this prediction */
  triggerId: string;
  /** Trigger name for display */
  triggerName: string;
  /** Predicted workflow */
  workflow: WorkflowSuggestion;
  /** Priority level */
  priority: PredictionPriority;
  /** Confidence score (0-100) */
  confidence: number;
  /** Business context */
  context: BusinessContext;
  /** Reasoning for this prediction */
  reasoning: string;
  /** Related entity information */
  relatedEntity: {
    type: string;
    id: string;
    name?: string;
  };
  /** Domain */
  domain: string;
  /** Regional considerations if any */
  regionalConsiderations?: string[];
  /** Timestamp */
  predictedAt: Date;
  /** Expiry timestamp after which this prediction is stale */
  expiresAt: Date;
  /** Follow-up predictions that could chain from this */
  chainedPredictions?: string[];
  /** Tags */
  tags: string[];
}

/**
 * Watch registration for entity monitoring
 */
export interface Watch {
  /** Watch identifier */
  id: string;
  /** Entity type being watched */
  entityType: string;
  /** Entity identifier */
  entityId: string;
  /** Triggers to evaluate */
  triggerIds: string[];
  /** Whether watch is active */
  active: boolean;
  /** Created timestamp */
  createdAt: Date;
  /** Last checked timestamp */
  lastCheckedAt?: Date;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Configuration for the context monitor
 */
export interface ContextMonitorConfig {
  /** Default cool-down period for triggers (ms) */
  defaultCooldownMs: number;
  /** Default max daily activations per trigger */
  defaultMaxDailyActivations: number;
  /** Enable learning from outcomes */
  enableLearning: boolean;
  /** Minimum confidence to show prediction */
  minimumConfidenceThreshold: number;
  /** Maximum predictions to return */
  maxPredictions: number;
  /** Default prediction expiry (ms) */
  predictionExpiryMs: number;
  /** Regional context */
  region: string;
  /** Timezone */
  timezone: string;
  /** Enable Ramadan-aware scheduling */
  ramadanAware: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_CONTEXT_MONITOR_CONFIG: ContextMonitorConfig = {
  defaultCooldownMs: 60 * 60 * 1000, // 1 hour
  defaultMaxDailyActivations: 10,
  enableLearning: true,
  minimumConfidenceThreshold: 60,
  maxPredictions: 10,
  predictionExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
  region: 'KW',
  timezone: 'Asia/Kuwait',
  ramadanAware: true,
};

// ============================================================================
// HR DOMAIN TRIGGERS
// ============================================================================

/**
 * HR Domain Triggers - Employee lifecycle and management workflows
 */
export const HR_TRIGGERS: ContextTrigger[] = [
  {
    id: 'hr_new_employee',
    name: 'New Employee Onboarding',
    description: 'Triggers onboarding sequence when a new employee is added to the system',
    triggerType: 'entity_created',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'employee', required: true },
      { field: 'status', operator: 'equals', value: 'pending_onboarding', required: false },
    ],
    predictedWorkflows: [
      {
        id: 'wf_onboarding_sequence',
        workflowTemplateId: 'tpl_hr_onboarding',
        name: 'Complete Onboarding Sequence',
        description: 'Full onboarding workflow including IT setup, training, and documentation',
        confidence: 95,
        parameters: { includeITSetup: true, includeTraining: true, scheduleBuddyMeeting: true },
        estimatedDurationMinutes: 240,
        tags: ['onboarding', 'new-hire', 'hr'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'hr',
    subdomain: 'onboarding',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['onboarding', 'employee-lifecycle'],
    cooldownMs: 0,
    maxDailyActivations: 50,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 95, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'hr_probation_ending',
    name: 'Probation Period Ending',
    description: 'Triggers review reminder when employee probation period is about to end',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'employee', required: true },
      { field: 'status', operator: 'equals', value: 'on_probation', required: true },
      { field: 'probationEndDate', operator: 'less_than_or_equal', value: '{{now + 14 days}}', required: true, timeWindow: 14 * 24 * 60 * 60 * 1000 },
    ],
    predictedWorkflows: [
      {
        id: 'wf_probation_review',
        workflowTemplateId: 'tpl_hr_probation_review',
        name: 'Probation Review Workflow',
        description: 'Schedule probation review meeting, collect feedback, prepare documentation',
        confidence: 90,
        parameters: { notifyManager: true, collectFeedback: true, prepareDocuments: true },
        estimatedDurationMinutes: 60,
        tags: ['probation', 'review', 'hr'],
        autoExecutable: false,
      },
    ],
    priority: 'soon',
    domain: 'hr',
    subdomain: 'performance',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['probation', 'review', 'employee-lifecycle'],
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxDailyActivations: 20,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 90, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'hr_contract_expiring',
    name: 'Employment Contract Expiring',
    description: 'Triggers renewal workflow when employee contract is about to expire',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'employee', required: true },
      { field: 'contractEndDate', operator: 'less_than_or_equal', value: '{{now + 60 days}}', required: true, timeWindow: 60 * 24 * 60 * 60 * 1000 },
      { field: 'status', operator: 'equals', value: 'active', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_contract_renewal',
        workflowTemplateId: 'tpl_hr_contract_renewal',
        name: 'Contract Renewal Process',
        description: 'Initiate contract renewal discussions, prepare new terms, obtain signatures',
        confidence: 88,
        parameters: { notifyHR: true, prepareNewContract: true, reviewCompensation: true },
        estimatedDurationMinutes: 180,
        tags: ['contract', 'renewal', 'hr'],
        autoExecutable: false,
      },
    ],
    priority: 'soon',
    domain: 'hr',
    subdomain: 'contracts',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['contract', 'renewal', 'employee-lifecycle'],
    cooldownMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxDailyActivations: 10,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 88, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'hr_leave_approved',
    name: 'Leave Request Approved',
    description: 'Triggers handover planning workflow when leave request is approved',
    triggerType: 'entity_updated',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'leave_request', required: true },
      { field: 'status', operator: 'changed_to', value: 'approved', required: true },
      { field: 'leaveDays', operator: 'greater_than', value: 5, required: false, weight: 0.5 },
    ],
    predictedWorkflows: [
      {
        id: 'wf_leave_handover',
        workflowTemplateId: 'tpl_hr_leave_handover',
        name: 'Leave Handover Planning',
        description: 'Set up coverage, delegate tasks, update team calendar',
        confidence: 85,
        parameters: { updateCalendar: true, notifyTeam: true, assignCoverage: true },
        estimatedDurationMinutes: 30,
        tags: ['leave', 'handover', 'hr'],
        autoExecutable: true,
      },
    ],
    priority: 'soon',
    domain: 'hr',
    subdomain: 'leave',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['leave', 'handover', 'coverage'],
    cooldownMs: 60 * 60 * 1000, // 1 hour
    maxDailyActivations: 30,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 85, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'hr_visa_expiring',
    name: 'Work Visa Expiring',
    description: 'Triggers visa renewal workflow for expat employees (Kuwait/GCC specific)',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'employee', required: true },
      { field: 'employeeType', operator: 'equals', value: 'expatriate', required: true },
      { field: 'visaExpiryDate', operator: 'less_than_or_equal', value: '{{now + 90 days}}', required: true, timeWindow: 90 * 24 * 60 * 60 * 1000 },
    ],
    predictedWorkflows: [
      {
        id: 'wf_visa_renewal',
        workflowTemplateId: 'tpl_hr_visa_renewal',
        name: 'Visa Renewal Process',
        description: 'Initiate visa renewal with PRO, gather documents, schedule medical',
        confidence: 92,
        parameters: { notifyPRO: true, schedulemedical: true, gatherDocuments: true },
        estimatedDurationMinutes: 480,
        tags: ['visa', 'renewal', 'hr', 'compliance'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'hr',
    subdomain: 'compliance',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['visa', 'compliance', 'expatriate', 'employee-lifecycle'],
    cooldownMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxDailyActivations: 10,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 92, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'hr_termination_initiated',
    name: 'Employee Termination Initiated',
    description: 'Triggers offboarding and clearance workflow when termination is initiated',
    triggerType: 'entity_updated',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'employee', required: true },
      { field: 'status', operator: 'changed_to', value: 'terminating', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_offboarding',
        workflowTemplateId: 'tpl_hr_offboarding',
        name: 'Complete Offboarding Process',
        description: 'Knowledge transfer, IT deprovisioning, clearance, exit interview, EOSI calculation',
        confidence: 95,
        parameters: { calculateEOSI: true, scheduleExitInterview: true, revokeAccess: true, collectAssets: true },
        estimatedDurationMinutes: 480,
        tags: ['offboarding', 'termination', 'hr'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'hr',
    subdomain: 'offboarding',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['offboarding', 'termination', 'employee-lifecycle'],
    cooldownMs: 0,
    maxDailyActivations: 10,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 95, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'hr_annual_review_due',
    name: 'Annual Performance Review Due',
    description: 'Triggers performance review workflow when annual review date approaches',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'employee', required: true },
      { field: 'nextReviewDate', operator: 'less_than_or_equal', value: '{{now + 30 days}}', required: true, timeWindow: 30 * 24 * 60 * 60 * 1000 },
      { field: 'status', operator: 'equals', value: 'active', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_annual_review',
        workflowTemplateId: 'tpl_hr_annual_review',
        name: 'Annual Performance Review',
        description: 'Self-assessment, 360 feedback collection, manager review, goal setting',
        confidence: 88,
        parameters: { collect360Feedback: true, prepareGoals: true, reviewCompensation: true },
        estimatedDurationMinutes: 120,
        tags: ['performance', 'review', 'hr'],
        autoExecutable: false,
      },
    ],
    priority: 'scheduled',
    domain: 'hr',
    subdomain: 'performance',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['performance', 'review', 'employee-lifecycle'],
    cooldownMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxDailyActivations: 20,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 88, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'hr_training_certification_expiring',
    name: 'Training Certification Expiring',
    description: 'Triggers renewal workflow when mandatory certification is about to expire',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'certification', required: true },
      { field: 'expiryDate', operator: 'less_than_or_equal', value: '{{now + 45 days}}', required: true, timeWindow: 45 * 24 * 60 * 60 * 1000 },
      { field: 'mandatory', operator: 'equals', value: true, required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_certification_renewal',
        workflowTemplateId: 'tpl_hr_cert_renewal',
        name: 'Certification Renewal Process',
        description: 'Schedule training, book exam, update records upon completion',
        confidence: 85,
        parameters: { notifyEmployee: true, scheduleTraining: true, bookExam: true },
        estimatedDurationMinutes: 60,
        tags: ['training', 'certification', 'hr'],
        autoExecutable: false,
      },
    ],
    priority: 'soon',
    domain: 'hr',
    subdomain: 'training',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['training', 'certification', 'compliance'],
    cooldownMs: 14 * 24 * 60 * 60 * 1000, // 14 days
    maxDailyActivations: 15,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 85, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
];

// ============================================================================
// SALES DOMAIN TRIGGERS
// ============================================================================

/**
 * Sales Domain Triggers - Deal management and pipeline workflows
 */
export const SALES_TRIGGERS: ContextTrigger[] = [
  {
    id: 'sales_deal_won',
    name: 'Deal Won - Implementation Kickoff',
    description: 'Triggers implementation kickoff workflow when a deal is marked as won',
    triggerType: 'entity_updated',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'deal', required: true },
      { field: 'stage', operator: 'changed_to', value: 'closed_won', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_implementation_kickoff',
        workflowTemplateId: 'tpl_sales_implementation',
        name: 'Customer Implementation Kickoff',
        description: 'Schedule kickoff call, assign CSM, create project plan, send welcome package',
        confidence: 95,
        parameters: { assignCSM: true, createProject: true, sendWelcome: true, scheduleKickoff: true },
        estimatedDurationMinutes: 120,
        tags: ['deal-won', 'implementation', 'sales'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'sales',
    subdomain: 'deals',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['deal', 'won', 'implementation', 'customer-success'],
    cooldownMs: 0,
    maxDailyActivations: 20,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 95, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'sales_deal_stalled',
    name: 'Deal Stalled - Follow-up Required',
    description: 'Triggers follow-up workflow when deal has not progressed in X days',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'deal', required: true },
      { field: 'lastActivityDate', operator: 'less_than', value: '{{now - 7 days}}', required: true, timeWindow: 7 * 24 * 60 * 60 * 1000 },
      { field: 'stage', operator: 'not_in_list', value: ['closed_won', 'closed_lost'], required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_stalled_deal_followup',
        workflowTemplateId: 'tpl_sales_followup',
        name: 'Stalled Deal Follow-up',
        description: 'Send follow-up email, schedule call, add to sequence, notify manager',
        confidence: 80,
        parameters: { sendEmail: true, scheduleCall: true, notifyManager: true },
        estimatedDurationMinutes: 30,
        tags: ['deal', 'followup', 'sales'],
        autoExecutable: true,
      },
    ],
    priority: 'soon',
    domain: 'sales',
    subdomain: 'deals',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['deal', 'stalled', 'followup'],
    cooldownMs: 3 * 24 * 60 * 60 * 1000, // 3 days
    maxDailyActivations: 30,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 80, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'sales_lead_score_threshold',
    name: 'Lead Score Threshold Reached',
    description: 'Triggers qualification workflow when lead score crosses threshold',
    triggerType: 'threshold_crossed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'lead', required: true },
      { field: 'leadScore', operator: 'greater_than_or_equal', value: 80, required: true },
      { field: 'status', operator: 'equals', value: 'new', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_lead_qualification',
        workflowTemplateId: 'tpl_sales_lead_qual',
        name: 'Lead Qualification Workflow',
        description: 'Assign to sales rep, schedule discovery call, send qualification email',
        confidence: 88,
        parameters: { assignRep: true, scheduleCall: true, sendEmail: true },
        estimatedDurationMinutes: 45,
        tags: ['lead', 'qualification', 'sales'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'sales',
    subdomain: 'leads',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['lead', 'qualification', 'score'],
    cooldownMs: 60 * 60 * 1000, // 1 hour
    maxDailyActivations: 50,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 88, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'sales_churn_risk_detected',
    name: 'Customer Churn Risk Detected',
    description: 'Triggers retention workflow when churn risk indicators are detected',
    triggerType: 'pattern_detected',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'customer', required: true },
      { field: 'churnRiskScore', operator: 'greater_than', value: 70, required: true },
      { field: 'status', operator: 'equals', value: 'active', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_churn_prevention',
        workflowTemplateId: 'tpl_sales_retention',
        name: 'Customer Retention Workflow',
        description: 'Executive outreach, usage analysis, discount offer preparation, success call',
        confidence: 82,
        parameters: { executiveReach: true, analyzeUsage: true, prepareOffer: true },
        estimatedDurationMinutes: 90,
        tags: ['churn', 'retention', 'sales'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'sales',
    subdomain: 'retention',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['churn', 'retention', 'customer-success'],
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxDailyActivations: 10,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 82, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'sales_contract_renewal_due',
    name: 'Contract Renewal Coming Due',
    description: 'Triggers renewal workflow when customer contract is approaching renewal date',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'contract', required: true },
      { field: 'renewalDate', operator: 'less_than_or_equal', value: '{{now + 60 days}}', required: true, timeWindow: 60 * 24 * 60 * 60 * 1000 },
      { field: 'autoRenew', operator: 'equals', value: false, required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_contract_renewal',
        workflowTemplateId: 'tpl_sales_contract_renewal',
        name: 'Contract Renewal Process',
        description: 'Renewal outreach, prepare proposal, negotiate terms, process renewal',
        confidence: 90,
        parameters: { contactCustomer: true, prepareProposal: true, reviewPricing: true },
        estimatedDurationMinutes: 120,
        tags: ['contract', 'renewal', 'sales'],
        autoExecutable: false,
      },
    ],
    priority: 'soon',
    domain: 'sales',
    subdomain: 'contracts',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['contract', 'renewal', 'customer'],
    cooldownMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxDailyActivations: 15,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 90, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'sales_upsell_opportunity',
    name: 'Upsell Opportunity Identified',
    description: 'Triggers upsell workflow when customer usage indicates expansion potential',
    triggerType: 'pattern_detected',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'customer', required: true },
      { field: 'usagePercentage', operator: 'greater_than', value: 80, required: true },
      { field: 'healthScore', operator: 'greater_than', value: 70, required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_upsell',
        workflowTemplateId: 'tpl_sales_upsell',
        name: 'Upsell Outreach Workflow',
        description: 'Usage analysis report, upgrade proposal, schedule expansion call',
        confidence: 75,
        parameters: { prepareAnalysis: true, createProposal: true, scheduleCall: true },
        estimatedDurationMinutes: 60,
        tags: ['upsell', 'expansion', 'sales'],
        autoExecutable: false,
      },
    ],
    priority: 'scheduled',
    domain: 'sales',
    subdomain: 'expansion',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['upsell', 'expansion', 'customer-success'],
    cooldownMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxDailyActivations: 10,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 75, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'sales_quote_expiring',
    name: 'Quote Expiring Soon',
    description: 'Triggers follow-up workflow when a quote is about to expire',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'quote', required: true },
      { field: 'expiryDate', operator: 'less_than_or_equal', value: '{{now + 3 days}}', required: true, timeWindow: 3 * 24 * 60 * 60 * 1000 },
      { field: 'status', operator: 'equals', value: 'pending', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_quote_followup',
        workflowTemplateId: 'tpl_sales_quote_followup',
        name: 'Quote Expiry Follow-up',
        description: 'Send reminder, offer extension, schedule call to discuss',
        confidence: 85,
        parameters: { sendReminder: true, offerExtension: true },
        estimatedDurationMinutes: 20,
        tags: ['quote', 'expiry', 'sales'],
        autoExecutable: true,
      },
    ],
    priority: 'immediate',
    domain: 'sales',
    subdomain: 'quotes',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['quote', 'expiry', 'followup'],
    cooldownMs: 24 * 60 * 60 * 1000, // 1 day
    maxDailyActivations: 25,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 85, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
];

// ============================================================================
// FINANCE DOMAIN TRIGGERS
// ============================================================================

/**
 * Finance Domain Triggers - Invoice, payment, and budget workflows
 */
export const FINANCE_TRIGGERS: ContextTrigger[] = [
  {
    id: 'finance_invoice_received',
    name: 'Invoice Received - Approval Routing',
    description: 'Triggers approval workflow when a new invoice is received',
    triggerType: 'entity_created',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'invoice', required: true },
      { field: 'direction', operator: 'equals', value: 'incoming', required: true },
      { field: 'amount', operator: 'greater_than', value: 0, required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_invoice_approval',
        workflowTemplateId: 'tpl_finance_invoice_approval',
        name: 'Invoice Approval Routing',
        description: 'Match to PO, validate details, route for approval based on amount',
        confidence: 92,
        parameters: { matchPO: true, validateVAT: true, routeApproval: true },
        estimatedDurationMinutes: 30,
        tags: ['invoice', 'approval', 'finance'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'finance',
    subdomain: 'accounts_payable',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['invoice', 'approval', 'accounts-payable'],
    cooldownMs: 0,
    maxDailyActivations: 100,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 92, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'finance_payment_due',
    name: 'Payment Due Date Approaching',
    description: 'Triggers payment reminder workflow when payment is due soon',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'invoice', required: true },
      { field: 'dueDate', operator: 'less_than_or_equal', value: '{{now + 7 days}}', required: true, timeWindow: 7 * 24 * 60 * 60 * 1000 },
      { field: 'status', operator: 'in_list', value: ['approved', 'pending_payment'], required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_payment_reminder',
        workflowTemplateId: 'tpl_finance_payment_reminder',
        name: 'Payment Due Reminder',
        description: 'Send internal reminder, verify funds, schedule payment',
        confidence: 88,
        parameters: { sendReminder: true, verifyFunds: true, schedulePayment: true },
        estimatedDurationMinutes: 15,
        tags: ['payment', 'reminder', 'finance'],
        autoExecutable: true,
      },
    ],
    priority: 'soon',
    domain: 'finance',
    subdomain: 'accounts_payable',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['payment', 'due', 'reminder'],
    cooldownMs: 24 * 60 * 60 * 1000, // 1 day
    maxDailyActivations: 50,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 88, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'finance_budget_threshold',
    name: 'Budget Threshold Exceeded',
    description: 'Triggers alert and reallocation workflow when budget threshold is crossed',
    triggerType: 'threshold_crossed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'budget', required: true },
      { field: 'usedPercentage', operator: 'greater_than_or_equal', value: 90, required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_budget_alert',
        workflowTemplateId: 'tpl_finance_budget_alert',
        name: 'Budget Threshold Alert',
        description: 'Alert stakeholders, analyze spending, propose reallocation',
        confidence: 95,
        parameters: { alertOwner: true, analyzeSpending: true, proposeReallocation: true },
        estimatedDurationMinutes: 45,
        tags: ['budget', 'alert', 'finance'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'finance',
    subdomain: 'budgeting',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['budget', 'threshold', 'alert'],
    cooldownMs: 24 * 60 * 60 * 1000, // 1 day
    maxDailyActivations: 10,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 95, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'finance_month_end',
    name: 'Month-End Approaching',
    description: 'Triggers month-end close preparation workflow',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'systemEvent', operator: 'equals', value: 'month_end_approaching', required: true },
      { field: 'daysToMonthEnd', operator: 'less_than_or_equal', value: 5, required: true, timeWindow: 5 * 24 * 60 * 60 * 1000 },
    ],
    predictedWorkflows: [
      {
        id: 'wf_month_end_close',
        workflowTemplateId: 'tpl_finance_month_close',
        name: 'Month-End Close Preparation',
        description: 'Reconcile accounts, accrue expenses, review pending items, prepare reports',
        confidence: 90,
        parameters: { reconcileAccounts: true, accrueExpenses: true, prepareReports: true },
        estimatedDurationMinutes: 480,
        tags: ['month-end', 'close', 'finance'],
        autoExecutable: false,
      },
    ],
    priority: 'scheduled',
    domain: 'finance',
    subdomain: 'accounting',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['month-end', 'close', 'accounting'],
    cooldownMs: 20 * 24 * 60 * 60 * 1000, // 20 days
    maxDailyActivations: 1,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 90, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'finance_vat_filing_due',
    name: 'VAT Filing Due (Kuwait/GCC)',
    description: 'Triggers VAT preparation workflow when filing deadline approaches',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'systemEvent', operator: 'equals', value: 'vat_filing_due', required: true },
      { field: 'daysToDeadline', operator: 'less_than_or_equal', value: 15, required: true, timeWindow: 15 * 24 * 60 * 60 * 1000 },
    ],
    predictedWorkflows: [
      {
        id: 'wf_vat_filing',
        workflowTemplateId: 'tpl_finance_vat_filing',
        name: 'VAT Filing Preparation',
        description: 'Reconcile VAT, prepare return, review and submit (5% VAT for Kuwait)',
        confidence: 92,
        parameters: { reconcileVAT: true, prepareReturn: true, validateCalculations: true },
        estimatedDurationMinutes: 180,
        tags: ['vat', 'filing', 'finance', 'compliance'],
        autoExecutable: false,
      },
    ],
    priority: 'soon',
    domain: 'finance',
    subdomain: 'tax',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'BH', 'OM'],
    tags: ['vat', 'tax', 'compliance', 'gcc'],
    cooldownMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxDailyActivations: 1,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 92, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'finance_expense_anomaly',
    name: 'Expense Anomaly Detected',
    description: 'Triggers investigation workflow when unusual expense pattern is detected',
    triggerType: 'pattern_detected',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'expense', required: true },
      { field: 'anomalyScore', operator: 'greater_than', value: 80, required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_expense_investigation',
        workflowTemplateId: 'tpl_finance_expense_investigation',
        name: 'Expense Anomaly Investigation',
        description: 'Flag expense, notify approver, request justification, audit trail',
        confidence: 85,
        parameters: { flagExpense: true, notifyApprover: true, requestJustification: true },
        estimatedDurationMinutes: 60,
        tags: ['expense', 'anomaly', 'finance'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'finance',
    subdomain: 'expenses',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['expense', 'anomaly', 'fraud-detection'],
    cooldownMs: 60 * 60 * 1000, // 1 hour
    maxDailyActivations: 20,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 85, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'finance_receivable_overdue',
    name: 'Account Receivable Overdue',
    description: 'Triggers collection workflow when invoice becomes overdue',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'invoice', required: true },
      { field: 'direction', operator: 'equals', value: 'outgoing', required: true },
      { field: 'dueDate', operator: 'less_than', value: '{{now}}', required: true },
      { field: 'status', operator: 'equals', value: 'unpaid', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_collection',
        workflowTemplateId: 'tpl_finance_collection',
        name: 'Overdue Collection Workflow',
        description: 'Send reminder, escalate to collections, update aging report',
        confidence: 90,
        parameters: { sendReminder: true, escalateIfNeeded: true, updateAging: true },
        estimatedDurationMinutes: 30,
        tags: ['receivable', 'collection', 'finance'],
        autoExecutable: true,
      },
    ],
    priority: 'soon',
    domain: 'finance',
    subdomain: 'accounts_receivable',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['receivable', 'overdue', 'collection'],
    cooldownMs: 3 * 24 * 60 * 60 * 1000, // 3 days
    maxDailyActivations: 30,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 90, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
];

// ============================================================================
// OPERATIONS DOMAIN TRIGGERS
// ============================================================================

/**
 * Operations Domain Triggers - Inventory, logistics, and maintenance workflows
 */
export const OPERATIONS_TRIGGERS: ContextTrigger[] = [
  {
    id: 'ops_inventory_low',
    name: 'Inventory Below Threshold',
    description: 'Triggers reorder workflow when inventory falls below safety stock',
    triggerType: 'threshold_crossed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'inventory_item', required: true },
      { field: 'currentQuantity', operator: 'less_than_or_equal', value: '{{safetyStock}}', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_reorder',
        workflowTemplateId: 'tpl_ops_reorder',
        name: 'Inventory Reorder Workflow',
        description: 'Calculate reorder quantity, generate PO, send to supplier',
        confidence: 95,
        parameters: { calculateEOQ: true, generatePO: true, notifySupplier: true },
        estimatedDurationMinutes: 30,
        tags: ['inventory', 'reorder', 'operations'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'operations',
    subdomain: 'inventory',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['inventory', 'reorder', 'stock'],
    cooldownMs: 24 * 60 * 60 * 1000, // 1 day
    maxDailyActivations: 50,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 95, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'ops_supplier_lead_time',
    name: 'Supplier Lead Time Approaching',
    description: 'Triggers order reminder when lead time window is approaching',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'inventory_item', required: true },
      { field: 'daysToStockout', operator: 'less_than_or_equal', value: '{{supplierLeadTimeDays + 5}}', required: true },
      { field: 'orderPlaced', operator: 'equals', value: false, required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_lead_time_order',
        workflowTemplateId: 'tpl_ops_lead_time_order',
        name: 'Lead Time Order Reminder',
        description: 'Alert procurement, verify demand forecast, initiate order',
        confidence: 88,
        parameters: { alertProcurement: true, verifyForecast: true, initiateOrder: true },
        estimatedDurationMinutes: 45,
        tags: ['inventory', 'lead-time', 'operations'],
        autoExecutable: false,
      },
    ],
    priority: 'soon',
    domain: 'operations',
    subdomain: 'procurement',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['procurement', 'lead-time', 'planning'],
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxDailyActivations: 20,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 88, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'ops_quality_issue',
    name: 'Quality Issue Detected',
    description: 'Triggers investigation workflow when quality threshold is breached',
    triggerType: 'threshold_crossed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'quality_check', required: true },
      { field: 'defectRate', operator: 'greater_than', value: 5, required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_quality_investigation',
        workflowTemplateId: 'tpl_ops_quality_investigation',
        name: 'Quality Issue Investigation',
        description: 'Halt production if needed, root cause analysis, corrective action',
        confidence: 92,
        parameters: { assessSeverity: true, rootCauseAnalysis: true, correctiveAction: true },
        estimatedDurationMinutes: 120,
        tags: ['quality', 'investigation', 'operations'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'operations',
    subdomain: 'quality',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['quality', 'defect', 'investigation'],
    cooldownMs: 60 * 60 * 1000, // 1 hour
    maxDailyActivations: 10,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 92, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'ops_delivery_delayed',
    name: 'Delivery Delayed',
    description: 'Triggers customer notification and escalation when delivery is delayed',
    triggerType: 'entity_updated',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'shipment', required: true },
      { field: 'status', operator: 'changed_to', value: 'delayed', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_delivery_delay',
        workflowTemplateId: 'tpl_ops_delivery_delay',
        name: 'Delivery Delay Notification',
        description: 'Notify customer via WhatsApp/email, offer compensation, update ETA',
        confidence: 90,
        parameters: { notifyCustomer: true, offerCompensation: false, updateETA: true },
        estimatedDurationMinutes: 20,
        tags: ['delivery', 'delay', 'operations'],
        autoExecutable: true,
      },
    ],
    priority: 'immediate',
    domain: 'operations',
    subdomain: 'logistics',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['delivery', 'delay', 'customer-notification'],
    cooldownMs: 60 * 60 * 1000, // 1 hour
    maxDailyActivations: 30,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 90, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'ops_maintenance_due',
    name: 'Equipment Maintenance Due',
    description: 'Triggers maintenance scheduling when equipment service is due',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'equipment', required: true },
      { field: 'nextMaintenanceDate', operator: 'less_than_or_equal', value: '{{now + 7 days}}', required: true, timeWindow: 7 * 24 * 60 * 60 * 1000 },
    ],
    predictedWorkflows: [
      {
        id: 'wf_maintenance_schedule',
        workflowTemplateId: 'tpl_ops_maintenance',
        name: 'Maintenance Scheduling',
        description: 'Schedule technician, order parts if needed, notify operations',
        confidence: 88,
        parameters: { scheduleTechnician: true, orderParts: true, notifyOps: true },
        estimatedDurationMinutes: 60,
        tags: ['maintenance', 'schedule', 'operations'],
        autoExecutable: false,
      },
    ],
    priority: 'scheduled',
    domain: 'operations',
    subdomain: 'maintenance',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['maintenance', 'equipment', 'preventive'],
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxDailyActivations: 15,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 88, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'ops_po_approved',
    name: 'Purchase Order Approved',
    description: 'Triggers supplier notification when PO is approved',
    triggerType: 'entity_updated',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'purchase_order', required: true },
      { field: 'status', operator: 'changed_to', value: 'approved', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_po_send',
        workflowTemplateId: 'tpl_ops_po_send',
        name: 'Send PO to Supplier',
        description: 'Format PO, send to supplier, track confirmation',
        confidence: 95,
        parameters: { formatPO: true, sendToSupplier: true, trackConfirmation: true },
        estimatedDurationMinutes: 15,
        tags: ['purchase-order', 'supplier', 'operations'],
        autoExecutable: true,
      },
    ],
    priority: 'immediate',
    domain: 'operations',
    subdomain: 'procurement',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['purchase-order', 'procurement', 'supplier'],
    cooldownMs: 0,
    maxDailyActivations: 50,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 95, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
];

// ============================================================================
// LEGAL DOMAIN TRIGGERS
// ============================================================================

/**
 * Legal Domain Triggers - Contract and compliance workflows
 */
export const LEGAL_TRIGGERS: ContextTrigger[] = [
  {
    id: 'legal_contract_expiring',
    name: 'Contract Expiring Soon',
    description: 'Triggers review workflow when contract is approaching expiry',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'contract', required: true },
      { field: 'expiryDate', operator: 'less_than_or_equal', value: '{{now + 90 days}}', required: true, timeWindow: 90 * 24 * 60 * 60 * 1000 },
      { field: 'status', operator: 'equals', value: 'active', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_contract_review',
        workflowTemplateId: 'tpl_legal_contract_review',
        name: 'Contract Expiry Review',
        description: 'Review terms, assess renewal, negotiate if needed, prepare new contract',
        confidence: 90,
        parameters: { reviewTerms: true, assessRenewal: true, prepareRenewal: true },
        estimatedDurationMinutes: 180,
        tags: ['contract', 'expiry', 'legal'],
        autoExecutable: false,
      },
    ],
    priority: 'soon',
    domain: 'legal',
    subdomain: 'contracts',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['contract', 'expiry', 'renewal'],
    cooldownMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxDailyActivations: 15,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 90, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'legal_compliance_deadline',
    name: 'Compliance Deadline Approaching',
    description: 'Triggers compliance preparation when regulatory deadline approaches',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'compliance_requirement', required: true },
      { field: 'deadlineDate', operator: 'less_than_or_equal', value: '{{now + 30 days}}', required: true, timeWindow: 30 * 24 * 60 * 60 * 1000 },
      { field: 'status', operator: 'not_equals', value: 'completed', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_compliance_prep',
        workflowTemplateId: 'tpl_legal_compliance',
        name: 'Compliance Deadline Preparation',
        description: 'Gather documentation, review requirements, prepare submission',
        confidence: 92,
        parameters: { gatherDocs: true, reviewRequirements: true, prepareSubmission: true },
        estimatedDurationMinutes: 240,
        tags: ['compliance', 'deadline', 'legal'],
        autoExecutable: false,
      },
    ],
    priority: 'soon',
    domain: 'legal',
    subdomain: 'compliance',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['compliance', 'deadline', 'regulatory'],
    cooldownMs: 14 * 24 * 60 * 60 * 1000, // 14 days
    maxDailyActivations: 10,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 92, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'legal_new_contract_created',
    name: 'New Contract Created - Review Required',
    description: 'Triggers legal review workflow for new contracts',
    triggerType: 'entity_created',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'contract', required: true },
      { field: 'value', operator: 'greater_than', value: 10000, required: false, weight: 0.5 },
    ],
    predictedWorkflows: [
      {
        id: 'wf_contract_legal_review',
        workflowTemplateId: 'tpl_legal_review',
        name: 'Legal Review Workflow',
        description: 'Risk assessment, clause review, negotiate terms, approve or escalate',
        confidence: 88,
        parameters: { riskAssessment: true, clauseReview: true, checkCompliance: true },
        estimatedDurationMinutes: 120,
        tags: ['contract', 'review', 'legal'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'legal',
    subdomain: 'contracts',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['contract', 'review', 'risk'],
    cooldownMs: 0,
    maxDailyActivations: 30,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 88, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'legal_license_expiring',
    name: 'Business License Expiring',
    description: 'Triggers renewal workflow when business license is expiring',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'license', required: true },
      { field: 'expiryDate', operator: 'less_than_or_equal', value: '{{now + 60 days}}', required: true, timeWindow: 60 * 24 * 60 * 60 * 1000 },
    ],
    predictedWorkflows: [
      {
        id: 'wf_license_renewal',
        workflowTemplateId: 'tpl_legal_license_renewal',
        name: 'Business License Renewal',
        description: 'Prepare documents, submit renewal application, track approval',
        confidence: 95,
        parameters: { prepareDocs: true, submitApplication: true, trackApproval: true },
        estimatedDurationMinutes: 180,
        tags: ['license', 'renewal', 'legal'],
        autoExecutable: false,
      },
    ],
    priority: 'soon',
    domain: 'legal',
    subdomain: 'licensing',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['license', 'renewal', 'compliance'],
    cooldownMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxDailyActivations: 5,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 95, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
];

// ============================================================================
// MARKETING DOMAIN TRIGGERS
// ============================================================================

/**
 * Marketing Domain Triggers - Campaign and content workflows
 */
export const MARKETING_TRIGGERS: ContextTrigger[] = [
  {
    id: 'mkt_campaign_ending',
    name: 'Campaign Ending - Review Required',
    description: 'Triggers review workflow when marketing campaign is ending',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'campaign', required: true },
      { field: 'endDate', operator: 'less_than_or_equal', value: '{{now + 3 days}}', required: true, timeWindow: 3 * 24 * 60 * 60 * 1000 },
      { field: 'status', operator: 'equals', value: 'active', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_campaign_review',
        workflowTemplateId: 'tpl_mkt_campaign_review',
        name: 'Campaign Performance Review',
        description: 'Compile metrics, analyze ROI, prepare report, schedule debrief',
        confidence: 88,
        parameters: { compileMetrics: true, analyzeROI: true, prepareReport: true },
        estimatedDurationMinutes: 90,
        tags: ['campaign', 'review', 'marketing'],
        autoExecutable: false,
      },
    ],
    priority: 'scheduled',
    domain: 'marketing',
    subdomain: 'campaigns',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['campaign', 'review', 'performance'],
    cooldownMs: 24 * 60 * 60 * 1000, // 1 day
    maxDailyActivations: 10,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 88, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'mkt_content_due',
    name: 'Content Calendar Due Date',
    description: 'Triggers content preparation when calendar item is due',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'content_item', required: true },
      { field: 'publishDate', operator: 'less_than_or_equal', value: '{{now + 2 days}}', required: true, timeWindow: 2 * 24 * 60 * 60 * 1000 },
      { field: 'status', operator: 'not_equals', value: 'published', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_content_prep',
        workflowTemplateId: 'tpl_mkt_content_prep',
        name: 'Content Preparation Workflow',
        description: 'Review content, get approvals, schedule posting (GCC optimal times)',
        confidence: 85,
        parameters: { reviewContent: true, getApprovals: true, schedulePosting: true },
        estimatedDurationMinutes: 45,
        tags: ['content', 'calendar', 'marketing'],
        autoExecutable: false,
      },
    ],
    priority: 'soon',
    domain: 'marketing',
    subdomain: 'content',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['content', 'calendar', 'social-media'],
    cooldownMs: 12 * 60 * 60 * 1000, // 12 hours
    maxDailyActivations: 20,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 85, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'mkt_lead_engagement_spike',
    name: 'Lead Engagement Spike Detected',
    description: 'Triggers nurture campaign when engagement spike is detected',
    triggerType: 'pattern_detected',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'lead', required: true },
      { field: 'engagementScore', operator: 'greater_than', value: 70, required: true },
      { field: 'recentActivities', operator: 'greater_than', value: 5, required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_nurture_campaign',
        workflowTemplateId: 'tpl_mkt_nurture',
        name: 'Lead Nurture Campaign',
        description: 'Add to nurture sequence, send personalized content, notify sales',
        confidence: 82,
        parameters: { addToSequence: true, sendContent: true, notifySales: true },
        estimatedDurationMinutes: 30,
        tags: ['lead', 'nurture', 'marketing'],
        autoExecutable: true,
      },
    ],
    priority: 'immediate',
    domain: 'marketing',
    subdomain: 'lead-gen',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['lead', 'engagement', 'nurture'],
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxDailyActivations: 20,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 82, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'mkt_ramadan_prep',
    name: 'Ramadan Campaign Preparation (GCC)',
    description: 'Triggers Ramadan campaign preparation workflow (GCC-specific)',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'systemEvent', operator: 'equals', value: 'ramadan_approaching', required: true },
      { field: 'daysToRamadan', operator: 'less_than_or_equal', value: 30, required: true, timeWindow: 30 * 24 * 60 * 60 * 1000 },
    ],
    predictedWorkflows: [
      {
        id: 'wf_ramadan_campaign',
        workflowTemplateId: 'tpl_mkt_ramadan',
        name: 'Ramadan Campaign Preparation',
        description: 'Update creatives, adjust ad schedules for Ramadan times, plan Iftar promotions',
        confidence: 92,
        parameters: { updateCreatives: true, adjustSchedules: true, planPromotions: true },
        estimatedDurationMinutes: 240,
        tags: ['ramadan', 'campaign', 'marketing', 'gcc'],
        autoExecutable: false,
      },
    ],
    priority: 'scheduled',
    domain: 'marketing',
    subdomain: 'seasonal',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['ramadan', 'seasonal', 'gcc', 'cultural'],
    cooldownMs: 365 * 24 * 60 * 60 * 1000, // 1 year
    maxDailyActivations: 1,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 92, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'mkt_social_mention',
    name: 'High-Profile Social Mention',
    description: 'Triggers response workflow when important social mention is detected',
    triggerType: 'pattern_detected',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'social_mention', required: true },
      { field: 'influencerScore', operator: 'greater_than', value: 50, required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_social_response',
        workflowTemplateId: 'tpl_mkt_social_response',
        name: 'Social Mention Response',
        description: 'Analyze sentiment, prepare response, engage via WhatsApp/social, track',
        confidence: 80,
        parameters: { analyzeSentiment: true, prepareResponse: true, engage: true },
        estimatedDurationMinutes: 30,
        tags: ['social', 'mention', 'marketing'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'marketing',
    subdomain: 'social',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['social', 'mention', 'influencer'],
    cooldownMs: 60 * 60 * 1000, // 1 hour
    maxDailyActivations: 15,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 80, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
];

// ============================================================================
// CUSTOMER SERVICE DOMAIN TRIGGERS
// ============================================================================

/**
 * Customer Service Domain Triggers - Support and ticket workflows
 */
export const CUSTOMER_SERVICE_TRIGGERS: ContextTrigger[] = [
  {
    id: 'cs_ticket_created',
    name: 'Support Ticket Created',
    description: 'Triggers ticket routing and initial response workflow',
    triggerType: 'entity_created',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'ticket', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_ticket_routing',
        workflowTemplateId: 'tpl_cs_ticket_routing',
        name: 'Ticket Routing & Response',
        description: 'Categorize, assign to agent, send acknowledgment (WhatsApp/email)',
        confidence: 95,
        parameters: { categorize: true, assignAgent: true, sendAcknowledgment: true },
        estimatedDurationMinutes: 5,
        tags: ['ticket', 'routing', 'customer-service'],
        autoExecutable: true,
      },
    ],
    priority: 'immediate',
    domain: 'customer_service',
    subdomain: 'support',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['ticket', 'support', 'routing'],
    cooldownMs: 0,
    maxDailyActivations: 200,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 95, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'cs_sla_breach_warning',
    name: 'SLA Breach Warning',
    description: 'Triggers escalation workflow when ticket is approaching SLA breach',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'ticket', required: true },
      { field: 'slaRemainingMinutes', operator: 'less_than_or_equal', value: 30, required: true, timeWindow: 30 * 60 * 1000 },
      { field: 'status', operator: 'not_in_list', value: ['resolved', 'closed'], required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_sla_escalation',
        workflowTemplateId: 'tpl_cs_sla_escalation',
        name: 'SLA Escalation Workflow',
        description: 'Notify supervisor, reassign if needed, prioritize resolution',
        confidence: 92,
        parameters: { notifySupervisor: true, reassignIfNeeded: true, prioritize: true },
        estimatedDurationMinutes: 10,
        tags: ['sla', 'escalation', 'customer-service'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'customer_service',
    subdomain: 'support',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['sla', 'escalation', 'urgency'],
    cooldownMs: 15 * 60 * 1000, // 15 minutes
    maxDailyActivations: 50,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 92, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'cs_ticket_resolved',
    name: 'Ticket Resolved - Satisfaction Survey',
    description: 'Triggers satisfaction survey when ticket is resolved',
    triggerType: 'entity_updated',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'ticket', required: true },
      { field: 'status', operator: 'changed_to', value: 'resolved', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_csat_survey',
        workflowTemplateId: 'tpl_cs_csat',
        name: 'CSAT Survey Workflow',
        description: 'Send satisfaction survey via WhatsApp/email, track response, escalate if negative',
        confidence: 88,
        parameters: { sendSurvey: true, trackResponse: true, escalateNegative: true },
        estimatedDurationMinutes: 10,
        tags: ['csat', 'survey', 'customer-service'],
        autoExecutable: true,
      },
    ],
    priority: 'soon',
    domain: 'customer_service',
    subdomain: 'feedback',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['csat', 'survey', 'feedback'],
    cooldownMs: 24 * 60 * 60 * 1000, // 1 day
    maxDailyActivations: 100,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 88, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'cs_negative_feedback',
    name: 'Negative Feedback Received',
    description: 'Triggers recovery workflow when negative feedback is received',
    triggerType: 'entity_created',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'feedback', required: true },
      { field: 'rating', operator: 'less_than_or_equal', value: 2, required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_feedback_recovery',
        workflowTemplateId: 'tpl_cs_recovery',
        name: 'Customer Recovery Workflow',
        description: 'Immediate outreach, investigate issue, offer resolution, follow up',
        confidence: 90,
        parameters: { immediateOutreach: true, investigate: true, offerResolution: true },
        estimatedDurationMinutes: 45,
        tags: ['feedback', 'recovery', 'customer-service'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'customer_service',
    subdomain: 'feedback',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['feedback', 'negative', 'recovery'],
    cooldownMs: 60 * 60 * 1000, // 1 hour
    maxDailyActivations: 20,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 90, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'cs_vip_contact',
    name: 'VIP Customer Contact',
    description: 'Triggers priority handling when VIP customer creates ticket',
    triggerType: 'entity_created',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'ticket', required: true },
      { field: 'customerTier', operator: 'in_list', value: ['vip', 'enterprise', 'strategic'], required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_vip_handling',
        workflowTemplateId: 'tpl_cs_vip',
        name: 'VIP Priority Handling',
        description: 'Assign senior agent, notify account manager, expedite resolution',
        confidence: 95,
        parameters: { assignSenior: true, notifyAM: true, expedite: true },
        estimatedDurationMinutes: 15,
        tags: ['vip', 'priority', 'customer-service'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'customer_service',
    subdomain: 'support',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['vip', 'priority', 'escalation'],
    cooldownMs: 0,
    maxDailyActivations: 30,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 95, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
];

// ============================================================================
// PROJECT MANAGEMENT DOMAIN TRIGGERS
// ============================================================================

/**
 * Project Management Domain Triggers - Sprint and milestone workflows
 */
export const PROJECT_MANAGEMENT_TRIGGERS: ContextTrigger[] = [
  {
    id: 'pm_sprint_ending',
    name: 'Sprint Ending - Review Required',
    description: 'Triggers sprint review and retrospective workflow',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'sprint', required: true },
      { field: 'endDate', operator: 'less_than_or_equal', value: '{{now + 2 days}}', required: true, timeWindow: 2 * 24 * 60 * 60 * 1000 },
      { field: 'status', operator: 'equals', value: 'active', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_sprint_review',
        workflowTemplateId: 'tpl_pm_sprint_review',
        name: 'Sprint Review & Retrospective',
        description: 'Schedule review meeting, prepare demo, collect retrospective input',
        confidence: 90,
        parameters: { scheduleReview: true, prepareDemo: true, collectRetroInput: true },
        estimatedDurationMinutes: 120,
        tags: ['sprint', 'review', 'project-management'],
        autoExecutable: false,
      },
    ],
    priority: 'scheduled',
    domain: 'project_management',
    subdomain: 'agile',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['sprint', 'review', 'agile'],
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxDailyActivations: 5,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 90, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'pm_milestone_reached',
    name: 'Project Milestone Reached',
    description: 'Triggers celebration and next phase kickoff workflow',
    triggerType: 'milestone_reached',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'milestone', required: true },
      { field: 'status', operator: 'changed_to', value: 'completed', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_milestone_complete',
        workflowTemplateId: 'tpl_pm_milestone',
        name: 'Milestone Completion Workflow',
        description: 'Update stakeholders, document learnings, initiate next phase',
        confidence: 88,
        parameters: { notifyStakeholders: true, documentLearnings: true, initiateNextPhase: true },
        estimatedDurationMinutes: 60,
        tags: ['milestone', 'completion', 'project-management'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'project_management',
    subdomain: 'milestones',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['milestone', 'completion', 'celebration'],
    cooldownMs: 0,
    maxDailyActivations: 10,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 88, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'pm_task_blocked',
    name: 'Task Blocked - Resolution Required',
    description: 'Triggers resolution workflow when task is marked as blocked',
    triggerType: 'entity_updated',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'task', required: true },
      { field: 'status', operator: 'changed_to', value: 'blocked', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_blocked_resolution',
        workflowTemplateId: 'tpl_pm_blocked',
        name: 'Blocked Task Resolution',
        description: 'Identify blocker, escalate to appropriate party, track resolution',
        confidence: 85,
        parameters: { identifyBlocker: true, escalate: true, trackResolution: true },
        estimatedDurationMinutes: 30,
        tags: ['blocked', 'resolution', 'project-management'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'project_management',
    subdomain: 'tasks',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['blocked', 'impediment', 'resolution'],
    cooldownMs: 60 * 60 * 1000, // 1 hour
    maxDailyActivations: 20,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 85, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'pm_deadline_at_risk',
    name: 'Project Deadline at Risk',
    description: 'Triggers risk mitigation workflow when project is behind schedule',
    triggerType: 'pattern_detected',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'project', required: true },
      { field: 'healthScore', operator: 'less_than', value: 50, required: true },
      { field: 'percentComplete', operator: 'less_than', value: '{{expectedProgress}}', required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_risk_mitigation',
        workflowTemplateId: 'tpl_pm_risk',
        name: 'Deadline Risk Mitigation',
        description: 'Analyze delays, identify options, communicate to stakeholders',
        confidence: 82,
        parameters: { analyzeDelays: true, identifyOptions: true, communicateRisk: true },
        estimatedDurationMinutes: 90,
        tags: ['risk', 'deadline', 'project-management'],
        autoExecutable: false,
      },
    ],
    priority: 'immediate',
    domain: 'project_management',
    subdomain: 'risk',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['risk', 'deadline', 'schedule'],
    cooldownMs: 24 * 60 * 60 * 1000, // 1 day
    maxDailyActivations: 5,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 82, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'pm_resource_overallocation',
    name: 'Resource Over-allocation Detected',
    description: 'Triggers rebalancing workflow when team member is over-allocated',
    triggerType: 'pattern_detected',
    conditions: [
      { field: 'entityType', operator: 'equals', value: 'resource', required: true },
      { field: 'allocationPercentage', operator: 'greater_than', value: 120, required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_resource_rebalance',
        workflowTemplateId: 'tpl_pm_rebalance',
        name: 'Resource Rebalancing',
        description: 'Analyze workload, propose redistribution, update assignments',
        confidence: 80,
        parameters: { analyzeWorkload: true, proposeRedistribution: true, updateAssignments: true },
        estimatedDurationMinutes: 45,
        tags: ['resource', 'allocation', 'project-management'],
        autoExecutable: false,
      },
    ],
    priority: 'soon',
    domain: 'project_management',
    subdomain: 'resources',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['resource', 'allocation', 'workload'],
    cooldownMs: 24 * 60 * 60 * 1000, // 1 day
    maxDailyActivations: 10,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 80, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
  {
    id: 'pm_standup_reminder',
    name: 'Daily Standup Reminder',
    description: 'Triggers standup preparation workflow (GCC timing: Sunday start)',
    triggerType: 'time_elapsed',
    conditions: [
      { field: 'systemEvent', operator: 'equals', value: 'standup_time', required: true },
      { field: 'dayOfWeek', operator: 'in_list', value: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'], required: true },
    ],
    predictedWorkflows: [
      {
        id: 'wf_standup_prep',
        workflowTemplateId: 'tpl_pm_standup',
        name: 'Standup Preparation',
        description: 'Compile updates, identify blockers, prepare meeting notes',
        confidence: 92,
        parameters: { compileUpdates: true, identifyBlockers: true, prepareNotes: true },
        estimatedDurationMinutes: 15,
        tags: ['standup', 'daily', 'project-management'],
        autoExecutable: true,
      },
    ],
    priority: 'scheduled',
    domain: 'project_management',
    subdomain: 'agile',
    enabled: true,
    applicableRegions: ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'],
    tags: ['standup', 'daily', 'agile', 'gcc'],
    cooldownMs: 20 * 60 * 60 * 1000, // 20 hours
    maxDailyActivations: 1,
    metrics: { totalActivations: 0, acceptedCount: 0, rejectedCount: 0, averageConfidence: 92, executionSuccessRate: 0, lastUpdatedAt: new Date() },
  },
];

// ============================================================================
// PREDEFINED TRIGGERS REGISTRY
// ============================================================================

/**
 * Complete registry of all predefined triggers organized by domain
 */
export const PREDEFINED_TRIGGERS: Record<string, ContextTrigger[]> = {
  hr: HR_TRIGGERS,
  sales: SALES_TRIGGERS,
  finance: FINANCE_TRIGGERS,
  operations: OPERATIONS_TRIGGERS,
  legal: LEGAL_TRIGGERS,
  marketing: MARKETING_TRIGGERS,
  customer_service: CUSTOMER_SERVICE_TRIGGERS,
  project_management: PROJECT_MANAGEMENT_TRIGGERS,
};

/**
 * Get all predefined triggers as a flat array
 */
export function getAllPredefinedTriggers(): ContextTrigger[] {
  return Object.values(PREDEFINED_TRIGGERS).flat();
}

/**
 * Get predefined triggers for a specific domain
 */
export function getPredefinedTriggersForDomain(domain: string): ContextTrigger[] {
  return PREDEFINED_TRIGGERS[domain] || [];
}

/**
 * Get predefined trigger by ID
 */
export function getPredefinedTriggerById(triggerId: string): ContextTrigger | undefined {
  return getAllPredefinedTriggers().find(t => t.id === triggerId);
}

// ============================================================================
// PREDICTION CHAINING DEFINITIONS
// ============================================================================

/**
 * Definition of a prediction chain - linked workflow suggestions
 */
export interface PredictionChain {
  /** Chain identifier */
  id: string;
  /** Chain name */
  name: string;
  /** Description */
  description: string;
  /** Ordered list of trigger IDs in the chain */
  triggerSequence: string[];
  /** Domain this chain applies to */
  domain: string;
  /** Typical total duration in minutes */
  totalDurationMinutes: number;
  /** Tags */
  tags: string[];
}

/**
 * Pre-defined prediction chains
 */
export const PREDICTION_CHAINS: PredictionChain[] = [
  {
    id: 'chain_new_employee',
    name: 'New Employee Full Journey',
    description: 'Complete new employee journey from hire to productivity',
    triggerSequence: [
      'hr_new_employee',           // Onboarding
      'hr_probation_ending',       // Probation review
      'hr_annual_review_due',      // First performance review
    ],
    domain: 'hr',
    totalDurationMinutes: 43200, // ~30 days
    tags: ['employee-lifecycle', 'onboarding', 'hr'],
  },
  {
    id: 'chain_deal_to_success',
    name: 'Deal Won to Customer Success',
    description: 'Full journey from closed deal to successful customer',
    triggerSequence: [
      'sales_deal_won',            // Implementation kickoff
      'sales_upsell_opportunity',  // Upsell when ready
      'sales_contract_renewal_due', // Renewal
    ],
    domain: 'sales',
    totalDurationMinutes: 525600, // ~1 year
    tags: ['customer-journey', 'sales', 'success'],
  },
  {
    id: 'chain_invoice_to_payment',
    name: 'Invoice to Payment Cycle',
    description: 'Complete invoice lifecycle from receipt to payment',
    triggerSequence: [
      'finance_invoice_received',  // Approval routing
      'finance_payment_due',       // Payment reminder
    ],
    domain: 'finance',
    totalDurationMinutes: 20160, // ~14 days
    tags: ['invoice', 'payment', 'finance'],
  },
  {
    id: 'chain_inventory_restock',
    name: 'Inventory Restock Cycle',
    description: 'Complete inventory management from low stock to delivery',
    triggerSequence: [
      'ops_supplier_lead_time',    // Order reminder
      'ops_inventory_low',         // Reorder
      'ops_po_approved',           // Send PO
    ],
    domain: 'operations',
    totalDurationMinutes: 10080, // ~7 days
    tags: ['inventory', 'restock', 'operations'],
  },
  {
    id: 'chain_contract_lifecycle',
    name: 'Contract Full Lifecycle',
    description: 'Contract from creation to renewal',
    triggerSequence: [
      'legal_new_contract_created', // Legal review
      'legal_contract_expiring',    // Renewal review
    ],
    domain: 'legal',
    totalDurationMinutes: 525600, // ~1 year
    tags: ['contract', 'lifecycle', 'legal'],
  },
  {
    id: 'chain_ticket_resolution',
    name: 'Ticket to Satisfaction',
    description: 'Complete support ticket lifecycle',
    triggerSequence: [
      'cs_ticket_created',         // Routing
      'cs_sla_breach_warning',     // Escalation if needed
      'cs_ticket_resolved',        // CSAT survey
    ],
    domain: 'customer_service',
    totalDurationMinutes: 1440, // ~1 day
    tags: ['ticket', 'support', 'satisfaction'],
  },
  {
    id: 'chain_sprint_cycle',
    name: 'Sprint Full Cycle',
    description: 'Complete sprint from planning to retrospective',
    triggerSequence: [
      'pm_standup_reminder',       // Daily standups
      'pm_task_blocked',           // Blocker resolution
      'pm_sprint_ending',          // Review & retro
    ],
    domain: 'project_management',
    totalDurationMinutes: 20160, // ~14 days
    tags: ['sprint', 'agile', 'cycle'],
  },
];

/**
 * Get chain suggestions based on an activated trigger
 */
export function getChainSuggestions(triggerId: string): PredictionChain[] {
  return PREDICTION_CHAINS.filter(chain =>
    chain.triggerSequence.includes(triggerId)
  );
}

/**
 * Get next triggers in a chain after a given trigger
 */
export function getNextTriggersInChain(triggerId: string, chainId: string): string[] {
  const chain = PREDICTION_CHAINS.find(c => c.id === chainId);
  if (!chain) return [];

  const currentIndex = chain.triggerSequence.indexOf(triggerId);
  if (currentIndex === -1 || currentIndex === chain.triggerSequence.length - 1) return [];

  return chain.triggerSequence.slice(currentIndex + 1);
}

// ============================================================================
// CONTEXT MONITOR CLASS
// ============================================================================

/**
 * Context Monitor - Core class for managing triggers and watching entities
 */
export class ContextMonitor {
  private triggers: Map<string, ContextTrigger>;
  private activeWatches: Map<string, Watch>;
  private config: ContextMonitorConfig;
  private activationCounts: Map<string, { date: string; count: number }>;
  private lastActivations: Map<string, Date>;

  constructor(config: Partial<ContextMonitorConfig> = {}) {
    this.triggers = new Map();
    this.activeWatches = new Map();
    this.activationCounts = new Map();
    this.lastActivations = new Map();
    this.config = { ...DEFAULT_CONTEXT_MONITOR_CONFIG, ...config };

    // Load predefined triggers
    this.loadPredefinedTriggers();
  }

  /**
   * Load all predefined triggers into the monitor
   */
  private loadPredefinedTriggers(): void {
    for (const trigger of getAllPredefinedTriggers()) {
      // Filter by region if applicable
      if (trigger.applicableRegions && trigger.applicableRegions.length > 0) {
        if (!trigger.applicableRegions.includes(this.config.region)) {
          continue;
        }
      }
      this.triggers.set(trigger.id, { ...trigger });
    }
  }

  // ========================================
  // TRIGGER MANAGEMENT
  // ========================================

  /**
   * Register a new trigger
   */
  registerTrigger(trigger: ContextTrigger): void {
    this.triggers.set(trigger.id, {
      ...trigger,
      metrics: trigger.metrics || {
        totalActivations: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        averageConfidence: 0,
        executionSuccessRate: 0,
        lastUpdatedAt: new Date(),
      },
    });
  }

  /**
   * Remove a trigger
   */
  removeTrigger(triggerId: string): void {
    this.triggers.delete(triggerId);
    // Remove related activation tracking
    this.activationCounts.delete(triggerId);
    this.lastActivations.delete(triggerId);
  }

  /**
   * Enable a trigger
   */
  enableTrigger(triggerId: string): void {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.enabled = true;
    }
  }

  /**
   * Disable a trigger
   */
  disableTrigger(triggerId: string): void {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.enabled = false;
    }
  }

  /**
   * Get a trigger by ID
   */
  getTrigger(triggerId: string): ContextTrigger | undefined {
    return this.triggers.get(triggerId);
  }

  /**
   * Get all registered triggers
   */
  getAllTriggers(): ContextTrigger[] {
    return Array.from(this.triggers.values());
  }

  /**
   * Get triggers for a specific domain
   */
  getTriggersForDomain(domain: string): ContextTrigger[] {
    return Array.from(this.triggers.values()).filter(t => t.domain === domain);
  }

  /**
   * Get enabled triggers for a specific domain
   */
  getEnabledTriggersForDomain(domain: string): ContextTrigger[] {
    return this.getTriggersForDomain(domain).filter(t => t.enabled);
  }

  // ========================================
  // CONTEXT WATCHING
  // ========================================

  /**
   * Watch an entity for context changes
   */
  watchEntity(entityType: string, entityId: string, triggerIds: string[]): Watch {
    const watchId = `watch_${entityType}_${entityId}_${Date.now()}`;
    const watch: Watch = {
      id: watchId,
      entityType,
      entityId,
      triggerIds,
      active: true,
      createdAt: new Date(),
    };

    this.activeWatches.set(watchId, watch);
    return watch;
  }

  /**
   * Stop watching an entity
   */
  unwatchEntity(watchId: string): void {
    this.activeWatches.delete(watchId);
  }

  /**
   * Get active watch by ID
   */
  getWatch(watchId: string): Watch | undefined {
    return this.activeWatches.get(watchId);
  }

  /**
   * Get all active watches
   */
  getAllWatches(): Watch[] {
    return Array.from(this.activeWatches.values());
  }

  /**
   * Get watches for an entity
   */
  getWatchesForEntity(entityType: string, entityId: string): Watch[] {
    return Array.from(this.activeWatches.values()).filter(
      w => w.entityType === entityType && w.entityId === entityId && w.active
    );
  }

  // ========================================
  // EVENT PROCESSING
  // ========================================

  /**
   * Process a context change and evaluate triggers
   */
  processContextChange(change: ContextChange): TriggerResult[] {
    const results: TriggerResult[] = [];
    const relevantTriggers = this.getRelevantTriggers(change);

    for (const trigger of relevantTriggers) {
      const result = this.evaluateTrigger(trigger, change);
      results.push(result);
    }

    return results;
  }

  /**
   * Get triggers relevant to a context change
   */
  private getRelevantTriggers(change: ContextChange): ContextTrigger[] {
    return Array.from(this.triggers.values()).filter(trigger => {
      // Must be enabled
      if (!trigger.enabled) return false;

      // Check trigger type matches change type
      const typeMatch = this.triggerTypeMatchesChange(trigger.triggerType, change.changeType);
      if (!typeMatch) return false;

      // Check domain
      if (trigger.domain !== change.domain && trigger.domain !== '*') return false;

      return true;
    });
  }

  /**
   * Check if trigger type matches change type
   */
  private triggerTypeMatchesChange(triggerType: TriggerType, changeType: string): boolean {
    switch (triggerType) {
      case 'entity_created':
        return changeType === 'create';
      case 'entity_updated':
        return changeType === 'update';
      case 'threshold_crossed':
      case 'milestone_reached':
      case 'pattern_detected':
        return changeType === 'update';
      case 'time_elapsed':
        return true; // Time-based triggers are handled separately
      default:
        return false;
    }
  }

  /**
   * Evaluate a single trigger against a context change
   */
  private evaluateTrigger(trigger: ContextTrigger, change: ContextChange): TriggerResult {
    const now = new Date();

    // Check cool-down
    if (!this.checkCooldown(trigger.id, trigger.cooldownMs || this.config.defaultCooldownMs)) {
      return {
        triggerId: trigger.id,
        activated: false,
        reason: 'Trigger is in cool-down period',
        evaluatedAt: now,
      };
    }

    // Check daily activation limit
    if (!this.checkDailyLimit(trigger.id, trigger.maxDailyActivations || this.config.defaultMaxDailyActivations)) {
      return {
        triggerId: trigger.id,
        activated: false,
        reason: 'Daily activation limit reached',
        evaluatedAt: now,
      };
    }

    // Evaluate conditions
    const { matched, matchedConditions, confidence } = this.evaluateConditions(trigger.conditions, change);

    if (!matched) {
      return {
        triggerId: trigger.id,
        activated: false,
        reason: 'Conditions not met',
        evaluatedAt: now,
      };
    }

    // Trigger activated
    this.recordActivation(trigger.id);

    return {
      triggerId: trigger.id,
      activated: true,
      confidence,
      matchedConditions,
      suggestedWorkflows: trigger.predictedWorkflows.map(wf => ({
        ...wf,
        confidence: Math.min(wf.confidence, confidence),
      })),
      reason: 'All conditions met',
      evaluatedAt: now,
    };
  }

  /**
   * Evaluate trigger conditions against change data
   */
  private evaluateConditions(
    conditions: TriggerCondition[],
    change: ContextChange
  ): { matched: boolean; matchedConditions: TriggerCondition[]; confidence: number } {
    const matchedConditions: TriggerCondition[] = [];
    let totalWeight = 0;
    let matchedWeight = 0;

    const requiredConditions = conditions.filter(c => c.required !== false);
    const optionalConditions = conditions.filter(c => c.required === false);

    // All required conditions must match
    for (const condition of requiredConditions) {
      const weight = condition.weight || 1;
      totalWeight += weight;

      if (this.evaluateSingleCondition(condition, change)) {
        matchedConditions.push(condition);
        matchedWeight += weight;
      } else {
        // Required condition failed - no match
        return { matched: false, matchedConditions: [], confidence: 0 };
      }
    }

    // Check optional conditions for confidence boost
    for (const condition of optionalConditions) {
      const weight = condition.weight || 0.5;
      totalWeight += weight;

      if (this.evaluateSingleCondition(condition, change)) {
        matchedConditions.push(condition);
        matchedWeight += weight;
      }
    }

    const confidence = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 100;

    return {
      matched: true,
      matchedConditions,
      confidence,
    };
  }

  /**
   * Evaluate a single condition
   */
  private evaluateSingleCondition(condition: TriggerCondition, change: ContextChange): boolean {
    // Special handling for entity type
    if (condition.field === 'entityType') {
      return this.compareValues(condition.operator, change.entityType, condition.value);
    }

    // Check in new values
    const newValue = change.newValues[condition.field];
    const oldValue = change.oldValues?.[condition.field];

    switch (condition.operator) {
      case 'changed_to':
        return newValue === condition.value && oldValue !== condition.value;
      case 'changed_from':
        return oldValue === condition.value && newValue !== condition.value;
      default:
        return this.compareValues(condition.operator, newValue, condition.value);
    }
  }

  /**
   * Compare values using the specified operator
   */
  private compareValues(operator: ConditionOperator, actualValue: unknown, expectedValue: unknown): boolean {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'not_equals':
        return actualValue !== expectedValue;
      case 'contains':
        return String(actualValue).includes(String(expectedValue));
      case 'not_contains':
        return !String(actualValue).includes(String(expectedValue));
      case 'greater_than':
        return Number(actualValue) > Number(expectedValue);
      case 'less_than':
        return Number(actualValue) < Number(expectedValue);
      case 'greater_than_or_equal':
        return Number(actualValue) >= Number(expectedValue);
      case 'less_than_or_equal':
        return Number(actualValue) <= Number(expectedValue);
      case 'is_empty':
        return actualValue === null || actualValue === undefined || actualValue === '';
      case 'is_not_empty':
        return actualValue !== null && actualValue !== undefined && actualValue !== '';
      case 'in_list':
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      case 'not_in_list':
        return !Array.isArray(expectedValue) || !expectedValue.includes(actualValue);
      case 'matches_regex':
        try {
          return new RegExp(String(expectedValue)).test(String(actualValue));
        } catch {
          return false;
        }
      case 'between':
        if (Array.isArray(expectedValue) && expectedValue.length === 2) {
          const num = Number(actualValue);
          return num >= Number(expectedValue[0]) && num <= Number(expectedValue[1]);
        }
        return false;
      default:
        return false;
    }
  }

  // ========================================
  // ACTIVATION TRACKING
  // ========================================

  /**
   * Check if trigger is past cool-down period
   */
  private checkCooldown(triggerId: string, cooldownMs: number): boolean {
    if (cooldownMs === 0) return true;

    const lastActivation = this.lastActivations.get(triggerId);
    if (!lastActivation) return true;

    return Date.now() - lastActivation.getTime() >= cooldownMs;
  }

  /**
   * Check if trigger is within daily activation limit
   */
  private checkDailyLimit(triggerId: string, maxDaily: number): boolean {
    const today = new Date().toISOString().split('T')[0];
    const tracking = this.activationCounts.get(triggerId);

    if (!tracking || tracking.date !== today) return true;
    return tracking.count < maxDaily;
  }

  /**
   * Record a trigger activation
   */
  private recordActivation(triggerId: string): void {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Update last activation
    this.lastActivations.set(triggerId, now);

    // Update daily count
    const tracking = this.activationCounts.get(triggerId);
    if (!tracking || tracking.date !== today) {
      this.activationCounts.set(triggerId, { date: today, count: 1 });
    } else {
      tracking.count++;
    }

    // Update trigger metrics
    const trigger = this.triggers.get(triggerId);
    if (trigger && trigger.metrics) {
      trigger.metrics.totalActivations++;
      trigger.metrics.lastActivatedAt = now;
      trigger.metrics.lastUpdatedAt = now;
    }
  }

  // ========================================
  // PREDICTION GENERATION
  // ========================================

  /**
   * Evaluate all triggers and generate predictions for a business context
   */
  evaluateTriggers(context: BusinessContext): ActivatedTrigger[] {
    const activated: ActivatedTrigger[] = [];

    // Create a synthetic change from context
    const change: ContextChange = {
      id: `ctx_${Date.now()}`,
      changeType: 'update',
      entityType: context.entityType,
      entityId: context.entityId,
      changedFields: Object.keys(context.currentState),
      oldValues: context.previousState,
      newValues: context.currentState,
      domain: context.domain,
      timestamp: context.timestamp,
    };

    const results = this.processContextChange(change);

    for (const result of results) {
      if (result.activated) {
        const trigger = this.triggers.get(result.triggerId);
        if (trigger) {
          activated.push({
            trigger,
            context,
            confidence: result.confidence || 0,
            matchedConditions: result.matchedConditions || [],
            activatedAt: result.evaluatedAt,
          });
        }
      }
    }

    return activated;
  }

  /**
   * Generate predictions from activated triggers
   */
  generatePredictions(context: BusinessContext): ContextPrediction[] {
    const activatedTriggers = this.evaluateTriggers(context);
    const predictions: ContextPrediction[] = [];

    for (const activated of activatedTriggers) {
      for (const workflow of activated.trigger.predictedWorkflows) {
        const prediction: ContextPrediction = {
          id: `pred_${activated.trigger.id}_${workflow.id}_${Date.now()}`,
          triggerId: activated.trigger.id,
          triggerName: activated.trigger.name,
          workflow: {
            ...workflow,
            confidence: Math.min(workflow.confidence, activated.confidence),
          },
          priority: activated.trigger.priority,
          confidence: Math.min(workflow.confidence, activated.confidence),
          context,
          reasoning: this.generateReasoning(activated),
          relatedEntity: {
            type: context.entityType,
            id: context.entityId,
          },
          domain: activated.trigger.domain,
          regionalConsiderations: this.getRegionalConsiderations(activated.trigger),
          predictedAt: new Date(),
          expiresAt: new Date(Date.now() + this.config.predictionExpiryMs),
          chainedPredictions: this.getChainedPredictionIds(activated.trigger.id),
          tags: [...activated.trigger.tags, ...workflow.tags],
        };

        predictions.push(prediction);
      }
    }

    return predictions;
  }

  /**
   * Prioritize predictions based on various factors
   */
  prioritizePredictions(predictions: ContextPrediction[]): ContextPrediction[] {
    return predictions
      .filter(p => p.confidence >= this.config.minimumConfidenceThreshold)
      .sort((a, b) => {
        // First by priority
        const priorityOrder: Record<PredictionPriority, number> = {
          immediate: 0,
          soon: 1,
          scheduled: 2,
        };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by confidence
        return b.confidence - a.confidence;
      })
      .slice(0, this.config.maxPredictions);
  }

  /**
   * Generate reasoning text for an activated trigger
   */
  private generateReasoning(activated: ActivatedTrigger): string {
    const conditions = activated.matchedConditions
      .map(c => `${c.field} ${c.operator} ${JSON.stringify(c.value)}`)
      .join(', ');

    return `Trigger "${activated.trigger.name}" activated because: ${conditions}. ` +
      `Confidence: ${activated.confidence}%. Priority: ${activated.trigger.priority}.`;
  }

  /**
   * Get regional considerations for a trigger
   */
  private getRegionalConsiderations(trigger: ContextTrigger): string[] {
    const considerations: string[] = [];

    // Add GCC-specific considerations based on region
    if (['KW', 'AE', 'SA', 'QA', 'BH', 'OM'].includes(this.config.region)) {
      if (trigger.domain === 'hr') {
        considerations.push('Sunday is first business day - adjust timing accordingly');
        considerations.push('Consider Ramadan working hours if applicable');
      }
      if (trigger.domain === 'sales' || trigger.domain === 'customer_service') {
        considerations.push('WhatsApp is primary communication channel in GCC');
        considerations.push('Thursday afternoon = pre-weekend context');
      }
      if (trigger.domain === 'finance') {
        considerations.push(`VAT rate: 5% for Kuwait (check regional rates)`);
      }
    }

    return considerations;
  }

  /**
   * Get IDs of predictions that could chain from this trigger
   */
  private getChainedPredictionIds(triggerId: string): string[] {
    const chains = getChainSuggestions(triggerId);
    const nextTriggerIds: string[] = [];

    for (const chain of chains) {
      const nextIds = getNextTriggersInChain(triggerId, chain.id);
      nextTriggerIds.push(...nextIds);
    }

    return [...new Set(nextTriggerIds)];
  }

  // ========================================
  // LEARNING INTEGRATION
  // ========================================

  /**
   * Record the outcome of a trigger activation
   */
  recordTriggerOutcome(triggerId: string, accepted: boolean, executionSuccessful?: boolean): void {
    if (!this.config.enableLearning) return;

    const trigger = this.triggers.get(triggerId);
    if (!trigger || !trigger.metrics) return;

    if (accepted) {
      trigger.metrics.acceptedCount++;
    } else {
      trigger.metrics.rejectedCount++;
    }

    if (executionSuccessful !== undefined) {
      const total = trigger.metrics.acceptedCount;
      const currentRate = trigger.metrics.executionSuccessRate;
      const newSuccess = executionSuccessful ? 1 : 0;
      trigger.metrics.executionSuccessRate =
        ((currentRate * (total - 1)) + newSuccess) / total;
    }

    // Update average confidence (rolling average)
    // For now, maintain current average since we don't have the specific confidence
    // Future: Use total activations to compute rolling average
    trigger.metrics.averageConfidence = trigger.metrics.averageConfidence;

    trigger.metrics.lastUpdatedAt = new Date();
  }

  /**
   * Get performance metrics for a trigger
   */
  getTriggerMetrics(triggerId: string): TriggerMetrics | undefined {
    return this.triggers.get(triggerId)?.metrics;
  }

  /**
   * Get triggers sorted by performance
   */
  getTopPerformingTriggers(limit: number = 10): ContextTrigger[] {
    return Array.from(this.triggers.values())
      .filter(t => t.metrics && t.metrics.totalActivations > 0)
      .sort((a, b) => {
        const aScore = this.calculateTriggerScore(a);
        const bScore = this.calculateTriggerScore(b);
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  /**
   * Calculate a performance score for a trigger
   */
  private calculateTriggerScore(trigger: ContextTrigger): number {
    if (!trigger.metrics) return 0;

    const total = trigger.metrics.acceptedCount + trigger.metrics.rejectedCount;
    if (total === 0) return 0;

    const acceptRate = trigger.metrics.acceptedCount / total;
    const successRate = trigger.metrics.executionSuccessRate;
    const confidence = trigger.metrics.averageConfidence / 100;

    return (acceptRate * 0.4) + (successRate * 0.4) + (confidence * 0.2);
  }

  // ========================================
  // CONFIGURATION
  // ========================================

  /**
   * Update monitor configuration
   */
  updateConfig(newConfig: Partial<ContextMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ContextMonitorConfig {
    return { ...this.config };
  }

  /**
   * Reset all activation tracking
   */
  resetActivationTracking(): void {
    this.activationCounts.clear();
    this.lastActivations.clear();
  }

  /**
   * Get monitor statistics
   */
  getStatistics(): {
    totalTriggers: number;
    enabledTriggers: number;
    activeWatches: number;
    triggersByDomain: Record<string, number>;
    activationsToday: number;
  } {
    const today = new Date().toISOString().split('T')[0];
    let activationsToday = 0;

    this.activationCounts.forEach(tracking => {
      if (tracking.date === today) {
        activationsToday += tracking.count;
      }
    });

    const triggersByDomain: Record<string, number> = {};
    this.triggers.forEach(trigger => {
      triggersByDomain[trigger.domain] = (triggersByDomain[trigger.domain] || 0) + 1;
    });

    return {
      totalTriggers: this.triggers.size,
      enabledTriggers: Array.from(this.triggers.values()).filter(t => t.enabled).length,
      activeWatches: this.activeWatches.size,
      triggersByDomain,
      activationsToday,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Default context monitor instance
 */
export const contextMonitor = new ContextMonitor();

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new context monitor with custom configuration
 */
export function createContextMonitor(config?: Partial<ContextMonitorConfig>): ContextMonitor {
  return new ContextMonitor(config);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if current time is within GCC business hours
 */
export function isGCCBusinessHours(_region: string = 'KW'): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday

  // GCC work week is Sunday-Thursday (0-4)
  if (day === 5 || day === 6) return false; // Friday, Saturday

  // Get hours in Kuwait timezone (UTC+3)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kuwaitOffset = 3 * 60 * 60000;
  const kuwaitTime = new Date(utc + kuwaitOffset);
  const hours = kuwaitTime.getHours();

  // Business hours typically 8:00 - 17:00
  return hours >= 8 && hours < 17;
}

/**
 * Check if it's Thursday afternoon (pre-weekend in GCC)
 */
export function isPreWeekendGCC(_region: string = 'KW'): boolean {
  const now = new Date();
  const day = now.getDay();

  // Thursday = 4
  if (day !== 4) return false;

  // Get hours in Kuwait timezone
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kuwaitOffset = 3 * 60 * 60000;
  const kuwaitTime = new Date(utc + kuwaitOffset);
  const hours = kuwaitTime.getHours();

  // Afternoon is 12:00+
  return hours >= 12;
}

/**
 * Adjust prediction priority based on GCC timing
 */
export function adjustPriorityForGCCTiming(
  prediction: ContextPrediction,
  region: string = 'KW'
): ContextPrediction {
  // If it's pre-weekend and not urgent, defer to scheduled
  if (isPreWeekendGCC(region) && prediction.priority === 'soon') {
    return {
      ...prediction,
      priority: 'scheduled',
      regionalConsiderations: [
        ...(prediction.regionalConsiderations || []),
        'Adjusted to scheduled due to pre-weekend timing (Thursday afternoon)',
      ],
    };
  }

  return prediction;
}

/**
 * Get context-appropriate notification channel for GCC
 */
export function getPreferredNotificationChannel(domain: string, _region: string = 'KW'): string {
  // WhatsApp is primary in GCC for most business communications
  const gccPrimaryChannel = 'whatsapp';

  // Finance and legal might prefer email for audit trail
  if (domain === 'finance' || domain === 'legal') {
    return 'email';
  }

  return gccPrimaryChannel;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Core class
  ContextMonitor,
  contextMonitor,
  createContextMonitor,

  // Predefined triggers
  PREDEFINED_TRIGGERS,
  getAllPredefinedTriggers,
  getPredefinedTriggersForDomain,
  getPredefinedTriggerById,

  // Domain triggers
  HR_TRIGGERS,
  SALES_TRIGGERS,
  FINANCE_TRIGGERS,
  OPERATIONS_TRIGGERS,
  LEGAL_TRIGGERS,
  MARKETING_TRIGGERS,
  CUSTOMER_SERVICE_TRIGGERS,
  PROJECT_MANAGEMENT_TRIGGERS,

  // Chains
  PREDICTION_CHAINS,
  getChainSuggestions,
  getNextTriggersInChain,

  // Configuration
  DEFAULT_CONTEXT_MONITOR_CONFIG,

  // Utilities
  isGCCBusinessHours,
  isPreWeekendGCC,
  adjustPriorityForGCCTiming,
  getPreferredNotificationChannel,
};

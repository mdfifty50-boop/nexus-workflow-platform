/**
 * Human Review Triggers Service
 *
 * Determines when workflows need human intervention based on
 * configurable policies and trigger conditions.
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Types of triggers that can initiate human review
 */
export type TriggerType =
  | 'amount_threshold'
  | 'error_rate'
  | 'anomaly_detection'
  | 'sensitive_data'
  | 'first_time_workflow'
  | 'schedule_deviation'
  | 'external_system_failure'
  | 'confidence_score'
  | 'custom';

/**
 * Comparison operators for trigger conditions
 */
export type ComparisonOperator =
  | 'eq'      // equals
  | 'neq'     // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'in'      // in array
  | 'nin'     // not in array
  | 'contains'
  | 'matches' // regex match
  | 'exists';

/**
 * Logical operators for combining conditions
 */
export type LogicalOperator = 'AND' | 'OR' | 'NOT';

/**
 * Single condition for a trigger
 */
export interface TriggerCondition {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
  caseSensitive?: boolean;
}

/**
 * Compound condition combining multiple conditions
 */
export interface CompoundCondition {
  operator: LogicalOperator;
  conditions: Array<TriggerCondition | CompoundCondition>;
}

/**
 * Trigger severity levels
 */
export type TriggerSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Review trigger definition
 */
export interface ReviewTrigger {
  id: string;
  name: string;
  description: string;
  type: TriggerType;
  severity: TriggerSeverity;
  condition: TriggerCondition | CompoundCondition;
  enabled: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Policy priority levels
 */
export type PolicyPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Review policy for configurable rules
 */
export interface ReviewPolicy {
  id: string;
  name: string;
  description: string;
  workflowTypes: string[];  // Which workflow types this applies to, '*' for all
  triggers: ReviewTrigger[];
  priority: PolicyPriority;  // 1 = highest priority
  enabled: boolean;
  parentPolicyId?: string;  // For policy inheritance
  overrideParent?: boolean; // Whether to completely override parent or merge
  requireAllTriggers?: boolean; // AND vs OR for multiple triggers
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of trigger evaluation
 */
export interface TriggerEvaluationResult {
  triggered: boolean;
  triggerId: string;
  triggerName: string;
  triggerType: TriggerType;
  severity: TriggerSeverity;
  reason: string;
  matchedConditions: string[];
  context: Record<string, unknown>;
  evaluatedAt: Date;
}

/**
 * Result of policy evaluation
 */
export interface PolicyEvaluationResult {
  policyId: string;
  policyName: string;
  triggered: boolean;
  priority: PolicyPriority;
  triggerResults: TriggerEvaluationResult[];
  requiresReview: boolean;
  reasons: string[];
  evaluatedAt: Date;
}

/**
 * Context for evaluating triggers
 */
export interface EvaluationContext {
  workflowId: string;
  workflowType: string;
  executionId?: string;
  data: Record<string, unknown>;
  metrics?: {
    errorRate?: number;
    successRate?: number;
    executionCount?: number;
    avgDuration?: number;
    lastExecutionTime?: Date;
  };
  history?: {
    previousExecutions?: number;
    previousErrors?: number;
    lastReviewDate?: Date;
  };
}

/**
 * Options for trigger creation
 */
export interface CreateTriggerOptions {
  id?: string;
  name: string;
  description?: string;
  type: TriggerType;
  severity?: TriggerSeverity;
  condition: TriggerCondition | CompoundCondition;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Options for policy creation
 */
export interface CreatePolicyOptions {
  id?: string;
  name: string;
  description?: string;
  workflowTypes?: string[];
  triggers?: ReviewTrigger[];
  priority?: PolicyPriority;
  enabled?: boolean;
  parentPolicyId?: string;
  overrideParent?: boolean;
  requireAllTriggers?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID
 */
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Check if a condition is a compound condition
 */
function isCompoundCondition(
  condition: TriggerCondition | CompoundCondition
): condition is CompoundCondition {
  return 'operator' in condition && 'conditions' in condition;
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Evaluate a single condition against data
 */
function evaluateCondition(
  condition: TriggerCondition,
  data: Record<string, unknown>
): { matched: boolean; description: string } {
  const actualValue = getNestedValue(data, condition.field);
  const expectedValue = condition.value;
  let matched = false;

  switch (condition.operator) {
    case 'eq':
      matched = actualValue === expectedValue;
      break;

    case 'neq':
      matched = actualValue !== expectedValue;
      break;

    case 'gt':
      matched = typeof actualValue === 'number' &&
                typeof expectedValue === 'number' &&
                actualValue > expectedValue;
      break;

    case 'gte':
      matched = typeof actualValue === 'number' &&
                typeof expectedValue === 'number' &&
                actualValue >= expectedValue;
      break;

    case 'lt':
      matched = typeof actualValue === 'number' &&
                typeof expectedValue === 'number' &&
                actualValue < expectedValue;
      break;

    case 'lte':
      matched = typeof actualValue === 'number' &&
                typeof expectedValue === 'number' &&
                actualValue <= expectedValue;
      break;

    case 'in':
      matched = Array.isArray(expectedValue) &&
                expectedValue.includes(actualValue);
      break;

    case 'nin':
      matched = Array.isArray(expectedValue) &&
                !expectedValue.includes(actualValue);
      break;

    case 'contains':
      if (typeof actualValue === 'string' && typeof expectedValue === 'string') {
        matched = condition.caseSensitive
          ? actualValue.includes(expectedValue)
          : actualValue.toLowerCase().includes(expectedValue.toLowerCase());
      } else if (Array.isArray(actualValue)) {
        matched = actualValue.includes(expectedValue);
      }
      break;

    case 'matches':
      if (typeof actualValue === 'string' && typeof expectedValue === 'string') {
        try {
          const regex = new RegExp(expectedValue, condition.caseSensitive ? '' : 'i');
          matched = regex.test(actualValue);
        } catch {
          matched = false;
        }
      }
      break;

    case 'exists':
      matched = actualValue !== undefined && actualValue !== null;
      if (expectedValue === false) {
        matched = !matched;
      }
      break;

    default:
      matched = false;
  }

  const description = `${condition.field} ${condition.operator} ${JSON.stringify(expectedValue)} (actual: ${JSON.stringify(actualValue)})`;

  return { matched, description };
}

/**
 * Evaluate a compound condition recursively
 */
function evaluateCompoundCondition(
  condition: CompoundCondition,
  data: Record<string, unknown>
): { matched: boolean; descriptions: string[] } {
  const results: { matched: boolean; descriptions: string[] }[] = [];

  for (const subCondition of condition.conditions) {
    if (isCompoundCondition(subCondition)) {
      results.push(evaluateCompoundCondition(subCondition, data));
    } else {
      const result = evaluateCondition(subCondition, data);
      results.push({ matched: result.matched, descriptions: [result.description] });
    }
  }

  let matched: boolean;
  const allDescriptions: string[] = results.flatMap(r => r.descriptions);

  switch (condition.operator) {
    case 'AND':
      matched = results.every(r => r.matched);
      break;
    case 'OR':
      matched = results.some(r => r.matched);
      break;
    case 'NOT':
      matched = !results.some(r => r.matched);
      break;
    default:
      matched = false;
  }

  return { matched, descriptions: allDescriptions };
}

// ============================================================================
// Default Triggers
// ============================================================================

/**
 * Create default amount threshold trigger
 */
export function createAmountThresholdTrigger(
  threshold: number,
  field: string = 'data.amount'
): ReviewTrigger {
  return {
    id: generateId('trg'),
    name: `Amount Threshold (>${threshold})`,
    description: `Triggers review when ${field} exceeds ${threshold}`,
    type: 'amount_threshold',
    severity: threshold >= 10000 ? 'high' : threshold >= 1000 ? 'medium' : 'low',
    condition: {
      field,
      operator: 'gt',
      value: threshold,
    },
    enabled: true,
    metadata: { threshold, field },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create default error rate trigger
 */
export function createErrorRateTrigger(
  threshold: number = 0.1,
  field: string = 'metrics.errorRate'
): ReviewTrigger {
  return {
    id: generateId('trg'),
    name: `Error Rate Threshold (>${threshold * 100}%)`,
    description: `Triggers review when error rate exceeds ${threshold * 100}%`,
    type: 'error_rate',
    severity: threshold >= 0.5 ? 'critical' : threshold >= 0.25 ? 'high' : 'medium',
    condition: {
      field,
      operator: 'gt',
      value: threshold,
    },
    enabled: true,
    metadata: { threshold },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create anomaly detection trigger
 */
export function createAnomalyTrigger(
  anomalyFields: string[]
): ReviewTrigger {
  const conditions: TriggerCondition[] = anomalyFields.map(field => ({
    field: `anomalies.${field}`,
    operator: 'eq' as ComparisonOperator,
    value: true,
  }));

  return {
    id: generateId('trg'),
    name: 'Anomaly Detection',
    description: `Triggers review when anomalies detected in: ${anomalyFields.join(', ')}`,
    type: 'anomaly_detection',
    severity: 'high',
    condition: {
      operator: 'OR',
      conditions,
    },
    enabled: true,
    metadata: { anomalyFields },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create sensitive data access trigger
 */
export function createSensitiveDataTrigger(
  sensitiveFields: string[] = ['ssn', 'creditCard', 'password', 'apiKey', 'secret']
): ReviewTrigger {
  const conditions: TriggerCondition[] = sensitiveFields.map(field => ({
    field: `accessedFields`,
    operator: 'contains' as ComparisonOperator,
    value: field,
  }));

  return {
    id: generateId('trg'),
    name: 'Sensitive Data Access',
    description: 'Triggers review when sensitive data fields are accessed',
    type: 'sensitive_data',
    severity: 'critical',
    condition: {
      operator: 'OR',
      conditions,
    },
    enabled: true,
    metadata: { sensitiveFields },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create first-time workflow trigger
 */
export function createFirstTimeWorkflowTrigger(): ReviewTrigger {
  return {
    id: generateId('trg'),
    name: 'First Time Workflow',
    description: 'Triggers review for first execution of a workflow',
    type: 'first_time_workflow',
    severity: 'medium',
    condition: {
      operator: 'OR',
      conditions: [
        {
          field: 'history.previousExecutions',
          operator: 'eq',
          value: 0,
        },
        {
          field: 'history.previousExecutions',
          operator: 'exists',
          value: false,
        },
      ],
    },
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create schedule deviation trigger
 */
export function createScheduleDeviationTrigger(
  maxDeviationMinutes: number = 30
): ReviewTrigger {
  return {
    id: generateId('trg'),
    name: `Schedule Deviation (>${maxDeviationMinutes}min)`,
    description: `Triggers review when execution deviates from schedule by more than ${maxDeviationMinutes} minutes`,
    type: 'schedule_deviation',
    severity: 'medium',
    condition: {
      field: 'schedule.deviationMinutes',
      operator: 'gt',
      value: maxDeviationMinutes,
    },
    enabled: true,
    metadata: { maxDeviationMinutes },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create external system failure trigger
 */
export function createExternalSystemFailureTrigger(
  systemNames?: string[]
): ReviewTrigger {
  const baseCondition: TriggerCondition = {
    field: 'externalSystems.hasFailure',
    operator: 'eq',
    value: true,
  };

  if (systemNames && systemNames.length > 0) {
    return {
      id: generateId('trg'),
      name: 'External System Failure (Specific)',
      description: `Triggers review when specific external systems fail: ${systemNames.join(', ')}`,
      type: 'external_system_failure',
      severity: 'high',
      condition: {
        operator: 'AND',
        conditions: [
          baseCondition,
          {
            field: 'externalSystems.failedSystem',
            operator: 'in',
            value: systemNames,
          },
        ],
      },
      enabled: true,
      metadata: { systemNames },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return {
    id: generateId('trg'),
    name: 'External System Failure',
    description: 'Triggers review when any external system fails',
    type: 'external_system_failure',
    severity: 'high',
    condition: baseCondition,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create confidence score trigger
 */
export function createConfidenceScoreTrigger(
  minConfidence: number = 0.8
): ReviewTrigger {
  return {
    id: generateId('trg'),
    name: `Low Confidence (<${minConfidence * 100}%)`,
    description: `Triggers review when AI confidence score is below ${minConfidence * 100}%`,
    type: 'confidence_score',
    severity: minConfidence <= 0.5 ? 'high' : 'medium',
    condition: {
      field: 'ai.confidenceScore',
      operator: 'lt',
      value: minConfidence,
    },
    enabled: true,
    metadata: { minConfidence },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================================================
// Default Policies
// ============================================================================

/**
 * Get default triggers for a workflow type
 */
export function getDefaultTriggersForType(workflowType: string): ReviewTrigger[] {
  const commonTriggers = [
    createErrorRateTrigger(0.1),
    createFirstTimeWorkflowTrigger(),
    createExternalSystemFailureTrigger(),
  ];

  switch (workflowType) {
    case 'financial':
    case 'payment':
    case 'billing':
      return [
        ...commonTriggers,
        createAmountThresholdTrigger(10000),
        createSensitiveDataTrigger(['creditCard', 'bankAccount', 'ssn']),
        createAnomalyTrigger(['unusualAmount', 'unusualFrequency', 'unusualRecipient']),
      ];

    case 'data_processing':
    case 'etl':
      return [
        ...commonTriggers,
        createErrorRateTrigger(0.05), // Lower threshold for data processing
        createAnomalyTrigger(['dataVolumeAnomaly', 'schemaChange', 'duplicateDetection']),
      ];

    case 'user_management':
    case 'authentication':
      return [
        ...commonTriggers,
        createSensitiveDataTrigger(['password', 'apiKey', 'secret', 'token']),
        createAnomalyTrigger(['unusualLoginLocation', 'unusualLoginTime', 'bruteForceAttempt']),
      ];

    case 'notification':
    case 'messaging':
      return [
        ...commonTriggers,
        createAnomalyTrigger(['bulkSend', 'unusualRecipientCount']),
        createScheduleDeviationTrigger(60),
      ];

    case 'ai_assisted':
    case 'ml_pipeline':
      return [
        ...commonTriggers,
        createConfidenceScoreTrigger(0.8),
        createAnomalyTrigger(['modelDrift', 'predictionAnomaly']),
      ];

    case 'integration':
    case 'api':
      return [
        ...commonTriggers,
        createExternalSystemFailureTrigger(),
        createErrorRateTrigger(0.15),
        createScheduleDeviationTrigger(15),
      ];

    default:
      return commonTriggers;
  }
}

/**
 * Create default policy for a workflow type
 */
export function createDefaultPolicy(workflowType: string): ReviewPolicy {
  return {
    id: generateId('pol'),
    name: `Default ${workflowType} Policy`,
    description: `Default review policy for ${workflowType} workflows`,
    workflowTypes: [workflowType],
    triggers: getDefaultTriggersForType(workflowType),
    priority: 5,
    enabled: true,
    requireAllTriggers: false, // OR logic by default
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create a global fallback policy
 */
export function createGlobalFallbackPolicy(): ReviewPolicy {
  return {
    id: 'pol_global_fallback',
    name: 'Global Fallback Policy',
    description: 'Applies to all workflows when no specific policy matches',
    workflowTypes: ['*'],
    triggers: [
      createErrorRateTrigger(0.25),
      createFirstTimeWorkflowTrigger(),
      createExternalSystemFailureTrigger(),
    ],
    priority: 10, // Lowest priority
    enabled: true,
    requireAllTriggers: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Evaluate a single trigger against context
 */
export function evaluateTrigger(
  trigger: ReviewTrigger,
  context: EvaluationContext
): TriggerEvaluationResult {
  if (!trigger.enabled) {
    return {
      triggered: false,
      triggerId: trigger.id,
      triggerName: trigger.name,
      triggerType: trigger.type,
      severity: trigger.severity,
      reason: 'Trigger is disabled',
      matchedConditions: [],
      context: {},
      evaluatedAt: new Date(),
    };
  }

  // Flatten context for evaluation
  const flatContext: Record<string, unknown> = {
    ...context.data,
    workflowId: context.workflowId,
    workflowType: context.workflowType,
    executionId: context.executionId,
    metrics: context.metrics,
    history: context.history,
  };

  let matched: boolean;
  let matchedDescriptions: string[];

  if (isCompoundCondition(trigger.condition)) {
    const result = evaluateCompoundCondition(trigger.condition, flatContext);
    matched = result.matched;
    matchedDescriptions = result.descriptions;
  } else {
    const result = evaluateCondition(trigger.condition, flatContext);
    matched = result.matched;
    matchedDescriptions = [result.description];
  }

  return {
    triggered: matched,
    triggerId: trigger.id,
    triggerName: trigger.name,
    triggerType: trigger.type,
    severity: trigger.severity,
    reason: matched
      ? `Trigger "${trigger.name}" activated: ${trigger.description}`
      : `Trigger "${trigger.name}" not activated`,
    matchedConditions: matched ? matchedDescriptions : [],
    context: flatContext,
    evaluatedAt: new Date(),
  };
}

/**
 * Evaluate all triggers in a policy
 */
export function evaluateTriggers(
  triggers: ReviewTrigger[],
  context: EvaluationContext,
  _requireAll: boolean = false
): TriggerEvaluationResult[] {
  const results = triggers
    .filter(t => t.enabled)
    .map(trigger => evaluateTrigger(trigger, context));

  return results;
}

/**
 * Evaluate a policy against context
 */
export function evaluatePolicy(
  policy: ReviewPolicy,
  context: EvaluationContext
): PolicyEvaluationResult {
  if (!policy.enabled) {
    return {
      policyId: policy.id,
      policyName: policy.name,
      triggered: false,
      priority: policy.priority,
      triggerResults: [],
      requiresReview: false,
      reasons: ['Policy is disabled'],
      evaluatedAt: new Date(),
    };
  }

  // Check if policy applies to this workflow type
  const appliesToWorkflow = policy.workflowTypes.includes('*') ||
                            policy.workflowTypes.includes(context.workflowType);

  if (!appliesToWorkflow) {
    return {
      policyId: policy.id,
      policyName: policy.name,
      triggered: false,
      priority: policy.priority,
      triggerResults: [],
      requiresReview: false,
      reasons: [`Policy does not apply to workflow type: ${context.workflowType}`],
      evaluatedAt: new Date(),
    };
  }

  const triggerResults = evaluateTriggers(
    policy.triggers,
    context,
    policy.requireAllTriggers
  );

  const triggeredResults = triggerResults.filter(r => r.triggered);

  let policyTriggered: boolean;
  if (policy.requireAllTriggers) {
    // AND logic: all enabled triggers must fire
    const enabledTriggerCount = policy.triggers.filter(t => t.enabled).length;
    policyTriggered = triggeredResults.length === enabledTriggerCount && enabledTriggerCount > 0;
  } else {
    // OR logic: any trigger fires
    policyTriggered = triggeredResults.length > 0;
  }

  const reasons = triggeredResults.map(r => r.reason);

  return {
    policyId: policy.id,
    policyName: policy.name,
    triggered: policyTriggered,
    priority: policy.priority,
    triggerResults,
    requiresReview: policyTriggered,
    reasons: reasons.length > 0 ? reasons : ['No triggers activated'],
    evaluatedAt: new Date(),
  };
}

/**
 * Determine if review is required based on multiple policies
 */
export function shouldRequireReview(
  policies: ReviewPolicy[],
  context: EvaluationContext
): { required: boolean; results: PolicyEvaluationResult[] } {
  // Sort policies by priority (lower number = higher priority)
  const sortedPolicies = [...policies].sort((a, b) => a.priority - b.priority);

  const results: PolicyEvaluationResult[] = [];

  for (const policy of sortedPolicies) {
    const result = evaluatePolicy(policy, context);
    results.push(result);

    // If a high-priority policy triggers, we require review
    if (result.triggered && result.requiresReview) {
      return { required: true, results };
    }
  }

  return { required: false, results };
}

/**
 * Get detailed reasons why review is required
 */
export function getTriggerReasons(
  policies: ReviewPolicy[],
  context: EvaluationContext
): {
  requiresReview: boolean;
  reasons: string[];
  triggeredPolicies: string[];
  triggeredTriggers: Array<{
    policyName: string;
    triggerName: string;
    triggerType: TriggerType;
    severity: TriggerSeverity;
    reason: string;
  }>;
  highestSeverity: TriggerSeverity | null;
} {
  const { required, results } = shouldRequireReview(policies, context);

  const triggeredPolicies: string[] = [];
  const triggeredTriggers: Array<{
    policyName: string;
    triggerName: string;
    triggerType: TriggerType;
    severity: TriggerSeverity;
    reason: string;
  }> = [];
  const allReasons: string[] = [];

  const severityOrder: TriggerSeverity[] = ['low', 'medium', 'high', 'critical'];
  let highestSeverityIndex = -1;

  for (const result of results) {
    if (result.triggered) {
      triggeredPolicies.push(result.policyName);
      allReasons.push(...result.reasons);

      for (const triggerResult of result.triggerResults) {
        if (triggerResult.triggered) {
          triggeredTriggers.push({
            policyName: result.policyName,
            triggerName: triggerResult.triggerName,
            triggerType: triggerResult.triggerType,
            severity: triggerResult.severity,
            reason: triggerResult.reason,
          });

          const severityIndex = severityOrder.indexOf(triggerResult.severity);
          if (severityIndex > highestSeverityIndex) {
            highestSeverityIndex = severityIndex;
          }
        }
      }
    }
  }

  return {
    requiresReview: required,
    reasons: allReasons,
    triggeredPolicies,
    triggeredTriggers,
    highestSeverity: highestSeverityIndex >= 0 ? severityOrder[highestSeverityIndex] : null,
  };
}

/**
 * Get all policies that were triggered
 */
export function getTriggeredPolicies(
  policies: ReviewPolicy[],
  context: EvaluationContext
): PolicyEvaluationResult[] {
  const results = policies.map(policy => evaluatePolicy(policy, context));
  return results.filter(r => r.triggered);
}

// ============================================================================
// Trigger and Policy Creation
// ============================================================================

/**
 * Create a custom trigger
 */
export function createCustomTrigger(options: CreateTriggerOptions): ReviewTrigger {
  return {
    id: options.id || generateId('trg'),
    name: options.name,
    description: options.description || `Custom trigger: ${options.name}`,
    type: options.type,
    severity: options.severity || 'medium',
    condition: options.condition,
    enabled: options.enabled ?? true,
    metadata: options.metadata,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create a custom policy
 */
export function createCustomPolicy(options: CreatePolicyOptions): ReviewPolicy {
  return {
    id: options.id || generateId('pol'),
    name: options.name,
    description: options.description || `Custom policy: ${options.name}`,
    workflowTypes: options.workflowTypes || ['*'],
    triggers: options.triggers || [],
    priority: options.priority || 5,
    enabled: options.enabled ?? true,
    parentPolicyId: options.parentPolicyId,
    overrideParent: options.overrideParent,
    requireAllTriggers: options.requireAllTriggers ?? false,
    metadata: options.metadata,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================================================
// Policy Management
// ============================================================================

/**
 * Merge a child policy with its parent (inheritance)
 */
export function mergeWithParentPolicy(
  childPolicy: ReviewPolicy,
  parentPolicy: ReviewPolicy
): ReviewPolicy {
  if (childPolicy.overrideParent) {
    return childPolicy;
  }

  // Merge triggers (child triggers take precedence for same IDs)
  const childTriggerIds = new Set(childPolicy.triggers.map(t => t.id));

  const mergedTriggers = [
    ...parentPolicy.triggers.filter(t => !childTriggerIds.has(t.id)),
    ...childPolicy.triggers,
  ];

  // Merge workflow types
  const mergedWorkflowTypes = [...new Set([
    ...parentPolicy.workflowTypes,
    ...childPolicy.workflowTypes,
  ])];

  return {
    ...childPolicy,
    triggers: mergedTriggers,
    workflowTypes: mergedWorkflowTypes,
    metadata: {
      ...parentPolicy.metadata,
      ...childPolicy.metadata,
      inheritedFrom: parentPolicy.id,
    },
  };
}

/**
 * Enable a policy
 */
export function enablePolicy(policy: ReviewPolicy): ReviewPolicy {
  return {
    ...policy,
    enabled: true,
    updatedAt: new Date(),
  };
}

/**
 * Disable a policy
 */
export function disablePolicy(policy: ReviewPolicy): ReviewPolicy {
  return {
    ...policy,
    enabled: false,
    updatedAt: new Date(),
  };
}

/**
 * Enable a trigger within a policy
 */
export function enableTriggerInPolicy(
  policy: ReviewPolicy,
  triggerId: string
): ReviewPolicy {
  return {
    ...policy,
    triggers: policy.triggers.map(t =>
      t.id === triggerId ? { ...t, enabled: true, updatedAt: new Date() } : t
    ),
    updatedAt: new Date(),
  };
}

/**
 * Disable a trigger within a policy
 */
export function disableTriggerInPolicy(
  policy: ReviewPolicy,
  triggerId: string
): ReviewPolicy {
  return {
    ...policy,
    triggers: policy.triggers.map(t =>
      t.id === triggerId ? { ...t, enabled: false, updatedAt: new Date() } : t
    ),
    updatedAt: new Date(),
  };
}

/**
 * Add a trigger to a policy
 */
export function addTriggerToPolicy(
  policy: ReviewPolicy,
  trigger: ReviewTrigger
): ReviewPolicy {
  return {
    ...policy,
    triggers: [...policy.triggers, trigger],
    updatedAt: new Date(),
  };
}

/**
 * Remove a trigger from a policy
 */
export function removeTriggerFromPolicy(
  policy: ReviewPolicy,
  triggerId: string
): ReviewPolicy {
  return {
    ...policy,
    triggers: policy.triggers.filter(t => t.id !== triggerId),
    updatedAt: new Date(),
  };
}

/**
 * Update policy priority
 */
export function updatePolicyPriority(
  policy: ReviewPolicy,
  priority: PolicyPriority
): ReviewPolicy {
  return {
    ...policy,
    priority,
    updatedAt: new Date(),
  };
}

/**
 * Sort policies by priority for evaluation
 */
export function sortPoliciesByPriority(policies: ReviewPolicy[]): ReviewPolicy[] {
  return [...policies].sort((a, b) => a.priority - b.priority);
}

/**
 * Filter policies applicable to a workflow type
 */
export function filterPoliciesForWorkflowType(
  policies: ReviewPolicy[],
  workflowType: string
): ReviewPolicy[] {
  return policies.filter(
    p => p.enabled && (p.workflowTypes.includes('*') || p.workflowTypes.includes(workflowType))
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a composite condition with AND logic
 */
export function andConditions(
  ...conditions: Array<TriggerCondition | CompoundCondition>
): CompoundCondition {
  return {
    operator: 'AND',
    conditions,
  };
}

/**
 * Create a composite condition with OR logic
 */
export function orConditions(
  ...conditions: Array<TriggerCondition | CompoundCondition>
): CompoundCondition {
  return {
    operator: 'OR',
    conditions,
  };
}

/**
 * Create a NOT condition
 */
export function notCondition(
  condition: TriggerCondition | CompoundCondition
): CompoundCondition {
  return {
    operator: 'NOT',
    conditions: [condition],
  };
}

/**
 * Create a simple field equals condition
 */
export function fieldEquals(field: string, value: unknown): TriggerCondition {
  return { field, operator: 'eq', value };
}

/**
 * Create a simple field greater than condition
 */
export function fieldGreaterThan(field: string, value: number): TriggerCondition {
  return { field, operator: 'gt', value };
}

/**
 * Create a simple field less than condition
 */
export function fieldLessThan(field: string, value: number): TriggerCondition {
  return { field, operator: 'lt', value };
}

/**
 * Create a field exists condition
 */
export function fieldExists(field: string, exists: boolean = true): TriggerCondition {
  return { field, operator: 'exists', value: exists };
}

/**
 * Create a field in array condition
 */
export function fieldInArray(field: string, values: unknown[]): TriggerCondition {
  return { field, operator: 'in', value: values };
}

/**
 * Create a field matches regex condition
 */
export function fieldMatches(
  field: string,
  pattern: string,
  caseSensitive: boolean = false
): TriggerCondition {
  return { field, operator: 'matches', value: pattern, caseSensitive };
}

// ============================================================================
// Pre-built Policy Templates
// ============================================================================

/**
 * Get a high-security policy template
 */
export function createHighSecurityPolicy(): ReviewPolicy {
  return createCustomPolicy({
    id: 'pol_high_security',
    name: 'High Security Policy',
    description: 'Strict review policy for sensitive workflows',
    workflowTypes: ['*'],
    priority: 1,
    requireAllTriggers: false,
    triggers: [
      createAmountThresholdTrigger(1000),
      createErrorRateTrigger(0.05),
      createSensitiveDataTrigger(),
      createFirstTimeWorkflowTrigger(),
      createExternalSystemFailureTrigger(),
      createConfidenceScoreTrigger(0.9),
      createAnomalyTrigger([
        'unusualTime',
        'unusualLocation',
        'unusualVolume',
        'unusualPattern',
      ]),
    ],
  });
}

/**
 * Get a standard policy template
 */
export function createStandardPolicy(): ReviewPolicy {
  return createCustomPolicy({
    id: 'pol_standard',
    name: 'Standard Policy',
    description: 'Balanced review policy for typical workflows',
    workflowTypes: ['*'],
    priority: 5,
    requireAllTriggers: false,
    triggers: [
      createAmountThresholdTrigger(10000),
      createErrorRateTrigger(0.1),
      createFirstTimeWorkflowTrigger(),
      createExternalSystemFailureTrigger(),
    ],
  });
}

/**
 * Get a minimal policy template
 */
export function createMinimalPolicy(): ReviewPolicy {
  return createCustomPolicy({
    id: 'pol_minimal',
    name: 'Minimal Policy',
    description: 'Light-touch review policy for low-risk workflows',
    workflowTypes: ['*'],
    priority: 8,
    requireAllTriggers: false,
    triggers: [
      createAmountThresholdTrigger(50000),
      createErrorRateTrigger(0.25),
      createCustomTrigger({
        name: 'Critical External Failure',
        type: 'external_system_failure',
        severity: 'critical',
        condition: andConditions(
          fieldEquals('externalSystems.hasFailure', true),
          fieldEquals('externalSystems.isCritical', true)
        ),
      }),
    ],
  });
}

// ============================================================================
// Export Default Policy Set
// ============================================================================

/**
 * Get default policy set for a new installation
 */
export function getDefaultPolicySet(): ReviewPolicy[] {
  return [
    createHighSecurityPolicy(),
    createDefaultPolicy('financial'),
    createDefaultPolicy('payment'),
    createDefaultPolicy('user_management'),
    createDefaultPolicy('ai_assisted'),
    createStandardPolicy(),
    createMinimalPolicy(),
    createGlobalFallbackPolicy(),
  ];
}

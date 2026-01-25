/**
 * Step Interceptor for HITL Workflow Approval
 * Intercepts workflow steps to determine if approval is required
 */

import type { WorkflowStep, ExecutionState, WorkflowStepConfig } from '../../types/workflow-execution';
import type { Priority, RequestType } from './hitl-types';
import { PRIORITY, REQUEST_TYPE } from './hitl-types';

// ========================================
// Types
// ========================================

/**
 * Requirements for approval on a specific step
 */
export interface ApprovalRequirements {
  /** Whether approval is required */
  required: boolean;
  /** List of user IDs or roles that can approve */
  reviewers?: string[];
  /** Minimum number of approvers needed */
  approverCount?: number;
  /** Timeout in milliseconds for approval */
  timeout?: number;
  /** Rules that can auto-approve the step */
  autoApproveRules?: AutoApproveRule[];
  /** Priority for the approval request */
  priority?: Priority;
  /** Type of approval request */
  requestType?: RequestType;
  /** Reason this step requires approval */
  reason?: string;
  /** Custom validation function name */
  customValidator?: string;
}

/**
 * Rule for automatic approval
 */
export interface AutoApproveRule {
  id: string;
  name: string;
  field: string;
  operator: 'less_than' | 'greater_than' | 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in_list' | 'not_in_list' | 'matches_regex';
  value: unknown;
  description?: string;
}

/**
 * Context available during step execution
 */
export interface ExecutionContext {
  /** Current execution state */
  execution: ExecutionState;
  /** User context */
  userId?: string;
  /** User roles */
  userRoles?: string[];
  /** Organization ID */
  organizationId?: string;
  /** Previous step outputs */
  previousOutputs: Record<string, unknown>;
  /** Global workflow variables */
  variables: Record<string, unknown>;
  /** Environmental flags */
  environment?: 'development' | 'staging' | 'production';
  /** Trust level of the requester */
  trustLevel?: 'low' | 'medium' | 'high' | 'admin';
}

/**
 * Result of step interception
 */
export const INTERCEPT_RESULT = {
  PROCEED: 'proceed',
  AWAIT_APPROVAL: 'await_approval',
  AUTO_APPROVED: 'auto_approved',
  AUTO_REJECTED: 'auto_rejected',
} as const;

export type InterceptResult = (typeof INTERCEPT_RESULT)[keyof typeof INTERCEPT_RESULT];

/**
 * Detailed result of interception with metadata
 */
export interface InterceptResultDetails {
  result: InterceptResult;
  reason: string;
  requirements?: ApprovalRequirements;
  matchedRules?: AutoApproveRule[];
  rejectionReason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Step type configuration for approval requirements
 */
export interface StepTypeConfig {
  /** Types that always require approval */
  alwaysRequireApproval: string[];
  /** Types that never require approval */
  neverRequireApproval: string[];
  /** Conditional requirements by type */
  conditionalRequirements: Map<string, (step: WorkflowStep, context: ExecutionContext) => boolean>;
}

// ========================================
// Default Configuration
// ========================================

const DEFAULT_STEP_TYPE_CONFIG: StepTypeConfig = {
  alwaysRequireApproval: ['user_confirmation', 'payment', 'delete', 'bulk_operation'],
  neverRequireApproval: ['notification', 'log', 'wait'],
  conditionalRequirements: new Map([
    ['api_call', (_step: WorkflowStep, _context: ExecutionContext) => {
      // Silence unused variable warnings
      void _step;
      void _context;
      // API calls to external services may require approval
      return false;
    }],
    ['ai_reasoning', (_step: WorkflowStep, _context: ExecutionContext) => {
      // Silence unused variable warnings
      void _step;
      void _context;
      // AI decisions above certain confidence threshold don't need approval
      return false;
    }],
  ]),
};

/**
 * Keywords in step names/descriptions that trigger approval
 */
const APPROVAL_TRIGGER_KEYWORDS = [
  'payment', 'transfer', 'send_money', 'delete', 'remove', 'destroy',
  'publish', 'deploy', 'production', 'external', 'third_party',
  'sensitive', 'pii', 'confidential', 'bulk', 'mass', 'all_records',
  'override', 'bypass', 'force', 'admin', 'privileged',
];

/**
 * Thresholds that trigger approval requirements
 */
const APPROVAL_THRESHOLDS = {
  maxRecordsWithoutApproval: 50,
  maxAmountWithoutApproval: 100, // USD
  minConfidenceWithoutApproval: 0.85,
  maxApiCallsPerMinute: 100,
};

// ========================================
// StepInterceptor Class
// ========================================

/**
 * Intercepts workflow steps to check if approval is required
 */
export class StepInterceptor {
  private stepTypeConfig: StepTypeConfig;
  private customRules: Map<string, (step: WorkflowStep, context: ExecutionContext) => boolean>;
  private approvalTriggers: Set<string>;
  private thresholds: typeof APPROVAL_THRESHOLDS;

  constructor(options?: {
    stepTypeConfig?: Partial<StepTypeConfig>;
    approvalTriggers?: string[];
    thresholds?: Partial<typeof APPROVAL_THRESHOLDS>;
  }) {
    this.stepTypeConfig = {
      ...DEFAULT_STEP_TYPE_CONFIG,
      ...options?.stepTypeConfig,
      conditionalRequirements: new Map([
        ...DEFAULT_STEP_TYPE_CONFIG.conditionalRequirements,
        ...(options?.stepTypeConfig?.conditionalRequirements ?? new Map()),
      ]),
    };
    this.customRules = new Map();
    this.approvalTriggers = new Set([
      ...APPROVAL_TRIGGER_KEYWORDS,
      ...(options?.approvalTriggers ?? []),
    ]);
    this.thresholds = {
      ...APPROVAL_THRESHOLDS,
      ...options?.thresholds,
    };
  }

  /**
   * Determine if a step requires approval
   */
  shouldRequireApproval(step: WorkflowStep, context: ExecutionContext): boolean {
    // Check if step type always requires approval
    if (this.stepTypeConfig.alwaysRequireApproval.includes(step.type)) {
      return true;
    }

    // Check if step type never requires approval
    if (this.stepTypeConfig.neverRequireApproval.includes(step.type)) {
      return false;
    }

    // Check conditional requirements for step type
    const conditionalCheck = this.stepTypeConfig.conditionalRequirements.get(step.type);
    if (conditionalCheck && conditionalCheck(step, context)) {
      return true;
    }

    // Check for trigger keywords in step name and description
    const stepText = `${step.name} ${step.description}`.toLowerCase();
    for (const trigger of this.approvalTriggers) {
      if (stepText.includes(trigger.toLowerCase())) {
        return true;
      }
    }

    // Check step configuration for explicit approval requirement
    if (this.stepConfigRequiresApproval(step.config)) {
      return true;
    }

    // Check threshold-based conditions
    if (this.exceedsThresholds(step, context)) {
      return true;
    }

    // Check custom rules
    for (const [_ruleName, ruleCheck] of this.customRules) {
      if (ruleCheck(step, context)) {
        return true;
      }
    }

    // Check environment - production may require more approvals
    if (context.environment === 'production' && this.isHighRiskStep(step)) {
      return true;
    }

    // Check trust level - low trust requires more approvals
    if (context.trustLevel === 'low' && !this.isTrivialStep(step)) {
      return true;
    }

    return false;
  }

  /**
   * Get detailed approval requirements for a step
   */
  getApprovalRequirements(
    step: WorkflowStep,
    context?: ExecutionContext
  ): ApprovalRequirements {
    const requirements: ApprovalRequirements = {
      required: false,
    };

    // First determine if approval is required
    if (context && this.shouldRequireApproval(step, context)) {
      requirements.required = true;
    }

    // Extract requirements from step configuration
    const config = step.config as WorkflowStepConfig & {
      approvalRequired?: boolean;
      approvalConfig?: {
        reviewers?: string[];
        approverCount?: number;
        timeout?: number;
        autoApproveRules?: AutoApproveRule[];
        priority?: Priority;
        requestType?: RequestType;
        reason?: string;
      };
    };

    if (config.approvalRequired !== undefined) {
      requirements.required = config.approvalRequired;
    }

    if (config.approvalConfig) {
      Object.assign(requirements, config.approvalConfig);
    }

    // Infer priority based on step characteristics
    if (!requirements.priority) {
      requirements.priority = this.inferPriority(step, context);
    }

    // Infer request type based on step type
    if (!requirements.requestType) {
      requirements.requestType = this.inferRequestType(step);
    }

    // Generate reason if not provided
    if (!requirements.reason && requirements.required) {
      requirements.reason = this.generateApprovalReason(step, context);
    }

    // Set default timeout based on priority
    if (!requirements.timeout && requirements.priority) {
      requirements.timeout = this.getDefaultTimeout(requirements.priority);
    }

    // Set default approver count
    if (!requirements.approverCount && requirements.required) {
      requirements.approverCount = 1;
    }

    return requirements;
  }

  /**
   * Intercept a step and determine the result
   */
  async interceptStep(
    step: WorkflowStep,
    context: ExecutionContext
  ): Promise<InterceptResultDetails> {
    // Get approval requirements
    const requirements = this.getApprovalRequirements(step, context);

    // If no approval required, proceed
    if (!requirements.required) {
      return {
        result: INTERCEPT_RESULT.PROCEED,
        reason: 'No approval required for this step',
      };
    }

    // Check auto-approve rules
    const autoApproveResult = this.evaluateAutoApproveRules(
      step,
      context,
      requirements.autoApproveRules ?? []
    );

    if (autoApproveResult.approved) {
      return {
        result: INTERCEPT_RESULT.AUTO_APPROVED,
        reason: 'Auto-approved based on matching rules',
        requirements,
        matchedRules: autoApproveResult.matchedRules,
        metadata: {
          autoApproveReason: autoApproveResult.reason,
        },
      };
    }

    // Check for auto-reject conditions
    const autoRejectResult = this.checkAutoRejectConditions(step, context);
    if (autoRejectResult.rejected) {
      return {
        result: INTERCEPT_RESULT.AUTO_REJECTED,
        reason: 'Auto-rejected based on policy',
        requirements,
        rejectionReason: autoRejectResult.reason,
        metadata: {
          autoRejectPolicy: autoRejectResult.policy,
        },
      };
    }

    // Approval is required and no auto-approval/rejection applies
    return {
      result: INTERCEPT_RESULT.AWAIT_APPROVAL,
      reason: requirements.reason ?? 'Manual approval required',
      requirements,
    };
  }

  /**
   * Add a custom approval rule
   */
  addCustomRule(
    ruleName: string,
    ruleCheck: (step: WorkflowStep, context: ExecutionContext) => boolean
  ): void {
    this.customRules.set(ruleName, ruleCheck);
  }

  /**
   * Remove a custom rule
   */
  removeCustomRule(ruleName: string): void {
    this.customRules.delete(ruleName);
  }

  /**
   * Add approval trigger keywords
   */
  addApprovalTriggers(triggers: string[]): void {
    for (const trigger of triggers) {
      this.approvalTriggers.add(trigger.toLowerCase());
    }
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds: Partial<typeof APPROVAL_THRESHOLDS>): void {
    this.thresholds = {
      ...this.thresholds,
      ...newThresholds,
    };
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private stepConfigRequiresApproval(config: WorkflowStepConfig): boolean {
    const extendedConfig = config as WorkflowStepConfig & {
      approvalRequired?: boolean;
      requiresApproval?: boolean;
      humanReview?: boolean;
    };

    return !!(
      extendedConfig.approvalRequired ||
      extendedConfig.requiresApproval ||
      extendedConfig.humanReview
    );
  }

  private exceedsThresholds(step: WorkflowStep, context: ExecutionContext): boolean {
    const config = step.config as WorkflowStepConfig & {
      recordCount?: number;
      amount?: number;
      confidence?: number;
    };

    // Check record count threshold
    if (config.recordCount && config.recordCount > this.thresholds.maxRecordsWithoutApproval) {
      return true;
    }

    // Check amount threshold
    if (config.amount && config.amount > this.thresholds.maxAmountWithoutApproval) {
      return true;
    }

    // Check confidence threshold (for AI steps)
    if (config.confidence && config.confidence < this.thresholds.minConfidenceWithoutApproval) {
      return true;
    }

    // Check previous outputs for accumulated values
    const totalAmount = this.getAccumulatedAmount(context.previousOutputs);
    if (totalAmount > this.thresholds.maxAmountWithoutApproval) {
      return true;
    }

    return false;
  }

  private getAccumulatedAmount(outputs: Record<string, unknown>): number {
    let total = 0;
    for (const key of Object.keys(outputs)) {
      const output = outputs[key];
      if (typeof output === 'object' && output !== null) {
        const outputObj = output as Record<string, unknown>;
        if (typeof outputObj.amount === 'number') {
          total += outputObj.amount;
        }
        if (typeof outputObj.totalAmount === 'number') {
          total += outputObj.totalAmount;
        }
      }
    }
    return total;
  }

  private isHighRiskStep(step: WorkflowStep): boolean {
    const highRiskTypes = ['api_call', 'data_transform', 'condition'];
    const highRiskKeywords = ['delete', 'update', 'write', 'send', 'publish'];

    if (highRiskTypes.includes(step.type)) {
      return true;
    }

    const stepText = `${step.name} ${step.description}`.toLowerCase();
    return highRiskKeywords.some(keyword => stepText.includes(keyword));
  }

  private isTrivialStep(step: WorkflowStep): boolean {
    const trivialTypes = ['notification', 'log', 'wait'];
    return trivialTypes.includes(step.type);
  }

  private inferPriority(step: WorkflowStep, context?: ExecutionContext): Priority {
    // Production environment = higher priority
    if (context?.environment === 'production') {
      return PRIORITY.HIGH;
    }

    // High-risk step types
    if (step.type === 'user_confirmation' || this.isHighRiskStep(step)) {
      return PRIORITY.HIGH;
    }

    // Check for urgency keywords
    const stepText = `${step.name} ${step.description}`.toLowerCase();
    if (stepText.includes('urgent') || stepText.includes('critical')) {
      return PRIORITY.CRITICAL;
    }

    return PRIORITY.MEDIUM;
  }

  private inferRequestType(step: WorkflowStep): RequestType {
    switch (step.type) {
      case 'ai_reasoning':
        return REQUEST_TYPE.DATA_VALIDATION;
      case 'user_confirmation':
        return REQUEST_TYPE.EXTERNAL_APPROVAL;
      case 'data_transform':
        return REQUEST_TYPE.DATA_VALIDATION;
      case 'condition':
        return REQUEST_TYPE.EXCEPTION_HANDLING;
      default:
        return REQUEST_TYPE.CONTENT_REVIEW;
    }
  }

  private generateApprovalReason(step: WorkflowStep, context?: ExecutionContext): string {
    const reasons: string[] = [];

    if (this.stepTypeConfig.alwaysRequireApproval.includes(step.type)) {
      reasons.push(`Step type "${step.type}" always requires approval`);
    }

    const stepText = `${step.name} ${step.description}`.toLowerCase();
    const matchedTriggers = Array.from(this.approvalTriggers).filter(
      trigger => stepText.includes(trigger.toLowerCase())
    );
    if (matchedTriggers.length > 0) {
      reasons.push(`Contains sensitive keywords: ${matchedTriggers.join(', ')}`);
    }

    if (context?.environment === 'production') {
      reasons.push('Production environment requires additional approval');
    }

    if (context?.trustLevel === 'low') {
      reasons.push('Requester trust level requires approval');
    }

    return reasons.length > 0
      ? reasons.join('; ')
      : 'Manual review required for this step';
  }

  private getDefaultTimeout(priority: Priority): number {
    const timeouts: Record<Priority, number> = {
      [PRIORITY.CRITICAL]: 60 * 60 * 1000, // 1 hour
      [PRIORITY.HIGH]: 4 * 60 * 60 * 1000, // 4 hours
      [PRIORITY.MEDIUM]: 24 * 60 * 60 * 1000, // 24 hours
      [PRIORITY.LOW]: 72 * 60 * 60 * 1000, // 72 hours
    };
    return timeouts[priority];
  }

  private evaluateAutoApproveRules(
    step: WorkflowStep,
    context: ExecutionContext,
    rules: AutoApproveRule[]
  ): { approved: boolean; matchedRules: AutoApproveRule[]; reason?: string } {
    const matchedRules: AutoApproveRule[] = [];

    for (const rule of rules) {
      if (this.evaluateRule(rule, step, context)) {
        matchedRules.push(rule);
      }
    }

    // All rules must match for auto-approval
    if (rules.length > 0 && matchedRules.length === rules.length) {
      return {
        approved: true,
        matchedRules,
        reason: `All ${rules.length} auto-approve rules matched`,
      };
    }

    return { approved: false, matchedRules };
  }

  private evaluateRule(
    rule: AutoApproveRule,
    step: WorkflowStep,
    context: ExecutionContext
  ): boolean {
    // Get the value to check from step config, context, or previous outputs
    const value = this.getFieldValue(rule.field, step, context);

    switch (rule.operator) {
      case 'less_than':
        return typeof value === 'number' && value < (rule.value as number);
      case 'greater_than':
        return typeof value === 'number' && value > (rule.value as number);
      case 'equals':
        return value === rule.value;
      case 'not_equals':
        return value !== rule.value;
      case 'contains':
        return typeof value === 'string' && value.includes(rule.value as string);
      case 'not_contains':
        return typeof value === 'string' && !value.includes(rule.value as string);
      case 'in_list':
        return Array.isArray(rule.value) && rule.value.includes(value);
      case 'not_in_list':
        return Array.isArray(rule.value) && !rule.value.includes(value);
      case 'matches_regex':
        return typeof value === 'string' && new RegExp(rule.value as string).test(value);
      default:
        return false;
    }
  }

  private getFieldValue(
    field: string,
    step: WorkflowStep,
    context: ExecutionContext
  ): unknown {
    // Check step config first
    const configValue = (step.config as Record<string, unknown>)[field];
    if (configValue !== undefined) {
      return configValue;
    }

    // Check context variables
    const contextValue = context.variables[field];
    if (contextValue !== undefined) {
      return contextValue;
    }

    // Check previous outputs
    for (const key of Object.keys(context.previousOutputs)) {
      const output = context.previousOutputs[key] as Record<string, unknown>;
      if (output && output[field] !== undefined) {
        return output[field];
      }
    }

    // Check special fields
    switch (field) {
      case 'userId':
        return context.userId;
      case 'environment':
        return context.environment;
      case 'trustLevel':
        return context.trustLevel;
      case 'stepType':
        return step.type;
      case 'stepName':
        return step.name;
      default:
        return undefined;
    }
  }

  private checkAutoRejectConditions(
    step: WorkflowStep,
    context: ExecutionContext
  ): { rejected: boolean; reason?: string; policy?: string } {
    // Reject if trying to execute privileged action without admin trust level
    const stepText = `${step.name} ${step.description}`.toLowerCase();
    if (
      (stepText.includes('admin') || stepText.includes('privileged')) &&
      context.trustLevel !== 'admin'
    ) {
      return {
        rejected: true,
        reason: 'Privileged action requires admin trust level',
        policy: 'privilege_escalation',
      };
    }

    // Reject if exceeding extreme thresholds
    const config = step.config as WorkflowStepConfig & { amount?: number; recordCount?: number };
    if (config.amount && config.amount > this.thresholds.maxAmountWithoutApproval * 100) {
      return {
        rejected: true,
        reason: 'Amount exceeds maximum allowed limit',
        policy: 'amount_limit',
      };
    }

    if (config.recordCount && config.recordCount > this.thresholds.maxRecordsWithoutApproval * 100) {
      return {
        rejected: true,
        reason: 'Record count exceeds maximum allowed limit',
        policy: 'record_limit',
      };
    }

    return { rejected: false };
  }
}

/**
 * Create a new StepInterceptor instance
 */
export function createStepInterceptor(options?: {
  stepTypeConfig?: Partial<StepTypeConfig>;
  approvalTriggers?: string[];
  thresholds?: Partial<typeof APPROVAL_THRESHOLDS>;
}): StepInterceptor {
  return new StepInterceptor(options);
}

/**
 * Default singleton instance
 */
export const stepInterceptor = new StepInterceptor();

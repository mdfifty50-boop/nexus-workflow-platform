/**
 * Auto-Approval Rules Engine
 * Evaluates rules to automatically approve or reject requests based on defined criteria
 */

import type { ApprovalRequest, Priority } from './hitl-types';
import { PRIORITY } from './hitl-types';

// ========================================
// Types
// ========================================

/**
 * Operators supported for rule conditions
 */
export const RULE_OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  LESS_THAN: 'less_than',
  LESS_THAN_OR_EQUALS: 'less_than_or_equals',
  GREATER_THAN: 'greater_than',
  GREATER_THAN_OR_EQUALS: 'greater_than_or_equals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with',
  IN_LIST: 'in_list',
  NOT_IN_LIST: 'not_in_list',
  MATCHES_REGEX: 'matches_regex',
  IS_EMPTY: 'is_empty',
  IS_NOT_EMPTY: 'is_not_empty',
  IS_TRUE: 'is_true',
  IS_FALSE: 'is_false',
} as const;

export type RuleOperator = (typeof RULE_OPERATORS)[keyof typeof RULE_OPERATORS];

/**
 * Action to take when rule matches
 */
export const RULE_ACTIONS = {
  AUTO_APPROVE: 'auto_approve',
  AUTO_REJECT: 'auto_reject',
  ESCALATE: 'escalate',
  ASSIGN_TO: 'assign_to',
  SET_PRIORITY: 'set_priority',
  ADD_REVIEWER: 'add_reviewer',
} as const;

export type RuleAction = (typeof RULE_ACTIONS)[keyof typeof RULE_ACTIONS];

/**
 * Single condition in a rule
 */
export interface RuleCondition {
  /** Field path to evaluate (supports dot notation for nested fields) */
  field: string;
  /** Comparison operator */
  operator: RuleOperator;
  /** Value to compare against */
  value?: unknown;
  /** Whether this is a required condition */
  required?: boolean;
}

/**
 * Action configuration for when a rule matches
 */
export interface RuleActionConfig {
  action: RuleAction;
  /** For ASSIGN_TO action */
  assignee?: string;
  /** For SET_PRIORITY action */
  priority?: Priority;
  /** For ADD_REVIEWER action */
  reviewers?: string[];
  /** For ESCALATE action */
  escalateTo?: string;
  /** Comment to add to the request */
  comment?: string;
}

/**
 * Auto-approval rule definition
 */
export interface AutoApprovalRule {
  /** Unique identifier for the rule */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this rule does */
  description?: string;
  /** Conditions that must ALL be met for the rule to apply */
  conditions: RuleCondition[];
  /** Action to take when all conditions are met */
  action: RuleActionConfig;
  /** Whether the rule is currently active */
  enabled: boolean;
  /** Priority order for rule evaluation (lower = evaluated first) */
  order?: number;
  /** Tags for categorization */
  tags?: string[];
  /** Date when the rule was created */
  createdAt?: string;
  /** Date when the rule was last updated */
  updatedAt?: string;
  /** User who created the rule */
  createdBy?: string;
}

/**
 * Result of evaluating a rule
 */
export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  matchedConditions: number;
  totalConditions: number;
  failedConditions: RuleCondition[];
  action?: RuleActionConfig;
  evaluationTime: number;
}

/**
 * Overall evaluation result for a request
 */
export interface EvaluationResult {
  requestId: string;
  evaluated: boolean;
  matchedRule?: AutoApprovalRule;
  action?: RuleActionConfig;
  evaluationResults: RuleEvaluationResult[];
  finalDecision: 'auto_approved' | 'auto_rejected' | 'escalated' | 'manual_review_required';
  reason: string;
  evaluatedAt: string;
  totalEvaluationTime: number;
}

// ========================================
// Built-in Rules
// ========================================

/**
 * Built-in rule: Auto-approve low-risk requests
 */
export const lowRiskAutoApprove: AutoApprovalRule = {
  id: 'builtin_low_risk_auto_approve',
  name: 'Low Risk Auto-Approve',
  description: 'Automatically approve requests marked as low risk with low priority',
  conditions: [
    {
      field: 'metadata.customFields.riskLevel',
      operator: RULE_OPERATORS.EQUALS,
      value: 'low',
    },
    {
      field: 'priority',
      operator: RULE_OPERATORS.EQUALS,
      value: PRIORITY.LOW,
    },
  ],
  action: {
    action: RULE_ACTIONS.AUTO_APPROVE,
    comment: 'Auto-approved: Low risk and low priority request',
  },
  enabled: true,
  order: 100,
  tags: ['builtin', 'risk-based'],
};

/**
 * Built-in rule: Auto-approve for trusted users
 */
export const trustedUserAutoApprove: AutoApprovalRule = {
  id: 'builtin_trusted_user_auto_approve',
  name: 'Trusted User Auto-Approve',
  description: 'Automatically approve requests from users with admin or high trust level',
  conditions: [
    {
      field: 'metadata.customFields.trustLevel',
      operator: RULE_OPERATORS.IN_LIST,
      value: ['admin', 'high'],
    },
  ],
  action: {
    action: RULE_ACTIONS.AUTO_APPROVE,
    comment: 'Auto-approved: Request from trusted user',
  },
  enabled: true,
  order: 50,
  tags: ['builtin', 'trust-based'],
};

/**
 * Built-in rule: Auto-approve within budget
 */
export const withinBudgetAutoApprove: AutoApprovalRule = {
  id: 'builtin_within_budget_auto_approve',
  name: 'Within Budget Auto-Approve',
  description: 'Automatically approve requests with estimated cost under $100',
  conditions: [
    {
      field: 'metadata.customFields.estimatedImpact.estimatedCost',
      operator: RULE_OPERATORS.LESS_THAN,
      value: 100,
    },
    {
      field: 'metadata.customFields.estimatedImpact.reversible',
      operator: RULE_OPERATORS.IS_TRUE,
    },
  ],
  action: {
    action: RULE_ACTIONS.AUTO_APPROVE,
    comment: 'Auto-approved: Within budget threshold and reversible',
  },
  enabled: true,
  order: 75,
  tags: ['builtin', 'budget-based'],
};

/**
 * Built-in rule: Escalate high-value requests
 */
export const highValueEscalate: AutoApprovalRule = {
  id: 'builtin_high_value_escalate',
  name: 'High Value Escalation',
  description: 'Escalate requests with estimated cost over $1000 to management',
  conditions: [
    {
      field: 'metadata.customFields.estimatedImpact.estimatedCost',
      operator: RULE_OPERATORS.GREATER_THAN_OR_EQUALS,
      value: 1000,
    },
  ],
  action: {
    action: RULE_ACTIONS.ESCALATE,
    escalateTo: 'management',
    comment: 'Escalated: High value request requires management approval',
  },
  enabled: true,
  order: 25,
  tags: ['builtin', 'escalation'],
};

/**
 * Built-in rule: Auto-reject destructive non-reversible actions
 */
export const destructiveAutoReject: AutoApprovalRule = {
  id: 'builtin_destructive_auto_reject',
  name: 'Destructive Action Auto-Reject',
  description: 'Automatically reject non-reversible destructive actions affecting many records',
  conditions: [
    {
      field: 'metadata.customFields.estimatedImpact.reversible',
      operator: RULE_OPERATORS.IS_FALSE,
    },
    {
      field: 'metadata.customFields.estimatedImpact.affectedRecords',
      operator: RULE_OPERATORS.GREATER_THAN,
      value: 1000,
    },
  ],
  action: {
    action: RULE_ACTIONS.AUTO_REJECT,
    comment: 'Auto-rejected: Non-reversible action affecting too many records. Requires manual review through admin portal.',
  },
  enabled: true,
  order: 10,
  tags: ['builtin', 'safety'],
};

/**
 * All built-in rules
 */
export const BUILT_IN_RULES: AutoApprovalRule[] = [
  lowRiskAutoApprove,
  trustedUserAutoApprove,
  withinBudgetAutoApprove,
  highValueEscalate,
  destructiveAutoReject,
];

// ========================================
// AutoApprovalEngine Class
// ========================================

/**
 * Engine for evaluating auto-approval rules
 */
export class AutoApprovalEngine {
  private rules: Map<string, AutoApprovalRule>;
  private ruleOrder: string[];

  constructor(options?: {
    includeBuiltInRules?: boolean;
    customRules?: AutoApprovalRule[];
  }) {
    this.rules = new Map();
    this.ruleOrder = [];

    // Add built-in rules if requested (default: true)
    if (options?.includeBuiltInRules !== false) {
      for (const rule of BUILT_IN_RULES) {
        this.addRule(rule);
      }
    }

    // Add custom rules if provided
    if (options?.customRules) {
      for (const rule of options.customRules) {
        this.addRule(rule);
      }
    }
  }

  /**
   * Evaluate all rules against a request
   */
  evaluateRules(request: ApprovalRequest): EvaluationResult {
    const startTime = Date.now();
    const evaluationResults: RuleEvaluationResult[] = [];
    let matchedRule: AutoApprovalRule | undefined;
    let finalAction: RuleActionConfig | undefined;

    // Evaluate rules in order
    for (const ruleId of this.ruleOrder) {
      const rule = this.rules.get(ruleId);
      if (!rule || !rule.enabled) continue;

      const evalStart = Date.now();
      const result = this.evaluateSingleRule(rule, request);
      result.evaluationTime = Date.now() - evalStart;

      evaluationResults.push(result);

      // If rule matched, capture it and stop evaluation
      if (result.matched) {
        matchedRule = rule;
        finalAction = rule.action;
        break;
      }
    }

    // Determine final decision
    let finalDecision: EvaluationResult['finalDecision'];
    let reason: string;

    if (matchedRule && finalAction) {
      switch (finalAction.action) {
        case RULE_ACTIONS.AUTO_APPROVE:
          finalDecision = 'auto_approved';
          reason = finalAction.comment ?? `Auto-approved by rule: ${matchedRule.name}`;
          break;
        case RULE_ACTIONS.AUTO_REJECT:
          finalDecision = 'auto_rejected';
          reason = finalAction.comment ?? `Auto-rejected by rule: ${matchedRule.name}`;
          break;
        case RULE_ACTIONS.ESCALATE:
          finalDecision = 'escalated';
          reason = finalAction.comment ?? `Escalated by rule: ${matchedRule.name}`;
          break;
        default:
          finalDecision = 'manual_review_required';
          reason = 'Rule matched but requires manual review';
      }
    } else {
      finalDecision = 'manual_review_required';
      reason = 'No matching auto-approval rules found';
    }

    return {
      requestId: request.id,
      evaluated: true,
      matchedRule,
      action: finalAction,
      evaluationResults,
      finalDecision,
      reason,
      evaluatedAt: new Date().toISOString(),
      totalEvaluationTime: Date.now() - startTime,
    };
  }

  /**
   * Add a new rule
   */
  addRule(rule: AutoApprovalRule): void {
    // Update timestamps
    const now = new Date().toISOString();
    if (!rule.createdAt) {
      rule.createdAt = now;
    }
    rule.updatedAt = now;

    this.rules.set(rule.id, rule);
    this.rebuildRuleOrder();
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      this.rebuildRuleOrder();
    }
    return deleted;
  }

  /**
   * Get all rules
   */
  getRules(): AutoApprovalRule[] {
    return this.ruleOrder.map(id => this.rules.get(id)!);
  }

  /**
   * Get a specific rule
   */
  getRule(ruleId: string): AutoApprovalRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Update an existing rule
   */
  updateRule(ruleId: string, updates: Partial<AutoApprovalRule>): boolean {
    const existing = this.rules.get(ruleId);
    if (!existing) return false;

    const updated: AutoApprovalRule = {
      ...existing,
      ...updates,
      id: ruleId, // Prevent ID change
      updatedAt: new Date().toISOString(),
    };

    this.rules.set(ruleId, updated);
    this.rebuildRuleOrder();
    return true;
  }

  /**
   * Enable or disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    rule.enabled = enabled;
    rule.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Get rules by tag
   */
  getRulesByTag(tag: string): AutoApprovalRule[] {
    return this.getRules().filter(rule =>
      rule.tags?.includes(tag)
    );
  }

  /**
   * Validate a rule definition
   */
  validateRule(rule: AutoApprovalRule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.id || rule.id.trim() === '') {
      errors.push('Rule ID is required');
    }

    if (!rule.name || rule.name.trim() === '') {
      errors.push('Rule name is required');
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push('At least one condition is required');
    } else {
      for (let i = 0; i < rule.conditions.length; i++) {
        const condition = rule.conditions[i];
        if (!condition.field || condition.field.trim() === '') {
          errors.push(`Condition ${i + 1}: field is required`);
        }
        if (!condition.operator) {
          errors.push(`Condition ${i + 1}: operator is required`);
        }
        // Value is not required for IS_EMPTY, IS_NOT_EMPTY, IS_TRUE, IS_FALSE
        const noValueOperators: RuleOperator[] = [
          RULE_OPERATORS.IS_EMPTY,
          RULE_OPERATORS.IS_NOT_EMPTY,
          RULE_OPERATORS.IS_TRUE,
          RULE_OPERATORS.IS_FALSE,
        ];
        if (!noValueOperators.includes(condition.operator) && condition.value === undefined) {
          errors.push(`Condition ${i + 1}: value is required for operator ${condition.operator}`);
        }
      }
    }

    if (!rule.action || !rule.action.action) {
      errors.push('Rule action is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export rules to JSON
   */
  exportRules(): string {
    return JSON.stringify(this.getRules(), null, 2);
  }

  /**
   * Import rules from JSON
   */
  importRules(json: string, replace: boolean = false): { imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const rules = JSON.parse(json) as AutoApprovalRule[];

      if (replace) {
        // Clear existing non-builtin rules
        for (const ruleId of Array.from(this.rules.keys())) {
          if (!ruleId.startsWith('builtin_')) {
            this.rules.delete(ruleId);
          }
        }
      }

      for (const rule of rules) {
        const validation = this.validateRule(rule);
        if (validation.valid) {
          this.addRule(rule);
          imported++;
        } else {
          errors.push(`Rule "${rule.id || 'unknown'}": ${validation.errors.join(', ')}`);
        }
      }

      this.rebuildRuleOrder();
    } catch (error) {
      errors.push(`JSON parse error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { imported, errors };
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private rebuildRuleOrder(): void {
    const rulesArray = Array.from(this.rules.values());
    rulesArray.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
    this.ruleOrder = rulesArray.map(r => r.id);
  }

  private evaluateSingleRule(
    rule: AutoApprovalRule,
    request: ApprovalRequest
  ): RuleEvaluationResult {
    const failedConditions: RuleCondition[] = [];
    let matchedCount = 0;

    for (const condition of rule.conditions) {
      const fieldValue = this.getFieldValue(condition.field, request);
      const conditionMet = this.evaluateCondition(condition, fieldValue);

      if (conditionMet) {
        matchedCount++;
      } else {
        failedConditions.push(condition);
      }
    }

    const allConditionsMet = failedConditions.length === 0;

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched: allConditionsMet,
      matchedConditions: matchedCount,
      totalConditions: rule.conditions.length,
      failedConditions,
      action: allConditionsMet ? rule.action : undefined,
      evaluationTime: 0, // Set by caller
    };
  }

  private getFieldValue(field: string, request: ApprovalRequest): unknown {
    const parts = field.split('.');
    let current: unknown = request;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private evaluateCondition(condition: RuleCondition, value: unknown): boolean {
    const { operator, value: targetValue } = condition;

    switch (operator) {
      case RULE_OPERATORS.EQUALS:
        return value === targetValue;

      case RULE_OPERATORS.NOT_EQUALS:
        return value !== targetValue;

      case RULE_OPERATORS.LESS_THAN:
        return typeof value === 'number' && value < (targetValue as number);

      case RULE_OPERATORS.LESS_THAN_OR_EQUALS:
        return typeof value === 'number' && value <= (targetValue as number);

      case RULE_OPERATORS.GREATER_THAN:
        return typeof value === 'number' && value > (targetValue as number);

      case RULE_OPERATORS.GREATER_THAN_OR_EQUALS:
        return typeof value === 'number' && value >= (targetValue as number);

      case RULE_OPERATORS.CONTAINS:
        return typeof value === 'string' && value.includes(targetValue as string);

      case RULE_OPERATORS.NOT_CONTAINS:
        return typeof value === 'string' && !value.includes(targetValue as string);

      case RULE_OPERATORS.STARTS_WITH:
        return typeof value === 'string' && value.startsWith(targetValue as string);

      case RULE_OPERATORS.ENDS_WITH:
        return typeof value === 'string' && value.endsWith(targetValue as string);

      case RULE_OPERATORS.IN_LIST:
        return Array.isArray(targetValue) && targetValue.includes(value);

      case RULE_OPERATORS.NOT_IN_LIST:
        return Array.isArray(targetValue) && !targetValue.includes(value);

      case RULE_OPERATORS.MATCHES_REGEX:
        return typeof value === 'string' && new RegExp(targetValue as string).test(value);

      case RULE_OPERATORS.IS_EMPTY:
        return value === null || value === undefined || value === '' ||
          (Array.isArray(value) && value.length === 0);

      case RULE_OPERATORS.IS_NOT_EMPTY:
        return value !== null && value !== undefined && value !== '' &&
          !(Array.isArray(value) && value.length === 0);

      case RULE_OPERATORS.IS_TRUE:
        return value === true;

      case RULE_OPERATORS.IS_FALSE:
        return value === false;

      default:
        return false;
    }
  }
}

/**
 * Create a new AutoApprovalEngine instance
 */
export function createAutoApprovalEngine(options?: {
  includeBuiltInRules?: boolean;
  customRules?: AutoApprovalRule[];
}): AutoApprovalEngine {
  return new AutoApprovalEngine(options);
}

/**
 * Default singleton instance
 */
export const autoApprovalEngine = new AutoApprovalEngine();

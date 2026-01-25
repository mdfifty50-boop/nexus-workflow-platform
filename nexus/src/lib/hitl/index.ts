/**
 * Human-in-the-Loop (HITL) Approval Queue System
 *
 * This module provides a complete HITL approval queue system for workflow automation,
 * including:
 * - Type-safe approval request and decision handling
 * - Priority management with SLA enforcement
 * - Queue management with filtering and statistics
 * - Event-based notifications for approval state changes
 *
 * @example
 * ```typescript
 * import { createApprovalQueue, PRIORITY, REQUEST_TYPE } from '@/lib/hitl';
 *
 * const queue = createApprovalQueue();
 *
 * // Create a new approval request
 * const request = await queue.createRequest({
 *   workflowId: 'wf_123',
 *   workflowName: 'Data Import Workflow',
 *   stepId: 'step_validate',
 *   stepName: 'Validate Import Data',
 *   requestType: REQUEST_TYPE.DATA_VALIDATION,
 *   priority: PRIORITY.HIGH,
 *   requester: 'system',
 *   metadata: { data: { records: 100 } }
 * });
 *
 * // Get pending requests
 * const pending = await queue.getPendingRequests({
 *   priority: [PRIORITY.HIGH, PRIORITY.CRITICAL]
 * });
 *
 * // Record a decision
 * await queue.recordDecision({
 *   requestId: request.id,
 *   decision: 'approved',
 *   reviewer: 'user@example.com',
 *   comments: 'Data looks good',
 *   decidedAt: new Date().toISOString()
 * });
 * ```
 */

// Type exports
export type {
  ApprovalRequest,
  ApprovalDecision,
  ApprovalQueueFilters,
  ApprovalMetadata,
  ApprovalEvent,
  ApprovalQueueConfig,
  QueueStats,
  CreateApprovalRequestInput,
  ApprovalStatus,
  Priority,
  RequestType,
  DateRange,
  EscalationRecord,
} from './hitl-types';

// Constant exports
export {
  APPROVAL_STATUS,
  PRIORITY,
  REQUEST_TYPE,
} from './hitl-types';

// Queue management exports
export {
  ApprovalQueue,
  createApprovalQueue,
} from './approval-queue';

// Priority management exports
export {
  PriorityManager,
  createPriorityManager,
  SLA_THRESHOLDS,
} from './priority-manager';

// ============================================================================
// Decision Service (decision-service.ts)
// ============================================================================

export {
  // Class
  DecisionService,
  // Singleton functions
  getDecisionService,
  resetDecisionService,
  // Constants
  DECISION_OUTCOME,
  // Types
  type DecisionOutcome,
  type DecisionFilters,
  type DecisionMetrics,
  type ReviewerMetrics,
  type TimePeriodMetrics,
  type DecisionRecord,
  type UndoInfo,
  type DecisionOperationResult,
} from './decision-service';

// ============================================================================
// Decision Validator (decision-validator.ts)
// ============================================================================

export {
  // Core validation functions
  validateDecision,
  checkReviewerPermissions,
  validateComments,
  checkForConflicts,
  // Extended validation
  validateDecisionComprehensive,
  getConflictDetails,
  validateStatusTransition,
  // Decision registration
  registerDecision,
  clearRegisteredDecision,
  // Permission management
  getReviewerPermissions,
  updateReviewerPermissions,
  canReviewerPerformAction,
  // Constants
  VALIDATION_SEVERITY,
  CONFLICT_TYPE,
  // Types
  type ValidationSeverity,
  type ValidationIssue,
  type ValidationResult,
  type ReviewerPermissions,
  type ConflictResult,
  type ConflictType,
  type CommentValidationOptions,
  type ExtendedValidationResult,
} from './decision-validator';

// ============================================================================
// Notification Dispatcher (notification-dispatcher.ts)
// ============================================================================

export {
  // Class
  NotificationDispatcher,
  // Singleton functions
  getNotificationDispatcher,
  resetNotificationDispatcher,
  // Template management
  getNotificationTemplate,
  registerNotificationTemplate,
  getAllNotificationTemplates,
  // Constants
  NOTIFICATION_CHANNEL,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_TYPE,
  NOTIFICATION_STATUS,
  // Types
  type NotificationChannel,
  type NotificationPriority,
  type NotificationType,
  type NotificationStatus,
  type NotificationTemplate,
  type NotificationPayload,
  type WebhookConfig,
  type SlackConfig,
  type EmailConfig,
  type NotificationPreferences,
  type DispatchResult,
} from './notification-dispatcher';

// ============================================================================
// Workflow Integration (workflow-integration.ts)
// ============================================================================

export {
  // Class
  HITLWorkflowIntegration,
  // Factory function
  createHITLWorkflowIntegration,
  // Singleton
  hitlWorkflowIntegration,
  // Types
  type ApprovalContext,
  type AutoApproveCondition,
  type WorkflowApprovalStatus,
  type ResumeResult,
  type TimeoutAction,
  type ApprovalEventCallback,
  type WorkflowApprovalEvent,
} from './workflow-integration';

// ============================================================================
// Step Interceptor (step-interceptor.ts)
// ============================================================================

export {
  // Class
  StepInterceptor,
  // Factory function
  createStepInterceptor,
  // Singleton
  stepInterceptor,
  // Constants
  INTERCEPT_RESULT,
  // Types
  type ApprovalRequirements,
  type ExecutionContext,
  type InterceptResult,
  type InterceptResultDetails,
  type StepTypeConfig,
} from './step-interceptor';

// ============================================================================
// Auto-Approval Rules Engine (auto-approval-rules.ts)
// ============================================================================

export {
  // Class
  AutoApprovalEngine,
  // Factory function
  createAutoApprovalEngine,
  // Singleton
  autoApprovalEngine,
  // Constants
  RULE_OPERATORS,
  RULE_ACTIONS,
  // Built-in rules
  lowRiskAutoApprove,
  trustedUserAutoApprove,
  withinBudgetAutoApprove,
  highValueEscalate,
  destructiveAutoReject,
  BUILT_IN_RULES,
  // Types
  type RuleOperator,
  type RuleAction,
  type RuleCondition,
  type RuleActionConfig,
  type AutoApprovalRule,
  type RuleEvaluationResult,
  type EvaluationResult,
} from './auto-approval-rules';

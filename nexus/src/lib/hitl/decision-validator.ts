/**
 * Decision Validation Service for Human-in-the-Loop Workflows
 *
 * Provides comprehensive validation for approval decisions including
 * permission checks, comment validation, and conflict detection.
 */

import type {
  ApprovalDecision,
  ApprovalRequest,
  ApprovalStatus,
  Priority,
  RequestType,
} from './hitl-types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Validation severity levels
 */
export const VALIDATION_SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

export type ValidationSeverity = (typeof VALIDATION_SEVERITY)[keyof typeof VALIDATION_SEVERITY];

/**
 * Individual validation issue
 */
export interface ValidationIssue {
  code: string;
  message: string;
  severity: ValidationSeverity;
  field?: string;
  context?: Record<string, unknown>;
}

/**
 * Result of validation operation
 */
export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
  validatedAt: string;
}

/**
 * Reviewer permission configuration
 */
export interface ReviewerPermissions {
  reviewerId: string;
  allowedRequestTypes: RequestType[];
  allowedPriorities: Priority[];
  maxApprovalAmount?: number;
  canEscalate: boolean;
  canApprove: boolean;
  canReject: boolean;
  departmentRestrictions?: string[];
  workflowRestrictions?: string[];
}

/**
 * Conflict detection result
 */
export interface ConflictResult {
  hasConflict: boolean;
  conflictType?: ConflictType;
  conflictReason?: string;
  conflictingDecisionId?: string;
  resolutionSuggestion?: string;
}

/**
 * Types of conflicts that can occur
 */
export const CONFLICT_TYPE = {
  SELF_APPROVAL: 'self_approval',
  DUPLICATE_DECISION: 'duplicate_decision',
  EXPIRED_REQUEST: 'expired_request',
  ALREADY_DECIDED: 'already_decided',
  CONCURRENT_MODIFICATION: 'concurrent_modification',
  ROLE_CONFLICT: 'role_conflict',
} as const;

export type ConflictType = (typeof CONFLICT_TYPE)[keyof typeof CONFLICT_TYPE];

/**
 * Comment validation options
 */
export interface CommentValidationOptions {
  minLength?: number;
  maxLength?: number;
  requireForRejection?: boolean;
  requireForApproval?: boolean;
  forbiddenPatterns?: RegExp[];
  requiredPatterns?: RegExp[];
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_COMMENT_OPTIONS: CommentValidationOptions = {
  minLength: 0,
  maxLength: 2000,
  requireForRejection: true,
  requireForApproval: false,
  forbiddenPatterns: [
    /<script/i, // XSS prevention
    /javascript:/i,
    /on\w+\s*=/i,
  ],
};

// ============================================================================
// Mock Reviewer Permissions (for development)
// ============================================================================

const reviewerPermissions: Map<string, ReviewerPermissions> = new Map([
  [
    'approver-1',
    {
      reviewerId: 'approver-1',
      allowedRequestTypes: [
        'data_validation',
        'content_review',
        'exception_handling',
      ],
      allowedPriorities: ['low', 'medium', 'high'],
      maxApprovalAmount: 10000,
      canEscalate: true,
      canApprove: true,
      canReject: true,
    },
  ],
  [
    'approver-2',
    {
      reviewerId: 'approver-2',
      allowedRequestTypes: [
        'data_validation',
        'content_review',
        'external_approval',
        'exception_handling',
        'compliance_check',
      ],
      allowedPriorities: ['low', 'medium', 'high', 'critical'],
      maxApprovalAmount: 50000,
      canEscalate: true,
      canApprove: true,
      canReject: true,
    },
  ],
  [
    'approver-3',
    {
      reviewerId: 'approver-3',
      allowedRequestTypes: [
        'data_validation',
        'content_review',
        'external_approval',
        'exception_handling',
        'compliance_check',
      ],
      allowedPriorities: ['low', 'medium', 'high', 'critical'],
      maxApprovalAmount: 100000,
      canEscalate: true,
      canApprove: true,
      canReject: true,
    },
  ],
]);

// ============================================================================
// In-memory storage for decision tracking
// ============================================================================

const recentDecisions: Map<string, { decisionId: string; timestamp: string }> =
  new Map();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current ISO timestamp
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create a validation issue
 */
function createIssue(
  code: string,
  message: string,
  severity: ValidationSeverity,
  field?: string,
  context?: Record<string, unknown>
): ValidationIssue {
  return { code, message, severity, field, context };
}

/**
 * Create a validation result from issues
 */
function createValidationResult(issues: ValidationIssue[]): ValidationResult {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  return {
    isValid: errors.length === 0,
    issues,
    errors,
    warnings,
    infos,
    validatedAt: getCurrentTimestamp(),
  };
}

// ============================================================================
// Core Validation Functions
// ============================================================================

/**
 * Validate a decision against a request
 */
export function validateDecision(
  request: ApprovalRequest,
  decision: ApprovalDecision
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Check if request exists
  if (!request) {
    issues.push(
      createIssue(
        'REQUEST_NOT_FOUND',
        'The approval request does not exist',
        'error',
        'requestId'
      )
    );
    return createValidationResult(issues);
  }

  // Check if request ID matches
  if (decision.requestId !== request.id) {
    issues.push(
      createIssue(
        'REQUEST_ID_MISMATCH',
        'Decision request ID does not match the approval request',
        'error',
        'requestId',
        { expected: request.id, actual: decision.requestId }
      )
    );
  }

  // Check if request is still pending
  if (request.status !== 'pending') {
    issues.push(
      createIssue(
        'REQUEST_NOT_PENDING',
        `Cannot make decision on request with status: ${request.status}`,
        'error',
        'status',
        { currentStatus: request.status }
      )
    );
  }

  // Check if request has expired
  const dueDate = new Date(request.dueDate);
  if (dueDate < new Date()) {
    issues.push(
      createIssue(
        'REQUEST_EXPIRED',
        'The approval request has expired',
        'error',
        'dueDate',
        { dueDate: request.dueDate }
      )
    );
  }

  // Check if decision type is valid
  if (!['approved', 'rejected'].includes(decision.decision)) {
    issues.push(
      createIssue(
        'INVALID_DECISION_TYPE',
        `Invalid decision type: ${decision.decision}`,
        'error',
        'decision',
        { validTypes: ['approved', 'rejected'] }
      )
    );
  }

  // Check reviewer is assigned
  if (request.assignee && decision.reviewer !== request.assignee) {
    issues.push(
      createIssue(
        'REVIEWER_NOT_ASSIGNEE',
        'Decision reviewer is not the assigned reviewer for this request',
        'warning',
        'reviewer',
        { assigned: request.assignee, actual: decision.reviewer }
      )
    );
  }

  // Validate decision timestamp
  if (decision.decidedAt) {
    const decisionTime = new Date(decision.decidedAt);
    const requestCreatedTime = new Date(request.createdAt);

    if (decisionTime < requestCreatedTime) {
      issues.push(
        createIssue(
          'INVALID_DECISION_TIME',
          'Decision timestamp is before request creation time',
          'error',
          'decidedAt',
          { decisionTime: decision.decidedAt, requestCreated: request.createdAt }
        )
      );
    }
  }

  // Check self-approval (requester cannot approve their own request)
  if (decision.reviewer === request.requester && decision.decision === 'approved') {
    issues.push(
      createIssue(
        'SELF_APPROVAL',
        'Requester cannot approve their own request',
        'error',
        'reviewer',
        { requester: request.requester, reviewer: decision.reviewer }
      )
    );
  }

  // Validate comments for rejection
  if (decision.decision === 'rejected' && !decision.comments?.trim()) {
    issues.push(
      createIssue(
        'REJECTION_REQUIRES_COMMENT',
        'A comment is required when rejecting a request',
        'error',
        'comments'
      )
    );
  }

  // Info: High priority request
  if (request.priority === 'high' || request.priority === 'critical') {
    issues.push(
      createIssue(
        'HIGH_PRIORITY_REQUEST',
        `This is a ${request.priority} priority request`,
        'info',
        'priority',
        { priority: request.priority }
      )
    );
  }

  return createValidationResult(issues);
}

/**
 * Check reviewer permissions for a request
 */
export function checkReviewerPermissions(
  reviewer: string,
  request: ApprovalRequest
): boolean {
  const permissions = reviewerPermissions.get(reviewer);

  // If no permissions configured, deny by default
  if (!permissions) {
    return false;
  }

  // Check if reviewer can handle this request type
  if (!permissions.allowedRequestTypes.includes(request.requestType)) {
    return false;
  }

  // Check if reviewer can handle this priority level
  if (!permissions.allowedPriorities.includes(request.priority)) {
    return false;
  }

  // Check department restrictions if applicable
  if (
    permissions.departmentRestrictions &&
    permissions.departmentRestrictions.length > 0
  ) {
    const requestDepartment = request.metadata.customFields?.department as
      | string
      | undefined;
    if (
      requestDepartment &&
      !permissions.departmentRestrictions.includes(requestDepartment)
    ) {
      return false;
    }
  }

  // Check workflow restrictions if applicable
  if (
    permissions.workflowRestrictions &&
    permissions.workflowRestrictions.length > 0
  ) {
    if (!permissions.workflowRestrictions.includes(request.workflowId)) {
      return false;
    }
  }

  // Check amount threshold if applicable
  if (permissions.maxApprovalAmount !== undefined) {
    const requestAmount = request.metadata.customFields?.amount as
      | number
      | undefined;
    if (requestAmount && requestAmount > permissions.maxApprovalAmount) {
      return false;
    }
  }

  return true;
}

/**
 * Validate comments for a decision
 */
export function validateComments(
  comments: string,
  options: CommentValidationOptions = DEFAULT_COMMENT_OPTIONS
): boolean {
  // Merge with defaults
  const opts = { ...DEFAULT_COMMENT_OPTIONS, ...options };

  // Check minimum length
  if (opts.minLength !== undefined && comments.length < opts.minLength) {
    return false;
  }

  // Check maximum length
  if (opts.maxLength !== undefined && comments.length > opts.maxLength) {
    return false;
  }

  // Check forbidden patterns
  if (opts.forbiddenPatterns) {
    for (const pattern of opts.forbiddenPatterns) {
      if (pattern.test(comments)) {
        return false;
      }
    }
  }

  // Check required patterns
  if (opts.requiredPatterns) {
    for (const pattern of opts.requiredPatterns) {
      if (!pattern.test(comments)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check for conflicts with existing decisions
 */
export function checkForConflicts(decision: ApprovalDecision): boolean {
  const conflict = getConflictDetails(decision);
  return conflict.hasConflict;
}

/**
 * Get detailed conflict information
 */
export function getConflictDetails(decision: ApprovalDecision): ConflictResult {
  const requestId = decision.requestId;

  // Check for duplicate/concurrent decision
  const existingDecision = recentDecisions.get(requestId);
  if (existingDecision) {
    const existingTime = new Date(existingDecision.timestamp);
    const currentTime = new Date(decision.decidedAt);

    // If decisions are within 1 second of each other, likely a duplicate
    if (Math.abs(currentTime.getTime() - existingTime.getTime()) < 1000) {
      return {
        hasConflict: true,
        conflictType: 'duplicate_decision',
        conflictReason: 'A decision was already recorded for this request',
        conflictingDecisionId: existingDecision.decisionId,
        resolutionSuggestion: 'Wait for the existing decision to be processed',
      };
    }

    // If there's already a decision, it's an already-decided conflict
    return {
      hasConflict: true,
      conflictType: 'already_decided',
      conflictReason: 'This request has already been decided',
      conflictingDecisionId: existingDecision.decisionId,
      resolutionSuggestion:
        'Review the existing decision or submit an escalation if needed',
    };
  }

  return { hasConflict: false };
}

/**
 * Extended validation result with detailed analysis
 */
export interface ExtendedValidationResult extends ValidationResult {
  permissionsCheck: {
    hasPermission: boolean;
    missingPermissions: string[];
  };
  conflictCheck: ConflictResult;
  commentValidation: {
    isValid: boolean;
    issues: string[];
  };
}

/**
 * Perform comprehensive validation
 */
export function validateDecisionComprehensive(
  request: ApprovalRequest,
  decision: ApprovalDecision,
  commentOptions?: CommentValidationOptions
): ExtendedValidationResult {
  // Basic validation
  const baseResult = validateDecision(request, decision);

  // Permission check
  const hasPermission = checkReviewerPermissions(decision.reviewer, request);
  const missingPermissions: string[] = [];

  if (!hasPermission) {
    const permissions = reviewerPermissions.get(decision.reviewer);
    if (!permissions) {
      missingPermissions.push('No permissions configured for reviewer');
    } else {
      if (!permissions.allowedRequestTypes.includes(request.requestType)) {
        missingPermissions.push(`Cannot handle request type: ${request.requestType}`);
      }
      if (!permissions.allowedPriorities.includes(request.priority)) {
        missingPermissions.push(`Cannot handle priority: ${request.priority}`);
      }
    }
  }

  // Conflict check
  const conflictCheck = getConflictDetails(decision);

  // Comment validation
  const commentIssues: string[] = [];
  const commentsToValidate = decision.comments || '';

  if (
    decision.decision === 'rejected' &&
    !commentsToValidate.trim() &&
    (commentOptions?.requireForRejection ?? DEFAULT_COMMENT_OPTIONS.requireForRejection)
  ) {
    commentIssues.push('Comment required for rejection');
  }

  if (
    commentOptions?.maxLength &&
    commentsToValidate.length > commentOptions.maxLength
  ) {
    commentIssues.push(`Comment exceeds maximum length of ${commentOptions.maxLength}`);
  }

  const isCommentValid = validateComments(commentsToValidate, commentOptions);
  if (!isCommentValid && commentIssues.length === 0) {
    commentIssues.push('Comment failed validation');
  }

  // Add permission issues to the main issues list
  if (!hasPermission) {
    baseResult.issues.push(
      createIssue(
        'INSUFFICIENT_PERMISSIONS',
        `Reviewer does not have permission to process this request: ${missingPermissions.join(', ')}`,
        'error',
        'reviewer',
        { missingPermissions }
      )
    );
    baseResult.errors.push(baseResult.issues[baseResult.issues.length - 1]);
    baseResult.isValid = false;
  }

  // Add conflict issues
  if (conflictCheck.hasConflict) {
    baseResult.issues.push(
      createIssue(
        'DECISION_CONFLICT',
        conflictCheck.conflictReason || 'Conflict detected',
        'error',
        'requestId',
        {
          conflictType: conflictCheck.conflictType,
          conflictingDecisionId: conflictCheck.conflictingDecisionId,
        }
      )
    );
    baseResult.errors.push(baseResult.issues[baseResult.issues.length - 1]);
    baseResult.isValid = false;
  }

  return {
    ...baseResult,
    permissionsCheck: {
      hasPermission,
      missingPermissions,
    },
    conflictCheck,
    commentValidation: {
      isValid: commentIssues.length === 0,
      issues: commentIssues,
    },
  };
}

/**
 * Register a decision to prevent duplicates
 */
export function registerDecision(
  requestId: string,
  decisionId: string,
  timestamp: string
): void {
  recentDecisions.set(requestId, { decisionId, timestamp });
}

/**
 * Clear a registered decision (e.g., when undone)
 */
export function clearRegisteredDecision(requestId: string): void {
  recentDecisions.delete(requestId);
}

/**
 * Get reviewer permissions
 */
export function getReviewerPermissions(
  reviewerId: string
): ReviewerPermissions | undefined {
  return reviewerPermissions.get(reviewerId);
}

/**
 * Update reviewer permissions
 */
export function updateReviewerPermissions(
  reviewerId: string,
  permissions: Partial<ReviewerPermissions>
): void {
  const existing = reviewerPermissions.get(reviewerId);
  if (existing) {
    reviewerPermissions.set(reviewerId, { ...existing, ...permissions });
  } else {
    // Create new permissions with defaults
    reviewerPermissions.set(reviewerId, {
      reviewerId,
      allowedRequestTypes: permissions.allowedRequestTypes || [],
      allowedPriorities: permissions.allowedPriorities || ['low', 'medium'],
      canEscalate: permissions.canEscalate ?? false,
      canApprove: permissions.canApprove ?? true,
      canReject: permissions.canReject ?? true,
      ...permissions,
    });
  }
}

/**
 * Check if a reviewer can perform a specific action
 */
export function canReviewerPerformAction(
  reviewerId: string,
  action: 'approve' | 'reject' | 'escalate'
): boolean {
  const permissions = reviewerPermissions.get(reviewerId);
  if (!permissions) return false;

  switch (action) {
    case 'approve':
      return permissions.canApprove;
    case 'reject':
      return permissions.canReject;
    case 'escalate':
      return permissions.canEscalate;
    default:
      return false;
  }
}

/**
 * Validate request status transition
 */
export function validateStatusTransition(
  currentStatus: ApprovalStatus,
  targetStatus: ApprovalStatus
): ValidationResult {
  const issues: ValidationIssue[] = [];

  const validTransitions: Record<ApprovalStatus, ApprovalStatus[]> = {
    pending: ['approved', 'rejected', 'escalated', 'expired'],
    approved: [], // Terminal state
    rejected: [], // Terminal state
    escalated: ['pending', 'approved', 'rejected', 'expired'],
    expired: [], // Terminal state
  };

  const allowed = validTransitions[currentStatus] || [];

  if (!allowed.includes(targetStatus)) {
    issues.push(
      createIssue(
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from '${currentStatus}' to '${targetStatus}'`,
        'error',
        'status',
        { currentStatus, targetStatus, allowedTransitions: allowed }
      )
    );
  }

  return createValidationResult(issues);
}

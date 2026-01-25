/**
 * HITL Workflow Integration
 * Integrates Human-in-the-Loop approval flow with the workflow execution engine
 */

import type {
  ApprovalRequest,
  ApprovalStatus,
  Priority,
  RequestType,
  ApprovalQueueFilters,
  ApprovalDecision,
} from './hitl-types';
// Types from workflow-execution would be imported when integrating with actual workflow engine
import { APPROVAL_STATUS, PRIORITY, REQUEST_TYPE } from './hitl-types';
import { PriorityManager } from './priority-manager';

// ========================================
// Types
// ========================================

/**
 * Context provided when pausing for approval
 */
export interface ApprovalContext {
  /** Data being submitted for approval */
  data: Record<string, unknown>;
  /** Reason why this step requires approval */
  reason: string;
  /** Display message for reviewers */
  displayMessage?: string;
  /** Conditions under which auto-approve should trigger */
  autoApproveConditions?: AutoApproveCondition[];
  /** Associated step metadata */
  stepMetadata?: {
    inputData?: Record<string, unknown>;
    expectedOutput?: Record<string, unknown>;
    transformations?: string[];
  };
  /** Risk level assessment */
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  /** Estimated impact of the action */
  estimatedImpact?: {
    affectedRecords?: number;
    estimatedCost?: number;
    reversible?: boolean;
  };
}

/**
 * Condition for automatic approval
 */
export interface AutoApproveCondition {
  type: 'value_threshold' | 'trusted_user' | 'within_budget' | 'low_risk' | 'time_based' | 'custom';
  field?: string;
  operator?: 'less_than' | 'greater_than' | 'equals' | 'contains';
  value?: unknown;
  description?: string;
}

/**
 * Status of approval requests for a workflow
 */
export interface WorkflowApprovalStatus {
  workflowId: string;
  executionId?: string;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  escalatedRequests: number;
  expiredRequests: number;
  requests: ApprovalRequest[];
  isBlocked: boolean;
  blockingRequestIds: string[];
  estimatedWaitTime?: number;
  lastUpdated: string;
}

/**
 * Result of resume operation
 */
export interface ResumeResult {
  success: boolean;
  requestId: string;
  decision: ApprovalDecision;
  nextStepId?: string;
  shouldContinue: boolean;
  modifiedData?: Record<string, unknown>;
}

/**
 * Timeout handling options
 */
export interface TimeoutAction {
  action: 'auto_approve' | 'auto_reject' | 'escalate' | 'notify_and_wait';
  escalateTo?: string;
  notifyChannels?: ('email' | 'sms' | 'app' | 'slack')[];
  extendedTimeout?: number;
}

/**
 * Event listener callback type
 */
export type ApprovalEventCallback = (event: WorkflowApprovalEvent) => void;

/**
 * Events emitted by the integration
 */
export interface WorkflowApprovalEvent {
  type: 'request_created' | 'request_updated' | 'request_approved' | 'request_rejected' | 'request_escalated' | 'request_expired' | 'workflow_unblocked';
  timestamp: string;
  workflowId: string;
  executionId?: string;
  requestId: string;
  data?: Record<string, unknown>;
}

// ========================================
// HITLWorkflowIntegration Class
// ========================================

/**
 * Integrates HITL approval queue with workflow engine
 */
export class HITLWorkflowIntegration {
  private requests: Map<string, ApprovalRequest>;
  private workflowRequests: Map<string, Set<string>>;
  private pausedWorkflows: Map<string, string>;
  private eventListeners: Set<ApprovalEventCallback>;
  private priorityManager: PriorityManager;
  private timeoutHandlers: Map<string, NodeJS.Timeout>;
  private defaultTimeoutAction: TimeoutAction;

  constructor(options?: {
    priorityManager?: PriorityManager;
    defaultTimeoutAction?: TimeoutAction;
  }) {
    this.requests = new Map();
    this.workflowRequests = new Map();
    this.pausedWorkflows = new Map();
    this.eventListeners = new Set();
    this.timeoutHandlers = new Map();
    this.priorityManager = options?.priorityManager ?? new PriorityManager();
    this.defaultTimeoutAction = options?.defaultTimeoutAction ?? {
      action: 'escalate',
      notifyChannels: ['app', 'email'],
    };
  }

  /**
   * Pause a workflow step for approval
   * @returns The approval request ID
   */
  async pauseForApproval(
    workflowId: string,
    stepId: string,
    context: ApprovalContext,
    options?: {
      priority?: Priority;
      requestType?: RequestType;
      assignee?: string;
      requester?: string;
      workflowName?: string;
      stepName?: string;
      timeoutMs?: number;
      timeoutAction?: TimeoutAction;
    }
  ): Promise<string> {
    const now = new Date();
    const priority = options?.priority ?? this.inferPriority(context);
    const dueDate = this.priorityManager.getSLADeadline(priority, now);

    const requestId = this.generateRequestId();

    const request: ApprovalRequest = {
      id: requestId,
      workflowId,
      workflowName: options?.workflowName ?? `Workflow ${workflowId}`,
      stepId,
      stepName: options?.stepName ?? `Step ${stepId}`,
      requestType: options?.requestType ?? this.inferRequestType(context),
      priority,
      status: APPROVAL_STATUS.PENDING,
      requester: options?.requester ?? 'system',
      assignee: options?.assignee,
      dueDate: dueDate.toISOString(),
      metadata: {
        data: context.data,
        customFields: {
          reason: context.reason,
          displayMessage: context.displayMessage,
          autoApproveConditions: context.autoApproveConditions,
          riskLevel: context.riskLevel,
          estimatedImpact: context.estimatedImpact,
        },
        stepContext: context.stepMetadata,
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Store the request
    this.requests.set(requestId, request);

    // Track workflow association
    if (!this.workflowRequests.has(workflowId)) {
      this.workflowRequests.set(workflowId, new Set());
    }
    this.workflowRequests.get(workflowId)!.add(requestId);

    // Mark workflow as paused
    this.pausedWorkflows.set(workflowId, requestId);

    // Set up timeout handler if specified
    const timeoutMs = options?.timeoutMs ?? this.getDefaultTimeoutMs(priority);
    if (timeoutMs > 0) {
      const timeoutAction = options?.timeoutAction ?? this.defaultTimeoutAction;
      this.setupTimeoutHandler(requestId, timeoutMs, timeoutAction);
    }

    // Emit event
    this.emitEvent({
      type: 'request_created',
      timestamp: now.toISOString(),
      workflowId,
      executionId: undefined,
      requestId,
      data: { context, priority },
    });

    return requestId;
  }

  /**
   * Resume workflow after approval decision
   */
  async resumeAfterApproval(
    requestId: string,
    decision?: ApprovalDecision
  ): Promise<ResumeResult> {
    const request = this.requests.get(requestId);

    if (!request) {
      return {
        success: false,
        requestId,
        decision: decision ?? this.createRejectionDecision(requestId, 'system', 'Request not found'),
        shouldContinue: false,
      };
    }

    // Clear any pending timeout
    this.clearTimeoutHandler(requestId);

    // Default to using the current decision on the request
    const finalDecision = decision ?? request.metadata.customFields?.decision as ApprovalDecision | undefined;

    if (!finalDecision) {
      return {
        success: false,
        requestId,
        decision: this.createRejectionDecision(requestId, 'system', 'No decision provided'),
        shouldContinue: false,
      };
    }

    // Update request status based on decision
    const newStatus: ApprovalStatus = finalDecision.decision === 'approved'
      ? APPROVAL_STATUS.APPROVED
      : APPROVAL_STATUS.REJECTED;

    request.status = newStatus;
    request.updatedAt = new Date().toISOString();
    request.metadata.customFields = {
      ...request.metadata.customFields,
      decision: finalDecision,
    };

    // Remove from paused workflows if this was the blocking request
    const blockedWorkflowId = this.pausedWorkflows.get(request.workflowId);
    if (blockedWorkflowId === requestId) {
      this.pausedWorkflows.delete(request.workflowId);
    }

    // Emit appropriate event
    this.emitEvent({
      type: finalDecision.decision === 'approved' ? 'request_approved' : 'request_rejected',
      timestamp: new Date().toISOString(),
      workflowId: request.workflowId,
      requestId,
      data: { decision: finalDecision },
    });

    // Check if workflow is now unblocked
    const workflowStatus = await this.getWorkflowApprovalStatus(request.workflowId);
    if (!workflowStatus.isBlocked) {
      this.emitEvent({
        type: 'workflow_unblocked',
        timestamp: new Date().toISOString(),
        workflowId: request.workflowId,
        requestId,
      });
    }

    return {
      success: true,
      requestId,
      decision: finalDecision,
      shouldContinue: finalDecision.decision === 'approved',
      modifiedData: finalDecision.additionalData as Record<string, unknown> | undefined,
    };
  }

  /**
   * Handle approval timeout
   */
  async handleApprovalTimeout(requestId: string): Promise<void> {
    const request = this.requests.get(requestId);

    if (!request || request.status !== APPROVAL_STATUS.PENDING) {
      return;
    }

    const timeoutAction = (request.metadata.customFields?.timeoutAction as TimeoutAction)
      ?? this.defaultTimeoutAction;

    switch (timeoutAction.action) {
      case 'auto_approve':
        await this.autoApprove(requestId, 'Timeout - auto-approved');
        break;

      case 'auto_reject':
        await this.autoReject(requestId, 'Timeout - auto-rejected');
        break;

      case 'escalate':
        await this.escalateRequest(requestId, timeoutAction.escalateTo);
        break;

      case 'notify_and_wait':
        await this.notifyTimeout(requestId, timeoutAction.notifyChannels ?? ['app']);
        // Extend timeout if specified
        if (timeoutAction.extendedTimeout) {
          this.setupTimeoutHandler(requestId, timeoutAction.extendedTimeout, {
            action: 'auto_reject',
          });
        }
        break;
    }

    // Emit expired event
    this.emitEvent({
      type: 'request_expired',
      timestamp: new Date().toISOString(),
      workflowId: request.workflowId,
      requestId,
      data: { action: timeoutAction.action },
    });
  }

  /**
   * Get approval status for a workflow
   */
  async getWorkflowApprovalStatus(workflowId: string): Promise<WorkflowApprovalStatus> {
    const requestIds = this.workflowRequests.get(workflowId) ?? new Set();
    const requests: ApprovalRequest[] = [];
    const blockingRequestIds: string[] = [];

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let escalatedCount = 0;
    let expiredCount = 0;

    for (const requestId of requestIds) {
      const request = this.requests.get(requestId);
      if (!request) continue;

      requests.push(request);

      switch (request.status) {
        case APPROVAL_STATUS.PENDING:
          pendingCount++;
          blockingRequestIds.push(requestId);
          break;
        case APPROVAL_STATUS.APPROVED:
          approvedCount++;
          break;
        case APPROVAL_STATUS.REJECTED:
          rejectedCount++;
          break;
        case APPROVAL_STATUS.ESCALATED:
          escalatedCount++;
          blockingRequestIds.push(requestId);
          break;
        case APPROVAL_STATUS.EXPIRED:
          expiredCount++;
          break;
      }
    }

    // Calculate estimated wait time based on pending requests
    const estimatedWaitTime = this.calculateEstimatedWaitTime(requests.filter(
      r => r.status === APPROVAL_STATUS.PENDING || r.status === APPROVAL_STATUS.ESCALATED
    ));

    return {
      workflowId,
      totalRequests: requests.length,
      pendingRequests: pendingCount,
      approvedRequests: approvedCount,
      rejectedRequests: rejectedCount,
      escalatedRequests: escalatedCount,
      expiredRequests: expiredCount,
      requests,
      isBlocked: blockingRequestIds.length > 0,
      blockingRequestIds,
      estimatedWaitTime,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get a specific approval request
   */
  getRequest(requestId: string): ApprovalRequest | undefined {
    return this.requests.get(requestId);
  }

  /**
   * Query approval requests with filters
   */
  queryRequests(filters?: ApprovalQueueFilters): ApprovalRequest[] {
    let results = Array.from(this.requests.values());

    if (!filters) {
      return results;
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      results = results.filter(r => statuses.includes(r.status));
    }

    if (filters.priority) {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
      results = results.filter(r => priorities.includes(r.priority));
    }

    if (filters.assignee) {
      results = results.filter(r => r.assignee === filters.assignee);
    }

    if (filters.workflowId) {
      results = results.filter(r => r.workflowId === filters.workflowId);
    }

    if (filters.requestType) {
      const types = Array.isArray(filters.requestType) ? filters.requestType : [filters.requestType];
      results = results.filter(r => types.includes(r.requestType));
    }

    if (filters.requester) {
      results = results.filter(r => r.requester === filters.requester);
    }

    if (!filters.includeExpired) {
      results = results.filter(r => r.status !== APPROVAL_STATUS.EXPIRED);
    }

    if (filters.dateRange) {
      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start).getTime();
        results = results.filter(r => new Date(r.createdAt).getTime() >= startDate);
      }
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end).getTime();
        results = results.filter(r => new Date(r.createdAt).getTime() <= endDate);
      }
    }

    return this.priorityManager.sortByPriority(results);
  }

  /**
   * Subscribe to approval events
   */
  subscribe(callback: ApprovalEventCallback): () => void {
    this.eventListeners.add(callback);
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  /**
   * Approve a request
   */
  async approveRequest(
    requestId: string,
    reviewer: string,
    comments?: string,
    additionalData?: Record<string, unknown>
  ): Promise<ResumeResult> {
    const decision: ApprovalDecision = {
      requestId,
      decision: 'approved',
      reviewer,
      comments,
      decidedAt: new Date().toISOString(),
      additionalData,
    };

    return this.resumeAfterApproval(requestId, decision);
  }

  /**
   * Reject a request
   */
  async rejectRequest(
    requestId: string,
    reviewer: string,
    comments: string,
    additionalData?: Record<string, unknown>
  ): Promise<ResumeResult> {
    const decision: ApprovalDecision = {
      requestId,
      decision: 'rejected',
      reviewer,
      comments,
      decidedAt: new Date().toISOString(),
      additionalData,
    };

    return this.resumeAfterApproval(requestId, decision);
  }

  /**
   * Escalate a request
   */
  async escalateRequest(requestId: string, escalateTo?: string): Promise<void> {
    const request = this.requests.get(requestId);
    if (!request) return;

    request.status = APPROVAL_STATUS.ESCALATED;
    request.updatedAt = new Date().toISOString();

    // Update escalation history
    const escalationRecord = {
      escalatedAt: new Date().toISOString(),
      escalatedBy: 'system',
      reason: 'Timeout or manual escalation',
      escalatedTo: escalateTo,
    };

    if (!request.metadata.escalationHistory) {
      request.metadata.escalationHistory = [];
    }
    request.metadata.escalationHistory.push(escalationRecord);

    if (escalateTo) {
      request.assignee = escalateTo;
    }

    this.emitEvent({
      type: 'request_escalated',
      timestamp: new Date().toISOString(),
      workflowId: request.workflowId,
      requestId,
      data: { escalateTo },
    });
  }

  /**
   * Assign request to a user
   */
  assignRequest(requestId: string, assignee: string): void {
    const request = this.requests.get(requestId);
    if (!request) return;

    request.assignee = assignee;
    request.updatedAt = new Date().toISOString();

    this.emitEvent({
      type: 'request_updated',
      timestamp: new Date().toISOString(),
      workflowId: request.workflowId,
      requestId,
      data: { assignee },
    });
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private generateRequestId(): string {
    return `apr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private inferPriority(context: ApprovalContext): Priority {
    if (context.riskLevel === 'critical') return PRIORITY.CRITICAL;
    if (context.riskLevel === 'high') return PRIORITY.HIGH;
    if (context.riskLevel === 'medium') return PRIORITY.MEDIUM;

    // Check estimated impact
    if (context.estimatedImpact) {
      if (context.estimatedImpact.estimatedCost && context.estimatedImpact.estimatedCost > 1000) {
        return PRIORITY.HIGH;
      }
      if (context.estimatedImpact.affectedRecords && context.estimatedImpact.affectedRecords > 100) {
        return PRIORITY.HIGH;
      }
      if (context.estimatedImpact.reversible === false) {
        return PRIORITY.HIGH;
      }
    }

    return PRIORITY.MEDIUM;
  }

  private inferRequestType(context: ApprovalContext): RequestType {
    const reason = context.reason.toLowerCase();

    if (reason.includes('validation') || reason.includes('verify')) {
      return REQUEST_TYPE.DATA_VALIDATION;
    }
    if (reason.includes('content') || reason.includes('review')) {
      return REQUEST_TYPE.CONTENT_REVIEW;
    }
    if (reason.includes('compliance') || reason.includes('policy')) {
      return REQUEST_TYPE.COMPLIANCE_CHECK;
    }
    if (reason.includes('exception') || reason.includes('error')) {
      return REQUEST_TYPE.EXCEPTION_HANDLING;
    }
    if (reason.includes('external') || reason.includes('partner')) {
      return REQUEST_TYPE.EXTERNAL_APPROVAL;
    }

    return REQUEST_TYPE.DATA_VALIDATION;
  }

  private getDefaultTimeoutMs(priority: Priority): number {
    const timeouts: Record<Priority, number> = {
      [PRIORITY.CRITICAL]: 60 * 60 * 1000, // 1 hour
      [PRIORITY.HIGH]: 4 * 60 * 60 * 1000, // 4 hours
      [PRIORITY.MEDIUM]: 24 * 60 * 60 * 1000, // 24 hours
      [PRIORITY.LOW]: 72 * 60 * 60 * 1000, // 72 hours
    };
    return timeouts[priority];
  }

  private setupTimeoutHandler(
    requestId: string,
    timeoutMs: number,
    action: TimeoutAction
  ): void {
    // Clear any existing handler
    this.clearTimeoutHandler(requestId);

    // Store timeout action on the request
    const request = this.requests.get(requestId);
    if (request) {
      request.metadata.customFields = {
        ...request.metadata.customFields,
        timeoutAction: action,
      };
    }

    // Set up new timeout
    const handler = setTimeout(() => {
      void this.handleApprovalTimeout(requestId);
    }, timeoutMs);

    this.timeoutHandlers.set(requestId, handler);
  }

  private clearTimeoutHandler(requestId: string): void {
    const handler = this.timeoutHandlers.get(requestId);
    if (handler) {
      clearTimeout(handler);
      this.timeoutHandlers.delete(requestId);
    }
  }

  private async autoApprove(requestId: string, reason: string): Promise<void> {
    await this.approveRequest(requestId, 'system', `Auto-approved: ${reason}`);
  }

  private async autoReject(requestId: string, reason: string): Promise<void> {
    await this.rejectRequest(requestId, 'system', `Auto-rejected: ${reason}`);
  }

  private async notifyTimeout(
    requestId: string,
    _channels: ('email' | 'sms' | 'app' | 'slack')[]
  ): Promise<void> {
    // Silence unused variable warning
    void _channels;

    // Implementation would integrate with notification service
    const request = this.requests.get(requestId);
    if (request) {
      // In a real implementation, this would send notifications
      console.log(`[HITL] Timeout notification for request ${requestId}`);
    }
  }

  private calculateEstimatedWaitTime(pendingRequests: ApprovalRequest[]): number {
    if (pendingRequests.length === 0) return 0;

    // Calculate average based on priority and historical data
    // For now, use a simple estimate based on SLA thresholds
    const avgTimePerPriority: Record<Priority, number> = {
      [PRIORITY.CRITICAL]: 30 * 60 * 1000, // 30 minutes
      [PRIORITY.HIGH]: 2 * 60 * 60 * 1000, // 2 hours
      [PRIORITY.MEDIUM]: 8 * 60 * 60 * 1000, // 8 hours
      [PRIORITY.LOW]: 24 * 60 * 60 * 1000, // 24 hours
    };

    let totalEstimate = 0;
    for (const request of pendingRequests) {
      totalEstimate += avgTimePerPriority[request.priority];
    }

    return Math.round(totalEstimate / pendingRequests.length);
  }

  private createRejectionDecision(
    requestId: string,
    reviewer: string,
    comments: string
  ): ApprovalDecision {
    return {
      requestId,
      decision: 'rejected',
      reviewer,
      comments,
      decidedAt: new Date().toISOString(),
    };
  }

  private emitEvent(event: WorkflowApprovalEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[HITL] Error in event listener:', error);
      }
    }
  }
}

/**
 * Create a new HITLWorkflowIntegration instance
 */
export function createHITLWorkflowIntegration(options?: {
  priorityManager?: PriorityManager;
  defaultTimeoutAction?: TimeoutAction;
}): HITLWorkflowIntegration {
  return new HITLWorkflowIntegration(options);
}

/**
 * Default singleton instance
 */
export const hitlWorkflowIntegration = new HITLWorkflowIntegration();

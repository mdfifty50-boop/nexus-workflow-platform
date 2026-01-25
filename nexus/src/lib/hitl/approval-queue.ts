/**
 * Approval Queue Management for HITL Workflow System
 * Handles creation, retrieval, assignment, and lifecycle of approval requests
 */

import type {
  ApprovalRequest,
  ApprovalQueueFilters,
  ApprovalDecision,
  ApprovalEvent,
  ApprovalQueueConfig,
  QueueStats,
  CreateApprovalRequestInput,
  ApprovalStatus,
  Priority,
  RequestType,
} from './hitl-types';
import {
  APPROVAL_STATUS,
  PRIORITY,
  REQUEST_TYPE,
} from './hitl-types';
import { PriorityManager, SLA_THRESHOLDS } from './priority-manager';

/**
 * Type for event listener callbacks
 */
type EventListener = (event: ApprovalEvent) => void;

/**
 * Generate a unique ID for requests
 */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `apr_${timestamp}_${randomPart}`;
}

/**
 * Main approval queue class for managing HITL approval requests
 */
export class ApprovalQueue {
  private requests: Map<string, ApprovalRequest>;
  private decisions: Map<string, ApprovalDecision>;
  private eventListeners: Set<EventListener>;
  private priorityManager: PriorityManager;
  private config: ApprovalQueueConfig;
  private expirationTimer: ReturnType<typeof setInterval> | null;

  constructor(config?: ApprovalQueueConfig) {
    this.requests = new Map();
    this.decisions = new Map();
    this.eventListeners = new Set();
    this.config = {
      slaThresholds: SLA_THRESHOLDS,
      autoExpire: true,
      expirationCheckInterval: 60000, // 1 minute
      maxEscalations: 3,
      ...config,
    };
    this.priorityManager = new PriorityManager(this.config.slaThresholds);
    this.expirationTimer = null;

    if (this.config.autoExpire) {
      this.startExpirationChecker();
    }
  }

  /**
   * Create a new approval request
   */
  async createRequest(
    input: Partial<CreateApprovalRequestInput>
  ): Promise<ApprovalRequest> {
    // Validate required fields
    if (!input.workflowId) {
      throw new Error('workflowId is required');
    }
    if (!input.stepId) {
      throw new Error('stepId is required');
    }
    if (!input.requestType) {
      throw new Error('requestType is required');
    }
    if (!input.requester) {
      throw new Error('requester is required');
    }

    const now = new Date().toISOString();
    const priority = input.priority ?? PRIORITY.MEDIUM;
    const dueDate =
      input.dueDate ??
      this.priorityManager.getSLADeadline(priority).toISOString();

    const request: ApprovalRequest = {
      id: generateId(),
      workflowId: input.workflowId,
      workflowName: input.workflowName ?? 'Unknown Workflow',
      stepId: input.stepId,
      stepName: input.stepName ?? 'Unknown Step',
      requestType: input.requestType,
      priority,
      status: APPROVAL_STATUS.PENDING,
      requester: input.requester,
      assignee: input.assignee,
      dueDate,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    this.requests.set(request.id, request);
    this.emitEvent('created', request);

    return request;
  }

  /**
   * Get a single approval request by ID
   */
  async getRequest(id: string): Promise<ApprovalRequest | null> {
    return this.requests.get(id) ?? null;
  }

  /**
   * Get all pending requests, optionally filtered
   */
  async getPendingRequests(
    filters?: ApprovalQueueFilters
  ): Promise<ApprovalRequest[]> {
    let results = Array.from(this.requests.values());

    // Default to pending status if no status filter provided
    const statusFilter = filters?.status ?? APPROVAL_STATUS.PENDING;

    // Apply status filter
    if (statusFilter) {
      const statusArray = Array.isArray(statusFilter)
        ? statusFilter
        : [statusFilter];
      results = results.filter((r) =>
        statusArray.includes(r.status as ApprovalStatus)
      );
    }

    // Apply priority filter
    if (filters?.priority) {
      const priorityArray = Array.isArray(filters.priority)
        ? filters.priority
        : [filters.priority];
      results = results.filter((r) =>
        priorityArray.includes(r.priority as Priority)
      );
    }

    // Apply assignee filter
    if (filters?.assignee) {
      results = results.filter((r) => r.assignee === filters.assignee);
    }

    // Apply workflow filter
    if (filters?.workflowId) {
      results = results.filter((r) => r.workflowId === filters.workflowId);
    }

    // Apply request type filter
    if (filters?.requestType) {
      const typeArray = Array.isArray(filters.requestType)
        ? filters.requestType
        : [filters.requestType];
      results = results.filter((r) =>
        typeArray.includes(r.requestType as RequestType)
      );
    }

    // Apply requester filter
    if (filters?.requester) {
      results = results.filter((r) => r.requester === filters.requester);
    }

    // Apply date range filter
    if (filters?.dateRange) {
      const { start, end } = filters.dateRange;
      if (start) {
        const startDate = new Date(start);
        results = results.filter((r) => new Date(r.createdAt) >= startDate);
      }
      if (end) {
        const endDate = new Date(end);
        results = results.filter((r) => new Date(r.createdAt) <= endDate);
      }
    }

    // Exclude expired unless explicitly included
    if (!filters?.includeExpired) {
      results = results.filter((r) => r.status !== APPROVAL_STATUS.EXPIRED);
    }

    // Sort by priority
    return this.priorityManager.sortByPriority(results);
  }

  /**
   * Assign a request to a specific user
   */
  async assignRequest(id: string, assignee: string): Promise<void> {
    const request = this.requests.get(id);
    if (!request) {
      throw new Error(`Request ${id} not found`);
    }

    if (request.status !== APPROVAL_STATUS.PENDING) {
      throw new Error(
        `Cannot assign request with status ${request.status}`
      );
    }

    const updatedRequest: ApprovalRequest = {
      ...request,
      assignee,
      updatedAt: new Date().toISOString(),
    };

    this.requests.set(id, updatedRequest);
    this.emitEvent('assigned', updatedRequest);
  }

  /**
   * Escalate a request with a reason
   */
  async escalateRequest(id: string, reason: string): Promise<void> {
    const request = this.requests.get(id);
    if (!request) {
      throw new Error(`Request ${id} not found`);
    }

    if (request.status !== APPROVAL_STATUS.PENDING) {
      throw new Error(
        `Cannot escalate request with status ${request.status}`
      );
    }

    const escalationHistory = request.metadata.escalationHistory ?? [];
    const maxEscalations = this.config.maxEscalations ?? 3;

    if (escalationHistory.length >= maxEscalations) {
      throw new Error(
        `Request ${id} has reached maximum escalation limit (${maxEscalations})`
      );
    }

    const escalationRecord = {
      escalatedAt: new Date().toISOString(),
      escalatedBy: request.assignee ?? 'system',
      reason,
    };

    const updatedRequest: ApprovalRequest = {
      ...request,
      status: APPROVAL_STATUS.ESCALATED,
      priority: this.getEscalatedPriority(request.priority),
      metadata: {
        ...request.metadata,
        escalationHistory: [...escalationHistory, escalationRecord],
      },
      updatedAt: new Date().toISOString(),
    };

    this.requests.set(id, updatedRequest);
    this.emitEvent('escalated', updatedRequest);
  }

  /**
   * Get the next higher priority level for escalation
   */
  private getEscalatedPriority(currentPriority: Priority): Priority {
    switch (currentPriority) {
      case PRIORITY.LOW:
        return PRIORITY.MEDIUM;
      case PRIORITY.MEDIUM:
        return PRIORITY.HIGH;
      case PRIORITY.HIGH:
      case PRIORITY.CRITICAL:
        return PRIORITY.CRITICAL;
      default:
        return PRIORITY.HIGH;
    }
  }

  /**
   * Record a decision on an approval request
   */
  async recordDecision(decision: ApprovalDecision): Promise<void> {
    const request = this.requests.get(decision.requestId);
    if (!request) {
      throw new Error(`Request ${decision.requestId} not found`);
    }

    if (
      request.status !== APPROVAL_STATUS.PENDING &&
      request.status !== APPROVAL_STATUS.ESCALATED
    ) {
      throw new Error(
        `Cannot decide on request with status ${request.status}`
      );
    }

    const newStatus =
      decision.decision === 'approved'
        ? APPROVAL_STATUS.APPROVED
        : APPROVAL_STATUS.REJECTED;

    const updatedRequest: ApprovalRequest = {
      ...request,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    this.requests.set(decision.requestId, updatedRequest);
    this.decisions.set(decision.requestId, decision);
    this.emitEvent('decided', updatedRequest, decision);
  }

  /**
   * Get the decision for a request
   */
  async getDecision(requestId: string): Promise<ApprovalDecision | null> {
    return this.decisions.get(requestId) ?? null;
  }

  /**
   * Expire old requests that have passed their due date
   * Returns the number of requests expired
   */
  async expireOldRequests(maxAge?: number): Promise<number> {
    const _maxAge = maxAge;
    void _maxAge; // Unused parameter acknowledged

    const now = new Date();
    let expiredCount = 0;

    for (const [id, request] of this.requests) {
      if (
        request.status === APPROVAL_STATUS.PENDING ||
        request.status === APPROVAL_STATUS.ESCALATED
      ) {
        const dueDate = new Date(request.dueDate);
        if (now > dueDate) {
          const updatedRequest: ApprovalRequest = {
            ...request,
            status: APPROVAL_STATUS.EXPIRED,
            updatedAt: now.toISOString(),
          };
          this.requests.set(id, updatedRequest);
          this.emitEvent('expired', updatedRequest);
          expiredCount++;
        }
      }
    }

    return expiredCount;
  }

  /**
   * Get statistics about the approval queue
   */
  async getQueueStats(): Promise<QueueStats> {
    const requests = Array.from(this.requests.values());

    // Initialize counters
    const byStatus: Record<ApprovalStatus, number> = {
      [APPROVAL_STATUS.PENDING]: 0,
      [APPROVAL_STATUS.APPROVED]: 0,
      [APPROVAL_STATUS.REJECTED]: 0,
      [APPROVAL_STATUS.ESCALATED]: 0,
      [APPROVAL_STATUS.EXPIRED]: 0,
    };

    const byPriority: Record<Priority, number> = {
      [PRIORITY.LOW]: 0,
      [PRIORITY.MEDIUM]: 0,
      [PRIORITY.HIGH]: 0,
      [PRIORITY.CRITICAL]: 0,
    };

    const byRequestType: Record<RequestType, number> = {
      [REQUEST_TYPE.DATA_VALIDATION]: 0,
      [REQUEST_TYPE.CONTENT_REVIEW]: 0,
      [REQUEST_TYPE.EXTERNAL_APPROVAL]: 0,
      [REQUEST_TYPE.EXCEPTION_HANDLING]: 0,
      [REQUEST_TYPE.COMPLIANCE_CHECK]: 0,
    };

    let overdue = 0;
    let unassigned = 0;
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    const now = new Date();

    for (const request of requests) {
      // Count by status
      byStatus[request.status]++;

      // Count by priority
      byPriority[request.priority]++;

      // Count by request type
      byRequestType[request.requestType]++;

      // Count overdue (pending/escalated requests past due date)
      if (
        (request.status === APPROVAL_STATUS.PENDING ||
          request.status === APPROVAL_STATUS.ESCALATED) &&
        new Date(request.dueDate) < now
      ) {
        overdue++;
      }

      // Count unassigned
      if (
        !request.assignee &&
        (request.status === APPROVAL_STATUS.PENDING ||
          request.status === APPROVAL_STATUS.ESCALATED)
      ) {
        unassigned++;
      }

      // Calculate resolution time for completed requests
      if (
        request.status === APPROVAL_STATUS.APPROVED ||
        request.status === APPROVAL_STATUS.REJECTED
      ) {
        const createdAt = new Date(request.createdAt).getTime();
        const updatedAt = new Date(request.updatedAt).getTime();
        totalResolutionTime += updatedAt - createdAt;
        resolvedCount++;
      }
    }

    const averageResolutionTime =
      resolvedCount > 0 ? totalResolutionTime / resolvedCount : undefined;

    return {
      total: requests.length,
      byStatus,
      byPriority,
      byRequestType,
      overdue,
      unassigned,
      averageResolutionTime,
      calculatedAt: now.toISOString(),
    };
  }

  /**
   * Get all requests (for debugging/admin purposes)
   */
  async getAllRequests(): Promise<ApprovalRequest[]> {
    return Array.from(this.requests.values());
  }

  /**
   * Delete a request (admin operation)
   */
  async deleteRequest(id: string): Promise<boolean> {
    const existed = this.requests.has(id);
    this.requests.delete(id);
    this.decisions.delete(id);
    return existed;
  }

  /**
   * Clear all requests (admin/testing operation)
   */
  async clearAll(): Promise<void> {
    this.requests.clear();
    this.decisions.clear();
  }

  /**
   * Subscribe to approval events
   */
  subscribe(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  /**
   * Emit an event to all listeners
   */
  private emitEvent(
    type: ApprovalEvent['type'],
    request: ApprovalRequest,
    decision?: ApprovalDecision
  ): void {
    const event: ApprovalEvent = {
      type,
      request,
      decision,
      timestamp: new Date().toISOString(),
    };

    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in approval event listener:', error);
      }
    }
  }

  /**
   * Start the automatic expiration checker
   */
  private startExpirationChecker(): void {
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
    }

    const interval = this.config.expirationCheckInterval ?? 60000;
    this.expirationTimer = setInterval(() => {
      this.expireOldRequests().catch((error) => {
        console.error('Error in expiration checker:', error);
      });
    }, interval);
  }

  /**
   * Stop the automatic expiration checker
   */
  stopExpirationChecker(): void {
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
      this.expirationTimer = null;
    }
  }

  /**
   * Get the priority manager instance
   */
  getPriorityManager(): PriorityManager {
    return this.priorityManager;
  }

  /**
   * Cleanup resources when done
   */
  destroy(): void {
    this.stopExpirationChecker();
    this.eventListeners.clear();
  }
}

/**
 * Create a new ApprovalQueue instance with optional configuration
 */
export function createApprovalQueue(
  config?: ApprovalQueueConfig
): ApprovalQueue {
  return new ApprovalQueue(config);
}

/**
 * Priority Manager for HITL Approval Queue
 * Handles priority calculation, SLA management, and request sorting
 */

import type {
  ApprovalRequest,
  Priority,
  RequestType,
} from './hitl-types';
import { PRIORITY, REQUEST_TYPE } from './hitl-types';

/**
 * SLA thresholds in milliseconds by priority level
 * - Critical: 1 hour
 * - High: 4 hours
 * - Medium: 24 hours (1 day)
 * - Low: 72 hours (3 days)
 */
export const SLA_THRESHOLDS: Record<Priority, number> = {
  [PRIORITY.CRITICAL]: 1 * 60 * 60 * 1000, // 1 hour
  [PRIORITY.HIGH]: 4 * 60 * 60 * 1000, // 4 hours
  [PRIORITY.MEDIUM]: 24 * 60 * 60 * 1000, // 24 hours
  [PRIORITY.LOW]: 72 * 60 * 60 * 1000, // 72 hours
};

/**
 * Priority weight values for sorting (higher = more urgent)
 */
const PRIORITY_WEIGHTS: Record<Priority, number> = {
  [PRIORITY.CRITICAL]: 4,
  [PRIORITY.HIGH]: 3,
  [PRIORITY.MEDIUM]: 2,
  [PRIORITY.LOW]: 1,
};

/**
 * Request type base priorities
 * Some request types inherently have higher urgency
 */
const REQUEST_TYPE_PRIORITY_BOOST: Record<RequestType, number> = {
  [REQUEST_TYPE.COMPLIANCE_CHECK]: 2, // Compliance is typically urgent
  [REQUEST_TYPE.EXCEPTION_HANDLING]: 1, // Exceptions need attention
  [REQUEST_TYPE.EXTERNAL_APPROVAL]: 0, // External dependencies
  [REQUEST_TYPE.DATA_VALIDATION]: 0, // Standard validation
  [REQUEST_TYPE.CONTENT_REVIEW]: 0, // Standard review
};

/**
 * Manager for handling priority calculations and SLA enforcement
 */
export class PriorityManager {
  private slaThresholds: Record<Priority, number>;

  constructor(customThresholds?: Partial<Record<Priority, number>>) {
    this.slaThresholds = {
      ...SLA_THRESHOLDS,
      ...customThresholds,
    };
  }

  /**
   * Calculate the effective priority for a request based on various factors
   * Factors considered:
   * - Base priority from request
   * - Request type urgency boost
   * - Time until due date (urgency increases as deadline approaches)
   * - Number of previous escalations
   */
  calculatePriority(request: ApprovalRequest): Priority {
    const basePriority = request.priority;
    let priorityScore = PRIORITY_WEIGHTS[basePriority];

    // Boost based on request type
    const typeBoost = REQUEST_TYPE_PRIORITY_BOOST[request.requestType];
    priorityScore += typeBoost * 0.5;

    // Boost based on approaching deadline
    const now = new Date();
    const dueDate = new Date(request.dueDate);
    const timeRemaining = dueDate.getTime() - now.getTime();
    const totalSlaTime = this.slaThresholds[basePriority];

    if (timeRemaining <= 0) {
      // Already overdue - maximum priority boost
      priorityScore += 2;
    } else if (timeRemaining < totalSlaTime * 0.25) {
      // Less than 25% time remaining - significant boost
      priorityScore += 1.5;
    } else if (timeRemaining < totalSlaTime * 0.5) {
      // Less than 50% time remaining - moderate boost
      priorityScore += 0.75;
    }

    // Boost based on escalation history
    const escalationCount = request.metadata.escalationHistory?.length ?? 0;
    priorityScore += escalationCount * 0.5;

    // Previous attempt boost
    const previousAttempts = request.metadata.previousAttempts ?? 0;
    priorityScore += previousAttempts * 0.25;

    // Map score back to priority level
    return this.scoreToPriority(priorityScore);
  }

  /**
   * Convert a numeric priority score to a Priority level
   */
  private scoreToPriority(score: number): Priority {
    if (score >= 4) return PRIORITY.CRITICAL;
    if (score >= 3) return PRIORITY.HIGH;
    if (score >= 2) return PRIORITY.MEDIUM;
    return PRIORITY.LOW;
  }

  /**
   * Get the SLA deadline for a given priority level
   */
  getSLADeadline(priority: Priority, fromDate?: Date): Date {
    const startDate = fromDate ?? new Date();
    const threshold = this.slaThresholds[priority];
    return new Date(startDate.getTime() + threshold);
  }

  /**
   * Check if a request is overdue based on its due date
   */
  isOverdue(request: ApprovalRequest): boolean {
    const now = new Date();
    const dueDate = new Date(request.dueDate);
    return now > dueDate;
  }

  /**
   * Get the time remaining until due date in milliseconds
   * Returns negative value if overdue
   */
  getTimeRemaining(request: ApprovalRequest): number {
    const now = new Date();
    const dueDate = new Date(request.dueDate);
    return dueDate.getTime() - now.getTime();
  }

  /**
   * Get the percentage of SLA time that has elapsed
   */
  getSLAProgress(request: ApprovalRequest): number {
    const createdAt = new Date(request.createdAt);
    const dueDate = new Date(request.dueDate);
    const now = new Date();

    const totalTime = dueDate.getTime() - createdAt.getTime();
    const elapsedTime = now.getTime() - createdAt.getTime();

    if (totalTime <= 0) return 100;
    return Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
  }

  /**
   * Sort requests by effective priority (most urgent first)
   * Sorting criteria:
   * 1. Calculated priority (highest first)
   * 2. Overdue status (overdue first)
   * 3. Time remaining until due (least time first)
   * 4. Creation date (oldest first)
   */
  sortByPriority(requests: ApprovalRequest[]): ApprovalRequest[] {
    return [...requests].sort((a, b) => {
      // Calculate effective priorities
      const priorityA = this.calculatePriority(a);
      const priorityB = this.calculatePriority(b);
      const weightA = PRIORITY_WEIGHTS[priorityA];
      const weightB = PRIORITY_WEIGHTS[priorityB];

      // Sort by priority weight (descending)
      if (weightA !== weightB) {
        return weightB - weightA;
      }

      // Same priority - check overdue status
      const overdueA = this.isOverdue(a);
      const overdueB = this.isOverdue(b);

      if (overdueA && !overdueB) return -1;
      if (!overdueA && overdueB) return 1;

      // Both overdue or both not - sort by time remaining
      const timeRemainingA = this.getTimeRemaining(a);
      const timeRemainingB = this.getTimeRemaining(b);

      if (timeRemainingA !== timeRemainingB) {
        return timeRemainingA - timeRemainingB;
      }

      // Same time remaining - sort by creation date (oldest first)
      const createdAtA = new Date(a.createdAt).getTime();
      const createdAtB = new Date(b.createdAt).getTime();
      return createdAtA - createdAtB;
    });
  }

  /**
   * Get all overdue requests from a list
   */
  getOverdueRequests(requests: ApprovalRequest[]): ApprovalRequest[] {
    return requests.filter((request) => this.isOverdue(request));
  }

  /**
   * Get requests that are approaching their SLA deadline
   * @param requests List of requests to check
   * @param thresholdPercent Percentage of SLA time elapsed to consider "approaching" (default: 75)
   */
  getApproachingDeadline(
    requests: ApprovalRequest[],
    thresholdPercent: number = 75
  ): ApprovalRequest[] {
    return requests.filter((request) => {
      const progress = this.getSLAProgress(request);
      return progress >= thresholdPercent && progress < 100;
    });
  }

  /**
   * Get requests grouped by their urgency level
   */
  groupByUrgency(requests: ApprovalRequest[]): {
    overdue: ApprovalRequest[];
    critical: ApprovalRequest[];
    approaching: ApprovalRequest[];
    normal: ApprovalRequest[];
  } {
    const overdue: ApprovalRequest[] = [];
    const critical: ApprovalRequest[] = [];
    const approaching: ApprovalRequest[] = [];
    const normal: ApprovalRequest[] = [];

    for (const request of requests) {
      if (this.isOverdue(request)) {
        overdue.push(request);
      } else {
        const effectivePriority = this.calculatePriority(request);
        const slaProgress = this.getSLAProgress(request);

        if (effectivePriority === PRIORITY.CRITICAL) {
          critical.push(request);
        } else if (slaProgress >= 75) {
          approaching.push(request);
        } else {
          normal.push(request);
        }
      }
    }

    return { overdue, critical, approaching, normal };
  }

  /**
   * Get the current SLA thresholds
   */
  getThresholds(): Record<Priority, number> {
    return { ...this.slaThresholds };
  }

  /**
   * Update SLA thresholds
   */
  updateThresholds(newThresholds: Partial<Record<Priority, number>>): void {
    this.slaThresholds = {
      ...this.slaThresholds,
      ...newThresholds,
    };
  }
}

/**
 * Create a new PriorityManager instance with optional custom thresholds
 */
export function createPriorityManager(
  customThresholds?: Partial<Record<Priority, number>>
): PriorityManager {
  return new PriorityManager(customThresholds);
}

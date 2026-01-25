/**
 * Decision Processing Service for Human-in-the-Loop Workflows
 *
 * Handles recording, retrieving, and analyzing approval decisions
 * with support for metrics, undo functionality, and audit trails.
 */

import type {
  ApprovalDecision,
  DateRange,
} from './hitl-types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Decision outcome types
 */
export const DECISION_OUTCOME = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ESCALATED: 'escalated',
  DEFERRED: 'deferred',
} as const;

export type DecisionOutcome = (typeof DECISION_OUTCOME)[keyof typeof DECISION_OUTCOME];

/**
 * Filters for querying decisions
 */
export interface DecisionFilters {
  /** Filter by reviewer ID(s) */
  reviewerId?: string | string[];
  /** Filter by decision outcome */
  outcome?: DecisionOutcome | DecisionOutcome[];
  /** Filter by date range */
  dateRange?: DateRange;
  /** Filter by workflow ID */
  workflowId?: string;
  /** Filter by request ID */
  requestId?: string;
  /** Include only escalated decisions */
  escalatedOnly?: boolean;
  /** Include only undone decisions */
  undoneOnly?: boolean;
}

/**
 * Metrics for decision analysis
 */
export interface DecisionMetrics {
  /** Total number of decisions */
  totalDecisions: number;
  /** Number of approved decisions */
  approvedCount: number;
  /** Number of rejected decisions */
  rejectedCount: number;
  /** Number of escalated decisions */
  escalatedCount: number;
  /** Number of deferred decisions */
  deferredCount: number;
  /** Approval rate as a percentage (0-100) */
  approvalRate: number;
  /** Escalation rate as a percentage (0-100) */
  escalationRate: number;
  /** Average response time in milliseconds */
  avgResponseTime: number;
  /** Median response time in milliseconds */
  medianResponseTime: number;
  /** Minimum response time in milliseconds */
  minResponseTime: number;
  /** Maximum response time in milliseconds */
  maxResponseTime: number;
  /** 95th percentile response time in milliseconds */
  p95ResponseTime: number;
  /** Number of decisions undone */
  undoneCount: number;
  /** Breakdown by reviewer */
  byReviewer: Record<string, ReviewerMetrics>;
  /** Breakdown by time period (daily/weekly/monthly) */
  byTimePeriod?: TimePeriodMetrics[];
  /** Timestamp when metrics were calculated */
  calculatedAt: string;
}

/**
 * Metrics for individual reviewers
 */
export interface ReviewerMetrics {
  reviewerId: string;
  reviewerName: string;
  totalDecisions: number;
  approvedCount: number;
  rejectedCount: number;
  escalatedCount: number;
  approvalRate: number;
  avgResponseTime: number;
  lastDecisionAt?: string;
}

/**
 * Metrics grouped by time period
 */
export interface TimePeriodMetrics {
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  totalDecisions: number;
  approvedCount: number;
  rejectedCount: number;
  avgResponseTime: number;
}

/**
 * Extended decision record with additional metadata
 */
export interface DecisionRecord extends ApprovalDecision {
  /** Unique decision ID */
  id: string;
  /** Workflow ID this decision belongs to */
  workflowId?: string;
  /** Step ID this decision was made for */
  stepId?: string;
  /** Time taken to make the decision (in ms) */
  responseTime?: number;
  /** Whether this decision was escalated */
  isEscalated?: boolean;
  /** Whether this decision was undone */
  isUndone: boolean;
  /** Undo information if applicable */
  undoInfo?: UndoInfo;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Information about an undone decision
 */
export interface UndoInfo {
  undoneAt: string;
  undoneBy: string;
  reason: string;
  originalDecision: 'approved' | 'rejected';
}

/**
 * Result of a decision operation
 */
export interface DecisionOperationResult {
  success: boolean;
  decision?: DecisionRecord;
  error?: string;
  timestamp: string;
}

// ============================================================================
// In-memory storage for development
// ============================================================================

const decisionStorage: Map<string, DecisionRecord> = new Map();
const decisionsByRequest: Map<string, string[]> = new Map();
const decisionsByReviewer: Map<string, string[]> = new Map();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique decision ID
 */
function generateDecisionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `dec_${timestamp}_${random}`;
}

/**
 * Get current ISO timestamp
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Calculate median from an array of numbers
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate percentile from an array of numbers
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Check if a date is within a range
 */
function isWithinDateRange(date: string, range?: DateRange): boolean {
  if (!range) return true;
  const timestamp = new Date(date).getTime();
  if (range.start && timestamp < new Date(range.start).getTime()) return false;
  if (range.end && timestamp > new Date(range.end).getTime()) return false;
  return true;
}

/**
 * Match decision against filters
 */
function matchesFilters(decision: DecisionRecord, filters: DecisionFilters): boolean {
  // Reviewer filter
  if (filters.reviewerId) {
    const reviewerIds = Array.isArray(filters.reviewerId)
      ? filters.reviewerId
      : [filters.reviewerId];
    if (!reviewerIds.includes(decision.reviewer)) return false;
  }

  // Outcome filter
  if (filters.outcome) {
    const outcomes = Array.isArray(filters.outcome)
      ? filters.outcome
      : [filters.outcome];
    if (!outcomes.includes(decision.decision as DecisionOutcome)) return false;
  }

  // Date range filter
  if (!isWithinDateRange(decision.decidedAt, filters.dateRange)) return false;

  // Workflow filter
  if (filters.workflowId && decision.workflowId !== filters.workflowId) return false;

  // Request filter
  if (filters.requestId && decision.requestId !== filters.requestId) return false;

  // Escalated only - note: escalation is tracked via metadata, not decision type
  if (filters.escalatedOnly && !decision.isEscalated) return false;

  // Undone only
  if (filters.undoneOnly && !decision.isUndone) return false;

  return true;
}

// ============================================================================
// Decision Service Class
// ============================================================================

/**
 * Service for managing approval decisions
 */
export class DecisionService {
  private readonly _instanceId: string;

  constructor() {
    this._instanceId = `ds_${Date.now()}`;
    // Silence unused variable warning
    void this._instanceId;
  }

  /**
   * Record a new decision for an approval request
   */
  async recordDecision(
    requestId: string,
    decision: ApprovalDecision
  ): Promise<void> {
    const decisionId = generateDecisionId();
    const now = getCurrentTimestamp();

    const decisionRecord: DecisionRecord = {
      ...decision,
      id: decisionId,
      requestId,
      isUndone: false,
      createdAt: now,
      updatedAt: now,
    };

    // Store the decision
    decisionStorage.set(decisionId, decisionRecord);

    // Index by request
    const requestDecisions = decisionsByRequest.get(requestId) || [];
    requestDecisions.push(decisionId);
    decisionsByRequest.set(requestId, requestDecisions);

    // Index by reviewer
    const reviewerDecisions = decisionsByReviewer.get(decision.reviewer) || [];
    reviewerDecisions.push(decisionId);
    decisionsByReviewer.set(decision.reviewer, reviewerDecisions);
  }

  /**
   * Get all decisions for a specific request
   */
  async getDecisionHistory(requestId: string): Promise<ApprovalDecision[]> {
    const decisionIds = decisionsByRequest.get(requestId) || [];
    const decisions: ApprovalDecision[] = [];

    for (const id of decisionIds) {
      const decision = decisionStorage.get(id);
      if (decision && !decision.isUndone) {
        decisions.push({
          requestId: decision.requestId,
          decision: decision.decision,
          reviewer: decision.reviewer,
          comments: decision.comments,
          decidedAt: decision.decidedAt,
          additionalData: decision.additionalData,
        });
      }
    }

    // Sort by decision time (oldest first)
    return decisions.sort(
      (a, b) => new Date(a.decidedAt).getTime() - new Date(b.decidedAt).getTime()
    );
  }

  /**
   * Get all decisions made by a specific reviewer
   */
  async getDecisionsByReviewer(
    reviewerId: string,
    dateRange?: DateRange
  ): Promise<ApprovalDecision[]> {
    const decisionIds = decisionsByReviewer.get(reviewerId) || [];
    const decisions: ApprovalDecision[] = [];

    for (const id of decisionIds) {
      const decision = decisionStorage.get(id);
      if (decision && !decision.isUndone) {
        // Check date range if provided
        if (dateRange && !isWithinDateRange(decision.decidedAt, dateRange)) {
          continue;
        }

        decisions.push({
          requestId: decision.requestId,
          decision: decision.decision,
          reviewer: decision.reviewer,
          comments: decision.comments,
          decidedAt: decision.decidedAt,
          additionalData: decision.additionalData,
        });
      }
    }

    // Sort by decision time (newest first)
    return decisions.sort(
      (a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime()
    );
  }

  /**
   * Get comprehensive metrics about decisions
   */
  async getDecisionMetrics(filters?: DecisionFilters): Promise<DecisionMetrics> {
    const allDecisions = Array.from(decisionStorage.values());
    const filteredDecisions = filters
      ? allDecisions.filter((d) => matchesFilters(d, filters))
      : allDecisions;

    // Count by outcome
    let approvedCount = 0;
    let rejectedCount = 0;
    let escalatedCount = 0;
    let deferredCount = 0;
    let undoneCount = 0;
    const responseTimes: number[] = [];
    const reviewerStats: Record<string, {
      totalDecisions: number;
      approvedCount: number;
      rejectedCount: number;
      escalatedCount: number;
      responseTimes: number[];
      lastDecisionAt?: string;
    }> = {};

    for (const decision of filteredDecisions) {
      // Count outcomes
      switch (decision.decision) {
        case 'approved':
          approvedCount++;
          break;
        case 'rejected':
          rejectedCount++;
          break;
        // Note: 'escalated' and 'deferred' are tracked via isEscalated flag
        default:
          break;
      }

      if (decision.isUndone) {
        undoneCount++;
      }

      // Track response times
      if (decision.responseTime !== undefined) {
        responseTimes.push(decision.responseTime);
      }

      // Track reviewer stats
      if (!reviewerStats[decision.reviewer]) {
        reviewerStats[decision.reviewer] = {
          totalDecisions: 0,
          approvedCount: 0,
          rejectedCount: 0,
          escalatedCount: 0,
          responseTimes: [],
        };
      }

      const reviewerStat = reviewerStats[decision.reviewer];
      reviewerStat.totalDecisions++;

      if (decision.decision === 'approved') reviewerStat.approvedCount++;
      if (decision.decision === 'rejected') reviewerStat.rejectedCount++;
      if (decision.isEscalated) reviewerStat.escalatedCount++;

      if (decision.responseTime !== undefined) {
        reviewerStat.responseTimes.push(decision.responseTime);
      }

      if (
        !reviewerStat.lastDecisionAt ||
        new Date(decision.decidedAt) > new Date(reviewerStat.lastDecisionAt)
      ) {
        reviewerStat.lastDecisionAt = decision.decidedAt;
      }
    }

    const totalDecisions = filteredDecisions.length;
    const decidedCount = approvedCount + rejectedCount;

    // Calculate response time statistics
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;
    const medianResponseTime = calculateMedian(responseTimes);
    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const p95ResponseTime = calculatePercentile(responseTimes, 95);

    // Build reviewer metrics
    const byReviewer: Record<string, ReviewerMetrics> = {};
    for (const [reviewerId, stats] of Object.entries(reviewerStats)) {
      byReviewer[reviewerId] = {
        reviewerId,
        reviewerName: reviewerId, // Would be resolved from user service in production
        totalDecisions: stats.totalDecisions,
        approvedCount: stats.approvedCount,
        rejectedCount: stats.rejectedCount,
        escalatedCount: stats.escalatedCount,
        approvalRate:
          stats.approvedCount + stats.rejectedCount > 0
            ? (stats.approvedCount / (stats.approvedCount + stats.rejectedCount)) * 100
            : 0,
        avgResponseTime:
          stats.responseTimes.length > 0
            ? stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
            : 0,
        lastDecisionAt: stats.lastDecisionAt,
      };
    }

    return {
      totalDecisions,
      approvedCount,
      rejectedCount,
      escalatedCount,
      deferredCount,
      approvalRate: decidedCount > 0 ? (approvedCount / decidedCount) * 100 : 0,
      escalationRate: totalDecisions > 0 ? (escalatedCount / totalDecisions) * 100 : 0,
      avgResponseTime,
      medianResponseTime,
      minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      undoneCount,
      byReviewer,
      calculatedAt: getCurrentTimestamp(),
    };
  }

  /**
   * Undo a previously made decision
   */
  async undoDecision(decisionId: string, reason: string): Promise<void> {
    const decision = decisionStorage.get(decisionId);

    if (!decision) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    if (decision.isUndone) {
      throw new Error(`Decision ${decisionId} has already been undone`);
    }

    const now = getCurrentTimestamp();

    // Update the decision with undo information
    decision.isUndone = true;
    decision.undoInfo = {
      undoneAt: now,
      undoneBy: 'system', // Would be the current user in production
      reason,
      originalDecision: decision.decision as 'approved' | 'rejected',
    };
    decision.updatedAt = now;

    decisionStorage.set(decisionId, decision);
  }

  /**
   * Get a specific decision by ID
   */
  async getDecisionById(decisionId: string): Promise<DecisionRecord | null> {
    return decisionStorage.get(decisionId) || null;
  }

  /**
   * Get all decisions with optional filters
   */
  async getAllDecisions(filters?: DecisionFilters): Promise<DecisionRecord[]> {
    const allDecisions = Array.from(decisionStorage.values());

    if (!filters) {
      return allDecisions.sort(
        (a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime()
      );
    }

    return allDecisions
      .filter((d) => matchesFilters(d, filters))
      .sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime());
  }

  /**
   * Get decisions that need follow-up (e.g., pending escalations)
   */
  async getPendingFollowUps(): Promise<DecisionRecord[]> {
    return Array.from(decisionStorage.values())
      .filter(
        (d) =>
          d.isEscalated &&
          !d.isUndone &&
          d.additionalData?.requiresFollowUp === true
      )
      .sort((a, b) => new Date(a.decidedAt).getTime() - new Date(b.decidedAt).getTime());
  }

  /**
   * Record decision with full context (including workflow and step info)
   */
  async recordDecisionWithContext(
    requestId: string,
    decision: ApprovalDecision,
    context: {
      workflowId?: string;
      stepId?: string;
      requestCreatedAt?: string;
    }
  ): Promise<DecisionRecord> {
    const decisionId = generateDecisionId();
    const now = getCurrentTimestamp();

    // Calculate response time if request creation time is provided
    let responseTime: number | undefined;
    if (context.requestCreatedAt) {
      responseTime =
        new Date(now).getTime() - new Date(context.requestCreatedAt).getTime();
    }

    const decisionRecord: DecisionRecord = {
      ...decision,
      id: decisionId,
      requestId,
      workflowId: context.workflowId,
      stepId: context.stepId,
      responseTime,
      isUndone: false,
      createdAt: now,
      updatedAt: now,
    };

    // Store the decision
    decisionStorage.set(decisionId, decisionRecord);

    // Index by request
    const requestDecisions = decisionsByRequest.get(requestId) || [];
    requestDecisions.push(decisionId);
    decisionsByRequest.set(requestId, requestDecisions);

    // Index by reviewer
    const reviewerDecisions = decisionsByReviewer.get(decision.reviewer) || [];
    reviewerDecisions.push(decisionId);
    decisionsByReviewer.set(decision.reviewer, reviewerDecisions);

    return decisionRecord;
  }

  /**
   * Clear all stored decisions (for testing purposes)
   */
  async clearAllDecisions(): Promise<void> {
    decisionStorage.clear();
    decisionsByRequest.clear();
    decisionsByReviewer.clear();
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

let decisionServiceInstance: DecisionService | null = null;

/**
 * Get the singleton DecisionService instance
 */
export function getDecisionService(): DecisionService {
  if (!decisionServiceInstance) {
    decisionServiceInstance = new DecisionService();
  }
  return decisionServiceInstance;
}

/**
 * Reset the DecisionService instance (for testing)
 */
export function resetDecisionService(): void {
  decisionServiceInstance = null;
}

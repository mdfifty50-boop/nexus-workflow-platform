/**
 * Human-in-the-Loop (HITL) Approval Queue Type Definitions
 * Provides type-safe interfaces for workflow approval management
 */

// Status constants (no enums per TypeScript rules)
export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ESCALATED: 'escalated',
  EXPIRED: 'expired',
} as const;

export type ApprovalStatus = (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];

// Request type constants
export const REQUEST_TYPE = {
  DATA_VALIDATION: 'data_validation',
  CONTENT_REVIEW: 'content_review',
  EXTERNAL_APPROVAL: 'external_approval',
  EXCEPTION_HANDLING: 'exception_handling',
  COMPLIANCE_CHECK: 'compliance_check',
} as const;

export type RequestType = (typeof REQUEST_TYPE)[keyof typeof REQUEST_TYPE];

// Priority constants
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY];

/**
 * Metadata that can be attached to an approval request
 */
export interface ApprovalMetadata {
  /** Data being validated or reviewed */
  data?: Record<string, unknown>;
  /** Previous approval attempts */
  previousAttempts?: number;
  /** Escalation history */
  escalationHistory?: EscalationRecord[];
  /** Custom fields for specific request types */
  customFields?: Record<string, unknown>;
  /** Original workflow step context */
  stepContext?: {
    inputData?: Record<string, unknown>;
    expectedOutput?: Record<string, unknown>;
    validationRules?: string[];
  };
}

/**
 * Record of an escalation event
 */
export interface EscalationRecord {
  escalatedAt: string;
  escalatedBy: string;
  reason: string;
  escalatedTo?: string;
}

/**
 * Core approval request interface
 */
export interface ApprovalRequest {
  /** Unique identifier for the request */
  id: string;
  /** ID of the workflow this request belongs to */
  workflowId: string;
  /** Human-readable name of the workflow */
  workflowName: string;
  /** ID of the specific step requiring approval */
  stepId: string;
  /** Human-readable name of the step */
  stepName: string;
  /** Type of approval required */
  requestType: RequestType;
  /** Priority level of the request */
  priority: Priority;
  /** Current status of the request */
  status: ApprovalStatus;
  /** User or system that created the request */
  requester: string;
  /** User assigned to review the request (optional) */
  assignee?: string;
  /** Due date for the approval decision */
  dueDate: string;
  /** Additional metadata for the request */
  metadata: ApprovalMetadata;
  /** ISO timestamp when request was created */
  createdAt: string;
  /** ISO timestamp when request was last updated */
  updatedAt: string;
}

/**
 * Decision made on an approval request
 */
export interface ApprovalDecision {
  /** ID of the request being decided */
  requestId: string;
  /** The decision made */
  decision: 'approved' | 'rejected';
  /** User who made the decision */
  reviewer: string;
  /** Optional comments explaining the decision */
  comments?: string;
  /** ISO timestamp when decision was made */
  decidedAt: string;
  /** Additional data provided with the decision */
  additionalData?: Record<string, unknown>;
}

/**
 * Date range filter
 */
export interface DateRange {
  start?: string;
  end?: string;
}

/**
 * Filters for querying approval requests
 */
export interface ApprovalQueueFilters {
  /** Filter by status(es) */
  status?: ApprovalStatus | ApprovalStatus[];
  /** Filter by priority(ies) */
  priority?: Priority | Priority[];
  /** Filter by assignee */
  assignee?: string;
  /** Filter by workflow ID */
  workflowId?: string;
  /** Filter by request type */
  requestType?: RequestType | RequestType[];
  /** Filter by date range (based on createdAt) */
  dateRange?: DateRange;
  /** Filter by requester */
  requester?: string;
  /** Include expired requests */
  includeExpired?: boolean;
}

/**
 * Statistics about the approval queue
 */
export interface QueueStats {
  /** Total number of requests */
  total: number;
  /** Breakdown by status */
  byStatus: Record<ApprovalStatus, number>;
  /** Breakdown by priority */
  byPriority: Record<Priority, number>;
  /** Breakdown by request type */
  byRequestType: Record<RequestType, number>;
  /** Number of overdue requests */
  overdue: number;
  /** Number of unassigned requests */
  unassigned: number;
  /** Average time to resolution (in milliseconds) */
  averageResolutionTime?: number;
  /** Timestamp when stats were calculated */
  calculatedAt: string;
}

/**
 * Event emitted when approval request state changes
 */
export interface ApprovalEvent {
  type: 'created' | 'updated' | 'assigned' | 'escalated' | 'decided' | 'expired';
  request: ApprovalRequest;
  decision?: ApprovalDecision;
  timestamp: string;
}

/**
 * Configuration options for the approval queue
 */
export interface ApprovalQueueConfig {
  /** Default SLA thresholds in milliseconds by priority */
  slaThresholds?: Record<Priority, number>;
  /** Whether to auto-expire overdue requests */
  autoExpire?: boolean;
  /** Interval for checking expired requests (in milliseconds) */
  expirationCheckInterval?: number;
  /** Maximum number of escalation attempts */
  maxEscalations?: number;
}

/**
 * Input for creating a new approval request
 */
export type CreateApprovalRequestInput = Omit<
  ApprovalRequest,
  'id' | 'status' | 'createdAt' | 'updatedAt' | 'dueDate'
> & {
  dueDate?: string;
};

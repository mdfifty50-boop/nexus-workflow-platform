/**
 * Component prop types for Human-in-the-Loop (HITL) Review Interface
 */

import type {
  ApprovalRequest,
  ApprovalStatus,
  Priority,
  RequestType,
  ApprovalQueueFilters,
  ApprovalDecision,
} from '@/lib/hitl/hitl-types';

/**
 * Sort options for approval queue
 */
export const SORT_OPTIONS = {
  DATE_ASC: 'date_asc',
  DATE_DESC: 'date_desc',
  PRIORITY_ASC: 'priority_asc',
  PRIORITY_DESC: 'priority_desc',
  DUE_DATE_ASC: 'due_date_asc',
  DUE_DATE_DESC: 'due_date_desc',
} as const;

export type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];

/**
 * Decision type for approval actions
 */
export const DECISION_TYPE = {
  APPROVE: 'approve',
  REJECT: 'reject',
  ESCALATE: 'escalate',
  REQUEST_INFO: 'request_info',
} as const;

export type DecisionType = (typeof DECISION_TYPE)[keyof typeof DECISION_TYPE];

/**
 * Props for the ApprovalCard component
 * Displays a single approval request with details and quick actions
 */
export interface ApprovalCardProps {
  /** The approval request to display */
  request: ApprovalRequest;
  /** Whether the card is in expanded state */
  expanded?: boolean;
  /** Callback when expand/collapse is toggled */
  onToggleExpand?: () => void;
  /** Callback when approve action is clicked */
  onApprove?: (requestId: string) => void;
  /** Callback when reject action is clicked */
  onReject?: (requestId: string) => void;
  /** Callback when escalate action is clicked */
  onEscalate?: (requestId: string) => void;
  /** Callback when request more info action is clicked */
  onRequestInfo?: (requestId: string) => void;
  /** Callback when card is clicked for full details */
  onViewDetails?: (requestId: string) => void;
  /** Whether actions are currently loading */
  isLoading?: boolean;
  /** Whether to show quick action buttons */
  showQuickActions?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the ApprovalQueueList component
 * Displays a list of pending approvals with filtering and sorting
 */
export interface ApprovalQueueListProps {
  /** Array of approval requests to display */
  requests: ApprovalRequest[];
  /** Current filter configuration */
  filters?: ApprovalQueueFilters;
  /** Callback when filters change */
  onFiltersChange?: (filters: ApprovalQueueFilters) => void;
  /** Current sort option */
  sortBy?: SortOption;
  /** Callback when sort option changes */
  onSortChange?: (sort: SortOption) => void;
  /** Current page number (0-indexed) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Total number of items (for pagination) */
  totalItems?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Callback when approve action is clicked */
  onApprove?: (requestId: string) => void;
  /** Callback when reject action is clicked */
  onReject?: (requestId: string) => void;
  /** Callback when escalate action is clicked */
  onEscalate?: (requestId: string) => void;
  /** Callback when request is selected for detailed review */
  onSelectRequest?: (request: ApprovalRequest) => void;
  /** Whether the list is loading */
  isLoading?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the ReviewPanel component
 * Full detailed review panel for a single approval request
 */
export interface ReviewPanelProps {
  /** The approval request being reviewed */
  request: ApprovalRequest | null;
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Callback when a decision is made */
  onDecision?: (decision: ApprovalDecision) => void;
  /** Callback when escalation is requested */
  onEscalate?: (requestId: string, reason: string, escalateTo?: string) => void;
  /** Callback when more information is requested */
  onRequestInfo?: (requestId: string, questions: string) => void;
  /** Whether actions are loading */
  isLoading?: boolean;
  /** Available escalation targets */
  escalationTargets?: Array<{ id: string; name: string; role?: string }>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the DecisionButtons component
 * Action buttons for making approval decisions
 */
export interface DecisionButtonsProps {
  /** ID of the request to act on */
  requestId: string;
  /** Current status of the request */
  status: ApprovalStatus;
  /** Callback when approve is clicked */
  onApprove?: (requestId: string, comments?: string) => void;
  /** Callback when reject is clicked */
  onReject?: (requestId: string, reason: string) => void;
  /** Callback when escalate is clicked */
  onEscalate?: (requestId: string, reason: string) => void;
  /** Callback when request info is clicked */
  onRequestInfo?: (requestId: string, questions: string) => void;
  /** Whether any action is currently loading */
  isLoading?: boolean;
  /** Which action is currently loading (if any) */
  loadingAction?: DecisionType | null;
  /** Whether to show confirmation dialogs */
  requireConfirmation?: boolean;
  /** Disabled state for all buttons */
  disabled?: boolean;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Filter control configuration
 */
export interface FilterControlConfig {
  /** Available status options */
  statusOptions?: ApprovalStatus[];
  /** Available priority options */
  priorityOptions?: Priority[];
  /** Available request type options */
  requestTypeOptions?: RequestType[];
  /** Available assignees for filtering */
  assigneeOptions?: Array<{ id: string; name: string }>;
  /** Whether to show date range filter */
  showDateRange?: boolean;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /** Current page (0-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Available page size options */
  pageSizeOptions?: number[];
}

/**
 * Due date indicator state
 */
export interface DueDateState {
  /** Time remaining or overdue text */
  text: string;
  /** Whether the request is overdue */
  isOverdue: boolean;
  /** Whether the deadline is approaching urgently */
  isUrgent: boolean;
  /** Severity level for styling */
  severity: 'normal' | 'warning' | 'danger';
}

/**
 * Priority configuration for display
 */
export interface PriorityConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon?: string;
}

/**
 * Request type configuration for display
 */
export interface RequestTypeConfig {
  label: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * Confirmation dialog state
 */
export interface ConfirmationDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  action: DecisionType | null;
  requiresReason: boolean;
  reason?: string;
}

/**
 * ApprovalCard Component
 * Displays a single approval request with details and quick action buttons
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PRIORITY,
  REQUEST_TYPE,
  APPROVAL_STATUS,
} from '@/lib/hitl/hitl-types';
import type { Priority, RequestType } from '@/lib/hitl/hitl-types';
import type { ApprovalCardProps, DueDateState, PriorityConfig, RequestTypeConfig } from './hitl-component-types';

// Priority display configuration
const PRIORITY_CONFIG: Record<Priority, PriorityConfig> = {
  [PRIORITY.LOW]: {
    label: 'Low',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
  },
  [PRIORITY.MEDIUM]: {
    label: 'Medium',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  [PRIORITY.HIGH]: {
    label: 'High',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  [PRIORITY.CRITICAL]: {
    label: 'Critical',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
};

// Request type display configuration
const REQUEST_TYPE_CONFIG: Record<RequestType, RequestTypeConfig> = {
  [REQUEST_TYPE.DATA_VALIDATION]: {
    label: 'Data Validation',
    description: 'Validate data before processing',
    icon: 'FileCheck',
    color: 'text-cyan-400',
  },
  [REQUEST_TYPE.CONTENT_REVIEW]: {
    label: 'Content Review',
    description: 'Review content before publishing',
    icon: 'FileText',
    color: 'text-purple-400',
  },
  [REQUEST_TYPE.EXTERNAL_APPROVAL]: {
    label: 'External Approval',
    description: 'Approval from external party',
    icon: 'UserCheck',
    color: 'text-green-400',
  },
  [REQUEST_TYPE.EXCEPTION_HANDLING]: {
    label: 'Exception',
    description: 'Handle workflow exception',
    icon: 'AlertTriangle',
    color: 'text-orange-400',
  },
  [REQUEST_TYPE.COMPLIANCE_CHECK]: {
    label: 'Compliance',
    description: 'Compliance verification required',
    icon: 'Shield',
    color: 'text-blue-400',
  },
};

/**
 * Calculate due date state from ISO string
 */
function calculateDueDateState(dueDate: string): DueDateState {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffMs < 0) {
    const absDiffHours = Math.abs(diffHours);
    return {
      text: absDiffHours > 24 ? `${Math.floor(absDiffHours / 24)}d overdue` : `${absDiffHours}h overdue`,
      isOverdue: true,
      isUrgent: true,
      severity: 'danger',
    };
  }

  if (diffHours < 2) {
    return {
      text: diffHours < 1 ? `${diffMins}m left` : `${diffHours}h ${diffMins}m left`,
      isOverdue: false,
      isUrgent: true,
      severity: 'danger',
    };
  }

  if (diffHours < 8) {
    return {
      text: `${diffHours}h left`,
      isOverdue: false,
      isUrgent: true,
      severity: 'warning',
    };
  }

  if (diffHours < 24) {
    return {
      text: `${diffHours}h left`,
      isOverdue: false,
      isUrgent: false,
      severity: 'normal',
    };
  }

  const diffDays = Math.floor(diffHours / 24);
  return {
    text: `${diffDays}d left`,
    isOverdue: false,
    isUrgent: false,
    severity: 'normal',
  };
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

/**
 * Icon components
 */
function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChevronDownIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CheckCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AlertTriangleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function UserIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function WorkflowIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function ExternalLinkIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

/**
 * ApprovalCard Component
 */
export function ApprovalCard({
  request,
  expanded = false,
  onToggleExpand,
  onApprove,
  onReject,
  onEscalate,
  onRequestInfo,
  onViewDetails,
  isLoading = false,
  showQuickActions = true,
  className,
}: ApprovalCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const priorityConfig = PRIORITY_CONFIG[request.priority];
  const typeConfig = REQUEST_TYPE_CONFIG[request.requestType];
  const dueDateState = calculateDueDateState(request.dueDate);
  const isPending = request.status === APPROVAL_STATUS.PENDING;

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
    onToggleExpand?.();
  }, [onToggleExpand]);

  const handleApprove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onApprove?.(request.id);
  }, [onApprove, request.id]);

  const handleReject = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onReject?.(request.id);
  }, [onReject, request.id]);

  const handleEscalate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEscalate?.(request.id);
  }, [onEscalate, request.id]);

  const _handleRequestInfo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestInfo?.(request.id);
  }, [onRequestInfo, request.id]);
  void _handleRequestInfo; // Satisfy unused variable rule

  const handleViewDetails = useCallback(() => {
    onViewDetails?.(request.id);
  }, [onViewDetails, request.id]);

  return (
    <Card
      className={cn(
        'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-all cursor-pointer',
        request.priority === PRIORITY.CRITICAL && 'border-red-500/30 hover:border-red-500/50',
        dueDateState.isOverdue && 'border-red-500/50',
        className
      )}
      onClick={handleViewDetails}
    >
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start gap-3">
          {/* Expand Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpand();
            }}
            className="p-1 rounded hover:bg-slate-700/50 transition-colors mt-0.5"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Title and Badges */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="text-white font-medium truncate">{request.stepName}</h4>
                  <Badge
                    className={cn(
                      'text-xs border',
                      priorityConfig.bgColor,
                      priorityConfig.color,
                      priorityConfig.borderColor
                    )}
                  >
                    {priorityConfig.label}
                  </Badge>
                  <Badge
                    className={cn(
                      'text-xs bg-slate-700/50 text-slate-300 border-slate-600/50'
                    )}
                  >
                    <span className={cn('mr-1', typeConfig.color)}>*</span>
                    {typeConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 line-clamp-1">
                  {request.workflowName} - Step: {request.stepId}
                </p>
              </div>

              {/* Quick Actions */}
              {showQuickActions && isPending && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleReject}
                    disabled={isLoading}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    aria-label="Reject"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEscalate}
                    disabled={isLoading}
                    className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    aria-label="Escalate"
                  >
                    <AlertTriangleIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={isLoading}
                    loading={isLoading}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </div>
              )}
            </div>

            {/* Meta Information Row */}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <WorkflowIcon className="w-3 h-3" />
                {request.workflowName}
              </span>
              <span className="flex items-center gap-1">
                <UserIcon className="w-3 h-3" />
                {request.requester}
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {formatRelativeTime(request.createdAt)}
              </span>
              <span
                className={cn(
                  'flex items-center gap-1 font-medium',
                  dueDateState.severity === 'danger' && 'text-red-400',
                  dueDateState.severity === 'warning' && 'text-amber-400',
                  dueDateState.severity === 'normal' && 'text-slate-400'
                )}
              >
                <ClockIcon className="w-3 h-3" />
                {dueDateState.text}
              </span>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Assignee Info */}
                {request.assignee && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">Assigned to:</span>
                    <span className="text-slate-300 font-medium">{request.assignee}</span>
                  </div>
                )}

                {/* Metadata Preview */}
                {request.metadata.data && Object.keys(request.metadata.data).length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-2">Request Data</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(request.metadata.data).slice(0, 6).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}: </span>
                          <span className="text-slate-300">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step Context */}
                {request.metadata.stepContext && (
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-2">Step Context</div>
                    {request.metadata.stepContext.validationRules && (
                      <div className="flex flex-wrap gap-1">
                        {request.metadata.stepContext.validationRules.map((rule, index) => (
                          <Badge key={index} variant="outline" className="text-xs text-slate-400 border-slate-600">
                            {rule}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Escalation History */}
                {request.metadata.escalationHistory && request.metadata.escalationHistory.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <div className="text-xs text-amber-400 mb-2 flex items-center gap-1">
                      <AlertTriangleIcon className="w-3 h-3" />
                      Escalation History ({request.metadata.escalationHistory.length})
                    </div>
                    <div className="space-y-2">
                      {request.metadata.escalationHistory.map((record, index) => (
                        <div key={index} className="text-sm text-slate-400">
                          <span className="text-slate-500">
                            {formatRelativeTime(record.escalatedAt)}:
                          </span>{' '}
                          {record.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Full Details Button */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails();
                    }}
                    className="text-slate-300"
                  >
                    <ExternalLinkIcon className="w-4 h-4 mr-1" />
                    View Full Details
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ApprovalCard;

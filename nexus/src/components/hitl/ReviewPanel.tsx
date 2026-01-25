/**
 * ReviewPanel - Full Review Panel for HITL Approval Requests
 * Displays request details, workflow context, and allows decision making
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  ApprovalRequest,
  ApprovalStatus,
  Priority,
  ApprovalDecision,
} from '../../lib/hitl/hitl-types';
import { APPROVAL_STATUS, PRIORITY, REQUEST_TYPE } from '../../lib/hitl/hitl-types';
import { PriorityManager } from '../../lib/hitl/priority-manager';

// ========================================
// Types
// ========================================

interface ReviewPanelProps {
  /** The approval request to review */
  request: ApprovalRequest;
  /** Callback when a decision is made */
  onDecision: (decision: ApprovalDecision) => void | Promise<void>;
  /** Callback when panel is closed */
  onClose?: () => void;
  /** Related approvals for context */
  relatedApprovals?: ApprovalRequest[];
  /** Activity timeline entries */
  activityTimeline?: ActivityEntry[];
  /** Current user's ID */
  currentUserId?: string;
  /** Whether to show in expanded mode */
  expanded?: boolean;
  /** Custom CSS class */
  className?: string;
}

interface ActivityEntry {
  id: string;
  type: 'created' | 'assigned' | 'commented' | 'escalated' | 'updated' | 'status_changed';
  timestamp: string;
  actor: string;
  description: string;
  metadata?: Record<string, unknown>;
}

// Comment interface reserved for future rich comment support
// interface Comment { id: string; text: string; author: string; timestamp: string; isRichText?: boolean; }

// ========================================
// Constants
// ========================================

const STATUS_COLORS: Record<ApprovalStatus, { bg: string; text: string; border: string }> = {
  [APPROVAL_STATUS.PENDING]: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  [APPROVAL_STATUS.APPROVED]: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  [APPROVAL_STATUS.REJECTED]: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  [APPROVAL_STATUS.ESCALATED]: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  [APPROVAL_STATUS.EXPIRED]: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
};

const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; icon: string }> = {
  [PRIORITY.CRITICAL]: { bg: 'bg-red-500/20', text: 'text-red-400', icon: '!!' },
  [PRIORITY.HIGH]: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: '!' },
  [PRIORITY.MEDIUM]: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '-' },
  [PRIORITY.LOW]: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: '' },
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  [REQUEST_TYPE.DATA_VALIDATION]: 'Data Validation',
  [REQUEST_TYPE.CONTENT_REVIEW]: 'Content Review',
  [REQUEST_TYPE.EXTERNAL_APPROVAL]: 'External Approval',
  [REQUEST_TYPE.EXCEPTION_HANDLING]: 'Exception Handling',
  [REQUEST_TYPE.COMPLIANCE_CHECK]: 'Compliance Check',
};

// ========================================
// Helper Components
// ========================================

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const colors = PRIORITY_COLORS[priority];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
      {colors.icon && <span className="mr-1">{colors.icon}</span>}
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

function ExpandableSection({
  title,
  defaultExpanded = false,
  children,
}: {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
      >
        <span className="text-sm font-medium text-slate-200">{title}</span>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-4 py-3 bg-slate-900/30">
          {children}
        </div>
      )}
    </div>
  );
}

function SLAProgress({ request }: { request: ApprovalRequest }) {
  const priorityManager = useMemo(() => new PriorityManager(), []);
  const progress = priorityManager.getSLAProgress(request);
  const isOverdue = priorityManager.isOverdue(request);
  const timeRemaining = priorityManager.getTimeRemaining(request);

  const formatTimeRemaining = (ms: number): string => {
    const absMs = Math.abs(ms);
    const hours = Math.floor(absMs / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  let progressColor = 'bg-green-500';
  if (progress >= 90) progressColor = 'bg-red-500';
  else if (progress >= 75) progressColor = 'bg-orange-500';
  else if (progress >= 50) progressColor = 'bg-yellow-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">SLA Progress</span>
        <span className={isOverdue ? 'text-red-400' : 'text-slate-300'}>
          {isOverdue ? 'Overdue by ' : ''}{formatTimeRemaining(timeRemaining)}
          {!isOverdue && ' remaining'}
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${progressColor} transition-all duration-300`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}

function CommentInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [isRichText, setIsRichText] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">Comments</label>
        <button
          type="button"
          onClick={() => setIsRichText(!isRichText)}
          className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
        >
          {isRichText ? 'Plain text' : 'Rich text'}
        </button>
      </div>
      {isRichText ? (
        <div className="border border-slate-600 rounded-lg overflow-hidden">
          {/* Rich text toolbar */}
          <div className="flex items-center gap-1 px-2 py-1 border-b border-slate-600 bg-slate-800/50">
            <button type="button" className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
              <span className="font-bold text-xs">B</span>
            </button>
            <button type="button" className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
              <span className="italic text-xs">I</span>
            </button>
            <button type="button" className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
              <span className="underline text-xs">U</span>
            </button>
            <div className="w-px h-4 bg-slate-600 mx-1" />
            <button type="button" className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h10" />
              </svg>
            </button>
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full h-24 px-3 py-2 bg-slate-900/50 text-slate-200 placeholder-slate-500 resize-none focus:outline-none"
          />
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-24 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
        />
      )}
    </div>
  );
}

function DecisionConfirmModal({
  decision,
  onConfirm,
  onCancel,
}: {
  decision: 'approved' | 'rejected';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
        <div className="p-6">
          <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${decision === 'approved' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {decision === 'approved' ? (
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white text-center">
            Confirm {decision === 'approved' ? 'Approval' : 'Rejection'}
          </h3>
          <p className="mt-2 text-sm text-slate-400 text-center">
            Are you sure you want to {decision === 'approved' ? 'approve' : 'reject'} this request? This action cannot be undone.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                decision === 'approved'
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              {decision === 'approved' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Main Component
// ========================================

export function ReviewPanel({
  request,
  onDecision,
  onClose,
  relatedApprovals = [],
  activityTimeline = [],
  currentUserId = 'current-user',
  expanded: _expanded = false,
  className = '',
}: ReviewPanelProps) {
  void _expanded; // Reserved for future expanded mode toggle
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDecision, setConfirmDecision] = useState<'approved' | 'rejected' | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'context' | 'history'>('details');

  // Format the created date
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Handle decision submission
  const handleDecision = useCallback(async (decision: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      const approvalDecision: ApprovalDecision = {
        requestId: request.id,
        decision,
        reviewer: currentUserId,
        comments: comments || undefined,
        decidedAt: new Date().toISOString(),
      };

      await onDecision(approvalDecision);
      setConfirmDecision(null);
      setComments('');
    } catch (error) {
      console.error('[ReviewPanel] Decision error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [request.id, currentUserId, comments, onDecision]);

  // Check if request is still actionable
  const isActionable = request.status === APPROVAL_STATUS.PENDING ||
    request.status === APPROVAL_STATUS.ESCALATED;

  // Extract custom fields safely
  const customFields = (request.metadata?.customFields ?? {}) as Record<string, unknown>;
  const riskLevel = customFields.riskLevel as string | undefined;
  const estimatedImpact = customFields.estimatedImpact as Record<string, unknown> | undefined;
  const reason = customFields.reason as string | undefined;
  const displayMessage = customFields.displayMessage as string | undefined;

  return (
    <div className={`bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-slate-700/50">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">{request.stepName}</h2>
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
          <p className="mt-1 text-sm text-slate-400">{request.workflowName}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        {(['details', 'context', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-700/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/20'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* SLA Progress */}
            <SLAProgress request={request} />

            {/* Request Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Request Type</span>
                <p className="text-sm text-slate-200 mt-1">
                  {REQUEST_TYPE_LABELS[request.requestType] ?? request.requestType}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Requester</span>
                <p className="text-sm text-slate-200 mt-1">{request.requester}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Created</span>
                <p className="text-sm text-slate-200 mt-1">{formatDate(request.createdAt)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Due Date</span>
                <p className="text-sm text-slate-200 mt-1">{formatDate(request.dueDate)}</p>
              </div>
              {request.assignee && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Assignee</span>
                  <p className="text-sm text-slate-200 mt-1">{request.assignee}</p>
                </div>
              )}
              {riskLevel && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Risk Level</span>
                  <p className={`text-sm mt-1 ${
                    riskLevel === 'critical' ? 'text-red-400' :
                    riskLevel === 'high' ? 'text-orange-400' :
                    riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
                  </p>
                </div>
              )}
            </div>

            {/* Reason */}
            {(reason || displayMessage) && (
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Reason for Review</span>
                <p className="text-sm text-slate-200 mt-2 p-3 bg-slate-900/50 rounded-lg">
                  {displayMessage || reason}
                </p>
              </div>
            )}

            {/* Estimated Impact */}
            {estimatedImpact && (
              <ExpandableSection title="Estimated Impact" defaultExpanded>
                <div className="grid grid-cols-3 gap-4">
                  {estimatedImpact.affectedRecords !== undefined && (
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-white">
                        {(estimatedImpact.affectedRecords as number).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Affected Records</p>
                    </div>
                  )}
                  {estimatedImpact.estimatedCost !== undefined && (
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-white">
                        ${(estimatedImpact.estimatedCost as number).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Estimated Cost</p>
                    </div>
                  )}
                  {estimatedImpact.reversible !== undefined && (
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <p className={`text-2xl font-bold ${estimatedImpact.reversible ? 'text-green-400' : 'text-red-400'}`}>
                        {estimatedImpact.reversible ? 'Yes' : 'No'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Reversible</p>
                    </div>
                  )}
                </div>
              </ExpandableSection>
            )}

            {/* Data Preview */}
            {request.metadata?.data && (
              <ExpandableSection title="Request Data">
                <pre className="text-xs text-slate-300 overflow-auto max-h-48 p-3 bg-slate-900/50 rounded-lg">
                  {JSON.stringify(request.metadata.data, null, 2)}
                </pre>
              </ExpandableSection>
            )}
          </div>
        )}

        {activeTab === 'context' && (
          <div className="space-y-6">
            {/* Workflow Context */}
            {request.metadata?.stepContext && (
              <ExpandableSection title="Step Context" defaultExpanded>
                <div className="space-y-4">
                  {request.metadata.stepContext.inputData && (
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Input Data</span>
                      <pre className="mt-2 text-xs text-slate-300 overflow-auto max-h-32 p-3 bg-slate-900/50 rounded-lg">
                        {JSON.stringify(request.metadata.stepContext.inputData, null, 2)}
                      </pre>
                    </div>
                  )}
                  {request.metadata.stepContext.expectedOutput && (
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Expected Output</span>
                      <pre className="mt-2 text-xs text-slate-300 overflow-auto max-h-32 p-3 bg-slate-900/50 rounded-lg">
                        {JSON.stringify(request.metadata.stepContext.expectedOutput, null, 2)}
                      </pre>
                    </div>
                  )}
                  {request.metadata.stepContext.validationRules && (
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Validation Rules</span>
                      <ul className="mt-2 space-y-1">
                        {request.metadata.stepContext.validationRules.map((rule: string, index: number) => (
                          <li key={index} className="text-sm text-slate-300 flex items-center gap-2">
                            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                            </svg>
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ExpandableSection>
            )}

            {/* Related Approvals */}
            {relatedApprovals.length > 0 && (
              <ExpandableSection title={`Related Approvals (${relatedApprovals.length})`}>
                <div className="space-y-2">
                  {relatedApprovals.map((related) => (
                    <div
                      key={related.id}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-200">{related.stepName}</p>
                        <p className="text-xs text-slate-400">{related.workflowName}</p>
                      </div>
                      <StatusBadge status={related.status} />
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            )}

            {/* Escalation History */}
            {request.metadata?.escalationHistory && request.metadata.escalationHistory.length > 0 && (
              <ExpandableSection title="Escalation History">
                <div className="space-y-3">
                  {request.metadata.escalationHistory.map((escalation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-200">
                            Escalated by {escalation.escalatedBy}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(escalation.escalatedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{escalation.reason}</p>
                        {escalation.escalatedTo && (
                          <p className="text-xs text-purple-400 mt-1">
                            Assigned to: {escalation.escalatedTo}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Activity Timeline */}
            {activityTimeline.length > 0 ? (
              <div className="space-y-4">
                {activityTimeline.map((activity, index) => {
                  const isLast = index === activityTimeline.length - 1;
                  return (
                    <div key={activity.id} className="flex gap-4">
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'created' ? 'bg-green-500/20' :
                          activity.type === 'escalated' ? 'bg-purple-500/20' :
                          activity.type === 'status_changed' ? 'bg-blue-500/20' :
                          'bg-slate-500/20'
                        }`}>
                          {activity.type === 'created' && (
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          )}
                          {activity.type === 'escalated' && (
                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                          )}
                          {activity.type === 'commented' && (
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          )}
                          {(activity.type === 'assigned' || activity.type === 'updated' || activity.type === 'status_changed') && (
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                        </div>
                        {!isLast && (
                          <div className="w-0.5 h-full bg-slate-700 mt-2" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-200">{activity.actor}</span>
                          <span className="text-xs text-slate-500">{formatDate(activity.timestamp)}</span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{activity.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No activity recorded yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Decision Section */}
      {isActionable && (
        <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/30">
          <CommentInput
            value={comments}
            onChange={setComments}
            placeholder="Add comments for your decision (optional)..."
            disabled={isSubmitting}
          />

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setConfirmDecision('rejected')}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
            <button
              onClick={() => setConfirmDecision('approved')}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve
            </button>
          </div>
        </div>
      )}

      {/* Non-actionable state message */}
      {!isActionable && (
        <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/30 text-center">
          <p className="text-sm text-slate-400">
            This request has been {request.status}
            {request.status === APPROVAL_STATUS.EXPIRED && ' due to timeout'}
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDecision && (
        <DecisionConfirmModal
          decision={confirmDecision}
          onConfirm={() => handleDecision(confirmDecision)}
          onCancel={() => setConfirmDecision(null)}
        />
      )}
    </div>
  );
}

export default ReviewPanel;

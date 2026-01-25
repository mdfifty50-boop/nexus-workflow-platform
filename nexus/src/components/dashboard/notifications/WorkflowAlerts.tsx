/**
 * WorkflowAlerts Component
 *
 * Workflow-specific alert displays for:
 * - Run failures
 * - Rate limit warnings
 * - Integration disconnects
 * - Approval requests
 * - Schedule changes
 * - Performance warnings
 */

import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { WorkflowAlertData } from './notification-types'
import {
  WorkflowAlertType,
  AlertSeverity,
  SEVERITY_COLORS,
  formatRelativeTime,
} from './notification-types'

// =============================================================================
// Types
// =============================================================================

export interface WorkflowAlertsProps {
  alerts?: WorkflowAlertData[]
  onDismiss?: (id: string) => void
  onAction?: (id: string, action: string) => void
  showWorkflowName?: boolean
  maxVisible?: number
  compact?: boolean
  className?: string
}

type AlertFilter = 'all' | 'failures' | 'warnings' | 'requests'

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_WORKFLOW_ALERTS: WorkflowAlertData[] = [
  {
    id: 'wa1',
    type: WorkflowAlertType.RUN_FAILURE,
    severity: AlertSeverity.ERROR,
    workflowId: 'wf-001',
    workflowName: 'Email Automation Pipeline',
    title: 'Workflow Execution Failed',
    message: 'Step 4 "Send Email" failed with error: SMTP connection timeout after 30 seconds.',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    actionUrl: '/workflows/wf-001/runs/exec-123',
    actionLabel: 'View Error',
    metadata: {
      executionId: 'exec-123',
      errorCode: 'SMTP_TIMEOUT',
      errorDetails: 'Connection to smtp.gmail.com:587 timed out',
    },
  },
  {
    id: 'wa2',
    type: WorkflowAlertType.RATE_LIMIT,
    severity: AlertSeverity.WARNING,
    workflowId: 'wf-002',
    workflowName: 'Data Sync',
    title: 'Approaching Rate Limit',
    message: 'This workflow has used 85% of its daily API call quota. Execution may be throttled.',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    actionUrl: '/workflows/wf-002/settings',
    actionLabel: 'Adjust Settings',
    metadata: {
      limitType: 'api_calls',
      currentUsage: 8500,
      limit: 10000,
    },
  },
  {
    id: 'wa3',
    type: WorkflowAlertType.INTEGRATION_DISCONNECT,
    severity: AlertSeverity.ERROR,
    workflowId: 'wf-003',
    workflowName: 'Slack Notifications',
    title: 'Integration Disconnected',
    message: 'The Slack integration used by this workflow has been disconnected. Please reconnect.',
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    actionUrl: '/integrations/slack',
    actionLabel: 'Reconnect',
    metadata: {
      integrationName: 'Slack',
    },
  },
  {
    id: 'wa4',
    type: WorkflowAlertType.APPROVAL_REQUEST,
    severity: AlertSeverity.INFO,
    workflowId: 'wf-004',
    workflowName: 'Contract Processing',
    title: 'Approval Required',
    message: 'A workflow execution is waiting for your approval before proceeding to the next step.',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    actionUrl: '/workflows/wf-004/approvals/apr-001',
    actionLabel: 'Review',
    metadata: {
      approvalId: 'apr-001',
      requesterName: 'John Smith',
    },
  },
  {
    id: 'wa5',
    type: WorkflowAlertType.SCHEDULE_CHANGE,
    severity: AlertSeverity.INFO,
    workflowId: 'wf-005',
    workflowName: 'Daily Report',
    title: 'Schedule Updated',
    message: 'The workflow schedule has been modified by a team member.',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    actionUrl: '/workflows/wf-005/schedule',
    actionLabel: 'View Schedule',
    metadata: {
      previousSchedule: 'Daily at 9:00 AM',
      newSchedule: 'Daily at 8:00 AM',
    },
  },
  {
    id: 'wa6',
    type: WorkflowAlertType.PERFORMANCE_WARNING,
    severity: AlertSeverity.WARNING,
    workflowId: 'wf-006',
    workflowName: 'Large Data Import',
    title: 'Performance Degradation',
    message: 'Recent executions are taking 3x longer than average. Consider optimizing the workflow.',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    actionUrl: '/workflows/wf-006/analytics',
    actionLabel: 'View Analytics',
    metadata: {},
  },
]

// =============================================================================
// Icon Components
// =============================================================================

function getAlertTypeIcon(type: WorkflowAlertData['type'], className: string = 'w-4 h-4') {
  switch (type) {
    case WorkflowAlertType.RUN_FAILURE:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case WorkflowAlertType.RATE_LIMIT:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case WorkflowAlertType.INTEGRATION_DISCONNECT:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    case WorkflowAlertType.APPROVAL_REQUEST:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case WorkflowAlertType.SCHEDULE_CHANGE:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    case WorkflowAlertType.PERFORMANCE_WARNING:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
  }
}

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// =============================================================================
// Single Alert Card Component
// =============================================================================

interface AlertCardProps {
  alert: WorkflowAlertData
  onDismiss: (id: string) => void
  onAction?: (id: string, action: string) => void
  showWorkflowName: boolean
  compact: boolean
}

function AlertCard({
  alert,
  onDismiss,
  onAction,
  showWorkflowName,
  compact,
}: AlertCardProps) {
  const colors = SEVERITY_COLORS[alert.severity]

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onDismiss(alert.id)
    },
    [alert.id, onDismiss]
  )

  const handleApprove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onAction?.(alert.id, 'approve')
    },
    [alert.id, onAction]
  )

  const handleReject = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onAction?.(alert.id, 'reject')
    },
    [alert.id, onAction]
  )

  // Usage percentage bar for rate limit alerts
  const renderUsageBar = () => {
    if (alert.type !== WorkflowAlertType.RATE_LIMIT) return null
    const percentage = alert.metadata.currentUsage && alert.metadata.limit
      ? Math.min((alert.metadata.currentUsage / alert.metadata.limit) * 100, 100)
      : 0

    return (
      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>API Calls Used</span>
          <span>{alert.metadata.currentUsage?.toLocaleString()} / {alert.metadata.limit?.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              percentage >= 90 ? 'bg-red-500' : percentage >= 75 ? 'bg-amber-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  // Approval buttons for approval request alerts
  const renderApprovalButtons = () => {
    if (alert.type !== WorkflowAlertType.APPROVAL_REQUEST) return null

    return (
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleApprove}
          className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
        >
          Approve
        </button>
        <button
          onClick={handleReject}
          className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
        >
          Reject
        </button>
      </div>
    )
  }

  // Schedule change details
  const renderScheduleChange = () => {
    if (alert.type !== WorkflowAlertType.SCHEDULE_CHANGE) return null
    const { previousSchedule, newSchedule } = alert.metadata

    return (
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="p-2 rounded-lg bg-slate-800/50">
          <span className="text-slate-500 text-xs">Previous</span>
          <p className="text-slate-300 mt-0.5">{previousSchedule}</p>
        </div>
        <div className="p-2 rounded-lg bg-slate-800/50">
          <span className="text-slate-500 text-xs">New</span>
          <p className="text-slate-300 mt-0.5">{newSchedule}</p>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg border
          ${colors.bg} ${colors.border}
        `}
      >
        <div className={`w-6 h-6 rounded flex items-center justify-center ${colors.icon} ${colors.text}`}>
          {getAlertTypeIcon(alert.type, 'w-3.5 h-3.5')}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-white truncate block">{alert.title}</span>
          {showWorkflowName && (
            <span className="text-xs text-slate-500">{alert.workflowName}</span>
          )}
        </div>
        {alert.actionUrl && (
          <Link
            to={alert.actionUrl}
            className={`text-xs ${colors.text} hover:underline flex-shrink-0`}
          >
            {alert.actionLabel}
          </Link>
        )}
        <button
          onClick={handleDismiss}
          className="p-1 rounded text-slate-500 hover:text-slate-300 flex-shrink-0"
        >
          <XIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={`
        rounded-xl border overflow-hidden
        ${colors.bg} ${colors.border}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
              ${colors.icon} ${colors.text}
            `}
          >
            {getAlertTypeIcon(alert.type, 'w-5 h-5')}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-white">{alert.title}</h4>
                {showWorkflowName && (
                  <Link
                    to={`/workflows/${alert.workflowId}`}
                    className="text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    {alert.workflowName}
                  </Link>
                )}
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors flex-shrink-0"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mt-2">{alert.message}</p>

            {/* Error details for failures */}
            {alert.type === WorkflowAlertType.RUN_FAILURE && alert.metadata.errorDetails && (
              <div className="mt-3 p-2 rounded-lg bg-slate-800/50 font-mono text-xs text-slate-400 overflow-x-auto">
                {alert.metadata.errorDetails}
              </div>
            )}

            {renderUsageBar()}
            {renderScheduleChange()}
            {renderApprovalButtons()}

            {/* Footer with timestamp and action */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/30">
              <span className="text-xs text-slate-500">
                {formatRelativeTime(alert.createdAt)}
              </span>
              {alert.actionUrl && alert.type !== WorkflowAlertType.APPROVAL_REQUEST && (
                <Link
                  to={alert.actionUrl}
                  className={`text-sm font-medium ${colors.text} hover:underline`}
                >
                  {alert.actionLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function WorkflowAlerts({
  alerts: externalAlerts,
  onDismiss,
  onAction,
  showWorkflowName = true,
  maxVisible = 5,
  compact = false,
  className = '',
}: WorkflowAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<AlertFilter>('all')
  const [showAll, setShowAll] = useState(false)

  // Use external alerts or mock data
  const alerts = useMemo(() => {
    const source = externalAlerts || MOCK_WORKFLOW_ALERTS
    return source.filter((alert) => !dismissedIds.has(alert.id))
  }, [externalAlerts, dismissedIds])

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    switch (filter) {
      case 'failures':
        return alerts.filter(
          (a) =>
            a.type === WorkflowAlertType.RUN_FAILURE ||
            a.type === WorkflowAlertType.INTEGRATION_DISCONNECT
        )
      case 'warnings':
        return alerts.filter(
          (a) =>
            a.type === WorkflowAlertType.RATE_LIMIT ||
            a.type === WorkflowAlertType.PERFORMANCE_WARNING
        )
      case 'requests':
        return alerts.filter(
          (a) =>
            a.type === WorkflowAlertType.APPROVAL_REQUEST ||
            a.type === WorkflowAlertType.SCHEDULE_CHANGE
        )
      default:
        return alerts
    }
  }, [alerts, filter])

  const visibleAlerts = showAll ? filteredAlerts : filteredAlerts.slice(0, maxVisible)
  const hiddenCount = filteredAlerts.length - maxVisible

  // Filter counts
  const filterCounts = useMemo(
    () => ({
      all: alerts.length,
      failures: alerts.filter(
        (a) =>
          a.type === WorkflowAlertType.RUN_FAILURE ||
          a.type === WorkflowAlertType.INTEGRATION_DISCONNECT
      ).length,
      warnings: alerts.filter(
        (a) =>
          a.type === WorkflowAlertType.RATE_LIMIT ||
          a.type === WorkflowAlertType.PERFORMANCE_WARNING
      ).length,
      requests: alerts.filter(
        (a) =>
          a.type === WorkflowAlertType.APPROVAL_REQUEST ||
          a.type === WorkflowAlertType.SCHEDULE_CHANGE
      ).length,
    }),
    [alerts]
  )

  const handleDismiss = useCallback(
    (id: string) => {
      setDismissedIds((prev) => new Set([...prev, id]))
      onDismiss?.(id)
    },
    [onDismiss]
  )

  if (alerts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm">No workflow alerts</p>
        <p className="text-slate-500 text-xs mt-1">All workflows are running smoothly</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Filter Tabs */}
      {!compact && (
        <div className="flex items-center gap-1 mb-4 bg-slate-800/50 rounded-lg p-1">
          {(['all', 'failures', 'warnings', 'requests'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize
                ${filter === f ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}
              `}
            >
              {f}
              {filterCounts[f] > 0 && (
                <span className="ml-1 text-slate-500">({filterCounts[f]})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Alert Cards */}
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {visibleAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={handleDismiss}
            onAction={onAction}
            showWorkflowName={showWorkflowName}
            compact={compact}
          />
        ))}
      </div>

      {/* Show more toggle */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
        >
          {showAll ? 'Show less' : `Show ${hiddenCount} more`}
        </button>
      )}
    </div>
  )
}

export default WorkflowAlerts

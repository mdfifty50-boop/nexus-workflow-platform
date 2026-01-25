/**
 * ActivityTimeline Component
 *
 * Displays recent workflow activity including:
 * - Timeline with workflow runs
 * - Status indicators (success, failed, running)
 * - Workflow name and timestamp
 * - Click to view details
 * - "View all" link to history
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Status constants (avoiding enums per TypeScript rules)
const EXECUTION_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  RUNNING: 'running',
  PENDING: 'pending',
} as const

type ExecutionStatus = typeof EXECUTION_STATUS[keyof typeof EXECUTION_STATUS]

// Types
interface WorkflowActivity {
  id: string
  workflowId: string
  workflowName: string
  status: ExecutionStatus
  startedAt: string
  completedAt?: string
  duration?: number
  error?: string
}

interface ActivityTimelineProps {
  activities: WorkflowActivity[]
  loading?: boolean
  maxItems?: number
  onActivityClick?: (activity: WorkflowActivity) => void
}

// Helper functions
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) {
    return 'Just now'
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }
  if (diffDays === 1) {
    return 'Yesterday'
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }
  return date.toLocaleDateString()
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  const secs = Math.floor(ms / 1000)
  if (secs < 60) {
    return `${secs}s`
  }
  const mins = Math.floor(secs / 60)
  const remainingSecs = secs % 60
  return `${mins}m ${remainingSecs}s`
}

// Status configurations
const statusConfig: Record<ExecutionStatus, {
  color: string
  bgColor: string
  borderColor: string
  label: string
  icon: string
}> = {
  [EXECUTION_STATUS.SUCCESS]: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    label: 'Completed',
    icon: '\u2713',
  },
  [EXECUTION_STATUS.FAILED]: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    label: 'Failed',
    icon: '\u2717',
  },
  [EXECUTION_STATUS.RUNNING]: {
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    label: 'Running',
    icon: '\u25B6',
  },
  [EXECUTION_STATUS.PENDING]: {
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    borderColor: 'border-slate-500/30',
    label: 'Pending',
    icon: '\u25CB',
  },
}

// Activity Item Component
function ActivityItem({
  activity,
  isLast,
  onClick,
}: {
  activity: WorkflowActivity
  isLast: boolean
  onClick?: () => void
}) {
  const config = statusConfig[activity.status]

  return (
    <div
      className="flex gap-4 cursor-pointer group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full ${config.bgColor} border ${config.borderColor} flex items-center justify-center ${config.color} text-sm font-bold group-hover:scale-110 transition-transform duration-200`}
        >
          {activity.status === EXECUTION_STATUS.RUNNING ? (
            <span className="animate-spin">{'\u25CB'}</span>
          ) : (
            config.icon
          )}
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-slate-700/50 min-h-[40px]" />
        )}
      </div>

      {/* Activity content */}
      <div className="flex-1 pb-6">
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/50 transition-all duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                {activity.workflowName}
              </h4>
              <div className="flex items-center gap-3 mt-1 text-sm">
                <span className={config.color}>{config.label}</span>
                {activity.duration && (
                  <>
                    <span className="text-slate-600">{'\u2022'}</span>
                    <span className="text-slate-400">
                      {formatDuration(activity.duration)}
                    </span>
                  </>
                )}
              </div>
              {activity.error && (
                <p className="mt-2 text-sm text-red-400/80 line-clamp-2">
                  {activity.error}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-xs text-slate-500">
                {formatRelativeTime(activity.startedAt)}
              </span>
              <svg
                className="w-4 h-4 text-slate-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton
function ActivitySkeleton() {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-slate-700/50 animate-pulse" />
        <div className="w-0.5 h-full bg-slate-700/30 min-h-[40px]" />
      </div>
      <div className="flex-1 pb-6">
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
          <div className="space-y-3">
            <div className="h-5 w-48 bg-slate-700/50 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-700/30 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Main ActivityTimeline Component
export function ActivityTimeline({
  activities,
  loading = false,
  maxItems = 5,
  onActivityClick,
}: ActivityTimelineProps) {
  const navigate = useNavigate()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Void the unused state setter to satisfy linting
  const _setHoveredId = setHoveredId
  void _setHoveredId
  void hoveredId

  const handleActivityClick = useCallback((activity: WorkflowActivity) => {
    if (onActivityClick) {
      onActivityClick(activity)
    } else {
      navigate(`/workflows/${activity.workflowId}`)
    }
  }, [onActivityClick, navigate])

  const handleViewAll = useCallback(() => {
    navigate('/workflows?tab=history')
  }, [navigate])

  const displayedActivities = activities.slice(0, maxItems)

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Recent Activity</h3>
            <p className="text-sm text-slate-400">
              Latest workflow executions
            </p>
          </div>
        </div>
        <button
          onClick={handleViewAll}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
        >
          View all
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {loading ? (
          <div className="space-y-0">
            {[...Array(3)].map((_, i) => (
              <ActivitySkeleton key={i} />
            ))}
          </div>
        ) : displayedActivities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-slate-400 mb-2">No recent activity</p>
            <p className="text-sm text-slate-500">
              Your workflow executions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {displayedActivities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isLast={index === displayedActivities.length - 1}
                onClick={() => handleActivityClick(activity)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      {!loading && activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {displayedActivities.length} of {activities.length} activities
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {activities.filter(a => a.status === EXECUTION_STATUS.SUCCESS).length} successful
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {activities.filter(a => a.status === EXECUTION_STATUS.FAILED).length} failed
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityTimeline
export { EXECUTION_STATUS }
export type { WorkflowActivity, ExecutionStatus }

/**
 * Recent Workflows List
 *
 * Displays a list of recent workflows in the sidebar.
 * Shows workflow status and allows clicking to view details.
 */

import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

/** Workflow status types */
export const WORKFLOW_STATUS = {
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PENDING: 'pending',
  PAUSED: 'paused'
} as const

export type WorkflowStatus = typeof WORKFLOW_STATUS[keyof typeof WORKFLOW_STATUS]

export interface RecentWorkflow {
  /** Unique workflow ID */
  id: string
  /** Workflow name */
  name: string
  /** Current status */
  status: WorkflowStatus
  /** Last updated timestamp */
  updatedAt: Date | string
  /** Optional description */
  description?: string
  /** Number of steps completed vs total */
  progress?: {
    completed: number
    total: number
  }
}

export interface RecentWorkflowsListProps {
  /** List of recent workflows */
  workflows?: RecentWorkflow[]
  /** Whether data is loading */
  loading?: boolean
  /** Maximum workflows to display */
  maxItems?: number
  /** Click handler for workflow item */
  onWorkflowClick?: (workflow: RecentWorkflow) => void
  /** Click handler for "View All" */
  onViewAllClick?: () => void
  /** Additional CSS classes */
  className?: string
}

// =============================================================================
// STATUS CONFIGURATION
// =============================================================================

const STATUS_CONFIG: Record<WorkflowStatus, {
  label: string
  color: string
  bgColor: string
  dotColor: string
  animate?: boolean
}> = {
  running: {
    label: 'Running',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    dotColor: 'bg-cyan-400',
    animate: true
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    dotColor: 'bg-emerald-400'
  },
  failed: {
    label: 'Failed',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    dotColor: 'bg-red-400'
  },
  pending: {
    label: 'Pending',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    dotColor: 'bg-yellow-400'
  },
  paused: {
    label: 'Paused',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    dotColor: 'bg-slate-400'
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTimeAgo(date: Date | string): string {
  const now = new Date()
  const past = date instanceof Date ? date : new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return past.toLocaleDateString()
}

// =============================================================================
// ICONS
// =============================================================================

function WorkflowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h4v4H4zM16 6h4v4h-4zM10 14h4v4h-4z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 8h8M12 12v2"
      />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  )
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function WorkflowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-muted/50" />
      <div className="flex-1 min-w-0">
        <div className="h-4 w-24 bg-muted/50 rounded mb-1" />
        <div className="h-3 w-16 bg-muted/30 rounded" />
      </div>
      <div className="w-14 h-5 bg-muted/30 rounded-full" />
    </div>
  )
}

// =============================================================================
// WORKFLOW ITEM COMPONENT
// =============================================================================

interface WorkflowItemProps {
  workflow: RecentWorkflow
  onClick?: () => void
}

function WorkflowItem({ workflow, onClick }: WorkflowItemProps) {
  const config = STATUS_CONFIG[workflow.status]

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-2 rounded-lg transition-all',
        'hover:bg-muted/50 group text-left'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
        config.bgColor
      )}>
        <WorkflowIcon className={cn('w-4 h-4', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate text-foreground">
            {workflow.name}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatTimeAgo(workflow.updatedAt)}</span>
          {workflow.progress && (
            <>
              <span className="text-muted-foreground/50">-</span>
              <span>
                {workflow.progress.completed}/{workflow.progress.total} steps
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className={cn(
        'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase',
        config.bgColor,
        config.color
      )}>
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          config.dotColor,
          config.animate && 'animate-pulse'
        )} />
        <span className="hidden sm:inline">{config.label}</span>
      </div>

      {/* Chevron on hover */}
      <ChevronRightIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  )
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
        <WorkflowIcon className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">No recent workflows</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Create your first workflow to get started
      </p>
    </div>
  )
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RecentWorkflowsList({
  workflows = [],
  loading = false,
  maxItems = 5,
  onWorkflowClick,
  onViewAllClick,
  className
}: RecentWorkflowsListProps) {
  const displayedWorkflows = workflows.slice(0, maxItems)
  const hasMore = workflows.length > maxItems

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Recent Workflows
        </div>
        <div className="space-y-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <WorkflowSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Workflows
        </span>
        {workflows.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {workflows.length}
          </span>
        )}
      </div>

      {/* List */}
      {displayedWorkflows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-0.5">
          {displayedWorkflows.map(workflow => (
            <WorkflowItem
              key={workflow.id}
              workflow={workflow}
              onClick={() => onWorkflowClick?.(workflow)}
            />
          ))}
        </div>
      )}

      {/* View All Button */}
      {(hasMore || workflows.length > 0) && onViewAllClick && (
        <button
          onClick={onViewAllClick}
          className={cn(
            'w-full flex items-center justify-center gap-1 py-2 text-xs text-primary',
            'hover:bg-primary/5 rounded-lg transition-colors'
          )}
        >
          <span>View All Workflows</span>
          <ChevronRightIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

export default RecentWorkflowsList

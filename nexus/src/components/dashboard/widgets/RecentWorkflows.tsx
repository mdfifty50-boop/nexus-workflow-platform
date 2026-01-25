/**
 * RecentWorkflows Widget
 *
 * Shows recently used or modified workflows.
 * Features:
 * - List of 5 most recent workflows
 * - Last run timestamp (relative)
 * - Status badge (active, paused, error)
 * - One-click run trigger
 * - Edit workflow link
 * - Empty state if no workflows
 */

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Clock,
  RefreshCw,
  Play,
  Edit2,
  Eye,
  Zap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import type { RecentWorkflowsProps, RecentWorkflow, WorkflowStatus } from './widget-types'

// =============================================================================
// Helper Functions
// =============================================================================

function formatRelativeTime(isoString: string | undefined): string {
  if (!isoString) return 'Never'

  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDuration(ms: number | undefined): string {
  if (ms === undefined || ms === null) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

function getStatusConfig(status: WorkflowStatus) {
  switch (status) {
    case 'active':
      return {
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        label: 'Active',
      }
    case 'paused':
      return {
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        label: 'Paused',
      }
    case 'error':
      return {
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        label: 'Error',
      }
    case 'disabled':
      return {
        color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        label: 'Disabled',
      }
    default:
      return {
        color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        label: 'Unknown',
      }
  }
}

function getRunStatusIcon(status: 'success' | 'failed' | 'running' | undefined) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-400" />
    case 'running':
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />
  }
}

// =============================================================================
// Sub-Components
// =============================================================================

interface WorkflowRowProps {
  workflow: RecentWorkflow
  onRun?: (workflowId: string) => Promise<void>
  onEdit?: (workflowId: string) => void
  onViewRun?: (workflowId: string, runId?: string) => void
}

function WorkflowRow({ workflow, onRun, onEdit, onViewRun }: WorkflowRowProps) {
  const [isRunning, setIsRunning] = useState(false)
  const statusConfig = getStatusConfig(workflow.status)

  const handleRun = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!onRun || isRunning) return

      setIsRunning(true)
      try {
        await onRun(workflow.id)
      } finally {
        setIsRunning(false)
      }
    },
    [onRun, workflow.id, isRunning]
  )

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onEdit?.(workflow.id)
    },
    [onEdit, workflow.id]
  )

  const handleViewRun = useCallback(() => {
    onViewRun?.(workflow.id)
  }, [onViewRun, workflow.id])

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg',
        'bg-slate-800/30 hover:bg-slate-800/60 border border-transparent hover:border-slate-700',
        'transition-all duration-200 cursor-pointer'
      )}
      onClick={handleViewRun}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleViewRun()
        }
      }}
    >
      {/* Workflow Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
        {workflow.icon ? (
          <span className="text-xl">{workflow.icon}</span>
        ) : (
          <Zap className="w-5 h-5 text-primary" />
        )}
      </div>

      {/* Workflow Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-foreground truncate">
            {workflow.name}
          </h4>
          <span
            className={cn(
              'px-2 py-0.5 text-xs rounded-full border flex-shrink-0',
              statusConfig.color
            )}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* Last Run Info */}
        <div className="flex items-center gap-2 mt-1">
          {getRunStatusIcon(workflow.lastRunStatus)}
          <span className="text-xs text-muted-foreground">
            {workflow.lastRunStatus === 'running'
              ? 'Running now...'
              : `Last run: ${formatRelativeTime(workflow.lastRunAt)}`}
          </span>
          {workflow.lastRunDuration !== undefined &&
            workflow.lastRunStatus !== 'running' && (
              <span className="text-xs text-muted-foreground">
                ({formatDuration(workflow.lastRunDuration)})
              </span>
            )}
        </div>
      </div>

      {/* Run Count */}
      <div className="hidden sm:block text-right">
        <span className="text-xs text-muted-foreground">
          {workflow.runCount} runs
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onRun && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRun}
            disabled={isRunning || workflow.status === 'disabled'}
            className="h-8 w-8"
            title="Run workflow"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleEdit}
            className="h-8 w-8"
            title="Edit workflow"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
        {onViewRun && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleViewRun}
            className="h-8 w-8"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30"
        >
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
        <Clock className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">No recent workflows</p>
      <p className="text-xs text-muted-foreground">
        Run a workflow to see it here
      </p>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function RecentWorkflows({
  workflows = [],
  maxItems = 5,
  isLoading = false,
  className,
  onRefresh,
  onRunWorkflow,
  onEditWorkflow,
  onViewRun,
}: RecentWorkflowsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh])

  // Sort by last run time and limit
  const sortedWorkflows = useMemo(() => {
    return [...workflows]
      .sort((a, b) => {
        const aTime = a.lastRunAt ? new Date(a.lastRunAt).getTime() : 0
        const bTime = b.lastRunAt ? new Date(b.lastRunAt).getTime() : 0
        return bTime - aTime
      })
      .slice(0, maxItems)
  }, [workflows, maxItems])

  return (
    <Card className={cn('bg-slate-900/50 border-slate-800', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-primary" />
            Recent Workflows
          </CardTitle>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-7 w-7"
              >
                <RefreshCw
                  className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')}
                />
              </Button>
            )}

            {onViewRun && sortedWorkflows.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewRun('')}
                className="text-xs gap-1"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <LoadingSkeleton />
        ) : sortedWorkflows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {sortedWorkflows.map((workflow) => (
              <WorkflowRow
                key={workflow.id}
                workflow={workflow}
                onRun={onRunWorkflow}
                onEdit={onEditWorkflow}
                onViewRun={onViewRun}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentWorkflows

/**
 * ScheduledRuns Widget
 *
 * Shows upcoming scheduled workflow runs.
 * Features:
 * - Workflow name with next run time
 * - Frequency indicator (hourly, daily, weekly, etc.)
 * - Toggle to enable/disable schedule
 * - Quick settings access
 * - Empty state for no schedules
 */

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  Clock,
  RefreshCw,
  Settings,
  Zap,
  ArrowRight,
  Power,
  Timer,
  CalendarDays,
  CalendarClock,
} from 'lucide-react'
import type {
  ScheduledRunsProps,
  ScheduledWorkflow,
  ScheduleFrequency,
} from './widget-types'

// =============================================================================
// Helper Functions
// =============================================================================

function formatNextRun(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()

  // Already passed
  if (diffMs < 0) return 'Overdue'

  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 60) return `In ${diffMinutes}m`
  if (diffHours < 24) return `In ${diffHours}h`
  if (diffDays < 7) return `In ${diffDays}d`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatExactTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getFrequencyConfig(frequency: ScheduleFrequency) {
  switch (frequency) {
    case 'hourly':
      return {
        icon: Timer,
        label: 'Hourly',
        color: 'text-blue-400',
      }
    case 'daily':
      return {
        icon: Clock,
        label: 'Daily',
        color: 'text-emerald-400',
      }
    case 'weekly':
      return {
        icon: CalendarDays,
        label: 'Weekly',
        color: 'text-amber-400',
      }
    case 'monthly':
      return {
        icon: CalendarClock,
        label: 'Monthly',
        color: 'text-purple-400',
      }
    case 'custom':
      return {
        icon: Calendar,
        label: 'Custom',
        color: 'text-slate-400',
      }
    default:
      return {
        icon: Calendar,
        label: frequency,
        color: 'text-slate-400',
      }
  }
}

// =============================================================================
// Sub-Components
// =============================================================================

interface ScheduleRowProps {
  workflow: ScheduledWorkflow
  onToggle?: (workflowId: string, enabled: boolean) => Promise<void>
  onEdit?: (workflowId: string) => void
  onView?: (workflowId: string) => void
}

function ScheduleRow({ workflow, onToggle, onEdit, onView }: ScheduleRowProps) {
  const [isToggling, setIsToggling] = useState(false)
  const frequencyConfig = getFrequencyConfig(workflow.frequency)
  const FrequencyIcon = frequencyConfig.icon

  const handleToggle = useCallback(async () => {
    if (!onToggle || isToggling) return

    setIsToggling(true)
    try {
      await onToggle(workflow.id, !workflow.isEnabled)
    } finally {
      setIsToggling(false)
    }
  }, [onToggle, workflow.id, workflow.isEnabled, isToggling])

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onEdit?.(workflow.id)
    },
    [onEdit, workflow.id]
  )

  const handleView = useCallback(() => {
    onView?.(workflow.id)
  }, [onView, workflow.id])

  const isOverdue = new Date(workflow.nextRunAt) < new Date()

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg',
        'bg-slate-800/30 hover:bg-slate-800/60 border border-transparent hover:border-slate-700',
        'transition-all duration-200 cursor-pointer',
        !workflow.isEnabled && 'opacity-60'
      )}
      onClick={handleView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleView()
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

      {/* Schedule Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-foreground truncate">
            {workflow.name}
          </h4>
        </div>

        {/* Next Run Time */}
        <div className="flex items-center gap-2 mt-1">
          <FrequencyIcon className={cn('w-3.5 h-3.5', frequencyConfig.color)} />
          <span className="text-xs text-muted-foreground">
            {frequencyConfig.label}
          </span>
          <span className="text-xs text-muted-foreground">-</span>
          <span
            className={cn(
              'text-xs',
              isOverdue && workflow.isEnabled
                ? 'text-red-400'
                : 'text-muted-foreground'
            )}
            title={formatExactTime(workflow.nextRunAt)}
          >
            {workflow.isEnabled ? formatNextRun(workflow.nextRunAt) : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Frequency Badge */}
      <Badge
        variant="outline"
        className={cn(
          'hidden sm:flex gap-1 border-slate-700 text-xs',
          frequencyConfig.color
        )}
      >
        <FrequencyIcon className="w-3 h-3" />
        {frequencyConfig.label}
      </Badge>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Enable/Disable Toggle */}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              handleToggle()
            }}
            disabled={isToggling}
            className={cn(
              'h-8 w-8',
              workflow.isEnabled
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title={workflow.isEnabled ? 'Disable schedule' : 'Enable schedule'}
          >
            <Power className="w-4 h-4" />
          </Button>
        )}

        {/* Settings Button */}
        {onEdit && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleEdit}
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit schedule"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30"
        >
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
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
        <Calendar className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        No scheduled workflows
      </p>
      <p className="text-xs text-muted-foreground">
        Schedule a workflow to automate your tasks
      </p>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function ScheduledRuns({
  workflows = [],
  maxItems = 5,
  isLoading = false,
  className,
  onRefresh,
  onToggleSchedule,
  onEditSchedule,
  onViewWorkflow,
}: ScheduledRunsProps) {
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

  // Sort by next run time and limit
  const sortedWorkflows = useMemo(() => {
    return [...workflows]
      .sort((a, b) => {
        // Enabled schedules first
        if (a.isEnabled !== b.isEnabled) {
          return a.isEnabled ? -1 : 1
        }
        // Then by next run time
        return new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime()
      })
      .slice(0, maxItems)
  }, [workflows, maxItems])

  const enabledCount = workflows.filter((w) => w.isEnabled).length

  return (
    <Card className={cn('bg-slate-900/50 border-slate-800', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-primary" />
            Scheduled Runs
            {enabledCount > 0 && (
              <Badge variant="secondary" className="text-xs ml-1">
                {enabledCount} active
              </Badge>
            )}
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

            {onViewWorkflow && sortedWorkflows.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewWorkflow('')}
                className="text-xs gap-1"
              >
                Manage
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
              <ScheduleRow
                key={workflow.id}
                workflow={workflow}
                onToggle={onToggleSchedule}
                onEdit={onEditSchedule}
                onView={onViewWorkflow}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ScheduledRuns

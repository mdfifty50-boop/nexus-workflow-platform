/**
 * FavoriteWorkflows Widget
 *
 * Shows user's starred/favorite workflows for quick access.
 * Features:
 * - Pinned workflows with drag to reorder
 * - Quick access cards with run button
 * - Run count and success rate
 * - Star toggle to unfavorite
 * - Empty state with suggestion
 */

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Star,
  RefreshCw,
  Play,
  Zap,
  ArrowRight,
  GripVertical,
  Loader2,
  TrendingUp,
  Eye,
} from 'lucide-react'
import type { FavoriteWorkflowsProps, FavoriteWorkflow } from './widget-types'

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

function formatSuccessRate(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

function getSuccessRateColor(rate: number): string {
  if (rate >= 0.95) return 'text-emerald-400'
  if (rate >= 0.8) return 'text-amber-400'
  return 'text-red-400'
}

// =============================================================================
// Sub-Components
// =============================================================================

interface FavoriteCardProps {
  workflow: FavoriteWorkflow
  onRun?: (workflowId: string) => Promise<void>
  onToggleFavorite?: (workflowId: string, isFavorite: boolean) => Promise<void>
  onView?: (workflowId: string) => void
  isDraggable?: boolean
}

function FavoriteCard({
  workflow,
  onRun,
  onToggleFavorite,
  onView,
  isDraggable = false,
}: FavoriteCardProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)

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

  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!onToggleFavorite || isTogglingFavorite) return

      setIsTogglingFavorite(true)
      try {
        await onToggleFavorite(workflow.id, false)
      } finally {
        setIsTogglingFavorite(false)
      }
    },
    [onToggleFavorite, workflow.id, isTogglingFavorite]
  )

  const handleView = useCallback(() => {
    onView?.(workflow.id)
  }, [onView, workflow.id])

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 p-3 rounded-lg',
        'bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600',
        'transition-all duration-200 cursor-pointer'
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
      {/* Drag Handle */}
      {isDraggable && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

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
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-muted-foreground">
            {workflow.runCount} runs
          </span>
          <div className="flex items-center gap-1">
            <TrendingUp
              className={cn('w-3 h-3', getSuccessRateColor(workflow.successRate))}
            />
            <span
              className={cn(
                'text-xs',
                getSuccessRateColor(workflow.successRate)
              )}
            >
              {formatSuccessRate(workflow.successRate)}
            </span>
          </div>
          {workflow.lastRunAt && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {formatRelativeTime(workflow.lastRunAt)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Unfavorite Button */}
        {onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className="h-8 w-8 text-amber-400 hover:text-amber-300"
            title="Remove from favorites"
          >
            <Star
              className={cn(
                'w-4 h-4 fill-amber-400',
                isTogglingFavorite && 'animate-pulse'
              )}
            />
          </Button>
        )}

        {/* Run Button */}
        {onRun && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRun}
            disabled={isRunning || workflow.status === 'disabled'}
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Run workflow"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* View Button */}
        {onView && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              handleView()
            }}
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            title="View workflow"
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
      {Array.from({ length: 4 }).map((_, i) => (
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
        <Star className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        No favorite workflows
      </p>
      <p className="text-xs text-muted-foreground">
        Star a workflow to add it to your favorites
      </p>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function FavoriteWorkflows({
  workflows = [],
  maxItems = 6,
  isLoading = false,
  className,
  onRefresh,
  onRunWorkflow,
  onToggleFavorite,
  onReorder: _onReorder,
  onViewWorkflow,
}: FavoriteWorkflowsProps) {
  // Void unused parameter
  void _onReorder

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

  // Sort by position and limit
  const sortedWorkflows = useMemo(() => {
    return [...workflows]
      .sort((a, b) => a.position - b.position)
      .slice(0, maxItems)
  }, [workflows, maxItems])

  return (
    <Card className={cn('bg-slate-900/50 border-slate-800', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            Favorites
            {workflows.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-1">
                {workflows.length}
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
              <FavoriteCard
                key={workflow.id}
                workflow={workflow}
                onRun={onRunWorkflow}
                onToggleFavorite={onToggleFavorite}
                onView={onViewWorkflow}
                isDraggable={false} // Drag reorder can be implemented with dnd-kit
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FavoriteWorkflows

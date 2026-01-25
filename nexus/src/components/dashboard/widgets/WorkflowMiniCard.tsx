/**
 * WorkflowMiniCard Component
 *
 * Compact workflow card for use in widget lists.
 * Features:
 * - Icon and name display
 * - Status indicator dot
 * - Last run info with relative time
 * - Click to expand/navigate
 * - Actions menu (run, edit, favorite)
 */

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Play,
  Edit2,
  Star,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
} from 'lucide-react'
import type { WorkflowMiniCardProps, WorkflowStatus } from './widget-types'

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

function getStatusColor(status: WorkflowStatus): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-500'
    case 'paused':
      return 'bg-amber-500'
    case 'error':
      return 'bg-red-500'
    case 'disabled':
      return 'bg-slate-500'
    default:
      return 'bg-slate-500'
  }
}

function getRunStatusIcon(status: 'success' | 'failed' | 'running' | undefined) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
    case 'failed':
      return <XCircle className="w-3.5 h-3.5 text-red-400" />
    case 'running':
      return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
    default:
      return null
  }
}

// =============================================================================
// WorkflowMiniCard Component
// =============================================================================

export function WorkflowMiniCard({
  workflow,
  className,
  showActions = true,
  isSelected = false,
  lastRunAt,
  lastRunStatus,
  onClick,
  onRun,
  onEdit,
  onToggleFavorite,
}: WorkflowMiniCardProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleRun = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!onRun || isRunning) return

      setIsRunning(true)
      try {
        await onRun()
      } finally {
        setIsRunning(false)
      }
    },
    [onRun, isRunning]
  )

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onEdit?.()
      setShowMenu(false)
    },
    [onEdit]
  )

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggleFavorite?.()
      setShowMenu(false)
    },
    [onToggleFavorite]
  )

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu((prev) => !prev)
  }, [])

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 p-3 rounded-lg border border-slate-700/50',
        'bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600',
        'transition-all duration-200 cursor-pointer',
        isSelected && 'border-primary bg-primary/10',
        className
      )}
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
      {/* Workflow Icon */}
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center">
        {workflow.icon ? (
          <span className="text-lg">{workflow.icon}</span>
        ) : (
          <Zap className="w-4 h-4 text-primary" />
        )}
      </div>

      {/* Workflow Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Status Dot */}
          <span
            className={cn('w-2 h-2 rounded-full', getStatusColor(workflow.status))}
            title={`Status: ${workflow.status}`}
          />

          {/* Workflow Name */}
          <h4 className="text-sm font-medium text-foreground truncate">
            {workflow.name}
          </h4>

          {/* Favorite Indicator */}
          {workflow.isFavorite && (
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
          )}
        </div>

        {/* Last Run Info */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {getRunStatusIcon(lastRunStatus)}
          <span className="text-xs text-muted-foreground">
            {lastRunStatus === 'running'
              ? 'Running now...'
              : `Last run: ${formatRelativeTime(lastRunAt)}`}
          </span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div
          className={cn(
            'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
            showMenu && 'opacity-100'
          )}
        >
          {/* Quick Run Button */}
          {onRun && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRun}
              disabled={isRunning || workflow.status === 'disabled'}
              className="h-7 w-7"
              title="Run workflow"
            >
              {isRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </Button>
          )}

          {/* Actions Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleMenuToggle}
              className="h-7 w-7"
              title="More actions"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                  }}
                />

                {/* Menu */}
                <div className="absolute right-0 top-full mt-1 z-50 w-36 py-1 rounded-md border border-slate-700 bg-slate-800 shadow-lg">
                  {onEdit && (
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-slate-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                  {onToggleFavorite && (
                    <button
                      onClick={handleToggleFavorite}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-slate-700 transition-colors"
                    >
                      <Star
                        className={cn(
                          'w-3.5 h-3.5',
                          workflow.isFavorite && 'text-amber-400 fill-amber-400'
                        )}
                      />
                      {workflow.isFavorite ? 'Unfavorite' : 'Favorite'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkflowMiniCard

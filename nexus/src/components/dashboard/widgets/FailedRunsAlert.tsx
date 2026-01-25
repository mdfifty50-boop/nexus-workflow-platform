/**
 * FailedRunsAlert Widget
 *
 * Alert banner showing recent workflow failures.
 * Features:
 * - Count of recent failures
 * - Workflow names with error messages
 * - Quick view/retry buttons
 * - Dismiss individual or all
 * - Link to troubleshoot
 * - Collapsible for minimal space
 */

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  Wrench,
  XCircle,
  Loader2,
} from 'lucide-react'
import type { FailedRunsAlertProps, FailedRun } from './widget-types'

// =============================================================================
// Helper Functions
// =============================================================================

function formatRelativeTime(isoString: string): string {
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

function truncateMessage(message: string, maxLength: number = 80): string {
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength) + '...'
}

// =============================================================================
// Sub-Components
// =============================================================================

interface FailedRunRowProps {
  run: FailedRun
  onView?: (runId: string) => void
  onRetry?: (runId: string) => Promise<void>
  onDismiss?: (runId: string) => void
  onTroubleshoot?: (workflowId: string) => void
}

function FailedRunRow({
  run,
  onView,
  onRetry,
  onDismiss,
  onTroubleshoot,
}: FailedRunRowProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleView = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onView?.(run.id)
    },
    [onView, run.id]
  )

  const handleRetry = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!onRetry || isRetrying || !run.canRetry) return

      setIsRetrying(true)
      try {
        await onRetry(run.id)
      } finally {
        setIsRetrying(false)
      }
    },
    [onRetry, run.id, run.canRetry, isRetrying]
  )

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDismiss?.(run.id)
    },
    [onDismiss, run.id]
  )

  const handleTroubleshoot = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onTroubleshoot?.(run.workflowId)
    },
    [onTroubleshoot, run.workflowId]
  )

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg',
        'bg-red-950/30 border border-red-900/30 hover:border-red-800/50',
        'transition-all duration-200'
      )}
    >
      {/* Error Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <XCircle className="w-5 h-5 text-red-400" />
      </div>

      {/* Error Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-medium text-foreground">
            {run.workflowName}
          </h4>
          <span className="text-xs text-red-400/80">
            {formatRelativeTime(run.failedAt)}
          </span>
          {run.retryCount > 0 && (
            <Badge
              variant="outline"
              className="text-xs border-red-800/50 text-red-400"
            >
              {run.retryCount} retries
            </Badge>
          )}
        </div>

        {/* Error Message */}
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {truncateMessage(run.errorMessage)}
        </p>

        {/* Error Code */}
        {run.errorCode && (
          <span className="inline-block text-xs font-mono text-red-400/60 mt-1">
            [{run.errorCode}]
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* View Details */}
        {onView && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleView}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="View details"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
        )}

        {/* Retry */}
        {onRetry && run.canRetry && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Retry"
          >
            {isRetrying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </Button>
        )}

        {/* Troubleshoot */}
        {onTroubleshoot && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleTroubleshoot}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Troubleshoot"
          >
            <Wrench className="w-3.5 h-3.5" />
          </Button>
        )}

        {/* Dismiss */}
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDismiss}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function FailedRunsAlert({
  failedRuns = [],
  maxDisplay = 3,
  isLoading = false,
  className,
  onViewDetails,
  onRetry,
  onDismiss,
  onDismissAll,
  onTroubleshoot,
}: FailedRunsAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Sort by most recent first
  const sortedRuns = useMemo(() => {
    return [...failedRuns].sort(
      (a, b) => new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime()
    )
  }, [failedRuns])

  const displayedRuns = useMemo(() => {
    return isExpanded ? sortedRuns : sortedRuns.slice(0, maxDisplay)
  }, [sortedRuns, isExpanded, maxDisplay])

  const hasMore = sortedRuns.length > maxDisplay

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  // Don't render if no failures
  if (!isLoading && failedRuns.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-red-900/50 bg-red-950/20 overflow-hidden',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-950/30 border-b border-red-900/30">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Failed Workflow Runs
            </h3>
            <p className="text-xs text-muted-foreground">
              {failedRuns.length} workflow{failedRuns.length !== 1 ? 's' : ''}{' '}
              failed recently
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dismiss All */}
          {onDismissAll && failedRuns.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismissAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss all
            </Button>
          )}

          {/* Expand/Collapse */}
          {hasMore && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleToggleExpand}
              className="h-7 w-7"
              title={isExpanded ? 'Show less' : 'Show more'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Failed Runs List */}
      <div className="p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <>
            {displayedRuns.map((run) => (
              <FailedRunRow
                key={run.id}
                run={run}
                onView={onViewDetails}
                onRetry={onRetry}
                onDismiss={onDismiss}
                onTroubleshoot={onTroubleshoot}
              />
            ))}

            {/* Show More Indicator */}
            {!isExpanded && hasMore && (
              <button
                onClick={handleToggleExpand}
                className="w-full py-2 text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
              >
                +{sortedRuns.length - maxDisplay} more failed runs
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer Actions */}
      {sortedRuns.length > 0 && (
        <div className="px-4 py-2 bg-red-950/20 border-t border-red-900/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Resolve failures to ensure workflows run smoothly
          </span>

          {onViewDetails && (
            <Button
              variant="link"
              size="sm"
              onClick={() => onViewDetails('')}
              className="text-xs text-red-400 hover:text-red-300 p-0 h-auto"
            >
              View all failures
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default FailedRunsAlert

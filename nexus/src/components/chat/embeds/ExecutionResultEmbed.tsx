import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { EmbedContainer, EmbedSection } from './EmbedContainer'
import type { ExecutionResultEmbedProps, ExecutionStatus } from './embed-types'
import { EXECUTION_STATUS } from './embed-types'

// Execution status configurations
const STATUS_CONFIG: Record<ExecutionStatus, {
  label: string
  className: string
  bgClassName: string
  icon: React.ReactNode
}> = {
  [EXECUTION_STATUS.SUCCESS]: {
    label: 'Completed',
    className: 'text-green-700 dark:text-green-400',
    bgClassName: 'bg-green-100 dark:bg-green-900/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  [EXECUTION_STATUS.FAILED]: {
    label: 'Failed',
    className: 'text-red-700 dark:text-red-400',
    bgClassName: 'bg-red-100 dark:bg-red-900/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  [EXECUTION_STATUS.RUNNING]: {
    label: 'Running',
    className: 'text-blue-700 dark:text-blue-400',
    bgClassName: 'bg-blue-100 dark:bg-blue-900/30',
    icon: (
      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  [EXECUTION_STATUS.CANCELLED]: {
    label: 'Cancelled',
    className: 'text-slate-600 dark:text-slate-400',
    bgClassName: 'bg-slate-100 dark:bg-slate-800',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
}

// Format duration
function formatDuration(durationMs: number | undefined): string {
  if (durationMs === undefined) return 'N/A'

  if (durationMs < 1000) return `${durationMs}ms`
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`
  if (durationMs < 3600000) return `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`
  return `${Math.floor(durationMs / 3600000)}h ${Math.floor((durationMs % 3600000) / 60000)}m`
}

// Format timestamp
function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// JSON preview component
function JsonPreview({ data, maxLines = 5 }: { data: unknown; maxLines?: number }) {
  const [expanded, setExpanded] = useState(false)

  if (data === undefined || data === null) {
    return <span className="text-muted-foreground italic">No data</span>
  }

  const jsonString = JSON.stringify(data, null, 2)
  const lines = jsonString.split('\n')
  const shouldTruncate = lines.length > maxLines && !expanded
  const displayLines = shouldTruncate ? lines.slice(0, maxLines) : lines

  return (
    <div className="relative">
      <pre className="text-xs bg-muted/50 rounded-lg p-2 overflow-x-auto font-mono">
        <code className="text-foreground">
          {displayLines.join('\n')}
          {shouldTruncate && (
            <span className="text-muted-foreground">
              {'\n'}... ({lines.length - maxLines} more lines)
            </span>
          )}
        </code>
      </pre>
      {lines.length > maxLines && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="text-xs text-primary hover:underline mt-1"
          data-embed-action
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

// Progress bar for running execution
function ExecutionProgress({ nodesExecuted, totalNodes }: { nodesExecuted?: number; totalNodes?: number }) {
  if (nodesExecuted === undefined || totalNodes === undefined) {
    return null
  }

  const progress = totalNodes > 0 ? (nodesExecuted / totalNodes) * 100 : 0

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>Progress</span>
        <span>{nodesExecuted} / {totalNodes} nodes</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

/**
 * ExecutionResultEmbed - Workflow execution results card for chat messages
 * Displays status, duration, input/output data, and error details
 */
export function ExecutionResultEmbed({
  data,
  onViewFullLog,
  onRetry,
  showDataPreview = true,
  className,
  isLoading,
  isError,
  errorMessage,
}: ExecutionResultEmbedProps) {
  const statusConfig = STATUS_CONFIG[data.status]
  const isRunning = data.status === EXECUTION_STATUS.RUNNING
  const isFailed = data.status === EXECUTION_STATUS.FAILED

  return (
    <EmbedContainer
      className={className}
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      onClick={() => onViewFullLog?.(data)}
    >
      {/* Header with Status */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            statusConfig.bgClassName,
            statusConfig.className
          )}>
            {statusConfig.icon}
          </div>

          {/* Title & Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm">
                {data.workflowName || 'Workflow Execution'}
              </h4>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                statusConfig.bgClassName,
                statusConfig.className
              )}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              ID: {data.id.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Started: {formatTime(data.startTime)}</span>
          </div>
          {data.duration !== undefined && !isRunning && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Duration: {formatDuration(data.duration)}</span>
            </div>
          )}
          {isRunning && data.nodesExecuted !== undefined && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span>{data.nodesExecuted} / {data.totalNodes} nodes</span>
            </div>
          )}
        </div>

        {/* Running Progress */}
        {isRunning && (
          <ExecutionProgress
            nodesExecuted={data.nodesExecuted}
            totalNodes={data.totalNodes}
          />
        )}
      </div>

      {/* Error Details (if failed) */}
      {isFailed && data.error && (
        <div className="px-4 pb-3">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {data.errorDetails?.nodeName
                    ? `Error in "${data.errorDetails.nodeName}"`
                    : 'Execution Error'}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400/80 mt-1 break-words">
                  {data.error}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input/Output Data Preview */}
      {showDataPreview && !isRunning && (
        <>
          {data.inputData !== undefined && (
            <EmbedSection title="Input Data">
              <JsonPreview data={data.inputData} maxLines={4} />
            </EmbedSection>
          )}
          {data.outputData !== undefined && !isFailed && (
            <EmbedSection title="Output Data">
              <JsonPreview data={data.outputData} maxLines={4} />
            </EmbedSection>
          )}
        </>
      )}

      {/* Action Footer */}
      <div className="p-4 pt-0 flex gap-2">
        {isFailed && onRetry && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRetry(data)
            }}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            data-embed-action
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        )}
        {onViewFullLog && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewFullLog(data)
            }}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2',
              isFailed && onRetry
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : 'flex-1 bg-muted text-foreground hover:bg-muted/80'
            )}
            data-embed-action
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Full Log
          </button>
        )}
      </div>
    </EmbedContainer>
  )
}

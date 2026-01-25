import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { EmbedContainer, EmbedActionButton, EmbedSection } from './EmbedContainer'
import { WorkflowDiagramMini } from './WorkflowDiagramMini'
import type { WorkflowPreviewEmbedProps, WorkflowStatus } from './embed-types'
import { WORKFLOW_STATUS } from './embed-types'

// Status badge configurations
const STATUS_CONFIG: Record<WorkflowStatus, { label: string; className: string; icon: React.ReactNode }> = {
  [WORKFLOW_STATUS.DRAFT]: {
    label: 'Draft',
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  [WORKFLOW_STATUS.ACTIVE]: {
    label: 'Active',
    className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  [WORKFLOW_STATUS.PAUSED]: {
    label: 'Paused',
    className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  [WORKFLOW_STATUS.ARCHIVED]: {
    label: 'Archived',
    className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
}

// Format relative time
function formatRelativeTime(date: Date | string | undefined): string {
  if (!date) return 'Never'

  const now = new Date()
  const then = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return then.toLocaleDateString()
}

// Icons for action buttons
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const DuplicateIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

/**
 * WorkflowPreviewEmbed - Compact workflow preview card for chat messages
 * Displays workflow details, mini diagram, status, and metrics
 */
export function WorkflowPreviewEmbed({
  data,
  actions,
  showDiagram = true,
  compact = false,
  className,
  isLoading,
  isError,
  errorMessage,
  expanded: controlledExpanded,
  onExpandChange,
}: WorkflowPreviewEmbedProps) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const expanded = controlledExpanded ?? internalExpanded

  const _handleExpandToggle = useCallback(() => {
    const newValue = !expanded
    setInternalExpanded(newValue)
    onExpandChange?.(newValue)
  }, [expanded, onExpandChange])
  void _handleExpandToggle

  const statusConfig = STATUS_CONFIG[data.status]

  // Build hover actions
  const hoverActions = (
    <>
      {actions?.onEdit && (
        <EmbedActionButton
          icon={<EditIcon />}
          label="Edit workflow"
          onClick={() => actions.onEdit?.(data)}
        />
      )}
      {actions?.onRun && (
        <EmbedActionButton
          icon={<PlayIcon />}
          label="Run workflow"
          onClick={() => actions.onRun?.(data)}
        />
      )}
      {actions?.onDuplicate && (
        <EmbedActionButton
          icon={<DuplicateIcon />}
          label="Duplicate workflow"
          onClick={() => actions.onDuplicate?.(data)}
        />
      )}
      {actions?.onDelete && (
        <EmbedActionButton
          icon={<DeleteIcon />}
          label="Delete workflow"
          onClick={() => actions.onDelete?.(data)}
          variant="destructive"
        />
      )}
    </>
  )

  return (
    <EmbedContainer
      className={className}
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      onClick={() => actions?.onClick?.(data)}
      onDoubleClick={() => actions?.onDoubleClick?.(data)}
      hoverActions={hoverActions}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Workflow Icon */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>

          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm truncate">{data.name}</h4>
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                statusConfig.className
              )}>
                {statusConfig.icon}
                {statusConfig.label}
              </span>
            </div>
            {data.description && !compact && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {data.description}
              </p>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>{data.nodeCount} nodes</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Last run: {formatRelativeTime(data.lastRun)}</span>
          </div>
          {data.successRate !== undefined && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className={cn(
                data.successRate >= 90 ? 'text-green-600 dark:text-green-400' :
                data.successRate >= 70 ? 'text-amber-600 dark:text-amber-400' :
                'text-red-600 dark:text-red-400'
              )}>
                {data.successRate}% success
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mini Diagram */}
      {showDiagram && data.nodes.length > 0 && !compact && (
        <div className="px-4 pb-3">
          <div className="bg-muted/30 rounded-lg border border-border/50">
            <WorkflowDiagramMini
              nodes={data.nodes}
              maxVisible={5}
              onNodeClick={(node) => {
                void node // Unused variable pattern
              }}
              onExpandClick={() => actions?.onView?.(data)}
            />
          </div>
        </div>
      )}

      {/* Expand/Collapse Details */}
      {!compact && (
        <EmbedSection title="Details" defaultExpanded={expanded}>
          <div className="space-y-2 text-xs">
            {data.tags && data.tags.length > 0 && (
              <div>
                <span className="text-muted-foreground">Tags: </span>
                <span className="text-foreground">{data.tags.join(', ')}</span>
              </div>
            )}
            {data.createdAt && (
              <div>
                <span className="text-muted-foreground">Created: </span>
                <span className="text-foreground">
                  {typeof data.createdAt === 'string'
                    ? new Date(data.createdAt).toLocaleDateString()
                    : data.createdAt.toLocaleDateString()}
                </span>
              </div>
            )}
            {data.updatedAt && (
              <div>
                <span className="text-muted-foreground">Updated: </span>
                <span className="text-foreground">
                  {typeof data.updatedAt === 'string'
                    ? new Date(data.updatedAt).toLocaleDateString()
                    : data.updatedAt.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </EmbedSection>
      )}

      {/* Quick Actions Footer (Compact Mode) */}
      {compact && (
        <div className="px-4 pb-3 flex gap-2">
          {actions?.onRun && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                actions.onRun?.(data)
              }}
              className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
              data-embed-action
            >
              Run
            </button>
          )}
          {actions?.onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                actions.onEdit?.(data)
              }}
              className="flex-1 px-3 py-1.5 bg-muted text-foreground text-xs font-medium rounded-lg hover:bg-muted/80 transition-colors"
              data-embed-action
            >
              Edit
            </button>
          )}
        </div>
      )}
    </EmbedContainer>
  )
}

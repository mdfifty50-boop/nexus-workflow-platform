import React from 'react'

// Mini workflow preview component for chat interface (Story 5.9)
interface WorkflowPreviewProps {
  tasks: Array<{
    id: string
    name: string
    type: string
    description?: string
    status?: 'pending' | 'running' | 'completed' | 'failed'
  }>
  complexity?: 'simple' | 'medium' | 'complex'
  estimatedCost?: number
  estimatedTokens?: number
  compact?: boolean
}

const TYPE_ICONS: Record<string, string> = {
  agent: '🤖',
  integration: '🔌',
  condition: '🔀',
  transform: '🔄',
  trigger: '⚡',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-200 dark:bg-slate-700',
  running: 'bg-blue-500 animate-pulse',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
}

export function WorkflowPreview({
  tasks,
  complexity = 'medium',
  estimatedCost,
  estimatedTokens,
  compact = false,
}: WorkflowPreviewProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No tasks in this workflow
      </div>
    )
  }

  // Compact mode for inline chat display
  if (compact) {
    return (
      <div className="flex items-center gap-1 py-2 overflow-x-auto">
        {tasks.map((task, idx) => (
          <React.Fragment key={task.id || idx}>
            <div
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center text-sm
                ${task.status ? STATUS_COLORS[task.status] : 'bg-primary/20'}
                transition-colors
              `}
              title={`${task.name}: ${task.description || task.type}`}
            >
              {TYPE_ICONS[task.type] || '📦'}
            </div>
            {idx < tasks.length - 1 && (
              <div className="w-3 h-0.5 bg-border" />
            )}
          </React.Fragment>
        ))}
        {estimatedCost !== undefined && (
          <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap">
            ~${estimatedCost.toFixed(2)}
          </span>
        )}
      </div>
    )
  }

  // Full preview mode
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{tasks.length} Tasks</span>
          <span className={`
            px-2 py-0.5 text-xs rounded-full
            ${complexity === 'simple' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
              complexity === 'complex' ? 'bg-orange-500/20 text-orange-700 dark:text-orange-400' :
              'bg-blue-500/20 text-blue-700 dark:text-blue-400'}
          `}>
            {complexity}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {estimatedTokens !== undefined && (
            <span>{estimatedTokens.toLocaleString()} tokens</span>
          )}
          {estimatedCost !== undefined && (
            <span className="font-medium text-foreground">
              ~${estimatedCost.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {/* Visual workflow */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tasks.map((task, idx) => (
          <React.Fragment key={task.id || idx}>
            <div className="flex flex-col items-center min-w-[80px]">
              <div
                className={`
                  w-12 h-12 rounded-xl flex items-center justify-center text-lg
                  ${task.status ? STATUS_COLORS[task.status] : 'bg-muted'}
                  transition-all hover:scale-105
                `}
              >
                {TYPE_ICONS[task.type] || '📦'}
              </div>
              <p className="mt-1 text-xs text-center truncate w-full" title={task.name}>
                {task.name.length > 12 ? task.name.slice(0, 12) + '...' : task.name}
              </p>
            </div>
            {idx < tasks.length - 1 && (
              <div className="flex-shrink-0 w-6 h-0.5 bg-border" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Task list (collapsible) */}
      <details className="mt-4">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
          View task details
        </summary>
        <div className="mt-2 space-y-2">
          {tasks.map((task, idx) => (
            <div
              key={task.id || idx}
              className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 text-sm"
            >
              <span className="flex-shrink-0">{TYPE_ICONS[task.type] || '📦'}</span>
              <div className="min-w-0">
                <p className="font-medium truncate">{task.name}</p>
                {task.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {task.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}

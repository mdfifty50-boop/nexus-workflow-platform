/**
 * Quick Stats Widget
 *
 * Compact workflow statistics display for the chat sidebar.
 * Shows active, completed, failed workflows and success rate.
 */

import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

export interface WorkflowStats {
  /** Number of currently active workflows */
  active: number
  /** Number of completed workflows */
  completed: number
  /** Number of failed workflows */
  failed: number
  /** Number of total workflow executions */
  total: number
}

export interface QuickStatsWidgetProps {
  /** Workflow statistics to display */
  stats?: WorkflowStats
  /** Whether data is loading */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
  /** Click handler for individual stats */
  onStatClick?: (statType: keyof WorkflowStats) => void
}

// =============================================================================
// DEFAULT STATS
// =============================================================================

const DEFAULT_STATS: WorkflowStats = {
  active: 0,
  completed: 0,
  failed: 0,
  total: 0
}

// =============================================================================
// ICONS
// =============================================================================

function PlayCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  )
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function StatSkeleton() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-muted/50" />
      <div className="flex-1">
        <div className="h-4 w-8 bg-muted/50 rounded mb-1" />
        <div className="h-3 w-16 bg-muted/30 rounded" />
      </div>
    </div>
  )
}

// =============================================================================
// COMPONENT
// =============================================================================

export function QuickStatsWidget({
  stats = DEFAULT_STATS,
  loading = false,
  className,
  onStatClick
}: QuickStatsWidgetProps) {
  // Calculate success rate
  const successRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0

  const statItems = [
    {
      key: 'active' as const,
      label: 'Active',
      value: stats.active,
      icon: PlayCircleIcon,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      hoverColor: 'hover:bg-cyan-500/20'
    },
    {
      key: 'completed' as const,
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircleIcon,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      hoverColor: 'hover:bg-emerald-500/20'
    },
    {
      key: 'failed' as const,
      label: 'Failed',
      value: stats.failed,
      icon: XCircleIcon,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      hoverColor: 'hover:bg-red-500/20'
    }
  ]

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Workflow Stats
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <StatSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Workflow Stats
        </span>
        <span className="text-xs text-muted-foreground">
          {stats.total} total
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        {statItems.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.key}
              onClick={() => onStatClick?.(item.key)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
                item.bgColor,
                item.hoverColor,
                onStatClick && 'cursor-pointer'
              )}
            >
              <Icon className={cn('w-5 h-5', item.color)} />
              <span className={cn('text-lg font-bold', item.color)}>
                {item.value}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Success Rate Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <ChartIcon className="w-3.5 h-3.5" />
            Success Rate
          </span>
          <span className={cn(
            'font-semibold',
            successRate >= 80 ? 'text-emerald-400' :
            successRate >= 50 ? 'text-yellow-400' :
            'text-red-400'
          )}>
            {successRate}%
          </span>
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              successRate >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
              successRate >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
              'bg-gradient-to-r from-red-500 to-rose-400'
            )}
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default QuickStatsWidget

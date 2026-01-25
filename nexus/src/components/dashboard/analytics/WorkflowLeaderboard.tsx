/**
 * WorkflowLeaderboard Component
 *
 * Displays top performing workflows in a ranked list format.
 *
 * Features:
 * - Ranked list of most used workflows
 * - Execution count display
 * - Success rate indicators
 * - Time saved per workflow
 * - Sparkline mini-charts for trends
 * - Sortable columns
 * - Loading and empty states
 */

import { useState, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle,
  Play,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react'
import { MetricTrendCompact } from './MetricTrend'
import type {
  WorkflowLeaderboardProps,
  WorkflowPerformance,
  LeaderboardSort,
} from './analytics-types'
import { LEADERBOARD_SORT, TREND_DIRECTIONS } from './analytics-types'

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MAX_ITEMS = 5

const SORT_OPTIONS: Array<{ value: LeaderboardSort; label: string }> = [
  { value: LEADERBOARD_SORT.EXECUTIONS, label: 'Most Executed' },
  { value: LEADERBOARD_SORT.SUCCESS_RATE, label: 'Highest Success' },
  { value: LEADERBOARD_SORT.TIME_SAVED, label: 'Most Time Saved' },
]

// =============================================================================
// Mock Data Generation
// =============================================================================

function generateMockWorkflows(): WorkflowPerformance[] {
  const workflowNames = [
    'Email Automation Pipeline',
    'Customer Onboarding Flow',
    'Data Sync Integration',
    'Invoice Processing',
    'Lead Nurture Sequence',
    'Support Ticket Router',
    'Report Generator',
    'Social Media Scheduler',
    'Inventory Alert System',
    'Contract Renewal Reminder',
  ]

  return workflowNames.map((name, index) => ({
    id: `workflow-${index + 1}`,
    name,
    executionCount: Math.floor(Math.random() * 500) + 50,
    successRate: 85 + Math.random() * 14,
    timeSavedMinutes: Math.floor(Math.random() * 120) + 10,
    recentTrend: Array.from({ length: 7 }, () =>
      Math.floor(Math.random() * 30) + 5
    ),
    lastExecuted: new Date(
      Date.now() - Math.floor(Math.random() * 86400000 * 3)
    ).toISOString(),
  }))
}

// =============================================================================
// Sub-Components
// =============================================================================

interface SparklineProps {
  data: number[]
  color?: string
  className?: string
}

function Sparkline({ data, color = '#06b6d4', className }: SparklineProps) {
  const maxValue = Math.max(...data, 1)
  const minValue = Math.min(...data, 0)
  const range = maxValue - minValue || 1

  const width = 60
  const height = 24
  const padding = 2

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
      const y =
        height - padding - ((value - minValue) / range) * (height - 2 * padding)
      return `${x},${y}`
    })
    .join(' ')

  // Calculate trend direction based on first and last values
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  const isUpward = secondAvg >= firstAvg

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      {/* Gradient fill under the line */}
      <defs>
        <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <polygon
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill="url(#sparkGradient)"
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End dot */}
      <circle
        cx={width - padding}
        cy={
          height -
          padding -
          ((data[data.length - 1] - minValue) / range) * (height - 2 * padding)
        }
        r="2"
        fill={isUpward ? '#22c55e' : '#f59e0b'}
      />
    </svg>
  )
}

interface RankBadgeProps {
  rank: number
}

function RankBadge({ rank }: RankBadgeProps) {
  const getStyle = () => {
    switch (rank) {
      case 1:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 2:
        return 'bg-slate-400/20 text-slate-300 border-slate-400/30'
      case 3:
        return 'bg-orange-600/20 text-orange-400 border-orange-600/30'
      default:
        return 'bg-slate-700/50 text-slate-400 border-slate-600/30'
    }
  }

  return (
    <div
      className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center',
        'text-xs font-bold border',
        getStyle()
      )}
    >
      {rank <= 3 ? (
        <Trophy className={cn('w-3.5 h-3.5', rank === 1 && 'fill-current')} />
      ) : (
        rank
      )}
    </div>
  )
}

interface WorkflowRowProps {
  workflow: WorkflowPerformance
  rank: number
  onClick?: (workflowId: string) => void
}

function WorkflowRow({ workflow, rank, onClick }: WorkflowRowProps) {
  const trendPercentage = useMemo(() => {
    const trend = workflow.recentTrend
    if (trend.length < 2) return 0
    const firstHalf = trend.slice(0, Math.floor(trend.length / 2))
    const secondHalf = trend.slice(Math.floor(trend.length / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length || 1
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    return ((secondAvg - firstAvg) / firstAvg) * 100
  }, [workflow.recentTrend])

  const trendDirection = useMemo(() => {
    if (Math.abs(trendPercentage) < 5) return TREND_DIRECTIONS.NEUTRAL
    return trendPercentage > 0 ? TREND_DIRECTIONS.UP : TREND_DIRECTIONS.DOWN
  }, [trendPercentage])

  const handleClick = useCallback(() => {
    onClick?.(workflow.id)
  }, [onClick, workflow.id])

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        'hover:bg-slate-800/50 transition-colors',
        onClick && 'cursor-pointer'
      )}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {/* Rank */}
      <RankBadge rank={rank} />

      {/* Workflow Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">
          {workflow.name}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Play className="w-3 h-3" />
            {workflow.executionCount.toLocaleString()}
          </span>
          <span
            className={cn(
              'text-xs flex items-center gap-1',
              workflow.successRate >= 95
                ? 'text-emerald-400'
                : workflow.successRate >= 85
                  ? 'text-amber-400'
                  : 'text-red-400'
            )}
          >
            <CheckCircle className="w-3 h-3" />
            {workflow.successRate.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {workflow.timeSavedMinutes}m saved
          </span>
        </div>
      </div>

      {/* Sparkline & Trend */}
      <div className="flex items-center gap-2">
        <Sparkline data={workflow.recentTrend} />
        <MetricTrendCompact
          direction={trendDirection}
          percentage={Math.abs(trendPercentage)}
        />
      </div>
    </div>
  )
}

function LoadingSkeleton({ count }: { count: number }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-7 h-7 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="w-16 h-6" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Sparkles className="w-12 h-12 text-slate-600 mb-4" />
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        No Workflows Yet
      </h3>
      <p className="text-sm text-slate-500 max-w-sm">
        Create and run workflows to see your top performers appear here.
      </p>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function WorkflowLeaderboard({
  workflows: externalWorkflows,
  maxItems = DEFAULT_MAX_ITEMS,
  sortBy: externalSortBy,
  onWorkflowClick,
  isLoading = false,
  className,
}: WorkflowLeaderboardProps) {
  const [internalSortBy, setInternalSortBy] = useState<LeaderboardSort>(
    LEADERBOARD_SORT.EXECUTIONS
  )

  const sortBy = externalSortBy ?? internalSortBy

  const rawWorkflows = useMemo(() => {
    if (externalWorkflows && externalWorkflows.length > 0) {
      return externalWorkflows
    }
    return generateMockWorkflows()
  }, [externalWorkflows])

  const sortedWorkflows = useMemo(() => {
    const sorted = [...rawWorkflows].sort((a, b) => {
      switch (sortBy) {
        case LEADERBOARD_SORT.SUCCESS_RATE:
          return b.successRate - a.successRate
        case LEADERBOARD_SORT.TIME_SAVED:
          return b.timeSavedMinutes - a.timeSavedMinutes
        case LEADERBOARD_SORT.EXECUTIONS:
        default:
          return b.executionCount - a.executionCount
      }
    })
    return sorted.slice(0, maxItems)
  }, [rawWorkflows, sortBy, maxItems])

  const currentSortOption = useMemo(
    () => SORT_OPTIONS.find((opt) => opt.value === sortBy) ?? SORT_OPTIONS[0],
    [sortBy]
  )

  const totalTimeSaved = useMemo(
    () => sortedWorkflows.reduce((sum, w) => sum + w.timeSavedMinutes, 0),
    [sortedWorkflows]
  )

  const handleSortCycle = useCallback(() => {
    const currentIndex = SORT_OPTIONS.findIndex((opt) => opt.value === sortBy)
    const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length
    setInternalSortBy(SORT_OPTIONS[nextIndex].value)
  }, [sortBy])

  if (isLoading) {
    return <LoadingSkeleton count={maxItems} />
  }

  const isEmpty = sortedWorkflows.length === 0

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-amber-400" />
              Top Workflows
            </CardTitle>
            <CardDescription>
              {isEmpty ? (
                'No workflow data available'
              ) : (
                <>
                  Sorted by{' '}
                  <span className="text-slate-300">
                    {currentSortOption.label.toLowerCase()}
                  </span>{' '}
                  - {totalTimeSaved}m total time saved
                </>
              )}
            </CardDescription>
          </div>

          {!isEmpty && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSortCycle}
              className="gap-2"
            >
              <ArrowUpDown className="w-4 h-4" />
              {currentSortOption.label}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="space-y-1">
            {sortedWorkflows.map((workflow, index) => (
              <WorkflowRow
                key={workflow.id}
                workflow={workflow}
                rank={index + 1}
                onClick={onWorkflowClick}
              />
            ))}
          </div>
        )}

        {/* Summary Footer */}
        {!isEmpty && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">
                Showing top {sortedWorkflows.length} of {rawWorkflows.length}{' '}
                workflows
              </span>
              <div className="flex items-center gap-2 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">
                  {Math.floor(totalTimeSaved / 60)}h {totalTimeSaved % 60}m saved
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default WorkflowLeaderboard

/**
 * ExecutionChart Component
 *
 * Line/bar chart showing workflow executions over time.
 *
 * Features:
 * - Time period selector (7d, 30d, 90d)
 * - Stacked bar chart with success/failed breakdown
 * - Hover tooltips with detailed information
 * - Responsive sizing
 * - Loading and empty states
 * - Trend indicators
 */

import { useState, useMemo, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { MetricTrend } from './MetricTrend'
import type {
  ExecutionChartProps,
  ExecutionDataPoint,
  TimePeriod,
} from './analytics-types'
import {
  TIME_PERIODS,
  TREND_DIRECTIONS,
  DEFAULT_CHART_COLORS,
} from './analytics-types'

// =============================================================================
// Constants
// =============================================================================

const PERIOD_OPTIONS: Array<{ value: TimePeriod; label: string; days: number }> = [
  { value: TIME_PERIODS.SEVEN_DAYS, label: '7 Days', days: 7 },
  { value: TIME_PERIODS.THIRTY_DAYS, label: '30 Days', days: 30 },
  { value: TIME_PERIODS.NINETY_DAYS, label: '90 Days', days: 90 },
]

// =============================================================================
// Mock Data Generation
// =============================================================================

function generateMockData(days: number): ExecutionDataPoint[] {
  const data: ExecutionDataPoint[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Generate realistic looking data with some variance
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // Lower executions on weekends
    const baseExecutions = isWeekend ? 15 : 45
    const variance = Math.random() * 30

    const total = Math.floor(baseExecutions + variance)
    const successRate = 0.88 + Math.random() * 0.1 // 88-98% success
    const successful = Math.floor(total * successRate)

    data.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      timestamp: date.getTime(),
      total,
      successful,
      failed: total - successful,
    })
  }

  return data
}

// =============================================================================
// Sub-Components
// =============================================================================

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    color?: string
    dataKey?: string
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const successful = payload.find((p) => p.dataKey === 'successful')?.value ?? 0
  const failed = payload.find((p) => p.dataKey === 'failed')?.value ?? 0
  const total = successful + failed
  const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : '0'

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5" />
        {label}
      </p>
      <div className="space-y-1.5">
        <p className="text-sm flex items-center justify-between gap-4">
          <span className="text-slate-400">Total:</span>
          <span className="font-semibold text-slate-200">{total}</span>
        </p>
        <p className="text-sm flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-400">Successful:</span>
          </span>
          <span className="font-semibold text-emerald-400">{successful}</span>
        </p>
        <p className="text-sm flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <XCircle className="w-3 h-3 text-red-400" />
            <span className="text-slate-400">Failed:</span>
          </span>
          <span className="font-semibold text-red-400">{failed}</span>
        </p>
        <div className="border-t border-slate-700 pt-1.5 mt-1.5">
          <p className="text-sm flex items-center justify-between gap-4">
            <span className="text-slate-400">Success Rate:</span>
            <span
              className={cn(
                'font-semibold',
                Number(successRate) >= 95
                  ? 'text-emerald-400'
                  : Number(successRate) >= 85
                    ? 'text-amber-400'
                    : 'text-red-400'
              )}
            >
              {successRate}%
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

interface PeriodSelectorProps {
  value: TimePeriod
  onChange: (period: TimePeriod) => void
}

function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg">
      {PERIOD_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            value === option.value
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  bgColor: string
}

function StatCard({ label, value, icon, color, bgColor }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        bgColor,
        'border-opacity-30'
      )}
    >
      <div className={cn('p-2 rounded-lg', bgColor)}>{icon}</div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className={cn('text-lg font-bold', color)}>
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BarChart3 className="w-12 h-12 text-slate-600 mb-4" />
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        No Execution Data
      </h3>
      <p className="text-sm text-slate-500 max-w-sm">
        Start running workflows to see execution statistics appear here.
      </p>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function ExecutionChart({
  data: externalData,
  period: externalPeriod,
  onPeriodChange,
  isLoading = false,
  className,
}: ExecutionChartProps) {
  const [internalPeriod, setInternalPeriod] = useState<TimePeriod>(
    TIME_PERIODS.SEVEN_DAYS
  )

  const period = externalPeriod ?? internalPeriod

  const handlePeriodChange = useCallback(
    (newPeriod: TimePeriod) => {
      setInternalPeriod(newPeriod)
      onPeriodChange?.(newPeriod)
    },
    [onPeriodChange]
  )

  const periodConfig = useMemo(
    () => PERIOD_OPTIONS.find((p) => p.value === period) ?? PERIOD_OPTIONS[0],
    [period]
  )

  const chartData = useMemo(() => {
    if (externalData && externalData.length > 0) {
      return externalData
    }
    return generateMockData(periodConfig.days)
  }, [externalData, periodConfig.days])

  const stats = useMemo(() => {
    const total = chartData.reduce((sum, d) => sum + d.total, 0)
    const successful = chartData.reduce((sum, d) => sum + d.successful, 0)
    const failed = chartData.reduce((sum, d) => sum + d.failed, 0)
    const successRate = total > 0 ? (successful / total) * 100 : 0

    // Calculate trend (compare first half to second half)
    const midpoint = Math.floor(chartData.length / 2)
    const firstHalf = chartData.slice(0, midpoint)
    const secondHalf = chartData.slice(midpoint)

    const firstHalfAvg =
      firstHalf.reduce((sum, d) => sum + d.total, 0) / firstHalf.length || 0
    const secondHalfAvg =
      secondHalf.reduce((sum, d) => sum + d.total, 0) / secondHalf.length || 0

    const trendPercentage =
      firstHalfAvg > 0
        ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
        : 0

    const trendDirection =
      Math.abs(trendPercentage) < 1
        ? TREND_DIRECTIONS.NEUTRAL
        : trendPercentage > 0
          ? TREND_DIRECTIONS.UP
          : TREND_DIRECTIONS.DOWN

    return {
      total,
      successful,
      failed,
      successRate,
      trendPercentage: Math.abs(trendPercentage),
      trendDirection,
    }
  }, [chartData])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  const isEmpty = chartData.length === 0 || stats.total === 0

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Workflow Executions
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span>Execution trends over the selected period</span>
              {!isEmpty && (
                <MetricTrend
                  direction={stats.trendDirection}
                  percentage={stats.trendPercentage}
                  comparisonLabel="vs prior period"
                  size="sm"
                />
              )}
            </CardDescription>
          </div>
          <PeriodSelector value={period} onChange={handlePeriodChange} />
        </div>
      </CardHeader>

      <CardContent>
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard
                label="Total Executions"
                value={stats.total}
                icon={<TrendingUp className="w-5 h-5 text-cyan-400" />}
                color="text-cyan-400"
                bgColor="bg-cyan-500/10"
              />
              <StatCard
                label="Successful"
                value={stats.successful}
                icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
                color="text-emerald-400"
                bgColor="bg-emerald-500/10"
              />
              <StatCard
                label="Failed"
                value={stats.failed}
                icon={<XCircle className="w-5 h-5 text-red-400" />}
                color="text-red-400"
                bgColor="bg-red-500/10"
              />
            </div>

            {/* Chart */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="15%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={
                      chartData.length > 14
                        ? Math.floor(chartData.length / 7)
                        : 0
                    }
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) =>
                      value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
                    }
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 16 }}
                    formatter={(value: string) => (
                      <span className="text-xs text-slate-400">{value}</span>
                    )}
                  />
                  <Bar
                    dataKey="successful"
                    name="Successful"
                    stackId="executions"
                    fill={DEFAULT_CHART_COLORS.success}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="failed"
                    name="Failed"
                    stackId="executions"
                    fill={DEFAULT_CHART_COLORS.error}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Success Rate Footer */}
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Overall Success Rate
              </span>
              <span
                className={cn(
                  'text-lg font-bold',
                  stats.successRate >= 95
                    ? 'text-emerald-400'
                    : stats.successRate >= 85
                      ? 'text-amber-400'
                      : 'text-red-400'
                )}
              >
                {stats.successRate.toFixed(1)}%
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ExecutionChart

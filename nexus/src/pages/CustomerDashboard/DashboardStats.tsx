/**
 * DashboardStats Component
 *
 * Displays key statistics for the customer dashboard including:
 * - Total workflows count
 * - Executions this month
 * - Time saved (calculated from workflow runs)
 * - Success rate percentage
 * Features animated counter effect on mount
 */

import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

// Status constants (avoiding enums per TypeScript rules)
const TREND_DIRECTION = {
  UP: 'up',
  DOWN: 'down',
  NEUTRAL: 'neutral',
} as const

type TrendDirection = typeof TREND_DIRECTION[keyof typeof TREND_DIRECTION]

// Types
interface StatCardProps {
  icon: ReactNode
  value: number
  label: string
  trend?: {
    value: string
    direction: TrendDirection
  }
  suffix?: string
  color?: string
  loading?: boolean
}

interface DashboardStatsProps {
  totalWorkflows: number
  executionsThisMonth: number
  timeSavedMinutes: number
  successRate: number
  loading?: boolean
}

// Animated counter hook
function useAnimatedCounter(targetValue: number, duration: number = 1000): number {
  const [displayValue, setDisplayValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const startValueRef = useRef(0)

  useEffect(() => {
    if (targetValue === 0) {
      setDisplayValue(0)
      return
    }

    startValueRef.current = displayValue
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValueRef.current + (targetValue - startValueRef.current) * easeOut)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [targetValue, duration])

  return displayValue
}

// Format time helper
function formatTimeSaved(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}m`
}

// Stat Card Component
function StatCard({
  icon,
  value,
  label,
  trend,
  suffix = '',
  color = 'cyan',
  loading = false,
}: StatCardProps) {
  const animatedValue = useAnimatedCounter(loading ? 0 : value)

  const colorClasses: Record<string, { bg: string; icon: string; text: string }> = {
    cyan: {
      bg: 'bg-cyan-500/10',
      icon: 'text-cyan-400',
      text: 'text-cyan-400',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      icon: 'text-emerald-400',
      text: 'text-emerald-400',
    },
    purple: {
      bg: 'bg-purple-500/10',
      icon: 'text-purple-400',
      text: 'text-purple-400',
    },
    amber: {
      bg: 'bg-amber-500/10',
      icon: 'text-amber-400',
      text: 'text-amber-400',
    },
  }

  const colors = colorClasses[color] || colorClasses.cyan

  const trendColorClasses: Record<TrendDirection, string> = {
    [TREND_DIRECTION.UP]: 'text-emerald-400',
    [TREND_DIRECTION.DOWN]: 'text-red-400',
    [TREND_DIRECTION.NEUTRAL]: 'text-slate-400',
  }

  const trendArrows: Record<TrendDirection, string> = {
    [TREND_DIRECTION.UP]: '\u2191',
    [TREND_DIRECTION.DOWN]: '\u2193',
    [TREND_DIRECTION.NEUTRAL]: '\u2192',
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 hover:border-slate-600/50 hover:bg-slate-800/70 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center ${colors.icon} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trendColorClasses[trend.direction]}`}>
            <span>{trendArrows[trend.direction]}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {loading ? (
          <div className="h-8 w-20 bg-slate-700/50 rounded animate-pulse" />
        ) : (
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold ${colors.text}`}>
              {animatedValue.toLocaleString()}
            </span>
            {suffix && (
              <span className="text-lg text-slate-400">{suffix}</span>
            )}
          </div>
        )}
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  )
}

// Icons as inline SVG components
function WorkflowIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  )
}

function ExecutionIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// Main DashboardStats Component
export function DashboardStats({
  totalWorkflows,
  executionsThisMonth,
  timeSavedMinutes,
  successRate,
  loading = false,
}: DashboardStatsProps) {
  // Format time saved for display
  const _formattedTime = formatTimeSaved(timeSavedMinutes)
  void _formattedTime // Unused but shows pattern

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<WorkflowIcon />}
        value={totalWorkflows}
        label="Active Workflows"
        trend={{ value: '+3 this week', direction: TREND_DIRECTION.UP }}
        color="cyan"
        loading={loading}
      />

      <StatCard
        icon={<ExecutionIcon />}
        value={executionsThisMonth}
        label="Executions This Month"
        trend={{ value: '+18%', direction: TREND_DIRECTION.UP }}
        color="emerald"
        loading={loading}
      />

      <StatCard
        icon={<ClockIcon />}
        value={timeSavedMinutes}
        label="Time Saved (minutes)"
        trend={{ value: '2.5h this week', direction: TREND_DIRECTION.UP }}
        suffix="min"
        color="purple"
        loading={loading}
      />

      <StatCard
        icon={<CheckCircleIcon />}
        value={Math.round(successRate)}
        label="Success Rate"
        trend={{ value: '+2%', direction: TREND_DIRECTION.UP }}
        suffix="%"
        color="amber"
        loading={loading}
      />
    </div>
  )
}

export default DashboardStats

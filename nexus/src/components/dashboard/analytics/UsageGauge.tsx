/**
 * UsageGauge Component
 *
 * Circular gauge showing usage metrics with animated fill.
 *
 * Features:
 * - Current usage percentage display
 * - Limit value indicator
 * - Color gradient (green -> yellow -> red)
 * - Animated fill on mount
 * - Metric labels
 * - Loading state with skeleton
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle } from 'lucide-react'
import type { UsageGaugeProps, UsageStatus } from './analytics-types'
import { USAGE_STATUS } from './analytics-types'

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_WARNING_THRESHOLD = 70
const DEFAULT_CRITICAL_THRESHOLD = 90
const DEFAULT_ANIMATION_DURATION = 1000
const GAUGE_RADIUS = 80
const GAUGE_STROKE_WIDTH = 12
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS

// SVG viewBox dimensions
const SVG_SIZE = 200
const SVG_CENTER = SVG_SIZE / 2

// =============================================================================
// Helper Functions
// =============================================================================

function getUsageStatus(
  percentage: number,
  warningThreshold: number,
  criticalThreshold: number
): UsageStatus {
  if (percentage >= criticalThreshold) return USAGE_STATUS.CRITICAL
  if (percentage >= warningThreshold) return USAGE_STATUS.WARNING
  return USAGE_STATUS.HEALTHY
}

function getStatusColor(status: UsageStatus): string {
  switch (status) {
    case USAGE_STATUS.CRITICAL:
      return '#ef4444' // red-500
    case USAGE_STATUS.WARNING:
      return '#f59e0b' // amber-500
    case USAGE_STATUS.HEALTHY:
    default:
      return '#22c55e' // green-500
  }
}

function getStatusGradient(status: UsageStatus): string {
  switch (status) {
    case USAGE_STATUS.CRITICAL:
      return 'url(#criticalGradient)'
    case USAGE_STATUS.WARNING:
      return 'url(#warningGradient)'
    case USAGE_STATUS.HEALTHY:
    default:
      return 'url(#healthyGradient)'
  }
}

function getStatusTextColor(status: UsageStatus): string {
  switch (status) {
    case USAGE_STATUS.CRITICAL:
      return 'text-red-400'
    case USAGE_STATUS.WARNING:
      return 'text-amber-400'
    case USAGE_STATUS.HEALTHY:
    default:
      return 'text-emerald-400'
  }
}

function getStatusBgColor(status: UsageStatus): string {
  switch (status) {
    case USAGE_STATUS.CRITICAL:
      return 'bg-red-500/10'
    case USAGE_STATUS.WARNING:
      return 'bg-amber-500/10'
    case USAGE_STATUS.HEALTHY:
    default:
      return 'bg-emerald-500/10'
  }
}

// =============================================================================
// Custom Hook for Animation
// =============================================================================

function useAnimatedValue(
  targetValue: number,
  duration: number
): number {
  const [currentValue, setCurrentValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const targetRef = useRef(targetValue)
  const durationRef = useRef(duration)

  // Update refs when values change
  useEffect(() => {
    targetRef.current = targetValue
    durationRef.current = duration
  }, [targetValue, duration])

  useEffect(() => {
    startTimeRef.current = null

    function runAnimation(timestamp: number) {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / durationRef.current, 1)

      // Easing function (ease-out-cubic)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      setCurrentValue(targetRef.current * easedProgress)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(runAnimation)
      }
    }

    animationFrameRef.current = requestAnimationFrame(runAnimation)

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [targetValue, duration])

  return currentValue
}

// =============================================================================
// Sub-Components
// =============================================================================

function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center p-6', className)}>
      <Skeleton className="w-[200px] h-[200px] rounded-full" />
      <Skeleton className="h-4 w-24 mt-4" />
      <Skeleton className="h-3 w-32 mt-2" />
    </div>
  )
}

function GaugeGradients() {
  return (
    <defs>
      {/* Healthy (Green) Gradient */}
      <linearGradient id="healthyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>

      {/* Warning (Yellow/Amber) Gradient */}
      <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>

      {/* Critical (Red) Gradient */}
      <linearGradient id="criticalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>

      {/* Glow filter */}
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function UsageGauge({
  current,
  limit,
  label,
  unit = 'used',
  animationDuration = DEFAULT_ANIMATION_DURATION,
  warningThreshold = DEFAULT_WARNING_THRESHOLD,
  criticalThreshold = DEFAULT_CRITICAL_THRESHOLD,
  isLoading = false,
  className,
}: UsageGaugeProps) {
  const percentage = useMemo(() => {
    if (limit <= 0) return 0
    return Math.min(100, Math.max(0, (current / limit) * 100))
  }, [current, limit])

  const animatedPercentage = useAnimatedValue(percentage, animationDuration)

  const status = useMemo(
    () => getUsageStatus(percentage, warningThreshold, criticalThreshold),
    [percentage, warningThreshold, criticalThreshold]
  )

  const strokeDashoffset = useMemo(() => {
    // Calculate the offset for the circular progress
    // We want the gauge to start from the top (270 degrees rotation handles this)
    return GAUGE_CIRCUMFERENCE * (1 - animatedPercentage / 100)
  }, [animatedPercentage])

  const statusGradient = getStatusGradient(status)
  const statusTextColor = getStatusTextColor(status)
  const statusBgColor = getStatusBgColor(status)

  if (isLoading) {
    return <LoadingSkeleton className={className} />
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center p-4 rounded-xl',
        statusBgColor,
        'border border-slate-700/50',
        className
      )}
    >
      {/* Gauge SVG */}
      <div className="relative">
        <svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="transform -rotate-90"
        >
          <GaugeGradients />

          {/* Background circle */}
          <circle
            cx={SVG_CENTER}
            cy={SVG_CENTER}
            r={GAUGE_RADIUS}
            fill="none"
            stroke="#1e293b"
            strokeWidth={GAUGE_STROKE_WIDTH}
          />

          {/* Progress circle */}
          <circle
            cx={SVG_CENTER}
            cy={SVG_CENTER}
            r={GAUGE_RADIUS}
            fill="none"
            stroke={statusGradient}
            strokeWidth={GAUGE_STROKE_WIDTH}
            strokeDasharray={GAUGE_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#glow)"
            className="transition-all duration-300"
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = (tick / 100) * 360 - 90
            const radians = (angle * Math.PI) / 180
            const innerRadius = GAUGE_RADIUS - GAUGE_STROKE_WIDTH - 4
            const outerRadius = GAUGE_RADIUS - GAUGE_STROKE_WIDTH - 12

            const x1 = SVG_CENTER + innerRadius * Math.cos(radians)
            const y1 = SVG_CENTER + innerRadius * Math.sin(radians)
            const x2 = SVG_CENTER + outerRadius * Math.cos(radians)
            const y2 = SVG_CENTER + outerRadius * Math.sin(radians)

            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#475569"
                strokeWidth={tick % 50 === 0 ? 2 : 1}
              />
            )
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'text-4xl font-bold tabular-nums tracking-tight',
              statusTextColor
            )}
          >
            {animatedPercentage.toFixed(0)}%
          </span>
          <span className="text-xs text-slate-400 mt-1">{unit}</span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center mt-2">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {current.toLocaleString()} / {limit.toLocaleString()}
        </p>
      </div>

      {/* Warning indicator */}
      {status !== USAGE_STATUS.HEALTHY && (
        <div
          className={cn(
            'flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full',
            status === USAGE_STATUS.CRITICAL
              ? 'bg-red-500/20 text-red-400'
              : 'bg-amber-500/20 text-amber-400'
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            {status === USAGE_STATUS.CRITICAL
              ? 'Critical usage'
              : 'Approaching limit'}
          </span>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Compact Variant
// =============================================================================

interface UsageGaugeCompactProps {
  current: number
  limit: number
  label: string
  className?: string
}

export function UsageGaugeCompact({
  current,
  limit,
  label,
  className,
}: UsageGaugeCompactProps) {
  const percentage = useMemo(() => {
    if (limit <= 0) return 0
    return Math.min(100, Math.max(0, (current / limit) * 100))
  }, [current, limit])

  const status = useMemo(
    () =>
      getUsageStatus(percentage, DEFAULT_WARNING_THRESHOLD, DEFAULT_CRITICAL_THRESHOLD),
    [percentage]
  )

  const statusColor = getStatusColor(status)
  const statusTextColor = getStatusTextColor(status)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Mini circular gauge */}
      <div className="relative w-10 h-10">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          className="transform -rotate-90"
        >
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="#1e293b"
            strokeWidth="4"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke={statusColor}
            strokeWidth="4"
            strokeDasharray={2 * Math.PI * 16}
            strokeDashoffset={2 * Math.PI * 16 * (1 - percentage / 100)}
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{label}</p>
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-bold tabular-nums', statusTextColor)}>
            {percentage.toFixed(0)}%
          </span>
          <span className="text-xs text-slate-400">
            {current.toLocaleString()} / {limit.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export default UsageGauge

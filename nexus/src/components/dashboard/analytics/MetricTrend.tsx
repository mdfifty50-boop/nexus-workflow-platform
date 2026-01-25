/**
 * MetricTrend Component
 *
 * Displays trend indicators with directional arrows, percentage changes,
 * and color coding for metric comparisons.
 *
 * Features:
 * - Arrow up/down/neutral indicators
 * - Percentage change display
 * - Color coding (green for positive, red for negative)
 * - Comparison period label
 * - Size variants (sm, md, lg)
 * - Mount animation support
 */

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { MetricTrendProps, TrendDirection } from './analytics-types'
import { TREND_DIRECTIONS } from './analytics-types'

// =============================================================================
// Size Configuration
// =============================================================================

interface SizeConfig {
  icon: string
  text: string
  label: string
  gap: string
}

const SIZE_CONFIGS: Record<'sm' | 'md' | 'lg', SizeConfig> = {
  sm: {
    icon: 'w-3 h-3',
    text: 'text-xs',
    label: 'text-[10px]',
    gap: 'gap-0.5',
  },
  md: {
    icon: 'w-4 h-4',
    text: 'text-sm',
    label: 'text-xs',
    gap: 'gap-1',
  },
  lg: {
    icon: 'w-5 h-5',
    text: 'text-base',
    label: 'text-sm',
    gap: 'gap-1.5',
  },
}

// =============================================================================
// Icon Component
// =============================================================================

interface TrendIconProps {
  direction: TrendDirection
  className?: string
}

function TrendIconDisplay({ direction, className }: TrendIconProps) {
  switch (direction) {
    case TREND_DIRECTIONS.UP:
      return <TrendingUp className={className} aria-hidden="true" />
    case TREND_DIRECTIONS.DOWN:
      return <TrendingDown className={className} aria-hidden="true" />
    case TREND_DIRECTIONS.NEUTRAL:
    default:
      return <Minus className={className} aria-hidden="true" />
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function getTrendColor(
  direction: TrendDirection,
  positiveIsGood: boolean
): string {
  if (direction === TREND_DIRECTIONS.NEUTRAL) {
    return 'text-slate-400'
  }

  const isPositive = direction === TREND_DIRECTIONS.UP
  const isGood = positiveIsGood ? isPositive : !isPositive

  return isGood ? 'text-emerald-400' : 'text-red-400'
}

function getTrendBackground(
  direction: TrendDirection,
  positiveIsGood: boolean
): string {
  if (direction === TREND_DIRECTIONS.NEUTRAL) {
    return 'bg-slate-800/50'
  }

  const isPositive = direction === TREND_DIRECTIONS.UP
  const isGood = positiveIsGood ? isPositive : !isPositive

  return isGood ? 'bg-emerald-500/10' : 'bg-red-500/10'
}

// =============================================================================
// Component
// =============================================================================

export function MetricTrend({
  direction,
  percentage,
  comparisonLabel,
  size = 'md',
  positiveIsGood = true,
  animate = true,
  className,
}: MetricTrendProps) {
  const sizeConfig = SIZE_CONFIGS[size]
  const colorClass = getTrendColor(direction, positiveIsGood)
  const bgClass = getTrendBackground(direction, positiveIsGood)

  const formattedPercentage = useMemo(() => {
    const absValue = Math.abs(percentage)
    if (absValue >= 100) {
      return absValue.toFixed(0)
    }
    if (absValue >= 10) {
      return absValue.toFixed(1)
    }
    return absValue.toFixed(2)
  }, [percentage])

  const ariaLabel = useMemo(() => {
    const directionText =
      direction === TREND_DIRECTIONS.UP
        ? 'increased'
        : direction === TREND_DIRECTIONS.DOWN
          ? 'decreased'
          : 'unchanged'

    return `Trend ${directionText} by ${formattedPercentage}%${comparisonLabel ? ` ${comparisonLabel}` : ''}`
  }, [direction, formattedPercentage, comparisonLabel])

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5',
        sizeConfig.gap,
        bgClass,
        animate && 'transition-all duration-300 ease-out',
        className
      )}
      role="status"
      aria-label={ariaLabel}
    >
      <TrendIconDisplay
        direction={direction}
        className={cn(
          sizeConfig.icon,
          colorClass,
          animate && 'animate-in fade-in slide-in-from-left-1 duration-300'
        )}
      />

      <span
        className={cn(
          sizeConfig.text,
          'font-semibold tabular-nums',
          colorClass,
          animate && 'animate-in fade-in duration-300 delay-75'
        )}
      >
        {direction !== TREND_DIRECTIONS.NEUTRAL && (
          <span aria-hidden="true">
            {direction === TREND_DIRECTIONS.UP ? '+' : '-'}
          </span>
        )}
        {formattedPercentage}%
      </span>

      {comparisonLabel && (
        <span
          className={cn(
            sizeConfig.label,
            'text-slate-400 ml-0.5',
            animate && 'animate-in fade-in duration-300 delay-100'
          )}
        >
          {comparisonLabel}
        </span>
      )}
    </div>
  )
}

// =============================================================================
// Variant Components
// =============================================================================

/**
 * Compact trend indicator without label
 */
export function MetricTrendCompact({
  direction,
  percentage,
  positiveIsGood = true,
  className,
}: Pick<MetricTrendProps, 'direction' | 'percentage' | 'positiveIsGood' | 'className'>) {
  const colorClass = getTrendColor(direction, positiveIsGood)

  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      aria-label={`${direction} ${Math.abs(percentage).toFixed(1)}%`}
    >
      <TrendIconDisplay direction={direction} className={cn('w-3 h-3', colorClass)} />
      <span className={cn('text-xs font-medium tabular-nums', colorClass)}>
        {Math.abs(percentage).toFixed(1)}%
      </span>
    </span>
  )
}

/**
 * Trend arrow only (no percentage)
 */
export function MetricTrendArrow({
  direction,
  positiveIsGood = true,
  size = 'md',
  className,
}: Pick<MetricTrendProps, 'direction' | 'positiveIsGood' | 'size' | 'className'>) {
  const sizeConfig = SIZE_CONFIGS[size]
  const colorClass = getTrendColor(direction, positiveIsGood)

  return (
    <span
      className={cn('inline-flex', className)}
      aria-label={`Trend ${direction}`}
    >
      <TrendIconDisplay direction={direction} className={cn(sizeConfig.icon, colorClass)} />
    </span>
  )
}

export default MetricTrend

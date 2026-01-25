import { memo, useMemo } from 'react'
import type { ReviewStats, RatingDistribution } from '@/lib/marketplace/review-types'
import { getRatingPercentages, getRatingTier } from '@/lib/marketplace/rating-service'

// Star icon components
const StarFull = memo(function StarFull({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 text-amber-400 ${className}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
})

const StarHalf = memo(function StarHalf({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} viewBox="0 0 20 20">
      <defs>
        <linearGradient id="halfGradient">
          <stop offset="50%" stopColor="currentColor" className="text-amber-400" />
          <stop offset="50%" stopColor="currentColor" className="text-slate-600" />
        </linearGradient>
      </defs>
      <path
        fill="url(#halfGradient)"
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  )
})

const StarEmpty = memo(function StarEmpty({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 text-slate-600 ${className}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
})

interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  interactive?: boolean
  onChange?: (rating: number) => void
}

/**
 * Star rating display component
 */
export const StarRating = memo(function StarRating({
  rating,
  size = 'md',
  showValue = false,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const stars = useMemo(() => {
    const result = []
    const fullStars = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        result.push({ type: 'full', key: i })
      } else if (i === fullStars + 1 && hasHalf) {
        result.push({ type: 'half', key: i })
      } else {
        result.push({ type: 'empty', key: i })
      }
    }
    return result
  }, [rating])

  const handleClick = (starIndex: number) => {
    if (interactive && onChange) {
      onChange(starIndex)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className={`flex ${interactive ? 'cursor-pointer' : ''}`}>
        {stars.map(({ type, key }) => {
          const starProps = {
            className: `${sizeClasses[size]} ${interactive ? 'hover:scale-110 transition-transform' : ''}`,
          }

          return (
            <span
              key={key}
              onClick={() => handleClick(key)}
              role={interactive ? 'button' : undefined}
              aria-label={interactive ? `Rate ${key} stars` : undefined}
            >
              {type === 'full' && <StarFull {...starProps} />}
              {type === 'half' && <StarHalf {...starProps} />}
              {type === 'empty' && <StarEmpty {...starProps} />}
            </span>
          )
        })}
      </div>
      {showValue && (
        <span className="ml-1 text-sm font-medium text-slate-300">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
})

interface RatingDistributionBarsProps {
  distribution: RatingDistribution
  onFilterClick?: (rating: number) => void
}

/**
 * Rating distribution bars showing breakdown by star count
 */
export const RatingDistributionBars = memo(function RatingDistributionBars({
  distribution,
  onFilterClick,
}: RatingDistributionBarsProps) {
  const percentages = useMemo(() => getRatingPercentages(distribution), [distribution])
  const total = useMemo(
    () => Object.values(distribution).reduce((sum, count) => sum + count, 0),
    [distribution]
  )

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map(star => (
        <button
          key={star}
          onClick={() => onFilterClick?.(star)}
          disabled={!onFilterClick || distribution[star as keyof RatingDistribution] === 0}
          className={`
            w-full flex items-center gap-3 group
            ${onFilterClick ? 'hover:bg-slate-800/50 rounded-lg p-1 -mx-1 transition-colors' : ''}
            ${distribution[star as keyof RatingDistribution] === 0 ? 'opacity-50' : ''}
          `}
        >
          {/* Star label */}
          <span className="text-sm text-slate-400 w-6">{star}</span>

          {/* Star icon */}
          <StarFull className="w-4 h-4" />

          {/* Progress bar */}
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${percentages[star as keyof RatingDistribution]}%` }}
            />
          </div>

          {/* Count */}
          <span className="text-sm text-slate-500 w-12 text-right">
            {distribution[star as keyof RatingDistribution]}
            {total > 0 && (
              <span className="text-xs ml-1">
                ({percentages[star as keyof RatingDistribution]}%)
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
})

interface RatingDisplayProps {
  stats: ReviewStats
  size?: 'compact' | 'normal' | 'large'
  showDistribution?: boolean
  onFilterByRating?: (rating: number) => void
}

/**
 * Complete rating display component with average and optional distribution
 */
export const RatingDisplay = memo(function RatingDisplay({
  stats,
  size = 'normal',
  showDistribution = false,
  onFilterByRating,
}: RatingDisplayProps) {
  const tier = useMemo(() => getRatingTier(stats.average), [stats.average])

  if (size === 'compact') {
    return (
      <div className="flex items-center gap-1.5">
        <StarFull className="w-4 h-4" />
        <span className="text-sm font-medium text-white">
          {stats.average > 0 ? stats.average.toFixed(1) : '-'}
        </span>
        <span className="text-sm text-slate-500">
          ({stats.count})
        </span>
      </div>
    )
  }

  return (
    <div className={`${size === 'large' ? 'p-6' : 'p-4'} bg-slate-800/50 rounded-xl`}>
      {/* Main rating */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <div className={`${size === 'large' ? 'text-4xl' : 'text-3xl'} font-bold text-white`}>
            {stats.average > 0 ? stats.average.toFixed(1) : '-'}
          </div>
          <div className={`text-sm ${tier.color}`}>{tier.label}</div>
        </div>

        <div className="flex-1">
          <StarRating rating={stats.average} size={size === 'large' ? 'lg' : 'md'} />
          <div className="mt-1 text-sm text-slate-400">
            {stats.count} review{stats.count !== 1 ? 's' : ''}
            {stats.verifiedCount > 0 && (
              <span className="ml-2 text-emerald-400">
                ({stats.verifiedCount} verified)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recommendation percentage */}
      {stats.count > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <div className="flex items-center gap-1 text-emerald-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>{stats.recommendPercent}%</span>
          </div>
          <span className="text-slate-500">would recommend</span>
        </div>
      )}

      {/* Distribution bars */}
      {showDistribution && stats.count > 0 && (
        <RatingDistributionBars
          distribution={stats.distribution}
          onFilterClick={onFilterByRating}
        />
      )}
    </div>
  )
})

interface RatingBadgeProps {
  rating: number
  count?: number
  size?: 'sm' | 'md'
}

/**
 * Small inline rating badge
 */
export const RatingBadge = memo(function RatingBadge({
  rating,
  count,
  size = 'md',
}: RatingBadgeProps) {
  const tier = useMemo(() => getRatingTier(rating), [rating])

  return (
    <div className={`
      inline-flex items-center gap-1.5 px-2 py-1 rounded-lg
      bg-slate-800/50 border border-slate-700/50
      ${size === 'sm' ? 'text-xs' : 'text-sm'}
    `}>
      <StarFull className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span className={`font-medium ${tier.color}`}>
        {rating > 0 ? rating.toFixed(1) : '-'}
      </span>
      {count !== undefined && (
        <span className="text-slate-500">({count})</span>
      )}
    </div>
  )
})

export default RatingDisplay

import { useState, useCallback, useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import { StarRating, RatingDisplay } from './RatingDisplay'
import type {
  TemplateReview,
  PaginatedReviews,
  ReviewSortTypeValue,
  ReviewStats,
} from '@/lib/marketplace/review-types'
import { ReviewSortType, formatReviewDate } from '@/lib/marketplace/review-types'

interface ReviewCardProps {
  review: TemplateReview
  currentUserId?: string
  onMarkHelpful?: (reviewId: string) => void
  onEdit?: (review: TemplateReview) => void
  onDelete?: (reviewId: string) => void
  onReport?: (reviewId: string) => void
}

/**
 * Verified badge component
 */
const VerifiedBadge = memo(function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      Verified
    </span>
  )
})

/**
 * Individual review card component
 */
export const ReviewCard = memo(function ReviewCard({
  review,
  currentUserId,
  onMarkHelpful,
  onEdit,
  onDelete,
  onReport,
}: ReviewCardProps) {
  const [showFullContent, setShowFullContent] = useState(false)

  const isOwnReview = currentUserId === review.userId
  const shouldTruncate = review.content.length > 300
  const displayContent = shouldTruncate && !showFullContent
    ? review.content.slice(0, 300) + '...'
    : review.content

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5 hover:border-slate-600/50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
            {review.author?.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div>
            {/* Author name and badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white">
                {review.author?.name || 'Anonymous'}
              </span>
              {review.verified && <VerifiedBadge />}
              {isOwnReview && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">
                  Your Review
                </span>
              )}
            </div>

            {/* Date */}
            <div className="text-sm text-slate-500">
              {formatReviewDate(review.createdAt)}
              {review.updatedAt && review.updatedAt !== review.createdAt && (
                <span className="ml-2">(edited)</span>
              )}
            </div>
          </div>
        </div>

        {/* Rating */}
        <StarRating rating={review.rating} size="sm" showValue />
      </div>

      {/* Title */}
      <h4 className="font-semibold text-white mb-2">{review.title}</h4>

      {/* Content */}
      <p className="text-slate-300 text-sm leading-relaxed mb-4">
        {displayContent}
        {shouldTruncate && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="ml-1 text-cyan-400 hover:text-cyan-300 font-medium"
          >
            {showFullContent ? 'Show less' : 'Read more'}
          </button>
        )}
      </p>

      {/* Author response */}
      {review.response && (
        <div className="mb-4 p-4 rounded-lg bg-slate-900/50 border-l-2 border-cyan-500">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-cyan-400 uppercase">Template Author Response</span>
          </div>
          <p className="text-sm text-slate-300">{review.response.content}</p>
          <p className="text-xs text-slate-500 mt-2">
            {formatReviewDate(review.response.createdAt)}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-4">
          {/* Helpful button */}
          <button
            onClick={() => onMarkHelpful?.(review.id)}
            disabled={isOwnReview}
            className={`
              flex items-center gap-1.5 text-sm transition-colors
              ${review.userMarkedHelpful
                ? 'text-cyan-400'
                : isOwnReview
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-cyan-400'
              }
            `}
          >
            <svg className="w-4 h-4" fill={review.userMarkedHelpful ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>
              Helpful
              {review.helpfulCount > 0 && ` (${review.helpfulCount})`}
            </span>
          </button>

          {/* Report button - only for non-own reviews */}
          {!isOwnReview && onReport && (
            <button
              onClick={() => onReport(review.id)}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              <span>Report</span>
            </button>
          )}
        </div>

        {/* Own review actions */}
        {isOwnReview && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(review)}
                className="text-slate-400 hover:text-white"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(review.id)}
                className="text-slate-400 hover:text-red-400"
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

interface ReviewListProps {
  reviews: PaginatedReviews
  stats?: ReviewStats
  currentUserId?: string
  onLoadMore?: () => void
  onSortChange?: (sort: ReviewSortTypeValue) => void
  onFilterByRating?: (rating: number | null) => void
  onMarkHelpful?: (reviewId: string) => void
  onEditReview?: (review: TemplateReview) => void
  onDeleteReview?: (reviewId: string) => void
  onReportReview?: (reviewId: string) => void
  onWriteReview?: () => void
  isLoading?: boolean
  currentSort?: ReviewSortTypeValue
  activeRatingFilter?: number | null
  showRatingSummary?: boolean
}

/**
 * Review list component with sorting, filtering, and pagination
 */
export const ReviewList = memo(function ReviewList({
  reviews,
  stats,
  currentUserId,
  onLoadMore,
  onSortChange,
  onFilterByRating,
  onMarkHelpful,
  onEditReview,
  onDeleteReview,
  onReportReview,
  onWriteReview,
  isLoading = false,
  currentSort = ReviewSortType.Recent,
  activeRatingFilter,
  showRatingSummary = true,
}: ReviewListProps) {
  const sortOptions = useMemo(() => [
    { value: ReviewSortType.Recent, label: 'Most Recent' },
    { value: ReviewSortType.Helpful, label: 'Most Helpful' },
    { value: ReviewSortType.HighRating, label: 'Highest Rated' },
    { value: ReviewSortType.LowRating, label: 'Lowest Rated' },
  ], [])

  const handleClearFilter = useCallback(() => {
    onFilterByRating?.(null)
  }, [onFilterByRating])

  return (
    <div className="space-y-6">
      {/* Rating summary */}
      {showRatingSummary && stats && (
        <RatingDisplay
          stats={stats}
          size="large"
          showDistribution
          onFilterByRating={onFilterByRating}
        />
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Sort dropdown */}
          <select
            value={currentSort}
            onChange={(e) => onSortChange?.(e.target.value as ReviewSortTypeValue)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Active filter indicator */}
          {activeRatingFilter && (
            <button
              onClick={handleClearFilter}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
            >
              <span>{activeRatingFilter} star{activeRatingFilter !== 1 ? 's' : ''}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Write review button */}
        {onWriteReview && (
          <Button onClick={onWriteReview} size="sm">
            Write a Review
          </Button>
        )}
      </div>

      {/* Review count */}
      <div className="text-sm text-slate-400">
        Showing {reviews.reviews.length} of {reviews.total} review{reviews.total !== 1 ? 's' : ''}
      </div>

      {/* Reviews list */}
      {reviews.reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              onMarkHelpful={onMarkHelpful}
              onEdit={onEditReview}
              onDelete={onDeleteReview}
              onReport={onReportReview}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No reviews yet</h3>
          <p className="text-slate-400 mb-4">Be the first to share your experience</p>
          {onWriteReview && (
            <Button onClick={onWriteReview}>Write a Review</Button>
          )}
        </div>
      )}

      {/* Load more */}
      {reviews.hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            loading={isLoading}
          >
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  )
})

export default ReviewList

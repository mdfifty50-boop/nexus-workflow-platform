import { useState, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  MAX_REVIEW_CONTENT_LENGTH,
  MAX_REVIEW_TITLE_LENGTH,
  MIN_REVIEW_CONTENT_LENGTH,
  RATING_LABELS,
  isValidRating,
} from '@/lib/marketplace/review-types'
import type { TemplateReview, CreateReviewInput, UpdateReviewInput } from '@/lib/marketplace/review-types'

interface ReviewFormProps {
  templateId: string
  templateName?: string
  existingReview?: TemplateReview | null
  onSubmit: (input: CreateReviewInput | UpdateReviewInput) => Promise<{ success: boolean; message: string }>
  onCancel?: () => void
  isLoading?: boolean
}

/**
 * Interactive star rating selector
 */
const StarSelector = memo(function StarSelector({
  rating,
  onChange,
  disabled = false,
}: {
  rating: number
  onChange: (rating: number) => void
  disabled?: boolean
}) {
  const [hoverRating, setHoverRating] = useState(0)
  const displayRating = hoverRating || rating

  return (
    <div className="space-y-2">
      <div
        className={`flex gap-1 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onMouseLeave={() => setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => !disabled && setHoverRating(star)}
            className={`
              p-1 rounded-lg transition-all
              ${star <= displayRating ? 'scale-110' : 'opacity-60 hover:opacity-100'}
              ${!disabled && 'hover:scale-125'}
            `}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <svg
              className={`w-8 h-8 transition-colors ${
                star <= displayRating ? 'text-amber-400' : 'text-slate-600'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
      {displayRating > 0 && (
        <p className="text-sm text-amber-400 font-medium">
          {RATING_LABELS[displayRating]}
        </p>
      )}
    </div>
  )
})

/**
 * Review form component for creating and editing reviews
 */
export const ReviewForm = memo(function ReviewForm({
  templateId,
  templateName,
  existingReview,
  onSubmit,
  onCancel,
  isLoading = false,
}: ReviewFormProps) {
  const isEditing = !!existingReview

  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [title, setTitle] = useState(existingReview?.title || '')
  const [content, setContent] = useState(existingReview?.content || '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const titleCharCount = title.length
  const contentCharCount = content.length
  const isTitleValid = titleCharCount > 0 && titleCharCount <= MAX_REVIEW_TITLE_LENGTH
  const isContentValid = contentCharCount >= MIN_REVIEW_CONTENT_LENGTH && contentCharCount <= MAX_REVIEW_CONTENT_LENGTH

  const canSubmit = isValidRating(rating) && isTitleValid && isContentValid && !submitting && !isLoading

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!canSubmit) {
      setError('Please fill out all required fields correctly')
      return
    }

    setSubmitting(true)

    try {
      const input = isEditing
        ? { id: existingReview.id, rating, title, content } as UpdateReviewInput
        : { templateId, rating, title, content } as CreateReviewInput

      const result = await onSubmit(input)

      if (!result.success) {
        setError(result.message)
      }
    } catch (err) {
      setError('An error occurred while submitting your review')
    } finally {
      setSubmitting(false)
    }
  }, [canSubmit, isEditing, existingReview, rating, title, content, templateId, onSubmit])

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">
          {isEditing ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        {templateName && (
          <p className="text-sm text-slate-400">
            for {templateName}
          </p>
        )}
      </div>

      {/* Rating selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Your Rating <span className="text-red-400">*</span>
        </label>
        <StarSelector
          rating={rating}
          onChange={setRating}
          disabled={submitting || isLoading}
        />
      </div>

      {/* Title input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Review Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={MAX_REVIEW_TITLE_LENGTH}
          disabled={submitting || isLoading}
          className={`
            w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border text-white
            placeholder:text-slate-500 focus:outline-none focus:ring-2
            transition-colors
            ${titleCharCount > MAX_REVIEW_TITLE_LENGTH
              ? 'border-red-500 focus:ring-red-500/50'
              : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20'
            }
          `}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-500">
            A brief headline for your review
          </span>
          <span className={`text-xs ${titleCharCount > MAX_REVIEW_TITLE_LENGTH ? 'text-red-400' : 'text-slate-500'}`}>
            {titleCharCount}/{MAX_REVIEW_TITLE_LENGTH}
          </span>
        </div>
      </div>

      {/* Content input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Your Review <span className="text-red-400">*</span>
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience using this template. What worked well? What could be improved?"
          rows={5}
          maxLength={MAX_REVIEW_CONTENT_LENGTH}
          disabled={submitting || isLoading}
          className={`
            resize-none
            ${contentCharCount > MAX_REVIEW_CONTENT_LENGTH
              ? 'border-red-500 focus:ring-red-500/50'
              : ''
            }
          `}
        />
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${contentCharCount < MIN_REVIEW_CONTENT_LENGTH ? 'text-amber-400' : 'text-slate-500'}`}>
            {contentCharCount < MIN_REVIEW_CONTENT_LENGTH
              ? `Minimum ${MIN_REVIEW_CONTENT_LENGTH} characters required`
              : 'Share details about your experience'
            }
          </span>
          <span className={`text-xs ${
            contentCharCount > MAX_REVIEW_CONTENT_LENGTH
              ? 'text-red-400'
              : contentCharCount < MIN_REVIEW_CONTENT_LENGTH
                ? 'text-amber-400'
                : 'text-slate-500'
          }`}>
            {contentCharCount}/{MAX_REVIEW_CONTENT_LENGTH}
          </span>
        </div>
      </div>

      {/* Guidelines */}
      <div className="mb-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
        <h4 className="text-sm font-medium text-slate-300 mb-2">Review Guidelines</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">&#10003;</span>
            Be honest and specific about your experience
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">&#10003;</span>
            Mention what worked well and what could be improved
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">&#10003;</span>
            Keep it professional and constructive
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">&#10005;</span>
            Do not include personal information or promotional content
          </li>
        </ul>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting || isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={!canSubmit}
          loading={submitting || isLoading}
          className="flex-1"
        >
          {isEditing ? 'Update Review' : 'Submit Review'}
        </Button>
      </div>
    </form>
  )
})

export default ReviewForm

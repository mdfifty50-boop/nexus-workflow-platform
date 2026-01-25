/**
 * SubmissionProgress Component
 * Displays submission status timeline, reviewer feedback, and action buttons
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type {
  TemplateSubmission,
  SubmissionStatusType,
  ReviewComment,
} from '@/lib/marketplace/submission-types'
import {
  getSubmission,
  submitForReview,
  deleteSubmission,
} from '@/lib/marketplace/submission-service'
import {
  publishTemplate,
  unpublishTemplate,
} from '@/lib/marketplace/publishing-service'

// Status configuration with colors and icons
const STATUS_CONFIG: Record<
  SubmissionStatusType,
  { label: string; color: string; bgColor: string; icon: string; description: string }
> = {
  draft: {
    label: 'Draft',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    icon: '📝',
    description: 'Your submission is saved as a draft',
  },
  pending: {
    label: 'Pending Review',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    icon: '⏳',
    description: 'Waiting in the review queue',
  },
  in_review: {
    label: 'In Review',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    icon: '🔍',
    description: 'Currently being reviewed by our team',
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    icon: '✅',
    description: 'Ready to publish to the marketplace',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    icon: '❌',
    description: 'Please review feedback and resubmit',
  },
  published: {
    label: 'Published',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    icon: '🚀',
    description: 'Live on the marketplace',
  },
}

// Timeline steps for progress visualization
const TIMELINE_STEPS: { status: SubmissionStatusType; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'pending', label: 'Submitted' },
  { status: 'in_review', label: 'Review' },
  { status: 'approved', label: 'Approved' },
  { status: 'published', label: 'Published' },
]

interface SubmissionProgressProps {
  submissionId: string
  onEdit?: () => void
  onViewTemplate?: () => void
  onRefresh?: () => void
}

export function SubmissionProgress({
  submissionId,
  onEdit,
  onViewTemplate,
  onRefresh,
}: SubmissionProgressProps) {
  const [submission, setSubmission] = useState<TemplateSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load submission data
  const loadSubmission = useCallback(() => {
    setLoading(true)
    setError(null)

    const data = getSubmission(submissionId)
    if (data) {
      setSubmission(data)
    } else {
      setError('Submission not found')
    }
    setLoading(false)
  }, [submissionId])

  useEffect(() => {
    loadSubmission()
  }, [loadSubmission])

  // Get current step index
  const getCurrentStepIndex = useCallback(() => {
    if (!submission) return -1

    // Special case for rejected - show at review step
    if (submission.status === 'rejected') return 2

    return TIMELINE_STEPS.findIndex((step) => step.status === submission.status)
  }, [submission])

  // Check if a step is completed
  const isStepCompleted = useCallback(
    (stepIndex: number) => {
      const currentIndex = getCurrentStepIndex()
      if (currentIndex === -1) return false

      // For rejected submissions, only show first 3 steps as completed
      if (submission?.status === 'rejected') {
        return stepIndex < 2
      }

      return stepIndex < currentIndex
    },
    [getCurrentStepIndex, submission]
  )

  // Check if a step is active
  const isStepActive = useCallback(
    (stepIndex: number) => {
      return stepIndex === getCurrentStepIndex()
    },
    [getCurrentStepIndex]
  )

  // Handle submit for review
  const handleSubmitForReview = useCallback(async () => {
    setActionLoading('submit')
    setError(null)

    const result = submitForReview(submissionId)
    if (result.success) {
      loadSubmission()
      onRefresh?.()
    } else {
      setError(result.error || 'Failed to submit for review')
    }

    setActionLoading(null)
  }, [submissionId, loadSubmission, onRefresh])

  // Handle publish
  const handlePublish = useCallback(async () => {
    setActionLoading('publish')
    setError(null)

    const result = publishTemplate(submissionId)
    if (result.success) {
      loadSubmission()
      onRefresh?.()
    } else {
      setError(result.error || 'Failed to publish template')
    }

    setActionLoading(null)
  }, [submissionId, loadSubmission, onRefresh])

  // Handle unpublish
  const handleUnpublish = useCallback(async () => {
    setActionLoading('unpublish')
    setError(null)

    const result = unpublishTemplate(submissionId)
    if (result.success) {
      loadSubmission()
      onRefresh?.()
    } else {
      setError(result.error || 'Failed to unpublish template')
    }

    setActionLoading(null)
  }, [submissionId, loadSubmission, onRefresh])

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this submission?')) {
      return
    }

    setActionLoading('delete')
    setError(null)

    const result = deleteSubmission(submissionId)
    if (result.success) {
      onRefresh?.()
    } else {
      setError(result.error || 'Failed to delete submission')
    }

    setActionLoading(null)
  }, [submissionId, onRefresh])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Render loading state
  if (loading) {
    return (
      <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/3"></div>
          <div className="h-4 bg-slate-700 rounded w-2/3"></div>
          <div className="h-20 bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  // Render error state
  if (error && !submission) {
    return (
      <div className="p-6 bg-red-500/10 rounded-2xl border border-red-500/30">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (!submission) {
    return null
  }

  const statusConfig = STATUS_CONFIG[submission.status]

  return (
    <div className="space-y-6">
      {/* Header with Status Badge */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-3xl">
              {submission.templateData.icon || '📦'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {submission.templateData.name || 'Untitled Template'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Created {formatDate(submission.createdAt)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl',
              statusConfig.bgColor
            )}
          >
            <span className="text-xl">{statusConfig.icon}</span>
            <div>
              <span className={cn('font-semibold', statusConfig.color)}>
                {statusConfig.label}
              </span>
              <p className="text-xs text-slate-400">{statusConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Timeline */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {TIMELINE_STEPS.map((step, index) => (
              <div key={step.status} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                      isStepCompleted(index) &&
                        'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500',
                      isStepActive(index) &&
                        'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500 animate-pulse',
                      !isStepCompleted(index) &&
                        !isStepActive(index) &&
                        'bg-slate-800 text-slate-500 border-2 border-slate-700',
                      submission.status === 'rejected' &&
                        index === 2 &&
                        'bg-red-500/20 text-red-400 border-2 border-red-500'
                    )}
                  >
                    {isStepCompleted(index) ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : submission.status === 'rejected' && index === 2 ? (
                      '!'
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium',
                      isStepCompleted(index) && 'text-emerald-400',
                      isStepActive(index) && 'text-cyan-400',
                      !isStepCompleted(index) && !isStepActive(index) && 'text-slate-500'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < TIMELINE_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-16 sm:w-24 h-0.5 mx-2',
                      isStepCompleted(index + 1)
                        ? 'bg-emerald-500'
                        : isStepCompleted(index)
                        ? 'bg-gradient-to-r from-emerald-500 to-slate-700'
                        : 'bg-slate-700'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Draft Actions */}
          {submission.status === 'draft' && (
            <>
              <Button onClick={onEdit} variant="outline">
                Edit Draft
              </Button>
              <Button
                onClick={handleSubmitForReview}
                loading={actionLoading === 'submit'}
              >
                Submit for Review
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                loading={actionLoading === 'delete'}
              >
                Delete
              </Button>
            </>
          )}

          {/* Pending Actions */}
          {submission.status === 'pending' && (
            <Button variant="outline" disabled>
              Awaiting Review...
            </Button>
          )}

          {/* In Review Actions */}
          {submission.status === 'in_review' && (
            <Button variant="outline" disabled>
              Under Review...
            </Button>
          )}

          {/* Approved Actions */}
          {submission.status === 'approved' && (
            <>
              <Button
                onClick={handlePublish}
                loading={actionLoading === 'publish'}
                className="bg-gradient-to-r from-emerald-500 to-green-500"
              >
                Publish to Marketplace
              </Button>
              <Button onClick={onEdit} variant="outline">
                Edit Before Publishing
              </Button>
            </>
          )}

          {/* Rejected Actions */}
          {submission.status === 'rejected' && (
            <>
              <Button onClick={onEdit}>
                Edit & Resubmit
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                loading={actionLoading === 'delete'}
              >
                Delete
              </Button>
            </>
          )}

          {/* Published Actions */}
          {submission.status === 'published' && (
            <>
              <Button onClick={onViewTemplate} variant="outline">
                View in Marketplace
              </Button>
              <Button onClick={onEdit} variant="outline">
                Edit & Update
              </Button>
              <Button
                onClick={handleUnpublish}
                variant="destructive"
                loading={actionLoading === 'unpublish'}
              >
                Unpublish
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 mb-3">Timeline</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Created:</span>
            <span className="text-slate-300">{formatDate(submission.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Last Updated:</span>
            <span className="text-slate-300">{formatDate(submission.updatedAt)}</span>
          </div>
          {submission.submittedAt && (
            <div className="flex justify-between">
              <span className="text-slate-500">Submitted:</span>
              <span className="text-slate-300">{formatDate(submission.submittedAt)}</span>
            </div>
          )}
          {submission.reviewedAt && (
            <div className="flex justify-between">
              <span className="text-slate-500">Reviewed:</span>
              <span className="text-slate-300">{formatDate(submission.reviewedAt)}</span>
            </div>
          )}
          {submission.publishedAt && (
            <div className="flex justify-between">
              <span className="text-slate-500">Published:</span>
              <span className="text-slate-300">{formatDate(submission.publishedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Analytics (Published Only) */}
      {submission.status === 'published' && submission.analytics && (
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Analytics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-cyan-400">
                {submission.analytics.views.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">Views</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-emerald-400">
                {submission.analytics.downloads.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">Downloads</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-pink-400">
                {submission.analytics.favorites.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">Favorites</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-amber-400">
                {submission.analytics.rating > 0 ? submission.analytics.rating.toFixed(1) : '-'}
              </div>
              <div className="text-xs text-slate-500">
                Rating ({submission.analytics.ratingCount})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Comments */}
      {submission.reviewComments.length > 0 && (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-medium text-white">Review Feedback</h3>
          </div>
          <div className="divide-y divide-slate-700">
            {submission.reviewComments.map((comment) => (
              <ReviewCommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      )}

      {/* Validation Warnings (if any) */}
      {submission.validationResult?.warnings?.length ? (
        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
          <h3 className="font-medium text-amber-400 mb-2">Suggestions</h3>
          <ul className="space-y-2">
            {submission.validationResult.warnings.map((warning, index) => (
              <li key={index} className="text-sm text-slate-300">
                <span className="text-amber-400 mr-2">-</span>
                {warning.message}
                {warning.suggestion && (
                  <span className="text-slate-500 ml-1">({warning.suggestion})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

// Review Comment Item Component
function ReviewCommentItem({ comment }: { comment: ReviewComment }) {
  const typeConfig: Record<ReviewComment['type'], { color: string; icon: string }> = {
    feedback: { color: 'text-blue-400', icon: '💬' },
    request_change: { color: 'text-amber-400', icon: '⚠️' },
    approval: { color: 'text-emerald-400', icon: '✅' },
    rejection: { color: 'text-red-400', icon: '❌' },
  }

  const config = typeConfig[comment.type]

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl">{config.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('font-medium', config.color)}>
              {comment.reviewerName}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(comment.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {comment.resolvedAt && (
              <span className="text-xs text-emerald-400">Resolved</span>
            )}
          </div>
          <p className="text-sm text-slate-300">{comment.comment}</p>
        </div>
      </div>
    </div>
  )
}

// Submissions List Component (for displaying all user submissions)
interface SubmissionsListProps {
  onSelectSubmission: (submissionId: string) => void
  onCreateNew: () => void
}

export function SubmissionsList({
  onSelectSubmission,
  onCreateNew,
}: SubmissionsListProps) {
  const [submissions, setSubmissions] = useState<TemplateSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Import dynamically to avoid circular dependency
    import('@/lib/marketplace/submission-service').then(({ getMySubmissions }) => {
      const result = getMySubmissions({ limit: 50 })
      setSubmissions(result.submissions)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="h-6 bg-slate-700 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
          <span className="text-3xl">📦</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Submissions Yet</h3>
        <p className="text-slate-400 mb-6">Share your workflow templates with the community</p>
        <Button onClick={onCreateNew}>
          Submit Your First Template
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">My Submissions</h2>
        <Button onClick={onCreateNew} size="sm">
          + New Submission
        </Button>
      </div>

      <div className="space-y-3">
        {submissions.map((submission) => {
          const statusConfig = STATUS_CONFIG[submission.status]
          return (
            <button
              key={submission.id}
              onClick={() => onSelectSubmission(submission.id)}
              className="w-full text-left p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-xl">
                    {submission.templateData.icon || '📦'}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">
                      {submission.templateData.name || 'Untitled'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Updated {new Date(submission.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={cn('flex items-center gap-2 px-3 py-1 rounded-lg', statusConfig.bgColor)}>
                  <span>{statusConfig.icon}</span>
                  <span className={cn('text-sm font-medium', statusConfig.color)}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

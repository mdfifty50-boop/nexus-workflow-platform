/**
 * ErrorReportButton Component
 *
 * A floating button that allows users to report issues with automatic
 * context collection. Provides a simple interface for:
 * - Quick issue reporting
 * - Automatic error context capture
 * - Screenshot attachment support
 * - User feedback collection
 */

import { useState, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  getStoredErrors,
  copyErrorReport,
  trackError,
  type TrackedError,
} from '@/lib/errorTracking'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

export interface ErrorReportButtonProps {
  /** Button variant */
  variant?: 'floating' | 'inline' | 'icon-only'
  /** Position for floating variant */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Custom class name */
  className?: string
  /** Additional context to include */
  context?: Record<string, unknown>
  /** Callback when report is submitted */
  onReportSubmit?: (feedback: UserFeedback) => void
  /** Error ID to report (if reporting specific error) */
  errorId?: string
  /** Show recent errors in modal */
  showRecentErrors?: boolean
}

export interface UserFeedback {
  description: string
  email?: string
  category: 'bug' | 'performance' | 'ui' | 'feature' | 'other'
  errorId?: string
  includeErrorLog: boolean
  timestamp: string
  route: string
  userAgent: string
}

// =============================================================================
// MODAL COMPONENT
// =============================================================================

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (feedback: UserFeedback) => void
  recentErrors: TrackedError[]
  errorId?: string
  showRecentErrors: boolean
}

function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  recentErrors,
  errorId,
  showRecentErrors,
}: ReportModalProps) {
  const location = useLocation()
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState<UserFeedback['category']>('bug')
  const [includeErrorLog, setIncludeErrorLog] = useState(true)
  const [selectedErrorId, setSelectedErrorId] = useState(errorId || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const feedback: UserFeedback = {
      description,
      email: email || undefined,
      category,
      errorId: selectedErrorId || undefined,
      includeErrorLog,
      timestamp: new Date().toISOString(),
      route: location.pathname,
      userAgent: navigator.userAgent,
    }

    // Track the feedback as an error event for collection
    trackError('User Feedback Report', 'low', {
      action: 'user_report',
      route: location.pathname,
      extra: {
        category,
        hasEmail: !!email,
        errorLogIncluded: includeErrorLog,
        relatedErrorId: selectedErrorId,
      },
    })

    onSubmit(feedback)
    setIsSubmitting(false)
    setSubmitted(true)

    // Reset after delay
    setTimeout(() => {
      onClose()
      setSubmitted(false)
      setDescription('')
      setEmail('')
      setCategory('bug')
      setSelectedErrorId('')
    }, 2000)
  }

  const handleCopyReport = async () => {
    const success = await copyErrorReport()
    if (success) {
      alert('Error report copied to clipboard!')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Thanks for your feedback!</h3>
            <p className="text-slate-400">Your report helps us improve Nexus.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Report an Issue</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Issue Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'bug', label: 'Bug', icon: '!' },
                    { value: 'performance', label: 'Slow', icon: '~' },
                    { value: 'ui', label: 'UI', icon: '#' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setCategory(item.value as UserFeedback['category'])}
                      className={cn(
                        'p-2 rounded-lg border text-sm transition-colors',
                        category === item.value
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      )}
                    >
                      <span className="mr-1">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  What happened? <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue you encountered..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  rows={3}
                  required
                />
              </div>

              {/* Email (optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  We may reach out for more details
                </p>
              </div>

              {/* Recent Errors */}
              {showRecentErrors && recentErrors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Related Error
                  </label>
                  <select
                    value={selectedErrorId}
                    onChange={(e) => setSelectedErrorId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="">Select an error (optional)</option>
                    {recentErrors.slice(0, 5).map((err) => (
                      <option key={err.id} value={err.id}>
                        {err.error.name}: {err.error.message.substring(0, 40)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Include Error Log */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="includeErrorLog"
                  checked={includeErrorLog}
                  onChange={(e) => setIncludeErrorLog(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="includeErrorLog" className="text-sm text-slate-300">
                  Include diagnostic information
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={!description.trim() || isSubmitting}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyReport}
                  className="border-slate-700"
                >
                  Copy Report
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ErrorReportButton({
  variant = 'floating',
  position = 'bottom-right',
  className,
  onReportSubmit,
  errorId,
  showRecentErrors = true,
}: ErrorReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const recentErrors = useRef<TrackedError[]>([])

  const handleOpenModal = useCallback(() => {
    recentErrors.current = getStoredErrors().slice(-10).reverse()
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const handleSubmit = useCallback((feedback: UserFeedback) => {
    onReportSubmit?.(feedback)
  }, [onReportSubmit])

  // Position classes for floating variant
  const positionClasses: Record<string, string> = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4',
  }

  // Render based on variant
  if (variant === 'icon-only') {
    return (
      <>
        <button
          onClick={handleOpenModal}
          className={cn(
            'p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors',
            className
          )}
          title="Report an issue"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </button>
        <ReportModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          recentErrors={recentErrors.current}
          errorId={errorId}
          showRecentErrors={showRecentErrors}
        />
      </>
    )
  }

  if (variant === 'inline') {
    return (
      <>
        <Button
          onClick={handleOpenModal}
          variant="outline"
          className={cn('border-slate-700', className)}
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Report Issue
        </Button>
        <ReportModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          recentErrors={recentErrors.current}
          errorId={errorId}
          showRecentErrors={showRecentErrors}
        />
      </>
    )
  }

  // Floating variant (default)
  return (
    <>
      <button
        onClick={handleOpenModal}
        className={cn(
          positionClasses[position],
          'z-40 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full shadow-lg transition-all hover:scale-105 group',
          className
        )}
        title="Report an issue"
      >
        <svg
          className="w-5 h-5 text-yellow-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
          Report Issue
        </span>
      </button>
      <ReportModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        recentErrors={recentErrors.current}
        errorId={errorId}
        showRecentErrors={showRecentErrors}
      />
    </>
  )
}

/**
 * Compact error report trigger for error boundaries
 */
export function ErrorReportLink({
  errorId,
  className,
}: {
  errorId?: string
  className?: string
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const recentErrors = useRef<TrackedError[]>([])

  const handleOpen = () => {
    recentErrors.current = getStoredErrors().slice(-10).reverse()
    setModalOpen(true)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className={cn(
          'text-sm text-slate-400 hover:text-cyan-400 underline transition-colors',
          className
        )}
      >
        Report this issue
      </button>
      <ReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={() => {}}
        recentErrors={recentErrors.current}
        errorId={errorId}
        showRecentErrors={false}
      />
    </>
  )
}

export default ErrorReportButton

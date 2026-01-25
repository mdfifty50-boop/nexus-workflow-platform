/**
 * Report Error Modal
 *
 * Allows users to report issues with error details and user description.
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateErrorReport, getErrorLog, type ErrorLogEntry } from '@/lib/error-logger'

interface ReportErrorModalProps {
  isOpen: boolean
  onClose: () => void
  error?: Error | string | null
  context?: string
  onSubmit?: (report: ErrorReport) => Promise<void>
}

export interface ErrorReport {
  userDescription: string
  userEmail: string
  errorDetails: string
  recentErrors: ErrorLogEntry[]
  browserInfo: {
    userAgent: string
    url: string
    timestamp: string
    screenSize: string
    language: string
  }
  stepsToReproduce: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  attachedLogs: boolean
}

const ISSUE_CATEGORIES = [
  { value: 'crash', label: 'App crashed or froze' },
  { value: 'error', label: 'Error message appeared' },
  { value: 'broken', label: "Feature isn't working" },
  { value: 'slow', label: 'Performance issues' },
  { value: 'ui', label: 'Display/UI issues' },
  { value: 'data', label: 'Data loss or corruption' },
  { value: 'other', label: 'Other' },
]

const SEVERITY_OPTIONS = [
  {
    value: 'low' as const,
    label: 'Low',
    description: 'Minor inconvenience, workaround available',
  },
  { value: 'medium' as const, label: 'Medium', description: 'Affects my work but I can continue' },
  { value: 'high' as const, label: 'High', description: 'Blocking my work' },
  {
    value: 'critical' as const,
    label: 'Critical',
    description: 'Data loss or security concern',
  },
]

export function ReportErrorModal({
  isOpen,
  onClose,
  error,
  context,
  onSubmit,
}: ReportErrorModalProps) {
  const [userDescription, setUserDescription] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [stepsToReproduce, setStepsToReproduce] = useState('')
  const [category, setCategory] = useState('error')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [attachLogs, setAttachLogs] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const errorString = error instanceof Error ? error.message : error || 'Unknown error'
  const errorStack = error instanceof Error ? error.stack : undefined

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)
      setSubmitError(null)

      try {
        const report: ErrorReport = {
          userDescription,
          userEmail,
          errorDetails: errorStack || errorString,
          recentErrors: attachLogs ? getErrorLog().slice(-5) : [],
          browserInfo: {
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
          },
          stepsToReproduce,
          severity,
          category,
          attachedLogs: attachLogs,
        }

        if (onSubmit) {
          await onSubmit(report)
        } else {
          // Default: log to console and store locally
          console.log('Error Report Submitted:', report)
          const stored = JSON.parse(localStorage.getItem('nexus_error_reports') || '[]')
          stored.push({ ...report, id: Date.now(), status: 'pending' })
          localStorage.setItem('nexus_error_reports', JSON.stringify(stored.slice(-10)))
        }

        setIsSubmitted(true)
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Failed to submit report. Please try again.'
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      userDescription,
      userEmail,
      stepsToReproduce,
      severity,
      category,
      attachLogs,
      errorString,
      errorStack,
      onSubmit,
    ]
  )

  const handleCopyReport = useCallback(async () => {
    const report = generateErrorReport()
    try {
      await navigator.clipboard.writeText(report)
      alert('Error report copied to clipboard!')
    } catch {
      // Fallback: show in alert
      alert('Copy manually:\n\n' + report.slice(0, 500) + '...')
    }
  }, [])

  const handleClose = useCallback(() => {
    setUserDescription('')
    setUserEmail('')
    setStepsToReproduce('')
    setCategory('error')
    setSeverity('medium')
    setAttachLogs(true)
    setIsSubmitted(false)
    setSubmitError(null)
    onClose()
  }, [onClose])

  if (!isOpen) return null

  // Success state
  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Report Submitted</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for helping us improve! Our team will review your report and may contact you
              if we need more information.
            </p>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Report an Issue</h2>
              <p className="text-sm text-muted-foreground">Help us fix this problem</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="min-w-[44px] min-h-[44px] p-2 hover:bg-muted rounded-lg transition-colors flex items-center justify-center touch-manipulation active:scale-95"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Error Details (Read-only) */}
            {(error || context) && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    {context && (
                      <p className="text-sm text-muted-foreground mb-1">While: {context}</p>
                    )}
                    <p className="text-sm text-red-400 font-mono break-all">{errorString}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Issue Category */}
            <div className="space-y-2">
              <Label htmlFor="category">What type of issue is this?</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label>How severe is this issue?</Label>
              <div className="grid grid-cols-2 gap-2">
                {SEVERITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSeverity(option.value)}
                    className={`p-3 text-left rounded-lg border transition-all ${
                      severity === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        severity === option.value ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {option.label}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">What happened? *</Label>
              <Textarea
                id="description"
                value={userDescription}
                onChange={(e) => setUserDescription(e.target.value)}
                placeholder="Please describe what you were trying to do and what went wrong..."
                rows={3}
                required
                className="resize-none"
              />
            </div>

            {/* Steps to Reproduce */}
            <div className="space-y-2">
              <Label htmlFor="steps">Steps to reproduce (optional)</Label>
              <Textarea
                id="steps"
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional, for follow-up)</Label>
              <Input
                id="email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {/* Attach Logs Checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="attachLogs"
                checked={attachLogs}
                onChange={(e) => setAttachLogs(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <Label htmlFor="attachLogs" className="cursor-pointer">
                  Include diagnostic information
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Attach browser info, recent errors, and session data to help us debug
                </p>
              </div>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {submitError}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={handleCopyReport} className="text-sm">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy Debug Info
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !userDescription.trim()}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="w-4 h-4 mr-2 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to manage report error modal state
 */
export function useReportErrorModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentError, setCurrentError] = useState<Error | string | null>(null)
  const [currentContext, setCurrentContext] = useState<string | undefined>()

  const openModal = useCallback((error?: Error | string, context?: string) => {
    setCurrentError(error || null)
    setCurrentContext(context)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setCurrentError(null)
    setCurrentContext(undefined)
  }, [])

  return {
    isOpen,
    currentError,
    currentContext,
    openModal,
    closeModal,
  }
}

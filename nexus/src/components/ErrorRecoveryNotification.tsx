/**
 * Error Recovery Notification Component
 *
 * User-friendly error notifications with:
 * - Bilingual support (English/Arabic)
 * - Action buttons for manual recovery
 * - Automatic retry progress
 * - Error severity indicators
 */

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WorkflowError, RecoveryAction } from '@/lib/workflow-engine/error-recovery'

// ============================================================================
// Types
// ============================================================================

export interface ErrorRecoveryNotificationProps {
  /** The workflow error to display */
  error: WorkflowError | null
  /** Language preference */
  language?: 'en' | 'ar'
  /** Current retry attempt (for progress display) */
  retryAttempt?: number
  /** Maximum retries */
  maxRetries?: number
  /** Whether a retry is in progress */
  isRetrying?: boolean
  /** Time until next retry (ms) */
  retryInMs?: number
  /** Callback when user clicks retry */
  onRetry?: () => void | Promise<void>
  /** Callback when user dismisses the notification */
  onDismiss?: () => void
  /** Callback when user requests to skip this step */
  onSkip?: () => void
  /** Callback when user wants to report the issue */
  onReport?: () => void
  /** Callback when user clicks reconnect (for auth errors) */
  onReconnect?: (service?: string) => void
  /** Display variant */
  variant?: 'toast' | 'banner' | 'modal' | 'inline'
  /** Whether the notification can be dismissed */
  dismissible?: boolean
  /** Auto-dismiss after ms (0 = no auto-dismiss) */
  autoDismissMs?: number
  /** Show detailed error info */
  showDetails?: boolean
  /** Additional CSS classes */
  className?: string
}

// ============================================================================
// Error Severity Colors and Icons
// ============================================================================

const SEVERITY_STYLES = {
  transient: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: 'text-yellow-500',
    iconBg: 'bg-yellow-500/20',
  },
  permanent: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: 'text-red-500',
    iconBg: 'bg-red-500/20',
  },
  rate_limit: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: 'text-orange-500',
    iconBg: 'bg-orange-500/20',
  },
  auth: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    icon: 'text-purple-500',
    iconBg: 'bg-purple-500/20',
  },
  service: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-500',
    iconBg: 'bg-blue-500/20',
  },
  validation: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    icon: 'text-gray-500',
    iconBg: 'bg-gray-500/20',
  },
  partial: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    icon: 'text-cyan-500',
    iconBg: 'bg-cyan-500/20',
  },
}

// ============================================================================
// Icons
// ============================================================================

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function RetryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function SkipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  )
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

// ============================================================================
// Countdown Timer Hook
// ============================================================================

function useCountdown(targetMs: number, onComplete?: () => void) {
  const [remaining, setRemaining] = useState(targetMs)

  useEffect(() => {
    if (targetMs <= 0) return

    setRemaining(targetMs)
    const startTime = Date.now()
    const endTime = startTime + targetMs

    const interval = setInterval(() => {
      const now = Date.now()
      const left = Math.max(0, endTime - now)
      setRemaining(left)

      if (left === 0) {
        clearInterval(interval)
        onComplete?.()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [targetMs, onComplete])

  return remaining
}

// ============================================================================
// Main Component
// ============================================================================

export function ErrorRecoveryNotification({
  error,
  language = 'en',
  retryAttempt = 0,
  maxRetries = 3,
  isRetrying = false,
  retryInMs = 0,
  onRetry,
  onDismiss,
  onSkip,
  onReport,
  onReconnect,
  variant = 'inline',
  dismissible = true,
  autoDismissMs = 0,
  showDetails = false,
  className,
}: ErrorRecoveryNotificationProps) {
  const [isHandlingRetry, setIsHandlingRetry] = useState(false)
  const [showFullDetails, setShowFullDetails] = useState(showDetails)

  const isRTL = language === 'ar'
  const styles = error ? SEVERITY_STYLES[error.classification] : SEVERITY_STYLES.transient

  // Countdown for auto-retry
  const countdown = useCountdown(retryInMs)

  // Auto-dismiss
  useEffect(() => {
    if (autoDismissMs > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, autoDismissMs)
      return () => clearTimeout(timer)
    }
  }, [autoDismissMs, onDismiss])

  const handleRetry = useCallback(async () => {
    if (!onRetry || isHandlingRetry) return
    setIsHandlingRetry(true)
    try {
      await onRetry()
    } finally {
      setIsHandlingRetry(false)
    }
  }, [onRetry, isHandlingRetry])

  const handleReconnect = useCallback(() => {
    onReconnect?.(error?.service)
  }, [onReconnect, error?.service])

  if (!error) return null

  // Get localized strings
  const message = language === 'ar' && error.messageAr ? error.messageAr : error.message
  const suggestion = language === 'ar' && error.suggestedActionAr
    ? error.suggestedActionAr
    : error.suggestedAction

  // Retry progress text
  const retryProgressText = retryAttempt > 0
    ? language === 'ar'
      ? `المحاولة ${retryAttempt} من ${maxRetries}`
      : `Attempt ${retryAttempt} of ${maxRetries}`
    : null

  // Countdown text
  const countdownText = countdown > 0
    ? language === 'ar'
      ? `إعادة المحاولة خلال ${Math.ceil(countdown / 1000)} ثانية...`
      : `Retrying in ${Math.ceil(countdown / 1000)}s...`
    : null

  // Variant-specific wrapper classes
  const variantClasses = {
    toast: 'fixed top-4 right-4 max-w-md shadow-lg rounded-xl z-50',
    banner: 'w-full rounded-lg',
    modal: 'fixed inset-0 flex items-center justify-center bg-black/50 z-50',
    inline: 'rounded-lg',
  }

  const content = (
    <div
      className={cn(
        'border p-4',
        styles.bg,
        styles.border,
        variant === 'modal' ? 'max-w-md w-full rounded-xl bg-card' : '',
        isRTL && 'text-right',
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={cn('flex gap-3', isRTL && 'flex-row-reverse')}>
        {/* Error Icon */}
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', styles.iconBg)}>
          <ErrorIcon className={cn('w-5 h-5', styles.icon)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with code and dismiss */}
          <div className={cn('flex items-start justify-between gap-2', isRTL && 'flex-row-reverse')}>
            <div>
              <span className={cn('text-xs font-mono px-2 py-0.5 rounded', styles.bg, styles.icon)}>
                {error.code}
              </span>
              {error.service && (
                <span className="text-xs text-muted-foreground ml-2">
                  {error.service}
                </span>
              )}
            </div>
            {dismissible && onDismiss && (
              <button
                onClick={onDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={language === 'ar' ? 'إغلاق' : 'Dismiss'}
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Message */}
          <p className="mt-2 text-sm font-medium">{message}</p>

          {/* Suggestion */}
          <p className="mt-1 text-sm text-muted-foreground">{suggestion}</p>

          {/* Retry Progress */}
          {(retryProgressText || countdownText) && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              {isRetrying && (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              <span>{countdownText || retryProgressText}</span>
            </div>
          )}

          {/* Retry Progress Bar */}
          {retryInMs > 0 && countdown > 0 && (
            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full transition-all duration-100', styles.iconBg.replace('/20', ''))}
                style={{ width: `${((retryInMs - countdown) / retryInMs) * 100}%` }}
              />
            </div>
          )}

          {/* Details Toggle */}
          {error.context && Object.keys(error.context).length > 0 && (
            <button
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="mt-2 text-xs text-primary hover:underline"
            >
              {showFullDetails
                ? (language === 'ar' ? 'إخفاء التفاصيل' : 'Hide details')
                : (language === 'ar' ? 'عرض التفاصيل' : 'Show details')}
            </button>
          )}

          {/* Expanded Details */}
          {showFullDetails && error.context && (
            <pre className="mt-2 p-2 bg-muted/50 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(error.context, null, 2)}
            </pre>
          )}

          {/* Action Buttons */}
          <div className={cn('mt-3 flex flex-wrap gap-2', isRTL && 'flex-row-reverse')}>
            {/* Retry Button */}
            {error.isRetryable && onRetry && (
              <Button
                size="sm"
                onClick={handleRetry}
                disabled={isRetrying || isHandlingRetry}
                className="gap-1.5"
              >
                {isRetrying || isHandlingRetry ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {language === 'ar' ? 'جاري المحاولة...' : 'Retrying...'}
                  </>
                ) : (
                  <>
                    <RetryIcon className="w-3.5 h-3.5" />
                    {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                    {retryAttempt > 0 && ` (${retryAttempt})`}
                  </>
                )}
              </Button>
            )}

            {/* Reconnect Button (for auth errors) */}
            {error.classification === 'auth' && onReconnect && (
              <Button size="sm" variant="outline" onClick={handleReconnect} className="gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                {language === 'ar' ? 'إعادة الاتصال' : 'Reconnect'}
              </Button>
            )}

            {/* Skip Button */}
            {onSkip && error.classification !== 'permanent' && (
              <Button size="sm" variant="ghost" onClick={onSkip} className="gap-1.5">
                <SkipIcon className="w-3.5 h-3.5" />
                {language === 'ar' ? 'تخطي' : 'Skip'}
              </Button>
            )}

            {/* Report Button */}
            {onReport && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onReport}
                className="gap-1.5 text-muted-foreground"
              >
                <FlagIcon className="w-3.5 h-3.5" />
                {language === 'ar' ? 'الإبلاغ' : 'Report'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // Wrap in variant container
  if (variant === 'modal') {
    return (
      <div className={variantClasses.modal} onClick={onDismiss}>
        <div onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(variantClasses[variant], className)}>
      {content}
    </div>
  )
}

// ============================================================================
// Hook for Managing Error Recovery State
// ============================================================================

export interface UseErrorRecoveryNotificationOptions {
  maxRetries?: number
  onRecoverySuccess?: () => void
  onRecoveryFailure?: (error: WorkflowError) => void
  autoRetry?: boolean
}

export function useErrorRecoveryNotification(options: UseErrorRecoveryNotificationOptions = {}) {
  const { maxRetries = 3, onRecoverySuccess, onRecoveryFailure, autoRetry = true } = options

  const [error, setError] = useState<WorkflowError | null>(null)
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryInMs, setRetryInMs] = useState(0)

  const showError = useCallback((workflowError: WorkflowError, recoveryAction?: RecoveryAction) => {
    setError(workflowError)
    setRetryAttempt(0)
    setIsRetrying(false)

    // Set up auto-retry if applicable
    if (autoRetry && workflowError.isRetryable && recoveryAction?.delayMs) {
      setRetryInMs(recoveryAction.delayMs)
    }
  }, [autoRetry])

  const clearError = useCallback(() => {
    setError(null)
    setRetryAttempt(0)
    setIsRetrying(false)
    setRetryInMs(0)
  }, [])

  const startRetry = useCallback(() => {
    if (!error?.isRetryable || retryAttempt >= maxRetries) return

    setIsRetrying(true)
    setRetryAttempt((prev) => prev + 1)
  }, [error, retryAttempt, maxRetries])

  const finishRetry = useCallback((success: boolean, newError?: WorkflowError) => {
    setIsRetrying(false)

    if (success) {
      clearError()
      onRecoverySuccess?.()
    } else if (newError) {
      setError(newError)
      if (retryAttempt >= maxRetries) {
        onRecoveryFailure?.(newError)
      }
    }
  }, [clearError, retryAttempt, maxRetries, onRecoverySuccess, onRecoveryFailure])

  return {
    error,
    retryAttempt,
    maxRetries,
    isRetrying,
    retryInMs,
    showError,
    clearError,
    startRetry,
    finishRetry,
    setRetryInMs,
  }
}

export default ErrorRecoveryNotification

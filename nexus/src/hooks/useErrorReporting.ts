/**
 * useErrorReporting Hook
 *
 * React hook for manual error reporting, performance tracking,
 * and user feedback collection.
 *
 * Features:
 * - Manual error reporting with context
 * - Performance timing utilities
 * - User feedback submission
 * - Error context auto-collection
 */

import { useCallback, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  trackError,
  trackWarning,
  trackCritical,
  getErrorById,
  copyErrorReport,
  getErrorReportString,
  type ErrorSeverity,
  type ErrorContext,
  type TrackedError,
} from '@/lib/errorTracking'

// =============================================================================
// TYPES
// =============================================================================

export interface UseErrorReportingOptions {
  /** Component name for context */
  component?: string
  /** Default severity for errors */
  defaultSeverity?: ErrorSeverity
  /** Additional context to include with all errors */
  additionalContext?: Partial<ErrorContext>
}

export interface PerformanceTimer {
  /** Start the timer */
  start: () => void
  /** Stop the timer and report if threshold exceeded */
  stop: (thresholdMs?: number) => number
  /** Get elapsed time without stopping */
  elapsed: () => number
  /** Mark a checkpoint */
  mark: (name: string) => void
  /** Get all checkpoints */
  getCheckpoints: () => Record<string, number>
}

export interface UserFeedback {
  /** Error ID this feedback relates to */
  errorId?: string
  /** User's description of the issue */
  description: string
  /** User's email for follow-up */
  email?: string
  /** Screenshots or other attachments (base64) */
  attachments?: string[]
  /** Current page/feature */
  feature?: string
  /** Steps to reproduce */
  stepsToReproduce?: string
}

export interface UseErrorReportingReturn {
  /** Report an error manually */
  reportError: (error: Error | string, severity?: ErrorSeverity, context?: ErrorContext) => TrackedError | null
  /** Report a warning */
  reportWarning: (message: string, context?: ErrorContext) => TrackedError | null
  /** Report a critical error */
  reportCritical: (error: Error | string, context?: ErrorContext) => TrackedError | null
  /** Create a performance timer */
  createTimer: (name: string) => PerformanceTimer
  /** Submit user feedback */
  submitFeedback: (feedback: UserFeedback) => Promise<boolean>
  /** Get error by ID */
  getError: (errorId: string) => TrackedError | undefined
  /** Copy full error report to clipboard */
  copyReport: () => Promise<boolean>
  /** Get error report as string */
  getReport: () => string
  /** Wrap an async function with error tracking */
  withErrorTracking: <T>(fn: () => Promise<T>, context?: ErrorContext) => Promise<T>
  /** Current route for context */
  currentRoute: string
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useErrorReporting(options: UseErrorReportingOptions = {}): UseErrorReportingReturn {
  const {
    component,
    defaultSeverity = 'medium',
    additionalContext = {},
  } = options

  const location = useLocation()
  const timersRef = useRef<Map<string, { start: number; checkpoints: Map<string, number> }>>(new Map())

  // Build context with route and component info
  const buildContext = useCallback((context: ErrorContext = {}): ErrorContext => {
    return {
      component,
      route: location.pathname,
      ...additionalContext,
      ...context,
    }
  }, [component, location.pathname, additionalContext])

  // Report error
  const reportError = useCallback((
    error: Error | string,
    severity: ErrorSeverity = defaultSeverity,
    context: ErrorContext = {}
  ): TrackedError | null => {
    return trackError(error, severity, buildContext(context))
  }, [defaultSeverity, buildContext])

  // Report warning
  const reportWarning = useCallback((
    message: string,
    context: ErrorContext = {}
  ): TrackedError | null => {
    return trackWarning(message, buildContext(context))
  }, [buildContext])

  // Report critical
  const reportCritical = useCallback((
    error: Error | string,
    context: ErrorContext = {}
  ): TrackedError | null => {
    return trackCritical(error, buildContext(context))
  }, [buildContext])

  // Create performance timer
  const createTimer = useCallback((name: string): PerformanceTimer => {
    const timerKey = `${component || 'unknown'}_${name}_${Date.now()}`

    return {
      start: () => {
        timersRef.current.set(timerKey, {
          start: performance.now(),
          checkpoints: new Map(),
        })
      },
      stop: (thresholdMs = 0) => {
        const timer = timersRef.current.get(timerKey)
        if (!timer) {
          console.warn(`[useErrorReporting] Timer "${name}" was not started`)
          return 0
        }

        const elapsed = performance.now() - timer.start
        timersRef.current.delete(timerKey)

        // Report if exceeded threshold
        if (thresholdMs > 0 && elapsed > thresholdMs) {
          trackWarning(`Performance threshold exceeded: ${name}`, buildContext({
            action: 'performance_warning',
            extra: {
              timerName: name,
              elapsedMs: Math.round(elapsed),
              thresholdMs,
              checkpoints: Object.fromEntries(timer.checkpoints),
            },
          }))
        }

        return elapsed
      },
      elapsed: () => {
        const timer = timersRef.current.get(timerKey)
        if (!timer) return 0
        return performance.now() - timer.start
      },
      mark: (checkpointName: string) => {
        const timer = timersRef.current.get(timerKey)
        if (timer) {
          timer.checkpoints.set(checkpointName, performance.now() - timer.start)
        }
      },
      getCheckpoints: () => {
        const timer = timersRef.current.get(timerKey)
        if (!timer) return {}
        return Object.fromEntries(timer.checkpoints)
      },
    }
  }, [component, buildContext])

  // Submit user feedback
  const submitFeedback = useCallback(async (feedback: UserFeedback): Promise<boolean> => {
    // Track feedback as a special error type
    const feedbackError = trackError('User Feedback Submitted', 'low', buildContext({
      action: 'user_feedback',
      extra: {
        errorId: feedback.errorId,
        description: feedback.description,
        email: feedback.email,
        feature: feedback.feature || location.pathname,
        stepsToReproduce: feedback.stepsToReproduce,
        hasAttachments: (feedback.attachments?.length || 0) > 0,
      },
    }))

    // In a real implementation, you would send this to a feedback endpoint
    // For now, we just track it in our error system
    if (import.meta.env.DEV) {
      console.log('[useErrorReporting] User feedback submitted:', {
        ...feedback,
        trackedAs: feedbackError?.id,
      })
    }

    return !!feedbackError
  }, [buildContext, location.pathname])

  // Wrap async function with error tracking
  const withErrorTracking = useCallback(async <T,>(
    fn: () => Promise<T>,
    context: ErrorContext = {}
  ): Promise<T> => {
    try {
      return await fn()
    } catch (error) {
      reportError(
        error instanceof Error ? error : new Error(String(error)),
        'high',
        {
          ...context,
          action: context.action || 'async_operation_failed',
        }
      )
      throw error
    }
  }, [reportError])

  // Get error by ID
  const getError = useCallback((errorId: string): TrackedError | undefined => {
    return getErrorById(errorId)
  }, [])

  // Copy report to clipboard
  const copyReport = useCallback(async (): Promise<boolean> => {
    return copyErrorReport()
  }, [])

  // Get report string
  const getReport = useCallback((): string => {
    return getErrorReportString()
  }, [])

  return useMemo(() => ({
    reportError,
    reportWarning,
    reportCritical,
    createTimer,
    submitFeedback,
    getError,
    copyReport,
    getReport,
    withErrorTracking,
    currentRoute: location.pathname,
  }), [
    reportError,
    reportWarning,
    reportCritical,
    createTimer,
    submitFeedback,
    getError,
    copyReport,
    getReport,
    withErrorTracking,
    location.pathname,
  ])
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Simple hook for component-scoped error tracking
 */
export function useComponentErrorTracker(componentName: string) {
  const { reportError, reportWarning, reportCritical, createTimer } = useErrorReporting({
    component: componentName,
  })

  return useMemo(() => ({
    track: reportError,
    warn: reportWarning,
    critical: reportCritical,
    timer: createTimer,
  }), [reportError, reportWarning, reportCritical, createTimer])
}

/**
 * Hook for tracking async operation performance
 */
export function useAsyncTracking(operationName: string, component?: string) {
  const { createTimer, reportError, withErrorTracking } = useErrorReporting({ component })

  const trackAsync = useCallback(async <T,>(
    fn: () => Promise<T>,
    thresholdMs: number = 5000
  ): Promise<T> => {
    const timer = createTimer(operationName)
    timer.start()

    try {
      const result = await withErrorTracking(fn, { action: operationName })
      timer.stop(thresholdMs)
      return result
    } catch (error) {
      timer.stop() // Still record timing even on error
      throw error
    }
  }, [createTimer, operationName, withErrorTracking])

  return { trackAsync, reportError }
}

export default useErrorReporting

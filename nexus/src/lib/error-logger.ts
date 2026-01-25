/**
 * Error Logging Utility
 *
 * Centralized error logging with Sentry integration preparation.
 * This module captures errors with context and prepares them for
 * external error tracking services.
 */

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Error context for better debugging
export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  workflowId?: string
  integrationId?: string
  additionalData?: Record<string, unknown>
}

// Error log entry structure
export interface ErrorLogEntry {
  id: string
  timestamp: string
  error: {
    name: string
    message: string
    stack?: string
  }
  severity: ErrorSeverity
  context: ErrorContext
  userAgent: string
  url: string
  sessionId?: string
}

// Generate unique error ID
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get or create session ID for error correlation
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('error_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('error_session_id', sessionId)
  }
  return sessionId
}

// In-memory error queue for batch sending
const errorQueue: ErrorLogEntry[] = []
const MAX_QUEUE_SIZE = 50

/**
 * Log an error with context
 */
export function logError(
  error: Error | string,
  severity: ErrorSeverity = 'medium',
  context: ErrorContext = {}
): ErrorLogEntry {
  const errorObj = error instanceof Error ? error : new Error(error)

  const entry: ErrorLogEntry = {
    id: generateErrorId(),
    timestamp: new Date().toISOString(),
    error: {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack,
    },
    severity,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    sessionId: getSessionId(),
  }

  // Always log to console in development
  if (import.meta.env.DEV) {
    console.group(`[ErrorLogger] ${severity.toUpperCase()}: ${errorObj.message}`)
    console.error('Error:', errorObj)
    console.log('Context:', context)
    console.log('Entry ID:', entry.id)
    console.groupEnd()
  }

  // Add to queue
  errorQueue.push(entry)
  if (errorQueue.length > MAX_QUEUE_SIZE) {
    errorQueue.shift() // Remove oldest
  }

  // Store in localStorage for persistence across refreshes
  try {
    const storedErrors = JSON.parse(localStorage.getItem('nexus_error_log') || '[]')
    storedErrors.push(entry)
    // Keep only last 20 errors
    if (storedErrors.length > 20) {
      storedErrors.splice(0, storedErrors.length - 20)
    }
    localStorage.setItem('nexus_error_log', JSON.stringify(storedErrors))
  } catch {
    // localStorage might be full or disabled
  }

  // Sentry integration point
  // TODO: When Sentry is configured, send error here
  // Sentry.captureException(errorObj, { extra: context, level: severity })

  return entry
}

/**
 * Log a warning (non-critical issue)
 */
export function logWarning(
  message: string,
  context: ErrorContext = {}
): void {
  logError(message, 'low', context)
}

/**
 * Log a critical error (requires immediate attention)
 */
export function logCritical(
  error: Error | string,
  context: ErrorContext = {}
): ErrorLogEntry {
  return logError(error, 'critical', context)
}

/**
 * Create an error reporter function for a specific component
 */
export function createErrorReporter(component: string) {
  return {
    log: (error: Error | string, context: Omit<ErrorContext, 'component'> = {}) =>
      logError(error, 'medium', { ...context, component }),
    warn: (message: string, context: Omit<ErrorContext, 'component'> = {}) =>
      logWarning(message, { ...context, component }),
    critical: (error: Error | string, context: Omit<ErrorContext, 'component'> = {}) =>
      logCritical(error, { ...context, component }),
  }
}

/**
 * Get all logged errors
 */
export function getErrorLog(): ErrorLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem('nexus_error_log') || '[]')
  } catch {
    return []
  }
}

/**
 * Clear error log
 */
export function clearErrorLog(): void {
  errorQueue.length = 0
  localStorage.removeItem('nexus_error_log')
}

/**
 * Generate error report for support
 */
export function generateErrorReport(): string {
  const errors = getErrorLog()
  const report = {
    generatedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    sessionId: getSessionId(),
    errorCount: errors.length,
    errors: errors.slice(-10), // Last 10 errors
  }
  return JSON.stringify(report, null, 2)
}

/**
 * Copy error report to clipboard
 */
export async function copyErrorReport(): Promise<boolean> {
  try {
    const report = generateErrorReport()
    await navigator.clipboard.writeText(report)
    return true
  } catch {
    return false
  }
}

// Capture unhandled errors globally
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, 'high', {
      action: 'unhandled_error',
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason))
    logError(error, 'high', {
      action: 'unhandled_rejection',
    })
  })
}

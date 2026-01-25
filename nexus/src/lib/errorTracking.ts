/**
 * Production Error Tracking System
 *
 * Comprehensive error tracking infrastructure with:
 * - Global error handlers (window.onerror, unhandledrejection)
 * - Error context collection (user, route, device, etc.)
 * - Configurable reporting endpoint
 * - Error deduplication and rate limiting
 * - Performance metrics collection
 * - User session correlation
 *
 * This module provides production-ready error tracking without external SDKs.
 */

// =============================================================================
// TYPES
// =============================================================================

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorContext {
  /** Component or module where error occurred */
  component?: string
  /** User action that triggered the error */
  action?: string
  /** Current route/URL path */
  route?: string
  /** Logged in user ID */
  userId?: string
  /** Workflow being executed */
  workflowId?: string
  /** Integration involved */
  integrationId?: string
  /** React component stack trace */
  componentStack?: string
  /** Additional custom data */
  extra?: Record<string, unknown>
}

export interface TrackedError {
  /** Unique error ID for reference */
  id: string
  /** ISO timestamp */
  timestamp: string
  /** Error fingerprint for deduplication */
  fingerprint: string
  /** Error details */
  error: {
    name: string
    message: string
    stack?: string
  }
  /** Severity level */
  severity: ErrorSeverity
  /** Error context */
  context: ErrorContext
  /** Browser/device info */
  device: {
    userAgent: string
    platform: string
    language: string
    screenSize: string
    viewportSize: string
    online: boolean
    memory?: number
  }
  /** Session info */
  session: {
    id: string
    startTime: string
    pageViews: number
    errorCount: number
  }
  /** Performance context */
  performance: {
    pageLoadTime?: number
    memoryUsage?: number
    connectionType?: string
  }
  /** App context */
  app: {
    version: string
    environment: 'development' | 'production' | 'staging'
    buildId?: string
  }
  /** Number of times this error occurred */
  occurrences: number
}

export interface ErrorTrackingConfig {
  /** Enable/disable tracking */
  enabled: boolean
  /** Endpoint to report errors to */
  reportingEndpoint?: string
  /** Environment mode */
  environment: 'development' | 'production' | 'staging'
  /** App version */
  appVersion: string
  /** Build ID (e.g., git commit hash) */
  buildId?: string
  /** Max errors to store locally */
  maxStoredErrors: number
  /** Rate limit: max errors per minute */
  maxErrorsPerMinute: number
  /** Enable console logging in dev */
  enableConsoleLogging: boolean
  /** Sample rate for error reporting (0-1) */
  sampleRate: number
  /** Callback before sending error */
  beforeSend?: (error: TrackedError) => TrackedError | null
  /** Callback after error is tracked */
  onError?: (error: TrackedError) => void
  /** User ID provider */
  getUserId?: () => string | undefined
  /** Custom tags to add to all errors */
  tags?: Record<string, string>
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = 'nexus_error_tracking'
const SESSION_KEY = 'nexus_error_session'
const DEFAULT_MAX_STORED_ERRORS = 100
const DEFAULT_MAX_ERRORS_PER_MINUTE = 10
const DEFAULT_SAMPLE_RATE = 1.0

// =============================================================================
// STATE
// =============================================================================

let config: ErrorTrackingConfig = {
  enabled: true,
  environment: import.meta.env.DEV ? 'development' : 'production',
  appVersion: '1.0.0',
  maxStoredErrors: DEFAULT_MAX_STORED_ERRORS,
  maxErrorsPerMinute: DEFAULT_MAX_ERRORS_PER_MINUTE,
  enableConsoleLogging: import.meta.env.DEV,
  sampleRate: DEFAULT_SAMPLE_RATE,
}

let initialized = false
let errorQueue: TrackedError[] = []
let errorRateLimit: number[] = [] // Timestamps of recent errors
let errorFingerprints = new Map<string, number>() // Fingerprint -> occurrence count
let session: { id: string; startTime: string; pageViews: number; errorCount: number } | null = null

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Generate error fingerprint for deduplication
 */
function generateFingerprint(error: Error, context: ErrorContext): string {
  const parts = [
    error.name,
    error.message.substring(0, 100),
    context.component || 'unknown',
    context.action || 'unknown',
  ]
  return btoa(parts.join('|')).substring(0, 32)
}

/**
 * Get or create session
 */
function getSession(): typeof session {
  if (session) return session

  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      session = JSON.parse(stored)
      return session
    }
  } catch {
    // Ignore storage errors
  }

  session = {
    id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    startTime: new Date().toISOString(),
    pageViews: 1,
    errorCount: 0,
  }

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // Ignore storage errors
  }

  return session
}

/**
 * Update session error count
 */
function incrementSessionErrorCount(): void {
  const sess = getSession()
  if (sess) {
    sess.errorCount++
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess))
    } catch {
      // Ignore
    }
  }
}

/**
 * Collect device information
 */
function getDeviceInfo(): TrackedError['device'] {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenSize: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    online: navigator.onLine,
    memory: (navigator as { deviceMemory?: number }).deviceMemory,
  }
}

/**
 * Collect performance metrics
 */
function getPerformanceInfo(): TrackedError['performance'] {
  const metrics: TrackedError['performance'] = {}

  try {
    // Page load time
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (navigation) {
      metrics.pageLoadTime = navigation.loadEventEnd - navigation.startTime
    }

    // Memory usage (Chrome only)
    const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory
    if (memory) {
      metrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1048576) // MB
    }

    // Connection type
    const connection = (navigator as { connection?: { effectiveType: string } }).connection
    if (connection) {
      metrics.connectionType = connection.effectiveType
    }
  } catch {
    // Ignore performance API errors
  }

  return metrics
}

/**
 * Check rate limit
 */
function isRateLimited(): boolean {
  const now = Date.now()
  const oneMinuteAgo = now - 60000

  // Clean old entries
  errorRateLimit = errorRateLimit.filter(ts => ts > oneMinuteAgo)

  if (errorRateLimit.length >= config.maxErrorsPerMinute) {
    return true
  }

  errorRateLimit.push(now)
  return false
}

/**
 * Check sample rate
 */
function shouldSample(): boolean {
  return Math.random() < config.sampleRate
}

/**
 * Store error locally
 */
function storeError(error: TrackedError): void {
  errorQueue.push(error)

  // Trim queue if needed
  if (errorQueue.length > config.maxStoredErrors) {
    errorQueue = errorQueue.slice(-config.maxStoredErrors)
  }

  // Persist to localStorage
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as TrackedError[]
    stored.push(error)

    // Keep only most recent errors
    const trimmed = stored.slice(-config.maxStoredErrors)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // Storage might be full or disabled
  }
}

/**
 * Send error to reporting endpoint
 */
async function reportError(error: TrackedError): Promise<boolean> {
  if (!config.reportingEndpoint) {
    return false
  }

  try {
    const response = await fetch(config.reportingEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(error),
      // Don't wait for response in production
      keepalive: true,
    })

    return response.ok
  } catch {
    // Silently fail - don't want error reporting to cause errors
    return false
  }
}

/**
 * Log error to console (development mode)
 */
function logToConsole(error: TrackedError): void {
  if (!config.enableConsoleLogging) return

  const severityColors: Record<ErrorSeverity, string> = {
    low: '#6b7280',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  }

  console.group(
    `%c[ErrorTracking] ${error.severity.toUpperCase()}: ${error.error.message}`,
    `color: ${severityColors[error.severity]}; font-weight: bold`
  )
  console.log('Error ID:', error.id)
  console.log('Fingerprint:', error.fingerprint)
  console.log('Context:', error.context)
  console.log('Occurrences:', error.occurrences)
  console.error('Stack:', error.error.stack)
  console.groupEnd()
}

// =============================================================================
// MAIN API
// =============================================================================

/**
 * Initialize error tracking
 */
export function initErrorTracking(userConfig: Partial<ErrorTrackingConfig> = {}): void {
  if (initialized) {
    console.warn('[ErrorTracking] Already initialized')
    return
  }

  config = { ...config, ...userConfig }

  // Setup global error handlers
  setupGlobalHandlers()

  // Load stored session
  getSession()

  // Load stored errors
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as TrackedError[]
    errorQueue = stored.slice(-config.maxStoredErrors)

    // Rebuild fingerprint map
    errorFingerprints.clear()
    for (const err of errorQueue) {
      const count = errorFingerprints.get(err.fingerprint) || 0
      errorFingerprints.set(err.fingerprint, count + 1)
    }
  } catch {
    // Ignore
  }

  initialized = true

  if (config.enableConsoleLogging) {
    console.log('[ErrorTracking] Initialized', {
      environment: config.environment,
      version: config.appVersion,
      sampleRate: config.sampleRate,
    })
  }
}

/**
 * Setup global error handlers
 */
function setupGlobalHandlers(): void {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    trackError(event.error || new Error(event.message), 'high', {
      action: 'uncaught_error',
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    })
  })

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason))

    trackError(error, 'high', {
      action: 'unhandled_rejection',
    })
  })

  // Track page visibility changes for context
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Flush any pending errors when page is hidden
      flushErrors()
    }
  })

  // Track before unload to flush errors
  window.addEventListener('beforeunload', () => {
    flushErrors()
  })
}

/**
 * Track an error
 */
export function trackError(
  error: Error | string,
  severity: ErrorSeverity = 'medium',
  context: ErrorContext = {}
): TrackedError | null {
  if (!config.enabled) return null

  // Convert string to Error if needed
  const errorObj = error instanceof Error ? error : new Error(error)

  // Check rate limit
  if (isRateLimited()) {
    if (config.enableConsoleLogging) {
      console.warn('[ErrorTracking] Rate limited - error not tracked')
    }
    return null
  }

  // Check sample rate
  if (!shouldSample()) {
    return null
  }

  // Generate fingerprint
  const fingerprint = generateFingerprint(errorObj, context)

  // Update occurrence count
  const occurrences = (errorFingerprints.get(fingerprint) || 0) + 1
  errorFingerprints.set(fingerprint, occurrences)

  // Get session
  const sess = getSession()
  incrementSessionErrorCount()

  // Build tracked error
  const trackedError: TrackedError = {
    id: generateErrorId(),
    timestamp: new Date().toISOString(),
    fingerprint,
    error: {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack,
    },
    severity,
    context: {
      ...context,
      route: context.route || window.location.pathname,
      userId: context.userId || config.getUserId?.(),
    },
    device: getDeviceInfo(),
    session: sess!,
    performance: getPerformanceInfo(),
    app: {
      version: config.appVersion,
      environment: config.environment,
      buildId: config.buildId,
    },
    occurrences,
  }

  // Allow modification before sending
  const finalError = config.beforeSend ? config.beforeSend(trackedError) : trackedError
  if (!finalError) return null

  // Store locally
  storeError(finalError)

  // Log to console in dev
  logToConsole(finalError)

  // Report to endpoint (fire and forget)
  if (config.reportingEndpoint) {
    reportError(finalError)
  }

  // Call onError callback
  config.onError?.(finalError)

  return finalError
}

/**
 * Track error with component stack (for React error boundaries)
 */
export function trackBoundaryError(
  error: Error,
  componentStack: string,
  severity: ErrorSeverity = 'high',
  context: ErrorContext = {}
): TrackedError | null {
  return trackError(error, severity, {
    ...context,
    componentStack,
    action: context.action || 'error_boundary',
  })
}

/**
 * Set user ID for tracking
 */
export function setUserId(userId: string | undefined): void {
  config.getUserId = () => userId
}

/**
 * Update configuration
 */
export function updateConfig(updates: Partial<ErrorTrackingConfig>): void {
  config = { ...config, ...updates }
}

/**
 * Get stored errors
 */
export function getStoredErrors(): TrackedError[] {
  return [...errorQueue]
}

/**
 * Clear stored errors
 */
export function clearStoredErrors(): void {
  errorQueue = []
  errorFingerprints.clear()
  errorRateLimit = []
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore
  }
}

/**
 * Flush pending errors to reporting endpoint
 */
export async function flushErrors(): Promise<void> {
  if (!config.reportingEndpoint) return

  const pending = [...errorQueue]
  for (const error of pending) {
    await reportError(error)
  }
}

/**
 * Generate error report for support
 */
export function generateErrorReport(): {
  generatedAt: string
  session: typeof session
  device: TrackedError['device']
  app: TrackedError['app']
  errors: TrackedError[]
  errorCount: number
} {
  return {
    generatedAt: new Date().toISOString(),
    session: getSession(),
    device: getDeviceInfo(),
    app: {
      version: config.appVersion,
      environment: config.environment,
      buildId: config.buildId,
    },
    errors: errorQueue.slice(-20), // Last 20 errors
    errorCount: errorQueue.length,
  }
}

/**
 * Generate shareable error report string
 */
export function getErrorReportString(): string {
  return JSON.stringify(generateErrorReport(), null, 2)
}

/**
 * Copy error report to clipboard
 */
export async function copyErrorReport(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getErrorReportString())
    return true
  } catch {
    return false
  }
}

/**
 * Get error by ID
 */
export function getErrorById(errorId: string): TrackedError | undefined {
  return errorQueue.find(e => e.id === errorId)
}

/**
 * Check if tracking is initialized
 */
export function isInitialized(): boolean {
  return initialized
}

/**
 * Get current config (for debugging)
 */
export function getConfig(): ErrorTrackingConfig {
  return { ...config }
}

// =============================================================================
// CONVENIENCE WRAPPERS
// =============================================================================

/**
 * Track a low severity error
 */
export function trackWarning(message: string, context: ErrorContext = {}): TrackedError | null {
  return trackError(message, 'low', context)
}

/**
 * Track a critical error
 */
export function trackCritical(error: Error | string, context: ErrorContext = {}): TrackedError | null {
  return trackError(error, 'critical', context)
}

/**
 * Create error tracker for a specific component
 */
export function createComponentTracker(componentName: string) {
  return {
    track: (error: Error | string, severity: ErrorSeverity = 'medium', context: ErrorContext = {}) =>
      trackError(error, severity, { ...context, component: componentName }),
    warn: (message: string, context: ErrorContext = {}) =>
      trackWarning(message, { ...context, component: componentName }),
    critical: (error: Error | string, context: ErrorContext = {}) =>
      trackCritical(error, { ...context, component: componentName }),
  }
}

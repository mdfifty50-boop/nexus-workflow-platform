/**
 * Error Recovery System for Workflow Execution
 *
 * Provides comprehensive error handling including:
 * - Error classification (transient vs permanent)
 * - Recovery strategies per error type
 * - Automatic retry configuration
 * - Fallback action definitions
 * - Circuit breaker pattern
 * - Checkpoint/resume capabilities
 *
 * @module ErrorRecovery
 */

// ============================================================================
// Error Types and Classifications
// ============================================================================

/**
 * Error classification determines recovery strategy
 */
export type ErrorClassification =
  | 'transient'    // Temporary - retry with backoff
  | 'permanent'    // Unrecoverable - fail immediately
  | 'rate_limit'   // Rate limited - queue and retry later
  | 'auth'         // Authentication issue - refresh and retry
  | 'service'      // Service unavailable - circuit breaker
  | 'validation'   // Invalid input - log and skip
  | 'partial'      // Partial failure - continue with completed

/**
 * Error categories for grouping similar errors
 */
export type ErrorCategory =
  | 'network'
  | 'timeout'
  | 'auth_expired'
  | 'auth_invalid'
  | 'rate_limit'
  | 'service_unavailable'
  | 'service_error'
  | 'validation'
  | 'not_found'
  | 'permission'
  | 'quota'
  | 'unknown'

/**
 * Structured workflow error with recovery metadata
 */
export interface WorkflowError {
  code: string
  message: string
  messageAr?: string
  category: ErrorCategory
  classification: ErrorClassification
  isRetryable: boolean
  suggestedAction: string
  suggestedActionAr?: string
  retryAfterMs?: number
  service?: string
  originalError?: unknown
  timestamp: string
  context?: Record<string, unknown>
}

/**
 * Recovery action to take for an error
 */
export interface RecoveryAction {
  type: 'retry' | 'refresh_auth' | 'queue' | 'skip' | 'fallback' | 'abort' | 'notify'
  delayMs?: number
  maxAttempts?: number
  fallbackAction?: FallbackAction
  notifyUser?: boolean
  notifyMessage?: string
  notifyMessageAr?: string
}

/**
 * Fallback action when primary action fails
 */
export interface FallbackAction {
  type: 'alternative_service' | 'cached_data' | 'default_value' | 'skip_step' | 'manual_review'
  service?: string
  data?: unknown
  message?: string
  messageAr?: string
}

/**
 * Retry configuration with exponential backoff
 */
export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  jitter: boolean
  retryOn: ErrorCategory[]
}

/**
 * Circuit breaker state
 */
export interface CircuitBreakerState {
  isOpen: boolean
  failures: number
  lastFailureTime: number
  lastSuccessTime: number
  halfOpenAttempts: number
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number      // Failures before opening (default: 5)
  resetTimeoutMs: number        // Time before half-open (default: 60000)
  halfOpenMaxAttempts: number   // Max attempts in half-open (default: 3)
  monitoringWindowMs: number    // Window for counting failures (default: 60000)
}

/**
 * Workflow checkpoint for resume capability
 */
export interface WorkflowCheckpoint {
  id: string
  workflowId: string
  executionId: string
  stepId: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  context: Record<string, unknown>
  completedSteps: string[]
  failedSteps: string[]
  stepResults: Record<string, unknown>
  tokensUsed: number
  costUsd: number
  createdAt: string
  updatedAt: string
}

/**
 * Error event for logging/analytics
 */
export interface ErrorEvent {
  id: string
  errorCode: string
  errorMessage: string
  category: ErrorCategory
  classification: ErrorClassification
  service: string
  workflowId?: string
  executionId?: string
  stepId?: string
  userId?: string
  recoveryAction: RecoveryAction['type']
  recoverySuccess: boolean
  retryAttempt: number
  totalRetries: number
  durationMs: number
  timestamp: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,     // 1 second
  maxDelayMs: 30000,     // 30 seconds
  backoffMultiplier: 2,
  jitter: true,
  retryOn: ['network', 'timeout', 'service_unavailable', 'service_error'],
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 60000,      // 1 minute
  halfOpenMaxAttempts: 3,
  monitoringWindowMs: 60000,  // 1 minute
}

// ============================================================================
// Error Classification Patterns
// ============================================================================

const ERROR_PATTERNS: Array<{
  pattern: RegExp
  category: ErrorCategory
  classification: ErrorClassification
}> = [
  // Network errors - transient
  { pattern: /network|failed to fetch|fetch failed|connection refused|ECONNREFUSED/i, category: 'network', classification: 'transient' },
  { pattern: /ENOTFOUND|DNS|hostname/i, category: 'network', classification: 'transient' },
  { pattern: /ETIMEDOUT|ESOCKETTIMEDOUT|timeout|timed out/i, category: 'timeout', classification: 'transient' },

  // Rate limiting - rate_limit
  { pattern: /429|rate limit|too many requests|quota exceeded/i, category: 'rate_limit', classification: 'rate_limit' },
  { pattern: /throttl/i, category: 'rate_limit', classification: 'rate_limit' },

  // Authentication - auth
  { pattern: /401|unauthorized|authentication required/i, category: 'auth_expired', classification: 'auth' },
  { pattern: /token expired|session expired|jwt expired/i, category: 'auth_expired', classification: 'auth' },
  { pattern: /invalid token|invalid credentials|invalid api key/i, category: 'auth_invalid', classification: 'permanent' },

  // Service errors - service
  { pattern: /503|service unavailable|temporarily unavailable|maintenance/i, category: 'service_unavailable', classification: 'service' },
  { pattern: /502|bad gateway/i, category: 'service_error', classification: 'service' },
  { pattern: /500|internal server error/i, category: 'service_error', classification: 'transient' },
  { pattern: /504|gateway timeout/i, category: 'timeout', classification: 'transient' },

  // Validation - permanent
  { pattern: /400|bad request|invalid input|validation failed/i, category: 'validation', classification: 'validation' },
  { pattern: /missing required|required field|invalid format/i, category: 'validation', classification: 'validation' },

  // Not found - permanent
  { pattern: /404|not found|does not exist|no such/i, category: 'not_found', classification: 'permanent' },

  // Permission - permanent
  { pattern: /403|forbidden|access denied|permission denied/i, category: 'permission', classification: 'permanent' },

  // Quota - rate_limit
  { pattern: /quota|limit reached|usage limit/i, category: 'quota', classification: 'rate_limit' },
]

// ============================================================================
// Error Classification Functions
// ============================================================================

/**
 * Classify an error based on its message and properties
 */
export function classifyError(error: Error | string | unknown): {
  category: ErrorCategory
  classification: ErrorClassification
} {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const lowerMessage = errorMessage.toLowerCase()

  // Check HTTP status codes first
  const statusMatch = errorMessage.match(/\b([1-5]\d{2})\b/)
  if (statusMatch) {
    const status = parseInt(statusMatch[1], 10)

    if (status === 429) return { category: 'rate_limit', classification: 'rate_limit' }
    if (status === 401) return { category: 'auth_expired', classification: 'auth' }
    if (status === 403) return { category: 'permission', classification: 'permanent' }
    if (status === 404) return { category: 'not_found', classification: 'permanent' }
    if (status === 408 || status === 504) return { category: 'timeout', classification: 'transient' }
    if (status === 500) return { category: 'service_error', classification: 'transient' }
    if (status === 502 || status === 503) return { category: 'service_unavailable', classification: 'service' }
    if (status >= 400 && status < 500) return { category: 'validation', classification: 'validation' }
    if (status >= 500) return { category: 'service_error', classification: 'transient' }
  }

  // Check against patterns
  for (const { pattern, category, classification } of ERROR_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      return { category, classification }
    }
  }

  // Default to unknown transient (will retry)
  return { category: 'unknown', classification: 'transient' }
}

/**
 * Create a structured WorkflowError from any error
 */
export function createWorkflowError(
  error: Error | string | unknown,
  service?: string,
  context?: Record<string, unknown>
): WorkflowError {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const { category, classification } = classifyError(error)

  const errorDetails = getErrorDetails(category, errorMessage)

  return {
    code: `${category.toUpperCase()}_ERROR`,
    message: errorDetails.message,
    messageAr: errorDetails.messageAr,
    category,
    classification,
    isRetryable: classification !== 'permanent' && classification !== 'validation',
    suggestedAction: errorDetails.suggestedAction,
    suggestedActionAr: errorDetails.suggestedActionAr,
    retryAfterMs: getRetryAfter(error, category),
    service,
    originalError: error,
    timestamp: new Date().toISOString(),
    context,
  }
}

/**
 * Get user-friendly error details with Arabic translations
 */
function getErrorDetails(category: ErrorCategory, originalMessage: string): {
  message: string
  messageAr: string
  suggestedAction: string
  suggestedActionAr: string
} {
  const details: Record<ErrorCategory, {
    message: string
    messageAr: string
    suggestedAction: string
    suggestedActionAr: string
  }> = {
    network: {
      message: 'Unable to connect to the server. Please check your internet connection.',
      messageAr: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.',
      suggestedAction: 'Check your network connection and try again.',
      suggestedActionAr: 'تحقق من اتصالك بالشبكة وحاول مرة أخرى.',
    },
    timeout: {
      message: 'The request took too long to complete.',
      messageAr: 'استغرق الطلب وقتاً طويلاً للاكتمال.',
      suggestedAction: 'The server might be busy. Please try again in a moment.',
      suggestedActionAr: 'قد يكون الخادم مشغولاً. يرجى المحاولة مرة أخرى بعد قليل.',
    },
    auth_expired: {
      message: 'Your session has expired.',
      messageAr: 'انتهت صلاحية جلستك.',
      suggestedAction: 'Please sign in again to continue.',
      suggestedActionAr: 'يرجى تسجيل الدخول مرة أخرى للمتابعة.',
    },
    auth_invalid: {
      message: 'Authentication failed. Invalid credentials.',
      messageAr: 'فشل التحقق. بيانات اعتماد غير صالحة.',
      suggestedAction: 'Please check your credentials and try again.',
      suggestedActionAr: 'يرجى التحقق من بيانات الاعتماد والمحاولة مرة أخرى.',
    },
    rate_limit: {
      message: 'Too many requests. Please wait before trying again.',
      messageAr: 'طلبات كثيرة جداً. يرجى الانتظار قبل المحاولة مرة أخرى.',
      suggestedAction: 'Wait a moment and the request will automatically retry.',
      suggestedActionAr: 'انتظر لحظة وسيتم إعادة المحاولة تلقائياً.',
    },
    service_unavailable: {
      message: 'The service is temporarily unavailable.',
      messageAr: 'الخدمة غير متاحة مؤقتاً.',
      suggestedAction: 'The service will recover shortly. Please wait.',
      suggestedActionAr: 'ستتعافى الخدمة قريباً. يرجى الانتظار.',
    },
    service_error: {
      message: 'An error occurred on the server.',
      messageAr: 'حدث خطأ على الخادم.',
      suggestedAction: 'We are working to fix this. Please try again later.',
      suggestedActionAr: 'نحن نعمل على إصلاح هذا. يرجى المحاولة لاحقاً.',
    },
    validation: {
      message: 'The provided data is invalid.',
      messageAr: 'البيانات المقدمة غير صالحة.',
      suggestedAction: 'Please check your input and try again.',
      suggestedActionAr: 'يرجى التحقق من المدخلات والمحاولة مرة أخرى.',
    },
    not_found: {
      message: 'The requested resource was not found.',
      messageAr: 'لم يتم العثور على المورد المطلوب.',
      suggestedAction: 'The item may have been deleted or moved.',
      suggestedActionAr: 'ربما تم حذف العنصر أو نقله.',
    },
    permission: {
      message: 'You do not have permission to perform this action.',
      messageAr: 'ليس لديك إذن لتنفيذ هذا الإجراء.',
      suggestedAction: 'Contact your administrator for access.',
      suggestedActionAr: 'تواصل مع المسؤول للحصول على الوصول.',
    },
    quota: {
      message: 'You have reached your usage limit.',
      messageAr: 'لقد وصلت إلى حد الاستخدام الخاص بك.',
      suggestedAction: 'Upgrade your plan or wait for the limit to reset.',
      suggestedActionAr: 'قم بترقية خطتك أو انتظر حتى يتم إعادة تعيين الحد.',
    },
    unknown: {
      message: originalMessage || 'An unexpected error occurred.',
      messageAr: 'حدث خطأ غير متوقع.',
      suggestedAction: 'Please try again. If the problem persists, contact support.',
      suggestedActionAr: 'يرجى المحاولة مرة أخرى. إذا استمرت المشكلة، تواصل مع الدعم.',
    },
  }

  return details[category]
}

/**
 * Extract retry-after delay from error if available
 */
function getRetryAfter(error: unknown, category: ErrorCategory): number | undefined {
  // Check for Retry-After header value in error
  if (error instanceof Error && 'retryAfter' in error) {
    return (error as Error & { retryAfter: number }).retryAfter
  }

  // Default delays by category
  const defaultDelays: Partial<Record<ErrorCategory, number>> = {
    rate_limit: 30000,        // 30 seconds
    timeout: 5000,            // 5 seconds
    service_unavailable: 60000, // 1 minute
    network: 2000,            // 2 seconds
    service_error: 5000,      // 5 seconds
  }

  return defaultDelays[category]
}

// ============================================================================
// Recovery Strategy Functions
// ============================================================================

/**
 * Determine the recovery action for an error
 */
export function getRecoveryAction(
  error: WorkflowError,
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): RecoveryAction {
  // Check if we've exceeded max retries
  if (attempt >= config.maxRetries) {
    return {
      type: 'abort',
      notifyUser: true,
      notifyMessage: `Failed after ${attempt} attempts: ${error.message}`,
      notifyMessageAr: `فشل بعد ${attempt} محاولات: ${error.messageAr || error.message}`,
    }
  }

  switch (error.classification) {
    case 'transient':
      // Retry with exponential backoff
      return {
        type: 'retry',
        delayMs: calculateBackoffDelay(attempt, config),
        maxAttempts: config.maxRetries,
      }

    case 'rate_limit':
      // Queue for later retry
      return {
        type: 'queue',
        delayMs: error.retryAfterMs || 30000,
        maxAttempts: config.maxRetries,
      }

    case 'auth':
      // Refresh authentication and retry
      return {
        type: 'refresh_auth',
        delayMs: 1000,
        maxAttempts: 2, // Only retry once after auth refresh
      }

    case 'service':
      // Check circuit breaker, potentially skip
      return {
        type: 'retry',
        delayMs: error.retryAfterMs || 60000,
        maxAttempts: config.maxRetries,
        fallbackAction: {
          type: 'skip_step',
          message: 'Service temporarily unavailable. Skipping this step.',
          messageAr: 'الخدمة غير متاحة مؤقتاً. تم تخطي هذه الخطوة.',
        },
      }

    case 'validation':
      // Log error and skip
      return {
        type: 'skip',
        notifyUser: true,
        notifyMessage: `Invalid input: ${error.message}`,
        notifyMessageAr: `إدخال غير صالح: ${error.messageAr || error.message}`,
      }

    case 'partial':
      // Continue with completed steps
      return {
        type: 'fallback',
        fallbackAction: {
          type: 'skip_step',
          message: 'Some steps completed. Continuing with results.',
          messageAr: 'اكتملت بعض الخطوات. المتابعة بالنتائج.',
        },
      }

    case 'permanent':
    default:
      // Cannot recover - abort
      return {
        type: 'abort',
        notifyUser: true,
        notifyMessage: error.message,
        notifyMessageAr: error.messageAr || error.message,
      }
  }
}

/**
 * Calculate exponential backoff delay with optional jitter
 */
export function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: baseDelay * (multiplier ^ attempt)
  let delay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt)

  // Add jitter (0-50% of delay) to prevent thundering herd
  if (config.jitter) {
    const jitter = Math.random() * 0.5 * delay
    delay += jitter
  }

  // Cap at maximum delay
  return Math.min(delay, config.maxDelayMs)
}

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

/**
 * Circuit breaker for managing service availability
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = {
    isOpen: false,
    failures: 0,
    lastFailureTime: 0,
    lastSuccessTime: 0,
    halfOpenAttempts: 0,
  }

  private failureTimestamps: number[] = []
  private service: string
  private config: CircuitBreakerConfig

  constructor(
    service: string,
    config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG
  ) {
    this.service = service
    this.config = config
  }

  /**
   * Check if the circuit breaker allows requests
   */
  canExecute(): { allowed: boolean; reason?: string } {
    const now = Date.now()

    // If circuit is closed, allow
    if (!this.state.isOpen) {
      return { allowed: true }
    }

    // Check if we should try half-open
    const timeSinceLastFailure = now - this.state.lastFailureTime
    if (timeSinceLastFailure >= this.config.resetTimeoutMs) {
      // Allow limited attempts in half-open state
      if (this.state.halfOpenAttempts < this.config.halfOpenMaxAttempts) {
        return { allowed: true }
      }
    }

    return {
      allowed: false,
      reason: `Circuit breaker open for ${this.service}. Too many failures (${this.state.failures}). Will retry in ${Math.round((this.config.resetTimeoutMs - timeSinceLastFailure) / 1000)}s`,
    }
  }

  /**
   * Record a successful execution
   */
  recordSuccess(): void {
    this.state.isOpen = false
    this.state.failures = 0
    this.state.halfOpenAttempts = 0
    this.state.lastSuccessTime = Date.now()
    this.failureTimestamps = []
  }

  /**
   * Record a failed execution
   */
  recordFailure(): void {
    const now = Date.now()

    // Add failure timestamp
    this.failureTimestamps.push(now)

    // Remove old failures outside monitoring window
    this.failureTimestamps = this.failureTimestamps.filter(
      (ts) => now - ts < this.config.monitoringWindowMs
    )

    this.state.failures = this.failureTimestamps.length
    this.state.lastFailureTime = now

    // Check if we should open the circuit
    if (this.state.failures >= this.config.failureThreshold) {
      this.state.isOpen = true
      console.warn(`[CircuitBreaker] Circuit opened for ${this.service} after ${this.state.failures} failures`)
    }

    // Track half-open attempts
    if (this.state.isOpen) {
      this.state.halfOpenAttempts++
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return { ...this.state }
  }

  /**
   * Force reset the circuit breaker
   */
  reset(): void {
    this.state = {
      isOpen: false,
      failures: 0,
      lastFailureTime: 0,
      lastSuccessTime: Date.now(),
      halfOpenAttempts: 0,
    }
    this.failureTimestamps = []
  }
}

// ============================================================================
// Checkpoint Manager for Resume Capability
// ============================================================================

/**
 * Manages workflow checkpoints for resume capability
 */
export class CheckpointManager {
  private checkpoints: Map<string, WorkflowCheckpoint> = new Map()

  /**
   * Create a checkpoint for current execution state
   */
  createCheckpoint(params: {
    workflowId: string
    executionId: string
    stepId: string
    status: WorkflowCheckpoint['status']
    context: Record<string, unknown>
    completedSteps: string[]
    failedSteps?: string[]
    stepResults: Record<string, unknown>
    tokensUsed: number
    costUsd: number
  }): WorkflowCheckpoint {
    const checkpointId = `chk_${params.executionId}_${Date.now()}`
    const now = new Date().toISOString()

    const checkpoint: WorkflowCheckpoint = {
      id: checkpointId,
      workflowId: params.workflowId,
      executionId: params.executionId,
      stepId: params.stepId,
      status: params.status,
      context: params.context,
      completedSteps: params.completedSteps,
      failedSteps: params.failedSteps || [],
      stepResults: params.stepResults,
      tokensUsed: params.tokensUsed,
      costUsd: params.costUsd,
      createdAt: now,
      updatedAt: now,
    }

    this.checkpoints.set(checkpointId, checkpoint)

    // Also store by executionId for easy lookup
    this.checkpoints.set(`exec_${params.executionId}`, checkpoint)

    return checkpoint
  }

  /**
   * Get the latest checkpoint for an execution
   */
  getCheckpoint(executionId: string): WorkflowCheckpoint | null {
    return this.checkpoints.get(`exec_${executionId}`) || null
  }

  /**
   * Get checkpoint by ID
   */
  getCheckpointById(checkpointId: string): WorkflowCheckpoint | null {
    return this.checkpoints.get(checkpointId) || null
  }

  /**
   * Update checkpoint status
   */
  updateCheckpoint(
    executionId: string,
    updates: Partial<Omit<WorkflowCheckpoint, 'id' | 'workflowId' | 'executionId' | 'createdAt'>>
  ): WorkflowCheckpoint | null {
    const checkpoint = this.checkpoints.get(`exec_${executionId}`)
    if (!checkpoint) return null

    const updated = {
      ...checkpoint,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.checkpoints.set(checkpoint.id, updated)
    this.checkpoints.set(`exec_${executionId}`, updated)

    return updated
  }

  /**
   * Delete checkpoint
   */
  deleteCheckpoint(executionId: string): boolean {
    const checkpoint = this.checkpoints.get(`exec_${executionId}`)
    if (!checkpoint) return false

    this.checkpoints.delete(checkpoint.id)
    this.checkpoints.delete(`exec_${executionId}`)
    return true
  }

  /**
   * Get all checkpoints
   */
  getAllCheckpoints(): WorkflowCheckpoint[] {
    const seen = new Set<string>()
    const checkpoints: WorkflowCheckpoint[] = []

    for (const checkpoint of this.checkpoints.values()) {
      if (!seen.has(checkpoint.id)) {
        seen.add(checkpoint.id)
        checkpoints.push(checkpoint)
      }
    }

    return checkpoints.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  /**
   * Clear all checkpoints
   */
  clear(): void {
    this.checkpoints.clear()
  }
}

// ============================================================================
// Error Event Logger
// ============================================================================

/**
 * Logs error events for analysis and monitoring
 */
export class ErrorEventLogger {
  private events: ErrorEvent[] = []
  private maxEvents = 1000 // Keep last 1000 events in memory

  /**
   * Log an error event
   */
  log(params: {
    error: WorkflowError
    workflowId?: string
    executionId?: string
    stepId?: string
    userId?: string
    recoveryAction: RecoveryAction['type']
    recoverySuccess: boolean
    retryAttempt: number
    totalRetries: number
    durationMs: number
    metadata?: Record<string, unknown>
  }): ErrorEvent {
    const event: ErrorEvent = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      errorCode: params.error.code,
      errorMessage: params.error.message,
      category: params.error.category,
      classification: params.error.classification,
      service: params.error.service || 'unknown',
      workflowId: params.workflowId,
      executionId: params.executionId,
      stepId: params.stepId,
      userId: params.userId,
      recoveryAction: params.recoveryAction,
      recoverySuccess: params.recoverySuccess,
      retryAttempt: params.retryAttempt,
      totalRetries: params.totalRetries,
      durationMs: params.durationMs,
      timestamp: new Date().toISOString(),
      metadata: params.metadata,
    }

    this.events.push(event)

    // Trim old events if over limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    return event
  }

  /**
   * Get error rate for a service
   */
  getErrorRate(service: string, windowMs: number = 60000): number {
    const cutoff = Date.now() - windowMs
    const serviceEvents = this.events.filter(
      (e) => e.service === service && new Date(e.timestamp).getTime() > cutoff
    )

    if (serviceEvents.length === 0) return 0

    const failures = serviceEvents.filter((e) => !e.recoverySuccess).length
    return failures / serviceEvents.length
  }

  /**
   * Get events by service
   */
  getEventsByService(service: string, limit: number = 100): ErrorEvent[] {
    return this.events
      .filter((e) => e.service === service)
      .slice(-limit)
  }

  /**
   * Get events by user
   */
  getEventsByUser(userId: string, limit: number = 100): ErrorEvent[] {
    return this.events
      .filter((e) => e.userId === userId)
      .slice(-limit)
  }

  /**
   * Get all events
   */
  getEvents(limit: number = 100): ErrorEvent[] {
    return this.events.slice(-limit)
  }

  /**
   * Get error statistics
   */
  getStats(windowMs: number = 3600000): {
    totalErrors: number
    byCategory: Record<ErrorCategory, number>
    byService: Record<string, number>
    recoveryRate: number
    avgRetries: number
  } {
    const cutoff = Date.now() - windowMs
    const recentEvents = this.events.filter(
      (e) => new Date(e.timestamp).getTime() > cutoff
    )

    const byCategory: Record<string, number> = {}
    const byService: Record<string, number> = {}
    let successCount = 0
    let totalRetries = 0

    for (const event of recentEvents) {
      byCategory[event.category] = (byCategory[event.category] || 0) + 1
      byService[event.service] = (byService[event.service] || 0) + 1

      if (event.recoverySuccess) successCount++
      totalRetries += event.retryAttempt
    }

    return {
      totalErrors: recentEvents.length,
      byCategory: byCategory as Record<ErrorCategory, number>,
      byService,
      recoveryRate: recentEvents.length > 0 ? successCount / recentEvents.length : 1,
      avgRetries: recentEvents.length > 0 ? totalRetries / recentEvents.length : 0,
    }
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = []
  }
}

// ============================================================================
// Singleton Instances
// ============================================================================

export const checkpointManager = new CheckpointManager()
export const errorEventLogger = new ErrorEventLogger()

// Circuit breaker registry for per-service instances
const circuitBreakers = new Map<string, CircuitBreaker>()

/**
 * Get or create circuit breaker for a service
 */
export function getCircuitBreaker(service: string, config?: CircuitBreakerConfig): CircuitBreaker {
  let breaker = circuitBreakers.get(service)
  if (!breaker) {
    breaker = new CircuitBreaker(service, config)
    circuitBreakers.set(service, breaker)
  }
  return breaker
}

/**
 * Reset all circuit breakers
 */
export function resetAllCircuitBreakers(): void {
  for (const breaker of circuitBreakers.values()) {
    breaker.reset()
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Execute with automatic retry
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: {
    service?: string
    config?: RetryConfig
    onRetry?: (error: WorkflowError, attempt: number, delay: number) => void
    onSuccess?: (result: T, attempts: number) => void
    onFailure?: (error: WorkflowError, attempts: number) => void
  } = {}
): Promise<T> {
  const config = options.config || DEFAULT_RETRY_CONFIG
  const service = options.service || 'unknown'
  const circuitBreaker = getCircuitBreaker(service)

  let lastError: WorkflowError | null = null
  let attempt = 0

  while (attempt <= config.maxRetries) {
    // Check circuit breaker
    const { allowed, reason } = circuitBreaker.canExecute()
    if (!allowed) {
      throw new Error(reason)
    }

    try {
      const result = await fn()
      circuitBreaker.recordSuccess()

      if (options.onSuccess) {
        options.onSuccess(result, attempt + 1)
      }

      return result
    } catch (error) {
      lastError = createWorkflowError(error, service)
      circuitBreaker.recordFailure()

      // Check if we should retry
      if (!lastError.isRetryable || attempt >= config.maxRetries) {
        if (options.onFailure) {
          options.onFailure(lastError, attempt + 1)
        }
        throw error
      }

      // Get recovery action
      const recovery = getRecoveryAction(lastError, attempt, config)

      if (recovery.type === 'abort') {
        if (options.onFailure) {
          options.onFailure(lastError, attempt + 1)
        }
        throw error
      }

      // Calculate delay
      const delay = recovery.delayMs || calculateBackoffDelay(attempt, config)

      if (options.onRetry) {
        options.onRetry(lastError, attempt + 1, delay)
      }

      await sleep(delay)
      attempt++
    }
  }

  // Should not reach here, but TypeScript needs this
  throw lastError || new Error('Retry failed without error')
}

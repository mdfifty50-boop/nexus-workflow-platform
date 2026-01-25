/**
 * Stripe Webhook Handler
 *
 * Main entry point for processing Stripe webhook events.
 *
 * Features:
 * - Webhook signature verification
 * - Event type routing to appropriate handlers
 * - Idempotency handling (prevent duplicate processing)
 * - Event logging and audit trail
 * - Error handling with retry logic
 * - Event status tracking
 */

import type {
  StripeWebhookEvent,
  EventMetadata,
  ProcessingResult,
  EventHandler,
  WebhookConfig,
  RetryConfig,
  HandlerRegistry,
  WebhookAuditLog,
  EventStorageRecord,
  ProcessingError,
} from './webhook-types'

import {
  DEFAULT_WEBHOOK_CONFIG,
  DEFAULT_RETRY_CONFIG,
  EVENT_STATUS,
  isSupportedEventType,
  getEventCategory,
} from './webhook-types'

import { subscriptionEventHandlers } from './subscription-events'
import { paymentEventHandlers } from './payment-events'
import { invoiceEventHandlers } from './invoice-events'

// =============================================================================
// IDEMPOTENCY STORE
// =============================================================================

/**
 * In-memory idempotency store
 * In production, use Redis or database for distributed systems
 */
class IdempotencyStore {
  private processedEvents: Map<string, { result: ProcessingResult; expiresAt: number }>
  private readonly ttl: number

  constructor(ttlMs: number = 24 * 60 * 60 * 1000) {
    this.processedEvents = new Map()
    this.ttl = ttlMs
  }

  /**
   * Check if event has been processed
   */
  has(eventId: string): boolean {
    const entry = this.processedEvents.get(eventId)
    if (!entry) {
      return false
    }
    if (Date.now() > entry.expiresAt) {
      this.processedEvents.delete(eventId)
      return false
    }
    return true
  }

  /**
   * Get previous result for an event
   */
  get(eventId: string): ProcessingResult | null {
    const entry = this.processedEvents.get(eventId)
    if (!entry || Date.now() > entry.expiresAt) {
      return null
    }
    return entry.result
  }

  /**
   * Store event result
   */
  set(eventId: string, result: ProcessingResult): void {
    this.processedEvents.set(eventId, {
      result,
      expiresAt: Date.now() + this.ttl,
    })
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.processedEvents.entries())
    for (const [eventId, entry] of entries) {
      if (now > entry.expiresAt) {
        this.processedEvents.delete(eventId)
      }
    }
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.processedEvents.clear()
  }
}

// =============================================================================
// EVENT LOGGER
// =============================================================================

/**
 * Webhook event logger
 */
class WebhookLogger {
  private readonly enabled: boolean
  private readonly level: 'debug' | 'info' | 'warn' | 'error'
  private readonly auditLogs: WebhookAuditLog[]

  constructor(enabled: boolean = true, level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.enabled = enabled
    this.level = level
    this.auditLogs = []
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    if (!this.enabled) return false
    const levels = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.level)
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      console.debug(`[Webhook Debug] ${message}`, data)
    }
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.info(`[Webhook] ${message}`, data)
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.warn(`[Webhook Warning] ${message}`, data)
    }
  }

  error(message: string, error?: Error | ProcessingError, data?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(`[Webhook Error] ${message}`, { error, ...data })
    }
  }

  /**
   * Record an audit log entry
   */
  audit(log: WebhookAuditLog): void {
    this.auditLogs.push(log)
    this.info(`Audit: ${log.eventType} - ${log.status}`, {
      eventId: log.eventId,
      processingTimeMs: log.processingTimeMs,
    })
  }

  /**
   * Get audit logs (for debugging/admin)
   */
  getAuditLogs(limit: number = 100): WebhookAuditLog[] {
    return this.auditLogs.slice(-limit)
  }

  /**
   * Clear audit logs
   */
  clearAuditLogs(): void {
    this.auditLogs.length = 0
  }
}

// =============================================================================
// STRIPE WEBHOOK HANDLER CLASS
// =============================================================================

/**
 * Main Stripe webhook handler class
 */
export class StripeWebhookHandler {
  private readonly config: WebhookConfig
  private readonly handlers: HandlerRegistry
  private readonly idempotencyStore: IdempotencyStore
  private readonly logger: WebhookLogger
  private readonly eventStorage: EventStorageRecord[]

  constructor(config: Partial<WebhookConfig> & { signingSecret: string }) {
    this.config = {
      ...DEFAULT_WEBHOOK_CONFIG,
      ...config,
    }

    this.handlers = new Map()
    this.idempotencyStore = new IdempotencyStore(this.config.idempotencyTtl)
    this.logger = new WebhookLogger(this.config.enableLogging, this.config.logLevel)
    this.eventStorage = []

    // Register all handlers
    this.registerHandlers()

    // Start cleanup interval
    this.startCleanupInterval()
  }

  // ===========================================================================
  // HANDLER REGISTRATION
  // ===========================================================================

  /**
   * Register all event handlers
   */
  private registerHandlers(): void {
    // Register subscription handlers
    for (const handler of subscriptionEventHandlers) {
      this.registerHandler(handler)
    }

    // Register payment handlers
    for (const handler of paymentEventHandlers) {
      this.registerHandler(handler)
    }

    // Register invoice handlers
    for (const handler of invoiceEventHandlers) {
      this.registerHandler(handler)
    }

    this.logger.info('Handlers registered', {
      totalTypes: this.handlers.size,
      handlers: Array.from(this.handlers.keys()),
    })
  }

  /**
   * Register a single event handler
   */
  registerHandler<T, R>(handler: EventHandler<T, R>): void {
    if (!handler.enabled) {
      return
    }

    const existing = this.handlers.get(handler.eventType) || []
    existing.push(handler as EventHandler)
    existing.sort((a, b) => b.priority - a.priority) // Higher priority first
    this.handlers.set(handler.eventType, existing)
  }

  /**
   * Unregister a handler for an event type
   */
  unregisterHandler(eventType: string): void {
    this.handlers.delete(eventType)
  }

  // ===========================================================================
  // SIGNATURE VERIFICATION
  // ===========================================================================

  /**
   * Verify Stripe webhook signature
   *
   * @param payload - Raw request body
   * @param signature - Stripe-Signature header value
   * @returns Whether the signature is valid
   */
  verifySignature(payload: string, signature: string): boolean {
    if (!this.config.verifySignature) {
      return true
    }

    if (this.config.testMode) {
      return true
    }

    try {
      // Parse the signature header
      const signatureParts = signature.split(',')
      const signatureMap: Record<string, string> = {}

      for (const part of signatureParts) {
        const [key, value] = part.split('=')
        signatureMap[key] = value
      }

      const timestamp = signatureMap['t']
      const expectedSignature = signatureMap['v1']

      if (!timestamp || !expectedSignature) {
        this.logger.warn('Invalid signature format')
        return false
      }

      // Check timestamp tolerance
      const timestampSeconds = parseInt(timestamp, 10)
      const currentSeconds = Math.floor(Date.now() / 1000)

      if (Math.abs(currentSeconds - timestampSeconds) > this.config.timestampTolerance) {
        this.logger.warn('Timestamp outside tolerance', {
          timestamp: timestampSeconds,
          current: currentSeconds,
          tolerance: this.config.timestampTolerance,
        })
        return false
      }

      // Compute expected signature
      const signedPayload = `${timestamp}.${payload}`
      const computedSignature = this.computeSignature(signedPayload)

      // Compare signatures (timing-safe comparison)
      return this.secureCompare(computedSignature, expectedSignature)
    } catch (error) {
      this.logger.error('Signature verification error', error instanceof Error ? error : undefined)
      return false
    }
  }

  /**
   * Compute HMAC-SHA256 signature
   */
  private computeSignature(payload: string): string {
    // In browser environment, we'd use SubtleCrypto
    // For server-side Node.js, use crypto module
    // This is a placeholder - actual implementation depends on environment

    // For browser:
    // const encoder = new TextEncoder()
    // const key = await crypto.subtle.importKey(...)
    // const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))

    // For now, return a placeholder that indicates this needs server-side implementation
    console.warn('[Webhook] Signature computation requires server-side crypto module')
    return payload // This should be replaced with actual HMAC computation
  }

  /**
   * Timing-safe string comparison
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }

  // ===========================================================================
  // EVENT PROCESSING
  // ===========================================================================

  /**
   * Process a webhook event
   *
   * Main entry point for handling incoming webhook events.
   *
   * @param payload - Raw request body (JSON string)
   * @param signature - Stripe-Signature header value
   * @returns Processing result
   */
  async processEvent(payload: string, signature?: string): Promise<ProcessingResult> {
    const startTime = Date.now()
    let event: StripeWebhookEvent

    // Parse the payload
    try {
      event = JSON.parse(payload) as StripeWebhookEvent
    } catch {
      return this.createFailureResult(
        'unknown',
        'unknown',
        'INVALID_PAYLOAD',
        'Failed to parse webhook payload',
        false,
        startTime
      )
    }

    // Verify signature if required
    if (signature && !this.verifySignature(payload, signature)) {
      this.logger.warn('Invalid webhook signature', { eventId: event.id })
      return this.createFailureResult(
        event.id,
        event.type,
        'INVALID_SIGNATURE',
        'Webhook signature verification failed',
        false,
        startTime
      )
    }

    // Create event metadata
    const metadata: EventMetadata = {
      eventId: event.id,
      eventType: event.type,
      receivedAt: new Date(),
      attempts: 1,
      source: this.config.testMode ? 'test' : 'stripe',
      environment: event.livemode ? 'live' : 'test',
      idempotencyKey: event.request?.idempotencyKey || undefined,
      correlationId: `wh_${event.id}_${Date.now()}`,
    }

    this.logger.debug('Processing event', {
      eventId: event.id,
      eventType: event.type,
      livemode: event.livemode,
    })

    // Check idempotency
    if (this.config.enableIdempotency && this.idempotencyStore.has(event.id)) {
      const previousResult = this.idempotencyStore.get(event.id)
      if (previousResult) {
        this.logger.info('Event already processed (idempotent)', { eventId: event.id })
        return {
          ...previousResult,
          message: `Event already processed: ${previousResult.message}`,
        }
      }
    }

    // Store event if persistence is enabled
    if (this.config.persistEvents) {
      this.storeEvent(event, payload, signature)
    }

    // Get handlers for this event type
    const handlers = this.handlers.get(event.type)

    if (!handlers || handlers.length === 0) {
      // Check if it's a supported but unhandled event type
      if (isSupportedEventType(event.type)) {
        this.logger.warn('No handlers registered for supported event type', {
          eventType: event.type,
        })
      } else {
        this.logger.debug('Unsupported event type', { eventType: event.type })
      }

      const result = this.createSkippedResult(event, metadata, startTime)
      this.idempotencyStore.set(event.id, result)
      return result
    }

    // Execute handlers
    const result = await this.executeHandlers(event, handlers, metadata)

    // Store result for idempotency
    if (this.config.enableIdempotency) {
      this.idempotencyStore.set(event.id, result)
    }

    // Record audit log
    this.logger.audit({
      id: metadata.correlationId!,
      eventId: event.id,
      eventType: event.type,
      timestamp: new Date(),
      status: result.status,
      processingTimeMs: Date.now() - startTime,
      attempts: metadata.attempts,
      error: result.error,
    })

    return result
  }

  /**
   * Execute handlers for an event
   */
  private async executeHandlers(
    event: StripeWebhookEvent,
    handlers: EventHandler[],
    metadata: EventMetadata
  ): Promise<ProcessingResult> {
    const startTime = Date.now()

    for (const handler of handlers) {
      try {
        // Apply timeout
        const timeout = handler.timeout || this.config.handlerTimeout
        const result = await this.withTimeout(
          handler.handler(event, metadata),
          timeout
        )

        if (result.success) {
          this.logger.info('Event processed successfully', {
            eventId: event.id,
            eventType: event.type,
            processingTimeMs: Date.now() - startTime,
          })
          return result
        }

        // Handler returned failure - check if retryable
        if (result.shouldRetry) {
          this.logger.warn('Handler returned failure, may retry', {
            eventId: event.id,
            error: result.error,
          })
        }

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const isTimeout = errorMessage.includes('timeout')

        this.logger.error('Handler execution failed', error instanceof Error ? error : undefined, {
          eventId: event.id,
          eventType: event.type,
          handler: handler.eventType,
        })

        // Determine if error is retryable
        const retryConfig = handler.retryConfig || this.config.defaultRetryConfig
        const isRetryable = this.isRetryableError(errorMessage, retryConfig)

        return {
          success: false,
          eventId: event.id,
          eventType: event.type,
          status: EVENT_STATUS.FAILED,
          error: {
            code: isTimeout ? 'TIMEOUT' : 'HANDLER_ERROR',
            message: errorMessage,
            recoverable: isRetryable,
          },
          metadata: {
            ...metadata,
            processedAt: new Date(),
            processingTimeMs: Date.now() - startTime,
          },
          shouldRetry: isRetryable,
          retryAfterMs: isRetryable ? this.calculateRetryDelay(metadata.attempts, retryConfig) : undefined,
        }
      }
    }

    // No handler succeeded
    return this.createFailureResult(
      event.id,
      event.type,
      'NO_HANDLER_SUCCEEDED',
      'All handlers failed to process event',
      true,
      startTime
    )
  }

  /**
   * Apply timeout to a promise
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Handler timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      promise
        .then((result) => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch((error) => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(errorMessage: string, config: RetryConfig): boolean {
    const message = errorMessage.toLowerCase()

    for (const code of config.retryableErrors) {
      if (message.includes(code.toLowerCase())) {
        return true
      }
    }

    // Also check for common transient errors
    const transientPatterns = [
      'timeout',
      'network',
      'connection',
      'econnreset',
      'econnrefused',
      'service unavailable',
      '503',
      '502',
      '504',
    ]

    return transientPatterns.some((pattern) => message.includes(pattern))
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attemptNumber: number, config: RetryConfig): number {
    const baseDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber - 1)
    const cappedDelay = Math.min(baseDelay, config.maxDelayMs)

    // Add jitter
    const jitter = cappedDelay * config.jitterFactor * Math.random()
    return Math.floor(cappedDelay + jitter)
  }

  // ===========================================================================
  // RESULT HELPERS
  // ===========================================================================

  /**
   * Create a failure result
   */
  private createFailureResult(
    eventId: string,
    eventType: string,
    code: string,
    message: string,
    recoverable: boolean,
    startTime: number
  ): ProcessingResult {
    return {
      success: false,
      eventId,
      eventType,
      status: EVENT_STATUS.FAILED,
      error: {
        code,
        message,
        recoverable,
      },
      metadata: {
        eventId,
        eventType,
        receivedAt: new Date(startTime),
        processedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
        attempts: 1,
        source: 'stripe',
        environment: 'test',
      },
      shouldRetry: recoverable,
    }
  }

  /**
   * Create a skipped result for unsupported events
   */
  private createSkippedResult(
    event: StripeWebhookEvent,
    metadata: EventMetadata,
    startTime: number
  ): ProcessingResult {
    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.SKIPPED,
      message: `Event type ${event.type} is not handled`,
      metadata: {
        ...metadata,
        processedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      },
    }
  }

  // ===========================================================================
  // EVENT STORAGE
  // ===========================================================================

  /**
   * Store event for persistence
   */
  private storeEvent(event: StripeWebhookEvent, payload: string, signature?: string): void {
    const record: EventStorageRecord = {
      id: `evt_${event.id}_${Date.now()}`,
      eventId: event.id,
      eventType: event.type,
      payload,
      signature,
      receivedAt: new Date(),
      status: EVENT_STATUS.PENDING,
      attempts: 0,
    }

    this.eventStorage.push(record)

    // TODO: In production, persist to database
    // await database.webhookEvents.create(record)
  }

  /**
   * Update stored event status
   */
  updateEventStatus(eventId: string, status: string, error?: string): void {
    const record = this.eventStorage.find((e) => e.eventId === eventId)
    if (record) {
      record.status = status as typeof EVENT_STATUS[keyof typeof EVENT_STATUS]
      record.processedAt = new Date()
      record.lastError = error
      record.attempts += 1
    }
  }

  /**
   * Get stored events (for debugging/admin)
   */
  getStoredEvents(limit: number = 100): EventStorageRecord[] {
    return this.eventStorage.slice(-limit)
  }

  // ===========================================================================
  // MAINTENANCE
  // ===========================================================================

  /**
   * Start cleanup interval for expired idempotency entries
   */
  private startCleanupInterval(): void {
    // Clean up every hour
    setInterval(() => {
      this.idempotencyStore.cleanup()
      this.logger.debug('Idempotency store cleanup completed')
    }, 60 * 60 * 1000)
  }

  /**
   * Get handler statistics
   */
  getHandlerStats(): Record<string, { handlerCount: number; category: string | null }> {
    const stats: Record<string, { handlerCount: number; category: string | null }> = {}

    const entries = Array.from(this.handlers.entries())
    for (const [eventType, handlers] of entries) {
      stats[eventType] = {
        handlerCount: handlers.length,
        category: getEventCategory(eventType),
      }
    }

    return stats
  }

  /**
   * Check handler health
   */
  isHealthy(): boolean {
    return this.handlers.size > 0
  }

  /**
   * Get configuration (without sensitive data)
   */
  getConfig(): Omit<WebhookConfig, 'signingSecret'> {
    const config = { ...this.config }
    // Remove sensitive data
    const { signingSecret: _signingSecret, ...safeConfig } = config
    void _signingSecret
    return safeConfig
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a configured webhook handler instance
 */
export function createWebhookHandler(
  signingSecret: string,
  options?: Partial<Omit<WebhookConfig, 'signingSecret'>>
): StripeWebhookHandler {
  return new StripeWebhookHandler({
    signingSecret,
    ...options,
  })
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let webhookHandlerInstance: StripeWebhookHandler | null = null

/**
 * Get or create the webhook handler singleton
 */
export function getWebhookHandler(signingSecret?: string): StripeWebhookHandler {
  if (!webhookHandlerInstance) {
    // Access environment variable safely for both browser and server
    let envSecret = ''
    try {
      // Vite environment
      if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env) {
        envSecret = (import.meta as unknown as { env: Record<string, string> }).env.VITE_STRIPE_WEBHOOK_SECRET || ''
      }
    } catch {
      // Fallback for non-Vite environments
      envSecret = ''
    }

    const secret = signingSecret || envSecret

    if (!secret) {
      console.warn('[Webhook] No signing secret provided. Signature verification will be disabled.')
    }

    webhookHandlerInstance = createWebhookHandler(secret, {
      verifySignature: !!secret,
    })
  }

  return webhookHandlerInstance
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  IdempotencyStore,
  WebhookLogger,
  DEFAULT_WEBHOOK_CONFIG,
  DEFAULT_RETRY_CONFIG,
}

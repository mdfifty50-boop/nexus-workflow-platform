/**
 * Retry Helper for Transient Failure Recovery
 *
 * Provides exponential backoff retry logic for API calls and async operations.
 * Used by api-client.ts and can be used independently for any async operation.
 */

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number
  /** Base delay in milliseconds (default: 1000 = 1s) */
  baseDelay: number
  /** Maximum delay cap in milliseconds (default: 10000 = 10s) */
  maxDelay: number
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier: number
  /** Whether to add jitter to prevent thundering herd (default: true) */
  useJitter: boolean
  /** Custom retry condition function */
  shouldRetry?: (error: Error, attempt: number) => boolean
  /** Callback fired before each retry attempt */
  onRetry?: (error: Error, attempt: number, delayMs: number) => void
}

/**
 * Default retry configuration with exponential backoff (1s, 2s, 4s)
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,     // 1 second
  maxDelay: 10000,     // 10 seconds
  backoffMultiplier: 2,
  useJitter: true,
}

/**
 * Error types that are typically retryable
 */
export type RetryableErrorType =
  | 'network'
  | 'timeout'
  | 'server_error'
  | 'rate_limit'
  | 'temporary'

/**
 * Extended error with retry metadata
 */
export class RetryableError extends Error {
  readonly isRetryable: boolean
  readonly errorType: RetryableErrorType
  readonly statusCode?: number
  readonly retryAfter?: number // Suggested retry delay in ms

  constructor(
    message: string,
    isRetryable: boolean = false,
    errorType: RetryableErrorType = 'temporary',
    statusCode?: number,
    retryAfter?: number
  ) {
    super(message)
    this.name = 'RetryableError'
    this.isRetryable = isRetryable
    this.errorType = errorType
    this.statusCode = statusCode
    this.retryAfter = retryAfter
  }

  /**
   * Create error from HTTP response
   */
  static fromResponse(response: Response, message?: string): RetryableError {
    const status = response.status
    let errorType: RetryableErrorType = 'temporary'
    let isRetryable = false
    let retryAfter: number | undefined

    if (status >= 500) {
      errorType = 'server_error'
      isRetryable = true
    } else if (status === 429) {
      errorType = 'rate_limit'
      isRetryable = true
      const retryHeader = response.headers.get('Retry-After')
      if (retryHeader) {
        retryAfter = parseInt(retryHeader, 10) * 1000
      }
    } else if (status === 408 || status === 504) {
      errorType = 'timeout'
      isRetryable = true
    }

    return new RetryableError(
      message || `HTTP ${status} error`,
      isRetryable,
      errorType,
      status,
      retryAfter
    )
  }

  /**
   * Create error from network failure
   */
  static networkError(originalError?: Error): RetryableError {
    return new RetryableError(
      originalError?.message || 'Network connection failed',
      true,
      'network'
    )
  }

  /**
   * Create error from timeout
   */
  static timeoutError(): RetryableError {
    return new RetryableError(
      'Request timed out',
      true,
      'timeout'
    )
  }
}

/**
 * Calculate delay for exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number,
  config: Partial<RetryConfig> = {}
): number {
  const {
    baseDelay = DEFAULT_RETRY_CONFIG.baseDelay,
    maxDelay = DEFAULT_RETRY_CONFIG.maxDelay,
    backoffMultiplier = DEFAULT_RETRY_CONFIG.backoffMultiplier,
    useJitter = DEFAULT_RETRY_CONFIG.useJitter,
  } = config

  // Exponential backoff: baseDelay * (multiplier ^ attempt)
  let delay = baseDelay * Math.pow(backoffMultiplier, attempt)

  // Add jitter (0-50% of delay) to prevent thundering herd
  if (useJitter) {
    const jitter = Math.random() * 0.5 * delay
    delay += jitter
  }

  // Cap at maximum delay
  return Math.min(delay, maxDelay)
}

/**
 * Check if an error should trigger a retry
 */
export function isRetryableError(error: unknown): boolean {
  // RetryableError with explicit flag
  if (error instanceof RetryableError) {
    return error.isRetryable
  }

  // Check for network-related errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    const retryablePatterns = [
      'network',
      'timeout',
      'econnreset',
      'econnrefused',
      'epipe',
      'socket',
      'fetch failed',
      'failed to fetch',
      'load failed',
      'aborted',
    ]

    return retryablePatterns.some(pattern => message.includes(pattern))
  }

  return false
}

/**
 * Sleep for specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Execute an async function with retry logic
 *
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @returns Promise that resolves with the function result or rejects after all retries
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxRetries: 3, baseDelay: 1000 }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const mergedConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  const { maxRetries, shouldRetry, onRetry } = mergedConfig

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if we should retry
      const canRetry = attempt < maxRetries
      const willRetry = canRetry && (
        shouldRetry
          ? shouldRetry(lastError, attempt)
          : isRetryableError(lastError)
      )

      if (!willRetry) {
        throw lastError
      }

      // Calculate delay
      let delay = calculateBackoffDelay(attempt, mergedConfig)

      // Use server-provided retry delay if available
      if (lastError instanceof RetryableError && lastError.retryAfter) {
        delay = Math.min(lastError.retryAfter, mergedConfig.maxDelay)
      }

      // Fire retry callback
      if (onRetry) {
        onRetry(lastError, attempt + 1, delay)
      }

      // Wait before retrying
      await sleep(delay)
    }
  }

  // Should not reach here, but TypeScript needs this
  throw lastError || new Error('Retry failed without error')
}

/**
 * Create a retry wrapper for a function
 *
 * @param config - Retry configuration to use for all calls
 * @returns A function that wraps any async function with retry logic
 *
 * @example
 * ```ts
 * const retryWrapper = createRetryWrapper({ maxRetries: 3 })
 * const result = await retryWrapper(() => fetchData())
 * ```
 */
export function createRetryWrapper(config: Partial<RetryConfig> = {}) {
  return <T>(fn: () => Promise<T>): Promise<T> => {
    return withRetry(fn, config)
  }
}

/**
 * Decorator-style retry function for methods
 *
 * @param config - Retry configuration
 * @returns Higher-order function that adds retry logic
 *
 * @example
 * ```ts
 * const fetchWithRetry = withRetryDecorator({ maxRetries: 3 })(
 *   async (url: string) => fetch(url).then(r => r.json())
 * )
 * ```
 */
export function withRetryDecorator<Args extends unknown[], T>(
  config: Partial<RetryConfig> = {}
) {
  return (fn: (...args: Args) => Promise<T>) => {
    return (...args: Args): Promise<T> => {
      return withRetry(() => fn(...args), config)
    }
  }
}

/**
 * Retry with progressive timeout increase
 *
 * @param fn - Function that accepts a timeout parameter
 * @param initialTimeout - Starting timeout in ms
 * @param config - Retry configuration
 */
export async function withRetryAndTimeout<T>(
  fn: (timeoutMs: number) => Promise<T>,
  initialTimeout: number = 5000,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const mergedConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let timeout = initialTimeout

  return withRetry(
    async () => {
      try {
        return await fn(timeout)
      } finally {
        // Increase timeout for next attempt
        timeout = Math.min(timeout * 1.5, 60000)
      }
    },
    mergedConfig
  )
}

/**
 * Circuit breaker state for preventing cascading failures
 */
interface CircuitBreakerState {
  failures: number
  lastFailure: number
  isOpen: boolean
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number
  /** Time in ms before attempting to close circuit */
  resetTimeout: number
}

const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30000,
}

/**
 * Create a circuit breaker wrapper for retry logic
 *
 * Prevents repeated calls to failing services by "opening" the circuit
 * after a threshold of failures, then "closing" it after a timeout.
 */
export function createCircuitBreaker(config: Partial<CircuitBreakerConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CIRCUIT_BREAKER, ...config }
  const state: CircuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    isOpen: false,
  }

  return async <T>(fn: () => Promise<T>, retryConfig?: Partial<RetryConfig>): Promise<T> => {
    // Check if circuit is open
    if (state.isOpen) {
      const timeSinceFailure = Date.now() - state.lastFailure
      if (timeSinceFailure < mergedConfig.resetTimeout) {
        throw new Error('Circuit breaker is open - service temporarily unavailable')
      }
      // Attempt to close circuit (half-open state)
      state.isOpen = false
    }

    try {
      const result = await withRetry(fn, retryConfig)
      // Success - reset failure count
      state.failures = 0
      return result
    } catch (error) {
      state.failures++
      state.lastFailure = Date.now()

      if (state.failures >= mergedConfig.failureThreshold) {
        state.isOpen = true
      }

      throw error
    }
  }
}

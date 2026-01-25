/**
 * Client-Side Rate Limiter
 * Implements token bucket algorithm to prevent rapid-fire API calls
 */

interface RateLimiterConfig {
  /** Maximum number of tokens (requests) in the bucket */
  maxTokens: number
  /** Number of tokens added per interval */
  refillRate: number
  /** Interval in milliseconds for token refill */
  refillInterval: number
  /** Optional: Name for this limiter (for debugging) */
  name?: string
}

interface TokenBucket {
  tokens: number
  lastRefill: number
}

/**
 * Token Bucket Rate Limiter
 * Allows burst requests up to maxTokens, then rate limits to refillRate per interval
 */
export class RateLimiter {
  private config: RateLimiterConfig
  private bucket: TokenBucket
  private queue: Array<{
    resolve: (value: void) => void
    reject: (reason: Error) => void
    timestamp: number
  }> = []
  private processing = false

  constructor(config: RateLimiterConfig) {
    this.config = {
      name: 'default',
      ...config,
    }
    this.bucket = {
      tokens: config.maxTokens,
      lastRefill: Date.now(),
    }
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.bucket.lastRefill
    const intervalsElapsed = Math.floor(elapsed / this.config.refillInterval)

    if (intervalsElapsed > 0) {
      const tokensToAdd = intervalsElapsed * this.config.refillRate
      this.bucket.tokens = Math.min(
        this.config.maxTokens,
        this.bucket.tokens + tokensToAdd
      )
      this.bucket.lastRefill = now - (elapsed % this.config.refillInterval)
    }
  }

  /**
   * Try to consume a token, returns true if successful
   */
  private tryConsume(): boolean {
    this.refill()

    if (this.bucket.tokens >= 1) {
      this.bucket.tokens -= 1
      return true
    }

    return false
  }

  /**
   * Calculate time until next token is available
   */
  private getWaitTime(): number {
    this.refill()

    if (this.bucket.tokens >= 1) {
      return 0
    }

    const elapsed = Date.now() - this.bucket.lastRefill
    const timeUntilRefill = this.config.refillInterval - elapsed
    return Math.max(0, timeUntilRefill)
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      const waitTime = this.getWaitTime()

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }

      if (this.tryConsume()) {
        const request = this.queue.shift()
        if (request) {
          request.resolve()
        }
      }
    }

    this.processing = false
  }

  /**
   * Acquire a token, waiting if necessary
   * @param timeout Maximum time to wait in milliseconds (default: 30000)
   * @throws Error if timeout exceeded
   */
  async acquire(timeout = 30000): Promise<void> {
    // Try to consume immediately
    if (this.tryConsume()) {
      return
    }

    // Queue the request
    return new Promise((resolve, reject) => {
      const request = {
        resolve,
        reject,
        timestamp: Date.now(),
      }

      // Set up timeout
      const timeoutId = setTimeout(() => {
        const index = this.queue.indexOf(request)
        if (index !== -1) {
          this.queue.splice(index, 1)
          reject(new RateLimitError(`Rate limit timeout after ${timeout}ms`, this.config.name))
        }
      }, timeout)

      // Modify resolve to clear timeout
      const originalResolve = resolve
      request.resolve = () => {
        clearTimeout(timeoutId)
        originalResolve()
      }

      this.queue.push(request)
      this.processQueue()
    })
  }

  /**
   * Try to acquire a token without waiting
   * @returns true if token was acquired, false if rate limited
   */
  tryAcquire(): boolean {
    return this.tryConsume()
  }

  /**
   * Check if a request would be rate limited
   */
  wouldLimit(): boolean {
    this.refill()
    return this.bucket.tokens < 1
  }

  /**
   * Get current status
   */
  getStatus(): {
    availableTokens: number
    maxTokens: number
    queueLength: number
    waitTime: number
    name: string
  } {
    this.refill()
    return {
      availableTokens: Math.floor(this.bucket.tokens),
      maxTokens: this.config.maxTokens,
      queueLength: this.queue.length,
      waitTime: this.getWaitTime(),
      name: this.config.name || 'default',
    }
  }

  /**
   * Reset the rate limiter (refill all tokens)
   */
  reset(): void {
    this.bucket.tokens = this.config.maxTokens
    this.bucket.lastRefill = Date.now()
  }
}

/**
 * Custom error for rate limiting
 */
export class RateLimitError extends Error {
  readonly limiterName: string

  constructor(message: string, limiterName?: string) {
    super(message)
    this.name = 'RateLimitError'
    this.limiterName = limiterName || 'default'
  }
}

// Pre-configured rate limiters for common use cases

/**
 * Rate limiter for general API calls
 * 10 requests burst, refills 2 per second
 */
export const apiRateLimiter = new RateLimiter({
  name: 'api',
  maxTokens: 10,
  refillRate: 2,
  refillInterval: 1000, // 1 second
})

/**
 * Rate limiter for AI/chat calls (more restrictive)
 * 5 requests burst, refills 1 per 2 seconds
 */
export const aiRateLimiter = new RateLimiter({
  name: 'ai',
  maxTokens: 5,
  refillRate: 1,
  refillInterval: 2000, // 2 seconds
})

/**
 * Rate limiter for search operations
 * 20 requests burst, refills 5 per second
 */
export const searchRateLimiter = new RateLimiter({
  name: 'search',
  maxTokens: 20,
  refillRate: 5,
  refillInterval: 1000, // 1 second
})

/**
 * Rate limiter for form submissions (very restrictive)
 * 3 requests burst, refills 1 per 5 seconds
 */
export const formRateLimiter = new RateLimiter({
  name: 'form',
  maxTokens: 3,
  refillRate: 1,
  refillInterval: 5000, // 5 seconds
})

/**
 * HOC to wrap async functions with rate limiting
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  limiter: RateLimiter = apiRateLimiter
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    await limiter.acquire()
    return fn(...args) as ReturnType<T>
  }) as T
}

/**
 * Create a rate-limited version of a function
 */
export function createRateLimitedFn<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  config: RateLimiterConfig
): (...args: T) => Promise<R> {
  const limiter = new RateLimiter(config)

  return async (...args: T): Promise<R> => {
    await limiter.acquire()
    return fn(...args)
  }
}

/**
 * Decorator for rate limiting class methods
 * Usage: @rateLimit(apiRateLimiter)
 */
export function rateLimit(limiter: RateLimiter = apiRateLimiter) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      await limiter.acquire()
      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

/**
 * React hook for rate limiting (can be used with useCallback)
 */
export function useRateLimiter(
  limiter: RateLimiter = apiRateLimiter
): {
  canProceed: () => boolean
  waitAndProceed: () => Promise<void>
  status: () => ReturnType<RateLimiter['getStatus']>
} {
  return {
    canProceed: () => !limiter.wouldLimit(),
    waitAndProceed: () => limiter.acquire(),
    status: () => limiter.getStatus(),
  }
}

/**
 * Batch API Client
 *
 * Queues multiple API calls and processes them together to reduce network overhead.
 * Supports automatic batching, debouncing, and retry logic.
 */

import { APIError } from './api-client'

// Types
interface QueuedRequest<T = unknown> {
  id: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  priority: 'high' | 'normal' | 'low'
  resolve: (value: T) => void
  reject: (error: Error) => void
  timestamp: number
  retries: number
  maxRetries: number
}

interface BatchResult<T = unknown> {
  id: string
  success: boolean
  data?: T
  error?: string
}

interface BatchOptions {
  /** Maximum number of requests to batch together (default: 10) */
  maxBatchSize?: number
  /** Maximum time to wait before processing batch in ms (default: 50) */
  maxWaitTime?: number
  /** Whether to deduplicate identical GET requests (default: true) */
  deduplicateGets?: boolean
  /** Maximum retries for failed requests (default: 2) */
  maxRetries?: number
  /** Priority queue: high priority requests processed first */
  usePriorityQueue?: boolean
}

interface BatchRequestOptions {
  priority?: 'high' | 'normal' | 'low'
  skipBatch?: boolean // Execute immediately without batching
  maxRetries?: number
}

// Generate unique request ID
let requestIdCounter = 0
function generateRequestId(): string {
  return `req_${Date.now()}_${++requestIdCounter}`
}

/**
 * BatchAPIClient - Queues and batches API requests for efficiency
 */
class BatchAPIClient {
  private queue: QueuedRequest[] = []
  private batchTimer: ReturnType<typeof setTimeout> | null = null
  private processing = false
  private options: Required<BatchOptions>
  private requestCache = new Map<string, { data: unknown; timestamp: number }>()
  private cacheMaxAge = 5000 // 5 seconds cache for GET requests

  constructor(options: BatchOptions = {}) {
    this.options = {
      maxBatchSize: options.maxBatchSize ?? 10,
      maxWaitTime: options.maxWaitTime ?? 50,
      deduplicateGets: options.deduplicateGets ?? true,
      maxRetries: options.maxRetries ?? 2,
      usePriorityQueue: options.usePriorityQueue ?? true
    }
  }

  /**
   * Add a request to the batch queue
   */
  private enqueue<T>(
    endpoint: string,
    method: QueuedRequest['method'],
    body?: unknown,
    options: BatchRequestOptions = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: generateRequestId(),
        endpoint,
        method,
        body,
        priority: options.priority ?? 'normal',
        resolve: resolve as (value: unknown) => void,
        reject,
        timestamp: Date.now(),
        retries: 0,
        maxRetries: options.maxRetries ?? this.options.maxRetries
      }

      // Check cache for GET requests
      if (method === 'GET' && this.options.deduplicateGets) {
        const cacheKey = this.getCacheKey(endpoint, method, body)
        const cached = this.requestCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
          resolve(cached.data as T)
          return
        }
      }

      // Skip batch if requested
      if (options.skipBatch) {
        this.executeImmediate(request)
        return
      }

      this.queue.push(request as QueuedRequest)
      this.scheduleBatch()
    })
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatch(): void {
    if (this.batchTimer) return

    // Process immediately if batch is full
    if (this.queue.length >= this.options.maxBatchSize) {
      this.processBatch()
      return
    }

    // Otherwise wait for more requests
    this.batchTimer = setTimeout(() => {
      this.batchTimer = null
      this.processBatch()
    }, this.options.maxWaitTime)
  }

  /**
   * Process queued requests as a batch
   */
  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    // Sort by priority if enabled
    if (this.options.usePriorityQueue) {
      this.queue.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
    }

    // Take batch from queue
    const batch = this.queue.splice(0, this.options.maxBatchSize)

    // Deduplicate GET requests
    const uniqueBatch = this.options.deduplicateGets
      ? this.deduplicateRequests(batch)
      : batch

    try {
      // Try to use batch endpoint if available
      const results = await this.executeBatch(uniqueBatch)
      this.handleBatchResults(batch, results)
    } catch (error) {
      // If batch endpoint fails, execute individually
      console.warn('[BatchAPI] Batch endpoint failed, falling back to individual requests')
      await this.executeIndividually(batch)
    }

    this.processing = false

    // Process remaining queue
    if (this.queue.length > 0) {
      this.scheduleBatch()
    }
  }

  /**
   * Execute batch via batch endpoint
   */
  private async executeBatch(requests: QueuedRequest[]): Promise<BatchResult[]> {
    // Check if batch endpoint is available
    const batchEndpoint = '/api/batch'

    try {
      const response = await fetch(batchEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: requests.map(r => ({
            id: r.id,
            endpoint: r.endpoint,
            method: r.method,
            body: r.body
          }))
        })
      })

      if (!response.ok) {
        throw new Error(`Batch endpoint returned ${response.status}`)
      }

      const data = await response.json()
      return data.results || []
    } catch {
      // Batch endpoint not available, fall back to individual
      throw new Error('Batch endpoint not available')
    }
  }

  /**
   * Execute requests individually (fallback)
   */
  private async executeIndividually(requests: QueuedRequest[]): Promise<void> {
    await Promise.all(
      requests.map(request => this.executeImmediate(request))
    )
  }

  /**
   * Execute a single request immediately
   */
  private async executeImmediate<T>(request: QueuedRequest<T>): Promise<void> {
    try {
      const response = await fetch(`/api${request.endpoint}`, {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
        body: request.body ? JSON.stringify(request.body) : undefined
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw APIError.fromResponse(response, errorData)
      }

      const data = await response.json()

      // Cache GET requests
      if (request.method === 'GET' && this.options.deduplicateGets) {
        const cacheKey = this.getCacheKey(request.endpoint, request.method, request.body)
        this.requestCache.set(cacheKey, { data, timestamp: Date.now() })
      }

      request.resolve(data)
    } catch (error) {
      // Retry logic
      if (
        request.retries < request.maxRetries &&
        error instanceof APIError &&
        error.retryable
      ) {
        request.retries++
        const delay = Math.min(1000 * Math.pow(2, request.retries), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.executeImmediate(request)
      }

      request.reject(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Handle batch results and resolve/reject promises
   */
  private handleBatchResults(requests: QueuedRequest[], results: BatchResult[]): void {
    const resultMap = new Map(results.map(r => [r.id, r]))

    for (const request of requests) {
      const result = resultMap.get(request.id)

      if (!result) {
        // Request not in results, retry individually
        this.executeImmediate(request)
        continue
      }

      if (result.success) {
        // Cache successful GET requests
        if (request.method === 'GET' && this.options.deduplicateGets) {
          const cacheKey = this.getCacheKey(request.endpoint, request.method, request.body)
          this.requestCache.set(cacheKey, { data: result.data, timestamp: Date.now() })
        }
        request.resolve(result.data)
      } else {
        request.reject(new Error(result.error || 'Request failed'))
      }
    }
  }

  /**
   * Deduplicate identical GET requests
   */
  private deduplicateRequests(requests: QueuedRequest[]): QueuedRequest[] {
    const seen = new Map<string, QueuedRequest>()
    const duplicates = new Map<string, QueuedRequest[]>()

    for (const request of requests) {
      if (request.method !== 'GET') {
        seen.set(request.id, request)
        continue
      }

      const key = this.getCacheKey(request.endpoint, request.method, request.body)

      if (seen.has(key)) {
        // Track duplicate to resolve with same result
        if (!duplicates.has(key)) {
          duplicates.set(key, [])
        }
        duplicates.get(key)!.push(request)
      } else {
        seen.set(key, request)
      }
    }

    // For duplicates, chain their resolution to the original
    for (const [key, dups] of duplicates) {
      const original = seen.get(key)!
      const originalResolve = original.resolve
      const originalReject = original.reject

      original.resolve = (value: unknown) => {
        originalResolve(value)
        dups.forEach(d => d.resolve(value))
      }

      original.reject = (error: Error) => {
        originalReject(error)
        dups.forEach(d => d.reject(error))
      }
    }

    return Array.from(seen.values())
  }

  /**
   * Generate cache key for deduplication
   */
  private getCacheKey(endpoint: string, method: string, body?: unknown): string {
    return `${method}:${endpoint}:${body ? JSON.stringify(body) : ''}`
  }

  /**
   * Clear the request cache
   */
  clearCache(): void {
    this.requestCache.clear()
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length
  }

  /**
   * Flush queue immediately (process all pending requests)
   */
  async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    await this.processBatch()
  }

  // Convenience methods

  /**
   * Batched GET request
   */
  get<T = unknown>(endpoint: string, options?: BatchRequestOptions): Promise<T> {
    return this.enqueue<T>(endpoint, 'GET', undefined, options)
  }

  /**
   * Batched POST request
   */
  post<T = unknown>(endpoint: string, body?: unknown, options?: BatchRequestOptions): Promise<T> {
    return this.enqueue<T>(endpoint, 'POST', body, options)
  }

  /**
   * Batched PUT request
   */
  put<T = unknown>(endpoint: string, body?: unknown, options?: BatchRequestOptions): Promise<T> {
    return this.enqueue<T>(endpoint, 'PUT', body, options)
  }

  /**
   * Batched PATCH request
   */
  patch<T = unknown>(endpoint: string, body?: unknown, options?: BatchRequestOptions): Promise<T> {
    return this.enqueue<T>(endpoint, 'PATCH', body, options)
  }

  /**
   * Batched DELETE request
   */
  delete<T = unknown>(endpoint: string, options?: BatchRequestOptions): Promise<T> {
    return this.enqueue<T>(endpoint, 'DELETE', undefined, options)
  }
}

// Create singleton instance
export const batchApiClient = new BatchAPIClient()

// Export class for custom instances
export { BatchAPIClient }

// Export types
export type { QueuedRequest, BatchResult, BatchOptions, BatchRequestOptions }

/**
 * Helper to batch multiple async operations
 */
export async function batchOperations<T>(
  operations: Array<() => Promise<T>>,
  options: {
    concurrency?: number
    onProgress?: (completed: number, total: number) => void
  } = {}
): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
  const { concurrency = 5, onProgress } = options
  const results: Array<{ success: boolean; result?: T; error?: Error }> = []
  let completed = 0

  const executeWithLimit = async (
    op: () => Promise<T>,
    index: number
  ): Promise<void> => {
    try {
      const result = await op()
      results[index] = { success: true, result }
    } catch (error) {
      results[index] = {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
    completed++
    onProgress?.(completed, operations.length)
  }

  // Process in chunks for controlled concurrency
  for (let i = 0; i < operations.length; i += concurrency) {
    const chunk = operations.slice(i, i + concurrency)
    await Promise.all(
      chunk.map((op, j) => executeWithLimit(op, i + j))
    )
  }

  return results
}

/**
 * Debounced API call helper
 */
export function createDebouncedApiCall<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  delay: number = 300
): (...args: Args) => Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let pendingResolve: ((value: T) => void) | null = null
  let pendingReject: ((error: Error) => void) | null = null

  return (...args: Args): Promise<T> => {
    return new Promise((resolve, reject) => {
      // Cancel previous pending call
      if (timeoutId) {
        clearTimeout(timeoutId)
        pendingReject?.(new Error('Debounced: superseded by new call'))
      }

      pendingResolve = resolve
      pendingReject = reject

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args)
          pendingResolve?.(result)
        } catch (error) {
          pendingReject?.(error instanceof Error ? error : new Error(String(error)))
        }
        timeoutId = null
        pendingResolve = null
        pendingReject = null
      }, delay)
    })
  }
}

/**
 * Throttled API call helper
 */
export function createThrottledApiCall<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  limit: number = 1000
): (...args: Args) => Promise<T> {
  let lastCall = 0
  let pendingCall: Promise<T> | null = null

  return async (...args: Args): Promise<T> => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    if (timeSinceLastCall >= limit) {
      lastCall = now
      return fn(...args)
    }

    // Return pending call if one exists
    if (pendingCall) {
      return pendingCall
    }

    // Schedule call after throttle period
    const waitTime = limit - timeSinceLastCall
    pendingCall = new Promise((resolve, reject) => {
      setTimeout(async () => {
        lastCall = Date.now()
        pendingCall = null
        try {
          resolve(await fn(...args))
        } catch (error) {
          reject(error)
        }
      }, waitTime)
    })

    return pendingCall
  }
}

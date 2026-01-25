/**
 * Request Batcher & Deduplication System
 *
 * Provides intelligent request batching, debouncing, and deduplication
 * to minimize API calls and improve performance.
 *
 * Features:
 * - Request deduplication (same request = same promise)
 * - Debouncing for rapid successive calls
 * - Priority queuing (critical vs secondary requests)
 * - Automatic request batching
 * - In-flight request tracking
 * - Cache with TTL support
 */

// Types
export type RequestPriority = 'critical' | 'high' | 'normal' | 'low'

export interface RequestConfig {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  priority?: RequestPriority
  /** Cache TTL in milliseconds. 0 = no cache */
  cacheTTL?: number
  /** Skip deduplication for this request */
  skipDedup?: boolean
  /** Custom cache key override */
  cacheKey?: string
  /** Tags for cache invalidation */
  tags?: string[]
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  tags: string[]
}

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

interface QueuedRequest<T = unknown> {
  config: RequestConfig
  resolve: (value: T) => void
  reject: (error: Error) => void
  timestamp: number
}

// Request key generation
function generateRequestKey(config: RequestConfig): string {
  if (config.cacheKey) return config.cacheKey
  const bodyStr = config.body ? JSON.stringify(config.body) : ''
  return `${config.method}:${config.endpoint}:${bodyStr}`
}

/**
 * Request Batcher - Singleton class for managing all API requests
 */
class RequestBatcher {
  private cache = new Map<string, CacheEntry<unknown>>()
  private inFlight = new Map<string, PendingRequest<unknown>>()
  private queue: QueuedRequest[] = []
  private batchTimer: ReturnType<typeof setTimeout> | null = null
  private processing = false

  // Configuration
  private readonly maxBatchSize = 10
  private readonly batchWaitTime = 50 // ms to wait for more requests
  private readonly defaultCacheTTL = 5000 // 5 seconds default cache
  private readonly inFlightTimeout = 30000 // 30 seconds for in-flight dedup

  /**
   * Execute a single request with deduplication and caching
   */
  async request<T>(config: RequestConfig): Promise<T> {
    const key = generateRequestKey(config)
    const priority = config.priority || 'normal'
    const cacheTTL = config.cacheTTL ?? this.defaultCacheTTL

    // 1. Check cache first (for GET requests with caching enabled)
    if (config.method === 'GET' && cacheTTL > 0) {
      const cached = this.cache.get(key)
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data as T
      }
    }

    // 2. Check for in-flight duplicate request
    if (!config.skipDedup) {
      const inFlight = this.inFlight.get(key)
      if (inFlight && Date.now() - inFlight.timestamp < this.inFlightTimeout) {
        return inFlight.promise as Promise<T>
      }
    }

    // 3. Create new request promise
    const requestPromise = new Promise<T>((resolve, reject) => {
      // Add to queue with priority ordering
      const queuedRequest: QueuedRequest<T> = {
        config,
        resolve: resolve as (value: unknown) => void,
        reject,
        timestamp: Date.now()
      }
      this.queue.push(queuedRequest as QueuedRequest)
      this.scheduleFlush(priority)
    })

    // Track in-flight for deduplication
    if (!config.skipDedup) {
      this.inFlight.set(key, {
        promise: requestPromise as Promise<unknown>,
        timestamp: Date.now()
      })

      // Clean up in-flight entry after completion
      requestPromise
        .finally(() => {
          this.inFlight.delete(key)
        })
        .catch(() => {}) // Prevent unhandled rejection warning
    }

    return requestPromise
  }

  /**
   * Execute multiple requests in parallel, batched efficiently
   */
  async batch<T>(configs: RequestConfig[]): Promise<T[]> {
    return Promise.all(configs.map(config => this.request<T>(config)))
  }

  /**
   * Schedule queue flush based on priority
   */
  private scheduleFlush(priority: RequestPriority): void {
    // Critical requests flush immediately
    if (priority === 'critical') {
      this.flush()
      return
    }

    // High priority gets shorter wait
    const waitTime = priority === 'high' ? 10 : this.batchWaitTime

    if (this.batchTimer) {
      // If queue is full, flush immediately
      if (this.queue.length >= this.maxBatchSize) {
        clearTimeout(this.batchTimer)
        this.batchTimer = null
        this.flush()
        return
      }
      return // Timer already set
    }

    this.batchTimer = setTimeout(() => {
      this.batchTimer = null
      this.flush()
    }, waitTime)
  }

  /**
   * Flush the queue and execute all pending requests
   */
  private async flush(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    // Sort queue by priority
    const priorityOrder: Record<RequestPriority, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3
    }

    this.queue.sort((a, b) => {
      const aPriority = a.config.priority || 'normal'
      const bPriority = b.config.priority || 'normal'
      return priorityOrder[aPriority] - priorityOrder[bPriority]
    })

    // Take batch from queue
    const batch = this.queue.splice(0, this.maxBatchSize)

    // Execute requests
    await this.executeBatch(batch)

    this.processing = false

    // Process remaining queue
    if (this.queue.length > 0) {
      this.scheduleFlush('normal')
    }
  }

  /**
   * Execute a batch of requests
   */
  private async executeBatch(batch: QueuedRequest[]): Promise<void> {
    // Try batch endpoint first
    const batchSupported = await this.tryBatchEndpoint(batch)

    if (!batchSupported) {
      // Fall back to individual requests
      await this.executeIndividually(batch)
    }
  }

  /**
   * Try to use the batch API endpoint
   */
  private async tryBatchEndpoint(batch: QueuedRequest[]): Promise<boolean> {
    try {
      const response = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: batch.map((req, index) => ({
            id: String(index),
            endpoint: req.config.endpoint,
            method: req.config.method,
            body: req.config.body
          }))
        })
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()

      if (!data.results || !Array.isArray(data.results)) {
        return false
      }

      // Resolve each request
      data.results.forEach((result: { id: string; success: boolean; data?: unknown; error?: string }) => {
        const index = parseInt(result.id, 10)
        const request = batch[index]
        if (!request) return

        if (result.success) {
          this.cacheResult(request.config, result.data)
          request.resolve(result.data)
        } else {
          request.reject(new Error(result.error || 'Request failed'))
        }
      })

      return true
    } catch {
      return false
    }
  }

  /**
   * Execute requests individually (fallback)
   */
  private async executeIndividually(batch: QueuedRequest[]): Promise<void> {
    await Promise.all(batch.map(async (request) => {
      try {
        const response = await fetch(`/api${request.config.endpoint}`, {
          method: request.config.method,
          headers: { 'Content-Type': 'application/json' },
          body: request.config.body ? JSON.stringify(request.config.body) : undefined
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || `Request failed with status ${response.status}`)
        }

        this.cacheResult(request.config, data)
        request.resolve(data)
      } catch (error) {
        request.reject(error instanceof Error ? error : new Error(String(error)))
      }
    }))
  }

  /**
   * Cache a successful result
   */
  private cacheResult(config: RequestConfig, data: unknown): void {
    const cacheTTL = config.cacheTTL ?? this.defaultCacheTTL
    if (config.method !== 'GET' || cacheTTL <= 0) return

    const key = generateRequestKey(config)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: cacheTTL,
      tags: config.tags || []
    })
  }

  /**
   * Invalidate cache by key or tags
   */
  invalidateCache(options: { key?: string; tags?: string[] }): void {
    if (options.key) {
      this.cache.delete(options.key)
      return
    }

    if (options.tags && options.tags.length > 0) {
      const tagsSet = new Set(options.tags)
      for (const [key, entry] of this.cache.entries()) {
        if (entry.tags.some(tag => tagsSet.has(tag))) {
          this.cache.delete(key)
        }
      }
    }
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }

  /**
   * Get queue stats
   */
  getQueueStats(): { size: number; inFlight: number } {
    return {
      size: this.queue.length,
      inFlight: this.inFlight.size
    }
  }
}

// Create singleton instance
export const requestBatcher = new RequestBatcher()

/**
 * Debounced request helper
 * Wraps a request function and debounces calls
 */
export function createDebouncedRequest<T, Args extends unknown[]>(
  requestFn: (...args: Args) => Promise<T>,
  delay: number = 300
): {
  execute: (...args: Args) => Promise<T>
  cancel: () => void
  flush: () => Promise<T | undefined>
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let pendingResolve: ((value: T) => void) | null = null
  let pendingReject: ((error: Error) => void) | null = null
  let pendingArgs: Args | null = null

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (pendingReject) {
      pendingReject(new Error('Request cancelled'))
    }
    pendingResolve = null
    pendingReject = null
    pendingArgs = null
  }

  const flush = async (): Promise<T | undefined> => {
    if (!pendingArgs || !pendingResolve) return undefined

    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    const args = pendingArgs
    const resolve = pendingResolve
    const reject = pendingReject!
    pendingResolve = null
    pendingReject = null
    pendingArgs = null

    try {
      const result = await requestFn(...args)
      resolve(result)
      return result
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  const execute = (...args: Args): Promise<T> => {
    return new Promise((resolve, reject) => {
      // Cancel any pending request
      if (timeoutId) {
        clearTimeout(timeoutId)
        // Don't reject previous - it will be superseded
        if (pendingReject) {
          pendingReject(new Error('Superseded by newer request'))
        }
      }

      pendingResolve = resolve
      pendingReject = reject
      pendingArgs = args

      timeoutId = setTimeout(async () => {
        timeoutId = null
        const currentResolve = pendingResolve
        const currentReject = pendingReject
        pendingResolve = null
        pendingReject = null
        pendingArgs = null

        try {
          const result = await requestFn(...args)
          currentResolve?.(result)
        } catch (error) {
          currentReject?.(error instanceof Error ? error : new Error(String(error)))
        }
      }, delay)
    })
  }

  return { execute, cancel, flush }
}

/**
 * Throttled request helper
 * Ensures requests are spaced at least `limit` ms apart
 */
export function createThrottledRequest<T, Args extends unknown[]>(
  requestFn: (...args: Args) => Promise<T>,
  limit: number = 1000
): (...args: Args) => Promise<T> {
  let lastCallTime = 0
  let pendingPromise: Promise<T> | null = null
  let pendingArgs: Args | null = null

  return async (...args: Args): Promise<T> => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime

    // If enough time has passed, execute immediately
    if (timeSinceLastCall >= limit) {
      lastCallTime = now
      return requestFn(...args)
    }

    // If there's already a pending throttled call, update args and return its promise
    if (pendingPromise) {
      pendingArgs = args
      return pendingPromise
    }

    // Schedule the call after the remaining wait time
    const waitTime = limit - timeSinceLastCall

    pendingPromise = new Promise<T>((resolve, reject) => {
      setTimeout(async () => {
        lastCallTime = Date.now()
        const argsToUse = pendingArgs || args
        pendingPromise = null
        pendingArgs = null

        try {
          resolve(await requestFn(...argsToUse))
        } catch (error) {
          reject(error)
        }
      }, waitTime)
    })

    pendingArgs = args
    return pendingPromise
  }
}

/**
 * Dashboard data loader - batches all initial dashboard requests
 */
export interface DashboardData {
  stats: {
    running: number
    completed: number
    failed: number
    queued: number
    scheduled: number
    pending: number
  }
  workflows: Array<{
    id: string
    name: string
    status: string
    progress?: number
    agent?: string
    source: string
  }>
  user: {
    id: string
    email: string
    name?: string
  } | null
  suggestions: Array<{
    id: string
    title: string
    description: string
    type: string
  }>
}

/**
 * Load all dashboard data in a single batched request
 */
export async function loadDashboardData(): Promise<DashboardData> {
  // Use batch endpoint if available, otherwise parallel requests
  try {
    // Try single combined endpoint first
    const response = await fetch('/api/dashboard/data')
    if (response.ok) {
      const data = await response.json()
      return data
    }
  } catch {
    // Fall back to individual requests
  }

  // Parallel requests with batching
  const results = await requestBatcher.batch<any>([
    { endpoint: '/workflows', method: 'GET', priority: 'high', cacheTTL: 10000, tags: ['workflows'] },
    { endpoint: '/composio/recipes', method: 'GET', priority: 'normal', cacheTTL: 30000, tags: ['recipes'] },
    { endpoint: '/user', method: 'GET', priority: 'critical', cacheTTL: 60000, tags: ['user'] },
    { endpoint: '/suggestions', method: 'GET', priority: 'low', cacheTTL: 60000, tags: ['suggestions'] }
  ])

  const [workflowsRes, recipesRes, userRes, suggestionsRes] = results

  // Process workflows
  const nexusWorkflows = (workflowsRes?.data || []).map((w: any) => ({
    id: w.id,
    name: w.name || 'Unnamed Workflow',
    status: w.status,
    progress: w.progress || 0,
    agent: w.agent || 'nexus',
    source: 'nexus'
  }))

  const rubeWorkflows = (recipesRes?.recipes || []).map((r: any) => ({
    id: r.id,
    name: r.name || 'Recipe',
    status: r.scheduleStatus === 'active' ? 'scheduled' : 'completed',
    agent: 'rube',
    source: 'rube'
  }))

  const allWorkflows = [...nexusWorkflows, ...rubeWorkflows]

  // Calculate stats
  const stats = {
    running: allWorkflows.filter((w: any) => w.status === 'running').length,
    completed: allWorkflows.filter((w: any) => w.status === 'completed').length,
    failed: allWorkflows.filter((w: any) => w.status === 'failed').length,
    queued: allWorkflows.filter((w: any) => w.status === 'queued').length,
    scheduled: allWorkflows.filter((w: any) => w.status === 'scheduled').length,
    pending: allWorkflows.filter((w: any) => w.status === 'pending').length
  }

  return {
    stats,
    workflows: allWorkflows,
    user: userRes?.user || null,
    suggestions: suggestionsRes?.suggestions || []
  }
}

/**
 * Workflow status poller with reduced frequency
 */
export class WorkflowStatusPoller {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private workflowIds: Set<string> = new Set()
  private callbacks: Map<string, (status: any) => void> = new Map()
  private eventSource: EventSource | null = null

  /**
   * Subscribe to workflow status updates
   */
  subscribe(
    workflowId: string,
    callback: (status: any) => void,
    options?: { useSSE?: boolean }
  ): () => void {
    this.workflowIds.add(workflowId)
    this.callbacks.set(workflowId, callback)

    // Try SSE if requested and available
    if (options?.useSSE && !this.eventSource) {
      this.trySSE()
    }

    // Start polling if not using SSE
    if (!this.eventSource && !this.intervalId) {
      this.startPolling()
    }

    // Return unsubscribe function
    return () => {
      this.workflowIds.delete(workflowId)
      this.callbacks.delete(workflowId)

      if (this.workflowIds.size === 0) {
        this.stop()
      }
    }
  }

  /**
   * Try to establish SSE connection
   */
  private async trySSE(): Promise<void> {
    try {
      // Get SSE ticket
      const ticketResponse = await fetch('/api/sse/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowIds: Array.from(this.workflowIds) })
      })

      if (!ticketResponse.ok) {
        console.log('[WorkflowStatusPoller] SSE not available, using polling')
        return
      }

      const { ticket } = await ticketResponse.json()

      this.eventSource = new EventSource(`/api/sse/workflows?ticket=${ticket}`)

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const callback = this.callbacks.get(data.workflowId)
          if (callback) {
            callback(data.status)
          }
        } catch (e) {
          console.error('[WorkflowStatusPoller] SSE parse error:', e)
        }
      }

      this.eventSource.onerror = () => {
        console.log('[WorkflowStatusPoller] SSE error, falling back to polling')
        this.eventSource?.close()
        this.eventSource = null
        this.startPolling()
      }

      // Stop polling if SSE is working
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }
    } catch (e) {
      console.log('[WorkflowStatusPoller] SSE setup failed:', e)
    }
  }

  /**
   * Start polling for status updates
   */
  private startPolling(): void {
    if (this.intervalId) return

    // Poll every 5 seconds (reduced from typical 1-2 seconds)
    this.intervalId = setInterval(() => {
      this.pollStatuses()
    }, 5000)

    // Initial poll
    this.pollStatuses()
  }

  /**
   * Poll all workflow statuses in a single batched request
   */
  private async pollStatuses(): Promise<void> {
    if (this.workflowIds.size === 0) return

    try {
      // Batch all workflow status checks
      const response = await fetch('/api/workflows/batch-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowIds: Array.from(this.workflowIds)
        })
      })

      if (!response.ok) {
        // Fall back to individual requests
        await this.pollIndividually()
        return
      }

      const data = await response.json()

      // Update each workflow
      for (const [id, status] of Object.entries(data.statuses || {})) {
        const callback = this.callbacks.get(id)
        if (callback) {
          callback(status)
        }
      }
    } catch (e) {
      console.error('[WorkflowStatusPoller] Batch poll failed:', e)
      await this.pollIndividually()
    }
  }

  /**
   * Poll statuses individually (fallback)
   */
  private async pollIndividually(): Promise<void> {
    const requests = Array.from(this.workflowIds).map(id => ({
      endpoint: `/workflows/${id}`,
      method: 'GET' as const,
      priority: 'normal' as const,
      cacheTTL: 0, // Don't cache status polls
      tags: ['workflow-status']
    }))

    const results = await requestBatcher.batch<any>(requests)

    let index = 0
    for (const id of this.workflowIds) {
      const callback = this.callbacks.get(id)
      if (callback && results[index]) {
        callback(results[index])
      }
      index++
    }
  }

  /**
   * Stop all polling and SSE
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }
}

// Export singleton poller instance
export const workflowStatusPoller = new WorkflowStatusPoller()

// Export types (RequestConfig already exported above)
export type { CacheEntry, PendingRequest, QueuedRequest }

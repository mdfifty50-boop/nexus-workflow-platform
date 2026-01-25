/**
 * Production Health Monitoring
 *
 * Provides performance metrics collection, API response time tracking,
 * and memory usage monitoring without external dependencies.
 */

// ============================================================================
// Types
// ============================================================================

export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  category: 'web-vital' | 'api' | 'memory' | 'custom'
  metadata?: Record<string, unknown>
}

export interface WebVitals {
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  fcp: number | null // First Contentful Paint
  ttfb: number | null // Time to First Byte
}

export interface APIMetrics {
  endpoint: string
  method: string
  duration: number
  status: number
  timestamp: number
  success: boolean
  errorType?: string
}

export interface MemoryMetrics {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  timestamp: number
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  score: number // 0-100
  checks: HealthCheck[]
  lastUpdated: number
}

export interface HealthCheck {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message?: string
  duration?: number
}

export interface MonitoringConfig {
  enableWebVitals: boolean
  enableAPITracking: boolean
  enableMemoryTracking: boolean
  sampleRate: number // 0-1, percentage of metrics to record
  slowRequestThreshold: number // ms
  maxStoredMetrics: number
  reportingInterval: number // ms
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: MonitoringConfig = {
  enableWebVitals: true,
  enableAPITracking: true,
  enableMemoryTracking: true,
  sampleRate: 1.0,
  slowRequestThreshold: 2000,
  maxStoredMetrics: 1000,
  reportingInterval: 30000,
}

// ============================================================================
// Monitoring Store
// ============================================================================

class MonitoringStore {
  private metrics: PerformanceMetric[] = []
  private apiMetrics: APIMetrics[] = []
  private webVitals: WebVitals = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  }
  private config: MonitoringConfig
  private listeners: Set<(metrics: PerformanceMetric[]) => void> = new Set()
  private isInitialized = false

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  initialize(): void {
    if (this.isInitialized) return
    this.isInitialized = true

    if (this.config.enableWebVitals) {
      this.initializeWebVitals()
    }

    if (this.config.enableMemoryTracking) {
      this.startMemoryTracking()
    }

    console.log('[Monitoring] Initialized with config:', this.config)
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate
  }

  // ============================================================================
  // Web Vitals Collection
  // ============================================================================

  private initializeWebVitals(): void {
    // Use PerformanceObserver for modern metrics
    if (typeof PerformanceObserver === 'undefined') return

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
        this.webVitals.lcp = lastEntry.startTime
        this.recordMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          timestamp: Date.now(),
          category: 'web-vital',
        })
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {
      console.warn('[Monitoring] LCP observation not supported')
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const firstEntry = entries[0] as PerformanceEntry & { processingStart: number; startTime: number }
        const fid = firstEntry.processingStart - firstEntry.startTime
        this.webVitals.fid = fid
        this.recordMetric({
          name: 'FID',
          value: fid,
          timestamp: Date.now(),
          category: 'web-vital',
        })
      })
      fidObserver.observe({ type: 'first-input', buffered: true })
    } catch {
      console.warn('[Monitoring] FID observation not supported')
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as Array<PerformanceEntry & { hadRecentInput: boolean; value: number }>) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
        this.webVitals.cls = clsValue
        this.recordMetric({
          name: 'CLS',
          value: clsValue,
          timestamp: Date.now(),
          category: 'web-vital',
        })
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
    } catch {
      console.warn('[Monitoring] CLS observation not supported')
    }

    // First Contentful Paint & TTFB from navigation timing
    try {
      const paintObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.webVitals.fcp = entry.startTime
            this.recordMetric({
              name: 'FCP',
              value: entry.startTime,
              timestamp: Date.now(),
              category: 'web-vital',
            })
          }
        }
      })
      paintObserver.observe({ type: 'paint', buffered: true })
    } catch {
      console.warn('[Monitoring] Paint observation not supported')
    }

    // TTFB from navigation timing
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (navEntries.length > 0) {
        const nav = navEntries[0]
        this.webVitals.ttfb = nav.responseStart - nav.requestStart
        this.recordMetric({
          name: 'TTFB',
          value: this.webVitals.ttfb,
          timestamp: Date.now(),
          category: 'web-vital',
        })
      }
    }
  }

  // ============================================================================
  // Memory Tracking
  // ============================================================================

  private startMemoryTracking(): void {
    // Check if memory API is available (Chrome only)
    const memoryInfo = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    if (!memoryInfo) {
      console.warn('[Monitoring] Memory API not available (Chrome only)')
      return
    }

    // Record memory metrics periodically
    setInterval(() => {
      if (!this.shouldSample()) return

      const mem = (performance as Performance & { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      this.recordMetric({
        name: 'JSHeapUsed',
        value: mem.usedJSHeapSize,
        timestamp: Date.now(),
        category: 'memory',
        metadata: {
          total: mem.totalJSHeapSize,
          limit: mem.jsHeapSizeLimit,
          percentUsed: (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100,
        },
      })
    }, this.config.reportingInterval)
  }

  getMemoryMetrics(): MemoryMetrics | null {
    const memoryInfo = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    if (!memoryInfo) return null

    return {
      usedJSHeapSize: memoryInfo.usedJSHeapSize,
      totalJSHeapSize: memoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
      timestamp: Date.now(),
    }
  }

  // ============================================================================
  // API Tracking
  // ============================================================================

  trackAPIRequest(metrics: Omit<APIMetrics, 'timestamp'>): void {
    if (!this.config.enableAPITracking || !this.shouldSample()) return

    const apiMetric: APIMetrics = {
      ...metrics,
      timestamp: Date.now(),
    }

    this.apiMetrics.push(apiMetric)

    // Keep only recent metrics
    if (this.apiMetrics.length > this.config.maxStoredMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-this.config.maxStoredMetrics)
    }

    // Record as generic metric too
    this.recordMetric({
      name: `API_${metrics.method}_${metrics.endpoint.split('/').pop() || 'unknown'}`,
      value: metrics.duration,
      timestamp: Date.now(),
      category: 'api',
      metadata: {
        endpoint: metrics.endpoint,
        method: metrics.method,
        status: metrics.status,
        success: metrics.success,
        errorType: metrics.errorType,
      },
    })

    // Log slow requests
    if (metrics.duration > this.config.slowRequestThreshold) {
      console.warn(`[Monitoring] Slow API request: ${metrics.method} ${metrics.endpoint} took ${metrics.duration}ms`)
    }
  }

  getAPIMetrics(): APIMetrics[] {
    return [...this.apiMetrics]
  }

  getAPIStats(): {
    totalRequests: number
    successRate: number
    averageResponseTime: number
    slowRequests: number
    errorRate: number
    errorsByType: Record<string, number>
  } {
    const total = this.apiMetrics.length
    if (total === 0) {
      return {
        totalRequests: 0,
        successRate: 100,
        averageResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
        errorsByType: {},
      }
    }

    const successful = this.apiMetrics.filter((m) => m.success).length
    const slow = this.apiMetrics.filter((m) => m.duration > this.config.slowRequestThreshold).length
    const avgTime = this.apiMetrics.reduce((sum, m) => sum + m.duration, 0) / total

    const errorsByType: Record<string, number> = {}
    this.apiMetrics
      .filter((m) => !m.success && m.errorType)
      .forEach((m) => {
        errorsByType[m.errorType!] = (errorsByType[m.errorType!] || 0) + 1
      })

    return {
      totalRequests: total,
      successRate: (successful / total) * 100,
      averageResponseTime: avgTime,
      slowRequests: slow,
      errorRate: ((total - successful) / total) * 100,
      errorsByType,
    }
  }

  // ============================================================================
  // Generic Metrics
  // ============================================================================

  recordMetric(metric: PerformanceMetric): void {
    if (!this.shouldSample()) return

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.config.maxStoredMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxStoredMetrics)
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener([metric]))
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getWebVitals(): WebVitals {
    return { ...this.webVitals }
  }

  // ============================================================================
  // Health Status
  // ============================================================================

  getHealthStatus(): HealthStatus {
    const checks: HealthCheck[] = []
    let totalScore = 0
    let checkCount = 0

    // Web Vitals Health
    if (this.config.enableWebVitals) {
      const vitals = this.getWebVitals()

      // LCP check (good < 2.5s, needs improvement < 4s)
      if (vitals.lcp !== null) {
        const lcpScore = vitals.lcp < 2500 ? 100 : vitals.lcp < 4000 ? 50 : 0
        checks.push({
          name: 'LCP (Largest Contentful Paint)',
          status: lcpScore === 100 ? 'pass' : lcpScore === 50 ? 'warn' : 'fail',
          message: `${(vitals.lcp / 1000).toFixed(2)}s`,
          duration: vitals.lcp,
        })
        totalScore += lcpScore
        checkCount++
      }

      // FID check (good < 100ms, needs improvement < 300ms)
      if (vitals.fid !== null) {
        const fidScore = vitals.fid < 100 ? 100 : vitals.fid < 300 ? 50 : 0
        checks.push({
          name: 'FID (First Input Delay)',
          status: fidScore === 100 ? 'pass' : fidScore === 50 ? 'warn' : 'fail',
          message: `${vitals.fid.toFixed(0)}ms`,
          duration: vitals.fid,
        })
        totalScore += fidScore
        checkCount++
      }

      // CLS check (good < 0.1, needs improvement < 0.25)
      if (vitals.cls !== null) {
        const clsScore = vitals.cls < 0.1 ? 100 : vitals.cls < 0.25 ? 50 : 0
        checks.push({
          name: 'CLS (Cumulative Layout Shift)',
          status: clsScore === 100 ? 'pass' : clsScore === 50 ? 'warn' : 'fail',
          message: vitals.cls.toFixed(3),
        })
        totalScore += clsScore
        checkCount++
      }
    }

    // API Health
    if (this.config.enableAPITracking) {
      const stats = this.getAPIStats()
      if (stats.totalRequests > 0) {
        const apiScore = stats.successRate > 95 ? 100 : stats.successRate > 80 ? 50 : 0
        checks.push({
          name: 'API Success Rate',
          status: apiScore === 100 ? 'pass' : apiScore === 50 ? 'warn' : 'fail',
          message: `${stats.successRate.toFixed(1)}% (${stats.totalRequests} requests)`,
        })
        totalScore += apiScore
        checkCount++

        const responseScore = stats.averageResponseTime < 500 ? 100 : stats.averageResponseTime < 2000 ? 50 : 0
        checks.push({
          name: 'API Response Time',
          status: responseScore === 100 ? 'pass' : responseScore === 50 ? 'warn' : 'fail',
          message: `${stats.averageResponseTime.toFixed(0)}ms avg`,
          duration: stats.averageResponseTime,
        })
        totalScore += responseScore
        checkCount++
      }
    }

    // Memory Health
    if (this.config.enableMemoryTracking) {
      const mem = this.getMemoryMetrics()
      if (mem) {
        const percentUsed = (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100
        const memScore = percentUsed < 50 ? 100 : percentUsed < 80 ? 50 : 0
        checks.push({
          name: 'Memory Usage',
          status: memScore === 100 ? 'pass' : memScore === 50 ? 'warn' : 'fail',
          message: `${percentUsed.toFixed(1)}% of heap limit`,
        })
        totalScore += memScore
        checkCount++
      }
    }

    const score = checkCount > 0 ? totalScore / checkCount : 100
    const status: HealthStatus['status'] =
      score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'unhealthy'

    return {
      status,
      score: Math.round(score),
      checks,
      lastUpdated: Date.now(),
    }
  }

  // ============================================================================
  // Subscription
  // ============================================================================

  subscribe(listener: (metrics: PerformanceMetric[]) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // ============================================================================
  // Reset/Clear
  // ============================================================================

  clear(): void {
    this.metrics = []
    this.apiMetrics = []
    this.webVitals = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
    }
  }

  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const monitoring = new MonitoringStore()

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Wrap a function to track its execution time
 */
export function trackTiming<T>(
  name: string,
  fn: () => T,
  category: PerformanceMetric['category'] = 'custom'
): T {
  const start = performance.now()
  try {
    const result = fn()
    const duration = performance.now() - start
    monitoring.recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      category,
    })
    return result
  } catch (error) {
    const duration = performance.now() - start
    monitoring.recordMetric({
      name: `${name}_error`,
      value: duration,
      timestamp: Date.now(),
      category,
      metadata: { error: String(error) },
    })
    throw error
  }
}

/**
 * Wrap an async function to track its execution time
 */
export async function trackAsyncTiming<T>(
  name: string,
  fn: () => Promise<T>,
  category: PerformanceMetric['category'] = 'custom'
): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start
    monitoring.recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      category,
    })
    return result
  } catch (error) {
    const duration = performance.now() - start
    monitoring.recordMetric({
      name: `${name}_error`,
      value: duration,
      timestamp: Date.now(),
      category,
      metadata: { error: String(error) },
    })
    throw error
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format duration to human readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  return `${(ms / 60000).toFixed(2)}m`
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  monitoring.initialize()
}

/**
 * Performance Metrics Collection
 *
 * Uses the Performance API to track page load times, time to interactive,
 * API response times, and custom metrics for monitoring application health.
 */

// =============================================================================
// Types
// =============================================================================

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 's' | 'bytes' | 'count'
  timestamp: string
  tags?: Record<string, string>
}

export interface PageLoadMetrics {
  // Navigation timing
  dnsLookup: number
  tcpConnection: number
  tlsNegotiation: number
  requestTime: number
  responseTime: number
  domParsing: number
  domContentLoaded: number
  pageLoad: number
  // Core Web Vitals
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  firstInputDelay?: number
  cumulativeLayoutShift?: number
  timeToFirstByte: number
  timeToInteractive?: number
}

export interface APIMetric {
  endpoint: string
  method: string
  duration: number
  status: number
  size?: number
  timestamp: string
}

export interface ComponentRenderMetric {
  component: string
  renderTime: number
  timestamp: string
}

// =============================================================================
// Metrics Storage
// =============================================================================

const metricsQueue: PerformanceMetric[] = []
const apiMetrics: APIMetric[] = []
const renderMetrics: ComponentRenderMetric[] = []
const MAX_QUEUE_SIZE = 100

// =============================================================================
// Core Web Vitals Tracking
// =============================================================================

/**
 * Get navigation timing metrics
 */
export function getPageLoadMetrics(): PageLoadMetrics | null {
  if (typeof window === 'undefined' || !window.performance) {
    return null
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined

  if (!navigation) {
    return null
  }

  return {
    dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcpConnection: navigation.connectEnd - navigation.connectStart,
    tlsNegotiation: navigation.secureConnectionStart > 0
      ? navigation.connectEnd - navigation.secureConnectionStart
      : 0,
    requestTime: navigation.responseStart - navigation.requestStart,
    responseTime: navigation.responseEnd - navigation.responseStart,
    domParsing: navigation.domInteractive - navigation.responseEnd,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    pageLoad: navigation.loadEventEnd - navigation.loadEventStart,
    timeToFirstByte: navigation.responseStart - navigation.requestStart,
  }
}

/**
 * Track Largest Contentful Paint (LCP)
 */
export function trackLCP(callback: (value: number) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  try {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
      if (lastEntry) {
        callback(lastEntry.startTime)
        recordMetric('lcp', lastEntry.startTime, 'ms', { vital: 'core' })
      }
    })
    observer.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    // LCP observer not supported
  }
}

/**
 * Track First Input Delay (FID)
 */
export function trackFID(callback: (value: number) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  try {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number }
        const fid = fidEntry.processingStart - fidEntry.startTime
        callback(fid)
        recordMetric('fid', fid, 'ms', { vital: 'core' })
      })
    })
    observer.observe({ type: 'first-input', buffered: true })
  } catch {
    // FID observer not supported
  }
}

/**
 * Track Cumulative Layout Shift (CLS)
 */
export function trackCLS(callback: (value: number) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  let clsValue = 0
  let sessionValue = 0
  let sessionEntries: PerformanceEntry[] = []

  try {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach((entry) => {
        const layoutShift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }
        if (!layoutShift.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0] as PerformanceEntry | undefined
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1] as PerformanceEntry | undefined

          // Start a new session if there's a 1 second gap or 5 second total
          if (
            firstSessionEntry &&
            lastSessionEntry &&
            (entry.startTime - lastSessionEntry.startTime > 1000 ||
              entry.startTime - firstSessionEntry.startTime > 5000)
          ) {
            if (sessionValue > clsValue) {
              clsValue = sessionValue
            }
            sessionEntries = [entry]
            sessionValue = layoutShift.value
          } else {
            sessionEntries.push(entry)
            sessionValue += layoutShift.value
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue
            callback(clsValue)
            recordMetric('cls', clsValue, 'count', { vital: 'core' })
          }
        }
      })
    })
    observer.observe({ type: 'layout-shift', buffered: true })
  } catch {
    // CLS observer not supported
  }
}

/**
 * Track First Contentful Paint (FCP)
 */
export function trackFCP(callback: (value: number) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  try {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntriesByName('first-contentful-paint')
      if (entries.length > 0) {
        const fcp = entries[0]
        callback(fcp.startTime)
        recordMetric('fcp', fcp.startTime, 'ms', { vital: 'core' })
        observer.disconnect()
      }
    })
    observer.observe({ type: 'paint', buffered: true })
  } catch {
    // FCP observer not supported
  }
}

// =============================================================================
// API Performance Tracking
// =============================================================================

/**
 * Track API call performance
 */
export function trackAPICall(
  endpoint: string,
  method: string,
  duration: number,
  status: number,
  size?: number
): APIMetric {
  const metric: APIMetric = {
    endpoint,
    method,
    duration,
    status,
    size,
    timestamp: new Date().toISOString(),
  }

  apiMetrics.push(metric)
  if (apiMetrics.length > MAX_QUEUE_SIZE) {
    apiMetrics.shift()
  }

  // Log in development
  if (import.meta.env.DEV) {
    const statusColor = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m'
    console.log(
      `[Performance] ${method} ${endpoint} ${statusColor}${status}\x1b[0m ${duration.toFixed(2)}ms${size ? ` (${formatBytes(size)})` : ''}`
    )
  }

  return metric
}

/**
 * Create a fetch wrapper that tracks performance
 */
export function createTrackedFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const startTime = performance.now()
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const method = init?.method || 'GET'

    try {
      const response = await fetch(input, init)
      const duration = performance.now() - startTime
      const contentLength = parseInt(response.headers.get('content-length') || '0', 10)

      trackAPICall(url, method, duration, response.status, contentLength)

      return response
    } catch (error) {
      const duration = performance.now() - startTime
      trackAPICall(url, method, duration, 0) // Status 0 for network errors
      throw error
    }
  }
}

// =============================================================================
// Component Render Performance
// =============================================================================

/**
 * Track component render time
 */
export function trackComponentRender(component: string, renderTime: number): void {
  const metric: ComponentRenderMetric = {
    component,
    renderTime,
    timestamp: new Date().toISOString(),
  }

  renderMetrics.push(metric)
  if (renderMetrics.length > MAX_QUEUE_SIZE) {
    renderMetrics.shift()
  }

  // Log slow renders in development
  if (import.meta.env.DEV && renderTime > 16) {
    console.warn(`[Performance] Slow render: ${component} took ${renderTime.toFixed(2)}ms`)
  }
}

/**
 * Create a render timing wrapper for React components
 */
export function measureRender<T>(component: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  trackComponentRender(component, duration)
  return result
}

// =============================================================================
// Custom Metrics
// =============================================================================

/**
 * Record a custom performance metric
 */
export function recordMetric(
  name: string,
  value: number,
  unit: PerformanceMetric['unit'] = 'ms',
  tags?: Record<string, string>
): PerformanceMetric {
  const metric: PerformanceMetric = {
    name,
    value,
    unit,
    timestamp: new Date().toISOString(),
    tags,
  }

  metricsQueue.push(metric)
  if (metricsQueue.length > MAX_QUEUE_SIZE) {
    metricsQueue.shift()
  }

  if (import.meta.env.DEV) {
    console.log(`[Performance] ${name}: ${value}${unit}`, tags || '')
  }

  return metric
}

/**
 * Create a timer for measuring operations
 */
export function createTimer(name: string, tags?: Record<string, string>) {
  const start = performance.now()

  return {
    stop: () => {
      const duration = performance.now() - start
      return recordMetric(name, duration, 'ms', tags)
    },
    elapsed: () => performance.now() - start,
  }
}

/**
 * Decorator for timing async functions
 */
export function withTiming<T extends (...args: unknown[]) => Promise<unknown>>(
  name: string,
  fn: T,
  tags?: Record<string, string>
): T {
  return (async (...args: Parameters<T>) => {
    const timer = createTimer(name, tags)
    try {
      return await fn(...args)
    } finally {
      timer.stop()
    }
  }) as T
}

// =============================================================================
// Reports and Getters
// =============================================================================

/**
 * Get all recorded metrics
 */
export function getAllMetrics(): {
  custom: PerformanceMetric[]
  api: APIMetric[]
  render: ComponentRenderMetric[]
} {
  return {
    custom: [...metricsQueue],
    api: [...apiMetrics],
    render: [...renderMetrics],
  }
}

/**
 * Get API metrics summary
 */
export function getAPIMetricsSummary(): {
  total: number
  averageDuration: number
  errorRate: number
  byEndpoint: Record<string, { count: number; avgDuration: number; errorCount: number }>
} {
  if (apiMetrics.length === 0) {
    return { total: 0, averageDuration: 0, errorRate: 0, byEndpoint: {} }
  }

  const byEndpoint: Record<string, { count: number; totalDuration: number; errorCount: number }> = {}
  let totalDuration = 0
  let errorCount = 0

  apiMetrics.forEach((m) => {
    totalDuration += m.duration
    if (m.status >= 400 || m.status === 0) errorCount++

    if (!byEndpoint[m.endpoint]) {
      byEndpoint[m.endpoint] = { count: 0, totalDuration: 0, errorCount: 0 }
    }
    byEndpoint[m.endpoint].count++
    byEndpoint[m.endpoint].totalDuration += m.duration
    if (m.status >= 400 || m.status === 0) byEndpoint[m.endpoint].errorCount++
  })

  const summary: Record<string, { count: number; avgDuration: number; errorCount: number }> = {}
  Object.entries(byEndpoint).forEach(([endpoint, data]) => {
    summary[endpoint] = {
      count: data.count,
      avgDuration: data.totalDuration / data.count,
      errorCount: data.errorCount,
    }
  })

  return {
    total: apiMetrics.length,
    averageDuration: totalDuration / apiMetrics.length,
    errorRate: errorCount / apiMetrics.length,
    byEndpoint: summary,
  }
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  metricsQueue.length = 0
  apiMetrics.length = 0
  renderMetrics.length = 0
}

/**
 * Generate a performance report
 */
export function generatePerformanceReport(): string {
  const pageLoad = getPageLoadMetrics()
  const apiSummary = getAPIMetricsSummary()
  const metrics = getAllMetrics()

  const report = {
    generatedAt: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    pageLoad,
    api: {
      summary: apiSummary,
      recent: metrics.api.slice(-10),
    },
    customMetrics: metrics.custom.slice(-20),
    slowRenders: metrics.render.filter((r) => r.renderTime > 16),
  }

  return JSON.stringify(report, null, 2)
}

// =============================================================================
// Utilities
// =============================================================================

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// =============================================================================
// Auto-initialization
// =============================================================================

/**
 * Initialize all performance tracking
 */
export function initPerformanceTracking(): void {
  if (typeof window === 'undefined') return

  // Track Core Web Vitals
  trackFCP((value) => {
    if (import.meta.env.DEV) {
      console.log(`[Performance] FCP: ${value.toFixed(2)}ms`)
    }
  })

  trackLCP((value) => {
    if (import.meta.env.DEV) {
      console.log(`[Performance] LCP: ${value.toFixed(2)}ms`)
    }
  })

  trackFID((value) => {
    if (import.meta.env.DEV) {
      console.log(`[Performance] FID: ${value.toFixed(2)}ms`)
    }
  })

  trackCLS((value) => {
    if (import.meta.env.DEV) {
      console.log(`[Performance] CLS: ${value.toFixed(4)}`)
    }
  })

  // Log page load metrics when ready
  if (document.readyState === 'complete') {
    logPageLoadMetrics()
  } else {
    window.addEventListener('load', () => {
      setTimeout(logPageLoadMetrics, 0)
    })
  }
}

function logPageLoadMetrics(): void {
  const metrics = getPageLoadMetrics()
  if (metrics && import.meta.env.DEV) {
    console.group('[Performance] Page Load Metrics')
    console.log(`DNS Lookup: ${metrics.dnsLookup.toFixed(2)}ms`)
    console.log(`TCP Connection: ${metrics.tcpConnection.toFixed(2)}ms`)
    console.log(`Time to First Byte: ${metrics.timeToFirstByte.toFixed(2)}ms`)
    console.log(`Response Time: ${metrics.responseTime.toFixed(2)}ms`)
    console.log(`DOM Parsing: ${metrics.domParsing.toFixed(2)}ms`)
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`)
    console.log(`Page Load: ${metrics.pageLoad.toFixed(2)}ms`)
    console.groupEnd()
  }
}

// =============================================================================
// React Hook
// =============================================================================

import { useEffect, useRef, useCallback } from 'react'

/**
 * React hook for component performance tracking
 */
export function usePerformanceTracking(componentName: string) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef(performance.now())

  useEffect(() => {
    const now = performance.now()
    const renderTime = now - lastRenderTime.current
    renderCount.current++

    trackComponentRender(componentName, renderTime)
    lastRenderTime.current = now
  })

  const measureOperation = useCallback(
    <T>(operationName: string, fn: () => T): T => {
      const timer = createTimer(`${componentName}.${operationName}`)
      const result = fn()
      timer.stop()
      return result
    },
    [componentName]
  )

  const measureAsyncOperation = useCallback(
    async <T>(operationName: string, fn: () => Promise<T>): Promise<T> => {
      const timer = createTimer(`${componentName}.${operationName}`)
      try {
        return await fn()
      } finally {
        timer.stop()
      }
    },
    [componentName]
  )

  return {
    renderCount: renderCount.current,
    measureOperation,
    measureAsyncOperation,
    recordMetric: (name: string, value: number, unit?: PerformanceMetric['unit']) =>
      recordMetric(`${componentName}.${name}`, value, unit),
  }
}

// =============================================================================
// Exports
// =============================================================================

export default {
  init: initPerformanceTracking,
  getPageLoadMetrics,
  trackAPICall,
  trackComponentRender,
  recordMetric,
  createTimer,
  withTiming,
  getAllMetrics,
  getAPIMetricsSummary,
  clearMetrics,
  generatePerformanceReport,
  createTrackedFetch,
  trackLCP,
  trackFID,
  trackCLS,
  trackFCP,
}

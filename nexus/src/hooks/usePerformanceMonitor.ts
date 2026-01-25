/**
 * usePerformanceMonitor Hook
 *
 * React hook for monitoring component render times, interaction timing,
 * and reporting slow operations.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { monitoring, type PerformanceMetric } from '@/lib/monitoring'

// ============================================================================
// Types
// ============================================================================

export interface RenderMetrics {
  componentName: string
  renderCount: number
  averageRenderTime: number
  lastRenderTime: number
  slowRenders: number
  totalRenderTime: number
}

export interface InteractionMetrics {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  success: boolean
  metadata?: Record<string, unknown>
}

export interface PerformanceMonitorConfig {
  componentName: string
  slowRenderThreshold?: number // ms, default 16.67 (60fps)
  trackRenders?: boolean
  trackInteractions?: boolean
  reportToMonitoring?: boolean
}

export interface UsePerformanceMonitorReturn {
  renderMetrics: RenderMetrics
  startInteraction: (name: string, metadata?: Record<string, unknown>) => string
  endInteraction: (id: string, success?: boolean) => InteractionMetrics | undefined
  trackOperation: <T>(name: string, operation: () => T) => T
  trackAsyncOperation: <T>(name: string, operation: () => Promise<T>) => Promise<T>
  getInteractionHistory: () => InteractionMetrics[]
  isSlowRender: boolean
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePerformanceMonitor(
  config: PerformanceMonitorConfig
): UsePerformanceMonitorReturn {
  const {
    componentName,
    slowRenderThreshold = 16.67, // 60fps frame budget
    trackRenders = true,
    trackInteractions = true,
    reportToMonitoring = true,
  } = config

  // Track render timing
  const renderStartRef = useRef<number>(performance.now())
  const renderCountRef = useRef(0)
  const totalRenderTimeRef = useRef(0)
  const slowRenderCountRef = useRef(0)
  const lastRenderTimeRef = useRef(0)

  // Track interactions
  const activeInteractionsRef = useRef<Map<string, InteractionMetrics>>(new Map())
  const interactionHistoryRef = useRef<InteractionMetrics[]>([])

  // State for reactive updates
  const [isSlowRender, setIsSlowRender] = useState(false)
  const [renderMetrics, setRenderMetrics] = useState<RenderMetrics>({
    componentName,
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    slowRenders: 0,
    totalRenderTime: 0,
  })

  // Track render start
  renderStartRef.current = performance.now()

  // Effect runs after every render to measure render time
  useEffect(() => {
    if (!trackRenders) return

    const renderEnd = performance.now()
    const renderTime = renderEnd - renderStartRef.current

    renderCountRef.current++
    totalRenderTimeRef.current += renderTime
    lastRenderTimeRef.current = renderTime

    const isSlow = renderTime > slowRenderThreshold
    if (isSlow) {
      slowRenderCountRef.current++
      setIsSlowRender(true)

      // Log slow renders
      console.warn(
        `[Performance] Slow render in ${componentName}: ${renderTime.toFixed(2)}ms (threshold: ${slowRenderThreshold}ms)`
      )
    } else {
      setIsSlowRender(false)
    }

    // Update metrics state
    setRenderMetrics({
      componentName,
      renderCount: renderCountRef.current,
      averageRenderTime: totalRenderTimeRef.current / renderCountRef.current,
      lastRenderTime: renderTime,
      slowRenders: slowRenderCountRef.current,
      totalRenderTime: totalRenderTimeRef.current,
    })

    // Report to monitoring system
    if (reportToMonitoring) {
      monitoring.recordMetric({
        name: `render_${componentName}`,
        value: renderTime,
        timestamp: Date.now(),
        category: 'custom',
        metadata: {
          renderCount: renderCountRef.current,
          isSlow,
        },
      })
    }
  })

  // Generate unique interaction ID
  const generateInteractionId = useCallback(() => {
    return `${componentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [componentName])

  // Start tracking an interaction
  const startInteraction = useCallback(
    (name: string, metadata?: Record<string, unknown>): string => {
      if (!trackInteractions) return ''

      const id = generateInteractionId()
      const interaction: InteractionMetrics = {
        name,
        startTime: performance.now(),
        success: true,
        metadata,
      }

      activeInteractionsRef.current.set(id, interaction)
      return id
    },
    [trackInteractions, generateInteractionId]
  )

  // End tracking an interaction
  const endInteraction = useCallback(
    (id: string, success = true): InteractionMetrics | undefined => {
      if (!trackInteractions || !id) return undefined

      const interaction = activeInteractionsRef.current.get(id)
      if (!interaction) {
        console.warn(`[Performance] Interaction ${id} not found`)
        return undefined
      }

      interaction.endTime = performance.now()
      interaction.duration = interaction.endTime - interaction.startTime
      interaction.success = success

      activeInteractionsRef.current.delete(id)
      interactionHistoryRef.current.push(interaction)

      // Keep history bounded
      if (interactionHistoryRef.current.length > 100) {
        interactionHistoryRef.current = interactionHistoryRef.current.slice(-100)
      }

      // Log slow interactions
      if (interaction.duration > 100) {
        console.warn(
          `[Performance] Slow interaction "${interaction.name}" in ${componentName}: ${interaction.duration.toFixed(2)}ms`
        )
      }

      // Report to monitoring
      if (reportToMonitoring) {
        monitoring.recordMetric({
          name: `interaction_${componentName}_${interaction.name}`,
          value: interaction.duration,
          timestamp: Date.now(),
          category: 'custom',
          metadata: {
            success,
            ...interaction.metadata,
          },
        })
      }

      return interaction
    },
    [trackInteractions, componentName, reportToMonitoring]
  )

  // Track a synchronous operation
  const trackOperation = useCallback(
    <T>(name: string, operation: () => T): T => {
      const id = startInteraction(name)
      try {
        const result = operation()
        endInteraction(id, true)
        return result
      } catch (error) {
        endInteraction(id, false)
        throw error
      }
    },
    [startInteraction, endInteraction]
  )

  // Track an async operation
  const trackAsyncOperation = useCallback(
    async <T>(name: string, operation: () => Promise<T>): Promise<T> => {
      const id = startInteraction(name)
      try {
        const result = await operation()
        endInteraction(id, true)
        return result
      } catch (error) {
        endInteraction(id, false)
        throw error
      }
    },
    [startInteraction, endInteraction]
  )

  // Get interaction history
  const getInteractionHistory = useCallback((): InteractionMetrics[] => {
    return [...interactionHistoryRef.current]
  }, [])

  return {
    renderMetrics,
    startInteraction,
    endInteraction,
    trackOperation,
    trackAsyncOperation,
    getInteractionHistory,
    isSlowRender,
  }
}

// ============================================================================
// Additional Hooks
// ============================================================================

/**
 * Hook to track mount/unmount timing
 */
export function useComponentLifecycle(componentName: string): void {
  const mountTimeRef = useRef<number>(0)

  useEffect(() => {
    mountTimeRef.current = performance.now()

    monitoring.recordMetric({
      name: `mount_${componentName}`,
      value: mountTimeRef.current,
      timestamp: Date.now(),
      category: 'custom',
      metadata: { event: 'mount' },
    })

    return () => {
      const unmountTime = performance.now()
      const lifetime = unmountTime - mountTimeRef.current

      monitoring.recordMetric({
        name: `unmount_${componentName}`,
        value: lifetime,
        timestamp: Date.now(),
        category: 'custom',
        metadata: { event: 'unmount', lifetime },
      })
    }
  }, [componentName])
}

/**
 * Hook to subscribe to monitoring updates
 */
export function useMonitoringSubscription(
  callback: (metrics: PerformanceMetric[]) => void
): void {
  useEffect(() => {
    const unsubscribe = monitoring.subscribe(callback)
    return unsubscribe
  }, [callback])
}

/**
 * Hook to get real-time health status
 */
export function useHealthStatus(refreshInterval = 5000) {
  const [health, setHealth] = useState(() => monitoring.getHealthStatus())

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(monitoring.getHealthStatus())
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  return health
}

/**
 * Hook to get API statistics
 */
export function useAPIStats(refreshInterval = 5000) {
  const [stats, setStats] = useState(() => monitoring.getAPIStats())

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(monitoring.getAPIStats())
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  return stats
}

/**
 * Hook to get web vitals
 */
export function useWebVitals(refreshInterval = 5000) {
  const [vitals, setVitals] = useState(() => monitoring.getWebVitals())

  useEffect(() => {
    const interval = setInterval(() => {
      setVitals(monitoring.getWebVitals())
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  return vitals
}

/**
 * Hook to get memory metrics
 */
export function useMemoryMetrics(refreshInterval = 5000) {
  const [memory, setMemory] = useState(() => monitoring.getMemoryMetrics())

  useEffect(() => {
    const interval = setInterval(() => {
      setMemory(monitoring.getMemoryMetrics())
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  return memory
}

// Export types
export type { PerformanceMetric }

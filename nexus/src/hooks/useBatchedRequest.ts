/**
 * useBatchedRequest Hook
 *
 * React hooks for making batched, deduplicated API requests.
 * Integrates with the requestBatcher for automatic optimization.
 *
 * Features:
 * - Automatic request deduplication
 * - Loading and error states
 * - Refetch capability
 * - Cache management
 * - TypeScript support
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  requestBatcher,
  type RequestConfig,
  type RequestPriority,
  loadDashboardData,
  type DashboardData,
  workflowStatusPoller
} from '@/lib/requestBatcher'

// Types
export interface BatchedRequestState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export interface BatchedRequestOptions {
  /** Request priority */
  priority?: RequestPriority
  /** Cache TTL in milliseconds */
  cacheTTL?: number
  /** Skip deduplication */
  skipDedup?: boolean
  /** Tags for cache invalidation */
  tags?: string[]
  /** Don't fetch automatically on mount */
  manual?: boolean
  /** Callback when data is fetched */
  onSuccess?: (data: any) => void
  /** Callback when request fails */
  onError?: (error: Error) => void
}

export interface BatchedRequestReturn<T> extends BatchedRequestState<T> {
  /** Refetch the data */
  refetch: () => Promise<T | null>
  /** Clear the cached data */
  clear: () => void
  /** Check if currently fetching */
  isRefetching: boolean
}

/**
 * Hook for making a single batched request
 */
export function useBatchedRequest<T = any>(
  endpoint: string,
  options: BatchedRequestOptions = {}
): BatchedRequestReturn<T> {
  const [state, setState] = useState<BatchedRequestState<T>>({
    data: null,
    loading: !options.manual,
    error: null
  })
  const [isRefetching, setIsRefetching] = useState(false)
  const mountedRef = useRef(true)
  const fetchIdRef = useRef(0)

  const fetch = useCallback(async (): Promise<T | null> => {
    const fetchId = ++fetchIdRef.current

    try {
      setIsRefetching(true)

      const config: RequestConfig = {
        endpoint,
        method: 'GET',
        priority: options.priority || 'normal',
        cacheTTL: options.cacheTTL,
        skipDedup: options.skipDedup,
        tags: options.tags
      }

      const data = await requestBatcher.request<T>(config)

      // Only update state if this is the latest fetch and component is still mounted
      if (fetchId === fetchIdRef.current && mountedRef.current) {
        setState({ data, loading: false, error: null })
        setIsRefetching(false)
        options.onSuccess?.(data)
      }

      return data
    } catch (error) {
      if (fetchId === fetchIdRef.current && mountedRef.current) {
        const err = error instanceof Error ? error : new Error(String(error))
        setState(prev => ({ ...prev, loading: false, error: err }))
        setIsRefetching(false)
        options.onError?.(err)
      }
      return null
    }
  }, [endpoint, options.priority, options.cacheTTL, options.skipDedup, options.tags, options.onSuccess, options.onError])

  const refetch = useCallback(async (): Promise<T | null> => {
    // Invalidate cache for this endpoint
    requestBatcher.invalidateCache({
      key: `GET:${endpoint}:`
    })
    return fetch()
  }, [endpoint, fetch])

  const clear = useCallback(() => {
    setState({ data: null, loading: false, error: null })
    requestBatcher.invalidateCache({
      key: `GET:${endpoint}:`
    })
  }, [endpoint])

  // Fetch on mount unless manual
  useEffect(() => {
    mountedRef.current = true

    if (!options.manual) {
      fetch()
    }

    return () => {
      mountedRef.current = false
    }
  }, [fetch, options.manual])

  return {
    ...state,
    refetch,
    clear,
    isRefetching
  }
}

/**
 * Hook for making multiple batched requests in parallel
 */
export function useBatchedRequests<T = any>(
  endpoints: string[],
  options: BatchedRequestOptions = {}
): {
  data: (T | null)[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<(T | null)[]>
} {
  const [data, setData] = useState<(T | null)[]>(endpoints.map(() => null))
  const [loading, setLoading] = useState(!options.manual)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)
  const fetchIdRef = useRef(0)

  // Memoize endpoints array to prevent infinite loops
  const endpointsKey = useMemo(() => endpoints.join(','), [endpoints])

  const fetch = useCallback(async (): Promise<(T | null)[]> => {
    const fetchId = ++fetchIdRef.current

    try {
      setLoading(true)
      setError(null)

      const configs: RequestConfig[] = endpoints.map(endpoint => ({
        endpoint,
        method: 'GET',
        priority: options.priority || 'normal',
        cacheTTL: options.cacheTTL,
        skipDedup: options.skipDedup,
        tags: options.tags
      }))

      const results = await requestBatcher.batch<T>(configs)

      if (fetchId === fetchIdRef.current && mountedRef.current) {
        setData(results)
        setLoading(false)
        options.onSuccess?.(results)
      }

      return results
    } catch (err) {
      if (fetchId === fetchIdRef.current && mountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setLoading(false)
        options.onError?.(error)
      }
      return endpoints.map(() => null)
    }
  }, [endpointsKey, options.priority, options.cacheTTL, options.skipDedup, options.tags, options.onSuccess, options.onError])

  const refetch = useCallback(async (): Promise<(T | null)[]> => {
    // Invalidate cache for all endpoints
    endpoints.forEach(endpoint => {
      requestBatcher.invalidateCache({
        key: `GET:${endpoint}:`
      })
    })
    return fetch()
  }, [endpoints, fetch])

  useEffect(() => {
    mountedRef.current = true

    if (!options.manual) {
      fetch()
    }

    return () => {
      mountedRef.current = false
    }
  }, [fetch, options.manual])

  return { data, loading, error, refetch }
}

/**
 * Hook for loading dashboard data efficiently
 */
export function useDashboardData(options: { manual?: boolean } = {}): {
  data: DashboardData | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<DashboardData | null>
} {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(!options.manual)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)
  const fetchIdRef = useRef(0)

  const fetch = useCallback(async (): Promise<DashboardData | null> => {
    const fetchId = ++fetchIdRef.current

    try {
      setLoading(true)
      setError(null)

      const dashboardData = await loadDashboardData()

      if (fetchId === fetchIdRef.current && mountedRef.current) {
        setData(dashboardData)
        setLoading(false)
      }

      return dashboardData
    } catch (err) {
      if (fetchId === fetchIdRef.current && mountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setLoading(false)
      }
      return null
    }
  }, [])

  const refetch = useCallback(async (): Promise<DashboardData | null> => {
    // Invalidate all dashboard-related caches
    requestBatcher.invalidateCache({ tags: ['workflows', 'recipes', 'user', 'suggestions'] })
    return fetch()
  }, [fetch])

  useEffect(() => {
    mountedRef.current = true

    if (!options.manual) {
      fetch()
    }

    return () => {
      mountedRef.current = false
    }
  }, [fetch, options.manual])

  return { data, loading, error, refetch }
}

/**
 * Hook for workflow status polling with automatic batching and SSE fallback
 */
export function useWorkflowStatus(
  workflowId: string | null,
  options: {
    /** Use SSE if available (default: true) */
    useSSE?: boolean
    /** Callback when status updates */
    onStatusChange?: (status: any) => void
    /** Don't poll automatically */
    manual?: boolean
  } = {}
): {
  status: any | null
  loading: boolean
  error: Error | null
  refresh: () => void
} {
  const [status, setStatus] = useState<any | null>(null)
  const [loading, setLoading] = useState(!options.manual && !!workflowId)
  const [error, setError] = useState<Error | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const refresh = useCallback(() => {
    if (!workflowId) return

    setLoading(true)
    setError(null)

    // Unsubscribe from previous
    unsubscribeRef.current?.()

    // Subscribe to new updates
    unsubscribeRef.current = workflowStatusPoller.subscribe(
      workflowId,
      (newStatus) => {
        setStatus(newStatus)
        setLoading(false)
        options.onStatusChange?.(newStatus)
      },
      { useSSE: options.useSSE !== false }
    )
  }, [workflowId, options.useSSE, options.onStatusChange])

  useEffect(() => {
    if (!workflowId || options.manual) {
      return
    }

    refresh()

    return () => {
      unsubscribeRef.current?.()
      unsubscribeRef.current = null
    }
  }, [workflowId, options.manual, refresh])

  return { status, loading, error, refresh }
}

/**
 * Hook for multiple workflow status polling
 */
export function useWorkflowStatuses(
  workflowIds: string[],
  options: {
    useSSE?: boolean
    onStatusChange?: (id: string, status: any) => void
    manual?: boolean
  } = {}
): {
  statuses: Map<string, any>
  loading: boolean
  error: Error | null
  refresh: () => void
} {
  const [statuses, setStatuses] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(!options.manual && workflowIds.length > 0)
  const [error, setError] = useState<Error | null>(null)
  const unsubscribesRef = useRef<Map<string, () => void>>(new Map())

  // Memoize workflowIds to prevent infinite loops
  const idsKey = useMemo(() => workflowIds.join(','), [workflowIds])

  const refresh = useCallback(() => {
    if (workflowIds.length === 0) return

    setLoading(true)
    setError(null)

    // Unsubscribe from all previous
    unsubscribesRef.current.forEach(unsub => unsub())
    unsubscribesRef.current.clear()

    // Subscribe to each workflow
    workflowIds.forEach(id => {
      const unsubscribe = workflowStatusPoller.subscribe(
        id,
        (newStatus) => {
          setStatuses(prev => {
            const next = new Map(prev)
            next.set(id, newStatus)
            return next
          })
          setLoading(false)
          options.onStatusChange?.(id, newStatus)
        },
        { useSSE: options.useSSE !== false }
      )
      unsubscribesRef.current.set(id, unsubscribe)
    })
  }, [idsKey, options.useSSE, options.onStatusChange])

  useEffect(() => {
    if (workflowIds.length === 0 || options.manual) {
      return
    }

    refresh()

    return () => {
      unsubscribesRef.current.forEach(unsub => unsub())
      unsubscribesRef.current.clear()
    }
  }, [workflowIds.length, options.manual, refresh])

  return { statuses, loading, error, refresh }
}

/**
 * Hook for making a POST request with automatic deduplication
 */
export function useBatchedMutation<TData = any, TVariables = any>(
  endpoint: string,
  options: {
    priority?: RequestPriority
    onSuccess?: (data: TData) => void
    onError?: (error: Error) => void
  } = {}
): {
  mutate: (variables: TVariables) => Promise<TData | null>
  data: TData | null
  loading: boolean
  error: Error | null
  reset: () => void
} {
  const [data, setData] = useState<TData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const mutate = useCallback(async (variables: TVariables): Promise<TData | null> => {
    try {
      setLoading(true)
      setError(null)

      const config: RequestConfig = {
        endpoint,
        method: 'POST',
        body: variables,
        priority: options.priority || 'high',
        skipDedup: true // Mutations should not be deduplicated
      }

      const result = await requestBatcher.request<TData>(config)

      if (mountedRef.current) {
        setData(result)
        setLoading(false)
        options.onSuccess?.(result)
      }

      // Invalidate related caches
      requestBatcher.invalidateCache({ tags: ['workflows', 'recipes'] })

      return result
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setLoading(false)
        options.onError?.(error)
      }
      return null
    }
  }, [endpoint, options.priority, options.onSuccess, options.onError])

  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  return { mutate, data, loading, error, reset }
}

// Export convenience hooks
export { requestBatcher }

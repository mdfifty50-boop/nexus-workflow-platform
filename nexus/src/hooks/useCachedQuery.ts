/**
 * useCachedQuery - React hook for cached API calls with stale-while-revalidate
 *
 * Provides a React Query-like interface for cached data fetching with:
 * - Automatic caching with configurable TTL
 * - Stale-while-revalidate pattern for instant perceived performance
 * - Background data refresh
 * - Automatic refetch on window focus (optional)
 * - Manual refetch capability
 * - Loading and error states
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  apiCache,
  createCacheKey,
  CacheTTL,
  StaleTime,
  type CacheOptions
} from '../lib/cache'

export interface UseCachedQueryOptions<T> extends Omit<CacheOptions, 'maxSize' | 'persist'> {
  /** Initial data to use before fetch completes */
  initialData?: T
  /** Enable fetching (useful for conditional queries) */
  enabled?: boolean
  /** Refetch when window regains focus */
  refetchOnFocus?: boolean
  /** Refetch interval in ms (0 to disable) */
  refetchInterval?: number
  /** Callback when fetch succeeds */
  onSuccess?: (data: T) => void
  /** Callback when fetch fails */
  onError?: (error: Error) => void
  /** Query key params for cache differentiation */
  queryParams?: Record<string, string | number | boolean | undefined>
}

export interface UseCachedQueryResult<T> {
  /** The fetched/cached data */
  data: T | null
  /** Loading state (true only on initial load, not refetch) */
  isLoading: boolean
  /** Fetching state (true during any fetch including refetch) */
  isFetching: boolean
  /** Error if fetch failed */
  error: Error | null
  /** Whether data came from cache */
  isFromCache: boolean
  /** Whether cached data is stale */
  isStale: boolean
  /** Manually trigger refetch */
  refetch: (forceRefresh?: boolean) => Promise<void>
  /** Manually invalidate cache for this query */
  invalidate: () => void
  /** Last successful fetch timestamp */
  dataUpdatedAt: number | null
}

/**
 * Hook for cached data fetching with stale-while-revalidate
 *
 * @example
 * ```tsx
 * const { data, isLoading, refetch } = useCachedQuery(
 *   'workflows',
 *   () => apiClient.listNexusWorkflows(),
 *   {
 *     ttl: CacheTTL.MEDIUM,
 *     refetchOnFocus: true
 *   }
 * )
 * ```
 */
export function useCachedQuery<T>(
  queryKey: string,
  fetcher: () => Promise<T>,
  options: UseCachedQueryOptions<T> = {}
): UseCachedQueryResult<T> {
  const {
    initialData,
    enabled = true,
    ttl = CacheTTL.MEDIUM,
    staleTime = StaleTime.MEDIUM,
    forceRefresh = false,
    refetchOnFocus = false,
    refetchInterval = 0,
    onSuccess,
    onError,
    queryParams
  } = options

  // Generate cache key
  const cacheKey = queryParams
    ? createCacheKey(queryKey, queryParams)
    : queryKey

  // State
  const [data, setData] = useState<T | null>(initialData ?? null)
  const [isLoading, setIsLoading] = useState(!initialData && enabled)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const [isStale, setIsStale] = useState(false)
  const [dataUpdatedAt, setDataUpdatedAt] = useState<number | null>(null)

  // Refs for cleanup
  const isMountedRef = useRef(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  // Core fetch function
  const executeQuery = useCallback(async (force: boolean = false) => {
    if (!enabled) return

    setIsFetching(true)
    setError(null)

    try {
      const result = await apiCache.fetchWithSWR<T>(
        cacheKey,
        () => fetcherRef.current(),
        { ttl, staleTime, forceRefresh: force || forceRefresh }
      )

      if (isMountedRef.current) {
        setData(result.data)
        setIsFromCache(result.fromCache)
        setIsStale(result.isStale)
        setDataUpdatedAt(Date.now())
        setIsLoading(false)
        setIsFetching(false)
        onSuccess?.(result.data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        setIsLoading(false)
        setIsFetching(false)
        onError?.(error)
      }
    }
  }, [cacheKey, enabled, ttl, staleTime, forceRefresh, onSuccess, onError])

  // Refetch function exposed to consumers
  const refetch = useCallback(async (force: boolean = true) => {
    await executeQuery(force)
  }, [executeQuery])

  // Invalidate function
  const invalidate = useCallback(() => {
    apiCache.invalidate(cacheKey)
    setIsStale(true)
  }, [cacheKey])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      executeQuery(forceRefresh)
    }
  }, [enabled, cacheKey, forceRefresh, executeQuery])

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnFocus) return

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        executeQuery(false) // Don't force, use SWR
      }
    }

    document.addEventListener('visibilitychange', handleFocus)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refetchOnFocus, executeQuery])

  // Refetch interval
  useEffect(() => {
    if (refetchInterval <= 0) return

    const intervalId = setInterval(() => {
      executeQuery(false)
    }, refetchInterval)

    return () => clearInterval(intervalId)
  }, [refetchInterval, executeQuery])

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    data,
    isLoading,
    isFetching,
    error,
    isFromCache,
    isStale,
    refetch,
    invalidate,
    dataUpdatedAt
  }
}

/**
 * Hook for cached mutations with optimistic updates
 *
 * @example
 * ```tsx
 * const { mutate, isLoading } = useCachedMutation(
 *   (data) => apiClient.createWorkflow(data),
 *   {
 *     onSuccess: () => {
 *       // Invalidate workflows cache
 *       apiClient.invalidateWorkflows()
 *     }
 *   }
 * )
 * ```
 */
export interface UseCachedMutationOptions<TData, TVariables> {
  /** Callback before mutation (for optimistic updates) */
  onMutate?: (variables: TVariables) => Promise<void> | void
  /** Callback on success */
  onSuccess?: (data: TData, variables: TVariables) => void
  /** Callback on error */
  onError?: (error: Error, variables: TVariables) => void
  /** Callback that always runs after mutation */
  onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void
  /** Cache keys to invalidate on success */
  invalidateKeys?: string[]
}

export interface UseCachedMutationResult<TData, TVariables> {
  /** Execute the mutation */
  mutate: (variables: TVariables) => Promise<TData>
  /** Execute mutation and return result */
  mutateAsync: (variables: TVariables) => Promise<TData>
  /** Loading state */
  isLoading: boolean
  /** Error if mutation failed */
  error: Error | null
  /** Reset error state */
  reset: () => void
}

export function useCachedMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseCachedMutationOptions<TData, TVariables> = {}
): UseCachedMutationResult<TData, TVariables> {
  const { onMutate, onSuccess, onError, onSettled, invalidateKeys } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const mutationFnRef = useRef(mutationFn)
  mutationFnRef.current = mutationFn

  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData> => {
    setIsLoading(true)
    setError(null)

    try {
      // Optimistic update callback
      await onMutate?.(variables)

      // Execute mutation
      const data = await mutationFnRef.current(variables)

      // Invalidate cache keys
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          apiCache.invalidatePrefix(key)
        })
      }

      // Success callback
      onSuccess?.(data, variables)
      onSettled?.(data, null, variables)

      setIsLoading(false)
      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Mutation failed')
      setError(error)
      setIsLoading(false)

      onError?.(error, variables)
      onSettled?.(null, error, variables)

      throw error
    }
  }, [onMutate, onSuccess, onError, onSettled, invalidateKeys])

  const mutate = useCallback((variables: TVariables) => {
    return mutateAsync(variables)
  }, [mutateAsync])

  const reset = useCallback(() => {
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
    reset
  }
}

/**
 * Hook for prefetching data into cache
 *
 * @example
 * ```tsx
 * const prefetch = usePrefetch()
 *
 * // Prefetch on hover
 * <button onMouseEnter={() => prefetch('workflow-123', () => apiClient.getWorkflow('123'))}>
 *   View Workflow
 * </button>
 * ```
 */
export function usePrefetch() {
  return useCallback(<T>(
    queryKey: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; staleTime?: number } = {}
  ) => {
    const { ttl = CacheTTL.MEDIUM, staleTime = StaleTime.MEDIUM } = options

    // Only prefetch if not already cached
    if (!apiCache.has(queryKey)) {
      apiCache.fetch(queryKey, fetcher, { ttl, staleTime }).catch(() => {
        // Silently ignore prefetch errors
      })
    }
  }, [])
}

/**
 * Hook for checking if data is cached
 */
export function useIsCached(queryKey: string): boolean {
  const [isCached, setIsCached] = useState(() => apiCache.has(queryKey))

  useEffect(() => {
    setIsCached(apiCache.has(queryKey))
  }, [queryKey])

  return isCached
}

/**
 * Hook for cache statistics (for debugging/monitoring)
 */
export function useCacheStats() {
  const [stats, setStats] = useState(() => apiCache.getStats())

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(apiCache.getStats())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const refresh = useCallback(() => {
    setStats(apiCache.getStats())
  }, [])

  return { stats, refresh }
}

// Re-export cache utilities for convenience
export { CacheTTL, StaleTime, CacheKeys } from '../lib/cache'
export { apiCache, createCacheKey, invalidateUserCache, invalidateWorkflowCache } from '../lib/cache'

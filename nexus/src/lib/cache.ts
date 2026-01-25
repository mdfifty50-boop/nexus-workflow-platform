/**
 * Client-side API Response Cache with TTL Support
 *
 * Provides a comprehensive caching layer for API requests to reduce
 * redundant network calls and improve perceived performance.
 *
 * Features:
 * - TTL-based cache expiration
 * - LRU-style eviction when max size exceeded
 * - localStorage persistence for offline support
 * - TypeScript generics for type safety
 * - Promise deduplication for concurrent requests
 * - Stale-while-revalidate pattern support
 * - Cache invalidation helpers
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  staleTime?: number // When data becomes stale (triggers background refresh)
}

interface CacheOptions {
  /** Time-to-live in milliseconds (default: 5 minutes) */
  ttl?: number
  /** Maximum cache entries (default: 100) */
  maxSize?: number
  /** Force refresh, bypassing cache */
  forceRefresh?: boolean
  /** Time after which data is considered stale but still usable (triggers background refresh) */
  staleTime?: number
  /** Persist to localStorage */
  persist?: boolean
}

interface PersistentCacheData {
  entries: Array<[string, CacheEntry<unknown>]>
  version: number
  savedAt: number
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
const DEFAULT_STALE_TIME = 2 * 60 * 1000 // 2 minutes
const DEFAULT_MAX_SIZE = 100
const STORAGE_KEY = 'nexus_api_cache'
const STORAGE_VERSION = 1

class APICache {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private pendingRequests: Map<string, Promise<unknown>> = new Map()
  private backgroundRefreshes: Set<string> = new Set()
  private maxSize: number
  private persistEnabled: boolean

  constructor(maxSize: number = DEFAULT_MAX_SIZE, persistEnabled: boolean = true) {
    this.maxSize = maxSize
    this.persistEnabled = persistEnabled

    // Restore from localStorage on initialization
    if (this.persistEnabled) {
      this.restoreFromStorage()
    }

    // Save to storage periodically and on page unload
    if (typeof window !== 'undefined' && this.persistEnabled) {
      window.addEventListener('beforeunload', () => this.persistToStorage())
      // Periodic save every 30 seconds
      setInterval(() => this.persistToStorage(), 30000)
    }
  }

  /**
   * Restore cache from localStorage
   */
  private restoreFromStorage(): void {
    // Check if localStorage is available (not in Node.js environment)
    if (typeof localStorage === 'undefined') {
      return
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return

      const data: PersistentCacheData = JSON.parse(stored)

      // Check version compatibility
      if (data.version !== STORAGE_VERSION) {
        localStorage.removeItem(STORAGE_KEY)
        return
      }

      // Restore non-expired entries
      const now = Date.now()
      for (const [key, entry] of data.entries) {
        if (now - entry.timestamp < entry.ttl) {
          this.cache.set(key, entry)
        }
      }

      console.log(`[Cache] Restored ${this.cache.size} entries from storage`)
    } catch (error) {
      console.warn('[Cache] Failed to restore from storage:', error)
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  /**
   * Persist cache to localStorage
   */
  private persistToStorage(): void {
    if (!this.persistEnabled || typeof localStorage === 'undefined') return

    try {
      const entries = Array.from(this.cache.entries())
      const data: PersistentCacheData = {
        entries,
        version: STORAGE_VERSION,
        savedAt: Date.now()
      }

      // Limit storage size by keeping only newest entries
      const maxStorageEntries = 50
      if (entries.length > maxStorageEntries) {
        data.entries = entries
          .sort((a, b) => b[1].timestamp - a[1].timestamp)
          .slice(0, maxStorageEntries)
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.warn('[Cache] Failed to persist to storage:', error)
      // Clear storage if quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearStorage()
      }
    }
  }

  /**
   * Clear localStorage cache
   */
  clearStorage(): void {
    if (typeof localStorage === 'undefined') return

    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Get a cached value if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      return null
    }

    // Check if entry has expired
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Get cached value with stale status
   */
  getWithStaleStatus<T>(key: string): { data: T | null; isStale: boolean } {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      return { data: null, isStale: false }
    }

    const now = Date.now()
    const age = now - entry.timestamp

    // Expired
    if (age > entry.ttl) {
      this.cache.delete(key)
      return { data: null, isStale: false }
    }

    // Check if stale (past staleTime but not expired)
    const staleTime = entry.staleTime ?? DEFAULT_STALE_TIME
    const isStale = age > staleTime

    return { data: entry.data, isStale }
  }

  /**
   * Store a value in the cache
   */
  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL, staleTime?: number): void {
    // Evict oldest entries if we're at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      staleTime: staleTime ?? Math.min(ttl * 0.4, DEFAULT_STALE_TIME)
    })
  }

  /**
   * Remove a specific entry from the cache
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Remove all entries matching a prefix
   */
  invalidatePrefix(prefix: string): number {
    let count = 0
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
        count++
      }
    }
    return count
  }

  /**
   * Remove all entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
        count++
      }
    }
    return count
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()
    this.backgroundRefreshes.clear()
    this.clearStorage()
  }

  /**
   * Get the number of cached entries
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * Fetch with caching - deduplicates concurrent requests
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = DEFAULT_TTL, forceRefresh = false, staleTime } = options

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = this.get<T>(key)
      if (cached !== null) {
        return cached
      }
    }

    // Check for pending request (deduplicate concurrent calls)
    const pending = this.pendingRequests.get(key)
    if (pending) {
      return pending as Promise<T>
    }

    // Make the request
    const request = fetcher()
      .then((data) => {
        this.set(key, data, ttl, staleTime)
        this.pendingRequests.delete(key)
        return data
      })
      .catch((error) => {
        this.pendingRequests.delete(key)
        throw error
      })

    this.pendingRequests.set(key, request)
    return request
  }

  /**
   * Fetch with stale-while-revalidate pattern
   * Returns cached data immediately (if available) and refreshes in background if stale
   */
  async fetchWithSWR<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<{ data: T; fromCache: boolean; isStale: boolean }> {
    const { ttl = DEFAULT_TTL, forceRefresh = false, staleTime } = options

    // Check cache first
    if (!forceRefresh) {
      const { data: cachedData, isStale } = this.getWithStaleStatus<T>(key)

      if (cachedData !== null) {
        // If stale, trigger background refresh
        if (isStale && !this.backgroundRefreshes.has(key)) {
          this.backgroundRefresh(key, fetcher, ttl, staleTime)
        }

        return { data: cachedData, fromCache: true, isStale }
      }
    }

    // No cache, fetch fresh data
    const data = await this.fetch(key, fetcher, { ttl, staleTime })
    return { data, fromCache: false, isStale: false }
  }

  /**
   * Trigger background refresh without blocking
   */
  private backgroundRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
    staleTime?: number
  ): void {
    this.backgroundRefreshes.add(key)

    fetcher()
      .then((data) => {
        this.set(key, data, ttl, staleTime)
        console.log(`[Cache] Background refresh completed: ${key}`)
      })
      .catch((error) => {
        console.warn(`[Cache] Background refresh failed: ${key}`, error)
      })
      .finally(() => {
        this.backgroundRefreshes.delete(key)
      })
  }

  /**
   * Optimistically update cache before API call
   */
  optimisticUpdate<T>(key: string, updater: (current: T | null) => T): T {
    const current = this.get<T>(key)
    const updated = updater(current)

    // Preserve original TTL if entry exists
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    const ttl = entry?.ttl ?? DEFAULT_TTL
    const staleTime = entry?.staleTime

    this.set(key, updated, ttl, staleTime)
    return updated
  }

  /**
   * Rollback optimistic update
   */
  rollback<T>(key: string, originalData: T | null): void {
    if (originalData === null) {
      this.cache.delete(key)
    } else {
      const entry = this.cache.get(key) as CacheEntry<T> | undefined
      const ttl = entry?.ttl ?? DEFAULT_TTL
      const staleTime = entry?.staleTime
      this.set(key, originalData, ttl, staleTime)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    pendingRequests: number
    backgroundRefreshes: number
    keys: string[]
    memoryUsageEstimate: string
  } {
    // Rough memory estimate
    let memoryEstimate = 0
    for (const entry of this.cache.values()) {
      try {
        memoryEstimate += JSON.stringify(entry).length * 2 // UTF-16
      } catch {
        memoryEstimate += 1000 // Fallback estimate
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      pendingRequests: this.pendingRequests.size,
      backgroundRefreshes: this.backgroundRefreshes.size,
      keys: Array.from(this.cache.keys()),
      memoryUsageEstimate: `${(memoryEstimate / 1024).toFixed(2)} KB`
    }
  }

  /**
   * Check if a key has cached data (valid or stale)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Get remaining TTL for a cached entry
   */
  getRemainingTTL(key: string): number | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const elapsed = Date.now() - entry.timestamp
    const remaining = entry.ttl - elapsed

    return remaining > 0 ? remaining : null
  }
}

// Export singleton instance
export const apiCache = new APICache()

// Export class for custom instances
export { APICache }

// Type-safe cache key generator
export function createCacheKey(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  if (!params) {
    return endpoint
  }

  const filteredParams = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')

  return filteredParams ? `${endpoint}?${filteredParams}` : endpoint
}

// Predefined TTL constants
export const CacheTTL = {
  /** 30 seconds - for very frequently changing data */
  VERY_SHORT: 30 * 1000,
  /** 1 minute - for frequently changing data */
  SHORT: 60 * 1000,
  /** 5 minutes - default */
  MEDIUM: 5 * 60 * 1000,
  /** 15 minutes - for semi-static data */
  LONG: 15 * 60 * 1000,
  /** 1 hour - for rarely changing data */
  EXTENDED: 60 * 60 * 1000,
  /** 24 hours - for static reference data */
  DAY: 24 * 60 * 60 * 1000,
  /** Session duration - cleared on page refresh */
  SESSION: Infinity,
} as const

// Predefined stale times
export const StaleTime = {
  /** Immediately stale - always revalidate */
  IMMEDIATE: 0,
  /** 30 seconds */
  VERY_SHORT: 30 * 1000,
  /** 1 minute */
  SHORT: 60 * 1000,
  /** 2 minutes - default */
  MEDIUM: 2 * 60 * 1000,
  /** 5 minutes */
  LONG: 5 * 60 * 1000,
} as const

// Cache key prefixes for different data types
export const CacheKeys = {
  WORKFLOWS: 'workflows:',
  TEMPLATES: 'templates:',
  USER_PROFILE: 'user:profile:',
  INTEGRATIONS: 'integrations:',
  AGENTS: 'agents:',
  TOOLS: 'tools:',
  SETTINGS: 'settings:',
} as const

/**
 * Helper to invalidate all user-specific data
 * Call this on logout
 */
export function invalidateUserCache(): void {
  apiCache.invalidatePrefix(CacheKeys.USER_PROFILE)
  apiCache.invalidatePrefix(CacheKeys.WORKFLOWS)
  apiCache.invalidatePrefix(CacheKeys.INTEGRATIONS)
  apiCache.invalidatePrefix(CacheKeys.SETTINGS)
}

/**
 * Helper to invalidate workflow-related caches
 * Call this after workflow mutations
 */
export function invalidateWorkflowCache(): void {
  apiCache.invalidatePrefix(CacheKeys.WORKFLOWS)
}

/**
 * Helper to invalidate template-related caches
 */
export function invalidateTemplateCache(): void {
  apiCache.invalidatePrefix(CacheKeys.TEMPLATES)
}

/**
 * React hook-friendly cached fetch wrapper
 *
 * Usage:
 * ```ts
 * const data = await cachedFetch('/api/users', {
 *   ttl: CacheTTL.MEDIUM,
 *   params: { page: 1 }
 * })
 * ```
 */
export async function cachedFetch<T>(
  endpoint: string,
  options: {
    ttl?: number
    staleTime?: number
    forceRefresh?: boolean
    params?: Record<string, string | number | boolean | undefined>
    fetchOptions?: RequestInit
  } = {}
): Promise<T> {
  const { ttl, staleTime, forceRefresh, params, fetchOptions } = options
  const cacheKey = createCacheKey(endpoint, params)

  return apiCache.fetch<T>(
    cacheKey,
    async () => {
      const url = params
        ? `${endpoint}?${new URLSearchParams(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          )}`
        : endpoint

      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions?.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    },
    { ttl, staleTime, forceRefresh }
  )
}

/**
 * Cached fetch with stale-while-revalidate
 */
export async function cachedFetchSWR<T>(
  endpoint: string,
  options: {
    ttl?: number
    staleTime?: number
    forceRefresh?: boolean
    params?: Record<string, string | number | boolean | undefined>
    fetchOptions?: RequestInit
  } = {}
): Promise<{ data: T; fromCache: boolean; isStale: boolean }> {
  const { ttl, staleTime, forceRefresh, params, fetchOptions } = options
  const cacheKey = createCacheKey(endpoint, params)

  return apiCache.fetchWithSWR<T>(
    cacheKey,
    async () => {
      const url = params
        ? `${endpoint}?${new URLSearchParams(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          )}`
        : endpoint

      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions?.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    },
    { ttl, staleTime, forceRefresh }
  )
}

// Export types
export type { CacheEntry, CacheOptions }

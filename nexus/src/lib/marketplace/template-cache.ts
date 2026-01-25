/**
 * Template Cache
 *
 * Provides a caching layer for marketplace template data
 * with TTL-based expiration and category-based invalidation.
 */

import type { MarketplaceCategoryType } from './marketplace-types'

// =============================================================================
// CACHE ENTRY INTERFACE
// =============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 200
const STORAGE_KEY = 'nexus_marketplace_cache'
const STORAGE_VERSION = 1

// =============================================================================
// TEMPLATE CACHE CLASS
// =============================================================================

export class TemplateCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private maxSize: number
  private persistToStorage: boolean

  constructor(options: { maxSize?: number; persist?: boolean } = {}) {
    this.maxSize = options.maxSize ?? MAX_CACHE_SIZE
    this.persistToStorage = options.persist ?? false

    // Restore from storage if persistence is enabled
    if (this.persistToStorage) {
      this.restoreFromStorage()
    }

    // Periodic cleanup of expired entries
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60 * 1000) // Every minute
    }
  }

  // ===========================================================================
  // CORE METHODS
  // ===========================================================================

  /**
   * Get a cached value if it exists and hasn't expired
   */
  getCached<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      return undefined
    }

    // Check expiration
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return undefined
    }

    return entry.data
  }

  /**
   * Store a value in the cache with optional TTL
   */
  setCached<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })

    // Persist to storage if enabled
    if (this.persistToStorage) {
      this.saveToStorage()
    }
  }

  /**
   * Check if a key exists in cache and is not expired
   */
  has(key: string): boolean {
    return this.getCached(key) !== undefined
  }

  /**
   * Get remaining TTL for a cached entry (in ms)
   */
  getRemainingTTL(key: string): number | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const elapsed = Date.now() - entry.timestamp
    const remaining = entry.ttl - elapsed

    return remaining > 0 ? remaining : null
  }

  // ===========================================================================
  // INVALIDATION METHODS
  // ===========================================================================

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted && this.persistToStorage) {
      this.saveToStorage()
    }
    return deleted
  }

  /**
   * Invalidate all entries for a specific category
   */
  invalidateCategory(category: MarketplaceCategoryType): number {
    let count = 0
    const categoryPattern = new RegExp(`category[=:]${category}|categories.*${category}`, 'i')

    for (const key of this.cache.keys()) {
      if (categoryPattern.test(key) || key.includes(`"${category}"`)) {
        this.cache.delete(key)
        count++
      }
    }

    // Also invalidate general searches that might include this category
    this.invalidatePrefix('search:')
    this.invalidatePrefix('popular:')
    this.invalidatePrefix('recent:')
    this.invalidatePrefix('featured:')
    this.invalidatePrefix('suggested:')

    if (count > 0 && this.persistToStorage) {
      this.saveToStorage()
    }

    return count
  }

  /**
   * Invalidate all entries matching a prefix
   */
  invalidatePrefix(prefix: string): number {
    let count = 0

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
        count++
      }
    }

    if (count > 0 && this.persistToStorage) {
      this.saveToStorage()
    }

    return count
  }

  /**
   * Invalidate all entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
        count++
      }
    }

    if (count > 0 && this.persistToStorage) {
      this.saveToStorage()
    }

    return count
  }

  /**
   * Clear all cached entries
   */
  invalidateAll(): void {
    this.cache.clear()
    if (this.persistToStorage) {
      this.clearStorage()
    }
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    keys: string[]
    memoryEstimate: string
  } {
    // Estimate memory usage
    let memoryBytes = 0
    for (const entry of this.cache.values()) {
      try {
        memoryBytes += JSON.stringify(entry).length * 2 // UTF-16
      } catch {
        memoryBytes += 1000 // Fallback estimate
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
      memoryEstimate: `${(memoryBytes / 1024).toFixed(2)} KB`,
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0 && this.persistToStorage) {
      this.saveToStorage()
    }

    return cleaned
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Evict oldest entries to make room
   */
  private evictOldest(count: number = 10): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count)

    for (const [key] of entries) {
      this.cache.delete(key)
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return

    try {
      const entries = Array.from(this.cache.entries())
        // Only persist entries with at least 30 seconds remaining TTL
        .filter(([, entry]) => {
          const remaining = entry.ttl - (Date.now() - entry.timestamp)
          return remaining > 30 * 1000
        })
        // Limit to 50 entries for storage
        .slice(0, 50)

      const data = {
        version: STORAGE_VERSION,
        entries,
        savedAt: Date.now(),
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      // Handle quota exceeded or other storage errors
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearStorage()
      }
      console.warn('[TemplateCache] Failed to save to storage:', error)
    }
  }

  /**
   * Restore cache from localStorage
   */
  private restoreFromStorage(): void {
    if (typeof localStorage === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return

      const data = JSON.parse(stored)

      // Version check
      if (data.version !== STORAGE_VERSION) {
        this.clearStorage()
        return
      }

      // Restore non-expired entries
      const now = Date.now()
      for (const [key, entry] of data.entries as Array<[string, CacheEntry<unknown>]>) {
        const age = now - entry.timestamp
        if (age < entry.ttl) {
          this.cache.set(key, entry)
        }
      }

      console.log(`[TemplateCache] Restored ${this.cache.size} entries from storage`)
    } catch (error) {
      console.warn('[TemplateCache] Failed to restore from storage:', error)
      this.clearStorage()
    }
  }

  /**
   * Clear localStorage
   */
  private clearStorage(): void {
    if (typeof localStorage === 'undefined') return

    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Default cache instance for marketplace templates
 */
export const templateCache = new TemplateCache({
  maxSize: MAX_CACHE_SIZE,
  persist: true,
})

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Invalidate all template-related caches
 */
export function invalidateAllTemplateCache(): void {
  templateCache.invalidateAll()
}

/**
 * Invalidate search results cache
 */
export function invalidateSearchCache(): void {
  templateCache.invalidatePrefix('search:')
}

/**
 * Invalidate suggestions cache
 */
export function invalidateSuggestionsCache(): void {
  templateCache.invalidatePrefix('suggested:')
}

/**
 * Invalidate featured templates cache
 */
export function invalidateFeaturedCache(): void {
  templateCache.invalidatePrefix('featured:')
}

// =============================================================================
// CACHE TTL PRESETS
// =============================================================================

export const CacheTTL = {
  /** 30 seconds - for real-time data */
  VERY_SHORT: 30 * 1000,
  /** 1 minute - for frequently changing data */
  SHORT: 60 * 1000,
  /** 5 minutes - default */
  MEDIUM: 5 * 60 * 1000,
  /** 15 minutes - for semi-static data */
  LONG: 15 * 60 * 1000,
  /** 1 hour - for static data */
  EXTENDED: 60 * 60 * 1000,
} as const

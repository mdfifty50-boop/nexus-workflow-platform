/**
 * useToolCatalog - React Hook for Tool Catalog Access
 *
 * Provides reactive access to the tool catalog with search,
 * filtering, and automatic cache management.
 */

import { useState, useEffect, useCallback } from 'react'
import { toolCatalogService } from '../services/ToolCatalogService'
import type {
  Tool,
  ToolSearchFilters,
  ToolSearchResult,
  ToolCatalogStats,
  ToolCategory
} from '../types/tools'

interface UseToolCatalogOptions {
  autoFetch?: boolean
  initialFilters?: ToolSearchFilters
}

interface UseToolCatalogReturn {
  // Data
  tools: ToolSearchResult[]
  popularTools: Tool[]
  stats: ToolCatalogStats | null

  // State
  loading: boolean
  error: string | null

  // Actions
  search: (filters: ToolSearchFilters) => Promise<void>
  getToolById: (id: string) => Promise<Tool | null>
  getToolBySlug: (slug: string) => Promise<Tool | null>
  getToolsByCategory: (category: ToolCategory) => Promise<Tool[]>
  refreshPopular: () => Promise<void>
  refreshStats: () => Promise<void>
}

export function useToolCatalog(options: UseToolCatalogOptions = {}): UseToolCatalogReturn {
  const { autoFetch = true, initialFilters = {} } = options

  const [tools, setTools] = useState<ToolSearchResult[]>([])
  const [popularTools, setPopularTools] = useState<Tool[]>([])
  const [stats, setStats] = useState<ToolCatalogStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search tools with filters
  const search = useCallback(async (filters: ToolSearchFilters) => {
    setLoading(true)
    setError(null)

    try {
      const results = await toolCatalogService.searchTools(filters)
      setTools(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setTools([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Get tool by ID
  const getToolById = useCallback(async (id: string): Promise<Tool | null> => {
    try {
      return await toolCatalogService.getToolById(id)
    } catch (err) {
      console.error('[useToolCatalog] getToolById error:', err)
      return null
    }
  }, [])

  // Get tool by Rube/Composio slug
  const getToolBySlug = useCallback(async (slug: string): Promise<Tool | null> => {
    try {
      return await toolCatalogService.getToolBySlug(slug)
    } catch (err) {
      console.error('[useToolCatalog] getToolBySlug error:', err)
      return null
    }
  }, [])

  // Get tools by category
  const getToolsByCategory = useCallback(async (category: ToolCategory): Promise<Tool[]> => {
    try {
      return await toolCatalogService.getToolsByCategory(category)
    } catch (err) {
      console.error('[useToolCatalog] getToolsByCategory error:', err)
      return []
    }
  }, [])

  // Refresh popular tools
  const refreshPopular = useCallback(async () => {
    try {
      const popular = await toolCatalogService.getPopularTools()
      setPopularTools(popular)
    } catch (err) {
      console.error('[useToolCatalog] refreshPopular error:', err)
    }
  }, [])

  // Refresh stats
  const refreshStats = useCallback(async () => {
    try {
      const catalogStats = await toolCatalogService.getCatalogStats()
      setStats(catalogStats)
    } catch (err) {
      console.error('[useToolCatalog] refreshStats error:', err)
    }
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      search(initialFilters)
      refreshPopular()
      refreshStats()
    }
  }, [autoFetch, search, refreshPopular, refreshStats])

  // Subscribe to stats changes
  useEffect(() => {
    const unsubscribe = toolCatalogService.onStatsChange(setStats)
    return unsubscribe
  }, [])

  return {
    tools,
    popularTools,
    stats,
    loading,
    error,
    search,
    getToolById,
    getToolBySlug,
    getToolsByCategory,
    refreshPopular,
    refreshStats
  }
}

/**
 * Hook for single tool lookup
 */
export function useTool(idOrSlug: string, isSlug = false) {
  const [tool, setTool] = useState<Tool | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchTool = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = isSlug
          ? await toolCatalogService.getToolBySlug(idOrSlug)
          : await toolCatalogService.getToolById(idOrSlug)

        if (mounted) {
          setTool(result)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch tool')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    if (idOrSlug) {
      fetchTool()
    }

    return () => {
      mounted = false
    }
  }, [idOrSlug, isSlug])

  return { tool, loading, error }
}

/**
 * Hook for tool search with debouncing
 */
export function useToolSearch(debounceMs = 300) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ToolSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const searchResults = await toolCatalogService.searchTools({ query })
        setResults(searchResults)
      } catch (err) {
        console.error('[useToolSearch] error:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  return { query, setQuery, results, loading }
}

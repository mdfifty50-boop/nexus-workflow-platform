/**
 * useAdminToolCatalog - React Hook for Admin Tool Management
 *
 * Provides admin-level operations for the tool catalog:
 * - Add, approve, and update tools
 * - Bulk import tools
 * - View statistics and patterns
 *
 * Part of Epic 16: Intelligent Agent Skills
 */

import { useState, useCallback } from 'react'
import { adminToolCatalogApi } from '../lib/admin-api'
import type {
  ApproveToolRequest,
  UpdateToolRequest,
  BulkImportRequest,
  BulkImportResult
} from '../lib/admin-api'
import type {
  Tool,
  AddToolRequest,
  ToolSearchFilters,
  ToolSearchResult,
  ToolCatalogStats,
  ToolCategory,
  LearnedPattern
} from '../types/tools'

interface UseAdminToolCatalogReturn {
  // State
  loading: boolean
  error: string | null
  stats: ToolCatalogStats | null

  // Tool CRUD operations
  addTool: (request: AddToolRequest) => Promise<Tool | null>
  approveTool: (toolId: string, approvedBy: string, notes?: string) => Promise<Tool | null>
  updateTool: (toolId: string, updates: Partial<Tool>) => Promise<Tool | null>
  getToolById: (toolId: string) => Promise<Tool | null>

  // Bulk operations
  bulkImport: (request: BulkImportRequest) => Promise<BulkImportResult | null>

  // Search and queries
  searchTools: (filters: ToolSearchFilters) => Promise<ToolSearchResult[]>
  getToolsByCategory: (category: ToolCategory) => Promise<Tool[]>
  getPopularTools: (limit?: number) => Promise<Tool[]>

  // Analytics
  getLearnedPatterns: (toolId: string, projectId?: string) => Promise<LearnedPattern | null>
  refreshStats: () => Promise<void>

  // Utilities
  clearCache: () => void
  clearError: () => void
}

export function useAdminToolCatalog(): UseAdminToolCatalogReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ToolCatalogStats | null>(null)

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Add a new tool
  const addTool = useCallback(async (request: AddToolRequest): Promise<Tool | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await adminToolCatalogApi.addTool(request)
      if (!response.success) {
        setError(response.error || 'Failed to add tool')
        return null
      }
      return response.data || null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tool')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Approve a tool
  const approveTool = useCallback(async (
    toolId: string,
    approvedBy: string,
    notes?: string
  ): Promise<Tool | null> => {
    setLoading(true)
    setError(null)

    try {
      const request: ApproveToolRequest = { toolId, approvedBy, notes }
      const response = await adminToolCatalogApi.approveTool(request)
      if (!response.success) {
        setError(response.error || 'Failed to approve tool')
        return null
      }
      return response.data || null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve tool')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Update a tool
  const updateTool = useCallback(async (
    toolId: string,
    updates: Partial<Tool>
  ): Promise<Tool | null> => {
    setLoading(true)
    setError(null)

    try {
      const request: UpdateToolRequest = { toolId, updates }
      const response = await adminToolCatalogApi.updateTool(request)
      if (!response.success) {
        setError(response.error || 'Failed to update tool')
        return null
      }
      return response.data || null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tool')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get tool by ID
  const getToolById = useCallback(async (toolId: string): Promise<Tool | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await adminToolCatalogApi.getToolById(toolId)
      if (!response.success) {
        setError(response.error || 'Tool not found')
        return null
      }
      return response.data || null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get tool')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Bulk import tools
  const bulkImport = useCallback(async (request: BulkImportRequest): Promise<BulkImportResult | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await adminToolCatalogApi.bulkImport(request)
      if (!response.success) {
        setError(response.error || 'Bulk import failed')
        return null
      }
      return response.data || null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk import failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Search tools
  const searchTools = useCallback(async (filters: ToolSearchFilters): Promise<ToolSearchResult[]> => {
    setLoading(true)
    setError(null)

    try {
      const response = await adminToolCatalogApi.searchTools(filters)
      if (!response.success) {
        setError(response.error || 'Search failed')
        return []
      }
      return response.data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Get tools by category
  const getToolsByCategory = useCallback(async (category: ToolCategory): Promise<Tool[]> => {
    setLoading(true)
    setError(null)

    try {
      const response = await adminToolCatalogApi.getToolsByCategory(category)
      if (!response.success) {
        setError(response.error || 'Failed to get tools')
        return []
      }
      return response.data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get tools')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Get popular tools
  const getPopularTools = useCallback(async (limit = 10): Promise<Tool[]> => {
    setLoading(true)
    setError(null)

    try {
      const response = await adminToolCatalogApi.getPopularTools(limit)
      if (!response.success) {
        setError(response.error || 'Failed to get popular tools')
        return []
      }
      return response.data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get popular tools')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Get learned patterns
  const getLearnedPatterns = useCallback(async (
    toolId: string,
    projectId?: string
  ): Promise<LearnedPattern | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await adminToolCatalogApi.getLearnedPatterns(toolId, projectId)
      if (!response.success) {
        setError(response.error || 'Failed to get patterns')
        return null
      }
      return response.data || null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get patterns')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh stats
  const refreshStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await adminToolCatalogApi.getCatalogStats()
      if (!response.success) {
        setError(response.error || 'Failed to get stats')
        return
      }
      setStats(response.data || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get stats')
    } finally {
      setLoading(false)
    }
  }, [])

  // Clear cache
  const clearCache = useCallback(() => {
    adminToolCatalogApi.clearCache()
  }, [])

  return {
    loading,
    error,
    stats,
    addTool,
    approveTool,
    updateTool,
    getToolById,
    bulkImport,
    searchTools,
    getToolsByCategory,
    getPopularTools,
    getLearnedPatterns,
    refreshStats,
    clearCache,
    clearError
  }
}

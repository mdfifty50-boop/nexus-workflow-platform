/**
 * useToolDiscovery - React Hook for Dynamic Tool Discovery
 *
 * Provides reactive access to the tool discovery engine with:
 * - Capability-based tool search
 * - Trust score display utilities
 * - One-tap approval flow
 * - Loading states and timeout handling
 */

import { useState, useCallback, useRef } from 'react'
import { toolDiscoveryService } from '../services/ToolDiscoveryService'
import { trustScoreService } from '../services/TrustScoreService'
import type {
  Tool,
  ToolCategory,
  DiscoveredTool,
  DiscoverySearchRequest,
  DiscoverySearchResult,
  ToolTrustScore,
  RecommendationBadge,
  ToolApproval
} from '../types/tools'

interface UseToolDiscoveryOptions {
  projectId?: string
  userId?: string
  minTrustScore?: number
  includeUnapproved?: boolean
  onDiscoveryStart?: () => void
  onDiscoveryComplete?: (results: DiscoverySearchResult[]) => void
  onError?: (error: Error) => void
}

interface UseToolDiscoveryReturn {
  // Data
  results: DiscoverySearchResult[]
  approvalHistory: ToolApproval[]

  // State
  loading: boolean
  error: string | null
  isTimedOut: boolean

  // Actions
  discover: (capability: string, category?: ToolCategory) => Promise<DiscoverySearchResult[]>
  approveToolForUse: (tool: DiscoveredTool, reason?: string) => Promise<ToolApproval | null>
  rejectTool: (toolId: string, reason?: string) => Promise<void>
  addToolToCatalog: (tool: DiscoveredTool) => Promise<Tool | null>
  isToolApproved: (toolId: string) => Promise<boolean>
  refreshApprovalHistory: () => Promise<void>

  // Trust Score Utilities
  getTrustScoreDisplay: (score: ToolTrustScore) => TrustScoreDisplay
  getBadgeInfo: (badge: RecommendationBadge) => BadgeInfo

  // Clear
  clearResults: () => void
}

interface TrustScoreDisplay {
  overall: number
  color: string
  label: string
  components: {
    security: { score: number; label: string }
    reliability: { score: number; label: string }
    performance: { score: number; label: string }
    community: { score: number; label: string }
  }
}

interface BadgeInfo {
  emoji: string
  text: string
  color: string
  bgColor: string
  borderColor: string
}

export function useToolDiscovery(options: UseToolDiscoveryOptions = {}): UseToolDiscoveryReturn {
  const {
    projectId,
    userId,
    minTrustScore = 0,
    includeUnapproved = true,
    onDiscoveryStart,
    onDiscoveryComplete,
    onError
  } = options

  const [results, setResults] = useState<DiscoverySearchResult[]>([])
  const [approvalHistory, setApprovalHistory] = useState<ToolApproval[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTimedOut, setIsTimedOut] = useState(false)

  // Track ongoing discovery to prevent overlapping requests
  const discoveryInProgress = useRef(false)

  /**
   * Discover tools for a capability
   */
  const discover = useCallback(async (
    capability: string,
    category?: ToolCategory
  ): Promise<DiscoverySearchResult[]> => {
    // Prevent overlapping discoveries
    if (discoveryInProgress.current) {
      return results
    }

    discoveryInProgress.current = true
    setLoading(true)
    setError(null)
    setIsTimedOut(false)

    onDiscoveryStart?.()

    try {
      const request: DiscoverySearchRequest = {
        capability,
        category,
        minTrustScore,
        includeUnapproved
      }

      const discoveryResults = await toolDiscoveryService.discoverTools(request)
      setResults(discoveryResults)
      onDiscoveryComplete?.(discoveryResults)
      return discoveryResults
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Discovery failed'

      if (errorMessage.includes('timeout')) {
        setIsTimedOut(true)
      }

      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return []
    } finally {
      setLoading(false)
      discoveryInProgress.current = false
    }
  }, [minTrustScore, includeUnapproved, onDiscoveryStart, onDiscoveryComplete, onError, results])

  /**
   * Approve a discovered tool for use in the project
   */
  const approveToolForUse = useCallback(async (
    tool: DiscoveredTool,
    reason?: string
  ): Promise<ToolApproval | null> => {
    if (!projectId || !userId) {
      setError('Project ID and User ID are required for approval')
      return null
    }

    try {
      const approval = await toolDiscoveryService.approveDiscoveredTool(
        tool,
        projectId,
        userId,
        reason
      )

      // Refresh approval history
      await refreshApprovalHistory()

      return approval
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve tool')
      return null
    }
  }, [projectId, userId])

  /**
   * Reject a discovered tool
   */
  const rejectTool = useCallback(async (toolId: string, reason?: string): Promise<void> => {
    if (!projectId || !userId) {
      setError('Project ID and User ID are required for rejection')
      return
    }

    try {
      await toolDiscoveryService.rejectDiscoveredTool(toolId, projectId, userId, reason)
      await refreshApprovalHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject tool')
    }
  }, [projectId, userId])

  /**
   * Add an approved tool to the permanent catalog
   */
  const addToolToCatalog = useCallback(async (tool: DiscoveredTool): Promise<Tool | null> => {
    if (!userId) {
      setError('User ID is required to add tool to catalog')
      return null
    }

    try {
      return await toolDiscoveryService.addToCatalog(tool, userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tool to catalog')
      return null
    }
  }, [userId])

  /**
   * Check if a tool is approved for the current project
   */
  const isToolApproved = useCallback(async (toolId: string): Promise<boolean> => {
    if (!projectId) return false

    try {
      return await toolDiscoveryService.isToolApproved(toolId, projectId)
    } catch {
      return false
    }
  }, [projectId])

  /**
   * Refresh approval history for the project
   */
  const refreshApprovalHistory = useCallback(async (): Promise<void> => {
    if (!projectId) return

    try {
      const history = await toolDiscoveryService.getApprovalHistory(projectId, userId)
      setApprovalHistory(history)
    } catch (err) {
      console.error('[useToolDiscovery] Failed to refresh approval history:', err)
    }
  }, [projectId, userId])

  /**
   * Get display information for a trust score
   */
  const getTrustScoreDisplay = useCallback((score: ToolTrustScore): TrustScoreDisplay => {
    const getScoreColor = (value: number): string => {
      if (value >= 70) return 'green'
      if (value >= 40) return 'yellow'
      return 'red'
    }

    const getScoreLabel = (value: number): string => {
      if (value >= 90) return 'Excellent'
      if (value >= 70) return 'Good'
      if (value >= 50) return 'Fair'
      if (value >= 30) return 'Poor'
      return 'Very Poor'
    }

    return {
      overall: score.overall,
      color: getScoreColor(score.overall),
      label: getScoreLabel(score.overall),
      components: {
        security: {
          score: score.components.security,
          label: getScoreLabel(score.components.security)
        },
        reliability: {
          score: score.components.reliability,
          label: getScoreLabel(score.components.reliability)
        },
        performance: {
          score: score.components.performance,
          label: getScoreLabel(score.components.performance)
        },
        community: {
          score: score.components.community,
          label: getScoreLabel(score.components.community)
        }
      }
    }
  }, [])

  /**
   * Get display information for a recommendation badge
   */
  const getBadgeInfo = useCallback((badge: RecommendationBadge): BadgeInfo => {
    const { emoji, text, color } = trustScoreService.getBadgeDisplay(badge)

    const colorMap: Record<string, { bgColor: string; borderColor: string }> = {
      green: { bgColor: 'bg-green-100', borderColor: 'border-green-500' },
      yellow: { bgColor: 'bg-yellow-100', borderColor: 'border-yellow-500' },
      red: { bgColor: 'bg-red-100', borderColor: 'border-red-500' }
    }

    return {
      emoji,
      text,
      color,
      bgColor: colorMap[color]?.bgColor || 'bg-gray-100',
      borderColor: colorMap[color]?.borderColor || 'border-gray-500'
    }
  }, [])

  /**
   * Clear discovery results
   */
  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
    setIsTimedOut(false)
  }, [])

  return {
    results,
    approvalHistory,
    loading,
    error,
    isTimedOut,
    discover,
    approveToolForUse,
    rejectTool,
    addToolToCatalog,
    isToolApproved,
    refreshApprovalHistory,
    getTrustScoreDisplay,
    getBadgeInfo,
    clearResults
  }
}

/**
 * Hook for capability-based tool search with debouncing
 */
export function useToolDiscoverySearch(debounceMs = 500) {
  const [capability, setCapability] = useState('')
  const [results, setResults] = useState<DiscoverySearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const search = useCallback((newCapability: string) => {
    setCapability(newCapability)

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!newCapability.trim()) {
      setResults([])
      return
    }

    setLoading(true)

    timeoutRef.current = setTimeout(async () => {
      try {
        const searchResults = await toolDiscoveryService.discoverTools({
          capability: newCapability
        })
        setResults(searchResults)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, debounceMs)
  }, [debounceMs])

  const clear = useCallback(() => {
    setCapability('')
    setResults([])
    setError(null)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return {
    capability,
    search,
    results,
    loading,
    error,
    clear
  }
}

/**
 * Hook for checking if a specific tool is approved
 */
export function useToolApprovalStatus(toolId: string, projectId?: string) {
  const [isApproved, setIsApproved] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const checkApproval = useCallback(async () => {
    if (!projectId || !toolId) {
      setIsApproved(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const approved = await toolDiscoveryService.isToolApproved(toolId, projectId)
      setIsApproved(approved)
    } catch {
      setIsApproved(null)
    } finally {
      setLoading(false)
    }
  }, [toolId, projectId])

  // Check on mount and when dependencies change
  useState(() => {
    checkApproval()
  })

  return {
    isApproved,
    loading,
    refresh: checkApproval
  }
}

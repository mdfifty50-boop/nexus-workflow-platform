/**
 * useAISuggestions Hook
 *
 * Fetches AI-generated workflow suggestions from the backend.
 * These are high-quality, personalized suggestions based on user behavior
 * and pattern analysis - NOT generic recommendations.
 *
 * Quality-First Approach:
 * - Only shows suggestions with >= 85% confidence
 * - Powered by tiered LLM strategy (Haiku/Sonnet/Opus)
 * - Based on actual user activity patterns
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Types matching the backend API
export interface AISuggestion {
  id: string
  clerk_user_id: string
  suggestion_type: 'workflow_optimization' | 'new_workflow' | 'integration_suggestion' | 'usage_pattern' | 'cost_saving' | 'error_prevention'
  title: string
  description: string
  confidence: number
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'shown' | 'accepted' | 'rejected' | 'expired'
  metadata: {
    source_pattern?: string
    estimated_time_saved_minutes?: number
    estimated_cost_impact?: number
    workflow_spec?: {
      name: string
      steps: Array<{ tool: string; action: string }>
    }
    related_workflows?: string[]
    reasoning?: string
  }
  expires_at?: string
  shown_at?: string
  acted_at?: string
  created_at: string
}

export interface SuggestionStats {
  total: number
  pending: number
  shown: number
  accepted: number
  rejected: number
  acceptanceRate: number
  avgConfidence: number
  totalTimeSavedMinutes: number
  topTypes: Array<{ type: string; count: number }>
}

export interface UserIntelligence {
  automationMaturity: 'new' | 'learning' | 'intermediate' | 'advanced' | 'expert'
  primaryUseCase: string
  dataQuality: 'insufficient' | 'minimal' | 'good' | 'excellent'
  overallConfidence: number
  painPointCount: number
  opportunityCount: number
  connectedIntegrations: string[]
  topIntegrations: Array<{ toolkit: string; usage: number }>
  peakUsageHour: number
  successRate: number
  lastUpdated: string
}

export interface DetectedPattern {
  type: string
  description: string
  confidence: number
  frequency: number
  recommendation?: string
}

const API_BASE = import.meta.env.VITE_API_URL || ''

export function useAISuggestions() {
  const { user } = useAuth()
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [stats, setStats] = useState<SuggestionStats | null>(null)
  const [intelligence, setIntelligence] = useState<UserIntelligence | null>(null)
  const [patterns, setPatterns] = useState<DetectedPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Prevent duplicate fetches
  const lastFetchRef = useRef<string | null>(null)
  const fetchingRef = useRef(false)

  // Get headers with user ID
  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (user?.id) {
      headers['x-clerk-user-id'] = user.id
    }
    return headers
  }, [user?.id])

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (status?: string, limit: number = 10) => {
    const userId = user?.id
    const cacheKey = `${userId}-${status}-${limit}`

    // Prevent duplicate fetches
    if (fetchingRef.current || lastFetchRef.current === cacheKey) {
      return
    }

    try {
      fetchingRef.current = true
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (status) params.append('status', status)
      params.append('limit', limit.toString())

      const response = await fetch(`${API_BASE}/api/suggestions?${params}`, {
        headers: getHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }

      const data = await response.json()

      if (data.success) {
        setSuggestions(data.data || [])
        lastFetchRef.current = cacheKey
      } else {
        throw new Error(data.error || 'Failed to fetch suggestions')
      }
    } catch (err) {
      console.error('[useAISuggestions] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions')
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [user?.id, getHeaders])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/suggestions/stats`, {
        headers: getHeaders(),
      })

      if (!response.ok) return

      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error('[useAISuggestions] Error fetching stats:', err)
    }
  }, [getHeaders])

  // Fetch user intelligence
  const fetchIntelligence = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/suggestions/intelligence`, {
        headers: getHeaders(),
      })

      if (!response.ok) return

      const data = await response.json()
      if (data.success) {
        setIntelligence(data.data)
      }
    } catch (err) {
      console.error('[useAISuggestions] Error fetching intelligence:', err)
    }
  }, [getHeaders])

  // Fetch patterns
  const fetchPatterns = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/suggestions/patterns`, {
        headers: getHeaders(),
      })

      if (!response.ok) return

      const data = await response.json()
      if (data.success && data.data.patterns) {
        setPatterns(data.data.patterns)
      }
    } catch (err) {
      console.error('[useAISuggestions] Error fetching patterns:', err)
    }
  }, [getHeaders])

  // Record action on a suggestion
  const actOnSuggestion = useCallback(async (
    suggestionId: string,
    action: 'clicked' | 'implemented' | 'modified' | 'rejected' | 'reported',
    feedback?: { rating?: number; text?: string; modifications?: Record<string, unknown> }
  ) => {
    try {
      const response = await fetch(`${API_BASE}/api/suggestions/${suggestionId}/act`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          action,
          rating: feedback?.rating,
          feedback_text: feedback?.text,
          modifications: feedback?.modifications,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to record action')
      }

      const data = await response.json()

      if (data.success) {
        // Update local state
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === suggestionId
              ? { ...s, status: action === 'implemented' ? 'accepted' : action === 'rejected' ? 'rejected' : s.status }
              : s
          )
        )
        return { success: true }
      }

      return { success: false, error: data.error }
    } catch (err) {
      console.error('[useAISuggestions] Error acting on suggestion:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }, [getHeaders])

  // Generate new suggestions (manual trigger)
  const generateSuggestions = useCallback(async (mode: 'quick' | 'deep' = 'quick') => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE}/api/suggestions/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ mode }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate suggestions')
      }

      const data = await response.json()

      if (data.success) {
        if (data.status === 'generated' && data.data.suggestions) {
          // Refresh suggestions list
          await fetchSuggestions()
          return { success: true, generated: data.data.generated }
        } else if (data.status === 'insufficient_data') {
          return { success: false, insufficient: true, message: data.message }
        }
      }

      return { success: false, error: data.error }
    } catch (err) {
      console.error('[useAISuggestions] Error generating suggestions:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    } finally {
      setLoading(false)
    }
  }, [getHeaders, fetchSuggestions])

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchSuggestions()
      fetchStats()
    }
  }, [user?.id, fetchSuggestions, fetchStats])

  // Refresh function
  const refresh = useCallback(() => {
    lastFetchRef.current = null // Clear cache key to allow refresh
    fetchSuggestions()
    fetchStats()
  }, [fetchSuggestions, fetchStats])

  return {
    // Data
    suggestions,
    stats,
    intelligence,
    patterns,

    // State
    loading,
    error,

    // Actions
    fetchSuggestions,
    fetchStats,
    fetchIntelligence,
    fetchPatterns,
    actOnSuggestion,
    generateSuggestions,
    refresh,

    // Computed
    hasSuggestions: suggestions.length > 0,
    highConfidenceSuggestions: suggestions.filter((s) => s.confidence >= 0.9),
    pendingSuggestions: suggestions.filter((s) => s.status === 'pending' || s.status === 'shown'),
  }
}

export default useAISuggestions

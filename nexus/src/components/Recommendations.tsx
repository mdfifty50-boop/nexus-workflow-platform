/**
 * RECOMMENDATIONS COMPONENT
 *
 * Smart workflow and template recommendations based on usage patterns.
 *
 * Features:
 * - Usage-based suggestions
 * - Time-of-day recommendations
 * - Category preferences
 * - Trending workflows
 * - Personalized scores
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { workflowTemplates, type WorkflowTemplate } from '@/lib/workflow-templates'

// =============================================================================
// Types
// =============================================================================

export type RecommendationType = 'suggested' | 'trending' | 'similar' | 'new'

export interface Recommendation {
  id: string
  type: RecommendationType
  title: string
  description: string
  icon: string
  category: string
  score: number // 0-100 relevance score
  reason: string
  route?: string
  templateId?: string
  metadata?: Record<string, unknown>
}

export interface UsageStats {
  totalWorkflows: number
  recentExecutions: number
  favoriteCategories: string[]
  lastActiveTime: number
  weeklyUsage: number[]
}

interface RecommendationsProps {
  maxItems?: number
  showScore?: boolean
  showReason?: boolean
  filterType?: RecommendationType
  className?: string
  onSelect?: (recommendation: Recommendation) => void
}

// =============================================================================
// Constants
// =============================================================================

const USAGE_STATS_KEY = 'nexus_usage_stats'
const DISMISSED_KEY = 'nexus_dismissed_recommendations'

const TYPE_LABELS: Record<RecommendationType, { label: string; color: string }> = {
  suggested: { label: 'For You', color: 'cyan' },
  trending: { label: 'Trending', color: 'purple' },
  similar: { label: 'Similar', color: 'blue' },
  new: { label: 'New', color: 'green' }
}

// Recommendation reasons
const REASONS = {
  category_match: 'Based on your favorite categories',
  time_based: 'Popular at this time',
  trending: 'Trending in your industry',
  new_feature: 'New template available',
  similar_users: 'Users like you also use this',
  efficiency: 'Could save you time',
  continuation: 'Continue where you left off'
}

// =============================================================================
// Recommendation Algorithm
// =============================================================================

function calculateRecommendationScore(
  template: WorkflowTemplate,
  stats: UsageStats,
  currentHour: number
): { score: number; reason: string; type: RecommendationType } {
  let score = 50 // Base score
  let reason = REASONS.efficiency
  let type: RecommendationType = 'suggested'

  // Category preference boost (up to +30)
  if (stats.favoriteCategories.includes(template.category)) {
    score += 30
    reason = REASONS.category_match
  }

  // Time-based relevance (up to +15)
  const isWorkHours = currentHour >= 9 && currentHour <= 17
  const isMorning = currentHour >= 6 && currentHour <= 9
  const isEvening = currentHour >= 17 && currentHour <= 21

  if (isWorkHours) {
    // Business templates during work hours
    if (['sales', 'operations', 'analysis'].includes(template.category)) {
      score += 15
      reason = REASONS.time_based
    }
  } else if (isMorning || isEvening) {
    // Marketing/planning outside work hours
    if (['marketing', 'customer-service'].includes(template.category)) {
      score += 10
    }
  }

  // New user boost
  if (stats.totalWorkflows < 3) {
    // Recommend simpler templates for new users
    if (template.type === 'Simple') {
      score += 20
      type = 'suggested'
    }
  }

  // Active user - recommend advanced
  if (stats.totalWorkflows > 10 && stats.recentExecutions > 5) {
    if (template.type === 'BMAD') {
      score += 15
      reason = REASONS.efficiency
    }
  }

  // Trending calculation (simplified - random for demo)
  const trendingScore = Math.random() * 20
  if (trendingScore > 15) {
    score += 10
    type = 'trending'
    reason = REASONS.trending
  }

  // Cap score at 100
  score = Math.min(100, Math.max(0, score))

  return { score: Math.round(score), reason, type }
}

function generateRecommendations(
  templates: WorkflowTemplate[],
  stats: UsageStats,
  dismissedIds: string[]
): Recommendation[] {
  const currentHour = new Date().getHours()

  const recommendations: Recommendation[] = templates
    .filter(t => !dismissedIds.includes(t.id))
    .map(template => {
      const { score, reason, type } = calculateRecommendationScore(
        template,
        stats,
        currentHour
      )

      return {
        id: `rec-${template.id}`,
        type,
        title: template.name,
        description: template.description,
        icon: template.icon,
        category: template.category,
        score,
        reason,
        route: '/templates',
        templateId: template.id,
        metadata: {
          estimatedTime: template.estimatedTime,
          estimatedCost: template.estimatedCost
        }
      }
    })
    .sort((a, b) => b.score - a.score)

  return recommendations
}

// =============================================================================
// Hooks
// =============================================================================

function useUsageStats(): UsageStats {
  const [stats, setStats] = useState<UsageStats>({
    totalWorkflows: 0,
    recentExecutions: 0,
    favoriteCategories: [],
    lastActiveTime: Date.now(),
    weeklyUsage: [0, 0, 0, 0, 0, 0, 0]
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USAGE_STATS_KEY)
      if (stored) {
        setStats(JSON.parse(stored))
      }
    } catch {
      // Use default stats
    }
  }, [])

  return stats
}

function useDismissedRecommendations() {
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_KEY)
      if (stored) {
        setDismissed(JSON.parse(stored))
      }
    } catch {
      setDismissed([])
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => {
      const updated = [...prev, id]
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(DISMISSED_KEY)
    setDismissed([])
  }, [])

  return { dismissed, dismiss, reset }
}

// =============================================================================
// Component
// =============================================================================

export function Recommendations({
  maxItems = 6,
  showScore = false,
  showReason = true,
  filterType,
  className = '',
  onSelect
}: RecommendationsProps) {
  const navigate = useNavigate()
  const stats = useUsageStats()
  const { dismissed, dismiss, reset } = useDismissedRecommendations()

  // Generate recommendations
  const recommendations = useMemo(() => {
    let recs = generateRecommendations(workflowTemplates, stats, dismissed)

    if (filterType) {
      recs = recs.filter(r => r.type === filterType)
    }

    return recs.slice(0, maxItems)
  }, [stats, dismissed, filterType, maxItems])

  // Handle recommendation click
  const handleClick = useCallback((rec: Recommendation) => {
    if (onSelect) {
      onSelect(rec)
    } else if (rec.route) {
      navigate(rec.route)
    }
  }, [navigate, onSelect])

  // Handle dismiss
  const handleDismiss = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    dismiss(id)
  }, [dismiss])

  // Get type badge
  const getTypeBadge = (type: RecommendationType) => {
    const config = TYPE_LABELS[type]
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full bg-${config.color}-500/20 text-${config.color}-400`}>
        {config.label}
      </span>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className={`bg-slate-900 rounded-xl border border-slate-700 p-6 ${className}`}>
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Recommendations
        </h3>
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-slate-400">No recommendations available</p>
          {dismissed.length > 0 && (
            <button
              onClick={reset}
              className="mt-3 text-sm text-cyan-400 hover:text-cyan-300"
            >
              Reset dismissed recommendations
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-slate-900 rounded-xl border border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Recommended for You
        </h3>
        <button
          onClick={() => navigate('/templates')}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View all templates
        </button>
      </div>

      {/* Recommendations Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommendations.map((rec) => (
          <button
            key={rec.id}
            onClick={() => handleClick(rec)}
            className="group relative flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all text-left"
          >
            {/* Dismiss button */}
            <div
              onClick={(e) => handleDismiss(e, rec.templateId || rec.id)}
              className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition-opacity cursor-pointer"
              title="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            {/* Icon */}
            <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-xl">
              {rec.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-white truncate">{rec.title}</span>
                {getTypeBadge(rec.type)}
              </div>
              <p className="text-sm text-slate-400 line-clamp-2">{rec.description}</p>

              {/* Score & Reason */}
              <div className="flex items-center gap-3 mt-2">
                {showScore && (
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                        style={{ width: `${rec.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{rec.score}%</span>
                  </div>
                )}
                {showReason && (
                  <span className="text-xs text-slate-500">{rec.reason}</span>
                )}
              </div>

              {/* Metadata */}
              {rec.metadata && (
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  {'estimatedTime' in rec.metadata && !!rec.metadata.estimatedTime && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {String(rec.metadata.estimatedTime)}
                    </span>
                  )}
                  {'estimatedCost' in rec.metadata && !!rec.metadata.estimatedCost && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {String(rec.metadata.estimatedCost)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      {dismissed.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-800 text-center">
          <button
            onClick={reset}
            className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            {dismissed.length} dismissed - Show all
          </button>
        </div>
      )}
    </div>
  )
}

// Compact recommendations for sidebar
export function RecommendationsCompact({
  maxItems = 3,
  onSelect
}: {
  maxItems?: number
  onSelect?: (rec: Recommendation) => void
}) {
  const navigate = useNavigate()
  const stats = useUsageStats()
  const { dismissed } = useDismissedRecommendations()

  const recommendations = useMemo(() => {
    return generateRecommendations(workflowTemplates, stats, dismissed).slice(0, maxItems)
  }, [stats, dismissed, maxItems])

  const handleClick = useCallback((rec: Recommendation) => {
    if (onSelect) {
      onSelect(rec)
    } else if (rec.route) {
      navigate(rec.route)
    }
  }, [navigate, onSelect])

  if (recommendations.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide px-1">
        Suggested
      </h4>
      {recommendations.map(rec => (
        <button
          key={rec.id}
          onClick={() => handleClick(rec)}
          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
        >
          <span className="text-lg">{rec.icon}</span>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-slate-300 truncate block">{rec.title}</span>
            <span className="text-xs text-slate-500">{rec.reason}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

// Hook to use recommendations programmatically
export function useRecommendations(maxItems = 10) {
  const stats = useUsageStats()
  const { dismissed, dismiss, reset } = useDismissedRecommendations()

  const recommendations = useMemo(() => {
    return generateRecommendations(workflowTemplates, stats, dismissed).slice(0, maxItems)
  }, [stats, dismissed, maxItems])

  return {
    recommendations,
    dismissRecommendation: dismiss,
    resetDismissed: reset
  }
}

export type { RecommendationsProps }

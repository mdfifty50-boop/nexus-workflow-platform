/**
 * InsightsPanel Component
 *
 * Displays AI-generated insights and recommendations for workflow optimization.
 *
 * Features:
 * - Performance recommendations
 * - Optimization suggestions
 * - Anomaly detection alerts
 * - Trending patterns
 * - Clickable action items
 * - Filterable by severity/category
 * - Dismissible insights
 * - Loading and empty states
 */

import { useState, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  X,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  Activity,
  Filter,
  Bell,
} from 'lucide-react'
import type {
  InsightsPanelProps,
  Insight,
  InsightSeverity,
  InsightCategory,
} from './analytics-types'
import { INSIGHT_SEVERITY, INSIGHT_CATEGORY } from './analytics-types'

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MAX_ITEMS = 5

// =============================================================================
// Mock Data Generation
// =============================================================================

function generateMockInsights(): Insight[] {
  const now = new Date()

  return [
    {
      id: 'insight-1',
      title: 'Email Automation Bottleneck Detected',
      description:
        'The Email Automation Pipeline has experienced 23% slower execution times over the past week. Consider reviewing the Gmail API rate limits or optimizing batch sizes.',
      severity: INSIGHT_SEVERITY.WARNING,
      category: INSIGHT_CATEGORY.PERFORMANCE,
      actionLabel: 'View Workflow',
      actionUrl: '/workflows/email-automation',
      timestamp: new Date(now.getTime() - 3600000).toISOString(),
      isNew: true,
    },
    {
      id: 'insight-2',
      title: 'Unused Integration: Slack',
      description:
        'Your Slack integration has not been used in any workflow for 14 days. Consider disconnecting unused integrations to improve security posture.',
      severity: INSIGHT_SEVERITY.INFO,
      category: INSIGHT_CATEGORY.OPTIMIZATION,
      actionLabel: 'Manage Integrations',
      actionUrl: '/integrations',
      timestamp: new Date(now.getTime() - 7200000).toISOString(),
      isNew: true,
    },
    {
      id: 'insight-3',
      title: 'Execution Spike Anomaly',
      description:
        'Detected unusual spike of 340% in executions yesterday between 2-4 PM. This may indicate a loop in your Data Sync workflow.',
      severity: INSIGHT_SEVERITY.CRITICAL,
      category: INSIGHT_CATEGORY.ANOMALY,
      actionLabel: 'Review Logs',
      actionUrl: '/dashboard?tab=executions',
      timestamp: new Date(now.getTime() - 14400000).toISOString(),
      isNew: false,
    },
    {
      id: 'insight-4',
      title: 'Success Rate Improvement',
      description:
        'Your overall success rate has improved by 4.2% this month, reaching 96.8%. Great job optimizing your workflows!',
      severity: INSIGHT_SEVERITY.SUCCESS,
      category: INSIGHT_CATEGORY.TREND,
      timestamp: new Date(now.getTime() - 28800000).toISOString(),
      isNew: false,
    },
    {
      id: 'insight-5',
      title: 'Recommended: Add Error Handling',
      description:
        'The Invoice Processing workflow lacks retry logic. Adding automatic retries could improve its success rate by an estimated 8%.',
      severity: INSIGHT_SEVERITY.INFO,
      category: INSIGHT_CATEGORY.RECOMMENDATION,
      actionLabel: 'Edit Workflow',
      actionUrl: '/workflows/invoice-processing/edit',
      timestamp: new Date(now.getTime() - 43200000).toISOString(),
      isNew: false,
    },
    {
      id: 'insight-6',
      title: 'Peak Usage Pattern Detected',
      description:
        'Your workflows consistently peak between 9-11 AM. Consider scheduling batch operations outside peak hours to improve performance.',
      severity: INSIGHT_SEVERITY.INFO,
      category: INSIGHT_CATEGORY.TREND,
      timestamp: new Date(now.getTime() - 86400000).toISOString(),
      isNew: false,
    },
  ]
}

// =============================================================================
// Icon Components
// =============================================================================

interface SeverityIconProps {
  severity: InsightSeverity
  className?: string
}

function SeverityIconDisplay({ severity, className }: SeverityIconProps) {
  switch (severity) {
    case INSIGHT_SEVERITY.CRITICAL:
      return <AlertCircle className={className} />
    case INSIGHT_SEVERITY.WARNING:
      return <AlertTriangle className={className} />
    case INSIGHT_SEVERITY.SUCCESS:
      return <CheckCircle className={className} />
    case INSIGHT_SEVERITY.INFO:
    default:
      return <Lightbulb className={className} />
  }
}

interface CategoryIconProps {
  category: InsightCategory
  className?: string
}

function CategoryIconDisplay({ category, className }: CategoryIconProps) {
  switch (category) {
    case INSIGHT_CATEGORY.PERFORMANCE:
      return <Activity className={className} />
    case INSIGHT_CATEGORY.OPTIMIZATION:
      return <Zap className={className} />
    case INSIGHT_CATEGORY.ANOMALY:
      return <AlertTriangle className={className} />
    case INSIGHT_CATEGORY.TREND:
      return <TrendingUp className={className} />
    case INSIGHT_CATEGORY.RECOMMENDATION:
    default:
      return <Target className={className} />
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function getSeverityStyles(severity: InsightSeverity) {
  switch (severity) {
    case INSIGHT_SEVERITY.CRITICAL:
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        icon: 'text-red-400',
        badge: 'bg-red-500/20 text-red-400 border-red-500/30',
      }
    case INSIGHT_SEVERITY.WARNING:
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        icon: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      }
    case INSIGHT_SEVERITY.SUCCESS:
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        icon: 'text-emerald-400',
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      }
    case INSIGHT_SEVERITY.INFO:
    default:
      return {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/30',
        icon: 'text-cyan-400',
        badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      }
  }
}


function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / 60000)
    return `${diffMins}m ago`
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

// =============================================================================
// Sub-Components
// =============================================================================

interface InsightCardProps {
  insight: Insight
  onActionClick?: (insight: Insight) => void
  onDismiss?: (insightId: string) => void
}

function InsightCard({ insight, onActionClick, onDismiss }: InsightCardProps) {
  const styles = getSeverityStyles(insight.severity)

  const handleAction = useCallback(() => {
    onActionClick?.(insight)
  }, [onActionClick, insight])

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDismiss?.(insight.id)
    },
    [onDismiss, insight.id]
  )

  return (
    <div
      className={cn(
        'group relative p-4 rounded-lg border transition-all',
        styles.bg,
        styles.border,
        'hover:shadow-lg hover:shadow-black/20'
      )}
    >
      {/* New Badge */}
      {insight.isNew && (
        <Badge
          className={cn(
            'absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px]',
            'bg-purple-500 text-white border-0'
          )}
        >
          NEW
        </Badge>
      )}

      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className={cn(
            'absolute top-2 right-2 p-1 rounded-md',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          )}
          aria-label="Dismiss insight"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn('p-2 rounded-lg', styles.bg, 'border', styles.border)}
        >
          <SeverityIconDisplay severity={insight.severity} className={cn('w-4 h-4', styles.icon)} />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-slate-200 truncate">
              {insight.title}
            </h4>
          </div>

          <p className="text-xs text-slate-400 line-clamp-2">
            {insight.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1 px-1.5 py-0 text-[10px] border-slate-700 text-slate-400"
              >
                <CategoryIconDisplay category={insight.category} className="w-2.5 h-2.5" />
                {insight.category}
              </Badge>
              <span className="text-[10px] text-slate-500">
                {formatTimestamp(insight.timestamp)}
              </span>
            </div>

            {insight.actionLabel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAction}
                className={cn(
                  'h-6 px-2 text-xs gap-1',
                  styles.icon,
                  'hover:bg-slate-700/50'
                )}
              >
                {insight.actionLabel}
                <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface FilterButtonProps {
  label: string
  isActive: boolean
  onClick: () => void
  count?: number
}

function FilterButton({ label, isActive, onClick, count }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
        'transition-colors',
        isActive
          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded-full text-[10px]',
            isActive ? 'bg-purple-500/30' : 'bg-slate-700'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function LoadingSkeleton({ count }: { count: number }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Sparkles className="w-12 h-12 text-slate-600 mb-4" />
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        No Insights Available
      </h3>
      <p className="text-sm text-slate-500 max-w-sm">
        Run more workflows and we will generate personalized insights and
        recommendations for you.
      </p>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function InsightsPanel({
  insights: externalInsights,
  maxItems = DEFAULT_MAX_ITEMS,
  severityFilter: externalSeverityFilter,
  categoryFilter: _externalCategoryFilter,
  onActionClick,
  onDismiss,
  isLoading = false,
  className,
}: InsightsPanelProps) {
  const [internalSeverityFilter, setInternalSeverityFilter] = useState<
    InsightSeverity | null
  >(null)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const rawInsights = useMemo(() => {
    if (externalInsights && externalInsights.length > 0) {
      return externalInsights
    }
    return generateMockInsights()
  }, [externalInsights])

  const filteredInsights = useMemo(() => {
    // Compute severityFilter inside useMemo to avoid dependency issues
    const activeSeverityFilter = externalSeverityFilter ?? (internalSeverityFilter ? [internalSeverityFilter] : undefined)

    let filtered = rawInsights.filter(
      (insight) => !dismissedIds.has(insight.id)
    )

    if (activeSeverityFilter && activeSeverityFilter.length > 0) {
      filtered = filtered.filter((insight) =>
        activeSeverityFilter.includes(insight.severity)
      )
    }

    return filtered.slice(0, maxItems)
  }, [rawInsights, dismissedIds, externalSeverityFilter, internalSeverityFilter, maxItems])

  const severityCounts = useMemo(() => {
    const activeInsights = rawInsights.filter(
      (insight) => !dismissedIds.has(insight.id)
    )
    return {
      all: activeInsights.length,
      critical: activeInsights.filter(
        (i) => i.severity === INSIGHT_SEVERITY.CRITICAL
      ).length,
      warning: activeInsights.filter(
        (i) => i.severity === INSIGHT_SEVERITY.WARNING
      ).length,
      info: activeInsights.filter((i) => i.severity === INSIGHT_SEVERITY.INFO)
        .length,
      success: activeInsights.filter(
        (i) => i.severity === INSIGHT_SEVERITY.SUCCESS
      ).length,
    }
  }, [rawInsights, dismissedIds])

  const newInsightsCount = useMemo(
    () =>
      rawInsights.filter(
        (insight) => insight.isNew && !dismissedIds.has(insight.id)
      ).length,
    [rawInsights, dismissedIds]
  )

  const handleDismiss = useCallback(
    (insightId: string) => {
      setDismissedIds((prev) => new Set([...prev, insightId]))
      onDismiss?.(insightId)
    },
    [onDismiss]
  )

  const handleSeverityFilter = useCallback((severity: InsightSeverity | null) => {
    setInternalSeverityFilter(severity)
  }, [])

  if (isLoading) {
    return <LoadingSkeleton count={maxItems} />
  }

  const isEmpty = filteredInsights.length === 0 && severityCounts.all === 0

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Insights
              {newInsightsCount > 0 && (
                <Badge className="bg-purple-500 text-white border-0 text-xs">
                  {newInsightsCount} new
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Personalized recommendations and alerts
            </CardDescription>
          </div>

          {!isEmpty && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                handleSeverityFilter(internalSeverityFilter ? null : INSIGHT_SEVERITY.WARNING)
              }
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          )}
        </div>

        {/* Filter Pills */}
        {!isEmpty && internalSeverityFilter !== null && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50 overflow-x-auto">
            <FilterButton
              label="All"
              isActive={internalSeverityFilter === null}
              onClick={() => handleSeverityFilter(null)}
              count={severityCounts.all}
            />
            <FilterButton
              label="Critical"
              isActive={internalSeverityFilter === INSIGHT_SEVERITY.CRITICAL}
              onClick={() => handleSeverityFilter(INSIGHT_SEVERITY.CRITICAL)}
              count={severityCounts.critical}
            />
            <FilterButton
              label="Warning"
              isActive={internalSeverityFilter === INSIGHT_SEVERITY.WARNING}
              onClick={() => handleSeverityFilter(INSIGHT_SEVERITY.WARNING)}
              count={severityCounts.warning}
            />
            <FilterButton
              label="Info"
              isActive={internalSeverityFilter === INSIGHT_SEVERITY.INFO}
              onClick={() => handleSeverityFilter(INSIGHT_SEVERITY.INFO)}
              count={severityCounts.info}
            />
            <FilterButton
              label="Success"
              isActive={internalSeverityFilter === INSIGHT_SEVERITY.SUCCESS}
              onClick={() => handleSeverityFilter(INSIGHT_SEVERITY.SUCCESS)}
              count={severityCounts.success}
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isEmpty ? (
          <EmptyState />
        ) : filteredInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">
              No insights match the current filter
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSeverityFilter(null)}
              className="mt-2"
            >
              Clear filter
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onActionClick={onActionClick}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}

        {/* View All Link */}
        {filteredInsights.length > 0 &&
          filteredInsights.length < severityCounts.all && (
            <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-purple-400 hover:text-purple-300 gap-1"
              >
                View all {severityCounts.all} insights
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
      </CardContent>
    </Card>
  )
}

export default InsightsPanel

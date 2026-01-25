import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface RateLimitInfo {
  integrationId: string
  integrationName: string
  integrationIcon: string
  limits: {
    endpoint: string
    limit: number
    remaining: number
    resetAt: string
    period: 'minute' | 'hour' | 'day' | 'month'
  }[]
  aggregated: {
    usedPercentage: number
    totalLimit: number
    totalUsed: number
    resetAt: string
  }
}

interface RateLimitStatusProps {
  rateLimits: RateLimitInfo[]
  onRefresh: () => Promise<void>
  warningThreshold?: number // Percentage at which to warn (default 80)
  criticalThreshold?: number // Percentage at which to show critical (default 95)
}

// Status colors based on usage
const getUsageStatus = (percentage: number, warning: number, critical: number) => {
  if (percentage >= critical) return 'critical'
  if (percentage >= warning) return 'warning'
  return 'normal'
}

const STATUS_STYLES = {
  normal: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    bar: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    bar: 'bg-amber-500',
  },
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    bar: 'bg-red-500',
  },
}

export function RateLimitStatus({
  rateLimits,
  onRefresh,
  warningThreshold = 80,
  criticalThreshold = 95,
}: RateLimitStatusProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [timeUntilReset, setTimeUntilReset] = useState<Record<string, string>>({})

  // Update countdown timers
  useEffect(() => {
    const updateTimers = () => {
      const newTimes: Record<string, string> = {}

      rateLimits.forEach((limit) => {
        const resetTime = new Date(limit.aggregated.resetAt).getTime()
        const now = Date.now()
        const diff = resetTime - now

        if (diff <= 0) {
          newTimes[limit.integrationId] = 'Resetting...'
        } else if (diff < 60000) {
          newTimes[limit.integrationId] = `${Math.floor(diff / 1000)}s`
        } else if (diff < 3600000) {
          newTimes[limit.integrationId] = `${Math.floor(diff / 60000)}m`
        } else {
          newTimes[limit.integrationId] = `${Math.floor(diff / 3600000)}h`
        }
      })

      setTimeUntilReset(newTimes)
    }

    updateTimers()
    const interval = setInterval(updateTimers, 1000)
    return () => clearInterval(interval)
  }, [rateLimits])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  // Calculate overall status
  const overallUsage = rateLimits.length > 0
    ? rateLimits.reduce((acc, r) => acc + r.aggregated.usedPercentage, 0) / rateLimits.length
    : 0

  const overallStatus = getUsageStatus(overallUsage, warningThreshold, criticalThreshold)

  // Sort by usage percentage (highest first)
  const sortedLimits = [...rateLimits].sort(
    (a, b) => b.aggregated.usedPercentage - a.aggregated.usedPercentage
  )

  // Find integrations approaching limits
  const approachingLimits = rateLimits.filter(
    (r) => r.aggregated.usedPercentage >= warningThreshold
  )

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatPeriod = (period: string) => {
    switch (period) {
      case 'minute':
        return '/min'
      case 'hour':
        return '/hr'
      case 'day':
        return '/day'
      case 'month':
        return '/mo'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Rate Limits</h2>
          <p className="text-sm text-muted-foreground">
            Monitor API usage across your integrations
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Refreshing...
            </>
          ) : (
            'Refresh'
          )}
        </Button>
      </div>

      {/* Alert for approaching limits */}
      {approachingLimits.length > 0 && (
        <div className="p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700">
          <div className="flex items-start gap-3">
            <span className="text-2xl">!</span>
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">
                Rate Limits Approaching
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                {approachingLimits.length} integration{approachingLimits.length > 1 ? 's are' : ' is'}{' '}
                approaching rate limits:
              </p>
              <ul className="mt-2 space-y-1">
                {approachingLimits.map((limit) => (
                  <li key={limit.integrationId} className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <span>{limit.integrationIcon}</span>
                    <span>{limit.integrationName}</span>
                    <span className="font-mono">
                      ({limit.aggregated.usedPercentage.toFixed(0)}% used)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Overall usage summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="text-sm text-muted-foreground mb-1">Total Integrations</div>
          <span className="text-2xl font-bold">{rateLimits.length}</span>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="text-sm text-muted-foreground mb-1">Avg. Usage</div>
          <span className={`text-2xl font-bold ${STATUS_STYLES[overallStatus].text}`}>
            {overallUsage.toFixed(0)}%
          </span>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="text-sm text-muted-foreground mb-1">At Warning</div>
          <span className="text-2xl font-bold text-amber-600">
            {rateLimits.filter((r) => {
              const status = getUsageStatus(r.aggregated.usedPercentage, warningThreshold, criticalThreshold)
              return status === 'warning'
            }).length}
          </span>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="text-sm text-muted-foreground mb-1">Critical</div>
          <span className="text-2xl font-bold text-red-600">
            {rateLimits.filter((r) => {
              const status = getUsageStatus(r.aggregated.usedPercentage, warningThreshold, criticalThreshold)
              return status === 'critical'
            }).length}
          </span>
        </div>
      </div>

      {/* Integration list */}
      <div className="space-y-3">
        {sortedLimits.map((limit) => {
          const status = getUsageStatus(
            limit.aggregated.usedPercentage,
            warningThreshold,
            criticalThreshold
          )
          const styles = STATUS_STYLES[status]
          const isExpanded = expandedId === limit.integrationId

          return (
            <div
              key={limit.integrationId}
              className={`rounded-lg border transition-all ${
                status === 'critical'
                  ? 'border-red-300 dark:border-red-800'
                  : status === 'warning'
                    ? 'border-amber-300 dark:border-amber-800'
                    : 'border-border'
              } bg-card`}
            >
              {/* Main row */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : limit.integrationId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{limit.integrationIcon}</span>
                    <div>
                      <h4 className="font-medium">{limit.integrationName}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {formatNumber(limit.aggregated.totalUsed)} /{' '}
                          {formatNumber(limit.aggregated.totalLimit)} requests
                        </span>
                        <span className="text-muted-foreground/50">|</span>
                        <span>
                          Resets in {timeUntilReset[limit.integrationId] || '...'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`text-lg font-bold ${styles.text}`}>
                        {limit.aggregated.usedPercentage.toFixed(0)}%
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">used</span>
                    </div>
                    <span
                      className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      v
                    </span>
                  </div>
                </div>

                {/* Usage bar */}
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${styles.bar}`}
                    style={{ width: `${Math.min(limit.aggregated.usedPercentage, 100)}%` }}
                  />
                </div>

                {/* Threshold markers */}
                <div className="relative mt-1 h-2">
                  <div
                    className="absolute h-3 w-0.5 bg-amber-500 -top-2"
                    style={{ left: `${warningThreshold}%` }}
                    title={`Warning threshold (${warningThreshold}%)`}
                  />
                  <div
                    className="absolute h-3 w-0.5 bg-red-500 -top-2"
                    style={{ left: `${criticalThreshold}%` }}
                    title={`Critical threshold (${criticalThreshold}%)`}
                  />
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4">
                  <h5 className="text-sm font-medium text-muted-foreground mb-3">
                    Endpoint Breakdown
                  </h5>
                  <div className="space-y-3">
                    {limit.limits.map((endpointLimit, index) => {
                      const endpointUsage =
                        ((endpointLimit.limit - endpointLimit.remaining) / endpointLimit.limit) *
                        100
                      const endpointStatus = getUsageStatus(
                        endpointUsage,
                        warningThreshold,
                        criticalThreshold
                      )
                      const endpointStyles = STATUS_STYLES[endpointStatus]

                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <code className="px-2 py-0.5 bg-muted rounded text-xs">
                              {endpointLimit.endpoint}
                            </code>
                            <span className={endpointStyles.text}>
                              {endpointLimit.limit - endpointLimit.remaining} /{' '}
                              {endpointLimit.limit}
                              {formatPeriod(endpointLimit.period)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${endpointStyles.bar}`}
                              style={{ width: `${Math.min(endpointUsage, 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {rateLimits.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
          <div className="text-4xl mb-3">{"<->"}</div>
          <h3 className="font-medium mb-1">No rate limit data</h3>
          <p className="text-sm text-muted-foreground">
            Connect integrations to monitor their API usage
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Normal (&lt;{warningThreshold}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>Warning ({warningThreshold}-{criticalThreshold}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Critical (&gt;{criticalThreshold}%)</span>
        </div>
      </div>
    </div>
  )
}

// Compact badge for use in headers/navbars
export function RateLimitBadge({
  rateLimits,
  warningThreshold = 80,
  criticalThreshold = 95,
}: {
  rateLimits: RateLimitInfo[]
  warningThreshold?: number
  criticalThreshold?: number
}) {
  const criticalCount = rateLimits.filter(
    (r) => r.aggregated.usedPercentage >= criticalThreshold
  ).length

  const warningCount = rateLimits.filter((r) => {
    const pct = r.aggregated.usedPercentage
    return pct >= warningThreshold && pct < criticalThreshold
  }).length

  if (criticalCount === 0 && warningCount === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-1">
      {criticalCount > 0 && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
          {criticalCount} critical
        </span>
      )}
      {warningCount > 0 && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
          {warningCount} warning
        </span>
      )}
    </div>
  )
}

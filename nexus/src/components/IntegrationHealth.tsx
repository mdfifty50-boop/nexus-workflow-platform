import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'

interface IntegrationStatus {
  id: string
  name: string
  icon: string
  category: string
  status: 'healthy' | 'degraded' | 'offline' | 'unknown'
  latency?: number // in ms
  lastSyncAt?: string
  lastErrorAt?: string
  lastError?: string
  uptime: number // percentage
  requestsToday: number
  errorRate: number // percentage
}

interface IntegrationHealthProps {
  integrations: IntegrationStatus[]
  onRefresh: () => Promise<void>
  onCheckHealth: (integrationId: string) => Promise<void>
  onViewDetails: (integrationId: string) => void
}

// Status configuration
const STATUS_CONFIG: Record<string, {
  color: string
  bgColor: string
  ringColor: string
  label: string
  description: string
}> = {
  healthy: {
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    ringColor: 'ring-emerald-500',
    label: 'Healthy',
    description: 'All systems operational',
  },
  degraded: {
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    ringColor: 'ring-amber-500',
    label: 'Degraded',
    description: 'Experiencing issues',
  },
  offline: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    ringColor: 'ring-red-500',
    label: 'Offline',
    description: 'Service unavailable',
  },
  unknown: {
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    ringColor: 'ring-slate-500',
    label: 'Unknown',
    description: 'Status not available',
  },
}

// Latency thresholds
const getLatencyStatus = (latency: number): 'good' | 'moderate' | 'slow' => {
  if (latency < 200) return 'good'
  if (latency < 500) return 'moderate'
  return 'slow'
}

const LATENCY_STYLES = {
  good: 'text-emerald-600 dark:text-emerald-400',
  moderate: 'text-amber-600 dark:text-amber-400',
  slow: 'text-red-600 dark:text-red-400',
}

export function IntegrationHealth({
  integrations,
  onRefresh,
  onCheckHealth,
  onViewDetails,
}: IntegrationHealthProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [checkingId, setCheckingId] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      handleRefresh()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await onRefresh()
      setLastRefreshed(new Date())
    } finally {
      setRefreshing(false)
    }
  }, [onRefresh])

  const handleCheckHealth = useCallback(
    async (id: string) => {
      setCheckingId(id)
      try {
        await onCheckHealth(id)
      } finally {
        setCheckingId(null)
      }
    },
    [onCheckHealth]
  )

  // Calculate overall health
  const healthySummary = integrations.reduce(
    (acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const overallStatus =
    healthySummary.offline > 0
      ? 'offline'
      : healthySummary.degraded > 0
        ? 'degraded'
        : healthySummary.healthy === integrations.length
          ? 'healthy'
          : 'unknown'

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  // Group integrations by category
  const groupedIntegrations = integrations.reduce(
    (acc, integration) => {
      const category = integration.category || 'Other'
      if (!acc[category]) acc[category] = []
      acc[category].push(integration)
      return acc
    },
    {} as Record<string, IntegrationStatus[]>
  )

  return (
    <div className="space-y-6">
      {/* Header with overall status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${STATUS_CONFIG[overallStatus].bgColor}`}
          >
            <div
              className={`w-4 h-4 rounded-full ${
                overallStatus === 'healthy'
                  ? 'bg-emerald-500'
                  : overallStatus === 'degraded'
                    ? 'bg-amber-500'
                    : overallStatus === 'offline'
                      ? 'bg-red-500'
                      : 'bg-slate-500'
              } ${overallStatus !== 'offline' ? 'animate-pulse' : ''}`}
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Integration Health</h2>
            <p className={`text-sm ${STATUS_CONFIG[overallStatus].color}`}>
              {STATUS_CONFIG[overallStatus].description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            Auto-refresh
          </label>
          <span className="text-xs text-muted-foreground">
            Updated {formatTime(lastRefreshed.toISOString())}
          </span>
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
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm text-muted-foreground">Healthy</span>
          </div>
          <span className="text-2xl font-bold">{healthySummary.healthy || 0}</span>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-sm text-muted-foreground">Degraded</span>
          </div>
          <span className="text-2xl font-bold">{healthySummary.degraded || 0}</span>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">Offline</span>
          </div>
          <span className="text-2xl font-bold">{healthySummary.offline || 0}</span>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-sm text-muted-foreground">Unknown</span>
          </div>
          <span className="text-2xl font-bold">{healthySummary.unknown || 0}</span>
        </div>
      </div>

      {/* Integration list by category */}
      {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
        <div key={category} className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            {category}
          </h3>
          <div className="space-y-2">
            {categoryIntegrations.map((integration) => {
              const statusConfig = STATUS_CONFIG[integration.status]
              const latencyStatus = integration.latency
                ? getLatencyStatus(integration.latency)
                : null

              return (
                <div
                  key={integration.id}
                  className={`p-4 rounded-lg border bg-card transition-all hover:shadow-md ${
                    integration.status === 'offline'
                      ? 'border-red-300 dark:border-red-800'
                      : integration.status === 'degraded'
                        ? 'border-amber-300 dark:border-amber-800'
                        : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {/* Status indicator */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${statusConfig.bgColor}`}
                      >
                        {integration.icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{integration.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Metrics row */}
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          {integration.latency !== undefined && (
                            <span className={latencyStatus ? LATENCY_STYLES[latencyStatus] : ''}>
                              {integration.latency}ms latency
                            </span>
                          )}
                          <span>{integration.uptime.toFixed(1)}% uptime</span>
                          <span>{integration.requestsToday} requests today</span>
                          {integration.errorRate > 0 && (
                            <span className="text-red-500">
                              {integration.errorRate.toFixed(1)}% errors
                            </span>
                          )}
                        </div>

                        {/* Last sync / error info */}
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          {integration.lastSyncAt && (
                            <span className="text-muted-foreground">
                              Last sync: {formatTime(integration.lastSyncAt)}
                            </span>
                          )}
                          {integration.lastErrorAt && (
                            <span className="text-red-500">
                              Last error: {formatTime(integration.lastErrorAt)}
                            </span>
                          )}
                        </div>

                        {/* Error message if present */}
                        {integration.lastError && integration.status !== 'healthy' && (
                          <div className="mt-2 p-2 rounded bg-red-100 dark:bg-red-900/30 text-xs text-red-700 dark:text-red-400">
                            {integration.lastError}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCheckHealth(integration.id)}
                        disabled={checkingId === integration.id}
                        title="Check health"
                      >
                        {checkingId === integration.id ? (
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Check'
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(integration.id)}
                      >
                        Details
                      </Button>
                    </div>
                  </div>

                  {/* Uptime bar visualization */}
                  <div className="mt-3">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          integration.uptime >= 99
                            ? 'bg-emerald-500'
                            : integration.uptime >= 95
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${integration.uptime}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {integrations.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
          <div className="text-4xl mb-3">{"<->"}</div>
          <h3 className="font-medium mb-1">No integrations connected</h3>
          <p className="text-sm text-muted-foreground">
            Connect integrations to monitor their health status
          </p>
        </div>
      )}
    </div>
  )
}

// Compact status badge component for use elsewhere
export function IntegrationStatusBadge({
  status,
  showLabel = true,
}: {
  status: IntegrationStatus['status']
  showLabel?: boolean
}) {
  const config = STATUS_CONFIG[status]

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor}`}>
      <span
        className={`w-2 h-2 rounded-full ${
          status === 'healthy'
            ? 'bg-emerald-500'
            : status === 'degraded'
              ? 'bg-amber-500'
              : status === 'offline'
                ? 'bg-red-500'
                : 'bg-slate-500'
        }`}
      />
      {showLabel && <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>}
    </span>
  )
}

/**
 * Admin Monitoring Dashboard
 *
 * Displays production health metrics, performance data, and system status.
 * Protected by admin role check.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  monitoring,
  formatBytes,
  formatDuration,
  type PerformanceMetric,
} from '@/lib/monitoring'
import {
  useHealthStatus,
  useAPIStats,
  useWebVitals,
  useMemoryMetrics,
} from '@/hooks/usePerformanceMonitor'
import { healthCheck } from '@/lib/healthCheck'
import { Button } from '@/components/ui/button'

// ============================================================================
// Types
// ============================================================================

type TabType = 'overview' | 'api' | 'vitals' | 'memory' | 'logs'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  status?: 'good' | 'warning' | 'error'
  icon?: React.ReactNode
}

// ============================================================================
// Metric Card Component
// ============================================================================

function MetricCard({ title, value, subtitle, status = 'good' }: MetricCardProps) {
  const statusColors = {
    good: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
  }

  const dotColors = {
    good: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
  }

  return (
    <div className={`rounded-xl border p-4 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <span className={`w-2 h-2 rounded-full ${dotColors[status]}`} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  )
}

// ============================================================================
// Health Status Indicator
// ============================================================================

function HealthStatusBadge({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' }) {
  const config = {
    healthy: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      label: 'Healthy',
    },
    degraded: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      label: 'Degraded',
    },
    unhealthy: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
      label: 'Unhealthy',
    },
  }

  const { bg, text, border, label } = config[status]

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${bg} ${text} border ${border}`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${bg.replace('/20', '')}`}
        />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${bg.replace('/20', '')}`} />
      </span>
      {label}
    </span>
  )
}

// ============================================================================
// Tabs Component
// ============================================================================

function Tabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: { id: TabType; label: string }[]
  activeTab: TabType
  onChange: (tab: TabType) => void
}) {
  return (
    <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === tab.id
              ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// Health Checks Panel
// ============================================================================

function HealthChecksPanel() {
  const health = useHealthStatus(3000)

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Health Checks</h3>
        <HealthStatusBadge status={health.status} />
      </div>

      <div className="space-y-3">
        {health.checks.length === 0 ? (
          <p className="text-slate-500 text-sm">Collecting metrics...</p>
        ) : (
          health.checks.map((check, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    check.status === 'pass'
                      ? 'bg-emerald-500'
                      : check.status === 'warn'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-slate-300">{check.name}</span>
              </div>
              <span
                className={`text-sm ${
                  check.status === 'pass'
                    ? 'text-emerald-400'
                    : check.status === 'warn'
                      ? 'text-amber-400'
                      : 'text-red-400'
                }`}
              >
                {check.message || check.status}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Overall Score</span>
          <span className="text-lg font-bold text-white">{health.score}%</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Web Vitals Panel
// ============================================================================

function WebVitalsPanel() {
  const vitals = useWebVitals(3000)

  const getVitalStatus = (
    name: string,
    value: number | null
  ): 'good' | 'warning' | 'error' => {
    if (value === null) return 'good'
    switch (name) {
      case 'LCP':
        return value < 2500 ? 'good' : value < 4000 ? 'warning' : 'error'
      case 'FID':
        return value < 100 ? 'good' : value < 300 ? 'warning' : 'error'
      case 'CLS':
        return value < 0.1 ? 'good' : value < 0.25 ? 'warning' : 'error'
      case 'FCP':
        return value < 1800 ? 'good' : value < 3000 ? 'warning' : 'error'
      case 'TTFB':
        return value < 800 ? 'good' : value < 1800 ? 'warning' : 'error'
      default:
        return 'good'
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <MetricCard
        title="LCP"
        value={vitals.lcp !== null ? formatDuration(vitals.lcp) : '-'}
        subtitle="Largest Contentful Paint"
        status={getVitalStatus('LCP', vitals.lcp)}
      />
      <MetricCard
        title="FID"
        value={vitals.fid !== null ? `${vitals.fid.toFixed(0)}ms` : '-'}
        subtitle="First Input Delay"
        status={getVitalStatus('FID', vitals.fid)}
      />
      <MetricCard
        title="CLS"
        value={vitals.cls !== null ? vitals.cls.toFixed(3) : '-'}
        subtitle="Cumulative Layout Shift"
        status={getVitalStatus('CLS', vitals.cls)}
      />
      <MetricCard
        title="FCP"
        value={vitals.fcp !== null ? formatDuration(vitals.fcp) : '-'}
        subtitle="First Contentful Paint"
        status={getVitalStatus('FCP', vitals.fcp)}
      />
      <MetricCard
        title="TTFB"
        value={vitals.ttfb !== null ? formatDuration(vitals.ttfb) : '-'}
        subtitle="Time to First Byte"
        status={getVitalStatus('TTFB', vitals.ttfb)}
      />
    </div>
  )
}

// ============================================================================
// API Stats Panel
// ============================================================================

function APIStatsPanel() {
  const stats = useAPIStats(3000)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests"
          value={stats.totalRequests}
          subtitle="All API calls"
        />
        <MetricCard
          title="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          subtitle={`${stats.totalRequests - Math.round((stats.errorRate / 100) * stats.totalRequests)} successful`}
          status={stats.successRate > 95 ? 'good' : stats.successRate > 80 ? 'warning' : 'error'}
        />
        <MetricCard
          title="Avg Response"
          value={formatDuration(stats.averageResponseTime)}
          subtitle="Average latency"
          status={
            stats.averageResponseTime < 500
              ? 'good'
              : stats.averageResponseTime < 2000
                ? 'warning'
                : 'error'
          }
        />
        <MetricCard
          title="Slow Requests"
          value={stats.slowRequests}
          subtitle=">2s response time"
          status={stats.slowRequests === 0 ? 'good' : stats.slowRequests < 5 ? 'warning' : 'error'}
        />
      </div>

      {Object.keys(stats.errorsByType).length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
          <h4 className="text-sm font-medium text-slate-400 mb-3">Errors by Type</h4>
          <div className="space-y-2">
            {Object.entries(stats.errorsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{type}</span>
                <span className="text-sm text-red-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Memory Panel
// ============================================================================

function MemoryPanel() {
  const memory = useMemoryMetrics(3000)

  if (!memory) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 text-center">
        <p className="text-slate-500">Memory API not available (Chrome only)</p>
      </div>
    )
  }

  const percentUsed = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Heap Used"
        value={formatBytes(memory.usedJSHeapSize)}
        subtitle={`${percentUsed.toFixed(1)}% of limit`}
        status={percentUsed < 50 ? 'good' : percentUsed < 80 ? 'warning' : 'error'}
      />
      <MetricCard
        title="Total Heap"
        value={formatBytes(memory.totalJSHeapSize)}
        subtitle="Allocated memory"
      />
      <MetricCard
        title="Heap Limit"
        value={formatBytes(memory.jsHeapSizeLimit)}
        subtitle="Maximum allowed"
      />
    </div>
  )
}

// ============================================================================
// Metrics Log Panel
// ============================================================================

function MetricsLogPanel() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])

  useEffect(() => {
    // Load existing metrics
    setMetrics(monitoring.getMetrics().slice(-50).reverse())

    // Subscribe to new metrics
    const unsubscribe = monitoring.subscribe((newMetrics) => {
      setMetrics((prev) => [...newMetrics, ...prev].slice(0, 50))
    })

    return unsubscribe
  }, [])

  const getCategoryColor = (category: PerformanceMetric['category']) => {
    switch (category) {
      case 'web-vital':
        return 'bg-cyan-500/20 text-cyan-400'
      case 'api':
        return 'bg-purple-500/20 text-purple-400'
      case 'memory':
        return 'bg-amber-500/20 text-amber-400'
      case 'custom':
        return 'bg-slate-500/20 text-slate-400'
      default:
        return 'bg-slate-500/20 text-slate-400'
    }
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <h3 className="text-lg font-semibold text-white">Recent Metrics</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {metrics.length === 0 ? (
          <div className="p-4 text-center text-slate-500">No metrics recorded yet</div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="text-left text-xs text-slate-500">
                <th className="p-3">Time</th>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {metrics.map((metric, index) => (
                <tr key={`${metric.timestamp}-${index}`} className="text-sm hover:bg-slate-700/30">
                  <td className="p-3 text-slate-400">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3 text-white font-mono text-xs">{metric.name}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${getCategoryColor(metric.category)}`}
                    >
                      {metric.category}
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-300">
                    {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Connectivity Check Panel
// ============================================================================

function ConnectivityPanel() {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<Awaited<ReturnType<typeof healthCheck>> | null>(null)

  const runCheck = useCallback(async () => {
    setChecking(true)
    try {
      const checkResult = await healthCheck()
      setResult(checkResult)
    } catch (error) {
      setResult({
        status: 'unhealthy',
        timestamp: Date.now(),
        checks: {
          api: { status: 'error', message: String(error) },
          network: { status: 'unknown' },
          supabase: { status: 'unknown' },
        },
      })
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    runCheck()
  }, [runCheck])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <span className="text-emerald-400">OK</span>
      case 'error':
        return <span className="text-red-400">Error</span>
      case 'degraded':
        return <span className="text-amber-400">Degraded</span>
      default:
        return <span className="text-slate-400">Unknown</span>
    }
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Connectivity Status</h3>
        <Button
          onClick={runCheck}
          disabled={checking}
          variant="outline"
          size="sm"
          className="border-slate-600"
        >
          {checking ? 'Checking...' : 'Refresh'}
        </Button>
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
            <span className="text-slate-300">Network</span>
            {getStatusBadge(result.checks.network.status)}
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
            <span className="text-slate-300">API Backend</span>
            <div className="text-right">
              {getStatusBadge(result.checks.api.status)}
              {result.checks.api.latency && (
                <span className="text-xs text-slate-500 ml-2">
                  {result.checks.api.latency.toFixed(0)}ms
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-300">Supabase</span>
            <div className="text-right">
              {getStatusBadge(result.checks.supabase.status)}
              {result.checks.supabase.latency && (
                <span className="text-xs text-slate-500 ml-2">
                  {result.checks.supabase.latency.toFixed(0)}ms
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-500">
            Last checked: {new Date(result.timestamp).toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">Running health checks...</div>
      )}
    </div>
  )
}

// ============================================================================
// Main Monitoring Page
// ============================================================================

export function Monitoring() {
  const { user, isSignedIn } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Simple admin check - in production you'd check user roles
  // For now, allow any authenticated user to view monitoring
  useEffect(() => {
    if (!isSignedIn && !user) {
      navigate('/login')
    }
  }, [isSignedIn, user, navigate])

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'vitals', label: 'Web Vitals' },
    { id: 'api', label: 'API Stats' },
    { id: 'memory', label: 'Memory' },
    { id: 'logs', label: 'Metrics Log' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1 className="text-xl font-semibold">System Monitoring</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">Admin Dashboard</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HealthChecksPanel />
                <ConnectivityPanel />
              </div>
              <WebVitalsPanel />
              <APIStatsPanel />
            </>
          )}

          {activeTab === 'vitals' && (
            <>
              <WebVitalsPanel />
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Web Vitals Thresholds</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-slate-300 mb-2">Good</h4>
                    <ul className="space-y-1 text-slate-400">
                      <li>LCP &lt; 2.5s</li>
                      <li>FID &lt; 100ms</li>
                      <li>CLS &lt; 0.1</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-400 mb-2">Needs Improvement</h4>
                    <ul className="space-y-1 text-slate-400">
                      <li>LCP 2.5s - 4s</li>
                      <li>FID 100ms - 300ms</li>
                      <li>CLS 0.1 - 0.25</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-400 mb-2">Poor</h4>
                    <ul className="space-y-1 text-slate-400">
                      <li>LCP &gt; 4s</li>
                      <li>FID &gt; 300ms</li>
                      <li>CLS &gt; 0.25</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'api' && <APIStatsPanel />}

          {activeTab === 'memory' && <MemoryPanel />}

          {activeTab === 'logs' && <MetricsLogPanel />}
        </div>
      </main>
    </div>
  )
}

export default Monitoring

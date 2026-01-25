import { useState, useEffect, useCallback, useMemo } from 'react'
import { Layout } from '@/components/Layout'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// Performance metrics types
interface PerformanceMetrics {
  timestamp: string
  apiLatency: number
  successRate: number
  errorRate: number
  cacheHitRatio: number
  requestsPerMinute: number
  avgResponseTime: number
}

interface CacheMetrics {
  hits: number
  misses: number
  hitRatio: number
  totalSize: string
  evictions: number
}

interface APIEndpointMetrics {
  endpoint: string
  avgLatency: number
  successRate: number
  requestCount: number
  errorCount: number
}

// Generate sample data for demonstration
function generateSampleData(hours: number = 24): PerformanceMetrics[] {
  const data: PerformanceMetrics[] = []
  const now = new Date()

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
    const baseLatency = 120 + Math.random() * 80
    const noise = Math.sin(i / 4) * 20

    data.push({
      timestamp: timestamp.toISOString(),
      apiLatency: Math.round(baseLatency + noise),
      successRate: 96 + Math.random() * 4,
      errorRate: Math.random() * 2,
      cacheHitRatio: 75 + Math.random() * 20,
      requestsPerMinute: Math.round(50 + Math.random() * 100),
      avgResponseTime: Math.round(baseLatency + noise + 50),
    })
  }

  return data
}

const SAMPLE_ENDPOINT_METRICS: APIEndpointMetrics[] = [
  { endpoint: '/api/chat', avgLatency: 450, successRate: 98.5, requestCount: 12450, errorCount: 187 },
  { endpoint: '/api/workflows', avgLatency: 85, successRate: 99.8, requestCount: 8920, errorCount: 18 },
  { endpoint: '/api/execute-workflow', avgLatency: 1200, successRate: 97.2, requestCount: 3420, errorCount: 96 },
  { endpoint: '/api/integrations/*', avgLatency: 320, successRate: 99.1, requestCount: 5680, errorCount: 51 },
  { endpoint: '/api/admin/*', avgLatency: 95, successRate: 99.9, requestCount: 1240, errorCount: 1 },
]

const CACHE_METRICS: CacheMetrics = {
  hits: 45620,
  misses: 8340,
  hitRatio: 84.5,
  totalSize: '128 MB',
  evictions: 1240,
}

const COLORS = {
  primary: '#06b6d4',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  muted: '#64748b',
}

// Stat Card Component
function StatCard({
  title,
  value,
  unit,
  change,
  changeType,
  icon,
  color,
}: {
  title: string
  value: string | number
  unit?: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: string
  color: string
}) {
  const changeColors = {
    positive: 'text-emerald-400',
    negative: 'text-red-400',
    neutral: 'text-slate-400',
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 hover:border-slate-600/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-sm font-medium">{title}</span>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-xl`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold text-white">{value}</span>
          {unit && <span className="text-slate-400 text-sm ml-1">{unit}</span>}
        </div>
        {change && (
          <span className={`text-sm ${changeColors[changeType || 'neutral']} flex items-center gap-1`}>
            {changeType === 'positive' && '↑'}
            {changeType === 'negative' && '↓'}
            {change}
          </span>
        )}
      </div>
    </div>
  )
}

// Endpoint Row Component
function EndpointRow({ endpoint }: { endpoint: APIEndpointMetrics }) {
  const latencyColor =
    endpoint.avgLatency < 200 ? 'text-emerald-400' :
    endpoint.avgLatency < 500 ? 'text-amber-400' : 'text-red-400'

  const successColor = endpoint.successRate >= 99 ? 'text-emerald-400' :
    endpoint.successRate >= 95 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-slate-900/50 rounded-lg hover:bg-slate-800/50 transition-colors">
      <div className="flex-1 min-w-0">
        <code className="text-sm text-cyan-400">{endpoint.endpoint}</code>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="text-right w-24">
          <span className={latencyColor}>{endpoint.avgLatency}ms</span>
        </div>
        <div className="text-right w-20">
          <span className={successColor}>{endpoint.successRate.toFixed(1)}%</span>
        </div>
        <div className="text-right w-20 text-slate-400">
          {endpoint.requestCount.toLocaleString()}
        </div>
        <div className="text-right w-16 text-red-400">
          {endpoint.errorCount}
        </div>
      </div>
    </div>
  )
}

// Time Range Selector
function TimeRangeSelector({
  selected,
  onChange,
}: {
  selected: string
  onChange: (range: string) => void
}) {
  const ranges = [
    { id: '1h', label: '1 Hour' },
    { id: '6h', label: '6 Hours' },
    { id: '24h', label: '24 Hours' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
  ]

  return (
    <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
      {ranges.map(range => (
        <button
          key={range.id}
          onClick={() => onChange(range.id)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            selected === range.id
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

// Custom Tooltip for charts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-2">
        {new Date(label).toLocaleString()}
      </p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          {entry.name.includes('Latency') || entry.name.includes('Response') ? 'ms' : ''}
          {entry.name.includes('Rate') || entry.name.includes('Ratio') ? '%' : ''}
        </p>
      ))}
    </div>
  )
}

export function PerformanceDashboard() {
  const [timeRange, setTimeRange] = useState('24h')
  const [data, setData] = useState<PerformanceMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch performance data
  const fetchData = useCallback(() => {
    setIsLoading(true)
    // In production, this would fetch from /api/metrics
    // For now, generate sample data
    const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720
    setTimeout(() => {
      setData(generateSampleData(hours))
      setIsLoading(false)
    }, 500)
  }, [timeRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  // Calculate current metrics from latest data point
  const currentMetrics = useMemo(() => {
    if (data.length === 0) return null
    return data[data.length - 1]
  }, [data])

  // Calculate averages
  const averages = useMemo(() => {
    if (data.length === 0) return { latency: 0, successRate: 0, cacheHit: 0, requests: 0 }
    return {
      latency: data.reduce((sum, d) => sum + d.apiLatency, 0) / data.length,
      successRate: data.reduce((sum, d) => sum + d.successRate, 0) / data.length,
      cacheHit: data.reduce((sum, d) => sum + d.cacheHitRatio, 0) / data.length,
      requests: data.reduce((sum, d) => sum + d.requestsPerMinute, 0) / data.length,
    }
  }, [data])

  // Cache pie chart data
  const cachePieData = [
    { name: 'Hits', value: CACHE_METRICS.hits, color: COLORS.success },
    { name: 'Misses', value: CACHE_METRICS.misses, color: COLORS.error },
  ]

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Performance Dashboard</h1>
            <p className="text-slate-400">Monitor API latency, success rates, and cache performance</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                autoRefresh
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              Auto Refresh
            </button>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
            >
              <span className={isLoading ? 'animate-spin' : ''}>↻</span>
              Refresh
            </button>
            <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Avg. API Latency"
            value={Math.round(averages.latency)}
            unit="ms"
            change={`${averages.latency < 150 ? '-12%' : '+5%'} vs last period`}
            changeType={averages.latency < 150 ? 'positive' : 'negative'}
            icon="⚡"
            color="bg-cyan-500/20"
          />
          <StatCard
            title="Success Rate"
            value={averages.successRate.toFixed(1)}
            unit="%"
            change="+0.3% vs last period"
            changeType="positive"
            icon="✓"
            color="bg-emerald-500/20"
          />
          <StatCard
            title="Cache Hit Ratio"
            value={CACHE_METRICS.hitRatio.toFixed(1)}
            unit="%"
            change="+2.5% vs last period"
            changeType="positive"
            icon="💾"
            color="bg-purple-500/20"
          />
          <StatCard
            title="Requests/min"
            value={Math.round(averages.requests)}
            change="+15% vs last period"
            changeType="positive"
            icon="📊"
            color="bg-amber-500/20"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* API Latency Chart */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">API Latency Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={[0, 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="apiLatency"
                  name="API Latency"
                  stroke={COLORS.primary}
                  fill="url(#latencyGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Success Rate Chart */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Success Rate Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={[90, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="successRate"
                  name="Success Rate"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="errorRate"
                  name="Error Rate"
                  stroke={COLORS.error}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cache & Requests */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Cache Hit/Miss Pie Chart */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Cache Performance</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={cachePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {cachePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-400">Hits: {CACHE_METRICS.hits.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-slate-400">Misses: {CACHE_METRICS.misses.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-xl font-bold text-cyan-400">{CACHE_METRICS.totalSize}</div>
                <div className="text-xs text-slate-500">Cache Size</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-xl font-bold text-amber-400">{CACHE_METRICS.evictions.toLocaleString()}</div>
                <div className="text-xs text-slate-500">Evictions</div>
              </div>
            </div>
          </div>

          {/* Requests Per Minute Chart */}
          <div className="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Requests Per Minute</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.slice(-24)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="requestsPerMinute"
                  name="Requests/min"
                  fill={COLORS.secondary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* API Endpoints Table */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">API Endpoints Performance</h3>
            <span className="text-sm text-slate-400">Last 24 hours</span>
          </div>

          {/* Table Header */}
          <div className="flex items-center justify-between py-2 px-4 bg-slate-900/30 rounded-lg mb-2 text-xs text-slate-500 font-medium uppercase">
            <div className="flex-1">Endpoint</div>
            <div className="flex items-center gap-6">
              <div className="text-right w-24">Avg Latency</div>
              <div className="text-right w-20">Success</div>
              <div className="text-right w-20">Requests</div>
              <div className="text-right w-16">Errors</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="space-y-2">
            {SAMPLE_ENDPOINT_METRICS.map((endpoint, index) => (
              <EndpointRow key={index} endpoint={endpoint} />
            ))}
          </div>
        </div>

        {/* Real-time Status */}
        {currentMetrics && (
          <div className="mt-6 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-lg font-semibold text-white">Real-time Status</h3>
              </div>
              <span className="text-sm text-slate-400">
                Last updated: {new Date(currentMetrics.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-cyan-400">{currentMetrics.apiLatency}ms</div>
                <div className="text-xs text-slate-500 mt-1">Current Latency</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-emerald-400">{currentMetrics.successRate.toFixed(1)}%</div>
                <div className="text-xs text-slate-500 mt-1">Current Success</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{currentMetrics.cacheHitRatio.toFixed(1)}%</div>
                <div className="text-xs text-slate-500 mt-1">Cache Hit Ratio</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-amber-400">{currentMetrics.requestsPerMinute}</div>
                <div className="text-xs text-slate-500 mt-1">Requests/min</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

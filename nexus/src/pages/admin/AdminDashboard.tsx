import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { KPICards, type UsageMetrics } from '@/components/admin/KPICards'
import { UserTable, type AdminUser } from '@/components/admin/UserTable'
import { ActivityFeed, type ActivityItem } from '@/components/admin/ActivityFeed'
import { AIInsightsPanel, type AdminInsights } from '@/components/admin/AIInsightsPanel'
import { Zap } from 'lucide-react'

const AdminPanel = lazy(() =>
  import('@/pages/AdminPanel').then((m) => ({ default: m.AdminPanel }))
)

type Tab = 'overview' | 'users' | 'activity' | 'insights' | 'system'

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'activity', label: 'Activity' },
  { id: 'insights', label: 'AI Insights' },
  { id: 'system', label: 'System' },
]

interface TimeSeriesPoint {
  date: string
  users: number
  workflows: number
  executions: number
}

interface TopWorkflow {
  id: string
  name: string
  executions: number
  successRate: number
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // Data states
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([])
  const [topWorkflows, setTopWorkflows] = useState<TopWorkflow[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [insights, setInsights] = useState<AdminInsights | null>(null)

  // Loading states
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(false)

  useEffect(() => {
    fetchMetrics()
    fetchTimeSeries()
    fetchTopWorkflows()
  }, [])

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) fetchUsers()
    if (activeTab === 'activity' && activities.length === 0) fetchActivities()
  }, [activeTab])

  async function fetchMetrics() {
    setMetricsLoading(true)
    try {
      const res = await fetch('/api/admin-analytics/metrics', {
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.success) setMetrics(data.data)
    } catch (e) {
      console.error('Failed to fetch metrics:', e)
    } finally {
      setMetricsLoading(false)
    }
  }

  async function fetchUsers() {
    setUsersLoading(true)
    try {
      const res = await fetch('/api/admin-analytics/users', {
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.success) setUsers(data.data)
    } catch (e) {
      console.error('Failed to fetch users:', e)
    } finally {
      setUsersLoading(false)
    }
  }

  async function fetchTimeSeries() {
    try {
      const res = await fetch('/api/admin-analytics/time-series?days=14', {
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.success) setTimeSeries(data.data)
    } catch (e) {
      console.error('Failed to fetch time series:', e)
    }
  }

  async function fetchTopWorkflows() {
    try {
      const res = await fetch('/api/admin-analytics/top-workflows', {
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.success) setTopWorkflows(data.data)
    } catch (e) {
      console.error('Failed to fetch top workflows:', e)
    }
  }

  async function fetchActivities() {
    setActivitiesLoading(true)
    try {
      const res = await fetch('/api/admin-analytics/activity-feed', {
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.success) setActivities(data.data)
    } catch (e) {
      console.error('Failed to fetch activities:', e)
    } finally {
      setActivitiesLoading(false)
    }
  }

  async function fetchInsights() {
    setInsightsLoading(true)
    try {
      const res = await fetch('/api/admin-analytics/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.success) setInsights(data.data)
    } catch (e) {
      console.error('Failed to fetch insights:', e)
    } finally {
      setInsightsLoading(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            {today}
            {metrics && !metricsLoading && (
              <span className="ml-2">&middot; {metrics.totalUsers} total users</span>
            )}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-lg p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            {metricsLoading || !metrics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <KPICards metrics={metrics} />
            )}

            {/* Time Series Chart */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Activity (14 days)</h2>
              {timeSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeries}>
                    <defs>
                      <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradExec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#06b6d4"
                      fill="url(#gradUsers)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="executions"
                      stroke="#a855f7"
                      fill="url(#gradExec)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  No data yet
                </div>
              )}
            </div>

            {/* Top Workflows */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Top Workflows</h2>
              {topWorkflows.length === 0 ? (
                <p className="text-slate-500 text-sm">No workflows executed yet</p>
              ) : (
                <div className="space-y-3">
                  {topWorkflows.map((wf, i) => (
                    <div
                      key={wf.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-white/5"
                    >
                      <span className="text-slate-500 text-sm font-mono w-6">
                        #{i + 1}
                      </span>
                      <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="flex-1 text-white text-sm truncate">{wf.name}</span>
                      <span className="text-slate-400 text-sm">
                        {wf.executions} runs
                      </span>
                      <span className="text-emerald-400 text-sm">
                        {wf.successRate.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <UserTable
            users={users}
            loading={usersLoading}
            onUserClick={(id) => navigate(`/admin/users/${id}`)}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityFeed activities={activities} loading={activitiesLoading} />
        )}

        {activeTab === 'insights' && (
          <AIInsightsPanel
            insights={insights}
            loading={insightsLoading}
            onRefresh={fetchInsights}
          />
        )}

        {activeTab === 'system' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <AdminPanel />
          </Suspense>
        )}
      </div>
    </div>
  )
}

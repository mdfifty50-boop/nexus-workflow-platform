import { useState, useEffect } from 'react'

// =============================================================================
// MOCK DATA - Replace with real API calls
// =============================================================================

interface UsageMetrics {
  totalUsers: number
  activeUsers: number
  totalWorkflows: number
  activeWorkflows: number
  totalExecutions: number
  executionsToday: number
  executionsThisWeek: number
  executionsThisMonth: number
  successRate: number
  avgExecutionTime: number
  storageUsed: number
  storageLimit: number
  apiCalls: number
  apiLimit: number
}

interface TimeSeriesData {
  date: string
  executions: number
  users: number
  errors: number
}

const MOCK_METRICS: UsageMetrics = {
  totalUsers: 156,
  activeUsers: 89,
  totalWorkflows: 423,
  activeWorkflows: 187,
  totalExecutions: 15847,
  executionsToday: 234,
  executionsThisWeek: 1567,
  executionsThisMonth: 5832,
  successRate: 97.3,
  avgExecutionTime: 2.4,
  storageUsed: 4.2,
  storageLimit: 10,
  apiCalls: 45678,
  apiLimit: 100000,
}

const MOCK_TIME_SERIES: TimeSeriesData[] = [
  { date: '2026-01-06', executions: 198, users: 45, errors: 5 },
  { date: '2026-01-07', executions: 245, users: 52, errors: 8 },
  { date: '2026-01-08', executions: 312, users: 61, errors: 3 },
  { date: '2026-01-09', executions: 287, users: 58, errors: 6 },
  { date: '2026-01-10', executions: 356, users: 67, errors: 4 },
  { date: '2026-01-11', executions: 198, users: 43, errors: 2 },
  { date: '2026-01-12', executions: 234, users: 51, errors: 7 },
]

interface TopWorkflow {
  id: string
  name: string
  executions: number
  avgTime: number
  successRate: number
}

const MOCK_TOP_WORKFLOWS: TopWorkflow[] = [
  { id: '1', name: 'Daily Email Digest', executions: 1234, avgTime: 1.2, successRate: 99.1 },
  { id: '2', name: 'CRM Data Sync', executions: 892, avgTime: 3.4, successRate: 96.5 },
  { id: '3', name: 'Lead Generation Pipeline', executions: 756, avgTime: 2.8, successRate: 98.2 },
  { id: '4', name: 'Invoice Processing', executions: 567, avgTime: 4.1, successRate: 95.8 },
  { id: '5', name: 'Customer Onboarding', executions: 445, avgTime: 5.2, successRate: 97.9 },
]

// =============================================================================
// ADMIN USAGE STATS COMPONENT
// =============================================================================

export function AdminUsageStats() {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null)
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([])
  const [topWorkflows, setTopWorkflows] = useState<TopWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 800))
      setMetrics(MOCK_METRICS)
      setTimeSeries(MOCK_TIME_SERIES)
      setTopWorkflows(MOCK_TOP_WORKFLOWS)
      setLoading(false)
    }
    loadData()
  }, [timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading usage statistics...</p>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const maxExecutions = Math.max(...timeSeries.map(d => d.executions))

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Platform Usage Statistics</h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-sm text-slate-400">Total Users</span>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.totalUsers.toLocaleString()}</div>
          <div className="text-sm text-blue-400 mt-1">
            {metrics.activeUsers} active ({Math.round(metrics.activeUsers / metrics.totalUsers * 100)}%)
          </div>
        </div>

        {/* Total Workflows */}
        <div className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <span className="text-sm text-slate-400">Total Workflows</span>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.totalWorkflows.toLocaleString()}</div>
          <div className="text-sm text-purple-400 mt-1">
            {metrics.activeWorkflows} active ({Math.round(metrics.activeWorkflows / metrics.totalWorkflows * 100)}%)
          </div>
        </div>

        {/* Total Executions */}
        <div className="p-5 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm text-slate-400">Total Executions</span>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.totalExecutions.toLocaleString()}</div>
          <div className="text-sm text-cyan-400 mt-1">
            {metrics.executionsToday} today
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-5 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm text-slate-400">Success Rate</span>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.successRate}%</div>
          <div className="text-sm text-green-400 mt-1">
            Avg {metrics.avgExecutionTime}s per execution
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Executions Chart */}
        <div className="p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Executions Over Time</h3>
          <div className="h-48 flex items-end gap-2">
            {timeSeries.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-sm transition-all hover:from-cyan-400 hover:to-cyan-300"
                  style={{ height: `${(d.executions / maxExecutions) * 100}%`, minHeight: '4px' }}
                  title={`${d.executions} executions`}
                />
                <span className="text-xs text-slate-500 rotate-45 origin-left">
                  {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-6 pt-4 border-t border-slate-700/50">
            <div>
              <div className="text-sm text-slate-400">This Week</div>
              <div className="text-xl font-bold text-white">{metrics.executionsThisWeek.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">This Month</div>
              <div className="text-xl font-bold text-white">{metrics.executionsThisMonth.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Resource Usage</h3>

          {/* Storage */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-400">Storage</span>
              <span className="text-sm text-white">{metrics.storageUsed} GB / {metrics.storageLimit} GB</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${(metrics.storageUsed / metrics.storageLimit) * 100}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {Math.round((metrics.storageUsed / metrics.storageLimit) * 100)}% used
            </div>
          </div>

          {/* API Calls */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-400">API Calls</span>
              <span className="text-sm text-white">{metrics.apiCalls.toLocaleString()} / {metrics.apiLimit.toLocaleString()}</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${(metrics.apiCalls / metrics.apiLimit) * 100}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {Math.round((metrics.apiCalls / metrics.apiLimit) * 100)}% used this month
            </div>
          </div>

          {/* Active Users */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-400">Active Users</span>
              <span className="text-sm text-white">{metrics.activeUsers} / {metrics.totalUsers}</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                style={{ width: `${(metrics.activeUsers / metrics.totalUsers) * 100}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {Math.round((metrics.activeUsers / metrics.totalUsers) * 100)}% active in last 7 days
            </div>
          </div>
        </div>
      </div>

      {/* Top Workflows */}
      <div className="p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Top Performing Workflows</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Workflow</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Executions</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Time</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {topWorkflows.map((wf, i) => (
                <tr key={wf.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-medium">
                        {i + 1}
                      </span>
                      <span className="text-white font-medium">{wf.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {wf.executions.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {wf.avgTime}s
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      wf.successRate >= 98
                        ? 'text-green-400 bg-green-500/10'
                        : wf.successRate >= 95
                          ? 'text-yellow-400 bg-yellow-500/10'
                          : 'text-red-400 bg-red-500/10'
                    }`}>
                      {wf.successRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-white font-medium">API</div>
          <div className="text-sm text-green-400">Operational</div>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-white font-medium">Database</div>
          <div className="text-sm text-green-400">Operational</div>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-white font-medium">Workflow Engine</div>
          <div className="text-sm text-green-400">Operational</div>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-white font-medium">AI Services</div>
          <div className="text-sm text-green-400">Operational</div>
        </div>
      </div>
    </div>
  )
}

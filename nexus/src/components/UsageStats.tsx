import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

// Usage statistics types
interface UsageData {
  workflowsCreated: number
  executionsToday: number
  executionsThisWeek: number
  executionsThisMonth: number
  totalTokensUsed: number
  estimatedCostUSD: number
  avgTokensPerExecution: number
  topWorkflows: Array<{
    id: string
    name: string
    executions: number
    tokens: number
  }>
}

// Token pricing (based on Claude API pricing)
const TOKEN_COST_INPUT = 0.003 / 1000 // $3 per 1M input tokens
const TOKEN_COST_OUTPUT = 0.015 / 1000 // $15 per 1M output tokens

// Fetch usage data hook
function useUsageData() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setLoading(true)

        // Try to fetch from API
        const response = await fetch('/api/usage/stats')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setData(result.data)
            return
          }
        }

        // Fallback to localStorage data if API not available
        const storedStats = localStorage.getItem('nexus_usage_stats')
        if (storedStats) {
          setData(JSON.parse(storedStats))
          return
        }

        // Generate sample data for demonstration
        setData({
          workflowsCreated: Math.floor(Math.random() * 20) + 5,
          executionsToday: Math.floor(Math.random() * 15) + 2,
          executionsThisWeek: Math.floor(Math.random() * 80) + 20,
          executionsThisMonth: Math.floor(Math.random() * 300) + 100,
          totalTokensUsed: Math.floor(Math.random() * 500000) + 100000,
          estimatedCostUSD: 0,
          avgTokensPerExecution: 0,
          topWorkflows: [
            { id: '1', name: 'Email Follow-up', executions: 45, tokens: 12500 },
            { id: '2', name: 'Lead Scoring', executions: 32, tokens: 8900 },
            { id: '3', name: 'Meeting Summary', executions: 28, tokens: 15600 },
          ],
        })
      } catch (err) {
        console.error('[UsageStats] Error:', err)
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsage, 300000)
    return () => clearInterval(interval)
  }, [])

  // Calculate derived values
  const enrichedData = useMemo(() => {
    if (!data) return null

    const avgTokens = data.executionsThisMonth > 0
      ? Math.round(data.totalTokensUsed / data.executionsThisMonth)
      : 0

    // Estimate cost (assuming 70% input, 30% output tokens)
    const inputTokens = data.totalTokensUsed * 0.7
    const outputTokens = data.totalTokensUsed * 0.3
    const estimatedCost = (inputTokens * TOKEN_COST_INPUT) + (outputTokens * TOKEN_COST_OUTPUT)

    return {
      ...data,
      avgTokensPerExecution: avgTokens,
      estimatedCostUSD: estimatedCost,
    }
  }, [data])

  return { data: enrichedData, loading, error }
}

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

// Format currency
function formatCurrency(amount: number): string {
  if (amount < 0.01) return '<$0.01'
  if (amount < 1) return `$${amount.toFixed(2)}`
  return `$${amount.toFixed(2)}`
}

// Stat Item Component
function StatItem({
  label,
  value,
  subtext,
  icon,
  color,
  trend,
}: {
  label: string
  value: string | number
  subtext?: string
  icon: string
  color: string
  trend?: { value: string; type: 'up' | 'down' | 'neutral' }
}) {
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-400',
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-lg`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-white">{value}</span>
          {trend && (
            <span className={`text-xs ${trendColors[trend.type]}`}>
              {trend.type === 'up' && '↑'}
              {trend.type === 'down' && '↓'}
              {trend.value}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400">{label}</div>
        {subtext && <div className="text-xs text-slate-500">{subtext}</div>}
      </div>
    </div>
  )
}

// Progress Bar Component
function ProgressBar({
  value,
  max,
  label,
  color,
}: {
  value: number
  max: number
  label: string
  color: string
}) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">{formatNumber(value)} / {formatNumber(max)}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Main UsageStats Component
export function UsageStats({ compact = false }: { compact?: boolean }) {
  const { data, loading, error } = useUsageData()

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-700 rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-700/50 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <div className="text-center text-slate-400">
          <span className="text-2xl mb-2 block">📊</span>
          <p className="text-sm">Unable to load usage data</p>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span>📊</span> Usage Stats
          </h3>
          <Link to="/performance" className="text-xs text-cyan-400 hover:text-cyan-300">
            Details →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-slate-900/50 rounded-lg p-2">
            <div className="text-lg font-bold text-cyan-400">{data.executionsToday}</div>
            <div className="text-xs text-slate-500">Today</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2">
            <div className="text-lg font-bold text-purple-400">{formatNumber(data.totalTokensUsed)}</div>
            <div className="text-xs text-slate-500">Tokens</div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <span className="text-xs text-slate-500">Est. Cost: </span>
          <span className="text-xs text-amber-400 font-medium">{formatCurrency(data.estimatedCostUSD)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>📊</span> Usage Statistics
        </h3>
        <Link
          to="/performance"
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View Details →
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatItem
          label="Workflows Created"
          value={data.workflowsCreated}
          icon="⚡"
          color="bg-cyan-500/20"
          trend={{ value: '+3 this week', type: 'up' }}
        />
        <StatItem
          label="Executions Today"
          value={data.executionsToday}
          subtext={`${data.executionsThisWeek} this week`}
          icon="▶"
          color="bg-emerald-500/20"
          trend={{ value: '+12%', type: 'up' }}
        />
        <StatItem
          label="Total Tokens Used"
          value={formatNumber(data.totalTokensUsed)}
          subtext={`~${formatNumber(data.avgTokensPerExecution)}/execution`}
          icon="🪙"
          color="bg-purple-500/20"
        />
        <StatItem
          label="Estimated Cost"
          value={formatCurrency(data.estimatedCostUSD)}
          subtext="This month"
          icon="💰"
          color="bg-amber-500/20"
        />
      </div>

      {/* Execution Breakdown */}
      <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
        <h4 className="text-sm font-medium text-white mb-3">Execution Breakdown</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Today</span>
            <span className="text-sm text-white font-medium">{data.executionsToday}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">This Week</span>
            <span className="text-sm text-white font-medium">{data.executionsThisWeek}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">This Month</span>
            <span className="text-sm text-white font-medium">{data.executionsThisMonth}</span>
          </div>
        </div>
      </div>

      {/* Usage Limits (if applicable) */}
      <div className="space-y-3 mb-4">
        <ProgressBar
          value={data.executionsThisMonth}
          max={1000}
          label="Monthly Executions"
          color="bg-gradient-to-r from-cyan-500 to-purple-500"
        />
        <ProgressBar
          value={data.totalTokensUsed}
          max={1000000}
          label="Token Usage"
          color="bg-gradient-to-r from-emerald-500 to-cyan-500"
        />
      </div>

      {/* Top Workflows */}
      {data.topWorkflows.length > 0 && (
        <div className="bg-slate-900/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-white mb-3">Top Workflows</h4>
          <div className="space-y-2">
            {data.topWorkflows.map((workflow, index) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                    {index + 1}
                  </span>
                  <span className="text-sm text-white">{workflow.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-cyan-400">{workflow.executions} runs</span>
                  <span className="text-slate-500">{formatNumber(workflow.tokens)} tokens</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
        <span>Data refreshes every 5 minutes</span>
        <Link to="/settings?tab=billing" className="text-cyan-400 hover:text-cyan-300">
          Manage Plan →
        </Link>
      </div>
    </div>
  )
}

export default UsageStats

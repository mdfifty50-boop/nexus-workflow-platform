import { RefreshCw, Users, BarChart3, AlertTriangle, Lightbulb } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface UserSegment {
  name: string
  count: number
  percentage: number
  description: string
}

export interface FeatureAdoption {
  feature: string
  users: number
  percentage: number
}

export interface ChurnRisk {
  userId: string
  name: string
  email: string
  riskLevel: 'high' | 'medium' | 'low'
  lastActive: string
  reason: string
}

export interface MarketingInsight {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export interface AdminInsights {
  segments: UserSegment[]
  featureAdoption: FeatureAdoption[]
  churnRisks: ChurnRisk[]
  marketingInsights: MarketingInsight[]
  generatedAt: string
  cachedUntil: string
}

interface AIInsightsPanelProps {
  insights: AdminInsights | null
  loading?: boolean
  onRefresh: () => void
}

const riskColors: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-48 rounded bg-white/5 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
      <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
    </div>
  )
}

export function AIInsightsPanel({ insights, loading, onRefresh }: AIInsightsPanelProps) {
  if (loading) return <Skeleton />

  if (!insights) {
    return (
      <div className="text-center py-16">
        <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 mb-4">No insights generated yet</p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Generate Insights
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Generated {formatDate(insights.generatedAt)} &middot; Cached until{' '}
          {formatDate(insights.cachedUntil)}
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors text-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* User Segments */}
      <section>
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          User Segments
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.segments.map((seg) => (
            <div
              key={seg.name}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-medium">{seg.name}</span>
                <span className="text-cyan-400 text-sm font-semibold">{seg.count}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 mb-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  style={{ width: `${seg.percentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{seg.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Adoption */}
      <section>
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          Feature Adoption
        </h3>
        <div className="space-y-2">
          {insights.featureAdoption.map((f) => (
            <div key={f.feature} className="flex items-center gap-3">
              <span className="text-sm text-slate-300 w-40 shrink-0 truncate">
                {f.feature}
              </span>
              <div className="flex-1 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                  style={{ width: `${f.percentage}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-20 text-right">
                {f.users} ({f.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Churn Risks */}
      <section>
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          Churn Risks
        </h3>
        {insights.churnRisks.length === 0 ? (
          <p className="text-sm text-slate-500">No churn risks detected</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-2.5 text-left text-slate-400 font-medium">User</th>
                  <th className="px-4 py-2.5 text-left text-slate-400 font-medium">Risk</th>
                  <th className="px-4 py-2.5 text-left text-slate-400 font-medium">Last Active</th>
                  <th className="px-4 py-2.5 text-left text-slate-400 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {insights.churnRisks.map((r) => (
                  <tr key={r.userId} className="border-b border-white/5">
                    <td className="px-4 py-2.5">
                      <div className="text-white">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.email}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className={riskColors[r.riskLevel]}>{r.riskLevel}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">{formatDate(r.lastActive)}</td>
                    <td className="px-4 py-2.5 text-slate-400">{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Marketing Insights */}
      <section>
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          Marketing Recommendations
        </h3>
        <div className="space-y-2">
          {insights.marketingInsights.map((m, i) => (
            <div
              key={i}
              className="rounded-lg border border-white/10 bg-white/5 p-4 flex items-start gap-3"
            >
              <Badge className={`shrink-0 ${priorityColors[m.priority]}`}>{m.priority}</Badge>
              <div>
                <p className="text-white text-sm font-medium">{m.title}</p>
                <p className="text-xs text-slate-400 mt-1">{m.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

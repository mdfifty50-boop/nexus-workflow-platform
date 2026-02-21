import { Users, Activity, Zap, Play, CheckCircle, AlertTriangle } from 'lucide-react'

export interface UsageMetrics {
  totalUsers: number
  activeToday: number
  totalWorkflows: number
  executionsThisWeek: number
  successRate: number
  errorCount: number
}

interface MetricCard {
  label: string
  key: keyof UsageMetrics
  icon: React.ComponentType<{ className?: string }>
  format?: (v: number) => string
  color: string
}

const cards: MetricCard[] = [
  { label: 'Total Users', key: 'totalUsers', icon: Users, color: 'text-cyan-400' },
  { label: 'Active Today', key: 'activeToday', icon: Activity, color: 'text-green-400' },
  { label: 'Total Workflows', key: 'totalWorkflows', icon: Zap, color: 'text-purple-400' },
  { label: 'Executions This Week', key: 'executionsThisWeek', icon: Play, color: 'text-blue-400' },
  {
    label: 'Success Rate',
    key: 'successRate',
    icon: CheckCircle,
    format: (v) => `${v.toFixed(1)}%`,
    color: 'text-emerald-400',
  },
  { label: 'Error Count', key: 'errorCount', icon: AlertTriangle, color: 'text-red-400' },
]

export function KPICards({ metrics }: { metrics: UsageMetrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        const raw = metrics[card.key]
        const display = card.format ? card.format(raw) : raw.toLocaleString()

        return (
          <div
            key={card.key}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex items-start gap-4"
          >
            <div className={`rounded-lg bg-white/5 p-2.5 ${card.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="text-2xl font-bold text-white mt-0.5">{display}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

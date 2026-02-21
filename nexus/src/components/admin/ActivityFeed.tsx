import { useState } from 'react'
import {
  MessageSquare,
  Zap,
  Play,
  LogIn,
  UserPlus,
  AlertTriangle,
} from 'lucide-react'

export interface ActivityItem {
  id: string
  type: 'chat' | 'workflow_created' | 'workflow_executed' | 'login' | 'signup' | 'error'
  user: { id: string; name: string; email: string }
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  loading?: boolean
}

const typeConfig: Record<
  ActivityItem['type'],
  { icon: React.ComponentType<{ className?: string }>; color: string; dot: string }
> = {
  chat: { icon: MessageSquare, color: 'text-cyan-400', dot: 'bg-cyan-400' },
  workflow_created: { icon: Zap, color: 'text-purple-400', dot: 'bg-purple-400' },
  workflow_executed: { icon: Play, color: 'text-blue-400', dot: 'bg-blue-400' },
  login: { icon: LogIn, color: 'text-slate-400', dot: 'bg-slate-400' },
  signup: { icon: UserPlus, color: 'text-green-400', dot: 'bg-green-400' },
  error: { icon: AlertTriangle, color: 'text-red-400', dot: 'bg-red-400' },
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  const [visibleCount, setVisibleCount] = useState(20)

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return <p className="text-center text-slate-500 py-12">No activity yet</p>
  }

  const visible = activities.slice(0, visibleCount)

  return (
    <div className="space-y-1">
      {visible.map((item, idx) => {
        const cfg = typeConfig[item.type]
        const Icon = cfg.icon
        const isLast = idx === visible.length - 1

        return (
          <div key={item.id} className="flex gap-3 relative">
            {/* timeline line */}
            {!isLast && (
              <div className="absolute left-4 top-10 bottom-0 w-px bg-white/10" />
            )}

            {/* avatar */}
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white">
                {initials(item.user.name)}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${cfg.dot}`}
              />
            </div>

            {/* content */}
            <div className="flex-1 pb-5">
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                <span className="text-sm text-white font-medium">{item.user.name}</span>
                <span className="text-xs text-slate-500">{relativeTime(item.timestamp)}</span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{item.description}</p>
            </div>
          </div>
        )
      })}

      {visibleCount < activities.length && (
        <button
          onClick={() => setVisibleCount((c) => c + 20)}
          className="w-full py-2.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Load more
        </button>
      )}
    </div>
  )
}

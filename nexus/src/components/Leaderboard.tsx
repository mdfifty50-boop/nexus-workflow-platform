import { useState } from 'react'
import { OptimizedAvatar } from '@/components/OptimizedImage'

export interface LeaderboardEntry {
  id: string
  rank: number
  name: string
  avatar?: string
  score: number
  change: number // Position change since last period
  isCurrentUser?: boolean
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
}

export interface LeaderboardCategory {
  id: string
  name: string
  icon: string
  unit: string
  entries: LeaderboardEntry[]
}

const MOCK_LEADERBOARD_DATA: LeaderboardCategory[] = [
  {
    id: 'workflows',
    name: 'Most Workflows',
    icon: '⚡',
    unit: 'workflows',
    entries: [
      { id: '1', rank: 1, name: 'Alex Chen', score: 247, change: 0, tier: 'diamond' },
      { id: '2', rank: 2, name: 'Sarah Miller', score: 198, change: 2, tier: 'platinum' },
      { id: '3', rank: 3, name: 'Mike Johnson', score: 156, change: -1, tier: 'gold' },
      { id: '4', rank: 4, name: 'Emily Davis', score: 142, change: 1, tier: 'gold' },
      { id: '5', rank: 5, name: 'You', score: 89, change: 3, isCurrentUser: true, tier: 'silver' },
      { id: '6', rank: 6, name: 'Chris Wilson', score: 78, change: -2, tier: 'silver' },
      { id: '7', rank: 7, name: 'Lisa Brown', score: 65, change: 0, tier: 'bronze' },
      { id: '8', rank: 8, name: 'David Lee', score: 54, change: -1, tier: 'bronze' },
    ],
  },
  {
    id: 'success-rate',
    name: 'Highest Success Rate',
    icon: '🎯',
    unit: '%',
    entries: [
      { id: '1', rank: 1, name: 'Emily Davis', score: 99.2, change: 0, tier: 'diamond' },
      { id: '2', rank: 2, name: 'You', score: 98.7, change: 1, isCurrentUser: true, tier: 'platinum' },
      { id: '3', rank: 3, name: 'Alex Chen', score: 97.5, change: -1, tier: 'gold' },
      { id: '4', rank: 4, name: 'Sarah Miller', score: 96.8, change: 2, tier: 'gold' },
      { id: '5', rank: 5, name: 'Mike Johnson', score: 95.1, change: 0, tier: 'silver' },
    ],
  },
  {
    id: 'time-saved',
    name: 'Time Saved',
    icon: '⏱️',
    unit: 'hrs',
    entries: [
      { id: '1', rank: 1, name: 'Sarah Miller', score: 156, change: 1, tier: 'diamond' },
      { id: '2', rank: 2, name: 'Alex Chen', score: 143, change: -1, tier: 'platinum' },
      { id: '3', rank: 3, name: 'Mike Johnson', score: 98, change: 0, tier: 'gold' },
      { id: '4', rank: 4, name: 'You', score: 67, change: 2, isCurrentUser: true, tier: 'silver' },
      { id: '5', rank: 5, name: 'Emily Davis', score: 54, change: -1, tier: 'silver' },
    ],
  },
]

const TIER_COLORS = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-slate-400 to-slate-600',
  gold: 'from-yellow-500 to-amber-600',
  platinum: 'from-cyan-400 to-slate-400',
  diamond: 'from-purple-400 via-pink-400 to-cyan-400',
}

const RANK_BADGES: Record<number, { icon: string; color: string }> = {
  1: { icon: '🥇', color: 'text-yellow-400' },
  2: { icon: '🥈', color: 'text-slate-300' },
  3: { icon: '🥉', color: 'text-amber-600' },
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  unit: string
}

function LeaderboardRow({ entry, unit }: LeaderboardRowProps) {
  const rankBadge = RANK_BADGES[entry.rank]

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-xl transition-all
      ${entry.isCurrentUser
        ? 'bg-cyan-500/10 border border-cyan-500/30'
        : 'hover:bg-slate-800/50'
      }
    `}>
      {/* Rank */}
      <div className="w-8 text-center">
        {rankBadge ? (
          <span className={`text-xl ${rankBadge.color}`}>{rankBadge.icon}</span>
        ) : (
          <span className="text-sm font-bold text-slate-500">{entry.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
        ${entry.tier
          ? `bg-gradient-to-br ${TIER_COLORS[entry.tier]}`
          : 'bg-slate-700'
        }
      `}>
        {entry.avatar ? (
          <OptimizedAvatar src={entry.avatar} alt={entry.name} size={40} />
        ) : (
          <span className="text-white">{entry.name.charAt(0)}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${entry.isCurrentUser ? 'text-cyan-400' : 'text-white'}`}>
          {entry.name}
          {entry.isCurrentUser && <span className="text-xs ml-1">(You)</span>}
        </p>
        {entry.tier && (
          <p className="text-xs text-slate-500 capitalize">{entry.tier}</p>
        )}
      </div>

      {/* Score */}
      <div className="text-right">
        <p className="text-sm font-bold text-white">
          {entry.score.toLocaleString()}{unit === '%' ? '%' : ''} {unit !== '%' && <span className="text-xs text-slate-500">{unit}</span>}
        </p>
      </div>

      {/* Change indicator */}
      <div className="w-12 text-right">
        {entry.change > 0 && (
          <span className="text-xs text-emerald-400 flex items-center justify-end gap-0.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            {entry.change}
          </span>
        )}
        {entry.change < 0 && (
          <span className="text-xs text-red-400 flex items-center justify-end gap-0.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {Math.abs(entry.change)}
          </span>
        )}
        {entry.change === 0 && (
          <span className="text-xs text-slate-500">-</span>
        )}
      </div>
    </div>
  )
}

interface LeaderboardProps {
  categories?: LeaderboardCategory[]
  showTabs?: boolean
  maxEntries?: number
  className?: string
  placeholder?: boolean
}

export function Leaderboard({
  categories = MOCK_LEADERBOARD_DATA,
  showTabs = true,
  maxEntries = 10,
  className = '',
  placeholder = false,
}: LeaderboardProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || 'workflows')

  const currentCategory = categories.find(c => c.id === activeCategory) || categories[0]
  const visibleEntries = currentCategory?.entries.slice(0, maxEntries) || []

  // Find current user's position
  const currentUserEntry = currentCategory?.entries.find(e => e.isCurrentUser)

  if (placeholder) {
    return (
      <div className={`bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden ${className}`}>
        <div className="p-6 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-lg font-semibold text-white mb-2">Team Leaderboards</h3>
          <p className="text-slate-400 text-sm mb-4">
            Coming soon! Compete with your team and see who automates the most.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-full text-sm">
            <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Launching Q1 2025
          </div>

          {/* Preview cards */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {['Most Workflows', 'Best Success Rate', 'Time Saved'].map((title, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="text-2xl mb-2">{['⚡', '🎯', '⏱️'][i]}</div>
                <p className="text-xs text-slate-400">{title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>Team Leaderboard</span>
            <span className="text-2xl">🏆</span>
          </h3>
          <div className="text-xs text-slate-500">Updated hourly</div>
        </div>

        {/* Category tabs */}
        {showTabs && categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${activeCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                `}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current user highlight (if not in top visible) */}
      {currentUserEntry && currentUserEntry.rank > maxEntries && (
        <div className="px-6 py-3 bg-cyan-500/5 border-b border-slate-700/50">
          <p className="text-xs text-slate-400 mb-2">Your Position</p>
          <LeaderboardRow entry={currentUserEntry} unit={currentCategory.unit} />
        </div>
      )}

      {/* Leaderboard list */}
      <div className="p-4">
        <div className="space-y-1">
          {visibleEntries.map(entry => (
            <LeaderboardRow key={entry.id} entry={entry} unit={currentCategory.unit} />
          ))}
        </div>
      </div>

      {/* Footer */}
      {currentCategory.entries.length > maxEntries && (
        <div className="px-6 py-4 border-t border-slate-700/50 text-center">
          <button className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
            View full leaderboard ({currentCategory.entries.length} members)
          </button>
        </div>
      )}
    </div>
  )
}

// Mini leaderboard for dashboard sidebar
interface MiniLeaderboardProps {
  entries?: LeaderboardEntry[]
  title?: string
  className?: string
}

export function MiniLeaderboard({
  entries = MOCK_LEADERBOARD_DATA[0].entries.slice(0, 3),
  title = 'Top Performers',
  className = '',
}: MiniLeaderboardProps) {
  return (
    <div className={`bg-slate-800/50 rounded-xl p-4 ${className}`}>
      <h4 className="text-sm font-medium text-slate-400 mb-3">{title}</h4>
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div key={entry.id} className="flex items-center gap-2">
            <span className="text-lg">{RANK_BADGES[index + 1]?.icon || ''}</span>
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${entry.tier ? `bg-gradient-to-br ${TIER_COLORS[entry.tier]}` : 'bg-slate-700'}
            `}>
              {entry.name.charAt(0)}
            </div>
            <span className={`text-sm flex-1 truncate ${entry.isCurrentUser ? 'text-cyan-400' : 'text-white'}`}>
              {entry.name}
            </span>
            <span className="text-xs text-slate-500">{entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Leaderboard

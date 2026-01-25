import { useState, useEffect, useCallback, useRef, memo } from 'react'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'workflows' | 'time' | 'integrations' | 'special'
  unlocked: boolean
  unlockedAt?: Date
  progress?: number
  target?: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  reward?: string
}

export interface UserStats {
  workflowsCompleted: number
  timeSavedHours: number
  integrationsConnected: number
  totalValueGenerated: number
  tasksAutomated: number
  errorsRecovered: number
}

const ACHIEVEMENTS: Achievement[] = [
  // Workflow Achievements
  {
    id: 'first-workflow',
    name: 'First Automation',
    description: 'Create and run your first workflow',
    icon: '🚀',
    category: 'workflows',
    unlocked: false,
    target: 1,
    tier: 'bronze',
    reward: '+5 bonus workflows this month',
  },
  {
    id: 'workflow-10',
    name: 'Automation Enthusiast',
    description: 'Complete 10 workflows',
    icon: '⚡',
    category: 'workflows',
    unlocked: false,
    target: 10,
    tier: 'silver',
    reward: '+10% token efficiency',
  },
  {
    id: 'workflow-50',
    name: 'Workflow Master',
    description: 'Complete 50 workflows',
    icon: '🏆',
    category: 'workflows',
    unlocked: false,
    target: 50,
    tier: 'gold',
    reward: 'Priority execution queue',
  },
  {
    id: 'workflow-100',
    name: 'Automation Legend',
    description: 'Complete 100 workflows',
    icon: '👑',
    category: 'workflows',
    unlocked: false,
    target: 100,
    tier: 'platinum',
    reward: 'Custom agent avatar unlock',
  },

  // Time Saved Achievements
  {
    id: 'time-1h',
    name: 'Time Saver',
    description: 'Save 1 hour of work',
    icon: '⏱️',
    category: 'time',
    unlocked: false,
    target: 1,
    tier: 'bronze',
  },
  {
    id: 'time-10h',
    name: 'Efficiency Expert',
    description: 'Save 10 hours of work',
    icon: '⚙️',
    category: 'time',
    unlocked: false,
    target: 10,
    tier: 'silver',
  },
  {
    id: 'time-100h',
    name: 'Productivity Champion',
    description: 'Save 100 hours of work',
    icon: '🎯',
    category: 'time',
    unlocked: false,
    target: 100,
    tier: 'gold',
    reward: 'Featured in success stories',
  },

  // Integration Achievements
  {
    id: 'integration-first',
    name: 'Connected',
    description: 'Connect your first integration',
    icon: '🔗',
    category: 'integrations',
    unlocked: false,
    target: 1,
    tier: 'bronze',
  },
  {
    id: 'integration-5',
    name: 'Integration Pro',
    description: 'Connect 5 different tools',
    icon: '🔌',
    category: 'integrations',
    unlocked: false,
    target: 5,
    tier: 'silver',
    reward: 'Premium integration access',
  },

  // Special Achievements
  {
    id: 'error-recovery',
    name: 'Self-Healer',
    description: 'AI successfully recovered from 5 errors automatically',
    icon: '🛡️',
    category: 'special',
    unlocked: false,
    target: 5,
    tier: 'silver',
  },
  {
    id: 'share-workflow',
    name: 'Helpful',
    description: 'Share a workflow that gets used by others',
    icon: '🤝',
    category: 'special',
    unlocked: false,
    tier: 'gold',
    reward: 'Creator badge on profile',
  },
]

const TIER_COLORS = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-slate-300 to-slate-500',
  gold: 'from-yellow-400 to-amber-500',
  platinum: 'from-cyan-300 to-purple-500',
}

const TIER_BORDERS = {
  bronze: 'border-amber-600',
  silver: 'border-slate-400',
  gold: 'border-yellow-500',
  platinum: 'border-cyan-400',
}

interface AchievementBadgeProps {
  achievement: Achievement
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  onClick?: () => void
}

export const AchievementBadge = memo(function AchievementBadge({ achievement, size = 'md', showDetails = false, onClick }: AchievementBadgeProps) {
  const sizes = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl',
  }

  return (
    <div
      className={`
        relative cursor-pointer transition-all hover:scale-105
        ${onClick ? 'hover:shadow-lg' : ''}
      `}
      onClick={onClick}
    >
      <div
        className={`
          ${sizes[size]} rounded-2xl flex items-center justify-center
          ${achievement.unlocked
            ? `bg-gradient-to-br ${TIER_COLORS[achievement.tier]} shadow-lg`
            : 'bg-slate-800 opacity-50'
          }
          border-2 ${achievement.unlocked ? TIER_BORDERS[achievement.tier] : 'border-slate-700'}
        `}
      >
        <span className={achievement.unlocked ? '' : 'grayscale'}>{achievement.icon}</span>
      </div>

      {achievement.progress !== undefined && achievement.target && !achievement.unlocked && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-full px-1">
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              style={{ width: `${Math.min(100, (achievement.progress / achievement.target) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {showDetails && (
        <div className="mt-2 text-center">
          <p className={`text-xs font-medium ${achievement.unlocked ? 'text-white' : 'text-muted-foreground'}`}>
            {achievement.name}
          </p>
        </div>
      )}
    </div>
  )
})

interface AchievementNotificationProps {
  achievement: Achievement
  onClose: () => void
}

export const AchievementNotification = memo(function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
      <div className={`
        bg-gradient-to-r ${TIER_COLORS[achievement.tier]} p-[2px] rounded-2xl shadow-2xl
      `}>
        <div className="bg-slate-900 rounded-2xl p-4 flex items-center gap-4">
          <AchievementBadge achievement={{ ...achievement, unlocked: true }} size="md" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-cyan-400 uppercase">Achievement Unlocked!</span>
            </div>
            <h4 className="font-bold text-white">{achievement.name}</h4>
            <p className="text-sm text-slate-400">{achievement.description}</p>
            {achievement.reward && (
              <p className="text-xs text-emerald-400 mt-1">🎁 {achievement.reward}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }
      `}</style>
    </div>
  )
})

interface StatsCardProps {
  stats: UserStats
}

export const StatsCard = memo(function StatsCard({ stats }: StatsCardProps) {
  // Calculate realistic time saved: workflows × 10min + tasks × 2min
  const calculatedTimeSaved = ((stats.workflowsCompleted * 10) + (stats.tasksAutomated * 2)) / 60

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Your Impact</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-slate-400">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="text-3xl font-bold text-cyan-400">{calculatedTimeSaved.toFixed(1)}h</div>
          <div className="text-sm text-slate-400">Time Saved</div>
          <div className="text-xs text-emerald-400 mt-1">
            ≈ ${Math.round(calculatedTimeSaved * 50).toLocaleString()} value
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="text-3xl font-bold text-purple-400">{stats.workflowsCompleted}</div>
          <div className="text-sm text-slate-400">Workflows Run</div>
          <div className="text-xs text-slate-500 mt-1">
            {stats.tasksAutomated} tasks automated
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="text-3xl font-bold text-emerald-400">{stats.integrationsConnected}</div>
          <div className="text-sm text-slate-400">Integrations</div>
          <div className="text-xs text-slate-500 mt-1">
            {stats.errorsRecovered} auto-recovered
          </div>
        </div>
      </div>
    </div>
  )
})

interface AchievementsPanelProps {
  achievements: Achievement[]
  stats?: UserStats
  onAchievementClick?: (achievement: Achievement) => void
}

export const AchievementsPanel = memo(function AchievementsPanel({ achievements, onAchievementClick }: AchievementsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<Achievement['category'] | 'all'>('all')

  const categories = [
    { id: 'all', label: 'All', icon: '🏅' },
    { id: 'workflows', label: 'Workflows', icon: '⚡' },
    { id: 'time', label: 'Time', icon: '⏱️' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' },
    { id: 'special', label: 'Special', icon: '⭐' },
  ]

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory)

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Achievements</h3>
          <div className="text-sm">
            <span className="text-cyan-400 font-bold">{unlockedCount}</span>
            <span className="text-slate-500">/{totalCount}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="p-4 border-b border-slate-700/50 flex gap-2 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as any)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${selectedCategory === cat.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }
            `}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="p-6">
        <div className="grid grid-cols-4 gap-4">
          {filteredAchievements.map(achievement => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              size="md"
              showDetails
              onClick={() => onAchievementClick?.(achievement)}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

// Hook for managing achievements
export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS)
  const [pendingNotification, setPendingNotification] = useState<Achievement | null>(null)
  const lastStatsRef = useRef<string | null>(null)

  const checkAchievements = useCallback((stats: UserStats) => {
    // Prevent infinite loops by checking if stats actually changed
    const statsKey = JSON.stringify(stats)
    if (lastStatsRef.current === statsKey) {
      return // Stats haven't changed, skip update
    }
    lastStatsRef.current = statsKey

    // Calculate realistic time saved for achievements
    const calculatedTimeSaved = ((stats.workflowsCompleted * 10) + (stats.tasksAutomated * 2)) / 60

    setAchievements(prevAchievements => {
      let hasChanges = false
      let newNotification: Achievement | null = null

      const updates = prevAchievements.map(achievement => {
        if (achievement.unlocked) return achievement

        let progress = 0
        let shouldUnlock = false

        switch (achievement.id) {
          case 'first-workflow':
            progress = Math.min(stats.workflowsCompleted, 1)
            shouldUnlock = stats.workflowsCompleted >= 1
            break
          case 'workflow-10':
            progress = stats.workflowsCompleted
            shouldUnlock = stats.workflowsCompleted >= 10
            break
          case 'workflow-50':
            progress = stats.workflowsCompleted
            shouldUnlock = stats.workflowsCompleted >= 50
            break
          case 'workflow-100':
            progress = stats.workflowsCompleted
            shouldUnlock = stats.workflowsCompleted >= 100
            break
          case 'time-1h':
            progress = calculatedTimeSaved
            shouldUnlock = calculatedTimeSaved >= 1
            break
          case 'time-10h':
            progress = calculatedTimeSaved
            shouldUnlock = calculatedTimeSaved >= 10
            break
          case 'time-100h':
            progress = calculatedTimeSaved
            shouldUnlock = calculatedTimeSaved >= 100
            break
          case 'integration-first':
            progress = stats.integrationsConnected
            shouldUnlock = stats.integrationsConnected >= 1
            break
          case 'integration-5':
            progress = stats.integrationsConnected
            shouldUnlock = stats.integrationsConnected >= 5
            break
          case 'error-recovery':
            progress = stats.errorsRecovered
            shouldUnlock = stats.errorsRecovered >= 5
            break
        }

        if (shouldUnlock && !achievement.unlocked) {
          hasChanges = true
          newNotification = { ...achievement, unlocked: true }
          return { ...achievement, unlocked: true, unlockedAt: new Date(), progress }
        }

        // Check if progress changed
        if (progress !== achievement.progress) {
          hasChanges = true
          return { ...achievement, progress }
        }

        return achievement
      })

      // Set notification outside of the state update if needed
      if (newNotification) {
        setTimeout(() => setPendingNotification(newNotification), 0)
      }

      return hasChanges ? updates : prevAchievements
    })
  }, [])

  const dismissNotification = useCallback(() => {
    setPendingNotification(null)
  }, [])

  return {
    achievements,
    pendingNotification,
    checkAchievements,
    dismissNotification,
  }
}

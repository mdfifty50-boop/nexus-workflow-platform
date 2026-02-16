import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Award,
  Trophy,
  Flame,
  Target,
  Clock,
  Zap,
  Star,
  TrendingUp,
  Calendar,
  BarChart3,
  Crown,
  Lock,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/contexts/AuthContext'
import { workflowPersistenceService } from '@/services/WorkflowPersistenceService'
import type { SavedWorkflow } from '@/services/WorkflowPersistenceService'

// ============================================================================
// Achievement definitions - progress computed from real data
// ============================================================================

interface AchievementDef {
  id: number
  name: string
  description: string
  icon: typeof Zap
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  color: string
  /** Returns a 0-1 progress value and whether the achievement is earned */
  check: (data: { workflows: SavedWorkflow[]; totalExecutions: number }) => {
    progress: number
    earned: boolean
    earnedDate?: string
  }
}

const achievementDefs: AchievementDef[] = [
  {
    id: 1,
    name: 'Automation Pioneer',
    description: 'Create your first workflow',
    icon: Zap,
    rarity: 'Common',
    color: 'from-blue-500 to-cyan-500',
    check: ({ workflows }) => {
      const earned = workflows.length >= 1
      const oldest = workflows.length > 0
        ? workflows.reduce((a, b) => (a.createdAt < b.createdAt ? a : b))
        : null
      return {
        progress: Math.min(workflows.length / 1, 1),
        earned,
        earnedDate: earned && oldest ? oldest.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
      }
    },
  },
  {
    id: 2,
    name: 'Time Wizard',
    description: 'Reach 100+ total executions',
    icon: Clock,
    rarity: 'Rare',
    color: 'from-purple-500 to-pink-500',
    check: ({ totalExecutions }) => ({
      progress: Math.min(totalExecutions / 100, 1),
      earned: totalExecutions >= 100,
    }),
  },
  {
    id: 3,
    name: 'Integration Master',
    description: 'Use 10+ different integrations',
    icon: Target,
    rarity: 'Epic',
    color: 'from-emerald-500 to-teal-500',
    check: ({ workflows }) => {
      const uniqueIntegrations = new Set<string>()
      workflows.forEach(w => w.requiredIntegrations?.forEach(i => uniqueIntegrations.add(i)))
      const count = uniqueIntegrations.size
      return { progress: Math.min(count / 10, 1), earned: count >= 10 }
    },
  },
  {
    id: 4,
    name: 'Workflow Architect',
    description: 'Build 10+ workflows',
    icon: Trophy,
    rarity: 'Epic',
    color: 'from-amber-500 to-orange-500',
    check: ({ workflows }) => ({
      progress: Math.min(workflows.length / 10, 1),
      earned: workflows.length >= 10,
    }),
  },
  {
    id: 5,
    name: 'Execution Machine',
    description: 'Reach 1,000 total executions',
    icon: TrendingUp,
    rarity: 'Legendary',
    color: 'from-orange-500 to-red-500',
    check: ({ totalExecutions }) => ({
      progress: Math.min(totalExecutions / 1000, 1),
      earned: totalExecutions >= 1000,
    }),
  },
  {
    id: 6,
    name: 'Master Builder',
    description: 'Build 25+ workflows',
    icon: Crown,
    rarity: 'Legendary',
    color: 'from-indigo-500 to-purple-500',
    check: ({ workflows }) => ({
      progress: Math.min(workflows.length / 25, 1),
      earned: workflows.length >= 25,
    }),
  },
]

// ============================================================================
// Helpers
// ============================================================================

/** Compute level and XP from workflow count + execution count */
function computeLevelXP(workflowCount: number, executionCount: number) {
  // 100 XP per workflow, 1 XP per execution
  const totalXP = workflowCount * 100 + executionCount
  // Each level requires 500 XP, starting at Level 1
  const level = Math.max(1, Math.floor(totalXP / 500) + 1)
  const xpInCurrentLevel = totalXP % 500
  const xpForNextLevel = 500
  return { level, totalXP, xpInCurrentLevel, xpForNextLevel }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/** Build last-6-months activity data from real workflows */
function buildActivityData(workflows: SavedWorkflow[]) {
  const now = new Date()
  const months: { month: string; executions: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    // Count workflows created in that month as a proxy for activity
    const count = workflows.filter(w => {
      const created = new Date(w.createdAt)
      return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear()
    }).length
    months.push({ month: label, executions: count })
  }
  return months
}

export function Profile() {
  const { t } = useTranslation()
  const { userProfile, user } = useAuth()
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const result = await workflowPersistenceService.loadWorkflows()
        if (!cancelled) {
          setWorkflows(result.workflows)
        }
      } catch {
        // Graceful fallback -- empty data
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Derived data
  const totalExecutions = useMemo(
    () => workflows.reduce((sum, w) => sum + (w.executionCount || 0), 0),
    [workflows],
  )

  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || t('auth.user')
  const initials = displayName
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'
  const joinDate = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently'

  const { level, xpInCurrentLevel, xpForNextLevel } = computeLevelXP(workflows.length, totalExecutions)
  const levelPercent = xpForNextLevel > 0 ? Math.round((xpInCurrentLevel / xpForNextLevel) * 100) : 0

  // Estimated time saved: ~5 min per execution as a rough heuristic
  const hoursSaved = Math.round((totalExecutions * 5) / 60)

  const stats = [
    { label: t('analytics.totalWorkflows'), value: String(workflows.length), icon: Zap, color: 'text-blue-400' },
    { label: t('analytics.totalExecutions'), value: formatNumber(totalExecutions), icon: TrendingUp, color: 'text-purple-400' },
    { label: t('dashboard.timeSaved'), value: `${hoursSaved}h`, icon: Clock, color: 'text-emerald-400' },
    { label: `${t('common.active')} ${t('workflow.title')}`, value: String(workflows.filter(w => w.status === 'active').length), icon: Flame, color: 'text-orange-400' },
  ]

  const achievementResults = useMemo(() => {
    return achievementDefs.map(def => ({
      ...def,
      ...def.check({ workflows, totalExecutions }),
    }))
  }, [workflows, totalExecutions])

  const earnedCount = achievementResults.filter(a => a.earned).length

  const activityData = useMemo(() => buildActivityData(workflows), [workflows])
  const maxActivity = Math.max(...activityData.map(d => d.executions), 1)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-nexus-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-nexus-500/10 via-accent-500/10 to-transparent overflow-hidden relative"
      >
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-nexus-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-nexus-500 to-accent-500 flex items-center justify-center text-xl sm:text-3xl font-bold text-white shadow-xl shadow-nexus-500/30">
              {initials}
            </div>
            {level >= 5 && (
              <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 sm:border-4 border-surface-900">
                <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{displayName}</h1>
              {level >= 5 && (
                <span className="badge text-xs sm:text-sm bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro User
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-surface-400 mb-3 sm:mb-4">
              {workflows.length > 0
                ? `Automating workflows since ${new Date(workflows.reduce((a, b) => a.createdAt < b.createdAt ? a : b).createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                : 'Get started by creating your first workflow'}
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-surface-500" />
                <span className="text-surface-300">Joined {joinDate}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-surface-300">Level {level}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                <span className="text-surface-300">{earnedCount} Achievement{earnedCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Level progress */}
          <div className="w-full md:w-48">
            <div className="flex justify-between md:justify-end mb-2">
              <span className="text-xs sm:text-sm text-surface-400">Level {level}</span>
              <span className="text-xs sm:text-sm text-surface-500">{' \u2192 '}</span>
              <span className="text-xs sm:text-sm text-white">Level {level + 1}</span>
            </div>
            <div className="h-2 sm:h-3 bg-surface-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelPercent}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-nexus-500 to-accent-500 rounded-full"
              />
            </div>
            <p className="text-[10px] sm:text-xs text-surface-500 text-right mt-1">{xpInCurrentLevel} / {xpForNextLevel} XP</p>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card py-3 sm:py-5"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <stat.icon className={clsx('w-6 h-6 sm:w-8 sm:h-8', stat.color)} />
              <div>
                <p className="text-lg sm:text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-surface-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Achievements */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              <h2 className="text-base sm:text-lg font-semibold text-white">Achievements</h2>
            </div>
            <span className="text-xs sm:text-sm text-surface-500">{earnedCount} / {achievementResults.length} earned</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {achievementResults.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={clsx(
                  'flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all',
                  achievement.earned
                    ? 'bg-surface-800/50 hover:bg-surface-800 border-transparent hover:border-surface-700 cursor-pointer'
                    : 'bg-surface-900/50 border-surface-800/50 opacity-60'
                )}
              >
                <div className={clsx(
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 relative',
                  achievement.earned
                    ? `bg-gradient-to-br ${achievement.color}`
                    : 'bg-surface-800'
                )}>
                  {achievement.earned ? (
                    <achievement.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  ) : (
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-surface-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <p className={clsx(
                      'text-sm sm:text-base font-medium truncate',
                      achievement.earned ? 'text-white' : 'text-surface-400'
                    )}>{achievement.name}</p>
                    <span className={clsx(
                      'text-[10px] sm:text-xs px-1.5 py-0.5 rounded flex-shrink-0',
                      achievement.rarity === 'Common' && 'bg-surface-700 text-surface-300',
                      achievement.rarity === 'Rare' && 'bg-blue-500/20 text-blue-400',
                      achievement.rarity === 'Epic' && 'bg-purple-500/20 text-purple-400',
                      achievement.rarity === 'Legendary' && 'bg-amber-500/20 text-amber-400'
                    )}>
                      {achievement.rarity}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-surface-400 truncate">{achievement.description}</p>
                  {achievement.earned && achievement.earnedDate ? (
                    <p className="text-[10px] sm:text-xs text-surface-500 mt-1">Earned {achievement.earnedDate}</p>
                  ) : (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-nexus-500 to-accent-500 rounded-full transition-all"
                          style={{ width: `${Math.round(achievement.progress * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-surface-500 flex-shrink-0">{Math.round(achievement.progress * 100)}%</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Leaderboard - Coming Soon */}
        <div className="card flex flex-col items-center justify-center py-10 sm:py-16 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-surface-500" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-white mb-2">Leaderboard</h2>
          <p className="text-sm text-surface-400 max-w-[200px]">
            Community rankings are coming soon. Keep building workflows to climb the ranks!
          </p>
        </div>
      </div>

      {/* Activity chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-nexus-400" />
            <h2 className="text-base sm:text-lg font-semibold text-white">Activity Overview</h2>
          </div>
          <span className="text-xs text-surface-500">Workflows created per month</span>
        </div>

        {/* Simple bar chart */}
        <div className="flex items-end gap-2 sm:gap-4 h-36 sm:h-48">
          {activityData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: data.executions > 0 ? `${(data.executions / maxActivity) * 100}%` : '2px' }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={clsx(
                  'w-full rounded-t-lg relative group',
                  data.executions > 0
                    ? 'bg-gradient-to-t from-nexus-600 to-nexus-400'
                    : 'bg-surface-700'
                )}
              >
                {data.executions > 0 && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-surface-800 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {data.executions}
                  </div>
                )}
              </motion.div>
              <span className="text-xs text-surface-400">{data.month}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

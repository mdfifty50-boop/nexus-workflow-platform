/**
 * AchievementsContext.tsx
 *
 * Global achievements state management with localStorage persistence.
 * Tracks user progress and triggers achievement unlocks.
 *
 * SAFE: This is a NEW file - does not modify any protected code.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

// ============================================================================
// Types
// ============================================================================

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type AchievementCategory = 'workflows' | 'time' | 'integrations' | 'special' | 'streak'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  tier: AchievementTier
  target: number
  reward?: string
}

export interface UserAchievement extends Achievement {
  progress: number
  unlocked: boolean
  unlockedAt?: string
}

export interface AchievementStats {
  workflowsCompleted: number
  timeSavedMinutes: number
  integrationsConnected: number
  tasksAutomated: number
  errorsRecovered: number
  loginStreak: number
  lastLoginDate: string | null
}

interface AchievementsContextValue {
  achievements: UserAchievement[]
  stats: AchievementStats
  pendingNotification: UserAchievement | null
  // Actions
  incrementStat: (stat: keyof Omit<AchievementStats, 'lastLoginDate'>, amount?: number) => void
  dismissNotification: () => void
  resetAchievements: () => void
  // Computed
  totalUnlocked: number
  totalAchievements: number
  unlockedPercentage: number
}

// ============================================================================
// Achievement Definitions
// ============================================================================

const ACHIEVEMENTS: Achievement[] = [
  // Workflow Achievements
  {
    id: 'first-workflow',
    name: 'First Automation',
    description: 'Create and run your first workflow',
    icon: '🚀',
    category: 'workflows',
    tier: 'bronze',
    target: 1,
    reward: '+5 bonus workflows this month',
  },
  {
    id: 'workflow-10',
    name: 'Automation Enthusiast',
    description: 'Complete 10 workflows',
    icon: '⚡',
    category: 'workflows',
    tier: 'silver',
    target: 10,
    reward: '+10% token efficiency',
  },
  {
    id: 'workflow-50',
    name: 'Workflow Master',
    description: 'Complete 50 workflows',
    icon: '🏆',
    category: 'workflows',
    tier: 'gold',
    target: 50,
    reward: 'Priority execution queue',
  },
  {
    id: 'workflow-100',
    name: 'Automation Legend',
    description: 'Complete 100 workflows',
    icon: '👑',
    category: 'workflows',
    tier: 'platinum',
    target: 100,
    reward: 'Custom agent avatar unlock',
  },

  // Time Saved Achievements (in hours)
  {
    id: 'time-1h',
    name: 'Time Saver',
    description: 'Save 1 hour of work',
    icon: '⏱️',
    category: 'time',
    tier: 'bronze',
    target: 60, // 60 minutes
  },
  {
    id: 'time-10h',
    name: 'Efficiency Expert',
    description: 'Save 10 hours of work',
    icon: '⚙️',
    category: 'time',
    tier: 'silver',
    target: 600, // 600 minutes = 10 hours
  },
  {
    id: 'time-100h',
    name: 'Productivity Champion',
    description: 'Save 100 hours of work',
    icon: '🎯',
    category: 'time',
    tier: 'gold',
    target: 6000, // 6000 minutes = 100 hours
    reward: 'Featured in success stories',
  },

  // Integration Achievements
  {
    id: 'integration-first',
    name: 'Connected',
    description: 'Connect your first integration',
    icon: '🔗',
    category: 'integrations',
    tier: 'bronze',
    target: 1,
  },
  {
    id: 'integration-5',
    name: 'Integration Pro',
    description: 'Connect 5 different tools',
    icon: '🔌',
    category: 'integrations',
    tier: 'silver',
    target: 5,
    reward: 'Premium integration access',
  },
  {
    id: 'integration-10',
    name: 'Fully Connected',
    description: 'Connect 10 different tools',
    icon: '🌐',
    category: 'integrations',
    tier: 'gold',
    target: 10,
  },

  // Streak Achievements
  {
    id: 'streak-3',
    name: 'Getting Started',
    description: '3-day login streak',
    icon: '🔥',
    category: 'streak',
    tier: 'bronze',
    target: 3,
  },
  {
    id: 'streak-7',
    name: 'Weekly Warrior',
    description: '7-day login streak',
    icon: '💪',
    category: 'streak',
    tier: 'silver',
    target: 7,
  },
  {
    id: 'streak-30',
    name: 'Streak Master',
    description: '30-day login streak',
    icon: '🌟',
    category: 'streak',
    tier: 'gold',
    target: 30,
    reward: 'Exclusive Streak badge',
  },

  // Special Achievements
  {
    id: 'error-recovery',
    name: 'Self-Healer',
    description: 'AI recovered from 5 errors automatically',
    icon: '🛡️',
    category: 'special',
    tier: 'silver',
    target: 5,
  },
  {
    id: 'tasks-100',
    name: 'Task Terminator',
    description: 'Automate 100 individual tasks',
    icon: '🤖',
    category: 'special',
    tier: 'gold',
    target: 100,
  },
]

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  stats: 'nexus_achievement_stats',
  unlocked: 'nexus_unlocked_achievements',
}

// ============================================================================
// Default Values
// ============================================================================

const defaultStats: AchievementStats = {
  workflowsCompleted: 0,
  timeSavedMinutes: 0,
  integrationsConnected: 0,
  tasksAutomated: 0,
  errorsRecovered: 0,
  loginStreak: 0,
  lastLoginDate: null,
}

// ============================================================================
// Context
// ============================================================================

const AchievementsContext = createContext<AchievementsContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

interface AchievementsProviderProps {
  children: ReactNode
}

export function AchievementsProvider({ children }: AchievementsProviderProps) {
  // Load initial stats from localStorage
  const [stats, setStats] = useState<AchievementStats>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.stats)
      return stored ? { ...defaultStats, ...JSON.parse(stored) } : defaultStats
    } catch {
      return defaultStats
    }
  })

  // Load unlocked achievements from localStorage
  const [unlockedIds, setUnlockedIds] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.unlocked)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  // Notification queue
  const [pendingNotification, setPendingNotification] = useState<UserAchievement | null>(null)

  // Calculate user achievements with progress
  const achievements: UserAchievement[] = ACHIEVEMENTS.map(achievement => {
    const unlocked = !!unlockedIds[achievement.id]
    let progress = 0

    // Calculate progress based on achievement type
    switch (achievement.category) {
      case 'workflows':
        progress = stats.workflowsCompleted
        break
      case 'time':
        progress = stats.timeSavedMinutes
        break
      case 'integrations':
        progress = stats.integrationsConnected
        break
      case 'streak':
        progress = stats.loginStreak
        break
      case 'special':
        if (achievement.id === 'error-recovery') {
          progress = stats.errorsRecovered
        } else if (achievement.id === 'tasks-100') {
          progress = stats.tasksAutomated
        }
        break
    }

    return {
      ...achievement,
      progress: Math.min(progress, achievement.target),
      unlocked,
      unlockedAt: unlockedIds[achievement.id] || undefined,
    }
  })

  // Check and unlock achievements when stats change
  useEffect(() => {
    const newUnlocks: UserAchievement[] = []

    achievements.forEach(achievement => {
      if (!achievement.unlocked && achievement.progress >= achievement.target) {
        newUnlocks.push(achievement)
      }
    })

    if (newUnlocks.length > 0) {
      const now = new Date().toISOString()
      const updatedUnlocks = { ...unlockedIds }

      newUnlocks.forEach(achievement => {
        updatedUnlocks[achievement.id] = now
      })

      setUnlockedIds(updatedUnlocks)
      localStorage.setItem(STORAGE_KEYS.unlocked, JSON.stringify(updatedUnlocks))

      // Show notification for first new unlock
      if (newUnlocks[0]) {
        setPendingNotification({
          ...newUnlocks[0],
          unlocked: true,
          unlockedAt: now,
        })
      }
    }
  }, [stats]) // Only depend on stats changes

  // Persist stats to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats))
  }, [stats])

  // Update login streak on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]

    if (stats.lastLoginDate !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      setStats(prev => ({
        ...prev,
        loginStreak: prev.lastLoginDate === yesterdayStr ? prev.loginStreak + 1 : 1,
        lastLoginDate: today,
      }))
    }
  }, [])

  // Actions
  const incrementStat = useCallback((
    stat: keyof Omit<AchievementStats, 'lastLoginDate'>,
    amount = 1
  ) => {
    setStats(prev => ({
      ...prev,
      [stat]: prev[stat] + amount,
    }))
  }, [])

  const dismissNotification = useCallback(() => {
    setPendingNotification(null)
  }, [])

  const resetAchievements = useCallback(() => {
    setStats(defaultStats)
    setUnlockedIds({})
    localStorage.removeItem(STORAGE_KEYS.stats)
    localStorage.removeItem(STORAGE_KEYS.unlocked)
  }, [])

  // Computed values
  const totalUnlocked = Object.keys(unlockedIds).length
  const totalAchievements = ACHIEVEMENTS.length
  const unlockedPercentage = Math.round((totalUnlocked / totalAchievements) * 100)

  const value: AchievementsContextValue = {
    achievements,
    stats,
    pendingNotification,
    incrementStat,
    dismissNotification,
    resetAchievements,
    totalUnlocked,
    totalAchievements,
    unlockedPercentage,
  }

  return (
    <AchievementsContext.Provider value={value}>
      {children}
    </AchievementsContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useAchievementsContext() {
  const context = useContext(AchievementsContext)
  if (!context) {
    throw new Error('useAchievementsContext must be used within AchievementsProvider')
  }
  return context
}

export default AchievementsContext

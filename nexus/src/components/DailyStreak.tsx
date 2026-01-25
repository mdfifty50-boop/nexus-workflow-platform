import { useState, useEffect, useCallback } from 'react'

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string // ISO date string
  streakFreezesAvailable: number
  streakFreezesUsed: number
  weeklyActivity: boolean[] // Last 7 days, index 0 = today
}

const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 7,
  longestStreak: 14,
  lastActiveDate: new Date().toISOString().split('T')[0],
  streakFreezesAvailable: 2,
  streakFreezesUsed: 1,
  weeklyActivity: [true, true, true, false, true, true, true],
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365]
const STREAK_REWARDS = {
  3: { name: '3-Day Streak', icon: '🔥', reward: '+5 bonus tokens' },
  7: { name: 'Week Warrior', icon: '⚡', reward: '+1 streak freeze' },
  14: { name: 'Fortnight Fighter', icon: '🏆', reward: '+10% efficiency' },
  30: { name: 'Monthly Master', icon: '👑', reward: 'Premium template access' },
  60: { name: 'Power Performer', icon: '💎', reward: 'Custom badge' },
  100: { name: 'Century Club', icon: '🌟', reward: 'VIP status' },
  365: { name: 'Year of Excellence', icon: '🏅', reward: 'Lifetime perks' },
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface StreakCalendarProps {
  weeklyActivity: boolean[]
}

function StreakCalendar({ weeklyActivity }: StreakCalendarProps) {
  const today = new Date()
  const days = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayIndex = 6 - i
    const isActive = weeklyActivity[dayIndex]

    days.push({
      date,
      dayName: DAY_NAMES[date.getDay()],
      dayNum: date.getDate(),
      isActive,
      isToday: i === 0,
    })
  }

  return (
    <div className="flex items-center justify-between gap-2">
      {days.map((day, index) => (
        <div key={index} className="flex flex-col items-center">
          <span className="text-[10px] text-slate-500 mb-1">{day.dayName}</span>
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium
            transition-all duration-300
            ${day.isToday ? 'ring-2 ring-cyan-500/50' : ''}
            ${day.isActive
              ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30'
              : 'bg-slate-800 text-slate-500'
            }
          `}>
            {day.isActive ? '🔥' : day.dayNum}
          </div>
        </div>
      ))}
    </div>
  )
}

interface StreakFreezeProps {
  available: number
  onUseFreeze: () => void
  disabled?: boolean
}

function StreakFreezeOption({ available, onUseFreeze, disabled }: StreakFreezeProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  if (showConfirm) {
    return (
      <div className="bg-slate-800 rounded-xl p-4 animate-pulse-subtle">
        <p className="text-sm text-slate-300 mb-3">
          Use a streak freeze to protect your streak tomorrow?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onUseFreeze()
              setShowConfirm(false)
            }}
            className="flex-1 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Use Freeze
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      disabled={disabled || available === 0}
      className={`
        w-full flex items-center justify-between p-3 rounded-xl border transition-all
        ${available > 0 && !disabled
          ? 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800'
          : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">❄️</div>
        <div className="text-left">
          <p className="text-sm font-medium text-white">Streak Freeze</p>
          <p className="text-xs text-slate-400">Protect your streak for a day</p>
        </div>
      </div>
      <div className={`
        px-2 py-1 rounded-lg text-sm font-bold
        ${available > 0 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}
      `}>
        {available} left
      </div>
    </button>
  )
}

interface NextMilestoneProgressProps {
  currentStreak: number
}

function NextMilestoneProgress({ currentStreak }: NextMilestoneProgressProps) {
  const nextMilestone = STREAK_MILESTONES.find(m => m > currentStreak)
  if (!nextMilestone) return null

  const previousMilestone = STREAK_MILESTONES.filter(m => m < nextMilestone).pop() || 0
  const progress = ((currentStreak - previousMilestone) / (nextMilestone - previousMilestone)) * 100
  const remaining = nextMilestone - currentStreak
  const reward = STREAK_REWARDS[nextMilestone as keyof typeof STREAK_REWARDS]

  return (
    <div className="bg-slate-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{reward.icon}</span>
          <div>
            <p className="text-sm font-medium text-white">{reward.name}</p>
            <p className="text-xs text-emerald-400">{reward.reward}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-cyan-400">{remaining}</p>
          <p className="text-xs text-slate-500">days left</p>
        </div>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

interface DailyStreakProps {
  data?: StreakData
  onUseFreeze?: () => void
  compact?: boolean
  className?: string
}

export function DailyStreak({
  data = DEFAULT_STREAK_DATA,
  onUseFreeze,
  compact = false,
  className = '',
}: DailyStreakProps) {
  const [streakData, setStreakData] = useState(data)
  const [showAnimation, setShowAnimation] = useState(false)

  // Animate streak counter on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleUseFreeze = useCallback(() => {
    if (streakData.streakFreezesAvailable > 0) {
      setStreakData(prev => ({
        ...prev,
        streakFreezesAvailable: prev.streakFreezesAvailable - 1,
        streakFreezesUsed: prev.streakFreezesUsed + 1,
      }))
      onUseFreeze?.()
    }
  }, [streakData.streakFreezesAvailable, onUseFreeze])

  // Check if at risk (not active today)
  const isAtRisk = !streakData.weeklyActivity[0] && streakData.currentStreak > 0

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className="text-xl font-bold text-orange-500">{streakData.currentStreak}</span>
          <span className="text-sm text-slate-400">day streak</span>
        </div>
        {isAtRisk && (
          <div className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg animate-pulse">
            At risk!
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden ${className}`}>
      {/* Header with streak counter */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Daily Streak</h3>
          {isAtRisk && (
            <div className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full animate-pulse">
              At risk - use app today!
            </div>
          )}
        </div>

        {/* Main streak display */}
        <div className="flex items-center justify-center py-4">
          <div className="relative">
            {/* Animated glow effect */}
            <div className={`
              absolute inset-0 bg-gradient-to-r from-orange-500/30 to-red-500/30 blur-xl rounded-full
              transition-opacity duration-500 ${showAnimation ? 'opacity-100' : 'opacity-0'}
            `} />

            <div className="relative flex items-center gap-4">
              <div className={`
                text-6xl transition-transform duration-500
                ${showAnimation ? 'scale-100' : 'scale-0'}
              `}>
                🔥
              </div>
              <div className="text-center">
                <div className={`
                  text-5xl font-black bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent
                  transition-all duration-500 ${showAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
                `}>
                  {streakData.currentStreak}
                </div>
                <p className="text-slate-400 text-sm mt-1">day streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 text-center">
          <div>
            <p className="text-xl font-bold text-purple-400">{streakData.longestStreak}</p>
            <p className="text-xs text-slate-500">Best streak</p>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div>
            <p className="text-xl font-bold text-cyan-400">{streakData.streakFreezesAvailable}</p>
            <p className="text-xs text-slate-500">Freezes left</p>
          </div>
        </div>
      </div>

      {/* Weekly calendar */}
      <div className="p-6 border-b border-slate-700/50">
        <p className="text-sm text-slate-400 mb-3">This Week</p>
        <StreakCalendar weeklyActivity={streakData.weeklyActivity} />
      </div>

      {/* Next milestone */}
      <div className="p-6 border-b border-slate-700/50">
        <p className="text-sm text-slate-400 mb-3">Next Milestone</p>
        <NextMilestoneProgress currentStreak={streakData.currentStreak} />
      </div>

      {/* Streak freeze option */}
      <div className="p-6">
        <p className="text-sm text-slate-400 mb-3">Streak Protection</p>
        <StreakFreezeOption
          available={streakData.streakFreezesAvailable}
          onUseFreeze={handleUseFreeze}
          disabled={!isAtRisk}
        />
        <p className="text-xs text-slate-500 mt-2 text-center">
          Earn streak freezes by reaching milestones
        </p>
      </div>

      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// Hook for managing streak state
export function useDailyStreak(initialData?: StreakData) {
  const [streakData, setStreakData] = useState<StreakData>(initialData || DEFAULT_STREAK_DATA)

  const updateActivity = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    setStreakData(prev => {
      if (prev.lastActiveDate === today) return prev

      const newWeeklyActivity = [true, ...prev.weeklyActivity.slice(0, 6)]
      const wasActiveYesterday = prev.weeklyActivity[0]

      return {
        ...prev,
        lastActiveDate: today,
        weeklyActivity: newWeeklyActivity,
        currentStreak: wasActiveYesterday ? prev.currentStreak + 1 : 1,
        longestStreak: Math.max(prev.longestStreak, wasActiveYesterday ? prev.currentStreak + 1 : 1),
      }
    })
  }, [])

  const useFreeze = useCallback(() => {
    setStreakData(prev => ({
      ...prev,
      streakFreezesAvailable: Math.max(0, prev.streakFreezesAvailable - 1),
      streakFreezesUsed: prev.streakFreezesUsed + 1,
    }))
  }, [])

  return {
    streakData,
    updateActivity,
    useFreeze,
  }
}

export default DailyStreak

import { useState, useEffect } from 'react'

export interface Milestone {
  id: string
  name: string
  description: string
  icon: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  currentValue: number
  targetValue: number
  unit: string
  reward?: string
  completed: boolean
  completedAt?: Date
}

const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 'workflows-bronze',
    name: 'Bronze Automator',
    description: 'Complete 5 workflows',
    icon: '🥉',
    tier: 'bronze',
    currentValue: 3,
    targetValue: 5,
    unit: 'workflows',
    reward: 'Badge unlock',
    completed: false,
  },
  {
    id: 'workflows-silver',
    name: 'Silver Automator',
    description: 'Complete 25 workflows',
    icon: '🥈',
    tier: 'silver',
    currentValue: 3,
    targetValue: 25,
    unit: 'workflows',
    reward: '+10 monthly workflows',
    completed: false,
  },
  {
    id: 'workflows-gold',
    name: 'Gold Automator',
    description: 'Complete 100 workflows',
    icon: '🥇',
    tier: 'gold',
    currentValue: 3,
    targetValue: 100,
    unit: 'workflows',
    reward: 'Priority support',
    completed: false,
  },
  {
    id: 'time-saved-bronze',
    name: 'Time Saver I',
    description: 'Save 10 hours of work',
    icon: '⏱️',
    tier: 'bronze',
    currentValue: 8,
    targetValue: 10,
    unit: 'hours',
    reward: 'Efficiency badge',
    completed: false,
  },
  {
    id: 'integrations-bronze',
    name: 'Connector I',
    description: 'Connect 3 integrations',
    icon: '🔌',
    tier: 'bronze',
    currentValue: 2,
    targetValue: 3,
    unit: 'integrations',
    reward: 'Integration badge',
    completed: false,
  },
  {
    id: 'streak-silver',
    name: 'Consistency Champion',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    tier: 'silver',
    currentValue: 4,
    targetValue: 7,
    unit: 'days',
    reward: 'Streak badge',
    completed: false,
  },
]

const TIER_COLORS = {
  bronze: {
    bg: 'from-amber-700/20 to-amber-900/20',
    border: 'border-amber-700/50',
    progress: 'from-amber-600 to-amber-800',
    text: 'text-amber-500',
  },
  silver: {
    bg: 'from-slate-400/20 to-slate-600/20',
    border: 'border-slate-500/50',
    progress: 'from-slate-400 to-slate-600',
    text: 'text-slate-400',
  },
  gold: {
    bg: 'from-yellow-500/20 to-amber-600/20',
    border: 'border-yellow-500/50',
    progress: 'from-yellow-500 to-amber-600',
    text: 'text-yellow-500',
  },
  platinum: {
    bg: 'from-cyan-400/20 to-slate-400/20',
    border: 'border-cyan-400/50',
    progress: 'from-cyan-400 to-slate-400',
    text: 'text-cyan-400',
  },
  diamond: {
    bg: 'from-purple-400/20 to-pink-400/20',
    border: 'border-purple-400/50',
    progress: 'from-purple-400 via-pink-400 to-cyan-400',
    text: 'text-purple-400',
  },
}

interface MilestoneCardProps {
  milestone: Milestone
  showReward?: boolean
}

function MilestoneCard({ milestone, showReward = true }: MilestoneCardProps) {
  const colors = TIER_COLORS[milestone.tier]
  const progress = Math.min(100, (milestone.currentValue / milestone.targetValue) * 100)
  const remaining = milestone.targetValue - milestone.currentValue

  return (
    <div className={`
      relative p-4 rounded-xl border transition-all duration-300
      bg-gradient-to-br ${colors.bg} ${colors.border}
      ${milestone.completed ? 'opacity-70' : 'hover:scale-[1.02]'}
    `}>
      {/* Completed overlay */}
      {milestone.completed && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="text-3xl">{milestone.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">{milestone.name}</h4>
          <p className="text-sm text-slate-400 truncate">{milestone.description}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400">
            {milestone.currentValue} / {milestone.targetValue} {milestone.unit}
          </span>
          <span className={colors.text}>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${colors.progress} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Remaining message */}
      {!milestone.completed && remaining > 0 && (
        <p className="text-xs text-cyan-400 mt-2">
          {remaining} more {milestone.unit} to {milestone.tier.charAt(0).toUpperCase() + milestone.tier.slice(1)} status
        </p>
      )}

      {/* Reward */}
      {showReward && milestone.reward && !milestone.completed && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Reward:</span>
            <span className="text-emerald-400 font-medium">{milestone.reward}</span>
          </div>
        </div>
      )}
    </div>
  )
}

interface NextMilestoneProps {
  milestones: Milestone[]
}

function NextMilestone({ milestones }: NextMilestoneProps) {
  // Find the closest milestone to completion
  const incompleteMilestones = milestones.filter(m => !m.completed)
  if (incompleteMilestones.length === 0) return null

  const closest = incompleteMilestones.reduce((prev, curr) => {
    const prevProgress = prev.currentValue / prev.targetValue
    const currProgress = curr.currentValue / curr.targetValue
    return currProgress > prevProgress ? curr : prev
  })

  const remaining = closest.targetValue - closest.currentValue
  const colors = TIER_COLORS[closest.tier]

  return (
    <div className={`
      p-4 rounded-xl border-2 border-dashed ${colors.border}
      bg-gradient-to-r ${colors.bg}
    `}>
      <div className="flex items-center gap-4">
        <div className="text-4xl animate-pulse">{closest.icon}</div>
        <div className="flex-1">
          <p className="text-sm text-slate-400">Next milestone:</p>
          <h4 className={`font-bold ${colors.text}`}>{closest.name}</h4>
          <p className="text-lg text-white mt-1">
            <span className="font-bold text-cyan-400">{remaining}</span>
            <span className="text-sm text-slate-400"> more {closest.unit} to go!</span>
          </p>
        </div>
        {closest.reward && (
          <div className="text-right">
            <p className="text-xs text-slate-500">Reward</p>
            <p className="text-sm text-emerald-400 font-medium">{closest.reward}</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface MilestoneTrackerProps {
  milestones?: Milestone[]
  showNextMilestone?: boolean
  showAllMilestones?: boolean
  maxVisible?: number
  className?: string
}

export function MilestoneTracker({
  milestones = DEFAULT_MILESTONES,
  showNextMilestone = true,
  showAllMilestones = true,
  maxVisible = 6,
  className = '',
}: MilestoneTrackerProps) {
  const [animatedProgress, setAnimatedProgress] = useState(false)

  // Animate on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const completedCount = milestones.filter(m => m.completed).length
  const totalCount = milestones.length
  const overallProgress = (completedCount / totalCount) * 100

  const visibleMilestones = showAllMilestones
    ? milestones
    : milestones.slice(0, maxVisible)

  // Group milestones by tier
  const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const
  const milestonesByTier = tiers.reduce((acc, tier) => {
    acc[tier] = milestones.filter(m => m.tier === tier)
    return acc
  }, {} as Record<typeof tiers[number], Milestone[]>)

  return (
    <div className={`bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>Milestone Progress</span>
            <span className="text-2xl">🎯</span>
          </h3>
          <div className="text-sm">
            <span className="text-cyan-400 font-bold">{completedCount}</span>
            <span className="text-slate-500">/{totalCount} completed</span>
          </div>
        </div>

        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-1000 ${animatedProgress ? '' : 'w-0'}`}
              style={{ width: animatedProgress ? `${overallProgress}%` : '0%' }}
            />
          </div>
        </div>

        {/* Tier progress indicators */}
        <div className="flex items-center gap-2 mt-4">
          {tiers.map(tier => {
            const tierMilestones = milestonesByTier[tier]
            if (tierMilestones.length === 0) return null
            const completed = tierMilestones.filter(m => m.completed).length
            const colors = TIER_COLORS[tier]
            return (
              <div
                key={tier}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/50`}
                title={`${tier}: ${completed}/${tierMilestones.length}`}
              >
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors.progress}`} />
                <span className={`text-xs ${colors.text}`}>
                  {completed}/{tierMilestones.length}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Next milestone highlight */}
      {showNextMilestone && (
        <div className="px-6 pt-6">
          <NextMilestone milestones={milestones} />
        </div>
      )}

      {/* Milestones grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleMilestones.map(milestone => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
        </div>

        {/* Show more */}
        {!showAllMilestones && milestones.length > maxVisible && (
          <div className="mt-4 text-center">
            <button className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
              View all {milestones.length} milestones
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MilestoneTracker

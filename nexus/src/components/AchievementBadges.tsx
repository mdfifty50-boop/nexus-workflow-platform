import { useState } from 'react'

// Achievement categories for display
export type BadgeCategory = 'starter' | 'power_user' | 'collaborator'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: BadgeCategory
  earned: boolean
  earnedAt?: Date
  requirement: string
  tier: 'bronze' | 'silver' | 'gold' | 'diamond'
}

// Default badges configuration
const DEFAULT_BADGES: Badge[] = [
  // Starter badges
  {
    id: 'first-login',
    name: 'Welcome Aboard',
    description: 'Log in for the first time',
    icon: '🚀',
    category: 'starter',
    earned: true,
    earnedAt: new Date(),
    requirement: 'Complete first login',
    tier: 'bronze',
  },
  {
    id: 'profile-complete',
    name: 'Identity Established',
    description: 'Complete your profile setup',
    icon: '👤',
    category: 'starter',
    earned: true,
    earnedAt: new Date(Date.now() - 86400000),
    requirement: 'Fill out all profile fields',
    tier: 'bronze',
  },
  {
    id: 'first-workflow',
    name: 'Automation Pioneer',
    description: 'Create your first workflow',
    icon: '⚡',
    category: 'starter',
    earned: true,
    earnedAt: new Date(Date.now() - 172800000),
    requirement: 'Create and save 1 workflow',
    tier: 'silver',
  },
  {
    id: 'first-integration',
    name: 'Connected',
    description: 'Connect your first external service',
    icon: '🔗',
    category: 'starter',
    earned: false,
    requirement: 'Connect 1 integration',
    tier: 'bronze',
  },

  // Power User badges
  {
    id: 'workflow-master',
    name: 'Workflow Master',
    description: 'Create 10 successful workflows',
    icon: '🏆',
    category: 'power_user',
    earned: false,
    requirement: 'Complete 10 workflows',
    tier: 'gold',
  },
  {
    id: 'time-saver',
    name: 'Time Lord',
    description: 'Save 24 hours through automation',
    icon: '⏰',
    category: 'power_user',
    earned: false,
    requirement: 'Accumulate 24 hours saved',
    tier: 'gold',
  },
  {
    id: 'efficiency-expert',
    name: 'Efficiency Expert',
    description: 'Maintain 95% workflow success rate',
    icon: '📊',
    category: 'power_user',
    earned: true,
    earnedAt: new Date(Date.now() - 604800000),
    requirement: '95%+ success rate over 20 workflows',
    tier: 'silver',
  },
  {
    id: 'automation-legend',
    name: 'Automation Legend',
    description: 'Complete 100 workflows',
    icon: '👑',
    category: 'power_user',
    earned: false,
    requirement: 'Complete 100 workflows',
    tier: 'diamond',
  },

  // Collaborator badges
  {
    id: 'team-player',
    name: 'Team Player',
    description: 'Share your first workflow with a teammate',
    icon: '🤝',
    category: 'collaborator',
    earned: false,
    requirement: 'Share 1 workflow',
    tier: 'bronze',
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Have 5 teammates use your shared workflow',
    icon: '🎓',
    category: 'collaborator',
    earned: false,
    requirement: '5 uses of shared workflows',
    tier: 'silver',
  },
  {
    id: 'community-star',
    name: 'Community Star',
    description: 'Publish a template to the marketplace',
    icon: '⭐',
    category: 'collaborator',
    earned: false,
    requirement: 'Publish 1 template',
    tier: 'gold',
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Have your template used by 50 users',
    icon: '🌟',
    category: 'collaborator',
    earned: false,
    requirement: '50 template uses',
    tier: 'diamond',
  },
]

const TIER_STYLES = {
  bronze: {
    bg: 'from-amber-700 to-amber-900',
    border: 'border-amber-600',
    glow: 'shadow-amber-500/30',
    text: 'text-amber-400',
  },
  silver: {
    bg: 'from-slate-400 to-slate-600',
    border: 'border-slate-400',
    glow: 'shadow-slate-400/30',
    text: 'text-slate-300',
  },
  gold: {
    bg: 'from-yellow-500 to-amber-600',
    border: 'border-yellow-400',
    glow: 'shadow-yellow-400/40',
    text: 'text-yellow-400',
  },
  diamond: {
    bg: 'from-cyan-400 via-purple-400 to-pink-400',
    border: 'border-cyan-300',
    glow: 'shadow-cyan-400/50',
    text: 'text-cyan-300',
  },
}

const CATEGORY_INFO = {
  starter: { label: 'Starter', icon: '🌱', description: 'Getting started achievements' },
  power_user: { label: 'Power User', icon: '💪', description: 'Advanced usage achievements' },
  collaborator: { label: 'Collaborator', icon: '🤝', description: 'Team & community achievements' },
}

interface BadgeItemProps {
  badge: Badge
  onClick?: () => void
}

function BadgeItem({ badge, onClick }: BadgeItemProps) {
  const styles = TIER_STYLES[badge.tier]

  return (
    <button
      onClick={onClick}
      className={`
        relative group p-3 rounded-xl transition-all duration-300
        ${badge.earned
          ? `bg-gradient-to-br ${styles.bg} border-2 ${styles.border} hover:scale-105 hover:shadow-lg ${styles.glow}`
          : 'bg-slate-800/50 border-2 border-slate-700/50 opacity-60 hover:opacity-80'
        }
      `}
    >
      {/* Badge Icon */}
      <div className={`
        w-14 h-14 rounded-xl flex items-center justify-center text-3xl
        ${badge.earned ? '' : 'grayscale'}
      `}>
        {badge.icon}
      </div>

      {/* Badge Name */}
      <p className={`
        mt-2 text-xs font-medium text-center truncate
        ${badge.earned ? 'text-white' : 'text-slate-500'}
      `}>
        {badge.name}
      </p>

      {/* Earned indicator */}
      {badge.earned && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Lock icon for unearned */}
      {!badge.earned && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      )}
    </button>
  )
}

interface BadgeDetailModalProps {
  badge: Badge | null
  onClose: () => void
}

function BadgeDetailModal({ badge, onClose }: BadgeDetailModalProps) {
  if (!badge) return null

  const styles = TIER_STYLES[badge.tier]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-sm w-full animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Badge display */}
        <div className="flex flex-col items-center text-center">
          <div className={`
            w-24 h-24 rounded-2xl flex items-center justify-center text-5xl mb-4
            ${badge.earned
              ? `bg-gradient-to-br ${styles.bg} border-2 ${styles.border} shadow-lg ${styles.glow}`
              : 'bg-slate-800 border-2 border-slate-700 grayscale'
            }
          `}>
            {badge.icon}
          </div>

          <div className={`text-xs uppercase font-bold mb-1 ${styles.text}`}>
            {badge.tier}
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{badge.name}</h3>
          <p className="text-slate-400 text-sm mb-4">{badge.description}</p>

          {/* Requirement */}
          <div className="w-full bg-slate-800 rounded-lg p-3 mb-4">
            <p className="text-xs text-slate-500 uppercase mb-1">Requirement</p>
            <p className="text-sm text-slate-300">{badge.requirement}</p>
          </div>

          {/* Status */}
          {badge.earned ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">
                Earned {badge.earnedAt && new Date(badge.earnedAt).toLocaleDateString()}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm">Not yet earned</span>
            </div>
          )}
        </div>

        <style>{`
          @keyframes scale-in {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-scale-in {
            animation: scale-in 0.2s ease-out;
          }
        `}</style>
      </div>
    </div>
  )
}

interface AchievementBadgesProps {
  badges?: Badge[]
  showCategories?: boolean
  compact?: boolean
  className?: string
}

export function AchievementBadges({
  badges = DEFAULT_BADGES,
  showCategories = true,
  compact = false,
  className = '',
}: AchievementBadgesProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | 'all'>('all')

  const earnedCount = badges.filter(b => b.earned).length
  const totalCount = badges.length

  const filteredBadges = activeCategory === 'all'
    ? badges
    : badges.filter(b => b.category === activeCategory)

  const categoryStats = {
    starter: {
      earned: badges.filter(b => b.category === 'starter' && b.earned).length,
      total: badges.filter(b => b.category === 'starter').length,
    },
    power_user: {
      earned: badges.filter(b => b.category === 'power_user' && b.earned).length,
      total: badges.filter(b => b.category === 'power_user').length,
    },
    collaborator: {
      earned: badges.filter(b => b.category === 'collaborator' && b.earned).length,
      total: badges.filter(b => b.category === 'collaborator').length,
    },
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {badges.filter(b => b.earned).slice(0, 5).map(badge => (
          <div
            key={badge.id}
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center text-lg
              bg-gradient-to-br ${TIER_STYLES[badge.tier].bg}
              border ${TIER_STYLES[badge.tier].border}
            `}
            title={badge.name}
          >
            {badge.icon}
          </div>
        ))}
        {earnedCount > 5 && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-slate-800 text-slate-400">
            +{earnedCount - 5}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>Achievement Badges</span>
            <span className="text-2xl">🏅</span>
          </h3>
          <div className="text-sm">
            <span className="text-cyan-400 font-bold">{earnedCount}</span>
            <span className="text-slate-500">/{totalCount}</span>
          </div>
        </div>

        {/* Overall progress */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${(earnedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Category tabs */}
      {showCategories && (
        <div className="p-4 border-b border-slate-700/50 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${activeCategory === 'all'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }
            `}
          >
            All ({earnedCount}/{totalCount})
          </button>
          {(Object.keys(CATEGORY_INFO) as BadgeCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                ${activeCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }
              `}
            >
              <span className="mr-1">{CATEGORY_INFO[cat].icon}</span>
              {CATEGORY_INFO[cat].label}
              <span className="ml-1 text-xs opacity-70">
                ({categoryStats[cat].earned}/{categoryStats[cat].total})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Badges grid */}
      <div className="p-6">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
          {filteredBadges.map(badge => (
            <BadgeItem
              key={badge.id}
              badge={badge}
              onClick={() => setSelectedBadge(badge)}
            />
          ))}
        </div>
      </div>

      {/* Badge detail modal */}
      <BadgeDetailModal
        badge={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </div>
  )
}

export default AchievementBadges

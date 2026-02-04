/**
 * AchievementNotification.tsx
 *
 * Toast notification component for achievement unlocks.
 * Uses the AchievementsContext to show/dismiss notifications.
 *
 * SAFE: This is a NEW file - does not modify any protected code.
 */

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import { useAchievementsContext, type AchievementTier } from '@/contexts/AchievementsContext'

// ============================================================================
// Tier Styling
// ============================================================================

const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-slate-300 to-slate-500',
  gold: 'from-yellow-400 to-amber-500',
  platinum: 'from-cyan-300 via-purple-400 to-pink-400',
}

const TIER_BORDERS: Record<AchievementTier, string> = {
  bronze: 'border-amber-600',
  silver: 'border-slate-400',
  gold: 'border-yellow-400',
  platinum: 'border-cyan-400',
}

const TIER_GLOW: Record<AchievementTier, string> = {
  bronze: 'shadow-amber-500/30',
  silver: 'shadow-slate-400/30',
  gold: 'shadow-yellow-400/40',
  platinum: 'shadow-cyan-400/50',
}

// ============================================================================
// Component
// ============================================================================

export function AchievementNotification() {
  const { pendingNotification, dismissNotification } = useAchievementsContext()

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (pendingNotification) {
      const timer = setTimeout(dismissNotification, 6000)
      return () => clearTimeout(timer)
    }
  }, [pendingNotification, dismissNotification])

  return (
    <AnimatePresence>
      {pendingNotification && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: 50 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-20 right-4 z-[100] max-w-sm"
        >
          {/* Gradient border wrapper */}
          <div className={`
            p-[2px] rounded-2xl shadow-2xl
            bg-gradient-to-r ${TIER_COLORS[pendingNotification.tier]}
            ${TIER_GLOW[pendingNotification.tier]}
          `}>
            {/* Content */}
            <div className="bg-slate-900 rounded-2xl p-4 flex items-start gap-4">
              {/* Badge icon */}
              <div className={`
                w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0
                bg-gradient-to-br ${TIER_COLORS[pendingNotification.tier]}
                border-2 ${TIER_BORDERS[pendingNotification.tier]}
              `}>
                {pendingNotification.icon}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">
                    Achievement Unlocked!
                  </span>
                </div>
                <h4 className="font-bold text-white text-lg truncate">
                  {pendingNotification.name}
                </h4>
                <p className="text-sm text-slate-400 line-clamp-2">
                  {pendingNotification.description}
                </p>
                {pendingNotification.reward && (
                  <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                    <span>🎁</span>
                    <span>{pendingNotification.reward}</span>
                  </p>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={dismissNotification}
                className="flex-shrink-0 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Celebration particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0 }}
                animate={{
                  opacity: [1, 1, 0],
                  scale: [0, 1, 1.5],
                  x: [0, (i % 2 === 0 ? 1 : -1) * (20 + Math.random() * 40)],
                  y: [0, -30 - Math.random() * 30],
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.1,
                  ease: 'easeOut',
                }}
                className="absolute left-1/2 top-1/2"
              >
                <span className="text-xl">
                  {['✨', '🌟', '⭐', '💫', '🎉', '🏆'][i]}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AchievementNotification

/**
 * DailyAdviceCard.tsx
 *
 * Featured "Tip of the Day" component for the Dashboard.
 * Shows personalized daily workflow advice for Kuwait/GCC users.
 *
 * SAFE: This is a NEW file - does not modify any protected code.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Lightbulb,
  X,
  Zap,
  ArrowRight,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { DailyAdviceService, type DailyAdvice } from '@/services/DailyAdviceService'
import type { UserContext } from '@/services/ProactiveSuggestionsService'

interface DailyAdviceCardProps {
  userContext: UserContext
  personaType?: 'lawyer' | 'doctor' | 'sme'
  className?: string
}

const TYPE_ICONS = {
  workflow: Zap,
  integration: Lightbulb,
  optimization: RefreshCw,
  tip: Sparkles,
}

const TYPE_COLORS = {
  workflow: 'from-cyan-500 to-blue-500',
  integration: 'from-purple-500 to-pink-500',
  optimization: 'from-emerald-500 to-teal-500',
  tip: 'from-amber-500 to-orange-500',
}

export function DailyAdviceCard({ userContext, personaType, className = '' }: DailyAdviceCardProps) {
  const { t } = useTranslation()
  const [advice, setAdvice] = useState<DailyAdvice | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if already dismissed
    if (DailyAdviceService.isTodaysAdviceDismissed()) {
      setIsDismissed(true)
      setIsLoading(false)
      return
    }

    // Get today's advice
    const todaysAdvice = DailyAdviceService.getTodaysAdvice(userContext, personaType)
    setAdvice(todaysAdvice)
    setIsLoading(false)
  }, [userContext, personaType])

  const handleDismiss = () => {
    DailyAdviceService.dismissTodaysAdvice()
    setIsDismissed(true)
  }

  // Don't render if dismissed or no advice
  if (isDismissed || isLoading || !advice) {
    return null
  }

  const IconComponent = TYPE_ICONS[advice.type] || Lightbulb
  const gradientColor = TYPE_COLORS[advice.type] || 'from-cyan-500 to-purple-500'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
        className={`relative overflow-hidden rounded-2xl ${className}`}
      >
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-10`} />

        {/* Content */}
        <div className="relative bg-surface-900/80 backdrop-blur-sm border border-surface-700/50 rounded-2xl p-6">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-white">{t('dailyAdvice.title')}</span>
                  {advice.isNew && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
                      {t('common.new')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-surface-400">{advice.greeting}</p>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg text-surface-500 hover:text-white hover:bg-surface-700/50 transition-colors"
              aria-label={t('dailyAdvice.dismissTip')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Personal message */}
          <p className="text-surface-300 text-sm mb-4 italic">
            "{advice.personalMessage}"
          </p>

          {/* Advice content */}
          <div className="bg-surface-800/50 rounded-xl p-4 mb-4">
            <h3 className="text-white font-medium mb-2">{advice.title}</h3>
            <p className="text-surface-400 text-sm">{advice.description}</p>
          </div>

          {/* Impact badge & time estimate */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                advice.priority === 'high'
                  ? 'bg-red-500/20 text-red-400'
                  : advice.priority === 'medium'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {t('dailyAdvice.impact', { priority: advice.priority })}
              </span>
            </div>
            {advice.relevanceScore >= 80 && (
              <div className="flex items-center gap-1 text-emerald-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>{t('dailyAdvice.savesTime')}</span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Link to="/chat">
            <button
              className={`w-full py-3 rounded-xl bg-gradient-to-r ${gradientColor} text-white font-medium flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all hover:shadow-lg`}
            >
              <Sparkles className="w-5 h-5" />
              {t('dailyAdvice.buildAutomation')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>

          {/* Reason/context */}
          <p className="text-xs text-surface-500 text-center mt-3">
            {advice.reason}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Compact version for sidebar or smaller spaces
 */
export function DailyAdviceCompact({ userContext, personaType, className = '' }: DailyAdviceCardProps) {
  const { t } = useTranslation()
  const [advice, setAdvice] = useState<DailyAdvice | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (DailyAdviceService.isTodaysAdviceDismissed()) {
      setIsDismissed(true)
      return
    }

    const todaysAdvice = DailyAdviceService.getTodaysAdvice(userContext, personaType)
    setAdvice(todaysAdvice)
  }, [userContext, personaType])

  if (isDismissed || !advice) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{advice.title}</p>
          <p className="text-xs text-surface-400 mt-1 line-clamp-2">{advice.description}</p>
          <Link
            to="/chat"
            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-2 transition-colors"
          >
            {t('dailyAdvice.automateThis')}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default DailyAdviceCard

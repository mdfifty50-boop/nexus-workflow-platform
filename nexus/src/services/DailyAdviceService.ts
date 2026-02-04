/**
 * DailyAdviceService.ts
 *
 * Extends ProactiveSuggestionsService to provide daily workflow advice.
 * Tracks shown advice to avoid repetition and ensures fresh tips daily.
 *
 * SAFE: This is a NEW file - does not modify any protected code.
 */

import { ProactiveSuggestionsService, type ProactiveSuggestion, type UserContext } from './ProactiveSuggestionsService'

export interface DailyAdvice extends ProactiveSuggestion {
  greeting: string
  personalMessage: string
  isNew: boolean
}

const STORAGE_KEY = 'nexus_daily_advice'
const SHOWN_ADVICE_KEY = 'nexus_shown_advice_ids'
const MAX_SHOWN_HISTORY = 14 // Don't repeat advice for 2 weeks

interface DailyAdviceStorage {
  lastShownDate: string
  adviceId: string
  dismissed: boolean
}

/**
 * Kuwait/GCC-specific greetings based on time of day
 */
function getKuwaitGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return 'صباح الخير! Good morning!'
  } else if (hour >= 12 && hour < 17) {
    return 'مساء الخير! Good afternoon!'
  } else if (hour >= 17 && hour < 22) {
    return 'مساء النور! Good evening!'
  }
  return 'Welcome back!'
}

/**
 * Persona-specific motivational messages for Kuwait target customers
 */
const PERSONA_MESSAGES: Record<string, string[]> = {
  lawyer: [
    "Focus on clients, not admin. Let's automate the paperwork.",
    "Stop chasing signatures. Start closing cases.",
    "Your billable hours are too valuable for manual follow-ups.",
  ],
  doctor: [
    "Less paperwork, more patients. Here's today's tip.",
    "Stop chasing appointments. Let automation handle no-shows.",
    "Your time with patients is precious. Automate the rest.",
  ],
  sme: [
    "Stop chasing invoices. Let them chase themselves.",
    "Get paid faster. Here's how automation can help.",
    "Focus on deals, not government papers. Automate compliance.",
  ],
  default: [
    "Works while you sleep. Here's your daily automation tip.",
    "Simple and reliable. That's what we aim for.",
    "One less thing to worry about. Check this out.",
  ],
}

/**
 * Get today's date string for storage
 */
function getTodayKey(): string {
  const now = new Date()
  return now.toISOString().split('T')[0] // YYYY-MM-DD
}

/**
 * Get shown advice IDs from storage
 */
function getShownAdviceIds(): string[] {
  try {
    const stored = localStorage.getItem(SHOWN_ADVICE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Add advice ID to shown history
 */
function markAdviceShown(adviceId: string): void {
  const shown = getShownAdviceIds()

  // Add new ID at the beginning
  shown.unshift(adviceId)

  // Keep only last MAX_SHOWN_HISTORY
  const trimmed = shown.slice(0, MAX_SHOWN_HISTORY)

  localStorage.setItem(SHOWN_ADVICE_KEY, JSON.stringify(trimmed))
}

/**
 * Service for daily workflow advice
 */
export class DailyAdviceService {
  /**
   * Get today's advice for the user
   * Returns null if user has already dismissed today's advice
   */
  static getTodaysAdvice(
    userContext: UserContext,
    personaType?: 'lawyer' | 'doctor' | 'sme'
  ): DailyAdvice | null {
    const todayKey = getTodayKey()

    // Check if we already have advice for today
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data: DailyAdviceStorage = JSON.parse(stored)
        if (data.lastShownDate === todayKey) {
          // Already shown today
          if (data.dismissed) {
            return null // User dismissed, don't show again
          }

          // Return same advice (reload case)
          const cachedAdvice = ProactiveSuggestionsService.getSuggestionById(data.adviceId)
          if (cachedAdvice) {
            return this.enrichAdvice(cachedAdvice, userContext.region, personaType, false)
          }
        }
      }
    } catch {
      // Storage error, continue with fresh advice
    }

    // Get fresh advice for today
    const shownIds = getShownAdviceIds()
    const allSuggestions = ProactiveSuggestionsService.getSuggestions(userContext, 10)

    // Filter out recently shown advice
    const freshSuggestions = allSuggestions.filter(s => !shownIds.includes(s.id))

    if (freshSuggestions.length === 0) {
      // All advice shown recently, reset and use any
      localStorage.removeItem(SHOWN_ADVICE_KEY)
      return allSuggestions[0]
        ? this.enrichAdvice(allSuggestions[0], userContext.region, personaType, true)
        : null
    }

    // Pick the highest priority fresh advice
    const todaysAdvice = freshSuggestions[0]

    // Store for today
    const storage: DailyAdviceStorage = {
      lastShownDate: todayKey,
      adviceId: todaysAdvice.id,
      dismissed: false,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))

    // Mark as shown
    markAdviceShown(todaysAdvice.id)

    return this.enrichAdvice(todaysAdvice, userContext.region, personaType, true)
  }

  /**
   * Dismiss today's advice
   */
  static dismissTodaysAdvice(): void {
    const todayKey = getTodayKey()

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data: DailyAdviceStorage = JSON.parse(stored)
        if (data.lastShownDate === todayKey) {
          data.dismissed = true
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        }
      }
    } catch {
      // Storage error, ignore
    }
  }

  /**
   * Check if today's advice has been dismissed
   */
  static isTodaysAdviceDismissed(): boolean {
    const todayKey = getTodayKey()

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data: DailyAdviceStorage = JSON.parse(stored)
        return data.lastShownDate === todayKey && data.dismissed
      }
    } catch {
      // Storage error, assume not dismissed
    }

    return false
  }

  /**
   * Enrich suggestion with greeting and personal message
   */
  private static enrichAdvice(
    suggestion: ProactiveSuggestion,
    region?: string,
    personaType?: 'lawyer' | 'doctor' | 'sme',
    isNew: boolean = true
  ): DailyAdvice {
    const hour = new Date().getHours()

    // Get greeting based on region
    const isGCC = ['kuwait', 'uae', 'saudi', 'qatar', 'bahrain', 'oman'].includes(
      region?.toLowerCase() || ''
    )
    const greeting = isGCC ? getKuwaitGreeting(hour) : (
      hour < 12 ? 'Good morning!' : hour < 17 ? 'Good afternoon!' : 'Good evening!'
    )

    // Get persona-specific message
    const messages = PERSONA_MESSAGES[personaType || 'default']
    const personalMessage = messages[Math.floor(Math.random() * messages.length)]

    return {
      ...suggestion,
      greeting,
      personalMessage,
      isNew,
    }
  }

  /**
   * Get advice count for analytics
   */
  static getAdviceStats(): { shown: number; totalAvailable: number } {
    const shownIds = getShownAdviceIds()
    return {
      shown: shownIds.length,
      totalAvailable: 25, // Approximate number of rules in ProactiveSuggestionsService
    }
  }
}

export default DailyAdviceService

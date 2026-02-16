/**
 * useProgressiveDisclosure Hook
 *
 * Returns the user's disclosure level and feature flags based on their
 * maturity level from UserMemoryService. This enables a progressive
 * disclosure UX where beginners see a simplified UI and power users
 * see advanced features.
 *
 * Maturity mapping:
 *   'new'         -> 'beginner'
 *   'learning'    -> 'intermediate'
 *   'proficient'  -> 'advanced'
 *   'power_user'  -> 'advanced'
 */

import { useMemo } from 'react'
import { userMemoryService } from '@/services/UserMemoryService'

export type DisclosureLevel = 'beginner' | 'intermediate' | 'advanced'

export interface ProgressiveDisclosureFlags {
  /** Current disclosure level */
  level: DisclosureLevel

  /** Suggestion cards are always shown */
  showSuggestionCards: true

  /** How many suggestion cards to display in the empty state */
  maxSuggestions: number

  /** Show Ctrl+K / Cmd+K command palette */
  showCommandPalette: boolean

  /** Show keyboard shortcut hints in UI elements */
  showKeyboardShortcuts: boolean

  /** Show slash command support (e.g. /template, /connect) */
  showSlashCommands: boolean

  /** Show raw JSON editor for workflow specs */
  showJsonEditor: boolean

  /** Show advanced filter options in lists */
  showAdvancedFilters: boolean

  /** Show workflow complexity indicators */
  showWorkflowComplexity: boolean

  /** Show guided onboarding tooltips for first-time users */
  showGuidedTooltips: boolean

  /** Show the Ctrl+K hint badge in the input area */
  showCtrlKHint: boolean
}

function mapMaturityToLevel(maturity: string): DisclosureLevel {
  switch (maturity) {
    case 'new':
      return 'beginner'
    case 'learning':
      return 'intermediate'
    case 'proficient':
    case 'power_user':
      return 'advanced'
    default:
      return 'beginner'
  }
}

export function useProgressiveDisclosure(): ProgressiveDisclosureFlags {
  return useMemo(() => {
    const profile = userMemoryService.buildMemoryProfile()
    const level = mapMaturityToLevel(profile.maturityLevel)

    return {
      level,
      showSuggestionCards: true as const,
      maxSuggestions: level === 'beginner' ? 2 : level === 'intermediate' ? 4 : 6,
      showCommandPalette: level !== 'beginner',
      showKeyboardShortcuts: level !== 'beginner',
      showSlashCommands: level === 'advanced',
      showJsonEditor: level === 'advanced',
      showAdvancedFilters: level !== 'beginner',
      showWorkflowComplexity: level !== 'beginner',
      showGuidedTooltips: level === 'beginner',
      showCtrlKHint: level === 'intermediate',
    }
  }, [])
}

export default useProgressiveDisclosure

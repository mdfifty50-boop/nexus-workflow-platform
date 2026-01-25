/**
 * useUserContext Hook
 *
 * React hook for managing user context extraction and storage in chat interfaces.
 * Automatically extracts context from messages and persists to storage.
 */

import { useState, useEffect, useCallback } from 'react'
import type { UserContext, PartialUserContext, ContextExtractionResult } from '@/types/user-context'
import { extractUserContext, extractUserContextFromHistory } from './user-context-extractor'
import { loadUserContext, storeUserContext } from './context-store'

interface UseUserContextOptions {
  autoSave?: boolean // Automatically save extracted context
  minConfidence?: number // Minimum confidence threshold (0-1)
}

interface UseUserContextReturn {
  context: UserContext | null
  isLoading: boolean
  hasContext: boolean
  extractFromMessage: (message: string) => Promise<ContextExtractionResult>
  extractFromHistory: (messages: string[]) => Promise<ContextExtractionResult>
  saveContext: (partial: PartialUserContext, merge?: boolean) => Promise<boolean>
  refreshContext: () => Promise<void>
  clearContext: () => void
  lastExtraction: ContextExtractionResult | null
}

/**
 * Hook for user context management
 */
export function useUserContext(options: UseUserContextOptions = {}): UseUserContextReturn {
  const {
    autoSave = true,
    minConfidence = 0.3,
  } = options

  const [context, setContext] = useState<UserContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasContextStored, setHasContextStored] = useState(false)
  const [lastExtraction, setLastExtraction] = useState<ContextExtractionResult | null>(null)

  // Load context on mount
  useEffect(() => {
    loadContextFromStorage()
  }, [])

  const loadContextFromStorage = useCallback(async () => {
    setIsLoading(true)
    try {
      const loaded = await loadUserContext()
      setContext(loaded)
      setHasContextStored(loaded !== null)
    } catch (error) {
      console.error('[useUserContext] Failed to load context:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Extract context from a single message
   */
  const extractFromMessage = useCallback(async (message: string): Promise<ContextExtractionResult> => {
    const result = extractUserContext(message)
    setLastExtraction(result)

    // Auto-save if confidence meets threshold
    if (autoSave && result.success && result.confidence >= minConfidence) {
      try {
        const response = await storeUserContext({
          userId: context?.userId || '',
          context: {
            ...result.extractedContext,
            userId: context?.userId || '',
          },
          merge: true,
          source: 'chat',
          extractionMethod: 'nlp_pattern_matching',
        })

        if (response.success) {
          setContext(response.context)
          setHasContextStored(true)
          console.log('[useUserContext] Auto-saved context:', {
            addresses: result.extractedContext.addresses?.length || 0,
            preferences: result.extractedContext.foodPreferences?.length || 0,
            contacts: result.extractedContext.frequentContacts?.length || 0,
            confidence: result.confidence,
          })
        }
      } catch (error) {
        console.error('[useUserContext] Failed to auto-save context:', error)
      }
    }

    return result
  }, [autoSave, minConfidence, context?.userId])

  /**
   * Extract context from message history (batch)
   */
  const extractFromHistory = useCallback(async (messages: string[]): Promise<ContextExtractionResult> => {
    const result = extractUserContextFromHistory(messages)
    setLastExtraction(result)

    // Auto-save if confidence meets threshold
    if (autoSave && result.success && result.confidence >= minConfidence) {
      try {
        const response = await storeUserContext({
          userId: context?.userId || '',
          context: {
            ...result.extractedContext,
            userId: context?.userId || '',
          },
          merge: true,
          source: 'chat',
          extractionMethod: 'nlp_batch_extraction',
        })

        if (response.success) {
          setContext(response.context)
          setHasContextStored(true)
          console.log('[useUserContext] Auto-saved batch context:', {
            addresses: result.extractedContext.addresses?.length || 0,
            preferences: result.extractedContext.foodPreferences?.length || 0,
            contacts: result.extractedContext.frequentContacts?.length || 0,
            confidence: result.confidence,
          })
        }
      } catch (error) {
        console.error('[useUserContext] Failed to auto-save batch context:', error)
      }
    }

    return result
  }, [autoSave, minConfidence, context?.userId])

  /**
   * Manually save context
   */
  const saveContext = useCallback(async (
    partial: PartialUserContext,
    merge: boolean = true
  ): Promise<boolean> => {
    try {
      const response = await storeUserContext({
        userId: context?.userId || '',
        context: partial,
        merge,
        source: 'manual',
      })

      if (response.success) {
        setContext(response.context)
        setHasContextStored(true)
        return true
      }

      return false
    } catch (error) {
      console.error('[useUserContext] Failed to save context:', error)
      return false
    }
  }, [context?.userId])

  /**
   * Refresh context from storage
   */
  const refreshContext = useCallback(async () => {
    await loadContextFromStorage()
  }, [loadContextFromStorage])

  /**
   * Clear context
   */
  const clearContext = useCallback(() => {
    setContext(null)
    setHasContextStored(false)
    setLastExtraction(null)
  }, [])

  return {
    context,
    isLoading,
    hasContext: hasContextStored,
    extractFromMessage,
    extractFromHistory,
    saveContext,
    refreshContext,
    clearContext,
    lastExtraction,
  }
}

/**
 * Helper hook to check if user has specific context fields
 */
export function useHasContextField(field: keyof UserContext): boolean {
  const { context } = useUserContext({ autoSave: false })

  if (!context) return false

  const value = context[field]

  if (Array.isArray(value)) {
    return value.length > 0
  }

  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length > 0
  }

  return Boolean(value)
}

/**
 * Helper hook to get primary address
 */
export function usePrimaryAddress() {
  const { context } = useUserContext({ autoSave: false })

  if (!context || context.addresses.length === 0) {
    return null
  }

  return context.addresses.find(a => a.isPrimary) || context.addresses[0]
}

/**
 * Helper hook to get preferred language
 */
export function usePreferredLanguage() {
  const { context } = useUserContext({ autoSave: false })

  return context?.communicationPreferences?.preferredLanguage || 'en-US'
}

/**
 * Helper hook to get timezone
 */
export function useUserTimezone() {
  const { context } = useUserContext({ autoSave: false })

  return context?.communicationPreferences?.timeZone || 'UTC'
}

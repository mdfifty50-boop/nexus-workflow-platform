/**
 * STATE RESET UTILITY
 *
 * Centralized utility for clearing all application state during logout,
 * reset, or debugging. Ensures consistent cleanup across all storage
 * backends and caches.
 *
 * Features:
 * - Clear localStorage, sessionStorage, and in-memory caches
 * - Selective clearing by category
 * - Preservation of specific keys
 * - Event emission for components to react
 * - Safe cleanup with error handling
 */

import { storage, STORAGE_KEYS } from './state-persistence'
import { clearAllSelectorCaches } from './selectors'

// ============================================================================
// TYPES
// ============================================================================

export type ResetCategory =
  | 'all'           // Everything
  | 'auth'          // Authentication state only
  | 'preferences'   // User preferences
  | 'chatbot'       // Chatbot state
  | 'workflow'      // Workflow state
  | 'cache'         // Cached data only
  | 'session'       // Session-specific data

export interface ResetOptions {
  /** Categories to reset (default: all) */
  categories?: ResetCategory[]
  /** Keys to preserve during reset */
  preserve?: string[]
  /** Emit reset event for listeners */
  emitEvent?: boolean
  /** Clear IndexedDB as well */
  clearIndexedDB?: boolean
  /** Additional cleanup callback */
  onCleanup?: () => void | Promise<void>
}

export interface ResetResult {
  success: boolean
  categoriesCleared: ResetCategory[]
  keysCleared: number
  errors: string[]
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_KEYS: Record<ResetCategory, string[]> = {
  all: Object.values(STORAGE_KEYS),

  auth: [
    STORAGE_KEYS.SESSION_TOKEN,
    STORAGE_KEYS.LAST_ACTIVITY,
    STORAGE_KEYS.CHATBOT_USER_ID,
  ],

  preferences: [
    STORAGE_KEYS.USER_PREFERENCES,
    STORAGE_KEYS.THEME,
    STORAGE_KEYS.SIDEBAR_COLLAPSED,
  ],

  chatbot: [
    STORAGE_KEYS.CHATBOT_OPEN,
    STORAGE_KEYS.CHATBOT_MESSAGES,
    STORAGE_KEYS.CHATBOT_STATE,
    STORAGE_KEYS.CHATBOT_INTENT,
    STORAGE_KEYS.CHATBOT_INFO,
    STORAGE_KEYS.CHATBOT_QUESTIONS,
    STORAGE_KEYS.CHATBOT_QUESTION_INDEX,
    STORAGE_KEYS.CHATBOT_USER_ID,
  ],

  workflow: [
    STORAGE_KEYS.ACTIVE_WORKFLOW_ID,
    STORAGE_KEYS.PENDING_WORKFLOW,
    STORAGE_KEYS.WORKFLOW_DRAFTS,
    STORAGE_KEYS.RECENT_WORKFLOWS,
  ],

  cache: [
    STORAGE_KEYS.TEMPLATE_CACHE,
    STORAGE_KEYS.INTEGRATION_CACHE,
  ],

  session: [
    STORAGE_KEYS.SESSION_TOKEN,
    STORAGE_KEYS.LAST_ACTIVITY,
    STORAGE_KEYS.CHATBOT_MESSAGES,
    STORAGE_KEYS.CHATBOT_STATE,
    STORAGE_KEYS.ACTIVE_WORKFLOW_ID,
  ],
}

// Keys that should never be cleared (critical for app function)
const PROTECTED_KEYS: string[] = []

// ============================================================================
// EVENT SYSTEM
// ============================================================================

type ResetEventListener = (categories: ResetCategory[]) => void

const resetListeners = new Set<ResetEventListener>()

/**
 * Subscribe to reset events
 */
export function onReset(listener: ResetEventListener): () => void {
  resetListeners.add(listener)
  return () => resetListeners.delete(listener)
}

/**
 * Emit reset event to all listeners
 */
function emitResetEvent(categories: ResetCategory[]): void {
  resetListeners.forEach(listener => {
    try {
      listener(categories)
    } catch (e) {
      console.error('[StateReset] Listener error:', e)
    }
  })
}

// ============================================================================
// RESET FUNCTIONS
// ============================================================================

/**
 * Clear localStorage keys with error handling
 */
function clearLocalStorage(keys: string[], preserve: string[]): number {
  let cleared = 0

  // Get all nexus_ prefixed keys
  const nexusKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('nexus_')) {
      nexusKeys.push(key)
    }
  }

  // Clear matching keys
  for (const key of nexusKeys) {
    const shortKey = key.replace('nexus_', '')
    if (keys.includes(shortKey) && !preserve.includes(shortKey) && !PROTECTED_KEYS.includes(shortKey)) {
      try {
        localStorage.removeItem(key)
        cleared++
      } catch (e) {
        console.error(`[StateReset] Failed to clear localStorage key: ${key}`, e)
      }
    }
  }

  // Also clear legacy keys
  for (const key of keys) {
    const legacyKeys = [`nexus_${key}`, key]
    for (const legacyKey of legacyKeys) {
      if (!preserve.includes(key) && localStorage.getItem(legacyKey) !== null) {
        try {
          localStorage.removeItem(legacyKey)
          cleared++
        } catch {
          // Ignore
        }
      }
    }
  }

  return cleared
}

/**
 * Clear sessionStorage keys
 */
function clearSessionStorage(keys: string[], preserve: string[]): number {
  let cleared = 0

  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i)
    if (key?.startsWith('nexus_')) {
      const shortKey = key.replace('nexus_', '')
      if (keys.includes(shortKey) && !preserve.includes(shortKey)) {
        try {
          sessionStorage.removeItem(key)
          cleared++
        } catch {
          // Ignore
        }
      }
    }
  }

  return cleared
}

/**
 * Clear IndexedDB databases
 */
async function clearIndexedDB(): Promise<void> {
  if (!('indexedDB' in window)) return

  const databases = await indexedDB.databases?.() || []

  for (const db of databases) {
    if (db.name?.startsWith('nexus')) {
      try {
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(db.name!)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      } catch (e) {
        console.error(`[StateReset] Failed to clear IndexedDB: ${db.name}`, e)
      }
    }
  }
}

/**
 * Clear in-memory caches
 */
function clearMemoryCaches(): void {
  // Clear selector caches
  clearAllSelectorCaches()

  // Clear any module-level caches we can access
  // This is a placeholder for future cache systems
}

// ============================================================================
// MAIN RESET FUNCTION
// ============================================================================

/**
 * Reset application state
 *
 * @example
 * // Clear everything
 * await resetState()
 *
 * @example
 * // Clear only chatbot state
 * await resetState({ categories: ['chatbot'] })
 *
 * @example
 * // Clear auth but preserve preferences
 * await resetState({ categories: ['auth'], preserve: ['theme'] })
 */
export async function resetState(options: ResetOptions = {}): Promise<ResetResult> {
  const {
    categories = ['all'],
    preserve = [],
    emitEvent = true,
    clearIndexedDB: shouldClearIndexedDB = false,
    onCleanup,
  } = options

  const result: ResetResult = {
    success: true,
    categoriesCleared: [],
    keysCleared: 0,
    errors: [],
  }

  try {
    // Collect all keys to clear
    const keysToClears = new Set<string>()

    for (const category of categories) {
      const categoryKeys = CATEGORY_KEYS[category]
      if (categoryKeys) {
        categoryKeys.forEach(key => keysToClears.add(key))
        result.categoriesCleared.push(category)
      } else {
        result.errors.push(`Unknown category: ${category}`)
      }
    }

    const keysArray = Array.from(keysToClears)

    // Clear localStorage
    result.keysCleared += clearLocalStorage(keysArray, preserve)

    // Clear sessionStorage
    result.keysCleared += clearSessionStorage(keysArray, preserve)

    // Clear storage manager
    for (const key of keysArray) {
      if (!preserve.includes(key)) {
        storage.remove(key)
        storage.remove(key, { backend: 'session' })
      }
    }

    // Clear IndexedDB if requested
    if (shouldClearIndexedDB) {
      await clearIndexedDB()
    }

    // Clear memory caches
    clearMemoryCaches()

    // Run custom cleanup
    if (onCleanup) {
      await onCleanup()
    }

    // Emit event for components to react
    if (emitEvent) {
      emitResetEvent(result.categoriesCleared)
    }

    console.log(`[StateReset] Cleared ${result.keysCleared} keys from categories:`, result.categoriesCleared)

  } catch (e) {
    result.success = false
    result.errors.push(e instanceof Error ? e.message : 'Unknown error')
    console.error('[StateReset] Error during reset:', e)
  }

  return result
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Clear all state (full logout)
 */
export async function resetAll(): Promise<ResetResult> {
  return resetState({
    categories: ['all'],
    clearIndexedDB: true,
    emitEvent: true,
  })
}

/**
 * Clear auth state only (for logout without clearing preferences)
 */
export async function resetAuth(): Promise<ResetResult> {
  return resetState({
    categories: ['auth', 'session', 'chatbot'],
    emitEvent: true,
  })
}

/**
 * Clear workflow state (for starting fresh)
 */
export async function resetWorkflows(): Promise<ResetResult> {
  return resetState({
    categories: ['workflow'],
    emitEvent: true,
  })
}

/**
 * Clear caches only (for debugging/troubleshooting)
 */
export async function resetCaches(): Promise<ResetResult> {
  return resetState({
    categories: ['cache'],
    clearIndexedDB: false,
    emitEvent: false,
  })
}

/**
 * Clear chatbot state
 */
export async function resetChatbot(): Promise<ResetResult> {
  return resetState({
    categories: ['chatbot'],
    emitEvent: true,
  })
}

/**
 * Reset to factory defaults (preserves nothing)
 */
export async function factoryReset(): Promise<ResetResult> {
  // Clear absolutely everything
  localStorage.clear()
  sessionStorage.clear()

  await clearIndexedDB()
  clearMemoryCaches()

  emitResetEvent(['all'])

  return {
    success: true,
    categoriesCleared: ['all'],
    keysCleared: -1, // Unknown count
    errors: [],
  }
}

// ============================================================================
// INTEGRATION WITH AUTH
// ============================================================================

/**
 * Handler for sign-out that clears appropriate state
 * Should be called from AuthContext signOut
 */
export async function handleSignOut(): Promise<void> {
  await resetState({
    categories: ['auth', 'session', 'chatbot', 'workflow'],
    preserve: ['theme', 'sidebar_collapsed'], // Keep UI preferences
    emitEvent: true,
    onCleanup: async () => {
      // Any additional cleanup needed on sign out
      // e.g., abort pending requests, close SSE connections
    },
  })
}

/**
 * Handler for session expiration
 */
export async function handleSessionExpired(): Promise<void> {
  await resetState({
    categories: ['auth', 'session'],
    emitEvent: true,
  })
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

/**
 * Get current state summary for debugging
 */
export function getStateSummary(): Record<string, unknown> {
  const summary: Record<string, unknown> = {
    localStorage: {
      total: localStorage.length,
      nexusKeys: [] as string[],
    },
    sessionStorage: {
      total: sessionStorage.length,
      nexusKeys: [] as string[],
    },
  }

  // Count localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('nexus_')) {
      (summary.localStorage as Record<string, unknown>).nexusKeys = [
        ...((summary.localStorage as Record<string, unknown>).nexusKeys as string[]),
        key,
      ]
    }
  }

  // Count sessionStorage keys
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key?.startsWith('nexus_')) {
      (summary.sessionStorage as Record<string, unknown>).nexusKeys = [
        ...((summary.sessionStorage as Record<string, unknown>).nexusKeys as string[]),
        key,
      ]
    }
  }

  return summary
}

/**
 * Export state for backup/debugging
 */
export function exportState(): Record<string, string> {
  const state: Record<string, string> = {}

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('nexus_')) {
      const value = localStorage.getItem(key)
      if (value) state[key] = value
    }
  }

  return state
}

/**
 * Import state from backup
 */
export function importState(state: Record<string, string>): void {
  for (const [key, value] of Object.entries(state)) {
    if (key.startsWith('nexus_')) {
      localStorage.setItem(key, value)
    }
  }
}

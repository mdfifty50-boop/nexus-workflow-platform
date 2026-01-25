/**
 * usePersistedState Hook
 *
 * Persists critical UI state to sessionStorage and restores on page reload.
 * Supports automatic serialization/deserialization and state synchronization
 * across tabs.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Storage type options
 */
export type StorageType = 'sessionStorage' | 'localStorage'

/**
 * Configuration options for persisted state
 */
export interface PersistedStateOptions<T> {
  /** Storage key prefix (default: 'nexus_') */
  keyPrefix?: string
  /** Storage type (default: 'sessionStorage') */
  storage?: StorageType
  /** Custom serializer (default: JSON.stringify) */
  serialize?: (value: T) => string
  /** Custom deserializer (default: JSON.parse) */
  deserialize?: (value: string) => T
  /** Sync across tabs (only for localStorage, default: false) */
  syncTabs?: boolean
  /** Debounce delay for writes in ms (default: 100) */
  debounceMs?: number
  /** Validate restored data */
  validate?: (value: unknown) => value is T
}

/**
 * Get the storage object based on type
 */
function getStorage(type: StorageType): Storage | null {
  try {
    const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage
    // Test if storage is available
    const testKey = '__storage_test__'
    storage.setItem(testKey, testKey)
    storage.removeItem(testKey)
    return storage
  } catch {
    return null
  }
}

/**
 * Default serializer
 */
function defaultSerialize<T>(value: T): string {
  return JSON.stringify(value)
}

/**
 * Default deserializer
 */
function defaultDeserialize<T>(value: string): T {
  return JSON.parse(value)
}

/**
 * Hook for persisting state across page reloads
 *
 * @param key - Unique key for this state
 * @param initialValue - Initial value if no persisted state exists
 * @param options - Configuration options
 * @returns [state, setState, clearState]
 *
 * @example
 * ```tsx
 * const [formData, setFormData, clearFormData] = usePersistedState(
 *   'workflow-form',
 *   { name: '', description: '' },
 *   { storage: 'sessionStorage' }
 * )
 * ```
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  options: PersistedStateOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    keyPrefix = 'nexus_',
    storage: storageType = 'sessionStorage',
    serialize = defaultSerialize,
    deserialize = defaultDeserialize,
    syncTabs = false,
    debounceMs = 100,
    validate,
  } = options

  const fullKey = `${keyPrefix}${key}`
  const storage = getStorage(storageType)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialMount = useRef(true)

  /**
   * Get initial state from storage or use default
   */
  const getInitialState = useCallback((): T => {
    if (!storage) {
      return initialValue
    }

    try {
      const item = storage.getItem(fullKey)
      if (item === null) {
        return initialValue
      }

      const parsed = deserialize(item)

      // Validate if validator provided
      if (validate && !validate(parsed)) {
        console.warn(`[usePersistedState] Invalid data for key "${fullKey}", using initial value`)
        return initialValue
      }

      return parsed
    } catch (error) {
      console.warn(`[usePersistedState] Error reading "${fullKey}":`, error)
      return initialValue
    }
  }, [storage, fullKey, initialValue, deserialize, validate])

  const [state, setStateInternal] = useState<T>(getInitialState)

  /**
   * Save state to storage with debouncing
   */
  const persistState = useCallback((value: T) => {
    if (!storage) return

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce the write
    debounceRef.current = setTimeout(() => {
      try {
        const serialized = serialize(value)
        storage.setItem(fullKey, serialized)
      } catch (error) {
        console.warn(`[usePersistedState] Error saving "${fullKey}":`, error)
      }
    }, debounceMs)
  }, [storage, fullKey, serialize, debounceMs])

  /**
   * Update state and persist
   */
  const setState = useCallback((value: T | ((prev: T) => T)) => {
    setStateInternal((prev) => {
      const nextValue = typeof value === 'function'
        ? (value as (prev: T) => T)(prev)
        : value
      persistState(nextValue)
      return nextValue
    })
  }, [persistState])

  /**
   * Clear persisted state
   */
  const clearState = useCallback(() => {
    if (!storage) return

    try {
      storage.removeItem(fullKey)
      setStateInternal(initialValue)
    } catch (error) {
      console.warn(`[usePersistedState] Error clearing "${fullKey}":`, error)
    }
  }, [storage, fullKey, initialValue])

  /**
   * Handle cross-tab synchronization (localStorage only)
   */
  useEffect(() => {
    if (!syncTabs || storageType !== 'localStorage') {
      return
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== fullKey || event.storageArea !== storage) {
        return
      }

      try {
        const newValue = event.newValue
          ? deserialize(event.newValue)
          : initialValue

        // Validate if validator provided
        if (validate && !validate(newValue)) {
          return
        }

        setStateInternal(newValue)
      } catch (error) {
        console.warn(`[usePersistedState] Error syncing "${fullKey}":`, error)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [syncTabs, storageType, fullKey, storage, deserialize, initialValue, validate])

  /**
   * Persist initial state if not already stored
   */
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      // Only persist if there's no existing value
      if (storage && !storage.getItem(fullKey)) {
        persistState(initialValue)
      }
    }
  }, [storage, fullKey, initialValue, persistState])

  /**
   * Cleanup debounce on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return [state, setState, clearState]
}

/**
 * Hook for persisting workflow state
 */
export interface WorkflowFormData {
  name: string
  description: string
  prompt?: string
  autonomyLevel?: 'supervised' | 'semi' | 'autonomous' | 'ultimate'
  selectedNodes?: string[]
  lastModified?: number
}

const defaultWorkflowData: WorkflowFormData = {
  name: '',
  description: '',
  prompt: '',
  autonomyLevel: 'supervised',
  selectedNodes: [],
  lastModified: Date.now(),
}

export function usePersistedWorkflowForm() {
  return usePersistedState<WorkflowFormData>(
    'workflow-form',
    defaultWorkflowData,
    {
      storage: 'sessionStorage',
      validate: (value): value is WorkflowFormData => {
        return (
          typeof value === 'object' &&
          value !== null &&
          'name' in value &&
          'description' in value
        )
      },
    }
  )
}

/**
 * Hook for persisting current workflow ID
 */
export function useCurrentWorkflow() {
  return usePersistedState<string | null>(
    'current-workflow-id',
    null,
    { storage: 'sessionStorage' }
  )
}

/**
 * Hook for persisting UI preferences
 */
export interface UIPreferences {
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'system'
  lastVisitedRoute: string
}

const defaultUIPreferences: UIPreferences = {
  sidebarCollapsed: false,
  theme: 'system',
  lastVisitedRoute: '/dashboard',
}

export function useUIPreferences() {
  return usePersistedState<UIPreferences>(
    'ui-preferences',
    defaultUIPreferences,
    {
      storage: 'localStorage',
      syncTabs: true,
      validate: (value): value is UIPreferences => {
        return (
          typeof value === 'object' &&
          value !== null &&
          'sidebarCollapsed' in value &&
          'theme' in value
        )
      },
    }
  )
}

/**
 * Hook for persisting draft chat messages
 */
export function useDraftMessage(chatId: string = 'default') {
  return usePersistedState<string>(
    `draft-message-${chatId}`,
    '',
    { storage: 'sessionStorage', debounceMs: 300 }
  )
}

/**
 * Hook for persisting recent searches
 */
export function useRecentSearches(maxItems: number = 10) {
  const [searches, setSearches, clearSearches] = usePersistedState<string[]>(
    'recent-searches',
    [],
    { storage: 'localStorage' }
  )

  const addSearch = useCallback((query: string) => {
    if (!query.trim()) return

    setSearches((prev) => {
      // Remove duplicates and add to front
      const filtered = prev.filter((s) => s !== query)
      return [query, ...filtered].slice(0, maxItems)
    })
  }, [setSearches, maxItems])

  const removeSearch = useCallback((query: string) => {
    setSearches((prev) => prev.filter((s) => s !== query))
  }, [setSearches])

  return {
    searches,
    addSearch,
    removeSearch,
    clearSearches,
  }
}

/**
 * Utility to clear all persisted state with a given prefix
 */
export function clearAllPersistedState(
  keyPrefix: string = 'nexus_',
  storage: StorageType = 'sessionStorage'
): void {
  const storageObj = getStorage(storage)
  if (!storageObj) return

  const keysToRemove: string[] = []

  for (let i = 0; i < storageObj.length; i++) {
    const key = storageObj.key(i)
    if (key?.startsWith(keyPrefix)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => storageObj.removeItem(key))
}

export default usePersistedState

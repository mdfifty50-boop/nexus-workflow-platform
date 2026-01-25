/**
 * STATE PERSISTENCE LAYER
 *
 * Provides a consistent abstraction for persisting state across
 * localStorage, sessionStorage, and IndexedDB with versioning support.
 *
 * Features:
 * - Automatic serialization/deserialization
 * - Schema versioning with migrations
 * - Type-safe access patterns
 * - Namespace isolation
 * - TTL support for expiring data
 * - Compression for large data (optional)
 */

// ============================================================================
// TYPES
// ============================================================================

export type StorageBackend = 'local' | 'session' | 'memory'

export interface StorageOptions<T> {
  /** Storage backend to use */
  backend?: StorageBackend
  /** Version number for schema migrations */
  version?: number
  /** Migration function called when version changes */
  migrate?: (oldData: unknown, oldVersion: number) => T
  /** Time-to-live in milliseconds (0 = no expiration) */
  ttl?: number
  /** Default value if key doesn't exist */
  defaultValue?: T
  /** Namespace prefix for key isolation */
  namespace?: string
}

interface StoredValue<T> {
  value: T
  version: number
  timestamp: number
  expiresAt: number | null
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_NAMESPACE = 'nexus'
const DEFAULT_VERSION = 1

// Known storage keys with their types and defaults
export const STORAGE_KEYS = {
  // User preferences
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',

  // Personalization
  PERSONA: 'persona',
  CUSTOM_PERSONA_LABEL: 'custom_persona_label',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  USER_GOAL: 'user_goal',
  CONNECTED_INTEGRATIONS: 'connected_integrations',

  // Chatbot state
  CHATBOT_OPEN: 'chatbot_open',
  CHATBOT_MESSAGES: 'chatbot_messages',
  CHATBOT_STATE: 'chatbot_state',
  CHATBOT_INTENT: 'chatbot_intent',
  CHATBOT_INFO: 'chatbot_info',
  CHATBOT_QUESTIONS: 'chatbot_questions',
  CHATBOT_QUESTION_INDEX: 'chatbot_question_index',
  CHATBOT_USER_ID: 'chatbot_user_id',

  // Workflow state
  ACTIVE_WORKFLOW_ID: 'active_workflow_id',
  PENDING_WORKFLOW: 'pending_workflow',
  WORKFLOW_DRAFTS: 'workflow_drafts',
  RECENT_WORKFLOWS: 'recent_workflows',

  // Session state
  SESSION_TOKEN: 'session_token',
  LAST_ACTIVITY: 'last_activity',

  // Cache
  TEMPLATE_CACHE: 'template_cache',
  INTEGRATION_CACHE: 'integration_cache',
} as const

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

// ============================================================================
// IN-MEMORY FALLBACK STORAGE
// ============================================================================

class MemoryStorage {
  private store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  get length(): number {
    return this.store.size
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys())
    return keys[index] ?? null
  }

  keys(): string[] {
    return Array.from(this.store.keys())
  }
}

const memoryStorage = new MemoryStorage()

// ============================================================================
// STORAGE MANAGER CLASS
// ============================================================================

class StorageManager {
  private namespace: string
  private listeners = new Map<string, Set<(value: unknown) => void>>()

  constructor(namespace: string = DEFAULT_NAMESPACE) {
    this.namespace = namespace

    // Listen for storage events from other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent.bind(this))
    }
  }

  /**
   * Get the appropriate storage backend
   */
  private getStorage(backend: StorageBackend): Storage {
    if (typeof window === 'undefined') {
      return memoryStorage as unknown as Storage
    }

    try {
      switch (backend) {
        case 'session':
          // Test if sessionStorage is available
          sessionStorage.setItem('__test__', '1')
          sessionStorage.removeItem('__test__')
          return sessionStorage
        case 'memory':
          return memoryStorage as unknown as Storage
        case 'local':
        default:
          // Test if localStorage is available
          localStorage.setItem('__test__', '1')
          localStorage.removeItem('__test__')
          return localStorage
      }
    } catch {
      // Fall back to memory storage if access is denied
      console.warn(`[StatePersistence] ${backend}Storage unavailable, using memory`)
      return memoryStorage as unknown as Storage
    }
  }

  /**
   * Build namespaced key
   */
  private buildKey(key: string, customNamespace?: string): string {
    const ns = customNamespace ?? this.namespace
    return `${ns}_${key}`
  }

  /**
   * Parse stored value with version check
   */
  private parseStored<T>(
    raw: string | null,
    options: StorageOptions<T>
  ): T | undefined {
    if (!raw) return undefined

    try {
      const stored: StoredValue<T> = JSON.parse(raw)

      // Check expiration
      if (stored.expiresAt && Date.now() > stored.expiresAt) {
        return undefined
      }

      // Check version and migrate if needed
      const currentVersion = options.version ?? DEFAULT_VERSION
      if (stored.version !== currentVersion && options.migrate) {
        return options.migrate(stored.value, stored.version)
      }

      return stored.value
    } catch (e) {
      // Handle legacy values that aren't wrapped
      try {
        return JSON.parse(raw) as T
      } catch {
        // Return raw string for simple values
        return raw as unknown as T
      }
    }
  }

  /**
   * Wrap value with metadata
   */
  private wrapValue<T>(value: T, options: StorageOptions<T>): StoredValue<T> {
    const now = Date.now()
    return {
      value,
      version: options.version ?? DEFAULT_VERSION,
      timestamp: now,
      expiresAt: options.ttl ? now + options.ttl : null
    }
  }

  /**
   * Handle storage events from other tabs
   */
  private handleStorageEvent(event: StorageEvent): void {
    if (!event.key || !event.key.startsWith(this.namespace)) return

    const key = event.key.replace(`${this.namespace}_`, '')
    const listeners = this.listeners.get(key)

    if (listeners) {
      const value = event.newValue ? this.parseStored(event.newValue, {}) : undefined
      listeners.forEach(listener => listener(value))
    }
  }

  /**
   * Get a value from storage
   */
  get<T>(key: string, options: StorageOptions<T> = {}): T | undefined {
    const storage = this.getStorage(options.backend ?? 'local')
    const fullKey = this.buildKey(key, options.namespace)
    const raw = storage.getItem(fullKey)

    const value = this.parseStored<T>(raw, options)

    // Return default if undefined
    if (value === undefined && options.defaultValue !== undefined) {
      return options.defaultValue
    }

    return value
  }

  /**
   * Set a value in storage
   */
  set<T>(key: string, value: T, options: StorageOptions<T> = {}): void {
    const storage = this.getStorage(options.backend ?? 'local')
    const fullKey = this.buildKey(key, options.namespace)

    const wrapped = this.wrapValue(value, options)
    storage.setItem(fullKey, JSON.stringify(wrapped))

    // Notify local listeners (other tabs get notified via storage event)
    const listeners = this.listeners.get(key)
    if (listeners) {
      listeners.forEach(listener => listener(value))
    }
  }

  /**
   * Remove a value from storage
   */
  remove(key: string, options: Pick<StorageOptions<unknown>, 'backend' | 'namespace'> = {}): void {
    const storage = this.getStorage(options.backend ?? 'local')
    const fullKey = this.buildKey(key, options.namespace)
    storage.removeItem(fullKey)

    // Notify listeners
    const listeners = this.listeners.get(key)
    if (listeners) {
      listeners.forEach(listener => listener(undefined))
    }
  }

  /**
   * Check if a key exists
   */
  has(key: string, options: Pick<StorageOptions<unknown>, 'backend' | 'namespace'> = {}): boolean {
    const storage = this.getStorage(options.backend ?? 'local')
    const fullKey = this.buildKey(key, options.namespace)
    return storage.getItem(fullKey) !== null
  }

  /**
   * Get all keys matching a pattern
   */
  keys(pattern?: RegExp, options: Pick<StorageOptions<unknown>, 'backend' | 'namespace'> = {}): string[] {
    const storage = this.getStorage(options.backend ?? 'local')
    const prefix = `${options.namespace ?? this.namespace}_`
    const result: string[] = []

    // Get all keys
    const allKeys = storage === memoryStorage
      ? (storage as unknown as MemoryStorage).keys()
      : Object.keys(storage)

    for (const key of allKeys) {
      if (key.startsWith(prefix)) {
        const unprefixedKey = key.slice(prefix.length)
        if (!pattern || pattern.test(unprefixedKey)) {
          result.push(unprefixedKey)
        }
      }
    }

    return result
  }

  /**
   * Clear all keys in namespace
   */
  clear(options: Pick<StorageOptions<unknown>, 'backend' | 'namespace'> = {}): void {
    const storage = this.getStorage(options.backend ?? 'local')
    const prefix = `${options.namespace ?? this.namespace}_`

    // Get all keys to remove
    const allKeys = storage === memoryStorage
      ? (storage as unknown as MemoryStorage).keys()
      : Object.keys(storage)

    for (const key of allKeys) {
      if (key.startsWith(prefix)) {
        storage.removeItem(key)
      }
    }

    // Clear all listeners
    this.listeners.clear()
  }

  /**
   * Subscribe to changes for a key
   */
  subscribe<T>(key: string, listener: (value: T | undefined) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }

    this.listeners.get(key)!.add(listener as (value: unknown) => void)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key)
      if (listeners) {
        listeners.delete(listener as (value: unknown) => void)
        if (listeners.size === 0) {
          this.listeners.delete(key)
        }
      }
    }
  }

  /**
   * Get storage usage stats
   */
  getStats(backend: StorageBackend = 'local'): {
    used: number
    available: number
    keys: number
  } {
    const storage = this.getStorage(backend)

    let used = 0
    let keys = 0

    const allKeys = storage === memoryStorage
      ? (storage as unknown as MemoryStorage).keys()
      : Object.keys(storage)

    for (const key of allKeys) {
      if (key.startsWith(this.namespace)) {
        const value = storage.getItem(key)
        if (value) {
          used += key.length + value.length
          keys++
        }
      }
    }

    // Approximate available space (5MB for localStorage)
    const available = 5 * 1024 * 1024 - used

    return { used, available, keys }
  }

  /**
   * Clean up expired items
   */
  cleanup(options: Pick<StorageOptions<unknown>, 'backend' | 'namespace'> = {}): number {
    const storage = this.getStorage(options.backend ?? 'local')
    const prefix = `${options.namespace ?? this.namespace}_`
    let cleaned = 0

    const allKeys = storage === memoryStorage
      ? (storage as unknown as MemoryStorage).keys()
      : Object.keys(storage)

    const now = Date.now()

    for (const key of allKeys) {
      if (key.startsWith(prefix)) {
        try {
          const raw = storage.getItem(key)
          if (raw) {
            const stored: StoredValue<unknown> = JSON.parse(raw)
            if (stored.expiresAt && now > stored.expiresAt) {
              storage.removeItem(key)
              cleaned++
            }
          }
        } catch {
          // Skip items that can't be parsed
        }
      }
    }

    return cleaned
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const storage = new StorageManager()

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a typed storage accessor for a specific key
 */
export function createStorageAccessor<T>(
  key: string,
  defaultOptions: StorageOptions<T> = {}
) {
  return {
    get: (options?: Partial<StorageOptions<T>>): T | undefined =>
      storage.get(key, { ...defaultOptions, ...options }),

    set: (value: T, options?: Partial<StorageOptions<T>>): void =>
      storage.set(key, value, { ...defaultOptions, ...options }),

    remove: (): void =>
      storage.remove(key, defaultOptions),

    subscribe: (listener: (value: T | undefined) => void): (() => void) =>
      storage.subscribe(key, listener),
  }
}

/**
 * Hook helper - creates a React-friendly storage accessor
 */
export function getInitialStorageValue<T>(
  key: string,
  options: StorageOptions<T> = {}
): T | undefined {
  return storage.get(key, options)
}

// ============================================================================
// PRE-DEFINED ACCESSORS
// ============================================================================

export const themeStorage = createStorageAccessor<'light' | 'dark' | 'system'>(
  STORAGE_KEYS.THEME,
  { defaultValue: 'system' }
)

export const personaStorage = createStorageAccessor<string>(
  STORAGE_KEYS.PERSONA,
  { defaultValue: 'general' }
)

export const onboardingStorage = createStorageAccessor<boolean>(
  STORAGE_KEYS.ONBOARDING_COMPLETE,
  { defaultValue: false }
)

export const chatbotMessagesStorage = createStorageAccessor<Array<{ role: string; content: string }>>(
  STORAGE_KEYS.CHATBOT_MESSAGES,
  { defaultValue: [], backend: 'session' }
)

export const recentWorkflowsStorage = createStorageAccessor<string[]>(
  STORAGE_KEYS.RECENT_WORKFLOWS,
  { defaultValue: [] }
)

export const workflowDraftsStorage = createStorageAccessor<Record<string, unknown>>(
  STORAGE_KEYS.WORKFLOW_DRAFTS,
  { defaultValue: {}, ttl: 7 * 24 * 60 * 60 * 1000 } // 7 days
)

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Run migrations for legacy storage keys
 */
export function runStorageMigrations(): void {
  // Migrate old nexus_ prefixed keys to new format
  const legacyPrefixes = ['nexus_chatbot_', 'nexus_']

  for (const prefix of legacyPrefixes) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix) && !key.startsWith('nexus_')) {
        // This is a legacy key, migrate it
        const newKey = key.replace(prefix, '')
        const value = localStorage.getItem(key)
        if (value) {
          storage.set(newKey, JSON.parse(value))
          localStorage.removeItem(key)
        }
      }
    }
  }
}

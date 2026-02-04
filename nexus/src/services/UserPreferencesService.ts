/**
 * UserPreferencesService - Dual-write localStorage + Cloud persistence for user settings
 *
 * Plan B: User Account System - Phase 1.3: User Preferences
 *
 * Philosophy:
 * - DUAL-WRITE: Always save to localStorage (fast) + server API (cloud backup)
 * - GRACEFUL DEGRADATION: Works with localStorage only if server unavailable
 * - INSTANT UI: Apply changes immediately from localStorage, sync to cloud async
 * - SYNC ON LOAD: Merge server data with localStorage on app start
 */

// ============================================================================
// Types
// ============================================================================

export interface UserPreferences {
  // Appearance
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  language: string
  timezone: string

  // Notifications
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
  workflowAlerts: boolean

  // Privacy
  analyticsEnabled: boolean
  shareUsageData: boolean

  // Workflow defaults
  workflowDefaults: {
    autoExecute: boolean
    defaultTimeout: number
    retryCount: number
  }

  // Voice/AI
  voicePreferences: {
    provider: string
    voiceId: string | null
    speed: number
    autoTranscribe: boolean
  }

  // Accessibility
  accessibility: {
    reduceMotion: boolean
    highContrast: boolean
    fontSize: 'small' | 'medium' | 'large'
    screenReader: boolean
  }

  // Custom/extension fields
  customSettings: Record<string, unknown>
}

export type PreferenceKey = keyof UserPreferences
export type PreferenceValue<K extends PreferenceKey> = UserPreferences[K]

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'nexus-user-preferences'
const SYNC_STATUS_KEY = 'nexus-preferences-sync-status'
const API_BASE = '/api/user-preferences'

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  accentColor: 'nexus',
  language: 'en',
  timezone: 'Asia/Kuwait',
  emailNotifications: true,
  pushNotifications: true,
  weeklyDigest: false,
  workflowAlerts: true,
  analyticsEnabled: true,
  shareUsageData: false,
  workflowDefaults: {
    autoExecute: false,
    defaultTimeout: 30000,
    retryCount: 3,
  },
  voicePreferences: {
    provider: 'elevenlabs',
    voiceId: null,
    speed: 1.0,
    autoTranscribe: true,
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    fontSize: 'medium',
    screenReader: false,
  },
  customSettings: {},
}

// ============================================================================
// localStorage Helpers
// ============================================================================

function loadFromStorage(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { ...DEFAULT_PREFERENCES }
    const parsed = JSON.parse(stored) as Partial<UserPreferences>
    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      workflowDefaults: {
        ...DEFAULT_PREFERENCES.workflowDefaults,
        ...parsed.workflowDefaults,
      },
      voicePreferences: {
        ...DEFAULT_PREFERENCES.voicePreferences,
        ...parsed.voicePreferences,
      },
      accessibility: {
        ...DEFAULT_PREFERENCES.accessibility,
        ...parsed.accessibility,
      },
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

function saveToStorage(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    console.warn('[UserPreferences] localStorage save failed')
  }
}

// ============================================================================
// API Helpers
// ============================================================================

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  userId: string | null
): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (userId) {
      headers['x-clerk-user-id'] = userId
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      console.warn(`[UserPreferences] API call failed: ${response.status}`)
      return null
    }

    return await response.json() as T
  } catch (error) {
    console.warn('[UserPreferences] API call error:', error)
    return null
  }
}

// ============================================================================
// Service Class
// ============================================================================

type PreferenceChangeListener = (prefs: UserPreferences, changedKeys: PreferenceKey[]) => void

class UserPreferencesService {
  private userId: string | null = null
  private cloudEnabled: boolean = false
  private preferences: UserPreferences = { ...DEFAULT_PREFERENCES }
  private listeners: Set<PreferenceChangeListener> = new Set()

  constructor() {
    // Load from localStorage immediately
    this.preferences = loadFromStorage()
    // Check cloud status asynchronously
    this.checkCloudStatus()
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Check cloud status from server
   */
  private async checkCloudStatus(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/status`)
      if (response.ok) {
        const data = await response.json()
        this.cloudEnabled = data.cloudEnabled
        console.log(`[UserPreferences] Cloud: ${this.cloudEnabled ? 'enabled' : 'disabled'}`)
      }
    } catch {
      console.log('[UserPreferences] Server unavailable - localStorage only')
      this.cloudEnabled = false
    }
  }

  /**
   * Initialize with user ID for cloud operations
   */
  setUserId(userId: string | null): void {
    this.userId = userId
    if (userId) {
      console.log('[UserPreferences] User ID set - cloud sync available')
      // Sync from cloud when user logs in
      this.syncFromCloud()
    }
  }

  /**
   * Check if cloud persistence is available
   */
  isCloudEnabled(): boolean {
    return this.cloudEnabled && !!this.userId
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  /**
   * Get all preferences
   */
  getAll(): UserPreferences {
    return { ...this.preferences }
  }

  /**
   * Get a specific preference
   */
  get<K extends PreferenceKey>(key: K): PreferenceValue<K> {
    return this.preferences[key] as PreferenceValue<K>
  }

  /**
   * Get theme (common shortcut)
   */
  getTheme(): UserPreferences['theme'] {
    return this.preferences.theme
  }

  /**
   * Get accessibility settings
   */
  getAccessibility(): UserPreferences['accessibility'] {
    return { ...this.preferences.accessibility }
  }

  /**
   * Get notification settings
   */
  getNotifications(): Pick<
    UserPreferences,
    'emailNotifications' | 'pushNotifications' | 'weeklyDigest' | 'workflowAlerts'
  > {
    return {
      emailNotifications: this.preferences.emailNotifications,
      pushNotifications: this.preferences.pushNotifications,
      weeklyDigest: this.preferences.weeklyDigest,
      workflowAlerts: this.preferences.workflowAlerts,
    }
  }

  // ==========================================================================
  // Setters (Dual-Write)
  // ==========================================================================

  /**
   * Update a single preference
   */
  async set<K extends PreferenceKey>(key: K, value: PreferenceValue<K>): Promise<void> {
    // Step 1: Update local state + localStorage immediately
    this.preferences[key] = value
    saveToStorage(this.preferences)

    // Notify listeners
    this.notifyListeners([key])

    // Step 2: Async write to server (non-blocking)
    if (this.isCloudEnabled()) {
      apiCall('/', {
        method: 'PATCH',
        body: JSON.stringify({ updates: { [key]: value } }),
      }, this.userId).then((result) => {
        if (result) {
          this.updateSyncStatus()
        }
      }).catch((err) => {
        console.warn('[UserPreferences] Server sync failed:', err)
        // Could implement retry logic here
      })
    }
  }

  /**
   * Update multiple preferences at once
   */
  async setMultiple(updates: Partial<UserPreferences>): Promise<void> {
    // Step 1: Update local state + localStorage immediately
    const changedKeys: PreferenceKey[] = []

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key in this.preferences) {
        // Type-safe assignment using Object.assign for single property
        Object.assign(this.preferences, { [key]: value })
        changedKeys.push(key as PreferenceKey)
      }
    }

    saveToStorage(this.preferences)

    // Notify listeners
    if (changedKeys.length > 0) {
      this.notifyListeners(changedKeys)
    }

    // Step 2: Async write to server
    if (this.isCloudEnabled()) {
      apiCall('/', {
        method: 'PATCH',
        body: JSON.stringify({ updates }),
      }, this.userId).then((result) => {
        if (result) {
          this.updateSyncStatus()
        }
      }).catch(console.warn)
    }
  }

  /**
   * Set theme (common shortcut)
   */
  async setTheme(theme: UserPreferences['theme']): Promise<void> {
    await this.set('theme', theme)
    // Apply theme to document
    this.applyTheme(theme)
  }

  /**
   * Reset to defaults
   */
  async reset(): Promise<void> {
    this.preferences = { ...DEFAULT_PREFERENCES }
    saveToStorage(this.preferences)

    // Notify listeners
    this.notifyListeners(Object.keys(DEFAULT_PREFERENCES) as PreferenceKey[])

    // Delete from server
    if (this.isCloudEnabled()) {
      apiCall('/', { method: 'DELETE' }, this.userId).catch(console.warn)
    }
  }

  // ==========================================================================
  // Cloud Sync
  // ==========================================================================

  /**
   * Sync preferences from cloud
   */
  async syncFromCloud(): Promise<{ success: boolean; source: string }> {
    if (!this.isCloudEnabled()) {
      return { success: true, source: 'localStorage' }
    }

    try {
      const response = await apiCall<{ preferences: UserPreferences; source: string }>(
        '/',
        { method: 'GET' },
        this.userId
      )

      if (!response || response.source === 'defaults') {
        // No cloud data - upload local to cloud
        await this.uploadToCloud()
        return { success: true, source: 'localStorage' }
      }

      // Merge cloud with local (cloud wins for most recent)
      const merged = this.mergePreferences(this.preferences, response.preferences)
      this.preferences = merged
      saveToStorage(merged)

      // Notify listeners of potential changes
      this.notifyListeners(Object.keys(this.preferences) as PreferenceKey[])

      this.updateSyncStatus()

      return { success: true, source: 'merged' }
    } catch (err) {
      console.warn('[UserPreferences] Cloud sync failed:', err)
      return { success: false, source: 'localStorage' }
    }
  }

  /**
   * Upload local preferences to cloud
   */
  private async uploadToCloud(): Promise<void> {
    if (!this.isCloudEnabled()) return

    await apiCall('/', {
      method: 'PUT',
      body: JSON.stringify({ preferences: this.preferences }),
    }, this.userId)

    this.updateSyncStatus()
  }

  /**
   * Merge local and cloud preferences (cloud wins for simple values)
   */
  private mergePreferences(
    local: UserPreferences,
    cloud: UserPreferences
  ): UserPreferences {
    // For now, cloud values take precedence
    // Could implement more sophisticated merge logic if needed
    return {
      ...local,
      ...cloud,
      workflowDefaults: {
        ...local.workflowDefaults,
        ...cloud.workflowDefaults,
      },
      voicePreferences: {
        ...local.voicePreferences,
        ...cloud.voicePreferences,
      },
      accessibility: {
        ...local.accessibility,
        ...cloud.accessibility,
      },
      customSettings: {
        ...local.customSettings,
        ...cloud.customSettings,
      },
    }
  }

  // ==========================================================================
  // Sync Status
  // ==========================================================================

  getSyncStatus(): { lastSync: Date | null; enabled: boolean } {
    const lastSyncStr = localStorage.getItem(SYNC_STATUS_KEY)
    return {
      lastSync: lastSyncStr ? new Date(lastSyncStr) : null,
      enabled: this.isCloudEnabled(),
    }
  }

  private updateSyncStatus(): void {
    localStorage.setItem(SYNC_STATUS_KEY, new Date().toISOString())
  }

  // ==========================================================================
  // Change Listeners
  // ==========================================================================

  /**
   * Subscribe to preference changes
   */
  subscribe(listener: PreferenceChangeListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(changedKeys: PreferenceKey[]): void {
    for (const listener of this.listeners) {
      try {
        listener(this.preferences, changedKeys)
      } catch (err) {
        console.error('[UserPreferences] Listener error:', err)
      }
    }
  }

  // ==========================================================================
  // Theme Application
  // ==========================================================================

  /**
   * Apply theme to document
   */
  applyTheme(theme: UserPreferences['theme']): void {
    const root = document.documentElement

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }

  /**
   * Initialize theme on app load
   */
  initializeTheme(): void {
    this.applyTheme(this.preferences.theme)

    // Listen for system theme changes
    if (this.preferences.theme === 'system') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.preferences.theme === 'system') {
          document.documentElement.classList.toggle('dark', e.matches)
        }
      })
    }
  }

  // ==========================================================================
  // Migration Helpers
  // ==========================================================================

  /**
   * Migrate from old localStorage keys to unified storage
   */
  migrateFromLegacyStorage(): void {
    const migrations: { key: string; prefKey: PreferenceKey; transform?: (v: unknown) => unknown }[] = [
      { key: 'nexus_theme', prefKey: 'theme' },
      { key: 'nexus_privacy', prefKey: 'analyticsEnabled', transform: (v) => (v as { analytics?: boolean })?.analytics ?? true },
      { key: 'nexus_workflow_defaults', prefKey: 'workflowDefaults' },
    ]

    let migrated = false

    for (const { key, prefKey, transform } of migrations) {
      const value = localStorage.getItem(key)
      if (value) {
        try {
          let parsed = JSON.parse(value)
          if (transform) {
            parsed = transform(parsed)
          }
          Object.assign(this.preferences, { [prefKey]: parsed })
          localStorage.removeItem(key) // Clean up old key
          migrated = true
        } catch {
          // Ignore parse errors
        }
      }
    }

    if (migrated) {
      saveToStorage(this.preferences)
      console.log('[UserPreferences] Migrated from legacy storage')
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const userPreferencesService = new UserPreferencesService()
export default userPreferencesService

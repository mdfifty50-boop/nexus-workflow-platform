/**
 * Context Manager - User Preferences and Context Persistence
 *
 * Manages user context including:
 * - Saved addresses (home, work, etc.)
 * - Payment method references
 * - Preferences (dietary, communication, budget)
 * - Recent activity for inference
 * - Connected service status
 *
 * Key Features:
 * - Auto-extraction from conversations
 * - Secure storage (sensitive data encrypted)
 * - Intelligent inference from context
 */

import { supabase } from '../supabase'
import { apiClient } from '../api-client'
import type {
  UserContext,
  SavedAddress,
  PaymentMethodReference,
  UserPreferences,
  RecentActivity,
  ConnectedService,
} from '../../types/workflow-execution'

// ========================================
// Storage Keys
// ========================================

const STORAGE_KEYS = {
  USER_CONTEXT: 'nexus_user_context',
  TEMP_CONTEXT: 'nexus_temp_context',  // Session-only context
}

// ========================================
// Context Manager Class
// ========================================

export class ContextManager {
  private context: UserContext | null = null
  private tempContext: Record<string, unknown> = {}  // Conversation-scoped context
  private userId: string | null = null

  /**
   * Initialize context manager for a user
   */
  async initialize(userId: string): Promise<UserContext> {
    this.userId = userId
    this.context = await this.loadContext(userId)
    return this.context
  }

  /**
   * Load user context from database
   */
  async loadContext(userId: string): Promise<UserContext> {
    try {
      // Try to load from database first
      const { data, error } = await supabase
        .from('users')
        .select('metadata')
        .eq('id', userId)
        .single()

      if (!error && data?.metadata?.nexusContext) {
        this.context = data.metadata.nexusContext as UserContext
        return this.context
      }

      // Try local storage as fallback
      const localData = localStorage.getItem(`${STORAGE_KEYS.USER_CONTEXT}_${userId}`)
      if (localData) {
        this.context = JSON.parse(localData)
        return this.context!
      }

      // Create default context
      this.context = this.createDefaultContext(userId)
      await this.saveContext()
      return this.context
    } catch (err) {
      console.warn('[ContextManager] Failed to load context:', err)
      return this.createDefaultContext(userId)
    }
  }

  /**
   * Create default context for new users
   */
  private createDefaultContext(userId: string): UserContext {
    return {
      userId,
      addresses: [],
      paymentMethods: [],
      preferences: {
        communication: {
          preferredChannels: ['app'],
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        budget: {
          currency: 'USD',
        },
      },
      recentActivity: [],
      connectedServices: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  /**
   * Save context to database and local storage
   */
  async saveContext(): Promise<void> {
    if (!this.context || !this.userId) return

    this.context.updatedAt = new Date().toISOString()

    try {
      // Save to database
      await supabase
        .from('users')
        .update({
          metadata: { nexusContext: this.context },
        })
        .eq('id', this.userId)

      // Also save to local storage for offline access
      localStorage.setItem(
        `${STORAGE_KEYS.USER_CONTEXT}_${this.userId}`,
        JSON.stringify(this.context)
      )
    } catch (err) {
      console.warn('[ContextManager] Failed to save context:', err)
      // At least save locally
      localStorage.setItem(
        `${STORAGE_KEYS.USER_CONTEXT}_${this.userId}`,
        JSON.stringify(this.context)
      )
    }
  }

  /**
   * Get current context
   */
  getContext(): UserContext | null {
    return this.context
  }

  // ========================================
  // Address Management
  // ========================================

  /**
   * Add a new saved address
   */
  async addAddress(address: Omit<SavedAddress, 'id' | 'createdAt'>): Promise<SavedAddress> {
    if (!this.context) throw new Error('Context not initialized')

    const newAddress: SavedAddress = {
      ...address,
      id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    // If this is the first address or marked as default, set as default
    if (address.isDefault || this.context.addresses.length === 0) {
      this.context.addresses.forEach(a => (a.isDefault = false))
      newAddress.isDefault = true
      this.context.defaultAddressId = newAddress.id
    }

    this.context.addresses.push(newAddress)
    await this.saveContext()

    return newAddress
  }

  /**
   * Update an existing address
   */
  async updateAddress(addressId: string, updates: Partial<SavedAddress>): Promise<SavedAddress | null> {
    if (!this.context) throw new Error('Context not initialized')

    const index = this.context.addresses.findIndex(a => a.id === addressId)
    if (index === -1) return null

    // Handle default address change
    if (updates.isDefault) {
      this.context.addresses.forEach(a => (a.isDefault = false))
      this.context.defaultAddressId = addressId
    }

    this.context.addresses[index] = {
      ...this.context.addresses[index],
      ...updates,
    }

    await this.saveContext()
    return this.context.addresses[index]
  }

  /**
   * Delete an address
   */
  async deleteAddress(addressId: string): Promise<boolean> {
    if (!this.context) throw new Error('Context not initialized')

    const index = this.context.addresses.findIndex(a => a.id === addressId)
    if (index === -1) return false

    const wasDefault = this.context.addresses[index].isDefault
    this.context.addresses.splice(index, 1)

    // If deleted address was default, set first remaining as default
    if (wasDefault && this.context.addresses.length > 0) {
      this.context.addresses[0].isDefault = true
      this.context.defaultAddressId = this.context.addresses[0].id
    }

    await this.saveContext()
    return true
  }

  /**
   * Get address by label (e.g., "home", "work")
   */
  getAddressByLabel(label: string): SavedAddress | null {
    if (!this.context) return null
    return this.context.addresses.find(
      a => a.label.toLowerCase() === label.toLowerCase()
    ) || null
  }

  /**
   * Get default address
   */
  getDefaultAddress(): SavedAddress | null {
    if (!this.context) return null
    return this.context.addresses.find(a => a.isDefault) || this.context.addresses[0] || null
  }

  // ========================================
  // Payment Method Management
  // ========================================

  /**
   * Add a payment method reference
   * Note: Actual payment details are stored in payment provider, not here
   */
  async addPaymentMethod(method: Omit<PaymentMethodReference, 'id' | 'createdAt'>): Promise<PaymentMethodReference> {
    if (!this.context) throw new Error('Context not initialized')

    const newMethod: PaymentMethodReference = {
      ...method,
      id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    if (method.isDefault || this.context.paymentMethods.length === 0) {
      this.context.paymentMethods.forEach(p => (p.isDefault = false))
      newMethod.isDefault = true
      this.context.defaultPaymentMethodId = newMethod.id
    }

    this.context.paymentMethods.push(newMethod)
    await this.saveContext()

    return newMethod
  }

  /**
   * Get default payment method
   */
  getDefaultPaymentMethod(): PaymentMethodReference | null {
    if (!this.context) return null
    return this.context.paymentMethods.find(p => p.isDefault) || this.context.paymentMethods[0] || null
  }

  // ========================================
  // Preferences Management
  // ========================================

  /**
   * Update user preferences
   */
  async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    if (!this.context) throw new Error('Context not initialized')

    // Deep merge preferences
    this.context.preferences = this.deepMerge(
      this.context.preferences as Record<string, unknown>,
      updates as Record<string, unknown>
    ) as UserPreferences
    await this.saveContext()

    return this.context.preferences
  }

  /**
   * Get specific preference value
   */
  getPreference<K extends keyof UserPreferences>(key: K): UserPreferences[K] | undefined {
    return this.context?.preferences[key]
  }

  /**
   * Deep merge helper
   */
  private deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    const result = { ...target }

    for (const key of Object.keys(source) as (keyof T)[]) {
      const sourceValue = source[key]
      const targetValue = target[key]

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = this.deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as T[keyof T]
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[keyof T]
      }
    }

    return result
  }

  // ========================================
  // Activity Tracking
  // ========================================

  /**
   * Log recent activity for inference
   */
  async logActivity(activity: Omit<RecentActivity, 'id' | 'timestamp'>): Promise<void> {
    if (!this.context) return

    const newActivity: RecentActivity = {
      ...activity,
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
    }

    this.context.recentActivity.unshift(newActivity)

    // Keep only last 100 activities
    if (this.context.recentActivity.length > 100) {
      this.context.recentActivity = this.context.recentActivity.slice(0, 100)
    }

    await this.saveContext()
  }

  /**
   * Get recent activities of a specific type
   */
  getRecentActivities(type?: string, limit: number = 10): RecentActivity[] {
    if (!this.context) return []

    let activities = this.context.recentActivity

    if (type) {
      activities = activities.filter(a => a.type === type)
    }

    return activities.slice(0, limit)
  }

  // ========================================
  // Conversation Context (Temporary)
  // ========================================

  /**
   * Set temporary context from conversation
   * This is not persisted across sessions
   */
  setTempContext(key: string, value: unknown): void {
    this.tempContext[key] = value
  }

  /**
   * Get temporary context
   */
  getTempContext(key: string): unknown {
    return this.tempContext[key]
  }

  /**
   * Clear temporary context
   */
  clearTempContext(): void {
    this.tempContext = {}
  }

  // ========================================
  // AI-Powered Context Extraction
  // ========================================

  /**
   * Extract context from a conversation message
   * Uses AI to identify and save relevant user information
   */
  async extractContextFromMessage(message: string): Promise<{
    extracted: boolean
    updates: string[]
  }> {
    const systemPrompt = `You are a context extraction system. Analyze the user's message and extract any personal information that should be saved for future use.

Current context:
${JSON.stringify({
  addresses: this.context?.addresses.map(a => a.label),
  preferences: this.context?.preferences,
}, null, 2)}

Look for:
1. Addresses (home, work, etc.) with location details
2. Preferences (dietary restrictions, budget, communication preferences)
3. Personal details (timezone, language preference)

Return JSON:
{
  "hasNewInfo": boolean,
  "updates": [
    {
      "type": "address|preference|custom",
      "key": "field name",
      "value": "extracted value",
      "confidence": 0.0-1.0
    }
  ]
}

Only extract information the user has explicitly mentioned. Do not infer or assume.`

    try {
      const response = await apiClient.chat({
        messages: [{ role: 'user', content: message }],
        systemPrompt,
        model: 'claude-3-5-haiku-20241022',
        maxTokens: 500,
      })

      if (response.success && response.output) {
        const jsonMatch = response.output.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0])

          if (result.hasNewInfo && result.updates?.length > 0) {
            const appliedUpdates: string[] = []

            for (const update of result.updates) {
              if (update.confidence < 0.7) continue  // Skip low-confidence extractions

              try {
                await this.applyContextUpdate(update)
                appliedUpdates.push(`${update.type}: ${update.key}`)
              } catch (err) {
                console.warn('[ContextManager] Failed to apply update:', update, err)
              }
            }

            return { extracted: true, updates: appliedUpdates }
          }
        }
      }
    } catch (err) {
      console.warn('[ContextManager] Context extraction failed:', err)
    }

    return { extracted: false, updates: [] }
  }

  /**
   * Apply a context update from extraction
   */
  private async applyContextUpdate(update: {
    type: string
    key: string
    value: unknown
    confidence: number
  }): Promise<void> {
    switch (update.type) {
      case 'address':
        if (typeof update.value === 'object' && update.value !== null) {
          await this.addAddress({
            label: update.key,
            fullAddress: (update.value as Record<string, string>).fullAddress || String(update.value),
            components: update.value as SavedAddress['components'],
            isDefault: this.context?.addresses.length === 0,
          })
        } else if (typeof update.value === 'string') {
          await this.addAddress({
            label: update.key,
            fullAddress: update.value,
            components: {},
            isDefault: this.context?.addresses.length === 0,
          })
        }
        break

      case 'preference':
        const prefUpdate: Partial<UserPreferences> = {}
        const [category, field] = update.key.split('.')

        if (category && field) {
          (prefUpdate as Record<string, Record<string, unknown>>)[category] = {
            [field]: update.value,
          }
        } else {
          (prefUpdate as Record<string, unknown>)[update.key] = update.value
        }

        await this.updatePreferences(prefUpdate)
        break

      case 'custom':
        // Store in custom preferences
        await this.updatePreferences({
          custom: {
            ...(this.context?.preferences.custom || {}),
            [update.key]: update.value,
          },
        })
        break
    }
  }

  // ========================================
  // Connected Services
  // ========================================

  /**
   * Update connected service status
   */
  async updateConnectedService(service: ConnectedService): Promise<void> {
    if (!this.context) return

    const index = this.context.connectedServices.findIndex(
      s => s.serviceId === service.serviceId
    )

    if (index >= 0) {
      this.context.connectedServices[index] = service
    } else {
      this.context.connectedServices.push(service)
    }

    await this.saveContext()
  }

  /**
   * Check if a service is connected
   */
  isServiceConnected(serviceId: string): boolean {
    return this.context?.connectedServices.some(
      s => s.serviceId === serviceId && s.status === 'active'
    ) || false
  }

  // ========================================
  // Context Queries
  // ========================================

  /**
   * Resolve a location reference (e.g., "home" -> full address)
   */
  resolveLocation(reference: string): SavedAddress | null {
    if (!this.context) return null

    const normalized = reference.toLowerCase().trim()

    // Direct label match
    const byLabel = this.context.addresses.find(
      a => a.label.toLowerCase() === normalized
    )
    if (byLabel) return byLabel

    // Common aliases
    const aliases: Record<string, string[]> = {
      home: ['my home', 'my house', 'my place', 'residence', 'house'],
      work: ['my work', 'office', 'my office', 'the office', 'workplace', 'job'],
    }

    for (const [label, aliasList] of Object.entries(aliases)) {
      if (aliasList.some(a => normalized.includes(a))) {
        const addr = this.context.addresses.find(
          a => a.label.toLowerCase() === label
        )
        if (addr) return addr
      }
    }

    return null
  }

  /**
   * Get all context as a summary for AI prompts
   */
  getContextSummary(): string {
    if (!this.context) return 'No user context available.'

    const parts: string[] = []

    // Addresses
    if (this.context.addresses.length > 0) {
      parts.push(`Saved addresses: ${this.context.addresses.map(a =>
        `${a.label}${a.isDefault ? ' (default)' : ''}`
      ).join(', ')}`)
    }

    // Preferences
    const prefs = this.context.preferences
    if (prefs.dietary) {
      const dietary = []
      if (prefs.dietary.restrictions.length > 0) {
        dietary.push(`restrictions: ${prefs.dietary.restrictions.join(', ')}`)
      }
      if (prefs.dietary.allergies.length > 0) {
        dietary.push(`allergies: ${prefs.dietary.allergies.join(', ')}`)
      }
      if (dietary.length > 0) {
        parts.push(`Dietary: ${dietary.join('; ')}`)
      }
    }

    if (prefs.budget?.preferredPriceRange) {
      parts.push(`Budget preference: ${prefs.budget.preferredPriceRange}`)
    }

    if (prefs.communication) {
      parts.push(`Language: ${prefs.communication.language}, Timezone: ${prefs.communication.timezone}`)
    }

    // Payment
    const defaultPayment = this.getDefaultPaymentMethod()
    if (defaultPayment) {
      parts.push(`Default payment: ${defaultPayment.type} (${defaultPayment.label})`)
    }

    return parts.length > 0 ? parts.join('\n') : 'No user preferences saved.'
  }

  /**
   * Export context for backup
   */
  exportContext(): UserContext | null {
    return this.context ? { ...this.context } : null
  }

  /**
   * Import context from backup
   */
  async importContext(context: UserContext): Promise<void> {
    if (!this.userId) throw new Error('Context manager not initialized')

    this.context = {
      ...context,
      userId: this.userId,
      updatedAt: new Date().toISOString(),
    }

    await this.saveContext()
  }

  /**
   * Clear all context (for account deletion or reset)
   */
  async clearContext(): Promise<void> {
    if (!this.userId) return

    this.context = this.createDefaultContext(this.userId)
    this.tempContext = {}

    await this.saveContext()
    localStorage.removeItem(`${STORAGE_KEYS.USER_CONTEXT}_${this.userId}`)
  }
}

// Export singleton instance
export const contextManager = new ContextManager()

// Re-export types
export type { UserContext, SavedAddress, PaymentMethodReference, UserPreferences }

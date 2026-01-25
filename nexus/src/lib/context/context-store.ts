/**
 * Context Store
 *
 * Manages storage and retrieval of user context from localStorage and/or Supabase.
 * Provides unified API for context persistence across sessions.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type {
  UserContext,
  PartialUserContext,
  StoreContextRequest,
  StoreContextResponse,
  UserContextQueryFilters,
} from '@/types/user-context'

const STORAGE_KEY = 'nexus_user_context'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * In-memory cache for quick access
 */
let contextCache: UserContext | null = null
let cacheTimestamp: number = 0

/**
 * Get current user ID from auth or localStorage
 */
async function getCurrentUserId(): Promise<string | null> {
  // Try Supabase auth first
  if (isSupabaseConfigured()) {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user?.id) {
      return data.session.user.id
    }
  }

  // Fall back to localStorage-based user ID
  const storedContext = localStorage.getItem(STORAGE_KEY)
  if (storedContext) {
    try {
      const parsed = JSON.parse(storedContext)
      return parsed.userId || null
    } catch {
      return null
    }
  }

  return null
}

/**
 * Generate a guest user ID for anonymous sessions
 */
function generateGuestUserId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Store context to localStorage
 */
function storeToLocalStorage(context: UserContext): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context))
    contextCache = context
    cacheTimestamp = Date.now()
  } catch (error) {
    console.error('[ContextStore] Failed to store to localStorage:', error)
  }
}

/**
 * Load context from localStorage
 */
function loadFromLocalStorage(): UserContext | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const context = JSON.parse(stored) as UserContext
      contextCache = context
      cacheTimestamp = Date.now()
      return context
    }
  } catch (error) {
    console.error('[ContextStore] Failed to load from localStorage:', error)
  }
  return null
}

/**
 * Store context to Supabase user metadata
 */
async function storeToSupabase(context: UserContext): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('[ContextStore] Supabase not configured, skipping')
    return false
  }

  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session?.user) {
      console.warn('[ContextStore] No active session, cannot store to Supabase')
      return false
    }

    // Store in user metadata
    const { error } = await supabase.auth.updateUser({
      data: {
        user_context: context,
        user_context_updated_at: new Date().toISOString(),
      }
    })

    if (error) {
      console.error('[ContextStore] Failed to store to Supabase:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[ContextStore] Supabase store error:', error)
    return false
  }
}

/**
 * Load context from Supabase user metadata
 */
async function loadFromSupabase(_userId: string): Promise<UserContext | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session?.user) {
      return null
    }

    const userMetadata = session.session.user.user_metadata
    if (userMetadata?.user_context) {
      const context = userMetadata.user_context as UserContext
      contextCache = context
      cacheTimestamp = Date.now()
      return context
    }
  } catch (error) {
    console.error('[ContextStore] Failed to load from Supabase:', error)
  }

  return null
}

/**
 * Merge partial context with existing context
 */
function mergeContext(existing: UserContext, partial: PartialUserContext): UserContext {
  const merged: UserContext = { ...existing }

  // Merge simple fields
  if (partial.fullName) merged.fullName = partial.fullName
  if (partial.email) merged.email = partial.email
  if (partial.phone) merged.phone = partial.phone
  if (partial.dateOfBirth) merged.dateOfBirth = partial.dateOfBirth
  if (partial.gender) merged.gender = partial.gender
  if (partial.profileImageUrl) merged.profileImageUrl = partial.profileImageUrl

  // Merge arrays (deduplicate by id)
  if (partial.addresses) {
    const existingIds = new Set(existing.addresses.map(a => a.id))
    const newAddresses = partial.addresses.filter(a => !existingIds.has(a.id))
    merged.addresses = [...existing.addresses, ...newAddresses]
  }

  if (partial.frequentContacts) {
    const existingIds = new Set(existing.frequentContacts.map(c => c.id))
    const newContacts = partial.frequentContacts.filter(c => !existingIds.has(c.id))
    merged.frequentContacts = [...existing.frequentContacts, ...newContacts]
  }

  if (partial.foodPreferences) {
    const existingIds = new Set(existing.foodPreferences.map(p => p.id))
    const newPrefs = partial.foodPreferences.filter(p => !existingIds.has(p.id))
    merged.foodPreferences = [...existing.foodPreferences, ...newPrefs]
  }

  // Merge nested objects
  if (partial.communicationPreferences) {
    merged.communicationPreferences = {
      ...existing.communicationPreferences,
      ...partial.communicationPreferences,
    }
  }

  if (partial.behavioralPreferences) {
    merged.behavioralPreferences = {
      ...existing.behavioralPreferences,
      ...partial.behavioralPreferences,
    }
  }

  if (partial.professionalProfile) {
    merged.professionalProfile = {
      ...existing.professionalProfile,
      ...partial.professionalProfile,
    }
  }

  if (partial.servicePreferences) {
    merged.servicePreferences = {
      ...existing.servicePreferences,
      ...partial.servicePreferences,
    }
  }

  // Merge metadata
  if (partial.metadata) {
    merged.metadata = { ...existing.metadata, ...partial.metadata }
  }

  if (partial.tags) {
    const existingTags = new Set(existing.tags || [])
    const newTags = partial.tags.filter(t => !existingTags.has(t))
    merged.tags = [...(existing.tags || []), ...newTags]
  }

  // Update timestamps
  merged.updatedAt = new Date().toISOString()

  return merged
}

/**
 * Store user context
 */
export async function storeUserContext(request: StoreContextRequest): Promise<StoreContextResponse> {
  try {
    let userId = request.userId

    // Generate guest ID if none provided
    if (!userId || userId === '') {
      userId = generateGuestUserId()
    }

    // Load existing context
    let existing: UserContext | null = null

    // Try cache first
    if (contextCache && contextCache.userId === userId && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      existing = contextCache
    } else {
      // Try localStorage
      existing = loadFromLocalStorage()

      // Try Supabase if enabled
      if (!existing || existing.userId !== userId) {
        existing = await loadFromSupabase(userId)
      }
    }

    // Create or merge context
    let context: UserContext

    if (existing && existing.userId === userId) {
      if (request.merge) {
        // Merge with existing
        context = mergeContext(existing, request.context)
      } else {
        // Replace existing (but keep userId)
        context = {
          ...(request.context as UserContext),
          userId,
          updatedAt: new Date().toISOString(),
        }
      }
    } else {
      // Create new context
      const { createEmptyUserContext } = await import('@/types/user-context')
      const emptyContext = createEmptyUserContext(userId, request.source)
      context = mergeContext(emptyContext, request.context)
    }

    // Store to localStorage (always)
    storeToLocalStorage(context)

    // Store to Supabase (if configured and user is authenticated)
    const supabaseStored = await storeToSupabase(context)

    return {
      success: true,
      userId: context.userId,
      context,
      message: supabaseStored
        ? 'Context stored to localStorage and Supabase'
        : 'Context stored to localStorage only',
    }
  } catch (error) {
    console.error('[ContextStore] Store error:', error)
    return {
      success: false,
      userId: request.userId,
      context: null as any,
      message: 'Failed to store context',
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}

/**
 * Load user context
 */
export async function loadUserContext(userId?: string): Promise<UserContext | null> {
  try {
    // Use provided userId or get current user
    const targetUserId = userId || (await getCurrentUserId())
    if (!targetUserId) {
      return null
    }

    // Try cache first
    if (contextCache && contextCache.userId === targetUserId && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      return contextCache
    }

    // Try localStorage
    const localContext = loadFromLocalStorage()
    if (localContext && localContext.userId === targetUserId) {
      return localContext
    }

    // Try Supabase
    const supabaseContext = await loadFromSupabase(targetUserId)
    if (supabaseContext) {
      // Sync to localStorage for offline access
      storeToLocalStorage(supabaseContext)
      return supabaseContext
    }

    return null
  } catch (error) {
    console.error('[ContextStore] Load error:', error)
    return null
  }
}

/**
 * Clear user context (logout, reset)
 */
export function clearUserContext(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    contextCache = null
    cacheTimestamp = 0
  } catch (error) {
    console.error('[ContextStore] Clear error:', error)
  }
}

/**
 * Query user contexts (for admin/search features)
 */
export async function queryUserContexts(filters: UserContextQueryFilters): Promise<UserContext[]> {
  // For now, only support querying the current user's context
  // Multi-user queries would require a dedicated Supabase table

  const context = await loadUserContext(filters.userId)
  if (!context) {
    return []
  }

  // Apply filters
  if (filters.hasAddress && context.addresses.length === 0) return []
  if (filters.hasContacts && context.frequentContacts.length === 0) return []

  if (filters.searchText) {
    const searchLower = filters.searchText.toLowerCase()
    const matchesSearch =
      context.fullName.toLowerCase().includes(searchLower) ||
      context.email.toLowerCase().includes(searchLower) ||
      context.addresses.some(a => a.fullAddress.toLowerCase().includes(searchLower)) ||
      context.frequentContacts.some(c => c.name.toLowerCase().includes(searchLower))

    if (!matchesSearch) return []
  }

  if (filters.tags && filters.tags.length > 0) {
    const hasMatchingTag = filters.tags.some(tag => context.tags?.includes(tag))
    if (!hasMatchingTag) return []
  }

  return [context]
}

/**
 * Get context summary for quick display
 */
export async function getUserContextSummary(userId?: string) {
  const context = await loadUserContext(userId)
  if (!context) return null

  const { getUserContextSummary } = await import('@/types/user-context')
  return getUserContextSummary(context)
}

/**
 * Update specific fields in context (convenience method)
 */
export async function updateContextField(
  field: keyof UserContext,
  value: any,
  userId?: string
): Promise<StoreContextResponse> {
  const targetUserId = userId || (await getCurrentUserId())
  if (!targetUserId) {
    return {
      success: false,
      userId: '',
      context: null as any,
      message: 'No user ID available',
      errors: ['User ID required'],
    }
  }

  return storeUserContext({
    userId: targetUserId,
    context: { userId: targetUserId, [field]: value },
    merge: true,
    source: 'manual',
  })
}

/**
 * Check if user has context stored
 */
export async function hasUserContext(userId?: string): Promise<boolean> {
  const context = await loadUserContext(userId)
  return context !== null
}

/**
 * Export context as JSON for backup/transfer
 */
export async function exportUserContext(userId?: string): Promise<string> {
  const context = await loadUserContext(userId)
  if (!context) {
    throw new Error('No context found to export')
  }
  return JSON.stringify(context, null, 2)
}

/**
 * Import context from JSON
 */
export async function importUserContext(jsonData: string, userId?: string): Promise<StoreContextResponse> {
  try {
    const context = JSON.parse(jsonData) as UserContext

    const targetUserId = userId || context.userId || (await getCurrentUserId())
    if (!targetUserId) {
      return {
        success: false,
        userId: '',
        context: null as any,
        message: 'No user ID available',
        errors: ['User ID required'],
      }
    }

    return storeUserContext({
      userId: targetUserId,
      context: { ...context, userId: targetUserId },
      merge: false, // Replace on import
      source: 'manual',
      extractionMethod: 'json_import',
    })
  } catch (error) {
    return {
      success: false,
      userId: userId || '',
      context: null as any,
      message: 'Failed to import context',
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}

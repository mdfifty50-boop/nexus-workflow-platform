/**
 * User Preferences API Routes
 *
 * Plan B: User Account System - Phase 1.3: User Preferences
 *
 * Handles:
 * - GET /status - Check cloud persistence status
 * - GET / - Get user's preferences
 * - PUT / - Update user's preferences (full replace)
 * - PATCH / - Partial update of preferences
 * - DELETE / - Reset to defaults
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

// ============================================================================
// Supabase Client Setup
// ============================================================================

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create client with service_role key (bypasses RLS)
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// ============================================================================
// Types
// ============================================================================

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  language: string
  timezone: string
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
  workflowAlerts: boolean
  analyticsEnabled: boolean
  shareUsageData: boolean
  workflowDefaults: {
    autoExecute: boolean
    defaultTimeout: number
    retryCount: number
  }
  voicePreferences: {
    provider: string
    voiceId: string | null
    speed: number
    autoTranscribe: boolean
  }
  accessibility: {
    reduceMotion: boolean
    highContrast: boolean
    fontSize: 'small' | 'medium' | 'large'
    screenReader: boolean
  }
  customSettings: Record<string, unknown>
}

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
// Helper Functions
// ============================================================================

/**
 * Get user ID from request headers
 * In dev mode without Clerk, returns 'dev-user-123'
 */
function getUserId(req: Request): string {
  const clerkUserId = req.headers['x-clerk-user-id'] as string
  if (clerkUserId) {
    return clerkUserId
  }
  console.log('[UserPreferences] No Clerk user ID, using dev user')
  return 'dev-user-123'
}

/**
 * Convert database row to API format (snake_case to camelCase)
 */
function dbToApi(row: Record<string, unknown>): UserPreferences {
  return {
    theme: (row.theme as UserPreferences['theme']) || 'dark',
    accentColor: (row.accent_color as string) || 'nexus',
    language: (row.language as string) || 'en',
    timezone: (row.timezone as string) || 'Asia/Kuwait',
    emailNotifications: row.email_notifications !== false,
    pushNotifications: row.push_notifications !== false,
    weeklyDigest: row.weekly_digest === true,
    workflowAlerts: row.workflow_alerts !== false,
    analyticsEnabled: row.analytics_enabled !== false,
    shareUsageData: row.share_usage_data === true,
    workflowDefaults: (row.workflow_defaults as UserPreferences['workflowDefaults']) ||
      DEFAULT_PREFERENCES.workflowDefaults,
    voicePreferences: (row.voice_preferences as UserPreferences['voicePreferences']) ||
      DEFAULT_PREFERENCES.voicePreferences,
    accessibility: (row.accessibility as UserPreferences['accessibility']) ||
      DEFAULT_PREFERENCES.accessibility,
    customSettings: (row.custom_settings as Record<string, unknown>) || {},
  }
}

/**
 * Convert API format to database row (camelCase to snake_case)
 */
function apiToDb(prefs: Partial<UserPreferences>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  if (prefs.theme !== undefined) result.theme = prefs.theme
  if (prefs.accentColor !== undefined) result.accent_color = prefs.accentColor
  if (prefs.language !== undefined) result.language = prefs.language
  if (prefs.timezone !== undefined) result.timezone = prefs.timezone
  if (prefs.emailNotifications !== undefined) result.email_notifications = prefs.emailNotifications
  if (prefs.pushNotifications !== undefined) result.push_notifications = prefs.pushNotifications
  if (prefs.weeklyDigest !== undefined) result.weekly_digest = prefs.weeklyDigest
  if (prefs.workflowAlerts !== undefined) result.workflow_alerts = prefs.workflowAlerts
  if (prefs.analyticsEnabled !== undefined) result.analytics_enabled = prefs.analyticsEnabled
  if (prefs.shareUsageData !== undefined) result.share_usage_data = prefs.shareUsageData
  if (prefs.workflowDefaults !== undefined) result.workflow_defaults = prefs.workflowDefaults
  if (prefs.voicePreferences !== undefined) result.voice_preferences = prefs.voicePreferences
  if (prefs.accessibility !== undefined) result.accessibility = prefs.accessibility
  if (prefs.customSettings !== undefined) result.custom_settings = prefs.customSettings

  return result
}

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /status - Check cloud persistence status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    supabaseConfigured: !!supabase,
    cloudEnabled: !!supabase,
  })
})

/**
 * GET / - Get user's preferences
 */
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserId(req)

  if (!supabase) {
    return res.json({
      preferences: DEFAULT_PREFERENCES,
      source: 'localStorage',
      message: 'Supabase not configured',
    })
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('clerk_user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (which is fine, use defaults)
      console.error('[UserPreferences] Supabase query error:', error)
      return res.json({
        preferences: DEFAULT_PREFERENCES,
        source: 'localStorage',
        error: error.message,
      })
    }

    if (!data) {
      // No preferences yet, return defaults
      return res.json({
        preferences: DEFAULT_PREFERENCES,
        source: 'defaults',
      })
    }

    res.json({
      preferences: dbToApi(data),
      source: 'supabase',
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[UserPreferences] Error fetching preferences:', errorMessage)
    res.json({
      preferences: DEFAULT_PREFERENCES,
      source: 'localStorage',
      error: errorMessage,
    })
  }
})

/**
 * PUT / - Full update of preferences (upsert)
 */
router.put('/', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const { preferences } = req.body

  if (!preferences) {
    return res.status(400).json({ error: 'Preferences object is required' })
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  try {
    const dbRow = {
      clerk_user_id: userId,
      ...apiToDb(preferences),
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(dbRow, { onConflict: 'clerk_user_id' })
      .select()
      .single()

    if (error) {
      console.error('[UserPreferences] Supabase upsert error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({
      success: true,
      preferences: dbToApi(data),
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[UserPreferences] Error saving preferences:', errorMessage)
    res.status(500).json({ error: errorMessage })
  }
})

/**
 * PATCH / - Partial update of preferences
 */
router.patch('/', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const { updates } = req.body

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Updates object is required' })
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  try {
    // First check if row exists
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('clerk_user_id')
      .eq('clerk_user_id', userId)
      .single()

    const dbUpdates = apiToDb(updates)

    if (!existing) {
      // Insert new row with defaults + updates
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          clerk_user_id: userId,
          ...dbUpdates,
        })
        .select()
        .single()

      if (error) {
        console.error('[UserPreferences] Supabase insert error:', error)
        return res.status(500).json({ error: error.message })
      }

      return res.json({
        success: true,
        preferences: dbToApi(data),
      })
    }

    // Update existing row
    const { data, error } = await supabase
      .from('user_preferences')
      .update(dbUpdates)
      .eq('clerk_user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('[UserPreferences] Supabase update error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({
      success: true,
      preferences: dbToApi(data),
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[UserPreferences] Error updating preferences:', errorMessage)
    res.status(500).json({ error: errorMessage })
  }
})

/**
 * DELETE / - Reset preferences to defaults
 */
router.delete('/', async (req: Request, res: Response) => {
  const userId = getUserId(req)

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  try {
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('clerk_user_id', userId)

    if (error) {
      console.error('[UserPreferences] Supabase delete error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({
      success: true,
      preferences: DEFAULT_PREFERENCES,
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[UserPreferences] Error deleting preferences:', errorMessage)
    res.status(500).json({ error: errorMessage })
  }
})

export default router

/**
 * User Profile API Routes
 *
 * Supabase persistence for:
 * - Business Profile (from onboarding wizard)
 * - User Context (auto-inferred from usage)
 *
 * Follows the same dual-write pattern as user-preferences.ts:
 * - localStorage first (instant UI)
 * - Async non-blocking cloud sync
 * - Cloud wins on merge (cross-device consistency)
 * - Graceful degradation if Supabase unavailable
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

// ============================================================================
// Supabase Client Setup (reuse same pattern as user-preferences)
// ============================================================================

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// ============================================================================
// Helper Functions
// ============================================================================

function getUserId(req: Request): string {
  const clerkUserId = req.headers['x-clerk-user-id'] as string
  if (clerkUserId) return clerkUserId
  console.log('[UserProfile] No Clerk user ID, using dev user')
  return 'dev-user-123'
}

// ============================================================================
// Business Profile: camelCase <-> snake_case conversion
// ============================================================================

interface BusinessProfileRow {
  clerk_user_id: string
  business_name: string | null
  industry: string | null
  company_size: string | null
  primary_role: string | null
  timezone: string | null
  automation_priorities: string[] | null
  pain_points: string[] | null
  ecommerce_fields: Record<string, unknown> | null
  saas_fields: Record<string, unknown> | null
  agency_fields: Record<string, unknown> | null
  custom_industry_description: string | null
  time_savings_goal: string | null
  budget_range: string | null
  updated_at: string
}

function businessProfileDbToApi(row: BusinessProfileRow): Record<string, unknown> {
  return {
    businessName: row.business_name || '',
    industry: row.industry || null,
    companySize: row.company_size || null,
    primaryRole: row.primary_role || null,
    timezone: row.timezone || '',
    automationPriorities: row.automation_priorities || [],
    painPoints: row.pain_points || [],
    ecommerceFields: row.ecommerce_fields || { platform: null, orderVolume: null },
    saasFields: row.saas_fields || { userBaseSize: null, techStack: [] },
    agencyFields: row.agency_fields || { clientCount: null, serviceTypes: [] },
    customIndustryDescription: row.custom_industry_description || '',
    timeSavingsGoal: row.time_savings_goal || null,
    budgetRange: row.budget_range || null,
  }
}

function businessProfileApiToDb(profile: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  if (profile.businessName !== undefined) result.business_name = profile.businessName
  if (profile.industry !== undefined) result.industry = profile.industry
  if (profile.companySize !== undefined) result.company_size = profile.companySize
  if (profile.primaryRole !== undefined) result.primary_role = profile.primaryRole
  if (profile.timezone !== undefined) result.timezone = profile.timezone
  if (profile.automationPriorities !== undefined) result.automation_priorities = profile.automationPriorities
  if (profile.painPoints !== undefined) result.pain_points = profile.painPoints
  if (profile.ecommerceFields !== undefined) result.ecommerce_fields = profile.ecommerceFields
  if (profile.saasFields !== undefined) result.saas_fields = profile.saasFields
  if (profile.agencyFields !== undefined) result.agency_fields = profile.agencyFields
  if (profile.customIndustryDescription !== undefined) result.custom_industry_description = profile.customIndustryDescription
  if (profile.timeSavingsGoal !== undefined) result.time_savings_goal = profile.timeSavingsGoal
  if (profile.budgetRange !== undefined) result.budget_range = profile.budgetRange

  return result
}

// ============================================================================
// Business Profile Routes
// ============================================================================

/**
 * GET /business - Fetch business profile from Supabase
 */
router.get('/business', async (req: Request, res: Response) => {
  const userId = getUserId(req)

  if (!supabase) {
    return res.json({
      profile: null,
      source: 'localStorage',
      message: 'Supabase not configured',
    })
  }

  try {
    const { data, error } = await supabase
      .from('user_business_profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[UserProfile] Supabase query error:', error)
      return res.json({
        profile: null,
        source: 'localStorage',
        error: error.message,
      })
    }

    if (!data) {
      return res.json({
        profile: null,
        source: 'defaults',
      })
    }

    res.json({
      profile: businessProfileDbToApi(data as BusinessProfileRow),
      source: 'supabase',
      updatedAt: data.updated_at,
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[UserProfile] Error fetching business profile:', errorMessage)
    res.json({
      profile: null,
      source: 'localStorage',
      error: errorMessage,
    })
  }
})

/**
 * PUT /business - Upsert business profile to Supabase
 */
router.put('/business', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const { profile } = req.body

  if (!profile) {
    return res.status(400).json({ error: 'Profile object is required' })
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  try {
    const dbRow = {
      clerk_user_id: userId,
      ...businessProfileApiToDb(profile),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('user_business_profiles')
      .upsert(dbRow, { onConflict: 'clerk_user_id' })
      .select()
      .single()

    if (error) {
      console.error('[UserProfile] Supabase upsert error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({
      success: true,
      profile: businessProfileDbToApi(data as BusinessProfileRow),
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[UserProfile] Error saving business profile:', errorMessage)
    res.status(500).json({ error: errorMessage })
  }
})

// ============================================================================
// User Context Routes
// ============================================================================

/**
 * GET /context - Fetch user context from Supabase
 */
router.get('/context', async (req: Request, res: Response) => {
  const userId = getUserId(req)

  if (!supabase) {
    return res.json({
      context: null,
      source: 'localStorage',
      message: 'Supabase not configured',
    })
  }

  try {
    const { data, error } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('clerk_user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[UserProfile] Supabase context query error:', error)
      return res.json({
        context: null,
        source: 'localStorage',
        error: error.message,
      })
    }

    if (!data) {
      return res.json({
        context: null,
        source: 'defaults',
      })
    }

    res.json({
      context: data.context_data,
      source: 'supabase',
      updatedAt: data.updated_at,
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[UserProfile] Error fetching user context:', errorMessage)
    res.json({
      context: null,
      source: 'localStorage',
      error: errorMessage,
    })
  }
})

/**
 * PUT /context - Upsert user context to Supabase
 */
router.put('/context', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const { context } = req.body

  if (!context) {
    return res.status(400).json({ error: 'Context object is required' })
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  try {
    const dbRow = {
      clerk_user_id: userId,
      context_data: context,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('user_contexts')
      .upsert(dbRow, { onConflict: 'clerk_user_id' })
      .select()
      .single()

    if (error) {
      console.error('[UserProfile] Supabase context upsert error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({
      success: true,
      context: data.context_data,
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[UserProfile] Error saving user context:', errorMessage)
    res.status(500).json({ error: errorMessage })
  }
})

export default router

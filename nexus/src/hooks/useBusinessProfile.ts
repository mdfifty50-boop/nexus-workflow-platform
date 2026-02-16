/**
 * useBusinessProfile Hook
 *
 * Loads the user's business profile from localStorage (set during onboarding).
 * Provides industry, role, and business context to components that need it
 * (AI Consultancy room, Dashboard, Nexus chat brain).
 */

import { useState, useEffect, useCallback } from 'react'
import type { BusinessProfileData, Industry, PrimaryRole } from '@/components/onboarding/business-profile-types'
import { DEFAULT_BUSINESS_PROFILE } from '@/components/onboarding/business-profile-types'
import { INDUSTRY_CONFIGS } from '@/components/onboarding/industry-config'

const STORAGE_KEY = 'nexus_business_profile'
const API_BASE = '/api/user-profile'

export interface BusinessProfileContext {
  /** The full stored profile data */
  profile: BusinessProfileData
  /** Whether a profile has been completed (industry + role selected) */
  hasProfile: boolean
  /** The user's industry (null if not set) */
  industry: Industry | null
  /** The user's primary role (null if not set) */
  role: PrimaryRole | null
  /** Human-readable industry name */
  industryName: string | null
  /** Industry-specific recommended integrations */
  recommendedIntegrations: string[]
  /** Industry-specific automation priorities */
  suggestedPriorities: string[]
  /** Reload profile from storage (after onboarding completes) */
  reload: () => void
}

/**
 * Maps the onboarding industry IDs to the industry-personas IDs used by the
 * AI Consultancy. This bridges the two systems.
 */
export function mapIndustryToPersonaId(industry: Industry | null): string | null {
  if (!industry) return null

  const mapping: Record<string, string> = {
    ecommerce: 'ecommerce',
    saas: 'saas',
    agency: 'agency',
    consulting: 'consulting',
    healthcare: 'healthcare',
    finance: 'finance',
    education: 'education',
    realestate: 'realestate',
    manufacturing: 'manufacturing',
    retail: 'retail',
    nonprofit: 'nonprofit',
    other: 'other',
  }

  return mapping[industry] || null
}

export function useBusinessProfile(): BusinessProfileContext {
  const [profile, setProfile] = useState<BusinessProfileData>(DEFAULT_BUSINESS_PROFILE)

  const loadProfile = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as BusinessProfileData
        setProfile(parsed)
      }
    } catch (err) {
      console.warn('[useBusinessProfile] Failed to load profile:', err)
    }
  }, [])

  // Load from cloud on mount — cloud wins for cross-device consistency
  const loadFromCloud = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/business`, {
        headers: { 'x-clerk-user-id': localStorage.getItem('clerk_user_id') || '' },
      })
      if (!res.ok) return

      const data = await res.json()
      if (data.source === 'supabase' && data.profile) {
        const cloudProfile = { ...DEFAULT_BUSINESS_PROFILE, ...data.profile } as BusinessProfileData
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudProfile))
        setProfile(cloudProfile)
        console.log('[useBusinessProfile] Restored profile from cloud')
      }
    } catch {
      // Graceful degradation — localStorage still works
    }
  }, [])

  useEffect(() => {
    loadProfile()
    loadFromCloud()
  }, [loadProfile, loadFromCloud])

  const hasProfile = Boolean(profile.industry && profile.primaryRole)
  const industry = profile.industry
  const role = profile.primaryRole

  const industryConfig = industry ? INDUSTRY_CONFIGS[industry] : null
  const industryName = industryConfig?.name || null
  const recommendedIntegrations = industryConfig?.recommendedIntegrations || []
  const suggestedPriorities = industryConfig?.suggestedPriorities || []

  return {
    profile,
    hasProfile,
    industry,
    role,
    industryName,
    recommendedIntegrations,
    suggestedPriorities,
    reload: loadProfile,
  }
}

/**
 * Get the business profile synchronously (for non-React contexts like the AI brain).
 * Returns null if no profile is stored.
 */
export function getStoredBusinessProfile(): BusinessProfileData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as BusinessProfileData
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

/**
 * Sync the current business profile to Supabase (fire-and-forget).
 * Called after localStorage writes (onboarding, profile updates).
 */
export function syncBusinessProfileToCloud(profile: BusinessProfileData): void {
  fetch(`${API_BASE}/business`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-user-id': localStorage.getItem('clerk_user_id') || '',
    },
    body: JSON.stringify({ profile }),
  }).catch((err) => {
    console.warn('[useBusinessProfile] Cloud sync failed (non-blocking):', err)
  })
}

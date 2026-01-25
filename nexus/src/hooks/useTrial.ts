/**
 * useTrial Hook
 *
 * Manages free trial state for Nexus subscription system.
 * Provides trial lifecycle management including start, extend, convert, and cancel.
 *
 * Features:
 * - 14-day default trial period
 * - localStorage persistence with backend sync
 * - Trial expiration handling with graceful degradation
 * - Upgrade prompt triggers based on days remaining
 * - Usage metrics tracking
 *
 * Usage:
 *   const { isInTrial, trialDaysRemaining, startTrial, convertTrial } = useTrial()
 *
 *   if (isInTrial && shouldShowTrialBanner) {
 *     return <TrialBanner daysRemaining={trialDaysRemaining} onUpgrade={convertTrial} />
 *   }
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// =============================================================================
// TYPES
// =============================================================================

export type TrialStatus = 'active' | 'expired' | 'converted' | 'none'

export interface TrialInfo {
  /** Trial start timestamp (ISO string) */
  startedAt: string | null
  /** Trial end timestamp (ISO string) */
  endsAt: string | null
  /** Current trial status */
  status: TrialStatus
  /** Whether trial has been extended */
  wasExtended: boolean
  /** Total extension days added */
  extensionDays: number
  /** Conversion timestamp if converted */
  convertedAt: string | null
  /** Cancellation timestamp if canceled */
  canceledAt: string | null
}

export interface TrialUsageMetrics {
  /** Number of workflows created during trial */
  workflowsCreated: number
  /** Number of workflow executions during trial */
  workflowExecutions: number
  /** Number of integrations connected during trial */
  integrationsConnected: number
  /** Number of AI prompts used during trial */
  aiPromptsUsed: number
  /** Last activity timestamp */
  lastActiveAt: string | null
  /** Days active during trial */
  daysActive: number
}

export interface TrialState {
  /** Whether user is currently in an active trial */
  isInTrial: boolean
  /** Number of days remaining in trial (0 if not in trial) */
  trialDaysRemaining: number
  /** Trial end date (null if no trial) */
  trialEndsAt: Date | null
  /** Current trial status */
  trialStatus: TrialStatus
  /** Full trial info */
  trialInfo: TrialInfo
  /** Trial usage metrics */
  usageMetrics: TrialUsageMetrics
}

export interface TrialActions {
  /** Start a new 14-day free trial */
  startTrial: () => Promise<boolean>
  /** Extend trial by specified days (admin use) */
  extendTrial: (days: number) => Promise<boolean>
  /** Convert trial to paid subscription */
  convertTrial: () => Promise<boolean>
  /** Cancel trial without converting */
  cancelTrial: () => Promise<boolean>
  /** Refresh trial state from backend */
  refreshTrial: () => Promise<void>
  /** Track usage metric */
  trackUsage: (metric: keyof Omit<TrialUsageMetrics, 'lastActiveAt' | 'daysActive'>) => void
}

export interface TrialNotifications {
  /** Whether to show the trial banner */
  shouldShowTrialBanner: boolean
  /** Whether to show upgrade prompt (3 days or less remaining) */
  shouldShowUpgradePrompt: boolean
  /** Days until upgrade prompt shows (negative if already showing) */
  daysUntilPrompt: number
  /** Whether trial just expired (show special message) */
  trialJustExpired: boolean
}

export interface UseTrialReturn extends TrialState, TrialActions, TrialNotifications {
  /** Loading state */
  loading: boolean
  /** Error message if any */
  error: string | null
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TRIAL_DURATION_DAYS = 14
const UPGRADE_PROMPT_THRESHOLD_DAYS = 3
const STORAGE_KEY = 'nexus_trial_info'
const USAGE_STORAGE_KEY = 'nexus_trial_usage'
const TRIAL_EXPIRED_KEY = 'nexus_trial_expired_shown'

const DEFAULT_TRIAL_INFO: TrialInfo = {
  startedAt: null,
  endsAt: null,
  status: 'none',
  wasExtended: false,
  extensionDays: 0,
  convertedAt: null,
  canceledAt: null,
}

const DEFAULT_USAGE_METRICS: TrialUsageMetrics = {
  workflowsCreated: 0,
  workflowExecutions: 0,
  integrationsConnected: 0,
  aiPromptsUsed: 0,
  lastActiveAt: null,
  daysActive: 0,
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.round((date2.getTime() - date1.getTime()) / oneDay)
}

/**
 * Get storage safely
 */
function getStorage(): Storage | null {
  try {
    const testKey = '__trial_storage_test__'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return localStorage
  } catch {
    return null
  }
}

/**
 * Load trial info from localStorage
 */
function loadTrialInfo(): TrialInfo {
  const storage = getStorage()
  if (!storage) return DEFAULT_TRIAL_INFO

  try {
    const stored = storage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_TRIAL_INFO

    const parsed = JSON.parse(stored) as TrialInfo

    // Validate the parsed data
    if (!parsed || typeof parsed !== 'object') {
      return DEFAULT_TRIAL_INFO
    }

    return {
      ...DEFAULT_TRIAL_INFO,
      ...parsed,
    }
  } catch (error) {
    console.warn('[useTrial] Error loading trial info:', error)
    return DEFAULT_TRIAL_INFO
  }
}

/**
 * Save trial info to localStorage
 */
function saveTrialInfo(info: TrialInfo): void {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(info))
  } catch (error) {
    console.warn('[useTrial] Error saving trial info:', error)
  }
}

/**
 * Load usage metrics from localStorage
 */
function loadUsageMetrics(): TrialUsageMetrics {
  const storage = getStorage()
  if (!storage) return DEFAULT_USAGE_METRICS

  try {
    const stored = storage.getItem(USAGE_STORAGE_KEY)
    if (!stored) return DEFAULT_USAGE_METRICS

    const parsed = JSON.parse(stored) as TrialUsageMetrics

    if (!parsed || typeof parsed !== 'object') {
      return DEFAULT_USAGE_METRICS
    }

    return {
      ...DEFAULT_USAGE_METRICS,
      ...parsed,
    }
  } catch (error) {
    console.warn('[useTrial] Error loading usage metrics:', error)
    return DEFAULT_USAGE_METRICS
  }
}

/**
 * Save usage metrics to localStorage
 */
function saveUsageMetrics(metrics: TrialUsageMetrics): void {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(USAGE_STORAGE_KEY, JSON.stringify(metrics))
  } catch (error) {
    console.warn('[useTrial] Error saving usage metrics:', error)
  }
}

/**
 * Check if trial expired message was shown
 */
function wasTrialExpiredShown(): boolean {
  const storage = getStorage()
  if (!storage) return true

  return storage.getItem(TRIAL_EXPIRED_KEY) === 'true'
}

/**
 * Mark trial expired message as shown
 */
function markTrialExpiredShown(): void {
  const storage = getStorage()
  if (!storage) return

  storage.setItem(TRIAL_EXPIRED_KEY, 'true')
}

/**
 * Clear trial expired shown flag
 */
function clearTrialExpiredShown(): void {
  const storage = getStorage()
  if (!storage) return

  storage.removeItem(TRIAL_EXPIRED_KEY)
}

// =============================================================================
// MOCK API FUNCTIONS (Placeholder for backend integration)
// =============================================================================

/**
 * Sync trial info with backend
 * Replace with actual API calls in production
 */
async function syncTrialWithBackend(info: TrialInfo): Promise<TrialInfo> {
  // Placeholder: In production, this would POST to /api/trial/sync
  // For now, just return the local info
  return new Promise((resolve) => {
    setTimeout(() => resolve(info), 100)
  })
}

/**
 * Fetch trial info from backend
 * Replace with actual API calls in production
 */
async function fetchTrialFromBackend(): Promise<TrialInfo | null> {
  // Placeholder: In production, this would GET from /api/trial
  // For now, return null to use local storage
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), 100)
  })
}

/**
 * Start trial on backend
 */
async function startTrialOnBackend(): Promise<{ success: boolean; trialInfo?: TrialInfo }> {
  // Placeholder: In production, this would POST to /api/trial/start
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 100)
  })
}

/**
 * Extend trial on backend
 */
async function extendTrialOnBackend(days: number): Promise<{ success: boolean; trialInfo?: TrialInfo }> {
  // Placeholder: In production, this would POST to /api/trial/extend
  console.log(`[useTrial] Extending trial by ${days} days on backend`)
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 100)
  })
}

/**
 * Convert trial on backend
 */
async function convertTrialOnBackend(): Promise<{ success: boolean; redirectUrl?: string }> {
  // Placeholder: In production, this would POST to /api/trial/convert
  // and return a Stripe checkout URL
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true, redirectUrl: '/checkout?plan=pro' }), 100)
  })
}

/**
 * Cancel trial on backend
 */
async function cancelTrialOnBackend(): Promise<{ success: boolean }> {
  // Placeholder: In production, this would POST to /api/trial/cancel
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 100)
  })
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useTrial(): UseTrialReturn {
  // State
  const [trialInfo, setTrialInfo] = useState<TrialInfo>(loadTrialInfo)
  const [usageMetrics, setUsageMetrics] = useState<TrialUsageMetrics>(loadUsageMetrics)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trialJustExpired, setTrialJustExpired] = useState(false)

  // Refs for cleanup and avoiding stale closures
  const mountedRef = useRef(true)
  const lastCheckedRef = useRef<string | null>(null)

  // Calculate derived state
  const derivedState = useMemo(() => {
    const now = new Date()
    let isInTrial = false
    let trialDaysRemaining = 0
    let trialEndsAt: Date | null = null
    let trialStatus: TrialStatus = trialInfo.status

    if (trialInfo.status === 'active' && trialInfo.endsAt) {
      const endDate = new Date(trialInfo.endsAt)
      trialEndsAt = endDate

      if (endDate > now) {
        isInTrial = true
        trialDaysRemaining = daysBetween(now, endDate)
      } else {
        // Trial has expired
        trialStatus = 'expired'
      }
    }

    return {
      isInTrial,
      trialDaysRemaining,
      trialEndsAt,
      trialStatus,
    }
  }, [trialInfo])

  // Calculate notification state
  const notifications = useMemo(() => {
    const { isInTrial, trialDaysRemaining, trialStatus } = derivedState

    // Show banner if in trial
    const shouldShowTrialBanner = isInTrial

    // Show upgrade prompt when 3 days or less remaining
    const shouldShowUpgradePrompt = isInTrial && trialDaysRemaining <= UPGRADE_PROMPT_THRESHOLD_DAYS

    // Days until prompt shows
    const daysUntilPrompt = trialDaysRemaining - UPGRADE_PROMPT_THRESHOLD_DAYS

    // Check if trial just expired (and we haven't shown the message yet)
    const justExpired = trialStatus === 'expired' && !wasTrialExpiredShown()

    return {
      shouldShowTrialBanner,
      shouldShowUpgradePrompt,
      daysUntilPrompt,
      trialJustExpired: justExpired || trialJustExpired,
    }
  }, [derivedState, trialJustExpired])

  // Update trial status if expired
  useEffect(() => {
    if (derivedState.trialStatus === 'expired' && trialInfo.status === 'active') {
      // Update local state
      const updatedInfo: TrialInfo = {
        ...trialInfo,
        status: 'expired',
      }
      setTrialInfo(updatedInfo)
      saveTrialInfo(updatedInfo)

      // Check if we should show expired message
      if (!wasTrialExpiredShown()) {
        setTrialJustExpired(true)
        markTrialExpiredShown()
      }

      // Sync with backend
      syncTrialWithBackend(updatedInfo).catch(console.error)
    }
  }, [derivedState.trialStatus, trialInfo])

  // Refresh trial from backend on mount
  useEffect(() => {
    const refreshFromBackend = async () => {
      if (!mountedRef.current) return

      try {
        const backendInfo = await fetchTrialFromBackend()
        if (backendInfo && mountedRef.current) {
          setTrialInfo(backendInfo)
          saveTrialInfo(backendInfo)
        }
      } catch (err) {
        console.warn('[useTrial] Error fetching trial from backend:', err)
      }
    }

    refreshFromBackend()

    return () => {
      mountedRef.current = false
    }
  }, [])

  // Track active days
  useEffect(() => {
    if (!derivedState.isInTrial) return

    const today = new Date().toISOString().split('T')[0]

    // Only update if this is a new day
    if (lastCheckedRef.current === today) return
    lastCheckedRef.current = today

    setUsageMetrics((prev) => {
      const lastActive = prev.lastActiveAt
      const lastActiveDay = lastActive ? new Date(lastActive).toISOString().split('T')[0] : null

      // If it's a new day, increment daysActive
      const isNewDay = lastActiveDay !== today
      const updatedMetrics: TrialUsageMetrics = {
        ...prev,
        lastActiveAt: new Date().toISOString(),
        daysActive: isNewDay ? prev.daysActive + 1 : prev.daysActive,
      }

      saveUsageMetrics(updatedMetrics)
      return updatedMetrics
    })
  }, [derivedState.isInTrial])

  // =============================================================================
  // ACTIONS
  // =============================================================================

  /**
   * Start a new 14-day free trial
   */
  const startTrial = useCallback(async (): Promise<boolean> => {
    // Prevent starting if already in trial or converted
    if (trialInfo.status === 'active' || trialInfo.status === 'converted') {
      setError('Trial already started or converted')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Call backend
      const result = await startTrialOnBackend()
      if (!result.success) {
        setError('Failed to start trial')
        return false
      }

      // Calculate trial end date
      const now = new Date()
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS)

      const newTrialInfo: TrialInfo = {
        startedAt: now.toISOString(),
        endsAt: endDate.toISOString(),
        status: 'active',
        wasExtended: false,
        extensionDays: 0,
        convertedAt: null,
        canceledAt: null,
      }

      // Update state and persist
      setTrialInfo(newTrialInfo)
      saveTrialInfo(newTrialInfo)

      // Reset usage metrics
      const freshMetrics: TrialUsageMetrics = {
        ...DEFAULT_USAGE_METRICS,
        lastActiveAt: now.toISOString(),
        daysActive: 1,
      }
      setUsageMetrics(freshMetrics)
      saveUsageMetrics(freshMetrics)

      // Clear any expired message flag
      clearTrialExpiredShown()
      setTrialJustExpired(false)

      // Sync with backend
      await syncTrialWithBackend(newTrialInfo)

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start trial'
      setError(message)
      console.error('[useTrial] Error starting trial:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [trialInfo.status])

  /**
   * Extend trial by specified days (admin use)
   */
  const extendTrial = useCallback(async (days: number): Promise<boolean> => {
    if (trialInfo.status !== 'active' && trialInfo.status !== 'expired') {
      setError('No active trial to extend')
      return false
    }

    if (days <= 0 || days > 30) {
      setError('Extension must be between 1 and 30 days')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Call backend
      const result = await extendTrialOnBackend(days)
      if (!result.success) {
        setError('Failed to extend trial')
        return false
      }

      // Calculate new end date
      const currentEnd = trialInfo.endsAt ? new Date(trialInfo.endsAt) : new Date()
      const now = new Date()
      const baseDate = currentEnd > now ? currentEnd : now
      const newEndDate = new Date(baseDate)
      newEndDate.setDate(newEndDate.getDate() + days)

      const updatedTrialInfo: TrialInfo = {
        ...trialInfo,
        endsAt: newEndDate.toISOString(),
        status: 'active',
        wasExtended: true,
        extensionDays: trialInfo.extensionDays + days,
      }

      // Update state and persist
      setTrialInfo(updatedTrialInfo)
      saveTrialInfo(updatedTrialInfo)

      // Clear expired flag if was expired
      if (trialInfo.status === 'expired') {
        clearTrialExpiredShown()
        setTrialJustExpired(false)
      }

      // Sync with backend
      await syncTrialWithBackend(updatedTrialInfo)

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extend trial'
      setError(message)
      console.error('[useTrial] Error extending trial:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [trialInfo])

  /**
   * Convert trial to paid subscription
   */
  const convertTrial = useCallback(async (): Promise<boolean> => {
    if (trialInfo.status !== 'active' && trialInfo.status !== 'expired') {
      setError('No trial to convert')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Call backend to get checkout URL
      const result = await convertTrialOnBackend()
      if (!result.success) {
        setError('Failed to initiate conversion')
        return false
      }

      // Update trial info
      const updatedTrialInfo: TrialInfo = {
        ...trialInfo,
        status: 'converted',
        convertedAt: new Date().toISOString(),
      }

      // Update state and persist
      setTrialInfo(updatedTrialInfo)
      saveTrialInfo(updatedTrialInfo)

      // Sync with backend
      await syncTrialWithBackend(updatedTrialInfo)

      // Redirect to checkout if URL provided
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to convert trial'
      setError(message)
      console.error('[useTrial] Error converting trial:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [trialInfo])

  /**
   * Cancel trial without converting
   */
  const cancelTrial = useCallback(async (): Promise<boolean> => {
    if (trialInfo.status !== 'active') {
      setError('No active trial to cancel')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Call backend
      const result = await cancelTrialOnBackend()
      if (!result.success) {
        setError('Failed to cancel trial')
        return false
      }

      const updatedTrialInfo: TrialInfo = {
        ...trialInfo,
        status: 'expired',
        canceledAt: new Date().toISOString(),
      }

      // Update state and persist
      setTrialInfo(updatedTrialInfo)
      saveTrialInfo(updatedTrialInfo)

      // Sync with backend
      await syncTrialWithBackend(updatedTrialInfo)

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel trial'
      setError(message)
      console.error('[useTrial] Error canceling trial:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [trialInfo])

  /**
   * Refresh trial state from backend
   */
  const refreshTrial = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const backendInfo = await fetchTrialFromBackend()
      if (backendInfo) {
        setTrialInfo(backendInfo)
        saveTrialInfo(backendInfo)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh trial'
      setError(message)
      console.error('[useTrial] Error refreshing trial:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Track usage metric
   */
  const trackUsage = useCallback(
    (metric: keyof Omit<TrialUsageMetrics, 'lastActiveAt' | 'daysActive'>): void => {
      if (!derivedState.isInTrial) return

      setUsageMetrics((prev) => {
        const updatedMetrics: TrialUsageMetrics = {
          ...prev,
          [metric]: prev[metric] + 1,
          lastActiveAt: new Date().toISOString(),
        }
        saveUsageMetrics(updatedMetrics)
        return updatedMetrics
      })
    },
    [derivedState.isInTrial]
  )

  // =============================================================================
  // RETURN VALUE
  // =============================================================================

  return {
    // State
    isInTrial: derivedState.isInTrial,
    trialDaysRemaining: derivedState.trialDaysRemaining,
    trialEndsAt: derivedState.trialEndsAt,
    trialStatus: derivedState.trialStatus,
    trialInfo,
    usageMetrics,

    // Actions
    startTrial,
    extendTrial,
    convertTrial,
    cancelTrial,
    refreshTrial,
    trackUsage,

    // Notifications
    shouldShowTrialBanner: notifications.shouldShowTrialBanner,
    shouldShowUpgradePrompt: notifications.shouldShowUpgradePrompt,
    daysUntilPrompt: notifications.daysUntilPrompt,
    trialJustExpired: notifications.trialJustExpired,

    // Loading/Error
    loading,
    error,
  }
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to check if user can start a trial
 */
export function useCanStartTrial(): boolean {
  const { trialStatus } = useTrial()
  return trialStatus === 'none' || trialStatus === 'expired'
}

/**
 * Hook to get trial progress percentage
 */
export function useTrialProgress(): number {
  const { isInTrial, trialDaysRemaining, trialInfo } = useTrial()

  if (!isInTrial || !trialInfo.startedAt || !trialInfo.endsAt) {
    return 0
  }

  const totalDays = daysBetween(
    new Date(trialInfo.startedAt),
    new Date(trialInfo.endsAt)
  )

  if (totalDays <= 0) return 100

  const daysUsed = totalDays - trialDaysRemaining
  return Math.min(100, Math.max(0, (daysUsed / totalDays) * 100))
}

/**
 * Hook to get trial usage summary
 */
export function useTrialUsageSummary(): {
  totalActions: number
  mostUsedFeature: string
  engagementLevel: 'low' | 'medium' | 'high'
} {
  const { usageMetrics, trialInfo } = useTrial()

  const totalActions =
    usageMetrics.workflowsCreated +
    usageMetrics.workflowExecutions +
    usageMetrics.integrationsConnected +
    usageMetrics.aiPromptsUsed

  // Determine most used feature
  const featureUsage = [
    { name: 'workflows', count: usageMetrics.workflowsCreated + usageMetrics.workflowExecutions },
    { name: 'integrations', count: usageMetrics.integrationsConnected },
    { name: 'ai-prompts', count: usageMetrics.aiPromptsUsed },
  ]
  const mostUsedFeature = featureUsage.sort((a, b) => b.count - a.count)[0]?.name || 'none'

  // Calculate engagement level based on activity
  let engagementLevel: 'low' | 'medium' | 'high' = 'low'

  if (trialInfo.status === 'active') {
    const daysActive = usageMetrics.daysActive
    const actionsPerDay = daysActive > 0 ? totalActions / daysActive : 0

    if (actionsPerDay >= 5 && daysActive >= 3) {
      engagementLevel = 'high'
    } else if (actionsPerDay >= 2 || daysActive >= 2) {
      engagementLevel = 'medium'
    }
  }

  return {
    totalActions,
    mostUsedFeature,
    engagementLevel,
  }
}

export default useTrial

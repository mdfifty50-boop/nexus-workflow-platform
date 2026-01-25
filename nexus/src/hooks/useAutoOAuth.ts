/**
 * useAutoOAuth Hook
 *
 * React hook for seamless OAuth authentication based on user email.
 * Automatically suggests and initiates OAuth connections for services
 * that match the user's email domain.
 *
 * Usage:
 * ```tsx
 * const { suggestions, initiateConnection, processAutoOAuth } = useAutoOAuth()
 *
 * // Get suggestions based on email
 * useEffect(() => {
 *   if (userEmail) {
 *     loadSuggestions(userEmail)
 *   }
 * }, [userEmail])
 *
 * // Initiate connection
 * const handleConnect = async (serviceId: string) => {
 *   const result = await initiateConnection(serviceId)
 *   if (result.authUrl) {
 *     window.open(result.authUrl, '_blank')
 *   }
 * }
 * ```
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  autoOAuthManager,
  getAutoOAuthSuggestions,
  processOnboardingAutoOAuth,
  handleAutoOAuthCallback,
  clearAutoOAuthCache,
  type ServiceMatch,
  type AutoOAuthResult,
} from '@/lib/workflow-engine/auto-oauth'
import { composioExecutor } from '@/lib/workflow-engine/composio-executor'

export interface UseAutoOAuthOptions {
  /** Auto-fetch suggestions when email changes */
  autoFetch?: boolean
  /** Auto-initiate high-confidence connections */
  autoInitiate?: boolean
  /** Callback URL after OAuth completion */
  callbackUrl?: string
  /** User's role/business type for role-based suggestions */
  role?: string
}

export interface UseAutoOAuthReturn {
  /** Service suggestions based on user email */
  suggestions: ServiceMatch[]
  /** Loading state */
  loading: boolean
  /** Error message if any */
  error: string | null
  /** Services that are already connected */
  connectedServices: string[]
  /** Services that have pending OAuth */
  pendingServices: string[]
  /** Load suggestions for an email */
  loadSuggestions: (email: string) => Promise<void>
  /** Initiate OAuth connection for a service */
  initiateConnection: (serviceId: string, callbackUrl?: string) => Promise<{ authUrl?: string; error?: string }>
  /** Process full auto-OAuth flow (for onboarding) */
  processAutoOAuth: (email: string, options?: { autoInitiate?: boolean; role?: string }) => Promise<AutoOAuthResult>
  /** Handle OAuth callback (after redirect) */
  handleCallback: (serviceId: string) => Promise<boolean>
  /** Refresh connection status for a service */
  refreshConnection: (serviceId: string) => Promise<boolean>
  /** Clear all cached data */
  clearCache: () => void
}

export function useAutoOAuth(options: UseAutoOAuthOptions = {}): UseAutoOAuthReturn {
  const { autoFetch = true, autoInitiate = false, callbackUrl, role } = options
  const { userId, userProfile } = useAuth()

  const [suggestions, setSuggestions] = useState<ServiceMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectedServices, setConnectedServices] = useState<string[]>([])
  const [pendingServices, setPendingServices] = useState<string[]>([])

  // Get email from user profile
  const userEmail = userProfile?.email

  /**
   * Load suggestions for an email
   */
  const loadSuggestions = useCallback(async (email: string) => {
    if (!email) {
      setSuggestions([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const results = await getAutoOAuthSuggestions(email)
      setSuggestions(results)

      // Update connected services
      const connected = results.filter(s => s.isConnected).map(s => s.serviceId)
      setConnectedServices(connected)

      // Set user context on executor for seamless execution
      if (userId) {
        composioExecutor.setUserContext(userId, email)
      }
    } catch (err) {
      console.error('[useAutoOAuth] Failed to load suggestions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }, [userId])

  /**
   * Initiate OAuth connection for a service
   */
  const initiateConnection = useCallback(async (
    serviceId: string,
    customCallbackUrl?: string
  ): Promise<{ authUrl?: string; error?: string }> => {
    if (!userId) {
      return { error: 'User not authenticated' }
    }

    setError(null)
    setPendingServices(prev => [...prev, serviceId])

    try {
      const result = await autoOAuthManager.initiateConnection(
        userId,
        serviceId,
        customCallbackUrl || callbackUrl
      )

      if (result.authUrl) {
        // Update suggestion with auth URL
        setSuggestions(prev =>
          prev.map(s =>
            s.serviceId === serviceId ? { ...s, authUrl: result.authUrl } : s
          )
        )
      } else if (result.error) {
        setPendingServices(prev => prev.filter(id => id !== serviceId))
        setError(result.error)
      }

      return result
    } catch (err) {
      console.error('[useAutoOAuth] Failed to initiate connection:', err)
      const errorMsg = err instanceof Error ? err.message : 'Connection failed'
      setError(errorMsg)
      setPendingServices(prev => prev.filter(id => id !== serviceId))
      return { error: errorMsg }
    }
  }, [userId, callbackUrl])

  /**
   * Process full auto-OAuth flow (for onboarding)
   */
  const processAutoOAuthFlow = useCallback(async (
    email: string,
    flowOptions?: { autoInitiate?: boolean; role?: string }
  ): Promise<AutoOAuthResult> => {
    if (!userId) {
      return {
        success: false,
        matchedServices: [],
        initiatedServices: [],
        alreadyConnected: [],
        errors: [{ service: '', error: 'User not authenticated' }],
        checkedAt: new Date().toISOString(),
      }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await processOnboardingAutoOAuth(email, userId, {
        autoInitiate: flowOptions?.autoInitiate ?? autoInitiate,
        callbackUrl,
        role: flowOptions?.role ?? role,
      })

      // Update state based on result
      setSuggestions(result.matchedServices)
      setConnectedServices(result.alreadyConnected)
      setPendingServices(result.initiatedServices)

      // Set user context on executor
      composioExecutor.setUserContext(userId, email)

      if (result.errors.length > 0) {
        setError(result.errors.map(e => e.error).join(', '))
      }

      return result
    } catch (err) {
      console.error('[useAutoOAuth] Failed to process auto-OAuth:', err)
      const errorMsg = err instanceof Error ? err.message : 'Auto-OAuth failed'
      setError(errorMsg)
      return {
        success: false,
        matchedServices: [],
        initiatedServices: [],
        alreadyConnected: [],
        errors: [{ service: '', error: errorMsg }],
        checkedAt: new Date().toISOString(),
      }
    } finally {
      setLoading(false)
    }
  }, [userId, autoInitiate, callbackUrl, role])

  /**
   * Handle OAuth callback (after redirect)
   */
  const handleCallback = useCallback(async (serviceId: string): Promise<boolean> => {
    if (!userId) {
      return false
    }

    try {
      const status = await handleAutoOAuthCallback(serviceId, userId)

      if (status.connected) {
        // Update connected services
        setConnectedServices(prev => [...new Set([...prev, serviceId])])
        setPendingServices(prev => prev.filter(id => id !== serviceId))

        // Update suggestions
        setSuggestions(prev =>
          prev.map(s =>
            s.serviceId === serviceId ? { ...s, isConnected: true } : s
          )
        )

        return true
      }

      return false
    } catch (err) {
      console.error('[useAutoOAuth] Failed to handle callback:', err)
      setError(err instanceof Error ? err.message : 'Callback handling failed')
      return false
    }
  }, [userId])

  /**
   * Refresh connection status for a service
   */
  const refreshConnection = useCallback(async (serviceId: string): Promise<boolean> => {
    try {
      clearAutoOAuthCache(serviceId)

      const statuses = await autoOAuthManager['checkConnections']([serviceId])
      const status = statuses.get(serviceId)

      if (status?.connected) {
        setConnectedServices(prev => [...new Set([...prev, serviceId])])
        setSuggestions(prev =>
          prev.map(s =>
            s.serviceId === serviceId ? { ...s, isConnected: true } : s
          )
        )
        return true
      }

      return false
    } catch (err) {
      console.error('[useAutoOAuth] Failed to refresh connection:', err)
      return false
    }
  }, [])

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(() => {
    clearAutoOAuthCache()
    setSuggestions([])
    setConnectedServices([])
    setPendingServices([])
    setError(null)
  }, [])

  // Auto-fetch suggestions when email changes
  useEffect(() => {
    if (autoFetch && userEmail) {
      loadSuggestions(userEmail)
    }
  }, [autoFetch, userEmail, loadSuggestions])

  return {
    suggestions,
    loading,
    error,
    connectedServices,
    pendingServices,
    loadSuggestions,
    initiateConnection,
    processAutoOAuth: processAutoOAuthFlow,
    handleCallback,
    refreshConnection,
    clearCache,
  }
}

/**
 * Hook to check if a specific service is connected
 */
export function useServiceConnection(serviceId: string) {
  const { connectedServices, refreshConnection, initiateConnection } = useAutoOAuth({ autoFetch: false })

  const isConnected = connectedServices.includes(serviceId)

  const connect = useCallback(async (callbackUrl?: string) => {
    return initiateConnection(serviceId, callbackUrl)
  }, [serviceId, initiateConnection])

  const refresh = useCallback(async () => {
    return refreshConnection(serviceId)
  }, [serviceId, refreshConnection])

  return {
    isConnected,
    connect,
    refresh,
  }
}

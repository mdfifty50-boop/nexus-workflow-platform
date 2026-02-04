/**
 * useWhatsAppWeb - React hook for WhatsApp Web integration
 *
 * Provides real-time QR code updates via SSE and session management.
 *
 * Usage:
 * ```tsx
 * const {
 *   session,
 *   qrCode,
 *   isConnected,
 *   isLoading,
 *   error,
 *   connect,
 *   disconnect,
 *   sendMessage
 * } = useWhatsAppWeb()
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export type SessionState =
  | 'initializing'
  | 'qr_pending'
  | 'code_pending'
  | 'authenticating'
  | 'ready'
  | 'disconnected'
  | 'destroyed'
  | 'error'
  | null

export interface WhatsAppSession {
  id: string
  state: SessionState
  phoneNumber: string | null
  pushName: string | null
  lastActivity: string
  createdAt: string
  isConnected: boolean
  error?: string | null
}

export interface UseWhatsAppWebReturn {
  // State
  session: WhatsAppSession | null
  qrCode: string | null
  pairingCode: string | null
  state: SessionState
  isConnected: boolean
  isLoading: boolean
  error: string | null

  // Actions
  connect: () => Promise<void>
  disconnect: (logout?: boolean) => Promise<void>
  sendMessage: (to: string, message: string) => Promise<{ success: boolean; error?: string }>
  requestPairingCode: (phoneNumber: string) => Promise<{ success: boolean; code?: string; error?: string }>
  refreshSession: () => Promise<void>
}

const API_BASE = '/api/whatsapp-web'

export function useWhatsAppWeb(): UseWhatsAppWebReturn {
  const [session, setSession] = useState<WhatsAppSession | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [state, setState] = useState<SessionState>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isConnected = state === 'ready'

  /**
   * Clean up SSE connection
   */
  const cleanupSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  /**
   * Connect to SSE for real-time updates
   */
  const connectSSE = useCallback((sessionId: string) => {
    cleanupSSE()

    const eventSource = new EventSource(`${API_BASE}/qr/${sessionId}`)
    eventSourceRef.current = eventSource

    eventSource.addEventListener('qr', (event) => {
      try {
        const data = JSON.parse(event.data)
        setQrCode(data.qrCode)
        setState('qr_pending')
        setError(null)
      } catch (e) {
        console.error('[useWhatsAppWeb] Error parsing QR event:', e)
      }
    })

    eventSource.addEventListener('pairingCode', (event) => {
      try {
        const data = JSON.parse(event.data)
        setPairingCode(data.code)
        setState('code_pending')
        setError(null)
      } catch (e) {
        console.error('[useWhatsAppWeb] Error parsing pairing code event:', e)
      }
    })

    eventSource.addEventListener('authenticated', () => {
      setQrCode(null)
      setPairingCode(null)
      setState('authenticating')
    })

    eventSource.addEventListener('ready', (event) => {
      try {
        const data = JSON.parse(event.data)
        setSession(prev => prev ? {
          ...prev,
          state: 'ready',
          phoneNumber: data.phoneNumber,
          pushName: data.pushName,
          isConnected: true,
        } : null)
        setState('ready')
        setQrCode(null)
        setPairingCode(null)
        setError(null)
      } catch (e) {
        console.error('[useWhatsAppWeb] Error parsing ready event:', e)
      }
    })

    eventSource.addEventListener('state', (event) => {
      try {
        const data = JSON.parse(event.data)
        setState(data.state)
        if (data.state === 'error') {
          setError(data.error || 'Unknown error')
        }
      } catch (e) {
        console.error('[useWhatsAppWeb] Error parsing state event:', e)
      }
    })

    eventSource.addEventListener('error', (event) => {
      try {
        // Check if it's an SSE error event (no data) or our custom error
        if (event instanceof MessageEvent && event.data) {
          const data = JSON.parse(event.data)
          setError(data.error)
          setState('error')
        }
      } catch (e) {
        // SSE connection error, will auto-reconnect
        console.warn('[useWhatsAppWeb] SSE connection error, reconnecting...')
      }
    })

    eventSource.addEventListener('disconnected', (event) => {
      try {
        const data = JSON.parse(event.data)
        setState('disconnected')
        setSession(prev => prev ? { ...prev, state: 'disconnected', isConnected: false } : null)
        console.log('[useWhatsAppWeb] Disconnected:', data.reason)
      } catch (e) {
        console.error('[useWhatsAppWeb] Error parsing disconnected event:', e)
      }
    })

    eventSource.onerror = () => {
      // SSE will auto-reconnect, but log for debugging
      console.warn('[useWhatsAppWeb] SSE error, browser will auto-reconnect')
    }
  }, [cleanupSSE])

  /**
   * Check for existing session on mount
   */
  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/my-session`)
      const data = await response.json()

      if (data.success && data.session) {
        setSession(data.session)
        setState(data.session.state)

        // Connect to SSE if session is active
        if (data.session.state !== 'destroyed' && data.session.state !== 'error') {
          connectSSE(data.session.id)
        }
      } else {
        setSession(null)
        setState(null)
      }
    } catch (e) {
      console.error('[useWhatsAppWeb] Error refreshing session:', e)
    }
  }, [connectSSE])

  /**
   * Create a new WhatsApp session
   */
  const connect = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setQrCode(null)

    try {
      const response = await fetch(`${API_BASE}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create session')
      }

      setSession({
        id: data.session.id,
        state: data.session.state,
        phoneNumber: data.session.phoneNumber,
        pushName: null,
        lastActivity: new Date().toISOString(),
        createdAt: data.session.createdAt,
        isConnected: false,
      })
      setState(data.session.state)

      // Connect to SSE for real-time updates
      connectSSE(data.session.id)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to connect'
      setError(message)
      setState('error')
    } finally {
      setIsLoading(false)
    }
  }, [connectSSE])

  /**
   * Disconnect and optionally logout
   */
  const disconnect = useCallback(async (logout = false) => {
    if (!session) return

    setIsLoading(true)
    cleanupSSE()

    try {
      const response = await fetch(
        `${API_BASE}/session/${session.id}?logout=${logout}`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to disconnect')
      }

      setSession(null)
      setState(null)
      setQrCode(null)
      setError(null)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to disconnect'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [session, cleanupSSE])

  /**
   * Send a WhatsApp message
   */
  const sendMessage = useCallback(async (
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!session || !isConnected) {
      return { success: false, error: 'Not connected' }
    }

    try {
      const response = await fetch(`${API_BASE}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          to,
          message,
        }),
      })

      const data = await response.json()
      return { success: data.success, error: data.error }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to send message'
      return { success: false, error: message }
    }
  }, [session, isConnected])

  /**
   * Request a pairing code for mobile users who can't scan QR
   */
  const requestPairingCode = useCallback(async (
    phoneNumber: string
  ): Promise<{ success: boolean; code?: string; error?: string }> => {
    if (!session) {
      return { success: false, error: 'No session. Please connect first.' }
    }

    try {
      const response = await fetch(`${API_BASE}/pairing-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          phoneNumber,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPairingCode(data.code)
        setState('code_pending')
        return { success: true, code: data.code }
      } else {
        return { success: false, error: data.error }
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to get pairing code'
      return { success: false, error: errorMsg }
    }
  }, [session])

  // Check for existing session on mount
  useEffect(() => {
    refreshSession()

    return () => {
      cleanupSSE()
    }
  }, [refreshSession, cleanupSSE])

  return {
    session,
    qrCode,
    pairingCode,
    state,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    sendMessage,
    requestPairingCode,
    refreshSession,
  }
}

export default useWhatsAppWeb

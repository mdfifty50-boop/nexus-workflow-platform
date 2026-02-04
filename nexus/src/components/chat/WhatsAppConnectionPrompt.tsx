/**
 * WhatsAppConnectionPrompt - Embedded connection UI for workflow cards
 *
 * Shows QR code (desktop) or pairing code (mobile) inline within the
 * WorkflowPreviewCard when a workflow requires WhatsApp connection.
 */

import React from 'react'
import { cn } from '@/lib/utils'
import {
  MessageCircle,
  Smartphone,
  QrCode,
  CheckCircle2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface WhatsAppConnectionPromptProps {
  onConnected: () => void
  onSkip?: () => void
  className?: string
}

type ConnectionStatus = 'idle' | 'initializing' | 'qr_pending' | 'pairing_pending' | 'connected' | 'error'

interface ConnectionState {
  status: ConnectionStatus
  qrCode?: string
  pairingCode?: string
  phoneNumber?: string
  error?: string
}

// Device detection
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|Android|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function WhatsAppConnectionPrompt({
  onConnected,
  onSkip,
  className,
}: WhatsAppConnectionPromptProps) {
  const [isMobile] = React.useState(() => isMobileDevice())
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [connection, setConnection] = React.useState<ConnectionState>({ status: 'idle' })
  const [copied, setCopied] = React.useState(false)
  const [expiresIn, setExpiresIn] = React.useState(180) // 3 minutes for pairing code
  const pollRef = React.useRef<NodeJS.Timeout | null>(null)

  // Get user ID (simplified - in production would come from auth context)
  const getUserId = () => {
    // Check localStorage for user ID or generate session ID
    let userId = localStorage.getItem('nexus_user_id')
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      localStorage.setItem('nexus_user_id', userId)
    }
    return userId
  }

  // Session ID ref to track current session
  const sessionIdRef = React.useRef<string | null>(null)
  const eventSourceRef = React.useRef<EventSource | null>(null)

  // Check current WhatsApp status using new whatsapp-web.js API
  const checkStatus = React.useCallback(async () => {
    try {
      const userId = getUserId()
      const response = await fetch(`/api/whatsapp-web/sessions`, {
        headers: { 'x-user-id': userId },
      })
      const data = await response.json()

      if (data.success && data.sessions && data.sessions.length > 0) {
        // Find an active/ready session
        const activeSession = data.sessions.find((s: any) => s.state === 'ready')
        if (activeSession) {
          setConnection({
            status: 'connected',
            phoneNumber: activeSession.phoneNumber,
          })
          sessionIdRef.current = activeSession.id
          return true
        }
        // Check for pending sessions
        const pendingSession = data.sessions.find((s: any) =>
          s.state === 'qr_pending' || s.state === 'code_pending' || s.state === 'initializing'
        )
        if (pendingSession) {
          sessionIdRef.current = pendingSession.id
        }
      }
      return false
    } catch (error) {
      console.error('WhatsApp status check failed:', error)
      return false
    }
  }, [])

  // Ref to store pending pairing request
  const pendingPairingRef = React.useRef<{ phone: string } | null>(null)

  // Start polling for status updates (defined first as it's needed by other callbacks)
  const startPolling = React.useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      const isConnected = await checkStatus()
      if (isConnected) {
        if (pollRef.current) clearInterval(pollRef.current)
        onConnected()
      }
    }, 2000) // Poll every 2 seconds
  }, [checkStatus, onConnected])

  // @NEXUS-FIX-085: Request pairing code (called after client is ready) - DO NOT REMOVE
  const requestPairingCode = React.useCallback(async (phone: string) => {
    const userId = getUserId()
    try {
      const response = await fetch('/api/whatsapp-web/pairing-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          phoneNumber: phone.replace(/[^0-9]/g, ''),
        }),
      })
      const data = await response.json()

      if (data.success && data.pairingCode) {
        setConnection({
          status: 'pairing_pending',
          pairingCode: data.pairingCode,
          phoneNumber: phone,
        })
        setExpiresIn(180)
        startPolling()
      } else {
        setConnection({
          status: 'error',
          error: data.error || 'Failed to get pairing code',
        })
      }
    } catch (error: any) {
      setConnection({
        status: 'error',
        error: error.message || 'Failed to get pairing code',
      })
    }
  }, [startPolling])

  // Start QR code SSE stream
  const startQRStream = React.useCallback(() => {
    if (!sessionIdRef.current) return

    // Close existing stream
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(`/api/whatsapp-web/qr/${sessionIdRef.current}`)
    eventSourceRef.current = eventSource

    eventSource.addEventListener('qr', (event) => {
      const data = JSON.parse(event.data)

      // @NEXUS-FIX-085: If there's a pending pairing request, request pairing code now that client is ready
      if (pendingPairingRef.current) {
        const phone = pendingPairingRef.current.phone
        pendingPairingRef.current = null
        console.log('[WhatsApp] Client ready, requesting pairing code for', phone)
        requestPairingCode(phone)
        return // Don't show QR for pairing flow
      }

      if (data.qrCode) {
        setConnection({
          status: 'qr_pending',
          qrCode: data.qrCode,
        })
      }
    })

    eventSource.addEventListener('state', (event) => {
      const data = JSON.parse(event.data)
      if (data.state === 'ready') {
        setConnection({
          status: 'connected',
          phoneNumber: data.phoneNumber,
        })
        eventSource.close()
        onConnected()
      } else if (data.state === 'error') {
        setConnection({
          status: 'error',
          error: data.error || 'Connection failed',
        })
        eventSource.close()
      }
    })

    // @NEXUS-FIX-085: Listen for custom 'error' event from server - DO NOT REMOVE
    // The server sends a separate 'error' event with the actual error message
    // This is different from the browser's onerror (network-level errors)
    eventSource.addEventListener('error', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data)
        console.error('[WhatsApp SSE] Server error event:', data.error)
        setConnection({
          status: 'error',
          error: data.error || 'WhatsApp connection failed',
        })
        eventSource.close()
      } catch {
        // If we can't parse the error data, it might be a browser error
        console.error('[WhatsApp SSE] Error event parse failed')
      }
    })

    eventSource.onerror = () => {
      console.error('QR SSE connection error')
      // Don't immediately show error, try polling instead
      startPolling()
    }
  }, [onConnected, requestPairingCode, startPolling])

  // Initialize connection using new whatsapp-web.js API
  // @NEXUS-FIX-085: Fixed timing issue - pairing code now waits for client to be ready - DO NOT REMOVE
  const initConnection = React.useCallback(async (method: 'qr' | 'pairing', phone?: string) => {
    setConnection({ status: 'initializing' })

    try {
      const userId = getUserId()

      // First, create a session if we don't have one
      if (!sessionIdRef.current) {
        const sessionResponse = await fetch('/api/whatsapp-web/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
        })
        const sessionData = await sessionResponse.json()
        if (!sessionData.success) {
          throw new Error(sessionData.error || 'Failed to create session')
        }
        sessionIdRef.current = sessionData.session.id
      }

      if (method === 'pairing' && phone) {
        // @NEXUS-FIX-085: For pairing code, we need to wait for the client to be ready
        // Store the phone number and start QR stream - when client is ready, request pairing code
        pendingPairingRef.current = { phone }
        startQRStream()
      } else {
        // Start QR code SSE stream
        startQRStream()
      }
    } catch (error: any) {
      setConnection({
        status: 'error',
        error: error.message || 'Connection failed',
      })
    }
  }, [startQRStream])

  // Countdown timer for pairing code
  React.useEffect(() => {
    if (connection.status === 'pairing_pending' && expiresIn > 0) {
      const timer = setTimeout(() => setExpiresIn((prev) => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [connection.status, expiresIn])

  // Cleanup polling and SSE on unmount
  React.useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (eventSourceRef.current) eventSourceRef.current.close()
    }
  }, [])

  // Check initial status on mount
  React.useEffect(() => {
    checkStatus().then((isConnected) => {
      if (isConnected) onConnected()
    })
  }, [checkStatus, onConnected])

  // Copy pairing code to clipboard
  const copyPairingCode = () => {
    if (connection.pairingCode) {
      navigator.clipboard.writeText(connection.pairingCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Format pairing code with dashes for readability
  const formatPairingCode = (code: string) => {
    // Format as XXXX-XXXX
    if (code.length === 8) {
      return `${code.slice(0, 4)}-${code.slice(4)}`
    }
    return code
  }

  // Render based on current state
  const renderContent = () => {
    switch (connection.status) {
      case 'idle':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">Connect WhatsApp</h4>
                <p className="text-xs text-slate-400">
                  Link your personal WhatsApp to send messages
                </p>
              </div>
            </div>

            {isMobile ? (
              // Mobile: Enter phone number for pairing code
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Enter your WhatsApp phone number</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+965 9XXX XXXX"
                    className="flex-1 bg-slate-800 border-slate-700"
                  />
                  <Button
                    onClick={() => initConnection('pairing', phoneNumber)}
                    disabled={!phoneNumber.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Get Code
                  </Button>
                </div>
              </div>
            ) : (
              // Desktop: Offer QR code option
              <Button
                onClick={() => initConnection('qr')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Show QR Code
              </Button>
            )}

            {onSkip && (
              <button
                onClick={onSkip}
                className="text-xs text-slate-500 hover:text-slate-400 mt-2"
              >
                Skip for now
              </button>
            )}
          </div>
        )

      case 'initializing':
        return (
          <div className="flex flex-col items-center py-4 space-y-3">
            <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
            <p className="text-sm text-slate-400">Preparing connection...</p>
          </div>
        )

      case 'qr_pending':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <QrCode className="w-4 h-4" />
              <span>Scan with WhatsApp</span>
            </div>

            {connection.qrCode ? (
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-lg">
                  <img
                    src={connection.qrCode}
                    alt="WhatsApp QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
              </div>
            )}

            <div className="text-xs text-center text-slate-400 space-y-1">
              <p>1. Open WhatsApp on your phone</p>
              <p>2. Tap Settings → Linked Devices</p>
              <p>3. Tap "Link a Device" and scan</p>
            </div>

            <Button
              variant="ghost"
              onClick={() => initConnection('qr')}
              className="w-full text-slate-400"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh QR Code
            </Button>
          </div>
        )

      case 'pairing_pending':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Smartphone className="w-4 h-4" />
              <span>Enter this code in WhatsApp</span>
            </div>

            {/* Large pairing code display */}
            <div
              className="p-4 bg-slate-800 rounded-lg text-center cursor-pointer group"
              onClick={copyPairingCode}
            >
              <div className="text-3xl font-mono font-bold text-green-400 tracking-wider">
                {connection.pairingCode ? formatPairingCode(connection.pairingCode) : '----'}
              </div>
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-slate-400 group-hover:text-slate-300">
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Click to copy</span>
                  </>
                )}
              </div>
            </div>

            {/* Countdown */}
            <div className="text-center">
              <span className="text-xs text-slate-400">
                Expires in{' '}
                <span className={cn(expiresIn < 30 ? 'text-amber-400' : 'text-slate-300')}>
                  {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, '0')}
                </span>
              </span>
            </div>

            {/* Instructions */}
            <div className="text-xs text-slate-400 space-y-1">
              <p>1. Open WhatsApp on your phone</p>
              <p>2. Go to Settings → Linked Devices</p>
              <p>3. Tap "Link a Device"</p>
              <p>4. Tap "Link with phone number instead"</p>
              <p>5. Enter the code above</p>
            </div>

            {expiresIn <= 0 && (
              <Button
                onClick={() => initConnection('pairing', connection.phoneNumber)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Get New Code
              </Button>
            )}
          </div>
        )

      case 'connected':
        return (
          <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-400">WhatsApp Connected</p>
              {connection.phoneNumber && (
                <p className="text-xs text-slate-400">{connection.phoneNumber}</p>
              )}
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-400">Connection Failed</p>
                <p className="text-xs text-slate-400">{connection.error}</p>
              </div>
            </div>
            <Button
              onClick={() => setConnection({ status: 'idle' })}
              className="w-full"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        )
    }
  }

  return (
    <div className={cn('p-4 bg-slate-900/50 rounded-lg border border-green-500/20', className)}>
      {renderContent()}
    </div>
  )
}

export default WhatsAppConnectionPrompt

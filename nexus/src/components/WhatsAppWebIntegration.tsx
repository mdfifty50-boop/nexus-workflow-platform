/**
 * WhatsAppWebIntegration - Production-grade WhatsApp Web integration
 *
 * Features:
 * - QR code for desktop users
 * - Pairing code for mobile users (auto-detected)
 * - Real-time connection status
 * - Send message interface
 * - Responsive design
 */

import { useState, useEffect, useMemo } from 'react'
import { useWhatsAppWeb } from '@/hooks/useWhatsAppWeb'
import type { SessionState } from '@/hooks/useWhatsAppWeb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Detect if user is on a mobile device
 * Uses multiple signals for accurate detection
 */
function useIsMobile(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined') return false

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || ''

    // Check for mobile user agents
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i
    const isMobileUserAgent = mobileRegex.test(userAgent)

    // Check screen width (tablets under 1024px, phones under 768px)
    const isSmallScreen = window.innerWidth < 768

    // Check for touch capability (most mobile devices have touch)
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    // Consider mobile if: mobile user agent OR (small screen AND touch)
    return isMobileUserAgent || (isSmallScreen && hasTouch)
  }, [])
}

interface WhatsAppWebIntegrationProps {
  className?: string
  onConnected?: (phoneNumber: string) => void
  onDisconnected?: () => void
  onMessage?: (message: { from: string; body: string }) => void
  showSendMessage?: boolean
}

// QR Code component using canvas
function QRCodeDisplay({ data, size = 256 }: { data: string; size?: number }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Generate QR code using an external library or API
    // For production, use a library like 'qrcode' or an API
    const generateQR = async () => {
      try {
        // Using QR Server API (free, no key required)
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`
        setQrUrl(url)
        setError(null)
      } catch (e) {
        setError('Failed to generate QR code')
        console.error('QR generation error:', e)
      }
    }

    if (data) {
      generateQR()
    }
  }, [data, size])

  if (error) {
    return (
      <div className="flex items-center justify-center w-64 h-64 bg-red-500/10 rounded-xl border-2 border-red-500/30">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  if (!qrUrl) {
    return (
      <div className="flex items-center justify-center w-64 h-64 bg-slate-800/50 rounded-xl animate-pulse">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative">
      <img
        src={qrUrl}
        alt="WhatsApp QR Code"
        className="w-64 h-64 rounded-xl bg-white p-2"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

// Status badge component
function StatusBadge({ state }: { state: SessionState }) {
  const statusConfig: Record<NonNullable<SessionState>, { label: string; color: string; icon: string }> = {
    initializing: { label: 'Initializing...', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '...' },
    qr_pending: { label: 'Scan QR Code', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '...' },
    code_pending: { label: 'Enter Code', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: '...' },
    authenticating: { label: 'Authenticating...', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '...' },
    ready: { label: 'Connected', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '...' },
    disconnected: { label: 'Disconnected', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: '...' },
    destroyed: { label: 'Session Ended', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: '...' },
    error: { label: 'Error', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '...' },
  }

  if (!state) return null

  const config = statusConfig[state]

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
      config.color
    )}>
      {state === 'ready' && (
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
      )}
      {(state === 'initializing' || state === 'authenticating') && (
        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {config.label}
    </span>
  )
}

export function WhatsAppWebIntegrationPanel({
  className = '',
  onConnected,
  onDisconnected,
  showSendMessage = true,
}: WhatsAppWebIntegrationProps) {
  const isMobile = useIsMobile()

  const {
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
  } = useWhatsAppWeb()

  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [sendStatus, setSendStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [phoneForPairing, setPhoneForPairing] = useState('')
  const [pairingLoading, setPairingLoading] = useState(false)
  // On mobile, automatically use pairing code mode
  const [usePairingMode, setUsePairingMode] = useState(isMobile)

  // Notify parent of connection changes
  useEffect(() => {
    if (isConnected && session?.phoneNumber) {
      onConnected?.(session.phoneNumber)
    } else if (state === 'disconnected' || state === 'destroyed') {
      onDisconnected?.()
    }
  }, [isConnected, state, session?.phoneNumber, onConnected, onDisconnected])

  const handleSendMessage = async () => {
    if (!recipient || !message) return

    setSendStatus(null)
    const result = await sendMessage(recipient, message)

    if (result.success) {
      setSendStatus({ success: true, message: 'Message sent!' })
      setMessage('')
    } else {
      setSendStatus({ success: false, message: result.error || 'Failed to send' })
    }

    // Clear status after 3 seconds
    setTimeout(() => setSendStatus(null), 3000)
  }

  const handleRequestPairingCode = async () => {
    if (!phoneForPairing) return

    setPairingLoading(true)
    const result = await requestPairingCode(phoneForPairing)
    setPairingLoading(false)

    if (!result.success) {
      setSendStatus({ success: false, message: result.error || 'Failed to get pairing code' })
      setTimeout(() => setSendStatus(null), 3000)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">WhatsApp Web</h3>
            <p className="text-sm text-slate-400">
              {isMobile ? 'Connect via pairing code' : 'Connect via QR code'}
            </p>
          </div>
        </div>
        <StatusBadge state={state} />
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-xl border-2 border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Not connected state */}
      {!session && !isLoading && (
        <div className="text-center py-8">
          <div className={cn(
            "w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center",
            isMobile ? "bg-purple-500/10" : "bg-emerald-500/10"
          )}>
            {isMobile ? (
              // Mobile icon
              <svg className="w-10 h-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            ) : (
              // WhatsApp icon for desktop
              <svg className="w-10 h-10 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            )}
          </div>
          <h4 className="text-lg font-medium text-white mb-2">Connect Your WhatsApp</h4>
          <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
            {isMobile
              ? "Enter your phone number to get a pairing code. Your messages stay private and encrypted."
              : "Scan the QR code with your phone to link your WhatsApp account. Your messages stay private and encrypted."
            }
          </p>
          <Button
            onClick={connect}
            disabled={isLoading}
            className={cn(
              isMobile ? "bg-purple-600 hover:bg-purple-500" : "bg-emerald-600 hover:bg-emerald-500"
            )}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                {isMobile ? (
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                )}
                Connect WhatsApp
              </>
            )}
          </Button>
        </div>
      )}

      {/* QR Code display - DESKTOP ONLY */}
      {!isMobile && qrCode && state === 'qr_pending' && !usePairingMode && (
        <div className="flex flex-col items-center py-6">
          <QRCodeDisplay data={qrCode} size={256} />
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400 mb-2">
              Open WhatsApp on your phone
            </p>
            <ol className="text-xs text-slate-500 space-y-1">
              <li>1. Tap Menu or Settings</li>
              <li>2. Tap Linked Devices</li>
              <li>3. Tap Link a Device</li>
              <li>4. Point your phone at this screen</li>
            </ol>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUsePairingMode(true)}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            >
              Can't scan? Use code instead
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => disconnect()}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Pairing Code - MOBILE (auto) or DESKTOP (manual switch) */}
      {((isMobile && session && state === 'qr_pending') || usePairingMode || state === 'code_pending') && session && (
        <div className="flex flex-col items-center py-6">
          {pairingCode ? (
            // Show the pairing code
            <div className="text-center">
              <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-2xl p-6 mb-4">
                <p className="text-sm text-purple-400 mb-2">Your pairing code:</p>
                <p className="text-4xl font-mono font-bold text-white tracking-widest">
                  {pairingCode}
                </p>
              </div>
              <div className="text-center max-w-xs">
                <p className="text-sm text-slate-400 mb-3">
                  Enter this code in WhatsApp:
                </p>
                <ol className="text-xs text-slate-500 space-y-1 text-left">
                  <li>1. Open WhatsApp on your phone</li>
                  <li>2. Go to Settings → Linked Devices</li>
                  <li>3. Tap "Link a Device"</li>
                  <li>4. Tap "Link with phone number instead"</li>
                  <li>5. Enter the code above</li>
                </ol>
              </div>
            </div>
          ) : (
            // Show phone number input for pairing code
            <div className="text-center w-full max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-white mb-2">Link with Phone Number</h4>
              <p className="text-sm text-slate-400 mb-4">
                Enter your WhatsApp phone number to get a pairing code
              </p>
              <div className="space-y-3">
                <Input
                  placeholder="Phone number (e.g., 96512345678)"
                  value={phoneForPairing}
                  onChange={(e) => setPhoneForPairing(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-center"
                  type="tel"
                  inputMode="numeric"
                />
                <Button
                  onClick={handleRequestPairingCode}
                  disabled={!phoneForPairing || pairingLoading}
                  className="w-full bg-purple-600 hover:bg-purple-500"
                >
                  {pairingLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Getting Code...
                    </>
                  ) : (
                    'Get Pairing Code'
                  )}
                </Button>
                {/* Only show back button on desktop when manually switched to pairing mode */}
                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUsePairingMode(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ← Back to QR Code
                  </Button>
                )}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setUsePairingMode(isMobile) // Reset to default for device type
              disconnect()
            }}
            className="mt-4 text-slate-400 hover:text-white"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Authenticating state */}
      {state === 'authenticating' && (
        <div className="flex flex-col items-center py-8">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white font-medium">Authenticating...</p>
          <p className="text-sm text-slate-400">Please wait while we verify your connection</p>
        </div>
      )}

      {/* Connected state */}
      {isConnected && session && (
        <div className="space-y-4">
          {/* Connected info */}
          <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-2xl">...</span>
              </div>
              <div>
                <p className="text-white font-medium">
                  {session.pushName || 'WhatsApp User'}
                </p>
                <p className="text-sm text-emerald-400">
                  +{session.phoneNumber}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => disconnect(true)}
                className="ml-auto text-slate-400 hover:text-red-400"
              >
                Disconnect
              </Button>
            </div>
          </div>

          {/* Send message form */}
          {showSendMessage && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white">Send a Message</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Phone number (e.g., 96512345678)"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="flex-1 bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-slate-800/50 border-slate-700"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!recipient || !message}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  Send
                </Button>
              </div>
              {sendStatus && (
                <p className={cn(
                  'text-sm',
                  sendStatus.success ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {sendStatus.message}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-slate-800/30 rounded-lg p-3">
        <p className="text-xs text-slate-500">
          <strong className="text-slate-400">For personal use only.</strong> Do not use for mass messaging or marketing.
          Your WhatsApp account remains on your phone - we only link to send/receive messages.
        </p>
      </div>
    </div>
  )
}

export default WhatsAppWebIntegrationPanel

/**
 * NetworkStatus Component
 *
 * Displays online/offline status and handles network state changes.
 * Uses navigator.onLine and network change events for real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface NetworkState {
  isOnline: boolean
  wasOffline: boolean  // Track if we recovered from offline
  downtime: number     // How long we were offline (ms)
  lastOnline: Date | null
  lastOffline: Date | null
  connectionType?: string
  effectiveType?: string
  downlinkSpeed?: number
}

interface NetworkStatusProps {
  /** Whether to show the status indicator */
  showIndicator?: boolean
  /** Position of the indicator */
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Custom class name */
  className?: string
  /** Callback when network status changes */
  onStatusChange?: (isOnline: boolean, state: NetworkState) => void
  /** Auto-hide online banner after ms (0 to disable) */
  autoHideOnline?: number
  /** Show reconnected message */
  showReconnected?: boolean
}

// Get network connection info if available
function getConnectionInfo(): { type?: string; effectiveType?: string; downlink?: number } {
  // @ts-expect-error - Navigator.connection is not in all TypeScript defs
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (connection) {
    return {
      type: connection.type,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
    }
  }
  return {}
}

/**
 * Hook for tracking network status
 */
export function useNetworkStatus(
  onStatusChange?: (isOnline: boolean, state: NetworkState) => void
): NetworkState {
  const [state, setState] = useState<NetworkState>(() => {
    const connInfo = getConnectionInfo()
    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      wasOffline: false,
      downtime: 0,
      lastOnline: null,
      lastOffline: null,
      connectionType: connInfo.type,
      effectiveType: connInfo.effectiveType,
      downlinkSpeed: connInfo.downlink,
    }
  })

  const offlineStartRef = useRef<number | null>(null)

  const handleOnline = useCallback(() => {
    const now = new Date()
    const downtime = offlineStartRef.current
      ? Date.now() - offlineStartRef.current
      : 0

    offlineStartRef.current = null

    setState((prev) => {
      const newState = {
        ...prev,
        isOnline: true,
        wasOffline: !prev.isOnline, // Was offline before this event
        downtime,
        lastOnline: now,
      }
      onStatusChange?.(true, newState)
      return newState
    })
  }, [onStatusChange])

  const handleOffline = useCallback(() => {
    const now = new Date()
    offlineStartRef.current = Date.now()

    setState((prev) => {
      const newState = {
        ...prev,
        isOnline: false,
        wasOffline: false,
        downtime: 0,
        lastOffline: now,
      }
      onStatusChange?.(false, newState)
      return newState
    })
  }, [onStatusChange])

  const handleConnectionChange = useCallback(() => {
    const connInfo = getConnectionInfo()
    setState((prev) => ({
      ...prev,
      connectionType: connInfo.type,
      effectiveType: connInfo.effectiveType,
      downlinkSpeed: connInfo.downlink,
    }))
  }, [])

  useEffect(() => {
    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Connection API events
    // @ts-expect-error - Navigator.connection is not in all TypeScript defs
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    // Initial state check
    if (!navigator.onLine) {
      handleOffline()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [handleOnline, handleOffline, handleConnectionChange])

  return state
}

/**
 * NetworkStatus Component
 */
export function NetworkStatus({
  showIndicator = true,
  position = 'bottom',
  className = '',
  onStatusChange,
  autoHideOnline = 3000,
  showReconnected = true,
}: NetworkStatusProps) {
  const networkState = useNetworkStatus(onStatusChange)
  const [visible, setVisible] = useState(false)
  const [showingReconnected, setShowingReconnected] = useState(false)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Show banner when offline
  useEffect(() => {
    if (!networkState.isOnline) {
      setVisible(true)
      setShowingReconnected(false)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }
    } else if (networkState.wasOffline && showReconnected) {
      // Just came back online
      setShowingReconnected(true)
      setVisible(true)

      if (autoHideOnline > 0) {
        hideTimeoutRef.current = setTimeout(() => {
          setVisible(false)
          setShowingReconnected(false)
        }, autoHideOnline)
      }
    } else if (autoHideOnline > 0 && visible) {
      // Auto-hide online status
      hideTimeoutRef.current = setTimeout(() => {
        setVisible(false)
      }, autoHideOnline)
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [networkState.isOnline, networkState.wasOffline, autoHideOnline, showReconnected, visible])

  if (!showIndicator || !visible) {
    return null
  }

  // Position styles
  const positionStyles: Record<string, string> = {
    'top': 'top-0 left-0 right-0',
    'bottom': 'bottom-0 left-0 right-0',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  const isFullWidth = position === 'top' || position === 'bottom'
  const positionClass = positionStyles[position] || positionStyles.bottom

  return (
    <div
      data-testid="network-status"
      data-online={networkState.isOnline}
      role="status"
      aria-live="polite"
      className={`
        fixed z-50 ${positionClass}
        ${isFullWidth ? 'px-0' : 'px-4'}
        ${className}
      `}
    >
      <div
        className={`
          flex items-center gap-2 px-4 py-2
          ${isFullWidth ? 'justify-center' : 'rounded-lg shadow-lg'}
          ${networkState.isOnline
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
          }
          transition-all duration-300
        `}
      >
        {/* Status icon */}
        <span className="flex items-center">
          {networkState.isOnline ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-2.829 2.829a1 1 0 010 1.414"
              />
            </svg>
          )}
        </span>

        {/* Status message */}
        <span className="font-medium">
          {networkState.isOnline
            ? showingReconnected
              ? `Back online${networkState.downtime > 0 ? ` (offline for ${formatDuration(networkState.downtime)})` : ''}`
              : 'Connected'
            : 'No internet connection'}
        </span>

        {/* Connection quality indicator */}
        {networkState.isOnline && networkState.effectiveType && (
          <span className="text-sm opacity-75">
            ({networkState.effectiveType})
          </span>
        )}

        {/* Dismiss button */}
        {networkState.isOnline && (
          <button
            onClick={() => setVisible(false)}
            className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss notification"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Offline action suggestions */}
      {!networkState.isOnline && (
        <div className="mt-1 px-4 py-2 bg-red-700/90 text-white text-sm text-center">
          <p>Check your connection and try again</p>
        </div>
      )}
    </div>
  )
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

/**
 * Compact inline network status indicator
 */
export function NetworkStatusIndicator({ className = '' }: { className?: string }) {
  const { isOnline } = useNetworkStatus()

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      title={isOnline ? 'Connected' : 'Offline'}
    >
      <span
        className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
        aria-hidden="true"
      />
      <span className="sr-only">{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  )
}

export default NetworkStatus

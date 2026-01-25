/**
 * Offline Indicator Component
 * Shows when the user is offline and provides feedback about connection status
 */

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface OfflineIndicatorProps {
  className?: string
  position?: 'top' | 'bottom'
  showReconnecting?: boolean
}

type ConnectionStatus = 'online' | 'offline' | 'reconnecting'

export function OfflineIndicator({
  className,
  position = 'bottom',
  showReconnecting = true,
}: OfflineIndicatorProps) {
  const [status, setStatus] = useState<ConnectionStatus>(() =>
    navigator.onLine ? 'online' : 'offline'
  )
  const [isVisible, setIsVisible] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  // Handle connection state changes
  const handleOnline = useCallback(() => {
    setStatus('online')
    setShowReconnected(true)

    // Hide reconnected message after 3 seconds
    setTimeout(() => {
      setShowReconnected(false)
      setIsVisible(false)
    }, 3000)
  }, [])

  const handleOffline = useCallback(() => {
    setStatus('offline')
    setIsVisible(true)
  }, [])

  // Check connection periodically when offline
  useEffect(() => {
    if (status !== 'offline') return

    const checkConnection = async () => {
      if (showReconnecting) {
        setStatus('reconnecting')
      }

      try {
        // Try to fetch a small resource to check connectivity
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch('/manifest.json', {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          handleOnline()
        } else {
          setStatus('offline')
        }
      } catch {
        setStatus('offline')
      }
    }

    const interval = setInterval(checkConnection, 10000)
    return () => clearInterval(interval)
  }, [status, showReconnecting, handleOnline])

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    if (!navigator.onLine) {
      handleOffline()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  // Don't render if online and not showing reconnected message
  if (status === 'online' && !showReconnected && !isVisible) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'fixed left-0 right-0 z-50 flex justify-center transition-all duration-300',
        position === 'top' ? 'top-0' : 'bottom-0',
        isVisible || showReconnected ? 'translate-y-0 opacity-100' : (
          position === 'top' ? '-translate-y-full opacity-0' : 'translate-y-full opacity-0'
        ),
        className
      )}
    >
      <div
        className={cn(
          'mx-4 my-2 flex items-center gap-3 rounded-lg px-4 py-2 shadow-lg backdrop-blur-sm',
          status === 'offline' && 'bg-red-500/90 text-white',
          status === 'reconnecting' && 'bg-amber-500/90 text-white',
          showReconnected && 'bg-emerald-500/90 text-white'
        )}
      >
        {/* Status Icon */}
        {status === 'offline' && (
          <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        )}

        {status === 'reconnecting' && (
          <div className="h-5 w-5 flex-shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
        )}

        {showReconnected && (
          <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}

        {/* Status Text */}
        <span className="text-sm font-medium">
          {status === 'offline' && 'You are offline. Some features may not work.'}
          {status === 'reconnecting' && 'Reconnecting...'}
          {showReconnected && 'Back online!'}
        </span>

        {/* Retry Button (only when offline) */}
        {status === 'offline' && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-2 flex-shrink-0 rounded bg-white/20 px-2 py-1 text-xs font-medium hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Retry connection"
          >
            Retry
          </button>
        )}

        {/* Dismiss Button */}
        {(status === 'offline' || showReconnected) && (
          <button
            type="button"
            onClick={() => {
              setIsVisible(false)
              setShowReconnected(false)
            }}
            className="ml-1 flex-shrink-0 rounded p-1 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Dismiss notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// Hook to check online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Higher-order component to wrap components with offline awareness
export function withOfflineAwareness<P extends object>(
  Component: React.ComponentType<P & { isOnline: boolean }>
) {
  return function OfflineAwareComponent(props: P) {
    const isOnline = useOnlineStatus()
    return <Component {...props} isOnline={isOnline} />
  }
}

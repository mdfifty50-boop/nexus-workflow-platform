/**
 * Network Status Banner Component
 *
 * Displays a persistent banner when the user is offline or has a slow connection.
 * Provides retry functionality and seamless reconnection handling.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { Button } from '@/components/ui/button'

interface NetworkStatusBannerProps {
  /** Show retry button */
  showRetry?: boolean
  /** Callback when retry is clicked */
  onRetry?: () => void
  /** Auto-hide after reconnection (delay in ms) */
  autoHideDelay?: number
}

export function NetworkStatusBanner({
  showRetry = true,
  onRetry,
  autoHideDelay = 3000,
}: NetworkStatusBannerProps) {
  const { isOnline, isSlowConnection, connectionType } = useNetworkStatus()
  const [showReconnected, setShowReconnected] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  // Track offline state to show reconnected message
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
      setShowReconnected(false)
    } else if (wasOffline && isOnline) {
      setShowReconnected(true)
      // Auto-hide reconnected message after delay
      const timer = setTimeout(() => {
        setShowReconnected(false)
        setWasOffline(false)
      }, autoHideDelay)
      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline, autoHideDelay])

  const handleRetry = useCallback(async () => {
    setIsRetrying(true)
    try {
      // Try to fetch a simple resource to verify connectivity
      await fetch('/api/health', { method: 'HEAD', cache: 'no-store' }).catch(() => {
        // Ignore errors - just checking connectivity
      })
      if (onRetry) {
        onRetry()
      }
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry])

  // Don't render if online and no special states
  if (isOnline && !isSlowConnection && !showReconnected) {
    return null
  }

  // Reconnected state
  if (showReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-[100] px-4 py-2 bg-green-500 text-white text-center text-sm font-medium transition-all animate-slide-down"
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Back online! Your connection has been restored.
        </span>
      </div>
    )
  }

  // Offline state
  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="fixed top-0 left-0 right-0 z-[100] px-4 py-3 bg-red-500/95 backdrop-blur-sm text-white text-center text-sm font-medium shadow-lg"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4 flex-wrap">
          <span className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-7.072 0l-1.414 1.414a7 7 0 0010.606 0l-1.414-1.414zm4.95-7.778a9 9 0 00-12.728 0l2.829 2.829a5 5 0 017.072 0l2.827-2.829z"
              />
            </svg>
            <strong>You're offline</strong> - Some features may not work until you reconnect.
          </span>
          {showRetry && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRetry}
              disabled={isRetrying}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {isRetrying ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Checking...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Try Again
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Slow connection state
  if (isSlowConnection) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-[100] px-4 py-2 bg-yellow-500 text-black text-center text-sm font-medium"
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Slow connection detected ({connectionType}). Loading may take longer.
        </span>
      </div>
    )
  }

  return null
}

export default NetworkStatusBanner

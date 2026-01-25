/**
 * Offline Error Component
 *
 * Displayed when network is unavailable.
 * Features retry button and offline mode option.
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { getErrorMessage, type SupportedLocale, getCurrentLocale } from '@/lib/error-messages'

interface OfflineErrorProps {
  onRetry?: () => void
  onOfflineMode?: () => void
  locale?: SupportedLocale
  showOfflineOption?: boolean
  fullPage?: boolean
}

export function OfflineError({
  onRetry,
  onOfflineMode,
  locale = getCurrentLocale(),
  showOfflineOption = true,
  fullPage = true,
}: OfflineErrorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null)

  const errorMessage = getErrorMessage('NETWORK_OFFLINE', locale)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-retry when coming back online
      if (onRetry) {
        onRetry()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [onRetry])

  // If back online, show success state briefly
  if (isOnline && retryCount > 0) {
    return (
      <div
        className={`${
          fullPage ? 'min-h-screen' : 'min-h-[400px]'
        } bg-background flex items-center justify-center p-4`}
      >
        <div className="max-w-md w-full text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">You're Back Online!</h2>
          <p className="text-muted-foreground">Reconnecting to our servers...</p>
        </div>
      </div>
    )
  }

  const handleRetry = useCallback(async () => {
    setIsRetrying(true)
    setRetryCount((c) => c + 1)
    setLastCheckTime(new Date())

    // Check if actually online by trying to fetch
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      })
      if (response.ok) {
        setIsOnline(true)
        if (onRetry) {
          onRetry()
        }
      }
    } catch {
      // Still offline
      setIsOnline(false)
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry])

  const handleOfflineMode = useCallback(() => {
    // Store offline mode preference
    localStorage.setItem('nexus_offline_mode', 'true')
    if (onOfflineMode) {
      onOfflineMode()
    }
  }, [onOfflineMode])

  const containerClasses = fullPage
    ? 'min-h-screen bg-background flex items-center justify-center p-4'
    : 'min-h-[400px] bg-background flex items-center justify-center p-4 rounded-xl border border-border'

  return (
    <div className={containerClasses}>
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="w-24 h-24 mx-auto mb-6 bg-amber-500/10 rounded-full flex items-center justify-center relative">
          {/* WiFi icon with X */}
          <svg
            className="w-12 h-12 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
            />
          </svg>
          {/* X overlay */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-background rounded-full flex items-center justify-center border-2 border-amber-500">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        {/* Error Content */}
        <h1 className="text-2xl font-bold text-foreground mb-2">{errorMessage.title}</h1>
        <p className="text-muted-foreground mb-2">{errorMessage.message}</p>
        <p className="text-sm text-primary mb-6">{errorMessage.suggestion}</p>

        {/* Connection Status Indicator */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`}
            />
            <span className="text-sm text-muted-foreground">
              {isOnline ? 'Connected' : 'No Connection'}
            </span>
          </div>
          {lastCheckTime && (
            <p className="text-xs text-muted-foreground">
              Last checked: {lastCheckTime.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Troubleshooting Tips */}
        <div className="mb-6 text-left bg-muted/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Quick fixes:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">1.</span>
              <span>Check your Wi-Fi or mobile data connection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">2.</span>
              <span>Try turning airplane mode on and off</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">3.</span>
              <span>Move closer to your router</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">4.</span>
              <span>Restart your browser or device</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button onClick={handleRetry} disabled={isRetrying} size="lg" className="w-full">
            {isRetrying ? (
              <>
                <svg
                  className="w-4 h-4 mr-2 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Checking Connection...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Again {retryCount > 0 && `(${retryCount})`}
              </>
            )}
          </Button>

          {showOfflineOption && onOfflineMode && (
            <Button variant="outline" onClick={handleOfflineMode} size="lg" className="w-full">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Continue Offline
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => window.location.reload()}
            className="text-muted-foreground"
          >
            Refresh Page
          </Button>
        </div>

        {/* Offline Mode Info */}
        {showOfflineOption && (
          <p className="mt-6 text-xs text-muted-foreground">
            Offline mode allows you to view cached content and draft changes locally. Your changes
            will sync when you reconnect.
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Compact inline version of offline indicator
 */
export function OfflineIndicator({ className = '' }: { className?: string }) {
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

  if (isOnline) return null

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-amber-500/90 text-white rounded-full shadow-lg animate-in slide-in-from-bottom ${className}`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>
      <span className="text-sm font-medium">You're offline</span>
    </div>
  )
}

/**
 * Hook for checking online status
 */
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

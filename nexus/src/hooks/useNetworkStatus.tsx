import { useState, useEffect, useCallback } from 'react'

interface NetworkStatus {
  isOnline: boolean
  isSlowConnection: boolean
  connectionType: string | null
  downlink: number | null
  rtt: number | null
}

// Extended navigator type for Network Information API
interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType: string
    downlink: number
    rtt: number
    addEventListener: (type: string, listener: () => void) => void
    removeEventListener: (type: string, listener: () => void) => void
  }
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: null,
    downlink: null,
    rtt: null,
  })

  const updateNetworkStatus = useCallback(() => {
    const nav = navigator as NavigatorWithConnection
    const connection = nav.connection

    setStatus({
      isOnline: navigator.onLine,
      isSlowConnection: connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g',
      connectionType: connection?.effectiveType || null,
      downlink: connection?.downlink || null,
      rtt: connection?.rtt || null,
    })
  }, [])

  useEffect(() => {
    // Initial status
    updateNetworkStatus()

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    // Listen for connection changes if supported
    const nav = navigator as NavigatorWithConnection
    if (nav.connection) {
      nav.connection.addEventListener('change', updateNetworkStatus)
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
      if (nav.connection) {
        nav.connection.removeEventListener('change', updateNetworkStatus)
      }
    }
  }, [updateNetworkStatus])

  return status
}

// Offline banner component
export function OfflineBanner() {
  const { isOnline, isSlowConnection } = useNetworkStatus()

  if (isOnline && !isSlowConnection) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-sm font-medium transition-all ${
        !isOnline
          ? 'bg-red-500 text-white'
          : 'bg-yellow-500 text-black'
      }`}
    >
      {!isOnline ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          You're offline. Some features may not work.
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-black rounded-full" />
          Slow connection detected. Loading may take longer.
        </span>
      )}
    </div>
  )
}

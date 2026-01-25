import { useState, useEffect, useCallback, useRef } from 'react'

interface SessionTimeoutWarningProps {
  /** Session timeout in milliseconds (default: 30 minutes) */
  sessionTimeout?: number
  /** Time before timeout to show warning in milliseconds (default: 5 minutes) */
  warningBefore?: number
  /** Callback when session expires */
  onSessionExpire?: () => void
  /** Callback to extend session (should return true if successful) */
  onExtendSession?: () => Promise<boolean>
  /** Whether the session is currently active */
  isAuthenticated?: boolean
}

/**
 * Session Timeout Warning Component
 * Shows a warning before the session expires with countdown and "Stay logged in" option
 */
export function SessionTimeoutWarning({
  sessionTimeout = 30 * 60 * 1000, // 30 minutes
  warningBefore = 5 * 60 * 1000, // 5 minutes before
  onSessionExpire,
  onExtendSession,
  isAuthenticated = true,
}: SessionTimeoutWarningProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isExtending, setIsExtending] = useState(false)
  const [extensionError, setExtensionError] = useState<string | null>(null)

  const lastActivityRef = useRef(Date.now())
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const expireTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Reset activity timestamp
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    setShowWarning(false)
    setExtensionError(null)
  }, [])

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated) return

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll']

    const handleActivity = () => {
      // Don't reset if warning is already showing
      if (!showWarning) {
        resetActivity()
      }
    }

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [isAuthenticated, showWarning, resetActivity])

  // Set up timeout timers
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear all timers when not authenticated
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
      if (expireTimeoutRef.current) clearTimeout(expireTimeoutRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      setShowWarning(false)
      return
    }

    const checkSession = () => {
      const now = Date.now()
      const elapsed = now - lastActivityRef.current
      const timeUntilExpire = sessionTimeout - elapsed
      const timeUntilWarning = sessionTimeout - warningBefore - elapsed

      // Clear existing timers
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
      if (expireTimeoutRef.current) clearTimeout(expireTimeoutRef.current)

      if (timeUntilExpire <= 0) {
        // Session already expired
        setShowWarning(false)
        onSessionExpire?.()
        return
      }

      if (timeUntilWarning <= 0) {
        // Should show warning now
        setShowWarning(true)
        setTimeRemaining(timeUntilExpire)

        // Set expiration timer
        expireTimeoutRef.current = setTimeout(() => {
          setShowWarning(false)
          onSessionExpire?.()
        }, timeUntilExpire)
      } else {
        // Set warning timer
        warningTimeoutRef.current = setTimeout(() => {
          setShowWarning(true)
          setTimeRemaining(warningBefore)

          // Set expiration timer
          expireTimeoutRef.current = setTimeout(() => {
            setShowWarning(false)
            onSessionExpire?.()
          }, warningBefore)
        }, timeUntilWarning)
      }
    }

    checkSession()

    // Check every minute in case timers drift
    const checkInterval = setInterval(checkSession, 60000)

    return () => {
      clearInterval(checkInterval)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
      if (expireTimeoutRef.current) clearTimeout(expireTimeoutRef.current)
    }
  }, [isAuthenticated, sessionTimeout, warningBefore, onSessionExpire])

  // Countdown timer
  useEffect(() => {
    if (!showWarning) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
      return
    }

    countdownIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newValue = prev - 1000
        if (newValue <= 0) {
          return 0
        }
        return newValue
      })
    }, 1000)

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [showWarning])

  // Handle extend session
  const handleExtendSession = async () => {
    setIsExtending(true)
    setExtensionError(null)

    try {
      if (onExtendSession) {
        const success = await onExtendSession()
        if (success) {
          resetActivity()
          // Clear and reset timers
          if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
          if (expireTimeoutRef.current) clearTimeout(expireTimeoutRef.current)
        } else {
          setExtensionError('Failed to extend session. Please log in again.')
        }
      } else {
        // If no handler, just reset local activity
        resetActivity()
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
        if (expireTimeoutRef.current) clearTimeout(expireTimeoutRef.current)
      }
    } catch (error) {
      setExtensionError('An error occurred. Please try again.')
      console.error('Session extension error:', error)
    } finally {
      setIsExtending(false)
    }
  }

  // Format time remaining
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!showWarning || !isAuthenticated) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-2xl border border-slate-700">
        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-white text-center mb-2">
          Session Timeout Warning
        </h2>

        {/* Message */}
        <p className="text-slate-400 text-center mb-4">
          Your session will expire due to inactivity. Would you like to stay logged in?
        </p>

        {/* Countdown */}
        <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <span className="text-sm text-slate-400">Time remaining</span>
            <div className="text-4xl font-mono font-bold text-amber-500 mt-1">
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
              style={{
                width: `${Math.max(0, (timeRemaining / warningBefore) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Error message */}
        {extensionError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
            {extensionError}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onSessionExpire}
            className="flex-1 px-4 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors font-medium"
            disabled={isExtending}
          >
            Log Out
          </button>
          <button
            onClick={handleExtendSession}
            disabled={isExtending}
            className="flex-1 px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExtending ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Extending...
              </>
            ) : (
              'Stay Logged In'
            )}
          </button>
        </div>

        {/* Hint */}
        <p className="text-xs text-slate-500 text-center mt-4">
          Moving your mouse or typing will reset the inactivity timer.
        </p>
      </div>
    </div>
  )
}

export default SessionTimeoutWarning

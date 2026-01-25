/**
 * LiveRegion - Screen Reader Announcement Component
 *
 * Provides aria-live regions for announcing dynamic content changes,
 * loading states, errors, and success messages to screen reader users.
 *
 * @module components/LiveRegion
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'

// Types for different announcement priorities
type AriaLive = 'polite' | 'assertive' | 'off'
type AnnouncementType = 'info' | 'success' | 'error' | 'loading' | 'warning'

interface Announcement {
  id: string
  message: string
  type: AnnouncementType
  priority: AriaLive
  timestamp: number
}

interface LiveRegionContextType {
  /** Announce a message to screen readers */
  announce: (message: string, type?: AnnouncementType) => void
  /** Announce a polite message (waits for pause in speech) */
  announcePolite: (message: string) => void
  /** Announce an assertive message (interrupts current speech) */
  announceAssertive: (message: string) => void
  /** Announce a loading state */
  announceLoading: (message?: string) => void
  /** Announce a success message */
  announceSuccess: (message: string) => void
  /** Announce an error message */
  announceError: (message: string) => void
  /** Clear all pending announcements */
  clearAnnouncements: () => void
}

const LiveRegionContext = createContext<LiveRegionContextType | null>(null)

/**
 * Hook to access the LiveRegion announcement functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { announceSuccess, announceError, announceLoading } = useLiveRegion()
 *
 *   const handleSubmit = async () => {
 *     announceLoading('Saving changes...')
 *     try {
 *       await saveData()
 *       announceSuccess('Changes saved successfully')
 *     } catch (error) {
 *       announceError('Failed to save changes')
 *     }
 *   }
 * }
 * ```
 */
export function useLiveRegion(): LiveRegionContextType {
  const context = useContext(LiveRegionContext)
  if (!context) {
    // Return no-op functions if used outside provider (graceful degradation)
    return {
      announce: () => {},
      announcePolite: () => {},
      announceAssertive: () => {},
      announceLoading: () => {},
      announceSuccess: () => {},
      announceError: () => {},
      clearAnnouncements: () => {}
    }
  }
  return context
}

interface LiveRegionProviderProps {
  children: ReactNode
  /** Debounce time for announcements in ms (default: 100) */
  debounceMs?: number
}

/**
 * Provider component that manages screen reader announcements
 * Wrap your app with this to enable live region functionality
 */
export function LiveRegionProvider({ children, debounceMs = 100 }: LiveRegionProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const announcementQueueRef = useRef<Announcement[]>([])

  // Process the announcement queue
  const processQueue = useCallback(() => {
    const queue = announcementQueueRef.current
    if (queue.length === 0) return

    // Get the highest priority announcement
    const assertive = queue.filter(a => a.priority === 'assertive')
    const polite = queue.filter(a => a.priority === 'polite')

    if (assertive.length > 0) {
      const latest = assertive[assertive.length - 1]
      setAssertiveMessage(latest.message)
      // Clear assertive message after a short delay to allow re-announcement of same text
      setTimeout(() => setAssertiveMessage(''), 1000)
    }

    if (polite.length > 0) {
      const latest = polite[polite.length - 1]
      setPoliteMessage(latest.message)
      setTimeout(() => setPoliteMessage(''), 1000)
    }

    announcementQueueRef.current = []
  }, [])

  // Generic announce function
  const announce = useCallback((message: string, type: AnnouncementType = 'info') => {
    const priority: AriaLive = type === 'error' || type === 'warning' ? 'assertive' : 'polite'

    const announcement: Announcement = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      priority,
      timestamp: Date.now()
    }

    announcementQueueRef.current.push(announcement)

    // Debounce processing
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      processQueue()
    }, debounceMs)
  }, [debounceMs, processQueue])

  // Polite announcement (waits for pause)
  const announcePolite = useCallback((message: string) => {
    announce(message, 'info')
  }, [announce])

  // Assertive announcement (interrupts)
  const announceAssertive = useCallback((message: string) => {
    const announcement: Announcement = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type: 'error',
      priority: 'assertive',
      timestamp: Date.now()
    }
    announcementQueueRef.current.push(announcement)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(processQueue, debounceMs)
  }, [debounceMs, processQueue])

  // Loading announcement
  const announceLoading = useCallback((message: string = 'Loading, please wait...') => {
    announce(message, 'loading')
  }, [announce])

  // Success announcement
  const announceSuccess = useCallback((message: string) => {
    announce(message, 'success')
  }, [announce])

  // Error announcement (assertive)
  const announceError = useCallback((message: string) => {
    announceAssertive(message)
  }, [announceAssertive])

  // Clear all announcements
  const clearAnnouncements = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    announcementQueueRef.current = []
    setPoliteMessage('')
    setAssertiveMessage('')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const contextValue: LiveRegionContextType = {
    announce,
    announcePolite,
    announceAssertive,
    announceLoading,
    announceSuccess,
    announceError,
    clearAnnouncements
  }

  return (
    <LiveRegionContext.Provider value={contextValue}>
      {children}

      {/* Visually hidden live regions for screen readers */}
      <div className="sr-only" aria-hidden="false">
        {/* Polite region - waits for pause in speech */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-relevant="additions text"
        >
          {politeMessage}
        </div>

        {/* Assertive region - interrupts current speech */}
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          aria-relevant="additions text"
        >
          {assertiveMessage}
        </div>

        {/* Log region for sequential announcements */}
        <div
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-relevant="additions"
        />
      </div>
    </LiveRegionContext.Provider>
  )
}

/**
 * Standalone component for inline status announcements
 * Use when you need a specific section to announce its own changes
 */
interface InlineLiveRegionProps {
  message: string
  type?: 'polite' | 'assertive'
  /** Visual styling - 'hidden' for screen-reader only */
  visual?: 'hidden' | 'visible'
  className?: string
}

export function InlineLiveRegion({
  message,
  type = 'polite',
  visual = 'hidden',
  className = ''
}: InlineLiveRegionProps) {
  const baseClass = visual === 'hidden' ? 'sr-only' : className

  return (
    <div
      role={type === 'assertive' ? 'alert' : 'status'}
      aria-live={type}
      aria-atomic="true"
      className={baseClass}
    >
      {message}
    </div>
  )
}

/**
 * Component to wrap loading states with proper announcements
 */
interface LoadingAnnouncerProps {
  isLoading: boolean
  loadingMessage?: string
  loadedMessage?: string
  children: ReactNode
}

export function LoadingAnnouncer({
  isLoading,
  loadingMessage = 'Loading content...',
  loadedMessage = 'Content loaded',
  children
}: LoadingAnnouncerProps) {
  const { announceLoading, announceSuccess } = useLiveRegion()
  const wasLoadingRef = useRef(false)

  useEffect(() => {
    if (isLoading && !wasLoadingRef.current) {
      announceLoading(loadingMessage)
    } else if (!isLoading && wasLoadingRef.current) {
      announceSuccess(loadedMessage)
    }
    wasLoadingRef.current = isLoading
  }, [isLoading, loadingMessage, loadedMessage, announceLoading, announceSuccess])

  return <>{children}</>
}

export default LiveRegionProvider

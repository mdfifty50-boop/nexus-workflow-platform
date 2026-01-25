/**
 * usePullToRefresh Hook - Mobile pull-to-refresh gesture
 *
 * Implements a native-feeling pull-to-refresh gesture for mobile devices
 * with visual indicator and smooth animations.
 */

import { useRef, useCallback, useEffect, useState } from 'react'

interface UsePullToRefreshOptions {
  /** Callback function to execute on refresh */
  onRefresh: () => Promise<void> | void
  /** Pull distance threshold to trigger refresh (default: 80px) */
  threshold?: number
  /** Maximum pull distance (default: 150px) */
  maxPull?: number
  /** Whether the hook is enabled (default: true) */
  enabled?: boolean
  /** Container element ref - if not provided, uses document body */
  containerRef?: React.RefObject<HTMLElement>
}

export interface PullToRefreshState {
  /** Whether user is currently pulling */
  isPulling: boolean
  /** Current pull distance in pixels */
  pullDistance: number
  /** Whether refresh is in progress */
  isRefreshing: boolean
  /** Progress percentage (0-100) */
  progress: number
  /** Whether threshold has been reached */
  canRelease: boolean
}

/**
 * Custom hook for implementing pull-to-refresh on mobile
 *
 * @example
 * ```tsx
 * const { state, containerProps } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await fetchData()
 *   }
 * })
 *
 * return (
 *   <div {...containerProps}>
 *     <PullToRefreshIndicator state={state} />
 *     <Content />
 *   </div>
 * )
 * ```
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 150,
  enabled = true,
  containerRef
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    progress: 0,
    canRelease: false
  })

  const startYRef = useRef<number>(0)
  const currentYRef = useRef<number>(0)
  const isAtTopRef = useRef<boolean>(true)
  const rafRef = useRef<number | null>(null)

  // Check if scrolled to top
  const checkScrollPosition = useCallback(() => {
    const container = containerRef?.current || document.documentElement
    isAtTopRef.current = container.scrollTop <= 0
  }, [containerRef])

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return

    checkScrollPosition()
    if (!isAtTopRef.current) return

    const touch = e.touches[0]
    startYRef.current = touch.clientY
    currentYRef.current = touch.clientY

    setState(prev => ({ ...prev, isPulling: true }))
  }, [enabled, state.isRefreshing, checkScrollPosition])

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing || !state.isPulling) return
    if (!isAtTopRef.current) {
      setState(prev => ({ ...prev, isPulling: false, pullDistance: 0, progress: 0 }))
      return
    }

    const touch = e.touches[0]
    currentYRef.current = touch.clientY

    const pullDistance = Math.max(0, currentYRef.current - startYRef.current)

    if (pullDistance > 0) {
      // Prevent default scroll when pulling
      e.preventDefault()

      // Apply resistance curve for more natural feel
      const resistance = 0.5
      const adjustedDistance = Math.min(
        maxPull,
        pullDistance * resistance + Math.pow(pullDistance * 0.02, 2)
      )

      const progress = Math.min(100, (adjustedDistance / threshold) * 100)
      const canRelease = adjustedDistance >= threshold

      // Use RAF for smooth updates
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        setState(prev => ({
          ...prev,
          pullDistance: adjustedDistance,
          progress,
          canRelease
        }))
      })
    }
  }, [enabled, state.isRefreshing, state.isPulling, threshold, maxPull])

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!enabled || state.isRefreshing) return

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    if (state.canRelease) {
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
        pullDistance: threshold, // Hold at threshold during refresh
        progress: 100
      }))

      try {
        await onRefresh()
      } catch (error) {
        console.error('[PullToRefresh] Refresh error:', error)
      } finally {
        // Animate back to 0
        setState({
          isPulling: false,
          pullDistance: 0,
          isRefreshing: false,
          progress: 0,
          canRelease: false
        })
      }
    } else {
      // Reset without triggering refresh
      setState({
        isPulling: false,
        pullDistance: 0,
        isRefreshing: false,
        progress: 0,
        canRelease: false
      })
    }
  }, [enabled, state.isRefreshing, state.canRelease, threshold, onRefresh])

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return

    const container = containerRef?.current || document

    // Check initial scroll position
    checkScrollPosition()

    // Add scroll listener to track position
    const handleScroll = () => {
      checkScrollPosition()
    }

    container.addEventListener('touchstart', handleTouchStart as EventListener, { passive: false })
    container.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false })
    container.addEventListener('touchend', handleTouchEnd as EventListener)
    container.addEventListener('scroll', handleScroll as EventListener, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart as EventListener)
      container.removeEventListener('touchmove', handleTouchMove as EventListener)
      container.removeEventListener('touchend', handleTouchEnd as EventListener)
      container.removeEventListener('scroll', handleScroll as EventListener)

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [enabled, containerRef, handleTouchStart, handleTouchMove, handleTouchEnd, checkScrollPosition])

  // Manual trigger for programmatic refresh
  const triggerRefresh = useCallback(async () => {
    if (state.isRefreshing) return

    setState(prev => ({
      ...prev,
      isRefreshing: true,
      pullDistance: threshold,
      progress: 100
    }))

    try {
      await onRefresh()
    } catch (error) {
      console.error('[PullToRefresh] Manual refresh error:', error)
    } finally {
      setState({
        isPulling: false,
        pullDistance: 0,
        isRefreshing: false,
        progress: 0,
        canRelease: false
      })
    }
  }, [state.isRefreshing, threshold, onRefresh])

  return {
    state,
    triggerRefresh
  }
}

/**
 * Pull to Refresh Indicator Component
 * Visual feedback for the pull-to-refresh gesture
 */
interface PullToRefreshIndicatorProps {
  state: PullToRefreshState
  className?: string
  /** Custom spinner component */
  spinner?: React.ReactNode
}

export function PullToRefreshIndicator({
  state,
  className = ''
}: PullToRefreshIndicatorProps): React.ReactNode {
  const { pullDistance, isRefreshing, progress, canRelease } = state

  if (pullDistance === 0 && !isRefreshing) return null

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-50 transition-opacity duration-200 ${className}`}
      style={{
        top: `${Math.max(12, pullDistance - 40)}px`,
        opacity: Math.min(1, pullDistance / 40)
      }}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg transition-all duration-200 ${
          isRefreshing
            ? 'bg-cyan-500/90 shadow-cyan-500/30'
            : canRelease
              ? 'bg-emerald-500/90 shadow-emerald-500/30'
              : 'bg-slate-800/90 shadow-slate-900/30'
        }`}
      >
        {isRefreshing ? (
          <svg
            className="w-5 h-5 text-white animate-spin"
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
        ) : (
          <svg
            className={`w-5 h-5 text-white transition-transform duration-200 ${canRelease ? 'rotate-180' : ''}`}
            style={{
              transform: `rotate(${Math.min(180, progress * 1.8)}deg)`
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        )}
      </div>

      {canRelease && !isRefreshing && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap">
          <span className="text-xs text-emerald-400 font-medium animate-pulse">
            Release to refresh
          </span>
        </div>
      )}
    </div>
  )
}

export default usePullToRefresh

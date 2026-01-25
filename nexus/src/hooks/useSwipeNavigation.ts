/**
 * Swipe Navigation Hook
 *
 * Lightweight hook for detecting swipe gestures for navigation on touch devices.
 * Uses passive event listeners for optimal mobile performance.
 */

import { useCallback, useRef, useEffect } from 'react'

export interface SwipeNavigationOptions {
  /** Minimum distance in pixels to trigger a swipe (default: 50) */
  threshold?: number
  /** Maximum vertical movement allowed for horizontal swipe (default: 75) */
  maxVerticalDeviation?: number
  /** Enable haptic feedback when swipe triggers (default: true) */
  hapticFeedback?: boolean
  /** Whether swipe detection is enabled (default: true) */
  enabled?: boolean
}

export interface SwipeNavigationCallbacks {
  /** Called when user swipes left (go next) */
  onSwipeLeft?: () => void
  /** Called when user swipes right (go previous) */
  onSwipeRight?: () => void
  /** Called when user swipes up */
  onSwipeUp?: () => void
  /** Called when user swipes down (dismiss) */
  onSwipeDown?: () => void
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null

/**
 * Hook for swipe-based navigation on touch devices
 *
 * @example
 * ```tsx
 * const ref = useSwipeNavigation({
 *   onSwipeLeft: () => setCurrentStep(prev => Math.min(prev + 1, maxSteps)),
 *   onSwipeRight: () => setCurrentStep(prev => Math.max(prev - 1, 0)),
 *   threshold: 50
 * })
 *
 * return <div ref={ref}>Swipeable content</div>
 * ```
 */
export function useSwipeNavigation(
  callbacks: SwipeNavigationCallbacks,
  options: SwipeNavigationOptions = {}
) {
  const {
    threshold = 50,
    maxVerticalDeviation = 75,
    hapticFeedback = true,
    enabled = true
  } = options

  const startX = useRef(0)
  const startY = useRef(0)
  const elementRef = useRef<HTMLElement | null>(null)

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [hapticFeedback])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return
    const touch = e.touches[0]
    startX.current = touch.clientX
    startY.current = touch.clientY
  }, [enabled])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - startX.current
    const deltaY = touch.clientY - startY.current
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // Determine if this is a horizontal or vertical swipe
    const isHorizontalSwipe = absDeltaX > absDeltaY && absDeltaY < maxVerticalDeviation
    const isVerticalSwipe = absDeltaY > absDeltaX && absDeltaX < maxVerticalDeviation

    if (isHorizontalSwipe && absDeltaX >= threshold) {
      if (deltaX < 0 && callbacks.onSwipeLeft) {
        triggerHaptic()
        callbacks.onSwipeLeft()
      } else if (deltaX > 0 && callbacks.onSwipeRight) {
        triggerHaptic()
        callbacks.onSwipeRight()
      }
    } else if (isVerticalSwipe && absDeltaY >= threshold) {
      if (deltaY < 0 && callbacks.onSwipeUp) {
        triggerHaptic()
        callbacks.onSwipeUp()
      } else if (deltaY > 0 && callbacks.onSwipeDown) {
        triggerHaptic()
        callbacks.onSwipeDown()
      }
    }
  }, [enabled, threshold, maxVerticalDeviation, callbacks, triggerHaptic])

  // Attach passive event listeners
  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    // Use passive listeners for better scroll performance
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchEnd])

  // Return a ref callback that stores the element
  const setRef = useCallback((element: HTMLElement | null) => {
    elementRef.current = element
  }, [])

  return setRef
}

/**
 * Hook for swipe-to-dismiss functionality (typically for modals/panels)
 *
 * @example
 * ```tsx
 * const { ref, style, isDismissing } = useSwipeToDismiss({
 *   onDismiss: () => setIsOpen(false),
 *   direction: 'down'
 * })
 *
 * return <div ref={ref} style={style}>Dismissable content</div>
 * ```
 */
export interface SwipeToDismissOptions {
  /** Direction to swipe to dismiss */
  direction: 'down' | 'up' | 'left' | 'right'
  /** Minimum distance to trigger dismiss (default: 100) */
  threshold?: number
  /** Callback when dismissed */
  onDismiss: () => void
  /** Whether enabled (default: true) */
  enabled?: boolean
  /** Enable haptic feedback (default: true) */
  hapticFeedback?: boolean
}

export function useSwipeToDismiss(options: SwipeToDismissOptions) {
  const {
    direction,
    threshold = 100,
    onDismiss,
    enabled = true,
    hapticFeedback = true
  } = options

  const startPos = useRef({ x: 0, y: 0 })
  const currentOffset = useRef(0)
  const elementRef = useRef<HTMLElement | null>(null)
  const isDragging = useRef(false)

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [hapticFeedback])

  const updateElementStyle = useCallback((offset: number, animate: boolean = false) => {
    const element = elementRef.current
    if (!element) return

    const isVertical = direction === 'down' || direction === 'up'
    const transform = isVertical
      ? `translateY(${offset}px)`
      : `translateX(${offset}px)`

    element.style.transform = transform
    element.style.transition = animate ? 'transform 0.3s ease-out' : 'none'

    // Calculate opacity based on offset and threshold
    const progress = Math.abs(offset) / threshold
    element.style.opacity = String(Math.max(0.5, 1 - progress * 0.5))
  }, [direction, threshold])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return
    const touch = e.touches[0]
    startPos.current = { x: touch.clientX, y: touch.clientY }
    isDragging.current = true
    currentOffset.current = 0

    const element = elementRef.current
    if (element) {
      element.style.transition = 'none'
    }
  }, [enabled])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !isDragging.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - startPos.current.x
    const deltaY = touch.clientY - startPos.current.y

    let offset = 0
    const isValid = (() => {
      switch (direction) {
        case 'down':
          offset = Math.max(0, deltaY)
          return deltaY > 0
        case 'up':
          offset = Math.min(0, deltaY)
          return deltaY < 0
        case 'left':
          offset = Math.min(0, deltaX)
          return deltaX < 0
        case 'right':
          offset = Math.max(0, deltaX)
          return deltaX > 0
        default:
          return false
      }
    })()

    if (isValid) {
      // Apply rubber-band resistance when past threshold
      if (Math.abs(offset) > threshold) {
        const excess = Math.abs(offset) - threshold
        const sign = offset >= 0 ? 1 : -1
        offset = sign * (threshold + excess * 0.3)
      }

      currentOffset.current = offset
      updateElementStyle(offset, false)
    }
  }, [enabled, direction, threshold, updateElementStyle])

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !isDragging.current) return
    isDragging.current = false

    if (Math.abs(currentOffset.current) >= threshold) {
      triggerHaptic()

      // Animate off screen before dismiss
      const finalOffset = direction === 'down' || direction === 'right'
        ? Math.max(currentOffset.current, threshold * 2)
        : Math.min(currentOffset.current, -threshold * 2)

      updateElementStyle(finalOffset, true)

      setTimeout(() => {
        onDismiss()
      }, 200)
    } else {
      // Snap back
      updateElementStyle(0, true)
    }

    currentOffset.current = 0
  }, [enabled, threshold, direction, onDismiss, triggerHaptic, updateElementStyle])

  // Attach passive event listeners
  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  const setRef = useCallback((element: HTMLElement | null) => {
    elementRef.current = element
    if (element) {
      element.style.transform = 'translateY(0)'
      element.style.transition = 'transform 0.3s ease-out'
      element.style.opacity = '1'
    }
  }, [])

  return { ref: setRef }
}

export default useSwipeNavigation

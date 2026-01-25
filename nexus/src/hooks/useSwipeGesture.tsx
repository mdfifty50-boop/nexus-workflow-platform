/**
 * Swipe Gesture Hook
 *
 * Provides swipe-to-delete and other swipe gestures for mobile workflow cards.
 * Uses touch events with visual indicators and haptic feedback.
 */

import { useCallback, useRef, useState, useEffect } from 'react'

export interface SwipeGestureOptions {
  /** Minimum distance in pixels to trigger a swipe action */
  threshold?: number
  /** Direction(s) to allow swiping */
  directions?: ('left' | 'right' | 'up' | 'down')[]
  /** Callback when swipe threshold is reached in any direction */
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  /** Called during swipe with progress (0-1) and direction */
  onSwipeProgress?: (progress: number, direction: 'left' | 'right' | 'up' | 'down') => void
  /** Called when swipe is cancelled (didn't reach threshold) */
  onSwipeCancel?: () => void
  /** Enable haptic feedback (if available) */
  hapticFeedback?: boolean
  /** Maximum swipe distance (limits the drag) */
  maxSwipeDistance?: number
  /** Resistance factor when approaching max distance (0-1) */
  resistance?: number
  /** Whether the swipe is enabled */
  enabled?: boolean
}

export interface SwipeState {
  /** Current horizontal offset in pixels */
  offsetX: number
  /** Current vertical offset in pixels */
  offsetY: number
  /** Whether user is currently swiping */
  isSwiping: boolean
  /** Current swipe direction (if any) */
  direction: 'left' | 'right' | 'up' | 'down' | null
  /** Progress towards threshold (0-1) */
  progress: number
  /** Whether threshold has been reached */
  thresholdReached: boolean
}

export interface SwipeGestureReturn {
  /** State of the current swipe */
  state: SwipeState
  /** Bind these to the swipeable element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
    onMouseDown?: (e: React.MouseEvent) => void
    onMouseMove?: (e: React.MouseEvent) => void
    onMouseUp?: (e: React.MouseEvent) => void
    onMouseLeave?: (e: React.MouseEvent) => void
  }
  /** Style to apply to the element */
  style: React.CSSProperties
  /** Reset the swipe state programmatically */
  reset: () => void
}

const DEFAULT_OPTIONS: Required<SwipeGestureOptions> = {
  threshold: 100,
  directions: ['left', 'right'],
  onSwipeLeft: () => {},
  onSwipeRight: () => {},
  onSwipeUp: () => {},
  onSwipeDown: () => {},
  onSwipeProgress: () => {},
  onSwipeCancel: () => {},
  hapticFeedback: true,
  maxSwipeDistance: 200,
  resistance: 0.5,
  enabled: true
}

/**
 * Hook for adding swipe gesture support to elements
 *
 * @example
 * ```tsx
 * const { handlers, style, state } = useSwipeGesture({
 *   onSwipeLeft: () => handleDelete(),
 *   onSwipeRight: () => handleArchive(),
 *   threshold: 100,
 * })
 *
 * return (
 *   <div {...handlers} style={style}>
 *     {state.isSwiping && <SwipeIndicator direction={state.direction} />}
 *     <CardContent />
 *   </div>
 * )
 * ```
 */
export function useSwipeGesture(options: SwipeGestureOptions = {}): SwipeGestureReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const [state, setState] = useState<SwipeState>({
    offsetX: 0,
    offsetY: 0,
    isSwiping: false,
    direction: null,
    progress: 0,
    thresholdReached: false
  })

  const startPos = useRef({ x: 0, y: 0 })
  const isMouseDown = useRef(false)
  const hasTriggeredHaptic = useRef(false)

  // Reset function
  const reset = useCallback(() => {
    setState({
      offsetX: 0,
      offsetY: 0,
      isSwiping: false,
      direction: null,
      progress: 0,
      thresholdReached: false
    })
    hasTriggeredHaptic.current = false
  }, [])

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (opts.hapticFeedback && !hasTriggeredHaptic.current) {
      if ('vibrate' in navigator) {
        navigator.vibrate(10)
      }
      hasTriggeredHaptic.current = true
    }
  }, [opts.hapticFeedback])

  // Calculate offset with resistance
  const calculateOffset = useCallback((delta: number): number => {
    const sign = delta >= 0 ? 1 : -1
    const absDelta = Math.abs(delta)

    if (absDelta <= opts.maxSwipeDistance) {
      return delta
    }

    // Apply resistance beyond max distance
    const overflow = absDelta - opts.maxSwipeDistance
    const resistedOverflow = overflow * opts.resistance
    return sign * (opts.maxSwipeDistance + resistedOverflow)
  }, [opts.maxSwipeDistance, opts.resistance])

  // Determine swipe direction based on delta
  const getDirection = useCallback((deltaX: number, deltaY: number): 'left' | 'right' | 'up' | 'down' | null => {
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Require minimum movement to determine direction
    if (absX < 10 && absY < 10) return null

    // Check if horizontal or vertical swipe
    if (absX > absY) {
      const dir = deltaX > 0 ? 'right' : 'left'
      return opts.directions.includes(dir) ? dir : null
    } else {
      const dir = deltaY > 0 ? 'down' : 'up'
      return opts.directions.includes(dir) ? dir : null
    }
  }, [opts.directions])

  // Handle move (shared between touch and mouse)
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!opts.enabled) return

    const deltaX = clientX - startPos.current.x
    const deltaY = clientY - startPos.current.y

    const direction = getDirection(deltaX, deltaY)
    if (!direction && state.direction === null) return

    const activeDirection = direction || state.direction
    const isHorizontal = activeDirection === 'left' || activeDirection === 'right'
    const delta = isHorizontal ? deltaX : deltaY
    const offset = calculateOffset(delta)

    const progress = Math.min(1, Math.abs(delta) / opts.threshold)
    const thresholdReached = Math.abs(delta) >= opts.threshold

    // Trigger haptic when threshold is first reached
    if (thresholdReached && !state.thresholdReached) {
      triggerHaptic()
    }

    setState({
      offsetX: isHorizontal ? offset : 0,
      offsetY: !isHorizontal ? offset : 0,
      isSwiping: true,
      direction: activeDirection,
      progress,
      thresholdReached
    })

    if (activeDirection) {
      opts.onSwipeProgress(progress, activeDirection)
    }
  }, [opts, state.direction, state.thresholdReached, getDirection, calculateOffset, triggerHaptic])

  // Handle end (shared between touch and mouse)
  const handleEnd = useCallback(() => {
    if (!state.isSwiping) return

    if (state.thresholdReached && state.direction) {
      // Trigger the appropriate callback
      switch (state.direction) {
        case 'left':
          opts.onSwipeLeft()
          break
        case 'right':
          opts.onSwipeRight()
          break
        case 'up':
          opts.onSwipeUp()
          break
        case 'down':
          opts.onSwipeDown()
          break
      }
    } else {
      opts.onSwipeCancel()
    }

    // Animate back to original position
    reset()
  }, [state, opts, reset])

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!opts.enabled) return
    const touch = e.touches[0]
    startPos.current = { x: touch.clientX, y: touch.clientY }
    hasTriggeredHaptic.current = false
  }, [opts.enabled])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)

    // Prevent scroll if swiping horizontally
    if (state.direction === 'left' || state.direction === 'right') {
      e.preventDefault()
    }
  }, [handleMove, state.direction])

  const onTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Mouse handlers (for desktop testing)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!opts.enabled) return
    isMouseDown.current = true
    startPos.current = { x: e.clientX, y: e.clientY }
    hasTriggeredHaptic.current = false
  }, [opts.enabled])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isMouseDown.current) return
    handleMove(e.clientX, e.clientY)
  }, [handleMove])

  const onMouseUp = useCallback(() => {
    if (!isMouseDown.current) return
    isMouseDown.current = false
    handleEnd()
  }, [handleEnd])

  const onMouseLeave = useCallback(() => {
    if (!isMouseDown.current) return
    isMouseDown.current = false
    reset()
    opts.onSwipeCancel()
  }, [reset, opts])

  // Compute transform style
  const style: React.CSSProperties = {
    transform: `translate(${state.offsetX}px, ${state.offsetY}px)`,
    transition: state.isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    touchAction: opts.directions.includes('left') || opts.directions.includes('right')
      ? 'pan-y'
      : 'pan-x'
  }

  return {
    state,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave
    },
    style,
    reset
  }
}

/**
 * Component to show swipe action indicators
 */
export interface SwipeIndicatorProps {
  direction: 'left' | 'right' | 'up' | 'down' | null
  progress: number
  leftLabel?: string
  rightLabel?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  leftColor?: string
  rightColor?: string
}

/**
 * Hook to detect if device supports touch
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  return isTouch
}

export default useSwipeGesture

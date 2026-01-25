import { useEffect, useState, useCallback, useRef, type RefObject } from 'react'

interface StaggerOptions {
  /** Base delay before animation starts (ms) */
  baseDelay?: number
  /** Delay between each item (ms) */
  staggerDelay?: number
  /** Animation duration for each item (ms) */
  duration?: number
  /** Whether to trigger animation (default: true) */
  enabled?: boolean
  /** Reset animation when items change */
  resetOnChange?: boolean
  /** Trigger animation when element enters viewport */
  triggerOnVisible?: boolean
  /** Viewport threshold for intersection (0-1) */
  visibilityThreshold?: number
}

interface StaggerResult {
  /** Array of animation states for each item */
  itemStates: boolean[]
  /** Check if specific item should be visible */
  isVisible: (index: number) => boolean
  /** Get inline styles for item at index */
  getItemStyle: (index: number) => React.CSSProperties
  /** Get className for item at index */
  getItemClassName: (index: number) => string
  /** Manually trigger animation */
  triggerAnimation: () => void
  /** Reset animation state */
  resetAnimation: () => void
  /** Whether animation has completed for all items */
  isComplete: boolean
  /** Ref to attach to container for visibility detection */
  containerRef: RefObject<HTMLDivElement | null>
}

/**
 * useStaggerAnimation - Hook for staggered entrance animations on lists
 * Creates a cascading reveal effect where items animate in sequence
 *
 * @example
 * ```tsx
 * const { getItemStyle, getItemClassName } = useStaggerAnimation(items.length)
 *
 * return (
 *   <ul>
 *     {items.map((item, i) => (
 *       <li key={item.id} style={getItemStyle(i)} className={getItemClassName(i)}>
 *         {item.name}
 *       </li>
 *     ))}
 *   </ul>
 * )
 * ```
 */
export function useStaggerAnimation(
  itemCount: number,
  options: StaggerOptions = {}
): StaggerResult {
  const {
    baseDelay = 50,
    staggerDelay = 60,
    duration = 400,
    enabled = true,
    resetOnChange = true,
    triggerOnVisible = false,
    visibilityThreshold = 0.1
  } = options

  const [itemStates, setItemStates] = useState<boolean[]>(() =>
    Array(itemCount).fill(!enabled)
  )
  const [hasTriggered, setHasTriggered] = useState(!enabled)
  const [isInView, setIsInView] = useState(!triggerOnVisible)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  // Intersection observer for visibility trigger
  useEffect(() => {
    if (!triggerOnVisible || !containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true)
        }
      },
      { threshold: visibilityThreshold }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [triggerOnVisible, visibilityThreshold, isInView])

  // Reset states when item count changes
  useEffect(() => {
    if (resetOnChange) {
      setItemStates(Array(itemCount).fill(false))
      setHasTriggered(false)
    }
  }, [itemCount, resetOnChange])

  // Trigger animation sequence
  const triggerAnimation = useCallback(() => {
    if (hasTriggered && !resetOnChange) return

    // Clear existing timeouts
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    // Reset to hidden state
    setItemStates(Array(itemCount).fill(false))

    // Animate each item with stagger
    for (let i = 0; i < itemCount; i++) {
      const delay = baseDelay + i * staggerDelay
      const timeout = setTimeout(() => {
        setItemStates(prev => {
          const next = [...prev]
          next[i] = true
          return next
        })
      }, delay)
      timeoutsRef.current.push(timeout)
    }

    setHasTriggered(true)
  }, [itemCount, baseDelay, staggerDelay, hasTriggered, resetOnChange])

  // Reset animation
  const resetAnimation = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    setItemStates(Array(itemCount).fill(false))
    setHasTriggered(false)
    if (triggerOnVisible) setIsInView(false)
  }, [itemCount, triggerOnVisible])

  // Trigger animation when enabled and visible
  useEffect(() => {
    if (enabled && isInView && !hasTriggered) {
      triggerAnimation()
    }
  }, [enabled, isInView, hasTriggered, triggerAnimation])

  // Check if item is visible
  const isVisible = useCallback(
    (index: number) => itemStates[index] ?? false,
    [itemStates]
  )

  // Get inline styles for item
  const getItemStyle = useCallback(
    (index: number): React.CSSProperties => ({
      opacity: itemStates[index] ? 1 : 0,
      transform: itemStates[index]
        ? 'translateY(0) scale(1)'
        : 'translateY(16px) scale(0.98)',
      transition: `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      transitionDelay: '0ms'
    }),
    [itemStates, duration]
  )

  // Get className for item
  const getItemClassName = useCallback(
    (index: number): string =>
      itemStates[index] ? 'stagger-item-visible' : 'stagger-item-hidden',
    [itemStates]
  )

  // Check if all items are visible
  const isComplete = itemStates.every(Boolean)

  return {
    itemStates,
    isVisible,
    getItemStyle,
    getItemClassName,
    triggerAnimation,
    resetAnimation,
    isComplete,
    containerRef
  }
}

/**
 * useStaggeredList - Simplified hook for common list stagger pattern
 * Returns CSS class name approach for cleaner JSX
 */
export function useStaggeredList<T>(
  items: T[],
  options: Omit<StaggerOptions, 'resetOnChange'> = {}
) {
  const {
    itemStates,
    getItemStyle,
    containerRef,
    triggerAnimation,
    isComplete
  } = useStaggerAnimation(items.length, {
    ...options,
    resetOnChange: true
  })

  return {
    items: items.map((item, index) => ({
      item,
      style: getItemStyle(index),
      isVisible: itemStates[index] ?? false
    })),
    containerRef,
    triggerAnimation,
    isComplete
  }
}

/**
 * StaggerAnimationStyles - CSS to include for stagger animations
 * Import and render once in your app
 */
export function StaggerAnimationStyles(): React.ReactNode {
  return (
    <style>{`
      .stagger-item-hidden {
        opacity: 0;
        transform: translateY(16px) scale(0.98);
      }

      .stagger-item-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
        transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Alternative slide-left entrance */
      .stagger-slide-left.stagger-item-hidden {
        transform: translateX(-20px) scale(0.98);
      }

      .stagger-slide-left.stagger-item-visible {
        transform: translateX(0) scale(1);
      }

      /* Alternative slide-right entrance */
      .stagger-slide-right.stagger-item-hidden {
        transform: translateX(20px) scale(0.98);
      }

      .stagger-slide-right.stagger-item-visible {
        transform: translateX(0) scale(1);
      }

      /* Scale entrance */
      .stagger-scale.stagger-item-hidden {
        transform: scale(0.9);
      }

      .stagger-scale.stagger-item-visible {
        transform: scale(1);
      }

      /* Fade only */
      .stagger-fade.stagger-item-hidden {
        transform: none;
      }

      .stagger-fade.stagger-item-visible {
        transform: none;
      }
    `}</style>
  )
}

export default useStaggerAnimation

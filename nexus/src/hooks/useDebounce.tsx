/**
 * Input Debouncing Hooks
 *
 * Provides debouncing for user inputs, useful for search fields and auto-save.
 * Default delay is 300ms.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

// =============================================================================
// TYPES
// =============================================================================

export interface DebouncedState<T> {
  value: T
  debouncedValue: T
  setValue: (value: T) => void
  isPending: boolean
  flush: () => void
  cancel: () => void
}

export interface DebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>> {
  (...args: Parameters<T>): void
  flush: () => void
  cancel: () => void
  isPending: () => boolean
}

// =============================================================================
// DEFAULT DELAY
// =============================================================================

export const DEFAULT_DEBOUNCE_DELAY = 300

// =============================================================================
// useDebounce - Simple debounced value
// =============================================================================

/**
 * Debounces a value with the specified delay
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in ms (default: 300)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 300)
 *
 * useEffect(() => {
 *   // Only runs 300ms after user stops typing
 *   performSearch(debouncedSearch)
 * }, [debouncedSearch])
 * ```
 */
export function useDebounce<T>(value: T, delay: number = DEFAULT_DEBOUNCE_DELAY): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// =============================================================================
// useDebouncedState - Debounced state with controls
// =============================================================================

/**
 * Provides debounced state with additional controls like flush and cancel
 *
 * @param initialValue - Initial state value
 * @param delay - Debounce delay in ms (default: 300)
 * @returns Object with value, debouncedValue, setValue, isPending, flush, cancel
 *
 * @example
 * ```tsx
 * const { value, debouncedValue, setValue, isPending, flush } = useDebouncedState('', 300)
 *
 * // User types in input
 * <input value={value} onChange={e => setValue(e.target.value)} />
 *
 * // Show pending indicator
 * {isPending && <span>Saving...</span>}
 *
 * // Force immediate update
 * <button onClick={flush}>Save Now</button>
 * ```
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = DEFAULT_DEBOUNCE_DELAY
): DebouncedState<T> {
  const [value, setValueInternal] = useState<T>(initialValue)
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue)
  const [isPending, setIsPending] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestValueRef = useRef<T>(initialValue)

  // Update latest value ref
  latestValueRef.current = value

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  // Set value with debounce
  const setValue = useCallback((newValue: T) => {
    setValueInternal(newValue)
    setIsPending(true)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(newValue)
      setIsPending(false)
      timerRef.current = null
    }, delay)
  }, [delay])

  // Flush: immediately apply pending value
  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setDebouncedValue(latestValueRef.current)
    setIsPending(false)
  }, [])

  // Cancel: revert to last debounced value
  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setValueInternal(debouncedValue)
    setIsPending(false)
  }, [debouncedValue])

  return {
    value,
    debouncedValue,
    setValue,
    isPending,
    flush,
    cancel
  }
}

// =============================================================================
// useDebouncedCallback - Debounced function callback
// =============================================================================

/**
 * Creates a debounced version of a callback function
 *
 * @param callback - The function to debounce
 * @param delay - Debounce delay in ms (default: 300)
 * @param deps - Dependencies for the callback (similar to useCallback)
 * @returns Debounced function with flush, cancel, and isPending methods
 *
 * @example
 * ```tsx
 * const debouncedSave = useDebouncedCallback(
 *   async (data) => {
 *     await api.save(data)
 *   },
 *   500,
 *   [api]
 * )
 *
 * // Call multiple times - only executes once after 500ms
 * debouncedSave(formData)
 *
 * // Force immediate execution
 * debouncedSave.flush()
 *
 * // Check if there's a pending call
 * if (debouncedSave.isPending()) { ... }
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = DEFAULT_DEBOUNCE_DELAY,
  deps: React.DependencyList = []
): DebouncedCallback<T> {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef<T>(callback)
  const argsRef = useRef<Parameters<T> | null>(null)
  const isPendingRef = useRef(false)

  // Update callback ref when it changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    callbackRef.current = callback
  }, [callback, ...deps])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const debouncedFn = useMemo(() => {
    const fn: DebouncedCallback<T> = ((...args: Parameters<T>) => {
      argsRef.current = args
      isPendingRef.current = true

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        if (argsRef.current) {
          callbackRef.current(...argsRef.current)
        }
        isPendingRef.current = false
        timerRef.current = null
        argsRef.current = null
      }, delay)
    }) as DebouncedCallback<T>

    fn.flush = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (argsRef.current) {
        callbackRef.current(...argsRef.current)
        argsRef.current = null
      }
      isPendingRef.current = false
    }

    fn.cancel = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      isPendingRef.current = false
      argsRef.current = null
    }

    fn.isPending = () => isPendingRef.current

    return fn
  }, [delay])

  return debouncedFn
}

// =============================================================================
// useThrottle - Throttled value (similar but different timing)
// =============================================================================

/**
 * Throttles a value - updates at most once per delay period
 * Unlike debounce, throttle triggers at the START of the delay
 *
 * @param value - The value to throttle
 * @param delay - Throttle delay in ms (default: 300)
 * @returns The throttled value
 *
 * @example
 * ```tsx
 * const [scrollY, setScrollY] = useState(0)
 * const throttledScrollY = useThrottle(scrollY, 100)
 *
 * // Updates at most 10 times per second
 * useEffect(() => {
 *   updateScrollIndicator(throttledScrollY)
 * }, [throttledScrollY])
 * ```
 */
export function useThrottle<T>(value: T, delay: number = DEFAULT_DEBOUNCE_DELAY): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastUpdatedRef = useRef<number>(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdatedRef.current

    if (timeSinceLastUpdate >= delay) {
      // Enough time has passed, update immediately
      setThrottledValue(value)
      lastUpdatedRef.current = now
    } else {
      // Schedule update for when delay expires
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        setThrottledValue(value)
        lastUpdatedRef.current = Date.now()
        timerRef.current = null
      }, delay - timeSinceLastUpdate)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [value, delay])

  return throttledValue
}

// =============================================================================
// useDebounceEffect - Effect that only runs after debounce
// =============================================================================

/**
 * Runs an effect only after the value has stopped changing for the delay period
 *
 * @param effect - Effect callback to run
 * @param deps - Dependencies that trigger the debounced effect
 * @param delay - Debounce delay in ms (default: 300)
 *
 * @example
 * ```tsx
 * useDebounceEffect(
 *   () => {
 *     // Only runs 300ms after search term stops changing
 *     performSearch(searchTerm)
 *   },
 *   [searchTerm],
 *   300
 * )
 * ```
 */
export function useDebounceEffect(
  effect: React.EffectCallback,
  deps: React.DependencyList,
  delay: number = DEFAULT_DEBOUNCE_DELAY
): void {
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip on first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const timer = setTimeout(() => {
      effect()
    }, delay)

    return () => {
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay])
}

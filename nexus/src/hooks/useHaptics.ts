/**
 * useHaptics Hook - Vibration feedback for mobile
 *
 * Provides haptic feedback on supported devices for key actions
 * like button presses, success states, and errors.
 */

import { useCallback, useMemo } from 'react'

/**
 * Haptic feedback intensity levels
 */
export type HapticIntensity = 'light' | 'medium' | 'heavy'

/**
 * Haptic feedback patterns for different events
 */
export type HapticPattern = 'success' | 'error' | 'warning' | 'selection' | 'impact'

/**
 * Vibration patterns in milliseconds
 */
const VIBRATION_PATTERNS: Record<HapticPattern, number[]> = {
  // Quick tap for selections
  selection: [10],
  // Single medium pulse for impact
  impact: [25],
  // Double pulse for success
  success: [15, 50, 30],
  // Triple pulse for error (attention-grabbing)
  error: [30, 50, 30, 50, 30],
  // Single long pulse for warning
  warning: [40, 30, 20]
}

/**
 * Intensity-based vibration durations
 */
const INTENSITY_DURATIONS: Record<HapticIntensity, number> = {
  light: 10,
  medium: 25,
  heavy: 50
}

interface UseHapticsOptions {
  /** Whether haptics are enabled (default: true) */
  enabled?: boolean
  /** Fallback behavior when vibration not supported */
  fallback?: 'none' | 'audio'
}

interface UseHapticsReturn {
  /** Whether the device supports haptic feedback */
  isSupported: boolean
  /** Trigger haptic feedback by intensity */
  trigger: (intensity?: HapticIntensity) => void
  /** Trigger haptic pattern by event type */
  pattern: (type: HapticPattern) => void
  /** Custom vibration pattern */
  vibrate: (pattern: number | number[]) => void
  /** Cancel ongoing vibration */
  cancel: () => void
}

/**
 * Check if the Vibration API is supported
 */
function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

/**
 * useHaptics - Hook for haptic/vibration feedback
 *
 * Provides a consistent API for triggering haptic feedback across
 * different devices and browsers that support the Vibration API.
 *
 * @example
 * ```tsx
 * const { trigger, pattern, isSupported } = useHaptics()
 *
 * // Simple intensity-based feedback
 * <button onClick={() => trigger('medium')}>Click me</button>
 *
 * // Pattern-based feedback
 * <button onClick={() => pattern('success')}>Submit</button>
 *
 * // Custom vibration pattern
 * const { vibrate } = useHaptics()
 * vibrate([100, 50, 100]) // vibrate-pause-vibrate
 * ```
 */
export function useHaptics(options: UseHapticsOptions = {}): UseHapticsReturn {
  const { enabled = true } = options

  // Check support on mount
  const isSupported = useMemo(() => isVibrationSupported(), [])

  /**
   * Execute vibration if supported and enabled
   */
  const executeVibration = useCallback((pattern: number | number[]): boolean => {
    if (!enabled || !isSupported) return false

    try {
      return navigator.vibrate(pattern)
    } catch (e) {
      console.warn('[useHaptics] Vibration failed:', e)
      return false
    }
  }, [enabled, isSupported])

  /**
   * Trigger simple intensity-based haptic
   */
  const trigger = useCallback((intensity: HapticIntensity = 'medium') => {
    const duration = INTENSITY_DURATIONS[intensity]
    executeVibration(duration)
  }, [executeVibration])

  /**
   * Trigger pattern-based haptic for events
   */
  const pattern = useCallback((type: HapticPattern) => {
    const vibrationPattern = VIBRATION_PATTERNS[type]
    if (vibrationPattern) {
      executeVibration(vibrationPattern)
    }
  }, [executeVibration])

  /**
   * Custom vibration pattern
   */
  const vibrate = useCallback((customPattern: number | number[]) => {
    executeVibration(customPattern)
  }, [executeVibration])

  /**
   * Cancel any ongoing vibration
   */
  const cancel = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(0)
    }
  }, [isSupported])

  return {
    isSupported,
    trigger,
    pattern,
    vibrate,
    cancel
  }
}

/**
 * Utility function for quick haptic triggers outside of components
 * Use sparingly - prefer the hook for proper React integration
 */
export function triggerHaptic(intensity: HapticIntensity = 'medium'): boolean {
  if (!isVibrationSupported()) return false

  try {
    const duration = INTENSITY_DURATIONS[intensity]
    return navigator.vibrate(duration)
  } catch {
    return false
  }
}

/**
 * Utility function for quick pattern triggers outside of components
 */
export function triggerHapticPattern(type: HapticPattern): boolean {
  if (!isVibrationSupported()) return false

  try {
    const pattern = VIBRATION_PATTERNS[type]
    return navigator.vibrate(pattern)
  } catch {
    return false
  }
}

/**
 * Higher-order function to wrap event handlers with haptic feedback
 *
 * @example
 * ```tsx
 * const handleClick = withHaptic(() => {
 *   console.log('Clicked!')
 * }, 'light')
 *
 * <button onClick={handleClick}>Click me</button>
 * ```
 */
export function withHaptic<T extends (...args: unknown[]) => unknown>(
  handler: T,
  intensity: HapticIntensity = 'medium'
): T {
  return ((...args: unknown[]) => {
    triggerHaptic(intensity)
    return handler(...args)
  }) as T
}

/**
 * Higher-order function to wrap event handlers with pattern-based haptic
 */
export function withHapticPattern<T extends (...args: unknown[]) => unknown>(
  handler: T,
  pattern: HapticPattern
): T {
  return ((...args: unknown[]) => {
    triggerHapticPattern(pattern)
    return handler(...args)
  }) as T
}

export default useHaptics

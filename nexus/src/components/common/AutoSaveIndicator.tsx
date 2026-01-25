/**
 * AutoSaveIndicator Component
 * Displays a brief visual confirmation when context is auto-saved
 * Can be used for any auto-save scenario (address saved, settings updated, etc.)
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface AutoSaveIndicatorProps {
  /**
   * What was saved (e.g., "Address saved", "Settings updated")
   * Required: must describe what was auto-saved
   */
  message?: string

  /**
   * Duration in milliseconds before auto-dismiss (default: 2000ms)
   */
  duration?: number

  /**
   * Optional custom icon to display
   * Defaults to checkmark icon
   */
  icon?: ReactNode

  /**
   * Custom CSS classes to apply to the container
   */
  className?: string

  /**
   * Callback when indicator dismisses
   */
  onDismiss?: () => void

  /**
   * Position on screen
   * @default 'top-right'
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

  /**
   * Whether to show a subtle close button
   * @default false
   */
  dismissible?: boolean

  /**
   * Animation variant
   * @default 'fade'
   */
  variant?: 'fade' | 'slide' | 'bounce'
}

// Default checkmark icon
const defaultIcon = (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
)

const positionClasses: Record<string, string> = {
  'top-right': 'top-20 right-4',
  'top-left': 'top-20 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-20 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
}

export function AutoSaveIndicator({
  message = 'Saved',
  duration = 2000,
  icon = defaultIcon,
  className,
  onDismiss,
  position = 'top-right',
  dismissible = false,
  variant = 'fade',
}: AutoSaveIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  // Entrance animation - trigger on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  // Auto-dismiss timer
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss?.()
    }, 200)
  }, [onDismiss])

  // Determine animation classes based on variant and position
  const getAnimationClasses = () => {
    const baseTransition = 'transition-all duration-200 ease-out'

    if (variant === 'slide') {
      const slideDirection =
        position.includes('left') ? 'translate-x-0' : '-translate-x-0'
      return cn(
        baseTransition,
        isVisible && !isExiting
          ? `${slideDirection} opacity-100`
          : `${position.includes('left') ? '-translate-x-full' : 'translate-x-full'} opacity-0`
      )
    }

    if (variant === 'bounce') {
      return cn(
        'transition-all duration-300 ease-out',
        isVisible && !isExiting
          ? 'scale-100 opacity-100'
          : 'scale-95 opacity-0'
      )
    }

    // Default fade
    return cn(
      baseTransition,
      isVisible && !isExiting ? 'opacity-100' : 'opacity-0'
    )
  }

  return (
    <div
      className={cn(getAnimationClasses(), className)}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 backdrop-blur-sm',
          'shadow-lg shadow-emerald-500/10'
        )}
      >
        {/* Icon */}
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-emerald-400">
          {icon}
        </div>

        {/* Message text */}
        <span className="whitespace-nowrap text-sm font-medium text-emerald-300">
          {message}
        </span>

        {/* Optional dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={cn(
              'ml-1 flex-shrink-0 rounded p-0.5 transition-colors',
              'text-emerald-400/70 hover:text-emerald-300',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500'
            )}
            aria-label="Dismiss notification"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Container component for managing multiple auto-save indicators
 * Handles positioning and stacking
 */
interface AutoSaveIndicatorContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxIndicators?: number
}

interface IndicatorItem extends AutoSaveIndicatorProps {
  id: string
}

export function AutoSaveIndicatorContainer({
  position = 'top-right',
  maxIndicators = 3,
}: AutoSaveIndicatorContainerProps) {
  const [indicators, setIndicators] = useState<IndicatorItem[]>([])

  // Listen for auto-save events
  useEffect(() => {
    const handleAutoSave = (event: CustomEvent<Omit<IndicatorItem, 'id'>>) => {
      const id = `autosave-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setIndicators((prev) => [
        ...prev.slice(-(maxIndicators - 1)),
        { ...event.detail, id },
      ])
    }

    window.addEventListener('nexus:autosave' as any, handleAutoSave)
    return () => window.removeEventListener('nexus:autosave' as any, handleAutoSave)
  }, [maxIndicators])

  const removeIndicator = useCallback((id: string) => {
    setIndicators((prev) => prev.filter((i) => i.id !== id))
  }, [])

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2',
        positionClasses[position]
      )}
      role="region"
      aria-label="Auto-save notifications"
    >
      {indicators.map((indicator) => (
        <AutoSaveIndicator
          key={indicator.id}
          {...indicator}
          onDismiss={() => removeIndicator(indicator.id)}
        />
      ))}
    </div>
  )
}

/**
 * Imperative function to trigger auto-save indicator
 * Usage: showAutoSave({ message: 'Address saved' })
 */
export function showAutoSave(options: Omit<AutoSaveIndicatorProps, 'onDismiss'>) {
  const event = new CustomEvent('nexus:autosave', { detail: options })
  window.dispatchEvent(event)
}

// Convenience methods
showAutoSave.success = (message?: string, options?: Partial<AutoSaveIndicatorProps>) => {
  showAutoSave({ message: message || 'Saved', icon: defaultIcon, ...options })
}

showAutoSave.address = (options?: Partial<AutoSaveIndicatorProps>) => {
  showAutoSave({ message: 'Address saved', ...options })
}

showAutoSave.settings = (options?: Partial<AutoSaveIndicatorProps>) => {
  showAutoSave({ message: 'Settings saved', ...options })
}

showAutoSave.data = (message?: string, options?: Partial<AutoSaveIndicatorProps>) => {
  showAutoSave({ message: message || 'Data saved', ...options })
}

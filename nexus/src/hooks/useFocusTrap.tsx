/**
 * useFocusTrap - Accessibility focus management hook
 *
 * Provides proper focus trapping within modals and dialogs,
 * with focus return on close for keyboard-only navigation support.
 *
 * @module hooks/useFocusTrap
 */

import { useEffect, useRef, useCallback } from 'react'

interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  isActive: boolean
  /** Callback when Escape key is pressed */
  onEscape?: () => void
  /** Whether to automatically focus the first focusable element */
  autoFocus?: boolean
  /** Whether to return focus to the previously focused element on close */
  returnFocus?: boolean
  /** Selector for the initial focus element (defaults to first focusable) */
  initialFocusSelector?: string
}

interface FocusTrapReturn {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Manually focus the first focusable element */
  focusFirst: () => void
  /** Manually focus the last focusable element */
  focusLast: () => void
}

// Focusable element selectors
const FOCUSABLE_SELECTORS = [
  'button:not([disabled]):not([aria-hidden="true"])',
  '[href]:not([aria-hidden="true"])',
  'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"])',
  'select:not([disabled]):not([aria-hidden="true"])',
  'textarea:not([disabled]):not([aria-hidden="true"])',
  '[tabindex]:not([tabindex="-1"]):not([disabled]):not([aria-hidden="true"])',
  '[contenteditable="true"]:not([aria-hidden="true"])',
].join(', ')

/**
 * Custom hook for managing focus within a container (modal, dialog, etc.)
 * Implements proper focus trapping and returns focus on close.
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose, children }) {
 *   const { containerRef } = useFocusTrap({
 *     isActive: isOpen,
 *     onEscape: onClose,
 *     autoFocus: true,
 *     returnFocus: true
 *   })
 *
 *   return (
 *     <div ref={containerRef} role="dialog" aria-modal="true">
 *       {children}
 *     </div>
 *   )
 * }
 * ```
 */
export function useFocusTrap({
  isActive,
  onEscape,
  autoFocus = true,
  returnFocus = true,
  initialFocusSelector
}: UseFocusTrapOptions): FocusTrapReturn {
  const containerRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return []
    const elements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    return Array.from(elements).filter(el => {
      // Additional visibility check
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden'
    })
  }, [])

  // Focus the first focusable element
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements()
    if (elements.length > 0) {
      elements[0].focus()
    } else if (containerRef.current) {
      // If no focusable elements, focus the container itself
      containerRef.current.focus()
    }
  }, [getFocusableElements])

  // Focus the last focusable element
  const focusLast = useCallback(() => {
    const elements = getFocusableElements()
    if (elements.length > 0) {
      elements[elements.length - 1].focus()
    }
  }, [getFocusableElements])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return

    const container = containerRef.current
    if (!container) return

    // Store the previously focused element
    if (returnFocus) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement
    }

    // Auto-focus on activation
    if (autoFocus) {
      // Small delay to ensure the modal is rendered
      requestAnimationFrame(() => {
        if (initialFocusSelector) {
          const initialElement = container.querySelector<HTMLElement>(initialFocusSelector)
          if (initialElement) {
            initialElement.focus()
            return
          }
        }
        focusFirst()
      })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault()
        event.stopPropagation()
        onEscape()
        return
      }

      // Handle Tab key for focus trapping
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements()
        if (focusableElements.length === 0) {
          event.preventDefault()
          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        const activeElement = document.activeElement as HTMLElement

        if (event.shiftKey) {
          // Shift + Tab: moving backwards
          if (activeElement === firstElement || !container.contains(activeElement)) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab: moving forwards
          if (activeElement === lastElement || !container.contains(activeElement)) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    // Add event listener to the document to catch all key events
    document.addEventListener('keydown', handleKeyDown, true)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)

      // Return focus to the previously focused element
      if (returnFocus && previouslyFocusedRef.current) {
        // Small delay to ensure the modal is unmounted
        requestAnimationFrame(() => {
          if (previouslyFocusedRef.current && document.body.contains(previouslyFocusedRef.current)) {
            previouslyFocusedRef.current.focus()
          }
        })
      }
    }
  }, [isActive, onEscape, autoFocus, returnFocus, initialFocusSelector, focusFirst, getFocusableElements])

  // Prevent focus from leaving the container via mouse click outside
  useEffect(() => {
    if (!isActive) return

    const handleFocusIn = (event: FocusEvent) => {
      const container = containerRef.current
      if (!container) return

      const target = event.target as HTMLElement
      if (!container.contains(target)) {
        event.stopPropagation()
        focusFirst()
      }
    }

    document.addEventListener('focusin', handleFocusIn)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [isActive, focusFirst])

  return {
    containerRef,
    focusFirst,
    focusLast
  }
}

/**
 * Hook to manage focus return without full trap
 * Useful for components that need focus return but not trapping
 */
export function useFocusReturn(isActive: boolean) {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isActive) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement
    } else if (previouslyFocusedRef.current) {
      requestAnimationFrame(() => {
        if (previouslyFocusedRef.current && document.body.contains(previouslyFocusedRef.current)) {
          previouslyFocusedRef.current.focus()
        }
      })
    }
  }, [isActive])

  return previouslyFocusedRef
}

export default useFocusTrap

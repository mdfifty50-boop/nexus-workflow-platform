/**
 * BottomSheet Component - Mobile-friendly modal
 *
 * A sliding panel from the bottom of the screen, optimized for mobile
 * with swipe-to-dismiss gesture support and keyboard avoidance.
 *
 * Features:
 * - Smooth slide-up/down animations
 * - Swipe-to-dismiss gesture
 * - Backdrop blur and click-to-close
 * - Safe area inset support
 * - Keyboard avoidance (adjusts height when virtual keyboard appears)
 * - Configurable heights
 */

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// =============================================================================
// KEYBOARD DETECTION HOOK
// =============================================================================

function useKeyboardAvoidance() {
  const [keyboardState, setKeyboardState] = useState({
    isVisible: false,
    height: 0
  })

  useEffect(() => {
    const viewport = window.visualViewport

    if (!viewport) return

    let initialHeight = viewport.height

    const handleResize = () => {
      const currentHeight = viewport.height
      const heightDiff = initialHeight - currentHeight

      // Consider keyboard visible if height difference is significant (> 150px)
      if (heightDiff > 150) {
        setKeyboardState({
          isVisible: true,
          height: heightDiff
        })
      } else {
        setKeyboardState({
          isVisible: false,
          height: 0
        })
        // Update initial height when keyboard closes
        initialHeight = currentHeight
      }
    }

    // Initial height capture
    initialHeight = viewport.height

    viewport.addEventListener('resize', handleResize)
    viewport.addEventListener('scroll', handleResize)

    return () => {
      viewport.removeEventListener('resize', handleResize)
      viewport.removeEventListener('scroll', handleResize)
    }
  }, [])

  return keyboardState
}

interface BottomSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean
  /** Callback when sheet should close */
  onClose: () => void
  /** Sheet content */
  children: ReactNode
  /** Title displayed in header */
  title?: string
  /** Height of sheet: 'auto' | 'half' | 'full' | number (px) */
  height?: 'auto' | 'half' | 'full' | number
  /** Whether to show drag handle */
  showHandle?: boolean
  /** Whether swipe to dismiss is enabled */
  swipeToDismiss?: boolean
  /** Threshold for swipe dismiss (0-1, default 0.3 = 30%) */
  dismissThreshold?: number
  /** Additional class names */
  className?: string
  /** Header actions (right side) */
  headerActions?: ReactNode
  /** Whether to close on backdrop click */
  closeOnBackdrop?: boolean
  /** Animation duration in ms */
  animationDuration?: number
  /** Whether to adjust for virtual keyboard */
  keyboardAvoidance?: boolean
  /** Sticky footer content (stays at bottom, above keyboard) */
  stickyFooter?: ReactNode
}

/**
 * BottomSheet - Mobile-optimized modal sliding from bottom
 *
 * Features:
 * - Smooth slide-up/down animations
 * - Swipe-to-dismiss gesture
 * - Backdrop blur and click-to-close
 * - Safe area inset support
 * - Configurable heights
 *
 * @example
 * ```tsx
 * <BottomSheet
 *   isOpen={showActions}
 *   onClose={() => setShowActions(false)}
 *   title="Workflow Actions"
 * >
 *   <WorkflowActionsList />
 * </BottomSheet>
 * ```
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  height = 'auto',
  showHandle = true,
  swipeToDismiss = true,
  dismissThreshold = 0.3,
  className = '',
  headerActions,
  closeOnBackdrop = true,
  animationDuration = 300,
  keyboardAvoidance = true,
  stickyFooter
}: BottomSheetProps) {
  // Keyboard state for avoiding virtual keyboard
  const keyboard = useKeyboardAvoidance()
  const [isAnimating, setIsAnimating] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const sheetRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number>(0)
  const currentYRef = useRef<number>(0)
  const sheetHeightRef = useRef<number>(0)

  // Calculate sheet height based on prop
  const getSheetHeight = useCallback(() => {
    switch (height) {
      case 'auto':
        return 'auto'
      case 'half':
        return '50vh'
      case 'full':
        return '95vh'
      default:
        return typeof height === 'number' ? `${height}px` : 'auto'
    }
  }, [height])

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Trigger animation after mount
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    } else if (isVisible) {
      setIsAnimating(false)
      // Wait for animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false)
        setDragOffset(0)
      }, animationDuration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isVisible, animationDuration])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Touch start handler
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!swipeToDismiss) return

    const touch = e.touches[0]
    startYRef.current = touch.clientY
    currentYRef.current = touch.clientY

    if (sheetRef.current) {
      sheetHeightRef.current = sheetRef.current.offsetHeight
    }

    setIsDragging(true)
  }, [swipeToDismiss])

  // Touch move handler
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeToDismiss || !isDragging) return

    const touch = e.touches[0]
    currentYRef.current = touch.clientY

    const delta = currentYRef.current - startYRef.current

    // Only allow dragging down
    if (delta > 0) {
      // Apply resistance at the end
      const resistance = Math.min(1, 1 - delta / (sheetHeightRef.current * 2))
      const offset = delta * resistance
      setDragOffset(offset)
    }
  }, [swipeToDismiss, isDragging])

  // Touch end handler
  const handleTouchEnd = useCallback(() => {
    if (!swipeToDismiss || !isDragging) return

    setIsDragging(false)

    // Check if dragged past threshold
    const dragPercent = dragOffset / sheetHeightRef.current

    if (dragPercent > dismissThreshold) {
      onClose()
    } else {
      // Snap back
      setDragOffset(0)
    }
  }, [swipeToDismiss, isDragging, dragOffset, dismissThreshold, onClose])

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdrop) {
      onClose()
    }
  }, [closeOnBackdrop, onClose])

  if (!isVisible) return null

  // Calculate max height considering keyboard
  const calculateMaxHeight = () => {
    if (keyboardAvoidance && keyboard.isVisible) {
      return `calc(95vh - ${keyboard.height}px)`
    }
    return '95vh'
  }

  const sheetStyle = {
    height: getSheetHeight(),
    maxHeight: calculateMaxHeight(),
    transform: isAnimating && dragOffset === 0
      ? 'translateY(0)'
      : `translateY(${isAnimating ? dragOffset : '100%'}px)`,
    transition: isDragging
      ? 'none'
      : `transform ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'bottom-sheet-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className={`
          absolute inset-0 bg-black/60 backdrop-blur-sm
          transition-opacity duration-300
          ${isAnimating ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`
          absolute bottom-0 left-0 right-0
          bg-slate-900 rounded-t-3xl
          border-t border-slate-700/50
          shadow-2xl shadow-black/50
          overflow-hidden
          flex flex-col
          ${className}
        `}
        style={{
          ...sheetStyle,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1 rounded-full bg-slate-600 hover:bg-slate-500 transition-colors" />
          </div>
        )}

        {/* Header */}
        {(title || headerActions) && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50">
            {title && (
              <h2
                id="bottom-sheet-title"
                className="text-lg font-semibold text-white"
              >
                {title}
              </h2>
            )}
            <div className="flex items-center gap-2">
              {headerActions}
              <button
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors touch-manipulation active:scale-95"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>

        {/* Sticky Footer (stays above keyboard) */}
        {stickyFooter && (
          <div
            className="sticky bottom-0 left-0 right-0 border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-sm px-5 py-4"
            style={{
              paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${
                keyboard.isVisible ? '8px' : '16px'
              })`
            }}
          >
            {stickyFooter}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

/**
 * BottomSheetAction - Action button for BottomSheet
 * Pre-styled button for common sheet actions
 */
interface BottomSheetActionProps {
  icon: ReactNode
  label: string
  onClick: () => void
  variant?: 'default' | 'primary' | 'danger'
  disabled?: boolean
  description?: string
}

export function BottomSheetAction({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
  description
}: BottomSheetActionProps) {
  const variantStyles = {
    default: 'hover:bg-slate-800 active:bg-slate-700',
    primary: 'hover:bg-cyan-500/20 text-cyan-400 active:bg-cyan-500/30',
    danger: 'hover:bg-red-500/20 text-red-400 active:bg-red-500/30'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-4 p-4 transition-colors text-left
        ${disabled ? 'opacity-50 cursor-not-allowed' : variantStyles[variant]}
        min-h-[56px] active:scale-[0.98] transform
      `}
    >
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center
        ${variant === 'primary' ? 'bg-cyan-500/20' :
          variant === 'danger' ? 'bg-red-500/20' :
          'bg-slate-800'}
      `}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-white font-medium block">{label}</span>
        {description && (
          <span className="text-sm text-slate-400 block truncate">{description}</span>
        )}
      </div>
      <svg
        className="w-5 h-5 text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

/**
 * BottomSheetDivider - Visual separator for action groups
 */
export function BottomSheetDivider() {
  return <div className="h-px bg-slate-700/50 mx-4 my-2" />
}

/**
 * useBottomSheet - Hook for managing bottom sheet state
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, toggle } = useBottomSheet()
 * ```
 */
export function useBottomSheet(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  return { isOpen, open, close, toggle }
}

export default BottomSheet

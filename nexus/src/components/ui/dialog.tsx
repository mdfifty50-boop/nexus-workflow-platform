/**
 * Dialog Component - Responsive Modal with Mobile Bottom Sheet Support
 *
 * On desktop: Standard centered dialog with backdrop
 * On mobile: Converts to a bottom sheet with drag-to-dismiss
 *
 * Features:
 * - Responsive: Dialog on desktop, bottom sheet on mobile
 * - Keyboard avoidance for mobile
 * - Drag handle and swipe-to-dismiss on mobile
 * - Focus trap and accessibility
 * - Safe area inset support
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
  type ReactNode
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'

// =============================================================================
// CONTEXT
// =============================================================================

interface DialogContextValue {
  isOpen: boolean
  onClose: () => void
  isMobile: boolean
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog')
  }
  return context
}

// =============================================================================
// HOOK: useMediaQuery
// =============================================================================

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

// =============================================================================
// HOOK: useKeyboardVisible
// =============================================================================

function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    // Use visualViewport API for accurate keyboard detection
    const viewport = window.visualViewport

    if (!viewport) return

    const handleResize = () => {
      const viewportHeight = viewport.height
      const windowHeight = window.innerHeight
      const heightDiff = windowHeight - viewportHeight

      // If viewport is significantly smaller than window, keyboard is likely visible
      if (heightDiff > 150) {
        setIsKeyboardVisible(true)
        setKeyboardHeight(heightDiff)
      } else {
        setIsKeyboardVisible(false)
        setKeyboardHeight(0)
      }
    }

    viewport.addEventListener('resize', handleResize)
    return () => viewport.removeEventListener('resize', handleResize)
  }, [])

  return { isKeyboardVisible, keyboardHeight }
}

// =============================================================================
// TYPES
// =============================================================================

interface DialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void
  /** Dialog content */
  children: ReactNode
  /** Force desktop or mobile mode (useful for testing) */
  forceMode?: 'desktop' | 'mobile'
}

interface DialogContentProps {
  children: ReactNode
  className?: string
  /** Size variant for desktop dialog */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Whether to show drag handle on mobile */
  showHandle?: boolean
  /** Whether to allow swipe to dismiss on mobile */
  swipeToDismiss?: boolean
  /** Maximum height on mobile (default: 90vh) */
  mobileMaxHeight?: string
}

interface DialogHeaderProps {
  children: ReactNode
  className?: string
}

interface DialogFooterProps {
  children: ReactNode
  className?: string
  /** Stack buttons vertically on mobile */
  stackOnMobile?: boolean
}

interface DialogTitleProps {
  children: ReactNode
  className?: string
}

interface DialogDescriptionProps {
  children: ReactNode
  className?: string
}

// =============================================================================
// MAIN DIALOG COMPONENT
// =============================================================================

export function Dialog({
  open,
  onOpenChange,
  children,
  forceMode
}: DialogProps) {
  const isMobileQuery = useMediaQuery('(max-width: 640px)')
  const isMobile = forceMode ? forceMode === 'mobile' : isMobileQuery

  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (open) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [open])

  if (!open) return null

  return (
    <DialogContext.Provider value={{ isOpen: open, onClose: handleClose, isMobile }}>
      {children}
    </DialogContext.Provider>
  )
}

// =============================================================================
// DIALOG CONTENT
// =============================================================================

export function DialogContent({
  children,
  className,
  size = 'md',
  showHandle = true,
  swipeToDismiss = true,
  mobileMaxHeight = '90vh'
}: DialogContentProps) {
  const { isOpen, onClose, isMobile } = useDialog()
  const { isKeyboardVisible, keyboardHeight } = useKeyboardVisible()

  const [isVisible, setIsVisible] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const contentHeightRef = useRef(0)

  // Focus trap
  const { containerRef } = useFocusTrap({
    isActive: isOpen,
    onEscape: onClose,
    autoFocus: true,
    returnFocus: true
  })

  // Size variants for desktop
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[95vw]'
  }

  // Animation handling
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
  }, [isOpen])

  // Touch handlers for mobile swipe-to-dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !swipeToDismiss) return

    const touch = e.touches[0]
    startYRef.current = touch.clientY

    if (contentRef.current) {
      contentHeightRef.current = contentRef.current.offsetHeight
    }

    setIsDragging(true)
  }, [isMobile, swipeToDismiss])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !swipeToDismiss || !isDragging) return

    const touch = e.touches[0]
    const delta = touch.clientY - startYRef.current

    // Only allow dragging down
    if (delta > 0) {
      const resistance = Math.min(1, 1 - delta / (contentHeightRef.current * 2))
      setDragOffset(delta * resistance)
    }
  }, [isMobile, swipeToDismiss, isDragging])

  const handleTouchEnd = useCallback(() => {
    if (!isMobile || !swipeToDismiss || !isDragging) return

    setIsDragging(false)

    // Dismiss if dragged more than 30%
    const dragPercent = dragOffset / contentHeightRef.current
    if (dragPercent > 0.3) {
      onClose()
    } else {
      setDragOffset(0)
    }
  }, [isMobile, swipeToDismiss, isDragging, dragOffset, onClose])

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  // Calculate mobile height considering keyboard
  const mobileHeight = isKeyboardVisible
    ? `calc(${mobileMaxHeight} - ${keyboardHeight}px)`
    : mobileMaxHeight

  const content = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex',
        isMobile ? 'items-end' : 'items-center justify-center p-4'
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
          ;(contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }}
        className={cn(
          'relative z-10',
          isMobile
            ? // Mobile: Bottom sheet style
              cn(
                'w-full rounded-t-3xl bg-card border-t border-border',
                'shadow-2xl shadow-black/50',
                'transition-transform duration-300 ease-out',
                !isDragging && 'transition-transform',
                isVisible && dragOffset === 0 ? 'translate-y-0' : ''
              )
            : // Desktop: Centered dialog
              cn(
                'w-full rounded-2xl bg-card border border-border',
                'shadow-2xl animate-in fade-in zoom-in-95 duration-200',
                sizeClasses[size]
              ),
          className
        )}
        style={
          isMobile
            ? {
                maxHeight: mobileHeight,
                transform: isVisible
                  ? `translateY(${dragOffset}px)`
                  : 'translateY(100%)',
                paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${
                  isKeyboardVisible ? '8px' : '16px'
                })`
              }
            : undefined
        }
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile drag handle */}
        {isMobile && showHandle && (
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors" />
          </div>
        )}

        {/* Dialog content wrapper */}
        <div
          className={cn(
            'flex flex-col',
            isMobile ? 'max-h-[calc(90vh-60px)] overflow-hidden' : ''
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

// =============================================================================
// DIALOG HEADER
// =============================================================================

export function DialogHeader({ children, className }: DialogHeaderProps) {
  const { isMobile, onClose } = useDialog()

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 p-6 border-b border-border',
        isMobile && 'p-4 pt-0',
        className
      )}
    >
      <div className="flex-1 min-w-0">{children}</div>
      <button
        onClick={onClose}
        className={cn(
          'p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground',
          'min-w-[44px] min-h-[44px] flex items-center justify-center'
        )}
        aria-label="Close dialog"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}

// =============================================================================
// DIALOG BODY (for scrollable content)
// =============================================================================

export function DialogBody({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  const { isMobile } = useDialog()

  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto p-6',
        isMobile && 'p-4',
        className
      )}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </div>
  )
}

// =============================================================================
// DIALOG FOOTER
// =============================================================================

export function DialogFooter({
  children,
  className,
  stackOnMobile = true
}: DialogFooterProps) {
  const { isMobile } = useDialog()

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-6 border-t border-border',
        isMobile && 'p-4 flex-col-reverse',
        isMobile && stackOnMobile && '[&>button]:w-full',
        !isMobile && 'justify-end',
        className
      )}
    >
      {children}
    </div>
  )
}

// =============================================================================
// DIALOG TITLE
// =============================================================================

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2
      className={cn(
        'text-xl font-bold text-foreground',
        className
      )}
    >
      {children}
    </h2>
  )
}

// =============================================================================
// DIALOG DESCRIPTION
// =============================================================================

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <p
      className={cn(
        'text-sm text-muted-foreground mt-1',
        className
      )}
    >
      {children}
    </p>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

// Named exports are already done above with 'export function'
// Only add alias export for DialogRoot
export { Dialog as DialogRoot }

export default Dialog

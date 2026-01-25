/**
 * TouchTarget Component - Mobile Accessibility Wrapper
 *
 * Ensures all interactive elements meet the 44x44px minimum touch target size
 * recommended by WCAG 2.5.5 and mobile platform guidelines (iOS/Android).
 *
 * Features:
 * - Ensures minimum 44x44px touch area regardless of visual content size
 * - Maintains visual compactness while providing adequate touch area
 * - Supports custom minimum sizes for different use cases
 * - Provides visual feedback on touch (optional)
 * - Works as a wrapper for any interactive content
 */

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// Minimum touch target sizes based on platform guidelines
const TOUCH_TARGET_SIZES = {
  // WCAG 2.5.5 Level AAA target size
  default: 44,
  // Smaller minimum for dense UIs (WCAG Level AA)
  compact: 36,
  // Larger for primary actions and thumb-zone interactions
  large: 48,
  // Extra large for FAB-style buttons
  xl: 56,
} as const

type TouchTargetSize = keyof typeof TOUCH_TARGET_SIZES | number

interface TouchTargetProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Content to render inside the touch target */
  children: ReactNode
  /** Minimum touch target size in pixels or preset size */
  size?: TouchTargetSize
  /** Whether this is purely a wrapper (no button functionality) */
  asWrapper?: boolean
  /** Custom class for the visual content (inner element) */
  contentClassName?: string
  /** Whether to show visual feedback on touch */
  showFeedback?: boolean
  /** Center the content within the touch target */
  centered?: boolean
  /** Render as a different element type */
  as?: 'button' | 'div' | 'span' | 'a'
}

/**
 * TouchTarget - A wrapper that ensures minimum touch target size
 *
 * @example
 * // Wrap a small icon button
 * <TouchTarget onClick={handleClick} aria-label="Close">
 *   <XIcon className="w-4 h-4" />
 * </TouchTarget>
 *
 * @example
 * // Use as a link wrapper
 * <TouchTarget as="a" href="/settings" size="compact">
 *   <SettingsIcon className="w-5 h-5" />
 * </TouchTarget>
 *
 * @example
 * // Large touch target for primary actions
 * <TouchTarget size="large" onClick={handleSubmit}>
 *   <span className="text-sm">Submit</span>
 * </TouchTarget>
 */
export const TouchTarget = forwardRef<HTMLButtonElement, TouchTargetProps>(
  (
    {
      children,
      size = 'default',
      asWrapper = false,
      contentClassName,
      showFeedback = true,
      centered = true,
      as = 'button',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    // Calculate actual minimum size
    const minSize =
      typeof size === 'number' ? size : TOUCH_TARGET_SIZES[size]

    // Common styles for the touch target
    const touchTargetStyles = cn(
      // Minimum dimensions for touch accessibility
      'relative inline-flex touch-manipulation select-none',
      // Center content by default
      centered && 'items-center justify-center',
      // Touch feedback styles
      showFeedback && !disabled && [
        'active:scale-95 transition-transform duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      ],
      // Disabled state
      disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
      className
    )

    // Style object for minimum dimensions
    const sizeStyles = {
      minWidth: `${minSize}px`,
      minHeight: `${minSize}px`,
    }

    // If asWrapper is true, render without button functionality
    if (asWrapper) {
      const Component = as === 'button' ? 'div' : as
      return (
        <Component
          className={touchTargetStyles}
          style={sizeStyles}
          {...(props as any)}
        >
          <span className={contentClassName}>{children}</span>
        </Component>
      )
    }

    // Render appropriate element based on 'as' prop
    if (as === 'a') {
      return (
        <a
          className={touchTargetStyles}
          style={sizeStyles}
          {...(props as any)}
        >
          <span className={contentClassName}>{children}</span>
        </a>
      )
    }

    if (as === 'div') {
      return (
        <div
          className={touchTargetStyles}
          style={sizeStyles}
          role={props.onClick ? 'button' : undefined}
          tabIndex={props.onClick ? 0 : undefined}
          {...(props as any)}
        >
          <span className={contentClassName}>{children}</span>
        </div>
      )
    }

    if (as === 'span') {
      return (
        <span
          className={touchTargetStyles}
          style={sizeStyles}
          role={props.onClick ? 'button' : undefined}
          tabIndex={props.onClick ? 0 : undefined}
          {...(props as any)}
        >
          <span className={contentClassName}>{children}</span>
        </span>
      )
    }

    // Default: render as button
    return (
      <button
        ref={ref}
        type="button"
        className={touchTargetStyles}
        style={sizeStyles}
        disabled={disabled}
        {...props}
      >
        <span className={contentClassName}>{children}</span>
      </button>
    )
  }
)

TouchTarget.displayName = 'TouchTarget'

/**
 * IconButton - Pre-styled touch-friendly icon button
 *
 * Common use case for icon-only buttons (close, menu, etc.)
 */
interface IconButtonProps extends Omit<TouchTargetProps, 'children'> {
  icon: ReactNode
  /** Visual size of the icon container (touch target remains 44px) */
  visualSize?: 'sm' | 'md' | 'lg'
  /** Button variant */
  variant?: 'ghost' | 'outline' | 'solid'
}

const VISUAL_SIZES = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

const VARIANT_STYLES = {
  ghost: 'hover:bg-muted/50 rounded-lg',
  outline: 'border border-border hover:bg-muted/50 rounded-lg',
  solid: 'bg-muted hover:bg-muted/80 rounded-lg',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      visualSize = 'md',
      variant = 'ghost',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <TouchTarget
        ref={ref}
        className={cn(
          'text-muted-foreground hover:text-foreground transition-colors',
          VARIANT_STYLES[variant],
          className
        )}
        contentClassName={cn(
          'flex items-center justify-center',
          VISUAL_SIZES[visualSize]
        )}
        {...props}
      >
        {icon}
      </TouchTarget>
    )
  }
)

IconButton.displayName = 'IconButton'

/**
 * TouchTargetLink - Touch-friendly link wrapper
 */
interface TouchTargetLinkProps {
  href: string
  children: ReactNode
  className?: string
  contentClassName?: string
  size?: TouchTargetSize
}

export function TouchTargetLink({
  href,
  children,
  className,
  contentClassName,
  size = 'default',
}: TouchTargetLinkProps) {
  const minSize =
    typeof size === 'number' ? size : TOUCH_TARGET_SIZES[size]

  return (
    <a
      href={href}
      className={cn(
        'relative inline-flex items-center justify-center touch-manipulation select-none',
        'active:scale-95 transition-transform duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className
      )}
      style={{
        minWidth: `${minSize}px`,
        minHeight: `${minSize}px`,
      }}
    >
      <span className={contentClassName}>{children}</span>
    </a>
  )
}

/**
 * Utility function to get touch target styles for inline use
 */
export function getTouchTargetStyles(size: TouchTargetSize = 'default') {
  const minSize =
    typeof size === 'number' ? size : TOUCH_TARGET_SIZES[size]

  return {
    minWidth: `${minSize}px`,
    minHeight: `${minSize}px`,
  }
}

/**
 * Utility class string for adding touch target minimum size
 */
export const touchTargetClass = 'min-w-[44px] min-h-[44px]'
export const touchTargetCompactClass = 'min-w-[36px] min-h-[36px]'
export const touchTargetLargeClass = 'min-w-[48px] min-h-[48px]'
export const touchTargetXLClass = 'min-w-[56px] min-h-[56px]'

export default TouchTarget

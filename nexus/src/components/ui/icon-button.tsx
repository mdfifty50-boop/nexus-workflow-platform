/**
 * IconButton Component - Accessible Icon-Only Button
 *
 * A button component specifically designed for icon-only interactions
 * with proper accessibility support including:
 * - Required aria-label for screen readers
 * - Visible focus states
 * - Minimum touch target size (44x44px) for WCAG 2.5.5
 * - Optional tooltip for sighted users
 *
 * WCAG Compliance:
 * - 1.1.1 Non-text Content (aria-label)
 * - 2.4.4 Link Purpose (descriptive label)
 * - 2.5.5 Target Size (44px minimum)
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: Accessible label for screen readers */
  'aria-label': string
  /** Icon element to render */
  icon: React.ReactNode
  /** Visual variant */
  variant?: 'default' | 'ghost' | 'outline' | 'destructive' | 'success'
  /** Button size (all maintain minimum 44px touch target) */
  size?: 'sm' | 'md' | 'lg'
  /** Show loading spinner */
  loading?: boolean
  /** Show success state */
  success?: boolean
  /** Optional tooltip text (defaults to aria-label) */
  tooltip?: string
  /** Tooltip position */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      'aria-label': ariaLabel,
      icon,
      variant = 'default',
      size = 'md',
      loading = false,
      success = false,
      tooltip,
      tooltipPosition = 'bottom',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showTooltip, setShowTooltip] = React.useState(false)

    // Base styles with focus management
    const baseStyles = cn(
      // Layout
      'relative inline-flex items-center justify-center',
      // Minimum touch target (WCAG 2.5.5)
      'min-w-[44px] min-h-[44px]',
      // Transitions
      'transition-all duration-200',
      // Focus styles (WCAG 2.4.7)
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      // Disabled styles
      'disabled:pointer-events-none disabled:opacity-50',
      // Touch optimization
      'touch-manipulation select-none'
    )

    // Variant styles
    const variantStyles = {
      default: cn(
        'bg-primary text-primary-foreground',
        'hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30',
        'active:scale-95'
      ),
      ghost: cn(
        'bg-transparent text-muted-foreground',
        'hover:bg-accent hover:text-accent-foreground',
        'active:scale-95'
      ),
      outline: cn(
        'border border-input bg-background text-foreground',
        'hover:bg-accent hover:text-accent-foreground hover:border-primary',
        'active:scale-95'
      ),
      destructive: cn(
        'bg-destructive text-destructive-foreground',
        'hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/30',
        'active:scale-95'
      ),
      success: cn(
        'bg-emerald-500 text-white',
        'hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30',
        'active:scale-95'
      ),
    }

    // Size styles (all maintain 44px minimum)
    const sizeStyles = {
      sm: 'w-9 h-9 rounded-md [&>svg]:w-4 [&>svg]:h-4',
      md: 'w-10 h-10 rounded-lg [&>svg]:w-5 [&>svg]:h-5',
      lg: 'w-12 h-12 rounded-xl [&>svg]:w-6 [&>svg]:h-6',
    }

    // Tooltip position styles
    const tooltipPositionStyles = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    }

    const isDisabled = disabled || loading
    const tooltipText = tooltip || ariaLabel

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          loading && 'cursor-wait',
          className
        )}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-busy={loading}
        aria-disabled={isDisabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <svg
            className="animate-spin w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Success checkmark */}
        {success && !loading && (
          <svg
            className="w-5 h-5 text-current animate-scale-in"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}

        {/* Icon */}
        {!loading && !success && (
          <span aria-hidden="true">{icon}</span>
        )}

        {/* Tooltip */}
        {showTooltip && tooltipText && (
          <span
            role="tooltip"
            className={cn(
              'absolute z-50 px-2 py-1',
              'text-xs font-medium whitespace-nowrap',
              'bg-popover text-popover-foreground',
              'border border-border rounded-md shadow-md',
              'pointer-events-none',
              'animate-in fade-in-0 zoom-in-95 duration-200',
              tooltipPositionStyles[tooltipPosition]
            )}
          >
            {tooltipText}
          </span>
        )}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

export { IconButton }

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "cta" | "success"
  size?: "default" | "sm" | "lg" | "xl" | "icon" | "icon-sm" | "touch" | "touch-sm"
  loading?: boolean
  success?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

// Loading spinner component
const LoadingSpinner = () => (
  <svg
    className="animate-spin h-4 w-4"
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
)

// Success checkmark component
const SuccessCheck = () => (
  <svg
    className="h-4 w-4 animate-scale-in"
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
)

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = "default",
    size = "default",
    loading = false,
    success = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  }, ref) => {
    // Base styles with minimum 44px touch target for mobile accessibility
    // Includes btn-animate for subtle scale animation on press
    const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation btn-animate select-none"

    const variants = {
      default:
        "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 hover:shadow-lg hover:shadow-primary/50 active:scale-95",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/50 active:scale-95",
      outline:
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary active:scale-95",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-lg hover:shadow-secondary/50 active:scale-95",
      ghost: "hover:bg-accent hover:text-accent-foreground active:scale-95",
      link: "text-primary underline-offset-4 hover:underline",
      // CTA variant - highly visible with animated glow
      cta: "relative bg-gradient-to-r from-cyan-500 via-primary to-purple-500 text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:rounded-md before:bg-gradient-to-r before:from-cyan-500/0 before:via-white/20 before:to-purple-500/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity overflow-hidden",
      // Success variant for completed states
      success: "bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/50 active:scale-95",
    }

    // Sizes with minimum 44px touch target on mobile (via min-h and min-w)
    const sizes = {
      default: "h-10 min-h-[44px] px-4 py-2",
      sm: "h-9 min-h-[44px] rounded-md px-3",
      lg: "h-11 min-h-[44px] rounded-md px-8 text-base",
      // Extra large for prominent CTAs
      xl: "h-14 min-h-[56px] rounded-xl px-10 text-lg font-bold",
      // Icon buttons with proper touch targets
      icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
      // Compact icon for dense UIs (still meets minimum 36px for AA compliance)
      "icon-sm": "h-9 w-9 min-h-[36px] min-w-[36px]",
      // Touch-optimized variants - ensures 44px minimum with padding for visual compactness
      touch: "h-11 min-h-[44px] min-w-[44px] px-4 py-2",
      // Touch-optimized small - visually compact but 44px touch target
      "touch-sm": "h-9 min-h-[44px] min-w-[44px] px-3 py-1.5",
    }

    // Determine current visual state
    const isDisabledState = disabled || loading
    const showSuccess = success && !loading
    const showLoading = loading

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          loading && "cursor-wait",
          showSuccess && "bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/30",
          className
        )}
        ref={ref}
        disabled={isDisabledState}
        aria-busy={loading}
        aria-disabled={isDisabledState}
        {...props}
      >
        {/* Loading state */}
        {showLoading && <LoadingSpinner />}

        {/* Success state */}
        {showSuccess && <SuccessCheck />}

        {/* Left icon (hidden during loading/success) */}
        {!showLoading && !showSuccess && leftIcon}

        {/* Button content */}
        <span className={cn(
          "transition-opacity duration-150",
          showLoading && "opacity-70"
        )}>
          {showSuccess ? "Success!" : children}
        </span>

        {/* Right icon (hidden during loading/success) */}
        {!showLoading && !showSuccess && rightIcon}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }

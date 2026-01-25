/**
 * Loading Spinner Component
 *
 * Multiple variants of polished loading states with subtle animations.
 * Includes shimmer effects and different sizes/styles.
 */

import { type ReactNode } from 'react'

// =============================================================================
// TYPES
// =============================================================================

export type SpinnerVariant = 'default' | 'dots' | 'pulse' | 'gradient' | 'orbital' | 'bars'
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface LoadingSpinnerProps {
  /** Spinner visual variant */
  variant?: SpinnerVariant
  /** Size of the spinner */
  size?: SpinnerSize
  /** Optional label to show below spinner */
  label?: string
  /** Custom className */
  className?: string
  /** Color override (CSS color value) */
  color?: string
  /** Whether to center in container */
  center?: boolean
}

// =============================================================================
// SIZE CONFIGURATIONS
// =============================================================================

const SIZES: Record<SpinnerSize, { spinner: number; border: number; text: string }> = {
  xs: { spinner: 16, border: 2, text: 'text-xs' },
  sm: { spinner: 24, border: 2, text: 'text-sm' },
  md: { spinner: 32, border: 3, text: 'text-sm' },
  lg: { spinner: 48, border: 4, text: 'text-base' },
  xl: { spinner: 64, border: 5, text: 'text-lg' }
}

// =============================================================================
// SPINNER VARIANTS
// =============================================================================

/** Default circular spinner with gradient */
function DefaultSpinner({ size, color }: { size: SpinnerSize; color?: string }) {
  const config = SIZES[size]
  const colorClass = color ? '' : 'border-primary'

  return (
    <div
      className={`rounded-full animate-spin ${colorClass}`}
      style={{
        width: config.spinner,
        height: config.spinner,
        borderWidth: config.border,
        borderStyle: 'solid',
        borderColor: color || 'hsl(var(--primary))',
        borderTopColor: 'transparent',
        borderRightColor: color ? `${color}40` : 'hsl(var(--primary) / 0.4)'
      }}
    />
  )
}

/** Three bouncing dots */
function DotsSpinner({ size, color }: { size: SpinnerSize; color?: string }) {
  const config = SIZES[size]
  const dotSize = Math.max(6, config.spinner / 4)
  const bgColor = color || 'hsl(var(--primary))'

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-full animate-bounce"
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: bgColor,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  )
}

/** Pulsing circle */
function PulseSpinner({ size, color }: { size: SpinnerSize; color?: string }) {
  const config = SIZES[size]
  const bgColor = color || 'hsl(var(--primary))'

  return (
    <div className="relative" style={{ width: config.spinner, height: config.spinner }}>
      <div
        className="absolute inset-0 rounded-full animate-ping"
        style={{ backgroundColor: `${bgColor}40` }}
      />
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          backgroundColor: bgColor,
          transform: 'scale(0.5)',
          transformOrigin: 'center'
        }}
      />
    </div>
  )
}

/** Gradient rotating ring */
function GradientSpinner({ size }: { size: SpinnerSize }) {
  const config = SIZES[size]

  return (
    <div
      className="relative animate-spin"
      style={{ width: config.spinner, height: config.spinner }}
    >
      <svg
        viewBox="0 0 50 50"
        className="w-full h-full"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <defs>
          <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="url(#spinner-gradient)"
          strokeWidth={config.border}
          strokeLinecap="round"
          strokeDasharray="80 45"
        />
      </svg>
    </div>
  )
}

/** Orbital spinning dots */
function OrbitalSpinner({ size, color }: { size: SpinnerSize; color?: string }) {
  const config = SIZES[size]
  const bgColor = color || 'hsl(var(--primary))'
  const dotSize = Math.max(4, config.spinner / 6)

  return (
    <div
      className="relative animate-spin"
      style={{
        width: config.spinner,
        height: config.spinner,
        animationDuration: '1.5s'
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: bgColor,
            opacity: 1 - (i * 0.2),
            top: '50%',
            left: '50%',
            transform: `rotate(${i * 90}deg) translateY(-${config.spinner / 2 - dotSize / 2}px) translateX(-50%)`
          }}
        />
      ))}
    </div>
  )
}

/** Animated bars (equalizer style) */
function BarsSpinner({ size, color }: { size: SpinnerSize; color?: string }) {
  const config = SIZES[size]
  const barWidth = Math.max(3, config.spinner / 8)
  const bgColor = color || 'hsl(var(--primary))'

  return (
    <div
      className="flex items-end gap-[2px]"
      style={{ height: config.spinner }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: barWidth,
            backgroundColor: bgColor,
            animation: `bars-pulse 1s ease-in-out ${i * 0.1}s infinite`,
            height: '40%'
          }}
        />
      ))}
      <style>{`
        @keyframes bars-pulse {
          0%, 100% { height: 40%; }
          50% { height: 100%; }
        }
      `}</style>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LoadingSpinner({
  variant = 'default',
  size = 'md',
  label,
  className = '',
  color,
  center = false
}: LoadingSpinnerProps) {
  const config = SIZES[size]

  const SpinnerComponent = {
    default: DefaultSpinner,
    dots: DotsSpinner,
    pulse: PulseSpinner,
    gradient: GradientSpinner,
    orbital: OrbitalSpinner,
    bars: BarsSpinner
  }[variant]

  // Accessible loading indicator
  const loadingLabel = label || 'Loading'

  const content = (
    <div
      className={`flex flex-col items-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={loadingLabel}
    >
      <SpinnerComponent size={size} color={color} />
      {label && (
        <span className={`text-muted-foreground ${config.text}`}>
          {label}
        </span>
      )}
      {/* Screen reader only text when no visible label */}
      {!label && (
        <span className="sr-only">{loadingLabel}</span>
      )}
    </div>
  )

  if (center) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[100px]">
        {content}
      </div>
    )
  }

  return content
}

// =============================================================================
// SHIMMER SKELETON
// =============================================================================

export interface ShimmerProps {
  /** Width (CSS value or number for px) */
  width?: string | number
  /** Height (CSS value or number for px) */
  height?: string | number
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  /** Custom className */
  className?: string
  /** Whether to show the shimmer animation */
  animate?: boolean
}

const ROUNDED_CLASSES = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full'
}

export function Shimmer({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  className = '',
  animate = true
}: ShimmerProps) {
  const widthStyle = typeof width === 'number' ? `${width}px` : width
  const heightStyle = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`relative overflow-hidden bg-muted/50 ${ROUNDED_CLASSES[rounded]} ${className}`}
      style={{ width: widthStyle, height: heightStyle }}
    >
      {animate && (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite'
          }}
        />
      )}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

// =============================================================================
// SHIMMER CARD
// =============================================================================

export interface ShimmerCardProps {
  /** Show avatar placeholder */
  showAvatar?: boolean
  /** Number of text lines */
  lines?: number
  /** Show action button placeholder */
  showAction?: boolean
  /** Custom className */
  className?: string
}

export function ShimmerCard({
  showAvatar = true,
  lines = 2,
  showAction = true,
  className = ''
}: ShimmerCardProps) {
  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      <div className="flex items-start gap-4">
        {showAvatar && <Shimmer width={48} height={48} rounded="full" />}
        <div className="flex-1 space-y-3">
          <Shimmer width="60%" height={20} />
          {Array.from({ length: lines }).map((_, i) => (
            <Shimmer
              key={i}
              width={i === lines - 1 ? '40%' : '90%'}
              height={14}
            />
          ))}
        </div>
        {showAction && <Shimmer width={80} height={32} rounded="md" />}
      </div>
    </div>
  )
}

// =============================================================================
// LOADING OVERLAY
// =============================================================================

export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean
  /** Content to show on the overlay */
  message?: string
  /** Spinner variant */
  variant?: SpinnerVariant
  /** Children to render behind the overlay */
  children?: ReactNode
  /** Whether to blur the background */
  blur?: boolean
  /** Custom className for the overlay */
  className?: string
}

export function LoadingOverlay({
  visible,
  message = 'Loading...',
  variant = 'gradient',
  children,
  blur = true,
  className = ''
}: LoadingOverlayProps) {
  if (!visible && children) return <>{children}</>
  if (!visible) return null

  return (
    <div className="relative">
      {children}
      <div
        className={`absolute inset-0 flex items-center justify-center z-10 bg-background/80 ${
          blur ? 'backdrop-blur-sm' : ''
        } rounded-lg ${className}`}
      >
        <LoadingSpinner variant={variant} size="lg" label={message} />
      </div>
    </div>
  )
}

// =============================================================================
// FULL PAGE LOADING
// =============================================================================

export interface FullPageLoadingProps {
  /** Message to display */
  message?: string
  /** Spinner variant */
  variant?: SpinnerVariant
  /** Logo or brand element */
  logo?: ReactNode
}

export function FullPageLoading({
  message = 'Loading...',
  variant = 'gradient',
  logo
}: FullPageLoadingProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      {logo && <div className="mb-8">{logo}</div>}
      <LoadingSpinner variant={variant} size="xl" />
      <p className="mt-6 text-muted-foreground animate-pulse">{message}</p>
    </div>
  )
}

// =============================================================================
// INLINE LOADING (for buttons etc)
// =============================================================================

export interface InlineLoadingProps {
  /** Whether loading */
  loading: boolean
  /** Content when not loading */
  children: ReactNode
  /** Spinner size */
  size?: 'xs' | 'sm'
  /** Custom className */
  className?: string
}

export function InlineLoading({
  loading,
  children,
  size = 'sm',
  className = ''
}: InlineLoadingProps) {
  if (!loading) return <>{children}</>

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LoadingSpinner variant="default" size={size} />
      <span className="opacity-70">{children}</span>
    </span>
  )
}

// =============================================================================
// PROGRESS LOADING
// =============================================================================

export interface ProgressLoadingProps {
  /** Progress value (0-100) */
  progress: number
  /** Optional label */
  label?: string
  /** Show percentage */
  showPercentage?: boolean
  /** Size */
  size?: 'sm' | 'md' | 'lg'
  /** Color variant */
  color?: 'primary' | 'success' | 'warning' | 'error'
}

const PROGRESS_COLORS = {
  primary: 'from-primary to-secondary',
  success: 'from-green-500 to-emerald-500',
  warning: 'from-yellow-500 to-orange-500',
  error: 'from-red-500 to-pink-500'
}

const PROGRESS_HEIGHTS = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
}

export function ProgressLoading({
  progress,
  label,
  showPercentage = true,
  size = 'md',
  color = 'primary'
}: ProgressLoadingProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-muted-foreground">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-muted rounded-full overflow-hidden ${PROGRESS_HEIGHTS[size]}`}>
        <div
          className={`h-full bg-gradient-to-r ${PROGRESS_COLORS[color]} rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
          style={{ width: `${clampedProgress}%` }}
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{
              animation: 'shimmer-progress 1.5s ease-in-out infinite'
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes shimmer-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner

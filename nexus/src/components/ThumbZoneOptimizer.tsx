/**
 * ThumbZoneOptimizer - Components and utilities for mobile thumb reachability
 *
 * Optimizes UI elements for natural thumb reach on mobile devices.
 * Based on ergonomic research showing the "thumb zone" where users
 * can comfortably reach without repositioning their grip.
 */

import { type ReactNode, type CSSProperties, forwardRef } from 'react'

/**
 * Thumb zone regions based on ergonomic research
 * - easy: Bottom center area, most accessible
 * - okay: Middle and side areas, moderately accessible
 * - hard: Top corners, requires grip repositioning
 */
export type ThumbZoneRegion = 'easy' | 'okay' | 'hard'

/**
 * Minimum touch target sizes (in pixels)
 * Based on Apple HIG and Material Design guidelines
 */
export const TOUCH_TARGETS = {
  minimum: 44, // Apple minimum
  comfortable: 48, // Material Design recommended
  spacious: 56, // Extra comfortable for critical actions
} as const

/**
 * Spacing between tappable elements (in pixels)
 * Prevents accidental taps on adjacent elements
 */
export const TOUCH_SPACING = {
  tight: 8,
  normal: 12,
  comfortable: 16,
  spacious: 24,
} as const

/**
 * ThumbFriendlyButton - Button optimized for thumb reach
 *
 * Features:
 * - Minimum 44px touch target
 * - Proper padding for tap accuracy
 * - Active state feedback
 * - RTL support
 */
interface ThumbFriendlyButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'default' | 'large' | 'xl'
  fullWidth?: boolean
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
  'aria-label'?: string
}

export const ThumbFriendlyButton = forwardRef<HTMLButtonElement, ThumbFriendlyButtonProps>(
  ({
    children,
    onClick,
    variant = 'primary',
    size = 'default',
    fullWidth = false,
    disabled = false,
    className = '',
    type = 'button',
    'aria-label': ariaLabel
  }, ref) => {
    const sizeClasses = {
      default: 'min-h-[44px] px-4 py-3 text-sm',
      large: 'min-h-[48px] px-5 py-3.5 text-base',
      xl: 'min-h-[56px] px-6 py-4 text-lg'
    }

    const variantClasses = {
      primary: 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-500/20',
      secondary: 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700',
      ghost: 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white',
      danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
    }

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${fullWidth ? 'w-full' : ''}
          rounded-xl font-medium
          transition-all duration-200
          active:scale-[0.98] active:opacity-90
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
          touch-manipulation
          flex items-center justify-center gap-2
          ${className}
        `}
      >
        {children}
      </button>
    )
  }
)

ThumbFriendlyButton.displayName = 'ThumbFriendlyButton'

/**
 * BottomActionBar - Fixed bottom action bar for critical actions
 *
 * Positions important actions in the easy-reach thumb zone at the
 * bottom of the screen. Use for primary CTAs and frequent actions.
 */
interface BottomActionBarProps {
  children: ReactNode
  className?: string
  /** Whether to show border on top */
  showBorder?: boolean
  /** Background style */
  background?: 'solid' | 'blur' | 'gradient'
}

export function BottomActionBar({
  children,
  className = '',
  showBorder = true,
  background = 'blur'
}: BottomActionBarProps) {
  const backgroundClasses = {
    solid: 'bg-slate-900',
    blur: 'bg-slate-900/95 backdrop-blur-xl',
    gradient: 'bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent'
  }

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-40
        ${backgroundClasses[background]}
        ${showBorder ? 'border-t border-slate-700/50' : ''}
        px-4 py-4
        md:hidden
        ${className}
      `}
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)'
      }}
    >
      <div className="flex items-center gap-3">
        {children}
      </div>
    </div>
  )
}

/**
 * BottomActionSpacer - Adds spacing to prevent content from being hidden
 * behind BottomActionBar
 */
export function BottomActionSpacer({ height = 80 }: { height?: number }) {
  return (
    <div
      className="md:hidden"
      style={{ height: `${height}px` }}
      aria-hidden="true"
    />
  )
}

/**
 * TappableCard - Card component with proper touch targets
 *
 * Ensures the entire card is a valid tap target with proper
 * feedback and accessibility.
 */
interface TappableCardProps {
  children: ReactNode
  onClick?: () => void
  href?: string
  className?: string
  padding?: 'compact' | 'default' | 'spacious'
  active?: boolean
}

export function TappableCard({
  children,
  onClick,
  href,
  className = '',
  padding = 'default',
  active = false
}: TappableCardProps) {
  const paddingClasses = {
    compact: 'p-3',
    default: 'p-4',
    spacious: 'p-5'
  }

  const baseClasses = `
    block w-full
    ${paddingClasses[padding]}
    bg-slate-800/50 rounded-xl
    border border-slate-700/50
    transition-all duration-200
    active:scale-[0.98] active:bg-slate-700/50
    ${active ? 'border-cyan-500/50 bg-cyan-500/5' : 'hover:border-slate-600'}
    touch-manipulation
    ${className}
  `

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        {children}
      </a>
    )
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={`${baseClasses} text-left`}>
        {children}
      </button>
    )
  }

  return (
    <div className={baseClasses}>
      {children}
    </div>
  )
}

/**
 * TouchableIcon - Icon button with proper touch target
 *
 * Wraps icons in a properly-sized touch target while keeping
 * the visual icon at its original size.
 */
interface TouchableIconProps {
  icon: ReactNode
  onClick?: () => void
  label: string
  size?: 'small' | 'default' | 'large'
  variant?: 'default' | 'primary' | 'ghost'
  className?: string
  disabled?: boolean
}

export function TouchableIcon({
  icon,
  onClick,
  label,
  size = 'default',
  variant = 'default',
  className = '',
  disabled = false
}: TouchableIconProps) {
  const sizeClasses = {
    small: 'min-w-[40px] min-h-[40px] w-10 h-10',
    default: 'min-w-[44px] min-h-[44px] w-11 h-11',
    large: 'min-w-[48px] min-h-[48px] w-12 h-12'
  }

  const variantClasses = {
    default: 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white',
    primary: 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30',
    ghost: 'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-xl flex items-center justify-center
        transition-all duration-200
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        touch-manipulation
        ${className}
      `}
    >
      {icon}
    </button>
  )
}

/**
 * SpacedList - List component with proper spacing between tappable items
 */
interface SpacedListProps {
  children: ReactNode
  spacing?: keyof typeof TOUCH_SPACING
  className?: string
}

export function SpacedList({
  children,
  spacing = 'normal',
  className = ''
}: SpacedListProps) {
  const gapStyle: CSSProperties = {
    gap: `${TOUCH_SPACING[spacing]}px`
  }

  return (
    <div className={`flex flex-col ${className}`} style={gapStyle}>
      {children}
    </div>
  )
}

/**
 * MobileOptimizedGrid - Grid that adjusts for thumb-friendly tapping on mobile
 */
interface MobileOptimizedGridProps {
  children: ReactNode
  columns?: { mobile: number; tablet: number; desktop: number }
  gap?: keyof typeof TOUCH_SPACING
  className?: string
}

export function MobileOptimizedGrid({
  children,
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  gap = 'normal',
  className = ''
}: MobileOptimizedGridProps) {
  return (
    <div
      className={`
        grid
        grid-cols-${columns.mobile}
        sm:grid-cols-${columns.tablet}
        lg:grid-cols-${columns.desktop}
        ${className}
      `}
      style={{ gap: `${TOUCH_SPACING[gap]}px` }}
    >
      {children}
    </div>
  )
}

/**
 * Utility: Check if touch target meets minimum size
 */
export function isValidTouchTarget(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  return rect.width >= TOUCH_TARGETS.minimum && rect.height >= TOUCH_TARGETS.minimum
}

/**
 * Utility: Get thumb zone region for an element position
 */
export function getThumbZoneRegion(
  elementY: number,
  screenHeight: number
): ThumbZoneRegion {
  const relativeY = elementY / screenHeight

  if (relativeY > 0.66) return 'easy' // Bottom third
  if (relativeY > 0.33) return 'okay' // Middle third
  return 'hard' // Top third
}

/**
 * Utility: Calculate optimal position for a floating action
 */
export function getOptimalFloatingPosition(
  _screenWidth: number,
  _screenHeight: number,
  isRTL = false
): { bottom: number; left?: number; right?: number } {
  const safeAreaBottom = 24 // Default safe area
  const edgeMargin = 16

  return {
    bottom: safeAreaBottom,
    ...(isRTL
      ? { left: edgeMargin }
      : { right: edgeMargin }
    )
  }
}

export default {
  ThumbFriendlyButton,
  BottomActionBar,
  BottomActionSpacer,
  TappableCard,
  TouchableIcon,
  SpacedList,
  MobileOptimizedGrid,
  TOUCH_TARGETS,
  TOUCH_SPACING
}

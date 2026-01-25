/**
 * RTLAwareIcon Component
 *
 * A wrapper component for icons that automatically flips directional icons
 * in RTL layouts while maintaining the orientation of non-directional icons.
 *
 * Usage:
 *   // Auto-detect flipping based on icon name
 *   <RTLAwareIcon icon={<ChevronLeft />} name="chevron-left" />
 *
 *   // Force flip
 *   <RTLAwareIcon icon={<ArrowIcon />} flip />
 *
 *   // Prevent flipping
 *   <RTLAwareIcon icon={<ArrowIcon />} flip={false} />
 *
 *   // With Lucide icons
 *   <RTLAwareIcon icon={<ChevronRight className="w-4 h-4" />} name="chevron-right" />
 */

import {
  forwardRef,
  useMemo,
  type ReactNode,
  type HTMLAttributes,
  type CSSProperties
} from 'react'
import { useRTLContext } from '@/lib/i18n/rtl-provider'
import { shouldIconFlip, scaleX } from '@/lib/i18n/rtl-styles'

// Props interface
interface RTLAwareIconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /**
   * The icon element to render
   * Can be any React element (Lucide, FontAwesome, SVG, etc.)
   */
  icon: ReactNode

  /**
   * Name of the icon for auto-detection of flip behavior
   * Use kebab-case (e.g., 'chevron-left', 'arrow-right')
   * If not provided, uses `flip` prop to determine behavior
   */
  name?: string

  /**
   * Force flip behavior:
   * - true: Always flip in RTL
   * - false: Never flip
   * - undefined: Auto-detect based on `name` prop
   */
  flip?: boolean

  /**
   * Additional CSS class names
   */
  className?: string

  /**
   * Size of the icon wrapper
   * Applies both width and height
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string

  /**
   * Custom inline styles
   */
  style?: CSSProperties

  /**
   * Accessibility label for screen readers
   */
  'aria-label'?: string

  /**
   * Whether this icon is purely decorative
   * If true, adds aria-hidden="true"
   */
  decorative?: boolean
}

// Size mapping
const SIZE_MAP: Record<string, string> = {
  xs: '0.75rem',   // 12px
  sm: '1rem',      // 16px
  md: '1.25rem',   // 20px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
}

/**
 * Get size value from size prop
 */
function getSizeValue(size: RTLAwareIconProps['size']): string | undefined {
  if (size === undefined) return undefined

  if (typeof size === 'number') {
    return `${size}px`
  }

  if (typeof size === 'string') {
    return SIZE_MAP[size] || size
  }

  return undefined
}

/**
 * RTLAwareIcon Component
 *
 * Wraps an icon and applies appropriate RTL transformations.
 */
export const RTLAwareIcon = forwardRef<HTMLSpanElement, RTLAwareIconProps>(
  function RTLAwareIcon(
    {
      icon,
      name,
      flip,
      className = '',
      size,
      style,
      'aria-label': ariaLabel,
      decorative = false,
      ...rest
    },
    ref
  ) {
    const { isRTL } = useRTLContext()

    // Determine if icon should flip
    const shouldFlip = useMemo(() => {
      // Explicit flip prop takes precedence
      if (flip !== undefined) {
        return flip && isRTL
      }

      // Auto-detect based on icon name
      if (name) {
        return isRTL && shouldIconFlip(name)
      }

      // Default: don't flip if we can't determine
      return false
    }, [flip, name, isRTL])

    // Build wrapper styles
    const wrapperStyle = useMemo<CSSProperties>(() => {
      const sizeValue = getSizeValue(size)
      const flipStyle = shouldFlip ? scaleX(true) : {}

      return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...(sizeValue && {
          width: sizeValue,
          height: sizeValue
        }),
        ...flipStyle,
        ...style
      }
    }, [size, shouldFlip, style])

    // Build class names
    const classes = [
      'rtl-aware-icon',
      shouldFlip ? 'rtl-flipped' : '',
      className
    ].filter(Boolean).join(' ')

    // Accessibility attributes
    const a11yProps = decorative
      ? { 'aria-hidden': true as const }
      : ariaLabel
        ? { 'aria-label': ariaLabel, role: 'img' as const }
        : {}

    return (
      <span
        ref={ref}
        className={classes}
        style={wrapperStyle}
        {...a11yProps}
        {...rest}
      >
        {icon}
      </span>
    )
  }
)

// ============================================================
// CONVENIENCE COMPONENTS
// ============================================================

/**
 * FlippableIcon - Always flips in RTL
 *
 * Shorthand for <RTLAwareIcon flip />
 */
interface FlippableIconProps extends Omit<RTLAwareIconProps, 'flip'> {}

export const FlippableIcon = forwardRef<HTMLSpanElement, FlippableIconProps>(
  function FlippableIcon(props, ref) {
    return <RTLAwareIcon {...props} flip ref={ref} />
  }
)

/**
 * StaticIcon - Never flips in RTL
 *
 * Shorthand for <RTLAwareIcon flip={false} />
 * Use for icons that should maintain their orientation.
 */
interface StaticIconProps extends Omit<RTLAwareIconProps, 'flip'> {}

export const StaticIcon = forwardRef<HTMLSpanElement, StaticIconProps>(
  function StaticIcon(props, ref) {
    return <RTLAwareIcon {...props} flip={false} ref={ref} />
  }
)

/**
 * NavigationIcon - For back/forward navigation
 *
 * Automatically flips navigation icons in RTL.
 */
interface NavigationIconProps extends Omit<RTLAwareIconProps, 'flip' | 'decorative'> {
  /** Navigation direction */
  direction: 'back' | 'forward'
}

export const NavigationIcon = forwardRef<HTMLSpanElement, NavigationIconProps>(
  function NavigationIcon({ direction, ...props }, ref) {
    const name = direction === 'back' ? 'arrow-back' : 'arrow-forward'
    return (
      <RTLAwareIcon
        {...props}
        name={name}
        flip
        ref={ref}
      />
    )
  }
)

/**
 * ChevronIcon - For expandable/collapsible sections
 *
 * Handles left/right chevrons with RTL awareness.
 */
interface ChevronIconProps extends Omit<RTLAwareIconProps, 'flip' | 'name'> {
  /** Chevron direction */
  direction: 'left' | 'right' | 'up' | 'down'
}

export const ChevronIcon = forwardRef<HTMLSpanElement, ChevronIconProps>(
  function ChevronIcon({ direction, ...props }, ref) {
    const shouldFlipChevron = direction === 'left' || direction === 'right'
    const name = `chevron-${direction}`

    return (
      <RTLAwareIcon
        {...props}
        name={name}
        flip={shouldFlipChevron}
        ref={ref}
      />
    )
  }
)

// ============================================================
// UTILITY HOOK
// ============================================================

/**
 * Hook to determine if an icon should flip based on context
 *
 * @param iconName - Name of the icon
 * @param forceFlip - Override auto-detection
 * @returns Whether the icon should be flipped
 */
export function useIconFlip(
  iconName?: string,
  forceFlip?: boolean
): boolean {
  const { isRTL } = useRTLContext()

  return useMemo(() => {
    if (forceFlip !== undefined) {
      return forceFlip && isRTL
    }

    if (iconName) {
      return isRTL && shouldIconFlip(iconName)
    }

    return false
  }, [isRTL, iconName, forceFlip])
}

/**
 * Hook to get icon flip transform style
 */
export function useIconFlipStyle(
  iconName?: string,
  forceFlip?: boolean
): CSSProperties {
  const shouldFlip = useIconFlip(iconName, forceFlip)
  return shouldFlip ? { transform: 'scaleX(-1)' } : {}
}

// Default export
export default RTLAwareIcon

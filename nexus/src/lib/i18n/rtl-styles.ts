/**
 * RTL Style Utilities
 *
 * Helper functions and utilities for creating RTL-aware styles.
 * Provides spacing, transforms, alignment, and icon flip utilities.
 */

import type { CSSProperties } from 'react'

// Direction type - exported for external use
export type Direction = 'ltr' | 'rtl'

// Spacing scale (matches Tailwind default)
const SPACING_SCALE: Record<string, string> = {
  '0': '0',
  'px': '1px',
  '0.5': '0.125rem',
  '1': '0.25rem',
  '1.5': '0.375rem',
  '2': '0.5rem',
  '2.5': '0.625rem',
  '3': '0.75rem',
  '3.5': '0.875rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '7': '1.75rem',
  '8': '2rem',
  '9': '2.25rem',
  '10': '2.5rem',
  '11': '2.75rem',
  '12': '3rem',
  '14': '3.5rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '28': '7rem',
  '32': '8rem',
  '36': '9rem',
  '40': '10rem',
  '44': '11rem',
  '48': '12rem',
  '52': '13rem',
  '56': '14rem',
  '60': '15rem',
  '64': '16rem',
  '72': '18rem',
  '80': '20rem',
  '96': '24rem',
}

/**
 * Get spacing value from scale or return custom value
 */
function getSpacingValue(value: string | number): string {
  if (typeof value === 'number') {
    return `${value}px`
  }
  return SPACING_SCALE[value] || value
}

// ============================================================
// RTL-AWARE SPACING UTILITIES
// ============================================================

/**
 * Create RTL-aware margin-start style
 * In LTR: margin-left, In RTL: margin-right
 */
export function marginStart(value: string | number): CSSProperties {
  return {
    marginInlineStart: getSpacingValue(value)
  }
}

/**
 * Create RTL-aware margin-end style
 * In LTR: margin-right, In RTL: margin-left
 */
export function marginEnd(value: string | number): CSSProperties {
  return {
    marginInlineEnd: getSpacingValue(value)
  }
}

/**
 * Create RTL-aware padding-start style
 * In LTR: padding-left, In RTL: padding-right
 */
export function paddingStart(value: string | number): CSSProperties {
  return {
    paddingInlineStart: getSpacingValue(value)
  }
}

/**
 * Create RTL-aware padding-end style
 * In LTR: padding-right, In RTL: padding-left
 */
export function paddingEnd(value: string | number): CSSProperties {
  return {
    paddingInlineEnd: getSpacingValue(value)
  }
}

/**
 * Create RTL-aware horizontal margin (start and end)
 */
export function marginInline(
  start: string | number,
  end?: string | number
): CSSProperties {
  return {
    marginInlineStart: getSpacingValue(start),
    marginInlineEnd: getSpacingValue(end ?? start)
  }
}

/**
 * Create RTL-aware horizontal padding (start and end)
 */
export function paddingInline(
  start: string | number,
  end?: string | number
): CSSProperties {
  return {
    paddingInlineStart: getSpacingValue(start),
    paddingInlineEnd: getSpacingValue(end ?? start)
  }
}

/**
 * Create RTL-aware position inset-start
 * In LTR: left, In RTL: right
 */
export function insetStart(value: string | number): CSSProperties {
  return {
    insetInlineStart: getSpacingValue(value)
  }
}

/**
 * Create RTL-aware position inset-end
 * In LTR: right, In RTL: left
 */
export function insetEnd(value: string | number): CSSProperties {
  return {
    insetInlineEnd: getSpacingValue(value)
  }
}

// ============================================================
// DIRECTION-AWARE TRANSFORMS
// ============================================================

/**
 * Create RTL-aware horizontal translation
 * Flips the X direction in RTL
 */
export function translateX(
  value: string | number,
  isRTL: boolean
): CSSProperties {
  const numericValue = typeof value === 'string'
    ? parseFloat(value)
    : value

  const finalValue = isRTL ? -numericValue : numericValue
  const unit = typeof value === 'string' && value.includes('%') ? '%' : 'px'

  return {
    transform: `translateX(${finalValue}${unit})`
  }
}

/**
 * Create horizontal flip transform (for icons)
 */
export function scaleX(flip: boolean): CSSProperties {
  return {
    transform: flip ? 'scaleX(-1)' : 'scaleX(1)'
  }
}

/**
 * Create RTL-aware rotation
 * Optionally inverts rotation direction in RTL
 */
export function rotate(
  degrees: number,
  invertInRTL: boolean,
  isRTL: boolean
): CSSProperties {
  const finalDegrees = invertInRTL && isRTL ? -degrees : degrees
  return {
    transform: `rotate(${finalDegrees}deg)`
  }
}

/**
 * Combine multiple transforms
 */
export function combineTransforms(...transforms: string[]): CSSProperties {
  return {
    transform: transforms.join(' ')
  }
}

// ============================================================
// RTL TEXT ALIGNMENT HELPERS
// ============================================================

/**
 * Create text alignment style using logical values
 */
export function textAlign(
  align: 'start' | 'end' | 'center' | 'justify'
): CSSProperties {
  return {
    textAlign: align
  }
}

/**
 * Create RTL-aware text alignment with physical fallback
 * Useful for browsers that don't support logical properties
 */
export function textAlignWithFallback(
  align: 'start' | 'end' | 'center' | 'justify',
  isRTL: boolean
): CSSProperties {
  if (align === 'center' || align === 'justify') {
    return { textAlign: align }
  }

  // Provide physical fallback
  const physicalAlign = align === 'start'
    ? (isRTL ? 'right' : 'left')
    : (isRTL ? 'left' : 'right')

  return { textAlign: physicalAlign }
}

// ============================================================
// ICON FLIP UTILITIES
// ============================================================

// Icons that should flip in RTL (directional icons)
const DIRECTIONAL_ICONS = new Set([
  // Arrows
  'arrow-left',
  'arrow-right',
  'arrow-left-circle',
  'arrow-right-circle',
  // Chevrons
  'chevron-left',
  'chevron-right',
  'chevrons-left',
  'chevrons-right',
  // Navigation
  'arrow-back',
  'arrow-forward',
  'navigate-before',
  'navigate-next',
  // Other directional
  'skip-back',
  'skip-forward',
  'fast-forward',
  'rewind',
  'redo',
  'undo',
  'reply',
  'forward',
  'external-link',
  'log-in',
  'log-out',
  'corner-down-left',
  'corner-down-right',
  'corner-left-down',
  'corner-left-up',
  'corner-right-down',
  'corner-right-up',
  'corner-up-left',
  'corner-up-right',
])

// Icons that should NOT flip (bidirectional or neutral)
const NON_DIRECTIONAL_ICONS = new Set([
  // Symmetrical icons
  'refresh',
  'rotate',
  'sync',
  // Vertical arrows
  'arrow-up',
  'arrow-down',
  'chevron-up',
  'chevron-down',
  // UI elements
  'menu',
  'close',
  'plus',
  'minus',
  'check',
  'x',
])

/**
 * Check if an icon should flip in RTL
 *
 * @param iconName - Name of the icon (lowercase, kebab-case)
 * @returns true if icon should flip in RTL
 */
export function shouldIconFlip(iconName: string): boolean {
  const normalizedName = iconName.toLowerCase().replace(/\s+/g, '-')

  // Check if explicitly directional
  if (DIRECTIONAL_ICONS.has(normalizedName)) {
    return true
  }

  // Check if explicitly non-directional
  if (NON_DIRECTIONAL_ICONS.has(normalizedName)) {
    return false
  }

  // Heuristics for common patterns
  if (normalizedName.includes('left') || normalizedName.includes('right')) {
    return true
  }
  if (normalizedName.includes('back') || normalizedName.includes('forward')) {
    return true
  }
  if (normalizedName.includes('previous') || normalizedName.includes('next')) {
    return true
  }

  return false
}

/**
 * Get icon flip style based on icon name and RTL state
 */
export function getIconFlipStyle(
  iconName: string,
  isRTL: boolean
): CSSProperties {
  const shouldFlip = isRTL && shouldIconFlip(iconName)
  return scaleX(shouldFlip)
}

/**
 * Register a custom directional icon
 * Useful for project-specific icons
 */
export function registerDirectionalIcon(iconName: string): void {
  DIRECTIONAL_ICONS.add(iconName.toLowerCase().replace(/\s+/g, '-'))
}

/**
 * Register a custom non-directional icon
 */
export function registerNonDirectionalIcon(iconName: string): void {
  NON_DIRECTIONAL_ICONS.add(iconName.toLowerCase().replace(/\s+/g, '-'))
}

// ============================================================
// BORDER RADIUS UTILITIES
// ============================================================

/**
 * Create RTL-aware border radius
 * Uses logical properties for automatic flipping
 */
export function borderRadius(
  topStart: string | number,
  topEnd?: string | number,
  bottomEnd?: string | number,
  bottomStart?: string | number
): CSSProperties {
  const ts = getSpacingValue(topStart)
  const te = getSpacingValue(topEnd ?? topStart)
  const be = getSpacingValue(bottomEnd ?? topStart)
  const bs = getSpacingValue(bottomStart ?? topEnd ?? topStart)

  return {
    borderStartStartRadius: ts,
    borderStartEndRadius: te,
    borderEndEndRadius: be,
    borderEndStartRadius: bs
  }
}

// ============================================================
// FLEX UTILITIES
// ============================================================

/**
 * Create RTL-aware flex row
 */
export function flexRow(reverse: boolean = false): CSSProperties {
  return {
    display: 'flex',
    flexDirection: reverse ? 'row-reverse' : 'row'
  }
}

/**
 * Create RTL-aware flex with gap
 */
export function flexRowWithGap(
  gap: string | number,
  reverse: boolean = false
): CSSProperties {
  return {
    display: 'flex',
    flexDirection: reverse ? 'row-reverse' : 'row',
    gap: getSpacingValue(gap)
  }
}

// ============================================================
// COMBINED STYLE BUILDER
// ============================================================

/**
 * RTL Style builder for creating complex RTL-aware styles
 *
 * @example
 * const style = rtlStyleBuilder(isRTL)
 *   .marginStart('4')
 *   .paddingInline('2', '4')
 *   .textAlign('start')
 *   .build()
 */
export function rtlStyleBuilder(isRTL: boolean) {
  let styles: CSSProperties = {}

  return {
    marginStart(value: string | number) {
      styles = { ...styles, ...marginStart(value) }
      return this
    },
    marginEnd(value: string | number) {
      styles = { ...styles, ...marginEnd(value) }
      return this
    },
    paddingStart(value: string | number) {
      styles = { ...styles, ...paddingStart(value) }
      return this
    },
    paddingEnd(value: string | number) {
      styles = { ...styles, ...paddingEnd(value) }
      return this
    },
    paddingInline(start: string | number, end?: string | number) {
      styles = { ...styles, ...paddingInline(start, end) }
      return this
    },
    marginInline(start: string | number, end?: string | number) {
      styles = { ...styles, ...marginInline(start, end) }
      return this
    },
    textAlign(align: 'start' | 'end' | 'center' | 'justify') {
      styles = { ...styles, ...textAlignWithFallback(align, isRTL) }
      return this
    },
    insetStart(value: string | number) {
      styles = { ...styles, ...insetStart(value) }
      return this
    },
    insetEnd(value: string | number) {
      styles = { ...styles, ...insetEnd(value) }
      return this
    },
    translateX(value: string | number) {
      styles = { ...styles, ...translateX(value, isRTL) }
      return this
    },
    iconFlip(iconName: string) {
      styles = { ...styles, ...getIconFlipStyle(iconName, isRTL) }
      return this
    },
    custom(customStyles: CSSProperties) {
      styles = { ...styles, ...customStyles }
      return this
    },
    build(): CSSProperties {
      return styles
    }
  }
}

// Default export
export default {
  // Spacing
  marginStart,
  marginEnd,
  paddingStart,
  paddingEnd,
  marginInline,
  paddingInline,
  insetStart,
  insetEnd,
  // Transforms
  translateX,
  scaleX,
  rotate,
  combineTransforms,
  // Text
  textAlign,
  textAlignWithFallback,
  // Icons
  shouldIconFlip,
  getIconFlipStyle,
  registerDirectionalIcon,
  registerNonDirectionalIcon,
  // Border
  borderRadius,
  // Flex
  flexRow,
  flexRowWithGap,
  // Builder
  rtlStyleBuilder
}

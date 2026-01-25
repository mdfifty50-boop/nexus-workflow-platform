/**
 * RTL Utility Functions
 *
 * Helper functions for working with RTL (Right-to-Left) layouts.
 * Includes direction detection, mirroring, and CSS property mapping.
 */

// RTL language codes - comprehensive list
export const RTL_LOCALES = [
  'ar',     // Arabic
  'he',     // Hebrew
  'fa',     // Persian/Farsi
  'ur',     // Urdu
  'yi',     // Yiddish
  'ps',     // Pashto
  'sd',     // Sindhi
  'ug',     // Uyghur
  'ku',     // Kurdish (Sorani)
  'dv',     // Divehi
  'syr',    // Syriac
  'arc',    // Aramaic
] as const

// Type for RTL locale codes
export type RTLLocaleCode = typeof RTL_LOCALES[number]

// Direction type
export type Direction = 'ltr' | 'rtl'

// Logical direction for CSS
export type LogicalDirection = 'start' | 'end'

// Physical direction for CSS
export type PhysicalDirection = 'left' | 'right'

/**
 * Check if a locale code is RTL
 *
 * @param locale - Locale code (e.g., 'ar', 'ar-KW', 'en-US')
 * @returns true if the locale is RTL
 *
 * @example
 * isRTLLocale('ar')      // true
 * isRTLLocale('ar-KW')   // true
 * isRTLLocale('en')      // false
 * isRTLLocale('he-IL')   // true
 */
export function isRTLLocale(locale: string): boolean {
  // Extract language code from locale (e.g., 'ar-KW' -> 'ar')
  const langCode = locale.split('-')[0].toLowerCase()
  return RTL_LOCALES.includes(langCode as RTLLocaleCode)
}

/**
 * Get direction for a locale
 *
 * @param locale - Locale code
 * @returns 'rtl' or 'ltr'
 */
export function getLocaleDirection(locale: string): Direction {
  return isRTLLocale(locale) ? 'rtl' : 'ltr'
}

/**
 * Flip a physical direction based on RTL state
 *
 * @param direction - Physical direction ('left' or 'right')
 * @param isRTL - Whether current layout is RTL
 * @returns Flipped direction if RTL, original if LTR
 *
 * @example
 * flipDirection('left', false)  // 'left'
 * flipDirection('left', true)   // 'right'
 * flipDirection('right', true)  // 'left'
 */
export function flipDirection(
  direction: PhysicalDirection,
  isRTL: boolean
): PhysicalDirection {
  if (!isRTL) return direction
  return direction === 'left' ? 'right' : 'left'
}

/**
 * Convert logical direction to physical based on RTL state
 *
 * @param logical - Logical direction ('start' or 'end')
 * @param isRTL - Whether current layout is RTL
 * @returns Physical direction ('left' or 'right')
 *
 * @example
 * logicalToPhysical('start', false) // 'left'
 * logicalToPhysical('start', true)  // 'right'
 * logicalToPhysical('end', false)   // 'right'
 * logicalToPhysical('end', true)    // 'left'
 */
export function logicalToPhysical(
  logical: LogicalDirection,
  isRTL: boolean
): PhysicalDirection {
  if (isRTL) {
    return logical === 'start' ? 'right' : 'left'
  }
  return logical === 'start' ? 'left' : 'right'
}

/**
 * Convert physical direction to logical based on RTL state
 *
 * @param physical - Physical direction ('left' or 'right')
 * @param isRTL - Whether current layout is RTL
 * @returns Logical direction ('start' or 'end')
 */
export function physicalToLogical(
  physical: PhysicalDirection,
  isRTL: boolean
): LogicalDirection {
  if (isRTL) {
    return physical === 'right' ? 'start' : 'end'
  }
  return physical === 'left' ? 'start' : 'end'
}

// Mapping of physical CSS properties to logical equivalents
const PHYSICAL_TO_LOGICAL_MAP: Record<string, string> = {
  // Margin
  'margin-left': 'margin-inline-start',
  'margin-right': 'margin-inline-end',
  // Padding
  'padding-left': 'padding-inline-start',
  'padding-right': 'padding-inline-end',
  // Border
  'border-left': 'border-inline-start',
  'border-right': 'border-inline-end',
  'border-left-width': 'border-inline-start-width',
  'border-right-width': 'border-inline-end-width',
  'border-left-color': 'border-inline-start-color',
  'border-right-color': 'border-inline-end-color',
  'border-left-style': 'border-inline-start-style',
  'border-right-style': 'border-inline-end-style',
  // Border radius
  'border-top-left-radius': 'border-start-start-radius',
  'border-top-right-radius': 'border-start-end-radius',
  'border-bottom-left-radius': 'border-end-start-radius',
  'border-bottom-right-radius': 'border-end-end-radius',
  // Position
  'left': 'inset-inline-start',
  'right': 'inset-inline-end',
  // Text
  'text-align': 'text-align', // Handle separately
}

// Logical to physical (reverse mapping)
const LOGICAL_TO_PHYSICAL_MAP: Record<string, string> = Object.entries(
  PHYSICAL_TO_LOGICAL_MAP
).reduce((acc, [physical, logical]) => {
  acc[logical] = physical
  return acc
}, {} as Record<string, string>)

/**
 * Get the logical CSS property for a physical property
 *
 * @param physicalProperty - Physical CSS property name
 * @returns Logical CSS property name, or original if no mapping exists
 *
 * @example
 * getLogicalProperty('margin-left')  // 'margin-inline-start'
 * getLogicalProperty('padding-right') // 'padding-inline-end'
 */
export function getLogicalProperty(physicalProperty: string): string {
  return PHYSICAL_TO_LOGICAL_MAP[physicalProperty] || physicalProperty
}

/**
 * Get the physical CSS property for a logical property
 *
 * @param logicalProperty - Logical CSS property name
 * @returns Physical CSS property name, or original if no mapping exists
 */
export function getPhysicalProperty(logicalProperty: string): string {
  return LOGICAL_TO_PHYSICAL_MAP[logicalProperty] || logicalProperty
}

/**
 * Convert a CSS style object from physical to logical properties
 *
 * @param style - CSS style object with physical properties
 * @returns New style object with logical properties
 *
 * @example
 * toLogicalStyle({ marginLeft: 8, paddingRight: 16 })
 * // { marginInlineStart: 8, paddingInlineEnd: 16 }
 */
export function toLogicalStyle(
  style: React.CSSProperties
): React.CSSProperties {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(style)) {
    // Convert camelCase to kebab-case for lookup
    const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    const logicalKey = PHYSICAL_TO_LOGICAL_MAP[kebabKey]

    if (logicalKey) {
      // Convert back to camelCase
      const camelLogical = logicalKey.replace(/-([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      )
      result[camelLogical] = value
    } else {
      result[key] = value
    }
  }

  return result as React.CSSProperties
}

/**
 * Get RTL-aware text alignment
 *
 * @param alignment - Desired alignment ('left', 'right', 'start', 'end', 'center')
 * @param isRTL - Whether current layout is RTL
 * @returns Physical alignment value for CSS
 */
export function getTextAlignment(
  alignment: 'left' | 'right' | 'start' | 'end' | 'center',
  isRTL: boolean
): 'left' | 'right' | 'center' {
  if (alignment === 'center') return 'center'

  if (alignment === 'start') {
    return isRTL ? 'right' : 'left'
  }

  if (alignment === 'end') {
    return isRTL ? 'left' : 'right'
  }

  return alignment
}

/**
 * Get transform value for RTL icon flipping
 *
 * @param isRTL - Whether current layout is RTL
 * @param shouldFlip - Whether this icon should flip in RTL
 * @returns CSS transform value
 */
export function getIconTransform(
  isRTL: boolean,
  shouldFlip: boolean
): string {
  if (!isRTL || !shouldFlip) return 'none'
  return 'scaleX(-1)'
}

/**
 * Create RTL-aware inline style object
 *
 * @param ltrStyle - Style to use in LTR mode
 * @param rtlStyle - Style to use in RTL mode
 * @param isRTL - Current direction state
 * @returns Appropriate style object
 */
export function rtlStyle<T extends React.CSSProperties>(
  ltrStyle: T,
  rtlStyle: T,
  isRTL: boolean
): T {
  return isRTL ? rtlStyle : ltrStyle
}

/**
 * Get RTL-aware flex direction
 *
 * @param direction - Base flex direction
 * @param isRTL - Whether current layout is RTL
 * @returns Appropriate flex direction
 */
export function getFlexDirection(
  direction: 'row' | 'row-reverse' | 'column' | 'column-reverse',
  isRTL: boolean
): 'row' | 'row-reverse' | 'column' | 'column-reverse' {
  if (!isRTL) return direction

  switch (direction) {
    case 'row':
      return 'row-reverse'
    case 'row-reverse':
      return 'row'
    default:
      return direction // Column directions unchanged
  }
}

// Default export
export default {
  RTL_LOCALES,
  isRTLLocale,
  getLocaleDirection,
  flipDirection,
  logicalToPhysical,
  physicalToLogical,
  getLogicalProperty,
  getPhysicalProperty,
  toLogicalStyle,
  getTextAlignment,
  getIconTransform,
  rtlStyle,
  getFlexDirection
}

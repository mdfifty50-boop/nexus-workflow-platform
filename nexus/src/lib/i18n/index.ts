/**
 * i18n Localization & RTL Infrastructure
 *
 * Comprehensive internationalization system for Nexus with full Arabic support.
 *
 * Features:
 * - Arabic (MSA) and Kuwaiti dialect support
 * - Complex Arabic pluralization (6 forms)
 * - Eastern Arabic numeral formatting
 * - Hijri calendar date formatting
 * - RTL text direction handling
 * - Locale detection and persistence
 *
 * Usage:
 * ```typescript
 * import {
 *   // Translation functions
 *   t, tPlural, tNumber, tDate,
 *   // Locale management
 *   setLocale, getCurrentLocale, isRTL,
 *   // RTL utilities
 *   RTLProvider, useRTLContext, marginStart
 * } from '@/lib/i18n';
 *
 * // Basic translation
 * t('common.save') // Returns: 'حفظ' (in Arabic)
 *
 * // Pluralization
 * tPlural('plurals.workflow', 5) // Returns: '5 سير عمل'
 *
 * // Number formatting with Eastern Arabic numerals
 * tNumber(1234.56) // Returns: '١٬٢٣٤٫٥٦'
 *
 * // Date formatting with optional Hijri calendar
 * tDate(new Date(), { useHijri: true }) // Returns: '١٤ رجب ١٤٤٧'
 * ```
 */

// ====================
// RTL Provider exports
// ====================
export {
  RTLProvider,
  useRTLContext,
  useIsRTL,
  useDirection,
  RTLContext,
  RTL_LOCALES
} from './rtl-provider'

// ====================
// RTL Utility exports
// ====================
export {
  // Locale detection
  isRTLLocale,
  getLocaleDirection,
  // Direction conversion
  flipDirection,
  logicalToPhysical,
  physicalToLogical,
  // CSS property mapping
  getLogicalProperty,
  getPhysicalProperty,
  toLogicalStyle,
  // Text alignment
  getTextAlignment,
  // Icon utilities
  getIconTransform,
  // Style helpers
  rtlStyle,
  getFlexDirection,
  // Types
  type RTLLocaleCode
} from './rtl-utils'

// ====================
// RTL Style exports
// ====================
export {
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
} from './rtl-styles'

// Re-export RTL types
export type { Direction } from './rtl-utils'

// ====================
// Localization Types
// ====================
export type {
  SupportedLocale,
  LocaleConfig,
  TextDirection,
  CalendarSystem,
  NumeralSystem,
  ArabicPluralForm,
  InterpolationOptions,
  NumberFormatOptions,
  DateFormatOptions,
  RelativeTimeOptions,
  TranslationResource,
  TranslationNamespace,
  TranslationKey,
  LanguageChangeEvent,
  LanguageChangeCallback,
  LocaleDetectionOptions,
  RTLClassMap,
} from './types'

// Export type constants
export {
  SUPPORTED_LOCALES,
  TEXT_DIRECTIONS,
  CALENDAR_SYSTEMS,
  NUMERAL_SYSTEMS,
  ARABIC_PLURAL_FORMS,
  DETECTION_SOURCES,
} from './types'

// ====================
// Locale Configuration
// ====================
export {
  localeConfig,
  supportedLocales,
  getLocaleConfig,
  isLocaleSupported,
  getFallbackChain,
  detectLocale,
  getCurrentLocale,
  getCurrentLocaleConfig,
  isRTL,
  getTextDirection,
  setLocale,
  initLocale,
  toggleLocale,
  toggleArabicVariant,
  onLocaleChange,
  getAvailableLocales,
  getLocalesByFamily,
  formatLocaleForDisplay,
  getNativeLanguageName,
  getEnglishLanguageName,
  localeIsRTL,
  getBCP47Locale,
  getDefaultCalendar,
  getDefaultNumeralSystem,
} from './locale-config'

// ====================
// Translation Functions
// ====================
export {
  t,
  tPlural,
  tNumber,
  tCurrency,
  tPercent,
  tDate,
  tHijriDate,
  tRelativeTime,
  tOrdinal,
  tList,
  toEasternArabic,
  toWesternNumerals,
  getArabicPluralForm,
} from './translation-service'

// ====================
// Translation Resources
// ====================
export { default as arTranslations } from './locales/ar'
export { default as arKwTranslations, kuwaitiPhrases } from './locales/ar-kw'

// ====================
// Combined Namespace
// ====================
import * as localeConfigModule from './locale-config'
import * as translationServiceModule from './translation-service'

/**
 * Combined i18n namespace for convenient imports
 */
export const i18n = {
  ...localeConfigModule,
  ...translationServiceModule,
}

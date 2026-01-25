/**
 * Type definitions for the i18n localization system
 */

/**
 * Supported locale codes
 */
export const SUPPORTED_LOCALES = ['en', 'ar', 'ar-KW'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Text direction
 */
export const TEXT_DIRECTIONS = ['ltr', 'rtl'] as const;
export type TextDirection = (typeof TEXT_DIRECTIONS)[number];

/**
 * Calendar systems supported
 */
export const CALENDAR_SYSTEMS = ['gregorian', 'islamic-umalqura', 'islamic-civil'] as const;
export type CalendarSystem = (typeof CALENDAR_SYSTEMS)[number];

/**
 * Number formatting styles
 */
export const NUMERAL_SYSTEMS = ['latn', 'arab'] as const;
export type NumeralSystem = (typeof NUMERAL_SYSTEMS)[number];

/**
 * Arabic plural forms (6 total)
 * Arabic has one of the most complex pluralization rules
 */
export const ARABIC_PLURAL_FORMS = ['zero', 'one', 'two', 'few', 'many', 'other'] as const;
export type ArabicPluralForm = (typeof ARABIC_PLURAL_FORMS)[number];

/**
 * Locale configuration type
 */
export interface LocaleConfig {
  /** Language code (e.g., 'ar', 'en') */
  code: SupportedLocale;
  /** Display name in English */
  name: string;
  /** Display name in native language */
  nativeName: string;
  /** Text direction */
  direction: TextDirection;
  /** BCP 47 locale tag for Intl APIs */
  locale: string;
  /** Default calendar system */
  calendar: CalendarSystem;
  /** Default numeral system */
  numeralSystem: NumeralSystem;
  /** Country/region flag emoji */
  flag: string;
  /** Whether this is the default locale */
  isDefault?: boolean;
  /** Parent locale for fallback (e.g., ar-KW falls back to ar) */
  fallback?: SupportedLocale;
}

/**
 * Translation interpolation options
 */
export interface InterpolationOptions {
  /** Variable values to interpolate */
  values?: Record<string, string | number>;
  /** Count for pluralization */
  count?: number;
  /** Context for contextual translations */
  context?: string;
  /** Default value if key not found */
  defaultValue?: string;
  /** Escape interpolated values (default: true) */
  escape?: boolean;
}

/**
 * Number formatting options
 */
export interface NumberFormatOptions {
  /** Locale to use (defaults to current) */
  locale?: SupportedLocale;
  /** Use Eastern Arabic numerals */
  useEasternArabic?: boolean;
  /** Number of decimal places */
  decimals?: number;
  /** Minimum decimal places */
  minDecimals?: number;
  /** Maximum decimal places */
  maxDecimals?: number;
  /** Currency code for currency formatting */
  currency?: string;
  /** Currency display style */
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  /** Style of formatting */
  style?: 'decimal' | 'currency' | 'percent' | 'unit';
  /** Unit for unit formatting */
  unit?: string;
  /** Whether to use grouping separators */
  useGrouping?: boolean;
  /** Notation style */
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  /** Sign display */
  signDisplay?: 'auto' | 'never' | 'always' | 'exceptZero';
}

/**
 * Date formatting options
 */
export interface DateFormatOptions {
  /** Locale to use (defaults to current) */
  locale?: SupportedLocale;
  /** Calendar system to use */
  calendar?: CalendarSystem;
  /** Use Hijri calendar */
  useHijri?: boolean;
  /** Date style preset */
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  /** Time style preset */
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  /** Timezone */
  timeZone?: string;
  /** Hour cycle */
  hour12?: boolean;
  /** Weekday format */
  weekday?: 'long' | 'short' | 'narrow';
  /** Year format */
  year?: 'numeric' | '2-digit';
  /** Month format */
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  /** Day format */
  day?: 'numeric' | '2-digit';
  /** Hour format */
  hour?: 'numeric' | '2-digit';
  /** Minute format */
  minute?: 'numeric' | '2-digit';
  /** Second format */
  second?: 'numeric' | '2-digit';
}

/**
 * Relative time formatting options
 */
export interface RelativeTimeOptions {
  /** Locale to use */
  locale?: SupportedLocale;
  /** Style of the output */
  style?: 'long' | 'short' | 'narrow';
  /** Numeric vs auto (e.g., "yesterday" vs "1 day ago") */
  numeric?: 'always' | 'auto';
}

/**
 * Translation namespace type
 * Allows for organized translation keys
 */
export type TranslationNamespace =
  | 'common'
  | 'auth'
  | 'errors'
  | 'success'
  | 'workflow'
  | 'dashboard'
  | 'navigation'
  | 'forms'
  | 'time'
  | 'settings'
  | 'accessibility'
  | 'kuwaiti';

/**
 * Translation key path
 * Supports dot notation for nested keys
 */
export type TranslationKey = string;

/**
 * Translation resource structure
 * Defines the shape of translation files
 */
export interface TranslationResource {
  [namespace: string]: TranslationNamespaceContent;
}

/**
 * Content within a translation namespace
 */
export interface TranslationNamespaceContent {
  [key: string]: string | TranslationNamespaceContent;
}

/**
 * Locale detection sources
 */
export const DETECTION_SOURCES = [
  'localStorage',
  'navigator',
  'htmlTag',
  'querystring',
  'cookie',
] as const;
export type DetectionSource = (typeof DETECTION_SOURCES)[number];

/**
 * Locale detection options
 */
export interface LocaleDetectionOptions {
  /** Order of detection sources */
  order?: DetectionSource[];
  /** localStorage key for saved preference */
  localStorageKey?: string;
  /** Query parameter name */
  queryParam?: string;
  /** Cookie name */
  cookieName?: string;
  /** Default locale if none detected */
  defaultLocale?: SupportedLocale;
}

/**
 * RTL utility class mapping
 */
export interface RTLClassMap {
  /** LTR class */
  ltr: string;
  /** RTL class */
  rtl: string;
}

/**
 * Translation function type
 */
export type TranslateFunction = (
  key: TranslationKey,
  options?: InterpolationOptions
) => string;

/**
 * Plural translation function type
 */
export type PluralTranslateFunction = (
  key: TranslationKey,
  count: number,
  options?: Omit<InterpolationOptions, 'count'>
) => string;

/**
 * Number format function type
 */
export type NumberFormatFunction = (
  value: number,
  options?: NumberFormatOptions
) => string;

/**
 * Date format function type
 */
export type DateFormatFunction = (
  date: Date | number | string,
  options?: DateFormatOptions
) => string;

/**
 * Language change event
 */
export interface LanguageChangeEvent {
  previousLocale: SupportedLocale;
  newLocale: SupportedLocale;
  direction: TextDirection;
}

/**
 * Language change callback
 */
export type LanguageChangeCallback = (event: LanguageChangeEvent) => void;

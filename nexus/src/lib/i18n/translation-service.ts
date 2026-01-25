/**
 * Translation Service
 *
 * Provides translation utilities with full Arabic support including:
 * - Complex pluralization (6 forms for Arabic)
 * - Eastern Arabic numeral formatting
 * - Hijri calendar date formatting
 * - RTL-safe string interpolation
 */

import type {
  SupportedLocale,
  InterpolationOptions,
  NumberFormatOptions,
  DateFormatOptions,
  RelativeTimeOptions,
  ArabicPluralForm,
  TranslationResource,
  CalendarSystem,
} from './types';
import { getCurrentLocale, getLocaleConfig } from './locale-config';

// Import translation resources
import ar from './locales/ar';
import arKw from './locales/ar-kw';

/**
 * Translation resources map
 */
const translations: Record<string, TranslationResource> = {
  ar,
  'ar-KW': arKw,
};

/**
 * Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩)
 */
const EASTERN_ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Western Arabic numerals for reverse mapping
 */
const WESTERN_NUMERALS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Get a value from a nested object using dot notation path
 */
const getNestedValue = (obj: Record<string, unknown>, path: string): string | undefined => {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'string' ? current : undefined;
};

/**
 * Escape HTML entities in a string
 */
const escapeHtml = (str: string): string => {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEntities[char]);
};

/**
 * Interpolate variables into a string
 * Handles RTL-safe interpolation with proper Unicode markers
 */
const interpolate = (
  template: string,
  values: Record<string, string | number>,
  escape = true
): string => {
  // Use Unicode markers for RTL-safe interpolation
  const LRM = '\u200E'; // Left-to-Right Mark
  // Reserved for future RTL text wrapping
  const _RLM = '\u200F'; // Right-to-Left Mark
  void _RLM;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = values[key];
    if (value === undefined) {
      return match;
    }

    const stringValue = String(value);
    const escapedValue = escape ? escapeHtml(stringValue) : stringValue;

    // Wrap numbers with directional markers for RTL safety
    if (typeof value === 'number') {
      return `${LRM}${escapedValue}${LRM}`;
    }

    return escapedValue;
  });
};

/**
 * Determine Arabic plural form based on count
 *
 * Arabic pluralization rules:
 * - zero: n = 0
 * - one: n = 1
 * - two: n = 2
 * - few: n % 100 = 3-10
 * - many: n % 100 = 11-99
 * - other: everything else (including 100, 200, etc.)
 */
const getArabicPluralForm = (count: number): ArabicPluralForm => {
  const absCount = Math.abs(count);

  if (absCount === 0) return 'zero';
  if (absCount === 1) return 'one';
  if (absCount === 2) return 'two';

  const mod100 = absCount % 100;

  if (mod100 >= 3 && mod100 <= 10) return 'few';
  if (mod100 >= 11 && mod100 <= 99) return 'many';

  return 'other';
};

/**
 * Convert Western numerals to Eastern Arabic numerals
 */
const toEasternArabic = (num: string | number): string => {
  return String(num).replace(/[0-9]/g, (digit) => EASTERN_ARABIC_NUMERALS[parseInt(digit, 10)]);
};

/**
 * Convert Eastern Arabic numerals to Western numerals
 */
const toWesternNumerals = (str: string): string => {
  return str.replace(/[٠-٩]/g, (digit) => {
    const index = EASTERN_ARABIC_NUMERALS.indexOf(digit);
    return index >= 0 ? WESTERN_NUMERALS[index] : digit;
  });
};

/**
 * Get translation resource for a locale
 */
const getTranslations = (locale: SupportedLocale): TranslationResource | undefined => {
  // Try exact match first
  if (translations[locale]) {
    return translations[locale];
  }

  // Try base language (e.g., 'ar' for 'ar-KW')
  const baseLocale = locale.split('-')[0];
  if (translations[baseLocale]) {
    return translations[baseLocale];
  }

  return undefined;
};

/**
 * Main translation function
 *
 * @param key - Translation key (supports dot notation for namespaces)
 * @param options - Interpolation options
 * @returns Translated string
 *
 * @example
 * t('common.save') // Returns: 'حفظ'
 * t('errors.minLength', { values: { min: 8 } }) // Returns: 'يجب أن يحتوي على 8 حرف على الأقل.'
 * t('workflow.noWorkflows', { defaultValue: 'No workflows' })
 */
export const t = (key: string, options: InterpolationOptions = {}): string => {
  const locale = getCurrentLocale();
  const config = getLocaleConfig(locale);

  // Get translation resource
  const resource = getTranslations(locale);

  // Try to find translation
  let translation = resource ? getNestedValue(resource as Record<string, unknown>, key) : undefined;

  // If not found and has fallback, try fallback locale
  if (!translation && config.fallback) {
    const fallbackResource = getTranslations(config.fallback);
    translation = fallbackResource
      ? getNestedValue(fallbackResource as Record<string, unknown>, key)
      : undefined;
  }

  // Return default value or key if not found
  if (!translation) {
    return options.defaultValue ?? key;
  }

  // Handle interpolation
  if (options.values) {
    translation = interpolate(translation, options.values, options.escape !== false);
  }

  return translation;
};

/**
 * Plural translation function
 *
 * Handles Arabic's complex 6-form pluralization automatically.
 *
 * @param key - Base translation key
 * @param count - Count for pluralization
 * @param options - Additional interpolation options
 * @returns Pluralized translation
 *
 * @example
 * tPlural('plurals.workflow', 0) // Returns: 'لا يوجد سير عمل'
 * tPlural('plurals.workflow', 1) // Returns: 'سير عمل واحد'
 * tPlural('plurals.workflow', 2) // Returns: 'سير عمل اثنان'
 * tPlural('plurals.workflow', 5) // Returns: '5 سير عمل' (few form)
 * tPlural('plurals.workflow', 15) // Returns: '15 سير عمل' (many form)
 */
export const tPlural = (
  key: string,
  count: number,
  options: Omit<InterpolationOptions, 'count'> = {}
): string => {
  const locale = getCurrentLocale();

  // Get the appropriate plural form
  const pluralForm = locale.startsWith('ar')
    ? getArabicPluralForm(count)
    : count === 1
      ? 'one'
      : 'other';

  // Build the plural key
  const pluralKey = `${key}_${pluralForm}`;

  // Try to get the plural form, fall back to base key
  const result = t(pluralKey, {
    ...options,
    values: { ...options.values, count },
    defaultValue: undefined,
  });

  // If specific plural form not found, try base key with count interpolation
  if (result === pluralKey) {
    return t(key, {
      ...options,
      values: { ...options.values, count },
    });
  }

  return result;
};

/**
 * Format a number according to locale
 *
 * Supports Eastern Arabic numerals and various formatting styles.
 *
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Formatted number string
 *
 * @example
 * tNumber(1234.56) // Returns: '١٬٢٣٤٫٥٦' (in Arabic with Eastern numerals)
 * tNumber(1234.56, { useEasternArabic: false }) // Returns: '1,234.56'
 * tNumber(99.99, { style: 'currency', currency: 'KWD' }) // Returns: '٩٩٫٩٩ د.ك.'
 */
export const tNumber = (value: number, options: NumberFormatOptions = {}): string => {
  const locale = options.locale ?? getCurrentLocale();
  const config = getLocaleConfig(locale);

  // Determine whether to use Eastern Arabic numerals
  const useEastern = options.useEasternArabic ?? config.numeralSystem === 'arab';

  // Build Intl.NumberFormat options
  const formatOptions: Intl.NumberFormatOptions = {
    style: options.style ?? 'decimal',
    useGrouping: options.useGrouping ?? true,
    minimumFractionDigits: options.minDecimals ?? options.decimals,
    maximumFractionDigits: options.maxDecimals ?? options.decimals,
    notation: options.notation,
    signDisplay: options.signDisplay,
  };

  // Add currency options
  if (options.style === 'currency' && options.currency) {
    formatOptions.currency = options.currency;
    formatOptions.currencyDisplay = options.currencyDisplay ?? 'symbol';
  }

  // Add unit options
  if (options.style === 'unit' && options.unit) {
    formatOptions.unit = options.unit;
  }

  // Set numbering system
  const localeWithNumbering = useEastern ? `${config.locale}-u-nu-arab` : config.locale;

  try {
    const formatter = new Intl.NumberFormat(localeWithNumbering, formatOptions);
    return formatter.format(value);
  } catch {
    // Fallback for unsupported options
    const basicFormatter = new Intl.NumberFormat(config.locale, {
      style: formatOptions.style,
      useGrouping: formatOptions.useGrouping,
    });
    const formatted = basicFormatter.format(value);
    return useEastern ? toEasternArabic(formatted) : formatted;
  }
};

/**
 * Format currency with locale-appropriate styling
 *
 * @param value - Amount to format
 * @param currency - Currency code (default: KWD for Arabic)
 * @param options - Additional formatting options
 * @returns Formatted currency string
 *
 * @example
 * tCurrency(99.99) // Returns: '٩٩٫٩٩٠ د.ك.' (for Arabic/Kuwait)
 * tCurrency(99.99, 'USD') // Returns: '٩٩٫٩٩ $'
 */
export const tCurrency = (
  value: number,
  currency?: string,
  options: Omit<NumberFormatOptions, 'style' | 'currency'> = {}
): string => {
  const locale = options.locale ?? getCurrentLocale();

  // Default currency based on locale
  const defaultCurrency = locale.includes('KW') ? 'KWD' : locale.startsWith('ar') ? 'SAR' : 'USD';

  return tNumber(value, {
    ...options,
    style: 'currency',
    currency: currency ?? defaultCurrency,
    // KWD has 3 decimal places
    decimals: currency === 'KWD' || (!currency && locale.includes('KW')) ? 3 : 2,
  });
};

/**
 * Format a percentage
 *
 * @param value - Value to format as percentage (0.5 = 50%)
 * @param options - Formatting options
 * @returns Formatted percentage string
 *
 * @example
 * tPercent(0.75) // Returns: '٧٥%' (in Arabic)
 */
export const tPercent = (
  value: number,
  options: Omit<NumberFormatOptions, 'style'> = {}
): string => {
  return tNumber(value, {
    ...options,
    style: 'percent',
    decimals: options.decimals ?? 0,
  });
};

/**
 * Get Intl calendar name from our calendar type
 */
const getIntlCalendar = (calendar: CalendarSystem): string => {
  switch (calendar) {
    case 'islamic-umalqura':
      return 'islamic-umalqura';
    case 'islamic-civil':
      return 'islamic-civil';
    default:
      return 'gregory';
  }
};

/**
 * Format a date according to locale
 *
 * Supports both Gregorian and Hijri (Islamic) calendars.
 *
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted date string
 *
 * @example
 * tDate(new Date()) // Returns: '١٤ يناير ٢٠٢٦' (in Arabic)
 * tDate(new Date(), { useHijri: true }) // Returns: '١٤ رجب ١٤٤٧'
 * tDate(new Date(), { dateStyle: 'full' }) // Returns: 'الثلاثاء، ١٤ يناير ٢٠٢٦'
 */
export const tDate = (
  date: Date | number | string,
  options: DateFormatOptions = {}
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const locale = options.locale ?? getCurrentLocale();
  const config = getLocaleConfig(locale);

  // Determine calendar to use
  const calendar = options.calendar ?? (options.useHijri ? 'islamic-umalqura' : config.calendar);
  const intlCalendar = getIntlCalendar(calendar);

  // Build locale with calendar extension
  const localeWithCalendar =
    intlCalendar !== 'gregory' ? `${config.locale}-u-ca-${intlCalendar}` : config.locale;

  // Use Eastern Arabic numerals for Arabic locales
  const localeWithNumbering = locale.startsWith('ar')
    ? `${localeWithCalendar}-nu-arab`
    : localeWithCalendar;

  // Build format options
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: options.timeZone,
  };

  // Use style presets or individual options
  if (options.dateStyle) {
    formatOptions.dateStyle = options.dateStyle;
  }
  if (options.timeStyle) {
    formatOptions.timeStyle = options.timeStyle;
  }

  // If no style presets, use individual options
  if (!options.dateStyle && !options.timeStyle) {
    if (options.weekday) formatOptions.weekday = options.weekday;
    if (options.year) formatOptions.year = options.year;
    if (options.month) formatOptions.month = options.month;
    if (options.day) formatOptions.day = options.day;
    if (options.hour) formatOptions.hour = options.hour;
    if (options.minute) formatOptions.minute = options.minute;
    if (options.second) formatOptions.second = options.second;

    // Default to medium date style if nothing specified
    if (Object.keys(formatOptions).length === (options.timeZone ? 1 : 0)) {
      formatOptions.year = 'numeric';
      formatOptions.month = 'long';
      formatOptions.day = 'numeric';
    }
  }

  if (options.hour12 !== undefined) {
    formatOptions.hour12 = options.hour12;
  }

  try {
    const formatter = new Intl.DateTimeFormat(localeWithNumbering, formatOptions);
    return formatter.format(dateObj);
  } catch {
    // Fallback
    const basicFormatter = new Intl.DateTimeFormat(config.locale, formatOptions);
    return basicFormatter.format(dateObj);
  }
};

/**
 * Format a date in Hijri calendar
 *
 * Convenience function for Islamic calendar formatting.
 *
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted Hijri date string
 *
 * @example
 * tHijriDate(new Date()) // Returns: '١٤ رجب ١٤٤٧'
 */
export const tHijriDate = (
  date: Date | number | string,
  options: Omit<DateFormatOptions, 'useHijri' | 'calendar'> = {}
): string => {
  return tDate(date, { ...options, calendar: 'islamic-umalqura' });
};

/**
 * Format relative time
 *
 * @param date - Date to format relative to now
 * @param options - Formatting options
 * @returns Relative time string
 *
 * @example
 * tRelativeTime(yesterday) // Returns: 'أمس' (with numeric: 'auto')
 * tRelativeTime(fiveDaysAgo) // Returns: 'منذ ٥ أيام'
 */
export const tRelativeTime = (
  date: Date | number | string,
  options: RelativeTimeOptions = {}
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const locale = options.locale ?? getCurrentLocale();
  const config = getLocaleConfig(locale);

  const now = Date.now();
  const diff = dateObj.getTime() - now;
  const absDiff = Math.abs(diff);

  // Determine the appropriate unit
  const seconds = absDiff / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const weeks = days / 7;
  const months = days / 30;
  const years = days / 365;

  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;

  if (seconds < 60) {
    value = Math.round(seconds);
    unit = 'second';
  } else if (minutes < 60) {
    value = Math.round(minutes);
    unit = 'minute';
  } else if (hours < 24) {
    value = Math.round(hours);
    unit = 'hour';
  } else if (days < 7) {
    value = Math.round(days);
    unit = 'day';
  } else if (weeks < 4) {
    value = Math.round(weeks);
    unit = 'week';
  } else if (months < 12) {
    value = Math.round(months);
    unit = 'month';
  } else {
    value = Math.round(years);
    unit = 'year';
  }

  // Make value negative for past, positive for future
  const relativeValue = diff < 0 ? -value : value;

  // Use Eastern Arabic numerals for Arabic locales
  const localeWithNumbering = locale.startsWith('ar')
    ? `${config.locale}-u-nu-arab`
    : config.locale;

  try {
    const formatter = new Intl.RelativeTimeFormat(localeWithNumbering, {
      style: options.style ?? 'long',
      numeric: options.numeric ?? 'auto',
    });
    return formatter.format(relativeValue, unit);
  } catch {
    // Fallback
    const basicFormatter = new Intl.RelativeTimeFormat(config.locale, {
      style: 'long',
      numeric: 'auto',
    });
    return basicFormatter.format(relativeValue, unit);
  }
};

/**
 * Get the ordinal suffix for a number in Arabic
 *
 * @param num - Number to get ordinal for
 * @returns Ordinal string
 *
 * @example
 * tOrdinal(1) // Returns: 'الأول'
 * tOrdinal(2) // Returns: 'الثاني'
 * tOrdinal(3) // Returns: 'الثالث'
 */
export const tOrdinal = (num: number): string => {
  const ordinals: Record<number, string> = {
    1: 'الأول',
    2: 'الثاني',
    3: 'الثالث',
    4: 'الرابع',
    5: 'الخامس',
    6: 'السادس',
    7: 'السابع',
    8: 'الثامن',
    9: 'التاسع',
    10: 'العاشر',
    11: 'الحادي عشر',
    12: 'الثاني عشر',
  };

  if (ordinals[num]) {
    return ordinals[num];
  }

  // For numbers beyond our dictionary, use numeric representation
  return tNumber(num);
};

/**
 * Format a list in locale-appropriate way
 *
 * @param items - Array of items to format
 * @param options - List format options
 * @returns Formatted list string
 *
 * @example
 * tList(['أحمد', 'محمد', 'سارة']) // Returns: 'أحمد ومحمد وسارة'
 */
export const tList = (
  items: string[],
  options: { type?: 'conjunction' | 'disjunction' | 'unit'; style?: 'long' | 'short' | 'narrow' } = {}
): string => {
  const locale = getCurrentLocale();
  const config = getLocaleConfig(locale);

  try {
    const formatter = new Intl.ListFormat(config.locale, {
      type: options.type ?? 'conjunction',
      style: options.style ?? 'long',
    });
    return formatter.format(items);
  } catch {
    // Fallback: simple join with و (and) for Arabic
    const separator = locale.startsWith('ar') ? ' و' : ', ';
    return items.join(separator);
  }
};

// Re-export utility functions
export { toEasternArabic, toWesternNumerals, getArabicPluralForm };

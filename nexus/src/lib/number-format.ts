/**
 * Number Formatting Utilities
 *
 * Provides locale-aware number formatting using Intl.NumberFormat.
 * Supports English (US) and Arabic (Kuwait) locales with optional Arabic numerals.
 *
 * Usage:
 *   import { formatNumber, formatCurrency, formatPercent } from '@/lib/number-format'
 *
 *   formatNumber(1234567.89, 'en')              // "1,234,567.89"
 *   formatNumber(1234567.89, 'ar')              // "1,234,567.89" (Western numerals)
 *   formatNumber(1234567.89, 'ar', true)        // "١٬٢٣٤٬٥٦٧٫٨٩" (Arabic numerals)
 *   formatCurrency(99.99, 'en', 'USD')          // "$99.99"
 *   formatCurrency(99.99, 'ar', 'KWD')          // "99.990 د.ك."
 *   formatPercent(0.75, 'en')                   // "75%"
 */

import { languageConfig, type SupportedLanguage } from '@/i18n'

// Get the locale string for Intl APIs
export function getLocale(language: SupportedLanguage): string {
  return languageConfig[language]?.locale || 'en-US'
}

// Arabic numeral conversion map
const WESTERN_TO_ARABIC_NUMERALS: Record<string, string> = {
  '0': '\u0660', // ٠
  '1': '\u0661', // ١
  '2': '\u0662', // ٢
  '3': '\u0663', // ٣
  '4': '\u0664', // ٤
  '5': '\u0665', // ٥
  '6': '\u0666', // ٦
  '7': '\u0667', // ٧
  '8': '\u0668', // ٨
  '9': '\u0669', // ٩
  '.': '\u066B', // ٫ Arabic decimal separator
  ',': '\u066C'  // ٬ Arabic thousands separator
}

/**
 * Convert Western numerals to Arabic-Indic numerals
 *
 * @param str - String containing Western numerals
 * @returns String with Arabic-Indic numerals
 *
 * @example
 * toArabicNumerals("1,234.56")  // "١٬٢٣٤٫٥٦"
 */
export function toArabicNumerals(str: string): string {
  return str.replace(/[0-9.,]/g, char => WESTERN_TO_ARABIC_NUMERALS[char] || char)
}

/**
 * Convert Arabic-Indic numerals to Western numerals
 *
 * @param str - String containing Arabic-Indic numerals
 * @returns String with Western numerals
 */
export function toWesternNumerals(str: string): string {
  const reverseMap: Record<string, string> = {}
  Object.entries(WESTERN_TO_ARABIC_NUMERALS).forEach(([w, a]) => {
    reverseMap[a] = w
  })
  return str.replace(/[\u0660-\u0669\u066B\u066C]/g, char => reverseMap[char] || char)
}

// Number formatting style presets
export type NumberFormatStyle = 'decimal' | 'integer' | 'compact' | 'scientific'

interface FormatNumberOptions {
  style?: NumberFormatStyle
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  useArabicNumerals?: boolean
}

/**
 * Format a number according to locale
 *
 * @param value - The number to format
 * @param language - The language code ('en' or 'ar')
 * @param useArabicNumerals - Whether to use Arabic-Indic numerals (only for Arabic)
 * @param options - Additional formatting options
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234567.89, 'en')                  // "1,234,567.89"
 * formatNumber(1234567.89, 'ar')                  // "1,234,567.89"
 * formatNumber(1234567.89, 'ar', true)            // "١٬٢٣٤٬٥٦٧٫٨٩"
 * formatNumber(1234567, 'en', false, { style: 'compact' })  // "1.2M"
 */
export function formatNumber(
  value: number,
  language: SupportedLanguage,
  useArabicNumerals: boolean = false,
  options: FormatNumberOptions = {}
): string {
  const locale = getLocale(language)
  const { style = 'decimal', minimumFractionDigits, maximumFractionDigits } = options

  const intlOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits,
    maximumFractionDigits
  }

  if (style === 'compact') {
    intlOptions.notation = 'compact'
    intlOptions.compactDisplay = 'short'
  } else if (style === 'scientific') {
    intlOptions.notation = 'scientific'
  } else if (style === 'integer') {
    intlOptions.maximumFractionDigits = 0
  }

  try {
    const formatted = new Intl.NumberFormat(locale, intlOptions).format(value)

    // Convert to Arabic numerals if requested and language is Arabic
    if (language === 'ar' && useArabicNumerals) {
      return toArabicNumerals(formatted)
    }

    return formatted
  } catch {
    // Fallback
    return value.toLocaleString()
  }
}

/**
 * Format a number as currency
 *
 * @param value - The monetary value to format
 * @param language - The language code ('en' or 'ar')
 * @param currency - The ISO 4217 currency code (default: 'USD' for en, 'KWD' for ar)
 * @param useArabicNumerals - Whether to use Arabic-Indic numerals
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(99.99, 'en')                    // "$99.99"
 * formatCurrency(99.99, 'en', 'EUR')             // "€99.99"
 * formatCurrency(99.99, 'ar')                    // "99.990 د.ك."
 * formatCurrency(99.99, 'ar', 'USD')             // "99.99 US$"
 * formatCurrency(99.99, 'ar', 'KWD', true)       // "٩٩٫٩٩٠ د.ك."
 */
export function formatCurrency(
  value: number,
  language: SupportedLanguage,
  currency?: string,
  useArabicNumerals: boolean = false
): string {
  const locale = getLocale(language)
  const defaultCurrency = language === 'ar' ? 'KWD' : 'USD'
  const currencyCode = currency || defaultCurrency

  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'symbol'
    }).format(value)

    if (language === 'ar' && useArabicNumerals) {
      return toArabicNumerals(formatted)
    }

    return formatted
  } catch {
    // Fallback
    return `${currencyCode} ${value.toFixed(2)}`
  }
}

/**
 * Format a number as a percentage
 *
 * @param value - The decimal value (0.75 = 75%)
 * @param language - The language code ('en' or 'ar')
 * @param decimals - Number of decimal places (default: 0)
 * @param useArabicNumerals - Whether to use Arabic-Indic numerals
 * @returns Formatted percentage string
 *
 * @example
 * formatPercent(0.75, 'en')           // "75%"
 * formatPercent(0.756, 'en', 1)       // "75.6%"
 * formatPercent(0.75, 'ar')           // "75%"
 * formatPercent(0.75, 'ar', 0, true)  // "٧٥٪"
 */
export function formatPercent(
  value: number,
  language: SupportedLanguage,
  decimals: number = 0,
  useArabicNumerals: boolean = false
): string {
  const locale = getLocale(language)

  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)

    if (language === 'ar' && useArabicNumerals) {
      return toArabicNumerals(formatted)
    }

    return formatted
  } catch {
    // Fallback
    return `${(value * 100).toFixed(decimals)}%`
  }
}

/**
 * Format a number with units (e.g., "5 workflows", "1 hour")
 *
 * @param value - The numeric value
 * @param unit - The unit type
 * @param language - The language code ('en' or 'ar')
 * @param style - Display style ('long', 'short', 'narrow')
 * @returns Formatted number with unit
 *
 * @example
 * formatUnit(5, 'hour', 'en')           // "5 hours"
 * formatUnit(5, 'hour', 'ar')           // "5 ساعات"
 * formatUnit(1, 'day', 'en')            // "1 day"
 * formatUnit(1, 'day', 'ar')            // "يوم واحد"
 */
export function formatUnit(
  value: number,
  unit: Intl.NumberFormatOptions['unit'],
  language: SupportedLanguage,
  style: 'long' | 'short' | 'narrow' = 'long'
): string {
  const locale = getLocale(language)

  try {
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit,
      unitDisplay: style
    }).format(value)
  } catch {
    // Fallback for unsupported units
    return `${value} ${unit}${value !== 1 ? 's' : ''}`
  }
}

/**
 * Format a number in compact form (1K, 1M, 1B)
 *
 * @param value - The number to format
 * @param language - The language code ('en' or 'ar')
 * @param useArabicNumerals - Whether to use Arabic-Indic numerals
 * @returns Compact formatted number
 *
 * @example
 * formatCompact(1234, 'en')             // "1.2K"
 * formatCompact(1234567, 'en')          // "1.2M"
 * formatCompact(1234567890, 'en')       // "1.2B"
 * formatCompact(1234, 'ar')             // "1.2 ألف"
 * formatCompact(1234, 'ar', true)       // "١٫٢ ألف"
 */
export function formatCompact(
  value: number,
  language: SupportedLanguage,
  useArabicNumerals: boolean = false
): string {
  const locale = getLocale(language)

  try {
    const formatted = new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(value)

    if (language === 'ar' && useArabicNumerals) {
      return toArabicNumerals(formatted)
    }

    return formatted
  } catch {
    // Fallback
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
    return value.toString()
  }
}

/**
 * Format bytes as human-readable file size
 *
 * @param bytes - Number of bytes
 * @param language - The language code ('en' or 'ar')
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted file size string
 *
 * @example
 * formatFileSize(1024, 'en')             // "1 KB"
 * formatFileSize(1048576, 'en')          // "1 MB"
 * formatFileSize(1073741824, 'ar')       // "1 غيغابايت"
 */
export function formatFileSize(
  bytes: number,
  language: SupportedLanguage,
  decimals: number = 1
): string {
  if (bytes === 0) {
    return language === 'ar' ? '0 بايت' : '0 B'
  }

  const k = 1024
  const sizes = language === 'ar'
    ? ['بايت', 'كيلوبايت', 'ميغابايت', 'غيغابايت', 'تيرابايت']
    : ['B', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)

  const formatted = formatNumber(value, language, false, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  })

  return `${formatted} ${sizes[i]}`
}

/**
 * Format an ordinal number (1st, 2nd, 3rd...)
 *
 * @param value - The number to format as ordinal
 * @param language - The language code ('en' or 'ar')
 * @returns Ordinal string
 *
 * @example
 * formatOrdinal(1, 'en')   // "1st"
 * formatOrdinal(2, 'en')   // "2nd"
 * formatOrdinal(3, 'en')   // "3rd"
 * formatOrdinal(4, 'en')   // "4th"
 * formatOrdinal(1, 'ar')   // "الأول"
 * formatOrdinal(2, 'ar')   // "الثاني"
 */
export function formatOrdinal(value: number, language: SupportedLanguage): string {
  if (language === 'ar') {
    // Arabic ordinals (simplified - first few)
    const arabicOrdinals: Record<number, string> = {
      1: 'الأول',
      2: 'الثاني',
      3: 'الثالث',
      4: 'الرابع',
      5: 'الخامس',
      6: 'السادس',
      7: 'السابع',
      8: 'الثامن',
      9: 'التاسع',
      10: 'العاشر'
    }
    return arabicOrdinals[value] || `${value}`
  }

  // English ordinals
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = value % 100
  const suffix = (v >= 11 && v <= 13) ? 'th' : suffixes[Math.min(v % 10, 4)] || 'th'
  return `${value}${suffix}`
}

/**
 * Hook to get number formatting functions with current language and Arabic numeral preference
 */
export function useNumberFormat(language: SupportedLanguage, useArabicNumerals: boolean = false) {
  return {
    formatNumber: (value: number, options?: FormatNumberOptions) =>
      formatNumber(value, language, useArabicNumerals, options),
    formatCurrency: (value: number, currency?: string) =>
      formatCurrency(value, language, currency, useArabicNumerals),
    formatPercent: (value: number, decimals?: number) =>
      formatPercent(value, language, decimals, useArabicNumerals),
    formatUnit: (value: number, unit: Intl.NumberFormatOptions['unit'], style?: 'long' | 'short' | 'narrow') =>
      formatUnit(value, unit, language, style),
    formatCompact: (value: number) =>
      formatCompact(value, language, useArabicNumerals),
    formatFileSize: (bytes: number, decimals?: number) =>
      formatFileSize(bytes, language, decimals),
    formatOrdinal: (value: number) =>
      formatOrdinal(value, language),
    toArabicNumerals,
    toWesternNumerals
  }
}

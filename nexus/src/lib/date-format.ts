/**
 * Date/Time Localization Utilities
 *
 * Provides locale-aware date and time formatting using Intl.DateTimeFormat.
 * Supports English (US) and Arabic (Kuwait) locales.
 *
 * Usage:
 *   import { formatDate, formatTime, formatRelativeTime } from '@/lib/date-format'
 *
 *   formatDate(new Date(), 'en')           // "January 12, 2026"
 *   formatDate(new Date(), 'ar')           // "12 يناير 2026"
 *   formatTime(new Date(), 'en')           // "3:45 PM"
 *   formatTime(new Date(), 'ar')           // "3:45 م"
 *   formatRelativeTime(new Date(), 'en')   // "2 hours ago"
 */

import { languageConfig, type SupportedLanguage } from '@/i18n'

// Get the locale string for Intl APIs
export function getLocale(language: SupportedLanguage): string {
  return languageConfig[language]?.locale || 'en-US'
}

// Date formatting options presets
export type DateFormatStyle = 'full' | 'long' | 'medium' | 'short' | 'numeric' | 'monthYear' | 'dayMonth'

const DATE_FORMAT_OPTIONS: Record<DateFormatStyle, Intl.DateTimeFormatOptions> = {
  full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  long: { year: 'numeric', month: 'long', day: 'numeric' },
  medium: { year: 'numeric', month: 'short', day: 'numeric' },
  short: { year: '2-digit', month: 'numeric', day: 'numeric' },
  numeric: { year: 'numeric', month: '2-digit', day: '2-digit' },
  monthYear: { year: 'numeric', month: 'long' },
  dayMonth: { month: 'long', day: 'numeric' }
}

// Time formatting options presets
export type TimeFormatStyle = 'full' | 'long' | 'short' | 'shortSeconds'

const TIME_FORMAT_OPTIONS: Record<TimeFormatStyle, Intl.DateTimeFormatOptions> = {
  full: { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'long' },
  long: { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'short' },
  short: { hour: 'numeric', minute: '2-digit' },
  shortSeconds: { hour: 'numeric', minute: '2-digit', second: '2-digit' }
}

/**
 * Format a date according to locale and style
 *
 * @param date - The date to format
 * @param language - The language code ('en' or 'ar')
 * @param style - The format style preset
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date('2026-01-12'), 'en', 'long')   // "January 12, 2026"
 * formatDate(new Date('2026-01-12'), 'ar', 'long')   // "12 يناير 2026"
 * formatDate(new Date('2026-01-12'), 'en', 'short')  // "1/12/26"
 * formatDate(new Date('2026-01-12'), 'ar', 'short')  // "12/1/26"
 */
export function formatDate(
  date: Date | number | string,
  language: SupportedLanguage,
  style: DateFormatStyle = 'long'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const locale = getLocale(language)
  const options = DATE_FORMAT_OPTIONS[style]

  try {
    return new Intl.DateTimeFormat(locale, options).format(dateObj)
  } catch {
    // Fallback to ISO string if formatting fails
    return dateObj.toISOString().split('T')[0]
  }
}

/**
 * Format a time according to locale and style
 *
 * @param date - The date/time to format
 * @param language - The language code ('en' or 'ar')
 * @param style - The format style preset
 * @returns Formatted time string
 *
 * @example
 * formatTime(new Date(), 'en', 'short')   // "3:45 PM"
 * formatTime(new Date(), 'ar', 'short')   // "3:45 م"
 */
export function formatTime(
  date: Date | number | string,
  language: SupportedLanguage,
  style: TimeFormatStyle = 'short'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const locale = getLocale(language)
  const options = TIME_FORMAT_OPTIONS[style]

  try {
    return new Intl.DateTimeFormat(locale, options).format(dateObj)
  } catch {
    // Fallback
    return dateObj.toTimeString().slice(0, 5)
  }
}

/**
 * Format both date and time together
 *
 * @param date - The date/time to format
 * @param language - The language code ('en' or 'ar')
 * @param dateStyle - The date format style
 * @param timeStyle - The time format style
 * @returns Formatted date and time string
 *
 * @example
 * formatDateTime(new Date(), 'en')   // "January 12, 2026, 3:45 PM"
 * formatDateTime(new Date(), 'ar')   // "12 يناير 2026، 3:45 م"
 */
export function formatDateTime(
  date: Date | number | string,
  language: SupportedLanguage,
  dateStyle: DateFormatStyle = 'long',
  timeStyle: TimeFormatStyle = 'short'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const locale = getLocale(language)

  try {
    const options: Intl.DateTimeFormatOptions = {
      ...DATE_FORMAT_OPTIONS[dateStyle],
      ...TIME_FORMAT_OPTIONS[timeStyle]
    }
    return new Intl.DateTimeFormat(locale, options).format(dateObj)
  } catch {
    // Fallback
    return `${formatDate(dateObj, language, dateStyle)}, ${formatTime(dateObj, language, timeStyle)}`
  }
}

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days")
 *
 * @param date - The date to compare against now
 * @param language - The language code ('en' or 'ar')
 * @param style - The format style ('long', 'short', or 'narrow')
 * @returns Relative time string
 *
 * @example
 * // 2 hours ago
 * formatRelativeTime(new Date(Date.now() - 7200000), 'en')   // "2 hours ago"
 * formatRelativeTime(new Date(Date.now() - 7200000), 'ar')   // "منذ ساعتين"
 *
 * // In 3 days
 * formatRelativeTime(new Date(Date.now() + 259200000), 'en') // "in 3 days"
 * formatRelativeTime(new Date(Date.now() + 259200000), 'ar') // "بعد 3 أيام"
 */
export function formatRelativeTime(
  date: Date | number | string,
  language: SupportedLanguage,
  style: 'long' | 'short' | 'narrow' = 'long'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const locale = getLocale(language)
  const now = Date.now()
  const diff = dateObj.getTime() - now

  const seconds = Math.abs(diff / 1000)
  const minutes = seconds / 60
  const hours = minutes / 60
  const days = hours / 24
  const weeks = days / 7
  const months = days / 30
  const years = days / 365

  let value: number
  let unit: Intl.RelativeTimeFormatUnit

  if (seconds < 60) {
    value = Math.round(seconds)
    unit = 'second'
  } else if (minutes < 60) {
    value = Math.round(minutes)
    unit = 'minute'
  } else if (hours < 24) {
    value = Math.round(hours)
    unit = 'hour'
  } else if (days < 7) {
    value = Math.round(days)
    unit = 'day'
  } else if (weeks < 4) {
    value = Math.round(weeks)
    unit = 'week'
  } else if (months < 12) {
    value = Math.round(months)
    unit = 'month'
  } else {
    value = Math.round(years)
    unit = 'year'
  }

  // Apply sign based on past/future
  if (diff < 0) {
    value = -value
  }

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { style, numeric: 'auto' })
    return rtf.format(value, unit)
  } catch {
    // Fallback
    const absValue = Math.abs(value)
    const unitStr = absValue === 1 ? unit : `${unit}s`
    if (diff < 0) {
      return `${absValue} ${unitStr} ago`
    }
    return `in ${absValue} ${unitStr}`
  }
}

/**
 * Get "Today", "Yesterday", or formatted date
 *
 * @param date - The date to format
 * @param language - The language code ('en' or 'ar')
 * @param style - The format style for non-today/yesterday dates
 * @returns "Today", "Yesterday", or formatted date
 *
 * @example
 * formatSmartDate(new Date(), 'en')        // "Today"
 * formatSmartDate(yesterdayDate, 'ar')     // "أمس"
 * formatSmartDate(lastWeekDate, 'en')      // "January 5, 2026"
 */
export function formatSmartDate(
  date: Date | number | string,
  language: SupportedLanguage,
  style: DateFormatStyle = 'long'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const now = new Date()

  // Reset time to compare dates only
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const dateDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())

  if (dateDay.getTime() === today.getTime()) {
    return language === 'ar' ? 'اليوم' : 'Today'
  }

  if (dateDay.getTime() === yesterday.getTime()) {
    return language === 'ar' ? 'أمس' : 'Yesterday'
  }

  return formatDate(dateObj, language, style)
}

/**
 * Format duration in hours and minutes
 *
 * @param totalMinutes - Total minutes to format
 * @param language - The language code ('en' or 'ar')
 * @returns Formatted duration string
 *
 * @example
 * formatDuration(90, 'en')    // "1h 30m"
 * formatDuration(90, 'ar')    // "1س 30د"
 * formatDuration(45, 'en')    // "45m"
 */
export function formatDuration(totalMinutes: number, language: SupportedLanguage): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (language === 'ar') {
    if (hours === 0) return `${minutes}د`
    if (minutes === 0) return `${hours}س`
    return `${hours}س ${minutes}د`
  }

  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

/**
 * Hook to get date formatting functions with current language
 */
export function useDateFormat(language: SupportedLanguage) {
  return {
    formatDate: (date: Date | number | string, style?: DateFormatStyle) =>
      formatDate(date, language, style),
    formatTime: (date: Date | number | string, style?: TimeFormatStyle) =>
      formatTime(date, language, style),
    formatDateTime: (date: Date | number | string, dateStyle?: DateFormatStyle, timeStyle?: TimeFormatStyle) =>
      formatDateTime(date, language, dateStyle, timeStyle),
    formatRelativeTime: (date: Date | number | string, style?: 'long' | 'short' | 'narrow') =>
      formatRelativeTime(date, language, style),
    formatSmartDate: (date: Date | number | string, style?: DateFormatStyle) =>
      formatSmartDate(date, language, style),
    formatDuration: (totalMinutes: number) =>
      formatDuration(totalMinutes, language)
  }
}

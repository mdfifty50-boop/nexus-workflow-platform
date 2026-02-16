/**
 * RegionalSchedulingService - Prayer Times, Islamic Calendar & Kuwait Scheduling
 *
 * Provides culturally-aware scheduling intelligence for the Kuwait/Gulf market:
 * - Accurate prayer time calculation using astronomical formulas (Umm al-Qura method)
 * - Hijri calendar date conversion (tabular Islamic calendar)
 * - Ramadan detection and working hour adjustments
 * - Islamic holiday calendar with public holiday flags
 * - Kuwait working hours (Sun-Thu, Ramadan-adjusted)
 * - Schedule validation against prayer times, holidays, and working hours
 *
 * All calculations are self-contained with zero external dependencies.
 * Times default to Kuwait timezone (Asia/Kuwait, UTC+3).
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PrayerTimes {
  fajr: Date
  sunrise: Date
  dhuhr: Date
  asr: Date
  maghrib: Date
  isha: Date
  nextPrayer: { name: string; time: Date }
  isInPrayerBuffer: boolean
}

export interface HijriDate {
  year: number
  month: number
  day: number
  monthName: string
  monthNameAr: string
}

export interface IslamicHoliday {
  name: string
  nameAr: string
  date: Date
  duration: number
  isPublicHoliday: boolean
  workHoursAdjusted: boolean
}

export interface WorkingHours {
  isWorkDay: boolean
  startHour: number
  endHour: number
  reason?: string
}

export interface ScheduleConflict {
  type: 'prayer' | 'holiday' | 'outside_hours' | 'ramadan'
  description: string
  suggestion: string
}

export interface ScheduleValidation {
  valid: boolean
  conflicts: ScheduleConflict[]
}

// ── Constants ──────────────────────────────────────────────────────────────────

const KUWAIT_LAT = 29.3759
const KUWAIT_LON = 47.9774
const KUWAIT_TZ = 'Asia/Kuwait'
const KUWAIT_UTC_OFFSET = 3 // UTC+3
const PRAYER_BUFFER_MINUTES = 15

const HIJRI_MONTH_NAMES: Array<{ en: string; ar: string }> = [
  { en: 'Muharram', ar: '\u0645\u062D\u0631\u0645' },
  { en: 'Safar', ar: '\u0635\u0641\u0631' },
  { en: "Rabi' al-Awwal", ar: '\u0631\u0628\u064A\u0639 \u0627\u0644\u0623\u0648\u0644' },
  { en: "Rabi' al-Thani", ar: '\u0631\u0628\u064A\u0639 \u0627\u0644\u062B\u0627\u0646\u064A' },
  { en: 'Jumada al-Ula', ar: '\u062C\u0645\u0627\u062F\u0649 \u0627\u0644\u0623\u0648\u0644\u0649' },
  { en: 'Jumada al-Thani', ar: '\u062C\u0645\u0627\u062F\u0649 \u0627\u0644\u062B\u0627\u0646\u064A\u0629' },
  { en: 'Rajab', ar: '\u0631\u062C\u0628' },
  { en: "Sha'ban", ar: '\u0634\u0639\u0628\u0627\u0646' },
  { en: 'Ramadan', ar: '\u0631\u0645\u0636\u0627\u0646' },
  { en: 'Shawwal', ar: '\u0634\u0648\u0627\u0644' },
  { en: 'Dhul Qi\'dah', ar: '\u0630\u0648 \u0627\u0644\u0642\u0639\u062F\u0629' },
  { en: 'Dhul Hijjah', ar: '\u0630\u0648 \u0627\u0644\u062D\u062C\u0629' },
]

/**
 * Known Ramadan start dates (Gregorian) for 2024-2027.
 * Based on Umm al-Qura calendar announcements.
 * Each Ramadan is 29 or 30 days.
 */
const RAMADAN_DATES: Record<number, { start: Date; end: Date }> = {
  2024: { start: new Date(2024, 2, 12), end: new Date(2024, 3, 9) },   // Mar 12 - Apr 9
  2025: { start: new Date(2025, 2, 1), end: new Date(2025, 2, 30) },   // Mar 1 - Mar 30
  2026: { start: new Date(2026, 1, 18), end: new Date(2026, 2, 19) },  // Feb 18 - Mar 19
  2027: { start: new Date(2027, 1, 8), end: new Date(2027, 2, 8) },    // Feb 8 - Mar 8
}

/**
 * Known Islamic holidays (approximate Gregorian dates for 2024-2027).
 * Dates shift ~10-11 days earlier each Gregorian year.
 */
const ISLAMIC_HOLIDAYS_BY_YEAR: Record<number, Array<Omit<IslamicHoliday, 'date'> & { month: number; day: number }>> = {
  2024: [
    { name: 'Eid Al-Fitr', nameAr: '\u0639\u064A\u062F \u0627\u0644\u0641\u0637\u0631', month: 3, day: 10, duration: 3, isPublicHoliday: true, workHoursAdjusted: true },
    { name: 'Eid Al-Adha', nameAr: '\u0639\u064A\u062F \u0627\u0644\u0623\u0636\u062D\u0649', month: 5, day: 17, duration: 3, isPublicHoliday: true, workHoursAdjusted: true },
    { name: 'Islamic New Year', nameAr: '\u0631\u0623\u0633 \u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u0647\u062C\u0631\u064A\u0629', month: 6, day: 8, duration: 1, isPublicHoliday: true, workHoursAdjusted: false },
    { name: "Prophet's Birthday", nameAr: '\u0627\u0644\u0645\u0648\u0644\u062F \u0627\u0644\u0646\u0628\u0648\u064A', month: 8, day: 17, duration: 1, isPublicHoliday: true, workHoursAdjusted: false },
    { name: "Isra' & Mi'raj", nameAr: '\u0627\u0644\u0625\u0633\u0631\u0627\u0621 \u0648\u0627\u0644\u0645\u0639\u0631\u0627\u062C', month: 1, day: 8, duration: 1, isPublicHoliday: true, workHoursAdjusted: false },
  ],
  2025: [
    { name: 'Eid Al-Fitr', nameAr: '\u0639\u064A\u062F \u0627\u0644\u0641\u0637\u0631', month: 2, day: 31, duration: 3, isPublicHoliday: true, workHoursAdjusted: true },
    { name: 'Eid Al-Adha', nameAr: '\u0639\u064A\u062F \u0627\u0644\u0623\u0636\u062D\u0649', month: 5, day: 7, duration: 3, isPublicHoliday: true, workHoursAdjusted: true },
    { name: 'Islamic New Year', nameAr: '\u0631\u0623\u0633 \u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u0647\u062C\u0631\u064A\u0629', month: 5, day: 27, duration: 1, isPublicHoliday: true, workHoursAdjusted: false },
    { name: "Prophet's Birthday", nameAr: '\u0627\u0644\u0645\u0648\u0644\u062F \u0627\u0644\u0646\u0628\u0648\u064A', month: 7, day: 5, duration: 1, isPublicHoliday: true, workHoursAdjusted: false },
    { name: "Isra' & Mi'raj", nameAr: '\u0627\u0644\u0625\u0633\u0631\u0627\u0621 \u0648\u0627\u0644\u0645\u0639\u0631\u0627\u062C', month: 0, day: 27, duration: 1, isPublicHoliday: true, workHoursAdjusted: false },
  ],
  2026: [
    { name: 'Eid Al-Fitr', nameAr: '\u0639\u064A\u062F \u0627\u0644\u0641\u0637\u0631', month: 2, day: 20, duration: 3, isPublicHoliday: true, workHoursAdjusted: true },
    { name: 'Eid Al-Adha', nameAr: '\u0639\u064A\u062F \u0627\u0644\u0623\u0636\u062D\u0649', month: 4, day: 27, duration: 3, isPublicHoliday: true, workHoursAdjusted: true },
    { name: 'Islamic New Year', nameAr: '\u0631\u0623\u0633 \u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u0647\u062C\u0631\u064A\u0629', month: 4, day: 17, duration: 1, isPublicHoliday: true, workHoursAdjusted: false },
    { name: "Prophet's Birthday", nameAr: '\u0627\u0644\u0645\u0648\u0644\u062F \u0627\u0644\u0646\u0628\u0648\u064A', month: 6, day: 26, duration: 1, isPublicHoliday: true, workHoursAdjusted: false },
    { name: "Isra' & Mi'raj", nameAr: '\u0627\u0644\u0625\u0633\u0631\u0627\u0621 \u0648\u0627\u0644\u0645\u0639\u0631\u0627\u062C', month: 0, day: 16, duration: 1, isPublicHoliday: true, workHoursAdjusted: false },
  ],
  2027: [
    { name: 'Eid Al-Fitr', nameAr: '\u0639\u064A\u062F \u0627\u0644\u0641\u0637\u0631', month: 2, day: 10, duration: 3, isPublicHoliday: true, workHoursAdjusted: true },
    { name: 'Eid Al-Adha', nameAr: '\u0639\u064A\u062F \u0627\u0644\u0623\u0636\u062D\u0649', month: 4, day: 16, duration: 3, isPublicHoliday: true, workHoursAdjusted: true },
    { name: 'Islamic New Year', nameAr: '\u0631\u0623\u0633 \u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u0647\u062C\u0631\u064A\u0629', month: 4, day: 7, duration: 1, isPublicHoliday: true, workHoursAdjusted: false },
    { name: "Prophet's Birthday", nameAr: '\u0627\u0644\u0645\u0648\u0644\u062F \u0627\u0644\u0646\u0628\u0648\u064A', month: 6, day: 15, duration: 1, isPublicHoliday: true, workHoursAdjusted: false },
    { name: "Isra' & Mi'raj", nameAr: '\u0627\u0644\u0625\u0633\u0631\u0627\u0621 \u0648\u0627\u0644\u0645\u0639\u0631\u0627\u062C', month: 0, day: 5, duration: 1, isPublicHoliday: true, workHoursAdjusted: false },
  ],
}

/**
 * Kuwait National/Liberation Days (fixed Gregorian dates every year).
 */
const NATIONAL_HOLIDAYS = [
  { name: 'National Day', nameAr: '\u0627\u0644\u0639\u064A\u062F \u0627\u0644\u0648\u0637\u0646\u064A', month: 1, day: 25, duration: 2, isPublicHoliday: true, workHoursAdjusted: true },
  { name: 'Liberation Day', nameAr: '\u0639\u064A\u062F \u0627\u0644\u062A\u062D\u0631\u064A\u0631', month: 1, day: 26, duration: 1, isPublicHoliday: true, workHoursAdjusted: true },
]

// ── Astronomical Helpers ───────────────────────────────────────────────────────

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

/** Convert degrees to radians. */
function rad(deg: number): number {
  return deg * DEG_TO_RAD
}

/** Convert radians to degrees. */
function deg(r: number): number {
  return r * RAD_TO_DEG
}

/** Sine accepting degrees. */
function sinD(d: number): number {
  return Math.sin(rad(d))
}

/** Cosine accepting degrees. */
function cosD(d: number): number {
  return Math.cos(rad(d))
}

/** Tangent accepting degrees. */
function tanD(d: number): number {
  return Math.tan(rad(d))
}

/** Arccotangent returning degrees. */
function acotD(x: number): number {
  return deg(Math.atan(1 / x))
}

/** Arccosine returning degrees. */
function acosD(x: number): number {
  return deg(Math.acos(x))
}

/** Arcsine returning degrees. */
function asinD(x: number): number {
  return deg(Math.asin(x))
}

/**
 * Calculate Julian Date Number for a given Gregorian date at 0h UT.
 */
function julianDate(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1
    month += 12
  }
  const A = Math.floor(year / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5
}

/**
 * Solar declination and equation of time for a given Julian Date.
 * Returns { declination (degrees), equationOfTime (minutes) }.
 */
function solarPosition(jd: number): { declination: number; equationOfTime: number } {
  const D = jd - 2451545.0 // Days since J2000.0

  // Mean anomaly of the Sun
  const g = 357.529 + 0.98560028 * D
  // Mean longitude of the Sun
  const q = 280.459 + 0.98564736 * D
  // Ecliptic longitude of the Sun
  const L = q + 1.915 * sinD(g) + 0.020 * sinD(2 * g)

  // Obliquity of the ecliptic
  const e = 23.439 - 0.00000036 * D

  // Right ascension (using atan2 for correct quadrant)
  const RA = deg(Math.atan2(cosD(e) * sinD(L), cosD(L))) / 15 // in hours

  // Declination
  const declination = asinD(sinD(e) * sinD(L))

  // Equation of Time in minutes
  const EqT = (q / 15 - fixHour(RA)) * 60

  return { declination, equationOfTime: EqT }
}

/**
 * Fix hour value to [0, 24) range.
 */
function fixHour(h: number): number {
  h = h - 24 * Math.floor(h / 24)
  return h < 0 ? h + 24 : h
}

/**
 * Compute the time when the Sun reaches a specific angle below the horizon.
 * @param angle - Angle below horizon in degrees (positive = below)
 * @param declination - Solar declination in degrees
 * @param latitude - Observer latitude in degrees
 * @param direction - 'ccw' for morning (Fajr/Sunrise), 'cw' for evening (Maghrib/Isha)
 * @returns Hour angle in hours, or NaN if the Sun never reaches that angle
 */
function sunAngleTime(
  angle: number,
  declination: number,
  latitude: number,
  direction: 'ccw' | 'cw'
): number {
  const cosHA =
    (-sinD(angle) - sinD(declination) * sinD(latitude)) /
    (cosD(declination) * cosD(latitude))

  if (cosHA < -1 || cosHA > 1) return NaN

  const hourAngle = acosD(cosHA) / 15 // in hours
  return direction === 'ccw' ? -hourAngle : hourAngle
}

/**
 * Compute Asr time (Shafi'i method: shadow = height + noon shadow).
 * @returns Hour offset from solar noon
 */
function asrTime(declination: number, latitude: number): number {
  // Shadow factor for Shafi'i: 1 (shadow = object length + noon shadow)
  const shadowFactor = 1
  const noonShadow = Math.abs(tanD(latitude - declination))
  const asrAngle = acotD(shadowFactor + noonShadow)
  return sunAngleTime(asrAngle, declination, latitude, 'cw')
}

// ── Hijri Calendar Helpers ─────────────────────────────────────────────────────

/**
 * Tabular Islamic (Hijri) calendar conversion.
 * Uses the Kuwaiti algorithm (civil/tabular method).
 * Accurate to within 1-2 days; for exact dates use Umm al-Qura tables.
 */
function gregorianToHijri(gYear: number, gMonth: number, gDay: number): { year: number; month: number; day: number } {
  // Julian Day Number for the Gregorian date
  const jd = julianDate(gYear, gMonth, gDay)

  // Hijri epoch in Julian Day Number (July 16, 622 CE)
  const HIJRI_EPOCH = 1948439.5

  const daysSinceEpoch = jd - HIJRI_EPOCH
  // Number of 30-year cycles
  const cycles = Math.floor((30 * daysSinceEpoch + 10646) / 10631)
  // Remaining days in current cycle
  let remaining = daysSinceEpoch - Math.floor((10631 * cycles - 10617) / 30)

  // Year within the cycle
  let yearInCycle = Math.min(30, Math.ceil((remaining - 29) / 29.5))
  // Adjust remaining
  remaining = remaining - Math.floor((29.5001 * yearInCycle - 29) / 1)

  // Month
  const month = Math.min(12, Math.ceil((remaining - 0.5) / 29.5))
  // Day
  const day = Math.max(1, Math.ceil(remaining - 29.5001 * (month - 1) + 0.99))

  const year = 30 * cycles + yearInCycle + 1

  return { year, month, day }
}

// ── Kuwait Time Utilities ──────────────────────────────────────────────────────

/**
 * Get the current date/time in Kuwait timezone.
 */
function nowInKuwait(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: KUWAIT_TZ })
  )
}

/**
 * Create a Date object representing a specific hour:minute on a given date in Kuwait.
 * Used internally by prayer time calculations and schedule validation.
 */
export function kuwaitTime(date: Date, hours: number, minutes: number = 0): Date {
  const d = new Date(date)
  d.setHours(Math.floor(hours), Math.round((hours % 1) * 60) + minutes, 0, 0)
  return d
}

/**
 * Get day-of-week for Kuwait time (0=Sunday, 6=Saturday).
 */
function kuwaitDayOfWeek(date?: Date): number {
  const d = date ?? nowInKuwait()
  return d.getDay()
}

// ── Main Service ───────────────────────────────────────────────────────────────

export class RegionalSchedulingService {
  private readonly latitude = KUWAIT_LAT
  private readonly longitude = KUWAIT_LON
  private readonly utcOffset = KUWAIT_UTC_OFFSET

  // ── Prayer Times ───────────────────────────────────────────────────────────

  /**
   * Calculate prayer times for a given date in Kuwait.
   * Uses the Umm al-Qura method:
   * - Fajr: Sun 18.5 degrees below horizon
   * - Isha: 90 minutes after Maghrib
   * - Asr: Shafi'i (shadow = object + noon shadow)
   * @param date - The date to calculate for (defaults to now in Kuwait)
   */
  getPrayerTimes(date?: Date): PrayerTimes {
    const d = date ?? nowInKuwait()
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()

    const jd = julianDate(year, month, day)
    const { declination, equationOfTime } = solarPosition(jd)

    // Solar noon in hours (local time)
    const transitTime = 12 + this.utcOffset - this.longitude / 15 - equationOfTime / 60

    // Fajr: Umm al-Qura uses 18.5 degrees
    const fajrOffset = sunAngleTime(18.5, declination, this.latitude, 'ccw')
    const fajrHour = fixHour(transitTime + fajrOffset)

    // Sunrise: 0.833 degrees accounts for refraction and Sun's apparent radius
    const sunriseOffset = sunAngleTime(0.833, declination, this.latitude, 'ccw')
    const sunriseHour = fixHour(transitTime + sunriseOffset)

    // Dhuhr: solar noon + small safety margin (1 min)
    const dhuhrHour = transitTime + 1 / 60

    // Asr (Shafi'i method)
    const asrOffset = asrTime(declination, this.latitude)
    const asrHour = fixHour(transitTime + asrOffset)

    // Maghrib: same angle as sunrise but evening
    const maghribOffset = sunAngleTime(0.833, declination, this.latitude, 'cw')
    const maghribHour = fixHour(transitTime + maghribOffset)

    // Isha: Umm al-Qura = 90 minutes after Maghrib
    const ishaHour = maghribHour + 1.5

    // Build Date objects
    const fajr = this.hoursToDate(d, fajrHour)
    const sunrise = this.hoursToDate(d, sunriseHour)
    const dhuhr = this.hoursToDate(d, dhuhrHour)
    const asr = this.hoursToDate(d, asrHour)
    const maghrib = this.hoursToDate(d, maghribHour)
    const isha = this.hoursToDate(d, ishaHour)

    const prayers: Array<{ name: string; time: Date }> = [
      { name: 'Fajr', time: fajr },
      { name: 'Sunrise', time: sunrise },
      { name: 'Dhuhr', time: dhuhr },
      { name: 'Asr', time: asr },
      { name: 'Maghrib', time: maghrib },
      { name: 'Isha', time: isha },
    ]

    const now = date ?? nowInKuwait()
    const nextPrayer = this.findNextPrayer(prayers, now)
    const isInPrayerBuffer = this.checkPrayerBuffer(prayers, now)

    return { fajr, sunrise, dhuhr, asr, maghrib, isha, nextPrayer, isInPrayerBuffer }
  }

  /**
   * Convert fractional hours to a Date object on the given day.
   */
  private hoursToDate(baseDate: Date, hours: number): Date {
    const d = new Date(baseDate)
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    const s = Math.floor(((hours - h) * 60 - m) * 60)
    d.setHours(h, m, s, 0)
    return d
  }

  /**
   * Find the next upcoming prayer from the given list.
   */
  private findNextPrayer(
    prayers: Array<{ name: string; time: Date }>,
    now: Date
  ): { name: string; time: Date } {
    for (const p of prayers) {
      if (p.time > now) return p
    }
    // All prayers have passed today; next is Fajr tomorrow
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowTimes = this.getPrayerTimes(tomorrow)
    return { name: 'Fajr', time: tomorrowTimes.fajr }
  }

  /**
   * Check if the current time falls within the 15-minute buffer of any prayer.
   */
  private checkPrayerBuffer(
    prayers: Array<{ name: string; time: Date }>,
    now: Date
  ): boolean {
    const bufferMs = PRAYER_BUFFER_MINUTES * 60 * 1000
    return prayers.some((p) => {
      const diff = Math.abs(now.getTime() - p.time.getTime())
      return diff <= bufferMs
    })
  }

  // ── Hijri Calendar ─────────────────────────────────────────────────────────

  /**
   * Convert a Gregorian date to an approximate Hijri (Islamic) date.
   * Uses the tabular Islamic calendar with the Kuwaiti algorithm.
   * @param gregorianDate - The Gregorian date to convert (defaults to now in Kuwait)
   */
  getHijriDate(gregorianDate?: Date): HijriDate {
    const d = gregorianDate ?? nowInKuwait()
    const { year, month, day } = gregorianToHijri(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate()
    )

    const monthInfo = HIJRI_MONTH_NAMES[month - 1] ?? HIJRI_MONTH_NAMES[0]

    return {
      year,
      month,
      day,
      monthName: monthInfo.en,
      monthNameAr: monthInfo.ar,
    }
  }

  // ── Ramadan Detection ──────────────────────────────────────────────────────

  /**
   * Check if the given date falls within Ramadan.
   * @param date - The date to check (defaults to now in Kuwait)
   */
  isRamadan(date?: Date): boolean {
    const d = date ?? nowInKuwait()
    const ramadan = this.getRamadanDates(d.getFullYear())
    if (!ramadan) return false
    return d >= ramadan.start && d <= ramadan.end
  }

  /**
   * Get the start and end dates of Ramadan for a given Gregorian year.
   * Uses hardcoded known dates for 2024-2027; returns null for other years.
   * @param year - The Gregorian year
   */
  getRamadanDates(year: number): { start: Date; end: Date } | null {
    return RAMADAN_DATES[year] ?? null
  }

  /**
   * Get adjusted working hours if the date falls during Ramadan.
   * Kuwait typically reduces working hours during Ramadan.
   * @param date - The date to check (defaults to now in Kuwait)
   */
  getWorkingHoursAdjustment(date?: Date): { startHour: number; endHour: number; reason?: string } {
    const d = date ?? nowInKuwait()
    if (this.isRamadan(d)) {
      return { startHour: 9, endHour: 14, reason: 'Ramadan working hours' }
    }
    return { startHour: 8, endHour: 16 }
  }

  // ── Islamic Holidays ───────────────────────────────────────────────────────

  /**
   * Get upcoming Islamic and national holidays from today.
   * @param count - Maximum number of holidays to return (defaults to 5)
   */
  getUpcomingHolidays(count: number = 5): IslamicHoliday[] {
    const now = nowInKuwait()
    const year = now.getFullYear()
    const allHolidays: IslamicHoliday[] = []

    // Collect Islamic holidays for current and next year
    for (const y of [year, year + 1]) {
      const yearHolidays = ISLAMIC_HOLIDAYS_BY_YEAR[y]
      if (yearHolidays) {
        for (const h of yearHolidays) {
          allHolidays.push({
            name: h.name,
            nameAr: h.nameAr,
            date: new Date(y, h.month, h.day),
            duration: h.duration,
            isPublicHoliday: h.isPublicHoliday,
            workHoursAdjusted: h.workHoursAdjusted,
          })
        }
      }

      // National holidays (same dates every year)
      for (const h of NATIONAL_HOLIDAYS) {
        allHolidays.push({
          name: h.name,
          nameAr: h.nameAr,
          date: new Date(y, h.month, h.day),
          duration: h.duration,
          isPublicHoliday: h.isPublicHoliday,
          workHoursAdjusted: h.workHoursAdjusted,
        })
      }
    }

    // Filter to upcoming, sort by date, take requested count
    return allHolidays
      .filter((h) => h.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, count)
  }

  /**
   * Check if a given date falls on a known holiday.
   * Checks multi-day holidays by comparing against their duration.
   * @param date - The date to check (defaults to now in Kuwait)
   */
  isHoliday(date?: Date): IslamicHoliday | null {
    const d = date ?? nowInKuwait()
    const year = d.getFullYear()
    const allHolidays: IslamicHoliday[] = []

    const yearHolidays = ISLAMIC_HOLIDAYS_BY_YEAR[year]
    if (yearHolidays) {
      for (const h of yearHolidays) {
        allHolidays.push({
          name: h.name,
          nameAr: h.nameAr,
          date: new Date(year, h.month, h.day),
          duration: h.duration,
          isPublicHoliday: h.isPublicHoliday,
          workHoursAdjusted: h.workHoursAdjusted,
        })
      }
    }

    for (const h of NATIONAL_HOLIDAYS) {
      allHolidays.push({
        name: h.name,
        nameAr: h.nameAr,
        date: new Date(year, h.month, h.day),
        duration: h.duration,
        isPublicHoliday: h.isPublicHoliday,
        workHoursAdjusted: h.workHoursAdjusted,
      })
    }

    for (const h of allHolidays) {
      const startMs = h.date.getTime()
      const endMs = startMs + h.duration * 24 * 60 * 60 * 1000
      if (d.getTime() >= startMs && d.getTime() < endMs) {
        return h
      }
    }

    return null
  }

  // ── Kuwait Working Hours ───────────────────────────────────────────────────

  /**
   * Get working hours for a given date in Kuwait.
   * Accounts for weekends (Fri-Sat), holidays, and Ramadan.
   * @param date - The date to check (defaults to now in Kuwait)
   */
  getWorkingHours(date?: Date): WorkingHours {
    const d = date ?? nowInKuwait()
    const dayOfWeek = kuwaitDayOfWeek(d)

    // Friday (5) or Saturday (6) = weekend
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return {
        isWorkDay: false,
        startHour: 0,
        endHour: 0,
        reason: dayOfWeek === 5 ? 'Weekend (Friday)' : 'Weekend (Saturday)',
      }
    }

    // Check holidays
    const holiday = this.isHoliday(d)
    if (holiday && holiday.isPublicHoliday) {
      return {
        isWorkDay: false,
        startHour: 0,
        endHour: 0,
        reason: `Holiday: ${holiday.name}`,
      }
    }

    // Check Ramadan hours
    if (this.isRamadan(d)) {
      return {
        isWorkDay: true,
        startHour: 9,
        endHour: 14,
        reason: 'Ramadan working hours',
      }
    }

    // Normal working day
    return {
      isWorkDay: true,
      startHour: 8,
      endHour: 16,
    }
  }

  /**
   * Check if the current time is within Kuwait working hours.
   * @param date - The date/time to check (defaults to now in Kuwait)
   */
  isWithinWorkingHours(date?: Date): boolean {
    const d = date ?? nowInKuwait()
    const hours = this.getWorkingHours(d)
    if (!hours.isWorkDay) return false
    const currentHour = d.getHours() + d.getMinutes() / 60
    return currentHour >= hours.startHour && currentHour < hours.endHour
  }

  /**
   * Find the next working day from a given date.
   * Skips weekends and public holidays.
   * @param from - The starting date (defaults to now in Kuwait)
   */
  getNextWorkingDay(from?: Date): Date {
    const d = from ? new Date(from) : nowInKuwait()
    d.setDate(d.getDate() + 1)
    d.setHours(0, 0, 0, 0)

    // Safety limit: 30 days ahead to prevent infinite loop
    for (let i = 0; i < 30; i++) {
      const hours = this.getWorkingHours(d)
      if (hours.isWorkDay) return d
      d.setDate(d.getDate() + 1)
    }

    // Fallback: return 1 day after start (should never reach here)
    const fallback = from ? new Date(from) : nowInKuwait()
    fallback.setDate(fallback.getDate() + 1)
    return fallback
  }

  // ── Schedule Validation ────────────────────────────────────────────────────

  /**
   * Validate a cron schedule against Kuwait cultural and business constraints.
   * Checks for conflicts with prayer times, holidays, working hours, and Ramadan.
   *
   * @param cronExpression - Standard 5-field cron expression (minute hour day month weekday)
   * @param _timezone - Timezone (unused, always Kuwait; kept for API compatibility)
   */
  validateSchedule(cronExpression: string, _timezone?: string): ScheduleValidation {
    const conflicts: ScheduleConflict[] = []

    const parts = cronExpression.trim().split(/\s+/)
    if (parts.length < 5) {
      return {
        valid: false,
        conflicts: [
          {
            type: 'outside_hours',
            description: 'Invalid cron expression: expected 5 fields (minute hour day month weekday)',
            suggestion: 'Use format: "minute hour day month weekday" (e.g., "0 9 * * 0-4")',
          },
        ],
      }
    }

    const [minuteField, hourField, , , weekdayField] = parts

    // Parse hour(s) from the cron expression
    const hours = this.parseCronField(hourField, 0, 23)
    const minutes = this.parseCronField(minuteField, 0, 59)
    const weekdays = this.parseCronField(weekdayField, 0, 6)

    // Check: weekend scheduling (Friday=5, Saturday=6)
    const weekendDays = weekdays.filter((d) => d === 5 || d === 6)
    if (weekendDays.length > 0) {
      const dayNames = weekendDays.map((d) => (d === 5 ? 'Friday' : 'Saturday'))
      conflicts.push({
        type: 'outside_hours',
        description: `Schedule runs on Kuwait weekend: ${dayNames.join(', ')}`,
        suggestion: 'Kuwait work week is Sunday-Thursday. Use weekday field "0-4" for work days.',
      })
    }

    // Check: outside working hours (before 8 or after 16)
    const outsideHours = hours.filter((h) => h < 8 || h >= 16)
    if (outsideHours.length > 0 && hours.length > 0) {
      conflicts.push({
        type: 'outside_hours',
        description: `Schedule runs outside normal working hours (8:00-16:00): ${outsideHours.map((h) => `${h}:00`).join(', ')}`,
        suggestion: 'Standard Kuwait working hours are 8:00-16:00. During Ramadan, hours are 9:00-14:00.',
      })
    }

    // Check: Ramadan conflict (hours between 14-16 affected during Ramadan)
    const ramadanConflictHours = hours.filter((h) => h >= 14 && h < 16)
    if (ramadanConflictHours.length > 0) {
      conflicts.push({
        type: 'ramadan',
        description: `Schedule at ${ramadanConflictHours.map((h) => `${h}:00`).join(', ')} conflicts with Ramadan working hours (end at 14:00)`,
        suggestion: 'During Ramadan, working hours are 9:00-14:00. Consider scheduling before 14:00.',
      })
    }

    // Check: prayer time proximity
    // Use today's prayer times as a representative sample
    const todayPrayers = this.getPrayerTimes()
    const prayerHours = [
      { name: 'Fajr', hour: todayPrayers.fajr.getHours(), min: todayPrayers.fajr.getMinutes() },
      { name: 'Dhuhr', hour: todayPrayers.dhuhr.getHours(), min: todayPrayers.dhuhr.getMinutes() },
      { name: 'Asr', hour: todayPrayers.asr.getHours(), min: todayPrayers.asr.getMinutes() },
      { name: 'Maghrib', hour: todayPrayers.maghrib.getHours(), min: todayPrayers.maghrib.getMinutes() },
      { name: 'Isha', hour: todayPrayers.isha.getHours(), min: todayPrayers.isha.getMinutes() },
    ]

    for (const h of hours) {
      for (const m of minutes.length > 0 ? minutes : [0]) {
        const scheduleMinutes = h * 60 + m
        for (const prayer of prayerHours) {
          const prayerMinutes = prayer.hour * 60 + prayer.min
          const diff = Math.abs(scheduleMinutes - prayerMinutes)
          if (diff <= PRAYER_BUFFER_MINUTES) {
            conflicts.push({
              type: 'prayer',
              description: `Schedule at ${h}:${m.toString().padStart(2, '0')} falls within ${PRAYER_BUFFER_MINUTES} minutes of ${prayer.name} prayer (~${prayer.hour}:${prayer.min.toString().padStart(2, '0')})`,
              suggestion: `Shift schedule ${PRAYER_BUFFER_MINUTES + 5} minutes away from ${prayer.name} prayer time.`,
            })
          }
        }
      }
    }

    return {
      valid: conflicts.length === 0,
      conflicts,
    }
  }

  /**
   * Parse a single cron field into an array of integer values.
   * Handles: *, N, N-M, N/S, N-M/S, and comma-separated lists.
   */
  private parseCronField(field: string, min: number, max: number): number[] {
    if (field === '*') {
      return Array.from({ length: max - min + 1 }, (_, i) => min + i)
    }

    const values = new Set<number>()

    for (const part of field.split(',')) {
      const stepMatch = part.match(/^(\d+|\*|\d+-\d+)\/(\d+)$/)
      const rangeMatch = part.match(/^(\d+)-(\d+)$/)
      const singleMatch = part.match(/^(\d+)$/)

      if (stepMatch) {
        const step = parseInt(stepMatch[2], 10)
        let start = min
        let end = max
        if (stepMatch[1] === '*') {
          // */N
        } else if (stepMatch[1].includes('-')) {
          const [a, b] = stepMatch[1].split('-').map(Number)
          start = a
          end = b
        } else {
          start = parseInt(stepMatch[1], 10)
        }
        for (let i = start; i <= end; i += step) {
          if (i >= min && i <= max) values.add(i)
        }
      } else if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10)
        const end = parseInt(rangeMatch[2], 10)
        for (let i = start; i <= end; i++) {
          if (i >= min && i <= max) values.add(i)
        }
      } else if (singleMatch) {
        const v = parseInt(singleMatch[1], 10)
        if (v >= min && v <= max) values.add(v)
      }
    }

    return Array.from(values).sort((a, b) => a - b)
  }

  // ── Convenience Methods ────────────────────────────────────────────────────

  /**
   * Get a comprehensive scheduling context snapshot for the current moment.
   * Useful for AI agents to understand the full cultural context in one call.
   */
  getSchedulingContext(date?: Date): {
    now: Date
    hijriDate: HijriDate
    prayerTimes: PrayerTimes
    workingHours: WorkingHours
    isRamadan: boolean
    holiday: IslamicHoliday | null
    upcomingHolidays: IslamicHoliday[]
    nextWorkingDay: Date
  } {
    const d = date ?? nowInKuwait()
    return {
      now: d,
      hijriDate: this.getHijriDate(d),
      prayerTimes: this.getPrayerTimes(d),
      workingHours: this.getWorkingHours(d),
      isRamadan: this.isRamadan(d),
      holiday: this.isHoliday(d),
      upcomingHolidays: this.getUpcomingHolidays(3),
      nextWorkingDay: this.getNextWorkingDay(d),
    }
  }

  /**
   * Format a prayer time for display (HH:MM in 12-hour format).
   */
  formatPrayerTime(time: Date): string {
    const h = time.getHours()
    const m = time.getMinutes()
    const period = h >= 12 ? 'PM' : 'AM'
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`
  }

  /**
   * Get a formatted summary of today's prayer times.
   */
  getPrayerTimeSummary(date?: Date): string {
    const times = this.getPrayerTimes(date)
    const lines = [
      `Fajr:    ${this.formatPrayerTime(times.fajr)}`,
      `Sunrise: ${this.formatPrayerTime(times.sunrise)}`,
      `Dhuhr:   ${this.formatPrayerTime(times.dhuhr)}`,
      `Asr:     ${this.formatPrayerTime(times.asr)}`,
      `Maghrib: ${this.formatPrayerTime(times.maghrib)}`,
      `Isha:    ${this.formatPrayerTime(times.isha)}`,
      ``,
      `Next prayer: ${times.nextPrayer.name} at ${this.formatPrayerTime(times.nextPrayer.time)}`,
    ]
    return lines.join('\n')
  }
}

// ── Singleton Export ──────────────────────────────────────────────────────────

export const regionalSchedulingService = new RegionalSchedulingService()
export default regionalSchedulingService

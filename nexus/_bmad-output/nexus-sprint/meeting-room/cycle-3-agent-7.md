# Cycle 3 - Agent 7: Regional Intelligence Report
## Prayer Time & Islamic Calendar Integration for Kuwait Scheduling

**Agent:** Regional Intelligence (Agent 7)
**Cycle:** 3
**Mission:** Design prayer time and Islamic calendar integration for Kuwait scheduling
**Status:** RESEARCH COMPLETE

---

## 1. EXECUTIVE SUMMARY

Kuwait uses the **Umm al-Qura** calculation method for prayer times (Fajr 18.5 degrees, Isha 90 minutes after Maghrib). The recommended architecture uses the **`adhan` npm library** for offline-first local calculation, with the **Aladhan REST API** as a supplementary data source for Hijri calendar conversion and Islamic holiday lookups. The `@umalqura/core` library handles Hijri-Gregorian date conversion client-side.

Prayer times must be deeply integrated into Nexus's workflow scheduling engine to prevent meetings during prayer, auto-delay notifications, adjust Ramadan work hours, and respect Islamic holidays -- all critical for the Kuwait primary market.

---

## 2. PRAYER TIME CALCULATION: KUWAIT SPECIFICS

### 2.1 Calculation Method

Kuwait officially uses the **Kuwait** method (distinct from Umm al-Qura used in Saudi Arabia):

| Parameter | Kuwait Method | Umm al-Qura (Saudi) |
|-----------|--------------|---------------------|
| Fajr Angle | 18.0 degrees | 18.5 degrees |
| Isha Angle | 17.5 degrees | 90 min fixed after Maghrib |
| Asr | Shafi'i (shadow = object length) | Shafi'i |
| Midnight | Standard (mid Sun to Fajr) | Standard |

The `adhan` npm library supports a dedicated **Kuwait** method out of the box.

### 2.2 Kuwait Coordinates (Reference Points)

| City | Latitude | Longitude |
|------|----------|-----------|
| Kuwait City | 29.3759 | 47.9774 |
| Hawalli | 29.3328 | 48.0286 |
| Salmiya | 29.3347 | 48.0764 |
| Ahmadi | 29.0769 | 48.0838 |

### 2.3 Daily Prayer Schedule (Approximate for Kuwait City, Feb 2026)

| Prayer | Time | Duration (~) | Scheduling Impact |
|--------|------|-------------|-------------------|
| Fajr | ~05:05 | 10-15 min | Before business hours |
| Sunrise | ~06:25 | N/A | Start of day |
| Dhuhr | ~11:55 | 15-20 min | Midday break |
| Asr | ~15:05 | 15-20 min | Afternoon disruption |
| Maghrib | ~17:35 | 10-15 min | End of business hours |
| Isha | ~18:55 | 15-20 min | After business hours |

**Key insight:** During Kuwait business hours (08:00-17:00), only **Dhuhr** and **Asr** prayers require scheduling awareness. During Ramadan, **Maghrib** (iftar time) becomes the most critical scheduling constraint.

---

## 3. API & LIBRARY EVALUATION

### 3.1 Aladhan REST API

**Base URL:** `https://api.aladhan.com/v1`

**Key Endpoints:**

| Endpoint | Purpose | Example |
|----------|---------|---------|
| `/timings/{date}` | Prayer times by coordinates + date | `?latitude=29.3759&longitude=47.9774&method=9` |
| `/timingsByCity/{date}` | Prayer times by city name | `?city=Kuwait+City&country=Kuwait&method=9` |
| `/calendar/{year}/{month}` | Full month prayer calendar | `?latitude=29.3759&longitude=47.9774&method=9` |
| `/gToH/{date}` | Gregorian to Hijri conversion | `/{DD-MM-YYYY}` |
| `/hToG/{date}` | Hijri to Gregorian conversion | `/{DD-MM-YYYY}` |
| `/islamicHolidaysByHijriYear/{year}` | Islamic holidays for a Hijri year | `/{1447}` |
| `/currentIslamicMonth` | Current Hijri month | N/A |
| `/methods` | List all calculation methods | N/A |

**Method IDs:** Kuwait = `9`, Umm al-Qura = `4`, Muslim World League = `3`

**Response format:** `{ "code": 200, "status": "OK", "data": { "timings": { "Fajr": "05:05", ... }, "date": { "hijri": {...}, "gregorian": {...} } } }`

**Reliability Assessment:**
- **Rate limit:** ~12 requests/second per IP (soft limit, no hard enforcement)
- **Authentication:** None required (completely free, no API key)
- **Uptime:** No formal SLA published; community-driven project by Islamic Network
- **Verdict:** Good for supplementary data but NOT reliable enough as sole data source for a production platform. No SLA, no guaranteed uptime, no paid tier.

### 3.2 adhan (npm) -- RECOMMENDED PRIMARY

**Package:** `adhan` (v4.4.3+)
**GitHub:** [batoulapps/adhan-js](https://github.com/batoulapps/adhan-js)
**License:** MIT

**Strengths:**
- **Offline-first:** Pure mathematical calculation, zero network dependency
- **High precision:** Equations from "Astronomical Algorithms" by Jean Meeus
- **TypeScript native:** Full type definitions included
- **Browser + Node:** ESM and UMD bundles
- **Kuwait method built-in:** `CalculationMethod.Kuwait()` returns Fajr 18.0 / Isha 17.5 degrees
- **All 13 methods supported:** Including Umm al-Qura, MWL, ISNA, Egyptian, Dubai, Qatar, Kuwait, Singapore, Turkey, Tehran, Moonsighting Committee, Karachi, Other (custom)
- **Rich API:** `PrayerTimes`, `SunnahTimes`, `Qibla`, `Coordinates`, `CalculationMethod`
- **Next prayer:** `currentPrayer()` and `nextPrayer()` methods built-in
- **Ramadan adjustment:** Supports `+30 min` Isha adjustment for Umm al-Qura during Ramadan

**Usage Example (Kuwait):**
```typescript
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

const kuwaitCity = new Coordinates(29.3759, 47.9774);
const params = CalculationMethod.Kuwait();
const date = new Date(2026, 1, 15); // Feb 15, 2026
const prayerTimes = new PrayerTimes(kuwaitCity, date, params);

console.log(prayerTimes.fajr);    // Date object
console.log(prayerTimes.dhuhr);   // Date object
console.log(prayerTimes.asr);     // Date object
console.log(prayerTimes.maghrib); // Date object
console.log(prayerTimes.isha);    // Date object

// Navigation
const current = prayerTimes.currentPrayer();   // 'dhuhr', 'asr', etc.
const next = prayerTimes.nextPrayer();         // Next upcoming prayer
const nextTime = prayerTimes.timeForPrayer(next); // Date object
```

**Bundle size:** ~15KB minified (negligible)

### 3.3 @umalqura/core -- Hijri Calendar

**Package:** `@umalqura/core`
**Purpose:** Umm al-Qura Hijri calendar conversion
**Coverage:** 1356 AH (1937 CE) to 1500 AH (2077 CE) -- well covers 2026 (1447-1448 AH)

**Usage:**
```typescript
import { UmAlQura } from '@umalqura/core';

const uq = new UmAlQura(new Date(2026, 1, 15));
console.log(uq.hy); // Hijri year (1447)
console.log(uq.hm); // Hijri month
console.log(uq.hd); // Hijri day
```

### 3.4 moment-hijri (Alternative)

**Package:** `moment-hijri`
**Purpose:** Moment.js plugin for Hijri dates (Umm al-Qura based)
**Note:** moment.js is in maintenance mode; prefer `@umalqura/core` for new projects unless moment is already a dependency.

---

## 4. KUWAIT 2026 CALENDAR: KEY DATES

### 4.1 Public Holidays (Official)

| Holiday | Gregorian Date | Hijri Date | Duration |
|---------|---------------|------------|----------|
| New Year's Day | Jan 1 | -- | 1 day |
| Isra and Mi'raj | Jan 16 (tentative) | 27 Rajab 1447 | 1 day |
| National Day | Feb 25 (Wed) | -- | 1 day |
| Liberation Day | Feb 26 (Thu) | -- | 1 day |
| Ramadan begins | ~Feb 18 | 1 Ramadan 1447 | 30 days |
| Eid al-Fitr | Mar 20-22 (tentative) | 1-3 Shawwal 1447 | 3 days |
| Eid al-Adha | May 26-29 (tentative) | 10-13 Dhul Hijjah 1447 | 4 days |
| Islamic New Year | Jun 16 (tentative) | 1 Muharram 1448 | 1 day |
| Prophet's Birthday | Aug 27 (tentative) | 12 Rabi al-Awwal 1448 | 1 day |

**Note:** Islamic dates are tentative and depend on moon sighting confirmation.

### 4.2 Ramadan 2026 Working Hours (Official Government Regulation)

Per Kuwait Civil Service Commission (External Decision No. 1 of 2024):
- **Government employees:** 4.5 hours/day throughout Ramadan
- **Flexible start:** 8:30 AM to 10:30 AM
- **Evening shifts:** Start no earlier than 6:45 PM, total 4.5 hours
- **Female employees:** Additional 15-minute grace period at start and end
- **Private sector (Labor Law):** 6 hours/day during Ramadan (reduced from 8)

---

## 5. INTEGRATION DESIGN: RegionalSchedulingService

### 5.1 Architecture Overview

```
RegionalSchedulingService
    |
    +-- PrayerTimeEngine (adhan npm)
    |       - Offline calculation for any date/location
    |       - Kuwait method by default
    |       - Buffer zones around prayer times
    |
    +-- HijriCalendarEngine (@umalqura/core)
    |       - Gregorian <-> Hijri conversion
    |       - Ramadan detection
    |       - Islamic month awareness
    |
    +-- IslamicHolidayEngine (Aladhan API + local cache)
    |       - Holiday dates by Hijri year
    |       - Moon sighting adjustment support
    |       - Local cache with TTL
    |
    +-- WorkflowScheduleAdapter
            - Integrates with NexusWorkflowEngine
            - Pre-execution schedule check
            - Auto-delay / reschedule logic
```

### 5.2 TypeScript Interface Design

```typescript
// ===== Core Types =====

interface PrayerTime {
  name: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  time: Date;
  /** Buffer zone: don't schedule anything within this window */
  bufferBefore: number;  // minutes before prayer (default: 10)
  bufferAfter: number;   // minutes after prayer (default: 20)
}

interface PrayerSchedule {
  date: Date;
  prayers: PrayerTime[];
  currentPrayer: string | null;
  nextPrayer: PrayerTime | null;
  /** Time until next prayer in minutes */
  minutesUntilNext: number;
}

interface HijriDate {
  year: number;        // e.g., 1447
  month: number;       // 1-12
  monthName: string;   // "Ramadan", "Shawwal", etc.
  monthNameAr: string; // Arabic month name
  day: number;
  dayOfWeek: string;
}

interface IslamicPeriod {
  name: string;
  nameAr: string;
  type: 'ramadan' | 'eid_fitr' | 'eid_adha' | 'muharram' | 'hajj' | 'holiday';
  startDate: Date;
  endDate: Date;
  workingHoursOverride?: { start: string; end: string };
  schedulingNotes: string[];
}

type ScheduleConflict = {
  type: 'prayer_time' | 'islamic_holiday' | 'ramadan_hours' | 'weekend';
  description: string;
  descriptionAr: string;
  conflictStart: Date;
  conflictEnd: Date;
  suggestedAlternative: Date;
};

// ===== Service Interface =====

interface IRegionalSchedulingService {
  // Prayer Times
  getPrayerTimes(date: Date, coords?: Coordinates): PrayerSchedule;
  getCurrentPrayer(coords?: Coordinates): PrayerTime | null;
  getNextPrayer(coords?: Coordinates): PrayerTime;
  isWithinPrayerBuffer(time: Date, coords?: Coordinates): boolean;
  getNextAvailableSlot(afterTime: Date, durationMinutes: number, coords?: Coordinates): Date;

  // Hijri Calendar
  toHijri(gregorian: Date): HijriDate;
  toGregorian(hijri: HijriDate): Date;
  getCurrentHijriDate(): HijriDate;
  getHijriMonth(gregorian: Date): { month: number; name: string; nameAr: string };

  // Islamic Periods & Holidays
  isRamadan(date?: Date): boolean;
  isEid(date?: Date): { isEid: boolean; eidName?: string };
  isIslamicHoliday(date?: Date): { isHoliday: boolean; holiday?: IslamicPeriod };
  getIslamicHolidays(year: number): IslamicPeriod[];
  getRamadanDates(gregorianYear: number): { start: Date; end: Date };

  // Working Hours (prayer + Ramadan aware)
  getEffectiveWorkingHours(date: Date, countryCode?: string): { start: string; end: string };
  isWithinWorkingHours(time: Date, countryCode?: string): boolean;

  // Scheduling Intelligence
  checkScheduleConflicts(
    proposedTime: Date,
    durationMinutes: number,
    coords?: Coordinates
  ): ScheduleConflict[];

  suggestBestTime(
    date: Date,
    durationMinutes: number,
    preferences?: SchedulingPreferences,
    coords?: Coordinates
  ): Date[];

  // Notification Intelligence
  shouldDelayNotification(time: Date): { delay: boolean; reason?: string; resumeAt?: Date };
  getNotificationWindow(date: Date): { windows: TimeWindow[]; blockedPeriods: BlockedPeriod[] };
}

interface SchedulingPreferences {
  avoidPrayerTimes: boolean;       // Default: true
  respectRamadanHours: boolean;    // Default: true
  avoidIslamicHolidays: boolean;   // Default: true
  preferMorning: boolean;          // Default: false
  prayerBufferMinutes: number;     // Default: 15 before, 20 after
  customBlockedTimes?: TimeWindow[];
}

interface TimeWindow {
  start: string; // HH:mm format
  end: string;
}

interface BlockedPeriod {
  start: Date;
  end: Date;
  reason: string;
  reasonAr: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}
```

### 5.3 Prayer Time Buffer Logic

```
Timeline for Dhuhr at 11:55:

11:40  11:45  11:50  11:55  12:00  12:05  12:10  12:15  12:20
  |      |      |      |      |      |      |      |      |
  [--- WARNING ZONE ---][ PRAYER ][----- RECOVERY ZONE ----]
  |<-- 15 min before -->|        |<---- 20 min after ----->|

  NO NEW MEETINGS START         NO NOTIFICATIONS SENT
  SHOW "PRAYER SOON" HINT       AUTO-DELAY QUEUED ITEMS
```

**Default buffers:**
- **Before prayer:** 15 minutes (warn, don't schedule new meetings)
- **During prayer:** ~15 minutes (block all scheduling, delay notifications)
- **After prayer:** 20 minutes (recovery, allow gradual resume)

**Total blocked window per prayer:** ~50 minutes

**During business hours, 2 prayers x 50 min = ~100 min of prayer-aware scheduling per day.**

### 5.4 Ramadan Mode

When `isRamadan() === true`:

| Aspect | Normal Mode | Ramadan Mode |
|--------|-------------|--------------|
| Work hours (govt) | 08:00-17:00 | 08:30-13:00 (4.5 hrs) |
| Work hours (private) | 08:00-17:00 | 09:00-15:00 (6 hrs) |
| Meeting suggestions | 09:00-16:00 | 09:00-12:30 |
| Notification cutoff | 17:00 | 13:00 (govt) / 15:00 (private) |
| Iftar alert | N/A | 30 min before Maghrib |
| Suhoor alert | N/A | 60 min before Fajr (optional) |
| Isha adjustment | Standard | +30 min (Umm al-Qura method) |

### 5.5 Workflow Scheduling Integration

**Pre-execution check (added to NexusWorkflowEngine):**

```typescript
// Before executing any scheduled workflow:
async function preExecuteCheck(scheduledTime: Date): Promise<ExecutionDecision> {
  const conflicts = regionalScheduling.checkScheduleConflicts(
    scheduledTime,
    estimatedDuration,
    userCoordinates
  );

  if (conflicts.length === 0) {
    return { execute: true };
  }

  // Auto-reschedule based on conflict type
  for (const conflict of conflicts) {
    switch (conflict.type) {
      case 'prayer_time':
        return {
          execute: false,
          reschedule: true,
          newTime: conflict.suggestedAlternative,
          reason: `Delayed ${Math.round((conflict.suggestedAlternative.getTime() - scheduledTime.getTime()) / 60000)} minutes for prayer time`
        };

      case 'islamic_holiday':
        return {
          execute: false,
          reschedule: true,
          newTime: getNextBusinessDay(conflict.conflictEnd),
          reason: `Rescheduled after ${conflict.description}`
        };

      case 'ramadan_hours':
        return {
          execute: false,
          reschedule: true,
          newTime: nextMorningSlot(conflict.suggestedAlternative),
          reason: 'Outside Ramadan working hours'
        };
    }
  }
}
```

**Notification delay logic:**

```typescript
function shouldDelayNotification(time: Date): DelayDecision {
  // During prayer buffer
  if (isWithinPrayerBuffer(time)) {
    const nextPrayer = getNextPrayer();
    const resumeAt = new Date(nextPrayer.time.getTime() + 20 * 60000);
    return { delay: true, reason: 'prayer_time', resumeAt };
  }

  // During Ramadan, after work hours
  if (isRamadan() && !isWithinRamadanWorkingHours(time)) {
    const nextWorkDay = getNextRamadanWorkStart();
    return { delay: true, reason: 'ramadan_hours', resumeAt: nextWorkDay };
  }

  // Islamic holiday
  if (isIslamicHoliday(time).isHoliday) {
    const nextWorkDay = getNextBusinessDay(time);
    return { delay: true, reason: 'islamic_holiday', resumeAt: nextWorkDay };
  }

  return { delay: false };
}
```

---

## 6. CACHING STRATEGY

### 6.1 Prayer Times Cache

| Data | Calculation | Cache TTL | Storage |
|------|------------|-----------|---------|
| Today's prayer times | Local (adhan) | Until midnight | In-memory |
| This week's prayers | Local (adhan) | 7 days | localStorage |
| Monthly calendar | Local (adhan) | 30 days | localStorage |
| User coordinates | Browser geolocation | Session | sessionStorage |

**No API dependency for prayer times.** The `adhan` library calculates locally. Cache is purely for performance (avoid recalculating the same date multiple times).

### 6.2 Hijri Calendar Cache

| Data | Source | Cache TTL | Storage |
|------|--------|-----------|---------|
| Current Hijri date | Local (@umalqura/core) | Until midnight | In-memory |
| Hijri-Gregorian mapping | Local (@umalqura/core) | Indefinite | In-memory |
| Ramadan start/end | Local calc + API verify | Yearly | localStorage |

### 6.3 Islamic Holiday Cache

| Data | Source | Cache TTL | Storage |
|------|--------|-----------|---------|
| Holidays for current Hijri year | Aladhan API | 30 days | localStorage |
| Holidays for next Hijri year | Aladhan API | 30 days | localStorage |
| Moon sighting adjustments | Manual/API update | Until confirmed | localStorage |

**Fallback:** If Aladhan API is unreachable, use locally calculated approximate dates (the existing `getApproximateIslamicHolidayDates()` function in `gcc-context.ts` with improved accuracy via `@umalqura/core`).

### 6.4 Cache Key Structure

```typescript
const CACHE_KEYS = {
  prayerTimes: (date: string, lat: number, lng: number) =>
    `nexus:prayer:${date}:${lat.toFixed(2)},${lng.toFixed(2)}`,
  hijriDate: (date: string) =>
    `nexus:hijri:${date}`,
  holidays: (hijriYear: number) =>
    `nexus:holidays:${hijriYear}`,
  ramadanDates: (year: number) =>
    `nexus:ramadan:${year}`,
};
```

---

## 7. OFFLINE FALLBACK DESIGN

**Critical principle:** Nexus must NEVER fail to provide prayer times or Islamic calendar data due to network issues.

### Tier 1: Local Calculation (ALWAYS available)
- `adhan` npm library: Pure math, zero network dependency
- `@umalqura/core`: Pure math, zero network dependency
- Coverage: Prayer times for any date/location, Hijri conversion for 1937-2077 CE

### Tier 2: Cached API Data (When previously fetched)
- Islamic holidays with exact dates (from Aladhan API)
- Moon sighting-confirmed dates
- TTL: 30 days for holidays

### Tier 3: Approximate Dates (Last resort)
- Improve existing `getApproximateIslamicHolidayDates()` using `@umalqura/core`
- Accuracy: Within 1-2 days of actual dates
- Sufficient for scheduling purposes (users confirm exact dates)

### Tier 4: User Override
- Allow users to manually input exact Ramadan/Eid dates
- Stored locally, override all calculations
- Critical for businesses that follow specific moon sighting authorities

---

## 8. IMPACT ON EXISTING CODEBASE

### 8.1 Files to Modify (Minimal, Additive)

| File | Change Type | Description |
|------|-------------|-------------|
| `src/services/RegionalIntelligenceService.ts` | Extend | Add `getPrayerTimes()`, `isRamadan()`, `getIslamicPeriods()` |
| `src/lib/workflow-engine/regional/gcc-context.ts` | Extend | Replace `getApproximateIslamicHolidayDates()` with accurate `@umalqura/core` version |
| `server/agents/index.ts` | Extend (personality) | Add prayer-time-aware scheduling instructions to Nexus persona |
| `src/services/NexusWorkflowEngine.ts` | Extend | Add pre-execution prayer check hook |

### 8.2 New Files to Create

| File | Purpose |
|------|---------|
| `src/services/RegionalSchedulingService.ts` | Main service implementing `IRegionalSchedulingService` |
| `src/services/PrayerTimeEngine.ts` | Wrapper around `adhan` with caching |
| `src/services/HijriCalendarEngine.ts` | Wrapper around `@umalqura/core` |
| `src/hooks/usePrayerTimes.ts` | React hook for components |
| `src/hooks/useIslamicCalendar.ts` | React hook for Hijri dates |

### 8.3 NPM Dependencies to Add

```json
{
  "adhan": "^4.4.3",
  "@umalqura/core": "^0.0.9"
}
```

Both are lightweight, MIT-licensed, TypeScript-compatible, and have zero transitive dependencies.

### 8.4 Integration with Existing Regional Context

The existing `gcc-context.ts` already has:
- `BusinessHours.ramadanHours` property (defined but not dynamically used)
- `isGCCBusinessHours(countryCode, isRamadan)` function
- `getApproximateIslamicHolidayDates(year)` function (crude, needs replacement)
- `COMMON_ISLAMIC_HOLIDAYS` array

The new `RegionalSchedulingService` plugs into these existing structures and makes them dynamic (real-time Ramadan detection, accurate prayer times, precise Hijri conversion).

---

## 9. NEXUS AI PERSONALITY ADDITIONS

The following should be added to the Nexus agent personality in `server/agents/index.ts`:

**Prayer-Aware Scheduling Intelligence:**
- When user says "schedule a meeting" -- check for prayer time conflicts
- When user says "set a reminder" during prayer buffer -- auto-delay
- During Ramadan -- default to shorter meeting slots (30 min max)
- Auto-suggest iftar-friendly timing for evening events
- Never schedule anything between 11:40-12:20 (Dhuhr buffer) or 14:50-15:25 (Asr buffer)

**Islamic Calendar Awareness:**
- Use both Gregorian and Hijri dates in scheduling context
- Detect Ramadan automatically and switch to Ramadan work hours
- Suggest Eid greetings for workflows running near Eid
- Adjust "end of month" workflows for Hijri month boundaries when relevant

---

## 10. RISK ASSESSMENT

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Aladhan API downtime | Medium | Low | Offline-first design (adhan + @umalqura/core) |
| Moon sighting discrepancy | Medium | Medium | User override mechanism + 1-2 day buffer |
| Prayer time accuracy | Low | Low | adhan library is astronomically precise |
| Timezone issues | Low | High | Use `Asia/Kuwait` (UTC+3, no DST) consistently |
| Ramadan date off by 1 day | Medium | Medium | Detect from Hijri month, allow manual override |
| Bundle size increase | Low | Low | adhan ~15KB, @umalqura/core ~8KB |

---

## 11. SOURCES

- [AlAdhan Prayer Times API](https://aladhan.com/prayer-times-api) - REST API documentation
- [AlAdhan Calculation Methods](https://aladhan.com/calculation-methods) - Method parameters
- [AlAdhan API Rate Limits Discussion](https://community.islamic.network/d/2-is-there-a-rate-limit-on-the-apis)
- [adhan-js (GitHub)](https://github.com/batoulapps/adhan-js) - Primary prayer time library
- [adhan-js Calculation Methods](https://github.com/batoulapps/adhan-js/blob/master/METHODS.md) - Method details
- [adhan (npm)](https://www.npmjs.com/package/adhan) - Package page
- [@umalqura/core (npm)](https://www.npmjs.com/package/@umalqura/core) - Hijri calendar library
- [moment-hijri (npm)](https://www.npmjs.com/package/moment-hijri) - Alternative Hijri library
- [Kuwait Ramadan 2026 Working Hours (Khaleej Times)](https://www.khaleejtimes.com/world/mena/kuwait-working-hours-government-employees-ramadan-2026)
- [Kuwait Public Holidays 2026](https://checkdatetime.com/holiday/public-holidays-in-kuwait-2026/)
- [Prayer Time Methods Comparison](https://muslimdirectoryapp.com/blog/prayer-time-calculation-methods/)
- [AlAdhan API Documentation (GitHub Gist)](https://gist.github.com/Zxce3/e1cc0363de3694e04bb440a5c8d57726)
- [Kuwait Working Hours & Leave Laws](https://www.qureos.com/labor-laws/working-hours-holidays-and-leave-in-kuwait)

---

## 12. RECOMMENDATION SUMMARY

| Decision | Recommendation | Reason |
|----------|---------------|--------|
| Prayer calculation | `adhan` npm (offline) | Zero network dependency, Kuwait method built-in, TypeScript |
| Hijri calendar | `@umalqura/core` (offline) | Lightweight, accurate, covers 1937-2077 CE |
| Islamic holidays | Aladhan API + local cache | API for exact dates, local fallback for offline |
| Architecture | Offline-first with API supplement | Reliability critical for scheduling |
| Calculation method | Kuwait (method 9) | Official method, Fajr 18.0 / Isha 17.5 |
| Prayer buffer | 15 min before + 20 min after | Balances respect with productivity |
| Ramadan detection | Hijri month check via @umalqura/core | Automatic, no API needed |
| Caching | localStorage + in-memory | Prayer times daily, holidays monthly |

**Implementation priority:** HIGH -- This is a core differentiator for the Kuwait market. No competing workflow platform offers prayer-aware scheduling intelligence.

---

*Report generated: 2026-02-15 | Agent 7 (Regional Intelligence) | Cycle 3*

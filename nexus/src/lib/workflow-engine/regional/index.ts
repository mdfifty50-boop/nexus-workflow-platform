/**
 * Nexus Regional Context Modules
 *
 * Provides comprehensive regional intelligence for:
 * - GCC (Gulf Cooperation Council): Kuwait, UAE, Saudi Arabia, Qatar, Bahrain, Oman
 * - MENA (Middle East & North Africa): Egypt, Jordan, Lebanon, Morocco, Tunisia, Algeria, Iraq
 * - Global: United States, United Kingdom, European Union, Asia Pacific
 *
 * Each module includes:
 * - Work week and business hours
 * - Holiday calendars (Islamic and national)
 * - Tax and regulatory compliance
 * - Payment methods and preferences
 * - Communication styles and etiquette
 * - Business culture insights
 */

// GCC Context (Kuwait, UAE, Saudi Arabia, Qatar, Bahrain, Oman)
export {
  // Types
  type GCCCountryContext,
  type GCCCurrency,
  type WorkWeekInfo,
  type BusinessHours as GCCBusinessHours,
  type NationalHoliday,
  type IslamicHoliday,
  type HolidayConfig,
  type Holiday as GCCHoliday,
  type TaxConfig,
  type LaborRegulation,
  type CommercialRegulation,
  type DataProtectionRegulation,
  type RegulationsConfig,
  type PaymentConfig,
  type CommunicationConfig,
  type LanguageConfig,
  type GCCCountryCode,
  // Constants
  GCC_COUNTRY_CODES,
  // Functions
  getGCCContext,
  getGCCWorkWeek,
  getGCCBusinessHours,
  getGCCVATRate,
  getGCCHolidays,
  isGCCBusinessDay,
  getNextGCCBusinessDay,
  convertGCCCurrency,
  getGCCTimezoneOffset,
  formatGCCDate,
  getGCCPhonePrefix,
  getAllGCCCountries,
} from './gcc-context';

// MENA & Global Context
export {
  // Types
  type RegionalContext,
  type CurrencyInfo,
  type ComplianceRequirements,
  type RegionalIntelligence,
  type Holiday as GlobalHoliday,
  type BusinessHours as GlobalBusinessHours,
  // MENA Country Contexts
  EGYPT_CONTEXT,
  JORDAN_CONTEXT,
  LEBANON_CONTEXT,
  MOROCCO_CONTEXT,
  TUNISIA_CONTEXT,
  ALGERIA_CONTEXT,
  IRAQ_CONTEXT,
  // Global Region Contexts
  UNITED_STATES_CONTEXT,
  UNITED_KINGDOM_CONTEXT,
  EUROPEAN_UNION_CONTEXT,
  ASIA_PACIFIC_CONTEXT,
  // Functions
  getMENAContext,
  getGlobalContext,
  getDataProtectionRequirements,
  getComplianceFrameworks,
  isBusinessDay,
  getRegionalPaymentMethods,
  getRegionalCommunicationPreferences,
  detectRegion,
  getRegionalCompliance,
  formatInternationalDate,
  getRegionalCurrency,
  createRegionalIntelligence,
  getBusinessHours,
} from './global-context';

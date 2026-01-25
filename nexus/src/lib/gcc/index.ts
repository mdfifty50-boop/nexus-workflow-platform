/**
 * GCC Business Module
 * Re-exports all GCC-specific business types, compliance utilities, and currency handling
 */

// Business Types
export {
  GCCCountry,
  GCCCountryNames,
  GCCBusinessType,
  GCCBusinessTypeNames,
  BusinessTypesByCountry,
  GCCIndustry,
  GCCIndustryNames,
  VATConfigByCountry,
  getCountryName,
  getBusinessTypeName,
  getIndustryName,
  isBusinessTypeAvailable,
  getVATRate,
  hasVAT,
} from './gcc-business-types';

export type {
  GCCCountryCode,
  GCCBusinessTypeCode,
  GCCIndustryCode,
  CompanyRegistration,
  CompanyAddress,
  VATRegistration,
  VATConfig,
} from './gcc-business-types';

// Compliance Utilities
export {
  calculateVAT,
  extractVAT,
  shouldRegisterForVAT,
  validateCRNumber,
  detectCountryFromCR,
  validateCivilID,
  extractBirthDateFromCivilID,
  getLicenseRequirements,
  validatePassportNumber,
  daysUntilExpiry,
  isRenewalDue,
  isExpired,
} from './gcc-compliance';

export type {
  VATCalculationResult,
  CRValidationResult,
  CivilIDValidationResult,
  LicenseRequirement,
  LicenseRequirements,
} from './gcc-compliance';

// Currency Handling
export {
  GCCCurrency,
  GCCCurrencyMetadata,
  CountryToCurrency,
  CurrencyDecimalPlaces,
  getDecimalPlaces,
  createExchangeRateTable,
  convertCurrency,
  formatGCCCurrency,
  formatWithCurrencyName,
  parseCurrencyString,
  getCurrencyForCountry,
  getCurrencyMetadata,
  roundToCurrencyPrecision,
  toSmallestUnit,
  fromSmallestUnit,
  areAmountsEqual,
} from './gcc-currencies';

export type {
  GCCCurrencyCode,
  CurrencyMetadata,
  ExchangeRate,
  ExchangeRateTable,
  FormatCurrencyOptions,
} from './gcc-currencies';

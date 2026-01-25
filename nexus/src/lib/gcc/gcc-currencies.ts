/**
 * GCC Currency Handling Utilities
 * Currency codes, decimal places, exchange rates, and formatting
 */

import type { GCCCountryCode } from './gcc-business-types';

// ============================================================================
// GCC CURRENCY CODES
// ============================================================================

export const GCCCurrency = {
  KWD: 'KWD',
  AED: 'AED',
  SAR: 'SAR',
  BHD: 'BHD',
  QAR: 'QAR',
  OMR: 'OMR',
} as const;

export type GCCCurrencyCode = typeof GCCCurrency[keyof typeof GCCCurrency];

// ============================================================================
// CURRENCY METADATA
// ============================================================================

export interface CurrencyMetadata {
  code: GCCCurrencyCode;
  name: string;
  nameAr: string;
  symbol: string;
  symbolAr: string;
  decimalPlaces: number;
  country: GCCCountryCode;
  subunit: string;
  subunitAr: string;
  subunitsPerUnit: number;
}

export const GCCCurrencyMetadata: Record<GCCCurrencyCode, CurrencyMetadata> = {
  KWD: {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    nameAr: 'دينار كويتي',
    symbol: 'KD',
    symbolAr: 'د.ك',
    decimalPlaces: 3,
    country: 'KW',
    subunit: 'fils',
    subunitAr: 'فلس',
    subunitsPerUnit: 1000,
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    nameAr: 'درهم إماراتي',
    symbol: 'AED',
    symbolAr: 'د.إ',
    decimalPlaces: 2,
    country: 'AE',
    subunit: 'fils',
    subunitAr: 'فلس',
    subunitsPerUnit: 100,
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    nameAr: 'ريال سعودي',
    symbol: 'SAR',
    symbolAr: 'ر.س',
    decimalPlaces: 2,
    country: 'SA',
    subunit: 'halala',
    subunitAr: 'هللة',
    subunitsPerUnit: 100,
  },
  BHD: {
    code: 'BHD',
    name: 'Bahraini Dinar',
    nameAr: 'دينار بحريني',
    symbol: 'BD',
    symbolAr: 'د.ب',
    decimalPlaces: 3,
    country: 'BH',
    subunit: 'fils',
    subunitAr: 'فلس',
    subunitsPerUnit: 1000,
  },
  QAR: {
    code: 'QAR',
    name: 'Qatari Riyal',
    nameAr: 'ريال قطري',
    symbol: 'QR',
    symbolAr: 'ر.ق',
    decimalPlaces: 2,
    country: 'QA',
    subunit: 'dirham',
    subunitAr: 'درهم',
    subunitsPerUnit: 100,
  },
  OMR: {
    code: 'OMR',
    name: 'Omani Rial',
    nameAr: 'ريال عماني',
    symbol: 'OMR',
    symbolAr: 'ر.ع',
    decimalPlaces: 3,
    country: 'OM',
    subunit: 'baisa',
    subunitAr: 'بيسة',
    subunitsPerUnit: 1000,
  },
};

// Country to currency mapping
export const CountryToCurrency: Record<GCCCountryCode, GCCCurrencyCode> = {
  KW: 'KWD',
  AE: 'AED',
  SA: 'SAR',
  BH: 'BHD',
  QA: 'QAR',
  OM: 'OMR',
};

// ============================================================================
// DECIMAL PLACES BY CURRENCY
// ============================================================================

export const CurrencyDecimalPlaces: Record<GCCCurrencyCode, number> = {
  KWD: 3,
  AED: 2,
  SAR: 2,
  BHD: 3,
  QAR: 2,
  OMR: 3,
};

/**
 * Get decimal places for a currency
 */
export function getDecimalPlaces(currency: GCCCurrencyCode): number {
  return CurrencyDecimalPlaces[currency];
}

// ============================================================================
// EXCHANGE RATE STRUCTURE
// ============================================================================

export interface ExchangeRate {
  fromCurrency: GCCCurrencyCode;
  toCurrency: GCCCurrencyCode | string;
  rate: number;
  inverseRate: number;
  timestamp: Date;
  source?: string;
}

export interface ExchangeRateTable {
  baseCurrency: GCCCurrencyCode;
  rates: Record<string, number>;
  timestamp: Date;
  source?: string;
}

// Approximate exchange rates (for reference - should be fetched from API in production)
// Rates against USD as of knowledge cutoff
const USD_RATES: Record<GCCCurrencyCode, number> = {
  KWD: 0.307,  // 1 KWD = ~3.26 USD (strongest currency)
  AED: 3.673,  // Fixed peg
  SAR: 3.75,   // Fixed peg
  BHD: 0.376,  // Fixed peg
  QAR: 3.64,   // Fixed peg
  OMR: 0.385,  // Fixed peg
};

/**
 * Create exchange rate table for a base currency
 * Note: In production, these should be fetched from a live API
 */
export function createExchangeRateTable(baseCurrency: GCCCurrencyCode): ExchangeRateTable {
  const baseToUSD = USD_RATES[baseCurrency];
  const rates: Record<string, number> = { USD: 1 / baseToUSD };

  // Calculate cross rates through USD
  for (const [currency, usdRate] of Object.entries(USD_RATES)) {
    if (currency !== baseCurrency) {
      // Rate: how many units of target currency per 1 unit of base currency
      rates[currency] = baseToUSD / usdRate;
    }
  }

  return {
    baseCurrency,
    rates,
    timestamp: new Date(),
    source: 'static-reference-rates',
  };
}

/**
 * Convert amount between GCC currencies
 * Note: Uses static reference rates - production should use live API
 */
export function convertCurrency(
  amount: number,
  fromCurrency: GCCCurrencyCode,
  toCurrency: GCCCurrencyCode
): { amount: number; rate: number } {
  if (fromCurrency === toCurrency) {
    return { amount, rate: 1 };
  }

  const fromUSD = USD_RATES[fromCurrency];
  const toUSD = USD_RATES[toCurrency];
  const rate = fromUSD / toUSD;
  const convertedAmount = amount * rate;

  // Round to appropriate decimal places
  const decimals = CurrencyDecimalPlaces[toCurrency];
  const roundedAmount = Math.round(convertedAmount * Math.pow(10, decimals)) / Math.pow(10, decimals);

  return { amount: roundedAmount, rate };
}

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

export interface FormatCurrencyOptions {
  /** Display symbol instead of code */
  useSymbol?: boolean;
  /** Use Arabic symbol */
  useArabicSymbol?: boolean;
  /** Show symbol/code before amount */
  symbolBefore?: boolean;
  /** Include thousands separator */
  thousandsSeparator?: boolean;
  /** Locale for number formatting */
  locale?: 'en' | 'ar';
  /** Override decimal places */
  decimalPlaces?: number;
}

/**
 * Format amount in GCC currency
 */
export function formatGCCCurrency(
  amount: number,
  currency: GCCCurrencyCode,
  options: FormatCurrencyOptions = {}
): string {
  const {
    useSymbol = false,
    useArabicSymbol = false,
    symbolBefore = true,
    thousandsSeparator = true,
    locale = 'en',
    decimalPlaces,
  } = options;

  const metadata = GCCCurrencyMetadata[currency];
  const decimals = decimalPlaces ?? metadata.decimalPlaces;

  // Format the number
  let formattedNumber: string;

  if (locale === 'ar') {
    // Arabic number formatting
    formattedNumber = amount.toLocaleString('ar-SA', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: thousandsSeparator,
    });
  } else {
    // English number formatting
    formattedNumber = amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: thousandsSeparator,
    });
  }

  // Get the symbol/code to use
  let currencyDisplay: string;
  if (useSymbol) {
    currencyDisplay = useArabicSymbol ? metadata.symbolAr : metadata.symbol;
  } else {
    currencyDisplay = metadata.code;
  }

  // Combine based on position preference
  if (locale === 'ar') {
    // Arabic typically shows currency after amount
    return `${formattedNumber} ${currencyDisplay}`;
  } else if (symbolBefore) {
    return `${currencyDisplay} ${formattedNumber}`;
  } else {
    return `${formattedNumber} ${currencyDisplay}`;
  }
}

/**
 * Format amount with full currency name
 */
export function formatWithCurrencyName(
  amount: number,
  currency: GCCCurrencyCode,
  locale: 'en' | 'ar' = 'en'
): string {
  const metadata = GCCCurrencyMetadata[currency];
  const decimals = metadata.decimalPlaces;

  const formattedNumber = amount.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const currencyName = locale === 'ar' ? metadata.nameAr : metadata.name;

  return `${formattedNumber} ${currencyName}`;
}

/**
 * Parse currency string to number
 */
export function parseCurrencyString(
  value: string,
  currency: GCCCurrencyCode
): number | null {
  // Remove currency symbols and codes
  let cleaned = value.trim();

  // Remove common currency symbols and codes
  const metadata = GCCCurrencyMetadata[currency];
  cleaned = cleaned
    .replace(new RegExp(metadata.symbol, 'gi'), '')
    .replace(new RegExp(metadata.symbolAr, 'g'), '')
    .replace(new RegExp(metadata.code, 'gi'), '')
    .trim();

  // Handle Arabic numerals
  cleaned = cleaned
    .replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/٬/g, '')  // Arabic thousands separator
    .replace(/٫/g, '.'); // Arabic decimal separator

  // Remove thousands separators (both , and space)
  cleaned = cleaned.replace(/[,\s]/g, '');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get currency for a GCC country
 */
export function getCurrencyForCountry(country: GCCCountryCode): GCCCurrencyCode {
  return CountryToCurrency[country];
}

/**
 * Get currency metadata
 */
export function getCurrencyMetadata(currency: GCCCurrencyCode): CurrencyMetadata {
  return GCCCurrencyMetadata[currency];
}

/**
 * Round amount to currency's decimal places
 */
export function roundToCurrencyPrecision(
  amount: number,
  currency: GCCCurrencyCode
): number {
  const decimals = CurrencyDecimalPlaces[currency];
  const multiplier = Math.pow(10, decimals);
  return Math.round(amount * multiplier) / multiplier;
}

/**
 * Convert amount to smallest unit (fils/halala/baisa)
 */
export function toSmallestUnit(
  amount: number,
  currency: GCCCurrencyCode
): number {
  const metadata = GCCCurrencyMetadata[currency];
  return Math.round(amount * metadata.subunitsPerUnit);
}

/**
 * Convert from smallest unit to main unit
 */
export function fromSmallestUnit(
  amount: number,
  currency: GCCCurrencyCode
): number {
  const metadata = GCCCurrencyMetadata[currency];
  return amount / metadata.subunitsPerUnit;
}

/**
 * Check if two amounts are equal within currency precision
 */
export function areAmountsEqual(
  amount1: number,
  amount2: number,
  currency: GCCCurrencyCode
): boolean {
  const rounded1 = roundToCurrencyPrecision(amount1, currency);
  const rounded2 = roundToCurrencyPrecision(amount2, currency);
  return rounded1 === rounded2;
}

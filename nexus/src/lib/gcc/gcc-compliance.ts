/**
 * GCC Regulatory Compliance Utilities
 * VAT calculations, document validations, and compliance requirements
 */

import type {
  GCCCountryCode,
  GCCBusinessTypeCode,
} from './gcc-business-types';
import {
  GCCCountry,
  VATConfigByCountry,
} from './gcc-business-types';

// ============================================================================
// VAT CALCULATION UTILITIES
// ============================================================================

export interface VATCalculationResult {
  /** Original amount (exclusive of VAT) */
  amountExclusive: number;
  /** VAT amount */
  vatAmount: number;
  /** Total amount (inclusive of VAT) */
  amountInclusive: number;
  /** VAT rate applied */
  vatRate: number;
  /** Whether VAT was applied */
  vatApplied: boolean;
  /** Country code */
  country: GCCCountryCode;
}

/**
 * Calculate VAT for an amount
 * @param amount - Amount exclusive of VAT
 * @param country - GCC country code
 * @param isZeroRated - Whether the item is zero-rated
 * @param isExempt - Whether the item is VAT exempt
 */
export function calculateVAT(
  amount: number,
  country: GCCCountryCode,
  isZeroRated = false,
  isExempt = false
): VATCalculationResult {
  const config = VATConfigByCountry[country];
  const vatRate = isZeroRated || isExempt ? 0 : config.standardRate;
  const vatAmount = amount * (vatRate / 100);

  return {
    amountExclusive: amount,
    vatAmount: Math.round(vatAmount * 100) / 100,
    amountInclusive: Math.round((amount + vatAmount) * 100) / 100,
    vatRate,
    vatApplied: vatRate > 0,
    country,
  };
}

/**
 * Extract VAT from VAT-inclusive amount
 * @param amountInclusive - Amount inclusive of VAT
 * @param country - GCC country code
 */
export function extractVAT(
  amountInclusive: number,
  country: GCCCountryCode
): VATCalculationResult {
  const config = VATConfigByCountry[country];
  const vatRate = config.standardRate;

  if (vatRate === 0) {
    return {
      amountExclusive: amountInclusive,
      vatAmount: 0,
      amountInclusive,
      vatRate: 0,
      vatApplied: false,
      country,
    };
  }

  const amountExclusive = amountInclusive / (1 + vatRate / 100);
  const vatAmount = amountInclusive - amountExclusive;

  return {
    amountExclusive: Math.round(amountExclusive * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    amountInclusive,
    vatRate,
    vatApplied: true,
    country,
  };
}

/**
 * Check if entity should be VAT registered
 */
export function shouldRegisterForVAT(
  annualTurnover: number,
  country: GCCCountryCode
): { mandatory: boolean; voluntary: boolean; notRequired: boolean } {
  const config = VATConfigByCountry[country];

  if (config.standardRate === 0) {
    return { mandatory: false, voluntary: false, notRequired: true };
  }

  return {
    mandatory: annualTurnover >= config.registrationThreshold.mandatory,
    voluntary: annualTurnover >= config.registrationThreshold.voluntary &&
               annualTurnover < config.registrationThreshold.mandatory,
    notRequired: annualTurnover < config.registrationThreshold.voluntary,
  };
}

// ============================================================================
// CR NUMBER VALIDATION
// ============================================================================

export interface CRValidationResult {
  isValid: boolean;
  country?: GCCCountryCode;
  errorMessage?: string;
  normalizedNumber?: string;
}

// CR number formats by country
const CR_PATTERNS: Record<GCCCountryCode, RegExp> = {
  // Kuwait: 6 digits (e.g., 123456)
  KW: /^\d{6}$/,
  // UAE: Format varies by emirate, typically 6-8 digits
  AE: /^\d{6,8}$/,
  // Saudi Arabia: 10 digits starting with 1 or 4 (e.g., 1010123456)
  SA: /^[14]\d{9}$/,
  // Bahrain: CR followed by 5-6 digits (e.g., CR12345)
  BH: /^(CR)?\d{5,6}$/i,
  // Qatar: 5-6 digits
  QA: /^\d{5,6}$/,
  // Oman: 7 digits
  OM: /^\d{7}$/,
};

/**
 * Validate Commercial Registration number format
 */
export function validateCRNumber(
  crNumber: string,
  country: GCCCountryCode
): CRValidationResult {
  const cleanNumber = crNumber.trim().toUpperCase().replace(/\s/g, '');
  const pattern = CR_PATTERNS[country];

  if (!pattern) {
    return {
      isValid: false,
      errorMessage: `Unknown country code: ${country}`,
    };
  }

  if (!pattern.test(cleanNumber)) {
    return {
      isValid: false,
      country,
      errorMessage: getCRFormatDescription(country),
    };
  }

  return {
    isValid: true,
    country,
    normalizedNumber: cleanNumber,
  };
}

/**
 * Get CR number format description for error messages
 */
function getCRFormatDescription(country: GCCCountryCode): string {
  const descriptions: Record<GCCCountryCode, string> = {
    KW: 'Kuwait CR must be 6 digits (e.g., 123456)',
    AE: 'UAE CR must be 6-8 digits',
    SA: 'Saudi CR must be 10 digits starting with 1 or 4 (e.g., 1010123456)',
    BH: 'Bahrain CR must be 5-6 digits, optionally prefixed with CR',
    QA: 'Qatar CR must be 5-6 digits',
    OM: 'Oman CR must be 7 digits',
  };
  return descriptions[country];
}

/**
 * Auto-detect country from CR number format
 */
export function detectCountryFromCR(crNumber: string): GCCCountryCode | null {
  const cleanNumber = crNumber.trim().toUpperCase().replace(/\s/g, '');

  // Check each country's pattern
  for (const country of Object.values(GCCCountry)) {
    if (CR_PATTERNS[country].test(cleanNumber)) {
      // Additional checks for ambiguous cases
      if (cleanNumber.length === 10 && /^[14]/.test(cleanNumber)) {
        return 'SA';
      }
      if (/^CR/i.test(cleanNumber)) {
        return 'BH';
      }
      if (cleanNumber.length === 6) {
        // Could be KW, AE, BH, or QA - return null for ambiguous
        return null;
      }
      return country;
    }
  }

  return null;
}

// ============================================================================
// CIVIL ID VALIDATION (Kuwait)
// ============================================================================

export interface CivilIDValidationResult {
  isValid: boolean;
  errorMessage?: string;
  birthYear?: number;
  gender?: 'male' | 'female';
  normalizedNumber?: string;
}

/**
 * Validate Kuwait Civil ID number
 * Format: 12 digits - CYYMMDDSSSSG
 * C = Century (2 for 1900s, 3 for 2000s)
 * YY = Year of birth
 * MM = Month of birth
 * DD = Day of birth
 * SSSS = Serial number
 * G = Gender (odd = male, even = female)
 */
export function validateCivilID(civilId: string): CivilIDValidationResult {
  const cleanNumber = civilId.trim().replace(/\s/g, '');

  // Check format: exactly 12 digits
  if (!/^\d{12}$/.test(cleanNumber)) {
    return {
      isValid: false,
      errorMessage: 'Civil ID must be exactly 12 digits',
    };
  }

  const century = parseInt(cleanNumber[0], 10);
  const year = parseInt(cleanNumber.substring(1, 3), 10);
  const month = parseInt(cleanNumber.substring(3, 5), 10);
  const day = parseInt(cleanNumber.substring(5, 7), 10);
  const genderDigit = parseInt(cleanNumber[11], 10);

  // Validate century (2 = 1900s, 3 = 2000s)
  if (century !== 2 && century !== 3) {
    return {
      isValid: false,
      errorMessage: 'Invalid century digit (must be 2 or 3)',
    };
  }

  // Validate month
  if (month < 1 || month > 12) {
    return {
      isValid: false,
      errorMessage: 'Invalid month in Civil ID',
    };
  }

  // Validate day
  if (day < 1 || day > 31) {
    return {
      isValid: false,
      errorMessage: 'Invalid day in Civil ID',
    };
  }

  // Calculate full birth year
  const fullYear = century === 2 ? 1900 + year : 2000 + year;

  // Validate year is not in future
  const currentYear = new Date().getFullYear();
  if (fullYear > currentYear) {
    return {
      isValid: false,
      errorMessage: 'Birth year cannot be in the future',
    };
  }

  return {
    isValid: true,
    normalizedNumber: cleanNumber,
    birthYear: fullYear,
    gender: genderDigit % 2 === 1 ? 'male' : 'female',
  };
}

/**
 * Extract birth date from Kuwait Civil ID
 */
export function extractBirthDateFromCivilID(civilId: string): Date | null {
  const validation = validateCivilID(civilId);
  if (!validation.isValid || !validation.normalizedNumber) {
    return null;
  }

  const num = validation.normalizedNumber;
  const century = parseInt(num[0], 10);
  const year = parseInt(num.substring(1, 3), 10);
  const month = parseInt(num.substring(3, 5), 10);
  const day = parseInt(num.substring(5, 7), 10);

  const fullYear = century === 2 ? 1900 + year : 2000 + year;

  return new Date(fullYear, month - 1, day);
}

// ============================================================================
// COMMERCIAL LICENSE REQUIREMENTS
// ============================================================================

export interface LicenseRequirement {
  name: string;
  nameAr: string;
  isRequired: boolean;
  authority: string;
  authorityAr: string;
  notes?: string;
}

export interface LicenseRequirements {
  country: GCCCountryCode;
  businessType: GCCBusinessTypeCode;
  requirements: LicenseRequirement[];
  estimatedProcessingDays: number;
  renewalPeriodMonths: number;
}

/**
 * Get commercial license requirements by country
 */
export function getLicenseRequirements(
  country: GCCCountryCode,
  businessType: GCCBusinessTypeCode
): LicenseRequirements {
  // Base requirements common to all GCC countries
  const baseRequirements: LicenseRequirement[] = [
    {
      name: 'Commercial Registration',
      nameAr: 'السجل التجاري',
      isRequired: true,
      authority: 'Ministry of Commerce',
      authorityAr: 'وزارة التجارة',
    },
    {
      name: 'Trade License',
      nameAr: 'الرخصة التجارية',
      isRequired: true,
      authority: 'Municipality',
      authorityAr: 'البلدية',
    },
    {
      name: 'Chamber of Commerce Membership',
      nameAr: 'عضوية غرفة التجارة',
      isRequired: true,
      authority: 'Chamber of Commerce',
      authorityAr: 'غرفة التجارة',
    },
  ];

  // Country-specific requirements
  const countryRequirements: Partial<Record<GCCCountryCode, LicenseRequirement[]>> = {
    KW: [
      {
        name: 'MOSAL Registration',
        nameAr: 'تسجيل الشؤون',
        isRequired: true,
        authority: 'Ministry of Social Affairs and Labor',
        authorityAr: 'وزارة الشؤون الاجتماعية والعمل',
      },
      {
        name: 'PACI Registration',
        nameAr: 'تسجيل الهيئة العامة للمعلومات المدنية',
        isRequired: true,
        authority: 'Public Authority for Civil Information',
        authorityAr: 'الهيئة العامة للمعلومات المدنية',
      },
    ],
    AE: [
      {
        name: 'Emirates ID Registration',
        nameAr: 'تسجيل الهوية الإماراتية',
        isRequired: true,
        authority: 'Federal Authority for Identity and Citizenship',
        authorityAr: 'الهيئة الاتحادية للهوية والجنسية',
      },
      {
        name: 'VAT Registration',
        nameAr: 'التسجيل الضريبي',
        isRequired: false,
        authority: 'Federal Tax Authority',
        authorityAr: 'الهيئة الاتحادية للضرائب',
        notes: 'Required if annual turnover exceeds AED 375,000',
      },
    ],
    SA: [
      {
        name: 'Zakat & Tax Registration',
        nameAr: 'تسجيل الزكاة والضريبة',
        isRequired: true,
        authority: 'Zakat, Tax and Customs Authority',
        authorityAr: 'هيئة الزكاة والضريبة والجمارك',
      },
      {
        name: 'GOSI Registration',
        nameAr: 'تسجيل التأمينات الاجتماعية',
        isRequired: true,
        authority: 'General Organization for Social Insurance',
        authorityAr: 'المؤسسة العامة للتأمينات الاجتماعية',
      },
    ],
    BH: [
      {
        name: 'SIO Registration',
        nameAr: 'تسجيل التأمينات الاجتماعية',
        isRequired: true,
        authority: 'Social Insurance Organization',
        authorityAr: 'الهيئة العامة للتأمين الاجتماعي',
      },
      {
        name: 'NBR VAT Registration',
        nameAr: 'التسجيل الضريبي',
        isRequired: false,
        authority: 'National Bureau for Revenue',
        authorityAr: 'الجهاز الوطني للإيرادات',
        notes: 'Required if annual turnover exceeds BHD 37,500',
      },
    ],
    QA: [
      {
        name: 'QID Registration',
        nameAr: 'تسجيل الهوية القطرية',
        isRequired: true,
        authority: 'Ministry of Interior',
        authorityAr: 'وزارة الداخلية',
      },
    ],
    OM: [
      {
        name: 'Tax Card',
        nameAr: 'البطاقة الضريبية',
        isRequired: true,
        authority: 'Tax Authority',
        authorityAr: 'جهاز الضرائب',
      },
      {
        name: 'PASI Registration',
        nameAr: 'تسجيل التأمينات الاجتماعية',
        isRequired: true,
        authority: 'Public Authority for Social Insurance',
        authorityAr: 'الهيئة العامة للتأمينات الاجتماعية',
      },
    ],
  };

  // Processing times vary by country
  const processingDays: Record<GCCCountryCode, number> = {
    KW: 14,
    AE: 7,
    SA: 10,
    BH: 5,
    QA: 10,
    OM: 14,
  };

  // Renewal periods (in months)
  const renewalPeriods: Record<GCCCountryCode, number> = {
    KW: 12,
    AE: 12,
    SA: 12,
    BH: 12,
    QA: 12,
    OM: 12,
  };

  return {
    country,
    businessType,
    requirements: [...baseRequirements, ...(countryRequirements[country] || [])],
    estimatedProcessingDays: processingDays[country],
    renewalPeriodMonths: renewalPeriods[country],
  };
}

// ============================================================================
// DOCUMENT VALIDATION UTILITIES
// ============================================================================

/**
 * Validate passport number format (basic validation)
 */
export function validatePassportNumber(passportNumber: string): boolean {
  // Basic format: 6-9 alphanumeric characters
  const cleanNumber = passportNumber.trim().toUpperCase().replace(/\s/g, '');
  return /^[A-Z0-9]{6,9}$/.test(cleanNumber);
}

/**
 * Calculate days until license expiry
 */
export function daysUntilExpiry(expiryDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if license renewal is due (within 30 days of expiry)
 */
export function isRenewalDue(expiryDate: Date, warningDays = 30): boolean {
  return daysUntilExpiry(expiryDate) <= warningDays;
}

/**
 * Check if document is expired
 */
export function isExpired(expiryDate: Date): boolean {
  return daysUntilExpiry(expiryDate) < 0;
}

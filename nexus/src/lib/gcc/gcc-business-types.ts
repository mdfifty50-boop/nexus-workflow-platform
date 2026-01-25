/**
 * GCC Business Types & Configurations
 * Defines business structures, registration types, and industries for GCC countries
 */

// ============================================================================
// GCC COUNTRIES
// ============================================================================

export const GCCCountry = {
  KW: 'KW',
  AE: 'AE',
  SA: 'SA',
  BH: 'BH',
  QA: 'QA',
  OM: 'OM',
} as const;

export type GCCCountryCode = typeof GCCCountry[keyof typeof GCCCountry];

export const GCCCountryNames: Record<GCCCountryCode, { en: string; ar: string }> = {
  KW: { en: 'Kuwait', ar: 'الكويت' },
  AE: { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة' },
  SA: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
  BH: { en: 'Bahrain', ar: 'البحرين' },
  QA: { en: 'Qatar', ar: 'قطر' },
  OM: { en: 'Oman', ar: 'عُمان' },
};

// ============================================================================
// GCC BUSINESS TYPES
// ============================================================================

export const GCCBusinessType = {
  LLC: 'LLC',
  WLL: 'WLL',
  SOLE_PROPRIETOR: 'SOLE_PROPRIETOR',
  BRANCH: 'BRANCH',
  PARTNERSHIP: 'PARTNERSHIP',
  JOINT_STOCK: 'JOINT_STOCK',
  FREE_ZONE: 'FREE_ZONE',
  CIVIL_COMPANY: 'CIVIL_COMPANY',
} as const;

export type GCCBusinessTypeCode = typeof GCCBusinessType[keyof typeof GCCBusinessType];

export const GCCBusinessTypeNames: Record<GCCBusinessTypeCode, { en: string; ar: string }> = {
  LLC: { en: 'Limited Liability Company', ar: 'شركة ذات مسؤولية محدودة' },
  WLL: { en: 'With Limited Liability', ar: 'ذات مسؤولية محدودة' },
  SOLE_PROPRIETOR: { en: 'Sole Proprietorship', ar: 'مؤسسة فردية' },
  BRANCH: { en: 'Branch Office', ar: 'فرع شركة' },
  PARTNERSHIP: { en: 'Partnership', ar: 'شركة تضامنية' },
  JOINT_STOCK: { en: 'Joint Stock Company', ar: 'شركة مساهمة' },
  FREE_ZONE: { en: 'Free Zone Company', ar: 'شركة منطقة حرة' },
  CIVIL_COMPANY: { en: 'Civil Company', ar: 'شركة مدنية' },
};

// Business types available by country
export const BusinessTypesByCountry: Record<GCCCountryCode, GCCBusinessTypeCode[]> = {
  KW: ['LLC', 'WLL', 'SOLE_PROPRIETOR', 'BRANCH', 'PARTNERSHIP', 'JOINT_STOCK'],
  AE: ['LLC', 'SOLE_PROPRIETOR', 'BRANCH', 'FREE_ZONE', 'JOINT_STOCK', 'CIVIL_COMPANY'],
  SA: ['LLC', 'SOLE_PROPRIETOR', 'BRANCH', 'PARTNERSHIP', 'JOINT_STOCK'],
  BH: ['LLC', 'WLL', 'SOLE_PROPRIETOR', 'BRANCH', 'PARTNERSHIP'],
  QA: ['LLC', 'WLL', 'SOLE_PROPRIETOR', 'BRANCH', 'JOINT_STOCK'],
  OM: ['LLC', 'SOLE_PROPRIETOR', 'BRANCH', 'PARTNERSHIP', 'JOINT_STOCK'],
};

// ============================================================================
// GCC INDUSTRIES
// ============================================================================

export const GCCIndustry = {
  TRADING: 'TRADING',
  SERVICES: 'SERVICES',
  CONTRACTING: 'CONTRACTING',
  MANUFACTURING: 'MANUFACTURING',
  RETAIL: 'RETAIL',
  HOSPITALITY: 'HOSPITALITY',
  HEALTHCARE: 'HEALTHCARE',
  EDUCATION: 'EDUCATION',
  TECHNOLOGY: 'TECHNOLOGY',
  FINANCE: 'FINANCE',
  REAL_ESTATE: 'REAL_ESTATE',
  TRANSPORT: 'TRANSPORT',
  OIL_GAS: 'OIL_GAS',
  CONSULTANCY: 'CONSULTANCY',
  FOOD_BEVERAGE: 'FOOD_BEVERAGE',
} as const;

export type GCCIndustryCode = typeof GCCIndustry[keyof typeof GCCIndustry];

export const GCCIndustryNames: Record<GCCIndustryCode, { en: string; ar: string }> = {
  TRADING: { en: 'Trading', ar: 'تجارة' },
  SERVICES: { en: 'Services', ar: 'خدمات' },
  CONTRACTING: { en: 'Contracting', ar: 'مقاولات' },
  MANUFACTURING: { en: 'Manufacturing', ar: 'تصنيع' },
  RETAIL: { en: 'Retail', ar: 'تجزئة' },
  HOSPITALITY: { en: 'Hospitality', ar: 'ضيافة' },
  HEALTHCARE: { en: 'Healthcare', ar: 'رعاية صحية' },
  EDUCATION: { en: 'Education', ar: 'تعليم' },
  TECHNOLOGY: { en: 'Technology', ar: 'تكنولوجيا' },
  FINANCE: { en: 'Finance', ar: 'تمويل' },
  REAL_ESTATE: { en: 'Real Estate', ar: 'عقارات' },
  TRANSPORT: { en: 'Transport & Logistics', ar: 'نقل وخدمات لوجستية' },
  OIL_GAS: { en: 'Oil & Gas', ar: 'نفط وغاز' },
  CONSULTANCY: { en: 'Consultancy', ar: 'استشارات' },
  FOOD_BEVERAGE: { en: 'Food & Beverage', ar: 'أغذية ومشروبات' },
};

// ============================================================================
// COMPANY REGISTRATION INTERFACES
// ============================================================================

export interface CompanyRegistration {
  /** Commercial Registration number */
  crNumber: string;
  /** Country of registration */
  country: GCCCountryCode;
  /** Business type */
  businessType: GCCBusinessTypeCode;
  /** Company name in English */
  companyNameEn: string;
  /** Company name in Arabic */
  companyNameAr: string;
  /** Ministry of Commerce registration date */
  mocRegistrationDate: Date;
  /** Ministry of Commerce file number */
  mocFileNumber?: string;
  /** Ministry of Social Affairs and Labor registration (Kuwait) */
  mosalNumber?: string;
  /** Chamber of Commerce membership number */
  chamberNumber?: string;
  /** License number */
  licenseNumber: string;
  /** License issue date */
  licenseIssueDate: Date;
  /** License expiry date */
  licenseExpiryDate: Date;
  /** Primary industry */
  primaryIndustry: GCCIndustryCode;
  /** Secondary industries (activities) */
  secondaryIndustries?: GCCIndustryCode[];
  /** Registered capital */
  registeredCapital?: {
    amount: number;
    currency: string;
  };
  /** Municipality registration (if applicable) */
  municipalityNumber?: string;
  /** Whether the company is active */
  isActive: boolean;
}

export interface CompanyAddress {
  /** Block number */
  block?: string;
  /** Street name */
  street: string;
  /** Building number */
  building?: string;
  /** Floor number */
  floor?: string;
  /** Office/Unit number */
  unit?: string;
  /** Area/District */
  area: string;
  /** City */
  city: string;
  /** Country */
  country: GCCCountryCode;
  /** Postal code (if applicable) */
  postalCode?: string;
  /** PO Box */
  poBox?: string;
}

// ============================================================================
// VAT REGISTRATION INTERFACES
// ============================================================================

export interface VATRegistration {
  /** VAT registration number */
  vatNumber: string;
  /** Country of VAT registration */
  country: GCCCountryCode;
  /** VAT registration date */
  registrationDate: Date;
  /** Tax group (if part of VAT group) */
  taxGroup?: string;
  /** VAT filing frequency */
  filingFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  /** Whether the entity is VAT registered */
  isRegistered: boolean;
  /** VAT deregistration date (if applicable) */
  deregistrationDate?: Date;
  /** Taxable turnover threshold exceeded */
  exceedsTurnoverThreshold: boolean;
  /** Annual taxable turnover */
  annualTurnover?: {
    amount: number;
    currency: string;
  };
}

export interface VATConfig {
  /** Standard VAT rate (percentage) */
  standardRate: number;
  /** Zero-rated categories */
  zeroRatedCategories: string[];
  /** Exempt categories */
  exemptCategories: string[];
  /** Registration threshold */
  registrationThreshold: {
    mandatory: number;
    voluntary: number;
    currency: string;
  };
  /** Filing deadlines (days after period end) */
  filingDeadlineDays: number;
}

// VAT configurations by country
export const VATConfigByCountry: Record<GCCCountryCode, VATConfig> = {
  KW: {
    standardRate: 0, // Kuwait has no VAT yet
    zeroRatedCategories: [],
    exemptCategories: [],
    registrationThreshold: {
      mandatory: 0,
      voluntary: 0,
      currency: 'KWD',
    },
    filingDeadlineDays: 0,
  },
  AE: {
    standardRate: 5,
    zeroRatedCategories: [
      'exports',
      'international_transport',
      'certain_education',
      'certain_healthcare',
      'first_supply_residential_property',
    ],
    exemptCategories: [
      'financial_services',
      'residential_property',
      'bare_land',
      'local_passenger_transport',
    ],
    registrationThreshold: {
      mandatory: 375000,
      voluntary: 187500,
      currency: 'AED',
    },
    filingDeadlineDays: 28,
  },
  SA: {
    standardRate: 15,
    zeroRatedCategories: [
      'exports',
      'international_transport',
      'certain_medicines',
      'certain_medical_equipment',
    ],
    exemptCategories: [
      'financial_services',
      'residential_property_rental',
    ],
    registrationThreshold: {
      mandatory: 375000,
      voluntary: 187500,
      currency: 'SAR',
    },
    filingDeadlineDays: 28,
  },
  BH: {
    standardRate: 10,
    zeroRatedCategories: [
      'exports',
      'international_transport',
      'certain_education',
      'certain_healthcare',
    ],
    exemptCategories: [
      'financial_services',
      'residential_property',
    ],
    registrationThreshold: {
      mandatory: 37500,
      voluntary: 18750,
      currency: 'BHD',
    },
    filingDeadlineDays: 28,
  },
  QA: {
    standardRate: 0, // Qatar has no VAT yet
    zeroRatedCategories: [],
    exemptCategories: [],
    registrationThreshold: {
      mandatory: 0,
      voluntary: 0,
      currency: 'QAR',
    },
    filingDeadlineDays: 0,
  },
  OM: {
    standardRate: 5,
    zeroRatedCategories: [
      'exports',
      'international_transport',
      'certain_food_items',
      'certain_education',
      'certain_healthcare',
    ],
    exemptCategories: [
      'financial_services',
      'residential_property_rental',
    ],
    registrationThreshold: {
      mandatory: 38500,
      voluntary: 19250,
      currency: 'OMR',
    },
    filingDeadlineDays: 28,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get country name in specified language
 */
export function getCountryName(code: GCCCountryCode, lang: 'en' | 'ar' = 'en'): string {
  return GCCCountryNames[code][lang];
}

/**
 * Get business type name in specified language
 */
export function getBusinessTypeName(code: GCCBusinessTypeCode, lang: 'en' | 'ar' = 'en'): string {
  return GCCBusinessTypeNames[code][lang];
}

/**
 * Get industry name in specified language
 */
export function getIndustryName(code: GCCIndustryCode, lang: 'en' | 'ar' = 'en'): string {
  return GCCIndustryNames[code][lang];
}

/**
 * Check if business type is available in country
 */
export function isBusinessTypeAvailable(
  country: GCCCountryCode,
  businessType: GCCBusinessTypeCode
): boolean {
  return BusinessTypesByCountry[country].includes(businessType);
}

/**
 * Get VAT rate for country
 */
export function getVATRate(country: GCCCountryCode): number {
  return VATConfigByCountry[country].standardRate;
}

/**
 * Check if country has VAT
 */
export function hasVAT(country: GCCCountryCode): boolean {
  return VATConfigByCountry[country].standardRate > 0;
}

/**
 * GCC Regional Context Module
 *
 * Provides comprehensive regional context for all Gulf Cooperation Council countries:
 * - Kuwait (KW)
 * - United Arab Emirates (AE)
 * - Saudi Arabia (SA)
 * - Qatar (QA)
 * - Bahrain (BH)
 * - Oman (OM)
 *
 * This module includes business hours, holidays, regulations, payment methods,
 * communication preferences, and cultural context for workflow automation.
 *
 * @module gcc-context
 * @version 1.0.0
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Currency information for a GCC country
 */
export interface GCCCurrency {
  /** ISO 4217 currency code */
  code: string;
  /** Currency symbol */
  symbol: string;
  /** Full currency name */
  name: string;
  /** Subunit name (fils, halalas, etc.) */
  subunit: string;
  /** Subunits per main unit */
  subunitRatio: number;
}

/**
 * Work week configuration
 */
export interface WorkWeekInfo {
  /** Starting day of work week (e.g., "Sunday") */
  start: string;
  /** Ending day of work week (e.g., "Thursday") */
  end: string;
  /** Days that constitute the weekend */
  weekendDays: string[];
  /** Working days array */
  workingDays: string[];
}

/**
 * Business hours configuration
 */
export interface BusinessHours {
  /** Opening time in 24h format */
  start: string;
  /** Closing time in 24h format */
  end: string;
  /** Whether split shift is common (morning/evening) */
  splitShift: boolean;
  /** Morning session end time (if split shift) */
  morningEnd?: string;
  /** Evening session start time (if split shift) */
  eveningStart?: string;
  /** Ramadan adjusted hours */
  ramadanHours?: {
    start: string;
    end: string;
  };
}

/**
 * National holiday with fixed date
 */
export interface NationalHoliday {
  /** Holiday name in English */
  name: string;
  /** Holiday name in Arabic */
  nameAr: string;
  /** Date in MM-DD format (fixed) or description for variable */
  date: string;
  /** Number of days the holiday typically lasts */
  duration: number;
}

/**
 * Islamic holiday (variable dates based on lunar calendar)
 */
export interface IslamicHoliday {
  /** Holiday name in English */
  name: string;
  /** Holiday name in Arabic */
  nameAr: string;
  /** Typical duration in days */
  duration: number;
  /** Description of the holiday */
  description: string;
}

/**
 * Holiday configuration for a country
 */
export interface HolidayConfig {
  /** Islamic holidays (variable dates) */
  islamic: IslamicHoliday[];
  /** National/fixed holidays */
  national: NationalHoliday[];
}

/**
 * Holiday instance with actual dates
 */
export interface Holiday {
  /** Holiday name */
  name: string;
  /** Holiday name in Arabic */
  nameAr: string;
  /** Start date */
  startDate: Date;
  /** End date */
  endDate: Date;
  /** Type of holiday */
  type: 'islamic' | 'national';
}

/**
 * Tax configuration
 */
export interface TaxConfig {
  /** VAT rate as percentage */
  vat: number;
  /** VAT effective date */
  vatEffectiveDate?: string;
  /** Corporate tax rate (if applicable) */
  corporateTax?: number;
  /** Corporate tax effective date */
  corporateTaxEffectiveDate?: string;
  /** Income tax rate (usually 0 for GCC nationals) */
  incomeTax: number;
  /** Notes about tax */
  notes?: string;
}

/**
 * Labor regulation reference
 */
export interface LaborRegulation {
  /** Primary labor law reference */
  primaryLaw: string;
  /** Year of enactment */
  year: number;
  /** Key provisions summary */
  keyProvisions: string[];
  /** Nationalization policy name */
  nationalizationPolicy?: string;
  /** Minimum wage (if applicable) */
  minimumWage?: {
    amount: number;
    currency: string;
    applicableTo: string;
  };
  /** Working hours limits */
  workingHoursLimit: {
    daily: number;
    weekly: number;
    ramadanReduction?: number;
  };
}

/**
 * Commercial regulation reference
 */
export interface CommercialRegulation {
  /** Commercial companies law */
  companiesLaw: string;
  /** Foreign ownership rules */
  foreignOwnership: {
    maxPercentage: number;
    exceptions: string[];
    freeZones?: string[];
  };
  /** Business registration requirements */
  registrationAuthority: string;
  /** License types */
  licenseTypes: string[];
}

/**
 * Data protection regulation
 */
export interface DataProtectionRegulation {
  /** Primary law/regulation name */
  name: string;
  /** Year enacted */
  year?: number;
  /** Regulatory authority */
  authority: string;
  /** Key requirements */
  requirements: string[];
}

/**
 * Regulations configuration
 */
export interface RegulationsConfig {
  /** Labor regulations */
  labor: LaborRegulation;
  /** Commercial regulations */
  commercial: CommercialRegulation;
  /** Tax configuration */
  tax: TaxConfig;
  /** Data protection */
  dataProtection?: DataProtectionRegulation;
}

/**
 * Payment methods configuration
 */
export interface PaymentConfig {
  /** Dominant payment methods in order of popularity */
  dominantMethods: string[];
  /** Local payment gateway */
  localGateway?: {
    name: string;
    code: string;
    website?: string;
  };
  /** Mobile payment apps popular in the country */
  mobilePayments: string[];
  /** International cards acceptance level */
  internationalCardsAcceptance: 'high' | 'medium' | 'low';
  /** Cash usage level */
  cashUsage: 'high' | 'medium' | 'low';
  /** Bank transfer systems */
  bankTransferSystems: string[];
}

/**
 * Communication preferences
 */
export interface CommunicationConfig {
  /** Preferred platforms in order of popularity */
  preferredPlatforms: string[];
  /** Business communication etiquette tips */
  businessEtiquette: string[];
  /** Formal vs informal preference */
  formalityLevel: 'high' | 'medium' | 'low';
  /** Response time expectations */
  responseTimeExpectation: string;
}

/**
 * Language configuration
 */
export interface LanguageConfig {
  /** Official language(s) */
  official: string[];
  /** Primary business language */
  business: string;
  /** Common additional languages */
  common: string[];
}

/**
 * Complete GCC country context
 */
export interface GCCCountryContext {
  /** Country name in English */
  name: string;
  /** Country name in Arabic */
  nameAr: string;
  /** ISO 3166-1 alpha-2 code */
  code: string;
  /** International phone prefix */
  phonePrefix: string;
  /** Currency information */
  currency: GCCCurrency;
  /** Work week configuration */
  workWeek: WorkWeekInfo;
  /** Business hours */
  businessHours: BusinessHours;
  /** IANA timezone identifier */
  timezone: string;
  /** UTC offset in hours */
  utcOffset: number;
  /** Language configuration */
  language: LanguageConfig;
  /** Holiday configuration */
  holidays: HolidayConfig;
  /** Regulations */
  regulations: RegulationsConfig;
  /** Payment configuration */
  payment: PaymentConfig;
  /** Communication preferences */
  communication: CommunicationConfig;
  /** Business culture notes */
  businessCulture: string[];
  /** Key cities for business */
  keyCities: string[];
  /** Special economic zones/free zones */
  freeZones?: string[];
  /** National vision/strategy (if applicable) */
  nationalVision?: {
    name: string;
    targetYear: number;
    keyPillars: string[];
  };
}

// ============================================================================
// COMMON ISLAMIC HOLIDAYS (Shared across GCC)
// ============================================================================

/**
 * Common Islamic holidays observed across all GCC countries
 * Dates vary each year based on the Islamic lunar calendar
 */
const COMMON_ISLAMIC_HOLIDAYS: IslamicHoliday[] = [
  {
    name: 'Eid al-Fitr',
    nameAr: 'عيد الفطر',
    duration: 3,
    description: 'Festival marking the end of Ramadan fasting'
  },
  {
    name: 'Eid al-Adha',
    nameAr: 'عيد الأضحى',
    duration: 4,
    description: 'Festival of Sacrifice during Hajj pilgrimage'
  },
  {
    name: 'Islamic New Year',
    nameAr: 'رأس السنة الهجرية',
    duration: 1,
    description: 'First day of Muharram, the Islamic new year'
  },
  {
    name: 'Prophet\'s Birthday (Mawlid)',
    nameAr: 'المولد النبوي',
    duration: 1,
    description: 'Celebration of Prophet Muhammad\'s birthday'
  },
  {
    name: 'Isra and Mi\'raj',
    nameAr: 'الإسراء والمعراج',
    duration: 1,
    description: 'Night Journey and Ascension of Prophet Muhammad'
  }
];

// ============================================================================
// KUWAIT CONTEXT
// ============================================================================

/**
 * Kuwait country context
 */
const KUWAIT_CONTEXT: GCCCountryContext = {
  name: 'Kuwait',
  nameAr: 'الكويت',
  code: 'KW',
  phonePrefix: '+965',

  currency: {
    code: 'KWD',
    symbol: 'د.ك',
    name: 'Kuwaiti Dinar',
    subunit: 'Fils',
    subunitRatio: 1000
  },

  workWeek: {
    start: 'Sunday',
    end: 'Thursday',
    weekendDays: ['Friday', 'Saturday'],
    workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  },

  businessHours: {
    start: '08:00',
    end: '17:00',
    splitShift: true,
    morningEnd: '12:30',
    eveningStart: '16:00',
    ramadanHours: {
      start: '09:00',
      end: '14:00'
    }
  },

  timezone: 'Asia/Kuwait',
  utcOffset: 3,

  language: {
    official: ['Arabic'],
    business: 'Arabic',
    common: ['English', 'Hindi', 'Tagalog', 'Urdu']
  },

  holidays: {
    islamic: [...COMMON_ISLAMIC_HOLIDAYS],
    national: [
      {
        name: 'New Year\'s Day',
        nameAr: 'رأس السنة الميلادية',
        date: '01-01',
        duration: 1
      },
      {
        name: 'National Day',
        nameAr: 'اليوم الوطني',
        date: '02-25',
        duration: 1
      },
      {
        name: 'Liberation Day',
        nameAr: 'يوم التحرير',
        date: '02-26',
        duration: 1
      }
    ]
  },

  regulations: {
    labor: {
      primaryLaw: 'Labor Law No. 6 of 2010',
      year: 2010,
      keyProvisions: [
        'Maximum 8 working hours per day',
        '48 hours maximum per week',
        'Reduced hours during Ramadan (6 hours)',
        'Annual leave: 30 days after 1 year',
        'End of service benefits mandatory',
        'Work permits required for expatriates'
      ],
      workingHoursLimit: {
        daily: 8,
        weekly: 48,
        ramadanReduction: 2
      }
    },
    commercial: {
      companiesLaw: 'Companies Law No. 1 of 2016',
      foreignOwnership: {
        maxPercentage: 100,
        exceptions: ['Oil sector', 'Media', 'Real estate (limited)'],
        freeZones: ['Kuwait Free Trade Zone']
      },
      registrationAuthority: 'Ministry of Commerce and Industry',
      licenseTypes: ['Commercial', 'Industrial', 'Professional', 'Crafts']
    },
    tax: {
      vat: 5,
      vatEffectiveDate: '2024',
      incomeTax: 0,
      corporateTax: 15,
      notes: 'Corporate tax applies only to foreign entities. VAT implementation planned for 2024.'
    },
    dataProtection: {
      name: 'No comprehensive data protection law',
      authority: 'Communication and Information Technology Regulatory Authority (CITRA)',
      requirements: [
        'Sectoral regulations apply',
        'Banking sector has specific data rules',
        'Telecom data protection under CITRA'
      ]
    }
  },

  payment: {
    dominantMethods: ['KNET', 'Cash', 'Credit/Debit Cards', 'Bank Transfer'],
    localGateway: {
      name: 'KNET',
      code: 'KNET',
      website: 'https://www.knet.com.kw'
    },
    mobilePayments: ['Apple Pay', 'Samsung Pay', 'K-Net Pay'],
    internationalCardsAcceptance: 'high',
    cashUsage: 'medium',
    bankTransferSystems: ['KNET', 'SWIFT', 'IBAN']
  },

  communication: {
    preferredPlatforms: ['WhatsApp', 'Email', 'Instagram', 'Twitter/X', 'Snapchat'],
    businessEtiquette: [
      'Arabic greetings appreciated but English widely used',
      'Business cards exchanged with right hand',
      'Patience important - relationships before business',
      'Avoid scheduling during prayer times',
      'Respect for hierarchy and seniority',
      'Coffee/tea offered at meetings - accept graciously'
    ],
    formalityLevel: 'medium',
    responseTimeExpectation: 'Within 24-48 hours for emails, faster for WhatsApp'
  },

  businessCulture: [
    'Relationship-based business culture - wasta (connections) matters',
    'Hospitality is paramount - expect refreshments at meetings',
    'Decision-making can be slower - patience is valued',
    'Family businesses dominate the private sector',
    'Government and public sector are major employers',
    'Ramadan significantly affects business hours and productivity',
    'Summer months (June-August) see reduced business activity',
    'Face-to-face meetings preferred over virtual for important matters',
    'Hierarchy respected - address senior members first',
    'Diwaniya (social gathering) culture important for networking'
  ],

  keyCities: ['Kuwait City', 'Hawalli', 'Salmiya', 'Ahmadi']
};

// ============================================================================
// UAE CONTEXT
// ============================================================================

/**
 * United Arab Emirates country context
 */
const UAE_CONTEXT: GCCCountryContext = {
  name: 'United Arab Emirates',
  nameAr: 'الإمارات العربية المتحدة',
  code: 'AE',
  phonePrefix: '+971',

  currency: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    subunit: 'Fils',
    subunitRatio: 100
  },

  workWeek: {
    start: 'Monday',
    end: 'Friday',
    weekendDays: ['Saturday', 'Sunday'],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },

  businessHours: {
    start: '09:00',
    end: '18:00',
    splitShift: false,
    ramadanHours: {
      start: '09:00',
      end: '14:00'
    }
  },

  timezone: 'Asia/Dubai',
  utcOffset: 4,

  language: {
    official: ['Arabic'],
    business: 'English',
    common: ['Hindi', 'Urdu', 'Malayalam', 'Tagalog', 'Bengali']
  },

  holidays: {
    islamic: [...COMMON_ISLAMIC_HOLIDAYS],
    national: [
      {
        name: 'New Year\'s Day',
        nameAr: 'رأس السنة الميلادية',
        date: '01-01',
        duration: 1
      },
      {
        name: 'Commemoration Day',
        nameAr: 'يوم الشهيد',
        date: '11-30',
        duration: 1
      },
      {
        name: 'National Day',
        nameAr: 'اليوم الوطني',
        date: '12-02',
        duration: 2
      }
    ]
  },

  regulations: {
    labor: {
      primaryLaw: 'Federal Decree-Law No. 33 of 2021',
      year: 2021,
      keyProvisions: [
        'Maximum 8 working hours per day',
        '48 hours maximum per week',
        'Reduced hours during Ramadan (6 hours)',
        'Minimum 30 days annual leave',
        'End of service gratuity mandatory',
        'Flexible work arrangements recognized',
        'Part-time and temporary work contracts allowed',
        'Non-compete clauses regulated'
      ],
      workingHoursLimit: {
        daily: 8,
        weekly: 48,
        ramadanReduction: 2
      }
    },
    commercial: {
      companiesLaw: 'Federal Decree-Law No. 32 of 2021 (Commercial Companies Law)',
      foreignOwnership: {
        maxPercentage: 100,
        exceptions: ['Strategic sectors require approval'],
        freeZones: [
          'DIFC (Dubai International Financial Centre)',
          'DMCC (Dubai Multi Commodities Centre)',
          'JAFZA (Jebel Ali Free Zone)',
          'ADGM (Abu Dhabi Global Market)',
          'Dubai Silicon Oasis',
          'Dubai Internet City',
          'Dubai Media City',
          'Dubai Healthcare City',
          'Masdar City',
          'Sharjah Airport Free Zone',
          'RAK Free Trade Zone'
        ]
      },
      registrationAuthority: 'Department of Economic Development (per emirate)',
      licenseTypes: ['Commercial', 'Professional', 'Industrial', 'Tourism']
    },
    tax: {
      vat: 5,
      vatEffectiveDate: '2018-01-01',
      corporateTax: 9,
      corporateTaxEffectiveDate: '2023-06-01',
      incomeTax: 0,
      notes: 'Corporate tax of 9% applies to profits over AED 375,000. Free zones may have different rules. No personal income tax.'
    },
    dataProtection: {
      name: 'Federal Decree-Law No. 45 of 2021 (Personal Data Protection Law)',
      year: 2021,
      authority: 'UAE Data Office',
      requirements: [
        'Data processing requires legal basis',
        'Data subject rights recognized',
        'Cross-border transfer restrictions',
        'Data breach notification required',
        'Data Protection Officer may be required',
        'DIFC and ADGM have separate data protection frameworks'
      ]
    }
  },

  payment: {
    dominantMethods: ['Credit/Debit Cards', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Cash'],
    mobilePayments: ['Apple Pay', 'Samsung Pay', 'Google Pay', 'PayBy', 'Careem Pay'],
    internationalCardsAcceptance: 'high',
    cashUsage: 'low',
    bankTransferSystems: ['UAEFTS', 'SWIFT', 'IBAN', 'UAE Switch']
  },

  communication: {
    preferredPlatforms: ['WhatsApp', 'Email', 'LinkedIn', 'Instagram', 'Teams', 'Zoom'],
    businessEtiquette: [
      'English is the primary business language',
      'Business casual to formal dress depending on industry',
      'Punctuality expected in business settings',
      'Building rapport important before negotiations',
      'Business cards exchanged freely',
      'Meetings may be interrupted for prayer times',
      'Avoid scheduling on Friday mornings',
      'Multi-cultural environment - be culturally aware'
    ],
    formalityLevel: 'medium',
    responseTimeExpectation: 'Same day for urgent, 24 hours for standard'
  },

  businessCulture: [
    'Highly diverse and international business environment',
    'Fast-paced and efficient compared to other GCC countries',
    'Innovation and technology adoption encouraged',
    'Networking events and business conferences common',
    'Free zones offer streamlined business setup',
    'Strong focus on entrepreneurship and startups',
    'Government initiatives support business growth',
    'Dubai and Abu Dhabi have distinct business cultures',
    'Expo 2020 legacy continues to drive development',
    'Sustainability and green initiatives gaining importance'
  ],

  keyCities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Ajman'],

  freeZones: [
    'DIFC', 'DMCC', 'JAFZA', 'ADGM', 'Dubai Silicon Oasis',
    'Dubai Internet City', 'Dubai Media City', 'Dubai Healthcare City',
    'Masdar City', 'SAIF Zone', 'RAK FTZ', 'Fujairah Free Zone'
  ],

  nationalVision: {
    name: 'UAE Centennial 2071',
    targetYear: 2071,
    keyPillars: [
      'Future-focused government',
      'Excellent education',
      'Diversified knowledge economy',
      'Happy and cohesive society'
    ]
  }
};

// ============================================================================
// SAUDI ARABIA CONTEXT
// ============================================================================

/**
 * Saudi Arabia country context
 */
const SAUDI_CONTEXT: GCCCountryContext = {
  name: 'Saudi Arabia',
  nameAr: 'المملكة العربية السعودية',
  code: 'SA',
  phonePrefix: '+966',

  currency: {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'Saudi Riyal',
    subunit: 'Halala',
    subunitRatio: 100
  },

  workWeek: {
    start: 'Sunday',
    end: 'Thursday',
    weekendDays: ['Friday', 'Saturday'],
    workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  },

  businessHours: {
    start: '08:00',
    end: '17:00',
    splitShift: true,
    morningEnd: '12:00',
    eveningStart: '16:00',
    ramadanHours: {
      start: '10:00',
      end: '15:00'
    }
  },

  timezone: 'Asia/Riyadh',
  utcOffset: 3,

  language: {
    official: ['Arabic'],
    business: 'Arabic',
    common: ['English', 'Urdu', 'Hindi', 'Tagalog', 'Bengali']
  },

  holidays: {
    islamic: [...COMMON_ISLAMIC_HOLIDAYS],
    national: [
      {
        name: 'Founding Day',
        nameAr: 'يوم التأسيس',
        date: '02-22',
        duration: 1
      },
      {
        name: 'National Day',
        nameAr: 'اليوم الوطني',
        date: '09-23',
        duration: 1
      }
    ]
  },

  regulations: {
    labor: {
      primaryLaw: 'Labor Law (Royal Decree No. M/51)',
      year: 2005,
      keyProvisions: [
        'Maximum 8 working hours per day',
        '48 hours maximum per week',
        'Reduced hours during Ramadan (6 hours)',
        'Minimum 21 days annual leave',
        'End of service benefits mandatory',
        'Saudization quotas (Nitaqat system)',
        'Saudi nationals priority in employment',
        'Wage Protection System (WPS) mandatory'
      ],
      nationalizationPolicy: 'Nitaqat',
      minimumWage: {
        amount: 4000,
        currency: 'SAR',
        applicableTo: 'Saudi nationals'
      },
      workingHoursLimit: {
        daily: 8,
        weekly: 48,
        ramadanReduction: 2
      }
    },
    commercial: {
      companiesLaw: 'Companies Law (Royal Decree M/3)',
      foreignOwnership: {
        maxPercentage: 100,
        exceptions: ['Some sectors require Saudi partner', 'Defense', 'Media'],
        freeZones: [
          'King Abdullah Economic City',
          'Jazan Economic City',
          'Knowledge Economic City',
          'Prince Abdulaziz bin Mousaed Economic City'
        ]
      },
      registrationAuthority: 'Ministry of Commerce',
      licenseTypes: ['Commercial', 'Industrial', 'Professional', 'Agricultural', 'Services']
    },
    tax: {
      vat: 15,
      vatEffectiveDate: '2020-07-01',
      corporateTax: 20,
      incomeTax: 0,
      notes: 'Zakat (2.5%) applies to Saudi/GCC-owned entities. Corporate tax (20%) for foreign-owned. Withholding tax applies to certain payments.'
    },
    dataProtection: {
      name: 'Personal Data Protection Law (PDPL)',
      year: 2021,
      authority: 'Saudi Data & AI Authority (SDAIA)',
      requirements: [
        'Consent required for personal data processing',
        'Data minimization principle',
        'Right to access and correction',
        'Cross-border transfer restrictions',
        'Data breach notification to authority',
        'DPO appointment may be required'
      ]
    }
  },

  payment: {
    dominantMethods: ['MADA', 'Credit/Debit Cards', 'STC Pay', 'Bank Transfer', 'Apple Pay'],
    localGateway: {
      name: 'MADA',
      code: 'MADA',
      website: 'https://www.mada.com.sa'
    },
    mobilePayments: ['STC Pay', 'Apple Pay', 'Samsung Pay', 'Urpay', 'Al Rajhi Pay'],
    internationalCardsAcceptance: 'high',
    cashUsage: 'medium',
    bankTransferSystems: ['SARIE', 'SWIFT', 'IBAN']
  },

  communication: {
    preferredPlatforms: ['WhatsApp', 'Twitter/X', 'Email', 'LinkedIn', 'Snapchat'],
    businessEtiquette: [
      'Arabic preferred in government dealings',
      'Formal dress expected in business settings',
      'Respect for Islamic practices essential',
      'Separate facilities for men and women in some contexts',
      'Personal relationships crucial for business success',
      'Avoid scheduling during prayer times',
      'Right hand for greetings and exchanging items',
      'Patience important in negotiations'
    ],
    formalityLevel: 'high',
    responseTimeExpectation: 'Within 48 hours, government may take longer'
  },

  businessCulture: [
    'Vision 2030 driving rapid transformation',
    'Entertainment and tourism sectors opening up',
    'Saudization policies affect hiring strategies',
    'Government is a major business partner',
    'Family conglomerates dominate private sector',
    'NEOM and giga-projects creating opportunities',
    'Women increasingly participating in workforce',
    'Startup ecosystem growing rapidly',
    'Digital transformation prioritized',
    'Religious considerations important in all dealings'
  ],

  keyCities: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar'],

  freeZones: [
    'King Abdullah Economic City',
    'Jazan Economic City',
    'Knowledge Economic City',
    'Prince Abdulaziz bin Mousaed Economic City',
    'NEOM'
  ],

  nationalVision: {
    name: 'Vision 2030',
    targetYear: 2030,
    keyPillars: [
      'Vibrant society',
      'Thriving economy',
      'Ambitious nation'
    ]
  }
};

// ============================================================================
// QATAR CONTEXT
// ============================================================================

/**
 * Qatar country context
 */
const QATAR_CONTEXT: GCCCountryContext = {
  name: 'Qatar',
  nameAr: 'قطر',
  code: 'QA',
  phonePrefix: '+974',

  currency: {
    code: 'QAR',
    symbol: 'ر.ق',
    name: 'Qatari Riyal',
    subunit: 'Dirham',
    subunitRatio: 100
  },

  workWeek: {
    start: 'Sunday',
    end: 'Thursday',
    weekendDays: ['Friday', 'Saturday'],
    workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  },

  businessHours: {
    start: '07:00',
    end: '14:00',
    splitShift: true,
    morningEnd: '12:00',
    eveningStart: '16:00',
    ramadanHours: {
      start: '09:00',
      end: '14:00'
    }
  },

  timezone: 'Asia/Qatar',
  utcOffset: 3,

  language: {
    official: ['Arabic'],
    business: 'English',
    common: ['English', 'Hindi', 'Urdu', 'Tagalog', 'Malayalam', 'Nepali']
  },

  holidays: {
    islamic: [...COMMON_ISLAMIC_HOLIDAYS],
    national: [
      {
        name: 'National Sports Day',
        nameAr: 'اليوم الرياضي',
        date: '02-second-tuesday',
        duration: 1
      },
      {
        name: 'National Day',
        nameAr: 'اليوم الوطني',
        date: '12-18',
        duration: 1
      }
    ]
  },

  regulations: {
    labor: {
      primaryLaw: 'Labor Law No. 14 of 2004',
      year: 2004,
      keyProvisions: [
        'Maximum 8 working hours per day (10 with overtime)',
        '48 hours maximum per week',
        'Reduced hours during Ramadan (6 hours)',
        'Minimum 3 weeks annual leave',
        'End of service gratuity mandatory',
        'Wage Protection System (WPS) mandatory',
        'Workers\' Welfare Standards enforced post-World Cup',
        'Minimum wage introduced'
      ],
      minimumWage: {
        amount: 1000,
        currency: 'QAR',
        applicableTo: 'All workers'
      },
      workingHoursLimit: {
        daily: 8,
        weekly: 48,
        ramadanReduction: 2
      }
    },
    commercial: {
      companiesLaw: 'Commercial Companies Law No. 11 of 2015',
      foreignOwnership: {
        maxPercentage: 100,
        exceptions: ['Banking', 'Insurance', 'Some real estate'],
        freeZones: [
          'Qatar Financial Centre (QFC)',
          'Qatar Science & Technology Park',
          'Qatar Free Zones (Ras Bufontas, Um Alhoul)'
        ]
      },
      registrationAuthority: 'Ministry of Commerce and Industry',
      licenseTypes: ['Commercial', 'Professional', 'Industrial', 'Services']
    },
    tax: {
      vat: 0,
      incomeTax: 0,
      corporateTax: 10,
      notes: 'No VAT currently. Corporate tax (10%) applies to foreign-owned businesses. QFC entities have separate tax regime (10% on locally sourced income).'
    },
    dataProtection: {
      name: 'Personal Data Privacy Protection Law No. 13 of 2016',
      year: 2016,
      authority: 'Ministry of Transport and Communications',
      requirements: [
        'Consent required for data processing',
        'Data subject access rights',
        'Security measures mandatory',
        'QFC has separate data protection rules'
      ]
    }
  },

  payment: {
    dominantMethods: ['Credit/Debit Cards', 'Cash', 'Bank Transfer', 'Apple Pay'],
    mobilePayments: ['Apple Pay', 'Samsung Pay', 'QPay', 'Ooredoo Money'],
    internationalCardsAcceptance: 'high',
    cashUsage: 'medium',
    bankTransferSystems: ['QIPS', 'SWIFT', 'IBAN']
  },

  communication: {
    preferredPlatforms: ['WhatsApp', 'Email', 'LinkedIn', 'Instagram', 'Twitter/X'],
    businessEtiquette: [
      'English widely used in business',
      'Formal dress expected',
      'Personal relationships important',
      'Hospitality highly valued',
      'Avoid scheduling during prayer times',
      'Government dealings may require Arabic',
      'Post-World Cup infrastructure excellent for business'
    ],
    formalityLevel: 'medium',
    responseTimeExpectation: 'Within 24-48 hours'
  },

  businessCulture: [
    'Post-World Cup 2022 infrastructure world-class',
    'Qatar Financial Centre offers international regulatory framework',
    'Small market but high per-capita wealth',
    'Government-linked entities dominate economy',
    'Strong focus on education and research (Education City)',
    'LNG industry drives economy',
    'Sports and events sector growing',
    'Diverse expatriate workforce',
    'National Sports Day reflects health focus',
    'Al Jazeera Media Network based here'
  ],

  keyCities: ['Doha', 'Al Wakrah', 'Al Khor', 'Lusail'],

  freeZones: [
    'Qatar Financial Centre (QFC)',
    'Qatar Science & Technology Park',
    'Qatar Free Zone Authority (Ras Bufontas)',
    'Qatar Free Zone Authority (Um Alhoul)'
  ],

  nationalVision: {
    name: 'Qatar National Vision 2030',
    targetYear: 2030,
    keyPillars: [
      'Human development',
      'Social development',
      'Economic development',
      'Environmental development'
    ]
  }
};

// ============================================================================
// BAHRAIN CONTEXT
// ============================================================================

/**
 * Bahrain country context
 */
const BAHRAIN_CONTEXT: GCCCountryContext = {
  name: 'Bahrain',
  nameAr: 'البحرين',
  code: 'BH',
  phonePrefix: '+973',

  currency: {
    code: 'BHD',
    symbol: 'د.ب',
    name: 'Bahraini Dinar',
    subunit: 'Fils',
    subunitRatio: 1000
  },

  workWeek: {
    start: 'Sunday',
    end: 'Thursday',
    weekendDays: ['Friday', 'Saturday'],
    workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  },

  businessHours: {
    start: '08:00',
    end: '17:00',
    splitShift: false,
    ramadanHours: {
      start: '09:00',
      end: '14:00'
    }
  },

  timezone: 'Asia/Bahrain',
  utcOffset: 3,

  language: {
    official: ['Arabic'],
    business: 'English',
    common: ['English', 'Hindi', 'Urdu', 'Tagalog', 'Malayalam']
  },

  holidays: {
    islamic: [...COMMON_ISLAMIC_HOLIDAYS],
    national: [
      {
        name: 'New Year\'s Day',
        nameAr: 'رأس السنة الميلادية',
        date: '01-01',
        duration: 1
      },
      {
        name: 'Labour Day',
        nameAr: 'عيد العمال',
        date: '05-01',
        duration: 1
      },
      {
        name: 'National Day',
        nameAr: 'اليوم الوطني',
        date: '12-16',
        duration: 2
      }
    ]
  },

  regulations: {
    labor: {
      primaryLaw: 'Labor Law No. 36 of 2012',
      year: 2012,
      keyProvisions: [
        'Maximum 8 working hours per day',
        '48 hours maximum per week',
        'Reduced hours during Ramadan (6 hours)',
        'Minimum 30 days annual leave',
        'End of service indemnity mandatory',
        'Bahrainization policy for private sector',
        'Flexible work permits (Flexi permit system)'
      ],
      nationalizationPolicy: 'Bahrainization',
      workingHoursLimit: {
        daily: 8,
        weekly: 48,
        ramadanReduction: 2
      }
    },
    commercial: {
      companiesLaw: 'Commercial Companies Law No. 21 of 2001',
      foreignOwnership: {
        maxPercentage: 100,
        exceptions: ['Some professional activities', 'Real estate limitations'],
        freeZones: [
          'Bahrain International Investment Park',
          'Bahrain Logistics Zone',
          'Bahrain Financial Harbour'
        ]
      },
      registrationAuthority: 'Ministry of Industry, Commerce and Tourism',
      licenseTypes: ['Commercial', 'Professional', 'Industrial', 'Tourism', 'Educational']
    },
    tax: {
      vat: 10,
      vatEffectiveDate: '2022-01-01',
      incomeTax: 0,
      corporateTax: 0,
      notes: 'No corporate or income tax. VAT at 10% (increased from 5% in 2022). Financial sector may have different rules.'
    },
    dataProtection: {
      name: 'Personal Data Protection Law No. 30 of 2018',
      year: 2018,
      authority: 'Ministry of Justice',
      requirements: [
        'Data processing requires legal basis',
        'Data subject consent or legitimate interest',
        'Rights to access, rectification, deletion',
        'Cross-border transfer restrictions',
        'Data breach notification required',
        'Registration with data protection authority'
      ]
    }
  },

  payment: {
    dominantMethods: ['Benefit Pay', 'Credit/Debit Cards', 'Bank Transfer', 'Cash'],
    localGateway: {
      name: 'Benefit',
      code: 'BENEFIT',
      website: 'https://www.benefit.bh'
    },
    mobilePayments: ['BenefitPay', 'Apple Pay', 'Samsung Pay', 'Batelco Pay'],
    internationalCardsAcceptance: 'high',
    cashUsage: 'low',
    bankTransferSystems: ['EFTS', 'SWIFT', 'IBAN', 'Fawri+']
  },

  communication: {
    preferredPlatforms: ['WhatsApp', 'Email', 'LinkedIn', 'Instagram', 'Twitter/X'],
    businessEtiquette: [
      'English widely used in business',
      'Less formal than Saudi Arabia',
      'Financial sector highly professional',
      'Building personal relationships valued',
      'Respect for Islamic customs expected',
      'Business lunches common',
      'Formula 1 race weekend important for networking'
    ],
    formalityLevel: 'medium',
    responseTimeExpectation: 'Within 24 hours for business communications'
  },

  businessCulture: [
    'Regional financial hub - many regional HQs based here',
    'Most liberal social environment in GCC',
    'Strong fintech and banking sector',
    'Connected to Saudi Arabia via causeway',
    'Diverse and tolerant business environment',
    'Startup ecosystem supported by government',
    'Formula 1 brings international business visitors',
    'Education hub with international universities',
    'Tourism sector growing',
    'Aluminum and oil industries significant'
  ],

  keyCities: ['Manama', 'Riffa', 'Muharraq', 'Isa Town'],

  freeZones: [
    'Bahrain International Investment Park',
    'Bahrain Logistics Zone',
    'Bahrain Financial Harbour'
  ],

  nationalVision: {
    name: 'Bahrain Economic Vision 2030',
    targetYear: 2030,
    keyPillars: [
      'Sustainable economy',
      'Fair society',
      'Competitive government'
    ]
  }
};

// ============================================================================
// OMAN CONTEXT
// ============================================================================

/**
 * Oman country context
 */
const OMAN_CONTEXT: GCCCountryContext = {
  name: 'Oman',
  nameAr: 'عُمان',
  code: 'OM',
  phonePrefix: '+968',

  currency: {
    code: 'OMR',
    symbol: 'ر.ع.',
    name: 'Omani Rial',
    subunit: 'Baisa',
    subunitRatio: 1000
  },

  workWeek: {
    start: 'Sunday',
    end: 'Thursday',
    weekendDays: ['Friday', 'Saturday'],
    workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  },

  businessHours: {
    start: '08:00',
    end: '16:00',
    splitShift: true,
    morningEnd: '13:00',
    eveningStart: '16:00',
    ramadanHours: {
      start: '09:00',
      end: '14:00'
    }
  },

  timezone: 'Asia/Muscat',
  utcOffset: 4,

  language: {
    official: ['Arabic'],
    business: 'Arabic',
    common: ['English', 'Baluchi', 'Urdu', 'Hindi', 'Swahili']
  },

  holidays: {
    islamic: [...COMMON_ISLAMIC_HOLIDAYS],
    national: [
      {
        name: 'New Year\'s Day',
        nameAr: 'رأس السنة الميلادية',
        date: '01-01',
        duration: 1
      },
      {
        name: 'Renaissance Day',
        nameAr: 'يوم النهضة',
        date: '07-23',
        duration: 1
      },
      {
        name: 'National Day',
        nameAr: 'اليوم الوطني',
        date: '11-18',
        duration: 2
      }
    ]
  },

  regulations: {
    labor: {
      primaryLaw: 'Labor Law (Royal Decree No. 35/2003)',
      year: 2003,
      keyProvisions: [
        'Maximum 9 working hours per day',
        '45 hours maximum per week',
        'Reduced hours during Ramadan (6 hours)',
        'Minimum 30 days annual leave',
        'End of service gratuity mandatory',
        'Omanization quotas strictly enforced',
        'Minimum wage for Omanis'
      ],
      nationalizationPolicy: 'Omanization',
      minimumWage: {
        amount: 325,
        currency: 'OMR',
        applicableTo: 'Omani nationals'
      },
      workingHoursLimit: {
        daily: 9,
        weekly: 45,
        ramadanReduction: 3
      }
    },
    commercial: {
      companiesLaw: 'Commercial Companies Law (Royal Decree No. 18/2019)',
      foreignOwnership: {
        maxPercentage: 100,
        exceptions: ['Some sectors require Omani partner', 'Real estate restrictions'],
        freeZones: [
          'Sohar Free Zone',
          'Salalah Free Zone',
          'Duqm Special Economic Zone',
          'Al Mazunah Free Zone'
        ]
      },
      registrationAuthority: 'Ministry of Commerce, Industry and Investment Promotion',
      licenseTypes: ['Commercial', 'Industrial', 'Professional', 'Services', 'Tourism']
    },
    tax: {
      vat: 5,
      vatEffectiveDate: '2021-04-16',
      incomeTax: 0,
      corporateTax: 15,
      notes: 'Corporate tax at 15% (standard rate). Small businesses may qualify for reduced rate. No personal income tax. Free zones offer tax incentives.'
    },
    dataProtection: {
      name: 'No comprehensive data protection law (as of 2024)',
      authority: 'Information Technology Authority (ITA)',
      requirements: [
        'Sectoral regulations apply',
        'Telecom sector has data protection rules',
        'Banking sector has confidentiality requirements',
        'Cybercrime law addresses some data issues',
        'Draft Personal Data Protection Law in progress'
      ]
    }
  },

  payment: {
    dominantMethods: ['Cash', 'Credit/Debit Cards', 'Bank Transfer', 'Thawani'],
    localGateway: {
      name: 'Thawani',
      code: 'THAWANI',
      website: 'https://thawani.om'
    },
    mobilePayments: ['Thawani', 'Apple Pay', 'Samsung Pay', 'Ooredoo Pay'],
    internationalCardsAcceptance: 'medium',
    cashUsage: 'high',
    bankTransferSystems: ['ACH', 'SWIFT', 'IBAN']
  },

  communication: {
    preferredPlatforms: ['WhatsApp', 'Email', 'Instagram', 'Twitter/X', 'Snapchat'],
    businessEtiquette: [
      'Arabic important for government dealings',
      'English acceptable in business',
      'Conservative dress expected',
      'Hospitality very important',
      'Patience essential - slower pace than UAE',
      'Relationships prioritized over quick deals',
      'Respect for tradition and hierarchy',
      'Avoid scheduling during prayer times and siesta'
    ],
    formalityLevel: 'high',
    responseTimeExpectation: 'Within 48-72 hours, government may be slower'
  },

  businessCulture: [
    'Conservative and traditional business environment',
    'Omanization policy significantly affects hiring',
    'Government is major economic driver',
    'Tourism sector growing (eco-tourism focus)',
    'Duqm Special Economic Zone offers major opportunities',
    'Port and logistics sector important',
    'Strong focus on local partnerships',
    'Slower pace than other GCC countries',
    'Craftsmanship and quality valued',
    'Wadis and nature important for well-being culture'
  ],

  keyCities: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Duqm'],

  freeZones: [
    'Sohar Free Zone',
    'Salalah Free Zone',
    'Duqm Special Economic Zone (SEZ)',
    'Al Mazunah Free Zone',
    'Knowledge Oasis Muscat'
  ],

  nationalVision: {
    name: 'Oman Vision 2040',
    targetYear: 2040,
    keyPillars: [
      'Human and social development',
      'Economic diversification',
      'Governance and institutional performance',
      'Environmental sustainability'
    ]
  }
};

// ============================================================================
// GCC COUNTRIES REGISTRY
// ============================================================================

/**
 * Map of all GCC countries by their ISO 3166-1 alpha-2 code
 */
const GCC_COUNTRIES: Record<string, GCCCountryContext> = {
  KW: KUWAIT_CONTEXT,
  AE: UAE_CONTEXT,
  SA: SAUDI_CONTEXT,
  QA: QATAR_CONTEXT,
  BH: BAHRAIN_CONTEXT,
  OM: OMAN_CONTEXT
};

/**
 * List of all GCC country codes
 */
export const GCC_COUNTRY_CODES = ['KW', 'AE', 'SA', 'QA', 'BH', 'OM'] as const;

/**
 * Type for GCC country codes
 */
export type GCCCountryCode = typeof GCC_COUNTRY_CODES[number];

// ============================================================================
// PRIMARY HELPER FUNCTIONS
// ============================================================================

/**
 * Get the complete context for a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., 'KW', 'AE')
 * @returns Complete country context
 * @throws Error if country code is not a valid GCC country
 *
 * @example
 * const kuwait = getGCCContext('KW');
 * console.log(kuwait.currency.code); // 'KWD'
 */
export function getGCCContext(countryCode: string): GCCCountryContext {
  const code = countryCode.toUpperCase();
  const context = GCC_COUNTRIES[code];

  if (!context) {
    throw new Error(
      `Invalid GCC country code: ${countryCode}. Valid codes: ${GCC_COUNTRY_CODES.join(', ')}`
    );
  }

  return context;
}

/**
 * Get work week configuration for a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Work week configuration
 *
 * @example
 * const workWeek = getGCCWorkWeek('AE');
 * console.log(workWeek.start); // 'Monday' (UAE changed in 2022)
 */
export function getGCCWorkWeek(countryCode: string): WorkWeekInfo {
  const context = getGCCContext(countryCode);
  return context.workWeek;
}

/**
 * Get business hours for a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Business hours configuration
 *
 * @example
 * const hours = getGCCBusinessHours('SA');
 * console.log(hours.splitShift); // true
 */
export function getGCCBusinessHours(countryCode: string): BusinessHours {
  const context = getGCCContext(countryCode);
  return context.businessHours;
}

/**
 * Get VAT rate for a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns VAT rate as percentage (e.g., 5, 10, 15)
 *
 * @example
 * const vatRate = getGCCVATRate('SA');
 * console.log(vatRate); // 15
 */
export function getGCCVATRate(countryCode: string): number {
  const context = getGCCContext(countryCode);
  return context.regulations.tax.vat;
}

/**
 * Get holidays for a GCC country in a specific year
 *
 * Note: Islamic holidays are approximated based on the Hijri calendar.
 * Actual dates may vary by 1-2 days based on moon sighting.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param year - Calendar year
 * @returns Array of holidays with actual dates
 *
 * @example
 * const holidays = getGCCHolidays('KW', 2024);
 */
export function getGCCHolidays(countryCode: string, year: number): Holiday[] {
  const context = getGCCContext(countryCode);
  const holidays: Holiday[] = [];

  // Add national holidays
  for (const national of context.holidays.national) {
    // Handle special date formats
    if (national.date.includes('second-tuesday')) {
      // Qatar's National Sports Day - second Tuesday of February
      const secondTuesday = getNthWeekdayOfMonth(year, 1, 2, 2); // Feb, Tuesday, 2nd
      holidays.push({
        name: national.name,
        nameAr: national.nameAr,
        startDate: secondTuesday,
        endDate: secondTuesday,
        type: 'national'
      });
    } else {
      const [month, day] = national.date.split('-').map(Number);
      const startDate = new Date(year, month - 1, day);
      const endDate = new Date(year, month - 1, day + national.duration - 1);

      holidays.push({
        name: national.name,
        nameAr: national.nameAr,
        startDate,
        endDate,
        type: 'national'
      });
    }
  }

  // Add Islamic holidays (approximate dates)
  // These are estimates and should be verified with actual Hijri calendar
  const islamicHolidayDates = getApproximateIslamicHolidayDates(year);

  for (const islamic of context.holidays.islamic) {
    const dates = islamicHolidayDates[islamic.name];
    if (dates) {
      holidays.push({
        name: islamic.name,
        nameAr: islamic.nameAr,
        startDate: dates.start,
        endDate: new Date(dates.start.getTime() + (islamic.duration - 1) * 24 * 60 * 60 * 1000),
        type: 'islamic'
      });
    }
  }

  // Sort by date
  holidays.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return holidays;
}

/**
 * Check if a given date is a business day in a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param date - Date to check
 * @returns True if it's a business day
 *
 * @example
 * const isWorkDay = isGCCBusinessDay('KW', new Date('2024-01-05')); // Friday
 * console.log(isWorkDay); // false (Friday is weekend in Kuwait)
 */
export function isGCCBusinessDay(countryCode: string, date: Date): boolean {
  const context = getGCCContext(countryCode);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[date.getDay()];

  // Check if it's a weekend day
  if (context.workWeek.weekendDays.includes(dayName)) {
    return false;
  }

  // Check if it's a holiday
  const year = date.getFullYear();
  const holidays = getGCCHolidays(countryCode, year);

  for (const holiday of holidays) {
    if (date >= holiday.startDate && date <= holiday.endDate) {
      return false;
    }
  }

  return true;
}

/**
 * Get the next business day in a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param date - Starting date
 * @returns Next business day
 *
 * @example
 * const nextDay = getNextGCCBusinessDay('KW', new Date('2024-01-04')); // Thursday
 * // Returns Sunday (skipping Friday and Saturday)
 */
export function getNextGCCBusinessDay(countryCode: string, date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  // Keep incrementing until we find a business day (max 14 days to avoid infinite loop)
  let attempts = 0;
  while (!isGCCBusinessDay(countryCode, nextDay) && attempts < 14) {
    nextDay.setDate(nextDay.getDate() + 1);
    attempts++;
  }

  return nextDay;
}

// ============================================================================
// CROSS-GCC UTILITY FUNCTIONS
// ============================================================================

/**
 * Currency exchange rates (approximate, for demonstration)
 * In production, these should be fetched from a real-time API
 */
const CURRENCY_RATES_TO_USD: Record<string, number> = {
  KWD: 3.26,   // Kuwaiti Dinar to USD
  AED: 0.27,   // UAE Dirham to USD
  SAR: 0.27,   // Saudi Riyal to USD
  QAR: 0.27,   // Qatari Riyal to USD
  BHD: 2.65,   // Bahraini Dinar to USD
  OMR: 2.60    // Omani Rial to USD
};

/**
 * Convert amount between GCC currencies
 *
 * Note: Uses approximate rates. In production, use a real-time exchange rate API.
 *
 * @param amount - Amount to convert
 * @param fromCode - Source country code
 * @param toCode - Target country code
 * @returns Converted amount
 *
 * @example
 * const aedAmount = convertGCCCurrency(100, 'KW', 'AE');
 * // Converts 100 KWD to AED
 */
export function convertGCCCurrency(amount: number, fromCode: string, toCode: string): number {
  const fromContext = getGCCContext(fromCode);
  const toContext = getGCCContext(toCode);

  const fromCurrency = fromContext.currency.code;
  const toCurrency = toContext.currency.code;

  // Same currency
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to USD first, then to target currency
  const fromRate = CURRENCY_RATES_TO_USD[fromCurrency];
  const toRate = CURRENCY_RATES_TO_USD[toCurrency];

  if (!fromRate || !toRate) {
    throw new Error(`Currency conversion rate not available for ${fromCurrency} or ${toCurrency}`);
  }

  const usdAmount = amount * fromRate;
  const convertedAmount = usdAmount / toRate;

  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
}

/**
 * Get UTC timezone offset for a GCC country in hours
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns UTC offset in hours (e.g., 3 for Kuwait, 4 for UAE)
 *
 * @example
 * const offset = getGCCTimezoneOffset('AE');
 * console.log(offset); // 4 (UTC+4)
 */
export function getGCCTimezoneOffset(countryCode: string): number {
  const context = getGCCContext(countryCode);
  return context.utcOffset;
}

/**
 * Format a date according to GCC country conventions
 *
 * @param date - Date to format
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param options - Optional Intl.DateTimeFormat options
 * @returns Formatted date string
 *
 * @example
 * const formatted = formatGCCDate(new Date(), 'SA');
 * // Returns date in Arabic format for Saudi Arabia
 */
export function formatGCCDate(
  date: Date,
  countryCode: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const context = getGCCContext(countryCode);

  // Determine locale based on country
  const localeMap: Record<string, string> = {
    KW: 'ar-KW',
    AE: 'ar-AE',
    SA: 'ar-SA',
    QA: 'ar-QA',
    BH: 'ar-BH',
    OM: 'ar-OM'
  };

  const locale = localeMap[countryCode.toUpperCase()] || 'ar';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: context.timezone
  };

  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
}

/**
 * Get the international phone prefix for a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Phone prefix (e.g., '+965' for Kuwait)
 *
 * @example
 * const prefix = getGCCPhonePrefix('KW');
 * console.log(prefix); // '+965'
 */
export function getGCCPhonePrefix(countryCode: string): string {
  const context = getGCCContext(countryCode);
  return context.phonePrefix;
}

// ============================================================================
// ADDITIONAL UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all GCC countries
 *
 * @returns Array of all GCC country contexts
 */
export function getAllGCCCountries(): GCCCountryContext[] {
  return Object.values(GCC_COUNTRIES);
}

/**
 * Get GCC country by name (case-insensitive)
 *
 * @param name - Country name in English or Arabic
 * @returns Country context or undefined if not found
 */
export function getGCCCountryByName(name: string): GCCCountryContext | undefined {
  const normalizedName = name.toLowerCase().trim();

  return Object.values(GCC_COUNTRIES).find(
    country =>
      country.name.toLowerCase() === normalizedName ||
      country.nameAr === name
  );
}

/**
 * Check if a country code belongs to a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns True if the country is a GCC member
 */
export function isGCCCountry(countryCode: string): boolean {
  return countryCode.toUpperCase() in GCC_COUNTRIES;
}

/**
 * Get free zones for a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Array of free zone names or empty array
 */
export function getGCCFreeZones(countryCode: string): string[] {
  const context = getGCCContext(countryCode);
  return context.freeZones || context.regulations.commercial.foreignOwnership.freeZones || [];
}

/**
 * Get nationalization policy for a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Nationalization policy name or undefined
 */
export function getGCCNationalizationPolicy(countryCode: string): string | undefined {
  const context = getGCCContext(countryCode);
  return context.regulations.labor.nationalizationPolicy;
}

/**
 * Get preferred communication platforms for a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Array of platform names in order of popularity
 */
export function getGCCCommunicationPlatforms(countryCode: string): string[] {
  const context = getGCCContext(countryCode);
  return context.communication.preferredPlatforms;
}

/**
 * Get dominant payment methods for a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Array of payment method names in order of popularity
 */
export function getGCCPaymentMethods(countryCode: string): string[] {
  const context = getGCCContext(countryCode);
  return context.payment.dominantMethods;
}

/**
 * Check if current time is within business hours for a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param isRamadan - Whether it's currently Ramadan
 * @returns True if within business hours
 */
export function isGCCBusinessHours(countryCode: string, isRamadan: boolean = false): boolean {
  const context = getGCCContext(countryCode);
  const hours = isRamadan && context.businessHours.ramadanHours
    ? context.businessHours.ramadanHours
    : context.businessHours;

  // Get current time in country's timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: context.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const timeStr = formatter.format(now);
  const [currentHour, currentMinute] = timeStr.split(':').map(Number);
  const currentMinutes = currentHour * 60 + currentMinute;

  const [startHour, startMinute] = hours.start.split(':').map(Number);
  const [endHour, endMinute] = hours.end.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Get business etiquette tips for a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Array of etiquette tips
 */
export function getGCCBusinessEtiquette(countryCode: string): string[] {
  const context = getGCCContext(countryCode);
  return context.communication.businessEtiquette;
}

/**
 * Get national vision details for a GCC country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns National vision details or undefined
 */
export function getGCCNationalVision(countryCode: string): GCCCountryContext['nationalVision'] {
  const context = getGCCContext(countryCode);
  return context.nationalVision;
}

/**
 * Compare two GCC countries
 *
 * @param code1 - First country code
 * @param code2 - Second country code
 * @returns Comparison object with key differences
 */
export function compareGCCCountries(code1: string, code2: string): {
  country1: string;
  country2: string;
  vatDifference: number;
  sameWorkWeek: boolean;
  timezoneOffset: number;
  workWeekDifference: string[];
} {
  const context1 = getGCCContext(code1);
  const context2 = getGCCContext(code2);

  return {
    country1: context1.name,
    country2: context2.name,
    vatDifference: context2.regulations.tax.vat - context1.regulations.tax.vat,
    sameWorkWeek: context1.workWeek.start === context2.workWeek.start,
    timezoneOffset: context2.utcOffset - context1.utcOffset,
    workWeekDifference: context1.workWeek.start !== context2.workWeek.start
      ? [`${context1.name}: ${context1.workWeek.start}-${context1.workWeek.end}`,
         `${context2.name}: ${context2.workWeek.start}-${context2.workWeek.end}`]
      : []
  };
}

// ============================================================================
// INTERNAL HELPER FUNCTIONS
// ============================================================================

/**
 * Get the nth occurrence of a weekday in a month
 *
 * @param year - Year
 * @param month - Month (0-indexed)
 * @param weekday - Weekday (0 = Sunday, 1 = Monday, etc.)
 * @param n - Which occurrence (1 = first, 2 = second, etc.)
 * @returns Date of the nth weekday
 */
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();

  let dayOffset = weekday - firstWeekday;
  if (dayOffset < 0) {
    dayOffset += 7;
  }

  const day = 1 + dayOffset + (n - 1) * 7;
  return new Date(year, month, day);
}

/**
 * Get approximate Islamic holiday dates for a given Gregorian year
 *
 * Note: These are approximations. Actual dates depend on moon sighting
 * and may vary by 1-2 days. In production, use a proper Hijri calendar API.
 *
 * @param year - Gregorian year
 * @returns Object mapping holiday names to approximate start dates
 */
function getApproximateIslamicHolidayDates(year: number): Record<string, { start: Date }> {
  // Islamic calendar shifts approximately 11 days earlier each Gregorian year
  // These are rough approximations for demonstration

  // Base dates for 2024 (approximate)
  const baseDates2024: Record<string, { month: number; day: number }> = {
    'Eid al-Fitr': { month: 4, day: 10 },
    'Eid al-Adha': { month: 6, day: 17 },
    'Islamic New Year': { month: 7, day: 8 },
    'Prophet\'s Birthday (Mawlid)': { month: 9, day: 16 },
    'Isra and Mi\'raj': { month: 2, day: 8 }
  };

  const yearDiff = year - 2024;
  const dayShift = yearDiff * -11; // Approximately 11 days earlier per year

  const result: Record<string, { start: Date }> = {};

  for (const [holiday, baseDate] of Object.entries(baseDates2024)) {
    const date = new Date(year, baseDate.month - 1, baseDate.day + dayShift);

    // Adjust if the shift moved to a different year
    while (date.getFullYear() !== year) {
      if (date.getFullYear() < year) {
        date.setDate(date.getDate() + 355); // Add approximate Islamic year
      } else {
        date.setDate(date.getDate() - 355);
      }
    }

    result[holiday] = { start: date };
  }

  return result;
}

// ============================================================================
// EXPORTS - INDIVIDUAL COUNTRY CONTEXTS
// ============================================================================

export {
  KUWAIT_CONTEXT,
  UAE_CONTEXT,
  SAUDI_CONTEXT,
  QATAR_CONTEXT,
  BAHRAIN_CONTEXT,
  OMAN_CONTEXT,
  COMMON_ISLAMIC_HOLIDAYS
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export providing the complete GCC context module
 */
export default {
  // Country contexts
  countries: GCC_COUNTRIES,
  countryCodes: GCC_COUNTRY_CODES,

  // Primary functions
  getContext: getGCCContext,
  getWorkWeek: getGCCWorkWeek,
  getBusinessHours: getGCCBusinessHours,
  getVATRate: getGCCVATRate,
  getHolidays: getGCCHolidays,
  isBusinessDay: isGCCBusinessDay,
  getNextBusinessDay: getNextGCCBusinessDay,

  // Cross-GCC utilities
  convertCurrency: convertGCCCurrency,
  getTimezoneOffset: getGCCTimezoneOffset,
  formatDate: formatGCCDate,
  getPhonePrefix: getGCCPhonePrefix,

  // Additional utilities
  getAllCountries: getAllGCCCountries,
  getCountryByName: getGCCCountryByName,
  isGCCCountry,
  getFreeZones: getGCCFreeZones,
  getNationalizationPolicy: getGCCNationalizationPolicy,
  getCommunicationPlatforms: getGCCCommunicationPlatforms,
  getPaymentMethods: getGCCPaymentMethods,
  isBusinessHours: isGCCBusinessHours,
  getBusinessEtiquette: getGCCBusinessEtiquette,
  getNationalVision: getGCCNationalVision,
  compareCountries: compareGCCCountries
};

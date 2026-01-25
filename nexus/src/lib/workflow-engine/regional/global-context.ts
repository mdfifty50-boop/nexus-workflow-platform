/**
 * @fileoverview MENA & Global Regional Context Module
 *
 * Provides comprehensive regional context for workflow automation across
 * Middle East & North Africa (MENA) and global regions. Includes business
 * culture, regulations, compliance requirements, and operational intelligence.
 *
 * @module workflow-engine/regional/global-context
 * @version 1.0.0
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Complete regional context including business, regulatory, and cultural information
 */
export interface RegionalContext {
  /** Region identifier (e.g., 'mena', 'gcc', 'eu', 'us') */
  region: string;
  /** Countries included in this regional context */
  countries: string[];
  /** Work week configuration */
  workWeek: {
    /** Standard work days (e.g., 'Sun-Thu', 'Mon-Fri') */
    standard: string;
    /** Country-specific variations */
    variations?: Record<string, string>;
  };
  /** Primary timezone(s) for the region */
  timezone: string | string[];
  /** Currency information */
  currency: {
    /** Primary currency code */
    primary: string;
    /** Alternative currencies accepted */
    alternatives?: string[];
  };
  /** Regulatory and compliance requirements */
  regulations: {
    /** Data protection laws (GDPR, CCPA, etc.) */
    dataProtection: string[];
    /** Compliance frameworks (SOC2, ISO27001, etc.) */
    compliance: string[];
    /** Labor law considerations */
    labor?: string;
  };
  /** Business culture characteristics */
  businessCulture: string[];
  /** Preferred communication styles */
  communicationStyle: string[];
  /** Holiday information */
  holidays: {
    /** Calendar type */
    type: 'islamic' | 'western' | 'mixed';
    /** Major holidays to consider */
    majorHolidays: string[];
  };
  /** Primary business language(s) */
  languages: string[];
  /** Payment methods commonly used */
  paymentMethods: string[];
}

/**
 * Currency information for a specific region
 */
export interface CurrencyInfo {
  /** ISO currency code */
  code: string;
  /** Currency symbol */
  symbol: string;
  /** Currency name */
  name: string;
  /** Decimal places used */
  decimals: number;
  /** Common exchange currencies */
  exchangeWith?: string[];
}

/**
 * Aggregated compliance requirements across multiple regions
 */
export interface ComplianceRequirements {
  /** All applicable data protection regulations */
  dataProtection: string[];
  /** All applicable compliance frameworks */
  frameworks: string[];
  /** Specific requirements by region */
  byRegion: Record<string, string[]>;
  /** Priority level for each requirement */
  priorities: Record<string, 'critical' | 'high' | 'medium' | 'low'>;
}

/**
 * Regional intelligence for workflow optimization
 */
export interface RegionalIntelligence {
  /** Region identifier */
  region: string;
  /** Get implicit requirements based on category */
  getImplicitRequirements(category: string): string[];
  /** Get tool recommendations for a category */
  getToolRecommendations(category: string): string[];
  /** Get compliance checklist for the region */
  getComplianceChecklist(): string[];
  /** Get localization requirements */
  getLocalizationRequirements(): string[];
}

/**
 * Holiday definition
 */
export interface Holiday {
  /** Holiday name */
  name: string;
  /** Date or date pattern (e.g., 'variable' for Islamic holidays) */
  date: string;
  /** Whether it's a public holiday */
  isPublic: boolean;
  /** Countries where this holiday applies */
  countries?: string[];
}

/**
 * Business hours configuration
 */
export interface BusinessHours {
  /** Opening time (24h format) */
  open: string;
  /** Closing time (24h format) */
  close: string;
  /** Lunch break if applicable */
  lunchBreak?: { start: string; end: string };
  /** Friday hours (relevant for MENA) */
  fridayHours?: { open: string; close: string } | 'closed';
}

// ============================================================================
// MENA REGIONAL CONTEXTS
// ============================================================================

/**
 * Egypt regional context
 */
export const EGYPT_CONTEXT: RegionalContext = {
  region: 'mena',
  countries: ['EG'],
  workWeek: {
    standard: 'Sun-Thu',
    variations: {
      'some-private': 'Sat-Thu',
      'banks': 'Sun-Thu',
      'government': 'Sun-Thu',
    },
  },
  timezone: 'Africa/Cairo',
  currency: {
    primary: 'EGP',
    alternatives: ['USD', 'EUR'],
  },
  regulations: {
    dataProtection: ['Egypt Personal Data Protection Law (Law No. 151/2020)'],
    compliance: ['Central Bank of Egypt Regulations', 'NTRA Compliance'],
    labor: 'Egyptian Labor Law No. 12 of 2003',
  },
  businessCulture: [
    'Relationship-building essential before business',
    'Hierarchical decision-making',
    'Face-to-face meetings valued',
    'Patience in negotiations expected',
    'Titles and formality important',
    'Extended negotiation periods common',
    'Business cards exchanged formally',
  ],
  communicationStyle: [
    'High context communication',
    'Indirect disagreement preferred',
    'Arabic (Egyptian dialect) primary',
    'English widely used in business',
    'Formal greetings important',
    'Written confirmations expected',
  ],
  holidays: {
    type: 'mixed',
    majorHolidays: [
      'Revolution Day (January 25)',
      'Sinai Liberation Day (April 25)',
      'Labour Day (May 1)',
      'Revolution Day (July 23)',
      'Armed Forces Day (October 6)',
      'Eid al-Fitr (variable)',
      'Eid al-Adha (variable)',
      'Islamic New Year (variable)',
      'Prophet Birthday (variable)',
      'Coptic Christmas (January 7)',
      'Sham el-Nessim (variable)',
    ],
  },
  languages: ['Arabic (Egyptian)', 'English'],
  paymentMethods: [
    'Bank transfers',
    'Cash',
    'Mobile wallets (Vodafone Cash, Orange Money)',
    'Meeza cards',
    'Credit cards (limited)',
    'InstaPay',
  ],
};

/**
 * Jordan regional context
 */
export const JORDAN_CONTEXT: RegionalContext = {
  region: 'mena',
  countries: ['JO'],
  workWeek: {
    standard: 'Sun-Thu',
    variations: {
      'some-retail': 'Sat-Thu',
    },
  },
  timezone: 'Asia/Amman',
  currency: {
    primary: 'JOD',
    alternatives: ['USD', 'EUR'],
  },
  regulations: {
    dataProtection: ['Draft Personal Data Protection Law (pending)'],
    compliance: ['Central Bank of Jordan Regulations', 'TRC Compliance'],
    labor: 'Jordanian Labor Law No. 8 of 1996',
  },
  businessCulture: [
    'Strong family business traditions',
    'Relationship-focused negotiations',
    'Hospitality integral to business',
    'Conservative business dress',
    'GCC trade ties important',
    'Royal initiatives influential',
    'Qualified Industrial Zones (QIZ) with US',
  ],
  communicationStyle: [
    'Arabic (Levantine dialect) primary',
    'English common in business',
    'Formal introductions valued',
    'Patience in discussions',
    'Written and verbal confirmations',
    'Respectful disagreement',
  ],
  holidays: {
    type: 'mixed',
    majorHolidays: [
      'New Year (January 1)',
      'Labour Day (May 1)',
      'Independence Day (May 25)',
      'Army Day (June 10)',
      'King Abdullah Accession (June 9)',
      'King Hussein Remembrance Day (November 14)',
      'Eid al-Fitr (variable)',
      'Eid al-Adha (variable)',
      'Islamic New Year (variable)',
      'Prophet Birthday (variable)',
      'Christmas (December 25)',
    ],
  },
  languages: ['Arabic (Levantine)', 'English'],
  paymentMethods: [
    'Bank transfers',
    'eFAWATEERcom',
    'Mobile wallets',
    'Credit cards',
    'Cash',
    'JoMoPay',
  ],
};

/**
 * Lebanon regional context
 */
export const LEBANON_CONTEXT: RegionalContext = {
  region: 'mena',
  countries: ['LB'],
  workWeek: {
    standard: 'Mon-Fri',
    variations: {
      'some-businesses': 'Mon-Sat (half-day Sat)',
      'banks': 'Mon-Fri (limited operations)',
    },
  },
  timezone: 'Asia/Beirut',
  currency: {
    primary: 'LBP',
    alternatives: ['USD', 'EUR', 'Fresh USD'],
  },
  regulations: {
    dataProtection: ['Law No. 81 on Electronic Transactions and Personal Data'],
    compliance: ['Banking Secrecy Law (modified)', 'Central Bank Circulars'],
    labor: 'Lebanese Labor Law of 1946',
  },
  businessCulture: [
    'Trilingual business environment',
    'Strong entrepreneurial spirit',
    'Diaspora connections valuable',
    'Adaptability highly valued',
    'Complex banking situation awareness',
    'Creative problem-solving culture',
    'Service sector focus',
  ],
  communicationStyle: [
    'French/Arabic/English trilingual',
    'Direct communication accepted',
    'Flexible meeting schedules',
    'WhatsApp widely used',
    'Personal relationships important',
    'Informal business networking common',
  ],
  holidays: {
    type: 'mixed',
    majorHolidays: [
      'New Year (January 1)',
      'Armenian Christmas (January 6)',
      'St. Maroun Day (February 9)',
      'Good Friday (variable)',
      'Easter Monday (variable)',
      'Labour Day (May 1)',
      'Martyrs Day (May 6)',
      'Liberation Day (May 25)',
      'Assumption Day (August 15)',
      'Independence Day (November 22)',
      'Christmas (December 25)',
      'Eid al-Fitr (variable)',
      'Eid al-Adha (variable)',
      'Ashura (variable)',
    ],
  },
  languages: ['Arabic (Lebanese)', 'French', 'English'],
  paymentMethods: [
    'Fresh USD cash',
    'Bank transfers (limited)',
    'Credit cards (international)',
    'Mobile payments',
    'Lira cash (domestic)',
    'Cryptocurrency (growing)',
  ],
};

/**
 * Morocco regional context
 */
export const MOROCCO_CONTEXT: RegionalContext = {
  region: 'mena',
  countries: ['MA'],
  workWeek: {
    standard: 'Mon-Fri',
    variations: {
      'public-sector': 'Mon-Fri (some Sat mornings)',
      'retail': 'Mon-Sat',
    },
  },
  timezone: 'Africa/Casablanca',
  currency: {
    primary: 'MAD',
    alternatives: ['EUR', 'USD'],
  },
  regulations: {
    dataProtection: ['Law 09-08 on Personal Data Protection'],
    compliance: ['CNDP (National Commission for Data Protection)', 'Bank Al-Maghrib Regulations'],
    labor: 'Moroccan Labor Code of 2004',
  },
  businessCulture: [
    'French-influenced business practices',
    'Strong trade ties with EU',
    'Growing tech sector (Casablanca)',
    'Free trade zones active',
    'Royal patronage significant',
    'Family businesses prominent',
    'Automotive/aerospace industries growing',
  ],
  communicationStyle: [
    'French primary in business',
    'Arabic (Darija) local',
    'English growing in tech',
    'Formal business correspondence',
    'Relationship building valued',
    'Punctuality improving',
  ],
  holidays: {
    type: 'mixed',
    majorHolidays: [
      'New Year (January 1)',
      'Independence Manifesto Day (January 11)',
      'Labour Day (May 1)',
      'Throne Day (July 30)',
      'Allegiance Day (August 14)',
      'Revolution Day (August 20)',
      'Youth Day (August 21)',
      'Green March Day (November 6)',
      'Independence Day (November 18)',
      'Eid al-Fitr (variable)',
      'Eid al-Adha (variable)',
      'Islamic New Year (variable)',
      'Prophet Birthday (variable)',
    ],
  },
  languages: ['Arabic (Darija)', 'French', 'English', 'Amazigh'],
  paymentMethods: [
    'Bank transfers',
    'Cards (CMI network)',
    'Mobile payments (M-Wallet)',
    'Cash',
    'Interbank payments',
    'PayPal (limited)',
  ],
};

/**
 * Tunisia regional context
 */
export const TUNISIA_CONTEXT: RegionalContext = {
  region: 'mena',
  countries: ['TN'],
  workWeek: {
    standard: 'Mon-Fri',
    variations: {
      'summer': 'Mon-Fri (reduced hours)',
      'ramadan': 'Reduced hours',
    },
  },
  timezone: 'Africa/Tunis',
  currency: {
    primary: 'TND',
    alternatives: ['EUR', 'USD'],
  },
  regulations: {
    dataProtection: ['Organic Law No. 2004-63 on Personal Data Protection'],
    compliance: ['INPDP (National Authority)', 'Central Bank of Tunisia Regulations'],
    labor: 'Tunisian Labor Code',
  },
  businessCulture: [
    'French-influenced business environment',
    'EU proximity advantages',
    'Strong textile and manufacturing',
    'Growing IT outsourcing sector',
    'Educated workforce',
    'Startup ecosystem developing',
    'Tourism sector significant',
  ],
  communicationStyle: [
    'French primary in business',
    'Arabic (Tunisian) local',
    'Formal correspondence expected',
    'Email widely used',
    'In-person meetings valued',
    'Relationship building important',
  ],
  holidays: {
    type: 'mixed',
    majorHolidays: [
      'New Year (January 1)',
      'Revolution Day (January 14)',
      'Independence Day (March 20)',
      'Martyrs Day (April 9)',
      'Labour Day (May 1)',
      'Republic Day (July 25)',
      'Women Day (August 13)',
      'Evacuation Day (October 15)',
      'Eid al-Fitr (variable)',
      'Eid al-Adha (variable)',
      'Islamic New Year (variable)',
      'Prophet Birthday (variable)',
    ],
  },
  languages: ['Arabic (Tunisian)', 'French', 'English'],
  paymentMethods: [
    'Bank transfers',
    'Postal checks',
    'Cards (local networks)',
    'Cash',
    'Mobile payments (D17)',
    'e-Dinar',
  ],
};

/**
 * Algeria regional context
 */
export const ALGERIA_CONTEXT: RegionalContext = {
  region: 'mena',
  countries: ['DZ'],
  workWeek: {
    standard: 'Sun-Thu',
    variations: {
      'private-sector': 'Some Sat-Wed or Mon-Fri',
    },
  },
  timezone: 'Africa/Algiers',
  currency: {
    primary: 'DZD',
    alternatives: ['EUR', 'USD'],
  },
  regulations: {
    dataProtection: ['Law No. 18-07 on Personal Data Protection'],
    compliance: ['ANPDP (National Authority)', 'Bank of Algeria Regulations'],
    labor: 'Law No. 90-11 on Labor Relations',
  },
  businessCulture: [
    'State involvement in economy significant',
    'Oil and gas sector dominant',
    'French colonial legacy in business',
    'Import/export regulations strict',
    'Local partnership often required',
    'Bureaucracy navigation essential',
    'Growing private sector',
  ],
  communicationStyle: [
    'French common in business',
    'Arabic (Algerian) primary',
    'Formal bureaucratic processes',
    'Written documentation important',
    'Personal connections valuable',
    'Patience with procedures required',
  ],
  holidays: {
    type: 'mixed',
    majorHolidays: [
      'New Year (January 1)',
      'Amazigh New Year (January 12)',
      'Labour Day (May 1)',
      'Independence Day (July 5)',
      'Revolution Day (November 1)',
      'Eid al-Fitr (variable)',
      'Eid al-Adha (variable)',
      'Islamic New Year (variable)',
      'Ashura (variable)',
      'Prophet Birthday (variable)',
    ],
  },
  languages: ['Arabic (Algerian)', 'French', 'Amazigh'],
  paymentMethods: [
    'Bank transfers',
    'CIB cards (local)',
    'Cash (predominant)',
    'Postal services',
    'Limited international cards',
    'BaridiMob',
  ],
};

/**
 * Iraq regional context
 */
export const IRAQ_CONTEXT: RegionalContext = {
  region: 'mena',
  countries: ['IQ'],
  workWeek: {
    standard: 'Sun-Thu',
    variations: {
      'kurdistan-region': 'Sat-Wed or Sun-Thu',
      'oil-sector': 'Varies by company',
    },
  },
  timezone: 'Asia/Baghdad',
  currency: {
    primary: 'IQD',
    alternatives: ['USD'],
  },
  regulations: {
    dataProtection: ['Limited formal data protection (developing)'],
    compliance: ['Central Bank of Iraq Regulations', 'Investment Law No. 13 of 2006'],
    labor: 'Iraqi Labor Law No. 37 of 2015',
  },
  businessCulture: [
    'Reconstruction economy opportunities',
    'Oil sector dominates',
    'Strong tribal business networks',
    'Kurdistan Region more developed',
    'Security considerations essential',
    'Government contracts significant',
    'Growing entrepreneurship',
  ],
  communicationStyle: [
    'Arabic (Iraqi) primary',
    'Kurdish in Kurdistan Region',
    'English in oil sector',
    'Relationship-based business',
    'In-person meetings preferred',
    'Trust building essential',
  ],
  holidays: {
    type: 'mixed',
    majorHolidays: [
      'New Year (January 1)',
      'Army Day (January 6)',
      'Kurdish Flag Day (Kurdistan, December 17)',
      'Nawruz (March 21)',
      'Labour Day (May 1)',
      'Republic Day (July 14)',
      'Eid al-Fitr (variable)',
      'Eid al-Adha (variable)',
      'Ashura (variable)',
      'Arbaeen (variable)',
      'Prophet Birthday (variable)',
    ],
  },
  languages: ['Arabic (Iraqi)', 'Kurdish (Sorani, Kurmanji)', 'English'],
  paymentMethods: [
    'Cash (USD and IQD)',
    'Bank transfers',
    'Mobile wallets (limited)',
    'International transfers',
    'Letters of credit',
    'Hawala (informal)',
  ],
};

// ============================================================================
// GLOBAL REGIONAL CONTEXTS
// ============================================================================

/**
 * United States regional context
 */
export const UNITED_STATES_CONTEXT: RegionalContext = {
  region: 'us',
  countries: ['US'],
  workWeek: {
    standard: 'Mon-Fri',
    variations: {
      'retail': 'Often includes weekends',
      'tech': 'Flexible hours common',
    },
  },
  timezone: [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
  ],
  currency: {
    primary: 'USD',
  },
  regulations: {
    dataProtection: [
      'CCPA (California Consumer Privacy Act)',
      'CPRA (California Privacy Rights Act)',
      'HIPAA (Health data)',
      'COPPA (Children data)',
      'GLBA (Financial data)',
      'State-specific laws (Virginia VCDPA, Colorado CPA, etc.)',
    ],
    compliance: [
      'SOC 2 Type II',
      'SOC 1',
      'HITRUST (Healthcare)',
      'PCI DSS (Payment)',
      'FedRAMP (Federal)',
      'NIST frameworks',
    ],
    labor: 'Fair Labor Standards Act (FLSA) + State laws',
  },
  businessCulture: [
    'Time is money mentality',
    'Direct communication valued',
    'Individual achievement recognized',
    'Contractual relationships',
    'Litigation-aware business practices',
    'Innovation and disruption valued',
    'Networking events common',
    'Quick decision-making expected',
  ],
  communicationStyle: [
    'Direct and explicit communication',
    'Email and scheduled calls',
    'Slack/Teams for collaboration',
    'Time-zone awareness across coasts',
    'Professional but informal tone',
    'Data-driven presentations',
  ],
  holidays: {
    type: 'western',
    majorHolidays: [
      'New Year Day (January 1)',
      'Martin Luther King Jr. Day (January, 3rd Monday)',
      'Presidents Day (February, 3rd Monday)',
      'Memorial Day (May, last Monday)',
      'Independence Day (July 4)',
      'Labor Day (September, 1st Monday)',
      'Columbus Day (October, 2nd Monday)',
      'Veterans Day (November 11)',
      'Thanksgiving (November, 4th Thursday)',
      'Christmas (December 25)',
    ],
  },
  languages: ['English', 'Spanish'],
  paymentMethods: [
    'Credit cards (Visa, Mastercard, Amex)',
    'ACH transfers',
    'Wire transfers',
    'Zelle',
    'Venmo',
    'PayPal',
    'Apple Pay',
    'Google Pay',
    'Checks (declining)',
  ],
};

/**
 * United Kingdom regional context
 */
export const UNITED_KINGDOM_CONTEXT: RegionalContext = {
  region: 'uk',
  countries: ['GB', 'UK'],
  workWeek: {
    standard: 'Mon-Fri',
    variations: {
      'retail': 'Often includes weekends',
      'finance-city': 'Long hours common',
    },
  },
  timezone: 'Europe/London',
  currency: {
    primary: 'GBP',
    alternatives: ['EUR', 'USD'],
  },
  regulations: {
    dataProtection: [
      'UK GDPR',
      'Data Protection Act 2018',
      'Privacy and Electronic Communications Regulations (PECR)',
      'Age Appropriate Design Code',
    ],
    compliance: [
      'ISO 27001',
      'Cyber Essentials',
      'Cyber Essentials Plus',
      'FCA Regulations (Financial)',
      'PCI DSS',
      'SOC 2',
    ],
    labor: 'Employment Rights Act 1996 + Working Time Regulations',
  },
  businessCulture: [
    'Punctuality highly valued',
    'Understated communication style',
    'Queueing and fair play culture',
    'Tea/coffee meetings common',
    'Pub culture for networking',
    'Reserved professionalism',
    'Self-deprecating humor acceptable',
    'Class awareness in business',
  ],
  communicationStyle: [
    'Polite and indirect',
    'British understatement',
    'Email formal but friendly',
    'Avoid overselling',
    'Reading between lines expected',
    'Apologetic phrasing common',
  ],
  holidays: {
    type: 'western',
    majorHolidays: [
      'New Year Day (January 1)',
      'Good Friday (variable)',
      'Easter Monday (variable)',
      'Early May Bank Holiday (May, 1st Monday)',
      'Spring Bank Holiday (May, last Monday)',
      'Summer Bank Holiday (August, last Monday)',
      'Christmas Day (December 25)',
      'Boxing Day (December 26)',
      'Scotland: St. Andrew Day (November 30)',
    ],
  },
  languages: ['English', 'Welsh (Wales)', 'Scottish Gaelic', 'Irish'],
  paymentMethods: [
    'Debit cards (dominant)',
    'Credit cards',
    'Bank transfers (Faster Payments)',
    'BACS',
    'CHAPS',
    'Direct Debit',
    'Apple Pay',
    'Google Pay',
    'Contactless payments',
    'Open Banking payments',
  ],
};

/**
 * European Union regional context
 */
export const EUROPEAN_UNION_CONTEXT: RegionalContext = {
  region: 'eu',
  countries: [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  ],
  workWeek: {
    standard: 'Mon-Fri',
    variations: {
      'france': 'Mon-Fri (35-hour week)',
      'germany': 'Mon-Fri (strong work-life balance)',
      'spain': 'Mon-Fri (siesta tradition declining)',
      'netherlands': 'Part-time work common',
    },
  },
  timezone: [
    'Europe/Lisbon',
    'Europe/London', // CET - Note: UK not in EU but kept for EEA context
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Athens',
    'Europe/Helsinki',
  ],
  currency: {
    primary: 'EUR',
    alternatives: ['SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN'],
  },
  regulations: {
    dataProtection: [
      'GDPR (General Data Protection Regulation)',
      'ePrivacy Directive',
      'Digital Services Act (DSA)',
      'Digital Markets Act (DMA)',
      'AI Act',
      'NIS2 Directive (Cybersecurity)',
    ],
    compliance: [
      'ISO 27001',
      'SOC 2',
      'PCI DSS',
      'CE Marking',
      'DORA (Financial)',
      'MiFID II (Financial)',
      'PSD2 (Payments)',
    ],
    labor: 'EU Working Time Directive + National laws',
  },
  businessCulture: [
    'Work-life balance prioritized',
    'Strong worker protections',
    'Works councils common',
    'Consensus-driven decision making (varies by country)',
    'Environmental consciousness',
    'Long-term business relationships',
    'Formal business correspondence',
    'VAT complexity awareness',
  ],
  communicationStyle: [
    'Varies significantly by country',
    'German: Direct and formal',
    'French: Formal, relationship-focused',
    'Dutch: Very direct',
    'Spanish/Italian: Relationship-oriented',
    'Nordic: Egalitarian, consensus',
    'English widely spoken in business',
  ],
  holidays: {
    type: 'western',
    majorHolidays: [
      'New Year Day (January 1)',
      'Good Friday (variable, most countries)',
      'Easter Monday (variable)',
      'Labour Day (May 1)',
      'Christmas Day (December 25)',
      'Boxing Day (December 26, some countries)',
      'National holidays vary by member state',
    ],
  },
  languages: [
    'English', 'German', 'French', 'Spanish', 'Italian', 'Dutch',
    'Polish', 'Portuguese', 'Swedish', 'Danish', 'Finnish', 'Greek',
  ],
  paymentMethods: [
    'SEPA transfers',
    'Credit/debit cards',
    'Direct Debit (SEPA)',
    'iDEAL (Netherlands)',
    'Bancontact (Belgium)',
    'Giropay (Germany)',
    'SOFORT',
    'Apple Pay',
    'Google Pay',
    'PayPal',
  ],
};

/**
 * Asia Pacific regional context
 */
export const ASIA_PACIFIC_CONTEXT: RegionalContext = {
  region: 'apac',
  countries: [
    'AU', 'NZ', 'JP', 'KR', 'CN', 'HK', 'TW', 'SG', 'MY', 'TH',
    'ID', 'PH', 'VN', 'IN',
  ],
  workWeek: {
    standard: 'Mon-Fri',
    variations: {
      'japan': 'Mon-Fri (long hours culture)',
      'china': 'Mon-Fri (996 in tech declining)',
      'australia': 'Mon-Fri (flexible arrangements)',
      'india': 'Mon-Sat (some sectors)',
    },
  },
  timezone: [
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Seoul',
    'Australia/Sydney',
    'Pacific/Auckland',
    'Asia/Kolkata',
  ],
  currency: {
    primary: 'USD', // Often used for international transactions
    alternatives: ['JPY', 'CNY', 'AUD', 'SGD', 'HKD', 'KRW', 'INR', 'NZD'],
  },
  regulations: {
    dataProtection: [
      'Japan: APPI (Act on Protection of Personal Information)',
      'China: PIPL (Personal Information Protection Law)',
      'Singapore: PDPA',
      'Australia: Privacy Act 1988 + APPs',
      'South Korea: PIPA',
      'India: DPDP Act 2023',
      'APEC CBPR framework',
    ],
    compliance: [
      'ISO 27001',
      'SOC 2',
      'CSA STAR',
      'IRAP (Australia)',
      'ISMAP (Japan)',
      'K-ISMS (Korea)',
    ],
    labor: 'Varies significantly by country',
  },
  businessCulture: [
    'Face-saving important across region',
    'Hierarchy respected (varies)',
    'Long-term relationships valued',
    'Gift-giving customs (varies)',
    'Group consensus in Japan/Korea',
    'Rapid growth markets',
    'Tech-savvy consumers',
    'Mobile-first in many markets',
  ],
  communicationStyle: [
    'High context in East Asia',
    'Indirect communication common',
    'English as business lingua franca',
    'WeChat/Line/KakaoTalk important',
    'Respect for seniority',
    'Written confirmation valued',
  ],
  holidays: {
    type: 'mixed',
    majorHolidays: [
      'Lunar New Year (China, Korea, Vietnam, etc.)',
      'Golden Week (Japan, China)',
      'Chuseok (Korea)',
      'Diwali (India)',
      'National Day (various)',
      'Christmas (Australia, NZ, Philippines)',
      'ANZAC Day (Australia, NZ)',
    ],
  },
  languages: [
    'English', 'Mandarin', 'Japanese', 'Korean', 'Hindi',
    'Bahasa Indonesia', 'Thai', 'Vietnamese',
  ],
  paymentMethods: [
    'Alipay (China)',
    'WeChat Pay (China)',
    'PayPay (Japan)',
    'UPI (India)',
    'GrabPay (Southeast Asia)',
    'PayNow (Singapore)',
    'Credit/debit cards',
    'Bank transfers',
    'Mobile wallets',
    'QR payments',
  ],
};

// ============================================================================
// CONTEXT REGISTRY
// ============================================================================

/**
 * MENA country code to context mapping
 */
const MENA_CONTEXTS: Record<string, RegionalContext> = {
  'EG': EGYPT_CONTEXT,
  'JO': JORDAN_CONTEXT,
  'LB': LEBANON_CONTEXT,
  'MA': MOROCCO_CONTEXT,
  'TN': TUNISIA_CONTEXT,
  'DZ': ALGERIA_CONTEXT,
  'IQ': IRAQ_CONTEXT,
};

/**
 * Global region to context mapping
 */
const GLOBAL_CONTEXTS: Record<string, RegionalContext> = {
  'us': UNITED_STATES_CONTEXT,
  'usa': UNITED_STATES_CONTEXT,
  'united_states': UNITED_STATES_CONTEXT,
  'uk': UNITED_KINGDOM_CONTEXT,
  'gb': UNITED_KINGDOM_CONTEXT,
  'united_kingdom': UNITED_KINGDOM_CONTEXT,
  'eu': EUROPEAN_UNION_CONTEXT,
  'european_union': EUROPEAN_UNION_CONTEXT,
  'europe': EUROPEAN_UNION_CONTEXT,
  'apac': ASIA_PACIFIC_CONTEXT,
  'asia_pacific': ASIA_PACIFIC_CONTEXT,
  'asia': ASIA_PACIFIC_CONTEXT,
};

/**
 * Country code to region mapping
 */
const COUNTRY_TO_REGION: Record<string, string> = {
  // MENA
  'EG': 'mena', 'JO': 'mena', 'LB': 'mena', 'MA': 'mena',
  'TN': 'mena', 'DZ': 'mena', 'IQ': 'mena',
  // GCC (reference)
  'SA': 'gcc', 'AE': 'gcc', 'KW': 'gcc', 'QA': 'gcc',
  'BH': 'gcc', 'OM': 'gcc',
  // US
  'US': 'us',
  // UK
  'GB': 'uk', 'UK': 'uk',
  // EU
  'AT': 'eu', 'BE': 'eu', 'BG': 'eu', 'HR': 'eu', 'CY': 'eu',
  'CZ': 'eu', 'DK': 'eu', 'EE': 'eu', 'FI': 'eu', 'FR': 'eu',
  'DE': 'eu', 'GR': 'eu', 'HU': 'eu', 'IE': 'eu', 'IT': 'eu',
  'LV': 'eu', 'LT': 'eu', 'LU': 'eu', 'MT': 'eu', 'NL': 'eu',
  'PL': 'eu', 'PT': 'eu', 'RO': 'eu', 'SK': 'eu', 'SI': 'eu',
  'ES': 'eu', 'SE': 'eu',
  // APAC
  'AU': 'apac', 'NZ': 'apac', 'JP': 'apac', 'KR': 'apac',
  'CN': 'apac', 'HK': 'apac', 'TW': 'apac', 'SG': 'apac',
  'MY': 'apac', 'TH': 'apac', 'ID': 'apac', 'PH': 'apac',
  'VN': 'apac', 'IN': 'apac',
};

// ============================================================================
// CURRENCY DEFINITIONS
// ============================================================================

/**
 * Currency information registry
 */
const CURRENCIES: Record<string, CurrencyInfo> = {
  // MENA Currencies
  'EGP': { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', decimals: 2, exchangeWith: ['USD', 'EUR'] },
  'JOD': { code: 'JOD', symbol: 'JD', name: 'Jordanian Dinar', decimals: 3, exchangeWith: ['USD', 'EUR'] },
  'LBP': { code: 'LBP', symbol: 'L£', name: 'Lebanese Pound', decimals: 2, exchangeWith: ['USD', 'EUR'] },
  'MAD': { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham', decimals: 2, exchangeWith: ['EUR', 'USD'] },
  'TND': { code: 'TND', symbol: 'DT', name: 'Tunisian Dinar', decimals: 3, exchangeWith: ['EUR', 'USD'] },
  'DZD': { code: 'DZD', symbol: 'DA', name: 'Algerian Dinar', decimals: 2, exchangeWith: ['EUR', 'USD'] },
  'IQD': { code: 'IQD', symbol: 'ID', name: 'Iraqi Dinar', decimals: 3, exchangeWith: ['USD'] },
  // Global Currencies
  'USD': { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  'GBP': { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, exchangeWith: ['EUR', 'USD'] },
  'EUR': { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, exchangeWith: ['USD', 'GBP'] },
  'JPY': { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0, exchangeWith: ['USD'] },
  'CNY': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2, exchangeWith: ['USD'] },
  'AUD': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2, exchangeWith: ['USD'] },
  'SGD': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2, exchangeWith: ['USD'] },
  'HKD': { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimals: 2, exchangeWith: ['USD'] },
  'KRW': { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimals: 0, exchangeWith: ['USD'] },
  'INR': { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2, exchangeWith: ['USD'] },
  'NZD': { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2, exchangeWith: ['USD', 'AUD'] },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get MENA regional context by country code
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Regional context for the specified MENA country
 * @throws Error if country code not found in MENA region
 *
 * @example
 * ```typescript
 * const egyptContext = getMENAContext('EG');
 * console.log(egyptContext.workWeek.standard); // 'Sun-Thu'
 * ```
 */
export function getMENAContext(countryCode: string): RegionalContext {
  const code = countryCode.toUpperCase();
  const context = MENA_CONTEXTS[code];

  if (!context) {
    throw new Error(
      `Country code '${countryCode}' not found in MENA region. ` +
      `Available codes: ${Object.keys(MENA_CONTEXTS).join(', ')}`
    );
  }

  return context;
}

/**
 * Get global regional context by region identifier
 *
 * @param region - Region identifier (e.g., 'us', 'uk', 'eu', 'apac')
 * @returns Regional context for the specified region
 * @throws Error if region not found
 *
 * @example
 * ```typescript
 * const usContext = getGlobalContext('us');
 * console.log(usContext.regulations.dataProtection); // ['CCPA', 'CPRA', ...]
 * ```
 */
export function getGlobalContext(region: string): RegionalContext {
  const key = region.toLowerCase().replace(/[- ]/g, '_');
  const context = GLOBAL_CONTEXTS[key];

  if (!context) {
    throw new Error(
      `Region '${region}' not found. ` +
      `Available regions: ${Array.from(new Set(Object.values(GLOBAL_CONTEXTS).map(c => c.region))).join(', ')}`
    );
  }

  return context;
}

/**
 * Get data protection requirements for a region
 *
 * @param region - Region identifier or country code
 * @returns Array of data protection regulations applicable to the region
 *
 * @example
 * ```typescript
 * const euDataProtection = getDataProtectionRequirements('eu');
 * // ['GDPR', 'ePrivacy Directive', ...]
 *
 * const egyptDataProtection = getDataProtectionRequirements('EG');
 * // ['Egypt Personal Data Protection Law (Law No. 151/2020)']
 * ```
 */
export function getDataProtectionRequirements(region: string): string[] {
  const upperRegion = region.toUpperCase();

  // Check if it's a MENA country code
  if (MENA_CONTEXTS[upperRegion]) {
    return MENA_CONTEXTS[upperRegion].regulations.dataProtection;
  }

  // Check if it's a global region
  const lowerRegion = region.toLowerCase().replace(/[- ]/g, '_');
  if (GLOBAL_CONTEXTS[lowerRegion]) {
    return GLOBAL_CONTEXTS[lowerRegion].regulations.dataProtection;
  }

  // Check country to region mapping
  const mappedRegion = COUNTRY_TO_REGION[upperRegion];
  if (mappedRegion) {
    const ctx = GLOBAL_CONTEXTS[mappedRegion];
    if (ctx) return ctx.regulations.dataProtection;
  }

  return [];
}

/**
 * Get compliance frameworks applicable to a region
 *
 * @param region - Region identifier or country code
 * @returns Array of compliance frameworks
 *
 * @example
 * ```typescript
 * const usCompliance = getComplianceFrameworks('us');
 * // ['SOC 2 Type II', 'HITRUST', 'PCI DSS', ...]
 * ```
 */
export function getComplianceFrameworks(region: string): string[] {
  const upperRegion = region.toUpperCase();

  // Check MENA
  if (MENA_CONTEXTS[upperRegion]) {
    return MENA_CONTEXTS[upperRegion].regulations.compliance;
  }

  // Check global
  const lowerRegion = region.toLowerCase().replace(/[- ]/g, '_');
  if (GLOBAL_CONTEXTS[lowerRegion]) {
    return GLOBAL_CONTEXTS[lowerRegion].regulations.compliance;
  }

  // Check country mapping
  const mappedRegion = COUNTRY_TO_REGION[upperRegion];
  if (mappedRegion) {
    const ctx = GLOBAL_CONTEXTS[mappedRegion];
    if (ctx) return ctx.regulations.compliance;
  }

  return [];
}

/**
 * Check if a given date is a business day for a region
 *
 * @param region - Region identifier or country code
 * @param date - Date to check
 * @returns true if the date is a business day
 *
 * @example
 * ```typescript
 * const date = new Date('2024-01-05'); // Friday
 * isBusinessDay('EG', date); // false (Egypt works Sun-Thu)
 * isBusinessDay('US', date); // true (US works Mon-Fri)
 * ```
 */
export function isBusinessDay(region: string, date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  // Get work week configuration
  let workWeek: string;
  const upperRegion = region.toUpperCase();

  if (MENA_CONTEXTS[upperRegion]) {
    workWeek = MENA_CONTEXTS[upperRegion].workWeek.standard;
  } else {
    const lowerRegion = region.toLowerCase().replace(/[- ]/g, '_');
    const ctx = GLOBAL_CONTEXTS[lowerRegion];
    if (ctx) {
      workWeek = ctx.workWeek.standard;
    } else {
      const mappedRegion = COUNTRY_TO_REGION[upperRegion];
      if (mappedRegion && GLOBAL_CONTEXTS[mappedRegion]) {
        workWeek = GLOBAL_CONTEXTS[mappedRegion].workWeek.standard;
      } else {
        // Default to Western work week
        workWeek = 'Mon-Fri';
      }
    }
  }

  // Parse work week string
  const workDays = parseWorkWeek(workWeek);
  return workDays.includes(dayOfWeek);
}

/**
 * Parse work week string to array of day numbers
 *
 * @param workWeek - Work week string (e.g., 'Sun-Thu', 'Mon-Fri')
 * @returns Array of day numbers (0-6, where 0 is Sunday)
 */
function parseWorkWeek(workWeek: string): number[] {
  const dayMap: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6,
  };

  const parts = workWeek.split('-');
  if (parts.length !== 2) {
    return [1, 2, 3, 4, 5]; // Default Mon-Fri
  }

  const startDay = dayMap[parts[0]];
  const endDay = dayMap[parts[1]];

  if (startDay === undefined || endDay === undefined) {
    return [1, 2, 3, 4, 5];
  }

  const days: number[] = [];
  let current = startDay;
  while (current !== (endDay + 1) % 7) {
    days.push(current);
    current = (current + 1) % 7;
  }

  return days;
}

/**
 * Get regional payment methods
 *
 * @param region - Region identifier or country code
 * @returns Array of commonly used payment methods
 *
 * @example
 * ```typescript
 * const chinaPayments = getRegionalPaymentMethods('CN');
 * // Includes Alipay, WeChat Pay, etc.
 * ```
 */
export function getRegionalPaymentMethods(region: string): string[] {
  const upperRegion = region.toUpperCase();

  // Check MENA
  if (MENA_CONTEXTS[upperRegion]) {
    return MENA_CONTEXTS[upperRegion].paymentMethods;
  }

  // Check global
  const lowerRegion = region.toLowerCase().replace(/[- ]/g, '_');
  if (GLOBAL_CONTEXTS[lowerRegion]) {
    return GLOBAL_CONTEXTS[lowerRegion].paymentMethods;
  }

  // Check country mapping
  const mappedRegion = COUNTRY_TO_REGION[upperRegion];
  if (mappedRegion) {
    const ctx = GLOBAL_CONTEXTS[mappedRegion];
    if (ctx) return ctx.paymentMethods;
  }

  return [];
}

/**
 * Get regional communication preferences
 *
 * @param region - Region identifier or country code
 * @returns Array of communication style preferences
 */
export function getRegionalCommunicationPreferences(region: string): string[] {
  const upperRegion = region.toUpperCase();

  // Check MENA
  if (MENA_CONTEXTS[upperRegion]) {
    return MENA_CONTEXTS[upperRegion].communicationStyle;
  }

  // Check global
  const lowerRegion = region.toLowerCase().replace(/[- ]/g, '_');
  if (GLOBAL_CONTEXTS[lowerRegion]) {
    return GLOBAL_CONTEXTS[lowerRegion].communicationStyle;
  }

  // Check country mapping
  const mappedRegion = COUNTRY_TO_REGION[upperRegion];
  if (mappedRegion) {
    const ctx = GLOBAL_CONTEXTS[mappedRegion];
    if (ctx) return ctx.communicationStyle;
  }

  return [];
}

// ============================================================================
// CROSS-REGIONAL UTILITIES
// ============================================================================

/**
 * Detect region from country code
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Region identifier
 *
 * @example
 * ```typescript
 * detectRegion('EG'); // 'mena'
 * detectRegion('SA'); // 'gcc'
 * detectRegion('DE'); // 'eu'
 * detectRegion('US'); // 'us'
 * ```
 */
export function detectRegion(countryCode: string): 'gcc' | 'mena' | 'eu' | 'us' | 'uk' | 'apac' | 'other' {
  const code = countryCode.toUpperCase();
  const region = COUNTRY_TO_REGION[code];

  if (region) {
    return region as 'gcc' | 'mena' | 'eu' | 'us' | 'uk' | 'apac';
  }

  return 'other';
}

/**
 * Get aggregated compliance requirements for multiple regions
 *
 * @param regions - Array of region identifiers or country codes
 * @returns Aggregated compliance requirements
 *
 * @example
 * ```typescript
 * const compliance = getRegionalCompliance(['us', 'eu', 'EG']);
 * // Returns combined requirements from all three regions
 * ```
 */
export function getRegionalCompliance(regions: string[]): ComplianceRequirements {
  const result: ComplianceRequirements = {
    dataProtection: [],
    frameworks: [],
    byRegion: {},
    priorities: {},
  };

  const seenDataProtection = new Set<string>();
  const seenFrameworks = new Set<string>();

  for (const region of regions) {
    const dataProtection = getDataProtectionRequirements(region);
    const frameworks = getComplianceFrameworks(region);

    // Track by region
    result.byRegion[region] = [...dataProtection, ...frameworks];

    // Aggregate data protection
    for (const dp of dataProtection) {
      if (!seenDataProtection.has(dp)) {
        seenDataProtection.add(dp);
        result.dataProtection.push(dp);

        // Set priority based on known regulations
        if (dp.includes('GDPR') || dp.includes('CCPA') || dp.includes('PIPL')) {
          result.priorities[dp] = 'critical';
        } else if (dp.includes('HIPAA') || dp.includes('PCI')) {
          result.priorities[dp] = 'high';
        } else {
          result.priorities[dp] = 'medium';
        }
      }
    }

    // Aggregate frameworks
    for (const fw of frameworks) {
      if (!seenFrameworks.has(fw)) {
        seenFrameworks.add(fw);
        result.frameworks.push(fw);

        // Set priority
        if (fw.includes('SOC 2') || fw.includes('ISO 27001')) {
          result.priorities[fw] = 'high';
        } else {
          result.priorities[fw] = 'medium';
        }
      }
    }
  }

  return result;
}

/**
 * Format a date according to regional preferences
 *
 * @param date - Date to format
 * @param region - Region identifier or country code
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * const date = new Date('2024-03-15');
 * formatInternationalDate(date, 'us'); // '3/15/2024'
 * formatInternationalDate(date, 'eu'); // '15/03/2024'
 * formatInternationalDate(date, 'EG'); // '15/03/2024'
 * ```
 */
export function formatInternationalDate(date: Date, region: string): string {
  const detectedRegion = detectRegion(region.toUpperCase());

  // US uses MM/DD/YYYY
  if (detectedRegion === 'us') {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }

  // Most other regions use DD/MM/YYYY
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

/**
 * Get currency information for a country code
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Currency information
 *
 * @example
 * ```typescript
 * const currencyInfo = getRegionalCurrency('EG');
 * // { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', ... }
 * ```
 */
export function getRegionalCurrency(countryCode: string): CurrencyInfo {
  const code = countryCode.toUpperCase();

  // Map country to currency
  const countryToCurrency: Record<string, string> = {
    // MENA
    'EG': 'EGP', 'JO': 'JOD', 'LB': 'LBP', 'MA': 'MAD',
    'TN': 'TND', 'DZ': 'DZD', 'IQ': 'IQD',
    // GCC
    'SA': 'SAR', 'AE': 'AED', 'KW': 'KWD', 'QA': 'QAR',
    'BH': 'BHD', 'OM': 'OMR',
    // Global
    'US': 'USD', 'GB': 'GBP', 'UK': 'GBP',
    // EU uses EUR for most members
    'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR',
    'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR', 'PT': 'EUR',
    'IE': 'EUR', 'FI': 'EUR', 'GR': 'EUR',
    // Non-Euro EU
    'SE': 'SEK', 'DK': 'DKK', 'PL': 'PLN', 'CZ': 'CZK',
    'HU': 'HUF', 'RO': 'RON', 'BG': 'BGN',
    // APAC
    'JP': 'JPY', 'CN': 'CNY', 'AU': 'AUD', 'SG': 'SGD',
    'HK': 'HKD', 'KR': 'KRW', 'IN': 'INR', 'NZ': 'NZD',
  };

  const currencyCode = countryToCurrency[code] || 'USD';
  return CURRENCIES[currencyCode] || CURRENCIES['USD'];
}

// ============================================================================
// REGIONAL INTELLIGENCE
// ============================================================================

/**
 * Implicit requirements by category for different regions
 */
const IMPLICIT_REQUIREMENTS: Record<string, Record<string, string[]>> = {
  'mena': {
    'finance': [
      'Islamic finance compliance consideration',
      'Multi-currency support (USD often preferred)',
      'Cash handling procedures',
      'Bank holiday awareness (Friday)',
    ],
    'communication': [
      'Arabic language support',
      'Right-to-left (RTL) text support',
      'Formal greeting protocols',
      'WhatsApp integration preferred',
    ],
    'scheduling': [
      'Sunday-Thursday work week',
      'Islamic holiday calendar',
      'Prayer time considerations',
      'Ramadan schedule adjustments',
    ],
    'compliance': [
      'Local data residency requirements',
      'Government registration requirements',
      'Industry-specific licensing',
    ],
  },
  'gcc': {
    'finance': [
      'VAT compliance (5-15% varies)',
      'Islamic banking options',
      'Free zone considerations',
      'WPS (Wage Protection System)',
    ],
    'communication': [
      'Arabic and English bilingual',
      'Formal business correspondence',
      'Government communication protocols',
    ],
    'scheduling': [
      'Sunday-Thursday typical',
      'Friday always off',
      'Government timing variations',
    ],
    'compliance': [
      'Emiratization/Saudization quotas',
      'Data localization requirements',
      'Industry licensing (varies)',
    ],
  },
  'eu': {
    'finance': [
      'VAT handling (rates vary by country)',
      'SEPA payment integration',
      'PSD2 compliance for payments',
      'Strong Customer Authentication (SCA)',
    ],
    'communication': [
      'GDPR consent requirements',
      'Multi-language support',
      'Cookie consent mechanisms',
      'Unsubscribe requirements',
    ],
    'scheduling': [
      'Respect work-life balance laws',
      'Right to disconnect awareness',
      'Works council notification requirements',
    ],
    'compliance': [
      'GDPR data processing',
      'Data Protection Impact Assessments',
      'Cross-border data transfer rules',
      'AI Act compliance (emerging)',
    ],
  },
  'us': {
    'finance': [
      'State sales tax variations',
      'ACH payment integration',
      'PCI DSS for card payments',
      '1099 reporting for contractors',
    ],
    'communication': [
      'CAN-SPAM compliance',
      'TCPA for phone/SMS',
      'ADA accessibility requirements',
      'Clear unsubscribe mechanisms',
    ],
    'scheduling': [
      'Time zone variations (6 zones)',
      'State holiday variations',
      'At-will employment awareness',
    ],
    'compliance': [
      'State privacy laws (CCPA, VCDPA, etc.)',
      'Industry-specific (HIPAA, GLBA)',
      'SOC 2 for B2B trust',
      'Export control (EAR, ITAR)',
    ],
  },
  'uk': {
    'finance': [
      'VAT registration threshold',
      'Making Tax Digital',
      'FCA compliance for financial services',
      'Faster Payments integration',
    ],
    'communication': [
      'UK GDPR compliance',
      'PECR for marketing',
      'ICO registration requirements',
    ],
    'scheduling': [
      'Bank holiday awareness',
      'Working Time Regulations',
    ],
    'compliance': [
      'UK GDPR (post-Brexit)',
      'Data adequacy considerations',
      'Modern Slavery Act reporting',
      'Cyber Essentials certification',
    ],
  },
  'apac': {
    'finance': [
      'Cross-border payment complexity',
      'Local payment method integration',
      'Currency exchange considerations',
      'Invoicing requirements vary',
    ],
    'communication': [
      'Local messaging app integration',
      'Language localization essential',
      'Cultural sensitivity in marketing',
      'Mobile-first design priority',
    ],
    'scheduling': [
      'Major festival awareness',
      'Work culture variations',
      'Time zone spanning (many hours)',
    ],
    'compliance': [
      'Country-specific data laws',
      'Data localization requirements',
      'Local entity requirements',
    ],
  },
};

/**
 * Tool recommendations by category for different regions
 */
const TOOL_RECOMMENDATIONS: Record<string, Record<string, string[]>> = {
  'mena': {
    'payments': ['Cash handling workflows', 'Bank transfer automation', 'Mobile wallet integration'],
    'communication': ['WhatsApp Business', 'SMS gateways', 'Email (formal templates)'],
    'compliance': ['Document management', 'Approval workflows', 'Audit logging'],
    'localization': ['Arabic translation services', 'RTL layout tools', 'Cultural calendar integration'],
  },
  'gcc': {
    'payments': ['Bank integration (local)', 'VAT automation', 'WPS compliance tools'],
    'communication': ['WhatsApp Business', 'Government portal integration', 'Arabic/English templates'],
    'compliance': ['Visa/work permit tracking', 'Nationalization quota tracking', 'License renewal automation'],
    'localization': ['Arabic translation', 'Islamic calendar tools', 'Prayer time integration'],
  },
  'eu': {
    'payments': ['SEPA integration', 'VAT calculation (multi-country)', 'Stripe/Adyen'],
    'communication': ['GDPR-compliant email', 'Consent management platforms', 'Multi-language support'],
    'compliance': ['GDPR audit tools', 'Cookie consent managers', 'Data mapping tools'],
    'localization': ['Multi-language CMS', 'Currency conversion', 'Country-specific formatting'],
  },
  'us': {
    'payments': ['Stripe', 'ACH automation', 'Tax calculation services (Avalara)'],
    'communication': ['Email marketing (Mailchimp, SendGrid)', 'CRM integration', 'Slack'],
    'compliance': ['SOC 2 automation (Vanta, Drata)', 'Privacy tools', 'Security scanning'],
    'localization': ['Time zone management', 'State-specific rule engines'],
  },
  'uk': {
    'payments': ['GoCardless', 'Stripe', 'Open Banking APIs'],
    'communication': ['UK GDPR-compliant marketing', 'Email automation'],
    'compliance': ['ICO registration tools', 'Cyber Essentials certification'],
    'localization': ['UK date/currency formatting', 'UK English spell checking'],
  },
  'apac': {
    'payments': ['Alipay', 'WeChat Pay', 'UPI', 'Local bank integrations'],
    'communication': ['WeChat', 'LINE', 'KakaoTalk', 'WhatsApp'],
    'compliance': ['Multi-jurisdiction compliance', 'Data localization tools'],
    'localization': ['Translation services', 'Local format adaptation', 'Timezone management'],
  },
};

/**
 * Create regional intelligence instance for a region
 *
 * @param region - Region identifier
 * @returns Regional intelligence interface
 *
 * @example
 * ```typescript
 * const intel = createRegionalIntelligence('eu');
 * const requirements = intel.getImplicitRequirements('compliance');
 * // ['GDPR data processing', 'Data Protection Impact Assessments', ...]
 * ```
 */
export function createRegionalIntelligence(region: string): RegionalIntelligence {
  const normalizedRegion = region.toLowerCase().replace(/[- ]/g, '_');

  // Determine the base region for lookups
  let baseRegion = normalizedRegion;
  const upperRegion = region.toUpperCase();

  if (MENA_CONTEXTS[upperRegion]) {
    baseRegion = 'mena';
  } else if (COUNTRY_TO_REGION[upperRegion]) {
    baseRegion = COUNTRY_TO_REGION[upperRegion];
  }

  return {
    region: baseRegion,

    getImplicitRequirements(category: string): string[] {
      const regionReqs = IMPLICIT_REQUIREMENTS[baseRegion];
      if (!regionReqs) return [];
      return regionReqs[category.toLowerCase()] || [];
    },

    getToolRecommendations(category: string): string[] {
      const regionTools = TOOL_RECOMMENDATIONS[baseRegion];
      if (!regionTools) return [];
      return regionTools[category.toLowerCase()] || [];
    },

    getComplianceChecklist(): string[] {
      const checklist: string[] = [];

      // Get data protection requirements
      const dataProtection = getDataProtectionRequirements(region);
      checklist.push(...dataProtection.map(dp => `Data Protection: ${dp}`));

      // Get compliance frameworks
      const frameworks = getComplianceFrameworks(region);
      checklist.push(...frameworks.map(fw => `Framework: ${fw}`));

      // Add implicit compliance requirements
      const implicitCompliance = IMPLICIT_REQUIREMENTS[baseRegion]?.['compliance'] || [];
      checklist.push(...implicitCompliance.map(ic => `Requirement: ${ic}`));

      return checklist;
    },

    getLocalizationRequirements(): string[] {
      const requirements: string[] = [];

      // Get context
      let context: RegionalContext | undefined;
      if (MENA_CONTEXTS[upperRegion]) {
        context = MENA_CONTEXTS[upperRegion];
      } else if (GLOBAL_CONTEXTS[normalizedRegion]) {
        context = GLOBAL_CONTEXTS[normalizedRegion];
      }

      if (context) {
        // Language requirements
        if (context.languages.length > 1) {
          requirements.push(`Multi-language support: ${context.languages.join(', ')}`);
        }

        // Calendar requirements
        if (context.holidays.type === 'islamic' || context.holidays.type === 'mixed') {
          requirements.push('Islamic calendar integration');
          requirements.push('Hijri date support');
        }

        // Currency
        requirements.push(`Primary currency: ${context.currency.primary}`);
        if (context.currency.alternatives?.length) {
          requirements.push(`Alternative currencies: ${context.currency.alternatives.join(', ')}`);
        }

        // Work week
        if (context.workWeek.standard !== 'Mon-Fri') {
          requirements.push(`Non-standard work week: ${context.workWeek.standard}`);
        }

        // RTL support for Arabic regions
        if (context.languages.some(l => l.toLowerCase().includes('arabic'))) {
          requirements.push('Right-to-left (RTL) text support');
        }
      }

      return requirements;
    },
  };
}

// ============================================================================
// BUSINESS HOURS UTILITIES
// ============================================================================

/**
 * Default business hours by region
 */
const BUSINESS_HOURS: Record<string, BusinessHours> = {
  'mena': {
    open: '09:00',
    close: '17:00',
    fridayHours: 'closed',
  },
  'gcc': {
    open: '08:00',
    close: '17:00',
    lunchBreak: { start: '12:30', end: '14:00' },
    fridayHours: 'closed',
  },
  'eu': {
    open: '09:00',
    close: '18:00',
    lunchBreak: { start: '12:00', end: '13:00' },
  },
  'us': {
    open: '09:00',
    close: '17:00',
  },
  'uk': {
    open: '09:00',
    close: '17:30',
  },
  'apac': {
    open: '09:00',
    close: '18:00',
  },
};

/**
 * Get business hours for a region
 *
 * @param region - Region identifier or country code
 * @returns Business hours configuration
 */
export function getBusinessHours(region: string): BusinessHours {
  const detectedRegion = detectRegion(region.toUpperCase());
  return BUSINESS_HOURS[detectedRegion] || BUSINESS_HOURS['us'];
}

/**
 * Check if current time is within business hours for a region
 *
 * @param region - Region identifier or country code
 * @param currentTime - Optional time to check (defaults to now)
 * @returns true if within business hours
 */
export function isBusinessHours(region: string, currentTime?: Date): boolean {
  const hours = getBusinessHours(region);
  const now = currentTime || new Date();

  // Check if it's a business day
  if (!isBusinessDay(region, now)) {
    return false;
  }

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  const [openHour, openMinute] = hours.open.split(':').map(Number);
  const [closeHour, closeMinute] = hours.close.split(':').map(Number);

  const openTimeMinutes = openHour * 60 + openMinute;
  const closeTimeMinutes = closeHour * 60 + closeMinute;

  // Basic check
  if (currentTimeMinutes < openTimeMinutes || currentTimeMinutes > closeTimeMinutes) {
    return false;
  }

  // Check lunch break if applicable
  if (hours.lunchBreak) {
    const [lunchStartHour, lunchStartMinute] = hours.lunchBreak.start.split(':').map(Number);
    const [lunchEndHour, lunchEndMinute] = hours.lunchBreak.end.split(':').map(Number);

    const lunchStartMinutes = lunchStartHour * 60 + lunchStartMinute;
    const lunchEndMinutes = lunchEndHour * 60 + lunchEndMinute;

    if (currentTimeMinutes >= lunchStartMinutes && currentTimeMinutes < lunchEndMinutes) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// HOLIDAY UTILITIES
// ============================================================================

/**
 * Check if a date is a major holiday in a region
 *
 * @param region - Region identifier or country code
 * @param date - Date to check
 * @returns Holiday information if it's a holiday, undefined otherwise
 *
 * @note This is a simplified implementation. Islamic holidays require
 * proper Hijri calendar calculations for accurate dates.
 */
export function isHoliday(region: string, date: Date): Holiday | undefined {
  let context: RegionalContext | undefined;
  const upperRegion = region.toUpperCase();

  if (MENA_CONTEXTS[upperRegion]) {
    context = MENA_CONTEXTS[upperRegion];
  } else {
    const normalizedRegion = region.toLowerCase().replace(/[- ]/g, '_');
    context = GLOBAL_CONTEXTS[normalizedRegion];
  }

  if (!context) return undefined;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateStr = `${month}/${day}`;

  // Check fixed-date holidays (simplified)
  for (const holiday of context.holidays.majorHolidays) {
    // Parse common date formats
    const januaryMatch = holiday.match(/January (\d+)/);
    if (januaryMatch && month === 1 && day === parseInt(januaryMatch[1])) {
      return { name: holiday, date: dateStr, isPublic: true };
    }

    const julyMatch = holiday.match(/July (\d+)/);
    if (julyMatch && month === 7 && day === parseInt(julyMatch[1])) {
      return { name: holiday, date: dateStr, isPublic: true };
    }

    const decemberMatch = holiday.match(/December (\d+)/);
    if (decemberMatch && month === 12 && day === parseInt(decemberMatch[1])) {
      return { name: holiday, date: dateStr, isPublic: true };
    }

    // Add more month parsers as needed
  }

  // Note: Islamic holidays (variable) require Hijri calendar calculations
  // which are not implemented in this simplified version

  return undefined;
}

// ============================================================================
// EXPORT ALL CONTEXTS
// ============================================================================

/**
 * All MENA country contexts
 */
export const MENA_COUNTRY_CONTEXTS = {
  egypt: EGYPT_CONTEXT,
  jordan: JORDAN_CONTEXT,
  lebanon: LEBANON_CONTEXT,
  morocco: MOROCCO_CONTEXT,
  tunisia: TUNISIA_CONTEXT,
  algeria: ALGERIA_CONTEXT,
  iraq: IRAQ_CONTEXT,
};

/**
 * All global regional contexts
 */
export const GLOBAL_REGION_CONTEXTS = {
  unitedStates: UNITED_STATES_CONTEXT,
  unitedKingdom: UNITED_KINGDOM_CONTEXT,
  europeanUnion: EUROPEAN_UNION_CONTEXT,
  asiaPacific: ASIA_PACIFIC_CONTEXT,
};

/**
 * Get all available contexts
 *
 * @returns Object containing all regional contexts
 */
export function getAllContexts(): {
  mena: Record<string, RegionalContext>;
  global: Record<string, RegionalContext>;
} {
  return {
    mena: MENA_CONTEXTS,
    global: GLOBAL_CONTEXTS,
  };
}

/**
 * Get list of all supported country codes
 *
 * @returns Array of supported ISO country codes
 */
export function getSupportedCountries(): string[] {
  return Object.keys(COUNTRY_TO_REGION);
}

/**
 * Get list of all supported regions
 *
 * @returns Array of supported region identifiers
 */
export function getSupportedRegions(): string[] {
  return ['gcc', 'mena', 'eu', 'us', 'uk', 'apac'];
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Context retrieval
  getMENAContext,
  getGlobalContext,
  getAllContexts,

  // Requirements and compliance
  getDataProtectionRequirements,
  getComplianceFrameworks,
  getRegionalCompliance,

  // Business operations
  isBusinessDay,
  isBusinessHours,
  getBusinessHours,
  isHoliday,

  // Payment and communication
  getRegionalPaymentMethods,
  getRegionalCommunicationPreferences,

  // Cross-regional utilities
  detectRegion,
  formatInternationalDate,
  getRegionalCurrency,

  // Intelligence
  createRegionalIntelligence,

  // Lists
  getSupportedCountries,
  getSupportedRegions,

  // Constants
  MENA_COUNTRY_CONTEXTS,
  GLOBAL_REGION_CONTEXTS,
};

/**
 * RegionalIntelligenceService.ts
 *
 * Regional context and intelligence for localized user experience.
 * Primary focus: Kuwait and GCC region.
 *
 * SAFE: This is a NEW file - does not modify any protected code.
 */

export interface RegionalContext {
  region: string;
  country: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  workWeek: string[];
  businessHours: { start: string; end: string };
  primaryLanguage: string;
  secondaryLanguage?: string;
  dateFormat: string;
  numberFormat: string;
  primaryCommunicationApps: string[];
  preferredPaymentMethods: string[];
  culturalNotes: string[];
}

export interface LocalizedSuggestion {
  suggestion: string;
  reason: string;
  regionalRelevance: 'high' | 'medium' | 'low';
}

/**
 * Regional configurations
 */
const REGIONAL_CONFIGS: Record<string, RegionalContext> = {
  kuwait: {
    region: 'GCC',
    country: 'Kuwait',
    timezone: 'Asia/Kuwait', // UTC+3
    currency: 'KWD',
    currencySymbol: 'KD',
    workWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    businessHours: { start: '08:00', end: '17:00' },
    primaryLanguage: 'Arabic',
    secondaryLanguage: 'English',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,234.56',
    primaryCommunicationApps: ['whatsapp', 'teams', 'slack'],
    preferredPaymentMethods: ['KNET', 'Visa', 'Mastercard'],
    culturalNotes: [
      'Friday is the holy day - avoid scheduling business calls',
      'Ramadan affects working hours significantly',
      'Arabic greetings appreciated in business context',
      'WhatsApp is the primary business communication tool',
      'Summer hours may differ (June-September)'
    ]
  },
  uae: {
    region: 'GCC',
    country: 'United Arab Emirates',
    timezone: 'Asia/Dubai', // UTC+4
    currency: 'AED',
    currencySymbol: 'AED',
    workWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    businessHours: { start: '09:00', end: '18:00' },
    primaryLanguage: 'Arabic',
    secondaryLanguage: 'English',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,234.56',
    primaryCommunicationApps: ['whatsapp', 'teams', 'slack'],
    preferredPaymentMethods: ['Card', 'Apple Pay', 'Bank Transfer'],
    culturalNotes: [
      'UAE recently shifted to Mon-Fri work week',
      'Diverse expat population - English widely used',
      'Dubai vs Abu Dhabi may have different preferences',
      'WhatsApp dominant for business'
    ]
  },
  saudi: {
    region: 'GCC',
    country: 'Saudi Arabia',
    timezone: 'Asia/Riyadh', // UTC+3
    currency: 'SAR',
    currencySymbol: 'SR',
    workWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    businessHours: { start: '08:00', end: '17:00' },
    primaryLanguage: 'Arabic',
    secondaryLanguage: 'English',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,234.56',
    primaryCommunicationApps: ['whatsapp', 'teams'],
    preferredPaymentMethods: ['MADA', 'Visa', 'Mastercard', 'Apple Pay'],
    culturalNotes: [
      'Vision 2030 driving rapid digital transformation',
      'Arabic strongly preferred in government/official contexts',
      'Prayer times affect daily schedules',
      'WhatsApp is ubiquitous'
    ]
  },
  us: {
    region: 'North America',
    country: 'United States',
    timezone: 'America/New_York', // Default to Eastern
    currency: 'USD',
    currencySymbol: '$',
    workWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    businessHours: { start: '09:00', end: '17:00' },
    primaryLanguage: 'English',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: '1,234.56',
    primaryCommunicationApps: ['slack', 'teams', 'gmail'],
    preferredPaymentMethods: ['Card', 'ACH', 'PayPal', 'Venmo'],
    culturalNotes: [
      'Multiple timezones - always clarify',
      'Email and Slack are primary business tools',
      'Direct communication style'
    ]
  },
  uk: {
    region: 'Europe',
    country: 'United Kingdom',
    timezone: 'Europe/London',
    currency: 'GBP',
    currencySymbol: '£',
    workWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    businessHours: { start: '09:00', end: '17:30' },
    primaryLanguage: 'English',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,234.56',
    primaryCommunicationApps: ['slack', 'teams', 'gmail'],
    preferredPaymentMethods: ['Card', 'Bank Transfer', 'Direct Debit'],
    culturalNotes: [
      'Bank holidays vary by country (England, Scotland, Wales, NI)',
      'Formal business communication often expected'
    ]
  },
  india: {
    region: 'South Asia',
    country: 'India',
    timezone: 'Asia/Kolkata', // UTC+5:30
    currency: 'INR',
    currencySymbol: '₹',
    workWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    businessHours: { start: '09:30', end: '18:30' },
    primaryLanguage: 'Hindi',
    secondaryLanguage: 'English',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,23,456.78', // Lakh/Crore system
    primaryCommunicationApps: ['whatsapp', 'slack', 'gmail'],
    preferredPaymentMethods: ['UPI', 'Card', 'Bank Transfer'],
    culturalNotes: [
      'Diverse festivals affect business calendar',
      'Half-day Saturday common',
      'WhatsApp Business very popular',
      'English widely used in business'
    ]
  }
};

/**
 * Tool recommendations by region
 */
const REGIONAL_TOOL_PREFERENCES: Record<string, {
  transcription: string[];
  communication: string[];
  payments: string[];
  productivity: string[];
}> = {
  kuwait: {
    transcription: ['deepgram', 'elevenlabs', 'speechmatics'], // Arabic support
    communication: ['whatsapp', 'teams', 'slack'],
    payments: ['stripe'], // KNET would be ideal
    productivity: ['googlesheets', 'notion', 'gmail']
  },
  gcc: {
    transcription: ['deepgram', 'elevenlabs', 'speechmatics'],
    communication: ['whatsapp', 'teams', 'slack'],
    payments: ['stripe'],
    productivity: ['googlesheets', 'notion', 'gmail']
  },
  us: {
    transcription: ['otter', 'fireflies', 'deepgram'],
    communication: ['slack', 'teams', 'discord'],
    payments: ['stripe', 'square'],
    productivity: ['notion', 'asana', 'slack']
  },
  global: {
    transcription: ['deepgram', 'fireflies'],
    communication: ['slack', 'teams'],
    payments: ['stripe'],
    productivity: ['notion', 'googlesheets']
  }
};

/**
 * Service for regional intelligence and localization
 */
export class RegionalIntelligenceService {
  /**
   * Get regional context for a country/region
   */
  static getContext(region: string): RegionalContext {
    const normalized = region.toLowerCase().replace(/\s+/g, '');
    return REGIONAL_CONFIGS[normalized] || REGIONAL_CONFIGS['us']; // Default to US
  }

  /**
   * Check if current time is within business hours for a region
   */
  static isBusinessHours(region: string, currentTime?: Date): boolean {
    const context = this.getContext(region);
    const now = currentTime || new Date();

    // Get day of week
    const dayOfWeek = now.toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: context.timezone
    });

    // Check if it's a work day
    if (!context.workWeek.includes(dayOfWeek)) {
      return false;
    }

    // Check time
    const hours = parseInt(now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: context.timezone
    }));

    const startHour = parseInt(context.businessHours.start.split(':')[0]);
    const endHour = parseInt(context.businessHours.end.split(':')[0]);

    return hours >= startHour && hours < endHour;
  }

  /**
   * Get day type for scheduling context
   */
  static getDayType(region: string, date?: Date): 'workday' | 'weekend' | 'friday' {
    const context = this.getContext(region);
    const targetDate = date || new Date();

    const dayOfWeek = targetDate.toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: context.timezone
    });

    // Friday is special in Islamic countries
    if (dayOfWeek === 'Friday' && ['kuwait', 'uae', 'saudi', 'qatar', 'bahrain', 'oman'].includes(region.toLowerCase())) {
      return 'friday';
    }

    return context.workWeek.includes(dayOfWeek) ? 'workday' : 'weekend';
  }

  /**
   * Get recommended tools for a use case in a region
   */
  static getRecommendedTools(
    region: string,
    useCase: 'transcription' | 'communication' | 'payments' | 'productivity'
  ): string[] {
    const normalized = region.toLowerCase();

    // Check specific region first
    if (REGIONAL_TOOL_PREFERENCES[normalized]) {
      return REGIONAL_TOOL_PREFERENCES[normalized][useCase];
    }

    // Check if it's a GCC country
    if (['kuwait', 'uae', 'saudi', 'qatar', 'bahrain', 'oman'].includes(normalized)) {
      return REGIONAL_TOOL_PREFERENCES['gcc'][useCase];
    }

    // Default to global
    return REGIONAL_TOOL_PREFERENCES['global'][useCase];
  }

  /**
   * Format currency for a region
   */
  static formatCurrency(amount: number, region: string): string {
    const context = this.getContext(region);

    try {
      return new Intl.NumberFormat(this.getLocale(region), {
        style: 'currency',
        currency: context.currency
      }).format(amount);
    } catch {
      return `${context.currencySymbol} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Get locale code for a region
   */
  static getLocale(region: string): string {
    const localeMap: Record<string, string> = {
      kuwait: 'ar-KW',
      uae: 'ar-AE',
      saudi: 'ar-SA',
      us: 'en-US',
      uk: 'en-GB',
      india: 'en-IN'
    };

    return localeMap[region.toLowerCase()] || 'en-US';
  }

  /**
   * Get localized suggestions based on region and time
   */
  static getLocalizedSuggestions(
    region: string,
    currentTime?: Date
  ): LocalizedSuggestion[] {
    const suggestions: LocalizedSuggestion[] = [];
    const context = this.getContext(region);
    const now = currentTime || new Date();

    // Day of week suggestions
    const dayType = this.getDayType(region, now);
    const dayOfWeek = now.toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: context.timezone
    });

    if (dayType === 'friday' && context.region === 'GCC') {
      suggestions.push({
        suggestion: 'Consider scheduling important communications for Sunday-Thursday',
        reason: 'Friday is traditionally a day of rest in the GCC',
        regionalRelevance: 'high'
      });
    }

    if (dayOfWeek === 'Sunday' && context.workWeek.includes('Sunday')) {
      suggestions.push({
        suggestion: 'Start of the work week - great time for planning workflows',
        reason: 'Sunday is the first work day in this region',
        regionalRelevance: 'medium'
      });
    }

    // Communication suggestions
    if (context.primaryCommunicationApps.includes('whatsapp')) {
      suggestions.push({
        suggestion: 'Consider adding WhatsApp notifications for customer-facing workflows',
        reason: 'WhatsApp is the primary business communication tool in this region',
        regionalRelevance: 'high'
      });
    }

    // Time-based suggestions
    const hours = parseInt(now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: context.timezone
    }));

    if (hours >= 8 && hours < 10 && this.isBusinessHours(region, now)) {
      suggestions.push({
        suggestion: 'Morning is a great time to set up daily report automations',
        reason: 'Catch up on overnight activities at the start of your work day',
        regionalRelevance: 'medium'
      });
    }

    // Language suggestions
    if (context.primaryLanguage === 'Arabic') {
      suggestions.push({
        suggestion: 'For transcription, use Deepgram or ElevenLabs for best Arabic support',
        reason: 'These services have superior Arabic dialect recognition',
        regionalRelevance: 'high'
      });
    }

    return suggestions;
  }

  /**
   * Check if a tool is recommended for a region
   */
  static isToolRecommendedForRegion(
    toolkit: string,
    region: string,
    requiresLanguageSupport?: string
  ): { recommended: boolean; reason?: string; alternative?: string } {
    const normalized = toolkit.toLowerCase();
    const regionLower = region.toLowerCase();

    // Check for Arabic language requirement
    if (requiresLanguageSupport === 'arabic') {
      // Tools with poor Arabic support
      const poorArabicSupport = ['otter'];
      if (poorArabicSupport.includes(normalized)) {
        return {
          recommended: false,
          reason: 'Poor Arabic dialect support',
          alternative: 'deepgram' // or 'elevenlabs'
        };
      }

      // Tools with good Arabic support
      const goodArabicSupport = ['deepgram', 'elevenlabs', 'speechmatics'];
      if (goodArabicSupport.includes(normalized)) {
        return {
          recommended: true,
          reason: 'Excellent Arabic/Gulf dialect support'
        };
      }
    }

    // Regional communication preferences
    const isGCC = ['kuwait', 'uae', 'saudi', 'qatar', 'bahrain', 'oman'].includes(regionLower);
    if (isGCC && normalized === 'whatsapp') {
      return {
        recommended: true,
        reason: 'WhatsApp is the primary business communication tool in the GCC'
      };
    }

    // Default
    return { recommended: true };
  }

  /**
   * Get all available regions
   */
  static getAvailableRegions(): Array<{ id: string; name: string; region: string }> {
    return Object.entries(REGIONAL_CONFIGS).map(([id, config]) => ({
      id,
      name: config.country,
      region: config.region
    }));
  }

  /**
   * Detect region from timezone or locale
   */
  static detectRegion(timezone?: string, locale?: string): string {
    if (timezone) {
      const tzMap: Record<string, string> = {
        'Asia/Kuwait': 'kuwait',
        'Asia/Dubai': 'uae',
        'Asia/Riyadh': 'saudi',
        'America/New_York': 'us',
        'America/Los_Angeles': 'us',
        'America/Chicago': 'us',
        'Europe/London': 'uk',
        'Asia/Kolkata': 'india'
      };

      if (tzMap[timezone]) {
        return tzMap[timezone];
      }
    }

    if (locale) {
      const localeMap: Record<string, string> = {
        'ar-KW': 'kuwait',
        'ar-AE': 'uae',
        'ar-SA': 'saudi',
        'en-US': 'us',
        'en-GB': 'uk',
        'en-IN': 'india',
        'hi-IN': 'india'
      };

      if (localeMap[locale]) {
        return localeMap[locale];
      }
    }

    return 'us'; // Default
  }
}

export default RegionalIntelligenceService;

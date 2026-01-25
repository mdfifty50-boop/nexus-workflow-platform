/**
 * Locale Configuration
 *
 * Centralized configuration for all supported locales.
 * Handles locale detection, fallback chains, and locale-specific settings.
 */

import type {
  SupportedLocale,
  LocaleConfig,
  LocaleDetectionOptions,
  TextDirection,
  LanguageChangeCallback,
  LanguageChangeEvent,
} from './types';

/**
 * Storage key for persisted locale preference
 */
const LOCALE_STORAGE_KEY = 'nexus_locale';

/**
 * Current locale state (module-level for synchronous access)
 */
let currentLocale: SupportedLocale = 'en';

/**
 * Language change listeners
 */
const changeListeners: Set<LanguageChangeCallback> = new Set();

/**
 * Locale configurations for all supported locales
 */
export const localeConfig: Record<SupportedLocale, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    locale: 'en-US',
    calendar: 'gregorian',
    numeralSystem: 'latn',
    flag: '🇺🇸',
    isDefault: true,
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    locale: 'ar',
    calendar: 'gregorian',
    numeralSystem: 'arab',
    flag: '🇸🇦',
  },
  'ar-KW': {
    code: 'ar-KW',
    name: 'Arabic (Kuwait)',
    nativeName: 'العربية (الكويت)',
    direction: 'rtl',
    locale: 'ar-KW',
    calendar: 'gregorian',
    numeralSystem: 'arab',
    flag: '🇰🇼',
    fallback: 'ar',
  },
};

/**
 * List of supported locales
 */
export const supportedLocales: SupportedLocale[] = Object.keys(localeConfig) as SupportedLocale[];

/**
 * Get configuration for a specific locale
 */
export const getLocaleConfig = (locale: SupportedLocale): LocaleConfig => {
  return localeConfig[locale] ?? localeConfig.en;
};

/**
 * Check if a locale is supported
 */
export const isLocaleSupported = (locale: string): locale is SupportedLocale => {
  return locale in localeConfig;
};

/**
 * Get the fallback chain for a locale
 * Returns an array of locales to try in order
 */
export const getFallbackChain = (locale: SupportedLocale): SupportedLocale[] => {
  const chain: SupportedLocale[] = [locale];
  const config = localeConfig[locale];

  // Add explicit fallback
  if (config?.fallback && config.fallback !== locale) {
    chain.push(config.fallback);
  }

  // Add base language (e.g., 'ar' for 'ar-KW')
  const baseLocale = locale.split('-')[0] as SupportedLocale;
  if (baseLocale !== locale && isLocaleSupported(baseLocale) && !chain.includes(baseLocale)) {
    chain.push(baseLocale);
  }

  // Always include default locale at the end
  if (!chain.includes('en')) {
    chain.push('en');
  }

  return chain;
};

/**
 * Detect user's preferred locale from various sources
 */
export const detectLocale = (options: LocaleDetectionOptions = {}): SupportedLocale => {
  const {
    order = ['localStorage', 'navigator', 'htmlTag'],
    localStorageKey = LOCALE_STORAGE_KEY,
    queryParam = 'lang',
    defaultLocale = 'en',
  } = options;

  for (const source of order) {
    let detected: string | null = null;

    switch (source) {
      case 'localStorage':
        if (typeof window !== 'undefined' && window.localStorage) {
          detected = localStorage.getItem(localStorageKey);
        }
        break;

      case 'navigator':
        if (typeof navigator !== 'undefined') {
          // Try navigator.language first, then languages array
          const languages = [navigator.language, ...(navigator.languages || [])];
          for (const lang of languages) {
            // Try exact match first
            if (isLocaleSupported(lang)) {
              detected = lang;
              break;
            }
            // Try base language (e.g., 'ar' from 'ar-KW')
            const baseLang = lang.split('-')[0];
            if (isLocaleSupported(baseLang)) {
              detected = baseLang;
              break;
            }
          }
        }
        break;

      case 'htmlTag':
        if (typeof document !== 'undefined') {
          detected = document.documentElement.lang;
        }
        break;

      case 'querystring':
        if (typeof window !== 'undefined' && window.location) {
          const params = new URLSearchParams(window.location.search);
          detected = params.get(queryParam);
        }
        break;

      case 'cookie':
        if (typeof document !== 'undefined' && document.cookie) {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === options.cookieName) {
              detected = value;
              break;
            }
          }
        }
        break;
    }

    if (detected && isLocaleSupported(detected)) {
      return detected;
    }
  }

  return defaultLocale;
};

/**
 * Get the current locale
 */
export const getCurrentLocale = (): SupportedLocale => {
  return currentLocale;
};

/**
 * Get the current locale configuration
 */
export const getCurrentLocaleConfig = (): LocaleConfig => {
  return getLocaleConfig(currentLocale);
};

/**
 * Check if the current locale is RTL
 */
export const isRTL = (): boolean => {
  return getCurrentLocaleConfig().direction === 'rtl';
};

/**
 * Get the current text direction
 */
export const getTextDirection = (): TextDirection => {
  return getCurrentLocaleConfig().direction;
};

/**
 * Set the current locale and update document direction
 */
export const setLocale = (locale: SupportedLocale): void => {
  if (!isLocaleSupported(locale)) {
    console.warn(`Locale "${locale}" is not supported. Using "en" instead.`);
    locale = 'en';
  }

  const previousLocale = currentLocale;
  if (previousLocale === locale) {
    return;
  }

  currentLocale = locale;
  const config = getLocaleConfig(locale);

  // Update document attributes
  if (typeof document !== 'undefined') {
    document.documentElement.dir = config.direction;
    document.documentElement.lang = locale;

    // Update meta viewport for RTL if needed
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      // Ensure proper RTL viewport handling
      metaViewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, viewport-fit=cover'
      );
    }
  }

  // Persist preference
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // localStorage may be unavailable or full
    }
  }

  // Notify listeners
  const event: LanguageChangeEvent = {
    previousLocale,
    newLocale: locale,
    direction: config.direction,
  };

  changeListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.error('Error in language change listener:', error);
    }
  });
};

/**
 * Initialize locale from detection
 */
export const initLocale = (options?: LocaleDetectionOptions): SupportedLocale => {
  const detected = detectLocale(options);
  setLocale(detected);
  return detected;
};

/**
 * Toggle between English and Arabic
 */
export const toggleLocale = (): SupportedLocale => {
  const next = currentLocale === 'en' ? 'ar' : currentLocale === 'ar' ? 'ar-KW' : 'en';
  setLocale(next);
  return next;
};

/**
 * Toggle between Arabic variants (ar <-> ar-KW)
 */
export const toggleArabicVariant = (): SupportedLocale => {
  if (!currentLocale.startsWith('ar')) {
    return currentLocale;
  }
  const next = currentLocale === 'ar' ? 'ar-KW' : 'ar';
  setLocale(next);
  return next;
};

/**
 * Subscribe to locale changes
 */
export const onLocaleChange = (callback: LanguageChangeCallback): (() => void) => {
  changeListeners.add(callback);
  return () => {
    changeListeners.delete(callback);
  };
};

/**
 * Get all available locales for display
 */
export const getAvailableLocales = (): LocaleConfig[] => {
  return Object.values(localeConfig);
};

/**
 * Get locales grouped by language family
 */
export const getLocalesByFamily = (): Record<string, LocaleConfig[]> => {
  const families: Record<string, LocaleConfig[]> = {};

  for (const config of Object.values(localeConfig)) {
    const family = config.code.split('-')[0];
    if (!families[family]) {
      families[family] = [];
    }
    families[family].push(config);
  }

  return families;
};

/**
 * Format a locale code for display
 */
export const formatLocaleForDisplay = (locale: SupportedLocale): string => {
  const config = localeConfig[locale];
  if (!config) return locale;

  return `${config.flag} ${config.nativeName}`;
};

/**
 * Get language name in native script
 */
export const getNativeLanguageName = (locale: SupportedLocale): string => {
  return localeConfig[locale]?.nativeName ?? locale;
};

/**
 * Get language name in English
 */
export const getEnglishLanguageName = (locale: SupportedLocale): string => {
  return localeConfig[locale]?.name ?? locale;
};

/**
 * Check if locale uses RTL script
 */
export const localeIsRTL = (locale: SupportedLocale): boolean => {
  return localeConfig[locale]?.direction === 'rtl';
};

/**
 * Get the BCP 47 locale tag for Intl APIs
 */
export const getBCP47Locale = (locale: SupportedLocale): string => {
  return localeConfig[locale]?.locale ?? locale;
};

/**
 * Get the default calendar for a locale
 */
export const getDefaultCalendar = (locale: SupportedLocale): string => {
  return localeConfig[locale]?.calendar ?? 'gregorian';
};

/**
 * Get the default numeral system for a locale
 */
export const getDefaultNumeralSystem = (locale: SupportedLocale): string => {
  return localeConfig[locale]?.numeralSystem ?? 'latn';
};

// Initialize locale on module load (if in browser)
if (typeof window !== 'undefined') {
  // Defer initialization to avoid blocking
  Promise.resolve().then(() => {
    initLocale();
  });
}

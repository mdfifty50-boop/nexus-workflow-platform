/**
 * i18n Configuration for Nexus
 *
 * Supports:
 * - English (en) - Primary language
 * - Arabic (ar) - Kuwaiti dialect, RTL support
 *
 * Usage:
 * 1. Import this file in main.tsx before rendering
 * 2. Use useTranslation() hook in components
 * 3. Use t('key') to get translated strings
 *
 * Example:
 *   import { useTranslation } from 'react-i18next'
 *   const { t } = useTranslation()
 *   return <button>{t('common.submit')}</button>
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import translation files
import en from './locales/en.json'
import ar from './locales/ar.json'

// Language configuration
export const supportedLanguages = ['en', 'ar'] as const
export type SupportedLanguage = typeof supportedLanguages[number]

export const languageConfig: Record<SupportedLanguage, {
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  locale: string
}> = {
  en: {
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    locale: 'en-US'
  },
  ar: {
    name: 'Arabic (Kuwait)',
    nativeName: 'العربية (الكويت)',
    direction: 'rtl',
    locale: 'ar-KW'
  }
}

// Detect user's preferred language
const detectLanguage = (): SupportedLanguage => {
  // 1. Check localStorage for saved preference
  const saved = localStorage.getItem('nexus_language')
  if (saved && supportedLanguages.includes(saved as SupportedLanguage)) {
    return saved as SupportedLanguage
  }

  // 2. Check browser language
  const browserLang = navigator.language.split('-')[0]
  if (supportedLanguages.includes(browserLang as SupportedLanguage)) {
    return browserLang as SupportedLanguage
  }

  // 3. Default to English
  return 'en'
}

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar }
    },
    lng: detectLanguage(),
    fallbackLng: 'en',

    interpolation: {
      escapeValue: false // React already escapes values
    },

    // Enable debug in development
    debug: import.meta.env.DEV,

    // React-specific options
    react: {
      useSuspense: true
    },

    // Pluralization configuration
    // English uses 'one' and 'other' (standard)
    // Arabic uses 'zero', 'one', 'two', 'few', 'many', 'other' (complex pluralization)
    pluralSeparator: '_',
    contextSeparator: '_',

    // Custom plural rules for Arabic
    // Arabic has 6 plural forms: zero, one, two, few (3-10), many (11-99), other (100+)
    returnNull: false,
    returnEmptyString: false
  })

// Apply RTL direction to document when language changes
i18n.on('languageChanged', (lng: string) => {
  const config = languageConfig[lng as SupportedLanguage]
  if (config) {
    document.documentElement.dir = config.direction
    document.documentElement.lang = lng
    localStorage.setItem('nexus_language', lng)
  }
})

// Set initial direction on load
const initialConfig = languageConfig[i18n.language as SupportedLanguage]
if (initialConfig) {
  document.documentElement.dir = initialConfig.direction
  document.documentElement.lang = i18n.language
}

export default i18n

// Utility function to change language
export const changeLanguage = async (lng: SupportedLanguage) => {
  await i18n.changeLanguage(lng)
}

// Utility to get current language config
export const getCurrentLanguageConfig = () => {
  return languageConfig[i18n.language as SupportedLanguage] || languageConfig.en
}

// Check if current language is RTL
export const isRTL = () => {
  return getCurrentLanguageConfig().direction === 'rtl'
}

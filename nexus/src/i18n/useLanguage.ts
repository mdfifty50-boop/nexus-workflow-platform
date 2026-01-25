/**
 * useLanguage Hook
 *
 * Provides language switching functionality and RTL support utilities.
 *
 * Usage:
 *   const { language, changeLanguage, isRTL, languages } = useLanguage()
 *
 *   // Switch language
 *   changeLanguage('ar')
 *
 *   // Check if RTL
 *   if (isRTL) { ... }
 *
 *   // Render language selector
 *   languages.map(lang => (
 *     <button onClick={() => changeLanguage(lang.code)}>
 *       {lang.nativeName}
 *     </button>
 *   ))
 */

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  supportedLanguages,
  languageConfig,
  type SupportedLanguage,
  changeLanguage as i18nChangeLanguage
} from './index'

export interface LanguageOption {
  code: SupportedLanguage
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  locale: string
}

export function useLanguage() {
  const { i18n } = useTranslation()

  const language = i18n.language as SupportedLanguage

  const isRTL = useMemo(() => {
    const config = languageConfig[language]
    return config?.direction === 'rtl'
  }, [language])

  const changeLanguage = useCallback(async (lng: SupportedLanguage) => {
    await i18nChangeLanguage(lng)
  }, [])

  const toggleLanguage = useCallback(async () => {
    const nextLang = language === 'en' ? 'ar' : 'en'
    await changeLanguage(nextLang)
  }, [language, changeLanguage])

  const languages: LanguageOption[] = useMemo(() => {
    return supportedLanguages.map(code => ({
      code,
      ...languageConfig[code]
    }))
  }, [])

  const currentLanguageConfig = useMemo(() => {
    return languageConfig[language] || languageConfig.en
  }, [language])

  return {
    language,
    isRTL,
    changeLanguage,
    toggleLanguage,
    languages,
    currentLanguageConfig
  }
}

/**
 * RTL-aware className utility
 *
 * Swaps left/right classes based on current direction.
 *
 * Usage:
 *   className={rtlClass('ml-4', 'mr-4')} // Returns 'ml-4' for LTR, 'mr-4' for RTL
 */
export function useRTLClass() {
  const { isRTL } = useLanguage()

  return useCallback((ltrClass: string, rtlClass: string) => {
    return isRTL ? rtlClass : ltrClass
  }, [isRTL])
}

/**
 * RTL-aware style utility
 *
 * Returns appropriate style based on direction.
 *
 * Usage:
 *   style={rtlStyle({ left: 0 }, { right: 0 })}
 */
export function useRTLStyle() {
  const { isRTL } = useLanguage()

  return useCallback(<T extends Record<string, unknown>>(
    ltrStyle: T,
    rtlStyle: T
  ): T => {
    return isRTL ? rtlStyle : ltrStyle
  }, [isRTL])
}

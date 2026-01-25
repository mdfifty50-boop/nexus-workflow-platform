/**
 * LanguageSwitcher Component
 *
 * A dropdown/toggle for switching between supported languages.
 * Supports both dropdown mode and simple toggle mode.
 *
 * Usage:
 *   <LanguageSwitcher />                    // Toggle button
 *   <LanguageSwitcher variant="dropdown" /> // Dropdown selector
 */

import { useState, useRef, useEffect } from 'react'
import { useLanguage, type LanguageOption } from '@/i18n/useLanguage'

interface LanguageSwitcherProps {
  variant?: 'toggle' | 'dropdown'
  className?: string
  showFlag?: boolean
  showNativeName?: boolean
}

export function LanguageSwitcher({
  variant = 'toggle',
  className = '',
  showFlag = true,
  showNativeName = true
}: LanguageSwitcherProps) {
  const { language, changeLanguage, toggleLanguage, languages, currentLanguageConfig } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Language flags/icons
  const languageFlags: Record<string, string> = {
    en: '🇺🇸',
    ar: '🇰🇼'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageSelect = async (lang: LanguageOption) => {
    await changeLanguage(lang.code)
    setIsOpen(false)
  }

  // Simple toggle mode
  if (variant === 'toggle') {
    return (
      <button
        onClick={toggleLanguage}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
          text-slate-400 hover:text-white hover:bg-slate-800 transition-all ${className}`}
        aria-label={`Switch to ${language === 'en' ? 'Arabic' : 'English'}`}
      >
        {showFlag && <span>{languageFlags[language]}</span>}
        {showNativeName && (
          <span className="hidden sm:inline">{currentLanguageConfig.nativeName}</span>
        )}
        {!showNativeName && (
          <span className="uppercase">{language}</span>
        )}
      </button>
    )
  }

  // Dropdown mode
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
          text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {showFlag && <span>{languageFlags[language]}</span>}
        {showNativeName && (
          <span className="hidden sm:inline">{currentLanguageConfig.nativeName}</span>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-full mt-1 right-0 w-48 bg-slate-800 border border-slate-700
            rounded-lg shadow-xl overflow-hidden z-50"
          role="listbox"
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors
                ${language === lang.code
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-300 hover:bg-slate-700'
                }`}
              role="option"
              aria-selected={language === lang.code}
            >
              {showFlag && <span className="text-lg">{languageFlags[lang.code]}</span>}
              <div className="flex flex-col items-start">
                <span className="font-medium">{lang.nativeName}</span>
                {lang.nativeName !== lang.name && (
                  <span className="text-xs text-slate-400">{lang.name}</span>
                )}
              </div>
              {language === lang.code && (
                <svg className="w-4 h-4 ml-auto text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

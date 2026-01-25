/**
 * RTLProvider - Context provider for RTL (Right-to-Left) layout support
 *
 * This component wraps the application and provides:
 * - Automatic RTL direction switching based on language
 * - Arabic font loading (Noto Sans Arabic)
 * - RTL-aware utility hooks and context
 *
 * Usage:
 *   // In main.tsx or App.tsx
 *   <RTLProvider>
 *     <App />
 *   </RTLProvider>
 *
 *   // In components
 *   const { isRTL, direction } = useRTL()
 */

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { languageConfig, type SupportedLanguage } from '@/i18n'

// Import RTL CSS styles
import '@/i18n/rtl.css'

interface RTLContextValue {
  isRTL: boolean
  direction: 'ltr' | 'rtl'
  language: SupportedLanguage
  fontFamily: string
}

const RTLContext = createContext<RTLContextValue>({
  isRTL: false,
  direction: 'ltr',
  language: 'en',
  fontFamily: 'Inter, sans-serif'
})

// Google Fonts URL for Noto Sans Arabic
const ARABIC_FONT_URL = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap'

interface RTLProviderProps {
  children: ReactNode
}

export function RTLProvider({ children }: RTLProviderProps) {
  const { i18n } = useTranslation()
  const language = i18n.language as SupportedLanguage

  const config = useMemo(() => {
    return languageConfig[language] || languageConfig.en
  }, [language])

  const isRTL = config.direction === 'rtl'

  // Load Arabic font when needed
  useEffect(() => {
    if (language === 'ar') {
      // Check if font is already loaded
      const existingLink = document.querySelector(`link[href="${ARABIC_FONT_URL}"]`)
      if (!existingLink) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = ARABIC_FONT_URL
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      }
    }
  }, [language])

  // Apply direction and font to document
  useEffect(() => {
    document.documentElement.dir = config.direction
    document.documentElement.lang = language

    // Apply appropriate font family
    if (language === 'ar') {
      document.documentElement.style.setProperty(
        '--font-family',
        '"Noto Sans Arabic", "Inter", sans-serif'
      )
      document.body.classList.add('font-arabic')
      document.body.classList.remove('font-sans')
    } else {
      document.documentElement.style.setProperty(
        '--font-family',
        '"Inter", sans-serif'
      )
      document.body.classList.add('font-sans')
      document.body.classList.remove('font-arabic')
    }
  }, [language, config.direction])

  const contextValue = useMemo<RTLContextValue>(() => ({
    isRTL,
    direction: config.direction,
    language,
    fontFamily: language === 'ar'
      ? '"Noto Sans Arabic", "Inter", sans-serif'
      : '"Inter", sans-serif'
  }), [isRTL, config.direction, language])

  return (
    <RTLContext.Provider value={contextValue}>
      <div
        className={`rtl-container ${isRTL ? 'rtl' : 'ltr'}`}
        dir={config.direction}
        style={{ fontFamily: contextValue.fontFamily }}
      >
        {children}
      </div>
    </RTLContext.Provider>
  )
}

/**
 * Hook to access RTL context values
 */
export function useRTL() {
  const context = useContext(RTLContext)
  if (!context) {
    throw new Error('useRTL must be used within an RTLProvider')
  }
  return context
}

/**
 * Utility component for RTL-aware flex direction
 * Automatically reverses flex-row in RTL mode
 */
interface RTLFlexProps {
  children: ReactNode
  className?: string
  reverse?: boolean // Force reverse regardless of RTL
}

export function RTLFlex({ children, className = '', reverse = false }: RTLFlexProps) {
  const { isRTL } = useRTL()
  const shouldReverse = reverse || isRTL

  return (
    <div className={`flex ${shouldReverse ? 'flex-row-reverse' : 'flex-row'} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Utility component for RTL-aware spacing
 * Swaps margin-left/margin-right based on direction
 */
interface RTLSpacerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  position?: 'start' | 'end'
}

export function RTLSpacer({ size = 'md', position = 'end' }: RTLSpacerProps) {
  const { isRTL } = useRTL()

  const sizeClasses = {
    sm: 'w-2',
    md: 'w-4',
    lg: 'w-6',
    xl: 'w-8'
  }

  const positionClasses = {
    start: isRTL ? 'mr-auto' : 'ml-auto',
    end: isRTL ? 'ml-auto' : 'mr-auto'
  }

  return <div className={`${sizeClasses[size]} ${positionClasses[position]}`} aria-hidden="true" />
}

/**
 * Utility function to get RTL-aware class names
 * @param ltrClass - Class to use in LTR mode
 * @param rtlClass - Class to use in RTL mode
 * @param isRTL - Current RTL state
 */
export function getRTLClass(ltrClass: string, rtlClass: string, isRTL: boolean): string {
  return isRTL ? rtlClass : ltrClass
}

/**
 * Utility function to get RTL-aware inline styles
 * Swaps left/right properties
 */
export function getRTLStyle<T extends Record<string, unknown>>(
  ltrStyle: T,
  rtlStyle: T,
  isRTL: boolean
): T {
  return isRTL ? rtlStyle : ltrStyle
}

export default RTLProvider

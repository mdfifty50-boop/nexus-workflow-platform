/**
 * RTL (Right-to-Left) Provider
 *
 * Context provider for managing RTL/LTR text direction across the application.
 * Supports dynamic direction switching, locale detection, and preference persistence.
 *
 * Usage:
 *   <RTLProvider>
 *     <App />
 *   </RTLProvider>
 *
 *   // In components
 *   const { isRTL, dir, toggleDirection } = useRTLContext()
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode
} from 'react'
import { isRTLLocale, RTL_LOCALES } from './rtl-utils'

// Direction type
type Direction = 'ltr' | 'rtl'

// Storage key for persisting preference
const RTL_STORAGE_KEY = 'nexus_rtl_direction'
const LOCALE_STORAGE_KEY = 'nexus_locale'

// RTL Context value interface
interface RTLContextValue {
  /** Whether current direction is RTL */
  isRTL: boolean
  /** Current direction ('ltr' or 'rtl') */
  dir: Direction
  /** Current locale code */
  locale: string
  /** Toggle between LTR and RTL */
  toggleDirection: () => void
  /** Set direction explicitly */
  setDirection: (dir: Direction) => void
  /** Set locale (auto-detects direction) */
  setLocale: (locale: string) => void
}

// Default context value
const defaultContextValue: RTLContextValue = {
  isRTL: false,
  dir: 'ltr',
  locale: 'en',
  toggleDirection: () => {},
  setDirection: () => {},
  setLocale: () => {}
}

// Create context
const RTLContext = createContext<RTLContextValue>(defaultContextValue)

// Provider props
interface RTLProviderProps {
  children: ReactNode
  /** Initial locale (defaults to browser locale or 'en') */
  initialLocale?: string
  /** Override initial direction (skips auto-detection) */
  initialDirection?: Direction
  /** Disable localStorage persistence */
  disablePersistence?: boolean
}

/**
 * Detect initial direction based on locale and stored preference
 */
function detectInitialState(
  initialLocale?: string,
  initialDirection?: Direction,
  disablePersistence?: boolean
): { dir: Direction; locale: string } {
  // If explicit direction provided, use it
  if (initialDirection) {
    const locale = initialLocale || (typeof navigator !== 'undefined' ? navigator.language : 'en')
    return { dir: initialDirection, locale }
  }

  // Check localStorage for saved preference
  if (!disablePersistence && typeof localStorage !== 'undefined') {
    const savedDir = localStorage.getItem(RTL_STORAGE_KEY) as Direction | null
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)

    if (savedDir && savedLocale) {
      return { dir: savedDir, locale: savedLocale }
    }
  }

  // Auto-detect from provided locale
  if (initialLocale) {
    return {
      dir: isRTLLocale(initialLocale) ? 'rtl' : 'ltr',
      locale: initialLocale
    }
  }

  // Auto-detect from browser
  if (typeof navigator !== 'undefined') {
    const browserLocale = navigator.language
    return {
      dir: isRTLLocale(browserLocale) ? 'rtl' : 'ltr',
      locale: browserLocale
    }
  }

  // Default fallback
  return { dir: 'ltr', locale: 'en' }
}

/**
 * RTL Provider Component
 *
 * Wraps application to provide RTL context throughout the component tree.
 */
export function RTLProvider({
  children,
  initialLocale,
  initialDirection,
  disablePersistence = false
}: RTLProviderProps) {
  // Initialize state from detection
  const initial = useMemo(
    () => detectInitialState(initialLocale, initialDirection, disablePersistence),
    [] // Only run once on mount
  )

  const [dir, setDir] = useState<Direction>(initial.dir)
  const [locale, setLocaleState] = useState<string>(initial.locale)

  // Persist preference to localStorage
  useEffect(() => {
    if (!disablePersistence && typeof localStorage !== 'undefined') {
      localStorage.setItem(RTL_STORAGE_KEY, dir)
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    }
  }, [dir, locale, disablePersistence])

  // Apply direction to document element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = dir
      document.documentElement.setAttribute('data-direction', dir)
    }
  }, [dir])

  // Apply locale to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Extract language code from locale (e.g., 'ar-KW' -> 'ar')
      const langCode = locale.split('-')[0]
      document.documentElement.lang = langCode
    }
  }, [locale])

  // Toggle direction
  const toggleDirection = useCallback(() => {
    setDir(prevDir => prevDir === 'ltr' ? 'rtl' : 'ltr')
  }, [])

  // Set direction explicitly
  const setDirection = useCallback((newDir: Direction) => {
    setDir(newDir)
  }, [])

  // Set locale and auto-detect direction
  const setLocale = useCallback((newLocale: string) => {
    setLocaleState(newLocale)
    setDir(isRTLLocale(newLocale) ? 'rtl' : 'ltr')
  }, [])

  // Memoized context value
  const contextValue = useMemo<RTLContextValue>(() => ({
    isRTL: dir === 'rtl',
    dir,
    locale,
    toggleDirection,
    setDirection,
    setLocale
  }), [dir, locale, toggleDirection, setDirection, setLocale])

  return (
    <RTLContext.Provider value={contextValue}>
      {children}
    </RTLContext.Provider>
  )
}

/**
 * Hook to access RTL context
 *
 * @throws Error if used outside RTLProvider
 */
export function useRTLContext(): RTLContextValue {
  const context = useContext(RTLContext)

  if (context === defaultContextValue) {
    console.warn(
      'useRTLContext: No RTLProvider found in component tree. ' +
      'Falling back to default LTR direction.'
    )
  }

  return context
}

/**
 * Hook that returns just the isRTL boolean
 * Convenience wrapper for common use case
 */
export function useIsRTL(): boolean {
  const { isRTL } = useRTLContext()
  return isRTL
}

/**
 * Hook that returns just the direction
 * Convenience wrapper for common use case
 */
export function useDirection(): Direction {
  const { dir } = useRTLContext()
  return dir
}

// Re-export RTL_LOCALES for convenience
export { RTL_LOCALES }

// Export context for advanced use cases (testing, etc.)
export { RTLContext }

// Default export
export default RTLProvider

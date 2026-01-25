/**
 * Theme Context
 *
 * Manages dark/light mode theme with system preference detection
 * and localStorage persistence.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

// =============================================================================
// TYPES
// =============================================================================

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextType {
  /** Current theme mode setting */
  mode: ThemeMode
  /** Actual resolved theme (light or dark) */
  resolvedTheme: 'light' | 'dark'
  /** Set the theme mode */
  setMode: (mode: ThemeMode) => void
  /** Toggle between light and dark */
  toggle: () => void
  /** Is dark mode active */
  isDark: boolean
}

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = createContext<ThemeContextType | null>(null)

const STORAGE_KEY = 'nexus_theme_mode'

// =============================================================================
// PROVIDER
// =============================================================================

interface ThemeProviderProps {
  children: ReactNode
  /** Default theme mode */
  defaultMode?: ThemeMode
}

export function ThemeProvider({ children, defaultMode = 'dark' }: ThemeProviderProps) {
  // Initialize from localStorage or default
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return defaultMode
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    return stored || defaultMode
  })

  // Track system preference
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // Resolve the actual theme
  const resolvedTheme = mode === 'system' ? systemTheme : mode
  const isDark = resolvedTheme === 'dark'

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement

    // Remove both classes first
    root.classList.remove('light', 'dark')

    // Add the resolved theme class
    root.classList.add(resolvedTheme)

    // Update color-scheme for native elements
    root.style.colorScheme = resolvedTheme

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#0f172a' : '#ffffff'
      )
    }
  }, [resolvedTheme])

  // Set mode and persist
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem(STORAGE_KEY, newMode)
  }, [])

  // Toggle between light and dark
  const toggle = useCallback(() => {
    const newMode = resolvedTheme === 'dark' ? 'light' : 'dark'
    setMode(newMode)
  }, [resolvedTheme, setMode])

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode, toggle, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

// =============================================================================
// HOOK
// =============================================================================

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// =============================================================================
// THEME TOGGLE COMPONENT
// =============================================================================

interface ThemeToggleProps {
  /** Show label text */
  showLabel?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Custom className */
  className?: string
}

export function ThemeToggle({ showLabel = false, size = 'md', className = '' }: ThemeToggleProps) {
  const { isDark, toggle, mode, setMode: _setMode } = useTheme()

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={toggle}
        className={`${sizes[size]} rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-all hover:scale-105 active:scale-95`}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <SunIcon className={`${iconSizes[size]} text-yellow-500`} />
        ) : (
          <MoonIcon className={`${iconSizes[size]} text-blue-500`} />
        )}
      </button>
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {mode === 'system' ? 'System' : isDark ? 'Dark' : 'Light'} mode
        </span>
      )}
    </div>
  )
}

// =============================================================================
// THEME SELECTOR COMPONENT (for settings)
// =============================================================================

interface ThemeSelectorProps {
  className?: string
}

export function ThemeSelector({ className = '' }: ThemeSelectorProps) {
  const { mode, setMode, resolvedTheme } = useTheme()

  const options: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <SunIcon className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <MoonIcon className="w-4 h-4" /> },
    { value: 'system', label: 'System', icon: <ComputerIcon className="w-4 h-4" /> }
  ]

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium">Theme</label>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => setMode(option.value)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
              mode === option.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 border-border hover:bg-muted'
            }`}
            aria-pressed={mode === option.value}
          >
            {option.icon}
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {mode === 'system'
          ? `Using ${resolvedTheme} mode based on your system preference`
          : `${mode.charAt(0).toUpperCase() + mode.slice(1)} mode is active`
        }
      </p>
    </div>
  )
}

// =============================================================================
// ICONS
// =============================================================================

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  )
}

function ComputerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  )
}

export default ThemeProvider

/**
 * AccessibilityProvider - Unified Accessibility Features
 *
 * Combines high contrast mode, live regions, and other accessibility
 * features into a single provider for the application.
 *
 * @module components/AccessibilityProvider
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode
} from 'react'
import { LiveRegionProvider, useLiveRegion } from './LiveRegion'

// Import high contrast styles
import '../styles/high-contrast.css'

interface AccessibilitySettings {
  /** Whether high contrast mode is enabled */
  highContrastMode: boolean
  /** Whether to reduce motion/animations */
  reduceMotion: boolean
  /** Font size scale factor (1 = default) */
  fontScale: number
  /** Whether to show focus indicators always (not just on keyboard nav) */
  alwaysShowFocus: boolean
}

interface AccessibilityContextType extends AccessibilitySettings {
  /** Toggle high contrast mode */
  toggleHighContrast: () => void
  /** Set high contrast mode */
  setHighContrastMode: (enabled: boolean) => void
  /** Toggle reduced motion */
  toggleReduceMotion: () => void
  /** Set font scale */
  setFontScale: (scale: number) => void
  /** Toggle always show focus */
  toggleAlwaysShowFocus: () => void
  /** Reset all settings to defaults */
  resetSettings: () => void
}

const defaultSettings: AccessibilitySettings = {
  highContrastMode: false,
  reduceMotion: false,
  fontScale: 1,
  alwaysShowFocus: false
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

/**
 * Hook to access accessibility settings and controls
 */
export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

// Storage key for persisting settings
const STORAGE_KEY = 'nexus_accessibility_settings'

interface AccessibilityProviderProps {
  children: ReactNode
}

/**
 * Provider component for accessibility features
 * Wraps the entire application to provide accessibility controls
 */
export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          return { ...defaultSettings, ...JSON.parse(stored) }
        } catch {
          // Invalid JSON, use defaults
        }
      }

      // Check for system preferences
      const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      return {
        ...defaultSettings,
        highContrastMode: prefersHighContrast,
        reduceMotion: prefersReducedMotion
      }
    }
    return defaultSettings
  })

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  // Apply high contrast mode to document
  useEffect(() => {
    const root = document.documentElement
    if (settings.highContrastMode) {
      root.classList.add('high-contrast-mode')
      root.setAttribute('data-theme', 'high-contrast')
    } else {
      root.classList.remove('high-contrast-mode')
      root.removeAttribute('data-theme')
    }
  }, [settings.highContrastMode])

  // Apply reduced motion setting
  useEffect(() => {
    const root = document.documentElement
    if (settings.reduceMotion) {
      root.style.setProperty('--animation-duration', '0.01ms')
      root.style.setProperty('--transition-duration', '0.01ms')
    } else {
      root.style.removeProperty('--animation-duration')
      root.style.removeProperty('--transition-duration')
    }
  }, [settings.reduceMotion])

  // Apply font scale
  useEffect(() => {
    document.documentElement.style.fontSize = `${settings.fontScale * 100}%`
  }, [settings.fontScale])

  // Apply always show focus setting
  useEffect(() => {
    const root = document.documentElement
    if (settings.alwaysShowFocus) {
      root.classList.add('always-show-focus')
    } else {
      root.classList.remove('always-show-focus')
    }
  }, [settings.alwaysShowFocus])

  // Listen for system preference changes
  useEffect(() => {
    const contrastQuery = window.matchMedia('(prefers-contrast: more)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, highContrastMode: e.matches }))
    }

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, reduceMotion: e.matches }))
    }

    contrastQuery.addEventListener('change', handleContrastChange)
    motionQuery.addEventListener('change', handleMotionChange)

    return () => {
      contrastQuery.removeEventListener('change', handleContrastChange)
      motionQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  const toggleHighContrast = useCallback(() => {
    setSettings(prev => ({ ...prev, highContrastMode: !prev.highContrastMode }))
  }, [])

  const setHighContrastMode = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, highContrastMode: enabled }))
  }, [])

  const toggleReduceMotion = useCallback(() => {
    setSettings(prev => ({ ...prev, reduceMotion: !prev.reduceMotion }))
  }, [])

  const setFontScale = useCallback((scale: number) => {
    const clampedScale = Math.max(0.75, Math.min(2, scale))
    setSettings(prev => ({ ...prev, fontScale: clampedScale }))
  }, [])

  const toggleAlwaysShowFocus = useCallback(() => {
    setSettings(prev => ({ ...prev, alwaysShowFocus: !prev.alwaysShowFocus }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const contextValue: AccessibilityContextType = {
    ...settings,
    toggleHighContrast,
    setHighContrastMode,
    toggleReduceMotion,
    setFontScale,
    toggleAlwaysShowFocus,
    resetSettings
  }

  return (
    <AccessibilityContext.Provider value={contextValue}>
      <LiveRegionProvider>
        {children}
      </LiveRegionProvider>
    </AccessibilityContext.Provider>
  )
}

/**
 * Accessibility settings panel component for the settings page
 */
export function AccessibilitySettingsPanel() {
  const {
    highContrastMode,
    reduceMotion,
    fontScale,
    alwaysShowFocus,
    toggleHighContrast,
    toggleReduceMotion,
    setFontScale,
    toggleAlwaysShowFocus,
    resetSettings
  } = useAccessibility()

  const { announceSuccess } = useLiveRegion()

  const handleToggleHighContrast = () => {
    toggleHighContrast()
    announceSuccess(highContrastMode ? 'High contrast mode disabled' : 'High contrast mode enabled')
  }

  const handleToggleReduceMotion = () => {
    toggleReduceMotion()
    announceSuccess(reduceMotion ? 'Animations enabled' : 'Animations reduced')
  }

  const handleToggleAlwaysShowFocus = () => {
    toggleAlwaysShowFocus()
    announceSuccess(alwaysShowFocus ? 'Focus indicators set to keyboard only' : 'Focus indicators always visible')
  }

  const handleReset = () => {
    resetSettings()
    announceSuccess('Accessibility settings reset to defaults')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Accessibility Settings</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Customize the interface to better suit your needs.
        </p>
      </div>

      {/* High Contrast Mode */}
      <div className="flex items-center justify-between py-3 border-b border-border">
        <div>
          <label htmlFor="high-contrast-toggle" className="font-medium">
            High Contrast Mode
          </label>
          <p className="text-sm text-muted-foreground">
            Increase contrast for better visibility
          </p>
        </div>
        <button
          id="high-contrast-toggle"
          role="switch"
          aria-checked={highContrastMode}
          onClick={handleToggleHighContrast}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            ${highContrastMode ? 'bg-primary' : 'bg-muted'}
          `}
        >
          <span className="sr-only">Toggle high contrast mode</span>
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${highContrastMode ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Reduced Motion */}
      <div className="flex items-center justify-between py-3 border-b border-border">
        <div>
          <label htmlFor="reduce-motion-toggle" className="font-medium">
            Reduce Motion
          </label>
          <p className="text-sm text-muted-foreground">
            Minimize animations and transitions
          </p>
        </div>
        <button
          id="reduce-motion-toggle"
          role="switch"
          aria-checked={reduceMotion}
          onClick={handleToggleReduceMotion}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            ${reduceMotion ? 'bg-primary' : 'bg-muted'}
          `}
        >
          <span className="sr-only">Toggle reduced motion</span>
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${reduceMotion ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Font Size */}
      <div className="py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <label htmlFor="font-scale" className="font-medium">
              Font Size
            </label>
            <p className="text-sm text-muted-foreground">
              Adjust text size ({Math.round(fontScale * 100)}%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setFontScale(fontScale - 0.1)}
            disabled={fontScale <= 0.75}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50"
            aria-label="Decrease font size"
          >
            <span aria-hidden="true">A-</span>
          </button>
          <input
            id="font-scale"
            type="range"
            min="0.75"
            max="2"
            step="0.1"
            value={fontScale}
            onChange={(e) => setFontScale(parseFloat(e.target.value))}
            className="flex-1"
            aria-valuemin={75}
            aria-valuemax={200}
            aria-valuenow={Math.round(fontScale * 100)}
            aria-valuetext={`${Math.round(fontScale * 100)} percent`}
          />
          <button
            onClick={() => setFontScale(fontScale + 0.1)}
            disabled={fontScale >= 2}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50"
            aria-label="Increase font size"
          >
            <span aria-hidden="true">A+</span>
          </button>
        </div>
      </div>

      {/* Always Show Focus */}
      <div className="flex items-center justify-between py-3 border-b border-border">
        <div>
          <label htmlFor="always-focus-toggle" className="font-medium">
            Always Show Focus
          </label>
          <p className="text-sm text-muted-foreground">
            Show focus indicators for mouse users too
          </p>
        </div>
        <button
          id="always-focus-toggle"
          role="switch"
          aria-checked={alwaysShowFocus}
          onClick={handleToggleAlwaysShowFocus}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            ${alwaysShowFocus ? 'bg-primary' : 'bg-muted'}
          `}
        >
          <span className="sr-only">Toggle always show focus indicators</span>
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${alwaysShowFocus ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Reset Button */}
      <div className="pt-4">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}

export default AccessibilityProvider

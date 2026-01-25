import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/contexts/ToastContext'

interface AppearanceSettingsProps {
  className?: string
}

type Theme = 'light' | 'dark' | 'system'
type FontSize = 'small' | 'medium' | 'large'
type Density = 'compact' | 'comfortable' | 'spacious'
type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink'

const ACCENT_COLORS: { value: AccentColor; label: string; color: string }[] = [
  { value: 'blue', label: 'Blue', color: '#3b82f6' },
  { value: 'purple', label: 'Purple', color: '#8b5cf6' },
  { value: 'green', label: 'Green', color: '#22c55e' },
  { value: 'orange', label: 'Orange', color: '#f97316' },
  { value: 'red', label: 'Red', color: '#ef4444' },
  { value: 'pink', label: 'Pink', color: '#ec4899' },
]

export function AppearanceSettings({ className }: AppearanceSettingsProps) {
  const toast = useToast()

  // Load saved preferences
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('nexus_theme') as Theme) || 'dark'
  })
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (localStorage.getItem('nexus_fontSize') as FontSize) || 'medium'
  })
  const [density, setDensity] = useState<Density>(() => {
    return (localStorage.getItem('nexus_density') as Density) || 'comfortable'
  })
  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    return (localStorage.getItem('nexus_accentColor') as AccentColor) || 'purple'
  })
  const [animations, setAnimations] = useState(() => {
    return localStorage.getItem('nexus_animations') !== 'false'
  })
  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('nexus_reducedMotion') === 'true'
  })

  // Apply theme changes in real-time
  useEffect(() => {
    const root = document.documentElement

    // Apply theme
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.toggle('dark', systemTheme === 'dark')
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }

    localStorage.setItem('nexus_theme', theme)
  }, [theme])

  // Apply font size changes
  useEffect(() => {
    const root = document.documentElement
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }
    root.style.fontSize = sizes[fontSize]
    localStorage.setItem('nexus_fontSize', fontSize)
  }, [fontSize])

  // Apply density changes
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-density', density)
    localStorage.setItem('nexus_density', density)
  }, [density])

  // Apply accent color changes
  useEffect(() => {
    const root = document.documentElement
    const color = ACCENT_COLORS.find(c => c.value === accentColor)?.color || '#8b5cf6'
    root.style.setProperty('--accent-color', color)
    localStorage.setItem('nexus_accentColor', accentColor)
  }, [accentColor])

  // Apply animation preferences
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--animation-duration', animations ? '200ms' : '0ms')
    localStorage.setItem('nexus_animations', String(animations))
  }, [animations])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('reduce-motion', reducedMotion)
    localStorage.setItem('nexus_reducedMotion', String(reducedMotion))
  }, [reducedMotion])

  const handleResetDefaults = () => {
    setTheme('dark')
    setFontSize('medium')
    setDensity('comfortable')
    setAccentColor('purple')
    setAnimations(true)
    setReducedMotion(false)
    toast.success('Defaults restored', 'Appearance settings have been reset to defaults')
  }

  return (
    <div className={className}>
      <div className="space-y-8">
        {/* Theme Selection */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Theme</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'light' as Theme, label: 'Light', icon: '☀️' },
              { value: 'dark' as Theme, label: 'Dark', icon: '🌙' },
              { value: 'system' as Theme, label: 'System', icon: '💻' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`
                  p-4 rounded-lg border-2 transition-all text-center
                  ${theme === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <span className="text-2xl block mb-2">{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Live Preview */}
          <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Preview</p>
            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'} border border-border`}>
              <h4 className="font-semibold mb-1">Sample Content</h4>
              <p className="text-sm opacity-70">This is how text will appear in your selected theme.</p>
            </div>
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Font Size</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {[
                { value: 'small' as FontSize, label: 'Small', sample: 'Aa' },
                { value: 'medium' as FontSize, label: 'Medium', sample: 'Aa' },
                { value: 'large' as FontSize, label: 'Large', sample: 'Aa' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFontSize(option.value)}
                  className={`
                    flex-1 p-4 rounded-lg border-2 transition-all text-center
                    ${fontSize === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <span
                    className="block mb-2 font-serif"
                    style={{
                      fontSize: option.value === 'small' ? '14px' : option.value === 'medium' ? '18px' : '22px'
                    }}
                  >
                    {option.sample}
                  </span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Font Size Preview */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p
                className="transition-all"
                style={{
                  fontSize: fontSize === 'small' ? '14px' : fontSize === 'medium' ? '16px' : '18px'
                }}
              >
                This is sample text showing your selected font size. The interface will adapt to your preference.
              </p>
            </div>
          </div>
        </div>

        {/* Density */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Interface Density</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'compact' as Density, label: 'Compact', desc: 'More content, less spacing' },
              { value: 'comfortable' as Density, label: 'Comfortable', desc: 'Balanced spacing' },
              { value: 'spacious' as Density, label: 'Spacious', desc: 'More breathing room' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDensity(option.value)}
                className={`
                  p-4 rounded-lg border-2 transition-all text-center
                  ${density === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div
                  className="mb-3 mx-auto space-y-1"
                  style={{
                    gap: option.value === 'compact' ? '2px' : option.value === 'comfortable' ? '4px' : '8px'
                  }}
                >
                  <div className={`h-2 bg-muted-foreground/30 rounded ${option.value === 'compact' ? 'w-full' : 'w-3/4'}`} />
                  <div className={`h-2 bg-muted-foreground/30 rounded ${option.value === 'compact' ? 'w-3/4' : 'w-1/2'}`} />
                  <div className={`h-2 bg-muted-foreground/30 rounded ${option.value === 'compact' ? 'w-1/2' : 'w-2/3'}`} />
                </div>
                <span className="text-sm font-medium block">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Accent Color</h3>
          <div className="flex gap-3 flex-wrap">
            {ACCENT_COLORS.map((option) => (
              <button
                key={option.value}
                onClick={() => setAccentColor(option.value)}
                className={`
                  w-12 h-12 rounded-full transition-all relative
                  ${accentColor === option.value
                    ? 'ring-2 ring-offset-2 ring-offset-background ring-white scale-110'
                    : 'hover:scale-105'
                  }
                `}
                style={{ backgroundColor: option.color }}
                title={option.label}
              >
                {accentColor === option.value && (
                  <svg className="w-5 h-5 text-white absolute inset-0 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Selected: {ACCENT_COLORS.find(c => c.value === accentColor)?.label}
          </p>
        </div>

        {/* Animation Preferences */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Motion & Animations</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <Label className="font-medium">Enable animations</Label>
                <p className="text-sm text-muted-foreground">Smooth transitions and micro-interactions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={animations}
                  onChange={(e) => setAnimations(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <Label className="font-medium">Reduce motion</Label>
                <p className="text-sm text-muted-foreground">Minimize animation effects for accessibility</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Reset to Defaults */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleResetDefaults}>
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  )
}

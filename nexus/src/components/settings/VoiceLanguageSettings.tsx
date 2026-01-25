import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/contexts/ToastContext'

interface VoiceLanguageSettingsProps {
  className?: string
}

type Language = 'en' | 'ar' | 'fr' | 'es' | 'de'
type Dialect = 'standard' | 'kuwaiti' | 'egyptian' | 'gulf' | 'levantine' | 'moroccan'
type VoiceGender = 'male' | 'female'

interface VoicePreferences {
  language: Language
  dialect: Dialect
  voiceGender: VoiceGender
  speed: number
}

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'de', label: 'German', flag: '🇩🇪' },
]

const DIALECTS: Record<Language, { value: Dialect; label: string }[]> = {
  en: [
    { value: 'standard', label: 'Standard English' },
  ],
  ar: [
    { value: 'standard', label: 'Modern Standard Arabic' },
    { value: 'kuwaiti', label: 'Kuwaiti' },
    { value: 'egyptian', label: 'Egyptian' },
    { value: 'gulf', label: 'Gulf Arabic' },
    { value: 'levantine', label: 'Levantine' },
    { value: 'moroccan', label: 'Moroccan' },
  ],
  fr: [
    { value: 'standard', label: 'Standard French' },
  ],
  es: [
    { value: 'standard', label: 'Standard Spanish' },
  ],
  de: [
    { value: 'standard', label: 'Standard German' },
  ],
}

const DEFAULT_PREFERENCES: VoicePreferences = {
  language: 'en',
  dialect: 'standard',
  voiceGender: 'female',
  speed: 1,
}

export function VoiceLanguageSettings({ className }: VoiceLanguageSettingsProps) {
  const toast = useToast()

  // Load saved preferences
  const [preferences, setPreferences] = useState<VoicePreferences>(() => {
    const saved = localStorage.getItem('nexus_voicePreferences')
    if (saved) {
      try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) }
      } catch {
        return DEFAULT_PREFERENCES
      }
    }
    return DEFAULT_PREFERENCES
  })

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)

  // Get available dialects for current language
  const availableDialects = DIALECTS[preferences.language] || DIALECTS['en']

  // Ensure dialect is valid for current language
  useEffect(() => {
    const validDialect = availableDialects.find(d => d.value === preferences.dialect)
    if (!validDialect) {
      setPreferences(prev => ({
        ...prev,
        dialect: availableDialects[0].value
      }))
    }
  }, [preferences.language, availableDialects])

  // Save preferences to localStorage
  const savePreference = (updates: Partial<VoicePreferences>) => {
    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)
    localStorage.setItem('nexus_voicePreferences', JSON.stringify(newPreferences))
  }

  const handleLanguageChange = (language: Language) => {
    const newDialect = DIALECTS[language][0].value
    savePreference({ language, dialect: newDialect })
    toast.info('Language updated', `Switched to ${LANGUAGES.find(l => l.value === language)?.label}`)
  }

  const handleDialectChange = (dialect: Dialect) => {
    savePreference({ dialect })
    const dialectLabel = availableDialects.find(d => d.value === dialect)?.label
    toast.info('Dialect updated', `Switched to ${dialectLabel}`)
  }

  const handleVoiceGenderChange = (voiceGender: VoiceGender) => {
    savePreference({ voiceGender })
    toast.info('Voice updated', `Switched to ${voiceGender === 'male' ? 'Male' : 'Female'} voice`)
  }

  const handleSpeedChange = (speed: number) => {
    savePreference({ speed })
  }

  const playPreview = async () => {
    if (isPreviewPlaying) return

    setIsPreviewPlaying(true)
    try {
      // Sample text in different languages
      const sampleText: Record<Language, string> = {
        en: "This is a preview of the voice settings. Adjust the language, dialect, voice type, and speed to your preference.",
        ar: "هذا هو معاينة لإعدادات الصوت. قم بضبط اللغة والهجة ونوع الصوت والسرعة حسب تفضيلك.",
        fr: "Ceci est un aperçu des paramètres de voix. Ajustez la langue, le dialecte, le type de voix et la vitesse selon vos préférences.",
        es: "Esta es una vista previa de la configuración de voz. Ajuste el idioma, dialecto, tipo de voz y velocidad según su preferencia.",
        de: "Dies ist eine Vorschau der Spracheinstellungen. Passen Sie Sprache, Dialekt, Stimmtyp und Geschwindigkeit nach Ihren Wünschen an.",
      }

      const text = sampleText[preferences.language]

      // Simulate speech synthesis with Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = preferences.language
        utterance.rate = preferences.speed
        utterance.pitch = preferences.voiceGender === 'female' ? 1.2 : 0.8

        utterance.onend = () => {
          setIsPreviewPlaying(false)
          toast.success('Preview finished', 'Voice preview completed')
        }

        utterance.onerror = () => {
          setIsPreviewPlaying(false)
          toast.error('Preview failed', 'Could not play voice preview')
        }

        window.speechSynthesis.cancel() // Cancel any previous speech
        window.speechSynthesis.speak(utterance)
      } else {
        toast.error('Not supported', 'Speech synthesis is not available in your browser')
        setIsPreviewPlaying(false)
      }
    } catch (error) {
      toast.error('Preview error', 'An error occurred during preview')
      setIsPreviewPlaying(false)
    }
  }

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset voice settings to defaults?')) {
      setPreferences(DEFAULT_PREFERENCES)
      localStorage.setItem('nexus_voicePreferences', JSON.stringify(DEFAULT_PREFERENCES))
      toast.success('Settings reset', 'Voice settings have been reset to defaults')
    }
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Language Selection */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Language</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                onClick={() => handleLanguageChange(lang.value)}
                className={`
                  p-4 rounded-lg border-2 transition-all text-center
                  ${preferences.language === lang.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <span className="text-2xl block mb-2">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dialect Selection */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Dialect Preference</h3>
          <div className="space-y-3">
            {availableDialects.length === 1 ? (
              <div className="p-4 rounded-lg bg-muted/30 border border-border text-sm text-muted-foreground">
                Only standard dialect available for {LANGUAGES.find(l => l.value === preferences.language)?.label}
              </div>
            ) : (
              <div className="space-y-2">
                {availableDialects.map((dialect) => (
                  <label
                    key={dialect.value}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="dialect"
                      value={dialect.value}
                      checked={preferences.dialect === dialect.value}
                      onChange={() => handleDialectChange(dialect.value)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="font-medium">{dialect.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Voice Gender Selection */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Voice Type</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: 'female' as VoiceGender, label: 'Female', icon: '👩' },
              { value: 'male' as VoiceGender, label: 'Male', icon: '👨' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleVoiceGenderChange(option.value)}
                className={`
                  p-4 rounded-lg border-2 transition-all text-center
                  ${preferences.voiceGender === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <span className="text-3xl block mb-2">{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Speed Control */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Speech Speed</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐢</span>
                <Label htmlFor="speed-slider" className="text-sm text-muted-foreground">
                  Speed
                </Label>
                <span className="text-2xl">🐇</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold">{(preferences.speed * 100).toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">
                  {preferences.speed < 0.8 ? 'Slow' : preferences.speed < 1.2 ? 'Normal' : 'Fast'}
                </div>
              </div>
            </div>

            <input
              id="speed-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={preferences.speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.5x</span>
              <span>1x</span>
              <span>2x</span>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Voice Preview</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Click below to hear how the voice will sound with your current settings.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={playPreview}
              disabled={isPreviewPlaying}
              className="flex-1 sm:flex-none"
              size="lg"
            >
              <span className="mr-2">{isPreviewPlaying ? '⏸️' : '▶️'}</span>
              {isPreviewPlaying ? 'Playing...' : 'Play Preview'}
            </Button>
            {isPreviewPlaying && (
              <div className="flex items-center gap-2 flex-1 justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">
                  {preferences.language === 'ar' ? 'تشغيل...' : 'Playing...'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Current Settings Summary */}
        <div className="bg-muted/30 border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Current Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="text-xs text-muted-foreground mb-1">Language</div>
              <div className="font-semibold">
                {LANGUAGES.find(l => l.value === preferences.language)?.label}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="text-xs text-muted-foreground mb-1">Dialect</div>
              <div className="font-semibold">
                {availableDialects.find(d => d.value === preferences.dialect)?.label}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="text-xs text-muted-foreground mb-1">Voice Type</div>
              <div className="font-semibold">
                {preferences.voiceGender === 'male' ? 'Male' : 'Female'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="text-xs text-muted-foreground mb-1">Speed</div>
              <div className="font-semibold">
                {(preferences.speed * 100).toFixed(0)}% ({preferences.speed.toFixed(1)}x)
              </div>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  )
}

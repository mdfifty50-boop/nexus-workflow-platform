/**
 * VoiceConfigurationPanel Component
 *
 * Comprehensive voice settings panel for configuring AI voice calls.
 * Can be used in:
 * - Settings page (global preferences)
 * - WorkflowPreviewCard (workflow-specific settings)
 * - Post "Run Beta" active workflow panel
 */

import { useState, useEffect } from 'react'
import {
  Mic,
  Volume2,
  Languages,
  User,
  Building2,
  Play,
  Settings2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  VoiceConfigService,
  type VoiceProfile,
  type DomainOption,
  type UserVoicePreferences,
  getDomainDisplayName,
  getLanguageDisplayName,
  getGenderDisplayName,
} from '@/services/VoiceConfigService'

// ============================================================================
// Types
// ============================================================================

interface VoiceConfigurationPanelProps {
  /** Workflow ID for workflow-specific settings */
  workflowId?: string
  /** Initial preferences (for pre-filling) */
  initialPreferences?: Partial<UserVoicePreferences>
  /** Callback when config is saved */
  onSave?: (preferences: UserVoicePreferences) => void
  /** Callback when config changes (for preview) */
  onChange?: (preferences: Partial<UserVoicePreferences>) => void
  /** Compact mode for inline display */
  compact?: boolean
  /** Show advanced settings expanded */
  showAdvanced?: boolean
  /** Custom class name */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function VoiceConfigurationPanel({
  workflowId: _workflowId, // Reserved for workflow-specific settings
  initialPreferences,
  onSave,
  onChange,
  compact = false,
  showAdvanced: initialShowAdvanced = false,
  className,
}: VoiceConfigurationPanelProps) {
  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [domains, setDomains] = useState<DomainOption[]>([])
  const [profiles, setProfiles] = useState<VoiceProfile[]>([])
  const [showAdvanced, setShowAdvanced] = useState(initialShowAdvanced)

  // Form state
  const [domain, setDomain] = useState(initialPreferences?.domain || 'business')
  const [language, setLanguage] = useState<'en' | 'ar' | 'auto'>(
    initialPreferences?.language || 'auto'
  )
  const [preferredGender, setPreferredGender] = useState<'male' | 'female' | 'no_preference'>(
    initialPreferences?.preferredGender || 'no_preference'
  )
  const [voiceIdEn, setVoiceIdEn] = useState(initialPreferences?.voiceIdEn || '')
  const [voiceIdAr, setVoiceIdAr] = useState(initialPreferences?.voiceIdAr || '')
  const [stability, setStability] = useState(
    initialPreferences?.customSettings?.stability ?? 0.7
  )
  const [speed, setSpeed] = useState(initialPreferences?.customSettings?.speed ?? 1.0)
  const [similarity, setSimilarity] = useState(
    initialPreferences?.customSettings?.similarity ?? 0.8
  )

  // Derived state
  const filteredEnVoices = profiles.filter(
    p => p.language === 'en' && (preferredGender === 'no_preference' || p.gender === preferredGender)
  )
  const filteredArVoices = profiles.filter(
    p => p.language === 'ar' && (preferredGender === 'no_preference' || p.gender === preferredGender)
  )

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  // Notify on changes
  useEffect(() => {
    if (onChange && !loading) {
      onChange({
        domain,
        language,
        preferredGender,
        voiceIdEn: voiceIdEn || undefined,
        voiceIdAr: voiceIdAr || undefined,
        customSettings: {
          stability,
          speed,
          similarity,
        },
      })
    }
  }, [domain, language, preferredGender, voiceIdEn, voiceIdAr, stability, speed, similarity])

  async function loadData() {
    try {
      setLoading(true)
      await VoiceConfigService.initialize()
      setDomains(VoiceConfigService.getDomains())
      setProfiles(VoiceConfigService.getProfiles())

      // Load user's existing config
      const config = VoiceConfigService.getUserConfig()
      if (config && !initialPreferences) {
        setDomain(config.preferences.domain)
        setLanguage(config.preferences.language)
        setPreferredGender(config.preferences.preferredGender)
        if (config.preferences.voiceIdEn) setVoiceIdEn(config.preferences.voiceIdEn)
        if (config.preferences.voiceIdAr) setVoiceIdAr(config.preferences.voiceIdAr)
        if (config.preferences.customSettings) {
          if (config.preferences.customSettings.stability !== undefined) {
            setStability(config.preferences.customSettings.stability)
          }
          if (config.preferences.customSettings.speed !== undefined) {
            setSpeed(config.preferences.customSettings.speed)
          }
          if (config.preferences.customSettings.similarity !== undefined) {
            setSimilarity(config.preferences.customSettings.similarity)
          }
        }
      }
    } catch (error) {
      console.error('[VoiceConfigurationPanel] Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)

      const preferences: UserVoicePreferences = {
        userId: 'current', // Will be set by server
        domain,
        language,
        preferredGender,
        voiceIdEn: voiceIdEn || undefined,
        voiceIdAr: voiceIdAr || undefined,
        customSettings: {
          stability,
          speed,
          similarity,
        },
      }

      const config = await VoiceConfigService.savePreferences(preferences)

      if (onSave) {
        onSave(config.preferences)
      }
    } catch (error) {
      console.error('[VoiceConfigurationPanel] Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  function handlePreviewVoice(voiceId: string) {
    // For now, just log - actual preview requires ElevenLabs TTS API
    console.log('[VoiceConfigurationPanel] Preview voice:', voiceId)
    // TODO: Implement actual voice preview
  }

  // Loading state
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-6', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        <span className="ml-2 text-slate-400">Loading voice settings...</span>
      </div>
    )
  }

  // Compact mode for inline display
  if (compact) {
    return (
      <div
        className={cn(
          'bg-slate-800/50 rounded-lg p-3 border border-slate-700',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Voice Settings</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{getDomainDisplayName(domain)}</span>
            <span>|</span>
            <span>{getLanguageDisplayName(language)}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="flex-1 px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-white"
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'ar' | 'auto')}
            className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-white"
          >
            <option value="auto">Auto</option>
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 text-xs bg-purple-500 hover:bg-purple-600 rounded text-white font-medium"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  // Full panel
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Mic className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Voice Configuration</h3>
            <p className="text-xs text-slate-400">Configure AI voice for your calls</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Domain Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Building2 className="w-4 h-4" />
            Business Domain
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} / {d.name_ar}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Optimizes voice tone and prompts for your industry
          </p>
        </div>

        {/* Language Preference */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Languages className="w-4 h-4" />
            Language Preference
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['auto', 'en', 'ar'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  language === lang
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                )}
              >
                {getLanguageDisplayName(lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Gender Preference */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <User className="w-4 h-4" />
            Voice Preference
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['no_preference', 'male', 'female'] as const).map((gender) => (
              <button
                key={gender}
                onClick={() => setPreferredGender(gender)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  preferredGender === gender
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                )}
              >
                {getGenderDisplayName(gender)}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Selection */}
        <div className="grid grid-cols-2 gap-4">
          {/* English Voice */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              English Voice
            </label>
            <div className="space-y-2">
              <select
                value={voiceIdEn}
                onChange={(e) => setVoiceIdEn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
              >
                <option value="">Auto (Recommended)</option>
                {filteredEnVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              {voiceIdEn && (
                <button
                  onClick={() => handlePreviewVoice(voiceIdEn)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-xs text-white"
                >
                  <Play className="w-3 h-3" />
                  Preview
                </button>
              )}
            </div>
          </div>

          {/* Arabic Voice */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Arabic Voice
            </label>
            <div className="space-y-2">
              <select
                value={voiceIdAr}
                onChange={(e) => setVoiceIdAr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
              >
                <option value="">Auto (Recommended)</option>
                {filteredArVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              {voiceIdAr && (
                <button
                  onClick={() => handlePreviewVoice(voiceIdAr)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-xs text-white"
                >
                  <Play className="w-3 h-3" />
                  Preview
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <Settings2 className="w-4 h-4" />
          Advanced Settings
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            {/* Stability */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-slate-300">Stability</label>
                <span className="text-xs text-slate-500">{Math.round(stability * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={stability}
                onChange={(e) => setStability(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Higher = more consistent, lower = more expressive
              </p>
            </div>

            {/* Speed */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-slate-300">Speed</label>
                <span className="text-xs text-slate-500">{speed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Adjust speaking pace (0.5x to 1.5x)
              </p>
            </div>

            {/* Similarity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-slate-300">Voice Clarity</label>
                <span className="text-xs text-slate-500">{Math.round(similarity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={similarity}
                onChange={(e) => setSimilarity(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Higher = closer to original voice
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Reset
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Configuration
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default VoiceConfigurationPanel

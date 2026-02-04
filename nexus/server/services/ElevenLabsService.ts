/**
 * ElevenLabsService - Arabic Text-to-Speech via Composio
 *
 * Provides natural voice synthesis for Arabic and English responses.
 * Optimized for GCC Arabic dialects and WhatsApp voice note format.
 *
 * @NEXUS-FIX-082: ElevenLabs service with Gulf Arabic voice support
 */

import { composioService } from './ComposioService'

// Voice settings
export interface VoiceSettings {
  stability?: number      // 0-1, higher = more consistent
  similarityBoost?: number // 0-1, higher = closer to original voice
  style?: number          // 0-1, style strength (for stylized voices)
  speakerBoost?: boolean  // Enhance speaker clarity
}

// Output formats compatible with WhatsApp
export type AudioOutputFormat = 'mp3_44100_128' | 'mp3_22050_32' | 'pcm_16000' | 'ulaw_8000' | 'ogg_opus'

// Language codes
export type TTSLanguage = 'ar' | 'en' | 'ar-AE' | 'en-US' | 'en-GB'

// Voice categories
export type VoiceCategory = 'arabic' | 'english' | 'multilingual'

export interface Voice {
  id: string
  name: string
  language: string
  category: VoiceCategory
  description: string
  previewUrl?: string
}

// Predefined voices optimized for GCC
const RECOMMENDED_VOICES: Voice[] = [
  // Arabic Voices
  {
    id: 'arabicMale1',
    name: 'Khalid',
    language: 'ar',
    category: 'arabic',
    description: 'Professional Arabic male voice, Gulf dialect'
  },
  {
    id: 'arabicFemale1',
    name: 'Fatima',
    language: 'ar',
    category: 'arabic',
    description: 'Warm Arabic female voice, Gulf dialect'
  },
  // English Voices
  {
    id: 'rachel',
    name: 'Rachel',
    language: 'en-US',
    category: 'english',
    description: 'Clear American female voice'
  },
  {
    id: 'adam',
    name: 'Adam',
    language: 'en-US',
    category: 'english',
    description: 'Professional American male voice'
  },
  // Multilingual
  {
    id: 'eleven_multilingual_v2',
    name: 'Multilingual v2',
    language: 'multi',
    category: 'multilingual',
    description: 'Supports Arabic and English in same text'
  },
]

export interface TTSResult {
  success: boolean
  audioBuffer?: Buffer
  audioBase64?: string
  audioUrl?: string
  format?: string
  durationMs?: number
  charactersUsed?: number
  error?: string
}

export interface VoiceListResult {
  success: boolean
  voices?: Voice[]
  error?: string
}

/**
 * ElevenLabs Service for Voice Synthesis
 */
class ElevenLabsServiceClass {
  private initialized: boolean = false
  private cachedVoices: Voice[] = []
  private responseCache: Map<string, { audio: Buffer; timestamp: number }> = new Map()
  private cacheMaxAge: number = 30 * 60 * 1000 // 30 minutes

  /**
   * Initialize the ElevenLabs service
   * Requires Composio to be configured with ElevenLabs OAuth connection
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if Composio is initialized
      const composioInitialized = await composioService.initialize()
      if (!composioInitialized) {
        console.log('[ElevenLabsService] Composio not initialized - demo mode')
        return false
      }

      // Check if ElevenLabs is connected via Composio
      const connection = await composioService.checkConnection('elevenlabs')
      if (!connection.connected) {
        console.log('[ElevenLabsService] ElevenLabs not connected via Composio')
        console.log('[ElevenLabsService] Connect at: https://app.composio.dev/ → Integrations → ElevenLabs')
        return false
      }

      this.initialized = true
      console.log('[ElevenLabsService] Initialized via Composio')

      // Pre-fetch available voices
      await this.refreshVoices()

      return true
    } catch (error) {
      console.error('[ElevenLabsService] Initialization error:', error)
      return false
    }
  }

  /**
   * Refresh the list of available voices
   */
  async refreshVoices(): Promise<void> {
    if (!this.initialized) {
      this.cachedVoices = RECOMMENDED_VOICES
      return
    }

    try {
      const result = await composioService.executeTool('ELEVENLABS_LIST_VOICES', {})
      if (result.success && result.data) {
        const data = result.data as Record<string, unknown>
        const voices = data.voices as Array<Record<string, unknown>> || []

        this.cachedVoices = voices.map(v => ({
          id: v.voice_id as string,
          name: v.name as string,
          language: (v.labels as Record<string, string>)?.language || 'en',
          category: this.categorizeVoice(v),
          description: v.description as string || '',
          previewUrl: v.preview_url as string | undefined,
        }))
      }
    } catch (error) {
      console.warn('[ElevenLabsService] Could not refresh voices:', error)
      this.cachedVoices = RECOMMENDED_VOICES
    }
  }

  /**
   * Categorize a voice based on its labels
   */
  private categorizeVoice(voice: Record<string, unknown>): VoiceCategory {
    const labels = voice.labels as Record<string, string> | undefined
    const language = labels?.language?.toLowerCase() || ''

    if (language.includes('ar') || language.includes('arab')) {
      return 'arabic'
    }
    if (labels?.accent?.includes('multi') || voice.name === 'Multilingual') {
      return 'multilingual'
    }
    return 'english'
  }

  /**
   * Generate cache key for response caching
   */
  private getCacheKey(text: string, voiceId: string, settings?: VoiceSettings): string {
    const settingsStr = settings ? JSON.stringify(settings) : ''
    return `${text.substring(0, 100)}_${voiceId}_${settingsStr}`.replace(/\s+/g, '_')
  }

  /**
   * Convert text to speech
   *
   * @param text - Text to synthesize
   * @param voiceId - Voice ID or name
   * @param options - Voice settings and output options
   */
  async synthesize(
    text: string,
    voiceId: string = 'rachel',
    options: {
      settings?: VoiceSettings
      format?: AudioOutputFormat
      useCache?: boolean
    } = {}
  ): Promise<TTSResult> {
    const { settings, format = 'mp3_44100_128', useCache = true } = options

    // Check cache
    if (useCache) {
      const cacheKey = this.getCacheKey(text, voiceId, settings)
      const cached = this.responseCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
        console.log('[ElevenLabsService] Using cached audio')
        return {
          success: true,
          audioBuffer: cached.audio,
          audioBase64: cached.audio.toString('base64'),
          format: 'mp3',
        }
      }
    }

    // Demo mode
    if (!this.initialized) {
      console.log('[ElevenLabsService] Demo mode - simulating TTS')
      return {
        success: true,
        audioUrl: 'demo://synthesized-audio.mp3',
        format: 'mp3',
        durationMs: text.length * 50, // Rough estimate
        charactersUsed: text.length,
      }
    }

    try {
      // Execute ElevenLabs TTS via Composio
      const result = await composioService.executeTool('ELEVENLABS_TEXT_TO_SPEECH', {
        voice_id: voiceId,
        text: text,
        model_id: 'eleven_multilingual_v2', // Best for Arabic + English
        voice_settings: {
          stability: settings?.stability ?? 0.5,
          similarity_boost: settings?.similarityBoost ?? 0.75,
          style: settings?.style ?? 0,
          use_speaker_boost: settings?.speakerBoost ?? true,
        },
        output_format: format,
      })

      if (!result.success) {
        return { success: false, error: result.error || 'TTS failed' }
      }

      const data = result.data as Record<string, unknown>
      const audioBuffer = data.audio as Buffer | undefined
      const audioBase64 = data.audio_base64 as string | undefined

      // Cache the response
      if (useCache && audioBuffer) {
        const cacheKey = this.getCacheKey(text, voiceId, settings)
        this.responseCache.set(cacheKey, {
          audio: audioBuffer,
          timestamp: Date.now(),
        })
      }

      return {
        success: true,
        audioBuffer,
        audioBase64: audioBase64 || audioBuffer?.toString('base64'),
        audioUrl: data.audio_url as string | undefined,
        format: 'mp3',
        charactersUsed: text.length,
      }
    } catch (error) {
      console.error('[ElevenLabsService] TTS error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'TTS failed',
      }
    }
  }

  /**
   * Get audio for WhatsApp voice note (optimized format)
   *
   * @param text - Text to synthesize
   * @param language - Target language (ar or en)
   */
  async synthesizeForWhatsApp(
    text: string,
    language: TTSLanguage = 'en'
  ): Promise<TTSResult> {
    // Select appropriate voice
    const voiceId = language.startsWith('ar')
      ? 'arabicFemale1'  // Fatima for Arabic
      : 'rachel'          // Rachel for English

    return this.synthesize(text, voiceId, {
      format: 'ogg_opus', // Optimal for WhatsApp
      settings: {
        stability: 0.6,
        similarityBoost: 0.75,
        speakerBoost: true,
      },
    })
  }

  /**
   * Get list of available voices
   */
  async getVoices(): Promise<VoiceListResult> {
    if (!this.initialized) {
      return { success: true, voices: RECOMMENDED_VOICES }
    }

    if (this.cachedVoices.length === 0) {
      await this.refreshVoices()
    }

    return { success: true, voices: this.cachedVoices }
  }

  /**
   * Get voices for a specific language
   */
  async getVoicesByLanguage(language: TTSLanguage): Promise<Voice[]> {
    const { voices = [] } = await this.getVoices()

    if (language.startsWith('ar')) {
      return voices.filter(v => v.category === 'arabic' || v.category === 'multilingual')
    }
    return voices.filter(v => v.category === 'english' || v.category === 'multilingual')
  }

  /**
   * Get recommended voice for language
   */
  getRecommendedVoice(language: TTSLanguage): Voice {
    if (language.startsWith('ar')) {
      return RECOMMENDED_VOICES.find(v => v.id === 'arabicFemale1') || RECOMMENDED_VOICES[1]
    }
    return RECOMMENDED_VOICES.find(v => v.id === 'rachel') || RECOMMENDED_VOICES[2]
  }

  /**
   * Clear old cache entries
   */
  cleanCache(): void {
    const now = Date.now()
    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > this.cacheMaxAge) {
        this.responseCache.delete(key)
      }
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized
  }

  /**
   * Get character quota information (if available)
   */
  async getQuota(): Promise<{ success: boolean; used?: number; limit?: number; error?: string }> {
    if (!this.initialized) {
      return { success: true, used: 0, limit: 10000 }
    }

    try {
      const result = await composioService.executeTool('ELEVENLABS_GET_USER_SUBSCRIPTION', {})
      if (!result.success) {
        return { success: false, error: result.error }
      }

      const data = result.data as Record<string, unknown>
      return {
        success: true,
        used: data.character_count as number,
        limit: data.character_limit as number,
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get quota' }
    }
  }
}

// Export singleton instance
const ElevenLabsService = new ElevenLabsServiceClass()
export default ElevenLabsService

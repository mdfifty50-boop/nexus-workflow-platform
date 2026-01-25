/**
 * Human-like TTS Service
 *
 * Provides ultra-realistic text-to-speech that sounds indistinguishable from real humans.
 * Uses ElevenLabs' premium conversational voices with the Eleven Multilingual v2 model
 * for the most natural, human-like speech output.
 *
 * ENHANCED FEATURES:
 * - Multi-language support with automatic dialect detection
 * - Kuwaiti Arabic slang recognition for Gulf dialect responses
 * - Responds in SAME language/dialect as user input
 * - Emotion-aware prosody modulation
 * - Multi-provider support (ElevenLabs > Azure > Google > OpenAI > Browser)
 *
 * SECURITY: All API calls now go through backend proxy to keep keys secure.
 * No API keys are exposed to the browser.
 *
 * Provider Priority:
 * 1. ElevenLabs (eleven_multilingual_v2) - Most human-like, premium conversational voices
 * 2. Azure Neural TTS - High quality neural voices with emotion support
 * 3. Google WaveNet - Natural sounding voices with prosody control
 * 4. OpenAI TTS (tts-1-hd) - Good quality backup
 * 5. Browser SpeechSynthesis - Final fallback
 *
 * Voice Selection:
 * - Charlotte (British conversational) - Mary/Analyst
 * - Daniel (Deep authoritative British) - Winston/Architect
 * - Emily (Clear American professional) - Amelia/Dev
 * - Liam (Confident American male) - John/PM
 * - Thomas (Energetic friendly male) - Bob/SM
 * - Ryan (Calm measured male) - Murat/TEA
 * - Lily (Expressive warm female) - Sally/UX Designer
 * - Grace (Clear patient female) - Paige/Tech Writer
 *
 * Features:
 * - Queue-based speech to prevent overlapping
 * - Agent-specific voice assignment for distinct personalities
 * - Natural conversational pacing with optimized voice settings
 * - Ultra-realistic premium voices tuned for maximum realism
 * - Arabic dialect detection (Gulf/Kuwaiti, Egyptian, Levantine, MSA)
 * - Emotion detection from text content for natural prosody
 */

import {
  type SupportedLanguage,
  type ArabicDialect,
  type VoiceEmotion,
  type AgentVoiceProfile,
  AGENT_VOICE_PROFILES,
  ARABIC_VOICE_PROFILES,
  EMOTION_PROSODY,
  getVoiceProfile,
  KUWAITI_SLANG_PATTERNS,
  GULF_ARABIC_PATTERNS,
  EGYPTIAN_ARABIC_PATTERNS,
  LEVANTINE_ARABIC_PATTERNS
} from '../config/voice-profiles'

const API_BASE = import.meta.env.VITE_API_URL || ''

export type TTSProvider = 'elevenlabs' | 'azure' | 'google' | 'openai' | 'browser'

// Re-export types for external use
export type { SupportedLanguage, ArabicDialect, VoiceEmotion, AgentVoiceProfile }

// Legacy interface for backward compatibility
export interface VoiceConfig {
  // ElevenLabs voice ID - premium conversational voices for ultra-realism
  elevenLabsVoice: string
  elevenLabsVoiceName: string
  // OpenAI voice as fallback
  openaiVoice: 'alloy' | 'ash' | 'coral' | 'sage' | 'ballad' | 'verse' | 'shimmer' | 'echo' | 'fable' | 'onyx' | 'nova'
  // Browser voice preferences (final fallback)
  browserGender: 'male' | 'female'
  browserPitch: number
  browserRate: number
  // Voice personality for ElevenLabs tuning
  personality: 'warm' | 'professional' | 'energetic' | 'calm' | 'authoritative' | 'friendly' | 'expressive' | 'patient'
  // Voice-specific tuning parameters for maximum realism
  voiceSettings: {
    stability: number      // 0.3-0.5 for expressive, 0.5-0.7 for consistent
    similarityBoost: number // 0.85 for close to original voice
    style: number          // 0.3-0.5 for natural inflection
    useSpeakerBoost: boolean // Enhanced clarity
  }
}

// Dialect detection result interface
export interface DialectDetectionResult {
  language: SupportedLanguage
  dialect: ArabicDialect | null
  confidence: number
  isArabic: boolean
  detectedPatterns: string[]
}

// Convert new profile format to legacy VoiceConfig for backward compatibility
function profileToVoiceConfig(profile: AgentVoiceProfile): VoiceConfig {
  return {
    elevenLabsVoice: profile.elevenlabs.voiceId,
    elevenLabsVoiceName: profile.elevenlabs.voiceName,
    openaiVoice: profile.openai.voice,
    browserGender: profile.browser.gender,
    browserPitch: profile.browser.pitch,
    browserRate: profile.browser.rate,
    personality: profile.personality,
    voiceSettings: {
      stability: profile.elevenlabs.settings.stability,
      similarityBoost: profile.elevenlabs.settings.similarityBoost,
      style: profile.elevenlabs.settings.style,
      useSpeakerBoost: profile.elevenlabs.settings.useSpeakerBoost
    }
  }
}

// Agent-to-voice mapping using ElevenLabs' premium conversational voices
// Now derived from the enhanced voice profiles configuration
export const AGENT_VOICE_CONFIGS: Record<string, VoiceConfig> = Object.fromEntries(
  Object.entries(AGENT_VOICE_PROFILES).map(([key, profile]) => [key, profileToVoiceConfig(profile)])
)

// Default voice settings for backwards compatibility
const DEFAULT_VOICE_SETTINGS = {
  stability: 0.45,
  similarityBoost: 0.85,
  style: 0.35,
  useSpeakerBoost: true
}

// =============================================================================
// DIALECT DETECTION ENGINE
// =============================================================================

/**
 * Detect language and dialect from user input text
 * Optimized for Arabic dialect detection, especially Kuwaiti/Gulf Arabic
 */
export function detectLanguageAndDialect(text: string): DialectDetectionResult {
  // Check if text contains Arabic characters
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/
  const isArabic = arabicPattern.test(text)

  if (!isArabic) {
    // English detection based on common patterns
    const isEnglish = /^[a-zA-Z\s\d.,!?'"()-]+$/.test(text.trim())
    return {
      language: isEnglish ? 'en-US' : 'en-US',
      dialect: null,
      confidence: 0.9,
      isArabic: false,
      detectedPatterns: []
    }
  }

  // Arabic dialect detection
  const dialectScores: Record<ArabicDialect, number> = {
    gulf: 0,
    levantine: 0,
    egyptian: 0,
    maghrebi: 0,
    msa: 0
  }

  const detectedPatterns: string[] = []

  // Check Kuwaiti patterns (subset of Gulf)
  let kuwaitiScore = 0
  KUWAITI_SLANG_PATTERNS.words.forEach(word => {
    if (text.includes(word)) {
      kuwaitiScore += 2
      detectedPatterns.push(`kuwaiti:${word}`)
    }
  })
  KUWAITI_SLANG_PATTERNS.patterns.forEach(pattern => {
    if (pattern.test(text)) {
      kuwaitiScore += 3
      detectedPatterns.push(`kuwaiti:pattern`)
    }
  })

  // Check Gulf Arabic patterns
  GULF_ARABIC_PATTERNS.words.forEach(word => {
    if (text.includes(word)) {
      dialectScores.gulf += 1
      detectedPatterns.push(`gulf:${word}`)
    }
  })
  GULF_ARABIC_PATTERNS.patterns.forEach(pattern => {
    if (pattern.test(text)) {
      dialectScores.gulf += 2
      detectedPatterns.push(`gulf:pattern`)
    }
  })

  // Kuwaiti is Gulf dialect with higher specificity
  dialectScores.gulf += kuwaitiScore

  // Check Egyptian patterns
  EGYPTIAN_ARABIC_PATTERNS.words.forEach(word => {
    if (text.includes(word)) {
      dialectScores.egyptian += 1
      detectedPatterns.push(`egyptian:${word}`)
    }
  })
  EGYPTIAN_ARABIC_PATTERNS.patterns.forEach(pattern => {
    if (pattern.test(text)) {
      dialectScores.egyptian += 2
      detectedPatterns.push(`egyptian:pattern`)
    }
  })

  // Check Levantine patterns
  LEVANTINE_ARABIC_PATTERNS.words.forEach(word => {
    if (text.includes(word)) {
      dialectScores.levantine += 1
      detectedPatterns.push(`levantine:${word}`)
    }
  })
  LEVANTINE_ARABIC_PATTERNS.patterns.forEach(pattern => {
    if (pattern.test(text)) {
      dialectScores.levantine += 2
      detectedPatterns.push(`levantine:pattern`)
    }
  })

  // Find highest scoring dialect
  const entries = Object.entries(dialectScores) as [ArabicDialect, number][]
  const sorted = entries.sort(([, a], [, b]) => b - a)
  const [topDialect, topScore] = sorted[0]

  // If no strong dialect signals, default to MSA
  if (topScore < 2) {
    return {
      language: 'ar',
      dialect: 'msa',
      confidence: 0.6,
      isArabic: true,
      detectedPatterns
    }
  }

  // Map dialect to language code
  const dialectToLanguage: Record<ArabicDialect, SupportedLanguage> = {
    gulf: kuwaitiScore > 3 ? 'ar-KW' : 'ar-SA',
    levantine: 'ar-LB',
    egyptian: 'ar-EG',
    maghrebi: 'ar-MA',
    msa: 'ar'
  }

  const totalScore = Object.values(dialectScores).reduce((a, b) => a + b, 0)
  const confidence = totalScore > 0 ? Math.min(topScore / totalScore + 0.3, 0.95) : 0.5

  return {
    language: dialectToLanguage[topDialect],
    dialect: topDialect,
    confidence,
    isArabic: true,
    detectedPatterns
  }
}

/**
 * Quick check if text is likely Kuwaiti Arabic
 */
export function isKuwaitiArabic(text: string): boolean {
  let score = 0
  KUWAITI_SLANG_PATTERNS.words.forEach(word => {
    if (text.includes(word)) score++
  })
  KUWAITI_SLANG_PATTERNS.patterns.forEach(pattern => {
    if (pattern.test(text)) score += 2
  })
  return score >= 3
}

// =============================================================================
// EMOTION DETECTION ENGINE
// =============================================================================

/**
 * Detect emotion from text content
 * Used to modulate voice prosody for more natural delivery
 */
export function detectEmotion(text: string): VoiceEmotion {
  const textLower = text.toLowerCase()

  // Positive emotions
  if (/\b(great|excellent|amazing|wonderful|fantastic|love|excited|happy|thrilled)\b/.test(textLower)) {
    return 'cheerful'
  }
  if (/\b(hope|promising|optimistic|looking forward|bright)\b/.test(textLower)) {
    return 'hopeful'
  }
  if (/\b(excited|can't wait|thrilling|eager)\b/.test(textLower)) {
    return 'excited'
  }

  // Negative emotions
  if (/\b(concern|worried|risk|careful|warning|issue|problem)\b/.test(textLower)) {
    return 'serious'
  }
  if (/\b(sorry|apologize|regret|unfortunate|sad)\b/.test(textLower)) {
    return 'sad'
  }

  // Empathetic
  if (/\b(understand|hear you|see what you mean|i see|makes sense)\b/.test(textLower)) {
    return 'empathetic'
  }

  // Friendly
  if (/\b(agree|yes|exactly|right|good point|well said)\b/.test(textLower)) {
    return 'friendly'
  }

  return 'neutral'
}

interface SpeechQueueItem {
  id: string
  text: string
  agentId: string
  priority: number
  language?: SupportedLanguage
  emotion?: VoiceEmotion
  onStart?: () => void
  onEnd?: () => void
}

class HumanTTSService {
  private provider: TTSProvider = 'browser'
  private elevenLabsConfigured: boolean = false
  private openaiConfigured: boolean = false
  private azureConfigured: boolean = false
  private googleConfigured: boolean = false

  // Speech queue for preventing overlap
  private speechQueue: SpeechQueueItem[] = []
  private isProcessing: boolean = false
  private currentAudio: HTMLAudioElement | null = null
  private isMuted: boolean = false

  // Workflow-specific audio tracking
  private activeWorkflowId: string | null = null
  private isActive: boolean = true

  // Language/dialect tracking - responds in same language as user
  private detectedUserLanguage: SupportedLanguage = 'en-US'
  private detectedDialect: ArabicDialect | null = null

  // isConfigured getter for external checks
  get isConfigured(): boolean {
    return this.elevenLabsConfigured || this.azureConfigured || this.googleConfigured || this.openaiConfigured
  }

  constructor() {
    // Check backend for available TTS providers
    this.checkProviderStatus()
  }

  /**
   * Check which TTS providers are configured on the backend
   * SECURITY: Keys are stored server-side only
   *
   * Provider Priority:
   * 1. ElevenLabs - Most human-like, premium conversational voices
   * 2. Azure Neural TTS - High quality neural voices with emotion
   * 3. Google WaveNet - Natural sounding with prosody control
   * 4. OpenAI TTS - Good quality backup
   * 5. Browser - Final fallback
   */
  private async checkProviderStatus(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/api/ai-proxy/status`)
      if (response.ok) {
        const data = await response.json()
        this.elevenLabsConfigured = data.services?.elevenlabs?.configured === true
        this.azureConfigured = data.services?.azure?.tts?.configured === true
        this.googleConfigured = data.services?.google?.tts?.configured === true
        this.openaiConfigured = data.services?.openai?.configured === true

        // Set provider based on priority
        if (this.elevenLabsConfigured) {
          this.provider = 'elevenlabs'
          console.log('[TTS] ElevenLabs configured - premium voices enabled (eleven_multilingual_v2 via backend proxy)')
        } else if (this.azureConfigured) {
          this.provider = 'azure'
          console.log('[TTS] Azure Neural TTS configured - neural voices with emotion support (via backend proxy)')
        } else if (this.googleConfigured) {
          this.provider = 'google'
          console.log('[TTS] Google WaveNet TTS configured - natural voices (via backend proxy)')
        } else if (this.openaiConfigured) {
          this.provider = 'openai'
          console.log('[TTS] OpenAI TTS configured (via backend proxy)')
        } else {
          this.provider = 'browser'
          console.log('[TTS] Using browser TTS fallback (configure ELEVENLABS_API_KEY on server for ultra-realistic voices)')
        }

        console.log('[TTS] Provider status:', {
          elevenlabs: this.elevenLabsConfigured,
          azure: this.azureConfigured,
          google: this.googleConfigured,
          openai: this.openaiConfigured,
          active: this.provider
        })
      }
    } catch {
      console.log('[TTS] Could not check backend status, using browser fallback')
      this.provider = 'browser'
    }
  }

  /**
   * Get current TTS provider
   */
  getProvider(): TTSProvider {
    return this.provider
  }

  /**
   * Check if high-quality TTS is available
   */
  hasHighQualityTTS(): boolean {
    return ['elevenlabs', 'azure', 'google', 'openai'].includes(this.provider)
  }

  // ===========================================================================
  // LANGUAGE & DIALECT MANAGEMENT
  // ===========================================================================

  /**
   * Detect and store user's language from their speech/text input
   * This allows responding in the SAME language/dialect
   */
  detectUserLanguage(userInput: string): DialectDetectionResult {
    const result = detectLanguageAndDialect(userInput)
    this.detectedUserLanguage = result.language
    this.detectedDialect = result.dialect

    console.log(`[TTS] Detected language: ${result.language}, dialect: ${result.dialect}, confidence: ${result.confidence}`)

    return result
  }

  /**
   * Get detected user language
   */
  getDetectedLanguage(): SupportedLanguage {
    return this.detectedUserLanguage
  }

  /**
   * Get detected dialect
   */
  getDetectedDialect(): ArabicDialect | null {
    return this.detectedDialect
  }

  /**
   * Check if user is speaking Kuwaiti Arabic
   */
  isUserSpeakingKuwaiti(): boolean {
    return this.detectedDialect === 'gulf' &&
           (this.detectedUserLanguage === 'ar-KW' || this.detectedUserLanguage === 'ar-SA')
  }

  /**
   * Set mute state
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted
    if (muted) {
      this.stop()
    }
  }

  /**
   * Check if muted
   */
  isMutedState(): boolean {
    return this.isMuted
  }

  /**
   * Add speech to queue (prevents overlapping)
   *
   * Enhanced with language/dialect support and emotion detection.
   * If no language is specified, uses the detected user language for response.
   */
  async queueSpeech(
    text: string,
    agentId: string,
    options?: {
      priority?: number
      language?: SupportedLanguage
      emotion?: VoiceEmotion
      onStart?: () => void
      onEnd?: () => void
    }
  ): Promise<void> {
    if (this.isMuted) {
      options?.onStart?.()
      // Small delay to simulate speech timing
      await new Promise(resolve => setTimeout(resolve, Math.min(text.length * 30, 3000)))
      options?.onEnd?.()
      return
    }

    // Use detected language if not specified, detect emotion from text
    const language = options?.language || this.detectedUserLanguage
    const emotion = options?.emotion || detectEmotion(text)

    const item: SpeechQueueItem = {
      id: `${agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      text,
      agentId,
      priority: options?.priority ?? 0,
      language,
      emotion,
      onStart: options?.onStart,
      onEnd: options?.onEnd
    }

    // Insert by priority (higher priority goes first)
    const insertIndex = this.speechQueue.findIndex(q => q.priority < item.priority)
    if (insertIndex === -1) {
      this.speechQueue.push(item)
    } else {
      this.speechQueue.splice(insertIndex, 0, item)
    }

    // Start processing if not already
    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  /**
   * Process speech queue sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.speechQueue.length === 0) return

    this.isProcessing = true

    while (this.speechQueue.length > 0 && !this.isMuted) {
      const item = this.speechQueue.shift()!

      item.onStart?.()

      try {
        await this.speakInternal(item.text, item.agentId, item.language, item.emotion)
      } catch (error) {
        console.error('[TTS] Speech error:', error)
      }

      item.onEnd?.()

      // Small pause between speeches for natural flow
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    this.isProcessing = false
  }

  /**
   * Internal speak method - handles actual TTS with provider fallback
   *
   * Provider chain: ElevenLabs > Azure > Google > OpenAI > Browser
   */
  private async speakInternal(
    text: string,
    agentId: string,
    language?: SupportedLanguage,
    emotion?: VoiceEmotion
  ): Promise<void> {
    const voiceConfig = AGENT_VOICE_CONFIGS[agentId] || AGENT_VOICE_CONFIGS['pm']
    const profile = getVoiceProfile(agentId)
    const lang = language || this.detectedUserLanguage
    const emo = emotion || 'neutral'

    // Limit text length for performance
    const limitedText = text.slice(0, 500)

    // Try providers with fallback chain
    switch (this.provider) {
      case 'elevenlabs':
        await this.speakWithElevenLabs(limitedText, voiceConfig, lang, emo)
        break
      case 'azure':
        await this.speakWithAzure(limitedText, profile, lang, emo)
        break
      case 'google':
        await this.speakWithGoogle(limitedText, profile, lang, emo)
        break
      case 'openai':
        await this.speakWithOpenAI(limitedText, voiceConfig)
        break
      default:
        await this.speakWithBrowser(limitedText, voiceConfig, lang)
    }
  }

  /**
   * ElevenLabs TTS - Ultra-realistic human voices
   * Uses eleven_multilingual_v2 for the most natural, human-like speech
   * Premium conversational voices with per-agent tuning for maximum realism
   * SECURITY: Calls backend proxy - no API key exposed to browser
   *
   * Supports Arabic dialects - uses dialect-specific voices when available
   */
  private async speakWithElevenLabs(
    text: string,
    config: VoiceConfig,
    language?: SupportedLanguage,
    emotion?: VoiceEmotion
  ): Promise<void> {
    if (!this.elevenLabsConfigured) {
      return this.speakWithOpenAI(text, config)
    }

    // Use Arabic voice if user is speaking Arabic and dialect is detected
    let voiceId = config.elevenLabsVoice
    if (language?.startsWith('ar') && this.detectedDialect) {
      const arabicConfig = ARABIC_VOICE_PROFILES[this.detectedDialect]
      if (arabicConfig?.elevenlabs?.voiceId) {
        voiceId = arabicConfig.elevenlabs.voiceId
        console.log(`[TTS] Using ${this.detectedDialect} Arabic voice for ElevenLabs`)
      }
    }

    try {
      // Use voice-specific settings from config, with fallback to defaults
      const settings = config.voiceSettings || DEFAULT_VOICE_SETTINGS

      // Adjust stability based on emotion (more expressive emotions = lower stability)
      let stability = settings.stability
      if (emotion === 'excited' || emotion === 'cheerful') {
        stability = Math.max(0.25, stability - 0.1)
      } else if (emotion === 'serious' || emotion === 'sad') {
        stability = Math.min(0.7, stability + 0.1)
      }

      const similarityBoost = settings.similarityBoost
      const style = settings.style
      const useSpeakerBoost = settings.useSpeakerBoost

      // Call backend proxy instead of ElevenLabs directly
      // Using eleven_multilingual_v2 for most realistic human speech
      const response = await fetch(`${API_BASE}/api/ai-proxy/elevenlabs/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voiceId,
          modelId: 'eleven_multilingual_v2', // Most realistic model - supports 29 languages
          stability,
          similarityBoost,
          style,
          useSpeakerBoost
        })
      })

      if (!response.ok) {
        console.warn('[TTS] ElevenLabs proxy error, falling back to Azure')
        return this.speakWithAzure(text, getVoiceProfile(config.personality), language, emotion)
      }

      const audioBlob = await response.blob()
      await this.playAudioBlob(audioBlob)
    } catch (error) {
      console.error('[TTS] ElevenLabs error:', error)
      return this.speakWithAzure(text, getVoiceProfile(config.personality), language, emotion)
    }
  }

  /**
   * Azure Neural TTS - High quality neural voices with emotion/style support
   * SECURITY: Calls backend proxy - no API key exposed to browser
   */
  private async speakWithAzure(
    text: string,
    profile: AgentVoiceProfile,
    language?: SupportedLanguage,
    emotion?: VoiceEmotion
  ): Promise<void> {
    if (!this.azureConfigured) {
      return this.speakWithGoogle(text, profile, language, emotion)
    }

    const config = profile.azure

    // Use Arabic voice if user is speaking Arabic and dialect is detected
    let voiceName = config.voiceName
    let locale = config.locale
    if (language?.startsWith('ar') && this.detectedDialect) {
      const arabicConfig = ARABIC_VOICE_PROFILES[this.detectedDialect]
      if (arabicConfig?.azure) {
        voiceName = arabicConfig.azure.voiceName
        locale = arabicConfig.azure.locale
        console.log(`[TTS] Using ${this.detectedDialect} Arabic voice for Azure`)
      }
    }

    // Map emotion to Azure speaking style
    const emotionToStyle: Record<VoiceEmotion, string> = {
      neutral: 'general',
      cheerful: 'cheerful',
      empathetic: 'empathetic',
      excited: 'excited',
      serious: 'serious',
      friendly: 'friendly',
      hopeful: 'hopeful',
      sad: 'sad',
      angry: 'angry',
      fearful: 'terrified',
      unfriendly: 'unfriendly'
    }

    const style = emotion ? emotionToStyle[emotion] : config.style

    try {
      const response = await fetch(`${API_BASE}/api/ai-proxy/azure/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voiceName,
          locale,
          style,
          styleDegree: config.styleDegree || 1.0,
          rate: config.rate || '1.0',
          outputFormat: 'audio-24khz-96kbitrate-mono-mp3'
        })
      })

      if (!response.ok) {
        console.warn('[TTS] Azure proxy error, falling back to Google')
        return this.speakWithGoogle(text, profile, language, emotion)
      }

      const audioBlob = await response.blob()
      await this.playAudioBlob(audioBlob)
    } catch (error) {
      console.error('[TTS] Azure error:', error)
      return this.speakWithGoogle(text, profile, language, emotion)
    }
  }

  /**
   * Google Cloud TTS - WaveNet voices with prosody control
   * SECURITY: Calls backend proxy - no API key exposed to browser
   */
  private async speakWithGoogle(
    text: string,
    profile: AgentVoiceProfile,
    language?: SupportedLanguage,
    emotion?: VoiceEmotion
  ): Promise<void> {
    if (!this.googleConfigured) {
      return this.speakWithOpenAI(text, profileToVoiceConfig(profile))
    }

    const config = profile.google

    // Use Arabic voice if user is speaking Arabic and dialect is detected
    let voiceName = config.name
    let languageCode = config.languageCode
    if (language?.startsWith('ar') && this.detectedDialect) {
      const arabicConfig = ARABIC_VOICE_PROFILES[this.detectedDialect]
      if (arabicConfig?.google) {
        voiceName = arabicConfig.google.name
        languageCode = arabicConfig.google.languageCode
        console.log(`[TTS] Using ${this.detectedDialect} Arabic voice for Google`)
      }
    }

    // Get emotion-based prosody
    const prosody = emotion ? EMOTION_PROSODY[emotion] : EMOTION_PROSODY.neutral
    const rateMultiplier = parseFloat(prosody.rate.replace('%', '')) / 100 || 1
    const pitchOffset = parseFloat(prosody.pitch.replace('%', '').replace('+', '')) || 0

    try {
      const response = await fetch(`${API_BASE}/api/ai-proxy/google/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voice: {
            name: voiceName,
            languageCode,
            ssmlGender: config.ssmlGender
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: config.audioConfig.speakingRate * rateMultiplier,
            pitch: config.audioConfig.pitch + pitchOffset,
            volumeGainDb: config.audioConfig.volumeGainDb
          }
        })
      })

      if (!response.ok) {
        console.warn('[TTS] Google proxy error, falling back to OpenAI')
        return this.speakWithOpenAI(text, profileToVoiceConfig(profile))
      }

      const audioBlob = await response.blob()
      await this.playAudioBlob(audioBlob)
    } catch (error) {
      console.error('[TTS] Google error:', error)
      return this.speakWithOpenAI(text, profileToVoiceConfig(profile))
    }
  }

  /**
   * OpenAI TTS - Good quality backup
   * SECURITY: Calls backend proxy - no API key exposed to browser
   */
  private async speakWithOpenAI(text: string, config: VoiceConfig): Promise<void> {
    if (!this.openaiConfigured) {
      return this.speakWithBrowser(text, config)
    }

    try {
      // Call backend proxy instead of OpenAI directly
      const response = await fetch(`${API_BASE}/api/ai-proxy/openai/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voice: config.openaiVoice,
          model: 'tts-1-hd',
          speed: 1.0
        })
      })

      if (!response.ok) {
        console.warn('[TTS] OpenAI proxy error, falling back to browser')
        return this.speakWithBrowser(text, config)
      }

      const audioBlob = await response.blob()
      await this.playAudioBlob(audioBlob)
    } catch (error) {
      console.error('[TTS] OpenAI error:', error)
      return this.speakWithBrowser(text, config)
    }
  }

  /**
   * Browser Speech Synthesis - Final fallback
   * Supports multi-language including Arabic
   */
  private speakWithBrowser(text: string, config: VoiceConfig, language?: SupportedLanguage): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        // No TTS available, just wait a bit to simulate timing
        setTimeout(resolve, Math.min(text.length * 50, 5000))
        return
      }

      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Find best matching voice based on language
      const voices = speechSynthesis.getVoices()
      const langPrefix = language?.split('-')[0] || 'en'
      let selectedVoice: SpeechSynthesisVoice | null = null

      if (langPrefix === 'ar') {
        // Arabic voice selection
        const arabicVoices = voices.filter(v => v.lang.startsWith('ar'))
        selectedVoice = arabicVoices[0] || null
        console.log('[TTS Browser] Using Arabic voice:', selectedVoice?.name)
      } else {
        // English voice selection based on gender preference
        const preferredVoices = voices.filter(v => {
          if (!v.lang.startsWith('en')) return false
          const voiceName = v.name.toLowerCase()
          if (config.browserGender === 'female') {
            return voiceName.includes('female') || voiceName.includes('zira') ||
                   voiceName.includes('samantha') || voiceName.includes('karen') ||
                   voiceName.includes('victoria') || voiceName.includes('susan')
          } else {
            return voiceName.includes('male') || voiceName.includes('david') ||
                   voiceName.includes('mark') || voiceName.includes('daniel') ||
                   voiceName.includes('james') || voiceName.includes('george')
          }
        })

        const englishVoices = voices.filter(v => v.lang.startsWith('en'))
        selectedVoice = preferredVoices[0] || englishVoices[0] || voices[0]
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

      utterance.pitch = config.browserPitch
      utterance.rate = config.browserRate
      utterance.volume = 0.9

      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()

      speechSynthesis.speak(utterance)
    })
  }

  /**
   * Helper to play audio blob
   */
  private playAudioBlob(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(blob)
      this.currentAudio = new Audio(audioUrl)

      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        this.currentAudio = null
        resolve()
      }

      this.currentAudio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl)
        this.currentAudio = null
        reject(e)
      }

      this.currentAudio.play().catch(reject)
    })
  }

  /**
   * Stop all speech immediately
   */
  stop(): void {
    this.speechQueue = []

    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio = null
    }

    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
  }

  /**
   * Clear the speech queue without stopping current speech
   */
  clearQueue(): void {
    this.speechQueue = []
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.speechQueue.length
  }

  /**
   * Stop all audio immediately and clear queue
   * Used when meeting room closes or minimizes
   */
  stopAllAudio(): void {
    // Clear the queue
    this.speechQueue = []

    // Stop current audio playback
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }

    // Cancel browser speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }

    // Reset processing flag
    this.isProcessing = false

    // Mark as inactive
    this.isActive = false
  }

  /**
   * Set the active workflow ID
   * Only audio for this workflow will be played
   * If workflow changes, stop current audio
   */
  setActiveWorkflow(workflowId: string | null): void {
    // If switching to a different workflow, stop current audio
    if (this.activeWorkflowId !== workflowId && this.activeWorkflowId !== null) {
      this.stopAllAudio()
    }

    this.activeWorkflowId = workflowId
    this.isActive = workflowId !== null
  }

  /**
   * Check if audio should play for this workflow
   */
  shouldPlayAudio(workflowId: string): boolean {
    // If no active workflow is set, allow all audio
    if (this.activeWorkflowId === null) {
      return this.isActive
    }

    // Only play if it matches the active workflow
    return this.isActive && this.activeWorkflowId === workflowId
  }

  /**
   * Get current active workflow ID
   */
  getActiveWorkflow(): string | null {
    return this.activeWorkflowId
  }

  /**
   * Check if service is currently active
   */
  isServiceActive(): boolean {
    return this.isActive
  }
}

// Export singleton
export const humanTTSService = new HumanTTSService()

// Re-export voice profiles and utilities from config
export {
  AGENT_VOICE_PROFILES,
  ARABIC_VOICE_PROFILES,
  EMOTION_PROSODY,
  getVoiceProfile,
  KUWAITI_SLANG_PATTERNS,
  GULF_ARABIC_PATTERNS,
  EGYPTIAN_ARABIC_PATTERNS,
  LEVANTINE_ARABIC_PATTERNS
} from '../config/voice-profiles'

export default humanTTSService

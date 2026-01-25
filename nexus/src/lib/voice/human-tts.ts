/**
 * Human-Like TTS Service (Enhanced)
 *
 * Ultra-realistic text-to-speech system that sounds indistinguishable from humans.
 * Supports multiple TTS providers with automatic fallback, dialect detection,
 * emotion modulation, and distinct voice personalities for each AI agent.
 *
 * ARCHITECTURE:
 * - Multi-provider support (ElevenLabs > Azure > Google > OpenAI > Browser)
 * - Automatic Arabic dialect detection (Gulf/Kuwaiti, Egyptian, Levantine, MSA)
 * - Response in SAME language/dialect as user input
 * - Per-agent voice profiles with distinct personalities
 * - Emotion detection and prosody modulation
 * - Queue-based speech to prevent overlapping
 * - SSML generation for natural prosody
 *
 * SECURITY: All API calls go through backend proxy - no keys exposed to browser.
 */

import {
  type TTSProvider,
  type SupportedLanguage,
  type ArabicDialect,
  type VoiceEmotion,
  type AgentVoiceProfile,
  ARABIC_VOICE_PROFILES,
  KUWAITI_SLANG_PATTERNS,
  GULF_ARABIC_PATTERNS,
  EGYPTIAN_ARABIC_PATTERNS,
  LEVANTINE_ARABIC_PATTERNS,
  EMOTION_PROSODY,
  getVoiceProfile
} from '../../config/voice-profiles'

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || ''

// Provider priority order
const PROVIDER_PRIORITY: TTSProvider[] = ['elevenlabs', 'azure', 'google', 'openai', 'browser']

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface TTSOptions {
  agentId: string
  language?: SupportedLanguage
  emotion?: VoiceEmotion
  priority?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

export interface SpeechQueueItem {
  id: string
  text: string
  agentId: string
  language: SupportedLanguage
  emotion: VoiceEmotion
  priority: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

export interface DialectDetectionResult {
  language: SupportedLanguage
  dialect: ArabicDialect | null
  confidence: number
  isArabic: boolean
  detectedPatterns: string[]
}

export interface ProviderStatus {
  elevenlabs: boolean
  azure: boolean
  google: boolean
  openai: boolean
  browser: boolean
}

// =============================================================================
// DIALECT DETECTION ENGINE
// =============================================================================

/**
 * Advanced Arabic Dialect Detection
 *
 * Detects Arabic dialect from text input, specifically optimized for:
 * - Kuwaiti Arabic slang and expressions
 * - Gulf Arabic (Saudi, UAE, Qatar, Bahrain)
 * - Egyptian Arabic
 * - Levantine Arabic (Lebanese, Syrian, Jordanian)
 * - Modern Standard Arabic (MSA)
 */
export class DialectDetector {
  private static instance: DialectDetector

  static getInstance(): DialectDetector {
    if (!DialectDetector.instance) {
      DialectDetector.instance = new DialectDetector()
    }
    return DialectDetector.instance
  }

  /**
   * Detect language and dialect from text
   */
  detect(text: string): DialectDetectionResult {
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
  isKuwaitiArabic(text: string): boolean {
    let score = 0
    KUWAITI_SLANG_PATTERNS.words.forEach(word => {
      if (text.includes(word)) score++
    })
    KUWAITI_SLANG_PATTERNS.patterns.forEach(pattern => {
      if (pattern.test(text)) score += 2
    })
    return score >= 3
  }
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

// =============================================================================
// SSML GENERATOR
// =============================================================================

/**
 * Generate SSML markup for natural prosody
 */
export class SSMLGenerator {
  /**
   * Generate SSML for Azure Neural TTS
   */
  static forAzure(
    text: string,
    voiceName: string,
    locale: string,
    emotion: VoiceEmotion,
    style?: string,
    styleDegree?: number
  ): string {
    const prosody = EMOTION_PROSODY[emotion]

    return `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${locale}">
  <voice name="${voiceName}">
    ${style ? `<mstts:express-as style="${style}" styledegree="${styleDegree || 1}">` : ''}
    <prosody rate="${prosody.rate}" pitch="${prosody.pitch}" volume="${prosody.volume}">
      ${this.escapeXml(text)}
    </prosody>
    ${style ? '</mstts:express-as>' : ''}
  </voice>
</speak>`.trim()
  }

  /**
   * Generate SSML for Google Cloud TTS
   */
  static forGoogle(
    text: string,
    emotion: VoiceEmotion
  ): string {
    const prosody = EMOTION_PROSODY[emotion]

    return `
<speak>
  <prosody rate="${prosody.rate}" pitch="${prosody.pitch}" volume="${prosody.volume}">
    ${this.escapeXml(text)}
  </prosody>
</speak>`.trim()
  }

  /**
   * Add natural pauses and emphasis
   */
  static addNaturalBreaks(text: string): string {
    // Add pauses after punctuation
    return text
      .replace(/\./g, '.<break time="300ms"/>')
      .replace(/,/g, ',<break time="150ms"/>')
      .replace(/:/g, ':<break time="200ms"/>')
      .replace(/;/g, ';<break time="200ms"/>')
      .replace(/\?/g, '?<break time="300ms"/>')
      .replace(/!/g, '!<break time="300ms"/>')
  }

  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}

// =============================================================================
// HUMAN TTS SERVICE
// =============================================================================

/**
 * Human-Like TTS Service
 *
 * Features:
 * - Multi-provider with automatic fallback
 * - Dialect detection (especially Kuwaiti Arabic)
 * - Per-agent voice profiles
 * - Emotion-aware prosody
 * - Queue-based to prevent overlap
 */
export class HumanTTSService {
  private static instance: HumanTTSService

  // Provider availability
  private providerStatus: ProviderStatus = {
    elevenlabs: false,
    azure: false,
    google: false,
    openai: false,
    browser: true
  }

  private activeProvider: TTSProvider = 'browser'
  private dialectDetector: DialectDetector

  // Speech queue management
  private speechQueue: SpeechQueueItem[] = []
  private isProcessing = false
  private currentAudio: HTMLAudioElement | null = null
  private isMuted = false

  // Language tracking
  private detectedUserLanguage: SupportedLanguage = 'en-US'
  private detectedDialect: ArabicDialect | null = null

  // Workflow tracking
  private activeWorkflowId: string | null = null
  private isActive = true

  private constructor() {
    this.dialectDetector = DialectDetector.getInstance()
    this.checkProviderStatus()
  }

  static getInstance(): HumanTTSService {
    if (!HumanTTSService.instance) {
      HumanTTSService.instance = new HumanTTSService()
    }
    return HumanTTSService.instance
  }

  // ===========================================================================
  // PROVIDER MANAGEMENT
  // ===========================================================================

  /**
   * Check which TTS providers are available via backend
   */
  private async checkProviderStatus(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/api/ai-proxy/status`)
      if (response.ok) {
        const data = await response.json()
        this.providerStatus = {
          elevenlabs: data.services?.elevenlabs?.configured === true,
          azure: data.services?.azure?.tts?.configured === true,
          google: data.services?.google?.tts?.configured === true,
          openai: data.services?.openai?.configured === true,
          browser: true
        }

        // Set active provider based on availability
        for (const provider of PROVIDER_PRIORITY) {
          if (this.providerStatus[provider]) {
            this.activeProvider = provider
            break
          }
        }

        console.log(`[HumanTTS] Active provider: ${this.activeProvider}`)
        console.log(`[HumanTTS] Provider status:`, this.providerStatus)
      }
    } catch {
      console.log('[HumanTTS] Could not check backend status, using browser fallback')
      this.activeProvider = 'browser'
    }
  }

  /**
   * Get current provider
   */
  getProvider(): TTSProvider {
    return this.activeProvider
  }

  /**
   * Check if high-quality TTS is available
   */
  hasHighQualityTTS(): boolean {
    return ['elevenlabs', 'azure', 'google', 'openai'].includes(this.activeProvider)
  }

  /**
   * Get provider status
   */
  getProviderStatus(): ProviderStatus {
    return { ...this.providerStatus }
  }

  // ===========================================================================
  // LANGUAGE & DIALECT MANAGEMENT
  // ===========================================================================

  /**
   * Detect and store user's language from their speech/text input
   * This allows responding in the SAME language/dialect
   */
  detectUserLanguage(userInput: string): DialectDetectionResult {
    const result = this.dialectDetector.detect(userInput)
    this.detectedUserLanguage = result.language
    this.detectedDialect = result.dialect

    console.log(`[HumanTTS] Detected language: ${result.language}, dialect: ${result.dialect}, confidence: ${result.confidence}`)

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

  // ===========================================================================
  // SPEECH QUEUE MANAGEMENT
  // ===========================================================================

  /**
   * Add speech to queue with agent-specific voice
   */
  async queueSpeech(text: string, options: TTSOptions): Promise<void> {
    if (this.isMuted) {
      options.onStart?.()
      await new Promise(resolve => setTimeout(resolve, Math.min(text.length * 30, 3000)))
      options.onEnd?.()
      return
    }

    const language = options.language || this.detectedUserLanguage
    const emotion = options.emotion || detectEmotion(text)

    const item: SpeechQueueItem = {
      id: `${options.agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      text,
      agentId: options.agentId,
      language,
      emotion,
      priority: options.priority ?? 0,
      onStart: options.onStart,
      onEnd: options.onEnd,
      onError: options.onError
    }

    // Insert by priority
    const insertIndex = this.speechQueue.findIndex(q => q.priority < item.priority)
    if (insertIndex === -1) {
      this.speechQueue.push(item)
    } else {
      this.speechQueue.splice(insertIndex, 0, item)
    }

    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  /**
   * Process speech queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.speechQueue.length === 0) return

    this.isProcessing = true

    while (this.speechQueue.length > 0 && !this.isMuted) {
      const item = this.speechQueue.shift()!
      item.onStart?.()

      try {
        await this.speakInternal(item)
      } catch (error) {
        console.error('[HumanTTS] Speech error:', error)
        item.onError?.(error instanceof Error ? error : new Error(String(error)))
      }

      item.onEnd?.()

      // Natural pause between speeches
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    this.isProcessing = false
  }

  /**
   * Internal speak method - routes to appropriate provider
   */
  private async speakInternal(item: SpeechQueueItem): Promise<void> {
    const profile = getVoiceProfile(item.agentId)
    const text = item.text.slice(0, 500) // Limit text length

    // Try providers in priority order with fallback
    const providers: TTSProvider[] = [this.activeProvider]

    // Add fallback providers
    for (const p of PROVIDER_PRIORITY) {
      if (p !== this.activeProvider && this.providerStatus[p]) {
        providers.push(p)
      }
    }

    for (const provider of providers) {
      try {
        switch (provider) {
          case 'elevenlabs':
            await this.speakWithElevenLabs(text, profile, item)
            return
          case 'azure':
            await this.speakWithAzure(text, profile, item)
            return
          case 'google':
            await this.speakWithGoogle(text, profile, item)
            return
          case 'openai':
            await this.speakWithOpenAI(text, profile, item)
            return
          case 'browser':
            await this.speakWithBrowser(text, profile, item)
            return
        }
      } catch (error) {
        console.warn(`[HumanTTS] ${provider} failed, trying fallback:`, error)
        continue
      }
    }
  }

  // ===========================================================================
  // PROVIDER IMPLEMENTATIONS
  // ===========================================================================

  /**
   * ElevenLabs TTS - Most human-like voices
   */
  private async speakWithElevenLabs(
    text: string,
    profile: AgentVoiceProfile,
    item: SpeechQueueItem
  ): Promise<void> {
    const config = profile.elevenlabs
    const { stability, similarityBoost, style, useSpeakerBoost } = config.settings

    // Use Arabic voice if needed
    let voiceId = config.voiceId
    if (item.language.startsWith('ar') && this.detectedDialect) {
      const arabicConfig = ARABIC_VOICE_PROFILES[this.detectedDialect]
      if (arabicConfig) {
        voiceId = arabicConfig.elevenlabs.voiceId
      }
    }

    const response = await fetch(`${API_BASE}/api/ai-proxy/elevenlabs/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceId,
        modelId: config.modelId,
        stability,
        similarityBoost,
        style,
        useSpeakerBoost
      })
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS failed: ${response.status}`)
    }

    const audioBlob = await response.blob()
    await this.playAudioBlob(audioBlob)
  }

  /**
   * Azure Neural TTS - High quality with emotion support
   */
  private async speakWithAzure(
    text: string,
    profile: AgentVoiceProfile,
    item: SpeechQueueItem
  ): Promise<void> {
    const config = profile.azure

    // Use Arabic voice if needed
    let voiceName = config.voiceName
    let locale = config.locale
    if (item.language.startsWith('ar') && this.detectedDialect) {
      const arabicConfig = ARABIC_VOICE_PROFILES[this.detectedDialect]
      if (arabicConfig) {
        voiceName = arabicConfig.azure.voiceName
        locale = arabicConfig.azure.locale
      }
    }

    // Generate SSML with emotion
    const ssml = SSMLGenerator.forAzure(
      text,
      voiceName,
      locale,
      item.emotion,
      config.style,
      config.styleDegree
    )

    const response = await fetch(`${API_BASE}/api/ai-proxy/azure/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ssml,
        voiceName,
        outputFormat: 'audio-24khz-96kbitrate-mono-mp3'
      })
    })

    if (!response.ok) {
      throw new Error(`Azure TTS failed: ${response.status}`)
    }

    const audioBlob = await response.blob()
    await this.playAudioBlob(audioBlob)
  }

  /**
   * Google Cloud TTS - WaveNet voices
   */
  private async speakWithGoogle(
    text: string,
    profile: AgentVoiceProfile,
    item: SpeechQueueItem
  ): Promise<void> {
    const config = profile.google

    // Use Arabic voice if needed
    let voiceName = config.name
    let languageCode = config.languageCode
    if (item.language.startsWith('ar') && this.detectedDialect) {
      const arabicConfig = ARABIC_VOICE_PROFILES[this.detectedDialect]
      if (arabicConfig) {
        voiceName = arabicConfig.google.name
        languageCode = arabicConfig.google.languageCode
      }
    }

    // Generate SSML with emotion
    const ssml = SSMLGenerator.forGoogle(text, item.emotion)

    const response = await fetch(`${API_BASE}/api/ai-proxy/google/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ssml,
        voice: {
          name: voiceName,
          languageCode,
          ssmlGender: config.ssmlGender
        },
        audioConfig: {
          audioEncoding: 'MP3',
          ...config.audioConfig
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Google TTS failed: ${response.status}`)
    }

    const audioBlob = await response.blob()
    await this.playAudioBlob(audioBlob)
  }

  /**
   * OpenAI TTS - Good quality fallback
   */
  private async speakWithOpenAI(
    text: string,
    profile: AgentVoiceProfile,
    _item: SpeechQueueItem
  ): Promise<void> {
    const config = profile.openai

    const response = await fetch(`${API_BASE}/api/ai-proxy/openai/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: config.voice,
        model: config.model,
        speed: config.speed
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI TTS failed: ${response.status}`)
    }

    const audioBlob = await response.blob()
    await this.playAudioBlob(audioBlob)
  }

  /**
   * Browser Speech Synthesis - Final fallback
   */
  private async speakWithBrowser(
    text: string,
    profile: AgentVoiceProfile,
    item: SpeechQueueItem
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        setTimeout(resolve, Math.min(text.length * 50, 5000))
        return
      }

      speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      const config = profile.browser

      // Find best matching voice
      const voices = speechSynthesis.getVoices()
      let selectedVoice: SpeechSynthesisVoice | null = null

      // First try preferred voices
      for (const name of config.preferredVoiceNames) {
        const voice = voices.find(v =>
          v.name.toLowerCase().includes(name.toLowerCase())
        )
        if (voice) {
          selectedVoice = voice
          break
        }
      }

      // Fallback to language-matching voice
      if (!selectedVoice) {
        const langPrefix = item.language.split('-')[0]
        selectedVoice = voices.find(v => v.lang.startsWith(langPrefix)) || voices[0]
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

      // Apply emotion-based prosody adjustments
      const prosody = EMOTION_PROSODY[item.emotion]
      const rateMultiplier = parseFloat(prosody.rate.replace('%', '')) / 100 || 1
      const pitchOffset = parseFloat(prosody.pitch.replace('%', '').replace('+', '')) / 100 || 0

      utterance.pitch = config.pitch + pitchOffset
      utterance.rate = config.rate * rateMultiplier
      utterance.volume = config.volume

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(event.error))

      speechSynthesis.speak(utterance)
    })
  }

  /**
   * Play audio blob
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

  // ===========================================================================
  // CONTROL METHODS
  // ===========================================================================

  /**
   * Stop all speech
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
   * Stop all audio immediately
   */
  stopAllAudio(): void {
    this.speechQueue = []

    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }

    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }

    this.isProcessing = false
    this.isActive = false
  }

  /**
   * Clear queue without stopping current speech
   */
  clearQueue(): void {
    this.speechQueue = []
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
   * Get queue length
   */
  getQueueLength(): number {
    return this.speechQueue.length
  }

  /**
   * Set active workflow
   */
  setActiveWorkflow(workflowId: string | null): void {
    if (this.activeWorkflowId !== workflowId && this.activeWorkflowId !== null) {
      this.stopAllAudio()
    }
    this.activeWorkflowId = workflowId
    this.isActive = workflowId !== null
  }

  /**
   * Check if audio should play for workflow
   */
  shouldPlayAudio(workflowId: string): boolean {
    if (this.activeWorkflowId === null) {
      return this.isActive
    }
    return this.isActive && this.activeWorkflowId === workflowId
  }

  /**
   * Check if service is configured
   */
  get isConfigured(): boolean {
    return this.providerStatus.elevenlabs ||
           this.providerStatus.azure ||
           this.providerStatus.google ||
           this.providerStatus.openai
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Singleton instance
export const humanTTSService = HumanTTSService.getInstance()
export const dialectDetector = DialectDetector.getInstance()

// Re-export types and configs
export {
  type TTSProvider,
  type SupportedLanguage,
  type ArabicDialect,
  type VoiceEmotion,
  type AgentVoiceProfile,
  AGENT_VOICE_PROFILES,
  getVoiceProfile
} from '../../config/voice-profiles'

export default humanTTSService

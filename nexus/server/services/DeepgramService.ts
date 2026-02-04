/**
 * DeepgramService - Arabic Speech-to-Text via Composio
 *
 * Provides transcription, summarization, and topic detection for audio content.
 * Optimized for Gulf Arabic (ar-AE) and English (en-US).
 *
 * @NEXUS-FIX-081: Deepgram service with Gulf Arabic dialect support
 */

import { composioService } from './ComposioService'

// Supported audio formats
export type AudioFormat = 'ogg' | 'mp3' | 'wav' | 'webm' | 'flac' | 'm4a'

// Language codes for transcription
export type LanguageCode =
  | 'ar'      // Arabic (general)
  | 'ar-AE'   // Arabic - UAE/Gulf dialect
  | 'ar-SA'   // Arabic - Saudi
  | 'ar-KW'   // Arabic - Kuwait (maps to ar-AE)
  | 'en'      // English (general)
  | 'en-US'   // English - US
  | 'en-GB'   // English - UK
  | 'auto'    // Auto-detect language

// Map Kuwaiti to Gulf Arabic (supported by Deepgram)
const LANGUAGE_MAPPING: Record<string, string> = {
  'ar-KW': 'ar-AE',  // Kuwait uses Gulf dialect
  'ar-QA': 'ar-AE',  // Qatar uses Gulf dialect
  'ar-BH': 'ar-AE',  // Bahrain uses Gulf dialect
  'ar-OM': 'ar-AE',  // Oman uses Gulf dialect
}

export interface TranscriptionResult {
  success: boolean
  text?: string
  language?: string
  confidence?: number
  duration?: number
  words?: Array<{
    word: string
    start: number
    end: number
    confidence: number
  }>
  error?: string
  executionTimeMs?: number
}

export interface SummarizationResult {
  success: boolean
  summary?: string
  topics?: string[]
  error?: string
}

export interface TopicDetectionResult {
  success: boolean
  topics?: Array<{
    topic: string
    confidence: number
  }>
  error?: string
}

export interface TTSResult {
  success: boolean
  audioUrl?: string
  audioBuffer?: Buffer
  format?: string
  error?: string
}

/**
 * Deepgram Service for Voice AI
 */
class DeepgramServiceClass {
  private initialized: boolean = false

  /**
   * Initialize the Deepgram service
   * Requires Composio to be configured with Deepgram OAuth connection
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if Composio is initialized
      const composioInitialized = await composioService.initialize()
      if (!composioInitialized) {
        console.log('[DeepgramService] Composio not initialized - demo mode')
        return false
      }

      // Check if Deepgram is connected via Composio
      const connection = await composioService.checkConnection('deepgram')
      if (!connection.connected) {
        console.log('[DeepgramService] Deepgram not connected via Composio')
        console.log('[DeepgramService] Connect at: https://app.composio.dev/ → Integrations → Deepgram')
        return false
      }

      this.initialized = true
      console.log('[DeepgramService] Initialized via Composio')
      return true
    } catch (error) {
      console.error('[DeepgramService] Initialization error:', error)
      return false
    }
  }

  /**
   * Get the correct language code for Deepgram
   */
  private normalizeLanguage(language: LanguageCode | string): string {
    // Check for Gulf dialect mappings
    if (LANGUAGE_MAPPING[language]) {
      return LANGUAGE_MAPPING[language]
    }
    return language
  }

  /**
   * Detect if audio content is likely Arabic based on initial transcription
   */
  private async detectLanguage(audioUrl: string): Promise<string> {
    try {
      // Use auto-detection with a short sample
      const result = await composioService.executeTool(
        'DEEPGRAM_SPEECH_TO_TEXT_PRE_RECORDED',
        {
          url: audioUrl,
          detect_language: true,
          punctuate: false,
        }
      )

      if (result.success && result.data) {
        const data = result.data as Record<string, unknown>
        return (data.detected_language as string) || 'en'
      }
      return 'en'
    } catch {
      return 'en' // Default to English
    }
  }

  /**
   * Transcribe audio to text
   *
   * @param audioUrl - Public URL to audio file (or base64 data URI)
   * @param language - Language code (ar, ar-AE, en, en-US, auto)
   * @param options - Additional transcription options
   */
  async transcribe(
    audioUrl: string,
    language: LanguageCode | string = 'auto',
    options: {
      punctuate?: boolean
      diarize?: boolean // Speaker detection
      smartFormat?: boolean
      keywords?: string[]
    } = {}
  ): Promise<TranscriptionResult> {
    const startTime = Date.now()

    // Demo mode if not initialized
    if (!this.initialized) {
      console.log('[DeepgramService] Demo mode - simulating transcription')
      return {
        success: true,
        text: language.startsWith('ar')
          ? 'هذا نص تجريبي للتعرف على الكلام باللغة العربية'
          : 'This is a demo transcription text for testing purposes.',
        language: language === 'auto' ? 'en-US' : language,
        confidence: 0.95,
        duration: 5.0,
        executionTimeMs: Date.now() - startTime,
      }
    }

    try {
      // Normalize language code
      const normalizedLang = language === 'auto' ? undefined : this.normalizeLanguage(language)

      // Execute Deepgram transcription via Composio
      const result = await composioService.executeTool(
        'DEEPGRAM_SPEECH_TO_TEXT_PRE_RECORDED',
        {
          url: audioUrl,
          language: normalizedLang,
          detect_language: language === 'auto',
          punctuate: options.punctuate ?? true,
          diarize: options.diarize ?? false,
          smart_format: options.smartFormat ?? true,
          keywords: options.keywords,
        }
      )

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Transcription failed',
          executionTimeMs: Date.now() - startTime,
        }
      }

      // Parse Deepgram response
      const data = result.data as Record<string, unknown>
      const transcript = this.parseTranscriptResponse(data)

      return {
        success: true,
        text: transcript.text,
        language: transcript.language || normalizedLang || 'en',
        confidence: transcript.confidence,
        duration: transcript.duration,
        words: transcript.words,
        executionTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      console.error('[DeepgramService] Transcription error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Parse Deepgram response into our format
   */
  private parseTranscriptResponse(data: Record<string, unknown>): {
    text: string
    language?: string
    confidence?: number
    duration?: number
    words?: Array<{ word: string; start: number; end: number; confidence: number }>
  } {
    // Handle various Deepgram response formats
    const results = data.results as Record<string, unknown> | undefined
    const channels = results?.channels as Array<Record<string, unknown>> | undefined
    const firstChannel = channels?.[0]
    const alternatives = firstChannel?.alternatives as Array<Record<string, unknown>> | undefined
    const firstAlt = alternatives?.[0]

    const text = (firstAlt?.transcript as string) || (data.transcript as string) || ''
    const confidence = (firstAlt?.confidence as number) || (data.confidence as number)
    const words = firstAlt?.words as Array<{ word: string; start: number; end: number; confidence: number }> | undefined
    const metadata = data.metadata as Record<string, unknown> | undefined
    const duration = metadata?.duration as number | undefined
    const language = (data.detected_language as string) || (metadata?.language as string)

    return { text, language, confidence, duration, words }
  }

  /**
   * Summarize audio content
   *
   * @param audioUrl - Public URL to audio file
   */
  async summarize(audioUrl: string): Promise<SummarizationResult> {
    if (!this.initialized) {
      return {
        success: true,
        summary: 'Demo summary: This audio discusses important topics related to the conversation.',
        topics: ['conversation', 'demo'],
      }
    }

    try {
      const result = await composioService.executeTool('DEEPGRAM_SUMMARIZE_AUDIO', {
        url: audioUrl,
      })

      if (!result.success) {
        return { success: false, error: result.error }
      }

      const data = result.data as Record<string, unknown>
      return {
        success: true,
        summary: data.summary as string,
        topics: data.topics as string[] | undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Summarization failed',
      }
    }
  }

  /**
   * Detect topics in audio
   *
   * @param audioUrl - Public URL to audio file
   */
  async detectTopics(audioUrl: string): Promise<TopicDetectionResult> {
    if (!this.initialized) {
      return {
        success: true,
        topics: [
          { topic: 'general', confidence: 0.9 },
          { topic: 'demo', confidence: 0.85 },
        ],
      }
    }

    try {
      const result = await composioService.executeTool('DEEPGRAM_TOPIC_DETECTION', {
        url: audioUrl,
      })

      if (!result.success) {
        return { success: false, error: result.error }
      }

      const data = result.data as Record<string, unknown>
      return {
        success: true,
        topics: data.topics as Array<{ topic: string; confidence: number }>,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Topic detection failed',
      }
    }
  }

  /**
   * Convert text to speech
   *
   * @param text - Text to convert
   * @param voice - Voice ID or name
   * @param language - Language code
   */
  async textToSpeech(
    text: string,
    voice: string = 'aura-asteria-en',
    language: LanguageCode | string = 'en'
  ): Promise<TTSResult> {
    if (!this.initialized) {
      return {
        success: true,
        audioUrl: 'demo://audio.mp3',
        format: 'mp3',
      }
    }

    try {
      const result = await composioService.executeTool('DEEPGRAM_TEXT_TO_SPEECH_REST', {
        text,
        model_id: voice,
      })

      if (!result.success) {
        return { success: false, error: result.error }
      }

      const data = result.data as Record<string, unknown>
      return {
        success: true,
        audioUrl: data.audio_url as string | undefined,
        audioBuffer: data.audio as Buffer | undefined,
        format: 'mp3',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'TTS failed',
      }
    }
  }

  /**
   * Get available speech-to-text models
   */
  async getModels(): Promise<{ success: boolean; models?: unknown[]; error?: string }> {
    if (!this.initialized) {
      return {
        success: true,
        models: [
          { name: 'nova-2', description: 'Latest general model' },
          { name: 'nova-2-general', description: 'General purpose' },
          { name: 'nova-2-meeting', description: 'Meeting transcription' },
          { name: 'nova-2-phonecall', description: 'Phone call audio' },
        ],
      }
    }

    try {
      const result = await composioService.executeTool('DEEPGRAM_GET_MODELS', {})
      if (!result.success) {
        return { success: false, error: result.error }
      }
      return { success: true, models: result.data as unknown[] }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get models' }
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized
  }

  /**
   * Get supported audio formats
   */
  getSupportedFormats(): AudioFormat[] {
    return ['ogg', 'mp3', 'wav', 'webm', 'flac', 'm4a']
  }

  /**
   * Get supported language codes
   */
  getSupportedLanguages(): LanguageCode[] {
    return ['ar', 'ar-AE', 'ar-SA', 'ar-KW', 'en', 'en-US', 'en-GB', 'auto']
  }
}

// Export singleton instance
const DeepgramService = new DeepgramServiceClass()
export default DeepgramService

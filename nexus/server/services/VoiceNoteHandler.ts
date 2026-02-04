/**
 * VoiceNoteHandler - WhatsApp Voice Note Processing
 *
 * Handles the complete voice note pipeline:
 * 1. Download audio from WhatsApp Media API
 * 2. Transcribe using Deepgram (Gulf Arabic + English)
 * 3. Generate voice response using ElevenLabs (optional)
 *
 * @NEXUS-FIX-083: Voice note handler for WhatsApp integration
 */

import DeepgramService, { TranscriptionResult, LanguageCode } from './DeepgramService'
import ElevenLabsService, { TTSResult } from './ElevenLabsService'
import { composioService } from './ComposioService'

// =============================================================================
// TYPES
// =============================================================================

export interface VoiceNoteResult {
  success: boolean
  transcription?: string
  language?: string
  confidence?: number
  durationMs?: number
  processingTimeMs?: number
  error?: string
}

export interface VoiceResponseResult {
  success: boolean
  audioBase64?: string
  audioUrl?: string
  format?: string
  error?: string
}

export interface MediaInfo {
  url: string
  mimeType: string
  fileSize?: number
}

// =============================================================================
// CONSTANTS
// =============================================================================

// WhatsApp audio formats
const SUPPORTED_AUDIO_FORMATS = ['audio/ogg', 'audio/opus', 'audio/mpeg', 'audio/mp4', 'audio/amr']

// Language detection patterns
const ARABIC_PATTERN = /[\u0600-\u06FF]/

// =============================================================================
// VOICE NOTE HANDLER CLASS
// =============================================================================

class VoiceNoteHandlerClass {
  private initialized = false

  /**
   * Initialize voice services
   */
  async initialize(): Promise<boolean> {
    try {
      // Initialize both services
      const [deepgramReady, elevenLabsReady] = await Promise.all([
        DeepgramService.initialize(),
        ElevenLabsService.initialize(),
      ])

      this.initialized = deepgramReady // TTS is optional

      console.log('[VoiceNoteHandler] Initialized:', {
        deepgram: deepgramReady ? 'ready' : 'demo mode',
        elevenLabs: elevenLabsReady ? 'ready' : 'demo mode',
      })

      return this.initialized
    } catch (error) {
      console.error('[VoiceNoteHandler] Initialization error:', error)
      return false
    }
  }

  /**
   * Process a WhatsApp voice note
   *
   * @param mediaId - WhatsApp media ID
   * @param mimeType - MIME type of the audio
   * @param preferredLanguage - Language hint (ar, en, or auto)
   */
  async processVoiceNote(
    mediaId: string,
    mimeType: string,
    preferredLanguage: LanguageCode | 'auto' = 'auto'
  ): Promise<VoiceNoteResult> {
    const startTime = Date.now()

    // Validate format
    if (!this.isSupported(mimeType)) {
      return {
        success: false,
        error: `Unsupported audio format: ${mimeType}. Supported: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`,
      }
    }

    try {
      // Step 1: Get media URL from WhatsApp
      const mediaInfo = await this.getMediaInfo(mediaId)
      if (!mediaInfo) {
        return {
          success: false,
          error: 'Failed to retrieve audio from WhatsApp. The media may have expired.',
        }
      }

      // Step 2: Transcribe the audio
      const transcription = await DeepgramService.transcribe(
        mediaInfo.url,
        preferredLanguage,
        {
          punctuate: true,
          smartFormat: true,
          diarize: false, // Single speaker for voice notes
        }
      )

      if (!transcription.success) {
        return {
          success: false,
          error: transcription.error || 'Transcription failed',
          processingTimeMs: Date.now() - startTime,
        }
      }

      return {
        success: true,
        transcription: transcription.text,
        language: transcription.language,
        confidence: transcription.confidence,
        durationMs: transcription.duration ? transcription.duration * 1000 : undefined,
        processingTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      console.error('[VoiceNoteHandler] Processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Voice note processing failed',
        processingTimeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Generate voice response from text
   *
   * @param text - Text to convert to speech
   * @param language - Output language (ar or en)
   */
  async generateVoiceResponse(
    text: string,
    language: 'ar' | 'en' = 'en'
  ): Promise<VoiceResponseResult> {
    try {
      // Use WhatsApp-optimized format
      const result = await ElevenLabsService.synthesizeForWhatsApp(
        text,
        language === 'ar' ? 'ar-AE' : 'en-US'
      )

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Voice synthesis failed',
        }
      }

      return {
        success: true,
        audioBase64: result.audioBase64,
        audioUrl: result.audioUrl,
        format: result.format,
      }
    } catch (error) {
      console.error('[VoiceNoteHandler] Voice response error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Voice response generation failed',
      }
    }
  }

  /**
   * Full voice note pipeline: Transcribe → Process with AI → Generate voice response
   *
   * @param mediaId - WhatsApp media ID
   * @param mimeType - MIME type of the audio
   * @param processText - Function to process the transcribed text (returns AI response)
   * @param enableVoiceResponse - Whether to generate voice response (default: false)
   */
  async processVoiceConversation(
    mediaId: string,
    mimeType: string,
    processText: (text: string, language: string) => Promise<string>,
    enableVoiceResponse = false
  ): Promise<{
    transcription: VoiceNoteResult
    aiResponse?: string
    voiceResponse?: VoiceResponseResult
  }> {
    // Step 1: Transcribe
    const transcription = await this.processVoiceNote(mediaId, mimeType)

    if (!transcription.success || !transcription.transcription) {
      return { transcription }
    }

    // Step 2: Process with AI
    const language = transcription.language?.startsWith('ar') ? 'ar' : 'en'
    const aiResponse = await processText(transcription.transcription, language)

    // Step 3: Generate voice response (if enabled)
    let voiceResponse: VoiceResponseResult | undefined
    if (enableVoiceResponse && aiResponse) {
      voiceResponse = await this.generateVoiceResponse(aiResponse, language)
    }

    return {
      transcription,
      aiResponse,
      voiceResponse,
    }
  }

  /**
   * Get media info from WhatsApp via Composio
   */
  private async getMediaInfo(mediaId: string): Promise<MediaInfo | null> {
    try {
      // Try to get media URL from WhatsApp via Composio
      const result = await composioService.executeTool('WHATSAPP_GET_MEDIA', {
        media_id: mediaId,
      })

      if (!result.success) {
        console.error('[VoiceNoteHandler] Failed to get media info:', result.error)
        return null
      }

      const data = result.data as { url?: string; mime_type?: string; file_size?: number }

      if (!data.url) {
        console.error('[VoiceNoteHandler] No URL in media response')
        return null
      }

      return {
        url: data.url,
        mimeType: data.mime_type || 'audio/ogg',
        fileSize: data.file_size,
      }
    } catch (error) {
      console.error('[VoiceNoteHandler] Error getting media info:', error)
      return null
    }
  }

  /**
   * Check if audio format is supported
   */
  isSupported(mimeType: string): boolean {
    return SUPPORTED_AUDIO_FORMATS.some(format =>
      mimeType.toLowerCase().includes(format.split('/')[1])
    )
  }

  /**
   * Detect language from text
   */
  detectLanguage(text: string): 'ar' | 'en' {
    return ARABIC_PATTERN.test(text) ? 'ar' : 'en'
  }

  /**
   * Check if voice processing is ready
   */
  isReady(): boolean {
    return this.initialized
  }

  /**
   * Get supported audio formats
   */
  getSupportedFormats(): string[] {
    return [...SUPPORTED_AUDIO_FORMATS]
  }
}

// =============================================================================
// EXPORT
// =============================================================================

const VoiceNoteHandler = new VoiceNoteHandlerClass()
export default VoiceNoteHandler

/**
 * DeepgramService - Arabic Speech-to-Text via Composio
 *
 * Provides transcription, summarization, and topic detection for audio content.
 * Optimized for Gulf Arabic (ar-AE) and English (en-US).
 *
 * @NEXUS-FIX-081: Deepgram service with Gulf Arabic dialect support
 */
import { composioService } from './ComposioService';
// Map Kuwaiti to Gulf Arabic (supported by Deepgram)
const LANGUAGE_MAPPING = {
    'ar-KW': 'ar-AE', // Kuwait uses Gulf dialect
    'ar-QA': 'ar-AE', // Qatar uses Gulf dialect
    'ar-BH': 'ar-AE', // Bahrain uses Gulf dialect
    'ar-OM': 'ar-AE', // Oman uses Gulf dialect
};
/**
 * Deepgram Service for Voice AI
 */
class DeepgramServiceClass {
    initialized = false;
    /**
     * Initialize the Deepgram service
     * Requires Composio to be configured with Deepgram OAuth connection
     */
    async initialize() {
        try {
            // Check if Composio is initialized
            const composioInitialized = await composioService.initialize();
            if (!composioInitialized) {
                console.log('[DeepgramService] Composio not initialized - demo mode');
                return false;
            }
            // Check if Deepgram is connected via Composio
            const connection = await composioService.checkConnection('deepgram');
            if (!connection.connected) {
                console.log('[DeepgramService] Deepgram not connected via Composio');
                console.log('[DeepgramService] Connect at: https://app.composio.dev/ → Integrations → Deepgram');
                return false;
            }
            this.initialized = true;
            console.log('[DeepgramService] Initialized via Composio');
            return true;
        }
        catch (error) {
            console.error('[DeepgramService] Initialization error:', error);
            return false;
        }
    }
    /**
     * Get the correct language code for Deepgram
     */
    normalizeLanguage(language) {
        // Check for Gulf dialect mappings
        if (LANGUAGE_MAPPING[language]) {
            return LANGUAGE_MAPPING[language];
        }
        return language;
    }
    /**
     * Detect if audio content is likely Arabic based on initial transcription
     */
    async detectLanguage(audioUrl) {
        try {
            // Use auto-detection with a short sample
            const result = await composioService.executeTool('DEEPGRAM_SPEECH_TO_TEXT_PRE_RECORDED', {
                url: audioUrl,
                detect_language: true,
                punctuate: false,
            });
            if (result.success && result.data) {
                const data = result.data;
                return data.detected_language || 'en';
            }
            return 'en';
        }
        catch {
            return 'en'; // Default to English
        }
    }
    /**
     * Transcribe audio to text
     *
     * @param audioUrl - Public URL to audio file (or base64 data URI)
     * @param language - Language code (ar, ar-AE, en, en-US, auto)
     * @param options - Additional transcription options
     */
    async transcribe(audioUrl, language = 'auto', options = {}) {
        const startTime = Date.now();
        // Demo mode if not initialized
        if (!this.initialized) {
            console.log('[DeepgramService] Demo mode - simulating transcription');
            return {
                success: true,
                text: language.startsWith('ar')
                    ? 'هذا نص تجريبي للتعرف على الكلام باللغة العربية'
                    : 'This is a demo transcription text for testing purposes.',
                language: language === 'auto' ? 'en-US' : language,
                confidence: 0.95,
                duration: 5.0,
                executionTimeMs: Date.now() - startTime,
            };
        }
        try {
            // Normalize language code
            const normalizedLang = language === 'auto' ? undefined : this.normalizeLanguage(language);
            // Execute Deepgram transcription via Composio
            const result = await composioService.executeTool('DEEPGRAM_SPEECH_TO_TEXT_PRE_RECORDED', {
                url: audioUrl,
                language: normalizedLang,
                detect_language: language === 'auto',
                punctuate: options.punctuate ?? true,
                diarize: options.diarize ?? false,
                smart_format: options.smartFormat ?? true,
                keywords: options.keywords,
            });
            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Transcription failed',
                    executionTimeMs: Date.now() - startTime,
                };
            }
            // Parse Deepgram response
            const data = result.data;
            const transcript = this.parseTranscriptResponse(data);
            return {
                success: true,
                text: transcript.text,
                language: transcript.language || normalizedLang || 'en',
                confidence: transcript.confidence,
                duration: transcript.duration,
                words: transcript.words,
                executionTimeMs: Date.now() - startTime,
            };
        }
        catch (error) {
            console.error('[DeepgramService] Transcription error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTimeMs: Date.now() - startTime,
            };
        }
    }
    /**
     * Parse Deepgram response into our format
     */
    parseTranscriptResponse(data) {
        // Handle various Deepgram response formats
        const results = data.results;
        const channels = results?.channels;
        const firstChannel = channels?.[0];
        const alternatives = firstChannel?.alternatives;
        const firstAlt = alternatives?.[0];
        const text = firstAlt?.transcript || data.transcript || '';
        const confidence = firstAlt?.confidence || data.confidence;
        const words = firstAlt?.words;
        const metadata = data.metadata;
        const duration = metadata?.duration;
        const language = data.detected_language || metadata?.language;
        return { text, language, confidence, duration, words };
    }
    /**
     * Summarize audio content
     *
     * @param audioUrl - Public URL to audio file
     */
    async summarize(audioUrl) {
        if (!this.initialized) {
            return {
                success: true,
                summary: 'Demo summary: This audio discusses important topics related to the conversation.',
                topics: ['conversation', 'demo'],
            };
        }
        try {
            const result = await composioService.executeTool('DEEPGRAM_SUMMARIZE_AUDIO', {
                url: audioUrl,
            });
            if (!result.success) {
                return { success: false, error: result.error };
            }
            const data = result.data;
            return {
                success: true,
                summary: data.summary,
                topics: data.topics,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Summarization failed',
            };
        }
    }
    /**
     * Detect topics in audio
     *
     * @param audioUrl - Public URL to audio file
     */
    async detectTopics(audioUrl) {
        if (!this.initialized) {
            return {
                success: true,
                topics: [
                    { topic: 'general', confidence: 0.9 },
                    { topic: 'demo', confidence: 0.85 },
                ],
            };
        }
        try {
            const result = await composioService.executeTool('DEEPGRAM_TOPIC_DETECTION', {
                url: audioUrl,
            });
            if (!result.success) {
                return { success: false, error: result.error };
            }
            const data = result.data;
            return {
                success: true,
                topics: data.topics,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Topic detection failed',
            };
        }
    }
    /**
     * Convert text to speech
     *
     * @param text - Text to convert
     * @param voice - Voice ID or name
     * @param language - Language code
     */
    async textToSpeech(text, voice = 'aura-asteria-en', language = 'en') {
        if (!this.initialized) {
            return {
                success: true,
                audioUrl: 'demo://audio.mp3',
                format: 'mp3',
            };
        }
        try {
            const result = await composioService.executeTool('DEEPGRAM_TEXT_TO_SPEECH_REST', {
                text,
                model_id: voice,
            });
            if (!result.success) {
                return { success: false, error: result.error };
            }
            const data = result.data;
            return {
                success: true,
                audioUrl: data.audio_url,
                audioBuffer: data.audio,
                format: 'mp3',
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'TTS failed',
            };
        }
    }
    /**
     * Get available speech-to-text models
     */
    async getModels() {
        if (!this.initialized) {
            return {
                success: true,
                models: [
                    { name: 'nova-2', description: 'Latest general model' },
                    { name: 'nova-2-general', description: 'General purpose' },
                    { name: 'nova-2-meeting', description: 'Meeting transcription' },
                    { name: 'nova-2-phonecall', description: 'Phone call audio' },
                ],
            };
        }
        try {
            const result = await composioService.executeTool('DEEPGRAM_GET_MODELS', {});
            if (!result.success) {
                return { success: false, error: result.error };
            }
            return { success: true, models: result.data };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to get models' };
        }
    }
    /**
     * Check if service is ready
     */
    isReady() {
        return this.initialized;
    }
    /**
     * Get supported audio formats
     */
    getSupportedFormats() {
        return ['ogg', 'mp3', 'wav', 'webm', 'flac', 'm4a'];
    }
    /**
     * Get supported language codes
     */
    getSupportedLanguages() {
        return ['ar', 'ar-AE', 'ar-SA', 'ar-KW', 'en', 'en-US', 'en-GB', 'auto'];
    }
}
// Export singleton instance
const DeepgramService = new DeepgramServiceClass();
export default DeepgramService;
//# sourceMappingURL=DeepgramService.js.map
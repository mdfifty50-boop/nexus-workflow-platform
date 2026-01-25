/**
 * Voice Input Hook - Enhanced UX
 *
 * Fixes for Omar's requirements:
 * 1. Proper mic lifecycle management (doesn't close properly)
 * 2. Kuwaiti Arabic dialect detection and support
 * 3. Language response matching (respond in same language as input)
 *
 * Features:
 * - Smart silence detection for auto-close
 * - Manual close button always available
 * - Visual indicator of listening state
 * - Dialect-aware language detection
 * - Automatic language response matching
 * - Enhanced Kuwaiti Arabic support (ar-KW)
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSpeechRecognition, type SpeechLanguage } from './useSpeechRecognition'
import { useTextToSpeech, type TTSLanguage } from './useTextToSpeech'

// Extended language support with Kuwaiti dialect
export type VoiceLanguage = 'en-US' | 'ar-SA' | 'ar-EG' | 'ar-KW'

export interface VoiceInputConfig {
  // Language settings
  defaultLanguage?: VoiceLanguage
  autoDetectLanguage?: boolean
  matchResponseLanguage?: boolean // Respond in same language as input

  // Mic behavior
  autoClose?: boolean // Auto-close after silence
  silenceTimeout?: number // ms of silence before auto-close (default: 3000)
  manualCloseEnabled?: boolean // Always show close button (default: true)

  // Visual feedback
  showWaveform?: boolean
  showTranscript?: boolean

  // Callbacks
  onTranscript?: (text: string, language: VoiceLanguage) => void
  onLanguageDetected?: (language: VoiceLanguage) => void
  onMicStateChange?: (isOpen: boolean) => void
}

export interface VoiceInputState {
  isOpen: boolean // Is mic panel open
  isListening: boolean // Is actively recording
  isProcessing: boolean // Is processing speech
  isSpeaking: boolean // Is TTS speaking response
  currentLanguage: VoiceLanguage
  detectedLanguage: VoiceLanguage | null
  transcript: string
  interimTranscript: string
  error: string | null
  audioLevel: number
  silenceTimer: number | null
}

export interface UseVoiceInputReturn extends VoiceInputState {
  // Mic control
  open: () => void
  close: () => void
  toggle: () => void
  startListening: () => Promise<void>
  stopListening: () => void

  // Language control
  setLanguage: (language: VoiceLanguage) => void
  detectLanguage: (text: string) => VoiceLanguage

  // Response
  speak: (text: string, language?: VoiceLanguage) => Promise<void>
  stopSpeaking: () => void

  // Utility
  clearTranscript: () => void
  clearError: () => void
  resetSilenceTimer: () => void
}

// Map our extended language types to the speech recognition types
function mapToSpeechLanguage(lang: VoiceLanguage): SpeechLanguage {
  // Map Kuwaiti Arabic to Saudi Arabic for speech recognition
  // (ar-KW uses Gulf Arabic which is closest to ar-SA in recognition)
  if (lang === 'ar-KW') return 'ar-SA'
  return lang as SpeechLanguage
}

// Map to TTS language
function mapToTTSLanguage(lang: VoiceLanguage): TTSLanguage {
  if (lang === 'ar-KW') return 'ar-SA' // Use Saudi voice but with Kuwaiti dialect detection
  return lang as TTSLanguage
}

// Detect language from text content
function detectLanguageFromText(text: string): VoiceLanguage {
  // Arabic detection
  const arabicPattern = /[\u0600-\u06FF]/
  if (arabicPattern.test(text)) {
    // Kuwaiti dialect detection patterns
    const kuwaitiPatterns = [
      /\bشلون\b/, // "How" in Kuwaiti
      /\bشنو\b/, // "What" in Kuwaiti
      /\bوين\b/, // "Where" in Kuwaiti
      /\bشكو\b/, // "What's there" in Kuwaiti
      /\bمابي\b/, // "I don't want" in Kuwaiti
      /\bعادي\b/, // "Normal/OK" common in Kuwaiti
      /\bوايد\b/, // "Very/A lot" in Kuwaiti
      /\bيايب\b/, // "Brought" in Kuwaiti
      /\bهني\b/, // "Here" in Kuwaiti
      /\bإنت\b/, // "You" in Kuwaiti spelling
      /\bشكثر\b/, // "How much" in Kuwaiti
      /\bيبا\b/, // "I want" in Kuwaiti
      /\bاشلون\b/, // "How" variation
      /\bعباله\b/, // "In his mind" in Kuwaiti
    ]

    // Check for Kuwaiti dialect markers
    for (const pattern of kuwaitiPatterns) {
      if (pattern.test(text)) {
        return 'ar-KW'
      }
    }

    // Egyptian dialect detection
    const egyptianPatterns = [
      /\bازيك\b/,
      /\bعامل\b/,
      /\bايه\b/,
      /\bمش\b/,
      /\bكده\b/,
    ]

    for (const pattern of egyptianPatterns) {
      if (pattern.test(text)) {
        return 'ar-EG'
      }
    }

    // Default to Saudi Arabic for other Arabic
    return 'ar-SA'
  }

  // Default to English
  return 'en-US'
}

/**
 * Enhanced Voice Input Hook with proper mic lifecycle
 */
export function useVoiceInput(config: VoiceInputConfig = {}): UseVoiceInputReturn {
  const {
    defaultLanguage = 'en-US',
    autoDetectLanguage = true,
    matchResponseLanguage = true,
    autoClose = true,
    silenceTimeout = 3000,
    onTranscript,
    onLanguageDetected,
    onMicStateChange,
  } = config

  // State
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentLanguage, setCurrentLanguageState] = useState<VoiceLanguage>(defaultLanguage)
  const [detectedLanguage, setDetectedLanguage] = useState<VoiceLanguage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [silenceTimer, setSilenceTimer] = useState<number | null>(null)

  // Refs
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptRef = useRef<string>('')

  // Speech recognition
  const {
    isListening,
    transcript,
    interimTranscript,
    audioLevel,
    error: speechError,
    startListening: startSpeechRecognition,
    stopListening: stopSpeechRecognition,
    setLanguage: setSpeechLanguage,
    resetTranscript,
  } = useSpeechRecognition({
    language: mapToSpeechLanguage(currentLanguage),
    continuous: true,
    interimResults: true,
  })

  // Text-to-speech
  const {
    isSpeaking,
    speak: ttsSpeak,
    cancel: ttsCancel,
    setLanguage: setTTSLanguage,
  } = useTextToSpeech({
    language: mapToTTSLanguage(currentLanguage),
  })

  // Clear silence timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
      setSilenceTimer(null)
    }
  }, [])

  // Reset silence timer
  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer()

    if (autoClose && isListening) {
      silenceTimerRef.current = setTimeout(() => {
        console.log('[VoiceInput] Silence timeout - auto-closing')
        stopListening()
      }, silenceTimeout)
      setSilenceTimer(Date.now() + silenceTimeout)
    }
  }, [autoClose, isListening, silenceTimeout, clearSilenceTimer])

  // Detect language from transcript
  const detectLanguage = useCallback((text: string): VoiceLanguage => {
    const detected = detectLanguageFromText(text)
    return detected
  }, [])

  // Handle transcript changes
  useEffect(() => {
    if (!transcript || transcript === lastTranscriptRef.current) return
    lastTranscriptRef.current = transcript

    // Detect language if enabled
    if (autoDetectLanguage) {
      const detected = detectLanguage(transcript)
      if (detected !== detectedLanguage) {
        setDetectedLanguage(detected)
        onLanguageDetected?.(detected)

        // Auto-switch language for better recognition
        if (matchResponseLanguage && detected !== currentLanguage) {
          setCurrentLanguageState(detected)
          setSpeechLanguage(mapToSpeechLanguage(detected))
          setTTSLanguage(mapToTTSLanguage(detected))
        }
      }
    }

    // Reset silence timer on new speech
    resetSilenceTimer()

    // Trigger callback
    onTranscript?.(transcript, detectedLanguage || currentLanguage)
  }, [
    transcript,
    autoDetectLanguage,
    matchResponseLanguage,
    currentLanguage,
    detectedLanguage,
    detectLanguage,
    resetSilenceTimer,
    setSpeechLanguage,
    setTTSLanguage,
    onTranscript,
    onLanguageDetected,
  ])

  // Handle speech errors
  useEffect(() => {
    if (speechError) {
      setError(speechError.message)
    }
  }, [speechError])

  // Open mic panel
  const open = useCallback(() => {
    setIsOpen(true)
    setError(null)
    onMicStateChange?.(true)
  }, [onMicStateChange])

  // Close mic panel
  const close = useCallback(() => {
    stopSpeechRecognition()
    clearSilenceTimer()
    setIsOpen(false)
    onMicStateChange?.(false)
  }, [stopSpeechRecognition, clearSilenceTimer, onMicStateChange])

  // Toggle mic panel
  const toggle = useCallback(() => {
    if (isOpen) {
      close()
    } else {
      open()
    }
  }, [isOpen, open, close])

  // Start listening
  const startListening = useCallback(async () => {
    setError(null)
    await startSpeechRecognition()
    resetSilenceTimer()
  }, [startSpeechRecognition, resetSilenceTimer])

  // Stop listening
  const stopListening = useCallback(() => {
    stopSpeechRecognition()
    clearSilenceTimer()
    setIsProcessing(false)
  }, [stopSpeechRecognition, clearSilenceTimer])

  // Set language
  const setLanguage = useCallback((language: VoiceLanguage) => {
    setCurrentLanguageState(language)
    setSpeechLanguage(mapToSpeechLanguage(language))
    setTTSLanguage(mapToTTSLanguage(language))
  }, [setSpeechLanguage, setTTSLanguage])

  // Speak response
  const speak = useCallback(async (text: string, language?: VoiceLanguage) => {
    const speakLang = language || (matchResponseLanguage && detectedLanguage) || currentLanguage

    // Set TTS language if different
    if (speakLang !== currentLanguage) {
      setTTSLanguage(mapToTTSLanguage(speakLang))
    }

    await ttsSpeak(text)
  }, [currentLanguage, detectedLanguage, matchResponseLanguage, ttsSpeak, setTTSLanguage])

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    ttsCancel()
  }, [ttsCancel])

  // Clear transcript
  const clearTranscript = useCallback(() => {
    resetTranscript()
    lastTranscriptRef.current = ''
  }, [resetTranscript])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer()
      stopSpeechRecognition()
      ttsCancel()
    }
  }, [clearSilenceTimer, stopSpeechRecognition, ttsCancel])

  return {
    // State
    isOpen,
    isListening,
    isProcessing,
    isSpeaking,
    currentLanguage,
    detectedLanguage,
    transcript,
    interimTranscript,
    error,
    audioLevel,
    silenceTimer,

    // Mic control
    open,
    close,
    toggle,
    startListening,
    stopListening,

    // Language control
    setLanguage,
    detectLanguage,

    // Response
    speak,
    stopSpeaking,

    // Utility
    clearTranscript,
    clearError,
    resetSilenceTimer,
  }
}

// Export language options for UI
export const VOICE_LANGUAGES: Array<{
  code: VoiceLanguage
  name: string
  nativeName: string
  flag: string
}> = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ar-KW', name: 'Arabic (Kuwait)', nativeName: 'عربي كويتي', flag: '🇰🇼' },
  { code: 'ar-SA', name: 'Arabic (Saudi)', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ar-EG', name: 'Arabic (Egypt)', nativeName: 'العربية المصرية', flag: '🇪🇬' },
]

export default useVoiceInput

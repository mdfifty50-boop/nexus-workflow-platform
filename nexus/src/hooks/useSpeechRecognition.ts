/**
 * Speech Recognition Hook
 *
 * Enhanced speech-to-text functionality with:
 * - Better error handling and recovery
 * - Language switching (English/Arabic)
 * - Interim results display for real-time feedback
 * - Audio level monitoring for visual feedback
 * - Continuous listening mode
 *
 * Uses the Web Speech API SpeechRecognition interface
 */

import { useState, useCallback, useRef, useEffect } from 'react'

// Supported languages - including ar-KW for Kuwaiti dialect
export type SpeechLanguage = 'en-US' | 'ar-SA' | 'ar-EG' | 'ar-KW'

export interface SpeechRecognitionConfig {
  language?: SpeechLanguage
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
  onAudioLevel?: (level: number) => void
}

export interface SpeechRecognitionResult {
  transcript: string
  isFinal: boolean
  confidence: number
  alternatives?: Array<{ transcript: string; confidence: number }>
}

export interface SpeechRecognitionState {
  isListening: boolean
  isSupported: boolean
  transcript: string
  interimTranscript: string
  finalTranscript: string
  error: SpeechRecognitionError | null
  language: SpeechLanguage
  audioLevel: number
  results: SpeechRecognitionResult[]
}

export type SpeechRecognitionErrorType =
  | 'not-allowed'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'aborted'
  | 'language-not-supported'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'unknown'

export interface SpeechRecognitionError {
  type: SpeechRecognitionErrorType
  message: string
  recoverable: boolean
}

export interface UseSpeechRecognitionReturn extends SpeechRecognitionState {
  startListening: () => Promise<void>
  stopListening: () => void
  toggleListening: () => Promise<void>
  resetTranscript: () => void
  setLanguage: (language: SpeechLanguage) => void
  clearError: () => void
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: {
    isFinal: boolean
    length: number
    [index: number]: {
      transcript: string
      confidence: number
    }
  }
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null
  onspeechend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onaudiostart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onaudioend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onsoundstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onsoundend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

// Error mapping helper
function mapSpeechError(errorCode: string): SpeechRecognitionError {
  const errorMap: Record<string, SpeechRecognitionError> = {
    'not-allowed': {
      type: 'not-allowed',
      message: 'Microphone access denied. Please allow microphone permissions.',
      recoverable: true
    },
    'no-speech': {
      type: 'no-speech',
      message: 'No speech detected. Please try speaking again.',
      recoverable: true
    },
    'audio-capture': {
      type: 'audio-capture',
      message: 'No microphone found. Please check your audio input device.',
      recoverable: true
    },
    'network': {
      type: 'network',
      message: 'Network error occurred. Please check your internet connection.',
      recoverable: true
    },
    'aborted': {
      type: 'aborted',
      message: 'Speech recognition was aborted.',
      recoverable: true
    },
    'language-not-supported': {
      type: 'language-not-supported',
      message: 'The selected language is not supported.',
      recoverable: true
    },
    'service-not-allowed': {
      type: 'service-not-allowed',
      message: 'Speech recognition service is not allowed.',
      recoverable: false
    },
    'bad-grammar': {
      type: 'bad-grammar',
      message: 'Grammar error in speech recognition.',
      recoverable: true
    }
  }

  return errorMap[errorCode] || {
    type: 'unknown',
    message: `Unknown error: ${errorCode}`,
    recoverable: true
  }
}

// Check browser support
function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

/**
 * Hook for speech recognition with enhanced features
 */
export function useSpeechRecognition(
  config: SpeechRecognitionConfig = {}
): UseSpeechRecognitionReturn {
  const {
    language: initialLanguage = 'en-US',
    continuous = true,
    interimResults = true,
    maxAlternatives = 3,
    onAudioLevel
  } = config

  // State
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [error, setError] = useState<SpeechRecognitionError | null>(null)
  const [language, setLanguageState] = useState<SpeechLanguage>(initialLanguage)
  const [audioLevel, setAudioLevel] = useState(0)
  const [results, setResults] = useState<SpeechRecognitionResult[]>([])

  // Refs
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isRestartingRef = useRef(false)

  // Check support
  const SpeechRecognitionClass = getSpeechRecognition()
  const isSupported = SpeechRecognitionClass !== null

  // Cleanup audio analyzer
  const cleanupAudioAnalyzer = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyzerRef.current = null
    setAudioLevel(0)
  }, [])

  // Setup audio analyzer for visual feedback
  const setupAudioAnalyzer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      audioContextRef.current = new AudioContext()
      analyzerRef.current = audioContextRef.current.createAnalyser()
      analyzerRef.current.fftSize = 256

      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyzerRef.current)

      const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount)

      const updateLevel = () => {
        if (!analyzerRef.current || !isListening) {
          setAudioLevel(0)
          return
        }

        analyzerRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        const normalizedLevel = Math.min(average / 128, 1)

        setAudioLevel(normalizedLevel)
        onAudioLevel?.(normalizedLevel)

        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }

      updateLevel()
    } catch (err) {
      console.warn('[SpeechRecognition] Could not setup audio analyzer:', err)
    }
  }, [isListening, onAudioLevel])

  // Initialize recognition
  const initRecognition = useCallback(() => {
    if (!SpeechRecognitionClass) return null

    const recognition = new SpeechRecognitionClass()
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    // Map ar-KW to ar-SA for Web Speech API compatibility
    recognition.lang = language === 'ar-KW' ? 'ar-SA' : language
    recognition.maxAlternatives = maxAlternatives

    recognition.onstart = () => {
      console.log('[SpeechRecognition] ✓ Started listening successfully')
      setIsListening(true)
      setError(null)
    }

    recognition.onend = () => {
      console.log('[SpeechRecognition] Ended')
      setIsListening(false)

      // Auto-restart if continuous mode and not manually stopped
      if (continuous && isRestartingRef.current) {
        console.log('[SpeechRecognition] Auto-restarting...')
        isRestartingRef.current = false
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start()
            } catch (err) {
              console.log('[SpeechRecognition] Restart failed (expected if manually stopped):', err)
            }
          }
        }, 100)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[SpeechRecognition] Error event:', event.error, event.message)
      const speechError = mapSpeechError(event.error)

      // Provide more detailed error logging
      if (event.error === 'not-allowed') {
        console.error('[SpeechRecognition] Microphone permission denied by user')
      } else if (event.error === 'no-speech') {
        console.log('[SpeechRecognition] No speech detected (will auto-restart if continuous)')
      } else if (event.error === 'audio-capture') {
        console.error('[SpeechRecognition] No microphone found or audio capture failed')
      } else if (event.error === 'network') {
        console.error('[SpeechRecognition] Network error - speech recognition requires internet')
      }

      setError(speechError)

      // Don't stop listening on recoverable errors in continuous mode
      if (!speechError.recoverable || !continuous) {
        setIsListening(false)
      } else if (event.error === 'no-speech') {
        // Auto-restart on no-speech in continuous mode
        isRestartingRef.current = true
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('[SpeechRecognition] Result received, resultIndex:', event.resultIndex, 'total results:', event.results.length)

      let interim = ''
      let final = ''
      const newResults: SpeechRecognitionResult[] = []

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcriptText = result[0].transcript
        const confidence = result[0].confidence

        console.log(`[SpeechRecognition] Result ${i}:`, {
          transcript: transcriptText,
          isFinal: result.isFinal,
          confidence: confidence
        })

        // Collect alternatives
        const alternatives: Array<{ transcript: string; confidence: number }> = []
        for (let j = 0; j < result.length; j++) {
          alternatives.push({
            transcript: result[j].transcript,
            confidence: result[j].confidence
          })
        }

        newResults.push({
          transcript: transcriptText,
          isFinal: result.isFinal,
          confidence,
          alternatives
        })

        if (result.isFinal) {
          final += transcriptText + ' '
          console.log('[SpeechRecognition] Final transcript:', transcriptText)
        } else {
          interim += transcriptText
          console.log('[SpeechRecognition] Interim transcript:', transcriptText)
        }
      }

      setResults(prev => [...prev, ...newResults])
      setInterimTranscript(interim)

      if (final) {
        setFinalTranscript(prev => prev + final)
        setTranscript(prev => prev + final)
        console.log('[SpeechRecognition] ✓ Updated final transcript:', final)
      }
    }

    recognition.onspeechend = () => {
      console.log('[SpeechRecognition] Speech ended')
    }

    return recognition
  }, [SpeechRecognitionClass, continuous, interimResults, language, maxAlternatives])

  // Start listening
  const startListening = useCallback(async () => {
    console.log('[SpeechRecognition] Starting... Language:', language)

    if (!isSupported) {
      console.error('[SpeechRecognition] Not supported in this browser')
      setError({
        type: 'service-not-allowed',
        message: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',
        recoverable: false
      })
      return
    }

    // Check microphone permission first
    try {
      console.log('[SpeechRecognition] Checking microphone permissions...')
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      console.log('[SpeechRecognition] Permission status:', permissionStatus.state)

      if (permissionStatus.state === 'denied') {
        setError({
          type: 'not-allowed',
          message: 'Microphone access is denied. Please enable it in your browser settings and reload the page.',
          recoverable: true
        })
        return
      }
    } catch (err) {
      console.log('[SpeechRecognition] Permission API not supported, will request on start')
      // Permission API not supported, continue anyway - mic permission will be requested on start
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      console.log('[SpeechRecognition] Aborting existing recognition')
      recognitionRef.current.abort()
    }

    // Initialize new recognition instance
    console.log('[SpeechRecognition] Initializing recognition with language:', language === 'ar-KW' ? 'ar-SA' : language)
    recognitionRef.current = initRecognition()

    if (!recognitionRef.current) {
      console.error('[SpeechRecognition] Failed to initialize')
      setError({
        type: 'unknown',
        message: 'Failed to initialize speech recognition.',
        recoverable: false
      })
      return
    }

    try {
      console.log('[SpeechRecognition] Setting up audio analyzer...')
      await setupAudioAnalyzer()
      console.log('[SpeechRecognition] Starting recognition...')
      recognitionRef.current.start()
      console.log('[SpeechRecognition] Recognition started successfully')
    } catch (err) {
      console.error('[SpeechRecognition] Start error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to start speech recognition.'

      // Provide more specific error messages
      if (errorMessage.includes('not-allowed') || errorMessage.includes('permission')) {
        setError({
          type: 'not-allowed',
          message: 'Microphone permission denied. Click the microphone icon in your browser address bar to allow access.',
          recoverable: true
        })
      } else if (errorMessage.includes('audio-capture')) {
        setError({
          type: 'audio-capture',
          message: 'No microphone detected. Please connect a microphone and try again.',
          recoverable: true
        })
      } else {
        setError({
          type: 'unknown',
          message: errorMessage,
          recoverable: true
        })
      }
    }
  }, [isSupported, initRecognition, setupAudioAnalyzer, language])

  // Stop listening
  const stopListening = useCallback(() => {
    isRestartingRef.current = false

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    cleanupAudioAnalyzer()
    setIsListening(false)
  }, [cleanupAudioAnalyzer])

  // Toggle listening
  const toggleListening = useCallback(async () => {
    if (isListening) {
      stopListening()
    } else {
      await startListening()
    }
  }, [isListening, startListening, stopListening])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setFinalTranscript('')
    setResults([])
  }, [])

  // Set language
  const setLanguage = useCallback((newLanguage: SpeechLanguage) => {
    setLanguageState(newLanguage)

    // Restart recognition with new language if currently listening
    if (isListening && recognitionRef.current) {
      isRestartingRef.current = true
      recognitionRef.current.stop()

      // Will restart with new language via initRecognition
    }
  }, [isListening])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      cleanupAudioAnalyzer()
    }
  }, [cleanupAudioAnalyzer])

  // Update recognition language when state changes
  useEffect(() => {
    if (recognitionRef.current && !isListening) {
      // Map ar-KW to ar-SA for Web Speech API compatibility
      recognitionRef.current.lang = language === 'ar-KW' ? 'ar-SA' : language
    }
  }, [language, isListening])

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    finalTranscript,
    error,
    language,
    audioLevel,
    results,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    setLanguage,
    clearError
  }
}

// Export language options for UI
export const SPEECH_LANGUAGES: Array<{ code: SpeechLanguage; name: string; nativeName: string }> = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English' },
  { code: 'ar-KW', name: 'Arabic (Kuwait)', nativeName: 'عربي كويتي' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', nativeName: 'العربية' },
  { code: 'ar-EG', name: 'Arabic (Egypt)', nativeName: 'العربية المصرية' }
]

export default useSpeechRecognition

/**
 * Text-to-Speech Hook
 *
 * Provides text-to-speech functionality using Web Speech API:
 * - Announce workflow completion and errors
 * - Support for multiple languages (English/Arabic)
 * - Voice selection
 * - Rate and pitch control
 * - Queue management for sequential speech
 *
 * Integrates with the human-tts-service for high-quality TTS when available
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export type TTSLanguage = 'en-US' | 'ar-SA' | 'ar-EG'

export interface TTSConfig {
  language?: TTSLanguage
  rate?: number
  pitch?: number
  volume?: number
  voice?: string
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

export interface TTSState {
  isSpeaking: boolean
  isPaused: boolean
  isSupported: boolean
  isMuted: boolean
  currentLanguage: TTSLanguage
  availableVoices: SpeechSynthesisVoice[]
  selectedVoice: SpeechSynthesisVoice | null
  queueLength: number
  rate: number
  pitch: number
  volume: number
}

export interface UseTextToSpeechReturn extends TTSState {
  speak: (text: string, config?: Partial<TTSConfig>) => Promise<void>
  speakAsync: (text: string, config?: Partial<TTSConfig>) => Promise<void>
  cancel: () => void
  pause: () => void
  resume: () => void
  mute: () => void
  unmute: () => void
  toggleMute: () => void
  setLanguage: (language: TTSLanguage) => void
  setVoice: (voiceUri: string) => void
  setRate: (rate: number) => void
  setPitch: (pitch: number) => void
  setVolume: (volume: number) => void
  announceSuccess: (message?: string) => Promise<void>
  announceError: (message?: string) => Promise<void>
  announceStatus: (status: string) => Promise<void>
}

// Default configurations per language
const LANGUAGE_DEFAULTS: Record<TTSLanguage, { rate: number; pitch: number }> = {
  'en-US': { rate: 1.0, pitch: 1.0 },
  'ar-SA': { rate: 0.9, pitch: 1.0 },
  'ar-EG': { rate: 0.9, pitch: 1.0 }
}

// Status messages in multiple languages
const STATUS_MESSAGES: Record<TTSLanguage, {
  success: string
  error: string
  started: string
  completed: string
  cancelled: string
  running: string
}> = {
  'en-US': {
    success: 'Operation completed successfully.',
    error: 'An error occurred.',
    started: 'Workflow started.',
    completed: 'Workflow completed.',
    cancelled: 'Workflow cancelled.',
    running: 'Workflow is running.'
  },
  'ar-SA': {
    success: 'تمت العملية بنجاح.',
    error: 'حدث خطأ.',
    started: 'بدأ سير العمل.',
    completed: 'اكتمل سير العمل.',
    cancelled: 'تم إلغاء سير العمل.',
    running: 'سير العمل قيد التنفيذ.'
  },
  'ar-EG': {
    success: 'العملية تمت بنجاح.',
    error: 'حصل خطأ.',
    started: 'الشغل بدأ.',
    completed: 'الشغل خلص.',
    cancelled: 'الشغل اتلغى.',
    running: 'الشغل شغال.'
  }
}

/**
 * Hook for text-to-speech functionality
 */
export function useTextToSpeech(initialConfig: TTSConfig = {}): UseTextToSpeechReturn {
  const {
    language: initialLanguage = 'en-US',
    rate: initialRate = 1.0,
    pitch: initialPitch = 1.0,
    volume: initialVolume = 1.0,
    voice: initialVoice,
    onStart,
    onEnd,
    onError
  } = initialConfig

  // State
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<TTSLanguage>(initialLanguage)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [queueLength, setQueueLength] = useState(0)
  const [rate, setRateState] = useState(initialRate)
  const [pitch, setPitchState] = useState(initialPitch)
  const [volume, setVolumeState] = useState(initialVolume)

  // Refs
  const speechQueueRef = useRef<Array<{ text: string; config: TTSConfig }>>([])
  const isProcessingRef = useRef(false)
  const callbacksRef = useRef({ onStart, onEnd, onError })

  // Check support
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = { onStart, onEnd, onError }
  }, [onStart, onEnd, onError])

  // Load voices
  useEffect(() => {
    if (!isSupported) return

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices()
      setAvailableVoices(voices)

      // Auto-select voice based on language
      if (initialVoice) {
        const voice = voices.find(v => v.voiceURI === initialVoice)
        if (voice) setSelectedVoice(voice)
      } else {
        const languageVoices = voices.filter(v => v.lang.startsWith(currentLanguage.split('-')[0]))
        if (languageVoices.length > 0) {
          setSelectedVoice(languageVoices[0])
        }
      }
    }

    loadVoices()

    // Chrome loads voices async
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = null
      }
    }
  }, [isSupported, initialVoice, currentLanguage])

  // Find best voice for language
  const findVoiceForLanguage = useCallback((lang: TTSLanguage): SpeechSynthesisVoice | null => {
    const langCode = lang.split('-')[0]

    // Try exact match first
    let voice = availableVoices.find(v => v.lang === lang)
    if (voice) return voice

    // Try language code match
    voice = availableVoices.find(v => v.lang.startsWith(langCode))
    if (voice) return voice

    // Fallback to first available
    return availableVoices[0] || null
  }, [availableVoices])

  // Process speech queue
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || speechQueueRef.current.length === 0 || isMuted) {
      return
    }

    isProcessingRef.current = true
    setQueueLength(speechQueueRef.current.length)

    while (speechQueueRef.current.length > 0 && !isMuted) {
      const item = speechQueueRef.current.shift()!
      setQueueLength(speechQueueRef.current.length)

      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(item.text)

        // Apply configuration
        const config = item.config
        const langDefaults = LANGUAGE_DEFAULTS[currentLanguage]

        utterance.rate = config.rate ?? rate ?? langDefaults.rate
        utterance.pitch = config.pitch ?? pitch ?? langDefaults.pitch
        utterance.volume = config.volume ?? volume

        // Set voice
        if (config.voice) {
          const voice = availableVoices.find(v => v.voiceURI === config.voice)
          if (voice) utterance.voice = voice
        } else if (selectedVoice) {
          utterance.voice = selectedVoice
        } else {
          const voice = findVoiceForLanguage(currentLanguage)
          if (voice) utterance.voice = voice
        }

        utterance.onstart = () => {
          setIsSpeaking(true)
          config.onStart?.()
          callbacksRef.current.onStart?.()
        }

        utterance.onend = () => {
          setIsSpeaking(false)
          config.onEnd?.()
          callbacksRef.current.onEnd?.()
          resolve()
        }

        utterance.onerror = (event) => {
          setIsSpeaking(false)
          const error = new Error(`Speech synthesis error: ${event.error}`)
          config.onError?.(error)
          callbacksRef.current.onError?.(error)
          resolve()
        }

        speechSynthesis.speak(utterance)
      })

      // Small pause between utterances
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    isProcessingRef.current = false
    setQueueLength(0)
  }, [availableVoices, currentLanguage, findVoiceForLanguage, isMuted, pitch, rate, selectedVoice, volume])

  // Speak text (adds to queue)
  const speak = useCallback(async (text: string, config: Partial<TTSConfig> = {}) => {
    if (!isSupported || isMuted) return

    speechQueueRef.current.push({ text, config })
    setQueueLength(speechQueueRef.current.length)

    if (!isProcessingRef.current) {
      processQueue()
    }
  }, [isSupported, isMuted, processQueue])

  // Speak text and wait for completion
  const speakAsync = useCallback((text: string, config: Partial<TTSConfig> = {}): Promise<void> => {
    return new Promise((resolve, reject) => {
      const wrappedConfig: Partial<TTSConfig> = {
        ...config,
        onEnd: () => {
          config.onEnd?.()
          resolve()
        },
        onError: (error) => {
          config.onError?.(error)
          reject(error)
        }
      }
      speak(text, wrappedConfig)
    })
  }, [speak])

  // Cancel all speech
  const cancel = useCallback(() => {
    if (!isSupported) return
    speechSynthesis.cancel()
    speechQueueRef.current = []
    setQueueLength(0)
    setIsSpeaking(false)
    setIsPaused(false)
    isProcessingRef.current = false
  }, [isSupported])

  // Pause speech
  const pause = useCallback(() => {
    if (!isSupported) return
    speechSynthesis.pause()
    setIsPaused(true)
  }, [isSupported])

  // Resume speech
  const resume = useCallback(() => {
    if (!isSupported) return
    speechSynthesis.resume()
    setIsPaused(false)
  }, [isSupported])

  // Mute
  const mute = useCallback(() => {
    setIsMuted(true)
    cancel()
  }, [cancel])

  // Unmute
  const unmute = useCallback(() => {
    setIsMuted(false)
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (isMuted) {
      unmute()
    } else {
      mute()
    }
  }, [isMuted, mute, unmute])

  // Set language
  const setLanguage = useCallback((language: TTSLanguage) => {
    setCurrentLanguage(language)
    const voice = findVoiceForLanguage(language)
    if (voice) setSelectedVoice(voice)

    // Apply language defaults
    const defaults = LANGUAGE_DEFAULTS[language]
    setRateState(defaults.rate)
    setPitchState(defaults.pitch)
  }, [findVoiceForLanguage])

  // Set voice
  const setVoice = useCallback((voiceUri: string) => {
    const voice = availableVoices.find(v => v.voiceURI === voiceUri)
    if (voice) setSelectedVoice(voice)
  }, [availableVoices])

  // Set rate
  const setRate = useCallback((newRate: number) => {
    setRateState(Math.max(0.1, Math.min(10, newRate)))
  }, [])

  // Set pitch
  const setPitch = useCallback((newPitch: number) => {
    setPitchState(Math.max(0, Math.min(2, newPitch)))
  }, [])

  // Set volume
  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)))
  }, [])

  // Announce success
  const announceSuccess = useCallback(async (message?: string) => {
    const text = message || STATUS_MESSAGES[currentLanguage].success
    await speak(text)
  }, [currentLanguage, speak])

  // Announce error
  const announceError = useCallback(async (message?: string) => {
    const text = message || STATUS_MESSAGES[currentLanguage].error
    await speak(text)
  }, [currentLanguage, speak])

  // Announce status
  const announceStatus = useCallback(async (status: string) => {
    const messages = STATUS_MESSAGES[currentLanguage]
    const statusKey = status.toLowerCase() as keyof typeof messages
    const text = messages[statusKey] || status
    await speak(text)
  }, [currentLanguage, speak])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        speechSynthesis.cancel()
      }
    }
  }, [isSupported])

  return {
    isSpeaking,
    isPaused,
    isSupported,
    isMuted,
    currentLanguage,
    availableVoices,
    selectedVoice,
    queueLength,
    rate,
    pitch,
    volume,
    speak,
    speakAsync,
    cancel,
    pause,
    resume,
    mute,
    unmute,
    toggleMute,
    setLanguage,
    setVoice,
    setRate,
    setPitch,
    setVolume,
    announceSuccess,
    announceError,
    announceStatus
  }
}

// Export language options for UI
export const TTS_LANGUAGES: Array<{ code: TTSLanguage; name: string; nativeName: string }> = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', nativeName: 'العربية' },
  { code: 'ar-EG', name: 'Arabic (Egypt)', nativeName: 'العربية المصرية' }
]

export default useTextToSpeech

import { useState, useEffect, useRef } from 'react'
import { useVoiceInput, type VoiceLanguage, VOICE_LANGUAGES } from '@/hooks/useVoiceInput'

interface VoiceInputProps {
  onTranscript: (text: string, language: VoiceLanguage) => void
  onListening?: (isListening: boolean) => void
  language?: 'en' | 'ar' | 'auto'
  placeholder?: string
  className?: string
}

// Voice visualization component
function VoiceWaveform({ isActive, intensity = 0.5 }: { isActive: boolean; intensity?: number }) {
  const bars = 5
  return (
    <div className="flex items-center gap-1 h-6">
      {[...Array(bars)].map((_, i) => {
        const delay = i * 0.1
        const baseHeight = isActive ? 4 + intensity * 20 : 4
        const maxHeight = isActive ? 8 + intensity * 16 : 4

        return (
          <div
            key={i}
            className={`
              w-1 rounded-full transition-all
              ${isActive ? 'bg-cyan-500' : 'bg-slate-600'}
            `}
            style={{
              height: `${baseHeight}px`,
              animation: isActive ? `voice-bar 0.5s ease-in-out ${delay}s infinite alternate` : 'none',
              '--max-height': `${maxHeight}px`,
            } as React.CSSProperties}
          />
        )
      })}
      <style>{`
        @keyframes voice-bar {
          from { height: 4px; }
          to { height: var(--max-height, 20px); }
        }
      `}</style>
    </div>
  )
}

export function VoiceInput({
  onTranscript,
  onListening,
  language = 'auto',
  placeholder = 'Click to speak...',
  className = '',
}: VoiceInputProps) {
  // Map language prop to VoiceLanguage
  const getInitialLanguage = (): VoiceLanguage => {
    if (language === 'ar') return 'ar-KW' // Default to Kuwaiti Arabic
    if (language === 'en') return 'en-US'
    return 'en-US' // Auto mode defaults to English
  }

  const {
    isListening,
    transcript,
    error,
    audioLevel,
    currentLanguage,
    detectedLanguage,
    startListening,
    stopListening,
    clearError,
  } = useVoiceInput({
    defaultLanguage: getInitialLanguage(),
    autoDetectLanguage: language === 'auto',
    matchResponseLanguage: true,
    autoClose: true,
    silenceTimeout: 3000,
    manualCloseEnabled: true,
    onTranscript: (text, lang) => {
      onTranscript(text, lang)
    },
  })

  // Notify parent of listening state changes
  useEffect(() => {
    onListening?.(isListening)
  }, [isListening, onListening])

  const toggleListening = async () => {
    if (isListening) {
      stopListening()
    } else {
      await startListening()
    }
  }

  // Get language display info
  const displayLanguage = detectedLanguage || currentLanguage
  const languageInfo = VOICE_LANGUAGES.find(l => l.code === displayLanguage)

  return (
    <div className={`relative ${className}`}>
      <div className={`
        flex items-center gap-3 p-4 rounded-2xl border-2 transition-all
        ${isListening
          ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
          : 'border-border bg-card hover:border-primary/50'
        }
      `}>
        {/* Microphone Button */}
        <button
          onClick={toggleListening}
          className={`
            w-14 h-14 rounded-xl flex items-center justify-center transition-all
            ${isListening
              ? 'bg-cyan-500 text-white animate-pulse'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
            }
          `}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {isListening ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <VoiceWaveform isActive={isListening} intensity={audioLevel} />
                <span className="text-sm text-cyan-400 font-medium">
                  {displayLanguage === 'ar-KW' ? 'أستمع...' : 'Listening...'}
                </span>
              </div>
              {transcript && (
                <p className="text-sm text-muted-foreground truncate">{transcript}</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">{placeholder}</p>
          )}
        </div>

        {/* Language Indicator with Flag */}
        <div className="flex items-center gap-2">
          {detectedLanguage && detectedLanguage !== currentLanguage && (
            <span className="text-xs text-amber-400 animate-pulse" title="Language detected">
              🔍
            </span>
          )}
          <span className={`
            px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1
            ${displayLanguage?.startsWith('ar')
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-700 text-slate-400'
            }
          `}>
            {languageInfo?.flag} {languageInfo?.nativeName || 'Auto'}
          </span>
        </div>

        {/* Manual Close Button - Always visible when listening */}
        {isListening && (
          <button
            onClick={stopListening}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            aria-label="Stop and close"
            title="Stop listening"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start justify-between">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-red-400/70 hover:text-red-400"
            aria-label="Clear error"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Quick Tips */}
      {!isListening && !error && (
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="text-cyan-400">💡</span>
            <span>
              {displayLanguage === 'ar-KW'
                ? 'جرّب: "أنشئ سير عمل لإدارة المهام"'
                : 'Try: "Create a workflow to automate my CRM"'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Voice Response Component (TTS) with Language Matching
interface VoiceResponseProps {
  text: string
  autoPlay?: boolean
  voice?: 'nexus' | 'larry' | 'sarah'
  language?: VoiceLanguage // Support language matching
  onComplete?: () => void
}

export function VoiceResponse({
  text,
  autoPlay = false,
  voice = 'nexus',
  language,
  onComplete
}: VoiceResponseProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [, setError] = useState<string | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (autoPlay && text) {
      speak()
    }
  }, [text, autoPlay])

  const speak = () => {
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech not supported')
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    // Set language if provided
    if (language) {
      utterance.lang = language
    }

    // Configure voice based on agent and language
    const voices = window.speechSynthesis.getVoices()

    // Filter by language first if specified
    let availableVoices = voices
    if (language) {
      const langCode = language.split('-')[0]
      availableVoices = voices.filter(v => v.lang.startsWith(langCode))
    }

    // Then filter by voice preference
    const preferredVoice = availableVoices.find(v =>
      voice === 'sarah' ? v.name.includes('female') || v.name.includes('Samantha') :
      v.name.includes('male') || v.name.includes('Daniel')
    )

    if (preferredVoice) {
      utterance.voice = preferredVoice
    } else if (availableVoices.length > 0) {
      utterance.voice = availableVoices[0]
    }

    utterance.rate = 1.0
    utterance.pitch = voice === 'sarah' ? 1.1 : 1.0

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => {
      setIsPlaying(false)
      onComplete?.()
    }
    utterance.onerror = () => {
      setError('Speech failed')
      setIsPlaying(false)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isPlaying ? stop : speak}
        className={`
          p-2 rounded-lg transition-all
          ${isPlaying
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          }
        `}
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
          </svg>
        )}
      </button>
      {isPlaying && (
        <VoiceWaveform isActive intensity={0.6} />
      )}
    </div>
  )
}

// Combined Voice Chat Component with Language Matching
interface VoiceChatProps {
  onMessage: (text: string, language: VoiceLanguage) => Promise<string>
  className?: string
}

export function VoiceChat({ onMessage, className = '' }: VoiceChatProps) {
  const [mode, setMode] = useState<'idle' | 'listening' | 'processing' | 'responding'>('idle')
  const [response, setResponse] = useState<string | null>(null)
  const [inputLanguage, setInputLanguage] = useState<VoiceLanguage>('en-US')

  const handleTranscript = async (text: string, language: VoiceLanguage) => {
    setMode('processing')
    setInputLanguage(language) // Remember input language for response
    try {
      const aiResponse = await onMessage(text, language)
      setResponse(aiResponse)
      setMode('responding')
    } catch (error) {
      console.error('Error getting response:', error)
      setMode('idle')
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <VoiceInput
        onTranscript={handleTranscript}
        onListening={(listening) => setMode(listening ? 'listening' : 'idle')}
        language="auto" // Enable auto-detect for natural conversations
        placeholder={
          mode === 'processing' ? 'Thinking...' :
          mode === 'responding' ? 'Responding...' :
          'Tap to speak with Nexus'
        }
      />

      {response && mode === 'responding' && (
        <div className="bg-slate-800/50 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm">{response}</p>
          </div>
          <VoiceResponse
            text={response}
            language={inputLanguage} // Respond in same language as input
            autoPlay
            onComplete={() => {
              setMode('idle')
              setResponse(null)
            }}
          />
        </div>
      )}

      {mode === 'processing' && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      )}
    </div>
  )
}

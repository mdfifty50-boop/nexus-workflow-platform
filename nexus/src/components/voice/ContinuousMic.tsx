/**
 * Continuous Mic Component
 *
 * A voice input component that can stay open during conversation
 * Features:
 * - Toggle between auto-close and continuous listening modes
 * - Real-time dialect detection
 * - Visual "listening..." indicator with waveform
 * - Automatic language response matching
 * - Support for Kuwaiti Arabic and other dialects
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import {
  detectDialect,
  getDialectDisplayName,
  getDialectFlag,
  type Dialect,
} from '@/lib/voice/dialect-detector'

interface ContinuousMicProps {
  onTranscript?: (text: string, dialect: Dialect, confidence: number) => void
  onDialectDetected?: (dialect: Dialect, confidence: number, patterns: string[]) => void
  defaultContinuous?: boolean // Start in continuous mode
  placeholder?: string
  className?: string
}

// Voice waveform visualization
function VoiceWaveform({ isActive, intensity = 0.5 }: { isActive: boolean; intensity?: number }) {
  const bars = 7 // More bars for richer visualization
  return (
    <div className="flex items-center gap-1 h-8">
      {[...Array(bars)].map((_, i) => {
        const delay = i * 0.1
        const baseHeight = isActive ? 6 + intensity * 20 : 4
        const maxHeight = isActive ? 12 + intensity * 24 : 4

        return (
          <div
            key={i}
            className={`
              w-1 rounded-full transition-all duration-200
              ${isActive ? 'bg-gradient-to-t from-cyan-500 to-cyan-300' : 'bg-slate-600'}
            `}
            style={{
              height: `${baseHeight}px`,
              animation: isActive
                ? `voice-pulse 0.6s ease-in-out ${delay}s infinite alternate`
                : 'none',
              '--max-height': `${maxHeight}px`,
            } as React.CSSProperties}
          />
        )
      })}
      <style>{`
        @keyframes voice-pulse {
          from { height: 6px; opacity: 0.7; }
          to { height: var(--max-height, 24px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// Dialect confidence indicator
function DialectConfidence({ confidence }: { confidence: number }) {
  const getColor = () => {
    if (confidence > 0.7) return 'bg-emerald-500'
    if (confidence > 0.4) return 'bg-amber-500'
    return 'bg-slate-500'
  }

  return (
    <div className="flex items-center gap-1">
      <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
      <span className="text-xs text-slate-400">
        {Math.round(confidence * 100)}%
      </span>
    </div>
  )
}

export function ContinuousMic({
  onTranscript,
  onDialectDetected,
  defaultContinuous = true, // Changed: Default to continuous mode for better UX
  placeholder = 'Click mic to speak...',
  className = '',
}: ContinuousMicProps) {
  // State - Default to continuous mode for Kuwaiti dialect absorption
  const [isContinuousMode, setIsContinuousMode] = useState(defaultContinuous)
  const [detectedDialect, setDetectedDialect] = useState<Dialect | null>(null)
  const [dialectConfidence, setDialectConfidence] = useState(0)
  const [detectedPatterns, setDetectedPatterns] = useState<string[]>([])
  const [showDialectInfo, setShowDialectInfo] = useState(false)

  // Track last transcript to avoid duplicate processing
  const lastTranscriptRef = useRef('')

  // Voice input hook with dynamic autoClose based on mode
  const {
    isListening,
    transcript,
    error,
    audioLevel,
    currentLanguage,
    startListening,
    stopListening,
    clearError,
  } = useVoiceInput({
    defaultLanguage: 'en-US',
    autoDetectLanguage: true,
    matchResponseLanguage: true,
    autoClose: !isContinuousMode, // Disable auto-close in continuous mode
    silenceTimeout: isContinuousMode ? 30000 : 5000, // Much longer timeout: 30s continuous, 5s normal
    manualCloseEnabled: true,
  })

  // Process transcript for dialect detection
  const processTranscript = useCallback(
    (text: string) => {
      if (!text || text === lastTranscriptRef.current) return
      lastTranscriptRef.current = text

      // Detect dialect
      const result = detectDialect(text)

      // Update state
      setDetectedDialect(result.dialect)
      setDialectConfidence(result.confidence)
      setDetectedPatterns(result.detectedPatterns)

      // Notify parent
      onDialectDetected?.(result.dialect, result.confidence, result.detectedPatterns)
      onTranscript?.(text, result.dialect, result.confidence)
    },
    [onDialectDetected, onTranscript]
  )

  // Watch transcript changes
  useEffect(() => {
    if (transcript) {
      processTranscript(transcript)
    }
  }, [transcript, processTranscript])

  // Toggle listening
  const toggleListening = async () => {
    if (isListening) {
      stopListening()
    } else {
      clearError()
      await startListening()
    }
  }

  // Toggle continuous mode
  const toggleContinuousMode = () => {
    const newMode = !isContinuousMode
    setIsContinuousMode(newMode)

    // If turning off continuous mode while listening, stop
    if (!newMode && isListening) {
      stopListening()
    }
  }

  // Get current dialect info
  const currentDialectInfo = detectedDialect
    ? {
        displayName: getDialectDisplayName(detectedDialect),
        flag: getDialectFlag(detectedDialect),
      }
    : null

  return (
    <div className={`relative ${className}`}>
      {/* Main mic interface */}
      <div
        className={`
        flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300
        ${
          isListening
            ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
            : 'border-border bg-card hover:border-primary/50'
        }
      `}
      >
        {/* Microphone Button */}
        <button
          onClick={toggleListening}
          className={`
            w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300
            ${
              isListening
                ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/50 scale-105'
                : 'bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105'
            }
          `}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? (
            <svg className="w-7 h-7 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </button>

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-2">
          {isListening ? (
            <>
              <div className="flex items-center gap-3">
                <VoiceWaveform isActive={isListening} intensity={audioLevel} />
                <span className="text-sm font-medium text-cyan-400 animate-pulse">
                  {currentLanguage?.startsWith('ar') ? 'أستمع...' : 'Listening...'}
                </span>
                {isContinuousMode && (
                  <span className="text-xs text-cyan-400/70 bg-cyan-500/10 px-2 py-1 rounded">
                    Continuous Mode
                  </span>
                )}
              </div>
              {transcript && (
                <p className="text-sm text-muted-foreground line-clamp-2">{transcript}</p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">{placeholder}</p>
          )}
        </div>

        {/* Dialect Indicator */}
        {(detectedDialect || currentLanguage) && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDialectInfo(!showDialectInfo)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
                ${
                  currentLanguage?.startsWith('ar')
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }
              `}
            >
              <span className="text-lg">{currentDialectInfo?.flag || '🌐'}</span>
              <span className="text-xs">
                {currentDialectInfo?.displayName.split(' ')[0] || 'Auto'}
              </span>
              {dialectConfidence > 0 && (
                <span className="text-xs opacity-70">
                  {Math.round(dialectConfidence * 100)}%
                </span>
              )}
            </button>
          </div>
        )}

        {/* Continuous Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleContinuousMode}
            className={`
              relative w-12 h-6 rounded-full transition-all duration-300
              ${isContinuousMode ? 'bg-cyan-500' : 'bg-slate-600'}
            `}
            aria-label="Toggle continuous mode"
            title={isContinuousMode ? 'Continuous mode ON' : 'Continuous mode OFF'}
          >
            <div
              className={`
                absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300
                ${isContinuousMode ? 'left-6' : 'left-0.5'}
              `}
            />
          </button>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {isContinuousMode ? 'Stay Open' : 'Auto-Close'}
          </span>
        </div>

        {/* Manual Close Button */}
        {isListening && (
          <button
            onClick={stopListening}
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            aria-label="Stop listening"
            title="Stop listening"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dialect Info Panel */}
      {showDialectInfo && detectedDialect && (
        <div className="mt-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentDialectInfo?.flag}</span>
                <span className="text-sm font-medium text-slate-200">
                  {currentDialectInfo?.displayName}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Detected with {Math.round(dialectConfidence * 100)}% confidence
              </div>
            </div>
            <button
              onClick={() => setShowDialectInfo(false)}
              className="text-slate-400 hover:text-slate-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <DialectConfidence confidence={dialectConfidence} />

          {detectedPatterns.length > 0 && (
            <div className="text-xs text-slate-400">
              <div className="font-medium mb-1">Detected patterns:</div>
              <div className="flex flex-wrap gap-1">
                {detectedPatterns.slice(0, 5).map((pattern, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-700/50 rounded text-slate-300">
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-red-400/70 hover:text-red-400 transition-colors"
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
        <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">💡</span>
            <span>
              {isContinuousMode
                ? 'Continuous mode: Mic stays open during conversation'
                : 'Auto-close mode: Mic closes after silence'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">🔍</span>
            <span>Automatic dialect detection from speech content</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Export helper function for external use
export { detectDialect, SUPPORTED_DIALECTS } from '@/lib/voice/dialect-detector'

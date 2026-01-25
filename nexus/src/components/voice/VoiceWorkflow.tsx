/**
 * Voice Workflow Component
 *
 * Main interface for voice-controlled workflow execution
 * Features:
 * - Continuous mic that stays open
 * - Kuwaiti dialect detection and response
 * - Real-time workflow execution
 * - Context auto-save
 * - Visual feedback for all states
 */

import { useState, useEffect } from 'react'
import { useWorkflowVoice } from '@/hooks/useWorkflowVoice'
import { getDialectDisplayName, getDialectFlag, type Dialect } from '@/lib/voice/dialect-detector'

interface VoiceWorkflowProps {
  className?: string
  onWorkflowComplete?: (result: unknown) => void
}

// Animated waveform for listening state
function ListeningWaveform({ intensity = 0.5 }: { intensity?: number }) {
  const bars = 9
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {[...Array(bars)].map((_, i) => {
        const delay = i * 0.08
        const baseHeight = 8 + intensity * 30
        const maxHeight = 16 + intensity * 48

        return (
          <div
            key={i}
            className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-cyan-300"
            style={{
              height: `${baseHeight}px`,
              animation: `waveform-pulse 0.5s ease-in-out ${delay}s infinite alternate`,
              '--max-height': `${maxHeight}px`,
            } as React.CSSProperties}
          />
        )
      })}
      <style>{`
        @keyframes waveform-pulse {
          from { height: 8px; opacity: 0.6; }
          to { height: var(--max-height, 48px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// Processing spinner
function ProcessingSpinner() {
  return (
    <div className="flex items-center justify-center h-16">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" />
      </div>
    </div>
  )
}

// Dialect badge
function DialectBadge({ dialect, confidence }: { dialect: Dialect; confidence?: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600">
      <span className="text-lg">{getDialectFlag(dialect)}</span>
      <span className="text-sm text-slate-300">
        {getDialectDisplayName(dialect).split(' ')[0]}
      </span>
      {confidence !== undefined && (
        <span className="text-xs text-slate-500">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </div>
  )
}

// Workflow result card
function WorkflowResultCard({
  result,
}: {
  result: {
    success: boolean
    response: { text: string; dialect: Dialect; isRTL: boolean }
    actions: Array<{ service: string; action: string; status: string }>
  }
}) {
  return (
    <div
      className={`
        p-4 rounded-xl border-2 transition-all duration-300
        ${result.success
          ? 'border-emerald-500/50 bg-emerald-500/10'
          : 'border-amber-500/50 bg-amber-500/10'
        }
      `}
      dir={result.response.isRTL ? 'rtl' : 'ltr'}
    >
      <p className={`text-lg ${result.response.isRTL ? 'text-right' : 'text-left'}`}>
        {result.response.text}
      </p>

      {result.actions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
          {result.actions.map((action, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-slate-400"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  action.status === 'completed'
                    ? 'bg-emerald-500'
                    : action.status === 'failed'
                    ? 'bg-red-500'
                    : 'bg-amber-500'
                }`}
              />
              <span>{action.service}</span>
              <span className="text-slate-600">→</span>
              <span>{action.action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function VoiceWorkflow({ className = '', onWorkflowComplete }: VoiceWorkflowProps) {
  const [showHistory, setShowHistory] = useState(false)

  const {
    isListening,
    isProcessing,
    isSpeaking,
    transcript,
    detectedDialect,
    currentIntent,
    lastResult,
    executionHistory,
    error,
    stopListening,
    toggleListening,
    clearHistory,
    clearError,
  } = useWorkflowVoice({
    autoExecute: true,
    speakResponses: true,
    autoSaveContext: true,
    continuousMode: true,
    onWorkflowComplete: (result) => {
      onWorkflowComplete?.(result)
    },
  })

  // Keyboard shortcut for mic toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space bar to toggle mic (when not in input)
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        toggleListening()
      }
      // Escape to stop
      if (e.code === 'Escape' && isListening) {
        stopListening()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isListening, toggleListening, stopListening])

  // Determine current state for display
  const getStateDisplay = () => {
    if (error) return 'error'
    if (isProcessing) return 'processing'
    if (isSpeaking) return 'speaking'
    if (isListening) return 'listening'
    return 'idle'
  }

  const state = getStateDisplay()

  return (
    <div className={`relative ${className}`}>
      {/* Main Interface */}
      <div
        className={`
          p-6 rounded-3xl border-2 transition-all duration-500
          ${state === 'listening'
            ? 'border-cyan-500 bg-gradient-to-b from-cyan-500/20 to-slate-900 shadow-2xl shadow-cyan-500/20'
            : state === 'processing'
            ? 'border-amber-500 bg-gradient-to-b from-amber-500/10 to-slate-900'
            : state === 'speaking'
            ? 'border-emerald-500 bg-gradient-to-b from-emerald-500/10 to-slate-900'
            : state === 'error'
            ? 'border-red-500 bg-gradient-to-b from-red-500/10 to-slate-900'
            : 'border-slate-700 bg-slate-900/80'
          }
        `}
      >
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-4">
          {/* Dialect indicator */}
          {detectedDialect && (
            <DialectBadge
              dialect={detectedDialect}
              confidence={currentIntent?.dialect.confidence}
            />
          )}

          {/* History toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          >
            {executionHistory.length > 0 && (
              <span className="mr-2 px-1.5 py-0.5 rounded bg-slate-700 text-xs">
                {executionHistory.length}
              </span>
            )}
            History
          </button>
        </div>

        {/* Visual Feedback Area */}
        <div className="min-h-[100px] flex flex-col items-center justify-center">
          {state === 'listening' && <ListeningWaveform />}
          {state === 'processing' && <ProcessingSpinner />}
          {state === 'speaking' && (
            <div className="text-center">
              <div className="text-2xl mb-2">🔊</div>
              <p className="text-sm text-slate-400">Speaking...</p>
            </div>
          )}
          {state === 'idle' && (
            <div className="text-center text-slate-500">
              <p className="text-lg mb-1">Tap mic or press Space</p>
              <p className="text-sm">
                {detectedDialect?.startsWith('ar')
                  ? 'تكلم وسأنفذ الأمر'
                  : 'Speak and I\'ll execute'}
              </p>
            </div>
          )}
          {state === 'error' && (
            <div className="text-center text-red-400">
              <p className="text-lg mb-2">⚠️</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 px-3 py-1 text-xs bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div
            className={`
              mt-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700
              ${detectedDialect?.startsWith('ar') ? 'text-right' : 'text-left'}
            `}
            dir={detectedDialect?.startsWith('ar') ? 'rtl' : 'ltr'}
          >
            <p className="text-sm text-slate-400 mb-1">
              {detectedDialect?.startsWith('ar') ? 'سمعت:' : 'Heard:'}
            </p>
            <p className="text-slate-200">{transcript}</p>
          </div>
        )}

        {/* Main Mic Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center
              transition-all duration-300 transform
              ${isListening
                ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/50 scale-110'
                : isProcessing
                ? 'bg-slate-700 text-slate-400 cursor-wait'
                : 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300 hover:from-slate-600 hover:to-slate-700 hover:scale-105'
              }
            `}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? (
              // Stop icon
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" strokeWidth={2} />
              </svg>
            ) : (
              // Mic icon
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Quick Tips */}
        <div className="mt-4 text-center text-xs text-slate-500">
          {isListening ? (
            <span>
              {detectedDialect?.startsWith('ar')
                ? '🎤 الميكروفون مفتوح... تكلم'
                : '🎤 Mic is open... speak naturally'}
            </span>
          ) : (
            <span>Space to talk • Escape to stop</span>
          )}
        </div>

        {/* Last Result */}
        {lastResult && !showHistory && (
          <div className="mt-4">
            <WorkflowResultCard result={lastResult} />
          </div>
        )}
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">Execution History</h3>
            {executionHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {executionHistory.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No workflows executed yet
            </p>
          ) : (
            <div className="space-y-3">
              {[...executionHistory].reverse().map((result, i) => (
                <WorkflowResultCard key={i} result={result} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default VoiceWorkflow

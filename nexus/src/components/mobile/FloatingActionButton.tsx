import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Types
type VoiceLanguage = 'en-US' | 'ar-KW'
type VoiceState = 'idle' | 'listening' | 'processing' | 'confirmed' | 'error'

interface QuickAction {
  id: string
  label: string
  labelAr?: string
  icon: React.ReactNode
  action: () => void
  color: string
}

interface FloatingActionButtonProps {
  onVoiceCommand?: (transcript: string, language: VoiceLanguage) => void
  className?: string
  /** Enable continuous listening mode (keeps listening after each command) */
  continuousMode?: boolean
  /** Callback when voice state changes */
  onVoiceStateChange?: (state: VoiceState) => void
}

// Haptic feedback utility
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30]
    }
    navigator.vibrate(patterns[type])
  }
}

// Voice waveform visualization
function VoiceWaveform({ isActive, intensity = 0.5 }: { isActive: boolean; intensity?: number }) {
  const bars = 5
  return (
    <div className="flex items-center justify-center gap-0.5 h-6">
      {[...Array(bars)].map((_, i) => {
        const delay = i * 0.08
        const baseHeight = isActive ? 6 + intensity * 16 : 4
        const maxHeight = isActive ? 10 + intensity * 14 : 4

        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all ${isActive ? 'bg-white' : 'bg-white/50'}`}
            style={{
              height: `${baseHeight}px`,
              animation: isActive ? `fab-voice-bar 0.4s ease-in-out ${delay}s infinite alternate` : 'none',
              '--max-height': `${maxHeight}px`,
            } as React.CSSProperties}
          />
        )
      })}
    </div>
  )
}

// Language toggle button
function LanguageToggle({
  language,
  onToggle
}: {
  language: VoiceLanguage
  onToggle: () => void
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        triggerHaptic('light')
        onToggle()
      }}
      className={`
        min-w-[44px] min-h-[44px] px-3 py-2 rounded-xl font-medium text-sm
        transition-all duration-200 active:scale-95
        ${language === 'ar-KW'
          ? 'bg-emerald-500/90 text-white'
          : 'bg-slate-700/90 text-white'
        }
      `}
      aria-label={`Switch to ${language === 'en-US' ? 'Arabic' : 'English'}`}
    >
      {language === 'ar-KW' ? 'عربي' : 'EN'}
    </button>
  )
}

// Voice state indicator component
function VoiceStateIndicator({ state, language }: { state: VoiceState; language: VoiceLanguage }) {
  const stateConfig = {
    idle: { color: 'bg-slate-500', label: language === 'ar-KW' ? 'جاهز' : 'Ready', icon: '🎤' },
    listening: { color: 'bg-cyan-500 animate-pulse', label: language === 'ar-KW' ? 'أستمع...' : 'Listening...', icon: '👂' },
    processing: { color: 'bg-amber-500 animate-pulse', label: language === 'ar-KW' ? 'جاري المعالجة...' : 'Processing...', icon: '⏳' },
    confirmed: { color: 'bg-emerald-500', label: language === 'ar-KW' ? 'تم!' : 'Got it!', icon: '✓' },
    error: { color: 'bg-red-500', label: language === 'ar-KW' ? 'خطأ' : 'Error', icon: '✕' }
  }

  const config = stateConfig[state]

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${config.color}`} />
      <span className="text-sm text-white/80">{config.label}</span>
    </div>
  )
}

export function FloatingActionButton({
  onVoiceCommand,
  className = '',
  continuousMode = false,
  onVoiceStateChange
}: FloatingActionButtonProps) {
  const navigate = useNavigate()

  // State
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>('en-US')
  const [transcript, setTranscript] = useState('')
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showVoicePanel, setShowVoicePanel] = useState(false)
  const [isContinuousMode, setIsContinuousMode] = useState(continuousMode)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)

  // Refs
  const recognitionRef = useRef<any>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const fabRef = useRef<HTMLButtonElement>(null)

  // Quick actions menu items
  const actions: QuickAction[] = [
    {
      id: 'voice',
      label: 'Voice Input',
      labelAr: 'إدخال صوتي',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      action: () => {
        setShowVoicePanel(true)
        setIsMenuOpen(false)
      },
      color: 'from-cyan-500 to-blue-500'
    },
    {
      id: 'new-workflow',
      label: 'New Workflow',
      labelAr: 'سير عمل جديد',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      action: () => navigate('/workflow-demo'),
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'templates',
      label: 'Templates',
      labelAr: 'القوالب',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      action: () => navigate('/templates'),
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      labelAr: 'لوحة التحكم',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      action: () => navigate('/dashboard'),
      color: 'from-emerald-500 to-teal-500'
    }
  ]

  // Update voice state and notify parent
  const updateVoiceState = useCallback((newState: VoiceState) => {
    setVoiceState(newState)
    onVoiceStateChange?.(newState)
  }, [onVoiceStateChange])

  // Show confirmation feedback
  const showConfirmation = useCallback((message: string) => {
    setConfirmationMessage(message)
    updateVoiceState('confirmed')
    triggerHaptic('medium')
    setTimeout(() => {
      setConfirmationMessage(null)
      if (isContinuousMode && isListening) {
        updateVoiceState('listening')
      } else {
        updateVoiceState('idle')
      }
    }, 1500)
  }, [isContinuousMode, isListening, updateVoiceState])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = voiceLanguage

        recognition.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += text
            } else {
              interimTranscript += text
            }
          }

          setTranscript(interimTranscript || finalTranscript)

          if (finalTranscript) {
            // Show processing state
            updateVoiceState('processing')

            // Add to command history
            setCommandHistory(prev => [finalTranscript, ...prev.slice(0, 4)])

            // Process command
            onVoiceCommand?.(finalTranscript, voiceLanguage)

            // Show confirmation
            showConfirmation(voiceLanguage === 'ar-KW' ? 'تم الاستلام!' : 'Got it!')

            // Clear transcript for next command in continuous mode
            if (isContinuousMode) {
              setTimeout(() => setTranscript(''), 1500)
            }
          }
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          updateVoiceState('error')
          setError(
            event.error === 'not-allowed'
              ? voiceLanguage === 'ar-KW'
                ? 'يرجى السماح بالوصول إلى الميكروفون'
                : 'Please allow microphone access'
              : voiceLanguage === 'ar-KW'
                ? 'خطأ في التعرف على الصوت'
                : 'Voice recognition error'
          )
          setIsListening(false)
          triggerHaptic('heavy')

          // Reset error state after delay
          setTimeout(() => {
            if (!isListening) {
              updateVoiceState('idle')
            }
          }, 2000)
        }

        recognition.onend = () => {
          if (isListening && isContinuousMode) {
            // In continuous mode, restart listening automatically
            try {
              recognition.start()
              updateVoiceState('listening')
            } catch { /* ignore */ }
          } else if (isListening) {
            // In normal mode, also restart
            try {
              recognition.start()
            } catch { /* ignore */ }
          }
        }

        recognitionRef.current = recognition
      } else {
        setError('Voice input not supported')
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch { /* ignore */ }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [voiceLanguage, onVoiceCommand, isContinuousMode, isListening, updateVoiceState, showConfirmation])

  // Update recognition language when toggled
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = voiceLanguage
    }
  }, [voiceLanguage])

  // Audio level monitoring for visualization
  useEffect(() => {
    if (isListening) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          audioContextRef.current = new AudioContext()
          analyserRef.current = audioContextRef.current.createAnalyser()
          const source = audioContextRef.current.createMediaStreamSource(stream)
          source.connect(analyserRef.current)
          analyserRef.current.fftSize = 256

          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

          const updateLevel = () => {
            if (analyserRef.current && isListening) {
              analyserRef.current.getByteFrequencyData(dataArray)
              const average = dataArray.reduce((a, b) => a + b) / dataArray.length
              setAudioLevel(average / 255)
              requestAnimationFrame(updateLevel)
            }
          }

          updateLevel()
        })
        .catch(err => {
          console.error('Microphone access error:', err)
          setError(voiceLanguage === 'ar-KW'
            ? 'لا يمكن الوصول إلى الميكروفون'
            : 'Could not access microphone')
        })
    } else {
      setAudioLevel(0)
    }
  }, [isListening, voiceLanguage])

  // Start voice recognition
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Voice input not available')
      updateVoiceState('error')
      return
    }

    setTranscript('')
    setError(null)
    setShowVoicePanel(true)

    try {
      recognitionRef.current.start()
      setIsListening(true)
      updateVoiceState('listening')
      triggerHaptic('medium')
    } catch (err) {
      console.error('Failed to start recognition:', err)
      setError('Failed to start voice recognition')
      updateVoiceState('error')
    }
  }, [updateVoiceState])

  // Stop voice recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    updateVoiceState('idle')
    triggerHaptic('light')
  }, [updateVoiceState])

  // Toggle continuous mode
  const toggleContinuousMode = useCallback(() => {
    setIsContinuousMode(prev => !prev)
    triggerHaptic('light')
  }, [])

  // Toggle language
  const toggleLanguage = useCallback(() => {
    setVoiceLanguage(prev => prev === 'en-US' ? 'ar-KW' : 'en-US')
    triggerHaptic('light')
  }, [])

  // Handle long press start
  const handlePressStart = useCallback(() => {
    isLongPressRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      triggerHaptic('heavy')
      startListening()
    }, 500) // 500ms for long press
  }, [startListening])

  // Handle press end
  const handlePressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    // If it was a long press and we're listening, stop
    if (isLongPressRef.current && isListening) {
      stopListening()
    }
    // If it wasn't a long press, toggle menu
    else if (!isLongPressRef.current && !isListening) {
      setIsMenuOpen(prev => !prev)
      triggerHaptic('light')
    }
  }, [isListening, stopListening])

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handlePressStart()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    handlePressEnd()
  }

  // Handle mouse events for desktop testing
  const handleMouseDown = () => handlePressStart()
  const handleMouseUp = () => handlePressEnd()
  const handleMouseLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // Close voice panel
  const closeVoicePanel = () => {
    stopListening()
    setShowVoicePanel(false)
    setTranscript('')
    setError(null)
  }

  return (
    <>
      {/* CSS for animations */}
      <style>{`
        @keyframes fab-voice-bar {
          from { height: 4px; }
          to { height: var(--max-height, 20px); }
        }

        @keyframes fab-pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes fab-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      {/* Main FAB Container - Bottom Right, Thumb Zone */}
      <div
        className={`fixed bottom-24 right-4 z-40 md:bottom-6 md:z-50 ${className}`}
        style={{
          // Safe area insets for notched devices
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)'
        }}
      >
        {/* Quick Actions Menu */}
        <div className={`
          absolute bottom-[68px] right-0 flex flex-col items-end gap-3
          transition-all duration-300 ease-out
          ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}>
          {actions.map((action, index) => (
            <div
              key={action.id}
              className="flex items-center gap-3"
              style={{
                transitionDelay: isMenuOpen ? `${index * 50}ms` : '0ms'
              }}
            >
              {/* Action Label */}
              <span
                className={`
                  px-3 py-2 bg-slate-800/95 backdrop-blur-sm text-white text-sm rounded-xl
                  shadow-lg whitespace-nowrap
                  transition-all duration-200
                  ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
                `}
                style={{ transitionDelay: isMenuOpen ? `${index * 50 + 100}ms` : '0ms' }}
              >
                {voiceLanguage === 'ar-KW' && action.labelAr ? action.labelAr : action.label}
              </span>

              {/* Action Button - 44px minimum touch target */}
              <button
                onClick={() => {
                  triggerHaptic('medium')
                  action.action()
                  setIsMenuOpen(false)
                }}
                className={`
                  min-w-[44px] min-h-[44px] w-12 h-12 rounded-full
                  bg-gradient-to-br ${action.color}
                  flex items-center justify-center text-white shadow-lg
                  hover:scale-110 active:scale-95
                  transition-all duration-200
                  ${isMenuOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
                `}
                style={{ transitionDelay: isMenuOpen ? `${index * 50}ms` : '0ms' }}
                aria-label={action.label}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>

        {/* Main FAB Button - 56px for thumb-friendly interaction */}
        <div className="relative">
          {/* Pulse ring when listening */}
          {isListening && (
            <>
              <div
                className="absolute inset-0 rounded-full bg-cyan-500/30"
                style={{ animation: 'fab-pulse-ring 1.5s ease-out infinite' }}
              />
              <div
                className="absolute inset-0 rounded-full bg-cyan-500/20"
                style={{ animation: 'fab-pulse-ring 1.5s ease-out 0.5s infinite' }}
              />
            </>
          )}

          <button
            ref={fabRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`
              relative w-14 h-14 min-w-[56px] min-h-[56px] rounded-full
              flex items-center justify-center text-white
              shadow-xl transition-all duration-300
              active:scale-95 touch-manipulation
              ${isListening
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/40'
                : 'bg-gradient-to-br from-primary to-secondary hover:shadow-primary/30'
              }
              ${isMenuOpen && !isListening ? 'rotate-45' : 'rotate-0'}
            `}
            style={{
              animation: !isListening && !isMenuOpen ? 'fab-float 3s ease-in-out infinite' : 'none'
            }}
            aria-label={isListening ? 'Stop listening' : 'Open quick actions or hold for voice'}
            aria-expanded={isMenuOpen}
          >
            {isListening ? (
              <VoiceWaveform isActive intensity={audioLevel} />
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </button>
        </div>

        {/* Hint text for long press */}
        {!isMenuOpen && !isListening && !showVoicePanel && (
          <div className="absolute -top-8 right-0 whitespace-nowrap text-xs text-muted-foreground opacity-60">
            {voiceLanguage === 'ar-KW' ? 'اضغط مطولاً للصوت' : 'Hold for voice'}
          </div>
        )}
      </div>

      {/* Voice Input Panel (overlay) */}
      {showVoicePanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div
            className={`
              w-full max-w-lg mx-4 mb-4 p-6
              bg-slate-900/95 backdrop-blur-xl rounded-3xl
              shadow-2xl border border-white/10
              transition-all duration-300
              ${showVoicePanel ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
            `}
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {voiceLanguage === 'ar-KW' ? 'الإدخال الصوتي' : 'Voice Input'}
                </h3>
                <VoiceStateIndicator state={voiceState} language={voiceLanguage} />
              </div>
              <div className="flex items-center gap-3">
                <LanguageToggle
                  language={voiceLanguage}
                  onToggle={toggleLanguage}
                />
                <button
                  onClick={closeVoicePanel}
                  className="min-w-[44px] min-h-[44px] p-2 rounded-xl bg-slate-700/50 text-white/70 hover:text-white active:scale-95"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Continuous Mode Toggle */}
            <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm text-white">
                  {voiceLanguage === 'ar-KW' ? 'الوضع المستمر' : 'Continuous Mode'}
                </span>
              </div>
              <button
                onClick={toggleContinuousMode}
                className={`
                  relative w-12 h-7 rounded-full transition-colors duration-200
                  ${isContinuousMode ? 'bg-cyan-500' : 'bg-slate-600'}
                `}
                aria-pressed={isContinuousMode}
                aria-label={voiceLanguage === 'ar-KW' ? 'تبديل الوضع المستمر' : 'Toggle continuous mode'}
              >
                <div
                  className={`
                    absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
                    ${isContinuousMode ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Confirmation Message */}
            {confirmationMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-center animate-pulse">
                <span className="text-lg mr-2">✓</span>
                {confirmationMessage}
              </div>
            )}

            {/* Voice Visualization */}
            <div className="flex flex-col items-center mb-6">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`
                  relative w-20 h-20 min-w-[80px] min-h-[80px] rounded-full flex items-center justify-center
                  transition-all duration-300 active:scale-95
                  ${voiceState === 'listening'
                    ? 'bg-cyan-500 shadow-lg shadow-cyan-500/40'
                    : voiceState === 'processing'
                    ? 'bg-amber-500 shadow-lg shadow-amber-500/40'
                    : voiceState === 'confirmed'
                    ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40'
                    : voiceState === 'error'
                    ? 'bg-red-500 shadow-lg shadow-red-500/40'
                    : 'bg-slate-700 hover:bg-slate-600'
                  }
                `}
              >
                {voiceState === 'listening' ? (
                  <>
                    {/* Stop icon */}
                    <div className="w-6 h-6 bg-white rounded-sm" />
                    {/* Pulse rings */}
                    <div
                      className="absolute inset-0 rounded-full bg-cyan-500/30"
                      style={{ animation: 'fab-pulse-ring 1.5s ease-out infinite' }}
                    />
                  </>
                ) : voiceState === 'processing' ? (
                  <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : voiceState === 'confirmed' ? (
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : voiceState === 'error' ? (
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>

              <p className="mt-4 text-sm text-muted-foreground">
                {voiceState === 'listening'
                  ? (voiceLanguage === 'ar-KW' ? 'جارٍ الاستماع...' : 'Listening...')
                  : voiceState === 'processing'
                  ? (voiceLanguage === 'ar-KW' ? 'جاري المعالجة...' : 'Processing...')
                  : voiceState === 'confirmed'
                  ? (voiceLanguage === 'ar-KW' ? 'تم!' : 'Got it!')
                  : (voiceLanguage === 'ar-KW' ? 'انقر للتحدث' : 'Tap to speak')
                }
                {isContinuousMode && voiceState === 'listening' && (
                  <span className="block text-xs text-cyan-400 mt-1">
                    {voiceLanguage === 'ar-KW' ? '(الوضع المستمر نشط)' : '(Continuous mode active)'}
                  </span>
                )}
              </p>
            </div>

            {/* Transcript Display */}
            <div
              className={`
                min-h-[60px] p-4 rounded-2xl bg-slate-800/50 border border-white/5
                ${voiceLanguage === 'ar-KW' ? 'text-right' : 'text-left'}
              `}
              dir={voiceLanguage === 'ar-KW' ? 'rtl' : 'ltr'}
            >
              {transcript ? (
                <p className="text-white">{transcript}</p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {voiceLanguage === 'ar-KW'
                    ? 'قل شيئًا مثل: "أنشئ سير عمل للمهام"'
                    : 'Say something like: "Create a workflow for tasks"'
                  }
                </p>
              )}
            </div>

            {/* Command History */}
            {commandHistory.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2">
                  {voiceLanguage === 'ar-KW' ? 'الأوامر الأخيرة:' : 'Recent commands:'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {commandHistory.map((cmd, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded bg-slate-800/50 text-slate-400"
                    >
                      {cmd.length > 30 ? cmd.substring(0, 30) + '...' : cmd}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Quick Examples */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {(voiceLanguage === 'ar-KW'
                ? ['أنشئ مشروع', 'اعرض القوالب', 'افتح لوحة التحكم']
                : ['Create workflow', 'Show templates', 'Open dashboard']
              ).map((example, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onVoiceCommand?.(example, voiceLanguage)
                    triggerHaptic('light')
                  }}
                  className="px-3 py-1.5 min-h-[44px] text-xs rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Backdrop click to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeVoicePanel}
          />
        </div>
      )}

      {/* Backdrop for menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  )
}

export default FloatingActionButton

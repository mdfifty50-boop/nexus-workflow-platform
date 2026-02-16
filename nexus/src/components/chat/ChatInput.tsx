/**
 * ChatInput Component
 *
 * Message input component with:
 * - Auto-expanding textarea
 * - Send button (arrow icon like ChatGPT)
 * - Professional voice recording UI with live timer, waveform, and stop button
 * - Voice input with GCC dialect support (Kuwaiti, Saudi, Egyptian Arabic)
 * - Enter to send, Shift+Enter for newline
 * - Language selection switches chat direction (RTL for Arabic)
 * - Optional character/token limit indicator
 * - Disabled state while AI is responding
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ArrowUp, Loader2, Mic, Square, Languages } from 'lucide-react'
import { useVoiceInput, type VoiceLanguage, VOICE_LANGUAGES } from '@/hooks/useVoiceInput'

// ============================================================================
// Types
// ============================================================================

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  showCharacterCount?: boolean
  className?: string
  enableVoice?: boolean
  defaultLanguage?: VoiceLanguage
  onLanguageChange?: (lang: VoiceLanguage) => void
}

// ============================================================================
// Recording Timer Hook
// ============================================================================

function useRecordingTimer(isListening: boolean) {
  const [elapsed, setElapsed] = React.useState(0)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  React.useEffect(() => {
    if (isListening) {
      setElapsed(0)
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setElapsed(0)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isListening])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  return { elapsed, formatted }
}

// ============================================================================
// Waveform Bars Component
// ============================================================================

function WaveformBars({ audioLevel, isActive }: { audioLevel: number; isActive: boolean }) {
  const barCount = 24
  return (
    <div className="flex items-center justify-center gap-[2px] h-8">
      {Array.from({ length: barCount }).map((_, i) => {
        const center = barCount / 2
        const distFromCenter = Math.abs(i - center) / center
        const base = isActive ? 0.15 : 0.08
        const height = isActive
          ? base + audioLevel * (1 - distFromCenter * 0.6) * Math.max(0.3, Math.sin((i * 1.2) + Date.now() / 200) * 0.5 + 0.5)
          : base
        return (
          <div
            key={i}
            className="w-[3px] rounded-full bg-gradient-to-t from-cyan-500 to-cyan-300 transition-all duration-75"
            style={{ height: `${Math.max(4, height * 32)}px`, opacity: isActive ? 0.6 + audioLevel * 0.4 : 0.3 }}
          />
        )
      })}
    </div>
  )
}

// ============================================================================
// ChatInput Component
// ============================================================================

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Describe your workflow...',
  maxLength,
  showCharacterCount = false,
  className,
  enableVoice = true,
  defaultLanguage = 'en-US',
  onLanguageChange,
}: ChatInputProps): React.ReactElement {
  const { t } = useTranslation()
  const [value, setValue] = React.useState('')
  const [showLanguageMenu, setShowLanguageMenu] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const languageMenuRef = React.useRef<HTMLDivElement>(null)

  // Voice input hook with GCC dialect support
  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    audioLevel,
    currentLanguage,
    setLanguage,
    startListening,
    stopListening,
    clearTranscript,
    clearError,
  } = useVoiceInput({
    defaultLanguage,
    autoDetectLanguage: true,
    matchResponseLanguage: true,
    autoClose: false,
    silenceTimeout: 5000,
  })

  // Recording timer
  const { formatted: recordingTime } = useRecordingTimer(isListening)

  // Update text field when voice transcript changes
  React.useEffect(() => {
    if (transcript) {
      setValue(prev => {
        if (prev.trim()) {
          return prev + ' ' + transcript
        }
        return transcript
      })
      clearTranscript()
    }
  }, [transcript, clearTranscript])

  // Notify parent of language changes
  React.useEffect(() => {
    if (onLanguageChange) {
      onLanguageChange(currentLanguage)
    }
  }, [currentLanguage, onLanguageChange])

  // Close language menu on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (languageMenuRef.current && !languageMenuRef.current.contains(e.target as Node)) {
        setShowLanguageMenu(false)
      }
    }
    if (showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLanguageMenu])

  const isEmpty = value.trim().length === 0
  const isOverLimit = maxLength ? value.length > maxLength : false
  const canSend = !disabled && !isEmpty && !isOverLimit
  const isRTL = currentLanguage.startsWith('ar')

  // Get current language info
  const currentLangInfo = VOICE_LANGUAGES.find(l => l.code === currentLanguage)

  // Auto-resize textarea
  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const newHeight = Math.min(textarea.scrollHeight, 200)
    textarea.style.height = `${newHeight}px`
  }, [])

  React.useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
    },
    []
  )

  const handleSend = React.useCallback(() => {
    if (!canSend) return
    const trimmedValue = value.trim()
    onSend(trimmedValue)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [canSend, value, onSend])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleLanguageSelect = React.useCallback((lang: VoiceLanguage) => {
    setLanguage(lang)
    setShowLanguageMenu(false)
  }, [setLanguage])

  // Focus textarea on mount
  React.useEffect(() => {
    if (!disabled && !isListening) {
      textareaRef.current?.focus()
    }
  }, [disabled, isListening])

  return (
    <div className={cn('relative', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* === RECORDING MODE: Full overlay === */}
      {isListening ? (
        <div className="rounded-2xl border border-cyan-500/50 ring-2 ring-cyan-500/20 bg-surface-800/80 backdrop-blur-sm overflow-hidden transition-all duration-300">
          {/* Recording header bar */}
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left: Recording indicator + timer */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="absolute w-3 h-3 rounded-full bg-red-500 animate-ping opacity-50" />
                <span className="relative w-3 h-3 rounded-full bg-red-500" />
              </div>
              <span className="text-sm font-mono text-surface-200 tabular-nums">{recordingTime}</span>
              <span className="text-xs text-surface-400">
                {currentLangInfo?.flag} {currentLangInfo?.nativeName}
              </span>
            </div>

            {/* Right: Stop button */}
            <button
              onClick={stopListening}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/30 transition-all active:scale-95"
              aria-label="Stop recording"
            >
              <Square className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">{t('chat.stopRecording')}</span>
            </button>
          </div>

          {/* Waveform visualization */}
          <div className="px-4 py-2">
            <WaveformBars audioLevel={audioLevel} isActive={isListening} />
          </div>

          {/* Interim transcript */}
          <div className="px-4 pb-3 min-h-[28px]">
            {interimTranscript ? (
              <p className={cn(
                'text-sm text-cyan-300 animate-pulse',
                isRTL && 'text-right'
              )} dir={isRTL ? 'rtl' : 'ltr'}>
                {interimTranscript}
              </p>
            ) : (
              <p className={cn(
                'text-xs text-surface-500',
                isRTL && 'text-right'
              )}>
                {t('chat.listening')}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* === NORMAL MODE: Text input === */
        <div
          className={cn(
            'flex items-end gap-3 p-3 sm:p-4 rounded-2xl border',
            'bg-surface-800/50 backdrop-blur-sm',
            'border-surface-700/50',
            'focus-within:ring-2 focus-within:ring-nexus-500/30 focus-within:border-nexus-500/50',
            'transition-all duration-300',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          {/* Voice Input Button + Language Selector */}
          {enableVoice && (
            <div className="relative" ref={languageMenuRef}>
              <button
                onClick={startListening}
                disabled={disabled}
                className={cn(
                  'flex-shrink-0 p-2.5 rounded-xl',
                  'transition-all duration-300',
                  'bg-surface-700 text-surface-400 hover:bg-surface-600 hover:text-surface-200'
                )}
                aria-label={t('chat.startVoice')}
                title={`${t('chat.startVoice')} (${currentLangInfo?.nativeName || 'Auto'})`}
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Language selector button */}
              <button
                onClick={() => setShowLanguageMenu(prev => !prev)}
                className={cn(
                  'absolute -bottom-1 -right-1 p-0.5 rounded-full text-[10px]',
                  'bg-surface-800 border border-surface-600',
                  'hover:bg-surface-700 transition-colors'
                )}
                title={t('chat.changeLanguage')}
              >
                {currentLangInfo?.flag || '🌐'}
              </button>

              {/* Language dropdown */}
              {showLanguageMenu && (
                <div className="absolute bottom-12 left-0 z-50 min-w-[180px] bg-surface-800 border border-surface-700 rounded-xl shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-surface-700 flex items-center gap-2 text-xs text-surface-400">
                    <Languages className="w-3 h-3" />
                    <span>{t('chat.voiceLanguage')}</span>
                  </div>
                  {VOICE_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                        'hover:bg-surface-700 transition-colors',
                        currentLanguage === lang.code
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'text-surface-300'
                      )}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                      {currentLanguage === lang.code && (
                        <span className="ml-auto text-cyan-400">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent',
              'text-surface-100',
              'placeholder:text-surface-500',
              'focus:outline-none',
              'disabled:cursor-not-allowed',
              'text-base leading-relaxed',
              'min-h-[24px] max-h-[200px]',
              'py-1 px-1',
              isRTL && 'text-right'
            )}
            aria-label="Chat message input"
            dir={isRTL ? 'rtl' : 'ltr'}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              'flex-shrink-0 p-2.5 rounded-xl',
              'transition-all duration-300',
              canSend
                ? 'bg-gradient-to-r from-nexus-500 to-accent-nexus-500 text-white hover:shadow-lg hover:shadow-nexus-500/30 hover:scale-105'
                : 'bg-surface-700 text-surface-500 cursor-not-allowed'
            )}
            aria-label={disabled ? t('chat.waitingForResponse') : t('chat.sendMessage')}
          >
            {disabled ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowUp className="w-5 h-5" />
            )}
          </button>
        </div>
      )}

      {/* Voice Error */}
      {voiceError && (
        <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
          <span>{voiceError}</span>
          <button onClick={clearError} className="hover:text-red-300">✕</button>
        </div>
      )}

      {/* Character Count */}
      {showCharacterCount && maxLength && (
        <div
          className={cn(
            'absolute -bottom-5 text-xs',
            isRTL ? 'left-3' : 'right-3',
            isOverLimit ? 'text-red-400' : 'text-surface-500'
          )}
        >
          {value.length}/{maxLength}
        </div>
      )}

      {/* Hint Text */}
      {!isListening && (
        <div className="mt-2 text-center">
          <span className="text-xs text-surface-500">
            {enableVoice && (
              <>
                <kbd className="px-1.5 py-0.5 rounded-md bg-surface-700/50 text-surface-400 font-mono text-[10px]">🎤</kbd>
                {' '}{t('chat.hintVoice')}{' • '}
              </>
            )}
            <kbd className="px-1.5 py-0.5 rounded-md bg-surface-700/50 text-surface-400 font-mono text-[10px]">Enter</kbd> {t('chat.hintSend')}{' • '}
            <kbd className="px-1.5 py-0.5 rounded-md bg-surface-700/50 text-surface-400 font-mono text-[10px]">Shift+Enter</kbd> {t('chat.hintNewline')}
          </span>
        </div>
      )}
    </div>
  )
}

export default ChatInput

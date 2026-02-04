/**
 * ChatInput Component
 *
 * Message input component with:
 * - Auto-expanding textarea
 * - Send button (arrow icon like ChatGPT)
 * - Voice input with GCC dialect support (Kuwaiti, Saudi, Egyptian Arabic)
 * - Enter to send, Shift+Enter for newline
 * - Optional character/token limit indicator
 * - Disabled state while AI is responding
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ArrowUp, Loader2, Mic, MicOff, Languages } from 'lucide-react'
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
  enableVoice?: boolean // Enable voice input (default: true)
  defaultLanguage?: VoiceLanguage // Default voice language (default: en-US)
}

// ============================================================================
// ChatInput Component
// ============================================================================

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Message Nexus...',
  maxLength,
  showCharacterCount = false,
  className,
  enableVoice = true,
  defaultLanguage = 'en-US',
}: ChatInputProps): React.ReactElement {
  const [value, setValue] = React.useState('')
  const [showLanguageMenu, setShowLanguageMenu] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

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
    autoDetectLanguage: true, // Auto-detect Arabic dialects
    matchResponseLanguage: true,
    autoClose: false, // Keep listening until user stops
    silenceTimeout: 5000, // 5 seconds of silence before auto-close
  })

  // Update text field when voice transcript changes
  React.useEffect(() => {
    if (transcript) {
      setValue(prev => {
        // If there's existing text, append with space
        if (prev.trim()) {
          return prev + ' ' + transcript
        }
        return transcript
      })
      clearTranscript()
    }
  }, [transcript, clearTranscript])

  const isEmpty = value.trim().length === 0
  const isOverLimit = maxLength ? value.length > maxLength : false
  const canSend = !disabled && !isEmpty && !isOverLimit

  // Get current language info
  const currentLangInfo = VOICE_LANGUAGES.find(l => l.code === currentLanguage)

  // Auto-resize textarea
  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    // Set to scrollHeight, max 200px
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

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [canSend, value, onSend])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter without Shift sends the message
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // Focus textarea on mount
  React.useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus()
    }
  }, [disabled])

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-end gap-3 p-3 sm:p-4 rounded-2xl border',
          'bg-surface-800/50 backdrop-blur-sm',
          isListening
            ? 'border-cyan-500/50 ring-2 ring-cyan-500/20'
            : 'border-surface-700/50',
          'focus-within:ring-2 focus-within:ring-nexus-500/30 focus-within:border-nexus-500/50',
          'transition-all duration-300',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        {/* Voice Input Button */}
        {enableVoice && (
          <div className="relative">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={disabled}
              className={cn(
                'flex-shrink-0 p-2.5 rounded-xl',
                'transition-all duration-300',
                isListening
                  ? 'bg-cyan-500 text-white animate-pulse'
                  : 'bg-surface-700 text-surface-400 hover:bg-surface-600 hover:text-surface-200'
              )}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              title={isListening ? 'Stop listening' : `Voice input (${currentLangInfo?.nativeName || 'Auto'})`}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Audio level indicator */}
            {isListening && (
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 bg-cyan-400 rounded-full transition-all"
                style={{ width: `${Math.max(20, audioLevel * 100)}%` }}
              />
            )}

            {/* Language selector button */}
            <button
              onClick={() => setShowLanguageMenu(prev => !prev)}
              className={cn(
                'absolute -bottom-1 -right-1 p-0.5 rounded-full text-[10px]',
                'bg-surface-800 border border-surface-600',
                'hover:bg-surface-700 transition-colors'
              )}
              title="Change language"
            >
              {currentLangInfo?.flag || '🌐'}
            </button>

            {/* Language dropdown */}
            {showLanguageMenu && (
              <div className="absolute bottom-12 left-0 z-50 min-w-[180px] bg-surface-800 border border-surface-700 rounded-xl shadow-lg overflow-hidden">
                <div className="p-2 border-b border-surface-700 flex items-center gap-2 text-xs text-surface-400">
                  <Languages className="w-3 h-3" />
                  <span>Voice Language</span>
                </div>
                {VOICE_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code)
                      setShowLanguageMenu(false)
                    }}
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
          placeholder={isListening
            ? (currentLanguage.startsWith('ar') ? 'أتحدث الآن... 🎤' : 'Listening... 🎤')
            : placeholder
          }
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
            currentLanguage.startsWith('ar') && 'text-right' // RTL for Arabic
          )}
          aria-label="Chat message input"
          dir={currentLanguage.startsWith('ar') ? 'rtl' : 'ltr'}
        />

        {/* Interim transcript indicator */}
        {interimTranscript && (
          <div className="absolute -top-8 left-0 right-0 text-center">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">
              {interimTranscript}
            </span>
          </div>
        )}

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
          aria-label={disabled ? 'Waiting for response' : 'Send message'}
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowUp className="w-5 h-5" />
          )}
        </button>
      </div>

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
            'absolute -bottom-5 right-3 text-xs',
            isOverLimit ? 'text-red-400' : 'text-surface-500'
          )}
        >
          {value.length}/{maxLength}
        </div>
      )}

      {/* Hint Text */}
      <div className="mt-2 text-center">
        <span className="text-xs text-surface-500">
          {enableVoice && (
            <>
              <kbd className="px-1.5 py-0.5 rounded-md bg-surface-700/50 text-surface-400 font-mono text-[10px]">🎤</kbd>
              {' '}for voice{' • '}
            </>
          )}
          <kbd className="px-1.5 py-0.5 rounded-md bg-surface-700/50 text-surface-400 font-mono text-[10px]">Enter</kbd> to send{' • '}
          <kbd className="px-1.5 py-0.5 rounded-md bg-surface-700/50 text-surface-400 font-mono text-[10px]">Shift+Enter</kbd> for new line
        </span>
      </div>
    </div>
  )
}

export default ChatInput

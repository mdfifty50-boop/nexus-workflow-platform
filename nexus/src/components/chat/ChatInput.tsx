/**
 * ChatInput Component
 *
 * Message input component with:
 * - Auto-expanding textarea
 * - Send button (arrow icon like ChatGPT)
 * - Enter to send, Shift+Enter for newline
 * - Optional character/token limit indicator
 * - Disabled state while AI is responding
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ArrowUp, Loader2 } from 'lucide-react'

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
}: ChatInputProps): React.ReactElement {
  const [value, setValue] = React.useState('')
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const isEmpty = value.trim().length === 0
  const isOverLimit = maxLength ? value.length > maxLength : false
  const canSend = !disabled && !isEmpty && !isOverLimit

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
          'border-surface-700/50',
          'focus-within:ring-2 focus-within:ring-nexus-500/30 focus-within:border-nexus-500/50',
          'transition-all duration-300',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
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
            'py-1 px-1'
          )}
          aria-label="Chat message input"
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
          aria-label={disabled ? 'Waiting for response' : 'Send message'}
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowUp className="w-5 h-5" />
          )}
        </button>
      </div>

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
          Press <kbd className="px-1.5 py-0.5 rounded-md bg-surface-700/50 text-surface-400 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded-md bg-surface-700/50 text-surface-400 font-mono text-[10px]">Shift+Enter</kbd> for new line
        </span>
      </div>
    </div>
  )
}

export default ChatInput

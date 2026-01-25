/**
 * MicButtonStates Component
 *
 * Visual feedback component for microphone button with multiple distinct states.
 * Provides clear visual distinction between idle, listening, processing, and error states.
 *
 * Features:
 * - Idle: Gray/muted mic icon, inactive appearance
 * - Listening: Pulsing red/active mic icon with animated rings
 * - Processing: Spinning indicator with processing state visual
 * - Error: Error state with retry prompt and warning colors
 * - Customizable size and styling
 * - Accessible with ARIA labels
 */

import { memo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Mic, Loader2, AlertCircle } from 'lucide-react'

export type MicButtonState = 'idle' | 'listening' | 'processing' | 'error'

export interface MicButtonStatesProps {
  /** Current state of the microphone button */
  state: MicButtonState
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Callback when retry is clicked (for error state) */
  onRetry?: () => void
  /** Error message to display */
  errorMessage?: string
  /** Custom class name */
  className?: string
  /** Disabled state */
  disabled?: boolean
  /** Click handler for the button */
  onClick?: () => void
}

// Size configurations
const SIZES = {
  sm: { button: 'h-8 w-8', icon: 16, ring: 'ring-4' },
  md: { button: 'h-10 w-10', icon: 20, ring: 'ring-4' },
  lg: { button: 'h-12 w-12', icon: 24, ring: 'ring-4' },
  xl: { button: 'h-14 w-14', icon: 28, ring: 'ring-4' }
}

/**
 * Idle state - gray/muted appearance
 */
const IdleButton = memo(function IdleButton({
  size,
  disabled,
  onClick,
  className
}: {
  size: typeof SIZES.md
  disabled?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex items-center justify-center rounded-full',
        'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700',
        'text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400',
        'transition-all duration-200 ease-in-out',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        size.button,
        className
      )}
      aria-label="Microphone - click to start recording"
      title="Click to start voice input"
    >
      <Mic size={size.icon} className="transition-transform duration-200" />
    </button>
  )
})

/**
 * Listening state - pulsing red with animated rings
 */
const ListeningButton = memo(function ListeningButton({
  size,
  disabled,
  onClick,
  className
}: {
  size: typeof SIZES.md
  disabled?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex items-center justify-center rounded-full',
        'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700',
        'text-white',
        'transition-all duration-200 ease-in-out',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        size.button,
        className
      )}
      aria-label="Microphone - currently listening"
      aria-live="polite"
      title="Recording in progress - click to stop"
    >
      {/* Outer pulsing ring */}
      <div
        className={cn(
          'absolute rounded-full',
          'border-2 border-red-400 dark:border-red-500',
          'animate-pulse'
        )}
        style={{
          width: 'calc(100% + 8px)',
          height: 'calc(100% + 8px)'
        }}
      />

      {/* Middle ring */}
      <div
        className={cn(
          'absolute rounded-full',
          'border-2 border-red-300 dark:border-red-400',
          'opacity-60'
        )}
        style={{
          width: 'calc(100% + 16px)',
          height: 'calc(100% + 16px)',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          animationDelay: '0.2s'
        }}
      />

      {/* Icon with pulse animation */}
      <Mic size={size.icon} className="relative z-10 animate-pulse" />
    </button>
  )
})

/**
 * Processing state - spinning loader indicator
 */
const ProcessingButton = memo(function ProcessingButton({
  size,
  disabled,
  onClick,
  className
}: {
  size: typeof SIZES.md
  disabled?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex items-center justify-center rounded-full',
        'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700',
        'text-white',
        'transition-all duration-200 ease-in-out',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        size.button,
        className
      )}
      aria-label="Microphone - processing audio"
      aria-live="polite"
      title="Processing audio input..."
    >
      {/* Outer animated ring */}
      <div
        className="absolute rounded-full border-2 border-blue-400 dark:border-blue-500"
        style={{
          width: 'calc(100% + 8px)',
          height: 'calc(100% + 8px)',
          animation: 'spin 2s linear infinite'
        }}
      />

      {/* Spinner icon with rotation */}
      <Loader2
        size={size.icon}
        className="relative z-10 animate-spin"
      />
    </button>
  )
})

/**
 * Error state - warning colors with retry option
 */
const ErrorButton = memo(function ErrorButton({
  size,
  disabled,
  onClick,
  onRetry,
  errorMessage,
  className
}: {
  size: typeof SIZES.md
  disabled?: boolean
  onClick?: () => void
  onRetry?: () => void
  errorMessage?: string
  className?: string
}) {
  const handleRetry = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onRetry?.()
    },
    [onRetry]
  )

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'relative flex items-center justify-center rounded-full',
          'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800',
          'text-white',
          'transition-all duration-200 ease-in-out',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'ring-2 ring-red-300 dark:ring-red-600',
          size.button
        )}
        aria-label="Microphone - error occurred"
        aria-live="assertive"
        title={errorMessage || 'Microphone error - click to retry'}
      >
        {/* Error glow effect */}
        <div
          className="absolute rounded-full bg-red-500 opacity-20"
          style={{
            width: 'calc(100% + 12px)',
            height: 'calc(100% + 12px)'
          }}
        />

        {/* Alert icon */}
        <AlertCircle
          size={size.icon}
          className="relative z-10 transition-transform duration-200 hover:scale-110"
        />
      </button>

      {/* Error message and retry button */}
      {errorMessage && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
            {errorMessage}
          </span>
          {onRetry && (
            <button
              onClick={handleRetry}
              className={cn(
                'text-xs px-2 py-1 rounded',
                'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800',
                'text-red-700 dark:text-red-300',
                'font-medium transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              disabled={disabled}
              title="Retry microphone access"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  )
})

/**
 * Main MicButtonStates component
 * Renders appropriate button based on current state
 */
export const MicButtonStates = memo(function MicButtonStates({
  state,
  size: sizeProp = 'md',
  onRetry,
  errorMessage,
  className,
  disabled,
  onClick
}: MicButtonStatesProps) {
  const size = SIZES[sizeProp]

  const buttonComponent = (() => {
    switch (state) {
      case 'listening':
        return (
          <ListeningButton
            size={size}
            disabled={disabled}
            onClick={onClick}
            className={className}
          />
        )
      case 'processing':
        return (
          <ProcessingButton
            size={size}
            disabled={disabled}
            onClick={onClick}
            className={className}
          />
        )
      case 'error':
        return (
          <ErrorButton
            size={size}
            disabled={disabled}
            onClick={onClick}
            onRetry={onRetry}
            errorMessage={errorMessage}
            className={className}
          />
        )
      case 'idle':
      default:
        return (
          <IdleButton
            size={size}
            disabled={disabled}
            onClick={onClick}
            className={className}
          />
        )
    }
  })()

  return <>{buttonComponent}</>
})

/**
 * Styled variants for easy usage in common patterns
 */
export const MicButtonVariants = {
  /**
   * Compact variant for toolbar integration
   */
  Compact: memo(function CompactMicButton({
    state,
    onRetry,
    onClick,
    disabled
  }: Omit<MicButtonStatesProps, 'size'>) {
    return (
      <MicButtonStates
        state={state}
        size="sm"
        onRetry={onRetry}
        onClick={onClick}
        disabled={disabled}
      />
    )
  }),

  /**
   * Standard variant for most use cases
   */
  Standard: memo(function StandardMicButton({
    state,
    onRetry,
    onClick,
    errorMessage,
    disabled
  }: Omit<MicButtonStatesProps, 'size'>) {
    return (
      <MicButtonStates
        state={state}
        size="md"
        onRetry={onRetry}
        onClick={onClick}
        errorMessage={errorMessage}
        disabled={disabled}
      />
    )
  }),

  /**
   * Large variant for prominent placement
   */
  Large: memo(function LargeMicButton({
    state,
    onRetry,
    onClick,
    errorMessage,
    disabled
  }: Omit<MicButtonStatesProps, 'size'>) {
    return (
      <MicButtonStates
        state={state}
        size="lg"
        onRetry={onRetry}
        onClick={onClick}
        errorMessage={errorMessage}
        disabled={disabled}
      />
    )
  })
}

export default MicButtonStates

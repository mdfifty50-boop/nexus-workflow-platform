/**
 * AudioWaveform Component
 *
 * Visual feedback component showing audio level during voice input.
 * Displays an animated waveform that responds to audio level changes.
 *
 * Features:
 * - Real-time audio level visualization
 * - Multiple display modes (bars, circle, wave)
 * - Customizable colors and sizes
 * - Listening indicator animation
 * - Accessible with ARIA labels
 */

import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Mic, MicOff } from 'lucide-react'

export type WaveformVariant = 'bars' | 'circle' | 'wave' | 'pulse'

export interface AudioWaveformProps {
  /** Current audio level (0-1) */
  audioLevel: number
  /** Whether the system is actively listening */
  isListening: boolean
  /** Visual variant */
  variant?: WaveformVariant
  /** Size of the component */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Primary color (Tailwind class or CSS color) */
  color?: string
  /** Secondary color for gradients */
  secondaryColor?: string
  /** Number of bars for bar variant */
  barCount?: number
  /** Show microphone icon */
  showIcon?: boolean
  /** Custom class name */
  className?: string
  /** Accessible label */
  ariaLabel?: string
}

// Size configurations
const SIZES = {
  sm: { height: 32, width: 48, iconSize: 16, barWidth: 3 },
  md: { height: 48, width: 72, iconSize: 20, barWidth: 4 },
  lg: { height: 64, width: 96, iconSize: 24, barWidth: 5 },
  xl: { height: 80, width: 120, iconSize: 32, barWidth: 6 }
}

/**
 * Bars variant - vertical bars that animate based on audio level
 */
const BarsWaveform = memo(function BarsWaveform({
  audioLevel,
  isListening,
  size,
  color,
  barCount
}: {
  audioLevel: number
  isListening: boolean
  size: typeof SIZES.md
  color: string
  barCount: number
}) {
  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      // Create variation in bar heights based on position
      const positionFactor = Math.sin((i / barCount) * Math.PI) * 0.5 + 0.5
      const randomFactor = Math.sin(i * 1.5 + Date.now() / 500) * 0.2 + 0.8
      const height = isListening
        ? Math.max(0.1, audioLevel * positionFactor * randomFactor)
        : 0.1
      return height
    })
  }, [audioLevel, isListening, barCount])

  return (
    <div
      className="flex items-center justify-center gap-0.5"
      style={{ height: size.height, width: size.width }}
    >
      {bars.map((height, index) => (
        <div
          key={index}
          className={cn(
            'rounded-full transition-all duration-75',
            color
          )}
          style={{
            width: size.barWidth,
            height: `${Math.max(4, height * size.height)}px`,
            opacity: isListening ? 0.7 + height * 0.3 : 0.3
          }}
        />
      ))}
    </div>
  )
})

/**
 * Circle variant - pulsing circle that expands based on audio level
 */
const CircleWaveform = memo(function CircleWaveform({
  audioLevel,
  isListening,
  size,
  color,
  secondaryColor
}: {
  audioLevel: number
  isListening: boolean
  size: typeof SIZES.md
  color: string
  secondaryColor: string
}) {
  const baseSize = size.height * 0.6
  const pulseScale = isListening ? 1 + audioLevel * 0.4 : 1

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ height: size.height, width: size.height }}
    >
      {/* Outer pulse ring */}
      <div
        className={cn(
          'absolute rounded-full transition-all duration-150',
          secondaryColor
        )}
        style={{
          width: baseSize * pulseScale * 1.3,
          height: baseSize * pulseScale * 1.3,
          opacity: isListening ? 0.2 + audioLevel * 0.2 : 0.1
        }}
      />
      {/* Middle ring */}
      <div
        className={cn(
          'absolute rounded-full transition-all duration-100',
          secondaryColor
        )}
        style={{
          width: baseSize * pulseScale * 1.15,
          height: baseSize * pulseScale * 1.15,
          opacity: isListening ? 0.3 + audioLevel * 0.2 : 0.15
        }}
      />
      {/* Inner circle */}
      <div
        className={cn(
          'rounded-full transition-all duration-75',
          color
        )}
        style={{
          width: baseSize * pulseScale,
          height: baseSize * pulseScale,
          opacity: isListening ? 0.8 + audioLevel * 0.2 : 0.4
        }}
      />
    </div>
  )
})

/**
 * Wave variant - animated sine wave
 */
const WaveWaveform = memo(function WaveWaveform({
  audioLevel,
  isListening,
  size,
  color
}: {
  audioLevel: number
  isListening: boolean
  size: typeof SIZES.md
  color: string
}) {
  const points = useMemo(() => {
    const pointCount = 20
    const amplitude = isListening ? audioLevel * (size.height * 0.35) : 2
    const centerY = size.height / 2

    return Array.from({ length: pointCount }, (_, i) => {
      const x = (i / (pointCount - 1)) * size.width
      const phase = (Date.now() / 200 + i * 0.3) % (Math.PI * 2)
      const y = centerY + Math.sin(phase) * amplitude
      return `${x},${y}`
    }).join(' ')
  }, [audioLevel, isListening, size.height, size.width])

  return (
    <svg
      width={size.width}
      height={size.height}
      className="overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        className={cn('transition-all duration-75', color.replace('bg-', 'stroke-'))}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: isListening ? 0.8 : 0.3 }}
      />
    </svg>
  )
})

/**
 * Pulse variant - simple pulsing dot
 */
const PulseWaveform = memo(function PulseWaveform({
  audioLevel,
  isListening,
  size,
  color
}: {
  audioLevel: number
  isListening: boolean
  size: typeof SIZES.md
  color: string
}) {
  const dotSize = size.height * 0.3
  const scale = isListening ? 1 + audioLevel * 0.5 : 1

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ height: size.height, width: size.height }}
    >
      {/* Pulsing ring animation */}
      {isListening && (
        <div
          className={cn(
            'absolute rounded-full animate-ping',
            color
          )}
          style={{
            width: dotSize * scale,
            height: dotSize * scale,
            opacity: 0.3
          }}
        />
      )}
      {/* Main dot */}
      <div
        className={cn(
          'rounded-full transition-transform duration-75',
          color
        )}
        style={{
          width: dotSize * scale,
          height: dotSize * scale,
          opacity: isListening ? 1 : 0.5
        }}
      />
    </div>
  )
})

/**
 * Main AudioWaveform component
 */
export const AudioWaveform = memo(function AudioWaveform({
  audioLevel,
  isListening,
  variant = 'bars',
  size: sizeProp = 'md',
  color = 'bg-primary',
  secondaryColor = 'bg-primary/30',
  barCount = 5,
  showIcon = true,
  className,
  ariaLabel
}: AudioWaveformProps) {
  const size = SIZES[sizeProp]

  const waveformComponent = useMemo(() => {
    switch (variant) {
      case 'circle':
        return (
          <CircleWaveform
            audioLevel={audioLevel}
            isListening={isListening}
            size={size}
            color={color}
            secondaryColor={secondaryColor}
          />
        )
      case 'wave':
        return (
          <WaveWaveform
            audioLevel={audioLevel}
            isListening={isListening}
            size={size}
            color={color}
          />
        )
      case 'pulse':
        return (
          <PulseWaveform
            audioLevel={audioLevel}
            isListening={isListening}
            size={size}
            color={color}
          />
        )
      case 'bars':
      default:
        return (
          <BarsWaveform
            audioLevel={audioLevel}
            isListening={isListening}
            size={size}
            color={color}
            barCount={barCount}
          />
        )
    }
  }, [variant, audioLevel, isListening, size, color, secondaryColor, barCount])

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        className
      )}
      role="img"
      aria-label={ariaLabel || (isListening ? 'Listening for voice input' : 'Voice input inactive')}
      aria-live="polite"
    >
      {showIcon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full transition-colors',
            isListening ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {isListening ? (
            <Mic size={size.iconSize} className="animate-pulse" />
          ) : (
            <MicOff size={size.iconSize} />
          )}
        </div>
      )}
      {waveformComponent}
    </div>
  )
})

/**
 * Listening indicator - simpler component for showing listening state
 */
export const ListeningIndicator = memo(function ListeningIndicator({
  isListening,
  size = 'md',
  className
}: {
  isListening: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const dotSize = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }[size]

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        className
      )}
      aria-live="polite"
    >
      <span
        className={cn(
          'rounded-full transition-colors',
          dotSize,
          isListening ? 'bg-red-500 animate-pulse' : 'bg-muted'
        )}
      />
      <span className="text-xs text-muted-foreground">
        {isListening ? 'Listening...' : 'Not listening'}
      </span>
    </div>
  )
})

/**
 * Compact voice status indicator
 */
export const VoiceStatusBadge = memo(function VoiceStatusBadge({
  isListening,
  isSpeaking,
  className
}: {
  isListening: boolean
  isSpeaking: boolean
  className?: string
}) {
  const status = isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle'

  const statusConfig = {
    idle: { label: 'Voice Off', color: 'bg-muted text-muted-foreground' },
    listening: { label: 'Listening', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    speaking: { label: 'Speaking', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' }
  }[status]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors',
        statusConfig.color,
        className
      )}
      aria-live="polite"
    >
      {status === 'listening' && (
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      )}
      {status === 'speaking' && (
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
      )}
      {statusConfig.label}
    </div>
  )
})

export default AudioWaveform

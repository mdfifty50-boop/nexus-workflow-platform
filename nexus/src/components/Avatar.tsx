/**
 * Nexus Speaking Avatar Component
 * @NEXUS-FIX-090: Role-based animated avatar system
 *
 * Features:
 * - Role-based appearances (lawyer, doctor, SME, default)
 * - Animation states (idle, listening, thinking, speaking)
 * - Lip-sync animation during TTS playback
 * - Responsive sizing
 * - RTL support
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Avatar role types
export type AvatarRole = 'default' | 'lawyer' | 'doctor' | 'sme' | 'receptionist' | 'assistant'

// Animation states
export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'celebrating'

// Avatar size variants
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

// Avatar configuration by role
const AVATAR_CONFIG: Record<AvatarRole, {
  name: string
  title: string
  colors: {
    primary: string
    secondary: string
    accent: string
    glow: string
  }
  emoji: string
  description: string
}> = {
  default: {
    name: 'Nexus',
    title: 'AI Assistant',
    colors: {
      primary: '#0ea5e9', // cyan-500
      secondary: '#8b5cf6', // violet-500
      accent: '#22d3ee', // cyan-400
      glow: 'rgba(14, 165, 233, 0.3)'
    },
    emoji: '🤖',
    description: 'Your intelligent workflow assistant'
  },
  lawyer: {
    name: 'Legal Nexus',
    title: 'Legal Assistant',
    colors: {
      primary: '#1e40af', // blue-800
      secondary: '#6366f1', // indigo-500
      accent: '#fbbf24', // amber-400 (gold accents)
      glow: 'rgba(30, 64, 175, 0.3)'
    },
    emoji: '⚖️',
    description: 'Your legal workflow specialist'
  },
  doctor: {
    name: 'Medical Nexus',
    title: 'Healthcare Assistant',
    colors: {
      primary: '#059669', // emerald-600
      secondary: '#10b981', // emerald-500
      accent: '#f472b6', // pink-400 (medical accent)
      glow: 'rgba(5, 150, 105, 0.3)'
    },
    emoji: '🩺',
    description: 'Your healthcare workflow specialist'
  },
  sme: {
    name: 'Business Nexus',
    title: 'Business Assistant',
    colors: {
      primary: '#ea580c', // orange-600
      secondary: '#f97316', // orange-500
      accent: '#facc15', // yellow-400
      glow: 'rgba(234, 88, 12, 0.3)'
    },
    emoji: '💼',
    description: 'Your business growth specialist'
  },
  receptionist: {
    name: 'Welcome Nexus',
    title: 'Virtual Receptionist',
    colors: {
      primary: '#7c3aed', // violet-600
      secondary: '#a78bfa', // violet-400
      accent: '#f472b6', // pink-400
      glow: 'rgba(124, 58, 237, 0.3)'
    },
    emoji: '👋',
    description: 'Your friendly greeter'
  },
  assistant: {
    name: 'Personal Nexus',
    title: 'Personal Assistant',
    colors: {
      primary: '#0891b2', // cyan-600
      secondary: '#06b6d4', // cyan-500
      accent: '#a855f7', // purple-500
      glow: 'rgba(8, 145, 178, 0.3)'
    },
    emoji: '✨',
    description: 'Your personal productivity partner'
  }
}

// Size configurations
const SIZE_CONFIG: Record<AvatarSize, {
  container: string
  avatar: string
  icon: string
  ring: string
  text: string
}> = {
  sm: {
    container: 'w-12 h-12',
    avatar: 'w-10 h-10',
    icon: 'text-lg',
    ring: 'ring-2',
    text: 'text-xs'
  },
  md: {
    container: 'w-20 h-20',
    avatar: 'w-16 h-16',
    icon: 'text-2xl',
    ring: 'ring-3',
    text: 'text-sm'
  },
  lg: {
    container: 'w-32 h-32',
    avatar: 'w-28 h-28',
    icon: 'text-4xl',
    ring: 'ring-4',
    text: 'text-base'
  },
  xl: {
    container: 'w-48 h-48',
    avatar: 'w-40 h-40',
    icon: 'text-6xl',
    ring: 'ring-4',
    text: 'text-lg'
  }
}

// Animation variants - using type-safe ease values
const containerVariants = {
  idle: {
    scale: 1,
    transition: { duration: 0.3 }
  },
  listening: {
    scale: [1, 1.02, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const }
  },
  thinking: {
    scale: [1, 0.98, 1.02, 1],
    rotate: [0, -2, 2, 0],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const }
  },
  speaking: {
    scale: [1, 1.03, 1.01, 1.04, 1],
    transition: { duration: 0.3, repeat: Infinity, ease: "easeInOut" as const }
  },
  celebrating: {
    scale: [1, 1.1, 1],
    rotate: [0, -5, 5, 0],
    transition: { duration: 0.5, repeat: 3 }
  }
}

const glowVariants = {
  idle: {
    opacity: 0.3,
    scale: 1
  },
  listening: {
    opacity: [0.3, 0.6, 0.3],
    scale: [1, 1.1, 1],
    transition: { duration: 1.5, repeat: Infinity }
  },
  thinking: {
    opacity: [0.3, 0.5, 0.3],
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity }
  },
  speaking: {
    opacity: [0.4, 0.7, 0.4],
    scale: [1, 1.15, 1],
    transition: { duration: 0.4, repeat: Infinity }
  },
  celebrating: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.2, 1],
    transition: { duration: 0.5, repeat: 3 }
  }
}

const eyeVariants = {
  idle: {
    scaleY: 1
  },
  blink: {
    scaleY: [1, 0.1, 1],
    transition: { duration: 0.15 }
  },
  listening: {
    scaleY: 1.1,
    transition: { duration: 0.3 }
  },
  thinking: {
    scaleY: 0.8,
    transition: { duration: 0.3 }
  },
  speaking: {
    scaleY: 1
  }
}

const mouthVariants = {
  idle: {
    scaleY: 1,
    scaleX: 1
  },
  speaking: {
    scaleY: [1, 1.3, 0.8, 1.5, 1],
    scaleX: [1, 0.9, 1.1, 0.95, 1],
    transition: { duration: 0.25, repeat: Infinity }
  },
  smiling: {
    scaleY: 0.7,
    scaleX: 1.2
  }
}

interface AvatarProps {
  role?: AvatarRole
  state?: AvatarState
  size?: AvatarSize
  showName?: boolean
  showTitle?: boolean
  onClick?: () => void
  className?: string
  // For lip-sync
  audioLevel?: number // 0-1
  isSpeaking?: boolean
}

export const Avatar: React.FC<AvatarProps> = ({
  role = 'default',
  state = 'idle',
  size = 'md',
  showName = false,
  showTitle = false,
  onClick,
  className = '',
  audioLevel = 0,
  isSpeaking = false
}) => {
  const config = AVATAR_CONFIG[role]
  const sizeConfig = SIZE_CONFIG[size]
  const [isBlinking, setIsBlinking] = useState(false)
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Determine actual state based on audio
  const actualState = isSpeaking ? 'speaking' : state

  // Random blinking effect
  useEffect(() => {
    const startBlink = () => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 150)
    }

    // Blink every 3-6 seconds
    const scheduleBlink = () => {
      const delay = 3000 + Math.random() * 3000
      blinkIntervalRef.current = setTimeout(() => {
        startBlink()
        scheduleBlink()
      }, delay)
    }

    scheduleBlink()

    return () => {
      if (blinkIntervalRef.current) {
        clearTimeout(blinkIntervalRef.current)
      }
    }
  }, [])

  // State indicator text
  const getStateText = () => {
    switch (actualState) {
      case 'listening': return 'Listening...'
      case 'thinking': return 'Thinking...'
      case 'speaking': return 'Speaking...'
      case 'celebrating': return '🎉'
      default: return ''
    }
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Avatar container */}
      <motion.div
        className={`relative ${sizeConfig.container} cursor-pointer`}
        variants={containerVariants}
        animate={actualState}
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Glow effect */}
        <motion.div
          className={`absolute inset-0 rounded-full blur-xl`}
          style={{ backgroundColor: config.colors.glow }}
          variants={glowVariants}
          animate={actualState}
        />

        {/* Outer ring */}
        <motion.div
          className={`absolute inset-0 rounded-full ${sizeConfig.ring}`}
          style={{
            background: `linear-gradient(135deg, ${config.colors.primary}, ${config.colors.secondary})`,
            padding: '3px'
          }}
          animate={{
            rotate: actualState === 'thinking' ? 360 : 0
          }}
          transition={{
            duration: actualState === 'thinking' ? 3 : 0,
            repeat: actualState === 'thinking' ? Infinity : 0,
            ease: 'linear' as const
          }}
        >
          <div className="w-full h-full rounded-full bg-slate-900" />
        </motion.div>

        {/* Avatar face */}
        <motion.div
          className={`absolute inset-2 rounded-full flex items-center justify-center overflow-hidden`}
          style={{
            background: `linear-gradient(145deg, ${config.colors.primary}20, ${config.colors.secondary}20)`
          }}
        >
          {/* Face container */}
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Eyes */}
            <div className="flex gap-3 mb-1">
              <motion.div
                className="w-2 h-2 rounded-full bg-white"
                variants={eyeVariants}
                animate={isBlinking ? 'blink' : actualState}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-white"
                variants={eyeVariants}
                animate={isBlinking ? 'blink' : actualState}
              />
            </div>

            {/* Mouth */}
            <motion.div
              className="w-4 h-2 rounded-full bg-white mt-1"
              variants={mouthVariants}
              animate={actualState === 'speaking' ? 'speaking' : actualState === 'celebrating' ? 'smiling' : 'idle'}
              style={{
                originY: 0.5,
                scaleY: actualState === 'speaking' ? 1 + (audioLevel * 0.5) : 1
              }}
            />
          </div>
        </motion.div>

        {/* State indicator (for listening/thinking) */}
        <AnimatePresence>
          {actualState !== 'idle' && actualState !== 'celebrating' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: config.colors.accent }}
                  animate={{
                    y: [0, -4, 0],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.15,
                    repeat: Infinity
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Name and title */}
      {(showName || showTitle) && (
        <div className="text-center">
          {showName && (
            <motion.p
              className={`font-semibold text-white ${sizeConfig.text}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {config.name}
            </motion.p>
          )}
          {showTitle && (
            <motion.p
              className={`text-slate-400 ${size === 'sm' ? 'text-xs' : 'text-xs'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {config.title}
            </motion.p>
          )}
          {/* State indicator text */}
          <AnimatePresence>
            {getStateText() && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs mt-1"
                style={{ color: config.colors.accent }}
              >
                {getStateText()}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// Avatar with auto role detection based on context
interface SmartAvatarProps extends Omit<AvatarProps, 'role'> {
  userIndustry?: string
  context?: string
}

export const SmartAvatar: React.FC<SmartAvatarProps> = ({
  userIndustry,
  context,
  ...props
}) => {
  const detectRole = (): AvatarRole => {
    const industry = userIndustry?.toLowerCase() || ''
    const ctx = context?.toLowerCase() || ''

    if (industry.includes('law') || industry.includes('legal') || ctx.includes('legal')) {
      return 'lawyer'
    }
    if (industry.includes('health') || industry.includes('medical') || industry.includes('clinic') || ctx.includes('doctor')) {
      return 'doctor'
    }
    if (industry.includes('business') || industry.includes('retail') || industry.includes('restaurant')) {
      return 'sme'
    }
    if (ctx.includes('greeting') || ctx.includes('welcome')) {
      return 'receptionist'
    }

    return 'default'
  }

  return <Avatar role={detectRole()} {...props} />
}

// Floating avatar for chat interface
interface FloatingAvatarProps {
  role?: AvatarRole
  state?: AvatarState
  message?: string
  position?: 'left' | 'right'
  onDismiss?: () => void
}

export const FloatingAvatar: React.FC<FloatingAvatarProps> = ({
  role = 'default',
  state = 'idle',
  message,
  position = 'right',
  onDismiss
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: position === 'right' ? 50 : -50, y: 50 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: position === 'right' ? 50 : -50, y: 50 }}
      className={`fixed bottom-24 ${position === 'right' ? 'right-6' : 'left-6'} z-50 flex items-end gap-3 ${position === 'left' ? 'flex-row-reverse' : ''}`}
    >
      {/* Speech bubble */}
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`max-w-xs p-3 rounded-2xl bg-slate-800 border border-slate-700 shadow-lg ${
            position === 'right' ? 'rounded-br-sm' : 'rounded-bl-sm'
          }`}
        >
          <p className="text-sm text-white">{message}</p>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
            >
              ×
            </button>
          )}
        </motion.div>
      )}

      {/* Avatar */}
      <Avatar role={role} state={state} size="md" />
    </motion.div>
  )
}

export default Avatar

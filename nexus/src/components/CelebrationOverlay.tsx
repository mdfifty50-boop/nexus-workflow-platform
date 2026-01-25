import { useState, useEffect, useCallback, useRef } from 'react'

// Types
interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  shape: 'circle' | 'square' | 'star' | 'heart' | 'ribbon'
  opacity: number
}

interface CelebrationOverlayProps {
  /** Whether the celebration is active */
  show: boolean
  /** Callback when celebration animation completes */
  onComplete?: () => void
  /** Duration in milliseconds (default: 4000) */
  duration?: number
  /** Number of particles (default: 150) */
  particleCount?: number
  /** Celebration type affects colors and animations */
  type?: 'success' | 'achievement' | 'milestone' | 'workflow-complete'
  /** Optional message to display */
  message?: string
  /** Optional sub-message */
  subMessage?: string
}

// Color palettes for different celebration types
const COLOR_PALETTES = {
  success: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#22C55E', '#4ADE80'],
  achievement: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#EAB308', '#FACC15'],
  milestone: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#7C3AED', '#9333EA'],
  'workflow-complete': ['#06B6D4', '#22D3EE', '#67E8F9', '#A5F3FC', '#0891B2', '#14B8A6']
}

// Emoji burst for different types
const TYPE_EMOJIS = {
  success: ['🎉', '✨', '🌟', '💫'],
  achievement: ['🏆', '🥇', '⭐', '🎖️'],
  milestone: ['🚀', '🎯', '💎', '🔥'],
  'workflow-complete': ['✅', '🎊', '🙌', '💪']
}

const SHAPES = ['circle', 'square', 'star', 'heart', 'ribbon'] as const

export function CelebrationOverlay({
  show,
  onComplete,
  duration = 4000,
  particleCount = 150,
  type = 'success',
  message,
  subMessage
}: CelebrationOverlayProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [showEmojiBurst, setShowEmojiBurst] = useState(false)
  const [emojiPositions, setEmojiPositions] = useState<Array<{ x: number; y: number; emoji: string; delay: number }>>([])
  const animationFrameRef = useRef<number | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const colors = COLOR_PALETTES[type]
  const emojis = TYPE_EMOJIS[type]

  // Create particles
  const createParticles = useCallback(() => {
    const newParticles: Particle[] = []
    const width = window.innerWidth
    const height = window.innerHeight

    for (let i = 0; i < particleCount; i++) {
      // Cannon burst from bottom center
      const angle = (Math.random() * 120 - 60) * (Math.PI / 180) // -60 to 60 degrees
      const velocity = 8 + Math.random() * 12

      newParticles.push({
        id: i,
        x: width / 2 + (Math.random() - 0.5) * 200,
        y: height + 20,
        vx: Math.sin(angle) * velocity,
        vy: -Math.cos(angle) * velocity - Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 10,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        opacity: 1
      })
    }

    // Add emoji positions
    const newEmojiPositions = []
    for (let i = 0; i < 8; i++) {
      newEmojiPositions.push({
        x: 20 + Math.random() * 60,
        y: 30 + Math.random() * 40,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        delay: i * 100
      })
    }
    setEmojiPositions(newEmojiPositions)

    return newParticles
  }, [particleCount, colors, emojis])

  // Animate particles
  useEffect(() => {
    if (!isVisible || particles.length === 0) return

    const animate = () => {
      setParticles(prev => {
        const updated = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.3, // gravity
          vx: p.vx * 0.99, // air resistance
          rotation: p.rotation + p.rotationSpeed,
          opacity: Math.max(0, p.opacity - 0.003)
        })).filter(p => p.y < window.innerHeight + 100 && p.opacity > 0)

        return updated
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isVisible, particles.length])

  // Handle show/hide
  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setParticles(createParticles())
      setShowEmojiBurst(true)

      // Hide emoji burst after animation
      const emojiTimer = setTimeout(() => {
        setShowEmojiBurst(false)
      }, 2000)

      // Complete after duration
      const completeTimer = setTimeout(() => {
        setIsVisible(false)
        setParticles([])
        onComplete?.()
      }, duration)

      return () => {
        clearTimeout(emojiTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [show, duration, createParticles, onComplete])

  // Render particle shapes
  const renderParticle = (p: Particle) => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: p.x,
      top: p.y,
      width: p.size,
      height: p.size,
      transform: `rotate(${p.rotation}deg)`,
      opacity: p.opacity,
      pointerEvents: 'none'
    }

    switch (p.shape) {
      case 'circle':
        return (
          <div
            key={p.id}
            style={{
              ...baseStyle,
              backgroundColor: p.color,
              borderRadius: '50%'
            }}
          />
        )
      case 'square':
        return (
          <div
            key={p.id}
            style={{
              ...baseStyle,
              backgroundColor: p.color,
              borderRadius: '2px'
            }}
          />
        )
      case 'star':
        return (
          <div
            key={p.id}
            style={{
              ...baseStyle,
              backgroundColor: p.color,
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
            }}
          />
        )
      case 'heart':
        return (
          <div
            key={p.id}
            style={{
              ...baseStyle,
              backgroundColor: p.color,
              clipPath: 'path("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z")',
              transform: `rotate(${p.rotation}deg) scale(${p.size / 24})`
            }}
          />
        )
      case 'ribbon':
        return (
          <div
            key={p.id}
            style={{
              ...baseStyle,
              width: p.size * 0.3,
              height: p.size * 1.5,
              backgroundColor: p.color,
              borderRadius: '2px'
            }}
          />
        )
      default:
        return null
    }
  }

  if (!isVisible) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
      aria-live="polite"
      aria-label="Celebration animation"
    >
      {/* Backdrop glow effect */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 100%, ${colors[0]}20 0%, transparent 50%)`,
          opacity: particles.length > 0 ? 1 : 0
        }}
      />

      {/* Particles */}
      {particles.map(p => renderParticle(p))}

      {/* Emoji burst */}
      {showEmojiBurst && emojiPositions.map((pos, i) => (
        <div
          key={i}
          className="absolute text-4xl sm:text-5xl"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            animation: `celebrationEmojiBurst 1s ease-out ${pos.delay}ms forwards`,
            opacity: 0
          }}
        >
          {pos.emoji}
        </div>
      ))}

      {/* Center message */}
      {(message || subMessage) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="text-center px-8 py-6 rounded-2xl"
            style={{
              animation: 'celebrationMessagePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {message && (
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">
                {message}
              </h2>
            )}
            {subMessage && (
              <p className="text-base sm:text-lg text-white/80">
                {subMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes celebrationEmojiBurst {
          0% {
            opacity: 0;
            transform: scale(0) translateY(20px);
          }
          50% {
            opacity: 1;
            transform: scale(1.3) translateY(-10px);
          }
          100% {
            opacity: 0;
            transform: scale(1) translateY(-30px);
          }
        }

        @keyframes celebrationMessagePop {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// Hook for easy celebration triggering
export function useCelebration() {
  const [state, setState] = useState<{
    show: boolean
    type: CelebrationOverlayProps['type']
    message?: string
    subMessage?: string
  }>({
    show: false,
    type: 'success'
  })

  const celebrate = useCallback((options?: {
    type?: CelebrationOverlayProps['type']
    message?: string
    subMessage?: string
  }) => {
    setState({
      show: true,
      type: options?.type || 'success',
      message: options?.message,
      subMessage: options?.subMessage
    })
  }, [])

  const onComplete = useCallback(() => {
    setState(prev => ({ ...prev, show: false }))
  }, [])

  return {
    ...state,
    celebrate,
    onComplete
  }
}

// Workflow completion celebration shortcut
export function celebrateWorkflowCompletion(workflowName?: string) {
  // This will be called from anywhere to trigger celebration
  const event = new CustomEvent('nexus-celebration', {
    detail: {
      type: 'workflow-complete',
      message: 'Workflow Complete!',
      subMessage: workflowName ? `"${workflowName}" finished successfully` : 'Your workflow finished successfully'
    }
  })
  window.dispatchEvent(event)
}

// Global celebration listener component
export function GlobalCelebrationListener() {
  const { show, type, message, subMessage, celebrate, onComplete } = useCelebration()

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      celebrate(event.detail)
    }

    window.addEventListener('nexus-celebration', handler as EventListener)
    return () => {
      window.removeEventListener('nexus-celebration', handler as EventListener)
    }
  }, [celebrate])

  return (
    <CelebrationOverlay
      show={show}
      type={type}
      message={message}
      subMessage={subMessage}
      onComplete={onComplete}
    />
  )
}

export default CelebrationOverlay

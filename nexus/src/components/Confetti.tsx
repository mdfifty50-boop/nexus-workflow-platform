import { useState, useEffect, useCallback } from 'react'

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
  shape: 'circle' | 'square' | 'star'
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

const SHAPES = ['circle', 'square', 'star'] as const

interface ConfettiProps {
  trigger?: boolean
  duration?: number
  particleCount?: number
  onComplete?: () => void
}

export function Confetti({
  trigger = false,
  duration = 3000,
  particleCount = 100,
  onComplete
}: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [isActive, setIsActive] = useState(false)

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = []
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 10 + 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)]
      })
    }
    return newParticles
  }, [particleCount])

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true)
      setParticles(createParticles())

      const timeout = setTimeout(() => {
        setIsActive(false)
        setParticles([])
        onComplete?.()
      }, duration)

      return () => clearTimeout(timeout)
    }
  }, [trigger, duration, createParticles, onComplete, isActive])

  useEffect(() => {
    if (!isActive || particles.length === 0) return

    const animationFrame = requestAnimationFrame(function animate() {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.1, // gravity
        rotation: p.rotation + p.rotationSpeed
      })).filter(p => p.y < window.innerHeight + 50))

      if (isActive) {
        requestAnimationFrame(animate)
      }
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [isActive, particles.length])

  if (!isActive || particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.shape !== 'star' ? p.color : 'transparent',
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'star' ? '0' : '2px',
            transform: `rotate(${p.rotation}deg)`,
            clipPath: p.shape === 'star'
              ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
              : undefined,
            background: p.shape === 'star' ? p.color : undefined,
          }}
        />
      ))}
    </div>
  )
}

// Hook to trigger confetti
export function useConfetti() {
  const [showConfetti, setShowConfetti] = useState(false)

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true)
  }, [])

  const handleComplete = useCallback(() => {
    setShowConfetti(false)
  }, [])

  return { showConfetti, triggerConfetti, handleComplete }
}

// Global confetti trigger
let globalTrigger: (() => void) | null = null

export function setGlobalConfettiTrigger(trigger: () => void) {
  globalTrigger = trigger
}

export function triggerGlobalConfetti() {
  globalTrigger?.()
}

// Success celebration with sound effect option
export function SuccessCelebration({ trigger = false }: { trigger?: boolean }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (trigger) {
      setShow(true)
    }
  }, [trigger])

  if (!show) return null

  return (
    <>
      <Confetti trigger={show} onComplete={() => setShow(false)} />
      <div className="fixed inset-0 pointer-events-none z-[9998] flex items-center justify-center">
        <div className="animate-bounce-in text-6xl">
          🎉
        </div>
      </div>
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out forwards;
        }
      `}</style>
    </>
  )
}

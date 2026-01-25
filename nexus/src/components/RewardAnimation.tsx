import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

// Types
export type RewardType = 'badge' | 'milestone' | 'streak' | 'levelup' | 'achievement'

export interface RewardConfig {
  type: RewardType
  title: string
  subtitle?: string
  icon: string
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  reward?: string
}

// Confetti particle system
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
  shape: 'circle' | 'square' | 'star' | 'ribbon'
}

const CONFETTI_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#FFD700', '#FF69B4', '#00CED1', '#FF4500', '#7B68EE',
]

const TIER_GLOW = {
  bronze: 'shadow-amber-500/50',
  silver: 'shadow-slate-400/50',
  gold: 'shadow-yellow-400/60',
  platinum: 'shadow-cyan-400/60',
  diamond: 'shadow-purple-400/60',
}

const TIER_GRADIENT = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-slate-400 to-slate-600',
  gold: 'from-yellow-400 to-amber-600',
  platinum: 'from-cyan-400 to-slate-400',
  diamond: 'from-purple-400 via-pink-400 to-cyan-400',
}

// Confetti component
function ConfettiEffect({ duration = 3000, particleCount = 80 }: { duration?: number; particleCount?: number }) {
  const [particles, setParticles] = useState<Particle[]>([])
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    // Create particles
    const shapes = ['circle', 'square', 'star', 'ribbon'] as const
    const newParticles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 15 - 5,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 12 + 6,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      })
    }

    setParticles(newParticles)

    // Animation loop
    const animate = () => {
      setParticles(prev =>
        prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.3, // gravity
          vx: p.vx * 0.99, // air resistance
          rotation: p.rotation + p.rotationSpeed,
        })).filter(p => p.y < window.innerHeight + 100)
      )
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    // Cleanup
    const timeout = setTimeout(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }, duration)

    return () => {
      clearTimeout(timeout)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [duration, particleCount])

  return (
    <div className="fixed inset-0 pointer-events-none z-[10001] overflow-hidden">
      {particles.map(p => {
        let style: React.CSSProperties = {
          position: 'absolute',
          left: p.x,
          top: p.y,
          width: p.size,
          height: p.size,
          backgroundColor: p.color,
          transform: `rotate(${p.rotation}deg)`,
        }

        if (p.shape === 'circle') {
          style.borderRadius = '50%'
        } else if (p.shape === 'star') {
          style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
        } else if (p.shape === 'ribbon') {
          style.width = p.size * 0.3
          style.height = p.size * 2
          style.borderRadius = '2px'
        } else {
          style.borderRadius = '2px'
        }

        return <div key={p.id} style={style} />
      })}
    </div>
  )
}

// Badge unlock animation
interface BadgeUnlockProps {
  icon: string
  title: string
  subtitle?: string
  tier?: keyof typeof TIER_GRADIENT
  onComplete?: () => void
}

function BadgeUnlockAnimation({ icon, title, subtitle, tier = 'gold', onComplete }: BadgeUnlockProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter')

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('show'), 100)
    const exitTimer = setTimeout(() => setPhase('exit'), 3500)
    const completeTimer = setTimeout(() => onComplete?.(), 4000)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div className={`
        absolute inset-0 bg-black transition-opacity duration-500
        ${phase === 'enter' ? 'opacity-0' : phase === 'show' ? 'opacity-70' : 'opacity-0'}
      `} />

      {/* Badge container */}
      <div className={`
        relative transition-all duration-700 ease-out
        ${phase === 'enter' ? 'scale-0 opacity-0' : phase === 'show' ? 'scale-100 opacity-100' : 'scale-150 opacity-0'}
      `}>
        {/* Glow rings */}
        <div className={`
          absolute inset-0 -m-8 rounded-full blur-xl animate-pulse
          bg-gradient-to-r ${TIER_GRADIENT[tier]} opacity-50
        `} />
        <div className={`
          absolute inset-0 -m-4 rounded-full blur-md
          bg-gradient-to-r ${TIER_GRADIENT[tier]} opacity-30 animate-spin-slow
        `} />

        {/* Main badge */}
        <div className={`
          relative w-32 h-32 rounded-3xl flex items-center justify-center
          bg-gradient-to-br ${TIER_GRADIENT[tier]}
          shadow-2xl ${TIER_GLOW[tier]}
          animate-bounce-slow
        `}>
          <span className="text-6xl">{icon}</span>
        </div>

        {/* Text */}
        <div className={`
          absolute -bottom-20 left-1/2 -translate-x-1/2 text-center whitespace-nowrap
          transition-all duration-500 delay-300
          ${phase === 'show' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          <p className="text-sm uppercase font-bold text-cyan-400 tracking-wider mb-1">
            Achievement Unlocked!
          </p>
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          {subtitle && (
            <p className="text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Confetti */}
      {phase === 'show' && <ConfettiEffect />}

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// Level up animation
function LevelUpAnimation({ level, onComplete }: { level: number; onComplete?: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter')

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('show'), 100)
    const exitTimer = setTimeout(() => setPhase('exit'), 3000)
    const completeTimer = setTimeout(() => onComplete?.(), 3500)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop with radial gradient */}
      <div className={`
        absolute inset-0 transition-opacity duration-500
        ${phase === 'enter' ? 'opacity-0' : phase === 'show' ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className="absolute inset-0 bg-black/80" />
        <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent" />
      </div>

      {/* Level up content */}
      <div className={`
        relative transition-all duration-700
        ${phase === 'enter' ? 'scale-50 opacity-0' : phase === 'show' ? 'scale-100 opacity-100' : 'scale-150 opacity-0'}
      `}>
        {/* Burst effect */}
        <div className="absolute inset-0 -m-20">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`
                absolute top-1/2 left-1/2 w-2 h-20 -translate-x-1/2 origin-bottom
                bg-gradient-to-t from-cyan-500 to-transparent
                ${phase === 'show' ? 'animate-burst' : 'opacity-0'}
              `}
              style={{
                transform: `rotate(${i * 30}deg)`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>

        {/* Level number */}
        <div className="relative text-center">
          <p className={`
            text-sm uppercase font-bold tracking-widest mb-2
            bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent
            ${phase === 'show' ? 'animate-fade-in-up' : 'opacity-0'}
          `}>
            Level Up!
          </p>
          <div className={`
            text-8xl font-black
            bg-gradient-to-b from-white via-cyan-200 to-purple-400 bg-clip-text text-transparent
            ${phase === 'show' ? 'animate-pop' : 'opacity-0'}
          `}>
            {level}
          </div>
          <p className={`
            text-lg text-slate-300 mt-2
            ${phase === 'show' ? 'animate-fade-in-up-delay' : 'opacity-0'}
          `}>
            Keep up the great work!
          </p>
        </div>
      </div>

      {/* Confetti */}
      {phase === 'show' && <ConfettiEffect particleCount={100} />}

      <style>{`
        @keyframes burst {
          0% { height: 0; opacity: 1; }
          50% { height: 100px; opacity: 1; }
          100% { height: 0; opacity: 0; }
        }
        @keyframes pop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-burst {
          animation: burst 0.6s ease-out forwards;
        }
        .animate-pop {
          animation: pop 0.5s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
        .animate-fade-in-up-delay {
          animation: fade-in-up 0.5s ease-out 0.3s forwards;
          opacity: 0;
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  )
}

// Streak celebration
function StreakCelebration({ days, onComplete }: { days: number; onComplete?: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter')

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('show'), 100)
    const exitTimer = setTimeout(() => setPhase('exit'), 2500)
    const completeTimer = setTimeout(() => onComplete?.(), 3000)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div className={`
        absolute inset-0 bg-black/70 transition-opacity duration-500
        ${phase === 'enter' ? 'opacity-0' : phase === 'show' ? 'opacity-100' : 'opacity-0'}
      `} />

      <div className={`
        relative transition-all duration-500
        ${phase === 'enter' ? 'scale-0' : phase === 'show' ? 'scale-100' : 'scale-0'}
      `}>
        {/* Fire ring */}
        <div className="absolute inset-0 -m-12 rounded-full animate-pulse">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-red-600 blur-xl opacity-50" />
        </div>

        {/* Main content */}
        <div className="relative text-center">
          <div className="text-7xl mb-2 animate-bounce">🔥</div>
          <div className="text-5xl font-black text-white">{days}</div>
          <p className="text-lg text-orange-400 font-bold">Day Streak!</p>
        </div>
      </div>

      {phase === 'show' && <ConfettiEffect particleCount={50} />}
    </div>
  )
}

// Main RewardAnimation component
interface RewardAnimationProps {
  config: RewardConfig | null
  onComplete?: () => void
}

export function RewardAnimation({ config, onComplete }: RewardAnimationProps) {
  if (!config) return null

  const content = (() => {
    switch (config.type) {
      case 'badge':
      case 'achievement':
      case 'milestone':
        return (
          <BadgeUnlockAnimation
            icon={config.icon}
            title={config.title}
            subtitle={config.subtitle || config.reward}
            tier={config.tier}
            onComplete={onComplete}
          />
        )
      case 'levelup':
        return (
          <LevelUpAnimation
            level={parseInt(config.icon) || 1}
            onComplete={onComplete}
          />
        )
      case 'streak':
        return (
          <StreakCelebration
            days={parseInt(config.icon) || 1}
            onComplete={onComplete}
          />
        )
      default:
        return null
    }
  })()

  return createPortal(content, document.body)
}

// Hook for managing reward animations
export function useRewardAnimation() {
  const [currentReward, setCurrentReward] = useState<RewardConfig | null>(null)
  const queueRef = useRef<RewardConfig[]>([])

  const showReward = useCallback((config: RewardConfig) => {
    if (currentReward) {
      queueRef.current.push(config)
    } else {
      setCurrentReward(config)
    }
  }, [currentReward])

  const handleComplete = useCallback(() => {
    const next = queueRef.current.shift()
    setCurrentReward(next || null)
  }, [])

  // Convenience methods
  const showBadgeUnlock = useCallback((icon: string, title: string, tier?: RewardConfig['tier']) => {
    showReward({ type: 'badge', icon, title, tier })
  }, [showReward])

  const showLevelUp = useCallback((level: number) => {
    showReward({ type: 'levelup', icon: String(level), title: `Level ${level}` })
  }, [showReward])

  const showStreakCelebration = useCallback((days: number) => {
    showReward({ type: 'streak', icon: String(days), title: `${days} Day Streak` })
  }, [showReward])

  const showMilestone = useCallback((icon: string, title: string, reward?: string, tier?: RewardConfig['tier']) => {
    showReward({ type: 'milestone', icon, title, reward, tier })
  }, [showReward])

  return {
    currentReward,
    showReward,
    handleComplete,
    showBadgeUnlock,
    showLevelUp,
    showStreakCelebration,
    showMilestone,
    RewardComponent: () => <RewardAnimation config={currentReward} onComplete={handleComplete} />,
  }
}

export default RewardAnimation

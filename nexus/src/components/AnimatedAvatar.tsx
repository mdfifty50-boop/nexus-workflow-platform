import { useEffect, useState } from 'react'

interface AnimatedAvatarProps {
  agentId: string
  size?: number
  isActive?: boolean
  expression?: 'neutral' | 'happy' | 'concerned' | 'working'
}

// Professional avatar configurations with realistic features
const avatarConfigs: Record<string, {
  skinTone: string
  skinHighlight: string
  hairColor: string
  hairStyle: 'short' | 'medium' | 'long' | 'bun' | 'fade'
  eyeColor: string
  hasGlasses?: boolean
  hasBeard?: boolean
  gender: 'male' | 'female'
  suitColor: string
  tieColor?: string
  accentColor: string
}> = {
  nexus: {
    skinTone: '#F0FDFA',
    skinHighlight: '#CCFBF1',
    hairColor: '#14B8A6',
    hairStyle: 'short',
    eyeColor: '#14B8A6',
    gender: 'male',
    suitColor: '#0D9488',
    accentColor: '#14B8A6',
  },
  larry: {
    skinTone: '#FDEAA8',
    skinHighlight: '#FCD34D',
    hairColor: '#374151',
    hairStyle: 'short',
    eyeColor: '#1E40AF',
    hasGlasses: true,
    gender: 'male',
    suitColor: '#1E3A8A',
    tieColor: '#3B82F6',
    accentColor: '#3B82F6',
  },
  mary: {
    skinTone: '#FED7AA',
    skinHighlight: '#FDBA74',
    hairColor: '#7C2D12',
    hairStyle: 'medium',
    eyeColor: '#5B21B6',
    gender: 'female',
    suitColor: '#5B21B6',
    accentColor: '#8B5CF6',
  },
  alex: {
    skinTone: '#D4A574',
    skinHighlight: '#C68B59',
    hairColor: '#1C1917',
    hairStyle: 'fade',
    eyeColor: '#047857',
    gender: 'male',
    suitColor: '#065F46',
    tieColor: '#10B981',
    accentColor: '#10B981',
  },
  sam: {
    skinTone: '#FEF3C7',
    skinHighlight: '#FDE68A',
    hairColor: '#78350F',
    hairStyle: 'medium',
    eyeColor: '#B45309',
    hasBeard: true,
    gender: 'male',
    suitColor: '#92400E',
    accentColor: '#F59E0B',
  },
  emma: {
    skinTone: '#FDF2F8',
    skinHighlight: '#FCE7F3',
    hairColor: '#581C87',
    hairStyle: 'long',
    eyeColor: '#DB2777',
    gender: 'female',
    suitColor: '#9D174D',
    accentColor: '#EC4899',
  },
  david: {
    skinTone: '#92400E',
    skinHighlight: '#78350F',
    hairColor: '#1C1917',
    hairStyle: 'fade',
    eyeColor: '#4338CA',
    hasBeard: true,
    gender: 'male',
    suitColor: '#3730A3',
    tieColor: '#6366F1',
    accentColor: '#6366F1',
  },
  olivia: {
    skinTone: '#FEE2E2',
    skinHighlight: '#FECACA',
    hairColor: '#1C1917',
    hairStyle: 'bun',
    eyeColor: '#DC2626',
    hasGlasses: true,
    gender: 'female',
    suitColor: '#B91C1C',
    accentColor: '#EF4444',
  },
}

export function AnimatedAvatar({
  agentId,
  size = 48,
  isActive = false,
  expression = 'neutral'
}: AnimatedAvatarProps) {
  const [blinkState, setBlinkState] = useState(0)
  const [breathState, setBreathState] = useState(0)
  const [lookDirection, setLookDirection] = useState({ x: 0, y: 0 })
  const [workingPhase, setWorkingPhase] = useState(0)

  const config = avatarConfigs[agentId.toLowerCase()] || avatarConfigs.nexus

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      // Random blink every 2-5 seconds
      if (Math.random() > 0.7) {
        setBlinkState(1)
        setTimeout(() => setBlinkState(0), 150)
      }
    }, 500)

    return () => clearInterval(blinkInterval)
  }, [])

  // Breathing animation
  useEffect(() => {
    const breathInterval = setInterval(() => {
      setBreathState((prev) => (prev + 1) % 360)
    }, 50)

    return () => clearInterval(breathInterval)
  }, [])

  // Working animation - faster head movement
  useEffect(() => {
    if (expression === 'working') {
      const workInterval = setInterval(() => {
        setWorkingPhase((prev) => (prev + 1) % 360)
      }, 30)
      return () => clearInterval(workInterval)
    }
  }, [expression])

  // Subtle eye movement when active
  useEffect(() => {
    if (isActive) {
      const lookInterval = setInterval(() => {
        setLookDirection({
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 1,
        })
      }, expression === 'working' ? 500 : 1500)

      return () => clearInterval(lookInterval)
    } else {
      setLookDirection({ x: 0, y: 0 })
    }
  }, [isActive, expression])

  const breathOffset = Math.sin(breathState * (Math.PI / 180)) * 0.5
  const workingOffset = expression === 'working' ? Math.sin(workingPhase * (Math.PI / 180)) * 1.5 : 0
  const eyeOpenness = blinkState === 1 ? 0.1 : 1

  // Generate unique gradient IDs
  const gradientId = `avatar-gradient-${agentId}-${Math.random().toString(36).substr(2, 9)}`

  // Get expression-based mouth path
  const getMouthPath = () => {
    const baseY = 44 + breathOffset
    switch (expression) {
      case 'happy':
        // Big smile
        return `M25 ${baseY} Q32 ${baseY + 5} 39 ${baseY}`
      case 'concerned':
        // Worried/frown
        return `M27 ${baseY + 2} Q32 ${baseY - 1} 37 ${baseY + 2}`
      case 'working':
        // Focused/slightly open
        return `M29 ${baseY} Q32 ${baseY + 2} 35 ${baseY}`
      default:
        // Neutral
        return `M27 ${baseY} Q32 ${isActive ? baseY + 3 : baseY + 2} 37 ${baseY}`
    }
  }

  // Get eyebrow style based on expression
  const getEyebrowOffset = () => {
    switch (expression) {
      case 'happy':
        return -1 // Raised eyebrows
      case 'concerned':
        return 1 // Furrowed
      case 'working':
        return 0.5 // Slightly furrowed
      default:
        return 0
    }
  }

  const eyebrowOffset = getEyebrowOffset()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={isActive ? 'animate-subtle-bounce' : ''}
      style={{
        transform: expression === 'working' ? `translateX(${workingOffset}px)` : 'none',
        transition: 'transform 0.1s ease-out',
      }}
    >
      <defs>
        {/* Background gradient */}
        <linearGradient id={`${gradientId}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={config.accentColor} />
          <stop offset="100%" stopColor={config.suitColor} />
        </linearGradient>

        {/* Skin gradient */}
        <linearGradient id={`${gradientId}-skin`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={config.skinTone} />
          <stop offset="100%" stopColor={config.skinHighlight} />
        </linearGradient>

        {/* Hair gradient */}
        <linearGradient id={`${gradientId}-hair`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={config.hairColor} />
          <stop offset="100%" stopColor={config.hairColor} stopOpacity="0.8" />
        </linearGradient>

        {/* Suit gradient */}
        <linearGradient id={`${gradientId}-suit`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={config.suitColor} />
          <stop offset="100%" stopColor={config.suitColor} stopOpacity="0.9" />
        </linearGradient>

        {/* Clip path for face */}
        <clipPath id={`${gradientId}-face-clip`}>
          <ellipse cx="32" cy="32" rx="24" ry="26" />
        </clipPath>
      </defs>

      {/* Background circle */}
      <circle cx="32" cy="32" r="30" fill={`url(#${gradientId}-bg)`} />
      <circle cx="32" cy="32" r="28" fill={`url(#${gradientId}-bg)`} opacity="0.3" />

      {/* Expression indicator ring for working state */}
      {expression === 'working' && (
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          strokeDasharray="8 4"
          className="animate-spin"
          style={{ animationDuration: '3s' }}
        />
      )}

      {/* Neck */}
      <ellipse
        cx="32"
        cy="56"
        rx="8"
        ry="6"
        fill={`url(#${gradientId}-skin)`}
        transform={`translate(0, ${breathOffset * 0.3})`}
      />

      {/* Suit/Shirt collar */}
      <path
        d="M18 58 Q22 52 32 52 Q42 52 46 58 L50 64 L14 64 Z"
        fill={`url(#${gradientId}-suit)`}
        transform={`translate(0, ${breathOffset * 0.2})`}
      />

      {/* Tie or neckline */}
      {config.gender === 'male' && config.tieColor && (
        <path
          d="M30 52 L32 56 L34 52 L33 64 L31 64 Z"
          fill={config.tieColor}
          transform={`translate(0, ${breathOffset * 0.2})`}
        />
      )}
      {config.gender === 'female' && (
        <path
          d="M28 54 Q32 52 36 54"
          stroke={config.skinTone}
          strokeWidth="2"
          fill="none"
          transform={`translate(0, ${breathOffset * 0.2})`}
        />
      )}

      {/* Face base */}
      <ellipse
        cx="32"
        cy={32 + breathOffset}
        rx="17"
        ry="19"
        fill={`url(#${gradientId}-skin)`}
      />

      {/* Ears */}
      <ellipse
        cx="14"
        cy={32 + breathOffset}
        rx="3"
        ry="4"
        fill={config.skinHighlight}
      />
      <ellipse
        cx="50"
        cy={32 + breathOffset}
        rx="3"
        ry="4"
        fill={config.skinHighlight}
      />

      {/* Hair based on style */}
      {config.hairStyle === 'short' && (
        <path
          d={`M16 ${28 + breathOffset} Q16 ${14 + breathOffset} 32 ${12 + breathOffset} Q48 ${14 + breathOffset} 48 ${28 + breathOffset} Q46 ${20 + breathOffset} 32 ${18 + breathOffset} Q18 ${20 + breathOffset} 16 ${28 + breathOffset} Z`}
          fill={`url(#${gradientId}-hair)`}
        />
      )}
      {config.hairStyle === 'medium' && (
        <>
          <path
            d={`M14 ${30 + breathOffset} Q12 ${14 + breathOffset} 32 ${10 + breathOffset} Q52 ${14 + breathOffset} 50 ${30 + breathOffset}`}
            fill={`url(#${gradientId}-hair)`}
          />
          <ellipse cx="12" cy={34 + breathOffset} rx="4" ry="10" fill={`url(#${gradientId}-hair)`} />
          <ellipse cx="52" cy={34 + breathOffset} rx="4" ry="10" fill={`url(#${gradientId}-hair)`} />
        </>
      )}
      {config.hairStyle === 'long' && (
        <>
          <path
            d={`M12 ${32 + breathOffset} Q10 ${12 + breathOffset} 32 ${8 + breathOffset} Q54 ${12 + breathOffset} 52 ${32 + breathOffset}`}
            fill={`url(#${gradientId}-hair)`}
          />
          <ellipse cx="10" cy={40 + breathOffset} rx="5" ry="14" fill={`url(#${gradientId}-hair)`} />
          <ellipse cx="54" cy={40 + breathOffset} rx="5" ry="14" fill={`url(#${gradientId}-hair)`} />
          <path d={`M20 ${22 + breathOffset} Q26 ${18 + breathOffset} 32 ${20 + breathOffset} Q38 ${18 + breathOffset} 44 ${22 + breathOffset}`} fill={`url(#${gradientId}-hair)`} />
        </>
      )}
      {config.hairStyle === 'bun' && (
        <>
          <path
            d={`M16 ${28 + breathOffset} Q14 ${14 + breathOffset} 32 ${12 + breathOffset} Q50 ${14 + breathOffset} 48 ${28 + breathOffset}`}
            fill={`url(#${gradientId}-hair)`}
          />
          <circle cx="32" cy={8 + breathOffset} r="8" fill={`url(#${gradientId}-hair)`} />
        </>
      )}
      {config.hairStyle === 'fade' && (
        <path
          d={`M16 ${28 + breathOffset} Q16 ${16 + breathOffset} 32 ${14 + breathOffset} Q48 ${16 + breathOffset} 48 ${28 + breathOffset} Q46 ${22 + breathOffset} 32 ${20 + breathOffset} Q18 ${22 + breathOffset} 16 ${28 + breathOffset} Z`}
          fill={`url(#${gradientId}-hair)`}
        />
      )}

      {/* Eyebrows - expression aware */}
      <path
        d={`M21 ${24 + breathOffset + eyebrowOffset} Q25 ${22 + breathOffset + eyebrowOffset} 27 ${24 + breathOffset + eyebrowOffset}`}
        stroke={config.hairColor}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M37 ${24 + breathOffset + eyebrowOffset} Q39 ${22 + breathOffset + eyebrowOffset} 43 ${24 + breathOffset + eyebrowOffset}`}
        stroke={config.hairColor}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Concerned eyebrow inner furrow */}
      {expression === 'concerned' && (
        <>
          <path
            d={`M26 ${23 + breathOffset} L28 ${25 + breathOffset}`}
            stroke={config.hairColor}
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d={`M38 ${23 + breathOffset} L36 ${25 + breathOffset}`}
            stroke={config.hairColor}
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
        </>
      )}

      {/* Eyes */}
      <g transform={`translate(${lookDirection.x}, ${lookDirection.y + breathOffset})`}>
        {/* Eye whites */}
        <ellipse
          cx="24"
          cy="30"
          rx="4"
          ry={3.5 * eyeOpenness}
          fill="white"
        />
        <ellipse
          cx="40"
          cy="30"
          rx="4"
          ry={3.5 * eyeOpenness}
          fill="white"
        />

        {/* Iris */}
        {eyeOpenness > 0.5 && (
          <>
            <circle cx={24 + lookDirection.x * 0.5} cy="30" r="2.5" fill={config.eyeColor} />
            <circle cx={40 + lookDirection.x * 0.5} cy="30" r="2.5" fill={config.eyeColor} />
            {/* Pupils */}
            <circle cx={24 + lookDirection.x * 0.7} cy="30" r="1.2" fill="#1E293B" />
            <circle cx={40 + lookDirection.x * 0.7} cy="30" r="1.2" fill="#1E293B" />
            {/* Eye highlights */}
            <circle cx={25 + lookDirection.x * 0.3} cy="29" r="0.8" fill="white" opacity="0.8" />
            <circle cx={41 + lookDirection.x * 0.3} cy="29" r="0.8" fill="white" opacity="0.8" />
          </>
        )}

        {/* Happy eyes - sparkle effect */}
        {expression === 'happy' && eyeOpenness > 0.5 && (
          <>
            <circle cx={22} cy="28" r="0.5" fill="white" opacity="0.9" />
            <circle cx={38} cy="28" r="0.5" fill="white" opacity="0.9" />
          </>
        )}
      </g>

      {/* Glasses */}
      {config.hasGlasses && (
        <g transform={`translate(0, ${breathOffset})`}>
          <rect x="18" y="26" width="12" height="9" rx="2" stroke="#374151" strokeWidth="1.5" fill="none" opacity="0.8" />
          <rect x="34" y="26" width="12" height="9" rx="2" stroke="#374151" strokeWidth="1.5" fill="none" opacity="0.8" />
          <path d="M30 30 L34 30" stroke="#374151" strokeWidth="1.5" />
          <path d="M18 30 L14 28" stroke="#374151" strokeWidth="1.5" />
          <path d="M46 30 L50 28" stroke="#374151" strokeWidth="1.5" />
        </g>
      )}

      {/* Nose */}
      <path
        d={`M32 ${32 + breathOffset} L30 ${38 + breathOffset} Q32 ${40 + breathOffset} 34 ${38 + breathOffset} Z`}
        fill={config.skinHighlight}
        opacity="0.5"
      />

      {/* Beard/stubble */}
      {config.hasBeard && (
        <ellipse
          cx="32"
          cy={46 + breathOffset}
          rx="10"
          ry="5"
          fill={config.hairColor}
          opacity="0.3"
        />
      )}

      {/* Mouth - expression aware */}
      <path
        d={getMouthPath()}
        stroke={config.gender === 'female' ? '#EC4899' : '#78350F'}
        strokeWidth={config.gender === 'female' ? '2' : '1.5'}
        fill={expression === 'happy' ? 'none' : 'none'}
        strokeLinecap="round"
      />

      {/* Happy mouth - open smile */}
      {expression === 'happy' && (
        <ellipse
          cx="32"
          cy={46 + breathOffset}
          rx="5"
          ry="2"
          fill="#1E293B"
          opacity="0.3"
        />
      )}

      {/* Working mouth - focused */}
      {expression === 'working' && (
        <ellipse
          cx="32"
          cy={45 + breathOffset}
          rx="3"
          ry="1.5"
          fill="#1E293B"
          opacity="0.2"
        />
      )}

      {/* Earrings for female avatars */}
      {config.gender === 'female' && (
        <>
          <circle cx="14" cy={38 + breathOffset} r="2" fill={config.accentColor} />
          <circle cx="50" cy={38 + breathOffset} r="2" fill={config.accentColor} />
        </>
      )}

      {/* Active indicator glow */}
      {isActive && expression !== 'working' && (
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="none"
          stroke={config.accentColor}
          strokeWidth="2"
          opacity="0.5"
          className="animate-ping"
        />
      )}

      {/* Expression-specific indicators */}
      {expression === 'happy' && (
        <>
          {/* Cheek blush */}
          <ellipse cx="18" cy={36 + breathOffset} rx="3" ry="2" fill="#F87171" opacity="0.3" />
          <ellipse cx="46" cy={36 + breathOffset} rx="3" ry="2" fill="#F87171" opacity="0.3" />
        </>
      )}

      {expression === 'concerned' && (
        <>
          {/* Sweat drop */}
          <ellipse cx="48" cy={20 + breathOffset} rx="2" ry="3" fill="#60A5FA" opacity="0.6" />
        </>
      )}

      {/* Inline styles for animations */}
      <style>{`
        @keyframes subtle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-subtle-bounce {
          animation: subtle-bounce 1s ease-in-out infinite;
        }
      `}</style>
    </svg>
  )
}

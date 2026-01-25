// Professional 3D-style Agent Avatars
// These are SVG-based avatars with gradient effects for a modern tech look

export function NexusAvatar({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nexus-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient id="nexus-face" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0FDFA" />
          <stop offset="100%" stopColor="#CCFBF1" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#nexus-grad)" />
      <circle cx="32" cy="32" r="26" fill="url(#nexus-face)" opacity="0.95" />
      {/* AI Circuit Pattern */}
      <path d="M22 28 L26 28 L26 24 M38 28 L42 28 L42 24" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="28" r="4" fill="#14B8A6" />
      <circle cx="40" cy="28" r="4" fill="#14B8A6" />
      <path d="M24 40 Q32 46 40 40" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="20" r="2" fill="#14B8A6" />
      <path d="M32 22 L32 16" stroke="#14B8A6" strokeWidth="2" />
    </svg>
  )
}

export function LarryAvatar({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="larry-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="larry-skin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#FCD34D" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#larry-grad)" />
      {/* Face */}
      <ellipse cx="32" cy="34" rx="18" ry="20" fill="url(#larry-skin)" />
      {/* Hair */}
      <path d="M16 26 Q16 14 32 14 Q48 14 48 26 L46 28 Q46 18 32 18 Q18 18 18 28 Z" fill="#4B5563" />
      {/* Glasses */}
      <rect x="20" y="28" width="10" height="8" rx="2" stroke="#1E293B" strokeWidth="2" fill="none" />
      <rect x="34" y="28" width="10" height="8" rx="2" stroke="#1E293B" strokeWidth="2" fill="none" />
      <path d="M30 32 L34 32" stroke="#1E293B" strokeWidth="2" />
      {/* Smile */}
      <path d="M26 42 Q32 46 38 42" stroke="#92400E" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Tie hint */}
      <path d="M32 52 L29 58 L32 62 L35 58 Z" fill="#3B82F6" />
    </svg>
  )
}

export function MaryAvatar({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="mary-skin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FECACA" />
          <stop offset="100%" stopColor="#FCA5A5" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#mary-grad)" />
      {/* Face */}
      <ellipse cx="32" cy="34" rx="17" ry="19" fill="url(#mary-skin)" />
      {/* Hair */}
      <path d="M14 30 Q12 16 32 12 Q52 16 50 30 L48 26 Q46 18 32 16 Q18 18 16 26 Z" fill="#7C2D12" />
      <ellipse cx="14" cy="34" rx="4" ry="8" fill="#7C2D12" />
      <ellipse cx="50" cy="34" rx="4" ry="8" fill="#7C2D12" />
      {/* Eyes */}
      <ellipse cx="25" cy="30" rx="3" ry="4" fill="#1E293B" />
      <ellipse cx="39" cy="30" rx="3" ry="4" fill="#1E293B" />
      <circle cx="26" cy="29" r="1" fill="white" />
      <circle cx="40" cy="29" r="1" fill="white" />
      {/* Lips */}
      <path d="M27 42 Q32 46 37 42" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Earrings */}
      <circle cx="14" cy="38" r="2" fill="#FCD34D" />
      <circle cx="50" cy="38" r="2" fill="#FCD34D" />
    </svg>
  )
}

export function AlexAvatar({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="alex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="alex-skin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A574" />
          <stop offset="100%" stopColor="#C68B59" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#alex-grad)" />
      {/* Face */}
      <ellipse cx="32" cy="34" rx="17" ry="19" fill="url(#alex-skin)" />
      {/* Hair - short professional */}
      <path d="M16 28 Q16 14 32 12 Q48 14 48 28 Q46 22 32 20 Q18 22 16 28 Z" fill="#1C1917" />
      {/* Eyes */}
      <ellipse cx="25" cy="30" rx="3" ry="3" fill="#1E293B" />
      <ellipse cx="39" cy="30" rx="3" ry="3" fill="#1E293B" />
      {/* Eyebrows - thoughtful */}
      <path d="M21 25 L29 26" stroke="#1C1917" strokeWidth="2" strokeLinecap="round" />
      <path d="M35 26 L43 25" stroke="#1C1917" strokeWidth="2" strokeLinecap="round" />
      {/* Smile */}
      <path d="M26 42 Q32 45 38 42" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Blueprint element */}
      <rect x="44" y="48" width="8" height="6" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
      <path d="M46 51 L50 51 M48 49 L48 53" stroke="white" strokeWidth="1" />
    </svg>
  )
}

export function SamAvatar({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sam-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="sam-skin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#sam-grad)" />
      {/* Face */}
      <ellipse cx="32" cy="34" rx="17" ry="19" fill="url(#sam-skin)" />
      {/* Hair - casual/messy dev style */}
      <path d="M15 28 Q14 12 32 10 Q50 12 49 28" fill="#78350F" />
      <path d="M18 24 Q20 18 26 20" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 24 Q44 18 38 20" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
      {/* Eyes - focused */}
      <ellipse cx="25" cy="30" rx="3" ry="3" fill="#1E293B" />
      <ellipse cx="39" cy="30" rx="3" ry="3" fill="#1E293B" />
      {/* Beard stubble effect */}
      <ellipse cx="32" cy="44" rx="10" ry="6" fill="#78350F" opacity="0.2" />
      {/* Smile */}
      <path d="M27 42 Q32 46 37 42" stroke="#92400E" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Code symbol */}
      <text x="46" y="56" fill="white" fontSize="10" fontFamily="monospace">&lt;/&gt;</text>
    </svg>
  )
}

export function EmmaAvatar({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="emma-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
        <linearGradient id="emma-skin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDF2F8" />
          <stop offset="100%" stopColor="#FCE7F3" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#emma-grad)" />
      {/* Face */}
      <ellipse cx="32" cy="34" rx="16" ry="18" fill="url(#emma-skin)" />
      {/* Hair - stylish */}
      <path d="M14 32 Q10 14 32 10 Q54 14 50 32" fill="#581C87" />
      <ellipse cx="12" cy="36" rx="5" ry="10" fill="#581C87" />
      <ellipse cx="52" cy="36" rx="5" ry="10" fill="#581C87" />
      {/* Bangs */}
      <path d="M20 24 Q26 20 32 22 Q38 20 44 24" fill="#581C87" />
      {/* Eyes - expressive */}
      <ellipse cx="25" cy="30" rx="4" ry="4" fill="#1E293B" />
      <ellipse cx="39" cy="30" rx="4" ry="4" fill="#1E293B" />
      <circle cx="26" cy="29" r="1.5" fill="white" />
      <circle cx="40" cy="29" r="1.5" fill="white" />
      {/* Eyelashes */}
      <path d="M21 26 L22 24 M24 25 L24 23 M27 25 L28 23" stroke="#1E293B" strokeWidth="1" />
      <path d="M37 25 L36 23 M40 25 L40 23 M43 26 L42 24" stroke="#1E293B" strokeWidth="1" />
      {/* Lips */}
      <path d="M27 42 Q32 46 37 42" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function DavidAvatar({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="david-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="david-skin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#david-grad)" />
      {/* Face */}
      <ellipse cx="32" cy="34" rx="17" ry="19" fill="url(#david-skin)" />
      {/* Hair - short fade */}
      <path d="M16 28 Q16 16 32 14 Q48 16 48 28 Q46 20 32 18 Q18 20 16 28 Z" fill="#1C1917" />
      {/* Eyes */}
      <ellipse cx="25" cy="30" rx="3" ry="3" fill="#1E293B" />
      <ellipse cx="39" cy="30" rx="3" ry="3" fill="#1E293B" />
      {/* Goatee */}
      <ellipse cx="32" cy="46" rx="6" ry="4" fill="#1C1917" />
      {/* Smile */}
      <path d="M28 40 Q32 43 36 40" stroke="#5B2C1A" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Gear icon */}
      <circle cx="50" cy="52" r="6" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="50" cy="52" r="2" fill="white" />
    </svg>
  )
}

export function OliviaAvatar({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="olivia-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id="olivia-skin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEE2E2" />
          <stop offset="100%" stopColor="#FECACA" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#olivia-grad)" />
      {/* Face */}
      <ellipse cx="32" cy="34" rx="16" ry="18" fill="url(#olivia-skin)" />
      {/* Hair - professional bun */}
      <circle cx="32" cy="12" r="8" fill="#1C1917" />
      <path d="M16 30 Q14 16 32 14 Q50 16 48 30" fill="#1C1917" />
      {/* Eyes - analytical */}
      <ellipse cx="25" cy="30" rx="3" ry="3" fill="#1E293B" />
      <ellipse cx="39" cy="30" rx="3" ry="3" fill="#1E293B" />
      {/* Glasses */}
      <circle cx="25" cy="30" r="6" stroke="#374151" strokeWidth="1.5" fill="none" />
      <circle cx="39" cy="30" r="6" stroke="#374151" strokeWidth="1.5" fill="none" />
      <path d="M31 30 L33 30" stroke="#374151" strokeWidth="1.5" />
      {/* Smile */}
      <path d="M27 42 Q32 45 37 42" stroke="#7F1D1D" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Magnifying glass */}
      <circle cx="52" cy="50" r="4" stroke="white" strokeWidth="1.5" fill="none" />
      <path d="M55 53 L58 56" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// Agent Avatar component that selects the right avatar
export function AgentAvatar({ agentId, size = 48 }: { agentId: string; size?: number }) {
  const avatars: Record<string, React.FC<{ size?: number }>> = {
    nexus: NexusAvatar,
    larry: LarryAvatar,
    mary: MaryAvatar,
    alex: AlexAvatar,
    sam: SamAvatar,
    emma: EmmaAvatar,
    david: DavidAvatar,
    olivia: OliviaAvatar,
  }

  const Avatar = avatars[agentId.toLowerCase()] || NexusAvatar
  return <Avatar size={size} />
}

// Professional Icons for features
export function WorkflowIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6h4v4H4zM16 6h4v4h-4zM10 14h4v4h-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8h8M12 12v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function IntegrationIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M9 12h6M15 7l-6 4M15 17l-6-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function AnalyticsIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20h16M4 20V4M8 16v-4M12 16V8M16 16v-6M20 16v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SecurityIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l8 4v6c0 5.5-3.5 10-8 11-4.5-1-8-5.5-8-11V6l8-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AutomationIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ScaleIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M21 21H3M21 3v18M3 21V3M3 3h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 17l4-4 3 3 4-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SendIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AttachIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MenuIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CloseIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PlayIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon points="5,3 19,12 5,21" fill="currentColor" />
    </svg>
  )
}

export function PauseIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="4" width="4" height="16" fill="currentColor" />
      <rect x="14" y="4" width="4" height="16" fill="currentColor" />
    </svg>
  )
}

export function CheckIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SparklesIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

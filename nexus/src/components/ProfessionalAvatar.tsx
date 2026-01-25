// Professional HD Avatars - No API required
// Uses a combination of free services for realistic corporate avatars

interface ProfessionalAvatarProps {
  agentId: string
  size?: number
  isActive?: boolean
  className?: string
}

// Professional avatar configurations with real photo URLs
// Using Unsplash photos of professional people (free to use)
const AVATAR_CONFIG: Record<string, {
  name: string
  role: string
  imageUrl: string
  fallbackColor: string
}> = {
  larry: {
    name: 'Larry Chen',
    role: 'Business Analyst',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    fallbackColor: '0891b2',
  },
  mary: {
    name: 'Mary Johnson',
    role: 'Product Manager',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    fallbackColor: 'dc2626',
  },
  alex: {
    name: 'Alex Rivera',
    role: 'Solutions Architect',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    fallbackColor: '7c3aed',
  },
  sam: {
    name: 'Sam Williams',
    role: 'Senior Developer',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    fallbackColor: '059669',
  },
  emma: {
    name: 'Emma Davis',
    role: 'UX Designer',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    fallbackColor: 'db2777',
  },
  olivia: {
    name: 'Olivia Taylor',
    role: 'QA Lead',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    fallbackColor: 'ea580c',
  },
  david: {
    name: 'David Kim',
    role: 'DevOps Engineer',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    fallbackColor: '2563eb',
  },
  nexus: {
    name: 'Nexus AI',
    role: 'Orchestrator',
    imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
    fallbackColor: '8b5cf6',
  },
}

export function ProfessionalAvatar({
  agentId,
  size = 48,
  isActive = false,
  className = '',
}: ProfessionalAvatarProps) {
  const config = AVATAR_CONFIG[agentId] || {
    name: agentId,
    role: 'Agent',
    imageUrl: '',
    fallbackColor: '6366f1',
  }

  // Fallback URL using UI Avatars if image fails
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(config.name)}&background=${config.fallbackColor}&color=fff&size=${size * 2}&bold=true`

  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Main image */}
      <img
        src={config.imageUrl || fallbackUrl}
        alt={config.name}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to UI Avatars on error
          (e.target as HTMLImageElement).src = fallbackUrl
        }}
      />

      {/* Active indicator ring */}
      {isActive && (
        <div
          className="absolute inset-0 border-2 border-cyan-400 rounded-full animate-pulse"
          style={{ boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}
        />
      )}

      {/* Online indicator dot */}
      <div
        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
          isActive ? 'bg-emerald-500' : 'bg-slate-500'
        }`}
        style={{
          width: Math.max(size * 0.2, 8),
          height: Math.max(size * 0.2, 8),
          borderWidth: Math.max(size * 0.04, 2),
        }}
      />
    </div>
  )
}

// Compact version for smaller UI elements
export function ProfessionalAvatarCompact({
  agentId,
  size = 32,
  isActive = false,
  className = '',
}: ProfessionalAvatarProps) {
  return (
    <ProfessionalAvatar
      agentId={agentId}
      size={size}
      isActive={isActive}
      className={className}
    />
  )
}

// Get avatar config for external use
export function getAvatarConfig(agentId: string) {
  return AVATAR_CONFIG[agentId] || {
    name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
    role: 'Agent',
    imageUrl: '',
    fallbackColor: '6366f1',
  }
}

// Export all agent IDs
export const AGENT_IDS = Object.keys(AVATAR_CONFIG)

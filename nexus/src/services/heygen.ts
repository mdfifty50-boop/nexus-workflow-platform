// HeyGen Streaming Avatar Service
// Handles authentication and avatar session management
// SECURITY: All API calls now go through backend proxy to keep keys secure

const API_BASE = import.meta.env.VITE_API_URL || ''

// Status cache
let isConfiguredCache: boolean | null = null

// Available HeyGen avatar IDs mapped to our agent personas
// These are public HeyGen avatars that match professional appearances
export const HEYGEN_AVATAR_MAP: Record<string, {
  avatarId: string
  voiceId: string
  name: string
  description: string
}> = {
  larry: {
    avatarId: 'Eric_public_pro2_20230608',
    voiceId: '077ab11b14f04ce0b49b5f6e5cc20979',
    name: 'Larry',
    description: 'Senior Data Analyst - Professional male with glasses'
  },
  mary: {
    avatarId: 'Anna_public_3_20240108',
    voiceId: '1bd001e7e50f421d891986aad5158bc8',
    name: 'Mary',
    description: 'Project Manager - Professional female'
  },
  alex: {
    avatarId: 'Tyler-incasualsuit-20220721',
    voiceId: '131a436c47064f708210df6628ef8f32',
    name: 'Alex',
    description: 'Solutions Architect - Professional male'
  },
  sam: {
    avatarId: 'josh_lite3_20230714',
    voiceId: '2d5b0e6cf36f460aa7fc47e3eee4ba54',
    name: 'Sam',
    description: 'Full Stack Developer - Casual professional male'
  },
  emma: {
    avatarId: 'Kristin_public_2_20240108',
    voiceId: 'e1f8a3f2b5a34f5b8f5b3e5f8a3b5a34',
    name: 'Emma',
    description: 'UX Designer - Creative professional female'
  },
  olivia: {
    avatarId: 'Kayla-incasualsuit-20220818',
    voiceId: 'c8e8b5f3a9d4e7f2a3b5c8e8b5f3a9d4',
    name: 'Olivia',
    description: 'QA Engineer - Professional female with glasses'
  },
  david: {
    avatarId: 'Wayne_20240711',
    voiceId: 'd8f5a3e7b2c9f4a8e5b3d8f5a3e7b2c9',
    name: 'David',
    description: 'DevOps Engineer - Professional male'
  },
  nexus: {
    avatarId: 'Eric_public_pro2_20230608',
    voiceId: '077ab11b14f04ce0b49b5f6e5cc20979',
    name: 'Nexus AI',
    description: 'AI Assistant - Professional appearance'
  }
}

// Generate a session access token for streaming
// SECURITY: Token request goes through backend proxy
export async function getHeyGenAccessToken(): Promise<string> {
  const response = await fetch(`${API_BASE}/api/ai-proxy/heygen/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to get HeyGen access token: ${response.statusText}`)
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Failed to get HeyGen access token')
  }
  return data.token
}

// Fetch list of available avatars from HeyGen
// SECURITY: Avatar list request goes through backend proxy
export async function listHeyGenAvatars(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/ai-proxy/heygen/avatars`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to list avatars: ${response.statusText}`)
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Failed to list avatars')
  }
  return data.avatars || []
}

// Check if HeyGen is properly configured (async - checks backend)
export async function checkHeyGenConfigured(): Promise<boolean> {
  if (isConfiguredCache !== null) {
    return isConfiguredCache
  }

  try {
    const response = await fetch(`${API_BASE}/api/ai-proxy/heygen/status`)
    const data = await response.json()
    isConfiguredCache = data.configured === true
    return isConfiguredCache
  } catch {
    isConfiguredCache = false
    return false
  }
}

// Synchronous check - returns cached value or false
export function isHeyGenConfigured(): boolean {
  // Trigger async check in background
  if (isConfiguredCache === null) {
    checkHeyGenConfigured()
  }
  return isConfiguredCache === true
}

// Get avatar config for an agent
export function getAvatarConfig(agentId: string) {
  return HEYGEN_AVATAR_MAP[agentId.toLowerCase()] || HEYGEN_AVATAR_MAP.nexus
}

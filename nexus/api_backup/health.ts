import type { VercelRequest, VercelResponse } from '@vercel/node'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    ai: { configured: boolean; service: string }
    email: { configured: boolean; service: string }
    crm: { configured: boolean; service: string }
    database: { configured: boolean; service: string }
  }
  timestamp: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const health: HealthStatus = {
    status: 'healthy',
    services: {
      ai: {
        configured: !!process.env.ANTHROPIC_API_KEY,
        service: 'Claude (Anthropic)',
      },
      email: {
        configured: !!process.env.RESEND_API_KEY,
        service: 'Resend',
      },
      crm: {
        configured: !!process.env.HUBSPOT_ACCESS_TOKEN,
        service: 'HubSpot',
      },
      database: {
        configured: !!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
        service: 'Supabase',
      },
    },
    timestamp: new Date().toISOString(),
  }

  // Determine overall status
  const configuredCount = Object.values(health.services).filter((s) => s.configured).length
  if (configuredCount === 0) {
    health.status = 'unhealthy'
  } else if (configuredCount < Object.keys(health.services).length) {
    health.status = 'degraded'
  }

  return res.status(200).json(health)
}

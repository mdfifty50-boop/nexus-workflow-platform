import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withSecurityHeaders } from '../_lib/security-headers.js'

/**
 * /api/user-profile/[...path] - Consolidated user profile API
 *
 * Routes:
 *   GET/PUT /api/user-profile/context  - User context dual-write sync
 *   GET/PUT /api/user-profile/business - Business profile dual-write sync
 */

const supabaseConfig = () => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return { url, key, configured: !!(url && key) }
}

async function supabaseFetch(table: string, userId: string, select: string) {
  const { url, key } = supabaseConfig()
  const response = await fetch(`${url}/rest/v1/${table}?user_id=eq.${userId}&select=${select}`, {
    headers: { 'apikey': key!, 'Authorization': `Bearer ${key}` },
  })
  return response.ok ? await response.json() : []
}

async function supabaseUpsert(table: string, userId: string, data: Record<string, unknown>) {
  const { url, key } = supabaseConfig()
  const response = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': key!,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ user_id: userId, ...data, updated_at: new Date().toISOString() }),
  })
  return response.ok
}

// === Context handlers ===

async function handleContextGet(userId: string, res: VercelResponse) {
  const { configured } = supabaseConfig()
  if (configured && userId) {
    try {
      const rows = await supabaseFetch('user_contexts', userId, 'context')
      if (rows.length > 0) return res.status(200).json({ source: 'supabase', context: rows[0].context })
    } catch { /* fall through */ }
  }
  return res.status(200).json({
    source: 'defaults',
    context: {
      region: 'kuwait',
      workWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      businessHours: { start: '08:00', end: '17:00' },
      currency: 'KWD', vatRate: 0.05, timezone: 'Asia/Kuwait',
      conversationHistory: { mentionedEmails: [], mentionedChannels: [] },
    },
  })
}

async function handleContextPut(userId: string, req: VercelRequest, res: VercelResponse) {
  const { configured } = supabaseConfig()
  if (!configured) return res.status(200).json({ saved: false, reason: 'cloud_not_configured' })
  if (!userId) return res.status(200).json({ saved: false, reason: 'no_user_id' })
  try {
    const { context } = req.body || {}
    const ok = await supabaseUpsert('user_contexts', userId, { context })
    return res.status(200).json({ saved: ok, source: 'supabase' })
  } catch { return res.status(200).json({ saved: false, reason: 'sync_error' }) }
}

// === Business profile handlers ===

async function handleBusinessGet(userId: string, res: VercelResponse) {
  const { configured } = supabaseConfig()
  if (configured && userId) {
    try {
      const rows = await supabaseFetch('user_business_profiles', userId, 'profile')
      if (rows.length > 0) return res.status(200).json({ source: 'supabase', profile: rows[0].profile })
    } catch { /* fall through */ }
  }
  return res.status(200).json({ source: 'defaults', profile: null })
}

async function handleBusinessPut(userId: string, req: VercelRequest, res: VercelResponse) {
  const { configured } = supabaseConfig()
  if (!configured) return res.status(200).json({ saved: false, reason: 'cloud_not_configured' })
  if (!userId) return res.status(200).json({ saved: false, reason: 'no_user_id' })
  try {
    const { profile } = req.body || {}
    const ok = await supabaseUpsert('user_business_profiles', userId, { profile })
    return res.status(200).json({ saved: ok, source: 'supabase' })
  } catch { return res.status(200).json({ saved: false, reason: 'sync_error' }) }
}

// === Main router ===

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withSecurityHeaders(req, res)) return

  // Extract route from URL path (more reliable than req.query.path)
  const urlPath = req.url || ''
  const route = urlPath.replace(/^\/api\/user-profile\/?/, '').split('?')[0]
  const userId = req.headers['x-clerk-user-id'] as string

  switch (route) {
    case 'context':
      if (req.method === 'GET') return handleContextGet(userId, res)
      if (req.method === 'PUT') return handleContextPut(userId, req, res)
      return res.status(405).json({ error: 'Method not allowed' })

    case 'business':
      if (req.method === 'GET') return handleBusinessGet(userId, res)
      if (req.method === 'PUT') return handleBusinessPut(userId, req, res)
      return res.status(405).json({ error: 'Method not allowed' })

    default:
      return res.status(404).json({ error: `Unknown route: /api/user-profile/${route}` })
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withSecurityHeaders } from '../_lib/security-headers.js'

/**
 * /api/user-profile/business - Business profile sync endpoint
 *
 * GET: Load business profile from Supabase (or return defaults)
 * PUT: Save business profile to Supabase
 *
 * Dual-write pattern: localStorage (primary) + cloud (backup)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withSecurityHeaders(req, res)) return

  const userId = req.headers['x-clerk-user-id'] as string

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseConfigured = !!(supabaseUrl && supabaseKey)

  if (req.method === 'GET') {
    if (supabaseConfigured && userId) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/user_business_profiles?user_id=eq.${userId}&select=profile`, {
          headers: {
            'apikey': supabaseKey!,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        })

        if (response.ok) {
          const rows = await response.json()
          if (rows.length > 0) {
            return res.status(200).json({ source: 'supabase', profile: rows[0].profile })
          }
        }
      } catch {
        // Fall through to defaults
      }
    }

    // Graceful defaults
    return res.status(200).json({
      source: 'defaults',
      profile: null,
    })
  }

  if (req.method === 'PUT') {
    if (!supabaseConfigured) {
      return res.status(200).json({ saved: false, reason: 'cloud_not_configured' })
    }

    if (!userId) {
      return res.status(200).json({ saved: false, reason: 'no_user_id' })
    }

    try {
      const { profile } = req.body || {}
      const response = await fetch(`${supabaseUrl}/rest/v1/user_business_profiles`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ user_id: userId, profile, updated_at: new Date().toISOString() }),
      })

      return res.status(200).json({ saved: response.ok, source: 'supabase' })
    } catch {
      return res.status(200).json({ saved: false, reason: 'sync_error' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}

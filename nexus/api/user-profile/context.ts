import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withSecurityHeaders } from '../_lib/security-headers.js'

/**
 * /api/user-profile/context - User context sync endpoint
 *
 * GET: Load user context from Supabase (or return defaults)
 * PUT: Save user context to Supabase
 *
 * Dual-write pattern: localStorage (primary) + cloud (backup)
 * If Supabase is not configured, returns graceful defaults.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withSecurityHeaders(req, res)) return

  const userId = req.headers['x-clerk-user-id'] as string

  // Supabase configuration
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseConfigured = !!(supabaseUrl && supabaseKey)

  if (req.method === 'GET') {
    // If Supabase is configured, try to load from cloud
    if (supabaseConfigured && userId) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/user_contexts?user_id=eq.${userId}&select=context`, {
          headers: {
            'apikey': supabaseKey!,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        })

        if (response.ok) {
          const rows = await response.json()
          if (rows.length > 0) {
            return res.status(200).json({ source: 'supabase', context: rows[0].context })
          }
        }
      } catch {
        // Fall through to defaults
      }
    }

    // Return graceful defaults (no error, no 404)
    return res.status(200).json({
      source: 'defaults',
      context: {
        region: 'kuwait',
        workWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        businessHours: { start: '08:00', end: '17:00' },
        currency: 'KWD',
        vatRate: 0.05,
        timezone: 'Asia/Kuwait',
        conversationHistory: { mentionedEmails: [], mentionedChannels: [] },
      },
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
      const { context } = req.body || {}
      const response = await fetch(`${supabaseUrl}/rest/v1/user_contexts`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ user_id: userId, context, updated_at: new Date().toISOString() }),
      })

      return res.status(200).json({ saved: response.ok, source: 'supabase' })
    } catch {
      return res.status(200).json({ saved: false, reason: 'sync_error' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}

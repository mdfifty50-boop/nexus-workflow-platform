import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withSecurityHeaders } from '../_lib/security-headers.js'

/**
 * /api/services/[...path] - Consolidated services endpoint
 *
 * Handles status checks and AI proxy routing to stay within Vercel's
 * 12 serverless function limit on the Hobby plan.
 *
 * Mapped via vercel.json rewrites:
 *   /api/chat-persistence/status    → /api/services/chat-persistence/status
 *   /api/workflow-persistence/status → /api/services/workflow-persistence/status
 *   /api/user-preferences/status    → /api/services/user-preferences/status
 *   /api/ai-proxy/status            → /api/services/ai-proxy/status
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (withSecurityHeaders(req, res)) return

  const { path } = req.query
  const route = Array.isArray(path) ? path.join('/') : path || ''

  // === Status endpoints (all identical - check Supabase config) ===
  if (route === 'chat-persistence/status' ||
      route === 'workflow-persistence/status' ||
      route === 'user-preferences/status') {

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    return res.status(200).json({
      supabaseConfigured: !!(supabaseUrl && supabaseKey),
      cloudEnabled: !!(supabaseUrl && supabaseKey),
    })
  }

  // === AI Proxy status ===
  if (route === 'ai-proxy/status') {
    return res.status(200).json({
      services: {
        elevenlabs: {
          configured: !!process.env.ELEVENLABS_API_KEY,
          status: process.env.ELEVENLABS_API_KEY ? 'operational' : 'not_configured',
        },
        azure: {
          configured: !!process.env.AZURE_SPEECH_KEY,
          status: process.env.AZURE_SPEECH_KEY ? 'operational' : 'not_configured',
        },
        google: {
          configured: !!process.env.GOOGLE_TTS_KEY,
          status: process.env.GOOGLE_TTS_KEY ? 'operational' : 'not_configured',
        },
        openai: {
          configured: !!process.env.OPENAI_API_KEY,
          status: process.env.OPENAI_API_KEY ? 'operational' : 'not_configured',
        },
        anthropic: {
          configured: !!process.env.ANTHROPIC_API_KEY,
          status: process.env.ANTHROPIC_API_KEY ? 'operational' : 'not_configured',
        },
      },
    })
  }

  res.status(404).json({ error: `Unknown service route: ${route}` })
}

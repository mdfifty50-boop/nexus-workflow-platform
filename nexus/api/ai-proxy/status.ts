import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withSecurityHeaders } from '../_lib/security-headers.js'

/**
 * /api/ai-proxy/status - AI service provider status endpoint
 *
 * Returns configuration status of TTS/AI providers.
 * Used by human-tts-service to determine which providers are available.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (withSecurityHeaders(req, res)) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.status(200).json({
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

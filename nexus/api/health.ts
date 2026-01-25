import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withSecurityHeaders } from './_lib/security-headers.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set security headers and handle CORS preflight
  if (withSecurityHeaders(req, res)) return

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.1-diagnostic',
    deployedAt: '2026-01-13T18:15:00Z',
    agents: 8,
    ai: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured'
  })
}

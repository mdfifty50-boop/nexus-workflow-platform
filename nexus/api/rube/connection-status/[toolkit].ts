import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withSecurityHeaders } from '../../_lib/security-headers.js'

/**
 * Connection Status Handler for specific toolkit
 * Route: /api/rube/connection-status/:toolkit
 *
 * This separate route file is needed because Vercel's catch-all [[...path]].ts
 * doesn't reliably match two-level nested paths.
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withSecurityHeaders(req, res)) return

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  // Extract toolkit from URL path
  const toolkit = req.query.toolkit as string

  if (!toolkit) {
    return res.status(400).json({ success: false, error: 'toolkit parameter is required' })
  }

  const apiKey = process.env.COMPOSIO_API_KEY
  const isDemoMode = !apiKey || apiKey.length < 10

  if (isDemoMode) {
    const demoConnected = ['gmail', 'slack', 'googlecalendar', 'github', 'googlesheets', 'notion'].includes(toolkit.toLowerCase())
    return res.json({
      connected: demoConnected,
      toolkit,
      isDemoMode: true,
      authUrl: demoConnected ? null : `https://app.composio.dev/apps/${toolkit}`,
      user_info: demoConnected ? { email: 'demo@nexus.app', name: 'Demo User' } : null
    })
  }

  try {
    const { Composio } = await import('@composio/core')
    const composio = new Composio({ apiKey })
    const connectionsResponse = await composio.connectedAccounts.list({ toolkitSlugs: [toolkit] })
    const connections = (connectionsResponse as any).items || connectionsResponse
    const isConnected = Array.isArray(connections) ? connections.length > 0 : false
    const connection = isConnected && Array.isArray(connections) ? connections[0] : null

    res.json({
      connected: isConnected,
      toolkit,
      isDemoMode: false,
      connectionId: connection?.id,
      authUrl: isConnected ? null : `https://app.composio.dev/apps/${toolkit}`,
      user_info: connection?.userInfo || null
    })
  } catch (composioError: any) {
    console.error('Composio connection check error:', composioError)
    res.json({
      connected: false,
      toolkit,
      error: composioError.message,
      authUrl: `https://app.composio.dev/apps/${toolkit}`
    })
  }
}

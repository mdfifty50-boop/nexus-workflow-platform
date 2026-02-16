/**
 * WhatsApp Web API Proxy - Vercel Serverless Catch-All
 *
 * Proxies all /api/whatsapp-web/* requests to the Northflank backend
 * where Baileys WebSocket connections and session persistence live.
 *
 * @NEXUS-FIX-143: Vercel API proxy for WhatsApp Web - DO NOT REMOVE
 * Vercel's api/ directory intercepts /api/* routes before rewrites.
 * This catch-all ensures WhatsApp endpoints reach the persistent backend.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

const BACKEND_URL = process.env.NEXUS_BACKEND_URL || 'https://http--nexus-server--qlbw2fmhf4z2.code.run'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query
  const subPath = Array.isArray(path) ? path.join('/') : (path || '')
  const targetUrl = `${BACKEND_URL}/api/whatsapp-web/${subPath}`

  // Forward headers (excluding host)
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() !== 'host' && typeof value === 'string') {
      headers[key] = value
    }
  }

  try {
    const fetchOptions: RequestInit = {
      method: req.method || 'GET',
      headers,
    }

    // Forward body for POST/PUT/PATCH/DELETE
    if (req.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      fetchOptions.body = JSON.stringify(req.body)
      headers['content-type'] = 'application/json'
    }

    const response = await fetch(targetUrl, fetchOptions)
    const contentType = response.headers.get('content-type') || ''

    // Handle SSE (Server-Sent Events) - stream through
    if (contentType.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Access-Control-Allow-Origin', '*')

      // Vercel serverless functions have a 30s timeout on Hobby plan
      // SSE won't work reliably here - the frontend polling fallback (FIX-142) handles this
      const text = await response.text()
      res.status(response.status).send(text)
      return
    }

    // Forward JSON/text responses
    const data = await response.text()
    res.status(response.status)

    // Copy relevant response headers
    const corsHeader = response.headers.get('access-control-allow-origin')
    if (corsHeader) res.setHeader('Access-Control-Allow-Origin', corsHeader)

    if (contentType.includes('application/json')) {
      res.setHeader('Content-Type', 'application/json')
    }

    res.send(data)
  } catch (error) {
    console.error(`[WhatsApp Proxy] Error proxying to ${targetUrl}:`, error)
    res.status(502).json({
      success: false,
      error: 'Backend server unavailable. Please try again.',
    })
  }
}

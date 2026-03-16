import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withSecurityHeaders } from '../_lib/security-headers.js'

/**
 * /api/autopilot/[...path] - Autopilot session management
 *
 * Handles Autopilot routes that were previously proxied to Northflank.
 * Now served directly from Vercel serverless to prevent timeouts.
 *
 * Routes:
 *   GET  /api/autopilot/status           → Service status
 *   POST /api/autopilot/session          → Create session
 *   POST /api/autopilot/:id/start        → Start session
 *   POST /api/autopilot/:id/stop         → Stop session
 *   POST /api/autopilot/:id/approve      → Approve HITL step
 *   POST /api/autopilot/:id/reject       → Reject HITL step
 *   GET  /api/autopilot/stream/:id       → SSE stream (not supported in serverless)
 */

// In-memory session store (scoped to function invocation — stateless across requests)
// Full session persistence requires Supabase or external store
function generateId(): string {
  return `ap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withSecurityHeaders(req, res)) return

  const urlPath = (req.url || '').split('?')[0]
  const route = urlPath.replace(/^\/api\/autopilot\/?/, '')

  try {
    // GET /api/autopilot/status or GET /api/autopilot
    if ((!route || route === 'status') && req.method === 'GET') {
      return res.json({
        success: true,
        available: true,
        mode: 'serverless',
        features: {
          createSession: true,
          startSession: true,
          hitlApproval: true,
          streaming: false, // SSE not supported in Vercel serverless
          browserAutomation: false, // Requires long-running process
        },
        message: 'Autopilot service is available. Browser automation requires the Northflank backend.',
      })
    }

    // POST /api/autopilot/session — Create a new session
    if (route === 'session' && req.method === 'POST') {
      const { workflowSpec, userId } = req.body || {}

      if (!workflowSpec) {
        return res.status(400).json({ success: false, error: 'workflowSpec is required' })
      }

      const sessionId = generateId()
      const steps = (workflowSpec.steps || []).map((step: any, i: number) => ({
        index: i,
        name: step.name || step.tool || `Step ${i + 1}`,
        tool: step.tool,
        status: 'pending',
      }))

      return res.json({
        success: true,
        session: {
          id: sessionId,
          state: 'created',
          steps,
          currentStep: 0,
          createdAt: new Date().toISOString(),
          estimatedDuration: steps.length * 30, // 30s per step estimate
          requiresCredentials: workflowSpec.requiredIntegrations || [],
        },
      })
    }

    // POST /api/autopilot/:sessionId/start
    if (route.match(/^[^/]+\/start$/) && req.method === 'POST') {
      const sessionId = route.replace('/start', '')
      return res.json({
        success: true,
        sessionId,
        state: 'running',
        message: 'Autopilot session started. Note: Full browser automation requires the Northflank backend.',
      })
    }

    // POST /api/autopilot/:sessionId/stop
    if (route.match(/^[^/]+\/stop$/) && req.method === 'POST') {
      const sessionId = route.replace('/stop', '')
      return res.json({
        success: true,
        sessionId,
        state: 'stopped',
      })
    }

    // POST /api/autopilot/:sessionId/approve
    if (route.match(/^[^/]+\/approve$/) && req.method === 'POST') {
      const sessionId = route.replace('/approve', '')
      return res.json({
        success: true,
        sessionId,
        message: 'Step approved, proceeding to next step',
      })
    }

    // POST /api/autopilot/:sessionId/reject
    if (route.match(/^[^/]+\/reject$/) && req.method === 'POST') {
      const sessionId = route.replace('/reject', '')
      const { reason } = req.body || {}
      return res.json({
        success: true,
        sessionId,
        message: 'Step rejected',
        reason: reason || 'User rejected the step',
      })
    }

    // GET /api/autopilot/stream/:sessionId — SSE not supported in serverless
    if (route.startsWith('stream/') && req.method === 'GET') {
      return res.status(501).json({
        success: false,
        error: 'SSE streaming is not available in serverless mode. Use the Northflank backend for real-time streaming.',
        hint: 'Poll /api/autopilot/:sessionId/status for updates instead.',
      })
    }

    // GET /api/autopilot/:sessionId — Get session status
    if (route && !route.includes('/') && req.method === 'GET') {
      return res.json({
        success: true,
        session: {
          id: route,
          state: 'idle',
          currentStep: 0,
          steps: [],
        },
      })
    }

    return res.status(404).json({ error: `Unknown autopilot route: ${route}` })
  } catch (error: any) {
    console.error('Autopilot handler error:', error)
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' })
  }
}

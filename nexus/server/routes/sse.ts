import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const router = Router()

// Store active SSE connections
const activeConnections = new Map<string, Set<Response>>()

// ===========================================
// SECURE SSE TICKET SYSTEM
// ===========================================
// Tickets are short-lived, single-use tokens that prevent
// sensitive auth tokens from appearing in URLs (which leak
// to browser history, server logs, referrer headers, etc.)

interface SSETicket {
  userId: string
  workflowId: string
  createdAt: number
  used: boolean
}

// In-memory ticket store (in production, use Redis with TTL)
const sseTickets = new Map<string, SSETicket>()

// Ticket configuration
const TICKET_EXPIRY_MS = 60 * 1000 // 60 seconds
const TICKET_CLEANUP_INTERVAL_MS = 30 * 1000 // Cleanup every 30 seconds

// Periodic cleanup of expired tickets
setInterval(() => {
  const now = Date.now()
  let cleaned = 0
  for (const [ticketId, ticket] of sseTickets.entries()) {
    if (ticket.used || (now - ticket.createdAt) > TICKET_EXPIRY_MS) {
      sseTickets.delete(ticketId)
      cleaned++
    }
  }
  if (cleaned > 0) {
    console.log(`[SSE Tickets] Cleaned up ${cleaned} expired/used tickets`)
  }
}, TICKET_CLEANUP_INTERVAL_MS)

/**
 * POST /api/sse/ticket
 * Request a short-lived, single-use ticket for SSE connection
 *
 * SECURITY: This endpoint requires authentication via headers.
 * The returned ticket can be used in the URL safely because:
 * 1. It's short-lived (60 seconds)
 * 2. It's single-use (invalidated after connection)
 * 3. It doesn't reveal the actual auth token
 */
router.post('/ticket', (req: Request, res: Response) => {
  const { workflowId } = req.body
  let clerkUserId = req.headers['x-clerk-user-id'] as string

  // In development mode, allow requests without authentication
  const isDev = process.env.NODE_ENV !== 'production'
  if (!clerkUserId) {
    if (isDev) {
      clerkUserId = 'dev-user-local'
      console.log('[DEV MODE] SSE ticket using dev-user-local for authentication')
    } else {
      return res.status(401).json({ error: 'Authentication required' })
    }
  }

  if (!workflowId) {
    return res.status(400).json({ error: 'workflowId is required' })
  }

  // Generate cryptographically secure ticket
  const ticketId = crypto.randomBytes(32).toString('hex')

  // Store ticket
  sseTickets.set(ticketId, {
    userId: clerkUserId,
    workflowId,
    createdAt: Date.now(),
    used: false,
  })

  console.log(`[SSE Tickets] Created ticket for workflow ${workflowId}, user ${clerkUserId}`)

  return res.json({
    success: true,
    ticket: ticketId,
    expiresIn: TICKET_EXPIRY_MS / 1000, // seconds
  })
})

/**
 * Validate and consume an SSE ticket
 * Returns the ticket data if valid, null otherwise
 */
function validateAndConsumeTicket(ticketId: string, workflowId: string): SSETicket | null {
  const ticket = sseTickets.get(ticketId)

  if (!ticket) {
    console.log(`[SSE Tickets] Ticket not found: ${ticketId.substring(0, 8)}...`)
    return null
  }

  // Check if already used
  if (ticket.used) {
    console.log(`[SSE Tickets] Ticket already used: ${ticketId.substring(0, 8)}...`)
    return null
  }

  // Check if expired
  if ((Date.now() - ticket.createdAt) > TICKET_EXPIRY_MS) {
    console.log(`[SSE Tickets] Ticket expired: ${ticketId.substring(0, 8)}...`)
    sseTickets.delete(ticketId)
    return null
  }

  // Check if workflowId matches
  if (ticket.workflowId !== workflowId) {
    console.log(`[SSE Tickets] Ticket workflowId mismatch: expected ${ticket.workflowId}, got ${workflowId}`)
    return null
  }

  // Mark as used (single-use)
  ticket.used = true
  console.log(`[SSE Tickets] Ticket validated and consumed for workflow ${workflowId}`)

  return ticket
}

// Initialize Supabase client for realtime subscriptions
function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * GET /api/sse/workflow/:workflowId
 * Server-Sent Events endpoint for real-time workflow updates (Story 5.2)
 *
 * SECURITY: Uses ticket-based authentication to prevent token exposure in URLs.
 * Clients must first call POST /api/sse/ticket to get a short-lived ticket,
 * then connect here with that ticket.
 *
 * Query params:
 * - ticket: Short-lived, single-use ticket from /api/sse/ticket endpoint
 *
 * DEPRECATED (for backward compatibility only, will be removed):
 * - token: Auth token (INSECURE - leaks to logs/history)
 * - userId: User ID (INSECURE - leaks to logs/history)
 */
router.get('/workflow/:workflowId', async (req: Request, res: Response) => {
  const { workflowId } = req.params
  const { ticket, token } = req.query
  let clerkUserId = req.headers['x-clerk-user-id'] as string

  const isDev = process.env.NODE_ENV !== 'production'

  // PREFERRED: Ticket-based authentication (secure)
  if (ticket && typeof ticket === 'string') {
    const validatedTicket = validateAndConsumeTicket(ticket, workflowId)
    if (validatedTicket) {
      clerkUserId = validatedTicket.userId
      console.log(`[SSE] Authenticated via secure ticket for workflow ${workflowId}`)
    } else {
      return res.status(401).json({ error: 'Invalid or expired ticket' })
    }
  }
  // DEPRECATED: Token in URL (insecure, for backward compatibility)
  else if (token) {
    console.warn(`[SSE] WARNING: Using deprecated token-in-URL authentication for workflow ${workflowId}. This is insecure and will be removed.`)
    // In dev mode, accept the token but log warning
    if (isDev) {
      clerkUserId = clerkUserId || 'dev-user-local'
    } else {
      // In production, reject token-in-URL after transition period
      // For now, allow but log security warning
      console.error(`[SECURITY] Token exposed in URL for workflow ${workflowId}. Client needs to be updated.`)
    }
  }
  // Header-based authentication (also acceptable)
  else if (!clerkUserId) {
    if (isDev) {
      clerkUserId = 'dev-user-local'
      console.log('[DEV MODE] SSE using dev-user-local for authentication')
    } else {
      return res.status(401).json({ error: 'Authentication required. Use POST /api/sse/ticket to get a secure ticket.' })
    }
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering
  res.flushHeaders()

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', workflowId })}\n\n`)

  // Add connection to active connections
  if (!activeConnections.has(workflowId)) {
    activeConnections.set(workflowId, new Set())
  }
  activeConnections.get(workflowId)!.add(res)

  console.log(`SSE: Client connected to workflow ${workflowId}`)

  // Set up polling for workflow updates (fallback when Supabase realtime isn't available)
  const supabase = getSupabaseClient()
  let lastNodeStates: Record<string, string> = {}
  let lastWorkflowStatus: string | null = null

  const pollInterval = setInterval(async () => {
    try {
      // Check workflow status
      const { data: workflow } = await supabase
        .from('workflows')
        .select('status, updated_at, total_tokens_used, total_cost_usd')
        .eq('id', workflowId)
        .single()

      if (workflow && workflow.status !== lastWorkflowStatus) {
        lastWorkflowStatus = workflow.status
        res.write(`data: ${JSON.stringify({
          type: 'workflow_status',
          workflowId,
          status: workflow.status,
          tokensUsed: workflow.total_tokens_used,
          costUsd: workflow.total_cost_usd,
          updatedAt: workflow.updated_at,
        })}\n\n`)
      }

      // Check node updates
      const { data: nodes } = await supabase
        .from('workflow_nodes')
        .select('*')
        .eq('workflow_id', workflowId)

      if (nodes) {
        for (const node of nodes) {
          const key = `${node.node_id}`
          const currentState = `${node.status}:${node.updated_at}`

          if (lastNodeStates[key] !== currentState) {
            lastNodeStates[key] = currentState
            res.write(`data: ${JSON.stringify({
              type: 'node_update',
              workflowId,
              node: {
                id: node.id,
                node_id: node.node_id,
                status: node.status,
                label: node.label,
                node_type: node.node_type,
                tokens_used: node.tokens_used,
                cost_usd: node.cost_usd,
                output: node.output,
                started_at: node.started_at,
                completed_at: node.completed_at,
              },
            })}\n\n`)
          }
        }
      }

      // Check for new checkpoints
      const { data: checkpoints } = await supabase
        .from('workflow_states')
        .select('checkpoint_name, created_at, tokens_used_in_step, cost_usd_in_step')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (checkpoints && checkpoints.length > 0) {
        const latest = checkpoints[0]
        res.write(`data: ${JSON.stringify({
          type: 'checkpoint',
          workflowId,
          checkpoint: latest.checkpoint_name,
          tokensUsed: latest.tokens_used_in_step,
          costUsd: latest.cost_usd_in_step,
          createdAt: latest.created_at,
        })}\n\n`)
      }
    } catch (error) {
      console.error('SSE polling error:', error)
    }
  }, 2000) // Poll every 2 seconds

  // Keep-alive ping every 30 seconds
  const pingInterval = setInterval(() => {
    res.write(`: ping\n\n`)
  }, 30000)

  // Handle client disconnect
  req.on('close', () => {
    console.log(`SSE: Client disconnected from workflow ${workflowId}`)
    clearInterval(pollInterval)
    clearInterval(pingInterval)
    activeConnections.get(workflowId)?.delete(res)
    if (activeConnections.get(workflowId)?.size === 0) {
      activeConnections.delete(workflowId)
    }
  })
})

/**
 * Broadcast update to all connected clients for a workflow
 * Supports both (workflowId, data) and ({ workflowId, ...data }) signatures
 */
export function broadcastWorkflowUpdate(
  workflowIdOrData: string | { workflowId: string; type: string; stepId?: string; data?: Record<string, unknown> },
  data?: Record<string, unknown>
) {
  let workflowId: string
  let payload: Record<string, unknown>

  if (typeof workflowIdOrData === 'string') {
    // Legacy signature: (workflowId, data)
    workflowId = workflowIdOrData
    payload = data || {}
  } else {
    // New signature: ({ workflowId, type, stepId, data })
    workflowId = workflowIdOrData.workflowId
    payload = workflowIdOrData
  }

  const connections = activeConnections.get(workflowId)
  if (connections) {
    const message = `data: ${JSON.stringify(payload)}\n\n`
    connections.forEach((res) => {
      try {
        res.write(message)
      } catch {
        // Connection might be closed
      }
    })
    console.log(`SSE: Broadcast to ${connections.size} clients for workflow ${workflowId}:`, payload.type || 'update')
  }

  // Also broadcast to any global listeners (for dashboard overview)
  const globalConnections = activeConnections.get('*')
  if (globalConnections) {
    const message = `data: ${JSON.stringify({ ...payload, workflowId })}\n\n`
    globalConnections.forEach((res) => {
      try {
        res.write(message)
      } catch {
        // Connection might be closed
      }
    })
  }
}

/**
 * GET /api/sse/status
 * Get SSE connection status
 */
router.get('/status', (_req: Request, res: Response) => {
  const status = {
    activeWorkflows: activeConnections.size,
    totalConnections: Array.from(activeConnections.values()).reduce((sum, set) => sum + set.size, 0),
    workflowIds: Array.from(activeConnections.keys()),
  }
  res.json({ success: true, data: status })
})

export default router

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withSecurityHeaders } from '../_lib/security-headers.js'
import { randomUUID } from 'crypto'

/**
 * Composio Consolidated API Handler
 * Handles all /api/composio/* routes in a single serverless function
 *
 * Routes:
 * - /api/composio or /api/composio/status → status
 * - /api/composio/execute → execute
 * - /api/composio/connect → connect
 * - /api/composio/tools → tools
 * - /api/composio/user → user
 * - /api/composio/session → session
 */

// ============================================================================
// Route Handler
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withSecurityHeaders(req, res)) return

  // Extract path from URL
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const pathParts = url.pathname.replace('/api/composio', '').split('/').filter(Boolean)
  const route = pathParts[0] || 'status'

  const apiKey = process.env.COMPOSIO_API_KEY
  const isDemoMode = !apiKey || apiKey.length < 10

  try {
    switch (route) {
      case 'status':
        return handleStatus(req, res, isDemoMode)
      case 'execute':
        return handleExecute(req, res, isDemoMode, apiKey)
      case 'connect':
        return handleConnect(req, res, isDemoMode, apiKey)
      case 'tools':
        return handleTools(req, res, isDemoMode, apiKey)
      case 'user':
        return handleUser(req, res, isDemoMode, apiKey)
      case 'session':
        return handleSession(req, res, isDemoMode, apiKey)
      default:
        return res.status(404).json({ success: false, error: `Unknown route: ${route}` })
    }
  } catch (error: any) {
    console.error(`Composio ${route} error:`, error)
    res.status(500).json({ success: false, error: error.message || 'Internal server error' })
  }
}

// ============================================================================
// Status Handler
// ============================================================================

function handleStatus(_req: VercelRequest, res: VercelResponse, isDemoMode: boolean) {
  res.json({
    success: true,
    status: isDemoMode ? 'demo' : 'configured',
    isDemoMode,
    message: isDemoMode
      ? 'Running in demo mode. Set COMPOSIO_API_KEY for real execution.'
      : 'Composio is configured and ready.',
    timestamp: new Date().toISOString()
  })
}

// ============================================================================
// Execute Handler
// ============================================================================

const DEMO_RESPONSES: Record<string, unknown> = {
  GMAIL_SEND_EMAIL: { messageId: `msg_demo_${Date.now()}`, status: 'sent' },
  SLACK_SEND_MESSAGE: { ok: true, channel: 'C_DEMO', ts: `${Date.now()}.000000` },
  GOOGLECALENDAR_CREATE_EVENT: { eventId: `evt_demo_${Date.now()}`, status: 'confirmed' },
  GOOGLESHEETS_APPEND_DATA: { updatedRange: 'Sheet1!A1:D10', updatedRows: 1 },
  GITHUB_CREATE_ISSUE: { id: Date.now(), number: Math.floor(Math.random() * 1000), state: 'open' },
  NOTION_CREATE_PAGE: { id: `page_demo_${Date.now()}`, url: 'https://notion.so/demo-page' }
}

function getDemoResponse(toolSlug: string): unknown {
  if (DEMO_RESPONSES[toolSlug]) return DEMO_RESPONSES[toolSlug]
  for (const [key, value] of Object.entries(DEMO_RESPONSES)) {
    if (toolSlug.startsWith(key.split('_')[0])) return value
  }
  return { success: true, message: `Demo execution of ${toolSlug}`, timestamp: new Date().toISOString() }
}

async function handleExecute(req: VercelRequest, res: VercelResponse, isDemoMode: boolean, apiKey: string | undefined) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { toolSlug, params, tools, sequential = true } = req.body

  // Batch execution mode
  if (tools && Array.isArray(tools)) {
    if (isDemoMode) {
      const results = tools.map((tool: any) => ({ toolSlug: tool.toolSlug, success: true, data: getDemoResponse(tool.toolSlug) }))
      return res.json({ success: true, results, totalExecuted: results.length, successCount: results.length, isDemoMode: true })
    }
    // Real batch execution
    const { Composio } = await import('@composio/core')
    const composio = new Composio({ apiKey })
    const results: any[] = []

    for (const tool of tools) {
      try {
        const result = await composio.tools.execute(tool.toolSlug, { arguments: tool.params || {}, userId: 'default' })
        results.push({ toolSlug: tool.toolSlug, success: true, data: result?.data || result })
        if (!sequential) continue
      } catch (error: any) {
        results.push({ toolSlug: tool.toolSlug, success: false, error: error.message })
        if (sequential) break
      }
    }
    return res.json({ success: results.every(r => r.success), results, totalExecuted: results.length, successCount: results.filter(r => r.success).length, isDemoMode: false })
  }

  // Single execution mode
  if (!toolSlug) {
    return res.status(400).json({ success: false, error: 'toolSlug is required' })
  }

  if (isDemoMode) {
    return res.json({ success: true, data: getDemoResponse(toolSlug), toolSlug, isDemoMode: true })
  }

  const { Composio } = await import('@composio/core')
  const composio = new Composio({ apiKey })
  const result = await composio.tools.execute(toolSlug, { arguments: params || {}, userId: 'default' })
  res.json({ success: true, data: result?.data || result, toolSlug, isDemoMode: false })
}

// ============================================================================
// Connect Handler
// ============================================================================

async function handleConnect(req: VercelRequest, res: VercelResponse, isDemoMode: boolean, apiKey: string | undefined) {
  // GET: Check connection status
  if (req.method === 'GET') {
    const toolkit = req.query.toolkit as string
    if (!toolkit) {
      return res.status(400).json({ success: false, error: 'toolkit query parameter is required' })
    }

    if (isDemoMode) {
      const demoConnected = ['gmail', 'slack', 'googlecalendar', 'github'].includes(toolkit.toLowerCase())
      return res.json({ success: true, connected: demoConnected, toolkit, isDemoMode: true, authUrl: demoConnected ? null : `https://app.composio.dev/apps/${toolkit}` })
    }

    const { Composio } = await import('@composio/core')
    const composio = new Composio({ apiKey })
    const connectionsResponse = await composio.connectedAccounts.list({ toolkitSlugs: [toolkit] })
    const connections = (connectionsResponse as any).items || connectionsResponse
    const isConnected = Array.isArray(connections) ? connections.length > 0 : false
    return res.json({ success: true, connected: isConnected, toolkit, isDemoMode: false, authUrl: isConnected ? null : `https://app.composio.dev/apps/${toolkit}` })
  }

  // POST: Initiate OAuth connection
  if (req.method === 'POST') {
    const { toolkit, userId } = req.body
    if (!toolkit) {
      return res.status(400).json({ success: false, error: 'toolkit is required' })
    }

    if (isDemoMode) {
      return res.json({ success: true, authUrl: `https://app.composio.dev/apps/${toolkit}?demo=true`, toolkit, isDemoMode: true })
    }

    const { Composio } = await import('@composio/core')
    const composio = new Composio({ apiKey })
    const redirectUrl = process.env.COMPOSIO_REDIRECT_URL || `${process.env.VERCEL_URL || 'https://nexus-theta-peach.vercel.app'}/oauth/callback`
    const connection = await (composio as any).authorize(userId || 'default', toolkit, { redirectUrl })
    return res.json({ success: true, authUrl: connection.redirectUrl || `https://app.composio.dev/apps/${toolkit}`, connectionId: connection.id, toolkit, isDemoMode: false })
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

// ============================================================================
// Tools Handler
// ============================================================================

const TOOL_CATALOG: Record<string, Array<{ slug: string; name: string; description: string }>> = {
  gmail: [
    { slug: 'GMAIL_SEND_EMAIL', name: 'Send Email', description: 'Send an email via Gmail' },
    { slug: 'GMAIL_FETCH_EMAILS', name: 'Fetch Emails', description: 'Get emails from inbox' }
  ],
  slack: [
    { slug: 'SLACK_SEND_MESSAGE', name: 'Send Message', description: 'Send a message to a channel' },
    { slug: 'SLACK_LIST_CHANNELS', name: 'List Channels', description: 'Get list of channels' }
  ],
  googlecalendar: [
    { slug: 'GOOGLECALENDAR_CREATE_EVENT', name: 'Create Event', description: 'Create calendar event' },
    { slug: 'GOOGLECALENDAR_GET_EVENTS', name: 'Get Events', description: 'List calendar events' }
  ],
  googlesheets: [
    { slug: 'GOOGLESHEETS_APPEND_DATA', name: 'Append Data', description: 'Add rows to spreadsheet' },
    { slug: 'GOOGLESHEETS_GET_DATA', name: 'Get Data', description: 'Read spreadsheet data' }
  ],
  github: [
    { slug: 'GITHUB_CREATE_ISSUE', name: 'Create Issue', description: 'Create a GitHub issue' },
    { slug: 'GITHUB_LIST_ISSUES', name: 'List Issues', description: 'Get repository issues' }
  ],
  notion: [
    { slug: 'NOTION_CREATE_PAGE', name: 'Create Page', description: 'Create a Notion page' },
    { slug: 'NOTION_UPDATE_PAGE', name: 'Update Page', description: 'Update page content' }
  ]
}

async function handleTools(req: VercelRequest, res: VercelResponse, isDemoMode: boolean, apiKey: string | undefined) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const toolkit = req.query.toolkit as string

  if (isDemoMode || !toolkit) {
    if (toolkit) {
      const tools = TOOL_CATALOG[toolkit.toLowerCase()] || []
      return res.json({ success: true, toolkit, tools, isDemoMode: true, totalTools: tools.length })
    }
    const allToolkits = Object.keys(TOOL_CATALOG).map(name => ({ name, toolCount: TOOL_CATALOG[name].length }))
    return res.json({ success: true, toolkits: allToolkits, totalToolkits: allToolkits.length, isDemoMode: true })
  }

  const { Composio } = await import('@composio/core')
  const composio = new Composio({ apiKey })
  const toolsApi = (composio as any).tools
  const toolsResponse = toolsApi?.list ? await toolsApi.list({ apps: [toolkit] }) : []
  const tools = Array.isArray(toolsResponse) ? toolsResponse : ((toolsResponse as any)?.items || [])
  res.json({ success: true, toolkit, tools: tools.map((t: any) => ({ slug: t.name || t.slug, name: t.displayName || t.name, description: t.description })), totalTools: tools.length, isDemoMode: false })
}

// ============================================================================
// User Handler
// ============================================================================

async function handleUser(req: VercelRequest, res: VercelResponse, isDemoMode: boolean, apiKey: string | undefined) {
  const { userId, action, appId } = req.query as { userId?: string; action?: string; appId?: string }

  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId is required' })
  }

  if (action === 'apps') {
    if (isDemoMode) {
      return res.json({ success: true, userId, apps: [{ id: 'gmail', name: 'Gmail', connected: true }, { id: 'slack', name: 'Slack', connected: true }], isDemoMode: true })
    }
    const { Composio } = await import('@composio/core')
    const composio = new Composio({ apiKey })
    const connections = await composio.connectedAccounts.list({ userIds: [userId] })
    const apps = connections.items.map((conn: any) => ({ id: conn.toolkit?.slug || 'unknown', name: conn.toolkit?.slug || 'Unknown', connected: true, connectionId: conn.id }))
    return res.json({ success: true, userId, apps, isDemoMode: false })
  }

  if (action === 'connect' && req.method === 'POST') {
    if (!appId) return res.status(400).json({ success: false, error: 'appId is required' })
    if (isDemoMode) return res.json({ success: true, authUrl: `https://app.composio.dev/apps/${appId}?demo=true`, userId, appId, isDemoMode: true })
    const { Composio } = await import('@composio/core')
    const composio = new Composio({ apiKey })
    const connection = await composio.toolkits.authorize(userId, appId)
    return res.json({ success: true, authUrl: connection.redirectUrl || '', connectionId: connection.id, userId, appId, isDemoMode: false })
  }

  if (action === 'disconnect' && req.method === 'DELETE') {
    if (!appId) return res.status(400).json({ success: false, error: 'appId is required' })
    if (isDemoMode) return res.json({ success: true, userId, appId, isDemoMode: true, message: 'Demo: disconnection simulated' })
    const { Composio } = await import('@composio/core')
    const composio = new Composio({ apiKey })
    const connections = await composio.connectedAccounts.list({ userIds: [userId], toolkitSlugs: [appId] })
    for (const conn of connections.items) { await composio.connectedAccounts.delete(conn.id) }
    return res.json({ success: true, userId, appId, isDemoMode: false })
  }

  if (action === 'execute' && req.method === 'POST') {
    const { toolSlug, params } = req.body
    if (!toolSlug) return res.status(400).json({ success: false, error: 'toolSlug is required' })
    if (isDemoMode) return res.json({ success: true, data: { message: `Demo execution of ${toolSlug}` }, toolSlug, userId, isDemoMode: true })
    const { Composio } = await import('@composio/core')
    const composio = new Composio({ apiKey })
    const connections = await composio.connectedAccounts.list({ userIds: [userId] })
    const connectedAccountId = connections.items[0]?.id
    if (!connectedAccountId) throw new Error(`No connected account found for user: ${userId}`)
    const result = await composio.tools.execute(toolSlug, { connectedAccountId, ...(params || {}) })
    return res.json({ success: true, data: result?.data || result, toolSlug, userId, isDemoMode: false })
  }

  return res.status(400).json({ success: false, error: 'action is required (apps, connect, disconnect, execute)' })
}

// ============================================================================
// Session Handler
// ============================================================================

async function handleSession(req: VercelRequest, res: VercelResponse, isDemoMode: boolean, apiKey: string | undefined) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const sessionId = randomUUID()
  const defaultToolkits = ['gmail', 'slack', 'googlecalendar', 'googlesheets', 'github', 'notion', 'hubspot', 'shopify', 'stripe']

  if (isDemoMode) {
    return res.json({ success: true, sessionId, isDemoMode: true, message: 'Demo mode - set COMPOSIO_API_KEY for real execution', availableToolkits: defaultToolkits })
  }

  try {
    const { Composio } = await import('@composio/core')
    const composio = new Composio({ apiKey })
    const appsApi = (composio as any).apps || (composio as any).toolkits
    const apps = appsApi ? await appsApi.list() : []
    const appList = Array.isArray(apps) ? apps : ((apps as any).items || [])
    const availableToolkits = appList.slice(0, 50).map((app: any) => app.name || app.key || app.slug)
    res.json({ success: true, sessionId, isDemoMode: false, availableToolkits })
  } catch (error: any) {
    res.json({ success: true, sessionId, isDemoMode: true, fallback: true, error: error.message, availableToolkits: defaultToolkits })
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withSecurityHeaders } from '../_lib/security-headers.js'

/**
 * Rube Consolidated API Handler
 * Handles all /api/rube/* routes in a single serverless function
 *
 * Routes:
 * - /api/rube or /api/rube/status → status
 * - /api/rube/search-tools → searchTools
 * - /api/rube/manage-connections → manageConnections
 * - /api/rube/get-tool-schemas → getToolSchemas
 * - /api/rube/execute → execute
 * - /api/rube/connection-status/:toolkit → connectionStatus
 *
 * @NEXUS-FIX-053: Rube MCP proxy for browser tool discovery
 * @NEXUS-FIX-060: Dry-run capability for pre-flight validation
 */

// ============================================================================
// Route Handler
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withSecurityHeaders(req, res)) return

  // Extract path from URL
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const pathParts = url.pathname.replace('/api/rube', '').split('/').filter(Boolean)
  const route = pathParts[0] || 'status'

  const apiKey = process.env.COMPOSIO_API_KEY
  const isDemoMode = !apiKey || apiKey.length < 10

  try {
    switch (route) {
      case 'status':
        return handleStatus(req, res, isDemoMode, apiKey)
      case 'search-tools':
        return handleSearchTools(req, res, isDemoMode)
      case 'manage-connections':
        return handleManageConnections(req, res, isDemoMode, apiKey)
      case 'get-tool-schemas':
        return handleGetToolSchemas(req, res, isDemoMode)
      case 'execute':
        return handleExecute(req, res, isDemoMode, apiKey)
      case 'connection-status':
        // Handle /api/rube/connection-status/:toolkit
        const toolkit = pathParts[1]
        return handleConnectionStatus(req, res, isDemoMode, apiKey, toolkit)
      default:
        return res.status(404).json({ success: false, error: `Unknown route: ${route}` })
    }
  } catch (error: any) {
    console.error(`Rube ${route} error:`, error)
    res.status(500).json({ success: false, error: error.message || 'Internal server error' })
  }
}

// ============================================================================
// Status Handler
// ============================================================================

async function handleStatus(req: VercelRequest, res: VercelResponse, isDemoMode: boolean, apiKey: string | undefined) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  if (isDemoMode) {
    return res.json({
      initialized: true,
      available: true,
      isDemoMode: true,
      message: 'Rube MCP proxy running in demo mode. Configure COMPOSIO_API_KEY for production.',
      features: { searchTools: true, connectionStatus: true, manageConnections: true, execute: true }
    })
  }

  try {
    const { Composio } = await import('@composio/core')
    const composio = new Composio({ apiKey })
    await composio.connectedAccounts.list({ toolkitSlugs: ['gmail'] })

    res.json({
      initialized: true,
      available: true,
      isDemoMode: false,
      message: 'Rube MCP proxy connected to Composio',
      features: { searchTools: true, connectionStatus: true, manageConnections: true, execute: true }
    })
  } catch (composioError: any) {
    console.error('Composio connectivity check failed:', composioError)
    res.json({
      initialized: true,
      available: false,
      isDemoMode: false,
      message: `Composio connection error: ${composioError.message}`,
      features: { searchTools: true, connectionStatus: false, manageConnections: false, execute: false }
    })
  }
}

// ============================================================================
// Tool Catalog for Search
// ============================================================================

const TOOL_CATALOG: Record<string, Array<{ slug: string; name: string; description: string }>> = {
  gmail: [
    { slug: 'GMAIL_SEND_EMAIL', name: 'Send Email', description: 'Send an email via Gmail' },
    { slug: 'GMAIL_FETCH_EMAILS', name: 'Fetch Emails', description: 'Get emails from inbox' },
    { slug: 'GMAIL_CREATE_DRAFT', name: 'Create Draft', description: 'Create email draft' },
    { slug: 'GMAIL_SEARCH_EMAILS', name: 'Search Emails', description: 'Search emails by query' },
    { slug: 'GMAIL_GET_MESSAGE', name: 'Get Message', description: 'Get a specific email message' },
    { slug: 'GMAIL_LIST_MESSAGES', name: 'List Messages', description: 'List email messages' },
  ],
  slack: [
    { slug: 'SLACK_SEND_MESSAGE', name: 'Send Message', description: 'Send a message to a channel' },
    { slug: 'SLACK_LIST_CHANNELS', name: 'List Channels', description: 'Get list of channels' },
    { slug: 'SLACK_CREATE_CHANNEL', name: 'Create Channel', description: 'Create a new channel' },
    { slug: 'SLACK_GET_MESSAGE', name: 'Get Message', description: 'Get a specific message' },
    { slug: 'SLACK_SEARCH_MESSAGES', name: 'Search Messages', description: 'Search messages in workspace' },
  ],
  googlecalendar: [
    { slug: 'GOOGLECALENDAR_CREATE_EVENT', name: 'Create Event', description: 'Create calendar event' },
    { slug: 'GOOGLECALENDAR_GET_EVENTS', name: 'Get Events', description: 'List calendar events' },
    { slug: 'GOOGLECALENDAR_UPDATE_EVENT', name: 'Update Event', description: 'Update an event' },
    { slug: 'GOOGLECALENDAR_DELETE_EVENT', name: 'Delete Event', description: 'Delete a calendar event' },
  ],
  googlesheets: [
    { slug: 'GOOGLESHEETS_APPEND_DATA', name: 'Append Data', description: 'Add rows to spreadsheet' },
    { slug: 'GOOGLESHEETS_GET_DATA', name: 'Get Data', description: 'Read spreadsheet data' },
    { slug: 'GOOGLESHEETS_UPDATE_CELL', name: 'Update Cell', description: 'Update a cell value' },
    { slug: 'GOOGLESHEETS_CREATE_SHEET', name: 'Create Sheet', description: 'Create a new sheet' },
  ],
  github: [
    { slug: 'GITHUB_CREATE_ISSUE', name: 'Create Issue', description: 'Create a GitHub issue' },
    { slug: 'GITHUB_LIST_ISSUES', name: 'List Issues', description: 'Get repository issues' },
    { slug: 'GITHUB_CREATE_PR', name: 'Create PR', description: 'Create pull request' },
    { slug: 'GITHUB_GET_REPO', name: 'Get Repository', description: 'Get repository details' },
  ],
  notion: [
    { slug: 'NOTION_CREATE_PAGE', name: 'Create Page', description: 'Create a Notion page' },
    { slug: 'NOTION_UPDATE_PAGE', name: 'Update Page', description: 'Update page content' },
    { slug: 'NOTION_SEARCH', name: 'Search', description: 'Search Notion workspace' },
  ],
  dropbox: [
    { slug: 'DROPBOX_UPLOAD_FILE', name: 'Upload File', description: 'Upload a file to Dropbox' },
    { slug: 'DROPBOX_DOWNLOAD_FILE', name: 'Download File', description: 'Download a file from Dropbox' },
    { slug: 'DROPBOX_LIST_FOLDER', name: 'List Folder', description: 'List files in a folder' },
    { slug: 'DROPBOX_CREATE_FOLDER', name: 'Create Folder', description: 'Create a new folder' },
    { slug: 'DROPBOX_DELETE_FILE', name: 'Delete File', description: 'Delete a file or folder' },
  ],
  onedrive: [
    { slug: 'ONEDRIVE_UPLOAD_FILE', name: 'Upload File', description: 'Upload a file to OneDrive' },
    { slug: 'ONEDRIVE_DOWNLOAD_FILE', name: 'Download File', description: 'Download a file from OneDrive' },
    { slug: 'ONEDRIVE_LIST_FILES', name: 'List Files', description: 'List files in a folder' },
  ],
  googledrive: [
    { slug: 'GOOGLEDRIVE_UPLOAD_FILE', name: 'Upload File', description: 'Upload a file to Google Drive' },
    { slug: 'GOOGLEDRIVE_DOWNLOAD_FILE', name: 'Download File', description: 'Download a file' },
    { slug: 'GOOGLEDRIVE_LIST_FILES', name: 'List Files', description: 'List files in a folder' },
    { slug: 'GOOGLEDRIVE_CREATE_FOLDER', name: 'Create Folder', description: 'Create a new folder' },
  ],
  hubspot: [
    { slug: 'HUBSPOT_CREATE_CONTACT', name: 'Create Contact', description: 'Create a contact' },
    { slug: 'HUBSPOT_CREATE_DEAL', name: 'Create Deal', description: 'Create a deal' },
    { slug: 'HUBSPOT_SEARCH_CONTACTS', name: 'Search Contacts', description: 'Search contacts' },
  ],
  stripe: [
    { slug: 'STRIPE_CREATE_CUSTOMER', name: 'Create Customer', description: 'Create a customer' },
    { slug: 'STRIPE_CREATE_INVOICE', name: 'Create Invoice', description: 'Create an invoice' },
    { slug: 'STRIPE_LIST_PAYMENTS', name: 'List Payments', description: 'Get payment history' },
  ],
  whatsapp: [
    { slug: 'WHATSAPP_SEND_MESSAGE', name: 'Send Message', description: 'Send a WhatsApp message' },
    { slug: 'WHATSAPP_SEND_TEMPLATE', name: 'Send Template', description: 'Send a template message' },
  ],
  wave: [
    { slug: 'WAVE_CREATE_INVOICE', name: 'Create Invoice', description: 'Create a new invoice' },
    { slug: 'WAVE_GET_INVOICES', name: 'Get Invoices', description: 'List invoices' },
    { slug: 'WAVE_CREATE_CUSTOMER', name: 'Create Customer', description: 'Create a customer' },
  ],
  freshbooks: [
    { slug: 'FRESHBOOKS_CREATE_INVOICE', name: 'Create Invoice', description: 'Create a new invoice' },
    { slug: 'FRESHBOOKS_GET_INVOICES', name: 'Get Invoices', description: 'List invoices' },
    { slug: 'FRESHBOOKS_CREATE_CLIENT', name: 'Create Client', description: 'Create a client' },
    { slug: 'FRESHBOOKS_CREATE_EXPENSE', name: 'Create Expense', description: 'Create an expense' },
  ],
  xero: [
    { slug: 'XERO_CREATE_INVOICE', name: 'Create Invoice', description: 'Create a new invoice' },
    { slug: 'XERO_GET_INVOICES', name: 'Get Invoices', description: 'List invoices' },
    { slug: 'XERO_CREATE_CONTACT', name: 'Create Contact', description: 'Create a contact' },
  ],
  quickbooks: [
    { slug: 'QUICKBOOKS_CREATE_INVOICE', name: 'Create Invoice', description: 'Create a new invoice' },
    { slug: 'QUICKBOOKS_GET_INVOICES', name: 'Get Invoices', description: 'List invoices' },
    { slug: 'QUICKBOOKS_CREATE_CUSTOMER', name: 'Create Customer', description: 'Create a customer' },
  ],
  discord: [
    { slug: 'DISCORD_SEND_MESSAGE', name: 'Send Message', description: 'Send a Discord message' },
    { slug: 'DISCORD_CREATE_CHANNEL', name: 'Create Channel', description: 'Create a channel' },
  ],
  trello: [
    { slug: 'TRELLO_CREATE_CARD', name: 'Create Card', description: 'Create a Trello card' },
    { slug: 'TRELLO_UPDATE_CARD', name: 'Update Card', description: 'Update a card' },
    { slug: 'TRELLO_LIST_CARDS', name: 'List Cards', description: 'List cards in a board' },
  ],
  asana: [
    { slug: 'ASANA_CREATE_TASK', name: 'Create Task', description: 'Create an Asana task' },
    { slug: 'ASANA_UPDATE_TASK', name: 'Update Task', description: 'Update a task' },
    { slug: 'ASANA_LIST_TASKS', name: 'List Tasks', description: 'List tasks in a project' },
  ],
  linear: [
    { slug: 'LINEAR_CREATE_ISSUE', name: 'Create Issue', description: 'Create a Linear issue' },
    { slug: 'LINEAR_UPDATE_ISSUE', name: 'Update Issue', description: 'Update an issue' },
    { slug: 'LINEAR_LIST_ISSUES', name: 'List Issues', description: 'List issues' },
  ],
  jira: [
    { slug: 'JIRA_CREATE_ISSUE', name: 'Create Issue', description: 'Create a Jira issue' },
    { slug: 'JIRA_UPDATE_ISSUE', name: 'Update Issue', description: 'Update an issue' },
    { slug: 'JIRA_LIST_ISSUES', name: 'List Issues', description: 'List issues in a project' },
  ],
  zoom: [
    { slug: 'ZOOM_CREATE_MEETING', name: 'Create Meeting', description: 'Create a Zoom meeting' },
    { slug: 'ZOOM_LIST_MEETINGS', name: 'List Meetings', description: 'List scheduled meetings' },
  ],
  twitter: [
    { slug: 'TWITTER_POST_TWEET', name: 'Post Tweet', description: 'Post a tweet' },
    { slug: 'TWITTER_GET_TWEETS', name: 'Get Tweets', description: 'Get recent tweets' },
  ],
  linkedin: [
    { slug: 'LINKEDIN_POST_UPDATE', name: 'Post Update', description: 'Post a LinkedIn update' },
  ],
  airtable: [
    { slug: 'AIRTABLE_CREATE_RECORD', name: 'Create Record', description: 'Create a record' },
    { slug: 'AIRTABLE_UPDATE_RECORD', name: 'Update Record', description: 'Update a record' },
    { slug: 'AIRTABLE_LIST_RECORDS', name: 'List Records', description: 'List records in a base' },
  ],
}

function generateToolsForUnknownToolkit(toolkit: string): Array<{ slug: string; name: string; description: string }> {
  const toolkitUpper = toolkit.toUpperCase()
  const toolkitCapitalized = toolkit.charAt(0).toUpperCase() + toolkit.slice(1).toLowerCase()
  return [
    { slug: `${toolkitUpper}_CREATE`, name: 'Create', description: `Create a new item in ${toolkitCapitalized}` },
    { slug: `${toolkitUpper}_GET`, name: 'Get', description: `Get an item from ${toolkitCapitalized}` },
    { slug: `${toolkitUpper}_LIST`, name: 'List', description: `List items in ${toolkitCapitalized}` },
    { slug: `${toolkitUpper}_UPDATE`, name: 'Update', description: `Update an item in ${toolkitCapitalized}` },
    { slug: `${toolkitUpper}_DELETE`, name: 'Delete', description: `Delete an item from ${toolkitCapitalized}` },
    { slug: `${toolkitUpper}_SEARCH`, name: 'Search', description: `Search for items in ${toolkitCapitalized}` },
  ]
}

function scoreToolMatch(tool: { slug: string; name: string; description: string }, query: string): number {
  const queryLower = query.toLowerCase()
  const slugLower = tool.slug.toLowerCase()
  const nameLower = tool.name.toLowerCase()
  const descLower = tool.description.toLowerCase()
  let score = 0

  const keywords = queryLower.split(/\s+/)
  for (const keyword of keywords) {
    if (keyword.length < 3) continue
    if (slugLower.includes(keyword)) score += 10
    if (nameLower.includes(keyword)) score += 8
    if (descLower.includes(keyword)) score += 5
  }

  const actionWords: Record<string, string[]> = {
    send: ['send', 'post', 'deliver', 'email', 'message'],
    create: ['create', 'add', 'new', 'make', 'generate'],
    get: ['get', 'fetch', 'read', 'retrieve', 'download'],
    list: ['list', 'show', 'display', 'view', 'all'],
    update: ['update', 'edit', 'modify', 'change'],
    delete: ['delete', 'remove', 'trash'],
    search: ['search', 'find', 'query', 'lookup'],
    upload: ['upload', 'save', 'store', 'put'],
  }

  for (const [action, synonyms] of Object.entries(actionWords)) {
    const hasQueryMatch = synonyms.some(s => queryLower.includes(s))
    const hasSlugMatch = slugLower.includes(action)
    if (hasQueryMatch && hasSlugMatch) score += 15
  }

  return score
}

function searchTools(query: string, toolkit?: string): Array<{ slug: string; name: string; description: string; toolkit: string }> {
  const results: Array<{ slug: string; name: string; description: string; toolkit: string; score: number }> = []

  if (toolkit) {
    const toolkitLower = toolkit.toLowerCase()
    let tools = TOOL_CATALOG[toolkitLower]
    if (!tools) tools = generateToolsForUnknownToolkit(toolkitLower)

    for (const tool of tools) {
      const score = scoreToolMatch(tool, query)
      if (score > 0) results.push({ ...tool, toolkit: toolkitLower, score })
    }

    if (results.length === 0) return tools.map(tool => ({ ...tool, toolkit: toolkitLower }))
  } else {
    for (const [tk, tools] of Object.entries(TOOL_CATALOG)) {
      for (const tool of tools) {
        const score = scoreToolMatch(tool, query)
        if (score > 0) results.push({ ...tool, toolkit: tk, score })
      }
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, 10).map(({ score, ...tool }) => tool)
}

// ============================================================================
// Search Tools Handler
// ============================================================================

function handleSearchTools(req: VercelRequest, res: VercelResponse, isDemoMode: boolean) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { queries, session_id } = req.body

  if (!queries || !Array.isArray(queries)) {
    return res.status(400).json({ success: false, error: 'queries array is required' })
  }

  const responseSessionId = session_id || `nexus_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  const allTools: Array<{ slug: string; name: string; description: string; toolkit: string }> = []

  for (const query of queries) {
    const { use_case, known_fields } = query
    let toolkit: string | undefined
    if (known_fields) {
      const toolkitMatch = known_fields.match(/toolkit:\s*(\w+)/i)
      if (toolkitMatch) toolkit = toolkitMatch[1]
    }
    const results = searchTools(use_case, toolkit)
    allTools.push(...results)
  }

  const uniqueTools = Array.from(new Map(allTools.map(t => [t.slug, t])).values())
  const toolkits = [...new Set(uniqueTools.map(t => t.toolkit))]
  const connectionStatuses: Record<string, { connected: boolean; authUrl?: string }> = {}

  const demoConnected = ['gmail', 'slack', 'googlecalendar', 'github', 'googlesheets', 'notion']
  for (const tk of toolkits) {
    connectionStatuses[tk] = {
      connected: demoConnected.includes(tk.toLowerCase()),
      authUrl: `https://app.composio.dev/apps/${tk}`
    }
  }

  console.log(`[Rube Search] Found ${uniqueTools.length} tools for ${queries.length} queries`)

  res.json({
    success: true,
    tools: uniqueTools.map(t => ({ tool_slug: t.slug, name: t.name, description: t.description, toolkit: t.toolkit })),
    connection_statuses: connectionStatuses,
    session_id: responseSessionId,
    totalTools: uniqueTools.length
  })
}

// ============================================================================
// Manage Connections Handler
// ============================================================================

async function handleManageConnections(req: VercelRequest, res: VercelResponse, isDemoMode: boolean, apiKey: string | undefined) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { toolkits, session_id, reinitiate_all = false } = req.body

  if (!toolkits || !Array.isArray(toolkits)) {
    return res.status(400).json({ success: false, error: 'toolkits array is required' })
  }

  const results: Record<string, { status: string; redirect_url?: string; user_info?: { email?: string; name?: string } }> = {}

  if (isDemoMode) {
    const demoConnected = ['gmail', 'slack', 'googlecalendar', 'github', 'googlesheets', 'notion']
    for (const toolkit of toolkits) {
      const isConnected = demoConnected.includes(toolkit.toLowerCase()) && !reinitiate_all
      results[toolkit] = {
        status: isConnected ? 'active' : 'pending',
        redirect_url: isConnected ? undefined : `https://app.composio.dev/apps/${toolkit}?demo=true`,
        user_info: isConnected ? { email: 'demo@nexus.app', name: 'Demo User' } : undefined
      }
    }
    return res.json({ success: true, results, session_id: session_id || `nexus_${Date.now()}`, isDemoMode: true })
  }

  try {
    const { Composio } = await import('@composio/core')
    const composio = new Composio({ apiKey })
    const redirectUrl = process.env.COMPOSIO_REDIRECT_URL || `${process.env.VERCEL_URL || 'https://nexus-theta-peach.vercel.app'}/oauth/callback`

    for (const toolkit of toolkits) {
      try {
        const connectionsResponse = await composio.connectedAccounts.list({ toolkitSlugs: [toolkit] })
        const connections = (connectionsResponse as any).items || connectionsResponse
        const isConnected = Array.isArray(connections) ? connections.length > 0 : false

        if (isConnected && !reinitiate_all) {
          results[toolkit] = { status: 'active', user_info: connections[0]?.userInfo }
        } else {
          const connection = await (composio as any).authorize('default', toolkit, { redirectUrl })
          results[toolkit] = {
            status: 'pending',
            redirect_url: connection.redirectUrl || connection.connectionUrl || `https://app.composio.dev/apps/${toolkit}`
          }
        }
      } catch (toolkitError: any) {
        console.error(`Error connecting ${toolkit}:`, toolkitError)
        results[toolkit] = { status: 'error', redirect_url: `https://app.composio.dev/apps/${toolkit}` }
      }
    }

    res.json({ success: true, results, session_id: session_id || `nexus_${Date.now()}`, isDemoMode: false })
  } catch (composioError: any) {
    console.error('Composio manage connections error:', composioError)
    for (const toolkit of toolkits) {
      results[toolkit] = { status: 'pending', redirect_url: `https://app.composio.dev/apps/${toolkit}` }
    }
    res.json({ success: true, results, session_id: session_id || `nexus_${Date.now()}`, fallback: true, error: composioError.message })
  }
}

// ============================================================================
// Tool Schemas
// ============================================================================

const COMMON_SCHEMAS: Record<string, Record<string, { type: string; description: string; required?: boolean; format?: string }>> = {
  GMAIL_SEND_EMAIL: {
    to: { type: 'string', description: 'Recipient email address', required: true, format: 'email' },
    subject: { type: 'string', description: 'Email subject line', required: true },
    body: { type: 'string', description: 'Email body content', required: true },
    cc: { type: 'string', description: 'CC recipients (comma-separated)', format: 'email' },
    bcc: { type: 'string', description: 'BCC recipients (comma-separated)', format: 'email' },
  },
  GMAIL_FETCH_EMAILS: {
    max_results: { type: 'number', description: 'Maximum number of emails to fetch' },
    query: { type: 'string', description: 'Search query (Gmail search syntax)' },
  },
  SLACK_SEND_MESSAGE: {
    channel: { type: 'string', description: 'Slack channel name or ID', required: true },
    text: { type: 'string', description: 'Message text', required: true },
  },
  WHATSAPP_SEND_MESSAGE: {
    to: { type: 'string', description: 'Phone number with country code', required: true },
    text: { type: 'string', description: 'Message content', required: true },
  },
  DISCORD_SEND_MESSAGE: {
    channel_id: { type: 'string', description: 'Discord channel ID', required: true },
    content: { type: 'string', description: 'Message content', required: true },
  },
  GOOGLESHEETS_APPEND_DATA: {
    spreadsheet_id: { type: 'string', description: 'Google Spreadsheet ID or URL', required: true },
    range: { type: 'string', description: 'Cell range (e.g., Sheet1!A1)', required: true },
    values: { type: 'array', description: 'Data rows to append', required: true },
  },
  GOOGLESHEETS_GET_DATA: {
    spreadsheet_id: { type: 'string', description: 'Google Spreadsheet ID or URL', required: true },
    range: { type: 'string', description: 'Cell range to read', required: true },
  },
  DROPBOX_UPLOAD_FILE: {
    path: { type: 'string', description: 'Destination path in Dropbox', required: true },
    content: { type: 'string', description: 'File content' },
    file_url: { type: 'string', description: 'URL of file to upload', format: 'url' },
  },
  GOOGLEDRIVE_UPLOAD_FILE: {
    name: { type: 'string', description: 'File name', required: true },
    folder_id: { type: 'string', description: 'Destination folder ID' },
    content: { type: 'string', description: 'File content' },
  },
  ONEDRIVE_UPLOAD_FILE: {
    path: { type: 'string', description: 'Destination path', required: true },
    content: { type: 'string', description: 'File content' },
  },
  FRESHBOOKS_CREATE_INVOICE: {
    client_id: { type: 'string', description: 'Client/Customer ID', required: true },
    lines: { type: 'array', description: 'Invoice line items', required: true },
    due_date: { type: 'string', description: 'Payment due date', format: 'date' },
    notes: { type: 'string', description: 'Invoice notes' },
  },
  WAVE_CREATE_INVOICE: {
    customer_id: { type: 'string', description: 'Customer ID', required: true },
    items: { type: 'array', description: 'Invoice items', required: true },
    due_date: { type: 'string', description: 'Payment due date', format: 'date' },
    memo: { type: 'string', description: 'Invoice memo' },
  },
  XERO_CREATE_INVOICE: {
    contact_id: { type: 'string', description: 'Contact ID', required: true },
    line_items: { type: 'array', description: 'Invoice line items', required: true },
    due_date: { type: 'string', description: 'Due date', format: 'date' },
  },
  QUICKBOOKS_CREATE_INVOICE: {
    customer_ref: { type: 'string', description: 'Customer reference', required: true },
    line: { type: 'array', description: 'Invoice lines', required: true },
    due_date: { type: 'string', description: 'Due date', format: 'date' },
  },
  STRIPE_CREATE_INVOICE: {
    customer: { type: 'string', description: 'Stripe customer ID', required: true },
    collection_method: { type: 'string', description: 'How to collect payment' },
    auto_advance: { type: 'boolean', description: 'Auto-advance the invoice' },
  },
  GOOGLECALENDAR_CREATE_EVENT: {
    summary: { type: 'string', description: 'Event title', required: true },
    start_time: { type: 'string', description: 'Start time (ISO format)', required: true },
    end_time: { type: 'string', description: 'End time (ISO format)', required: true },
    description: { type: 'string', description: 'Event description' },
    location: { type: 'string', description: 'Event location' },
  },
  ZOOM_CREATE_MEETING: {
    topic: { type: 'string', description: 'Meeting topic', required: true },
    start_time: { type: 'string', description: 'Start time', required: true },
    duration: { type: 'number', description: 'Duration in minutes' },
  },
  GITHUB_CREATE_ISSUE: {
    repo: { type: 'string', description: 'Repository name (owner/repo)', required: true },
    title: { type: 'string', description: 'Issue title', required: true },
    body: { type: 'string', description: 'Issue description' },
    labels: { type: 'array', description: 'Labels to apply' },
  },
  TRELLO_CREATE_CARD: {
    list_id: { type: 'string', description: 'List ID', required: true },
    name: { type: 'string', description: 'Card name', required: true },
    desc: { type: 'string', description: 'Card description' },
  },
  ASANA_CREATE_TASK: {
    project_id: { type: 'string', description: 'Project ID', required: true },
    name: { type: 'string', description: 'Task name', required: true },
    notes: { type: 'string', description: 'Task notes' },
    due_on: { type: 'string', description: 'Due date', format: 'date' },
  },
  LINEAR_CREATE_ISSUE: {
    team_id: { type: 'string', description: 'Team ID', required: true },
    title: { type: 'string', description: 'Issue title', required: true },
    description: { type: 'string', description: 'Issue description' },
  },
  JIRA_CREATE_ISSUE: {
    project: { type: 'string', description: 'Project key', required: true },
    summary: { type: 'string', description: 'Issue summary', required: true },
    description: { type: 'string', description: 'Issue description' },
    issuetype: { type: 'string', description: 'Issue type (Bug, Task, etc.)' },
  },
  NOTION_CREATE_PAGE: {
    parent_id: { type: 'string', description: 'Parent page or database ID', required: true },
    title: { type: 'string', description: 'Page title', required: true },
    content: { type: 'string', description: 'Page content' },
  },
  HUBSPOT_CREATE_CONTACT: {
    email: { type: 'string', description: 'Contact email', required: true, format: 'email' },
    firstname: { type: 'string', description: 'First name' },
    lastname: { type: 'string', description: 'Last name' },
    phone: { type: 'string', description: 'Phone number' },
  },
  TWITTER_POST_TWEET: { text: { type: 'string', description: 'Tweet text (max 280 chars)', required: true } },
  LINKEDIN_POST_UPDATE: { text: { type: 'string', description: 'Post content', required: true } },
}

function generateGenericSchema(toolSlug: string): Record<string, { type: string; description: string; required?: boolean }> {
  const action = toolSlug.split('_').slice(1).join('_').toLowerCase()

  if (action.includes('send') || action.includes('post')) {
    return { text: { type: 'string', description: 'Message content', required: true }, to: { type: 'string', description: 'Recipient' } }
  }
  if (action.includes('create')) {
    return { name: { type: 'string', description: 'Name/title', required: true }, description: { type: 'string', description: 'Description' } }
  }
  if (action.includes('get') || action.includes('list')) {
    return { id: { type: 'string', description: 'Item ID' }, limit: { type: 'number', description: 'Maximum items to return' } }
  }
  if (action.includes('update')) {
    return { id: { type: 'string', description: 'Item ID', required: true }, data: { type: 'object', description: 'Fields to update' } }
  }
  if (action.includes('delete')) {
    return { id: { type: 'string', description: 'Item ID to delete', required: true } }
  }
  if (action.includes('upload')) {
    return { path: { type: 'string', description: 'Destination path', required: true }, content: { type: 'string', description: 'File content' } }
  }
  if (action.includes('search')) {
    return { query: { type: 'string', description: 'Search query', required: true }, limit: { type: 'number', description: 'Maximum results' } }
  }
  return { input: { type: 'string', description: 'Input data' } }
}

// ============================================================================
// Get Tool Schemas Handler
// ============================================================================

function handleGetToolSchemas(req: VercelRequest, res: VercelResponse, isDemoMode: boolean) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { tool_slugs, session_id } = req.body

  if (!tool_slugs || !Array.isArray(tool_slugs)) {
    return res.status(400).json({ success: false, error: 'tool_slugs array is required' })
  }

  const schemas: Array<{
    tool_slug: string
    toolkit: string
    properties: Record<string, { type: string; description: string; required?: boolean; format?: string }>
    required: string[]
  }> = []

  for (const toolSlug of tool_slugs) {
    const toolkit = toolSlug.split('_')[0]?.toLowerCase() || 'unknown'
    let properties = COMMON_SCHEMAS[toolSlug]
    if (!properties) properties = generateGenericSchema(toolSlug)

    const required = Object.entries(properties).filter(([_, def]) => def.required).map(([name]) => name)
    schemas.push({ tool_slug: toolSlug, toolkit, properties, required })
  }

  res.json({ success: true, schemas, session_id: session_id || `nexus_${Date.now()}`, isDemoMode, totalSchemas: schemas.length })
}

// ============================================================================
// Validation for Dry-Run
// ============================================================================

interface ValidationError {
  param: string
  type: 'missing' | 'invalid_type' | 'invalid_format' | 'constraint_violation'
  message: string
  expected?: string
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: string[]
  checkedParams: string[]
  missingRequired: string[]
  validatedAt: number
}

function validateToolParams(
  toolSlug: string,
  args: Record<string, unknown>,
  schema?: { properties?: Record<string, { type?: string; required?: boolean }>; required?: string[] }
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []
  const checkedParams: string[] = []
  const missingRequired: string[] = []

  const defaultRequiredParams: Record<string, string[]> = {
    GMAIL: ['to', 'subject', 'body'],
    SLACK: ['channel', 'text'],
    GOOGLESHEETS: ['spreadsheet_id'],
    DROPBOX: ['path'],
    FRESHBOOKS: ['account_id'],
    WAVE: ['business_id'],
    WHATSAPP: ['to', 'message'],
    GITHUB: ['repo', 'owner'],
    NOTION: ['page_id'],
    TRELLO: ['board_id'],
    ASANA: ['project_id'],
    DISCORD: ['channel_id', 'content'],
  }

  let requiredParams: string[] = []
  if (schema?.required) {
    requiredParams = schema.required
  } else {
    const prefix = toolSlug.split('_')[0]
    requiredParams = defaultRequiredParams[prefix] || []
  }

  for (const param of requiredParams) {
    checkedParams.push(param)
    if (args[param] === undefined || args[param] === null || args[param] === '') {
      missingRequired.push(param)
      errors.push({ param, type: 'missing', message: `Required parameter '${param}' is missing`, expected: 'non-empty value' })
    }
  }

  if (schema?.properties) {
    for (const [paramName, paramValue] of Object.entries(args)) {
      checkedParams.push(paramName)
      const paramSchema = schema.properties[paramName]
      if (paramSchema?.type) {
        const actualType = Array.isArray(paramValue) ? 'array' : typeof paramValue
        if (actualType !== paramSchema.type && paramValue !== null && paramValue !== undefined) {
          errors.push({ param: paramName, type: 'invalid_type', message: `Parameter '${paramName}' has type '${actualType}' but expected '${paramSchema.type}'`, expected: paramSchema.type })
        }
      }
    }
  }

  const emailParams = ['to', 'from', 'cc', 'bcc', 'email', 'recipient']
  for (const param of emailParams) {
    if (args[param] && typeof args[param] === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(args[param] as string)) {
        errors.push({ param, type: 'invalid_format', message: `Parameter '${param}' does not appear to be a valid email address`, expected: 'valid email format (user@domain.com)' })
      }
    }
  }

  const urlParams = ['url', 'webhook_url', 'redirect_url', 'link']
  for (const param of urlParams) {
    if (args[param] && typeof args[param] === 'string') {
      try { new URL(args[param] as string) } catch { errors.push({ param, type: 'invalid_format', message: `Parameter '${param}' is not a valid URL`, expected: 'valid URL (https://...)' }) }
    }
  }

  if (args.spreadsheet_id && typeof args.spreadsheet_id === 'string') {
    if (!(args.spreadsheet_id as string).match(/^[a-zA-Z0-9_-]{20,}$/)) {
      warnings.push(`spreadsheet_id format may be invalid - expected long alphanumeric ID`)
    }
  }

  return { valid: errors.length === 0, errors, warnings, checkedParams: Array.from(new Set(checkedParams)), missingRequired, validatedAt: Date.now() }
}

// ============================================================================
// Demo Responses for Execute
// ============================================================================

const DEMO_RESPONSES: Record<string, (args: Record<string, unknown>) => unknown> = {
  GMAIL_SEND_EMAIL: (args) => ({ messageId: `msg_${Date.now()}`, threadId: `thread_${Date.now()}`, labelIds: ['SENT'], status: 'sent', to: args.to || 'recipient@example.com' }),
  SLACK_SEND_MESSAGE: (args) => ({ ok: true, channel: args.channel || 'general', ts: `${Date.now()}.000000`, message: { text: args.text || 'Message sent via Nexus' } }),
  GOOGLESHEETS_APPEND_DATA: (args) => ({ spreadsheetId: args.spreadsheet_id || 'demo_sheet', updatedRange: 'Sheet1!A1:D10', updatedRows: 1, updatedColumns: 4 }),
  DROPBOX_UPLOAD_FILE: (args) => ({ fileId: `file_${Date.now()}`, path: args.path || '/uploads/file.txt', size: 1024, status: 'uploaded' }),
  FRESHBOOKS_CREATE_INVOICE: (args) => ({ invoiceId: `inv_${Date.now()}`, invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`, clientId: args.client_id || 'client_demo', amount: args.amount || 100, status: 'draft', currency: 'USD' }),
  WAVE_CREATE_INVOICE: (args) => ({ invoiceId: `wave_inv_${Date.now()}`, invoiceNumber: `WAVE-${Math.floor(Math.random() * 10000)}`, customerId: args.customer_id || 'cust_demo', total: args.amount || 150, status: 'SAVED' }),
  WHATSAPP_SEND_MESSAGE: (args) => ({ messageId: `wa_${Date.now()}`, to: args.to || '+1234567890', status: 'sent', timestamp: new Date().toISOString() }),
}

function getDemoResponse(toolSlug: string, args: Record<string, unknown>): unknown {
  if (DEMO_RESPONSES[toolSlug]) return DEMO_RESPONSES[toolSlug](args)
  const prefix = toolSlug.split('_')[0]
  for (const [key, responseFn] of Object.entries(DEMO_RESPONSES)) {
    if (key.startsWith(prefix)) return responseFn(args)
  }
  return { success: true, message: `Demo execution of ${toolSlug}`, timestamp: new Date().toISOString(), data: { ...args } }
}

// ============================================================================
// Execute Handler
// ============================================================================

async function handleExecute(req: VercelRequest, res: VercelResponse, isDemoMode: boolean, apiKey: string | undefined) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { tools, session_id, sync_response_to_workbench = false, memory = {}, dry_run = false } = req.body

  if (!tools || !Array.isArray(tools)) {
    return res.status(400).json({ success: false, error: 'tools array is required' })
  }

  // @NEXUS-FIX-060: Handle dry-run validation mode
  if (dry_run) {
    const validationResults: Array<{ tool_slug: string; validation: ValidationResult }> = []
    for (const tool of tools) {
      const validation = validateToolParams(tool.tool_slug, tool.arguments || {})
      validationResults.push({ tool_slug: tool.tool_slug, validation })
    }
    const allValid = validationResults.every(r => r.validation.valid)
    return res.json({
      success: allValid,
      dry_run: true,
      validationResults,
      session_id: session_id || `nexus_${Date.now()}`,
      summary: {
        totalTools: validationResults.length,
        validCount: validationResults.filter(r => r.validation.valid).length,
        invalidCount: validationResults.filter(r => !r.validation.valid).length,
        totalErrors: validationResults.reduce((sum, r) => sum + r.validation.errors.length, 0),
        totalWarnings: validationResults.reduce((sum, r) => sum + (r.validation.warnings?.length || 0), 0)
      }
    })
  }

  const results: Array<{ tool_slug: string; success: boolean; data?: unknown; error?: string }> = []

  if (isDemoMode) {
    for (const tool of tools) {
      results.push({ tool_slug: tool.tool_slug, success: true, data: getDemoResponse(tool.tool_slug, tool.arguments || {}) })
    }
    return res.json({ success: true, results, session_id: session_id || `nexus_${Date.now()}`, isDemoMode: true, totalExecuted: results.length, successCount: results.length })
  }

  try {
    const { Composio } = await import('@composio/core')
    const composio = new Composio({ apiKey })

    for (const tool of tools) {
      try {
        const result = await composio.tools.execute(tool.tool_slug, { arguments: tool.arguments || {}, userId: 'default' })
        results.push({ tool_slug: tool.tool_slug, success: true, data: result?.data || result })
      } catch (toolError: any) {
        console.error(`Error executing ${tool.tool_slug}:`, toolError)
        results.push({ tool_slug: tool.tool_slug, success: false, error: toolError.message })
      }
    }

    res.json({ success: results.every(r => r.success), results, session_id: session_id || `nexus_${Date.now()}`, isDemoMode: false, totalExecuted: results.length, successCount: results.filter(r => r.success).length })
  } catch (composioError: any) {
    console.error('Composio execute error:', composioError)
    res.status(500).json({ success: false, error: composioError.message, results })
  }
}

// ============================================================================
// Connection Status Handler
// ============================================================================

async function handleConnectionStatus(req: VercelRequest, res: VercelResponse, isDemoMode: boolean, apiKey: string | undefined, toolkit?: string) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  if (!toolkit) {
    return res.status(400).json({ success: false, error: 'toolkit parameter is required' })
  }

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
    res.json({ connected: false, toolkit, error: composioError.message, authUrl: `https://app.composio.dev/apps/${toolkit}` })
  }
}

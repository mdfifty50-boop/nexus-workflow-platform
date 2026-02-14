/**
 * Rube API Routes - Workflow execution via Rube MCP
 *
 * These routes handle:
 * - Tool discovery via Rube MCP
 * - OAuth connection management (WHITE-LABELED - no Rube branding to users)
 * - Workflow execution via Rube API
 * - Connection status checks
 *
 * IMPORTANT: OAuth URLs returned to frontend are DIRECT provider URLs
 * (Google, Slack, etc.) - NOT rube.app or composio.dev URLs.
 * Users never see third-party OAuth infrastructure.
 */

import { Router, Request, Response } from 'express'
import { oauthProxyService } from '../services/OAuthProxyService'
import { composioService } from '../services/ComposioService'
import { toolDiscoveryService } from '../services/ToolDiscoveryService'
// @NEXUS-FIX-095: Import WhatsApp Baileys service for direct message routing
import { whatsAppBaileysService } from '../services/WhatsAppBaileysService'

const router = Router()

/**
 * Extended Tool Catalog for dynamic discovery
 * @NEXUS-FIX-053: Rube MCP proxy for browser tool discovery
 */
const TOOL_CATALOG: Record<string, Array<{
  slug: string
  name: string
  description: string
  actions: string[]
}>> = {
  gmail: [
    { slug: 'GMAIL_SEND_EMAIL', name: 'Send Email', description: 'Send an email via Gmail', actions: ['send', 'email'] },
    { slug: 'GMAIL_GET_MESSAGE', name: 'Read Email', description: 'Read an email from Gmail', actions: ['read', 'get', 'fetch'] },
    { slug: 'GMAIL_LIST_MESSAGES', name: 'List Emails', description: 'List emails from inbox', actions: ['list', 'search'] },
  ],
  slack: [
    { slug: 'SLACK_SEND_MESSAGE', name: 'Send Message', description: 'Send a Slack message', actions: ['send', 'message', 'post'] },
    { slug: 'SLACK_LIST_CHANNELS', name: 'List Channels', description: 'List available Slack channels', actions: ['list', 'channels'] },
  ],
  googlesheets: [
    { slug: 'GOOGLESHEETS_APPEND_DATA', name: 'Append Data', description: 'Add rows to a Google Sheet', actions: ['append', 'add', 'insert', 'write'] },
    { slug: 'GOOGLESHEETS_GET_DATA', name: 'Get Data', description: 'Read data from a Google Sheet', actions: ['get', 'read', 'fetch'] },
    { slug: 'GOOGLESHEETS_UPDATE_CELL', name: 'Update Cell', description: 'Update a specific cell', actions: ['update', 'edit'] },
  ],
  dropbox: [
    { slug: 'DROPBOX_UPLOAD_FILE', name: 'Upload File', description: 'Upload a file to Dropbox', actions: ['upload', 'save', 'store', 'write'] },
    { slug: 'DROPBOX_DOWNLOAD_FILE', name: 'Download File', description: 'Download a file from Dropbox', actions: ['download', 'get', 'fetch'] },
    { slug: 'DROPBOX_LIST_FOLDER', name: 'List Folder', description: 'List folder contents', actions: ['list'] },
  ],
  freshbooks: [
    { slug: 'FRESHBOOKS_CREATE_INVOICE', name: 'Create Invoice', description: 'Create a new invoice', actions: ['create', 'new', 'add', 'generate'] },
    { slug: 'FRESHBOOKS_GET_INVOICES', name: 'Get Invoices', description: 'Retrieve invoices', actions: ['get', 'list', 'fetch'] },
    { slug: 'FRESHBOOKS_CREATE_CLIENT', name: 'Create Client', description: 'Create a new client', actions: ['create', 'client', 'add'] },
    { slug: 'FRESHBOOKS_GET_CLIENTS', name: 'Get Clients', description: 'Retrieve clients', actions: ['get', 'list', 'clients'] },
  ],
  wave: [
    { slug: 'WAVE_CREATE_INVOICE', name: 'Create Invoice', description: 'Create a Wave invoice', actions: ['create', 'invoice'] },
    { slug: 'WAVE_GET_INVOICES', name: 'Get Invoices', description: 'Retrieve Wave invoices', actions: ['get', 'list'] },
  ],
  xero: [
    { slug: 'XERO_CREATE_INVOICE', name: 'Create Invoice', description: 'Create a Xero invoice', actions: ['create', 'invoice'] },
    { slug: 'XERO_GET_CONTACTS', name: 'Get Contacts', description: 'Retrieve Xero contacts', actions: ['get', 'contacts', 'list'] },
  ],
  quickbooks: [
    { slug: 'QUICKBOOKS_CREATE_INVOICE', name: 'Create Invoice', description: 'Create a QuickBooks invoice', actions: ['create', 'invoice'] },
    { slug: 'QUICKBOOKS_GET_CUSTOMERS', name: 'Get Customers', description: 'Retrieve customers', actions: ['get', 'customers', 'list'] },
  ],
  stripe: [
    { slug: 'STRIPE_CREATE_INVOICE', name: 'Create Invoice', description: 'Create a Stripe invoice', actions: ['create', 'invoice'] },
    { slug: 'STRIPE_CREATE_CUSTOMER', name: 'Create Customer', description: 'Create a customer', actions: ['create', 'customer'] },
    { slug: 'STRIPE_GET_PAYMENTS', name: 'Get Payments', description: 'Retrieve payment history', actions: ['get', 'payments', 'list'] },
  ],
  notion: [
    { slug: 'NOTION_CREATE_PAGE', name: 'Create Page', description: 'Create a Notion page', actions: ['create', 'page', 'add'] },
    { slug: 'NOTION_UPDATE_PAGE', name: 'Update Page', description: 'Update a Notion page', actions: ['update', 'edit'] },
    { slug: 'NOTION_SEARCH', name: 'Search', description: 'Search Notion workspace', actions: ['search', 'find'] },
  ],
  discord: [
    { slug: 'DISCORD_SEND_MESSAGE', name: 'Send Message', description: 'Send a Discord message', actions: ['send', 'message', 'post'] },
  ],
  whatsapp: [
    { slug: 'WHATSAPP_SEND_MESSAGE', name: 'Send Message', description: 'Send a WhatsApp message', actions: ['send', 'message'] },
  ],
  googledrive: [
    { slug: 'GOOGLEDRIVE_UPLOAD_FILE', name: 'Upload File', description: 'Upload to Google Drive', actions: ['upload', 'save'] },
    { slug: 'GOOGLEDRIVE_LIST_FILES', name: 'List Files', description: 'List Drive files', actions: ['list'] },
  ],
  onedrive: [
    { slug: 'ONEDRIVE_UPLOAD_FILE', name: 'Upload File', description: 'Upload to OneDrive', actions: ['upload', 'save'] },
    { slug: 'ONEDRIVE_LIST_FILES', name: 'List Files', description: 'List OneDrive files', actions: ['list'] },
  ],
  github: [
    { slug: 'GITHUB_CREATE_ISSUE', name: 'Create Issue', description: 'Create GitHub issue', actions: ['create', 'issue'] },
    { slug: 'GITHUB_LIST_REPOS', name: 'List Repos', description: 'List repositories', actions: ['list', 'repos'] },
    { slug: 'GITHUB_CREATE_PR', name: 'Create PR', description: 'Create pull request', actions: ['create', 'pr', 'pull'] },
  ],
  trello: [
    { slug: 'TRELLO_CREATE_CARD', name: 'Create Card', description: 'Create Trello card', actions: ['create', 'card'] },
    { slug: 'TRELLO_LIST_BOARDS', name: 'List Boards', description: 'List Trello boards', actions: ['list', 'boards'] },
  ],
  asana: [
    { slug: 'ASANA_CREATE_TASK', name: 'Create Task', description: 'Create Asana task', actions: ['create', 'task'] },
    { slug: 'ASANA_LIST_TASKS', name: 'List Tasks', description: 'List Asana tasks', actions: ['list', 'tasks'] },
  ],
  linear: [
    { slug: 'LINEAR_CREATE_ISSUE', name: 'Create Issue', description: 'Create Linear issue', actions: ['create', 'issue'] },
    { slug: 'LINEAR_LIST_ISSUES', name: 'List Issues', description: 'List Linear issues', actions: ['list'] },
  ],
  jira: [
    { slug: 'JIRA_CREATE_ISSUE', name: 'Create Issue', description: 'Create Jira issue', actions: ['create', 'issue', 'ticket'] },
    { slug: 'JIRA_SEARCH_ISSUES', name: 'Search Issues', description: 'Search Jira issues', actions: ['search', 'list'] },
  ],
  hubspot: [
    { slug: 'HUBSPOT_CREATE_CONTACT', name: 'Create Contact', description: 'Create HubSpot contact', actions: ['create', 'contact'] },
    { slug: 'HUBSPOT_CREATE_DEAL', name: 'Create Deal', description: 'Create HubSpot deal', actions: ['create', 'deal'] },
  ],
  googlecalendar: [
    { slug: 'GOOGLECALENDAR_CREATE_EVENT', name: 'Create Event', description: 'Create calendar event', actions: ['create', 'event', 'meeting'] },
    { slug: 'GOOGLECALENDAR_LIST_EVENTS', name: 'List Events', description: 'List calendar events', actions: ['list', 'events'] },
  ],
  zoom: [
    { slug: 'ZOOM_CREATE_MEETING', name: 'Create Meeting', description: 'Create Zoom meeting', actions: ['create', 'meeting'] },
    { slug: 'ZOOM_LIST_MEETINGS', name: 'List Meetings', description: 'List Zoom meetings', actions: ['list'] },
  ],
  twitter: [
    { slug: 'TWITTER_POST_TWEET', name: 'Post Tweet', description: 'Post a tweet', actions: ['post', 'tweet', 'send'] },
  ],
  linkedin: [
    { slug: 'LINKEDIN_POST_UPDATE', name: 'Post Update', description: 'Post LinkedIn update', actions: ['post', 'share'] },
  ],
}

/**
 * Search tools by matching intent keywords
 */
function searchToolCatalog(useCase: string, toolkit?: string): Array<{
  tool_slug: string
  name: string
  description: string
  toolkit: string
  score: number
}> {
  const results: Array<{ tool_slug: string; name: string; description: string; toolkit: string; score: number }> = []
  const keywords = useCase.toLowerCase().split(/\s+/)

  const catalogToSearch = toolkit
    ? { [toolkit]: TOOL_CATALOG[toolkit] || [] }
    : TOOL_CATALOG

  for (const [toolkitName, tools] of Object.entries(catalogToSearch)) {
    for (const tool of tools) {
      let score = 0

      // Toolkit name match
      if (keywords.some((k) => toolkitName.includes(k))) score += 30

      // Action match
      for (const action of tool.actions) {
        if (keywords.includes(action)) score += 25
      }

      // Name/description match
      const nameWords = tool.name.toLowerCase().split(/\s+/)
      const descWords = tool.description.toLowerCase().split(/\s+/)
      for (const keyword of keywords) {
        if (nameWords.includes(keyword)) score += 15
        if (descWords.some((w) => w.includes(keyword))) score += 10
      }

      if (score > 0) {
        results.push({
          tool_slug: tool.slug,
          name: tool.name,
          description: tool.description,
          toolkit: toolkitName,
          score,
        })
      }
    }
  }

  return results.sort((a, b) => b.score - a.score)
}

/**
 * POST /api/rube/search-tools
 * Search for tools by use case via Rube MCP
 * @NEXUS-FIX-053: Rube MCP proxy for browser tool discovery
 *
 * Request: { queries: [{ use_case: string, known_fields?: string }], session_id?: string }
 * Response: { tools: [], connection_statuses: [], session_id: string }
 */
router.post('/search-tools', async (req: Request, res: Response) => {
  const { queries, session_id } = req.body

  if (!queries || !Array.isArray(queries)) {
    return res.status(400).json({
      success: false,
      error: 'queries array is required',
    })
  }

  try {
    console.log('[Rube] Searching tools with queries:', queries)

    const allTools: Array<{ tool_slug: string; name: string; description: string; toolkit: string }> = []
    const connectionStatuses: Record<string, boolean> = {}

    for (const query of queries) {
      const useCase = query.use_case || ''
      // Extract toolkit from known_fields if present
      let toolkit: string | undefined
      if (query.known_fields) {
        const toolkitMatch = query.known_fields.match(/toolkit:\s*(\w+)/i)
        if (toolkitMatch) toolkit = toolkitMatch[1].toLowerCase()
      }

      const tools = searchToolCatalog(useCase, toolkit)
      for (const tool of tools.slice(0, 10)) { // Top 10 per query
        if (!allTools.some((t) => t.tool_slug === tool.tool_slug)) {
          allTools.push({
            tool_slug: tool.tool_slug,
            name: tool.name,
            description: tool.description,
            toolkit: tool.toolkit,
          })

          // Check connection status for toolkit
          if (!connectionStatuses.hasOwnProperty(tool.toolkit)) {
            try {
              const status = await composioService.checkConnection(tool.toolkit)
              connectionStatuses[tool.toolkit] = status.connected
            } catch {
              connectionStatuses[tool.toolkit] = false
            }
          }
        }
      }
    }

    console.log(`[Rube] Found ${allTools.length} tools`)

    res.json({
      success: true,
      tools: allTools,
      connection_statuses: connectionStatuses,
      session_id: session_id || `nexus_${Date.now()}`,
    })
  } catch (error) {
    console.error('[Rube] Tool search error:', error)
    res.status(500).json({
      success: false,
      error: String(error),
    })
  }
})

/**
 * POST /api/rube/discover-tool
 * Smart tool discovery with gap analysis and alternatives
 *
 * This is the "What CRM do you use?" flow:
 * 1. User mentions an app by name (e.g., "Pipeline", "Wave", "Odoo")
 * 2. We analyze what actions ARE and AREN'T available
 * 3. We provide alternatives if tool isn't fully supported
 *
 * Request: { toolName: string, checkConnection?: boolean, includeAlternatives?: boolean }
 * Response: ToolDiscoveryResult
 */
router.post('/discover-tool', async (req: Request, res: Response) => {
  const { toolName, checkConnection = true, includeAlternatives = true, userId = 'default' } = req.body

  if (!toolName) {
    return res.status(400).json({
      success: false,
      error: 'toolName is required',
    })
  }

  try {
    console.log(`[Rube] Discovering tool: ${toolName}`)

    // Initialize Composio if not already done (needed for action discovery)
    if (!composioService.initialized) {
      const apiKey = process.env.COMPOSIO_API_KEY
      if (apiKey) {
        await composioService.initialize(apiKey)
        console.log('[Rube] ComposioService initialized for tool discovery')
      }
    }

    const result = await toolDiscoveryService.discoverTool(toolName, {
      checkConnection,
      includeAlternatives,
      userId,
    })

    // Generate human-readable summary
    const summary = toolDiscoveryService.getToolSummary(result)

    console.log(`[Rube] Tool discovery for "${toolName}": ${result.supportLevel}, ${result.actionCount} actions`)

    res.json({
      success: true,
      ...result,
      summary,
    })
  } catch (error) {
    console.error('[Rube] Tool discovery error:', error)
    res.status(500).json({
      success: false,
      error: String(error),
    })
  }
})

/**
 * POST /api/rube/discover-tools
 * Discover multiple tools at once
 *
 * Request: { toolNames: string[], checkConnection?: boolean }
 * Response: { results: ToolDiscoveryResult[] }
 */
router.post('/discover-tools', async (req: Request, res: Response) => {
  const { toolNames, checkConnection = true, includeAlternatives = true, userId = 'default' } = req.body

  if (!toolNames || !Array.isArray(toolNames) || toolNames.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'toolNames array is required',
    })
  }

  try {
    console.log(`[Rube] Discovering ${toolNames.length} tools:`, toolNames)

    // Initialize Composio if not already done
    if (!composioService.initialized) {
      const apiKey = process.env.COMPOSIO_API_KEY
      if (apiKey) {
        await composioService.initialize(apiKey)
      }
    }

    const results = await toolDiscoveryService.discoverMultipleTools(toolNames, {
      checkConnection,
      includeAlternatives,
      userId,
    })

    // Add summaries to each result
    const enrichedResults = results.map(result => ({
      ...result,
      summary: toolDiscoveryService.getToolSummary(result),
    }))

    // Categorize results
    const fullSupport = enrichedResults.filter(r => r.supportLevel === 'full')
    const partialSupport = enrichedResults.filter(r => r.supportLevel === 'partial')
    const browserOnly = enrichedResults.filter(r => r.supportLevel === 'browser_only')
    const unsupported = enrichedResults.filter(r => r.supportLevel === 'none')

    console.log(`[Rube] Discovery complete: ${fullSupport.length} full, ${partialSupport.length} partial, ${browserOnly.length} browser, ${unsupported.length} none`)

    res.json({
      success: true,
      results: enrichedResults,
      summary: {
        total: results.length,
        fullSupport: fullSupport.length,
        partialSupport: partialSupport.length,
        browserOnly: browserOnly.length,
        unsupported: unsupported.length,
      },
    })
  } catch (error) {
    console.error('[Rube] Multiple tool discovery error:', error)
    res.status(500).json({
      success: false,
      error: String(error),
    })
  }
})

/**
 * POST /api/rube/manage-connections
 * Initiate OAuth connections for toolkits via Composio
 *
 * Uses Composio's OAuth system so tokens are stored in Composio
 * and can be used for tool execution.
 *
 * Request: { toolkits: string[], userId?: string, sessionId?: string }
 * Response: { results: { [toolkit]: { status, redirect_url? } } }
 */
router.post('/manage-connections', async (req: Request, res: Response) => {
  const { toolkits, userId = 'default', sessionId } = req.body

  if (!toolkits || !Array.isArray(toolkits)) {
    return res.status(400).json({
      success: false,
      error: 'toolkits array is required',
    })
  }

  try {
    console.log('[Rube] Managing connections for toolkits:', toolkits)

    // Initialize Composio if not already done
    if (!composioService.initialized) {
      const apiKey = process.env.COMPOSIO_API_KEY
      if (apiKey) {
        await composioService.initialize(apiKey)
        console.log('[Rube] ComposioService initialized for connection management')
      }
    }

    // Get base URL for OAuth callbacks
    const protocol = req.secure ? 'https' : 'http'
    const baseUrl = `${protocol}://${req.get('host')}`

    const results: Record<string, { status: string; redirect_url?: string; connected?: boolean }> = {}

    for (const toolkit of toolkits) {
      // Check if already connected via Composio
      const connectionStatus = await composioService.checkConnection(toolkit)

      if (connectionStatus.connected) {
        console.log(`[Rube] ${toolkit} already connected via Composio`)
        results[toolkit] = {
          status: 'connected',
          connected: true,
        }
      } else {
        // FIX-072: Use white-label OAuth FIRST for seamless UX
        // Users see direct provider URLs (accounts.google.com, slack.com)
        // NOT composio.dev or rube.app URLs
        console.log(`[Rube] FIX-072: Initiating white-label OAuth for: ${toolkit}`)

        const localAuthResult = oauthProxyService.generateAuthUrl(
          toolkit,
          userId,
          sessionId || `session_${Date.now()}`,
          baseUrl
        )

        if ('error' in localAuthResult) {
          // Fallback to Composio only if white-label fails
          console.log(`[Rube] White-label OAuth not available for ${toolkit}, trying Composio`)
          const authResult = await composioService.initiateConnection(
            toolkit,
            `${baseUrl}/integrations/callback?toolkit=${toolkit}`
          )

          if (authResult.error) {
            console.log(`[Rube] Both OAuth methods failed for ${toolkit}`)
            results[toolkit] = {
              status: 'error',
              redirect_url: undefined,
            }
          } else {
            // Check if Composio returned a composio.dev URL - warn about it
            if (authResult.authUrl?.includes('composio.dev') || authResult.authUrl?.includes('platform.composio')) {
              console.warn(`[Rube] WARNING: Composio returned non-white-label URL for ${toolkit}`)
            }
            results[toolkit] = {
              status: 'pending',
              redirect_url: authResult.authUrl,
            }
          }
        } else {
          console.log(`[Rube] FIX-072: White-label OAuth URL generated for ${toolkit}`)
          results[toolkit] = {
            status: 'pending',
            redirect_url: localAuthResult.authUrl,
          }
        }
      }
    }

    res.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('[Rube] Connection management error:', error)
    res.status(500).json({
      success: false,
      error: String(error),
    })
  }
})

/**
 * POST /api/rube/execute
 * Execute workflow tools via Rube MCP
 *
 * Request: { tools: [{ tool_slug: string, arguments: object }], session_id: string }
 * Response: { results: [], success: boolean }
 */
router.post('/execute', async (req: Request, res: Response) => {
  const { tools, session_id } = req.body

  if (!tools || !Array.isArray(tools)) {
    return res.status(400).json({
      success: false,
      error: 'tools array is required',
    })
  }

  if (!session_id) {
    return res.status(400).json({
      success: false,
      error: 'session_id is required',
    })
  }

  console.log(`[Rube] Executing ${tools.length} tools for session: ${session_id}`)

  try {
    // Initialize Composio if not already done
    if (!composioService.initialized) {
      const apiKey = process.env.COMPOSIO_API_KEY
      if (apiKey) {
        await composioService.initialize(apiKey)
        console.log('[Rube] ComposioService initialized for tool execution')
      }
    }

    // Execute each tool via ComposioService using accountId when available
    const results = await Promise.all(
      tools.map(async (tool: { tool_slug: string; arguments: Record<string, unknown> }) => {
        try {
          // Extract toolkit from tool_slug (e.g., GMAIL_SEND_EMAIL -> gmail)
          const toolkit = tool.tool_slug.split('_')[0].toLowerCase()
          console.log(`[Rube] Executing tool: ${tool.tool_slug} (toolkit: ${toolkit})`)

          // Get connection status with accountId
          const connectionStatus = await composioService.checkConnection(toolkit)

          if (!connectionStatus.connected || !connectionStatus.accountId) {
            console.log(`[Rube] No active connection for ${toolkit}, checking alternatives`)

            // @NEXUS-FIX-095: Route WhatsApp through Baileys when Composio not connected - DO NOT REMOVE
            // Problem: User connects WhatsApp via QR code (Baileys), but execution tries Composio
            // Solution: Check for Baileys session and use it for WhatsApp messages
            if (toolkit === 'whatsapp' && tool.tool_slug === 'WHATSAPP_SEND_MESSAGE') {
              console.log(`[Rube FIX-095] WhatsApp tool detected, checking Baileys sessions`)

              // Get all ready Baileys sessions
              const allSessions = whatsAppBaileysService.getAllSessions()
              const readySession = allSessions.find(s => s.state === 'ready')

              if (readySession) {
                console.log(`[Rube FIX-095] Found ready Baileys session: ${readySession.id}, sending via WhatsApp Web`)
                const startTime = Date.now()

                // Extract params from tool arguments
                // @NEXUS-FIX-096: Add debug logging and more parameter aliases for WhatsApp - DO NOT REMOVE
                const args = tool.arguments || {}
                console.log(`[Rube FIX-096] WhatsApp tool arguments:`, JSON.stringify(args, null, 2))

                // Check multiple possible keys for phone number (frontend may use different keys)
                const to = (args.to as string) ||
                           (args.phone as string) ||
                           (args.recipient as string) ||
                           (args.whatsapp as string) ||
                           (args.phone_number as string) ||
                           (args.number as string)
                const message = (args.message as string) ||
                                (args.text as string) ||
                                (args.body as string) ||
                                (args.content as string)

                console.log(`[Rube FIX-096] Extracted: to=${to}, message=${message?.substring(0, 50)}...`)

                if (!to || !message) {
                  console.log(`[Rube FIX-096] Missing params! Available keys: ${Object.keys(args).join(', ')}`)
                  return {
                    tool_slug: tool.tool_slug,
                    success: false,
                    error: `Missing required params: to=${to ? 'OK' : 'MISSING'}, message=${message ? 'OK' : 'MISSING'}. Available: ${Object.keys(args).join(', ')}`,
                    data: null,
                    executionTimeMs: Date.now() - startTime,
                  }
                }

                // Send via Baileys
                // @NEXUS-FIX-098: Correctly handle WhatsAppMessage return type - DO NOT REMOVE
                // Problem: sendMessage returns WhatsAppMessage (with id, status) not {success, messageId, error}
                // Solution: Try/catch for errors, check returned message for success
                try {
                  const sentMessage = await whatsAppBaileysService.sendMessage(readySession.id, to, message)

                  // If we get here without throwing, message was sent successfully
                  // WhatsAppMessage has: id, sessionId, from, to, body, timestamp, fromMe, status
                  return {
                    tool_slug: tool.tool_slug,
                    success: true,
                    error: null,
                    data: {
                      messageId: sentMessage.id,
                      to: sentMessage.to,
                      status: sentMessage.status, // 'sent', 'delivered', etc.
                      via: 'whatsapp-web',
                      timestamp: sentMessage.timestamp,
                    },
                    executionTimeMs: Date.now() - startTime,
                  }
                } catch (sendError) {
                  console.error(`[Rube FIX-098] WhatsApp send failed:`, sendError)
                  return {
                    tool_slug: tool.tool_slug,
                    success: false,
                    error: (sendError as Error).message || 'Failed to send WhatsApp message',
                    data: null,
                    executionTimeMs: Date.now() - startTime,
                  }
                }
              } else {
                console.log(`[Rube FIX-095] No ready Baileys session found, sessions: ${allSessions.map(s => `${s.id}:${s.state}`).join(', ')}`)
                return {
                  tool_slug: tool.tool_slug,
                  success: false,
                  error: 'WhatsApp not connected. Please scan the QR code to link your WhatsApp.',
                  data: null,
                }
              }
            }

            // Fall back to default Composio execution (may still fail with entity mismatch)
            const result = await composioService.executeTool(
              tool.tool_slug,
              tool.arguments || {}
            )
            return {
              tool_slug: tool.tool_slug,
              success: result.success,
              error: result.error || null,
              data: result.data,
              executionTimeMs: result.executionTimeMs,
            }
          }

          // Use executeWithAccountId for reliable execution with ANY connection
          // @NEXUS-FIX-111: Backend auto-retry for transient failures - DO NOT REMOVE
          console.log(`[Rube] Using accountId ${connectionStatus.accountId} for ${tool.tool_slug}`)
          const MAX_RETRIES = 2
          let lastResult = null
          for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const result = await composioService.executeWithAccountId(
              connectionStatus.accountId,
              tool.tool_slug,
              tool.arguments || {}
            )
            lastResult = result

            if (result.success) {
              return {
                tool_slug: tool.tool_slug,
                success: true,
                error: null,
                data: result.data,
                executionTimeMs: result.executionTimeMs,
              }
            }

            // Check if error is retryable
            const errMsg = (result.error || '').toLowerCase()
            const isRetryable = errMsg.includes('rate limit') ||
              errMsg.includes('429') ||
              errMsg.includes('timeout') ||
              errMsg.includes('timed out') ||
              errMsg.includes('network') ||
              errMsg.includes('econnrefused') ||
              errMsg.includes('503') ||
              errMsg.includes('502')

            if (!isRetryable || attempt === MAX_RETRIES) break

            const backoffMs = 2000 * Math.pow(2, attempt)
            console.log(`[Rube] Retrying ${tool.tool_slug} in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
            await new Promise(r => setTimeout(r, backoffMs))
          }

          return {
            tool_slug: tool.tool_slug,
            success: lastResult?.success ?? false,
            error: lastResult?.error || null,
            data: lastResult?.data,
            executionTimeMs: lastResult?.executionTimeMs,
          }
          // @NEXUS-FIX-111-END
        } catch (toolError) {
          console.error(`[Rube] Tool ${tool.tool_slug} failed:`, toolError)
          return {
            tool_slug: tool.tool_slug,
            success: false,
            error: String(toolError),
            data: null,
          }
        }
      })
    )

    const allSuccessful = results.every((r) => r.success)
    const successCount = results.filter((r) => r.success).length

    console.log(`[Rube] Execution complete: ${successCount}/${results.length} tools succeeded`)

    res.json({
      success: allSuccessful,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: results.length - successCount,
      },
    })
  } catch (error) {
    console.error('[Rube] Tool execution error:', error)
    res.status(500).json({
      success: false,
      error: String(error),
    })
  }
})

/**
 * GET /api/rube/connection-status/:toolkit
 * Check if a toolkit is connected
 *
 * Query: { userId?: string }
 * Response: { toolkit, connected: boolean, user_info?: object }
 */
router.get('/connection-status/:toolkit', async (req: Request, res: Response) => {
  const { toolkit } = req.params
  const userId = (req.query.userId as string) || 'default'

  try {
    console.log(`[Rube] Checking connection status for: ${toolkit}`)

    // Initialize Composio if not already done
    if (!composioService.initialized) {
      const apiKey = process.env.COMPOSIO_API_KEY
      if (apiKey) {
        await composioService.initialize(apiKey)
        console.log('[Rube] ComposioService initialized for connection check')
      }
    }

    // Check connection via Composio first (required for tool execution)
    const connectionStatus = await composioService.checkConnection(toolkit)
    let connected = connectionStatus.connected
    let accountId = connectionStatus.accountId
    let connectionSource = 'composio'

    // If not connected via Composio, check local OAuth connections
    // This handles white-labeled OAuth where tokens are stored locally
    if (!connected) {
      const localConnected = oauthProxyService.isConnected(toolkit, userId)
      if (localConnected) {
        console.log(`[Rube] ${toolkit} connected via local OAuth for user ${userId}`)
        connected = true
        connectionSource = 'local'
      }
    }

    console.log(`[Rube] ${toolkit} connection status: connected=${connected}, source=${connectionSource}, accountId=${accountId}`)

    res.json({
      toolkit,
      connected,
      // Include accountId so frontend can track it (only for Composio connections)
      ...(connected && accountId ? { accountId } : {}),
      // Include connection source for debugging
      ...(connected ? { connectionSource } : {}),
      // If not connected, provide connection URL (direct to provider, not Rube)
      ...(connected ? {} : {
        connectEndpoint: '/api/rube/manage-connections',
      }),
    })
  } catch (error) {
    console.error('[Rube] Connection status error:', error)
    res.status(500).json({
      success: false,
      toolkit,
      connected: false,
      error: String(error),
    })
  }
})

/**
 * Common schema definitions for tool parameters
 * @NEXUS-FIX-053: Rube MCP proxy for browser schema resolution
 */
const COMMON_SCHEMAS: Record<string, {
  properties: Record<string, { type: string; description?: string; required?: boolean }>;
  required: string[];
}> = {
  // Email tools
  GMAIL_SEND_EMAIL: {
    properties: {
      to: { type: 'string', description: 'Email recipient address', required: true },
      subject: { type: 'string', description: 'Email subject line', required: true },
      body: { type: 'string', description: 'Email body content', required: true },
      cc: { type: 'string', description: 'CC recipients (comma-separated)' },
      bcc: { type: 'string', description: 'BCC recipients (comma-separated)' },
    },
    required: ['to', 'subject', 'body'],
  },
  GMAIL_GET_MESSAGE: {
    properties: {
      message_id: { type: 'string', description: 'Gmail message ID', required: true },
    },
    required: ['message_id'],
  },
  GMAIL_LIST_MESSAGES: {
    properties: {
      query: { type: 'string', description: 'Search query (Gmail syntax)' },
      max_results: { type: 'number', description: 'Maximum messages to return' },
    },
    required: [],
  },

  // Slack tools
  SLACK_SEND_MESSAGE: {
    properties: {
      channel: { type: 'string', description: 'Slack channel name or ID', required: true },
      text: { type: 'string', description: 'Message text', required: true },
    },
    required: ['channel', 'text'],
  },
  SLACK_LIST_CHANNELS: {
    properties: {
      types: { type: 'string', description: 'Channel types (public_channel, private_channel)' },
    },
    required: [],
  },

  // Google Sheets tools
  GOOGLESHEETS_APPEND_DATA: {
    properties: {
      spreadsheet_id: { type: 'string', description: 'Google Sheet ID or URL', required: true },
      range: { type: 'string', description: 'Cell range (e.g., Sheet1!A1)', required: true },
      values: { type: 'array', description: 'Data rows to append', required: true },
    },
    required: ['spreadsheet_id', 'range', 'values'],
  },
  GOOGLESHEETS_GET_DATA: {
    properties: {
      spreadsheet_id: { type: 'string', description: 'Google Sheet ID or URL', required: true },
      range: { type: 'string', description: 'Cell range to read', required: true },
    },
    required: ['spreadsheet_id', 'range'],
  },

  // Dropbox tools
  DROPBOX_UPLOAD_FILE: {
    properties: {
      path: { type: 'string', description: 'Destination path in Dropbox', required: true },
      content: { type: 'string', description: 'File content to upload', required: true },
    },
    required: ['path', 'content'],
  },
  DROPBOX_LIST_FOLDER: {
    properties: {
      path: { type: 'string', description: 'Folder path to list', required: true },
    },
    required: ['path'],
  },

  // FreshBooks tools
  FRESHBOOKS_CREATE_INVOICE: {
    properties: {
      client_id: { type: 'string', description: 'FreshBooks client ID', required: true },
      lines: { type: 'array', description: 'Invoice line items', required: true },
      due_date: { type: 'string', description: 'Invoice due date' },
      notes: { type: 'string', description: 'Invoice notes' },
    },
    required: ['client_id', 'lines'],
  },
  FRESHBOOKS_CREATE_CLIENT: {
    properties: {
      email: { type: 'string', description: 'Client email address', required: true },
      fname: { type: 'string', description: 'Client first name' },
      lname: { type: 'string', description: 'Client last name' },
      organization: { type: 'string', description: 'Company name' },
    },
    required: ['email'],
  },

  // Wave tools
  WAVE_CREATE_INVOICE: {
    properties: {
      customer_id: { type: 'string', description: 'Wave customer ID', required: true },
      items: { type: 'array', description: 'Invoice items', required: true },
    },
    required: ['customer_id', 'items'],
  },

  // Notion tools
  NOTION_CREATE_PAGE: {
    properties: {
      parent_id: { type: 'string', description: 'Parent page or database ID', required: true },
      title: { type: 'string', description: 'Page title', required: true },
      content: { type: 'string', description: 'Page content' },
    },
    required: ['parent_id', 'title'],
  },

  // Discord tools
  DISCORD_SEND_MESSAGE: {
    properties: {
      channel_id: { type: 'string', description: 'Discord channel ID', required: true },
      content: { type: 'string', description: 'Message content', required: true },
    },
    required: ['channel_id', 'content'],
  },

  // WhatsApp tools
  WHATSAPP_SEND_MESSAGE: {
    properties: {
      to: { type: 'string', description: 'Recipient phone number', required: true },
      message: { type: 'string', description: 'Message text', required: true },
    },
    required: ['to', 'message'],
  },

  // GitHub tools
  GITHUB_CREATE_ISSUE: {
    properties: {
      owner: { type: 'string', description: 'Repository owner', required: true },
      repo: { type: 'string', description: 'Repository name', required: true },
      title: { type: 'string', description: 'Issue title', required: true },
      body: { type: 'string', description: 'Issue body' },
    },
    required: ['owner', 'repo', 'title'],
  },

  // Google Calendar tools
  GOOGLECALENDAR_CREATE_EVENT: {
    properties: {
      summary: { type: 'string', description: 'Event title', required: true },
      start: { type: 'string', description: 'Start time (ISO format)', required: true },
      end: { type: 'string', description: 'End time (ISO format)', required: true },
      description: { type: 'string', description: 'Event description' },
      attendees: { type: 'array', description: 'Attendee emails' },
    },
    required: ['summary', 'start', 'end'],
  },

  // Stripe tools
  STRIPE_CREATE_INVOICE: {
    properties: {
      customer: { type: 'string', description: 'Stripe customer ID', required: true },
      items: { type: 'array', description: 'Invoice items', required: true },
    },
    required: ['customer', 'items'],
  },
}

/**
 * Generate a generic schema for unknown tools
 */
function generateGenericSchema(toolSlug: string): {
  properties: Record<string, { type: string; description?: string }>;
  required: string[];
} {
  const toolkit = toolSlug.split('_')[0].toLowerCase()
  const action = toolSlug.split('_').slice(1).join(' ').toLowerCase()

  // Common patterns for different action types
  if (action.includes('send') || action.includes('post')) {
    return {
      properties: {
        recipient: { type: 'string', description: 'Where to send' },
        content: { type: 'string', description: 'Content to send' },
      },
      required: ['recipient', 'content'],
    }
  }

  if (action.includes('create') || action.includes('add')) {
    return {
      properties: {
        name: { type: 'string', description: 'Name for the new item' },
        data: { type: 'object', description: 'Additional data' },
      },
      required: ['name'],
    }
  }

  if (action.includes('list') || action.includes('get')) {
    return {
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Maximum results' },
      },
      required: [],
    }
  }

  if (action.includes('upload') || action.includes('save')) {
    return {
      properties: {
        path: { type: 'string', description: 'Destination path' },
        content: { type: 'string', description: 'Content to save' },
      },
      required: ['path', 'content'],
    }
  }

  // Default fallback
  return {
    properties: {
      input: { type: 'string', description: `Input for ${toolkit} ${action}` },
    },
    required: [],
  }
}

/**
 * POST /api/rube/get-tool-schemas
 * Get schemas for specified tools
 * @NEXUS-FIX-053: Rube MCP proxy for browser schema resolution
 *
 * Request: { tool_slugs: string[], session_id: string }
 * Response: { success: boolean, schemas: Array<{ tool_slug, input_schema }> }
 */
router.post('/get-tool-schemas', async (req: Request, res: Response) => {
  const { tool_slugs, session_id } = req.body

  if (!tool_slugs || !Array.isArray(tool_slugs)) {
    return res.status(400).json({
      success: false,
      error: 'tool_slugs array is required',
    })
  }

  console.log(`[Rube] Getting schemas for ${tool_slugs.length} tools, session: ${session_id}`)

  try {
    const schemas = tool_slugs.map((slug) => {
      // Try to find a pre-defined schema
      const schema = COMMON_SCHEMAS[slug]

      if (schema) {
        console.log(`[Rube] Found schema for ${slug}`)
        return {
          tool_slug: slug,
          input_schema: schema,
        }
      }

      // Generate a generic schema based on the tool slug
      console.log(`[Rube] Generating generic schema for ${slug}`)
      const genericSchema = generateGenericSchema(slug)

      return {
        tool_slug: slug,
        input_schema: genericSchema,
      }
    })

    console.log(`[Rube] Returning ${schemas.length} schemas`)

    res.json({
      success: true,
      schemas,
    })
  } catch (error) {
    console.error('[Rube] Schema fetch error:', error)
    res.status(500).json({
      success: false,
      error: String(error),
    })
  }
})

/**
 * GET /api/rube/status
 * Get Rube MCP service status
 * @NEXUS-FIX-053: Rube MCP proxy status endpoint
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    // Check if Composio is initialized
    const composioInitialized = composioService.initialized

    // Count available tools and schemas
    const toolCount = Object.values(TOOL_CATALOG).reduce((sum, tools) => sum + tools.length, 0)
    const schemaCount = Object.keys(COMMON_SCHEMAS).length
    const toolkitCount = Object.keys(TOOL_CATALOG).length

    res.json({
      success: true,
      initialized: true,
      available: true,
      composioInitialized,
      stats: {
        toolkits: toolkitCount,
        tools: toolCount,
        schemas: schemaCount,
      },
      message: `Rube proxy ready: ${toolkitCount} toolkits, ${toolCount} tools, ${schemaCount} schemas`,
    })
  } catch (error) {
    console.error('[Rube] Status check error:', error)
    res.status(500).json({
      success: false,
      initialized: false,
      available: false,
      error: String(error),
    })
  }
})

export default router

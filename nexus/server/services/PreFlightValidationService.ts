/**
 * PreFlightValidationService - Backend Pre-Flight with REAL Schema Fetching
 *
 * FIX-074: This service replaces the frontend's hardcoded TOOL_REQUIREMENTS
 * with dynamic schema fetching from Composio SDK.
 *
 * Architecture:
 * 1. Takes workflow nodes
 * 2. For EACH tool, fetches the REAL schema from Composio
 * 3. Compares against collected params
 * 4. Returns missing requirements as user-friendly questions
 * 5. BLOCKS execution until all requirements are met
 *
 * @NEXUS-FIX-074: Backend pre-flight with dynamic schema fetching - DO NOT REMOVE
 */

import { Composio } from '@composio/core'

// ============================================================================
// TYPES
// ============================================================================

export interface WorkflowNode {
  id: string
  name: string
  type: 'trigger' | 'action'
  tool?: string
  integration?: string
  action?: string
  params?: Record<string, unknown>
  extractedParams?: Record<string, { value?: unknown }>
}

export interface PreFlightQuestion {
  id: string
  nodeId: string
  nodeName: string
  integration: string
  paramName: string
  displayName: string
  prompt: string
  inputType: 'text' | 'email' | 'phone' | 'url' | 'textarea' | 'select' | 'number'
  placeholder: string
  quickActions: Array<{ label: string; value: string }>
  required: boolean
  description?: string
}

export interface PreFlightResult {
  ready: boolean
  questions: PreFlightQuestion[]
  connections: Array<{
    toolkit: string
    connected: boolean
    authUrl?: string
  }>
  summary: {
    totalQuestions: number
    answeredQuestions: number
    totalConnections: number
    connectedCount: number
  }
  schemaSource: 'composio' | 'fallback' | 'mixed'
}

export interface ToolSchema {
  toolSlug: string
  properties: Record<string, {
    type: string
    description?: string
    required?: boolean
    enum?: string[]
    default?: unknown
  }>
  required: string[]
  source: 'composio' | 'common' | 'generic'
}

// ============================================================================
// FALLBACK SCHEMAS (when Composio SDK is unavailable)
// Synced with rube.ts COMMON_SCHEMAS but enhanced with display info
// ============================================================================

const FALLBACK_SCHEMAS: Record<string, {
  required: string[]
  properties: Record<string, {
    type: string
    description: string
    displayName?: string
    inputType?: 'text' | 'email' | 'phone' | 'url' | 'textarea' | 'select' | 'number'
    quickActions?: Array<{ label: string; value: string }>
  }>
}> = {
  // Gmail
  GMAIL_SEND_EMAIL: {
    required: ['to', 'subject', 'body'],
    properties: {
      to: { type: 'string', description: 'Email recipient', displayName: 'Recipient Email', inputType: 'email', quickActions: [{ label: 'Send to Myself', value: '{{user_email}}' }] },
      subject: { type: 'string', description: 'Email subject line', displayName: 'Subject', inputType: 'text' },
      body: { type: 'string', description: 'Email body content', displayName: 'Email Body', inputType: 'textarea' },
      cc: { type: 'string', description: 'CC recipients (comma-separated)', displayName: 'CC' },
      bcc: { type: 'string', description: 'BCC recipients (comma-separated)', displayName: 'BCC' },
    }
  },
  GMAIL_GET_MESSAGE: {
    required: ['message_id'],
    properties: {
      message_id: { type: 'string', description: 'Gmail message ID', displayName: 'Message ID' }
    }
  },
  GMAIL_LIST_MESSAGES: {
    required: [],
    properties: {
      query: { type: 'string', description: 'Search query (Gmail syntax)', displayName: 'Search Query' },
      max_results: { type: 'number', description: 'Maximum messages to return', displayName: 'Max Results', inputType: 'number' }
    }
  },

  // Slack
  SLACK_SEND_MESSAGE: {
    required: ['channel', 'text'],
    properties: {
      channel: { type: 'string', description: 'Slack channel name or ID', displayName: 'Channel', quickActions: [{ label: '#general', value: 'general' }, { label: '#team', value: 'team' }] },
      text: { type: 'string', description: 'Message text', displayName: 'Message', inputType: 'textarea' }
    }
  },
  SLACK_LIST_CHANNELS: {
    required: [],
    properties: {
      types: { type: 'string', description: 'Channel types', displayName: 'Channel Types' }
    }
  },

  // Google Sheets
  GOOGLESHEETS_APPEND_DATA: {
    required: ['spreadsheet_id', 'range', 'values'],
    properties: {
      spreadsheet_id: { type: 'string', description: 'Google Sheet ID or URL', displayName: 'Spreadsheet', inputType: 'url' },
      range: { type: 'string', description: 'Cell range (e.g., Sheet1!A1)', displayName: 'Range' },
      values: { type: 'array', description: 'Data rows to append', displayName: 'Data' }
    }
  },
  GOOGLESHEETS_GET_DATA: {
    required: ['spreadsheet_id', 'range'],
    properties: {
      spreadsheet_id: { type: 'string', description: 'Google Sheet ID or URL', displayName: 'Spreadsheet', inputType: 'url' },
      range: { type: 'string', description: 'Cell range to read', displayName: 'Range' }
    }
  },

  // Dropbox
  DROPBOX_UPLOAD_FILE: {
    required: ['path', 'content'],
    properties: {
      path: { type: 'string', description: 'Destination path in Dropbox', displayName: 'File Path', quickActions: [{ label: 'Documents', value: '/Documents' }] },
      content: { type: 'string', description: 'File content to upload', displayName: 'Content', inputType: 'textarea' }
    }
  },
  DROPBOX_LIST_FOLDER: {
    required: ['path'],
    properties: {
      path: { type: 'string', description: 'Folder path to list', displayName: 'Folder Path', quickActions: [{ label: 'Root', value: '/' }] }
    }
  },

  // Notion
  NOTION_CREATE_PAGE: {
    required: ['parent_id', 'title'],
    properties: {
      parent_id: { type: 'string', description: 'Parent page or database ID', displayName: 'Parent Page', inputType: 'url' },
      title: { type: 'string', description: 'Page title', displayName: 'Title' },
      content: { type: 'string', description: 'Page content', displayName: 'Content', inputType: 'textarea' }
    }
  },

  // Discord
  DISCORD_SEND_MESSAGE: {
    required: ['channel_id', 'content'],
    properties: {
      channel_id: { type: 'string', description: 'Discord channel ID', displayName: 'Channel' },
      content: { type: 'string', description: 'Message content', displayName: 'Message', inputType: 'textarea' }
    }
  },

  // WhatsApp
  WHATSAPP_SEND_MESSAGE: {
    required: ['to', 'message'],
    properties: {
      to: { type: 'string', description: 'Recipient phone number', displayName: 'Phone Number', inputType: 'phone', quickActions: [{ label: 'My Phone', value: '{{user_phone}}' }] },
      message: { type: 'string', description: 'Message text', displayName: 'Message', inputType: 'textarea' }
    }
  },

  // GitHub
  GITHUB_CREATE_ISSUE: {
    required: ['owner', 'repo', 'title'],
    properties: {
      owner: { type: 'string', description: 'Repository owner', displayName: 'Owner' },
      repo: { type: 'string', description: 'Repository name', displayName: 'Repository' },
      title: { type: 'string', description: 'Issue title', displayName: 'Title' },
      body: { type: 'string', description: 'Issue body', displayName: 'Description', inputType: 'textarea' }
    }
  },

  // Google Calendar
  GOOGLECALENDAR_CREATE_EVENT: {
    required: ['summary', 'start', 'end'],
    properties: {
      summary: { type: 'string', description: 'Event title', displayName: 'Event Title' },
      start: { type: 'string', description: 'Start time (ISO format)', displayName: 'Start Time' },
      end: { type: 'string', description: 'End time (ISO format)', displayName: 'End Time' },
      description: { type: 'string', description: 'Event description', displayName: 'Description', inputType: 'textarea' }
    }
  },

  // ClickUp (NEW - This was missing!)
  CLICKUP_CREATE_TASK: {
    required: ['list_id', 'name'],
    properties: {
      list_id: { type: 'string', description: 'ClickUp list ID', displayName: 'List' },
      name: { type: 'string', description: 'Task name', displayName: 'Task Name' },
      description: { type: 'string', description: 'Task description', displayName: 'Description', inputType: 'textarea' },
      priority: { type: 'number', description: 'Priority (1-4)', displayName: 'Priority', inputType: 'number' },
      status: { type: 'string', description: 'Task status', displayName: 'Status' }
    }
  },
  CLICKUP_UPDATE_TASK: {
    required: ['task_id'],
    properties: {
      task_id: { type: 'string', description: 'ClickUp task ID', displayName: 'Task ID' },
      name: { type: 'string', description: 'New task name', displayName: 'Task Name' },
      status: { type: 'string', description: 'New status', displayName: 'Status' }
    }
  },
  CLICKUP_GET_TASK: {
    required: ['task_id'],
    properties: {
      task_id: { type: 'string', description: 'ClickUp task ID', displayName: 'Task ID' }
    }
  },

  // Monday.com
  MONDAY_CREATE_ITEM: {
    required: ['board_id', 'item_name'],
    properties: {
      board_id: { type: 'string', description: 'Monday.com board ID', displayName: 'Board' },
      item_name: { type: 'string', description: 'Item name', displayName: 'Item Name' },
      column_values: { type: 'object', description: 'Column values', displayName: 'Columns' }
    }
  },

  // Jira
  JIRA_CREATE_ISSUE: {
    required: ['project_key', 'summary', 'issue_type'],
    properties: {
      project_key: { type: 'string', description: 'Jira project key', displayName: 'Project' },
      summary: { type: 'string', description: 'Issue summary', displayName: 'Summary' },
      issue_type: { type: 'string', description: 'Issue type (Bug, Task, Story)', displayName: 'Type' },
      description: { type: 'string', description: 'Issue description', displayName: 'Description', inputType: 'textarea' }
    }
  },

  // HubSpot
  HUBSPOT_CREATE_CONTACT: {
    required: ['email'],
    properties: {
      email: { type: 'string', description: 'Contact email', displayName: 'Email', inputType: 'email' },
      firstname: { type: 'string', description: 'First name', displayName: 'First Name' },
      lastname: { type: 'string', description: 'Last name', displayName: 'Last Name' },
      company: { type: 'string', description: 'Company name', displayName: 'Company' }
    }
  },

  // Airtable
  AIRTABLE_CREATE_RECORD: {
    required: ['base_id', 'table_name', 'fields'],
    properties: {
      base_id: { type: 'string', description: 'Airtable base ID', displayName: 'Base' },
      table_name: { type: 'string', description: 'Table name', displayName: 'Table' },
      fields: { type: 'object', description: 'Record fields', displayName: 'Fields' }
    }
  },

  // Trello
  TRELLO_CREATE_CARD: {
    required: ['list_id', 'name'],
    properties: {
      list_id: { type: 'string', description: 'Trello list ID', displayName: 'List' },
      name: { type: 'string', description: 'Card name', displayName: 'Card Name' },
      desc: { type: 'string', description: 'Card description', displayName: 'Description', inputType: 'textarea' }
    }
  },

  // Asana
  ASANA_CREATE_TASK: {
    required: ['project_id', 'name'],
    properties: {
      project_id: { type: 'string', description: 'Asana project ID', displayName: 'Project' },
      name: { type: 'string', description: 'Task name', displayName: 'Task Name' },
      notes: { type: 'string', description: 'Task notes', displayName: 'Notes', inputType: 'textarea' }
    }
  },

  // Linear
  LINEAR_CREATE_ISSUE: {
    required: ['team_id', 'title'],
    properties: {
      team_id: { type: 'string', description: 'Linear team ID', displayName: 'Team' },
      title: { type: 'string', description: 'Issue title', displayName: 'Title' },
      description: { type: 'string', description: 'Issue description', displayName: 'Description', inputType: 'textarea' }
    }
  },

  // Stripe
  STRIPE_CREATE_INVOICE: {
    required: ['customer'],
    properties: {
      customer: { type: 'string', description: 'Stripe customer ID', displayName: 'Customer' },
      items: { type: 'array', description: 'Invoice items', displayName: 'Items' }
    }
  },

  // Twitter/X
  TWITTER_CREATE_TWEET: {
    required: ['text'],
    properties: {
      text: { type: 'string', description: 'Tweet content (280 chars max)', displayName: 'Tweet', inputType: 'textarea' }
    }
  },
}

// ============================================================================
// SEMANTIC PARAM ALIASES
// Maps different param names that mean the same thing
// ============================================================================

const PARAM_ALIASES: Record<string, string[]> = {
  // Text/message content
  text: ['message', 'content', 'body', 'notification_details', 'notification_content', 'message_text'],
  message: ['text', 'content', 'body', 'notification_details'],
  body: ['text', 'message', 'content', 'email_body'],
  content: ['text', 'message', 'body'],

  // Recipients
  to: ['recipient', 'recipient_email', 'email_to', 'send_to', 'email_address'],
  channel: ['slack_channel', 'channel_name', 'channel_id'],

  // Identifiers
  spreadsheet_id: ['sheet_id', 'google_sheet', 'spreadsheet_url'],
  list_id: ['clickup_list', 'list'],
  task_id: ['clickup_task', 'task'],
  board_id: ['trello_board', 'monday_board', 'board'],
  project_id: ['asana_project', 'project'],
}

// ============================================================================
// TRIGGER TYPES (don't need user params - they PULL data)
// ============================================================================

const TRIGGER_INTEGRATIONS = [
  'gmail', 'slack', 'github', 'stripe', 'webhook', 'clickup',
  'monday', 'jira', 'hubspot', 'airtable', 'trello', 'asana'
]

// ============================================================================
// SERVICE CLASS
// ============================================================================

class PreFlightValidationServiceClass {
  private composio: Composio | null = null
  private schemaCache: Map<string, ToolSchema> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private CACHE_TTL = 1000 * 60 * 30 // 30 minutes

  /**
   * Initialize with Composio SDK for real schema fetching
   */
  async initialize(apiKey?: string): Promise<boolean> {
    const key = apiKey || process.env.COMPOSIO_API_KEY

    if (!key) {
      console.log('[PreFlightValidation] No API key - using fallback schemas')
      return false
    }

    try {
      this.composio = new Composio({ apiKey: key })
      console.log('[PreFlightValidation] Initialized with Composio SDK')
      return true
    } catch (error) {
      console.error('[PreFlightValidation] Failed to initialize:', error)
      return false
    }
  }

  /**
   * Get the initialized status
   */
  get initialized(): boolean {
    return this.composio !== null
  }

  /**
   * @NEXUS-FIX-074: Fetch REAL tool schema from Composio
   * Falls back to FALLBACK_SCHEMAS or generic schema
   */
  async getToolSchema(toolSlug: string): Promise<ToolSchema> {
    // Check cache first
    const cached = this.schemaCache.get(toolSlug)
    const expiry = this.cacheExpiry.get(toolSlug)
    if (cached && expiry && Date.now() < expiry) {
      return cached
    }

    // Try Composio SDK first
    if (this.composio) {
      try {
        const toolkit = toolSlug.split('_')[0].toLowerCase()
        const tools = await this.composio.tools.getRawComposioTools({
          toolkits: [toolkit],
        })

        if (tools && Array.isArray(tools)) {
          // Find the specific tool
          const tool = tools.find((t: { slug?: string; name?: string }) =>
            t.slug?.toUpperCase() === toolSlug.toUpperCase() ||
            t.name?.toUpperCase().replace(/\s+/g, '_') === toolSlug.toUpperCase()
          )

          if (tool) {
            // Extract schema from Composio tool response
            // The structure varies, so we need to handle different formats
            const rawTool = tool as Record<string, unknown>
            const inputSchema = rawTool.inputSchema || rawTool.parameters || rawTool.input_schema

            if (inputSchema && typeof inputSchema === 'object') {
              const schemaObj = inputSchema as {
                properties?: Record<string, { type?: string; description?: string }>
                required?: string[]
              }

              const schema: ToolSchema = {
                toolSlug,
                properties: {},
                required: schemaObj.required || [],
                source: 'composio'
              }

              // Parse properties
              if (schemaObj.properties) {
                for (const [key, prop] of Object.entries(schemaObj.properties)) {
                  schema.properties[key] = {
                    type: prop.type || 'string',
                    description: prop.description || key,
                  }
                }
              }

              // Cache it
              this.schemaCache.set(toolSlug, schema)
              this.cacheExpiry.set(toolSlug, Date.now() + this.CACHE_TTL)

              console.log(`[PreFlightValidation] Got REAL schema for ${toolSlug} from Composio (${schema.required.length} required params)`)
              return schema
            }
          }
        }
      } catch (error) {
        console.warn(`[PreFlightValidation] Composio SDK error for ${toolSlug}:`, error)
        // Fall through to fallback
      }
    }

    // Fallback to predefined schemas
    const fallback = FALLBACK_SCHEMAS[toolSlug]
    if (fallback) {
      const schema: ToolSchema = {
        toolSlug,
        properties: {},
        required: fallback.required,
        source: 'common'
      }

      for (const [key, prop] of Object.entries(fallback.properties)) {
        schema.properties[key] = {
          type: prop.type,
          description: prop.description,
        }
      }

      console.log(`[PreFlightValidation] Using FALLBACK schema for ${toolSlug}`)
      return schema
    }

    // Generate generic schema as last resort
    console.log(`[PreFlightValidation] Generating GENERIC schema for ${toolSlug}`)
    return this.generateGenericSchema(toolSlug)
  }

  /**
   * Generate a generic schema based on tool slug pattern
   */
  private generateGenericSchema(toolSlug: string): ToolSchema {
    const parts = toolSlug.split('_')
    const toolkit = parts[0].toLowerCase()
    const action = parts.slice(1).join('_').toLowerCase()

    // Pattern-based generic schemas
    if (action.includes('send') || action.includes('post') || action.includes('message')) {
      return {
        toolSlug,
        properties: {
          recipient: { type: 'string', description: 'Where to send (channel, email, etc.)' },
          content: { type: 'string', description: 'Content/message to send' },
        },
        required: ['recipient', 'content'],
        source: 'generic'
      }
    }

    if (action.includes('create') || action.includes('add') || action.includes('new')) {
      return {
        toolSlug,
        properties: {
          name: { type: 'string', description: `Name for the new ${toolkit} item` },
          description: { type: 'string', description: 'Description or details' },
        },
        required: ['name'],
        source: 'generic'
      }
    }

    if (action.includes('update') || action.includes('edit') || action.includes('modify')) {
      return {
        toolSlug,
        properties: {
          id: { type: 'string', description: `ID of the ${toolkit} item to update` },
          data: { type: 'object', description: 'Fields to update' },
        },
        required: ['id'],
        source: 'generic'
      }
    }

    if (action.includes('get') || action.includes('read') || action.includes('fetch')) {
      return {
        toolSlug,
        properties: {
          id: { type: 'string', description: `ID of the ${toolkit} item to retrieve` },
        },
        required: ['id'],
        source: 'generic'
      }
    }

    if (action.includes('list') || action.includes('search') || action.includes('find')) {
      return {
        toolSlug,
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Maximum results' },
        },
        required: [],
        source: 'generic'
      }
    }

    if (action.includes('upload') || action.includes('save') || action.includes('store')) {
      return {
        toolSlug,
        properties: {
          path: { type: 'string', description: 'Destination path or location' },
          content: { type: 'string', description: 'Content to save' },
        },
        required: ['path', 'content'],
        source: 'generic'
      }
    }

    // Default fallback
    return {
      toolSlug,
      properties: {
        input: { type: 'string', description: `Input for ${toolkit} ${action}` },
      },
      required: [],
      source: 'generic'
    }
  }

  /**
   * Build the actual tool slug from node info
   */
  private buildToolSlug(node: WorkflowNode): string | null {
    const integration = (node.integration || node.tool || '').toLowerCase()
    const action = (node.action || '').toLowerCase()

    if (!integration) return null

    // If we have a specific action, build the slug
    if (action) {
      return `${integration.toUpperCase()}_${action.toUpperCase().replace(/\s+/g, '_')}`
    }

    // Infer action from node type and name
    const name = node.name.toLowerCase()

    if (node.type === 'trigger') {
      // Triggers usually monitor/watch things
      if (name.includes('new') || name.includes('added')) {
        return `${integration.toUpperCase()}_ON_NEW_ITEM`
      }
      return `${integration.toUpperCase()}_TRIGGER`
    }

    // Infer from name
    if (name.includes('send') || name.includes('post')) {
      return `${integration.toUpperCase()}_SEND_MESSAGE`
    }
    if (name.includes('create') || name.includes('add')) {
      return `${integration.toUpperCase()}_CREATE_TASK`
    }
    if (name.includes('update') || name.includes('modify')) {
      return `${integration.toUpperCase()}_UPDATE_TASK`
    }
    if (name.includes('email')) {
      return `${integration.toUpperCase()}_SEND_EMAIL`
    }

    // Default to create for actions
    return `${integration.toUpperCase()}_CREATE_ITEM`
  }

  /**
   * Check if a parameter is already provided
   */
  private isParamProvided(
    paramName: string,
    integration: string,
    nodeId: string,
    collectedParams: Record<string, string>,
    nodeParams?: Record<string, unknown>,
    extractedParams?: Record<string, { value?: unknown }>
  ): boolean {
    // Get all possible aliases for this param
    const aliases = PARAM_ALIASES[paramName] || []
    const keysToCheck = [
      paramName,
      `${integration}_${paramName}`,
      `${nodeId}_${paramName}`,
      ...aliases,
      ...aliases.map(a => `${integration}_${a}`),
    ]

    // Check collectedParams
    for (const key of keysToCheck) {
      if (collectedParams[key] !== undefined && collectedParams[key] !== '') {
        return true
      }
    }

    // Check node's direct params
    if (nodeParams) {
      for (const key of keysToCheck) {
        const value = nodeParams[key]
        if (value !== undefined && value !== '') {
          return true
        }
      }
    }

    // Check extracted params (AI format)
    if (extractedParams) {
      for (const key of keysToCheck) {
        const extracted = extractedParams[key]
        if (extracted?.value !== undefined && extracted.value !== '') {
          return true
        }
      }
    }

    return false
  }

  /**
   * Generate user-friendly question for a missing param
   */
  private generateQuestion(
    paramName: string,
    paramInfo: { type: string; description?: string },
    integration: string,
    node: WorkflowNode,
    fallbackConfig?: {
      displayName?: string
      inputType?: string
      quickActions?: Array<{ label: string; value: string }>
    }
  ): PreFlightQuestion {
    // Map param names to user-friendly prompts
    const promptTemplates: Record<string, { prompt: string; displayName: string; inputType: string }> = {
      to: { prompt: `Who should receive the ${node.name}?`, displayName: 'Recipient', inputType: 'email' },
      recipient: { prompt: `Who should receive this?`, displayName: 'Recipient', inputType: 'email' },
      channel: { prompt: `Which ${integration} channel?`, displayName: 'Channel', inputType: 'text' },
      channel_id: { prompt: `Which channel should I use?`, displayName: 'Channel', inputType: 'text' },
      text: { prompt: `What message should I send?`, displayName: 'Message', inputType: 'textarea' },
      message: { prompt: `What message should I send?`, displayName: 'Message', inputType: 'textarea' },
      content: { prompt: `What content should I include?`, displayName: 'Content', inputType: 'textarea' },
      body: { prompt: `What should the body say?`, displayName: 'Body', inputType: 'textarea' },
      subject: { prompt: `What should the subject line say?`, displayName: 'Subject', inputType: 'text' },
      title: { prompt: `What should the title be?`, displayName: 'Title', inputType: 'text' },
      name: { prompt: `What should this be called?`, displayName: 'Name', inputType: 'text' },
      description: { prompt: `Any description or notes?`, displayName: 'Description', inputType: 'textarea' },
      path: { prompt: `Where should I save this?`, displayName: 'Location', inputType: 'text' },
      spreadsheet_id: { prompt: `Which Google Sheet should I use?`, displayName: 'Spreadsheet', inputType: 'url' },
      list_id: { prompt: `Which list should I use?`, displayName: 'List', inputType: 'text' },
      task_id: { prompt: `Which task?`, displayName: 'Task', inputType: 'text' },
      board_id: { prompt: `Which board?`, displayName: 'Board', inputType: 'text' },
      project_id: { prompt: `Which project?`, displayName: 'Project', inputType: 'text' },
      team_id: { prompt: `Which team?`, displayName: 'Team', inputType: 'text' },
    }

    const template = promptTemplates[paramName]
    const displayName = fallbackConfig?.displayName || template?.displayName || this.toDisplayName(paramName)
    const inputType = (fallbackConfig?.inputType || template?.inputType || 'text') as PreFlightQuestion['inputType']
    const prompt = template?.prompt || `What ${displayName.toLowerCase()} should I use for "${node.name}"?`

    // Build quick actions
    const quickActions = fallbackConfig?.quickActions || []

    // Add common quick actions based on param type
    if (paramName === 'to' || paramName === 'recipient') {
      if (!quickActions.some(a => a.label.includes('Myself'))) {
        quickActions.push({ label: 'Send to Myself', value: '{{user_email}}' })
      }
    }

    return {
      id: `${node.id}_${paramName}`,
      nodeId: node.id,
      nodeName: node.name,
      integration,
      paramName,
      displayName,
      prompt,
      inputType,
      placeholder: paramInfo.description || `Enter ${displayName.toLowerCase()}...`,
      quickActions,
      required: true,
      description: paramInfo.description,
    }
  }

  /**
   * Convert param_name to Display Name
   */
  private toDisplayName(paramName: string): string {
    return paramName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * @NEXUS-FIX-074: Main pre-flight check function
   * Returns all missing requirements for a workflow
   */
  async check(
    nodes: WorkflowNode[],
    collectedParams: Record<string, string>,
    connectedIntegrations: string[]
  ): Promise<PreFlightResult> {
    const questions: PreFlightQuestion[] = []
    const connections: PreFlightResult['connections'] = []
    const seenIntegrations = new Set<string>()
    let schemaSource: 'composio' | 'fallback' | 'mixed' = this.composio ? 'composio' : 'fallback'
    let usedComposio = false
    let usedFallback = false

    console.log(`[PreFlightValidation] Checking ${nodes.length} nodes...`)

    for (const node of nodes) {
      const integration = (node.integration || node.tool || '').toLowerCase()

      if (!integration) continue

      // Track connections
      if (!seenIntegrations.has(integration)) {
        seenIntegrations.add(integration)
        connections.push({
          toolkit: integration,
          connected: connectedIntegrations.map(i => i.toLowerCase()).includes(integration)
        })
      }

      // Skip param requirements for trigger nodes (they PULL data)
      if (node.type === 'trigger' && TRIGGER_INTEGRATIONS.includes(integration)) {
        console.log(`[PreFlightValidation] Skipping trigger node: ${node.name}`)
        continue
      }

      // Build tool slug and get schema
      const toolSlug = this.buildToolSlug(node)
      if (!toolSlug) continue

      console.log(`[PreFlightValidation] Checking params for ${toolSlug}...`)

      const schema = await this.getToolSchema(toolSlug)

      // Track schema sources for reporting
      if (schema.source === 'composio') usedComposio = true
      if (schema.source === 'common' || schema.source === 'generic') usedFallback = true

      // Check each required param
      for (const paramName of schema.required) {
        const isProvided = this.isParamProvided(
          paramName,
          integration,
          node.id,
          collectedParams,
          node.params,
          node.extractedParams
        )

        if (!isProvided) {
          // Get fallback config for better UX
          const fallbackSchema = FALLBACK_SCHEMAS[toolSlug]
          const fallbackConfig = fallbackSchema?.properties[paramName]

          const question = this.generateQuestion(
            paramName,
            schema.properties[paramName] || { type: 'string' },
            integration,
            node,
            fallbackConfig
          )

          questions.push(question)
          console.log(`[PreFlightValidation] Missing required param: ${paramName} for ${node.name}`)
        }
      }
    }

    // Determine schema source
    if (usedComposio && usedFallback) {
      schemaSource = 'mixed'
    } else if (usedComposio) {
      schemaSource = 'composio'
    } else {
      schemaSource = 'fallback'
    }

    // Calculate readiness
    const totalConnections = connections.length
    const connectedCount = connections.filter(c => c.connected).length
    const allConnected = connectedCount === totalConnections
    const allAnswered = questions.length === 0

    console.log(`[PreFlightValidation] Result: ${questions.length} questions, ${connectedCount}/${totalConnections} connected, ready=${allConnected && allAnswered}`)

    return {
      ready: allConnected && allAnswered,
      questions,
      connections,
      summary: {
        totalQuestions: questions.length,
        answeredQuestions: 0,
        totalConnections,
        connectedCount
      },
      schemaSource
    }
  }

  /**
   * Clear the schema cache
   */
  clearCache(): void {
    this.schemaCache.clear()
    this.cacheExpiry.clear()
    console.log('[PreFlightValidation] Cache cleared')
  }
}

// Export singleton instance
export const preFlightValidationService = new PreFlightValidationServiceClass()
export default PreFlightValidationServiceClass

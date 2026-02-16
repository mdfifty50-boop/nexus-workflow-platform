/**
 * WorkflowPreviewCard Tool Utilities
 *
 * Pure utility functions for tool slug resolution, validation, parameter mapping,
 * and fallback logic. All @NEXUS-FIX markers preserved.
 */

import { TOOL_SLUGS, ACTION_KEYWORDS, PARAM_ALIASES } from './wpc-constants'
import type { WorkflowNode } from './wpc-types'
// @NEXUS-FIX-120: MasterAliasRegistry - Canonical alias source for integration names
import { INTEGRATION_ALIASES as MASTER_ALIASES } from '@/lib/MasterAliasRegistry'

// ============================================================================
// @NEXUS-FIX-103: Semantic parameter alias functions - DO NOT REMOVE
// ============================================================================

// @NEXUS-FIX-103: Check if a param is semantically already collected via aliases
// @NEXUS-FIX-107: Normalize spaces to underscores for proper alias matching - DO NOT REMOVE
export function isParamSemanticallycollected(paramName: string, collectedParams: Record<string, string>): boolean {
  // FIX-107: Normalize spaces to underscores (e.g., "slack channel" → "slack_channel")
  const lowerParam = paramName.toLowerCase().replace(/\s+/g, '_')

  // Direct match first (check both original and normalized)
  if (collectedParams[paramName] !== undefined && collectedParams[paramName] !== '') {
    return true
  }
  // Also check with spaces converted to spaces (for collected params like "slack channel")
  const normalizedParam = paramName.replace(/\s+/g, '_')
  if (collectedParams[normalizedParam] !== undefined && collectedParams[normalizedParam] !== '') {
    return true
  }

  // Check aliases
  const aliases = PARAM_ALIASES[lowerParam] || []
  for (const alias of aliases) {
    // Check direct alias
    if (collectedParams[alias] !== undefined && collectedParams[alias] !== '') {
      return true
    }
    // Check with common prefixes (e.g., gmail_to, slack_channel)
    for (const key of Object.keys(collectedParams)) {
      const keyLower = key.toLowerCase()
      if (keyLower.endsWith(`_${alias}`) || keyLower.endsWith(`_${lowerParam}`)) {
        if (collectedParams[key] !== undefined && collectedParams[key] !== '') {
          return true
        }
      }
    }
  }

  // Also check if this param is an alias of something already collected
  for (const [canonical, aliasList] of Object.entries(PARAM_ALIASES)) {
    if (aliasList.includes(lowerParam)) {
      if (collectedParams[canonical] !== undefined && collectedParams[canonical] !== '') {
        return true
      }
    }
  }

  return false
}

// @NEXUS-FIX-103: Get the canonical name for a param (for deduplication grouping)
// @NEXUS-FIX-107: Normalize spaces to underscores for proper alias matching - DO NOT REMOVE
export function getCanonicalParamName(paramName: string): string {
  // FIX-107: Normalize spaces to underscores (e.g., "slack channel" → "slack_channel")
  const lowerParam = paramName.toLowerCase().replace(/\s+/g, '_')

  // Check if this param is a known alias
  for (const [canonical, aliases] of Object.entries(PARAM_ALIASES)) {
    if (canonical === lowerParam || aliases.includes(lowerParam)) {
      return canonical
    }
  }

  return lowerParam
}

// ============================================================================
// @NEXUS-FIX-019 & @NEXUS-FIX-020: Tool validation and fallback system - DO NOT REMOVE
// ============================================================================

/**
 * Get fallback tool suggestions when a tool is not found
 * FIX-020: Provides alternatives for common tool resolution failures
 */
export function getFallbackTools(toolkit: string, originalSlug: string, nodeName: string): string[] {
  const toolkitLower = toolkit.toLowerCase()
  const toolkitMapping = TOOL_SLUGS[toolkitLower as keyof typeof TOOL_SLUGS]

  if (!toolkitMapping || typeof toolkitMapping !== 'object') {
    return []
  }

  const availableTools = Object.values(toolkitMapping) as string[]
  const nameLower = nodeName.toLowerCase()

  // Prioritize based on action context
  const prioritized: string[] = []
  const rest: string[] = []

  for (const tool of availableTools) {
    // Skip the original failed slug
    if (tool === originalSlug) continue

    // Prioritize upload/write tools for 'save/store' context
    if (nameLower.includes('save') || nameLower.includes('store') || nameLower.includes('write')) {
      if (tool.includes('UPLOAD') || tool.includes('CREATE')) {
        prioritized.push(tool)
        continue
      }
    }

    rest.push(tool)
  }

  return [...prioritized, ...rest].slice(0, 3)
}

/**
 * Validate tool slug before execution
 * FIX-019: Pre-execution validation with auto-correction for known bad patterns
 */
export function validateToolSlug(toolSlug: string, toolkit: string): { valid: boolean; suggestion?: string; reason?: string } {
  // @NEXUS-FIX-019: Pre-execution tool validation - DO NOT REMOVE
  // Check for known problematic patterns based on toolkit
  const toolkitUpper = toolkit.toUpperCase()

  if (toolSlug.endsWith('_LIST_FILES')) {
    // Many services use LIST_FOLDER or LIST_ITEMS instead of LIST_FILES
    const suggestion = toolSlug.replace('_LIST_FILES', '_LIST_FOLDER')
    return { valid: false, reason: `${toolSlug} likely does not exist - try LIST_FOLDER`, suggestion }
  }

  // Check if the slug matches standard Composio patterns
  const parts = toolSlug.split('_')
  if (parts.length < 2) {
    return { valid: false, reason: 'Tool slug should be in format TOOLKIT_ACTION', suggestion: undefined }
  }

  // Verify the slug starts with the expected toolkit prefix
  if (!toolSlug.startsWith(toolkitUpper + '_') && !toolSlug.startsWith(toolkit + '_')) {
    return { valid: false, reason: `Tool slug ${toolSlug} does not match toolkit ${toolkit}`, suggestion: undefined }
  }

  return { valid: true }
}

/**
 * Check if an error is a tool-not-found error
 */
export function isToolNotFoundError(error: string | Error): boolean {
  const message = typeof error === 'string' ? error : error.message
  return message.toLowerCase().includes('tool') &&
    (message.toLowerCase().includes('not found') ||
     message.toLowerCase().includes('unable to retrieve') ||
     message.toLowerCase().includes('does not exist'))
}
// @NEXUS-FIX-019 & @NEXUS-FIX-020-END

// ============================================================================
// Tool Slug Resolution
// ============================================================================

/**
 * Map a node name and toolkit to a Composio tool slug
 *
 * STRATEGY: 3-layer approach to handle "thousands of scenarios"
 * 1. Exact mapping from TOOL_SLUGS (fastest, most reliable)
 * 2. Dynamic construction using Composio naming patterns
 * 3. Intelligent default based on node type/context
 */
export function mapNodeToToolSlug(nodeName: string, toolkit: string): string | null {
  const nameLower = nodeName.toLowerCase()
  let toolkitLower = toolkit.toLowerCase()
    .replace(/\s+/g, '')  // "Google Sheets" -> "googlesheets"
    .replace(/-/g, '')     // "click-up" -> "clickup"

  // @NEXUS-FIX-025: Toolkit name aliases for common variations
  // Delegates to MasterAliasRegistry (canonical source) via MASTER_ALIASES import
  toolkitLower = MASTER_ALIASES[toolkitLower] || toolkitLower

  // =========================================================================
  // LAYER 1: Check static mappings (fast path for known tools)
  // =========================================================================
  const toolkitTools = TOOL_SLUGS[toolkitLower]
  if (toolkitTools) {
    // Try to find an action keyword in the node name
    for (const [keyword, action] of Object.entries(ACTION_KEYWORDS)) {
      if (nameLower.includes(keyword)) {
        if (toolkitTools[action]) {
          return toolkitTools[action]
        }
      }
    }
  }

  // =========================================================================
  // LAYER 2: Dynamic slug construction based on Composio patterns
  // Pattern: TOOLKITNAME_ACTION_NOUN (e.g., WHATSAPP_SEND_MESSAGE)
  // This handles unlimited scenarios without hardcoding every combination
  // =========================================================================
  const dynamicSlug = constructDynamicToolSlug(nameLower, toolkitLower)
  if (dynamicSlug) {
    return dynamicSlug
  }

  // =========================================================================
  // LAYER 3: Intelligent defaults based on toolkit
  // =========================================================================
  if (toolkitTools) {
    const defaultActions: Record<string, string> = {
      // Email - default to sending
      gmail: 'send',
      outlook: 'send',
      // Messaging - default to sending
      slack: 'send',
      whatsapp: 'send',
      discord: 'send',
      teams: 'send',
      telegram: 'send',
      // Meetings - default to creating
      zoom: 'create',
      googlemeet: 'create',
      calendly: 'create',
      // Google Workspace - default varies
      googlesheets: 'read',
      googlecalendar: 'list',
      googledrive: 'upload',  // @NEXUS-FIX-018: Storage defaults to upload, not list
      // CRM & Sales - default to listing
      hubspot: 'list',
      salesforce: 'list',
      pipedrive: 'list',
      zohocrm: 'list',
      // Project Management - default to listing
      github: 'list',
      clickup: 'list',
      linear: 'list',
      monday: 'list',
      jira: 'list',
      notion: 'add',  // @NEXUS-FIX-024: Changed from 'search' to 'add' - most workflows want to save/add to Notion
      trello: 'list',
      asana: 'list',
      basecamp: 'list',
      // Payments - default to listing
      stripe: 'list',
      quickbooks: 'list',
      xero: 'list',
      paypal: 'list',
      // Marketing - varies
      mailchimp: 'list',
      sendgrid: 'send',
      activecampaign: 'list',
      convertkit: 'list',
      // Social - default to posting
      twitter: 'post',
      linkedin: 'post',
      instagram: 'post',
      facebook: 'post',
      tiktok: 'post',
      youtube: 'list',
      // Storage - default to upload (@NEXUS-FIX-018)
      dropbox: 'upload',
      onedrive: 'upload',
      box: 'upload',
      airtable: 'list',
      // AI - default to generating
      openai: 'generate',
      anthropic: 'generate',
      // Voice - varies
      deepgram: 'transcribe',
      elevenlabs: 'generate',
      assemblyai: 'transcribe',
      // Support - varies
      intercom: 'send',
      zendesk: 'list',
      freshdesk: 'list',
      helpscout: 'list',
      // Webhooks
      webhook: 'trigger',
    }

    const defaultAction = defaultActions[toolkitLower]
    if (defaultAction && toolkitTools[defaultAction]) {
      return toolkitTools[defaultAction]
    }

    // Fallback to first available tool
    const firstTool = Object.values(toolkitTools)[0]
    if (firstTool) return firstTool
  }

  // =========================================================================
  // LAYER 4: Construct generic slug for unknown toolkits
  // This ensures we ALWAYS have a tool slug to try, even for new integrations
  // =========================================================================
  return constructGenericToolSlug(nameLower, toolkitLower)
}

/**
 * Construct a dynamic tool slug based on Composio naming conventions
 * Pattern analysis from 500+ Composio tools shows consistent naming:
 * - TOOLKIT_ACTION (e.g., GMAIL_SEND_EMAIL, SLACK_SEND_MESSAGE)
 * - TOOLKIT_ACTION_NOUN (e.g., HUBSPOT_CREATE_CONTACT)
 * - TOOLKIT_NOUN_ACTION (e.g., GOOGLE_CALENDAR_CREATE_EVENT)
 */
export function constructDynamicToolSlug(nodeName: string, toolkit: string): string | null {
  const toolkitUpper = toolkit.toUpperCase()
    .replace(/google\s*/i, 'GOOGLE')
    .replace(/\s+/g, '_')

  // Extract action and noun from node name
  const actionPatterns = [
    { pattern: /send|email|message|notify/, action: 'SEND', noun: 'MESSAGE' },
    { pattern: /create|add|new|make/, action: 'CREATE', noun: null },
    { pattern: /update|edit|modify|change/, action: 'UPDATE', noun: null },
    { pattern: /delete|remove|clear/, action: 'DELETE', noun: null },
    { pattern: /list|get|fetch|read|retrieve/, action: 'LIST', noun: null },
    { pattern: /search|find|query|lookup/, action: 'SEARCH', noun: null },
    { pattern: /trigger|capture|receive|listen|watch|incoming/, action: 'NEW', noun: '_TRIGGER' },
    { pattern: /upload/, action: 'UPLOAD', noun: 'FILE' },
    { pattern: /download/, action: 'DOWNLOAD', noun: 'FILE' },
  ]

  // Extract nouns from node name
  const nounPatterns = [
    { pattern: /email/, noun: 'EMAIL' },
    { pattern: /message/, noun: 'MESSAGE' },
    { pattern: /contact/, noun: 'CONTACT' },
    { pattern: /task/, noun: 'TASK' },
    { pattern: /issue/, noun: 'ISSUE' },
    { pattern: /ticket/, noun: 'TICKET' },
    { pattern: /event/, noun: 'EVENT' },
    { pattern: /meeting/, noun: 'MEETING' },
    { pattern: /file/, noun: 'FILE' },
    { pattern: /document|doc/, noun: 'DOCUMENT' },
    { pattern: /sheet|spreadsheet/, noun: 'SHEET' },
    { pattern: /record/, noun: 'RECORD' },
    { pattern: /deal/, noun: 'DEAL' },
    { pattern: /lead/, noun: 'LEAD' },
    { pattern: /order/, noun: 'ORDER' },
    { pattern: /invoice/, noun: 'INVOICE' },
    { pattern: /payment/, noun: 'PAYMENT' },
    { pattern: /customer/, noun: 'CUSTOMER' },
    { pattern: /user/, noun: 'USER' },
    { pattern: /post/, noun: 'POST' },
    { pattern: /tweet/, noun: 'TWEET' },
    { pattern: /card/, noun: 'CARD' },
    { pattern: /item/, noun: 'ITEM' },
    { pattern: /page/, noun: 'PAGE' },
    { pattern: /subscription/, noun: 'SUBSCRIPTION' },
  ]

  let action: string | null = null
  let noun: string | null = null
  let suffix: string = ''

  // Find matching action
  for (const { pattern, action: act, noun: actNoun } of actionPatterns) {
    if (pattern.test(nodeName)) {
      action = act
      if (actNoun) {
        suffix = actNoun
      }
      break
    }
  }

  // Find matching noun
  for (const { pattern, noun: n } of nounPatterns) {
    if (pattern.test(nodeName)) {
      noun = n
      break
    }
  }

  // Construct slug if we have at least an action
  if (action) {
    // Pattern: TOOLKIT_ACTION_NOUN or TOOLKIT_ACTION
    if (suffix.includes('TRIGGER')) {
      // Trigger pattern: TOOLKIT_NEW_NOUN_TRIGGER
      return `${toolkitUpper}_${action}${noun ? '_' + noun : ''}_TRIGGER`
    } else if (noun) {
      return `${toolkitUpper}_${action}_${noun}`
    } else {
      return `${toolkitUpper}_${action}${suffix ? '_' + suffix : ''}`
    }
  }

  return null
}

/**
 * Construct a generic tool slug for unknown toolkits
 * This is the ultimate fallback to ensure we always have something to try
 */
export function constructGenericToolSlug(nodeName: string, toolkit: string): string {
  const toolkitUpper = toolkit.toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_')

  // Determine action from context
  if (/send|email|message|notify|alert/.test(nodeName)) {
    return `${toolkitUpper}_SEND_MESSAGE`
  }
  if (/create|add|new|make/.test(nodeName)) {
    return `${toolkitUpper}_CREATE`
  }
  if (/trigger|capture|receive|listen|watch|incoming|on\s/.test(nodeName)) {
    return `${toolkitUpper}_NEW_TRIGGER`
  }
  if (/list|get|fetch|read/.test(nodeName)) {
    return `${toolkitUpper}_LIST`
  }
  if (/search|find|query/.test(nodeName)) {
    return `${toolkitUpper}_SEARCH`
  }
  if (/update|edit|modify/.test(nodeName)) {
    return `${toolkitUpper}_UPDATE`
  }
  if (/delete|remove/.test(nodeName)) {
    return `${toolkitUpper}_DELETE`
  }

  // Ultimate fallback - generic action
  return `${toolkitUpper}_EXECUTE`
}

// ============================================================================
// Parameter Functions
// ============================================================================

/**
 * Get parameters for a tool - prioritizes extracted params from user intent
 *
 * Priority order:
 * 1. node.config.extractedParams (from Claude's analysis of user message)
 * 2. node.config (explicit configuration)
 * 3. Smart defaults based on tool type
 * 4. Inference from workflow context (name, description)
 */
export function getDefaultParams(
  toolSlug: string,
  node: WorkflowNode,
  previousResults?: Array<{ node: WorkflowNode; result: unknown }>,
  workflowContext?: { name?: string; description?: string }
): Record<string, unknown> {
  // FIRST: Check for params extracted from user intent (set by Claude)
  const extractedParams = (node.config?.extractedParams as Record<string, unknown>) || {}
  const nodeConfig = node.config || {}

  // Build context string for inference from multiple sources
  const contextForInference = [
    node.description || '',
    node.name || '',
    workflowContext?.description || '',
    workflowContext?.name || '',
  ].join(' ').toLowerCase()

  // NEW: Extract data flowing from previous nodes (especially trigger sample data)
  const flowData: Record<string, unknown> = {}
  if (previousResults && previousResults.length > 0) {
    for (const prev of previousResults) {
      const result = prev.result as { type?: string; data?: Record<string, unknown> } | undefined
      if (result?.type === 'trigger_sample_data' && result.data) {
        // Map email trigger data to common fields
        if (result.data.from) flowData.sender_email = result.data.from
        if (result.data.subject) flowData.email_subject = result.data.subject
        if (result.data.body || result.data.message) {
          flowData.email_body = result.data.body || result.data.message
        }
        if (result.data.sender_name) flowData.sender_name = result.data.sender_name

        // Generate formatted message for notifications (Slack, Teams, Discord, etc.)
        const subject = result.data.subject || 'New notification'
        const body = result.data.body || result.data.message || ''
        const from = result.data.from || result.data.sender_name || 'Unknown sender'
        flowData.generated_message = `📧 *New Email from ${from}*\n\n*Subject:* ${subject}\n\n${body}`
        flowData.notification_text = `Email from ${from}: ${subject}`
      }
      // Also capture AI processing results
      if (result?.type === 'ai_processing' && result.data) {
        Object.assign(flowData, result.data)
      }
      // @NEXUS-FIX-113: Capture action node results for downstream use - DO NOT REMOVE
      // When a previous action node returned data, make it available to subsequent nodes
      if (prev.result && typeof prev.result === 'object' && !result?.type) {
        const actionResult = prev.result as Record<string, unknown>
        // Capture common fields from API responses
        if (actionResult.id) flowData.previous_id = actionResult.id
        if (actionResult.url) flowData.previous_url = actionResult.url
        if (actionResult.name) flowData.previous_name = actionResult.name
        if (actionResult.text) flowData.previous_text = actionResult.text
        if (actionResult.message) flowData.previous_message = actionResult.message
      }
    }
  }

  // Smart defaults - only used if no extracted/config value exists
  const smartDefaults: Record<string, Record<string, unknown>> = {
    // Gmail - NO hardcoded email addresses
    GMAIL_SEND_EMAIL: {
      // to: MUST come from extractedParams or user will be prompted
      subject: extractedParams.subject || `Update from ${node.name}`,
      body: extractedParams.body || extractedParams.message || null,
    },
    GMAIL_FETCH_EMAILS: {
      user_id: 'me',
      max_results: extractedParams.max_results || 10,
      q: extractedParams.query || extractedParams.filter || undefined,
    },
    GMAIL_CREATE_EMAIL_DRAFT: {
      subject: extractedParams.subject || `Draft: ${node.name}`,
      body: extractedParams.body || null,
    },

    // @NEXUS-FIX-113: Smart defaults - use flow data from previous nodes - DO NOT REMOVE
    // Slack - default channel to 'general' if not specified, use flow data for text
    SLACK_SEND_MESSAGE: {
      channel: extractedParams.channel || flowData.channel || 'general',
      text: extractedParams.text || extractedParams.message || flowData.generated_message || flowData.notification_text || null,
    },

    // Google Sheets
    GOOGLESHEETS_BATCH_GET: {
      spreadsheet_id: extractedParams.spreadsheet_id || extractedParams.sheetId || null,
      ranges: extractedParams.ranges || ['Sheet1!A1:Z100'],
    },
    GOOGLESHEETS_BATCH_UPDATE: {
      spreadsheet_id: extractedParams.spreadsheet_id || extractedParams.sheetId || null,
      sheet_name: extractedParams.sheet_name || 'Sheet1',
      values: extractedParams.values || [['Data from workflow', new Date().toISOString()]],
    },

    // @NEXUS-FIX-113: Calendar smart defaults - auto-generate start/end times - DO NOT REMOVE
    GOOGLECALENDAR_CREATE_EVENT: (() => {
      // Default to a 1-hour event starting in 1 hour from now
      const now = new Date()
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      return {
        summary: extractedParams.title || extractedParams.summary || `Event: ${node.name}`,
        start_datetime: extractedParams.start || extractedParams.startTime || oneHourLater.toISOString(),
        end_datetime: extractedParams.end || extractedParams.endTime || twoHoursLater.toISOString(),
        description: extractedParams.description || undefined,
        attendees: extractedParams.attendees || undefined,
      }
    })(),
    GOOGLECALENDAR_EVENTS_LIST: {
      maxResults: extractedParams.maxResults || 10,
      timeMin: extractedParams.timeMin || new Date().toISOString(),
    },

    // Google Drive
    GOOGLEDRIVE_LIST_FILES: {
      pageSize: extractedParams.limit || 20,
      q: extractedParams.query || undefined,
    },

    // HubSpot
    HUBSPOT_LIST_CONTACTS: {
      limit: extractedParams.limit || 10,
    },
    HUBSPOT_CREATE_CONTACT: {
      email: extractedParams.email || null,
      firstname: extractedParams.firstName || extractedParams.firstname || undefined,
      lastname: extractedParams.lastName || extractedParams.lastname || undefined,
    },

    // GitHub - Try to infer owner/repo from context
    // Priority: extractedParams > node config > inferred from workflow context
    GITHUB_LIST_REPOSITORY_ISSUES: (() => {
      let inferredOwner = extractedParams.owner || nodeConfig.owner || null
      let inferredRepo = extractedParams.repo || nodeConfig.repo || null

      // Common repository patterns - check all context sources
      if (!inferredOwner || !inferredRepo) {
        if (contextForInference.includes('composio')) {
          inferredOwner = inferredOwner || 'ComposioHQ'
          inferredRepo = inferredRepo || 'composio'
        } else if (contextForInference.includes('react') && !contextForInference.includes('react native')) {
          inferredOwner = inferredOwner || 'facebook'
          inferredRepo = inferredRepo || 'react'
        } else if (contextForInference.includes('vscode') || contextForInference.includes('vs code')) {
          inferredOwner = inferredOwner || 'microsoft'
          inferredRepo = inferredRepo || 'vscode'
        } else if (contextForInference.includes('typescript')) {
          inferredOwner = inferredOwner || 'microsoft'
          inferredRepo = inferredRepo || 'TypeScript'
        } else if (contextForInference.includes('nextjs') || contextForInference.includes('next.js')) {
          inferredOwner = inferredOwner || 'vercel'
          inferredRepo = inferredRepo || 'next.js'
        }
      }

      return {
        owner: inferredOwner,
        repo: inferredRepo,
        state: extractedParams.state || 'open',
        per_page: extractedParams.limit || 10,
      }
    })(),
    GITHUB_CREATE_ISSUE: {
      owner: extractedParams.owner || nodeConfig.owner || null,
      repo: extractedParams.repo || nodeConfig.repo || null,
      title: extractedParams.title || `Issue: ${node.name}`,
      body: extractedParams.body || extractedParams.description || null,
      labels: extractedParams.labels || undefined,
    },

    // Notion
    NOTION_SEARCH: {
      query: extractedParams.query || '',
    },
    NOTION_CREATE_PAGE: {
      title: extractedParams.title || null,
      content: extractedParams.content || extractedParams.body || undefined,
    },

    // Trello
    TRELLO_CREATE_CARD: {
      name: extractedParams.name || extractedParams.title || `Card: ${node.name}`,
      desc: extractedParams.description || undefined,
    },

    // Asana
    ASANA_CREATE_TASK: {
      name: extractedParams.name || extractedParams.title || `Task: ${node.name}`,
      notes: extractedParams.notes || extractedParams.description || undefined,
    },

    // @NEXUS-FIX-113: Additional smart defaults for commonly-failing tools - DO NOT REMOVE
    // Discord - use flow data for message content
    DISCORD_SEND_MESSAGE: {
      content: extractedParams.content || extractedParams.message || flowData.generated_message || flowData.notification_text || null,
    },

    // WhatsApp - use flow data for message
    WHATSAPP_SEND_MESSAGE: {
      to: extractedParams.to || extractedParams.phone || null,
      message: extractedParams.message || extractedParams.text || flowData.notification_text || null,
    },

    // Dropbox - default path
    DROPBOX_UPLOAD_FILE: {
      path: extractedParams.path || extractedParams.folder || '/Nexus Uploads/',
      file_name: extractedParams.file_name || extractedParams.name || `nexus_${new Date().toISOString().split('T')[0]}.txt`,
    },
    DROPBOX_LIST_FOLDER: {
      path: extractedParams.path || extractedParams.folder || '',
    },

    // ClickUp - defaults
    CLICKUP_CREATE_TASK: {
      list_id: extractedParams.list_id || null,
      name: extractedParams.name || extractedParams.title || `Task: ${node.name}`,
      description: extractedParams.description || undefined,
    },

    // Linear
    LINEAR_CREATE_ISSUE: {
      title: extractedParams.title || extractedParams.name || `Issue: ${node.name}`,
      description: extractedParams.description || undefined,
    },

    // Jira
    JIRA_CREATE_ISSUE: {
      summary: extractedParams.summary || extractedParams.title || `Issue: ${node.name}`,
      description: extractedParams.description || undefined,
      issuetype: extractedParams.issuetype || 'Task',
    },

    // Twitter/X
    TWITTER_CREATE_TWEET: {
      text: extractedParams.text || extractedParams.message || null,
    },

    // LinkedIn
    LINKEDIN_CREATE_POST: {
      text: extractedParams.text || extractedParams.message || null,
    },

    // Stripe
    STRIPE_CREATE_CUSTOMER: {
      email: extractedParams.email || null,
      name: extractedParams.name || undefined,
    },

    // Zendesk
    ZENDESK_CREATE_TICKET: {
      subject: extractedParams.subject || extractedParams.title || `Support: ${node.name}`,
      description: extractedParams.description || extractedParams.body || undefined,
    },

    // Zoom
    ZOOM_CREATE_MEETING: {
      topic: extractedParams.topic || extractedParams.title || `Meeting: ${node.name}`,
      duration: extractedParams.duration || 30,
      type: 2, // scheduled meeting
    },

    // Google Drive
    GOOGLEDRIVE_UPLOAD_FILE: {
      name: extractedParams.name || extractedParams.file_name || `nexus_upload_${Date.now()}`,
    },
    // @NEXUS-FIX-113-END
  }

  const defaults = smartDefaults[toolSlug] || {}

  // Merge: extractedParams > nodeConfig > defaults
  // Remove null values (they indicate required fields that need user input)
  const merged = { ...defaults, ...nodeConfig, ...extractedParams }

  // Filter out null values and extractedParams key
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(merged)) {
    if (value !== null && key !== 'extractedParams') {
      result[key] = value
    }
  }

  return result
}

/**
 * Validate that required parameters are present for a tool
 * Returns array of missing parameter names (empty if all present)
 */
export function validateRequiredParams(toolSlug: string, params: Record<string, unknown>): string[] {
  // Define required parameters for each tool
  const requiredParams: Record<string, string[]> = {
    // Email - must have recipient
    GMAIL_SEND_EMAIL: ['to'],
    SENDGRID_SEND_EMAIL: ['to', 'subject'],

    // Messaging - must have destination and content
    SLACK_SEND_MESSAGE: ['channel', 'text'],
    WHATSAPP_SEND_MESSAGE: ['to', 'message'],
    DISCORD_SEND_MESSAGE: ['channel_id', 'content'],
    TEAMS_SEND_MESSAGE: ['channel_id', 'message'],

    // Meetings
    ZOOM_CREATE_MEETING: ['topic'],

    // Google - must have identifiers
    GOOGLESHEETS_BATCH_GET: ['spreadsheet_id'],
    GOOGLESHEETS_BATCH_UPDATE: ['spreadsheet_id'],
    GOOGLECALENDAR_CREATE_EVENT: ['summary', 'start_datetime', 'end_datetime'],

    // Project Management
    CLICKUP_CREATE_TASK: ['list_id', 'name'],
    LINEAR_CREATE_ISSUE: ['team_id', 'title'],
    JIRA_CREATE_ISSUE: ['project_key', 'summary'],
    ASANA_CREATE_TASK: ['workspace', 'name'],
    TRELLO_CREATE_CARD: ['list_id', 'name'],
    GITHUB_CREATE_ISSUE: ['owner', 'repo', 'title'],
    GITHUB_LIST_REPOSITORY_ISSUES: ['owner', 'repo'],  // Required for listing issues
    GITHUB_ISSUES_AND_PULL_REQUESTS: ['q'],  // Search query required

    // CRM
    HUBSPOT_CREATE_CONTACT: ['email'],
    SALESFORCE_CREATE_RECORD: ['object_type'],
    PIPEDRIVE_CREATE_DEAL: ['title'],

    // Payments
    STRIPE_CREATE_CUSTOMER: ['email'],
    STRIPE_CREATE_CHARGE: ['amount', 'currency'],

    // Marketing
    MAILCHIMP_ADD_SUBSCRIBER: ['list_id', 'email'],

    // Social
    TWITTER_CREATE_TWEET: ['text'],
    LINKEDIN_CREATE_POST: ['text'],

    // AI
    OPENAI_CHAT_COMPLETION: ['messages'],
    ANTHROPIC_CHAT_COMPLETION: ['messages'],

    // Voice
    DEEPGRAM_TRANSCRIBE: ['audio_url'],
    ELEVENLABS_TEXT_TO_SPEECH: ['text', 'voice_id'],

    // Support
    ZENDESK_CREATE_TICKET: ['subject'],
    FRESHDESK_CREATE_TICKET: ['subject', 'email'],
    INTERCOM_SEND_MESSAGE: ['user_id', 'body'],

    // Webhooks
    WEBHOOK_TRIGGER: ['url'],
  }

  const required = requiredParams[toolSlug] || []
  const missing: string[] = []

  for (const param of required) {
    if (params[param] === undefined || params[param] === null || params[param] === '') {
      missing.push(param)
    }
  }

  return missing
}

// @NEXUS-FIX-118: URL-to-ID extraction for user-provided URLs - DO NOT REMOVE
// Problem: Users paste full URLs (e.g., Google Sheets URL) but Composio APIs need just the ID
// Solution: Auto-extract IDs from common URL patterns before storing/using params
export function extractIdFromUrl(paramName: string, value: string): string {
  if (!value || typeof value !== 'string') return value
  const trimmed = value.trim()

  // Google Sheets URL → spreadsheet_id
  // Format: https://docs.google.com/spreadsheets/d/{ID}/edit...
  if (paramName === 'spreadsheet_id' || paramName === 'sheet_id' || paramName === 'google_sheet') {
    const sheetsMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
    if (sheetsMatch) return sheetsMatch[1]
  }

  // Google Docs URL → document_id
  if (paramName === 'document_id' || paramName === 'doc_id') {
    const docsMatch = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
    if (docsMatch) return docsMatch[1]
  }

  // Notion page URL → page_id
  // Format: https://www.notion.so/{workspace}/{Page-Name-{id}} or https://notion.so/{id}
  if (paramName === 'page_id' || paramName === 'notion_page') {
    const notionMatch = trimmed.match(/notion\.so\/(?:[^/]*\/)?[^?#]*?([a-f0-9]{32})/)
    if (notionMatch) return notionMatch[1]
    // UUID format
    const notionUuid = trimmed.match(/notion\.so\/(?:[^/]*\/)?([a-f0-9-]{36})/)
    if (notionUuid) return notionUuid[1]
  }

  // GitHub URL → owner or repo
  // Format: https://github.com/{owner}/{repo}
  if (paramName === 'owner' || paramName === 'repo') {
    const githubMatch = trimmed.match(/github\.com\/([^/\s?#]+)\/([^/\s?#]+)/)
    if (githubMatch) {
      return paramName === 'owner' ? githubMatch[1] : githubMatch[2].replace(/\.git$/, '')
    }
  }

  // Trello board URL → board_id
  if (paramName === 'board_id' && trimmed.includes('trello.com')) {
    const trelloMatch = trimmed.match(/trello\.com\/b\/([a-zA-Z0-9]+)/)
    if (trelloMatch) return trelloMatch[1]
  }

  // Airtable base URL → base_id
  if (paramName === 'base_id' && trimmed.includes('airtable.com')) {
    const airtableMatch = trimmed.match(/airtable\.com\/(app[a-zA-Z0-9]+)/)
    if (airtableMatch) return airtableMatch[1]
  }

  // ClickUp list URL → list_id
  if (paramName === 'list_id' && trimmed.includes('clickup.com')) {
    const clickupMatch = trimmed.match(/clickup\.com\/[^/]*\/v\/li\/(\d+)/)
    if (clickupMatch) return clickupMatch[1]
  }

  // Jira project URL → project_key
  if (paramName === 'project_key' && trimmed.includes('atlassian.net')) {
    const jiraMatch = trimmed.match(/\/projects\/([A-Z0-9]+)/)
    if (jiraMatch) return jiraMatch[1]
  }

  return trimmed
}
// @NEXUS-FIX-118-END

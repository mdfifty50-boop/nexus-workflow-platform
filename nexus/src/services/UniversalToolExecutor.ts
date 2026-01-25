/**
 * UniversalToolExecutor - Execute ANY integration via Rube MCP, Playwright, or embedded APIs
 *
 * This is the core execution layer that can interact with:
 * - 500+ Composio/Rube tools (OAuth-authenticated)
 * - Any website via Playwright browser automation
 * - Embedded server-side APIs (Stripe, internal services)
 *
 * The executor intelligently routes actions to the appropriate provider
 * and handles authentication, retries, and error recovery.
 */

import { integrationService } from './IntegrationService'

// Tool execution result
export interface ToolExecutionResult {
  success: boolean
  data?: unknown
  error?: string
  tokensUsed?: number
  costUsd?: number
  durationMs: number
  provider: 'rube' | 'playwright' | 'embedded' | 'custom'
  toolSlug?: string
}

// Tool categories for intelligent routing
export type ToolCategory =
  | 'email'
  | 'calendar'
  | 'spreadsheet'
  | 'crm'
  | 'communication'
  | 'payment'
  | 'booking'
  | 'social'
  | 'development'
  | 'storage'
  | 'browser'
  | 'custom'

// Rube tool mapping - maps actions to Composio tool slugs
const RUBE_TOOL_MAP: Record<string, Record<string, string>> = {
  // Email
  gmail: {
    send: 'GMAIL_SEND_EMAIL',
    read: 'GMAIL_FETCH_EMAILS',
    search: 'GMAIL_SEARCH_EMAILS',
    draft: 'GMAIL_CREATE_DRAFT',
    label: 'GMAIL_ADD_LABEL',
    reply: 'GMAIL_REPLY_TO_THREAD'
  },
  outlook: {
    send: 'OUTLOOK_SEND_EMAIL',
    read: 'OUTLOOK_FETCH_EMAILS',
    search: 'OUTLOOK_SEARCH_EMAILS'
  },

  // Calendar
  google_calendar: {
    create: 'GOOGLECALENDAR_CREATE_EVENT',
    list: 'GOOGLECALENDAR_GET_EVENTS',
    update: 'GOOGLECALENDAR_UPDATE_EVENT',
    delete: 'GOOGLECALENDAR_DELETE_EVENT',
    find_free: 'GOOGLECALENDAR_FIND_FREE_SLOTS'
  },
  outlook_calendar: {
    create: 'OUTLOOK_CREATE_EVENT',
    list: 'OUTLOOK_GET_EVENTS'
  },

  // Spreadsheets
  google_sheets: {
    read: 'GOOGLESHEETS_GET_DATA',
    write: 'GOOGLESHEETS_APPEND_DATA',
    update: 'GOOGLESHEETS_UPDATE_DATA',
    create: 'GOOGLESHEETS_CREATE_SPREADSHEET'
  },

  // Communication
  slack: {
    send: 'SLACK_SEND_MESSAGE',
    search: 'SLACK_SEARCH_MESSAGES',
    channels: 'SLACK_LIST_CHANNELS',
    users: 'SLACK_LIST_USERS',
    react: 'SLACK_ADD_REACTION'
  },
  teams: {
    send: 'TEAMS_SEND_MESSAGE',
    channels: 'TEAMS_LIST_CHANNELS'
  },
  discord: {
    send: 'DISCORD_SEND_MESSAGE',
    channels: 'DISCORD_LIST_CHANNELS'
  },

  // CRM
  hubspot: {
    create_contact: 'HUBSPOT_CREATE_CONTACT',
    update_contact: 'HUBSPOT_UPDATE_CONTACT',
    search_contacts: 'HUBSPOT_SEARCH_CONTACTS',
    create_deal: 'HUBSPOT_CREATE_DEAL',
    update_deal: 'HUBSPOT_UPDATE_DEAL'
  },
  salesforce: {
    query: 'SALESFORCE_SOQL_QUERY',
    create: 'SALESFORCE_CREATE_RECORD',
    update: 'SALESFORCE_UPDATE_RECORD'
  },

  // Development
  github: {
    create_issue: 'GITHUB_CREATE_ISSUE',
    create_pr: 'GITHUB_CREATE_PULL_REQUEST',
    list_repos: 'GITHUB_LIST_REPOSITORIES',
    list_prs: 'GITHUB_LIST_PULL_REQUESTS',
    merge_pr: 'GITHUB_MERGE_PULL_REQUEST',
    create_branch: 'GITHUB_CREATE_BRANCH'
  },
  jira: {
    create_issue: 'JIRA_CREATE_ISSUE',
    update_issue: 'JIRA_UPDATE_ISSUE',
    search: 'JIRA_SEARCH_ISSUES',
    assign: 'JIRA_ASSIGN_ISSUE'
  },
  linear: {
    create_issue: 'LINEAR_CREATE_ISSUE',
    update_issue: 'LINEAR_UPDATE_ISSUE',
    list_issues: 'LINEAR_LIST_ISSUES'
  },

  // Storage
  google_drive: {
    upload: 'GOOGLEDRIVE_UPLOAD_FILE',
    download: 'GOOGLEDRIVE_DOWNLOAD_FILE',
    list: 'GOOGLEDRIVE_LIST_FILES',
    share: 'GOOGLEDRIVE_SHARE_FILE'
  },
  dropbox: {
    upload: 'DROPBOX_UPLOAD_FILE',
    download: 'DROPBOX_DOWNLOAD_FILE',
    list: 'DROPBOX_LIST_FILES'
  },

  // Notion
  notion: {
    create_page: 'NOTION_CREATE_PAGE',
    update_page: 'NOTION_UPDATE_PAGE',
    search: 'NOTION_SEARCH',
    add_to_database: 'NOTION_CREATE_DATABASE_ITEM'
  },

  // Travel/Booking
  composio_search: {
    flights: 'COMPOSIO_SEARCH_FLIGHTS',
    hotels: 'COMPOSIO_SEARCH_HOTELS'
  },
  yelp: {
    search: 'YELP_SEARCH_AND_CHAT'
  },

  // Social
  twitter: {
    post: 'TWITTER_CREATE_TWEET',
    search: 'TWITTER_SEARCH_TWEETS',
    dm: 'TWITTER_SEND_DM'
  },
  linkedin: {
    post: 'LINKEDIN_CREATE_POST',
    message: 'LINKEDIN_SEND_MESSAGE'
  }
}

// Playwright action templates for web automation
const PLAYWRIGHT_TEMPLATES: Record<string, { steps: Array<{ action: string; selector?: string; value?: string }> }> = {
  login: {
    steps: [
      { action: 'navigate' },
      { action: 'fill', selector: 'input[name="email"], input[type="email"], #email' },
      { action: 'fill', selector: 'input[name="password"], input[type="password"], #password' },
      { action: 'click', selector: 'button[type="submit"], input[type="submit"], .login-btn' }
    ]
  },
  form_submit: {
    steps: [
      { action: 'navigate' },
      { action: 'fill_form' },
      { action: 'click', selector: 'button[type="submit"], input[type="submit"]' }
    ]
  },
  scrape: {
    steps: [
      { action: 'navigate' },
      { action: 'snapshot' }
    ]
  },
  search: {
    steps: [
      { action: 'navigate' },
      { action: 'fill', selector: 'input[type="search"], input[name="q"], .search-input' },
      { action: 'press_key', value: 'Enter' },
      { action: 'wait', value: '2000' },
      { action: 'snapshot' }
    ]
  }
}

// Server API endpoint mapping for embedded integrations
const EMBEDDED_API_MAP: Record<string, Record<string, { method: string; path: string }>> = {
  stripe: {
    create_payment: { method: 'POST', path: '/api/payments/create-intent' },
    create_customer: { method: 'POST', path: '/api/payments/create-customer' },
    get_status: { method: 'GET', path: '/api/payments/status' },
    create_link: { method: 'POST', path: '/api/payments/create-link' },
    refund: { method: 'POST', path: '/api/payments/refund' }
  }
}

/**
 * Universal Tool Executor
 */
class UniversalToolExecutorClass {
  private rubeSessionId: string | null = null
  private executionHistory: Map<string, ToolExecutionResult[]> = new Map()

  /**
   * Execute a tool action
   * Automatically routes to the best provider (Rube, Playwright, Embedded)
   */
  async execute(
    integration: string,
    action: string,
    params: Record<string, unknown>,
    options: {
      forceProvider?: 'rube' | 'playwright' | 'embedded'
      timeout?: number
      retries?: number
    } = {}
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now()
    const { forceProvider, timeout = 30000, retries = 3 } = options

    console.log(`[UniversalToolExecutor] Executing: ${integration}.${action}`, params)

    let lastError: string | undefined
    let attempt = 0

    while (attempt < retries) {
      attempt++
      try {
        // Determine provider
        const provider = forceProvider || this.determineProvider(integration, action)

        let result: ToolExecutionResult

        switch (provider) {
          case 'rube':
            result = await this.executeViaRube(integration, action, params, timeout)
            break
          case 'playwright':
            result = await this.executeViaPlaywright(integration, action, params, timeout)
            break
          case 'embedded':
            result = await this.executeViaEmbedded(integration, action, params)
            break
          default:
            result = await this.executeViaCustom(integration, action, params)
        }

        // Track execution
        this.trackExecution(integration, result)

        return result

      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        console.warn(`[UniversalToolExecutor] Attempt ${attempt}/${retries} failed:`, lastError)

        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt))
        }
      }
    }

    // All retries exhausted
    return {
      success: false,
      error: lastError || 'Execution failed after all retries',
      durationMs: Date.now() - startTime,
      provider: 'custom'
    }
  }

  /**
   * Determine the best provider for an action
   */
  private determineProvider(integration: string, action: string): 'rube' | 'playwright' | 'embedded' | 'custom' {
    // Check if embedded (server-side API keys)
    if (EMBEDDED_API_MAP[integration]?.[action]) {
      return 'embedded'
    }

    // Check if Rube tool exists
    if (RUBE_TOOL_MAP[integration]?.[action]) {
      return 'rube'
    }

    // Check if integration is browser-based
    if (integration === 'playwright' || integration.includes('browser') || integration.includes('web')) {
      return 'playwright'
    }

    // Default to Playwright for unknown integrations (can automate any website)
    return 'playwright'
  }

  /**
   * Execute via Rube MCP (Composio tools)
   */
  private async executeViaRube(
    integration: string,
    action: string,
    params: Record<string, unknown>,
    _timeout: number
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now()

    // Get tool slug
    const toolSlug = RUBE_TOOL_MAP[integration]?.[action]
    if (!toolSlug) {
      throw new Error(`No Rube tool mapping for ${integration}.${action}`)
    }

    console.log(`[UniversalToolExecutor] Rube tool: ${toolSlug}`)

    // Format for RUBE_MULTI_EXECUTE_TOOL
    // This would be called via MCP in a real implementation
    const rubeCall = {
      tool_slug: 'RUBE_MULTI_EXECUTE_TOOL',
      arguments: {
        tools: [{ tool_slug: toolSlug, arguments: params }],
        sync_response_to_workbench: false,
        session_id: this.rubeSessionId,
        thought: `Executing ${integration}.${action}`,
        current_step: action.toUpperCase(),
        memory: {}
      }
    }

    console.log('[UniversalToolExecutor] Rube call:', JSON.stringify(rubeCall, null, 2))

    // In production, this would call the MCP server
    // For now, we'll call our backend proxy
    const response = await fetch('/api/integrations/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'rube',
        toolSlug,
        params,
        sessionId: this.rubeSessionId
      })
    })

    const data = await response.json()

    return {
      success: data.success !== false,
      data: data.data || data,
      error: data.error,
      tokensUsed: data.tokensUsed,
      costUsd: data.costUsd,
      durationMs: Date.now() - startTime,
      provider: 'rube',
      toolSlug
    }
  }

  /**
   * Execute via Playwright browser automation
   */
  private async executeViaPlaywright(
    _integration: string,
    action: string,
    params: Record<string, unknown>,
    _timeout: number
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now()
    void _integration // Integration context available for logging

    console.log(`[UniversalToolExecutor] Playwright action: ${action}`)

    // Get template or use direct action
    const template = PLAYWRIGHT_TEMPLATES[action]

    // Build Playwright command sequence
    const playwrightCall = {
      provider: 'playwright',
      action,
      params,
      template,
      url: params.url as string,
      steps: template?.steps || [
        { action, ...params }
      ]
    }

    console.log('[UniversalToolExecutor] Playwright call:', JSON.stringify(playwrightCall, null, 2))

    // Call backend Playwright proxy
    const response = await fetch('/api/integrations/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playwrightCall)
    })

    const data = await response.json()

    return {
      success: data.success !== false,
      data: data.data || data,
      error: data.error,
      durationMs: Date.now() - startTime,
      provider: 'playwright'
    }
  }

  /**
   * Execute via embedded server-side API
   */
  private async executeViaEmbedded(
    integration: string,
    action: string,
    params: Record<string, unknown>
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now()

    const endpoint = EMBEDDED_API_MAP[integration]?.[action]
    if (!endpoint) {
      throw new Error(`No embedded API for ${integration}.${action}`)
    }

    console.log(`[UniversalToolExecutor] Embedded API: ${endpoint.method} ${endpoint.path}`)

    let url = endpoint.path
    const options: RequestInit = {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' }
    }

    if (endpoint.method === 'GET' && params.id) {
      url = `${endpoint.path}/${params.id}`
    } else if (endpoint.method !== 'GET') {
      options.body = JSON.stringify(params)
    }

    const response = await fetch(url, options)
    const data = await response.json()

    return {
      success: data.success !== false,
      data: data,
      error: data.error,
      durationMs: Date.now() - startTime,
      provider: 'embedded'
    }
  }

  /**
   * Execute via custom handler (fallback)
   */
  private async executeViaCustom(
    integration: string,
    action: string,
    params: Record<string, unknown>
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now()

    console.log(`[UniversalToolExecutor] Custom action: ${integration}.${action}`)

    // Try integration service
    const result = await integrationService.executeAction(integration, action, params)

    return {
      success: result.success,
      data: result.data,
      error: result.error,
      durationMs: Date.now() - startTime,
      provider: 'custom'
    }
  }

  /**
   * Track execution for analytics and debugging
   */
  private trackExecution(integration: string, result: ToolExecutionResult): void {
    const history = this.executionHistory.get(integration) || []
    history.push(result)
    if (history.length > 100) history.shift()
    this.executionHistory.set(integration, history)
  }

  /**
   * Set Rube session ID for authenticated tool execution
   */
  setRubeSession(sessionId: string): void {
    this.rubeSessionId = sessionId
  }

  /**
   * Get execution history for an integration
   */
  getHistory(integration: string): ToolExecutionResult[] {
    return this.executionHistory.get(integration) || []
  }

  /**
   * Get all available tools
   */
  getAvailableTools(): { integration: string; actions: string[] }[] {
    const tools: { integration: string; actions: string[] }[] = []

    // Rube tools
    Object.entries(RUBE_TOOL_MAP).forEach(([integration, actions]) => {
      tools.push({ integration, actions: Object.keys(actions) })
    })

    // Embedded tools
    Object.entries(EMBEDDED_API_MAP).forEach(([integration, actions]) => {
      const existing = tools.find(t => t.integration === integration)
      if (existing) {
        existing.actions.push(...Object.keys(actions))
      } else {
        tools.push({ integration, actions: Object.keys(actions) })
      }
    })

    // Add Playwright as universal
    tools.push({
      integration: 'playwright',
      actions: Object.keys(PLAYWRIGHT_TEMPLATES)
    })

    return tools
  }

  /**
   * Execute a complex multi-step action (e.g., complete booking flow)
   */
  async executeWorkflow(
    steps: Array<{
      integration: string
      action: string
      params: Record<string, unknown>
      dependsOn?: string[]
    }>,
    onProgress?: (step: number, total: number, result: ToolExecutionResult) => void
  ): Promise<{
    success: boolean
    results: Map<number, ToolExecutionResult>
    errors: string[]
  }> {
    const results = new Map<number, ToolExecutionResult>()
    const errors: string[] = []

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]

      // Check dependencies
      if (step.dependsOn) {
        for (const depIdx of step.dependsOn) {
          const depResult = results.get(Number(depIdx))
          if (!depResult?.success) {
            errors.push(`Step ${i} skipped: dependency ${depIdx} failed`)
            continue
          }
        }
      }

      const result = await this.execute(step.integration, step.action, step.params)
      results.set(i, result)

      if (!result.success) {
        errors.push(`Step ${i} (${step.integration}.${step.action}) failed: ${result.error}`)
      }

      onProgress?.(i, steps.length, result)
    }

    return {
      success: errors.length === 0,
      results,
      errors
    }
  }
}

// Export singleton instance
export const universalToolExecutor = new UniversalToolExecutorClass()
export default UniversalToolExecutorClass

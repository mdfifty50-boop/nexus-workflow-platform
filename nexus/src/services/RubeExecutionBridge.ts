/**
 * RubeExecutionBridge - Direct bridge from Nexus workflows to Rube MCP
 *
 * This service bypasses the complex Composio SDK path and calls Rube MCP directly
 * for REAL workflow execution. No more "demo mode" - actual API calls happen.
 *
 * ARCHITECTURE:
 * User Request → Claude AI → WorkflowSpec → RubeExecutionBridge → Rube MCP → Real APIs
 *
 * SUPPORTED INTEGRATIONS (via Rube MCP):
 * - Gmail: send, fetch, draft
 * - Slack: send message, list channels
 * - Google Sheets: read, append
 * - Google Calendar: create event, list events
 * - GitHub: create issue, list PRs
 * - HubSpot: create contact, search
 * - And 500+ more apps
 */

export interface WorkflowNode {
  id: string
  name: string
  type: 'trigger' | 'action' | 'output'
  integration: string  // e.g., "gmail", "slack", "sheets"
  action?: string      // e.g., "send", "fetch", "create"
  params?: Record<string, unknown>
}

export interface ConnectionStatus {
  toolkit: string
  connected: boolean
  authUrl?: string
  userInfo?: Record<string, unknown>
}

export interface ExecutionResult {
  nodeId: string
  success: boolean
  data?: unknown
  error?: string
  executionTimeMs: number
}

// Tool slug mapping from integration+action to Rube MCP tool slugs
const RUBE_TOOL_SLUGS: Record<string, Record<string, string>> = {
  gmail: {
    send: 'GMAIL_SEND_EMAIL',
    fetch: 'GMAIL_FETCH_EMAILS',
    draft: 'GMAIL_CREATE_EMAIL_DRAFT',
    reply: 'GMAIL_REPLY_TO_THREAD',
    default: 'GMAIL_SEND_EMAIL',
  },
  slack: {
    send: 'SLACK_SEND_MESSAGE',
    message: 'SLACK_SEND_MESSAGE',
    list: 'SLACK_LIST_ALL_CHANNELS',
    history: 'SLACK_FETCH_CONVERSATION_HISTORY',
    default: 'SLACK_SEND_MESSAGE',
  },
  googlesheets: {
    read: 'GOOGLESHEETS_BATCH_GET',
    get: 'GOOGLESHEETS_BATCH_GET',
    append: 'GOOGLESHEETS_BATCH_UPDATE',
    write: 'GOOGLESHEETS_BATCH_UPDATE',
    update: 'GOOGLESHEETS_BATCH_UPDATE',
    default: 'GOOGLESHEETS_BATCH_GET',
  },
  sheets: {
    read: 'GOOGLESHEETS_BATCH_GET',
    append: 'GOOGLESHEETS_BATCH_UPDATE',
    default: 'GOOGLESHEETS_BATCH_GET',
  },
  googlecalendar: {
    create: 'GOOGLECALENDAR_CREATE_EVENT',
    list: 'GOOGLECALENDAR_EVENTS_LIST',
    schedule: 'GOOGLECALENDAR_CREATE_EVENT',
    default: 'GOOGLECALENDAR_CREATE_EVENT',
  },
  calendar: {
    create: 'GOOGLECALENDAR_CREATE_EVENT',
    list: 'GOOGLECALENDAR_EVENTS_LIST',
    default: 'GOOGLECALENDAR_CREATE_EVENT',
  },
  github: {
    issue: 'GITHUB_CREATE_ISSUE',
    create: 'GITHUB_CREATE_ISSUE',
    list: 'GITHUB_LIST_REPOSITORY_ISSUES',
    pr: 'GITHUB_CREATE_PULL_REQUEST',
    default: 'GITHUB_CREATE_ISSUE',
  },
  hubspot: {
    contact: 'HUBSPOT_CREATE_CONTACT',
    create: 'HUBSPOT_CREATE_CONTACT',
    search: 'HUBSPOT_SEARCH_CONTACTS_BY_CRITERIA',
    list: 'HUBSPOT_LIST_CONTACTS',
    default: 'HUBSPOT_CREATE_CONTACT',
  },
  notion: {
    create: 'NOTION_CREATE_PAGE',
    page: 'NOTION_CREATE_PAGE',
    update: 'NOTION_UPDATE_PAGE',
    search: 'NOTION_SEARCH',
    default: 'NOTION_CREATE_PAGE',
  },
  discord: {
    send: 'DISCORD_SEND_MESSAGE',
    message: 'DISCORD_SEND_MESSAGE',
    default: 'DISCORD_SEND_MESSAGE',
  },
  linear: {
    create: 'LINEAR_CREATE_ISSUE',
    issue: 'LINEAR_CREATE_ISSUE',
    list: 'LINEAR_LIST_ISSUES',
    default: 'LINEAR_CREATE_ISSUE',
  },
  jira: {
    create: 'JIRA_CREATE_ISSUE',
    issue: 'JIRA_CREATE_ISSUE',
    search: 'JIRA_JQL_SEARCH',
    default: 'JIRA_CREATE_ISSUE',
  },
  trello: {
    card: 'TRELLO_CREATE_CARD',
    create: 'TRELLO_CREATE_CARD',
    list: 'TRELLO_GET_BOARD_CARDS',
    default: 'TRELLO_CREATE_CARD',
  },
  stripe: {
    customer: 'STRIPE_CREATE_CUSTOMER',
    charge: 'STRIPE_CREATE_CHARGE',
    invoice: 'STRIPE_CREATE_INVOICE',
    default: 'STRIPE_CREATE_CUSTOMER',
  },
  twitter: {
    post: 'TWITTER_CREATE_TWEET',
    tweet: 'TWITTER_CREATE_TWEET',
    default: 'TWITTER_CREATE_TWEET',
  },
  whatsapp: {
    send: 'WHATSAPP_SEND_MESSAGE',
    message: 'WHATSAPP_SEND_MESSAGE',
    default: 'WHATSAPP_SEND_MESSAGE',
  },
}

/**
 * Map a workflow node to the correct Rube MCP tool slug
 */
function getToolSlug(node: WorkflowNode): string {
  const integration = node.integration.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')
  const actionHints = [
    node.action?.toLowerCase(),
    ...node.name.toLowerCase().split(/\s+/),
  ].filter(Boolean) as string[]

  const toolMap = RUBE_TOOL_SLUGS[integration]
  if (!toolMap) {
    console.warn(`[RubeBridge] Unknown integration: ${integration}`)
    return `${integration.toUpperCase()}_DEFAULT_ACTION`
  }

  // Find matching action
  for (const hint of actionHints) {
    if (toolMap[hint]) {
      return toolMap[hint]
    }
  }

  return toolMap.default || Object.values(toolMap)[0]
}

/**
 * RubeExecutionBridge - Main class for executing workflows via Rube MCP
 */
class RubeExecutionBridgeClass {
  private sessionId: string | null = null
  private connectionCache: Map<string, ConnectionStatus> = new Map()

  /**
   * Check connection status for required integrations
   * This calls the backend which interfaces with Rube MCP
   */
  async checkConnections(toolkits: string[]): Promise<ConnectionStatus[]> {
    console.log('[RubeBridge] Checking connections for:', toolkits)

    try {
      const response = await fetch('/api/rube/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolkits }),
      })

      if (!response.ok) {
        throw new Error(`Connection check failed: ${response.status}`)
      }

      const data = await response.json()
      this.sessionId = data.sessionId

      // Cache results
      const results: ConnectionStatus[] = data.connections || []
      results.forEach(conn => {
        this.connectionCache.set(conn.toolkit, conn)
      })

      return results
    } catch (error) {
      console.error('[RubeBridge] Connection check failed:', error)
      // Return cached or default status
      return toolkits.map(toolkit => ({
        toolkit,
        connected: this.connectionCache.get(toolkit)?.connected || false,
      }))
    }
  }

  /**
   * Get OAuth URL for a toolkit that needs connection
   */
  async getAuthUrl(toolkit: string): Promise<string | null> {
    console.log('[RubeBridge] Getting auth URL for:', toolkit)

    try {
      const response = await fetch('/api/rube/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolkit, sessionId: this.sessionId }),
      })

      const data = await response.json()
      return data.authUrl || null
    } catch (error) {
      console.error('[RubeBridge] Get auth URL failed:', error)
      return null
    }
  }

  /**
   * Execute a single workflow node via Rube MCP
   */
  async executeNode(node: WorkflowNode): Promise<ExecutionResult> {
    const startTime = Date.now()
    const toolSlug = getToolSlug(node)

    console.log(`[RubeBridge] Executing ${toolSlug} for node ${node.id}`)

    try {
      const response = await fetch('/api/rube/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolSlug,
          params: node.params || {},
          sessionId: this.sessionId,
        }),
      })

      const data = await response.json()

      return {
        nodeId: node.id,
        success: data.success ?? false,
        data: data.data,
        error: data.error,
        executionTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      return {
        nodeId: node.id,
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Execute all nodes in a workflow sequentially
   */
  async executeWorkflow(nodes: WorkflowNode[]): Promise<ExecutionResult[]> {
    console.log(`[RubeBridge] Executing workflow with ${nodes.length} nodes`)

    const results: ExecutionResult[] = []

    for (const node of nodes) {
      const result = await this.executeNode(node)
      results.push(result)

      // Stop on error unless it's a trigger (triggers may just be setup)
      if (!result.success && node.type !== 'trigger') {
        console.error(`[RubeBridge] Node ${node.id} failed, stopping workflow`)
        break
      }
    }

    return results
  }

  /**
   * Execute multiple nodes in parallel (for independent actions)
   */
  async executeParallel(nodes: WorkflowNode[]): Promise<ExecutionResult[]> {
    console.log(`[RubeBridge] Executing ${nodes.length} nodes in parallel`)

    return Promise.all(nodes.map(node => this.executeNode(node)))
  }

  /**
   * Quick test to verify a connection is working
   */
  async testConnection(toolkit: string): Promise<boolean> {
    const testActions: Record<string, { slug: string; params: Record<string, unknown> }> = {
      gmail: { slug: 'GMAIL_FETCH_EMAILS', params: { max_results: 1 } },
      slack: { slug: 'SLACK_LIST_ALL_CHANNELS', params: { limit: 1 } },
      googlesheets: { slug: 'GOOGLESHEETS_BATCH_GET', params: {} },
      googlecalendar: { slug: 'GOOGLECALENDAR_EVENTS_LIST', params: { max_results: 1 } },
    }

    const test = testActions[toolkit.toLowerCase()]
    if (!test) return false

    try {
      const response = await fetch('/api/rube/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolSlug: test.slug,
          params: test.params,
          sessionId: this.sessionId,
        }),
      })

      const data = await response.json()
      return data.success === true
    } catch {
      return false
    }
  }

  /**
   * Get current session ID
   */
  get currentSessionId(): string | null {
    return this.sessionId
  }

  /**
   * Clear session and cache
   */
  reset(): void {
    this.sessionId = null
    this.connectionCache.clear()
  }
}

// Export singleton
export const rubeExecutionBridge = new RubeExecutionBridgeClass()
export default rubeExecutionBridge

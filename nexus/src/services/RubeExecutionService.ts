/**
 * RubeExecutionService - Bridge Nexus workflows to Rube MCP
 *
 * This service takes workflow specs from Claude (with tool slugs like "gmail", "slack")
 * and executes them via Rube MCP using RUBE_SEARCH_TOOLS and RUBE_MULTI_EXECUTE_TOOL.
 *
 * Key features:
 * - Maps Nexus tool slugs to Rube MCP tool calls
 * - Handles OAuth authentication flow
 * - Executes workflows via Rube MCP
 * - Returns execution results
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Workflow node structure (compatible with WorkflowPreviewCard)
 */
export interface WorkflowNode {
  id: string
  name: string
  type: 'trigger' | 'action' | 'output'
  integration?: string
  status?: 'idle' | 'pending' | 'connecting' | 'success' | 'error'
  result?: unknown
  error?: string
}

export interface RubeConnectionStatus {
  toolkit: string
  connected: boolean
  authUrl?: string
  scopes?: string[]
  error?: string
}

export interface RubeExecutionResult {
  success: boolean
  data?: unknown
  error?: string
  toolName: string
  executionTimeMs: number
}

export interface WorkflowExecutionResult {
  success: boolean
  results: RubeExecutionResult[]
  failedNodes: string[]
}

// ============================================================================
// Tool Mappings - Nexus slugs to Rube MCP tool names
// ============================================================================

/**
 * Maps Nexus integration names to Rube MCP toolkit identifiers
 */
const TOOLKIT_MAPPINGS: Record<string, string> = {
  gmail: 'gmail',
  googlesheets: 'googlesheets',
  'google sheets': 'googlesheets',
  'google_sheets': 'googlesheets',
  sheets: 'googlesheets',
  slack: 'slack',
  googlecalendar: 'googlecalendar',
  'google calendar': 'googlecalendar',
  'google_calendar': 'googlecalendar',
  calendar: 'googlecalendar',
  github: 'github',
  notion: 'notion',
  discord: 'discord',
  trello: 'trello',
  asana: 'asana',
  hubspot: 'hubspot',
  stripe: 'stripe',
}

/**
 * Maps Nexus tool slugs to Rube MCP tool names
 * Based on WorkflowPreviewCard TOOL_SLUGS
 */
const TOOL_NAME_MAPPINGS: Record<string, Record<string, string>> = {
  gmail: {
    send: 'GMAIL_SEND_EMAIL',
    fetch: 'GMAIL_FETCH_EMAILS',
    draft: 'GMAIL_CREATE_EMAIL_DRAFT',
    reply: 'GMAIL_REPLY_TO_THREAD',
  },
  slack: {
    send: 'SLACK_SEND_MESSAGE',
    notify: 'SLACK_SEND_MESSAGE',
    findChannels: 'SLACK_FIND_CHANNELS',
    listChannels: 'SLACK_LIST_ALL_CHANNELS',
  },
  googlesheets: {
    read: 'GOOGLESHEETS_BATCH_GET',
    get: 'GOOGLESHEETS_BATCH_GET',
    write: 'GOOGLESHEETS_BATCH_UPDATE',
    append: 'GOOGLESHEETS_BATCH_UPDATE',
    update: 'GOOGLESHEETS_BATCH_UPDATE',
  },
  googlecalendar: {
    create: 'GOOGLECALENDAR_CREATE_EVENT',
    list: 'GOOGLECALENDAR_EVENTS_LIST',
    update: 'GOOGLECALENDAR_UPDATE_EVENT',
    delete: 'GOOGLECALENDAR_DELETE_EVENT',
  },
  github: {
    issue: 'GITHUB_CREATE_ISSUE',
    createIssue: 'GITHUB_CREATE_ISSUE',
    listIssues: 'GITHUB_LIST_REPOSITORY_ISSUES',
    createPR: 'GITHUB_CREATE_PULL_REQUEST',
  },
  notion: {
    createPage: 'NOTION_CREATE_PAGE',
    updatePage: 'NOTION_UPDATE_PAGE',
    queryDatabase: 'NOTION_QUERY_DATABASE',
  },
  discord: {
    send: 'DISCORD_SEND_MESSAGE',
    sendMessage: 'DISCORD_SEND_MESSAGE',
    sendEmbed: 'DISCORD_SEND_EMBED',
  },
}

// ============================================================================
// RubeExecutionService Class
// ============================================================================

class RubeExecutionServiceClass {
  private rubeMcpAvailable = false
  private serverBaseUrl = '/api/rube'

  constructor() {
    this.checkRubeMcpAvailability()
  }

  /**
   * Check if Rube MCP is available in this environment
   */
  private async checkRubeMcpAvailability(): Promise<void> {
    try {
      // Check if Rube MCP is configured on the server
      const response = await fetch(`${this.serverBaseUrl}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        this.rubeMcpAvailable = data.available ?? false
      }
    } catch (error) {
      console.log('[RubeExecutionService] Rube MCP not available:', error)
      this.rubeMcpAvailable = false
    }
  }

  /**
   * Check connection status for required toolkits
   *
   * @param toolkits - Array of toolkit names (e.g., ['gmail', 'slack'])
   * @returns Map of toolkit -> connection status
   */
  async checkConnections(toolkits: string[]): Promise<Map<string, RubeConnectionStatus>> {
    console.log('[RubeExecutionService] Checking connections for:', toolkits)

    const statuses = new Map<string, RubeConnectionStatus>()

    if (!this.rubeMcpAvailable) {
      console.log('[RubeExecutionService] Rube MCP not available, returning disconnected status')
      toolkits.forEach(toolkit => {
        statuses.set(toolkit, {
          toolkit,
          connected: false,
          error: 'Rube MCP not configured',
        })
      })
      return statuses
    }

    // Map toolkit names to Rube identifiers
    const rubeToolkits = toolkits.map(t => TOOLKIT_MAPPINGS[t.toLowerCase()] || t)

    try {
      const response = await fetch(`${this.serverBaseUrl}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolkits: rubeToolkits }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      // Map responses back to original toolkit names
      toolkits.forEach((toolkit, index) => {
        const rubeToolkit = rubeToolkits[index]
        const status = data.connections?.[rubeToolkit]

        statuses.set(toolkit, {
          toolkit,
          connected: status?.connected ?? false,
          authUrl: status?.authUrl,
          scopes: status?.scopes,
        })
      })
    } catch (error) {
      console.error('[RubeExecutionService] Failed to check connections:', error)

      // Return disconnected status for all
      toolkits.forEach(toolkit => {
        statuses.set(toolkit, {
          toolkit,
          connected: false,
          error: error instanceof Error ? error.message : 'Connection check failed',
        })
      })
    }

    return statuses
  }

  /**
   * Initiate OAuth flow for a toolkit
   *
   * @param toolkit - Toolkit name (e.g., 'gmail', 'slack')
   * @returns OAuth URL to redirect user to
   */
  async initiateOAuth(toolkit: string): Promise<{ authUrl?: string; error?: string }> {
    console.log('[RubeExecutionService] Initiating OAuth for:', toolkit)

    if (!this.rubeMcpAvailable) {
      return { error: 'Rube MCP not configured' }
    }

    const rubeToolkit = TOOLKIT_MAPPINGS[toolkit.toLowerCase()] || toolkit

    try {
      const response = await fetch(`${this.serverBaseUrl}/oauth/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolkit: rubeToolkit }),
      })

      if (!response.ok) {
        const data = await response.json()
        return { error: data.error || `HTTP ${response.status}` }
      }

      const data = await response.json()
      return { authUrl: data.authUrl }
    } catch (error) {
      console.error('[RubeExecutionService] OAuth initiation failed:', error)
      return { error: error instanceof Error ? error.message : 'OAuth initiation failed' }
    }
  }

  /**
   * Map a workflow node to Rube MCP tool name
   *
   * @param node - Workflow node with integration and name
   * @returns Rube tool name or null if not found
   */
  private mapNodeToToolName(node: WorkflowNode): string | null {
    const integration = node.integration?.toLowerCase() || ''
    const nodeName = node.name.toLowerCase()

    // Try exact mapping first
    const toolkitMappings = TOOL_NAME_MAPPINGS[integration]
    if (toolkitMappings) {
      // Try to find action keyword in node name
      for (const [keyword, toolName] of Object.entries(toolkitMappings)) {
        if (nodeName.includes(keyword.toLowerCase())) {
          return toolName
        }
      }

      // Default to first available action
      return Object.values(toolkitMappings)[0] || null
    }

    // Fallback: construct tool name dynamically
    // Pattern: TOOLKIT_ACTION (e.g., GMAIL_SEND_EMAIL)
    const action = this.extractAction(nodeName)
    if (action && integration) {
      return `${integration.toUpperCase()}_${action.toUpperCase()}`
    }

    return null
  }

  /**
   * Extract action verb from node name
   * E.g., "Send email to team" -> "SEND"
   */
  private extractAction(nodeName: string): string | null {
    const actionKeywords = [
      'send', 'create', 'update', 'delete', 'get', 'list', 'fetch',
      'read', 'write', 'append', 'search', 'find', 'notify',
    ]

    const nameLower = nodeName.toLowerCase()
    for (const keyword of actionKeywords) {
      if (nameLower.includes(keyword)) {
        return keyword
      }
    }

    return null
  }

  /**
   * Extract parameters from workflow node
   * This is a simplified version - real implementation would parse node.config
   */
  private extractParams(node: WorkflowNode): Record<string, unknown> {
    // In real implementation, this would extract from node.config
    // For now, return empty object - actual params would come from WorkflowNode.config
    const params: Record<string, unknown> = {}

    // If node has result data from previous steps, we can use it
    if (node.result && typeof node.result === 'object') {
      Object.assign(params, node.result)
    }

    return params
  }

  /**
   * Execute a single workflow node via Rube MCP
   *
   * @param node - Workflow node to execute
   * @param context - Execution context from previous nodes
   * @returns Execution result
   */
  async executeNode(
    node: WorkflowNode,
    context?: Record<string, unknown>
  ): Promise<RubeExecutionResult> {
    const startTime = Date.now()
    const toolName = this.mapNodeToToolName(node)

    if (!toolName) {
      return {
        success: false,
        error: `Could not map node "${node.name}" to Rube tool`,
        toolName: 'UNKNOWN',
        executionTimeMs: Date.now() - startTime,
      }
    }

    if (!this.rubeMcpAvailable) {
      return {
        success: false,
        error: 'Rube MCP not configured',
        toolName,
        executionTimeMs: Date.now() - startTime,
      }
    }

    console.log(`[RubeExecutionService] Executing node "${node.name}" with tool ${toolName}`)

    try {
      // Extract parameters from node and context
      const params = {
        ...this.extractParams(node),
        ...context,
      }

      const response = await fetch(`${this.serverBaseUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName,
          params,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          toolName,
          executionTimeMs: Date.now() - startTime,
        }
      }

      const data = await response.json()

      return {
        success: true,
        data: data.result,
        toolName,
        executionTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      console.error('[RubeExecutionService] Node execution failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        toolName,
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Execute a complete workflow via Rube MCP
   *
   * @param nodes - Array of workflow nodes to execute
   * @returns Workflow execution results
   */
  async executeWorkflow(nodes: WorkflowNode[]): Promise<WorkflowExecutionResult> {
    console.log(`[RubeExecutionService] Executing workflow with ${nodes.length} nodes`)

    const results: RubeExecutionResult[] = []
    const failedNodes: string[] = []
    const context: Record<string, unknown> = {}

    // Execute nodes sequentially (in real implementation, respect dependencies)
    for (const node of nodes) {
      const result = await this.executeNode(node, context)
      results.push(result)

      if (result.success) {
        // Store result in context for next nodes
        context[node.id] = result.data
      } else {
        failedNodes.push(node.id)
        // For now, continue execution even on failure
        // In production, you might want to stop on critical failures
      }
    }

    const success = failedNodes.length === 0

    return {
      success,
      results,
      failedNodes,
    }
  }

  /**
   * Get available status
   */
  get isAvailable(): boolean {
    return this.rubeMcpAvailable
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const rubeExecutionService = new RubeExecutionServiceClass()

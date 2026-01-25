/**
 * RubeMCPService - Tool Execution via Rube MCP
 *
 * This service provides workflow automation via Rube MCP's 500+ integrations:
 * - Gmail, Google Calendar, Google Sheets, Google Drive
 * - Slack, Discord, Microsoft Teams
 * - GitHub, GitLab, Jira, Linear, Notion
 * - Salesforce, HubSpot, Pipedrive
 * - And many more via Rube's OAuth-managed connections
 *
 * The service handles:
 * - Tool discovery (finding tools for use cases)
 * - OAuth connection management (via Rube's UI)
 * - Multi-step workflow execution
 * - Session state management
 * - Error handling and retries
 *
 * NOTE: Rube MCP runs in Claude Code's MCP environment. This service
 * interfaces with Rube via HTTP proxy endpoints that Claude Code executes.
 */

import { randomBytes } from 'crypto'

// Types for tool execution
export interface RubeToolExecutionResult {
  success: boolean
  data?: unknown
  error?: string
  toolName: string
  executionTimeMs: number
  rawResponse?: unknown
}

export interface RubeConnectionStatus {
  app: string
  connected: boolean
  authUrl?: string
  connectionId?: string
}

export interface RubeToolInfo {
  name: string
  description: string
  app: string
  parameters?: Record<string, unknown>
  category?: string
}

export interface RubeSession {
  sessionId: string
  userId: string
  createdAt: Date
  lastActivity: Date
}

export interface RubeSearchToolsRequest {
  useCase: string
  limit?: number
}

export interface RubeManageConnectionsRequest {
  apps: string[]
  action: 'check' | 'initiate'
}

export interface RubeExecuteToolRequest {
  toolName: string
  parameters: Record<string, unknown>
}

export interface RubeMultiExecuteRequest {
  tools: Array<{
    toolName: string
    parameters: Record<string, unknown>
  }>
}

// App definitions (matching ComposioService for consistency)
export interface AppDefinition {
  id: string
  name: string
  description: string
  icon: string
  color: string
  category: 'communication' | 'productivity' | 'development' | 'crm' | 'social' | 'storage' | 'other'
}

export const RUBE_AVAILABLE_APPS: AppDefinition[] = [
  // Communication
  { id: 'gmail', name: 'Gmail', description: 'Send and receive emails', icon: '📧', color: '#EA4335', category: 'communication' },
  { id: 'slack', name: 'Slack', description: 'Team messaging', icon: '💬', color: '#4A154B', category: 'communication' },
  { id: 'discord', name: 'Discord', description: 'Community chat', icon: '🎮', color: '#5865F2', category: 'communication' },
  { id: 'zoom', name: 'Zoom', description: 'Video meetings', icon: '📹', color: '#2D8CFF', category: 'communication' },
  { id: 'teams', name: 'Microsoft Teams', description: 'Enterprise chat', icon: '👥', color: '#6264A7', category: 'communication' },

  // Productivity
  { id: 'googlecalendar', name: 'Google Calendar', description: 'Schedule events', icon: '📅', color: '#4285F4', category: 'productivity' },
  { id: 'googlesheets', name: 'Google Sheets', description: 'Spreadsheets', icon: '📊', color: '#0F9D58', category: 'productivity' },
  { id: 'notion', name: 'Notion', description: 'Notes & docs', icon: '📝', color: '#000000', category: 'productivity' },
  { id: 'airtable', name: 'Airtable', description: 'Database tables', icon: '🗃️', color: '#18BFFF', category: 'productivity' },
  { id: 'asana', name: 'Asana', description: 'Project tasks', icon: '✅', color: '#F06A6A', category: 'productivity' },
  { id: 'trello', name: 'Trello', description: 'Kanban boards', icon: '📋', color: '#0079BF', category: 'productivity' },

  // Development
  { id: 'github', name: 'GitHub', description: 'Code & issues', icon: '🐙', color: '#181717', category: 'development' },
  { id: 'gitlab', name: 'GitLab', description: 'Git repository', icon: '🦊', color: '#FC6D26', category: 'development' },
  { id: 'linear', name: 'Linear', description: 'Issue tracking', icon: '🔷', color: '#5E6AD2', category: 'development' },
  { id: 'jira', name: 'Jira', description: 'Project management', icon: '📊', color: '#0052CC', category: 'development' },

  // CRM & Sales
  { id: 'hubspot', name: 'HubSpot', description: 'CRM & contacts', icon: '🧡', color: '#FF7A59', category: 'crm' },
  { id: 'salesforce', name: 'Salesforce', description: 'Enterprise CRM', icon: '☁️', color: '#00A1E0', category: 'crm' },
  { id: 'pipedrive', name: 'Pipedrive', description: 'Sales pipeline', icon: '💼', color: '#1A1A1A', category: 'crm' },
  { id: 'stripe', name: 'Stripe', description: 'Payments', icon: '💳', color: '#635BFF', category: 'crm' },
  { id: 'intercom', name: 'Intercom', description: 'Customer chat', icon: '💁', color: '#1F8DED', category: 'crm' },

  // Social
  { id: 'twitter', name: 'Twitter/X', description: 'Social posts', icon: '🐦', color: '#1DA1F2', category: 'social' },
  { id: 'linkedin', name: 'LinkedIn', description: 'Professional network', icon: '💼', color: '#0A66C2', category: 'social' },
  { id: 'facebook', name: 'Facebook', description: 'Social media', icon: '📘', color: '#1877F2', category: 'social' },

  // Storage
  { id: 'dropbox', name: 'Dropbox', description: 'Cloud files', icon: '📦', color: '#0061FF', category: 'storage' },
  { id: 'googledrive', name: 'Google Drive', description: 'Cloud storage', icon: '☁️', color: '#4285F4', category: 'storage' },
  { id: 'onedrive', name: 'OneDrive', description: 'Microsoft storage', icon: '☁️', color: '#0078D4', category: 'storage' },
]

/**
 * Rube MCP Service - Tool Execution via Rube MCP Proxy
 */
class RubeMCPServiceClass {
  private sessions: Map<string, RubeSession> = new Map()
  private proxyBaseUrl: string = '/api/rube-proxy'
  private isInitialized: boolean = false
  private connectedApps: Set<string> = new Set()

  /**
   * Initialize the Rube MCP service
   * In production, this would verify connectivity to Rube MCP
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('[RubeMCPService] Initializing Rube MCP integration')

      // In a real implementation, this would:
      // 1. Verify Rube MCP is accessible
      // 2. Check available tools
      // 3. Load cached connection status

      this.isInitialized = true
      console.log('[RubeMCPService] Initialized successfully')

      return true
    } catch (error) {
      console.error('[RubeMCPService] Failed to initialize:', error)
      return false
    }
  }

  /**
   * Generate a new session for a user
   */
  createSession(userId: string): RubeSession {
    const sessionId = this.generateSessionId()
    const session: RubeSession = {
      sessionId,
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
    }

    this.sessions.set(sessionId, session)
    console.log(`[RubeMCPService] Created session ${sessionId} for user ${userId}`)

    return session
  }

  /**
   * Get or create session for a user
   */
  getOrCreateSession(userId: string): RubeSession {
    // Find existing session for user
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        session.lastActivity = new Date()
        return session
      }
    }

    // Create new session
    return this.createSession(userId)
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `rube_session_${randomBytes(16).toString('hex')}`
  }

  /**
   * Search for tools based on a use case description
   * Uses Rube's RUBE_SEARCH_TOOLS MCP tool
   */
  async searchTools(request: RubeSearchToolsRequest): Promise<RubeToolInfo[]> {
    const startTime = Date.now()

    try {
      console.log(`[RubeMCPService] Searching tools for: "${request.useCase}"`)

      // In production, this would call the Rube MCP proxy:
      // POST /api/rube-proxy/search-tools
      // Body: { useCase: request.useCase, limit: request.limit }

      // For now, return demo data
      const tools = this.generateDemoToolSearch(request.useCase)

      console.log(`[RubeMCPService] Found ${tools.length} tools (${Date.now() - startTime}ms)`)
      return tools

    } catch (error) {
      console.error('[RubeMCPService] Tool search failed:', error)
      return []
    }
  }

  /**
   * Manage OAuth connections for apps
   * Uses Rube's RUBE_MANAGE_CONNECTIONS MCP tool
   */
  async manageConnections(
    request: RubeManageConnectionsRequest,
    sessionId?: string
  ): Promise<RubeConnectionStatus[]> {
    try {
      console.log(`[RubeMCPService] Managing connections: ${request.action} for ${request.apps.join(', ')}`)

      if (request.action === 'check') {
        return this.checkConnections(request.apps)
      } else if (request.action === 'initiate') {
        return this.initiateConnections(request.apps, sessionId)
      }

      return []

    } catch (error) {
      console.error('[RubeMCPService] Connection management failed:', error)
      return request.apps.map(app => ({
        app,
        connected: false,
        error: String(error),
      }))
    }
  }

  /**
   * Check connection status for apps
   */
  private async checkConnections(apps: string[]): Promise<RubeConnectionStatus[]> {
    // In production, this would:
    // POST /api/rube-proxy/manage-connections
    // Body: { apps, action: 'check', sessionId }

    // For now, return demo data
    return apps.map(app => ({
      app,
      connected: this.connectedApps.has(app),
    }))
  }

  /**
   * Initiate OAuth connections for apps
   * WHITE-LABEL: Returns direct provider OAuth URLs via Nexus proxy
   * Users never see rube.app or composio.dev
   */
  private async initiateConnections(
    apps: string[],
    sessionId?: string
  ): Promise<RubeConnectionStatus[]> {
    // WHITE-LABEL OAuth - use Nexus proxy endpoint
    // This redirects to actual provider OAuth (Google, Slack, etc.)
    // NOT to rube.app

    return apps.map(app => ({
      app,
      connected: false,
      // Use Nexus OAuth proxy - users see provider OAuth, not Rube
      authUrl: `/api/oauth/proxy/${app}?session=${sessionId}&state=${Date.now()}`,
    }))
  }

  /**
   * Execute a single tool
   */
  async executeTool(
    toolName: string,
    parameters: Record<string, unknown>,
    sessionId?: string
  ): Promise<RubeToolExecutionResult> {
    const startTime = Date.now()

    try {
      console.log(`[RubeMCPService] Executing tool: ${toolName}`)

      // In production, this would:
      // POST /api/rube-proxy/execute-tool
      // Body: { toolName, parameters, sessionId }

      // For now, return demo response
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700))

      return {
        success: true,
        data: this.generateDemoToolResponse(toolName, parameters),
        toolName,
        executionTimeMs: Date.now() - startTime,
      }

    } catch (error) {
      console.error(`[RubeMCPService] Tool execution failed:`, error)

      return {
        success: false,
        error: String(error),
        toolName,
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Execute multiple tools in sequence
   * Uses Rube's RUBE_MULTI_EXECUTE_TOOL MCP tool
   */
  async executeMultipleTools(
    request: RubeMultiExecuteRequest,
    sessionId?: string
  ): Promise<RubeToolExecutionResult[]> {
    const startTime = Date.now()

    try {
      console.log(`[RubeMCPService] Executing ${request.tools.length} tools in workflow`)

      // In production, this would:
      // POST /api/rube-proxy/execute-multiple
      // Body: { tools: request.tools, sessionId }

      // For now, execute sequentially with demo responses
      const results: RubeToolExecutionResult[] = []

      for (const tool of request.tools) {
        const result = await this.executeTool(tool.toolName, tool.parameters, sessionId)
        results.push(result)

        // Stop on first failure
        if (!result.success) {
          console.log(`[RubeMCPService] Workflow stopped at ${tool.toolName} due to error`)
          break
        }
      }

      console.log(`[RubeMCPService] Workflow complete: ${results.length}/${request.tools.length} tools executed (${Date.now() - startTime}ms)`)
      return results

    } catch (error) {
      console.error('[RubeMCPService] Multi-tool execution failed:', error)
      return [{
        success: false,
        error: String(error),
        toolName: 'workflow',
        executionTimeMs: Date.now() - startTime,
      }]
    }
  }

  /**
   * Get connection status for a specific app
   */
  async getConnectionStatus(app: string): Promise<RubeConnectionStatus> {
    const results = await this.checkConnections([app])
    return results[0] || { app, connected: false }
  }

  /**
   * Refresh cached connection status
   */
  async refreshConnections(): Promise<string[]> {
    try {
      // In production, this would query Rube for all connected apps
      // For now, return cached list
      return Array.from(this.connectedApps)
    } catch (error) {
      console.error('[RubeMCPService] Failed to refresh connections:', error)
      return []
    }
  }

  /**
   * Mark an app as connected (for demo/testing)
   */
  markConnected(app: string): void {
    this.connectedApps.add(app.toLowerCase())
    console.log(`[RubeMCPService] Marked ${app} as connected`)
  }

  /**
   * Mark an app as disconnected (for demo/testing)
   */
  markDisconnected(app: string): void {
    this.connectedApps.delete(app.toLowerCase())
    console.log(`[RubeMCPService] Marked ${app} as disconnected`)
  }

  // ==========================================================================
  // Demo Response Generators
  // ==========================================================================

  /**
   * Generate demo tool search results based on use case
   */
  private generateDemoToolSearch(useCase: string): RubeToolInfo[] {
    const useCaseLower = useCase.toLowerCase()
    const tools: RubeToolInfo[] = []

    // Email-related use cases
    if (useCaseLower.includes('email') || useCaseLower.includes('gmail')) {
      tools.push(
        {
          name: 'gmail_send_email',
          description: 'Send an email via Gmail',
          app: 'gmail',
          category: 'communication',
        },
        {
          name: 'gmail_search_emails',
          description: 'Search for emails in Gmail',
          app: 'gmail',
          category: 'communication',
        }
      )
    }

    // Calendar-related use cases
    if (useCaseLower.includes('calendar') || useCaseLower.includes('meeting') || useCaseLower.includes('event')) {
      tools.push(
        {
          name: 'google_calendar_create_event',
          description: 'Create a calendar event',
          app: 'googlecalendar',
          category: 'productivity',
        },
        {
          name: 'google_calendar_list_events',
          description: 'List upcoming calendar events',
          app: 'googlecalendar',
          category: 'productivity',
        }
      )
    }

    // Slack-related use cases
    if (useCaseLower.includes('slack') || useCaseLower.includes('message') || useCaseLower.includes('notify')) {
      tools.push(
        {
          name: 'slack_send_message',
          description: 'Send a message to a Slack channel',
          app: 'slack',
          category: 'communication',
        }
      )
    }

    // Sheets-related use cases
    if (useCaseLower.includes('sheet') || useCaseLower.includes('spreadsheet') || useCaseLower.includes('data')) {
      tools.push(
        {
          name: 'google_sheets_append_row',
          description: 'Append a row to a Google Sheet',
          app: 'googlesheets',
          category: 'productivity',
        },
        {
          name: 'google_sheets_read_range',
          description: 'Read data from a Google Sheet',
          app: 'googlesheets',
          category: 'productivity',
        }
      )
    }

    // GitHub-related use cases
    if (useCaseLower.includes('github') || useCaseLower.includes('issue') || useCaseLower.includes('repo')) {
      tools.push(
        {
          name: 'github_create_issue',
          description: 'Create a GitHub issue',
          app: 'github',
          category: 'development',
        }
      )
    }

    // If no specific matches, return generic tools
    if (tools.length === 0) {
      tools.push(
        {
          name: 'generic_webhook',
          description: 'Send data to a webhook URL',
          app: 'http',
          category: 'other',
        }
      )
    }

    return tools
  }

  /**
   * Generate demo tool execution response
   */
  private generateDemoToolResponse(toolName: string, params: Record<string, unknown>): unknown {
    const timestamp = new Date().toISOString()

    // Gmail responses
    if (toolName.includes('gmail') && toolName.includes('send')) {
      return {
        messageId: `msg_demo_${Date.now()}`,
        threadId: `thread_demo_${Date.now()}`,
        to: params.to || params.recipient,
        subject: params.subject,
        sentAt: timestamp,
        status: 'sent',
        demoMode: true,
      }
    }

    if (toolName.includes('gmail') && (toolName.includes('search') || toolName.includes('list'))) {
      return {
        messages: [
          {
            id: `msg_${Date.now()}_1`,
            from: 'demo@example.com',
            subject: 'Demo Email 1',
            snippet: 'This is a demo email...',
            date: timestamp,
          },
        ],
        totalCount: 1,
        demoMode: true,
      }
    }

    // Calendar responses
    if (toolName.includes('calendar') && toolName.includes('create')) {
      return {
        eventId: `event_demo_${Date.now()}`,
        htmlLink: `https://calendar.google.com/event?eid=demo_${Date.now()}`,
        summary: params.summary || params.title,
        start: params.startTime || params.start,
        end: params.endTime || params.end,
        status: 'confirmed',
        created: timestamp,
        demoMode: true,
      }
    }

    // Slack responses
    if (toolName.includes('slack') && toolName.includes('send')) {
      return {
        ok: true,
        ts: `${Date.now()}.000100`,
        channel: params.channel,
        message: {
          text: params.text || params.message,
          ts: `${Date.now()}.000100`,
        },
        demoMode: true,
      }
    }

    // Sheets responses
    if (toolName.includes('sheets') && toolName.includes('append')) {
      return {
        spreadsheetId: params.spreadsheetId || 'demo_sheet_123',
        updatedRange: 'Sheet1!A1:Z1',
        updatedRows: 1,
        demoMode: true,
      }
    }

    if (toolName.includes('sheets') && toolName.includes('read')) {
      return {
        values: [
          ['Name', 'Email', 'Status'],
          ['John Doe', 'john@example.com', 'Active'],
          ['Jane Smith', 'jane@example.com', 'Pending'],
        ],
        demoMode: true,
      }
    }

    // GitHub responses
    if (toolName.includes('github') && toolName.includes('issue')) {
      return {
        id: Date.now(),
        number: Math.floor(Math.random() * 1000),
        title: params.title,
        html_url: `https://github.com/demo/repo/issues/${Math.floor(Math.random() * 1000)}`,
        state: 'open',
        created_at: timestamp,
        demoMode: true,
      }
    }

    // Default response
    return {
      success: true,
      toolName,
      executedAt: timestamp,
      input: params,
      message: `Tool ${toolName} executed successfully (demo mode)`,
      demoMode: true,
    }
  }

  // ==========================================================================
  // Convenience Methods for Common Operations
  // ==========================================================================

  /**
   * Send an email via Gmail
   */
  async sendEmail(params: {
    to: string
    subject: string
    body: string
    cc?: string[]
    bcc?: string[]
  }, sessionId?: string): Promise<RubeToolExecutionResult> {
    return this.executeTool('gmail_send_email', {
      to: params.to,
      subject: params.subject,
      body: params.body,
      cc: params.cc,
      bcc: params.bcc,
    }, sessionId)
  }

  /**
   * Create a calendar event
   */
  async createCalendarEvent(params: {
    title: string
    startTime: string
    endTime: string
    description?: string
    attendees?: string[]
  }, sessionId?: string): Promise<RubeToolExecutionResult> {
    return this.executeTool('google_calendar_create_event', {
      summary: params.title,
      startTime: params.startTime,
      endTime: params.endTime,
      description: params.description,
      attendees: params.attendees,
    }, sessionId)
  }

  /**
   * Send a Slack message
   */
  async sendSlackMessage(params: {
    channel: string
    text: string
  }, sessionId?: string): Promise<RubeToolExecutionResult> {
    return this.executeTool('slack_send_message', {
      channel: params.channel,
      text: params.text,
    }, sessionId)
  }

  /**
   * Append to Google Sheets
   */
  async appendToSheet(params: {
    spreadsheetId: string
    values: unknown[][]
  }, sessionId?: string): Promise<RubeToolExecutionResult> {
    return this.executeTool('google_sheets_append_row', {
      spreadsheetId: params.spreadsheetId,
      values: params.values,
    }, sessionId)
  }

  /**
   * Create a GitHub issue
   */
  async createGitHubIssue(params: {
    owner: string
    repo: string
    title: string
    body: string
  }, sessionId?: string): Promise<RubeToolExecutionResult> {
    return this.executeTool('github_create_issue', {
      owner: params.owner,
      repo: params.repo,
      title: params.title,
      body: params.body,
    }, sessionId)
  }

  // ==========================================================================
  // Status Methods
  // ==========================================================================

  get initialized(): boolean {
    return this.isInitialized
  }

  get connected(): string[] {
    return Array.from(this.connectedApps)
  }

  /**
   * Get list of available apps
   */
  getAvailableApps(): AppDefinition[] {
    return RUBE_AVAILABLE_APPS
  }

  /**
   * Get all active sessions
   */
  getSessions(): RubeSession[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Clean up old sessions (older than 24 hours)
   */
  cleanupSessions(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity.getTime() > maxAge) {
        this.sessions.delete(sessionId)
        console.log(`[RubeMCPService] Cleaned up expired session ${sessionId}`)
      }
    }
  }
}

// Export singleton instance
export const rubeMCPService = new RubeMCPServiceClass()

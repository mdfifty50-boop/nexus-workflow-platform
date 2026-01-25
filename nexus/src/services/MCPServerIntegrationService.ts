/**
 * MCPServerIntegrationService - MCP Server Integration for 8,000+ Apps
 *
 * Provides seamless integration with multiple MCP servers:
 *
 * SUPPORTED PROVIDERS:
 * - Rube MCP (https://rube.app/mcp) - OAuth-authenticated web access
 * - Composio MCP (https://mcp.composio.dev) - 500+ app integrations
 * - Google Cloud MCP (https://mcp.googleapis.com) - Native Google services (FREE for GCP)
 * - Zapier MCP (https://mcp.zapier.com) - 8,000+ apps, 30,000+ actions
 *
 * FEATURES:
 * - Tool discovery from MCP servers
 * - OAuth connection management
 * - Tool execution via MCP
 * - Automatic token refresh
 * - Provider-aware routing and fallback
 * - Cost optimization (Google MCP is free for GCP customers)
 *
 * Story 16.7 Implementation - Updated Jan 2026 with Google + Zapier MCP
 */

import type {
  MCPProvider,
  MCPServerConfig,
  MCPConnection,
  // MCPConnectionState - Used internally in MCPConnection interface
  // MCPAuthState - Used internally in MCPConnection interface
  // MCPTokenInfo - Used internally in MCPConnection interface
  MCPToolMapping,
  MCPExecutionRequest,
  MCPExecutionResult,
  MCPExecutionError,
  MCPErrorCode,
  MCPFallbackStrategy,
  MCPServerHealth,
  MCPHealthIssue,
  MCPToolDiscoveryResult,
  MCPDiscoveredTool,
  MCPIntegrationMetrics,
  MCPSession,
  MCPAvailabilityCheck,
  MCPProviderAvailability,
  MCPConnectionRequest,
  MCPConnectionResult,
  MCPRequestCost
} from '../types/tools'
import {
  DEFAULT_MCP_SERVERS,
  MCP_COST_THRESHOLDS,
  MCP_TIMING_THRESHOLDS,
  MCP_OPERATION_MESSAGES
} from '../types/tools'

/**
 * Generate unique IDs
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * MCP Server Integration Service
 */
export class MCPServerIntegrationService {
  // Server configurations
  private servers: Map<string, MCPServerConfig> = new Map()

  // Active connections
  private connections: Map<string, MCPConnection> = new Map()

  // Tool mappings (catalog tool ID -> MCP mapping)
  private toolMappings: Map<string, MCPToolMapping> = new Map()

  // Discovered tools cache
  private discoveredTools: Map<string, MCPDiscoveredTool[]> = new Map()

  // Active sessions
  private sessions: Map<string, MCPSession> = new Map()

  // Server health status
  private serverHealth: Map<string, MCPServerHealth> = new Map()

  // Metrics
  private metrics: MCPIntegrationMetrics = this.initializeMetrics()

  // Callbacks
  private onConnectionChange?: (connection: MCPConnection) => void
  private onToolDiscovered?: (tool: MCPDiscoveredTool) => void
  private onCostWarning?: (cost: number, threshold: number) => void

  constructor() {
    // Initialize with default servers
    DEFAULT_MCP_SERVERS.forEach(server => {
      this.servers.set(server.id, server)
    })
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeMetrics(): MCPIntegrationMetrics {
    return {
      totalConnections: 0,
      activeConnections: 0,
      failedConnections: 0,
      avgConnectionTimeMs: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgExecutionTimeMs: 0,
      totalCostUsd: 0,
      avgCostPerConnection: 0,
      costByProvider: {
        rube: 0,
        composio: 0,
        google: 0,
        zapier: 0,
        custom: 0
      },
      fallbacksTriggered: 0,
      fallbackSuccessRate: 0,
      toolsDiscovered: 0,
      toolsMapped: 0,
      toolsExecuted: 0
    }
  }

  // ============================================================================
  // SERVER MANAGEMENT
  // ============================================================================

  /**
   * Add or update an MCP server configuration
   */
  addServer(config: MCPServerConfig): void {
    this.servers.set(config.id, config)
  }

  /**
   * Remove an MCP server
   */
  removeServer(serverId: string): void {
    this.servers.delete(serverId)
    // Close any connections to this server
    for (const [connId, conn] of this.connections) {
      if (conn.serverId === serverId) {
        this.closeConnection(connId)
      }
    }
  }

  /**
   * Get server configuration
   */
  getServer(serverId: string): MCPServerConfig | null {
    return this.servers.get(serverId) ?? null
  }

  /**
   * Get all configured servers
   */
  getServers(): MCPServerConfig[] {
    return Array.from(this.servers.values())
  }

  /**
   * Get servers by provider
   */
  getServersByProvider(provider: MCPProvider): MCPServerConfig[] {
    return Array.from(this.servers.values()).filter(s => s.provider === provider)
  }

  // ============================================================================
  // TOOL DISCOVERY
  // ============================================================================

  /**
   * Discover tools from an MCP server
   */
  async discoverMCPTools(
    serverId: string,
    options?: { forceRefresh?: boolean; category?: string }
  ): Promise<MCPToolDiscoveryResult> {
    const server = this.servers.get(serverId)
    if (!server) {
      throw new Error(`Server not found: ${serverId}`)
    }

    // Check cache unless force refresh
    if (!options?.forceRefresh && this.discoveredTools.has(serverId)) {
      const cached = this.discoveredTools.get(serverId)!
      return {
        provider: server.provider,
        serverId,
        tools: options?.category
          ? cached.filter(t => t.category === options.category)
          : cached,
        totalCount: cached.length,
        discoveredAt: new Date().toISOString(),
        nextRefresh: new Date(Date.now() + 3600000).toISOString() // 1 hour
      }
    }

    const startTime = Date.now()

    try {
      // Simulate MCP tool discovery (in real implementation, call MCP server)
      const tools = await this.fetchToolsFromMCP(server, options?.category)

      // Cache discovered tools
      this.discoveredTools.set(serverId, tools)

      // Update metrics
      this.metrics.toolsDiscovered = tools.length

      // Notify callback
      tools.forEach(tool => this.onToolDiscovered?.(tool))

      // Calculate discovery duration for logging/metrics
      const discoveryDurationMs = Date.now() - startTime

      return {
        provider: server.provider,
        serverId,
        tools,
        totalCount: tools.length,
        discoveredAt: new Date().toISOString(),
        nextRefresh: new Date(Date.now() + 3600000).toISOString(),
        discoveryDurationMs
      }
    } catch (error) {
      throw new Error(
        `Failed to discover tools from ${server.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Fetch tools from MCP server (simulated)
   */
  private async fetchToolsFromMCP(
    server: MCPServerConfig,
    category?: string
  ): Promise<MCPDiscoveredTool[]> {
    // Simulate network delay
    await new Promise(resolve =>
      setTimeout(resolve, Math.min(MCP_TIMING_THRESHOLDS.toolDiscoveryTimeout, 500))
    )

    // Generate sample tools based on provider
    const tools: MCPDiscoveredTool[] = []

    if (server.provider === 'rube') {
      tools.push(
        this.createDiscoveredTool('RUBE_SEARCH_TOOLS', 'Search Tools', 'discovery', server.provider),
        this.createDiscoveredTool('RUBE_EXECUTE_TOOL', 'Execute Tool', 'execution', server.provider),
        this.createDiscoveredTool('RUBE_MANAGE_CONNECTIONS', 'Manage Connections', 'connection', server.provider),
        this.createDiscoveredTool('RUBE_FIND_RECIPE', 'Find Recipe', 'automation', server.provider)
      )
    } else if (server.provider === 'composio') {
      tools.push(
        this.createDiscoveredTool('GMAIL_SEND_EMAIL', 'Send Gmail', 'email', server.provider),
        this.createDiscoveredTool('GMAIL_FETCH_EMAILS', 'Fetch Emails', 'email', server.provider),
        this.createDiscoveredTool('SLACK_SEND_MESSAGE', 'Send Slack Message', 'messaging', server.provider),
        this.createDiscoveredTool('SLACK_LIST_CHANNELS', 'List Slack Channels', 'messaging', server.provider),
        this.createDiscoveredTool('GITHUB_CREATE_ISSUE', 'Create GitHub Issue', 'development', server.provider),
        this.createDiscoveredTool('GITHUB_LIST_PULL_REQUESTS', 'List Pull Requests', 'development', server.provider),
        this.createDiscoveredTool('GOOGLESHEETS_APPEND_DATA', 'Append to Sheet', 'productivity', server.provider),
        this.createDiscoveredTool('NOTION_CREATE_PAGE', 'Create Notion Page', 'productivity', server.provider),
        this.createDiscoveredTool('CALENDAR_CREATE_EVENT', 'Create Calendar Event', 'calendar', server.provider),
        this.createDiscoveredTool('TRELLO_CREATE_CARD', 'Create Trello Card', 'project_management', server.provider)
      )
    } else if (server.provider === 'google') {
      // Google Cloud MCP - fully-managed Google services
      tools.push(
        this.createDiscoveredTool('GOOGLE_MAPS_SEARCH', 'Google Maps Search', 'maps', server.provider),
        this.createDiscoveredTool('GOOGLE_MAPS_DIRECTIONS', 'Get Directions', 'maps', server.provider),
        this.createDiscoveredTool('GOOGLE_BIGQUERY_QUERY', 'Run BigQuery Query', 'analytics', server.provider),
        this.createDiscoveredTool('GOOGLE_BIGQUERY_INSERT', 'Insert BigQuery Data', 'analytics', server.provider),
        this.createDiscoveredTool('GOOGLE_COMPUTE_LIST_INSTANCES', 'List Compute Instances', 'infrastructure', server.provider),
        this.createDiscoveredTool('GOOGLE_COMPUTE_CREATE_INSTANCE', 'Create Compute Instance', 'infrastructure', server.provider),
        this.createDiscoveredTool('GOOGLE_KUBERNETES_LIST_CLUSTERS', 'List K8s Clusters', 'infrastructure', server.provider),
        this.createDiscoveredTool('GOOGLE_KUBERNETES_DEPLOY', 'Deploy to K8s', 'infrastructure', server.provider),
        this.createDiscoveredTool('GOOGLE_DRIVE_LIST_FILES', 'List Drive Files', 'storage', server.provider),
        this.createDiscoveredTool('GOOGLE_DRIVE_UPLOAD', 'Upload to Drive', 'storage', server.provider),
        this.createDiscoveredTool('GOOGLE_DOCS_CREATE', 'Create Google Doc', 'productivity', server.provider),
        this.createDiscoveredTool('GOOGLE_GMAIL_SEND', 'Send Gmail (Native)', 'email', server.provider),
        this.createDiscoveredTool('GOOGLE_CALENDAR_CREATE', 'Create Calendar Event (Native)', 'calendar', server.provider),
        this.createDiscoveredTool('GOOGLE_SHEETS_APPEND', 'Append to Sheets (Native)', 'productivity', server.provider)
      )
    } else if (server.provider === 'zapier') {
      // Zapier MCP - 8,000+ apps, 30,000+ actions
      tools.push(
        // Core Zapier actions
        this.createDiscoveredTool('ZAPIER_SEARCH_APPS', 'Search Zapier Apps', 'discovery', server.provider),
        this.createDiscoveredTool('ZAPIER_EXECUTE_ACTION', 'Execute Zapier Action', 'execution', server.provider),
        this.createDiscoveredTool('ZAPIER_CREATE_ZAP', 'Create New Zap', 'automation', server.provider),
        this.createDiscoveredTool('ZAPIER_LIST_ZAPS', 'List Active Zaps', 'automation', server.provider),
        // Popular app integrations via Zapier
        this.createDiscoveredTool('ZAPIER_AIRTABLE_CREATE_RECORD', 'Create Airtable Record', 'database', server.provider),
        this.createDiscoveredTool('ZAPIER_HUBSPOT_CREATE_CONTACT', 'Create HubSpot Contact', 'crm', server.provider),
        this.createDiscoveredTool('ZAPIER_SALESFORCE_CREATE_LEAD', 'Create Salesforce Lead', 'crm', server.provider),
        this.createDiscoveredTool('ZAPIER_STRIPE_CREATE_INVOICE', 'Create Stripe Invoice', 'payments', server.provider),
        this.createDiscoveredTool('ZAPIER_MAILCHIMP_ADD_SUBSCRIBER', 'Add Mailchimp Subscriber', 'marketing', server.provider),
        this.createDiscoveredTool('ZAPIER_JIRA_CREATE_ISSUE', 'Create Jira Issue', 'project_management', server.provider),
        this.createDiscoveredTool('ZAPIER_ASANA_CREATE_TASK', 'Create Asana Task', 'project_management', server.provider),
        this.createDiscoveredTool('ZAPIER_TRELLO_CREATE_CARD', 'Create Trello Card', 'project_management', server.provider),
        this.createDiscoveredTool('ZAPIER_INTERCOM_SEND_MESSAGE', 'Send Intercom Message', 'customer_support', server.provider),
        this.createDiscoveredTool('ZAPIER_ZENDESK_CREATE_TICKET', 'Create Zendesk Ticket', 'customer_support', server.provider),
        this.createDiscoveredTool('ZAPIER_SHOPIFY_CREATE_ORDER', 'Create Shopify Order', 'ecommerce', server.provider),
        this.createDiscoveredTool('ZAPIER_TYPEFORM_GET_RESPONSES', 'Get Typeform Responses', 'forms', server.provider),
        this.createDiscoveredTool('ZAPIER_TWILIO_SEND_SMS', 'Send Twilio SMS', 'communication', server.provider),
        this.createDiscoveredTool('ZAPIER_SENDGRID_SEND_EMAIL', 'Send SendGrid Email', 'email', server.provider)
      )
    }

    // Filter by category if specified
    if (category) {
      return tools.filter(t => t.category === category)
    }

    return tools
  }

  /**
   * Create a discovered tool structure
   */
  private createDiscoveredTool(
    slug: string,
    name: string,
    category: string,
    provider: MCPProvider
  ): MCPDiscoveredTool {
    return {
      slug,
      name,
      description: `${name} via ${provider} MCP`,
      category,
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      authRequired: true,
      isAvailable: true,
      rateLimits: {
        requestsPerMinute: provider === 'google' ? 120 : provider === 'zapier' ? 100 : provider === 'composio' ? 100 : 60,
        requestsPerDay: provider === 'google' ? 50000 : provider === 'zapier' ? 25000 : provider === 'composio' ? 10000 : 5000
      }
    }
  }

  // ============================================================================
  // AVAILABILITY CHECKING
  // ============================================================================

  /**
   * Check if a tool is available via MCP
   */
  async checkMCPAvailability(toolId: string): Promise<MCPAvailabilityCheck> {
    const startTime = Date.now()
    const providers: MCPProviderAvailability[] = []
    let isAvailable = false
    let recommendedProvider: MCPProvider | undefined

    // Check each enabled server
    for (const server of this.servers.values()) {
      if (!server.isEnabled) continue

      try {
        // Check timeout
        if (Date.now() - startTime > MCP_TIMING_THRESHOLDS.availabilityCheckTimeout) {
          break
        }

        const availability = await this.checkProviderAvailability(toolId, server)
        providers.push(availability)

        if (availability.isAvailable) {
          isAvailable = true
          if (!recommendedProvider || availability.confidence > (providers.find(p => p.provider === recommendedProvider)?.confidence ?? 0)) {
            recommendedProvider = availability.provider
          }
        }
      } catch {
        providers.push({
          provider: server.provider,
          serverId: server.id,
          isAvailable: false,
          confidence: 0
        })
      }
    }

    // Determine fallback if not available
    const fallbackRequired = !isAvailable
    let fallbackStrategy: MCPFallbackStrategy | undefined

    if (fallbackRequired) {
      fallbackStrategy = this.determineFallbackStrategy(toolId)
    }

    return {
      toolId,
      isAvailable,
      providers,
      recommendedProvider,
      fallbackRequired,
      fallbackStrategy
    }
  }

  /**
   * Check availability for a specific provider
   */
  private async checkProviderAvailability(
    toolId: string,
    server: MCPServerConfig
  ): Promise<MCPProviderAvailability> {
    // Check if we have a mapping
    const mapping = this.toolMappings.get(toolId)

    if (mapping && mapping.provider === server.provider) {
      return {
        provider: server.provider,
        serverId: server.id,
        isAvailable: true,
        toolSlug: mapping.mcpToolSlug,
        confidence: mapping.confidence,
        estimatedLatencyMs: 500,
        estimatedCostUsd: 0.01
      }
    }

    // Check discovered tools
    const discovered = this.discoveredTools.get(server.id) ?? []
    const matchedTool = discovered.find(t =>
      t.slug.toLowerCase().includes(toolId.toLowerCase()) ||
      t.possibleCatalogMatches?.includes(toolId)
    )

    if (matchedTool) {
      return {
        provider: server.provider,
        serverId: server.id,
        isAvailable: true,
        toolSlug: matchedTool.slug,
        confidence: matchedTool.mappingConfidence ?? 0.7,
        estimatedLatencyMs: 500,
        estimatedCostUsd: 0.01
      }
    }

    return {
      provider: server.provider,
      serverId: server.id,
      isAvailable: false,
      confidence: 0
    }
  }

  /**
   * Determine fallback strategy for unavailable tool
   */
  private determineFallbackStrategy(toolId: string): MCPFallbackStrategy {
    // Check if direct OAuth is available for this tool type
    const toolLower = toolId.toLowerCase()

    if (toolLower.includes('gmail') || toolLower.includes('google')) {
      return {
        type: 'direct_oauth',
        priority: 1,
        oauthConfig: {
          provider: 'google',
          scopes: ['https://www.googleapis.com/auth/gmail.modify']
        }
      }
    }

    if (toolLower.includes('slack')) {
      return {
        type: 'direct_oauth',
        priority: 1,
        oauthConfig: {
          provider: 'slack',
          scopes: ['chat:write', 'channels:read']
        }
      }
    }

    if (toolLower.includes('github')) {
      return {
        type: 'direct_oauth',
        priority: 1,
        oauthConfig: {
          provider: 'github',
          scopes: ['repo', 'issues']
        }
      }
    }

    // Default to dynamic API discovery
    return {
      type: 'dynamic_api',
      priority: 2,
      apiDiscoveryConfig: {}
    }
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Connect to an MCP server
   */
  async connectViaMCP(request: MCPConnectionRequest): Promise<MCPConnectionResult> {
    const startTime = Date.now()

    // Find server
    const serverId = request.serverId ?? this.getDefaultServerId(request.provider)
    const server = this.servers.get(serverId)

    if (!server) {
      return {
        success: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: `Server not found: ${serverId}`,
          isRetryable: false,
          fallbackAvailable: true
        },
        durationMs: Date.now() - startTime
      }
    }

    // Check for existing connection
    const existingConn = this.findExistingConnection(serverId)
    if (existingConn && !request.options?.forceRefresh) {
      return {
        success: true,
        connection: existingConn,
        durationMs: Date.now() - startTime
      }
    }

    try {
      // Create connection
      const connection = await this.establishConnection(server, request.options?.timeout)

      // Store connection
      this.connections.set(connection.id, connection)

      // Update metrics
      this.metrics.totalConnections++
      this.metrics.activeConnections = this.connections.size
      this.updateAvgConnectionTime(Date.now() - startTime)

      // Notify callback
      this.onConnectionChange?.(connection)

      return {
        success: true,
        connection,
        durationMs: Date.now() - startTime
      }
    } catch (error) {
      this.metrics.failedConnections++

      // Try fallback
      const fallbackResult = await this.tryFallback(request, error)
      if (fallbackResult) {
        return fallbackResult
      }

      return {
        success: false,
        error: this.classifyConnectionError(error),
        durationMs: Date.now() - startTime
      }
    }
  }

  /**
   * Get default server ID for provider
   */
  private getDefaultServerId(provider: MCPProvider): string {
    switch (provider) {
      case 'rube': return 'rube-default'
      case 'composio': return 'composio-default'
      case 'google': return 'google-mcp'
      case 'zapier': return 'zapier-mcp'
      default: return 'composio-default'
    }
  }

  /**
   * Find existing valid connection
   */
  private findExistingConnection(serverId: string): MCPConnection | null {
    for (const conn of this.connections.values()) {
      if (conn.serverId === serverId && conn.state === 'authenticated') {
        // Check if not expired
        if (!conn.expiresAt || new Date(conn.expiresAt) > new Date()) {
          return conn
        }
      }
    }
    return null
  }

  /**
   * Establish connection to MCP server
   */
  private async establishConnection(
    server: MCPServerConfig,
    timeout?: number
  ): Promise<MCPConnection> {
    const connectionTimeout = timeout ?? MCP_TIMING_THRESHOLDS.connectionTimeout

    // Simulate connection establishment
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, Math.min(connectionTimeout / 2, 1000))

      // Check for timeout
      setTimeout(() => {
        clearTimeout(timer)
        reject(new Error('Connection timeout'))
      }, connectionTimeout)
    })

    const now = new Date().toISOString()

    return {
      id: generateId('mcp_conn'),
      serverId: server.id,
      provider: server.provider,
      state: 'authenticated',
      connectedAt: now,
      lastActivityAt: now,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour

      authState: {
        isAuthenticated: true,
        method: server.authMethod,
        needsRefresh: false,
        lastRefreshed: now
      },

      tokenInfo: {
        accessToken: `mcp_token_${generateId('tok')}`,
        tokenType: 'Bearer',
        expiresIn: 3600,
        issuedAt: now
      },

      requestCount: 0,
      errorCount: 0,
      avgLatencyMs: 0,
      totalCostUsd: 0,
      requestCosts: []
    }
  }

  /**
   * Try fallback connection method
   * @param request - Connection request for fallback (reserved for future direct OAuth implementation)
   * @param originalError - Original error that triggered fallback (reserved for error-specific fallback logic)
   */
  private async tryFallback(
    _request: MCPConnectionRequest,
    _originalError: unknown
  ): Promise<MCPConnectionResult | null> {
    void _request
    void _originalError
    // TODO: In real implementation, would use request.provider to determine fallback strategy
    // and originalError to log/report the failure reason
    this.metrics.fallbacksTriggered++

    return {
      success: false,
      error: {
        code: 'CONNECTION_FAILED',
        message: 'MCP connection failed, fallback available',
        isRetryable: false,
        fallbackAvailable: true
      },
      durationMs: 0,
      fallbackUsed: false,
      fallbackType: 'direct_oauth'
    }
  }

  /**
   * Classify connection error
   */
  private classifyConnectionError(error: unknown): MCPExecutionError {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: MCP_OPERATION_MESSAGES.errors.TIMEOUT,
        isRetryable: true,
        fallbackAvailable: true
      }
    }

    if (message.includes('network') || message.includes('ENOTFOUND')) {
      return {
        code: 'NETWORK_ERROR',
        message: MCP_OPERATION_MESSAGES.errors.NETWORK_ERROR,
        isRetryable: true,
        fallbackAvailable: true
      }
    }

    if (message.includes('auth') || message.includes('401')) {
      return {
        code: 'AUTH_EXPIRED',
        message: MCP_OPERATION_MESSAGES.errors.AUTH_EXPIRED,
        isRetryable: true,
        suggestedAction: 'Refresh authentication',
        fallbackAvailable: true
      }
    }

    return {
      code: 'CONNECTION_FAILED',
      message: MCP_OPERATION_MESSAGES.errors.CONNECTION_FAILED,
      isRetryable: false,
      fallbackAvailable: true
    }
  }

  /**
   * Close a connection
   */
  closeConnection(connectionId: string): void {
    const conn = this.connections.get(connectionId)
    if (conn) {
      conn.state = 'disconnected'
      this.connections.delete(connectionId)
      this.metrics.activeConnections = this.connections.size
      this.onConnectionChange?.(conn)
    }
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): MCPConnection | null {
    return this.connections.get(connectionId) ?? null
  }

  /**
   * Get all active connections
   */
  getActiveConnections(): MCPConnection[] {
    return Array.from(this.connections.values()).filter(c => c.state === 'authenticated')
  }

  // ============================================================================
  // TOOL EXECUTION
  // ============================================================================

  /**
   * Execute a tool via MCP
   */
  async executeTool(request: MCPExecutionRequest): Promise<MCPExecutionResult> {
    const startTime = Date.now()
    const requestId = generateId('mcp_req')

    // Find or create connection
    const connection = await this.ensureConnection(request.toolMapping.provider)

    if (!connection) {
      return this.createErrorResult(requestId, request, 'CONNECTION_FAILED', startTime)
    }

    try {
      // Check cost budget
      if (request.options?.trackCost !== false) {
        this.checkCostBudget(connection)
      }

      // Execute the tool
      const result = await this.performToolExecution(request, connection, requestId)

      // Update connection metrics
      this.updateConnectionMetrics(connection, result.durationMs, result.costUsd, result.success)

      // Update service metrics
      this.updateExecutionMetrics(result)

      return result
    } catch (error) {
      const errorResult = this.createErrorResult(
        requestId,
        request,
        this.classifyExecutionError(error).code,
        startTime,
        error
      )

      // Update metrics
      this.updateConnectionMetrics(connection, errorResult.durationMs, 0, false)
      this.metrics.failedExecutions++

      return errorResult
    }
  }

  /**
   * Ensure we have a valid connection
   */
  private async ensureConnection(provider: MCPProvider): Promise<MCPConnection | null> {
    // Look for existing connection
    for (const conn of this.connections.values()) {
      if (conn.provider === provider && conn.state === 'authenticated') {
        return conn
      }
    }

    // Create new connection
    const result = await this.connectViaMCP({ provider })
    return result.connection ?? null
  }

  /**
   * Perform the actual tool execution
   */
  private async performToolExecution(
    request: MCPExecutionRequest,
    connection: MCPConnection,
    requestId: string
  ): Promise<MCPExecutionResult> {
    const startTime = Date.now()
    const timeout = request.options?.timeout ?? MCP_TIMING_THRESHOLDS.executionTimeout

    // Transform parameters if needed
    const transformedParams = this.transformParameters(
      request.parameters,
      request.toolMapping.parameterMappings
    )

    // Simulate MCP tool execution
    await new Promise((resolve, reject) => {
      const delay = Math.random() * 1000 + 200 // 200-1200ms
      const timer = setTimeout(resolve, delay)

      setTimeout(() => {
        clearTimeout(timer)
        reject(new Error('Execution timeout'))
      }, timeout)
    })

    const durationMs = Date.now() - startTime
    const costUsd = this.calculateExecutionCost(durationMs, request.toolMapping.provider)

    // Track cost
    this.trackRequestCost(connection.id, {
      requestId,
      toolId: request.toolMapping.catalogToolId,
      costUsd,
      timestamp: new Date().toISOString(),
      durationMs
    })

    return {
      success: true,
      requestId,
      toolSlug: request.toolMapping.mcpToolSlug,
      provider: request.toolMapping.provider,
      data: {
        message: 'Tool executed successfully',
        parameters: transformedParams
      },
      durationMs,
      costUsd,
      retryCount: 0,
      timestamp: new Date().toISOString(),
      serverResponseTime: durationMs - 50
    }
  }

  /**
   * Transform parameters for MCP tool
   */
  private transformParameters(
    params: Record<string, unknown>,
    mappings?: MCPExecutionRequest['toolMapping']['parameterMappings']
  ): Record<string, unknown> {
    if (!mappings || mappings.length === 0) {
      return params
    }

    const transformed: Record<string, unknown> = {}

    for (const mapping of mappings) {
      const value = params[mapping.catalogParam] ?? mapping.defaultValue

      if (value === undefined && mapping.isRequired) {
        throw new Error(`Required parameter missing: ${mapping.catalogParam}`)
      }

      if (value !== undefined) {
        transformed[mapping.mcpParam] = this.applyTransform(value, mapping.transform)
      }
    }

    // Add any parameters not in mappings
    for (const [key, value] of Object.entries(params)) {
      if (!mappings.find(m => m.catalogParam === key)) {
        transformed[key] = value
      }
    }

    return transformed
  }

  /**
   * Apply value transformation
   */
  private applyTransform(
    value: unknown,
    transform?: 'none' | 'stringify' | 'parse_json' | 'encode_uri' | 'custom'
  ): unknown {
    switch (transform) {
      case 'stringify':
        return JSON.stringify(value)
      case 'parse_json':
        return typeof value === 'string' ? JSON.parse(value) : value
      case 'encode_uri':
        return encodeURIComponent(String(value))
      default:
        return value
    }
  }

  /**
   * Calculate execution cost
   */
  private calculateExecutionCost(durationMs: number, provider: MCPProvider): number {
    // Base cost per request - Google MCP is free for GCP customers
    let baseCost: number
    switch (provider) {
      case 'google': baseCost = 0.000 // Free for GCP customers
        break
      case 'zapier': baseCost = 0.006 // Zapier task credits
        break
      case 'composio': baseCost = 0.005 // Composio
        break
      default: baseCost = 0.008 // Rube/custom
    }

    // Add time-based cost (longer executions cost more)
    const timeCost = (durationMs / 1000) * 0.001

    return Math.round((baseCost + timeCost) * 1000) / 1000
  }

  /**
   * Track request cost
   */
  private trackRequestCost(connectionId: string, cost: MCPRequestCost): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.requestCosts.push(cost)
      connection.totalCostUsd += cost.costUsd

      // Update metrics
      this.metrics.totalCostUsd += cost.costUsd
      this.metrics.costByProvider[connection.provider] += cost.costUsd

      // Check for cost warning
      if (connection.totalCostUsd >= MCP_COST_THRESHOLDS.warningThreshold) {
        this.onCostWarning?.(connection.totalCostUsd, MCP_COST_THRESHOLDS.maxCostPerConnection)
      }
    }
  }

  /**
   * Check cost budget before execution
   */
  private checkCostBudget(connection: MCPConnection): void {
    if (connection.totalCostUsd >= MCP_COST_THRESHOLDS.maxCostPerConnection) {
      throw new Error('Cost budget exceeded for this connection')
    }
  }

  /**
   * Create error result
   */
  private createErrorResult(
    requestId: string,
    request: MCPExecutionRequest,
    code: MCPErrorCode,
    startTime: number,
    error?: unknown
  ): MCPExecutionResult {
    return {
      success: false,
      requestId,
      toolSlug: request.toolMapping.mcpToolSlug,
      provider: request.toolMapping.provider,
      error: {
        code,
        message: MCP_OPERATION_MESSAGES.errors[code],
        details: error instanceof Error ? error.message : undefined,
        isRetryable: ['TIMEOUT', 'RATE_LIMITED', 'NETWORK_ERROR', 'SERVER_ERROR'].includes(code),
        fallbackAvailable: true
      },
      durationMs: Date.now() - startTime,
      costUsd: 0,
      retryCount: 0,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Classify execution error
   */
  private classifyExecutionError(error: unknown): MCPExecutionError {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: MCP_OPERATION_MESSAGES.errors.TIMEOUT,
        isRetryable: true,
        fallbackAvailable: true
      }
    }

    if (message.includes('rate') || message.includes('429')) {
      return {
        code: 'RATE_LIMITED',
        message: MCP_OPERATION_MESSAGES.errors.RATE_LIMITED,
        isRetryable: true,
        fallbackAvailable: false
      }
    }

    if (message.includes('parameter') || message.includes('invalid')) {
      return {
        code: 'PARAMETER_INVALID',
        message: MCP_OPERATION_MESSAGES.errors.PARAMETER_INVALID,
        isRetryable: false,
        fallbackAvailable: false
      }
    }

    if (message.includes('budget') || message.includes('cost')) {
      return {
        code: 'QUOTA_EXCEEDED',
        message: MCP_OPERATION_MESSAGES.errors.QUOTA_EXCEEDED,
        isRetryable: false,
        fallbackAvailable: true
      }
    }

    return {
      code: 'SERVER_ERROR',
      message: MCP_OPERATION_MESSAGES.errors.SERVER_ERROR,
      isRetryable: true,
      fallbackAvailable: true
    }
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  /**
   * Refresh MCP token
   */
  async refreshMCPToken(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      return false
    }

    try {
      // Simulate token refresh
      await new Promise(resolve => setTimeout(resolve, 500))

      const now = new Date().toISOString()

      connection.tokenInfo = {
        accessToken: `mcp_token_${generateId('tok')}`,
        refreshToken: connection.tokenInfo?.refreshToken,
        tokenType: 'Bearer',
        expiresIn: 3600,
        issuedAt: now
      }

      connection.authState.needsRefresh = false
      connection.authState.lastRefreshed = now
      connection.expiresAt = new Date(Date.now() + 3600000).toISOString()

      this.onConnectionChange?.(connection)

      return true
    } catch {
      connection.authState.needsRefresh = true
      return false
    }
  }

  /**
   * Check if token needs refresh
   */
  needsTokenRefresh(connectionId: string): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection) return true

    if (connection.authState.needsRefresh) return true

    if (connection.expiresAt) {
      const expiresAt = new Date(connection.expiresAt).getTime()
      const refreshThreshold = 5 * 60 * 1000 // 5 minutes before expiry
      return Date.now() >= expiresAt - refreshThreshold
    }

    return false
  }

  // ============================================================================
  // FALLBACK HANDLING
  // ============================================================================

  /**
   * Fall back to direct OAuth
   */
  async fallbackToDirectOAuth(
    _toolId: string,
    strategy: MCPFallbackStrategy
  ): Promise<MCPConnectionResult> {
    void _toolId
    const startTime = Date.now()

    if (strategy.type !== 'direct_oauth' || !strategy.oauthConfig) {
      return {
        success: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: 'Invalid fallback strategy',
          isRetryable: false,
          fallbackAvailable: false
        },
        durationMs: Date.now() - startTime,
        fallbackUsed: true,
        fallbackType: strategy.type
      }
    }

    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Create a pseudo-connection for OAuth
    const connection: MCPConnection = {
      id: generateId('oauth_conn'),
      serverId: 'direct-oauth',
      provider: 'custom',
      state: 'authenticated',
      connectedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),

      authState: {
        isAuthenticated: true,
        method: 'oauth',
        scope: strategy.oauthConfig.scopes,
        needsRefresh: false
      },

      requestCount: 0,
      errorCount: 0,
      avgLatencyMs: 0,
      totalCostUsd: 0,
      requestCosts: []
    }

    this.connections.set(connection.id, connection)
    this.metrics.fallbacksTriggered++

    return {
      success: true,
      connection,
      durationMs: Date.now() - startTime,
      fallbackUsed: true,
      fallbackType: 'direct_oauth'
    }
  }

  // ============================================================================
  // TOOL MAPPING
  // ============================================================================

  /**
   * Map a catalog tool to MCP tool
   */
  mapToolToMCP(
    catalogToolId: string,
    mcpToolSlug: string,
    provider: MCPProvider,
    options?: {
      confidence?: number
      parameterMappings?: MCPToolMapping['parameterMappings']
      responseMapping?: MCPToolMapping['responseMapping']
    }
  ): MCPToolMapping {
    const serverId = this.getDefaultServerId(provider)

    const mapping: MCPToolMapping = {
      catalogToolId,
      mcpToolSlug,
      provider,
      serverId,
      confidence: options?.confidence ?? 0.8,
      isVerified: false,
      parameterMappings: options?.parameterMappings,
      responseMapping: options?.responseMapping
    }

    this.toolMappings.set(catalogToolId, mapping)
    this.metrics.toolsMapped++

    return mapping
  }

  /**
   * Get tool mapping
   */
  getToolMapping(catalogToolId: string): MCPToolMapping | null {
    return this.toolMappings.get(catalogToolId) ?? null
  }

  /**
   * Verify tool mapping
   */
  async verifyToolMapping(catalogToolId: string): Promise<boolean> {
    const mapping = this.toolMappings.get(catalogToolId)
    if (!mapping) return false

    // Check if the MCP tool exists
    const availability = await this.checkMCPAvailability(catalogToolId)

    if (availability.isAvailable) {
      mapping.isVerified = true
      mapping.lastVerified = new Date().toISOString()
      return true
    }

    return false
  }

  // ============================================================================
  // HEALTH MONITORING
  // ============================================================================

  /**
   * Check server health
   */
  async checkServerHealth(serverId: string): Promise<MCPServerHealth> {
    const server = this.servers.get(serverId)
    if (!server) {
      throw new Error(`Server not found: ${serverId}`)
    }

    const startTime = Date.now()
    const issues: MCPHealthIssue[] = []

    try {
      // Simulate health check
      await new Promise((resolve, reject) => {
        setTimeout(resolve, 200)
        setTimeout(() => reject(new Error('Health check timeout')), MCP_TIMING_THRESHOLDS.healthCheckTimeout)
      })

      const responseTimeMs = Date.now() - startTime

      // Check response time
      if (responseTimeMs > 1000) {
        issues.push({
          severity: 'warning',
          code: 'SLOW_RESPONSE',
          message: 'Server response time is slow',
          since: new Date().toISOString()
        })
      }

      const health: MCPServerHealth = {
        serverId,
        provider: server.provider,
        isHealthy: issues.filter(i => i.severity === 'error' || i.severity === 'critical').length === 0,
        lastCheck: new Date().toISOString(),
        responseTimeMs,
        errorRate: 0,
        availableTools: this.discoveredTools.get(serverId)?.length ?? 0,
        activeConnections: Array.from(this.connections.values()).filter(c => c.serverId === serverId).length,
        issues: issues.length > 0 ? issues : undefined
      }

      this.serverHealth.set(serverId, health)
      return health
    } catch (error) {
      issues.push({
        severity: 'critical',
        code: 'UNREACHABLE',
        message: error instanceof Error ? error.message : 'Server unreachable',
        since: new Date().toISOString()
      })

      const health: MCPServerHealth = {
        serverId,
        provider: server.provider,
        isHealthy: false,
        lastCheck: new Date().toISOString(),
        responseTimeMs: Date.now() - startTime,
        errorRate: 1,
        availableTools: 0,
        activeConnections: 0,
        issues
      }

      this.serverHealth.set(serverId, health)
      return health
    }
  }

  /**
   * Get cached server health
   */
  getServerHealth(serverId: string): MCPServerHealth | null {
    return this.serverHealth.get(serverId) ?? null
  }

  /**
   * Validate a connection
   */
  async validateMCPConnection(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId)
    if (!connection) return false

    // Check state
    if (connection.state !== 'authenticated') return false

    // Check expiry
    if (connection.expiresAt && new Date(connection.expiresAt) <= new Date()) {
      connection.state = 'error'
      return false
    }

    // Check server health
    const health = await this.checkServerHealth(connection.serverId)
    return health.isHealthy
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Create a new MCP session
   */
  createSession(connectionId: string): MCPSession {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`)
    }

    const session: MCPSession = {
      id: generateId('mcp_sess'),
      connectionId,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      isActive: true,
      operationCount: 0,
      sessionCostUsd: 0,
      results: []
    }

    this.sessions.set(session.id, session)
    return session
  }

  /**
   * Get session
   */
  getSession(sessionId: string): MCPSession | null {
    return this.sessions.get(sessionId) ?? null
  }

  /**
   * Add result to session
   */
  addSessionResult(sessionId: string, result: MCPExecutionResult): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.results.push(result)
      session.operationCount++
      session.sessionCostUsd += result.costUsd
      session.lastActivityAt = new Date().toISOString()
    }
  }

  /**
   * End session
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.isActive = false
    }
  }

  // ============================================================================
  // METRICS
  // ============================================================================

  /**
   * Get current metrics
   */
  getMetrics(): MCPIntegrationMetrics {
    return { ...this.metrics }
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics()
  }

  /**
   * Update average connection time
   */
  private updateAvgConnectionTime(durationMs: number): void {
    const total = this.metrics.totalConnections
    const currentAvg = this.metrics.avgConnectionTimeMs
    this.metrics.avgConnectionTimeMs = (currentAvg * (total - 1) + durationMs) / total
  }

  /**
   * Update connection metrics
   */
  private updateConnectionMetrics(
    connection: MCPConnection,
    durationMs: number,
    _costUsd: number,
    success: boolean
  ): void {
    void durationMs
    void _costUsd
    connection.requestCount++
    connection.lastActivityAt = new Date().toISOString()

    if (!success) {
      connection.errorCount++
    }

    // Update average latency
    const totalRequests = connection.requestCount
    const currentAvg = connection.avgLatencyMs
    connection.avgLatencyMs = (currentAvg * (totalRequests - 1) + durationMs) / totalRequests
  }

  /**
   * Update execution metrics
   */
  private updateExecutionMetrics(result: MCPExecutionResult): void {
    this.metrics.totalExecutions++
    this.metrics.toolsExecuted++

    if (result.success) {
      this.metrics.successfulExecutions++
    } else {
      this.metrics.failedExecutions++
    }

    // Update average execution time
    const total = this.metrics.totalExecutions
    const currentAvg = this.metrics.avgExecutionTimeMs
    this.metrics.avgExecutionTimeMs = (currentAvg * (total - 1) + result.durationMs) / total

    // Update average cost per connection
    if (this.metrics.totalConnections > 0) {
      this.metrics.avgCostPerConnection = this.metrics.totalCostUsd / this.metrics.totalConnections
    }
  }

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  /**
   * Register connection change callback
   */
  onConnectionChanged(callback: (connection: MCPConnection) => void): void {
    this.onConnectionChange = callback
  }

  /**
   * Register tool discovered callback
   */
  onToolDiscoveredCallback(callback: (tool: MCPDiscoveredTool) => void): void {
    this.onToolDiscovered = callback
  }

  /**
   * Register cost warning callback
   */
  onCostWarningCallback(callback: (cost: number, threshold: number) => void): void {
    this.onCostWarning = callback
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Clean up stale connections
   */
  cleanupStaleConnections(maxAgeMs: number = 3600000): number {
    const now = Date.now()
    let cleaned = 0

    for (const [id, conn] of this.connections) {
      const lastActivity = new Date(conn.lastActivityAt).getTime()
      if (now - lastActivity > maxAgeMs) {
        this.closeConnection(id)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Clean up completed sessions
   */
  cleanupCompletedSessions(maxAgeMs: number = 3600000): number {
    const now = Date.now()
    let cleaned = 0

    for (const [id, session] of this.sessions) {
      if (!session.isActive) {
        const lastActivity = new Date(session.lastActivityAt).getTime()
        if (now - lastActivity > maxAgeMs) {
          this.sessions.delete(id)
          cleaned++
        }
      }
    }

    return cleaned
  }
}

// Export singleton instance
export const mcpServerIntegrationService = new MCPServerIntegrationService()

/**
 * ComposioClient - Real API execution via MCP Providers
 *
 * This client makes actual API calls to external services via multiple MCP providers:
 *
 * PROVIDERS:
 * - Rube MCP (https://rube.app/mcp) - OAuth-authenticated web access
 * - Composio MCP (https://mcp.composio.dev) - 500+ app integrations
 * - Google Cloud MCP (https://mcp.googleapis.com) - Native Google services (FREE for GCP customers)
 * - Zapier MCP (https://mcp.zapier.com) - 8,000+ apps, 30,000+ actions
 *
 * SERVICES SUPPORTED:
 * - Gmail, Google Calendar, Google Sheets, Google Drive, Google Docs
 * - Slack, Discord, Teams
 * - GitHub, Jira, Linear, Asana, Trello
 * - Salesforce, HubSpot, Intercom, Zendesk
 * - Stripe, Shopify, Airtable
 * - BigQuery, Compute Engine, Kubernetes (via Google Cloud MCP)
 * - And 8,000+ more via Zapier MCP
 *
 * The client handles:
 * - Session management across providers
 * - OAuth connection status
 * - Tool discovery and execution
 * - Provider-aware routing
 * - Error handling and retries
 */

export interface ComposioToolResult {
  success: boolean
  data?: unknown
  error?: string
  toolSlug: string
  executionTimeMs: number
}

export interface ComposioSession {
  id: string
  createdAt: Date
  lastUsedAt: Date
  connectedToolkits: string[]
}

export interface ComposioConnectionStatus {
  toolkit: string
  connected: boolean
  authUrl?: string
  expiresAt?: Date
}

// Tool slug mappings for common operations (verified from Rube/Composio)
export const TOOL_SLUGS = {
  // Email (Gmail)
  gmail: {
    send: 'GMAIL_SEND_EMAIL',
    fetch: 'GMAIL_FETCH_EMAILS',
    createDraft: 'GMAIL_CREATE_EMAIL_DRAFT',
    sendDraft: 'GMAIL_SEND_DRAFT',
    reply: 'GMAIL_REPLY_TO_THREAD',
    searchPeople: 'GMAIL_SEARCH_PEOPLE',
    getProfile: 'GMAIL_GET_PROFILE',
  },
  outlook: {
    send: 'OUTLOOK_SEND_EMAIL',
    fetch: 'OUTLOOK_FETCH_EMAILS',
  },

  // Calendar (Google) - verified from RUBE_SEARCH_TOOLS
  googleCalendar: {
    create: 'GOOGLECALENDAR_CREATE_EVENT',
    list: 'GOOGLECALENDAR_EVENTS_LIST',  // Correct slug (not LIST_EVENTS)
    update: 'GOOGLECALENDAR_UPDATE_EVENT',
    delete: 'GOOGLECALENDAR_DELETE_EVENT',
  },

  // Spreadsheets (Google) - correct slugs from Rube/Composio
  googleSheets: {
    read: 'GOOGLESHEETS_BATCH_GET',
    append: 'GOOGLESHEETS_BATCH_UPDATE',  // BATCH_UPDATE with no first_cell_location appends
    update: 'GOOGLESHEETS_BATCH_UPDATE',
    create: 'GOOGLESHEETS_CREATE_GOOGLE_SHEET1',
    upsert: 'GOOGLESHEETS_UPSERT_ROWS',
  },

  // Communication (Slack)
  slack: {
    send: 'SLACK_SEND_MESSAGE',
    findChannels: 'SLACK_FIND_CHANNELS',
    listChannels: 'SLACK_LIST_ALL_CHANNELS',
    getConversationInfo: 'SLACK_RETRIEVE_CONVERSATION_INFORMATION',
    fetchHistory: 'SLACK_FETCH_CONVERSATION_HISTORY',
  },

  // Development (GitHub)
  github: {
    createIssue: 'GITHUB_CREATE_ISSUE',
    listIssues: 'GITHUB_LIST_REPOSITORY_ISSUES',  // Correct slug (not LIST_ISSUES)
    createPR: 'GITHUB_CREATE_PULL_REQUEST',
    listPRs: 'GITHUB_LIST_PULL_REQUESTS',
    getRepo: 'GITHUB_GET_A_REPOSITORY',
  },

  // CRM (HubSpot) - Corrected slugs
  hubspot: {
    createContact: 'HUBSPOT_CREATE_CONTACT',
    searchContacts: 'HUBSPOT_SEARCH_CONTACTS_BY_CRITERIA',
    readContact: 'HUBSPOT_READ_CONTACT',
    listContacts: 'HUBSPOT_LIST_CONTACTS',
    searchObjects: 'HUBSPOT_SEARCH_CRM_OBJECTS_BY_CRITERIA',
    createDeal: 'HUBSPOT_CREATE_DEAL',
  },

  // E-commerce (Shopify) - Direct integration
  shopify: {
    // Triggers
    newOrderTrigger: 'SHOPIFY_NEW_ORDER_TRIGGER',
    orderPaidTrigger: 'SHOPIFY_ORDER_PAID_TRIGGER',
    orderFulfilledTrigger: 'SHOPIFY_ORDER_FULFILLED_TRIGGER',
    newCustomerTrigger: 'SHOPIFY_NEW_CUSTOMER_TRIGGER',
    // Actions
    getOrder: 'SHOPIFY_GET_ORDER',
    listOrders: 'SHOPIFY_LIST_ORDERS',
    createProduct: 'SHOPIFY_CREATE_PRODUCT',
    updateProduct: 'SHOPIFY_UPDATE_PRODUCT',
    getCustomer: 'SHOPIFY_GET_CUSTOMER',
    listCustomers: 'SHOPIFY_LIST_CUSTOMERS',
    updateInventory: 'SHOPIFY_UPDATE_INVENTORY',
    createFulfillment: 'SHOPIFY_CREATE_FULFILLMENT',
  },

  // E-commerce (Stripe) - Payment processing
  stripe: {
    // Triggers
    paymentReceivedTrigger: 'STRIPE_PAYMENT_RECEIVED_TRIGGER',
    subscriptionCreatedTrigger: 'STRIPE_SUBSCRIPTION_CREATED_TRIGGER',
    invoicePaidTrigger: 'STRIPE_INVOICE_PAID_TRIGGER',
    // Actions
    createPayment: 'STRIPE_CREATE_PAYMENT_INTENT',
    getPayment: 'STRIPE_GET_PAYMENT',
    createInvoice: 'STRIPE_CREATE_INVOICE',
    getCustomer: 'STRIPE_GET_CUSTOMER',
    createCustomer: 'STRIPE_CREATE_CUSTOMER',
  },

  // E-commerce (WooCommerce)
  woocommerce: {
    newOrderTrigger: 'WOOCOMMERCE_NEW_ORDER_TRIGGER',
    getOrder: 'WOOCOMMERCE_GET_ORDER',
    listOrders: 'WOOCOMMERCE_LIST_ORDERS',
    updateOrder: 'WOOCOMMERCE_UPDATE_ORDER',
  },

  // Forms (Typeform)
  typeform: {
    responseTrigger: 'TYPEFORM_RESPONSE_TRIGGER',
    getResponses: 'TYPEFORM_GET_RESPONSES',
    getForm: 'TYPEFORM_GET_FORM',
  },

  // Discord
  discord: {
    sendMessage: 'DISCORD_SEND_MESSAGE',
    sendEmbed: 'DISCORD_SEND_EMBED',
    getChannel: 'DISCORD_GET_CHANNEL',
  },

  // Notion
  notion: {
    createPage: 'NOTION_CREATE_PAGE',
    updatePage: 'NOTION_UPDATE_PAGE',
    queryDatabase: 'NOTION_QUERY_DATABASE',
    createDatabaseEntry: 'NOTION_CREATE_DATABASE_ENTRY',
  },

  // Google Cloud MCP - Native Google services (Dec 2025)
  googleCloud: {
    mapsSearch: 'GOOGLE_MAPS_SEARCH',
    mapsDirections: 'GOOGLE_MAPS_DIRECTIONS',
    bigQueryQuery: 'GOOGLE_BIGQUERY_QUERY',
    bigQueryInsert: 'GOOGLE_BIGQUERY_INSERT',
    computeList: 'GOOGLE_COMPUTE_LIST_INSTANCES',
    computeCreate: 'GOOGLE_COMPUTE_CREATE_INSTANCE',
    k8sList: 'GOOGLE_KUBERNETES_LIST_CLUSTERS',
    k8sDeploy: 'GOOGLE_KUBERNETES_DEPLOY',
    driveList: 'GOOGLE_DRIVE_LIST_FILES',
    driveUpload: 'GOOGLE_DRIVE_UPLOAD',
    docsCreate: 'GOOGLE_DOCS_CREATE',
    gmailNative: 'GOOGLE_GMAIL_SEND',
    calendarNative: 'GOOGLE_CALENDAR_CREATE',
    sheetsNative: 'GOOGLE_SHEETS_APPEND',
  },

  // Zapier MCP - 8,000+ apps, 30,000+ actions (Dec 2025)
  zapier: {
    // Core Zapier
    searchApps: 'ZAPIER_SEARCH_APPS',
    executeAction: 'ZAPIER_EXECUTE_ACTION',
    createZap: 'ZAPIER_CREATE_ZAP',
    listZaps: 'ZAPIER_LIST_ZAPS',
    // Popular integrations via Zapier
    airtableCreate: 'ZAPIER_AIRTABLE_CREATE_RECORD',
    hubspotContact: 'ZAPIER_HUBSPOT_CREATE_CONTACT',
    salesforceLead: 'ZAPIER_SALESFORCE_CREATE_LEAD',
    stripeInvoice: 'ZAPIER_STRIPE_CREATE_INVOICE',
    mailchimpSubscribe: 'ZAPIER_MAILCHIMP_ADD_SUBSCRIBER',
    jiraIssue: 'ZAPIER_JIRA_CREATE_ISSUE',
    asanaTask: 'ZAPIER_ASANA_CREATE_TASK',
    trelloCard: 'ZAPIER_TRELLO_CREATE_CARD',
    intercomMessage: 'ZAPIER_INTERCOM_SEND_MESSAGE',
    zendeskTicket: 'ZAPIER_ZENDESK_CREATE_TICKET',
    shopifyOrder: 'ZAPIER_SHOPIFY_CREATE_ORDER',
    typeformResponses: 'ZAPIER_TYPEFORM_GET_RESPONSES',
    twilioSms: 'ZAPIER_TWILIO_SEND_SMS',
    sendgridEmail: 'ZAPIER_SENDGRID_SEND_EMAIL',
  },
} as const

// Error types for better handling
export type ComposioErrorCode =
  | 'NOT_INITIALIZED'
  | 'NOT_CONNECTED'
  | 'AUTH_REQUIRED'
  | 'RATE_LIMITED'
  | 'INVALID_PARAMS'
  | 'TOOL_NOT_FOUND'
  | 'EXECUTION_FAILED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'DEMO_MODE'

export interface ComposioError {
  code: ComposioErrorCode
  message: string
  details?: string
  isRetryable: boolean
  suggestedAction?: string
}

/**
 * Parse and classify errors from Composio API responses
 */
function classifyError(response: Response, data: Record<string, unknown>): ComposioError {
  const errorMessage = (data.error as string) || `HTTP ${response.status}`

  // Auth errors
  if (response.status === 401 || errorMessage.toLowerCase().includes('auth')) {
    return {
      code: 'AUTH_REQUIRED',
      message: 'Authentication required',
      details: errorMessage,
      isRetryable: false,
      suggestedAction: 'Connect your account first',
    }
  }

  // Rate limiting
  if (response.status === 429 || errorMessage.toLowerCase().includes('rate')) {
    return {
      code: 'RATE_LIMITED',
      message: 'Too many requests',
      details: errorMessage,
      isRetryable: true,
      suggestedAction: 'Wait a moment and try again',
    }
  }

  // Invalid params
  if (response.status === 400) {
    return {
      code: 'INVALID_PARAMS',
      message: 'Invalid parameters',
      details: errorMessage,
      isRetryable: false,
      suggestedAction: 'Check the input values',
    }
  }

  // Not found
  if (response.status === 404) {
    return {
      code: 'TOOL_NOT_FOUND',
      message: 'Tool or resource not found',
      details: errorMessage,
      isRetryable: false,
    }
  }

  // Server errors
  if (response.status >= 500) {
    return {
      code: 'SERVER_ERROR',
      message: 'Server error',
      details: errorMessage,
      isRetryable: true,
      suggestedAction: 'Try again in a few seconds',
    }
  }

  // Demo mode
  if (data.isDemoMode || data.demoMode) {
    return {
      code: 'DEMO_MODE',
      message: 'Running in demo mode',
      details: 'API key not configured',
      isRetryable: false,
      suggestedAction: 'Configure COMPOSIO_API_KEY in environment',
    }
  }

  // Generic execution failure
  return {
    code: 'EXECUTION_FAILED',
    message: errorMessage,
    isRetryable: false,
  }
}

/**
 * Composio API Client for real tool execution
 */
class ComposioClientClass {
  private sessionId: string | null = null
  private connectedToolkits: Set<string> = new Set()
  private pendingConnections: Map<string, string> = new Map() // toolkit -> authUrl
  private serverBaseUrl = '/api/composio'
  private _isInitialized = false
  private _isDemoMode = false
  private _lastError: ComposioError | null = null
  private retryDelays = [1000, 2000, 5000] // Progressive retry delays

  /**
   * Initialize session and check connections
   */
  async initialize(): Promise<ComposioSession> {
    console.log('[ComposioClient] Initializing session...')

    try {
      // Call server to initialize Composio session
      const response = await fetch(`${this.serverBaseUrl}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to initialize session: ${response.status}`)
      }

      const data = await response.json()
      this.sessionId = data.sessionId
      this.connectedToolkits = new Set(data.connectedToolkits || [])
      this._isInitialized = true
      this._isDemoMode = data.isDemoMode ?? false

      console.log('[ComposioClient] Session initialized:', this.sessionId)
      console.log('[ComposioClient] Connected toolkits:', Array.from(this.connectedToolkits))
      console.log('[ComposioClient] Demo mode:', this._isDemoMode)

      return {
        id: this.sessionId!,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        connectedToolkits: Array.from(this.connectedToolkits),
      }
    } catch (error) {
      console.error('[ComposioClient] Initialization failed:', error)
      // Return fallback session for offline/demo mode
      this.sessionId = `demo_${Date.now()}`
      this._isInitialized = true
      this._isDemoMode = true
      this._lastError = {
        code: 'NETWORK_ERROR',
        message: 'Could not connect to Composio service',
        details: error instanceof Error ? error.message : undefined,
        isRetryable: true,
        suggestedAction: 'Check if the server is running',
      }
      return {
        id: this.sessionId!,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        connectedToolkits: [],
      }
    }
  }

  /**
   * Check if a toolkit is connected (has valid OAuth)
   */
  async checkConnection(toolkit: string): Promise<ComposioConnectionStatus> {
    console.log(`[ComposioClient] Checking connection for: ${toolkit}`)

    try {
      const response = await fetch(`${this.serverBaseUrl}/connection/${encodeURIComponent(toolkit)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId || '',
        },
      })

      const data = await response.json()

      if (data.connected) {
        this.connectedToolkits.add(toolkit)
      }

      return {
        toolkit,
        connected: data.connected,
        authUrl: data.authUrl,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      }
    } catch (error) {
      console.error(`[ComposioClient] Connection check failed for ${toolkit}:`, error)
      return {
        toolkit,
        connected: false,
      }
    }
  }

  /**
   * Initiate OAuth connection for a toolkit
   */
  async initiateConnection(toolkit: string): Promise<{ authUrl: string } | { error: string }> {
    console.log(`[ComposioClient] Initiating connection for: ${toolkit}`)

    try {
      const response = await fetch(`${this.serverBaseUrl}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId || '',
        },
        body: JSON.stringify({ toolkit }),
      })

      const data = await response.json()

      if (data.authUrl) {
        this.pendingConnections.set(toolkit, data.authUrl)
        return { authUrl: data.authUrl }
      }

      return { error: data.error || 'Failed to get auth URL' }
    } catch (error) {
      console.error(`[ComposioClient] Connection initiation failed for ${toolkit}:`, error)
      return { error: String(error) }
    }
  }

  /**
   * Execute a Composio tool with real API call
   * Includes automatic retry for transient failures
   */
  async executeTool(
    toolSlug: string,
    params: Record<string, unknown>,
    options?: { maxRetries?: number; timeout?: number }
  ): Promise<ComposioToolResult> {
    const startTime = Date.now()
    const maxRetries = options?.maxRetries ?? 2
    const timeout = options?.timeout ?? 30000 // 30 second default timeout

    console.log(`[ComposioClient] Executing tool: ${toolSlug}`, params)

    // Ensure initialized
    if (!this._isInitialized) {
      await this.initialize()
    }

    let lastError: ComposioError | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(`${this.serverBaseUrl}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': this.sessionId || '',
          },
          body: JSON.stringify({
            toolSlug,
            params,
            sessionId: this.sessionId,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const data = await response.json()

        // Check for errors that need handling
        if (!response.ok || data.success === false) {
          lastError = classifyError(response, data)
          this._lastError = lastError

          // Only retry if the error is retryable
          if (lastError.isRetryable && attempt < maxRetries) {
            console.log(`[ComposioClient] Retrying ${toolSlug} (attempt ${attempt + 1}/${maxRetries})...`)
            await new Promise(resolve => setTimeout(resolve, this.retryDelays[attempt] || 2000))
            continue
          }

          // Non-retryable error or max retries reached
          return {
            success: false,
            error: `${lastError.message}${lastError.suggestedAction ? ` - ${lastError.suggestedAction}` : ''}`,
            toolSlug,
            executionTimeMs: Date.now() - startTime,
          }
        }

        // Success
        this._lastError = null
        return {
          success: true,
          data: data.data,
          toolSlug,
          executionTimeMs: Date.now() - startTime,
        }
      } catch (error) {
        console.error(`[ComposioClient] Tool execution failed (attempt ${attempt + 1}):`, error)

        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = {
            code: 'NETWORK_ERROR',
            message: 'Request timed out',
            details: `Timeout after ${timeout}ms`,
            isRetryable: true,
            suggestedAction: 'Check your connection and try again',
          }
        } else {
          lastError = {
            code: 'NETWORK_ERROR',
            message: error instanceof Error ? error.message : 'Network error',
            isRetryable: true,
            suggestedAction: 'Check your internet connection',
          }
        }

        this._lastError = lastError

        // Retry on network errors
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelays[attempt] || 2000))
          continue
        }
      }
    }

    // All retries exhausted
    return {
      success: false,
      error: lastError?.message || 'Execution failed after retries',
      toolSlug,
      executionTimeMs: Date.now() - startTime,
    }
  }

  /**
   * Get the last error that occurred
   */
  get lastError(): ComposioError | null {
    return this._lastError
  }

  /**
   * Check if running in demo mode
   */
  get isDemoMode(): boolean {
    return this._isDemoMode
  }

  /**
   * Execute multiple tools in parallel
   */
  async executeMultipleTools(
    tools: Array<{ toolSlug: string; params: Record<string, unknown> }>
  ): Promise<ComposioToolResult[]> {
    console.log(`[ComposioClient] Executing ${tools.length} tools in parallel`)

    const results = await Promise.all(
      tools.map(tool => this.executeTool(tool.toolSlug, tool.params))
    )

    return results
  }

  // ==========================================================================
  // Convenience methods for common operations
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
    isHtml?: boolean
  }): Promise<ComposioToolResult> {
    return this.executeTool(TOOL_SLUGS.gmail.send, {
      recipient_email: params.to,
      subject: params.subject,
      body: params.body,
      cc: params.cc || [],
      bcc: params.bcc || [],
      is_html: params.isHtml || false,
    })
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
    location?: string
  }): Promise<ComposioToolResult> {
    return this.executeTool(TOOL_SLUGS.googleCalendar.create, {
      summary: params.title,
      start_datetime: params.startTime,
      end_datetime: params.endTime,
      description: params.description,
      attendees: params.attendees?.map(email => ({ email })),
      location: params.location,
    })
  }

  /**
   * Send a Slack message
   */
  async sendSlackMessage(params: {
    channel: string
    text: string
    threadTs?: string
  }): Promise<ComposioToolResult> {
    return this.executeTool(TOOL_SLUGS.slack.send, {
      channel: params.channel,
      text: params.text,
      thread_ts: params.threadTs,
    })
  }

  /**
   * Create a GitHub issue
   */
  async createGitHubIssue(params: {
    owner: string
    repo: string
    title: string
    body: string
    labels?: string[]
  }): Promise<ComposioToolResult> {
    return this.executeTool(TOOL_SLUGS.github.createIssue, {
      owner: params.owner,
      repo: params.repo,
      title: params.title,
      body: params.body,
      labels: params.labels,
    })
  }

  /**
   * Read data from Google Sheets
   */
  async readSpreadsheet(params: {
    spreadsheetId: string
    range: string
  }): Promise<ComposioToolResult> {
    return this.executeTool(TOOL_SLUGS.googleSheets.read, {
      spreadsheet_id: params.spreadsheetId,
      range: params.range,
    })
  }

  /**
   * Append data to Google Sheets
   */
  async appendToSpreadsheet(params: {
    spreadsheetId: string
    range: string
    values: unknown[][]
  }): Promise<ComposioToolResult> {
    return this.executeTool(TOOL_SLUGS.googleSheets.append, {
      spreadsheet_id: params.spreadsheetId,
      range: params.range,
      values: params.values,
    })
  }

  /**
   * Get session status
   */
  get isInitialized(): boolean {
    return this._isInitialized
  }

  get currentSessionId(): string | null {
    return this.sessionId
  }

  get availableToolkits(): string[] {
    return Array.from(this.connectedToolkits)
  }

  // ==========================================================================
  // Tool Discovery and Listing
  // ==========================================================================

  /**
   * List available tools from connected apps
   */
  async listTools(apps?: string[]): Promise<{
    success: boolean
    tools: Array<{
      slug: string
      name: string
      description: string
      app: string
    }>
    error?: string
  }> {
    console.log('[ComposioClient] Fetching available tools...')

    try {
      const queryString = apps?.length ? `?apps=${apps.join(',')}` : ''
      const response = await fetch(`${this.serverBaseUrl}/tools${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId || '',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          tools: [],
          error: data.error || `HTTP ${response.status}`,
        }
      }

      return {
        success: true,
        tools: data.tools || [],
      }
    } catch (error) {
      console.error('[ComposioClient] Failed to list tools:', error)
      return {
        success: false,
        tools: [],
        error: error instanceof Error ? error.message : 'Failed to list tools',
      }
    }
  }

  /**
   * Get the service status including API key configuration
   */
  async getStatus(): Promise<{
    initialized: boolean
    isDemoMode: boolean
    connectedApps: string[]
    apiKeyConfigured: boolean
  }> {
    try {
      const response = await fetch(`${this.serverBaseUrl}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      return {
        initialized: data.initialized ?? false,
        isDemoMode: data.isDemoMode ?? true,
        connectedApps: data.connectedApps ?? [],
        apiKeyConfigured: data.apiKeyConfigured ?? false,
      }
    } catch (error) {
      console.error('[ComposioClient] Failed to get status:', error)
      return {
        initialized: false,
        isDemoMode: true,
        connectedApps: [],
        apiKeyConfigured: false,
      }
    }
  }

  // ==========================================================================
  // Per-User Connection Methods (for user-specific OAuth)
  // ==========================================================================

  /**
   * Get connection status for apps for a specific user
   */
  async getUserApps(userId: string): Promise<{
    success: boolean
    apps: Array<{
      id: string
      name: string
      connected: boolean
    }>
    connectedCount: number
  }> {
    try {
      const response = await fetch(`${this.serverBaseUrl}/user/${encodeURIComponent(userId)}/apps`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      return {
        success: data.success ?? false,
        apps: data.apps ?? [],
        connectedCount: data.connectedCount ?? 0,
      }
    } catch (error) {
      console.error('[ComposioClient] Failed to get user apps:', error)
      return {
        success: false,
        apps: [],
        connectedCount: 0,
      }
    }
  }

  /**
   * Initiate OAuth connection for a user and specific app
   */
  async connectUserApp(
    userId: string,
    appId: string,
    callbackUrl?: string
  ): Promise<{ authUrl?: string; error?: string }> {
    try {
      const response = await fetch(`${this.serverBaseUrl}/user/${encodeURIComponent(userId)}/connect/${encodeURIComponent(appId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callbackUrl }),
      })

      const data = await response.json()

      if (data.success && data.authUrl) {
        return { authUrl: data.authUrl }
      }

      return { error: data.error || 'Failed to initiate connection' }
    } catch (error) {
      console.error('[ComposioClient] Failed to connect user app:', error)
      return { error: error instanceof Error ? error.message : 'Connection failed' }
    }
  }

  /**
   * Disconnect an app for a specific user
   */
  async disconnectUserApp(userId: string, appId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.serverBaseUrl}/user/${encodeURIComponent(userId)}/disconnect/${encodeURIComponent(appId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      return {
        success: data.success ?? false,
        error: data.error,
      }
    } catch (error) {
      console.error('[ComposioClient] Failed to disconnect user app:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnect failed',
      }
    }
  }

  /**
   * Execute a tool for a specific user (uses their OAuth tokens)
   */
  async executeToolForUser(
    userId: string,
    toolSlug: string,
    params: Record<string, unknown>
  ): Promise<ComposioToolResult> {
    const startTime = Date.now()
    console.log(`[ComposioClient] Executing ${toolSlug} for user ${userId}`)

    try {
      const response = await fetch(`${this.serverBaseUrl}/user/${encodeURIComponent(userId)}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolSlug, params }),
      })

      const data = await response.json()

      return {
        success: data.success ?? false,
        data: data.data,
        error: data.error,
        toolSlug,
        executionTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      console.error('[ComposioClient] User tool execution failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        toolSlug,
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  // ==========================================================================
  // Batch Execution
  // ==========================================================================

  /**
   * Execute multiple tools in a batch via server (more efficient than parallel client calls)
   */
  async executeBatch(
    tools: Array<{ toolSlug: string; params: Record<string, unknown> }>
  ): Promise<{
    success: boolean
    results: ComposioToolResult[]
    successCount: number
    failureCount: number
  }> {
    console.log(`[ComposioClient] Executing batch of ${tools.length} tools`)

    try {
      const response = await fetch(`${this.serverBaseUrl}/execute-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId || '',
        },
        body: JSON.stringify({ tools }),
      })

      const data = await response.json()

      return {
        success: data.success ?? false,
        results: data.results ?? [],
        successCount: data.successCount ?? 0,
        failureCount: data.failureCount ?? 0,
      }
    } catch (error) {
      console.error('[ComposioClient] Batch execution failed:', error)
      return {
        success: false,
        results: [],
        successCount: 0,
        failureCount: tools.length,
      }
    }
  }
}

// Export singleton instance
export const composioClient = new ComposioClientClass()

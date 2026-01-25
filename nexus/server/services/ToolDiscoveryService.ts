/**
 * ToolDiscoveryService - Smart App/Tool Discovery with Gap Analysis
 *
 * This service handles the critical "What CRM do you use?" flow:
 * 1. User mentions an app (e.g., "Pipeline CRM", "Odoo", "Wave")
 * 2. We search Composio for native support
 * 3. We analyze what actions ARE and AREN'T available
 * 4. We provide alternatives if tool isn't supported
 *
 * This prevents users from hitting dead-ends when they mention obscure tools.
 */

import { composioService } from './ComposioService'
import { customIntegrationService } from './CustomIntegrationService'

// Common action types that users typically need
export const COMMON_ACTIONS = {
  CRM: ['create_contact', 'update_contact', 'list_contacts', 'create_deal', 'list_deals', 'create_company'],
  ACCOUNTING: ['create_invoice', 'list_invoices', 'create_payment', 'list_customers', 'get_balance'],
  POS: ['list_orders', 'get_order', 'list_products', 'list_customers', 'get_sales'],
  ERP: ['create_purchase_order', 'list_inventory', 'create_invoice', 'manage_suppliers'],
  PROJECT: ['create_task', 'list_tasks', 'create_project', 'assign_user'],
  COMMUNICATION: ['send_message', 'list_messages', 'create_channel'],
  STORAGE: ['upload_file', 'list_files', 'download_file', 'share_file'],
  CALENDAR: ['create_event', 'list_events', 'update_event'],
  EMAIL: ['send_email', 'list_emails', 'search_emails'],
}

// Tool categories for better matching
export type ToolCategory = keyof typeof COMMON_ACTIONS

// Alternative suggestions when tool isn't supported
export const ALTERNATIVES: Record<string, { supported: string[]; reason: string }> = {
  // CRMs
  'freshsales': { supported: ['hubspot', 'salesforce', 'zoho', 'pipedrive'], reason: 'No native Freshsales integration' },
  'copper': { supported: ['hubspot', 'salesforce', 'zoho'], reason: 'No native Copper CRM integration' },
  'close': { supported: ['hubspot', 'salesforce', 'pipedrive'], reason: 'No native Close.io integration' },
  'insightly': { supported: ['hubspot', 'salesforce', 'zoho'], reason: 'No native Insightly integration' },

  // Accounting
  'wave': { supported: ['zoho_books', 'xero', 'quickbooks'], reason: 'No native Wave integration' },
  'freshbooks': { supported: ['zoho_books', 'xero', 'quickbooks'], reason: 'No native FreshBooks integration' },
  'sage': { supported: ['xero', 'quickbooks', 'zoho_books'], reason: 'No native Sage integration' },

  // POS
  'lightspeed': { supported: ['square', 'shopify'], reason: 'No native Lightspeed POS integration' },
  'toast': { supported: ['square'], reason: 'No native Toast POS integration' },
  'clover': { supported: ['square', 'stripe'], reason: 'No native Clover integration' },

  // ERP
  'odoo': { supported: ['browser_tool'], reason: 'No native Odoo integration - browser automation available' },
  'sap': { supported: ['browser_tool'], reason: 'No native SAP integration - browser automation available' },
  'netsuite': { supported: ['browser_tool'], reason: 'No native NetSuite integration - browser automation available' },

  // Kuwait-specific (future consideration)
  'knet': { supported: ['stripe', 'tap_payments'], reason: 'KNET requires custom integration - Tap Payments supports KNET' },
}

// Tool alias mapping (what users say -> what Composio calls it)
export const TOOL_ALIASES: Record<string, string> = {
  'pipeline': 'pipeline_crm',
  'pipeline crm': 'pipeline_crm',
  'pipelinecrm': 'pipeline_crm',
  'zoho': 'zoho',
  'zoho crm': 'zoho',
  'zoho books': 'zoho_books',
  'zohobooks': 'zoho_books',
  'xero': 'xero',
  'quickbooks': 'quickbooks',
  'qbo': 'quickbooks',
  'square': 'square',
  'squarepos': 'square',
  'square pos': 'square',
  'hubspot': 'hubspot',
  'salesforce': 'salesforce',
  'sfdc': 'salesforce',
  'pipedrive': 'pipedrive',
  'gmail': 'gmail',
  'google mail': 'gmail',
  'slack': 'slack',
  'github': 'github',
  'gh': 'github',
  'notion': 'notion',
  'trello': 'trello',
  'asana': 'asana',
  'linear': 'linear',
  'jira': 'jira',
  'monday': 'monday',
  'monday.com': 'monday',
  'airtable': 'airtable',
  'google sheets': 'googlesheets',
  'gsheets': 'googlesheets',
  'google calendar': 'googlecalendar',
  'gcal': 'googlecalendar',
  'discord': 'discord',
  'stripe': 'stripe',
  'shopify': 'shopify',
  'woocommerce': 'woocommerce',
  'wordpress': 'wordpress',
  'mailchimp': 'mailchimp',
  'sendgrid': 'sendgrid',
  'twilio': 'twilio',
  'whatsapp': 'whatsapp',
  'telegram': 'telegram',
  'zendesk': 'zendesk',
  'intercom': 'intercom',
  'freshdesk': 'freshdesk',
  'clickup': 'clickup',
  'dropbox': 'dropbox',
  'google drive': 'googledrive',
  'gdrive': 'googledrive',
  'onedrive': 'onedrive',
  'box': 'box',
}

export interface ToolDiscoveryResult {
  // Basic info
  toolName: string
  normalizedName: string
  supported: boolean
  supportLevel: 'full' | 'partial' | 'browser_only' | 'none'

  // Available actions
  availableActions: string[]
  actionCount: number

  // Gap analysis
  missingActions: string[]
  gapAnalysis: string | null

  // Connection info
  requiresAuth: boolean
  authType: 'oauth' | 'api_key' | 'browser' | 'unknown'
  authUrl?: string
  isConnected?: boolean

  // Alternatives (if not fully supported)
  alternatives?: {
    tool: string
    reason: string
  }[]

  // Category detection
  category: ToolCategory | 'unknown'

  // Custom integration (for unsupported apps with known API docs)
  customIntegration?: {
    available: boolean
    displayName: string
    apiDocsUrl: string
    apiKeyUrl?: string
    steps: string[]
    keyHint: string
  }

  // Raw data for debugging
  rawToolkitData?: unknown
}

export interface DiscoveryOptions {
  checkConnection?: boolean
  includeAlternatives?: boolean
  userId?: string
}

/**
 * ToolDiscoveryService - Handles smart tool discovery with gap analysis
 */
class ToolDiscoveryServiceClass {
  private discoveryCache: Map<string, { result: ToolDiscoveryResult; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Discover a tool by name with full gap analysis
   */
  async discoverTool(
    toolName: string,
    options: DiscoveryOptions = {}
  ): Promise<ToolDiscoveryResult> {
    const { checkConnection = true, includeAlternatives = true, userId = 'default' } = options

    // Normalize tool name
    const normalizedName = this.normalizeToolName(toolName)

    // Check cache
    const cached = this.discoveryCache.get(normalizedName)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`[ToolDiscovery] Using cached result for: ${normalizedName}`)
      return cached.result
    }

    console.log(`[ToolDiscovery] Discovering tool: "${toolName}" -> normalized: "${normalizedName}"`)

    // Detect category from tool name
    const category = this.detectCategory(toolName)

    // Check if we know this tool isn't supported
    const knownUnsupported = ALTERNATIVES[normalizedName.toLowerCase()]
    if (knownUnsupported) {
      console.log(`[ToolDiscovery] Known unsupported tool: ${normalizedName}`)
      const result = this.createUnsupportedResult(
        toolName,
        normalizedName,
        category,
        knownUnsupported,
        includeAlternatives
      )
      this.cacheResult(normalizedName, result)
      return result
    }

    // Search Composio for the tool
    const composioResult = await this.searchComposioForTool(normalizedName)

    if (!composioResult.found) {
      console.log(`[ToolDiscovery] Tool not found in Composio: ${normalizedName}`)

      // Check if we have custom integration info for this app
      const customIntegrationInfo = customIntegrationService.getAppAPIInfo(normalizedName)
      let customIntegration: ToolDiscoveryResult['customIntegration'] = undefined

      if (customIntegrationInfo) {
        console.log(`[ToolDiscovery] Custom integration available for: ${normalizedName}`)
        customIntegration = {
          available: true,
          displayName: customIntegrationInfo.displayName,
          apiDocsUrl: customIntegrationInfo.apiDocsUrl,
          apiKeyUrl: customIntegrationInfo.apiKeyUrl,
          steps: customIntegrationInfo.setupSteps,
          keyHint: customIntegrationInfo.keyHint,
        }
      }

      // Create unsupported result with generic alternatives
      const result: ToolDiscoveryResult = {
        toolName,
        normalizedName,
        supported: false,
        supportLevel: 'none',
        availableActions: [],
        actionCount: 0,
        missingActions: COMMON_ACTIONS[category] || [],
        gapAnalysis: customIntegration
          ? `No native integration for ${toolName}, but you can connect it with your API key.`
          : `No native integration available for ${toolName}. You may need a custom API integration or browser automation.`,
        requiresAuth: false,
        authType: customIntegration ? 'api_key' : 'unknown',
        category,
        alternatives: includeAlternatives ? this.getSuggestedAlternatives(category) : undefined,
        customIntegration,
      }

      this.cacheResult(normalizedName, result)
      return result
    }

    // Parse Composio results
    const availableActions = composioResult.tools.map((t: string) => t.toLowerCase())
    const expectedActions = COMMON_ACTIONS[category] || []
    const missingActions = expectedActions.filter(
      (action) => !availableActions.some((available) => available.includes(action))
    )

    // Determine support level
    let supportLevel: 'full' | 'partial' | 'browser_only' | 'none'
    if (composioResult.tools.length === 0) {
      supportLevel = 'none'
    } else if (missingActions.length === 0) {
      supportLevel = 'full'
    } else if (missingActions.length < expectedActions.length / 2) {
      supportLevel = 'full' // More than half supported = full
    } else {
      supportLevel = 'partial'
    }

    // Check connection status if requested
    let isConnected = false
    let authUrl: string | undefined

    if (checkConnection && composioService.initialized) {
      const connectionStatus = await composioService.checkConnection(normalizedName)
      isConnected = connectionStatus.connected

      if (!isConnected) {
        const authResult = await composioService.initiateConnection(normalizedName)
        authUrl = authResult.authUrl
      }
    }

    // Build gap analysis message
    let gapAnalysis: string | null = null
    if (missingActions.length > 0) {
      gapAnalysis = `${toolName} supports ${availableActions.length} actions but is missing: ${missingActions.join(', ')}. ` +
        `You can still use the ${availableActions.length} available actions for your workflow.`
    }

    const result: ToolDiscoveryResult = {
      toolName,
      normalizedName,
      supported: supportLevel !== 'none',
      supportLevel,
      availableActions,
      actionCount: availableActions.length,
      missingActions,
      gapAnalysis,
      requiresAuth: true,
      authType: 'oauth',
      authUrl,
      isConnected,
      category,
      alternatives: supportLevel === 'partial' && includeAlternatives
        ? this.getSuggestedAlternatives(category)
        : undefined,
      rawToolkitData: composioResult.rawData,
    }

    this.cacheResult(normalizedName, result)
    return result
  }

  /**
   * Discover multiple tools at once
   */
  async discoverMultipleTools(
    toolNames: string[],
    options: DiscoveryOptions = {}
  ): Promise<ToolDiscoveryResult[]> {
    return Promise.all(toolNames.map((name) => this.discoverTool(name, options)))
  }

  /**
   * Normalize tool name to Composio format
   */
  private normalizeToolName(toolName: string): string {
    const lowered = toolName.toLowerCase().trim()

    // Check alias mapping first
    if (TOOL_ALIASES[lowered]) {
      return TOOL_ALIASES[lowered]
    }

    // Remove common suffixes
    const cleaned = lowered
      .replace(/\s+(crm|erp|pos|accounting|software|app|tool)$/i, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')

    return cleaned
  }

  /**
   * Detect tool category from name
   */
  private detectCategory(toolName: string): ToolCategory | 'unknown' {
    const lowered = toolName.toLowerCase()

    // CRM indicators
    if (/crm|customer|sales|pipeline|lead|contact|deal/i.test(lowered)) {
      return 'CRM'
    }

    // Accounting indicators
    if (/accounting|invoice|books|financial|quickbooks|xero|zoho books|wave/i.test(lowered)) {
      return 'ACCOUNTING'
    }

    // POS indicators
    if (/pos|point of sale|square|toast|clover|lightspeed|retail/i.test(lowered)) {
      return 'POS'
    }

    // ERP indicators
    if (/erp|odoo|sap|netsuite|oracle|enterprise/i.test(lowered)) {
      return 'ERP'
    }

    // Project management indicators
    if (/project|task|asana|trello|monday|jira|linear|clickup/i.test(lowered)) {
      return 'PROJECT'
    }

    // Communication indicators
    if (/slack|discord|teams|chat|message/i.test(lowered)) {
      return 'COMMUNICATION'
    }

    // Storage indicators
    if (/drive|dropbox|storage|file|box|onedrive/i.test(lowered)) {
      return 'STORAGE'
    }

    // Calendar indicators
    if (/calendar|event|meeting|schedule/i.test(lowered)) {
      return 'CALENDAR'
    }

    // Email indicators
    if (/email|mail|gmail|outlook|sendgrid/i.test(lowered)) {
      return 'EMAIL'
    }

    return 'unknown'
  }

  /**
   * Search Composio for a tool
   */
  private async searchComposioForTool(
    toolName: string
  ): Promise<{ found: boolean; tools: string[]; rawData?: unknown }> {
    try {
      // Check if composio is initialized
      if (!composioService.initialized) {
        const apiKey = process.env.COMPOSIO_API_KEY
        if (apiKey) {
          await composioService.initialize(apiKey)
        }
      }

      // Use Composio to get available tools for this toolkit
      const toolkitActions = await composioService.getToolkitActions(toolName)

      if (toolkitActions.length > 0) {
        return {
          found: true,
          tools: toolkitActions,
          rawData: toolkitActions,
        }
      }

      return { found: false, tools: [] }
    } catch (error) {
      console.log(`[ToolDiscovery] Composio search error for ${toolName}:`, error)
      return { found: false, tools: [] }
    }
  }

  /**
   * Create result for known unsupported tools
   */
  private createUnsupportedResult(
    toolName: string,
    normalizedName: string,
    category: ToolCategory | 'unknown',
    knownInfo: { supported: string[]; reason: string },
    includeAlternatives: boolean
  ): ToolDiscoveryResult {
    const isBrowserOnly = knownInfo.supported.includes('browser_tool')

    // Check if we have custom integration info for this app
    const customIntegrationInfo = customIntegrationService.getAppAPIInfo(normalizedName)
    let customIntegration: ToolDiscoveryResult['customIntegration'] = undefined

    if (customIntegrationInfo) {
      customIntegration = {
        available: true,
        displayName: customIntegrationInfo.displayName,
        apiDocsUrl: customIntegrationInfo.apiDocsUrl,
        apiKeyUrl: customIntegrationInfo.apiKeyUrl,
        steps: customIntegrationInfo.setupSteps,
        keyHint: customIntegrationInfo.keyHint,
      }
    }

    return {
      toolName,
      normalizedName,
      supported: isBrowserOnly,
      supportLevel: isBrowserOnly ? 'browser_only' : 'none',
      availableActions: isBrowserOnly ? ['browser_automation'] : [],
      actionCount: isBrowserOnly ? 1 : 0,
      missingActions: COMMON_ACTIONS[category] || [],
      gapAnalysis: customIntegration
        ? `${knownInfo.reason} You can connect ${toolName} with your API key for direct integration.`
        : knownInfo.reason + (isBrowserOnly
          ? ' Browser automation can interact with the web UI but is less reliable than native integrations.'
          : ' Consider using one of the supported alternatives.'),
      requiresAuth: !isBrowserOnly,
      authType: customIntegration ? 'api_key' : (isBrowserOnly ? 'browser' : 'unknown'),
      category,
      alternatives: includeAlternatives
        ? knownInfo.supported
            .filter((s) => s !== 'browser_tool')
            .map((tool) => ({
              tool,
              reason: `Fully supported with native OAuth integration`,
            }))
        : undefined,
      customIntegration,
    }
  }

  /**
   * Get suggested alternatives for a category
   */
  private getSuggestedAlternatives(
    category: ToolCategory | 'unknown'
  ): { tool: string; reason: string }[] {
    const suggestions: Record<ToolCategory, { tool: string; reason: string }[]> = {
      CRM: [
        { tool: 'hubspot', reason: 'Full CRM integration with contacts, deals, companies' },
        { tool: 'salesforce', reason: 'Enterprise CRM with comprehensive API' },
        { tool: 'pipedrive', reason: 'Sales pipeline focused CRM' },
      ],
      ACCOUNTING: [
        { tool: 'zoho_books', reason: 'Full accounting with invoices, payments, contacts' },
        { tool: 'xero', reason: 'SMB accounting with strong API support' },
        { tool: 'quickbooks', reason: 'Popular accounting software' },
      ],
      POS: [
        { tool: 'square', reason: 'Full POS with invoices, orders, customers' },
        { tool: 'shopify', reason: 'E-commerce with POS capabilities' },
      ],
      ERP: [
        { tool: 'browser_tool', reason: 'Browser automation for ERP web interfaces' },
      ],
      PROJECT: [
        { tool: 'asana', reason: 'Project management with tasks and teams' },
        { tool: 'trello', reason: 'Kanban-style project boards' },
        { tool: 'linear', reason: 'Modern issue tracking' },
      ],
      COMMUNICATION: [
        { tool: 'slack', reason: 'Team messaging with channels and DMs' },
        { tool: 'discord', reason: 'Community communication' },
      ],
      STORAGE: [
        { tool: 'googledrive', reason: 'Cloud storage with sharing' },
        { tool: 'dropbox', reason: 'File storage and sync' },
      ],
      CALENDAR: [
        { tool: 'googlecalendar', reason: 'Event management and scheduling' },
      ],
      EMAIL: [
        { tool: 'gmail', reason: 'Full email with search and labels' },
      ],
    }

    return suggestions[category as ToolCategory] || []
  }

  /**
   * Cache a discovery result
   */
  private cacheResult(key: string, result: ToolDiscoveryResult): void {
    this.discoveryCache.set(key, {
      result,
      timestamp: Date.now(),
    })
  }

  /**
   * Clear discovery cache
   */
  clearCache(): void {
    this.discoveryCache.clear()
    console.log('[ToolDiscovery] Cache cleared')
  }

  /**
   * Get human-readable summary of tool support
   */
  getToolSummary(result: ToolDiscoveryResult): string {
    if (result.supportLevel === 'full') {
      return `${result.toolName} is fully supported with ${result.actionCount} actions available. ` +
        (result.isConnected ? 'Already connected!' : 'Click to connect.')
    }

    if (result.supportLevel === 'partial') {
      return `${result.toolName} is partially supported with ${result.actionCount} actions. ` +
        `Missing: ${result.missingActions.slice(0, 3).join(', ')}${result.missingActions.length > 3 ? '...' : ''}.`
    }

    if (result.supportLevel === 'browser_only') {
      return `${result.toolName} can be automated via browser control, but this is less reliable than native integrations. ` +
        `Consider switching to ${result.alternatives?.[0]?.tool || 'a supported alternative'}.`
    }

    return `${result.toolName} is not natively supported. ` +
      (result.alternatives?.length
        ? `Try: ${result.alternatives.map((a) => a.tool).join(', ')}`
        : 'Custom API integration may be required.')
  }
}

// Export singleton instance
export const toolDiscoveryService = new ToolDiscoveryServiceClass()

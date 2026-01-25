/**
 * IntegrationAuthService
 *
 * Manages OAuth connections for workflow integrations via Composio/Rube.
 * Provides friendly, one-at-a-time authentication flow to keep users engaged.
 */

// Integration metadata for friendly UX
export interface IntegrationInfo {
  id: string
  name: string
  icon: string
  color: string
  description: string
  connectMessage: string
  successMessage: string
  toolkit: string // Composio toolkit name
}

// Connection status for an integration
export interface ConnectionStatus {
  integration: IntegrationInfo
  isConnected: boolean
  redirectUrl?: string
  error?: string
}

// Workflow setup status
export interface WorkflowSetupStatus {
  totalIntegrations: number
  connectedCount: number
  nextToConnect?: IntegrationInfo
  allConnected: boolean
  connections: ConnectionStatus[]
}

// Known integrations with friendly metadata
const INTEGRATIONS: Record<string, IntegrationInfo> = {
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    icon: '📧',
    color: '#EA4335',
    description: 'Send and receive emails',
    connectMessage: "Let's connect your Gmail to send those emails automatically!",
    successMessage: "Gmail connected! Your emails are ready to flow.",
    toolkit: 'gmail',
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    color: '#4A154B',
    description: 'Send messages and notifications',
    connectMessage: "Connect Slack to keep your team in the loop!",
    successMessage: "Slack connected! Messages will flow instantly.",
    toolkit: 'slack',
  },
  google_sheets: {
    id: 'google_sheets',
    name: 'Google Sheets',
    icon: '📊',
    color: '#34A853',
    description: 'Read and write spreadsheet data',
    connectMessage: "Link Google Sheets to sync your data automatically!",
    successMessage: "Sheets connected! Your data is ready to sync.",
    toolkit: 'googlesheets',
  },
  google_calendar: {
    id: 'google_calendar',
    name: 'Google Calendar',
    icon: '📅',
    color: '#4285F4',
    description: 'Create and manage events',
    connectMessage: "Connect Calendar to schedule events automatically!",
    successMessage: "Calendar connected! Events will be created instantly.",
    toolkit: 'googlecalendar',
  },
  google_drive: {
    id: 'google_drive',
    name: 'Google Drive',
    icon: '📁',
    color: '#FBBC04',
    description: 'Store and organize files',
    connectMessage: "Link Drive to manage your files seamlessly!",
    successMessage: "Drive connected! Files ready to organize.",
    toolkit: 'googledrive',
  },
  hubspot: {
    id: 'hubspot',
    name: 'HubSpot',
    icon: '🔶',
    color: '#FF7A59',
    description: 'Manage contacts and deals',
    connectMessage: "Connect HubSpot to supercharge your CRM!",
    successMessage: "HubSpot connected! CRM data flowing.",
    toolkit: 'hubspot',
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    color: '#000000',
    description: 'Manage docs and databases',
    connectMessage: "Link Notion to organize everything in one place!",
    successMessage: "Notion connected! Docs ready to sync.",
    toolkit: 'notion',
  },
  github: {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    color: '#181717',
    description: 'Manage code and issues',
    connectMessage: "Connect GitHub to automate your dev workflow!",
    successMessage: "GitHub connected! Code automation ready.",
    toolkit: 'github',
  },
  trello: {
    id: 'trello',
    name: 'Trello',
    icon: '📋',
    color: '#0052CC',
    description: 'Manage boards and cards',
    connectMessage: "Link Trello to keep your projects organized!",
    successMessage: "Trello connected! Boards ready to update.",
    toolkit: 'trello',
  },
  asana: {
    id: 'asana',
    name: 'Asana',
    icon: '✅',
    color: '#F06A6A',
    description: 'Manage tasks and projects',
    connectMessage: "Connect Asana to streamline your tasks!",
    successMessage: "Asana connected! Tasks flowing smoothly.",
    toolkit: 'asana',
  },
  // Messaging & Communication
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    icon: '💬',
    color: '#25D366',
    description: 'Send WhatsApp messages to clients',
    connectMessage: "Connect WhatsApp Business to message your clients directly!",
    successMessage: "WhatsApp connected! Ready to message clients.",
    toolkit: 'whatsapp',
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    icon: '🎮',
    color: '#5865F2',
    description: 'Send messages to Discord servers',
    connectMessage: "Connect Discord to keep your community updated!",
    successMessage: "Discord connected! Server messages ready.",
    toolkit: 'discord',
  },
  teams: {
    id: 'teams',
    name: 'Microsoft Teams',
    icon: '👥',
    color: '#6264A7',
    description: 'Send Teams messages and notifications',
    connectMessage: "Connect Teams to collaborate with your team!",
    successMessage: "Teams connected! Collaboration ready.",
    toolkit: 'teams',
  },
  zoom: {
    id: 'zoom',
    name: 'Zoom',
    icon: '📹',
    color: '#2D8CFF',
    description: 'Create and manage meetings',
    connectMessage: "Connect Zoom to schedule meetings automatically!",
    successMessage: "Zoom connected! Meetings ready to schedule.",
    toolkit: 'zoom',
  },
  // Project Management
  clickup: {
    id: 'clickup',
    name: 'ClickUp',
    icon: '🎯',
    color: '#7B68EE',
    description: 'Manage tasks and projects',
    connectMessage: "Connect ClickUp to automate your project management!",
    successMessage: "ClickUp connected! Projects flowing.",
    toolkit: 'clickup',
  },
  linear: {
    id: 'linear',
    name: 'Linear',
    icon: '⚡',
    color: '#5E6AD2',
    description: 'Manage issues and sprints',
    connectMessage: "Connect Linear to streamline your dev workflow!",
    successMessage: "Linear connected! Issues ready to track.",
    toolkit: 'linear',
  },
  monday: {
    id: 'monday',
    name: 'Monday.com',
    icon: '📋',
    color: '#FF3D57',
    description: 'Manage boards and workflows',
    connectMessage: "Connect Monday.com to power your work OS!",
    successMessage: "Monday connected! Boards ready to update.",
    toolkit: 'monday',
  },
  jira: {
    id: 'jira',
    name: 'Jira',
    icon: '🔵',
    color: '#0052CC',
    description: 'Manage issues and sprints',
    connectMessage: "Connect Jira to automate your agile workflow!",
    successMessage: "Jira connected! Sprints flowing.",
    toolkit: 'jira',
  },
  // CRM & Sales
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    icon: '☁️',
    color: '#00A1E0',
    description: 'Manage leads and opportunities',
    connectMessage: "Connect Salesforce to power your sales automation!",
    successMessage: "Salesforce connected! CRM data flowing.",
    toolkit: 'salesforce',
  },
  pipedrive: {
    id: 'pipedrive',
    name: 'Pipedrive',
    icon: '🔄',
    color: '#00B900',
    description: 'Manage deals and contacts',
    connectMessage: "Connect Pipedrive to automate your sales pipeline!",
    successMessage: "Pipedrive connected! Deals ready to track.",
    toolkit: 'pipedrive',
  },
  // Payments & Finance
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    icon: '💳',
    color: '#635BFF',
    description: 'Process payments and subscriptions',
    connectMessage: "Connect Stripe to automate your payments!",
    successMessage: "Stripe connected! Payments flowing.",
    toolkit: 'stripe',
  },
  quickbooks: {
    id: 'quickbooks',
    name: 'QuickBooks',
    icon: '📒',
    color: '#2CA01C',
    description: 'Manage accounting and invoices',
    connectMessage: "Connect QuickBooks to automate your bookkeeping!",
    successMessage: "QuickBooks connected! Accounting flowing.",
    toolkit: 'quickbooks',
  },
  xero: {
    id: 'xero',
    name: 'Xero',
    icon: '💰',
    color: '#13B5EA',
    description: 'Manage accounting and invoices',
    connectMessage: "Connect Xero to streamline your finances!",
    successMessage: "Xero connected! Invoices ready.",
    toolkit: 'xero',
  },
  freshbooks: {
    id: 'freshbooks',
    name: 'FreshBooks',
    icon: '📑',
    color: '#0075DD',
    description: 'Create and manage invoices',
    connectMessage: "Connect FreshBooks to automate your invoicing!",
    successMessage: "FreshBooks connected! Invoices ready to create.",
    toolkit: 'freshbooks',
  },
  // Marketing
  mailchimp: {
    id: 'mailchimp',
    name: 'Mailchimp',
    icon: '🐵',
    color: '#FFE01B',
    description: 'Manage email campaigns',
    connectMessage: "Connect Mailchimp to automate your email marketing!",
    successMessage: "Mailchimp connected! Campaigns ready.",
    toolkit: 'mailchimp',
  },
  sendgrid: {
    id: 'sendgrid',
    name: 'SendGrid',
    icon: '📬',
    color: '#1A82E2',
    description: 'Send transactional emails',
    connectMessage: "Connect SendGrid for reliable email delivery!",
    successMessage: "SendGrid connected! Emails ready to send.",
    toolkit: 'sendgrid',
  },
  // Social Media
  twitter: {
    id: 'twitter',
    name: 'Twitter/X',
    icon: '𝕏',
    color: '#000000',
    description: 'Post tweets and manage engagement',
    connectMessage: "Connect Twitter to automate your social presence!",
    successMessage: "Twitter connected! Tweets ready to post.",
    toolkit: 'twitter',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    description: 'Post updates and manage connections',
    connectMessage: "Connect LinkedIn to grow your professional network!",
    successMessage: "LinkedIn connected! Posts ready.",
    toolkit: 'linkedin',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    description: 'Post content and manage engagement',
    connectMessage: "Connect Instagram to automate your visual content!",
    successMessage: "Instagram connected! Posts ready.",
    toolkit: 'instagram',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    description: 'Manage pages and posts',
    connectMessage: "Connect Facebook to manage your page!",
    successMessage: "Facebook connected! Page ready.",
    toolkit: 'facebook',
  },
  // Storage & Documents
  dropbox: {
    id: 'dropbox',
    name: 'Dropbox',
    icon: '📦',
    color: '#0061FF',
    description: 'Store and share files',
    connectMessage: "Connect Dropbox to sync your files!",
    successMessage: "Dropbox connected! Files ready.",
    toolkit: 'dropbox',
  },
  onedrive: {
    id: 'onedrive',
    name: 'OneDrive',
    icon: '☁️',
    color: '#0078D4',
    description: 'Store and share files',
    connectMessage: "Connect OneDrive to sync your Microsoft files!",
    successMessage: "OneDrive connected! Files syncing.",
    toolkit: 'onedrive',
  },
  airtable: {
    id: 'airtable',
    name: 'Airtable',
    icon: '🗃️',
    color: '#18BFFF',
    description: 'Manage databases and records',
    connectMessage: "Connect Airtable to automate your data!",
    successMessage: "Airtable connected! Data flowing.",
    toolkit: 'airtable',
  },
  // AI & Automation
  openai: {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    color: '#00A67E',
    description: 'Generate AI content and responses',
    connectMessage: "Connect OpenAI for AI-powered automation!",
    successMessage: "OpenAI connected! AI ready.",
    toolkit: 'openai',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Claude AI',
    icon: '🧠',
    color: '#D4A27F',
    description: 'Generate AI content with Claude',
    connectMessage: "Connect Claude for intelligent automation!",
    successMessage: "Claude connected! AI ready.",
    toolkit: 'anthropic',
  },
  // Voice & Transcription
  deepgram: {
    id: 'deepgram',
    name: 'Deepgram',
    icon: '🎤',
    color: '#13EF93',
    description: 'Transcribe audio with high accuracy',
    connectMessage: "Connect Deepgram for speech-to-text!",
    successMessage: "Deepgram connected! Transcription ready.",
    toolkit: 'deepgram',
  },
  elevenlabs: {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    icon: '🔊',
    color: '#000000',
    description: 'Generate realistic voice audio',
    connectMessage: "Connect ElevenLabs for text-to-speech!",
    successMessage: "ElevenLabs connected! Voice ready.",
    toolkit: 'elevenlabs',
  },
  // Support
  intercom: {
    id: 'intercom',
    name: 'Intercom',
    icon: '💬',
    color: '#6AFDEF',
    description: 'Manage customer conversations',
    connectMessage: "Connect Intercom for customer support!",
    successMessage: "Intercom connected! Support ready.",
    toolkit: 'intercom',
  },
  zendesk: {
    id: 'zendesk',
    name: 'Zendesk',
    icon: '🎫',
    color: '#03363D',
    description: 'Manage support tickets',
    connectMessage: "Connect Zendesk for ticket automation!",
    successMessage: "Zendesk connected! Tickets flowing.",
    toolkit: 'zendesk',
  },
  freshdesk: {
    id: 'freshdesk',
    name: 'Freshdesk',
    icon: '🆘',
    color: '#25C16F',
    description: 'Manage support tickets',
    connectMessage: "Connect Freshdesk for support automation!",
    successMessage: "Freshdesk connected! Support ready.",
    toolkit: 'freshdesk',
  },
}

// Default integration for unknown types
const DEFAULT_INTEGRATION: IntegrationInfo = {
  id: 'default',
  name: 'Integration',
  icon: '⚙️',
  color: '#6B7280',
  description: 'Connect this service',
  connectMessage: "Let's connect this integration to make your workflow real!",
  successMessage: "Connected! Ready to automate.",
  toolkit: 'unknown',
}

/**
 * Get integration info from a node name or integration string
 */
export function getIntegrationInfo(nodeNameOrIntegration: string): IntegrationInfo {
  const lower = nodeNameOrIntegration.toLowerCase()

  // Check exact matches first
  if (INTEGRATIONS[lower]) {
    return INTEGRATIONS[lower]
  }

  // Check if any integration name is contained in the string
  for (const [key, info] of Object.entries(INTEGRATIONS)) {
    if (lower.includes(key) || lower.includes(info.name.toLowerCase())) {
      return info
    }
  }

  // Special mappings for common variations and partial matches
  // Google Workspace
  if (lower.includes('sheet') || lower.includes('spreadsheet')) {
    return INTEGRATIONS.google_sheets
  }
  if (lower.includes('calendar') || lower.includes('event') || lower.includes('schedule')) {
    return INTEGRATIONS.google_calendar
  }
  if (lower.includes('drive') && !lower.includes('pipedrive')) {
    return INTEGRATIONS.google_drive
  }

  // Email
  if (lower.includes('email') || lower.includes('mail')) {
    if (lower.includes('mailchimp')) return INTEGRATIONS.mailchimp
    if (lower.includes('sendgrid')) return INTEGRATIONS.sendgrid
    return INTEGRATIONS.gmail
  }

  // Messaging (be careful with order - more specific first)
  if (lower.includes('whatsapp') || lower.includes('waba') || lower.includes('wa message')) {
    return INTEGRATIONS.whatsapp
  }
  if (lower.includes('discord')) {
    return INTEGRATIONS.discord
  }
  if (lower.includes('teams') || lower.includes('microsoft teams')) {
    return INTEGRATIONS.teams
  }
  if (lower.includes('zoom') || lower.includes('meeting')) {
    return INTEGRATIONS.zoom
  }
  if (lower.includes('message') || lower.includes('chat') || lower.includes('notify')) {
    return INTEGRATIONS.slack
  }

  // Project Management
  if (lower.includes('clickup') || lower.includes('click up')) {
    return INTEGRATIONS.clickup
  }
  if (lower.includes('linear')) {
    return INTEGRATIONS.linear
  }
  if (lower.includes('monday')) {
    return INTEGRATIONS.monday
  }
  if (lower.includes('jira')) {
    return INTEGRATIONS.jira
  }
  if (lower.includes('asana')) {
    return INTEGRATIONS.asana
  }
  if (lower.includes('trello')) {
    return INTEGRATIONS.trello
  }
  if (lower.includes('task') || lower.includes('project')) {
    return INTEGRATIONS.clickup // Default project management
  }

  // CRM
  if (lower.includes('salesforce') || lower.includes('sfdc')) {
    return INTEGRATIONS.salesforce
  }
  if (lower.includes('hubspot')) {
    return INTEGRATIONS.hubspot
  }
  if (lower.includes('pipedrive')) {
    return INTEGRATIONS.pipedrive
  }
  if (lower.includes('crm') || lower.includes('contact') || lower.includes('lead')) {
    return INTEGRATIONS.hubspot // Default CRM
  }

  // Payments
  if (lower.includes('stripe') || lower.includes('payment') || lower.includes('charge')) {
    return INTEGRATIONS.stripe
  }
  if (lower.includes('quickbooks') || lower.includes('qb')) {
    return INTEGRATIONS.quickbooks
  }
  if (lower.includes('xero')) {
    return INTEGRATIONS.xero
  }
  // @NEXUS-FIX-052: Add Freshbooks detection BEFORE generic invoice check
  // So "freshbooks invoice" maps to freshbooks, not stripe
  if (lower.includes('freshbooks') || lower.includes('fresh books')) {
    return INTEGRATIONS.freshbooks
  }
  if (lower.includes('invoice')) {
    return INTEGRATIONS.stripe
  }

  // Social Media
  if (lower.includes('twitter') || lower.includes('tweet') || lower.includes(' x ')) {
    return INTEGRATIONS.twitter
  }
  if (lower.includes('linkedin')) {
    return INTEGRATIONS.linkedin
  }
  if (lower.includes('instagram') || lower.includes('ig ')) {
    return INTEGRATIONS.instagram
  }
  if (lower.includes('facebook') || lower.includes('fb ')) {
    return INTEGRATIONS.facebook
  }

  // Storage
  if (lower.includes('dropbox')) {
    return INTEGRATIONS.dropbox
  }
  if (lower.includes('onedrive') || lower.includes('one drive')) {
    return INTEGRATIONS.onedrive
  }
  if (lower.includes('airtable')) {
    return INTEGRATIONS.airtable
  }
  if (lower.includes('notion')) {
    return INTEGRATIONS.notion
  }
  if (lower.includes('file') || lower.includes('document') || lower.includes('storage')) {
    return INTEGRATIONS.google_drive
  }

  // AI
  if (lower.includes('openai') || lower.includes('gpt') || lower.includes('chatgpt')) {
    return INTEGRATIONS.openai
  }
  if (lower.includes('claude') || lower.includes('anthropic')) {
    return INTEGRATIONS.anthropic
  }
  if (lower.includes('ai generate') || lower.includes('ai response') || lower.includes('llm')) {
    return INTEGRATIONS.openai
  }

  // Voice & Transcription
  if (lower.includes('deepgram') || lower.includes('transcri')) {
    return INTEGRATIONS.deepgram
  }
  if (lower.includes('elevenlabs') || lower.includes('eleven labs') || lower.includes('text to speech') || lower.includes('tts')) {
    return INTEGRATIONS.elevenlabs
  }

  // Support
  if (lower.includes('intercom')) {
    return INTEGRATIONS.intercom
  }
  if (lower.includes('zendesk')) {
    return INTEGRATIONS.zendesk
  }
  if (lower.includes('freshdesk')) {
    return INTEGRATIONS.freshdesk
  }
  if (lower.includes('ticket') || lower.includes('support')) {
    return INTEGRATIONS.zendesk
  }

  // GitHub
  if (lower.includes('github') || lower.includes('git hub') || lower.includes('repo')) {
    return INTEGRATIONS.github
  }

  return { ...DEFAULT_INTEGRATION, id: lower, name: nodeNameOrIntegration }
}

/**
 * Extract unique integrations needed for a workflow
 */
export function getRequiredIntegrations(nodes: Array<{ name: string; integration?: string }>): IntegrationInfo[] {
  const seen = new Set<string>()
  const integrations: IntegrationInfo[] = []

  for (const node of nodes) {
    const info = getIntegrationInfo(node.integration || node.name)
    if (!seen.has(info.id) && info.toolkit !== 'unknown') {
      seen.add(info.id)
      integrations.push(info)
    }
  }

  return integrations
}

/**
 * IntegrationAuthService class
 * Manages connection checking and OAuth flow
 */
class IntegrationAuthService {
  private connectionCache: Map<string, boolean> = new Map()
  private cacheTimestamp: number = 0
  private readonly CACHE_TTL = 30000 // 30 seconds

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_TTL
  }

  /**
   * Check connection status for multiple toolkits via Composio
   */
  async checkConnections(toolkits: string[]): Promise<Map<string, { connected: boolean; redirectUrl?: string }>> {
    const results = new Map<string, { connected: boolean; redirectUrl?: string }>()

    // Check cache first
    if (this.isCacheValid() && this.connectionCache.size > 0) {
      console.log('[IntegrationAuthService] Using cached connections')
      for (const toolkit of toolkits) {
        const cached = this.connectionCache.get(toolkit)
        results.set(toolkit, { connected: cached ?? false })
      }
      return results
    }

    // For now, we'll check via the MCP tools
    // In production, this would call RUBE_MANAGE_CONNECTIONS
    console.log('[IntegrationAuthService] Checking connections for:', toolkits)

    // This will be replaced with actual MCP call
    // For MVP, assume not connected and return redirect URLs
    for (const toolkit of toolkits) {
      results.set(toolkit, { connected: false })
      this.connectionCache.set(toolkit, false)
    }

    // Update cache timestamp
    this.cacheTimestamp = Date.now()

    return results
  }

  /**
   * Get OAuth redirect URL for a specific toolkit
   */
  async getAuthUrl(toolkit: string): Promise<string | null> {
    console.log('[IntegrationAuthService] Getting auth URL for:', toolkit)
    // This will be called via MCP - RUBE_MANAGE_CONNECTIONS
    return null
  }

  /**
   * Analyze workflow and return setup status
   */
  async getWorkflowSetupStatus(nodes: Array<{ name: string; integration?: string }>): Promise<WorkflowSetupStatus> {
    const requiredIntegrations = getRequiredIntegrations(nodes)
    const connections: ConnectionStatus[] = []

    // Check each required integration
    const toolkits = requiredIntegrations.map(i => i.toolkit)
    const connectionResults = await this.checkConnections(toolkits)

    let connectedCount = 0
    let nextToConnect: IntegrationInfo | undefined

    for (const integration of requiredIntegrations) {
      const result = connectionResults.get(integration.toolkit)
      const isConnected = result?.connected ?? false

      connections.push({
        integration,
        isConnected,
        redirectUrl: result?.redirectUrl,
      })

      if (isConnected) {
        connectedCount++
      } else if (!nextToConnect) {
        nextToConnect = integration
      }
    }

    return {
      totalIntegrations: requiredIntegrations.length,
      connectedCount,
      nextToConnect,
      allConnected: connectedCount === requiredIntegrations.length,
      connections,
    }
  }

  /**
   * Clear connection cache (call after successful OAuth)
   */
  clearCache() {
    this.connectionCache.clear()
    this.cacheTimestamp = 0
  }
}

// Export singleton instance
export const integrationAuthService = new IntegrationAuthService()

export default integrationAuthService

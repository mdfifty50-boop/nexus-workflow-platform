/**
 * WorkflowPreviewCard Component
 *
 * Mini n8n-style workflow visualization with REAL execution via Composio/Rube.
 * Features:
 * - Smart authentication flow (one integration at a time)
 * - Real API execution with live status updates
 * - Friendly, engaging UX that guides users through setup
 * - Mobile-responsive layouts (vertical on mobile, horizontal on desktop)
 */

import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Zap,
  Link2,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Pencil,
  FlaskConical,
  Rocket,
} from 'lucide-react'
import { NodeEditPanel } from './NodeEditPanel'
import {
  getIntegrationInfo,
  getRequiredIntegrations,
  type IntegrationInfo,
} from '@/services/IntegrationAuthService'
import { rubeClient } from '@/services/RubeClient'
import { PreFlightService, type PreFlightResult, type PreFlightQuestion } from '@/services/PreFlightService'
// @NEXUS-FIX-039: WorkflowIntelligenceService integration for enhanced error handling - DO NOT REMOVE
import { WorkflowIntelligenceService } from '@/services/WorkflowIntelligenceService'
// @NEXUS-FIX-041: VerifiedExecutor for execution with verification - DO NOT REMOVE
import { VerifiedExecutorService, type VerifiedResult } from '@/services/VerifiedExecutor'
// @NEXUS-FIX-042: UnifiedToolRegistry - Single source of truth for tools - DO NOT REMOVE
import { UnifiedToolRegistryService, type ToolContract } from '@/services/UnifiedToolRegistry'
// @NEXUS-FIX-043: ParamResolutionPipeline - Complete param resolution - DO NOT REMOVE
import { ParamResolutionPipeline, type ResolvedParams } from '@/services/ParamResolutionPipeline'
// @NEXUS-FIX-044: OAuthController - OAuth flow management - DO NOT REMOVE
// NOTE: ConnectionStatus imported for future integration when OAuthController is wired up
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ConnectionStatus as _ConnectionStatus } from '@/services/OAuthController'
// @NEXUS-FIX-037 & FIX-038: UI components for unsupported tools and parameter collection
// NOTE: These imports are for Phase 3 integration - uncomment when UI integration is complete
// import { UnsupportedToolCard } from './UnsupportedToolCard'
// import { ParameterCollectionPanel, type MissingParam, type CollectedParam } from './ParameterCollectionPanel'

// @NEXUS-WHATSAPP: WhatsApp connection prompt for workflows with WhatsApp nodes
import { WhatsAppConnectionPrompt } from './WhatsAppConnectionPrompt'

// @NEXUS-GENERIC-ORCHESTRATION: 5-Layer Generic Orchestration System
// Enables Nexus to work with ANY of Rube's 500+ tools without hardcoding
// NOTE: Some imports are for Phase 3 integration when orchestration is fully wired up
import {
  getOrchestrationService,
  getSchemaResolver,
  createCollector,  // @NEXUS-FIX-064: Import for schema-driven question regeneration
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getUXTranslator as _getUXTranslator,
  humanize,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type DiscoveredTool as _DiscoveredTool,
  type CollectionQuestion,
} from '@/services/orchestration'
// Persistent user memory tracking
import { userMemoryService } from '@/services/UserMemoryService'

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * @NEXUS-GENERIC-ORCHESTRATION Feature Flag
 *
 * When TRUE: Uses new 5-layer generic orchestration
 *   - Dynamic tool discovery via RUBE_SEARCH_TOOLS
 *   - Schema caching (24hr in localStorage)
 *   - Pattern-based UX translation
 *   - State machine for param collection
 *
 * When FALSE: Uses legacy hardcoded TOOL_SLUGS
 *
 * Rollout Plan:
 *   1. Start FALSE (current behavior)
 *   2. Enable for NEW tools not in TOOL_SLUGS
 *   3. Enable for ALL tools after testing
 *   4. Remove legacy code after 2 weeks stable
 */
const USE_GENERIC_ORCHESTRATION = true // Phase 3: ENABLED for testing

/**
 * @NEXUS-FIX-059: Orchestration-First Approach Feature Flag
 *
 * When TRUE: ALL toolkits (known AND unknown) go through orchestration first
 *   - Static TOOL_REQUIREMENTS becomes a FALLBACK (used only if API fails)
 *   - Ensures tool schemas are always up-to-date with Composio's latest
 *   - Prevents static mappings from becoming stale
 *
 * When FALSE: Uses existing dual-track logic
 *   - Known toolkits use static TOOL_REQUIREMENTS
 *   - Unknown toolkits use orchestration
 *
 * Rollback: Set to false if orchestration causes issues
 */
const USE_ORCHESTRATION_FIRST = true // @NEXUS-FIX-059: Orchestration-first approach

/**
 * @NEXUS-GENERIC-ORCHESTRATION: Async tool resolution via orchestration layer
 *
 * This function provides dynamic tool discovery for ANY tool, not just hardcoded ones.
 * It integrates with the 5-layer orchestration architecture.
 *
 * Use Cases:
 *   1. When USE_GENERIC_ORCHESTRATION=true - all tools use this path
 *   2. When tool not found in TOOL_SLUGS - fallback to dynamic discovery
 *
 * Returns: Tool discovery result with slug, schema info, and UX hints
 */
interface OrchestrationResult {
  slug: string
  toolkit: string
  action: string
  displayName: string
  questions: CollectionQuestion[]
  sessionId: string
  source: 'orchestration' | 'legacy'
}

async function resolveToolViaOrchestration(
  intent: string,
  toolkit: string
): Promise<OrchestrationResult | null> {
  // Skip if feature flag is disabled
  if (!USE_GENERIC_ORCHESTRATION) {
    return null
  }

  try {
    const orchestration = getOrchestrationService()
    const result = await orchestration.orchestrate(intent, toolkit)

    if (!result.tools || result.tools.length === 0) {
      console.log(`[ORCHESTRATION] No tools found for "${intent}" in ${toolkit}`)
      return null
    }

    // Use the first (most relevant) tool
    const tool = result.tools[0]
    const schema = await result.getSchema(tool.slug)
    const collector = result.createCollector(schema)

    return {
      slug: tool.slug,
      toolkit: tool.toolkit,
      action: tool.name,
      displayName: humanize(tool.slug),
      questions: collector.getAllQuestions(),
      sessionId: result.sessionId,
      source: 'orchestration'
    }
  } catch (error) {
    console.error(`[ORCHESTRATION] Failed to discover tool for "${intent}":`, error)
    return null
  }
}

/**
 * Check if a toolkit has tools defined in the static TOOL_SLUGS mapping
 * Used to decide whether to use orchestration for unknown toolkits
 *
 * NOTE: Prepared for Phase 3 integration when executeWorkflow uses orchestration
 * @NEXUS-FIX-064-ALIAS: Resolves aliases before checking TOOL_SLUGS - DO NOT REMOVE
 */
function isToolkitKnown(toolkit: string): boolean {
  const toolkitLower = toolkit.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')

  // @NEXUS-FIX-064-ALIAS: Resolve toolkit aliases (e.g., 'calendar' → 'googlecalendar')
  // TOOLKIT_ALIASES is defined later in the file but available at runtime
  const KNOWN_ALIASES: Record<string, string> = {
    'calendar': 'googlecalendar',
    'gcal': 'googlecalendar',
    'google_calendar': 'googlecalendar',
    'sheets': 'googlesheets',
    'google_sheets': 'googlesheets',
    'drive': 'googledrive',
    'google_drive': 'googledrive',
    'email': 'gmail',
    'google_email': 'gmail',
    'onedrive': 'onedrive',
    'microsoft_onedrive': 'onedrive',
  }
  const resolvedToolkit = KNOWN_ALIASES[toolkitLower] || toolkitLower

  // Check TOOL_SLUGS after it's defined (this is called at runtime)
  // We access TOOL_SLUGS from within the same file
  return typeof TOOL_SLUGS !== 'undefined' && resolvedToolkit in TOOL_SLUGS
}

// ============================================================================
// Types
// ============================================================================

type NodeStatus = 'idle' | 'pending' | 'connecting' | 'success' | 'error'
type CardPhase = 'ready' | 'checking' | 'needs_auth' | 'executing' | 'complete' | 'error'

interface WorkflowNode {
  id: string
  name: string
  type: 'trigger' | 'action' | 'output'
  integration?: string
  status: NodeStatus
  result?: unknown
  error?: string
  config?: Record<string, unknown>
  description?: string
}

interface MissingInfoItem {
  question: string
  options: string[]
  field: string
}

// @NEXUS-FIX-103: Semantic parameter aliases for deduplication - DO NOT REMOVE
// Maps different param names that mean the same thing
const PARAM_ALIASES: Record<string, string[]> = {
  // Text/message content - all these mean "the content to send"
  text: ['message', 'content', 'body', 'notification_details', 'notification_content', 'message_text', 'email_body'],
  message: ['text', 'content', 'body', 'notification_details', 'notification_content', 'message_text'],
  body: ['text', 'message', 'content', 'email_body', 'notification_details'],
  content: ['text', 'message', 'body', 'notification_content'],

  // Recipients - all these mean "who to send to"
  to: ['recipient', 'recipient_email', 'email_to', 'send_to', 'email_address', 'to_email'],
  recipient: ['to', 'recipient_email', 'email_to', 'send_to', 'email_address'],
  channel: ['slack_channel', 'channel_name', 'channel_id', 'slack_channel_id'],

  // Identifiers - all these mean "which resource"
  spreadsheet_id: ['sheet_id', 'google_sheet', 'spreadsheet_url', 'sheet_url', 'googlesheets_spreadsheet_id'],
  list_id: ['clickup_list', 'list', 'trello_list'],
  task_id: ['clickup_task', 'task', 'task_identifier'],
  board_id: ['trello_board', 'monday_board', 'board'],
  project_id: ['asana_project', 'project', 'project_key'],

  // Phone numbers
  phone: ['phone_number', 'to', 'recipient_phone', 'whatsapp_number', 'mobile'],
  phone_number: ['phone', 'to', 'recipient_phone', 'mobile'],

  // Names/Titles
  name: ['title', 'subject', 'summary', 'task_name', 'item_name'],
  title: ['name', 'subject', 'summary', 'event_title'],
  subject: ['title', 'name', 'email_subject'],

  // @NEXUS-FIX-109: File/folder paths - all these mean "where to store/access" - DO NOT REMOVE
  // FIX-109b: Added dropbox_folder to path AND dropbox_path to folder for full bidirectional mapping
  path: ['folder', 'folder_path', 'directory', 'dropbox_path', 'dropbox_folder', 'file_path', 'location', 'destination'],
  folder: ['path', 'folder_path', 'directory', 'dropbox_folder', 'dropbox_path', 'destination'],
}

// @NEXUS-FIX-103: Check if a param is semantically already collected via aliases
// @NEXUS-FIX-107: Normalize spaces to underscores for proper alias matching - DO NOT REMOVE
function isParamSemanticallycollected(paramName: string, collectedParams: Record<string, string>): boolean {
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
function getCanonicalParamName(paramName: string): string {
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

interface ChatWorkflow {
  id: string
  name: string
  description: string
  nodes: Array<{
    id: string
    name: string
    type: string
    integration?: string
  }>
  // Confidence-based execution fields
  confidence?: number  // 0.0-1.0, >= 0.85 means ready to execute
  assumptions?: string[]  // List of defaults that were assumed
  missingInfo?: MissingInfoItem[]  // Questions to increase confidence
  // @NEXUS-FIX-026: Collected parameters from missingInfo answers (for auto-retry) - DO NOT REMOVE
  collectedParams?: Record<string, string>
}

interface WorkflowPreviewCardProps {
  workflow: ChatWorkflow
  className?: string
  autoExecute?: boolean
  onExecutionComplete?: (success: boolean, results?: unknown[]) => void
  onMissingInfoSelect?: (field: string, value: string) => void  // Callback when user answers a missing info question
  // @NEXUS-FIX-004: Custom integration API key handling - DO NOT REMOVE
  customIntegrations?: Array<{ appName: string; displayName: string; apiDocsUrl: string; apiKeyUrl?: string; steps: string[]; keyHint: string; category?: string }>
  onCustomIntegrationKeySubmit?: (appName: string, apiKey: string) => Promise<boolean>
  // Node editing callbacks (state managed by parent - ChatContainer)
  onNodeRemove?: (nodeId: string) => void
  onNodeAdd?: (integration: string, actionType: string) => void
}

interface AuthState {
  currentIntegration: IntegrationInfo | null
  connectedIntegrations: Set<string>
  pendingIntegrations: IntegrationInfo[]
  redirectUrl: string | null
  isChecking: boolean
  isPolling: boolean  // True when polling for OAuth completion
  pollAttempts: number  // Current poll attempt count
}

// Parallel OAuth state tracking
interface ParallelAuthState {
  [integrationId: string]: {
    status: 'pending' | 'connecting' | 'polling' | 'connected' | 'error'
    authUrl?: string
    pollAttempts: number
    error?: string
  }
}

// ============================================================================
// Status Colors & Icons
// ============================================================================

const statusColors: Record<NodeStatus, { bg: string; border: string; dot: string; line: string }> = {
  idle: { bg: 'bg-slate-800', border: 'border-slate-600', dot: 'bg-slate-500', line: 'bg-slate-600' },
  pending: { bg: 'bg-slate-700', border: 'border-slate-500', dot: 'bg-slate-400', line: 'bg-slate-500' },
  connecting: { bg: 'bg-amber-900/30', border: 'border-amber-500', dot: 'bg-amber-500', line: 'bg-amber-500' },
  success: { bg: 'bg-emerald-900/30', border: 'border-emerald-500', dot: 'bg-emerald-500', line: 'bg-emerald-500' },
  error: { bg: 'bg-red-900/30', border: 'border-red-500', dot: 'bg-red-500', line: 'bg-red-500' },
}

const integrationIcons: Record<string, string> = {
  gmail: '📧',
  slack: '💬',
  sheets: '📊',
  google_sheets: '📊',
  drive: '📁',
  google_drive: '📁',
  calendar: '📅',
  google_calendar: '📅',
  notion: '📝',
  hubspot: '🔶',
  salesforce: '☁️',
  zapier: '⚡',
  webhook: '🔗',
  api: '🔌',
  github: '🐙',
  trello: '📋',
  asana: '✅',
  default: '⚙️',
}

function getIcon(integration?: string): string {
  if (!integration) return integrationIcons.default
  const key = integration.toLowerCase().replace(/\s+/g, '_')
  return integrationIcons[key] || integrationIcons.default
}

// ============================================================================
// Tool Mapping Helpers
// ============================================================================

// Composio tool slugs for real API execution
// @NEXUS-FIX-007: TOOL_SLUGS static mapping - DO NOT REMOVE OR MODIFY WITHOUT /validate
const TOOL_SLUGS: Record<string, Record<string, string>> = {
  // Email
  gmail: {
    // Outbound
    send: 'GMAIL_SEND_EMAIL',
    draft: 'GMAIL_CREATE_EMAIL_DRAFT',
    // Inbound/Reading
    fetch: 'GMAIL_FETCH_EMAILS',
    read: 'GMAIL_FETCH_EMAILS',
    get: 'GMAIL_FETCH_EMAILS',
    list: 'GMAIL_FETCH_EMAILS',
    // Triggers (polling-based or webhook)
    trigger: 'GMAIL_NEW_EMAIL_TRIGGER',
    receive: 'GMAIL_NEW_EMAIL_TRIGGER',
    capture: 'GMAIL_NEW_EMAIL_TRIGGER',
    listen: 'GMAIL_NEW_EMAIL_TRIGGER',
    incoming: 'GMAIL_NEW_EMAIL_TRIGGER',
    watch: 'GMAIL_WATCH',
  },
  // Messaging & Communication
  slack: {
    // Outbound
    send: 'SLACK_SEND_MESSAGE',
    notify: 'SLACK_SEND_MESSAGE',
    message: 'SLACK_SEND_MESSAGE',
    post: 'SLACK_SEND_MESSAGE',
    // Listing/Reading
    list: 'SLACK_LIST_CHANNELS',
    fetch: 'SLACK_FETCH_CONVERSATION_HISTORY',
    read: 'SLACK_FETCH_CONVERSATION_HISTORY',
    history: 'SLACK_FETCH_CONVERSATION_HISTORY',
    // Triggers
    trigger: 'SLACK_NEW_MESSAGE_TRIGGER',
    receive: 'SLACK_NEW_MESSAGE_TRIGGER',
    capture: 'SLACK_NEW_MESSAGE_TRIGGER',
    listen: 'SLACK_NEW_MESSAGE_TRIGGER',
    incoming: 'SLACK_NEW_MESSAGE_TRIGGER',
    watch: 'SLACK_NEW_MESSAGE_TRIGGER',
  },
  whatsapp: {
    // Outbound
    send: 'WHATSAPP_SEND_MESSAGE',
    message: 'WHATSAPP_SEND_MESSAGE',
    notify: 'WHATSAPP_SEND_MESSAGE',
    template: 'WHATSAPP_SEND_TEMPLATE_MESSAGE',
    // Triggers/Inbound (via WhatsApp Business API webhooks)
    trigger: 'WHATSAPP_NEW_MESSAGE_TRIGGER',
    receive: 'WHATSAPP_NEW_MESSAGE_TRIGGER',
    capture: 'WHATSAPP_NEW_MESSAGE_TRIGGER',
    listen: 'WHATSAPP_NEW_MESSAGE_TRIGGER',
    incoming: 'WHATSAPP_NEW_MESSAGE_TRIGGER',
    webhook: 'WHATSAPP_WEBHOOK_TRIGGER',
  },
  discord: {
    send: 'DISCORD_SEND_MESSAGE',
    message: 'DISCORD_SEND_MESSAGE',
    post: 'DISCORD_SEND_MESSAGE',
    webhook: 'DISCORD_SEND_WEBHOOK',
  },
  teams: {
    send: 'TEAMS_SEND_MESSAGE',
    message: 'TEAMS_SEND_MESSAGE',
    post: 'TEAMS_SEND_MESSAGE',
    notify: 'TEAMS_SEND_MESSAGE',
  },
  zoom: {
    create: 'ZOOM_CREATE_MEETING',
    schedule: 'ZOOM_CREATE_MEETING',
    meeting: 'ZOOM_CREATE_MEETING',
    list: 'ZOOM_LIST_MEETINGS',
  },
  // Google Workspace
  googlesheets: {
    // @NEXUS-FIX-022: Added create/add mappings for "Add to Sheet" workflows - DO NOT REMOVE
    create: 'GOOGLESHEETS_BATCH_UPDATE',
    add: 'GOOGLESHEETS_BATCH_UPDATE',
    read: 'GOOGLESHEETS_BATCH_GET',
    get: 'GOOGLESHEETS_BATCH_GET',
    write: 'GOOGLESHEETS_BATCH_UPDATE',
    append: 'GOOGLESHEETS_BATCH_UPDATE',
    update: 'GOOGLESHEETS_BATCH_UPDATE',
    save: 'GOOGLESHEETS_BATCH_UPDATE',
  },
  // @NEXUS-FIX-025: Added get/fetch/find/today actions for calendar events
  googlecalendar: {
    create: 'GOOGLECALENDAR_CREATE_EVENT',
    list: 'GOOGLECALENDAR_EVENTS_LIST',
    get: 'GOOGLECALENDAR_EVENTS_LIST',
    fetch: 'GOOGLECALENDAR_EVENTS_LIST',
    find: 'GOOGLECALENDAR_EVENTS_LIST',
    today: 'GOOGLECALENDAR_EVENTS_LIST',
    check: 'GOOGLECALENDAR_EVENTS_LIST',
    schedule: 'GOOGLECALENDAR_CREATE_EVENT',
  },
  googledrive: {
    upload: 'GOOGLEDRIVE_UPLOAD_FILE',
    list: 'GOOGLEDRIVE_LIST_FILES',
    download: 'GOOGLEDRIVE_DOWNLOAD_FILE',
    create: 'GOOGLEDRIVE_CREATE_FOLDER',
  },
  // CRM & Sales
  hubspot: {
    search: 'HUBSPOT_SEARCH_CONTACTS_BY_CRITERIA',
    list: 'HUBSPOT_LIST_CONTACTS',
    create: 'HUBSPOT_CREATE_CONTACT',
    read: 'HUBSPOT_READ_CONTACT',
  },
  salesforce: {
    search: 'SALESFORCE_SEARCH_RECORDS',
    list: 'SALESFORCE_GET_RECORDS',
    create: 'SALESFORCE_CREATE_RECORD',
    update: 'SALESFORCE_UPDATE_RECORD',
    query: 'SALESFORCE_SOQL_QUERY',
  },
  pipedrive: {
    create: 'PIPEDRIVE_CREATE_DEAL',
    list: 'PIPEDRIVE_LIST_DEALS',
    update: 'PIPEDRIVE_UPDATE_DEAL',
    search: 'PIPEDRIVE_SEARCH',
  },
  // Project Management
  github: {
    issue: 'GITHUB_CREATE_ISSUE',
    issues: 'GITHUB_LIST_REPOSITORY_ISSUES',
    pr: 'GITHUB_CREATE_PULL_REQUEST',
    list: 'GITHUB_LIST_REPOSITORY_ISSUES',
    fetch: 'GITHUB_LIST_REPOSITORY_ISSUES',  // "Fetch GitHub Issues" should list issues
    get: 'GITHUB_LIST_REPOSITORY_ISSUES',    // "Get issues" should list issues
    search: 'GITHUB_ISSUES_AND_PULL_REQUESTS', // Search issues/PRs
  },
  clickup: {
    // Creating
    create: 'CLICKUP_CREATE_TASK',
    task: 'CLICKUP_CREATE_TASK',
    add: 'CLICKUP_CREATE_TASK',
    // Reading
    list: 'CLICKUP_GET_TASKS',
    get: 'CLICKUP_GET_TASK',
    fetch: 'CLICKUP_GET_TASKS',
    folder: 'CLICKUP_GET_FOLDERS',
    // Updating
    update: 'CLICKUP_UPDATE_TASK',
    edit: 'CLICKUP_UPDATE_TASK',
    // Triggers
    trigger: 'CLICKUP_NEW_TASK_TRIGGER',
    capture: 'CLICKUP_NEW_TASK_TRIGGER',
    receive: 'CLICKUP_NEW_TASK_TRIGGER',
    watch: 'CLICKUP_TASK_UPDATED_TRIGGER',
    listen: 'CLICKUP_NEW_TASK_TRIGGER',
  },
  linear: {
    create: 'LINEAR_CREATE_ISSUE',
    issue: 'LINEAR_CREATE_ISSUE',
    list: 'LINEAR_LIST_ISSUES',
    update: 'LINEAR_UPDATE_ISSUE',
  },
  monday: {
    create: 'MONDAY_CREATE_ITEM',
    item: 'MONDAY_CREATE_ITEM',
    list: 'MONDAY_GET_ITEMS',
    update: 'MONDAY_UPDATE_ITEM',
  },
  jira: {
    create: 'JIRA_CREATE_ISSUE',
    issue: 'JIRA_CREATE_ISSUE',
    list: 'JIRA_LIST_ISSUES',
    update: 'JIRA_UPDATE_ISSUE',
    search: 'JIRA_JQL_SEARCH',
  },
  // @NEXUS-FIX-024: Notion tool slug mappings - corrected to actual Composio API slugs - DO NOT REMOVE
  notion: {
    create: 'NOTION_CREATE_PAGE',
    update: 'NOTION_UPDATE_PAGE',
    search: 'NOTION_SEARCH_NOTION_PAGE',  // FIXED: Was NOTION_SEARCH which doesn't exist
    database: 'NOTION_QUERY_DATABASE',
    save: 'NOTION_INSERT_ROW_DATABASE',   // For "save to notion" workflows
    add: 'NOTION_INSERT_ROW_DATABASE',    // For "add to notion" workflows
    insert: 'NOTION_INSERT_ROW_DATABASE', // For "insert into notion" workflows
    log: 'NOTION_INSERT_ROW_DATABASE',    // For "log to notion" workflows
    query: 'NOTION_QUERY_DATABASE',
    fetch: 'NOTION_FETCH_DATABASE',
  },
  // @NEXUS-FIX-024-END
  trello: {
    card: 'TRELLO_CREATE_CARD',
    create: 'TRELLO_CREATE_CARD',
    list: 'TRELLO_GET_BOARD_CARDS',
  },
  asana: {
    task: 'ASANA_CREATE_TASK',
    create: 'ASANA_CREATE_TASK',
    list: 'ASANA_GET_TASKS',
  },
  // Payments & Finance
  stripe: {
    create: 'STRIPE_CREATE_CUSTOMER',
    customer: 'STRIPE_CREATE_CUSTOMER',
    charge: 'STRIPE_CREATE_CHARGE',
    invoice: 'STRIPE_CREATE_INVOICE',
    list: 'STRIPE_LIST_CUSTOMERS',
    subscription: 'STRIPE_CREATE_SUBSCRIPTION',
  },
  quickbooks: {
    create: 'QUICKBOOKS_CREATE_INVOICE',
    invoice: 'QUICKBOOKS_CREATE_INVOICE',
    list: 'QUICKBOOKS_LIST_INVOICES',
    customer: 'QUICKBOOKS_CREATE_CUSTOMER',
  },
  xero: {
    create: 'XERO_CREATE_INVOICE',
    invoice: 'XERO_CREATE_INVOICE',
    list: 'XERO_LIST_INVOICES',
    contact: 'XERO_CREATE_CONTACT',
  },
  // Marketing & Email
  mailchimp: {
    send: 'MAILCHIMP_SEND_CAMPAIGN',
    campaign: 'MAILCHIMP_CREATE_CAMPAIGN',
    add: 'MAILCHIMP_ADD_SUBSCRIBER',
    list: 'MAILCHIMP_LIST_CAMPAIGNS',
  },
  sendgrid: {
    send: 'SENDGRID_SEND_EMAIL',
    email: 'SENDGRID_SEND_EMAIL',
  },
  // Social Media
  twitter: {
    post: 'TWITTER_CREATE_TWEET',
    tweet: 'TWITTER_CREATE_TWEET',
    send: 'TWITTER_CREATE_TWEET',
    list: 'TWITTER_GET_TWEETS',
  },
  linkedin: {
    post: 'LINKEDIN_CREATE_POST',
    share: 'LINKEDIN_CREATE_POST',
    send: 'LINKEDIN_SEND_MESSAGE',
  },
  instagram: {
    post: 'INSTAGRAM_CREATE_POST',
    upload: 'INSTAGRAM_CREATE_POST',
    story: 'INSTAGRAM_CREATE_STORY',
  },
  facebook: {
    post: 'FACEBOOK_CREATE_POST',
    share: 'FACEBOOK_CREATE_POST',
    page: 'FACEBOOK_GET_PAGE',
  },
  // Storage & Documents
  // @NEXUS-FIX-017: Storage action mappings (save/store/write → upload) - DO NOT REMOVE
  dropbox: {
    upload: 'DROPBOX_UPLOAD_FILE',
    save: 'DROPBOX_UPLOAD_FILE',      // Save to Dropbox → upload
    store: 'DROPBOX_UPLOAD_FILE',     // Store in Dropbox → upload
    write: 'DROPBOX_UPLOAD_FILE',     // Write to Dropbox → upload
    create: 'DROPBOX_UPLOAD_FILE',    // Create file → upload
    list: 'DROPBOX_LIST_FOLDER',      // FIXED: LIST_FILES doesn't exist
    download: 'DROPBOX_DOWNLOAD_FILE',
  },
  onedrive: {
    upload: 'ONEDRIVE_UPLOAD_FILE',
    save: 'ONEDRIVE_UPLOAD_FILE',
    store: 'ONEDRIVE_UPLOAD_FILE',
    write: 'ONEDRIVE_UPLOAD_FILE',
    create: 'ONEDRIVE_UPLOAD_FILE',
    list: 'ONEDRIVE_LIST_FILES',
    download: 'ONEDRIVE_DOWNLOAD_FILE',
  },
  // @NEXUS-FIX-017-END
  airtable: {
    create: 'AIRTABLE_CREATE_RECORD',
    list: 'AIRTABLE_LIST_RECORDS',
    update: 'AIRTABLE_UPDATE_RECORD',
    search: 'AIRTABLE_SEARCH_RECORDS',
  },
  // AI & Automation
  openai: {
    generate: 'OPENAI_CHAT_COMPLETION',
    chat: 'OPENAI_CHAT_COMPLETION',
    complete: 'OPENAI_CHAT_COMPLETION',
    image: 'OPENAI_CREATE_IMAGE',
  },
  anthropic: {
    generate: 'ANTHROPIC_CHAT_COMPLETION',
    chat: 'ANTHROPIC_CHAT_COMPLETION',
    complete: 'ANTHROPIC_CHAT_COMPLETION',
  },
  // Voice & Transcription
  deepgram: {
    transcribe: 'DEEPGRAM_TRANSCRIBE',
    audio: 'DEEPGRAM_TRANSCRIBE',
  },
  elevenlabs: {
    generate: 'ELEVENLABS_TEXT_TO_SPEECH',
    speak: 'ELEVENLABS_TEXT_TO_SPEECH',
    voice: 'ELEVENLABS_TEXT_TO_SPEECH',
  },
  // Support
  intercom: {
    send: 'INTERCOM_SEND_MESSAGE',
    message: 'INTERCOM_SEND_MESSAGE',
    create: 'INTERCOM_CREATE_CONVERSATION',
    list: 'INTERCOM_LIST_CONVERSATIONS',
  },
  zendesk: {
    create: 'ZENDESK_CREATE_TICKET',
    ticket: 'ZENDESK_CREATE_TICKET',
    update: 'ZENDESK_UPDATE_TICKET',
    list: 'ZENDESK_LIST_TICKETS',
  },
  freshdesk: {
    create: 'FRESHDESK_CREATE_TICKET',
    ticket: 'FRESHDESK_CREATE_TICKET',
    update: 'FRESHDESK_UPDATE_TICKET',
    list: 'FRESHDESK_LIST_TICKETS',
  },
  // Webhooks (generic - handles via HTTP)
  webhook: {
    send: 'WEBHOOK_TRIGGER',
    trigger: 'WEBHOOK_TRIGGER',
    post: 'WEBHOOK_TRIGGER',
  },

  // @NEXUS-FIX-114: Additional integrations for domain pain points - DO NOT REMOVE
  // These cover the 67 workflow templates across 8 domains (Lawyers, SME Owners, Doctors, etc.)

  // E-commerce
  shopify: {
    create: 'SHOPIFY_CREATE_PRODUCT',
    list: 'SHOPIFY_LIST_PRODUCTS',
    order: 'SHOPIFY_CREATE_ORDER',
    update: 'SHOPIFY_UPDATE_PRODUCT',
    inventory: 'SHOPIFY_UPDATE_INVENTORY',
    trigger: 'SHOPIFY_NEW_ORDER_TRIGGER',
    receive: 'SHOPIFY_NEW_ORDER_TRIGGER',
  },
  woocommerce: {
    create: 'WOOCOMMERCE_CREATE_PRODUCT',
    list: 'WOOCOMMERCE_LIST_PRODUCTS',
    order: 'WOOCOMMERCE_CREATE_ORDER',
    update: 'WOOCOMMERCE_UPDATE_PRODUCT',
    trigger: 'WOOCOMMERCE_NEW_ORDER_TRIGGER',
  },
  square: {
    create: 'SQUARE_CREATE_PAYMENT',
    list: 'SQUARE_LIST_PAYMENTS',
    invoice: 'SQUARE_CREATE_INVOICE',
    customer: 'SQUARE_CREATE_CUSTOMER',
  },

  // Forms & Surveys
  typeform: {
    create: 'TYPEFORM_CREATE_FORM',
    list: 'TYPEFORM_LIST_RESPONSES',
    trigger: 'TYPEFORM_NEW_RESPONSE_TRIGGER',
    receive: 'TYPEFORM_NEW_RESPONSE_TRIGGER',
    response: 'TYPEFORM_LIST_RESPONSES',
  },
  googleforms: {
    create: 'GOOGLEFORMS_CREATE_FORM',
    list: 'GOOGLEFORMS_LIST_RESPONSES',
    trigger: 'GOOGLEFORMS_NEW_RESPONSE_TRIGGER',
    receive: 'GOOGLEFORMS_NEW_RESPONSE_TRIGGER',
  },

  // Scheduling
  calendly: {
    create: 'CALENDLY_CREATE_EVENT',
    list: 'CALENDLY_LIST_EVENTS',
    schedule: 'CALENDLY_CREATE_EVENT',
    trigger: 'CALENDLY_NEW_EVENT_TRIGGER',
    cancel: 'CALENDLY_CANCEL_EVENT',
  },

  // Communication
  twilio: {
    send: 'TWILIO_SEND_SMS',
    sms: 'TWILIO_SEND_SMS',
    call: 'TWILIO_MAKE_CALL',
    message: 'TWILIO_SEND_SMS',
    trigger: 'TWILIO_NEW_SMS_TRIGGER',
  },
  telegram: {
    send: 'TELEGRAM_SEND_MESSAGE',
    message: 'TELEGRAM_SEND_MESSAGE',
    photo: 'TELEGRAM_SEND_PHOTO',
    trigger: 'TELEGRAM_NEW_MESSAGE_TRIGGER',
  },

  // Documents & Signing
  docusign: {
    create: 'DOCUSIGN_CREATE_ENVELOPE',
    send: 'DOCUSIGN_SEND_ENVELOPE',
    sign: 'DOCUSIGN_CREATE_ENVELOPE',
    list: 'DOCUSIGN_LIST_ENVELOPES',
    trigger: 'DOCUSIGN_ENVELOPE_COMPLETED_TRIGGER',
  },

  // Cloud Storage (additional)
  box: {
    upload: 'BOX_UPLOAD_FILE',
    save: 'BOX_UPLOAD_FILE',
    list: 'BOX_LIST_FILES',
    download: 'BOX_DOWNLOAD_FILE',
    create: 'BOX_CREATE_FOLDER',
  },

  // Accounting
  freshbooks: {
    create: 'FRESHBOOKS_CREATE_INVOICE',
    invoice: 'FRESHBOOKS_CREATE_INVOICE',
    list: 'FRESHBOOKS_LIST_INVOICES',
    client: 'FRESHBOOKS_CREATE_CLIENT',
  },

  // Help Desk
  helpscout: {
    create: 'HELPSCOUT_CREATE_CONVERSATION',
    list: 'HELPSCOUT_LIST_CONVERSATIONS',
    send: 'HELPSCOUT_SEND_REPLY',
    trigger: 'HELPSCOUT_NEW_CONVERSATION_TRIGGER',
  },

  // Database
  supabase: {
    create: 'SUPABASE_INSERT_ROW',
    read: 'SUPABASE_SELECT_ROWS',
    update: 'SUPABASE_UPDATE_ROW',
    delete: 'SUPABASE_DELETE_ROW',
    list: 'SUPABASE_SELECT_ROWS',
    insert: 'SUPABASE_INSERT_ROW',
  },
  firebase: {
    create: 'FIREBASE_SET_DATA',
    read: 'FIREBASE_GET_DATA',
    update: 'FIREBASE_UPDATE_DATA',
    delete: 'FIREBASE_DELETE_DATA',
    push: 'FIREBASE_PUSH_DATA',
  },

  // Analytics
  googleanalytics: {
    report: 'GOOGLEANALYTICS_GET_REPORT',
    list: 'GOOGLEANALYTICS_LIST_ACCOUNTS',
    get: 'GOOGLEANALYTICS_GET_REPORT',
    fetch: 'GOOGLEANALYTICS_GET_REPORT',
  },

  // SMS Marketing
  sendinblue: {
    send: 'SENDINBLUE_SEND_EMAIL',
    email: 'SENDINBLUE_SEND_EMAIL',
    sms: 'SENDINBLUE_SEND_SMS',
    campaign: 'SENDINBLUE_CREATE_CAMPAIGN',
  },
  // @NEXUS-FIX-114-END
}

// Common action keywords that hint at the operation type
// COMPREHENSIVE: Includes triggers, listeners, captures, and all common operations
const ACTION_KEYWORDS: Record<string, string> = {
  // READING/FETCHING - Must come BEFORE nouns like 'email' to avoid false matches
  // "Fetch Recent Emails" should match 'fetch' not 'email'
  read: 'read',
  get: 'get',
  fetch: 'fetch',
  retrieve: 'fetch',
  pull: 'fetch',

  // LISTING/SEARCHING
  list: 'list',
  search: 'search',
  find: 'search',
  query: 'search',
  lookup: 'search',

  // SENDING/OUTBOUND - After fetch/read to prevent "Fetch Emails" matching "email->send"
  send: 'send',
  // NOTE: Removed 'email: send' - too broad, causes "Fetch Emails" to map to SEND
  notify: 'notify',
  alert: 'notify',
  message: 'message',
  post: 'post',
  share: 'post',
  publish: 'post',
  broadcast: 'send',

  // CREATING
  create: 'create',
  add: 'create',
  new: 'create',
  make: 'create',
  generate: 'create',

  // READING/FETCHING and LISTING/SEARCHING moved to top of object for priority matching

  // UPDATING
  update: 'update',
  edit: 'update',
  modify: 'update',
  change: 'update',

  // WRITING/SAVING
  write: 'write',
  save: 'save',
  append: 'append',
  log: 'append',
  record: 'append',

  // FILES
  upload: 'upload',
  download: 'download',
  export: 'download',
  import: 'upload',

  // SCHEDULING
  schedule: 'schedule',
  book: 'schedule',
  reserve: 'schedule',

  // CHECKING
  check: 'check',
  verify: 'check',
  validate: 'check',

  // TRIGGERS/LISTENERS/CAPTURES (NEW - Critical for incoming data)
  capture: 'trigger',
  receive: 'trigger',
  listen: 'trigger',
  watch: 'trigger',
  monitor: 'trigger',
  trigger: 'trigger',
  incoming: 'trigger',
  inbound: 'trigger',
  detect: 'trigger',
  await: 'trigger',
  wait: 'trigger',
  on: 'trigger',  // "on new message", "on email received"
  when: 'trigger', // "when order placed"

  // WEBHOOKS
  webhook: 'webhook',
  hook: 'webhook',
  callback: 'webhook',

  // DELETING
  delete: 'delete',
  remove: 'delete',
  clear: 'delete',
  archive: 'archive',

  // @NEXUS-FIX-114: Additional action verbs for domain workflows - DO NOT REMOVE
  // Workflow verbs
  track: 'create',
  sync: 'update',
  backup: 'upload',
  assign: 'update',
  approve: 'update',
  reject: 'update',
  close: 'update',
  open: 'create',
  convert: 'create',
  classify: 'create',
  tag: 'update',
  label: 'update',
  categorize: 'create',
  route: 'send',
  forward: 'send',
  transfer: 'send',
  submit: 'create',
  request: 'create',
  invite: 'send',
  remind: 'send',
  escalate: 'send',
  summarize: 'get',
  compile: 'get',
  collect: 'list',
  gather: 'list',
  aggregate: 'list',
  // @NEXUS-FIX-114-END
}

// @NEXUS-FIX-019 & @NEXUS-FIX-020: Tool validation and fallback system - DO NOT REMOVE
/**
 * Get fallback tool suggestions when a tool is not found
 * FIX-020: Provides alternatives for common tool resolution failures
 */
function getFallbackTools(toolkit: string, originalSlug: string, nodeName: string): string[] {
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
function validateToolSlug(toolSlug: string, toolkit: string): { valid: boolean; suggestion?: string; reason?: string } {
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
function isToolNotFoundError(error: string | Error): boolean {
  const message = typeof error === 'string' ? error : error.message
  return message.toLowerCase().includes('tool') &&
    (message.toLowerCase().includes('not found') ||
     message.toLowerCase().includes('unable to retrieve') ||
     message.toLowerCase().includes('does not exist'))
}
// @NEXUS-FIX-019 & @NEXUS-FIX-020-END

/**
 * Map a node name and toolkit to a Composio tool slug
 *
 * STRATEGY: 3-layer approach to handle "thousands of scenarios"
 * 1. Exact mapping from TOOL_SLUGS (fastest, most reliable)
 * 2. Dynamic construction using Composio naming patterns
 * 3. Intelligent default based on node type/context
 */
function mapNodeToToolSlug(nodeName: string, toolkit: string): string | null {
  const nameLower = nodeName.toLowerCase()
  let toolkitLower = toolkit.toLowerCase()
    .replace(/\s+/g, '')  // "Google Sheets" -> "googlesheets"
    .replace(/-/g, '')     // "click-up" -> "clickup"

  // @NEXUS-FIX-025: Toolkit name aliases for common variations
  const TOOLKIT_ALIASES: Record<string, string> = {
    'calendar': 'googlecalendar',
    'gcal': 'googlecalendar',
    'google_calendar': 'googlecalendar',
    'sheets': 'googlesheets',
    'google_sheets': 'googlesheets',
    'drive': 'googledrive',
    'google_drive': 'googledrive',
    'email': 'gmail',
    'mail': 'gmail',
  }
  toolkitLower = TOOLKIT_ALIASES[toolkitLower] || toolkitLower

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
function constructDynamicToolSlug(nodeName: string, toolkit: string): string | null {
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
function constructGenericToolSlug(nodeName: string, toolkit: string): string {
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

/**
 * Get parameters for a tool - prioritizes extracted params from user intent
 *
 * Priority order:
 * 1. node.config.extractedParams (from Claude's analysis of user message)
 * 2. node.config (explicit configuration)
 * 3. Smart defaults based on tool type
 * 4. Inference from workflow context (name, description)
 */
function getDefaultParams(
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
      // contextForInference includes: node.description, node.name, workflow.description, workflow.name
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
function validateRequiredParams(toolSlug: string, params: Record<string, unknown>): string[] {
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
function extractIdFromUrl(paramName: string, value: string): string {
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

// ============================================================================
// Node Tooltip Component (hover on desktop, click on mobile)
// ============================================================================

function NodeTooltip({
  node,
  isOpen,
  onClose,
  position = 'top',
  useHoverClass = false
}: {
  node: WorkflowNode
  isOpen: boolean
  onClose: () => void
  position?: 'top' | 'bottom' | 'left' | 'right'
  useHoverClass?: boolean  // If true, visibility is controlled by parent's group-hover
}) {
  const typeLabels = {
    trigger: '⚡ Trigger',
    action: '⚙️ Action',
    output: '📤 Output'
  }

  const statusLabels = {
    idle: 'Waiting',
    pending: 'Pending',
    connecting: 'Running...',
    success: 'Complete',
    error: 'Failed'
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-slate-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-slate-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-slate-800'
  }

  // If using CSS hover, always render but control visibility via classes
  // If not using hover, use the isOpen prop to conditionally show
  const shouldShow = useHoverClass || isOpen

  if (!shouldShow && !useHoverClass) return null

  return (
    <>
      {/* Backdrop for mobile - click to close (only when actually open) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          onClick={onClose}
        />
      )}
      {/* @NEXUS-FIX-099: Tooltip popup - larger for readability and touch-friendly - DO NOT REMOVE */}
      <div
        className={cn(
          'absolute z-50 min-w-[240px] max-w-[320px] p-4 rounded-xl pointer-events-none',
          'bg-slate-800/95 backdrop-blur-sm border border-slate-600 shadow-2xl shadow-black/60',
          positionClasses[position],
          // CSS-based visibility when using hover class
          useHoverClass && !isOpen && 'opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-all duration-200',
          // State-based visibility
          !useHoverClass && isOpen && 'opacity-100 visible pointer-events-auto animate-in fade-in zoom-in-95 duration-200',
          // When clicked (isOpen), always show with pointer events
          isOpen && 'opacity-100 visible pointer-events-auto'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow */}
        <div className={cn('absolute w-0 h-0', arrowClasses[position])} />

        {/* Content */}
        <div className="space-y-2">
          {/* @NEXUS-FIX-099: Node name + description - full text with touch-friendly size - DO NOT REMOVE */}
          <div className="flex items-start gap-2">
            <span className="text-xl flex-shrink-0">{getIcon(node.integration)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white break-words leading-snug">{node.name}</p>
              {node.integration && (
                <p className="text-xs text-cyan-400 mt-0.5 capitalize">{node.integration}</p>
              )}
              {/* @NEXUS-FIX-099: Show node description if available */}
              {node.description && (
                <p className="text-xs text-slate-300 mt-2 leading-relaxed break-words">
                  {node.description}
                </p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex items-center gap-3 pt-1 border-t border-slate-700">
            <span className="text-xs text-slate-300">{typeLabels[node.type]}</span>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              node.status === 'success' && 'bg-emerald-500/20 text-emerald-400',
              node.status === 'connecting' && 'bg-amber-500/20 text-amber-400',
              node.status === 'error' && 'bg-red-500/20 text-red-400',
              node.status === 'idle' && 'bg-slate-600/50 text-slate-400',
              node.status === 'pending' && 'bg-blue-500/20 text-blue-400'
            )}>
              {statusLabels[node.status]}
            </span>
          </div>

          {/* Error message if any */}
          {node.error && (
            <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg mt-1">
              {node.error}
            </p>
          )}
        </div>

        {/* Close hint for mobile */}
        <p className="text-[10px] text-slate-500 text-center mt-2 sm:hidden">
          Tap outside to close
        </p>
      </div>
    </>
  )
}

// ============================================================================
// Mini Node Components (Desktop & Mobile)
// ============================================================================

function MiniNodeHorizontal({
  node,
  isLast,
  onRemove,
  canEdit = false,
  onSelect,
  isSelected = false
}: {
  node: WorkflowNode;
  isLast: boolean;
  onRemove?: (nodeId: string) => void;
  canEdit?: boolean;
  onSelect?: (nodeId: string) => void;
  isSelected?: boolean;
}) {
  const colors = statusColors[node.status]
  // @NEXUS-FIX-121: Ref to prevent touch+click double-fire on mobile - DO NOT REMOVE
  const touchFiredRef = React.useRef(false)

  // @NEXUS-FIX-099: Handle touch events for mobile - DO NOT REMOVE
  const handleTouchEnd = React.useCallback(() => {
    // Mark that touch fired so onClick can skip
    touchFiredRef.current = true
    if (onSelect) onSelect(node.id)
    // Reset flag after click event would have fired (~400ms)
    setTimeout(() => { touchFiredRef.current = false }, 400)
  }, [onSelect, node.id])

  const handleClick = React.useCallback(() => {
    // @NEXUS-FIX-121: Skip if this click was triggered by a touch event
    if (touchFiredRef.current) return
    if (onSelect) onSelect(node.id)
  }, [onSelect, node.id])

  return (
    <div className="flex items-center flex-shrink-0 snap-start">
      {/* @NEXUS-FIX-099: Touch-friendly wrapper with min-height 44px for accessibility - DO NOT REMOVE */}
      {/* @NEXUS-FIX-103: Responsive sizing for identical mobile/desktop experience - DO NOT REMOVE */}
      <div className="relative group">
        <div
          className={cn(
            'relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border-2 transition-all duration-500 cursor-pointer',
            'min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px]', // Touch-friendly, slightly smaller on mobile
            colors.bg,
            colors.border,
            node.status === 'connecting' && 'animate-pulse shadow-lg shadow-amber-500/30',
            node.status === 'success' && 'shadow-lg shadow-emerald-500/20',
            isSelected && 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-900 shadow-lg shadow-cyan-500/20',
            'hover:scale-105 hover:shadow-lg active:scale-95' // Active state for touch feedback
          )}
          onClick={handleClick}
          onTouchEnd={handleTouchEnd}
          role="button"
          tabIndex={0}
          aria-label={`${node.name} - ${node.type} - ${node.status}${node.description ? `: ${node.description}` : ''}`}
          aria-expanded={isSelected}
        >
          <span className="text-base sm:text-lg">{getIcon(node.integration)}</span>
          <span className="text-[10px] sm:text-xs font-medium text-white truncate max-w-[80px] sm:max-w-[120px]">
            {node.name}
          </span>
          <div
            className={cn(
              'w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full transition-all duration-300 flex-shrink-0',
              colors.dot,
              node.status === 'connecting' && 'animate-ping'
            )}
          />
        </div>

        {/* Remove button - appears on hover when editing enabled */}
        {canEdit && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              const confirmMsg = node.type === 'trigger'
                ? 'Removing the trigger will disable this workflow. Continue?'
                : `Remove "${node.name}" from workflow?`
              if (window.confirm(confirmMsg)) {
                onRemove(node.id)
              }
            }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
            title="Remove this step"
          >
            ×
          </button>
        )}
      </div>

      {/* @NEXUS-FIX-103: Responsive connector arrows - DO NOT REMOVE */}
      {!isLast && (
        <div className="relative w-5 sm:w-8 h-0.5 mx-0.5 sm:mx-1 flex-shrink-0">
          <div className="absolute inset-0 bg-slate-700 rounded-full" />
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
              colors.line,
              node.status === 'connecting' && 'animate-pulse'
            )}
            style={{
              width: node.status === 'success' ? '100%' : node.status === 'connecting' ? '50%' : '0%',
            }}
          />
          <div
            className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] sm:border-t-[4px] border-t-transparent border-b-[3px] sm:border-b-[4px] border-b-transparent border-l-[4px] sm:border-l-[6px] transition-colors duration-300',
              node.status === 'success'
                ? 'border-l-emerald-500'
                : node.status === 'connecting'
                ? 'border-l-amber-500'
                : 'border-l-slate-600'
            )}
          />
        </div>
      )}
    </div>
  )
}

// @ts-expect-error - MiniNodeVertical kept for future use but not currently rendered (FIX-100 unified to horizontal)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MiniNodeVertical({
  node,
  isLast,
  index,
  onRemove,
  canEdit = false
}: {
  node: WorkflowNode;
  isLast: boolean;
  index: number;
  onRemove?: (nodeId: string) => void;
  canEdit?: boolean;
}) {
  const colors = statusColors[node.status]
  const [showTooltip, setShowTooltip] = React.useState(false)

  // @NEXUS-FIX-099: Handle touch events for mobile - touch shows tooltip
  const handleTouchStart = React.useCallback(() => {
    setShowTooltip(true)
  }, [])

  const handleTouchEnd = React.useCallback(() => {
    // Keep tooltip visible for a moment after touch ends
    setTimeout(() => setShowTooltip(false), 2000)
  }, [])

  return (
    <div className="flex items-start relative group">
      {/* @NEXUS-FIX-099: Touch-friendly icon with min 44px touch target - DO NOT REMOVE */}
      <div className="flex flex-col items-center mr-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 cursor-pointer',
            'min-w-[44px] min-h-[44px]', // Touch-friendly minimum size
            colors.bg,
            colors.border,
            node.status === 'connecting' && 'animate-pulse shadow-lg shadow-amber-500/30',
            node.status === 'success' && 'shadow-md shadow-emerald-500/30',
            'active:scale-95 hover:scale-105'
          )}
          onClick={() => setShowTooltip(!showTooltip)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="button"
          tabIndex={0}
          aria-label={`${node.name} - ${node.type} - ${node.status}${node.description ? `: ${node.description}` : ''}`}
        >
          <span className="text-base">{getIcon(node.integration)}</span>
        </div>

        {!isLast && (
          <div className="relative w-0.5 h-8 my-1">
            <div className="absolute inset-0 bg-slate-700 rounded-full" />
            <div
              className={cn('absolute inset-x-0 top-0 rounded-full transition-all duration-500', colors.line)}
              style={{
                height: node.status === 'success' ? '100%' : node.status === 'connecting' ? '50%' : '0%',
              }}
            />
          </div>
        )}
      </div>

      {/* @NEXUS-FIX-099: Larger touch target for text area - DO NOT REMOVE */}
      <div
        className="flex-1 min-w-0 pt-1 cursor-pointer min-h-[44px] flex flex-col justify-center"
        onClick={() => setShowTooltip(!showTooltip)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">
            {index + 1}. {node.name}
          </span>
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-300',
              colors.dot,
              node.status === 'connecting' && 'animate-ping'
            )}
          />
        </div>
        {node.integration && (
          <span className="text-xs text-cyan-400/70 mt-0.5 block capitalize">{node.integration}</span>
        )}
        {/* @NEXUS-FIX-099: Show description snippet in vertical view */}
        {node.description && (
          <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{node.description}</span>
        )}
      </div>

      {/* Tooltip - positioned to the right on mobile, uses CSS hover + click */}
      <NodeTooltip
        node={node}
        isOpen={showTooltip}
        onClose={() => setShowTooltip(false)}
        position="right"
        useHoverClass={true}
      />

      {/* Remove button - appears on hover when editing enabled */}
      {canEdit && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            const confirmMsg = node.type === 'trigger'
              ? 'Removing the trigger will disable this workflow. Continue?'
              : `Remove "${node.name}" from workflow?`
            if (window.confirm(confirmMsg)) {
              onRemove(node.id)
            }
          }}
          className="absolute top-0 right-0 w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
          title="Remove this step"
        >
          ×
        </button>
      )}
    </div>
  )
}

// ============================================================================
// Auth Prompt Component
// ============================================================================

interface AuthPromptProps {
  integration: IntegrationInfo
  redirectUrl: string | null
  onConnect: () => void
  onSkip: () => void
  connectedCount: number
  totalCount: number
  isLoading: boolean
  isPolling: boolean
  pollAttempts: number
}

function AuthPrompt({
  integration,
  redirectUrl,
  onConnect,
  connectedCount,
  totalCount,
  isLoading,
  isPolling,
  pollAttempts,
}: AuthPromptProps) {
  // Show polling UI when waiting for OAuth to complete
  if (isPolling && redirectUrl) {
    const timeRemaining = Math.max(0, 120 - pollAttempts * 3)
    const minutes = Math.floor(timeRemaining / 60)
    const seconds = timeRemaining % 60

    return (
      <div className="px-4 py-4 space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
            Waiting for authorization
          </span>
          <span className="font-mono text-amber-400">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Animated progress bar */}
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 animate-pulse"
            style={{ width: `${Math.min(100, (pollAttempts / 40) * 100)}%` }}
          />
        </div>

        {/* Waiting card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-900/20 to-amber-800/10 border border-amber-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl animate-bounce"
              style={{ backgroundColor: `${integration.color}20` }}
            >
              {integration.icon}
            </div>
            <div>
              <h4 className="font-semibold text-white">Complete Authorization</h4>
              <p className="text-xs text-amber-400">Waiting for {integration.name} to connect...</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <span className="text-lg">1.</span>
              <span>A new window/tab has opened for {integration.name}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-lg">2.</span>
              <span>Sign in and authorize Nexus to access your account</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-lg">3.</span>
              <span>Once done, this will update automatically</span>
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-amber-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Checking connection status...</span>
          </div>

          {/* Re-open auth link */}
          <a
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full py-2 rounded-lg text-sm font-medium text-center block border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4 inline mr-2" />
            Re-open authorization window
          </a>
        </div>

        {/* Reassurance text */}
        <p className="text-[10px] text-slate-500 text-center">
          Connection will be detected automatically. Don&apos;t close this page.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-400" />
          Setting up your workflow
        </span>
        <span>
          {connectedCount} of {totalCount} connected
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${(connectedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Integration card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${integration.color}20` }}
          >
            {integration.icon}
          </div>
          <div>
            <h4 className="font-semibold text-white">{integration.name}</h4>
            <p className="text-xs text-slate-400">{integration.description}</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-4">{integration.connectMessage}</p>

        {redirectUrl ? (
          <a
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onConnect}
            className={cn(
              'w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
              'bg-gradient-to-r from-purple-500 to-cyan-500 text-white',
              'hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]'
            )}
          >
            <Link2 className="w-4 h-4" />
            Connect {integration.name}
            <ArrowRight className="w-4 h-4" />
          </a>
        ) : (
          <button
            onClick={onConnect}
            disabled={isLoading}
            className={cn(
              'w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
              isLoading
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Getting connection link...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Connect {integration.name}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Reassurance text */}
      <p className="text-[10px] text-slate-500 text-center">
        🔒 Secure OAuth connection. We never see your password.
      </p>
    </div>
  )
}

// ============================================================================
// Parallel Auth Prompt Component (MINIMAL CLICKS - Connect All at Once)
// ============================================================================

interface ParallelAuthPromptProps {
  integrations: IntegrationInfo[]
  parallelState: ParallelAuthState
  onConnectAll: () => void
  onConnectSingle: (integration: IntegrationInfo) => void
  isLoading: boolean
  connectedCount: number
}

function ParallelAuthPrompt({
  integrations,
  parallelState,
  onConnectAll,
  onConnectSingle,
  isLoading,
  connectedCount,
}: ParallelAuthPromptProps) {
  // Total required = pending integrations + already connected integrations
  const totalRequired = integrations.length + connectedCount
  const pendingCount = integrations.length
  const allPolling = integrations.every(i => parallelState[i.id]?.status === 'polling')
  const anyPolling = integrations.some(i => parallelState[i.id]?.status === 'polling')

  // Calculate max time remaining across all polling integrations
  const maxPollAttempts = Math.max(
    ...integrations.map(i => parallelState[i.id]?.pollAttempts || 0)
  )
  const timeRemaining = Math.max(0, 120 - maxPollAttempts * 3)
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  // @NEXUS-UX-003: OAuth prompt with VIP hospitality - DO NOT REMOVE
  return (
    <div className="px-4 py-4 space-y-4">
      {/* @NEXUS-UX-003: Exciting header - connection unlocks superpowers */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-400" />
          {anyPolling ? '✨ Almost there...' : '🔓 Unlock Your Workflow'}
        </span>
        <span className="flex items-center gap-2">
          {anyPolling && (
            <span className="font-mono text-amber-400">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          )}
          <span className="text-emerald-400">{connectedCount}/{totalRequired} ready</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500',
            anyPolling
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 animate-pulse'
              : 'bg-gradient-to-r from-purple-500 to-cyan-500'
          )}
          style={{ width: `${(connectedCount / totalRequired) * 100}%` }}
        />
      </div>

      {/* Integration grid - show all at once */}
      <div className="space-y-2">
        {integrations.map((integration) => {
          const state = parallelState[integration.id] || { status: 'pending', pollAttempts: 0 }
          const isConnected = state.status === 'connected'
          const isPolling = state.status === 'polling'
          const hasError = state.status === 'error'

          return (
            <div
              key={integration.id}
              className={cn(
                'p-3 rounded-xl border transition-all duration-300',
                isConnected
                  ? 'bg-emerald-900/20 border-emerald-500/30'
                  : isPolling
                  ? 'bg-amber-900/20 border-amber-500/30'
                  : hasError
                  ? 'bg-red-900/20 border-red-500/30'
                  : 'bg-slate-800/50 border-slate-700'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${integration.color}20` }}
                  >
                    {integration.icon}
                  </div>
                  {/* @NEXUS-UX-003: Friendly status messages - DO NOT REMOVE */}
                  <div>
                    <h4 className="font-medium text-white text-sm">{integration.name}</h4>
                    <p className="text-xs text-slate-400">
                      {isConnected
                        ? '✅ Ready to go!'
                        : isPolling
                        ? '🔄 Complete sign-in in the popup...'
                        : hasError
                        ? `⚠️ ${state.error || 'Let\'s try again'}`
                        : '🔗 One click to connect'}
                    </p>
                  </div>
                </div>

                {/* Status indicator or action button */}
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : isPolling ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                      {state.authUrl && (
                        <a
                          href={state.authUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-amber-400 hover:underline"
                        >
                          Re-open
                        </a>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onConnectSingle(integration)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* @NEXUS-UX-003: Connect All Button with exciting copy - DO NOT REMOVE */}
      {pendingCount > 0 && !allPolling && (
        <button
          onClick={onConnectAll}
          disabled={isLoading || anyPolling}
          className={cn(
            'w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
            isLoading || anyPolling
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing secure connections...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              {pendingCount === 1 ? 'Connect & Unlock →' : `Connect All ${pendingCount} Apps →`}
            </>
          )}
        </button>
      )}

      {/* @NEXUS-UX-003: Polling instructions with friendly guidance - DO NOT REMOVE */}
      {anyPolling && (
        <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/20">
          <div className="text-sm text-amber-200">
            <p className="font-medium mb-1">👆 Complete the sign-in in the popup windows</p>
            <p className="text-xs text-amber-300/70">
              Just click "Allow" or "Authorize" in each window. This page updates automatically when done!
            </p>
          </div>
        </div>
      )}

      {/* @NEXUS-UX-003: Reassurance with friendlier tone - DO NOT REMOVE */}
      <p className="text-[10px] text-slate-500 text-center">
        🔒 Your passwords stay with {pendingCount > 1 ? 'the apps' : 'the app'} — we only get permission to automate tasks for you
      </p>
    </div>
  )
}

// ============================================================================
// Missing Info Section with Custom Input Support
// ============================================================================

// @NEXUS-FIX-108: Accept collectedParams to check already-answered questions from Quick Setup - DO NOT REMOVE
function MissingInfoSection({
  missingInfo,
  onSelect,
  collectedParams = {}
}: {
  missingInfo: MissingInfoItem[]
  onSelect?: (field: string, value: string) => void
  collectedParams?: Record<string, string>
}) {
  // ONE STEP AT A TIME: Track answered fields to show next unanswered
  // Track which fields have custom input expanded
  const [showCustomInput, setShowCustomInput] = React.useState(false)
  // Track custom input value
  const [customValue, setCustomValue] = React.useState('')
  // Track answered fields (local state for answers given within this component)
  const [localAnsweredFields, setLocalAnsweredFields] = React.useState<Set<string>>(new Set())

  // @NEXUS-FIX-105: Deduplicate missingInfo questions semantically - DO NOT REMOVE
  // @NEXUS-FIX-108: Also check collectedParams from Quick Setup - DO NOT REMOVE
  // Get remaining unanswered questions with semantic deduplication
  const seenCanonicalFields = new Set<string>()
  const unansweredQuestions = missingInfo.filter(item => {
    // Check if answered locally (within this component)
    if (localAnsweredFields.has(item.field)) return false

    // FIX-108: Check if already collected via Quick Setup using canonical name matching
    const canonicalField = getCanonicalParamName(item.field)

    // Check if any collected param matches this canonical field
    for (const [key, value] of Object.entries(collectedParams)) {
      if (value && value !== '') {
        const collectedCanonical = getCanonicalParamName(key)
        if (collectedCanonical === canonicalField || key === item.field) {
          console.log(`[FIX-108] Skipping missingInfo "${item.field}" - already collected as "${key}": ${value}`)
          return false
        }
      }
    }

    // FIX-105: Check for semantic duplicates within missingInfo
    if (seenCanonicalFields.has(canonicalField)) {
      console.log(`[FIX-105] Deduplicating missingInfo: ${item.field} → canonical: ${canonicalField}`)
      return false
    }
    seenCanonicalFields.add(canonicalField)
    return true
  })

  // Get current question (first unanswered)
  const currentQuestion = unansweredQuestions[0]

  // Check if an option is a "custom" type option
  const isCustomOption = (option: string): boolean => {
    const lower = option.toLowerCase()
    return lower.includes('custom') || lower.includes('other') || lower.includes('specify')
  }

  const handleOptionClick = (field: string, option: string) => {
    if (isCustomOption(option)) {
      setShowCustomInput(true)
    } else {
      // Submit and move to next question
      onSelect?.(field, option)
      setLocalAnsweredFields(prev => new Set(prev).add(field))
      setShowCustomInput(false)
      setCustomValue('')
    }
  }

  const handleCustomSubmit = (field: string) => {
    const value = customValue.trim()
    if (value) {
      onSelect?.(field, value)
      setLocalAnsweredFields(prev => new Set(prev).add(field))
      setShowCustomInput(false)
      setCustomValue('')
    }
  }

  const handleCustomCancel = () => {
    setShowCustomInput(false)
    setCustomValue('')
  }

  // All questions answered
  if (!currentQuestion) {
    return null
  }

  // FIX-108: Progress based on answered vs total questions (clamped to 0-100%)
  const progressPercent = missingInfo.length > 0 ? Math.min(100, Math.round(((missingInfo.length - unansweredQuestions.length) / missingInfo.length) * 100)) : 0
  const remaining = unansweredQuestions.length

  // @NEXUS-UX-002: Parameter collection with VIP hospitality - DO NOT REMOVE
  return (
    <div className="px-4 pb-3">
      <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 space-y-4">
        {/* @NEXUS-UX-002: Friendly header */}
        <div className="flex items-center gap-2 text-xs text-cyan-400">
          <span>🎯 Quick Question</span>
          {missingInfo.length > 1 && (
            <span className="text-slate-500">• {remaining} {remaining === 1 ? 'question' : 'questions'} to go</span>
          )}
        </div>

        {/* Progress indicator - friendly, not overwhelming */}
        {missingInfo.length > 1 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {remaining === 1 ? '🎉 Last one!' : `${progressPercent}% done`}
            </span>
          </div>
        )}

        {/* Current question - one at a time */}
        <div className="space-y-3">
          <p className="text-sm text-white font-medium">
            {currentQuestion.question}
          </p>

          {/* Show custom input if expanded */}
          {showCustomInput ? (
            <div className="space-y-3">
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomSubmit(currentQuestion.field)
                  if (e.key === 'Escape') handleCustomCancel()
                }}
                placeholder="Type your answer..."
                className="w-full px-4 py-3 text-sm rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder-slate-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleCustomSubmit(currentQuestion.field)}
                  disabled={!customValue.trim()}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-sm rounded-lg font-medium transition-all",
                    customValue.trim()
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25"
                      : "bg-slate-700 text-slate-400 cursor-not-allowed"
                  )}
                >
                  Continue →
                </button>
                <button
                  onClick={handleCustomCancel}
                  className="px-4 py-2.5 text-sm rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            /* Show option buttons - clean, one question at a time */
            <div className="flex flex-wrap gap-2">
              {currentQuestion.options.map((option, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => handleOptionClick(currentQuestion.field, option)}
                  className={cn(
                    "px-4 py-2.5 text-sm rounded-lg border transition-all font-medium",
                    isCustomOption(option)
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30 hover:border-purple-400"
                      : "bg-slate-700/50 text-white border-slate-600 hover:bg-slate-600 hover:border-cyan-500/50"
                  )}
                >
                  {option}
                </button>
              ))}
              {/* Always add a "Type my own" option if none exists */}
              {!currentQuestion.options.some(isCustomOption) && (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="px-4 py-2.5 text-sm rounded-lg bg-transparent text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all"
                >
                  Type my own...
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Trigger Sample Data Collection
// ============================================================================

/**
 * Get expected sample data fields for a trigger node based on its type
 * This data will flow through the workflow during beta testing
 */
function getTriggerSampleFields(nodeName: string, toolkit: string): Array<{field: string, label: string, placeholder: string}> {
  const nameLower = nodeName.toLowerCase()
  const toolkitLower = toolkit.toLowerCase()

  // WhatsApp triggers
  if (toolkitLower.includes('whatsapp') || nameLower.includes('whatsapp')) {
    return [
      { field: 'from', label: 'From (phone number)', placeholder: '+965-1234-5678' },
      { field: 'message', label: 'Message content', placeholder: 'Hi, I am interested in your services...' },
      { field: 'sender_name', label: 'Sender name', placeholder: 'Ahmed Al-Sabah' },
    ]
  }

  // Email triggers
  if (toolkitLower.includes('gmail') || toolkitLower.includes('email') || nameLower.includes('email')) {
    return [
      { field: 'from', label: 'From (email)', placeholder: 'client@example.com' },
      { field: 'subject', label: 'Subject', placeholder: 'Inquiry about services' },
      { field: 'body', label: 'Email body', placeholder: 'Hello, I would like to learn more...' },
    ]
  }

  // Slack triggers
  if (toolkitLower.includes('slack') || nameLower.includes('slack')) {
    return [
      { field: 'channel', label: 'Channel', placeholder: '#general' },
      { field: 'user', label: 'User', placeholder: 'john.doe' },
      { field: 'message', label: 'Message', placeholder: 'Hey team, we have a new request...' },
    ]
  }

  // @NEXUS-UX-002: Webhook/generic triggers - friendly labels - DO NOT REMOVE
  // Don't show scary JSON to users - use simple text format
  return [
    { field: 'data', label: 'What event triggered this workflow?', placeholder: 'e.g., "New order received" or "Form submitted"' },
  ]
}

/**
 * Component for collecting trigger sample data
 */
function TriggerSampleDataPrompt({
  node,
  toolkit,
  onSubmit,
  onCancel,
}: {
  node: { id: string; name: string }
  toolkit: string
  onSubmit: (nodeId: string, data: Record<string, string>) => void
  onCancel: () => void
}) {
  const fields = getTriggerSampleFields(node.name, toolkit)
  const [values, setValues] = React.useState<Record<string, string>>({})

  const handleSubmit = () => {
    // Only submit non-empty values
    const filledValues: Record<string, string> = {}
    for (const field of fields) {
      if (values[field.field]?.trim()) {
        filledValues[field.field] = values[field.field].trim()
      }
    }
    onSubmit(node.id, filledValues)
  }

  const hasAnyValue = Object.values(values).some(v => v?.trim())

  // @NEXUS-UX-002: Sample data prompt with friendly UX - DO NOT REMOVE
  return (
    <div className="px-4 pb-4">
      <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 space-y-4">
        {/* @NEXUS-UX-002: Friendly header with celebration vibe */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">🎯 Let's Test It!</h4>
            <p className="text-xs text-slate-400 mt-1">
              I'll simulate what happens when "{node.name}" triggers. Fill in some sample data or skip to use defaults.
            </p>
          </div>
        </div>

        {/* @NEXUS-UX-002: Quick fill example buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] text-slate-500 w-full mb-1">Quick fill with example:</span>
          {fields.slice(0, 1).map((_field) => (
            <button
              key="prefill"
              onClick={() => {
                const prefillValues: Record<string, string> = {}
                fields.forEach(f => {
                  prefillValues[f.field] = f.placeholder
                })
                setValues(prefillValues)
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
            >
              ✨ Use Example Data
            </button>
          ))}
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all"
          >
            ⏭️ Skip (Use Defaults)
          </button>
        </div>

        {/* Input fields - now with smarter placeholders */}
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.field}>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {field.label}
              </label>
              {field.field === 'body' || field.field === 'message' || field.field === 'data' ? (
                <textarea
                  value={values[field.field] || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, [field.field]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 placeholder-slate-500 resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={values[field.field] || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, [field.field]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 placeholder-slate-500"
                />
              )}
            </div>
          ))}
        </div>

        {/* @NEXUS-UX-002: Action buttons - more prominent Skip option */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            disabled={!hasAnyValue}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm rounded-lg font-medium transition-all",
              hasAnyValue
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/25"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            )}
          >
            🚀 Test With This Data
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm rounded-lg bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30 transition-all font-medium"
          >
            ✓ Skip & Continue
          </button>
        </div>

        <p className="text-[10px] text-slate-500 text-center">
          💡 Tip: Skipping uses smart defaults. You can always customize later!
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// @NEXUS-FIX-029: Map collected params from integration names to actual tool param names - DO NOT REMOVE
// Problem: User answers stored under integration name (e.g., {gmail: 'user@email.com'})
//          but tools expect specific param names (e.g., {to: 'user@email.com'})
// Solution: Map integration names to primary required parameters
// ============================================================================

/**
 * Map collected params from integration-keyed format to tool parameter format
 * e.g., { gmail: 'user@email.com' } → { to: 'user@email.com' }
 */
function mapCollectedParamsToToolParams(
  collectedParams: Record<string, string> | undefined,
  toolkit: string,
  _toolSlug: string  // Reserved for future tool-specific mapping
): Record<string, unknown> {
  if (!collectedParams) return {}

  // Define mapping from integration name to primary param name
  // @NEXUS-FIX-029: Integration → Primary param mapping
  const integrationToPrimaryParam: Record<string, string> = {
    gmail: 'to',
    sendgrid: 'to',
    slack: 'channel',
    whatsapp: 'to',
    discord: 'channel_id',
    teams: 'channel_id',
    googlesheets: 'spreadsheet_id',
    googlecalendar: 'summary',
    zoom: 'topic',
    clickup: 'list_id',
    linear: 'team_id',
    jira: 'project_key',
    asana: 'workspace',
    trello: 'list_id',
    github: 'owner',
    hubspot: 'email',
    salesforce: 'object_type',
    pipedrive: 'title',
    stripe: 'email',
    mailchimp: 'email',
    twitter: 'text',
    linkedin: 'text',
    deepgram: 'audio_url',
    elevenlabs: 'text',
    zendesk: 'subject',
    freshdesk: 'subject',
    intercom: 'body',
  }

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(collectedParams)) {
    // Skip internal tracking fields
    if (key.startsWith('_')) continue

    // Move 6.16b: Handle nodeId.paramName format (task-specific params)
    // Format: "node_123.to" → extract "to" as the param name
    const nodeParamMatch = key.match(/^[a-zA-Z0-9_]+\.(\w+)$/)
    if (nodeParamMatch) {
      const paramName = nodeParamMatch[1]
      console.log(`[Move 6.16b] Extracted task-specific param: ${key} → ${paramName} = ${value}`)
      result[paramName] = value
      continue
    }

    // Check if this key is an integration name that needs mapping
    const keyLower = key.toLowerCase()
    const mappedParam = integrationToPrimaryParam[keyLower]

    if (mappedParam) {
      // @NEXUS-FIX-097: Don't overwrite valid values with placeholders - DO NOT REMOVE
      // When "whatsapp" maps to "to", check if we already have a valid phone number
      // and the new value is just a placeholder like "I'll provide a phone number"
      const isPlaceholder = typeof value === 'string' && (
        value.toLowerCase().includes("i'll provide") ||
        value.toLowerCase().includes("i will provide") ||
        value.toLowerCase().includes("provide a") ||
        value.toLowerCase().includes("enter a") ||
        value.toLowerCase().includes("select") ||
        value === ''
      )
      const existingValue = result[mappedParam]
      const existingIsValidData = existingValue && typeof existingValue === 'string' &&
        !existingValue.toLowerCase().includes("provide") &&
        existingValue.length > 0 &&
        (existingValue.startsWith('+') || existingValue.includes('@') || /^\d/.test(existingValue))

      if (isPlaceholder && existingIsValidData) {
        console.log(`[FIX-097] Skipping placeholder "${value}" - keeping existing value "${existingValue}" for ${mappedParam}`)
      } else {
        // Map integration name to param name
        console.log(`[FIX-029] Mapping collected param: ${key} → ${mappedParam} = ${value}`)
        result[mappedParam] = value
      }
    } else if (keyLower === 'value') {
      // Generic 'value' key - try to map based on current toolkit
      const toolkitParam = integrationToPrimaryParam[toolkit.toLowerCase()]
      if (toolkitParam) {
        console.log(`[FIX-029] Mapping generic value to toolkit param: ${toolkitParam} = ${value}`)
        result[toolkitParam] = value
      } else {
        // Last resort - keep as-is, might be a direct param name
        result[key] = value
      }
    } else {
      // Keep as-is - might already be a param name
      result[key] = value

      // @NEXUS-FIX-050: Reverse alias mapping for semantic param names - DO NOT REMOVE
      // Maps user-friendly names (what AI collected) to actual API param names
      // e.g., notification_details → text, message → text
      const REVERSE_ALIASES: Record<string, string> = {
        notification_details: 'text',
        notification_content: 'text',  // @NEXUS-FIX-050 extension: AI Quick Questions compatibility
        notification_message: 'text',
        slack_message: 'text',
        message_text: 'text',
        message: 'text',
        content: 'body',
        post_content: 'body',
        email_body: 'body',
        slack_channel: 'channel',
        channel_name: 'channel',
        destination_channel: 'channel',
        recipient: 'to',
        recipient_email: 'to',
        send_to: 'to',
        email_to: 'to',
        email_address: 'to',
        email_subject: 'subject',
        subject_line: 'subject',
        file_path: 'path',
        folder_path: 'path',
        dropbox_path: 'path',
        onedrive_path: 'path',
        sheet_id: 'spreadsheet_id',
        google_sheet: 'spreadsheet_id',
        spreadsheet_url: 'spreadsheet_id',
        notion_page: 'page_id',
        page_url: 'page_id',
        repository: 'repo',
        github_repo: 'repo',
        repo_name: 'repo',
      }

      const apiParamName = REVERSE_ALIASES[keyLower]
      if (apiParamName) {
        console.log(`[FIX-050] Reverse alias mapping: ${key} → ${apiParamName} = ${value}`)
        result[apiParamName] = value
      }
    }
  }

  // @NEXUS-FIX-118: Apply URL-to-ID extraction on all values as safety net - DO NOT REMOVE
  // Even if handlePreFlightAnswer already extracted, this catches params from other sources
  // (e.g., chatbot Quick Questions, AI-inferred params, node config)
  for (const [key, val] of Object.entries(result)) {
    if (typeof val === 'string' && val.includes('://')) {
      const extracted = extractIdFromUrl(key, val)
      if (extracted !== val) {
        console.log(`[FIX-118] URL extraction in param mapping: ${key} → ${extracted}`)
        result[key] = extracted
      }
    }
  }

  return result
}

// ============================================================================
// @NEXUS-FIX-042/043: New Service Integration Helpers
// These wrap the new architecture services while maintaining backwards compatibility
// ============================================================================

/**
 * @NEXUS-GENERIC-ORCHESTRATION: Async resolution with orchestration fallback
 *
 * Resolution priority:
 *   1. If toolkit is known (in TOOL_SLUGS) → Use legacy sync resolution
 *   2. If toolkit is unknown AND USE_GENERIC_ORCHESTRATION → Try orchestration
 *   3. Fallback to dynamic slug construction
 *
 * NOTE: Prepared for Phase 3 integration when executeWorkflow uses async resolution
 */
// Exported for Phase 3 integration and testing
export async function resolveToolWithOrchestration(
  nodeName: string,
  toolkit: string
): Promise<{ slug: string | null; source: 'orchestration' | 'registry' | 'legacy'; questions?: CollectionQuestion[] }> {
  const toolkitLower = toolkit.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')

  // Check if toolkit is known in static mappings
  if (isToolkitKnown(toolkitLower)) {
    // Use legacy resolution for known toolkits (fast path)
    const legacySlug = mapNodeToToolSlug(nodeName, toolkit)
    return { slug: legacySlug, source: 'legacy' }
  }

  // For unknown toolkits, try orchestration if enabled
  if (USE_GENERIC_ORCHESTRATION) {
    const orchResult = await resolveToolViaOrchestration(nodeName, toolkit)
    if (orchResult) {
      console.log(`[ORCHESTRATION] Resolved unknown toolkit "${toolkit}" via orchestration: ${orchResult.slug}`)
      return {
        slug: orchResult.slug,
        source: 'orchestration',
        questions: orchResult.questions
      }
    }
  }

  // Fallback to legacy dynamic construction
  const legacySlug = mapNodeToToolSlug(nodeName, toolkit)
  return { slug: legacySlug, source: 'legacy' }
}

/**
 * Resolve tool slug using UnifiedToolRegistry with fallback to legacy mapNodeToToolSlug
 * @NEXUS-FIX-042: UnifiedToolRegistry integration - DO NOT REMOVE
 *
 * NOTE: Function prepared for Phase 5 integration when executeWorkflow is refactored.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _resolveToolSlugWithRegistry(
  nodeName: string,
  toolkit: string,
  action?: string
): { slug: string | null; contract: ToolContract | null; source: 'registry' | 'legacy' } {
  const toolkitLower = toolkit.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')

  // Try UnifiedToolRegistry first (new architecture)
  try {
    // Infer action from node name if not provided
    const inferredAction = action || inferActionFromNodeName(nodeName)

    const resolution = UnifiedToolRegistryService.resolveToolContract(toolkitLower, inferredAction)
    if (resolution && resolution.success && resolution.contract) {
      console.log(`[FIX-042] Resolved via UnifiedToolRegistry: ${resolution.slug}`)
      return { slug: resolution.slug, contract: resolution.contract, source: 'registry' }
    }
  } catch (e) {
    console.debug(`[FIX-042] UnifiedToolRegistry lookup failed, falling back to legacy:`, e)
  }

  // Fallback to legacy mapNodeToToolSlug
  const legacySlug = mapNodeToToolSlug(nodeName, toolkit)
  return { slug: legacySlug, contract: null, source: 'legacy' }
}

/**
 * Infer action from node name for registry lookup
 */
function inferActionFromNodeName(nodeName: string): string {
  const nameLower = nodeName.toLowerCase()

  // Map node name patterns to standard actions
  if (/send|email|message|notify|post/.test(nameLower)) return 'send'
  if (/create|add|new|make/.test(nameLower)) return 'create'
  if (/update|edit|modify|change/.test(nameLower)) return 'update'
  if (/delete|remove|clear/.test(nameLower)) return 'delete'
  if (/list|get|fetch|read|retrieve/.test(nameLower)) return 'list'
  if (/search|find|query|lookup/.test(nameLower)) return 'search'
  if (/trigger|capture|receive|listen|watch|incoming|monitor/.test(nameLower)) return 'trigger'
  if (/upload|save|store/.test(nameLower)) return 'upload'
  if (/download/.test(nameLower)) return 'download'
  if (/transcribe/.test(nameLower)) return 'transcribe'
  if (/generate|synthesize/.test(nameLower)) return 'generate'

  return 'default'
}

/**
 * Resolve ALL parameters using ParamResolutionPipeline with fallback to legacy logic
 * @NEXUS-FIX-043: ParamResolutionPipeline integration - DO NOT REMOVE
 *
 * This fixes GAP 10 (all params, not just primary) and GAP 11 (defined priority)
 *
 * NOTE: Function prepared for Phase 5 integration when executeWorkflow is refactored.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _resolveParamsWithPipeline(
  toolSlug: string,
  toolkit: string,
  node: WorkflowNode,
  collectedParams: Record<string, string> | undefined,
  workflowContext?: { name: string; description: string }
): Promise<{ params: Record<string, unknown>; source: 'pipeline' | 'legacy'; resolved: ResolvedParams | null }> {
  // Try ParamResolutionPipeline first (new architecture - fixes GAP 10 & 11)
  try {
    // Get tool contract from registry
    const action = inferActionFromNodeName(node.name)
    const resolution = UnifiedToolRegistryService.resolveToolContract(toolkit.toLowerCase(), action)

    if (resolution && resolution.success && resolution.contract) {
      // Build sources object with all available param sources
      const sources = {
        userProvided: collectedParams || {},
        nodeConfig: (node.config || {}) as Record<string, string>,
        workflowContext: workflowContext ? {
          workflow_name: workflowContext.name,
          workflow_description: workflowContext.description,
        } : {},
      }

      // Use pipeline to resolve ALL params with defined priority
      const resolved = await ParamResolutionPipeline.resolve(resolution.contract, sources)

      // Check if pipeline found required params (missingRequired is string[] of param names)
      if (resolved.missingRequired.length === 0 || Object.keys(resolved.params).length > 0) {
        console.log(`[FIX-043] Resolved ${Object.keys(resolved.params).length} params via ParamResolutionPipeline`)
        return { params: resolved.params, source: 'pipeline', resolved }
      }
    }
  } catch (e) {
    console.debug(`[FIX-043] ParamResolutionPipeline failed, falling back to legacy:`, e)
  }

  // Fallback to legacy param resolution
  const defaultParams = getDefaultParams(toolSlug, node, undefined, workflowContext)
  const collectedToolParams = mapCollectedParamsToToolParams(collectedParams, toolkit, toolSlug)
  const legacyParams = { ...defaultParams, ...collectedToolParams }

  return { params: legacyParams, source: 'legacy', resolved: null }
}

/**
 * Get ALL missing params with user-friendly prompts using new architecture
 * @NEXUS-FIX-043: Uses ParamResolutionPipeline for complete param detection
 *
 * NOTE: Function prepared for Phase 5 integration when executeWorkflow is refactored.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _getEnhancedMissingParams(
  resolved: ResolvedParams | null,
  toolkit: string,
  fallbackMissing: string[]
): Array<{ name: string; displayName: string; prompt: string; required: boolean }> {
  // If we have pipeline result, use its missingRequired (string array of param names)
  if (resolved && resolved.missingRequired.length > 0) {
    // Convert string[] to enhanced format using resolutionSteps for context
    return resolved.missingRequired.map(missingParam => {
      // Try to find display info from resolution steps (uses paramName property)
      const step = resolved.resolutionSteps.find(s => s.paramName === missingParam)
      return {
        name: missingParam,
        displayName: step?.displayName || missingParam.replace(/_/g, ' ').replace(/\bid\b/gi, 'ID'),
        prompt: getParamFixSuggestion(missingParam, toolkit),
        required: true,
      }
    })
  }

  // Fallback: Convert legacy missing params to enhanced format
  return fallbackMissing.map(param => ({
    name: param,
    displayName: param.replace(/_/g, ' ').replace(/\bid\b/gi, 'ID'),
    prompt: getParamFixSuggestion(param, toolkit),
    required: true,
  }))
}

// ============================================================================
// Pre-Execution Validation Types
// ============================================================================

interface NodeValidation {
  nodeId: string
  nodeName: string
  isValid: boolean
  hasToolMapping: boolean
  toolSlug: string | null  // The resolved tool slug
  isDynamicSlug: boolean   // True if constructed dynamically (not from static mapping)
  missingParams: string[]
  suggestedFixes: string[]
  toolkit: string
}

interface WorkflowValidation {
  isValid: boolean
  allNodesHaveTools: boolean
  allParamsProvided: boolean
  hasDynamicSlugs: boolean  // True if any node uses a dynamically constructed slug
  nodes: NodeValidation[]
  blockers: string[]  // Human-readable blockers
  warnings: string[]  // Non-blocking warnings
  canExecute: boolean
}

/**
 * Check if a tool slug is from static mapping or dynamically constructed
 */
function isStaticMapping(toolSlug: string, toolkit: string): boolean {
  const toolkitLower = toolkit.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/-/g, '')
  const toolkitTools = TOOL_SLUGS[toolkitLower]
  if (!toolkitTools) return false
  return Object.values(toolkitTools).includes(toolSlug)
}

/**
 * Validate the entire workflow BEFORE showing Execute button
 *
 * NEW BEHAVIOR (v2):
 * - With dynamic slug construction, we ALWAYS have a tool slug
 * - Validation focuses on toolkit recognition and param availability
 * - Dynamic slugs work but may fail at runtime if Composio doesn't have that exact tool
 */
function validateWorkflowBeforeExecution(
  workflowNodes: Array<{ id: string; name: string; type: string; integration?: string }>,
): WorkflowValidation {
  const nodeValidations: NodeValidation[] = []
  const warnings: string[] = []
  let allNodesHaveTools = true
  let allParamsProvided = true
  let hasDynamicSlugs = false

  for (const node of workflowNodes) {
    const integrationInfo = getIntegrationInfo(node.integration || node.name)
    const toolSlug = mapNodeToToolSlug(node.name, integrationInfo.toolkit)

    // Check if this is a dynamic slug (not from static mapping)
    const isDynamicSlug = toolSlug ? !isStaticMapping(toolSlug, integrationInfo.toolkit) : false
    if (isDynamicSlug) {
      hasDynamicSlugs = true
      // Add warning but don't block execution
      warnings.push(
        `"${node.name}" uses an auto-detected tool (${toolSlug}). ` +
        `This will be verified at runtime.`
      )
    }

    // Get expected params for this tool
    const mockParams: Record<string, unknown> = {}
    const missingParams = toolSlug ? validateRequiredParams(toolSlug, mockParams) : []

    // INTENT-DRIVEN APPROACH: Don't block based on unknown integrations
    // The AI/backend will determine optimal tools at runtime
    // User describes WHAT they want, Nexus figures out HOW
    const hasToolMapping = !!toolSlug
    const isUnknownIntegration = integrationInfo.toolkit === 'unknown' ||
      integrationInfo.toolkit === 'default' ||
      !integrationInfo.name

    // Always valid if we have any tool mapping - let runtime handle specifics
    const isValid = hasToolMapping

    // Unknown integrations are just warnings, NOT blockers
    // The AI will intelligently determine the right tool at execution time
    if (isUnknownIntegration && !toolSlug) {
      warnings.push(
        `"${node.name}" - I'll determine the best approach when executing`
      )
    }

    // Generate suggested fixes for missing params
    const suggestedFixes: string[] = []
    for (const param of missingParams) {
      const fix = getParamFixSuggestion(param, integrationInfo.toolkit)
      if (fix) suggestedFixes.push(fix)
    }

    nodeValidations.push({
      nodeId: node.id,
      nodeName: node.name,
      isValid,
      hasToolMapping,
      toolSlug,
      isDynamicSlug,
      missingParams,
      suggestedFixes,
      toolkit: integrationInfo.toolkit,
    })
  }

  // INTENT-DRIVEN: Always allow execution if workflow has nodes
  // The AI will figure out optimal tools at runtime
  // User describes the WHAT, Nexus determines the HOW
  const canExecute = nodeValidations.length > 0

  return {
    isValid: canExecute,
    allNodesHaveTools,
    allParamsProvided,
    hasDynamicSlugs,
    nodes: nodeValidations,
    blockers: [],  // No blockers - intent-driven system handles everything
    warnings,
    canExecute,  // Always executable if we have steps
  }
}

/**
 * Get human-readable fix suggestion for a missing parameter
 */
function getParamFixSuggestion(param: string, toolkit: string): string {
  const suggestions: Record<string, Record<string, string>> = {
    gmail: {
      to: 'Tell me the email address to send to',
      subject: 'What should the email subject be?',
      body: 'What message should I include in the email?',
    },
    slack: {
      channel: 'Which Slack channel should I post to? (e.g., #general)',
      text: 'What message should I send?',
    },
    whatsapp: {
      to: 'What phone number should I send the WhatsApp message to?',
      message: 'What message should I send?',
    },
    clickup: {
      list_id: 'Which ClickUp list should I create the task in?',
      name: 'What should the task be called?',
    },
    googlesheets: {
      // @NEXUS-FIX-021: User-friendly spreadsheet prompt - DO NOT REMOVE
      spreadsheet_id: 'Which Google Sheet should I use? (Paste the URL from your browser)',
      range: 'Which cells should I use? (e.g., "Sheet1" for whole sheet, or "A1:D10" for specific range)',
    },
    googlecalendar: {
      summary: 'What should the event be called?',
      start_datetime: 'When should the event start?',
      end_datetime: 'When should the event end?',
    },
    github: {
      owner: 'What GitHub username or organization owns the repository?',
      repo: 'What is the repository name?',
      title: 'What should the issue title be?',
      body: 'What details should be in the issue description?',
    },
    notion: {
      page_id: 'Which Notion page should I use? (Paste the page URL)',
      database_id: 'Which Notion database should I use? (Paste the database URL)',
      title: 'What should the page/item be called?',
    },
    dropbox: {
      path: 'Where in Dropbox should I save this? (e.g., /Documents/MyFolder)',
      folder_path: 'Which Dropbox folder? (e.g., /Documents)',
    },
    discord: {
      channel_id: 'Which Discord channel should I post to? (Right-click channel → Copy Link)',
      content: 'What message should I send?',
    },
    trello: {
      board_id: 'Which Trello board? (Paste the board URL)',
      list_id: 'Which list on the board?',
      name: 'What should the card be called?',
    },
    asana: {
      project_id: 'Which Asana project? (Paste the project URL)',
      name: 'What should the task be called?',
    },
    linear: {
      team_id: 'Which Linear team?',
      title: 'What should the issue title be?',
    },
    jira: {
      project_key: 'What is the Jira project key? (e.g., "PROJ")',
      summary: 'What should the issue title be?',
    },
    hubspot: {
      email: 'What is the contact email?',
      firstname: 'What is the contact\'s first name?',
      lastname: 'What is the contact\'s last name?',
    },
    stripe: {
      customer_id: 'Which Stripe customer? (Email or customer ID)',
      amount: 'What amount? (in cents, e.g., 1000 for $10)',
    },
    todoist: {
      content: 'What should the task say?',
      project_id: 'Which Todoist project?',
    },
  }

  // @NEXUS-FIX-021: Fallback converts technical_param to "technical param" - DO NOT REMOVE
  return suggestions[toolkit]?.[param] || `What is the ${param.replace(/_/g, ' ')}?`
}

// ============================================================================
// Main Component
// ============================================================================

export function WorkflowPreviewCard({
  workflow,
  className,
  autoExecute = false,
  onExecutionComplete,
  onMissingInfoSelect,
  onNodeRemove,
  onNodeAdd,
}: WorkflowPreviewCardProps): React.ReactElement {
  const navigate = useNavigate()

  // Phase and execution state
  const [phase, setPhase] = React.useState<CardPhase>('ready')
  const [_executionLog, setExecutionLog] = React.useState<string[]>([])

  // Pre-execution validation state
  const [_workflowValidation, setWorkflowValidation] = React.useState<WorkflowValidation | null>(null)

  // Trigger sample data for beta testing
  // Key = node id, Value = sample data object
  const [triggerSampleData, setTriggerSampleData] = React.useState<Record<string, Record<string, string>>>({})
  const [showTriggerDataPrompt, setShowTriggerDataPrompt] = React.useState(false)
  const [currentTriggerNode, setCurrentTriggerNode] = React.useState<string | null>(null)

  // @NEXUS-FIX-030: Track pending input value for error recovery - DO NOT REMOVE
  // Bug: User enters value in input field, clicks Retry, but value was never submitted
  // Fix: Track pending input and submit it when Retry is clicked
  const pendingErrorInputRef = React.useRef<{ field: string; value: string } | null>(null)

  // @NEXUS-FIX-033: Pre-flight validation system - DO NOT REMOVE
  // Validates ALL required params BEFORE execution to eliminate crash-and-retry loops
  const [preFlightResult, setPreFlightResult] = React.useState<PreFlightResult | null>(null)
  const [_preFlightAnswers, setPreFlightAnswers] = React.useState<Record<string, string>>({})
  // @NEXUS-FIX-040: Removed answeredQuestionIds state - no longer needed
  // PreFlightService.check() already filters out answered questions via collectedParams
  // The questions array length directly indicates remaining questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0)
  const [preFlightInputValue, setPreFlightInputValue] = React.useState('')
  const [preFlightError, setPreFlightError] = React.useState<string | null>(null)
  const [showPreFlight, setShowPreFlight] = React.useState(true) // Show pre-flight by default
  // Local copy of collected params - initialized from workflow.collectedParams, updated during pre-flight
  const [collectedParams, setCollectedParams] = React.useState<Record<string, string>>(
    () => workflow.collectedParams || {}
  )

  // @NEXUS-FIX-068: Sync parent's collectedParams to local state - DO NOT REMOVE
  // Problem: Quick Questions answers update workflow.collectedParams in parent (ChatContainer),
  // but local collectedParams state is only initialized at mount.
  // This causes Quick Setup to re-ask the same questions that were already answered.
  // Solution: Sync new params from parent when they change.
  React.useEffect(() => {
    if (workflow.collectedParams) {
      setCollectedParams(prev => {
        // Check if parent has params that local doesn't have yet
        const parentParams = workflow.collectedParams || {}
        const hasNewParams = Object.keys(parentParams).some(
          key => prev[key] === undefined && parentParams[key] !== undefined && parentParams[key] !== ''
        )
        if (hasNewParams) {
          console.log('[FIX-068] Syncing parent collectedParams to local:', {
            parent: parentParams,
            local: prev,
            merged: { ...parentParams, ...prev }
          })
          // Merge: parent params first, local takes precedence (ongoing session edits)
          return { ...parentParams, ...prev }
        }
        return prev
      })
    }
  }, [workflow.collectedParams])

  // @NEXUS-FIX-055: Store orchestration results for unknown toolkits - DO NOT REMOVE
  // When pre-flight discovers unknown toolkits, it calls orchestration to get required params.
  // Those params are converted to PreFlightQuestions and merged into the pre-flight result.
  // This map stores the orchestration results keyed by node ID for use during execution.
  const [orchestrationResults, setOrchestrationResults] = React.useState<Map<string, OrchestrationResult>>(new Map())
  const [isLoadingOrchestration, setIsLoadingOrchestration] = React.useState(false)

  // Node state
  const [nodes, setNodes] = React.useState<WorkflowNode[]>(() =>
    workflow.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      type: (n.type as 'trigger' | 'action' | 'output') || 'action',
      integration: n.integration,
      status: 'idle' as NodeStatus,
    }))
  )

  // @NEXUS-FIX-121: Track which node is selected for detail panel (outside scroll overflow) - DO NOT REMOVE
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)
  const handleNodeSelect = React.useCallback((nodeId: string) => {
    setSelectedNodeId(prev => prev === nodeId ? null : nodeId)
  }, [])
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) ?? null : null

  // Run validation on mount and when workflow changes
  React.useEffect(() => {
    const validation = validateWorkflowBeforeExecution(workflow.nodes)
    setWorkflowValidation(validation)

    // Log validation results for debugging
    console.log('[WorkflowPreviewCard] Validation result:', validation)

    if (!validation.isValid) {
      console.warn('[WorkflowPreviewCard] Workflow has validation issues:', validation.blockers)
    }
  }, [workflow.nodes])

  // Auth state (legacy - sequential)
  const [authState, setAuthState] = React.useState<AuthState>({
    currentIntegration: null,
    connectedIntegrations: new Set(),
    pendingIntegrations: [],
    redirectUrl: null,
    isChecking: false,
    isPolling: false,
    pollAttempts: 0,
  })

  // Parallel auth state (new - minimal clicks)
  const [parallelAuthState, setParallelAuthState] = React.useState<ParallelAuthState>({})
  const [isParallelMode, _setIsParallelMode] = React.useState(true) // Default to parallel mode for minimal clicks

  // @NEXUS-WHATSAPP: WhatsApp connection state - DO NOT REMOVE
  // WhatsApp uses whatsapp-web.js (QR/pairing code), not Composio OAuth
  const [whatsAppState, setWhatsAppState] = React.useState<{
    needed: boolean
    connected: boolean
    showPrompt: boolean
  }>({ needed: false, connected: false, showPrompt: false })

  // Node editing panel state (minimal state - main state in ChatContainer)
  const [showEditPanel, setShowEditPanel] = React.useState(false)

  // Flag to trigger auto-execution after all integrations connect
  const shouldAutoExecuteRef = React.useRef(false)

  // @NEXUS-FIX-023: Ref to always get latest executeWorkflow (fixes stale closure in setTimeout) - DO NOT REMOVE
  const executeWorkflowRef = React.useRef<() => Promise<void>>(() => Promise.resolve())

  // Execution mode: beta (user's account) vs production (client's account)
  const [executionMode, setExecutionMode] = React.useState<'beta' | 'production'>('beta')

  // Get required integrations
  const requiredIntegrations = React.useMemo(
    () => getRequiredIntegrations(workflow.nodes),
    [workflow.nodes]
  )

  // @NEXUS-WHATSAPP: Detect if workflow needs WhatsApp Web (personal) vs WhatsApp Business API
  // WhatsApp Web uses QR code/pairing code via whatsapp-web.js
  // WhatsApp Business uses Composio OAuth (API key flow)
  const { whatsAppIntegrations, oauthIntegrations } = React.useMemo(() => {
    const whatsApp: IntegrationInfo[] = []
    const oauth: IntegrationInfo[] = []

    for (const integration of requiredIntegrations) {
      const toolkitLower = integration.toolkit.toLowerCase().replace(/[^a-z]/g, '') // normalize
      // Only personal WhatsApp (exact 'whatsapp') uses WhatsApp Web (QR/pairing)
      // WhatsApp Business (whatsappbusiness, whatsapp-business) uses Composio OAuth
      if (toolkitLower === 'whatsapp') {
        whatsApp.push(integration)
      } else {
        oauth.push(integration)
      }
    }

    return { whatsAppIntegrations: whatsApp, oauthIntegrations: oauth }
  }, [requiredIntegrations])

  // Add log message (defined before useEffect that uses it)
  const addLog = React.useCallback((message: string) => {
    setExecutionLog((prev: string[]) => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${message}`])
  }, [])

  // @NEXUS-WHATSAPP: Check WhatsApp connection status using whatsapp-web.js API
  const checkWhatsAppStatus = React.useCallback(async () => {
    if (whatsAppIntegrations.length === 0) {
      setWhatsAppState({ needed: false, connected: true, showPrompt: false })
      return true
    }

    setWhatsAppState(prev => ({ ...prev, needed: true }))
    addLog('Checking WhatsApp connection...')

    try {
      // Use the new whatsapp-web.js API endpoint
      const response = await fetch('/api/whatsapp-web/sessions', {
        headers: {
          'x-user-id': localStorage.getItem('nexus_user_id') || 'anonymous'
        }
      })
      const data = await response.json()

      // Check for an active/ready session
      if (data.success && data.sessions && data.sessions.length > 0) {
        const activeSession = data.sessions.find((s: { state: string }) => s.state === 'ready')
        if (activeSession) {
          setWhatsAppState({ needed: true, connected: true, showPrompt: false })
          addLog('✓ WhatsApp connected')
          return true
        }
      }

      // No active session - show connection prompt
      setWhatsAppState({ needed: true, connected: false, showPrompt: true })
      addLog('WhatsApp connection required')
      return false
    } catch (error) {
      console.error('WhatsApp status check failed:', error)
      setWhatsAppState({ needed: true, connected: false, showPrompt: true })
      return false
    }
  }, [whatsAppIntegrations.length, addLog])

  // @NEXUS-WHATSAPP: Handle WhatsApp connection completion
  const handleWhatsAppConnected = React.useCallback(() => {
    setWhatsAppState({ needed: true, connected: true, showPrompt: false })
    addLog('✓ WhatsApp connected successfully!')
    // If all OAuth integrations are also connected, proceed to ready
    if (authState.pendingIntegrations.length === 0) {
      setPhase('ready')
    }
  }, [addLog, authState.pendingIntegrations.length])

  // @NEXUS-FIX-033 & @NEXUS-FIX-055 & @NEXUS-FIX-074: Run pre-flight check with orchestration support - DO NOT REMOVE
  // This checks ALL required params BEFORE execution, eliminating the loop problem.
  // For unknown toolkits (not in TOOL_SLUGS), it also discovers required params via orchestration.
  // FIX-074: Now uses backend /api/preflight/check with REAL Composio schema fetching
  React.useEffect(() => {
    // Async IIFE for pre-flight check
    const runPreFlightCheck = async () => {
      // Convert workflow nodes to the format PreFlightService expects
      const preFlightNodes = workflow.nodes.map(n => ({
        id: n.id,
        name: n.name,
        type: (n.type as 'trigger' | 'action') || 'action',
        tool: (n as { tool?: string }).tool,
        integration: n.integration,
        params: (n as { config?: Record<string, unknown> }).config
      }))

      // Get list of connected integrations from authState
      const connectedList = Array.from(authState.connectedIntegrations)

      // @NEXUS-FIX-074: Use async backend check with REAL schema fetching - DO NOT REMOVE
      // This calls /api/preflight/check which fetches schemas from Composio SDK
      // Falls back to local static check if backend unavailable
      let result: PreFlightResult
      try {
        result = await PreFlightService.checkAsync(preFlightNodes, collectedParams, connectedList)
        console.log('[WorkflowPreviewCard] Pre-flight check (FIX-074 backend):', {
          ready: result.ready,
          questionsCount: result.questions.length,
          questions: result.questions.map(q => q.paramName),
          connections: result.connections
        })
      } catch (error) {
        console.warn('[WorkflowPreviewCard] Backend pre-flight failed, using static fallback:', error)
        result = PreFlightService.check(preFlightNodes, collectedParams, connectedList)
        console.log('[WorkflowPreviewCard] Pre-flight check (static fallback):', {
          ready: result.ready,
          questionsCount: result.questions.length,
          questions: result.questions.map(q => q.paramName),
          connections: result.connections
        })
      }

      // @NEXUS-FIX-055 & @NEXUS-FIX-059: Discover params via orchestration - DO NOT REMOVE
    // FIX-055: For unknown toolkits, discover params via orchestration
    // FIX-059: When USE_ORCHESTRATION_FIRST is enabled, ALL toolkits go through orchestration
    //          Static TOOL_REQUIREMENTS becomes a fallback (used only if API fails)
    const nodesToOrchestrate = workflow.nodes.filter(n => {
      const integration = n.integration?.toLowerCase().replace(/\s+/g, '').replace(/-/g, '') || ''
      const nodeType = (n.type as string) || 'action'
      // @NEXUS-FIX-058: Include triggers in orchestration discovery - DO NOT REMOVE
      // Some triggers need params (webhook filters, schedule patterns, etc.)
      // The orchestration API will return 0 questions for triggers that don't need params

      // @NEXUS-FIX-059: Orchestration-first approach - DO NOT REMOVE
      // When USE_ORCHESTRATION_FIRST is true, include KNOWN toolkits in orchestration
      const isKnown = integration && isToolkitKnown(integration)
      const isUnknown = integration && !isKnown

      // Determine if this node should go through orchestration
      const shouldOrchestrate = USE_ORCHESTRATION_FIRST
        ? integration  // All nodes with an integration
        : isUnknown    // Only unknown toolkits (legacy behavior)

      if (shouldOrchestrate && isKnown) {
        console.log(`[ORCHESTRATION-FIRST] Using orchestration for known toolkit: ${integration}`)
      }

      console.log(`[ORCHESTRATION-DISCOVERY] Checking node: ${n.name} (type: ${nodeType}, integration: ${integration}, orchestrate: ${!!shouldOrchestrate})`)

      // Check if we already have questions for this node in static pre-flight
      const hasQuestions = result.questions.some(q => q.nodeId === n.id)
      // @NEXUS-FIX-055: Skip if already processed by orchestration (prevents re-render loop)
      const alreadyProcessed = orchestrationResults.has(n.id)

      // @NEXUS-FIX-059: For orchestration-first, skip nodes that already have static questions
      // Those will be used as fallback if orchestration fails
      return shouldOrchestrate && !alreadyProcessed && (USE_ORCHESTRATION_FIRST ? true : !hasQuestions)
    })

    if (nodesToOrchestrate.length > 0 && USE_GENERIC_ORCHESTRATION) {
      // @NEXUS-FIX-059: Log whether we're using orchestration-first approach
      if (USE_ORCHESTRATION_FIRST) {
        const knownToolkits = nodesToOrchestrate
          .map(n => n.integration?.toLowerCase().replace(/\s+/g, '').replace(/-/g, '') || '')
          .filter(i => isToolkitKnown(i))
        if (knownToolkits.length > 0) {
          console.log('[ORCHESTRATION-FIRST] Processing known toolkits via orchestration:', knownToolkits)
        }
      }
      console.log('[WorkflowPreviewCard] Discovering params via orchestration:',
        nodesToOrchestrate.map(n => n.integration))

      setIsLoadingOrchestration(true)

      // Discover params for toolkits asynchronously
      const discoverToolkits = async () => {
        const newOrchResults = new Map(orchestrationResults)
        const orchestrationQuestions: PreFlightQuestion[] = []
        // @NEXUS-FIX-059: Track nodes where orchestration failed (for static fallback)
        const orchestrationFailedNodes: string[] = []

        for (const node of nodesToOrchestrate) {
          const integration = node.integration || ''
          const integrationLower = integration.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')
          const isKnown = isToolkitKnown(integrationLower)

          if (USE_ORCHESTRATION_FIRST && isKnown) {
            console.log(`[ORCHESTRATION-FIRST] Discovering params for KNOWN toolkit: ${node.name} (${integration})`)
          } else {
            console.log(`[ORCHESTRATION-PREFLIGHT] Discovering params for ${node.name} (${integration})...`)
          }

          const orchResult = await resolveToolViaOrchestration(node.name, integration)

          // @NEXUS-FIX-063: Use legacy TOOL_SLUGS for KNOWN toolkits - DO NOT REMOVE
          // Problem: Rube semantic search returns wrong tools (e.g., CALENDAR_CREATE instead of GOOGLECALENDAR_EVENTS_LIST)
          // Solution: For known toolkits, override orchestration slug with correct legacy mapping
          // Keep sessionId from orchestration for schema fetching (FIX-062)
          if (orchResult && isKnown) {
            const legacySlug = mapNodeToToolSlug(node.name, integration)
            if (legacySlug && legacySlug !== orchResult.slug) {
              console.log(`[ORCHESTRATION-FIRST] FIX-063: Overriding orchestration slug ${orchResult.slug} with legacy slug ${legacySlug}`)
              orchResult.slug = legacySlug
              orchResult.source = 'legacy'

              // @NEXUS-FIX-064: Re-fetch schema and regenerate questions for legacy tool - DO NOT REMOVE
              // Problem: When FIX-063 overrides the slug, questions are still from the WRONG tool's schema
              // Example: CALENDAR_CREATE schema doesn't require start_datetime, but GOOGLECALENDAR_CREATE_EVENT does
              // Solution: After slug override, fetch the CORRECT schema and regenerate questions
              // This ensures pre-flight collects ALL required params for the actual tool we'll execute
              try {
                console.log(`[ORCHESTRATION-FIRST] FIX-064: Re-fetching schema for legacy slug: ${legacySlug}`)
                const schemaResolver = getSchemaResolver()
                const legacySchema = await schemaResolver.getSchema(legacySlug, orchResult.sessionId)

                if (legacySchema && legacySchema.required && legacySchema.required.length > 0) {
                  // Create new collector with correct schema to generate questions
                  const legacyCollector = createCollector(legacySchema)
                  const legacyQuestions = legacyCollector.getAllQuestions()

                  console.log(`[ORCHESTRATION-FIRST] FIX-064: Regenerated ${legacyQuestions.length} questions from legacy schema:`,
                    legacyQuestions.map(q => q.paramName))
                  console.log(`[ORCHESTRATION-FIRST] FIX-064: Required params for ${legacySlug}:`, legacySchema.required)

                  // Replace questions with correct ones from legacy schema
                  orchResult.questions = legacyQuestions
                } else {
                  console.log(`[ORCHESTRATION-FIRST] FIX-064: No required params in legacy schema for ${legacySlug}`)
                }
              } catch (schemaError) {
                console.warn(`[ORCHESTRATION-FIRST] FIX-064: Failed to re-fetch schema for ${legacySlug}:`, schemaError)
                // Keep original questions as fallback
              }
            }
          }

          // @NEXUS-FIX-055 & @NEXUS-FIX-059: Always mark node as processed to prevent infinite re-render loop
          // Even if no tools/questions found, we must track that we TRIED to discover this node
          // Otherwise the useEffect dependency on orchestrationResults will trigger again
          const emptyResult: OrchestrationResult = {
            slug: '',
            toolkit: integration,
            action: '',
            displayName: node.name,
            questions: [],
            sessionId: '',
            source: 'orchestration'
          }

          if (orchResult) {
            newOrchResults.set(node.id, orchResult)
          } else {
            // @NEXUS-FIX-059: Orchestration failed - mark for static fallback
            // @NEXUS-FIX-064-EXT: BUT if it's a known toolkit, try to fetch schema directly - DO NOT REMOVE
            // This handles the case where Rube returns 0 tools but we know the legacy slug
            // Example: "Create Calendar Event" fails orchestration, but GOOGLECALENDAR_CREATE_EVENT is known
            if (USE_ORCHESTRATION_FIRST && isKnown) {
              const legacySlug = mapNodeToToolSlug(node.name, integration)
              if (legacySlug) {
                console.log(`[ORCHESTRATION-FIRST] FIX-064-EXT: Orchestration failed but toolkit known. Trying legacy slug: ${legacySlug}`)
                try {
                  const schemaResolver = getSchemaResolver()
                  // Use a temporary session ID for direct schema fetch (schema is cached anyway)
                  const tempSessionId = emptyResult.sessionId || `fallback_${Date.now()}`
                  const legacySchema = await schemaResolver.getSchema(legacySlug, tempSessionId)

                  if (legacySchema && legacySchema.required && legacySchema.required.length > 0) {
                    console.log(`[ORCHESTRATION-FIRST] FIX-064-EXT: Found schema for ${legacySlug} with required:`, legacySchema.required)
                    const legacyCollector = createCollector(legacySchema)
                    const legacyQuestions = legacyCollector.getAllQuestions()

                    // Create a proper result with the schema-derived questions
                    // @NEXUS-FIX-064-EXT: source='legacy' since questions derived from legacy slug schema
                    const schemaResult: OrchestrationResult = {
                      slug: legacySlug,
                      toolkit: integration,
                      action: legacySlug.split('_').slice(1).join('_').toLowerCase(),
                      displayName: node.name,
                      questions: legacyQuestions,
                      sessionId: tempSessionId,
                      source: 'legacy'  // From legacy slug schema (FIX-064-EXT)
                    }
                    newOrchResults.set(node.id, schemaResult)
                    console.log(`[ORCHESTRATION-FIRST] FIX-064-EXT: Generated ${legacyQuestions.length} questions from schema:`,
                      legacyQuestions.map(q => q.paramName))
                    // Don't add to orchestrationFailedNodes - we have questions now!
                  } else {
                    console.log(`[ORCHESTRATION-FIRST] FIX-064-EXT: Schema found but no required params for ${legacySlug}`)
                    newOrchResults.set(node.id, emptyResult)
                    orchestrationFailedNodes.push(node.id)
                  }
                } catch (schemaError) {
                  console.warn(`[ORCHESTRATION-FIRST] FIX-064-EXT: Failed to fetch schema for ${legacySlug}:`, schemaError)
                  newOrchResults.set(node.id, emptyResult)
                  orchestrationFailedNodes.push(node.id)
                }
              } else {
                newOrchResults.set(node.id, emptyResult)
                orchestrationFailedNodes.push(node.id)
                console.log(`[ORCHESTRATION-FIRST] Orchestration failed for ${node.name} - no legacy mapping, using static fallback`)
              }
            } else {
              newOrchResults.set(node.id, emptyResult)
              console.log(`[ORCHESTRATION-FIRST] Orchestration failed for ${node.name} - will use static fallback`)
            }
          }

          // @NEXUS-FIX-064-EXT: Read from newOrchResults to include schema-fallback questions - DO NOT REMOVE
          // The original orchResult may be null when orchestration failed, but FIX-064-EXT may have
          // added schema-derived questions to newOrchResults for known toolkits
          const finalResult = newOrchResults.get(node.id)
          if (finalResult && finalResult.questions.length > 0) {
            console.log(`[ORCHESTRATION-PREFLIGHT] Found ${finalResult.questions.length} questions for ${node.name} (source: ${finalResult.source || 'orchestration'}):`,
              finalResult.questions.map(q => q.paramName))

            // Convert orchestration questions to PreFlightQuestion format
            for (const q of finalResult.questions) {
              // @NEXUS-FIX-103: Use semantic check for already collected params - DO NOT REMOVE
              // Previous bug: exact match only - "message" and "text" were treated as different params
              // Fix: Use isParamSemanticallycollected to check aliases
              const isAlreadyCollected = isParamSemanticallycollected(q.paramName, collectedParams)
              if (isAlreadyCollected || q.answered) {
                console.log(`[ORCHESTRATION-PREFLIGHT] FIX-100: Skipping ${q.paramName} - semantically already collected`)
                continue
              }

              orchestrationQuestions.push({
                id: `${node.id}_${q.paramName}`,
                nodeId: node.id,
                nodeName: node.name,
                integration: integration.toLowerCase(),
                paramName: q.paramName,
                displayName: q.displayName,
                prompt: q.prompt,
                quickActions: q.quickActions || [],
                inputType: (q.inputType || 'text') as 'text' | 'phone' | 'email' | 'url' | 'select' | 'textarea',
                placeholder: q.placeholder || `Enter ${q.displayName.toLowerCase()}...`,
                required: true
              })
            }
          }
        }

        setOrchestrationResults(newOrchResults)

        // @NEXUS-FIX-059: Merge orchestration questions with static fallback questions
        // For orchestration-first: use orchestration questions where available, static where failed
        // Filter static questions to only include nodes where orchestration failed (fallback)
        // @NEXUS-FIX-071: Only mark node as "succeeded" if orchestration returned actual questions - DO NOT REMOVE
        // Previous bug: Nodes with 0 orchestration questions (triggers, tools with no required params) were
        // marked as "succeeded", filtering out ALL static questions and causing Quick Setup to disappear.
        // Fix: Only treat orchestration as "succeeded" if it found questions. Nodes with 0 questions
        // fall back to static questions (AI-inferred from missingInfo).
        const orchestrationSucceededNodeIds = new Set(
          Array.from(newOrchResults.entries())
            .filter(([, orchResult]) => orchResult.questions.length > 0) // FIX-071: Only count nodes with actual questions
            .filter(([nodeId]) => !orchestrationFailedNodes.includes(nodeId))
            .map(([nodeId]) => nodeId)
        )

        // Keep static questions only for nodes where orchestration failed
        const staticFallbackQuestions = USE_ORCHESTRATION_FIRST
          ? result.questions.filter(q => !orchestrationSucceededNodeIds.has(q.nodeId))
          : result.questions

        // @NEXUS-FIX-103: Deduplicate questions by semantic param name - DO NOT REMOVE
        // Previous bug: "message" from static and "text" from orchestration both showed (5 duplicates!)
        // Fix: Group by canonical param name and keep only first occurrence per node
        const rawQuestions = [...staticFallbackQuestions, ...orchestrationQuestions]
        const seenCanonicalParams = new Map<string, Set<string>>() // nodeId -> Set of canonical param names

        // @NEXUS-FIX-106: Cross-node deduplication for semantic equivalents - DO NOT REMOVE
        // Previous bug: Gmail asks "body", Dropbox asks "content", Slack asks "text" - all 3 showed!
        // Fix: For certain semantic groups, only ask ONCE across ALL nodes (answer applies to all)
        const CROSS_NODE_SEMANTIC_GROUPS = new Set(['text', 'to', 'subject', 'name']) // Canonical names that should only be asked once globally
        const seenGlobalCanonicalParams = new Set<string>() // Track cross-node seen params

        const allQuestions = rawQuestions.filter(q => {
          const canonicalName = getCanonicalParamName(q.paramName)
          const nodeKey = q.nodeId

          // @NEXUS-FIX-106: Cross-node deduplication for semantic groups
          if (CROSS_NODE_SEMANTIC_GROUPS.has(canonicalName)) {
            if (seenGlobalCanonicalParams.has(canonicalName)) {
              console.log(`[FIX-106] Cross-node deduplication: ${q.paramName} (canonical: ${canonicalName}) already asked for another node`)
              return false
            }
            seenGlobalCanonicalParams.add(canonicalName)
            // Continue to also add to per-node tracking (for logging)
          }

          // Get or create the set of seen params for this node
          if (!seenCanonicalParams.has(nodeKey)) {
            seenCanonicalParams.set(nodeKey, new Set())
          }
          const nodeSeenParams = seenCanonicalParams.get(nodeKey)!

          // If we've already seen this canonical param for this node, skip it
          if (nodeSeenParams.has(canonicalName)) {
            console.log(`[FIX-100] Deduplicating question: ${q.paramName} (canonical: ${canonicalName}) for node ${q.nodeName}`)
            return false
          }

          // Mark as seen and include
          nodeSeenParams.add(canonicalName)
          return true
        })

        if (allQuestions.length > 0 || orchestrationQuestions.length > 0 || staticFallbackQuestions.length > 0) {
          const mergedResult: PreFlightResult = {
            ...result,
            ready: allQuestions.length === 0, // Ready only if no questions
            questions: allQuestions,
            summary: {
              ...result.summary,
              totalQuestions: allQuestions.length
            }
          }

          console.log('[WorkflowPreviewCard] Pre-flight check (with orchestration):', {
            ready: mergedResult.ready,
            questionsCount: mergedResult.questions.length,
            questions: mergedResult.questions.map(q => q.paramName),
            addedViaOrchestration: orchestrationQuestions.map(q => q.paramName),
            staticFallback: staticFallbackQuestions.map(q => q.paramName),
            orchestrationFailedNodes: orchestrationFailedNodes
          })

          setPreFlightResult(mergedResult)
          if (allQuestions.length > 0) {
            setShowPreFlight(true) // Show pre-flight UI since we have questions
          } else {
            setShowPreFlight(false)
          }
        } else {
          // @NEXUS-FIX-056 & @NEXUS-FIX-059: Orchestration found no questions and no fallback - ready
          setPreFlightResult({
            ...result,
            ready: result.connections.every(c => c.connected),
            questions: []
          })
          setShowPreFlight(false)
        }

        setIsLoadingOrchestration(false)
      }

      discoverToolkits()
      // @NEXUS-FIX-056 & @NEXUS-FIX-059: Don't set static result here - orchestration callback will set merged result
      // The async callback in discoverToolkits() calls setPreFlightResult(mergedResult)
      // If we also call setPreFlightResult(result) below, it creates a race condition where
      // the static result (0 questions) overwrites the merged result (with orchestration questions)
      return
    }

    // @NEXUS-FIX-056 & @NEXUS-FIX-059: If orchestration already completed and set merged result, don't overwrite
    // This handles the second useEffect run triggered by orchestrationResults dependency change
    // After orchestration sets merged result with questions, useEffect re-runs due to dependency change
    // On that re-run, nodesToOrchestrate is empty (all marked as processed), so we reach here
    // But we must NOT overwrite the merged result - orchestration already set the correct result
    // EXCEPT: Allow update when all orchestration questions have been answered (to enable execution button)
    if (orchestrationResults.size > 0) {
      // @NEXUS-FIX-069: Check DISPLAYED questions, not RAW orchestration questions - DO NOT REMOVE
      // Problem: Previous code built allOrchestrationQuestions from RAW orchestrationResults.questions,
      // which includes params that were filtered out at lines 3262-3266 (already collected).
      // This caused allAnswered to fail because those params might be in collectedParams under
      // different keys (e.g., from Quick Questions/missingInfo which uses AI-determined field names).
      // Solution: Check against preFlightResult.questions (what's actually shown in Quick Setup).
      // If all DISPLAYED questions are answered, we're done.
      const displayedQuestions = preFlightResult?.questions || []
      const displayedParamNames = displayedQuestions.map(q => q.paramName)

      console.log('[FIX-069] Checking displayed questions:', {
        displayedCount: displayedParamNames.length,
        displayedParams: displayedParamNames,
        collectedParamsKeys: Object.keys(collectedParams)
      })

      // @NEXUS-FIX-066: Fix pre-flight questions disappearing when orchestration has no required params
      // Previously, allOrchestrationQuestions.length === 0 was treated as "all answered", wiping all questions.
      // This caused questions to appear for 2-3 seconds then disappear when triggers had no required params.
      // Fix: Only treat as "all answered" if orchestration actually HAD questions AND they're all answered.
      // If orchestration has 0 questions (like triggers), fall through to use static result with AI questions.

      if (displayedParamNames.length > 0) {
        // @NEXUS-FIX-057 & @NEXUS-FIX-069: Validate non-empty param values for DISPLAYED questions only
        const allAnswered = displayedParamNames.every(paramName =>
          collectedParams[paramName] !== undefined && collectedParams[paramName] !== '')

        console.log('[FIX-069] allAnswered check:', {
          allAnswered,
          missingParams: displayedParamNames.filter(p => !collectedParams[p] || collectedParams[p] === '')
        })

        if (allAnswered) {
          // All orchestration questions answered - update preFlightResult to reflect completion
          // This will set questions.length to 0, enabling the execution button
          console.log('[WorkflowPreviewCard] All orchestration questions answered - updating pre-flight result')
          setPreFlightResult({
            ...result,
            ready: result.connections.length === 0, // Ready if no connections needed
            questions: [], // All questions answered
          })
          setShowPreFlight(false)
          return
        }

        // Orchestration has unanswered questions - preserve orchestration result
        console.log('[WorkflowPreviewCard] Preserving orchestration pre-flight result (skipping static overwrite)')
        return
      }

      // @NEXUS-FIX-066: Orchestration found tools but NO required params (like triggers)
      // Fall through to use static result which may have AI-generated questions (missingInfo)
      console.log('[WorkflowPreviewCard] FIX-066: Orchestration has tools but no required params - using static result')
    }

      // No orchestration needed - set static result
      setPreFlightResult(result)

      // If no questions needed, hide pre-flight UI
      if (result.questions.length === 0) {
        setShowPreFlight(false)
      }
    } // End of runPreFlightCheck async function

    // @NEXUS-FIX-074: Execute async pre-flight check - DO NOT REMOVE
    runPreFlightCheck()
  }, [workflow.nodes, collectedParams, authState.connectedIntegrations, orchestrationResults])

  // @NEXUS-FIX-054: Reset question index when questions array changes - DO NOT REMOVE
  // After pre-flight re-runs, the questions array shrinks (answered questions filtered out).
  // If currentQuestionIndex exceeds new array bounds, questions[index] returns undefined,
  // causing currentPreFlightQuestion to be null and Quick Setup panel to disappear.
  // This effect resets the index to 0 whenever questions change, ensuring valid access.
  React.useEffect(() => {
    if (preFlightResult && preFlightResult.questions.length > 0) {
      // Always show the first unanswered question (index 0 in the filtered array)
      if (currentQuestionIndex >= preFlightResult.questions.length) {
        console.log('[WorkflowPreviewCard] Resetting question index to 0 (was out of bounds)')
        setCurrentQuestionIndex(0)
      }
    }
  }, [preFlightResult?.questions.length, currentQuestionIndex])

  // @NEXUS-FIX-033: Pre-flight question handlers - DO NOT REMOVE
  // Handle answering a pre-flight question
  const handlePreFlightAnswer = React.useCallback((questionId: string, paramName: string, value: string) => {
    // Validate the answer
    const question = preFlightResult?.questions.find(q => q.id === questionId)
    if (question) {
      const validation = PreFlightService.validateAnswer(question, value)
      if (!validation.valid) {
        setPreFlightError(validation.error || 'Invalid value')
        return
      }
    }

    // @NEXUS-FIX-118: Extract IDs from URLs before storing - DO NOT REMOVE
    // Users often paste full URLs (Google Sheets, Notion, GitHub) but APIs need just the ID
    const extractedValue = extractIdFromUrl(paramName, value)
    if (extractedValue !== value) {
      console.log(`[FIX-118] URL extraction: ${paramName} URL → ID: ${extractedValue}`)
    }

    console.log('[WorkflowPreviewCard] Pre-flight answer:', { questionId, paramName, value: extractedValue })

    // Store the answer (with extracted ID, not raw URL)
    setPreFlightAnswers(prev => ({ ...prev, [paramName]: extractedValue }))

    // @NEXUS-FIX-040: Removed setAnsweredQuestionIds - collectedParams handles tracking
    // The pre-flight check re-runs on collectedParams change, filtering answered questions

    // Also store in collectedParams for execution
    setCollectedParams(prev => ({ ...prev, [paramName]: extractedValue }))

    // Also notify parent (for ChatContainer to track)
    onMissingInfoSelect?.(paramName, value)

    // Clear input and error
    setPreFlightInputValue('')
    setPreFlightError(null)

    // Move to next question
    if (preFlightResult) {
      const nextIndex = currentQuestionIndex + 1
      if (nextIndex < preFlightResult.questions.length) {
        setCurrentQuestionIndex(nextIndex)
      } else {
        // All questions answered - hide pre-flight UI
        setShowPreFlight(false)
        console.log('[WorkflowPreviewCard] Pre-flight complete! All questions answered.')
      }
    }
  }, [preFlightResult, currentQuestionIndex, onMissingInfoSelect])

  // Get current pre-flight question
  const currentPreFlightQuestion = React.useMemo(() => {
    if (!preFlightResult || preFlightResult.questions.length === 0) return null
    return preFlightResult.questions[currentQuestionIndex] || null
  }, [preFlightResult, currentQuestionIndex])

  // Check if pre-flight is complete (all questions answered)
  // @NEXUS-FIX-040: Fixed race condition in isPreFlightComplete - DO NOT REMOVE
  // The questions array from PreFlightService only contains UNANSWERED questions
  // After each answer, collectedParams updates, triggering re-run that filters out answered questions
  // So if questions.length === 0, ALL required params have been collected
  // Previous bug: compared answeredQuestionIds.size with stale preFlightResult.questions.length
  const isPreFlightComplete = React.useMemo(() => {
    if (!preFlightResult) return true // No pre-flight needed
    // questions array only contains unanswered questions - if empty, all answered
    return preFlightResult.questions.length === 0
  }, [preFlightResult])

  // @NEXUS-FIX-118: Execution Dry-Run Validation Gate - DO NOT REMOVE
  // Problem: Pre-flight checks integration-level params (e.g., "googlesheets" needs "spreadsheet_id")
  // but execution checks tool-slug-level params (e.g., "GOOGLESHEETS_BATCH_UPDATE" needs "spreadsheet_id").
  // These can drift out of sync, causing execution failures even after pre-flight passes.
  // Solution: When all pre-flight questions are answered, do a "dry-run" that mirrors
  // execution's param resolution — same tool slug, same defaults, same merge — and validate.
  // If any params are still missing, add them as new questions BEFORE execution starts.
  const dryRunCompletedRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    // Only run when pre-flight questions are all answered
    if (!preFlightResult || preFlightResult.questions.length > 0) return
    if (phase !== 'ready') return

    // Create a fingerprint of current collected params to avoid re-running
    const paramsFingerprint = JSON.stringify(collectedParams)
    if (dryRunCompletedRef.current === paramsFingerprint) return
    dryRunCompletedRef.current = paramsFingerprint

    console.log('[FIX-118] Running execution dry-run validation...')

    const missingQuestions: PreFlightQuestion[] = []

    for (const rawNode of workflow.nodes) {
      // Construct a proper WorkflowNode with status field for getDefaultParams compatibility
      const node: WorkflowNode = {
        id: rawNode.id,
        name: rawNode.name,
        type: (rawNode.type as 'trigger' | 'action' | 'output') || 'action',
        integration: rawNode.integration,
        status: 'idle',
        config: (rawNode as Record<string, unknown>).config as Record<string, unknown> | undefined,
        description: (rawNode as Record<string, unknown>).description as string | undefined,
      }
      const integrationInfo = getIntegrationInfo(node.integration || node.name)

      // Skip trigger, AI, internal nodes — same logic as executeWorkflow
      const isTriggerNode = node.type === 'trigger' ||
        node.name.toLowerCase().includes('monitor') ||
        node.name.toLowerCase().includes('watch') ||
        node.name.toLowerCase().includes('listen') ||
        node.name.toLowerCase().includes('receive')

      if (isTriggerNode) continue

      const hasRealIntegration = integrationInfo.toolkit !== 'ai' &&
        integrationInfo.toolkit !== 'nexus' &&
        integrationInfo.toolkit !== 'unknown' &&
        integrationInfo.toolkit !== 'default' &&
        node.integration?.toLowerCase() !== 'ai' &&
        node.integration?.toLowerCase() !== 'nexus'

      if (!hasRealIntegration) continue // AI/internal node

      // Resolve tool slug — same as execution
      const toolkitLower = integrationInfo.toolkit.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')
      let toolSlug: string | null = null

      const storedOrchResult = orchestrationResults.get(node.id)
      if (storedOrchResult?.slug) {
        toolSlug = storedOrchResult.slug
        if (isToolkitKnown(toolkitLower)) {
          const legacySlug = mapNodeToToolSlug(node.name, integrationInfo.toolkit)
          if (legacySlug) toolSlug = legacySlug
        }
      } else if (isToolkitKnown(toolkitLower)) {
        toolSlug = mapNodeToToolSlug(node.name, integrationInfo.toolkit)
      }

      if (!toolSlug) continue // Can't validate without a tool slug

      // Get params — same merge as execution
      // @NEXUS-FIX-118: Provide synthetic flow data for dry-run - DO NOT REMOVE
      // Problem: Params like SLACK_SEND_MESSAGE.text depend on trigger data flowing from previous nodes.
      // In dry-run there's no actual execution, so flowData is empty and these params show as "missing".
      // Solution: Provide synthetic previous results so getDefaultParams can generate flow-dependent defaults.
      // This prevents false "missing param" questions for params that WILL be available at execution time.
      const nodeIdx = workflow.nodes.findIndex(n => n.id === rawNode.id)
      const syntheticPreviousResults = workflow.nodes.slice(0, nodeIdx).map(prevRawNode => ({
        node: {
          id: prevRawNode.id,
          name: prevRawNode.name,
          type: (prevRawNode.type as 'trigger' | 'action' | 'output') || 'action',
          integration: prevRawNode.integration,
          status: 'success' as NodeStatus,
        },
        result: prevRawNode.type === 'trigger' ? {
          type: 'trigger_sample_data',
          data: {
            from: 'trigger@example.com',
            subject: 'Workflow Trigger Event',
            body: 'Data from workflow trigger step',
            sender_name: 'Nexus Workflow',
            message: 'Trigger data flowing to next step',
          }
        } : {
          type: 'action_result',
          id: `prev_${prevRawNode.id}`,
          text: 'Result from previous step',
          message: 'Data from previous action',
        }
      }))

      const defaultParams = getDefaultParams(toolSlug, node, syntheticPreviousResults, {
        name: workflow.name,
        description: workflow.description,
      })
      const collectedToolParams = mapCollectedParamsToToolParams(
        collectedParams as Record<string, string>,
        integrationInfo.toolkit,
        toolSlug
      )
      const mergedParams = { ...defaultParams, ...collectedToolParams }

      // Validate — same as execution
      const missing = validateRequiredParams(toolSlug, mergedParams)

      if (missing.length > 0) {
        console.log(`[FIX-118] Dry-run found missing params for ${node.name} (${toolSlug}):`, missing)
        for (const paramName of missing) {
          // Don't re-ask params that are already in collected
          const isAlreadyCollected = Object.keys(collectedParams).some(k =>
            k === paramName || k.endsWith(`.${paramName}`)
          )
          if (isAlreadyCollected) continue

          const friendlyPrompt = getParamFixSuggestion(paramName, integrationInfo.toolkit)
          missingQuestions.push({
            id: `dryrun_${node.id}_${paramName}`,
            nodeId: node.id,
            nodeName: node.name,
            integration: integrationInfo.toolkit.toLowerCase(),
            paramName,
            displayName: paramName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            prompt: friendlyPrompt || `What ${paramName.replace(/_/g, ' ')} should I use for ${node.name}?`,
            quickActions: [],
            inputType: 'text',
            placeholder: `Enter ${paramName.replace(/_/g, ' ')}...`,
            required: true
          })
        }
      }
    }

    if (missingQuestions.length > 0) {
      console.log(`[FIX-118] Dry-run validation found ${missingQuestions.length} additional params needed:`,
        missingQuestions.map(q => `${q.nodeName}:${q.paramName}`))

      // Reset dry-run fingerprint so it can re-check after user answers these
      dryRunCompletedRef.current = null

      // Add missing questions to pre-flight result
      setPreFlightResult(prev => prev ? {
        ...prev,
        ready: false,
        questions: missingQuestions,
        summary: { ...prev.summary, totalQuestions: missingQuestions.length }
      } : null)
      setShowPreFlight(true)
      setCurrentQuestionIndex(0)
    } else {
      console.log('[FIX-118] Dry-run validation passed — all nodes have required params!')
    }
  }, [preFlightResult, collectedParams, phase, workflow, orchestrationResults])
  // @NEXUS-FIX-118-END

  // Listen for OAuth callback messages from popup windows
  React.useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Only accept messages from our own origin
      if (event.origin !== window.location.origin) return

      const { type, success, provider, error } = event.data || {}

      if (type === 'oauth_callback') {
        console.log('[WorkflowPreviewCard] Received OAuth callback message:', { success, provider, error })

        if (success && provider) {
          // OAuth succeeded - update connected integrations
          setAuthState((prev) => {
            const newConnected = new Set(prev.connectedIntegrations)
            newConnected.add(provider)

            // Find remaining integrations
            const remaining = prev.pendingIntegrations.filter((i) => i.toolkit !== provider && i.id !== provider)

            if (remaining.length === 0) {
              // All integrations connected!
              shouldAutoExecuteRef.current = true
              setPhase('ready')
              return {
                ...prev,
                currentIntegration: null,
                connectedIntegrations: newConnected,
                pendingIntegrations: [],
                redirectUrl: null,
                isPolling: false,
                pollAttempts: 0,
              }
            } else {
              // Move to next integration
              return {
                ...prev,
                currentIntegration: remaining[0],
                connectedIntegrations: newConnected,
                pendingIntegrations: remaining,
                redirectUrl: null,
                isPolling: false,
                pollAttempts: 0,
              }
            }
          })

          addLog(`✓ ${provider} connected via OAuth!`)
        } else if (error) {
          console.error('[WorkflowPreviewCard] OAuth error:', error)
          addLog(`OAuth error: ${error}`)
          setAuthState((prev) => ({ ...prev, isPolling: false }))
        }
      }
    }

    window.addEventListener('message', handleOAuthMessage)
    return () => window.removeEventListener('message', handleOAuthMessage)
  }, [addLog])

  // Check connections via Composio API
  // @NEXUS-WHATSAPP: Now handles WhatsApp separately from OAuth integrations
  const checkConnections = React.useCallback(async () => {
    setPhase('checking')
    setAuthState((prev) => ({ ...prev, isChecking: true }))
    addLog('Checking integration connections...')

    try {
      // @NEXUS-WHATSAPP: Check WhatsApp first (uses different flow than OAuth)
      const whatsAppConnected = await checkWhatsAppStatus()
      if (whatsAppIntegrations.length > 0 && !whatsAppConnected) {
        // WhatsApp needs connection - show prompt and wait
        setPhase('needs_auth')
        setAuthState((prev) => ({ ...prev, isChecking: false }))
        return false
      }

      // Get toolkits needed (excluding WhatsApp - handled separately)
      const toolkits = oauthIntegrations.map((i) => i.toolkit)
      console.log('[WorkflowPreviewCard] Checking OAuth connections for toolkits:', toolkits)

      // Check each toolkit connection via Rube MCP API
      const connected = new Set<string>()
      const pending: IntegrationInfo[] = []

      for (const integration of oauthIntegrations) {
        try {
          const status = await rubeClient.checkConnection(integration.toolkit)
          if (status.connected) {
            connected.add(integration.id)
            addLog(`✓ ${integration.name} connected`)
          } else {
            pending.push(integration)
          }
        } catch {
          // If check fails, assume not connected
          pending.push(integration)
        }
      }

      // NOTE: Removed localStorage fallback - Composio is the authoritative source
      // for connection status. Local cache was causing stale connections to be
      // used when Composio reports the connection doesn't exist.
      // The cache is now only updated AFTER successful Composio OAuth completion.

      // Filter out connected ones from pending
      const stillPending = pending.filter((i) => !connected.has(i.id))

      if (stillPending.length === 0) {
        // All connected - ready to execute!
        addLog('All integrations connected!')
        setAuthState({
          currentIntegration: null,
          connectedIntegrations: connected,
          pendingIntegrations: [],
          redirectUrl: null,
          isChecking: false,
          isPolling: false,
          pollAttempts: 0,
        })
        setPhase('ready')
        return true
      } else {
        // Need to connect some integrations
        const nextIntegration = stillPending[0]
        addLog(`Need to connect ${stillPending.length} integration${stillPending.length > 1 ? 's' : ''}: ${stillPending.map(i => i.name).join(', ')}`)

        // Initialize parallel auth state for all pending integrations
        const initialParallelState: ParallelAuthState = {}
        stillPending.forEach((integration) => {
          initialParallelState[integration.id] = {
            status: 'pending',
            pollAttempts: 0,
          }
        })
        setParallelAuthState(initialParallelState)

        setAuthState({
          currentIntegration: nextIntegration,
          connectedIntegrations: connected,
          pendingIntegrations: stillPending,
          redirectUrl: null,
          isChecking: false,
          isPolling: false,
          pollAttempts: 0,
        })
        setPhase('needs_auth')
        return false
      }
    } catch (error) {
      console.error('[WorkflowPreviewCard] Error checking connections:', error)
      addLog('Error checking connections')
      setPhase('error')
      return false
    }
  }, [oauthIntegrations, whatsAppIntegrations, checkWhatsAppStatus, addLog])

  // @NEXUS-FIX-045: Auto-check connections on mount - DO NOT REMOVE
  // This fixes the bug where WorkflowPreviewCard shows 0/X connections even though
  // the Integrations page confirms connections exist. The connectedIntegrations Set
  // starts empty and was never populated on mount - only when user clicked Execute.
  // Now we auto-check as soon as the component has required integrations.
  const checkedIntegrationsKeyRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    // Skip if no integrations needed
    if (requiredIntegrations.length === 0) {
      return
    }

    // Create a key from the current integrations to track what we've checked
    const integrationsKey = requiredIntegrations.map(i => i.toolkit).sort().join(',')

    // Only check once per unique set of integrations
    if (checkedIntegrationsKeyRef.current === integrationsKey) {
      return
    }
    checkedIntegrationsKeyRef.current = integrationsKey

    // Check connections after a short delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      console.log('[WorkflowPreviewCard] FIX-045: Auto-checking connections for:',
        requiredIntegrations.map(i => i.toolkit))
      checkConnections()
    }, 300)

    return () => clearTimeout(timer)
  }, [requiredIntegrations, checkConnections])

  // Handle connect button click - get real OAuth URL from Rube MCP
  const handleConnect = React.useCallback(async () => {
    if (!authState.currentIntegration) return

    setAuthState((prev) => ({ ...prev, isChecking: true }))
    addLog(`Getting OAuth link for ${authState.currentIntegration.name}...`)

    try {
      const toolkit = authState.currentIntegration.toolkit
      const integration = authState.currentIntegration

      // Get real OAuth URL from Rube MCP
      const results = await rubeClient.initiateConnection([toolkit])
      const result = results[toolkit]

      if (result && result.authUrl) {
        // Got real OAuth URL - show it to user
        const authUrl = result.authUrl // Capture for type safety
        addLog(`Opening ${integration.name} authentication...`)
        setAuthState((prev) => ({
          ...prev,
          redirectUrl: authUrl,
          isChecking: false,
          isPolling: true,
          pollAttempts: 0,
        }))

        // Store OAuth context for callback page
        sessionStorage.setItem('oauth_provider', toolkit)
        sessionStorage.setItem('oauth_return_url', window.location.pathname + window.location.search)

        // Open OAuth URL in new tab
        window.open(result.authUrl, '_blank', 'noopener,noreferrer')

        // Start polling for connection status (check every 3 seconds for 2 minutes)
        let attempts = 0
        const maxAttempts = 40
        const pollInterval = setInterval(async () => {
          attempts++

          // Update poll attempts for UI feedback
          setAuthState((prev) => ({
            ...prev,
            pollAttempts: attempts,
          }))

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            addLog(`${integration.name} authentication timed out`)
            setAuthState((prev) => ({
              ...prev,
              isPolling: false,
              pollAttempts: 0,
            }))
            return
          }

          try {
            const status = await rubeClient.checkConnection(toolkit)
            if (status.connected) {
              clearInterval(pollInterval)

              // Mark as connected
              const newConnected = new Set(authState.connectedIntegrations)
              newConnected.add(integration.id)

              // Save to localStorage
              localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))

              addLog(`✓ ${integration.name} connected!`)

              // Check if more integrations needed
              const remaining = authState.pendingIntegrations.filter((i) => i.id !== integration.id)

              if (remaining.length === 0) {
                // All integrations connected - trigger auto-execution
                shouldAutoExecuteRef.current = true
                setAuthState({
                  currentIntegration: null,
                  connectedIntegrations: newConnected,
                  pendingIntegrations: [],
                  redirectUrl: null,
                  isChecking: false,
                  isPolling: false,
                  pollAttempts: 0,
                })
                setPhase('ready')
              } else {
                setAuthState({
                  currentIntegration: remaining[0],
                  connectedIntegrations: newConnected,
                  pendingIntegrations: remaining,
                  redirectUrl: null,
                  isChecking: false,
                  isPolling: false,
                  pollAttempts: 0,
                })
              }
            }
          } catch {
            // Continue polling on error
          }
        }, 3000)
      } else if (result && result.connected) {
        // Already connected - move to next integration
        addLog(`✓ ${integration.name} already connected!`)
        const newConnected = new Set(authState.connectedIntegrations)
        newConnected.add(integration.id)
        localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))

        const remaining = authState.pendingIntegrations.filter((i) => i.id !== integration.id)
        if (remaining.length === 0) {
          shouldAutoExecuteRef.current = true
          setAuthState({
            currentIntegration: null,
            connectedIntegrations: newConnected,
            pendingIntegrations: [],
            redirectUrl: null,
            isChecking: false,
            isPolling: false,
            pollAttempts: 0,
          })
          setPhase('ready')
        } else {
          setAuthState({
            currentIntegration: remaining[0],
            connectedIntegrations: newConnected,
            pendingIntegrations: remaining,
            redirectUrl: null,
            isChecking: false,
            isPolling: false,
            pollAttempts: 0,
          })
        }
      } else {
        // Handle error gracefully - fall back to demo mode
        addLog(`OAuth init failed: No auth URL returned`)

        // For demo mode, simulate connection after short delay
        setAuthState((prev) => ({
          ...prev,
          isPolling: true,
          pollAttempts: 0,
        }))

        setTimeout(() => {
          const newConnected = new Set(authState.connectedIntegrations)
          newConnected.add(integration.id)
          localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))
          addLog(`✓ ${integration.name} connected (demo mode)`)

          const remaining = authState.pendingIntegrations.filter((i) => i.id !== integration.id)
          if (remaining.length === 0) {
            // All integrations connected - trigger auto-execution
            shouldAutoExecuteRef.current = true
            setAuthState({
              currentIntegration: null,
              connectedIntegrations: newConnected,
              pendingIntegrations: [],
              redirectUrl: null,
              isChecking: false,
              isPolling: false,
              pollAttempts: 0,
            })
            setPhase('ready')
          } else {
            setAuthState({
              currentIntegration: remaining[0],
              connectedIntegrations: newConnected,
              pendingIntegrations: remaining,
              redirectUrl: null,
              isChecking: false,
              isPolling: false,
              pollAttempts: 0,
            })
          }
        }, 1500)
      }
    } catch (error) {
      console.error('[WorkflowPreviewCard] Error connecting:', error)
      addLog(`Error connecting to ${authState.currentIntegration.name}`)
      setAuthState((prev) => ({ ...prev, isChecking: false }))
    }
  }, [authState, addLog])

  // Handle Connect All - PARALLEL OAuth for minimal clicks
  // CRITICAL FIX (Jan 21, 2026): Open popup windows SYNCHRONOUSLY before async calls
  // Browsers block window.open() if called after async operations (not direct user action)
  // @NEXUS-FIX-001 & @NEXUS-FIX-003: Parallel OAuth with popup blocker bypass - DO NOT MODIFY
  const handleConnectAll = React.useCallback(async () => {
    const pendingIntegrations = authState.pendingIntegrations
    if (pendingIntegrations.length === 0) return

    addLog(`Connecting all ${pendingIntegrations.length} integrations in parallel...`)
    setAuthState((prev) => ({ ...prev, isChecking: true }))

    // CRITICAL: Open popup windows IMMEDIATELY (synchronously) to avoid browser popup blocker
    // We open them with a loading page first, then navigate to OAuth URLs after we get them
    const popupWindows: Map<string, Window | null> = new Map()
    for (const integration of pendingIntegrations) {
      // Open popup synchronously - this is allowed because it's direct user action
      const popup = window.open(
        'about:blank',
        `oauth_${integration.toolkit}`,
        'width=600,height=700,left=200,top=100'
      )
      if (popup) {
        // Show loading state in popup while we fetch OAuth URLs
        popup.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Connecting ${integration.name}...</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
              }
              .loader {
                text-align: center;
              }
              .spinner {
                width: 50px;
                height: 50px;
                border: 4px solid rgba(6, 182, 212, 0.3);
                border-top-color: #06b6d4;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="loader">
              <div class="spinner"></div>
              <h2>Connecting to ${integration.name}...</h2>
              <p style="color: #94a3b8;">Preparing authorization...</p>
            </div>
          </body>
          </html>
        `)
        popupWindows.set(integration.toolkit, popup)
        addLog(`Opened ${integration.name} authorization window...`)
      } else {
        addLog(`⚠ Popup blocked for ${integration.name} - please allow popups`)
      }
    }

    // Initialize parallel state for all pending integrations
    const initialParallelState: ParallelAuthState = {}
    pendingIntegrations.forEach((integration) => {
      initialParallelState[integration.id] = {
        status: 'connecting',
        pollAttempts: 0,
      }
    })
    setParallelAuthState(initialParallelState)

    // Get OAuth URLs for all integrations in parallel
    const toolkits = pendingIntegrations.map((i) => i.toolkit)

    try {
      const results = await rubeClient.initiateConnection(toolkits)

      // Navigate popup windows to OAuth URLs and start polling
      const pollIntervals: NodeJS.Timeout[] = []

      for (const integration of pendingIntegrations) {
        const result = results[integration.toolkit]
        const popup = popupWindows.get(integration.toolkit)

        if (result?.authUrl && popup && !popup.closed) {
          // Navigate existing popup to OAuth URL
          popup.location.href = result.authUrl
          addLog(`Redirecting ${integration.name} to authorization...`)

          // Update state with auth URL
          setParallelAuthState((prev) => ({
            ...prev,
            [integration.id]: {
              status: 'polling',
              authUrl: result.authUrl,
              pollAttempts: 0,
            },
          }))

          // Start polling for this integration
          let attempts = 0
          const maxAttempts = 40
          const pollInterval = setInterval(async () => {
            attempts++

            // Update poll attempts
            setParallelAuthState((prev) => ({
              ...prev,
              [integration.id]: {
                ...prev[integration.id],
                pollAttempts: attempts,
              },
            }))

            if (attempts >= maxAttempts) {
              clearInterval(pollInterval)
              addLog(`${integration.name} authorization timed out`)
              setParallelAuthState((prev) => ({
                ...prev,
                [integration.id]: {
                  ...prev[integration.id],
                  status: 'error',
                  error: 'Timed out',
                },
              }))
              return
            }

            try {
              const status = await rubeClient.checkConnection(integration.toolkit)
              if (status.connected) {
                clearInterval(pollInterval)
                addLog(`✓ ${integration.name} connected!`)

                // Update parallel state
                setParallelAuthState((prev) => ({
                  ...prev,
                  [integration.id]: {
                    ...prev[integration.id],
                    status: 'connected',
                  },
                }))

                // Update main auth state
                setAuthState((prev) => {
                  const newConnected = new Set(prev.connectedIntegrations)
                  newConnected.add(integration.id)
                  localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))

                  const remaining = prev.pendingIntegrations.filter((i) => i.id !== integration.id)

                  if (remaining.length === 0) {
                    // All connected! Trigger auto-execution
                    shouldAutoExecuteRef.current = true
                    setPhase('ready')
                    return {
                      ...prev,
                      currentIntegration: null,
                      connectedIntegrations: newConnected,
                      pendingIntegrations: [],
                      isChecking: false,
                    }
                  }

                  return {
                    ...prev,
                    connectedIntegrations: newConnected,
                    pendingIntegrations: remaining,
                  }
                })
              }
            } catch {
              // Continue polling on error
            }
          }, 3000)

          pollIntervals.push(pollInterval)
        } else if (result?.connected) {
          // Already connected - close the popup we opened
          const popup = popupWindows.get(integration.toolkit)
          if (popup && !popup.closed) {
            popup.close()
          }
          addLog(`✓ ${integration.name} already connected!`)
          setParallelAuthState((prev) => ({
            ...prev,
            [integration.id]: {
              status: 'connected',
              pollAttempts: 0,
            },
          }))

          setAuthState((prev) => {
            const newConnected = new Set(prev.connectedIntegrations)
            newConnected.add(integration.id)
            localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))

            const remaining = prev.pendingIntegrations.filter((i) => i.id !== integration.id)

            if (remaining.length === 0) {
              shouldAutoExecuteRef.current = true
              setPhase('ready')
              return {
                ...prev,
                currentIntegration: null,
                connectedIntegrations: newConnected,
                pendingIntegrations: [],
                isChecking: false,
              }
            }

            return {
              ...prev,
              connectedIntegrations: newConnected,
              pendingIntegrations: remaining,
            }
          })
        } else {
          // Close any popup that was opened but we couldn't get auth URL for
          const popup = popupWindows.get(integration.toolkit)
          if (popup && !popup.closed) {
            popup.close()
          }

          // Handle error - fall back to demo mode for this integration
          addLog(`${integration.name}: Simulating connection (demo mode)`)
          setParallelAuthState((prev) => ({
            ...prev,
            [integration.id]: {
              status: 'polling',
              pollAttempts: 0,
            },
          }))

          // Simulate connection after delay
          setTimeout(() => {
            setParallelAuthState((prev) => ({
              ...prev,
              [integration.id]: {
                status: 'connected',
                pollAttempts: 0,
              },
            }))

            setAuthState((prev) => {
              const newConnected = new Set(prev.connectedIntegrations)
              newConnected.add(integration.id)
              localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))

              const remaining = prev.pendingIntegrations.filter((i) => i.id !== integration.id)

              if (remaining.length === 0) {
                shouldAutoExecuteRef.current = true
                setPhase('ready')
                return {
                  ...prev,
                  currentIntegration: null,
                  connectedIntegrations: newConnected,
                  pendingIntegrations: [],
                  isChecking: false,
                }
              }

              return {
                ...prev,
                connectedIntegrations: newConnected,
                pendingIntegrations: remaining,
              }
            })

            addLog(`✓ ${integration.name} connected (demo mode)`)
          }, 1500 + Math.random() * 1500) // Stagger demo connections
        }
      }

      setAuthState((prev) => ({ ...prev, isChecking: false }))
    } catch (error) {
      console.error('[WorkflowPreviewCard] Error in parallel connect:', error)
      addLog('Error getting connection links')
      setAuthState((prev) => ({ ...prev, isChecking: false }))
    }
  }, [authState.pendingIntegrations, addLog])

  // Handle single integration connect (for use within ParallelAuthPrompt)
  const handleConnectSingle = React.useCallback(async (integration: IntegrationInfo) => {
    // Directly initiate OAuth for this integration
    setAuthState((prev) => ({ ...prev, isChecking: true }))
    addLog(`Getting OAuth link for ${integration.name}...`)

    try {
      const toolkit = integration.toolkit

      // Get real OAuth URL from Rube MCP
      const results = await rubeClient.initiateConnection([toolkit])
      const result = results[toolkit]

      if (result && result.authUrl) {
        addLog(`Opening ${integration.name} authentication...`)

        // Update state with this integration as current
        setAuthState((prev) => ({
          ...prev,
          currentIntegration: integration,
          redirectUrl: result.authUrl || null,
          isChecking: false,
          isPolling: true,
          pollAttempts: 0,
        }))

        // Store OAuth context for callback page
        sessionStorage.setItem('oauth_provider', toolkit)
        sessionStorage.setItem('oauth_return_url', window.location.pathname + window.location.search)

        // Open OAuth URL in new tab
        window.open(result.authUrl, '_blank', 'noopener,noreferrer')

        // Start polling for connection status
        let attempts = 0
        const maxAttempts = 40
        const pollInterval = setInterval(async () => {
          attempts++
          setAuthState((prev) => ({ ...prev, pollAttempts: attempts }))

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            addLog(`${integration.name} authentication timed out`)
            setAuthState((prev) => ({ ...prev, isPolling: false, pollAttempts: 0 }))
            return
          }

          try {
            const status = await rubeClient.checkConnection(toolkit)
            if (status.connected) {
              clearInterval(pollInterval)
              const newConnected = new Set(authState.connectedIntegrations)
              newConnected.add(integration.id)
              localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))
              addLog(`✓ ${integration.name} connected!`)

              const remaining = authState.pendingIntegrations.filter((i) => i.id !== integration.id)
              if (remaining.length === 0) {
                shouldAutoExecuteRef.current = true
                setAuthState({
                  currentIntegration: null,
                  connectedIntegrations: newConnected,
                  pendingIntegrations: [],
                  redirectUrl: null,
                  isChecking: false,
                  isPolling: false,
                  pollAttempts: 0,
                })
                setPhase('ready')
              } else {
                setAuthState((prev) => ({
                  ...prev,
                  connectedIntegrations: newConnected,
                  pendingIntegrations: remaining,
                  isPolling: false,
                  pollAttempts: 0,
                }))
              }
            }
          } catch {
            // Continue polling on error
          }
        }, 3000)
      } else if (result && result.connected) {
        addLog(`✓ ${integration.name} already connected!`)
        const newConnected = new Set(authState.connectedIntegrations)
        newConnected.add(integration.id)
        localStorage.setItem('nexus_connected_integrations', JSON.stringify([...newConnected]))

        const remaining = authState.pendingIntegrations.filter((i) => i.id !== integration.id)
        if (remaining.length === 0) {
          shouldAutoExecuteRef.current = true
          setAuthState({
            currentIntegration: null,
            connectedIntegrations: newConnected,
            pendingIntegrations: [],
            redirectUrl: null,
            isChecking: false,
            isPolling: false,
            pollAttempts: 0,
          })
          setPhase('ready')
        } else {
          setAuthState((prev) => ({
            ...prev,
            connectedIntegrations: newConnected,
            pendingIntegrations: remaining,
            isChecking: false,
          }))
        }
      } else {
        addLog(`OAuth init failed: No auth URL returned - using demo mode`)
        setAuthState((prev) => ({ ...prev, isChecking: false }))
      }
    } catch (error) {
      console.error('[WorkflowPreviewCard] Error connecting:', error)
      addLog(`Error connecting to ${integration.name}`)
      setAuthState((prev) => ({ ...prev, isChecking: false }))
    }
  }, [authState, addLog])

  // @NEXUS-FIX-111: Track retry counts per node to prevent infinite retries - DO NOT REMOVE
  const nodeRetryCounts = React.useRef<Map<string, number>>(new Map())

  // Execute workflow with REAL API calls via Composio
  const executeWorkflow = React.useCallback(async () => {
    // Reset retry counts for fresh execution
    nodeRetryCounts.current.clear()
    // First check if we need authentication
    if (phase === 'ready' && requiredIntegrations.length > 0) {
      const allConnected = await checkConnections()
      if (!allConnected) {
        return // Will show auth prompt
      }
    }

    setPhase('executing')
    addLog('Starting workflow execution...')

    // Rube MCP is already initialized via backend - no client init needed

    // Reset all nodes to pending
    setNodes((prev) => prev.map((n) => ({ ...n, status: 'pending' as NodeStatus })))

    // Execute each node
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]

      // Set current node to connecting
      setNodes((prev) =>
        prev.map((n, idx) => ({
          ...n,
          status: idx === i ? 'connecting' : idx < i ? 'success' : 'pending',
        }))
      )

      addLog(`Executing: ${node.name}...`)

      try {
        // Get integration info for this node
        const integrationInfo = getIntegrationInfo(node.integration || node.name)
        // Note: execution time is now tracked by VerifiedExecutor (@NEXUS-FIX-041)

        // HANDLE DIFFERENT NODE TYPES:
        // 1. Trigger nodes (webhooks) - These are EVENT LISTENERS, not runtime executions
        //    In production: Configured once in Composio to send webhooks to our endpoint
        //    In beta test: Mark as "configured" - actual events come from the connected service
        // 2. AI nodes - Internal processing, no external API call needed
        // 3. Action nodes - These ARE runtime executions (send email, create task, etc.)

        const isTriggerNode = node.type === 'trigger' ||
          node.name.toLowerCase().includes('monitor') ||
          node.name.toLowerCase().includes('watch') ||
          node.name.toLowerCase().includes('listen') ||
          node.name.toLowerCase().includes('receive') ||
          node.name.toLowerCase().includes('capture') ||
          node.name.toLowerCase().includes('incoming')

        // @NEXUS-FIX-110: Tightened AI/Internal node classification - DO NOT REMOVE
        // Problem: Keywords like 'extract', 'analyze', 'generate', 'process' caused REAL
        // action nodes (e.g., "Extract Email Attachments", "Generate Invoice", "Process Payment")
        // to be skipped as "AI processing" when they are actually real API calls.
        // Solution: ONLY classify as AI/internal when the integration is EXPLICITLY 'ai' or 'nexus'.
        // Nodes with real integrations (gmail, slack, etc.) should ALWAYS go through execution.
        const hasRealIntegration = integrationInfo.toolkit !== 'ai' &&
          integrationInfo.toolkit !== 'nexus' &&
          integrationInfo.toolkit !== 'unknown' &&
          integrationInfo.toolkit !== 'default' &&
          node.integration?.toLowerCase() !== 'ai' &&
          node.integration?.toLowerCase() !== 'nexus'

        const isAINode = !hasRealIntegration && (
          integrationInfo.toolkit === 'ai' ||
          node.integration?.toLowerCase() === 'ai'
        )

        // Detect internal/output nodes that don't need external API calls
        // These are Nexus-internal steps like "Display Results", "Show Summary", etc.
        // CRITICAL: Only treat as internal if the node does NOT have a real integration
        const nodeNameLower = node.name.toLowerCase()
        const hasOutputPattern = nodeNameLower.includes('display') ||
          nodeNameLower.includes('show output') ||
          nodeNameLower.includes('show result') ||
          nodeNameLower.includes('show summary') ||
          nodeNameLower.includes('present result') ||
          nodeNameLower.includes('format output') ||
          nodeNameLower.includes('notify user') ||
          nodeNameLower.includes('workflow complete')

        const isInternalNode = !hasRealIntegration && (
          integrationInfo.toolkit === 'nexus' ||
          node.integration?.toLowerCase() === 'nexus' ||
          node.type === 'output' ||
          // For unknown/default toolkit, only treat as internal if it has output patterns
          ((integrationInfo.toolkit === 'unknown' || integrationInfo.toolkit === 'default') && hasOutputPattern)
        )
        // @NEXUS-FIX-110-END

        // Handle trigger nodes - they need sample data for beta testing
        if (isTriggerNode) {
          // Check if we have sample data for this trigger
          const sampleData = triggerSampleData[node.id]

          if (!sampleData || Object.keys(sampleData).length === 0) {
            // No sample data provided - prompt the user
            addLog(`⏸️ ${node.name} - Needs sample data for beta test`)

            // Show the sample data prompt
            setCurrentTriggerNode(node.id)
            setShowTriggerDataPrompt(true)

            // Pause execution and set node to "waiting" status
            setNodes((prev) =>
              prev.map((n, idx) => ({
                ...n,
                status: idx === i ? 'connecting' : idx < i ? 'success' : 'pending',
              }))
            )

            // Set phase to indicate we're waiting for input
            setPhase('ready')

            // Don't continue - we need to wait for user input
            // The workflow will be retried after sample data is provided
            return
          }

          // Check if this was skipped (user clicked "Skip" button)
          const wasSkipped = sampleData._skipped === 'true'

          if (wasSkipped) {
            addLog(`⚡ ${node.name} - Skipped (no sample data provided)`)
            setNodes((prev) =>
              prev.map((n, idx) => ({
                ...n,
                status: idx <= i ? 'success' : 'pending',
                result: idx === i ? {
                  type: 'trigger_skipped',
                  data: {},
                  message: 'Trigger skipped (no sample data)',
                  note: 'In production, this would receive real events from the webhook'
                } : n.result,
              }))
            )
          } else {
            // We have real sample data - use it!
            addLog(`⚡ ${node.name} - Using sample data: ${JSON.stringify(sampleData).substring(0, 50)}...`)

            // Mark trigger as complete with the sample data as its "result"
            // This data will flow to subsequent nodes
            setNodes((prev) =>
              prev.map((n, idx) => ({
                ...n,
                status: idx <= i ? 'success' : 'pending',
                result: idx === i ? {
                  type: 'trigger_sample_data',
                  data: sampleData,
                  message: 'Sample data received (beta test)',
                  note: 'In production, this would be real event data from the webhook'
                } : n.result,
              }))
            )
          }
          continue // Move to next node
        }

        // Handle AI processing nodes - internal processing, no external API
        if (isAINode) {
          addLog(`🤖 ${node.name} - AI processing step`)

          // Simulate AI processing (in production, this would use Claude/OpenAI)
          await new Promise(resolve => setTimeout(resolve, 500)) // Brief delay for UX

          setNodes((prev) =>
            prev.map((n, idx) => ({
              ...n,
              status: idx <= i ? 'success' : 'pending',
              result: idx === i ? {
                type: 'ai_processing',
                message: 'AI analysis complete',
                note: 'Internal processing step - no external API required'
              } : n.result,
            }))
          )
          continue // Move to next node
        }

        // Handle internal/output nodes - no external API needed
        // These are steps like "Display Results", "Show Summary" that present data within Nexus
        if (isInternalNode) {
          addLog(`📊 ${node.name} - Internal Nexus step`)

          // Brief delay for UX consistency
          await new Promise(resolve => setTimeout(resolve, 300))

          // Collect results from previous nodes to display
          const previousResults = nodes.slice(0, i).map(n => n.result).filter(Boolean)

          setNodes((prev) =>
            prev.map((n, idx) => ({
              ...n,
              status: idx <= i ? 'success' : 'pending',
              result: idx === i ? {
                type: 'internal_output',
                message: `${node.name} complete`,
                note: 'Internal Nexus step - displays workflow results',
                previousData: previousResults.length > 0 ? previousResults : 'No data from previous steps'
              } : n.result,
            }))
          )
          continue // Move to next node
        }

        // For ACTION nodes - these require actual API execution
        // Map node name to Composio tool slug
        // @NEXUS-FIX-062: Orchestration-First Execution Path - DO NOT REMOVE
        // Problem: Even with USE_ORCHESTRATION_FIRST=true, execution still used legacy path for known toolkits
        // Solution: Check orchestration results FIRST (for all toolkits), then fall back to legacy
        const toolkitLower = integrationInfo.toolkit.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')
        let toolSlug: string | null = null

        // @NEXUS-FIX-062: Check for pre-discovered orchestration result FIRST (for ALL toolkits)
        const storedOrchResult = orchestrationResults.get(node.id)
        if (storedOrchResult && storedOrchResult.slug) {
          // We have a valid orchestration result from pre-flight - use it!
          toolSlug = storedOrchResult.slug
          const isKnown = isToolkitKnown(toolkitLower)

          // @NEXUS-FIX-063: Override orchestration slug with legacy for KNOWN toolkits during EXECUTION - DO NOT REMOVE
          // Problem: Pre-flight stores orchestration slug (e.g., CALENDAR_CREATE) but this is often wrong
          // Solution: For known toolkits, always use legacy TOOL_SLUGS mapping which has correct tool names
          // This mirrors the pre-flight FIX-063 logic but applies it during execution phase
          if (isKnown) {
            const legacySlug = mapNodeToToolSlug(node.name, integrationInfo.toolkit)
            if (legacySlug && legacySlug !== toolSlug) {
              console.log(`[ORCHESTRATION-FIRST] FIX-063: Overriding execution slug ${toolSlug} with legacy slug ${legacySlug}`)
              toolSlug = legacySlug
            }
          }

          if (USE_ORCHESTRATION_FIRST && isKnown) {
            console.log(`[ORCHESTRATION-FIRST] Using tool for KNOWN toolkit ${toolkitLower}: ${toolSlug}`)
          } else {
            console.log(`[ORCHESTRATION] Using pre-discovered tool for ${node.id}: ${toolSlug}`)
          }
        } else if (isToolkitKnown(toolkitLower)) {
          // KNOWN TOOLKIT with no orchestration result: Use legacy fast path
          toolSlug = mapNodeToToolSlug(node.name, integrationInfo.toolkit)
          console.log(`[LEGACY] Using legacy path for known toolkit ${toolkitLower}: ${toolSlug}`)
        } else if (USE_GENERIC_ORCHESTRATION) {
          // UNKNOWN TOOLKIT with no orchestration result: Try orchestration now
          addLog(`🔍 ${node.name} - Unknown toolkit "${integrationInfo.toolkit}", discovering via orchestration...`)
          console.log(`[ORCHESTRATION] Unknown toolkit "${integrationInfo.toolkit}" - trying orchestration first`)
          const orchResult = await resolveToolViaOrchestration(node.name, integrationInfo.toolkit)
          if (orchResult) {
            toolSlug = orchResult.slug
            addLog(`✅ Discovered: ${orchResult.displayName} (${orchResult.slug})`)
            console.log(`[ORCHESTRATION] Session: ${orchResult.sessionId}, Questions: ${orchResult.questions.length}`)
            // Store result for schema validation later
            setOrchestrationResults(prev => {
              const updated = new Map(prev)
              updated.set(node.id, orchResult)
              return updated
            })
          } else {
            // Orchestration failed - fall back to dynamic construction
            console.log(`[ORCHESTRATION] Discovery failed for "${integrationInfo.toolkit}", using dynamic construction fallback`)
            toolSlug = mapNodeToToolSlug(node.name, integrationInfo.toolkit)
          }
        } else {
          // Orchestration disabled - use legacy dynamic construction
          toolSlug = mapNodeToToolSlug(node.name, integrationInfo.toolkit)
        }

        // @NEXUS-FIX-019: Pre-execution tool validation - DO NOT REMOVE
        if (toolSlug) {
          const validation = validateToolSlug(toolSlug, integrationInfo.toolkit)
          if (!validation.valid && validation.suggestion) {
            addLog(`⚠️ Validation: ${validation.reason}`)
          }
        }

        if (!toolSlug) {
          // NO tool mapping - this is an error, not something to simulate
          throw new Error(
            `No tool mapping for "${node.name}" (toolkit: ${integrationInfo.toolkit}). ` +
            `This integration is not yet supported. Please check that ${integrationInfo.name} ` +
            `is correctly configured and has the required API access.`
          )
        }

        // Get params and validate required ones before execution
        // @NEXUS-FIX-113: Pass previous node results for data flow between steps - DO NOT REMOVE
        const previousNodeResults = nodes.slice(0, i).map(n => ({ node: n, result: n.result }))
        const defaultParams = getDefaultParams(toolSlug, node, previousNodeResults, {
          name: workflow.name,
          description: workflow.description,
        })

        // @NEXUS-FIX-029: Merge collected params from user answers - DO NOT REMOVE
        // User answers are stored under integration name, map them to actual param names
        const collectedToolParams = mapCollectedParamsToToolParams(
          workflow.collectedParams,
          integrationInfo.toolkit,
          toolSlug
        )

        // Merge: collected params override defaults (user answers take priority)
        const params = { ...defaultParams, ...collectedToolParams }
        console.log('[WorkflowPreviewCard] Final params after merge:', params)

        // @NEXUS-FIX-062: Dynamic schema-based parameter validation - DO NOT REMOVE
        // Problem: Hardcoded validateRequiredParams() only knows ~30 tools out of 500+
        // Solution: Fetch actual required params from Composio schema dynamically
        let missingParams: string[] = []
        const storedOrch = orchestrationResults.get(node.id)
        if (storedOrch?.sessionId) {
          // We have a sessionId from orchestration - use dynamic schema
          try {
            const schemaResolver = getSchemaResolver()
            const schema = await schemaResolver.getSchema(toolSlug, storedOrch.sessionId)
            console.log(`[WorkflowPreviewCard] FIX-062: Got schema for ${toolSlug}, required: ${schema.required?.join(', ') || 'none'}`)

            // Check which required params are missing
            const requiredFromSchema = schema.required || []
            missingParams = requiredFromSchema.filter(param => {
              const value = params[param]
              return value === undefined || value === null || value === ''
            })
          } catch (schemaError) {
            console.warn(`[WorkflowPreviewCard] FIX-062: Schema fetch failed, using fallback validation`, schemaError)
            missingParams = validateRequiredParams(toolSlug, params)
          }
        } else {
          // No sessionId - fall back to hardcoded validation
          missingParams = validateRequiredParams(toolSlug, params)
        }

        // @NEXUS-FIX-021: User-friendly missing parameter messages - DO NOT REMOVE
        // @NEXUS-FIX-031: Include raw param name for correct collection key - DO NOT REMOVE
        // Problem: UI was using integration name (e.g., 'whatsapp') as collection key for ALL params
        //          This caused second param to overwrite first (both mapped to 'to')
        // Solution: Include [param:XXX] in error so UI can use actual param name as key
        if (missingParams.length > 0) {
          // Convert technical param names to user-friendly questions
          const friendlyPrompts = missingParams.map(param =>
            getParamFixSuggestion(param, integrationInfo.toolkit)
          )
          // @NEXUS-FIX-031: Include first missing param name for UI to use as collection key
          throw new Error(
            `Missing Information: ${node.name} [param:${missingParams[0]}]\n\n` +
            `💡 I need more details to complete this step. Please tell me:\n` +
            friendlyPrompts.map(p => `• ${p}`).join('\n')
          )
        }

        // @NEXUS-FIX-115: Pre-execution connection validation - DO NOT REMOVE
        // Problem: Expired OAuth tokens caused execution failures mid-workflow
        // Solution: Check connection status before executing and warn early
        try {
          const connStatus = await rubeClient.checkConnection(integrationInfo.toolkit)
          if (!connStatus.connected) {
            addLog(`⚠️ ${integrationInfo.name} connection may be expired — attempting execution anyway...`)
            console.warn(`[FIX-115] ${integrationInfo.toolkit} not connected before execution. Will attempt anyway.`)
          }
        } catch (connCheckErr) {
          // Non-blocking — don't fail the workflow just because connection check failed
          console.warn(`[FIX-115] Connection pre-check failed for ${integrationInfo.toolkit}:`, connCheckErr)
        }
        // @NEXUS-FIX-115-END

        // @NEXUS-FIX-041: Execute with VERIFICATION via VerifiedExecutor - DO NOT REMOVE
        // This replaces direct rubeClient.executeTool() to fix silent failures
        const verifiedResult: VerifiedResult = await VerifiedExecutorService.execute(
          toolSlug,
          params,
          {
            nodeId: node.id,
            nodeName: node.name,
            toolkit: integrationInfo.toolkit,
            action: node.type,
            workflowName: workflow.name,
          }
        )

        const executionTime = verifiedResult.executionTimeMs

        if (verifiedResult.success && verifiedResult.verified) {
          // VERIFIED SUCCESS - action actually happened!
          const proofSummary = verifiedResult.proof
            ? VerifiedExecutorService.formatProofForDisplay(verifiedResult.proof)
            : 'Completed'
          addLog(`✓ ${node.name}: ${proofSummary} (${executionTime}ms)`)

          // Update node with result and proof
          const rawData = (verifiedResult.rawResponse as Record<string, unknown>) || {}
          setNodes((prev) =>
            prev.map((n, idx) => ({
              ...n,
              status: idx <= i ? 'success' : 'pending',
              result: idx === i ? {
                ...rawData,
                _verified: true,
                _proof: verifiedResult.proof,
              } : n.result,
            }))
          )
        } else if (verifiedResult.success && !verifiedResult.verified) {
          // API succeeded but couldn't verify - warn user
          addLog(`⚠️ ${node.name}: Completed but unverified (${executionTime}ms)`)
          console.warn('[WorkflowPreviewCard] Unverified result:', verifiedResult)

          // Still mark as success but with warning
          const rawDataUnverified = (verifiedResult.rawResponse as Record<string, unknown>) || {}
          setNodes((prev) =>
            prev.map((n, idx) => ({
              ...n,
              status: idx <= i ? 'success' : 'pending',
              result: idx === i ? {
                ...rawDataUnverified,
                _verified: false,
                _warning: verifiedResult.error?.message || 'Could not verify action',
              } : n.result,
            }))
          )
        } else {
          // Execution failed - throw with user-friendly error
          const errorMsg = verifiedResult.error?.message || 'Execution failed'
          throw new Error(errorMsg)
        }
      } catch (error) {
        console.error(`[WorkflowPreviewCard] Error executing ${node.name}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        // @NEXUS-FIX-039: Enhanced error classification for user-friendly messages - DO NOT REMOVE
        const catchIntegrationInfo = getIntegrationInfo(node.integration || node.name)
        const errorAnalysis = WorkflowIntelligenceService.classifyError(error as Error, {
          nodeId: node.id,
          toolkit: catchIntegrationInfo.toolkit,
          nodeName: node.name,
        })
        const friendlyMsg = errorAnalysis.friendlyMessage

        // @NEXUS-FIX-111: Auto-retry for recoverable errors - DO NOT REMOVE
        // Problem: Transient errors (rate limits, network, timeouts) killed the entire workflow
        // Solution: Classify the error and retry recoverable ones with exponential backoff
        const retryableCategories = ['rate_limited', 'network_error', 'timeout', 'service_unavailable']
        const errorCategory = errorAnalysis.classification?.category || 'unknown'
        const isRetryable = retryableCategories.includes(errorCategory)
        const maxRetries = errorCategory === 'rate_limited' ? 3 : 2
        const nodeRetryKey = `retry_${node.id}`
        const currentRetry = (nodeRetryCounts.current.get(nodeRetryKey) || 0)

        if (isRetryable && currentRetry < maxRetries) {
          // Increment retry count
          nodeRetryCounts.current.set(nodeRetryKey, currentRetry + 1)
          const backoffMs = Math.min(2000 * Math.pow(2, currentRetry), 15000)
          addLog(`⏳ ${node.name}: ${friendlyMsg} — Retrying in ${Math.round(backoffMs / 1000)}s (attempt ${currentRetry + 1}/${maxRetries})...`)

          // Set node to connecting status during retry wait
          setNodes((prev) =>
            prev.map((n, idx) => ({
              ...n,
              status: idx === i ? 'connecting' : idx < i ? 'success' : 'pending',
            }))
          )

          // Wait then retry this node by decrementing i
          await new Promise(resolve => setTimeout(resolve, backoffMs))
          i-- // Will be incremented by for loop, net effect: retry same node
          continue
        }
        // @NEXUS-FIX-111-END

        // @NEXUS-FIX-020: Tool-not-found detection with fallback suggestions - DO NOT REMOVE
        if (isToolNotFoundError(error as Error)) {
          // Re-compute tool slug in catch block since try-block variables are out of scope
          const catchToolSlug = mapNodeToToolSlug(node.name, catchIntegrationInfo.toolkit)
          const fallbacks = getFallbackTools(catchIntegrationInfo.toolkit, catchToolSlug || '', node.name)
          if (fallbacks.length > 0) {
            addLog(`⚠️ Tool not found: ${catchToolSlug}. Try: ${fallbacks.join(', ')}`)
          } else {
            addLog(`✗ ${node.name}: ${friendlyMsg}`)
          }
        } else {
          // Use friendly message from ErrorClassifier
          addLog(`✗ ${node.name}: ${friendlyMsg}`)
        }

        // @NEXUS-FIX-112: Continue-on-error for non-critical nodes - DO NOT REMOVE
        // Problem: Any node failure killed the entire workflow, even for non-critical steps
        // Solution: Notification/output/non-critical nodes show warning but don't stop execution
        const catchNodeNameLower = node.name.toLowerCase()
        const isNonCriticalNode = catchNodeNameLower.includes('notify') ||
          catchNodeNameLower.includes('alert') ||
          catchNodeNameLower.includes('log') ||
          catchNodeNameLower.includes('notification') ||
          node.type === 'output' ||
          (i === nodes.length - 1 && catchNodeNameLower.includes('summary'))

        if (isNonCriticalNode && !errorMessage.includes('Missing Information')) {
          addLog(`⚠️ ${node.name}: Skipped (non-critical) — ${friendlyMsg}`)
          setNodes((prev) =>
            prev.map((n, idx) => ({
              ...n,
              status: idx === i ? 'success' : idx < i ? 'success' : 'pending',
              result: idx === i ? {
                _skipped: true,
                _warning: friendlyMsg,
                _error: errorMessage,
              } : n.result,
            }))
          )
          continue // Skip this node and continue workflow
        }
        // @NEXUS-FIX-112-END

        // Execution genuinely failed — show the error to the user
        setNodes((prev) =>
          prev.map((n, idx) => ({
            ...n,
            status: idx === i ? 'error' : idx < i ? 'success' : 'pending',
            error: idx === i ? errorMessage : undefined,
          }))
        )

        setPhase('error')
        userMemoryService.recordEvent('workflow_executed', { success: false, name: workflow.name })
        onExecutionComplete?.(false)
        return
      }
    }

    // All done!
    addLog('Workflow completed successfully!')
    setPhase('complete')
    userMemoryService.recordEvent('workflow_executed', {
      success: true,
      name: workflow.name,
      integrations: requiredIntegrations.map(i => i.toolkit),
    })
    onExecutionComplete?.(true)
  // @NEXUS-FIX-023: Added triggerSampleData to dependencies to fix stale closure bug - DO NOT REMOVE
  }, [phase, requiredIntegrations.length, nodes, checkConnections, addLog, onExecutionComplete, triggerSampleData])

  // @NEXUS-FIX-023: Keep ref updated with latest executeWorkflow (for use in setTimeout) - DO NOT REMOVE
  React.useEffect(() => {
    executeWorkflowRef.current = executeWorkflow
  }, [executeWorkflow])

  // Auto-execute on mount if requested
  React.useEffect(() => {
    if (autoExecute) {
      const timer = setTimeout(executeWorkflow, 500)
      return () => clearTimeout(timer)
    }
  }, [autoExecute, executeWorkflow])

  // Auto-execute after all integrations connect (user completed OAuth)
  React.useEffect(() => {
    if (phase === 'ready' && shouldAutoExecuteRef.current) {
      shouldAutoExecuteRef.current = false
      addLog('All integrations connected - auto-executing workflow...')
      // Small delay to let user see the success state
      const timer = setTimeout(() => {
        executeWorkflow()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [phase, executeWorkflow, addLog])

  // @NEXUS-FIX-026 & @NEXUS-FIX-094: Auto-retry after user provides missing parameter - DO NOT REMOVE
  // When collectedParams changes while in error state, reset and retry execution
  // @NEXUS-FIX-094: Fixed bug where setPhase('ready') triggered re-render which canceled the timeout
  // Solution: Use a separate ref flag to decouple state reset from execution trigger
  const prevCollectedParamsRef = React.useRef<string | null>(null)
  const pendingAutoRetryRef = React.useRef<boolean>(false)

  // Phase 1: Detect param change while in error state, set flag and reset state
  React.useEffect(() => {
    const currentParamsKey = workflow.collectedParams
      ? JSON.stringify(workflow.collectedParams)
      : null

    // Only trigger retry if:
    // 1. We have new collected params
    // 2. They're different from before
    // 3. We're currently in error state
    if (
      currentParamsKey &&
      currentParamsKey !== prevCollectedParamsRef.current &&
      phase === 'error'
    ) {
      console.log('[FIX-094] Collected params changed in error state, scheduling retry:', workflow.collectedParams)
      addLog('Got your answer! Retrying workflow...')

      // Set flag BEFORE state change - this survives the re-render
      pendingAutoRetryRef.current = true

      // Reset workflow state (this triggers re-render)
      setPhase('ready')
      setNodes((prev) => prev.map((n) => ({ ...n, status: 'idle' as NodeStatus, error: undefined })))
      setExecutionLog([])

      prevCollectedParamsRef.current = currentParamsKey
    } else {
      // Update ref without triggering retry (for initial mount or non-error states)
      prevCollectedParamsRef.current = currentParamsKey
    }
  }, [workflow.collectedParams, phase, addLog])

  // Phase 2: Execute when phase becomes 'ready' AND we have a pending retry
  // @NEXUS-FIX-094: Separate effect that doesn't get canceled by state changes
  React.useEffect(() => {
    if (phase === 'ready' && pendingAutoRetryRef.current) {
      // Clear the flag first to prevent double execution
      pendingAutoRetryRef.current = false

      console.log('[FIX-094] Executing auto-retry now that phase is ready')

      // Small delay to allow React to settle
      const timer = setTimeout(() => {
        executeWorkflowRef.current()
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [phase])

  // Open full workflow visualization
  const openFullView = React.useCallback(() => {
    const workflowData = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      nodes: workflow.nodes,
      generatedAt: Date.now(),
    }
    localStorage.setItem('nexus_generated_workflow', JSON.stringify(workflowData))
    navigate('/workflow-demo?source=ai')
  }, [navigate, workflow])

  // Reset workflow
  const resetWorkflow = React.useCallback(() => {
    setPhase('ready')
    setNodes((prev) => prev.map((n) => ({ ...n, status: 'idle' as NodeStatus })))
    setExecutionLog([])
  }, [])

  // Calculate progress
  const completedNodes = nodes.filter((n) => n.status === 'success').length
  const progress = (completedNodes / nodes.length) * 100
  const isExecuting = phase === 'executing'
  const isComplete = phase === 'complete'
  const hasError = phase === 'error'

  // @NEXUS-FIX-047: Check if ALL nodes were verified, not just successful - DO NOT REMOVE
  // This prevents showing "Beta Test Passed!" when delivery couldn't be confirmed
  const allVerified = React.useMemo(() => {
    if (!isComplete) return true // Only matters when complete
    return nodes.every((n) => {
      // Check if node result has _verified flag
      const result = n.result as Record<string, unknown> | undefined
      // If no result, consider verified (trigger nodes might not have results)
      if (!result) return true
      // If _verified is explicitly false, it's unverified
      return result._verified !== false
    })
  }, [isComplete, nodes])

  // Count unverified nodes for display
  const unverifiedCount = React.useMemo(() => {
    if (!isComplete) return 0
    return nodes.filter((n) => {
      const result = n.result as Record<string, unknown> | undefined
      return result?._verified === false
    }).length
  }, [isComplete, nodes])
  const needsAuth = phase === 'needs_auth'
  const isChecking = phase === 'checking'

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 overflow-hidden transition-all duration-300',
        'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800',
        isComplete
          ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/20'
          : hasError
          ? 'border-red-500/50 shadow-lg shadow-red-500/20'
          : needsAuth
          ? 'border-purple-500/50 shadow-lg shadow-purple-500/20'
          : isExecuting
          ? 'border-amber-500/50 shadow-lg shadow-amber-500/20'
          : 'border-slate-700 hover:border-slate-600',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              isComplete
                ? 'bg-emerald-500/20'
                : hasError
                ? 'bg-red-500/20'
                : needsAuth
                ? 'bg-purple-500/20'
                : 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20'
            )}
          >
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : hasError ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : needsAuth ? (
              <Link2 className="w-5 h-5 text-purple-400" />
            ) : (
              <Zap className="w-5 h-5 text-cyan-400" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">{workflow.name}</h4>
            <p className="text-xs text-slate-400">{nodes.length} steps</p>
          </div>
        </div>

        <button
          onClick={openFullView}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Open full visualization"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* @NEXUS-WHATSAPP: WhatsApp Connection Prompt (when WhatsApp needs connection) */}
      {whatsAppState.needed && whatsAppState.showPrompt && !whatsAppState.connected && (
        <div className="px-4 pb-4">
          <WhatsAppConnectionPrompt
            onConnected={handleWhatsAppConnected}
            onSkip={() => setWhatsAppState(prev => ({ ...prev, showPrompt: false }))}
          />
        </div>
      )}

      {/* Auth Prompt (when needs authentication) - only show if WhatsApp is already connected */}
      {needsAuth && authState.pendingIntegrations.length > 0 && isParallelMode && (whatsAppState.connected || !whatsAppState.needed) && (
        <ParallelAuthPrompt
          integrations={authState.pendingIntegrations}
          parallelState={parallelAuthState}
          onConnectAll={handleConnectAll}
          onConnectSingle={handleConnectSingle}
          isLoading={authState.isChecking}
          connectedCount={authState.connectedIntegrations.size}
        />
      )}

      {/* Legacy sequential auth (fallback) - only show if WhatsApp is already connected */}
      {needsAuth && authState.currentIntegration && !isParallelMode && (whatsAppState.connected || !whatsAppState.needed) && (
        <AuthPrompt
          integration={authState.currentIntegration}
          redirectUrl={authState.redirectUrl}
          onConnect={handleConnect}
          onSkip={() => setPhase('ready')}
          connectedCount={authState.connectedIntegrations.size}
          totalCount={oauthIntegrations.length}
          isLoading={authState.isChecking}
          isPolling={authState.isPolling}
          pollAttempts={authState.pollAttempts}
        />
      )}

      {/* Workflow visualization (when not in auth mode) */}
      {!needsAuth && (
        <>
          <div className="px-2 sm:px-4 py-3 sm:py-4">
            {/* @NEXUS-FIX-103: Unified horizontal scroll for all screen sizes - IDENTICAL mobile/desktop experience - DO NOT REMOVE */}
            <div className="flex items-center overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700 pb-2 snap-x snap-mandatory touch-pan-x">
              {nodes.map((node, index) => (
                <MiniNodeHorizontal
                  key={node.id}
                  node={node}
                  isLast={index === nodes.length - 1}
                  onRemove={onNodeRemove ? (id) => {
                    onNodeRemove(id)
                    setNodes(prev => prev.filter(n => n.id !== id))
                  } : undefined}
                  canEdit={phase === 'ready' && !!onNodeRemove}
                  onSelect={handleNodeSelect}
                  isSelected={selectedNodeId === node.id}
                />
              ))}
            </div>

            {/* @NEXUS-FIX-121: Selected node detail panel - renders OUTSIDE scroll overflow so it's always visible - DO NOT REMOVE */}
            {selectedNode && (
              <div className="mt-2 mx-1 p-3 rounded-lg bg-slate-800/90 border border-slate-600 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className="text-xl flex-shrink-0 mt-0.5">{getIcon(selectedNode.integration)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white leading-snug">{selectedNode.name}</p>
                      {selectedNode.integration && (
                        <p className="text-xs text-cyan-400 mt-0.5 capitalize">{selectedNode.integration}</p>
                      )}
                      {selectedNode.description && (
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{selectedNode.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-slate-400">
                          {selectedNode.type === 'trigger' ? '⚡ Trigger' : selectedNode.type === 'output' ? '📤 Output' : '⚙️ Action'}
                        </span>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          selectedNode.status === 'success' && 'bg-emerald-500/20 text-emerald-400',
                          selectedNode.status === 'connecting' && 'bg-amber-500/20 text-amber-400',
                          selectedNode.status === 'error' && 'bg-red-500/20 text-red-400',
                          selectedNode.status === 'idle' && 'bg-slate-600/50 text-slate-400',
                          selectedNode.status === 'pending' && 'bg-blue-500/20 text-blue-400'
                        )}>
                          {selectedNode.status === 'idle' ? 'Waiting' : selectedNode.status === 'pending' ? 'Pending' : selectedNode.status === 'connecting' ? 'Running...' : selectedNode.status === 'success' ? 'Complete' : 'Failed'}
                        </span>
                      </div>
                      {selectedNode.error && (
                        <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg mt-2">{selectedNode.error}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-slate-400 hover:text-white transition-colors p-1 -mt-1 -mr-1 flex-shrink-0"
                    aria-label="Close node details"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>
                {isComplete
                  ? 'Workflow completed!'
                  : hasError
                  ? 'Execution failed'
                  : isExecuting
                  ? 'Executing...'
                  : isChecking
                  ? 'Checking connections...'
                  : 'Ready to execute'}
              </span>
              <span>
                {completedNodes}/{nodes.length}
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  isComplete
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : hasError
                    ? 'bg-gradient-to-r from-red-500 to-red-400'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Assumptions display (what defaults were used) */}
          {workflow.assumptions && workflow.assumptions.length > 0 && !isComplete && !hasError && (
            <div className="px-4 pb-3">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-300 mb-1">Smart defaults applied:</p>
                    <ul className="space-y-1">
                      {workflow.assumptions.map((assumption, idx) => (
                        <li key={idx} className="text-xs text-blue-200/80">• {assumption}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Missing info questions (need answers before execution) */}
          {/* @NEXUS-FIX-104: Hide MissingInfoSection when Quick Setup has questions to prevent duplicates - DO NOT REMOVE */}
          {/* @NEXUS-FIX-108: Pass collectedParams so MissingInfoSection can skip already-answered questions - DO NOT REMOVE */}
          {workflow.missingInfo && workflow.missingInfo.length > 0 && !isComplete && !hasError && !isExecuting &&
           !(preFlightResult && preFlightResult.questions && preFlightResult.questions.length > 0) && (
            <MissingInfoSection
              missingInfo={workflow.missingInfo}
              onSelect={onMissingInfoSelect}
              collectedParams={collectedParams}
            />
          )}

          {/* Trigger sample data prompt (for beta testing triggers) */}
          {showTriggerDataPrompt && currentTriggerNode && (() => {
            const triggerNode = nodes.find(n => n.id === currentTriggerNode)
            if (!triggerNode) return null
            const integrationInfo = getIntegrationInfo(triggerNode.integration || triggerNode.name)
            return (
              <TriggerSampleDataPrompt
                node={triggerNode}
                toolkit={integrationInfo.toolkit}
                onSubmit={(nodeId, data) => {
                  // Save the sample data
                  setTriggerSampleData(prev => ({
                    ...prev,
                    [nodeId]: data
                  }))
                  // Hide the prompt
                  setShowTriggerDataPrompt(false)
                  setCurrentTriggerNode(null)
                  // @NEXUS-FIX-023: Use ref to get latest executeWorkflow (fixes stale closure) - DO NOT REMOVE
                  // Resume execution - it will pick up from where it left off
                  // Use a small delay to let state settle
                  setTimeout(() => {
                    executeWorkflowRef.current()
                  }, 100)
                }}
                onCancel={() => {
                  // User chose to skip - provide empty sample data to continue
                  setTriggerSampleData(prev => ({
                    ...prev,
                    [currentTriggerNode]: { _skipped: 'true' }
                  }))
                  setShowTriggerDataPrompt(false)
                  setCurrentTriggerNode(null)
                  // @NEXUS-FIX-023: Use ref to get latest executeWorkflow (fixes stale closure) - DO NOT REMOVE
                  // Resume execution
                  setTimeout(() => {
                    executeWorkflowRef.current()
                  }, 100)
                }}
              />
            )
          })()}

          {/* Confidence indicator */}
          {workflow.confidence !== undefined && workflow.confidence < 0.85 && !isComplete && !hasError && (
            <div className="px-4 pb-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Confidence:</span>
                <span className={cn(
                  'font-medium',
                  workflow.confidence >= 0.85 ? 'text-emerald-400' :
                  workflow.confidence >= 0.70 ? 'text-amber-400' : 'text-red-400'
                )}>
                  {Math.round(workflow.confidence * 100)}%
                </span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    workflow.confidence >= 0.85 ? 'bg-emerald-500' :
                    workflow.confidence >= 0.70 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ width: `${workflow.confidence * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Execution mode toggle (Beta vs Production) */}
          {!isComplete && !hasError && !isExecuting && !isChecking && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-lg">
                <button
                  onClick={() => setExecutionMode('beta')}
                  className={cn(
                    'flex-1 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                    executionMode === 'beta'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-300'
                  )}
                >
                  <FlaskConical className="w-3.5 h-3.5" /> Beta Test
                  <span className="text-[10px] opacity-70">(Your Account)</span>
                </button>
                <button
                  onClick={() => setExecutionMode('production')}
                  className={cn(
                    'flex-1 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                    executionMode === 'production'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-300'
                  )}
                >
                  <Rocket className="w-3.5 h-3.5" /> Production
                  <span className="text-[10px] opacity-70">(Client)</span>
                </button>
              </div>
              {executionMode === 'beta' && (
                <p className="text-[10px] text-amber-400/80 mt-1.5 text-center">
                  Test with YOUR connected accounts before deploying to clients
                </p>
              )}
              {executionMode === 'production' && (
                <p className="text-[10px] text-emerald-400/80 mt-1.5 text-center">
                  Execute using client's connected accounts
                </p>
              )}
            </div>
          )}

          {/* NOTE: Removed validation blockers - intent-driven approach
              The AI intelligently determines tools at execution time
              User describes WHAT they want, Nexus figures out HOW */}

          {/* @NEXUS-FIX-055: Orchestration discovery loading indicator - DO NOT REMOVE */}
          {isLoadingOrchestration && !hasError && phase !== 'complete' && (
            <div className="px-4 pb-4">
              <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-500/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-purple-300">
                    Discovering required fields for new integration...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* @NEXUS-FIX-033: Pre-flight sequential questions - DO NOT REMOVE
              Shows questions one-by-one BEFORE execution to collect all params upfront */}
          {showPreFlight && !isLoadingOrchestration && preFlightResult && preFlightResult.questions.length > 0 && currentPreFlightQuestion && !hasError && phase !== 'complete' && (
            <div className="px-4 pb-4">
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20 p-4">
                {/* Progress indicator */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-medium text-cyan-300">
                      Quick Setup
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {currentQuestionIndex + 1} of {preFlightResult.questions.length}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-slate-700 rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex) / preFlightResult.questions.length) * 100}%` }}
                  />
                </div>

                {/* Current question */}
                <div className="space-y-3">
                  {/* Question context */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="px-2 py-0.5 bg-slate-700/50 rounded text-slate-300">
                      {currentPreFlightQuestion.nodeName}
                    </span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{currentPreFlightQuestion.displayName}</span>
                  </div>

                  {/* The question */}
                  <p className="text-sm text-slate-200 font-medium">
                    💡 {currentPreFlightQuestion.prompt}
                  </p>

                  {/* Quick action buttons */}
                  {currentPreFlightQuestion.quickActions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentPreFlightQuestion.quickActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePreFlightAnswer(
                            currentPreFlightQuestion.id,
                            currentPreFlightQuestion.paramName,
                            action.value
                          )}
                          className="px-3 py-1.5 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500/50"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input field */}
                  <div className="flex gap-2">
                    <input
                      type={currentPreFlightQuestion.inputType === 'email' ? 'email' : currentPreFlightQuestion.inputType === 'phone' ? 'tel' : 'text'}
                      value={preFlightInputValue}
                      onChange={(e) => {
                        setPreFlightInputValue(e.target.value)
                        setPreFlightError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && preFlightInputValue.trim()) {
                          handlePreFlightAnswer(
                            currentPreFlightQuestion.id,
                            currentPreFlightQuestion.paramName,
                            preFlightInputValue.trim()
                          )
                        }
                      }}
                      placeholder={currentPreFlightQuestion.placeholder}
                      className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25"
                    />
                    <button
                      onClick={() => {
                        if (preFlightInputValue.trim()) {
                          handlePreFlightAnswer(
                            currentPreFlightQuestion.id,
                            currentPreFlightQuestion.paramName,
                            preFlightInputValue.trim()
                          )
                        }
                      }}
                      disabled={!preFlightInputValue.trim()}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Next
                    </button>
                  </div>

                  {/* Error message */}
                  {preFlightError && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {preFlightError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pre-flight complete indicator */}
          {isPreFlightComplete && preFlightResult && preFlightResult.questions.length > 0 && !hasError && phase !== 'complete' && (
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>All information collected - ready to execute!</span>
              </div>
            </div>
          )}

          {/* @NEXUS-FIX-061: Collected Information Section - DO NOT REMOVE
              Shows user's answers inline in the workflow card instead of as chat messages.
              This keeps the workflow card at the end of the chat thread. */}
          {Object.keys(collectedParams).filter(k => !k.startsWith('_')).length > 0 && !hasError && phase !== 'complete' && (
            <div className="px-4 pb-3">
              <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-300">Collected Information</span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(collectedParams)
                    .filter(([key]) => !key.startsWith('_')) // Filter out internal keys like _lastUpdated, _retryRequested
                    .map(([key, value]) => {
                      // Move 6.16b: Extract param name from nodeId.paramName format for display
                      const displayKey = key.includes('.') ? key.split('.').pop() || key : key
                      return (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 capitalize">{displayKey.replace(/_/g, ' ')}:</span>
                          <span className="text-slate-200 font-medium truncate max-w-[180px]" title={value}>
                            {value}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Execute button - ALWAYS show when workflow is not complete/errored
              INTENT-DRIVEN: User can always execute, AI figures out details at runtime
              @NEXUS-FIX-033: Now blocked until pre-flight is complete */}
          {phase !== 'complete' && phase !== 'error' && (
            <div className="px-4 pb-4">
              <button
                onClick={executeWorkflow}
                disabled={isExecuting || isChecking || !isPreFlightComplete}
                className={cn(
                  'w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
                  isExecuting || isChecking
                    ? 'bg-amber-500/20 text-amber-400 cursor-not-allowed'
                    : executionMode === 'beta'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.98]'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98]'
                )}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {executionMode === 'beta' ? 'Running beta test...' : 'Executing workflow...'}
                  </>
                ) : isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking connections...
                  </>
                ) : (
                  <>
                    {executionMode === 'beta' ? <FlaskConical className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {executionMode === 'beta' ? 'Run Beta Test' : 'Execute Now'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Edit Workflow Button - Only show in ready phase when edit callbacks provided */}
          {phase === 'ready' && onNodeRemove && (
            <div className="px-4 pb-2 flex justify-end">
              <button
                onClick={() => setShowEditPanel(true)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 hover:bg-slate-700/50 rounded transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Edit Workflow
              </button>
            </div>
          )}

          {/* Node Edit Panel */}
          {showEditPanel && (
            <NodeEditPanel
              nodes={nodes}
              workflowName={workflow.name}
              onRemoveNode={(id) => {
                onNodeRemove?.(id)
                setNodes(prev => prev.filter(n => n.id !== id))
              }}
              onAddNode={(integration, actionType) => {
                if (onNodeAdd) {
                  onNodeAdd(integration, actionType)
                  // Also update local state for immediate feedback
                  const newNode = {
                    id: `step_${Date.now()}`,
                    name: `${integration.charAt(0).toUpperCase() + integration.slice(1)} Action`,
                    type: 'action' as const,
                    integration: integration.toLowerCase(),
                    status: 'idle' as const,
                  }
                  setNodes(prev => [...prev, newNode])
                }
              }}
              onClose={() => setShowEditPanel(false)}
              disabled={phase !== 'ready'}
            />
          )}

          {/* NOTE: Removed low confidence blocker - intent-driven system handles everything
              User can always execute, AI determines optimal approach at runtime */}

          {/* Error details and retry button */}
          {hasError && (
            <div className="px-4 pb-4 space-y-3">
              {/* Error explanation with contextual guidance */}
              {(() => {
                const failedNode = nodes.find(n => n.status === 'error')
                const errorMsg = failedNode?.error || 'Unknown error'
                const errorLower = errorMsg.toLowerCase()

                // @NEXUS-FIX-031: Extract actual param name from error for correct collection key - DO NOT REMOVE
                // Error format: "Missing Information: Step Name [param:to]"
                // This ensures each param is stored under its own key, not the integration name
                const paramMatch = errorMsg.match(/\[param:(\w+)\]/)
                const missingParamName = paramMatch ? paramMatch[1] : null
                // Move 6.16b: Use nodeId.paramName format for task-specific param storage
                // This prevents param collisions across multiple nodes with same param name
                const collectionKey = failedNode?.id && missingParamName
                  ? `${failedNode.id}.${missingParamName}`
                  : missingParamName || failedNode?.integration || 'value'

                // @NEXUS-UX-001: Actionable error buttons - DO NOT REMOVE (VIP Hospitality)
                // Generate helpful guidance based on error type with CLICKABLE actions
                interface ErrorGuidance {
                  title: string
                  guidance: string
                  action?: string
                  actionLabel?: string
                  // UX Hospitality: Actual clickable buttons instead of just text
                  buttons?: Array<{
                    label: string
                    value: string
                    icon?: string
                    primary?: boolean
                  }>
                  inputPrompt?: string // For inline input when needed
                }

                const getErrorGuidance = (): ErrorGuidance => {
                  // @NEXUS-UX-001: Missing parameters with buttons - DO NOT REMOVE
                  if (errorLower.includes('missing') && errorLower.includes('parameter')) {
                    const params = errorMsg.match(/: ([^.]+)/)?.[1] || 'required information'
                    return {
                      title: 'Quick Question!',
                      guidance: `I just need a little more info about: ${params}`,
                      buttons: [
                        { label: '💬 Let Me Explain', value: `I\'ll provide the ${params}`, primary: true },
                        { label: '🔍 Help Me Find It', value: `help me find the ${params}`, primary: false },
                      ],
                      inputPrompt: `Enter ${params}...`,
                    }
                  }

                  // @NEXUS-UX-001: Google Sheets with clickable buttons - DO NOT REMOVE
                  if (errorLower.includes('spreadsheet') || errorLower.includes('googlesheets')) {
                    return {
                      title: 'Google Sheets Setup Needed',
                      guidance: 'Which Google Sheet should I use?',
                      buttons: [
                        { label: '📝 Create New Sheet', value: 'create a new Google Sheet for me', primary: true },
                        { label: '📋 Use Existing Sheet', value: 'I want to use an existing sheet', primary: false },
                      ],
                      inputPrompt: 'Or paste a Google Sheet URL here...',
                    }
                  }

                  // @NEXUS-UX-001: Slack channel with clickable buttons - DO NOT REMOVE
                  if (errorLower.includes('channel') && (errorLower.includes('slack') || failedNode?.integration?.toLowerCase().includes('slack'))) {
                    return {
                      title: 'Slack Channel Needed',
                      guidance: 'Where should I send this message?',
                      buttons: [
                        { label: '#general', value: '#general', primary: false },
                        { label: '#team', value: '#team', primary: false },
                        { label: '#alerts', value: '#alerts', primary: false },
                        { label: '#random', value: '#random', primary: false },
                      ],
                      inputPrompt: 'Or type a channel name...',
                    }
                  }

                  // @NEXUS-UX-001: WhatsApp with clickable buttons - DO NOT REMOVE
                  // @NEXUS-FIX-032: Dynamic prompt based on actual missing param - DO NOT REMOVE
                  // Problem: Always showed "Who should receive?" even when asking for message content
                  // Solution: Check missingParamName to show appropriate prompt for 'to' vs 'message'
                  if (errorLower.includes('whatsapp') || errorLower.includes('phone') || (failedNode?.integration?.toLowerCase().includes('whatsapp'))) {
                    // Determine if we're asking for phone number (to) or message content
                    const isAskingForMessage = missingParamName === 'message' || missingParamName === 'body' || missingParamName === 'text'
                    // Phone check handled via !isAskingForMessage in else branch

                    if (isAskingForMessage) {
                      return {
                        title: 'Message Content Needed',
                        guidance: 'What message should I send?',
                        buttons: [
                          { label: '📝 Type Message', value: 'I\'ll type the message', primary: true },
                          { label: '📋 Use Template', value: 'Show me message templates', primary: false },
                        ],
                        inputPrompt: 'Type your message here...',
                      }
                    }

                    // Default: asking for phone number
                    return {
                      title: 'WhatsApp Recipient Needed',
                      guidance: 'Who should receive this message?',
                      buttons: [
                        { label: '📱 Enter Phone Number', value: 'I\'ll provide a phone number', primary: true },
                        { label: '👥 Use Contact List', value: 'Show me my contacts', primary: false },
                      ],
                      inputPrompt: 'Enter phone with country code (e.g., +965 xxxx xxxx)...',
                    }
                  }

                  // @NEXUS-UX-001: Email recipient with clickable buttons - DO NOT REMOVE
                  if (errorLower.includes('email') || errorLower.includes('recipient') || errorLower.includes('gmail') || errorLower.includes('outlook')) {
                    return {
                      title: 'Email Recipient Needed',
                      guidance: 'Who should receive this email?',
                      buttons: [
                        { label: '✉️ Enter Email', value: 'I\'ll provide an email address', primary: true },
                        { label: '👤 Send to Myself', value: 'Send to my email address', primary: false },
                      ],
                      inputPrompt: 'Enter email address...',
                    }
                  }

                  // @NEXUS-UX-001: Authentication errors with reconnect button - DO NOT REMOVE
                  if (errorLower.includes('auth') || errorLower.includes('401') || errorLower.includes('403') || errorLower.includes('token') || errorLower.includes('credential')) {
                    return {
                      title: 'Connection Expired',
                      guidance: 'Your account needs to be reconnected.',
                      buttons: [
                        { label: '🔄 Reconnect Now', value: 'reconnect my account', primary: true },
                        { label: '❓ Get Help', value: 'help me fix this connection issue', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-UX-001: Rate limiting with timed retry - DO NOT REMOVE
                  if (errorLower.includes('rate') || errorLower.includes('limit') || errorLower.includes('429') || errorLower.includes('too many')) {
                    return {
                      title: 'Taking a Quick Breather',
                      guidance: 'The service is busy. This usually resolves in a moment.',
                      buttons: [
                        { label: '⏱️ Retry in 30 Seconds', value: 'retry after waiting', primary: true },
                        { label: '📅 Schedule for Later', value: 'schedule this workflow for later', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-UX-001: Not found with helpful suggestions - DO NOT REMOVE
                  if (errorLower.includes('not found') || errorLower.includes('404') || errorLower.includes('does not exist')) {
                    return {
                      title: 'Hmm, Can\'t Find That',
                      guidance: 'The item I looked for doesn\'t exist yet.',
                      buttons: [
                        { label: '➕ Create It', value: 'create this resource for me', primary: true },
                        { label: '🔍 Search Again', value: 'search for a different resource', primary: false },
                        { label: '📝 Enter Manually', value: 'let me provide the correct name', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-UX-001: Network issues with retry - DO NOT REMOVE
                  if (errorLower.includes('network') || errorLower.includes('timeout') || errorLower.includes('connection') || errorLower.includes('econnrefused')) {
                    return {
                      title: 'Connection Hiccup',
                      guidance: 'There was a network blip. Usually just temporary!',
                      buttons: [
                        { label: '🔄 Try Again', value: 'retry now', primary: true },
                        { label: '🔌 Check Connection', value: 'check my internet connection', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-UX-001: Permission issues with guidance - DO NOT REMOVE
                  if (errorLower.includes('permission') || errorLower.includes('access denied') || errorLower.includes('forbidden')) {
                    return {
                      title: 'Permission Needed',
                      guidance: 'You need additional access to do this.',
                      buttons: [
                        { label: '🔐 Grant Permission', value: 'grant permission for this action', primary: true },
                        { label: '🔄 Try Different Account', value: 'use a different account', primary: false },
                        { label: '❓ Why?', value: 'explain what permissions are needed', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-UX-001: Tool not supported - DO NOT REMOVE
                  if (errorLower.includes('no tool mapping') || errorLower.includes('not yet supported')) {
                    return {
                      title: 'Coming Soon!',
                      guidance: 'This integration is still being set up.',
                      buttons: [
                        { label: '🔔 Notify When Ready', value: 'notify me when this is available', primary: true },
                        { label: '🔄 Try Alternative', value: 'suggest an alternative approach', primary: false },
                        { label: '💬 Contact Support', value: 'contact support about this', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-UX-001: Server errors with friendly message - DO NOT REMOVE
                  if (errorLower.includes('500') || errorLower.includes('server error') || errorLower.includes('internal')) {
                    return {
                      title: 'Service Taking a Nap',
                      guidance: 'The external service had a hiccup. Usually fixes itself quickly!',
                      buttons: [
                        { label: '🔄 Retry Now', value: 'retry the workflow', primary: true },
                        { label: '📋 Save & Retry Later', value: 'save this workflow and try again later', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-FIX-117: Additional Composio-specific error patterns - DO NOT REMOVE
                  // Problem: Many Composio errors fell through to generic "Oops!" message
                  // Solution: Catch entity errors, SDK errors, connection errors specifically

                  // Composio entity/connection errors
                  if (errorLower.includes('entity') || errorLower.includes('no active connection') || errorLower.includes('connection not found') || errorLower.includes('no connected account')) {
                    return {
                      title: 'Account Not Connected',
                      guidance: 'This service needs to be connected before it can run.',
                      buttons: [
                        { label: '🔗 Connect Now', value: 'connect this service', primary: true },
                        { label: '🔄 Try Again', value: 'retry the workflow', primary: false },
                      ],
                    }
                  }

                  // Invalid/missing parameters from Composio
                  if (errorLower.includes('invalid') || errorLower.includes('required field') || errorLower.includes('missing required') || errorLower.includes('validation failed') || errorLower.includes('missing information')) {
                    return {
                      title: 'One More Thing Needed',
                      guidance: 'I need a bit more information to complete this step.',
                      buttons: [
                        { label: '💬 Provide Details', value: 'I will provide the missing details', primary: true },
                        { label: '🔍 Help Me', value: 'help me figure out what is needed', primary: false },
                      ],
                      inputPrompt: 'Enter the required information...',
                    }
                  }

                  // Quota/billing errors
                  if (errorLower.includes('quota') || errorLower.includes('billing') || errorLower.includes('plan') || errorLower.includes('upgrade') || errorLower.includes('subscription')) {
                    return {
                      title: 'Service Limit Reached',
                      guidance: 'This service has a usage limit that was reached.',
                      buttons: [
                        { label: '📊 Check Usage', value: 'check my service usage', primary: true },
                        { label: '🔄 Try Again Later', value: 'retry later', primary: false },
                      ],
                    }
                  }

                  // Composio SDK errors
                  if (errorLower.includes('composio') || errorLower.includes('sdk') || errorLower.includes('api key')) {
                    return {
                      title: 'Service Configuration',
                      guidance: 'The integration service needs to be configured.',
                      buttons: [
                        { label: '🔧 Configure', value: 'configure the integration', primary: true },
                        { label: '🔄 Try Again', value: 'retry the workflow', primary: false },
                      ],
                    }
                  }

                  // @NEXUS-FIX-117: Improved default - never say "Oops!" - DO NOT REMOVE
                  return {
                    title: 'Almost There!',
                    guidance: 'This step needs a small adjustment. Let me help you fix it.',
                    buttons: [
                      { label: '🔄 Try Again', value: 'retry the workflow', primary: true },
                      { label: '💬 Help Me Fix It', value: 'help me troubleshoot this step', primary: false },
                      { label: '⏭️ Skip This Step', value: 'skip this step and continue', primary: false },
                    ],
                  }
                  // @NEXUS-FIX-117-END
                }

                // @NEXUS-UX-001: Extract buttons for actionable error recovery - DO NOT REMOVE
                const { title, guidance, action, buttons, inputPrompt } = getErrorGuidance()

                // @NEXUS-FIX-028: Use friendly cyan/blue colors for "Missing Information" prompts - DO NOT REMOVE
                // Problem: Red colors made input prompts look like critical errors
                // Solution: Detect "Missing Information" and use cyan (needs input) instead of red (actual error)
                const isMissingInfo = errorMsg.toLowerCase().includes('missing information') ||
                                       errorMsg.toLowerCase().includes('need more details') ||
                                       errorMsg.toLowerCase().includes('please tell me')


                // Friendly cyan/blue for info prompts (asking for input), red for actual errors
                // @NEXUS-FIX-028: Using inline styles for reliable color application
                const colorScheme = isMissingInfo
                  ? {
                      bgStyle: { backgroundColor: 'rgba(6, 182, 212, 0.15)' }, // cyan-500 at 15%
                      borderStyle: { borderColor: 'rgba(6, 182, 212, 0.3)' }, // cyan-500 at 30%
                      icon: 'text-cyan-400',
                      title: 'text-cyan-300',
                      text: 'text-cyan-400/80'
                    }
                  : {
                      bgStyle: { backgroundColor: 'rgba(239, 68, 68, 0.15)' }, // red-500 at 15%
                      borderStyle: { borderColor: 'rgba(239, 68, 68, 0.3)' }, // red-500 at 30%
                      icon: 'text-red-400',
                      title: 'text-red-300',
                      text: 'text-red-400/80'
                    }

                return (
                  <div
                    className="p-3 rounded-lg border space-y-2"
                    style={{ ...colorScheme.bgStyle, ...colorScheme.borderStyle }}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className={`w-5 h-5 ${colorScheme.icon} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${colorScheme.title}`}>
                          {title}: {failedNode?.name || 'Unknown step'}
                        </p>
                        {/* @NEXUS-FIX-028: Show full error message without truncation - DO NOT REMOVE */}
                        <p className={`text-xs ${colorScheme.text} mt-1 break-words`}>
                          {errorMsg}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t space-y-1.5" style={colorScheme.borderStyle}>
                      <p className="text-xs text-slate-300">
                        💡 {guidance}
                      </p>

                      {/* @NEXUS-UX-001: Render clickable action buttons - VIP Hospitality */}
                      {buttons && buttons.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {buttons.map((btn, idx) => (
                            <button
                              key={idx}
                              onClick={() => onMissingInfoSelect?.(collectionKey, btn.value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                btn.primary
                                  ? 'bg-cyan-500/30 text-cyan-300 hover:bg-cyan-500/40 border border-cyan-500/40'
                                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/40'
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* @NEXUS-UX-001: Optional input field for custom values */}
                      {/* @NEXUS-FIX-030: Track pending input for Retry button - DO NOT REMOVE */}
                      {inputPrompt && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder={inputPrompt}
                            className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-800/50 border border-slate-600/40 text-slate-300 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
                            onChange={(e) => {
                              // @NEXUS-FIX-030: Track value so Retry button can submit it
                              // @NEXUS-FIX-031: Use actual param name as key, not integration name
                              const value = e.target.value.trim()
                              if (value) {
                                pendingErrorInputRef.current = {
                                  field: collectionKey,
                                  value
                                }
                              } else {
                                pendingErrorInputRef.current = null
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const value = (e.target as HTMLInputElement).value
                                if (value.trim()) {
                                  // @NEXUS-FIX-031: Use actual param name as key
                                  onMissingInfoSelect?.(collectionKey, value.trim())
                                  pendingErrorInputRef.current = null // Clear after submit
                                }
                              }
                            }}
                          />
                        </div>
                      )}

                      {/* Fallback text action if no buttons */}
                      {action && !buttons && (
                        <p className="text-xs text-cyan-400/80 font-medium">
                          👉 {action}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* @NEXUS-FIX-030: Submit pending input before retry - DO NOT REMOVE */}
              <button
                onClick={() => {
                  // Submit any pending input value before resetting
                  if (pendingErrorInputRef.current) {
                    const { field, value } = pendingErrorInputRef.current
                    console.log(`[WorkflowPreviewCard] Submitting pending input: ${field}=${value}`)
                    onMissingInfoSelect?.(field, value)
                    pendingErrorInputRef.current = null
                    // Don't reset immediately - let the auto-retry mechanism handle it
                    // The useEffect watching collectedParams will trigger the retry
                  } else {
                    // No pending input, just reset
                    resetWorkflow()
                  }
                }}
                className="w-full py-2.5 rounded-lg font-medium text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Execution
              </button>
            </div>
          )}

          {/* @NEXUS-UX-006: Success message with celebration and next steps - DO NOT REMOVE */}
          {isComplete && (
            <div className="px-4 pb-4 space-y-3">
              {executionMode === 'beta' ? (
                <>
                  {/* @NEXUS-UX-006: Beta success celebration - DO NOT REMOVE */}
                  {/* @NEXUS-FIX-047: Show warning state when verification failed - DO NOT REMOVE */}
                  <div className={cn(
                    "p-4 rounded-lg space-y-3",
                    allVerified
                      ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30"
                      : "bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30"
                  )}>
                    <div className="text-center pb-2">
                      <span className="text-3xl">{allVerified ? '🎉' : '⚠️'}</span>
                      <h3 className={cn(
                        "text-lg font-medium mt-2",
                        allVerified ? "text-amber-300" : "text-yellow-300"
                      )}>
                        {allVerified ? 'Beta Test Passed!' : 'Test Completed with Warnings'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {allVerified
                          ? 'Everything worked perfectly with your account'
                          : `${unverifiedCount} step${unverifiedCount > 1 ? 's' : ''} completed but couldn't be verified`
                        }
                      </p>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-300 bg-slate-800/30 rounded-lg p-3">
                      {nodes.map((node, i) => {
                        const nodeResult = node.result as Record<string, unknown> | undefined
                        const isNodeVerified = nodeResult?._verified !== false
                        const warningMsg = nodeResult?._warning as string | undefined
                        return (
                          <div key={node.id} className="flex items-center gap-2">
                            <span className={isNodeVerified ? "text-emerald-400" : "text-yellow-400"}>
                              {isNodeVerified ? '✓' : '⚠️'}
                            </span>
                            <span>{i + 1}. {node.name}</span>
                            <span className={cn(
                              "truncate max-w-[100px]",
                              isNodeVerified ? "text-slate-500" : "text-yellow-500/70"
                            )}>
                              {!isNodeVerified && warningMsg
                                ? `• ${warningMsg}`
                                : typeof node.result === 'object'
                                  ? '• Success'
                                  : node.result !== undefined && node.result !== null
                                    ? `• ${String(node.result as string | number | boolean)}`
                                    : ''
                              }
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    {/* @NEXUS-FIX-047: Guidance for unverified results - DO NOT REMOVE */}
                    {!allVerified && (
                      <div className="text-xs text-yellow-400/80 bg-yellow-500/10 rounded-lg p-3 flex items-start gap-2">
                        <span className="shrink-0">💡</span>
                        <span>
                          Some steps completed but we couldn't confirm delivery.
                          Please check your connected apps to verify the actions took place.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* @NEXUS-UX-006: Clear next step actions - DO NOT REMOVE */}
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 text-center">What's next?</p>
                    <button
                      onClick={() => {
                        setExecutionMode('production')
                        resetWorkflow()
                      }}
                      className="w-full py-3 rounded-lg font-medium text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      🚀 Deploy to Production
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={resetWorkflow}
                        className="flex-1 py-2 rounded-lg text-xs bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all"
                      >
                        🔄 Run Again
                      </button>
                      <button
                        onClick={() => navigate('/workflows')}
                        className="flex-1 py-2 rounded-lg text-xs bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all"
                      >
                        📋 View All Workflows
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* @NEXUS-UX-006: Production success celebration - DO NOT REMOVE */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 space-y-3">
                    <div className="text-center pb-2">
                      <span className="text-3xl">🚀</span>
                      <h3 className="text-lg font-medium text-emerald-300 mt-2">Workflow Complete!</h3>
                      <p className="text-xs text-slate-400 mt-1">Your automation ran successfully</p>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                      <span>✓ {nodes.length} steps completed</span>
                      <span>•</span>
                      <span>⚡ Production mode</span>
                    </div>
                  </div>

                  {/* @NEXUS-UX-006: Next actions for production - DO NOT REMOVE */}
                  <div className="flex gap-2">
                    <button
                      onClick={resetWorkflow}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Run Again
                    </button>
                    <button
                      onClick={() => navigate('/workflows')}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all"
                    >
                      📋 My Workflows
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center">
                    💡 Want this to run automatically? Ask me to set up a schedule!
                  </p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default WorkflowPreviewCard

// ============================================================================
// @NEXUS-FIX-042/043: Exported helper functions for new architecture integration
// These are prepared for Phase 5 when executeWorkflow is refactored to use new services
// Export allows:
// 1. Testing the new services independently
// 2. Gradual migration without breaking existing code
// 3. Validation that new services produce correct results
// ============================================================================
export const NewArchitectureHelpers = {
  resolveToolSlugWithRegistry: _resolveToolSlugWithRegistry,
  resolveParamsWithPipeline: _resolveParamsWithPipeline,
  getEnhancedMissingParams: _getEnhancedMissingParams,
  inferActionFromNodeName,
}

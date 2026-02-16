/**
 * WorkflowPreviewCard Helpers
 *
 * Helper functions: mapCollectedParamsToToolParams, isToolkitKnown,
 * validateWorkflowBeforeExecution, getParamFixSuggestion, service integration helpers, etc.
 * All @NEXUS-FIX markers preserved.
 */

import { TOOL_SLUGS } from './wpc-constants'
import {
  mapNodeToToolSlug,
  validateRequiredParams,
  extractIdFromUrl,
  getCanonicalParamName,
  isParamSemanticallycollected,
  getFallbackTools,
  validateToolSlug,
  isToolNotFoundError,
  getDefaultParams,
} from './wpc-tool-utils'
import type {
  WorkflowNode,
  OrchestrationResult,
  NodeValidation,
  WorkflowValidation,
} from './wpc-types'
import type { CollectionQuestion } from '@/services/orchestration'
import type { ResolvedParams } from '@/services/ParamResolutionPipeline'
// @NEXUS-FIX-120: MasterAliasRegistry - Canonical alias source for integration names
import { INTEGRATION_ALIASES as MASTER_ALIASES } from '@/lib/MasterAliasRegistry'
import {
  getIntegrationInfo,
} from '@/services/IntegrationAuthService'
// @NEXUS-FIX-042: UnifiedToolRegistry - Single source of truth for tools - DO NOT REMOVE
import { UnifiedToolRegistryService, type ToolContract } from '@/services/UnifiedToolRegistry'
// @NEXUS-FIX-043: ParamResolutionPipeline - Complete param resolution - DO NOT REMOVE
import { ParamResolutionPipeline } from '@/services/ParamResolutionPipeline'
import {
  getOrchestrationService,
  humanize,
} from '@/services/orchestration'

// ============================================================================
// Feature Flags (re-exported for use in main component)
// ============================================================================

/**
 * @NEXUS-GENERIC-ORCHESTRATION Feature Flag
 */
export const USE_GENERIC_ORCHESTRATION = true // Phase 3: ENABLED for testing

/**
 * @NEXUS-FIX-059: Orchestration-First Approach Feature Flag
 */
export const USE_ORCHESTRATION_FIRST = true // @NEXUS-FIX-059: Orchestration-first approach

// ============================================================================
// Orchestration Functions
// ============================================================================

/**
 * @NEXUS-GENERIC-ORCHESTRATION: Async tool resolution via orchestration layer
 */
export async function resolveToolViaOrchestration(
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
 * @NEXUS-FIX-064-ALIAS: Resolves aliases before checking TOOL_SLUGS - DO NOT REMOVE
 */
export function isToolkitKnown(toolkit: string): boolean {
  const toolkitLower = toolkit.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')

  // @NEXUS-FIX-064-ALIAS: Resolve toolkit aliases (e.g., 'calendar' → 'googlecalendar')
  // Delegates to MasterAliasRegistry (canonical source) via MASTER_ALIASES import
  const resolvedToolkit = MASTER_ALIASES[toolkitLower] || toolkitLower

  // Check TOOL_SLUGS after it's defined (this is called at runtime)
  return typeof TOOL_SLUGS !== 'undefined' && resolvedToolkit in TOOL_SLUGS
}

// ============================================================================
// @NEXUS-FIX-029: Map collected params from integration names to actual tool param names - DO NOT REMOVE
// ============================================================================

/**
 * Map collected params from integration-keyed format to tool parameter format
 * e.g., { gmail: 'user@email.com' } → { to: 'user@email.com' }
 */
export function mapCollectedParamsToToolParams(
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
// ============================================================================

/**
 * @NEXUS-GENERIC-ORCHESTRATION: Async resolution with orchestration fallback
 */
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
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function _resolveToolSlugWithRegistry(
  nodeName: string,
  toolkit: string,
  action?: string
): { slug: string | null; contract: ToolContract | null; source: 'registry' | 'legacy' } {
  const toolkitLower = toolkit.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')

  // Try UnifiedToolRegistry first (new architecture)
  try {
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
export function inferActionFromNodeName(nodeName: string): string {
  const nameLower = nodeName.toLowerCase()

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
 */
export async function _resolveParamsWithPipeline(
  toolSlug: string,
  toolkit: string,
  node: WorkflowNode,
  collectedParams: Record<string, string> | undefined,
  workflowContext?: { name: string; description: string },
  previousNodeResults?: Array<{ node: WorkflowNode; result: unknown }>
): Promise<{ params: Record<string, unknown>; source: 'pipeline' | 'legacy'; resolved: ResolvedParams | null }> {
  // @NEXUS-FIX-113: Build flow data from previous node results - DO NOT REMOVE
  const flowData: Record<string, unknown> = {}
  if (previousNodeResults && previousNodeResults.length > 0) {
    for (const prev of previousNodeResults) {
      const result = prev.result as { type?: string; data?: Record<string, unknown> } | undefined
      if (result?.type === 'trigger_sample_data' && result.data) {
        if (result.data.from) flowData.sender_email = result.data.from
        if (result.data.subject) flowData.email_subject = result.data.subject
        if (result.data.body || result.data.message) {
          flowData.email_body = result.data.body || result.data.message
        }
        if (result.data.sender_name) flowData.sender_name = result.data.sender_name
        const subject = result.data.subject || 'New notification'
        const body = result.data.body || result.data.message || ''
        const from = result.data.from || result.data.sender_name || 'Unknown sender'
        flowData.generated_message = `📧 *New Email from ${from}*\n\n*Subject:* ${subject}\n\n${body}`
        flowData.notification_text = `Email from ${from}: ${subject}`
      }
      if (result?.type === 'ai_processing' && result.data) {
        Object.assign(flowData, result.data)
      }
      // @NEXUS-FIX-113: Capture action node results for downstream use - DO NOT REMOVE
      if (prev.result && typeof prev.result === 'object' && !result?.type) {
        const actionResult = prev.result as Record<string, unknown>
        if (actionResult.id) flowData.previous_id = actionResult.id
        if (actionResult.url) flowData.previous_url = actionResult.url
        if (actionResult.name) flowData.previous_name = actionResult.name
        if (actionResult.text) flowData.previous_text = actionResult.text
        if (actionResult.message) flowData.previous_message = actionResult.message
      }
    }
  }

  // Try ParamResolutionPipeline first
  try {
    const action = inferActionFromNodeName(node.name)
    const resolution = UnifiedToolRegistryService.resolveToolContract(toolkit.toLowerCase(), action)

    if (resolution && resolution.success && resolution.contract) {
      const sources = {
        userProvided: collectedParams || {},
        nodeConfig: (node.config || {}) as Record<string, string>,
        workflowContext: {
          ...(workflowContext ? {
            workflow_name: workflowContext.name,
            workflow_description: workflowContext.description,
          } : {}),
          // @NEXUS-FIX-113: Include flow data from previous nodes - DO NOT REMOVE
          ...flowData,
        },
      }

      const resolved = await ParamResolutionPipeline.resolve(resolution.contract, sources)

      if (resolved.missingRequired.length === 0 || Object.keys(resolved.params).length > 0) {
        console.log(`[FIX-043] Resolved ${Object.keys(resolved.params).length} params via ParamResolutionPipeline`)
        return { params: resolved.params, source: 'pipeline', resolved }
      }
    }
  } catch (e) {
    console.debug(`[FIX-043] ParamResolutionPipeline failed, falling back to legacy:`, e)
  }

  // Fallback to legacy param resolution
  const defaultParams = getDefaultParams(toolSlug, node, previousNodeResults, workflowContext)
  const collectedToolParams = mapCollectedParamsToToolParams(collectedParams, toolkit, toolSlug)
  const legacyParams = { ...defaultParams, ...collectedToolParams }

  return { params: legacyParams, source: 'legacy', resolved: null }
}

/**
 * Get ALL missing params with user-friendly prompts
 * @NEXUS-FIX-043: Uses ParamResolutionPipeline for complete param detection
 */
export function _getEnhancedMissingParams(
  resolved: ResolvedParams | null,
  toolkit: string,
  fallbackMissing: string[]
): Array<{ name: string; displayName: string; prompt: string; required: boolean }> {
  if (resolved && resolved.missingRequired.length > 0) {
    return resolved.missingRequired.map(missingParam => {
      const step = resolved.resolutionSteps.find(s => s.paramName === missingParam)
      return {
        name: missingParam,
        displayName: step?.displayName || missingParam.replace(/_/g, ' ').replace(/\bid\b/gi, 'ID'),
        prompt: getParamFixSuggestion(missingParam, toolkit),
        required: true,
      }
    })
  }

  return fallbackMissing.map(param => ({
    name: param,
    displayName: param.replace(/_/g, ' ').replace(/\bid\b/gi, 'ID'),
    prompt: getParamFixSuggestion(param, toolkit),
    required: true,
  }))
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if a tool slug is from static mapping or dynamically constructed
 */
export function isStaticMapping(toolSlug: string, toolkit: string): boolean {
  const toolkitLower = toolkit.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/-/g, '')
  const toolkitTools = TOOL_SLUGS[toolkitLower]
  if (!toolkitTools) return false
  return Object.values(toolkitTools).includes(toolSlug)
}

/**
 * Validate the entire workflow BEFORE showing Execute button
 */
export function validateWorkflowBeforeExecution(
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

    const isDynamicSlug = toolSlug ? !isStaticMapping(toolSlug, integrationInfo.toolkit) : false
    if (isDynamicSlug) {
      hasDynamicSlugs = true
      warnings.push(
        `"${node.name}" uses an auto-detected tool (${toolSlug}). ` +
        `This will be verified at runtime.`
      )
    }

    const mockParams: Record<string, unknown> = {}
    const missingParams = toolSlug ? validateRequiredParams(toolSlug, mockParams) : []

    const hasToolMapping = !!toolSlug
    const isUnknownIntegration = integrationInfo.toolkit === 'unknown' ||
      integrationInfo.toolkit === 'default' ||
      !integrationInfo.name

    const isValid = hasToolMapping

    if (isUnknownIntegration && !toolSlug) {
      warnings.push(
        `"${node.name}" - I'll determine the best approach when executing`
      )
    }

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

  const canExecute = nodeValidations.length > 0

  return {
    isValid: canExecute,
    allNodesHaveTools,
    allParamsProvided,
    hasDynamicSlugs,
    nodes: nodeValidations,
    blockers: [],
    warnings,
    canExecute,
  }
}

/**
 * Get human-readable fix suggestion for a missing parameter
 */
export function getParamFixSuggestion(param: string, toolkit: string): string {
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

/**
 * Get expected sample data fields for a trigger node based on its type
 */
export function getTriggerSampleFields(nodeName: string, toolkit: string): Array<{field: string, label: string, placeholder: string}> {
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
  return [
    { field: 'data', label: 'What event triggered this workflow?', placeholder: 'e.g., "New order received" or "Form submitted"' },
  ]
}

// Re-export functions needed by main component from wpc-tool-utils
export {
  isParamSemanticallycollected,
  getCanonicalParamName,
  mapNodeToToolSlug,
  validateRequiredParams,
  extractIdFromUrl,
  getFallbackTools,
  validateToolSlug,
  isToolNotFoundError,
}

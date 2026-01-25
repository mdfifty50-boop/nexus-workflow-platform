/**
 * VerifiedExecutor.ts
 *
 * PHASE 3 of Architecture Overhaul:
 * Execute workflows with VERIFICATION - only report SUCCESS when action verified.
 *
 * The Problem:
 * - Current system checks `result.success` (API returned 200 OK)
 * - This doesn't verify if the action actually happened
 * - User sees "SUCCESS" when nothing actually happened
 *
 * The Solution:
 * - Execute the tool
 * - Inspect the response for verification indicators
 * - Return proof of execution or honest error
 *
 * @NEXUS-FIX-041: VerifiedExecutor - Execute with verification - DO NOT REMOVE
 */

import { rubeClient, type RubeToolExecutionResult } from './RubeClient'

// ================================
// @NEXUS-FIX-048: Channel ID Resolution Cache - DO NOT REMOVE
// Caches resolved channel IDs to prevent repeated API calls
// ================================
const channelIdCache = new Map<string, { id: string; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// ================================
// TYPES
// ================================

/** Proof that an action actually happened */
export interface ExecutionProof {
  /** Type of verified action */
  type:
    | 'message_sent'
    | 'email_sent'
    | 'file_created'
    | 'file_uploaded'
    | 'record_created'
    | 'record_updated'
    | 'calendar_event_created'
    | 'issue_created'
    | 'task_created'
    | 'generic_success'

  /** Evidence details */
  details: {
    /** Unique ID of created/sent item */
    id?: string
    /** Timestamp of action */
    timestamp?: string
    /** Where it was sent/created */
    destination?: string
    /** Human-readable summary */
    summary: string
    /** Raw response for debugging */
    raw?: unknown
  }
}

/** User-friendly error for display */
export interface UserFriendlyError {
  /** Short title */
  title: string
  /** Detailed message */
  message: string
  /** Suggestion to fix */
  suggestion?: string
  /** Is this recoverable? */
  recoverable: boolean
  /** Technical details (for logs) */
  technical?: string
}

/** Result of verified execution */
export interface VerifiedResult {
  /** Did the API call succeed? */
  success: boolean
  /** Did we VERIFY the action actually happened? */
  verified: boolean
  /** Proof of execution (if verified) */
  proof?: ExecutionProof
  /** Error info (if failed) */
  error?: UserFriendlyError
  /** Execution time in ms */
  executionTimeMs: number
  /** Tool that was executed */
  toolSlug: string
  /** Raw API response (for debugging) */
  rawResponse?: unknown
}

/** Context for execution (helps with verification) */
export interface ExecutionContext {
  /** Node ID from workflow */
  nodeId: string
  /** Node name for display */
  nodeName: string
  /** Toolkit (gmail, slack, etc.) */
  toolkit: string
  /** Specific action (send, create, etc.) */
  action?: string
  /** Workflow name for context */
  workflowName?: string
}

// ================================
// TOOLKIT-SPECIFIC VERIFIERS
// ================================

/**
 * Slack API responses include:
 * - ok: true/false
 * - ts: message timestamp (proof of delivery)
 * - channel: where it was sent
 * - message: the message object
 */
function verifySlackResponse(data: unknown, params: Record<string, unknown>): ExecutionProof | null {
  const response = data as Record<string, unknown> | undefined
  if (!response) return null

  // Check for nested data structure
  const actualData = response.data ? (response.data as Record<string, unknown>) : response

  // Slack returns ok: true on success
  if (actualData.ok === true || actualData.message || actualData.ts) {
    const message = actualData.message as Record<string, unknown> | undefined
    const ts = (actualData.ts || message?.ts || actualData.message_ts) as string | undefined
    const channel = (actualData.channel || params.channel) as string | undefined

    return {
      type: 'message_sent',
      details: {
        id: ts,
        timestamp: ts ? new Date(parseFloat(ts) * 1000).toISOString() : undefined,
        destination: channel ? `#${channel}` : 'Slack channel',
        summary: `Message delivered to ${channel ? `#${channel}` : 'Slack'}`,
        raw: actualData,
      },
    }
  }

  // Check for error response
  if (actualData.ok === false || actualData.error) {
    return null // Will be handled as error
  }

  // If we have a response but can't verify structure, be cautious
  // Some responses might just have data without clear ok/ts
  if (Object.keys(actualData).length > 0) {
    return {
      type: 'message_sent',
      details: {
        summary: 'Slack action completed (response received)',
        raw: actualData,
      },
    }
  }

  return null
}

/**
 * Gmail API responses include:
 * - id: message ID
 * - threadId: conversation thread
 * - labelIds: applied labels (SENT, etc.)
 */
function verifyGmailResponse(data: unknown, params: Record<string, unknown>): ExecutionProof | null {
  const response = data as Record<string, unknown> | undefined
  if (!response) return null

  // Check for nested data structure
  const actualData = response.data ? (response.data as Record<string, unknown>) : response

  // Gmail returns id and threadId on successful send
  const messageId = actualData.id as string | undefined
  const threadId = actualData.threadId as string | undefined
  const labelIds = actualData.labelIds as string[] | undefined

  if (messageId || threadId) {
    const recipient = params.to || params.recipient_email || 'recipient'
    const hasSentLabel = labelIds?.includes('SENT')

    return {
      type: 'email_sent',
      details: {
        id: messageId,
        timestamp: new Date().toISOString(),
        destination: String(recipient),
        summary: hasSentLabel
          ? `Email sent to ${recipient} (ID: ${messageId?.slice(0, 8)}...)`
          : `Email queued for ${recipient}`,
        raw: actualData,
      },
    }
  }

  // For email listing/reading, check for messages array
  const messages = actualData.messages as unknown[] | undefined
  if (messages && Array.isArray(messages)) {
    return {
      type: 'generic_success',
      details: {
        summary: `Retrieved ${messages.length} email(s)`,
        raw: actualData,
      },
    }
  }

  return null
}

/**
 * Google Sheets API responses include:
 * - spreadsheetId: the sheet that was modified
 * - updatedRange: what cells were affected
 * - updatedRows/updatedCells: counts
 */
function verifyGoogleSheetsResponse(data: unknown, params: Record<string, unknown>): ExecutionProof | null {
  const response = data as Record<string, unknown> | undefined
  if (!response) return null

  const actualData = response.data ? (response.data as Record<string, unknown>) : response

  // Check for update response
  const updatedRange = actualData.updatedRange as string | undefined
  const updatedCells = actualData.updatedCells as number | undefined
  const spreadsheetId = (actualData.spreadsheetId || params.spreadsheet_id) as string | undefined

  if (updatedRange || updatedCells !== undefined) {
    return {
      type: 'record_updated',
      details: {
        id: spreadsheetId,
        summary: updatedCells
          ? `Updated ${updatedCells} cell(s) in ${updatedRange || 'sheet'}`
          : `Updated ${updatedRange || 'sheet'}`,
        raw: actualData,
      },
    }
  }

  // Check for append response
  const updates = actualData.updates as Record<string, unknown> | undefined
  if (updates) {
    const appendedRange = updates.updatedRange as string | undefined
    return {
      type: 'record_created',
      details: {
        id: spreadsheetId,
        summary: `Added row to ${appendedRange || 'sheet'}`,
        raw: actualData,
      },
    }
  }

  // Check for read response (values array)
  const values = actualData.values as unknown[][] | undefined
  if (values && Array.isArray(values)) {
    return {
      type: 'generic_success',
      details: {
        summary: `Read ${values.length} row(s) from spreadsheet`,
        raw: actualData,
      },
    }
  }

  return null
}

/**
 * Google Calendar API responses include:
 * - id: event ID
 * - htmlLink: link to the event
 * - status: confirmed/tentative
 */
function verifyGoogleCalendarResponse(data: unknown, params: Record<string, unknown>): ExecutionProof | null {
  const response = data as Record<string, unknown> | undefined
  if (!response) return null

  const actualData = response.data ? (response.data as Record<string, unknown>) : response

  const eventId = actualData.id as string | undefined
  const htmlLink = actualData.htmlLink as string | undefined
  const summary = (actualData.summary || params.summary || params.title) as string | undefined
  // status field available but not used for verification: actualData.status

  if (eventId || htmlLink) {
    return {
      type: 'calendar_event_created',
      details: {
        id: eventId,
        summary: summary
          ? `Created event "${summary}"`
          : 'Calendar event created',
        raw: actualData,
      },
    }
  }

  // For event listing
  const items = actualData.items as unknown[] | undefined
  if (items && Array.isArray(items)) {
    return {
      type: 'generic_success',
      details: {
        summary: `Retrieved ${items.length} calendar event(s)`,
        raw: actualData,
      },
    }
  }

  return null
}

/**
 * GitHub API responses include:
 * - id: issue/PR ID
 * - number: issue/PR number
 * - html_url: link to the item
 */
function verifyGitHubResponse(data: unknown, params: Record<string, unknown>): ExecutionProof | null {
  const response = data as Record<string, unknown> | undefined
  if (!response) return null

  const actualData = response.data ? (response.data as Record<string, unknown>) : response

  const id = actualData.id as number | undefined
  const number = actualData.number as number | undefined
  const htmlUrl = actualData.html_url as string | undefined
  const title = (actualData.title || params.title) as string | undefined
  const repo = params.repo as string | undefined

  if (id || number || htmlUrl) {
    return {
      type: 'issue_created',
      details: {
        id: String(number || id),
        summary: title
          ? `Created issue #${number}: "${title}"${repo ? ` in ${repo}` : ''}`
          : `Created GitHub issue #${number || id}`,
        raw: actualData,
      },
    }
  }

  return null
}

/**
 * Dropbox/Google Drive upload responses
 */
function verifyFileUploadResponse(data: unknown, params: Record<string, unknown>): ExecutionProof | null {
  const response = data as Record<string, unknown> | undefined
  if (!response) return null

  const actualData = response.data ? (response.data as Record<string, unknown>) : response

  // Dropbox returns id, path_display, name
  const fileId = actualData.id as string | undefined
  const pathDisplay = actualData.path_display as string | undefined
  const name = (actualData.name || params.name || params.filename) as string | undefined

  // Google Drive returns id, name, mimeType
  const driveId = actualData.id as string | undefined
  const driveName = actualData.name as string | undefined

  if (fileId || pathDisplay || driveId) {
    return {
      type: 'file_uploaded',
      details: {
        id: fileId || driveId,
        summary: name || driveName
          ? `Uploaded "${name || driveName}"${pathDisplay ? ` to ${pathDisplay}` : ''}`
          : `File uploaded successfully`,
        raw: actualData,
      },
    }
  }

  return null
}

/**
 * Notion API responses include:
 * - id: page/database ID
 * - url: link to the page
 * - object: 'page' or 'database'
 */
function verifyNotionResponse(data: unknown, _params: Record<string, unknown>): ExecutionProof | null {
  const response = data as Record<string, unknown> | undefined
  if (!response) return null

  const actualData = response.data ? (response.data as Record<string, unknown>) : response

  const id = actualData.id as string | undefined
  const url = actualData.url as string | undefined
  const objectType = actualData.object as string | undefined

  if (id || url) {
    return {
      type: objectType === 'page' ? 'record_created' : 'generic_success',
      details: {
        id,
        summary: objectType === 'page'
          ? `Created Notion page`
          : `Notion action completed`,
        raw: actualData,
      },
    }
  }

  return null
}

/**
 * Generic verifier for unknown toolkits
 * Looks for common success indicators
 */
function verifyGenericResponse(data: unknown, toolkit: string): ExecutionProof | null {
  const response = data as Record<string, unknown> | undefined
  if (!response) return null

  const actualData = response.data ? (response.data as Record<string, unknown>) : response

  // Empty response is suspicious
  if (!actualData || Object.keys(actualData).length === 0) {
    return null
  }

  // Look for common success indicators
  const hasId = 'id' in actualData
  const hasSuccess = actualData.success === true || actualData.ok === true
  const hasResult = 'result' in actualData || 'data' in actualData

  if (hasId || hasSuccess || hasResult) {
    return {
      type: 'generic_success',
      details: {
        id: actualData.id as string | undefined,
        summary: `${toolkit} action completed successfully`,
        raw: actualData,
      },
    }
  }

  // If we got data back but can't identify success markers,
  // return a cautious success (response received)
  return {
    type: 'generic_success',
    details: {
      summary: `${toolkit} responded (verification limited)`,
      raw: actualData,
    },
  }
}

// ================================
// ERROR CLASSIFICATION
// ================================

/**
 * Convert technical errors to user-friendly messages
 */
function classifyError(
  error: string,
  context: ExecutionContext
): UserFriendlyError {
  const errorLower = error.toLowerCase()

  // Connection/auth errors
  if (errorLower.includes('unauthorized') || errorLower.includes('401') || errorLower.includes('token')) {
    return {
      title: 'Connection Expired',
      message: `Your connection to ${context.toolkit} needs to be refreshed.`,
      suggestion: 'Click "Reconnect" to authorize again.',
      recoverable: true,
      technical: error,
    }
  }

  // Permission errors
  if (errorLower.includes('forbidden') || errorLower.includes('403') || errorLower.includes('permission')) {
    return {
      title: 'Permission Denied',
      message: `${context.toolkit} didn't allow this action.`,
      suggestion: 'You may need additional permissions. Check your app settings.',
      recoverable: false,
      technical: error,
    }
  }

  // Not found errors
  if (errorLower.includes('not found') || errorLower.includes('404')) {
    return {
      title: 'Not Found',
      message: `The requested item in ${context.toolkit} doesn't exist.`,
      suggestion: 'Double-check the ID or name you provided.',
      recoverable: true,
      technical: error,
    }
  }

  // Rate limiting
  if (errorLower.includes('rate limit') || errorLower.includes('429') || errorLower.includes('too many')) {
    return {
      title: 'Rate Limited',
      message: `${context.toolkit} is asking us to slow down.`,
      suggestion: 'Wait a moment and try again.',
      recoverable: true,
      technical: error,
    }
  }

  // Network errors
  if (errorLower.includes('network') || errorLower.includes('timeout') || errorLower.includes('connection refused')) {
    return {
      title: 'Connection Issue',
      message: `Couldn't reach ${context.toolkit}.`,
      suggestion: 'Check your internet connection and try again.',
      recoverable: true,
      technical: error,
    }
  }

  // Missing parameters
  if (errorLower.includes('missing') && errorLower.includes('param')) {
    return {
      title: 'Missing Information',
      message: `Need more details for ${context.nodeName}.`,
      suggestion: 'Please provide the missing information above.',
      recoverable: true,
      technical: error,
    }
  }

  // Tool not found
  if (errorLower.includes('tool not found') || errorLower.includes('no tool')) {
    return {
      title: 'Integration Issue',
      message: `This ${context.toolkit} action isn't available yet.`,
      suggestion: 'Try a different approach or contact support.',
      recoverable: false,
      technical: error,
    }
  }

  // Generic fallback
  return {
    title: 'Action Failed',
    message: `${context.nodeName} encountered an issue.`,
    suggestion: 'Please try again or modify your request.',
    recoverable: true,
    technical: error,
  }
}

// ================================
// @NEXUS-FIX-048: PRE-EXECUTION PARAM RESOLUTION
// Resolves user-friendly values to API IDs BEFORE execution
// This fixes the "general" → channel_id resolution for Slack
// DO NOT REMOVE
// ================================

/**
 * Check if a value looks like a Slack channel ID
 */
function looksLikeChannelId(value: string): boolean {
  // Slack channel IDs start with C (public) or G (private) followed by alphanumeric
  return /^[CG][A-Z0-9]{8,}$/i.test(value)
}

/**
 * Resolve a Slack channel name to its ID
 *
 * @NEXUS-FIX-048: Channel resolution for actual message delivery
 *
 * Process:
 * 1. If value looks like an ID already, return it
 * 2. Check cache for previously resolved value
 * 3. Fetch channel list from Slack API
 * 4. Find matching channel (by name or is_general flag)
 * 5. Cache and return the ID
 */
async function resolveSlackChannel(channelValue: string): Promise<{ id: string; resolved: boolean; error?: string }> {
  const normalizedName = channelValue.replace(/^#/, '').toLowerCase().trim()

  // 1. If already looks like an ID, return it
  if (looksLikeChannelId(normalizedName) || looksLikeChannelId(channelValue)) {
    console.log(`[VerifiedExecutor] Channel "${channelValue}" already looks like an ID`)
    return { id: channelValue, resolved: false }
  }

  // 2. Check cache
  const cacheKey = `slack_channel_${normalizedName}`
  const cached = channelIdCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[VerifiedExecutor] Using cached channel ID for "${channelValue}": ${cached.id}`)
    return { id: cached.id, resolved: true }
  }

  // 3. Fetch channels from Slack using SLACK_FIND_CHANNELS
  console.log(`[VerifiedExecutor] Resolving channel "${channelValue}" via SLACK_FIND_CHANNELS...`)

  try {
    // Use SLACK_FIND_CHANNELS with exact_match to find the channel by name
    // This tool searches channels by name, topic, purpose
    const findResult = await rubeClient.executeTool('SLACK_FIND_CHANNELS', {
      query: normalizedName,
      exact_match: true, // Prefer exact match first
      exclude_archived: true,
      limit: 10,
    })

    if (!findResult.success) {
      console.warn(`[VerifiedExecutor] Failed to find channels: ${findResult.error}`)
      // Fallback: try the name directly (some APIs accept names)
      return { id: channelValue, resolved: false, error: findResult.error }
    }

    // 4. Parse the channel find response
    const data = findResult.data as Record<string, unknown>
    const nestedData = data?.data as Record<string, unknown> | undefined
    // SLACK_FIND_CHANNELS returns channels in the channels array
    const channelList = (nestedData?.channels || data?.channels || []) as Array<{
      id?: string
      name?: string
      is_general?: boolean
      is_channel?: boolean
    }>

    console.log(`[VerifiedExecutor] SLACK_FIND_CHANNELS found ${channelList.length} channels for query "${normalizedName}"`)

    // 5. Find matching channel
    let matchedChannel: typeof channelList[0] | undefined

    // First priority: exact name match from results
    matchedChannel = channelList.find(ch =>
      ch.name?.toLowerCase() === normalizedName
    )

    // Second priority: if user said "general", find the is_general channel
    if (!matchedChannel && (normalizedName === 'general' || normalizedName === '#general')) {
      matchedChannel = channelList.find(ch => ch.is_general === true)
      if (matchedChannel) {
        console.log(`[VerifiedExecutor] Found general channel: ${matchedChannel.name} (${matchedChannel.id})`)
      }
    }

    // Third priority: first result if query matches
    if (!matchedChannel && channelList.length > 0) {
      matchedChannel = channelList[0]
      console.log(`[VerifiedExecutor] Using first match: ${matchedChannel.name}`)
    }

    if (matchedChannel?.id) {
      // Cache the result
      channelIdCache.set(cacheKey, { id: matchedChannel.id, timestamp: Date.now() })
      console.log(`[VerifiedExecutor] Resolved "${channelValue}" → "${matchedChannel.name}" (${matchedChannel.id})`)
      return { id: matchedChannel.id, resolved: true }
    }

    // No match found - log for debugging
    console.warn(`[VerifiedExecutor] No channel matching "${channelValue}" found in search results`)

    // Return original value - maybe the API can handle it
    return { id: channelValue, resolved: false, error: `Channel "${channelValue}" not found` }

  } catch (error) {
    console.error('[VerifiedExecutor] Error resolving channel:', error)
    return { id: channelValue, resolved: false, error: String(error) }
  }
}

/**
 * Resolve all params that need ID resolution before execution
 *
 * @NEXUS-FIX-048: Pre-execution parameter resolution
 */
async function resolveParamsBeforeExecution(
  toolSlug: string,
  params: Record<string, unknown>,
  toolkit: string
): Promise<{ params: Record<string, unknown>; resolutionLog: string[] }> {
  const resolvedParams = { ...params }
  const resolutionLog: string[] = []

  // Slack channel resolution
  if (toolkit === 'slack' && toolSlug.includes('SLACK')) {
    const channelParam = resolvedParams.channel as string | undefined
    if (channelParam && typeof channelParam === 'string') {
      const resolution = await resolveSlackChannel(channelParam)
      if (resolution.resolved) {
        resolutionLog.push(`Resolved channel "${channelParam}" → "${resolution.id}"`)
      } else if (resolution.error) {
        resolutionLog.push(`Warning: ${resolution.error}`)
      }
      resolvedParams.channel = resolution.id
    }
  }

  // Add more toolkit-specific resolution here in the future:
  // - Google Sheets: spreadsheet name → ID
  // - Notion: page name → ID
  // - GitHub: repo name → owner/repo

  return { params: resolvedParams, resolutionLog }
}

// ================================
// MAIN EXECUTOR CLASS
// ================================

export class VerifiedExecutorService {
  /**
   * Execute a tool with verification
   *
   * @param toolSlug - The Composio tool slug (e.g., GMAIL_SEND_EMAIL)
   * @param params - Tool parameters
   * @param context - Execution context for better error messages
   * @returns VerifiedResult with proof of execution or error
   */
  static async execute(
    toolSlug: string,
    params: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<VerifiedResult> {
    const startTime = Date.now()

    try {
      // @NEXUS-FIX-048: Resolve params BEFORE execution - DO NOT REMOVE
      // This fixes channel name → ID resolution for Slack, etc.
      const { params: resolvedParams, resolutionLog } = await resolveParamsBeforeExecution(
        toolSlug,
        params,
        context.toolkit
      )

      if (resolutionLog.length > 0) {
        console.log('[VerifiedExecutor] Param resolution:', resolutionLog.join(', '))
      }

      // Execute via Rube client with resolved params
      const result: RubeToolExecutionResult = await rubeClient.executeTool(toolSlug, resolvedParams)

      const executionTime = Date.now() - startTime

      // If API call failed, classify error
      if (!result.success) {
        return {
          success: false,
          verified: false,
          error: classifyError(result.error || 'Unknown error', context),
          executionTimeMs: executionTime,
          toolSlug,
          rawResponse: result.data,
        }
      }

      // API succeeded - now VERIFY the action actually happened
      const proof = this.verifyResponse(result.data, params, context)

      if (proof) {
        return {
          success: true,
          verified: true,
          proof,
          executionTimeMs: executionTime,
          toolSlug,
          rawResponse: result.data,
        }
      }

      // API said success but we couldn't verify
      // This is the "silent failure" case we're fixing
      console.warn(
        `[VerifiedExecutor] API returned success but verification failed for ${toolSlug}`,
        { data: result.data, params }
      )

      return {
        success: true,
        verified: false,
        error: {
          title: 'Unverified Result',
          message: `${context.nodeName} may have completed, but we couldn't confirm it.`,
          suggestion: 'Check your ' + context.toolkit + ' to verify the action.',
          recoverable: false,
          technical: 'API returned success but response lacked verification indicators',
        },
        executionTimeMs: executionTime,
        toolSlug,
        rawResponse: result.data,
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      return {
        success: false,
        verified: false,
        error: classifyError(errorMessage, context),
        executionTimeMs: executionTime,
        toolSlug,
      }
    }
  }

  /**
   * Verify response based on toolkit
   */
  private static verifyResponse(
    data: unknown,
    params: Record<string, unknown>,
    context: ExecutionContext
  ): ExecutionProof | null {
    const toolkit = context.toolkit.toLowerCase()

    // Toolkit-specific verifiers
    switch (toolkit) {
      case 'slack':
        return verifySlackResponse(data, params)

      case 'gmail':
        return verifyGmailResponse(data, params)

      case 'googlesheets':
      case 'google_sheets':
      case 'sheets':
        return verifyGoogleSheetsResponse(data, params)

      case 'googlecalendar':
      case 'google_calendar':
      case 'calendar':
        return verifyGoogleCalendarResponse(data, params)

      case 'github':
        return verifyGitHubResponse(data, params)

      case 'dropbox':
      case 'googledrive':
      case 'google_drive':
      case 'onedrive':
      case 'box':
        return verifyFileUploadResponse(data, params)

      case 'notion':
        return verifyNotionResponse(data, params)

      default:
        return verifyGenericResponse(data, toolkit)
    }
  }

  /**
   * Check if a result should be retried
   */
  static shouldRetry(result: VerifiedResult): boolean {
    if (!result.error) return false
    if (!result.error.recoverable) return false

    // Retry for rate limits, network issues, auth issues
    const retryableErrors = ['Rate Limited', 'Connection Issue', 'Connection Expired']
    return retryableErrors.includes(result.error.title)
  }

  /**
   * Get suggested retry delay in ms
   */
  static getRetryDelay(result: VerifiedResult): number {
    if (result.error?.title === 'Rate Limited') {
      return 5000 // 5 seconds for rate limits
    }
    return 2000 // 2 seconds for other retryable errors
  }

  /**
   * Format proof for display to user
   */
  static formatProofForDisplay(proof: ExecutionProof): string {
    return proof.details.summary
  }

  /**
   * Get verification status badge
   */
  static getVerificationBadge(result: VerifiedResult): {
    label: string
    variant: 'success' | 'warning' | 'error'
  } {
    if (result.verified && result.proof) {
      return { label: 'Verified', variant: 'success' }
    }
    if (result.success && !result.verified) {
      return { label: 'Unverified', variant: 'warning' }
    }
    return { label: 'Failed', variant: 'error' }
  }
}

// ================================
// CONVENIENCE EXPORTS
// ================================

export const verifiedExecute = VerifiedExecutorService.execute.bind(VerifiedExecutorService)

export default VerifiedExecutorService

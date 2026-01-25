/**
 * Composio Executor - Bridge between Workflow Engine and Composio MCP Tools
 *
 * This executor takes workflow steps with Composio tool slugs and executes them
 * via the ComposioClient, which routes to the appropriate MCP provider:
 * - Rube MCP (OAuth-authenticated web access)
 * - Composio MCP (500+ app integrations)
 * - Google Cloud MCP (Native Google services)
 * - Zapier MCP (8,000+ apps, 30,000+ actions)
 *
 * Features:
 * - Auto-OAuth: Automatically suggests and initiates OAuth connections based on user email
 * - Connection caching: Reduces redundant connection checks
 * - Retry logic: Handles transient failures gracefully
 *
 * @module ComposioExecutor
 */

import { composioClient, TOOL_SLUGS, type ComposioToolResult, type ComposioError } from '../../services/ComposioClient'
import { autoOAuthManager, type ServiceMatch, type AutoOAuthResult } from './auto-oauth'
import {
  executeWithRetry,
  createWorkflowError,
  getCircuitBreaker,
  errorEventLogger,
  checkpointManager,
  type RetryConfig,
  type WorkflowError,
  DEFAULT_RETRY_CONFIG,
} from './error-recovery'
import {
  composioLogger,
  metricsCollector,
} from '../monitoring'
import type { WorkflowAction, GeneratedWorkflowJSON } from '../../services/NLWorkflowEngine'
import type { WorkflowStep, ExecutionState } from '../../types/workflow-execution'

// ============================================================================
// Types
// ============================================================================

export interface ComposioExecutionResult {
  success: boolean
  data?: unknown
  error?: string
  errorCode?: string
  isRetryable?: boolean
  suggestedAction?: string
  suggestedActionAr?: string
  executionTimeMs: number
  toolSlug: string
  connectionRequired?: string
  authUrl?: string
  retryAttempts?: number
  workflowError?: WorkflowError
}

export interface ComposioStepConfig {
  /** Composio tool slug (e.g., SLACK_SEND_MESSAGE) */
  tool: string
  /** The toolkit/app this tool belongs to (e.g., slack, gmail) */
  toolkit: string
  /** Input parameters for the tool */
  inputs: Record<string, unknown>
  /** Retry configuration (uses enhanced error recovery system) */
  retryConfig?: Partial<RetryConfig>
  /** Timeout in milliseconds */
  timeout?: number
  /** User ID for user-specific OAuth tokens */
  userId?: string
  /** User email for auto-OAuth matching */
  userEmail?: string
  /** Whether to attempt auto-OAuth if not connected */
  enableAutoOAuth?: boolean
  /** Whether to use circuit breaker for this call */
  useCircuitBreaker?: boolean
  /** Workflow ID for checkpoint tracking */
  workflowId?: string
  /** Execution ID for checkpoint tracking */
  executionId?: string
  /** Step ID for checkpoint tracking */
  stepId?: string
}

export interface AutoOAuthSuggestion {
  toolkit: string
  service: ServiceMatch
  authUrl?: string
}

export interface ConnectionCheckResult {
  connected: boolean
  missingConnections: string[]
  authUrls: Record<string, string>
  /** Auto-OAuth suggestions for missing connections based on user email */
  autoOAuthSuggestions?: AutoOAuthSuggestion[]
}

// ============================================================================
// Tool Slug to Toolkit Mapping
// ============================================================================

/**
 * Maps tool slugs to their parent toolkit for connection checking
 */
function getToolkitFromSlug(toolSlug: string): string {
  const slug = toolSlug.toUpperCase()

  // Gmail
  if (slug.startsWith('GMAIL_')) return 'gmail'

  // Google Calendar
  if (slug.startsWith('GOOGLECALENDAR_')) return 'googlecalendar'

  // Google Sheets
  if (slug.startsWith('GOOGLESHEETS_')) return 'googlesheets'

  // Slack
  if (slug.startsWith('SLACK_')) return 'slack'

  // GitHub
  if (slug.startsWith('GITHUB_')) return 'github'

  // HubSpot
  if (slug.startsWith('HUBSPOT_')) return 'hubspot'

  // Shopify
  if (slug.startsWith('SHOPIFY_')) return 'shopify'

  // Stripe
  if (slug.startsWith('STRIPE_')) return 'stripe'

  // Discord
  if (slug.startsWith('DISCORD_')) return 'discord'

  // Notion
  if (slug.startsWith('NOTION_')) return 'notion'

  // WooCommerce
  if (slug.startsWith('WOOCOMMERCE_')) return 'woocommerce'

  // Typeform
  if (slug.startsWith('TYPEFORM_')) return 'typeform'

  // Google Cloud
  if (slug.startsWith('GOOGLE_')) return 'googlecloud'

  // Zapier-proxied tools
  if (slug.startsWith('ZAPIER_')) {
    // Extract the actual app from ZAPIER_APPNAME_ACTION format
    const parts = slug.replace('ZAPIER_', '').split('_')
    return parts[0]?.toLowerCase() || 'zapier'
  }

  // Default: extract from slug
  const parts = slug.split('_')
  return parts[0]?.toLowerCase() || 'unknown'
}

/**
 * Transform workflow inputs to match Composio tool parameter names
 * Different tools have different parameter conventions
 */
function transformInputsForTool(toolSlug: string, inputs: Record<string, unknown>): Record<string, unknown> {
  const transformed: Record<string, unknown> = { ...inputs }

  // Google Sheets transformations
  if (toolSlug === TOOL_SLUGS.googleSheets.append || toolSlug === TOOL_SLUGS.googleSheets.read) {
    // Map spreadsheetId to spreadsheet_id if needed
    if (inputs.spreadsheetId && !inputs.spreadsheet_id) {
      transformed.spreadsheet_id = inputs.spreadsheetId
      delete transformed.spreadsheetId
    }
    // Map sheetRange to range if needed
    if (inputs.sheetRange && !inputs.range) {
      transformed.range = inputs.sheetRange
      delete transformed.sheetRange
    }
  }

  // Slack transformations
  if (toolSlug === TOOL_SLUGS.slack.send) {
    // Ensure channel doesn't have # prefix for API
    if (typeof transformed.channel === 'string' && transformed.channel.startsWith('#')) {
      transformed.channel = transformed.channel.slice(1)
    }
  }

  // Gmail transformations
  if (toolSlug === TOOL_SLUGS.gmail.send) {
    // Map 'to' to 'recipient_email' if needed
    if (inputs.to && !inputs.recipient_email) {
      transformed.recipient_email = inputs.to
      delete transformed.to
    }
    // Map 'isHtml' to 'is_html'
    if (inputs.isHtml !== undefined && inputs.is_html === undefined) {
      transformed.is_html = inputs.isHtml
      delete transformed.isHtml
    }
  }

  // Google Calendar transformations
  if (toolSlug === TOOL_SLUGS.googleCalendar.create) {
    // Map title to summary
    if (inputs.title && !inputs.summary) {
      transformed.summary = inputs.title
      delete transformed.title
    }
    // Map startTime to start_datetime
    if (inputs.startTime && !inputs.start_datetime) {
      transformed.start_datetime = inputs.startTime
      delete transformed.startTime
    }
    // Map endTime to end_datetime
    if (inputs.endTime && !inputs.end_datetime) {
      transformed.end_datetime = inputs.endTime
      delete transformed.endTime
    }
  }

  return transformed
}

// ============================================================================
// Composio Executor Class
// ============================================================================

/**
 * ComposioExecutor - Executes workflow steps via Composio MCP tools
 *
 * This class bridges the gap between the workflow engine and actual
 * API execution via Composio's unified tool interface.
 */
export class ComposioExecutor {
  private initialized = false
  private connectionCache: Map<string, { connected: boolean; checkedAt: number }> = new Map()
  private connectionCacheTTL = 60000 // 1 minute cache for connection status
  private userEmail: string | null = null
  private userId: string | null = null
  private autoOAuthEnabled = true

  /**
   * Initialize the executor and Composio client
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      await composioClient.initialize()
      this.initialized = true
      composioLogger.info('ComposioExecutor initialized successfully')
    } catch (error) {
      composioLogger.error('ComposioExecutor initialization failed', error)
      // Still mark as initialized to allow demo mode
      this.initialized = true
    }
  }

  /**
   * Set user context for auto-OAuth
   * Call this after user authentication to enable seamless OAuth
   */
  setUserContext(userId: string, email: string): void {
    this.userId = userId
    this.userEmail = email
    composioLogger.debug('User context set', { userId, email })
  }

  /**
   * Enable or disable auto-OAuth feature
   */
  setAutoOAuthEnabled(enabled: boolean): void {
    this.autoOAuthEnabled = enabled
  }

  /**
   * Get auto-OAuth suggestions for missing connections
   * Based on user's email domain
   */
  async getAutoOAuthSuggestions(
    missingToolkits: string[],
    userEmail?: string
  ): Promise<AutoOAuthSuggestion[]> {
    const email = userEmail || this.userEmail
    if (!email || missingToolkits.length === 0) {
      return []
    }

    const suggestions: AutoOAuthSuggestion[] = []
    const emailSuggestions = await autoOAuthManager.getAutoOAuthSuggestions(email)

    for (const toolkit of missingToolkits) {
      // Find if any auto-OAuth suggestion matches this toolkit
      const matchingSuggestion = emailSuggestions.find(
        s => s.serviceId === toolkit || s.serviceId.includes(toolkit)
      )

      if (matchingSuggestion) {
        suggestions.push({
          toolkit,
          service: matchingSuggestion,
          authUrl: matchingSuggestion.authUrl,
        })
      }
    }

    return suggestions
  }

  /**
   * Attempt auto-OAuth connection for a toolkit
   * Returns the auth URL if successful
   */
  async attemptAutoOAuthConnection(
    toolkit: string,
    userId?: string,
    callbackUrl?: string
  ): Promise<{ authUrl?: string; error?: string }> {
    const uid = userId || this.userId
    if (!uid) {
      return { error: 'User ID not set. Call setUserContext first.' }
    }

    return autoOAuthManager.initiateConnection(uid, toolkit, callbackUrl)
  }

  /**
   * Process auto-OAuth for user during onboarding or first workflow
   */
  async processAutoOAuth(
    email: string,
    userId: string,
    options?: {
      autoInitiate?: boolean
      callbackUrl?: string
      role?: string
    }
  ): Promise<AutoOAuthResult> {
    this.setUserContext(userId, email)

    return autoOAuthManager.processAutoOAuth({
      email,
      userId,
      autoInitiate: options?.autoInitiate ?? false,
      callbackUrl: options?.callbackUrl,
    })
  }

  /**
   * Check if required connections are available for a workflow
   * Includes auto-OAuth suggestions for missing connections based on user email
   */
  async checkConnections(
    workflow: GeneratedWorkflowJSON,
    options?: { userEmail?: string; includeAutoOAuth?: boolean }
  ): Promise<ConnectionCheckResult> {
    await this.initialize()

    const requiredToolkits = new Set<string>()

    // Collect required toolkits from trigger
    if (workflow.trigger.composioTool) {
      requiredToolkits.add(getToolkitFromSlug(workflow.trigger.composioTool))
    }

    // Collect required toolkits from actions
    for (const action of workflow.actions) {
      if (action.tool) {
        requiredToolkits.add(getToolkitFromSlug(action.tool))
      }
      if (action.toolkit) {
        requiredToolkits.add(action.toolkit.toLowerCase())
      }
    }

    const missingConnections: string[] = []
    const authUrls: Record<string, string> = {}
    let allConnected = true

    for (const toolkit of requiredToolkits) {
      const cached = this.connectionCache.get(toolkit)
      const now = Date.now()

      let isConnected: boolean

      if (cached && (now - cached.checkedAt) < this.connectionCacheTTL) {
        isConnected = cached.connected
      } else {
        // Check connection status
        const status = await composioClient.checkConnection(toolkit)
        isConnected = status.connected
        this.connectionCache.set(toolkit, { connected: isConnected, checkedAt: now })

        if (!isConnected && status.authUrl) {
          authUrls[toolkit] = status.authUrl
        }
      }

      if (!isConnected) {
        missingConnections.push(toolkit)
        allConnected = false
      }
    }

    // Get auto-OAuth suggestions for missing connections if enabled
    let autoOAuthSuggestions: AutoOAuthSuggestion[] | undefined
    if (
      this.autoOAuthEnabled &&
      missingConnections.length > 0 &&
      (options?.includeAutoOAuth !== false)
    ) {
      autoOAuthSuggestions = await this.getAutoOAuthSuggestions(
        missingConnections,
        options?.userEmail
      )

      // Add auth URLs from auto-OAuth suggestions
      for (const suggestion of autoOAuthSuggestions) {
        if (suggestion.authUrl && !authUrls[suggestion.toolkit]) {
          authUrls[suggestion.toolkit] = suggestion.authUrl
        }
      }
    }

    return {
      connected: allConnected,
      missingConnections,
      authUrls,
      autoOAuthSuggestions,
    }
  }

  /**
   * Execute a single Composio tool with enhanced error recovery
   * Features:
   * - Automatic retry with exponential backoff
   * - Circuit breaker for service availability
   * - Auto-OAuth suggestions for missing connections
   * - Error event logging for analytics
   */
  async executeTool(config: ComposioStepConfig): Promise<ComposioExecutionResult> {
    await this.initialize()

    const startTime = Date.now()
    const {
      tool,
      toolkit,
      inputs,
      retryConfig,
      timeout,
      userId,
      userEmail,
      enableAutoOAuth,
      useCircuitBreaker = true,
      workflowId,
      executionId,
      stepId,
    } = config

    // Create execution-scoped logger
    const logger = composioLogger.child({ tool, toolkit, workflowId, executionId, stepId })
    logger.info('Executing Composio tool', { inputKeys: Object.keys(inputs) })

    // Track API call metrics
    metricsCollector.recordAPICall(toolkit, tool)

    // Merge retry config with defaults
    const mergedRetryConfig: RetryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...retryConfig,
    }

    // Check circuit breaker first if enabled
    if (useCircuitBreaker) {
      const circuitBreaker = getCircuitBreaker(toolkit)
      const { allowed, reason } = circuitBreaker.canExecute()
      if (!allowed) {
        const workflowError = createWorkflowError(
          new Error(reason || `Circuit breaker open for ${toolkit}`),
          toolkit
        )
        logger.warn('Circuit breaker open', { reason, toolkit })
        metricsCollector.recordError('rate_limit', toolkit)
        return {
          success: false,
          error: workflowError.message,
          errorCode: 'CIRCUIT_BREAKER_OPEN',
          isRetryable: false,
          suggestedAction: workflowError.suggestedAction,
          suggestedActionAr: workflowError.suggestedActionAr,
          toolSlug: tool,
          executionTimeMs: Date.now() - startTime,
          workflowError,
        }
      }
    }

    // Check connection first
    const connectionStatus = await composioClient.checkConnection(toolkit)
    if (!connectionStatus.connected) {
      // If auto-OAuth is enabled and we have user context, try to get suggestions
      let autoOAuthSuggestion: AutoOAuthSuggestion | undefined
      const email = userEmail || this.userEmail

      if ((enableAutoOAuth !== false) && this.autoOAuthEnabled && email) {
        const suggestions = await this.getAutoOAuthSuggestions([toolkit], email)
        autoOAuthSuggestion = suggestions[0]
      }

      const workflowError = createWorkflowError(
        new Error(`${toolkit} is not connected. Please authenticate first.`),
        toolkit
      )
      workflowError.code = 'NOT_CONNECTED'
      workflowError.category = 'auth_expired'
      workflowError.classification = 'auth'

      logger.warn('Connection not available', {
        toolkit,
        hasAutoOAuthSuggestion: !!autoOAuthSuggestion,
        hasAuthUrl: !!(autoOAuthSuggestion?.authUrl || connectionStatus.authUrl)
      })
      metricsCollector.recordError('auth', toolkit)

      return {
        success: false,
        error: workflowError.message,
        errorCode: 'NOT_CONNECTED',
        isRetryable: false,
        suggestedAction: autoOAuthSuggestion
          ? `Connect your ${autoOAuthSuggestion.service.name} account (matched from your email)`
          : 'Connect your account to proceed',
        suggestedActionAr: autoOAuthSuggestion
          ? `اربط حسابك في ${autoOAuthSuggestion.service.name} (مطابق من بريدك الإلكتروني)`
          : 'اربط حسابك للمتابعة',
        connectionRequired: toolkit,
        authUrl: autoOAuthSuggestion?.authUrl || connectionStatus.authUrl,
        toolSlug: tool,
        executionTimeMs: Date.now() - startTime,
        workflowError,
      }
    }

    // Transform inputs to match tool parameter names
    const transformedInputs = transformInputsForTool(tool, inputs)

    // Execute with retry logic
    let retryAttempts = 0
    const circuitBreaker = useCircuitBreaker ? getCircuitBreaker(toolkit) : null

    try {
      const result = await executeWithRetry<ComposioToolResult>(
        async () => {
          let toolResult: ComposioToolResult

          if (userId) {
            // Use user-specific OAuth tokens
            toolResult = await composioClient.executeToolForUser(userId, tool, transformedInputs)
          } else {
            // Use default session
            toolResult = await composioClient.executeTool(tool, transformedInputs, {
              maxRetries: 1, // We handle retries at this level
              timeout: timeout ?? 30000,
            })
          }

          if (!toolResult.success) {
            // Throw to trigger retry logic
            const error = new Error(toolResult.error || 'Tool execution failed')
            ;(error as Error & { toolResult: ComposioToolResult }).toolResult = toolResult
            throw error
          }

          return toolResult
        },
        {
          service: toolkit,
          config: mergedRetryConfig,
          onRetry: (error, attempt, delay) => {
            retryAttempts = attempt
            logger.warn('Retry attempt', {
              attempt,
              maxRetries: mergedRetryConfig.maxRetries,
              delayMs: delay,
              errorMessage: error.message
            })

            // Log retry event
            errorEventLogger.log({
              error,
              workflowId,
              executionId,
              stepId,
              userId,
              recoveryAction: 'retry',
              recoverySuccess: false,
              retryAttempt: attempt,
              totalRetries: mergedRetryConfig.maxRetries,
              durationMs: Date.now() - startTime,
              metadata: { tool, toolkit },
            })
          },
          onSuccess: (_result, attempts) => {
            // Record success for circuit breaker
            if (circuitBreaker) {
              circuitBreaker.recordSuccess()
            }

            // Log success with timing
            const executionTimeMs = Date.now() - startTime
            metricsCollector.recordAPILatency(toolkit, tool, executionTimeMs)
            logger.timing('Tool execution completed', executionTimeMs, {
              attempts,
              retried: attempts > 1
            })
          },
          onFailure: (error, attempts) => {
            // Record failure for circuit breaker
            if (circuitBreaker) {
              circuitBreaker.recordFailure()
            }

            // Log final failure
            const executionTimeMs = Date.now() - startTime
            metricsCollector.recordError('api', toolkit)
            logger.error('Tool execution failed after retries', error, {
              attempts,
              executionTimeMs
            })

            errorEventLogger.log({
              error,
              workflowId,
              executionId,
              stepId,
              userId,
              recoveryAction: 'abort',
              recoverySuccess: false,
              retryAttempt: attempts,
              totalRetries: mergedRetryConfig.maxRetries,
              durationMs: executionTimeMs,
              metadata: { tool, toolkit },
            })
          },
        }
      )

      return {
        success: true,
        data: result.data,
        toolSlug: tool,
        executionTimeMs: Date.now() - startTime,
        retryAttempts,
      }
    } catch (error) {
      // Create structured workflow error
      const workflowError = createWorkflowError(error, toolkit, {
        tool,
        inputs: transformedInputs,
        retryAttempts,
      })

      // Handle error with graceful degradation
      // Note: composioClient.lastError available for debugging if needed

      return {
        success: false,
        error: workflowError.message,
        errorCode: workflowError.code,
        isRetryable: workflowError.isRetryable,
        suggestedAction: workflowError.suggestedAction,
        suggestedActionAr: workflowError.suggestedActionAr,
        toolSlug: tool,
        executionTimeMs: Date.now() - startTime,
        retryAttempts,
        workflowError,
      }
    }
  }

  /**
   * Execute a workflow action (from NLWorkflowEngine output)
   */
  async executeAction(action: WorkflowAction, context: Record<string, unknown> = {}, userId?: string): Promise<ComposioExecutionResult> {
    // Resolve dynamic inputs from context
    const resolvedInputs = this.resolveInputs(action.inputs, context)

    return this.executeTool({
      tool: action.tool,
      toolkit: action.toolkit,
      inputs: resolvedInputs,
      retryConfig: action.retryConfig,
      userId,
    })
  }

  /**
   * Execute a workflow step (from orchestrator)
   */
  async executeStep(step: WorkflowStep, state: ExecutionState): Promise<ComposioExecutionResult> {
    // Extract Composio config from step
    const config = step.config as {
      composioTool?: string
      toolkit?: string
      tool?: string
      inputs?: Record<string, unknown>
      payload?: Record<string, unknown>
      service?: string
    }

    const tool = config.composioTool || config.tool || ''
    const toolkit = config.toolkit || config.service || getToolkitFromSlug(tool)
    const inputs = config.inputs || config.payload || {}

    // Resolve inputs from execution state context
    const resolvedInputs = this.resolveInputs(inputs, state.context)

    return this.executeTool({
      tool,
      toolkit,
      inputs: resolvedInputs,
    })
  }

  /**
   * Execute multiple actions in sequence with checkpoint support
   * @param options.enableCheckpoints - Create checkpoints for resume capability
   * @param options.resumeFromCheckpoint - Resume from an existing checkpoint
   */
  async executeActionsSequential(
    actions: WorkflowAction[],
    initialContext: Record<string, unknown> = {},
    userId?: string,
    onStepComplete?: (action: WorkflowAction, result: ComposioExecutionResult) => void,
    options?: {
      workflowId?: string
      executionId?: string
      enableCheckpoints?: boolean
      resumeFromCheckpoint?: boolean
    }
  ): Promise<{
    success: boolean
    results: Array<{ actionId: string; result: ComposioExecutionResult }>
    context: Record<string, unknown>
    failedAtAction?: string
    checkpointId?: string
  }> {
    const results: Array<{ actionId: string; result: ComposioExecutionResult }> = []
    const context = { ...initialContext }
    const { workflowId, executionId, enableCheckpoints, resumeFromCheckpoint } = options || {}

    // Check for existing checkpoint if resuming
    let completedSteps: string[] = []
    let stepResults: Record<string, unknown> = {}
    let tokensUsed = 0
    let costUsd = 0

    if (resumeFromCheckpoint && executionId) {
      const checkpoint = checkpointManager.getCheckpoint(executionId)
      if (checkpoint) {
        completedSteps = checkpoint.completedSteps
        stepResults = checkpoint.stepResults
        tokensUsed = checkpoint.tokensUsed
        costUsd = checkpoint.costUsd
        Object.assign(context, checkpoint.context)
        console.log(`[ComposioExecutor] Resuming from checkpoint: ${checkpoint.id}, ${completedSteps.length} steps completed`)
      }
    }

    for (const action of actions) {
      // Skip already completed steps when resuming
      if (completedSteps.includes(action.id)) {
        console.log(`[ComposioExecutor] Skipping completed step: ${action.id}`)
        continue
      }

      const result = await this.executeAction(action, context, userId)

      results.push({ actionId: action.id, result })

      if (onStepComplete) {
        onStepComplete(action, result)
      }

      if (!result.success) {
        // Create checkpoint on failure for potential resume
        let checkpointId: string | undefined
        if (enableCheckpoints && workflowId && executionId) {
          const checkpoint = checkpointManager.createCheckpoint({
            workflowId,
            executionId,
            stepId: action.id,
            status: 'failed',
            context,
            completedSteps,
            failedSteps: [action.id],
            stepResults,
            tokensUsed,
            costUsd,
          })
          checkpointId = checkpoint.id
          console.log(`[ComposioExecutor] Created failure checkpoint: ${checkpointId}`)
        }

        return {
          success: false,
          results,
          context,
          failedAtAction: action.id,
          checkpointId,
        }
      }

      // Track completed step
      completedSteps.push(action.id)
      stepResults[action.id] = result.data
      context[action.id] = result.data

      // Update checkpoint after each successful step
      if (enableCheckpoints && workflowId && executionId) {
        checkpointManager.updateCheckpoint(executionId, {
          stepId: action.id,
          status: 'in_progress',
          context,
          completedSteps,
          stepResults,
          tokensUsed,
          costUsd,
        })
      }
    }

    // Mark final checkpoint as completed
    let checkpointId: string | undefined
    if (enableCheckpoints && workflowId && executionId) {
      const checkpoint = checkpointManager.updateCheckpoint(executionId, {
        status: 'completed',
        context,
        completedSteps,
        stepResults,
        tokensUsed,
        costUsd,
      })
      checkpointId = checkpoint?.id
    }

    return {
      success: true,
      results,
      context,
      checkpointId,
    }
  }

  /**
   * Execute multiple actions in parallel
   */
  async executeActionsParallel(
    actions: WorkflowAction[],
    context: Record<string, unknown> = {},
    userId?: string
  ): Promise<Array<{ actionId: string; result: ComposioExecutionResult }>> {
    const promises = actions.map(async action => ({
      actionId: action.id,
      result: await this.executeAction(action, context, userId),
    }))

    return Promise.all(promises)
  }

  /**
   * Execute a complete workflow from NLWorkflowEngine
   */
  async executeWorkflow(
    workflow: GeneratedWorkflowJSON,
    options?: {
      userId?: string
      onActionStart?: (action: WorkflowAction) => void
      onActionComplete?: (action: WorkflowAction, result: ComposioExecutionResult) => void
      onError?: (action: WorkflowAction, error: ComposioExecutionResult) => void
    }
  ): Promise<{
    success: boolean
    results: Array<{ actionId: string; result: ComposioExecutionResult }>
    context: Record<string, unknown>
    totalExecutionTimeMs: number
  }> {
    const startTime = Date.now()
    const workflowLogger = composioLogger.child({ workflowId: workflow.id, userId: options?.userId })
    workflowLogger.info('Starting workflow execution', {
      workflowName: workflow.name,
      actionCount: workflow.actions.length
    })

    // Check connections first
    const connectionCheck = await this.checkConnections(workflow)
    if (!connectionCheck.connected) {
      workflowLogger.warn('Workflow blocked by missing connections', {
        missingConnections: connectionCheck.missingConnections
      })
      return {
        success: false,
        results: [{
          actionId: 'connection_check',
          result: {
            success: false,
            error: `Missing connections: ${connectionCheck.missingConnections.join(', ')}`,
            errorCode: 'NOT_CONNECTED',
            isRetryable: false,
            suggestedAction: 'Connect the required services to proceed',
            toolSlug: '',
            executionTimeMs: Date.now() - startTime,
          },
        }],
        context: { missingConnections: connectionCheck.missingConnections, authUrls: connectionCheck.authUrls },
        totalExecutionTimeMs: Date.now() - startTime,
      }
    }

    // Build dependency graph
    const actionMap = new Map<string, WorkflowAction>()
    const dependencyMap = new Map<string, Set<string>>()

    for (const action of workflow.actions) {
      actionMap.set(action.id, action)
      dependencyMap.set(action.id, new Set(action.dependsOn))
    }

    // Execute in dependency order
    const results: Array<{ actionId: string; result: ComposioExecutionResult }> = []
    const context: Record<string, unknown> = {}
    const completed = new Set<string>()

    const executeAction = async (action: WorkflowAction): Promise<ComposioExecutionResult> => {
      if (options?.onActionStart) {
        options.onActionStart(action)
      }

      const result = await this.executeAction(action, context, options?.userId)

      if (result.success) {
        if (options?.onActionComplete) {
          options.onActionComplete(action, result)
        }
      } else {
        if (options?.onError) {
          options.onError(action, result)
        }
      }

      return result
    }

    // Topological execution
    while (completed.size < workflow.actions.length) {
      // Find actions ready to execute (all dependencies complete)
      const ready: WorkflowAction[] = []

      for (const action of workflow.actions) {
        if (completed.has(action.id)) continue

        const deps = dependencyMap.get(action.id) || new Set()
        const allDepsComplete = Array.from(deps).every(dep => completed.has(dep))

        if (allDepsComplete) {
          ready.push(action)
        }
      }

      if (ready.length === 0 && completed.size < workflow.actions.length) {
        // Circular dependency or missing dependency
        return {
          success: false,
          results,
          context,
          totalExecutionTimeMs: Date.now() - startTime,
        }
      }

      // Execute ready actions in parallel
      const parallelResults = await Promise.all(
        ready.map(async action => ({
          actionId: action.id,
          result: await executeAction(action),
        }))
      )

      // Process results
      for (const { actionId, result } of parallelResults) {
        results.push({ actionId, result })

        if (result.success) {
          completed.add(actionId)
          context[actionId] = result.data
        } else {
          // Action failed - stop workflow
          const totalExecutionTimeMs = Date.now() - startTime
          workflowLogger.error('Workflow failed at action', new Error(result.error || 'Unknown error'), {
            failedActionId: actionId,
            completedActions: completed.size,
            totalActions: workflow.actions.length,
            totalExecutionTimeMs
          })
          return {
            success: false,
            results,
            context,
            totalExecutionTimeMs,
          }
        }
      }
    }

    const totalExecutionTimeMs = Date.now() - startTime
    workflowLogger.timing('Workflow completed successfully', totalExecutionTimeMs, {
      completedActions: completed.size,
      totalActions: workflow.actions.length
    })

    return {
      success: true,
      results,
      context,
      totalExecutionTimeMs,
    }
  }

  /**
   * Resolve dynamic inputs by substituting context variables
   */
  private resolveInputs(
    inputs: Record<string, unknown>,
    context: Record<string, unknown>
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'string') {
        // Check for template syntax: {{variableName}} or {{stepId.field}}
        const templateMatch = value.match(/^\{\{(.+)\}\}$/)
        if (templateMatch) {
          const path = templateMatch[1].trim()
          resolved[key] = this.getValueFromPath(context, path) ?? value
        } else {
          // Replace inline templates
          resolved[key] = value.replace(/\{\{(.+?)\}\}/g, (_, path) => {
            const val = this.getValueFromPath(context, path.trim())
            return val !== undefined ? String(val) : `{{${path}}}`
          })
        }
      } else if (Array.isArray(value)) {
        resolved[key] = value.map(item =>
          typeof item === 'object' && item !== null
            ? this.resolveInputs(item as Record<string, unknown>, context)
            : item
        )
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveInputs(value as Record<string, unknown>, context)
      } else {
        resolved[key] = value
      }
    }

    return resolved
  }

  /**
   * Get value from nested object path
   */
  private getValueFromPath(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.')
    let current: unknown = obj

    for (const part of parts) {
      if (current === null || current === undefined) return undefined
      if (typeof current !== 'object') return undefined
      current = (current as Record<string, unknown>)[part]
    }

    return current
  }

  /**
   * Initiate connection for a toolkit
   */
  async initiateConnection(toolkit: string): Promise<{ authUrl?: string; error?: string }> {
    await this.initialize()
    return composioClient.initiateConnection(toolkit)
  }

  /**
   * Check if the executor is in demo mode
   */
  get isDemoMode(): boolean {
    return composioClient.isDemoMode
  }

  /**
   * Get the last error from the executor
   */
  get lastError(): ComposioError | null {
    return composioClient.lastError
  }

  /**
   * Clear connection cache (useful after OAuth callback)
   */
  clearConnectionCache(): void {
    this.connectionCache.clear()
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(windowMs: number = 3600000): {
    totalErrors: number
    byCategory: Record<string, number>
    byService: Record<string, number>
    recoveryRate: number
    avgRetries: number
  } {
    return errorEventLogger.getStats(windowMs)
  }

  /**
   * Get circuit breaker status for a service
   */
  getCircuitBreakerStatus(service: string): {
    isOpen: boolean
    failures: number
    lastFailureTime: number
    lastSuccessTime: number
    halfOpenAttempts: number
  } {
    return getCircuitBreaker(service).getState()
  }

  /**
   * Reset circuit breaker for a service
   */
  resetCircuitBreaker(service: string): void {
    getCircuitBreaker(service).reset()
    console.log(`[ComposioExecutor] Circuit breaker reset for ${service}`)
  }

  /**
   * Get checkpoint for an execution
   */
  getCheckpoint(executionId: string) {
    return checkpointManager.getCheckpoint(executionId)
  }

  /**
   * Resume execution from a checkpoint
   */
  async resumeFromCheckpoint(
    checkpointId: string,
    workflow: GeneratedWorkflowJSON,
    options?: {
      userId?: string
      onActionStart?: (action: WorkflowAction) => void
      onActionComplete?: (action: WorkflowAction, result: ComposioExecutionResult) => void
      onError?: (action: WorkflowAction, error: ComposioExecutionResult) => void
    }
  ): Promise<{
    success: boolean
    results: Array<{ actionId: string; result: ComposioExecutionResult }>
    context: Record<string, unknown>
    totalExecutionTimeMs: number
    resumedFrom: string
  }> {
    const checkpoint = checkpointManager.getCheckpointById(checkpointId)
    if (!checkpoint) {
      return {
        success: false,
        results: [],
        context: {},
        totalExecutionTimeMs: 0,
        resumedFrom: checkpointId,
      }
    }

    console.log(`[ComposioExecutor] Resuming workflow from checkpoint ${checkpointId}`)
    console.log(`[ComposioExecutor] Previously completed: ${checkpoint.completedSteps.join(', ')}`)

    // Filter out already completed actions
    const remainingActions = workflow.actions.filter(
      action => !checkpoint.completedSteps.includes(action.id)
    )

    if (remainingActions.length === 0) {
      return {
        success: true,
        results: [],
        context: checkpoint.context,
        totalExecutionTimeMs: 0,
        resumedFrom: checkpointId,
      }
    }

    // Execute remaining actions with checkpoint context
    const startTime = Date.now()
    const result = await this.executeActionsSequential(
      remainingActions,
      checkpoint.context,
      options?.userId,
      options?.onActionComplete,
      {
        workflowId: checkpoint.workflowId,
        executionId: checkpoint.executionId,
        enableCheckpoints: true,
      }
    )

    return {
      ...result,
      totalExecutionTimeMs: Date.now() - startTime,
      resumedFrom: checkpointId,
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const composioExecutor = new ComposioExecutor()

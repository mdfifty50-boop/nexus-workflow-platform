/**
 * Workflow Engine - Core Nexus Execution System
 *
 * This module provides the complete workflow execution pipeline:
 *
 * 1. Intent Parsing - Convert natural language to structured intent
 * 2. Workflow Generation - Transform intent into executable workflow
 * 3. Service Integration - Connect to external services (food delivery, etc.)
 * 4. Context Management - Persist user preferences and addresses
 *
 * Usage Example:
 * ```typescript
 * import { nexusWorkflowEngine } from './workflow-engine'
 *
 * // Execute a natural language command
 * const result = await nexusWorkflowEngine.execute(
 *   "Order healthy meal to my home",
 *   { userId: 'user_123' }
 * )
 *
 * // Result includes the generated workflow and execution state
 * console.log(result.workflow.steps)
 * console.log(result.execution.status)
 * ```
 */

import { intentParser, IntentParser } from './intent-parser'
import { workflowGenerator, WorkflowGenerator } from './workflow-generator'
import { serviceIntegrations, ServiceIntegrationManager } from './service-integrations'
import { contextManager, ContextManager } from './context-manager'
import type {
  ParsedIntent,
  GeneratedWorkflow,
  ExecutionState,
  WorkflowStep,
  UserContext,
  ServiceIntegration,
  WorkflowEvent,
  UserActionRequest,
} from '../../types/workflow-execution'

// ========================================
// Main Workflow Engine
// ========================================

export interface ExecuteOptions {
  userId?: string
  autoExecute?: boolean  // Automatically start execution after generation
  simplifyWorkflow?: boolean  // Reduce confirmation steps
  maxQuestions?: number  // Max clarifying questions before stopping
}

export interface ExecutionResult {
  intent: ParsedIntent
  workflow: GeneratedWorkflow
  execution?: ExecutionState
  requiresUserAction?: UserActionRequest
  messages: string[]
}

/**
 * Main Nexus Workflow Engine - The CORE function of Nexus
 *
 * Takes natural language commands and executes real-world actions.
 */
export class NexusWorkflowEngine {
  private intentParser: IntentParser
  private workflowGenerator: WorkflowGenerator
  private serviceManager: ServiceIntegrationManager
  private contextManager: ContextManager

  // Event handlers
  private onEventCallback?: (event: WorkflowEvent) => void
  private onUserActionCallback?: (request: UserActionRequest) => Promise<string>

  constructor() {
    this.intentParser = intentParser
    this.workflowGenerator = workflowGenerator
    this.serviceManager = serviceIntegrations
    this.contextManager = contextManager
  }

  /**
   * Register event handler for real-time updates
   */
  onEvent(callback: (event: WorkflowEvent) => void): void {
    this.onEventCallback = callback
  }

  /**
   * Register handler for user action requests
   */
  onUserAction(callback: (request: UserActionRequest) => Promise<string>): void {
    this.onUserActionCallback = callback
  }

  /**
   * Execute a natural language command
   *
   * This is the MAIN entry point for Nexus functionality.
   *
   * @param input - Natural language command (e.g., "Order healthy meal to my home")
   * @param options - Execution options
   */
  async execute(input: string, options: ExecuteOptions = {}): Promise<ExecutionResult> {
    const {
      userId,
      autoExecute = false,
      simplifyWorkflow = false,
      maxQuestions = 3,
    } = options

    const messages: string[] = []

    // Step 1: Initialize user context
    if (userId) {
      await this.contextManager.initialize(userId)
      messages.push('Loaded user context')
    }

    // Step 2: Parse intent from natural language
    let intent = await this.intentParser.parse(input, {
      useAI: true,
      includeContext: true,
      userId,
    })

    messages.push(`Parsed intent: ${intent.category} / ${intent.action} (confidence: ${intent.confidence.toFixed(2)})`)

    // Step 3: Handle missing information (ask clarifying questions)
    let questionCount = 0
    while (!intent.canExecute && questionCount < maxQuestions && this.onUserActionCallback) {
      const clarification = await this.intentParser.askClarification(intent)

      const request: UserActionRequest = {
        id: `clarify_${Date.now()}`,
        type: clarification.options ? 'selection' : 'input',
        title: 'Need More Information',
        message: clarification.question,
        options: clarification.options?.map(o => ({ id: o, label: o })),
      }

      // Emit event
      this.emitEvent({
        type: 'user_action_required',
        workflowId: '',
        executionId: '',
        data: request,
        timestamp: new Date().toISOString(),
      })

      // Get user response
      const response = await this.onUserActionCallback(request)
      intent = this.intentParser.updateWithAnswer(intent, clarification.field, response)
      questionCount++

      messages.push(`User provided: ${clarification.field} = ${response}`)
    }

    // Step 4: Generate workflow
    const workflow = await this.workflowGenerator.generate(intent, {
      userId,
      useAIGeneration: true,
      simplify: simplifyWorkflow,
    })

    messages.push(`Generated workflow: ${workflow.name} with ${workflow.steps.length} steps`)

    // Step 5: Check requirements
    const missingIntegrations = workflow.requiredIntegrations.filter(i => !i.connected)
    if (missingIntegrations.length > 0) {
      messages.push(`Missing integrations: ${missingIntegrations.map(i => i.service).join(', ')}`)
      workflow.status = 'draft'
    }

    const missingContext = workflow.requiredContext.filter(c => c.required && !c.available)
    if (missingContext.length > 0) {
      messages.push(`Missing context: ${missingContext.map(c => c.key).join(', ')}`)
      workflow.status = 'draft'
    }

    // Step 6: Optionally start execution
    let execution: ExecutionState | undefined
    if (autoExecute && workflow.status === 'ready') {
      execution = await this.executeWorkflow(workflow)
      messages.push(`Started execution: ${execution.status}`)
    }

    return {
      intent,
      workflow,
      execution,
      messages,
    }
  }

  /**
   * Execute a generated workflow
   */
  async executeWorkflow(workflow: GeneratedWorkflow): Promise<ExecutionState> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const state: ExecutionState = {
      executionId,
      workflowId: workflow.id,
      status: 'initializing',
      completedSteps: [],
      stepResults: {},
      context: {},
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tokensUsed: 0,
      costUsd: 0,
      errors: [],
      recoveryAttempts: 0,
    }

    // Find start step
    const startStep = workflow.steps.find(s => s.id === workflow.startStepId) || workflow.steps[0]
    if (!startStep) {
      state.status = 'failed'
      state.errors.push({
        stepId: '',
        code: 'NO_START_STEP',
        message: 'Workflow has no steps',
        recoverable: false,
        timestamp: new Date().toISOString(),
      })
      return state
    }

    state.status = 'running'
    state.currentStepId = startStep.id

    // Execute workflow steps
    try {
      await this.executeStep(startStep, workflow, state)
      state.status = 'completed'
    } catch (error) {
      state.status = 'failed'
      state.errors.push({
        stepId: state.currentStepId || '',
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : String(error),
        recoverable: false,
        timestamp: new Date().toISOString(),
      })
    }

    state.completedAt = new Date().toISOString()
    state.updatedAt = new Date().toISOString()

    this.emitEvent({
      type: state.status === 'completed' ? 'workflow_completed' : 'workflow_failed',
      workflowId: workflow.id,
      executionId,
      data: state,
      timestamp: new Date().toISOString(),
    })

    return state
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    workflow: GeneratedWorkflow,
    state: ExecutionState
  ): Promise<void> {
    state.currentStepId = step.id
    state.stepResults[step.id] = {
      stepId: step.id,
      status: 'running',
      startedAt: new Date().toISOString(),
    }

    this.emitEvent({
      type: 'step_started',
      workflowId: workflow.id,
      executionId: state.executionId,
      stepId: step.id,
      data: step,
      timestamp: new Date().toISOString(),
    })

    try {
      // Execute based on step type
      let output: unknown

      switch (step.type) {
        case 'ai_reasoning':
          output = await this.executeAIStep(step, state)
          break

        case 'api_call':
          output = await this.executeAPIStep(step, state)
          break

        case 'user_confirmation':
          output = await this.executeUserConfirmation(step, state, workflow.id)
          break

        case 'data_transform':
          output = this.executeDataTransform(step, state)
          break

        case 'notification':
          output = await this.executeNotification(step, state)
          break

        default:
          output = { skipped: true, reason: `Unknown step type: ${step.type}` }
      }

      // Update step result
      state.stepResults[step.id] = {
        stepId: step.id,
        status: 'completed',
        output,
        startedAt: state.stepResults[step.id].startedAt,
        completedAt: new Date().toISOString(),
      }

      state.completedSteps.push(step.id)
      state.context[step.id] = output

      this.emitEvent({
        type: 'step_completed',
        workflowId: workflow.id,
        executionId: state.executionId,
        stepId: step.id,
        data: output,
        timestamp: new Date().toISOString(),
      })

      // Execute dependent steps
      const nextSteps = workflow.steps.filter(s =>
        s.dependsOn.includes(step.id) &&
        s.dependsOn.every(dep => state.completedSteps.includes(dep))
      )

      for (const nextStep of nextSteps) {
        await this.executeStep(nextStep, workflow, state)
      }

    } catch (error) {
      state.stepResults[step.id] = {
        stepId: step.id,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        startedAt: state.stepResults[step.id].startedAt,
        completedAt: new Date().toISOString(),
      }

      this.emitEvent({
        type: 'step_failed',
        workflowId: workflow.id,
        executionId: state.executionId,
        stepId: step.id,
        data: { error: state.stepResults[step.id].error },
        timestamp: new Date().toISOString(),
      })

      throw error
    }
  }

  /**
   * Execute an AI reasoning step
   */
  private async executeAIStep(step: WorkflowStep, state: ExecutionState): Promise<unknown> {
    const { apiClient } = await import('../api-client')

    // Build context from previous steps
    const contextData: Record<string, unknown> = {}
    for (const key of (step.config.contextKeys || [])) {
      if (state.context[key]) {
        contextData[key] = state.context[key]
      }
    }

    const prompt = step.config.prompt || 'Process the input'
    const enrichedPrompt = Object.keys(contextData).length > 0
      ? `${prompt}\n\nContext:\n${JSON.stringify(contextData, null, 2)}`
      : prompt

    const response = await apiClient.chat({
      messages: [{ role: 'user', content: enrichedPrompt }],
      model: (step.config.model as 'claude-3-5-haiku-20241022' | 'claude-opus-4-6-20250115' | 'claude-opus-4-6-20250115') || 'claude-opus-4-6-20250115',
      maxTokens: 2000,
    })

    if (!response.success) {
      throw new Error(response.error || 'AI request failed')
    }

    // Track usage
    state.tokensUsed += response.tokensUsed || 0
    state.costUsd += response.costUSD || 0

    // Try to parse JSON from response
    try {
      const jsonMatch = response.output.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch {
      // Return raw text if not JSON
    }

    return { text: response.output }
  }

  /**
   * Execute an API call step
   */
  private async executeAPIStep(step: WorkflowStep, _state: ExecutionState): Promise<unknown> {
    const service = step.config.service
    const endpoint = step.config.endpoint

    if (!service || !endpoint) {
      throw new Error('API step missing service or endpoint configuration')
    }

    // Use service integrations manager
    const result = await this.serviceManager.executeAction(
      service,
      endpoint.split('/').pop() || 'execute',  // Use last part of endpoint as action
      step.config.payload || {}
    )

    if (!result.success) {
      throw new Error(result.error || 'API call failed')
    }

    return result.data
  }

  /**
   * Execute a user confirmation step
   */
  private async executeUserConfirmation(
    step: WorkflowStep,
    state: ExecutionState,
    workflowId: string
  ): Promise<{ confirmed: boolean; response?: string }> {
    if (!this.onUserActionCallback) {
      // Auto-approve if no handler and autoApproveAfter is set
      if (step.config.autoApproveAfter && step.config.autoApproveAfter > 0) {
        await new Promise(resolve => setTimeout(resolve, step.config.autoApproveAfter))
        return { confirmed: true }
      }
      throw new Error('User confirmation required but no handler registered')
    }

    const request: UserActionRequest = {
      id: `confirm_${step.id}`,
      type: step.config.options ? 'selection' : 'confirmation',
      title: step.name,
      message: step.config.message || 'Please confirm to continue',
      options: step.config.options?.map(o => ({ id: o, label: o })),
      timeout: step.config.autoApproveAfter,
      default: step.config.defaultOption,
    }

    this.emitEvent({
      type: 'user_action_required',
      workflowId,
      executionId: state.executionId,
      stepId: step.id,
      data: request,
      timestamp: new Date().toISOString(),
    })

    // Wait for user response with optional timeout
    const responsePromise = this.onUserActionCallback(request)

    if (step.config.autoApproveAfter && step.config.autoApproveAfter > 0) {
      const timeoutPromise = new Promise<string>(resolve =>
        setTimeout(() => resolve(step.config.defaultOption || 'confirmed'), step.config.autoApproveAfter)
      )
      const response = await Promise.race([responsePromise, timeoutPromise])
      return { confirmed: true, response }
    }

    const response = await responsePromise
    return { confirmed: response !== 'cancel' && response !== 'no', response }
  }

  /**
   * Execute a data transform step
   */
  private executeDataTransform(step: WorkflowStep, state: ExecutionState): unknown {
    const operations = step.config.transformOperations || []

    // Get input from previous step's context
    const input = state.context

    let result = { ...input }

    for (const op of operations) {
      switch (op.type) {
        case 'pick':
          const fields = op.config.fields as string[]
          result = Object.fromEntries(
            Object.entries(result).filter(([k]) => fields.includes(k))
          )
          break

        case 'omit':
          const omitFields = op.config.fields as string[]
          result = Object.fromEntries(
            Object.entries(result).filter(([k]) => !omitFields.includes(k))
          )
          break

        case 'merge':
          result = { ...result, ...(op.config.data as object) }
          break

        case 'default':
          const defaults = op.config as Record<string, unknown>
          result = { ...defaults, ...result }
          break
      }
    }

    return result
  }

  /**
   * Execute a notification step
   */
  private async executeNotification(step: WorkflowStep, state: ExecutionState): Promise<unknown> {
    const channels = step.config.channels || ['app']
    const type = step.config.notificationType || 'info'

    // For now, emit as an event - actual notification would go through push notification system
    this.emitEvent({
      type: 'step_completed',
      workflowId: '',
      executionId: state.executionId,
      stepId: step.id,
      data: {
        notification: {
          type,
          channels,
          message: step.description,
        },
      },
      timestamp: new Date().toISOString(),
    })

    return { notified: true, channels }
  }

  /**
   * Emit a workflow event
   */
  private emitEvent(event: WorkflowEvent): void {
    if (this.onEventCallback) {
      this.onEventCallback(event)
    }
  }

  // ========================================
  // Convenience Methods
  // ========================================

  /**
   * Get user context summary
   */
  getContextSummary(): string {
    return this.contextManager.getContextSummary()
  }

  /**
   * Get available integrations
   */
  getAvailableIntegrations(): ServiceIntegration[] {
    return this.serviceManager.getAllIntegrations()
  }

  /**
   * Check if ready to execute a category
   */
  isReadyForCategory(category: string): {
    ready: boolean
    missingIntegrations: string[]
    missingContext: string[]
  } {
    const integrations = this.serviceManager.getIntegrationsByCategory(category as never)
    const connectedIntegrations = integrations.filter(i => i.connected)

    const context = this.contextManager.getContext()

    return {
      ready: connectedIntegrations.length > 0,
      missingIntegrations: integrations.filter(i => !i.connected).map(i => i.name),
      missingContext: context?.addresses.length === 0 ? ['delivery address'] : [],
    }
  }
}

// ========================================
// Exports
// ========================================

// Export main engine singleton
export const nexusWorkflowEngine = new NexusWorkflowEngine()

// Export classes for direct use
export { IntentParser, WorkflowGenerator, ServiceIntegrationManager, ContextManager }

// Export instances
export { intentParser, workflowGenerator, serviceIntegrations, contextManager }

// Export simple task manager (NEW)
export { SimpleTaskManager, simpleTaskManager } from './simple-task-manager'

// Export orchestrator for React integration
export {
  WorkflowOrchestrator,
  workflowOrchestrator,
  type OrchestratorEvent,
  type OrchestratorEventType,
  type OrchestratorSession,
  type OrchestratorConfig,
  type OrchestratorSubscriber,
  type SimpleTask,
  type SimpleTaskParseResult,
  type SimpleTaskExecutionResult,
  type SimpleTaskConfirmation,
  // Composio execution types
  type ComposioExecutionResult,
  type ComposioStepConfig,
  type ConnectionCheckResult,
  // NL Workflow types
  type GeneratedWorkflowJSON,
  type WorkflowAction,
  type WorkflowTrigger,
} from './orchestrator'

// Export Composio Executor for direct use
export {
  ComposioExecutor,
  composioExecutor,
} from './composio-executor'

// Export Auto-OAuth for seamless authentication
export {
  autoOAuthManager,
  getAutoOAuthSuggestions,
  processOnboardingAutoOAuth,
  handleAutoOAuthCallback,
  clearAutoOAuthCache,
  type AutoOAuthConfig,
  type ServiceMatch,
  type AutoOAuthResult,
  type ConnectionStatus as AutoOAuthConnectionStatus,
} from './auto-oauth'

// Export Exception Queue for human-in-the-loop decisions
export {
  ExceptionQueueManager,
  exceptionQueue,
  type ExceptionQueueItem,
  type ExceptionType,
  type ExceptionUrgency,
  type ExceptionStatus,
  type ExceptionDecision,
  type CreateExceptionParams,
} from './exception-queue'

// Export Error Recovery System for resilience
export {
  // Error classification
  classifyError,
  createWorkflowError,
  getRecoveryAction,
  calculateBackoffDelay,
  executeWithRetry,
  sleep,
  // Circuit breaker
  CircuitBreaker,
  getCircuitBreaker,
  resetAllCircuitBreakers,
  // Checkpoint manager
  CheckpointManager,
  checkpointManager,
  // Error event logger
  ErrorEventLogger,
  errorEventLogger,
  // Default configs
  DEFAULT_RETRY_CONFIG,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  // Types
  type ErrorClassification,
  type ErrorCategory,
  type WorkflowError,
  type RecoveryAction,
  type FallbackAction,
  type RetryConfig,
  type CircuitBreakerConfig,
  type CircuitBreakerState,
  type WorkflowCheckpoint,
  type ErrorEvent,
} from './error-recovery'

// Re-export types
export type {
  ParsedIntent,
  GeneratedWorkflow,
  ExecutionState,
  WorkflowStep,
  UserContext,
  ServiceIntegration,
  WorkflowEvent,
  UserActionRequest,
}

// Re-export simple task types (NEW)
export type {
  SimpleTaskType,
  SimpleTaskStatus,
  FoodOrderTask,
  RideRequestTask,
  QuickMessageTask,
  ReminderTask,
  CalendarEventTask,
  NoteCreationTask,
  EmailQuickSendTask,
  PaymentRequestTask,
  QuickSearchTask,
  TranslationTask,
  SimpleTaskTemplate,
} from '../../types/simple-task'

// Export voice workflow executor
export {
  parseIntent as parseVoiceIntent,
  executeWorkflow as executeVoiceWorkflow,
  executeVoiceCommand,
  type WorkflowIntent,
  type WorkflowExecutionResult,
} from './workflow-executor'

// Export Tool Selector for optimal Composio tool selection
export {
  ToolSelector,
  toolSelector,
  type ToolSelectionRequest,
  type SelectedTool,
  type ToolInputSchema,
  type ToolInputProperty,
  type InputMapping,
  type ToolSelectionResult,
  type ExecutionPlan,
  type ExecutionStage,
} from './tool-selector'

// Export Workflow Intelligence for smart analysis and optimal tool recommendations
// CEO DIRECTIVE: "Nexus should intuitively provide intelligent solutions"
export {
  WorkflowIntelligence,
  analyzeUserRequest,
  getIntelligenceSummary,
  type ImplicitRequirement,
  type ClarifyingQuestion,
  type QuestionOption,
  type ToolRecommendation,
  type AlternativeTool,
  type RegionalContext,
  type IntelligenceAnalysis,
  type WorkflowChainStep,
} from './workflow-intelligence'

// Export Finance Domain Intelligence for comprehensive finance workflow automation
// Includes Kuwait VAT 5% compliance and regional considerations
export {
  FinanceDomainIntelligence,
  FINANCE_WORKFLOW_PATTERNS,
  FINANCE_KEYWORDS,
  FINANCE_IMPLICIT_REQUIREMENTS,
  FINANCE_TOOL_RECOMMENDATIONS,
  FINANCE_REGIONAL_CONTEXT,
  createFinanceIntelligence,
  detectFinanceWorkflow,
  calculateKuwaitEndOfService,
  calculateKuwaitVAT,
  type FinanceWorkflowPattern,
  type FinanceRegionalContext,
  type EndOfServiceCalculation,
} from './domains/finance-intelligence'

// Export HR Domain Intelligence for comprehensive HR workflow automation
// Includes Kuwait Labor Law compliance and regional considerations
export {
  HRDomainIntelligence,
  HR_WORKFLOW_PATTERNS,
  HR_KEYWORDS,
  HR_IMPLICIT_REQUIREMENTS,
  HR_TOOL_RECOMMENDATIONS,
  HR_REGIONAL_CONTEXT,
  detectHRPattern,
  getHRImplicitRequirements,
  getHRToolRecommendations,
  getHRClarifyingQuestions,
  analyzeHRRequest,
  calculateKuwaitEOSI,
  type HRWorkflowPattern,
  type HRWorkflowStage,
  type HRRegionalRequirement,
  type HRToolRecommendation,
} from './domains/hr-intelligence'

// Export Sales Domain Intelligence for comprehensive sales workflow automation
// Includes CRM patterns, lead management, and Kuwait/GCC regional considerations
export {
  SalesDomainIntelligence,
  SALES_WORKFLOW_PATTERNS,
  SALES_KEYWORDS,
  SALES_IMPLICIT_REQUIREMENTS,
  SALES_TOOL_RECOMMENDATIONS,
  SALES_REGIONAL_CONTEXT,
  createSalesIntelligence,
  detectSalesWorkflow,
  analyzeSalesRequest,
  calculateCommission,
  calculateLeadScore,
  getSalesMetrics,
  getAllSalesPatterns,
  getSalesPatternByName,
  type SalesWorkflowPattern,
  type SalesRegionalContext,
  type CommissionCalculation,
  type LeadScore,
  type LeadScoreFactor,
  type SalesAnalysisResult,
} from './domains/sales-intelligence'

// Export Marketing Domain Intelligence for comprehensive marketing workflow automation
// Includes content calendars, social media, and Kuwait/GCC regional posting times
export {
  MarketingDomainIntelligence,
  MARKETING_WORKFLOW_PATTERNS,
  MARKETING_KEYWORDS,
  MARKETING_IMPLICIT_REQUIREMENTS,
  MARKETING_TOOL_RECOMMENDATIONS,
  MARKETING_REGIONAL_CONTEXT,
  createMarketingIntelligence,
  detectMarketingWorkflow,
  analyzeMarketingRequest,
  calculateCampaignROI,
  calculateCampaignPerformance,
  getOptimalPostingTime,
  calculateEngagementRate,
  type MarketingWorkflowPattern,
  type MarketingRegionalContext,
  type ROICalculation,
  type CampaignPerformance,
  type ContentCalendarEntry,
  type MarketingAnalysisResult,
} from './domains/marketing-intelligence'

// Export Operations Domain Intelligence for comprehensive operations workflow automation
// Includes inventory, procurement, logistics, and Kuwait/GCC supply chain context
export {
  OperationsDomainIntelligence,
  OPERATIONS_WORKFLOW_PATTERNS,
  OPERATIONS_KEYWORDS,
  OPERATIONS_IMPLICIT_REQUIREMENTS,
  OPERATIONS_TOOL_RECOMMENDATIONS,
  OPERATIONS_REGIONAL_CONTEXT,
  createOperationsIntelligence,
  detectOperationsWorkflow,
  analyzeOperationsRequest,
  calculateReorderPoint,
  calculateInventoryTurnover,
  calculateSupplierScorecard,
  calculateMaintenanceSchedule,
  getOperationsSummary,
  type OperationsWorkflowPattern,
  type OperationsRegionalContext,
  type ReorderCalculation,
  type InventoryTurnoverAnalysis,
  type SupplierScorecard,
  type MaintenanceSchedule,
  type OperationsAnalysisResult,
} from './domains/operations-intelligence'

// Export Legal Domain Intelligence for comprehensive legal workflow automation
// Includes contracts, compliance, IP, and Kuwait legal system context
export {
  LegalDomainIntelligence,
  LEGAL_WORKFLOW_PATTERNS,
  LEGAL_KEYWORDS,
  LEGAL_IMPLICIT_REQUIREMENTS,
  LEGAL_TOOL_RECOMMENDATIONS,
  LEGAL_REGIONAL_CONTEXT,
  createLegalIntelligence,
  detectLegalWorkflow,
  analyzeLegalRequest,
  getContractExpiryAlert,
  calculateStatuteOfLimitations,
  getLegalComplianceRequirements,
  getCourtSystemInfo,
  type LegalWorkflowPattern,
  type LegalRegionalContext,
  type ContractExpiryAlert,
  type StatuteOfLimitationsResult,
  type LegalAnalysisResult,
  type LegalRiskAssessment,
  type RiskFactor,
} from './domains/legal-intelligence'

// Export Customer Service Domain Intelligence for comprehensive support workflow automation
// Includes ticket management, SLA tracking, NPS/CSAT, and Kuwait/GCC WhatsApp-first support
export {
  CustomerServiceDomainIntelligence,
  CUSTOMER_SERVICE_WORKFLOW_PATTERNS,
  CUSTOMER_SERVICE_KEYWORDS,
  CUSTOMER_SERVICE_IMPLICIT_REQUIREMENTS,
  CUSTOMER_SERVICE_TOOL_RECOMMENDATIONS,
  CUSTOMER_SERVICE_REGIONAL_CONTEXT,
  DEFAULT_SLA_CONFIGURATIONS,
  TICKET_PRIORITIES,
  ESCALATION_PATHS,
  createCustomerServiceIntelligence,
  detectCustomerServiceWorkflow,
  analyzeCustomerServiceRequest,
  calculateNPS,
  calculateCSAT,
  calculateSLADeadline,
  determinePriority,
  type CustomerServiceWorkflowPattern,
  type CustomerServiceRegionalContext,
  type SLAConfiguration,
  type NPSResult,
  type CSATResult,
  type CustomerServiceAnalysisResult,
  type TicketPriority,
  type EscalationPath,
} from './domains/customer-service-intelligence'

// Export Project Management Domain Intelligence for comprehensive project workflow automation
// Includes sprint planning, milestone tracking, retrospectives, and multi-methodology support
export {
  ProjectManagementDomainIntelligence,
  PROJECT_MANAGEMENT_WORKFLOW_PATTERNS,
  PROJECT_MANAGEMENT_KEYWORDS,
  PROJECT_MANAGEMENT_IMPLICIT_REQUIREMENTS,
  PROJECT_MANAGEMENT_TOOL_RECOMMENDATIONS,
  PROJECT_MANAGEMENT_REGIONAL_CONTEXT,
  createProjectManagementIntelligence,
  detectProjectManagementWorkflow,
  analyzeProjectManagementRequest,
  calculateSprintMetrics,
  generateProjectHealthScore,
  type ProjectManagementWorkflowPattern,
  type ProjectManagementRegionalContext,
  type BurndownData,
  type VelocityData,
  type ProjectCompletionEstimate,
  type ProjectManagementAnalysisResult,
} from './domains/project-management-intelligence'

// Export Regional Context Modules
// GCC: Kuwait, UAE, Saudi Arabia, Qatar, Bahrain, Oman
// MENA: Egypt, Jordan, Lebanon, Morocco, Tunisia, Algeria, Iraq
// Global: US, UK, EU, APAC
export {
  // GCC Functions
  getGCCContext,
  getGCCWorkWeek,
  getGCCBusinessHours,
  getGCCVATRate,
  getGCCHolidays,
  isGCCBusinessDay,
  getNextGCCBusinessDay,
  convertGCCCurrency,
  getGCCTimezoneOffset,
  formatGCCDate,
  getGCCPhonePrefix,
  getAllGCCCountries,
  GCC_COUNTRY_CODES,
  // MENA Functions
  getMENAContext,
  // Global Functions
  getGlobalContext,
  getDataProtectionRequirements,
  getComplianceFrameworks,
  isBusinessDay,
  getRegionalPaymentMethods,
  getRegionalCommunicationPreferences,
  detectRegion,
  getRegionalCompliance,
  formatInternationalDate,
  getRegionalCurrency,
  createRegionalIntelligence,
  getBusinessHours,
  // Country Contexts
  EGYPT_CONTEXT,
  JORDAN_CONTEXT,
  LEBANON_CONTEXT,
  MOROCCO_CONTEXT,
  TUNISIA_CONTEXT,
  ALGERIA_CONTEXT,
  IRAQ_CONTEXT,
  UNITED_STATES_CONTEXT,
  UNITED_KINGDOM_CONTEXT,
  EUROPEAN_UNION_CONTEXT,
  ASIA_PACIFIC_CONTEXT,
  // Types
  type GCCCountryContext,
  type GCCCountryCode,
  type RegionalContext as GlobalRegionalContext,
  type CurrencyInfo,
  type ComplianceRequirements,
  type RegionalIntelligence,
} from './regional'

// Export Learning Engine for pattern recognition, confidence scoring, and continuous improvement
// Provides workflow execution analysis, cross-domain learning, and optimization suggestions
export {
  // Learning Engine
  LearningEngine,
  createLearningEngine,
  createWorkflowExecution,
  createUserFeedback as createLearningUserFeedback,
  createUserCorrection as createLearningUserCorrection,
  createRequestContext,
  DEFAULT_CONFIDENCE_CONFIG,
  DEFAULT_LEARNING_CONFIG,
  DOMAIN_DEFINITIONS,
  // Feedback System
  FeedbackSystem,
  createFeedbackSystem,
  feedbackSystem,
  isWorkDay,
  // Types - Learning Engine
  type WorkflowExecution,
  type ExecutionErrorCategory,
  type ExecutedStep,
  type UsedTool,
  type ExecutionContext,
  type ExecutionMetrics,
  type PatternMatch,
  type PatternVariation,
  type VariationType,
  type OptimizationSuggestion,
  type OptimizationType,
  type OptimizationEvidence,
  type PatternSignature,
  type ConfidenceRecord,
  type ConfidenceTrigger,
  type ExpertiseScore,
  type ExpertiseLevel,
  type TransferResult,
  type TransferAdaptation,
  type CrossDomainMatch,
  type UnifiedInsight,
  type InsightType,
  type InsightEvidence,
  type LearningUserFeedback,
  type FeedbackIssue,
  type LearningUserCorrection,
  type CorrectionType,
  type RequestContext,
  type UserPreferences,
  type RequestConstraints,
  type LearningState,
  type LearningStatistics,
  type LearnedRecommendation,
  type RecommendationType,
  type AlternativeApproach,
  type EnhancedPattern,
  type PatternEnhancement,
  type LearningMetrics,
  // Types - Feedback System
  type TimeFrame,
  type WorkWeekType,
  type FeedbackChannel,
  type MetricType,
  type ExperimentStatus,
  type AlertSeverity,
  type SessionStatus,
  type OptimizationActionType,
  type TrackingContext,
  type StepResult,
  type WorkflowOutcome,
  type CompletionRecord,
  type TrackingSession,
  type CompletionMetrics,
  type TimeMetrics,
  type StepMetrics,
  type ErrorMetrics,
  type SatisfactionMetrics,
  type DomainMetrics,
  type FeedbackUserFeedback,
  type FeedbackUserCorrection,
  type FeedbackSummary,
  type ImprovementSuggestion,
  type ImprovementAnalysis,
  type ABTestSuggestion,
  type ImprovementReport,
  type ImprovementRecommendation,
  type Experiment,
  type ExperimentResults,
  type OptimizationResult,
  type AlertThreshold,
  type Anomaly,
  type Alert,
  type FeedbackSystemConfig,
  type MetricsOptions,
  type ComprehensiveMetrics,
} from './learning'

// Export Predictive Intelligence for "before you ask" anticipation
// Layer 5 of the Intelligence Architecture - Calendar, Pattern, and Context predictions
export {
  // Main class
  PredictiveEngine,

  // Factory function and singleton
  createPredictiveEngine,
  predictiveEngine,

  // Quick helper functions
  analyzeCalendarQuick,
  getCurrentPredictions,
  isSpecialPeriod,
  getMeetingPrepChecklist,

  // Configurations
  DEFAULT_PREDICTIVE_CONFIG,
  DEFAULT_EVENT_TYPE_CONFIGS,

  // Regional patterns
  KUWAIT_REGIONAL_PATTERNS,
  UAE_REGIONAL_PATTERNS,
  SAUDI_REGIONAL_PATTERNS,
  GCC_REGIONAL_PATTERNS,

  // Meeting data
  MEETING_TYPE_KEYWORDS,
  MEETING_PREP_NEEDS,

  // Types - Calendar
  type CalendarEvent,
  type CalendarEventType,
  type RecurrencePattern,
  type CalendarAttendee,
  type CalendarPrediction,
  type PredictedNeed,
  type PredictedNeedType,
  type SuggestedWorkflow,
  type SuggestedWorkflowStep,

  // Types - Pattern
  type TimePattern,
  type PatternPrediction,
  type PredictionFeedback,
  type ActivePrediction,
  type PredictionAction,

  // Types - Accuracy
  type PredictionAccuracy,
  type TypeAccuracy,
  type PatternAccuracyMetrics,

  // Types - Regional
  type RegionalTimePattern,
  type RegionalPatternConfig,
  type WorkWeekConfig,
  type HolidayAwarenessConfig,
  type BusinessHoursConfig,
  type SpecialPeriodConfig,

  // Types - Configuration
  type PredictiveConfig,
  type EventTypeConfig,
} from './predictive'

// Export Context-Based Predictions for business event-driven workflow triggers
// Completes the Predictive Intelligence layer with context-aware automation
export {
  // Main class
  ContextMonitor,

  // Factory function and singleton
  createContextMonitor,
  contextMonitor,

  // Helper functions
  getAllPredefinedTriggers,
  getPredefinedTriggersForDomain,
  getPredefinedTriggerById,
  getChainSuggestions,
  getNextTriggersInChain,
  isGCCBusinessHours,
  isPreWeekendGCC,
  adjustPriorityForGCCTiming,
  getPreferredNotificationChannel,

  // Configurations
  DEFAULT_CONTEXT_MONITOR_CONFIG,
  PREDEFINED_TRIGGERS,
  PREDICTION_CHAINS,

  // Domain-specific triggers
  HR_TRIGGERS,
  SALES_TRIGGERS,
  FINANCE_TRIGGERS,
  OPERATIONS_TRIGGERS,
  LEGAL_TRIGGERS,
  MARKETING_TRIGGERS,
  CUSTOMER_SERVICE_TRIGGERS,
  PROJECT_MANAGEMENT_TRIGGERS,

  // Types - Trigger
  type TriggerType,
  type PredictionPriority,
  type ConditionOperator,
  type TriggerCondition,
  type ContextTrigger,
  type TriggerMetrics,
  type TriggerResult,
  type ActivatedTrigger,

  // Types - Workflow
  type WorkflowSuggestion,

  // Types - Context
  type BusinessContext,
  type ContextChange,
  type ContextPrediction,
  type Watch,
  type ContextMonitorConfig,

  // Types - Prediction Chains
  type PredictionChain,
} from './predictive/context-predictions'

// ============================================================================
// WEBHOOKS - 24/7 Event Infrastructure (Loop 18)
// ============================================================================

// Export Webhook Receiver for receiving events from external systems
// Supports 20+ systems: CRM (Salesforce, HubSpot, Pipedrive), HRMS (BambooHR, Workday),
// Finance (Xero, QuickBooks), and more
export {
  // Main class
  WebhookReceiver,
  createWebhookReceiver,
  webhookReceiver,

  // Quick functions
  processWebhookQuick,
  enableWebhookSource,
  getSupportedSources,
  getSourceDisplayName,

  // Configuration
  DEFAULT_SOURCE_CONFIGS,
  DEFAULT_RECEIVER_CONFIG,

  // Types
  type WebhookSource,
  type WebhookEventCategory,
  type CRMEventType,
  type HREventType,
  type FinanceEventType,
  type WebhookEventType,
  type WebhookPayload,
  type IncomingWebhook,
  type ProcessedWebhookEvent,
  type WebhookSourceConfig,
  type WebhookReceiverConfig,
  type WebhookValidationResult,
} from './webhooks'

// Export Event Queue for priority-based event processing with retry logic
export {
  // Main class
  EventQueue,
  createEventQueue,
  eventQueue,

  // Quick functions
  enqueueEvent,
  getQueueStats,
  startEventQueue,
  stopEventQueue,

  // Configuration
  DEFAULT_QUEUE_CONFIG,

  // Types
  type QueueEventStatus,
  type QueuedEvent,
  type EventQueueConfig,
  type QueueStats,
  type EventProcessor,
} from './webhooks'

// Export Webhook Processor for automatic trigger matching and workflow execution
export {
  // Main class
  WebhookProcessor,
  createWebhookProcessor,
  webhookProcessor,

  // Quick start functions
  startWebhookProcessing,
  stopWebhookProcessing,
  processWebhookEvent,
  testWebhookEvent,

  // Configuration
  DEFAULT_PROCESSOR_CONFIG,

  // Types
  type WorkflowExecutionRequest as WebhookExecutionRequest,
  type WebhookWorkflowResult,
  type EventProcessingResult,
  type WorkflowExecutor,
  type WebhookProcessorConfig,
} from './webhooks'

// ============================================================================
// E-COMMERCE INTEGRATIONS (Loop 19)
// ============================================================================

// Export Shopify Integration for e-commerce workflow automation
// Includes REST API client, webhooks, templates, and workflow actions
export {
  // Factory & Registration
  createShopifyIntegration,
  registerShopifyWithEngine,

  // Client
  ShopifyClient,
  createShopifyClient,

  // Webhooks
  ShopifyWebhookHandler,
  createShopifyWebhookHandler,
  initializeShopifyWebhooks,
  verifyShopifyWebhookHmac,
  getSupportedShopifyTopics,

  // Actions
  ShopifyActionExecutor,
  shopifyActionExecutor,
  SHOPIFY_ACTION_DEFINITIONS,
  SHOPIFY_ACTION_REGISTRY,
  validateShopifyAction,
  getActionsByCategory,

  // Templates
  getShopifyTemplates,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates,

  // Error Classes
  ShopifyError,
  ShopifyAuthError,
  ShopifyRateLimitError,
  ShopifyNotFoundError,
  ShopifyValidationError,

  // Types - Config
  type ShopifyConfig,
  type CreateShopifyIntegrationConfig,

  // Types - Models
  type ShopifyProduct,
  type ShopifyVariant,
  type ShopifyOrder,
  type ShopifyCustomer,
  type ShopifyInventoryLevel,
  type ShopifyFulfillment,
  type ShopifyLocation,
  type ShopifyAddress,
  type ShopifyLineItem,
  type ShopifyRefund,

  // Types - Webhooks
  type ShopifyWebhookTopic,
  type ShopifyWebhookHeaders,
  type ShopifyWebhookRequest,
  type ShopifyWebhookValidationResult,
  type NormalizedShopifyEvent,
  type ShopifyEventCategory,

  // Types - Templates
  type ShopifyTemplate,
  type ShopifyTemplateCategory,
  type ShopifyTemplateDifficulty,
  type ShopifyTemplateStep,

  // Types - Actions
  type ShopifyActionType,
  type ShopifyExecutionResult,
  type ShopifyExecutionContext,
  type ActionDefinition,

  // Types - Integration
  type ShopifyIntegration,
} from './integrations/shopify'

// Export Integration Registry for managing all external integrations
export {
  // Registry functions
  getAllIntegrations,
  getIntegrationsByCategory,
  getIntegrationsByStatus,
  getActiveIntegrations,
  getIntegration,
  isIntegrationAvailable,

  // Registry data
  INTEGRATION_REGISTRY,

  // Manager class and singleton
  IntegrationManager,
  integrationManager,

  // Quick setup helpers
  setupShopifyIntegration,

  // Types
  type IntegrationCategory,
  type IntegrationStatus,
  type IntegrationMeta,
  type IntegrationInstanceConfig,
} from './integrations'

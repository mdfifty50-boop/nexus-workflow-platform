/**
 * Workflow Orchestrator - Coordination Layer for UI Integration
 *
 * This orchestrator connects all workflow-engine components and provides:
 * - React-friendly event system for real-time UI updates
 * - Unified execution pipeline from NL input to completion
 * - State management for multi-step workflows
 * - Support for complex use cases (food ordering, PDF analysis, travel)
 *
 * @example
 * ```typescript
 * const orchestrator = new WorkflowOrchestrator()
 *
 * // Subscribe to events
 * orchestrator.subscribe((event) => {
 *   console.log('Event:', event.type, event.data)
 * })
 *
 * // Execute natural language command
 * const result = await orchestrator.executeCommand(
 *   "Order healthy meal to my home",
 *   { userId: 'user_123' }
 * )
 * ```
 */

import { EventEmitter } from 'events'
import { intentParser, IntentParser } from './intent-parser'
import { workflowGenerator, WorkflowGenerator } from './workflow-generator'
import { serviceIntegrations, ServiceIntegrationManager } from './service-integrations'
import { contextManager, ContextManager } from './context-manager'
import { simpleTaskManager, SimpleTaskManager } from './simple-task-manager'
import { composioExecutor, ComposioExecutor } from './composio-executor'
import {
  exceptionQueue,
  ExceptionQueueManager,
  type ExceptionQueueItem,
  type ExceptionType,
} from './exception-queue'
import {
  checkpointManager,
  errorEventLogger,
  createWorkflowError,
  getRecoveryAction,
  getCircuitBreaker,
  type WorkflowCheckpoint,
  type WorkflowError,
  type RecoveryAction,
} from './error-recovery'
import {
  orchestratorLogger,
  createWorkflowLogger,
  createStepLogger,
  metricsCollector,
  executionLogManager,
} from '../monitoring'
import type {
  ParsedIntent,
  GeneratedWorkflow,
  ExecutionState,
  WorkflowStep,
  WorkflowEvent,
  UserActionRequest,
  UserContext,
  ServiceIntegration,
} from '../../types/workflow-execution'
import type {
  SimpleTask,
  SimpleTaskParseResult,
  SimpleTaskExecutionResult,
  SimpleTaskConfirmation,
} from '../../types/simple-task'

// ========================================
// Orchestrator Types
// ========================================

/** Event types emitted by the orchestrator */
export type OrchestratorEventType =
  | 'intent_parsed'
  | 'workflow_generated'
  | 'execution_started'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'user_action_required'
  | 'execution_paused'
  | 'execution_resumed'
  | 'execution_completed'
  | 'execution_failed'
  | 'context_updated'
  | 'clarification_needed'
  | 'progress_update'
  | 'simple_task_detected'
  | 'simple_task_confirmation_required'
  | 'simple_task_executing'
  | 'simple_task_completed'
  | 'simple_task_failed'
  | 'exception_created'       // Human review required
  | 'exception_resolved'      // Human made a decision
  | 'exception_waiting'       // Workflow paused waiting for human
  | 'recovery_started'        // Error recovery initiated
  | 'recovery_retry'          // Retry attempt started
  | 'recovery_success'        // Recovery succeeded
  | 'recovery_failed'         // Recovery failed after all attempts
  | 'checkpoint_created'      // Checkpoint saved for resume
  | 'checkpoint_restored'     // Execution resumed from checkpoint
  | 'circuit_breaker_open'    // Service circuit breaker opened
  | 'circuit_breaker_closed'  // Service circuit breaker closed

/** Orchestrator event payload */
export interface OrchestratorEvent {
  type: OrchestratorEventType
  timestamp: string
  sessionId: string
  data: unknown
  metadata?: {
    stepId?: string
    progress?: number
    tokensUsed?: number
    costUsd?: number
    duration?: number
  }
}

/** Session state for tracking active executions */
export interface OrchestratorSession {
  id: string
  userId?: string
  input: string
  intent: ParsedIntent | null
  workflow: GeneratedWorkflow | null
  execution: ExecutionState | null
  status: 'initializing' | 'parsing' | 'clarifying' | 'generating' | 'ready' | 'executing' | 'paused' | 'completed' | 'failed'
  pendingAction: UserActionRequest | null
  messages: string[]
  createdAt: string
  updatedAt: string
  // Simple task support
  isSimpleTask?: boolean
  simpleTask?: SimpleTask
  simpleTaskConfirmation?: SimpleTaskConfirmation
  simpleTaskResult?: SimpleTaskExecutionResult
  // Error recovery support
  checkpointId?: string
  lastError?: WorkflowError
  recoveryAttempts?: number
  canResume?: boolean
}

/** Configuration options for orchestrator */
export interface OrchestratorConfig {
  maxClarificationQuestions?: number
  autoExecute?: boolean
  simplifyWorkflows?: boolean
  enableContextExtraction?: boolean
  defaultTimeout?: number
  retryOnFailure?: boolean
  maxRetries?: number
  enableSimpleTasks?: boolean // NEW: Enable simple task detection
  preferSimpleTasks?: boolean // NEW: Prefer simple tasks over workflows when possible
  // Error recovery options
  enableCheckpoints?: boolean       // Enable checkpoint/resume capability
  enableCircuitBreaker?: boolean    // Enable circuit breaker for services
  circuitBreakerThreshold?: number  // Failures before opening circuit
  circuitBreakerResetMs?: number    // Time before half-open
}

/** Subscriber callback type */
export type OrchestratorSubscriber = (event: OrchestratorEvent) => void

// ========================================
// Default Configuration
// ========================================

const DEFAULT_CONFIG: Required<OrchestratorConfig> = {
  maxClarificationQuestions: 3,
  autoExecute: false,
  simplifyWorkflows: false,
  enableContextExtraction: true,
  defaultTimeout: 60000,
  retryOnFailure: true,
  maxRetries: 3,
  enableSimpleTasks: true, // Enable simple task detection by default
  preferSimpleTasks: true, // Prefer simple tasks for faster execution
  // Error recovery defaults
  enableCheckpoints: true,        // Enable checkpoint/resume by default
  enableCircuitBreaker: true,     // Enable circuit breaker by default
  circuitBreakerThreshold: 5,     // 5 failures before opening
  circuitBreakerResetMs: 60000,   // 1 minute before half-open
}

// ========================================
// Workflow Orchestrator Class
// ========================================

/**
 * WorkflowOrchestrator - Central coordinator for workflow execution
 *
 * Provides a clean API for:
 * - Natural language command processing
 * - Real-time event streaming to React components
 * - User interaction handling
 * - Multi-step workflow orchestration
 */
export class WorkflowOrchestrator {
  private intentParser: IntentParser
  private workflowGenerator: WorkflowGenerator
  private serviceManager: ServiceIntegrationManager
  private contextManager: ContextManager
  private simpleTaskManager: SimpleTaskManager // NEW
  private composioExecutor: ComposioExecutor // Composio tool executor
  private exceptionQueueManager: ExceptionQueueManager // Human-in-the-loop exceptions
  private config: Required<OrchestratorConfig>

  // Event management
  private emitter: EventEmitter
  private subscribers: Set<OrchestratorSubscriber>

  // Session management
  private sessions: Map<string, OrchestratorSession>
  private activeSessionId: string | null

  // User action handler
  private userActionHandler: ((request: UserActionRequest) => Promise<string>) | null

  constructor(config: OrchestratorConfig = {}) {
    this.intentParser = intentParser
    this.workflowGenerator = workflowGenerator
    this.serviceManager = serviceIntegrations
    this.contextManager = contextManager
    this.simpleTaskManager = simpleTaskManager // NEW
    this.composioExecutor = composioExecutor // Composio tool executor
    this.exceptionQueueManager = exceptionQueue // Human-in-the-loop exceptions
    this.config = { ...DEFAULT_CONFIG, ...config }

    this.emitter = new EventEmitter()
    this.subscribers = new Set()
    this.sessions = new Map()
    this.activeSessionId = null
    this.userActionHandler = null

    // Set high listener limit for React components
    this.emitter.setMaxListeners(100)

    orchestratorLogger.info('Orchestrator initialized', { config: this.config })
  }

  // ========================================
  // Event Subscription
  // ========================================

  /**
   * Subscribe to orchestrator events
   * Returns unsubscribe function for cleanup
   */
  subscribe(callback: OrchestratorSubscriber): () => void {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Emit an event to all subscribers
   */
  private emit(type: OrchestratorEventType, data: unknown, metadata?: OrchestratorEvent['metadata']): void {
    const event: OrchestratorEvent = {
      type,
      timestamp: new Date().toISOString(),
      sessionId: this.activeSessionId || '',
      data,
      metadata,
    }

    // Emit to EventEmitter (for internal use)
    this.emitter.emit(type, event)

    // Notify all subscribers (for React hooks)
    this.subscribers.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('[Orchestrator] Subscriber error:', error)
      }
    })
  }

  /**
   * Register handler for user action requests
   */
  onUserAction(handler: (request: UserActionRequest) => Promise<string>): void {
    this.userActionHandler = handler
  }

  // ========================================
  // Session Management
  // ========================================

  /**
   * Create a new orchestration session
   */
  private createSession(input: string, userId?: string): OrchestratorSession {
    const sessionId = `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    const session: OrchestratorSession = {
      id: sessionId,
      userId,
      input,
      intent: null,
      workflow: null,
      execution: null,
      status: 'initializing',
      pendingAction: null,
      messages: [],
      createdAt: now,
      updatedAt: now,
    }

    this.sessions.set(sessionId, session)
    this.activeSessionId = sessionId

    return session
  }

  /**
   * Update session state
   */
  private updateSession(sessionId: string, updates: Partial<OrchestratorSession>): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      Object.assign(session, updates, { updatedAt: new Date().toISOString() })
    }
  }

  /**
   * Get current session
   */
  getSession(sessionId?: string): OrchestratorSession | null {
    const id = sessionId || this.activeSessionId
    return id ? this.sessions.get(id) || null : null
  }

  /**
   * Get all sessions
   */
  getAllSessions(): OrchestratorSession[] {
    return Array.from(this.sessions.values())
  }

  // ========================================
  // Main Execution Pipeline
  // ========================================

  /**
   * Execute a natural language command through the full pipeline
   *
   * This is the main entry point for processing user requests.
   *
   * @param input - Natural language command
   * @param options - Execution options
   * @returns Session with execution results
   */
  async executeCommand(
    input: string,
    options: {
      userId?: string
      autoExecute?: boolean
      skipClarification?: boolean
      forceWorkflow?: boolean // NEW: Force full workflow even if simple task detected
    } = {}
  ): Promise<OrchestratorSession> {
    const { userId, autoExecute = this.config.autoExecute, skipClarification = false, forceWorkflow = false } = options

    // Create session
    const session = this.createSession(input, userId)
    session.messages.push(`Received command: "${input}"`)

    // Create session-scoped logger
    const logger = orchestratorLogger.forUser(userId || 'anonymous').child({ sessionId: session.id })
    logger.info('Workflow started', { input: input.substring(0, 100), autoExecute, forceWorkflow })

    // Start workflow metrics tracking
    metricsCollector.startWorkflow(session.id)

    try {
      // Step 1: Initialize user context
      if (userId) {
        await this.contextManager.initialize(userId)
        session.messages.push('User context loaded')
        this.emit('context_updated', { userId, context: this.contextManager.getContext() })
        logger.debug('User context loaded', { userId })
      }

      // Step 1.5: Check for simple task (NEW FAST PATH)
      if (this.config.enableSimpleTasks && !forceWorkflow) {
        session.status = 'parsing'
        this.updateSession(session.id, { status: 'parsing' })

        const simpleTaskResult = await this.simpleTaskManager.detectSimpleTask(input)

        if (simpleTaskResult.isSimpleTask && simpleTaskResult.task && simpleTaskResult.confidence > 0.7) {
          session.messages.push(`Simple task detected: ${simpleTaskResult.taskType} (confidence: ${simpleTaskResult.confidence.toFixed(2)})`)
          session.isSimpleTask = true
          session.simpleTask = simpleTaskResult.task
          logger.info('Simple task detected', {
            taskType: simpleTaskResult.taskType,
            confidence: simpleTaskResult.confidence
          })

          // Store task in manager
          this.simpleTaskManager.storeTask(simpleTaskResult.task)

          // Generate confirmation
          const confirmation = this.simpleTaskManager.generateConfirmation(simpleTaskResult.task)
          session.simpleTaskConfirmation = confirmation

          this.emit('simple_task_detected', { task: simpleTaskResult.task, confirmation })
          this.emit('simple_task_confirmation_required', { session, confirmation })

          // Mark as ready (awaiting user confirmation)
          session.status = 'ready'
          session.messages.push('Simple task ready for user confirmation')
          this.updateSession(session.id, session)

          return session
        } else if (simpleTaskResult.isSimpleTask && simpleTaskResult.confidence > 0.5) {
          session.messages.push(`Possible simple task detected but low confidence (${simpleTaskResult.confidence.toFixed(2)}), falling back to workflow`)
        } else {
          session.messages.push('Not a simple task, proceeding with full workflow generation')
        }
      }

      // Step 2: Parse intent from natural language (ORIGINAL PATH)
      session.status = 'parsing'
      this.updateSession(session.id, { status: 'parsing' })

      let intent = await this.intentParser.parse(input, {
        useAI: true,
        includeContext: true,
        userId,
      })

      session.intent = intent
      session.messages.push(`Intent parsed: ${intent.category}/${intent.action} (confidence: ${intent.confidence.toFixed(2)})`)
      this.emit('intent_parsed', intent)
      logger.info('Intent parsed', {
        category: intent.category,
        action: intent.action,
        confidence: intent.confidence,
        entityCount: intent.entities.length
      })

      // Step 3: Handle clarification questions if needed
      if (!skipClarification && !intent.canExecute && intent.missingInfo.length > 0) {
        session.status = 'clarifying'
        this.updateSession(session.id, { status: 'clarifying' })

        let questionCount = 0
        while (!intent.canExecute && questionCount < this.config.maxClarificationQuestions) {
          const clarification = await this.intentParser.askClarification(intent)

          const request: UserActionRequest = {
            id: `clarify_${session.id}_${questionCount}`,
            type: clarification.options ? 'selection' : 'input',
            title: 'Need More Information',
            message: clarification.question,
            options: clarification.options?.map(o => ({ id: o, label: o })),
          }

          session.pendingAction = request
          this.emit('clarification_needed', request)
          this.emit('user_action_required', request)

          // Wait for user response
          if (this.userActionHandler) {
            const response = await this.userActionHandler(request)
            intent = this.intentParser.updateWithAnswer(intent, clarification.field, response)
            session.intent = intent
            session.messages.push(`Clarification: ${clarification.field} = "${response}"`)
          } else {
            // No handler - stop asking questions
            break
          }

          questionCount++
        }

        session.pendingAction = null
      }

      // Step 4: Generate workflow from intent
      session.status = 'generating'
      this.updateSession(session.id, { status: 'generating' })

      const workflow = await this.workflowGenerator.generate(intent, {
        userId,
        useAIGeneration: true,
        simplify: this.config.simplifyWorkflows,
      })

      session.workflow = workflow
      session.messages.push(`Workflow generated: "${workflow.name}" with ${workflow.steps.length} steps`)
      this.emit('workflow_generated', workflow)
      logger.info('Workflow generated', {
        workflowId: workflow.id,
        workflowName: workflow.name,
        stepCount: workflow.steps.length,
        status: workflow.status
      })

      // Check workflow readiness
      const missingIntegrations = workflow.requiredIntegrations.filter(i => !i.connected)
      const missingContext = workflow.requiredContext.filter(c => c.required && !c.available)

      if (missingIntegrations.length > 0) {
        session.messages.push(`Note: Missing integrations - ${missingIntegrations.map(i => i.service).join(', ')}`)
      }

      if (missingContext.length > 0) {
        session.messages.push(`Note: Missing context - ${missingContext.map(c => c.key).join(', ')}`)
      }

      // Step 5: Execute workflow if auto-execute and ready
      if (autoExecute && workflow.status === 'ready') {
        session.status = 'executing'
        this.updateSession(session.id, { status: 'executing' })

        const execution = await this.executeWorkflow(workflow, session.id)
        session.execution = execution

        session.status = execution.status === 'completed' ? 'completed' : 'failed'
        session.messages.push(`Execution ${session.status}: ${execution.status}`)
      } else {
        session.status = 'ready'
        session.messages.push('Workflow ready for execution')
      }

      this.updateSession(session.id, session)
      return session

    } catch (error) {
      session.status = 'failed'
      session.messages.push(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      this.updateSession(session.id, session)
      this.emit('execution_failed', { error, session })

      // Log error and end workflow metrics
      logger.error('Workflow failed', error, { sessionId: session.id })
      metricsCollector.endWorkflow(session.id, false, error instanceof Error ? error.message : 'Unknown error')

      // Record error in execution log
      executionLogManager.logWorkflowExecution({
        userId: userId || 'anonymous',
        workflowId: session.workflow?.id || session.id,
        executionId: session.id,
        status: 'failed',
        input: input.substring(0, 500),
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - new Date(session.createdAt).getTime()
      })

      throw error
    }
  }

  /**
   * Execute a generated workflow
   */
  async executeWorkflow(workflow: GeneratedWorkflow, sessionId?: string): Promise<ExecutionState> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    // Session ID for potential future use
    void (sessionId || this.activeSessionId || '')

    // Create workflow-scoped logger
    const logger = createWorkflowLogger(workflow.id, executionId)
    logger.info('Workflow started', { workflowName: workflow.name, stepCount: workflow.steps.length })

    // Start metrics tracking for this workflow
    metricsCollector.startWorkflow(executionId)

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

    this.emit('execution_started', { executionId, workflow })

    // Find and execute start step
    const startStep = workflow.steps.find(s => s.id === workflow.startStepId) || workflow.steps[0]

    if (!startStep) {
      state.status = 'failed'
      state.errors.push({
        stepId: '',
        code: 'NO_START_STEP',
        message: 'Workflow has no executable steps',
        recoverable: false,
        timestamp: new Date().toISOString(),
      })
      this.emit('execution_failed', { state, error: 'No start step' })
      return state
    }

    state.status = 'running'
    state.currentStepId = startStep.id

    try {
      await this.executeStepChain(startStep, workflow, state)
      state.status = 'completed'
      state.completedAt = new Date().toISOString()

      // Log workflow completion and end metrics
      metricsCollector.endWorkflow(executionId, true)
      logger.info('Workflow completed', {
        completedSteps: state.completedSteps.length,
        totalSteps: workflow.steps.length,
        tokensUsed: state.tokensUsed,
        costUsd: state.costUsd
      })

      // Record successful execution in log
      executionLogManager.logWorkflowExecution({
        userId: 'system', // TODO: get from session
        workflowId: workflow.id,
        executionId,
        status: 'completed',
        input: workflow.name,
        output: state.context,
        durationMs: Date.now() - new Date(state.startedAt).getTime()
      })

      this.emit('execution_completed', { state, finalResult: state.context })
    } catch (error) {
      state.status = 'failed'
      state.completedAt = new Date().toISOString()
      const errorMessage = error instanceof Error ? error.message : String(error)

      // Log workflow failure and end metrics
      metricsCollector.endWorkflow(executionId, false, errorMessage)
      logger.error('Workflow execution failed', error, {
        completedSteps: state.completedSteps.length,
        totalSteps: workflow.steps.length,
        currentStepId: state.currentStepId
      })

      // Record failed execution in log
      executionLogManager.logWorkflowExecution({
        userId: 'system', // TODO: get from session
        workflowId: workflow.id,
        executionId,
        status: 'failed',
        input: workflow.name,
        error: errorMessage,
        durationMs: Date.now() - new Date(state.startedAt).getTime()
      })

      state.errors.push({
        stepId: state.currentStepId || '',
        code: 'EXECUTION_ERROR',
        message: errorMessage,
        recoverable: false,
        timestamp: new Date().toISOString(),
      })
      this.emit('execution_failed', { state, error })
    }

    state.updatedAt = new Date().toISOString()
    return state
  }

  /**
   * Execute a step and its dependent chain
   */
  private async executeStepChain(
    step: WorkflowStep,
    workflow: GeneratedWorkflow,
    state: ExecutionState
  ): Promise<void> {
    const stepStart = Date.now()
    state.currentStepId = step.id

    // Create step-scoped logger
    const stepLogger = createStepLogger(step.id, workflow.id, state.executionId)

    // Start step metrics tracking
    metricsCollector.startStep(state.executionId, step.id, step.type)
    stepLogger.info('Step started', { stepName: step.name, stepType: step.type })

    // Initialize step result
    state.stepResults[step.id] = {
      stepId: step.id,
      status: 'running',
      startedAt: new Date().toISOString(),
    }

    this.emit('step_started', { step, state }, {
      stepId: step.id,
      progress: this.calculateProgress(state, workflow),
    })

    try {
      // Execute step based on type
      const output = await this.executeStepByType(step, state, workflow.id)

      // Update step result
      state.stepResults[step.id] = {
        ...state.stepResults[step.id],
        status: 'completed',
        output,
        completedAt: new Date().toISOString(),
      }

      state.completedSteps.push(step.id)
      state.context[step.id] = output

      // Log step completion
      const stepDuration = Date.now() - stepStart
      metricsCollector.endStep(state.executionId, step.id, true)
      stepLogger.timing('Step completed', stepDuration, {
        stepName: step.name,
        progress: this.calculateProgress(state, workflow)
      })

      this.emit('step_completed', { step, output, state }, {
        stepId: step.id,
        progress: this.calculateProgress(state, workflow),
        duration: stepDuration,
        tokensUsed: state.tokensUsed,
        costUsd: state.costUsd,
      })

      // Execute dependent steps
      const nextSteps = workflow.steps.filter(s =>
        s.dependsOn.includes(step.id) &&
        s.dependsOn.every(dep => state.completedSteps.includes(dep))
      )

      for (const nextStep of nextSteps) {
        await this.executeStepChain(nextStep, workflow, state)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      // Log step failure
      metricsCollector.endStep(state.executionId, step.id, false, errorMessage)
      stepLogger.error('Step failed', error, {
        stepName: step.name,
        stepType: step.type,
        durationMs: Date.now() - stepStart
      })

      state.stepResults[step.id] = {
        ...state.stepResults[step.id],
        status: 'failed',
        error: errorMessage,
        completedAt: new Date().toISOString(),
      }

      this.emit('step_failed', { step, error, state }, {
        stepId: step.id,
        progress: this.calculateProgress(state, workflow),
      })

      throw error
    }
  }

  /**
   * Execute a step based on its type
   */
  private async executeStepByType(step: WorkflowStep, state: ExecutionState, workflowId: string): Promise<unknown> {
    switch (step.type) {
      case 'ai_reasoning':
        return this.executeAIStep(step, state)

      case 'api_call':
        return this.executeAPIStep(step, state)

      case 'user_confirmation':
        return this.executeUserConfirmation(step, workflowId)

      case 'data_transform':
        return this.executeDataTransform(step, state)

      case 'notification':
        return this.executeNotification(step)

      default:
        return { skipped: true, reason: `Unknown step type: ${step.type}` }
    }
  }

  /**
   * Execute AI reasoning step
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
      model: (step.config.model as 'claude-3-5-haiku-20241022' | 'claude-sonnet-4-20250514' | 'claude-opus-4-5-20251101') || 'claude-sonnet-4-20250514',
      maxTokens: 2000,
    })

    if (!response.success) {
      throw new Error(response.error || 'AI request failed')
    }

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
   * Execute API call step
   *
   * Priority:
   * 1. If step has a Composio tool slug, use ComposioExecutor
   * 2. Otherwise fall back to legacy ServiceIntegrationManager
   */
  private async executeAPIStep(step: WorkflowStep, state: ExecutionState): Promise<unknown> {
    // Check for Composio tool configuration
    const composioTool = step.config.composioTool || step.config.tool
    const toolkit = step.config.toolkit

    // If we have a Composio tool slug, use the ComposioExecutor
    if (composioTool && typeof composioTool === 'string' && composioTool.includes('_')) {
      console.log(`[Orchestrator] Executing Composio tool: ${composioTool}`)

      const result = await this.composioExecutor.executeStep(step, state)

      if (!result.success) {
        // Check if this is a connection error
        if (result.errorCode === 'NOT_CONNECTED' || result.errorCode === 'AUTH_REQUIRED') {
          throw new Error(
            `${result.connectionRequired || toolkit || 'Service'} is not connected. ` +
            `${result.suggestedAction || 'Please connect your account first.'}` +
            (result.authUrl ? ` Auth URL: ${result.authUrl}` : '')
          )
        }

        // Check if retryable
        if (result.isRetryable) {
          throw new Error(`${result.error} (retryable)`)
        }

        throw new Error(result.error || 'Composio tool execution failed')
      }

      return result.data
    }

    // Fallback to legacy service integration
    const service = step.config.service
    const endpoint = step.config.endpoint

    if (!service || !endpoint) {
      throw new Error('API step missing service or endpoint configuration')
    }

    console.log(`[Orchestrator] Using legacy service integration: ${service}/${endpoint}`)

    const result = await this.serviceManager.executeAction(
      service,
      endpoint.split('/').pop() || 'execute',
      step.config.payload || {}
    )

    if (!result.success) {
      throw new Error(result.error || 'API call failed')
    }

    return result.data
  }

  /**
   * Execute user confirmation step
   */
  private async executeUserConfirmation(step: WorkflowStep, _workflowId: string): Promise<{ confirmed: boolean; response?: string }> {
    if (!this.userActionHandler) {
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

    this.emit('user_action_required', request, { stepId: step.id })

    const response = await this.userActionHandler(request)
    return { confirmed: response !== 'cancel' && response !== 'no', response }
  }

  /**
   * Execute data transform step
   */
  private executeDataTransform(step: WorkflowStep, state: ExecutionState): unknown {
    const operations = step.config.transformOperations || []
    let result = { ...state.context }

    for (const op of operations) {
      switch (op.type) {
        case 'pick': {
          const fields = op.config.fields as string[]
          result = Object.fromEntries(
            Object.entries(result).filter(([k]) => fields.includes(k))
          )
          break
        }
        case 'omit': {
          const omitFields = op.config.fields as string[]
          result = Object.fromEntries(
            Object.entries(result).filter(([k]) => !omitFields.includes(k))
          )
          break
        }
        case 'merge':
          result = { ...result, ...(op.config.data as object) }
          break
        case 'default': {
          const defaults = op.config as Record<string, unknown>
          result = { ...defaults, ...result }
          break
        }
      }
    }

    return result
  }

  /**
   * Execute notification step
   */
  private async executeNotification(step: WorkflowStep): Promise<{ notified: boolean; channels: string[] }> {
    const channels = step.config.channels || ['app']

    this.emit('progress_update', {
      type: step.config.notificationType || 'info',
      message: step.description,
      channels,
    }, { stepId: step.id })

    return { notified: true, channels }
  }

  /**
   * Calculate execution progress percentage
   */
  private calculateProgress(state: ExecutionState, workflow: GeneratedWorkflow): number {
    const totalSteps = workflow.steps.length
    const completedSteps = state.completedSteps.length
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
  }

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Get available service integrations
   */
  getAvailableIntegrations(): ServiceIntegration[] {
    return this.serviceManager.getAllIntegrations()
  }

  /**
   * Get user context summary
   */
  getContextSummary(): string {
    return this.contextManager.getContextSummary()
  }

  /**
   * Get user context
   */
  getUserContext(): UserContext | null {
    return this.contextManager.getContext()
  }

  /**
   * Check readiness for a specific category
   */
  checkReadiness(category: string): {
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

  /**
   * Pause current execution
   */
  pauseExecution(sessionId?: string): void {
    const session = this.getSession(sessionId)
    if (session && session.execution && session.execution.status === 'running') {
      session.execution.status = 'paused'
      session.status = 'paused'
      this.updateSession(session.id, session)
      this.emit('execution_paused', { session })
    }
  }

  /**
   * Resume paused execution
   */
  resumeExecution(sessionId?: string): void {
    const session = this.getSession(sessionId)
    if (session && session.status === 'paused') {
      session.status = 'executing'
      this.updateSession(session.id, session)
      this.emit('execution_resumed', { session })
    }
  }

  /**
   * Cancel execution
   */
  cancelExecution(sessionId?: string): void {
    const session = this.getSession(sessionId)
    if (session) {
      session.status = 'failed'
      if (session.execution) {
        session.execution.status = 'cancelled'
      }
      session.messages.push('Execution cancelled by user')
      this.updateSession(session.id, session)
      this.emit('execution_failed', { session, error: 'Cancelled by user' })
    }
  }

  /**
   * Reset orchestrator state
   */
  reset(): void {
    this.sessions.clear()
    this.activeSessionId = null
  }

  /**
   * Update configuration
   */
  configure(config: Partial<OrchestratorConfig>): void {
    Object.assign(this.config, config)
  }

  /**
   * Get configuration
   */
  getConfig(): Required<OrchestratorConfig> {
    return { ...this.config }
  }

  // ========================================
  // Simple Task Methods (NEW)
  // ========================================

  /**
   * Confirm and execute a simple task
   *
   * @param sessionId - Session ID containing the simple task
   * @returns Execution result
   */
  async confirmSimpleTask(sessionId: string): Promise<SimpleTaskExecutionResult> {
    const session = this.getSession(sessionId)

    if (!session || !session.isSimpleTask || !session.simpleTask) {
      throw new Error('Session does not contain a simple task')
    }

    const task = session.simpleTask

    // Update session status
    session.status = 'executing'
    this.updateSession(sessionId, session)
    this.emit('simple_task_executing', { task })

    try {
      // Execute the task
      const result = await this.simpleTaskManager.executeTask(task.id)

      // Store result in session
      session.simpleTaskResult = result
      session.status = result.success ? 'completed' : 'failed'
      session.messages.push(result.userMessage)
      this.updateSession(sessionId, session)

      // Emit appropriate event
      if (result.success) {
        this.emit('simple_task_completed', { task, result })
      } else {
        this.emit('simple_task_failed', { task, result, error: result.error })
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      session.status = 'failed'
      session.messages.push(`Simple task execution failed: ${errorMessage}`)
      this.updateSession(sessionId, session)

      const failedResult: SimpleTaskExecutionResult = {
        success: false,
        taskId: task.id,
        status: 'failed',
        error: errorMessage,
        userMessage: `Failed to execute task: ${errorMessage}`,
        executionTimeMs: 0,
      }

      this.emit('simple_task_failed', { task, result: failedResult, error: errorMessage })

      return failedResult
    }
  }

  /**
   * Cancel a simple task
   *
   * @param sessionId - Session ID containing the simple task
   */
  cancelSimpleTask(sessionId: string): boolean {
    const session = this.getSession(sessionId)

    if (!session || !session.isSimpleTask || !session.simpleTask) {
      return false
    }

    const cancelled = this.simpleTaskManager.cancelTask(session.simpleTask.id)

    if (cancelled) {
      session.status = 'failed'
      session.messages.push('Simple task cancelled by user')
      this.updateSession(sessionId, session)
      this.emit('execution_failed', { session, error: 'Cancelled by user' })
    }

    return cancelled
  }

  /**
   * Get simple task manager instance (for direct access if needed)
   */
  getSimpleTaskManager(): SimpleTaskManager {
    return this.simpleTaskManager
  }

  /**
   * Get Composio executor instance (for direct access if needed)
   */
  getComposioExecutor(): ComposioExecutor {
    return this.composioExecutor
  }

  // ========================================
  // NL Workflow Execution (Composio)
  // ========================================

  /**
   * Execute a workflow generated by NLWorkflowEngine
   *
   * This is the primary method for executing natural language workflows
   * that have been parsed into Composio tool calls.
   *
   * @param workflow - Workflow JSON from NLWorkflowEngine.parse()
   * @param options - Execution options
   * @returns Execution result with all action outcomes
   */
  async executeNLWorkflow(
    workflow: import('../../services/NLWorkflowEngine').GeneratedWorkflowJSON,
    options?: {
      userId?: string
      sessionId?: string
    }
  ): Promise<{
    success: boolean
    results: Array<{ actionId: string; result: import('./composio-executor').ComposioExecutionResult }>
    context: Record<string, unknown>
    totalExecutionTimeMs: number
    messages: string[]
  }> {
    const messages: string[] = []
    // Session ID for tracking (reserved for future use)
    // const sessionId = options?.sessionId || `nlwf_${Date.now()}`

    messages.push(`Starting workflow: ${workflow.name}`)
    this.emit('execution_started', { workflowId: workflow.id, workflow })

    // Check connections first
    const connectionCheck = await this.composioExecutor.checkConnections(workflow)
    if (!connectionCheck.connected) {
      messages.push(`Missing connections: ${connectionCheck.missingConnections.join(', ')}`)
      this.emit('execution_failed', {
        workflowId: workflow.id,
        error: `Missing connections: ${connectionCheck.missingConnections.join(', ')}`,
        authUrls: connectionCheck.authUrls,
      })

      return {
        success: false,
        results: [],
        context: {
          missingConnections: connectionCheck.missingConnections,
          authUrls: connectionCheck.authUrls,
        },
        totalExecutionTimeMs: 0,
        messages,
      }
    }

    // Execute workflow
    const result = await this.composioExecutor.executeWorkflow(workflow, {
      userId: options?.userId,
      onActionStart: (action) => {
        messages.push(`Starting action: ${action.name}`)
        this.emit('step_started', {
          stepId: action.id,
          step: action,
          workflow,
        }, {
          stepId: action.id,
        })
      },
      onActionComplete: (action, actionResult) => {
        messages.push(`Completed: ${action.name} (${actionResult.executionTimeMs}ms)`)
        this.emit('step_completed', {
          stepId: action.id,
          step: action,
          output: actionResult.data,
        }, {
          stepId: action.id,
          duration: actionResult.executionTimeMs,
        })
      },
      onError: (action, actionResult) => {
        messages.push(`Failed: ${action.name} - ${actionResult.error}`)
        this.emit('step_failed', {
          stepId: action.id,
          step: action,
          error: actionResult.error,
        }, {
          stepId: action.id,
        })
      },
    })

    if (result.success) {
      messages.push(`Workflow completed successfully in ${result.totalExecutionTimeMs}ms`)
      this.emit('execution_completed', {
        workflowId: workflow.id,
        results: result.results,
        context: result.context,
        totalExecutionTimeMs: result.totalExecutionTimeMs,
      })
    } else {
      messages.push(`Workflow failed`)
      this.emit('execution_failed', {
        workflowId: workflow.id,
        results: result.results,
        context: result.context,
      })
    }

    return {
      ...result,
      messages,
    }
  }

  /**
   * Check if required connections are available for a workflow
   */
  async checkWorkflowConnections(
    workflow: import('../../services/NLWorkflowEngine').GeneratedWorkflowJSON
  ): Promise<{
    ready: boolean
    missingConnections: string[]
    authUrls: Record<string, string>
  }> {
    const result = await this.composioExecutor.checkConnections(workflow)
    return {
      ready: result.connected,
      missingConnections: result.missingConnections,
      authUrls: result.authUrls,
    }
  }

  /**
   * Initiate OAuth connection for a toolkit
   */
  async initiateToolkitConnection(toolkit: string): Promise<{
    authUrl?: string
    error?: string
  }> {
    return this.composioExecutor.initiateConnection(toolkit)
  }

  /**
   * Clear connection cache (useful after OAuth callback)
   */
  clearConnectionCache(): void {
    this.composioExecutor.clearConnectionCache()
  }

  /**
   * Check if running in demo mode (no API keys configured)
   */
  get isComposioDemoMode(): boolean {
    return this.composioExecutor.isDemoMode
  }

  // ========================================
  // Exception Queue Methods (Human-in-the-Loop)
  // ========================================

  /**
   * Get the exception queue manager instance
   * Use this for direct access to exception queue operations
   */
  getExceptionQueueManager(): ExceptionQueueManager {
    return this.exceptionQueueManager
  }

  /**
   * Get all pending exceptions for a user
   */
  async getPendingExceptions(userId: string): Promise<ExceptionQueueItem[]> {
    return this.exceptionQueueManager.getPendingExceptions(userId)
  }

  /**
   * Create an exception for human review
   * This is called when the workflow encounters a situation that needs human decision
   */
  async createException(params: {
    userId: string
    projectId?: string
    workflowId?: string
    executionId?: string
    stepId?: string
    exceptionType: ExceptionType
    urgency?: 'immediate' | 'today' | 'flexible'
    title: string
    titleAr?: string
    description: string
    descriptionAr?: string
    context?: Record<string, unknown>
    proposedAction?: {
      type: string
      payload: unknown
      estimatedImpact: string
      reversible: boolean
    }
    expiresAt?: Date
    tags?: string[]
  }): Promise<ExceptionQueueItem> {
    const exception = await this.exceptionQueueManager.createException({
      ...params,
      expiresAt: params.expiresAt?.toISOString(),
    })

    // Emit event for UI updates
    this.emit('exception_created', {
      exception,
      userId: params.userId,
      workflowId: params.workflowId,
      executionId: params.executionId,
    })

    return exception
  }

  /**
   * Create an exception for uncertain AI decision (confidence < 70%)
   */
  async createUncertainDecisionException(params: {
    userId: string
    workflowId?: string
    executionId?: string
    stepId?: string
    workflowName: string
    stepName: string
    aiConfidence: number
    aiReasoning: string
    alternatives: Array<{ id: string; label: string; description?: string }>
    proposedAction: { type: string; payload: unknown; estimatedImpact: string; reversible: boolean }
    urgency?: 'immediate' | 'today' | 'flexible'
  }): Promise<ExceptionQueueItem> {
    const exception = await this.exceptionQueueManager.createUncertainDecisionException(params)

    this.emit('exception_created', {
      exception,
      type: 'uncertain_decision',
      confidence: params.aiConfidence,
    })

    return exception
  }

  /**
   * Create an exception for high-value action (> $100 or bulk operation)
   */
  async createHighValueException(params: {
    userId: string
    workflowId?: string
    executionId?: string
    stepId?: string
    workflowName: string
    stepName: string
    actionType: string
    estimatedValue: number
    currency?: string
    affectedRecords?: number
    proposedAction: { type: string; payload: unknown; estimatedImpact: string; reversible: boolean }
    urgency?: 'immediate' | 'today' | 'flexible'
  }): Promise<ExceptionQueueItem> {
    const exception = await this.exceptionQueueManager.createHighValueException(params)

    this.emit('exception_created', {
      exception,
      type: 'high_value_action',
      value: params.estimatedValue,
      currency: params.currency,
    })

    return exception
  }

  /**
   * Create an exception for missing information
   */
  async createMissingInfoException(params: {
    userId: string
    workflowId?: string
    executionId?: string
    stepId?: string
    workflowName: string
    stepName: string
    requiredFields: Array<{ name: string; type: string; required: boolean; description?: string }>
    originalInput: unknown
    urgency?: 'immediate' | 'today' | 'flexible'
  }): Promise<ExceptionQueueItem> {
    const exception = await this.exceptionQueueManager.createMissingInfoException(params)

    this.emit('exception_created', {
      exception,
      type: 'missing_information',
      requiredFields: params.requiredFields,
    })

    return exception
  }

  /**
   * Create an exception for service error
   */
  async createServiceErrorException(params: {
    userId: string
    workflowId?: string
    executionId?: string
    stepId?: string
    workflowName: string
    stepName: string
    service: string
    errorCode: string
    errorMessage: string
    retryable: boolean
    alternatives?: Array<{ id: string; label: string; description?: string }>
    urgency?: 'immediate' | 'today' | 'flexible'
  }): Promise<ExceptionQueueItem> {
    const exception = await this.exceptionQueueManager.createServiceErrorException(params)

    this.emit('exception_created', {
      exception,
      type: 'service_error',
      service: params.service,
      errorCode: params.errorCode,
    })

    return exception
  }

  /**
   * Approve an exception and resume workflow
   */
  async approveException(
    exceptionId: string,
    decidedBy: string,
    reason?: string
  ): Promise<ExceptionQueueItem | null> {
    const exception = await this.exceptionQueueManager.approveException(exceptionId, decidedBy, reason)

    if (exception) {
      this.emit('exception_resolved', {
        exception,
        action: 'approved',
        decidedBy,
      })
    }

    return exception
  }

  /**
   * Reject an exception and cancel workflow step
   */
  async rejectException(
    exceptionId: string,
    decidedBy: string,
    reason: string
  ): Promise<ExceptionQueueItem | null> {
    const exception = await this.exceptionQueueManager.rejectException(exceptionId, decidedBy, reason)

    if (exception) {
      this.emit('exception_resolved', {
        exception,
        action: 'rejected',
        decidedBy,
        reason,
      })
    }

    return exception
  }

  /**
   * Modify an exception's proposed action and approve
   */
  async modifyException(
    exceptionId: string,
    decidedBy: string,
    modifiedPayload: unknown,
    reason?: string
  ): Promise<ExceptionQueueItem | null> {
    const exception = await this.exceptionQueueManager.modifyException(
      exceptionId,
      decidedBy,
      modifiedPayload,
      reason
    )

    if (exception) {
      this.emit('exception_resolved', {
        exception,
        action: 'modified',
        decidedBy,
        modifiedPayload,
      })
    }

    return exception
  }

  /**
   * Get exception statistics for a user
   */
  async getExceptionStats(userId: string): Promise<{
    totalPending: number
    immediateCount: number
    todayCount: number
    flexibleCount: number
    resolvedToday: number
    avgResolutionTimeHours: number | null
  }> {
    return this.exceptionQueueManager.getExceptionStats(userId)
  }

  /**
   * Subscribe to exception queue changes
   * Returns unsubscribe function
   */
  subscribeToExceptions(
    userId: string,
    callback: (exceptions: ExceptionQueueItem[]) => void
  ): () => void {
    return this.exceptionQueueManager.subscribe(userId, callback)
  }

  /**
   * Check if an action should create an exception based on thresholds
   * Returns true if exception should be created
   */
  shouldCreateException(params: {
    confidence?: number
    value?: number
    currency?: string
    affectedRecords?: number
    requiresApproval?: boolean
  }): { shouldCreate: boolean; type: ExceptionType | null; reason: string } {
    const { confidence, value, currency, affectedRecords, requiresApproval } = params

    // Check if explicit approval is required
    if (requiresApproval) {
      return {
        shouldCreate: true,
        type: 'approval_required',
        reason: 'This action requires explicit user approval',
      }
    }

    // Check for uncertain AI decision (confidence < 70%)
    if (confidence !== undefined && confidence < 0.7) {
      return {
        shouldCreate: true,
        type: 'uncertain_decision',
        reason: `AI confidence is ${Math.round(confidence * 100)}%, which is below the 70% threshold`,
      }
    }

    // Check for high-value action (> $100 equivalent)
    if (value !== undefined) {
      // Convert to USD equivalent for comparison
      const usdEquivalent = this.convertToUSD(value, currency || 'USD')
      if (usdEquivalent > 100) {
        return {
          shouldCreate: true,
          type: 'high_value_action',
          reason: `Action value ($${usdEquivalent.toFixed(2)} USD) exceeds $100 threshold`,
        }
      }
    }

    // Check for bulk operations (> 10 records)
    if (affectedRecords !== undefined && affectedRecords > 10) {
      return {
        shouldCreate: true,
        type: 'high_value_action',
        reason: `Bulk operation affecting ${affectedRecords} records exceeds threshold`,
      }
    }

    return {
      shouldCreate: false,
      type: null,
      reason: 'Action does not require exception',
    }
  }

  /**
   * Helper to convert currency to USD equivalent
   * Used for threshold checks on high-value actions
   */
  private convertToUSD(value: number, currency: string): number {
    // Approximate conversion rates (in real app, would use live rates)
    const rates: Record<string, number> = {
      USD: 1,
      EUR: 1.08,
      GBP: 1.26,
      KWD: 3.26, // Kuwaiti Dinar - highest valued currency
      AED: 0.27,
      SAR: 0.27,
      QAR: 0.27,
      BHD: 2.65,
      OMR: 2.60,
      JOD: 1.41,
      EGP: 0.032,
      JPY: 0.0067,
      CNY: 0.14,
      INR: 0.012,
    }

    const rate = rates[currency.toUpperCase()] || 1
    return value * rate
  }

  // ========================================
  // Error Recovery Methods
  // ========================================

  /**
   * Resume a failed workflow from its last checkpoint
   *
   * @param sessionId - Session ID of the failed workflow
   * @returns Execution result from resumed workflow
   */
  async resumeFromCheckpoint(sessionId: string): Promise<{
    success: boolean
    result?: ExecutionState
    error?: string
  }> {
    const session = this.getSession(sessionId)

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    if (!session.checkpointId) {
      return { success: false, error: 'No checkpoint available for this session' }
    }

    const checkpoint = checkpointManager.getCheckpoint(session.checkpointId)
    if (!checkpoint) {
      return { success: false, error: 'Checkpoint not found' }
    }

    // Emit recovery started event
    this.emit('checkpoint_restored', {
      sessionId,
      checkpointId: session.checkpointId,
      stepId: checkpoint.stepId,
      completedSteps: checkpoint.completedSteps,
    })

    try {
      // Get the workflow from session
      if (!session.workflow) {
        return { success: false, error: 'No workflow found in session' }
      }

      // Resume execution from checkpoint
      const result = await this.executeWorkflowFromCheckpoint(
        session.workflow,
        checkpoint,
        sessionId
      )

      // Update session
      session.status = result.status === 'completed' ? 'completed' : 'failed'
      session.execution = result
      session.canResume = false
      this.updateSession(sessionId, session)

      if (result.status === 'completed') {
        this.emit('recovery_success', {
          sessionId,
          checkpointId: session.checkpointId,
          result,
        })
      }

      return { success: result.status === 'completed', result }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      this.emit('recovery_failed', {
        sessionId,
        checkpointId: session.checkpointId,
        error: errorMessage,
      })

      return { success: false, error: errorMessage }
    }
  }

  /**
   * Execute workflow continuing from a checkpoint
   */
  private async executeWorkflowFromCheckpoint(
    workflow: GeneratedWorkflow,
    checkpoint: WorkflowCheckpoint,
    sessionId: string
  ): Promise<ExecutionState> {
    const logger = createWorkflowLogger(workflow.id, checkpoint.executionId)
    logger.info('Resuming workflow from checkpoint', {
      stepId: checkpoint.stepId,
      completedSteps: checkpoint.completedSteps.length,
    })

    // Restore execution state from checkpoint
    const state: ExecutionState = {
      executionId: checkpoint.executionId,
      workflowId: workflow.id,
      status: 'running',
      completedSteps: checkpoint.completedSteps,
      stepResults: checkpoint.stepResults as Record<string, { stepId: string; status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'; output?: unknown; error?: string; startedAt: string; completedAt?: string }>,
      context: checkpoint.context,
      startedAt: checkpoint.createdAt,
      updatedAt: new Date().toISOString(),
      tokensUsed: checkpoint.tokensUsed,
      costUsd: checkpoint.costUsd,
      errors: [],
      recoveryAttempts: 1,
    }

    // Find remaining steps to execute
    const remainingSteps = workflow.steps.filter(
      step => !checkpoint.completedSteps.includes(step.id)
    )

    if (remainingSteps.length === 0) {
      state.status = 'completed'
      state.completedAt = new Date().toISOString()
      return state
    }

    // Find the next step to execute
    const nextStep = remainingSteps.find(step => {
      // Step can execute if all its dependencies are completed
      return step.dependsOn.every(dep =>
        checkpoint.completedSteps.includes(dep)
      )
    })

    if (!nextStep) {
      state.status = 'failed'
      state.errors.push({
        stepId: '',
        code: 'NO_EXECUTABLE_STEP',
        message: 'No steps available to execute after checkpoint',
        recoverable: false,
        timestamp: new Date().toISOString(),
      })
      return state
    }

    // Continue execution from next step
    state.currentStepId = nextStep.id

    try {
      await this.executeStepChain(nextStep, workflow, state)
      state.status = 'completed'
      state.completedAt = new Date().toISOString()

      // Log successful recovery
      logger.info('Workflow resumed successfully', {
        completedSteps: state.completedSteps.length,
        totalSteps: workflow.steps.length,
      })
    } catch (error) {
      state.status = 'failed'
      state.completedAt = new Date().toISOString()
      const errorMessage = error instanceof Error ? error.message : String(error)

      // Create new checkpoint for potential future recovery
      const newCheckpoint = checkpointManager.createCheckpoint({
        workflowId: workflow.id,
        executionId: state.executionId,
        stepId: state.currentStepId || '',
        status: 'failed',
        context: state.context,
        completedSteps: state.completedSteps,
        failedSteps: [state.currentStepId || ''],
        stepResults: state.stepResults,
        tokensUsed: state.tokensUsed,
        costUsd: state.costUsd,
      })

      // Update session with new checkpoint
      const session = this.getSession(sessionId)
      if (session) {
        session.checkpointId = newCheckpoint.id
        session.canResume = true
        this.updateSession(sessionId, session)
      }

      logger.error('Workflow resume failed', error, {
        stepId: state.currentStepId,
        recoveryAttempts: state.recoveryAttempts,
      })

      state.errors.push({
        stepId: state.currentStepId || '',
        code: 'RECOVERY_FAILED',
        message: errorMessage,
        recoverable: state.recoveryAttempts < (this.config.maxRetries || 3),
        timestamp: new Date().toISOString(),
      })
    }

    return state
  }

  /**
   * Get checkpoint for a session
   */
  getCheckpointForSession(sessionId: string): WorkflowCheckpoint | undefined {
    const session = this.getSession(sessionId)
    if (!session?.checkpointId) {
      return undefined
    }
    const checkpoint = checkpointManager.getCheckpoint(session.checkpointId)
    return checkpoint || undefined
  }

  /**
   * Get all available checkpoints for resume
   */
  getResumableCheckpoints(workflowId?: string): WorkflowCheckpoint[] {
    const allCheckpoints = checkpointManager.getAllCheckpoints()

    if (workflowId) {
      return allCheckpoints.filter(cp => cp.workflowId === workflowId)
    }

    return allCheckpoints
  }

  /**
   * Get error recovery statistics
   */
  getErrorStats(windowMs: number = 3600000): {
    totalErrors: number
    byCategory: Record<string, number>
    byService: Record<string, number>
    recoveryRate: number
  } {
    const stats = errorEventLogger.getStats(windowMs)

    return {
      totalErrors: stats.totalErrors,
      byCategory: stats.byCategory,
      byService: stats.byService,
      recoveryRate: stats.recoveryRate,
    }
  }

  /**
   * Get circuit breaker status for a service
   */
  getCircuitBreakerStatus(service: string): {
    state: 'closed' | 'open' | 'half-open'
    failures: number
    lastFailure?: string
    willResetAt?: string
  } {
    const breaker = getCircuitBreaker(service)
    const cbState = breaker.getState()

    // Determine state based on isOpen and timing
    let state: 'closed' | 'open' | 'half-open' = 'closed'
    if (cbState.isOpen) {
      // Check if we're in half-open state (reset time has passed)
      const timeSinceLastFailure = Date.now() - cbState.lastFailureTime
      if (timeSinceLastFailure >= 60000) { // 1 minute default reset timeout
        state = 'half-open'
      } else {
        state = 'open'
      }
    }

    return {
      state,
      failures: cbState.failures,
      lastFailure: cbState.lastFailureTime > 0 ? new Date(cbState.lastFailureTime).toISOString() : undefined,
      willResetAt: cbState.isOpen ? new Date(cbState.lastFailureTime + 60000).toISOString() : undefined,
    }
  }

  /**
   * Reset circuit breaker for a service
   */
  resetCircuitBreaker(service: string): void {
    const breaker = getCircuitBreaker(service)
    breaker.reset()

    this.emit('circuit_breaker_closed', { service })
  }

  /**
   * Handle step failure with error recovery
   *
   * This method is called when a step fails and determines the recovery action
   */
  async handleStepFailure(
    step: WorkflowStep,
    error: Error,
    state: ExecutionState,
    workflow: GeneratedWorkflow
  ): Promise<{
    action: RecoveryAction
    shouldContinue: boolean
    modifiedState?: Partial<ExecutionState>
  }> {
    // Create workflow error from exception
    const workflowError = createWorkflowError(error, step.config.toolkit || step.config.service || 'unknown', {
      stepId: step.id,
      stepName: step.name,
      workflowId: workflow.id,
      executionId: state.executionId,
    })

    // Log error event
    const attempt = state.recoveryAttempts || 0
    errorEventLogger.log({
      error: workflowError,
      workflowId: workflow.id,
      executionId: state.executionId,
      stepId: step.id,
      userId: 'system',
      recoveryAction: 'retry',
      recoverySuccess: false,
      retryAttempt: attempt,
      totalRetries: this.config.maxRetries,
      durationMs: 0,
      metadata: workflowError.context,
    })

    // Get recovery action (pass attempt count)
    const recoveryAction = getRecoveryAction(workflowError, attempt)

    // Emit recovery event
    this.emit('recovery_started', {
      stepId: step.id,
      error: workflowError,
      action: recoveryAction,
    })

    // Create checkpoint before handling failure
    if (this.config.enableCheckpoints) {
      const checkpoint = checkpointManager.createCheckpoint({
        workflowId: workflow.id,
        executionId: state.executionId,
        stepId: step.id,
        status: 'failed',
        context: state.context,
        completedSteps: state.completedSteps,
        failedSteps: [step.id],
        stepResults: state.stepResults,
        tokensUsed: state.tokensUsed,
        costUsd: state.costUsd,
      })

      this.emit('checkpoint_created', {
        checkpointId: checkpoint.id,
        stepId: step.id,
        workflowId: workflow.id,
      })
    }

    // Handle based on recovery action type
    switch (recoveryAction.type) {
      case 'retry':
        // Will be handled by retry logic in composio-executor
        return {
          action: recoveryAction,
          shouldContinue: true,
        }

      case 'skip':
        // Skip the failed step and continue
        state.stepResults[step.id] = {
          stepId: step.id,
          status: 'skipped',
          error: workflowError.message,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        }
        return {
          action: recoveryAction,
          shouldContinue: true,
          modifiedState: { stepResults: state.stepResults },
        }

      case 'fallback':
        // Execute fallback action if available
        const fallbackResult = await this.executeFallbackAction(step, recoveryAction.fallbackAction, state)
        return {
          action: recoveryAction,
          shouldContinue: fallbackResult.success,
          modifiedState: fallbackResult.stateUpdate,
        }

      case 'queue':
        // Queue for human review
        await this.createServiceErrorException({
          userId: 'system', // TODO: Get from session
          workflowId: workflow.id,
          executionId: state.executionId,
          stepId: step.id,
          workflowName: workflow.name,
          stepName: step.name,
          service: step.config.toolkit || step.config.service || 'unknown',
          errorCode: workflowError.code,
          errorMessage: workflowError.message,
          retryable: workflowError.isRetryable,
          urgency: 'today',
        })
        return {
          action: recoveryAction,
          shouldContinue: false,
        }

      case 'abort':
      case 'notify':
      case 'refresh_auth':
      default:
        return {
          action: recoveryAction,
          shouldContinue: false,
        }
    }
  }

  /**
   * Execute fallback action for a failed step
   */
  private async executeFallbackAction(
    step: WorkflowStep,
    fallbackAction: import('./error-recovery').FallbackAction | undefined,
    state: ExecutionState
  ): Promise<{
    success: boolean
    stateUpdate?: Partial<ExecutionState>
  }> {
    if (!fallbackAction) {
      return { success: false }
    }

    try {
      switch (fallbackAction.type) {
        case 'cached_data':
          // Use cached data if available (using service as cache key hint)
          if (fallbackAction.service && state.context[fallbackAction.service]) {
            state.stepResults[step.id] = {
              stepId: step.id,
              status: 'completed',
              output: state.context[fallbackAction.service],
              startedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
            }
            return { success: true, stateUpdate: { stepResults: state.stepResults } }
          }
          break

        case 'default_value':
          // Use default value from fallback data
          if (fallbackAction.data !== undefined) {
            state.stepResults[step.id] = {
              stepId: step.id,
              status: 'completed',
              output: fallbackAction.data,
              startedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
            }
            state.context[step.id] = fallbackAction.data
            return {
              success: true,
              stateUpdate: {
                stepResults: state.stepResults,
                context: state.context,
              }
            }
          }
          break

        case 'skip_step':
          // Mark as skipped and continue
          state.stepResults[step.id] = {
            stepId: step.id,
            status: 'skipped',
            error: fallbackAction.message || 'Step skipped due to error',
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }
          return { success: true, stateUpdate: { stepResults: state.stepResults } }

        case 'alternative_service':
          // Would need to implement alternative service logic
          // For now, just mark as skipped
          state.stepResults[step.id] = {
            stepId: step.id,
            status: 'skipped',
            error: `Alternative service fallback not implemented: ${fallbackAction.message || 'No alternative available'}`,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }
          return { success: true, stateUpdate: { stepResults: state.stepResults } }

        case 'manual_review':
          // Queue for manual review
          return { success: false }
      }
    } catch (fallbackError) {
      console.error('[Orchestrator] Fallback execution failed:', fallbackError, {
        stepId: step.id,
        fallbackType: fallbackAction.type,
      })
    }

    return { success: false }
  }
}

// ========================================
// Singleton Export
// ========================================

/** Default orchestrator instance */
export const workflowOrchestrator = new WorkflowOrchestrator()

// Export types
export type {
  ParsedIntent,
  GeneratedWorkflow,
  ExecutionState,
  WorkflowEvent,
  UserActionRequest,
  SimpleTask,
  SimpleTaskParseResult,
  SimpleTaskExecutionResult,
  SimpleTaskConfirmation,
}

// Re-export Composio executor types
export type {
  ComposioExecutionResult,
  ComposioStepConfig,
  ConnectionCheckResult,
} from './composio-executor'

// Re-export NL Workflow types for convenience
export type {
  GeneratedWorkflowJSON,
  WorkflowAction,
  WorkflowTrigger,
} from '../../services/NLWorkflowEngine'

/**
 * AutonomousExecutionControllerService
 *
 * Orchestrates autonomous workflow execution after user approval.
 * Coordinates ToolResearchAgent and IntegrationEngineerAgent,
 * handles critical errors, integrates with self-healing,
 * and delivers results with completion notifications.
 *
 * Story 16.8 Implementation
 *
 * Key Features:
 * - FR-16.5.1: Autonomous execution without user intervention
 * - FR-16.5.2: Pause only for critical errors
 * - FR-16.5.4: Cancel execution at any point
 */

import type {
  ExecutionPhase,
  CriticalErrorType,
  NonCriticalErrorType,
  AutonomousExecutionConfig,
  AutonomousExecutionState,
  CriticalError,
  CriticalErrorAction,
  CriticalErrorDecision,
  NonCriticalError,
  HealingStrategy,
  HealingAttempt,
  PartialResult,
  ExecutionArtifact,
  ExecutionResult,
  ExecutionLogEntry,
  CompletionNotification,
  StartExecutionRequest,
  StartExecutionResult,
  CancelExecutionRequest,
  CancelExecutionResult,
  ResumeExecutionRequest,
  ResumeExecutionResult,
  ExecutionProgressUpdate,
  AgentTaskRequest,
  AgentTaskResult,
  AutonomousExecutionMetrics,
  AutonomousExecutionCallbacks
} from '../types/tools'

// Internal type extends the external type with additional fields
type LocalExecutionState = AutonomousExecutionState & {
  criticalErrors: CriticalError[]
  artifacts: ExecutionArtifact[]
  pausedForDecision?: CriticalError
  pendingDecision?: CriticalErrorDecision
}

import {
  DEFAULT_AUTONOMOUS_EXECUTION_CONFIG,
  AUTONOMOUS_EXECUTION_THRESHOLDS,
  AUTONOMOUS_EXECUTION_ERROR_MESSAGES
} from '../types/tools'
// Services imported but held for future integration
// import { integrationSelfHealingService } from './IntegrationSelfHealingService'
// import { toolChainOptimizerService } from './ToolChainOptimizerService'
import { mcpServerIntegrationService } from './MCPServerIntegrationService'
// dynamicIntegrationConnectorService - reserved for future integration
// import { dynamicIntegrationConnectorService } from './DynamicIntegrationConnectorService'

/**
 * Workflow definition for execution
 */
interface WorkflowDefinition {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  inputs: Record<string, unknown>
  expectedOutputs: string[]
}

/**
 * Single step in a workflow
 */
interface WorkflowStep {
  id: string
  name: string
  type: 'tool' | 'transform' | 'condition' | 'parallel'
  toolId?: string
  config: Record<string, unknown>
  inputs: Record<string, unknown>
  outputs: string[]
  dependencies: string[]
}

/**
 * Step execution result
 */
interface StepExecutionResult {
  stepId: string
  success: boolean
  outputs: Record<string, unknown>
  artifacts: ExecutionArtifact[]
  duration: number
  cost: number
  error?: {
    type: 'critical' | 'non_critical'
    errorType: CriticalErrorType | NonCriticalErrorType
    message: string
  }
}

/**
 * Autonomous Execution Controller Service
 *
 * Orchestrates complete workflow execution from approval to completion,
 * handling all errors, coordinating agents, and delivering results.
 */
class AutonomousExecutionControllerService {
  // Active executions (using local type with simplified HealingAttempt)
  private executions: Map<string, LocalExecutionState> = new Map()

  // Execution logs
  private logs: Map<string, ExecutionLogEntry[]> = new Map()

  // Workflow definitions (cached)
  private workflows: Map<string, WorkflowDefinition> = new Map()

  // Progress update timers
  private progressTimers: Map<string, NodeJS.Timeout> = new Map()

  // Cost check timers
  private costTimers: Map<string, NodeJS.Timeout> = new Map()

  // Global metrics
  private metrics: AutonomousExecutionMetrics = this.initializeMetrics()

  // Callbacks per execution
  private callbacks: Map<string, AutonomousExecutionCallbacks> = new Map()

  // Global callbacks for all executions
  private globalCallbacks: AutonomousExecutionCallbacks = {}

  /**
   * Initialize metrics to default values
   */
  private initializeMetrics(): AutonomousExecutionMetrics {
    return {
      totalExecutions: 0,
      runningExecutions: 0,
      completedExecutions: 0,
      failedExecutions: 0,
      cancelledExecutions: 0,
      successRate: 0,
      partialSuccessRate: 0,
      averageExecutionTime: 0,
      medianExecutionTime: 0,
      totalCost: 0,
      averageCost: 0,
      totalHealingAttempts: 0,
      healingSuccessRate: 0,
      criticalErrorCount: 0,
      nonCriticalErrorCount: 0,
      errorsByType: {},
      toolResearchAgentInvocations: 0,
      integrationEngineerAgentInvocations: 0
    }
  }

  /**
   * Register global callbacks for all executions
   */
  registerGlobalCallbacks(callbacks: AutonomousExecutionCallbacks): void {
    this.globalCallbacks = callbacks
  }

  /**
   * Register callbacks for a specific execution
   */
  registerCallbacks(executionId: string, callbacks: AutonomousExecutionCallbacks): void {
    this.callbacks.set(executionId, callbacks)
  }

  /**
   * Unregister callbacks for a specific execution
   */
  unregisterCallbacks(executionId: string): void {
    this.callbacks.delete(executionId)
  }

  /**
   * Start autonomous workflow execution (FR-16.5.1)
   */
  async startAutonomousExecution(request: StartExecutionRequest): Promise<StartExecutionResult> {
    const executionId = this.generateExecutionId()

    // Validate request
    const validationErrors = this.validateStartRequest(request)
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors
      }
    }

    // Build configuration
    const config: AutonomousExecutionConfig = {
      ...DEFAULT_AUTONOMOUS_EXECUTION_CONFIG,
      workflowId: request.workflowId,
      userId: request.userId,
      projectId: request.projectId,
      ...request.config
    }

    // Initialize execution state
    const state: LocalExecutionState = {
      executionId,
      workflowId: request.workflowId,
      config,
      phase: 'initialization',
      status: 'running',
      progress: 0,
      currentPhaseProgress: 0,
      phasesCompleted: [],
      currentStepIndex: 0,
      totalSteps: 0,
      currentStepName: 'Initializing...',
      startedAt: new Date(),
      lastActivityAt: new Date(),
      nonCriticalErrors: [],
      healingAttempts: [],
      partialResults: [],
      currentCost: 0,
      estimatedTotalCost: 0,
      metadata: {
        initialInputs: request.initialInputs || {}
      },
      // Additional fields for LocalExecutionState
      criticalErrors: [],
      artifacts: []
    }

    // Store state and initialize logs
    this.executions.set(executionId, state)
    this.logs.set(executionId, [])

    // Update metrics
    this.metrics.totalExecutions++
    this.metrics.runningExecutions++

    // Log start
    this.logEvent(executionId, 'info', 'initialization', 'Autonomous execution started', {
      workflowId: request.workflowId,
      config: config
    })

    // Start progress updates
    this.startProgressUpdates(executionId)

    // Start cost monitoring
    this.startCostMonitoring(executionId)

    // Execute workflow asynchronously
    this.executeWorkflowAsync(executionId).catch(error => {
      this.handleFatalError(executionId, error)
    })

    return {
      success: true,
      executionId,
      state
    }
  }

  /**
   * Pause execution for critical error (FR-16.5.2)
   */
  async pauseExecution(executionId: string, error: CriticalError): Promise<void> {
    const state = this.executions.get(executionId)
    if (!state) return

    // Update state
    state.phase = 'paused'
    state.status = 'paused'
    state.criticalError = error
    state.lastActivityAt = new Date()

    // Stop progress updates while paused
    this.stopProgressUpdates(executionId)

    // Log pause
    this.logEvent(executionId, 'error', 'paused', `Execution paused: ${error.message}`, {
      errorType: error.type,
      stepIndex: error.stepIndex
    })

    // Update metrics
    this.metrics.criticalErrorCount++
    this.metrics.errorsByType[error.type] = (this.metrics.errorsByType[error.type] || 0) + 1

    // Notify callbacks
    this.notifyCallbacks(executionId, 'onCriticalError', error)

    // Send notification if configured
    if (state.config.notifyOnCriticalError) {
      await this.sendCriticalErrorNotification(executionId, error)
    }
  }

  /**
   * Resume execution after user decision
   */
  async resumeExecution(request: ResumeExecutionRequest): Promise<ResumeExecutionResult> {
    const state = this.executions.get(request.executionId)
    if (!state) {
      return {
        success: false,
        error: 'Execution not found'
      }
    }

    if (state.status !== 'paused') {
      return {
        success: false,
        error: `Cannot resume: execution is ${state.status}`
      }
    }

    if (!state.criticalError) {
      return {
        success: false,
        error: 'No critical error to resolve'
      }
    }

    // Apply user decision
    state.criticalError.userDecision = request.decision

    // Log resume
    this.logEvent(request.executionId, 'info', state.phase, 'Execution resumed with user decision', {
      actionId: request.decision.actionId,
      decidedBy: request.decision.decidedBy
    })

    // Resume based on action
    const actionResult = await this.applyUserDecision(request.executionId, request.decision)

    if (!actionResult.success) {
      return {
        success: false,
        error: actionResult.error
      }
    }

    // Update state
    state.status = 'running'
    state.phase = 'execution' // Resume at execution phase
    state.criticalError = undefined
    state.lastActivityAt = new Date()

    // Restart progress updates
    this.startProgressUpdates(request.executionId)

    // Continue execution
    this.continueExecutionAsync(request.executionId).catch(error => {
      this.handleFatalError(request.executionId, error)
    })

    return {
      success: true,
      state
    }
  }

  /**
   * Cancel execution gracefully (FR-16.5.4)
   */
  async cancelExecution(request: CancelExecutionRequest): Promise<CancelExecutionResult> {
    const state = this.executions.get(request.executionId)
    if (!state) {
      return {
        success: false,
        error: 'Execution not found'
      }
    }

    if (state.status === 'completed' || state.status === 'cancelled' || state.status === 'failed') {
      return {
        success: false,
        error: `Cannot cancel: execution is ${state.status}`
      }
    }

    // Stop timers
    this.stopProgressUpdates(request.executionId)
    this.stopCostMonitoring(request.executionId)

    // Update state
    state.phase = 'cancelled'
    state.status = 'cancelled'
    state.completedAt = new Date()
    state.lastActivityAt = new Date()

    // Update metrics
    this.metrics.runningExecutions--
    this.metrics.cancelledExecutions++

    // Log cancellation
    this.logEvent(request.executionId, 'warn', 'cancelled', `Execution cancelled: ${request.reason}`, {
      cancelledBy: request.cancelledBy,
      reason: request.reason
    })

    // Get partial results
    const partialResults = request.savePartialResults ? state.partialResults : []

    // Notify callbacks
    const cancelResult: CancelExecutionResult = {
      success: true,
      partialResults,
      cancelledAt: state.completedAt
    }
    this.notifyCallbacks(request.executionId, 'onCancellation', cancelResult)

    // Send completion notification (as cancelled)
    if (state.config.notifyOnCompletion) {
      await this.sendCompletionNotification(request.executionId, 'cancelled')
    }

    return cancelResult
  }

  /**
   * Get partial results from execution
   */
  getPartialResults(executionId: string): PartialResult[] {
    const state = this.executions.get(executionId)
    return state?.partialResults || []
  }

  /**
   * Get execution state
   */
  getExecutionState(executionId: string): AutonomousExecutionState | undefined {
    return this.executions.get(executionId)
  }

  /**
   * Get all running executions
   */
  getRunningExecutions(): AutonomousExecutionState[] {
    return Array.from(this.executions.values()).filter(e => e.status === 'running')
  }

  /**
   * Get execution log
   */
  getExecutionLog(executionId: string): ExecutionLogEntry[] {
    return this.logs.get(executionId) || []
  }

  /**
   * Get execution metrics
   */
  getMetrics(): AutonomousExecutionMetrics {
    return { ...this.metrics }
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics()
  }

  // =========================================================================
  // PRIVATE: Workflow Execution
  // =========================================================================

  /**
   * Execute workflow asynchronously
   */
  private async executeWorkflowAsync(executionId: string): Promise<void> {
    const state = this.executions.get(executionId)
    if (!state) return

    try {
      // Phase 1: Initialization
      await this.executeInitializationPhase(executionId)

      // Phase 2: Tool Resolution (if enabled)
      if (state.config.enableToolResearchAgent) {
        await this.executeToolResolutionPhase(executionId)
      }

      // Phase 3: Chain Optimization
      await this.executeChainOptimizationPhase(executionId)

      // Phase 4: Connection Setup (if enabled)
      if (state.config.enableIntegrationEngineerAgent) {
        await this.executeConnectionSetupPhase(executionId)
      }

      // Phase 5: Execution
      await this.executeExecutionPhase(executionId)

      // Phase 6: Completion
      await this.executeCompletionPhase(executionId)

    } catch (error) {
      await this.handleFatalError(executionId, error)
    }
  }

  /**
   * Continue execution after resume
   */
  private async continueExecutionAsync(executionId: string): Promise<void> {
    const state = this.executions.get(executionId)
    if (!state) return

    try {
      // Continue from current step
      await this.executeExecutionPhase(executionId)

      // Complete
      await this.executeCompletionPhase(executionId)

    } catch (error) {
      await this.handleFatalError(executionId, error)
    }
  }

  /**
   * Execute initialization phase
   */
  private async executeInitializationPhase(executionId: string): Promise<void> {
    const state = this.executions.get(executionId)
    if (!state) return

    this.updatePhase(executionId, 'initialization')
    this.logEvent(executionId, 'info', 'initialization', 'Starting initialization phase')

    // Simulate workflow loading (in real implementation, load from database)
    await this.delay(500)

    // Load or create workflow definition
    const workflow = await this.loadWorkflowDefinition(state.workflowId)
    this.workflows.set(state.workflowId, workflow)

    // Update state with workflow info
    state.totalSteps = workflow.steps.length
    state.estimatedTotalCost = this.estimateWorkflowCost(workflow)

    this.logEvent(executionId, 'info', 'initialization', 'Workflow loaded', {
      stepCount: workflow.steps.length,
      estimatedCost: state.estimatedTotalCost
    })

    // Mark phase complete
    state.phasesCompleted.push('initialization')
    state.currentPhaseProgress = 100
    state.progress = 10

    await this.delay(200)
  }

  /**
   * Execute tool resolution phase
   */
  private async executeToolResolutionPhase(executionId: string): Promise<void> {
    const state = this.executions.get(executionId)
    if (!state) return

    this.updatePhase(executionId, 'tool_resolution')
    this.logEvent(executionId, 'info', 'tool_resolution', 'Starting tool resolution phase')

    // Delegate to ToolResearchAgent
    const taskResult = await this.delegateToAgent({
      agentType: 'tool_research',
      taskType: 'resolve_tools',
      inputs: {
        workflowId: state.workflowId,
        requirements: this.workflows.get(state.workflowId)?.steps.map(s => s.toolId).filter(Boolean)
      },
      context: {
        executionId,
        workflowId: state.workflowId,
        stepIndex: -1
      }
    })

    if (!taskResult.success) {
      // Check if critical
      if (this.isToolResolutionCritical(taskResult.error)) {
        await this.pauseForCriticalError(executionId, 'configuration_invalid',
          taskResult.error || 'Failed to resolve required tools', 0)
        return
      }
      // Non-critical: log and continue with fallback
      this.logEvent(executionId, 'warn', 'tool_resolution',
        'Tool resolution incomplete, using fallback', { error: taskResult.error })
    }

    state.currentCost += taskResult.cost
    this.metrics.toolResearchAgentInvocations++

    // Mark phase complete
    state.phasesCompleted.push('tool_resolution')
    state.currentPhaseProgress = 100
    state.progress = 25

    await this.delay(200)
  }

  /**
   * Execute chain optimization phase
   */
  private async executeChainOptimizationPhase(executionId: string): Promise<void> {
    const state = this.executions.get(executionId)
    if (!state) return

    this.updatePhase(executionId, 'chain_optimization')
    this.logEvent(executionId, 'info', 'chain_optimization', 'Starting chain optimization phase')

    // Use ToolChainOptimizerService
    const workflow = this.workflows.get(state.workflowId)
    if (workflow) {
      try {
        // Optimize tool chain (simulate using service)
        await this.delay(800)

        this.logEvent(executionId, 'info', 'chain_optimization', 'Tool chain optimized', {
          originalSteps: workflow.steps.length,
          optimizedSteps: workflow.steps.length // In real impl, may reduce steps
        })
      } catch (error) {
        // Non-critical: log and continue
        this.logEvent(executionId, 'warn', 'chain_optimization',
          'Optimization failed, using original chain', { error: String(error) })
      }
    }

    // Mark phase complete
    state.phasesCompleted.push('chain_optimization')
    state.currentPhaseProgress = 100
    state.progress = 35

    await this.delay(200)
  }

  /**
   * Execute connection setup phase
   */
  private async executeConnectionSetupPhase(executionId: string): Promise<void> {
    const state = this.executions.get(executionId)
    if (!state) return

    this.updatePhase(executionId, 'connection_setup')
    this.logEvent(executionId, 'info', 'connection_setup', 'Starting connection setup phase')

    const workflow = this.workflows.get(state.workflowId)
    if (!workflow) return

    // Setup connections for each tool
    const toolIds = workflow.steps
      .filter(s => s.toolId)
      .map(s => s.toolId!)

    for (const toolId of toolIds) {
      // Check MCP availability first
      const mcpAvailable = await mcpServerIntegrationService.checkMCPAvailability(toolId)

      if (mcpAvailable.isAvailable && mcpAvailable.recommendedProvider) {
        // Use MCP connection
        this.logEvent(executionId, 'debug', 'connection_setup',
          `Using MCP for ${toolId}`, { provider: mcpAvailable.recommendedProvider })
      } else {
        // Use dynamic connector
        this.logEvent(executionId, 'debug', 'connection_setup',
          `Using direct connection for ${toolId}`)
      }

      // Delegate to IntegrationEngineerAgent
      const taskResult = await this.delegateToAgent({
        agentType: 'integration_engineer',
        taskType: 'setup_connection',
        inputs: { toolId, useMCP: mcpAvailable.isAvailable },
        context: { executionId, workflowId: state.workflowId, stepIndex: -1 }
      })

      if (!taskResult.success) {
        // Check if critical (e.g., auth failure)
        if (this.isConnectionCritical(taskResult.error)) {
          await this.pauseForCriticalError(executionId, 'authentication_failure',
            taskResult.error || `Failed to connect to ${toolId}`, 0)
          return
        }
      }

      state.currentCost += taskResult.cost
      this.metrics.integrationEngineerAgentInvocations++
    }

    // Mark phase complete
    state.phasesCompleted.push('connection_setup')
    state.currentPhaseProgress = 100
    state.progress = 50

    await this.delay(200)
  }

  /**
   * Execute main execution phase
   */
  private async executeExecutionPhase(executionId: string): Promise<void> {
    const state = this.executions.get(executionId)
    if (!state) return

    this.updatePhase(executionId, 'execution')
    this.logEvent(executionId, 'info', 'execution', 'Starting execution phase')

    const workflow = this.workflows.get(state.workflowId)
    if (!workflow) return

    // Execute each step
    for (let i = state.currentStepIndex; i < workflow.steps.length; i++) {
      // Check if cancelled
      if (state.status === 'cancelled') {
        return
      }

      // Check if paused
      if (state.status === 'paused') {
        return
      }

      const step = workflow.steps[i]
      state.currentStepIndex = i
      state.currentStepName = step.name

      this.logEvent(executionId, 'info', 'execution', `Executing step ${i + 1}: ${step.name}`, {
        stepId: step.id,
        stepType: step.type
      })

      // Check budget before step
      if (await this.checkBudgetExceeded(executionId)) {
        await this.pauseForCriticalError(executionId, 'budget_exceeded',
          'Budget limit exceeded. Please increase budget to continue.', i)
        return
      }

      // Execute step
      const result = await this.executeStep(executionId, step, i)

      if (result.error) {
        if (result.error.type === 'critical') {
          // Pause for critical error
          await this.pauseForCriticalError(executionId,
            result.error.errorType as CriticalErrorType, result.error.message, i)
          return
        } else {
          // Handle non-critical error with self-healing
          const healed = await this.handleNonCriticalError(executionId, step, i,
            result.error.errorType as NonCriticalErrorType, result.error.message)

          if (!healed) {
            // Could not heal, retry step
            const retryResult = await this.retryStep(executionId, step, i)
            if (!retryResult.success) {
              // Escalate to critical
              await this.pauseForCriticalError(executionId, 'service_permanent_failure',
                `Step ${step.name} failed after retries and healing attempts`, i)
              return
            }
          }
        }
      }

      // Record partial result
      const partialResult: PartialResult = {
        stepIndex: i,
        stepName: step.name,
        status: result.success ? 'completed' : 'partial',
        output: result.outputs,
        artifacts: result.artifacts,
        completedAt: new Date()
      }
      state.partialResults.push(partialResult)

      // Update progress
      state.currentCost += result.cost
      const stepProgress = ((i + 1) / workflow.steps.length) * 100
      state.currentPhaseProgress = stepProgress
      state.progress = 50 + (stepProgress * 0.4) // Execution phase is 50-90%

      // Notify step complete
      this.notifyCallbacks(executionId, 'onStepComplete', i, partialResult)

      this.logEvent(executionId, 'info', 'execution', `Step ${i + 1} completed`, {
        stepName: step.name,
        duration: result.duration,
        cost: result.cost
      })
    }

    // Mark phase complete
    state.phasesCompleted.push('execution')
    state.progress = 90
  }

  /**
   * Execute completion phase
   */
  private async executeCompletionPhase(executionId: string): Promise<void> {
    const state = this.executions.get(executionId)
    if (!state) return

    // Skip if not in a completable state
    if (state.status === 'cancelled' || state.status === 'failed' || state.status === 'paused') {
      return
    }

    this.updatePhase(executionId, 'completion')
    this.logEvent(executionId, 'info', 'completion', 'Starting completion phase')

    // Stop timers
    this.stopProgressUpdates(executionId)
    this.stopCostMonitoring(executionId)

    // Build final results
    const finalResults: ExecutionResult = this.buildFinalResults(executionId)
    state.finalResults = finalResults

    // Update state
    state.phase = 'completion'
    state.status = 'completed'
    state.progress = 100
    state.completedAt = new Date()

    // Update metrics
    this.metrics.runningExecutions--
    this.metrics.completedExecutions++
    this.metrics.totalCost += state.currentCost
    this.updateSuccessRates()
    this.updateAverageMetrics(executionId)

    this.logEvent(executionId, 'info', 'completion', 'Execution completed successfully', {
      totalSteps: state.totalSteps,
      stepsCompleted: state.partialResults.length,
      totalCost: state.currentCost,
      duration: state.completedAt.getTime() - state.startedAt.getTime()
    })

    // Mark phase complete
    state.phasesCompleted.push('completion')

    // Send completion notification
    if (state.config.notifyOnCompletion) {
      await this.sendCompletionNotification(executionId, 'success')
    }

    // Notify callbacks
    const notification = this.buildCompletionNotification(executionId, 'success')
    this.notifyCallbacks(executionId, 'onCompletion', notification)
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    _executionId: string,
    step: WorkflowStep,
    _index: number
  ): Promise<StepExecutionResult> {
    void _executionId // Reserved for future logging/tracking
    void _index // Reserved for future progress tracking
    const startTime = Date.now()

    try {
      // Simulate step execution (in real implementation, use actual tool execution)
      await this.delay(500 + Math.random() * 1000)

      // Simulate occasional errors for testing
      if (Math.random() < 0.1) {
        // 10% chance of non-critical error
        return {
          stepId: step.id,
          success: false,
          outputs: {},
          artifacts: [],
          duration: Date.now() - startTime,
          cost: 0.02,
          error: {
            type: 'non_critical',
            errorType: 'network_transient',
            message: 'Temporary network issue'
          }
        }
      }

      // Successful execution
      return {
        stepId: step.id,
        success: true,
        outputs: { result: `Output from ${step.name}` },
        artifacts: [],
        duration: Date.now() - startTime,
        cost: 0.05 + Math.random() * 0.1
      }

    } catch (error) {
      return {
        stepId: step.id,
        success: false,
        outputs: {},
        artifacts: [],
        duration: Date.now() - startTime,
        cost: 0.02,
        error: {
          type: 'critical',
          errorType: 'service_permanent_failure',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  /**
   * Retry a failed step
   */
  private async retryStep(
    executionId: string,
    step: WorkflowStep,
    index: number
  ): Promise<{ success: boolean; result?: StepExecutionResult }> {
    const state = this.executions.get(executionId)
    if (!state) return { success: false }

    const maxRetries = state.config.maxRetries

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.logEvent(executionId, 'info', 'execution',
        `Retrying step ${index + 1} (attempt ${attempt}/${maxRetries})`)

      // Wait with exponential backoff
      await this.delay(1000 * Math.pow(2, attempt - 1))

      const result = await this.executeStep(executionId, step, index)

      if (result.success) {
        return { success: true, result }
      }

      // If still getting critical errors, don't keep retrying
      if (result.error?.type === 'critical') {
        return { success: false, result }
      }
    }

    return { success: false }
  }

  // =========================================================================
  // PRIVATE: Error Handling
  // =========================================================================

  /**
   * Handle non-critical error with self-healing (AC3)
   */
  private async handleNonCriticalError(
    executionId: string,
    step: WorkflowStep,
    stepIndex: number,
    errorType: NonCriticalErrorType,
    message: string
  ): Promise<boolean> {
    const state = this.executions.get(executionId)
    if (!state) return false

    // Record non-critical error
    const error: NonCriticalError = {
      id: this.generateId(),
      type: errorType,
      message,
      occurredAt: new Date(),
      stepIndex,
      resolved: false
    }
    state.nonCriticalErrors.push(error)

    // Update metrics
    this.metrics.nonCriticalErrorCount++
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1

    // Notify callbacks
    this.notifyCallbacks(executionId, 'onNonCriticalError', error)

    this.logEvent(executionId, 'warn', 'execution',
      `Non-critical error at step ${stepIndex + 1}: ${message}`, {
        errorType,
        stepName: step.name
      })

    // Delegate to self-healing service
    if (state.config.enableSelfHealing) {
      try {
        const healingStart = Date.now()
        const healingStartIso = new Date().toISOString()

        // Create healing session (simulate integration with IntegrationSelfHealingService)
        await this.delay(500) // Simulate healing attempt

        const healingSuccess = Math.random() > 0.2 // 80% success rate
        const healingDuration = Date.now() - healingStart
        const strategy = this.mapErrorTypeToStrategy(errorType)

        // Record healing attempt (matches HealingAttempt interface from types)
        const attempt: HealingAttempt = {
          id: this.generateId(),
          createdAt: healingStartIso,
          completedAt: new Date().toISOString(),
          originalError: {
            errorType: 'INTERNAL_ERROR', // Map to valid ConnectionErrorType
            isTransient: true,
            isRetryable: true,
            userMessage: message,
            technicalMessage: `Non-critical error at step ${stepIndex}: ${errorType}`,
            suggestedAction: 'retry'
          },
          toolId: step.toolId || 'unknown',
          toolName: step.name,
          operationId: `op_${this.generateId()}`,
          strategy,
          attemptNumber: 1,
          maxAttempts: state.config.maxRetries,
          delayMs: 500,
          timeoutMs: 30000,
          durationMs: healingDuration,
          status: healingSuccess ? 'succeeded' : 'failed',
          resolution: healingSuccess ? 'Self-healing resolved the error' : null,
          newError: null
        }
        state.healingAttempts.push(attempt)

        // Update metrics
        this.metrics.totalHealingAttempts++
        const attemptSucceeded = attempt.status === 'succeeded'
        if (attemptSucceeded) {
          this.updateHealingSuccessRate()
        }

        // Notify callbacks
        this.notifyCallbacks(executionId, 'onHealingAttempt', attempt)

        if (attemptSucceeded) {
          error.resolved = true
          error.resolutionMethod = attempt.strategy
          error.resolvedAt = new Date()

          this.logEvent(executionId, 'info', 'execution',
            `Error resolved by self-healing: ${attempt.strategy}`, {
              errorId: error.id,
              duration: attempt.durationMs
            })

          return true
        }

      } catch (healError) {
        this.logEvent(executionId, 'warn', 'execution',
          'Self-healing failed', { error: String(healError) })
      }
    }

    return false
  }

  /**
   * Pause for critical error
   */
  private async pauseForCriticalError(
    executionId: string,
    errorType: CriticalErrorType,
    message: string,
    stepIndex: number
  ): Promise<void> {
    const state = this.executions.get(executionId)
    if (!state) return

    const step = this.workflows.get(state.workflowId)?.steps[stepIndex]

    const error: CriticalError = {
      id: this.generateId(),
      type: errorType,
      message,
      details: AUTONOMOUS_EXECUTION_ERROR_MESSAGES.critical[
        errorType.toUpperCase() as keyof typeof AUTONOMOUS_EXECUTION_ERROR_MESSAGES.critical
      ] || message,
      occurredAt: new Date(),
      stepIndex,
      stepName: step?.name || 'Unknown step',
      possibleActions: this.getPossibleActions(errorType)
    }

    await this.pauseExecution(executionId, error)
  }

  /**
   * Handle fatal/unrecoverable error
   */
  private async handleFatalError(executionId: string, error: unknown): Promise<void> {
    const state = this.executions.get(executionId)
    if (!state) return

    // Stop timers
    this.stopProgressUpdates(executionId)
    this.stopCostMonitoring(executionId)

    // Update state
    state.phase = 'failed'
    state.status = 'failed'
    state.completedAt = new Date()

    // Update metrics
    this.metrics.runningExecutions--
    this.metrics.failedExecutions++
    this.updateSuccessRates()

    const errorMessage = error instanceof Error ? error.message : 'Unknown fatal error'

    this.logEvent(executionId, 'error', state.phase, `Fatal error: ${errorMessage}`, {
      error: String(error)
    })

    // Send completion notification (as failed)
    if (state.config.notifyOnCompletion) {
      await this.sendCompletionNotification(executionId, 'failed')
    }
  }

  /**
   * Get possible actions for critical error type
   */
  private getPossibleActions(errorType: CriticalErrorType): CriticalErrorAction[] {
    const actions: CriticalErrorAction[] = []

    switch (errorType) {
      case 'authentication_failure':
        actions.push(
          { id: 'reauth', label: 'Re-authenticate', description: 'Open OAuth flow to reconnect', requiresInput: false, inputType: 'oauth' },
          { id: 'skip', label: 'Skip Step', description: 'Skip this step and continue', requiresInput: false },
          { id: 'cancel', label: 'Cancel Workflow', description: 'Cancel execution and save partial results', requiresInput: false }
        )
        break

      case 'budget_exceeded':
        actions.push(
          { id: 'increase', label: 'Increase Budget', description: 'Set a new budget limit', requiresInput: true, inputType: 'text' },
          { id: 'continue', label: 'Continue Anyway', description: 'Continue without budget limit', requiresInput: false },
          { id: 'cancel', label: 'Cancel Workflow', description: 'Cancel and save partial results', requiresInput: false }
        )
        break

      case 'data_loss_risk':
        actions.push(
          { id: 'confirm', label: 'Confirm & Continue', description: 'Acknowledge risk and proceed', requiresInput: false },
          { id: 'backup', label: 'Backup First', description: 'Create backup before continuing', requiresInput: false },
          { id: 'cancel', label: 'Cancel', description: 'Cancel to prevent data loss', requiresInput: false }
        )
        break

      default:
        actions.push(
          { id: 'retry', label: 'Retry', description: 'Attempt the operation again', requiresInput: false },
          { id: 'skip', label: 'Skip', description: 'Skip this step', requiresInput: false },
          { id: 'cancel', label: 'Cancel', description: 'Cancel execution', requiresInput: false }
        )
    }

    return actions
  }

  /**
   * Apply user decision for critical error
   */
  private async applyUserDecision(
    executionId: string,
    decision: CriticalErrorDecision
  ): Promise<{ success: boolean; error?: string }> {
    const state = this.executions.get(executionId)
    if (!state) return { success: false, error: 'Execution not found' }

    switch (decision.actionId) {
      case 'cancel':
        await this.cancelExecution({
          executionId,
          reason: 'User chose to cancel after critical error',
          cancelledBy: decision.decidedBy,
          savePartialResults: true
        })
        return { success: false, error: 'Cancelled by user' }

      case 'skip':
        state.currentStepIndex++
        return { success: true }

      case 'retry':
      case 'reauth':
      case 'confirm':
      case 'continue':
      case 'increase':
        if (decision.actionId === 'increase' && decision.inputValue) {
          const newBudget = parseFloat(decision.inputValue)
          if (!isNaN(newBudget)) {
            state.config.maxBudget = newBudget
          }
        }
        return { success: true }

      default:
        return { success: true }
    }
  }

  // =========================================================================
  // PRIVATE: Agent Delegation
  // =========================================================================

  /**
   * Delegate task to agent (ToolResearch or IntegrationEngineer)
   */
  private async delegateToAgent(request: AgentTaskRequest): Promise<AgentTaskResult> {
    const startTime = Date.now()

    // Simulate agent task execution
    await this.delay(300 + Math.random() * 500)

    // Log delegation
    const executionId = request.context.executionId
    this.logEvent(executionId, 'debug', 'execution' as ExecutionPhase,
      `Delegated to ${request.agentType}: ${request.taskType}`, {
        inputs: request.inputs
      })

    return {
      success: true,
      agentType: request.agentType,
      taskType: request.taskType,
      outputs: { status: 'completed' },
      duration: Date.now() - startTime,
      cost: 0.05
    }
  }

  // =========================================================================
  // PRIVATE: Notifications
  // =========================================================================

  /**
   * Send completion notification
   */
  private async sendCompletionNotification(
    executionId: string,
    status: 'success' | 'partial_success' | 'failed' | 'cancelled'
  ): Promise<void> {
    const notification = this.buildCompletionNotification(executionId, status)

    // In real implementation, send via email, push, webhook, etc.
    this.logEvent(executionId, 'info', 'completion', 'Completion notification sent', {
      status,
      channels: notification.artifactTypes
    })
  }

  /**
   * Send critical error notification
   */
  private async sendCriticalErrorNotification(
    executionId: string,
    error: CriticalError
  ): Promise<void> {
    const state = this.executions.get(executionId)
    if (!state) return

    // In real implementation, send notification
    this.logEvent(executionId, 'info', 'paused', 'Critical error notification sent', {
      errorType: error.type,
      channels: state.config.notificationChannels.filter(c => c.enabled).map(c => c.type)
    })
  }

  /**
   * Build completion notification payload
   */
  private buildCompletionNotification(
    executionId: string,
    status: 'success' | 'partial_success' | 'failed' | 'cancelled'
  ): CompletionNotification {
    const state = this.executions.get(executionId)!
    const workflow = this.workflows.get(state.workflowId)

    return {
      executionId,
      workflowId: state.workflowId,
      workflowName: workflow?.name || 'Unknown Workflow',
      userId: state.config.userId,
      status,
      summary: this.generateSummary(state, status),
      duration: (state.completedAt?.getTime() || Date.now()) - state.startedAt.getTime(),
      cost: state.currentCost,
      stepsCompleted: state.partialResults.filter(r => r.status === 'completed').length,
      totalSteps: state.totalSteps,
      resultsUrl: `/results/${executionId}`,
      logsUrl: `/logs/${executionId}`,
      artifactCount: state.partialResults.reduce((sum, r) => sum + (r.artifacts?.length || 0), 0),
      artifactTypes: this.getUniqueArtifactTypes(state.partialResults),
      startedAt: state.startedAt,
      completedAt: state.completedAt || new Date(),
      notifiedAt: new Date()
    }
  }

  // =========================================================================
  // PRIVATE: Utilities
  // =========================================================================

  /**
   * Validate start execution request
   */
  private validateStartRequest(request: StartExecutionRequest): string[] {
    const errors: string[] = []

    if (!request.workflowId) errors.push('workflowId is required')
    if (!request.userId) errors.push('userId is required')
    if (!request.projectId) errors.push('projectId is required')

    return errors
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Update phase and notify
   */
  private updatePhase(executionId: string, phase: ExecutionPhase): void {
    const state = this.executions.get(executionId)
    if (!state) return

    const _previousPhase = state.phase
    void _previousPhase // Reserved for transition logging
    state.phase = phase
    state.currentPhaseProgress = 0
    state.lastActivityAt = new Date()

    this.notifyCallbacks(executionId, 'onPhaseChange', phase, state)
  }

  /**
   * Log execution event
   */
  private logEvent(
    executionId: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    phase: ExecutionPhase,
    message: string,
    details?: Record<string, unknown>
  ): void {
    const state = this.executions.get(executionId)

    const entry: ExecutionLogEntry = {
      id: this.generateId(),
      executionId,
      timestamp: new Date(),
      level,
      phase,
      stepIndex: state?.currentStepIndex,
      stepName: state?.currentStepName,
      message,
      details
    }

    const logs = this.logs.get(executionId) || []
    logs.push(entry)
    this.logs.set(executionId, logs)
  }

  /**
   * Notify callbacks
   */
  private notifyCallbacks(executionId: string, event: keyof AutonomousExecutionCallbacks, ...args: unknown[]): void {
    const callbacks = this.callbacks.get(executionId)

    // Call execution-specific callback
    if (callbacks) {
      const callback = callbacks[event] as ((...args: unknown[]) => void) | undefined
      if (callback) {
        try {
          callback(...args)
        } catch (error) {
          console.error(`Callback error for ${event}:`, error)
        }
      }
    }

    // Call global callback
    const globalCallback = this.globalCallbacks[event] as ((...args: unknown[]) => void) | undefined
    if (globalCallback) {
      try {
        globalCallback(...args)
      } catch (error) {
        console.error(`Global callback error for ${event}:`, error)
      }
    }
  }

  /**
   * Start progress update timer
   */
  private startProgressUpdates(executionId: string): void {
    const timer = setInterval(() => {
      const state = this.executions.get(executionId)
      if (!state || state.status !== 'running') {
        this.stopProgressUpdates(executionId)
        return
      }

      const update: ExecutionProgressUpdate = {
        executionId,
        timestamp: new Date(),
        phase: state.phase,
        progress: state.progress,
        stepIndex: state.currentStepIndex,
        stepName: state.currentStepName,
        status: state.status,
        message: `Executing: ${state.currentStepName}`,
        estimatedTimeRemaining: this.estimateTimeRemaining(state),
        currentCost: state.currentCost
      }

      this.notifyCallbacks(executionId, 'onProgress', update)
    }, AUTONOMOUS_EXECUTION_THRESHOLDS.progressUpdateInterval)

    this.progressTimers.set(executionId, timer)
  }

  /**
   * Stop progress update timer
   */
  private stopProgressUpdates(executionId: string): void {
    const timer = this.progressTimers.get(executionId)
    if (timer) {
      clearInterval(timer)
      this.progressTimers.delete(executionId)
    }
  }

  /**
   * Start cost monitoring timer
   */
  private startCostMonitoring(executionId: string): void {
    const timer = setInterval(async () => {
      await this.checkBudgetExceeded(executionId)
    }, AUTONOMOUS_EXECUTION_THRESHOLDS.costCheckInterval)

    this.costTimers.set(executionId, timer)
  }

  /**
   * Stop cost monitoring timer
   */
  private stopCostMonitoring(executionId: string): void {
    const timer = this.costTimers.get(executionId)
    if (timer) {
      clearInterval(timer)
      this.costTimers.delete(executionId)
    }
  }

  /**
   * Check if budget exceeded
   */
  private async checkBudgetExceeded(executionId: string): Promise<boolean> {
    const state = this.executions.get(executionId)
    if (!state) return false

    if (state.currentCost >= state.config.maxBudget) {
      return true
    }

    // Warn at threshold
    if (state.currentCost >= state.config.warningThreshold) {
      this.logEvent(executionId, 'warn', state.phase,
        `Cost warning: $${state.currentCost.toFixed(2)} of $${state.config.maxBudget.toFixed(2)} budget used`)
    }

    return false
  }

  /**
   * Load workflow definition (simulated)
   */
  private async loadWorkflowDefinition(workflowId: string): Promise<WorkflowDefinition> {
    // In real implementation, load from database
    return {
      id: workflowId,
      name: 'Test Workflow',
      description: 'A test workflow for autonomous execution',
      steps: [
        { id: 'step1', name: 'Fetch Data', type: 'tool', toolId: 'data_fetcher', config: {}, inputs: {}, outputs: ['data'], dependencies: [] },
        { id: 'step2', name: 'Transform Data', type: 'transform', config: {}, inputs: { data: '{{step1.data}}' }, outputs: ['transformed'], dependencies: ['step1'] },
        { id: 'step3', name: 'Save Results', type: 'tool', toolId: 'data_saver', config: {}, inputs: { data: '{{step2.transformed}}' }, outputs: ['result'], dependencies: ['step2'] }
      ],
      inputs: {},
      expectedOutputs: ['result']
    }
  }

  /**
   * Estimate workflow cost
   */
  private estimateWorkflowCost(workflow: WorkflowDefinition): number {
    return workflow.steps.length * 0.10 // $0.10 per step estimate
  }

  /**
   * Estimate time remaining
   */
  private estimateTimeRemaining(state: AutonomousExecutionState): number {
    if (state.totalSteps === 0) return 0

    const elapsed = Date.now() - state.startedAt.getTime()
    const stepsCompleted = state.currentStepIndex
    if (stepsCompleted === 0) return elapsed * state.totalSteps

    const avgTimePerStep = elapsed / stepsCompleted
    const remainingSteps = state.totalSteps - stepsCompleted
    return avgTimePerStep * remainingSteps
  }

  /**
   * Build final results
   */
  private buildFinalResults(executionId: string): ExecutionResult {
    const state = this.executions.get(executionId)!

    const completedResults = state.partialResults.filter(r => r.status === 'completed')
    const allArtifacts = state.partialResults.flatMap(r => r.artifacts || [])

    return {
      executionId,
      workflowId: state.workflowId,
      status: completedResults.length === state.totalSteps ? 'success' : 'partial_success',
      outputs: completedResults.reduce((acc, r) => ({ ...acc, [`step${r.stepIndex}`]: r.output }), {}),
      artifacts: allArtifacts,
      summary: this.generateSummary(state, 'success'),
      stepsCompleted: completedResults.length,
      totalSteps: state.totalSteps,
      totalDuration: (state.completedAt?.getTime() || Date.now()) - state.startedAt.getTime(),
      totalCost: state.currentCost,
      tokensUsed: Math.floor(state.currentCost / 0.00001), // Rough estimate
      startedAt: state.startedAt,
      completedAt: state.completedAt || new Date()
    }
  }

  /**
   * Generate execution summary
   */
  private generateSummary(
    state: AutonomousExecutionState,
    status: 'success' | 'partial_success' | 'failed' | 'cancelled'
  ): string {
    const completed = state.partialResults.filter(r => r.status === 'completed').length

    switch (status) {
      case 'success':
        return `Workflow completed successfully. All ${state.totalSteps} steps executed.`
      case 'partial_success':
        return `Workflow partially completed. ${completed} of ${state.totalSteps} steps executed.`
      case 'failed':
        return `Workflow failed at step ${state.currentStepIndex + 1}. ${completed} steps completed before failure.`
      case 'cancelled':
        return `Workflow cancelled by user. ${completed} of ${state.totalSteps} steps completed.`
      default:
        return `Workflow ended with status: ${status}`
    }
  }

  /**
   * Get unique artifact types from results
   */
  private getUniqueArtifactTypes(results: PartialResult[]): string[] {
    const types = new Set<string>()
    results.forEach(r => r.artifacts?.forEach(a => types.add(a.type)))
    return Array.from(types)
  }

  /**
   * Map error type to healing strategy
   */
  private mapErrorTypeToStrategy(errorType: NonCriticalErrorType): HealingStrategy {
    const mapping: Record<NonCriticalErrorType, HealingStrategy> = {
      network_transient: 'retry',
      rate_limited: 'rate_limit_wait',
      service_temporary: 'retry',
      schema_mismatch: 'schema_adapt',
      token_expired: 'refresh_auth',
      timeout: 'retry',
      connection_reset: 'retry'
    }
    return mapping[errorType] || 'retry'
  }

  /**
   * Check if tool resolution error is critical
   */
  private isToolResolutionCritical(error?: string): boolean {
    if (!error) return false
    const criticalPatterns = ['not found', 'unavailable', 'permission denied']
    return criticalPatterns.some(p => error.toLowerCase().includes(p))
  }

  /**
   * Check if connection error is critical
   */
  private isConnectionCritical(error?: string): boolean {
    if (!error) return false
    const criticalPatterns = ['auth', 'unauthorized', 'forbidden', 'invalid credentials']
    return criticalPatterns.some(p => error.toLowerCase().includes(p))
  }

  /**
   * Update success rates in metrics
   */
  private updateSuccessRates(): void {
    const total = this.metrics.completedExecutions + this.metrics.failedExecutions
    if (total > 0) {
      this.metrics.successRate = this.metrics.completedExecutions / total
    }
  }

  /**
   * Update healing success rate
   */
  private updateHealingSuccessRate(): void {
    if (this.metrics.totalHealingAttempts > 0) {
      // Calculate based on resolved non-critical errors
      const successfulHealings = Array.from(this.executions.values())
        .flatMap(e => e.healingAttempts)
        .filter(a => a.status === 'succeeded').length

      this.metrics.healingSuccessRate = successfulHealings / this.metrics.totalHealingAttempts
    }
  }

  /**
   * Update average metrics
   */
  private updateAverageMetrics(executionId: string): void {
    const state = this.executions.get(executionId)
    if (!state?.completedAt) return

    const duration = state.completedAt.getTime() - state.startedAt.getTime()
    const completedCount = this.metrics.completedExecutions

    // Update average execution time
    this.metrics.averageExecutionTime =
      ((this.metrics.averageExecutionTime * (completedCount - 1)) + duration) / completedCount

    // Update average cost
    this.metrics.averageCost = this.metrics.totalCost / completedCount
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Clean up completed executions older than retention period
   */
  cleanupOldExecutions(maxAgeMs: number = 86400000): number {
    const now = Date.now()
    let cleaned = 0

    for (const [id, state] of this.executions.entries()) {
      if (
        (state.status === 'completed' || state.status === 'cancelled' || state.status === 'failed') &&
        state.completedAt &&
        now - state.completedAt.getTime() > maxAgeMs
      ) {
        this.executions.delete(id)
        this.logs.delete(id)
        this.callbacks.delete(id)
        cleaned++
      }
    }

    return cleaned
  }
}

// Export singleton instance
export const autonomousExecutionControllerService = new AutonomousExecutionControllerService()

// Export class for testing
export { AutonomousExecutionControllerService }

// Export type alias for external consumers
export type { LocalExecutionState }

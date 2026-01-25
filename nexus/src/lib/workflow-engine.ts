// Multi-step Workflow Execution Engine with Real AI
import { nexusService } from './nexus-service'
import { supabase } from './supabase'
import {
  evaluateCondition,
  transformData,
  parseLegacyTransform,
  SafeExpressionError
} from './safe-expression-evaluator'
import type { TransformOperation } from './safe-expression-evaluator'

export interface WorkflowNode {
  id: string
  type: 'ai-agent' | 'condition' | 'loop' | 'data-transform' | 'api-call' | 'start' | 'end'
  label: string
  config: {
    prompt?: string
    model?: string
    condition?: string
    /**
     * @deprecated Use transformOperations instead. Legacy transformCode using arbitrary JS
     * is a security risk and will be migrated to safe operations.
     */
    transformCode?: string
    /**
     * Safe transform operations that replace arbitrary code execution.
     * Each operation is validated and executed safely.
     */
    transformOperations?: TransformOperation[]
    apiUrl?: string
    loopCount?: number
  }
  position: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface ExecutionStep {
  nodeId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying'
  input: any
  output: any
  error?: string
  startTime?: Date
  endTime?: Date
  tokensUsed?: number
  costUSD?: number
  retryCount?: number
  recoveryActions?: string[]
}

// Auto-recovery configuration
export interface RecoveryConfig {
  maxRetries: number
  retryDelayMs: number
  exponentialBackoff: boolean
  autoRecoveryEnabled: boolean
}

const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  exponentialBackoff: true,
  autoRecoveryEnabled: true
}

export interface WorkflowExecutionState {
  workflowId: string
  executionId: string
  status: 'running' | 'completed' | 'failed'
  steps: ExecutionStep[]
  currentNodeId?: string
  variables: Record<string, any>
  totalTokens: number
  totalCost: number
}

export class WorkflowEngine {
  private state: WorkflowExecutionState
  private definition: WorkflowDefinition
  private onProgress?: (state: WorkflowExecutionState) => void
  private recoveryConfig: RecoveryConfig

  constructor(
    workflowId: string,
    executionId: string,
    definition: WorkflowDefinition,
    onProgress?: (state: WorkflowExecutionState) => void,
    recoveryConfig?: Partial<RecoveryConfig>
  ) {
    this.definition = definition
    this.onProgress = onProgress
    this.recoveryConfig = { ...DEFAULT_RECOVERY_CONFIG, ...recoveryConfig }
    this.state = {
      workflowId,
      executionId,
      status: 'running',
      steps: definition.nodes.map(node => ({
        nodeId: node.id,
        status: 'pending',
        input: null,
        output: null,
        retryCount: 0,
        recoveryActions: []
      })),
      variables: {},
      totalTokens: 0,
      totalCost: 0,
    }
  }

  /**
   * Analyze error and determine recovery strategy
   */
  private analyzeErrorForRecovery(error: Error, nodeType: string): { canRecover: boolean; strategy: string; delay: number } {
    const errorMessage = error.message.toLowerCase()

    // Network/Timeout errors - always retry with backoff
    if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('econnrefused')) {
      return { canRecover: true, strategy: 'retry_with_backoff', delay: 2000 }
    }

    // Rate limiting - retry with longer delay
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests') || errorMessage.includes('429')) {
      return { canRecover: true, strategy: 'rate_limit_backoff', delay: 5000 }
    }

    // API errors that might be transient
    if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('504')) {
      return { canRecover: true, strategy: 'server_error_retry', delay: 3000 }
    }

    // AI model errors - retry with simpler prompt
    if (nodeType === 'ai-agent' && (errorMessage.includes('context') || errorMessage.includes('token') || errorMessage.includes('length'))) {
      return { canRecover: true, strategy: 'simplify_prompt', delay: 1000 }
    }

    // Transform errors - might need input sanitization
    if (nodeType === 'data-transform' && (errorMessage.includes('undefined') || errorMessage.includes('null'))) {
      return { canRecover: true, strategy: 'sanitize_input', delay: 500 }
    }

    // Condition evaluation errors
    if (nodeType === 'condition' && errorMessage.includes('evaluation')) {
      return { canRecover: true, strategy: 'default_condition', delay: 500 }
    }

    // API call failures
    if (nodeType === 'api-call' && !errorMessage.includes('400') && !errorMessage.includes('401') && !errorMessage.includes('403')) {
      return { canRecover: true, strategy: 'api_retry', delay: 2000 }
    }

    // Unrecoverable errors (auth, validation, etc.)
    return { canRecover: false, strategy: 'none', delay: 0 }
  }

  /**
   * Apply recovery strategy before retry
   */
  private applyRecoveryStrategy(strategy: string, node: WorkflowNode, input: any): any {
    const step = this.state.steps.find(s => s.nodeId === node.id)!
    step.recoveryActions = step.recoveryActions || []

    switch (strategy) {
      case 'simplify_prompt':
        // Truncate input for AI agents
        step.recoveryActions.push('Simplified input data to reduce context length')
        if (typeof input === 'object' && input !== null) {
          return { simplified: true, data: JSON.stringify(input).slice(0, 1000) }
        }
        return input

      case 'sanitize_input':
        // Clean up null/undefined values
        step.recoveryActions.push('Sanitized null/undefined values in input')
        if (typeof input === 'object' && input !== null) {
          return Object.fromEntries(
            Object.entries(input).filter(([_, v]) => v != null)
          )
        }
        return input || {}

      case 'default_condition':
        // For condition nodes, provide a safe default
        step.recoveryActions.push('Applied default condition value')
        return { ...input, _forceTrue: true }

      default:
        step.recoveryActions.push(`Applied recovery strategy: ${strategy}`)
        return input
    }
  }

  /**
   * Sleep with exponential backoff
   */
  private async sleep(baseMs: number, retryCount: number): Promise<void> {
    const delay = this.recoveryConfig.exponentialBackoff
      ? baseMs * Math.pow(2, retryCount)
      : baseMs
    await new Promise(resolve => setTimeout(resolve, Math.min(delay, 30000)))
  }

  async execute(): Promise<WorkflowExecutionState> {
    try {
      // Find start node
      const startNode = this.definition.nodes.find(n => n.type === 'start')
      if (!startNode) {
        throw new Error('Workflow must have a start node')
      }

      // Execute workflow starting from start node
      await this.executeNode(startNode.id, {})

      this.state.status = 'completed'
      await this.saveState()
      return this.state
    } catch (error: any) {
      this.state.status = 'failed'
      await this.saveState()
      throw error
    }
  }

  private async executeNode(nodeId: string, input: any): Promise<any> {
    const node = this.definition.nodes.find(n => n.id === nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }

    // Update step status
    const step = this.state.steps.find(s => s.nodeId === nodeId)!
    step.status = 'running'
    step.input = input
    step.startTime = new Date()
    this.state.currentNodeId = nodeId

    // Notify progress
    this.notifyProgress()

    try {
      let output: any

      // Execute based on node type
      switch (node.type) {
        case 'start':
          output = input
          break

        case 'ai-agent':
          output = await this.executeAIAgent(node, input)
          break

        case 'condition':
          output = await this.executeCondition(node, input)
          break

        case 'data-transform':
          output = await this.executeDataTransform(node, input)
          break

        case 'api-call':
          output = await this.executeAPICall(node, input)
          break

        case 'loop':
          output = await this.executeLoop(node, input)
          break

        case 'end':
          output = input
          break

        default:
          throw new Error(`Unknown node type: ${node.type}`)
      }

      // Update step
      step.status = 'completed'
      step.output = output
      step.endTime = new Date()

      // Store in variables
      this.state.variables[nodeId] = output

      // Notify progress
      this.notifyProgress()
      await this.saveState()

      // Execute next nodes
      if (node.type !== 'end') {
        const nextEdges = this.definition.edges.filter(e => e.source === nodeId)

        for (const edge of nextEdges) {
          await this.executeNode(edge.target, output)
        }
      }

      return output
    } catch (error: any) {
      // Auto-recovery logic
      if (this.recoveryConfig.autoRecoveryEnabled) {
        const recovery = this.analyzeErrorForRecovery(error, node.type)

        if (recovery.canRecover && (step.retryCount || 0) < this.recoveryConfig.maxRetries) {
          // Mark as retrying
          step.status = 'retrying'
          step.retryCount = (step.retryCount || 0) + 1
          step.error = `Retry ${step.retryCount}/${this.recoveryConfig.maxRetries}: ${error.message}`
          this.notifyProgress()

          // Wait with backoff
          await this.sleep(recovery.delay, step.retryCount - 1)

          // Apply recovery strategy and retry
          const recoveredInput = this.applyRecoveryStrategy(recovery.strategy, node, input)

          // Recursive retry
          return this.executeNode(nodeId, recoveredInput)
        }
      }

      // No recovery possible or max retries exceeded
      step.status = 'failed'
      step.error = error.message
      step.endTime = new Date()
      if (step.retryCount && step.retryCount > 0) {
        step.error = `Failed after ${step.retryCount} retries: ${error.message}`
      }
      this.notifyProgress()
      await this.saveState()
      throw error
    }
  }

  private async executeAIAgent(node: WorkflowNode, input: any): Promise<any> {
    const prompt = node.config.prompt || ''
    const fullPrompt = `${prompt}\n\nInput Data: ${JSON.stringify(input, null, 2)}`

    const result = await nexusService.executeWorkflow({
      type: 'Nexus',
      prompt: fullPrompt,
      model: node.config.model || 'claude-3-5-sonnet-20241022',
    })

    // Update tokens and cost
    const step = this.state.steps.find(s => s.nodeId === node.id)!
    step.tokensUsed = result.tokensUsed
    step.costUSD = result.costUSD
    this.state.totalTokens += result.tokensUsed
    this.state.totalCost += result.costUSD

    if (!result.success) {
      throw new Error(result.error || 'AI execution failed')
    }

    return {
      text: result.output,
      rawInput: input,
    }
  }

  private async executeCondition(node: WorkflowNode, input: any): Promise<any> {
    // Safe condition evaluation using whitelist-based expression parser
    // SECURITY: Replaced dangerous new Function() with safe expression evaluator
    const condition = node.config.condition || 'true'

    try {
      // Use safe expression evaluator - blocks code injection attacks
      const result = evaluateCondition(condition, input)
      return {
        condition: result,
        input,
      }
    } catch (error) {
      if (error instanceof SafeExpressionError) {
        // Log security-relevant errors for monitoring
        console.warn(`[SECURITY] Blocked unsafe condition expression: ${condition}`, error.message)
        throw new Error(`Condition evaluation blocked: ${error.message}`)
      }
      throw new Error(`Condition evaluation failed: ${error}`)
    }
  }

  private async executeDataTransform(node: WorkflowNode, input: any): Promise<any> {
    // SECURITY: Replaced dangerous new Function() with safe transform operations
    // Supports both new safe operations and migrated legacy transforms

    try {
      // Prefer new safe transform operations
      if (node.config.transformOperations && node.config.transformOperations.length > 0) {
        return transformData(input, node.config.transformOperations)
      }

      // Handle legacy transformCode with migration attempt
      const transformCode = node.config.transformCode || 'return input'

      // Try to parse legacy transform into safe operations
      const safeOperations = parseLegacyTransform(transformCode)

      if (safeOperations !== null) {
        // Successfully converted to safe operations
        return transformData(input, safeOperations)
      }

      // Legacy code cannot be safely converted - log and block
      console.warn(
        `[SECURITY] Blocked unsafe transform code in node ${node.id}. ` +
        `Legacy transformCode must be migrated to transformOperations. ` +
        `Code: ${transformCode.substring(0, 100)}...`
      )
      throw new SafeExpressionError(
        'Transform code uses unsupported patterns. Please migrate to transformOperations for security. ' +
        'Supported operations: pick, omit, rename, map_field, filter, default, flatten, merge, expression.'
      )
    } catch (error) {
      if (error instanceof SafeExpressionError) {
        throw new Error(`Transform blocked: ${error.message}`)
      }
      throw new Error(`Transform failed: ${error}`)
    }
  }

  private async executeAPICall(node: WorkflowNode, input: any): Promise<any> {
    const url = node.config.apiUrl
    if (!url) {
      throw new Error('API URL not configured')
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }

    return await response.json()
  }

  private async executeLoop(node: WorkflowNode, input: any): Promise<any> {
    const count = node.config.loopCount || 1
    const results = []

    for (let i = 0; i < count; i++) {
      // Find nodes connected to this loop
      const loopEdges = this.definition.edges.filter(e => e.source === node.id)

      for (const edge of loopEdges) {
        const result = await this.executeNode(edge.target, { ...input, loopIndex: i })
        results.push(result)
      }
    }

    return results
  }

  private notifyProgress() {
    if (this.onProgress) {
      this.onProgress({ ...this.state })
    }
  }

  private async saveState() {
    // Save execution state to database
    try {
      await supabase
        .from('workflow_executions')
        .update({
          execution_data: {
            state: this.state,
            definition: this.definition,
          },
          status: this.state.status,
          token_usage: this.state.totalTokens,
          cost_usd: this.state.totalCost,
        })
        .eq('id', this.state.executionId)
    } catch (error) {
      console.error('Failed to save workflow state:', error)
    }
  }

  getState(): WorkflowExecutionState {
    return { ...this.state }
  }
}

// Re-export TransformOperation for consumers who need to build transforms
export type { TransformOperation }

// Re-export safe expression utilities for direct use
export { evaluateCondition, transformData, SafeExpressionError }

// Helper to create a simple workflow from template
export function createWorkflowFromTemplate(_templateId?: string): WorkflowDefinition {
  // Simple single-agent workflow
  return {
    nodes: [
      {
        id: 'start',
        type: 'start',
        label: 'Start',
        config: {},
        position: { x: 100, y: 100 },
      },
      {
        id: 'agent1',
        type: 'ai-agent',
        label: 'AI Agent',
        config: {
          prompt: 'Process the input',
          model: 'claude-3-5-sonnet-20241022',
        },
        position: { x: 300, y: 100 },
      },
      {
        id: 'end',
        type: 'end',
        label: 'End',
        config: {},
        position: { x: 500, y: 100 },
      },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'agent1' },
      { id: 'e2', source: 'agent1', target: 'end' },
    ],
  }
}

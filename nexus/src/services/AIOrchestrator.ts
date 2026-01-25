/**
 * AIOrchestrator - Smart AI Model Selection and Workflow Optimization
 *
 * This service intelligently routes requests to the most appropriate AI models
 * and optimizes workflows for cost, speed, and quality.
 *
 * Features:
 * - Dynamic model selection based on task complexity
 * - Cost optimization routing
 * - Multi-model orchestration for complex tasks
 * - Quality vs speed vs cost tradeoffs
 * - Learning from execution history
 */

// Model capabilities and pricing
interface AIModel {
  id: string
  name: string
  provider: 'anthropic' | 'openai' | 'google' | 'local'
  capabilities: ModelCapability[]
  costPer1kTokensInput: number
  costPer1kTokensOutput: number
  maxTokens: number
  speedTier: 'fast' | 'medium' | 'slow'
  qualityTier: 'basic' | 'standard' | 'premium' | 'expert'
  specializations: string[]
}

type ModelCapability =
  | 'text_generation'
  | 'code_generation'
  | 'analysis'
  | 'reasoning'
  | 'vision'
  | 'function_calling'
  | 'long_context'
  | 'real_time'
  | 'creative'
  | 'structured_output'

// Task classification
interface TaskAnalysis {
  complexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'expert'
  requiredCapabilities: ModelCapability[]
  estimatedTokens: number
  timeSensitivity: 'immediate' | 'normal' | 'flexible'
  qualityRequirement: 'basic' | 'standard' | 'high' | 'critical'
  domain: string[]
  costSensitivity: 'low' | 'medium' | 'high'
}

// Routing decision
interface RoutingDecision {
  primaryModel: AIModel
  fallbackModel?: AIModel
  reasoning: string
  estimatedCost: number
  estimatedDuration: number
  confidence: number
}

// Execution strategy
interface ExecutionStrategy {
  mode: 'single' | 'chain' | 'parallel' | 'cascade' | 'ensemble'
  steps: ExecutionStep[]
  totalEstimatedCost: number
  totalEstimatedTime: number
}

interface ExecutionStep {
  id: string
  model: AIModel
  task: string
  dependsOn: string[]
  timeout: number
  retryStrategy: 'none' | 'same_model' | 'fallback_model'
}

// Optimization preferences
interface OptimizationPreferences {
  prioritize: 'cost' | 'speed' | 'quality' | 'balanced'
  maxCostUsd: number
  maxTimeMs: number
  minQualityTier: AIModel['qualityTier']
  preferredProviders?: AIModel['provider'][]
  avoidProviders?: AIModel['provider'][]
}

// Available models registry
const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    capabilities: ['text_generation', 'code_generation', 'analysis', 'reasoning', 'function_calling', 'long_context', 'creative', 'structured_output'],
    costPer1kTokensInput: 0.015,   // $15/1M tokens
    costPer1kTokensOutput: 0.075,  // $75/1M tokens
    maxTokens: 200000,
    speedTier: 'medium',
    qualityTier: 'expert',
    specializations: ['complex_reasoning', 'creative_writing', 'code_review', 'analysis', 'critical_decisions', 'multi_step_analysis']
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    capabilities: ['text_generation', 'code_generation', 'analysis', 'reasoning', 'function_calling', 'long_context', 'creative', 'structured_output'],
    costPer1kTokensInput: 0.003,   // $3/1M tokens
    costPer1kTokensOutput: 0.015,  // $15/1M tokens
    maxTokens: 200000,
    speedTier: 'fast',
    qualityTier: 'premium',
    specializations: ['general', 'coding', 'analysis', 'workflow_planning', 'content_generation', 'translation']
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude Haiku 3.5',
    provider: 'anthropic',
    capabilities: ['text_generation', 'code_generation', 'function_calling', 'structured_output'],
    costPer1kTokensInput: 0.00025,  // $0.25/1M tokens
    costPer1kTokensOutput: 0.00125, // $1.25/1M tokens
    maxTokens: 200000,
    speedTier: 'fast',
    qualityTier: 'standard',
    specializations: ['quick_tasks', 'classification', 'extraction', 'status_updates', 'simple_qa']
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    capabilities: ['text_generation', 'code_generation', 'analysis', 'reasoning', 'vision', 'function_calling', 'real_time'],
    costPer1kTokensInput: 0.005,
    costPer1kTokensOutput: 0.015,
    maxTokens: 128000,
    speedTier: 'fast',
    qualityTier: 'premium',
    specializations: ['multimodal', 'real_time', 'general']
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    capabilities: ['text_generation', 'code_generation', 'function_calling', 'vision'],
    costPer1kTokensInput: 0.00015,
    costPer1kTokensOutput: 0.0006,
    maxTokens: 128000,
    speedTier: 'fast',
    qualityTier: 'basic',
    specializations: ['quick_tasks', 'simple_queries']
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    capabilities: ['text_generation', 'code_generation', 'analysis', 'vision', 'function_calling', 'long_context'],
    costPer1kTokensInput: 0.000075,
    costPer1kTokensOutput: 0.0003,
    maxTokens: 1000000,
    speedTier: 'fast',
    qualityTier: 'standard',
    specializations: ['long_context', 'multimodal', 'fast_inference']
  }
]

/**
 * AI Orchestrator Service
 */
export class AIOrchestrator {
  private models: AIModel[] = AVAILABLE_MODELS
  private executionHistory: Array<{
    taskAnalysis: TaskAnalysis
    decision: RoutingDecision
    actualCost: number
    actualDuration: number
    success: boolean
    userSatisfaction?: number
  }> = []

  /**
   * Analyze a task and determine its requirements
   */
  analyzeTask(request: string, _context?: Record<string, unknown>): TaskAnalysis {
    void _context // Reserved for context-aware analysis
    const lowerRequest = request.toLowerCase()

    // Determine complexity
    let complexity: TaskAnalysis['complexity'] = 'moderate'

    // Trivial: Simple greetings, basic questions
    if (lowerRequest.length < 50 && !lowerRequest.includes('analyze') && !lowerRequest.includes('create')) {
      complexity = 'trivial'
    }
    // Simple: Short requests, single-step tasks
    else if (lowerRequest.length < 200 && !lowerRequest.includes('multiple') && !lowerRequest.includes('complex')) {
      complexity = 'simple'
    }
    // Complex: Multi-step tasks, requires reasoning
    else if (
      lowerRequest.includes('analyze') ||
      lowerRequest.includes('compare') ||
      lowerRequest.includes('evaluate') ||
      lowerRequest.includes('plan') ||
      lowerRequest.includes('strategy')
    ) {
      complexity = 'complex'
    }
    // Expert: Highly specialized, requires deep expertise
    else if (
      lowerRequest.includes('architecture') ||
      lowerRequest.includes('optimize') ||
      lowerRequest.includes('security audit') ||
      lowerRequest.includes('legal') ||
      lowerRequest.includes('financial analysis')
    ) {
      complexity = 'expert'
    }

    // Determine required capabilities
    const requiredCapabilities: ModelCapability[] = ['text_generation']

    if (lowerRequest.includes('code') || lowerRequest.includes('function') || lowerRequest.includes('programming')) {
      requiredCapabilities.push('code_generation')
    }
    if (lowerRequest.includes('analyze') || lowerRequest.includes('review') || lowerRequest.includes('evaluate')) {
      requiredCapabilities.push('analysis')
    }
    if (lowerRequest.includes('reason') || lowerRequest.includes('think') || lowerRequest.includes('why')) {
      requiredCapabilities.push('reasoning')
    }
    if (lowerRequest.includes('image') || lowerRequest.includes('picture') || lowerRequest.includes('screenshot')) {
      requiredCapabilities.push('vision')
    }
    if (lowerRequest.includes('call') || lowerRequest.includes('api') || lowerRequest.includes('tool')) {
      requiredCapabilities.push('function_calling')
    }
    if (lowerRequest.includes('creative') || lowerRequest.includes('write') || lowerRequest.includes('story')) {
      requiredCapabilities.push('creative')
    }

    // Estimate token usage
    const estimatedTokens = Math.max(
      500,
      request.length * 2 + // Input approximation
      (complexity === 'trivial' ? 200 :
       complexity === 'simple' ? 500 :
       complexity === 'moderate' ? 1500 :
       complexity === 'complex' ? 3000 : 5000) // Output approximation
    )

    // Determine time sensitivity
    let timeSensitivity: TaskAnalysis['timeSensitivity'] = 'normal'
    if (lowerRequest.includes('urgent') || lowerRequest.includes('immediately') || lowerRequest.includes('asap')) {
      timeSensitivity = 'immediate'
    }
    if (lowerRequest.includes('when you can') || lowerRequest.includes('no rush')) {
      timeSensitivity = 'flexible'
    }

    // Determine quality requirement
    let qualityRequirement: TaskAnalysis['qualityRequirement'] = 'standard'
    if (complexity === 'expert' || lowerRequest.includes('critical') || lowerRequest.includes('important')) {
      qualityRequirement = 'critical'
    } else if (complexity === 'complex' || lowerRequest.includes('thorough')) {
      qualityRequirement = 'high'
    } else if (complexity === 'trivial') {
      qualityRequirement = 'basic'
    }

    // Detect domain
    const domain: string[] = []
    if (lowerRequest.includes('flight') || lowerRequest.includes('hotel') || lowerRequest.includes('travel')) {
      domain.push('travel')
    }
    if (lowerRequest.includes('payment') || lowerRequest.includes('money') || lowerRequest.includes('transfer')) {
      domain.push('finance')
    }
    if (lowerRequest.includes('email') || lowerRequest.includes('message') || lowerRequest.includes('notification')) {
      domain.push('communication')
    }
    if (lowerRequest.includes('code') || lowerRequest.includes('programming') || lowerRequest.includes('develop')) {
      domain.push('software')
    }
    if (lowerRequest.includes('schedule') || lowerRequest.includes('calendar') || lowerRequest.includes('meeting')) {
      domain.push('scheduling')
    }

    return {
      complexity,
      requiredCapabilities,
      estimatedTokens,
      timeSensitivity,
      qualityRequirement,
      domain,
      costSensitivity: 'medium' // Default, can be overridden
    }
  }

  /**
   * Select the optimal model for a task
   */
  selectModel(
    taskAnalysis: TaskAnalysis,
    preferences: OptimizationPreferences = { prioritize: 'balanced', maxCostUsd: 1, maxTimeMs: 30000, minQualityTier: 'standard' }
  ): RoutingDecision {
    // Filter models by capabilities
    let eligibleModels = this.models.filter(model =>
      taskAnalysis.requiredCapabilities.every(cap => model.capabilities.includes(cap))
    )

    // Filter by provider preferences
    if (preferences.preferredProviders?.length) {
      const preferred = eligibleModels.filter(m => preferences.preferredProviders!.includes(m.provider))
      if (preferred.length > 0) eligibleModels = preferred
    }
    if (preferences.avoidProviders?.length) {
      eligibleModels = eligibleModels.filter(m => !preferences.avoidProviders!.includes(m.provider))
    }

    // Filter by quality tier
    const qualityOrder = ['basic', 'standard', 'premium', 'expert']
    const minQualityIndex = qualityOrder.indexOf(preferences.minQualityTier)
    eligibleModels = eligibleModels.filter(m => qualityOrder.indexOf(m.qualityTier) >= minQualityIndex)

    if (eligibleModels.length === 0) {
      // Fallback to any capable model
      eligibleModels = this.models.filter(model =>
        taskAnalysis.requiredCapabilities.every(cap => model.capabilities.includes(cap))
      )
    }

    // Score models based on task and preferences
    const scoredModels = eligibleModels.map(model => {
      let score = 0
      const estimatedCost = this.estimateCost(model, taskAnalysis.estimatedTokens)

      // Cost scoring (lower is better)
      if (preferences.prioritize === 'cost') {
        score -= estimatedCost * 100
      } else {
        score -= estimatedCost * 20
      }

      // Speed scoring
      if (preferences.prioritize === 'speed' || taskAnalysis.timeSensitivity === 'immediate') {
        if (model.speedTier === 'fast') score += 30
        else if (model.speedTier === 'medium') score += 15
      }

      // Quality scoring
      if (preferences.prioritize === 'quality' || taskAnalysis.qualityRequirement === 'critical') {
        if (model.qualityTier === 'expert') score += 50
        else if (model.qualityTier === 'premium') score += 35
        else if (model.qualityTier === 'standard') score += 20
      }

      // Complexity matching
      if (taskAnalysis.complexity === 'expert' && model.qualityTier === 'expert') {
        score += 40
      }
      if (taskAnalysis.complexity === 'trivial' && model.qualityTier === 'basic') {
        score += 30 // Don't overkill for simple tasks
      }

      // Specialization bonus
      const specializationMatch = model.specializations.filter(s =>
        taskAnalysis.domain.some(d => s.includes(d) || d.includes(s))
      ).length
      score += specializationMatch * 15

      // Cost limit check
      if (estimatedCost > preferences.maxCostUsd) {
        score -= 1000
      }

      return { model, score, estimatedCost }
    })

    // Sort by score
    scoredModels.sort((a, b) => b.score - a.score)

    const selected = scoredModels[0]
    const fallback = scoredModels.length > 1 ? scoredModels[1] : undefined

    // Estimate duration based on speed tier and task complexity
    const baseDuration = taskAnalysis.complexity === 'trivial' ? 500 :
                         taskAnalysis.complexity === 'simple' ? 1500 :
                         taskAnalysis.complexity === 'moderate' ? 3000 :
                         taskAnalysis.complexity === 'complex' ? 8000 : 15000

    const speedMultiplier = selected.model.speedTier === 'fast' ? 0.7 :
                            selected.model.speedTier === 'medium' ? 1 : 1.5

    return {
      primaryModel: selected.model,
      fallbackModel: fallback?.model,
      reasoning: this.generateReasoning(taskAnalysis, selected.model, preferences),
      estimatedCost: selected.estimatedCost,
      estimatedDuration: baseDuration * speedMultiplier,
      confidence: selected.score > 50 ? 0.9 : selected.score > 20 ? 0.75 : 0.6
    }
  }

  /**
   * Create an execution strategy for complex multi-step tasks
   */
  createExecutionStrategy(
    steps: Array<{ task: string; dependsOn?: string[] }>,
    preferences: OptimizationPreferences
  ): ExecutionStrategy {
    const executionSteps: ExecutionStep[] = []
    let totalCost = 0
    let totalTime = 0

    for (const step of steps) {
      const analysis = this.analyzeTask(step.task)
      const routing = this.selectModel(analysis, preferences)

      const execStep: ExecutionStep = {
        id: `step_${executionSteps.length + 1}`,
        model: routing.primaryModel,
        task: step.task,
        dependsOn: step.dependsOn || [],
        timeout: Math.min(routing.estimatedDuration * 3, preferences.maxTimeMs),
        retryStrategy: routing.fallbackModel ? 'fallback_model' : 'same_model'
      }

      executionSteps.push(execStep)
      totalCost += routing.estimatedCost
      totalTime += routing.estimatedDuration
    }

    // Determine execution mode
    let mode: ExecutionStrategy['mode'] = 'chain'
    const hasDependencies = steps.some(s => s.dependsOn && s.dependsOn.length > 0)
    const parallelizable = !hasDependencies && steps.length > 1

    if (parallelizable) {
      mode = 'parallel'
      totalTime = Math.max(...executionSteps.map(() => 3000)) // Parallel execution time
    } else if (steps.length === 1) {
      mode = 'single'
    }

    return {
      mode,
      steps: executionSteps,
      totalEstimatedCost: totalCost,
      totalEstimatedTime: totalTime
    }
  }

  /**
   * Estimate cost for a model and token count
   */
  private estimateCost(model: AIModel, estimatedTokens: number): number {
    // Assume 30% input, 70% output (typical for generation tasks)
    const inputTokens = estimatedTokens * 0.3
    const outputTokens = estimatedTokens * 0.7

    return (inputTokens / 1000) * model.costPer1kTokensInput +
           (outputTokens / 1000) * model.costPer1kTokensOutput
  }

  /**
   * Generate reasoning for model selection
   */
  private generateReasoning(
    task: TaskAnalysis,
    model: AIModel,
    preferences: OptimizationPreferences
  ): string {
    const reasons: string[] = []

    reasons.push(`Task complexity: ${task.complexity}`)
    reasons.push(`Selected ${model.name} (${model.qualityTier} tier, ${model.speedTier} speed)`)

    if (task.requiredCapabilities.length > 1) {
      reasons.push(`Requires: ${task.requiredCapabilities.join(', ')}`)
    }

    if (preferences.prioritize !== 'balanced') {
      reasons.push(`Optimized for: ${preferences.prioritize}`)
    }

    return reasons.join('. ')
  }

  /**
   * Learn from execution history to improve future routing
   */
  recordExecution(
    taskAnalysis: TaskAnalysis,
    decision: RoutingDecision,
    actualCost: number,
    actualDuration: number,
    success: boolean,
    userSatisfaction?: number
  ): void {
    this.executionHistory.push({
      taskAnalysis,
      decision,
      actualCost,
      actualDuration,
      success,
      userSatisfaction
    })

    // Keep last 1000 executions for analysis
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(-1000)
    }
  }

  /**
   * Get performance statistics
   */
  getStatistics(): {
    totalExecutions: number
    successRate: number
    avgCostAccuracy: number
    avgDurationAccuracy: number
    avgSatisfaction: number
  } {
    if (this.executionHistory.length === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        avgCostAccuracy: 0,
        avgDurationAccuracy: 0,
        avgSatisfaction: 0
      }
    }

    const successful = this.executionHistory.filter(e => e.success)
    const withSatisfaction = this.executionHistory.filter(e => e.userSatisfaction !== undefined)

    return {
      totalExecutions: this.executionHistory.length,
      successRate: successful.length / this.executionHistory.length,
      avgCostAccuracy: this.executionHistory.reduce((sum, e) =>
        sum + (1 - Math.abs(e.decision.estimatedCost - e.actualCost) / Math.max(e.decision.estimatedCost, e.actualCost)), 0
      ) / this.executionHistory.length,
      avgDurationAccuracy: this.executionHistory.reduce((sum, e) =>
        sum + (1 - Math.abs(e.decision.estimatedDuration - e.actualDuration) / Math.max(e.decision.estimatedDuration, e.actualDuration)), 0
      ) / this.executionHistory.length,
      avgSatisfaction: withSatisfaction.length > 0
        ? withSatisfaction.reduce((sum, e) => sum + (e.userSatisfaction || 0), 0) / withSatisfaction.length
        : 0
    }
  }

  /**
   * Get all available models
   */
  getModels(): AIModel[] {
    return [...this.models]
  }

  /**
   * Find optimal model for specific task type
   * Aligned with backend model tiering system
   */
  findBestModelFor(taskType: 'travel_booking' | 'code_generation' | 'analysis' | 'quick_task' | 'creative' | 'classification' | 'extraction' | 'workflow_planning' | 'complex_reasoning'): AIModel {
    switch (taskType) {
      // Haiku tier - fast and cheap ($0.25/1M)
      case 'quick_task':
      case 'classification':
      case 'extraction':
        return this.models.find(m => m.id === 'claude-3-5-haiku-20241022') || this.models[0]

      // Sonnet tier - balanced ($3/1M)
      case 'travel_booking':
      case 'code_generation':
      case 'workflow_planning':
        return this.models.find(m => m.id === 'claude-sonnet-4-20250514') || this.models[0]

      // Opus tier - premium ($15/1M)
      case 'analysis':
      case 'complex_reasoning':
      case 'creative':
        return this.models.find(m => m.id === 'claude-opus-4-20250514') || this.models[0]

      default:
        // Default to Sonnet for unknown tasks
        return this.models.find(m => m.id === 'claude-sonnet-4-20250514') || this.models[0]
    }
  }
}

// Singleton instance
export const aiOrchestrator = new AIOrchestrator()

export default AIOrchestrator

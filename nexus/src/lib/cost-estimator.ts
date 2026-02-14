/**
 * Cost Estimator Library
 *
 * Provides pre-execution cost estimates based on workflow complexity.
 * Uses Claude API pricing as the baseline.
 */

// Token pricing (as of 2025 - update as needed)
export const PRICING = {
  // Claude Sonnet 4 (fast model)
  'claude-sonnet-4-20250514': {
    input: 0.003, // $3 per 1M input tokens
    output: 0.015, // $15 per 1M output tokens
    name: 'Claude Sonnet 4',
  },
  // Claude 3.5 Haiku (economy model)
  'claude-3-5-haiku-20241022': {
    input: 0.00025, // $0.25 per 1M input tokens
    output: 0.00125, // $1.25 per 1M output tokens
    name: 'Claude 3.5 Haiku',
  },
  // Claude Opus 4.6 (default premium model)
  'claude-opus-4-6-20250115': {
    input: 0.015, // $15 per 1M input tokens
    output: 0.075, // $75 per 1M output tokens
    name: 'Claude Opus 4.6',
  },
  // Legacy Opus 4.5 ID (backward compatibility)
  'claude-opus-4-5-20251101': {
    input: 0.015, // $15 per 1M input tokens
    output: 0.075, // $75 per 1M output tokens
    name: 'Claude Opus 4.5',
  },
} as const

export type ModelId = keyof typeof PRICING

// Workflow complexity factors
export interface WorkflowComplexity {
  stepCount: number
  hasConditionals: boolean
  hasLoops: boolean
  hasDataTransforms: boolean
  hasExternalAPIs: boolean
  inputSize: 'small' | 'medium' | 'large'
  outputExpectation: 'brief' | 'moderate' | 'verbose'
}

// Cost estimate result
export interface CostEstimate {
  estimatedTokens: {
    input: number
    output: number
    total: number
  }
  estimatedCost: {
    min: number
    max: number
    expected: number
  }
  breakdown: Array<{
    component: string
    tokens: number
    cost: number
  }>
  confidence: 'low' | 'medium' | 'high'
  model: string
  warnings?: string[]
}

// Token estimates for different workflow components
const TOKEN_ESTIMATES = {
  // Base tokens for workflow initialization
  base: {
    input: 500,
    output: 200,
  },
  // Per step estimates
  step: {
    simple: { input: 300, output: 150 },
    complex: { input: 800, output: 400 },
    ai_agent: { input: 1500, output: 800 },
  },
  // Conditional logic overhead
  conditional: {
    input: 200,
    output: 100,
  },
  // Loop overhead (per iteration estimate)
  loop: {
    input: 400,
    output: 200,
    multiplier: 3, // Assume average 3 iterations
  },
  // Data transform overhead
  dataTransform: {
    input: 600,
    output: 400,
  },
  // External API call overhead
  externalAPI: {
    input: 300,
    output: 500,
  },
  // Input size multipliers
  inputSize: {
    small: 1,
    medium: 2.5,
    large: 5,
  },
  // Output expectation multipliers
  outputMultiplier: {
    brief: 0.5,
    moderate: 1,
    verbose: 2,
  },
}

/**
 * Calculate token estimate for a workflow step
 */
export function estimateStepTokens(stepType: string): { input: number; output: number } {
  const type = stepType.toLowerCase()

  if (type.includes('ai') || type.includes('agent') || type.includes('chat')) {
    return TOKEN_ESTIMATES.step.ai_agent
  }
  if (type.includes('transform') || type.includes('data') || type.includes('parse')) {
    return TOKEN_ESTIMATES.step.complex
  }
  return TOKEN_ESTIMATES.step.simple
}

/**
 * Main cost estimation function
 */
export function estimateWorkflowCost(
  complexity: WorkflowComplexity,
  modelId: ModelId = 'claude-opus-4-6-20250115'
): CostEstimate {
  const pricing = PRICING[modelId]
  const breakdown: CostEstimate['breakdown'] = []
  let totalInput = 0
  let totalOutput = 0
  const warnings: string[] = []

  // Base tokens
  totalInput += TOKEN_ESTIMATES.base.input
  totalOutput += TOKEN_ESTIMATES.base.output
  breakdown.push({
    component: 'Base overhead',
    tokens: TOKEN_ESTIMATES.base.input + TOKEN_ESTIMATES.base.output,
    cost: (TOKEN_ESTIMATES.base.input * pricing.input + TOKEN_ESTIMATES.base.output * pricing.output) / 1000,
  })

  // Step tokens
  const stepEstimate = TOKEN_ESTIMATES.step.ai_agent // Assume AI steps for safety margin
  const stepInputTotal = stepEstimate.input * complexity.stepCount
  const stepOutputTotal = stepEstimate.output * complexity.stepCount
  totalInput += stepInputTotal
  totalOutput += stepOutputTotal
  breakdown.push({
    component: `${complexity.stepCount} workflow steps`,
    tokens: stepInputTotal + stepOutputTotal,
    cost: (stepInputTotal * pricing.input + stepOutputTotal * pricing.output) / 1000,
  })

  // Conditionals
  if (complexity.hasConditionals) {
    totalInput += TOKEN_ESTIMATES.conditional.input
    totalOutput += TOKEN_ESTIMATES.conditional.output
    breakdown.push({
      component: 'Conditional logic',
      tokens: TOKEN_ESTIMATES.conditional.input + TOKEN_ESTIMATES.conditional.output,
      cost: (TOKEN_ESTIMATES.conditional.input * pricing.input + TOKEN_ESTIMATES.conditional.output * pricing.output) / 1000,
    })
  }

  // Loops
  if (complexity.hasLoops) {
    const loopTokens = (TOKEN_ESTIMATES.loop.input + TOKEN_ESTIMATES.loop.output) * TOKEN_ESTIMATES.loop.multiplier
    totalInput += TOKEN_ESTIMATES.loop.input * TOKEN_ESTIMATES.loop.multiplier
    totalOutput += TOKEN_ESTIMATES.loop.output * TOKEN_ESTIMATES.loop.multiplier
    breakdown.push({
      component: 'Loop processing (~3 iterations)',
      tokens: loopTokens,
      cost: (TOKEN_ESTIMATES.loop.input * TOKEN_ESTIMATES.loop.multiplier * pricing.input +
        TOKEN_ESTIMATES.loop.output * TOKEN_ESTIMATES.loop.multiplier * pricing.output) / 1000,
    })
    warnings.push('Loop cost may vary based on actual iteration count')
  }

  // Data transforms
  if (complexity.hasDataTransforms) {
    totalInput += TOKEN_ESTIMATES.dataTransform.input
    totalOutput += TOKEN_ESTIMATES.dataTransform.output
    breakdown.push({
      component: 'Data transformation',
      tokens: TOKEN_ESTIMATES.dataTransform.input + TOKEN_ESTIMATES.dataTransform.output,
      cost: (TOKEN_ESTIMATES.dataTransform.input * pricing.input + TOKEN_ESTIMATES.dataTransform.output * pricing.output) / 1000,
    })
  }

  // External APIs
  if (complexity.hasExternalAPIs) {
    totalInput += TOKEN_ESTIMATES.externalAPI.input
    totalOutput += TOKEN_ESTIMATES.externalAPI.output
    breakdown.push({
      component: 'External API integration',
      tokens: TOKEN_ESTIMATES.externalAPI.input + TOKEN_ESTIMATES.externalAPI.output,
      cost: (TOKEN_ESTIMATES.externalAPI.input * pricing.input + TOKEN_ESTIMATES.externalAPI.output * pricing.output) / 1000,
    })
    warnings.push('External API costs not included in this estimate')
  }

  // Apply input size multiplier
  const inputMultiplier = TOKEN_ESTIMATES.inputSize[complexity.inputSize]
  if (inputMultiplier > 1) {
    totalInput = Math.round(totalInput * inputMultiplier)
    breakdown.push({
      component: `${complexity.inputSize} input size adjustment`,
      tokens: 0,
      cost: 0,
    })
  }

  // Apply output multiplier
  const outputMultiplier = TOKEN_ESTIMATES.outputMultiplier[complexity.outputExpectation]
  totalOutput = Math.round(totalOutput * outputMultiplier)

  // Calculate costs
  const inputCost = (totalInput * pricing.input) / 1000
  const outputCost = (totalOutput * pricing.output) / 1000
  const expectedCost = inputCost + outputCost

  // Calculate min/max range (25% variance)
  const variance = 0.25
  const minCost = expectedCost * (1 - variance)
  const maxCost = expectedCost * (1 + variance)

  // Determine confidence level
  let confidence: CostEstimate['confidence'] = 'high'
  if (complexity.hasLoops || complexity.inputSize === 'large') {
    confidence = 'medium'
  }
  if (complexity.hasLoops && complexity.inputSize === 'large') {
    confidence = 'low'
  }

  return {
    estimatedTokens: {
      input: totalInput,
      output: totalOutput,
      total: totalInput + totalOutput,
    },
    estimatedCost: {
      min: minCost,
      max: maxCost,
      expected: expectedCost,
    },
    breakdown,
    confidence,
    model: pricing.name,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.001) return '<$0.001'
  if (cost < 0.01) return `~$${cost.toFixed(3)}`
  if (cost < 1) return `~$${cost.toFixed(2)}`
  return `~$${cost.toFixed(2)}`
}

/**
 * Format cost range for display
 */
export function formatCostRange(min: number, max: number): string {
  return `${formatCost(min)} - ${formatCost(max)}`
}

/**
 * Quick estimate for simple workflows
 */
export function quickEstimate(
  stepCount: number,
  modelId: ModelId = 'claude-opus-4-6-20250115'
): string {
  const estimate = estimateWorkflowCost(
    {
      stepCount,
      hasConditionals: false,
      hasLoops: false,
      hasDataTransforms: false,
      hasExternalAPIs: false,
      inputSize: 'small',
      outputExpectation: 'moderate',
    },
    modelId
  )

  return formatCost(estimate.estimatedCost.expected)
}

/**
 * Analyze workflow definition and return complexity
 */
export function analyzeWorkflowComplexity(
  workflowDefinition: {
    nodes?: Array<{ type: string; data?: any }>
    steps?: Array<{ type: string; config?: any }>
    input?: string | Record<string, any>
  }
): WorkflowComplexity {
  const nodes = workflowDefinition.nodes || workflowDefinition.steps || []

  return {
    stepCount: nodes.length || 1,
    hasConditionals: nodes.some(n =>
      n.type?.toLowerCase().includes('condition') ||
      n.type?.toLowerCase().includes('if') ||
      n.type?.toLowerCase().includes('branch')
    ),
    hasLoops: nodes.some(n =>
      n.type?.toLowerCase().includes('loop') ||
      n.type?.toLowerCase().includes('foreach') ||
      n.type?.toLowerCase().includes('iterate')
    ),
    hasDataTransforms: nodes.some(n =>
      n.type?.toLowerCase().includes('transform') ||
      n.type?.toLowerCase().includes('parse') ||
      n.type?.toLowerCase().includes('map')
    ),
    hasExternalAPIs: nodes.some(n =>
      n.type?.toLowerCase().includes('http') ||
      n.type?.toLowerCase().includes('api') ||
      n.type?.toLowerCase().includes('webhook')
    ),
    inputSize: estimateInputSize(workflowDefinition.input),
    outputExpectation: 'moderate',
  }
}

/**
 * Estimate input size from input data
 */
function estimateInputSize(input: string | Record<string, any> | undefined): 'small' | 'medium' | 'large' {
  if (!input) return 'small'

  const inputStr = typeof input === 'string' ? input : JSON.stringify(input)
  const charCount = inputStr.length

  if (charCount < 500) return 'small'
  if (charCount < 2000) return 'medium'
  return 'large'
}

/**
 * Component for displaying cost estimate
 */
export interface CostEstimateDisplayProps {
  estimate: CostEstimate
  showBreakdown?: boolean
}

// Export utility for React components
export function useCostEstimate(
  workflowDefinition: Parameters<typeof analyzeWorkflowComplexity>[0] | null,
  modelId: ModelId = 'claude-opus-4-6-20250115'
): CostEstimate | null {
  if (!workflowDefinition) return null

  const complexity = analyzeWorkflowComplexity(workflowDefinition)
  return estimateWorkflowCost(complexity, modelId)
}

export default {
  estimateWorkflowCost,
  analyzeWorkflowComplexity,
  quickEstimate,
  formatCost,
  formatCostRange,
  PRICING,
}

/**
 * useToolChainOptimizer - React Hook for Tool Chain Optimization
 *
 * Provides reactive access to the tool chain optimizer with:
 * - Workflow goal analysis
 * - Chain generation with loading states
 * - Chain comparison utilities
 * - User preference handling
 */

import { useState, useCallback, useRef } from 'react'
import { toolChainOptimizerService } from '../services/ToolChainOptimizerService'
import {
  DEFAULT_OPTIMIZATION_CRITERIA
} from '../types/tools'
import type {
  ToolChain,
  ChainOptimizationRequest,
  ChainOptimizationResult,
  ChainOptimizationCriteria,
  ChainComparison,
  WorkflowAnalysis,
  DataFlowCompatibility
} from '../types/tools'

interface UseToolChainOptimizerOptions {
  userId: string
  projectId?: string
  defaultCriteria?: Partial<ChainOptimizationCriteria>
  onOptimizationStart?: () => void
  onOptimizationComplete?: (result: ChainOptimizationResult) => void
  onError?: (error: Error) => void
}

interface UseToolChainOptimizerReturn {
  // Data
  result: ChainOptimizationResult | null
  recommendedChain: ToolChain | null
  alternatives: ToolChain[]
  comparison: ChainComparison | null
  workflowAnalysis: WorkflowAnalysis | null

  // State
  loading: boolean
  error: string | null
  generationTimeMs: number | null

  // Actions
  optimize: (goal: string, options?: OptimizeOptions) => Promise<ChainOptimizationResult | null>
  selectChain: (chainId: string) => void
  recordSuccess: (chain: ToolChain, executionTimeMs: number, costUsd: number) => Promise<void>
  recordFailure: (chain: ToolChain) => Promise<void>
  checkDataFlow: (sourceSchema: Record<string, unknown>, targetSchema: Record<string, unknown>) => DataFlowCompatibility

  // Criteria management
  criteria: ChainOptimizationCriteria
  updateCriteria: (newCriteria: Partial<ChainOptimizationCriteria>) => void
  resetCriteria: () => void

  // Clear
  clearResult: () => void
}

interface OptimizeOptions {
  maxSteps?: number
  preferredTools?: string[]
  excludedTools?: string[]
  budgetLimitUsd?: number
  timeLimitMs?: number
}

export function useToolChainOptimizer(options: UseToolChainOptimizerOptions): UseToolChainOptimizerReturn {
  const {
    userId,
    projectId,
    defaultCriteria,
    onOptimizationStart,
    onOptimizationComplete,
    onError
  } = options

  // State
  const [result, setResult] = useState<ChainOptimizationResult | null>(null)
  const [_selectedChainId, setSelectedChainId] = useState<string | null>(null)
  void _selectedChainId // Suppress unused variable warning - setter used for chain selection
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generationTimeMs, setGenerationTimeMs] = useState<number | null>(null)
  const [criteria, setCriteria] = useState<ChainOptimizationCriteria>({
    ...DEFAULT_OPTIMIZATION_CRITERIA,
    ...defaultCriteria
  })

  // Prevent overlapping optimizations
  const optimizationInProgress = useRef(false)

  /**
   * Optimize a tool chain for a workflow goal
   */
  const optimize = useCallback(async (
    goal: string,
    optimizeOptions?: OptimizeOptions
  ): Promise<ChainOptimizationResult | null> => {
    if (optimizationInProgress.current) {
      return null
    }

    optimizationInProgress.current = true
    setLoading(true)
    setError(null)
    setGenerationTimeMs(null)

    onOptimizationStart?.()

    try {
      const request: ChainOptimizationRequest = {
        workflowGoal: goal,
        userId,
        projectId,
        criteria,
        ...optimizeOptions
      }

      const optimizationResult = await toolChainOptimizerService.optimizeChain(request)

      setResult(optimizationResult)
      setGenerationTimeMs(optimizationResult.generationTimeMs)
      setSelectedChainId(optimizationResult.recommendedChain.id)

      onOptimizationComplete?.(optimizationResult)

      return optimizationResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Optimization failed'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return null
    } finally {
      setLoading(false)
      optimizationInProgress.current = false
    }
  }, [userId, projectId, criteria, onOptimizationStart, onOptimizationComplete, onError])

  /**
   * Select a chain from the alternatives
   */
  const selectChain = useCallback((chainId: string) => {
    setSelectedChainId(chainId)
  }, [])

  /**
   * Record a successful chain execution
   */
  const recordSuccess = useCallback(async (
    chain: ToolChain,
    executionTimeMs: number,
    costUsd: number
  ): Promise<void> => {
    try {
      await toolChainOptimizerService.storeSuccessfulPattern(
        chain,
        executionTimeMs,
        costUsd,
        userId,
        projectId
      )
    } catch (err) {
      console.error('[useToolChainOptimizer] Failed to record success:', err)
    }
  }, [userId, projectId])

  /**
   * Record a failed chain execution
   */
  const recordFailure = useCallback(async (chain: ToolChain): Promise<void> => {
    try {
      await toolChainOptimizerService.recordChainFailure(chain, userId)
    } catch (err) {
      console.error('[useToolChainOptimizer] Failed to record failure:', err)
    }
  }, [userId])

  /**
   * Check data flow compatibility between schemas
   */
  const checkDataFlow = useCallback((
    sourceSchema: Record<string, unknown>,
    targetSchema: Record<string, unknown>
  ): DataFlowCompatibility => {
    return toolChainOptimizerService.checkDataFlowCompatibility(sourceSchema, targetSchema)
  }, [])

  /**
   * Update optimization criteria
   */
  const updateCriteria = useCallback((newCriteria: Partial<ChainOptimizationCriteria>) => {
    setCriteria(prev => ({
      ...prev,
      ...newCriteria
    }))
  }, [])

  /**
   * Reset criteria to defaults
   */
  const resetCriteria = useCallback(() => {
    setCriteria({
      ...DEFAULT_OPTIMIZATION_CRITERIA,
      ...defaultCriteria
    })
  }, [defaultCriteria])

  /**
   * Clear the optimization result
   */
  const clearResult = useCallback(() => {
    setResult(null)
    setSelectedChainId(null)
    setError(null)
    setGenerationTimeMs(null)
  }, [])

  // Computed values
  const recommendedChain = result?.recommendedChain || null
  const alternatives = result?.alternatives || []
  const comparison = result?.comparison || null
  const workflowAnalysis = result?.workflowAnalysis || null

  return {
    result,
    recommendedChain,
    alternatives,
    comparison,
    workflowAnalysis,
    loading,
    error,
    generationTimeMs,
    optimize,
    selectChain,
    recordSuccess,
    recordFailure,
    checkDataFlow,
    criteria,
    updateCriteria,
    resetCriteria,
    clearResult
  }
}

/**
 * Hook for quick workflow analysis without full optimization
 */
export function useWorkflowAnalysis() {
  const [analysis, setAnalysis] = useState<WorkflowAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = useCallback(async (goal: string): Promise<WorkflowAnalysis | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await toolChainOptimizerService.analyzeWorkflowGoal(goal)
      setAnalysis(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setAnalysis(null)
    setError(null)
  }, [])

  return {
    analysis,
    loading,
    error,
    analyze,
    clear
  }
}

/**
 * Hook for chain comparison display
 */
export function useChainComparison(chains: ToolChain[]) {
  const [expandedAlternatives, setExpandedAlternatives] = useState(false)

  const toggleAlternatives = useCallback(() => {
    setExpandedAlternatives(prev => !prev)
  }, [])

  const getComparisonData = useCallback(() => {
    if (chains.length === 0) return null

    const metrics = [
      {
        label: 'Estimated Cost',
        getValue: (chain: ToolChain) => `$${chain.totalEstimatedCostUsd.toFixed(4)}`,
        getBestIndex: () => chains.reduce((best, chain, i) =>
          chain.totalEstimatedCostUsd < chains[best].totalEstimatedCostUsd ? i : best, 0)
      },
      {
        label: 'Estimated Time',
        getValue: (chain: ToolChain) => `${(chain.totalEstimatedTimeMs / 1000).toFixed(1)}s`,
        getBestIndex: () => chains.reduce((best, chain, i) =>
          chain.totalEstimatedTimeMs < chains[best].totalEstimatedTimeMs ? i : best, 0)
      },
      {
        label: 'Reliability',
        getValue: (chain: ToolChain) => `${chain.reliabilityScore}%`,
        getBestIndex: () => chains.reduce((best, chain, i) =>
          chain.reliabilityScore > chains[best].reliabilityScore ? i : best, 0)
      },
      {
        label: 'Steps',
        getValue: (chain: ToolChain) => chain.steps.length.toString(),
        getBestIndex: () => chains.reduce((best, chain, i) =>
          chain.steps.length < chains[best].steps.length ? i : best, 0)
      },
      {
        label: 'Overall Score',
        getValue: (chain: ToolChain) => chain.optimizationScore.toString(),
        getBestIndex: () => chains.reduce((best, chain, i) =>
          chain.optimizationScore > chains[best].optimizationScore ? i : best, 0)
      }
    ]

    return metrics.map(metric => ({
      label: metric.label,
      values: chains.map((chain, index) => ({
        value: metric.getValue(chain),
        isBest: index === metric.getBestIndex()
      }))
    }))
  }, [chains])

  return {
    expandedAlternatives,
    toggleAlternatives,
    comparisonData: getComparisonData()
  }
}

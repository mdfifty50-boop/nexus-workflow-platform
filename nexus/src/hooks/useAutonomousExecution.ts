/**
 * useAutonomousExecution React Hooks
 *
 * Provides React hooks for autonomous workflow execution control,
 * progress monitoring, error handling, and results management.
 *
 * Story 16.8 Implementation
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  AutonomousExecutionState,
  AutonomousExecutionConfig,
  ExecutionPhase,
  CriticalError,
  CriticalErrorDecision,
  PartialResult,
  ExecutionResult,
  ExecutionLogEntry,
  CompletionNotification,
  ExecutionProgressUpdate,
  AutonomousExecutionMetrics,
  AutonomousExecutionCallbacks,
  StartExecutionRequest,
  CancelExecutionRequest,
  ResumeExecutionRequest,
} from '../types/tools'
// DEFAULT_AUTONOMOUS_EXECUTION_CONFIG is available from types if needed
import { autonomousExecutionControllerService } from '../services/AutonomousExecutionControllerService'

// ============================================================================
// useAutonomousExecution - Main execution control hook
// ============================================================================

export interface UseAutonomousExecutionOptions {
  workflowId: string
  userId: string
  projectId: string
  config?: Partial<AutonomousExecutionConfig>
  autoStart?: boolean
  onProgress?: (update: ExecutionProgressUpdate) => void
  onPhaseChange?: (phase: ExecutionPhase, state: AutonomousExecutionState) => void
  onCriticalError?: (error: CriticalError) => void
  onCompletion?: (notification: CompletionNotification) => void
}

export interface UseAutonomousExecutionReturn {
  // State
  executionId: string | null
  state: AutonomousExecutionState | null
  isRunning: boolean
  isPaused: boolean
  isCompleted: boolean
  isCancelled: boolean
  isFailed: boolean

  // Actions
  start: (inputs?: Record<string, unknown>) => Promise<boolean>
  cancel: (reason: string) => Promise<boolean>
  resume: (decision: CriticalErrorDecision) => Promise<boolean>

  // Data
  progress: number
  currentPhase: ExecutionPhase | null
  currentStep: string
  criticalError: CriticalError | null
  partialResults: PartialResult[]
  finalResults: ExecutionResult | null

  // Cost tracking
  currentCost: number
  estimatedTotalCost: number

  // Loading states
  isStarting: boolean
  isCancelling: boolean
  isResuming: boolean

  // Errors
  error: string | null
}

export function useAutonomousExecution(options: UseAutonomousExecutionOptions): UseAutonomousExecutionReturn {
  const {
    workflowId,
    userId,
    projectId,
    config,
    autoStart = false,
    onProgress,
    onPhaseChange,
    onCriticalError,
    onCompletion
  } = options

  // State
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [state, setState] = useState<AutonomousExecutionState | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs for callbacks
  const callbacksRef = useRef<AutonomousExecutionCallbacks>({})

  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = {
      onProgress: (update: ExecutionProgressUpdate) => {
        // Update local state
        setState(prev => prev ? {
          ...prev,
          progress: update.progress,
          phase: update.phase,
          currentStepIndex: update.stepIndex,
          currentStepName: update.stepName,
          status: update.status,
          currentCost: update.currentCost || prev.currentCost
        } : null)
        onProgress?.(update)
      },
      onPhaseChange: (phase: ExecutionPhase, newState: AutonomousExecutionState) => {
        setState(newState)
        onPhaseChange?.(phase, newState)
      },
      onCriticalError: (err: CriticalError) => {
        setState(prev => prev ? { ...prev, criticalError: err, status: 'paused', phase: 'paused' } : null)
        onCriticalError?.(err)
      },
      onCompletion: (notification: CompletionNotification) => {
        // Refresh final state
        if (executionId) {
          const finalState = autonomousExecutionControllerService.getExecutionState(executionId)
          if (finalState) setState(finalState)
        }
        onCompletion?.(notification)
      },
      onCancellation: () => {
        setState(prev => prev ? { ...prev, status: 'cancelled', phase: 'cancelled' } : null)
      }
    }
  }, [executionId, onProgress, onPhaseChange, onCriticalError, onCompletion])

  // Register callbacks when executionId changes
  useEffect(() => {
    if (executionId) {
      autonomousExecutionControllerService.registerCallbacks(executionId, callbacksRef.current)
      return () => {
        autonomousExecutionControllerService.unregisterCallbacks(executionId)
      }
    }
  }, [executionId])

  // Start execution
  const start = useCallback(async (inputs?: Record<string, unknown>): Promise<boolean> => {
    setIsStarting(true)
    setError(null)

    try {
      const request: StartExecutionRequest = {
        workflowId,
        userId,
        projectId,
        config,
        initialInputs: inputs
      }

      const result = await autonomousExecutionControllerService.startAutonomousExecution(request)

      if (result.success && result.executionId && result.state) {
        setExecutionId(result.executionId)
        setState(result.state)
        return true
      } else {
        setError(result.error || 'Failed to start execution')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    } finally {
      setIsStarting(false)
    }
  }, [workflowId, userId, projectId, config])

  // Cancel execution
  const cancel = useCallback(async (reason: string): Promise<boolean> => {
    if (!executionId) {
      setError('No active execution to cancel')
      return false
    }

    setIsCancelling(true)
    setError(null)

    try {
      const request: CancelExecutionRequest = {
        executionId,
        reason,
        cancelledBy: userId,
        savePartialResults: true
      }

      const result = await autonomousExecutionControllerService.cancelExecution(request)

      if (result.success) {
        const updatedState = autonomousExecutionControllerService.getExecutionState(executionId)
        if (updatedState) setState(updatedState)
        return true
      } else {
        setError(result.error || 'Failed to cancel execution')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    } finally {
      setIsCancelling(false)
    }
  }, [executionId, userId])

  // Resume execution after critical error
  const resume = useCallback(async (decision: CriticalErrorDecision): Promise<boolean> => {
    if (!executionId) {
      setError('No active execution to resume')
      return false
    }

    setIsResuming(true)
    setError(null)

    try {
      const request: ResumeExecutionRequest = {
        executionId,
        decision
      }

      const result = await autonomousExecutionControllerService.resumeExecution(request)

      if (result.success && result.state) {
        setState(result.state)
        return true
      } else {
        setError(result.error || 'Failed to resume execution')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    } finally {
      setIsResuming(false)
    }
  }, [executionId])

  // Auto-start if configured
  useEffect(() => {
    if (autoStart && workflowId && userId && projectId && !executionId && !isStarting) {
      start()
    }
  }, [autoStart, workflowId, userId, projectId, executionId, isStarting, start])

  // Derived state
  const isRunning = state?.status === 'running'
  const isPaused = state?.status === 'paused'
  const isCompleted = state?.status === 'completed'
  const isCancelled = state?.status === 'cancelled'
  const isFailed = state?.status === 'failed'

  return {
    executionId,
    state,
    isRunning,
    isPaused,
    isCompleted,
    isCancelled,
    isFailed,
    start,
    cancel,
    resume,
    progress: state?.progress || 0,
    currentPhase: state?.phase || null,
    currentStep: state?.currentStepName || '',
    criticalError: state?.criticalError || null,
    partialResults: state?.partialResults || [],
    finalResults: state?.finalResults || null,
    currentCost: state?.currentCost || 0,
    estimatedTotalCost: state?.estimatedTotalCost || 0,
    isStarting,
    isCancelling,
    isResuming,
    error
  }
}

// ============================================================================
// useExecutionProgress - Real-time progress monitoring
// ============================================================================

export interface UseExecutionProgressOptions {
  executionId: string | null
  pollInterval?: number
}

export interface UseExecutionProgressReturn {
  progress: number
  phase: ExecutionPhase | null
  stepIndex: number
  stepName: string
  status: 'running' | 'paused' | 'completed' | 'cancelled' | 'failed' | null
  estimatedTimeRemaining: number | null
  currentCost: number
  lastUpdate: Date | null
}

export function useExecutionProgress(options: UseExecutionProgressOptions): UseExecutionProgressReturn {
  const { executionId, pollInterval = 1000 } = options

  const [progressData, setProgressData] = useState<UseExecutionProgressReturn>({
    progress: 0,
    phase: null,
    stepIndex: 0,
    stepName: '',
    status: null,
    estimatedTimeRemaining: null,
    currentCost: 0,
    lastUpdate: null
  })

  useEffect(() => {
    if (!executionId) return

    const updateProgress = () => {
      const state = autonomousExecutionControllerService.getExecutionState(executionId)
      if (state) {
        setProgressData({
          progress: state.progress,
          phase: state.phase,
          stepIndex: state.currentStepIndex,
          stepName: state.currentStepName,
          status: state.status,
          estimatedTimeRemaining: state.estimatedCompletionAt
            ? state.estimatedCompletionAt.getTime() - Date.now()
            : null,
          currentCost: state.currentCost,
          lastUpdate: new Date()
        })
      }
    }

    // Initial update
    updateProgress()

    // Poll for updates
    const interval = setInterval(updateProgress, pollInterval)

    return () => clearInterval(interval)
  }, [executionId, pollInterval])

  return progressData
}

// ============================================================================
// useCriticalErrors - Critical error handling
// ============================================================================

export interface UseCriticalErrorsOptions {
  executionId: string | null
  onError?: (error: CriticalError) => void
}

export interface UseCriticalErrorsReturn {
  criticalError: CriticalError | null
  hasError: boolean
  possibleActions: CriticalError['possibleActions']
  submitDecision: (actionId: string, inputValue?: string) => Promise<boolean>
  isSubmitting: boolean
}

export function useCriticalErrors(options: UseCriticalErrorsOptions): UseCriticalErrorsReturn {
  const { executionId, onError } = options

  const [criticalError, setCriticalError] = useState<CriticalError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Poll for critical errors
  useEffect(() => {
    if (!executionId) return

    const checkForError = () => {
      const state = autonomousExecutionControllerService.getExecutionState(executionId)
      if (state?.criticalError && !criticalError) {
        setCriticalError(state.criticalError)
        onError?.(state.criticalError)
      } else if (!state?.criticalError && criticalError) {
        setCriticalError(null)
      }
    }

    checkForError()
    const interval = setInterval(checkForError, 1000)

    return () => clearInterval(interval)
  }, [executionId, criticalError, onError])

  const submitDecision = useCallback(async (actionId: string, inputValue?: string): Promise<boolean> => {
    if (!executionId || !criticalError) return false

    setIsSubmitting(true)

    try {
      const decision: CriticalErrorDecision = {
        actionId,
        inputValue,
        decidedAt: new Date(),
        decidedBy: 'user' // Should come from auth context
      }

      const result = await autonomousExecutionControllerService.resumeExecution({
        executionId,
        decision
      })

      if (result.success) {
        setCriticalError(null)
        return true
      }

      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [executionId, criticalError])

  return {
    criticalError,
    hasError: !!criticalError,
    possibleActions: criticalError?.possibleActions || [],
    submitDecision,
    isSubmitting
  }
}

// ============================================================================
// useExecutionLog - Log viewing
// ============================================================================

export interface UseExecutionLogOptions {
  executionId: string | null
  level?: 'debug' | 'info' | 'warn' | 'error'
  limit?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UseExecutionLogReturn {
  logs: ExecutionLogEntry[]
  totalCount: number
  filteredCount: number
  refresh: () => void
  clear: () => void
  isLoading: boolean
}

export function useExecutionLog(options: UseExecutionLogOptions): UseExecutionLogReturn {
  const {
    executionId,
    level = 'info',
    limit = 100,
    autoRefresh = true,
    refreshInterval = 2000
  } = options

  const [logs, setLogs] = useState<ExecutionLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const levelPriority: Record<string, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  }

  const refresh = useCallback(() => {
    if (!executionId) return

    setIsLoading(true)
    try {
      const allLogs = autonomousExecutionControllerService.getExecutionLog(executionId)

      // Filter by level
      const filtered = allLogs.filter(log =>
        levelPriority[log.level] >= levelPriority[level]
      )

      // Apply limit
      const limited = filtered.slice(-limit)

      setLogs(limited)
    } finally {
      setIsLoading(false)
    }
  }, [executionId, level, limit])

  const clear = useCallback(() => {
    setLogs([])
  }, [])

  // Initial load and auto-refresh
  useEffect(() => {
    refresh()

    if (autoRefresh) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, autoRefresh, refreshInterval])

  const allLogs = executionId
    ? autonomousExecutionControllerService.getExecutionLog(executionId)
    : []

  return {
    logs,
    totalCount: allLogs.length,
    filteredCount: logs.length,
    refresh,
    clear,
    isLoading
  }
}

// ============================================================================
// usePartialResults - Partial results for cancelled/failed executions
// ============================================================================

export interface UsePartialResultsOptions {
  executionId: string | null
}

export interface UsePartialResultsReturn {
  results: PartialResult[]
  completedCount: number
  partialCount: number
  skippedCount: number
  hasResults: boolean
  getResultByStep: (stepIndex: number) => PartialResult | undefined
  getAllArtifacts: () => Array<{ stepIndex: number; artifact: PartialResult['artifacts'] extends (infer T)[] | undefined ? T : never }>
}

export function usePartialResults(options: UsePartialResultsOptions): UsePartialResultsReturn {
  const { executionId } = options

  const [results, setResults] = useState<PartialResult[]>([])

  // Fetch results
  useEffect(() => {
    if (!executionId) {
      setResults([])
      return
    }

    const fetchResults = () => {
      const partialResults = autonomousExecutionControllerService.getPartialResults(executionId)
      setResults(partialResults)
    }

    fetchResults()
    const interval = setInterval(fetchResults, 2000)

    return () => clearInterval(interval)
  }, [executionId])

  const completedCount = results.filter(r => r.status === 'completed').length
  const partialCount = results.filter(r => r.status === 'partial').length
  const skippedCount = results.filter(r => r.status === 'skipped').length

  const getResultByStep = useCallback((stepIndex: number) => {
    return results.find(r => r.stepIndex === stepIndex)
  }, [results])

  const getAllArtifacts = useCallback(() => {
    return results.flatMap(r =>
      (r.artifacts || []).map(a => ({ stepIndex: r.stepIndex, artifact: a }))
    )
  }, [results])

  return {
    results,
    completedCount,
    partialCount,
    skippedCount,
    hasResults: results.length > 0,
    getResultByStep,
    getAllArtifacts
  }
}

// ============================================================================
// useExecutionMetrics - Metrics monitoring
// ============================================================================

export interface UseExecutionMetricsReturn {
  metrics: AutonomousExecutionMetrics
  refresh: () => void
  reset: () => void
}

export function useExecutionMetrics(): UseExecutionMetricsReturn {
  const [metrics, setMetrics] = useState<AutonomousExecutionMetrics>(
    autonomousExecutionControllerService.getMetrics()
  )

  const refresh = useCallback(() => {
    setMetrics(autonomousExecutionControllerService.getMetrics())
  }, [])

  const reset = useCallback(() => {
    autonomousExecutionControllerService.resetMetrics()
    setMetrics(autonomousExecutionControllerService.getMetrics())
  }, [])

  // Auto-refresh metrics
  useEffect(() => {
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  return { metrics, refresh, reset }
}

// ============================================================================
// useRunningExecutions - Monitor all running executions
// ============================================================================

export interface UseRunningExecutionsReturn {
  executions: AutonomousExecutionState[]
  count: number
  refresh: () => void
}

export function useRunningExecutions(): UseRunningExecutionsReturn {
  const [executions, setExecutions] = useState<AutonomousExecutionState[]>([])

  const refresh = useCallback(() => {
    setExecutions(autonomousExecutionControllerService.getRunningExecutions())
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 2000)
    return () => clearInterval(interval)
  }, [refresh])

  return {
    executions,
    count: executions.length,
    refresh
  }
}

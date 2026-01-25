/**
 * useSelfHealing - React Hooks for Integration Self-Healing
 *
 * Provides reactive access to the self-healing service with:
 * - Healing session management
 * - Real-time healing progress tracking
 * - Circuit breaker status monitoring
 * - User escalation handling
 *
 * Story 16.6 Implementation
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { integrationSelfHealingService } from '../services/IntegrationSelfHealingService'
import type {
  SelfHealingRequest,
  SelfHealingSession,
  HealingResult,
  HealingUserOption,
  HealingStrategy,
  CircuitBreakerState,
  ErrorPattern,
  SelfHealingMetrics,
  ErrorClassification
} from '../types/tools'
import { HEALING_STRATEGY_MESSAGES } from '../types/tools'

interface UseSelfHealingOptions {
  autoHeal?: boolean
  onHealingStarted?: (sessionId: string) => void
  onHealingComplete?: (result: HealingResult) => void
  onEscalation?: (session: SelfHealingSession, options: HealingUserOption[]) => Promise<string>
  onError?: (error: Error) => void
}

interface UseSelfHealingReturn {
  // State
  isHealing: boolean
  currentSession: SelfHealingSession | null
  lastResult: HealingResult | null
  error: string | null

  // Actions
  heal: (request: SelfHealingRequest) => Promise<HealingResult>
  pauseHealing: () => void
  resumeHealing: () => void
  cancelHealing: () => void
  submitEscalationChoice: (optionId: string) => void

  // Session management
  getSession: (sessionId: string) => SelfHealingSession | null
  getActiveSessions: () => SelfHealingSession[]

  // Metrics
  metrics: SelfHealingMetrics
  transientResolutionRate: number

  // Utilities
  clearError: () => void
}

/**
 * Main hook for self-healing functionality
 */
export function useSelfHealing(options: UseSelfHealingOptions = {}): UseSelfHealingReturn {
  const {
    onHealingStarted,
    onHealingComplete,
    onEscalation,
    onError
  } = options

  // State
  const [isHealing, setIsHealing] = useState(false)
  const [currentSession, setCurrentSession] = useState<SelfHealingSession | null>(null)
  const [lastResult, setLastResult] = useState<HealingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<SelfHealingMetrics>(
    integrationSelfHealingService.getMetrics()
  )

  // Refs for callback handling
  const escalationResolverRef = useRef<((choice: string) => void) | null>(null)

  // Register escalation callback
  useEffect(() => {
    if (onEscalation) {
      integrationSelfHealingService.registerEscalationCallback(
        async (session, options) => {
          return new Promise<string>((resolve) => {
            escalationResolverRef.current = resolve
            onEscalation(session, options).then(resolve)
          })
        }
      )
    }
  }, [onEscalation])

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(integrationSelfHealingService.getMetrics())
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  /**
   * Initiate healing for an error
   */
  const heal = useCallback(async (request: SelfHealingRequest): Promise<HealingResult> => {
    setIsHealing(true)
    setError(null)

    try {
      const result = await integrationSelfHealingService.attemptHealing(request)

      setLastResult(result)

      // Update session tracking
      const sessions = integrationSelfHealingService.getActiveSessions()
      const activeSession = sessions.find(s => s.request === request)
      setCurrentSession(activeSession || null)

      onHealingStarted?.(activeSession?.id || '')

      if (result.success) {
        onHealingComplete?.(result)
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Healing failed'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))

      return {
        success: false,
        totalAttempts: 0,
        totalDurationMs: 0,
        originalError: request.error,
        finalError: request.error,
        attempts: [],
        resolvedBy: null,
        resolution: null,
        escalated: true,
        escalationReason: errorMessage,
        userOptions: null,
        patternId: null,
        confidenceScore: null
      }
    } finally {
      setIsHealing(false)
      setMetrics(integrationSelfHealingService.getMetrics())
    }
  }, [onHealingStarted, onHealingComplete, onError])

  /**
   * Pause current healing session
   */
  const pauseHealing = useCallback(() => {
    if (currentSession) {
      integrationSelfHealingService.pauseSession(currentSession.id)
      setCurrentSession(prev => prev ? { ...prev, isPaused: true } : null)
    }
  }, [currentSession])

  /**
   * Resume paused healing session
   */
  const resumeHealing = useCallback(() => {
    if (currentSession) {
      integrationSelfHealingService.resumeSession(currentSession.id)
      setCurrentSession(prev => prev ? { ...prev, isPaused: false } : null)
    }
  }, [currentSession])

  /**
   * Cancel current healing session
   */
  const cancelHealing = useCallback(() => {
    if (currentSession) {
      integrationSelfHealingService.cancelSession(currentSession.id)
      setCurrentSession(null)
      setIsHealing(false)
    }
  }, [currentSession])

  /**
   * Submit user's choice for escalation
   */
  const submitEscalationChoice = useCallback((optionId: string) => {
    if (escalationResolverRef.current) {
      escalationResolverRef.current(optionId)
      escalationResolverRef.current = null
    }
  }, [])

  /**
   * Get a specific session
   */
  const getSession = useCallback((sessionId: string): SelfHealingSession | null => {
    return integrationSelfHealingService.getSession(sessionId)
  }, [])

  /**
   * Get all active sessions
   */
  const getActiveSessions = useCallback((): SelfHealingSession[] => {
    return integrationSelfHealingService.getActiveSessions()
  }, [])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isHealing,
    currentSession,
    lastResult,
    error,
    heal,
    pauseHealing,
    resumeHealing,
    cancelHealing,
    submitEscalationChoice,
    getSession,
    getActiveSessions,
    metrics,
    transientResolutionRate: metrics.transientErrorResolutionRate,
    clearError
  }
}

/**
 * Hook for healing progress tracking
 */
export function useHealingProgress(session: SelfHealingSession | null) {
  const [progress, setProgress] = useState(0)
  const [currentStrategy, setCurrentStrategy] = useState<HealingStrategy | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [attemptNumber, setAttemptNumber] = useState(0)

  useEffect(() => {
    if (!session) {
      setProgress(0)
      setCurrentStrategy(null)
      setStatusMessage('')
      setAttemptNumber(0)
      return
    }

    setCurrentStrategy(session.currentStrategy)
    setAttemptNumber(session.currentAttempt)

    // Calculate progress based on attempts
    if (session.result) {
      setProgress(100)
      setStatusMessage(session.result.success
        ? session.result.resolution || 'Healing successful'
        : session.result.escalationReason || 'Healing failed')
    } else if (session.currentStrategy) {
      // Show in-progress message
      const messages = HEALING_STRATEGY_MESSAGES[session.currentStrategy]
      setStatusMessage(messages.inProgress)

      // Estimate progress (assumes max 3 attempts per strategy)
      const estimatedProgress = Math.min(
        90,
        (session.currentAttempt / 3) * 100
      )
      setProgress(estimatedProgress)
    } else {
      setStatusMessage('Analyzing error...')
      setProgress(10)
    }
  }, [session])

  const getStrategyLabel = useCallback((strategy: HealingStrategy): string => {
    const labels: Record<HealingStrategy, string> = {
      retry: 'Retrying',
      refresh_auth: 'Refreshing Auth',
      rate_limit_wait: 'Waiting for Rate Limit',
      schema_adapt: 'Adapting Schema',
      circuit_break: 'Circuit Breaker',
      reroute: 'Finding Alternative',
      escalate: 'Escalating'
    }
    return labels[strategy]
  }, [])

  return {
    progress,
    currentStrategy,
    statusMessage,
    attemptNumber,
    isComplete: session?.result !== null,
    isPaused: session?.isPaused || false,
    isActive: session?.isActive || false,
    getStrategyLabel
  }
}

/**
 * Hook for circuit breaker status monitoring
 */
export function useCircuitBreakerStatus(toolId: string) {
  const [state, setState] = useState<CircuitBreakerState>('closed')
  const [isOpen, setIsOpen] = useState(false)
  const [failureCount, setFailureCount] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [nextHalfOpenAt, setNextHalfOpenAt] = useState<string | null>(null)

  useEffect(() => {
    const updateStatus = () => {
      const currentState = integrationSelfHealingService.getCircuitBreakerState(toolId)
      setState(currentState)
      setIsOpen(currentState === 'open')

      const breakers = integrationSelfHealingService.getCircuitBreakers()
      const breaker = breakers.get(toolId)
      if (breaker) {
        setFailureCount(breaker.failureCount)
        setSuccessCount(breaker.successCount)
        setNextHalfOpenAt(breaker.nextHalfOpenAt)
      }
    }

    updateStatus()
    const interval = setInterval(updateStatus, 2000)
    return () => clearInterval(interval)
  }, [toolId])

  const getStateColor = useCallback((): string => {
    switch (state) {
      case 'closed':
        return 'green'
      case 'half_open':
        return 'yellow'
      case 'open':
        return 'red'
      default:
        return 'gray'
    }
  }, [state])

  const getStateLabel = useCallback((): string => {
    switch (state) {
      case 'closed':
        return 'Healthy'
      case 'half_open':
        return 'Testing Recovery'
      case 'open':
        return 'Protected (Service Unavailable)'
      default:
        return 'Unknown'
    }
  }, [state])

  const reset = useCallback(() => {
    integrationSelfHealingService.resetCircuitBreaker(toolId)
    setState('closed')
    setIsOpen(false)
    setFailureCount(0)
    setSuccessCount(0)
    setNextHalfOpenAt(null)
  }, [toolId])

  return {
    state,
    isOpen,
    isHalfOpen: state === 'half_open',
    isClosed: state === 'closed',
    failureCount,
    successCount,
    nextHalfOpenAt,
    getStateColor,
    getStateLabel,
    reset
  }
}

/**
 * Hook for escalation options handling
 */
export function useEscalationOptions(result: HealingResult | null) {
  const [options, setOptions] = useState<HealingUserOption[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isEscalated, setIsEscalated] = useState(false)
  const [reason, setReason] = useState<string | null>(null)

  useEffect(() => {
    if (!result) {
      setOptions([])
      setSelectedOption(null)
      setIsEscalated(false)
      setReason(null)
      return
    }

    setIsEscalated(result.escalated)
    setReason(result.escalationReason)
    setOptions(result.userOptions || [])
  }, [result])

  const getRecommendedOption = useCallback((): HealingUserOption | null => {
    return options.find(opt => opt.isRecommended) || null
  }, [options])

  const selectOption = useCallback((optionId: string) => {
    setSelectedOption(optionId)
  }, [])

  return {
    options,
    selectedOption,
    isEscalated,
    reason,
    getRecommendedOption,
    selectOption
  }
}

/**
 * Hook for healing metrics display
 */
export function useHealingMetrics() {
  const [metrics, setMetrics] = useState<SelfHealingMetrics>(
    integrationSelfHealingService.getMetrics()
  )
  const [patterns, setPatterns] = useState<ErrorPattern[]>([])

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(integrationSelfHealingService.getMetrics())
      setPatterns(integrationSelfHealingService.getLearnedPatterns())
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  const getStrategySuccessRate = useCallback((strategy: HealingStrategy): number => {
    const stats = metrics.strategyStats[strategy]
    const total = stats.successes + stats.failures
    return total > 0 ? stats.successes / total : 0
  }, [metrics])

  const getMostEffectiveStrategy = useCallback((): HealingStrategy | null => {
    let bestStrategy: HealingStrategy | null = null
    let bestRate = 0

    for (const [strategy, stats] of Object.entries(metrics.strategyStats)) {
      const total = stats.successes + stats.failures
      if (total > 0) {
        const rate = stats.successes / total
        if (rate > bestRate) {
          bestRate = rate
          bestStrategy = strategy as HealingStrategy
        }
      }
    }

    return bestStrategy
  }, [metrics])

  const reset = useCallback(() => {
    integrationSelfHealingService.resetMetrics()
    setMetrics(integrationSelfHealingService.getMetrics())
  }, [])

  const clearPatterns = useCallback(() => {
    integrationSelfHealingService.clearLearnedPatterns()
    setPatterns([])
  }, [])

  // Check if meeting NFR-16.2.2 (95% resolution rate)
  const isNfrCompliant = metrics.transientErrorResolutionRate >= 0.95

  return {
    metrics,
    patterns,
    totalAttempts: metrics.totalHealingAttempts,
    successfulHealings: metrics.successfulHealings,
    failedHealings: metrics.failedHealings,
    escalations: metrics.escalations,
    resolutionRate: metrics.transientErrorResolutionRate,
    circuitBreakerTrips: metrics.circuitBreakerTrips,
    avgRecoveryTimeMs: metrics.avgRecoveryTimeMs,
    patternsLearned: metrics.patternsLearned,
    patternMatchRate: metrics.patternMatchRate,
    isNfrCompliant,
    getStrategySuccessRate,
    getMostEffectiveStrategy,
    reset,
    clearPatterns
  }
}

/**
 * Hook for auto-healing integration with other services
 */
export function useAutoHealing(options: {
  enabled?: boolean
  onAutoHealStart?: () => void
  onAutoHealComplete?: (result: HealingResult) => void
} = {}) {
  const { enabled = true, onAutoHealStart, onAutoHealComplete } = options
  const [autoHealAttempts, setAutoHealAttempts] = useState(0)
  const [lastAutoHealResult, setLastAutoHealResult] = useState<HealingResult | null>(null)

  const attemptAutoHeal = useCallback(async (
    error: ErrorClassification,
    toolId: string,
    toolName: string,
    operationId: string,
    operationType: string,
    retryOperation?: () => Promise<unknown>
  ): Promise<HealingResult | null> => {
    if (!enabled) {
      return null
    }

    onAutoHealStart?.()
    setAutoHealAttempts(prev => prev + 1)

    try {
      const result = await integrationSelfHealingService.attemptHealing({
        error,
        toolId,
        toolName,
        operationId,
        operationType,
        retryOperation
      })

      setLastAutoHealResult(result)
      onAutoHealComplete?.(result)

      return result
    } catch (err) {
      console.error('Auto-heal failed:', err)
      return null
    }
  }, [enabled, onAutoHealStart, onAutoHealComplete])

  const resetAutoHealStats = useCallback(() => {
    setAutoHealAttempts(0)
    setLastAutoHealResult(null)
  }, [])

  return {
    enabled,
    autoHealAttempts,
    lastAutoHealResult,
    attemptAutoHeal,
    resetAutoHealStats
  }
}

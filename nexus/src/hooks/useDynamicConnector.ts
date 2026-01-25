/**
 * useDynamicConnector - React Hook for Dynamic Integration Connector
 *
 * Provides reactive access to the connector service with:
 * - Connection establishment and management
 * - Data flow execution
 * - Chain execution with progress tracking
 * - Error handling with user-friendly messages
 *
 * Story 16.5 Implementation
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { dynamicIntegrationConnectorService } from '../services/DynamicIntegrationConnectorService'
import type {
  ToolChain,
  IntegrationConnection,
  ConnectionResult,
  ConnectionTestResult,
  DataFlowExecution,
  DataFlowRequest,
  ChainExecutionResult,
  ChainPreflightResult,
  EstablishConnectionRequest,
  ErrorClassification
} from '../types/tools'

interface UseDynamicConnectorOptions {
  autoConnect?: boolean
  retryOnFailure?: boolean
  onConnectionEstablished?: (connection: IntegrationConnection) => void
  onConnectionFailed?: (error: ErrorClassification) => void
  onDataFlowComplete?: (execution: DataFlowExecution) => void
  onChainComplete?: (result: ChainExecutionResult) => void
  onError?: (error: Error) => void
}

interface UseDynamicConnectorReturn {
  // Connection state
  connections: Map<string, IntegrationConnection>
  activeConnection: IntegrationConnection | null

  // Status
  loading: boolean
  connecting: boolean
  executing: boolean
  error: string | null

  // Connection actions
  connect: (request: EstablishConnectionRequest) => Promise<ConnectionResult>
  disconnect: (connectionId: string) => Promise<void>
  testConnection: (connection: IntegrationConnection) => Promise<ConnectionTestResult>

  // Data flow actions
  executeDataFlow: (request: DataFlowRequest) => Promise<DataFlowExecution>

  // Chain actions
  runPreflight: (chain: ToolChain) => Promise<ChainPreflightResult>
  executeChain: (chain: ToolChain, userId: string, projectId?: string) => Promise<ChainExecutionResult>

  // Metrics
  successRate: number
  avgConnectionTimeMs: number

  // Clear state
  clearError: () => void
  clearConnections: () => void
}

/**
 * Main hook for dynamic integration connector
 */
export function useDynamicConnector(options: UseDynamicConnectorOptions = {}): UseDynamicConnectorReturn {
  const {
    retryOnFailure = true,
    onConnectionEstablished,
    onConnectionFailed,
    onDataFlowComplete,
    onChainComplete,
    onError
  } = options

  // State
  const [connections, setConnections] = useState<Map<string, IntegrationConnection>>(new Map())
  const [activeConnection, setActiveConnection] = useState<IntegrationConnection | null>(null)
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successRate, setSuccessRate] = useState(1)
  const [avgConnectionTimeMs, setAvgConnectionTimeMs] = useState(0)

  // Prevent overlapping operations
  const operationInProgress = useRef(false)

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      const metrics = dynamicIntegrationConnectorService.getMetrics()
      setSuccessRate(dynamicIntegrationConnectorService.getFirstAttemptSuccessRate())
      setAvgConnectionTimeMs(metrics.avgConnectionTimeMs)
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  /**
   * Establish a connection to a tool
   */
  const connect = useCallback(async (request: EstablishConnectionRequest): Promise<ConnectionResult> => {
    if (operationInProgress.current) {
      return {
        success: false,
        error: {
          errorType: 'UNKNOWN',
          isTransient: false,
          isRetryable: false,
          suggestedAction: 'retry',
          userMessage: 'Another operation is in progress',
          technicalMessage: 'Operation already in progress'
        },
        establishTimeMs: 0
      }
    }

    operationInProgress.current = true
    setConnecting(true)
    setError(null)

    try {
      const result = await dynamicIntegrationConnectorService.establishConnection(request)

      if (result.success && result.connection) {
        setConnections(prev => {
          const next = new Map(prev)
          next.set(result.connection!.id, result.connection!)
          return next
        })
        setActiveConnection(result.connection)
        onConnectionEstablished?.(result.connection)
      } else {
        if (result.error) {
          setError(result.error.userMessage)
          onConnectionFailed?.(result.error)

          // Retry if enabled and error is retryable
          if (retryOnFailure && result.error.isRetryable) {
            // Would implement retry logic here
          }
        }
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return {
        success: false,
        error: {
          errorType: 'UNKNOWN',
          isTransient: false,
          isRetryable: false,
          suggestedAction: 'abort',
          userMessage: errorMessage,
          technicalMessage: errorMessage
        },
        establishTimeMs: 0
      }
    } finally {
      setConnecting(false)
      operationInProgress.current = false
    }
  }, [retryOnFailure, onConnectionEstablished, onConnectionFailed, onError])

  /**
   * Disconnect a connection
   */
  const disconnect = useCallback(async (connectionId: string): Promise<void> => {
    try {
      await dynamicIntegrationConnectorService.disconnectConnection(connectionId)
      setConnections(prev => {
        const next = new Map(prev)
        next.delete(connectionId)
        return next
      })
      if (activeConnection?.id === connectionId) {
        setActiveConnection(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnect failed'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    }
  }, [activeConnection, onError])

  /**
   * Test a connection's health
   */
  const testConnection = useCallback(async (connection: IntegrationConnection): Promise<ConnectionTestResult> => {
    setLoading(true)
    setError(null)

    try {
      const result = await dynamicIntegrationConnectorService.testConnection(connection)

      if (!result.success && result.error) {
        setError(result.error.userMessage)
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Test failed'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return {
        success: false,
        connectionId: connection.id,
        toolId: connection.toolId,
        toolName: connection.toolName,
        testsRun: [],
        passedCount: 0,
        failedCount: 1,
        totalTimeMs: 0,
        error: {
          errorType: 'UNKNOWN',
          isTransient: false,
          isRetryable: false,
          suggestedAction: 'abort',
          userMessage: errorMessage,
          technicalMessage: errorMessage
        }
      }
    } finally {
      setLoading(false)
    }
  }, [onError])

  /**
   * Execute data flow between two tools
   */
  const executeDataFlow = useCallback(async (request: DataFlowRequest): Promise<DataFlowExecution> => {
    if (operationInProgress.current) {
      return {
        id: '',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        sourceToolId: request.sourceConnection.toolId,
        sourceToolName: request.sourceConnection.toolName,
        targetToolId: request.targetConnection.toolId,
        targetToolName: request.targetConnection.toolName,
        status: 'failed',
        recordsExtracted: 0,
        recordsTransformed: 0,
        recordsInjected: 0,
        recordsFailed: 0,
        extractTimeMs: null,
        transformTimeMs: null,
        injectTimeMs: null,
        totalTimeMs: 0,
        dataIntegrityValid: false,
        integrityErrors: ['Another operation is in progress'],
        retryCount: 0,
        error: {
          errorType: 'UNKNOWN',
          isTransient: false,
          isRetryable: false,
          suggestedAction: 'retry',
          userMessage: 'Another operation is in progress',
          technicalMessage: 'Operation already in progress'
        }
      }
    }

    operationInProgress.current = true
    setExecuting(true)
    setError(null)

    try {
      const execution = await dynamicIntegrationConnectorService.executeDataFlow(request)

      if (execution.status === 'failed' && execution.error) {
        setError(execution.error.userMessage)
      } else {
        onDataFlowComplete?.(execution)
      }

      return execution
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Data flow failed'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return {
        id: '',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        sourceToolId: request.sourceConnection.toolId,
        sourceToolName: request.sourceConnection.toolName,
        targetToolId: request.targetConnection.toolId,
        targetToolName: request.targetConnection.toolName,
        status: 'failed',
        recordsExtracted: 0,
        recordsTransformed: 0,
        recordsInjected: 0,
        recordsFailed: 0,
        extractTimeMs: null,
        transformTimeMs: null,
        injectTimeMs: null,
        totalTimeMs: 0,
        dataIntegrityValid: false,
        integrityErrors: [errorMessage],
        retryCount: 0
      }
    } finally {
      setExecuting(false)
      operationInProgress.current = false
    }
  }, [onDataFlowComplete, onError])

  /**
   * Run pre-flight checks for a chain
   */
  const runPreflight = useCallback(async (chain: ToolChain): Promise<ChainPreflightResult> => {
    setLoading(true)
    setError(null)

    try {
      const result = await dynamicIntegrationConnectorService.runPreflightChecks(chain)

      if (!result.success) {
        setError(result.blockers.join('; '))
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Pre-flight check failed'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return {
        chainId: chain.id,
        success: false,
        connectionTests: [],
        allConnectionsValid: false,
        schemaValidations: [],
        allSchemasCompatible: false,
        estimatedTimeMs: 0,
        estimatedCostUsd: 0,
        warnings: [],
        recommendations: [],
        readyForExecution: false,
        blockers: [errorMessage]
      }
    } finally {
      setLoading(false)
    }
  }, [onError])

  /**
   * Execute a complete tool chain
   */
  const executeChain = useCallback(async (
    chain: ToolChain,
    userId: string,
    projectId?: string
  ): Promise<ChainExecutionResult> => {
    if (operationInProgress.current) {
      return {
        id: '',
        chainId: chain.id,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: 'failed',
        stepResults: [],
        completedSteps: 0,
        totalSteps: chain.steps.length,
        totalTimeMs: 0,
        totalCostUsd: 0,
        totalRecordsProcessed: 0,
        errors: [{
          stepIndex: 0,
          toolId: '',
          errorClassification: {
            errorType: 'UNKNOWN',
            isTransient: false,
            isRetryable: false,
            suggestedAction: 'retry',
            userMessage: 'Another operation is in progress',
            technicalMessage: 'Operation already in progress'
          },
          timestamp: new Date().toISOString(),
          resolved: false
        }],
        hasRecoverableError: false
      }
    }

    operationInProgress.current = true
    setExecuting(true)
    setError(null)

    try {
      const result = await dynamicIntegrationConnectorService.executeChain(chain, userId, projectId)

      if (result.status === 'failed') {
        const errorMsg = result.errors[0]?.errorClassification.userMessage || 'Chain execution failed'
        setError(errorMsg)
      } else {
        onChainComplete?.(result)
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chain execution failed'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return {
        id: '',
        chainId: chain.id,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: 'failed',
        stepResults: [],
        completedSteps: 0,
        totalSteps: chain.steps.length,
        totalTimeMs: 0,
        totalCostUsd: 0,
        totalRecordsProcessed: 0,
        errors: [],
        hasRecoverableError: false
      }
    } finally {
      setExecuting(false)
      operationInProgress.current = false
    }
  }, [onChainComplete, onError])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Clear all connections
   */
  const clearConnections = useCallback(() => {
    setConnections(new Map())
    setActiveConnection(null)
    dynamicIntegrationConnectorService.clearCache()
  }, [])

  return {
    connections,
    activeConnection,
    loading,
    connecting,
    executing,
    error,
    connect,
    disconnect,
    testConnection,
    executeDataFlow,
    runPreflight,
    executeChain,
    successRate,
    avgConnectionTimeMs,
    clearError,
    clearConnections
  }
}

/**
 * Hook for connection status monitoring
 */
export function useConnectionStatus(connection: IntegrationConnection | null) {
  const [status, setStatus] = useState(connection?.status || 'disconnected')
  const [lastTested, setLastTested] = useState<string | null>(connection?.lastTestedAt || null)
  const [isHealthy, setIsHealthy] = useState(true)

  useEffect(() => {
    if (!connection) {
      setStatus('disconnected')
      setLastTested(null)
      setIsHealthy(false)
      return
    }

    setStatus(connection.status)
    setLastTested(connection.lastTestedAt)
    setIsHealthy(connection.status === 'connected' || connection.status === 'active')
  }, [connection])

  const getStatusColor = useCallback(() => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'green'
      case 'connecting':
      case 'authenticating':
      case 'testing':
        return 'yellow'
      case 'error':
      case 'stale':
        return 'red'
      default:
        return 'gray'
    }
  }, [status])

  const getStatusText = useCallback(() => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'active':
        return 'Active'
      case 'connecting':
        return 'Connecting...'
      case 'authenticating':
        return 'Authenticating...'
      case 'testing':
        return 'Testing...'
      case 'error':
        return 'Error'
      case 'stale':
        return 'Stale'
      case 'disconnected':
      default:
        return 'Disconnected'
    }
  }, [status])

  return {
    status,
    lastTested,
    isHealthy,
    getStatusColor,
    getStatusText
  }
}

/**
 * Hook for chain execution progress tracking
 */
export function useChainProgress(execution: ChainExecutionResult | null) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!execution) {
      setProgress(0)
      setCurrentStep(null)
      setIsComplete(false)
      setHasError(false)
      return
    }

    const progressPercent = execution.totalSteps > 0
      ? (execution.completedSteps / execution.totalSteps) * 100
      : 0
    setProgress(progressPercent)

    // Find current executing step
    const executingStep = execution.stepResults.find(
      s => s.status === 'connecting' || s.status === 'executing'
    )
    setCurrentStep(executingStep?.toolName || null)

    setIsComplete(execution.status === 'completed')
    setHasError(execution.status === 'failed' || execution.errors.length > 0)
  }, [execution])

  return {
    progress,
    currentStep,
    isComplete,
    hasError,
    completedSteps: execution?.completedSteps || 0,
    totalSteps: execution?.totalSteps || 0,
    errors: execution?.errors || []
  }
}

/**
 * Hook for data flow execution status
 */
export function useDataFlowStatus(execution: DataFlowExecution | null) {
  const [status, setStatus] = useState<DataFlowExecution['status']>('pending')
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState({
    extracted: 0,
    transformed: 0,
    injected: 0,
    failed: 0
  })

  useEffect(() => {
    if (!execution) {
      setStatus('pending')
      setProgress(0)
      setStats({ extracted: 0, transformed: 0, injected: 0, failed: 0 })
      return
    }

    setStatus(execution.status)
    setStats({
      extracted: execution.recordsExtracted,
      transformed: execution.recordsTransformed,
      injected: execution.recordsInjected,
      failed: execution.recordsFailed
    })

    // Calculate progress based on status
    switch (execution.status) {
      case 'extracting':
        setProgress(25)
        break
      case 'transforming':
        setProgress(50)
        break
      case 'injecting':
        setProgress(75)
        break
      case 'completed':
        setProgress(100)
        break
      case 'failed':
        setProgress(0)
        break
      default:
        setProgress(0)
    }
  }, [execution])

  const getPhaseLabel = useCallback(() => {
    switch (status) {
      case 'extracting':
        return 'Extracting data...'
      case 'transforming':
        return 'Transforming data...'
      case 'injecting':
        return 'Sending data...'
      case 'completed':
        return 'Complete!'
      case 'failed':
        return 'Failed'
      default:
        return 'Waiting...'
    }
  }, [status])

  return {
    status,
    progress,
    stats,
    getPhaseLabel,
    isComplete: status === 'completed',
    hasFailed: status === 'failed',
    dataIntegrityValid: execution?.dataIntegrityValid ?? true,
    integrityErrors: execution?.integrityErrors || []
  }
}

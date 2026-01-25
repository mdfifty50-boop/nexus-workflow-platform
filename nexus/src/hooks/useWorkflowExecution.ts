/**
 * useWorkflowExecution - React Hook for Workflow Engine Integration
 *
 * This hook provides React components with access to the workflow orchestrator,
 * enabling natural language workflow execution with real-time status updates.
 *
 * Features:
 * - Natural language command processing
 * - Real-time execution progress via events
 * - User action request handling (confirmations, selections)
 * - Session state management
 * - Context and intent access
 *
 * @example
 * ```tsx
 * function WorkflowExecutor() {
 *   const {
 *     executeCommand,
 *     session,
 *     status,
 *     events,
 *     pendingAction,
 *     respondToAction,
 *   } = useWorkflowExecution()
 *
 *   const handleSubmit = async (input: string) => {
 *     await executeCommand(input, { autoExecute: true })
 *   }
 *
 *   return (
 *     <div>
 *       <input onSubmit={handleSubmit} />
 *       {status === 'executing' && <ProgressBar />}
 *       {pendingAction && <ActionDialog action={pendingAction} onRespond={respondToAction} />}
 *     </div>
 *   )
 * }
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  WorkflowOrchestrator,
  workflowOrchestrator,
  type OrchestratorEvent,
  type OrchestratorSession,
  type OrchestratorConfig,
} from '../lib/workflow-engine/orchestrator'
import type {
  ParsedIntent,
  GeneratedWorkflow,
  ExecutionState,
  UserActionRequest,
  ServiceIntegration,
  UserContext,
} from '../types/workflow-execution'

// ========================================
// Hook Types
// ========================================

/** Status of the workflow execution */
export type WorkflowExecutionStatus =
  | 'idle'
  | 'initializing'
  | 'parsing'
  | 'clarifying'
  | 'generating'
  | 'ready'
  | 'executing'
  | 'paused'
  | 'completed'
  | 'failed'

/** Options for executing a command */
export interface ExecuteCommandOptions {
  userId?: string
  autoExecute?: boolean
  skipClarification?: boolean
}

/** Hook configuration */
export interface UseWorkflowExecutionConfig {
  /** Maximum number of clarification questions to ask */
  maxClarificationQuestions?: number
  /** Whether to auto-execute workflows after generation */
  autoExecute?: boolean
  /** Whether to simplify workflows for faster execution */
  simplifyWorkflows?: boolean
  /** Whether to enable context extraction from conversations */
  enableContextExtraction?: boolean
  /** Default timeout for workflow steps in ms */
  defaultTimeout?: number
  /** Whether to retry failed steps */
  retryOnFailure?: boolean
  /** Maximum number of retries for failed steps */
  maxRetries?: number
  /** Maximum number of events to keep in history */
  maxEventHistory?: number
  /** Whether to persist session across component remounts */
  persistSession?: boolean
}

/** Hook return type */
export interface UseWorkflowExecutionReturn {
  // Execution methods
  executeCommand: (input: string, options?: ExecuteCommandOptions) => Promise<OrchestratorSession>
  executeWorkflow: (workflow: GeneratedWorkflow) => Promise<ExecutionState>

  // Session state
  session: OrchestratorSession | null
  status: WorkflowExecutionStatus
  progress: number

  // Intent and workflow data
  intent: ParsedIntent | null
  workflow: GeneratedWorkflow | null
  execution: ExecutionState | null

  // Events
  events: OrchestratorEvent[]
  latestEvent: OrchestratorEvent | null

  // User actions
  pendingAction: UserActionRequest | null
  respondToAction: (response: string) => void

  // Control methods
  pause: () => void
  resume: () => void
  cancel: () => void
  reset: () => void

  // Context and integrations
  userContext: UserContext | null
  integrations: ServiceIntegration[]
  checkReadiness: (category: string) => { ready: boolean; missingIntegrations: string[]; missingContext: string[] }

  // Error state
  error: string | null

  // Loading states
  isLoading: boolean
  isParsing: boolean
  isGenerating: boolean
  isExecuting: boolean
}

// ========================================
// Default Configuration
// ========================================

const DEFAULT_CONFIG: Required<UseWorkflowExecutionConfig> = {
  maxClarificationQuestions: 3,
  autoExecute: false,
  simplifyWorkflows: false,
  enableContextExtraction: true,
  defaultTimeout: 60000,
  retryOnFailure: true,
  maxRetries: 2,
  maxEventHistory: 100,
  persistSession: false,
}

// ========================================
// useWorkflowExecution Hook
// ========================================

/**
 * React hook for workflow execution with the Nexus workflow engine
 */
export function useWorkflowExecution(
  config: UseWorkflowExecutionConfig = {}
): UseWorkflowExecutionReturn {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  // Orchestrator reference
  const orchestratorRef = useRef<WorkflowOrchestrator>(workflowOrchestrator)

  // State
  const [session, setSession] = useState<OrchestratorSession | null>(null)
  const [events, setEvents] = useState<OrchestratorEvent[]>([])
  const [latestEvent, setLatestEvent] = useState<OrchestratorEvent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [integrations, setIntegrations] = useState<ServiceIntegration[]>([])
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [pendingAction, setPendingAction] = useState<UserActionRequest | null>(null)
  const [progress, setProgress] = useState(0)

  // Action response resolver
  const actionResolverRef = useRef<((response: string) => void) | null>(null)

  // Configure orchestrator
  useEffect(() => {
    const orchestratorConfig: Partial<OrchestratorConfig> = {
      maxClarificationQuestions: mergedConfig.maxClarificationQuestions,
      autoExecute: mergedConfig.autoExecute,
      simplifyWorkflows: mergedConfig.simplifyWorkflows,
      enableContextExtraction: mergedConfig.enableContextExtraction,
      defaultTimeout: mergedConfig.defaultTimeout,
      retryOnFailure: mergedConfig.retryOnFailure,
      maxRetries: mergedConfig.maxRetries,
    }
    orchestratorRef.current.configure(orchestratorConfig)
  }, [mergedConfig])

  // Subscribe to orchestrator events
  useEffect(() => {
    const unsubscribe = orchestratorRef.current.subscribe((event) => {
      // Update events history
      setEvents((prev: OrchestratorEvent[]) => {
        const newEvents = [...prev, event]
        return newEvents.slice(-mergedConfig.maxEventHistory)
      })
      setLatestEvent(event)

      // Handle specific event types
      switch (event.type) {
        case 'intent_parsed':
          setSession((prev: OrchestratorSession | null) => prev ? { ...prev, intent: event.data as ParsedIntent } : prev)
          break

        case 'workflow_generated':
          setSession((prev: OrchestratorSession | null) => prev ? { ...prev, workflow: event.data as GeneratedWorkflow } : prev)
          break

        case 'execution_started':
        case 'step_started':
        case 'step_completed':
        case 'step_failed':
          if (event.metadata?.progress !== undefined) {
            setProgress(event.metadata.progress)
          }
          break

        case 'execution_completed':
          setProgress(100)
          setSession((prev: OrchestratorSession | null) => prev ? { ...prev, status: 'completed' } : prev)
          break

        case 'execution_failed':
          const failData = event.data as { error?: string | Error }
          setError(failData.error instanceof Error ? failData.error.message : failData.error || 'Execution failed')
          setSession((prev: OrchestratorSession | null) => prev ? { ...prev, status: 'failed' } : prev)
          break

        case 'user_action_required':
          setPendingAction(event.data as UserActionRequest)
          break

        case 'context_updated':
          const ctxData = event.data as { context?: UserContext }
          if (ctxData.context) {
            setUserContext(ctxData.context)
          }
          break

        case 'execution_paused':
          setSession((prev: OrchestratorSession | null) => prev ? { ...prev, status: 'paused' } : prev)
          break

        case 'execution_resumed':
          setSession((prev: OrchestratorSession | null) => prev ? { ...prev, status: 'executing' } : prev)
          break
      }
    })

    // Set up user action handler
    orchestratorRef.current.onUserAction(async (request) => {
      setPendingAction(request)

      return new Promise<string>((resolve) => {
        actionResolverRef.current = resolve
      })
    })

    // Load initial integrations
    setIntegrations(orchestratorRef.current.getAvailableIntegrations())

    // Load initial context
    const ctx = orchestratorRef.current.getUserContext()
    if (ctx) {
      setUserContext(ctx)
    }

    return () => {
      unsubscribe()
    }
  }, [mergedConfig.maxEventHistory])

  // Execute command handler
  const executeCommand = useCallback(async (
    input: string,
    options: ExecuteCommandOptions = {}
  ): Promise<OrchestratorSession> => {
    setError(null)
    setProgress(0)

    try {
      const result = await orchestratorRef.current.executeCommand(input, options)
      setSession(result)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    }
  }, [])

  // Execute workflow handler
  const executeWorkflow = useCallback(async (
    workflow: GeneratedWorkflow
  ): Promise<ExecutionState> => {
    setError(null)
    setProgress(0)

    try {
      const result = await orchestratorRef.current.executeWorkflow(workflow)
      setSession((prev: OrchestratorSession | null) => prev ? { ...prev, execution: result } : prev)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    }
  }, [])

  // Respond to pending action
  const respondToAction = useCallback((response: string) => {
    if (actionResolverRef.current) {
      actionResolverRef.current(response)
      actionResolverRef.current = null
      setPendingAction(null)
    }
  }, [])

  // Control methods
  const pause = useCallback(() => {
    orchestratorRef.current.pauseExecution(session?.id)
  }, [session?.id])

  const resume = useCallback(() => {
    orchestratorRef.current.resumeExecution(session?.id)
  }, [session?.id])

  const cancel = useCallback(() => {
    orchestratorRef.current.cancelExecution(session?.id)
    setPendingAction(null)
    if (actionResolverRef.current) {
      actionResolverRef.current('cancel')
      actionResolverRef.current = null
    }
  }, [session?.id])

  const reset = useCallback(() => {
    orchestratorRef.current.reset()
    setSession(null)
    setEvents([])
    setLatestEvent(null)
    setError(null)
    setProgress(0)
    setPendingAction(null)
    actionResolverRef.current = null
  }, [])

  // Check readiness
  const checkReadiness = useCallback((category: string) => {
    return orchestratorRef.current.checkReadiness(category)
  }, [])

  // Computed status
  const status: WorkflowExecutionStatus = session?.status || 'idle'

  // Loading state helpers
  const isLoading = ['parsing', 'clarifying', 'generating', 'executing'].includes(status)
  const isParsing = status === 'parsing'
  const isGenerating = status === 'generating'
  const isExecuting = status === 'executing'

  return {
    // Execution methods
    executeCommand,
    executeWorkflow,

    // Session state
    session,
    status,
    progress,

    // Intent and workflow data
    intent: session?.intent || null,
    workflow: session?.workflow || null,
    execution: session?.execution || null,

    // Events
    events,
    latestEvent,

    // User actions
    pendingAction,
    respondToAction,

    // Control methods
    pause,
    resume,
    cancel,
    reset,

    // Context and integrations
    userContext,
    integrations,
    checkReadiness,

    // Error state
    error,

    // Loading states
    isLoading,
    isParsing,
    isGenerating,
    isExecuting,
  }
}

// ========================================
// Convenience Hooks
// ========================================

/**
 * Simple hook for quick workflow execution without full state management
 */
export function useQuickWorkflow() {
  const { executeCommand, status, error, progress, workflow, execution } = useWorkflowExecution({
    simplifyWorkflows: true,
  })

  const run = useCallback(async (input: string, userId?: string) => {
    return executeCommand(input, { userId, autoExecute: true })
  }, [executeCommand])

  return {
    run,
    status,
    error,
    progress,
    workflow,
    execution,
    isRunning: status === 'executing',
    isComplete: status === 'completed',
    isFailed: status === 'failed',
  }
}

/**
 * Hook for food ordering workflows
 */
export function useFoodOrderWorkflow() {
  const hook = useWorkflowExecution()

  const orderFood = useCallback(async (
    description: string,
    userId?: string
  ) => {
    // Ensure description indicates food intent
    const input = description.toLowerCase().includes('order')
      ? description
      : `Order ${description}`

    return hook.executeCommand(input, { userId, autoExecute: false })
  }, [hook])

  const checkFoodReadiness = useCallback(() => {
    return hook.checkReadiness('food_delivery')
  }, [hook])

  return {
    ...hook,
    orderFood,
    checkFoodReadiness,
    isFoodReady: checkFoodReadiness().ready,
  }
}

/**
 * Hook for document analysis workflows
 */
export function useDocumentAnalysisWorkflow() {
  const hook = useWorkflowExecution()

  const analyzeDocument = useCallback(async (
    description: string,
    userId?: string
  ) => {
    const input = description.toLowerCase().includes('analyze')
      ? description
      : `Analyze ${description}`

    return hook.executeCommand(input, { userId, autoExecute: false })
  }, [hook])

  const compareTravelPackages = useCallback(async (
    description: string,
    userId?: string
  ) => {
    const input = description.toLowerCase().includes('compare')
      ? description
      : `Compare travel packages: ${description}`

    return hook.executeCommand(input, { userId, autoExecute: false })
  }, [hook])

  return {
    ...hook,
    analyzeDocument,
    compareTravelPackages,
  }
}

// ========================================
// Export Types
// ========================================

export type {
  OrchestratorEvent,
  OrchestratorSession,
  ParsedIntent,
  GeneratedWorkflow,
  ExecutionState,
  UserActionRequest,
  ServiceIntegration,
  UserContext,
}

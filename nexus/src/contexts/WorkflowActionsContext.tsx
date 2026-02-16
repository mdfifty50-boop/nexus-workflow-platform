/**
 * WORKFLOW ACTIONS CONTEXT (Split for Performance)
 *
 * Provides workflow action functions separately from state.
 * This allows components to:
 * 1. Use actions without subscribing to state changes
 * 2. Pass actions down without causing re-renders
 * 3. Keep action handlers stable across renders
 *
 * Works in tandem with WorkflowStateContext.
 */

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type ReactNode
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  useWorkflowStateContext,
  useWorkflowUpdater,
  type ActiveWorkflow
} from './WorkflowStateContext'
import { apiClient } from '@/lib/api-client'
import {
  AutonomyEngine,
  AutonomyLevel,
  ULTIMATE_AUTONOMY_CONFIG,
  type AutonomyConfig
} from '@/lib/ultimate-autonomy'
import { NexusStage } from '@/lib/embedded-nexus'

// ============================================================================
// TYPES
// ============================================================================

export interface WorkflowActions {
  // Workflow lifecycle
  createWorkflow: (name: string, description: string, steps: unknown[]) => Promise<string>
  startWorkflow: (workflowId: string) => Promise<void>
  approveWorkflow: (workflowId: string) => Promise<void>
  executeWorkflow: (workflowId: string) => Promise<void>
  cancelWorkflow: (workflowId?: string) => void
  // One-shot workflow runner
  runWorkflow: (name: string, description: string, steps: unknown[]) => Promise<string>
  // State management
  setActiveWorkflow: (workflowId: string | null) => void
  reset: () => void
  // Autonomy control
  setAutonomyLevel: (level: AutonomyLevel) => void
  // Recovery
  recoverWorkflow: (workflowId: string, checkpointName?: string) => Promise<void>
}

// ============================================================================
// CONTEXT
// ============================================================================

const WorkflowActionsContext = createContext<WorkflowActions | null>(null)

// ============================================================================
// API URL
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001')

// ============================================================================
// PROVIDER
// ============================================================================

interface WorkflowActionsProviderProps {
  children: ReactNode
  initialAutonomyConfig?: AutonomyConfig
}

export function WorkflowActionsProvider({
  children,
  initialAutonomyConfig = ULTIMATE_AUTONOMY_CONFIG
}: WorkflowActionsProviderProps) {
  const auth = useAuth()
  const userId = auth.userId
  const isDevMode = auth.isDevMode || false

  const { state, setState } = useWorkflowStateContext()
  const { updateWorkflow, updateNode, setActiveWorkflow: setActive, reset: resetState } = useWorkflowUpdater()

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null)
  const autonomyRef = useRef(new AutonomyEngine(initialAutonomyConfig))

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  // SSE Connection
  const connectSSE = useCallback(async (workflowId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    let sseUrl: string

    try {
      const ticketResponse = await fetch(`${API_URL}/api/sse/ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId && { 'X-Clerk-User-Id': userId }),
        },
        body: JSON.stringify({ workflowId }),
      })

      if (!ticketResponse.ok) {
        throw new Error('Failed to get SSE ticket')
      }

      const ticketData = await ticketResponse.json()
      if (!ticketData.success || !ticketData.ticket) {
        throw new Error('Invalid ticket response')
      }

      sseUrl = `${API_URL}/api/sse/workflow/${workflowId}?ticket=${ticketData.ticket}`
    } catch (ticketError) {
      console.warn('[WorkflowActions] Could not get SSE ticket, using dev mode:', ticketError)
      if (isDevMode) {
        sseUrl = `${API_URL}/api/sse/workflow/${workflowId}`
      } else {
        throw new Error('SSE authentication failed')
      }
    }

    const eventSource = new EventSource(sseUrl)

    eventSource.onopen = () => {
      console.log('[WorkflowActions] SSE Connected:', workflowId)
      setState(prev => ({ ...prev, isConnected: true }))
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'node_update':
            updateNode(workflowId, data.node.node_id, {
              id: data.node.id,
              nodeId: data.node.node_id,
              status: data.node.status,
              label: data.node.label,
              nodeType: data.node.node_type,
              tokensUsed: data.node.tokens_used,
              costUsd: data.node.cost_usd,
              output: data.node.output,
              startedAt: data.node.started_at ? new Date(data.node.started_at) : undefined,
              completedAt: data.node.completed_at ? new Date(data.node.completed_at) : undefined
            })
            break

          case 'workflow_status':
            updateWorkflow(workflowId, {
              status: mapStatusToUIStatus(data.status),
              stage: mapStatusToStage(data.status),
              totalTokensUsed: data.tokensUsed,
              totalCostUsd: data.costUsd,
              completedAt: data.status === 'completed' || data.status === 'failed'
                ? new Date()
                : null
            })
            break

          case 'checkpoint':
            setState(prev => {
              const workflow = prev.workflows.get(workflowId)
              if (!workflow) return prev

              const updatedWorkflow = {
                ...workflow,
                checkpoints: [...workflow.checkpoints, data.checkpoint]
              }

              const newWorkflows = new Map(prev.workflows)
              newWorkflows.set(workflowId, updatedWorkflow)

              return {
                ...prev,
                workflows: newWorkflows,
                activeWorkflow: prev.activeWorkflow?.id === workflowId
                  ? updatedWorkflow
                  : prev.activeWorkflow
              }
            })
            break

          case 'workflow_complete':
            updateWorkflow(workflowId, {
              status: 'completed',
              stage: NexusStage.COMPLETED,
              completedAt: new Date(),
              finalOutput: data.output
            })
            break

          case 'workflow_error':
            updateWorkflow(workflowId, {
              status: 'failed',
              stage: NexusStage.FAILED,
              error: data.error,
              completedAt: new Date()
            })
            break
        }
      } catch (error) {
        console.error('[WorkflowActions] Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[WorkflowActions] SSE error:', error)
      setState(prev => ({ ...prev, isConnected: false }))

      if (autonomyRef.current.shouldAutoRetry()) {
        setTimeout(() => {
          connectSSE(workflowId)
        }, autonomyRef.current.getRetryDelay())
        autonomyRef.current.recordFailure()
      }
    }

    eventSourceRef.current = eventSource
  }, [userId, isDevMode, updateNode, updateWorkflow, setState])

  // Actions
  const createWorkflow = useCallback(async (
    name: string,
    description: string,
    steps: unknown[]
  ): Promise<string> => {
    if (!autonomyRef.current.canProceed('workflowCreation')) {
      throw new Error('Workflow creation not permitted')
    }

    setState(prev => ({ ...prev, isCreating: true }))

    try {
      const response = await apiClient.createNexusWorkflow({
        name,
        description,
        workflow_definition: { steps },
        autonomyLevel: autonomyRef.current.getLevel()
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create workflow')
      }

      const workflowId = response.data.id

      const newWorkflow: ActiveWorkflow = {
        id: workflowId,
        name,
        description,
        status: 'idle',
        stage: NexusStage.PLANNING,
        nodes: new Map(),
        totalTokensUsed: 0,
        totalCostUsd: 0,
        currentNodeId: null,
        checkpoints: [],
        error: null,
        startedAt: new Date(),
        completedAt: null
      }

      setState(prev => {
        const newWorkflows = new Map(prev.workflows)
        newWorkflows.set(workflowId, newWorkflow)
        return {
          ...prev,
          workflows: newWorkflows,
          activeWorkflow: newWorkflow,
          isCreating: false
        }
      })

      await connectSSE(workflowId)
      autonomyRef.current.resetFailures()
      return workflowId
    } catch (error) {
      autonomyRef.current.recordFailure()
      setState(prev => ({ ...prev, isCreating: false }))
      throw error
    }
  }, [connectSSE, setState])

  const startWorkflow = useCallback(async (workflowId: string) => {
    if (!autonomyRef.current.canProceed('workflowCreation')) {
      throw new Error('Workflow start not permitted')
    }

    if (!eventSourceRef.current || eventSourceRef.current.readyState !== EventSource.OPEN) {
      await connectSSE(workflowId)
    }

    updateWorkflow(workflowId, {
      status: 'planning',
      stage: NexusStage.PLANNING
    })

    try {
      const response = await apiClient.startNexusWorkflow(workflowId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to start workflow')
      }

      autonomyRef.current.resetFailures()

      const level = autonomyRef.current.getLevel()
      if (level === AutonomyLevel.ULTIMATE || level === AutonomyLevel.AUTONOMOUS) {
        await approveWorkflow(workflowId)
      }
    } catch (error) {
      autonomyRef.current.recordFailure()

      if (autonomyRef.current.shouldAutoRetry()) {
        setTimeout(() => startWorkflow(workflowId), autonomyRef.current.getRetryDelay())
      } else {
        updateWorkflow(workflowId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        throw error
      }
    }
  }, [connectSSE, updateWorkflow])

  const approveWorkflow = useCallback(async (workflowId: string) => {
    try {
      const response = await apiClient.approveNexusWorkflow(workflowId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to approve workflow')
      }

      updateWorkflow(workflowId, {
        status: 'orchestrating',
        stage: NexusStage.ORCHESTRATING
      })

      autonomyRef.current.resetFailures()

      const level = autonomyRef.current.getLevel()
      if (level === AutonomyLevel.ULTIMATE || level === AutonomyLevel.AUTONOMOUS) {
        await executeWorkflow(workflowId)
      }
    } catch (error) {
      autonomyRef.current.recordFailure()
      throw error
    }
  }, [updateWorkflow])

  const executeWorkflow = useCallback(async (workflowId: string) => {
    if (!autonomyRef.current.canProceed('apiCalls')) {
      throw new Error('Workflow execution not permitted')
    }

    if (!eventSourceRef.current || eventSourceRef.current.readyState !== EventSource.OPEN) {
      await connectSSE(workflowId)
    }

    setState(prev => ({ ...prev, isExecuting: true }))
    updateWorkflow(workflowId, {
      status: 'running',
      stage: NexusStage.BUILDING
    })

    try {
      const response = await apiClient.executeNexusWorkflowCoordinated(workflowId, {
        autonomyLevel: autonomyRef.current.getLevel()
      })

      if (!response.success) {
        const standardResponse = await apiClient.executeNexusWorkflow(workflowId, {
          autonomyLevel: autonomyRef.current.getLevel()
        })

        if (!standardResponse.success) {
          throw new Error(standardResponse.error || 'Failed to execute workflow')
        }
      }

      autonomyRef.current.resetFailures()
      setState(prev => ({ ...prev, isExecuting: false }))
    } catch (error) {
      autonomyRef.current.recordFailure()
      setState(prev => ({ ...prev, isExecuting: false }))

      if (autonomyRef.current.shouldAutoRetry()) {
        setTimeout(() => executeWorkflow(workflowId), autonomyRef.current.getRetryDelay())
      } else {
        updateWorkflow(workflowId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        throw error
      }
    }
  }, [connectSSE, updateWorkflow, setState])

  const runWorkflow = useCallback(async (
    name: string,
    description: string,
    steps: unknown[]
  ): Promise<string> => {
    const workflowId = await createWorkflow(name, description, steps)
    await startWorkflow(workflowId)
    return workflowId
  }, [createWorkflow, startWorkflow])

  const cancelWorkflow = useCallback((workflowId?: string) => {
    const targetId = workflowId || state.activeWorkflow?.id

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setState(prev => ({ ...prev, isConnected: false }))

    if (targetId) {
      updateWorkflow(targetId, {
        status: 'failed',
        error: 'Workflow cancelled by user'
      })
    }
  }, [state.activeWorkflow?.id, updateWorkflow, setState])

  const setActiveWorkflow = useCallback((workflowId: string | null) => {
    setActive(workflowId)
  }, [setActive])

  const reset = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    resetState()
    autonomyRef.current = new AutonomyEngine(initialAutonomyConfig)
  }, [resetState, initialAutonomyConfig])

  const setAutonomyLevel = useCallback((level: AutonomyLevel) => {
    autonomyRef.current.setLevel(level)
    setState(prev => ({ ...prev, autonomyLevel: level }))
  }, [setState])

  const recoverWorkflow = useCallback(async (workflowId: string, checkpointName?: string) => {
    try {
      const response = await apiClient.recoverNexusWorkflow(workflowId, checkpointName)

      if (!response.success) {
        throw new Error(response.error || 'Failed to recover workflow')
      }

      await connectSSE(workflowId)

      updateWorkflow(workflowId, {
        status: 'running',
        error: null
      })
    } catch (error) {
      throw error
    }
  }, [connectSSE, updateWorkflow])

  // Memoize actions to prevent unnecessary re-renders
  const actions = useMemo<WorkflowActions>(() => ({
    createWorkflow,
    startWorkflow,
    approveWorkflow,
    executeWorkflow,
    cancelWorkflow,
    runWorkflow,
    setActiveWorkflow,
    reset,
    setAutonomyLevel,
    recoverWorkflow
  }), [
    createWorkflow,
    startWorkflow,
    approveWorkflow,
    executeWorkflow,
    cancelWorkflow,
    runWorkflow,
    setActiveWorkflow,
    reset,
    setAutonomyLevel,
    recoverWorkflow
  ])

  return (
    <WorkflowActionsContext.Provider value={actions}>
      {children}
    </WorkflowActionsContext.Provider>
  )
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Access all workflow actions
 */
export function useWorkflowActions(): WorkflowActions {
  const context = useContext(WorkflowActionsContext)
  if (!context) {
    throw new Error('useWorkflowActions must be used within a WorkflowActionsProvider')
  }
  return context
}

/**
 * Access a specific action (prevents re-render when other actions change)
 */
export function useWorkflowAction<K extends keyof WorkflowActions>(
  actionName: K
): WorkflowActions[K] {
  const actions = useWorkflowActions()
  return actions[actionName]
}

// ============================================================================
// HELPERS
// ============================================================================

function mapStatusToStage(status: string): NexusStage {
  switch (status) {
    case 'planning':
      return NexusStage.PLANNING
    case 'orchestrating':
      return NexusStage.ORCHESTRATING
    case 'building':
    case 'executing':
    case 'running':
      return NexusStage.BUILDING
    case 'reviewing':
      return NexusStage.REVIEWING
    case 'completed':
      return NexusStage.COMPLETED
    case 'failed':
      return NexusStage.FAILED
    default:
      return NexusStage.PLANNING
  }
}

function mapStatusToUIStatus(status: string): ActiveWorkflow['status'] {
  switch (status) {
    case 'draft':
    case 'idle':
      return 'idle'
    case 'planning':
      return 'planning'
    case 'orchestrating':
      return 'orchestrating'
    case 'building':
    case 'executing':
    case 'running':
      return 'running'
    case 'reviewing':
      return 'reviewing'
    case 'completed':
      return 'completed'
    case 'failed':
    case 'error':
      return 'failed'
    default:
      return 'idle'
  }
}

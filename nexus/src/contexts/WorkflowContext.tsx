/**
 * WORKFLOW CONTEXT PROVIDER
 *
 * Provides global workflow execution state management across the application.
 * Manages SSE connections, workflow state, and autonomy engine integration.
 *
 * Features:
 * - Global workflow state accessible from any component
 * - Centralized SSE connection management
 * - Autonomy engine integration
 * - Real-time cost and token tracking
 * - Checkpoint and recovery management
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api-client'
import {
  AutonomyEngine,
  AutonomyLevel,
  ULTIMATE_AUTONOMY_CONFIG,
  type AutonomyConfig
} from '@/lib/ultimate-autonomy'
import {
  NexusStage,
  type NexusAgentType
} from '@/lib/embedded-nexus'

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Workflow Node State
export interface WorkflowNode {
  id: string
  nodeId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  label: string
  nodeType: string
  agentType?: NexusAgentType
  tokensUsed?: number
  costUsd?: number
  output?: unknown
  error?: string
  startedAt?: Date
  completedAt?: Date
  duration?: number
}

// Active Workflow State
export interface ActiveWorkflow {
  id: string
  name: string
  description: string
  status: 'idle' | 'creating' | 'planning' | 'orchestrating' | 'running' | 'reviewing' | 'completed' | 'failed'
  stage: NexusStage
  nodes: Map<string, WorkflowNode>
  totalTokensUsed: number
  totalCostUsd: number
  currentNodeId: string | null
  checkpoints: string[]
  error: string | null
  startedAt: Date | null
  completedAt: Date | null
  finalOutput?: unknown
}

// Context State
interface WorkflowContextState {
  // Current active workflow
  activeWorkflow: ActiveWorkflow | null

  // All workflows in session
  workflows: Map<string, ActiveWorkflow>

  // SSE connection status
  isConnected: boolean

  // Autonomy configuration
  autonomyLevel: AutonomyLevel

  // Session totals
  sessionTokensUsed: number
  sessionCostUsd: number

  // Loading states
  isCreating: boolean
  isExecuting: boolean
}

// Context Actions
interface WorkflowContextActions {
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

// Combined Context Type
interface WorkflowContextValue extends WorkflowContextState, WorkflowContextActions {}

// Initial State
const initialState: WorkflowContextState = {
  activeWorkflow: null,
  workflows: new Map(),
  isConnected: false,
  autonomyLevel: AutonomyLevel.ULTIMATE,
  sessionTokensUsed: 0,
  sessionCostUsd: 0,
  isCreating: false,
  isExecuting: false
}

// Create Context
const WorkflowContext = createContext<WorkflowContextValue | null>(null)

// Provider Props
interface WorkflowProviderProps {
  children: ReactNode
  initialAutonomyConfig?: AutonomyConfig
}

// Provider Component
export function WorkflowProvider({
  children,
  initialAutonomyConfig = ULTIMATE_AUTONOMY_CONFIG
}: WorkflowProviderProps) {
  const auth = useAuth()
  const userId = auth.userId
  const isDevMode = auth.isDevMode || false

  // State
  const [state, setState] = useState<WorkflowContextState>(initialState)

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null)
  const autonomyRef = useRef(new AutonomyEngine(initialAutonomyConfig))

  // Clean up SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  // Helper: Update workflow in state
  const updateWorkflow = useCallback((workflowId: string, updates: Partial<ActiveWorkflow>) => {
    setState(prev => {
      const workflow = prev.workflows.get(workflowId)
      if (!workflow) return prev

      const updatedWorkflow = { ...workflow, ...updates }
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
  }, [])

  // Helper: Update node in workflow
  const updateNode = useCallback((workflowId: string, nodeId: string, nodeData: Partial<WorkflowNode>) => {
    setState(prev => {
      const workflow = prev.workflows.get(workflowId)
      if (!workflow) return prev

      const existingNode = workflow.nodes.get(nodeId) || {
        id: nodeId,
        nodeId,
        status: 'pending' as const,
        label: '',
        nodeType: ''
      }

      const updatedNode: WorkflowNode = { ...existingNode, ...nodeData }
      const newNodes = new Map(workflow.nodes)
      newNodes.set(nodeId, updatedNode)

      // Calculate new totals
      const tokensUsed = nodeData.tokensUsed || 0
      const costUsd = nodeData.costUsd || 0

      const updatedWorkflow: ActiveWorkflow = {
        ...workflow,
        nodes: newNodes,
        totalTokensUsed: workflow.totalTokensUsed + tokensUsed,
        totalCostUsd: workflow.totalCostUsd + costUsd,
        currentNodeId: nodeData.status === 'running' ? nodeId : workflow.currentNodeId
      }

      const newWorkflows = new Map(prev.workflows)
      newWorkflows.set(workflowId, updatedWorkflow)

      // Record cost in autonomy engine
      if (tokensUsed > 0) {
        autonomyRef.current.recordCost(tokensUsed, costUsd)
      }

      return {
        ...prev,
        workflows: newWorkflows,
        activeWorkflow: prev.activeWorkflow?.id === workflowId
          ? updatedWorkflow
          : prev.activeWorkflow,
        sessionTokensUsed: prev.sessionTokensUsed + tokensUsed,
        sessionCostUsd: prev.sessionCostUsd + costUsd
      }
    })
  }, [])

  // Connect to SSE for real-time updates
  // SECURITY: Uses ticket-based authentication to prevent token exposure in URLs
  const connectSSE = useCallback(async (workflowId: string) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // SECURITY FIX: Request a short-lived, single-use ticket instead of
    // putting the auth token in the URL. This prevents token leakage to:
    // - Browser history
    // - Server logs
    // - Referrer headers
    // - Shared URLs
    let sseUrl: string

    try {
      // Request ticket from server (authenticated via headers)
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

      // Connect with secure ticket (short-lived, single-use, doesn't reveal auth token)
      sseUrl = `${API_URL}/api/sse/workflow/${workflowId}?ticket=${ticketData.ticket}`
      console.log('[WorkflowContext] SSE connecting with secure ticket')
    } catch (ticketError) {
      // Fallback for development or when ticket endpoint is unavailable
      console.warn('[WorkflowContext] Could not get SSE ticket, using dev mode connection:', ticketError)
      if (isDevMode) {
        sseUrl = `${API_URL}/api/sse/workflow/${workflowId}`
      } else {
        throw new Error('SSE authentication failed: Could not obtain ticket')
      }
    }

    // Create SSE connection with secure URL (no sensitive tokens exposed)
    const eventSource = new EventSource(sseUrl)

    eventSource.onopen = () => {
      console.log('[WorkflowContext] SSE Connected:', workflowId)
      setState(prev => ({ ...prev, isConnected: true }))
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'connected':
            console.log('[WorkflowContext] Workflow subscribed:', data.workflowId)
            break

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
        console.error('[WorkflowContext] Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[WorkflowContext] SSE error:', error)
      setState(prev => ({ ...prev, isConnected: false }))

      // Auto-reconnect if autonomy allows
      if (autonomyRef.current.shouldAutoRetry()) {
        setTimeout(() => {
          connectSSE(workflowId)
        }, autonomyRef.current.getRetryDelay())
        autonomyRef.current.recordFailure()
      }
    }

    eventSourceRef.current = eventSource
  }, [userId, isDevMode, updateNode, updateWorkflow])

  // Create a new workflow
  const createWorkflow = useCallback(async (
    name: string,
    description: string,
    steps: unknown[]
  ): Promise<string> => {
    if (!autonomyRef.current.canProceed('workflowCreation')) {
      throw new Error('Workflow creation not permitted by current autonomy level')
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

      // Create workflow entry in state
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

      // Connect to SSE for real-time updates
      await connectSSE(workflowId)

      autonomyRef.current.resetFailures()
      return workflowId
    } catch (error) {
      autonomyRef.current.recordFailure()
      setState(prev => ({ ...prev, isCreating: false }))
      throw error
    }
  }, [connectSSE])

  // Start workflow planning
  const startWorkflow = useCallback(async (workflowId: string) => {
    if (!autonomyRef.current.canProceed('workflowCreation')) {
      throw new Error('Workflow start not permitted')
    }

    // CRITICAL: Ensure SSE is connected BEFORE starting execution
    // This prevents race condition where backend emits events before client is listening
    if (!eventSourceRef.current || eventSourceRef.current.readyState !== EventSource.OPEN) {
      console.log('[WorkflowContext] SSE not connected, connecting before start...')
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

      // In ultimate/autonomous mode, auto-approve
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
  }, [updateWorkflow, connectSSE])

  // Approve workflow
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

      // In ultimate/autonomous mode, auto-execute
      const level = autonomyRef.current.getLevel()
      if (level === AutonomyLevel.ULTIMATE || level === AutonomyLevel.AUTONOMOUS) {
        await executeWorkflow(workflowId)
      }
    } catch (error) {
      autonomyRef.current.recordFailure()
      throw error
    }
  }, [updateWorkflow])

  // Execute workflow
  const executeWorkflow = useCallback(async (workflowId: string) => {
    if (!autonomyRef.current.canProceed('apiCalls')) {
      throw new Error('Workflow execution not permitted')
    }

    // CRITICAL: Ensure SSE is connected BEFORE executing
    // This prevents race condition where backend emits events before client is listening
    if (!eventSourceRef.current || eventSourceRef.current.readyState !== EventSource.OPEN) {
      console.log('[WorkflowContext] SSE not connected, connecting before execute...')
      await connectSSE(workflowId)
    }

    setState(prev => ({ ...prev, isExecuting: true }))
    updateWorkflow(workflowId, {
      status: 'running',
      stage: NexusStage.BUILDING
    })

    try {
      // Try coordinated execution first
      const response = await apiClient.executeNexusWorkflowCoordinated(workflowId, {
        autonomyLevel: autonomyRef.current.getLevel()
      })

      if (!response.success) {
        // Fallback to standard execution
        const standardResponse = await apiClient.executeNexusWorkflow(workflowId, {
          autonomyLevel: autonomyRef.current.getLevel()
        })

        if (!standardResponse.success) {
          throw new Error(standardResponse.error || 'Failed to execute workflow')
        }
      }

      autonomyRef.current.resetFailures()
      setState(prev => ({ ...prev, isExecuting: false }))

      // SSE handles status updates
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
  }, [updateWorkflow, connectSSE])

  // One-shot workflow runner
  const runWorkflow = useCallback(async (
    name: string,
    description: string,
    steps: unknown[]
  ): Promise<string> => {
    const workflowId = await createWorkflow(name, description, steps)
    await startWorkflow(workflowId)
    // In ultimate/autonomous mode, execution continues automatically
    return workflowId
  }, [createWorkflow, startWorkflow])

  // Cancel workflow
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
  }, [state.activeWorkflow?.id, updateWorkflow])

  // Set active workflow
  const setActiveWorkflow = useCallback((workflowId: string | null) => {
    setState(prev => ({
      ...prev,
      activeWorkflow: workflowId ? prev.workflows.get(workflowId) || null : null
    }))
  }, [])

  // Reset state
  const reset = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setState(initialState)
    autonomyRef.current = new AutonomyEngine(initialAutonomyConfig)
  }, [initialAutonomyConfig])

  // Set autonomy level
  const setAutonomyLevel = useCallback((level: AutonomyLevel) => {
    autonomyRef.current.setLevel(level)
    setState(prev => ({ ...prev, autonomyLevel: level }))
  }, [])

  // Recover workflow from checkpoint
  const recoverWorkflow = useCallback(async (workflowId: string, checkpointName?: string) => {
    try {
      const response = await apiClient.recoverNexusWorkflow(workflowId, checkpointName)

      if (!response.success) {
        throw new Error(response.error || 'Failed to recover workflow')
      }

      // Reconnect SSE
      await connectSSE(workflowId)

      updateWorkflow(workflowId, {
        status: 'running',
        error: null
      })
    } catch (error) {
      throw error
    }
  }, [connectSSE, updateWorkflow])

  // Context value
  const value: WorkflowContextValue = {
    ...state,
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
  }

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  )
}

// Hook to use workflow context
export function useWorkflowContext(): WorkflowContextValue {
  const context = useContext(WorkflowContext)

  if (!context) {
    throw new Error('useWorkflowContext must be used within a WorkflowProvider')
  }

  return context
}

// Hook for just workflow state (no actions)
export function useWorkflowState(): WorkflowContextState {
  const context = useWorkflowContext()

  return {
    activeWorkflow: context.activeWorkflow,
    workflows: context.workflows,
    isConnected: context.isConnected,
    autonomyLevel: context.autonomyLevel,
    sessionTokensUsed: context.sessionTokensUsed,
    sessionCostUsd: context.sessionCostUsd,
    isCreating: context.isCreating,
    isExecuting: context.isExecuting
  }
}

// Hook for active workflow only
export function useActiveWorkflow(): ActiveWorkflow | null {
  const { activeWorkflow } = useWorkflowContext()
  return activeWorkflow
}

// Helper: Map status to Nexus stage
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

// Helper: Map status to UI status
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

// Export types (WorkflowNode and ActiveWorkflow already exported as interfaces above)
export type {
  WorkflowContextValue,
  WorkflowContextState,
  WorkflowContextActions
}

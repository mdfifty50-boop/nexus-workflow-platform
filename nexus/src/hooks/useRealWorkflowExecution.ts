/**
 * REAL WORKFLOW EXECUTION HOOK
 *
 * This hook connects the frontend to the real backend BMAD orchestration system.
 * It replaces the simulated execution with actual API calls and SSE streaming.
 *
 * Features:
 * - Real-time workflow updates via Server-Sent Events (SSE)
 * - Actual Claude API execution through backend
 * - Checkpoint recovery support
 * - Cost and token tracking
 * - Error handling with auto-retry
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import {
  AutonomyEngine,
  ULTIMATE_AUTONOMY_CONFIG,
  type AutonomyConfig
} from '@/lib/ultimate-autonomy'
import {
  NexusStage
} from '@/lib/embedded-nexus'

// API base URL
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001')

// SSE Event Types
interface SSENodeUpdate {
  type: 'node_update'
  workflowId: string
  node: {
    id: string
    node_id: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    label: string
    node_type: string
    tokens_used?: number
    cost_usd?: number
    output?: unknown
    started_at?: string
    completed_at?: string
  }
}

interface SSEWorkflowStatus {
  type: 'workflow_status'
  workflowId: string
  status: string
  tokensUsed: number
  costUsd: number
  updatedAt: string
}

interface SSECheckpoint {
  type: 'checkpoint'
  workflowId: string
  checkpoint: string
  tokensUsed: number
  costUsd: number
  createdAt: string
}

type SSEEvent = SSENodeUpdate | SSEWorkflowStatus | SSECheckpoint | { type: 'connected'; workflowId: string }

// Hook State
interface WorkflowExecutionState {
  workflowId: string | null
  stage: NexusStage
  status: 'idle' | 'creating' | 'planning' | 'running' | 'completed' | 'failed'
  nodes: Map<string, SSENodeUpdate['node']>
  totalTokensUsed: number
  totalCostUsd: number
  currentNodeId: string | null
  checkpoints: string[]
  error: string | null
  startedAt: Date | null
  completedAt: Date | null
}

// Hook Return Type
interface UseRealWorkflowExecutionReturn {
  state: WorkflowExecutionState
  createWorkflow: (name: string, description: string, steps: unknown[]) => Promise<string>
  startWorkflow: (workflowId: string) => Promise<void>
  approveWorkflow: (workflowId: string) => Promise<void>
  executeWorkflow: (workflowId: string) => Promise<void>
  cancelWorkflow: () => void
  reset: () => void
  isConnected: boolean
}

// Initial State
const initialState: WorkflowExecutionState = {
  workflowId: null,
  stage: NexusStage.PLANNING,
  status: 'idle',
  nodes: new Map(),
  totalTokensUsed: 0,
  totalCostUsd: 0,
  currentNodeId: null,
  checkpoints: [],
  error: null,
  startedAt: null,
  completedAt: null
}

export function useRealWorkflowExecution(
  autonomyConfig: AutonomyConfig = ULTIMATE_AUTONOMY_CONFIG
): UseRealWorkflowExecutionReturn {
  const { getToken, userId } = useAuth()
  const [state, setState] = useState<WorkflowExecutionState>(initialState)
  const [isConnected, setIsConnected] = useState(false)

  const eventSourceRef = useRef<EventSource | null>(null)
  const autonomyRef = useRef(new AutonomyEngine(autonomyConfig))

  // Clean up SSE connection on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  // Connect to SSE for real-time updates
  const connectSSE = useCallback(async (workflowId: string) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const token = await getToken()

    // Create SSE connection
    // Note: EventSource doesn't support custom headers, so we use a workaround
    // In production, you'd use a library like eventsource-polyfill or pass token as query param
    const eventSource = new EventSource(
      `${API_URL}/api/sse/workflow/${workflowId}?token=${token}&userId=${userId}`
    )

    eventSource.onopen = () => {
      console.log('[SSE] Connected to workflow:', workflowId)
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data)

        switch (data.type) {
          case 'connected':
            console.log('[SSE] Workflow connected:', data.workflowId)
            break

          case 'node_update':
            setState(prev => {
              const newNodes = new Map(prev.nodes)
              newNodes.set(data.node.node_id, data.node)

              // Track current running node
              const currentNodeId = data.node.status === 'running'
                ? data.node.node_id
                : prev.currentNodeId

              // Update tokens and cost
              const tokensUsed = prev.totalTokensUsed + (data.node.tokens_used || 0)
              const costUsd = prev.totalCostUsd + (data.node.cost_usd || 0)

              // Record cost in autonomy engine
              if (data.node.tokens_used) {
                autonomyRef.current.recordCost(
                  data.node.tokens_used,
                  data.node.cost_usd || 0
                )
              }

              return {
                ...prev,
                nodes: newNodes,
                currentNodeId,
                totalTokensUsed: tokensUsed,
                totalCostUsd: costUsd
              }
            })
            break

          case 'workflow_status':
            setState(prev => ({
              ...prev,
              stage: mapStatusToStage(data.status),
              status: mapStatusToUIStatus(data.status),
              totalTokensUsed: data.tokensUsed,
              totalCostUsd: data.costUsd,
              completedAt: data.status === 'completed' || data.status === 'failed'
                ? new Date()
                : null
            }))
            break

          case 'checkpoint':
            setState(prev => ({
              ...prev,
              checkpoints: [...prev.checkpoints, data.checkpoint]
            }))
            break
        }
      } catch (error) {
        console.error('[SSE] Error parsing message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error)
      setIsConnected(false)

      // Auto-reconnect if autonomous mode allows
      if (autonomyRef.current.shouldAutoRetry()) {
        setTimeout(() => {
          connectSSE(workflowId)
        }, autonomyRef.current.getRetryDelay())
        autonomyRef.current.recordFailure()
      }
    }

    eventSourceRef.current = eventSource
  }, [getToken, userId])

  // Create a new workflow
  const createWorkflow = useCallback(async (
    name: string,
    description: string,
    steps: unknown[]
  ): Promise<string> => {
    // Check autonomy permission
    if (!autonomyRef.current.canProceed('workflowCreation')) {
      throw new Error('Workflow creation not permitted by current autonomy level')
    }

    setState(prev => ({
      ...prev,
      status: 'creating',
      startedAt: new Date()
    }))

    try {
      const token = await getToken()

      const response = await fetch(`${API_URL}/api/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-clerk-user-id': userId || ''
        },
        body: JSON.stringify({
          name,
          description,
          workflow_definition: { steps },
          status: 'draft'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create workflow: ${response.statusText}`)
      }

      const result = await response.json()
      const workflowId = result.data.id

      setState(prev => ({
        ...prev,
        workflowId,
        status: 'idle'
      }))

      // Connect to SSE for real-time updates
      await connectSSE(workflowId)

      autonomyRef.current.resetFailures()
      return workflowId
    } catch (error) {
      autonomyRef.current.recordFailure()
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      throw error
    }
  }, [getToken, userId, connectSSE])

  // Start workflow planning
  const startWorkflow = useCallback(async (workflowId: string) => {
    // Check autonomy permission
    if (!autonomyRef.current.canProceed('workflowCreation')) {
      throw new Error('Workflow start not permitted by current autonomy level')
    }

    setState(prev => ({
      ...prev,
      status: 'planning',
      stage: NexusStage.PLANNING
    }))

    try {
      const token = await getToken()

      const response = await fetch(`${API_URL}/api/workflows/${workflowId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-clerk-user-id': userId || ''
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to start workflow: ${response.statusText}`)
      }

      autonomyRef.current.resetFailures()

      // In ultimate autonomy mode, automatically approve
      if (autonomyRef.current.getLevel() === 'ultimate' ||
          autonomyRef.current.getLevel() === 'autonomous') {
        await approveWorkflow(workflowId)
      }
    } catch (error) {
      autonomyRef.current.recordFailure()

      if (autonomyRef.current.shouldAutoRetry()) {
        setTimeout(() => startWorkflow(workflowId), autonomyRef.current.getRetryDelay())
      } else {
        setState(prev => ({
          ...prev,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
        throw error
      }
    }
  }, [getToken, userId])

  // Approve workflow (after planning)
  const approveWorkflow = useCallback(async (workflowId: string) => {
    try {
      const token = await getToken()

      const response = await fetch(`${API_URL}/api/workflows/${workflowId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-clerk-user-id': userId || ''
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to approve workflow: ${response.statusText}`)
      }

      setState(prev => ({
        ...prev,
        stage: NexusStage.ORCHESTRATING
      }))

      autonomyRef.current.resetFailures()

      // In ultimate/autonomous mode, automatically execute
      if (autonomyRef.current.getLevel() === 'ultimate' ||
          autonomyRef.current.getLevel() === 'autonomous') {
        await executeWorkflow(workflowId)
      }
    } catch (error) {
      autonomyRef.current.recordFailure()
      throw error
    }
  }, [getToken, userId])

  // Execute workflow
  const executeWorkflow = useCallback(async (workflowId: string) => {
    // Check autonomy permission
    if (!autonomyRef.current.canProceed('apiCalls')) {
      throw new Error('Workflow execution not permitted by current autonomy level')
    }

    setState(prev => ({
      ...prev,
      status: 'running',
      stage: NexusStage.BUILDING
    }))

    try {
      const token = await getToken()

      // Use coordinated execution for multi-agent workflows
      const response = await fetch(`${API_URL}/api/workflows/${workflowId}/execute-coordinated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-clerk-user-id': userId || ''
        },
        body: JSON.stringify({
          autonomyLevel: autonomyRef.current.getLevel()
        })
      })

      if (!response.ok) {
        // Fallback to standard execution
        const standardResponse = await fetch(`${API_URL}/api/workflows/${workflowId}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-clerk-user-id': userId || ''
          }
        })

        if (!standardResponse.ok) {
          throw new Error(`Failed to execute workflow: ${standardResponse.statusText}`)
        }
      }

      autonomyRef.current.resetFailures()

      // The SSE connection will handle status updates
      // No need to poll - we receive real-time updates
    } catch (error) {
      autonomyRef.current.recordFailure()

      if (autonomyRef.current.shouldAutoRetry()) {
        setTimeout(() => executeWorkflow(workflowId), autonomyRef.current.getRetryDelay())
      } else {
        setState(prev => ({
          ...prev,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
        throw error
      }
    }
  }, [getToken, userId])

  // Cancel workflow
  const cancelWorkflow = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
    setState(prev => ({
      ...prev,
      status: 'failed',
      error: 'Workflow cancelled by user'
    }))
  }, [])

  // Reset state
  const reset = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
    setState(initialState)
    autonomyRef.current = new AutonomyEngine(autonomyConfig)
  }, [autonomyConfig])

  return {
    state,
    createWorkflow,
    startWorkflow,
    approveWorkflow,
    executeWorkflow,
    cancelWorkflow,
    reset,
    isConnected
  }
}

// Helper: Map backend status to Nexus stage
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

// Helper: Map backend status to UI status
function mapStatusToUIStatus(status: string): WorkflowExecutionState['status'] {
  switch (status) {
    case 'draft':
    case 'idle':
      return 'idle'
    case 'planning':
      return 'planning'
    case 'orchestrating':
    case 'building':
    case 'executing':
    case 'running':
      return 'running'
    case 'completed':
      return 'completed'
    case 'failed':
    case 'error':
      return 'failed'
    default:
      return 'idle'
  }
}

// Export a simpler hook for components that just need execution
export function useWorkflowRunner() {
  const hook = useRealWorkflowExecution()

  const runWorkflow = useCallback(async (
    name: string,
    description: string,
    steps: unknown[]
  ) => {
    const workflowId = await hook.createWorkflow(name, description, steps)
    await hook.startWorkflow(workflowId)
    // Execution continues automatically in ultimate/autonomous mode
    return workflowId
  }, [hook])

  return {
    runWorkflow,
    state: hook.state,
    cancel: hook.cancelWorkflow,
    reset: hook.reset,
    isConnected: hook.isConnected
  }
}

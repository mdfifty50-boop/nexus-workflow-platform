/**
 * WORKFLOW STATE CONTEXT (Split for Performance)
 *
 * Provides read-only workflow state without actions.
 * Components that only need to read workflow state can use this context
 * to avoid re-renders when action functions are recreated.
 *
 * This is a performance optimization - split from WorkflowContext to:
 * 1. Prevent re-renders when only actions change
 * 2. Allow selective subscriptions to state slices
 * 3. Enable memoized selectors for derived state
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type Dispatch,
  type SetStateAction
} from 'react'
import type { NexusStage, NexusAgentType } from '@/lib/embedded-nexus'
import { AutonomyLevel } from '@/lib/ultimate-autonomy'

// ============================================================================
// TYPES (Shared with WorkflowContext)
// ============================================================================

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

export interface WorkflowStateValue {
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

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: WorkflowStateValue = {
  activeWorkflow: null,
  workflows: new Map(),
  isConnected: false,
  autonomyLevel: AutonomyLevel.ULTIMATE,
  sessionTokensUsed: 0,
  sessionCostUsd: 0,
  isCreating: false,
  isExecuting: false
}

// ============================================================================
// CONTEXT
// ============================================================================

interface WorkflowStateContextValue {
  state: WorkflowStateValue
  setState: Dispatch<SetStateAction<WorkflowStateValue>>
}

const WorkflowStateContext = createContext<WorkflowStateContextValue | null>(null)

// ============================================================================
// PROVIDER
// ============================================================================

interface WorkflowStateProviderProps {
  children: ReactNode
  initialValue?: Partial<WorkflowStateValue>
}

export function WorkflowStateProvider({
  children,
  initialValue
}: WorkflowStateProviderProps) {
  const [state, setState] = useState<WorkflowStateValue>(() => ({
    ...initialState,
    ...initialValue
  }))

  const value = useMemo(() => ({
    state,
    setState
  }), [state])

  return (
    <WorkflowStateContext.Provider value={value}>
      {children}
    </WorkflowStateContext.Provider>
  )
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Access full workflow state
 */
export function useWorkflowStateContext(): WorkflowStateContextValue {
  const context = useContext(WorkflowStateContext)
  if (!context) {
    throw new Error('useWorkflowStateContext must be used within a WorkflowStateProvider')
  }
  return context
}

/**
 * Access only the state (read-only, for display components)
 */
export function useWorkflowStateOnly(): WorkflowStateValue {
  const { state } = useWorkflowStateContext()
  return state
}

/**
 * Select a specific slice of state to minimize re-renders
 */
export function useWorkflowStateSelector<T>(
  selector: (state: WorkflowStateValue) => T,
  _equalityFn?: (a: T, b: T) => boolean
): T {
  const { state } = useWorkflowStateContext()

  // Use the selector to extract the slice
  const selectedState = useMemo(() => selector(state), [state, selector])

  return selectedState
}

/**
 * Access active workflow only
 */
export function useActiveWorkflowState(): ActiveWorkflow | null {
  return useWorkflowStateSelector(state => state.activeWorkflow)
}

/**
 * Access workflow by ID
 */
export function useWorkflowById(workflowId: string | null): ActiveWorkflow | null {
  return useWorkflowStateSelector(
    state => workflowId ? state.workflows.get(workflowId) ?? null : null
  )
}

/**
 * Access connection status only
 */
export function useConnectionStatus(): boolean {
  return useWorkflowStateSelector(state => state.isConnected)
}

/**
 * Access loading states only
 */
export function useWorkflowLoading(): { isCreating: boolean; isExecuting: boolean } {
  return useWorkflowStateSelector(state => ({
    isCreating: state.isCreating,
    isExecuting: state.isExecuting
  }))
}

/**
 * Access session totals only
 */
export function useSessionTotals(): { tokens: number; cost: number } {
  return useWorkflowStateSelector(state => ({
    tokens: state.sessionTokensUsed,
    cost: state.sessionCostUsd
  }))
}

/**
 * Access autonomy level only
 */
export function useAutonomyLevel(): AutonomyLevel {
  return useWorkflowStateSelector(state => state.autonomyLevel)
}

// ============================================================================
// STATE UPDATE HELPERS
// ============================================================================

/**
 * Create a state updater that only affects a specific workflow
 */
export function useWorkflowUpdater() {
  const { setState } = useWorkflowStateContext()

  const updateWorkflow = useCallback((
    workflowId: string,
    updates: Partial<ActiveWorkflow>
  ) => {
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
  }, [setState])

  const updateNode = useCallback((
    workflowId: string,
    nodeId: string,
    nodeData: Partial<WorkflowNode>
  ) => {
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
  }, [setState])

  const setActiveWorkflow = useCallback((workflowId: string | null) => {
    setState(prev => ({
      ...prev,
      activeWorkflow: workflowId ? prev.workflows.get(workflowId) || null : null
    }))
  }, [setState])

  const reset = useCallback(() => {
    setState(initialState)
  }, [setState])

  return {
    updateWorkflow,
    updateNode,
    setActiveWorkflow,
    reset
  }
}

// ============================================================================
// DERIVED STATE SELECTORS
// ============================================================================

/**
 * Get all workflows as an array (sorted by creation)
 */
export function useWorkflowList(): ActiveWorkflow[] {
  return useWorkflowStateSelector(state =>
    Array.from(state.workflows.values())
      .sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0))
  )
}

/**
 * Get workflow statistics
 */
export function useWorkflowStats(): {
  total: number
  completed: number
  failed: number
  running: number
  successRate: number
} {
  return useWorkflowStateSelector(state => {
    let total = 0
    let completed = 0
    let failed = 0
    let running = 0

    state.workflows.forEach(w => {
      total++
      if (w.status === 'completed') completed++
      else if (w.status === 'failed') failed++
      else if (['running', 'orchestrating', 'planning'].includes(w.status)) running++
    })

    return {
      total,
      completed,
      failed,
      running,
      successRate: total > 0 ? (completed / total) * 100 : 0
    }
  })
}

/**
 * Get progress for a specific workflow
 */
export function useWorkflowProgress(workflowId: string | null): number {
  return useWorkflowStateSelector(state => {
    if (!workflowId) return 0
    const workflow = state.workflows.get(workflowId)
    if (!workflow || workflow.nodes.size === 0) return 0

    let completed = 0
    workflow.nodes.forEach(node => {
      if (node.status === 'completed') completed++
    })

    return (completed / workflow.nodes.size) * 100
  })
}

// Export types
export type { WorkflowStateContextValue }

/**
 * Tool Chain Visualization React Hooks
 *
 * Epic 16, Story 16.9: Tool Chain Visualization in Workflow Map
 *
 * Provides React hooks for:
 * - Tool chain rendering and layout management
 * - Real-time node status updates
 * - Overall chain progress tracking
 * - Node details viewing
 * - Self-healing status visualization
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import type {
  ToolChainLayout,
  // ToolChainNode imported for type completeness but not currently used directly
  ToolChainNodeStatus,
  ToolChainUpdateEvent,
  VisualizationConfig,
  NodeDetailsPanel,
  ChainStatistics,
  OptimizedChain,
  LayoutDirection
} from '../types/tools'
import {
  ToolChainVisualizationService
} from '../services/ToolChainVisualizationService'

// ============================================================================
// Types
// ============================================================================

interface UseToolChainVisualizationOptions {
  config?: Partial<VisualizationConfig>
  autoSubscribe?: boolean
  onUpdate?: (event: ToolChainUpdateEvent) => void
}

interface UseToolChainVisualizationResult {
  layout: ToolChainLayout | null
  isLoading: boolean
  error: string | null
  buildLayout: (chain: OptimizedChain) => ToolChainLayout
  recalculateLayout: (direction?: LayoutDirection) => void
  clearLayout: () => void
  subscriptionId: string | null
}

interface UseNodeStatusOptions {
  layoutId: string
  nodeId: string
  onStatusChange?: (status: ToolChainNodeStatus, previousStatus: ToolChainNodeStatus) => void
}

interface UseNodeStatusResult {
  status: ToolChainNodeStatus
  progress: number
  message: string | null
  isActive: boolean
  isHealing: boolean
  updateStatus: (status: ToolChainNodeStatus, progress?: number, message?: string) => void
}

interface UseChainProgressOptions {
  layoutId: string
  onProgressChange?: (progress: number) => void
  onComplete?: () => void
}

interface UseChainProgressResult {
  overallProgress: number
  overallStatus: ToolChainNodeStatus
  completedNodes: number
  totalNodes: number
  activeNodes: string[]
  isComplete: boolean
  statistics: ChainStatistics | null
}

interface UseNodeDetailsOptions {
  layoutId: string
  nodeId: string | null
}

interface UseNodeDetailsResult {
  details: NodeDetailsPanel | null
  isLoading: boolean
  refreshDetails: () => void
}

interface UseSelfHealingStatusOptions {
  layoutId: string
  nodeId?: string
  onHealingStart?: (nodeId: string) => void
  onHealingComplete?: (nodeId: string, success: boolean) => void
}

interface UseSelfHealingStatusResult {
  healingNodes: Map<string, {
    attempt: number
    maxAttempts: number
    message: string
  }>
  isAnyHealing: boolean
  showHealingStatus: (nodeId: string, attempt: number, maxAttempts: number, message: string) => void
  clearHealingStatus: (nodeId: string) => void
}

// ============================================================================
// useToolChainVisualization Hook
// ============================================================================

/**
 * Main hook for tool chain visualization
 */
export function useToolChainVisualization(
  options: UseToolChainVisualizationOptions = {}
): UseToolChainVisualizationResult {
  const { config, autoSubscribe = true, onUpdate } = options
  const [layout, setLayout] = useState<ToolChainLayout | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)

  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  // Build layout from chain
  const buildLayout = useCallback((chain: OptimizedChain): ToolChainLayout => {
    setIsLoading(true)
    setError(null)

    try {
      const newLayout = ToolChainVisualizationService.buildChainLayout(chain, config)
      setLayout(newLayout)
      return newLayout
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to build layout'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [config])

  // Recalculate layout
  const recalculateLayout = useCallback((direction?: LayoutDirection) => {
    if (!layout) return

    try {
      const updatedLayout = ToolChainVisualizationService.recalculateLayout(
        layout.id,
        direction
      )
      if (updatedLayout) {
        setLayout(updatedLayout)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to recalculate layout'
      setError(message)
    }
  }, [layout])

  // Clear layout
  const clearLayout = useCallback(() => {
    if (layout) {
      ToolChainVisualizationService.clearLayout(layout.id)
    }
    setLayout(null)
    setError(null)
  }, [layout])

  // Subscribe to updates
  useEffect(() => {
    if (!layout || !autoSubscribe) return

    const handleUpdate = (event: ToolChainUpdateEvent) => {
      // Refresh layout from service
      const updatedLayout = ToolChainVisualizationService.getLayout(layout.id)
      if (updatedLayout) {
        setLayout({ ...updatedLayout })
      }

      // Call custom handler
      onUpdateRef.current?.(event)
    }

    const subId = ToolChainVisualizationService.subscribeToUpdates(
      layout.id,
      handleUpdate
    )
    setSubscriptionId(subId)

    return () => {
      ToolChainVisualizationService.unsubscribe(subId)
      setSubscriptionId(null)
    }
  }, [layout?.id, autoSubscribe])

  // Update config
  useEffect(() => {
    if (config) {
      ToolChainVisualizationService.updateConfig(config)
    }
  }, [config])

  return {
    layout,
    isLoading,
    error,
    buildLayout,
    recalculateLayout,
    clearLayout,
    subscriptionId
  }
}

// ============================================================================
// useNodeStatus Hook
// ============================================================================

/**
 * Hook for tracking individual node status
 */
export function useNodeStatus(
  options: UseNodeStatusOptions
): UseNodeStatusResult {
  const { layoutId, nodeId, onStatusChange } = options
  const [status, setStatus] = useState<ToolChainNodeStatus>('pending')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [isHealing, setIsHealing] = useState(false)

  const previousStatusRef = useRef<ToolChainNodeStatus>('pending')
  const onStatusChangeRef = useRef(onStatusChange)
  onStatusChangeRef.current = onStatusChange

  // Subscribe to updates for this specific node
  useEffect(() => {
    const handleUpdate = (event: ToolChainUpdateEvent) => {
      if (event.nodeId !== nodeId) return

      const layout = ToolChainVisualizationService.getLayout(layoutId)
      if (!layout) return

      const node = layout.nodes.find(n => n.id === nodeId)
      if (!node) return

      const previousStatus = previousStatusRef.current
      previousStatusRef.current = node.status

      setStatus(node.status)
      setProgress(node.progress)
      setMessage(node.statusMessage || null)
      setIsActive(layout.activeNodeIds.includes(nodeId))
      setIsHealing(node.isHealing || false)

      if (previousStatus !== node.status) {
        onStatusChangeRef.current?.(node.status, previousStatus)
      }
    }

    const subId = ToolChainVisualizationService.subscribeToUpdates(
      layoutId,
      handleUpdate
    )

    // Initial load
    const layout = ToolChainVisualizationService.getLayout(layoutId)
    if (layout) {
      const node = layout.nodes.find(n => n.id === nodeId)
      if (node) {
        setStatus(node.status)
        setProgress(node.progress)
        setMessage(node.statusMessage || null)
        setIsActive(layout.activeNodeIds.includes(nodeId))
        setIsHealing(node.isHealing || false)
        previousStatusRef.current = node.status
      }
    }

    return () => {
      ToolChainVisualizationService.unsubscribe(subId)
    }
  }, [layoutId, nodeId])

  // Update status function
  const updateStatus = useCallback(
    (newStatus: ToolChainNodeStatus, newProgress?: number, newMessage?: string) => {
      ToolChainVisualizationService.updateNodeStatus(
        layoutId,
        nodeId,
        newStatus,
        newProgress,
        newMessage
      )
    },
    [layoutId, nodeId]
  )

  return {
    status,
    progress,
    message,
    isActive,
    isHealing,
    updateStatus
  }
}

// ============================================================================
// useVisualizationChainProgress Hook
// ============================================================================

/**
 * Hook for tracking overall chain progress in visualization
 */
export function useVisualizationChainProgress(
  options: UseChainProgressOptions
): UseChainProgressResult {
  const { layoutId, onProgressChange, onComplete } = options
  const [overallProgress, setOverallProgress] = useState(0)
  const [overallStatus, setOverallStatus] = useState<ToolChainNodeStatus>('pending')
  const [completedNodes, setCompletedNodes] = useState(0)
  const [totalNodes, setTotalNodes] = useState(0)
  const [activeNodes, setActiveNodes] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [statistics, setStatistics] = useState<ChainStatistics | null>(null)

  const previousProgressRef = useRef(0)
  const onProgressChangeRef = useRef(onProgressChange)
  const onCompleteRef = useRef(onComplete)
  onProgressChangeRef.current = onProgressChange
  onCompleteRef.current = onComplete

  // Subscribe to updates
  useEffect(() => {
    const handleUpdate = () => {
      const layout = ToolChainVisualizationService.getLayout(layoutId)
      if (!layout) return

      const previousProgress = previousProgressRef.current
      previousProgressRef.current = layout.overallProgress

      setOverallProgress(layout.overallProgress)
      setOverallStatus(layout.overallStatus)
      setCompletedNodes(layout.statistics.completedNodes)
      setTotalNodes(layout.statistics.totalNodes)
      setActiveNodes([...layout.activeNodeIds])
      setStatistics(layout.statistics)

      const nowComplete = layout.overallStatus === 'completed'
      const wasComplete = isComplete
      setIsComplete(nowComplete)

      if (previousProgress !== layout.overallProgress) {
        onProgressChangeRef.current?.(layout.overallProgress)
      }

      if (nowComplete && !wasComplete) {
        onCompleteRef.current?.()
      }
    }

    const subId = ToolChainVisualizationService.subscribeToUpdates(
      layoutId,
      handleUpdate
    )

    // Initial load
    handleUpdate()

    return () => {
      ToolChainVisualizationService.unsubscribe(subId)
    }
  }, [layoutId, isComplete])

  return {
    overallProgress,
    overallStatus,
    completedNodes,
    totalNodes,
    activeNodes,
    isComplete,
    statistics
  }
}

// ============================================================================
// useNodeDetails Hook
// ============================================================================

/**
 * Hook for viewing detailed node information
 */
export function useNodeDetails(
  options: UseNodeDetailsOptions
): UseNodeDetailsResult {
  const { layoutId, nodeId } = options
  const [details, setDetails] = useState<NodeDetailsPanel | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load details when node changes
  useEffect(() => {
    if (!nodeId) {
      setDetails(null)
      return
    }

    setIsLoading(true)
    const nodeDetails = ToolChainVisualizationService.getNodeDetails(layoutId, nodeId)
    setDetails(nodeDetails)
    setIsLoading(false)
  }, [layoutId, nodeId])

  // Subscribe to updates for the selected node
  useEffect(() => {
    if (!nodeId) return

    const handleUpdate = (event: ToolChainUpdateEvent) => {
      if (event.nodeId !== nodeId && event.type !== 'batch_update') return

      const nodeDetails = ToolChainVisualizationService.getNodeDetails(layoutId, nodeId)
      setDetails(nodeDetails)
    }

    const subId = ToolChainVisualizationService.subscribeToUpdates(
      layoutId,
      handleUpdate
    )

    return () => {
      ToolChainVisualizationService.unsubscribe(subId)
    }
  }, [layoutId, nodeId])

  // Refresh details
  const refreshDetails = useCallback(() => {
    if (!nodeId) return
    const nodeDetails = ToolChainVisualizationService.getNodeDetails(layoutId, nodeId)
    setDetails(nodeDetails)
  }, [layoutId, nodeId])

  return {
    details,
    isLoading,
    refreshDetails
  }
}

// ============================================================================
// useSelfHealingStatus Hook
// ============================================================================

/**
 * Hook for tracking self-healing status across nodes
 */
export function useSelfHealingStatus(
  options: UseSelfHealingStatusOptions
): UseSelfHealingStatusResult {
  const { layoutId, nodeId, onHealingStart, onHealingComplete } = options
  const [healingNodes, setHealingNodes] = useState<Map<string, {
    attempt: number
    maxAttempts: number
    message: string
  }>>(new Map())

  const onHealingStartRef = useRef(onHealingStart)
  const onHealingCompleteRef = useRef(onHealingComplete)
  onHealingStartRef.current = onHealingStart
  onHealingCompleteRef.current = onHealingComplete

  // Subscribe to healing events
  useEffect(() => {
    const handleUpdate = (event: ToolChainUpdateEvent) => {
      // Filter by specific node if provided
      if (nodeId && event.nodeId !== nodeId) return

      if (event.type === 'healing_started' && event.nodeId) {
        setHealingNodes(prev => {
          const next = new Map(prev)
          next.set(event.nodeId!, {
            attempt: event.healingAttempt || 1,
            maxAttempts: event.healingMaxAttempts || 3,
            message: event.healingMessage || 'Resolving issue...'
          })
          return next
        })
        onHealingStartRef.current?.(event.nodeId)
      }

      if (event.type === 'node_completed' && event.nodeId) {
        const wasHealing = healingNodes.has(event.nodeId)
        if (wasHealing) {
          setHealingNodes(prev => {
            const next = new Map(prev)
            next.delete(event.nodeId!)
            return next
          })
          onHealingCompleteRef.current?.(event.nodeId, true)
        }
      }

      if (event.type === 'node_failed' && event.nodeId) {
        const wasHealing = healingNodes.has(event.nodeId)
        if (wasHealing) {
          setHealingNodes(prev => {
            const next = new Map(prev)
            next.delete(event.nodeId!)
            return next
          })
          onHealingCompleteRef.current?.(event.nodeId, false)
        }
      }

      // Handle batch updates
      if (event.type === 'batch_update' && event.events) {
        event.events.forEach(subEvent => {
          if (nodeId && subEvent.nodeId !== nodeId) return

          if (subEvent.type === 'healing_started' && subEvent.nodeId) {
            setHealingNodes(prev => {
              const next = new Map(prev)
              next.set(subEvent.nodeId!, {
                attempt: subEvent.healingAttempt || 1,
                maxAttempts: subEvent.healingMaxAttempts || 3,
                message: subEvent.healingMessage || 'Resolving issue...'
              })
              return next
            })
            onHealingStartRef.current?.(subEvent.nodeId)
          }
        })
      }
    }

    const subId = ToolChainVisualizationService.subscribeToUpdates(
      layoutId,
      handleUpdate
    )

    return () => {
      ToolChainVisualizationService.unsubscribe(subId)
    }
  }, [layoutId, nodeId, healingNodes])

  // Is any node healing
  const isAnyHealing = useMemo(() => healingNodes.size > 0, [healingNodes])

  // Show healing status
  const showHealingStatus = useCallback(
    (targetNodeId: string, attempt: number, maxAttempts: number, message: string) => {
      ToolChainVisualizationService.showHealingStatus(
        layoutId,
        targetNodeId,
        attempt,
        maxAttempts,
        message
      )
    },
    [layoutId]
  )

  // Clear healing status
  const clearHealingStatus = useCallback(
    (targetNodeId: string) => {
      ToolChainVisualizationService.clearHealingStatus(layoutId, targetNodeId)
      setHealingNodes(prev => {
        const next = new Map(prev)
        next.delete(targetNodeId)
        return next
      })
    },
    [layoutId]
  )

  return {
    healingNodes,
    isAnyHealing,
    showHealingStatus,
    clearHealingStatus
  }
}

// ============================================================================
// useExecutionPath Hook
// ============================================================================

/**
 * Hook for tracking the execution path through the chain
 */
export function useExecutionPath(layoutId: string): string[] {
  const [path, setPath] = useState<string[]>([])

  useEffect(() => {
    const handleUpdate = () => {
      const executionPath = ToolChainVisualizationService.getExecutionPath(layoutId)
      setPath(executionPath)
    }

    const subId = ToolChainVisualizationService.subscribeToUpdates(
      layoutId,
      handleUpdate
    )

    // Initial load
    handleUpdate()

    return () => {
      ToolChainVisualizationService.unsubscribe(subId)
    }
  }, [layoutId])

  return path
}

// ============================================================================
// useVisualizationConfig Hook
// ============================================================================

/**
 * Hook for managing visualization configuration
 */
export function useVisualizationConfig(
  initialConfig?: Partial<VisualizationConfig>
): {
  config: VisualizationConfig
  updateConfig: (updates: Partial<VisualizationConfig>) => void
  resetConfig: () => void
} {
  const [config, setConfig] = useState<VisualizationConfig>(() => ({
    ...ToolChainVisualizationService.getConfig(),
    ...initialConfig
  }))

  const updateConfig = useCallback((updates: Partial<VisualizationConfig>) => {
    ToolChainVisualizationService.updateConfig(updates)
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const resetConfig = useCallback(() => {
    const defaultConfig = ToolChainVisualizationService.getConfig()
    setConfig(defaultConfig)
  }, [])

  return {
    config,
    updateConfig,
    resetConfig
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  UseToolChainVisualizationOptions,
  UseToolChainVisualizationResult,
  UseNodeStatusOptions,
  UseNodeStatusResult,
  UseChainProgressOptions,
  UseChainProgressResult,
  UseNodeDetailsOptions,
  UseNodeDetailsResult,
  UseSelfHealingStatusOptions,
  UseSelfHealingStatusResult
}

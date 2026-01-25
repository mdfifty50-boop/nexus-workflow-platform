/**
 * Tool Chain Visualization Service
 *
 * Epic 16, Story 16.9: Tool Chain Visualization in Workflow Map
 *
 * Provides n8n-style visualization of tool chains with real-time progress updates.
 * Supports multiple node types (tool, transform, MCP connector) and status tracking.
 *
 * Key Features:
 * - Auto-layout algorithm for node positioning
 * - Real-time status updates (< 500ms latency per NFR)
 * - Self-healing status visualization
 * - Edge routing for data flow connections
 * - Support for 20+ node chains
 */

import type {
  ToolChainNode,
  ToolChainEdge,
  ToolChainLayout,
  NodePosition,
  VisualizationConfig,
  ToolChainVisualizationState,
  ToolChainNodeStatus,
  ToolChainUpdateEvent,
  NodeDetailsPanel,
  ChainStatistics,
  LayoutBounds,
  LayoutDirection,
  EdgePath,
  OptimizedChain
} from '../types/tools'

import {
  DEFAULT_VISUALIZATION_CONFIG
} from '../types/tools'

// ============================================================================
// Types
// ============================================================================

/**
 * Layout calculation result
 */
interface LayoutResult {
  nodes: Map<string, NodePosition>
  edges: Map<string, EdgePath>
  bounds: LayoutBounds
}

/**
 * Node placement info during layout
 */
interface NodePlacement {
  id: string
  level: number
  position: number
  dependencies: string[]
  dependents: string[]
}

/**
 * Update callback type
 */
type UpdateCallback = (event: ToolChainUpdateEvent) => void

/**
 * Subscription info
 */
interface Subscription {
  id: string
  chainId: string
  callback: UpdateCallback
  filter?: ToolChainNodeStatus[]
}

// ============================================================================
// Tool Chain Visualization Service
// ============================================================================

class ToolChainVisualizationServiceImpl {
  private layouts: Map<string, ToolChainLayout> = new Map()
  private subscriptions: Map<string, Subscription> = new Map()
  private updateQueue: Map<string, ToolChainUpdateEvent[]> = new Map()
  private lastUpdateTime: Map<string, number> = new Map()
  private config: VisualizationConfig = DEFAULT_VISUALIZATION_CONFIG
  private animationFrameId: number | null = null
  private isProcessingUpdates = false

  // ==========================================================================
  // Layout Engine
  // ==========================================================================

  /**
   * Build visualization layout from optimized chain
   */
  buildChainLayout(
    chain: OptimizedChain,
    config?: Partial<VisualizationConfig>
  ): ToolChainLayout {
    const mergedConfig = { ...this.config, ...config }

    // Convert chain nodes to visualization nodes
    const nodes = this.convertChainNodesToVisualizationNodes(chain, mergedConfig)

    // Calculate node positions
    const positions = this.calculateNodePositions(nodes, mergedConfig)

    // Apply positions to nodes
    nodes.forEach(node => {
      const pos = positions.nodes.get(node.id)
      if (pos) {
        node.position = pos
      }
    })

    // Generate edges from chain edges
    const edges = this.generateEdgesFromChain(chain, nodes, mergedConfig)

    // Calculate edge routes
    const edgeRoutes = this.calculateEdgeRoutes(nodes, edges, mergedConfig)
    edges.forEach(edge => {
      const route = edgeRoutes.get(edge.id)
      if (route) {
        edge.path = route
      }
    })

    // Create layout
    const now = new Date()
    const layout: ToolChainLayout = {
      id: `layout-${chain.id}`,
      name: chain.name || 'Tool Chain',
      nodes,
      edges,
      bounds: positions.bounds,
      overallStatus: 'pending',
      overallProgress: 0,
      activeNodeIds: [],
      activeEdgeIds: [],
      statistics: this.calculateStatistics(nodes, edges),
      createdAt: now,
      updatedAt: now
    }

    // Store layout
    this.layouts.set(layout.id, layout)

    return layout
  }

  /**
   * Convert chain nodes to visualization nodes
   */
  private convertChainNodesToVisualizationNodes(
    chain: OptimizedChain,
    config: VisualizationConfig
  ): ToolChainNode[] {
    const nodes: ToolChainNode[] = []

    // Convert each node from the chain
    chain.nodes.forEach((chainNode) => {
      const nodeType = chainNode.type || 'tool'
      const style = config.nodeStyles[nodeType] || config.nodeStyles.tool

      // Determine input/output ports from edges
      const incomingEdges = chain.edges.filter(e => e.targetId === chainNode.id)
      const outgoingEdges = chain.edges.filter(e => e.sourceId === chainNode.id)
      const inputConnections = incomingEdges.map(e => e.sourceId)
      const outputConnections = outgoingEdges.map(e => e.targetId)

      const visualNode: ToolChainNode = {
        id: chainNode.id,
        type: nodeType,
        name: chainNode.name,
        description: chainNode.description,
        icon: chainNode.icon,
        status: 'pending',
        progress: 0,
        position: { x: 0, y: 0 },
        dimensions: { width: style.defaultWidth || 160, height: style.defaultHeight || 80 },
        style,
        toolId: chainNode.toolId,
        metadata: chainNode.config || {},
        inputPorts: inputConnections,
        outputPorts: outputConnections,
        connections: {
          inputs: inputConnections,
          outputs: outputConnections
        }
      }

      nodes.push(visualNode)
    })

    return nodes
  }


  /**
   * Calculate node positions using auto-layout algorithm
   */
  calculateNodePositions(
    nodes: ToolChainNode[],
    config: VisualizationConfig
  ): LayoutResult {
    // Build dependency graph
    const placements = this.buildPlacementGraph(nodes)

    // Assign levels (topological sort)
    this.assignLevels(placements)

    // Position nodes within levels
    this.positionNodesInLevels(placements, config)

    // Calculate actual positions
    const positions = new Map<string, NodePosition>()
    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity

    placements.forEach(placement => {
      const node = nodes.find(n => n.id === placement.id)
      if (!node) return

      let x: number, y: number

      if (config.direction === 'horizontal') {
        x = placement.level * config.levelSpacing
        y = placement.position * config.nodeSpacing
      } else {
        x = placement.position * config.nodeSpacing
        y = placement.level * config.levelSpacing
      }

      positions.set(placement.id, { x, y })

      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + node.dimensions.width)
      maxY = Math.max(maxY, y + node.dimensions.height)
    })

    // Calculate bounds
    const bounds: LayoutBounds = {
      width: maxX - minX + config.nodeSpacing,
      height: maxY - minY + config.nodeSpacing,
      minX,
      minY,
      maxX,
      maxY
    }

    return {
      nodes: positions,
      edges: new Map(),
      bounds
    }
  }

  /**
   * Build placement graph from nodes
   */
  private buildPlacementGraph(nodes: ToolChainNode[]): Map<string, NodePlacement> {
    const placements = new Map<string, NodePlacement>()

    nodes.forEach(node => {
      placements.set(node.id, {
        id: node.id,
        level: -1,
        position: 0,
        dependencies: node.connections.inputs,
        dependents: node.connections.outputs
      })
    })

    return placements
  }

  /**
   * Assign levels using topological sort
   */
  private assignLevels(placements: Map<string, NodePlacement>): void {
    const visited = new Set<string>()
    const levels = new Map<string, number>()

    const assignLevel = (id: string): number => {
      if (levels.has(id)) {
        return levels.get(id)!
      }

      const placement = placements.get(id)
      if (!placement) return 0

      if (visited.has(id)) {
        // Cycle detected, break it
        return 0
      }

      visited.add(id)

      let maxDependencyLevel = -1
      placement.dependencies.forEach(depId => {
        if (placements.has(depId)) {
          maxDependencyLevel = Math.max(maxDependencyLevel, assignLevel(depId))
        }
      })

      const level = maxDependencyLevel + 1
      levels.set(id, level)
      placement.level = level

      visited.delete(id)
      return level
    }

    placements.forEach((_, id) => {
      if (!levels.has(id)) {
        assignLevel(id)
      }
    })
  }

  /**
   * Position nodes within their levels
   */
  private positionNodesInLevels(
    placements: Map<string, NodePlacement>,
    _config: VisualizationConfig
  ): void {
    // Group by level
    const levelGroups = new Map<number, NodePlacement[]>()
    placements.forEach(placement => {
      const group = levelGroups.get(placement.level) || []
      group.push(placement)
      levelGroups.set(placement.level, group)
    })

    // Position nodes in each level
    levelGroups.forEach((group, _level) => {
      // Sort by average position of dependencies for better edge routing
      group.sort((a, b) => {
        const aAvg = this.getAverageDependencyPosition(a, placements)
        const bAvg = this.getAverageDependencyPosition(b, placements)
        return aAvg - bAvg
      })

      // Assign positions
      group.forEach((placement, index) => {
        placement.position = index - (group.length - 1) / 2
      })
    })
  }

  /**
   * Get average position of dependencies
   */
  private getAverageDependencyPosition(
    placement: NodePlacement,
    placements: Map<string, NodePlacement>
  ): number {
    if (placement.dependencies.length === 0) return 0

    let sum = 0
    let count = 0
    placement.dependencies.forEach(depId => {
      const dep = placements.get(depId)
      if (dep) {
        sum += dep.position
        count++
      }
    })

    return count > 0 ? sum / count : 0
  }

  /**
   * Generate edges from chain edges definition
   */
  private generateEdgesFromChain(
    chain: OptimizedChain,
    _nodes: ToolChainNode[],
    config: VisualizationConfig
  ): ToolChainEdge[] {
    const edges: ToolChainEdge[] = []

    // Convert chain edges to visualization edges
    chain.edges.forEach(chainEdge => {
      edges.push(this.createEdge(
        chainEdge.sourceId,
        chainEdge.targetId,
        chainEdge.type || 'data_flow',
        config
      ))
    })

    return edges
  }

  /**
   * Create edge
   */
  private createEdge(
    sourceId: string,
    targetId: string,
    type: 'data_flow' | 'control_flow' | 'error_flow' | 'conditional',
    config: VisualizationConfig
  ): ToolChainEdge {
    const edgeStyle = config.edgeStyles[type]
    return {
      id: `edge-${sourceId}-${targetId}`,
      sourceNodeId: sourceId,
      sourcePort: 'output',
      targetNodeId: targetId,
      targetPort: 'input',
      type,
      status: 'pending',
      style: {
        color: edgeStyle.strokeColor,
        width: edgeStyle.strokeWidth,
        dashPattern: edgeStyle.strokeDasharray
      },
      animated: edgeStyle.animated,
      dataFlowing: false,
      path: {
        points: [],
        controlPoints: []
      }
    }
  }

  /**
   * Calculate edge routes to avoid node overlaps
   */
  calculateEdgeRoutes(
    nodes: ToolChainNode[],
    edges: ToolChainEdge[],
    config: VisualizationConfig
  ): Map<string, EdgePath> {
    const routes = new Map<string, EdgePath>()
    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    edges.forEach(edge => {
      const source = nodeMap.get(edge.sourceNodeId)
      const target = nodeMap.get(edge.targetNodeId)

      if (!source || !target) return

      // Calculate connection points
      const sourcePoint = this.getConnectionPoint(source, 'output', config)
      const targetPoint = this.getConnectionPoint(target, 'input', config)

      // Generate path with control points for smooth curves
      const path = this.generateEdgePath(sourcePoint, targetPoint, config)

      routes.set(edge.id, path)
    })

    return routes
  }

  /**
   * Get connection point on node
   */
  private getConnectionPoint(
    node: ToolChainNode,
    side: 'input' | 'output',
    config: VisualizationConfig
  ): { x: number; y: number } {
    const { x, y } = node.position
    const { width, height } = node.dimensions

    if (config.direction === 'horizontal') {
      return {
        x: side === 'input' ? x : x + width,
        y: y + height / 2
      }
    } else {
      return {
        x: x + width / 2,
        y: side === 'input' ? y : y + height
      }
    }
  }

  /**
   * Generate edge path with bezier curves
   */
  private generateEdgePath(
    source: { x: number; y: number },
    target: { x: number; y: number },
    config: VisualizationConfig
  ): EdgePath {
    const points = [source, target]

    // Calculate control points for bezier curve
    const dx = target.x - source.x
    const dy = target.y - source.y

    const controlPoints = config.direction === 'horizontal'
      ? [
          { x: source.x + dx * 0.5, y: source.y },
          { x: source.x + dx * 0.5, y: target.y }
        ]
      : [
          { x: source.x, y: source.y + dy * 0.5 },
          { x: target.x, y: source.y + dy * 0.5 }
        ]

    return { points, controlPoints }
  }

  // ==========================================================================
  // Status Manager
  // ==========================================================================

  /**
   * Update node status with real-time propagation
   */
  updateNodeStatus(
    layoutId: string,
    nodeId: string,
    status: ToolChainNodeStatus,
    progress?: number,
    message?: string
  ): void {
    const layout = this.layouts.get(layoutId)
    if (!layout) return

    const node = layout.nodes.find(n => n.id === nodeId)
    if (!node) return

    // Update node
    const previousStatus = node.status
    node.status = status
    if (progress !== undefined) {
      node.progress = progress
    }
    if (message) {
      node.statusMessage = message
    }

    // Update timestamps
    if (status === 'running' && !node.startTime) {
      node.startTime = new Date()
    }
    if (status === 'completed' || status === 'failed') {
      node.endTime = new Date()
      if (node.startTime) {
        node.actualDuration = node.endTime.getTime() - node.startTime.getTime()
      }
    }

    // Update active nodes
    this.updateActiveNodes(layout)

    // Update overall progress
    this.updateOverallProgress(layout)

    // Update connected edges
    this.updateEdgeStatus(layout, nodeId, status)

    // Queue update event
    this.queueUpdate(layoutId, {
      type: 'node_status_change',
      layoutId,
      nodeId,
      timestamp: new Date(),
      previousStatus,
      newStatus: status,
      progress: node.progress,
      message
    })
  }

  /**
   * Update self-healing status on node
   */
  showHealingStatus(
    layoutId: string,
    nodeId: string,
    attempt: number,
    maxAttempts: number,
    message: string
  ): void {
    const layout = this.layouts.get(layoutId)
    if (!layout) return

    const node = layout.nodes.find(n => n.id === nodeId)
    if (!node) return

    node.status = 'self_healing'
    node.isHealing = true
    node.healingAttempt = attempt
    node.healingMaxAttempts = maxAttempts
    node.healingMessage = message
    node.statusMessage = `Resolving connection issue... Attempt ${attempt}/${maxAttempts}`

    this.queueUpdate(layoutId, {
      type: 'healing_started',
      layoutId,
      nodeId,
      timestamp: new Date(),
      healingAttempt: attempt,
      healingMaxAttempts: maxAttempts,
      healingMessage: message
    })
  }

  /**
   * Clear healing status
   */
  clearHealingStatus(layoutId: string, nodeId: string): void {
    const layout = this.layouts.get(layoutId)
    if (!layout) return

    const node = layout.nodes.find(n => n.id === nodeId)
    if (!node) return

    node.isHealing = false
    node.healingAttempt = undefined
    node.healingMaxAttempts = undefined
    node.healingMessage = undefined
  }

  /**
   * Update active nodes list
   */
  private updateActiveNodes(layout: ToolChainLayout): void {
    layout.activeNodeIds = layout.nodes
      .filter(n => n.status === 'running' || n.status === 'self_healing')
      .map(n => n.id)
  }

  /**
   * Update overall progress
   */
  private updateOverallProgress(layout: ToolChainLayout): void {
    const completedNodes = layout.nodes.filter(
      n => n.status === 'completed' || n.status === 'skipped'
    ).length

    const runningNodes = layout.nodes.filter(n => n.status === 'running')
    const runningProgress = runningNodes.reduce((sum, n) => sum + n.progress, 0)

    const totalProgress = (completedNodes * 100 + runningProgress) / layout.nodes.length
    layout.overallProgress = Math.round(totalProgress)

    // Update overall status
    if (layout.nodes.every(n => n.status === 'completed' || n.status === 'skipped')) {
      layout.overallStatus = 'completed'
    } else if (layout.nodes.some(n => n.status === 'failed')) {
      layout.overallStatus = 'failed'
    } else if (layout.nodes.some(n => n.status === 'running' || n.status === 'self_healing')) {
      layout.overallStatus = layout.nodes.some(n => n.status === 'self_healing')
        ? 'self_healing'
        : 'running'
    } else if (layout.nodes.some(n => n.status === 'queued')) {
      layout.overallStatus = 'queued'
    }

    // Update statistics
    layout.statistics = this.calculateStatistics(layout.nodes, layout.edges)
  }

  /**
   * Update edge status based on connected nodes
   */
  private updateEdgeStatus(
    layout: ToolChainLayout,
    nodeId: string,
    nodeStatus: ToolChainNodeStatus
  ): void {
    // Update outgoing edges
    layout.edges.forEach(edge => {
      if (edge.sourceNodeId === nodeId) {
        if (nodeStatus === 'completed') {
          edge.status = 'active'
          edge.dataFlowing = true
          edge.animated = true
          layout.activeEdgeIds.push(edge.id)
        } else if (nodeStatus === 'running') {
          edge.status = 'pending'
          edge.animated = false
        }
      }

      if (edge.targetNodeId === nodeId) {
        if (nodeStatus === 'completed') {
          edge.status = 'completed'
          edge.dataFlowing = false
          edge.animated = false
          layout.activeEdgeIds = layout.activeEdgeIds.filter(id => id !== edge.id)
        }
      }
    })
  }

  /**
   * Mark node as completed
   */
  markCompleted(
    layoutId: string,
    nodeId: string,
    result?: Record<string, unknown>
  ): void {
    const layout = this.layouts.get(layoutId)
    if (!layout) return

    const node = layout.nodes.find(n => n.id === nodeId)
    if (!node) return

    node.status = 'completed'
    node.progress = 100
    node.endTime = new Date()
    if (node.startTime) {
      node.actualDuration = node.endTime.getTime() - node.startTime.getTime()
    }
    if (result) {
      node.executionResult = result
    }

    this.clearHealingStatus(layoutId, nodeId)
    this.updateActiveNodes(layout)
    this.updateOverallProgress(layout)
    this.updateEdgeStatus(layout, nodeId, 'completed')

    this.queueUpdate(layoutId, {
      type: 'node_completed',
      layoutId,
      nodeId,
      timestamp: new Date()
    })
  }

  /**
   * Mark node as failed
   */
  markFailed(
    layoutId: string,
    nodeId: string,
    error: string
  ): void {
    const layout = this.layouts.get(layoutId)
    if (!layout) return

    const node = layout.nodes.find(n => n.id === nodeId)
    if (!node) return

    node.status = 'failed'
    node.endTime = new Date()
    node.errorMessage = error

    this.clearHealingStatus(layoutId, nodeId)
    this.updateActiveNodes(layout)
    this.updateOverallProgress(layout)

    this.queueUpdate(layoutId, {
      type: 'node_failed',
      layoutId,
      nodeId,
      timestamp: new Date(),
      error
    })
  }

  // ==========================================================================
  // Real-Time Updates
  // ==========================================================================

  /**
   * Subscribe to layout updates
   */
  subscribeToUpdates(
    layoutId: string,
    callback: UpdateCallback,
    filter?: ToolChainNodeStatus[]
  ): string {
    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substring(7)}`

    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      chainId: layoutId,
      callback,
      filter
    })

    // Start update processing if not already running
    this.startUpdateProcessing()

    return subscriptionId
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId)

    // Stop processing if no subscriptions
    if (this.subscriptions.size === 0) {
      this.stopUpdateProcessing()
    }
  }

  /**
   * Queue update for throttled delivery
   */
  private queueUpdate(layoutId: string, event: ToolChainUpdateEvent): void {
    const queue = this.updateQueue.get(layoutId) || []
    queue.push(event)
    this.updateQueue.set(layoutId, queue)
  }

  /**
   * Start update processing loop
   */
  private startUpdateProcessing(): void {
    if (this.isProcessingUpdates) return
    this.isProcessingUpdates = true

    const processUpdates = () => {
      const now = Date.now()

      this.updateQueue.forEach((events, layoutId) => {
        if (events.length === 0) return

        const lastUpdate = this.lastUpdateTime.get(layoutId) || 0
        const timeSinceLastUpdate = now - lastUpdate

        // Throttle updates to meet NFR (< 500ms latency, using 100ms throttle)
        if (timeSinceLastUpdate >= this.config.updateThrottleMs) {
          // Batch events for this layout
          const batchedEvent: ToolChainUpdateEvent = {
            type: 'batch_update',
            layoutId,
            timestamp: new Date(),
            events: [...events]
          }

          // Clear queue
          this.updateQueue.set(layoutId, [])
          this.lastUpdateTime.set(layoutId, now)

          // Notify subscribers
          this.subscriptions.forEach(sub => {
            if (sub.chainId === layoutId) {
              try {
                sub.callback(batchedEvent)
              } catch (error) {
                console.error('Error in update callback:', error)
              }
            }
          })
        }
      })

      if (this.isProcessingUpdates) {
        this.animationFrameId = requestAnimationFrame(processUpdates)
      }
    }

    this.animationFrameId = requestAnimationFrame(processUpdates)
  }

  /**
   * Stop update processing
   */
  private stopUpdateProcessing(): void {
    this.isProcessingUpdates = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  // ==========================================================================
  // Detail Provider
  // ==========================================================================

  /**
   * Get detailed node information
   */
  getNodeDetails(layoutId: string, nodeId: string): NodeDetailsPanel | null {
    const layout = this.layouts.get(layoutId)
    if (!layout) return null

    const node = layout.nodes.find(n => n.id === nodeId)
    if (!node) return null

    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      status: node.status,
      progress: node.progress,
      startTime: node.startTime,
      endTime: node.endTime,
      duration: node.actualDuration,
      estimatedDuration: node.expectedDuration,
      input: node.metadata?.input,
      output: node.executionResult,
      error: node.errorMessage,
      logs: node.executionLogs || [],
      metrics: {
        tokensUsed: node.metadata?.tokensUsed as number | undefined,
        cost: node.actualCost,
        retryCount: node.healingAttempt
      },
      isHealing: node.isHealing,
      healingAttempt: node.healingAttempt,
      healingMaxAttempts: node.healingMaxAttempts,
      healingMessage: node.healingMessage
    }
  }

  /**
   * Get execution path (active and completed nodes)
   */
  getExecutionPath(layoutId: string): string[] {
    const layout = this.layouts.get(layoutId)
    if (!layout) return []

    // Return ordered path of completed and active nodes
    return layout.nodes
      .filter(n =>
        n.status === 'completed' ||
        n.status === 'running' ||
        n.status === 'self_healing'
      )
      .sort((a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0))
      .map(n => n.id)
  }

  /**
   * Get chain statistics
   */
  getChainStatistics(layoutId: string): ChainStatistics | null {
    const layout = this.layouts.get(layoutId)
    if (!layout) return null

    return layout.statistics
  }

  /**
   * Calculate statistics from nodes and edges
   */
  private calculateStatistics(
    nodes: ToolChainNode[],
    _edges: ToolChainEdge[]
  ): ChainStatistics {
    void _edges // Reserved for future edge-based statistics (e.g., critical path analysis)
    const completedNodes = nodes.filter(n => n.status === 'completed')
    const failedNodes = nodes.filter(n => n.status === 'failed')

    const totalCost = nodes.reduce((sum, n) => sum + (n.actualCost || 0), 0)
    // estimatedCost reserved for future cost variance analysis
    const _estimatedCost = nodes.reduce((sum, n) => sum + (n.estimatedCost || 0), 0)
    void _estimatedCost

    const totalDuration = completedNodes.reduce(
      (sum, n) => sum + (n.actualDuration || 0),
      0
    )
    const estimatedDuration = nodes.reduce(
      (sum, n) => sum + (n.expectedDuration || 0),
      0
    )

    const healingCount = nodes.filter(n => n.healingAttempt && n.healingAttempt > 0).length
    const activeNodeCount = nodes.filter(n => n.status === 'running').length
    const skippedNodeCount = nodes.filter(n => n.status === 'skipped').length

    return {
      totalNodes: nodes.length,
      completedNodes: completedNodes.length,
      failedNodes: failedNodes.length,
      skippedNodes: skippedNodeCount,
      activeNodes: activeNodeCount,
      healingNodes: healingCount,
      overallProgress: nodes.length > 0
        ? (completedNodes.length / nodes.length) * 100
        : 0,
      estimatedTimeRemaining: estimatedDuration - totalDuration,
      totalDuration,
      totalCost
    }
  }

  // ==========================================================================
  // Layout Management
  // ==========================================================================

  /**
   * Get layout by ID
   */
  getLayout(layoutId: string): ToolChainLayout | null {
    return this.layouts.get(layoutId) || null
  }

  /**
   * Update visualization configuration
   */
  updateConfig(config: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): VisualizationConfig {
    return { ...this.config }
  }

  /**
   * Recalculate layout positions
   */
  recalculateLayout(
    layoutId: string,
    direction?: LayoutDirection
  ): ToolChainLayout | null {
    const layout = this.layouts.get(layoutId)
    if (!layout) return null

    const config = direction
      ? { ...this.config, direction }
      : this.config

    const positions = this.calculateNodePositions(layout.nodes, config)

    layout.nodes.forEach(node => {
      const pos = positions.nodes.get(node.id)
      if (pos) {
        node.position = pos
      }
    })

    layout.bounds = positions.bounds

    // Recalculate edge routes
    const edgeRoutes = this.calculateEdgeRoutes(layout.nodes, layout.edges, config)
    layout.edges.forEach(edge => {
      const route = edgeRoutes.get(edge.id)
      if (route) {
        edge.path = route
      }
    })

    return layout
  }

  /**
   * Clear layout
   */
  clearLayout(layoutId: string): void {
    this.layouts.delete(layoutId)
    this.updateQueue.delete(layoutId)
    this.lastUpdateTime.delete(layoutId)
  }

  /**
   * Clear all layouts
   */
  clearAllLayouts(): void {
    this.layouts.clear()
    this.updateQueue.clear()
    this.lastUpdateTime.clear()
    this.subscriptions.clear()
    this.stopUpdateProcessing()
  }

  // ==========================================================================
  // Visualization State
  // ==========================================================================

  /**
   * Get full visualization state
   */
  getVisualizationState(layoutId: string): ToolChainVisualizationState | null {
    const layout = this.layouts.get(layoutId)
    if (!layout) return null

    return {
      layout,
      config: this.config,
      subscriptionCount: Array.from(this.subscriptions.values())
        .filter(s => s.chainId === layoutId).length,
      pendingUpdates: (this.updateQueue.get(layoutId) || []).length,
      lastUpdateTime: this.lastUpdateTime.get(layoutId) || 0
    }
  }
}

// Export singleton instance
export const ToolChainVisualizationService = new ToolChainVisualizationServiceImpl()

// Export class for testing
export { ToolChainVisualizationServiceImpl }

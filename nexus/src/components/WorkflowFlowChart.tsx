/**
 * WorkflowFlowChart - Intelligent workflow visualization
 *
 * Features:
 * - Graph-based layout that shows actual flow
 * - Visual distinction for loops/revisited nodes
 * - Branching for conditions
 * - Animated data flow indicators
 */

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'output' | 'ai'
  tool: string
  toolIcon: string
  name: string
  description: string
  config: Record<string, unknown>
  position?: { x: number; y: number }
}

interface Connection {
  from: string
  to: string
  label?: string
  isLoop?: boolean
}

interface WorkflowFlowChartProps {
  nodes: WorkflowNode[]
  connections: Connection[]
  workflowName?: string
  compact?: boolean
  onNodeClick?: (nodeId: string) => void
}

interface LayoutNode extends WorkflowNode {
  layer: number
  column: number
  x: number
  y: number
  incomingCount: number
  outgoingCount: number
  isLoopTarget: boolean
}

interface LayoutEdge extends Connection {
  isBackEdge: boolean
  sourceNode: LayoutNode
  targetNode: LayoutNode
}

// Color schemes for different node types
const NODE_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  trigger: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', icon: '🟢' },
  action: { bg: 'bg-blue-500/20', border: 'border-blue-500', icon: '⚡' },
  condition: { bg: 'bg-amber-500/20', border: 'border-amber-500', icon: '🔀' },
  output: { bg: 'bg-purple-500/20', border: 'border-purple-500', icon: '📤' },
  default: { bg: 'bg-slate-700/50', border: 'border-slate-600', icon: '⚙️' }
}

/**
 * @NEXUS-FIX-077: Node hover tooltip + click expand for mobile UX
 * - Hover: Shows brief tooltip with full name
 * - Click/Tap: Expands to show full description (mobile-friendly)
 */
export function WorkflowFlowChart({
  nodes,
  connections,
  workflowName,
  compact = false,
  onNodeClick
}: WorkflowFlowChartProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [expandedView, setExpandedView] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null) // For click-to-expand

  // Handle node click - expand detail panel (mobile-friendly)
  const handleNodeClick = (nodeId: string) => {
    // Toggle selection - tap again to close on mobile
    setSelectedNode(prev => prev === nodeId ? null : nodeId)
    // Also call external handler if provided
    onNodeClick?.(nodeId)
  }

  // Get selected node data
  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null

  // Build graph and compute layout
  const { layoutNodes, layoutEdges, dimensions } = useMemo(() => {
    if (nodes.length === 0) {
      return { layoutNodes: [], layoutEdges: [], dimensions: { width: 300, height: 100 } }
    }

    // Build adjacency lists
    const outgoing = new Map<string, string[]>()
    const incoming = new Map<string, string[]>()

    nodes.forEach(node => {
      outgoing.set(node.id, [])
      incoming.set(node.id, [])
    })

    connections.forEach(conn => {
      const out = outgoing.get(conn.from)
      if (out) out.push(conn.to)
      const inc = incoming.get(conn.to)
      if (inc) inc.push(conn.from)
    })

    // Find start nodes (no incoming edges or trigger type)
    const startNodes = nodes.filter(n =>
      n.type === 'trigger' || (incoming.get(n.id)?.length || 0) === 0
    )

    // Assign layers using BFS (longest path for better visualization)
    const layers = new Map<string, number>()
    const visited = new Set<string>()
    const queue: Array<{ id: string; layer: number }> = []

    // Initialize with start nodes
    startNodes.forEach(node => {
      queue.push({ id: node.id, layer: 0 })
    })

    // If no start nodes found, use first node
    if (queue.length === 0 && nodes.length > 0) {
      queue.push({ id: nodes[0].id, layer: 0 })
    }

    while (queue.length > 0) {
      const { id, layer } = queue.shift()!

      // Update layer to maximum (for proper flow visualization)
      const currentLayer = layers.get(id) ?? -1
      if (layer > currentLayer) {
        layers.set(id, layer)
      }

      if (visited.has(id)) continue
      visited.add(id)

      // Process outgoing edges
      const targets = outgoing.get(id) || []
      targets.forEach(targetId => {
        queue.push({ id: targetId, layer: layer + 1 })
      })
    }

    // Handle disconnected nodes
    nodes.forEach(node => {
      if (!layers.has(node.id)) {
        layers.set(node.id, 0)
      }
    })

    // Group nodes by layer
    const layerGroups = new Map<number, string[]>()
    layers.forEach((layer, nodeId) => {
      const group = layerGroups.get(layer) || []
      group.push(nodeId)
      layerGroups.set(layer, group)
    })

    // Calculate dimensions
    const maxLayer = Math.max(...Array.from(layers.values()), 0)
    const maxNodesInLayer = Math.max(
      ...Array.from(layerGroups.values()).map(g => g.length),
      1
    )

    // Node dimensions and spacing
    const nodeWidth = compact ? 120 : 160
    const nodeHeight = compact ? 50 : 70
    const horizontalSpacing = compact ? 40 : 60
    const verticalSpacing = compact ? 30 : 50
    const padding = compact ? 20 : 40

    const totalWidth = (maxLayer + 1) * (nodeWidth + horizontalSpacing) + padding * 2
    const totalHeight = maxNodesInLayer * (nodeHeight + verticalSpacing) + padding * 2

    // Detect loop targets (nodes that receive back-edges)
    const loopTargets = new Set<string>()
    connections.forEach(conn => {
      const fromLayer = layers.get(conn.from) ?? 0
      const toLayer = layers.get(conn.to) ?? 0
      if (toLayer <= fromLayer) {
        loopTargets.add(conn.to)
      }
    })

    // Create layout nodes with positions
    const nodeMap = new Map<string, WorkflowNode>()
    nodes.forEach(n => nodeMap.set(n.id, n))

    const layoutNodesResult: LayoutNode[] = []

    layerGroups.forEach((nodeIds, layer) => {
      const count = nodeIds.length
      nodeIds.forEach((nodeId, index) => {
        const node = nodeMap.get(nodeId)
        if (!node) return

        // Center nodes vertically within their layer
        const yOffset = (maxNodesInLayer - count) / 2
        const x = padding + layer * (nodeWidth + horizontalSpacing) + nodeWidth / 2
        const y = padding + (yOffset + index) * (nodeHeight + verticalSpacing) + nodeHeight / 2

        layoutNodesResult.push({
          ...node,
          layer,
          column: index,
          x,
          y,
          incomingCount: incoming.get(nodeId)?.length || 0,
          outgoingCount: outgoing.get(nodeId)?.length || 0,
          isLoopTarget: loopTargets.has(nodeId)
        })
      })
    })

    // Create layout edges with back-edge detection
    const layoutNodeMap = new Map<string, LayoutNode>()
    layoutNodesResult.forEach(n => layoutNodeMap.set(n.id, n))

    const layoutEdgesResult: LayoutEdge[] = connections.map(conn => {
      const sourceNode = layoutNodeMap.get(conn.from)!
      const targetNode = layoutNodeMap.get(conn.to)!
      const isBackEdge = targetNode && sourceNode && targetNode.layer <= sourceNode.layer

      return {
        ...conn,
        isBackEdge,
        sourceNode,
        targetNode
      }
    }).filter(e => e.sourceNode && e.targetNode)

    return {
      layoutNodes: layoutNodesResult,
      layoutEdges: layoutEdgesResult,
      dimensions: { width: totalWidth, height: totalHeight }
    }
  }, [nodes, connections, compact])

  // Generate SVG path for an edge
  const getEdgePath = (edge: LayoutEdge): string => {
    const { sourceNode, targetNode, isBackEdge } = edge
    const nodeWidth = compact ? 120 : 160
    const _nodeHeight = compact ? 50 : 70

    const startX = sourceNode.x + nodeWidth / 2 - 10
    const startY = sourceNode.y
    const endX = targetNode.x - nodeWidth / 2 + 10
    const endY = targetNode.y
    void _nodeHeight // Reserved for future vertical layout adjustments

    if (isBackEdge) {
      // Loop back - draw curved path going up/around
      const loopHeight = Math.max(Math.abs(startY - endY) + 60, 80)
      const midY = Math.min(startY, endY) - loopHeight

      return `M ${startX} ${startY}
              Q ${startX + 40} ${startY}, ${startX + 40} ${midY}
              L ${endX - 40} ${midY}
              Q ${endX - 40} ${endY}, ${endX} ${endY}`
    }

    // Forward edge - smooth bezier curve
    const controlOffset = (endX - startX) / 3

    return `M ${startX} ${startY}
            C ${startX + controlOffset} ${startY},
              ${endX - controlOffset} ${endY},
              ${endX} ${endY}`
  }

  // Render node - with hover tooltip + click expand for mobile
  const renderNode = (node: LayoutNode) => {
    const colors = NODE_COLORS[node.type] || NODE_COLORS.default
    const nodeWidth = compact ? 120 : 160
    const nodeHeight = compact ? 50 : 70
    const isHovered = hoveredNode === node.id
    const isSelected = selectedNode === node.id

    return (
      <g
        key={node.id}
        transform={`translate(${node.x - nodeWidth / 2}, ${node.y - nodeHeight / 2})`}
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => setHoveredNode(node.id)}
        onMouseLeave={() => setHoveredNode(null)}
        onClick={() => handleNodeClick(node.id)}
        // Touch support for mobile
        onTouchEnd={(e) => {
          e.preventDefault()
          handleNodeClick(node.id)
        }}
      >
        {/* Node background - highlight on hover OR selected */}
        <rect
          width={nodeWidth}
          height={nodeHeight}
          rx={compact ? 8 : 12}
          className={`
            ${colors.bg} stroke-2 transition-all duration-200
            ${isSelected ? 'stroke-cyan-400' : isHovered ? 'stroke-white/50' : colors.border.replace('border-', 'stroke-')}
          `}
          style={{
            filter: isSelected ? 'drop-shadow(0 0 16px rgba(34,211,238,0.4))' : isHovered ? 'drop-shadow(0 0 12px rgba(255,255,255,0.2))' : 'none'
          }}
        />

        {/* Loop indicator ring */}
        {node.isLoopTarget && (
          <rect
            x={-4}
            y={-4}
            width={nodeWidth + 8}
            height={nodeHeight + 8}
            rx={compact ? 12 : 16}
            fill="none"
            className="stroke-amber-500/50 stroke-2 animate-pulse"
            strokeDasharray="6 4"
          />
        )}

        {/* Icon */}
        <text
          x={compact ? 12 : 16}
          y={nodeHeight / 2 + 5}
          className="text-base"
        >
          {node.toolIcon || colors.icon}
        </text>

        {/* Node name */}
        <text
          x={compact ? 32 : 40}
          y={compact ? nodeHeight / 2 - 2 : nodeHeight / 2 - 6}
          className="fill-white text-xs font-medium"
          style={{ fontSize: compact ? '10px' : '12px' }}
        >
          {node.name.length > (compact ? 12 : 16)
            ? node.name.substring(0, compact ? 12 : 16) + '...'
            : node.name}
        </text>

        {/* Node type label (non-compact only) */}
        {!compact && (
          <text
            x={40}
            y={nodeHeight / 2 + 12}
            className="fill-slate-400 text-xs"
            style={{ fontSize: '10px' }}
          >
            {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
          </text>
        )}

        {/* Connection indicators */}
        {node.incomingCount > 1 && (
          <circle
            cx={0}
            cy={nodeHeight / 2}
            r={8}
            className="fill-cyan-500/80"
          />
        )}
        {node.outgoingCount > 1 && (
          <circle
            cx={nodeWidth}
            cy={nodeHeight / 2}
            r={8}
            className="fill-purple-500/80"
          />
        )}
      </g>
    )
  }

  // Render edge
  const renderEdge = (edge: LayoutEdge, index: number) => {
    const path = getEdgePath(edge)
    const isHovered = hoveredNode === edge.from || hoveredNode === edge.to

    return (
      <g key={`edge-${index}`}>
        {/* Edge path */}
        <path
          d={path}
          fill="none"
          className={`
            ${edge.isBackEdge
              ? 'stroke-amber-500/60'
              : isHovered
                ? 'stroke-cyan-400'
                : 'stroke-slate-500/60'
            }
            transition-all duration-200
          `}
          strokeWidth={edge.isBackEdge ? 2.5 : 2}
          strokeDasharray={edge.isBackEdge ? '8 4' : 'none'}
          markerEnd={`url(#arrow${edge.isBackEdge ? '-loop' : ''})`}
        />

        {/* Animated flow indicator */}
        {!edge.isBackEdge && (
          <circle r={3} className="fill-cyan-400">
            <animateMotion
              dur={`${2 + index * 0.2}s`}
              repeatCount="indefinite"
              path={path}
            />
          </circle>
        )}

        {/* Loop label */}
        {edge.isBackEdge && (
          <text
            className="fill-amber-400 text-xs font-medium"
            style={{ fontSize: '10px' }}
          >
            <textPath href={`#edge-path-${index}`} startOffset="50%" textAnchor="middle">
              ↻ loop
            </textPath>
          </text>
        )}
      </g>
    )
  }

  // Compact inline preview
  if (compact) {
    return (
      <>
        <div className="relative">
          <div
            className="bg-slate-900/50 rounded-xl border border-slate-700 p-3 cursor-pointer hover:border-slate-600 transition-colors"
            onClick={() => setExpandedView(true)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔄</span>
              <span className="text-sm font-medium text-white">{workflowName}</span>
              <span className="text-xs text-slate-500 ml-auto">{nodes.length} steps</span>
            </div>

            {/* Mini flow preview */}
            <svg
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              className="w-full h-24 rounded-lg bg-slate-800/30"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <marker id="arrow-mini" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" className="fill-slate-500/60" />
                </marker>
              </defs>

              {layoutEdges.map((edge, i) => (
                <path
                  key={i}
                  d={getEdgePath(edge)}
                  fill="none"
                  className={edge.isBackEdge ? 'stroke-amber-500/40' : 'stroke-slate-500/40'}
                  strokeWidth={1.5}
                  strokeDasharray={edge.isBackEdge ? '4 2' : 'none'}
                  markerEnd="url(#arrow-mini)"
                />
              ))}

              {/* @NEXUS-FIX-077: Mini nodes with hover title + click to expand */}
              {layoutNodes.map(node => (
                <g
                  key={node.id}
                  transform={`translate(${node.x - 30}, ${node.y - 15})`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={(e) => {
                    e.stopPropagation() // Don't trigger expand view
                    handleNodeClick(node.id)
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    handleNodeClick(node.id)
                  }}
                >
                  {/* Hover title tooltip via SVG title element */}
                  <title>{node.name}{node.description ? `: ${node.description}` : ''}</title>
                  <rect
                    width={60}
                    height={30}
                    rx={6}
                    className={`
                      ${selectedNode === node.id ? 'fill-cyan-500/30 stroke-cyan-400' : 'fill-slate-700/50'}
                      ${hoveredNode === node.id ? 'stroke-white/60' : node.isLoopTarget ? 'stroke-amber-500/50' : 'stroke-slate-600/50'}
                      transition-all duration-150
                    `}
                    strokeWidth={selectedNode === node.id ? 2 : 1}
                  />
                  <text x={10} y={20} className="fill-white text-xs pointer-events-none" style={{ fontSize: '10px' }}>
                    {node.toolIcon}
                  </text>
                </g>
              ))}
            </svg>

            {/* @NEXUS-FIX-077: Node detail panel - shows on click/tap (mobile-friendly) */}
            {selectedNodeData && (
              <div
                className="mt-2 p-3 bg-slate-800 rounded-lg border border-cyan-500/30 animate-in fade-in slide-in-from-top-1 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedNodeData.toolIcon}</span>
                    <div>
                      <div className="font-medium text-white text-sm">{selectedNodeData.name}</div>
                      <div className="text-xs text-slate-400 capitalize">{selectedNodeData.type} • {selectedNodeData.tool}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {selectedNodeData.description && (
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    {selectedNodeData.description}
                  </p>
                )}
                {(selectedNodeData as LayoutNode).isLoopTarget && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                    <span>↻</span>
                    <span>This step may be revisited during workflow execution</span>
                  </div>
                )}
              </div>
            )}

            {!selectedNodeData && (
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-slate-400">
                <span>Tap a node for details • Click to expand full view</span>
              </div>
            )}
          </div>
        </div>

        {/* Expanded modal - using portal to escape container constraints */}
        {expandedView && createPortal(
          <div
            className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
            onClick={() => setExpandedView(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div
              className="bg-slate-900 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[80vh] overflow-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{workflowName}</h3>
                  <p className="text-sm text-slate-400">{nodes.length} steps • Click nodes for details</p>
                </div>
                <button
                  onClick={() => setExpandedView(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4">
                <WorkflowFlowChart
                  nodes={nodes}
                  connections={connections}
                  workflowName={workflowName}
                  compact={false}
                  onNodeClick={onNodeClick}
                />
              </div>

              {/* Legend */}
              <div className="border-t border-slate-700 p-4 flex flex-wrap gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-slate-500"></div>
                  <span>Normal flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-amber-500 border-dashed border-t-2 border-amber-500"></div>
                  <span>Loop / Revisit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-dashed border-amber-500/50"></div>
                  <span>Loop target</span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  // Full visualization
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="w-full rounded-xl bg-slate-800/30 border border-slate-700/50"
        style={{ minHeight: compact ? 100 : 200, maxHeight: 400 }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Arrow markers */}
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" className="fill-cyan-500/80" />
          </marker>
          <marker id="arrow-loop" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" className="fill-amber-500" />
          </marker>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges (rendered first, behind nodes) */}
        <g className="edges">
          {layoutEdges.map((edge, i) => renderEdge(edge, i))}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {layoutNodes.map(node => renderNode(node))}
        </g>
      </svg>

      {/* Hovered node tooltip */}
      {hoveredNode && (
        <div className="absolute top-2 left-2 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs shadow-xl z-10 max-w-xs">
          {(() => {
            const node = layoutNodes.find(n => n.id === hoveredNode)
            if (!node) return null
            return (
              <>
                <div className="font-medium text-white flex items-center gap-2">
                  <span>{node.toolIcon}</span>
                  <span>{node.name}</span>
                </div>
                <div className="text-slate-400 mt-1">{node.description}</div>
                {node.isLoopTarget && (
                  <div className="text-amber-400 mt-1 flex items-center gap-1">
                    <span>↻</span>
                    <span>This step may be revisited</span>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}

export default WorkflowFlowChart

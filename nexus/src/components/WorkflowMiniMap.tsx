/**
 * WorkflowMiniMap - Small visual preview of workflow structure
 *
 * Features:
 * - Compact SVG-based visualization
 * - Node status indicators
 * - Connection lines with flow direction
 * - Click to expand/navigate
 * - Real-time status updates
 */

import { useMemo, useState } from 'react'

export interface MiniMapNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'output' | 'agent' | 'transform'
  label: string
  status?: 'idle' | 'pending' | 'running' | 'completed' | 'failed'
}

export interface MiniMapConnection {
  from: string
  to: string
}

interface WorkflowMiniMapProps {
  nodes: MiniMapNode[]
  connections: MiniMapConnection[]
  width?: number
  height?: number
  showLabels?: boolean
  interactive?: boolean
  onNodeClick?: (nodeId: string) => void
  onClick?: () => void
  className?: string
}

// Node type colors
const NODE_COLORS: Record<string, string> = {
  trigger: '#8b5cf6',  // violet
  action: '#3b82f6',   // blue
  condition: '#f59e0b', // amber
  output: '#10b981',   // emerald
  agent: '#06b6d4',    // cyan
  transform: '#ec4899', // pink
}

// Status colors
const STATUS_COLORS: Record<string, string> = {
  idle: '#64748b',
  pending: '#94a3b8',
  running: '#f59e0b',
  completed: '#10b981',
  failed: '#ef4444',
}

export function WorkflowMiniMap({
  nodes,
  connections,
  width = 200,
  height = 80,
  showLabels = false,
  interactive = true,
  onNodeClick,
  onClick,
  className = '',
}: WorkflowMiniMapProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Calculate layout positions
  const layout = useMemo(() => {
    if (nodes.length === 0) return { nodePositions: new Map(), svgWidth: width, svgHeight: height }

    // Build adjacency for topological sort
    const outgoing = new Map<string, string[]>()
    const incoming = new Map<string, number>()

    nodes.forEach(n => {
      outgoing.set(n.id, [])
      incoming.set(n.id, 0)
    })

    connections.forEach(c => {
      outgoing.get(c.from)?.push(c.to)
      incoming.set(c.to, (incoming.get(c.to) || 0) + 1)
    })

    // Assign layers using BFS
    const layers = new Map<string, number>()
    const queue: string[] = []

    // Start with nodes that have no incoming edges
    nodes.forEach(n => {
      if ((incoming.get(n.id) || 0) === 0) {
        queue.push(n.id)
        layers.set(n.id, 0)
      }
    })

    // Handle disconnected nodes
    if (queue.length === 0 && nodes.length > 0) {
      queue.push(nodes[0].id)
      layers.set(nodes[0].id, 0)
    }

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      const currentLayer = layers.get(nodeId) || 0

      outgoing.get(nodeId)?.forEach(targetId => {
        const existingLayer = layers.get(targetId)
        if (existingLayer === undefined || existingLayer < currentLayer + 1) {
          layers.set(targetId, currentLayer + 1)
          if (!queue.includes(targetId)) {
            queue.push(targetId)
          }
        }
      })
    }

    // Handle unvisited nodes
    nodes.forEach(n => {
      if (!layers.has(n.id)) {
        layers.set(n.id, 0)
      }
    })

    // Group by layer
    const layerGroups = new Map<number, string[]>()
    layers.forEach((layer, nodeId) => {
      if (!layerGroups.has(layer)) layerGroups.set(layer, [])
      layerGroups.get(layer)!.push(nodeId)
    })

    const maxLayer = Math.max(...Array.from(layers.values()), 0)
    const maxInLayer = Math.max(...Array.from(layerGroups.values()).map(g => g.length), 1)

    // Calculate node positions
    const nodeRadius = 8
    const padding = 16
    const horizontalSpacing = (width - padding * 2) / Math.max(maxLayer, 1)
    const verticalSpacing = (height - padding * 2) / Math.max(maxInLayer - 1, 1)

    const nodePositions = new Map<string, { x: number; y: number }>()

    layerGroups.forEach((nodeIds, layer) => {
      const count = nodeIds.length
      nodeIds.forEach((nodeId, index) => {
        const x = padding + layer * horizontalSpacing
        const yOffset = (maxInLayer - count) / 2
        const y = padding + (yOffset + index) * (count > 1 ? verticalSpacing : (height - padding * 2) / 2)
        nodePositions.set(nodeId, { x, y })
      })
    })

    return {
      nodePositions,
      svgWidth: width,
      svgHeight: height,
      nodeRadius,
    }
  }, [nodes, connections, width, height])

  // Get edge path between two nodes
  const getEdgePath = (from: string, to: string): string => {
    const fromPos = layout.nodePositions.get(from)
    const toPos = layout.nodePositions.get(to)
    if (!fromPos || !toPos) return ''

    const dx = toPos.x - fromPos.x
    const cpOffset = Math.abs(dx) / 3

    return `M ${fromPos.x} ${fromPos.y} C ${fromPos.x + cpOffset} ${fromPos.y}, ${toPos.x - cpOffset} ${toPos.y}, ${toPos.x} ${toPos.y}`
  }

  if (nodes.length === 0) {
    return (
      <div
        className={`bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 text-xs ${className}`}
        style={{ width, height }}
      >
        No nodes
      </div>
    )
  }

  return (
    <div
      className={`relative group ${interactive ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${layout.svgWidth} ${layout.svgHeight}`}
        className="rounded-lg bg-slate-900/50 border border-slate-700/50 transition-all duration-200 group-hover:border-slate-600"
      >
        {/* Definitions */}
        <defs>
          {/* Arrow marker */}
          <marker
            id="minimap-arrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
          </marker>

          {/* Glow filter */}
          <filter id="minimap-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connections */}
        <g className="connections">
          {connections.map((conn, idx) => {
            const fromNode = nodes.find(n => n.id === conn.from)
            const isActive = fromNode?.status === 'running' || fromNode?.status === 'completed'
            const path = getEdgePath(conn.from, conn.to)

            return (
              <g key={`conn-${idx}`}>
                {/* Background glow for active connections */}
                {isActive && (
                  <path
                    d={path}
                    fill="none"
                    stroke={fromNode?.status === 'completed' ? '#10b981' : '#f59e0b'}
                    strokeWidth={3}
                    opacity={0.3}
                    className={fromNode?.status === 'running' ? 'animate-pulse' : ''}
                  />
                )}
                {/* Main connection line */}
                <path
                  d={path}
                  fill="none"
                  stroke={isActive ? (fromNode?.status === 'completed' ? '#10b981' : '#f59e0b') : '#475569'}
                  strokeWidth={1.5}
                  markerEnd="url(#minimap-arrow)"
                />
                {/* Animated flow particle for running connections */}
                {fromNode?.status === 'running' && (
                  <circle r={2} fill="#f59e0b">
                    <animateMotion dur="1.5s" repeatCount="indefinite" path={path} />
                  </circle>
                )}
              </g>
            )
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {nodes.map(node => {
            const pos = layout.nodePositions.get(node.id)
            if (!pos) return null

            const color = NODE_COLORS[node.type] || '#64748b'
            const statusColor = node.status ? STATUS_COLORS[node.status] : color
            const isHovered = hoveredNode === node.id
            const isRunning = node.status === 'running'

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className={interactive ? 'cursor-pointer' : ''}
                onMouseEnter={() => interactive && setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  if (interactive && onNodeClick) {
                    e.stopPropagation()
                    onNodeClick(node.id)
                  }
                }}
              >
                {/* Node glow for running status */}
                {isRunning && (
                  <circle
                    r={(layout.nodeRadius ?? 8) + 4}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    opacity={0.5}
                    className="animate-ping"
                  />
                )}

                {/* Node circle */}
                <circle
                  r={isHovered ? (layout.nodeRadius ?? 8) + 2 : (layout.nodeRadius ?? 8)}
                  fill={statusColor}
                  stroke={isHovered ? '#fff' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all duration-150"
                  filter={isRunning ? 'url(#minimap-glow)' : undefined}
                />

                {/* Status ring for completed/failed */}
                {(node.status === 'completed' || node.status === 'failed') && (
                  <circle
                    r={(layout.nodeRadius ?? 8) + 3}
                    fill="none"
                    stroke={statusColor}
                    strokeWidth={1.5}
                    opacity={0.5}
                  />
                )}

                {/* Type indicator */}
                <text
                  y={1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize={8}
                  fontWeight="bold"
                >
                  {node.type === 'trigger' ? '!' :
                   node.type === 'condition' ? '?' :
                   node.type === 'output' ? 'O' :
                   node.type === 'agent' ? 'A' :
                   node.type === 'transform' ? 'T' :
                   ''}
                </text>
              </g>
            )
          })}
        </g>

        {/* Labels (if enabled) */}
        {showLabels && (
          <g className="labels">
            {nodes.map(node => {
              const pos = layout.nodePositions.get(node.id)
              if (!pos) return null

              return (
                <text
                  key={`label-${node.id}`}
                  x={pos.x}
                  y={pos.y + 16}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={8}
                  className="pointer-events-none"
                >
                  {node.label.length > 8 ? node.label.slice(0, 8) + '..' : node.label}
                </text>
              )
            })}
          </g>
        )}
      </svg>

      {/* Hover tooltip */}
      {hoveredNode && interactive && (
        <div className="absolute z-10 -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
          {nodes.find(n => n.id === hoveredNode)?.label}
        </div>
      )}

      {/* Stats overlay */}
      <div className="absolute bottom-1 right-1 text-[10px] text-slate-500 bg-slate-900/80 px-1 rounded">
        {nodes.length} nodes
      </div>
    </div>
  )
}

export default WorkflowMiniMap

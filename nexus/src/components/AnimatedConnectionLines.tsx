/**
 * AnimatedConnectionLines - Improved workflow connection lines
 *
 * Features:
 * - Smooth bezier curves between nodes
 * - Animated flow particles during execution
 * - Data flow direction indicators (arrows)
 * - Status-based coloring
 * - Glow effects for active connections
 */

import { useMemo } from 'react'

export interface ConnectionNode {
  id: string
  x: number
  y: number
  status?: 'idle' | 'pending' | 'running' | 'completed' | 'failed'
  width?: number
  height?: number
}

export interface ConnectionLine {
  from: string
  to: string
  status?: 'idle' | 'active' | 'success' | 'error'
  label?: string
  isConditional?: boolean
}

interface AnimatedConnectionLinesProps {
  nodes: ConnectionNode[]
  connections: ConnectionLine[]
  nodeWidth?: number
  nodeHeight?: number
  animated?: boolean
  showArrows?: boolean
  showLabels?: boolean
  className?: string
}

// Status colors
const CONNECTION_COLORS = {
  idle: { stroke: '#475569', particle: '#64748b' },
  active: { stroke: '#06b6d4', particle: '#22d3ee' },
  success: { stroke: '#10b981', particle: '#34d399' },
  error: { stroke: '#ef4444', particle: '#f87171' },
}

export function AnimatedConnectionLines({
  nodes,
  connections,
  nodeWidth = 160,
  nodeHeight: _nodeHeight = 80,
  animated = true,
  showArrows = true,
  showLabels = false,
  className = '',
}: AnimatedConnectionLinesProps) {
  // Build node position map
  const nodeMap = useMemo(() => {
    const map = new Map<string, ConnectionNode>()
    nodes.forEach(n => map.set(n.id, n))
    return map
  }, [nodes])

  // Calculate bezier curve path between two nodes
  const getConnectionPath = (fromId: string, toId: string): { path: string; midpoint: { x: number; y: number } } | null => {
    const fromNode = nodeMap.get(fromId)
    const toNode = nodeMap.get(toId)
    if (!fromNode || !toNode) return null

    const fromWidth = fromNode.width || nodeWidth
    const toWidth = toNode.width || nodeWidth
    // Heights available if needed: fromNode.height || nodeHeight, toNode.height || nodeHeight

    // Calculate connection points (right side of source, left side of target)
    const startX = fromNode.x + fromWidth / 2
    const startY = fromNode.y
    const endX = toNode.x - toWidth / 2
    const endY = toNode.y

    // Calculate control points for smooth curve
    const dx = endX - startX
    const controlOffset = Math.min(Math.abs(dx) / 2, 100)

    // Handle different relative positions
    let path: string
    let midpoint: { x: number; y: number }

    if (dx > 0) {
      // Normal left-to-right flow
      path = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`
      midpoint = {
        x: (startX + endX) / 2,
        y: (startY + endY) / 2 + (endY - startY) / 4
      }
    } else {
      // Backward connection (loop back)
      const loopHeight = Math.max(Math.abs(endY - startY) + 60, 80)
      const midY = Math.min(startY, endY) - loopHeight

      path = `M ${startX} ${startY}
              C ${startX + 50} ${startY}, ${startX + 50} ${midY}, ${(startX + endX) / 2} ${midY}
              C ${endX - 50} ${midY}, ${endX - 50} ${endY}, ${endX} ${endY}`
      midpoint = {
        x: (startX + endX) / 2,
        y: midY
      }
    }

    return { path, midpoint }
  }

  // Determine connection status based on source node status
  const getConnectionStatus = (conn: ConnectionLine): 'idle' | 'active' | 'success' | 'error' => {
    if (conn.status) return conn.status

    const fromNode = nodeMap.get(conn.from)
    if (!fromNode) return 'idle'

    switch (fromNode.status) {
      case 'running': return 'active'
      case 'completed': return 'success'
      case 'failed': return 'error'
      default: return 'idle'
    }
  }

  return (
    <svg
      className={`absolute inset-0 pointer-events-none overflow-visible ${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        {/* Arrow markers for each status */}
        {Object.entries(CONNECTION_COLORS).map(([status, colors]) => (
          <marker
            key={`arrow-${status}`}
            id={`arrow-${status}`}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path
              d="M2,2 L10,6 L2,10 L4,6 Z"
              fill={colors.stroke}
            />
          </marker>
        ))}

        {/* Glow filters for active/success states */}
        <filter id="glow-active" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor="#06b6d4" floodOpacity="0.5" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="glow-success" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor="#10b981" floodOpacity="0.4" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradient for flow animation */}
        <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
          <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Render connections */}
      {connections.map((conn, index) => {
        const pathData = getConnectionPath(conn.from, conn.to)
        if (!pathData) return null

        const { path, midpoint } = pathData
        const status = getConnectionStatus(conn)
        const colors = CONNECTION_COLORS[status]
        const isActive = status === 'active'
        const isSuccess = status === 'success'

        return (
          <g key={`connection-${index}`}>
            {/* Glow background for active/success */}
            {(isActive || isSuccess) && (
              <path
                d={path}
                fill="none"
                stroke={colors.stroke}
                strokeWidth={6}
                opacity={0.2}
                filter={isActive ? 'url(#glow-active)' : 'url(#glow-success)'}
                className={isActive ? 'animate-pulse' : ''}
              />
            )}

            {/* Main connection line */}
            <path
              d={path}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={2}
              strokeDasharray={conn.isConditional ? '8,4' : undefined}
              markerEnd={showArrows ? `url(#arrow-${status})` : undefined}
              className="transition-colors duration-300"
            />

            {/* Animated flow particles for active connections */}
            {animated && isActive && (
              <>
                {/* Primary particle */}
                <circle r={4} fill={colors.particle}>
                  <animateMotion dur="1.5s" repeatCount="indefinite" path={path} />
                </circle>

                {/* Secondary particle (offset) */}
                <circle r={3} fill={colors.particle} opacity={0.7}>
                  <animateMotion dur="1.5s" repeatCount="indefinite" path={path} begin="0.5s" />
                </circle>

                {/* Tertiary particle (offset) */}
                <circle r={2} fill={colors.particle} opacity={0.5}>
                  <animateMotion dur="1.5s" repeatCount="indefinite" path={path} begin="1s" />
                </circle>
              </>
            )}

            {/* Success pulse animation */}
            {isSuccess && animated && (
              <circle r={5} fill={colors.particle} opacity={0}>
                <animateMotion dur="2s" repeatCount="indefinite" path={path} />
                <animate
                  attributeName="opacity"
                  values="0.8;0;0.8"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Connection label */}
            {showLabels && conn.label && (
              <g transform={`translate(${midpoint.x}, ${midpoint.y})`}>
                <rect
                  x={-30}
                  y={-10}
                  width={60}
                  height={20}
                  rx={4}
                  fill="rgba(15, 23, 42, 0.9)"
                  stroke={colors.stroke}
                  strokeWidth={1}
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  fill={colors.stroke}
                  fontSize={10}
                  fontWeight="medium"
                >
                  {conn.label}
                </text>
              </g>
            )}

            {/* Data flow direction indicator */}
            {isActive && (
              <g transform={`translate(${midpoint.x}, ${midpoint.y})`}>
                <circle r={8} fill="rgba(6, 182, 212, 0.2)" className="animate-ping" />
                <circle r={4} fill="#06b6d4" />
              </g>
            )}
          </g>
        )
      })}

      {/* CSS for animations */}
      <style>{`
        @keyframes flowPulse {
          0%, 100% { stroke-dashoffset: 0; }
          50% { stroke-dashoffset: 20; }
        }
      `}</style>
    </svg>
  )
}

// Helper hook to manage connection states
export function useConnectionStates(
  connections: ConnectionLine[],
  nodeStatuses: Map<string, 'idle' | 'pending' | 'running' | 'completed' | 'failed'>
): ConnectionLine[] {
  return useMemo(() => {
    return connections.map(conn => {
      const fromStatus = nodeStatuses.get(conn.from)
      let status: 'idle' | 'active' | 'success' | 'error' = 'idle'

      if (fromStatus === 'running') {
        status = 'active'
      } else if (fromStatus === 'completed') {
        status = 'success'
      } else if (fromStatus === 'failed') {
        status = 'error'
      }

      return { ...conn, status }
    })
  }, [connections, nodeStatuses])
}

export default AnimatedConnectionLines

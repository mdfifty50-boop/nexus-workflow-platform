/**
 * Tool Chain Visualization Components
 *
 * Epic 16, Story 16.9: Tool Chain Visualization in Workflow Map
 *
 * Provides n8n-style React components for visualizing tool chains with:
 * - Multiple node types (Tool, Transform, MCP Connector)
 * - Real-time progress updates
 * - Self-healing status visualization
 * - Interactive node details panel
 */

import React, {
  useCallback,
  useMemo,
  useRef,
  useState
} from 'react'
import type {
  ToolChainNode,
  ToolChainEdge,
  ToolChainLayout,
  ToolChainNodeStatus,
  VisualizationConfig,
  NodeDetailsPanel as NodeDetailsPanelType
} from '../types/tools'
import { DEFAULT_VISUALIZATION_CONFIG } from '../types/tools'

// ============================================================================
// Types
// ============================================================================

interface ToolChainMapProps {
  layout: ToolChainLayout
  config?: Partial<VisualizationConfig>
  onNodeClick?: (nodeId: string) => void
  onNodeHover?: (nodeId: string | null) => void
  selectedNodeId?: string | null
  showDetails?: boolean
  className?: string
}

interface ToolNodeProps {
  node: ToolChainNode
  isSelected?: boolean
  isActive?: boolean
  onClick?: () => void
  onHover?: (hovering: boolean) => void
}

interface TransformNodeProps {
  node: ToolChainNode
  isSelected?: boolean
  isActive?: boolean
  onClick?: () => void
  onHover?: (hovering: boolean) => void
}

interface MCPConnectorBadgeProps {
  node: ToolChainNode
  isSelected?: boolean
  isActive?: boolean
  onClick?: () => void
  onHover?: (hovering: boolean) => void
}

interface ChainEdgeProps {
  edge: ToolChainEdge
  sourceNode: ToolChainNode
  targetNode: ToolChainNode
  config: VisualizationConfig
}

interface NodeStatusBadgeProps {
  status: ToolChainNodeStatus
  size?: 'sm' | 'md' | 'lg'
}

interface NodeProgressBarProps {
  progress: number
  status: ToolChainNodeStatus
  showPercentage?: boolean
}

interface NodeDetailsPanelProps {
  details: NodeDetailsPanelType
  onClose: () => void
}

// ============================================================================
// Status Colors
// ============================================================================

const STATUS_COLORS: Record<ToolChainNodeStatus, string> = {
  pending: '#9ca3af',    // Gray
  queued: '#9ca3af',     // Gray
  running: '#3b82f6',    // Blue
  self_healing: '#f59e0b', // Amber
  completed: '#10b981',  // Green
  failed: '#ef4444',     // Red
  skipped: '#6b7280',    // Dark gray
  cancelled: '#6b7280'   // Dark gray
}

const STATUS_BG_COLORS: Record<ToolChainNodeStatus, string> = {
  pending: '#f3f4f6',
  queued: '#f3f4f6',
  running: '#dbeafe',
  self_healing: '#fef3c7',
  completed: '#d1fae5',
  failed: '#fee2e2',
  skipped: '#e5e7eb',
  cancelled: '#e5e7eb'
}

const STATUS_LABELS: Record<ToolChainNodeStatus, string> = {
  pending: 'Pending',
  queued: 'Queued',
  running: 'Running',
  self_healing: 'Self-Healing',
  completed: 'Completed',
  failed: 'Failed',
  skipped: 'Skipped',
  cancelled: 'Cancelled'
}

// ============================================================================
// NodeStatusBadge Component
// ============================================================================

export const NodeStatusBadge: React.FC<NodeStatusBadgeProps> = ({
  status,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: STATUS_BG_COLORS[status],
        color: STATUS_COLORS[status]
      }}
    >
      {status === 'running' && (
        <span className="mr-1 h-2 w-2 rounded-full bg-current animate-pulse" />
      )}
      {status === 'self_healing' && (
        <svg
          className="mr-1 h-3 w-3 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {STATUS_LABELS[status]}
    </span>
  )
}

// ============================================================================
// NodeProgressBar Component
// ============================================================================

export const NodeProgressBar: React.FC<NodeProgressBarProps> = ({
  progress,
  status,
  showPercentage = true
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        {showPercentage && (
          <span className="text-xs font-medium" style={{ color: STATUS_COLORS[status] }}>
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: STATUS_COLORS[status]
          }}
        />
      </div>
    </div>
  )
}

// ============================================================================
// ToolNode Component (Rounded Rectangle)
// ============================================================================

export const ToolNode: React.FC<ToolNodeProps> = ({
  node,
  isSelected = false,
  isActive = false,
  onClick,
  onHover
}) => {
  const { style } = node

  return (
    <div
      className={`
        absolute cursor-pointer transition-all duration-200
        rounded-lg border-2 shadow-md hover:shadow-lg
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isActive ? 'animate-pulse' : ''}
      `}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.dimensions.width,
        height: node.dimensions.height,
        backgroundColor: style?.backgroundColor || STATUS_BG_COLORS[node.status],
        borderColor: style?.borderColor || STATUS_COLORS[node.status],
        borderRadius: style?.borderRadius || 8
      }}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-label={`${node.name} - ${STATUS_LABELS[node.status]}`}
    >
      <div className="p-3 h-full flex flex-col justify-between">
        {/* Header with icon and name */}
        <div className="flex items-center gap-2">
          {node.icon && (
            <span className="text-lg">{node.icon}</span>
          )}
          <span className="font-medium text-sm text-gray-800 truncate">
            {node.name}
          </span>
        </div>

        {/* Status and progress */}
        <div className="space-y-1">
          <NodeStatusBadge status={node.status} size="sm" />

          {(node.status === 'running' || node.status === 'self_healing') && (
            <NodeProgressBar
              progress={node.progress}
              status={node.status}
              showPercentage={true}
            />
          )}

          {/* Self-healing message */}
          {node.isHealing && node.healingMessage && (
            <p className="text-xs text-amber-700 truncate">
              {node.healingMessage}
            </p>
          )}

          {/* Status message */}
          {node.statusMessage && !node.isHealing && (
            <p className="text-xs text-gray-600 truncate">
              {node.statusMessage}
            </p>
          )}
        </div>

        {/* Cost indicator */}
        {node.estimatedCost !== undefined && node.estimatedCost > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            ${node.actualCost?.toFixed(4) || node.estimatedCost.toFixed(4)}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// TransformNode Component (Diamond)
// ============================================================================

export const TransformNode: React.FC<TransformNodeProps> = ({
  node,
  isSelected = false,
  isActive = false,
  onClick,
  onHover
}) => {
  const { style } = node
  const size = Math.min(node.dimensions.width, node.dimensions.height)

  return (
    <div
      className={`
        absolute cursor-pointer transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isActive ? 'animate-pulse' : ''}
      `}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: size,
        height: size,
        transform: 'rotate(45deg)',
        transformOrigin: 'center center'
      }}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-label={`Transform: ${node.name} - ${STATUS_LABELS[node.status]}`}
    >
      <div
        className="w-full h-full border-2 shadow-md hover:shadow-lg"
        style={{
          backgroundColor: style?.backgroundColor || STATUS_BG_COLORS[node.status],
          borderColor: style?.borderColor || STATUS_COLORS[node.status]
        }}
      >
        {/* Content rotated back */}
        <div
          className="w-full h-full flex flex-col items-center justify-center p-1"
          style={{ transform: 'rotate(-45deg)' }}
        >
          <span className="text-xs font-medium text-gray-800 text-center truncate max-w-full">
            {node.name}
          </span>
          <div className="mt-1">
            <NodeStatusBadge status={node.status} size="sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MCPConnectorBadge Component (Lightning Badge)
// ============================================================================

export const MCPConnectorBadge: React.FC<MCPConnectorBadgeProps> = ({
  node,
  isSelected = false,
  isActive = false,
  onClick,
  onHover
}) => {
  const { style } = node
  const provider = node.metadata?.provider as string | undefined

  return (
    <div
      className={`
        absolute cursor-pointer transition-all duration-200
        rounded-xl border-2 shadow-md hover:shadow-lg
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isActive ? 'animate-pulse' : ''}
      `}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.dimensions.width,
        height: node.dimensions.height,
        backgroundColor: style?.backgroundColor || STATUS_BG_COLORS[node.status],
        borderColor: style?.borderColor || STATUS_COLORS[node.status]
      }}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-label={`MCP Connector: ${node.name} - ${STATUS_LABELS[node.status]}`}
    >
      {/* Lightning badge */}
      <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1 shadow">
        <svg
          className="w-3 h-3 text-yellow-900"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <div className="p-3 h-full flex flex-col justify-between">
        {/* Provider indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {node.icon && <span className="text-lg">{node.icon}</span>}
            <span className="font-medium text-sm text-gray-800 truncate">
              {node.name}
            </span>
          </div>
          {provider && (
            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
              {provider}
            </span>
          )}
        </div>

        {/* Connection status */}
        <div className="space-y-1">
          <NodeStatusBadge status={node.status} size="sm" />

          {(node.status === 'running' || node.status === 'self_healing') && (
            <NodeProgressBar
              progress={node.progress}
              status={node.status}
            />
          )}

          {node.isHealing && (
            <p className="text-xs text-amber-700">
              Resolving connection issue... Attempt {node.healingAttempt}/{node.healingMaxAttempts}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ChainEdge Component
// ============================================================================

export const ChainEdge: React.FC<ChainEdgeProps> = ({
  edge,
  sourceNode,
  targetNode,
  config
}) => {
  const path = useMemo(() => {
    if (!edge.path || edge.path.points.length < 2) {
      // Calculate default path
      const sx = sourceNode.position.x + sourceNode.dimensions.width
      const sy = sourceNode.position.y + sourceNode.dimensions.height / 2
      const tx = targetNode.position.x
      const ty = targetNode.position.y + targetNode.dimensions.height / 2

      if (config.direction === 'horizontal') {
        const midX = (sx + tx) / 2
        return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`
      } else {
        const midY = (sy + ty) / 2
        return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`
      }
    }

    const [start, end] = edge.path.points
    const [cp1, cp2] = edge.path.controlPoints || []

    if (cp1 && cp2) {
      return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`
    }

    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  }, [edge.path, sourceNode, targetNode, config.direction])

  const inlineStyle = edge.style
  const configStyle = config.edgeStyles[edge.type]

  // Normalize style properties - inline style uses color/width/dashPattern, config uses strokeColor/strokeWidth/strokeDasharray
  const strokeColor = inlineStyle?.color ?? configStyle?.strokeColor ?? STATUS_COLORS[edge.status === 'active' ? 'running' : 'pending']
  const strokeWidthValue = inlineStyle?.width ?? configStyle?.strokeWidth ?? 2
  const strokeDasharrayValue = inlineStyle?.dashPattern ?? configStyle?.strokeDasharray

  return (
    <g>
      {/* Main path */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidthValue}
        strokeDasharray={strokeDasharrayValue}
        className={edge.animated ? 'animate-flow' : ''}
        markerEnd="url(#arrowhead)"
      />

      {/* Data flow animation */}
      {edge.dataFlowing && (
        <circle r="4" fill={STATUS_COLORS.running}>
          <animateMotion dur="1s" repeatCount="indefinite" path={path} />
        </circle>
      )}
    </g>
  )
}

// ============================================================================
// NodeDetailsPanel Component
// ============================================================================

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  details,
  onClose
}) => {
  const formatDuration = (ms: number | undefined): string => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTime = (timestamp: number | Date | undefined): string => {
    if (!timestamp) return '-'
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    return date.toLocaleTimeString()
  }

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-80 md:w-96 bg-white shadow-xl border-l border-gray-200 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {details.nodeName}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Close details panel"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-2">
          <NodeStatusBadge status={details.status} size="md" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Progress */}
        {details.status === 'running' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Progress</h4>
            <NodeProgressBar
              progress={details.progress}
              status={details.status}
            />
          </div>
        )}

        {/* Self-healing status */}
        {details.isHealing && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-amber-800 mb-1">
              Self-Healing in Progress
            </h4>
            <p className="text-sm text-amber-700">
              {String(details.healingMessage ?? '')}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Attempt {details.healingAttempt ?? 0} of {details.healingMaxAttempts ?? 0}
            </p>
          </div>
        )}

        {/* Timing */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Timing</h4>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Started</dt>
            <dd className="text-gray-900">{formatTime(details.startTime)}</dd>
            <dt className="text-gray-500">Ended</dt>
            <dd className="text-gray-900">{formatTime(details.endTime)}</dd>
            <dt className="text-gray-500">Duration</dt>
            <dd className="text-gray-900">{formatDuration(details.duration)}</dd>
            <dt className="text-gray-500">Estimated</dt>
            <dd className="text-gray-900">{formatDuration(details.estimatedDuration)}</dd>
          </dl>
        </div>

        {/* Metrics */}
        {details.metrics && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Metrics</h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {details.metrics.tokensUsed !== undefined && (
                <>
                  <dt className="text-gray-500">Tokens Used</dt>
                  <dd className="text-gray-900">{details.metrics.tokensUsed.toLocaleString()}</dd>
                </>
              )}
              {details.metrics.cost !== undefined && (
                <>
                  <dt className="text-gray-500">Cost</dt>
                  <dd className="text-gray-900">${details.metrics.cost.toFixed(4)}</dd>
                </>
              )}
              {details.metrics.retryCount !== undefined && details.metrics.retryCount > 0 && (
                <>
                  <dt className="text-gray-500">Retries</dt>
                  <dd className="text-gray-900">{details.metrics.retryCount}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        {/* Error */}
        {details.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-red-800 mb-1">Error</h4>
            <p className="text-sm text-red-700 font-mono">{details.error}</p>
          </div>
        )}

        {/* Input */}
        {details.input !== undefined && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Input</h4>
            <pre className="bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto">
              {JSON.stringify(details.input as Record<string, unknown>, null, 2)}
            </pre>
          </div>
        )}

        {/* Output */}
        {details.output !== undefined && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Output</h4>
            <pre className="bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto">
              {JSON.stringify(details.output as Record<string, unknown>, null, 2)}
            </pre>
          </div>
        )}

        {/* Execution Logs */}
        {details.logs && details.logs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Execution Log</h4>
            <div className="bg-gray-900 rounded-lg p-3 max-h-64 overflow-y-auto">
              {details.logs.map((log, index) => (
                <div key={index} className="text-xs font-mono">
                  <span className="text-gray-500">{formatTime(log.timestamp)}</span>
                  <span className={`ml-2 ${
                    log.level === 'error' ? 'text-red-400' :
                    log.level === 'warn' ? 'text-yellow-400' :
                    log.level === 'info' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>
                    [{log.level}]
                  </span>
                  <span className="text-gray-300 ml-2">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// ToolChainMap Component (Main Container)
// ============================================================================

export const ToolChainMap: React.FC<ToolChainMapProps> = ({
  layout,
  config: customConfig,
  onNodeClick,
  onNodeHover,
  selectedNodeId,
  showDetails = true,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [_hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  void _hoveredNodeId // Suppress unused variable warning - used for future hover state management
  const [selectedNode, setSelectedNode] = useState<NodeDetailsPanelType | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const config = useMemo(
    () => ({ ...DEFAULT_VISUALIZATION_CONFIG, ...customConfig }),
    [customConfig]
  )

  // Handle node click
  const handleNodeClick = useCallback((nodeId: string) => {
    onNodeClick?.(nodeId)

    if (showDetails) {
      const node = layout.nodes.find(n => n.id === nodeId)
      if (node) {
        setSelectedNode({
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
        })
      }
    }
  }, [layout.nodes, onNodeClick, showDetails])

  // Handle node hover
  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId)
    onNodeHover?.(nodeId)
  }, [onNodeHover])

  // Render node based on type
  const renderNode = (node: ToolChainNode) => {
    const isSelected = node.id === selectedNodeId || node.id === selectedNode?.nodeId
    const isActive = layout.activeNodeIds.includes(node.id)

    const commonProps = {
      node,
      isSelected,
      isActive,
      onClick: () => handleNodeClick(node.id),
      onHover: (hovering: boolean) => handleNodeHover(hovering ? node.id : null)
    }

    switch (node.type) {
      case 'transform':
        return <TransformNode key={node.id} {...commonProps} />
      case 'mcp_connector':
        return <MCPConnectorBadge key={node.id} {...commonProps} />
      case 'tool':
      case 'input':
      case 'output':
      case 'condition':
      case 'parallel':
      default:
        return <ToolNode key={node.id} {...commonProps} />
    }
  }

  // Zoom controls
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 3))
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.3))
  const handleZoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gray-50 ${className}`}>
      {/* SVG Definitions */}
      <svg className="absolute w-0 h-0">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
          </marker>
        </defs>
      </svg>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 bg-white rounded-lg shadow border border-gray-200">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded-t-lg"
          aria-label="Zoom in"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          onClick={handleZoomReset}
          className="p-2 hover:bg-gray-100 border-y border-gray-200"
          aria-label="Reset zoom"
        >
          <span className="text-xs font-medium">{Math.round(zoom * 100)}%</span>
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded-b-lg"
          aria-label="Zoom out"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
      </div>

      {/* Overall Progress */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow border border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <NodeStatusBadge status={layout.overallStatus} size="md" />
          <span className="text-sm font-medium text-gray-700">
            {layout.overallProgress}% Complete
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {layout.statistics.completedNodes} / {layout.statistics.totalNodes} nodes
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center center'
        }}
      >
        {/* Edges Layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{
            width: layout.bounds.width + 200,
            height: layout.bounds.height + 200
          }}
        >
          <g transform={`translate(${-layout.bounds.minX + 100}, ${-layout.bounds.minY + 100})`}>
            {layout.edges.map(edge => {
              const sourceNode = layout.nodes.find(n => n.id === edge.sourceNodeId)
              const targetNode = layout.nodes.find(n => n.id === edge.targetNodeId)
              if (!sourceNode || !targetNode) return null

              return (
                <ChainEdge
                  key={edge.id}
                  edge={edge}
                  sourceNode={sourceNode}
                  targetNode={targetNode}
                  config={config}
                />
              )
            })}
          </g>
        </svg>

        {/* Nodes Layer */}
        <div
          className="absolute"
          style={{
            left: -layout.bounds.minX + 100,
            top: -layout.bounds.minY + 100,
            width: layout.bounds.width,
            height: layout.bounds.height
          }}
        >
          {layout.nodes.map(renderNode)}
        </div>
      </div>

      {/* Details Panel */}
      {showDetails && selectedNode && (
        <NodeDetailsPanel
          details={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Flow animation styles */}
      <style>{`
        @keyframes flow {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        .animate-flow {
          stroke-dasharray: 8 8;
          animation: flow 1s linear infinite;
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// Exports
// ============================================================================

export type {
  ToolChainMapProps,
  ToolNodeProps,
  TransformNodeProps,
  MCPConnectorBadgeProps,
  ChainEdgeProps,
  NodeStatusBadgeProps,
  NodeProgressBarProps,
  NodeDetailsPanelProps
}

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useToast } from '@/contexts/ToastContext'

// Node status types
type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

// Workflow node interface
interface WorkflowNode {
  id: string
  node_id: string
  workflow_id: string
  node_type: 'agent' | 'integration' | 'condition' | 'transform' | 'trigger'
  label: string
  status: NodeStatus
  position_x: number
  position_y: number
  config: Record<string, unknown>
  output: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
  tokens_used: number
  cost_usd: number
}

// Props interface
interface WorkflowMapProps {
  workflowId: string
  nodes?: WorkflowNode[]
  onNodeClick?: (node: WorkflowNode) => void
  showControls?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

// Status color mapping (Story 5.3)
const STATUS_COLORS: Record<NodeStatus, { bg: string; border: string; text: string; glow: string }> = {
  pending: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-300 dark:border-slate-600',
    text: 'text-slate-600 dark:text-slate-400',
    glow: '',
  },
  running: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-500',
    text: 'text-blue-700 dark:text-blue-400',
    glow: 'shadow-lg shadow-blue-500/30 animate-pulse',
  },
  completed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-500',
    text: 'text-green-700 dark:text-green-400',
    glow: '',
  },
  failed: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-500',
    text: 'text-red-700 dark:text-red-400',
    glow: 'shadow-lg shadow-red-500/30',
  },
  skipped: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    glow: '',
  },
}

// Node type icons
const NODE_ICONS: Record<string, string> = {
  agent: '🤖',
  integration: '🔌',
  condition: '🔀',
  transform: '🔄',
  trigger: '⚡',
}

// Plain English status messages (Story 5.5)
const STATUS_MESSAGES: Record<NodeStatus, string> = {
  pending: 'Waiting to start',
  running: 'Processing...',
  completed: 'Done',
  failed: 'Error occurred',
  skipped: 'Skipped',
}

export function WorkflowMap({
  workflowId,
  nodes: initialNodes,
  onNodeClick,
  showControls = true,
  autoRefresh = true,
  refreshInterval = 2000,
}: WorkflowMapProps) {
  const { userId } = useAuth()
  const toast = useToast()
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes || [])
  const [loading, setLoading] = useState(!initialNodes)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Fetch nodes from API
  const fetchNodes = useCallback(async () => {
    if (!userId || !workflowId) return

    try {
      const response = await fetch(`/api/workflows/${workflowId}/nodes`, {
        headers: {
          'X-Clerk-User-Id': userId,
        },
      })

      const result = await response.json()

      if (result.success) {
        setNodes(result.data || [])
        setError(null)
      } else {
        setError(result.error || 'Failed to load nodes')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, workflowId])

  // Initial fetch and SSE subscription for real-time updates (Story 5.2)
  useEffect(() => {
    if (!initialNodes) {
      fetchNodes()
    }

    // Set up SSE connection for real-time updates
    if (autoRefresh && userId && workflowId) {
      let eventSource: EventSource | null = null

      const connectSSE = () => {
        eventSource = new EventSource(`/api/sse/workflow/${workflowId}`)

        eventSource.onopen = () => {
          console.log('SSE: Connected to workflow updates')
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.type === 'node_update') {
              // Update specific node
              setNodes((prev) =>
                prev.map((n) =>
                  n.node_id === data.node.node_id
                    ? { ...n, ...data.node }
                    : n
                )
              )
            } else if (data.type === 'workflow_status') {
              // Could trigger a full refresh or update parent component
              console.log('Workflow status:', data.status)
            }
          } catch (e) {
            console.error('SSE parse error:', e)
          }
        }

        eventSource.onerror = () => {
          console.log('SSE: Connection error, falling back to polling')
          eventSource?.close()
          // Fall back to polling on SSE error
          const interval = setInterval(fetchNodes, refreshInterval)
          return () => clearInterval(interval)
        }
      }

      connectSSE()

      return () => {
        eventSource?.close()
      }
    } else if (autoRefresh) {
      // Fallback to polling if SSE not available
      const interval = setInterval(fetchNodes, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchNodes, initialNodes, autoRefresh, refreshInterval, userId, workflowId])

  // Calculate progress percentage (Story 5.4)
  const calculateProgress = (node: WorkflowNode): number => {
    switch (node.status) {
      case 'pending':
        return 0
      case 'running':
        return 50
      case 'completed':
        return 100
      case 'failed':
        return 100
      case 'skipped':
        return 100
      default:
        return 0
    }
  }

  // Calculate overall workflow progress
  const overallProgress = nodes.length > 0
    ? Math.round(nodes.reduce((sum, n) => sum + calculateProgress(n), 0) / nodes.length)
    : 0

  // Handle node click
  const handleNodeClick = (node: WorkflowNode) => {
    setSelectedNode(node)
    onNodeClick?.(node)
  }

  // Zoom controls (Story 5.8)
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const handleZoomReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Export to PNG (Story 5.11)
  const handleExportPNG = async () => {
    if (!mapRef.current) return

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(mapRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
      })

      // Create download link
      const link = document.createElement('a')
      link.download = `workflow-${workflowId}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed. Please try again.')
    }
  }

  // Pan handlers (Story 5.6)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch handlers (Story 5.7)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Render connection lines between nodes
  const renderConnections = () => {
    if (nodes.length < 2) return null

    const sortedNodes = [...nodes].sort((a, b) => a.position_x - b.position_x)
    const connections: React.ReactNode[] = []

    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const from = sortedNodes[i]
      const to = sortedNodes[i + 1]

      const x1 = from.position_x + 60 // Node width / 2
      const y1 = from.position_y + 40 // Node height / 2
      const x2 = to.position_x + 60
      const y2 = to.position_y + 40

      // Determine line color based on status
      let strokeColor = 'stroke-slate-300 dark:stroke-slate-600'
      if (from.status === 'completed') {
        strokeColor = 'stroke-green-500'
      } else if (from.status === 'failed') {
        strokeColor = 'stroke-red-500'
      } else if (from.status === 'running') {
        strokeColor = 'stroke-blue-500'
      }

      connections.push(
        <line
          key={`${from.node_id}-${to.node_id}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          className={`${strokeColor} stroke-2 transition-colors duration-300`}
          strokeDasharray={from.status === 'running' ? '5,5' : undefined}
        >
          {from.status === 'running' && (
            <animate
              attributeName="stroke-dashoffset"
              values="10;0"
              dur="0.5s"
              repeatCount="indefinite"
            />
          )}
        </line>
      )
    }

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      >
        {connections}
      </svg>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading workflow map...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchNodes}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg">
        <p className="text-muted-foreground">No workflow nodes to display</p>
      </div>
    )
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Header with progress and controls (Story 5.10 - Responsive) */}
      {showControls && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 p-3 bg-card rounded-lg border border-border">
          {/* Overall progress */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="text-sm font-medium whitespace-nowrap">Progress</div>
            <div className="flex-1 sm:w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">{overallProgress}%</span>
          </div>

          {/* Zoom controls (Story 5.8) - responsive sizing */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Zoom out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-sm font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Zoom in"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={handleZoomReset}
              className="p-2 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Reset view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            <button
              onClick={handleExportPNG}
              className="p-2 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Export as PNG"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Map container with horizontal scroll (Story 5.6, 5.10 - Responsive) */}
      <div
        ref={mapRef}
        className="relative overflow-auto bg-muted/20 rounded-lg border border-border h-[300px] sm:h-[400px] md:h-[500px]"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative transition-transform duration-100"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            minWidth: `${Math.max(...nodes.map(n => n.position_x)) + 200}px`,
            minHeight: `${Math.max(...nodes.map(n => n.position_y)) + 150}px`,
          }}
        >
          {/* Connection lines */}
          {renderConnections()}

          {/* Nodes */}
          {nodes.map((node) => {
            const colors = STATUS_COLORS[node.status]
            const progress = calculateProgress(node)

            return (
              <div
                key={node.node_id}
                className={`absolute cursor-pointer transition-all duration-300 ${colors.glow}`}
                style={{
                  left: node.position_x,
                  top: node.position_y,
                  minWidth: '120px',
                  minHeight: '80px',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleNodeClick(node)
                }}
              >
                {/* Node card (Story 5.7 - 44x44px minimum touch target) */}
                <div
                  className={`
                    ${colors.bg} ${colors.border} border-2 rounded-xl p-3
                    hover:scale-105 transition-transform
                    min-w-[120px] min-h-[80px]
                  `}
                >
                  {/* Node header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{NODE_ICONS[node.node_type] || '📦'}</span>
                    <span className={`text-xs font-medium ${colors.text}`}>
                      {node.node_type}
                    </span>
                  </div>

                  {/* Node label */}
                  <p className="text-sm font-medium truncate mb-2" title={node.label}>
                    {node.label}
                  </p>

                  {/* Progress bar (Story 5.4) */}
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full transition-all duration-500 ${
                        node.status === 'completed' ? 'bg-green-500' :
                        node.status === 'failed' ? 'bg-red-500' :
                        node.status === 'running' ? 'bg-blue-500 animate-pulse' :
                        'bg-slate-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Status message (Story 5.5) */}
                  <p className={`text-xs ${colors.text}`}>
                    {STATUS_MESSAGES[node.status]}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Node detail panel */}
      {selectedNode && (
        <div className="mt-4 p-4 bg-card rounded-lg border border-border">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-bold flex items-center gap-2">
                <span>{NODE_ICONS[selectedNode.node_type]}</span>
                {selectedNode.label}
              </h4>
              <p className="text-sm text-muted-foreground">
                {STATUS_MESSAGES[selectedNode.status]}
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 rounded hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className={`font-medium ${STATUS_COLORS[selectedNode.status].text}`}>
                {selectedNode.status}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium">{selectedNode.node_type}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tokens</p>
              <p className="font-medium">{selectedNode.tokens_used.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cost</p>
              <p className="font-medium">${selectedNode.cost_usd.toFixed(4)}</p>
            </div>
          </div>

          {selectedNode.started_at && (
            <div className="mt-3 text-xs text-muted-foreground">
              Started: {new Date(selectedNode.started_at).toLocaleString()}
              {selectedNode.completed_at && (
                <> | Completed: {new Date(selectedNode.completed_at).toLocaleString()}</>
              )}
            </div>
          )}

          {selectedNode.output && Object.keys(selectedNode.output).length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-1">Output</p>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                {JSON.stringify(selectedNode.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

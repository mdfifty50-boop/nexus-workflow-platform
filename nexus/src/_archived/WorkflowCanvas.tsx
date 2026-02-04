import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
  type Node,
  type Edge,
  type Connection,
  type EdgeProps,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ProfessionalAvatar } from './ProfessionalAvatar'

// Node status types
type NodeStatus = 'idle' | 'pending' | 'connecting' | 'success' | 'error' | 'retrying'

// Custom node data
interface WorkflowNodeData {
  label: string
  agentId: string
  agentName: string
  task: string
  status: NodeStatus
  apiEndpoint?: string
  retryCount?: number
  [key: string]: unknown
}

// Status colors and animations
const statusStyles: Record<NodeStatus, { bg: string; border: string; glow: string; animate: string }> = {
  idle: { bg: 'bg-slate-800', border: 'border-slate-600', glow: '', animate: '' },
  pending: { bg: 'bg-slate-700', border: 'border-slate-500', glow: '', animate: '' },
  connecting: { bg: 'bg-amber-900/50', border: 'border-amber-500', glow: 'shadow-amber-500/50 shadow-lg', animate: 'animate-pulse' },
  success: { bg: 'bg-emerald-900/50', border: 'border-emerald-500', glow: 'shadow-emerald-500/30 shadow-lg', animate: '' },
  error: { bg: 'bg-red-900/50', border: 'border-red-500', glow: 'shadow-red-500/50 shadow-lg', animate: 'animate-pulse' },
  retrying: { bg: 'bg-amber-900/30', border: 'border-amber-400', glow: 'shadow-amber-400/40 shadow-lg', animate: '' },
}

// Custom Agent Node Component
function AgentNode({ data }: { data: WorkflowNodeData }) {
  const style = statusStyles[data.status]

  return (
    <div className={`
      relative min-w-[220px] rounded-2xl border-2 ${style.border} ${style.bg} ${style.glow} ${style.animate}
      transition-all duration-500 backdrop-blur-sm
    `}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-gradient-to-r from-cyan-500 to-blue-500 !border-2 !border-slate-800"
      />

      {/* Node Content */}
      <div className="p-4">
        {/* Avatar and Name */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <ProfessionalAvatar agentId={data.agentId} size={52} isActive={data.status === 'connecting' || data.status === 'retrying'} />
            {/* Status indicator dot */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${
              data.status === 'success' ? 'bg-emerald-500' :
              data.status === 'connecting' || data.status === 'retrying' ? 'bg-amber-500 animate-pulse' :
              data.status === 'error' ? 'bg-red-500' :
              'bg-slate-500'
            }`} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{data.agentName}</h3>
            <p className="text-xs text-slate-400">{data.label}</p>
          </div>
        </div>

        {/* Task Description */}
        <div className="bg-slate-900/50 rounded-lg p-2 mb-2">
          <p className="text-xs text-slate-300 leading-relaxed">{data.task}</p>
        </div>

        {/* API Endpoint (if applicable) */}
        {data.apiEndpoint && (
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded-full ${
              data.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
              data.status === 'connecting' ? 'bg-amber-500/20 text-amber-400' :
              data.status === 'error' ? 'bg-red-500/20 text-red-400' :
              'bg-slate-700 text-slate-400'
            }`}>
              {data.status === 'retrying' ? `Retry ${data.retryCount || 0}/3` : data.apiEndpoint}
            </span>
          </div>
        )}

        {/* Progress bar for connecting/retrying */}
        {(data.status === 'connecting' || data.status === 'retrying') && (
          <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 animate-progress-bar" />
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-gradient-to-r from-purple-500 to-pink-500 !border-2 !border-slate-800"
      />
    </div>
  )
}

// Custom Trigger Node
function TriggerNode({ data }: { data: WorkflowNodeData }) {
  const style = statusStyles[data.status]

  return (
    <div className={`
      relative min-w-[180px] rounded-2xl border-2 ${style.border} ${style.bg} ${style.glow}
      transition-all duration-500
    `}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center ${data.status === 'connecting' ? 'animate-pulse' : ''}`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Trigger</h3>
            <p className="text-xs text-slate-400">{data.label}</p>
          </div>
        </div>
        <p className="text-xs text-slate-300">{data.task}</p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-gradient-to-r from-violet-500 to-purple-500 !border-2 !border-slate-800"
      />
    </div>
  )
}

// Custom Output Node
function OutputNode({ data }: { data: WorkflowNodeData }) {
  const style = statusStyles[data.status]

  return (
    <div className={`
      relative min-w-[180px] rounded-2xl border-2 ${style.border} ${style.bg} ${style.glow}
      transition-all duration-500
    `}>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-gradient-to-r from-cyan-500 to-blue-500 !border-2 !border-slate-800"
      />

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center ${data.status === 'success' ? 'animate-bounce' : ''}`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Output</h3>
            <p className="text-xs text-slate-400">{data.label}</p>
          </div>
        </div>
        <p className="text-xs text-slate-300">{data.task}</p>
      </div>
    </div>
  )
}

// API Integration Node
function APINode({ data }: { data: WorkflowNodeData }) {
  const style = statusStyles[data.status]

  return (
    <div className={`
      relative min-w-[160px] rounded-xl border-2 ${style.border} ${style.bg} ${style.glow} ${style.animate}
      transition-all duration-500
    `}>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-800"
      />

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            data.status === 'success' ? 'bg-emerald-500' :
            data.status === 'connecting' || data.status === 'retrying' ? 'bg-amber-500' :
            data.status === 'error' ? 'bg-red-500' :
            'bg-slate-600'
          }`}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-white">{data.label}</span>
        </div>
        {data.apiEndpoint && (
          <code className="text-[10px] text-slate-400 bg-slate-900/50 px-1.5 py-0.5 rounded block truncate">
            {data.apiEndpoint}
          </code>
        )}
        {data.status === 'retrying' && (
          <div className="mt-2 text-[10px] text-amber-400 flex items-center gap-1">
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Retry {data.retryCount}/3
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-slate-800"
      />
    </div>
  )
}

// Node types registry
const nodeTypes = {
  agent: AgentNode,
  trigger: TriggerNode,
  output: OutputNode,
  api: APINode,
}

// Custom animated edge with particles
function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const status = (data as any)?.status || 'idle'

  const strokeColor =
    status === 'success' ? '#10b981' :
    status === 'connecting' ? '#f59e0b' :
    status === 'error' ? '#ef4444' :
    '#475569'

  return (
    <>
      {/* Glow effect for active edges */}
      {(status === 'connecting' || status === 'success') && (
        <path
          d={edgePath}
          strokeWidth={8}
          stroke={strokeColor}
          fill="none"
          opacity={0.2}
          className={status === 'connecting' ? 'animate-pulse' : ''}
        />
      )}
      {/* Base edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth: 2,
        }}
      />
      {/* Animated particles for active connections */}
      {(status === 'connecting' || status === 'success') && (
        <>
          <circle r="4" fill={strokeColor}>
            <animateMotion dur={status === 'connecting' ? '2s' : '0.8s'} repeatCount="indefinite">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
          {status === 'connecting' && (
            <circle r="3" fill={strokeColor} opacity="0.5">
              <animateMotion dur="2s" repeatCount="indefinite" begin="0.5s">
                <mpath href={`#${id}`} />
              </animateMotion>
            </circle>
          )}
        </>
      )}
      {/* Hidden path for particle animation */}
      <path id={id} d={edgePath} fill="none" stroke="none" />
    </>
  )
}

const edgeTypes = {
  animated: AnimatedEdge,
}

interface WorkflowCanvasProps {
  workflow: {
    name: string
    description: string
    nodes: Array<{
      id: string
      type: 'trigger' | 'agent' | 'api' | 'output'
      agentId?: string
      agentName?: string
      label: string
      task: string
      apiEndpoint?: string
      position: { x: number; y: number }
    }>
    edges: Array<{
      source: string
      target: string
    }>
  }
  autoPlay?: boolean
  onComplete?: () => void
}

export function WorkflowCanvas({ workflow, autoPlay = false, onComplete }: WorkflowCanvasProps) {
  // Convert workflow to React Flow format
  const initialNodes: Node<WorkflowNodeData>[] = workflow.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      label: node.label,
      agentId: node.agentId || 'nexus',
      agentName: node.agentName || node.label,
      task: node.task,
      status: 'idle' as NodeStatus,
      apiEndpoint: node.apiEndpoint,
      retryCount: 0,
    },
  }))

  const initialEdges: Edge[] = workflow.edges.map((edge) => ({
    id: `e${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    type: 'animated',
    data: { status: 'idle' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#475569',
      width: 20,
      height: 20,
    },
  }))

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [, setCurrentStep] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [completedNodes, setCompletedNodes] = useState(0)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Update node status
  const updateNodeStatus = useCallback((nodeId: string, status: NodeStatus, retryCount?: number) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, status, retryCount: retryCount ?? node.data.retryCount } }
          : node
      )
    )
  }, [setNodes])

  // Update edge status
  const updateEdgeStatus = useCallback((sourceId: string, targetId: string, status: NodeStatus) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.source === sourceId && edge.target === targetId
          ? {
              ...edge,
              data: { ...edge.data, status },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: status === 'success' ? '#10b981' : status === 'connecting' ? '#f59e0b' : '#475569',
                width: 20,
                height: 20,
              },
            }
          : edge
      )
    )
  }, [setEdges])

  // Get connected edges for a node
  const getIncomingEdges = useCallback((nodeId: string) => {
    return workflow.edges.filter((e) => e.target === nodeId)
  }, [workflow.edges])

  // Simulate workflow execution
  const runWorkflow = useCallback(async () => {
    if (isRunning) return
    setIsRunning(true)
    setCompletedNodes(0)

    // Reset all nodes and edges
    setNodes((nds) => nds.map((node) => ({ ...node, data: { ...node.data, status: 'pending' as NodeStatus, retryCount: 0 } })))
    setEdges((eds) => eds.map((edge) => ({ ...edge, data: { status: 'idle' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#475569', width: 20, height: 20 } })))

    // Build execution order (topological sort)
    const executed = new Set<string>()
    const queue = workflow.nodes.filter((n) => n.type === 'trigger').map((n) => n.id)

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      if (executed.has(nodeId)) continue

      const node = workflow.nodes.find((n) => n.id === nodeId)!
      const incomingEdges = getIncomingEdges(nodeId)

      // Check if all dependencies are satisfied
      const allDepsComplete = incomingEdges.every((e) => executed.has(e.source))
      if (!allDepsComplete && incomingEdges.length > 0) {
        queue.push(nodeId) // Re-queue
        continue
      }

      setCurrentStep(workflow.nodes.indexOf(node))

      // Animate incoming edges
      for (const edge of incomingEdges) {
        updateEdgeStatus(edge.source, edge.target, 'connecting')
      }

      // Start connecting animation
      updateNodeStatus(nodeId, 'connecting')

      // Simulate API connection with possible retries for API nodes
      const shouldRetry = node.type === 'api' && Math.random() > 0.6

      if (shouldRetry) {
        // Simulate retry scenario with yellow pulsing
        for (let retry = 1; retry <= 2; retry++) {
          updateNodeStatus(nodeId, 'retrying', retry)
          await new Promise((resolve) => setTimeout(resolve, 1200))
        }
      }

      // Wait for "processing"
      await new Promise((resolve) => setTimeout(resolve, shouldRetry ? 800 : 1500))

      // Mark as success with green
      updateNodeStatus(nodeId, 'success')
      setCompletedNodes((prev) => prev + 1)

      // Update incoming edges to success
      for (const edge of incomingEdges) {
        updateEdgeStatus(edge.source, edge.target, 'success')
      }

      executed.add(nodeId)

      // Queue connected nodes
      const outgoingEdges = workflow.edges.filter((e) => e.source === nodeId)
      for (const edge of outgoingEdges) {
        if (!executed.has(edge.target)) {
          queue.push(edge.target)
        }
      }

      // Small delay before next node
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    setIsRunning(false)
    setCurrentStep(-1)
    onComplete?.()
  }, [workflow, isRunning, updateNodeStatus, updateEdgeStatus, getIncomingEdges, setNodes, setEdges, onComplete])

  // Auto-play on mount
  useEffect(() => {
    if (autoPlay) {
      const timer = setTimeout(() => runWorkflow(), 1000)
      return () => clearTimeout(timer)
    }
  }, [autoPlay])

  return (
    <ReactFlowProvider>
    <div className="w-full h-full relative" style={{ height: '100%', minHeight: '500px' }}>
      {/* Workflow Header */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/95 backdrop-blur-sm rounded-2xl p-5 border border-slate-700 shadow-2xl max-w-xs">
        <h2 className="text-lg font-bold text-white mb-1">{workflow.name}</h2>
        <p className="text-sm text-slate-400 mb-4 leading-relaxed">{workflow.description}</p>

        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Progress</span>
            <span>{completedNodes}/{workflow.nodes.length} nodes</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${(completedNodes / workflow.nodes.length) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={runWorkflow}
          disabled={isRunning}
          className={`
            w-full px-4 py-3 rounded-xl text-sm font-medium transition-all
            ${isRunning
              ? 'bg-amber-500/20 text-amber-400 cursor-not-allowed border border-amber-500/30'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.02]'
            }
          `}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Executing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Execute Workflow
            </span>
          )}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/95 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
        <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Status Legend</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500" />
            <span className="text-slate-400">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-slate-400">Connecting</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-slate-400">Retrying</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Success</span>
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-right"
        className="bg-slate-950"
        defaultEdgeOptions={{
          type: 'animated',
        }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Controls
          className="!bg-slate-800 !border-slate-700 !rounded-xl !shadow-xl [&>button]:!bg-slate-700 [&>button]:!border-slate-600 [&>button]:!text-white [&>button:hover]:!bg-slate-600"
          showInteractive={false}
        />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#334155" />
      </ReactFlow>

      {/* CSS for animations */}
      <style>{`
        @keyframes progress-bar {
          0% { width: 0%; transform: translateX(0); }
          50% { width: 100%; }
          100% { width: 0%; transform: translateX(100%); }
        }
        .animate-progress-bar {
          animation: progress-bar 1.5s ease-in-out infinite;
        }
        .react-flow__attribution {
          display: none;
        }
      `}</style>
    </div>
    </ReactFlowProvider>
  )
}

// Complex workflow examples with many nodes
export const COMPLEX_WORKFLOWS = {
  enterpriseSalesAutomation: {
    name: 'Enterprise Sales Pipeline Automation',
    description: 'End-to-end sales automation with CRM sync, lead scoring, and personalized outreach across 10+ integrated systems',
    nodes: [
      { id: '1', type: 'trigger' as const, label: 'New Lead', task: 'Webhook from landing page form submission', position: { x: 0, y: 250 } },
      { id: '2', type: 'api' as const, label: 'HubSpot CRM', task: 'Create contact record', apiEndpoint: 'POST /contacts', position: { x: 220, y: 100 } },
      { id: '3', type: 'api' as const, label: 'Clearbit', task: 'Enrich company data', apiEndpoint: 'GET /enrichment', position: { x: 220, y: 400 } },
      { id: '4', type: 'agent' as const, agentId: 'larry', agentName: 'Larry', label: 'Business Analyst', task: 'Analyze lead quality and assign priority score based on company size, revenue, and industry fit', position: { x: 480, y: 50 } },
      { id: '5', type: 'agent' as const, agentId: 'mary', agentName: 'Mary', label: 'Product Manager', task: 'Match lead requirements to product offerings and identify cross-sell opportunities', position: { x: 480, y: 250 } },
      { id: '6', type: 'api' as const, label: 'LinkedIn API', task: 'Fetch company insights', apiEndpoint: 'GET /companies', position: { x: 480, y: 450 } },
      { id: '7', type: 'agent' as const, agentId: 'sam', agentName: 'Sam', label: 'Senior Developer', task: 'Generate personalized demo environment with custom integrations and sample data', position: { x: 760, y: 150 } },
      { id: '8', type: 'agent' as const, agentId: 'alex', agentName: 'Alex', label: 'Solutions Architect', task: 'Create technical proposal with architecture diagram and integration roadmap', position: { x: 760, y: 350 } },
      { id: '9', type: 'api' as const, label: 'Salesforce', task: 'Sync opportunity data', apiEndpoint: 'POST /opportunities', position: { x: 1020, y: 50 } },
      { id: '10', type: 'agent' as const, agentId: 'emma', agentName: 'Emma', label: 'UX Designer', task: 'Create personalized pitch deck with branded visuals and ROI projections', position: { x: 1020, y: 250 } },
      { id: '11', type: 'api' as const, label: 'Calendly', task: 'Schedule demo call', apiEndpoint: 'POST /events', position: { x: 1020, y: 450 } },
      { id: '12', type: 'api' as const, label: 'SendGrid', task: 'Send personalized intro email with deck', apiEndpoint: 'POST /mail/send', position: { x: 1280, y: 150 } },
      { id: '13', type: 'agent' as const, agentId: 'olivia', agentName: 'Olivia', label: 'QA Lead', task: 'Validate all outputs and ensure compliance with brand guidelines', position: { x: 1280, y: 350 } },
      { id: '14', type: 'output' as const, label: 'Complete', task: 'Lead qualified, demo scheduled, and personalized outreach initiated', position: { x: 1520, y: 250 } },
    ],
    edges: [
      { source: '1', target: '2' },
      { source: '1', target: '3' },
      { source: '2', target: '4' },
      { source: '2', target: '5' },
      { source: '3', target: '5' },
      { source: '3', target: '6' },
      { source: '4', target: '7' },
      { source: '5', target: '7' },
      { source: '5', target: '8' },
      { source: '6', target: '8' },
      { source: '7', target: '9' },
      { source: '7', target: '10' },
      { source: '8', target: '10' },
      { source: '8', target: '11' },
      { source: '9', target: '12' },
      { source: '10', target: '12' },
      { source: '10', target: '13' },
      { source: '11', target: '13' },
      { source: '12', target: '14' },
      { source: '13', target: '14' },
    ],
  },

  customerOnboarding: {
    name: 'Enterprise Customer Onboarding',
    description: 'Multi-step onboarding flow with account provisioning, training setup, and success monitoring',
    nodes: [
      { id: '1', type: 'trigger' as const, label: 'New Customer', task: 'Stripe subscription created webhook', position: { x: 0, y: 250 } },
      { id: '2', type: 'api' as const, label: 'Auth0', task: 'Create organization and admin user', apiEndpoint: 'POST /organizations', position: { x: 220, y: 100 } },
      { id: '3', type: 'api' as const, label: 'Stripe', task: 'Fetch subscription and payment details', apiEndpoint: 'GET /subscriptions', position: { x: 220, y: 400 } },
      { id: '4', type: 'agent' as const, agentId: 'david', agentName: 'David', label: 'DevOps Engineer', task: 'Provision dedicated infrastructure with VPC, databases, and security groups', position: { x: 480, y: 50 } },
      { id: '5', type: 'agent' as const, agentId: 'sam', agentName: 'Sam', label: 'Senior Developer', task: 'Initialize tenant schema, seed configurations, and set up API keys', position: { x: 480, y: 200 } },
      { id: '6', type: 'api' as const, label: 'AWS', task: 'Create S3 bucket and CloudFront distribution', apiEndpoint: 'POST /s3/buckets', position: { x: 480, y: 350 } },
      { id: '7', type: 'agent' as const, agentId: 'olivia', agentName: 'Olivia', label: 'QA Lead', task: 'Run comprehensive smoke tests and validate environment setup', position: { x: 480, y: 500 } },
      { id: '8', type: 'api' as const, label: 'Intercom', task: 'Create customer profile and support workspace', apiEndpoint: 'POST /contacts', position: { x: 740, y: 100 } },
      { id: '9', type: 'agent' as const, agentId: 'emma', agentName: 'Emma', label: 'UX Designer', task: 'Generate personalized onboarding tutorial and welcome guide', position: { x: 740, y: 300 } },
      { id: '10', type: 'api' as const, label: 'Slack', task: 'Create dedicated customer channel', apiEndpoint: 'POST /conversations.create', position: { x: 740, y: 500 } },
      { id: '11', type: 'agent' as const, agentId: 'larry', agentName: 'Larry', label: 'Business Analyst', task: 'Document customer requirements and success criteria', position: { x: 1000, y: 100 } },
      { id: '12', type: 'api' as const, label: 'Notion', task: 'Create customer success playbook', apiEndpoint: 'POST /pages', position: { x: 1000, y: 300 } },
      { id: '13', type: 'api' as const, label: 'Calendly', task: 'Schedule kickoff and training calls', apiEndpoint: 'POST /scheduled_events', position: { x: 1000, y: 500 } },
      { id: '14', type: 'api' as const, label: 'Mixpanel', task: 'Initialize analytics and tracking', apiEndpoint: 'POST /engage', position: { x: 1260, y: 200 } },
      { id: '15', type: 'agent' as const, agentId: 'mary', agentName: 'Mary', label: 'Product Manager', task: 'Create 90-day success roadmap with milestones', position: { x: 1260, y: 400 } },
      { id: '16', type: 'output' as const, label: 'Onboarded', task: 'Customer fully provisioned with training scheduled', position: { x: 1500, y: 300 } },
    ],
    edges: [
      { source: '1', target: '2' },
      { source: '1', target: '3' },
      { source: '2', target: '4' },
      { source: '2', target: '5' },
      { source: '3', target: '5' },
      { source: '3', target: '6' },
      { source: '3', target: '7' },
      { source: '4', target: '8' },
      { source: '5', target: '8' },
      { source: '5', target: '9' },
      { source: '6', target: '9' },
      { source: '7', target: '10' },
      { source: '8', target: '11' },
      { source: '9', target: '11' },
      { source: '9', target: '12' },
      { source: '10', target: '13' },
      { source: '11', target: '14' },
      { source: '12', target: '14' },
      { source: '12', target: '15' },
      { source: '13', target: '15' },
      { source: '14', target: '16' },
      { source: '15', target: '16' },
    ],
  },

  contentPipeline: {
    name: 'AI Content Production Pipeline',
    description: 'Automated content creation, multi-stage review, and omnichannel distribution workflow',
    nodes: [
      { id: '1', type: 'trigger' as const, label: 'Content Brief', task: 'New content request from marketing team', position: { x: 0, y: 250 } },
      { id: '2', type: 'agent' as const, agentId: 'mary', agentName: 'Mary', label: 'Product Manager', task: 'Analyze brief, define content strategy, and align with product roadmap', position: { x: 260, y: 100 } },
      { id: '3', type: 'api' as const, label: 'SEMrush', task: 'Research keywords and competition', apiEndpoint: 'GET /keywords/related', position: { x: 260, y: 400 } },
      { id: '4', type: 'agent' as const, agentId: 'larry', agentName: 'Larry', label: 'Business Analyst', task: 'Research competitor content and identify unique angles', position: { x: 520, y: 50 } },
      { id: '5', type: 'agent' as const, agentId: 'alex', agentName: 'Alex', label: 'Solutions Architect', task: 'Create technical outline with code examples and diagrams', position: { x: 520, y: 200 } },
      { id: '6', type: 'agent' as const, agentId: 'emma', agentName: 'Emma', label: 'UX Designer', task: 'Design hero graphics, infographics, and social assets', position: { x: 520, y: 350 } },
      { id: '7', type: 'api' as const, label: 'Unsplash', task: 'Source stock imagery', apiEndpoint: 'GET /photos/search', position: { x: 520, y: 500 } },
      { id: '8', type: 'agent' as const, agentId: 'sam', agentName: 'Sam', label: 'Senior Developer', task: 'Write technical content with working code samples', position: { x: 780, y: 150 } },
      { id: '9', type: 'agent' as const, agentId: 'olivia', agentName: 'Olivia', label: 'QA Lead', task: 'Review content for accuracy, grammar, and brand voice', position: { x: 780, y: 350 } },
      { id: '10', type: 'api' as const, label: 'Grammarly', task: 'Final grammar and style check', apiEndpoint: 'POST /check', position: { x: 1040, y: 100 } },
      { id: '11', type: 'api' as const, label: 'WordPress', task: 'Publish blog post', apiEndpoint: 'POST /wp/v2/posts', position: { x: 1040, y: 250 } },
      { id: '12', type: 'api' as const, label: 'Buffer', task: 'Schedule social media posts', apiEndpoint: 'POST /updates/create', position: { x: 1040, y: 400 } },
      { id: '13', type: 'api' as const, label: 'Mailchimp', task: 'Add to newsletter campaign', apiEndpoint: 'POST /campaigns', position: { x: 1040, y: 550 } },
      { id: '14', type: 'api' as const, label: 'Google Analytics', task: 'Set up tracking', apiEndpoint: 'POST /events', position: { x: 1300, y: 250 } },
      { id: '15', type: 'agent' as const, agentId: 'david', agentName: 'David', label: 'DevOps Engineer', task: 'Invalidate CDN cache and verify deployment', position: { x: 1300, y: 450 } },
      { id: '16', type: 'output' as const, label: 'Published', task: 'Content live across blog, social, and email', position: { x: 1540, y: 350 } },
    ],
    edges: [
      { source: '1', target: '2' },
      { source: '1', target: '3' },
      { source: '2', target: '4' },
      { source: '2', target: '5' },
      { source: '3', target: '5' },
      { source: '3', target: '6' },
      { source: '3', target: '7' },
      { source: '4', target: '8' },
      { source: '5', target: '8' },
      { source: '6', target: '9' },
      { source: '7', target: '9' },
      { source: '8', target: '9' },
      { source: '8', target: '10' },
      { source: '9', target: '10' },
      { source: '9', target: '11' },
      { source: '10', target: '11' },
      { source: '9', target: '12' },
      { source: '9', target: '13' },
      { source: '11', target: '14' },
      { source: '12', target: '15' },
      { source: '13', target: '15' },
      { source: '14', target: '16' },
      { source: '15', target: '16' },
    ],
  },
}

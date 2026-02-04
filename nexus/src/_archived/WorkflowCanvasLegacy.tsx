import { useCallback } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Connection,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from './ui/button'
import type { WorkflowDefinition } from '@/lib/workflow-engine'
import { ProfessionalAvatar } from './ProfessionalAvatar'

const nodeTypes = {
  'ai-agent': AIAgentNode,
  'condition': ConditionNode,
  'data-transform': DataTransformNode,
  'start': StartNode,
  'end': EndNode,
}

function AIAgentNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-xl border-2 border-primary bg-slate-800 min-w-[200px]">
      <div className="flex items-center gap-3 mb-2">
        <ProfessionalAvatar agentId="nexus" size={36} />
        <div className="font-bold text-white">{data.label}</div>
      </div>
      <div className="text-xs text-slate-400">
        {data.config?.model || 'Claude Sonnet'}
      </div>
      {data.status && (
        <div className={`mt-2 text-xs px-2 py-1 rounded ${
          data.status === 'running' ? 'bg-amber-500/20 text-amber-400' :
          data.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
          data.status === 'failed' ? 'bg-red-500/20 text-red-400' :
          'bg-slate-700 text-slate-400'
        }`}>
          {data.status}
        </div>
      )}
    </div>
  )
}

function ConditionNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-xl border-2 border-secondary bg-slate-800 min-w-[150px]">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-secondary/20 flex items-center justify-center text-secondary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="font-bold text-white">{data.label}</div>
      </div>
      {data.status && (
        <div className={`mt-2 text-xs px-2 py-1 rounded ${
          data.status === 'running' ? 'bg-amber-500/20 text-amber-400' :
          data.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
          'bg-slate-700 text-slate-400'
        }`}>
          {data.status}
        </div>
      )}
    </div>
  )
}

function DataTransformNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-xl border-2 border-accent bg-slate-800 min-w-[150px]">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center text-accent">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="font-bold text-white">{data.label}</div>
      </div>
      {data.status && (
        <div className={`mt-2 text-xs px-2 py-1 rounded ${
          data.status === 'running' ? 'bg-amber-500/20 text-amber-400' :
          data.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
          'bg-slate-700 text-slate-400'
        }`}>
          {data.status}
        </div>
      )}
    </div>
  )
}

function StartNode() {
  return (
    <div className="px-6 py-3 shadow-lg rounded-full border-2 border-emerald-500 bg-emerald-500/10">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div className="font-bold text-emerald-400">Start</div>
      </div>
    </div>
  )
}

function EndNode() {
  return (
    <div className="px-6 py-3 shadow-lg rounded-full border-2 border-red-500 bg-red-500/10">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </div>
        <div className="font-bold text-red-400">End</div>
      </div>
    </div>
  )
}

interface WorkflowCanvasLegacyProps {
  initialDefinition?: WorkflowDefinition
  executionState?: any
  onSave?: (definition: WorkflowDefinition) => void
  readOnly?: boolean
}

export function WorkflowCanvasLegacy({ initialDefinition, executionState, onSave, readOnly }: WorkflowCanvasLegacyProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialDefinition?.nodes.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: {
        label: n.label,
        config: n.config,
        status: executionState?.steps.find((s: any) => s.nodeId === n.id)?.status,
      },
    })) || []
  )

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialDefinition?.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: executionState?.currentNodeId === e.source,
    })) || []
  )

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds) as typeof eds),
    [setEdges]
  )

  const addNode = (type: string) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: type as 'ai-agent' | 'condition' | 'data-transform' | 'start' | 'end',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        label: type === 'ai-agent' ? 'AI Agent' :
               type === 'condition' ? 'Condition' :
               type === 'data-transform' ? 'Transform' :
               type,
        config: {},
        status: undefined,
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  const handleSave = () => {
    const definition: WorkflowDefinition = {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type as any,
        label: n.data.label,
        config: n.data.config || {},
        position: n.position,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: typeof e.label === 'string' ? e.label : undefined,
      })),
    }
    onSave?.(definition)
  }

  return (
    <div className="h-full w-full">
      {!readOnly && (
        <div className="absolute top-4 left-4 z-10 flex gap-2 bg-slate-900/95 backdrop-blur-sm p-4 rounded-xl border border-slate-700 shadow-xl">
          <Button onClick={() => addNode('start')} size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
            Start
          </Button>
          <Button onClick={() => addNode('ai-agent')} size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
            AI Agent
          </Button>
          <Button onClick={() => addNode('condition')} size="sm" variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10">
            Condition
          </Button>
          <Button onClick={() => addNode('data-transform')} size="sm" variant="outline" className="border-accent/30 text-accent hover:bg-accent/10">
            Transform
          </Button>
          <Button onClick={() => addNode('end')} size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            End
          </Button>
          <Button onClick={handleSave} size="sm" className="ml-4 bg-gradient-to-r from-cyan-500 to-blue-500">
            Save Workflow
          </Button>
        </div>
      )}

      {executionState && (
        <div className="absolute top-4 right-4 z-10 bg-slate-900/95 backdrop-blur-sm p-4 rounded-xl border border-slate-700 shadow-xl">
          <div className="text-sm font-bold text-white mb-2">Execution Status</div>
          <div className="text-xs space-y-1 text-slate-300">
            <div>Status: <span className="font-medium text-white">{executionState.status}</span></div>
            <div>Tokens: <span className="font-medium text-white">{executionState.totalTokens}</span></div>
            <div>Cost: <span className="font-medium text-white">${executionState.totalCost.toFixed(4)}</span></div>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-950"
      >
        <Controls className="!bg-slate-800 !border-slate-700 !rounded-xl [&>button]:!bg-slate-700 [&>button]:!border-slate-600 [&>button]:!text-white" />
        <MiniMap className="!bg-slate-800 !border-slate-700 !rounded-xl" />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#334155" />
      </ReactFlow>
    </div>
  )
}

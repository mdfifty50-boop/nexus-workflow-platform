/**
 * WorkflowExecutor - Displays and executes AI-generated workflows
 *
 * REAL BACKEND EXECUTION - Connected to WorkflowContext
 *
 * Features:
 * - Visual workflow graph
 * - Real backend execution via WorkflowContext
 * - SSE-based real-time status updates
 * - Integration connection prompts
 * - Real-time progress tracking
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { GeneratedWorkflow } from '@/services/SmartWorkflowEngine'
import { integrationService } from '@/services/IntegrationService'
import { useWorkflowContext, type WorkflowNode as ContextWorkflowNode } from '@/contexts/WorkflowContext'

interface NodeStatus {
  status: 'pending' | 'running' | 'complete' | 'error'
  message?: string
  data?: unknown
}

interface WorkflowExecutorProps {
  onClose?: () => void
}

export function WorkflowExecutor({ onClose: _onClose }: WorkflowExecutorProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Get WorkflowContext for real backend execution
  const workflowContext = useWorkflowContext()

  const [workflow, setWorkflow] = useState<GeneratedWorkflow | null>(null)
  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>({})
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionLog, setExecutionLog] = useState<string[]>([])
  const [missingIntegrations, setMissingIntegrations] = useState<string[]>([])
  const [showIntegrationModal, setShowIntegrationModal] = useState(false)

  // Load workflow from URL params or localStorage
  useEffect(() => {
    const urlWorkflowId = searchParams.get('id')
    const storedWorkflowId = localStorage.getItem('nexus_active_workflow_id')
    const saved = localStorage.getItem('nexus_pending_workflow')

    // Prefer URL workflow ID, then stored ID
    const activeId = urlWorkflowId || storedWorkflowId

    if (activeId) {
      setWorkflowId(activeId)
      addLog(`Loading workflow ID: ${activeId}`)

      // If workflow exists in context, use it
      const contextWorkflow = workflowContext.workflows.get(activeId)
      if (contextWorkflow) {
        addLog(`Found workflow in context: ${contextWorkflow.name}`)
      }
    }

    // Also load UI representation from localStorage for display
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GeneratedWorkflow
        setWorkflow(parsed)

        // Check for missing integrations
        const missing = parsed.requiredIntegrations.filter(
          id => !integrationService.isConnected(id) && id !== 'playwright'
        )
        setMissingIntegrations(missing)

        // Initialize node statuses
        const statuses: Record<string, NodeStatus> = {}
        parsed.nodes.forEach(node => {
          statuses[node.id] = { status: 'pending' }
        })
        setNodeStatuses(statuses)
      } catch (e) {
        console.error('Failed to load workflow:', e)
      }
    }
  }, [searchParams, workflowContext.workflows])

  // Sync node statuses from WorkflowContext (SSE updates)
  useEffect(() => {
    if (!workflowId) return

    const contextWorkflow = workflowContext.activeWorkflow
    if (!contextWorkflow || contextWorkflow.id !== workflowId) return

    // Map context node statuses to local statuses
    const newStatuses: Record<string, NodeStatus> = {}
    contextWorkflow.nodes.forEach((node: ContextWorkflowNode, nodeId: string) => {
      // Map context status to NodeStatus type (pending/running/complete/error)
      let mappedStatus: 'pending' | 'running' | 'complete' | 'error' = 'pending'
      if (node.status === 'completed') {
        mappedStatus = 'complete'
      } else if (node.status === 'failed') {
        mappedStatus = 'error'
      } else if (node.status === 'running') {
        mappedStatus = 'running'
      }

      newStatuses[nodeId] = {
        status: mappedStatus,
        message: node.output ? 'Success' : node.error || undefined
      }

      // Log status changes
      if (node.status === 'running') {
        addLog(`Executing: ${node.label}`)
      } else if (node.status === 'completed') {
        addLog(`Completed: ${node.label}`)
      } else if (node.status === 'failed') {
        addLog(`Error in ${node.label}: ${node.error}`)
      }
    })
    setNodeStatuses(newStatuses)

    // Update execution state
    if (contextWorkflow.status === 'running') {
      setIsExecuting(true)
    } else if (contextWorkflow.status === 'completed' || contextWorkflow.status === 'failed') {
      setIsExecuting(false)
      if (contextWorkflow.status === 'completed') {
        addLog('Workflow completed successfully!')
      } else {
        addLog(`Workflow failed: ${contextWorkflow.error}`)
      }
    }
  }, [workflowId, workflowContext.activeWorkflow])

  // Log helper
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setExecutionLog(prev => [...prev, `[${timestamp}] ${message}`])
  }, [])

  // Execute workflow via WorkflowContext (REAL BACKEND)
  const executeWorkflow = useCallback(async () => {
    if (!workflow) return

    // Check for missing integrations first
    if (missingIntegrations.length > 0) {
      setShowIntegrationModal(true)
      return
    }

    setIsExecuting(true)
    addLog('Starting workflow execution via backend...')

    try {
      let activeWorkflowId = workflowId

      // If no workflow ID, create one first
      if (!activeWorkflowId) {
        addLog('Creating workflow in database...')

        const workflowSteps = workflow.nodes.map(node => ({
          id: node.id,
          type: node.type,
          tool: node.tool,
          name: node.name,
          description: node.description,
          config: node.config || {},
          integrationId: workflow.requiredIntegrations.find(i =>
            node.tool.toLowerCase().includes(i.toLowerCase())
          ) || node.tool
        }))

        activeWorkflowId = await workflowContext.createWorkflow(
          workflow.name,
          workflow.description,
          workflowSteps
        )

        setWorkflowId(activeWorkflowId)
        localStorage.setItem('nexus_active_workflow_id', activeWorkflowId)
        addLog(`Workflow created: ${activeWorkflowId}`)
      }

      // Start workflow execution
      addLog('Starting workflow planning phase...')
      await workflowContext.startWorkflow(activeWorkflowId)

      // SSE will handle real-time updates via the useEffect above
      addLog('Connected to real-time updates via SSE')

    } catch (error) {
      setIsExecuting(false)
      const errorMsg = error instanceof Error ? error.message : String(error)
      addLog(`Execution error: ${errorMsg}`)
    }
  }, [workflow, workflowId, missingIntegrations, workflowContext, addLog])

  // Connect missing integration
  const connectIntegration = useCallback(async (id: string) => {
    const result = await integrationService.connectIntegration(id)
    if (result.redirectUrl) {
      // In production, this would open OAuth popup
      window.open(result.redirectUrl, '_blank', 'width=500,height=600')
    }

    // For demo, simulate successful connection after delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    setMissingIntegrations(prev => prev.filter(i => i !== id))
  }, [])

  // Get node status styling
  const getNodeStatusClasses = useCallback((status: NodeStatus['status']) => {
    switch (status) {
      case 'running':
        return 'border-yellow-500 bg-yellow-500/10 animate-pulse'
      case 'complete':
        return 'border-green-500 bg-green-500/10'
      case 'error':
        return 'border-red-500 bg-red-500/10'
      default:
        return 'border-slate-600 bg-slate-800'
    }
  }, [])

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-8">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">🤖</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No Workflow Loaded</h2>
        <p className="text-slate-400 mb-4">Create a workflow using the AI assistant</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg"
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border-b border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{workflow.name}</h2>
            <p className="text-slate-400">{workflow.description}</p>
            {workflowId && (
              <p className="text-xs text-cyan-400 mt-1">ID: {workflowId}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Est. Time Saved</p>
              <p className="text-xl font-semibold text-green-400">{workflow.estimatedTimeSaved}</p>
            </div>
            {!isExecuting && (
              <button
                onClick={executeWorkflow}
                disabled={isExecuting}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Execute Workflow
              </button>
            )}
            {isExecuting && (
              <div className="px-6 py-3 bg-amber-500/20 text-amber-400 font-semibold rounded-xl flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                Executing...
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="px-4 py-2 bg-slate-800/50 rounded-lg">
            <span className="text-sm text-slate-400">Nodes:</span>
            <span className="ml-2 text-white font-medium">{workflow.nodes.length}</span>
          </div>
          <div className="px-4 py-2 bg-slate-800/50 rounded-lg">
            <span className="text-sm text-slate-400">Connections:</span>
            <span className="ml-2 text-white font-medium">{workflow.connections.length}</span>
          </div>
          <div className="px-4 py-2 bg-slate-800/50 rounded-lg">
            <span className="text-sm text-slate-400">Complexity:</span>
            <span className="ml-2 text-white font-medium capitalize">{workflow.complexity}</span>
          </div>
          <div className="px-4 py-2 bg-slate-800/50 rounded-lg">
            <span className="text-sm text-slate-400">Integrations:</span>
            <span className="ml-2 text-white font-medium">{workflow.requiredIntegrations.length}</span>
          </div>
          {workflowContext.activeWorkflow && (
            <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <span className="text-sm text-green-400">Real Backend:</span>
              <span className="ml-2 text-green-300 font-medium">{workflowContext.isConnected ? 'Connected' : 'Pending'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Visualization */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Workflow Steps</h3>
        <div className="flex flex-wrap gap-4">
          {workflow.nodes.map((node, index) => (
            <div key={node.id} className="flex items-center">
              {/* Node */}
              <div
                className={`p-4 rounded-xl border-2 transition-all ${getNodeStatusClasses(nodeStatuses[node.id]?.status || 'pending')}`}
                style={{ minWidth: '140px' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{node.toolIcon}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    node.type === 'trigger' ? 'bg-blue-500/20 text-blue-400' :
                    node.type === 'output' ? 'bg-green-500/20 text-green-400' :
                    node.type === 'condition' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {node.type}
                  </span>
                </div>
                <h4 className="font-medium text-white text-sm">{node.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{node.description}</p>

                {/* Status indicator */}
                {nodeStatuses[node.id]?.status === 'running' && (
                  <div className="mt-2 flex items-center gap-1 text-yellow-400 text-xs">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                    Running...
                  </div>
                )}
                {nodeStatuses[node.id]?.status === 'complete' && (
                  <div className="mt-2 flex items-center gap-1 text-green-400 text-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Complete
                  </div>
                )}
                {nodeStatuses[node.id]?.status === 'error' && (
                  <div className="mt-2 flex items-center gap-1 text-red-400 text-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Error
                  </div>
                )}
              </div>

              {/* Arrow */}
              {index < workflow.nodes.length - 1 && (
                <svg className="w-8 h-8 text-slate-600 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Execution Log */}
      {executionLog.length > 0 && (
        <div className="p-6 border-t border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Execution Log</h3>
          <div className="bg-slate-950 rounded-lg p-4 max-h-48 overflow-y-auto font-mono text-xs">
            {executionLog.map((log, i) => (
              <p key={i} className={`${
                log.includes('Error') || log.includes('failed') ? 'text-red-400' :
                log.includes('Completed') || log.includes('completed') || log.includes('Success') ? 'text-green-400' :
                log.includes('Connected') || log.includes('SSE') ? 'text-cyan-400' :
                log.includes('Creating') || log.includes('Starting') ? 'text-yellow-400' :
                'text-slate-400'
              }`}>
                {log}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Required Integrations */}
      <div className="p-6 border-t border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Required Integrations</h3>
        <div className="flex flex-wrap gap-3">
          {workflow.requiredIntegrations.map(id => {
            const isConnected = integrationService.isConnected(id) || id === 'playwright'
            const integration = integrationService.getIntegration(id)

            return (
              <div
                key={id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  isConnected
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-slate-800 border-slate-600 text-slate-300'
                }`}
              >
                <span className="text-lg">
                  {id === 'gmail' ? '📧' :
                   id === 'slack' ? '💬' :
                   id === 'google_calendar' ? '📅' :
                   id === 'google_sheets' ? '📊' :
                   id === 'playwright' ? '🌐' :
                   id === 'skyscanner' ? '✈️' :
                   id === 'booking_hotels' ? '🏨' :
                   id === 'google_maps' ? '🗺️' :
                   id === 'yelp' ? '⭐' :
                   id === 'quickbooks' ? '💰' :
                   '🔗'}
                </span>
                <span className="text-sm font-medium">{integration?.name || id}</span>
                {isConnected ? (
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <button
                    onClick={() => connectIntegration(id)}
                    className="px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Missing Integrations Modal */}
      {showIntegrationModal && missingIntegrations.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Connect Required Integrations</h3>
            <p className="text-slate-400 mb-4">
              To execute this workflow, please connect the following services:
            </p>
            <div className="space-y-3 mb-6">
              {missingIntegrations.map(id => {
                const integration = integrationService.getIntegration(id)
                return (
                  <button
                    key={id}
                    onClick={() => connectIntegration(id)}
                    className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <span className="text-white font-medium">{integration?.name || id}</span>
                    <span className="text-cyan-400 text-sm">Connect →</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setShowIntegrationModal(false)}
              className="w-full py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkflowExecutor

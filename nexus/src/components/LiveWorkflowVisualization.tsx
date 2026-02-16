import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { ProfessionalAvatar } from './ProfessionalAvatar'
import { usePersonalization } from '@/contexts/PersonalizationContext'
import { type SuggestionWorkflow, type WorkflowStep } from '@/lib/workflow-templates'
import { apiClient } from '@/lib/api-client'
import { globalAutonomy, AutonomyLevel } from '@/lib/ultimate-autonomy'

// API URL
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001')

// SSE Event Types
interface SSENodeUpdate {
  type: 'node_update'
  workflowId: string
  node: {
    id: string
    node_id: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    label: string
    node_type: string
    tokens_used?: number
    cost_usd?: number
    output?: unknown
    started_at?: string
    completed_at?: string
  }
}

interface SSEWorkflowStatus {
  type: 'workflow_status'
  workflowId: string
  status: string
  tokensUsed: number
  costUsd: number
  updatedAt: string
}

interface SSECheckpoint {
  type: 'checkpoint'
  workflowId: string
  checkpoint: string
  tokensUsed: number
  costUsd: number
  createdAt: string
}

// Extended event types for the new orchestrator
interface SSEStepStarted {
  type: 'step_started'
  workflowId: string
  stepId: string
  data: { provider: string; integration: string; action: string }
}

interface SSEStepCompleted {
  type: 'step_completed'
  workflowId: string
  stepId: string
  data: { provider: string; result: unknown; durationMs: number }
}

interface SSEStepFailed {
  type: 'step_failed'
  workflowId: string
  stepId: string
  data: { error: string }
}

interface SSEWorkflowStarted {
  type: 'workflow_started'
  workflowId: string
  data: { executionId: string; totalSteps: number }
}

interface SSEWorkflowCompleted {
  type: 'workflow_completed'
  workflowId: string
  data: { totalTokens: number; totalCost: number; durationMs: number }
}

interface SSEWorkflowFailed {
  type: 'workflow_failed'
  workflowId: string
  data: { error: string }
}

type SSEEvent =
  | SSENodeUpdate
  | SSEWorkflowStatus
  | SSECheckpoint
  | SSEStepStarted
  | SSEStepCompleted
  | SSEStepFailed
  | SSEWorkflowStarted
  | SSEWorkflowCompleted
  | SSEWorkflowFailed
  | { type: 'connected'; workflowId: string }

interface LiveWorkflowVisualizationProps {
  workflow: SuggestionWorkflow
  autoStart?: boolean
  onComplete?: () => void
  useRealExecution?: boolean // Toggle between real and simulated
}

export function LiveWorkflowVisualization({
  workflow,
  autoStart = true,
  onComplete,
  useRealExecution = true // Default to real execution
}: LiveWorkflowVisualizationProps) {
  const { getToken, userId } = useAuth()
  const { getAgentInfo, term } = usePersonalization()
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [stepStatuses, setStepStatuses] = useState<Record<string, WorkflowStep['status']>>({})
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [executionLogs, setExecutionLogs] = useState<{ time: string; message: string; type: 'info' | 'success' | 'warning' }[]>([])
  const [stats, setStats] = useState({ completed: 0, total: workflow.steps.length, startTime: 0, tokensUsed: 0, costUsd: 0 })
  const [_workflowId, setWorkflowId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const time = new Date().toLocaleTimeString()
    setExecutionLogs(prev => [...prev.slice(-20), { time, message, type }])
  }, [])

  // Connect to SSE for real-time updates
  const connectSSE = useCallback(async (wfId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const token = await getToken()

      // Create SSE connection
      const sseUrl = `${API_URL}/api/sse/workflow/${wfId}?token=${token}&userId=${userId}`
      const eventSource = new EventSource(sseUrl)

      eventSource.onopen = () => {
        setIsConnected(true)
        addLog('Connected to real-time updates', 'info')
      }

      eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data)

          switch (data.type) {
            case 'connected':
              addLog(`Workflow ${data.workflowId} connected`, 'info')
              break

            // New orchestrator events
            case 'step_started': {
              const stepIndex = workflow.steps.findIndex(s =>
                s.id === data.stepId || s.id === `step_${data.stepId}`
              )
              if (stepIndex !== -1) {
                const step = workflow.steps[stepIndex]
                const agentInfo = getAgentInfo(step.agentId)
                setCurrentStepIndex(stepIndex)
                setStepStatuses(prev => ({ ...prev, [step.id]: 'running' }))
                addLog(`${agentInfo.name} executing via ${data.data.provider}: ${step.name}`, 'info')
              }
              break
            }

            case 'step_completed': {
              const stepIndex = workflow.steps.findIndex(s =>
                s.id === data.stepId || s.id === `step_${data.stepId}`
              )
              if (stepIndex !== -1) {
                const step = workflow.steps[stepIndex]
                setStepStatuses(prev => ({ ...prev, [step.id]: 'completed' }))
                setStats(prev => ({ ...prev, completed: prev.completed + 1 }))
                addLog(`${step.name} completed in ${data.data.durationMs}ms`, 'success')
              }
              break
            }

            case 'step_failed': {
              const stepIndex = workflow.steps.findIndex(s =>
                s.id === data.stepId || s.id === `step_${data.stepId}`
              )
              if (stepIndex !== -1) {
                const step = workflow.steps[stepIndex]
                setStepStatuses(prev => ({ ...prev, [step.id]: 'failed' }))
                addLog(`${step.name} failed: ${data.data.error}`, 'warning')
              }
              break
            }

            case 'workflow_started':
              addLog(`Workflow execution started (${data.data.totalSteps} steps)`, 'info')
              break

            case 'workflow_completed':
              setIsRunning(false)
              setStats(prev => ({
                ...prev,
                tokensUsed: data.data.totalTokens || prev.tokensUsed,
                costUsd: data.data.totalCost || prev.costUsd
              }))
              addLog(`${workflow.name} completed! Cost: $${data.data.totalCost?.toFixed(4) || '0'}`, 'success')
              onComplete?.()
              break

            case 'workflow_failed':
              setIsRunning(false)
              setError(data.data.error)
              addLog(`Workflow failed: ${data.data.error}`, 'warning')
              break

            // Legacy events
            case 'node_update': {
              // Map node_id to step index
              const stepIndex = workflow.steps.findIndex(s =>
                s.id === data.node.node_id || s.name === data.node.label
              )

              if (stepIndex !== -1) {
                const step = workflow.steps[stepIndex]
                const agentInfo = getAgentInfo(step.agentId)

                setStepStatuses(prev => ({
                  ...prev,
                  [step.id]: data.node.status
                }))

                if (data.node.status === 'running') {
                  setCurrentStepIndex(stepIndex)
                  addLog(`${agentInfo.name} is executing: ${step.name}`, 'info')
                } else if (data.node.status === 'completed') {
                  setStats(prev => ({
                    ...prev,
                    completed: prev.completed + 1,
                    tokensUsed: prev.tokensUsed + (data.node.tokens_used || 0),
                    costUsd: prev.costUsd + (data.node.cost_usd || 0)
                  }))
                  addLog(`${step.name} completed successfully`, 'success')
                } else if (data.node.status === 'failed') {
                  addLog(`${step.name} failed`, 'warning')
                }
              }
              break
            }

            case 'workflow_status':
              if (data.status === 'completed') {
                setIsRunning(false)
                addLog(`${workflow.name} completed!`, 'success')
                onComplete?.()
              } else if (data.status === 'failed') {
                setIsRunning(false)
                setError('Workflow execution failed')
                addLog('Workflow failed', 'warning')
              }
              setStats(prev => ({
                ...prev,
                tokensUsed: data.tokensUsed,
                costUsd: data.costUsd
              }))
              break

            case 'checkpoint':
              addLog(`Checkpoint: ${data.checkpoint}`, 'info')
              break
          }
        } catch (err) {
          console.error('SSE parse error:', err)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        addLog('Connection lost, attempting to reconnect...', 'warning')

        // Auto-reconnect in autonomous mode
        if (globalAutonomy.shouldAutoRetry()) {
          setTimeout(() => connectSSE(wfId), globalAutonomy.getRetryDelay())
          globalAutonomy.recordFailure()
        }
      }

      eventSourceRef.current = eventSource
    } catch (err) {
      console.error('SSE connection error:', err)
      setError('Failed to connect to real-time updates')
    }
  }, [getToken, userId, workflow, getAgentInfo, addLog, onComplete])

  // Run workflow with REAL backend execution via new orchestrator
  const runRealWorkflow = useCallback(async () => {
    if (isRunning) return

    setIsRunning(true)
    setError(null)
    setStats(prev => ({ ...prev, startTime: Date.now(), completed: 0, tokensUsed: 0, costUsd: 0 }))
    addLog(`Starting ${workflow.name} (Real Execution)...`, 'info')

    // Generate workflow ID
    const wfId = `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    setWorkflowId(wfId)

    try {
      // 1. Connect to SSE for real-time updates first
      addLog('Connecting to real-time updates...', 'info')
      await connectSSE(wfId)

      // 2. Call the new workflow execution endpoint
      addLog('Starting workflow orchestration...', 'info')
      const token = await getToken()

      const response = await fetch(`${API_URL}/api/integrations/workflow/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': userId || '',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workflow: {
            id: wfId,
            name: workflow.name,
            description: workflow.description,
            steps: workflow.steps.map((s, index) => ({
              id: s.id || `step_${index}`,
              agent: s.agentId,
              task: s.name,
              name: s.name,
              tool: s.type === 'action' ? workflow.requiredIntegrations?.[0] : undefined,
              action: s.type,
              config: { description: s.description }
            })),
            requiredIntegrations: workflow.requiredIntegrations
          },
          inputs: {},
          options: {
            autonomyLevel: globalAutonomy.getLevel() === AutonomyLevel.ULTIMATE ? 'ultimate' :
                           globalAutonomy.getLevel() === AutonomyLevel.AUTONOMOUS ? 'autonomous' : 'supervised',
            maxCostUsd: 10
          }
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Workflow execution failed')
      }

      addLog('Workflow execution started successfully', 'success')

      // SSE will handle real-time updates from here
      // The orchestrator emits events that broadcast via SSE

    } catch (err) {
      console.error('Real execution error:', err)

      // Fallback to legacy Nexus workflow system
      addLog('Trying legacy workflow system...', 'info')
      try {
        const createResponse = await apiClient.createNexusWorkflow({
          name: workflow.name,
          description: workflow.description,
          workflow_definition: {
            steps: workflow.steps.map(s => ({
              id: s.id,
              name: s.name,
              type: s.type,
              description: s.description,
              agentId: s.agentId,
              estimatedDuration: s.estimatedDuration
            })),
            requiredIntegrations: workflow.requiredIntegrations,
            estimatedTimeSaved: workflow.estimatedTimeSaved
          },
          autonomyLevel: globalAutonomy.getLevel() as 'ultimate' | 'autonomous' | 'semi' | 'supervised'
        })

        if (!createResponse.success || !createResponse.data) {
          throw new Error(createResponse.error || 'Failed to create workflow')
        }

        const legacyWfId = createResponse.data.id
        setWorkflowId(legacyWfId)
        addLog(`Legacy workflow created: ${legacyWfId}`, 'success')

        await connectSSE(legacyWfId)

        const startResponse = await apiClient.startNexusWorkflow(legacyWfId)
        if (!startResponse.success) {
          throw new Error(startResponse.error || 'Failed to start workflow')
        }

        if (globalAutonomy.getLevel() === AutonomyLevel.ULTIMATE ||
            globalAutonomy.getLevel() === AutonomyLevel.AUTONOMOUS) {
          await apiClient.approveNexusWorkflow(legacyWfId)
          try {
            await apiClient.executeNexusWorkflowCoordinated(legacyWfId, {
              autonomyLevel: globalAutonomy.getLevel() as 'ultimate' | 'autonomous'
            })
          } catch {
            await apiClient.executeNexusWorkflow(legacyWfId, {
              autonomyLevel: globalAutonomy.getLevel() as 'ultimate' | 'autonomous'
            })
          }
        }

        addLog('Execution in progress via legacy system...', 'info')
      } catch (legacyErr) {
        setError(legacyErr instanceof Error ? legacyErr.message : 'Execution failed')
        setIsRunning(false)
        addLog(`Error: ${legacyErr instanceof Error ? legacyErr.message : 'Unknown error'}`, 'warning')

        // Auto-retry in autonomous mode
        if (globalAutonomy.shouldAutoRetry()) {
          addLog('Auto-retrying...', 'info')
          setTimeout(() => runRealWorkflow(), globalAutonomy.getRetryDelay())
          globalAutonomy.recordFailure()
        }
      }
    }
  }, [workflow, isRunning, addLog, connectSSE, getToken, userId])

  // Run workflow with SIMULATED execution (fallback)
  const runSimulatedWorkflow = useCallback(async () => {
    if (isRunning) return

    setIsRunning(true)
    setStats(prev => ({ ...prev, startTime: Date.now() }))
    addLog(`Starting ${workflow.name} (Simulated)...`, 'info')

    for (let i = 0; i < workflow.steps.length; i++) {
      // Check if paused
      while (isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setCurrentStepIndex(i)
      const step = workflow.steps[i]
      const agentInfo = getAgentInfo(step.agentId)

      // Set step as running
      setStepStatuses(prev => ({ ...prev, [step.id]: 'running' }))
      addLog(`${agentInfo.name} is executing: ${step.name}`, 'info')

      // Simulate step execution time
      const executionTime = step.type === 'trigger' ? 2000 :
                           step.type === 'transform' ? 2500 :
                           step.type === 'condition' ? 1000 : 1500

      await new Promise(resolve => setTimeout(resolve, executionTime))

      // Set step as completed
      setStepStatuses(prev => ({ ...prev, [step.id]: 'completed' }))
      setStats(prev => ({ ...prev, completed: prev.completed + 1 }))
      addLog(`${step.name} completed successfully`, 'success')
    }

    setIsRunning(false)
    addLog(`${workflow.name} completed!`, 'success')
    onComplete?.()
  }, [workflow, isRunning, isPaused, getAgentInfo, addLog, onComplete])

  // Choose execution method based on prop
  const runWorkflow = useRealExecution ? runRealWorkflow : runSimulatedWorkflow

  // Auto-start effect
  useEffect(() => {
    if (autoStart && !isRunning && currentStepIndex === -1) {
      const timer = setTimeout(() => {
        runWorkflow()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [autoStart, isRunning, currentStepIndex, runWorkflow])

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const getStepStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'pending': return 'bg-slate-600'
      case 'running': return 'bg-cyan-500 animate-pulse shadow-lg shadow-cyan-500/50'
      case 'completed': return 'bg-emerald-500'
      case 'failed': return 'bg-red-500'
    }
  }

  const getStepBorderColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'pending': return 'border-slate-600'
      case 'running': return 'border-cyan-500 shadow-lg shadow-cyan-500/20'
      case 'completed': return 'border-emerald-500'
      case 'failed': return 'border-red-500'
    }
  }

  const elapsedTime = stats.startTime > 0 ? Math.floor((Date.now() - stats.startTime) / 1000) : 0
  const progress = (stats.completed / stats.total) * 100

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-cyan-500 animate-pulse' : stats.completed === stats.total ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            <h3 className="font-semibold text-white">{workflow.name}</h3>
            <span className={`px-2 py-0.5 rounded text-xs ${useRealExecution ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'}`}>
              {useRealExecution ? 'Real' : 'Simulated'}
            </span>
            {isConnected && (
              <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400">
                SSE Connected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isRunning && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              >
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              {term('workflow')} Progress: {stats.completed}/{stats.total} steps
            </span>
            <span className="text-slate-400">
              {elapsedTime > 0 && `${elapsedTime}s elapsed`}
              {stats.tokensUsed > 0 && ` | ${stats.tokensUsed.toLocaleString()} tokens`}
              {stats.costUsd > 0 && ` | $${stats.costUsd.toFixed(4)}`}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Workflow Visualization */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Steps Column */}
          <div className="flex-1 space-y-4">
            {workflow.steps.map((step, index) => {
              const status = stepStatuses[step.id] || 'pending'
              const agentInfo = getAgentInfo(step.agentId)
              const isActive = currentStepIndex === index

              return (
                <div
                  key={step.id}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-300
                    ${getStepBorderColor(status)}
                    ${isActive ? 'bg-slate-800' : 'bg-slate-800/30'}
                  `}
                >
                  {/* Connection Line */}
                  {index < workflow.steps.length - 1 && (
                    <div className="absolute left-1/2 -bottom-4 w-0.5 h-4 bg-slate-600 -translate-x-1/2 z-0" />
                  )}

                  <div className="flex items-center gap-4">
                    {/* Status Indicator */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepStatusColor(status)}`}>
                      {status === 'completed' ? (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : status === 'running' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="text-white font-medium">{index + 1}</span>
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white">{step.name}</h4>
                        <span className={`
                          px-2 py-0.5 rounded text-xs
                          ${step.type === 'trigger' ? 'bg-amber-500/20 text-amber-400' :
                            step.type === 'action' ? 'bg-cyan-500/20 text-cyan-400' :
                            step.type === 'condition' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-emerald-500/20 text-emerald-400'}
                        `}>
                          {step.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{step.description}</p>
                    </div>

                    {/* Agent Avatar */}
                    <div className="flex items-center gap-2">
                      <ProfessionalAvatar agentId={step.agentId} size={32} />
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{agentInfo.name}</p>
                        <p className="text-xs text-slate-500">{agentInfo.title}</p>
                      </div>
                    </div>
                  </div>

                  {/* Active Step Animation */}
                  {isActive && status === 'running' && (
                    <div className="mt-3 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                      <div className="flex items-center gap-2 text-sm text-cyan-400">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <span>Processing...</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Execution Log */}
          <div className="w-80 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-3 border-b border-slate-700 flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-300">Execution Log</h4>
              <span className="text-xs text-slate-500">{executionLogs.length} events</span>
            </div>
            <div className="h-[400px] overflow-y-auto p-3 space-y-2 font-mono text-xs">
              {executionLogs.length === 0 ? (
                <p className="text-slate-500 text-center py-4">Waiting to start...</p>
              ) : (
                executionLogs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-slate-500 shrink-0">[{log.time}]</span>
                    <span className={
                      log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'warning' ? 'text-amber-400' :
                      'text-slate-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/30 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span className="text-slate-300">{stats.completed} completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">⏱️</span>
            <span className="text-slate-300">{workflow.estimatedTimeSaved} estimated savings</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400">📊</span>
            <span className="text-slate-300">{workflow.successRate}% success rate</span>
          </div>
          {stats.costUsd > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-amber-400">💰</span>
              <span className="text-slate-300">${stats.costUsd.toFixed(4)} cost</span>
            </div>
          )}
        </div>

        {stats.completed === stats.total && (
          <span className="px-3 py-1.5 rounded-lg text-sm bg-emerald-500/20 text-emerald-400 font-medium">
            Workflow Complete!
          </span>
        )}
      </div>
    </div>
  )
}

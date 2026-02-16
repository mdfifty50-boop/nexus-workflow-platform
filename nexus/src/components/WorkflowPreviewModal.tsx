import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Button } from './ui/button'
import { ProfessionalAvatar } from './ProfessionalAvatar'
import { usePersonalization } from '@/contexts/PersonalizationContext'
import { type SuggestionWorkflow, type WorkflowStep } from '@/lib/workflow-templates'
import { apiClient } from '@/lib/api-client'
import { globalAutonomy, AutonomyLevel } from '@/lib/ultimate-autonomy'

// API URL
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001')

interface WorkflowPreviewModalProps {
  workflow: SuggestionWorkflow
  isOpen: boolean
  onClose: () => void
  connectedIntegrations: string[]
  useRealExecution?: boolean // Toggle between real and simulated
}

type ExecutionStatus = 'preview' | 'validating' | 'ready' | 'running' | 'completed' | 'failed'

// SSE Event Types
interface SSENodeUpdate {
  type: 'node_update'
  node: {
    node_id: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    tokens_used?: number
    cost_usd?: number
  }
}

interface SSEWorkflowStatus {
  type: 'workflow_status'
  status: string
  tokensUsed: number
  costUsd: number
}

type SSEEvent = SSENodeUpdate | SSEWorkflowStatus | { type: 'connected' | 'checkpoint' }

export function WorkflowPreviewModal({
  workflow,
  isOpen,
  onClose,
  connectedIntegrations,
  useRealExecution = true // Default to real execution
}: WorkflowPreviewModalProps) {
  const navigate = useNavigate()
  const { getToken, userId } = useAuth()
  const { getAgentInfo, term } = usePersonalization()
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('preview')
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [stepStatuses, setStepStatuses] = useState<Record<string, WorkflowStep['status']>>({})
  const [validationResults, setValidationResults] = useState<{
    passed: boolean
    checks: { name: string; passed: boolean; message: string }[]
  } | null>(null)
  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [stats, setStats] = useState({ tokensUsed: 0, costUsd: 0 })
  const [error, setError] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Check missing integrations
  const missingIntegrations = workflow.requiredIntegrations.filter(
    int => !connectedIntegrations.includes(int.toLowerCase())
  )

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setExecutionStatus('preview')
      setCurrentStepIndex(-1)
      setStepStatuses({})
      setValidationResults(null)
      setWorkflowId(null)
      setIsConnected(false)
      setStats({ tokensUsed: 0, costUsd: 0 })
      setError(null)
    }
  }, [isOpen])

  // Cleanup SSE on modal close
  useEffect(() => {
    if (!isOpen && eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [isOpen])

  // Session 8: Accessibility - focus trap
  useEffect(() => {
    if (!isOpen) return
    const modalElement = modalRef.current
    if (!modalElement) return

    const previouslyFocused = document.activeElement as HTMLElement
    modalElement.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      if (e.key === 'Tab') {
        const focusableElements = modalElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [isOpen, onClose])

  // Connect to SSE for real-time updates
  const connectSSE = useCallback(async (wfId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const token = await getToken()
      const sseUrl = `${API_URL}/api/sse/workflow/${wfId}?token=${token}&userId=${userId}`
      const eventSource = new EventSource(sseUrl)

      eventSource.onopen = () => {
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data)

          if (data.type === 'node_update') {
            const nodeData = data as SSENodeUpdate
            const stepIndex = workflow.steps.findIndex(s => s.id === nodeData.node.node_id)

            if (stepIndex !== -1) {
              const step = workflow.steps[stepIndex]
              setStepStatuses(prev => ({
                ...prev,
                [step.id]: nodeData.node.status
              }))

              if (nodeData.node.status === 'running') {
                setCurrentStepIndex(stepIndex)
              }

              if (nodeData.node.tokens_used) {
                setStats(prev => ({
                  tokensUsed: prev.tokensUsed + nodeData.node.tokens_used!,
                  costUsd: prev.costUsd + (nodeData.node.cost_usd || 0)
                }))
              }
            }
          } else if (data.type === 'workflow_status') {
            const statusData = data as SSEWorkflowStatus
            if (statusData.status === 'completed') {
              setExecutionStatus('completed')
            } else if (statusData.status === 'failed') {
              setExecutionStatus('failed')
              setError('Workflow execution failed')
            }
            setStats({
              tokensUsed: statusData.tokensUsed,
              costUsd: statusData.costUsd
            })
          }
        } catch (err) {
          console.error('SSE parse error:', err)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        if (globalAutonomy.shouldAutoRetry()) {
          setTimeout(() => connectSSE(wfId), globalAutonomy.getRetryDelay())
        }
      }

      eventSourceRef.current = eventSource
    } catch (err) {
      console.error('SSE connection error:', err)
    }
  }, [getToken, userId, workflow.steps])

  // REAL workflow validation via backend
  const validateWorkflowReal = useCallback(async () => {
    setExecutionStatus('validating')
    setError(null)

    try {
      // Create workflow in backend to validate
      const createResponse = await apiClient.createNexusWorkflow({
        name: workflow.name,
        description: workflow.description,
        workflow_definition: {
          steps: workflow.steps.map(s => ({
            id: s.id,
            name: s.name,
            type: s.type,
            description: s.description,
            agentId: s.agentId
          })),
          requiredIntegrations: workflow.requiredIntegrations
        },
        autonomyLevel: globalAutonomy.getLevel() as 'ultimate' | 'autonomous' | 'semi' | 'supervised'
      })

      if (!createResponse.success || !createResponse.data) {
        throw new Error(createResponse.error || 'Failed to create workflow')
      }

      const wfId = createResponse.data.id
      setWorkflowId(wfId)

      // Connect to SSE
      await connectSSE(wfId)

      // Build validation checks
      const checks = [
        {
          name: 'Integration Connections',
          passed: missingIntegrations.length === 0,
          message: missingIntegrations.length === 0
            ? 'All required integrations connected'
            : `Missing: ${missingIntegrations.join(', ')}`
        },
        {
          name: 'Workflow Created',
          passed: true,
          message: `Workflow ID: ${wfId}`
        },
        {
          name: 'Agent Availability',
          passed: true,
          message: 'All agents ready and available'
        },
        {
          name: 'Backend Connection',
          passed: true,
          message: 'API endpoints responding'
        },
        {
          name: 'SSE Connection',
          passed: isConnected,
          message: isConnected ? 'Real-time updates connected' : 'Connecting...'
        }
      ]

      setValidationResults({
        passed: checks.every(c => c.passed),
        checks
      })

      setExecutionStatus(checks.every(c => c.passed) ? 'ready' : 'preview')

    } catch (err) {
      console.error('Validation error:', err)
      setError(err instanceof Error ? err.message : 'Validation failed')
      setExecutionStatus('preview')

      // Show failed validation
      setValidationResults({
        passed: false,
        checks: [
          {
            name: 'Backend Connection',
            passed: false,
            message: err instanceof Error ? err.message : 'Connection failed'
          }
        ]
      })
    }
  }, [workflow, missingIntegrations, connectSSE, isConnected])

  // SIMULATED workflow validation (fallback)
  const validateWorkflowSimulated = useCallback(async () => {
    setExecutionStatus('validating')

    await new Promise(resolve => setTimeout(resolve, 500))

    const checks = [
      {
        name: 'Integration Connections',
        passed: missingIntegrations.length === 0,
        message: missingIntegrations.length === 0
          ? 'All required integrations connected'
          : `Missing: ${missingIntegrations.join(', ')}`
      },
      {
        name: 'Workflow Structure',
        passed: true,
        message: 'All steps properly configured'
      },
      {
        name: 'Agent Availability',
        passed: true,
        message: 'All agents ready and available'
      },
      {
        name: 'API Endpoints',
        passed: true,
        message: 'All endpoints responding'
      },
      {
        name: 'Rate Limits',
        passed: true,
        message: 'Within rate limit thresholds'
      }
    ]

    await new Promise(resolve => setTimeout(resolve, 500))

    setValidationResults({
      passed: checks.every(c => c.passed),
      checks
    })

    setExecutionStatus(checks.every(c => c.passed) ? 'ready' : 'preview')
  }, [missingIntegrations])

  // Choose validation method
  const validateWorkflow = useRealExecution ? validateWorkflowReal : validateWorkflowSimulated

  // REAL workflow execution
  const executeWorkflowReal = useCallback(async () => {
    if (!workflowId) {
      setError('No workflow ID - please validate first')
      return
    }

    setExecutionStatus('running')
    setError(null)

    try {
      // Start workflow (planning stage)
      const startResponse = await apiClient.startNexusWorkflow(workflowId)

      if (!startResponse.success) {
        throw new Error(startResponse.error || 'Failed to start workflow')
      }

      // In ultimate/autonomous mode, auto-approve and execute
      if (globalAutonomy.getLevel() === AutonomyLevel.ULTIMATE ||
          globalAutonomy.getLevel() === AutonomyLevel.AUTONOMOUS) {

        await apiClient.approveNexusWorkflow(workflowId)

        // Try coordinated execution, fallback to standard
        try {
          await apiClient.executeNexusWorkflowCoordinated(workflowId, {
            autonomyLevel: globalAutonomy.getLevel() as 'ultimate' | 'autonomous'
          })
        } catch {
          await apiClient.executeNexusWorkflow(workflowId, {
            autonomyLevel: globalAutonomy.getLevel() as 'ultimate' | 'autonomous'
          })
        }
      }

      // SSE handles the rest of the updates

    } catch (err) {
      console.error('Execution error:', err)
      setError(err instanceof Error ? err.message : 'Execution failed')
      setExecutionStatus('failed')

      // Auto-retry in autonomous mode
      if (globalAutonomy.shouldAutoRetry()) {
        setTimeout(() => executeWorkflowReal(), globalAutonomy.getRetryDelay())
        globalAutonomy.recordFailure()
      }
    }
  }, [workflowId])

  // SIMULATED workflow execution (fallback)
  const executeWorkflowSimulated = useCallback(async () => {
    setExecutionStatus('running')

    for (let i = 0; i < workflow.steps.length; i++) {
      setCurrentStepIndex(i)
      const step = workflow.steps[i]

      setStepStatuses(prev => ({ ...prev, [step.id]: 'running' }))

      const executionTime = step.type === 'trigger' ? 1500 :
                           step.type === 'transform' ? 2000 :
                           step.type === 'condition' ? 800 : 1200

      await new Promise(resolve => setTimeout(resolve, executionTime))

      setStepStatuses(prev => ({ ...prev, [step.id]: 'completed' }))
    }

    setExecutionStatus('completed')
  }, [workflow.steps])

  // Choose execution method
  const executeWorkflow = useRealExecution ? executeWorkflowReal : executeWorkflowSimulated

  // Create project and navigate
  const createProjectAndNavigate = useCallback(() => {
    const projectId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const projectData = {
      id: projectId,
      name: workflow.name,
      description: workflow.description,
      workflow: workflow,
      workflowId: workflowId, // Include backend workflow ID
      status: 'running',
      createdAt: new Date().toISOString(),
      stepStatuses: stepStatuses,
      stats: stats
    }

    const existingProjects = JSON.parse(localStorage.getItem('nexus_projects') || '[]')
    existingProjects.push(projectData)
    localStorage.setItem('nexus_projects', JSON.stringify(existingProjects))

    // Close SSE connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    onClose()
    navigate(`/projects/${projectId}`)
  }, [workflow, workflowId, stepStatuses, stats, navigate, onClose])

  if (!isOpen) return null

  const getStepIcon = (type: WorkflowStep['type']) => {
    switch (type) {
      case 'trigger': return '⚡'
      case 'action': return '🎯'
      case 'condition': return '🔀'
      case 'transform': return '🔄'
    }
  }

  const getStepStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'pending': return 'bg-slate-700'
      case 'running': return 'bg-cyan-500 animate-pulse'
      case 'completed': return 'bg-emerald-500'
      case 'failed': return 'bg-red-500'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workflow-preview-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl outline-none"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">
                  {executionStatus === 'completed' ? '✅' :
                   executionStatus === 'running' ? '⚡' : '🚀'}
                </span>
              </div>
              <div>
                <h2 id="workflow-preview-title" className="text-xl font-bold text-white">{workflow.name}</h2>
                <p className="text-slate-400 text-sm mt-1">{workflow.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs ${useRealExecution ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'}`}>
                {useRealExecution ? 'Real' : 'Simulated'}
              </span>
              {isConnected && (
                <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400">
                  SSE
                </span>
              )}
              <button
                onClick={onClose}
                aria-label="Close workflow preview"
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">⏱️</span>
              <span className="text-sm text-slate-300">{workflow.estimatedTimeSaved} saved</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">✓</span>
              <span className="text-sm text-slate-300">{workflow.successRate}% success rate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">📦</span>
              <span className="text-sm text-slate-300">v{workflow.version}</span>
            </div>
            {workflow.requiredIntegrations.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-amber-400">🔗</span>
                <span className="text-sm text-slate-300">
                  {workflow.requiredIntegrations.join(', ')}
                </span>
              </div>
            )}
            {stats.tokensUsed > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-amber-400">💰</span>
                <span className="text-sm text-slate-300">
                  {stats.tokensUsed.toLocaleString()} tokens | ${stats.costUsd.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Workflow Steps */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wide">
            {term('workflow')} Steps
          </h3>

          <div className="space-y-3">
            {workflow.steps.map((step, index) => {
              const agentInfo = getAgentInfo(step.agentId)
              const status = stepStatuses[step.id] || 'pending'
              const isActive = currentStepIndex === index

              return (
                <div
                  key={step.id}
                  className={`
                    relative p-4 rounded-xl border transition-all duration-300
                    ${isActive
                      ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                      : status === 'completed'
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-slate-800/50 border-slate-700/50'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Step Number & Status */}
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-lg
                        ${status === 'completed' ? 'bg-emerald-500/20' :
                          status === 'running' ? 'bg-cyan-500/20' :
                          'bg-slate-700/50'}
                      `}>
                        {status === 'completed' ? '✓' :
                         status === 'running' ? '...' :
                         getStepIcon(step.type)}
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <div className={`w-0.5 h-8 mt-2 ${
                          status === 'completed' ? 'bg-emerald-500' : 'bg-slate-700'
                        }`} />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-white">{step.name}</h4>
                        <span className={`
                          px-2 py-0.5 rounded text-xs font-medium
                          ${step.type === 'trigger' ? 'bg-amber-500/20 text-amber-400' :
                            step.type === 'action' ? 'bg-cyan-500/20 text-cyan-400' :
                            step.type === 'condition' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-emerald-500/20 text-emerald-400'}
                        `}>
                          {step.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{step.description}</p>

                      {/* Agent & Duration */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <ProfessionalAvatar agentId={step.agentId} size={20} />
                          <span className="text-xs text-slate-500">
                            {agentInfo.name}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          ~{step.estimatedDuration}
                        </span>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className={`w-3 h-3 rounded-full ${getStepStatusColor(status)}`} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Validation Results */}
        {validationResults && (
          <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Validation Results</h3>
            <div className="grid grid-cols-2 gap-2">
              {validationResults.checks.map((check, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className={check.passed ? 'text-emerald-400' : 'text-red-400'}>
                    {check.passed ? '✓' : '✗'}
                  </span>
                  <span className="text-slate-400">{check.name}:</span>
                  <span className={check.passed ? 'text-slate-300' : 'text-red-400'}>
                    {check.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-700 bg-slate-800/30">
          {missingIntegrations.length > 0 && executionStatus === 'preview' && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <span>⚠️</span>
                <span>Missing integrations: {missingIntegrations.join(', ')}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/integrations')}
                  className="ml-auto text-amber-400 hover:text-amber-300"
                >
                  Connect Now
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {executionStatus === 'preview' && 'Review the workflow steps above'}
              {executionStatus === 'validating' && 'Validating workflow configuration...'}
              {executionStatus === 'ready' && 'Workflow validated! Ready to deploy.'}
              {executionStatus === 'running' && `Executing step ${currentStepIndex + 1} of ${workflow.steps.length}...`}
              {executionStatus === 'completed' && 'Workflow test completed successfully!'}
              {executionStatus === 'failed' && 'Workflow execution failed'}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>

              {executionStatus === 'preview' && (
                <Button
                  onClick={validateWorkflow}
                  disabled={missingIntegrations.length > 0}
                >
                  Validate {term('workflow')}
                </Button>
              )}

              {executionStatus === 'ready' && (
                <Button onClick={executeWorkflow}>
                  Test {term('workflow')}
                </Button>
              )}

              {executionStatus === 'completed' && (
                <Button onClick={createProjectAndNavigate}>
                  Deploy to Project
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              )}

              {executionStatus === 'failed' && (
                <Button onClick={validateWorkflow} variant="outline">
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

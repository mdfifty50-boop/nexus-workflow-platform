import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useWorkflowExecutions } from '@/hooks/useWorkflows'
import { apiClient } from '@/lib/api-client'
import { WorkflowMap } from '@/components/WorkflowMap'
import { SmartAIChatbot } from '@/components/SmartAIChatbot'
import { ExecutionPanel } from '@/components/workflow/ExecutionPanel'
import type { Workflow } from '@/types/database'
import type { WorkflowExecutionState } from '@/lib/workflow-engine'

export function WorkflowDetail() {
  const { workflowId } = useParams<{ workflowId: string }>()
  const navigate = useNavigate()
  const { executions, loading: executionsLoading, refreshExecutions } = useWorkflowExecutions(workflowId)
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [showWorkflowMap, setShowWorkflowMap] = useState(true)
  const [liveExecutionState, setLiveExecutionState] = useState<WorkflowExecutionState | null>(null)
  const [showExecutionPanel, setShowExecutionPanel] = useState(false)

  useEffect(() => {
    if (workflowId) {
      loadWorkflow()
    }
  }, [workflowId])

  const loadWorkflow = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*, projects(name)')
        .eq('id', workflowId!)
        .single()

      if (error) throw error
      setWorkflow(data)
    } catch (err) {
      console.error('Error loading workflow:', err)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async () => {
    setExecuting(true)
    setShowExecutionPanel(true) // Show execution panel when starting

    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflowId!,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Initialize live execution state
      setLiveExecutionState({
        workflowId: workflowId!,
        executionId: data.id,
        status: 'running',
        steps: [
          {
            nodeId: 'init',
            status: 'running',
            input: null,
            output: null,
            startTime: new Date(),
          }
        ],
        variables: {},
        totalTokens: 0,
        totalCost: 0,
      })

      // Update execution count
      await supabase
        .from('workflows')
        .update({
          execution_count: (workflow?.execution_count || 0) + 1,
          last_executed_at: new Date().toISOString(),
        })
        .eq('id', workflowId!)

      // Get workflow prompt and model from config
      const promptText = typeof workflow?.config?.prompt === 'string'
        ? workflow.config.prompt
        : workflow?.description || 'Execute workflow task'
      const modelName = (typeof workflow?.config?.model === 'string'
        ? workflow.config.model
        : 'claude-opus-4-6-20250115') as 'claude-3-5-haiku-20241022' | 'claude-opus-4-6-20250115' | 'claude-opus-4-6-20250115'

      // Build Nexus-style system prompt
      const workflowType = workflow?.workflow_type || 'Simple'
      const systemPrompt = workflowType === 'BMAD'
        ? `You are an AI assistant executing a BMAD (Business, Modular, Actionable, Data-driven) workflow.

BMAD Methodology Guidelines:
- **Business-focused**: Align all outputs with business objectives
- **Modular**: Break complex tasks into discrete, reusable components
- **Actionable**: Provide clear, executable steps
- **Data-driven**: Base decisions on concrete data and metrics

Please execute the workflow and provide:
1. Analysis of business context
2. Modular breakdown of the task
3. Actionable steps with expected outcomes
4. Data points or metrics to track success`
        : undefined

      // Update execution state - AI processing
      setLiveExecutionState(prev => prev ? {
        ...prev,
        steps: [
          ...prev.steps.slice(0, -1),
          { ...prev.steps[0], status: 'completed', endTime: new Date(), output: 'Initialized' },
          {
            nodeId: 'ai-execution',
            status: 'running',
            input: promptText,
            output: null,
            startTime: new Date(),
          }
        ],
        currentNodeId: 'ai-execution',
      } : null)

      // Execute through secure backend API
      const result = await apiClient.chat({
        messages: [{ role: 'user', content: promptText }],
        systemPrompt,
        model: modelName,
        maxTokens: 4096,
      })

      // Update execution state - completion
      setLiveExecutionState(prev => prev ? {
        ...prev,
        status: result.success ? 'completed' : 'failed',
        steps: [
          ...prev.steps.slice(0, -1),
          {
            nodeId: 'ai-execution',
            status: result.success ? 'completed' : 'failed',
            input: promptText,
            output: result.output,
            error: result.error,
            startTime: prev.steps[1].startTime,
            endTime: new Date(),
            tokensUsed: result.tokensUsed || result.usage?.totalTokens || 0,
            costUSD: calculateCost(modelName, result.inputTokens || result.usage?.inputTokens || 0, result.outputTokens || result.usage?.outputTokens || 0),
          }
        ],
        totalTokens: result.tokensUsed || result.usage?.totalTokens || 0,
        totalCost: calculateCost(modelName, result.inputTokens || result.usage?.inputTokens || 0, result.outputTokens || result.usage?.outputTokens || 0),
      } : null)

      await supabase
        .from('workflow_executions')
        .update({
          status: result.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          execution_data: {
            output: result.output,
            model: result.model,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
          },
          token_usage: result.tokensUsed || result.usage?.totalTokens || 0,
          cost_usd: calculateCost(modelName, result.inputTokens || result.usage?.inputTokens || 0, result.outputTokens || result.usage?.outputTokens || 0),
          error_message: result.error || null,
        })
        .eq('id', data.id)

      refreshExecutions()
      loadWorkflow()
      setExecuting(false)

      // Navigate to results page to show AI output after a delay
      setTimeout(() => {
        navigate(`/execution/${data.id}`)
      }, 2000)
    } catch (err: any) {
      console.error('Error executing workflow:', err)

      // Update execution state with error
      setLiveExecutionState(prev => prev ? {
        ...prev,
        status: 'failed',
        steps: prev.steps.map((step, i) =>
          i === prev.steps.length - 1
            ? { ...step, status: 'failed', error: err.message, endTime: new Date() }
            : step
        ),
      } : null)

      setExecuting(false)
    }
  }

  // Calculate cost based on Claude pricing
  const calculateCost = (model: string, inputTokens: number, outputTokens: number): number => {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-opus-4-5-20251124': { input: 15.0, output: 75.0 },
      'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
      'claude-3-5-haiku-20241022': { input: 1.0, output: 5.0 },
    }

    const modelPricing = pricing[model] || pricing['claude-3-5-sonnet-20241022']
    const inputCost = (inputTokens / 1_000_000) * modelPricing.input
    const outputCost = (outputTokens / 1_000_000) * modelPricing.output

    return Number((inputCost + outputCost).toFixed(6))
  }

  const handleToggleStatus = async () => {
    const newStatus = workflow?.status === 'active' ? 'paused' : 'active'
    try {
      await supabase
        .from('workflows')
        .update({ status: newStatus })
        .eq('id', workflowId!)

      setWorkflow(workflow ? { ...workflow, status: newStatus } : null)
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    )
  }

  if (!workflow) return null

  const projectData = (workflow as any).projects
  const isBmadWorkflow = workflow.workflow_type === 'BMAD'

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/projects/${workflow.project_id}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">{workflow.name}</h1>
              <p className="text-sm text-muted-foreground">{projectData?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/workflows/${workflowId}/builder`)}
              className="px-4 py-2 text-sm bg-gradient-to-r from-secondary to-primary text-white rounded-md hover:opacity-90 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
              Visual Builder
            </button>
            <button
              onClick={handleToggleStatus}
              className={`px-4 py-2 text-sm rounded-md ${
                workflow.status === 'active'
                  ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20'
                  : 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20'
              }`}
            >
              {workflow.status === 'active' ? 'Pause' : 'Activate'}
            </button>
            <button
              onClick={handleExecute}
              disabled={executing || workflow.status !== 'active'}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {executing ? 'Executing...' : 'Execute Now'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
              <p className="text-2xl font-bold capitalize">{workflow.status}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Executions</h3>
              <p className="text-2xl font-bold">{workflow.execution_count || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Workflow Type</h3>
              <p className="text-2xl font-bold capitalize">{workflow.workflow_type}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Last Executed</h3>
              <p className="text-sm font-medium">
                {workflow.last_executed_at
                  ? new Date(workflow.last_executed_at).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>

          {/* Live Execution Panel */}
          {showExecutionPanel && liveExecutionState && (
            <ExecutionPanel
              steps={liveExecutionState.steps}
              currentNodeId={liveExecutionState.currentNodeId}
              totalTokens={liveExecutionState.totalTokens}
              totalCost={liveExecutionState.totalCost}
              status={liveExecutionState.status}
              className="mb-6"
            />
          )}

          {/* Workflow Map Visualization (Epic 5) */}
          {isBmadWorkflow && workflowId ? (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Workflow Map</h2>
                <button
                  onClick={() => setShowWorkflowMap(!showWorkflowMap)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {showWorkflowMap ? 'Hide' : 'Show'}
                </button>
              </div>
              {showWorkflowMap ? (
                <WorkflowMap
                  workflowId={workflowId}
                  showControls={true}
                  autoRefresh={workflow.status === 'building' || workflow.status === 'orchestrating'}
                />
              ) : null}
            </div>
          ) : null}

          {/* BMAD Execution Plan */}
          {workflow.config && 'executionPlan' in workflow.config && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Execution Plan</h2>
              <div className="space-y-3">
                {((workflow.config as any).executionPlan?.tasks || []).map((task: any, idx: number) => (
                  <div
                    key={task.id || idx}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{task.name}</p>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Type: {task.type}</span>
                        {task.integrationId && <span>Integration: {task.integrationId}</span>}
                        <span>Est. {task.estimatedTokens} tokens</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {(workflow.config as any).executionPlan?.totalEstimatedCostUSD ? (
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Total Cost:</span>
                  <span className="font-bold">
                    ${((workflow.config as any).executionPlan.totalEstimatedCostUSD || 0).toFixed(4)}
                  </span>
                </div>
              ) : null}
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Executions</h2>
            {executionsLoading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading executions...</p>
              </div>
            ) : executions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No executions yet. Click "Execute Now" to run this workflow.
              </div>
            ) : (
              <div className="space-y-3">
                {executions.map((execution) => (
                  <div
                    key={execution.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${
                          execution.status === 'completed'
                            ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                            : execution.status === 'running'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                            : execution.status === 'failed'
                            ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                            : 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {execution.status}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(execution.created_at).toLocaleString()}
                        </p>
                        {execution.completed_at && (
                          <p className="text-xs text-muted-foreground">
                            Duration:{' '}
                            {Math.round(
                              (new Date(execution.completed_at).getTime() -
                                new Date(execution.started_at || execution.created_at).getTime()) /
                                1000
                            )}
                            s
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      {execution.token_usage > 0 && (
                        <p className="text-muted-foreground">
                          {execution.token_usage.toLocaleString()} tokens
                        </p>
                      )}
                      {execution.cost_usd > 0 && (
                        <p className="font-medium">${execution.cost_usd}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Workflow Configuration</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p className="text-sm">{workflow.description || 'No description provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Configuration</h3>
                <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-64">
                  {JSON.stringify(workflow.config, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Smart AI Chatbot for workflow assistance */}
      <SmartAIChatbot position="bottom-right" />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { WorkflowCanvasLegacy as WorkflowCanvas } from '@/components/WorkflowCanvasLegacy'
import type { WorkflowDefinition, WorkflowExecutionState } from '@/lib/workflow-engine'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { SmartAIChatbot } from '@/components/SmartAIChatbot'
import { apiClient, type WorkflowStep } from '@/lib/api-client'
import { useToast } from '@/contexts/ToastContext'

export function WorkflowBuilder() {
  const { workflowId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [workflow, setWorkflow] = useState<any>(null)
  const [definition, setDefinition] = useState<WorkflowDefinition | null>(null)
  const [executionState, setExecutionState] = useState<WorkflowExecutionState | null>(null)
  const [executing, setExecuting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [executionError, setExecutionError] = useState<string | null>(null)

  useEffect(() => {
    if (workflowId) {
      loadWorkflow()
    }
  }, [workflowId])

  const loadWorkflow = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId!)
        .single()

      if (error) throw error

      setWorkflow(data)

      // Load or create default definition
      if (data.config?.definition) {
        setDefinition(data.config.definition)
      } else {
        // Create default workflow
        const defaultDef: WorkflowDefinition = {
          nodes: [
            {
              id: 'start',
              type: 'start',
              label: 'Start',
              config: {},
              position: { x: 100, y: 200 },
            },
            {
              id: 'agent1',
              type: 'ai-agent',
              label: 'AI Agent',
              config: {
                prompt: 'Analyze the input and provide insights',
                model: 'claude-3-5-sonnet-20241022',
              },
              position: { x: 400, y: 200 },
            },
            {
              id: 'end',
              type: 'end',
              label: 'End',
              config: {},
              position: { x: 700, y: 200 },
            },
          ],
          edges: [
            { id: 'e1', source: 'start', target: 'agent1' },
            { id: 'e2', source: 'agent1', target: 'end' },
          ],
        }
        setDefinition(defaultDef)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading workflow:', error)
      navigate('/dashboard')
    }
  }

  const handleSave = async (newDefinition: WorkflowDefinition) => {
    try {
      await supabase
        .from('workflows')
        .update({
          config: {
            ...workflow.config,
            definition: newDefinition,
          },
        })
        .eq('id', workflowId!)

      setDefinition(newDefinition)
      toast.success('Workflow saved successfully!')
    } catch (error) {
      console.error('Error saving workflow:', error)
      toast.error('Failed to save workflow. Please try again.')
    }
  }

  // Convert workflow definition nodes to API-compatible steps
  const convertToAPISteps = (def: WorkflowDefinition): WorkflowStep[] => {
    return def.nodes
      .filter(node => node.type !== 'start' && node.type !== 'end')
      .map(node => ({
        id: node.id,
        type: node.type === 'ai-agent' ? 'ai-agent' :
              node.type === 'api-call' ? 'http' :
              node.type === 'data-transform' ? 'data-transform' :
              node.type === 'condition' ? 'condition' : 'ai-agent',
        label: node.label,
        config: {
          prompt: node.config.prompt,
          model: node.config.model,
          url: node.config.apiUrl,
          transformCode: node.config.transformCode,
          condition: node.config.condition,
        },
      }))
  }

  const handleExecute = async () => {
    if (!definition || !workflowId) return

    setExecuting(true)
    setExecutionError(null)

    // UX IMPROVEMENT: Show toast for user feedback
    toast.info('Starting workflow execution...')

    try {
      // Create execution record
      const { data: execution, error: execError } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflowId,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (execError) throw execError

      // Initialize execution state for UI
      const initialState: WorkflowExecutionState = {
        workflowId,
        executionId: execution.id,
        status: 'running',
        steps: definition.nodes.map(node => ({
          nodeId: node.id,
          status: 'pending',
          input: null,
          output: null,
        })),
        variables: {},
        totalTokens: 0,
        totalCost: 0,
      }
      setExecutionState(initialState)

      // Convert workflow nodes to API steps
      const apiSteps = convertToAPISteps(definition)

      // Execute through secure backend API
      const result = await apiClient.executeWorkflow({
        workflowId,
        executionId: execution.id,
        steps: apiSteps,
        input: {},
        variables: {},
      })

      // Update execution state with results
      const finalState: WorkflowExecutionState = {
        ...initialState,
        status: result.success ? 'completed' : 'failed',
        steps: definition.nodes.map(node => {
          const stepResult = result.results.find(r => r.stepId === node.id)
          return {
            nodeId: node.id,
            status: stepResult ? (stepResult.status === 'success' ? 'completed' : 'failed') : 'completed',
            input: null,
            output: stepResult?.output || null,
            tokensUsed: stepResult?.tokensUsed,
            costUSD: stepResult?.costUSD,
            error: stepResult?.error,
          }
        }),
        totalTokens: result.totalTokens,
        totalCost: result.totalCost,
      }
      setExecutionState(finalState)

      // Update execution record
      await supabase
        .from('workflow_executions')
        .update({
          status: result.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          token_usage: result.totalTokens,
          cost_usd: result.totalCost,
          execution_data: {
            results: result.results,
            finalOutput: result.finalOutput,
          },
          error_message: result.error || null,
        })
        .eq('id', execution.id)

      // Update workflow stats
      await supabase
        .from('workflows')
        .update({
          execution_count: (workflow.execution_count || 0) + 1,
          last_executed_at: new Date().toISOString(),
        })
        .eq('id', workflowId)

      setExecuting(false)

      // UX IMPROVEMENT: Success feedback
      if (result.success) {
        toast.success('Workflow executed successfully!')
      } else {
        toast.error('Workflow execution failed')
      }

      // Navigate to results after brief delay
      setTimeout(() => {
        navigate(`/execution/${execution.id}`)
      }, 1500)
    } catch (error: any) {
      console.error('Execution error:', error)
      const errorMsg = error.message || 'Workflow execution failed'
      setExecutionError(errorMsg)
      setExecuting(false)

      // UX IMPROVEMENT: Error feedback
      toast.error(errorMsg)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header Skeleton */}
        <header className="border-b border-border">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-6 w-16 bg-muted-foreground/20 rounded animate-pulse" />
                <div>
                  <div className="h-7 w-48 bg-muted-foreground/20 rounded mb-2 animate-pulse" />
                  <div className="h-4 w-32 bg-muted-foreground/20 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-10 w-40 bg-primary/20 rounded-md animate-pulse" />
            </div>
          </div>
        </header>
        {/* Canvas Skeleton */}
        <div className="flex-1 relative p-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-transparent rounded-full animate-spin"
                  style={{ borderTopColor: 'rgb(6, 182, 212)', borderRightColor: 'rgb(168, 85, 247)', animationDuration: '1s' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center animate-pulse">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-slate-400 animate-pulse">Loading workflow builder...</p>
              {/* Placeholder nodes */}
              <div className="absolute inset-6 pointer-events-none hidden md:block">
                <div className="absolute left-[10%] top-1/2 -translate-y-1/2 w-32 h-16 bg-slate-800/30 rounded-lg border border-slate-700/30 animate-pulse" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-20 bg-slate-800/30 rounded-lg border border-slate-700/30 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-32 h-16 bg-slate-800/30 rounded-lg border border-slate-700/30 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border glass">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Workflow Builder</h1>
                <p className="text-sm text-muted-foreground">{workflow?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExecute}
                disabled={executing}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                {executing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Executing...
                  </>
                ) : (
                  <>▶ Execute Workflow</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 relative">
        {definition && (
          <WorkflowCanvas
            initialDefinition={definition}
            executionState={executionState}
            onSave={handleSave}
            readOnly={executing}
          />
        )}
      </div>

      {executionError && (
        <div className="border-t border-red-500/50 bg-red-500/10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Execution Failed</p>
                <p className="text-sm opacity-80">{executionError}</p>
              </div>
              <button
                onClick={() => setExecutionError(null)}
                className="ml-auto text-red-500 hover:text-red-400"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {executionState && !executionError && (
        <div className="border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Status</div>
                <div className={`font-bold capitalize ${
                  executionState.status === 'completed' ? 'text-green-600' :
                  executionState.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {executionState.status}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Completed Steps</div>
                <div className="font-bold text-green-600">
                  {executionState.steps.filter(s => s.status === 'completed').length} / {executionState.steps.length}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Tokens</div>
                <div className="font-bold">{executionState.totalTokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Cost</div>
                <div className="font-bold text-green-600">${executionState.totalCost.toFixed(4)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart AI Chatbot for workflow assistance */}
      <SmartAIChatbot position="bottom-right" />
    </div>
  )
}

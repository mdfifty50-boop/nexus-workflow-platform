import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import type { WorkflowExecution } from '@/types/database'

export function WorkflowExecutionResults() {
  const { executionId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [execution, setExecution] = useState<WorkflowExecution | null>(null)
  const [loading, setLoading] = useState(true)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (executionId && user) {
      loadExecution()

      // Poll for updates every 2 seconds if still running
      const interval = setInterval(() => {
        loadExecution()
      }, 2000)

      setPollingInterval(interval)

      return () => {
        if (interval) clearInterval(interval)
      }
    }
    return undefined
  }, [executionId, user])

  const loadExecution = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('id', executionId!)
        .single()

      if (error) throw error

      setExecution(data)

      // Stop polling if execution is complete
      if (data.status === 'completed' || data.status === 'failed') {
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading execution:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading execution...</p>
        </div>
      </div>
    )
  }

  if (!execution) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Execution not found</h2>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500'
      case 'failed': return 'text-destructive'
      case 'running': return 'text-primary'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'failed':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'running':
        return <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const rawOutput = execution.execution_data?.output
  const output = typeof rawOutput === 'string'
    ? rawOutput
    : rawOutput
      ? JSON.stringify(rawOutput, null, 2)
      : 'No output available'
  const configured = execution.execution_data?.configured || false

  return (
    <div className="min-h-screen bg-background">
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
              <h1 className="text-2xl font-bold">Workflow Execution</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Status Card */}
        <div className="glass rounded-xl p-8 border-2 border-border mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={getStatusColor(execution.status)}>
              {getStatusIcon(execution.status)}
            </div>
            <div>
              <h2 className="text-2xl font-bold capitalize">{execution.status}</h2>
              <p className="text-muted-foreground text-sm">
                Started {new Date(execution.started_at || execution.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Tokens Used</p>
              <p className="text-2xl font-bold gradient-text">
                {execution.token_usage?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Cost</p>
              <p className="text-2xl font-bold text-green-500">
                ${execution.cost_usd?.toFixed(4) || '0.0000'}
              </p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Duration</p>
              <p className="text-2xl font-bold text-primary">
                {execution.completed_at
                  ? `${Math.round((new Date(execution.completed_at).getTime() - new Date(execution.started_at || execution.created_at).getTime()) / 1000)}s`
                  : 'Running...'}
              </p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Mode</p>
              <p className="text-lg font-bold">
                {configured ? '🤖 Real AI' : '🎭 Simulation'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {execution.error_message && (
          <div className="p-6 bg-destructive/10 border-2 border-destructive/40 rounded-lg mb-6">
            <h3 className="font-bold text-destructive mb-2">Error</h3>
            <p className="text-sm text-destructive-foreground">{execution.error_message}</p>
          </div>
        )}

        {/* AI Output */}
        <div className="glass rounded-xl p-6 border-2 border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">AI Output</h3>
            {!configured && (
              <span className="text-xs bg-secondary/20 px-3 py-1 rounded-full">
                Simulation Mode
              </span>
            )}
          </div>

          <div className="bg-background/50 rounded-lg p-6 border border-border">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
              {output}
            </pre>
          </div>

          {!configured && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm">
                <strong>💡 Enable Real AI:</strong> Add your Anthropic API key to environment variables
                to get real Claude AI responses instead of simulations.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button onClick={() => navigate(-1)} variant="outline">
            ← Back to Workflow
          </Button>
          {execution.status === 'completed' && (
            <Button onClick={() => window.location.reload()}>
              Run Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

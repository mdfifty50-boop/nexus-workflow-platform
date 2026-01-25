import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Workflow, WorkflowExecution } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'
import { nexusService } from '@/lib/nexus-service'

export function useWorkflows(projectId?: string) {
  const { user } = useAuth()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && projectId) {
      loadWorkflows()
    }
  }, [user, projectId])

  const loadWorkflows = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false })

      if (error) throw error

      setWorkflows(data || [])
    } catch (err) {
      console.error('Error loading workflows:', err)
      setError('Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  const createWorkflow = async (
    name: string,
    workflowType: string,
    description?: string,
    config?: Record<string, unknown>
  ) => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          name,
          description,
          workflow_type: workflowType,
          project_id: projectId!,
          status: 'draft',
          config: config || {},
        })
        .select()
        .single()

      if (error) throw error

      setWorkflows([data, ...workflows])
      return { data, error: null }
    } catch (err) {
      console.error('Error creating workflow:', err)
      return { data: null, error: 'Failed to create workflow' }
    }
  }

  const updateWorkflow = async (
    id: string,
    updates: Partial<Pick<Workflow, 'name' | 'description' | 'status' | 'config'>>
  ) => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setWorkflows(workflows.map((w) => (w.id === id ? data : w)))
      return { data, error: null }
    } catch (err) {
      console.error('Error updating workflow:', err)
      return { data: null, error: 'Failed to update workflow' }
    }
  }

  const deleteWorkflow = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id)

      if (error) throw error

      setWorkflows(workflows.filter((w) => w.id !== id))
      return { error: null }
    } catch (err) {
      console.error('Error deleting workflow:', err)
      return { error: 'Failed to delete workflow' }
    }
  }

  const executeWorkflow = async (workflowId: string) => {
    try {
      // Get workflow details
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single()

      if (workflowError) throw workflowError

      // Create execution record
      const { data: execution, error: executionError } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflowId,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (executionError) throw executionError

      // Execute workflow asynchronously
      setTimeout(async () => {
        try {
          const result = await nexusService.executeWorkflow({
            type: workflow.workflow_type as any,
            prompt: workflow.config?.prompt || workflow.description || 'Execute workflow',
            model: workflow.config?.model,
            maxTokens: workflow.config?.maxTokens,
            temperature: workflow.config?.temperature,
          })

          // Update execution with results
          await supabase
            .from('workflow_executions')
            .update({
              status: result.success ? 'completed' : 'failed',
              completed_at: new Date().toISOString(),
              execution_data: {
                output: result.output,
                configured: nexusService.isConfigured(),
              },
              token_usage: result.tokensUsed,
              cost_usd: result.costUSD,
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
        } catch (err) {
          console.error('Execution error:', err)
          await supabase
            .from('workflow_executions')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: err instanceof Error ? err.message : 'Unknown error',
            })
            .eq('id', execution.id)
        }
      }, 100)

      return { data: execution, error: null }
    } catch (err) {
      console.error('Error executing workflow:', err)
      return { data: null, error: 'Failed to execute workflow' }
    }
  }

  return {
    workflows,
    loading,
    error,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    refreshWorkflows: loadWorkflows,
  }
}

export function useWorkflowExecutions(workflowId?: string) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (workflowId) {
      loadExecutions()
    }
  }, [workflowId])

  const loadExecutions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId!)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setExecutions(data || [])
    } catch (err) {
      console.error('Error loading executions:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    executions,
    loading,
    refreshExecutions: loadExecutions,
  }
}

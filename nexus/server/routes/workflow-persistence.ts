/**
 * Workflow Persistence API Routes
 *
 * Plan B: User Account System - Workflow History Persistence
 *
 * Handles:
 * - GET /status - Check cloud persistence status
 * - GET /workflows - Get user's workflows
 * - POST /workflows - Create/update workflow
 * - DELETE /workflows/:id - Delete workflow
 * - POST /workflows/:id/archive - Archive workflow
 * - POST /workflows/:id/executed - Increment execution count
 * - GET /executions - Get execution history
 * - POST /executions - Record execution
 * - PATCH /executions/:id - Update execution
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

// ============================================================================
// Supabase Client Setup
// ============================================================================

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create client with service_role key (bypasses RLS)
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user ID from request headers
 * In dev mode without Clerk, returns 'dev-user-123'
 */
function getUserId(req: Request): string {
  // Check for Clerk user ID in header (set by frontend)
  const clerkUserId = req.headers['x-clerk-user-id'] as string
  if (clerkUserId) {
    return clerkUserId
  }

  // Dev mode fallback
  console.log('[WorkflowPersistence] No Clerk user ID, using dev user')
  return 'dev-user-123'
}

/**
 * Convert database row to API format
 */
function dbToApi(row: any): any {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    workflowType: row.workflow_type,
    status: row.status,
    triggerConfig: row.trigger_config,
    actionConfigs: row.action_configs || [],
    requiredIntegrations: row.required_integrations || [],
    estimatedTimeSaved: row.estimated_time_saved,
    executionCount: row.execution_count || 0,
    lastExecutedAt: row.last_executed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Convert API format to database row
 */
function apiToDb(workflow: any): any {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description || null,
    workflow_type: workflow.workflowType || 'chat_generated',
    status: workflow.status || 'draft',
    trigger_config: workflow.triggerConfig || null,
    action_configs: workflow.actionConfigs || [],
    required_integrations: workflow.requiredIntegrations || [],
    estimated_time_saved: workflow.estimatedTimeSaved || null,
    execution_count: workflow.executionCount || 0,
    last_executed_at: workflow.lastExecutedAt || null,
  }
}

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /status - Check cloud persistence status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    supabaseConfigured: !!supabase,
    cloudEnabled: !!supabase,
  })
})

/**
 * GET /workflows - Get user's workflows
 */
router.get('/workflows', async (req: Request, res: Response) => {
  const userId = getUserId(req)

  if (!supabase) {
    return res.json({
      workflows: [],
      source: 'localStorage',
      message: 'Supabase not configured',
    })
  }

  try {
    const { data, error } = await supabase
      .from('user_workflows')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[WorkflowPersistence] Supabase query error:', error)
      return res.json({
        workflows: [],
        source: 'localStorage',
        error: error.message,
      })
    }

    res.json({
      workflows: (data || []).map(dbToApi),
      source: 'supabase',
    })
  } catch (err: any) {
    console.error('[WorkflowPersistence] Error fetching workflows:', err)
    res.json({
      workflows: [],
      source: 'localStorage',
      error: err.message,
    })
  }
})

/**
 * POST /workflows - Create or update workflow
 */
router.post('/workflows', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const { workflow } = req.body

  if (!workflow) {
    return res.status(400).json({ error: 'Workflow is required' })
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  try {
    const dbRow = {
      ...apiToDb(workflow),
      clerk_user_id: userId,
    }

    const { data, error } = await supabase
      .from('user_workflows')
      .upsert(dbRow, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      console.error('[WorkflowPersistence] Supabase upsert error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({
      success: true,
      workflow: dbToApi(data),
    })
  } catch (err: any) {
    console.error('[WorkflowPersistence] Error saving workflow:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * DELETE /workflows/:id - Delete workflow
 */
router.delete('/workflows/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const { id } = req.params

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  try {
    const { error } = await supabase
      .from('user_workflows')
      .delete()
      .eq('id', id)
      .eq('clerk_user_id', userId)

    if (error) {
      console.error('[WorkflowPersistence] Supabase delete error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({ success: true })
  } catch (err: any) {
    console.error('[WorkflowPersistence] Error deleting workflow:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /workflows/:id/archive - Archive workflow
 */
router.post('/workflows/:id/archive', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const { id } = req.params

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  try {
    const { error } = await supabase
      .from('user_workflows')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clerk_user_id', userId)

    if (error) {
      console.error('[WorkflowPersistence] Supabase archive error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({ success: true })
  } catch (err: any) {
    console.error('[WorkflowPersistence] Error archiving workflow:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /workflows/:id/executed - Increment execution count
 */
router.post('/workflows/:id/executed', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const { id } = req.params

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  try {
    // First get current count
    const { data: current, error: fetchError } = await supabase
      .from('user_workflows')
      .select('execution_count')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single()

    if (fetchError) {
      console.error('[WorkflowPersistence] Supabase fetch error:', fetchError)
      return res.status(500).json({ error: fetchError.message })
    }

    // Increment
    const { error: updateError } = await supabase
      .from('user_workflows')
      .update({
        execution_count: (current?.execution_count || 0) + 1,
        last_executed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('clerk_user_id', userId)

    if (updateError) {
      console.error('[WorkflowPersistence] Supabase update error:', updateError)
      return res.status(500).json({ error: updateError.message })
    }

    res.json({ success: true })
  } catch (err: any) {
    console.error('[WorkflowPersistence] Error updating execution count:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /executions - Get execution history for a workflow
 */
router.get('/executions', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const workflowId = req.query.workflowId as string

  if (!supabase) {
    return res.json({
      executions: [],
      source: 'localStorage',
    })
  }

  try {
    let query = supabase
      .from('user_workflow_executions')
      .select(`
        *,
        user_workflows!inner(clerk_user_id)
      `)
      .eq('user_workflows.clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (workflowId) {
      query = query.eq('workflow_id', workflowId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[WorkflowPersistence] Supabase query error:', error)
      return res.json({
        executions: [],
        source: 'localStorage',
        error: error.message,
      })
    }

    res.json({
      executions: data || [],
      source: 'supabase',
    })
  } catch (err: any) {
    console.error('[WorkflowPersistence] Error fetching executions:', err)
    res.json({
      executions: [],
      source: 'localStorage',
      error: err.message,
    })
  }
})

/**
 * POST /executions - Record execution
 */
router.post('/executions', async (req: Request, res: Response) => {
  const { execution } = req.body

  if (!execution) {
    return res.status(400).json({ error: 'Execution is required' })
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  try {
    const { data, error } = await supabase
      .from('user_workflow_executions')
      .insert({
        id: execution.id,
        workflow_id: execution.workflowId,
        status: execution.status || 'pending',
        started_at: execution.startedAt || null,
        completed_at: execution.completedAt || null,
        error_message: execution.errorMessage || null,
        execution_data: execution.executionData || {},
        token_usage: execution.tokenUsage || 0,
        cost_usd: execution.costUsd || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('[WorkflowPersistence] Supabase insert error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({
      success: true,
      execution: data,
    })
  } catch (err: any) {
    console.error('[WorkflowPersistence] Error recording execution:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * PATCH /executions/:id - Update execution
 */
router.patch('/executions/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const { updates } = req.body

  if (!updates) {
    return res.status(400).json({ error: 'Updates are required' })
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  try {
    // Map API field names to DB field names
    const dbUpdates: Record<string, any> = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt
    if (updates.errorMessage !== undefined) dbUpdates.error_message = updates.errorMessage
    if (updates.executionData !== undefined) dbUpdates.execution_data = updates.executionData
    if (updates.tokenUsage !== undefined) dbUpdates.token_usage = updates.tokenUsage
    if (updates.costUsd !== undefined) dbUpdates.cost_usd = updates.costUsd

    const { error } = await supabase
      .from('user_workflow_executions')
      .update(dbUpdates)
      .eq('id', id)

    if (error) {
      console.error('[WorkflowPersistence] Supabase update error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({ success: true })
  } catch (err: any) {
    console.error('[WorkflowPersistence] Error updating execution:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router

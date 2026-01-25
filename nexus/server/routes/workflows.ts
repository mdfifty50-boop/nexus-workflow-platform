import { Router, Request, Response } from 'express'
import { workflowService } from '../services/workflowService.js'
import { bmadOrchestrator } from '../services/bmadOrchestrator.js'
import { composioService } from '../services/ComposioService.js'
import { broadcastWorkflowUpdate } from './sse.js'

const router = Router()

// ============================================================================
// Move 6.6: TOOL_SLUGS mapping for plan validation (subset for validation only)
// Full mapping in RubeExecutionBridge.ts
// ============================================================================
const TOOL_SLUGS: Record<string, Record<string, string>> = {
  gmail: { send: 'GMAIL_SEND_EMAIL', fetch: 'GMAIL_FETCH_EMAILS', default: 'GMAIL_SEND_EMAIL' },
  slack: { send: 'SLACK_SEND_MESSAGE', message: 'SLACK_SEND_MESSAGE', default: 'SLACK_SEND_MESSAGE' },
  googlesheets: { read: 'GOOGLESHEETS_BATCH_GET', write: 'GOOGLESHEETS_BATCH_UPDATE', default: 'GOOGLESHEETS_BATCH_GET' },
  sheets: { read: 'GOOGLESHEETS_BATCH_GET', append: 'GOOGLESHEETS_BATCH_UPDATE', default: 'GOOGLESHEETS_BATCH_GET' },
  googlecalendar: { create: 'GOOGLECALENDAR_CREATE_EVENT', list: 'GOOGLECALENDAR_EVENTS_LIST', default: 'GOOGLECALENDAR_CREATE_EVENT' },
  calendar: { create: 'GOOGLECALENDAR_CREATE_EVENT', list: 'GOOGLECALENDAR_EVENTS_LIST', default: 'GOOGLECALENDAR_CREATE_EVENT' },
  github: { issue: 'GITHUB_CREATE_ISSUE', create: 'GITHUB_CREATE_ISSUE', list: 'GITHUB_LIST_REPOSITORY_ISSUES', default: 'GITHUB_CREATE_ISSUE' },
  notion: { create: 'NOTION_CREATE_PAGE', page: 'NOTION_CREATE_PAGE', update: 'NOTION_UPDATE_PAGE', default: 'NOTION_CREATE_PAGE' },
  discord: { send: 'DISCORD_SEND_MESSAGE', message: 'DISCORD_SEND_MESSAGE', default: 'DISCORD_SEND_MESSAGE' },
  trello: { card: 'TRELLO_CREATE_CARD', create: 'TRELLO_CREATE_CARD', default: 'TRELLO_CREATE_CARD' },
  stripe: { customer: 'STRIPE_CREATE_CUSTOMER', charge: 'STRIPE_CREATE_CHARGE', default: 'STRIPE_CREATE_CUSTOMER' },
  twitter: { post: 'TWITTER_CREATE_TWEET', tweet: 'TWITTER_CREATE_TWEET', default: 'TWITTER_CREATE_TWEET' },
  whatsapp: { send: 'WHATSAPP_SEND_MESSAGE', message: 'WHATSAPP_SEND_MESSAGE', default: 'WHATSAPP_SEND_MESSAGE' },
  hubspot: { contact: 'HUBSPOT_CREATE_CONTACT', create: 'HUBSPOT_CREATE_CONTACT', default: 'HUBSPOT_CREATE_CONTACT' },
  linear: { create: 'LINEAR_CREATE_ISSUE', issue: 'LINEAR_CREATE_ISSUE', default: 'LINEAR_CREATE_ISSUE' },
  jira: { create: 'JIRA_CREATE_ISSUE', issue: 'JIRA_CREATE_ISSUE', default: 'JIRA_CREATE_ISSUE' },
}

/**
 * Validate and normalize a tool slug for a task
 * Returns { valid: true, normalizedSlug } or { valid: false, reason }
 */
function validateAndNormalizeToolSlug(task: any): { valid: boolean; normalizedSlug?: string; reason?: string } {
  const toolSlug = task.config?.toolSlug
  const integration = task.config?.integration?.toLowerCase()

  // If toolSlug already looks valid (uppercase with underscores), accept it
  if (toolSlug && /^[A-Z]+_[A-Z_]+$/.test(toolSlug)) {
    return { valid: true, normalizedSlug: toolSlug }
  }

  // Try to resolve from integration + action
  if (integration && TOOL_SLUGS[integration]) {
    const action = task.config?.action?.toLowerCase() || 'default'
    const resolved = TOOL_SLUGS[integration][action] || TOOL_SLUGS[integration].default
    if (resolved) {
      return { valid: true, normalizedSlug: resolved }
    }
  }

  // Could not resolve
  return {
    valid: false,
    reason: `Unknown tool slug for task ${task.id}: integration=${integration || 'missing'}, toolSlug=${toolSlug || 'missing'}`
  }
}

/**
 * Workflows API Routes
 * All routes require clerk_user_id in headers
 */

// Middleware to extract clerk_user_id
const extractClerkUserId = (req: Request, res: Response, next: Function) => {
  const clerkUserId = req.headers['x-clerk-user-id'] as string || req.body?.clerk_user_id

  // In development mode, allow requests without authentication
  const isDev = process.env.NODE_ENV !== 'production'
  if (!clerkUserId) {
    if (isDev) {
      // Use dev mode user ID for local testing
      req.body.clerk_user_id = 'dev-user-local'
      console.log('[DEV MODE] Using dev-user-local for authentication')
      return next()
    }
    return res.status(401).json({ error: 'Authentication required' })
  }
  req.body.clerk_user_id = clerkUserId
  next()
}

/**
 * GET /api/workflows
 * List all workflows for the current user (for dashboard display)
 */
router.get('/', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    // Get all workflows for the user across all projects
    const allWorkflows = await workflowService.getAllWorkflowsForUser(clerkUserId)

    res.json({
      success: true,
      data: allWorkflows || [],
      count: allWorkflows?.length || 0
    })
  } catch (error: any) {
    console.error('Error fetching all workflows:', error)
    // Return empty array on error (graceful degradation)
    res.json({
      success: true,
      data: [],
      count: 0,
      error: error.message
    })
  }
})

/**
 * POST /api/workflows
 * Create a new workflow from approved proposal (Story 4.1)
 */
router.post('/', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const { name, description, workflow_type, user_input, config, clerk_user_id } = req.body
    // In dev mode, use a default project_id UUID if not provided
    const isDev = process.env.NODE_ENV !== 'production'
    // Use a fixed UUID for dev mode that can be referenced consistently
    const DEV_PROJECT_UUID = '00000000-0000-0000-0000-000000000001'
    const project_id = req.body.project_id || (isDev ? DEV_PROJECT_UUID : null)

    if (!project_id || !name) {
      return res.status(400).json({ success: false, error: 'project_id and name are required' })
    }

    const workflow = await workflowService.createWorkflow({
      project_id,
      name,
      description,
      workflow_type: workflow_type || 'BMAD',
      user_input: user_input || '',
      config,
      created_by: clerk_user_id,
    })

    if (!workflow) {
      return res.status(500).json({ success: false, error: 'Failed to create workflow' })
    }

    res.status(201).json({ success: true, data: workflow })
  } catch (error: any) {
    console.error('Error creating workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to create workflow' })
  }
})

/**
 * GET /api/workflows/project/:projectId
 * Get all workflows for a project
 */
router.get('/project/:projectId', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id
    const workflows = await workflowService.getWorkflowsForProject(req.params.projectId, clerkUserId)
    res.json({ success: true, data: workflows })
  } catch (error: any) {
    console.error('Error fetching workflows:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch workflows' })
  }
})

/**
 * GET /api/workflows/:id
 * Get a single workflow by ID
 */
router.get('/:id', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id
    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    res.json({ success: true, data: workflow })
  } catch (error: any) {
    console.error('Error fetching workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch workflow' })
  }
})

/**
 * PUT /api/workflows/:id
 * Update a workflow
 */
router.put('/:id', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const { name, description, status, config, clerk_user_id } = req.body

    const workflow = await workflowService.updateWorkflow(req.params.id, clerk_user_id, {
      name,
      description,
      status,
      config,
    })

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    res.json({ success: true, data: workflow })
  } catch (error: any) {
    console.error('Error updating workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to update workflow' })
  }
})

/**
 * POST /api/workflows/:id/cancel
 * Cancel a running workflow (Story 4.7)
 */
router.post('/:id/cancel', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id
    const result = await workflowService.cancelWorkflow(req.params.id, clerkUserId)

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error })
    }

    res.json({ success: true, message: 'Workflow cancelled successfully' })
  } catch (error: any) {
    console.error('Error cancelling workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to cancel workflow' })
  }
})

/**
 * POST /api/workflows/:id/retry
 * Retry a failed workflow from last checkpoint (Story 4.8)
 */
router.post('/:id/retry', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id
    const result = await workflowService.retryWorkflow(req.params.id, clerkUserId)

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error })
    }

    res.json({ success: true, message: 'Workflow retry initiated', checkpoint: result.checkpoint })
  } catch (error: any) {
    console.error('Error retrying workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to retry workflow' })
  }
})

/**
 * GET /api/workflows/:id/checkpoints
 * Get all checkpoints for a workflow
 */
router.get('/:id/checkpoints', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    // Verify access
    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    const checkpoints = await workflowService.getCheckpoints(req.params.id)
    res.json({ success: true, data: checkpoints })
  } catch (error: any) {
    console.error('Error fetching checkpoints:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch checkpoints' })
  }
})

/**
 * DELETE /api/workflows/:id
 * Delete a workflow
 */
router.delete('/:id', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id
    const success = await workflowService.deleteWorkflow(req.params.id, clerkUserId)

    if (!success) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    res.json({ success: true, message: 'Workflow deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to delete workflow' })
  }
})

// =============================================================================
// BMAD Orchestration Routes (Story 4.2 & 4.4)
// =============================================================================

/**
 * POST /api/workflows/:id/start
 * Start the BMAD planning stage - Director analyzes and creates execution plan
 */
router.post('/:id/start', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    // Verify access
    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    // Update to planning status
    await workflowService.updateWorkflowStatus(req.params.id, 'planning')

    // Run planning stage
    const result = await bmadOrchestrator.runPlanningStage(req.params.id)

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error })
    }

    res.json({
      success: true,
      message: 'Planning complete - awaiting approval',
      plan: result.plan,
    })
  } catch (error: any) {
    console.error('Error starting workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to start workflow' })
  }
})

/**
 * GET /api/workflows/:id/plan
 * Get the execution plan for a workflow
 */
router.get('/:id/plan', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    const plan = workflow.config?.executionPlan
    if (!plan) {
      return res.status(404).json({ success: false, error: 'No execution plan found - workflow may not have been started' })
    }

    res.json({ success: true, data: plan })
  } catch (error: any) {
    console.error('Error fetching plan:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch plan' })
  }
})

/**
 * POST /api/workflows/:id/approve
 * Approve the execution plan and begin orchestrating stage
 */
router.post('/:id/approve', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    if (workflow.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        error: `Cannot approve workflow in '${workflow.status}' status. Expected 'pending_approval'.`,
      })
    }

    // Run orchestrating stage
    const result = await bmadOrchestrator.runOrchestratingStage(req.params.id)

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error })
    }

    res.json({
      success: true,
      message: 'Plan approved - workflow is now building',
    })
  } catch (error: any) {
    console.error('Error approving workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to approve workflow' })
  }
})

/**
 * POST /api/workflows/:id/execute
 * Execute all tasks in the workflow (Story 4.4)
 */
router.post('/:id/execute', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    if (workflow.status !== 'building') {
      return res.status(400).json({
        success: false,
        error: `Cannot execute workflow in '${workflow.status}' status. Expected 'building'.`,
      })
    }

    const plan = workflow.config?.executionPlan as any
    if (!plan?.tasks) {
      return res.status(400).json({ success: false, error: 'No execution plan found' })
    }

    // =========================================================================
    // Move 6.5: Execution Preflight - Check required integrations are connected
    // =========================================================================
    const requiredIntegrations: string[] = plan.requiredIntegrations || []
    if (requiredIntegrations.length > 0) {
      const missingIntegrations: string[] = []

      for (const integration of requiredIntegrations) {
        try {
          const status = await composioService.checkConnection(integration)
          if (!status.connected) {
            missingIntegrations.push(integration)
          }
        } catch {
          // If check fails, assume disconnected
          missingIntegrations.push(integration)
        }
      }

      if (missingIntegrations.length > 0) {
        // Emit SSE event for preflight failure
        broadcastWorkflowUpdate({
          workflowId: req.params.id,
          type: 'golden_path_preflight_failed',
          timestamp: new Date().toISOString(),
          missingIntegrations,
        })

        return res.status(400).json({
          success: false,
          error: `Connect ${missingIntegrations.join(', ')} before execution`,
          missingIntegrations,
        })
      }
    }

    // =========================================================================
    // Move 6.6: Plan Validation - Validate and normalize tool slugs
    // =========================================================================
    const invalidTasks: Array<{ taskId: string; reason: string }> = []

    for (const task of plan.tasks) {
      const validation = validateAndNormalizeToolSlug(task)
      if (!validation.valid) {
        invalidTasks.push({ taskId: task.id, reason: validation.reason || 'Unknown error' })
      } else if (validation.normalizedSlug && task.config) {
        // Auto-normalize the tool slug
        task.config.toolSlug = validation.normalizedSlug
      }
    }

    if (invalidTasks.length > 0) {
      // Emit SSE event for plan validation failure
      broadcastWorkflowUpdate({
        workflowId: req.params.id,
        type: 'golden_path_plan_invalid',
        timestamp: new Date().toISOString(),
        invalidTasks,
      })

      return res.status(400).json({
        success: false,
        error: 'Invalid workflow plan',
        invalidTasks,
      })
    }

    // Execute tasks in dependency order
    const completedTasks: string[] = []
    const taskResults: Record<string, any> = {}

    for (const task of plan.tasks) {
      // Check dependencies are met
      const depsComplete = task.dependencies.every((dep: string) => completedTasks.includes(dep))
      if (!depsComplete) {
        return res.status(400).json({
          success: false,
          error: `Task ${task.id} dependencies not met`,
        })
      }

      const result = await bmadOrchestrator.executeTask(req.params.id, task.id)
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: `Task ${task.id} failed: ${result.error}`,
          completedTasks,
        })
      }

      completedTasks.push(task.id)
      taskResults[task.id] = result.output
    }

    // Complete workflow
    await bmadOrchestrator.completeWorkflow(req.params.id)

    res.json({
      success: true,
      message: 'Workflow execution completed',
      taskResults,
    })
  } catch (error: any) {
    console.error('Error executing workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to execute workflow' })
  }
})

/**
 * POST /api/workflows/:id/execute-coordinated
 * Execute workflow with multi-agent coordination (Story 4.5)
 * Uses Director, Supervisor, and specialized agents
 */
router.post('/:id/execute-coordinated', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    if (workflow.status !== 'building' && workflow.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        error: `Cannot execute workflow in '${workflow.status}' status. Expected 'building' or 'pending_approval'.`,
      })
    }

    // If pending approval, first approve it
    if (workflow.status === 'pending_approval') {
      const approveResult = await bmadOrchestrator.runOrchestratingStage(req.params.id)
      if (!approveResult.success) {
        return res.status(400).json({ success: false, error: approveResult.error })
      }
    }

    // Execute with multi-agent coordination
    const result = await bmadOrchestrator.executeWithCoordination(req.params.id)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        results: result.results,
      })
    }

    res.json({
      success: true,
      message: 'Workflow completed with multi-agent coordination',
      results: result.results,
    })
  } catch (error: any) {
    console.error('Error executing coordinated workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to execute workflow' })
  }
})

/**
 * GET /api/workflows/:id/nodes
 * Get workflow nodes for visualization (Epic 5)
 */
router.get('/:id/nodes', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    // Get nodes from database
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: nodes, error } = await supabase
      .from('workflow_nodes')
      .select('*')
      .eq('workflow_id', req.params.id)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    res.json({ success: true, data: nodes || [] })
  } catch (error: any) {
    console.error('Error fetching nodes:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch nodes' })
  }
})

export default router

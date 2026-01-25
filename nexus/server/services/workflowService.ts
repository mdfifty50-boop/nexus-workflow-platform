import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { broadcastWorkflowUpdate } from '../routes/sse.js'

// Initialize Supabase client with service role key for admin operations
// Service role key bypasses RLS when properly configured
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Check if we have a valid service role key (should be a JWT starting with eyJ)
const isValidServiceKey = supabaseServiceKey.startsWith('eyJ')
const hasValidCredentials = supabaseUrl && isValidServiceKey

if (!hasValidCredentials) {
  console.warn('[WARNING] Missing or invalid Supabase credentials.')
  console.warn('[WARNING] Using in-memory storage for workflows.')
  console.warn('[WARNING] To use persistent storage, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (JWT format).')
}

// Only create Supabase client if we have valid credentials
// This prevents crash on startup when credentials are missing
const supabase = hasValidCredentials
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Dev mode project UUID - used when no real project is provided
const DEV_PROJECT_UUID = '00000000-0000-0000-0000-000000000001'

// In-memory storage for dev mode when database isn't available
const inMemoryWorkflows: Map<string, any> = new Map()
const inMemoryCheckpoints: Map<string, any[]> = new Map()

// Ensure dev project exists for local development
async function ensureDevProjectExists(): Promise<boolean> {
  if (process.env.NODE_ENV === 'production') return true

  // If no Supabase client, skip this check
  if (!supabase) {
    console.log('[DEV] No Supabase client, skipping dev project check')
    return true
  }

  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('id', DEV_PROJECT_UUID)
    .single()

  if (existing) return true

  // Try to create dev project
  const { error } = await supabase
    .from('projects')
    .insert({
      id: DEV_PROJECT_UUID,
      name: 'Dev Project',
      description: 'Default project for local development',
    })

  if (error) {
    console.log('[DEV] Could not create dev project, using direct insert:', error.message)
    return false
  }

  return true
}

export interface CreateWorkflowInput {
  project_id: string
  name: string
  description?: string
  workflow_type: 'BMAD' | 'Simple' | 'Scheduled'
  user_input: string
  config?: Record<string, unknown>
  created_by: string
}

export interface UpdateWorkflowInput {
  name?: string
  description?: string
  status?: string
  config?: Record<string, unknown>
  total_tokens_used?: number
  total_cost_usd?: number
  result_summary?: Record<string, unknown>
  error_message?: string
  completed_at?: string
}

export interface CreateCheckpointInput {
  workflow_id: string
  checkpoint_name: string
  state_snapshot: Record<string, unknown>
  tokens_used_in_step?: number
  cost_usd_in_step?: number
}

export const workflowService = {
  /**
   * Create a new workflow from an approved proposal (Story 4.1)
   */
  async createWorkflow(input: CreateWorkflowInput) {
    // Ensure dev project exists if in dev mode
    const isDev = process.env.NODE_ENV !== 'production'
    if (isDev && input.project_id === DEV_PROJECT_UUID) {
      await ensureDevProjectExists()
    }

    // Build insert object - only include columns that exist in the actual schema
    // Store user_input in config since the column may not exist
    const configWithInput = {
      ...(input.config || {}),
      user_input: input.user_input,
    }

    const insertData: Record<string, unknown> = {
      project_id: input.project_id,
      name: input.name,
      description: input.description || null,
      workflow_type: input.workflow_type,
      status: 'planning',
      config: configWithInput,
    }

    console.log('[DEV] Inserting workflow:', { ...insertData, config: '...' })

    // If no Supabase client, use in-memory storage
    if (!supabase) {
      const workflowId = randomUUID()
      const now = new Date().toISOString()
      const inMemoryWorkflow = {
        id: workflowId,
        ...insertData,
        created_at: now,
        updated_at: now,
        total_tokens_used: 0,
        total_cost_usd: 0,
      }
      inMemoryWorkflows.set(workflowId, inMemoryWorkflow)
      console.log('[IN-MEMORY] Created workflow:', workflowId)
      return inMemoryWorkflow
    }

    const { data, error } = await supabase
      .from('workflows')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating workflow:', error)

      // Fall back to in-memory storage
      const workflowId = randomUUID()
      const now = new Date().toISOString()
      const inMemoryWorkflow = {
        id: workflowId,
        ...insertData,
        created_at: now,
        updated_at: now,
        total_tokens_used: 0,
        total_cost_usd: 0,
      }
      inMemoryWorkflows.set(workflowId, inMemoryWorkflow)
      console.log('[FALLBACK] Created in-memory workflow:', workflowId)
      return inMemoryWorkflow
    }

    return data
  },

  /**
   * Get a workflow by ID with access check
   */
  async getWorkflowById(workflowId: string, clerkUserId: string) {
    // Check in-memory storage first
    if (inMemoryWorkflows.has(workflowId)) {
      console.log('[IN-MEMORY] Returning workflow:', workflowId)
      return inMemoryWorkflows.get(workflowId)
    }

    // If no Supabase client, can only return in-memory workflows
    if (!supabase) {
      return null
    }

    // First get the user's profile ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (!profile) {
      // In dev mode, allow access without profile
      if (isDev && inMemoryWorkflows.has(workflowId)) {
        return inMemoryWorkflows.get(workflowId)
      }
      return null
    }

    // Get workflow with project membership check
    const { data, error } = await supabase
      .from('workflows')
      .select(`
        *,
        projects!inner (
          id,
          name,
          project_members!inner (
            user_id,
            role
          )
        )
      `)
      .eq('id', workflowId)
      .eq('projects.project_members.user_id', profile.id)
      .single()

    if (error) {
      console.error('Error fetching workflow:', error)
      return null
    }

    return data
  },

  /**
   * Get all workflows for a project
   */
  async getWorkflowsForProject(projectId: string, clerkUserId: string) {
    // If no Supabase client, return in-memory workflows for this project
    if (!supabase) {
      return Array.from(inMemoryWorkflows.values()).filter(w => w.project_id === projectId)
    }

    // First get the user's profile ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (!profile) return []

    // Verify user has access to project
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', profile.id)
      .single()

    if (!membership) return []

    // Get workflows
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workflows:', error)
      return []
    }

    return data || []
  },

  /**
   * Get all workflows for a user across all their projects
   */
  async getAllWorkflowsForUser(clerkUserId: string) {
    // If no Supabase client, return all in-memory workflows
    if (!supabase) {
      const workflows = Array.from(inMemoryWorkflows.values())
      console.log('[IN-MEMORY] Returning', workflows.length, 'workflows for user')
      return workflows
    }

    // First get the user's profile ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (!profile) {
      console.log('[WorkflowService] No profile found for user:', clerkUserId)
      return []
    }

    // Get all projects the user is a member of
    const { data: memberships } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', profile.id)

    if (!memberships || memberships.length === 0) {
      console.log('[WorkflowService] No project memberships found for user')
      return []
    }

    const projectIds = memberships.map(m => m.project_id)

    // Get workflows from all user's projects
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all workflows for user:', error)
      return []
    }

    return data || []
  },

  /**
   * Update a workflow
   */
  async updateWorkflow(workflowId: string, clerkUserId: string, updates: UpdateWorkflowInput) {
    // First verify access
    const workflow = await this.getWorkflowById(workflowId, clerkUserId)
    if (!workflow) return null

    // Handle in-memory workflows
    if (inMemoryWorkflows.has(workflowId)) {
      const updated = {
        ...workflow,
        ...updates,
        updated_at: new Date().toISOString(),
      }
      inMemoryWorkflows.set(workflowId, updated)
      console.log('[IN-MEMORY] Updated workflow:', workflowId)
      return updated
    }

    // If no Supabase client, can't update database workflows
    if (!supabase) {
      return null
    }

    const { data, error } = await supabase
      .from('workflows')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId)
      .select()
      .single()

    if (error) {
      console.error('Error updating workflow:', error)
      return null
    }

    return data
  },

  /**
   * Update workflow status (Story 4.4)
   */
  async updateWorkflowStatus(workflowId: string, status: string, additionalData?: Partial<UpdateWorkflowInput>) {
    // Handle in-memory workflows
    if (inMemoryWorkflows.has(workflowId)) {
      const workflow = inMemoryWorkflows.get(workflowId)
      const updated = {
        ...workflow,
        status,
        ...additionalData,
        updated_at: new Date().toISOString(),
      }
      inMemoryWorkflows.set(workflowId, updated)
      console.log('[IN-MEMORY] Updated workflow status:', workflowId, status)

      // Broadcast SSE update for real-time UI updates
      broadcastWorkflowUpdate({
        workflowId,
        type: 'workflow_status',
        data: { status, ...additionalData },
      })

      return updated
    }

    // If no Supabase client, can't update database workflows
    if (!supabase) {
      return null
    }

    const { data, error } = await supabase
      .from('workflows')
      .update({
        status,
        ...additionalData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId)
      .select()
      .single()

    if (error) {
      console.error('Error updating workflow status:', error)
      return null
    }

    // Broadcast SSE update for real-time UI updates
    if (data) {
      broadcastWorkflowUpdate({
        workflowId,
        type: 'workflow_status',
        data: { status, ...additionalData },
      })
    }

    return data
  },

  /**
   * Create a checkpoint (Story 4.3)
   */
  async createCheckpoint(input: CreateCheckpointInput) {
    // Handle in-memory checkpoints when no Supabase client or in dev mode with in-memory workflow
    if (!supabase || inMemoryWorkflows.has(input.workflow_id)) {
      const checkpoints = inMemoryCheckpoints.get(input.workflow_id) || []
      const newVersion = checkpoints.length + 1
      const checkpoint = {
        id: randomUUID(),
        workflow_id: input.workflow_id,
        version: newVersion,
        checkpoint_name: input.checkpoint_name,
        state_snapshot: input.state_snapshot,
        tokens_used_in_step: input.tokens_used_in_step || 0,
        cost_usd_in_step: input.cost_usd_in_step || 0,
        created_at: new Date().toISOString(),
      }
      checkpoints.push(checkpoint)
      inMemoryCheckpoints.set(input.workflow_id, checkpoints)
      console.log('[IN-MEMORY] Created checkpoint:', checkpoint.checkpoint_name)
      return checkpoint
    }

    // Get the current version number
    const { data: lastCheckpoint } = await supabase
      .from('workflow_states')
      .select('version')
      .eq('workflow_id', input.workflow_id)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const newVersion = (lastCheckpoint?.version || 0) + 1

    const { data, error } = await supabase
      .from('workflow_states')
      .insert({
        workflow_id: input.workflow_id,
        version: newVersion,
        checkpoint_name: input.checkpoint_name,
        state_snapshot: input.state_snapshot,
        tokens_used_in_step: input.tokens_used_in_step || 0,
        cost_usd_in_step: input.cost_usd_in_step || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating checkpoint:', error)
      return null
    }

    return data
  },

  /**
   * Get latest checkpoint for a workflow (Story 4.8)
   */
  async getLatestCheckpoint(workflowId: string) {
    // Check in-memory checkpoints when no Supabase client or has in-memory data
    if (!supabase || inMemoryCheckpoints.has(workflowId)) {
      const checkpoints = inMemoryCheckpoints.get(workflowId) || []
      return checkpoints[checkpoints.length - 1] || null
    }

    const { data, error } = await supabase
      .from('workflow_states')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching checkpoint:', error)
      return null
    }

    return data
  },

  /**
   * Get all checkpoints for a workflow
   */
  async getCheckpoints(workflowId: string) {
    // Check in-memory checkpoints when no Supabase client or has in-memory data
    if (!supabase || inMemoryCheckpoints.has(workflowId)) {
      return inMemoryCheckpoints.get(workflowId) || []
    }

    const { data, error } = await supabase
      .from('workflow_states')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('version', { ascending: true })

    if (error) {
      console.error('Error fetching checkpoints:', error)
      return []
    }

    return data || []
  },

  /**
   * Cancel a workflow (Story 4.7)
   */
  async cancelWorkflow(workflowId: string, clerkUserId: string) {
    const workflow = await this.getWorkflowById(workflowId, clerkUserId)
    if (!workflow) return { success: false, error: 'Workflow not found' }

    // Can only cancel running workflows
    if (!['planning', 'orchestrating', 'building', 'reviewing'].includes(workflow.status)) {
      return { success: false, error: 'Workflow is not running' }
    }

    // Create cancellation checkpoint
    await this.createCheckpoint({
      workflow_id: workflowId,
      checkpoint_name: 'user_cancelled',
      state_snapshot: { cancelled_at: new Date().toISOString(), previous_status: workflow.status },
    })

    // Update status
    await this.updateWorkflowStatus(workflowId, 'cancelled')

    return { success: true }
  },

  /**
   * Retry workflow from last checkpoint (Story 4.8)
   */
  async retryWorkflow(workflowId: string, clerkUserId: string) {
    const workflow = await this.getWorkflowById(workflowId, clerkUserId)
    if (!workflow) return { success: false, error: 'Workflow not found' }

    // Can only retry failed workflows
    if (workflow.status !== 'failed') {
      return { success: false, error: 'Can only retry failed workflows' }
    }

    // Get latest checkpoint
    const checkpoint = await this.getLatestCheckpoint(workflowId)
    if (!checkpoint) {
      return { success: false, error: 'No checkpoint found' }
    }

    // Update status to orchestrating to resume
    await this.updateWorkflowStatus(workflowId, 'orchestrating', {
      error_message: null,
    })

    return { success: true, checkpoint }
  },

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string, clerkUserId: string) {
    const workflow = await this.getWorkflowById(workflowId, clerkUserId)
    if (!workflow) return false

    // Handle in-memory workflow deletion
    if (inMemoryWorkflows.has(workflowId)) {
      inMemoryWorkflows.delete(workflowId)
      inMemoryCheckpoints.delete(workflowId)
      console.log('[IN-MEMORY] Deleted workflow:', workflowId)
      return true
    }

    // If no Supabase client, can't delete database workflows
    if (!supabase) {
      return false
    }

    // Delete checkpoints first
    await supabase.from('workflow_states').delete().eq('workflow_id', workflowId)

    // Delete workflow nodes
    await supabase.from('workflow_nodes').delete().eq('workflow_id', workflowId)

    // Delete workflow
    const { error } = await supabase.from('workflows').delete().eq('id', workflowId)

    if (error) {
      console.error('Error deleting workflow:', error)
      return false
    }

    return true
  },

  /**
   * Add tokens and cost to workflow totals
   */
  async addUsage(workflowId: string, tokensUsed: number, costUsd: number) {
    // Handle in-memory workflow usage
    if (inMemoryWorkflows.has(workflowId)) {
      const workflow = inMemoryWorkflows.get(workflowId)
      workflow.total_tokens_used = (workflow.total_tokens_used || 0) + tokensUsed
      workflow.total_cost_usd = (workflow.total_cost_usd || 0) + costUsd
      workflow.updated_at = new Date().toISOString()
      inMemoryWorkflows.set(workflowId, workflow)
      console.log('[IN-MEMORY] Updated usage for workflow:', workflowId)
      return workflow
    }

    // If no Supabase client, can't update database workflows
    if (!supabase) {
      return null
    }

    const { data: current } = await supabase
      .from('workflows')
      .select('total_tokens_used, total_cost_usd')
      .eq('id', workflowId)
      .single()

    if (!current) return null

    const { data, error } = await supabase
      .from('workflows')
      .update({
        total_tokens_used: (current.total_tokens_used || 0) + tokensUsed,
        total_cost_usd: (current.total_cost_usd || 0) + costUsd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId)
      .select()
      .single()

    if (error) {
      console.error('Error updating usage:', error)
      return null
    }

    return data
  },
}

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { broadcastWorkflowUpdate } from '../routes/sse.js';
// Initialize Supabase client with service role key for admin operations
// Service role key bypasses RLS when properly configured
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
// Check if we have a valid service role key (should be a JWT starting with eyJ)
const isValidServiceKey = supabaseServiceKey.startsWith('eyJ');
if (!isValidServiceKey && process.env.NODE_ENV !== 'production') {
    console.warn('[DEV WARNING] SUPABASE_SERVICE_ROLE_KEY appears to be invalid (not a JWT).');
    console.warn('[DEV WARNING] Using in-memory storage for workflows. Get the real service role key from Supabase Dashboard.');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
// Dev mode project UUID - used when no real project is provided
const DEV_PROJECT_UUID = '00000000-0000-0000-0000-000000000001';
// In-memory storage for dev mode when database isn't available
const inMemoryWorkflows = new Map();
const inMemoryCheckpoints = new Map();
// Ensure dev project exists for local development
async function ensureDevProjectExists() {
    if (process.env.NODE_ENV === 'production')
        return true;
    const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('id', DEV_PROJECT_UUID)
        .single();
    if (existing)
        return true;
    // Try to create dev project
    const { error } = await supabase
        .from('projects')
        .insert({
        id: DEV_PROJECT_UUID,
        name: 'Dev Project',
        description: 'Default project for local development',
    });
    if (error) {
        console.log('[DEV] Could not create dev project, using direct insert:', error.message);
        return false;
    }
    return true;
}
export const workflowService = {
    /**
     * Create a new workflow from an approved proposal (Story 4.1)
     */
    async createWorkflow(input) {
        // Ensure dev project exists if in dev mode
        const isDev = process.env.NODE_ENV !== 'production';
        if (isDev && input.project_id === DEV_PROJECT_UUID) {
            await ensureDevProjectExists();
        }
        // Build insert object - only include columns that exist in the actual schema
        // Store user_input in config since the column may not exist
        const configWithInput = {
            ...(input.config || {}),
            user_input: input.user_input,
        };
        const insertData = {
            project_id: input.project_id,
            name: input.name,
            description: input.description || null,
            workflow_type: input.workflow_type,
            status: 'planning',
            config: configWithInput,
        };
        console.log('[DEV] Inserting workflow:', { ...insertData, config: '...' });
        const { data, error } = await supabase
            .from('workflows')
            .insert(insertData)
            .select()
            .single();
        if (error) {
            console.error('Error creating workflow:', error);
            // In dev mode, fall back to in-memory storage
            if (isDev) {
                const workflowId = randomUUID();
                const now = new Date().toISOString();
                const inMemoryWorkflow = {
                    id: workflowId,
                    ...insertData,
                    created_at: now,
                    updated_at: now,
                    total_tokens_used: 0,
                    total_cost_usd: 0,
                };
                inMemoryWorkflows.set(workflowId, inMemoryWorkflow);
                console.log('[DEV] Created in-memory workflow:', workflowId);
                return inMemoryWorkflow;
            }
            return null;
        }
        return data;
    },
    /**
     * Get a workflow by ID with access check
     */
    async getWorkflowById(workflowId, clerkUserId) {
        const isDev = process.env.NODE_ENV !== 'production';
        // Check in-memory storage first in dev mode
        if (isDev && inMemoryWorkflows.has(workflowId)) {
            console.log('[DEV] Returning in-memory workflow:', workflowId);
            return inMemoryWorkflows.get(workflowId);
        }
        // First get the user's profile ID
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single();
        if (!profile) {
            // In dev mode, allow access without profile
            if (isDev && inMemoryWorkflows.has(workflowId)) {
                return inMemoryWorkflows.get(workflowId);
            }
            return null;
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
            .single();
        if (error) {
            console.error('Error fetching workflow:', error);
            return null;
        }
        return data;
    },
    /**
     * Get all workflows for a project
     */
    async getWorkflowsForProject(projectId, clerkUserId) {
        // First get the user's profile ID
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single();
        if (!profile)
            return [];
        // Verify user has access to project
        const { data: membership } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', profile.id)
            .single();
        if (!membership)
            return [];
        // Get workflows
        const { data, error } = await supabase
            .from('workflows')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching workflows:', error);
            return [];
        }
        return data || [];
    },
    /**
     * Get all workflows for a user across all their projects
     */
    async getAllWorkflowsForUser(clerkUserId) {
        const isDev = process.env.NODE_ENV !== 'production';
        // In dev mode, return in-memory workflows
        if (isDev) {
            const workflows = Array.from(inMemoryWorkflows.values());
            console.log('[DEV] Returning', workflows.length, 'in-memory workflows for user');
            return workflows;
        }
        // First get the user's profile ID
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single();
        if (!profile) {
            console.log('[WorkflowService] No profile found for user:', clerkUserId);
            return [];
        }
        // Get all projects the user is a member of
        const { data: memberships } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', profile.id);
        if (!memberships || memberships.length === 0) {
            console.log('[WorkflowService] No project memberships found for user');
            return [];
        }
        const projectIds = memberships.map(m => m.project_id);
        // Get workflows from all user's projects
        const { data, error } = await supabase
            .from('workflows')
            .select('*')
            .in('project_id', projectIds)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching all workflows for user:', error);
            return [];
        }
        return data || [];
    },
    /**
     * Update a workflow
     */
    async updateWorkflow(workflowId, clerkUserId, updates) {
        // First verify access
        const workflow = await this.getWorkflowById(workflowId, clerkUserId);
        if (!workflow)
            return null;
        const { data, error } = await supabase
            .from('workflows')
            .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
            .eq('id', workflowId)
            .select()
            .single();
        if (error) {
            console.error('Error updating workflow:', error);
            return null;
        }
        return data;
    },
    /**
     * Update workflow status (Story 4.4)
     */
    async updateWorkflowStatus(workflowId, status, additionalData) {
        const isDev = process.env.NODE_ENV !== 'production';
        // Handle in-memory workflows in dev mode
        if (isDev && inMemoryWorkflows.has(workflowId)) {
            const workflow = inMemoryWorkflows.get(workflowId);
            const updated = {
                ...workflow,
                status,
                ...additionalData,
                updated_at: new Date().toISOString(),
            };
            inMemoryWorkflows.set(workflowId, updated);
            console.log('[DEV] Updated in-memory workflow status:', workflowId, status);
            // Broadcast SSE update for real-time UI updates
            broadcastWorkflowUpdate({
                workflowId,
                type: 'workflow_status',
                data: { status, ...additionalData },
            });
            return updated;
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
            .single();
        if (error) {
            console.error('Error updating workflow status:', error);
            return null;
        }
        // Broadcast SSE update for real-time UI updates
        if (data) {
            broadcastWorkflowUpdate({
                workflowId,
                type: 'workflow_status',
                data: { status, ...additionalData },
            });
        }
        return data;
    },
    /**
     * Create a checkpoint (Story 4.3)
     */
    async createCheckpoint(input) {
        const isDev = process.env.NODE_ENV !== 'production';
        // Handle in-memory checkpoints in dev mode
        if (isDev && inMemoryWorkflows.has(input.workflow_id)) {
            const checkpoints = inMemoryCheckpoints.get(input.workflow_id) || [];
            const newVersion = checkpoints.length + 1;
            const checkpoint = {
                id: randomUUID(),
                workflow_id: input.workflow_id,
                version: newVersion,
                checkpoint_name: input.checkpoint_name,
                state_snapshot: input.state_snapshot,
                tokens_used_in_step: input.tokens_used_in_step || 0,
                cost_usd_in_step: input.cost_usd_in_step || 0,
                created_at: new Date().toISOString(),
            };
            checkpoints.push(checkpoint);
            inMemoryCheckpoints.set(input.workflow_id, checkpoints);
            console.log('[DEV] Created in-memory checkpoint:', checkpoint.checkpoint_name);
            return checkpoint;
        }
        // Get the current version number
        const { data: lastCheckpoint } = await supabase
            .from('workflow_states')
            .select('version')
            .eq('workflow_id', input.workflow_id)
            .order('version', { ascending: false })
            .limit(1)
            .single();
        const newVersion = (lastCheckpoint?.version || 0) + 1;
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
            .single();
        if (error) {
            console.error('Error creating checkpoint:', error);
            return null;
        }
        return data;
    },
    /**
     * Get latest checkpoint for a workflow (Story 4.8)
     */
    async getLatestCheckpoint(workflowId) {
        const isDev = process.env.NODE_ENV !== 'production';
        // Check in-memory checkpoints in dev mode
        if (isDev && inMemoryCheckpoints.has(workflowId)) {
            const checkpoints = inMemoryCheckpoints.get(workflowId) || [];
            return checkpoints[checkpoints.length - 1] || null;
        }
        const { data, error } = await supabase
            .from('workflow_states')
            .select('*')
            .eq('workflow_id', workflowId)
            .order('version', { ascending: false })
            .limit(1)
            .single();
        if (error) {
            console.error('Error fetching checkpoint:', error);
            return null;
        }
        return data;
    },
    /**
     * Get all checkpoints for a workflow
     */
    async getCheckpoints(workflowId) {
        const isDev = process.env.NODE_ENV !== 'production';
        // Check in-memory checkpoints in dev mode
        if (isDev && inMemoryCheckpoints.has(workflowId)) {
            return inMemoryCheckpoints.get(workflowId) || [];
        }
        const { data, error } = await supabase
            .from('workflow_states')
            .select('*')
            .eq('workflow_id', workflowId)
            .order('version', { ascending: true });
        if (error) {
            console.error('Error fetching checkpoints:', error);
            return [];
        }
        return data || [];
    },
    /**
     * Cancel a workflow (Story 4.7)
     */
    async cancelWorkflow(workflowId, clerkUserId) {
        const workflow = await this.getWorkflowById(workflowId, clerkUserId);
        if (!workflow)
            return { success: false, error: 'Workflow not found' };
        // Can only cancel running workflows
        if (!['planning', 'orchestrating', 'building', 'reviewing'].includes(workflow.status)) {
            return { success: false, error: 'Workflow is not running' };
        }
        // Create cancellation checkpoint
        await this.createCheckpoint({
            workflow_id: workflowId,
            checkpoint_name: 'user_cancelled',
            state_snapshot: { cancelled_at: new Date().toISOString(), previous_status: workflow.status },
        });
        // Update status
        await this.updateWorkflowStatus(workflowId, 'cancelled');
        return { success: true };
    },
    /**
     * Retry workflow from last checkpoint (Story 4.8)
     */
    async retryWorkflow(workflowId, clerkUserId) {
        const workflow = await this.getWorkflowById(workflowId, clerkUserId);
        if (!workflow)
            return { success: false, error: 'Workflow not found' };
        // Can only retry failed workflows
        if (workflow.status !== 'failed') {
            return { success: false, error: 'Can only retry failed workflows' };
        }
        // Get latest checkpoint
        const checkpoint = await this.getLatestCheckpoint(workflowId);
        if (!checkpoint) {
            return { success: false, error: 'No checkpoint found' };
        }
        // Update status to orchestrating to resume
        await this.updateWorkflowStatus(workflowId, 'orchestrating', {
            error_message: null,
        });
        return { success: true, checkpoint };
    },
    /**
     * Delete a workflow
     */
    async deleteWorkflow(workflowId, clerkUserId) {
        const workflow = await this.getWorkflowById(workflowId, clerkUserId);
        if (!workflow)
            return false;
        // Delete checkpoints first
        await supabase.from('workflow_states').delete().eq('workflow_id', workflowId);
        // Delete workflow nodes
        await supabase.from('workflow_nodes').delete().eq('workflow_id', workflowId);
        // Delete workflow
        const { error } = await supabase.from('workflows').delete().eq('id', workflowId);
        if (error) {
            console.error('Error deleting workflow:', error);
            return false;
        }
        return true;
    },
    /**
     * Add tokens and cost to workflow totals
     */
    async addUsage(workflowId, tokensUsed, costUsd) {
        const { data: current } = await supabase
            .from('workflows')
            .select('total_tokens_used, total_cost_usd')
            .eq('id', workflowId)
            .single();
        if (!current)
            return null;
        const { data, error } = await supabase
            .from('workflows')
            .update({
            total_tokens_used: (current.total_tokens_used || 0) + tokensUsed,
            total_cost_usd: (current.total_cost_usd || 0) + costUsd,
            updated_at: new Date().toISOString(),
        })
            .eq('id', workflowId)
            .select()
            .single();
        if (error) {
            console.error('Error updating usage:', error);
            return null;
        }
        return data;
    },
};
//# sourceMappingURL=workflowService.js.map
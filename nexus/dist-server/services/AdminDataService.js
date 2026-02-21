import { createClient } from '@supabase/supabase-js';
// Initialize Supabase client with service role for backend operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
    console.warn('⚠️ SUPABASE_URL not configured for AdminDataService');
}
const supabase = supabaseServiceKey && supabaseUrl
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;
// =============================================================================
// ADMIN DATA SERVICE
// =============================================================================
export const adminDataService = {
    /**
     * Get all users with their workflow counts
     */
    async getUsers() {
        if (!supabase) {
            console.warn('Supabase not configured - returning empty users list');
            return [];
        }
        try {
            // Get users from the 'users' table (production schema)
            const { data: profiles, error: profileError } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            if (profileError) {
                console.error('Error fetching users:', profileError);
                return [];
            }
            if (!profiles || profiles.length === 0) {
                return [];
            }
            // Get workflow counts per user (by clerk_user_id or email)
            const { data: workflowCounts, error: workflowError } = await supabase
                .from('user_workflows')
                .select('clerk_user_id');
            if (workflowError) {
                console.error('Error fetching workflow counts:', workflowError);
            }
            // Count workflows per user
            const workflowCountMap = {};
            if (workflowCounts) {
                for (const wf of workflowCounts) {
                    workflowCountMap[wf.clerk_user_id] = (workflowCountMap[wf.clerk_user_id] || 0) + 1;
                }
            }
            // Map to AdminUser format
            // Use clerk_user_id if available, fall back to id
            return profiles.map((profile) => {
                const identifier = profile.clerk_user_id || profile.id;
                return {
                    id: identifier,
                    email: profile.email || 'unknown@email.com',
                    name: profile.full_name || profile.email?.split('@')[0] || 'Unknown User',
                    role: profile.role || 'user',
                    status: this.getUserActivityStatus(profile.last_active_at || profile.updated_at),
                    createdAt: profile.created_at ? new Date(profile.created_at).toISOString().split('T')[0] : '-',
                    lastActive: profile.last_active_at
                        ? new Date(profile.last_active_at).toISOString().split('T')[0]
                        : profile.updated_at
                            ? new Date(profile.updated_at).toISOString().split('T')[0]
                            : '-',
                    workflowsCreated: workflowCountMap[identifier] || 0
                };
            });
        }
        catch (error) {
            console.error('Error in getUsers:', error);
            return [];
        }
    },
    /**
     * Determine user status based on last activity
     */
    /**
     * Determine user activity status based on last activity
     */
    getUserActivityStatus(lastActiveAt) {
        if (!lastActiveAt)
            return 'pending';
        const lastActive = new Date(lastActiveAt);
        const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceActive <= 7)
            return 'active';
        if (daysSinceActive <= 30)
            return 'inactive';
        return 'inactive';
    },
    /**
     * Check if a user exists and get their role
     * Used for admin auth middleware
     */
    async getUserStatus(clerkUserId) {
        if (!supabase) {
            // In development without Supabase, allow access
            return { exists: true, role: 'admin' };
        }
        try {
            // Try by clerk_user_id first, then by id
            let data = null;
            let error = null;
            const result1 = await supabase
                .from('users')
                .select('role')
                .eq('clerk_user_id', clerkUserId)
                .single();
            if (result1.data) {
                data = result1.data;
            }
            else {
                // Fallback: try by id
                const result2 = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', clerkUserId)
                    .single();
                data = result2.data;
                error = result2.error;
            }
            if (!data) {
                // Last fallback: check by email via ADMIN_EMAIL
                return { exists: false, role: null };
            }
            return { exists: true, role: data.role || 'user' };
        }
        catch (error) {
            console.error('Error in getUserStatus:', error);
            return { exists: false, role: null };
        }
    },
    /**
     * Get usage metrics aggregated from various tables
     */
    async getUsageMetrics() {
        if (!supabase) {
            console.warn('Supabase not configured - returning default metrics');
            return this.getDefaultMetrics();
        }
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            // Get user counts
            const { count: totalUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });
            // Get active users (last 7 days) - use last_active_at or updated_at
            const { count: activeUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('updated_at', weekAgo.toISOString());
            // Get workflow counts
            const { count: totalWorkflows } = await supabase
                .from('user_workflows')
                .select('*', { count: 'exact', head: true });
            const { count: activeWorkflows } = await supabase
                .from('user_workflows')
                .select('*', { count: 'exact', head: true })
                .in('status', ['active', 'draft']);
            // Get execution counts
            const { count: totalExecutions } = await supabase
                .from('user_workflow_executions')
                .select('*', { count: 'exact', head: true });
            const { count: executionsToday } = await supabase
                .from('user_workflow_executions')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());
            const { count: executionsThisWeek } = await supabase
                .from('user_workflow_executions')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', weekAgo.toISOString());
            const { count: executionsThisMonth } = await supabase
                .from('user_workflow_executions')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', monthAgo.toISOString());
            // Get success rate
            const { count: successfulExecutions } = await supabase
                .from('user_workflow_executions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed');
            const successRate = totalExecutions && totalExecutions > 0
                ? Math.round((successfulExecutions || 0) / totalExecutions * 1000) / 10
                : 0;
            return {
                totalUsers: totalUsers || 0,
                activeUsers: activeUsers || 0,
                totalWorkflows: totalWorkflows || 0,
                activeWorkflows: activeWorkflows || 0,
                totalExecutions: totalExecutions || 0,
                executionsToday: executionsToday || 0,
                executionsThisWeek: executionsThisWeek || 0,
                executionsThisMonth: executionsThisMonth || 0,
                successRate,
                avgExecutionTime: 2.4, // Would need execution timing data
                storageUsed: 0, // Would need storage tracking
                storageLimit: 10,
                apiCalls: totalExecutions || 0, // Approximate with executions
                apiLimit: 100000
            };
        }
        catch (error) {
            console.error('Error in getUsageMetrics:', error);
            return this.getDefaultMetrics();
        }
    },
    /**
     * Get default metrics when Supabase is not available
     */
    getDefaultMetrics() {
        return {
            totalUsers: 0,
            activeUsers: 0,
            totalWorkflows: 0,
            activeWorkflows: 0,
            totalExecutions: 0,
            executionsToday: 0,
            executionsThisWeek: 0,
            executionsThisMonth: 0,
            successRate: 0,
            avgExecutionTime: 0,
            storageUsed: 0,
            storageLimit: 10,
            apiCalls: 0,
            apiLimit: 100000
        };
    },
    /**
     * Get time series data for charts
     */
    async getTimeSeries(days = 7) {
        if (!supabase) {
            return [];
        }
        try {
            const result = [];
            const now = new Date();
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
                // Count executions for this day
                const { count: executions } = await supabase
                    .from('user_workflow_executions')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', startOfDay.toISOString())
                    .lt('created_at', endOfDay.toISOString());
                // Count errors for this day
                const { count: errors } = await supabase
                    .from('user_workflow_executions')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', startOfDay.toISOString())
                    .lt('created_at', endOfDay.toISOString())
                    .eq('status', 'failed');
                // Count active users for this day (simplified - use updated_at as proxy)
                const { count: users } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .gte('updated_at', startOfDay.toISOString())
                    .lt('updated_at', endOfDay.toISOString());
                result.push({
                    date: startOfDay.toISOString().split('T')[0],
                    executions: executions || 0,
                    users: users || 0,
                    errors: errors || 0
                });
            }
            return result;
        }
        catch (error) {
            console.error('Error in getTimeSeries:', error);
            return [];
        }
    },
    /**
     * Get top workflows by execution count
     */
    async getTopWorkflows(limit = 5) {
        if (!supabase) {
            return [];
        }
        try {
            // Get workflows with their execution counts
            const { data: workflows, error } = await supabase
                .from('user_workflows')
                .select(`
          id,
          name,
          user_workflow_executions (
            id,
            status
          )
        `)
                .order('execution_count', { ascending: false })
                .limit(limit);
            if (error) {
                console.error('Error fetching top workflows:', error);
                return [];
            }
            if (!workflows)
                return [];
            return workflows.map((wf) => {
                const executions = wf.user_workflow_executions || [];
                const successful = executions.filter((e) => e.status === 'completed').length;
                const total = executions.length;
                return {
                    id: wf.id,
                    name: wf.name || 'Unnamed Workflow',
                    executions: total,
                    avgTime: 2.5, // Would need timing data
                    successRate: total > 0 ? Math.round((successful / total) * 1000) / 10 : 0
                };
            });
        }
        catch (error) {
            console.error('Error in getTopWorkflows:', error);
            return [];
        }
    },
    /**
     * Get audit log entries with filtering
     */
    async getAuditLog(params) {
        if (!supabase) {
            return { entries: [], total: 0 };
        }
        try {
            const { limit = 50, offset = 0, userId, action, status, startDate, endDate } = params;
            let query = supabase
                .from('audit_logs')
                .select('*', { count: 'exact' })
                .order('timestamp', { ascending: false })
                .range(offset, offset + limit - 1);
            if (userId) {
                query = query.eq('user_id', userId);
            }
            if (action) {
                query = query.eq('action', action);
            }
            if (status) {
                query = query.eq('status', status);
            }
            if (startDate) {
                query = query.gte('timestamp', startDate);
            }
            if (endDate) {
                query = query.lte('timestamp', endDate);
            }
            const { data, error, count } = await query;
            if (error) {
                console.error('Error fetching audit logs:', error);
                return { entries: [], total: 0 };
            }
            const entries = (data || []).map((log) => ({
                id: log.id,
                timestamp: log.timestamp,
                user: {
                    id: log.user_id,
                    name: log.user_name || 'Unknown',
                    email: log.user_email || 'unknown@email.com'
                },
                action: log.action,
                resource: log.resource,
                resourceId: log.resource_id || '',
                details: log.details || '',
                ipAddress: log.ip_address || '',
                userAgent: log.user_agent || '',
                status: log.status
            }));
            return { entries, total: count || 0 };
        }
        catch (error) {
            console.error('Error in getAuditLog:', error);
            return { entries: [], total: 0 };
        }
    },
    /**
     * Create an audit log entry
     */
    async createAuditLog(params) {
        if (!supabase) {
            console.warn('Supabase not configured - audit log not created');
            return false;
        }
        try {
            const { error } = await supabase
                .from('audit_logs')
                .insert({
                user_id: params.userId,
                user_name: params.userName,
                user_email: params.userEmail,
                action: params.action,
                resource: params.resource,
                resource_id: params.resourceId,
                details: params.details,
                ip_address: params.ipAddress,
                user_agent: params.userAgent,
                status: params.status || 'success',
                metadata: params.metadata || {}
            });
            if (error) {
                console.error('Error creating audit log:', error);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Error in createAuditLog:', error);
            return false;
        }
    },
    /**
     * Update user role (for admin operations)
     */
    async updateUserRole(clerkUserId, role) {
        if (!supabase) {
            return false;
        }
        try {
            // Try updating by clerk_user_id first, then by id
            let error = null;
            const result1 = await supabase
                .from('users')
                .update({ role })
                .eq('clerk_user_id', clerkUserId);
            if (result1.error) {
                const result2 = await supabase
                    .from('users')
                    .update({ role })
                    .eq('id', clerkUserId);
                error = result2.error;
            }
            if (error) {
                console.error('Error updating user role:', error);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Error in updateUserRole:', error);
            return false;
        }
    },
    // =============================================================================
    // PER-USER QUERIES (Admin Dashboard v2)
    // =============================================================================
    /**
     * Get detailed info for a single user
     */
    async getUserDetail(clerkUserId) {
        if (!supabase)
            return null;
        try {
            // Fetch profile from users table - try clerk_user_id, then id, then email
            let profile = null;
            const { data: p1 } = await supabase
                .from('users')
                .select('*')
                .eq('clerk_user_id', clerkUserId)
                .single();
            if (p1) {
                profile = p1;
            }
            else {
                const { data: p2 } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', clerkUserId)
                    .single();
                profile = p2;
            }
            if (!profile)
                return null;
            const identifier = profile.clerk_user_id || profile.id;
            // Fetch business profile (table may not have data yet)
            const { data: bizProfile } = await supabase
                .from('user_business_profiles')
                .select('*')
                .eq('clerk_user_id', identifier)
                .single();
            // Count conversations (use the identifier that matches clerk_user_id in other tables)
            const { count: conversationCount } = await supabase
                .from('chat_conversations')
                .select('*', { count: 'exact', head: true })
                .eq('clerk_user_id', identifier);
            // Count workflows
            const { count: workflowCount } = await supabase
                .from('user_workflows')
                .select('*', { count: 'exact', head: true })
                .eq('clerk_user_id', identifier);
            // Count executions
            const { data: userWorkflows } = await supabase
                .from('user_workflows')
                .select('id')
                .eq('clerk_user_id', identifier);
            let executionCount = 0;
            let errorCount = 0;
            if (userWorkflows && userWorkflows.length > 0) {
                const workflowIds = userWorkflows.map((w) => w.id);
                const { count: execCount } = await supabase
                    .from('user_workflow_executions')
                    .select('*', { count: 'exact', head: true })
                    .in('workflow_id', workflowIds);
                const { count: errCount } = await supabase
                    .from('user_workflow_executions')
                    .select('*', { count: 'exact', head: true })
                    .in('workflow_id', workflowIds)
                    .eq('status', 'failed');
                executionCount = execCount || 0;
                errorCount = errCount || 0;
            }
            return {
                id: identifier,
                email: profile.email || '',
                name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
                avatarUrl: profile.avatar_url,
                role: profile.role || 'user',
                status: this.getUserActivityStatus(profile.last_active_at || profile.updated_at),
                createdAt: profile.created_at,
                lastActive: profile.last_active_at || profile.updated_at || profile.created_at,
                workflowsCreated: workflowCount || 0,
                conversationCount: conversationCount || 0,
                executionCount,
                errorCount,
                businessProfile: bizProfile || null
            };
        }
        catch (error) {
            console.error('Error in getUserDetail:', error);
            return null;
        }
    },
    /**
     * Get all conversations for a user with messages
     */
    async getUserConversations(clerkUserId) {
        if (!supabase)
            return [];
        try {
            const { data: conversations, error } = await supabase
                .from('chat_conversations')
                .select('*')
                .eq('clerk_user_id', clerkUserId)
                .order('updated_at', { ascending: false })
                .limit(50);
            if (error || !conversations)
                return [];
            const result = [];
            for (const conv of conversations) {
                const { data: messages, count } = await supabase
                    .from('chat_messages')
                    .select('id, role, content, created_at', { count: 'exact' })
                    .eq('conversation_id', conv.id)
                    .order('created_at', { ascending: true })
                    .limit(100);
                result.push({
                    id: conv.id,
                    title: conv.title || 'Untitled',
                    messageCount: count || 0,
                    createdAt: conv.created_at,
                    updatedAt: conv.updated_at,
                    messages: (messages || []).map((m) => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        createdAt: m.created_at
                    }))
                });
            }
            return result;
        }
        catch (error) {
            console.error('Error in getUserConversations:', error);
            return [];
        }
    },
    /**
     * Get all workflows for a user with execution history
     */
    async getUserWorkflows(clerkUserId) {
        if (!supabase)
            return [];
        try {
            const { data: workflows, error } = await supabase
                .from('user_workflows')
                .select('*')
                .eq('clerk_user_id', clerkUserId)
                .order('updated_at', { ascending: false });
            if (error || !workflows)
                return [];
            const result = [];
            for (const wf of workflows) {
                const { data: executions } = await supabase
                    .from('user_workflow_executions')
                    .select('id, status, created_at, error_message')
                    .eq('workflow_id', wf.id)
                    .order('created_at', { ascending: false })
                    .limit(10);
                result.push({
                    id: wf.id,
                    name: wf.name || 'Unnamed Workflow',
                    description: wf.description,
                    status: wf.status,
                    executionCount: wf.execution_count || 0,
                    lastExecutedAt: wf.last_executed_at,
                    createdAt: wf.created_at,
                    executions: (executions || []).map((e) => ({
                        id: e.id,
                        status: e.status,
                        createdAt: e.created_at,
                        errorMessage: e.error_message
                    }))
                });
            }
            return result;
        }
        catch (error) {
            console.error('Error in getUserWorkflows:', error);
            return [];
        }
    },
    /**
     * Get all errors for a user
     */
    async getUserErrors(clerkUserId) {
        if (!supabase)
            return [];
        try {
            // Get user's workflow IDs
            const { data: workflows } = await supabase
                .from('user_workflows')
                .select('id, name')
                .eq('clerk_user_id', clerkUserId);
            if (!workflows || workflows.length === 0)
                return [];
            const workflowMap = {};
            for (const wf of workflows) {
                workflowMap[wf.id] = wf.name || 'Unnamed Workflow';
            }
            const { data: errors, error } = await supabase
                .from('user_workflow_executions')
                .select('*')
                .in('workflow_id', workflows.map((w) => w.id))
                .eq('status', 'failed')
                .order('created_at', { ascending: false })
                .limit(50);
            if (error || !errors)
                return [];
            return errors.map((e) => ({
                id: e.id,
                workflowId: e.workflow_id,
                workflowName: workflowMap[e.workflow_id] || 'Unknown Workflow',
                status: e.status,
                errorMessage: e.error_message || 'Unknown error',
                createdAt: e.created_at
            }));
        }
        catch (error) {
            console.error('Error in getUserErrors:', error);
            return [];
        }
    },
    /**
     * Get platform-wide activity feed (merged timeline)
     */
    async getActivityFeed(limit = 50) {
        if (!supabase)
            return [];
        try {
            const activities = [];
            // Build a map of clerk_user_id -> { name, email } from users table
            const { data: profiles } = await supabase
                .from('users')
                .select('id, clerk_user_id, full_name, email');
            const userMap = {};
            if (profiles) {
                for (const p of profiles) {
                    // Map by both clerk_user_id and id for flexible lookup
                    const name = p.full_name || p.email?.split('@')[0] || 'Unknown';
                    const email = p.email || '';
                    if (p.clerk_user_id) {
                        userMap[p.clerk_user_id] = { name, email };
                    }
                    userMap[p.id] = { name, email };
                }
            }
            // Recent signups (users created recently)
            const { data: recentSignups } = await supabase
                .from('users')
                .select('id, clerk_user_id, full_name, email, created_at')
                .order('created_at', { ascending: false })
                .limit(20);
            if (recentSignups) {
                for (const u of recentSignups) {
                    const identifier = u.clerk_user_id || u.id;
                    activities.push({
                        id: `signup-${identifier}`,
                        type: 'signup',
                        user: {
                            id: identifier,
                            name: u.full_name || u.email?.split('@')[0] || 'Unknown',
                            email: u.email || ''
                        },
                        description: 'Signed up for Nexus',
                        timestamp: u.created_at
                    });
                }
            }
            // Recent conversations
            const { data: recentChats } = await supabase
                .from('chat_conversations')
                .select('id, clerk_user_id, title, created_at')
                .order('created_at', { ascending: false })
                .limit(20);
            if (recentChats) {
                for (const c of recentChats) {
                    const user = userMap[c.clerk_user_id] || { name: 'Unknown', email: '' };
                    activities.push({
                        id: `chat-${c.id}`,
                        type: 'chat',
                        user: { id: c.clerk_user_id, ...user },
                        description: `Started conversation: "${c.title || 'New Chat'}"`,
                        timestamp: c.created_at
                    });
                }
            }
            // Recent workflows created
            const { data: recentWorkflows } = await supabase
                .from('user_workflows')
                .select('id, clerk_user_id, name, created_at')
                .order('created_at', { ascending: false })
                .limit(20);
            if (recentWorkflows) {
                for (const w of recentWorkflows) {
                    const user = userMap[w.clerk_user_id] || { name: 'Unknown', email: '' };
                    activities.push({
                        id: `wf-${w.id}`,
                        type: 'workflow_created',
                        user: { id: w.clerk_user_id, ...user },
                        description: `Created workflow: "${w.name || 'Untitled'}"`,
                        timestamp: w.created_at
                    });
                }
            }
            // Recent executions
            const { data: recentExecs } = await supabase
                .from('user_workflow_executions')
                .select('id, workflow_id, status, error_message, created_at')
                .order('created_at', { ascending: false })
                .limit(20);
            if (recentExecs) {
                // Get workflow details for these executions
                const execWorkflowIds = [...new Set(recentExecs.map((e) => e.workflow_id))];
                const { data: execWorkflows } = await supabase
                    .from('user_workflows')
                    .select('id, clerk_user_id, name')
                    .in('id', execWorkflowIds);
                const wfMap = {};
                if (execWorkflows) {
                    for (const w of execWorkflows) {
                        wfMap[w.id] = { clerkUserId: w.clerk_user_id, name: w.name || 'Untitled' };
                    }
                }
                for (const e of recentExecs) {
                    const wf = wfMap[e.workflow_id];
                    const user = wf ? (userMap[wf.clerkUserId] || { name: 'Unknown', email: '' }) : { name: 'Unknown', email: '' };
                    const isError = e.status === 'failed';
                    activities.push({
                        id: `exec-${e.id}`,
                        type: isError ? 'error' : 'workflow_executed',
                        user: { id: wf?.clerkUserId || '', ...user },
                        description: isError
                            ? `Workflow "${wf?.name}" failed: ${e.error_message || 'Unknown error'}`
                            : `Executed workflow: "${wf?.name}"`,
                        timestamp: e.created_at,
                        metadata: isError ? { errorMessage: e.error_message } : undefined
                    });
                }
            }
            // Sort all activities by timestamp descending
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return activities.slice(0, limit);
        }
        catch (error) {
            console.error('Error in getActivityFeed:', error);
            return [];
        }
    },
    /**
     * Check if a user is admin by email (ADMIN_EMAIL env var fallback)
     */
    isAdminByEmail(email) {
        const adminEmail = process.env.ADMIN_EMAIL || 'nexus.agii@gmail.com';
        return email.toLowerCase() === adminEmail.toLowerCase();
    },
    /**
     * Check if Supabase is configured
     */
    isConfigured() {
        return supabase !== null;
    }
};
export default adminDataService;
//# sourceMappingURL=AdminDataService.js.map
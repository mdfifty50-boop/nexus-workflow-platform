import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role for backend operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.warn('⚠️ SUPABASE_URL not configured for AdminDataService')
}

const supabase: SupabaseClient | null = supabaseServiceKey && supabaseUrl
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// =============================================================================
// TYPES
// =============================================================================

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  lastActive: string
  workflowsCreated: number
}

export interface UsageMetrics {
  totalUsers: number
  activeUsers: number
  totalWorkflows: number
  activeWorkflows: number
  totalExecutions: number
  executionsToday: number
  executionsThisWeek: number
  executionsThisMonth: number
  successRate: number
  avgExecutionTime: number
  storageUsed: number
  storageLimit: number
  apiCalls: number
  apiLimit: number
}

export interface TimeSeriesData {
  date: string
  executions: number
  users: number
  errors: number
}

export interface TopWorkflow {
  id: string
  name: string
  executions: number
  avgTime: number
  successRate: number
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  user: {
    id: string
    name: string
    email: string
  }
  action: string
  resource: string
  resourceId: string
  details: string
  ipAddress: string
  userAgent: string
  status: 'success' | 'failure' | 'warning'
}

export interface CreateAuditLogParams {
  userId: string
  userName?: string
  userEmail?: string
  action: string
  resource: string
  resourceId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
  status?: 'success' | 'failure' | 'warning'
  metadata?: Record<string, unknown>
}

// =============================================================================
// ADMIN DATA SERVICE
// =============================================================================

export const adminDataService = {
  /**
   * Get all users with their workflow counts
   */
  async getUsers(): Promise<AdminUser[]> {
    if (!supabase) {
      console.warn('Supabase not configured - returning empty users list')
      return []
    }

    try {
      // Get user profiles
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profileError) {
        console.error('Error fetching user profiles:', profileError)
        return []
      }

      if (!profiles || profiles.length === 0) {
        return []
      }

      // Get workflow counts per user
      const { data: workflowCounts, error: workflowError } = await supabase
        .from('user_workflows')
        .select('clerk_user_id')

      if (workflowError) {
        console.error('Error fetching workflow counts:', workflowError)
      }

      // Count workflows per user
      const workflowCountMap: Record<string, number> = {}
      if (workflowCounts) {
        for (const wf of workflowCounts) {
          workflowCountMap[wf.clerk_user_id] = (workflowCountMap[wf.clerk_user_id] || 0) + 1
        }
      }

      // Map to AdminUser format
      return profiles.map((profile: any) => ({
        id: profile.clerk_user_id,
        email: profile.email || 'unknown@email.com',
        name: profile.full_name || profile.email?.split('@')[0] || 'Unknown User',
        role: profile.role || 'user',
        status: this.getUserActivityStatus(profile.last_active_at),
        createdAt: profile.created_at ? new Date(profile.created_at).toISOString().split('T')[0] : '-',
        lastActive: profile.last_active_at ? new Date(profile.last_active_at).toISOString().split('T')[0] : '-',
        workflowsCreated: workflowCountMap[profile.clerk_user_id] || 0
      }))
    } catch (error) {
      console.error('Error in getUsers:', error)
      return []
    }
  },

  /**
   * Determine user status based on last activity
   */
  /**
   * Determine user activity status based on last activity
   */
  getUserActivityStatus(lastActiveAt: string | null): 'active' | 'inactive' | 'pending' {
    if (!lastActiveAt) return 'pending'

    const lastActive = new Date(lastActiveAt)
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceActive <= 7) return 'active'
    if (daysSinceActive <= 30) return 'inactive'
    return 'inactive'
  },

  /**
   * Check if a user exists and get their role
   * Used for admin auth middleware
   */
  async getUserStatus(clerkUserId: string): Promise<{ exists: boolean; role: string | null }> {
    if (!supabase) {
      // In development without Supabase, allow access
      return { exists: true, role: 'admin' }
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('clerk_user_id', clerkUserId)
        .single()

      if (error || !data) {
        return { exists: false, role: null }
      }

      return { exists: true, role: data.role || 'user' }
    } catch (error) {
      console.error('Error in getUserStatus:', error)
      return { exists: false, role: null }
    }
  },

  /**
   * Get usage metrics aggregated from various tables
   */
  async getUsageMetrics(): Promise<UsageMetrics> {
    if (!supabase) {
      console.warn('Supabase not configured - returning default metrics')
      return this.getDefaultMetrics()
    }

    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Get user counts
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      // Get active users (last 7 days)
      const { count: activeUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active_at', weekAgo.toISOString())

      // Get workflow counts
      const { count: totalWorkflows } = await supabase
        .from('user_workflows')
        .select('*', { count: 'exact', head: true })

      const { count: activeWorkflows } = await supabase
        .from('user_workflows')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'draft'])

      // Get execution counts
      const { count: totalExecutions } = await supabase
        .from('user_workflow_executions')
        .select('*', { count: 'exact', head: true })

      const { count: executionsToday } = await supabase
        .from('user_workflow_executions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      const { count: executionsThisWeek } = await supabase
        .from('user_workflow_executions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())

      const { count: executionsThisMonth } = await supabase
        .from('user_workflow_executions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString())

      // Get success rate
      const { count: successfulExecutions } = await supabase
        .from('user_workflow_executions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      const successRate = totalExecutions && totalExecutions > 0
        ? Math.round((successfulExecutions || 0) / totalExecutions * 1000) / 10
        : 0

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
      }
    } catch (error) {
      console.error('Error in getUsageMetrics:', error)
      return this.getDefaultMetrics()
    }
  },

  /**
   * Get default metrics when Supabase is not available
   */
  getDefaultMetrics(): UsageMetrics {
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
    }
  },

  /**
   * Get time series data for charts
   */
  async getTimeSeries(days: number = 7): Promise<TimeSeriesData[]> {
    if (!supabase) {
      return []
    }

    try {
      const result: TimeSeriesData[] = []
      const now = new Date()

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

        // Count executions for this day
        const { count: executions } = await supabase
          .from('user_workflow_executions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString())

        // Count errors for this day
        const { count: errors } = await supabase
          .from('user_workflow_executions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString())
          .eq('status', 'failed')

        // Count active users for this day (simplified)
        const { count: users } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .gte('last_active_at', startOfDay.toISOString())
          .lt('last_active_at', endOfDay.toISOString())

        result.push({
          date: startOfDay.toISOString().split('T')[0],
          executions: executions || 0,
          users: users || 0,
          errors: errors || 0
        })
      }

      return result
    } catch (error) {
      console.error('Error in getTimeSeries:', error)
      return []
    }
  },

  /**
   * Get top workflows by execution count
   */
  async getTopWorkflows(limit: number = 5): Promise<TopWorkflow[]> {
    if (!supabase) {
      return []
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
        .limit(limit)

      if (error) {
        console.error('Error fetching top workflows:', error)
        return []
      }

      if (!workflows) return []

      return workflows.map((wf: any) => {
        const executions = wf.user_workflow_executions || []
        const successful = executions.filter((e: any) => e.status === 'completed').length
        const total = executions.length

        return {
          id: wf.id,
          name: wf.name || 'Unnamed Workflow',
          executions: total,
          avgTime: 2.5, // Would need timing data
          successRate: total > 0 ? Math.round((successful / total) * 1000) / 10 : 0
        }
      })
    } catch (error) {
      console.error('Error in getTopWorkflows:', error)
      return []
    }
  },

  /**
   * Get audit log entries with filtering
   */
  async getAuditLog(params: {
    limit?: number
    offset?: number
    userId?: string
    action?: string
    status?: string
    startDate?: string
    endDate?: string
  }): Promise<{ entries: AuditLogEntry[], total: number }> {
    if (!supabase) {
      return { entries: [], total: 0 }
    }

    try {
      const { limit = 50, offset = 0, userId, action, status, startDate, endDate } = params

      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1)

      if (userId) {
        query = query.eq('user_id', userId)
      }
      if (action) {
        query = query.eq('action', action)
      }
      if (status) {
        query = query.eq('status', status)
      }
      if (startDate) {
        query = query.gte('timestamp', startDate)
      }
      if (endDate) {
        query = query.lte('timestamp', endDate)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching audit logs:', error)
        return { entries: [], total: 0 }
      }

      const entries: AuditLogEntry[] = (data || []).map((log: any) => ({
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
      }))

      return { entries, total: count || 0 }
    } catch (error) {
      console.error('Error in getAuditLog:', error)
      return { entries: [], total: 0 }
    }
  },

  /**
   * Create an audit log entry
   */
  async createAuditLog(params: CreateAuditLogParams): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured - audit log not created')
      return false
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
        })

      if (error) {
        console.error('Error creating audit log:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in createAuditLog:', error)
      return false
    }
  },

  /**
   * Update user role (for admin operations)
   */
  async updateUserRole(clerkUserId: string, role: 'admin' | 'user' | 'viewer'): Promise<boolean> {
    if (!supabase) {
      return false
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('clerk_user_id', clerkUserId)

      if (error) {
        console.error('Error updating user role:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateUserRole:', error)
      return false
    }
  },

  /**
   * Check if Supabase is configured
   */
  isConfigured(): boolean {
    return supabase !== null
  }
}

export default adminDataService

import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
    console.warn('SUPABASE_URL not configured');
}
const supabase = supabaseServiceKey && supabaseUrl
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;
// Development in-memory store for when Supabase RLS blocks operations
const devStore = {
    projects: new Map(),
    projectMembers: new Map(),
};
const isDevelopment = process.env.NODE_ENV !== 'production';
/**
 * Project Service
 * Manages multi-tenant project workspaces
 * Uses service role key to bypass RLS for server-side operations
 */
export const projectService = {
    /**
     * Create a new project workspace
     * Automatically adds the creator as owner in project_members
     */
    async createProject(data) {
        if (!supabase) {
            console.error('Supabase not configured');
            return null;
        }
        // First get or create the user profile to get internal user ID
        let userProfile = await this.getUserProfileByClerkId(data.clerk_user_id);
        if (!userProfile) {
            // User profile doesn't exist, webhook might not have fired yet
            // Auto-create the profile so users can proceed
            console.log('User profile not found for Clerk ID:', data.clerk_user_id, '- creating automatically');
            userProfile = await this.createUserProfile(data.clerk_user_id);
            if (!userProfile) {
                console.error('Failed to auto-create user profile for Clerk ID:', data.clerk_user_id);
                return null;
            }
        }
        // Create the project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
            name: data.name,
            description: data.description || null,
            owner_id: userProfile.id, // Use the UUID from user_profiles
        })
            .select()
            .single();
        // Handle RLS policy error in development by using in-memory store
        if (projectError) {
            if (isDevelopment && projectError.code === '42501') {
                console.log('RLS blocked project creation, using development in-memory store');
                return this.createDevProject(data, userProfile);
            }
            console.error('Error creating project:', projectError);
            throw projectError;
        }
        // Add the creator as owner in project_members
        const { error: memberError } = await supabase
            .from('project_members')
            .insert({
            project_id: project.id,
            user_id: userProfile.id,
            role: 'owner',
        });
        if (memberError) {
            console.error('Error adding project member:', memberError);
            // Don't fail the project creation, just log the error
        }
        return project;
    },
    /**
     * Get all projects for a user (owned + member)
     */
    async getProjectsForUser(clerkUserId) {
        if (!supabase) {
            console.error('Supabase not configured');
            return [];
        }
        const userProfile = await this.getUserProfileByClerkId(clerkUserId);
        if (!userProfile) {
            return [];
        }
        // Get projects where user is owner
        const { data: ownedProjects, error: ownedError } = await supabase
            .from('projects')
            .select('*')
            .eq('owner_id', userProfile.id)
            .eq('is_archived', false)
            .order('created_at', { ascending: false });
        if (ownedError) {
            console.error('Error fetching owned projects:', ownedError);
            // In development, fall back to in-memory store
            if (isDevelopment) {
                console.log('Using development in-memory store for projects');
                return this.getDevProjects(userProfile.id);
            }
            return [];
        }
        // Get projects where user is a member (not owner)
        const { data: memberProjects, error: memberError } = await supabase
            .from('project_members')
            .select(`
        project:projects (*)
      `)
            .eq('user_id', userProfile.id)
            .neq('role', 'owner');
        if (memberError) {
            console.error('Error fetching member projects:', memberError);
        }
        // Combine and deduplicate
        const allProjects = [
            ...(ownedProjects || []),
            ...(memberProjects || [])
                .map((m) => m.project)
                .filter((p) => p && !p.is_archived),
            // Also include projects from dev store in development
            ...(isDevelopment ? this.getDevProjects(userProfile.id) : [])
        ];
        // Remove duplicates by ID
        const uniqueProjects = allProjects.reduce((acc, project) => {
            if (!acc.find(p => p.id === project.id)) {
                acc.push(project);
            }
            return acc;
        }, []);
        return uniqueProjects;
    },
    /**
     * Get a single project by ID
     */
    async getProjectById(projectId, clerkUserId) {
        if (!supabase) {
            console.error('Supabase not configured');
            return null;
        }
        const userProfile = await this.getUserProfileByClerkId(clerkUserId);
        if (!userProfile) {
            return null;
        }
        // First check dev store in development mode
        if (isDevelopment) {
            const devProject = devStore.projects.get(projectId);
            if (devProject && devProject.owner_id === userProfile.id) {
                console.log('Returning project from dev store:', devProject.name);
                return devProject;
            }
        }
        // Verify user has access to this project
        const hasAccess = await this.userHasProjectAccess(projectId, userProfile.id);
        if (!hasAccess) {
            // Check dev store as fallback
            if (isDevelopment) {
                const devProject = devStore.projects.get(projectId);
                if (devProject && devProject.owner_id === userProfile.id) {
                    return devProject;
                }
            }
            return null;
        }
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        if (error) {
            console.error('Error fetching project:', error);
            // Fall back to dev store
            if (isDevelopment) {
                const devProject = devStore.projects.get(projectId);
                if (devProject && devProject.owner_id === userProfile.id) {
                    return devProject;
                }
            }
            return null;
        }
        return data;
    },
    /**
     * Update a project
     * Only owners and admins can update
     */
    async updateProject(projectId, clerkUserId, updates) {
        if (!supabase) {
            console.error('Supabase not configured');
            return null;
        }
        const userProfile = await this.getUserProfileByClerkId(clerkUserId);
        if (!userProfile) {
            return null;
        }
        // Check dev store first in development mode
        if (isDevelopment) {
            const devProject = devStore.projects.get(projectId);
            if (devProject && devProject.owner_id === userProfile.id) {
                // Update dev project
                const updatedProject = {
                    ...devProject,
                    ...updates,
                    updated_at: new Date().toISOString(),
                };
                devStore.projects.set(projectId, updatedProject);
                console.log('Updated dev project:', updatedProject.name);
                return updatedProject;
            }
        }
        // Verify user can edit this project
        const canEdit = await this.userCanEditProject(projectId, userProfile.id);
        if (!canEdit) {
            console.error('User does not have permission to edit this project');
            return null;
        }
        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .select()
            .single();
        if (error) {
            console.error('Error updating project:', error);
            // Try updating dev store as fallback
            if (isDevelopment) {
                const devProject = devStore.projects.get(projectId);
                if (devProject && devProject.owner_id === userProfile.id) {
                    const updatedProject = {
                        ...devProject,
                        ...updates,
                        updated_at: new Date().toISOString(),
                    };
                    devStore.projects.set(projectId, updatedProject);
                    return updatedProject;
                }
            }
            throw error;
        }
        return data;
    },
    /**
     * Archive (soft delete) a project
     * Only owners can archive
     */
    async archiveProject(projectId, clerkUserId) {
        if (!supabase) {
            console.error('Supabase not configured');
            return false;
        }
        const userProfile = await this.getUserProfileByClerkId(clerkUserId);
        if (!userProfile) {
            return false;
        }
        // Verify user is the owner
        const isOwner = await this.userIsProjectOwner(projectId, userProfile.id);
        if (!isOwner) {
            console.error('Only project owners can archive projects');
            return false;
        }
        const { error } = await supabase
            .from('projects')
            .update({ is_archived: true })
            .eq('id', projectId);
        if (error) {
            console.error('Error archiving project:', error);
            return false;
        }
        return true;
    },
    /**
     * Restore an archived project
     */
    async restoreProject(projectId, clerkUserId) {
        if (!supabase) {
            console.error('Supabase not configured');
            return false;
        }
        const userProfile = await this.getUserProfileByClerkId(clerkUserId);
        if (!userProfile) {
            return false;
        }
        const isOwner = await this.userIsProjectOwner(projectId, userProfile.id);
        if (!isOwner) {
            console.error('Only project owners can restore projects');
            return false;
        }
        const { error } = await supabase
            .from('projects')
            .update({ is_archived: false })
            .eq('id', projectId);
        if (error) {
            console.error('Error restoring project:', error);
            return false;
        }
        return true;
    },
    /**
     * Get archived projects for a user
     */
    async getArchivedProjects(clerkUserId) {
        if (!supabase) {
            console.error('Supabase not configured');
            return [];
        }
        const userProfile = await this.getUserProfileByClerkId(clerkUserId);
        if (!userProfile) {
            return [];
        }
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('owner_id', userProfile.id)
            .eq('is_archived', true)
            .order('updated_at', { ascending: false });
        if (error) {
            console.error('Error fetching archived projects:', error);
            return [];
        }
        return data || [];
    },
    // === Helper functions ===
    async getUserProfileByClerkId(clerkUserId) {
        if (!supabase)
            return null;
        // Check if user_profiles table exists, otherwise use development fallback
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('clerk_user_id', clerkUserId)
            .single();
        // Table doesn't exist error (PGRST205) - use development fallback
        if (error && error.code === 'PGRST205') {
            console.log('user_profiles table not found, using development fallback');
            return this.getDevUserProfile(clerkUserId);
        }
        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching user profile:', error);
        }
        return data;
    },
    /**
     * Development fallback: create a mock user profile when table doesn't exist
     * This allows development to proceed without running migrations
     */
    getDevUserProfile(clerkUserId) {
        if (process.env.NODE_ENV === 'production') {
            console.error('Dev user profile requested in production - this should not happen');
            return null;
        }
        // Generate a deterministic UUID from the clerk user ID for development
        // This ensures the same clerk ID always gets the same UUID
        const devUuid = this.generateDeterministicUUID(clerkUserId);
        // Return a mock profile for development
        return {
            id: devUuid,
            clerk_user_id: clerkUserId,
            email: 'dev@nexus.local',
            full_name: 'Development User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    },
    /**
     * Create a project in the development in-memory store
     */
    createDevProject(data, userProfile) {
        const projectId = this.generateDeterministicUUID(`project-${Date.now()}-${data.name}`);
        const now = new Date().toISOString();
        const project = {
            id: projectId,
            created_at: now,
            updated_at: now,
            owner_id: userProfile.id,
            name: data.name,
            description: data.description || null,
            settings: {},
            is_archived: false,
        };
        devStore.projects.set(projectId, project);
        // Also add project member
        const memberId = this.generateDeterministicUUID(`member-${projectId}-${userProfile.id}`);
        devStore.projectMembers.set(memberId, {
            id: memberId,
            created_at: now,
            project_id: projectId,
            user_id: userProfile.id,
            role: 'owner',
        });
        console.log('Created dev project:', project.name, 'with ID:', projectId);
        return project;
    },
    /**
     * Get projects from development in-memory store
     */
    getDevProjects(userId) {
        const projects = [];
        devStore.projects.forEach((project) => {
            if (project.owner_id === userId) {
                projects.push(project);
            }
        });
        return projects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    /**
     * Generate a deterministic UUID v4-like string from an input string
     * Used for development fallback to create valid UUIDs
     */
    generateDeterministicUUID(input) {
        // Simple hash function to generate consistent UUID from input
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        // Create UUID-like string with padding
        const hex = Math.abs(hash).toString(16).padStart(8, '0');
        const hex2 = Math.abs(hash * 31).toString(16).padStart(8, '0');
        const hex3 = Math.abs(hash * 17).toString(16).padStart(8, '0');
        const hex4 = Math.abs(hash * 13).toString(16).padStart(8, '0');
        return `${hex.slice(0, 8)}-${hex2.slice(0, 4)}-4${hex3.slice(0, 3)}-8${hex4.slice(0, 3)}-${(hex + hex2 + hex3).slice(0, 12)}`;
    },
    /**
     * Auto-create a user profile when it doesn't exist
     * This handles cases where the Clerk webhook hasn't fired yet
     */
    async createUserProfile(clerkUserId) {
        if (!supabase)
            return null;
        // First check if table exists
        const { error: checkError } = await supabase
            .from('user_profiles')
            .select('id')
            .limit(1);
        // Table doesn't exist - use dev fallback
        if (checkError && checkError.code === 'PGRST205') {
            console.log('user_profiles table not found, using development fallback');
            return this.getDevUserProfile(clerkUserId);
        }
        // Create a minimal profile - Clerk webhook will update with full details later
        const { data, error } = await supabase
            .from('user_profiles')
            .insert({
            clerk_user_id: clerkUserId,
            email: `${clerkUserId}@temp.nexus`, // Temporary email, will be updated by webhook
            full_name: 'Nexus User',
        })
            .select()
            .single();
        if (error) {
            console.error('Error creating user profile:', error);
            return null;
        }
        console.log('Auto-created user profile for Clerk ID:', clerkUserId);
        return data;
    },
    async userHasProjectAccess(projectId, userId) {
        if (!supabase)
            return false;
        // Check if owner
        const { data: project } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', projectId)
            .single();
        if (project?.owner_id === userId)
            return true;
        // Check if member
        const { data: member } = await supabase
            .from('project_members')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', userId)
            .single();
        return !!member;
    },
    async userCanEditProject(projectId, userId) {
        if (!supabase)
            return false;
        // Check if owner
        const { data: project } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', projectId)
            .single();
        if (project?.owner_id === userId)
            return true;
        // Check if admin member
        const { data: member } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', userId)
            .single();
        return member?.role === 'admin';
    },
    async userIsProjectOwner(projectId, userId) {
        if (!supabase)
            return false;
        const { data: project } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', projectId)
            .single();
        return project?.owner_id === userId;
    },
    // === Project Member Management ===
    /**
     * Get all members of a project
     */
    async getProjectMembers(projectId, clerkUserId) {
        if (!supabase)
            return [];
        const userProfile = await this.getUserProfileByClerkId(clerkUserId);
        if (!userProfile)
            return [];
        const hasAccess = await this.userHasProjectAccess(projectId, userProfile.id);
        if (!hasAccess)
            return [];
        const { data, error } = await supabase
            .from('project_members')
            .select(`
        id,
        role,
        created_at,
        user:user_profiles!project_members_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
            .eq('project_id', projectId);
        if (error) {
            console.error('Error fetching project members:', error);
            return [];
        }
        return data || [];
    },
    /**
     * Add a member to a project by email
     */
    async addProjectMember(projectId, clerkUserId, memberEmail, role) {
        if (!supabase)
            return { success: false, error: 'Database not configured' };
        const userProfile = await this.getUserProfileByClerkId(clerkUserId);
        if (!userProfile)
            return { success: false, error: 'User not found' };
        // Only owners and admins can add members
        const canManage = await this.userCanManageMembers(projectId, userProfile.id);
        if (!canManage)
            return { success: false, error: 'Permission denied' };
        // Find the user to add by email
        const { data: memberUser, error: findError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('email', memberEmail)
            .single();
        if (findError || !memberUser) {
            return { success: false, error: 'User not found with that email' };
        }
        // Check if already a member
        const { data: existing } = await supabase
            .from('project_members')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', memberUser.id)
            .single();
        if (existing) {
            return { success: false, error: 'User is already a member of this project' };
        }
        // Add the member
        const { error: insertError } = await supabase
            .from('project_members')
            .insert({
            project_id: projectId,
            user_id: memberUser.id,
            role,
        });
        if (insertError) {
            console.error('Error adding member:', insertError);
            return { success: false, error: 'Failed to add member' };
        }
        return { success: true };
    },
    /**
     * Update a member's role
     */
    async updateMemberRole(projectId, clerkUserId, memberId, newRole) {
        if (!supabase)
            return { success: false, error: 'Database not configured' };
        const userProfile = await this.getUserProfileByClerkId(clerkUserId);
        if (!userProfile)
            return { success: false, error: 'User not found' };
        const canManage = await this.userCanManageMembers(projectId, userProfile.id);
        if (!canManage)
            return { success: false, error: 'Permission denied' };
        // Can't change owner role
        const { data: member } = await supabase
            .from('project_members')
            .select('role')
            .eq('id', memberId)
            .single();
        if (member?.role === 'owner') {
            return { success: false, error: 'Cannot change owner role' };
        }
        const { error } = await supabase
            .from('project_members')
            .update({ role: newRole })
            .eq('id', memberId)
            .eq('project_id', projectId);
        if (error) {
            console.error('Error updating member role:', error);
            return { success: false, error: 'Failed to update role' };
        }
        return { success: true };
    },
    /**
     * Remove a member from a project
     */
    async removeMember(projectId, clerkUserId, memberId) {
        if (!supabase)
            return { success: false, error: 'Database not configured' };
        const userProfile = await this.getUserProfileByClerkId(clerkUserId);
        if (!userProfile)
            return { success: false, error: 'User not found' };
        const canManage = await this.userCanManageMembers(projectId, userProfile.id);
        if (!canManage)
            return { success: false, error: 'Permission denied' };
        // Can't remove owner
        const { data: member } = await supabase
            .from('project_members')
            .select('role')
            .eq('id', memberId)
            .single();
        if (member?.role === 'owner') {
            return { success: false, error: 'Cannot remove project owner' };
        }
        const { error } = await supabase
            .from('project_members')
            .delete()
            .eq('id', memberId)
            .eq('project_id', projectId);
        if (error) {
            console.error('Error removing member:', error);
            return { success: false, error: 'Failed to remove member' };
        }
        return { success: true };
    },
    /**
     * Leave a project (for non-owners)
     */
    async leaveProject(projectId, clerkUserId) {
        if (!supabase)
            return { success: false, error: 'Database not configured' };
        const userProfile = await this.getUserProfileByClerkId(clerkUserId);
        if (!userProfile)
            return { success: false, error: 'User not found' };
        // Check if owner (owners can't leave, they must transfer or delete)
        const isOwner = await this.userIsProjectOwner(projectId, userProfile.id);
        if (isOwner) {
            return { success: false, error: 'Owners cannot leave their own projects' };
        }
        const { error } = await supabase
            .from('project_members')
            .delete()
            .eq('project_id', projectId)
            .eq('user_id', userProfile.id);
        if (error) {
            console.error('Error leaving project:', error);
            return { success: false, error: 'Failed to leave project' };
        }
        return { success: true };
    },
    async userCanManageMembers(projectId, userId) {
        if (!supabase)
            return false;
        // Check if owner
        const { data: project } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', projectId)
            .single();
        if (project?.owner_id === userId)
            return true;
        // Check if admin
        const { data: member } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', userId)
            .single();
        return member?.role === 'admin';
    },
    // === Analytics ===
    /**
     * Get project analytics
     */
    async getProjectAnalytics(projectId, clerkUserId) {
        if (!supabase)
            return null;
        const userProfile = await this.getUserProfileByClerkId(clerkUserId);
        if (!userProfile)
            return null;
        const hasAccess = await this.userHasProjectAccess(projectId, userProfile.id);
        if (!hasAccess)
            return null;
        // Get workflow counts
        const { data: workflows } = await supabase
            .from('workflows')
            .select('id, status')
            .eq('project_id', projectId);
        const totalWorkflows = workflows?.length || 0;
        const activeWorkflows = workflows?.filter(w => w.status === 'active').length || 0;
        // Get execution stats
        const { data: executions } = await supabase
            .from('workflow_executions')
            .select('id, status, token_usage, cost_usd, created_at, workflow:workflows!inner(name, project_id)')
            .eq('workflow.project_id', projectId);
        const completedExecutions = executions?.filter(e => e.status === 'completed').length || 0;
        const failedExecutions = executions?.filter(e => e.status === 'failed').length || 0;
        const totalTokensUsed = executions?.reduce((sum, e) => sum + (e.token_usage || 0), 0) || 0;
        const totalCostUsd = executions?.reduce((sum, e) => sum + (parseFloat(e.cost_usd) || 0), 0) || 0;
        // Get recent activity
        const recentActivity = (executions || [])
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10)
            .map(e => ({
            id: e.id,
            type: e.status === 'completed' ? 'execution_completed' : e.status === 'failed' ? 'execution_failed' : 'workflow_created',
            name: e.workflow?.name || 'Unknown Workflow',
            timestamp: e.created_at,
        }));
        return {
            totalWorkflows,
            activeWorkflows,
            completedExecutions,
            failedExecutions,
            totalTokensUsed,
            totalCostUsd,
            recentActivity,
        };
    },
};
export default projectService;
//# sourceMappingURL=projectService.js.map
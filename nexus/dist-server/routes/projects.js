import { Router } from 'express';
import { projectService } from '../services/projectService.js';
const router = Router();
/**
 * Project API Routes
 * All routes require clerk_user_id in the request body or headers
 */
// Middleware to extract clerk_user_id
const extractClerkUserId = (req, res, next) => {
    const clerkUserId = req.headers['x-clerk-user-id'] || req.body?.clerk_user_id;
    if (!clerkUserId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    req.body.clerk_user_id = clerkUserId;
    next();
};
/**
 * GET /api/projects
 * Get all projects for the authenticated user
 */
router.get('/', extractClerkUserId, async (req, res) => {
    try {
        const clerkUserId = req.body.clerk_user_id;
        const projects = await projectService.getProjectsForUser(clerkUserId);
        res.json({ success: true, data: projects });
    }
    catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch projects' });
    }
});
/**
 * GET /api/projects/archived
 * Get archived projects for the authenticated user
 */
router.get('/archived', extractClerkUserId, async (req, res) => {
    try {
        const clerkUserId = req.body.clerk_user_id;
        const projects = await projectService.getArchivedProjects(clerkUserId);
        res.json({ success: true, data: projects });
    }
    catch (error) {
        console.error('Error fetching archived projects:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch archived projects' });
    }
});
/**
 * GET /api/projects/:id
 * Get a single project by ID
 */
router.get('/:id', extractClerkUserId, async (req, res) => {
    try {
        const clerkUserId = req.body.clerk_user_id;
        const project = await projectService.getProjectById(req.params.id, clerkUserId);
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found or access denied' });
        }
        res.json({ success: true, data: project });
    }
    catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch project' });
    }
});
/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', extractClerkUserId, async (req, res) => {
    try {
        const { name, description, clerk_user_id } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'Project name is required' });
        }
        const project = await projectService.createProject({
            name: name.trim(),
            description: description?.trim(),
            clerk_user_id,
        });
        if (!project) {
            return res.status(500).json({ success: false, error: 'Failed to create project. User profile may not exist.' });
        }
        res.status(201).json({ success: true, data: project });
    }
    catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to create project' });
    }
});
/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put('/:id', extractClerkUserId, async (req, res) => {
    try {
        const { name, description, settings, clerk_user_id } = req.body;
        const project = await projectService.updateProject(req.params.id, clerk_user_id, {
            name: name?.trim(),
            description: description?.trim(),
            settings,
        });
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found or access denied' });
        }
        res.json({ success: true, data: project });
    }
    catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to update project' });
    }
});
/**
 * DELETE /api/projects/:id
 * Archive (soft delete) a project
 */
router.delete('/:id', extractClerkUserId, async (req, res) => {
    try {
        const clerkUserId = req.body.clerk_user_id;
        const success = await projectService.archiveProject(req.params.id, clerkUserId);
        if (!success) {
            return res.status(404).json({ success: false, error: 'Project not found or access denied' });
        }
        res.json({ success: true, message: 'Project archived successfully' });
    }
    catch (error) {
        console.error('Error archiving project:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to archive project' });
    }
});
/**
 * POST /api/projects/:id/restore
 * Restore an archived project
 */
router.post('/:id/restore', extractClerkUserId, async (req, res) => {
    try {
        const clerkUserId = req.body.clerk_user_id;
        const success = await projectService.restoreProject(req.params.id, clerkUserId);
        if (!success) {
            return res.status(404).json({ success: false, error: 'Project not found or access denied' });
        }
        res.json({ success: true, message: 'Project restored successfully' });
    }
    catch (error) {
        console.error('Error restoring project:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to restore project' });
    }
});
// === Analytics Routes ===
/**
 * GET /api/projects/:id/analytics
 * Get project analytics (workflow stats, executions, costs)
 */
router.get('/:id/analytics', extractClerkUserId, async (req, res) => {
    try {
        const clerkUserId = req.body.clerk_user_id;
        const analytics = await projectService.getProjectAnalytics(req.params.id, clerkUserId);
        if (!analytics) {
            return res.status(404).json({ success: false, error: 'Project not found or access denied' });
        }
        res.json({ success: true, data: analytics });
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch analytics' });
    }
});
// === Member Management Routes ===
/**
 * GET /api/projects/:id/members
 * Get all members of a project
 */
router.get('/:id/members', extractClerkUserId, async (req, res) => {
    try {
        const clerkUserId = req.body.clerk_user_id;
        const members = await projectService.getProjectMembers(req.params.id, clerkUserId);
        res.json({ success: true, data: members });
    }
    catch (error) {
        console.error('Error fetching project members:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch members' });
    }
});
/**
 * POST /api/projects/:id/members
 * Add a member to a project
 */
router.post('/:id/members', extractClerkUserId, async (req, res) => {
    try {
        const { email, role, clerk_user_id } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }
        if (!['admin', 'member', 'viewer'].includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid role' });
        }
        const result = await projectService.addProjectMember(req.params.id, clerk_user_id, email, role);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.status(201).json({ success: true, message: 'Member added successfully' });
    }
    catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to add member' });
    }
});
/**
 * PUT /api/projects/:id/members/:memberId
 * Update a member's role
 */
router.put('/:id/members/:memberId', extractClerkUserId, async (req, res) => {
    try {
        const { role, clerk_user_id } = req.body;
        if (!['admin', 'member', 'viewer'].includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid role' });
        }
        const result = await projectService.updateMemberRole(req.params.id, clerk_user_id, req.params.memberId, role);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, message: 'Member role updated' });
    }
    catch (error) {
        console.error('Error updating member role:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to update role' });
    }
});
/**
 * DELETE /api/projects/:id/members/:memberId
 * Remove a member from a project
 */
router.delete('/:id/members/:memberId', extractClerkUserId, async (req, res) => {
    try {
        const clerkUserId = req.body.clerk_user_id;
        const result = await projectService.removeMember(req.params.id, clerkUserId, req.params.memberId);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, message: 'Member removed' });
    }
    catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to remove member' });
    }
});
/**
 * POST /api/projects/:id/leave
 * Leave a project (for non-owners)
 */
router.post('/:id/leave', extractClerkUserId, async (req, res) => {
    try {
        const clerkUserId = req.body.clerk_user_id;
        const result = await projectService.leaveProject(req.params.id, clerkUserId);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, message: 'Left project successfully' });
    }
    catch (error) {
        console.error('Error leaving project:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to leave project' });
    }
});
export default router;
//# sourceMappingURL=projects.js.map
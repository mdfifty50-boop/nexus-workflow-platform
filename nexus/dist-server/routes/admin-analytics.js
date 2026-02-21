/**
 * Admin Analytics API Routes
 *
 * Plan 2: Admin Dashboard - Real Analytics
 *
 * Handles:
 * - GET /users - Get all users with workflow counts
 * - GET /metrics - Get usage metrics
 * - GET /time-series - Get time series data for charts
 * - GET /top-workflows - Get top workflows by execution
 * - GET /audit-log - Get audit log entries
 * - POST /audit-log - Create audit log entry
 * - PATCH /users/:id/role - Update user role
 */
import { Router } from 'express';
import { adminDataService } from '../services/AdminDataService.js';
const router = Router();
// ============================================================================
// ADMIN AUTH MIDDLEWARE
// ============================================================================
/**
 * Middleware to verify admin access
 * In development mode, allows access with dev-user or missing auth
 * In production, requires valid clerk_user_id with admin role
 */
const requireAdminAuth = async (req, res, next) => {
    try {
        const clerkUserId = req.headers['x-clerk-user-id'];
        // Development mode bypass
        if (process.env.NODE_ENV !== 'production') {
            // Allow dev user or missing auth in development
            if (!clerkUserId || clerkUserId === 'dev-user-local') {
                return next();
            }
        }
        // Check if user exists and has admin role
        if (!clerkUserId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        // Check admin by email first (most reliable), then by role in DB
        const adminEmail = process.env.ADMIN_EMAIL || 'nexus.agii@gmail.com';
        const userEmail = req.headers['x-clerk-user-email'];
        // If email matches admin, allow immediately
        if (userEmail && userEmail.toLowerCase() === adminEmail.toLowerCase()) {
            return next();
        }
        // Get user status from database
        const userStatus = await adminDataService.getUserStatus(clerkUserId);
        if (!userStatus.exists) {
            // If user not in DB but has valid clerk ID, still allow if email matches
            return res.status(403).json({
                success: false,
                error: 'User not found'
            });
        }
        // Check admin by role
        if (userStatus.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }
        // User is authenticated and is admin - proceed
        next();
    }
    catch (error) {
        console.error('Admin auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};
// Apply admin auth to all routes except /status
router.use((req, res, next) => {
    // /status endpoint is public (used to check if admin features are configured)
    if (req.path === '/status') {
        return next();
    }
    return requireAdminAuth(req, res, next);
});
// ============================================================================
// GET /users - Get all users with workflow counts
// ============================================================================
router.get('/users', async (req, res) => {
    try {
        const users = await adminDataService.getUsers();
        res.json({
            success: true,
            data: users,
            total: users.length
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});
// ============================================================================
// GET /metrics - Get usage metrics
// ============================================================================
router.get('/metrics', async (req, res) => {
    try {
        const metrics = await adminDataService.getUsageMetrics();
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch metrics'
        });
    }
});
// ============================================================================
// GET /time-series - Get time series data for charts
// ============================================================================
router.get('/time-series', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const timeSeries = await adminDataService.getTimeSeries(days);
        res.json({
            success: true,
            data: timeSeries
        });
    }
    catch (error) {
        console.error('Error fetching time series:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch time series data'
        });
    }
});
// ============================================================================
// GET /top-workflows - Get top workflows by execution count
// ============================================================================
router.get('/top-workflows', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const topWorkflows = await adminDataService.getTopWorkflows(limit);
        res.json({
            success: true,
            data: topWorkflows
        });
    }
    catch (error) {
        console.error('Error fetching top workflows:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch top workflows'
        });
    }
});
// ============================================================================
// GET /audit-log - Get audit log entries with filtering
// ============================================================================
router.get('/audit-log', async (req, res) => {
    try {
        const { limit, offset, userId, action, status, startDate, endDate } = req.query;
        const result = await adminDataService.getAuditLog({
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
            userId: userId,
            action: action,
            status: status,
            startDate: startDate,
            endDate: endDate
        });
        res.json({
            success: true,
            data: result.entries,
            total: result.total
        });
    }
    catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit log'
        });
    }
});
// ============================================================================
// POST /audit-log - Create audit log entry
// ============================================================================
router.post('/audit-log', async (req, res) => {
    try {
        const { userId, userName, userEmail, action, resource, resourceId, details, status, metadata } = req.body;
        if (!userId || !action || !resource) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, action, resource'
            });
        }
        // Get IP and user agent from request
        const ipAddress = req.headers['x-forwarded-for'] || req.ip || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const created = await adminDataService.createAuditLog({
            userId,
            userName,
            userEmail,
            action,
            resource,
            resourceId,
            details,
            ipAddress,
            userAgent,
            status,
            metadata
        });
        if (created) {
            res.json({
                success: true,
                message: 'Audit log entry created'
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to create audit log entry'
            });
        }
    }
    catch (error) {
        console.error('Error creating audit log:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create audit log entry'
        });
    }
});
// ============================================================================
// PATCH /users/:id/role - Update user role
// ============================================================================
router.patch('/users/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role || !['admin', 'user', 'viewer'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be admin, user, or viewer'
            });
        }
        const updated = await adminDataService.updateUserRole(id, role);
        if (updated) {
            res.json({
                success: true,
                message: 'User role updated'
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to update user role'
            });
        }
    }
    catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user role'
        });
    }
});
// ============================================================================
// GET /users/:id - User detail drill-down
// ============================================================================
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userDetail = await adminDataService.getUserDetail(id);
        if (!userDetail) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        res.json({
            success: true,
            data: userDetail
        });
    }
    catch (error) {
        console.error('Error fetching user detail:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user detail'
        });
    }
});
// ============================================================================
// GET /users/:id/conversations - User's chat history
// ============================================================================
router.get('/users/:id/conversations', async (req, res) => {
    try {
        const { id } = req.params;
        const conversations = await adminDataService.getUserConversations(id);
        res.json({
            success: true,
            data: conversations
        });
    }
    catch (error) {
        console.error('Error fetching user conversations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user conversations'
        });
    }
});
// ============================================================================
// GET /users/:id/workflows - User's workflows + executions
// ============================================================================
router.get('/users/:id/workflows', async (req, res) => {
    try {
        const { id } = req.params;
        const workflows = await adminDataService.getUserWorkflows(id);
        res.json({
            success: true,
            data: workflows
        });
    }
    catch (error) {
        console.error('Error fetching user workflows:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user workflows'
        });
    }
});
// ============================================================================
// GET /users/:id/errors - User's error log
// ============================================================================
router.get('/users/:id/errors', async (req, res) => {
    try {
        const { id } = req.params;
        const errors = await adminDataService.getUserErrors(id);
        res.json({
            success: true,
            data: errors
        });
    }
    catch (error) {
        console.error('Error fetching user errors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user errors'
        });
    }
});
// ============================================================================
// GET /activity-feed - Platform-wide activity stream
// ============================================================================
router.get('/activity-feed', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const activities = await adminDataService.getActivityFeed(limit);
        res.json({
            success: true,
            data: activities
        });
    }
    catch (error) {
        console.error('Error fetching activity feed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activity feed'
        });
    }
});
// ============================================================================
// POST /ai-insights - AI marketing analysis
// ============================================================================
router.post('/ai-insights', async (req, res) => {
    try {
        // Dynamic import to avoid loading Anthropic SDK if not needed
        const { adminInsightsEngine } = await import('../services/AdminInsightsEngine.js');
        const forceRefresh = req.body?.forceRefresh === true;
        const insights = await adminInsightsEngine.getInsights(forceRefresh);
        res.json({
            success: true,
            data: insights
        });
    }
    catch (error) {
        console.error('Error generating AI insights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate AI insights'
        });
    }
});
// ============================================================================
// GET /status - Check if admin analytics is configured
// ============================================================================
router.get('/status', async (req, res) => {
    res.json({
        success: true,
        configured: adminDataService.isConfigured()
    });
});
export default router;
//# sourceMappingURL=admin-analytics.js.map
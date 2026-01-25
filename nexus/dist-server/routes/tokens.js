import { Router } from 'express';
import { tokenService } from '../services/tokenService.js';
const router = Router();
// Middleware to extract Clerk user ID
const extractClerkUserId = (req, _res, next) => {
    const userId = req.headers['x-clerk-user-id'];
    if (userId) {
        req.body.clerk_user_id = userId;
    }
    next();
};
// =============================================================================
// Token Management Routes (Epic 9)
// =============================================================================
/**
 * GET /api/tokens/usage
 * Get token usage summary
 */
router.get('/usage', extractClerkUserId, async (req, res) => {
    const { project_id, start_date, end_date } = req.query;
    const clerkUserId = req.body.clerk_user_id;
    if (!clerkUserId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const summary = await tokenService.getUsageSummary(clerkUserId, project_id, start_date ? new Date(start_date) : undefined, end_date ? new Date(end_date) : undefined);
    // Add efficiency badge
    const badge = tokenService.getEfficiencyBadge(summary.efficiency);
    res.json({
        success: true,
        data: {
            ...summary,
            formattedCost: tokenService.formatCost(summary.totalCost),
            badge,
        },
    });
});
/**
 * GET /api/tokens/trend
 * Get daily usage trend
 */
router.get('/trend', extractClerkUserId, async (req, res) => {
    const { project_id, days } = req.query;
    const clerkUserId = req.body.clerk_user_id;
    if (!clerkUserId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const trend = await tokenService.getDailyUsageTrend(clerkUserId, project_id, days ? parseInt(days) : 30);
    res.json({ success: true, data: trend });
});
/**
 * GET /api/tokens/budget
 * Check budget status
 */
router.get('/budget', extractClerkUserId, async (req, res) => {
    const { project_id, limit } = req.query;
    const clerkUserId = req.body.clerk_user_id;
    if (!clerkUserId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!project_id) {
        return res.status(400).json({ success: false, error: 'project_id is required' });
    }
    const budgetLimit = limit ? parseFloat(limit) : 100; // Default $100/month
    const alert = await tokenService.checkBudget(clerkUserId, project_id, budgetLimit);
    res.json({
        success: true,
        data: {
            alert,
            limit: budgetLimit,
        },
    });
});
/**
 * GET /api/tokens/recommendations
 * Get optimization recommendations
 */
router.get('/recommendations', extractClerkUserId, async (req, res) => {
    const { project_id } = req.query;
    const clerkUserId = req.body.clerk_user_id;
    if (!clerkUserId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const recommendations = await tokenService.getOptimizationRecommendations(clerkUserId, project_id);
    res.json({ success: true, data: recommendations });
});
/**
 * POST /api/tokens/track
 * Track token usage (internal use)
 */
router.post('/track', extractClerkUserId, async (req, res) => {
    const { project_id, workflow_id, model, input_tokens, output_tokens, operation, clerk_user_id, } = req.body;
    if (!clerk_user_id || !project_id || !model || !operation) {
        return res.status(400).json({
            success: false,
            error: 'project_id, model, and operation are required',
        });
    }
    const usage = await tokenService.trackUsage(project_id, clerk_user_id, model, input_tokens || 0, output_tokens || 0, operation, workflow_id);
    res.json({ success: true, data: usage });
});
export default router;
//# sourceMappingURL=tokens.js.map
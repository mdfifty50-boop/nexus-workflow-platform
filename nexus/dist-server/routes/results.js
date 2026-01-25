import { Router } from 'express';
import { resultsService } from '../services/resultsService.js';
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
// Results Routes (Epic 10)
// =============================================================================
/**
 * POST /api/results
 * Store a workflow result
 */
router.post('/', extractClerkUserId, async (req, res) => {
    const { workflow_id, project_id, title, result_type, data, description, clerk_user_id } = req.body;
    if (!clerk_user_id || !workflow_id || !project_id || !title || !result_type || !data) {
        return res.status(400).json({
            success: false,
            error: 'workflow_id, project_id, title, result_type, and data are required',
        });
    }
    const result = await resultsService.storeResult(workflow_id, project_id, clerk_user_id, title, result_type, data, description);
    if (!result) {
        return res.status(500).json({ success: false, error: 'Failed to store result' });
    }
    res.json({ success: true, data: result });
});
/**
 * GET /api/results/workflow/:workflowId
 * Get all results for a workflow
 */
router.get('/workflow/:workflowId', async (req, res) => {
    const { workflowId } = req.params;
    const results = await resultsService.getWorkflowResults(workflowId);
    res.json({ success: true, data: results });
});
/**
 * GET /api/results/:resultId
 * Get a specific result
 */
router.get('/:resultId', async (req, res) => {
    const { resultId } = req.params;
    const result = await resultsService.getResult(resultId);
    if (!result) {
        return res.status(404).json({ success: false, error: 'Result not found' });
    }
    // Process data for rendering
    const chartData = resultsService.renderChartData(result.data);
    const tableData = resultsService.renderTableData(result.data);
    res.json({
        success: true,
        data: {
            ...result,
            renderedChart: chartData,
            renderedTable: tableData,
        },
    });
});
/**
 * POST /api/results/:resultId/share
 * Generate shareable URL
 */
router.post('/:resultId/share', async (req, res) => {
    const { resultId } = req.params;
    const { expires_in_hours } = req.body;
    const shareData = await resultsService.generateShareUrl(resultId, expires_in_hours || 24);
    if (!shareData) {
        return res.status(500).json({ success: false, error: 'Failed to generate share URL' });
    }
    res.json({ success: true, data: shareData });
});
/**
 * GET /api/results/share/:shareToken
 * Get result by share token (public)
 */
router.get('/share/:shareToken', async (req, res) => {
    const { shareToken } = req.params;
    const result = await resultsService.getResultByShareToken(shareToken);
    if (!result) {
        return res.status(404).json({
            success: false,
            error: 'Result not found or link has expired',
        });
    }
    // Process data for rendering
    const chartData = resultsService.renderChartData(result.data);
    const tableData = resultsService.renderTableData(result.data);
    res.json({
        success: true,
        data: {
            ...result,
            renderedChart: chartData,
            renderedTable: tableData,
        },
    });
});
/**
 * POST /api/results/:resultId/notify
 * Send completion notification
 */
router.post('/:resultId/notify', async (req, res) => {
    const { resultId } = req.params;
    const { email } = req.body;
    const result = await resultsService.getResult(resultId);
    if (!result) {
        return res.status(404).json({ success: false, error: 'Result not found' });
    }
    await resultsService.sendCompletionNotification(result.workflow_id, resultId, email);
    res.json({ success: true, message: 'Notification sent' });
});
export default router;
//# sourceMappingURL=results.js.map
import { Router } from 'express';
import { errorRecoveryService } from '../services/errorRecoveryService.js';
const router = Router();
// =============================================================================
// Error Management Routes (Epic 8)
// =============================================================================
/**
 * GET /api/errors/workflow/:workflowId
 * Get all errors for a workflow
 */
router.get('/workflow/:workflowId', async (req, res) => {
    const { workflowId } = req.params;
    const errors = await errorRecoveryService.getWorkflowErrors(workflowId);
    res.json({ success: true, data: errors });
});
/**
 * GET /api/errors/workflow/:workflowId/unresolved
 * Get unresolved errors for a workflow
 */
router.get('/workflow/:workflowId/unresolved', async (req, res) => {
    const { workflowId } = req.params;
    const errors = await errorRecoveryService.getUnresolvedErrors(workflowId);
    res.json({ success: true, data: errors, count: errors.length });
});
/**
 * GET /api/errors/stats
 * Get error statistics
 */
router.get('/stats', async (req, res) => {
    const { workflow_id } = req.query;
    const stats = await errorRecoveryService.getErrorStats(workflow_id);
    res.json({ success: true, data: stats });
});
/**
 * POST /api/errors/:errorId/skip
 * Skip a failed step (Story 8.5)
 */
router.post('/:errorId/skip', async (req, res) => {
    const { errorId } = req.params;
    const { workflow_id, node_id } = req.body;
    if (!workflow_id || !node_id) {
        return res.status(400).json({
            success: false,
            error: 'workflow_id and node_id are required',
        });
    }
    const result = await errorRecoveryService.skipFailedStep(workflow_id, node_id, errorId);
    if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
    }
    res.json({ success: true, message: 'Step skipped successfully' });
});
/**
 * POST /api/errors/:errorId/resolve
 * Mark an error as resolved
 */
router.post('/:errorId/resolve', async (req, res) => {
    const { errorId } = req.params;
    const { method } = req.body;
    if (!method || !['auto_retry', 'manual_fix', 'skipped'].includes(method)) {
        return res.status(400).json({
            success: false,
            error: 'method must be one of: auto_retry, manual_fix, skipped',
        });
    }
    const result = await errorRecoveryService.markResolved(errorId, method);
    res.json({ success: result.success });
});
/**
 * POST /api/errors/:errorId/apply-fix
 * Apply a suggested fix
 */
router.post('/:errorId/apply-fix', async (req, res) => {
    const { errorId } = req.params;
    const { fix_id } = req.body;
    if (!fix_id) {
        return res.status(400).json({ success: false, error: 'fix_id is required' });
    }
    const result = await errorRecoveryService.applySuggestedFix(errorId, fix_id);
    if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
    }
    res.json({
        success: true,
        data: { action: result.action },
        message: `Fix action: ${result.action}`,
    });
});
/**
 * POST /api/errors/translate
 * Translate a technical error to plain English (for testing)
 */
router.post('/translate', async (req, res) => {
    const { error_message, stack_trace } = req.body;
    if (!error_message) {
        return res.status(400).json({ success: false, error: 'error_message is required' });
    }
    // First try pattern matching
    const patternMatch = errorRecoveryService.matchErrorPattern(error_message);
    if (patternMatch.plainEnglish) {
        return res.json({
            success: true,
            data: {
                plainEnglish: patternMatch.plainEnglish,
                type: patternMatch.type,
                fixes: patternMatch.fixes,
                source: 'pattern_match',
            },
        });
    }
    // Fall back to AI translation
    const aiResult = await errorRecoveryService['translateWithAI'](error_message, stack_trace);
    res.json({
        success: true,
        data: {
            plainEnglish: aiResult.plainEnglish,
            type: 'ai_translated',
            fixes: aiResult.fixes,
            source: 'ai',
        },
    });
});
export default router;
//# sourceMappingURL=errors.js.map
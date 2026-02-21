/**
 * Autopilot Routes - SSE-streaming Playwright configuration assistant
 *
 * Endpoints:
 * - POST   /session             Create a new autopilot session from a workflowSpec
 * - GET    /stream/:sessionId   SSE stream of screenshots + status events
 * - POST   /:sessionId/start    Start executing a session
 * - POST   /:sessionId/pause    Pause a session
 * - POST   /:sessionId/resume   Resume a session (after credential entry)
 * - POST   /:sessionId/cancel   Cancel and clean up a session
 * - GET    /:sessionId/status   Get current session status
 * - GET    /:sessionId/screenshot  Get latest screenshot as base64 JPEG
 */
import { Router } from 'express';
import { autopilotEngine } from '../services/AutopilotEngine.js';
const router = Router();
// ─── POST /session ─────────────────────────────────────────────────────────
// Create a new autopilot session from a workflow spec
router.post('/session', (req, res) => {
    try {
        const { workflowSpec, userId } = req.body;
        if (!workflowSpec || !workflowSpec.steps || !Array.isArray(workflowSpec.steps)) {
            return res.status(400).json({
                success: false,
                error: 'workflowSpec with steps array is required'
            });
        }
        if (workflowSpec.steps.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'workflowSpec must contain at least one step'
            });
        }
        const resolvedUserId = userId
            || req.headers['x-user-id']
            || req.headers['x-clerk-user-id']
            || 'anonymous';
        const session = autopilotEngine.createSession(workflowSpec, resolvedUserId);
        res.json({
            success: true,
            session: {
                id: session.id,
                state: session.state,
                steps: session.steps,
                currentStep: session.currentStep,
                createdAt: session.createdAt
            }
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[Autopilot] Error creating session:', message);
        res.status(500).json({ success: false, error: message });
    }
});
// ─── GET /stream/:sessionId ────────────────────────────────────────────────
// SSE stream of screenshots, status updates, progress, and completion events
router.get('/stream/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = autopilotEngine.getSession(sessionId);
    if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering if proxied
    res.flushHeaders();
    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ sessionId, state: session.state })}\n\n`);
    // Event handlers - filter by sessionId
    const onScreenshot = (data) => {
        if (data.sessionId !== sessionId)
            return;
        res.write(`event: screenshot\ndata: ${JSON.stringify({
            image: data.image,
            step: data.step,
            description: data.description,
            timestamp: data.timestamp
        })}\n\n`);
    };
    const onStatus = (data) => {
        if (data.sessionId !== sessionId)
            return;
        res.write(`event: status\ndata: ${JSON.stringify({
            state: data.state,
            step: data.step,
            message: data.message,
            timestamp: data.timestamp
        })}\n\n`);
    };
    const onProgress = (data) => {
        if (data.sessionId !== sessionId)
            return;
        res.write(`event: progress\ndata: ${JSON.stringify({
            step: data.step,
            total: data.total,
            message: data.message,
            timestamp: data.timestamp
        })}\n\n`);
    };
    const onComplete = (data) => {
        if (data.sessionId !== sessionId)
            return;
        res.write(`event: complete\ndata: ${JSON.stringify({
            steps: data.steps,
            duration: data.duration,
            timestamp: data.timestamp
        })}\n\n`);
        cleanup();
    };
    const onError = (data) => {
        if (data.sessionId !== sessionId)
            return;
        res.write(`event: error\ndata: ${JSON.stringify({
            message: data.message,
            timestamp: data.timestamp
        })}\n\n`);
    };
    // Register listeners
    autopilotEngine.on('screenshot', onScreenshot);
    autopilotEngine.on('status', onStatus);
    autopilotEngine.on('progress', onProgress);
    autopilotEngine.on('complete', onComplete);
    autopilotEngine.on('error', onError);
    // Keep-alive ping every 15 seconds to prevent timeout
    const keepAlive = setInterval(() => {
        try {
            res.write(`: keepalive\n\n`);
        }
        catch {
            cleanup();
        }
    }, 15000);
    // Cleanup function
    const cleanup = () => {
        clearInterval(keepAlive);
        autopilotEngine.off('screenshot', onScreenshot);
        autopilotEngine.off('status', onStatus);
        autopilotEngine.off('progress', onProgress);
        autopilotEngine.off('complete', onComplete);
        autopilotEngine.off('error', onError);
    };
    // Clean up when client disconnects
    req.on('close', cleanup);
});
// ─── POST /:sessionId/start ────────────────────────────────────────────────
// Start executing a session
router.post('/:sessionId/start', async (req, res) => {
    const { sessionId } = req.params;
    try {
        const session = autopilotEngine.getSession(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }
        // Start execution asynchronously - don't wait for completion
        autopilotEngine.startSession(sessionId).catch(err => {
            console.error(`[Autopilot] Session ${sessionId} execution error:`, err);
        });
        res.json({
            success: true,
            message: 'Session execution started',
            sessionId
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[Autopilot] Error starting session:', message);
        res.status(500).json({ success: false, error: message });
    }
});
// ─── POST /:sessionId/pause ────────────────────────────────────────────────
// Pause a running session
router.post('/:sessionId/pause', async (req, res) => {
    const { sessionId } = req.params;
    try {
        await autopilotEngine.pauseSession(sessionId);
        res.json({
            success: true,
            message: 'Session paused',
            sessionId
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[Autopilot] Error pausing session:', message);
        res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
            success: false,
            error: message
        });
    }
});
// ─── POST /:sessionId/resume ───────────────────────────────────────────────
// Resume a paused or credential-waiting session
router.post('/:sessionId/resume', async (req, res) => {
    const { sessionId } = req.params;
    try {
        // Resume execution asynchronously
        autopilotEngine.resumeSession(sessionId).catch(err => {
            console.error(`[Autopilot] Session ${sessionId} resume error:`, err);
        });
        res.json({
            success: true,
            message: 'Session resumed',
            sessionId
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[Autopilot] Error resuming session:', message);
        res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
            success: false,
            error: message
        });
    }
});
// ─── POST /:sessionId/cancel ───────────────────────────────────────────────
// Cancel a session and clean up resources
router.post('/:sessionId/cancel', async (req, res) => {
    const { sessionId } = req.params;
    try {
        await autopilotEngine.cancelSession(sessionId);
        res.json({
            success: true,
            message: 'Session cancelled',
            sessionId
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[Autopilot] Error cancelling session:', message);
        res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
            success: false,
            error: message
        });
    }
});
// ─── GET /:sessionId/status ────────────────────────────────────────────────
// Get the current state of a session
router.get('/:sessionId/status', (req, res) => {
    const { sessionId } = req.params;
    const session = autopilotEngine.getSession(sessionId);
    if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({
        success: true,
        session: {
            id: session.id,
            state: session.state,
            steps: session.steps,
            currentStep: session.currentStep,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity
        }
    });
});
// ─── GET /:sessionId/screenshot ────────────────────────────────────────────
// Get the latest screenshot as base64 JPEG
router.get('/:sessionId/screenshot', (req, res) => {
    const { sessionId } = req.params;
    const session = autopilotEngine.getSession(sessionId);
    if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }
    const screenshot = autopilotEngine.getScreenshot(sessionId);
    if (!screenshot) {
        return res.status(204).json({ success: true, image: null, message: 'No screenshot available yet' });
    }
    res.json({
        success: true,
        image: screenshot,
        step: session.currentStep,
        state: session.state,
        timestamp: Date.now()
    });
});
export default router;
//# sourceMappingURL=autopilot.js.map
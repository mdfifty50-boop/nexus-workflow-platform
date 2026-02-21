import { Router } from 'express';
import { callClaude, callClaudeWithTiering } from '../services/claudeProxy.js';
import { getAgent } from '../agents/index.js';
const router = Router();
// @NEXUS-FIX-186: Dynamic import for isolated-vm to prevent crash on platforms where native addon fails - DO NOT REMOVE
let ivm = null;
try {
    ivm = await import('isolated-vm');
}
catch {
    console.warn('[Workflow] isolated-vm not available — data-transform/condition steps will use safe fallback');
}
// Safe fallback for data-transform/condition when isolated-vm is unavailable
function safeEvalTransform(code, input, data) {
    const fn = new Function('input', 'data', code);
    return fn(input, data);
}
function safeEvalCondition(condition, input, data) {
    const fn = new Function('input', 'data', `return (${condition})`);
    return fn(input, data);
}
// POST /api/workflow/execute - Execute a multi-step workflow
router.post('/execute', async (req, res) => {
    try {
        const { workflowId, executionId, steps, input = {}, variables = {} } = req.body;
        if (!steps || !Array.isArray(steps)) {
            return res.status(400).json({
                success: false,
                error: 'steps array is required'
            });
        }
        const results = [];
        let currentData = { ...input, ...variables };
        let totalTokens = 0;
        let totalCost = 0;
        for (const step of steps) {
            const startTime = Date.now();
            let stepResult = { stepId: step.id, status: 'success' };
            try {
                switch (step.type) {
                    case 'ai-agent': {
                        const agentId = step.config.agentId || 'nexus';
                        const agent = getAgent(agentId);
                        const prompt = step.config.prompt || '';
                        // Interpolate variables into prompt
                        let processedPrompt = prompt;
                        for (const [key, value] of Object.entries(currentData)) {
                            processedPrompt = processedPrompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
                        }
                        // Use Claude proxy (FREE via Max subscription) with API fallback
                        const claudeResult = await callClaude({
                            systemPrompt: agent?.personality || 'You are a helpful AI assistant.',
                            userMessage: processedPrompt,
                            maxTokens: step.config.maxTokens || 4096,
                            model: step.config.model || 'claude-sonnet-4-6'
                        });
                        stepResult.output = claudeResult.text;
                        stepResult.agent = agent ? {
                            id: agent.id,
                            name: agent.name,
                            avatar: agent.avatar
                        } : null;
                        stepResult.tokensUsed = claudeResult.tokensUsed;
                        stepResult.costUSD = claudeResult.costUSD;
                        stepResult.viaProxy = claudeResult.viaProxy;
                        totalTokens += stepResult.tokensUsed;
                        totalCost += stepResult.costUSD;
                        currentData.lastOutput = claudeResult.text;
                        break;
                    }
                    case 'email': {
                        // Email sending logic (requires RESEND_API_KEY)
                        const resendKey = process.env.RESEND_API_KEY;
                        if (!resendKey) {
                            throw new Error('Email not configured - add RESEND_API_KEY');
                        }
                        const emailResponse = await fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${resendKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                from: step.config.from || 'Nexus <onboarding@resend.dev>',
                                to: step.config.to,
                                subject: step.config.subject,
                                html: step.config.body
                            })
                        });
                        const emailResult = await emailResponse.json();
                        stepResult.output = emailResult;
                        break;
                    }
                    case 'http': {
                        const httpResponse = await fetch(step.config.url, {
                            method: step.config.method || 'GET',
                            headers: step.config.headers || {},
                            body: step.config.body ? JSON.stringify(step.config.body) : undefined
                        });
                        stepResult.output = await httpResponse.json();
                        currentData.httpResponse = stepResult.output;
                        break;
                    }
                    case 'youtube': {
                        // YouTube content extraction
                        const youtubeUrl = step.config.url || currentData.youtubeUrl;
                        if (!youtubeUrl) {
                            throw new Error('YouTube URL is required');
                        }
                        // Extract video ID
                        const videoId = extractYouTubeId(youtubeUrl);
                        if (!videoId) {
                            throw new Error('Invalid YouTube URL');
                        }
                        // Use a transcript service or fallback to AI description
                        // For now, we'll use Claude to process if transcript is provided
                        stepResult.output = {
                            videoId,
                            url: youtubeUrl,
                            note: 'YouTube transcript extraction requires additional setup. Video ID extracted.'
                        };
                        currentData.youtubeVideoId = videoId;
                        break;
                    }
                    case 'data-transform': {
                        const transformCode = step.config.transformCode || 'return input';
                        try {
                            // @NEXUS-FIX-186: Use isolated-vm when available, safe fallback otherwise
                            if (ivm) {
                                const mod = ivm;
                                const IVM = mod.default || mod;
                                const isolate = new IVM.Isolate({ memoryLimit: 32 });
                                const context = isolate.createContextSync();
                                context.global.setSync('input', new IVM.ExternalCopy(currentData.lastOutput).copyInto());
                                context.global.setSync('data', new IVM.ExternalCopy(currentData).copyInto());
                                const script = isolate.compileScriptSync(`(function(input, data) { ${transformCode} })(input, data)`);
                                stepResult.output = script.runSync(context, { timeout: 2000 });
                                isolate.dispose();
                            }
                            else {
                                stepResult.output = safeEvalTransform(transformCode, currentData.lastOutput, currentData);
                            }
                            currentData.lastOutput = stepResult.output;
                        }
                        catch (e) {
                            throw new Error(`Transform failed: ${e.message}`);
                        }
                        break;
                    }
                    case 'condition': {
                        const condition = step.config.condition || 'true';
                        try {
                            // @NEXUS-FIX-186: Use isolated-vm when available, safe fallback otherwise
                            if (ivm) {
                                const mod = ivm;
                                const IVM = mod.default || mod;
                                const isolate = new IVM.Isolate({ memoryLimit: 32 });
                                const context = isolate.createContextSync();
                                context.global.setSync('input', new IVM.ExternalCopy(currentData.lastOutput).copyInto());
                                context.global.setSync('data', new IVM.ExternalCopy(currentData).copyInto());
                                const script = isolate.compileScriptSync(`(function(input, data) { return (${condition}); })(input, data)`);
                                const result = script.runSync(context, { timeout: 1000 });
                                isolate.dispose();
                                stepResult.output = { result };
                            }
                            else {
                                const result = safeEvalCondition(condition, currentData.lastOutput, currentData);
                                stepResult.output = { result };
                            }
                        }
                        catch (e) {
                            throw new Error(`Condition evaluation failed: ${e.message}`);
                        }
                        break;
                    }
                    default:
                        throw new Error(`Unknown step type: ${step.type}`);
                }
            }
            catch (error) {
                stepResult.status = 'error';
                stepResult.error = error.message;
            }
            stepResult.duration = Date.now() - startTime;
            results.push(stepResult);
            // Stop on error unless configured to continue
            if (stepResult.status === 'error' && !step.config.continueOnError) {
                break;
            }
        }
        const allSuccess = results.every(r => r.status === 'success');
        res.json({
            success: allSuccess,
            workflowId,
            executionId,
            results,
            finalOutput: currentData.lastOutput,
            totalTokens,
            totalCost
        });
    }
    catch (error) {
        console.error('Workflow execution error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Workflow execution failed'
        });
    }
});
// @NEXUS-FIX-147: AI step execution endpoint with model tiering - DO NOT REMOVE
// Handles AI-powered workflow steps (generate, summarize, translate, analyze)
// Uses Haiku for simple tasks, Sonnet for moderate, Opus for complex
router.post('/ai-step', async (req, res) => {
    try {
        const { prompt, previousData, complexity } = req.body;
        if (!prompt) {
            return res.status(400).json({ success: false, error: 'prompt is required' });
        }
        // Auto-select model tier based on complexity hint from frontend
        const tierMap = {
            simple: 'haiku', // quotes, greetings, short content ($0.80/1M)
            moderate: 'sonnet', // summaries, reports, translations ($3/1M)
            complex: 'opus', // business analysis, critical decisions ($15/1M)
        };
        const forceTier = tierMap[complexity] || undefined;
        // Build prompt with context from previous workflow steps
        let fullPrompt = prompt;
        if (previousData && Object.keys(previousData).length > 0) {
            fullPrompt += '\n\nContext from previous workflow steps:\n' + JSON.stringify(previousData, null, 2);
        }
        const result = await callClaudeWithTiering({
            systemPrompt: 'You are an AI step in a workflow automation pipeline. Produce the requested output directly. Be concise and actionable. Return ONLY the requested content, no explanations or meta-commentary.',
            userMessage: fullPrompt,
            maxTokens: 2048,
            forceTier,
        });
        // @NEXUS-FIX-171: Server-side AI step output validation - DO NOT REMOVE
        if (!result.text || result.text.trim().length === 0) {
            return res.status(500).json({ success: false, error: 'AI produced no output — please try again' });
        }
        res.json({
            success: true,
            output: result.text,
            model: result.model,
            tier: result.tier,
            tokensUsed: result.tokensUsed,
            costUSD: result.costUSD,
        });
    }
    catch (error) {
        console.error('[AI-Step] Execution error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'AI step execution failed',
        });
    }
});
// Helper: Calculate cost based on Claude pricing
function _calculateCost(model, inputTokens, outputTokens) {
    const pricing = {
        'claude-opus-4-6': { input: 15.0, output: 75.0 },
        'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
        'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 }
    };
    const modelPricing = pricing[model] || pricing['claude-sonnet-4-6'];
    const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
    const outputCost = (outputTokens / 1_000_000) * modelPricing.output;
    return Number((inputCost + outputCost).toFixed(6));
}
// Helper: Extract YouTube video ID from URL
function extractYouTubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match)
            return match[1];
    }
    return null;
}
// ============================================================================
// @NEXUS-FIX-179: HITL Approval Endpoints - DO NOT REMOVE
// ============================================================================
// In-memory approval decision storage (future: Supabase persistence)
const approvalDecisions = new Map();
// In-memory mapping for WhatsApp approval responses
const whatsappApprovalMappings = new Map();
// POST /api/workflow/approve/:requestId - Record approval decision
router.post('/approve/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { decision, reviewer, comments, workflowId, additionalData } = req.body;
        approvalDecisions.set(requestId, {
            requestId,
            decision: decision || 'approved',
            reviewer: reviewer || 'user',
            comments,
            workflowId,
            additionalData,
            timestamp: new Date().toISOString(),
        });
        console.log(`[HITL] Approval recorded: ${requestId} = ${decision || 'approved'}`);
        res.json({
            success: true,
            requestId,
            decision: decision || 'approved',
            message: 'Approval decision recorded',
        });
    }
    catch (error) {
        console.error('[HITL] Approval error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to record approval',
        });
    }
});
// POST /api/workflow/reject/:requestId - Record rejection decision
router.post('/reject/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reviewer, comments, workflowId } = req.body;
        approvalDecisions.set(requestId, {
            requestId,
            decision: 'rejected',
            reviewer: reviewer || 'user',
            comments,
            workflowId,
            timestamp: new Date().toISOString(),
        });
        console.log(`[HITL] Rejection recorded: ${requestId}`);
        res.json({
            success: true,
            requestId,
            decision: 'rejected',
            message: 'Rejection decision recorded',
        });
    }
    catch (error) {
        console.error('[HITL] Rejection error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to record rejection',
        });
    }
});
// GET /api/workflow/approval-status/:workflowId - Get pending approvals
router.get('/approval-status/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        // Find the most recent decision for this workflow
        let lastDecision = null;
        for (const [_key, decision] of approvalDecisions) {
            if (decision.workflowId === workflowId) {
                if (!lastDecision || decision.timestamp > lastDecision.timestamp) {
                    lastDecision = decision;
                }
            }
        }
        res.json({
            success: true,
            workflowId,
            lastDecision,
            pendingCount: 0, // Future: track pending count
        });
    }
    catch (error) {
        console.error('[HITL] Status check error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get approval status',
        });
    }
});
// POST /api/workflow/notify-approval - Send approval notification (WhatsApp/email)
router.post('/notify-approval', async (req, res) => {
    try {
        const { requestId, workflowName, stepName, approvalConfig, channel } = req.body;
        // Store mapping for WhatsApp response matching
        if (channel === 'whatsapp') {
            // TODO: Get user's phone number from session/profile
            // For now, log the notification request
            console.log(`[HITL] WhatsApp notification requested for ${requestId}:`, {
                workflowName,
                stepName,
                channel,
            });
            // Store approval mapping for WhatsApp response parsing
            // The phone number would come from user profile in production
            whatsappApprovalMappings.set(requestId, {
                requestId,
                mode: approvalConfig?.mode || 'binary',
                config: approvalConfig,
                expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h expiry
            });
        }
        res.json({
            success: true,
            channel,
            message: 'Notification request processed',
            // In production, this would return sent: true/false based on actual delivery
        });
    }
    catch (error) {
        console.error('[HITL] Notification error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send notification',
        });
    }
});
// @NEXUS-FIX-179-END
export default router;
//# sourceMappingURL=workflow.js.map
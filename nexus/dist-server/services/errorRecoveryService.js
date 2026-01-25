import { createClient } from '@supabase/supabase-js';
import { tieredCalls, recordTieringMetrics } from './claudeProxy.js';
// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
// =============================================================================
// Error Pattern Database
// =============================================================================
const ERROR_PATTERNS = [
    // Authentication errors
    {
        pattern: /401|unauthorized|authentication failed|invalid token/i,
        type: 'authentication',
        plainEnglish: 'The connection to this service has expired or is invalid.',
        fixes: [
            {
                title: 'Reconnect Integration',
                description: 'Re-authenticate with the service to get fresh credentials.',
                confidence: 0.95,
                fix_type: 'manual',
                action: 'reconnect_integration',
            },
            {
                title: 'Check API Key',
                description: 'Verify the API key is correct and has not been revoked.',
                confidence: 0.8,
                fix_type: 'config',
            },
        ],
    },
    // Rate limiting
    {
        pattern: /429|rate limit|too many requests|throttl/i,
        type: 'rate_limit',
        plainEnglish: 'The service is receiving too many requests. Need to slow down.',
        fixes: [
            {
                title: 'Wait and Retry',
                description: 'The request will automatically retry after a short delay.',
                confidence: 0.9,
                fix_type: 'auto',
                action: 'wait_retry',
            },
            {
                title: 'Reduce Batch Size',
                description: 'Process fewer items at once to avoid hitting limits.',
                confidence: 0.7,
                fix_type: 'config',
            },
        ],
    },
    // Network errors
    {
        pattern: /ECONNREFUSED|ETIMEDOUT|network|connection refused|timeout/i,
        type: 'network',
        plainEnglish: 'Could not connect to the service. It may be temporarily unavailable.',
        fixes: [
            {
                title: 'Auto Retry',
                description: 'The system will automatically retry the connection.',
                confidence: 0.85,
                fix_type: 'auto',
                action: 'retry',
            },
            {
                title: 'Check Service Status',
                description: 'The external service may be down. Check their status page.',
                confidence: 0.7,
                fix_type: 'manual',
            },
        ],
    },
    // Not found errors
    {
        pattern: /404|not found|does not exist|no such/i,
        type: 'not_found',
        plainEnglish: 'The requested item could not be found. It may have been deleted or moved.',
        fixes: [
            {
                title: 'Verify Input Data',
                description: 'Check that the ID or reference is correct.',
                confidence: 0.8,
                fix_type: 'manual',
            },
            {
                title: 'Skip This Step',
                description: 'Continue the workflow without this item.',
                confidence: 0.6,
                fix_type: 'manual',
                action: 'skip',
            },
        ],
    },
    // Permission errors
    {
        pattern: /403|forbidden|permission denied|access denied/i,
        type: 'permission',
        plainEnglish: 'You don\'t have permission to perform this action.',
        fixes: [
            {
                title: 'Check Permissions',
                description: 'Verify the connected account has the required permissions.',
                confidence: 0.85,
                fix_type: 'manual',
            },
            {
                title: 'Use Different Account',
                description: 'Connect with an account that has admin or higher access.',
                confidence: 0.7,
                fix_type: 'manual',
                action: 'reconnect_integration',
            },
        ],
    },
    // Validation errors
    {
        pattern: /400|bad request|invalid|validation|required field/i,
        type: 'validation',
        plainEnglish: 'The data sent to the service was invalid or incomplete.',
        fixes: [
            {
                title: 'Review Input Data',
                description: 'Check that all required fields are filled in correctly.',
                confidence: 0.8,
                fix_type: 'manual',
            },
            {
                title: 'Check Field Format',
                description: 'Ensure dates, emails, and numbers are in the correct format.',
                confidence: 0.7,
                fix_type: 'manual',
            },
        ],
    },
    // Server errors
    {
        pattern: /500|502|503|504|internal server|service unavailable/i,
        type: 'server_error',
        plainEnglish: 'The external service is experiencing issues.',
        fixes: [
            {
                title: 'Wait and Retry',
                description: 'The service may recover shortly. Will retry automatically.',
                confidence: 0.8,
                fix_type: 'auto',
                action: 'wait_retry',
            },
            {
                title: 'Contact Support',
                description: 'If the issue persists, contact the service provider.',
                confidence: 0.5,
                fix_type: 'manual',
            },
        ],
    },
];
// =============================================================================
// Error Translation Cache (Story 8.3)
// =============================================================================
const errorTranslationCache = new Map();
function getCacheKey(errorType, errorMessage) {
    // Normalize error message for caching (remove specific IDs, timestamps, etc.)
    const normalized = errorMessage
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[ID]')
        .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '[TIMESTAMP]')
        .replace(/\d+/g, '[NUM]')
        .substring(0, 100); // Limit cache key length
    return `${errorType}:${normalized}`;
}
// =============================================================================
// Error Recovery Service
// =============================================================================
export const errorRecoveryService = {
    // ---------------------------------------------------------------------------
    // Record Error (Story 8.2)
    // ---------------------------------------------------------------------------
    async recordError(workflowId, nodeId, error, errorCode) {
        try {
            const errorMessage = typeof error === 'string' ? error : error.message;
            const stackTrace = typeof error === 'object' ? error.stack : null;
            // Match against patterns
            const matched = this.matchErrorPattern(errorMessage);
            // Check cache for translation
            const cacheKey = getCacheKey(matched.type, errorMessage);
            let cachedResult = errorTranslationCache.get(cacheKey);
            let plainEnglish = matched.plainEnglish;
            let suggestedFixes = matched.fixes;
            // If not in cache and error is complex, use AI for translation
            if (!cachedResult && !matched.plainEnglish) {
                const aiResult = await this.translateWithAI(errorMessage, stackTrace);
                plainEnglish = aiResult.plainEnglish;
                suggestedFixes = aiResult.fixes;
                // Cache the result
                errorTranslationCache.set(cacheKey, { plainEnglish, fixes: suggestedFixes });
            }
            else if (cachedResult) {
                plainEnglish = cachedResult.plainEnglish;
                suggestedFixes = cachedResult.fixes;
            }
            // Add unique IDs to fixes
            const fixesWithIds = suggestedFixes.map((fix, i) => ({
                ...fix,
                id: `fix-${Date.now()}-${i}`,
            }));
            // Store in database
            const { data, error: dbError } = await supabase
                .from('workflow_errors')
                .insert({
                workflow_id: workflowId,
                node_id: nodeId,
                error_type: matched.type,
                error_message: errorMessage,
                error_code: errorCode,
                stack_trace: stackTrace,
                plain_english: plainEnglish,
                suggested_fixes: fixesWithIds,
                retry_count: 0,
                resolved: false,
            })
                .select()
                .single();
            if (dbError) {
                console.error('Failed to record error:', dbError);
                return null;
            }
            return data;
        }
        catch (err) {
            console.error('Error recording workflow error:', err);
            return null;
        }
    },
    // ---------------------------------------------------------------------------
    // Match Error Pattern (Story 8.4)
    // ---------------------------------------------------------------------------
    matchErrorPattern(errorMessage) {
        for (const pattern of ERROR_PATTERNS) {
            if (pattern.pattern.test(errorMessage)) {
                return {
                    type: pattern.type,
                    plainEnglish: pattern.plainEnglish,
                    fixes: pattern.fixes,
                };
            }
        }
        return {
            type: 'unknown',
            plainEnglish: '',
            fixes: [],
        };
    },
    // ---------------------------------------------------------------------------
    // AI Error Translation (Story 8.2)
    // Uses Haiku for cost-effective error translation (12x cheaper than Sonnet)
    // ---------------------------------------------------------------------------
    async translateWithAI(errorMessage, stackTrace) {
        try {
            // Use Haiku tier for error translation - simple extraction task
            console.log('[errorRecoveryService] Translating error via Haiku (cost optimized)...');
            const claudeResult = await tieredCalls.extract('You are a helpful assistant that translates technical errors into plain English for non-technical users.', `Translate this technical error into plain English that a non-technical business user can understand. Also suggest 1-3 potential fixes.

Error Message: ${errorMessage}
${stackTrace ? `Stack Trace: ${stackTrace.substring(0, 500)}` : ''}

Respond in JSON format:
{
  "plainEnglish": "Simple explanation of what went wrong",
  "fixes": [
    {
      "title": "Fix Title",
      "description": "How to fix it",
      "confidence": 0.8,
      "fix_type": "auto|manual|config"
    }
  ]
}`, 1000);
            // Record metrics for analytics
            recordTieringMetrics(claudeResult.tier, claudeResult.taskType, claudeResult.costUSD, claudeResult.savingsVsSonnet);
            const text = claudeResult.text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { plainEnglish: errorMessage, fixes: [] };
            return {
                plainEnglish: parsed.plainEnglish || errorMessage,
                fixes: parsed.fixes || [],
            };
        }
        catch (err) {
            console.error('AI translation failed:', err);
            return {
                plainEnglish: 'An unexpected error occurred.',
                fixes: [
                    {
                        title: 'Retry',
                        description: 'Try running the workflow again.',
                        confidence: 0.5,
                        fix_type: 'auto',
                    },
                ],
            };
        }
    },
    // ---------------------------------------------------------------------------
    // Auto Retry (Story 8.1)
    // ---------------------------------------------------------------------------
    async executeWithRetry(fn, workflowId, nodeId, config = { maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 }) {
        let lastError = null;
        let delay = config.delayMs;
        for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
            try {
                const result = await fn();
                return { success: true, result };
            }
            catch (err) {
                lastError = err;
                console.log(`Attempt ${attempt}/${config.maxAttempts} failed:`, err.message);
                // Update retry count in database
                await supabase
                    .from('workflow_errors')
                    .update({ retry_count: attempt })
                    .eq('workflow_id', workflowId)
                    .eq('node_id', nodeId)
                    .eq('resolved', false);
                // Check if error is retryable
                const errorType = this.matchErrorPattern(err.message).type;
                const nonRetryable = ['validation', 'permission', 'not_found'];
                if (nonRetryable.includes(errorType)) {
                    break; // Don't retry these error types
                }
                // Wait before retrying (with exponential backoff)
                if (attempt < config.maxAttempts) {
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    delay *= config.backoffMultiplier;
                }
            }
        }
        // Record final error
        const workflowError = await this.recordError(workflowId, nodeId, lastError || new Error('Unknown error'));
        return { success: false, error: workflowError || undefined };
    },
    // ---------------------------------------------------------------------------
    // Skip Failed Step (Story 8.5)
    // ---------------------------------------------------------------------------
    async skipFailedStep(workflowId, nodeId, errorId) {
        try {
            // Mark error as resolved via skip
            await supabase
                .from('workflow_errors')
                .update({
                resolved: true,
                resolution_method: 'skipped',
            })
                .eq('id', errorId);
            // Update node status to skipped
            const { data: workflow } = await supabase
                .from('workflows')
                .select('nodes')
                .eq('id', workflowId)
                .single();
            if (workflow?.nodes) {
                const nodes = workflow.nodes.map((node) => {
                    if (node.id === nodeId) {
                        return { ...node, status: 'skipped' };
                    }
                    return node;
                });
                await supabase.from('workflows').update({ nodes }).eq('id', workflowId);
            }
            return { success: true };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    },
    // ---------------------------------------------------------------------------
    // Get Workflow Errors
    // ---------------------------------------------------------------------------
    async getWorkflowErrors(workflowId) {
        const { data } = await supabase
            .from('workflow_errors')
            .select('*')
            .eq('workflow_id', workflowId)
            .order('created_at', { ascending: false });
        return data || [];
    },
    // ---------------------------------------------------------------------------
    // Get Unresolved Errors
    // ---------------------------------------------------------------------------
    async getUnresolvedErrors(workflowId) {
        const { data } = await supabase
            .from('workflow_errors')
            .select('*')
            .eq('workflow_id', workflowId)
            .eq('resolved', false)
            .order('created_at', { ascending: false });
        return data || [];
    },
    // ---------------------------------------------------------------------------
    // Mark Error Resolved
    // ---------------------------------------------------------------------------
    async markResolved(errorId, method) {
        const { error } = await supabase
            .from('workflow_errors')
            .update({
            resolved: true,
            resolution_method: method,
        })
            .eq('id', errorId);
        return { success: !error };
    },
    // ---------------------------------------------------------------------------
    // Get Error Statistics
    // ---------------------------------------------------------------------------
    async getErrorStats(workflowId) {
        let query = supabase.from('workflow_errors').select('*');
        if (workflowId) {
            query = query.eq('workflow_id', workflowId);
        }
        const { data } = await query;
        const errors = data || [];
        const byType = {};
        const byResolution = {};
        errors.forEach((err) => {
            byType[err.error_type] = (byType[err.error_type] || 0) + 1;
            if (err.resolution_method) {
                byResolution[err.resolution_method] = (byResolution[err.resolution_method] || 0) + 1;
            }
        });
        return {
            total: errors.length,
            resolved: errors.filter((e) => e.resolved).length,
            byType,
            byResolution,
        };
    },
    // ---------------------------------------------------------------------------
    // Apply Suggested Fix
    // ---------------------------------------------------------------------------
    async applySuggestedFix(errorId, fixId) {
        try {
            const { data: errorData } = await supabase
                .from('workflow_errors')
                .select('*')
                .eq('id', errorId)
                .single();
            if (!errorData) {
                return { success: false, error: 'Error not found' };
            }
            const fix = errorData.suggested_fixes?.find((f) => f.id === fixId);
            if (!fix) {
                return { success: false, error: 'Fix not found' };
            }
            // Return the action for the client to handle
            return {
                success: true,
                action: fix.action || fix.fix_type,
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    },
};
//# sourceMappingURL=errorRecoveryService.js.map
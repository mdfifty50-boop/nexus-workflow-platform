/**
 * Composio API Routes - Real tool execution via Composio SDK
 *
 * These routes handle:
 * - Session management
 * - OAuth connection management
 * - Tool execution via Composio API
 * - Real API calls to Gmail, Slack, Sheets, GitHub, etc.
 */
import { Router } from 'express';
import { composioService } from '../services/ComposioService.js';
const router = Router();
// Initialize Composio on first request
let isInitialized = false;
async function ensureInitialized() {
    if (!isInitialized) {
        await composioService.initialize();
        isInitialized = true;
    }
}
/**
 * POST /api/composio/session
 * Initialize or retrieve a Composio session
 */
router.post('/session', async (req, res) => {
    try {
        await ensureInitialized();
        const connectedApps = await composioService.refreshConnections();
        res.json({
            success: true,
            sessionId: `csess_${Date.now()}`,
            connectedToolkits: connectedApps,
            hasApiKey: composioService.initialized,
            isDemoMode: composioService.isDemoMode,
        });
    }
    catch (error) {
        console.error('[Composio] Session error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initialize session',
        });
    }
});
/**
 * GET /api/composio/connection/:toolkit
 * Check if a toolkit is connected
 */
router.get('/connection/:toolkit', async (req, res) => {
    const { toolkit } = req.params;
    try {
        await ensureInitialized();
        const status = await composioService.checkConnection(toolkit);
        res.json({
            toolkit,
            connected: status.connected,
            accountId: status.accountId,
            isDemoMode: composioService.isDemoMode,
        });
    }
    catch (error) {
        console.error('[Composio] Connection check error:', error);
        res.json({
            toolkit,
            connected: false,
            error: String(error),
        });
    }
});
/**
 * POST /api/composio/connect
 * Initiate OAuth connection for a toolkit
 */
router.post('/connect', async (req, res) => {
    const { toolkit, redirectUrl } = req.body;
    try {
        await ensureInitialized();
        if (composioService.isDemoMode) {
            return res.json({
                error: 'Composio API key not configured',
                demoMode: true,
                hint: 'Add COMPOSIO_API_KEY to your .env file',
                setupUrl: 'https://app.composio.dev/settings/api',
            });
        }
        const result = await composioService.initiateConnection(toolkit, redirectUrl);
        if (result.error) {
            return res.status(400).json({
                success: false,
                error: result.error,
            });
        }
        res.json({
            success: true,
            authUrl: result.authUrl,
            toolkit,
        });
    }
    catch (error) {
        console.error('[Composio] Connection initiation error:', error);
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
/**
 * POST /api/composio/execute
 * Execute a Composio tool
 */
router.post('/execute', async (req, res) => {
    const { toolSlug, params } = req.body;
    if (!toolSlug) {
        return res.status(400).json({
            success: false,
            error: 'toolSlug is required',
        });
    }
    console.log(`[Composio] Executing tool: ${toolSlug}`);
    try {
        await ensureInitialized();
        const result = await composioService.executeTool(toolSlug, params || {});
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
                toolSlug,
                executionTimeMs: result.executionTimeMs,
            });
        }
        res.json({
            success: true,
            data: result.data,
            toolSlug,
            executionTimeMs: result.executionTimeMs,
            isDemoMode: composioService.isDemoMode,
        });
    }
    catch (error) {
        console.error('[Composio] Tool execution error:', error);
        res.status(500).json({
            success: false,
            error: String(error),
            toolSlug,
        });
    }
});
/**
 * POST /api/composio/execute-with-account
 * Execute a tool using a specific connected account ID (bypass userId lookup)
 */
router.post('/execute-with-account', async (req, res) => {
    const { connectedAccountId, toolSlug, params } = req.body;
    if (!connectedAccountId || !toolSlug) {
        return res.status(400).json({
            success: false,
            error: 'connectedAccountId and toolSlug are required',
        });
    }
    console.log(`[Composio] Executing tool: ${toolSlug} with account: ${connectedAccountId}`);
    try {
        await ensureInitialized();
        const result = await composioService.executeWithAccountId(connectedAccountId, toolSlug, params || {});
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
                toolSlug,
                executionTimeMs: result.executionTimeMs,
            });
        }
        res.json({
            success: true,
            data: result.data,
            toolSlug,
            executionTimeMs: result.executionTimeMs,
        });
    }
    catch (error) {
        console.error('[Composio] Tool execution with account error:', error);
        res.status(500).json({
            success: false,
            error: String(error),
            toolSlug,
        });
    }
});
/**
 * POST /api/composio/execute-batch
 * Execute multiple tools in parallel
 */
router.post('/execute-batch', async (req, res) => {
    const { tools } = req.body;
    if (!tools || !Array.isArray(tools)) {
        return res.status(400).json({
            success: false,
            error: 'tools array is required',
        });
    }
    console.log(`[Composio] Executing ${tools.length} tools in batch`);
    try {
        await ensureInitialized();
        const results = await composioService.executeMultipleTools(tools);
        const allSuccessful = results.every(r => r.success);
        res.json({
            success: allSuccessful,
            results,
            totalExecuted: results.length,
            successCount: results.filter(r => r.success).length,
            failureCount: results.filter(r => !r.success).length,
            isDemoMode: composioService.isDemoMode,
        });
    }
    catch (error) {
        console.error('[Composio] Batch execution error:', error);
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
/**
 * GET /api/composio/tools
 * List available tools
 */
router.get('/tools', async (req, res) => {
    const { apps } = req.query;
    try {
        await ensureInitialized();
        const appList = apps ? String(apps).split(',') : undefined;
        const tools = await composioService.getTools(appList);
        res.json({
            success: true,
            tools,
            count: tools.length,
            isDemoMode: composioService.isDemoMode,
        });
    }
    catch (error) {
        console.error('[Composio] Tools fetch error:', error);
        res.json({
            success: true,
            tools: DEMO_TOOLS,
            error: String(error),
            isDemoMode: true,
        });
    }
});
/**
 * GET /api/composio/status
 * Get service status
 */
router.get('/status', async (_req, res) => {
    try {
        await ensureInitialized();
        res.json({
            initialized: composioService.initialized,
            isDemoMode: composioService.isDemoMode,
            connectedApps: composioService.connected,
            apiKeyConfigured: !composioService.isDemoMode,
        });
    }
    catch (error) {
        res.json({
            initialized: false,
            isDemoMode: true,
            error: String(error),
        });
    }
});
/**
 * GET /api/composio/debug/all-connections
 * Debug endpoint: List ALL connections for this API key (regardless of userId)
 */
router.get('/debug/all-connections', async (_req, res) => {
    try {
        await ensureInitialized();
        // Access the raw composio instance to list all accounts
        const allConnections = await composioService.listAllConnections();
        res.json({
            success: true,
            totalConnections: allConnections.length,
            connections: allConnections,
            hint: 'Use one of these userIds as defaultUserId in ComposioService.ts',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
/**
 * GET /api/composio/debug/connect-gmail
 * Debug endpoint: Initiate Gmail OAuth to create a real connection
 */
router.get('/debug/connect-gmail', async (_req, res) => {
    try {
        await ensureInitialized();
        if (composioService.isDemoMode) {
            return res.json({
                success: false,
                error: 'No API key configured',
            });
        }
        const result = await composioService.initiateConnection('gmail', 'http://localhost:5173/oauth/callback?app=gmail');
        if (result.error) {
            return res.json({
                success: false,
                error: result.error,
            });
        }
        res.json({
            success: true,
            message: 'Click the URL below to connect Gmail',
            authUrl: result.authUrl,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
/**
 * GET /api/composio/debug/list-auth-configs
 * Debug endpoint: List available auth configs for our API key
 */
router.get('/debug/list-auth-configs', async (_req, res) => {
    try {
        await ensureInitialized();
        const configs = await composioService.listAuthConfigs();
        res.json({
            success: true,
            totalConfigs: configs.length,
            configs,
            message: configs.length === 0
                ? 'No auth configs found. You need to set up integrations in Composio dashboard.'
                : 'These apps can be connected via OAuth',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
// =============================================================================
// Convenience Endpoints for Common Operations
// =============================================================================
/**
 * POST /api/composio/gmail/send
 * Send an email via Gmail
 */
router.post('/gmail/send', async (req, res) => {
    const { to, subject, body, cc, bcc, isHtml } = req.body;
    if (!to || !subject) {
        return res.status(400).json({
            success: false,
            error: 'to and subject are required',
        });
    }
    try {
        await ensureInitialized();
        const result = await composioService.sendEmail({
            to,
            subject,
            body: body || '',
            cc,
            bcc,
            isHtml,
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
/**
 * GET /api/composio/gmail/fetch
 * Fetch emails from Gmail
 */
router.get('/gmail/fetch', async (req, res) => {
    const { maxResults, query, labelIds } = req.query;
    try {
        await ensureInitialized();
        const result = await composioService.fetchEmails({
            maxResults: maxResults ? parseInt(String(maxResults)) : undefined,
            query: query ? String(query) : undefined,
            labelIds: labelIds ? String(labelIds).split(',') : undefined,
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
/**
 * POST /api/composio/calendar/create
 * Create a calendar event
 */
router.post('/calendar/create', async (req, res) => {
    const { title, startTime, endTime, description, attendees, location } = req.body;
    if (!title || !startTime || !endTime) {
        return res.status(400).json({
            success: false,
            error: 'title, startTime, and endTime are required',
        });
    }
    try {
        await ensureInitialized();
        const result = await composioService.createCalendarEvent({
            title,
            startTime,
            endTime,
            description,
            attendees,
            location,
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
/**
 * POST /api/composio/slack/send
 * Send a Slack message
 */
router.post('/slack/send', async (req, res) => {
    const { channel, text, threadTs } = req.body;
    if (!channel || !text) {
        return res.status(400).json({
            success: false,
            error: 'channel and text are required',
        });
    }
    try {
        await ensureInitialized();
        const result = await composioService.sendSlackMessage({
            channel,
            text,
            threadTs,
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
/**
 * POST /api/composio/sheets/read
 * Read data from Google Sheets
 */
router.post('/sheets/read', async (req, res) => {
    const { spreadsheetId, range } = req.body;
    if (!spreadsheetId) {
        return res.status(400).json({
            success: false,
            error: 'spreadsheetId is required',
        });
    }
    try {
        await ensureInitialized();
        const result = await composioService.readSpreadsheet({
            spreadsheetId,
            range: range || 'Sheet1!A1:Z100',
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
/**
 * POST /api/composio/sheets/append
 * Append data to Google Sheets
 */
router.post('/sheets/append', async (req, res) => {
    const { spreadsheetId, range, values } = req.body;
    if (!spreadsheetId || !values) {
        return res.status(400).json({
            success: false,
            error: 'spreadsheetId and values are required',
        });
    }
    try {
        await ensureInitialized();
        const result = await composioService.appendToSpreadsheet({
            spreadsheetId,
            range: range || 'Sheet1!A1',
            values,
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
/**
 * POST /api/composio/github/issue
 * Create a GitHub issue
 */
router.post('/github/issue', async (req, res) => {
    const { owner, repo, title, body, labels } = req.body;
    if (!owner || !repo || !title) {
        return res.status(400).json({
            success: false,
            error: 'owner, repo, and title are required',
        });
    }
    try {
        await ensureInitialized();
        const result = await composioService.createGitHubIssue({
            owner,
            repo,
            title,
            body: body || '',
            labels,
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
// =============================================================================
// User-Specific Connection Endpoints (Per-User OAuth)
// =============================================================================
/**
 * GET /api/composio/user/:userId/apps
 * Get list of available apps with connection status for a user
 */
router.get('/user/:userId/apps', async (req, res) => {
    const { userId } = req.params;
    try {
        await ensureInitialized();
        const apps = composioService.getAvailableApps();
        const connections = await composioService.getUserConnections(userId);
        // Merge app info with connection status
        const appsWithStatus = apps.map(app => {
            const connection = connections.find(c => c.app === app.id);
            return {
                ...app,
                connected: connection?.connected || false,
            };
        });
        res.json({
            success: true,
            apps: appsWithStatus,
            connectedCount: appsWithStatus.filter(a => a.connected).length,
            totalApps: apps.length,
        });
    }
    catch (error) {
        console.error('[Composio] User apps error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch apps',
        });
    }
});
/**
 * POST /api/composio/user/:userId/connect/:appId
 * Initiate OAuth connection for a specific user and app
 */
router.post('/user/:userId/connect/:appId', async (req, res) => {
    const { userId, appId } = req.params;
    const { callbackUrl } = req.body;
    try {
        await ensureInitialized();
        if (composioService.isDemoMode) {
            return res.status(400).json({
                success: false,
                error: 'Integration system is being set up. Please try again later.',
            });
        }
        const result = await composioService.initiateUserConnection(userId, appId, callbackUrl);
        if (result.error) {
            return res.status(400).json({
                success: false,
                error: result.error,
            });
        }
        res.json({
            success: true,
            authUrl: result.authUrl,
            app: appId,
            message: 'Click the link to connect your account',
        });
    }
    catch (error) {
        console.error('[Composio] User connect error:', error);
        res.status(500).json({
            success: false,
            error: 'Something went wrong. Please try again.',
        });
    }
});
/**
 * DELETE /api/composio/user/:userId/disconnect/:appId
 * Disconnect an app for a specific user
 */
router.delete('/user/:userId/disconnect/:appId', async (req, res) => {
    const { userId, appId } = req.params;
    try {
        await ensureInitialized();
        const result = await composioService.disconnectUserApp(userId, appId);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error || 'Failed to disconnect',
            });
        }
        res.json({
            success: true,
            message: 'App disconnected successfully',
            app: appId,
        });
    }
    catch (error) {
        console.error('[Composio] User disconnect error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to disconnect. Please try again.',
        });
    }
});
/**
 * POST /api/composio/user/:userId/execute
 * Execute a tool for a specific user (uses their OAuth tokens)
 */
router.post('/user/:userId/execute', async (req, res) => {
    const { userId } = req.params;
    const { toolSlug, params } = req.body;
    if (!toolSlug) {
        return res.status(400).json({
            success: false,
            error: 'toolSlug is required',
        });
    }
    try {
        await ensureInitialized();
        const result = await composioService.executeToolForUser(userId, toolSlug, params || {});
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
                toolSlug,
            });
        }
        res.json({
            success: true,
            data: result.data,
            toolSlug,
            executionTimeMs: result.executionTimeMs,
        });
    }
    catch (error) {
        console.error('[Composio] User execute error:', error);
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
// =============================================================================
// Recipe/Workflow Management Endpoints (Rube/Composio API Integration)
// =============================================================================
// In-memory workflow store for tracking workflows created during the session
// This supplements the Composio API with locally-created workflows
const localWorkflowStore = new Map();
// Helper: Fetch recipes from Composio API
async function fetchComposioRecipes(apiKey) {
    try {
        // Composio API endpoint for recipes
        const response = await fetch('https://backend.composio.dev/api/v1/recipes', {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) {
            console.warn('[Composio] Recipes API returned:', response.status);
            return [];
        }
        const data = await response.json();
        return data.recipes || data.items || data.data || [];
    }
    catch (error) {
        console.warn('[Composio] Could not fetch recipes:', error);
        return [];
    }
}
/**
 * GET /api/composio/recipes
 * List all user's recipes/workflows from Rube/Composio
 */
router.get('/recipes', async (req, res) => {
    const apiKey = process.env.COMPOSIO_API_KEY;
    try {
        // Combine Composio recipes with locally tracked workflows
        let composioRecipes = [];
        if (apiKey) {
            composioRecipes = await fetchComposioRecipes(apiKey);
        }
        // Get local workflows
        const localWorkflows = Array.from(localWorkflowStore.values());
        // Format Composio recipes to match our interface
        const formattedRecipes = composioRecipes.map((recipe) => ({
            id: recipe.id || recipe.recipe_id,
            recipe_id: recipe.id || recipe.recipe_id,
            name: recipe.name || 'Unnamed Recipe',
            description: recipe.description,
            status: recipe.status || 'completed',
            source: 'composio',
            schedule: recipe.schedule ? {
                cron: recipe.schedule.cron,
                cronHuman: recipe.schedule.cron_human || parseCronToHuman(recipe.schedule.cron),
                nextRunAt: recipe.schedule.next_run_at,
                status: recipe.schedule.status || 'active'
            } : undefined,
            createdAt: recipe.created_at || new Date().toISOString()
        }));
        // Combine all workflows
        const allRecipes = [...formattedRecipes, ...localWorkflows];
        res.json({
            success: true,
            recipes: allRecipes,
            count: allRecipes.length,
            sources: {
                composio: formattedRecipes.length,
                local: localWorkflows.length
            }
        });
    }
    catch (error) {
        console.error('[Composio] Recipes fetch error:', error);
        res.status(500).json({
            success: false,
            error: String(error),
            recipes: Array.from(localWorkflowStore.values()) // Fall back to local only
        });
    }
});
// Helper: Parse cron to human readable
function parseCronToHuman(cron) {
    if (!cron)
        return 'Unknown schedule';
    const parts = cron.split(' ');
    if (parts.length !== 5)
        return cron;
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    // Common patterns
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return `Daily at ${hour}:${minute.padStart(2, '0')}`;
    }
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '1-5') {
        return `Weekdays at ${hour}:${minute.padStart(2, '0')}`;
    }
    if (hour === '*' && minute === '0') {
        return 'Every hour';
    }
    return `Cron: ${cron}`;
}
/**
 * GET /api/composio/recipes/:recipeId
 * Get details of a specific recipe
 */
router.get('/recipes/:recipeId', async (req, res) => {
    const { recipeId } = req.params;
    const apiKey = process.env.COMPOSIO_API_KEY;
    try {
        // Check local store first
        if (localWorkflowStore.has(recipeId)) {
            return res.json({
                success: true,
                recipe: localWorkflowStore.get(recipeId)
            });
        }
        // Try Composio API
        if (apiKey) {
            const response = await fetch(`https://backend.composio.dev/api/v1/recipes/${recipeId}`, {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                }
            });
            if (response.ok) {
                const data = await response.json();
                return res.json({
                    success: true,
                    recipe: data.recipe || data
                });
            }
        }
        res.status(404).json({
            success: false,
            error: 'Recipe not found',
            recipeId
        });
    }
    catch (error) {
        console.error('[Composio] Recipe details error:', error);
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
/**
 * POST /api/composio/recipes/:recipeId/schedule
 * Manage schedule for a recipe (pause, resume, delete, update)
 */
router.post('/recipes/:recipeId/schedule', async (req, res) => {
    const { recipeId } = req.params;
    const { action, cron, params } = req.body;
    const apiKey = process.env.COMPOSIO_API_KEY;
    // action: 'pause' | 'resume' | 'delete' | 'update'
    try {
        // Handle local workflows
        if (localWorkflowStore.has(recipeId)) {
            const workflow = localWorkflowStore.get(recipeId);
            if (action === 'pause' && workflow.schedule) {
                workflow.schedule.status = 'paused';
                workflow.status = 'paused';
            }
            else if (action === 'resume' && workflow.schedule) {
                workflow.schedule.status = 'active';
                workflow.status = 'active';
            }
            else if (action === 'delete') {
                localWorkflowStore.delete(recipeId);
            }
            else if (action === 'update' && workflow.schedule) {
                if (cron)
                    workflow.schedule.cron = cron;
                if (cron)
                    workflow.schedule.cronHuman = parseCronToHuman(cron);
            }
            localWorkflowStore.set(recipeId, workflow);
            return res.json({
                success: true,
                message: `Schedule ${action} completed`,
                recipeId,
                action,
                workflow
            });
        }
        // Try Composio API for external recipes
        if (apiKey) {
            const targetStatus = action === 'pause' ? 'paused' :
                action === 'resume' ? 'active' :
                    action === 'delete' ? 'deleted' : 'no_update';
            const response = await fetch('https://backend.composio.dev/api/v1/recipes/schedule', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vibeApiId: recipeId,
                    targetStatus,
                    cron,
                    params,
                    delete: action === 'delete'
                })
            });
            if (response.ok) {
                const data = await response.json();
                return res.json({
                    success: true,
                    message: `Schedule ${action} completed via Composio API`,
                    recipeId,
                    action,
                    data
                });
            }
        }
        res.status(404).json({
            success: false,
            error: 'Recipe not found or no API key configured',
            recipeId,
            action
        });
    }
    catch (error) {
        console.error('[Composio] Recipe schedule error:', error);
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
/**
 * DELETE /api/composio/recipes/:recipeId/schedule
 * Delete/stop a scheduled recipe
 */
router.delete('/recipes/:recipeId/schedule', async (req, res) => {
    const { recipeId } = req.params;
    const apiKey = process.env.COMPOSIO_API_KEY;
    try {
        // Handle local workflows
        if (localWorkflowStore.has(recipeId)) {
            const workflow = localWorkflowStore.get(recipeId);
            if (workflow.schedule) {
                delete workflow.schedule;
                workflow.status = 'completed';
                localWorkflowStore.set(recipeId, workflow);
            }
            return res.json({
                success: true,
                message: 'Schedule deleted',
                recipeId,
                deleted: true
            });
        }
        // Try Composio API
        if (apiKey) {
            const response = await fetch('https://backend.composio.dev/api/v1/recipes/schedule', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vibeApiId: recipeId,
                    delete: true
                })
            });
            if (response.ok) {
                return res.json({
                    success: true,
                    message: 'Schedule deleted via Composio API',
                    recipeId,
                    deleted: true
                });
            }
        }
        res.status(404).json({
            success: false,
            error: 'Recipe not found or no API key configured',
            recipeId,
            deleted: false
        });
    }
    catch (error) {
        console.error('[Composio] Recipe schedule delete error:', error);
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
/**
 * POST /api/composio/workflows/track
 * Track a new workflow locally (called after workflow creation)
 */
router.post('/workflows/track', async (req, res) => {
    const { id, name, description, status, schedule, source } = req.body;
    try {
        const workflow = {
            id: id || `local_${Date.now()}`,
            name: name || 'Unnamed Workflow',
            description,
            status: status || 'active',
            source: source || 'nexus',
            createdAt: new Date().toISOString(),
            schedule: schedule ? {
                cron: schedule.cron,
                cronHuman: schedule.cronHuman || parseCronToHuman(schedule.cron),
                nextRunAt: schedule.nextRunAt,
                status: 'active'
            } : undefined
        };
        localWorkflowStore.set(workflow.id, workflow);
        res.json({
            success: true,
            workflow,
            message: 'Workflow tracked successfully'
        });
    }
    catch (error) {
        console.error('[Composio] Track workflow error:', error);
        res.status(500).json({
            success: false,
            error: String(error)
        });
    }
});
// Demo tools list for offline mode
const DEMO_TOOLS = [
    { slug: 'GMAIL_SEND_EMAIL', app: 'gmail', name: 'Send Email', description: 'Send an email via Gmail' },
    { slug: 'GMAIL_FETCH_EMAILS', app: 'gmail', name: 'Fetch Emails', description: 'Fetch emails from Gmail' },
    { slug: 'GMAIL_SEARCH_EMAILS', app: 'gmail', name: 'Search Emails', description: 'Search emails in Gmail' },
    { slug: 'GOOGLECALENDAR_CREATE_EVENT', app: 'googlecalendar', name: 'Create Event', description: 'Create a calendar event' },
    { slug: 'GOOGLECALENDAR_LIST_EVENTS', app: 'googlecalendar', name: 'List Events', description: 'List calendar events' },
    { slug: 'GOOGLESHEETS_BATCH_GET', app: 'googlesheets', name: 'Read Sheet', description: 'Read data from Google Sheets' },
    { slug: 'GOOGLESHEETS_BATCH_UPDATE', app: 'googlesheets', name: 'Write/Append Data', description: 'Write or append data to Google Sheets' },
    { slug: 'SLACK_SEND_MESSAGE', app: 'slack', name: 'Send Message', description: 'Send a Slack message' },
    { slug: 'SLACK_LIST_CHANNELS', app: 'slack', name: 'List Channels', description: 'List Slack channels' },
    { slug: 'GITHUB_CREATE_ISSUE', app: 'github', name: 'Create Issue', description: 'Create a GitHub issue' },
    { slug: 'GITHUB_CREATE_PULL_REQUEST', app: 'github', name: 'Create PR', description: 'Create a pull request' },
    { slug: 'HUBSPOT_CREATE_CONTACT', app: 'hubspot', name: 'Create Contact', description: 'Create a HubSpot contact' },
    { slug: 'NOTION_CREATE_PAGE', app: 'notion', name: 'Create Page', description: 'Create a Notion page' },
    { slug: 'JIRA_CREATE_ISSUE', app: 'jira', name: 'Create Issue', description: 'Create a Jira issue' },
    { slug: 'LINEAR_CREATE_ISSUE', app: 'linear', name: 'Create Issue', description: 'Create a Linear issue' },
];
export default router;
//# sourceMappingURL=composio.js.map
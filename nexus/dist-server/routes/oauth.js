/**
 * OAuth Routes - White-label OAuth that hides Rube/Composio from users
 *
 * These routes handle:
 * - Initiating OAuth with direct provider URLs
 * - Handling OAuth callbacks
 * - Connection status checks
 *
 * Users see: Google/Slack/GitHub OAuth screens
 * Users DON'T see: rube.app, composio.dev
 */
import { Router } from 'express';
import { oauthProxyService } from '../services/OAuthProxyService';
const router = Router();
/**
 * POST /api/oauth/initiate
 * Start OAuth flow for a toolkit - returns DIRECT provider URL
 *
 * Request: { toolkit: string, userId?: string, sessionId?: string }
 * Response: { authUrl: string, state: string }
 */
router.post('/initiate', (req, res) => {
    const { toolkit, userId = 'anonymous', sessionId } = req.body;
    if (!toolkit) {
        return res.status(400).json({
            success: false,
            error: 'toolkit is required',
        });
    }
    // Get base URL for callback
    const protocol = req.secure ? 'https' : 'http';
    const baseUrl = `${protocol}://${req.get('host')}`;
    const result = oauthProxyService.generateAuthUrl(toolkit, userId, sessionId || `session_${Date.now()}`, baseUrl);
    if ('error' in result) {
        return res.status(400).json({
            success: false,
            error: result.error,
        });
    }
    console.log(`[OAuth] Initiated ${toolkit} OAuth for user ${userId}`);
    res.json({
        success: true,
        authUrl: result.authUrl,
        state: result.state,
        // Include metadata for frontend
        provider: toolkit,
        message: `Click to authorize ${toolkit}`,
    });
});
/**
 * GET /api/oauth/callback
 * Handle OAuth callback from providers
 *
 * Query: { code: string, state: string, error?: string }
 */
router.get('/callback', async (req, res) => {
    const { code, state, error, error_description } = req.query;
    // Handle OAuth errors from provider
    if (error) {
        console.error(`[OAuth] Provider returned error: ${error} - ${error_description}`);
        // Redirect to frontend with error
        return res.redirect(`/integrations/callback?error=${encodeURIComponent(String(error))}&error_description=${encodeURIComponent(String(error_description || ''))}`);
    }
    if (!code || !state) {
        return res.redirect('/integrations/callback?error=missing_params');
    }
    try {
        const result = await oauthProxyService.handleCallback(String(state), String(code));
        if (!result.success) {
            console.error(`[OAuth] Callback failed: ${result.error}`);
            return res.redirect(`/integrations/callback?error=${encodeURIComponent(result.error || 'unknown')}`);
        }
        // Success - redirect to frontend
        console.log(`[OAuth] Successfully connected ${result.toolkit} for user ${result.userId}`);
        res.redirect(`/integrations/callback?success=true&toolkit=${result.toolkit}`);
    }
    catch (err) {
        console.error('[OAuth] Callback error:', err);
        res.redirect(`/integrations/callback?error=${encodeURIComponent(String(err))}`);
    }
});
/**
 * GET /api/oauth/proxy/:toolkit
 * Proxy endpoint for Composio-managed OAuth
 * This fetches the real OAuth URL from Composio and redirects
 * User never sees composio.dev URL
 */
router.get('/proxy/:toolkit', async (req, res) => {
    const { toolkit } = req.params;
    const { state, session } = req.query;
    if (!state) {
        return res.status(400).json({ error: 'state is required' });
    }
    try {
        // In production, call Composio API to get real OAuth URL:
        // const composioResponse = await fetch('https://backend.composio.dev/api/v1/connections/initiate', {
        //   method: 'POST',
        //   headers: { 'x-api-key': process.env.COMPOSIO_API_KEY },
        //   body: JSON.stringify({ app: toolkit, redirectUri: `${baseUrl}/api/oauth/callback` })
        // })
        // const { authUrl } = await composioResponse.json()
        // return res.redirect(authUrl)
        // For now, generate a mock redirect URL that simulates provider OAuth
        // In production, this would redirect to the actual provider via Composio
        const providerUrls = {
            gmail: 'https://accounts.google.com/o/oauth2/v2/auth',
            googlecalendar: 'https://accounts.google.com/o/oauth2/v2/auth',
            slack: 'https://slack.com/oauth/v2/authorize',
            github: 'https://github.com/login/oauth/authorize',
            notion: 'https://api.notion.com/v1/oauth/authorize',
            discord: 'https://discord.com/api/oauth2/authorize',
        };
        const baseProviderUrl = providerUrls[toolkit.toLowerCase()] || 'https://accounts.google.com/o/oauth2/v2/auth';
        // Build redirect URL (in production, Composio provides this)
        const protocol = req.secure ? 'https' : 'http';
        const callbackUrl = `${protocol}://${req.get('host')}/api/oauth/callback`;
        const params = new URLSearchParams({
            state: String(state),
            redirect_uri: callbackUrl,
            response_type: 'code',
            client_id: process.env.GOOGLE_CLIENT_ID || 'demo_client_id',
            scope: 'openid email profile',
        });
        // Redirect to actual provider OAuth
        const authUrl = `${baseProviderUrl}?${params.toString()}`;
        console.log(`[OAuth] Proxying ${toolkit} OAuth request`);
        res.redirect(authUrl);
    }
    catch (err) {
        console.error(`[OAuth] Proxy error for ${toolkit}:`, err);
        res.status(500).json({ error: 'Failed to initiate OAuth' });
    }
});
/**
 * GET /api/oauth/status/:toolkit
 * Check if a toolkit is connected for the current user
 */
router.get('/status/:toolkit', (req, res) => {
    const { toolkit } = req.params;
    const userId = req.query.userId || 'anonymous';
    const connected = oauthProxyService.isConnected(toolkit, userId);
    res.json({
        toolkit,
        connected,
        // If not connected, provide the initiate endpoint
        ...(connected ? {} : {
            connectUrl: `/api/oauth/initiate`,
        }),
    });
});
/**
 * GET /api/oauth/connections
 * Get all connected toolkits for a user
 */
router.get('/connections', (req, res) => {
    const userId = req.query.userId || 'anonymous';
    const connections = oauthProxyService.getUserConnections(userId);
    res.json({
        userId,
        connections,
        count: connections.length,
    });
});
/**
 * DELETE /api/oauth/disconnect/:toolkit
 * Disconnect a toolkit
 */
router.delete('/disconnect/:toolkit', (req, res) => {
    const { toolkit } = req.params;
    const userId = req.query.userId || 'anonymous';
    const success = oauthProxyService.disconnect(toolkit, userId);
    if (success) {
        console.log(`[OAuth] Disconnected ${toolkit} for user ${userId}`);
    }
    res.json({
        success,
        toolkit,
        message: success ? `Disconnected ${toolkit}` : `${toolkit} was not connected`,
    });
});
/**
 * GET /api/oauth/providers
 * Get list of supported OAuth providers
 */
router.get('/providers', (_req, res) => {
    const providers = oauthProxyService.getSupportedProviders();
    res.json({
        providers,
        count: providers.length,
    });
});
export default router;
//# sourceMappingURL=oauth.js.map
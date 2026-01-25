/**
 * MCPProviderService - Unified Multi-Provider MCP Integration
 *
 * Supports multiple MCP providers:
 * - Composio MCP (500+ apps) - existing
 * - Google Cloud MCP (free for GCP) - native Google services
 * - Zapier MCP (8,000+ apps, 30,000+ actions) - widest coverage
 *
 * This service routes tool execution to the appropriate provider
 * based on the tool prefix and user configuration.
 */
// Default provider configurations
export const MCP_PROVIDERS = [
    {
        id: 'composio',
        type: 'composio',
        name: 'Composio',
        endpoint: 'https://mcp.composio.dev',
        isEnabled: true,
        capabilities: ['gmail', 'slack', 'sheets', 'calendar', 'github', 'hubspot', 'notion', 'jira'],
        costModel: 'per_request',
    },
    {
        id: 'google',
        type: 'google',
        name: 'Google Cloud MCP',
        endpoint: 'https://mcp.googleapis.com',
        isEnabled: true,
        capabilities: ['maps', 'bigquery', 'compute', 'kubernetes', 'drive', 'gmail', 'calendar', 'sheets', 'docs'],
        costModel: 'free', // Free for GCP customers
    },
    {
        id: 'zapier',
        type: 'zapier',
        name: 'Zapier MCP',
        endpoint: 'https://mcp.zapier.com',
        isEnabled: true,
        capabilities: ['8000+ apps', 'airtable', 'salesforce', 'stripe', 'mailchimp', 'twilio', 'sendgrid', 'zendesk'],
        costModel: 'task_credits',
    },
];
// Tool prefix routing - determines which provider handles which tools
const TOOL_ROUTING = {
    // Google Cloud MCP native tools
    'GOOGLE_MAPS': 'google',
    'GOOGLE_BIGQUERY': 'google',
    'GOOGLE_COMPUTE': 'google',
    'GOOGLE_KUBERNETES': 'google',
    'GOOGLE_DRIVE': 'google',
    'GOOGLE_DOCS': 'google',
    'GOOGLE_GMAIL': 'google',
    'GOOGLE_CALENDAR': 'google',
    'GOOGLE_SHEETS': 'google',
    // Zapier MCP tools
    'ZAPIER_': 'zapier',
    // Composio tools (default for most apps)
    'GMAIL_': 'composio',
    'GOOGLECALENDAR_': 'composio',
    'GOOGLESHEETS_': 'composio',
    'SLACK_': 'composio',
    'GITHUB_': 'composio',
    'HUBSPOT_': 'composio',
    'NOTION_': 'composio',
    'JIRA_': 'composio',
    'LINEAR_': 'composio',
};
/**
 * Unified MCP Provider Service
 */
class MCPProviderServiceClass {
    providers = new Map();
    isInitialized = false;
    sessionId = null;
    // Provider-specific OAuth state
    googleAuth = {};
    zapierAuth = {};
    constructor() {
        // Initialize providers from config
        MCP_PROVIDERS.forEach(p => this.providers.set(p.type, p));
    }
    /**
     * Initialize all enabled providers
     */
    async initialize() {
        if (this.isInitialized)
            return;
        console.log('[MCPProviderService] Initializing MCP providers...');
        // Check environment variables for API keys
        const googleProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        const _googleClientId = process.env.GOOGLE_CLIENT_ID;
        const zapierApiKey = process.env.ZAPIER_API_KEY;
        if (googleProjectId) {
            this.googleAuth.projectId = googleProjectId;
            console.log('[MCPProviderService] Google Cloud MCP configured');
        }
        if (zapierApiKey) {
            this.zapierAuth.accessToken = zapierApiKey;
            console.log('[MCPProviderService] Zapier MCP configured');
        }
        this.sessionId = `mcp_${Date.now()}`;
        this.isInitialized = true;
        console.log('[MCPProviderService] Initialized with providers:', Array.from(this.providers.keys()).filter(p => this.isProviderReady(p)));
    }
    /**
     * Check if a provider is ready for use
     */
    isProviderReady(provider) {
        switch (provider) {
            case 'composio':
                return !!process.env.COMPOSIO_API_KEY;
            case 'google':
                return !!this.googleAuth.projectId || !!this.googleAuth.accessToken;
            case 'zapier':
                return !!this.zapierAuth.accessToken;
            default:
                return false;
        }
    }
    /**
     * Determine which provider should handle a tool
     */
    getProviderForTool(toolSlug) {
        const upperSlug = toolSlug.toUpperCase();
        for (const [prefix, provider] of Object.entries(TOOL_ROUTING)) {
            if (upperSlug.startsWith(prefix)) {
                return provider;
            }
        }
        // Default to composio for unknown tools
        return 'composio';
    }
    /**
     * Get all available providers with their status
     */
    getProviders() {
        return Array.from(this.providers.values()).map(p => ({
            ...p,
            ready: this.isProviderReady(p.type),
        }));
    }
    /**
     * Initiate OAuth connection for a provider
     */
    async initiateConnection(provider, toolkit, redirectUrl) {
        switch (provider) {
            case 'google':
                return this.initiateGoogleAuth(toolkit, redirectUrl);
            case 'zapier':
                return this.initiateZapierAuth(toolkit, redirectUrl);
            case 'composio':
                // Composio is handled by the existing ComposioService
                return { error: 'Use /api/composio/connect for Composio connections' };
            default:
                return { error: `Unknown provider: ${provider}` };
        }
    }
    /**
     * Initiate Google Cloud MCP OAuth
     */
    async initiateGoogleAuth(toolkit, redirectUrl) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            return {
                error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
            };
        }
        // Build OAuth URL for Google
        const scopes = this.getGoogleScopes(toolkit);
        const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
        const callback = redirectUrl || `${process.env.APP_URL || 'http://localhost:5173'}/oauth/callback/google`;
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: callback,
            response_type: 'code',
            scope: scopes.join(' '),
            access_type: 'offline',
            prompt: 'consent',
            state: JSON.stringify({ toolkit, provider: 'google' }),
        });
        return {
            authUrl: `${baseUrl}?${params.toString()}`,
        };
    }
    /**
     * Get required Google scopes for a toolkit
     */
    getGoogleScopes(toolkit) {
        const scopeMap = {
            gmail: ['https://www.googleapis.com/auth/gmail.modify'],
            calendar: ['https://www.googleapis.com/auth/calendar'],
            sheets: ['https://www.googleapis.com/auth/spreadsheets'],
            drive: ['https://www.googleapis.com/auth/drive'],
            docs: ['https://www.googleapis.com/auth/documents'],
            maps: [], // Maps API uses API key, not OAuth
            bigquery: ['https://www.googleapis.com/auth/bigquery'],
            compute: ['https://www.googleapis.com/auth/compute'],
            kubernetes: ['https://www.googleapis.com/auth/cloud-platform'],
        };
        return scopeMap[toolkit.toLowerCase()] || ['openid', 'email', 'profile'];
    }
    /**
     * Initiate Zapier MCP OAuth
     */
    async initiateZapierAuth(toolkit, redirectUrl) {
        const clientId = process.env.ZAPIER_CLIENT_ID;
        if (!clientId) {
            return {
                error: 'Zapier OAuth not configured. Set ZAPIER_CLIENT_ID.',
            };
        }
        // Zapier uses OAuth 2.0
        const baseUrl = 'https://zapier.com/oauth/authorize';
        const callback = redirectUrl || `${process.env.APP_URL || 'http://localhost:5173'}/oauth/callback/zapier`;
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: callback,
            response_type: 'code',
            scope: 'zap:write action:execute',
            state: JSON.stringify({ toolkit, provider: 'zapier' }),
        });
        return {
            authUrl: `${baseUrl}?${params.toString()}`,
        };
    }
    /**
     * Handle OAuth callback
     */
    async handleOAuthCallback(provider, code, _state) {
        switch (provider) {
            case 'google':
                return this.handleGoogleCallback(code);
            case 'zapier':
                return this.handleZapierCallback(code);
            default:
                return { success: false, error: `Unknown provider: ${provider}` };
        }
    }
    /**
     * Handle Google OAuth callback
     */
    async handleGoogleCallback(code) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            return { success: false, error: 'Google OAuth not configured' };
        }
        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: `${process.env.APP_URL || 'http://localhost:5173'}/oauth/callback/google`,
                    grant_type: 'authorization_code',
                }),
            });
            const data = await response.json();
            if (data.error) {
                return { success: false, error: data.error_description || data.error };
            }
            this.googleAuth.accessToken = data.access_token;
            this.googleAuth.refreshToken = data.refresh_token;
            this.googleAuth.expiresAt = new Date(Date.now() + (data.expires_in * 1000));
            console.log('[MCPProviderService] Google OAuth connected');
            return { success: true };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    }
    /**
     * Handle Zapier OAuth callback
     */
    async handleZapierCallback(code) {
        const clientId = process.env.ZAPIER_CLIENT_ID;
        const clientSecret = process.env.ZAPIER_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            return { success: false, error: 'Zapier OAuth not configured' };
        }
        try {
            const response = await fetch('https://zapier.com/oauth/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: `${process.env.APP_URL || 'http://localhost:5173'}/oauth/callback/zapier`,
                    grant_type: 'authorization_code',
                }),
            });
            const data = await response.json();
            if (data.error) {
                return { success: false, error: data.error_description || data.error };
            }
            this.zapierAuth.accessToken = data.access_token;
            this.zapierAuth.accountId = data.account_id;
            console.log('[MCPProviderService] Zapier OAuth connected');
            return { success: true };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    }
    /**
     * Execute a tool via the appropriate provider
     */
    async executeTool(toolSlug, params, preferredProvider) {
        const startTime = Date.now();
        const provider = preferredProvider || this.getProviderForTool(toolSlug);
        console.log(`[MCPProviderService] Executing ${toolSlug} via ${provider}`);
        if (!this.isProviderReady(provider)) {
            // Fallback to demo mode
            return this.generateDemoResponse(toolSlug, params, provider, startTime);
        }
        try {
            switch (provider) {
                case 'google':
                    return await this.executeGoogleTool(toolSlug, params, startTime);
                case 'zapier':
                    return await this.executeZapierTool(toolSlug, params, startTime);
                case 'composio':
                    // Composio is handled by the existing service
                    return {
                        success: false,
                        error: 'Use ComposioService for Composio tools',
                        provider: 'composio',
                        toolSlug,
                        executionTimeMs: Date.now() - startTime,
                    };
                default:
                    return this.generateDemoResponse(toolSlug, params, provider, startTime);
            }
        }
        catch (error) {
            return {
                success: false,
                error: String(error),
                provider,
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
    }
    /**
     * Execute tool via Google Cloud MCP
     */
    async executeGoogleTool(toolSlug, params, startTime) {
        const accessToken = this.googleAuth.accessToken;
        if (!accessToken) {
            return {
                success: false,
                error: 'Google MCP not authenticated. Connect via OAuth.',
                provider: 'google',
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
        // Map tool slugs to Google API endpoints
        const apiEndpoint = this.getGoogleApiEndpoint(toolSlug, params);
        if (!apiEndpoint) {
            return this.generateDemoResponse(toolSlug, params, 'google', startTime);
        }
        try {
            const response = await fetch(apiEndpoint.url, {
                method: apiEndpoint.method,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: apiEndpoint.body ? JSON.stringify(apiEndpoint.body) : undefined,
            });
            const data = await response.json();
            if (!response.ok) {
                return {
                    success: false,
                    error: data.error?.message || 'Google API error',
                    provider: 'google',
                    toolSlug,
                    executionTimeMs: Date.now() - startTime,
                };
            }
            return {
                success: true,
                data,
                provider: 'google',
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                success: false,
                error: String(error),
                provider: 'google',
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
    }
    /**
     * Get Google API endpoint for a tool
     */
    getGoogleApiEndpoint(toolSlug, params) {
        const slug = toolSlug.toUpperCase();
        // Google Maps
        if (slug.includes('GOOGLE_MAPS_SEARCH')) {
            return {
                url: `https://places.googleapis.com/v1/places:searchText`,
                method: 'POST',
                body: { textQuery: params.query },
            };
        }
        // BigQuery
        if (slug.includes('GOOGLE_BIGQUERY_QUERY')) {
            return {
                url: `https://bigquery.googleapis.com/bigquery/v2/projects/${this.googleAuth.projectId}/queries`,
                method: 'POST',
                body: { query: params.query, useLegacySql: false },
            };
        }
        // More endpoints can be added as needed
        return null;
    }
    /**
     * Execute tool via Zapier MCP
     */
    async executeZapierTool(toolSlug, params, startTime) {
        const accessToken = this.zapierAuth.accessToken;
        if (!accessToken) {
            return {
                success: false,
                error: 'Zapier MCP not authenticated. Connect via OAuth.',
                provider: 'zapier',
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
        // Zapier MCP uses a REST-like API
        const zapierEndpoint = 'https://actions.zapier.com/api/v2/execute/';
        try {
            // Map our tool slug to Zapier action
            const actionId = this.getZapierActionId(toolSlug);
            if (!actionId) {
                return this.generateDemoResponse(toolSlug, params, 'zapier', startTime);
            }
            const response = await fetch(zapierEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action_id: actionId,
                    inputs: params,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || 'Zapier API error',
                    provider: 'zapier',
                    toolSlug,
                    executionTimeMs: Date.now() - startTime,
                };
            }
            return {
                success: true,
                data: data.result || data,
                provider: 'zapier',
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                success: false,
                error: String(error),
                provider: 'zapier',
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
    }
    /**
     * Map tool slug to Zapier action ID
     */
    getZapierActionId(toolSlug) {
        // This would typically be fetched from Zapier's action catalog
        // For now, return null to trigger demo mode
        const actionMap = {
            'ZAPIER_AIRTABLE_CREATE_RECORD': 'airtable.create_record',
            'ZAPIER_SALESFORCE_CREATE_LEAD': 'salesforce.create_lead',
            'ZAPIER_STRIPE_CREATE_INVOICE': 'stripe.create_invoice',
            'ZAPIER_MAILCHIMP_ADD_SUBSCRIBER': 'mailchimp.add_subscriber',
            'ZAPIER_TWILIO_SEND_SMS': 'twilio.send_sms',
            'ZAPIER_SENDGRID_SEND_EMAIL': 'sendgrid.send_email',
            'ZAPIER_ZENDESK_CREATE_TICKET': 'zendesk.create_ticket',
        };
        return actionMap[toolSlug.toUpperCase()] || null;
    }
    /**
     * Generate demo response for testing
     */
    generateDemoResponse(toolSlug, params, provider, startTime) {
        const timestamp = new Date().toISOString();
        return {
            success: true,
            data: {
                message: `Demo: ${toolSlug} executed via ${provider}`,
                params,
                timestamp,
                demoMode: true,
            },
            provider,
            toolSlug,
            executionTimeMs: Date.now() - startTime,
        };
    }
    /**
     * Get connection status for all providers
     */
    async getConnectionStatus() {
        return {
            composio: {
                connected: !!process.env.COMPOSIO_API_KEY,
                details: process.env.COMPOSIO_API_KEY ? 'API key configured' : 'No API key',
            },
            google: {
                connected: !!this.googleAuth.accessToken,
                details: this.googleAuth.accessToken
                    ? `Connected (expires: ${this.googleAuth.expiresAt?.toISOString()})`
                    : this.googleAuth.projectId ? 'Project configured, needs OAuth' : 'Not configured',
            },
            zapier: {
                connected: !!this.zapierAuth.accessToken,
                details: this.zapierAuth.accessToken
                    ? `Connected (account: ${this.zapierAuth.accountId})`
                    : 'Not configured',
            },
        };
    }
    // Getters
    get initialized() {
        return this.isInitialized;
    }
}
// Export singleton
export const mcpProviderService = new MCPProviderServiceClass();
//# sourceMappingURL=MCPProviderService.js.map
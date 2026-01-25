/**
 * MCP Providers Routes - Multi-Provider MCP Support
 *
 * Handles OAuth and tool execution for:
 * - Google Cloud MCP (free for GCP customers)
 * - Zapier MCP (8,000+ apps, 30,000+ actions)
 *
 * Composio continues to use /api/composio routes.
 */
import { Router } from 'express';
import { mcpProviderService } from '../services/MCPProviderService.js';
const router = Router();
let isInitialized = false;
async function ensureInitialized() {
    if (!isInitialized) {
        await mcpProviderService.initialize();
        isInitialized = true;
    }
}
// =============================================================================
// Provider Status & Discovery
// =============================================================================
/**
 * GET /api/mcp/providers
 * List all available MCP providers with status
 */
router.get('/providers', async (_req, res) => {
    try {
        await ensureInitialized();
        const providers = mcpProviderService.getProviders();
        const connectionStatus = await mcpProviderService.getConnectionStatus();
        res.json({
            success: true,
            providers: providers.map(p => ({
                ...p,
                connectionStatus: connectionStatus[p.type],
            })),
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
 * GET /api/mcp/status
 * Get overall MCP integration status
 */
router.get('/status', async (_req, res) => {
    try {
        await ensureInitialized();
        const connectionStatus = await mcpProviderService.getConnectionStatus();
        res.json({
            success: true,
            initialized: mcpProviderService.initialized,
            providers: connectionStatus,
            summary: {
                totalProviders: 3,
                connectedProviders: Object.values(connectionStatus).filter(s => s.connected).length,
            },
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
// OAuth Connection
// =============================================================================
/**
 * POST /api/mcp/connect/:provider/:toolkit
 * Initiate OAuth connection for a specific provider
 */
router.post('/connect/:provider/:toolkit', async (req, res) => {
    const { provider, toolkit } = req.params;
    const { redirectUrl } = req.body;
    try {
        await ensureInitialized();
        // Validate provider
        if (!['google', 'zapier'].includes(provider)) {
            return res.status(400).json({
                success: false,
                error: `Invalid provider: ${provider}. Use 'google' or 'zapier'.`,
            });
        }
        const result = await mcpProviderService.initiateConnection(provider, toolkit, redirectUrl);
        if (result.error) {
            return res.status(400).json({
                success: false,
                error: result.error,
            });
        }
        res.json({
            success: true,
            provider,
            toolkit,
            authUrl: result.authUrl,
            message: 'Click the URL to connect your account',
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
 * GET /api/mcp/callback/:provider
 * Handle OAuth callback from providers
 */
router.get('/callback/:provider', async (req, res) => {
    const { provider } = req.params;
    const { code, state, error: oauthError } = req.query;
    if (oauthError) {
        return res.redirect(`/settings/integrations?error=${encodeURIComponent(String(oauthError))}`);
    }
    if (!code) {
        return res.redirect('/settings/integrations?error=missing_code');
    }
    try {
        await ensureInitialized();
        const result = await mcpProviderService.handleOAuthCallback(provider, String(code), state ? String(state) : undefined);
        if (!result.success) {
            return res.redirect(`/settings/integrations?error=${encodeURIComponent(result.error || 'unknown')}`);
        }
        // Parse state to get toolkit if available
        let toolkit = 'default';
        if (state) {
            try {
                const stateData = JSON.parse(String(state));
                toolkit = stateData.toolkit || 'default';
            }
            catch {
                // Ignore parse errors
            }
        }
        res.redirect(`/settings/integrations?connected=${provider}&toolkit=${toolkit}`);
    }
    catch (error) {
        res.redirect(`/settings/integrations?error=${encodeURIComponent(String(error))}`);
    }
});
// =============================================================================
// Tool Execution
// =============================================================================
/**
 * POST /api/mcp/execute
 * Execute a tool via the appropriate MCP provider
 */
router.post('/execute', async (req, res) => {
    const { toolSlug, params, preferredProvider } = req.body;
    if (!toolSlug) {
        return res.status(400).json({
            success: false,
            error: 'toolSlug is required',
        });
    }
    try {
        await ensureInitialized();
        const result = await mcpProviderService.executeTool(toolSlug, params || {}, preferredProvider);
        if (!result.success) {
            return res.status(400).json(result);
        }
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
 * POST /api/mcp/execute/:provider
 * Execute a tool via a specific provider
 */
router.post('/execute/:provider', async (req, res) => {
    const { provider } = req.params;
    const { toolSlug, params } = req.body;
    if (!toolSlug) {
        return res.status(400).json({
            success: false,
            error: 'toolSlug is required',
        });
    }
    if (!['google', 'zapier', 'composio'].includes(provider)) {
        return res.status(400).json({
            success: false,
            error: `Invalid provider: ${provider}`,
        });
    }
    try {
        await ensureInitialized();
        const result = await mcpProviderService.executeTool(toolSlug, params || {}, provider);
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
// Provider-Specific Endpoints
// =============================================================================
/**
 * GET /api/mcp/google/status
 * Get Google Cloud MCP connection status
 */
router.get('/google/status', async (_req, res) => {
    try {
        await ensureInitialized();
        const status = await mcpProviderService.getConnectionStatus();
        res.json({
            success: true,
            provider: 'google',
            ...status.google,
            capabilities: [
                'Google Maps',
                'BigQuery',
                'Compute Engine',
                'Kubernetes Engine',
                'Drive',
                'Gmail',
                'Calendar',
                'Sheets',
                'Docs',
            ],
            costModel: 'Free for GCP customers',
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
 * GET /api/mcp/zapier/status
 * Get Zapier MCP connection status
 */
router.get('/zapier/status', async (_req, res) => {
    try {
        await ensureInitialized();
        const status = await mcpProviderService.getConnectionStatus();
        res.json({
            success: true,
            provider: 'zapier',
            ...status.zapier,
            capabilities: [
                '8,000+ apps',
                '30,000+ actions',
                'Airtable',
                'Salesforce',
                'Stripe',
                'Mailchimp',
                'Twilio',
                'SendGrid',
                'Zendesk',
                'Shopify',
                'And many more...',
            ],
            costModel: 'Task credits',
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
 * GET /api/mcp/google/tools
 * List available Google Cloud MCP tools
 */
router.get('/google/tools', async (_req, res) => {
    res.json({
        success: true,
        provider: 'google',
        tools: [
            { slug: 'GOOGLE_MAPS_SEARCH', name: 'Search Places', category: 'maps' },
            { slug: 'GOOGLE_MAPS_DIRECTIONS', name: 'Get Directions', category: 'maps' },
            { slug: 'GOOGLE_BIGQUERY_QUERY', name: 'Run Query', category: 'bigquery' },
            { slug: 'GOOGLE_BIGQUERY_INSERT', name: 'Insert Data', category: 'bigquery' },
            { slug: 'GOOGLE_COMPUTE_LIST_INSTANCES', name: 'List Instances', category: 'compute' },
            { slug: 'GOOGLE_COMPUTE_CREATE_INSTANCE', name: 'Create Instance', category: 'compute' },
            { slug: 'GOOGLE_KUBERNETES_LIST_CLUSTERS', name: 'List Clusters', category: 'kubernetes' },
            { slug: 'GOOGLE_KUBERNETES_DEPLOY', name: 'Deploy Workload', category: 'kubernetes' },
            { slug: 'GOOGLE_DRIVE_LIST_FILES', name: 'List Files', category: 'drive' },
            { slug: 'GOOGLE_DRIVE_UPLOAD', name: 'Upload File', category: 'drive' },
            { slug: 'GOOGLE_DOCS_CREATE', name: 'Create Document', category: 'docs' },
            { slug: 'GOOGLE_GMAIL_SEND', name: 'Send Email', category: 'gmail' },
            { slug: 'GOOGLE_CALENDAR_CREATE', name: 'Create Event', category: 'calendar' },
            { slug: 'GOOGLE_SHEETS_APPEND', name: 'Append Data', category: 'sheets' },
        ],
        note: 'These tools are FREE for GCP customers',
    });
});
/**
 * GET /api/mcp/zapier/tools
 * List available Zapier MCP tools (sampling)
 */
router.get('/zapier/tools', async (_req, res) => {
    res.json({
        success: true,
        provider: 'zapier',
        tools: [
            { slug: 'ZAPIER_SEARCH_APPS', name: 'Search Apps', category: 'core' },
            { slug: 'ZAPIER_EXECUTE_ACTION', name: 'Execute Action', category: 'core' },
            { slug: 'ZAPIER_CREATE_ZAP', name: 'Create Zap', category: 'core' },
            { slug: 'ZAPIER_AIRTABLE_CREATE_RECORD', name: 'Create Airtable Record', category: 'airtable' },
            { slug: 'ZAPIER_HUBSPOT_CREATE_CONTACT', name: 'Create HubSpot Contact', category: 'hubspot' },
            { slug: 'ZAPIER_SALESFORCE_CREATE_LEAD', name: 'Create Salesforce Lead', category: 'salesforce' },
            { slug: 'ZAPIER_STRIPE_CREATE_INVOICE', name: 'Create Stripe Invoice', category: 'stripe' },
            { slug: 'ZAPIER_MAILCHIMP_ADD_SUBSCRIBER', name: 'Add Mailchimp Subscriber', category: 'mailchimp' },
            { slug: 'ZAPIER_JIRA_CREATE_ISSUE', name: 'Create Jira Issue', category: 'jira' },
            { slug: 'ZAPIER_ASANA_CREATE_TASK', name: 'Create Asana Task', category: 'asana' },
            { slug: 'ZAPIER_TRELLO_CREATE_CARD', name: 'Create Trello Card', category: 'trello' },
            { slug: 'ZAPIER_INTERCOM_SEND_MESSAGE', name: 'Send Intercom Message', category: 'intercom' },
            { slug: 'ZAPIER_ZENDESK_CREATE_TICKET', name: 'Create Zendesk Ticket', category: 'zendesk' },
            { slug: 'ZAPIER_SHOPIFY_CREATE_ORDER', name: 'Create Shopify Order', category: 'shopify' },
            { slug: 'ZAPIER_TWILIO_SEND_SMS', name: 'Send Twilio SMS', category: 'twilio' },
            { slug: 'ZAPIER_SENDGRID_SEND_EMAIL', name: 'Send SendGrid Email', category: 'sendgrid' },
        ],
        totalApps: '8,000+',
        totalActions: '30,000+',
        note: 'Use ZAPIER_SEARCH_APPS to discover more apps and actions',
    });
});
export default router;
//# sourceMappingURL=mcp-providers.js.map
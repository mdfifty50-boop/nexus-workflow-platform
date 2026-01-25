import { Router } from 'express';
import { integrationService, INTEGRATION_PROVIDERS } from '../services/integrationService.js';
import { workflowOrchestrator } from '../services/WorkflowOrchestrator.js';
import { broadcastWorkflowUpdate } from './sse.js';
const router = Router();
// =============================================================================
// Rube MCP Tool Slugs - Maps integration names to Rube tool slugs
// =============================================================================
const RUBE_TOOL_SLUGS = {
    gmail: {
        send_email: 'GMAIL_SEND_EMAIL',
        fetch_emails: 'GMAIL_FETCH_EMAILS',
        search: 'GMAIL_SEARCH_EMAILS',
        create_draft: 'GMAIL_CREATE_DRAFT',
        get_thread: 'GMAIL_GET_THREAD',
        list_labels: 'GMAIL_LIST_LABELS',
        add_label: 'GMAIL_ADD_LABEL_TO_EMAIL',
    },
    slack: {
        send_message: 'SLACK_SEND_MESSAGE',
        list_channels: 'SLACK_LIST_CHANNELS',
        search: 'SLACK_SEARCH_MESSAGES',
        get_channel_history: 'SLACK_GET_CHANNEL_HISTORY',
        create_channel: 'SLACK_CREATE_CHANNEL',
        upload_file: 'SLACK_UPLOAD_FILE',
    },
    google_calendar: {
        create_event: 'GOOGLECALENDAR_CREATE_EVENT',
        list_events: 'GOOGLECALENDAR_LIST_EVENTS',
        update_event: 'GOOGLECALENDAR_UPDATE_EVENT',
        delete_event: 'GOOGLECALENDAR_DELETE_EVENT',
        get_event: 'GOOGLECALENDAR_GET_EVENT',
    },
    google_sheets: {
        read: 'GOOGLESHEETS_BATCH_GET',
        write: 'GOOGLESHEETS_BATCH_UPDATE',
        update: 'GOOGLESHEETS_BATCH_UPDATE',
        create: 'GOOGLESHEETS_CREATE_GOOGLE_SHEET1',
        upsert: 'GOOGLESHEETS_UPSERT_ROWS',
    },
    google_drive: {
        upload: 'GOOGLEDRIVE_UPLOAD_FILE',
        list: 'GOOGLEDRIVE_LIST_FILES',
        download: 'GOOGLEDRIVE_DOWNLOAD_FILE',
        create_folder: 'GOOGLEDRIVE_CREATE_FOLDER',
        share: 'GOOGLEDRIVE_SHARE_FILE',
    },
    notion: {
        create_page: 'NOTION_CREATE_PAGE',
        update_page: 'NOTION_UPDATE_PAGE',
        search: 'NOTION_SEARCH',
        get_page: 'NOTION_GET_PAGE',
        list_databases: 'NOTION_LIST_DATABASES',
        query_database: 'NOTION_QUERY_DATABASE',
    },
    github: {
        create_issue: 'GITHUB_CREATE_ISSUE',
        list_issues: 'GITHUB_LIST_ISSUES',
        create_pr: 'GITHUB_CREATE_PULL_REQUEST',
        list_prs: 'GITHUB_LIST_PULL_REQUESTS',
        get_repo: 'GITHUB_GET_REPOSITORY',
        list_repos: 'GITHUB_LIST_REPOSITORIES',
    },
    jira: {
        create_issue: 'JIRA_CREATE_ISSUE',
        update_issue: 'JIRA_UPDATE_ISSUE',
        search: 'JIRA_SEARCH_ISSUES',
        get_issue: 'JIRA_GET_ISSUE',
        add_comment: 'JIRA_ADD_COMMENT',
    },
    hubspot: {
        create_contact: 'HUBSPOT_CREATE_CONTACT',
        update_contact: 'HUBSPOT_UPDATE_CONTACT',
        search_contacts: 'HUBSPOT_SEARCH_CONTACTS',
        create_deal: 'HUBSPOT_CREATE_DEAL',
        list_deals: 'HUBSPOT_LIST_DEALS',
    },
    salesforce: {
        create_lead: 'SALESFORCE_CREATE_LEAD',
        update_lead: 'SALESFORCE_UPDATE_LEAD',
        search: 'SALESFORCE_SEARCH',
        create_opportunity: 'SALESFORCE_CREATE_OPPORTUNITY',
    },
    twitter: {
        post_tweet: 'TWITTER_CREATE_TWEET',
        search: 'TWITTER_SEARCH_TWEETS',
        get_user: 'TWITTER_GET_USER',
    },
    linkedin: {
        post: 'LINKEDIN_CREATE_POST',
        get_profile: 'LINKEDIN_GET_PROFILE',
    },
    trello: {
        create_card: 'TRELLO_CREATE_CARD',
        update_card: 'TRELLO_UPDATE_CARD',
        list_boards: 'TRELLO_LIST_BOARDS',
        list_cards: 'TRELLO_LIST_CARDS',
    },
    asana: {
        create_task: 'ASANA_CREATE_TASK',
        update_task: 'ASANA_UPDATE_TASK',
        list_tasks: 'ASANA_LIST_TASKS',
        list_projects: 'ASANA_LIST_PROJECTS',
    },
    zoom: {
        create_meeting: 'ZOOM_CREATE_MEETING',
        list_meetings: 'ZOOM_LIST_MEETINGS',
        get_recording: 'ZOOM_GET_RECORDING',
    },
    discord: {
        send_message: 'DISCORD_SEND_MESSAGE',
        list_channels: 'DISCORD_LIST_CHANNELS',
    },
    airtable: {
        create_record: 'AIRTABLE_CREATE_RECORD',
        update_record: 'AIRTABLE_UPDATE_RECORD',
        list_records: 'AIRTABLE_LIST_RECORDS',
        search: 'AIRTABLE_SEARCH_RECORDS',
    },
    dropbox: {
        upload: 'DROPBOX_UPLOAD_FILE',
        download: 'DROPBOX_DOWNLOAD_FILE',
        list: 'DROPBOX_LIST_FILES',
    },
    mailchimp: {
        add_subscriber: 'MAILCHIMP_ADD_SUBSCRIBER',
        create_campaign: 'MAILCHIMP_CREATE_CAMPAIGN',
        list_campaigns: 'MAILCHIMP_LIST_CAMPAIGNS',
    },
    twilio: {
        send_sms: 'TWILIO_SEND_SMS',
        make_call: 'TWILIO_MAKE_CALL',
    },
    shopify: {
        create_product: 'SHOPIFY_CREATE_PRODUCT',
        list_products: 'SHOPIFY_LIST_PRODUCTS',
        list_orders: 'SHOPIFY_LIST_ORDERS',
    },
    stripe: {
        create_customer: 'STRIPE_CREATE_CUSTOMER',
        create_invoice: 'STRIPE_CREATE_INVOICE',
        list_payments: 'STRIPE_LIST_PAYMENTS',
    },
    zendesk: {
        create_ticket: 'ZENDESK_CREATE_TICKET',
        update_ticket: 'ZENDESK_UPDATE_TICKET',
        list_tickets: 'ZENDESK_LIST_TICKETS',
    },
    intercom: {
        create_contact: 'INTERCOM_CREATE_CONTACT',
        send_message: 'INTERCOM_SEND_MESSAGE',
    },
    monday: {
        create_item: 'MONDAY_CREATE_ITEM',
        update_item: 'MONDAY_UPDATE_ITEM',
        list_boards: 'MONDAY_LIST_BOARDS',
    },
    clickup: {
        create_task: 'CLICKUP_CREATE_TASK',
        update_task: 'CLICKUP_UPDATE_TASK',
        list_tasks: 'CLICKUP_LIST_TASKS',
    },
    calendly: {
        list_events: 'CALENDLY_LIST_EVENTS',
        get_event: 'CALENDLY_GET_EVENT',
    },
    typeform: {
        list_responses: 'TYPEFORM_LIST_RESPONSES',
        get_form: 'TYPEFORM_GET_FORM',
    },
    webflow: {
        list_sites: 'WEBFLOW_LIST_SITES',
        create_item: 'WEBFLOW_CREATE_ITEM',
        publish: 'WEBFLOW_PUBLISH_SITE',
    },
    figma: {
        get_file: 'FIGMA_GET_FILE',
        get_comments: 'FIGMA_GET_COMMENTS',
        export_images: 'FIGMA_EXPORT_IMAGES',
    },
};
// Middleware to extract Clerk user ID
const extractClerkUserId = (req, _res, next) => {
    const userId = req.headers['x-clerk-user-id'];
    if (userId) {
        req.body.clerk_user_id = userId;
    }
    next();
};
// =============================================================================
// OAuth Integration Routes (Story 6.1, 6.3)
// =============================================================================
/**
 * GET /api/integrations/providers
 * List all available integration providers
 */
router.get('/providers', (_req, res) => {
    const providers = integrationService.getAvailableProviders();
    res.json({ success: true, data: providers });
});
/**
 * GET /api/integrations/oauth/authorize/:providerId
 * Generate OAuth authorization URL (Story 6.1)
 */
router.get('/oauth/authorize/:providerId', extractClerkUserId, (req, res) => {
    const { providerId } = req.params;
    const { projectId, redirectUri } = req.query;
    const clerkUserId = req.body.clerk_user_id;
    if (!clerkUserId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!projectId || !redirectUri) {
        return res.status(400).json({ success: false, error: 'projectId and redirectUri are required' });
    }
    const result = integrationService.generateAuthUrl(providerId, clerkUserId, projectId, redirectUri);
    if ('error' in result) {
        return res.status(400).json({ success: false, error: result.error });
    }
    res.json({ success: true, data: result });
});
/**
 * POST /api/integrations/oauth/callback
 * Handle OAuth callback and exchange code for tokens (Story 6.1)
 */
router.post('/oauth/callback', async (req, res) => {
    const { providerId, code, state, redirectUri } = req.body;
    if (!providerId || !code || !state || !redirectUri) {
        return res.status(400).json({
            success: false,
            error: 'providerId, code, state, and redirectUri are required',
        });
    }
    const result = await integrationService.exchangeCodeForTokens(providerId, code, redirectUri, state);
    if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
    }
    res.json({
        success: true,
        message: `${INTEGRATION_PROVIDERS[providerId]?.name || providerId} connected successfully`,
        data: {
            provider: providerId,
            connected: true,
        },
    });
});
/**
 * POST /api/integrations/oauth/reconnect/:credentialId
 * One-tap OAuth reconnect (Story 6.3)
 */
router.post('/oauth/reconnect/:credentialId', extractClerkUserId, async (req, res) => {
    const { credentialId } = req.params;
    const result = await integrationService.refreshToken(credentialId);
    if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
    }
    res.json({ success: true, message: 'Token refreshed successfully' });
});
// =============================================================================
// Integration Management Routes
// =============================================================================
/**
 * GET /api/integrations/project/:projectId
 * Get all integrations for a project
 */
router.get('/project/:projectId', extractClerkUserId, async (req, res) => {
    const { projectId } = req.params;
    const clerkUserId = req.body.clerk_user_id;
    if (!clerkUserId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const integrations = await integrationService.getProjectIntegrations(clerkUserId, projectId);
    // Remove encrypted tokens from response
    const safeIntegrations = integrations.map(({ access_token_encrypted: _a, refresh_token_encrypted: _r, ...rest }) => rest);
    res.json({ success: true, data: safeIntegrations });
});
/**
 * DELETE /api/integrations/:projectId/:providerId
 * Disconnect an integration
 */
router.delete('/:projectId/:providerId', extractClerkUserId, async (req, res) => {
    const { projectId, providerId } = req.params;
    const clerkUserId = req.body.clerk_user_id;
    if (!clerkUserId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const result = await integrationService.disconnectIntegration(clerkUserId, projectId, providerId);
    if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
    }
    res.json({ success: true, message: `${providerId} disconnected successfully` });
});
/**
 * POST /api/integrations/health/:credentialId
 * Check integration health (Story 6.2)
 */
router.post('/health/:credentialId', async (req, res) => {
    const { credentialId } = req.params;
    const result = await integrationService.checkHealth(credentialId);
    res.json({ success: true, data: result });
});
/**
 * GET /api/integrations/analytics/:projectId
 * Get integration usage analytics (Story 6.7)
 */
router.get('/analytics/:projectId', extractClerkUserId, async (req, res) => {
    const { projectId } = req.params;
    const clerkUserId = req.body.clerk_user_id;
    if (!clerkUserId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const analytics = await integrationService.getUsageAnalytics(clerkUserId, projectId);
    res.json({ success: true, data: analytics });
});
// =============================================================================
// Legacy Integration Routes (existing functionality)
// =============================================================================
// POST /api/integrations/hubspot - HubSpot CRM operations
router.post('/hubspot', async (req, res) => {
    try {
        const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
        if (!accessToken) {
            return res.status(500).json({
                success: false,
                error: 'HubSpot not configured',
                hint: 'Add HUBSPOT_ACCESS_TOKEN environment variable'
            });
        }
        const { action, data, contactId, query, limit = 10 } = req.body;
        const HUBSPOT_API = 'https://api.hubapi.com';
        async function hubspotRequest(method, endpoint, body) {
            const response = await fetch(`${HUBSPOT_API}${endpoint}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: body ? JSON.stringify(body) : undefined
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `HubSpot API error: ${response.status}`);
            }
            return result;
        }
        let result;
        switch (action) {
            case 'createContact': {
                if (!data?.email) {
                    return res.status(400).json({ success: false, error: 'Email is required' });
                }
                const properties = { email: data.email };
                if (data.firstName)
                    properties.firstname = data.firstName;
                if (data.lastName)
                    properties.lastname = data.lastName;
                if (data.phone)
                    properties.phone = data.phone;
                if (data.company)
                    properties.company = data.company;
                result = await hubspotRequest('POST', '/crm/v3/objects/contacts', { properties });
                break;
            }
            case 'updateContact': {
                if (!contactId) {
                    return res.status(400).json({ success: false, error: 'contactId is required' });
                }
                const properties = {};
                if (data?.email)
                    properties.email = data.email;
                if (data?.firstName)
                    properties.firstname = data.firstName;
                if (data?.lastName)
                    properties.lastname = data.lastName;
                if (data?.phone)
                    properties.phone = data.phone;
                if (data?.company)
                    properties.company = data.company;
                result = await hubspotRequest('PATCH', `/crm/v3/objects/contacts/${contactId}`, { properties });
                break;
            }
            case 'getContact': {
                if (!contactId) {
                    return res.status(400).json({ success: false, error: 'contactId is required' });
                }
                result = await hubspotRequest('GET', `/crm/v3/objects/contacts/${contactId}?properties=email,firstname,lastname,phone,company`);
                break;
            }
            case 'searchContacts': {
                if (!query) {
                    return res.status(400).json({ success: false, error: 'query is required' });
                }
                result = await hubspotRequest('POST', '/crm/v3/objects/contacts/search', {
                    query,
                    limit,
                    properties: ['email', 'firstname', 'lastname', 'phone', 'company']
                });
                break;
            }
            case 'listContacts': {
                result = await hubspotRequest('GET', `/crm/v3/objects/contacts?limit=${limit}&properties=email,firstname,lastname,phone,company`);
                break;
            }
            case 'createDeal': {
                if (!data) {
                    return res.status(400).json({ success: false, error: 'Deal data is required' });
                }
                result = await hubspotRequest('POST', '/crm/v3/objects/deals', {
                    properties: {
                        dealname: data.name || 'New Deal',
                        amount: data.amount || '0',
                        pipeline: data.pipeline || 'default',
                        dealstage: data.stage || 'appointmentscheduled',
                        ...data.properties
                    }
                });
                break;
            }
            default:
                return res.status(400).json({
                    success: false,
                    error: `Unknown action: ${action}`,
                    availableActions: ['createContact', 'updateContact', 'getContact', 'searchContacts', 'listContacts', 'createDeal']
                });
        }
        res.json({ success: true, action, result });
    }
    catch (error) {
        console.error('HubSpot error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// POST /api/integrations/email - Send email via Resend
router.post('/email', async (req, res) => {
    try {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: 'Email not configured',
                hint: 'Add RESEND_API_KEY environment variable'
            });
        }
        const { to, subject, body, from, replyTo } = req.body;
        if (!to || !subject || !body) {
            return res.status(400).json({
                success: false,
                error: 'to, subject, and body are required'
            });
        }
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: from || 'Nexus <onboarding@resend.dev>',
                to: Array.isArray(to) ? to : [to],
                subject,
                html: body,
                reply_to: replyTo
            })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Email sending failed');
        }
        res.json({
            success: true,
            emailId: result.id,
            message: 'Email sent successfully'
        });
    }
    catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// POST /api/integrations/youtube - Extract YouTube content
router.post('/youtube', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'YouTube URL is required'
            });
        }
        // Extract video ID
        const videoId = extractYouTubeId(url);
        if (!videoId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid YouTube URL'
            });
        }
        // Try to get video info via oEmbed (no API key needed)
        const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        let videoInfo = { videoId };
        if (oembedResponse.ok) {
            const oembed = await oembedResponse.json();
            videoInfo = {
                ...videoInfo,
                title: oembed.title,
                author: oembed.author_name,
                authorUrl: oembed.author_url,
                thumbnail: oembed.thumbnail_url
            };
        }
        // Note: Full transcript extraction requires YouTube Data API or third-party service
        // For now, return basic info and suggest manual transcript input
        res.json({
            success: true,
            video: videoInfo,
            note: 'For full transcript extraction, add YOUTUBE_API_KEY or paste transcript manually.'
        });
    }
    catch (error) {
        console.error('YouTube error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
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
// =============================================================================
// WORKFLOW EXECUTION ENDPOINTS (Real-time integration orchestration)
// =============================================================================
/**
 * Get the Rube tool slug for an integration action
 */
function getRubeToolSlug(integration, action) {
    const normalizedIntegration = integration.toLowerCase().replace(/[-\s]/g, '_');
    const normalizedAction = action.toLowerCase().replace(/[-\s]/g, '_');
    const integrationTools = RUBE_TOOL_SLUGS[normalizedIntegration];
    if (!integrationTools)
        return null;
    return integrationTools[normalizedAction] || null;
}
/**
 * POST /api/integrations/execute
 * Execute a single tool/integration via Rube MCP, Playwright, or embedded API
 */
router.post('/execute', extractClerkUserId, async (req, res) => {
    const { integration, action, params, provider: forceProvider, workflowId, stepId } = req.body;
    const _clerkUserId = req.body.clerk_user_id;
    const startTime = Date.now();
    if (!integration || !action) {
        return res.status(400).json({
            success: false,
            error: 'integration and action are required'
        });
    }
    try {
        // Determine the best provider
        let provider = 'rube';
        let toolSlug = null;
        // Check if we have a Rube tool for this
        toolSlug = getRubeToolSlug(integration, action);
        if (forceProvider) {
            provider = forceProvider;
        }
        else if (!toolSlug) {
            // No Rube tool - check if it's browser automation
            if (params?.url || integration === 'browser' || integration === 'playwright') {
                provider = 'playwright';
            }
            else {
                // Fallback to embedded if we have server-side API key
                const embeddedIntegrations = ['stripe', 'hubspot', 'resend', 'email'];
                if (embeddedIntegrations.includes(integration.toLowerCase())) {
                    provider = 'embedded';
                }
            }
        }
        // Broadcast step start via SSE
        if (workflowId && stepId) {
            broadcastWorkflowUpdate({
                type: 'step_started',
                workflowId,
                stepId,
                data: { provider, integration, action }
            });
        }
        let result;
        // Execute based on provider
        switch (provider) {
            case 'rube': {
                if (!toolSlug) {
                    throw new Error(`No Rube tool found for ${integration}:${action}. Available: ${Object.keys(RUBE_TOOL_SLUGS).join(', ')}`);
                }
                // Use RUBE_SEARCH_TOOLS and RUBE_MULTI_EXECUTE_TOOL via MCP
                // The actual MCP call happens via the client-side UniversalToolExecutor
                // Here we validate and prepare the request
                result = {
                    provider: 'rube',
                    toolSlug,
                    params,
                    status: 'ready_to_execute',
                    message: `Rube tool ${toolSlug} prepared for execution`
                };
                break;
            }
            case 'playwright': {
                // Browser automation via Playwright MCP
                const { url, actions, selector, text, screenshotPath } = params || {};
                if (!url && !actions) {
                    throw new Error('Playwright requires either url or actions array');
                }
                result = {
                    provider: 'playwright',
                    params: { url, actions, selector, text, screenshotPath },
                    status: 'ready_to_execute',
                    message: 'Playwright automation prepared'
                };
                break;
            }
            case 'embedded': {
                // Server-side API execution
                switch (integration.toLowerCase()) {
                    case 'stripe':
                        // Stripe operations handled by payments route
                        result = { provider: 'embedded', redirect: '/api/payments', params };
                        break;
                    case 'hubspot':
                        // Use existing HubSpot integration
                        result = { provider: 'embedded', redirect: '/api/integrations/hubspot', params };
                        break;
                    case 'email':
                    case 'resend':
                        result = { provider: 'embedded', redirect: '/api/integrations/email', params };
                        break;
                    default:
                        throw new Error(`No embedded handler for ${integration}`);
                }
                break;
            }
        }
        const durationMs = Date.now() - startTime;
        // Broadcast step completion via SSE
        if (workflowId && stepId) {
            broadcastWorkflowUpdate({
                type: 'step_completed',
                workflowId,
                stepId,
                data: { provider, result, durationMs }
            });
        }
        res.json({
            success: true,
            data: {
                ...result,
                durationMs,
                provider
            }
        });
    }
    catch (error) {
        console.error('Integration execution error:', error);
        // Broadcast step failure via SSE
        if (workflowId && stepId) {
            broadcastWorkflowUpdate({
                type: 'step_failed',
                workflowId,
                stepId,
                data: { error: error.message }
            });
        }
        res.status(500).json({
            success: false,
            error: error.message,
            durationMs: Date.now() - startTime
        });
    }
});
/**
 * POST /api/integrations/workflow/execute
 * Execute a complete workflow via the WorkflowOrchestrator
 */
router.post('/workflow/execute', extractClerkUserId, async (req, res) => {
    const { workflow, inputs, options } = req.body;
    const _clerkUserId = req.body.clerk_user_id;
    if (!workflow || !workflow.steps || workflow.steps.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Workflow with steps is required'
        });
    }
    try {
        // Validate workflow structure
        const workflowDef = {
            id: workflow.id || `wf_${Date.now()}`,
            name: workflow.name || 'Untitled Workflow',
            steps: workflow.steps.map((step, index) => ({
                id: step.id || `step_${index}`,
                name: step.task || step.name || `Step ${index + 1}`,
                agent: step.agent || 'nexus',
                tool: step.tool || step.integration,
                action: step.action || 'default',
                config: step.config || {},
                dependencies: step.dependencies || (index > 0 ? [`step_${index - 1}`] : [])
            })),
            requiredIntegrations: workflow.requiredIntegrations || []
        };
        // Subscribe to orchestrator events for SSE broadcasting
        const eventHandler = (event, data) => {
            broadcastWorkflowUpdate({
                type: event,
                workflowId: workflowDef.id,
                stepId: data.stepId,
                data
            });
        };
        workflowOrchestrator.on('workflow_started', (data) => eventHandler('workflow_started', data));
        workflowOrchestrator.on('step_started', (data) => eventHandler('step_started', data));
        workflowOrchestrator.on('step_completed', (data) => eventHandler('step_completed', data));
        workflowOrchestrator.on('step_failed', (data) => eventHandler('step_failed', data));
        workflowOrchestrator.on('workflow_completed', (data) => eventHandler('workflow_completed', data));
        workflowOrchestrator.on('workflow_failed', (data) => eventHandler('workflow_failed', data));
        // Execute workflow
        const result = await workflowOrchestrator.executeWorkflow(workflowDef, inputs || {}, {
            autonomyLevel: options?.autonomyLevel || 'autonomous',
            maxCostUsd: options?.maxCostUsd || 10
        });
        // Clean up event listeners
        workflowOrchestrator.removeAllListeners();
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Workflow execution error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /api/integrations/tools
 * List all available tools/integrations
 */
router.get('/tools', (_req, res) => {
    const tools = [];
    // Add Rube tools
    for (const [integration, actions] of Object.entries(RUBE_TOOL_SLUGS)) {
        tools.push({
            integration,
            actions: Object.keys(actions),
            provider: 'rube',
            description: `${integration} integration via Rube MCP (OAuth)`
        });
    }
    // Add Playwright tools
    tools.push({
        integration: 'browser',
        actions: ['navigate', 'click', 'type', 'screenshot', 'scrape', 'fill_form'],
        provider: 'playwright',
        description: 'Browser automation via Playwright MCP'
    });
    // Add embedded tools
    tools.push({
        integration: 'stripe',
        actions: ['create_checkout', 'create_customer', 'create_subscription', 'list_payments'],
        provider: 'embedded',
        description: 'Stripe payments via embedded API key'
    });
    tools.push({
        integration: 'email',
        actions: ['send'],
        provider: 'embedded',
        description: 'Email sending via Resend API'
    });
    res.json({
        success: true,
        data: {
            totalIntegrations: tools.length,
            totalActions: tools.reduce((acc, t) => acc + t.actions.length, 0),
            tools
        }
    });
});
/**
 * POST /api/integrations/test
 * Test an integration connection
 */
router.post('/test', extractClerkUserId, async (req, res) => {
    const { integration, action } = req.body;
    if (!integration) {
        return res.status(400).json({
            success: false,
            error: 'integration is required'
        });
    }
    try {
        // Check if we have a Rube tool slug for this integration
        const toolSlug = getRubeToolSlug(integration, action || 'list');
        const hasRubeTool = !!toolSlug;
        // Check for embedded API support
        const embeddedIntegrations = ['stripe', 'hubspot', 'resend', 'email'];
        const hasEmbedded = embeddedIntegrations.includes(integration.toLowerCase());
        // Check if browser automation would work
        const canUseBrowser = integration === 'browser' || integration === 'playwright';
        res.json({
            success: true,
            data: {
                integration,
                available: hasRubeTool || hasEmbedded || canUseBrowser,
                providers: {
                    rube: hasRubeTool ? { toolSlug, status: 'available' } : null,
                    playwright: canUseBrowser ? { status: 'available' } : null,
                    embedded: hasEmbedded ? { status: 'available' } : null
                },
                message: hasRubeTool
                    ? `Rube tool ${toolSlug} is available`
                    : hasEmbedded
                        ? 'Embedded API integration available'
                        : canUseBrowser
                            ? 'Browser automation available'
                            : 'No integration found - may need to add custom handler'
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /api/integrations/workflow/:workflowId/status
 * Get current workflow execution status
 */
router.get('/workflow/:workflowId/status', (_req, res) => {
    const { workflowId } = _req.params;
    // Get from orchestrator's active executions
    const status = workflowOrchestrator.getExecutionStatus(workflowId);
    if (!status) {
        return res.status(404).json({
            success: false,
            error: 'Workflow execution not found'
        });
    }
    res.json({
        success: true,
        data: status
    });
});
export default router;
//# sourceMappingURL=integrations.js.map
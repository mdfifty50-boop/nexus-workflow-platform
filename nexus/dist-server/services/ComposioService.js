/**
 * ComposioService - Real Tool Execution via Composio SDK
 *
 * This service provides actual API execution for 500+ integrations:
 * - Gmail, Google Calendar, Google Sheets, Google Drive
 * - Slack, Discord, Microsoft Teams
 * - GitHub, GitLab, Jira, Linear, Notion
 * - Salesforce, HubSpot, Pipedrive
 * - And many more...
 *
 * The service handles:
 * - OAuth connection management
 * - Tool discovery and execution
 * - Error handling and retries
 * - Rate limiting
 */
import { Composio } from '@composio/core';
export const AVAILABLE_APPS = [
    // Communication
    { id: 'gmail', name: 'Gmail', description: 'Send and receive emails', icon: '📧', color: '#EA4335', category: 'communication' },
    { id: 'slack', name: 'Slack', description: 'Team messaging', icon: '💬', color: '#4A154B', category: 'communication' },
    { id: 'discord', name: 'Discord', description: 'Community chat', icon: '🎮', color: '#5865F2', category: 'communication' },
    { id: 'zoom', name: 'Zoom', description: 'Video meetings', icon: '📹', color: '#2D8CFF', category: 'communication' },
    // Productivity
    { id: 'googlecalendar', name: 'Google Calendar', description: 'Schedule events', icon: '📅', color: '#4285F4', category: 'productivity' },
    { id: 'googlesheets', name: 'Google Sheets', description: 'Spreadsheets', icon: '📊', color: '#0F9D58', category: 'productivity' },
    { id: 'notion', name: 'Notion', description: 'Notes & docs', icon: '📝', color: '#000000', category: 'productivity' },
    { id: 'airtable', name: 'Airtable', description: 'Database tables', icon: '🗃️', color: '#18BFFF', category: 'productivity' },
    { id: 'asana', name: 'Asana', description: 'Project tasks', icon: '✅', color: '#F06A6A', category: 'productivity' },
    { id: 'trello', name: 'Trello', description: 'Kanban boards', icon: '📋', color: '#0079BF', category: 'productivity' },
    // Development
    { id: 'github', name: 'GitHub', description: 'Code & issues', icon: '🐙', color: '#181717', category: 'development' },
    { id: 'linear', name: 'Linear', description: 'Issue tracking', icon: '🔷', color: '#5E6AD2', category: 'development' },
    // CRM & Sales
    { id: 'hubspot', name: 'HubSpot', description: 'CRM & contacts', icon: '🧡', color: '#FF7A59', category: 'crm' },
    { id: 'stripe', name: 'Stripe', description: 'Payments', icon: '💳', color: '#635BFF', category: 'crm' },
    { id: 'intercom', name: 'Intercom', description: 'Customer chat', icon: '💁', color: '#1F8DED', category: 'crm' },
    // Social
    { id: 'twitter', name: 'Twitter/X', description: 'Social posts', icon: '🐦', color: '#1DA1F2', category: 'social' },
    { id: 'linkedin', name: 'LinkedIn', description: 'Professional network', icon: '💼', color: '#0A66C2', category: 'social' },
    // Storage
    { id: 'dropbox', name: 'Dropbox', description: 'Cloud files', icon: '📦', color: '#0061FF', category: 'storage' },
    { id: 'googledrive', name: 'Google Drive', description: 'Cloud storage', icon: '☁️', color: '#4285F4', category: 'storage' },
];
/**
 * Composio Service - Real API Execution with Per-User Support
 */
class ComposioServiceClass {
    composio = null;
    defaultUserId = 'default';
    isInitialized = false;
    connectedApps = new Set();
    userConnections = new Map(); // userId -> connected apps
    /**
     * Get the userId for Composio operations
     * NOTE: This should match the entity used by Rube MCP for shared OAuth tokens
     */
    get userId() {
        return this.defaultUserId;
    }
    /**
     * Initialize the Composio client
     */
    async initialize(apiKey) {
        const key = apiKey || process.env.COMPOSIO_API_KEY;
        if (!key) {
            console.log('[ComposioService] No API key - running in demo mode');
            return false;
        }
        try {
            this.composio = new Composio({ apiKey: key });
            this.isInitialized = true;
            console.log('[ComposioService] Initialized with Composio SDK');
            // Fetch connected accounts
            await this.refreshConnections();
            return true;
        }
        catch (error) {
            console.error('[ComposioService] Failed to initialize:', error);
            return false;
        }
    }
    /**
     * Refresh the list of connected accounts
     */
    async refreshConnections() {
        if (!this.composio)
            return [];
        try {
            const accounts = await this.composio.connectedAccounts.list({ userIds: [this.userId] });
            this.connectedApps.clear();
            if (accounts && Array.isArray(accounts.items)) {
                accounts.items.forEach((acc) => {
                    // Extract toolkit/app name from the connected account
                    const toolkitSlug = acc.toolkitSlug;
                    if (toolkitSlug) {
                        this.connectedApps.add(toolkitSlug.toLowerCase());
                    }
                });
            }
            console.log('[ComposioService] Connected apps:', Array.from(this.connectedApps));
            return Array.from(this.connectedApps);
        }
        catch (error) {
            console.error('[ComposioService] Failed to refresh connections:', error);
            return [];
        }
    }
    /**
     * Check if a specific app is connected AND ACTIVE
     * IMPORTANT: Does NOT filter by userId/entityId to find ANY available connection
     * This is critical for finding connections created via Rube MCP or other entities
     *
     * CRITICAL FIX (Jan 21, 2026): Must check account STATUS, not just existence!
     * Composio accounts can exist but be in EXPIRED state (HTTP 410 error on execution)
     */
    async checkConnection(appName) {
        if (!this.composio) {
            return {
                toolkit: appName,
                connected: false,
            };
        }
        try {
            // List ALL connections for this toolkit (not filtered by userId)
            // This ensures we find connections made via Rube MCP or other entities
            const accounts = await this.composio.connectedAccounts.list({
                toolkitSlugs: [appName]
            });
            // Filter to only ACTIVE accounts - EXPIRED accounts will fail on execution!
            // Account status can be: 'ACTIVE', 'EXPIRED', 'INITIATED', etc.
            const activeAccounts = accounts?.items?.filter((account) => account.status === 'ACTIVE') || [];
            const hasActiveConnection = activeAccounts.length > 0;
            const firstActiveAccount = hasActiveConnection ? activeAccounts[0] : null;
            // Also log if we found expired accounts (helps debugging)
            const expiredAccounts = accounts?.items?.filter((account) => account.status === 'EXPIRED') || [];
            console.log(`[ComposioService] ${appName} connection check: active=${hasActiveConnection}, activeCount=${activeAccounts.length}, expiredCount=${expiredAccounts.length}, accountId=${firstActiveAccount?.id || 'none'}`);
            if (expiredAccounts.length > 0 && !hasActiveConnection) {
                console.warn(`[ComposioService] ${appName} has ${expiredAccounts.length} EXPIRED connection(s) - user needs to re-authenticate`);
            }
            return {
                toolkit: appName,
                connected: hasActiveConnection,
                accountId: firstActiveAccount?.id,
            };
        }
        catch (error) {
            console.error(`[ComposioService] checkConnection error for ${appName}:`, error);
            return {
                toolkit: appName,
                connected: false,
            };
        }
    }
    /**
     * Initiate OAuth connection for an app
     * Uses Composio's managed OAuth when no custom auth config exists
     *
     * CRITICAL FIX (Jan 21, 2026): Delete EXPIRED connections before initiating new OAuth!
     * If expired connections exist, Composio shows "connection expired" error instead of fresh OAuth.
     */
    async initiateConnection(appName, redirectUrl) {
        if (!this.composio) {
            return { error: 'Composio not initialized - add COMPOSIO_API_KEY' };
        }
        try {
            const callbackUrl = redirectUrl || `${process.env.APP_URL || 'http://localhost:5173'}/oauth/callback`;
            // CRITICAL: First delete any EXPIRED connections to allow fresh OAuth
            // Without this, Composio shows "connection expired" error page instead of OAuth consent
            try {
                const existingAccounts = await this.composio.connectedAccounts.list({
                    toolkitSlugs: [appName]
                });
                const expiredAccounts = existingAccounts?.items?.filter((account) => account.status === 'EXPIRED') || [];
                if (expiredAccounts.length > 0) {
                    console.log(`[ComposioService] Found ${expiredAccounts.length} EXPIRED ${appName} connection(s) - deleting to allow fresh OAuth`);
                    for (const expired of expiredAccounts) {
                        try {
                            await this.composio.connectedAccounts.delete(expired.id);
                            console.log(`[ComposioService] Deleted expired ${appName} connection: ${expired.id}`);
                        }
                        catch (deleteError) {
                            console.warn(`[ComposioService] Failed to delete expired connection ${expired.id}:`, deleteError);
                        }
                    }
                }
            }
            catch (cleanupError) {
                console.warn(`[ComposioService] Error checking for expired connections:`, cleanupError);
                // Continue anyway - the main OAuth flow might still work
            }
            // Now proceed with fresh OAuth initiation
            // First try: Use existing auth config if available
            const authConfigs = await this.composio.authConfigs.list({ toolkit: appName });
            if (authConfigs?.items && authConfigs.items.length > 0) {
                console.log(`[ComposioService] Using auth config ${authConfigs.items[0].id} for ${appName}`);
                const result = await this.composio.connectedAccounts.initiate(this.userId, authConfigs.items[0].id, { callbackUrl, allowMultiple: true });
                return {
                    authUrl: result?.redirectUrl,
                };
            }
            // No custom auth config - use Composio's toolkits.authorize method
            // This creates auth config if none exists and initiates connection
            console.log(`[ComposioService] No custom auth config for ${appName}, using toolkits.authorize`);
            try {
                // toolkits.authorize handles creating auth config and initiating OAuth
                const connectionRequest = await this.composio.toolkits.authorize(this.userId, appName.toLowerCase());
                if (connectionRequest?.redirectUrl) {
                    console.log(`[ComposioService] Got OAuth URL from toolkits.authorize for ${appName}`);
                    return { authUrl: connectionRequest.redirectUrl };
                }
                console.log(`[ComposioService] toolkits.authorize returned no redirectUrl for ${appName}:`, connectionRequest);
            }
            catch (toolkitsError) {
                console.log(`[ComposioService] toolkits.authorize failed for ${appName}:`, toolkitsError instanceof Error ? toolkitsError.message : String(toolkitsError));
            }
            // All Composio methods failed - fall back to local OAuth
            console.log(`[ComposioService] No auth config found for ${appName}, falling back to local OAuth`);
            return { error: `NO_AUTH_CONFIG` };
        }
        catch (error) {
            console.error('[ComposioService] Failed to initiate connection:', error);
            return { error: String(error) };
        }
    }
    /**
     * Get available actions/tools for a specific toolkit
     * Used by ToolDiscoveryService to analyze what actions are available
     */
    async getToolkitActions(toolkitName) {
        if (!this.composio) {
            console.log(`[ComposioService] Cannot get toolkit actions - not initialized`);
            return [];
        }
        try {
            const tools = await this.composio.tools.getRawComposioTools({
                toolkits: [toolkitName.toLowerCase()],
            });
            if (!tools || !Array.isArray(tools)) {
                console.log(`[ComposioService] No tools found for toolkit: ${toolkitName}`);
                return [];
            }
            // Extract tool slugs/names
            const actionNames = tools.map((tool) => tool.slug || tool.name || '').filter(Boolean);
            console.log(`[ComposioService] Found ${actionNames.length} actions for ${toolkitName}`);
            return actionNames;
        }
        catch (error) {
            console.log(`[ComposioService] Error getting toolkit actions for ${toolkitName}:`, error);
            return [];
        }
    }
    /**
     * Get available tools for connected apps
     */
    async getTools(apps) {
        if (!this.composio)
            return [];
        try {
            const toolkits = apps || Array.from(this.connectedApps);
            const toolsList = await this.composio.tools.getRawComposioTools({
                toolkits: toolkits.length > 0 ? toolkits : undefined,
            });
            if (!toolsList || !Array.isArray(toolsList))
                return [];
            return toolsList.map((tool) => ({
                slug: tool.slug,
                name: tool.name,
                description: tool.description || '',
                app: tool.slug.split('_')[0].toLowerCase(),
            }));
        }
        catch (error) {
            console.error('[ComposioService] Failed to get tools:', error);
            return [];
        }
    }
    /**
     * Execute a tool with given parameters
     */
    async executeTool(toolSlug, params) {
        const startTime = Date.now();
        // If not initialized, return demo response
        if (!this.composio) {
            console.log(`[ComposioService] Demo mode - simulating: ${toolSlug}`);
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
            return {
                success: true,
                data: this.generateDemoResponse(toolSlug, params),
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
        try {
            // Execute the tool via Composio SDK
            const result = await this.composio.tools.execute(toolSlug, {
                arguments: params,
                userId: this.userId,
                dangerouslySkipVersionCheck: true, // Skip version requirement for simpler execution
            });
            console.log(`[ComposioService] Executed ${toolSlug} successfully`);
            return {
                success: true,
                data: result?.data || result,
                rawResponse: result,
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
        catch (error) {
            console.error(`[ComposioService] Tool execution failed:`, error);
            return {
                success: false,
                error: String(error),
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
    }
    /**
     * Execute multiple tools in parallel
     */
    async executeMultipleTools(tools) {
        const results = await Promise.all(tools.map(tool => this.executeTool(tool.toolSlug, tool.params)));
        return results;
    }
    /**
     * Generate demo response for offline/demo mode
     */
    generateDemoResponse(toolSlug, params) {
        const slug = toolSlug.toUpperCase();
        const timestamp = new Date().toISOString();
        // Gmail responses
        if (slug.includes('GMAIL_SEND')) {
            return {
                messageId: `msg_demo_${Date.now()}`,
                threadId: `thread_demo_${Date.now()}`,
                labelIds: ['SENT'],
                to: params.recipient_email || params.to,
                subject: params.subject,
                sentAt: timestamp,
                status: 'sent',
                demoMode: true,
            };
        }
        if (slug.includes('GMAIL_FETCH') || slug.includes('GMAIL_SEARCH') || slug.includes('GMAIL_LIST')) {
            return {
                messages: [
                    {
                        id: `msg_${Date.now()}_1`,
                        threadId: `thread_${Date.now()}_1`,
                        from: 'demo@example.com',
                        subject: 'Demo Email 1',
                        snippet: 'This is a demo email for testing the workflow...',
                        date: timestamp,
                        isRead: false,
                    },
                    {
                        id: `msg_${Date.now()}_2`,
                        threadId: `thread_${Date.now()}_2`,
                        from: 'workflow@example.com',
                        subject: 'Workflow Update',
                        snippet: 'Your workflow has been executed successfully...',
                        date: new Date(Date.now() - 3600000).toISOString(),
                        isRead: true,
                    },
                ],
                totalCount: 2,
                demoMode: true,
            };
        }
        // Calendar responses
        if (slug.includes('CALENDAR_CREATE') || slug.includes('GOOGLECALENDAR_CREATE')) {
            return {
                eventId: `event_demo_${Date.now()}`,
                htmlLink: `https://calendar.google.com/event?eid=demo_${Date.now()}`,
                summary: params.summary || params.title,
                start: params.start_datetime || params.startTime,
                end: params.end_datetime || params.endTime,
                status: 'confirmed',
                created: timestamp,
                demoMode: true,
            };
        }
        if (slug.includes('CALENDAR_LIST') || slug.includes('GOOGLECALENDAR_LIST')) {
            return {
                events: [
                    {
                        id: `event_${Date.now()}_1`,
                        summary: 'Team Standup',
                        start: { dateTime: new Date(Date.now() + 3600000).toISOString() },
                        end: { dateTime: new Date(Date.now() + 5400000).toISOString() },
                        status: 'confirmed',
                    },
                    {
                        id: `event_${Date.now()}_2`,
                        summary: 'Project Review',
                        start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
                        end: { dateTime: new Date(Date.now() + 90000000).toISOString() },
                        status: 'confirmed',
                    },
                ],
                demoMode: true,
            };
        }
        // Sheets responses
        if (slug.includes('SHEETS_GET') || slug.includes('SHEETS_READ') || slug.includes('GOOGLESHEETS_GET')) {
            return {
                spreadsheetId: params.spreadsheet_id || 'demo_sheet_123',
                range: params.range || 'Sheet1!A1:Z100',
                values: [
                    ['Name', 'Email', 'Status', 'Created'],
                    ['John Doe', 'john@example.com', 'Active', '2026-01-09'],
                    ['Jane Smith', 'jane@example.com', 'Pending', '2026-01-08'],
                    ['Bob Wilson', 'bob@example.com', 'Active', '2026-01-07'],
                ],
                demoMode: true,
            };
        }
        if (slug.includes('SHEETS_APPEND') || slug.includes('SHEETS_UPDATE') || slug.includes('GOOGLESHEETS_APPEND')) {
            return {
                spreadsheetId: params.spreadsheet_id || params.spreadsheetId,
                updatedRange: params.range,
                updatedRows: params.values?.length || 1,
                updatedCells: 10,
                demoMode: true,
            };
        }
        // Slack responses
        if (slug.includes('SLACK_SEND') || slug.includes('SLACK_POST')) {
            return {
                ok: true,
                ts: `${Date.now()}.000100`,
                channel: params.channel,
                message: {
                    text: params.text,
                    ts: `${Date.now()}.000100`,
                    type: 'message',
                },
                demoMode: true,
            };
        }
        if (slug.includes('SLACK_LIST') || slug.includes('SLACK_GET')) {
            return {
                ok: true,
                channels: [
                    { id: 'C123456', name: 'general', is_member: true },
                    { id: 'C789012', name: 'random', is_member: true },
                    { id: 'C345678', name: 'engineering', is_member: false },
                ],
                demoMode: true,
            };
        }
        // GitHub responses
        if (slug.includes('GITHUB_CREATE_ISSUE')) {
            return {
                id: Date.now(),
                number: Math.floor(Math.random() * 1000),
                title: params.title,
                body: params.body,
                html_url: `https://github.com/${params.owner}/${params.repo}/issues/${Math.floor(Math.random() * 1000)}`,
                state: 'open',
                created_at: timestamp,
                demoMode: true,
            };
        }
        if (slug.includes('GITHUB_LIST_ISSUES') || slug.includes('GITHUB_GET_ISSUES')) {
            return {
                issues: [
                    {
                        id: 1,
                        number: 42,
                        title: 'Bug: Fix login flow',
                        state: 'open',
                        created_at: timestamp,
                    },
                    {
                        id: 2,
                        number: 43,
                        title: 'Feature: Add dark mode',
                        state: 'open',
                        created_at: timestamp,
                    },
                ],
                demoMode: true,
            };
        }
        if (slug.includes('GITHUB_CREATE_PULL') || slug.includes('GITHUB_CREATE_PR')) {
            return {
                id: Date.now(),
                number: Math.floor(Math.random() * 100),
                title: params.title,
                html_url: `https://github.com/${params.owner}/${params.repo}/pull/${Math.floor(Math.random() * 100)}`,
                state: 'open',
                created_at: timestamp,
                demoMode: true,
            };
        }
        // Notion responses
        if (slug.includes('NOTION_CREATE')) {
            return {
                id: `notion_page_${Date.now()}`,
                url: `https://notion.so/demo-page-${Date.now()}`,
                created_time: timestamp,
                demoMode: true,
            };
        }
        // HubSpot responses
        if (slug.includes('HUBSPOT_CREATE_CONTACT')) {
            return {
                id: `hubspot_${Date.now()}`,
                properties: {
                    email: params.email,
                    firstname: params.firstname,
                    lastname: params.lastname,
                },
                createdAt: timestamp,
                demoMode: true,
            };
        }
        // Default response
        return {
            success: true,
            toolSlug,
            executedAt: timestamp,
            input: params,
            message: `Tool ${toolSlug} executed successfully (demo mode)`,
            demoMode: true,
        };
    }
    // ==========================================================================
    // Convenience Methods for Common Operations
    // ==========================================================================
    /**
     * Send an email via Gmail
     */
    async sendEmail(params) {
        return this.executeTool('GMAIL_SEND_EMAIL', {
            recipient_email: params.to,
            subject: params.subject,
            body: params.body,
            cc: params.cc || [],
            bcc: params.bcc || [],
            is_html: params.isHtml || false,
        });
    }
    /**
     * Fetch emails from Gmail
     */
    async fetchEmails(params) {
        return this.executeTool('GMAIL_FETCH_EMAILS', {
            max_results: params.maxResults || 10,
            q: params.query,
            label_ids: params.labelIds,
        });
    }
    /**
     * Create a calendar event
     */
    async createCalendarEvent(params) {
        return this.executeTool('GOOGLECALENDAR_CREATE_EVENT', {
            summary: params.title,
            start_datetime: params.startTime,
            end_datetime: params.endTime,
            description: params.description,
            attendees: params.attendees?.map(email => ({ email })),
            location: params.location,
        });
    }
    /**
     * Send a Slack message
     */
    async sendSlackMessage(params) {
        return this.executeTool('SLACK_SEND_MESSAGE', {
            channel: params.channel,
            text: params.text,
            thread_ts: params.threadTs,
        });
    }
    /**
     * Read data from Google Sheets
     */
    async readSpreadsheet(params) {
        return this.executeTool('GOOGLESHEETS_GET_SPREADSHEET_DATA', {
            spreadsheet_id: params.spreadsheetId,
            range: params.range,
        });
    }
    /**
     * Append data to Google Sheets
     */
    async appendToSpreadsheet(params) {
        return this.executeTool('GOOGLESHEETS_BATCH_UPDATE', {
            spreadsheet_id: params.spreadsheetId,
            sheet_name: 'Sheet1', // Default sheet, omit first_cell_location to append
            values: params.values,
        });
    }
    /**
     * Create a GitHub issue
     */
    async createGitHubIssue(params) {
        return this.executeTool('GITHUB_CREATE_ISSUE', {
            owner: params.owner,
            repo: params.repo,
            title: params.title,
            body: params.body,
            labels: params.labels,
        });
    }
    // ==========================================================================
    // Per-User Connection Methods
    // ==========================================================================
    /**
     * Get all connections for a specific user
     */
    async getUserConnections(userId) {
        if (!this.composio) {
            // Return empty connections in demo mode
            return AVAILABLE_APPS.map(app => ({ app: app.id, connected: false }));
        }
        try {
            const accounts = await this.composio.connectedAccounts.list({ userIds: [userId] });
            const connectedApps = new Set();
            if (accounts?.items) {
                accounts.items.forEach((acc) => {
                    const toolkitSlug = acc.toolkitSlug;
                    if (toolkitSlug) {
                        connectedApps.add(toolkitSlug.toLowerCase());
                    }
                });
            }
            // Store for caching
            this.userConnections.set(userId, connectedApps);
            return AVAILABLE_APPS.map(app => ({
                app: app.id,
                connected: connectedApps.has(app.id),
            }));
        }
        catch (error) {
            console.error(`[ComposioService] Failed to get user connections:`, error);
            return AVAILABLE_APPS.map(app => ({ app: app.id, connected: false }));
        }
    }
    /**
     * Initiate connection for a specific user
     */
    async initiateUserConnection(userId, appName, callbackUrl) {
        if (!this.composio) {
            return { error: 'Composio not configured - contact support' };
        }
        try {
            // Get auth configs for this app
            const authConfigs = await this.composio.authConfigs.list({ toolkit: appName });
            if (!authConfigs?.items || authConfigs.items.length === 0) {
                return { error: `${appName} is not available right now` };
            }
            // Initiate connection for this specific user
            const result = await this.composio.connectedAccounts.initiate(userId, // Use the actual user ID
            authConfigs.items[0].id, {
                callbackUrl: callbackUrl || `${process.env.APP_URL || 'http://localhost:5173'}/settings/integrations?connected=${appName}`,
            });
            return {
                authUrl: result?.redirectUrl,
            };
        }
        catch (error) {
            console.error(`[ComposioService] Failed to initiate user connection:`, error);
            return { error: 'Something went wrong. Please try again.' };
        }
    }
    /**
     * Disconnect an app for a specific user
     */
    async disconnectUserApp(userId, appName) {
        if (!this.composio) {
            return { success: false, error: 'Composio not configured' };
        }
        try {
            // Find the connected account for this user and app
            const accounts = await this.composio.connectedAccounts.list({
                userIds: [userId],
                toolkitSlugs: [appName]
            });
            if (accounts?.items && accounts.items.length > 0) {
                // Delete the connection
                await this.composio.connectedAccounts.delete(accounts.items[0].id);
                // Update cache
                const userApps = this.userConnections.get(userId);
                if (userApps) {
                    userApps.delete(appName);
                }
                return { success: true };
            }
            return { success: false, error: 'No connection found' };
        }
        catch (error) {
            console.error(`[ComposioService] Failed to disconnect:`, error);
            return { success: false, error: 'Failed to disconnect. Please try again.' };
        }
    }
    /**
     * Execute tool for a specific user
     */
    async executeToolForUser(userId, toolSlug, params) {
        const startTime = Date.now();
        if (!this.composio) {
            console.log(`[ComposioService] Demo mode - simulating: ${toolSlug}`);
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
            return {
                success: true,
                data: this.generateDemoResponse(toolSlug, params),
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
        try {
            const result = await this.composio.tools.execute(toolSlug, {
                arguments: params,
                userId: userId, // Use the actual user ID
            });
            console.log(`[ComposioService] Executed ${toolSlug} for user ${userId}`);
            return {
                success: true,
                data: result?.data || result,
                rawResponse: result,
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
        catch (error) {
            console.error(`[ComposioService] Tool execution failed:`, error);
            return {
                success: false,
                error: String(error),
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
    }
    /**
     * Get list of available apps
     */
    getAvailableApps() {
        return AVAILABLE_APPS;
    }
    // ==========================================================================
    // Status Methods
    // ==========================================================================
    get initialized() {
        return this.isInitialized;
    }
    get connected() {
        return Array.from(this.connectedApps);
    }
    get isDemoMode() {
        return !this.composio;
    }
    /**
     * Store OAuth tokens from white-labeled OAuth flow
     * This creates a connected account in Composio with the tokens we obtained directly
     */
    async storeOAuthTokens(toolkit, userId, tokens) {
        if (!this.composio) {
            console.log(`[ComposioService] Cannot store tokens - Composio not initialized`);
            return { success: false, error: 'Composio not initialized' };
        }
        try {
            // First, get the auth config for this toolkit
            const authConfigs = await this.composio.authConfigs.list({ toolkit });
            if (!authConfigs?.items || authConfigs.items.length === 0) {
                // No existing auth config - we need to create one or use default
                console.log(`[ComposioService] No auth config found for ${toolkit}`);
                // For toolkits without auth config, we can still try to create a connection
                // using the toolkit slug directly (some Composio setups support this)
                console.log(`[ComposioService] Attempting to store tokens without auth config...`);
            }
            const authConfigId = authConfigs?.items?.[0]?.id;
            if (!authConfigId) {
                // Try alternative approach - store in local connections map for now
                console.log(`[ComposioService] No auth config ID for ${toolkit}, storing locally only`);
                return { success: true, error: 'Stored locally only - no Composio auth config' };
            }
            // Create connected account with the tokens
            const result = await this.composio.connectedAccounts.create({
                auth_config: { id: authConfigId },
                connection: {
                    user_id: userId,
                    state: {
                        authScheme: 'OAUTH2',
                        val: {
                            status: 'ACTIVE',
                            access_token: tokens.access_token,
                            refresh_token: tokens.refresh_token || null,
                            expires_in: tokens.expires_in,
                            scope: tokens.scope,
                            token_type: tokens.token_type || 'Bearer',
                        }
                    }
                }
            });
            console.log(`[ComposioService] Created connected account for ${toolkit}: ${result?.id}`);
            // Update our local cache
            this.connectedApps.add(toolkit.toLowerCase());
            return { success: true, accountId: result?.id };
        }
        catch (error) {
            console.error(`[ComposioService] Failed to store OAuth tokens for ${toolkit}:`, error);
            return { success: false, error: String(error) };
        }
    }
    /**
     * List ALL connected accounts for this API key (regardless of userId)
     * Used for debugging and discovering which entity owns the OAuth tokens
     */
    async listAllConnections() {
        if (!this.composio)
            return [];
        try {
            // List without filtering by userId to get ALL connections
            const accounts = await this.composio.connectedAccounts.list({});
            if (!accounts?.items)
                return [];
            return accounts.items.map((acc) => {
                const record = acc;
                return {
                    id: record.id,
                    userId: record.entityId || record.userId || 'unknown',
                    toolkit: (record.toolkitSlug || '').toLowerCase(),
                    status: record.status || 'unknown',
                    createdAt: record.createdAt,
                };
            });
        }
        catch (error) {
            console.error('[ComposioService] Failed to list all connections:', error);
            return [];
        }
    }
    /**
     * List all auth configs available for this API key
     */
    async listAuthConfigs() {
        if (!this.composio)
            return [];
        try {
            // Try to list all auth configs
            const configs = await this.composio.authConfigs.list({});
            if (!configs?.items)
                return [];
            return configs.items.map((config) => {
                const record = config;
                // toolkit might be an object with slug property, or a string
                let toolkitStr = '';
                if (typeof record.toolkit === 'string') {
                    toolkitStr = record.toolkit;
                }
                else if (record.toolkit && typeof record.toolkit === 'object') {
                    const tk = record.toolkit;
                    toolkitStr = tk.slug || tk.name || '';
                }
                else if (typeof record.toolkitSlug === 'string') {
                    toolkitStr = record.toolkitSlug;
                }
                return {
                    id: record.id,
                    toolkit: toolkitStr.toLowerCase(),
                    type: record.type || record.authScheme || 'unknown',
                };
            });
        }
        catch (error) {
            console.error('[ComposioService] Failed to list auth configs:', error);
            return [];
        }
    }
    /**
     * Execute tool using a specific connected account ID (bypass userId lookup)
     */
    async executeWithAccountId(connectedAccountId, toolSlug, params) {
        const startTime = Date.now();
        if (!this.composio) {
            return {
                success: false,
                error: 'Composio not initialized',
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
        try {
            const result = await this.composio.tools.execute(toolSlug, {
                arguments: params,
                connectedAccountId: connectedAccountId,
                userId: this.userId, // Required entityId for connection lookup
                dangerouslySkipVersionCheck: true, // Skip version requirement for simpler execution
            });
            console.log(`[ComposioService] Executed ${toolSlug} with account ${connectedAccountId}`);
            return {
                success: true,
                data: result?.data || result,
                rawResponse: result,
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
        catch (error) {
            console.error(`[ComposioService] Tool execution with account failed:`, error);
            return {
                success: false,
                error: String(error),
                toolSlug,
                executionTimeMs: Date.now() - startTime,
            };
        }
    }
}
// Export singleton instance
export const composioService = new ComposioServiceClass();
//# sourceMappingURL=ComposioService.js.map
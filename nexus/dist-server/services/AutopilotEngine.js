/**
 * AutopilotEngine - Playwright-powered workflow configuration assistant
 *
 * Manages browser sessions for automated service configuration:
 * - Maintains a pool of browser sessions (max 3 concurrent)
 * - Takes screenshots every 2 seconds when active
 * - Detects login pages and pauses for credential entry
 * - Supports pause/resume/cancel lifecycle
 * - Cleans up on timeout (10 min) or cancel
 * - Emits events for SSE streaming to the frontend
 */
import { EventEmitter } from 'events';
import { chromium } from 'playwright';
import { AutopilotPageDetector } from './AutopilotPageDetector.js';
// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_CONCURRENT_SESSIONS = 3;
const SCREENSHOT_INTERVAL_MS = 2000;
const SESSION_TIMEOUT_MS = 600000; // 10 minutes
// Service dashboard/setup URLs for navigation
const SERVICE_URLS = {
    gmail: {
        dashboard: 'https://mail.google.com',
        setup: 'https://console.cloud.google.com/apis/credentials'
    },
    slack: {
        dashboard: 'https://app.slack.com',
        setup: 'https://api.slack.com/apps'
    },
    github: {
        dashboard: 'https://github.com/settings/applications',
        setup: 'https://github.com/settings/developers'
    },
    discord: {
        dashboard: 'https://discord.com/developers/applications',
        setup: 'https://discord.com/developers/applications'
    },
    notion: {
        dashboard: 'https://www.notion.so',
        setup: 'https://www.notion.so/my-integrations'
    },
    stripe: {
        dashboard: 'https://dashboard.stripe.com',
        setup: 'https://dashboard.stripe.com/apikeys'
    },
    hubspot: {
        dashboard: 'https://app.hubspot.com',
        setup: 'https://app.hubspot.com/settings'
    },
    trello: {
        dashboard: 'https://trello.com',
        setup: 'https://trello.com/power-ups/admin'
    },
    googlesheets: {
        dashboard: 'https://docs.google.com/spreadsheets',
        setup: 'https://console.cloud.google.com/apis/credentials'
    },
    googledrive: {
        dashboard: 'https://drive.google.com',
        setup: 'https://console.cloud.google.com/apis/credentials'
    },
    dropbox: {
        dashboard: 'https://www.dropbox.com/home',
        setup: 'https://www.dropbox.com/developers/apps'
    },
    asana: {
        dashboard: 'https://app.asana.com',
        setup: 'https://app.asana.com/-/developer_console'
    },
    linear: {
        dashboard: 'https://linear.app',
        setup: 'https://linear.app/settings/api'
    },
    zoom: {
        dashboard: 'https://zoom.us/profile',
        setup: 'https://marketplace.zoom.us/develop/create'
    }
};
// ─── Engine ──────────────────────────────────────────────────────────────────
export class AutopilotEngine extends EventEmitter {
    sessions = new Map();
    browserSessions = new Map();
    pageDetector = new AutopilotPageDetector();
    constructor() {
        super();
        // Increase max listeners since each SSE connection registers listeners
        this.setMaxListeners(50);
        // Run periodic cleanup every 60 seconds
        setInterval(() => this.cleanupExpiredSessions(), 60000);
    }
    // ─── Session Lifecycle ───────────────────────────────────────────────────
    /**
     * Create a new autopilot session from a workflow spec
     */
    createSession(workflowSpec, userId) {
        // Enforce concurrent session limit
        const activeSessions = Array.from(this.sessions.values()).filter(s => s.state !== 'complete' && s.state !== 'error' && s.state !== 'cancelled');
        if (activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
            throw new Error(`Maximum concurrent sessions (${MAX_CONCURRENT_SESSIONS}) reached. Cancel an existing session first.`);
        }
        const sessionId = `autopilot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const steps = this.planSteps(workflowSpec);
        const session = {
            id: sessionId,
            userId,
            state: 'planning',
            steps,
            currentStep: 0,
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
        this.sessions.set(sessionId, session);
        this.emitStatus(sessionId, 'planning', `Planned ${steps.length} configuration steps`);
        console.log(`[AutopilotEngine] Session ${sessionId} created with ${steps.length} steps`);
        return session;
    }
    /**
     * Start executing a session - launches browser and begins step execution
     */
    async startSession(sessionId) {
        const session = this.getSessionOrThrow(sessionId);
        if (session.state !== 'planning' && session.state !== 'idle') {
            throw new Error(`Cannot start session in state: ${session.state}`);
        }
        try {
            // Launch browser
            const browserSession = await this.launchBrowser(sessionId);
            this.browserSessions.set(sessionId, browserSession);
            // Update state
            session.state = 'executing';
            session.lastActivity = Date.now();
            this.emitStatus(sessionId, 'executing', 'Browser launched, starting configuration...');
            // Start session timeout
            browserSession.timeoutTimer = setTimeout(() => {
                console.log(`[AutopilotEngine] Session ${sessionId} timed out after ${SESSION_TIMEOUT_MS / 1000}s`);
                this.cancelSession(sessionId).catch(err => console.error(`[AutopilotEngine] Error cancelling timed-out session:`, err));
            }, SESSION_TIMEOUT_MS);
            // Begin executing steps
            await this.executeSteps(sessionId);
        }
        catch (error) {
            session.state = 'error';
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.emitError(sessionId, `Failed to start session: ${errorMsg}`);
            await this.cleanupBrowserSession(sessionId);
        }
    }
    /**
     * Pause a session - stops screenshot capture but keeps browser open
     */
    async pauseSession(sessionId) {
        const session = this.getSessionOrThrow(sessionId);
        if (session.state !== 'executing' && session.state !== 'credential_wait') {
            throw new Error(`Cannot pause session in state: ${session.state}`);
        }
        session.state = 'paused';
        session.lastActivity = Date.now();
        // Stop screenshot capture while paused
        this.stopScreenshotCapture(sessionId);
        this.emitStatus(sessionId, 'paused', 'Session paused');
        console.log(`[AutopilotEngine] Session ${sessionId} paused`);
    }
    /**
     * Resume a session - restarts screenshot capture and continues execution
     */
    async resumeSession(sessionId) {
        const session = this.getSessionOrThrow(sessionId);
        if (session.state !== 'paused' && session.state !== 'credential_wait') {
            throw new Error(`Cannot resume session in state: ${session.state}`);
        }
        const browserSession = this.browserSessions.get(sessionId);
        if (!browserSession) {
            throw new Error('Browser session not found - it may have been cleaned up');
        }
        // Check if login succeeded (for credential_wait state)
        if (session.state === 'credential_wait') {
            const detection = await this.pageDetector.detect(browserSession.page);
            if (detection.isLoginPage || detection.is2FAPage) {
                // Still on login page - re-enter credential_wait
                this.emitStatus(sessionId, 'credential_wait', 'Still waiting for login to complete...');
                this.startScreenshotCapture(sessionId);
                return;
            }
            // Login succeeded
            const currentStep = session.steps[session.currentStep];
            if (currentStep) {
                currentStep.status = 'executing';
            }
        }
        session.state = 'executing';
        session.lastActivity = Date.now();
        // Restart screenshot capture
        this.startScreenshotCapture(sessionId);
        this.emitStatus(sessionId, 'executing', 'Session resumed');
        console.log(`[AutopilotEngine] Session ${sessionId} resumed`);
        // Continue executing remaining steps
        await this.executeSteps(sessionId);
    }
    /**
     * Cancel a session and clean up all resources
     */
    async cancelSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        session.state = 'cancelled';
        session.lastActivity = Date.now();
        // Mark any executing steps as skipped
        for (const step of session.steps) {
            if (step.status === 'pending' || step.status === 'executing' || step.status === 'credential_wait') {
                step.status = 'skipped';
            }
        }
        await this.cleanupBrowserSession(sessionId);
        this.emitStatus(sessionId, 'cancelled', 'Session cancelled by user');
        console.log(`[AutopilotEngine] Session ${sessionId} cancelled`);
    }
    /**
     * Get the current state of a session
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Get the latest screenshot for a session as base64 JPEG
     */
    getScreenshot(sessionId) {
        const browserSession = this.browserSessions.get(sessionId);
        return browserSession?.latestScreenshot ?? null;
    }
    // ─── Step Planning ───────────────────────────────────────────────────────
    /**
     * Convert a workflow spec into executable AutopilotStep objects.
     * Trigger steps get OAuth connection planning; action steps get configuration planning.
     */
    planSteps(workflowSpec) {
        const steps = [];
        for (const specStep of workflowSpec.steps) {
            const service = specStep.tool.toLowerCase();
            if (specStep.type === 'trigger') {
                // Trigger steps: plan OAuth connection setup
                steps.push({
                    id: `${specStep.id}_connect`,
                    service,
                    action: 'oauth_connect',
                    method: 'browser',
                    status: 'pending',
                    description: `Connect ${this.formatServiceName(service)} account (OAuth)`
                });
            }
            else {
                // Action steps: plan configuration
                steps.push({
                    id: `${specStep.id}_connect`,
                    service,
                    action: 'oauth_connect',
                    method: 'browser',
                    status: 'pending',
                    description: `Connect ${this.formatServiceName(service)} account (OAuth)`
                });
                steps.push({
                    id: `${specStep.id}_configure`,
                    service,
                    action: 'configure',
                    method: 'browser',
                    status: 'pending',
                    description: `Configure ${this.formatServiceName(service)}: ${specStep.name}`
                });
            }
        }
        // Deduplicate connection steps for the same service
        const seen = new Set();
        return steps.filter(step => {
            if (step.action === 'oauth_connect') {
                const key = `${step.service}_connect`;
                if (seen.has(key))
                    return false;
                seen.add(key);
            }
            return true;
        });
    }
    // ─── Step Execution ──────────────────────────────────────────────────────
    /**
     * Execute steps sequentially starting from session.currentStep
     */
    async executeSteps(sessionId) {
        const session = this.getSessionOrThrow(sessionId);
        const browserSession = this.browserSessions.get(sessionId);
        if (!browserSession) {
            session.state = 'error';
            this.emitError(sessionId, 'Browser session lost during execution');
            return;
        }
        while (session.currentStep < session.steps.length) {
            // Check if session was paused or cancelled during execution
            if (session.state === 'paused' || session.state === 'cancelled' || session.state === 'credential_wait') {
                return;
            }
            const step = session.steps[session.currentStep];
            step.status = 'executing';
            step.startedAt = Date.now();
            session.lastActivity = Date.now();
            this.emitProgress(sessionId, session.currentStep, step.description);
            try {
                await this.executeStep(sessionId, step, browserSession);
                // If step entered credential_wait, stop here - resume will continue
                // Note: executeStep mutates step.status directly, so we cast to check
                if (step.status === 'credential_wait') {
                    session.state = 'credential_wait';
                    return;
                }
                step.status = 'complete';
                step.completedAt = Date.now();
                step.result = { success: true, connectionEstablished: step.action === 'oauth_connect' };
                this.emitProgress(sessionId, session.currentStep, `Completed: ${step.description}`);
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                step.status = 'error';
                step.error = errorMsg;
                step.completedAt = Date.now();
                console.error(`[AutopilotEngine] Step ${step.id} failed:`, errorMsg);
                this.emitError(sessionId, `Step failed: ${step.description} - ${errorMsg}`);
                // Continue to next step on non-fatal errors
            }
            session.currentStep++;
        }
        // All steps complete
        session.state = 'complete';
        session.lastActivity = Date.now();
        this.emitComplete(sessionId);
        await this.cleanupBrowserSession(sessionId);
        console.log(`[AutopilotEngine] Session ${sessionId} completed all steps`);
    }
    /**
     * Execute a single step: navigate to the service and handle page state
     */
    async executeStep(sessionId, step, browserSession) {
        const { page } = browserSession;
        // Determine target URL based on step action
        const serviceUrls = SERVICE_URLS[step.service];
        let targetUrl;
        if (step.action === 'oauth_connect') {
            targetUrl = serviceUrls?.setup ?? serviceUrls?.dashboard ?? `https://${step.service}.com`;
        }
        else {
            targetUrl = serviceUrls?.dashboard ?? `https://${step.service}.com`;
        }
        // Navigate to the service
        try {
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        }
        catch (error) {
            // Navigation timeout is not necessarily fatal - page may still be usable
            const msg = error instanceof Error ? error.message : String(error);
            console.warn(`[AutopilotEngine] Navigation warning for ${step.service}: ${msg}`);
        }
        // Start screenshot capture for this step
        this.startScreenshotCapture(sessionId);
        // Wait for initial page load
        await this.sleep(1500);
        // Detect page state
        const detection = await this.pageDetector.detect(page);
        if (detection.isLoginPage || detection.is2FAPage) {
            // Login required - pause for credential entry
            step.status = 'credential_wait';
            this.stopScreenshotCapture(sessionId);
            // Take one final screenshot showing the login page
            await this.captureScreenshot(sessionId);
            this.emitStatus(sessionId, 'credential_wait', detection.is2FAPage
                ? `${this.formatServiceName(step.service)} requires 2FA verification`
                : `Please log in to ${this.formatServiceName(step.service)}`);
            return;
        }
        if (detection.isSuccessPage) {
            // Already logged in - step is complete
            this.stopScreenshotCapture(sessionId);
            return;
        }
        // Wait for page to stabilize and take a final screenshot
        await this.sleep(2000);
        // Re-check - the page may have redirected to login
        const recheck = await this.pageDetector.detect(page);
        if (recheck.isLoginPage || recheck.is2FAPage) {
            step.status = 'credential_wait';
            this.stopScreenshotCapture(sessionId);
            await this.captureScreenshot(sessionId);
            this.emitStatus(sessionId, 'credential_wait', `Please log in to ${this.formatServiceName(step.service)}`);
            return;
        }
        this.stopScreenshotCapture(sessionId);
    }
    // ─── Browser Management ──────────────────────────────────────────────────
    /**
     * Launch a new Chromium browser instance for a session
     */
    async launchBrowser(sessionId) {
        // Use headless mode in production (no display server on cloud containers)
        // Visible browser only works on desktop environments with a display
        const isHeadlessEnv = process.env.NODE_ENV === 'production' || (!process.env.DISPLAY && !process.env.WAYLAND_DISPLAY && process.platform === 'linux');
        const browser = await chromium.launch({
            headless: isHeadlessEnv, // Auto-detect: headless on servers, visible on desktop
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ]
        });
        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();
        console.log(`[AutopilotEngine] Browser launched for session ${sessionId}`);
        return {
            browser,
            context,
            page,
            screenshotInterval: null,
            timeoutTimer: null,
            latestScreenshot: null
        };
    }
    /**
     * Clean up a browser session: stop timers, close browser
     */
    async cleanupBrowserSession(sessionId) {
        const browserSession = this.browserSessions.get(sessionId);
        if (!browserSession)
            return;
        // Stop screenshot capture
        this.stopScreenshotCapture(sessionId);
        // Clear timeout timer
        if (browserSession.timeoutTimer) {
            clearTimeout(browserSession.timeoutTimer);
            browserSession.timeoutTimer = null;
        }
        // Close browser
        try {
            await browserSession.browser.close();
        }
        catch (error) {
            console.warn(`[AutopilotEngine] Error closing browser for session ${sessionId}:`, error);
        }
        this.browserSessions.delete(sessionId);
        console.log(`[AutopilotEngine] Browser cleaned up for session ${sessionId}`);
    }
    // ─── Screenshot Capture ──────────────────────────────────────────────────
    /**
     * Start periodic screenshot capture (every 2 seconds)
     */
    startScreenshotCapture(sessionId) {
        const browserSession = this.browserSessions.get(sessionId);
        if (!browserSession)
            return;
        // Don't start if already running
        if (browserSession.screenshotInterval)
            return;
        browserSession.screenshotInterval = setInterval(async () => {
            await this.captureScreenshot(sessionId);
        }, SCREENSHOT_INTERVAL_MS);
    }
    /**
     * Stop periodic screenshot capture
     */
    stopScreenshotCapture(sessionId) {
        const browserSession = this.browserSessions.get(sessionId);
        if (!browserSession?.screenshotInterval)
            return;
        clearInterval(browserSession.screenshotInterval);
        browserSession.screenshotInterval = null;
    }
    /**
     * Capture a single screenshot and emit it as an event
     */
    async captureScreenshot(sessionId) {
        const browserSession = this.browserSessions.get(sessionId);
        const session = this.sessions.get(sessionId);
        if (!browserSession || !session)
            return;
        try {
            const buffer = await browserSession.page.screenshot({
                type: 'jpeg',
                quality: 70,
                fullPage: false
            });
            const base64 = buffer.toString('base64');
            browserSession.latestScreenshot = base64;
            const currentStep = session.steps[session.currentStep];
            this.emit('screenshot', {
                sessionId,
                image: base64,
                step: session.currentStep,
                description: currentStep?.description ?? 'Capturing...',
                timestamp: Date.now()
            });
        }
        catch (error) {
            // Screenshot failure is non-fatal - page may be navigating
            const msg = error instanceof Error ? error.message : String(error);
            console.warn(`[AutopilotEngine] Screenshot failed for session ${sessionId}: ${msg}`);
        }
    }
    // ─── Event Emission ──────────────────────────────────────────────────────
    emitStatus(sessionId, state, message) {
        this.emit('status', { sessionId, state, step: this.sessions.get(sessionId)?.currentStep ?? 0, message, timestamp: Date.now() });
    }
    emitProgress(sessionId, step, message) {
        this.emit('progress', { sessionId, step, total: this.sessions.get(sessionId)?.steps.length ?? 0, message, timestamp: Date.now() });
    }
    emitComplete(sessionId) {
        const session = this.sessions.get(sessionId);
        this.emit('complete', {
            sessionId,
            steps: session?.steps ?? [],
            duration: Date.now() - (session?.createdAt ?? Date.now()),
            timestamp: Date.now()
        });
    }
    emitError(sessionId, message) {
        this.emit('error', { sessionId, message, timestamp: Date.now() });
    }
    // ─── Helpers ─────────────────────────────────────────────────────────────
    /**
     * Get session or throw a descriptive error
     */
    getSessionOrThrow(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        return session;
    }
    /**
     * Format a service name for display (e.g. "gmail" -> "Gmail")
     */
    formatServiceName(service) {
        const names = {
            gmail: 'Gmail',
            slack: 'Slack',
            github: 'GitHub',
            discord: 'Discord',
            notion: 'Notion',
            stripe: 'Stripe',
            hubspot: 'HubSpot',
            trello: 'Trello',
            googlesheets: 'Google Sheets',
            googledrive: 'Google Drive',
            dropbox: 'Dropbox',
            asana: 'Asana',
            linear: 'Linear',
            zoom: 'Zoom',
            quickbooks: 'QuickBooks'
        };
        return names[service] || service.charAt(0).toUpperCase() + service.slice(1);
    }
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Clean up sessions that have exceeded the timeout
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        for (const [sessionId, session] of Array.from(this.sessions.entries())) {
            const isTerminal = session.state === 'complete' || session.state === 'error' || session.state === 'cancelled';
            const isExpired = now - session.lastActivity > SESSION_TIMEOUT_MS;
            if (isTerminal && isExpired) {
                // Remove terminated sessions after timeout
                this.sessions.delete(sessionId);
                console.log(`[AutopilotEngine] Cleaned up expired session ${sessionId}`);
            }
            else if (!isTerminal && isExpired) {
                // Force cancel active sessions that timed out
                this.cancelSession(sessionId).catch(err => console.error(`[AutopilotEngine] Error force-cancelling expired session:`, err));
            }
        }
    }
}
// Singleton instance
export const autopilotEngine = new AutopilotEngine();
//# sourceMappingURL=AutopilotEngine.js.map
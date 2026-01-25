/**
 * PlaywrightService - Real Browser Automation via Playwright
 *
 * This service handles actual browser automation for complex workflows:
 * - Multi-step booking confirmations
 * - Form filling with real validation
 * - Web scraping and data extraction
 * - Screenshot capture
 * - Login flows
 *
 * Falls back to demo mode if browser launch fails or is disabled
 */
import { chromium } from 'playwright';
class PlaywrightServiceClass {
    browser = null;
    context = null;
    page = null;
    isEnabled = true;
    screenshotDir = './screenshots';
    /**
     * Initialize browser
     */
    async initialize() {
        if (!this.isEnabled) {
            console.log('[PlaywrightService] Browser automation disabled');
            return false;
        }
        try {
            console.log('[PlaywrightService] Launching browser...');
            this.browser = await chromium.launch({
                headless: true, // Run headless for server
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            this.context = await this.browser.newContext({
                viewport: { width: 1280, height: 720 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            this.page = await this.context.newPage();
            console.log('[PlaywrightService] Browser initialized successfully');
            return true;
        }
        catch (error) {
            console.error('[PlaywrightService] Failed to initialize browser:', error);
            this.isEnabled = false;
            return false;
        }
    }
    /**
     * Ensure browser is ready
     */
    async ensureReady() {
        if (!this.page) {
            const initialized = await this.initialize();
            if (!initialized)
                return null;
        }
        return this.page;
    }
    /**
     * Navigate to URL
     */
    async navigate(options) {
        const startTime = Date.now();
        const result = {
            success: false,
            screenshots: [],
            errors: [],
            duration: 0
        };
        const page = await this.ensureReady();
        if (!page) {
            // Demo mode
            result.success = true;
            result.data = { url: options.url, navigated: true, demoMode: true };
            result.duration = Date.now() - startTime;
            return result;
        }
        try {
            await page.goto(options.url, {
                waitUntil: options.waitUntil || 'domcontentloaded',
                timeout: options.timeout || 30000
            });
            result.success = true;
            result.data = { url: options.url, title: await page.title() };
        }
        catch (error) {
            result.errors.push(String(error));
        }
        result.duration = Date.now() - startTime;
        return result;
    }
    /**
     * Click element
     */
    async click(options) {
        const startTime = Date.now();
        const result = {
            success: false,
            screenshots: [],
            errors: [],
            duration: 0
        };
        const page = await this.ensureReady();
        if (!page) {
            result.success = true;
            result.data = { clicked: options.selector, demoMode: true };
            result.duration = Date.now() - startTime;
            return result;
        }
        try {
            await page.click(options.selector, { timeout: options.timeout || 10000 });
            result.success = true;
            result.data = { clicked: options.selector };
        }
        catch (error) {
            result.errors.push(String(error));
        }
        result.duration = Date.now() - startTime;
        return result;
    }
    /**
     * Type text
     */
    async type(options) {
        const startTime = Date.now();
        const result = {
            success: false,
            screenshots: [],
            errors: [],
            duration: 0
        };
        const page = await this.ensureReady();
        if (!page) {
            result.success = true;
            result.data = { typed: options.text, into: options.selector, demoMode: true };
            result.duration = Date.now() - startTime;
            return result;
        }
        try {
            await page.fill(options.selector, options.text);
            result.success = true;
            result.data = { typed: true, selector: options.selector };
        }
        catch (error) {
            result.errors.push(String(error));
        }
        result.duration = Date.now() - startTime;
        return result;
    }
    /**
     * Extract data from page
     */
    async extract(options) {
        const startTime = Date.now();
        const result = {
            success: false,
            screenshots: [],
            errors: [],
            duration: 0
        };
        const page = await this.ensureReady();
        if (!page) {
            result.success = true;
            result.data = { extracted: `demo_value_${Date.now()}`, demoMode: true };
            result.duration = Date.now() - startTime;
            return result;
        }
        try {
            if (options.multiple) {
                const elements = await page.$$(options.selector);
                const values = await Promise.all(elements.map(el => options.attribute
                    ? el.getAttribute(options.attribute)
                    : el.textContent()));
                result.data = { values: values.filter(Boolean) };
            }
            else {
                const element = await page.$(options.selector);
                if (element) {
                    const value = options.attribute
                        ? await element.getAttribute(options.attribute)
                        : await element.textContent();
                    result.data = { value };
                }
            }
            result.success = true;
        }
        catch (error) {
            result.errors.push(String(error));
        }
        result.duration = Date.now() - startTime;
        return result;
    }
    /**
     * Take screenshot
     */
    async screenshot(name) {
        const startTime = Date.now();
        const result = {
            success: false,
            screenshots: [],
            errors: [],
            duration: 0
        };
        const page = await this.ensureReady();
        if (!page) {
            const demoPath = `/screenshots/demo_${name || Date.now()}.png`;
            result.success = true;
            result.screenshots.push(demoPath);
            result.data = { path: demoPath, demoMode: true };
            result.duration = Date.now() - startTime;
            return result;
        }
        try {
            const filename = `${name || `screenshot_${Date.now()}`}.png`;
            const path = `${this.screenshotDir}/${filename}`;
            await page.screenshot({ path, fullPage: true });
            result.screenshots.push(path);
            result.success = true;
            result.data = { path };
        }
        catch (error) {
            result.errors.push(String(error));
        }
        result.duration = Date.now() - startTime;
        return result;
    }
    /**
     * Get page snapshot (HTML content and metadata)
     */
    async snapshot() {
        const startTime = Date.now();
        const result = {
            success: false,
            screenshots: [],
            errors: [],
            duration: 0
        };
        const page = await this.ensureReady();
        if (!page) {
            result.success = true;
            result.data = {
                snapshot: 'Demo page snapshot - browser automation not available',
                demoMode: true
            };
            result.duration = Date.now() - startTime;
            return result;
        }
        try {
            // Get page content and metadata instead of accessibility tree
            const title = await page.title();
            const url = page.url();
            const content = await page.content();
            result.success = true;
            result.data = {
                title,
                url,
                content: content.substring(0, 10000), // Limit content size
                contentLength: content.length
            };
        }
        catch (error) {
            result.errors.push(String(error));
        }
        result.duration = Date.now() - startTime;
        return result;
    }
    /**
     * Wait for element or time
     */
    async wait(options) {
        const startTime = Date.now();
        const result = {
            success: false,
            screenshots: [],
            errors: [],
            duration: 0
        };
        const page = await this.ensureReady();
        if (!page) {
            await new Promise(resolve => setTimeout(resolve, options.time || 1000));
            result.success = true;
            result.data = { waited: options.time || 1000, demoMode: true };
            result.duration = Date.now() - startTime;
            return result;
        }
        try {
            if (options.selector) {
                await page.waitForSelector(options.selector, { timeout: 10000 });
            }
            else if (options.time) {
                await page.waitForTimeout(options.time);
            }
            result.success = true;
            result.data = { waited: true };
        }
        catch (error) {
            result.errors.push(String(error));
        }
        result.duration = Date.now() - startTime;
        return result;
    }
    /**
     * Fill a form with multiple fields
     */
    async fillForm(fields) {
        const startTime = Date.now();
        const result = {
            success: false,
            screenshots: [],
            errors: [],
            duration: 0
        };
        const page = await this.ensureReady();
        if (!page) {
            result.success = true;
            result.data = { filled: fields.length, demoMode: true };
            result.duration = Date.now() - startTime;
            return result;
        }
        try {
            for (const field of fields) {
                if (field.type === 'select') {
                    await page.selectOption(field.selector, field.value);
                }
                else if (field.type === 'checkbox') {
                    const isChecked = await page.isChecked(field.selector);
                    if ((field.value === 'true') !== isChecked) {
                        await page.click(field.selector);
                    }
                }
                else {
                    await page.fill(field.selector, field.value);
                }
            }
            result.success = true;
            result.data = { filled: fields.length };
        }
        catch (error) {
            result.errors.push(String(error));
        }
        result.duration = Date.now() - startTime;
        return result;
    }
    /**
     * Execute a booking flow
     */
    async executeBookingFlow(config) {
        const startTime = Date.now();
        const result = {
            success: false,
            screenshots: [],
            errors: [],
            duration: 0
        };
        const page = await this.ensureReady();
        if (!page) {
            // Demo mode - simulate booking
            await new Promise(resolve => setTimeout(resolve, 2000));
            result.success = true;
            result.data = {
                confirmationNumber: `CONF_${Date.now()}`,
                provider: config.provider,
                bookingDetails: config.searchParams,
                demoMode: true
            };
            result.duration = Date.now() - startTime;
            return result;
        }
        try {
            // Navigate to booking site
            await page.goto(config.searchUrl, { waitUntil: 'domcontentloaded' });
            // Take initial screenshot
            const screenshotPath = `${this.screenshotDir}/booking_${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath });
            result.screenshots.push(screenshotPath);
            // Fill search form
            for (const [key, value] of Object.entries(config.searchParams)) {
                const selector = `input[name="${key}"], input[placeholder*="${key}"], #${key}`;
                try {
                    await page.fill(selector, value, { timeout: 5000 });
                }
                catch {
                    // Try alternative selectors
                    console.log(`[PlaywrightService] Could not find field: ${key}`);
                }
            }
            // Submit search
            await page.click('button[type="submit"], .search-button, .submit-btn');
            await page.waitForLoadState('networkidle', { timeout: 30000 });
            // Take results screenshot
            const resultsPath = `${this.screenshotDir}/results_${Date.now()}.png`;
            await page.screenshot({ path: resultsPath });
            result.screenshots.push(resultsPath);
            result.success = true;
            result.data = {
                status: 'search_completed',
                provider: config.provider,
                searchParams: config.searchParams,
                pageTitle: await page.title()
            };
        }
        catch (error) {
            result.errors.push(String(error));
        }
        result.duration = Date.now() - startTime;
        return result;
    }
    /**
     * Get current URL
     */
    async getCurrentUrl() {
        const page = await this.ensureReady();
        return page?.url() || null;
    }
    /**
     * Get page title
     */
    async getPageTitle() {
        const page = await this.ensureReady();
        return page ? await page.title() : null;
    }
    /**
     * Close browser
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.page = null;
            console.log('[PlaywrightService] Browser closed');
        }
    }
    /**
     * Check if browser is available
     */
    get isAvailable() {
        return this.isEnabled && this.browser !== null;
    }
    /**
     * Check if running in demo mode
     */
    get isDemoMode() {
        return !this.isEnabled || !this.browser;
    }
}
// Export singleton instance
export const playwrightService = new PlaywrightServiceClass();
//# sourceMappingURL=PlaywrightService.js.map
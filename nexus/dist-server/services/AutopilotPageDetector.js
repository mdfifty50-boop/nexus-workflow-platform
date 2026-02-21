/**
 * AutopilotPageDetector - Detects login pages, 2FA prompts, and success states
 *
 * Used by AutopilotEngine to determine the current state of a browser page
 * during automated workflow configuration. Supports service-specific detection
 * for major SaaS platforms and generic fallback detection.
 */
// Service-specific URL patterns for login, success, and 2FA detection
const SERVICE_PATTERNS = {
    google: {
        loginUrl: /accounts\.google\.com\/(signin|o\/oauth|ServiceLogin)/,
        successUrl: /myaccount\.google\.com|console\.cloud\.google|mail\.google/,
        twoFactorHints: ['2-Step Verification', "Verify it's you"]
    },
    slack: {
        loginUrl: /slack\.com\/(signin|oauth)/,
        successUrl: /app\.slack\.com|slack\.com\/ssb/,
        twoFactorHints: ['Two-factor authentication', 'Enter your code']
    },
    github: {
        loginUrl: /github\.com\/(login|sessions)/,
        successUrl: /github\.com\/(dashboard|settings)/,
        twoFactorHints: ['Two-factor authentication', 'Verify your identity']
    },
    discord: {
        loginUrl: /discord\.com\/(login|oauth2)/,
        successUrl: /discord\.com\/(channels|app)/,
        twoFactorHints: ['Two-Factor Authentication']
    },
    notion: {
        loginUrl: /notion\.so\/(login|loginWithEmail)/,
        successUrl: /notion\.so\/[a-f0-9]/,
        twoFactorHints: ['verification code']
    },
    stripe: {
        loginUrl: /dashboard\.stripe\.com\/(login|test)/,
        successUrl: /dashboard\.stripe\.com\/(payments|home)/,
        twoFactorHints: ['Verify your identity']
    },
    hubspot: {
        loginUrl: /app\.hubspot\.com\/login/,
        successUrl: /app\.hubspot\.com\/(contacts|reports)/,
        twoFactorHints: ['Verify your identity']
    },
    trello: {
        loginUrl: /trello\.com\/(login|auth)/,
        successUrl: /trello\.com\/[a-zA-Z0-9]/,
        twoFactorHints: ['Two-step verification']
    },
    quickbooks: {
        loginUrl: /intuit\.com\/(login|signin)/,
        successUrl: /qbo\.intuit\.com|quickbooks\.intuit\.com/,
        twoFactorHints: ['Verify your identity', 'confirmation code']
    }
};
// Generic selectors that indicate a login form
const GENERIC_LOGIN_SELECTORS = [
    'input[type="password"]',
    'input[name="password"]',
    '#password',
    'form[action*="login"]',
    'form[action*="signin"]',
    'form[action*="auth"]'
];
// Generic text patterns that indicate a login page
const GENERIC_LOGIN_TEXTS = [
    'Sign in', 'Log in', 'Login', 'Sign In',
    'Enter your password', 'Enter password',
    'Welcome back', 'Sign in to continue'
];
export class AutopilotPageDetector {
    /**
     * Detect the current page state - is it a login page, 2FA prompt, or success page?
     */
    async detect(page) {
        const url = page.url();
        // Check service-specific patterns first (highest confidence)
        for (const [service, patterns] of Object.entries(SERVICE_PATTERNS)) {
            if (patterns.loginUrl.test(url)) {
                const is2FA = await this.check2FA(page, patterns.twoFactorHints);
                return {
                    isLoginPage: !is2FA,
                    is2FAPage: is2FA,
                    isSuccessPage: false,
                    service,
                    confidence: 0.95,
                    loginFormSelector: await this.findLoginForm(page)
                };
            }
            if (patterns.successUrl.test(url)) {
                return {
                    isLoginPage: false,
                    is2FAPage: false,
                    isSuccessPage: true,
                    service,
                    confidence: 0.9
                };
            }
        }
        // Generic detection fallback
        const hasPasswordField = await this.hasLoginForm(page);
        const hasLoginText = await this.hasLoginText(page);
        const is2FA = await this.checkGeneric2FA(page);
        if (is2FA) {
            return {
                isLoginPage: false,
                is2FAPage: true,
                isSuccessPage: false,
                service: this.guessServiceFromUrl(url),
                confidence: 0.7
            };
        }
        if (hasPasswordField || hasLoginText) {
            return {
                isLoginPage: true,
                is2FAPage: false,
                isSuccessPage: false,
                service: this.guessServiceFromUrl(url),
                confidence: hasPasswordField ? 0.85 : 0.6,
                loginFormSelector: await this.findLoginForm(page)
            };
        }
        return {
            isLoginPage: false,
            is2FAPage: false,
            isSuccessPage: false,
            service: this.guessServiceFromUrl(url),
            confidence: 0.5
        };
    }
    /**
     * Check if the page has a login form by looking for common selectors
     */
    async hasLoginForm(page) {
        for (const selector of GENERIC_LOGIN_SELECTORS) {
            try {
                const el = await page.$(selector);
                if (el)
                    return true;
            }
            catch {
                /* selector not found or page navigation - ignore */
            }
        }
        return false;
    }
    /**
     * Check if the page body contains login-related text
     */
    async hasLoginText(page) {
        try {
            const bodyText = await page.textContent('body') || '';
            return GENERIC_LOGIN_TEXTS.some(t => bodyText.includes(t));
        }
        catch {
            return false;
        }
    }
    /**
     * Check for service-specific 2FA hints in the page body
     */
    async check2FA(page, hints) {
        try {
            const bodyText = await page.textContent('body') || '';
            return hints.some(h => bodyText.includes(h));
        }
        catch {
            return false;
        }
    }
    /**
     * Check for generic 2FA/MFA indicators on the page
     */
    async checkGeneric2FA(page) {
        try {
            const bodyText = await page.textContent('body') || '';
            const twoFactorHints = [
                'two-factor', 'two factor', '2FA', '2-step',
                'verification code', 'authenticator', 'security code',
                'Enter the code', 'Verify your identity'
            ];
            return twoFactorHints.some(h => bodyText.toLowerCase().includes(h.toLowerCase()));
        }
        catch {
            return false;
        }
    }
    /**
     * Find the first matching login form selector on the page
     */
    async findLoginForm(page) {
        for (const selector of GENERIC_LOGIN_SELECTORS) {
            try {
                const el = await page.$(selector);
                if (el)
                    return selector;
            }
            catch {
                /* ignore */
            }
        }
        return undefined;
    }
    /**
     * Guess the service name from a URL hostname
     */
    guessServiceFromUrl(url) {
        try {
            const hostname = new URL(url).hostname;
            const parts = hostname.replace('www.', '').split('.');
            return parts[0] || null;
        }
        catch {
            return null;
        }
    }
}
//# sourceMappingURL=AutopilotPageDetector.js.map
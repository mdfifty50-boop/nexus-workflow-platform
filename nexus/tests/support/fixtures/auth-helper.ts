/**
 * Authentication Helper for Nexus E2E Tests
 *
 * Handles Clerk authentication for test scenarios.
 * Supports both UI-based login and session storage.
 */

import { type Page, expect } from '@playwright/test';

export class AuthHelper {
  private page: Page;
  private baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  }

  /**
   * Login via Clerk UI
   * Uses test credentials from environment variables
   */
  async login(email?: string, password?: string): Promise<void> {
    const testEmail = email || process.env.TEST_USER_EMAIL;
    const testPassword = password || process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error('Test credentials not configured. Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env');
    }

    // Navigate to login page
    await this.page.goto(`${this.baseUrl}/login`);

    // Wait for Clerk to load
    await this.page.waitForSelector('[data-clerk-component]', { timeout: 10000 }).catch(() => {
      // Clerk might use different selectors, try alternative
    });

    // Fill login form
    // Note: Clerk's exact selectors may vary - adjust as needed
    await this.page.fill('input[name="identifier"], input[type="email"]', testEmail);
    await this.page.click('button[type="submit"], button:has-text("Continue")');

    // Wait for password field (Clerk's two-step flow)
    await this.page.waitForSelector('input[type="password"]', { timeout: 5000 }).catch(() => {
      // Single-step login flow - password field should already be visible
    });

    await this.page.fill('input[type="password"]', testPassword);
    await this.page.click('button[type="submit"], button:has-text("Continue"), button:has-text("Sign in")');

    // Wait for redirect to dashboard
    await this.page.waitForURL('**/dashboard', { timeout: 15000 });

    // Verify login success
    await expect(this.page).toHaveURL(/.*dashboard/);
  }

  /**
   * Logout from current session
   */
  async logout(): Promise<void> {
    // Click user menu or profile
    const userMenu = this.page.locator('[data-testid="user-menu"], [data-testid="user-avatar"], .user-button');
    await userMenu.click();

    // Click sign out
    await this.page.click('button:has-text("Sign out"), [data-testid="sign-out"]');

    // Wait for redirect to login or home
    await this.page.waitForURL(/\/(login)?$/);
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    // Check for authentication indicators
    const indicators = [
      '[data-testid="user-menu"]',
      '[data-testid="user-avatar"]',
      '.cl-userButtonTrigger',
    ];

    for (const selector of indicators) {
      const element = this.page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Save authentication state to file for reuse
   * Useful for parallelizing tests with shared auth
   */
  async saveAuthState(path: string = './tests/.auth/user.json'): Promise<void> {
    await this.page.context().storageState({ path });
  }

  /**
   * Navigate to a protected page (ensures authentication)
   */
  async navigateAuthenticated(path: string): Promise<void> {
    if (!await this.isAuthenticated()) {
      await this.login();
    }
    await this.page.goto(`${this.baseUrl}${path}`);
  }
}

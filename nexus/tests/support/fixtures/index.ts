/**
 * Nexus Test Fixtures
 *
 * Extends Playwright's base test with Nexus-specific fixtures:
 * - Authentication (Clerk)
 * - Workflow execution helpers
 * - SSE connection management
 * - API client for backend interactions
 *
 * Usage:
 *   import { test, expect } from '../support/fixtures';
 *
 * @see https://playwright.dev/docs/test-fixtures
 */

import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import { AuthHelper } from './auth-helper';
import { WorkflowHelper } from './workflow-helper';
import { SSEHelper } from './sse-helper';
import { ApiHelper } from './api-helper';

// Fixture types
type NexusFixtures = {
  // Authentication helper for Clerk login/logout
  auth: AuthHelper;

  // Workflow execution and verification helper
  workflow: WorkflowHelper;

  // SSE connection helper for real-time updates testing
  sse: SSEHelper;

  // API helper for direct backend interactions
  api: ApiHelper;

  // Authenticated page (auto-login before test)
  authenticatedPage: Page;

  // Authenticated context (for multi-tab tests)
  authenticatedContext: BrowserContext;
};

// Extend base test with Nexus fixtures
export const test = base.extend<NexusFixtures>({
  // Authentication helper
  auth: async ({ page }, use) => {
    const auth = new AuthHelper(page);
    await use(auth);
  },

  // Workflow helper
  workflow: async ({ page }, use) => {
    const workflow = new WorkflowHelper(page);
    await use(workflow);
    // Cleanup: cancel any running workflows
    await workflow.cleanup();
  },

  // SSE helper
  sse: async ({ page }, use) => {
    const sse = new SSEHelper(page);
    await use(sse);
    // Cleanup: close any open SSE connections
    await sse.cleanup();
  },

  // API helper
  api: async ({ request }, use) => {
    const api = new ApiHelper(request);
    await use(api);
  },

  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    const auth = new AuthHelper(page);
    await auth.login();
    await use(page);
    // Optional: logout after test
    // await auth.logout();
  },

  // Authenticated context (for multi-tab scenarios)
  authenticatedContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const auth = new AuthHelper(page);
    await auth.login();
    await use(context);
    await context.close();
  },
});

// Re-export expect for convenience
export { expect };

// Re-export types
export type { Page, BrowserContext };

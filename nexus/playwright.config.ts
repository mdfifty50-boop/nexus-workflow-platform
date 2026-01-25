import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Nexus AI Platform
 *
 * Configured for:
 * - E2E testing of workflow execution with SSE real-time updates
 * - Multi-browser support (Chromium, Firefox, WebKit)
 * - CI/CD optimization with parallelization
 * - Failure artifact capture (screenshots, videos, traces)
 *
 * @see https://playwright.dev/docs/test-configuration
 */

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI (use 1 worker for stability)
  workers: process.env.CI ? 1 : undefined,

  // Timeouts
  timeout: 60 * 1000, // Test timeout: 60s (workflow execution can be slow)
  expect: {
    timeout: 15 * 1000, // Assertion timeout: 15s
  },

  // Global test settings
  use: {
    // Base URL for navigation (frontend dev server)
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    // Capture trace on failure for debugging
    trace: 'retain-on-failure',

    // Capture screenshots only on failure
    screenshot: 'only-on-failure',

    // Capture video only on failure (reduces storage)
    video: 'retain-on-failure',

    // Action timeout: 15s (for clicks, fills, etc.)
    actionTimeout: 15 * 1000,

    // Navigation timeout: 30s (pages with SSE may take longer)
    navigationTimeout: 30 * 1000,

    // Extra HTTP headers for API requests
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  // Reporter configuration
  reporter: [
    // HTML report for local viewing
    ['html', { outputFolder: 'test-results/html', open: 'never' }],
    // JUnit XML for CI integration
    ['junit', { outputFile: 'test-results/junit.xml' }],
    // Console output during execution
    ['list'],
  ],

  // Output folder for test artifacts
  outputDir: 'test-results/artifacts',

  // Browser projects
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile viewports (for responsive testing)
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run local dev server before starting tests (optional)
  // Uncomment if you want Playwright to start the server
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});

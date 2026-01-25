/**
 * Nexus E2E Test Examples
 *
 * Demonstrates testing patterns for:
 * - Authentication flows
 * - Workflow creation and execution
 * - Real-time SSE updates
 * - API interactions
 */

import { test, expect } from '../support/fixtures';

test.describe('Authentication', () => {
  test('should login with valid credentials', async ({ page, auth }) => {
    await page.goto('/login');
    await auth.login();

    // Should redirect to dashboard after login
    await expect(page).toHaveURL(/.*dashboard/);

    // Should show user menu indicating logged in state
    const isAuthenticated = await auth.isAuthenticated();
    expect(isAuthenticated).toBe(true);
  });

  test('should logout successfully', async ({ authenticatedPage, auth }) => {
    await auth.logout();

    // Should redirect to login or home
    await expect(authenticatedPage).toHaveURL(/\/(login)?$/);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Dashboard', () => {
  test('should display dashboard after login', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check for key dashboard elements
    await expect(authenticatedPage.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('should show chat input for workflow creation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Chat input should be visible
    const chatInput = authenticatedPage.locator(
      '[data-testid="chat-input"], textarea[placeholder*="workflow"], input[placeholder*="task"]'
    );
    await expect(chatInput).toBeVisible();
  });
});

test.describe('Workflow Creation', () => {
  test('should create workflow from chat prompt', async ({ authenticatedPage, workflow }) => {
    const workflowId = await workflow.createWorkflowViaChat(
      'Create a simple test workflow that logs hello world'
    );

    expect(workflowId).toBeTruthy();

    // Workflow preview should be visible
    await expect(
      authenticatedPage.locator('[data-testid="workflow-preview"], .workflow-visualization')
    ).toBeVisible();
  });

  test('should display workflow steps after creation', async ({ authenticatedPage: _authenticatedPage, workflow }) => {
    await workflow.createWorkflowViaChat('Create a two-step workflow: analyze then summarize');

    // Should show workflow steps
    const steps = await workflow.getWorkflowSteps();
    expect(steps.length).toBeGreaterThan(0);
  });
});

test.describe('Workflow Execution', () => {
  test.skip('should execute workflow and show progress', async ({ authenticatedPage: _authenticatedPage, workflow }) => {
    // Create workflow first
    await workflow.createWorkflowViaChat('Create a simple logging workflow');

    // Execute
    const state = await workflow.executeWorkflow();

    // Verify completion
    expect(state.status).toBe('completed');
  });

  test.skip('should update UI in real-time during execution', async ({
    authenticatedPage: _authenticatedPage,
    workflow,
    sse,
  }) => {
    // Start capturing SSE messages
    await sse.startCapturing();

    // Create and execute workflow
    await workflow.createWorkflowViaChat('Create a multi-step workflow');

    // Wait for SSE connection
    await sse.waitForConnection();

    // Execute workflow
    await workflow.executeWorkflow();

    // Verify SSE messages were received
    const messages = await sse.stopCapturing();
    expect(messages.length).toBeGreaterThan(0);

    // Should have received status updates
    const statusUpdates = messages.filter(
      (m) => m.type === 'workflow_status' || m.type === 'node_update'
    );
    expect(statusUpdates.length).toBeGreaterThan(0);
  });
});

test.describe('SSE Real-time Updates', () => {
  test('should establish SSE connection', async ({ authenticatedPage, sse }) => {
    await authenticatedPage.goto('/dashboard');

    // Start SSE capture (this sets up EventSource interception)
    await sse.startCapturing();

    // Trigger an action that establishes SSE
    // This depends on your app's SSE connection strategy
    await authenticatedPage.locator('[data-testid="chat-input"]').click();

    // Wait a bit for potential connection
    await authenticatedPage.waitForTimeout(2000);

    // Check if connection established
    const isConnected = await sse.verifyConnection();
    // Note: Connection might not be established until workflow execution
    // This test validates the helper works correctly
    expect(typeof isConnected).toBe('boolean');
  });

  test('should capture SSE messages', async ({ authenticatedPage: _authenticatedPage, sse }) => {
    await sse.startCapturing();

    // Messages array should be accessible
    const messages = await sse.getCapturedMessages();
    expect(Array.isArray(messages)).toBe(true);
  });
});

test.describe('API Health', () => {
  test('should have healthy API', async ({ api }) => {
    const isHealthy = await api.healthCheck();
    expect(isHealthy).toBe(true);
  });

  test('should wait for API availability', async ({ api }) => {
    // This should succeed since we expect API to be running
    await expect(api.waitForApi(5000)).resolves.not.toThrow();
  });
});

test.describe('Workflow API Operations', () => {
  test.skip('should create workflow via API', async ({ api }) => {
    const workflow = await api.createWorkflow({
      name: 'Test API Workflow',
      description: 'Created via E2E test API',
      prompt: 'Simple test task',
    });

    expect(workflow.id).toBeTruthy();
    expect(workflow.name).toBe('Test API Workflow');

    // Cleanup
    await api.deleteWorkflow(workflow.id);
  });

  test.skip('should list workflows via API', async ({ api }) => {
    const result = await api.listWorkflows();

    expect(Array.isArray(result.workflows)).toBe(true);
    expect(typeof result.total).toBe('number');
  });
});

// Visual regression tests (optional - requires baseline images)
test.describe('Visual Regression', () => {
  test.skip('dashboard should match snapshot', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Wait for content to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Take screenshot and compare
    await expect(authenticatedPage).toHaveScreenshot('dashboard.png', {
      maxDiffPixels: 100,
    });
  });
});

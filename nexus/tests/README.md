# Nexus E2E Testing Guide

End-to-end testing framework for the Nexus AI Workflow Automation Platform using Playwright.

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run tests
npm run test:e2e
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e:ui` | Run tests with Playwright UI |
| `npm run test:e2e:headed` | Run tests in headed browser mode |
| `npm run test:e2e:debug` | Run tests in debug mode |
| `npm run test:e2e:report` | View the HTML test report |

## Configuration

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp tests/.env.example tests/.env
   ```

2. Configure the required variables:
   - `BASE_URL` - Frontend URL (default: http://localhost:5173)
   - `API_URL` - Backend API URL (default: http://localhost:3001/api)
   - `TEST_USER_EMAIL` - Test user email for authentication
   - `TEST_USER_PASSWORD` - Test user password

### Clerk Authentication

Tests require a dedicated test user in your Clerk instance:

1. Go to Clerk Dashboard > Users
2. Create a test user with known credentials
3. Add credentials to `tests/.env`

For CI environments, use Clerk's testing tokens or session storage.

## Test Structure

```
tests/
├── .env.example          # Environment template
├── README.md             # This file
├── e2e/                  # E2E test files
│   └── example.spec.ts   # Sample tests
└── support/
    └── fixtures/         # Test fixtures
        ├── index.ts      # Main fixture exports
        ├── auth-helper.ts    # Authentication utilities
        ├── workflow-helper.ts # Workflow testing utilities
        ├── sse-helper.ts     # SSE connection utilities
        └── api-helper.ts     # Backend API utilities
```

## Writing Tests

### Using Fixtures

Import the extended test from fixtures:

```typescript
import { test, expect } from '../support/fixtures';

test('example test', async ({ page, auth, workflow, sse, api }) => {
  // auth - Authentication helper
  // workflow - Workflow execution helper
  // sse - SSE connection helper
  // api - Backend API helper
});
```

### Pre-authenticated Tests

Use `authenticatedPage` for tests requiring login:

```typescript
test('dashboard test', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  // User is already logged in
});
```

### Testing Workflows

```typescript
test('workflow execution', async ({ authenticatedPage, workflow, sse }) => {
  // Start capturing SSE messages
  await sse.startCapturing();

  // Create workflow via chat
  const workflowId = await workflow.createWorkflowViaChat('Create a simple task');

  // Execute and wait for completion
  const state = await workflow.executeWorkflow();

  // Verify
  expect(state.status).toBe('completed');

  // Check SSE messages
  const messages = await sse.stopCapturing();
  expect(messages.length).toBeGreaterThan(0);
});
```

### Testing SSE Real-time Updates

```typescript
test('real-time updates', async ({ authenticatedPage, sse }) => {
  await sse.startCapturing();

  // Wait for specific message type
  const update = await sse.waitForMessage('workflow_status', {
    timeout: 30000,
    predicate: (msg) => msg.data.status === 'completed'
  });

  expect(update).toBeDefined();
});
```

### API Testing

```typescript
test('api operations', async ({ api }) => {
  // Health check
  const isHealthy = await api.healthCheck();
  expect(isHealthy).toBe(true);

  // Create workflow
  const workflow = await api.createWorkflow({
    name: 'Test Workflow',
    prompt: 'Simple test task'
  });

  // Verify completion
  await api.expectWorkflowCompleted(workflow.id, 60000);

  // Cleanup
  await api.deleteWorkflow(workflow.id);
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start services
        run: |
          npm run dev &
          npm run dev:server &
          sleep 10

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:5173
          API_URL: http://localhost:3001/api
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

1. **Isolate tests** - Each test should be independent and not rely on state from other tests

2. **Use fixtures** - Leverage the provided fixtures for common operations

3. **Clean up** - Tests automatically clean up workflows and SSE connections via fixture teardown

4. **Realistic timeouts** - Use appropriate timeouts for async operations (workflow execution can take time)

5. **Skip flaky tests** - Mark tests that depend on external services with `test.skip()` when services aren't available

## Debugging

### Debug mode
```bash
npm run test:e2e:debug
```

### View traces
```bash
npx playwright show-trace trace.zip
```

### Screenshots on failure
Screenshots are automatically captured on test failure in `test-results/`

## Troubleshooting

### Tests fail with authentication errors
- Verify test credentials in `.env`
- Ensure Clerk test user exists
- Check Clerk API keys are configured

### SSE connection timeout
- Verify backend server is running
- Check `SSE_URL` configuration
- Ensure firewall allows SSE connections

### Workflow timeout
- Increase `WORKFLOW_TIMEOUT` for complex workflows
- Check Claude API key is configured
- Verify backend logs for errors

# Testing Strategy - Nexus Platform

**Date:** 2026-01-06
**Author:** Mohammed
**Purpose:** Address Blocker #8 from Implementation Readiness Report - Define comprehensive testing approach

---

## Executive Summary

**Testing Philosophy:** Automated testing at all levels to ensure quality, prevent regressions, and enable confident deployments.

**Test Pyramid:**
```
         ╱╲
        ╱E2E╲         10% - End-to-End Tests (Playwright)
       ╱──────╲
      ╱ Integr.╲       30% - Integration Tests (API contracts, DB)
     ╱──────────╲
    ╱   Unit      ╲    60% - Unit Tests (Jest, Pytest)
   ╱──────────────╲
  ╱ Static Analysis╲   100% - Linting, Type Checking (ESLint, TypeScript)
 ╱──────────────────╲
```

**Coverage Goals:**
- Unit Tests: **80% code coverage minimum**
- Integration Tests: **All critical user paths**
- E2E Tests: **Top 10 user workflows**
- Manual QA: **Pre-production smoke tests only**

**Cost Impact:**
- GitHub Actions CI time: +10 minutes per run
- Acceptable within free tier limits

---

## 1. Static Analysis (100% Coverage)

### TypeScript Strict Mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'react-hooks/exhaustive-deps': 'error',
  },
};
```

---

## 2. Unit Tests (60% of test suite)

### Frontend Unit Tests (Jest + React Testing Library)

**File:** `services/frontend/src/components/WorkflowVisualization.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { WorkflowVisualization } from './WorkflowVisualization';

describe('WorkflowVisualization', () => {
  it('should render workflow nodes', () => {
    const workflow = {
      id: 'wf_123',
      status: 'orchestrating',
      tasks: [
        { id: 'task_1', name: 'Planning', status: 'completed' },
        { id: 'task_2', name: 'Execution', status: 'in_progress' },
      ],
    };

    render(<WorkflowVisualization workflow={workflow} />);

    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('Execution')).toBeInTheDocument();
  });

  it('should show progress percentage', () => {
    const workflow = {
      id: 'wf_123',
      status: 'building',
      progress: { completedTasks: 3, totalTasks: 8 },
    };

    render(<WorkflowVisualization workflow={workflow} />);

    expect(screen.getByText('37.5%')).toBeInTheDocument();
  });
});
```

### Backend Unit Tests (Jest)

**File:** `services/orchestration/src/adapters/BMADAdapter.test.ts`

```typescript
import { BMADAdapter } from './BMADAdapter';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BMADAdapter', () => {
  let adapter: BMADAdapter;

  beforeEach(() => {
    adapter = new BMADAdapter();
  });

  it('should start workflow successfully', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        workflowId: 'wf_123',
        status: 'planning',
        estimatedTokens: 150000,
      },
    });

    const result = await adapter.startWorkflow({
      workflowId: 'wf_123',
      userId: 'user_456',
      projectId: 'proj_789',
      userRequest: 'Test workflow',
      context: {},
      budget: { maxTokens: 500000, maxCostUSD: 10.00 },
    });

    expect(result.workflowId).toBe('wf_123');
    expect(result.status).toBe('planning');
  });

  it('should handle BMAD API errors', async () => {
    mockedAxios.post.mockRejectedValue(new Error('BMAD service unavailable'));

    await expect(
      adapter.startWorkflow({
        workflowId: 'wf_123',
        userId: 'user_456',
        projectId: 'proj_789',
        userRequest: 'Test workflow',
        context: {},
        budget: { maxTokens: 500000, maxCostUSD: 10.00 },
      })
    ).rejects.toThrow('BMAD workflow start failed');
  });
});
```

### Python Unit Tests (Pytest)

**File:** `services/bmad/tests/test_director.py`

```python
import pytest
from bmad.director import Director

@pytest.fixture
def director():
    return Director()

def test_director_creates_workflow_plan(director):
    request = "Organize my Salesforce leads from last week"
    plan = director.create_plan(request)

    assert plan['steps'] > 0
    assert 'salesforce' in plan['integrations_required']
    assert plan['estimated_tokens'] > 0

def test_director_estimates_cost_accurately(director):
    request = "Send a simple email"
    plan = director.create_plan(request)

    # Simple workflows should cost < $1
    assert plan['estimated_cost_usd'] < 1.00

def test_director_handles_complex_requests(director):
    request = "Build a landing page and deploy to Vercel"
    plan = director.create_plan(request)

    assert 'code_generation' in plan['capabilities_required']
    assert plan['estimated_duration_minutes'] > 10
```

---

## 3. Integration Tests (30% of test suite)

### API Integration Tests (Supertest)

**File:** `services/orchestration/src/routes/workflows.test.ts`

```typescript
import request from 'supertest';
import { app } from '../app';
import { createTestUser, createTestProject } from '../test-utils';

describe('POST /workflows', () => {
  let authToken: string;
  let projectId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);
    authToken = user.authToken;
    projectId = project.id;
  });

  it('should create a new workflow', async () => {
    const response = await request(app)
      .post('/workflows')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        projectId,
        userRequest: 'Send an email to john@example.com',
      });

    expect(response.status).toBe(201);
    expect(response.body.workflowId).toBeDefined();
    expect(response.body.status).toBe('planning');
  });

  it('should reject unauthenticated requests', async () => {
    const response = await request(app)
      .post('/workflows')
      .send({
        projectId,
        userRequest: 'Test',
      });

    expect(response.status).toBe(401);
  });

  it('should validate budget constraints', async () => {
    const response = await request(app)
      .post('/workflows')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        projectId,
        userRequest: 'Complex task',
        budget: { maxCostUSD: 0.01 }, // Unrealistically low
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('budget');
  });
});
```

### Database Integration Tests

**File:** `services/orchestration/src/database/workflows.test.ts`

```typescript
import { supabase } from '../lib/supabase';
import { createWorkflow, getWorkflowById } from './workflows';

describe('Workflow Database Operations', () => {
  beforeEach(async () => {
    // Clean test database
    await supabase.from('workflows').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  it('should create workflow with RLS enforcement', async () => {
    const workflow = await createWorkflow({
      userId: 'user_123',
      projectId: 'proj_456',
      userRequest: 'Test',
    });

    expect(workflow.id).toBeDefined();
    expect(workflow.userId).toBe('user_123');

    // Verify RLS: Different user cannot access
    await expect(
      getWorkflowById(workflow.id, 'user_different')
    ).rejects.toThrow('Workflow not found');
  });

  it('should create checkpoint on workflow state change', async () => {
    const workflow = await createWorkflow({
      userId: 'user_123',
      projectId: 'proj_456',
      userRequest: 'Test',
    });

    await updateWorkflowStatus(workflow.id, 'orchestrating');

    const checkpoints = await getWorkflowCheckpoints(workflow.id);
    expect(checkpoints.length).toBe(1);
    expect(checkpoints[0].checkpoint_name).toBe('planning_complete');
  });
});
```

---

## 4. End-to-End Tests (10% of test suite)

### Playwright E2E Tests

**File:** `services/frontend/tests/e2e/workflow-execution.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Workflow Execution', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('https://staging.nexus.ai/login');
    await page.fill('[data-testid="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('[data-testid="password"]', process.env.TEST_USER_PASSWORD);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should execute simple email workflow', async ({ page }) => {
    // Navigate to chat
    await page.click('[data-testid="new-workflow"]');

    // Enter workflow request
    await page.fill('[data-testid="chat-input"]', 'Send an email to test@example.com with subject "Test"');
    await page.click('[data-testid="send-button"]');

    // Wait for workflow to start
    await expect(page.locator('[data-testid="workflow-status"]')).toHaveText('Planning', { timeout: 10000 });

    // Workflow should transition through stages
    await expect(page.locator('[data-testid="workflow-status"]')).toHaveText('Building', { timeout: 30000 });

    // Workflow should complete
    await expect(page.locator('[data-testid="workflow-status"]')).toHaveText('Completed', { timeout: 60000 });

    // Verify email was sent (check audit logs)
    await page.click('[data-testid="view-results"]');
    await expect(page.locator('[data-testid="result-message"]')).toContainText('Email sent successfully');
  });

  test('should visualize workflow progress', async ({ page }) => {
    await page.click('[data-testid="new-workflow"]');
    await page.fill('[data-testid="chat-input"]', 'Organize my CRM leads');
    await page.click('[data-testid="send-button"]');

    // Verify workflow visualization appears
    await expect(page.locator('[data-testid="workflow-visualization"]')).toBeVisible({ timeout: 5000 });

    // Verify nodes are rendered
    const nodes = page.locator('[data-testid^="workflow-node-"]');
    await expect(nodes).toHaveCount(greaterThan(0));

    // Verify progress updates
    const progressBar = page.locator('[data-testid="workflow-progress"]');
    await expect(progressBar).toHaveAttribute('aria-valuenow', greaterThan(0));
  });

  test('should cancel running workflow', async ({ page }) => {
    await page.click('[data-testid="new-workflow"]');
    await page.fill('[data-testid="chat-input"]', 'Complex task that takes time');
    await page.click('[data-testid="send-button"]');

    // Wait for workflow to start
    await expect(page.locator('[data-testid="workflow-status"]')).toHaveText('Building', { timeout: 10000 });

    // Cancel workflow
    await page.click('[data-testid="cancel-workflow"]');
    await page.click('[data-testid="confirm-cancel"]');

    // Verify workflow is cancelled
    await expect(page.locator('[data-testid="workflow-status"]')).toHaveText('Cancelled', { timeout: 5000 });
  });
});
```

---

## 5. Testing Coverage Requirements

### Per-Component Coverage

| Component | Unit Test Coverage | Integration Test Coverage |
|-----------|-------------------|--------------------------|
| Frontend Components | 80% | N/A |
| API Routes | 70% | 100% (all endpoints) |
| Database Layer | 90% | 100% (CRUD + RLS) |
| BMAD Adapter | 80% | 80% (API contracts) |
| Execution Service | 75% | 90% (code execution) |

### Coverage Enforcement

```json
// package.json
{
  "scripts": {
    "test:unit": "jest --coverage --coverageThreshold='{\"global\":{\"branches\":70,\"functions\":75,\"lines\":80,\"statements\":80}}'",
    "test:watch": "jest --watch"
  }
}
```

**GitHub Action Check:**
```yaml
- name: Check test coverage
  run: npm run test:unit
  # Fails CI if coverage below threshold
```

---

## 6. Test Data Management

### Test Fixtures

**File:** `services/orchestration/src/test-utils/fixtures.ts`

```typescript
export const testWorkflowFixture = {
  id: 'wf_test_123',
  userId: 'user_test_456',
  projectId: 'proj_test_789',
  status: 'planning',
  phase: 'PLANNING',
  userRequest: 'Test workflow request',
  estimatedTokens: 50000,
  estimatedCostUSD: 0.90,
};

export const testUserFixture = {
  id: 'user_test_456',
  email: 'test@nexus.ai',
  name: 'Test User',
  tier: 'professional',
  createdAt: '2026-01-01T00:00:00Z',
};
```

### Database Seeding

```typescript
// scripts/seed-test-db.ts
import { supabase } from '../services/orchestration/src/lib/supabase';

async function seedTestDatabase() {
  // Clear existing test data
  await supabase.from('workflows').delete().like('id', 'test_%');

  // Insert test users
  await supabase.from('users').upsert([
    { id: 'user_test_456', email: 'test@nexus.ai', name: 'Test User' },
  ]);

  // Insert test projects
  await supabase.from('projects').upsert([
    { id: 'proj_test_789', userId: 'user_test_456', name: 'Test Project' },
  ]);

  console.log('Test database seeded successfully');
}

seedTestDatabase();
```

---

## 7. Performance Testing

### Load Testing (Artillery)

**File:** `tests/load/workflow-creation.yml`

```yaml
config:
  target: https://staging.nexus.ai
  phases:
    - duration: 60
      arrivalRate: 10  # 10 requests per second
      name: Warm up
    - duration: 300
      arrivalRate: 50  # 50 requests per second
      name: Sustained load
  variables:
    authToken: ${{ secrets.TEST_AUTH_TOKEN }}

scenarios:
  - name: Create workflow
    flow:
      - post:
          url: /api/workflows
          headers:
            Authorization: Bearer {{ authToken }}
          json:
            projectId: proj_test_789
            userRequest: Load test workflow {{ $randomString() }}
      - think: 2  # Wait 2 seconds
```

**Run:** `artillery run tests/load/workflow-creation.yml`

**Success Criteria:**
- P95 latency < 3 seconds
- Error rate < 1%
- Throughput > 40 req/s

---

## 8. Security Testing

### SAST (Static Application Security Testing)

**Tool:** Semgrep (integrated in GitHub Actions)

```yaml
# .github/workflows/security-scan.yml
- name: Run Semgrep
  uses: returntocorp/semgrep-action@v1
  with:
    config: >-
      p/security-audit
      p/owasp-top-ten
      p/typescript
```

### DAST (Dynamic Application Security Testing)

**Tool:** OWASP ZAP

```bash
# Run ZAP against staging
docker run -v $(pwd):/zap/wrk:rw -t owasp/zap2docker-stable zap-baseline.py \
  -t https://staging.nexus.ai \
  -r zap-report.html
```

---

## Resolution of Blocker #8

**Original Blocker:** Cannot validate code quality without tests

**Status:** ✅ **RESOLVED**

**Deliverables:**
1. ✅ Test pyramid strategy (60% unit, 30% integration, 10% E2E)
2. ✅ Coverage requirements (80% minimum)
3. ✅ Unit test examples (Jest, Pytest, React Testing Library)
4. ✅ Integration test examples (Supertest, database tests)
5. ✅ E2E test examples (Playwright)
6. ✅ Performance testing (Artillery)
7. ✅ Security testing (Semgrep, ZAP)

**Implementation Readiness:** Testing can be implemented alongside each epic

**Next Steps:**
1. Set up Jest + React Testing Library in frontend
2. Set up Pytest in Python services
3. Configure Playwright for E2E tests
4. Add coverage checks to CI/CD pipeline
5. Create test fixtures and seed scripts
6. Run security scans weekly

---

## Testing Workflow per Epic

**Epic Development Flow:**
1. Write failing tests (TDD approach)
2. Implement feature
3. Verify tests pass
4. Check coverage (must be ≥80%)
5. Run integration tests
6. Run E2E tests (if user-facing feature)
7. Merge to main (triggers staging deployment)
8. Manual QA on staging (optional)
9. Deploy to production

**Quality Gates:**
- ❌ Cannot merge PR if tests fail
- ❌ Cannot merge PR if coverage < 80%
- ❌ Cannot deploy to production if E2E tests fail on staging

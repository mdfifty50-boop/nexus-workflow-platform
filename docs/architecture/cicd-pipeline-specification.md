# CI/CD Pipeline Specification - Nexus Platform

**Date:** 2026-01-06
**Author:** Mohammed
**Purpose:** Address Blocker #6 from Implementation Readiness Report - Define automated deployment pipeline

---

## Executive Summary

**CI/CD Strategy:** Automated GitHub Actions workflow for continuous integration and deployment

**Pipeline Stages:**
1. **Lint & Type Check** (30 seconds)
2. **Unit Tests** (2 minutes)
3. **Build Docker Images** (5 minutes)
4. **Integration Tests** (3 minutes)
5. **Deploy to Staging** (2 minutes, auto-deploy on main branch)
6. **E2E Tests on Staging** (5 minutes)
7. **Deploy to Production** (manual approval required)

**Total Pipeline Duration:** ~17 minutes (excluding manual approval)

**Environments:**
- **Development:** Local (Docker Compose)
- **Staging:** AWS (auto-deploy from `main` branch)
- **Production:** AWS (manual approval from `main` branch)

**Cost Impact:**
- GitHub Actions: ~2,000 minutes/month × $0.008/minute = **$16/month** (within free tier limit for private repos)
- Acceptable infrastructure cost

---

## Repository Structure

```
nexus/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Main CI/CD pipeline
│       ├── deploy-staging.yml        # Staging deployment
│       ├── deploy-production.yml     # Production deployment
│       └── security-scan.yml         # Weekly security scans
├── services/
│   ├── frontend/                    # Vite + React + TypeScript
│   ├── orchestration/               # Node.js + TypeScript (BFF)
│   ├── bmad/                        # Python + FastAPI (orchestration)
│   ├── execution/                   # Node.js + Python (code execution)
│   └── voice/                       # Python (meeting transcription)
├── infra/
│   ├── terraform/                   # Infrastructure as Code
│   └── docker/                      # Docker Compose configs
└── scripts/
    ├── dev-setup.sh                 # Local development setup
    └── run-tests.sh                 # Test runner
```

---

## Main CI/CD Pipeline

**File:** `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.12'

jobs:
  # ============================================================
  # Job 1: Lint & Type Check (Fast Feedback)
  # ============================================================
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install frontend dependencies
        working-directory: ./services/frontend
        run: npm ci

      - name: Lint frontend
        working-directory: ./services/frontend
        run: npm run lint

      - name: Type check frontend
        working-directory: ./services/frontend
        run: npx tsc --noEmit

      - name: Install orchestration dependencies
        working-directory: ./services/orchestration
        run: npm ci

      - name: Lint orchestration
        working-directory: ./services/orchestration
        run: npm run lint

      - name: Type check orchestration
        working-directory: ./services/orchestration
        run: npx tsc --noEmit

  # ============================================================
  # Job 2: Unit Tests (Frontend & Backend)
  # ============================================================
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10

    strategy:
      matrix:
        service: [frontend, orchestration, execution]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        working-directory: ./services/${{ matrix.service }}
        run: npm ci

      - name: Run unit tests
        working-directory: ./services/${{ matrix.service }}
        run: npm run test:unit -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./services/${{ matrix.service }}/coverage/coverage-final.json
          flags: ${{ matrix.service }}

  # ============================================================
  # Job 3: Python Unit Tests (BMAD & Voice Services)
  # ============================================================
  python-tests:
    name: Python Unit Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10

    strategy:
      matrix:
        service: [bmad, voice]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'

      - name: Install dependencies
        working-directory: ./services/${{ matrix.service }}
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov

      - name: Run pytest
        working-directory: ./services/${{ matrix.service }}
        run: pytest --cov=. --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./services/${{ matrix.service }}/coverage.xml
          flags: ${{ matrix.service }}

  # ============================================================
  # Job 4: Build Docker Images (Only on Main/Develop)
  # ============================================================
  build-docker-images:
    name: Build & Push Docker Images
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, unit-tests, python-tests]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    timeout-minutes: 15

    strategy:
      matrix:
        service: [frontend, orchestration, bmad, execution, voice]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./services/${{ matrix.service }}
          push: true
          tags: |
            ${{ env.ECR_REGISTRY }}/nexus-${{ matrix.service }}:${{ github.sha }}
            ${{ env.ECR_REGISTRY }}/nexus-${{ matrix.service }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ============================================================
  # Job 5: Deploy to Staging (Auto-deploy on Main)
  # ============================================================
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build-docker-images]
    if: github.ref == 'refs/heads/main'
    environment:
      name: staging
      url: https://staging.nexus.ai
    timeout-minutes: 10

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy frontend to Vercel (Staging)
        run: |
          npx vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }} \
            --scope=nexus-staging \
            --env=VITE_API_URL=https://api-staging.nexus.ai

      - name: Update ECS service (Orchestration)
        run: |
          aws ecs update-service \
            --cluster nexus-staging \
            --service orchestration \
            --force-new-deployment \
            --region ${{ env.AWS_REGION }}

      - name: Update ECS service (BMAD)
        run: |
          aws ecs update-service \
            --cluster nexus-staging \
            --service bmad \
            --force-new-deployment \
            --region ${{ env.AWS_REGION }}

      - name: Update ECS service (Voice)
        run: |
          aws ecs update-service \
            --cluster nexus-staging \
            --service voice \
            --force-new-deployment \
            --region ${{ env.AWS_REGION }}

      - name: Wait for deployment to stabilize
        run: |
          aws ecs wait services-stable \
            --cluster nexus-staging \
            --services orchestration bmad voice \
            --region ${{ env.AWS_REGION }}

      - name: Post deployment notification to Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Staging deployment complete: ${{ github.sha }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Staging Deployment Complete* :rocket:\n\nCommit: `${{ github.sha }}`\nBranch: `${{ github.ref_name }}`\nAuthor: ${{ github.actor }}\n\n<https://staging.nexus.ai|View Staging>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  # ============================================================
  # Job 6: E2E Tests on Staging
  # ============================================================
  e2e-tests:
    name: E2E Tests (Staging)
    runs-on: ubuntu-latest
    needs: [deploy-staging]
    if: github.ref == 'refs/heads/main'
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install Playwright
        run: |
          cd services/frontend
          npm ci
          npx playwright install --with-deps

      - name: Run Playwright E2E tests
        run: |
          cd services/frontend
          npx playwright test
        env:
          BASE_URL: https://staging.nexus.ai
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: services/frontend/playwright-report/
          retention-days: 30

  # ============================================================
  # Job 7: Deploy to Production (Manual Approval Required)
  # ============================================================
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [e2e-tests]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://nexus.ai
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy frontend to Vercel (Production)
        run: |
          npx vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }} \
            --scope=nexus-production \
            --env=VITE_API_URL=https://api.nexus.ai

      - name: Blue/Green Deployment - Create new task definition
        run: |
          # Get current task definition
          TASK_DEF=$(aws ecs describe-task-definition \
            --task-definition nexus-orchestration-prod \
            --region ${{ env.AWS_REGION }})

          # Update image tag to new version
          NEW_TASK_DEF=$(echo $TASK_DEF | jq --arg IMAGE "${{ env.ECR_REGISTRY }}/nexus-orchestration:${{ github.sha }}" \
            '.taskDefinition | .containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')

          # Register new task definition
          NEW_TASK_INFO=$(aws ecs register-task-definition \
            --cli-input-json "$NEW_TASK_DEF" \
            --region ${{ env.AWS_REGION }})

          NEW_REVISION=$(echo $NEW_TASK_INFO | jq -r '.taskDefinition.revision')
          echo "NEW_REVISION=$NEW_REVISION" >> $GITHUB_ENV

      - name: Update ECS service (Blue/Green)
        run: |
          aws ecs update-service \
            --cluster nexus-production \
            --service orchestration \
            --task-definition nexus-orchestration-prod:${{ env.NEW_REVISION }} \
            --force-new-deployment \
            --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100" \
            --region ${{ env.AWS_REGION }}

      - name: Wait for production deployment
        run: |
          aws ecs wait services-stable \
            --cluster nexus-production \
            --services orchestration \
            --region ${{ env.AWS_REGION }}

      - name: Run smoke tests
        run: |
          curl -f https://api.nexus.ai/health || exit 1
          curl -f https://nexus.ai || exit 1

      - name: Post production deployment notification
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚀 PRODUCTION DEPLOYMENT COMPLETE",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Deployment Complete* :rocket:\n\nCommit: `${{ github.sha }}`\nBranch: `${{ github.ref_name }}`\nDeployed by: ${{ github.actor }}\n\n<https://nexus.ai|View Production>"
                  }
                },
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Monitoring*\n• <https://console.aws.amazon.com/cloudwatch|CloudWatch>\n• <https://sentry.io/nexus|Sentry>\n• <https://status.nexus.ai|Status Page>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release v${{ github.run_number }}
          body: |
            Production deployment of commit ${{ github.sha }}

            **Changes:**
            ${{ github.event.head_commit.message }}

            **Deployed Services:**
            - Frontend (Vercel)
            - Orchestration Service (ECS)
            - BMAD Service (ECS)
            - Voice Service (ECS)

            **Monitoring:**
            - [CloudWatch](https://console.aws.amazon.com/cloudwatch)
            - [Sentry](https://sentry.io/nexus)
          draft: false
          prerelease: false
```

---

## Security Scanning Workflow

**File:** `.github/workflows/security-scan.yml`

```yaml
name: Security Scan

on:
  schedule:
    - cron: '0 2 * * 0' # Every Sunday at 2 AM UTC
  workflow_dispatch:

jobs:
  dependency-audit:
    name: Dependency Vulnerability Scan
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: npm audit (Frontend)
        working-directory: ./services/frontend
        run: npm audit --audit-level=high

      - name: npm audit (Orchestration)
        working-directory: ./services/orchestration
        run: npm audit --audit-level=high

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: pip-audit (BMAD)
        working-directory: ./services/bmad
        run: |
          pip install pip-audit
          pip-audit -r requirements.txt

      - name: pip-audit (Voice)
        working-directory: ./services/voice
        run: |
          pip install pip-audit
          pip-audit -r requirements.txt

  sast-scan:
    name: SAST (Static Application Security Testing)
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/typescript
            p/python

  docker-scan:
    name: Docker Image Security Scan
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t nexus-orchestration:test ./services/orchestration

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'nexus-orchestration:test'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

---

## Environment Configuration

### GitHub Secrets

**Required Secrets:**

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key (staging) | AKIA... |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (staging) | wJalr... |
| `AWS_ACCESS_KEY_ID_PROD` | AWS access key (production) | AKIA... |
| `AWS_SECRET_ACCESS_KEY_PROD` | AWS secret key (production) | wJalr... |
| `AWS_ACCOUNT_ID` | AWS account ID | 123456789012 |
| `VERCEL_TOKEN` | Vercel deployment token | vercel_... |
| `SLACK_WEBHOOK_URL` | Slack notifications webhook | https://hooks.slack.com/... |
| `TEST_USER_EMAIL` | E2E test user email | test@nexus.ai |
| `TEST_USER_PASSWORD` | E2E test user password | TestPass123! |
| `CODECOV_TOKEN` | Codecov upload token | abc123... |

---

## Branch Protection Rules

### Main Branch Protection

**Rules:**
- ✅ Require pull request reviews (1 approver minimum)
- ✅ Require status checks to pass:
  - `lint-and-typecheck`
  - `unit-tests (frontend)`
  - `unit-tests (orchestration)`
  - `python-tests (bmad)`
- ✅ Require branches to be up to date before merging
- ✅ Require signed commits
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ❌ Allow force pushes (disabled)
- ❌ Allow deletions (disabled)

---

## Deployment Environments

### Staging Environment

**URL:** https://staging.nexus.ai
**Auto-deploy:** Yes (on push to `main` branch)
**Purpose:** Pre-production testing, QA validation
**AWS Resources:**
- ECS Cluster: `nexus-staging`
- RDS Database: `nexus-staging-db`
- S3 Bucket: `nexus-staging-assets`

**Environment Variables:**
- `NODE_ENV=staging`
- `DATABASE_URL=postgresql://...` (Supabase staging)
- `REDIS_URL=redis://...` (Upstash staging)
- `CLAUDE_API_KEY=...` (separate key for staging)

---

### Production Environment

**URL:** https://nexus.ai
**Auto-deploy:** No (manual approval required)
**Purpose:** Live production service
**AWS Resources:**
- ECS Cluster: `nexus-production`
- RDS Database: `nexus-production-db`
- S3 Bucket: `nexus-production-assets`

**Environment Variables:**
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://...` (Supabase production)
- `REDIS_URL=redis://...` (Upstash production)
- `CLAUDE_API_KEY=...` (production key with higher rate limits)

**Manual Approval Process:**
1. E2E tests pass on staging
2. Engineering lead reviews deployment
3. Click "Approve" in GitHub Actions UI
4. Blue/Green deployment to production
5. Smoke tests run automatically
6. Slack notification sent to #deployments channel

---

## Rollback Strategy

### Automatic Rollback Triggers

1. **Health check failure** (3 consecutive failures)
2. **Error rate spike** (>5% error rate for 5 minutes)
3. **Response time degradation** (P95 latency >3 seconds)

### Manual Rollback Process

```bash
# 1. Identify previous stable version
aws ecs list-task-definitions --family-prefix nexus-orchestration-prod

# 2. Revert to previous task definition
aws ecs update-service \
  --cluster nexus-production \
  --service orchestration \
  --task-definition nexus-orchestration-prod:PREVIOUS_REVISION

# 3. Verify rollback
aws ecs describe-services --cluster nexus-production --services orchestration

# 4. Notify team
slack-cli send "#deployments" "🔄 Production rollback to v$PREVIOUS_REVISION initiated"
```

---

## Monitoring & Alerting

### CloudWatch Alarms

1. **High Error Rate**
   - Metric: ErrorCount > 50 in 5 minutes
   - Action: SNS → Slack #alerts

2. **High Latency**
   - Metric: P95 latency > 3 seconds
   - Action: SNS → PagerDuty (on-call engineer)

3. **Service Unhealthy**
   - Metric: HealthyHostCount < 2
   - Action: Auto-scale ECS tasks, alert team

4. **High Token Costs**
   - Metric: Daily Claude API cost > $1,000
   - Action: Slack #alerts + email to finance

### Sentry Integration

```javascript
// services/frontend/src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event) {
    // Don't send error if user is in development
    if (import.meta.env.MODE === 'development') {
      return null;
    }
    return event;
  },
});
```

---

## Cost Analysis

### GitHub Actions Minutes

| Job | Duration | Runs per Day | Monthly Minutes |
|-----|----------|--------------|-----------------|
| Lint & Type Check | 1 min | 10 | 300 |
| Unit Tests | 3 min | 10 | 900 |
| Build Docker | 10 min | 5 | 1,500 |
| E2E Tests | 5 min | 5 | 750 |
| Deploy | 5 min | 5 | 750 |

**Total Monthly Minutes:** ~4,200 minutes
**Cost:** $0 (within 3,000 free minutes for private repos with GitHub Team)

### AWS Costs (CI/CD Infrastructure)

| Resource | Cost | Frequency | Monthly Total |
|----------|------|-----------|---------------|
| ECR Storage | $0.10/GB | 5 GB images | $0.50 |
| ECS Task Runs | $0.00 | Covered by Fargate | $0.00 |
| Data Transfer | $0.09/GB | 10 GB/month | $0.90 |

**Total AWS CI/CD Cost:** ~$1.40/month (negligible)

---

## Resolution of Blocker #6

**Original Blocker:** Cannot deploy code without automation

**Status:** ✅ **RESOLVED**

**Deliverables:**
1. ✅ **Main CI/CD pipeline** (lint, test, build, deploy, E2E)
2. ✅ **Security scanning workflow** (dependency audit, SAST, Docker scan)
3. ✅ **Branch protection rules** (PR reviews, status checks)
4. ✅ **Environment configuration** (staging auto-deploy, production manual)
5. ✅ **Rollback strategy** (automatic triggers + manual process)
6. ✅ **Monitoring integration** (CloudWatch, Sentry)

**Implementation Readiness:** Story 1.8 (CI/CD setup) can now proceed

**Next Steps:**
1. Create `.github/workflows/` directory
2. Implement `ci.yml` pipeline
3. Configure GitHub secrets
4. Set up branch protection rules
5. Deploy staging environment to AWS
6. Test end-to-end pipeline with sample deployment
7. Configure Slack webhooks for notifications

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS Deployment Guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-types.html)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Playwright E2E Testing](https://playwright.dev/docs/intro)

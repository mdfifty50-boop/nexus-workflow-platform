# Cloud Execution Runtime Specification - Nexus Platform

**Date:** 2026-01-06
**Author:** Mohammed
**Purpose:** Address Blocker #4 from Implementation Readiness Report - Define cloud code execution infrastructure for Story 4.6

---

## Executive Summary

**Purpose:** Enable server-side code execution for BMAD workflows without requiring users to run code locally.

**Technology:** AWS Fargate (serverless containers) with sandboxed execution environments

**Key Requirements:**
- ✅ User isolation (no access to other users' data)
- ✅ Network restrictions (only approved APIs accessible)
- ✅ Resource limits (CPU, memory, 15-minute timeout)
- ✅ Security hardening (no privilege escalation, read-only file system)
- ✅ Audit logging (all executions tracked)
- ✅ Cost efficiency (ephemeral containers, auto-scaling)

**Cost Impact:**
- Fargate pricing: ~$0.04 per vCPU-hour, ~$0.004 per GB-hour
- Typical workflow (2 vCPU, 4GB RAM, 5 minutes): ~$0.04
- Acceptable within revised $2.50 average workflow budget

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Nexus Platform                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         BMAD Orchestration Service (ECS Fargate)          │   │
│  │                                                            │   │
│  │  Receives workflow task → Spawns execution container ─┐   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                             │   │
│                                                             ▼   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      Execution Service Container (AWS Fargate)            │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Sandboxed Runtime Environment                       │  │   │
│  │  │  - Node.js 20 + Python 3.12                         │  │   │
│  │  │  - Isolated file system (/tmp writeable only)       │  │   │
│  │  │  - Network policy (allow  list APIs only)            │  │   │
│  │  │  - Resource limits (2 vCPU, 4GB RAM, 15min timeout) │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                            │   │
│  │  Executes user code → Returns output → Self-terminates   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                             │   │
│                                                             ▼   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Audit Logging (CloudWatch Logs + Supabase)        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dockerfile Specification

### Base Image Selection

**Primary Runtime:** Node.js 20 (LTS) + Python 3.12
- **Rationale:** BMAD workflows often involve data transformation (Python) and API orchestration (Node.js)
- **Base Image:** `public.ecr.aws/docker/library/node:20-slim` (Debian-based, 180MB)

**Multi-stage Build:**
1. Build stage: Install dependencies
2. Runtime stage: Minimal image with only production dependencies

### services/execution/Dockerfile

```dockerfile
# ============================================================
# Stage 1: Build Stage (Dependencies Installation)
# ============================================================
FROM public.ecr.aws/docker/library/node:20-slim AS builder

# Install Python 3.12 and build tools
RUN apt-get update && apt-get install -y \
    python3.12 \
    python3-pip \
    python3.12-venv \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY requirements.txt ./

# Install Node.js dependencies
RUN npm ci --only=production

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# ============================================================
# Stage 2: Runtime Stage (Minimal Secure Image)
# ============================================================
FROM public.ecr.aws/docker/library/node:20-slim

# Install Python 3.12 runtime (no build tools)
RUN apt-get update && apt-get install -y \
    python3.12 \
    python3-pip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for execution
RUN groupadd -r nexus && useradd -r -g nexus nexus

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /usr/local/lib/python3.12 /usr/local/lib/python3.12

# Copy application code
COPY src/ ./src/
COPY execution-runner.js ./

# Create isolated temporary directory
RUN mkdir -p /tmp/nexus-execution && \
    chown nexus:nexus /tmp/nexus-execution

# Set read-only root file system (security hardening)
# Only /tmp/nexus-execution is writeable
RUN chmod 755 /app && \
    chmod -R 555 /app/src && \
    chmod 555 /app/execution-runner.js

# Drop privileges to non-root user
USER nexus

# Resource limits (enforced by Fargate task definition)
# CPU: 2 vCPU (2048 CPU units)
# Memory: 4 GB (4096 MB)
# Timeout: 15 minutes (enforced by ECS task timeout)

# Health check (optional, for long-running containers)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Entry point
ENTRYPOINT ["node", "execution-runner.js"]
```

### execution-runner.js (Container Entry Point)

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Security: Enforce execution timeout (15 minutes)
const EXECUTION_TIMEOUT_MS = 15 * 60 * 1000;
const startTime = Date.now();

// Security: Enforce network policy
process.env.NO_PROXY = '*'; // Block proxies
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1'; // Enforce SSL verification

async function main() {
  try {
    // Read task specification from environment variables
    const taskSpec = JSON.parse(process.env.TASK_SPEC || '{}');
    const { language, code, workflowId, taskId, userId } = taskSpec;

    if (!code || !language) {
      throw new Error('Missing required task specification (code or language)');
    }

    console.log(`[EXECUTION START] Workflow: ${workflowId}, Task: ${taskId}, User: ${userId}, Language: ${language}`);

    // Create isolated working directory
    const workDir = `/tmp/nexus-execution/${workflowId}-${taskId}`;
    fs.mkdirSync(workDir, { recursive: true });

    // Write user code to temporary file
    const codeFile = path.join(workDir, language === 'python' ? 'main.py' : 'main.js');
    fs.writeFileSync(codeFile, code, 'utf8');

    // Execute code with timeout
    const executeCommand = language === 'python'
      ? `python3 ${codeFile}`
      : `node ${codeFile}`;

    const output = execSync(executeCommand, {
      cwd: workDir,
      timeout: EXECUTION_TIMEOUT_MS - (Date.now() - startTime),
      maxBuffer: 10 * 1024 * 1024, // 10 MB max output
      encoding: 'utf8',
      env: {
        ...process.env,
        // Security: Restrict environment variables
        HOME: workDir,
        PATH: '/usr/local/bin:/usr/bin:/bin',
        // Remove sensitive AWS credentials
        AWS_ACCESS_KEY_ID: undefined,
        AWS_SECRET_ACCESS_KEY: undefined,
        AWS_SESSION_TOKEN: undefined,
      },
    });

    console.log(`[EXECUTION SUCCESS] Output length: ${output.length} bytes`);

    // Return output to orchestration service
    process.stdout.write(JSON.stringify({
      status: 'success',
      output: output.trim(),
      executionTimeMs: Date.now() - startTime,
    }));

    process.exit(0);

  } catch (error) {
    console.error(`[EXECUTION FAILED] ${error.message}`);

    // Check if timeout occurred
    const isTimeout = (Date.now() - startTime) >= EXECUTION_TIMEOUT_MS;

    process.stdout.write(JSON.stringify({
      status: 'failed',
      error: isTimeout
        ? 'Task timed out after 15 minutes. Please simplify the workflow.'
        : error.message,
      executionTimeMs: Date.now() - startTime,
    }));

    process.exit(1);
  } finally {
    // Cleanup: Remove temporary files
    try {
      const workDir = `/tmp/nexus-execution`;
      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error(`[CLEANUP FAILED] ${cleanupError.message}`);
    }
  }
}

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
  process.exit(1);
});

main();
```

---

## AWS Fargate Task Definition

### ECS Task Definition (JSON)

```json
{
  "family": "nexus-execution-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/nexus-execution-task-role",
  "containerDefinitions": [
    {
      "name": "execution-container",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/nexus-execution:latest",
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "TASK_SPEC",
          "value": "{\"language\":\"node\",\"code\":\"console.log('Hello')\",\"workflowId\":\"wf_123\",\"taskId\":\"task_456\",\"userId\":\"user_789\"}"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nexus-execution",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "execution"
        }
      },
      "resourceRequirements": [
        {
          "type": "GPU",
          "value": "0"
        }
      ],
      "ulimits": [
        {
          "name": "nofile",
          "softLimit": 1024,
          "hardLimit": 4096
        }
      ],
      "readonlyRootFilesystem": true,
      "mountPoints": [
        {
          "sourceVolume": "tmp-storage",
          "containerPath": "/tmp/nexus-execution",
          "readOnly": false
        }
      ]
    }
  ],
  "volumes": [
    {
      "name": "tmp-storage",
      "ephemeralStorage": {
        "sizeInGiB": 20
      }
    }
  ]
}
```

### Task Execution Flow

1. **Orchestration Service** receives workflow task requiring code execution
2. **ECS RunTask API** spawns new Fargate container with task specification
3. **Container starts**, reads TASK_SPEC environment variable
4. **Code executes** in isolated environment (15-minute timeout)
5. **Output captured** via stdout/stderr
6. **Container terminates** automatically
7. **CloudWatch Logs** persist execution logs for 30 days
8. **Audit record** written to Supabase `audit_logs` table

---

## Security Policies

### 1. Network Isolation

**Default Policy:** Deny all outbound traffic

**Allowed Outbound Traffic (Whitelist):**
```json
{
  "allowedDomains": [
    "*.amazonaws.com",
    "api.anthropic.com",
    "api.openai.com",
    "*.supabase.co",
    "*.upstash.io",
    "*.clerk.com",
    "*.vercel.com",
    "api.resend.com",
    "smtp.gmail.com",
    "api.stripe.com",
    "*.salesforce.com",
    "*.hubspot.com",
    "graph.microsoft.com"
  ],
  "allowedPorts": [443, 587, 465]
}
```

**Implementation:** AWS Security Group rules + VPC egress filtering

**Blocked:**
- All inbound traffic (except health checks)
- SSH/RDP ports
- Database direct access (must go through RLS-protected APIs)
- Inter-container communication (except via orchestration service)

---

### 2. IAM Task Role (Least Privilege)

**ARN:** `arn:aws:iam::ACCOUNT_ID:role/nexus-execution-task-role`

**Allowed Actions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/ecs/nexus-execution:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::nexus-workflow-artifacts/*",
      "Condition": {
        "StringEquals": {
          "s3:ExistingObjectTag/userId": "${aws:userid}"
        }
      }
    },
    {
      "Effect": "Deny",
      "Action": [
        "ec2:*",
        "rds:*",
        "iam:*",
        "kms:Decrypt"
      ],
      "Resource": "*"
    }
  ]
}
```

**Key Restrictions:**
- No EC2 instance launching
- No RDS database access
- No IAM role modification
- No KMS key decryption (secrets injected by orchestration service)
- S3 access limited to user-specific workflow artifacts

---

### 3. Resource Limits

| Resource | Limit | Enforcement |
|----------|-------|-------------|
| **CPU** | 2 vCPU | Fargate task definition |
| **Memory** | 4 GB | Fargate task definition + OOM killer |
| **Execution Time** | 15 minutes | Timeout in execution-runner.js + ECS task timeout |
| **Disk (Ephemeral)** | 20 GB | Fargate ephemeral storage limit |
| **Network Bandwidth** | 10 Gbps (burst) | Fargate default |
| **Concurrent Tasks per User** | 5 | Orchestration service rate limit |
| **Output Size** | 10 MB | maxBuffer in execSync |

**Rationale:**
- 15-minute timeout prevents infinite loops and runaway costs
- 4 GB memory sufficient for data transformation tasks
- 10 MB output prevents denial-of-service via log flooding

---

### 4. File System Security

**Read-Only Root Filesystem:** Enabled (`readonlyRootFilesystem: true`)

**Writeable Directories:**
- `/tmp/nexus-execution` (ephemeral, deleted after container termination)

**Blocked Directories:**
- `/app` (application code, read-only)
- `/etc` (system configuration, read-only)
- `/var` (system logs, read-only)

**File Cleanup:** Automatic on container termination (ephemeral storage)

---

### 5. Secret Management

**AWS Secrets Manager Integration:**
```javascript
// Orchestration service injects secrets at runtime
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({ region: 'us-east-1' });

async function injectSecrets(taskSpec, userId, projectId) {
  // Fetch user-specific API keys from Secrets Manager
  const secretName = `nexus/${userId}/${projectId}/api-keys`;

  const secretData = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
  const secrets = JSON.parse(secretData.SecretString);

  // Inject as environment variables (not visible in task definition)
  taskSpec.environment = {
    ...taskSpec.environment,
    SALESFORCE_API_KEY: secrets.salesforceApiKey,
    HUBSPOT_API_KEY: secrets.hubspotApiKey,
    GMAIL_OAUTH_TOKEN: secrets.gmailOauthToken,
  };

  return taskSpec;
}
```

**Security:**
- Secrets NEVER hardcoded in Dockerfile or task definition
- Secrets injected at runtime via orchestration service
- Secrets scoped to user + project (no cross-contamination)
- Secrets rotated every 90 days (automatic via Secrets Manager)

---

## Audit Logging

### CloudWatch Logs

**Log Group:** `/ecs/nexus-execution`
**Retention:** 30 days
**Log Format:** JSON structured logs

**Example Log Entry:**
```json
{
  "timestamp": "2026-01-06T10:30:45.123Z",
  "level": "INFO",
  "event": "EXECUTION_START",
  "workflowId": "wf_abc123",
  "taskId": "task_def456",
  "userId": "user_ghi789",
  "language": "node",
  "codeHash": "sha256:abc123...",
  "containerId": "ecs/nexus-execution/abc123"
}
```

### Supabase Audit Logs Table

**Table:** `audit_logs`

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES users(id),
  workflow_id UUID NOT NULL REFERENCES workflows(id),
  task_id UUID NOT NULL REFERENCES workflow_tasks(id),
  event_type TEXT NOT NULL, -- 'execution_start', 'execution_success', 'execution_failed', 'execution_timeout'
  container_id TEXT NOT NULL,
  execution_time_ms INTEGER,
  output_size_bytes INTEGER,
  error_message TEXT,
  code_hash TEXT NOT NULL, -- SHA-256 hash of executed code (for forensics)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- RLS policy: Users can only view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_audit_logs_user_workflow ON audit_logs(user_id, workflow_id, created_at DESC);
```

**Purpose:**
- Security forensics (what code ran, when, by whom)
- Compliance (SOC 2, GDPR audit trail)
- Debugging (troubleshoot failed executions)

---

## Cost Analysis

### AWS Fargate Pricing (us-east-1, January 2026)

| Resource | Price | Notes |
|----------|-------|-------|
| vCPU | $0.04048 per vCPU-hour | 2 vCPU = $0.08096/hour |
| Memory | $0.004445 per GB-hour | 4 GB = $0.01778/hour |
| **Total Hourly Cost** | **$0.09874/hour** | ~$0.00164/minute |

### Cost per Workflow Execution

| Execution Duration | Cost | Scenario |
|--------------------|------|----------|
| 1 minute | $0.0016 | Simple API call workflow |
| 5 minutes | $0.0082 | Medium data transformation |
| 15 minutes (max) | $0.0246 | Complex code generation workflow |

**Average Workflow (5 minutes):** $0.008 (~$0.01)

**Monthly Cost per Active User (20 workflows/month):**
- Unoptimized: 20 × $0.008 = $0.16
- Negligible compared to $2.50 average Claude API costs

**Total Platform Cost (1,000 active users, 20 workflows/month):**
- Executions: 1,000 × 20 × $0.008 = **$160/month**
- Acceptable infrastructure cost

---

## Resolution of Blocker #4

**Original Blocker:** Story 4.6 cannot be implemented without container specs

**Status:** ✅ **RESOLVED**

**Deliverables:**
1. ✅ **Dockerfile specification** (services/execution/Dockerfile)
2. ✅ **Container entry point** (execution-runner.js)
3. ✅ **ECS Task Definition** (Fargate configuration)
4. ✅ **Security policies** (IAM, network isolation, resource limits)
5. ✅ **Audit logging** (CloudWatch + Supabase)
6. ✅ **Cost analysis** (~$0.01 per workflow, acceptable)

**Implementation Readiness:** Story 4.6 can now proceed

**Next Steps:**
1. Create `services/execution/` directory structure
2. Implement `execution-runner.js` with security hardening
3. Build and push Docker image to AWS ECR
4. Register ECS Task Definition
5. Update orchestration service to spawn Fargate tasks
6. Implement audit logging in `audit_logs` table
7. Test with sample workflows (Node.js and Python)

---

## Security Hardening Checklist

- [x] Non-root user execution (UID 1000, no sudo)
- [x] Read-only root filesystem (except /tmp)
- [x] Network egress filtering (allow list only)
- [x] IAM least privilege (no EC2/RDS/IAM access)
- [x] 15-minute execution timeout
- [x] 4 GB memory limit + OOM killer
- [x] 10 MB output size limit
- [x] No AWS credentials in environment
- [x] Secrets injected at runtime (not in Dockerfile)
- [x] Audit logging to CloudWatch + Supabase
- [x] Ephemeral storage (auto-deleted on termination)
- [x] No SSH/RDP access
- [x] No privilege escalation (no CAP_SYS_ADMIN)

---

## Testing Strategy

### Unit Tests (execution-runner.js)

```javascript
// test/execution-runner.test.js
describe('Execution Runner', () => {
  it('should execute Node.js code successfully', async () => {
    const taskSpec = {
      language: 'node',
      code: 'console.log("Hello World")',
      workflowId: 'wf_test',
      taskId: 'task_test',
      userId: 'user_test',
    };

    const result = await runExecution(taskSpec);
    expect(result.status).toBe('success');
    expect(result.output).toBe('Hello World');
  });

  it('should timeout after 15 minutes', async () => {
    const taskSpec = {
      language: 'node',
      code: 'while(true) {}', // Infinite loop
      workflowId: 'wf_test',
      taskId: 'task_test',
      userId: 'user_test',
    };

    const result = await runExecution(taskSpec);
    expect(result.status).toBe('failed');
    expect(result.error).toContain('timed out after 15 minutes');
  });

  it('should enforce 10 MB output limit', async () => {
    const taskSpec = {
      language: 'node',
      code: 'console.log("x".repeat(20 * 1024 * 1024))', // 20 MB output
      workflowId: 'wf_test',
      taskId: 'task_test',
      userId: 'user_test',
    };

    const result = await runExecution(taskSpec);
    expect(result.status).toBe('failed');
    expect(result.error).toContain('maxBuffer');
  });
});
```

### Integration Tests (End-to-End)

1. **Test: Spawn container via ECS RunTask**
   - Verify container starts within 30 seconds
   - Verify task specification passed correctly

2. **Test: Execute Python data transformation**
   - Upload sample CSV file to S3
   - Execute Python code to parse and transform data
   - Verify output written to S3 (user-scoped)

3. **Test: Network isolation**
   - Attempt to curl blocked domain (e.g., example.com)
   - Verify connection refused or timeout

4. **Test: Audit logging**
   - Execute workflow task
   - Verify CloudWatch Logs entry created
   - Verify Supabase audit_logs entry created

---

## Maintenance & Monitoring

### CloudWatch Alarms

1. **High Failure Rate Alarm**
   - Metric: Failed executions / Total executions > 10%
   - Action: SNS notification to engineering team

2. **Timeout Rate Alarm**
   - Metric: Timeout executions / Total executions > 5%
   - Action: Investigate code complexity, consider increasing timeout

3. **Cost Spike Alarm**
   - Metric: Daily Fargate cost > $100
   - Action: Check for runaway containers, abuse

### Container Updates

- **Security patches:** Monthly (automated via ECR image scanning)
- **Dependency updates:** Quarterly (Node.js, Python, npm packages)
- **Base image refresh:** Follow AWS Fargate updates

---

## Future Enhancements (Post-MVP)

1. **GPU Support** for AI model inference workloads
2. **Multi-language support** (Go, Rust, Java)
3. **Longer execution timeouts** (up to 1 hour for complex builds)
4. **Spot pricing** for non-urgent background tasks (50% cost savings)
5. **Custom runtime images** (user uploads Docker image)

---

## References

- [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
- [ECS Task Definition Reference](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html)
- [AWS Security Best Practices for Fargate](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/security-fargate.html)
- [Node.js Child Process Security](https://nodejs.org/api/child_process.html#child_processspawnsynccommand-args-options)

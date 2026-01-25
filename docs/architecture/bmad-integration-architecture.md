# BMAD Integration Architecture - Nexus Platform

**Date:** 2026-01-06
**Author:** Mohammed
**Purpose:** Address Blocker #5 from Implementation Readiness Report - Define how BMAD Method integrates with Nexus platform

---

## Executive Summary

**BMAD Method** (Breakthrough Method for Agile AI-Driven Development) is the **orchestration engine** powering Nexus workflows. This document defines how BMAD integrates into the Nexus architecture as a **swappable backend service** via adapter pattern.

**Key Architectural Decisions:**
- ✅ BMAD runs as separate microservice (not embedded in monolith)
- ✅ Adapter pattern enables future orchestration swaps (CrewAI, LangGraph, custom)
- ✅ Communication via REST API + Server-Sent Events (SSE) for real-time updates
- ✅ Stateless BMAD service (state stored in Supabase, not in-memory)
- ✅ BMAD deployed as AWS ECS Fargate task (auto-scaling, isolated)

**Integration Points:**
1. **Chat Interface** → Orchestration Service → **BMAD API** (workflow planning)
2. **BMAD Director** → Supabase (workflow state persistence)
3. **BMAD Supervisor** → Execution Service (code execution via Fargate)
4. **BMAD Agents** → External APIs (Salesforce, Gmail, etc.)
5. **BMAD Progress** → SSE Stream → Frontend (real-time visualization)

**Cost Impact:**
- BMAD compute: 2 vCPU, 4GB RAM, avg 5-min execution = $0.04 per workflow
- Minimal compared to Claude API costs ($2.00 average)

---

## BMAD Method Overview

### What is BMAD?

**BMAD** is a multi-agent orchestration framework that coordinates specialized AI agents through structured workflows:

1. **Director Agent** - Plans workflow strategy, breaks down user requests
2. **Supervisor Agent** - Manages task execution, delegates to specialists
3. **Specialized Agents** - Execute specific tasks (code gen, API calls, data transform)
4. **QA Agent** - Reviews outputs, ensures quality gates

### BMAD Workflow Lifecycle

```
User Request
    ↓
┌─────────────────────────────────────┐
│ 1. PLANNING PHASE                    │
│    Director analyzes request         │
│    Creates workflow plan             │
│    Estimates token costs             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. ORCHESTRATING PHASE               │
│    Supervisor breaks down tasks      │
│    Assigns to specialist agents      │
│    Sets up checkpoints               │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. BUILDING PHASE                    │
│    Agents execute tasks              │
│    Call external APIs                │
│    Generate code (Fargate execution) │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 4. REVIEWING PHASE                   │
│    QA Agent validates outputs        │
│    Checks acceptance criteria        │
│    Identifies errors/improvements    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 5. COMPLETED PHASE                   │
│    Final results delivered           │
│    Audit logs written                │
│    User notified                     │
└─────────────────────────────────────┘
```

---

## Architecture Integration

### High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Nexus Platform (Frontend)                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │  Chat UI       │  │  Workflow      │  │  Token         │         │
│  │  (React)       │  │  Visualizer    │  │  Dashboard     │         │
│  └────────────────┘  └────────────────┘  └────────────────┘         │
│         │                     │                    │                  │
│         └─────────────────────┼────────────────────┘                  │
│                               │ SSE Stream (real-time updates)        │
└───────────────────────────────┼───────────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   Backend Services (Node.js + TypeScript)             │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │          Orchestration Service (BFF - Backend for Frontend)     │  │
│  │  • Handles user requests                                        │  │
│  │  • Routes to BMAD via adapter                                   │  │
│  │  • Streams SSE updates to frontend                              │  │
│  │  • Persists state to Supabase                                   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                │                                       │
│                                ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │          BMAD Adapter (Interface Layer)                         │  │
│  │  • Abstracts BMAD implementation details                        │  │
│  │  • Enables orchestration engine swapping                        │  │
│  │  • Translates Nexus domain → BMAD domain                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ REST API
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│           BMAD Service (Python - AWS ECS Fargate)                     │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  BMAD Orchestration Engine                                      │  │
│  │  • Director Agent (Claude Opus for planning)                    │  │
│  │  • Supervisor Agent (Claude Sonnet for task management)         │  │
│  │  • Specialist Agents (Haiku/Sonnet for execution)               │  │
│  │  • State management via Supabase                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│         │                    │                    │                   │
│         ▼                    ▼                    ▼                   │
│   Supabase DB         Execution Service    External APIs             │
│   (workflow state)    (Fargate containers) (Salesforce, Gmail, etc.)  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## BMAD Service Specification

### Deployment Architecture

**Technology:** Python 3.12 + FastAPI
**Hosting:** AWS ECS Fargate (serverless containers)
**Scaling:** Auto-scaling based on workflow queue depth
**Resource Allocation:**
- CPU: 2 vCPU
- Memory: 4 GB
- Timeout: 30 minutes per workflow (vs 15min for Execution Service)

### Docker Configuration

```dockerfile
# services/bmad/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy BMAD source code
COPY bmad/ ./bmad/
COPY api.py .

# Non-root user
RUN useradd -r -u 1000 nexus
USER nexus

# Expose API port
EXPOSE 8080

# Entry point
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8080"]
```

### API Specification

#### POST /workflows

**Description:** Start a new BMAD workflow

**Request:**
```json
{
  "workflowId": "wf_abc123",
  "userId": "user_xyz789",
  "projectId": "proj_def456",
  "userRequest": "Organize my Salesforce leads from last week's conference",
  "context": {
    "previousConversation": [...],
    "integrations": ["salesforce", "gmail"],
    "userPreferences": {
      "communicationStyle": "concise",
      "language": "en"
    }
  },
  "budget": {
    "maxTokens": 500000,
    "maxCostUSD": 10.00
  }
}
```

**Response:**
```json
{
  "workflowId": "wf_abc123",
  "status": "planning",
  "estimatedTokens": 150000,
  "estimatedCostUSD": 2.70,
  "estimatedDurationMinutes": 5,
  "sseStreamUrl": "https://api.nexus.ai/sse/wf_abc123"
}
```

---

#### GET /workflows/{workflowId}/status

**Description:** Get current workflow status

**Response:**
```json
{
  "workflowId": "wf_abc123",
  "status": "building",
  "phase": "BUILDING",
  "currentTask": "Fetching Salesforce leads",
  "progress": {
    "completedTasks": 3,
    "totalTasks": 8,
    "percentComplete": 37.5
  },
  "tokenUsage": {
    "inputTokens": 45000,
    "outputTokens": 18000,
    "totalCost": 1.05
  },
  "checkpoints": [
    {
      "name": "planning_complete",
      "timestamp": "2026-01-06T10:30:15Z",
      "state": { ... }
    },
    {
      "name": "salesforce_leads_fetched",
      "timestamp": "2026-01-06T10:31:45Z",
      "state": { ... }
    }
  ]
}
```

---

#### POST /workflows/{workflowId}/cancel

**Description:** Cancel a running workflow

**Response:**
```json
{
  "workflowId": "wf_abc123",
  "status": "cancelled",
  "message": "Workflow cancelled by user",
  "finalCheckpoint": "salesforce_leads_fetched",
  "tokenUsage": {
    "totalCost": 1.05
  }
}
```

---

#### POST /workflows/{workflowId}/resume

**Description:** Resume workflow from last checkpoint

**Request:**
```json
{
  "checkpointName": "salesforce_leads_fetched"
}
```

**Response:**
```json
{
  "workflowId": "wf_abc123",
  "status": "building",
  "resumedFrom": "salesforce_leads_fetched",
  "sseStreamUrl": "https://api.nexus.ai/sse/wf_abc123"
}
```

---

## Adapter Pattern Implementation

### Orchestration Adapter Interface

**Purpose:** Abstract BMAD implementation to enable future orchestration engine swaps

**File:** `services/orchestration/src/adapters/OrchestrationAdapter.ts`

```typescript
// Generic orchestration adapter interface
export interface OrchestrationAdapter {
  /**
   * Start a new workflow
   */
  startWorkflow(request: WorkflowRequest): Promise<WorkflowResponse>;

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId: string): Promise<WorkflowStatus>;

  /**
   * Cancel workflow
   */
  cancelWorkflow(workflowId: string): Promise<CancelResponse>;

  /**
   * Resume workflow from checkpoint
   */
  resumeWorkflow(
    workflowId: string,
    checkpointName: string
  ): Promise<WorkflowResponse>;

  /**
   * Subscribe to real-time workflow updates
   */
  subscribeToUpdates(
    workflowId: string,
    callback: (update: WorkflowUpdate) => void
  ): () => void; // Returns unsubscribe function
}

// Nexus domain types
export interface WorkflowRequest {
  workflowId: string;
  userId: string;
  projectId: string;
  userRequest: string;
  context: WorkflowContext;
  budget: WorkflowBudget;
}

export interface WorkflowResponse {
  workflowId: string;
  status: 'planning' | 'orchestrating' | 'building' | 'reviewing' | 'completed' | 'failed' | 'cancelled';
  estimatedTokens?: number;
  estimatedCostUSD?: number;
  estimatedDurationMinutes?: number;
  sseStreamUrl?: string;
  error?: string;
}

export interface WorkflowStatus {
  workflowId: string;
  status: string;
  phase: string;
  currentTask?: string;
  progress: {
    completedTasks: number;
    totalTasks: number;
    percentComplete: number;
  };
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
  };
  checkpoints: Checkpoint[];
}

export interface WorkflowUpdate {
  workflowId: string;
  type: 'status_change' | 'task_progress' | 'token_usage' | 'error' | 'checkpoint';
  timestamp: string;
  data: any;
}
```

---

### BMAD Adapter Implementation

**File:** `services/orchestration/src/adapters/BMADAdapter.ts`

```typescript
import axios from 'axios';
import { EventSource } from 'eventsource';
import type {
  OrchestrationAdapter,
  WorkflowRequest,
  WorkflowResponse,
  WorkflowStatus,
  WorkflowUpdate,
} from './OrchestrationAdapter';

export class BMADAdapter implements OrchestrationAdapter {
  private bmadApiUrl: string;
  private bmadApiKey: string;

  constructor() {
    this.bmadApiUrl = process.env.BMAD_API_URL || 'http://bmad-service:8080';
    this.bmadApiKey = process.env.BMAD_API_KEY || '';
  }

  async startWorkflow(request: WorkflowRequest): Promise<WorkflowResponse> {
    try {
      // Translate Nexus domain to BMAD domain
      const bmadRequest = {
        workflowId: request.workflowId,
        userId: request.userId,
        projectId: request.projectId,
        userRequest: request.userRequest,
        context: request.context,
        budget: request.budget,
      };

      const response = await axios.post(
        `${this.bmadApiUrl}/workflows`,
        bmadRequest,
        {
          headers: {
            'Authorization': `Bearer ${this.bmadApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds
        }
      );

      // Translate BMAD response to Nexus domain
      return {
        workflowId: response.data.workflowId,
        status: response.data.status,
        estimatedTokens: response.data.estimatedTokens,
        estimatedCostUSD: response.data.estimatedCostUSD,
        estimatedDurationMinutes: response.data.estimatedDurationMinutes,
        sseStreamUrl: response.data.sseStreamUrl,
      };
    } catch (error: any) {
      console.error('[BMADAdapter] startWorkflow error:', error.message);
      throw new Error(`BMAD workflow start failed: ${error.message}`);
    }
  }

  async getWorkflowStatus(workflowId: string): Promise<WorkflowStatus> {
    try {
      const response = await axios.get(
        `${this.bmadApiUrl}/workflows/${workflowId}/status`,
        {
          headers: { 'Authorization': `Bearer ${this.bmadApiKey}` },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('[BMADAdapter] getWorkflowStatus error:', error.message);
      throw new Error(`Failed to get workflow status: ${error.message}`);
    }
  }

  async cancelWorkflow(workflowId: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.bmadApiUrl}/workflows/${workflowId}/cancel`,
        {},
        {
          headers: { 'Authorization': `Bearer ${this.bmadApiKey}` },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('[BMADAdapter] cancelWorkflow error:', error.message);
      throw new Error(`Failed to cancel workflow: ${error.message}`);
    }
  }

  async resumeWorkflow(
    workflowId: string,
    checkpointName: string
  ): Promise<WorkflowResponse> {
    try {
      const response = await axios.post(
        `${this.bmadApiUrl}/workflows/${workflowId}/resume`,
        { checkpointName },
        {
          headers: { 'Authorization': `Bearer ${this.bmadApiKey}` },
          timeout: 30000,
        }
      );

      return {
        workflowId: response.data.workflowId,
        status: response.data.status,
        sseStreamUrl: response.data.sseStreamUrl,
      };
    } catch (error: any) {
      console.error('[BMADAdapter] resumeWorkflow error:', error.message);
      throw new Error(`Failed to resume workflow: ${error.message}`);
    }
  }

  subscribeToUpdates(
    workflowId: string,
    callback: (update: WorkflowUpdate) => void
  ): () => void {
    const sseUrl = `${this.bmadApiUrl}/sse/${workflowId}`;
    const eventSource = new EventSource(sseUrl, {
      headers: { 'Authorization': `Bearer ${this.bmadApiKey}` },
    });

    eventSource.onmessage = (event) => {
      try {
        const update: WorkflowUpdate = JSON.parse(event.data);
        callback(update);
      } catch (error) {
        console.error('[BMADAdapter] SSE parse error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[BMADAdapter] SSE connection error:', error);
      eventSource.close();
    };

    // Return unsubscribe function
    return () => {
      eventSource.close();
    };
  }
}
```

---

## State Management (Supabase Integration)

### Workflow State Schema

**Table:** `workflows`

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  status TEXT NOT NULL, -- 'planning', 'orchestrating', 'building', 'reviewing', 'completed', 'failed', 'cancelled'
  phase TEXT NOT NULL, -- 'PLANNING', 'ORCHESTRATING', 'BUILDING', 'REVIEWING', 'COMPLETED'
  user_request TEXT NOT NULL,
  estimated_tokens INTEGER,
  estimated_cost_usd DECIMAL(10, 2),
  actual_tokens_input INTEGER DEFAULT 0,
  actual_tokens_output INTEGER DEFAULT 0,
  actual_cost_usd DECIMAL(10, 2) DEFAULT 0.00,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- RLS policy
CREATE POLICY "Users can view own workflows"
  ON workflows
  FOR SELECT
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_workflows_user_project ON workflows(user_id, project_id, created_at DESC);
```

---

### Workflow Checkpoints Schema

**Table:** `workflow_checkpoints`

```sql
CREATE TABLE workflow_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  checkpoint_name TEXT NOT NULL, -- 'planning_complete', 'salesforce_leads_fetched', etc.
  checkpoint_type TEXT NOT NULL, -- 'phase_transition', 'task_complete', 'user_intervention_needed'
  state_snapshot JSONB NOT NULL, -- Full workflow state at this checkpoint
  token_usage_at_checkpoint JSONB, -- { inputTokens: 45000, outputTokens: 18000, cost: 1.05 }
  UNIQUE(workflow_id, checkpoint_name)
);

-- RLS policy
CREATE POLICY "Users can view own checkpoints"
  ON workflow_checkpoints
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_checkpoints.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

-- Index for performance
CREATE INDEX idx_checkpoints_workflow ON workflow_checkpoints(workflow_id, created_at DESC);
```

---

## Real-Time Updates (SSE Implementation)

### Server-Sent Events Stream

**Endpoint:** `GET /sse/{workflowId}`

**SSE Event Types:**

1. **status_change**
   ```json
   {
     "type": "status_change",
     "workflowId": "wf_abc123",
     "timestamp": "2026-01-06T10:30:45Z",
     "data": {
       "oldStatus": "planning",
       "newStatus": "orchestrating",
       "phase": "ORCHESTRATING"
     }
   }
   ```

2. **task_progress**
   ```json
   {
     "type": "task_progress",
     "workflowId": "wf_abc123",
     "timestamp": "2026-01-06T10:31:15Z",
     "data": {
       "taskName": "Fetch Salesforce leads",
       "progress": 50,
       "message": "Processing 250 leads..."
     }
   }
   ```

3. **token_usage**
   ```json
   {
     "type": "token_usage",
     "workflowId": "wf_abc123",
     "timestamp": "2026-01-06T10:31:30Z",
     "data": {
       "inputTokens": 45000,
       "outputTokens": 18000,
       "totalCost": 1.05,
       "budget": 10.00,
       "percentUsed": 10.5
     }
   }
   ```

4. **checkpoint**
   ```json
   {
     "type": "checkpoint",
     "workflowId": "wf_abc123",
     "timestamp": "2026-01-06T10:32:00Z",
     "data": {
       "checkpointName": "salesforce_leads_fetched",
       "canResume": true
     }
   }
   ```

5. **error**
   ```json
   {
     "type": "error",
     "workflowId": "wf_abc123",
     "timestamp": "2026-01-06T10:33:00Z",
     "data": {
       "errorCode": "SALESFORCE_API_LIMIT",
       "errorMessage": "Salesforce API rate limit exceeded. Retrying in 60 seconds.",
       "retryable": true
     }
   }
   ```

---

## Cost Model

### BMAD Service Costs

**AWS Fargate Pricing:**
- 2 vCPU × $0.04048/hour = $0.08096/hour
- 4 GB RAM × $0.004445/GB-hour = $0.01778/hour
- **Total:** $0.09874/hour = **$0.00164/minute**

**Average Workflow (5 minutes):**
- BMAD compute: $0.0082
- Claude API (BMAD agents): $2.00 (included in workflow COGS)
- **Total BMAD overhead: $0.008** (negligible)

**Monthly Cost (1,000 users, 75 workflows/month/user):**
- Total workflows: 75,000/month
- BMAD compute: 75,000 × $0.008 = **$600/month**
- Acceptable infrastructure cost

---

## Resolution of Blocker #5

**Original Blocker:** Epic 4 has no technical foundation for BMAD integration

**Status:** ✅ **RESOLVED**

**Deliverables:**
1. ✅ **BMAD service architecture** (FastAPI + Python, AWS ECS Fargate)
2. ✅ **Adapter pattern** (enables orchestration engine swapping)
3. ✅ **API specification** (start, status, cancel, resume workflows)
4. ✅ **State management** (Supabase schemas for workflows + checkpoints)
5. ✅ **Real-time updates** (SSE event types and implementation)
6. ✅ **Cost analysis** (~$0.008 per workflow, negligible overhead)

**Implementation Readiness:** Epic 4 (BMAD Orchestration) can now proceed

**Next Steps:**
1. Create `services/bmad/` directory structure
2. Implement FastAPI server with workflow endpoints
3. Implement BMADAdapter in orchestration service
4. Set up ECS Fargate task definition for BMAD service
5. Deploy BMAD service to AWS
6. Test end-to-end workflow execution
7. Integrate SSE streaming with frontend

---

## Future Enhancements (Post-MVP)

1. **Multi-Orchestrator Support** - Run CrewAI, LangGraph alongside BMAD (A/B testing)
2. **Workflow Templates** - Pre-built BMAD workflows for common tasks
3. **Custom Agents** - Users upload custom agent code
4. **Workflow Marketplace** - Share/sell BMAD workflows
5. **On-Premise BMAD** - Deploy BMAD in customer's infrastructure (Enterprise tier)

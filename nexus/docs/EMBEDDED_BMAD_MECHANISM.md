# Embedded BMAD Mechanism

## How Nexus Uses BMAD Without External Installation

Nexus embeds the BMAD (Build, Measure, Analyze, Deploy) methodology directly into its core, allowing users to benefit from sophisticated multi-agent orchestration without installing any external tools, CLI, or configurations.

---

## What Users Get (Without Installing Anything)

### 1. Pre-Configured Agents

Nexus includes 6 embedded agents ready to use:

| Agent | Role | Capabilities |
|-------|------|--------------|
| **Director** | Coordinates overall workflow | Task decomposition, resource allocation, coordination |
| **Supervisor** | Reviews and approves decisions | Quality assurance, approval workflows, risk identification |
| **Analyst** | Analyzes data and requirements | Data analysis, requirement gathering, research |
| **Builder** | Executes implementation tasks | Task execution, integration, implementation |
| **Reviewer** | Reviews outputs for quality | Quality review, testing, validation |
| **Deployer** | Handles delivery | Deployment, notification, documentation |

### 2. Automatic Stage Progression

The BMAD stages execute automatically:

```
PLANNING → ORCHESTRATING → BUILDING → REVIEWING → COMPLETED
```

Users don't need to configure or understand these stages - they happen automatically.

### 3. Self-Healing Workflows

The embedded system includes:
- Automatic checkpoint creation
- Error recovery without user intervention
- Retry logic with exponential backoff
- Conflict resolution

### 4. Ultimate Autonomy Mode

Nexus operates in "Ultimate Autonomy" mode by default:
- No permission requests
- No confirmation dialogs
- No stopping for approvals
- Continuous execution until completion

---

## Technical Architecture

### Files Implementing Embedded BMAD

```
nexus/
├── src/lib/
│   ├── embedded-bmad.ts        # Core BMAD methodology
│   ├── ultimate-autonomy.ts    # Autonomy configuration
│   └── api-client.ts           # API client with BMAD methods
├── src/hooks/
│   └── useRealWorkflowExecution.ts  # Frontend execution hook
└── server/services/
    ├── bmadOrchestrator.ts     # Backend BMAD orchestration
    ├── agentCoordinator.ts     # Multi-agent coordination
    └── workflowService.ts      # Persistence layer
```

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER'S PERSPECTIVE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User types: "Create a sales pipeline report"                │
│                                                                  │
│  2. Nexus shows: "Generating workflow..." (1-2 seconds)         │
│                                                                  │
│  3. User sees real-time execution:                              │
│     ✓ Analyzing requirements... (Director)                      │
│     ✓ Gathering data... (Analyst)                               │
│     ✓ Building report... (Builder)                              │
│     ✓ Reviewing quality... (Reviewer)                           │
│     ✓ Complete! Here's your report.                             │
│                                                                  │
│  User never has to:                                             │
│  - Install BMAD CLI                                             │
│  - Configure agents                                             │
│  - Set up workflows manually                                    │
│  - Approve intermediate steps                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Behind the Scenes

```
┌─────────────────────────────────────────────────────────────────┐
│                      WHAT NEXUS DOES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. PLANNING (bmadOrchestrator.ts)                              │
│     │                                                           │
│     └─→ Claude API: "Decompose this task into steps"            │
│         └─→ Returns: [task1, task2, task3, ...]                 │
│                                                                  │
│  2. ORCHESTRATING (agentCoordinator.ts)                         │
│     │                                                           │
│     └─→ Dependency graph created                                │
│     └─→ Tasks assigned to agents                                │
│     └─→ Checkpoint created                                      │
│                                                                  │
│  3. BUILDING (Per-agent execution)                              │
│     │                                                           │
│     └─→ Director: Coordinates                                   │
│     └─→ Analyst: Gathers data                                   │
│     └─→ Builder: Executes integrations                          │
│     └─→ Checkpoint after each major step                        │
│                                                                  │
│  4. REVIEWING (Supervisor agent)                                │
│     │                                                           │
│     └─→ Quality validation                                      │
│     └─→ Auto-approve if meets threshold                         │
│                                                                  │
│  5. COMPLETED                                                   │
│     │                                                           │
│     └─→ Results delivered to user                               │
│     └─→ Cost summary logged                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Embedded Components

### 1. embedded-bmad.ts

Defines the core BMAD methodology:

```typescript
// BMAD Stages
export enum BMADStage {
  PLANNING = 'planning',
  ORCHESTRATING = 'orchestrating',
  BUILDING = 'building',
  REVIEWING = 'reviewing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Embedded Agent Configurations
export const EMBEDDED_AGENTS = {
  director: { name: 'Director', capabilities: [...] },
  supervisor: { name: 'Supervisor', capabilities: [...] },
  analyst: { name: 'Analyst', capabilities: [...] },
  builder: { name: 'Builder', capabilities: [...] },
  reviewer: { name: 'Reviewer', capabilities: [...] },
  deployer: { name: 'Deployer', capabilities: [...] }
}
```

### 2. ultimate-autonomy.ts

Defines autonomous operation:

```typescript
export const ULTIMATE_AUTONOMY_CONFIG = {
  level: 'ultimate',

  permissions: {
    fileOperations: true,
    commandExecution: true,
    apiCalls: true,
    dataModification: true,
    integrationAccess: true,
    workflowCreation: true,
    costIncurring: true
  },

  behavior: {
    neverAskPermission: true,
    neverStopAndWait: true,
    skipConfirmations: true,
    autoSelectOptions: true,
    selfRecoverFromErrors: true,
    chainWorkflows: true,
    completeFullSession: true,
    autoProgressTasks: true
  }
}
```

### 3. useRealWorkflowExecution.ts

Frontend hook for real execution:

```typescript
export function useRealWorkflowExecution() {
  // Connect to SSE for real-time updates
  const connectSSE = (workflowId) => {
    const eventSource = new EventSource(`/api/sse/workflow/${workflowId}`)
    eventSource.onmessage = (event) => {
      // Update UI in real-time
    }
  }

  // Create, start, and execute workflow
  const runWorkflow = async (name, description, steps) => {
    const workflowId = await api.createBMADWorkflow(...)
    await api.startBMADWorkflow(workflowId)
    // Auto-approve and execute in ultimate autonomy mode
    await api.executeBMADWorkflowCoordinated(workflowId)
  }

  return { runWorkflow, state, isConnected }
}
```

---

## Comparison: Traditional BMAD vs Nexus Embedded BMAD

| Aspect | Traditional BMAD | Nexus Embedded BMAD |
|--------|------------------|---------------------|
| Installation | Install BMAD CLI | None |
| Configuration | Manual agent config | Pre-configured |
| Agent Setup | Define in YAML/JSON | Built-in |
| Workflow Creation | Write workflow files | Natural language |
| Execution | CLI commands | One-click / Auto |
| Monitoring | Terminal output | Real-time UI |
| Recovery | Manual checkpoint restore | Auto-recovery |
| Approval | Manual at each stage | Auto or opt-in |

---

## User Experience Flow

### What the User Does

1. **Describe the task** in natural language
   - "Create a weekly sales report from Salesforce"
   - "Send follow-up emails to all new leads"
   - "Sync HubSpot contacts with Google Sheets"

2. **Click "Execute"** (or it runs automatically)

3. **Watch progress** in real-time
   - See each agent working
   - See checkpoints being created
   - See tokens/cost in real-time

4. **Receive results**
   - Completed output
   - Execution summary
   - Cost breakdown

### What the User DOESN'T Do

- Install anything
- Configure agents
- Write workflow definitions
- Approve intermediate steps
- Handle errors manually
- Monitor for failures
- Restart failed workflows

---

## Real-Time Execution Visualization

The embedded BMAD system includes real-time visualization via SSE:

```
┌─────────────────────────────────────────────────────────────────┐
│  Sales Pipeline Report                           ⚡ Live        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Progress: ████████████░░░░ 75%        Elapsed: 45s             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ✅ Analyze Requirements (Director)           2.3s   $0.02   ││
│  │ ✅ Fetch Salesforce Data (Analyst)          8.1s   $0.08   ││
│  │ ✅ Transform Data (Builder)                  5.2s   $0.05   ││
│  │ 🔄 Generate Report (Builder)                ...     ...     ││
│  │ ⏳ Review Quality (Reviewer)                 -       -       ││
│  │ ⏳ Deliver Results (Deployer)                -       -       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Execution Log:                                                 │
│  [14:32:15] Starting Sales Pipeline Report...                   │
│  [14:32:17] Director analyzing requirements                     │
│  [14:32:19] Checkpoint: planning_complete                       │
│  [14:32:21] Analyst fetching Salesforce data                    │
│  ...                                                            │
│                                                                  │
│  ⏱️ Est. time saved: 2 hours    💰 Current cost: $0.15         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Handling & Recovery

The embedded BMAD handles errors automatically:

### Auto-Recovery Flow

```
1. Error occurs during execution
   ↓
2. System checks autonomy level
   ↓
3. If auto-recovery enabled:
   ├─→ Find latest checkpoint
   ├─→ Restore state
   ├─→ Retry failed step
   └─→ Continue execution
   ↓
4. If max retries exceeded:
   └─→ Return error with recovery options
```

### User Never Sees

- Stack traces
- Raw error messages
- Broken workflows
- Orphaned executions

---

## Cost & Token Tracking

Built into every execution:

```typescript
// Tracked automatically
{
  totalTokensUsed: 15420,
  totalCostUsd: 0.23,
  perStepBreakdown: [
    { step: 'planning', tokens: 2100, cost: 0.03 },
    { step: 'analysis', tokens: 5200, cost: 0.08 },
    { step: 'building', tokens: 6800, cost: 0.10 },
    { step: 'review', tokens: 1320, cost: 0.02 }
  ]
}
```

---

## Summary

Nexus provides a **zero-installation, zero-configuration** BMAD experience:

1. **Embedded Methodology**: All BMAD stages built-in
2. **Embedded Agents**: 6 specialized agents ready to use
3. **Embedded Autonomy**: Ultimate autonomy mode by default
4. **Embedded Recovery**: Auto-checkpoint and auto-recovery
5. **Embedded Visualization**: Real-time SSE-based UI
6. **Embedded Tracking**: Cost and token monitoring

Users simply describe what they want, and Nexus handles everything else using the embedded BMAD methodology.

---

*Document generated as part of Production Readiness Audit 2026-01-08*
*Nexus AI Platform v0.1.0*

# PRD: Nexus Autopilot

**Version:** 1.0
**Author:** Claude Opus 4.6 (AI Architect)
**Date:** 2026-02-21
**Status:** Draft - Awaiting CEO Approval
**Priority:** P1 - Strategic Differentiator

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [User Stories](#3-user-stories)
4. [Technical Architecture](#4-technical-architecture)
5. [UI/UX Specification](#5-uiux-specification)
6. [API Design](#6-api-design)
7. [Security Model](#7-security-model)
8. [Credential Handling Protocol](#8-credential-handling-protocol)
9. [Phased Rollout](#9-phased-rollout)
10. [Production vs LocalDev Strategy](#10-production-vs-localdev-strategy)
11. [Integration Safety Matrix](#11-integration-safety-matrix)
12. [Success Metrics](#12-success-metrics)
13. [Cost Analysis](#13-cost-analysis)
14. [Risk Register](#14-risk-register)

---

## 1. Problem Statement

### The Gap

Nexus generates intelligent workflow specifications through its AI Consultancy room, but there is a critical drop-off between **workflow design** and **workflow activation**. Non-technical users face three barriers:

1. **Configuration Complexity**: Each workflow node (Gmail, Slack, Sheets, etc.) requires service-specific setup - API keys, OAuth connections, webhook URLs, channel IDs, sheet names. Users who understand *what* they want cannot bridge to *how* to configure it.

2. **Account Setup Friction**: Users may not even have accounts for recommended services. The current flow assumes pre-existing service subscriptions and connected OAuth tokens.

3. **Multi-Step Orchestration**: A 5-node workflow might require navigating 5 different dashboards, understanding 5 different configuration UIs, and correctly mapping data between them. One misconfiguration breaks the chain.

### Market Context

- **Zapier/Make**: Offer templates but still require manual configuration per node
- **n8n**: Self-hosted, developer-oriented - explicitly not for non-technical users
- **No competitor** offers "AI does it, user watches" autonomous configuration

### CEO Vision

> "Nexus should intuitively have this kind of smartness to provide intelligent solutions that makes user's business life run surprisingly easy."

Autopilot is the embodiment of "surprisingly easy" - the user describes what they want, the AI does everything.

---

## 2. Solution Overview

### What is Nexus Autopilot?

An AI-powered configuration assistant embedded in the AI Consultancy room that **autonomously performs browser-based and API-based configurations** for workflow nodes while the user watches.

### Architecture: Hybrid C+D

| Channel | Method | Use Case |
|---------|--------|----------|
| **Desktop** | Server-side Playwright streaming screenshots to embedded panel | Real-time visual feedback, user can watch AI navigate dashboards |
| **Mobile** | API-first resolution via Composio/Rube | Same outcomes without browser overhead, text-based progress |
| **Fallback** | Guided instructions with screenshots | When services block automation |

### Core Principle: "AI Does, User Watches"

```
User: "I want to automate my invoicing"
  │
  ▼
AI Consultancy designs workflow (existing feature - unchanged)
  │
  ▼
Autopilot activates: "I'll set everything up for you"
  │
  ▼
[Browser panel opens] AI navigates to QuickBooks
  │
  ▼
[PAUSE] "Please enter your QuickBooks credentials"
  │
  ▼
User enters credentials, says "Done"
  │
  ▼
AI continues: configures webhook, maps fields, tests connection
  │
  ▼
"Your invoicing workflow is live. Test invoice sent."
```

---

## 3. User Stories

### Primary Stories

| ID | As a... | I want... | So that... | Priority |
|----|---------|-----------|------------|----------|
| US-01 | Non-technical business owner | AI to configure workflow nodes for me | I don't need to learn each tool's dashboard | P0 |
| US-02 | User without service accounts | Nexus to create accounts for services I need | I only provide credentials and verify email | P0 |
| US-03 | User watching Autopilot | To see what the AI is doing in real-time | I trust the process and can intervene | P0 |
| US-04 | User with credentials | Autopilot to pause when login is needed | My passwords stay private (never seen by AI) | P0 |
| US-05 | Mobile user | Same Autopilot results without browser panel | I get configured workflows on any device | P1 |
| US-06 | User mid-configuration | To pause/resume Autopilot | I can step away and come back | P1 |
| US-07 | Kuwait business user | Autopilot to handle Arabic-first services | KNET, local banks, Arabic dashboards work | P2 |

### Edge Case Stories

| ID | As a... | I want... | So that... | Priority |
|----|---------|-----------|------------|----------|
| US-08 | User whose service blocks automation | Guided step-by-step instructions with screenshots | I can still complete setup manually | P1 |
| US-09 | User who changes their mind | To cancel Autopilot mid-configuration | No partial state is left behind | P1 |
| US-10 | User with 2FA enabled | Autopilot to pause for 2FA codes | My security setup is respected | P0 |

---

## 4. Technical Architecture

### 4.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                             │
│                                                                     │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  AIMeetingRoomV2    │  │  AutopilotPanel  │  │  AgentsSidebar│  │
│  │  (Chat + Agents)    │◄─┤  (Browser View)  │  │  (Existing)   │  │
│  │  [UNCHANGED]        │  │  [NEW]           │  │  [UNCHANGED]  │  │
│  └────────┬────────────┘  └────────┬─────────┘  └───────────────┘  │
│           │                        │                                │
│  ┌────────▼────────────────────────▼─────────────────────────────┐  │
│  │  AutopilotService.ts [NEW]                                    │  │
│  │  - Session management                                         │  │
│  │  - Action queue                                               │  │
│  │  - Screenshot streaming (SSE)                                 │  │
│  │  - Credential pause/resume                                    │  │
│  │  - API-first resolution (mobile)                              │  │
│  └────────────────────────┬──────────────────────────────────────┘  │
│                           │                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │ HTTP/SSE
┌───────────────────────────▼─────────────────────────────────────────┐
│                        BACKEND (Express)                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  /api/autopilot/* [NEW ROUTES]                               │   │
│  │  - POST /session          → Create Autopilot session         │   │
│  │  - POST /execute-step     → Execute single config step       │   │
│  │  - POST /pause            → Pause for credentials            │   │
│  │  - POST /resume           → Resume after credentials         │   │
│  │  - POST /cancel           → Cancel and cleanup               │   │
│  │  - GET  /stream/:id       → SSE screenshot stream            │   │
│  │  - GET  /status/:id       → Session status                   │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────▼───────────────────────────────────┐   │
│  │  AutopilotEngine.ts [NEW SERVICE]                            │   │
│  │  - Playwright browser pool (max 3 concurrent)                │   │
│  │  - Action planner (workflow spec → config steps)             │   │
│  │  - Screenshot capture + compression                          │   │
│  │  - Page state detection (login forms, 2FA, success)          │   │
│  │  - Cleanup on cancel/timeout                                 │   │
│  └──────────────┬───────────────────────────┬───────────────────┘   │
│                 │                           │                       │
│  ┌──────────────▼──────────┐  ┌─────────────▼───────────────────┐   │
│  │  Playwright (headless)  │  │  Existing Rube/Composio Routes  │   │
│  │  [NEW DEPENDENCY]       │  │  [UNCHANGED]                    │   │
│  │  - chromium browser     │  │  - /api/rube/execute            │   │
│  │  - page navigation      │  │  - /api/rube/manage-connections │   │
│  │  - form filling         │  │  - /api/rube/search-tools       │   │
│  │  - click/type/wait      │  │  [All existing routes preserved]│   │
│  └─────────────────────────┘  └─────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 New Files (Additive Only)

**No existing files are modified in Phase 1.** All new functionality is in new files.

| File | Purpose | Layer |
|------|---------|-------|
| `src/components/autopilot/AutopilotPanel.tsx` | Browser preview panel with screenshot stream | Frontend |
| `src/components/autopilot/AutopilotControls.tsx` | Pause/Resume/Cancel buttons + status | Frontend |
| `src/components/autopilot/CredentialPrompt.tsx` | Credential entry overlay when paused | Frontend |
| `src/components/autopilot/AutopilotProgress.tsx` | Step-by-step progress tracker | Frontend |
| `src/components/autopilot/GuidedInstructions.tsx` | Fallback manual instructions view | Frontend |
| `src/services/AutopilotService.ts` | Frontend session manager + SSE client | Frontend |
| `src/services/AutopilotActionPlanner.ts` | Converts workflow spec → config action list | Frontend |
| `server/routes/autopilot.ts` | Express routes for Autopilot API | Backend |
| `server/services/AutopilotEngine.ts` | Playwright orchestration + screenshot streaming | Backend |
| `server/services/AutopilotPageDetector.ts` | Detects login forms, 2FA, success states | Backend |
| `server/services/AutopilotActionLibrary.ts` | Pre-built action sequences per service | Backend |

### 4.3 Minimal Touchpoints to Existing Code

Only in **Phase 2** (after all marathon fixes applied), these files get **small additions**:

| File | Change | Risk |
|------|--------|------|
| `AIMeetingRoomV2.tsx` | Add `<AutopilotPanel />` as optional right panel (guarded by feature flag) | LOW - additive JSX only, behind `showAutopilot` state |
| `AIConsultancy.tsx` | Pass `autopilotEnabled` prop | LOW - single prop addition |
| `server/index.ts` | Mount `/api/autopilot` router | LOW - one `app.use()` line |

**Phase 1 operates as a standalone page** (`/autopilot-demo`) with zero changes to existing files.

### 4.4 State Machine

```
                    ┌──────────┐
                    │   IDLE   │
                    └────┬─────┘
                         │ user triggers "Set up for me"
                    ┌────▼─────┐
                    │ PLANNING │ → AI analyzes workflow spec,
                    └────┬─────┘   generates config step list
                         │
                    ┌────▼─────┐
              ┌────►│EXECUTING │ → Playwright navigates, clicks, types
              │     └────┬─────┘
              │          │ login form detected
              │     ┌────▼──────────┐
              │     │CREDENTIAL_WAIT│ → UI shows "Enter your credentials"
              │     └────┬──────────┘
              │          │ user says "Done"
              └──────────┘
                         │ all steps complete
                    ┌────▼─────┐
                    │ VERIFYING│ → Test connections, validate config
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ COMPLETE │ → "Everything is set up!"
                    └──────────┘

         At any point:
         ┌──────────┐
         │ CANCELLED│ ← user clicks Cancel → cleanup launched
         └──────────┘
         ┌──────────┐
         │  ERROR   │ ← unrecoverable failure → fallback to guided instructions
         └──────────┘
```

### 4.5 Screenshot Streaming Protocol

```
Backend (AutopilotEngine)              Frontend (AutopilotPanel)
         │                                      │
         │  POST /api/autopilot/session          │
         │◄─────────────────────────────────────│
         │  { sessionId, status: "planning" }    │
         │─────────────────────────────────────►│
         │                                      │
         │  GET /api/autopilot/stream/:id (SSE) │
         │◄─────────────────────────────────────│
         │                                      │
         │  event: screenshot                    │
         │  data: { base64, step, description }  │
         │─────────────────────────────────────►│ → renders in <img>
         │                                      │
         │  event: status                        │
         │  data: { state: "credential_wait" }   │
         │─────────────────────────────────────►│ → shows CredentialPrompt
         │                                      │
         │  POST /api/autopilot/resume           │
         │◄─────────────────────────────────────│
         │                                      │
         │  event: screenshot (continues)        │
         │─────────────────────────────────────►│
         │                                      │
         │  event: complete                      │
         │  data: { results, connections }       │
         │─────────────────────────────────────►│ → shows success
```

**Screenshot specs:**
- Format: JPEG (85% quality) for bandwidth efficiency
- Resolution: 1280x720 (16:9, fits panel)
- Frequency: On every navigation + every 2 seconds during waits
- Compression: ~50-80KB per frame
- Bandwidth: ~25-40KB/s average during active automation

### 4.6 API-First Resolution (Mobile Path)

When browser automation isn't available (mobile, or service supports direct API):

```
1. AutopilotActionPlanner checks service capabilities
2. For API-configurable services:
   - Use existing RubeClient.executeTool()
   - No browser needed
   - Show text-based progress: "Configuring Gmail webhook... Done"
3. For browser-only services:
   - Queue for next desktop session, OR
   - Show GuidedInstructions with screenshots
```

**Resolution priority:**
1. **Composio/Rube API** (fastest, works everywhere)
2. **Playwright browser automation** (desktop, visual feedback)
3. **Guided instructions** (fallback, user does manually with AI guidance)

### 4.7 Dependency on Existing Systems

| Existing System | How Autopilot Uses It | Modification Required |
|-----------------|----------------------|----------------------|
| `RubeClient.ts` | Calls `checkConnection()` and `executeTool()` for API-first path | NONE - uses public API as-is |
| `ComposioService.ts` | Backend OAuth token validation | NONE - consumed via existing routes |
| `WorkflowPreviewCard.tsx` | Autopilot reads `workflowSpec` format from existing cards | NONE - reads data, doesn't modify |
| `NexusAIService.ts` | Autopilot planner uses same response format | NONE - same JSON contract |
| `nexusPartyModeService` | Consultancy discussion continues in parallel | NONE - separate concerns |
| Existing OAuth flow | Autopilot can trigger same OAuth popups if needed | NONE - reuses FIX-001/002/003 patterns |

---

## 5. UI/UX Specification

### 5.1 Desktop Layout (AI Consultancy with Autopilot Active)

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Chat    AI Consultancy Room         [🤖 Autopilot ON]│
├─────────────────────────────┬────────────────────────────────────┤
│                             │                                    │
│  CHAT PANEL (flex-1)        │  AUTOPILOT PANEL (w-[480px])       │
│                             │                                    │
│  ┌─────────────────────┐    │  ┌──────────────────────────────┐  │
│  │ Nexus: I'll set up  │    │  │  [Live Screenshot Stream]    │  │
│  │ your invoicing       │    │  │                              │  │
│  │ workflow. Watch the  │    │  │  ┌────────────────────────┐  │  │
│  │ panel on the right → │    │  │  │  quickbooks.com/login  │  │  │
│  │                     │    │  │  │  [Username: ________]  │  │  │
│  │ ● Setting up         │    │  │  │  [Password: ________]  │  │  │
│  │   QuickBooks         │    │  │  └────────────────────────┘  │  │
│  │ ○ Configure webhook  │    │  │                              │  │
│  │ ○ Map invoice fields │    │  │  ⏸️ PAUSED: Enter your       │  │
│  │ ○ Connect to Slack   │    │  │  QuickBooks credentials,     │  │
│  │ ○ Test pipeline      │    │  │  then tell me "Done"         │  │
│  │                     │    │  │                              │  │
│  └─────────────────────┘    │  │  [▶ Resume] [■ Cancel]       │  │
│                             │  └──────────────────────────────┘  │
│  [Type a message...]        │  Step 1 of 5 · QuickBooks Login    │
│                             │                                    │
├─────────────────────────────┴────────────────────────────────────┤
│  Progress: ████████░░░░░░░░░░░░ 2/5 steps · ~3 min remaining    │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Mobile Layout (API-First)

```
┌─────────────────────────┐
│ AI Consultancy    [🤖]  │
├─────────────────────────┤
│                         │
│  Nexus: Setting up your │
│  invoicing workflow...  │
│                         │
│  ┌───────────────────┐  │
│  │ ✅ QuickBooks     │  │
│  │    Connected       │  │
│  │ 🔄 Slack webhook  │  │
│  │    Configuring...  │  │
│  │ ○ Invoice mapping  │  │
│  │ ○ Test pipeline   │  │
│  └───────────────────┘  │
│                         │
│  💬 "Enter your Slack   │
│  workspace URL"         │
│                         │
│  [workspace.slack.com]  │
│  [Submit]               │
│                         │
├─────────────────────────┤
│ [Type a message...]     │
└─────────────────────────┘
```

### 5.3 Credential Prompt Overlay

When Autopilot detects a login form:

```
┌──────────────────────────────────────┐
│  🔐 Credentials Needed               │
│                                      │
│  Nexus navigated to QuickBooks       │
│  login page. For your security,      │
│  please enter your credentials       │
│  directly in the browser panel.      │
│                                      │
│  ⓘ Nexus cannot see your password.  │
│  The browser is running on our       │
│  server but credentials are entered  │
│  through an encrypted input that     │
│  goes directly to QuickBooks.        │
│                                      │
│  When you're done logging in,        │
│  click Resume below.                 │
│                                      │
│  [▶ Resume - I've logged in]        │
│  [■ Cancel Autopilot]               │
└──────────────────────────────────────┘
```

### 5.4 Activation Flow

```
User in AI Consultancy → discusses workflow → AI generates workflowSpec
                                                      │
                                                      ▼
                                     ┌────────────────────────────┐
                                     │ "I can set this up for you │
                                     │  automatically. Want me    │
                                     │  to configure everything?" │
                                     │                            │
                                     │  [🚀 Yes, set it up]      │
                                     │  [📋 Show me steps instead]│
                                     └────────────────────────────┘
                                                │            │
                                        Autopilot      GuidedInstructions
                                        activates      (manual fallback)
```

### 5.5 Design Tokens

```typescript
// Autopilot-specific colors (extends existing statusColors)
const autopilotColors = {
  panel_bg: 'bg-slate-950',           // Dark panel for browser contrast
  panel_border: 'border-blue-500/30', // Subtle blue glow
  status_active: 'text-blue-400',     // Active step
  status_waiting: 'text-amber-400',   // Credential wait
  status_done: 'text-green-400',      // Completed step
  status_error: 'text-red-400',       // Failed step
  credential_bg: 'bg-amber-950/50',   // Warm security overlay
}
```

---

## 6. API Design

### 6.1 New Endpoints (`/api/autopilot/*`)

#### `POST /api/autopilot/session`

Create a new Autopilot session from a workflow specification.

```typescript
// Request
{
  workflowSpec: WorkflowSpec,     // From existing AI response format
  userId: string,                  // Supabase user ID
  mode: 'browser' | 'api' | 'auto', // auto = server decides
  preferences: {
    pauseOnCredentials: true,      // Always true for now
    screenshotQuality: 85,         // JPEG quality
    timeout: 300000,               // 5 min max per step
  }
}

// Response
{
  sessionId: string,               // UUID
  status: 'planning',
  steps: AutopilotStep[],          // Planned configuration steps
  estimatedDuration: number,       // Seconds
  requiresCredentials: string[],   // Services that will need login
}
```

#### `GET /api/autopilot/stream/:sessionId`

SSE stream of screenshots and status updates.

```typescript
// SSE Events
event: screenshot
data: {
  image: string,        // Base64 JPEG
  step: number,         // Current step index
  description: string,  // "Navigating to Gmail settings..."
  url: string,          // Current page URL (sanitized, no tokens)
  timestamp: number
}

event: status
data: {
  state: AutopilotState,  // PLANNING|EXECUTING|CREDENTIAL_WAIT|VERIFYING|COMPLETE|ERROR
  step: number,
  message: string,
  credentialService?: string,  // Which service needs login
}

event: progress
data: {
  completedSteps: number,
  totalSteps: number,
  currentStep: string,
  estimatedRemaining: number  // Seconds
}

event: complete
data: {
  results: StepResult[],
  connectionsEstablished: string[],
  configurationsApplied: string[],
  testResults: TestResult[]
}

event: error
data: {
  step: number,
  error: string,          // User-friendly message
  fallback: 'retry' | 'guided' | 'skip',
  guidedSteps?: string[]  // If fallback is guided
}
```

#### `POST /api/autopilot/resume`

Resume after credential entry.

```typescript
// Request
{ sessionId: string }

// Response
{ status: 'executing', currentStep: number }
```

#### `POST /api/autopilot/pause`

Manual pause (user wants to step away).

```typescript
// Request
{ sessionId: string }

// Response
{ status: 'paused', canResume: true, expiresIn: 600 } // 10 min timeout
```

#### `POST /api/autopilot/cancel`

Cancel and clean up.

```typescript
// Request
{ sessionId: string }

// Response
{
  status: 'cancelled',
  cleanup: {
    browsersClosedDown: number,
    partialConfigs: string[],  // What was partially done
    rollbackActions: string[]  // What was undone
  }
}
```

#### `GET /api/autopilot/status/:sessionId`

Poll-based status (fallback for when SSE isn't available).

```typescript
// Response
{
  sessionId: string,
  state: AutopilotState,
  currentStep: number,
  totalSteps: number,
  lastScreenshot?: string,    // Base64 (only if browser mode)
  message: string,
  startedAt: number,
  elapsedMs: number
}
```

### 6.2 Existing Endpoints Used (No Changes)

| Endpoint | Usage by Autopilot |
|----------|-------------------|
| `GET /api/rube/connection-status/:toolkit` | Check if service already connected |
| `POST /api/rube/manage-connections` | Initiate OAuth when API-first path chosen |
| `POST /api/rube/execute` | Execute tool actions via API-first path |
| `POST /api/rube/search-tools` | Discover available tools for a service |
| `POST /api/rube/get-tool-schemas` | Get parameter schemas for config planning |

---

## 7. Security Model

### 7.1 Credential Isolation

```
┌─────────────────────────────────────────────────┐
│ USER'S BROWSER                                  │
│                                                 │
│  AutopilotPanel shows SCREENSHOTS (images only) │
│  User sees what AI is doing, but...             │
│                                                 │
│  Credential entry happens via:                  │
│  Option A: Proxy input (encrypted tunnel)       │
│  Option B: Direct URL + instructions            │
│                                                 │
│  ⚠️ AI NEVER receives credential values         │
└─────────────────────────────────────────────────┘
          │ screenshots (JPEG, no DOM)
┌─────────▼───────────────────────────────────────┐
│ SERVER (Playwright headless)                    │
│                                                 │
│  Browser runs in isolated container             │
│  No credential logging                          │
│  No screenshot during credential entry          │
│  (screenshots pause on login form detection)    │
│  Session data wiped on completion               │
└─────────────────────────────────────────────────┘
```

### 7.2 Security Rules

| Rule | Implementation |
|------|---------------|
| Never capture credentials in screenshots | `AutopilotPageDetector` pauses screenshots on login form detection |
| Never log credential values | Playwright input actions use `page.fill()` via encrypted proxy, not logged |
| Session isolation | Each Autopilot session gets its own browser context (no shared cookies) |
| Automatic cleanup | Browser contexts destroyed after session ends or 10-min timeout |
| No credential storage | Nexus never stores, caches, or transmits user credentials |
| HTTPS only | All screenshot streams over WSS/HTTPS |
| Rate limiting | Max 3 concurrent Autopilot sessions per server |
| Timeout protection | 5 min per step, 30 min per session maximum |

### 7.3 Credential Entry Methods (Ranked by Security)

| Method | Security | UX | Implementation |
|--------|----------|----|----|
| **A: Direct URL** | Highest | User opens service URL in their own browser tab, logs in, returns | Simple but breaks flow |
| **B: noVNC Proxy** | High | User types into proxied browser view, encrypted tunnel | Complex but seamless |
| **C: Guided Input** | Medium | Autopilot navigates to login, pauses, user provides via chat | Good balance |

**Recommended for Phase 1: Method A** (Direct URL) - simplest, most secure, proven pattern.

User flow:
1. Autopilot detects login page
2. Shows message: "Open this link in a new tab to log in: [QuickBooks Login]"
3. User logs in separately
4. Autopilot detects session cookie appears → resumes

**Phase 2: Method C** (Guided Input) - for services where cookie detection works reliably.

### 7.4 Data Flow Security

```
Workflow Spec (from AI) → Action Plan (server) → Playwright Actions (server)
                                                          │
                                                    Screenshots → User
                                                          │
                                               NO credential data flows
                                               NO DOM content transmitted
                                               NO cookie/token exposure
```

---

## 8. Credential Handling Protocol

### 8.1 Detection

`AutopilotPageDetector.ts` identifies credential-required pages by:

```typescript
interface CredentialDetection {
  // Pattern matching
  urlPatterns: RegExp[]           // /login, /signin, /auth, /oauth
  formSelectors: string[]         // input[type=password], #login-form
  textIndicators: string[]        // "Sign in", "Log in", "Enter password"

  // Service-specific overrides
  servicePatterns: Record<string, {
    loginUrl: RegExp
    successUrl: RegExp
    twoFactorIndicators: string[]
  }>
}
```

### 8.2 Pause/Resume Cycle

```
EXECUTING → login form detected → CREDENTIAL_WAIT
                                       │
                            ┌──────────┼──────────┐
                            │          │          │
                       Screenshot   Chat msg    Timer
                       paused       sent to     starts
                                    user        (10 min)
                                       │
                            User says "Done" or
                            success URL detected
                                       │
                                  EXECUTING (resume)
```

### 8.3 Account Setup Flow

When a user needs a new account for a service:

```
AI: "Your workflow needs Slack, but you don't have an account yet.
     Want me to help you create one? You'll just need to:
     1. Choose a workspace name
     2. Enter your email
     3. Verify via email link"

User: "Yes, set it up"

Autopilot:
  1. Navigate to slack.com/get-started
  2. [SCREENSHOT: Slack signup page]
  3. PAUSE: "Enter your email address and desired workspace name"
  4. User enters info, says "Done"
  5. AI clicks "Create Workspace"
  6. PAUSE: "Check your email and click the verification link. Tell me when done."
  7. User verifies, says "Done"
  8. AI continues with workspace configuration
```

---

## 9. Phased Rollout

### Phase 0: Foundation (No Existing Code Changes)

**Prerequisites:** All marathon test fixes applied. Build stable.

**Deliverables:**
- `server/services/AutopilotEngine.ts` - Playwright browser management
- `server/services/AutopilotPageDetector.ts` - Login/2FA detection
- `server/services/AutopilotActionLibrary.ts` - Service action sequences
- `server/routes/autopilot.ts` - API endpoints
- Unit tests for all new backend services

**Validation:**
- Backend can launch Playwright, navigate, take screenshots
- Login detection works for top 10 services
- SSE streaming works in isolation
- Zero impact on existing features (no shared code touched)

**Estimated effort:** 3-4 sessions

---

### Phase 1: Standalone Demo Page

**Deliverables:**
- `src/pages/AutopilotDemo.tsx` - Standalone page at `/autopilot-demo`
- `src/components/autopilot/AutopilotPanel.tsx` - Browser screenshot viewer
- `src/components/autopilot/AutopilotControls.tsx` - Pause/Resume/Cancel
- `src/components/autopilot/CredentialPrompt.tsx` - Credential entry UI
- `src/components/autopilot/AutopilotProgress.tsx` - Step tracker
- `src/services/AutopilotService.ts` - Frontend session management
- Route added to `App.tsx` (additive, single line)

**Validation:**
- User can start Autopilot from demo page with a test workflow
- Screenshot stream renders in real-time
- Credential pause/resume cycle works
- Cancel properly cleans up
- ALL existing routes still work (`/chat`, `/ai-consultancy`, `/dashboard`, etc.)

**Existing file changes:**
- `App.tsx` - Add route (1 line)
- `server/index.ts` - Mount router (1 line)

**Estimated effort:** 2-3 sessions

---

### Phase 2: AI Consultancy Integration

**Prerequisites:** Phase 1 validated. Feature flag system in place.

**Deliverables:**
- `AutopilotPanel` embedded in `AIMeetingRoomV2` as optional right panel
- Activation trigger from AI Consultancy chat ("Set it up for me")
- `AutopilotActionPlanner.ts` - Converts workflowSpec to action steps
- Feature flag: `NEXUS_AUTOPILOT_ENABLED` (default: false)

**Existing file changes:**
- `AIMeetingRoomV2.tsx` - Add conditional `<AutopilotPanel>` render (~20 lines, behind feature flag)
- `AIConsultancy.tsx` - Pass `autopilotEnabled` prop (1 line)

**Protected pattern compliance:**
- No existing fix markers modified
- No existing state management changed
- AutopilotPanel is a sibling component, not wrapping existing components

**Validation:**
- Feature flag OFF: AI Consultancy works exactly as before
- Feature flag ON: Autopilot panel appears when activated
- All 184 existing fixes still pass validation
- Build succeeds with zero new warnings

**Estimated effort:** 2-3 sessions

---

### Phase 3: Mobile API-First + Guided Fallback

**Deliverables:**
- `src/components/autopilot/GuidedInstructions.tsx` - Manual step-by-step view
- Mobile-optimized progress UI (text-based, no screenshots)
- API-first resolution using existing `RubeClient`
- Service support matrix (which services work via API vs browser)

**Validation:**
- Mobile: Text-based progress with same outcomes
- Services with API support: No browser needed
- Services without API support: Guided instructions with screenshots
- Responsive layout: Panel collapses correctly on mobile

**Estimated effort:** 2 sessions

---

### Phase 4: Advanced Features

**Deliverables:**
- Account creation assistance (service signup flows)
- 2FA handling (pause for TOTP/SMS codes)
- Multi-service parallel configuration
- Session persistence (resume after page refresh)
- Arabic service support (RTL dashboards)
- Action library expansion (50+ services)

**Estimated effort:** 4-6 sessions

---

### Phase 5: Production Hardening

**Deliverables:**
- Rate limiting and abuse prevention
- Analytics (which services configured most, failure rates)
- Error recovery (partial config rollback)
- Performance optimization (screenshot compression, lazy loading)
- Security audit results applied
- Documentation for users

**Estimated effort:** 2-3 sessions

---

## 10. Production vs LocalDev Strategy

### 10.1 Environment Awareness

```typescript
// AutopilotEngine.ts
const config = {
  // LocalDev: Playwright runs locally, full browser available
  localdev: {
    browserEndpoint: 'local',          // Launch local chromium
    maxConcurrentSessions: 3,
    screenshotInterval: 2000,          // 2s
    sessionTimeout: 600000,            // 10 min (generous for dev)
    headless: false,                   // Show browser for debugging
  },

  // Production (Vercel): Playwright runs in serverless function
  production: {
    browserEndpoint: 'chromium-serverless', // @sparticuz/chromium
    maxConcurrentSessions: 1,              // Serverless = 1 per invocation
    screenshotInterval: 3000,              // 3s (bandwidth conscious)
    sessionTimeout: 300000,                // 5 min (cost control)
    headless: true,                        // Always headless
  }
}
```

### 10.2 Vercel Serverless Constraints

Vercel serverless functions have limits that affect long-running Playwright sessions:

| Constraint | Impact | Mitigation |
|-----------|--------|------------|
| 10s execution limit (Hobby) | Can't run full Autopilot session | Nexus Express server runs separately (not as serverless function) |
| No persistent browser | New browser per invocation | Express server maintains browser pool |
| Cold starts | 2-5s delay | Express server is always-on, no cold starts |
| Memory limit (1GB) | Chromium needs ~300MB | Express server has no memory cap |

**Key point:** Nexus already runs a persistent Express server (port 4567) separate from Vercel's serverless functions. Playwright runs inside this Express server, bypassing all Vercel serverless constraints.

### 10.3 Production Architecture

Since Playwright is free and runs inside the existing Express server, the architecture is simple:

| Environment | Playwright Host | Cost |
|-------------|----------------|------|
| **LocalDev** | Express server on localhost:4567 | $0 |
| **Production** | Same Express server (wherever it's hosted) | $0 |
| **Scale** | Express server on VPS with more RAM | $5-20/mo (server upgrade, not Playwright cost) |

**No external browser services needed.** Playwright bundles its own Chromium binary.

### 10.4 Pending Marathon Fixes Compatibility

The Autopilot architecture is designed to be **completely independent** of pending marathon test fixes:

```
Marathon fixes target:          Autopilot lives in:
─────────────────────           ────────────────────
WorkflowPreviewCard.tsx    →    autopilot/AutopilotPanel.tsx (NEW)
ChatContainer.tsx          →    autopilot/AutopilotControls.tsx (NEW)
agents/index.ts            →    server/services/AutopilotEngine.ts (NEW)
RubeClient.ts (consumed)   →    AutopilotService.ts (NEW, calls RubeClient)
```

**Key guarantee:** Autopilot introduces ZERO conflicts with marathon fix application because:
1. All Autopilot code is in new files
2. Autopilot consumes existing APIs but doesn't modify them
3. Phase 1-2 touchpoints to existing files are minimal (2 lines total) and behind feature flags
4. Marathon fixes can be applied independently at any time

**Sequencing recommendation:**
```
TODAY:     Apply marathon fixes → verify build → verify all 184 markers
TOMORROW+: Implement Phase 0 (backend only, zero frontend changes)
THEN:      Phase 1 (standalone demo page, 1-line route addition)
THEN:      Phase 2 (AI Consultancy integration, behind feature flag)
```

---

## 11. Integration Safety Matrix

### 11.1 Impact Analysis on Existing Features

| Existing Feature | Autopilot Impact | Risk Level | Mitigation |
|-----------------|-----------------|------------|------------|
| Chat Interface | NONE | Zero | Autopilot is in AI Consultancy only |
| Workflow Preview Cards | NONE | Zero | Autopilot doesn't touch WorkflowPreviewCard |
| OAuth Flows (FIX-001/002/003) | NONE | Zero | Autopilot uses own browser, not popup-based OAuth |
| Tool Execution Pipeline | NONE | Zero | Autopilot uses RubeClient via existing API |
| Parameter Collection | NONE | Zero | Autopilot has own param handling |
| Streaming Responses | NONE | Zero | Autopilot uses separate SSE endpoint |
| TTS/Voice | NONE | Zero | Independent feature |
| Multi-Agent Discussion | NONE | Zero | Autopilot runs alongside, not replacing |
| Dashboard/Analytics | NONE | Zero | Separate page |
| Landing Page | NONE | Zero | Separate page |
| Mobile Responsiveness | LOW | Minimal | AutopilotPanel has own responsive breakpoints |
| Build Size | LOW | Minimal | Playwright is server-only dependency |

### 11.2 Dependency Graph

```
AutopilotPanel.tsx (NEW)
  └─ AutopilotService.ts (NEW)
       └─ fetch('/api/autopilot/*') (NEW endpoints)
            └─ AutopilotEngine.ts (NEW)
                 ├─ playwright (existing dep, server-only)
                 └─ RubeClient equivalent calls (via existing /api/rube/*)

NO circular dependencies
NO shared state with existing components
NO shared event bus
NO modified React contexts
```

### 11.3 Feature Flag Architecture

```typescript
// src/config/feature-flags.ts (NEW)
export const FEATURE_FLAGS = {
  AUTOPILOT_ENABLED: import.meta.env.VITE_AUTOPILOT_ENABLED === 'true',
  AUTOPILOT_BROWSER_MODE: import.meta.env.VITE_AUTOPILOT_BROWSER === 'true',
} as const

// Usage in AIMeetingRoomV2.tsx (Phase 2 only)
{FEATURE_FLAGS.AUTOPILOT_ENABLED && showAutopilot && (
  <AutopilotPanel sessionId={autopilotSession} />
)}
```

**Default:** Both flags `false`. Autopilot is invisible until explicitly enabled.

---

## 12. Success Metrics

### 12.1 Primary KPIs

| Metric | Target (Phase 2) | Target (Phase 4) | Measurement |
|--------|-------------------|-------------------|-------------|
| Configuration completion rate | 60% | 85% | Sessions reaching COMPLETE state |
| Credential pause success | 90% | 95% | User resumes after credential entry |
| Average setup time | < 5 min for 3-node workflow | < 3 min | Session duration |
| User satisfaction | > 4.0/5.0 | > 4.5/5.0 | Post-setup survey |
| Fallback to manual rate | < 30% | < 15% | GuidedInstructions activations |

### 12.2 Business KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Workflow activation rate increase | +40% | Users who go from design → live workflow |
| Premium conversion (Autopilot as paid feature) | 15% free → paid | Subscription upgrades |
| Support ticket reduction | -30% | "How do I configure X" tickets |
| User retention (30-day) | +20% | Users who return after first Autopilot use |

### 12.3 Technical KPIs

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Screenshot stream latency | < 500ms | > 2000ms |
| Browser session cleanup | 100% | Any orphaned browser |
| Memory usage per session | < 400MB | > 600MB |
| API-first resolution rate | > 50% of services | < 30% |

---

## 13. Cost Analysis

### 13.1 Playwright: Free and Open-Source

**Playwright is 100% free.** It's an open-source library by Microsoft (Apache 2.0 license). There are no licensing fees, no per-session charges, and no usage limits. This applies to both development and production.

| Component | Cost | Notes |
|-----------|------|-------|
| Playwright library | $0 | Open-source, unlimited use |
| Chromium browser | $0 | Bundled with Playwright |
| Local execution | $0 | Runs on user's machine or Nexus server |
| Screenshots/streaming | $0 | Internal server→client, no external CDN needed |

### 13.2 Infrastructure Cost: Effectively $0

Nexus already runs an Express backend server (port 4567). Autopilot's `AutopilotEngine` runs inside this same Express process. Playwright launches headless Chromium on the same machine. No additional hosting, no third-party browser services, no extra servers.

| Environment | How Playwright Runs | Additional Cost |
|-------------|-------------------|-----------------|
| **LocalDev** | Same machine as Express server | $0 |
| **Production (Vercel)** | Express server already hosted; Playwright runs there | $0 |
| **Self-hosted VPS** | Same server as backend | $0 |

**Key insight:** Playwright is not a cloud service - it's a local binary. Wherever the Nexus Express server runs, Playwright runs alongside it for free. Same as how you use Playwright daily at zero cost.

**Only potential future cost:** If Nexus scales to thousands of concurrent users, each Autopilot session uses ~300MB RAM for the headless browser. At high scale (100+ concurrent sessions), a dedicated server may be needed. But that's a scale problem, not a cost-of-Playwright problem.

| Scale | Concurrent Sessions | RAM Needed | Server Cost |
|-------|-------------------|-----------|-------------|
| Early (1-50 users) | 1-3 | ~1GB | $0 (existing server) |
| Growth (50-500 users) | 5-15 | ~5GB | $0-10/mo (slightly bigger VPS) |
| Scale (500+ users) | 15-50 | ~15GB | ~$20/mo (dedicated worker) |

### 13.3 Development Cost

Only cost is Claude API usage during implementation sessions:

| Phase | Sessions | Estimated Cost (Opus 4.6) |
|-------|----------|--------------------------|
| Phase 0 | 3-4 | $15-20 |
| Phase 1 | 2-3 | $10-15 |
| Phase 2 | 2-3 | $10-15 |
| Phase 3 | 2 | $10 |
| Phase 4 | 4-6 | $20-30 |
| Phase 5 | 2-3 | $10-15 |
| **Total** | **15-22** | **$75-105** |

### 13.4 Monetization

Since Autopilot has zero marginal cost per session, all revenue is pure margin:

| Tier | Autopilot Access | Price |
|------|-----------------|-------|
| Free | Unlimited Autopilot sessions | $0 |
| Pro | Priority queue + advanced services | $19/mo |
| Business | Custom action library + SLA | $49/mo |

**Note:** Free tier can afford unlimited sessions because Playwright execution costs nothing. Monetization is based on feature depth and support level, not usage metering.

---

## 14. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Services detect and block automation | Medium | High | Stealth mode headers, fallback to guided instructions |
| Credential exposure via screenshot | Low | Critical | Screenshot pausing on login detection, no DOM transmission |
| Vercel timeout kills long sessions | Medium | Medium | External browser service, chunked execution |
| User abandons mid-configuration | Medium | Low | Auto-cleanup, partial config rollback |
| High Playwright memory on server | Medium | Medium | Browser pool limit (3), session timeouts |
| Existing feature regression | Low | High | Feature flags, zero shared state, Phase 1 standalone |
| Arabic/RTL service dashboards | Medium | Medium | Phase 4 dedicated handling, LTR wrapper |
| SSE connection drops | Medium | Low | Auto-reconnect with last-event-id, polling fallback |
| Marathon fix conflicts | Very Low | Low | All new files, no shared code paths |

---

## Appendix A: Service Action Library (Initial)

### Tier 1 (Phase 1 - API-first available)

| Service | Config Actions | Method |
|---------|---------------|--------|
| Gmail | OAuth connect, webhook setup | API (Composio) |
| Slack | OAuth connect, channel selection | API (Composio) |
| Google Sheets | OAuth connect, sheet selection | API (Composio) |
| Google Calendar | OAuth connect, calendar selection | API (Composio) |
| Discord | Bot token, channel selection | API (Composio) |

### Tier 2 (Phase 2 - Browser required)

| Service | Config Actions | Method |
|---------|---------------|--------|
| QuickBooks | Account setup, API key generation | Playwright |
| HubSpot | CRM config, pipeline setup | Playwright |
| Stripe | Webhook URL, event selection | Playwright |
| Zoom | OAuth app creation | Playwright |

### Tier 3 (Phase 4 - Regional)

| Service | Config Actions | Method |
|---------|---------------|--------|
| KNET | Merchant portal config | Playwright |
| WhatsApp Business | Number verification, template approval | Playwright |
| Tap Payments | API key, webhook setup | Playwright |

---

## Appendix B: AutopilotEngine Core Interface

```typescript
// server/services/AutopilotEngine.ts

interface AutopilotSession {
  id: string
  userId: string
  workflowSpec: WorkflowSpec
  state: AutopilotState
  steps: AutopilotStep[]
  currentStep: number
  browser: Browser | null
  page: Page | null
  createdAt: number
  lastActivity: number
}

interface AutopilotStep {
  id: string
  service: string              // e.g., "gmail", "slack"
  action: string               // e.g., "oauth_connect", "configure_webhook"
  method: 'api' | 'browser'   // Resolution method
  status: 'pending' | 'executing' | 'credential_wait' | 'complete' | 'error' | 'skipped'
  description: string          // User-friendly: "Connecting your Gmail account"
  result?: StepResult
  error?: string
  startedAt?: number
  completedAt?: number
}

interface StepResult {
  success: boolean
  connectionEstablished?: boolean
  configurationApplied?: Record<string, unknown>
  testPassed?: boolean
  screenshotUrl?: string       // Final state screenshot
}

type AutopilotState =
  | 'idle'
  | 'planning'
  | 'executing'
  | 'credential_wait'
  | 'paused'
  | 'verifying'
  | 'complete'
  | 'error'
  | 'cancelled'
```

---

## Appendix C: File Inventory

### New Files (Complete List)

```
nexus/
├── src/
│   ├── components/
│   │   └── autopilot/
│   │       ├── AutopilotPanel.tsx          # Browser screenshot viewer
│   │       ├── AutopilotControls.tsx       # Pause/Resume/Cancel
│   │       ├── AutopilotProgress.tsx       # Step-by-step tracker
│   │       ├── CredentialPrompt.tsx        # Credential entry overlay
│   │       └── GuidedInstructions.tsx      # Manual fallback view
│   ├── services/
│   │   ├── AutopilotService.ts            # Frontend session manager
│   │   └── AutopilotActionPlanner.ts      # Workflow → action steps
│   ├── config/
│   │   └── feature-flags.ts               # Feature flag definitions
│   └── pages/
│       └── AutopilotDemo.tsx              # Standalone demo page
├── server/
│   ├── routes/
│   │   └── autopilot.ts                   # Express API routes
│   └── services/
│       ├── AutopilotEngine.ts             # Playwright orchestration
│       ├── AutopilotPageDetector.ts       # Login/2FA detection
│       └── AutopilotActionLibrary.ts      # Service action sequences
└── docs/
    └── PRD-NEXUS-AUTOPILOT.md             # This document
```

### Modified Files (Phase 2 only, minimal changes)

```
nexus/
├── src/
│   ├── App.tsx                            # +1 route line
│   └── pages/
│       └── AIConsultancy.tsx              # +1 prop line
│   └── components/
│       └── AIMeetingRoomV2.tsx            # +~20 lines (feature-flagged panel)
└── server/
    └── index.ts                           # +1 router mount line
```

### Files NEVER Modified

```
WorkflowPreviewCard.tsx     ← 15+ fix markers, UNTOUCHED
ChatContainer.tsx           ← Streaming fixes, UNTOUCHED
agents/index.ts             ← AI personality, UNTOUCHED
RubeClient.ts               ← Consumed as-is, UNTOUCHED
ComposioService.ts          ← Backend consumed, UNTOUCHED
All 184 fix-marked files    ← UNTOUCHED
```

---

*End of PRD*

*Generated by Claude Opus 4.6 | Architecture-aware of 184 existing fixes, production/localdev split, and pending marathon test fixes.*

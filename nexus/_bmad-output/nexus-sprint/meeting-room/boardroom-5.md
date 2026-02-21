# Boardroom Discussion #5: Integration Architecture

**Meeting:** Nexus AI Platform Investigation - Cycle 5 Review
**Cycle:** 5 of 20
**Date:** 2026-02-15
**Attendees:** All 10 Investigation Agents + Moderator
**Duration:** Extended session
**Previous Discussions:** [Boardroom 4](boardroom-4.md) (Implementation Specifications)
**Theme:** What does the fully-wired Nexus architecture look like?

---

## 1. Opening: The Wiring Diagram

**Moderator:** Four cycles of investigation have given us a detailed map of individual modules. But Nexus is not a collection of modules -- it is a system. This cycle, every agent was tasked with one question: **how does everything connect?** I want us to trace the complete data flow from the moment a user types a message to the moment a workflow executes. Then I want us to design the architecture where IntentResolver, WorkflowIntelligence, ParamResolution, BMADEngine, RegionalIntelligence, and the Orchestration Layer all work in concert. Agent 3, you traced the message flow. Walk us through it.

---

## 2. The Complete Message Flow

**Agent 3:** I traced every network hop and function call from user keystroke to executed workflow. Here is the complete flow as it exists today in production.

### Phase 1: User Input to API Call

```
User types message in ChatInput.tsx
    |
    v
ChatContainer.tsx:handleSendMessage()
    |-- Adds user message to UI via addMessage()
    |-- Sets isLoading = true
    |-- Records event via userMemoryService.recordEvent('chat_sent')
    |
    v
nexusAIService.chat(userMessage, { chatMode })
    |-- Builds user context via userMemoryService.getMemoryForAI()
    |-- Adds to conversationHistory (last 10 messages)
    |
    v
fetch('/api/chat', { body: { messages, agentId: 'nexus', model: 'claude-sonnet-4-20250514', ... } })
```

That fetch call is the boundary between frontend and backend. In development, Vite proxies it to `localhost:4567`. In production, it hits `api/chat.ts` as a Vercel serverless function.

### Phase 2: Backend Processing

```
api/chat.ts (Vercel) OR server/routes/chat.ts (dev)
    |-- Gets agent personality from agents/index.ts (dev) or _lib/agents.ts (Vercel)
    |-- Constructs system prompt: personality + userContext
    |-- Calls Anthropic Claude API
    |     Model: claude-sonnet-4-20250514
    |     System: agent personality + user memory context
    |     Messages: conversation history + current message
    |
    v
Claude responds with JSON string
    |
    v
Backend returns { success: true, text: claudeResponseString }
```

### Phase 3: Response Processing

```
NexusAIService.chat() receives response
    |-- Parses JSON from Claude's response text
    |-- Extracts: message, shouldGenerateWorkflow, workflowSpec, clarifyingQuestions, etc.
    |-- Returns NexusAIResponse object
    |
    v
ChatContainer.tsx:handleSendMessage() (continued)
    |-- Adds AI message to UI
    |-- Checks shouldGenerateWorkflow
    |
    v
IF shouldGenerateWorkflow === true:
    |-- Creates WorkflowPreviewCard with workflowSpec
    |-- WorkflowPreviewCard renders visual nodes
    |-- User sees: message text + visual workflow card
    |
IF shouldGenerateWorkflow === false:
    |-- Displays text message only
    |-- IF clarifyingQuestions exist:
    |   |-- Renders ClarifyingOptionsWithCustomInput buttons
    |   |-- User clicks option -> sends as next message
    |   |-- Loop back to Phase 1
```

### Phase 4: Execution (When User Clicks Execute)

```
User clicks "Execute Workflow" button in WorkflowPreviewCard
    |
    v
WorkflowPreviewCard.executeWorkflow()
    |-- Pre-flight validation via PreFlightService
    |-- Checks connection status for all requiredIntegrations
    |
    v
IF missing connections:
    |-- Opens OAuth popup (BEFORE async, per FIX-001)
    |-- Polls /api/rube/connection-status/[toolkit] every 3 seconds
    |-- When ACTIVE, continues
    |
    v
All connected -> GenericExecutor.execute() or VerifiedExecutorService.executeWorkflow()
    |-- Resolves tool slugs via TOOL_SLUGS mapping
    |-- Gets params via ParamResolutionPipeline
    |-- Calls fetch('/api/rube/execute')
    |
    v
api/rube/[[...path]].ts (Vercel serverless, 864 lines)
    |-- Checks COMPOSIO_API_KEY (demo mode gate)
    |-- Creates Composio SDK instance
    |-- Calls composio.tools.execute({ toolSlug, params })
    |-- Returns result
    |
    v
WorkflowPreviewCard displays execution result
    |-- Updates node states (pending -> executing -> success/error)
    |-- Shows execution logs
```

**Agent 4:** That is 4 phases, 3 network hops (frontend -> backend -> Claude, frontend -> backend -> Composio), and roughly 15 function call boundaries. The total latency for a "simple workflow" execution is: Claude response (1-3 seconds) + user decision time + OAuth if needed (varies) + Composio execution (0.5-2 seconds). Best case: 2 seconds from "Execute" to "Done." Worst case with OAuth: 30+ seconds.

**Agent 8:** I need to highlight where the ParamResolutionPipeline fits into this. Right now, at the point where "Gets params via ParamResolutionPipeline" happens in Phase 4, the pipeline's `resolveIds()` method is a stub. It logs but makes zero API calls. So for any workflow that needs resolved IDs (Slack channel ID from channel name, Google Sheets spreadsheet ID from URL), the execution currently passes the raw user-provided value and hopes the Composio tool can handle it. Most tools cannot.

---

## 3. Where Modules Plug In

**Moderator:** Now that we have the flow, let's map where each disconnected module should wire in.

**Agent 1:** The IntentResolver in `NexusWorkflowEngine.ts` currently occupies a PARALLEL path to the Claude-based flow. It is not on the main execution path in production. The question is: should it be?

My recommendation: the IntentResolver should become a PRE-FILTER, not a replacement. Before the message hits Claude, the IntentResolver performs fast local analysis (< 5ms) and attaches metadata to the request:

```typescript
// In NexusAIService.chat(), before the fetch call:
const intentHints = intentResolver.quickAnalyze(userMessage)
// intentHints = { likelyIntent: 'workflow', toolMentions: ['gmail', 'slack'], confidence: 0.7 }

// Attach to API request body:
body: {
  messages,
  agentId: 'nexus',
  model: 'claude-sonnet-4-20250514',
  intentHints,  // <-- NEW: helps Claude focus its response
  userContext,
}
```

This way, Claude gets a head start. If the IntentResolver detects "gmail" and "slack" in the message, Claude's system prompt can include "IntentResolver suggests: gmail+slack workflow" and Claude can confirm or override. Cost saving: Claude reaches the correct response in fewer tokens, saving ~10-15% per request.

**Agent 3:** That is elegant because it does not change the fallback behavior. If the IntentResolver returns low confidence, Claude still processes normally. The IntentResolver becomes an optimizer, not a dependency.

**Agent 8:** The ParamResolutionPipeline should wire in at the execution boundary -- between the user clicking "Execute" and the API call to Composio. Specifically, it replaces the current "pass raw values" behavior:

```
Current:  Execute -> TOOL_SLUGS lookup -> raw params -> Composio
Proposed: Execute -> TOOL_SLUGS lookup -> ParamResolutionPipeline.resolve() -> resolved params -> Composio
```

The pipeline has a clear chain: URL parsing (instant) -> format detection (instant) -> cache lookup (instant) -> API call via Rube MCP (600-2500ms) -> fuzzy match -> ask user. The first three steps are free. The API call only happens for parameters that need ID resolution.

**Agent 7:** The RegionalSchedulingService should hook into TWO points:

1. **Workflow generation** -- When Claude generates a workflowSpec with a schedule step (type: "trigger"), the RegionalSchedulingService validates the schedule against prayer times, work hours, and holidays. If the user asks for "daily at 2pm" and Dhuhr prayer is at 11:50 with a 35-minute buffer ending at 12:25, the schedule is fine. But if they ask for "daily at 12:00," the service should flag it and suggest 12:30 instead.

2. **Execution time** -- Before triggering a scheduled workflow, check if the current moment falls within a prayer buffer, a holiday, or outside work hours. If so, delay until the next valid window.

The integration point for (1) is in `NexusAIService.ts` after parsing the workflowSpec, before returning to ChatContainer. The integration point for (2) is in `WorkflowPreviewCard.tsx`'s execution path, before the Composio API call.

**Agent 2:** The WorkflowIntelligenceService at `src/services/WorkflowIntelligenceService.ts` (imported in WPC at line 39 with `@NEXUS-FIX-039`) is already wired for error handling. But it should ALSO wire into the pre-flight phase. Currently, PreFlightService validates connections. WorkflowIntelligenceService should validate the workflow LOGIC -- checking for impossible combinations (e.g., "trigger: schedule" with "action: receive_email" makes no sense) and suggesting fixes.

**Agent 6:** The IndexedDB migration (when implemented) replaces the storage layer underneath three services: `ChatPersistenceService`, `UserMemoryService`, and `StorageManager`. The key design decision is that `UserMemoryService.getMemoryForAI()` should not care about the storage backend. It calls `buildMemoryProfile()` which calls `loadBusinessProfile()` which currently calls `localStorage.getItem()`. When IndexedDB is ready, that call becomes `await indexedDB.get('business_profile')` -- which means `buildMemoryProfile()` must become async.

This is a cascading change: `buildMemoryProfile()` -> async, `getMemoryForAI()` -> async, `NexusAIService.buildUserContext()` -> already handles this with try/catch, `NexusAIService.chat()` -> already async. The cascade is contained.

---

## 4. The Unified Architecture Design

**Moderator:** Let's now design the target state. Agent 3, paint the picture.

**Agent 3:** Here is the fully-wired Nexus architecture as a layered system:

```
                          USER INTERFACE LAYER
  ┌──────────────────────────────────────────────────────────┐
  │  ChatContainer.tsx                                        │
  │  ├── ChatInput (user messages)                           │
  │  ├── ChatMessage (AI responses)                          │
  │  ├── WorkflowPreviewCard (visual workflows + execution)  │
  │  └── ClarifyingOptions (question UI)                     │
  └──────────────────────────────────┬───────────────────────┘
                                     │
                          INTELLIGENCE LAYER
  ┌──────────────────────────────────┼───────────────────────┐
  │                                  │                        │
  │  ┌─────────────┐  ┌─────────────┴──────┐  ┌───────────┐ │
  │  │ IntentResolver│  │ NexusAIService     │  │UserMemory │ │
  │  │ (pre-filter)  │─>│ (Claude orchestr.) │<─│ Service   │ │
  │  └─────────────┘  │ + intentHints       │  └───────────┘ │
  │                    │ + userContext       │                 │
  │                    │ + conversationHist. │                 │
  │                    └─────────┬──────────┘                 │
  │                              │                            │
  │  ┌───────────────┐          │          ┌───────────────┐ │
  │  │ Regional       │<────────┤          │ Workflow      │ │
  │  │ Intelligence   │         │          │ Intelligence  │ │
  │  │ (prayer times, │         │          │ (logic valid.)│ │
  │  │  holidays,     │         │          └───────┬───────┘ │
  │  │  work hours)   │         │                  │         │
  │  └───────────────┘          │                  │         │
  └─────────────────────────────┼──────────────────┼─────────┘
                                │                  │
                     EXECUTION LAYER               │
  ┌──────────────────────────────┼──────────────────┼─────────┐
  │                              │                  │          │
  │  ┌──────────────┐  ┌────────┴───────┐  ┌──────┴───────┐ │
  │  │ PreFlight     │  │ Orchestration  │  │ Param        │ │
  │  │ Service       │  │ Layer (5-layer)│  │ Resolution   │ │
  │  │ (connection   │  │ Discovery      │  │ Pipeline     │ │
  │  │  validation)  │  │ Schema         │  │ (ID lookup)  │ │
  │  └──────┬───────┘  │ UX Translate   │  └──────┬───────┘ │
  │         │          │ Param Collect   │         │         │
  │         │          │ Execute         │         │         │
  │         │          └────────┬───────┘         │         │
  │         │                   │                  │         │
  │         └───────────┬───────┴──────────────────┘         │
  │                     │                                     │
  │              ┌──────┴────────┐                           │
  │              │ Verified      │                           │
  │              │ Executor      │                           │
  │              │ Service       │                           │
  │              └──────┬────────┘                           │
  └─────────────────────┼───────────────────────────────────┘
                        │
                     API LAYER
  ┌─────────────────────┼───────────────────────────────────┐
  │                     │                                    │
  │  ┌─────────────┐  ┌┴──────────────┐  ┌──────────────┐  │
  │  │ /api/chat    │  │ /api/rube/    │  │ /api/rube/   │  │
  │  │ (Claude AI)  │  │ execute       │  │ connection-  │  │
  │  │              │  │ (Composio)    │  │ status       │  │
  │  └──────┬──────┘  └──────┬────────┘  └──────────────┘  │
  │         │                │                               │
  └─────────┼────────────────┼───────────────────────────────┘
            │                │
     ┌──────┴──────┐  ┌─────┴──────┐
     │ Claude API   │  │ Composio   │
     │ (Anthropic)  │  │ SDK        │
     └─────────────┘  └────────────┘
```

**Agent 10:** That diagram is missing the data persistence layer. Where does IndexedDB/localStorage fit?

**Agent 6:** Below the Intelligence Layer, beside UserMemoryService:

```
  PERSISTENCE LAYER
  ┌────────────────────────────────────────────┐
  │  NexusStorageService (facade)              │
  │  ├── IndexedDB (primary - 1000+ convos)   │
  │  ├── localStorage (fallback/cache)         │
  │  └── Supabase (cloud sync - Tier 1-2 data)│
  └────────────────────────────────────────────┘
```

UserMemoryService reads from NexusStorageService. ChatPersistenceService writes to NexusStorageService. The sync queue in IndexedDB handles eventual consistency with Supabase.

**Agent 9:** And the security layer wraps the entire API Layer:

```
  SECURITY LAYER (wraps API Layer)
  ┌────────────────────────────────────────────┐
  │  Rate Limiter (per-route thresholds)       │
  │  Input Sanitizer (injection patterns)      │
  │  Output Validator (credential leak check)  │
  │  Behavioral Monitor (anomaly detection)    │
  │  Tool Guardrails (action allowlists)       │
  └────────────────────────────────────────────┘
```

---

## 5. The Event Bus Question

**Agent 4:** The current architecture has no event bus. Components communicate through direct function calls and React state. This works at the current scale but creates tight coupling. For example, when WorkflowPreviewCard completes an execution, it updates its own state. ChatContainer has no idea. UserMemoryService has no idea. The execution result is siloed.

Should we introduce an event bus? My answer is: not yet, but prepare for it.

The pattern I recommend is a lightweight pub/sub that sits in a React context:

```typescript
// NexusEventBus.ts
type NexusEvent =
  | { type: 'workflow:created'; payload: { workflowId: string; spec: WorkflowSpec } }
  | { type: 'workflow:executed'; payload: { workflowId: string; result: ExecutionResult } }
  | { type: 'connection:changed'; payload: { toolkit: string; status: 'active' | 'expired' } }
  | { type: 'user:levelChanged'; payload: { from: string; to: string } }
  | { type: 'regional:prayerTime'; payload: { prayer: string; startsIn: number } }
```

This enables loose coupling between WorkflowPreviewCard (publisher of `workflow:executed`) and UserMemoryService (subscriber that records the event) and ChatContainer (subscriber that shows a success toast) and ProgressiveDisclosure (subscriber that updates user level).

**Agent 3:** I agree with "prepare but don't build yet." The current direct-call approach works because we have one chat interface, one execution path, and one user. When we add: scheduled workflows (no chat involved), WhatsApp-triggered workflows (different UI), and multi-user (different context), we will NEED an event bus. Building it now would be premature. But designing the event types now -- as Agent 4 just did -- is cheap insurance.

**Agent 10:** I want to add to those event types. Progressive disclosure needs these events to update user level:

```typescript
| { type: 'onboarding:stepCompleted'; payload: { step: string; data: Record<string, any> } }
| { type: 'user:firstWorkflow'; payload: { workflowId: string } }
| { type: 'user:integrationConnected'; payload: { toolkit: string; count: number } }
```

When these fire, the user level context re-evaluates: `workflow:executed` events increment the count, potentially graduating the user from beginner to intermediate.

---

## 6. State Management Architecture

**Agent 6:** The current state management is fragmented across 5 separate stores:

1. **React state** in ChatContainer (conversation state, loading, current intent)
2. **React state** in WorkflowPreviewCard (execution state, auth state, node states)
3. **localStorage** via multiple keys (`nexus-chat-sessions`, `nexus-user-workflows`, `nexus_user_context`, `nexus_business_profile`, etc.)
4. **In-memory** in NexusAIService (`conversationHistory` array -- lost on page reload)
5. **Supabase** for cloud sync (when userId is present)

The fully-wired architecture should consolidate this into three tiers:

**Tier 1: Ephemeral State (React)** -- UI state that resets on component unmount. Loading spinners, animation states, open/closed panels.

**Tier 2: Session State (IndexedDB)** -- State that persists within a session and across page reloads. Conversation history, execution results, connection statuses. `NexusAIService.conversationHistory` should be backed by IndexedDB so it survives page reload.

**Tier 3: Persistent State (Supabase)** -- State that persists across devices and sessions. User profile, business context, workflow definitions, preferences. With CITRA compliance, only Tier 1-2 data goes here; Tier 3-4 DPPR data stays in IndexedDB.

**Agent 4:** I want to flag a risk with IndexedDB-backed conversationHistory. If `NexusAIService.chat()` has to `await` an IndexedDB read before sending to Claude, that adds 5-20ms to every chat message. That is acceptable. But if IndexedDB is corrupted or quota-exceeded, the fallback must be graceful -- use in-memory array just like today.

**Agent 6:** The design accounts for this. NexusStorageService has a three-tier fallback: IndexedDB -> localStorage -> in-memory Map. Every read first tries IndexedDB. If it throws, tries localStorage. If that throws, returns from memory. The in-memory tier is always populated from the first successful read, so subsequent reads are instant.

---

## 7. The BMADWorkflowEngine Integration Question

**Agent 2:** There is a significant architectural question nobody has raised: we have TWO workflow engines. `NexusWorkflowEngine.ts` (the Claude-proxy-based engine with Director/Analyst/Builder agents) and `BMADWorkflowEngine.ts` (the BMAD methodology engine). Both are imported in ChatContainer. Which one is actually used?

I traced the imports. In ChatContainer at line 31-35:

```typescript
import {
  nexusWorkflowEngine,
  type IntentAnalysis,
  type SmartNexusQuestion,
  type GeneratedWorkflow,
} from '@/services/NexusWorkflowEngine'
```

And separately:

```typescript
import { nexusAIService } from '@/services/NexusAIService'
```

The actual chat flow in `handleSendMessage()` calls `nexusAIService.chat()`. It does NOT call `nexusWorkflowEngine.analyzeIntent()`. The NexusWorkflowEngine import is used only for TYPE definitions. The actual engine is dead code in the chat flow.

`BMADWorkflowEngine.ts` is imported but used for the "Think with Me" mode and coordinated workflow execution -- a separate feature.

So the architecture has:
- **Active path:** NexusAIService -> Claude API -> JSON response -> WorkflowPreviewCard
- **Dead path (chat):** NexusWorkflowEngine with Director/Analyst/Builder agents
- **Separate feature:** BMADWorkflowEngine for coordinated execution

**Agent 3:** This is important for the unified architecture. The "dead" NexusWorkflowEngine should either be removed or repurposed. My recommendation: repurpose it as the IntentResolver pre-filter I described. Its `analyzeIntent()` method already extracts intent, domain, confidence, and suggested tools. Instead of calling Claude via proxy (which is the dead path), have it do local pattern matching and return hints.

**Agent 1:** That aligns perfectly with my IntentResolver design. NexusWorkflowEngine already has the interface (`IntentAnalysis`). We just replace the implementation from "call Claude" to "local pattern matching." The function signature stays identical. All consumers continue to work.

**Moderator:** **Consensus Point 2: The unified architecture has ONE active workflow generation path (NexusAIService -> Claude -> WorkflowPreviewCard). NexusWorkflowEngine should be repurposed as a local IntentResolver pre-filter. BMADWorkflowEngine remains for the separate "Think with Me" coordinated execution feature.**

---

## 8. The Orchestration Layer's Role

**Agent 8:** The Orchestration Layer in `src/services/orchestration/` is a 5-layer system: Discovery, Schema Resolution, UX Translation, Param Collection, and Execution. In WPC, the feature flag `USE_GENERIC_ORCHESTRATION` at line 96 is set to `true`. This means WPC is ALREADY using the orchestration layer for tool discovery and execution.

The question is: how does the Orchestration Layer relate to `VerifiedExecutorService`? Both can execute tools. The answer is in WPC's execution flow. VerifiedExecutorService wraps the Orchestration Layer's GenericExecutor. It adds verification steps: pre-execute validation, post-execute result checking, and retry logic.

The fully-wired stack is:

```
WorkflowPreviewCard.executeWorkflow()
    |
    v
VerifiedExecutorService.executeWorkflow()
    |
    v
GenericExecutor.execute() [Orchestration Layer 5]
    |
    v
fetch('/api/rube/execute')
    |
    v
composio.tools.execute()
```

ParamResolutionPipeline should insert between VerifiedExecutorService and GenericExecutor:

```
VerifiedExecutorService
    |-- pre-validate
    |-- ParamResolutionPipeline.resolve()  <-- INSERT HERE
    |-- GenericExecutor.execute()
    |-- post-validate
```

This is a 3-line wiring change in VerifiedExecutorService: before calling `executor.execute()`, call `pipeline.resolve(params)` and use the resolved params.

**Moderator:** **Consensus Point 3: The Orchestration Layer is already active in production (feature flag ON). ParamResolutionPipeline wires into VerifiedExecutorService as a pre-execution step. This is a 3-line change.**

---

## 9. Updated Top 10 Improvements

| Rank | Improvement | Architecture Impact | Notes |
|------|-------------|-------------------|-------|
| 1 | **Security Layer** (wrap API) | New middleware layer | Sprint 1 (dev server) |
| 2 | **Personality Port** | Fix 65% gap between dev/prod AI | Sprint 1 |
| 3 | **Error Infrastructure** | 30 silent catches -> structured logging | Sprint 1 |
| 4 | **ParamResolution Wiring** | 3-line change in VerifiedExecutor | Sprint 2 |
| 5 | **WPC Phase 1-2 Extraction** | Foundation for hook extraction | Sprint 1 |
| 6 | **IntentResolver Repurpose** | NexusWorkflowEngine -> local pre-filter | Sprint 2 |
| 7 | **NexusEventBus** (design only) | Event types defined, implementation deferred | Sprint 2 |
| 8 | **IndexedDB + NexusStorageService** | 3-tier persistence with CITRA compliance | Sprint 3 |
| 9 | **RegionalSchedulingService** | Prayer-time intercept at 2 points | Sprint 2-3 |
| 10 | **State Consolidation** | 5 fragmented stores -> 3 tiers | Sprint 3-4 |

---

## 10. Questions for Cycle 6

**Agent 1:** What can Nexus do that Zapier literally cannot do? Not "does better" -- genuinely cannot do?

**Agent 2:** How do we build a moat with Kuwait payment integration that Zapier/Make cannot replicate?

**Agent 3:** What is the performance ceiling? At what user scale does the current architecture break?

**Agent 4:** Can we achieve hot-module replacement for the AI personality? Change the personality without redeploying?

**Agent 5:** What is the customer acquisition story? Arabic-first AI + WhatsApp distribution -- is that a viral loop?

**Agent 6:** Can we use IndexedDB as a collaborative store for team workflows?

**Agent 7:** Voice-to-workflow: "Yalla, send my emails to Slack" in Gulf Arabic -- what is the speech-to-text pipeline?

**Agent 8:** Can we make the Orchestration Layer self-improving? If a tool slug fails, learn and update?

**Agent 9:** What CITRA-compliant features become competitive advantages, not just compliance costs?

**Agent 10:** Can we personalize the empty state based on industry and user level? "Fatima sees restaurant automation; Ahmad sees tender tracking."

---

## Closing Statement

**Moderator:** Boardroom Discussion #5 has produced the most important artifact of the investigation so far: the unified architecture diagram. For the first time, we can see how every module connects -- from the IntentResolver pre-filter at the top, through the Claude Intelligence Layer, down through the Orchestration and Execution layers, to the Composio SDK at the bottom.

Three architectural realizations emerged:

1. **NexusWorkflowEngine is dead code in the chat path.** Repurposing it as an IntentResolver pre-filter gives it new life without adding complexity.

2. **ParamResolutionPipeline is a 3-line wiring change.** The infrastructure exists. The connection is missing. Three lines fix it.

3. **The event bus is premature but the event types are not.** Defining `NexusEvent` types now costs nothing and enables loose coupling later.

The architecture is cleaner than it appeared in Cycle 1. The modules exist. The paths exist. What was missing was the wiring diagram -- and now we have it. Cycle 6 should ask the hardest question of all: once wired, **what makes this system impossible to compete with?**

---

*End of Boardroom Discussion #5*
*Next Discussion: Boardroom #6 (Competitive Differentiation)*

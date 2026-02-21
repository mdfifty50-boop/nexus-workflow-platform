# Cycle 3 - Agent 4: Closure-Safety Analysis for WorkflowPreviewCard Hook Extraction

**Mission:** Design a closure-safety test suite for WPC Phase 3-4 hook extraction.
**File:** `nexus/src/components/chat/WorkflowPreviewCard.tsx` (~7100 lines, 300KB)
**Date:** 2026-02-15

---

## 1. Complete Hook Inventory

### 1.1 useEffect Hooks (13 total)

| # | Line | Purpose | Dependencies | Captured State |
|---|------|---------|-------------|----------------|
| E1 | 3576 | FIX-068: Sync parent collectedParams to local | `[workflow.collectedParams]` | `workflow.collectedParams` |
| E2 | 3624 | Validate workflow on mount/change | `[workflow.nodes]` | `workflow.nodes` |
| E3 | 3757 | FIX-033/055/074: Pre-flight check with orchestration | `[workflow.nodes, collectedParams, authState.connectedIntegrations, orchestrationResults]` | `workflow.nodes`, `collectedParams`, `authState.connectedIntegrations`, `orchestrationResults`, `isToolkitKnown` closure |
| E4 | 4209 | FIX-054: Reset question index on questions change | `[preFlightResult?.questions.length, currentQuestionIndex]` | `preFlightResult`, `currentQuestionIndex` |
| E5 | 4297 | FIX-118: Dry-run validation gate | `[preFlightResult, collectedParams, phase, workflow, orchestrationResults]` | `preFlightResult`, `collectedParams`, `phase`, `workflow`, `orchestrationResults`, `nodes` |
| E6 | 4455 | OAuth callback message listener | `[addLog]` | `addLog` (stable callback) |
| E7 | 4617 | FIX-045: Auto-check connections on mount | `[requiredIntegrations, checkConnections]` | `requiredIntegrations`, `checkConnections` |
| E8 | 5785 | FIX-023: Keep executeWorkflowRef current | `[executeWorkflow]` | `executeWorkflow` |
| E9 | 5790 | Auto-execute on mount if autoExecute | `[autoExecute, executeWorkflow]` | `autoExecute`, `executeWorkflow` |
| E10 | 5798 | Auto-execute after all integrations connect | `[phase, executeWorkflow, addLog]` | `phase`, `shouldAutoExecuteRef`, `executeWorkflow` |
| E11 | 5818 | FIX-026/094 Phase 1: Detect param change in error state | `[workflow.collectedParams, phase, addLog]` | `workflow.collectedParams`, `phase`, `prevCollectedParamsRef`, `pendingAutoRetryRef` |
| E12 | 5852 | FIX-094 Phase 2: Execute on ready + pending retry | `[phase]` | `phase`, `pendingAutoRetryRef`, `executeWorkflowRef` |
| E13 | (inline) | Cleanup intervals in handleConnect polling | none (inline in callback) | `authState` at closure creation time |

### 1.2 useCallback Hooks (14 total)

| # | Line | Name | Dependencies | Captured State |
|---|------|------|-------------|----------------|
| C1 | 1952 | handleTouchEnd (MiniNodeH) | `[onSelect, node.id]` | `onSelect`, `node.id`, `touchFiredRef` |
| C2 | 1960 | handleClick (MiniNodeH) | `[onSelect, node.id]` | `onSelect`, `node.id`, `touchFiredRef` |
| C3 | 2071 | handleTouchStart (MiniNodeV) | `[]` | none (only setShowTooltip) |
| C4 | 2075 | handleTouchEnd (MiniNodeV) | `[]` | none (only setShowTooltip) |
| C5 | 3618 | handleNodeSelect | `[]` | none (only setSelectedNodeId) |
| C6 | 3699 | addLog | `[]` | none (only setExecutionLog) |
| C7 | 3704 | checkWhatsAppStatus | `[whatsAppIntegrations.length, addLog]` | `whatsAppIntegrations` |
| C8 | 3744 | handleWhatsAppConnected | implicit `[addLog]` | `addLog` |
| C9 | 4221 | handlePreFlightAnswer | `[preFlightResult, currentQuestionIndex, onMissingInfoSelect]` | `preFlightResult`, `currentQuestionIndex` |
| C10 | 4516 | checkConnections | `[oauthIntegrations, whatsAppIntegrations, checkWhatsAppStatus, addLog]` | `oauthIntegrations`, `whatsAppIntegrations`, `checkWhatsAppStatus` |
| C11 | 4643 | handleConnect | `[authState, addLog]` | **FULL authState** (stale closure risk) |
| C12 | 4831 | handleConnectAll | `[authState.pendingIntegrations, addLog]` | `authState.pendingIntegrations` |
| C13 | 5120 | handleConnectSingle | `[authState, addLog]` | **FULL authState** |
| C14 | 5244 | executeWorkflow | `[phase, requiredIntegrations.length, nodes, checkConnections, addLog, onExecutionComplete, triggerSampleData]` | **phase, nodes, requiredIntegrations, checkConnections, triggerSampleData, workflow, collectedParams, orchestrationResults** |
| C15 | 5869 | openFullView | `[navigate, workflow]` | `navigate`, `workflow` |
| C16 | 5882 | resetWorkflow | `[]` | none |

### 1.3 useMemo Hooks (6 total)

| # | Line | Name | Dependencies |
|---|------|------|-------------|
| M1 | 3672 | requiredIntegrations | `[workflow.nodes]` |
| M2 | 3680 | whatsAppIntegrations/oauthIntegrations | `[requiredIntegrations]` |
| M3 | 4271 | currentPreFlightQuestion | `[preFlightResult, currentQuestionIndex]` |
| M4 | 4282 | isPreFlightComplete | `[preFlightResult]` |
| M5 | 5897 | allVerified | `[isComplete, nodes]` (isComplete derived from phase) |
| M6 | 5910 | unverifiedCount | `[isComplete, nodes]` |

### 1.4 Refs Used to Mitigate Closures (9 total)

| Ref | Line | Purpose | Accessed By |
|-----|------|---------|-------------|
| touchFiredRef | 1949 | Prevent touch+click double-fire | handleTouchEnd, handleClick |
| pendingErrorInputRef | 3553 | Track pending error input value | JSX inline handlers |
| shouldAutoExecuteRef | 3663 | Flag auto-execute after OAuth | checkConnections callback, E10 effect |
| **executeWorkflowRef** | 3666 | **FIX-023: Latest executeWorkflow for setTimeout** | E8, E12, JSX inline setTimeout handlers |
| dryRunCompletedRef | 4295 | Prevent duplicate dry-runs | E5 effect |
| checkedIntegrationsKeyRef | 4616 | Track checked integrations | E7 effect |
| nodeRetryCounts | 5241 | Track retry counts per node | executeWorkflow callback |
| prevCollectedParamsRef | 5814 | Track previous collected params | E11 effect |
| **pendingAutoRetryRef** | 5815 | **FIX-094: Decouple state reset from exec** | E11 (sets), E12 (reads) |

---

## 2. FIX-023 and FIX-094 Analysis

### 2.1 FIX-023: Stale executeWorkflow in setTimeout

**What it protects:**
- Lines 6164-6168 and 6179-6183: After user provides trigger sample data and clicks "Use Data" or "Skip", a `setTimeout(() => { executeWorkflowRef.current() }, 100)` resumes execution.
- Without the ref, the setTimeout would capture the `executeWorkflow` function from the render when the component mounted, BEFORE the user provided sample data.

**The fix has THREE parts:**
1. **Line 3666:** Declares `executeWorkflowRef`
2. **Line 5785-5787 (E8):** `useEffect` that syncs the ref with the latest `executeWorkflow` callback every time it changes
3. **Lines 6168, 6182:** setTimeout calls use `executeWorkflowRef.current()` instead of `executeWorkflow` directly

**What breaks if closure captures stale state:**
- `executeWorkflow` (C14) captures `nodes`, `phase`, `triggerSampleData`, and `workflow.collectedParams` at creation time
- If the closure is stale, `triggerSampleData` would be empty `{}` (the initial state), so the trigger node would prompt for data AGAIN instead of using what the user just entered
- `nodes` would show all nodes as "idle" instead of reflecting partial execution progress
- The `phase` would be "ready" when it should reflect the mid-execution state

**Stale closure severity: CRITICAL** - workflow would loop forever asking for sample data.

### 2.2 FIX-094: State Reset Canceling Auto-Retry Timeout

**What it protects:**
- Lines 5810-5865: Two-phase auto-retry system when user provides a missing parameter while workflow is in error state
- **Problem it solved:** When `setPhase('ready')` was called in E11 (Phase 1), React re-rendered, which caused E12's setTimeout to be cleaned up and never fire
- **Solution:** Uses `pendingAutoRetryRef` (a ref) to survive re-renders, and E12 has ONLY `[phase]` in its dependencies

**The two-phase mechanism:**
1. **Phase 1 (E11):** Detects `workflow.collectedParams` changed while `phase === 'error'`. Sets `pendingAutoRetryRef.current = true`. Calls `setPhase('ready')`.
2. **Phase 2 (E12):** Reacts to `phase` changing to `'ready'`. Checks `pendingAutoRetryRef.current`. If true, calls `executeWorkflowRef.current()` via setTimeout.

**What breaks if closure captures stale state:**
- If E12 captured `executeWorkflow` directly (instead of using `executeWorkflowRef.current()`), it would execute with the OLD params that caused the error in the first place
- The user's newly-provided parameter would be ignored because `workflow.collectedParams` in the stale closure would not include it
- Result: infinite error-retry loop where the same error keeps repeating

**Stale closure severity: CRITICAL** - workflow would retry with wrong params forever.

---

## 3. Additional Stale Closure Risks Found

### 3.1 handleConnect Polling (Line 4679-4744) - HIGH RISK

The `setInterval` callback at line 4679 captures `authState.connectedIntegrations` and `authState.pendingIntegrations` from the render when `handleConnect` was created. The polling runs for up to 2 minutes (40 attempts x 3s).

**Problem:** If another integration completes connection via `handleConnectAll` or the OAuth callback handler (E6) while this poll is running, the stale `authState` closure would:
- Re-add already-connected integrations to "pending"
- Fail to detect that all integrations are connected
- Not trigger `shouldAutoExecuteRef.current = true`

**Current mitigation:** Partially mitigated by using `setAuthState(prev => ...)` functional updates, but line 4705 creates a new Set from the stale `authState.connectedIntegrations` instead of using `prev.connectedIntegrations`:
```typescript
// Line 4705 - STALE CLOSURE BUG:
const newConnected = new Set(authState.connectedIntegrations)  // captures stale value
// Should be inside the setAuthState(prev => ...) using prev.connectedIntegrations
```

**Severity: HIGH** - can cause integration status desync in parallel auth scenarios.

### 3.2 handleConnectAll Demo Mode Timeout (Line 5071-5107) - MEDIUM RISK

The `setTimeout` at line 5071 captures `integration` from the `for` loop. This is safe due to the `const` declaration. However, the `setAuthState(prev => ...)` call inside correctly uses functional updates.

### 3.3 executeWorkflow Captures `nodes` (Line 5264) - HIGH RISK

The `executeWorkflow` callback (C14) iterates over `nodes` via `for (let i = 0; i < nodes.length; i++)`. This `nodes` is captured at the time `executeWorkflow` was created (last render when dependencies changed).

**Problem:** During execution, `setNodes()` is called to update node statuses, but `nodes` in the closure still references the old array. This means:
- `const node = nodes[i]` at line 5265 reads from the stale array
- If a node was added or removed during execution (e.g., dynamic workflow modification), the loop would operate on wrong indices
- The `previousNodeResults` at line 5532 uses `nodes.slice(0, i)` which reads stale results

**Current mitigation:** The dependency array includes `nodes`, but since `setNodes` triggers re-render which recreates `executeWorkflow`, this would INTERRUPT execution mid-loop. The ref pattern (FIX-023) prevents this from being a problem in practice because the timeout restarts with fresh closure.

**Severity: MEDIUM** - The sequential `await` loop means each node completes before the next starts, and node status updates use functional `setNodes(prev => ...)`. But data flow between nodes via `nodes.slice(0, i).map(n => n.result)` reads STALE results since those were set via `setNodes` but the local `nodes` array is still the original.

### 3.4 Pre-flight Effect (E3, Line 3757) - MEDIUM RISK

The massive async IIFE inside this useEffect captures `collectedParams` and `orchestrationResults`. Since the async operations (API calls to Composio) can take seconds, the captured values may be stale by the time results return.

**Specific risk:** `isParamSemanticallycollected(q.paramName, collectedParams)` at line 3994 uses the `collectedParams` from the render that started the effect. If the user answered a question while the pre-flight was running, the newly collected param would not be detected, causing a duplicate question.

**Current mitigation:** The effect re-runs when `collectedParams` changes (it is a dependency), which will re-check. But the previous async run continues in parallel, potentially setting stale questions.

**Severity: MEDIUM** - duplicate questions are annoying but not data-breaking.

---

## 4. Test Scenarios

### 4.1 OAuth Polling with Connection Status Changes Mid-Poll

```
TEST: "OAuth connection completes via message listener while polling is active"

Setup:
  - Workflow requires [gmail, slack, googlesheets]
  - User clicks "Connect All" which starts polling for all 3

Scenario A: Sequential completion
  1. Gmail completes via poll at attempt 5
  2. Slack completes via window.postMessage callback at attempt 7
  3. Googlesheets completes via poll at attempt 10

  Assert:
    - authState.connectedIntegrations has all 3
    - shouldAutoExecuteRef.current === true
    - phase === 'ready'
    - No duplicate connection entries

Scenario B: Race condition
  1. Gmail poll succeeds at attempt 5
  2. SIMULTANEOUSLY, gmail message callback fires

  Assert:
    - authState.connectedIntegrations has gmail exactly ONCE
    - pendingIntegrations count decremented by exactly 1
    - No double auto-execute trigger

Scenario C: Stale closure in handleConnect (line 4705)
  1. User uses sequential handleConnect (not handleConnectAll)
  2. Gmail connected at attempt 3 -> authState updated
  3. User clicks connect for Slack -> new handleConnect closure created
  4. But previous poll for Gmail is still running with old authState

  Assert:
    - Old Gmail poll cleared (interval cleared)
    - No stale authState.connectedIntegrations used
    - Verify: Set from prev.connectedIntegrations, not captured authState
```

### 4.2 Execution Progress with Step State Changes

```
TEST: "executeWorkflow reads fresh node results for downstream data flow"

Setup:
  - 3-node workflow: Gmail (trigger) -> AI Process -> Google Sheets (action)
  - User provides trigger sample data

Scenario A: Data flow between nodes
  1. Trigger completes with sample data { subject: "Hello", body: "World" }
  2. AI node completes
  3. Google Sheets node needs data from trigger via nodes.slice(0, 2)

  Assert:
    - nodes[0].result at line 5532 contains the trigger data
    - BUG CHECK: Does the `nodes` variable in the closure reflect
      the setNodes() calls from steps 1-2?
    - If stale: nodes[0].result === undefined (original idle state)

Scenario B: FIX-023 trigger sample data resume
  1. executeWorkflow starts, hits trigger node, no sample data
  2. Sets phase='ready', shows prompt
  3. User enters data, clicks "Use Data"
  4. setTimeout(() => executeWorkflowRef.current(), 100) fires

  Assert:
    - executeWorkflowRef.current is the LATEST function
    - triggerSampleData in the new closure contains user's data
    - Execution continues from trigger (not restarts from scratch)

Scenario C: FIX-094 auto-retry with new params
  1. Workflow fails at node 2 with "Missing: spreadsheet_id"
  2. phase = 'error'
  3. User types spreadsheet_id in error prompt, submits
  4. workflow.collectedParams changes -> E11 detects, sets flag
  5. setPhase('ready') -> E12 fires
  6. executeWorkflowRef.current() called

  Assert:
    - The executeWorkflow at call time includes new collectedParams
    - Node 1 is not re-executed (or handled gracefully)
    - spreadsheet_id appears in merged params at line 5547
```

### 4.3 Parameter Collection with Node Additions/Removals During Input

```
TEST: "Pre-flight questions remain valid when workflow structure changes"

Setup:
  - Initial workflow: [Gmail trigger, Slack send, Google Sheets write]
  - Pre-flight generates questions for Slack (channel) and Sheets (spreadsheet_id)

Scenario A: User answers while orchestration is in-flight
  1. Pre-flight effect (E3) starts async orchestration for all nodes
  2. User answers "channel = #general" while orchestration is fetching Sheets schema
  3. collectedParams changes -> E3 re-runs
  4. Previous async run returns and calls setPreFlightResult
  5. New async run also starts and will call setPreFlightResult

  Assert:
    - No duplicate "channel" question after race resolves
    - FIX-103 semantic dedup catches both runs' output
    - User's answer (#general) is not lost

Scenario B: Question index out of bounds
  1. Pre-flight has 3 questions, user is on question 2 (index 1)
  2. collectedParams changes -> pre-flight re-runs
  3. New result has only 1 question (2 were answered)
  4. currentQuestionIndex is still 1, but questions.length is 1

  Assert:
    - FIX-054 (E4) resets currentQuestionIndex to 0
    - currentPreFlightQuestion (M3) returns valid question, not undefined
    - Quick Setup panel does not disappear

Scenario C: Dry-run validation adds questions after pre-flight complete
  1. Pre-flight questions all answered -> isPreFlightComplete === true
  2. FIX-118 dry-run (E5) discovers additional missing params
  3. New questions added to preFlightResult

  Assert:
    - Quick Setup UI re-appears with new questions
    - Previously answered params are not re-asked
    - dryRunCompletedRef prevents re-running for same param set
```

---

## 5. Proposed Extraction Order (Minimizing Closure Risk)

### Guiding Principles

1. **Extract stateless logic first** - Pure functions with no closure risk
2. **Extract self-contained hooks next** - Hooks whose deps are fully within their scope
3. **Extract coupled hooks LAST** - Hooks that share refs and cross-reference each other
4. **Never split a ref from ALL its consumers** - A ref and every hook/callback that reads/writes it must move together

### Phase 3: Safe Extractions (LOW closure risk)

| Order | Hook(s) | Target Custom Hook | Risk | Reason |
|-------|---------|-------------------|------|--------|
| 3.1 | M1, M2 | `useRequiredIntegrations(workflow.nodes)` | NONE | Pure derivation, no closures |
| 3.2 | M3, M4, M5, M6 | `useWorkflowDerivedState(preFlightResult, currentQuestionIndex, nodes, phase)` | NONE | Pure derivation |
| 3.3 | C5, C6, C16 | (inline, too small to extract) | NONE | No captured state |
| 3.4 | C1, C2, C3, C4 | Stay in MiniNode sub-components | NONE | Already scoped to sub-components |
| 3.5 | E1, E2 | `useWorkflowSync(workflow)` | LOW | Only captures workflow prop (stable from parent) |

### Phase 4A: OAuth Hooks (MEDIUM closure risk)

| Order | Hook(s) + Refs | Target Custom Hook | Risk | Key Concern |
|-------|---------------|-------------------|------|-------------|
| 4A.1 | E6, C10, C11, C12, C13, E7 + shouldAutoExecuteRef, checkedIntegrationsKeyRef | `useOAuthFlow(requiredIntegrations, addLog)` | **MEDIUM-HIGH** | handleConnect polling captures stale authState (line 4705). FIX: Refactor polling to use functional updates exclusively. Move all authState reads inside `setAuthState(prev => ...)` |
| 4A.2 | C7, C8, whatsAppState | `useWhatsAppConnection(whatsAppIntegrations, addLog)` | LOW | Self-contained, only uses addLog |

### Phase 4B: Execution Hooks (HIGH closure risk - extract together as atomic unit)

| Order | Hook(s) + Refs | Target Custom Hook | Risk | Key Concern |
|-------|---------------|-------------------|------|-------------|
| 4B.1 | **C14, E8, E9, E10, E11, E12** + **executeWorkflowRef, pendingAutoRetryRef, prevCollectedParamsRef, shouldAutoExecuteRef, nodeRetryCounts** | `useWorkflowExecution(...)` | **HIGH** | This is the FIX-023 + FIX-094 danger zone. ALL of these MUST move together. The ref-to-callback sync pattern (E8) MUST stay co-located with every consumer (E12, JSX handlers). |

**CRITICAL CONSTRAINT for 4B.1:** The JSX handlers at lines 6164-6183 that call `executeWorkflowRef.current()` must receive `executeWorkflowRef` from the custom hook's return value. The ref must be the SAME object, not a copy.

### Phase 4C: Pre-flight Hooks (MEDIUM-HIGH closure risk)

| Order | Hook(s) + Refs | Target Custom Hook | Risk | Key Concern |
|-------|---------------|-------------------|------|-------------|
| 4C.1 | E3, E4, E5, C9 + dryRunCompletedRef, orchestrationResults, preFlightResult, preFlightAnswers, currentQuestionIndex, collectedParams (local) | `usePreFlightCheck(workflow, authState.connectedIntegrations)` | **MEDIUM-HIGH** | E3's async IIFE can race with itself when deps change. The `collectedParams` captured by the closure may be stale. Must ensure cleanup (abort controller) to cancel in-flight orchestration when deps change. |

### Extraction Dependency Graph

```
useRequiredIntegrations (3.1)
    |
    v
useWhatsAppConnection (4A.2) --- useOAuthFlow (4A.1)
    |                                |
    +--- addLog ---+                 +--- shouldAutoExecuteRef --+
                   |                                              |
                   v                                              v
              usePreFlightCheck (4C.1) --------> useWorkflowExecution (4B.1)
                   |                                  |
                   +--- collectedParams ------------->+
                   +--- orchestrationResults -------->+
                   +--- preFlightResult ------------->+ (for dry-run)
```

**The arrow from usePreFlightCheck to useWorkflowExecution is the most dangerous boundary.** The execution hook needs `orchestrationResults` from the pre-flight hook, and the pre-flight hook reads `collectedParams` which the execution hook's error recovery modifies. This bidirectional dependency is the primary source of stale closure risk.

---

## 6. Recommendations

### 6.1 Fix the Known Stale Closure Bug in handleConnect

Line 4705 should be moved inside the `setAuthState(prev => ...)` functional update:
```typescript
// CURRENT (stale):
const newConnected = new Set(authState.connectedIntegrations)
// FIX (fresh):
setAuthState((prev) => {
  const newConnected = new Set(prev.connectedIntegrations)
  // ... rest of logic using prev
})
```

### 6.2 Add AbortController to Pre-flight Effect (E3)

The async IIFE in E3 should respect an abort signal to prevent stale results from overwriting fresh ones:
```typescript
React.useEffect(() => {
  const controller = new AbortController()
  const runPreFlightCheck = async () => {
    // Check controller.signal.aborted before each setPreFlightResult/setOrchestrationResults
  }
  runPreFlightCheck()
  return () => controller.abort()
}, [deps])
```

### 6.3 For Phase 4B Extraction: Return Refs, Not Functions

When extracting `useWorkflowExecution`, the hook must return:
```typescript
return {
  executeWorkflow,        // The callback
  executeWorkflowRef,     // The ref (for setTimeout consumers)
  phase,
  nodes,
  executionLog,
  resetWorkflow,
  // ... other state
}
```

The ref MUST be returned so JSX can do `executeWorkflowRef.current()` in setTimeout handlers. Returning only the callback would reintroduce the stale closure bug that FIX-023 fixed.

### 6.4 Consider useReducer for Execution State

The interplay between `phase`, `nodes`, `executionLog`, and `collectedParams` creates a web of dependencies. A `useReducer` would make state transitions explicit and eliminate several closure risks:
```typescript
type ExecutionAction =
  | { type: 'START_EXECUTION' }
  | { type: 'NODE_STATUS_UPDATE', nodeIndex: number, status: NodeStatus }
  | { type: 'EXECUTION_COMPLETE', success: boolean }
  | { type: 'PARAM_COLLECTED', key: string, value: string }
  | { type: 'RETRY_WITH_PARAMS' }
```

This would eliminate the need for FIX-094's two-phase ref pattern entirely.

---

## 7. Summary of Closure Risk by Extraction Target

| Extraction | Risk Level | Stale State Vectors | Mitigation Strategy |
|------------|-----------|--------------------|--------------------|
| useRequiredIntegrations | NONE | None | Pure derivation |
| useWorkflowDerivedState | NONE | None | Pure derivation |
| useWorkflowSync | LOW | workflow prop | Stable from parent |
| useWhatsAppConnection | LOW | addLog (stable) | Already safe |
| useOAuthFlow | **HIGH** | authState in polling closures | Refactor to functional updates + AbortController |
| useWorkflowExecution | **CRITICAL** | nodes, phase, collectedParams, triggerSampleData across setTimeout | Keep FIX-023 ref pattern, extract as atomic unit, return refs |
| usePreFlightCheck | **MEDIUM-HIGH** | collectedParams, orchestrationResults during async ops | Add AbortController, prevent stale writes |

**Bottom line:** Phases 3.1-3.5 are safe to extract immediately. Phase 4B (execution) is the highest-risk extraction and must be done as a single atomic unit preserving ALL ref patterns. The handleConnect polling bug (line 4705) should be fixed BEFORE extraction.

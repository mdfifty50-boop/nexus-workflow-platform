# Cycle 2 - Agent 4: WorkflowPreviewCard Dependency Map & Refactor Plan

**File:** `nexus/src/components/chat/WorkflowPreviewCard.tsx`
**Total Lines:** 7,083
**Fix Markers Found:** 60+ (`@NEXUS-FIX-xxx` markers throughout)
**Date:** 2026-02-15

---

## 1. COMPLETE SECTION MAP

### Section A: Imports and Feature Flags (Lines 1-172)
- **Lines 1-73:** Imports from React, react-router-dom, lucide-react, internal services
- **Lines 75-112:** Feature flags (`USE_GENERIC_ORCHESTRATION`, `USE_ORCHESTRATION_FIRST`)
- **Lines 114-172:** `OrchestrationResult` interface and `resolveToolViaOrchestration()` async function

### Section B: Types and Interfaces (Lines 174-379)
- **Lines 174-204:** `isToolkitKnown()` function with alias resolution
- **Lines 206-265:** Type definitions: `NodeStatus`, `CardPhase`, `WorkflowNode`, `MissingInfoItem`, `PARAM_ALIASES`
- **Lines 267-327:** Semantic param deduplication functions (`isParamSemanticallyCollected`, `getCanonicalParamName`)
- **Lines 329-379:** Component prop interfaces: `ChatWorkflow`, `WorkflowPreviewCardProps`, `AuthState`, `ParallelAuthState`

### Section C: Static Constants and Icon Mapping (Lines 381-418)
- **Lines 381-412:** `statusColors` and `integrationIcons` dictionaries
- **Lines 414-418:** `getIcon()` helper

### Section D: Tool Slug Mapping Engine (Lines 420-1356)
- **Lines 420-881:** `TOOL_SLUGS` -- massive static mapping (60+ integrations, ~400 action mappings)
- **Lines 883-1005:** `ACTION_KEYWORDS` -- natural language verb-to-action mapping
- **Lines 1007-1084:** `getFallbackTools()`, `validateToolSlug()`, `isToolNotFoundError()` (FIX-019, FIX-020)
- **Lines 1086-1229:** `mapNodeToToolSlug()` -- 4-layer resolution strategy
- **Lines 1231-1356:** `constructDynamicToolSlug()`, `constructGenericToolSlug()` -- dynamic slug builders

### Section E: Parameter Resolution Engine (Lines 1358-1797)
- **Lines 1358-1650:** `getDefaultParams()` -- smart defaults for 30+ tools with flow data from previous nodes
- **Lines 1652-1730:** `validateRequiredParams()` -- required param definitions for ~30 tools
- **Lines 1732-1797:** `extractIdFromUrl()` -- URL-to-ID extraction for Google Sheets, Notion, GitHub, etc. (FIX-118)

### Section F: Sub-Components (Lines 1799-2940)
- **Lines 1799-1926:** `NodeTooltip` -- hover/tap tooltip for node details
- **Lines 1928-2050:** `MiniNodeHorizontal` -- desktop/unified node rendering (FIX-099, FIX-103, FIX-121)
- **Lines 2052-2174:** `MiniNodeVertical` -- vertical layout (currently unused, kept for future)
- **Lines 2176-2371:** `AuthPrompt` -- sequential OAuth connection UI with polling
- **Lines 2373-2562:** `ParallelAuthPrompt` -- parallel OAuth "Connect All" UI (FIX-003, UX-003)
- **Lines 2564-2763:** `MissingInfoSection` -- parameter collection with custom input (FIX-105, FIX-108)
- **Lines 2765-2940:** `TriggerSampleDataPrompt` -- beta test trigger data collection (UX-002)

### Section G: Parameter Mapping Helpers (Lines 2942-3266)
- **Lines 2942-3110:** `mapCollectedParamsToToolParams()` -- user answers to API params (FIX-029, FIX-050, FIX-097, FIX-118)
- **Lines 3112-3266:** New architecture integration wrappers (`resolveToolWithOrchestration`, `_resolveToolSlugWithRegistry`, `_resolveParamsWithPipeline`, `_getEnhancedMissingParams`) (FIX-042, FIX-043)

### Section H: Validation Engine (Lines 3268-3520)
- **Lines 3268-3341:** Validation types (`NodeValidation`, `WorkflowValidation`)
- **Lines 3342-3433:** `validateWorkflowBeforeExecution()` -- intent-driven pre-execution check
- **Lines 3435-3520:** `getParamFixSuggestion()` -- human-readable prompts per toolkit per param

### Section I: Main Component State (Lines 3522-3675)
- **Lines 3526-3534:** Component function signature, `useNavigate`
- **Lines 3537-3669:** All `useState` and `useRef` declarations (see inventory below)

### Section J: OAuth Connection Logic (Lines 3676-5238)
- **Lines 3676-3696:** WhatsApp vs OAuth integration splitting (`useMemo`)
- **Lines 3698-3751:** `addLog`, `checkWhatsAppStatus`, `handleWhatsAppConnected`
- **Lines 3753-4202:** Pre-flight check `useEffect` with orchestration discovery (FIX-033, FIX-055, FIX-059, FIX-074)
- **Lines 4204-4268:** Pre-flight answer handler and question index reset
- **Lines 4454-4512:** OAuth callback message listener `useEffect`
- **Lines 4514-4609:** `checkConnections()` -- Rube API connection check
- **Lines 4611-4640:** Auto-check connections on mount (FIX-045)
- **Lines 4642-4825:** `handleConnect()` -- sequential OAuth flow with popup and polling
- **Lines 4827-5117:** `handleConnectAll()` -- parallel OAuth with popup blocker bypass (FIX-001, FIX-003)
- **Lines 5119-5238:** `handleConnectSingle()` -- single integration connect from parallel UI

### Section K: Execution Engine (Lines 5240-5866)
- **Lines 5240-5782:** `executeWorkflow()` -- the core execution loop (FIX-041, FIX-062, FIX-110, FIX-111, FIX-112, FIX-113)
- **Lines 5784-5808:** Auto-execute effects (mount, post-auth)
- **Lines 5810-5866:** Auto-retry after error recovery (FIX-026, FIX-094)

### Section L: Render/JSX (Lines 5868-7066)
- **Lines 5868-5917:** Utility callbacks (`openFullView`, `resetWorkflow`), computed values
- **Lines 5920-7064:** JSX render tree (header, WhatsApp prompt, auth prompts, visualization, progress, pre-flight questions, execute button, error display, success celebration)

### Section M: Exports (Lines 7067-7083)
- Default export and `NewArchitectureHelpers` export for testing

---

## 2. STATE VARIABLE INVENTORY

### useState Hooks (28 total)
| Variable | Type | Line | Purpose |
|----------|------|------|---------|
| `phase` | `CardPhase` | 3538 | Overall card lifecycle state |
| `_executionLog` | `string[]` | 3539 | Execution log messages |
| `_workflowValidation` | `WorkflowValidation \| null` | 3542 | Pre-execution validation result |
| `triggerSampleData` | `Record<string, Record<string, string>>` | 3546 | Trigger node beta test data |
| `showTriggerDataPrompt` | `boolean` | 3547 | Show trigger data collection |
| `currentTriggerNode` | `string \| null` | 3548 | Active trigger prompt node ID |
| `preFlightResult` | `PreFlightResult \| null` | 3557 | Pre-flight validation result |
| `_preFlightAnswers` | `Record<string, string>` | 3558 | Pre-flight answer tracking |
| `currentQuestionIndex` | `number` | 3562 | Current pre-flight question |
| `preFlightInputValue` | `string` | 3563 | Pre-flight input field value |
| `preFlightError` | `string \| null` | 3564 | Pre-flight validation error |
| `showPreFlight` | `boolean` | 3565 | Show pre-flight UI |
| `collectedParams` | `Record<string, string>` | 3567 | Local params collected from user |
| `orchestrationResults` | `Map<string, OrchestrationResult>` | 3602 | Orchestration discovery results |
| `isLoadingOrchestration` | `boolean` | 3603 | Orchestration loading state |
| `nodes` | `WorkflowNode[]` | 3606 | Workflow node state with status |
| `selectedNodeId` | `string \| null` | 3617 | Selected node for detail panel |
| `authState` | `AuthState` | 3637 | OAuth sequential auth state |
| `parallelAuthState` | `ParallelAuthState` | 3648 | OAuth parallel auth state |
| `isParallelMode` | `boolean` | 3649 | Parallel vs sequential auth |
| `whatsAppState` | `{needed, connected, showPrompt}` | 3653 | WhatsApp connection state |
| `showEditPanel` | `boolean` | 3660 | Node editing panel visibility |
| `executionMode` | `'beta' \| 'production'` | 3669 | Beta test vs production mode |

### useRef Hooks (8 total)
| Variable | Type | Line | Purpose |
|----------|------|------|---------|
| `pendingErrorInputRef` | `{field, value} \| null` | 3553 | Pending error input for retry |
| `shouldAutoExecuteRef` | `boolean` | 3663 | Auto-execute after auth flag |
| `executeWorkflowRef` | `() => Promise<void>` | 3666 | Latest executeWorkflow ref (stale closure fix) |
| `checkedIntegrationsKeyRef` | `string \| null` | 4616 | Track checked integrations |
| `nodeRetryCounts` | `Map<string, number>` | 5241 | Retry counts per node |
| `prevCollectedParamsRef` | `string \| null` | 5814 | Previous params for change detection |
| `pendingAutoRetryRef` | `boolean` | 5815 | Pending auto-retry flag |
| `dryRunCompletedRef` | `string \| null` | 4295 | Dry-run fingerprint tracking |

### useMemo Hooks (5 total)
| Variable | Line | Purpose |
|----------|------|---------|
| `requiredIntegrations` | 3672 | Integrations needed for workflow |
| `{whatsAppIntegrations, oauthIntegrations}` | 3680 | Split WhatsApp from OAuth integrations |
| `currentPreFlightQuestion` | 4271 | Active pre-flight question |
| `isPreFlightComplete` | 4282 | Whether all pre-flight questions answered |
| `allVerified` / `unverifiedCount` | 5897/5910 | Verification status counts |

### useCallback Hooks (10 total)
| Function | Line | Dependencies |
|----------|------|-------------|
| `addLog` | 3699 | `[]` |
| `checkWhatsAppStatus` | 3704 | `[whatsAppIntegrations.length, addLog]` |
| `handleWhatsAppConnected` | 3744 | `[addLog, authState.pendingIntegrations.length]` |
| `handlePreFlightAnswer` | 4221 | `[preFlightResult, currentQuestionIndex, onMissingInfoSelect]` |
| `checkConnections` | 4516 | `[oauthIntegrations, whatsAppIntegrations, checkWhatsAppStatus, addLog]` |
| `handleConnect` | 4643 | `[authState, addLog]` |
| `handleConnectAll` | 4831 | `[authState.pendingIntegrations, addLog]` |
| `handleConnectSingle` | 5120 | `[authState, addLog]` |
| `executeWorkflow` | 5244 | `[phase, requiredIntegrations.length, nodes, checkConnections, addLog, onExecutionComplete, triggerSampleData]` |
| `handleNodeSelect` | 3618 | `[]` |
| `openFullView` | 5869 | `[navigate, workflow]` |
| `resetWorkflow` | 5882 | `[]` |

### useEffect Hooks (10 total)
| Line | Purpose | Dependencies |
|------|---------|-------------|
| 3576 | Sync parent collectedParams to local state (FIX-068) | `[workflow.collectedParams]` |
| 3624 | Run validation on mount/change | `[workflow.nodes]` |
| 3757 | Pre-flight check with orchestration (FIX-033/055/059/074) | `[workflow.nodes, collectedParams, authState.connectedIntegrations, orchestrationResults]` |
| 4209 | Reset question index on questions change (FIX-054) | `[preFlightResult?.questions.length, currentQuestionIndex]` |
| 4297 | Dry-run validation gate (FIX-118) | `[preFlightResult, collectedParams, phase, workflow, orchestrationResults]` |
| 4455 | OAuth callback message listener | `[addLog]` |
| 4617 | Auto-check connections on mount (FIX-045) | `[requiredIntegrations, checkConnections]` |
| 5785 | Keep executeWorkflowRef updated | `[executeWorkflow]` |
| 5790 | Auto-execute on mount | `[autoExecute, executeWorkflow]` |
| 5798 | Auto-execute after all integrations connect | `[phase, executeWorkflow, addLog]` |
| 5818 | Detect param change in error state (FIX-094 phase 1) | `[workflow.collectedParams, phase, addLog]` |
| 5852 | Execute pending auto-retry (FIX-094 phase 2) | `[phase]` |

---

## 3. FUNCTION INVENTORY GROUPED BY PROPOSED MODULE

### Module 1: VisualizationEngine (Node Rendering & Layout)
**Functions:**
- `getIcon()` (line 414) -- integration icon lookup
- `NodeTooltip` (line 1803) -- tooltip sub-component
- `MiniNodeHorizontal` (line 1932) -- horizontal node rendering
- `MiniNodeVertical` (line 2054) -- vertical node rendering (unused)

**Constants:**
- `statusColors` (line 385)
- `integrationIcons` (line 393)

**State required:** `nodes`, `selectedNodeId`, `handleNodeSelect`
**External dependencies:** lucide-react icons, `cn()`, `getIntegrationInfo()`

### Module 2: OAuthManager (Connection Management & Polling)
**Functions:**
- `checkConnections()` (line 4516)
- `handleConnect()` (line 4643) -- sequential OAuth
- `handleConnectAll()` (line 4831) -- parallel OAuth with popup blocker bypass
- `handleConnectSingle()` (line 5120)
- `checkWhatsAppStatus()` (line 3704)
- `handleWhatsAppConnected()` (line 3744)

**Sub-components:**
- `AuthPrompt` (line 2192) -- sequential auth UI
- `ParallelAuthPrompt` (line 2386) -- parallel auth UI
- `WhatsAppConnectionPrompt` (imported)

**State required:** `authState`, `parallelAuthState`, `isParallelMode`, `whatsAppState`, `phase` (write), `shouldAutoExecuteRef`
**External dependencies:** `rubeClient`, `getRequiredIntegrations()`, `getIntegrationInfo()`

### Module 3: ExecutionController (Workflow Execution & Step Management)
**Functions:**
- `executeWorkflow()` (line 5244) -- the core 540-line execution loop
- `resetWorkflow()` (line 5882)

**Helper functions it calls:**
- `mapNodeToToolSlug()` / `resolveToolViaOrchestration()` (tool resolution)
- `getDefaultParams()` / `mapCollectedParamsToToolParams()` (param resolution)
- `validateRequiredParams()` / `validateToolSlug()` (validation)
- `VerifiedExecutorService.execute()` (actual API execution)
- `WorkflowIntelligenceService.classifyError()` (error classification)
- `getFallbackTools()` / `isToolNotFoundError()` (error recovery)

**State required:** `phase`, `nodes`, `executionMode`, `triggerSampleData`, `collectedParams`, `orchestrationResults`, `nodeRetryCounts`
**External dependencies:** `rubeClient`, `VerifiedExecutorService`, `WorkflowIntelligenceService`, `getSchemaResolver()`, `userMemoryService`

### Module 4: ParameterCollector (User Input Collection & Param Resolution)
**Functions:**
- `handlePreFlightAnswer()` (line 4221)
- `mapCollectedParamsToToolParams()` (line 2953)
- `getDefaultParams()` (line 1367)
- `validateRequiredParams()` (line 1656)
- `getParamFixSuggestion()` (line 3438)
- `extractIdFromUrl()` (line 1735)
- `isParamSemanticallyCollected()` (line 269)
- `getCanonicalParamName()` (line 315)

**Sub-components:**
- `MissingInfoSection` (line 2569)
- `TriggerSampleDataPrompt` (line 2814)
- Pre-flight questions UI (embedded in JSX, lines 6277-6384)

**Constants:**
- `PARAM_ALIASES` (line 233)
- `TOOL_SLUGS` (line 426)
- `ACTION_KEYWORDS` (line 885)

**State required:** `preFlightResult`, `currentQuestionIndex`, `preFlightInputValue`, `preFlightError`, `showPreFlight`, `collectedParams`, `showTriggerDataPrompt`, `currentTriggerNode`, `triggerSampleData`

### Module 5: LogViewer (Execution Logs Display)
Currently the log system is minimal -- `addLog()` writes to `_executionLog` state, but logs are NOT rendered in the current JSX. The log viewer is effectively missing from the UI. This module would be the simplest extraction -- just a display component consuming the log array.

**State required:** `_executionLog` (read-only)

---

## 4. DEPENDENCY GRAPH (Which Functions Call Which)

```
executeWorkflow()
  |-- checkConnections()
  |     |-- checkWhatsAppStatus()
  |     |-- rubeClient.checkConnection()
  |-- getIntegrationInfo()
  |-- resolveToolViaOrchestration()
  |     |-- getOrchestrationService().orchestrate()
  |     |-- getSchemaResolver().getSchema()
  |     |-- createCollector()
  |-- mapNodeToToolSlug()
  |     |-- constructDynamicToolSlug()
  |     |-- constructGenericToolSlug()
  |-- isToolkitKnown()
  |-- getDefaultParams()
  |     |-- (reads extractedParams, node.config, flowData)
  |-- mapCollectedParamsToToolParams()
  |     |-- extractIdFromUrl()
  |-- validateRequiredParams()
  |-- validateToolSlug()
  |-- VerifiedExecutorService.execute()
  |-- WorkflowIntelligenceService.classifyError()
  |-- getFallbackTools()
  |-- isToolNotFoundError()
  |-- getParamFixSuggestion()

Pre-flight useEffect
  |-- PreFlightService.checkAsync() / .check()
  |-- resolveToolViaOrchestration()
  |-- isToolkitKnown()
  |-- mapNodeToToolSlug()
  |-- getSchemaResolver().getSchema()
  |-- createCollector()
  |-- isParamSemanticallyCollected()
  |-- getCanonicalParamName()

handlePreFlightAnswer()
  |-- PreFlightService.validateAnswer()
  |-- extractIdFromUrl()

handleConnectAll()
  |-- rubeClient.initiateConnection()
  |-- rubeClient.checkConnection()

MissingInfoSection
  |-- isParamSemanticallyCollected()
  |-- getCanonicalParamName()
```

---

## 5. PROPOSED MODULE BOUNDARIES WITH SHARED STATE ANALYSIS

### Shared State (Must Be Lifted or Passed via Context)

These state variables are accessed by 3+ proposed modules and must remain shared:

| State | Modules Using It | Strategy |
|-------|-----------------|----------|
| `phase` | All 5 | Lift to parent / context |
| `nodes` | Visualization, Execution, ParameterCollector | Lift to parent / context |
| `collectedParams` | ParameterCollector, Execution, Pre-flight | Lift to parent / context |
| `orchestrationResults` | ParameterCollector, Execution, Pre-flight | Lift to parent / context |
| `authState` | OAuthManager, Execution (checks connections) | OAuthManager owns, expose via callback |
| `addLog` | OAuthManager, Execution | Pass as callback |

### Module Ownership

**VisualizationEngine** owns:
- `selectedNodeId`, `handleNodeSelect`
- Receives `nodes` (read-only) and `phase` (read-only) as props

**OAuthManager** owns:
- `authState`, `parallelAuthState`, `isParallelMode`, `whatsAppState`
- `shouldAutoExecuteRef`, `checkedIntegrationsKeyRef`
- Exposes: `onAllConnected` callback, `checkConnections()` function, `connectedIntegrations` read accessor

**ExecutionController** owns:
- `executionMode`, `nodeRetryCounts`, `executeWorkflowRef`, `triggerSampleData`, `showTriggerDataPrompt`, `currentTriggerNode`
- `pendingAutoRetryRef`, `prevCollectedParamsRef`
- Receives: `nodes` (write via setter), `phase` (write via setter), `collectedParams`, `orchestrationResults`

**ParameterCollector** owns:
- `preFlightResult`, `preFlightAnswers`, `currentQuestionIndex`, `preFlightInputValue`, `preFlightError`, `showPreFlight`
- `isLoadingOrchestration`, `dryRunCompletedRef`
- Receives: `collectedParams` (write via setter), `orchestrationResults` (write via setter)

**LogViewer** owns: nothing. Receives `executionLog` as prop.

---

## 6. NATURAL SEAM LINES

The file has clear section separators using `// ============================================================================` comments. These are the natural split points:

1. **Lines 1-1797:** Pure functions and static data (tool mapping, param resolution, validation). These are STATELESS and can be extracted to utility modules with ZERO component coupling.

2. **Lines 1799-2940:** Sub-components (NodeTooltip, MiniNodeHorizontal, MiniNodeVertical, AuthPrompt, ParallelAuthPrompt, MissingInfoSection, TriggerSampleDataPrompt). These are SELF-CONTAINED UI components that receive all data via props.

3. **Lines 2942-3520:** Mapping/validation helpers. Also stateless, but heavily cross-referenced by the execution engine.

4. **Lines 3522-5866:** The main component with all state, effects, and callbacks. This is the HARDEST section to split because of deeply intertwined state dependencies.

5. **Lines 5920-7064:** JSX render tree. Can be decomposed into render sub-sections once state is properly managed.

---

## 7. MIGRATION RISK ASSESSMENT

### Low Risk Extractions (Do First)
1. **Static utility extraction** (Sections D, E, G, H) -- ~2400 lines of pure functions. Zero state coupling. Can be extracted to `workflow-tool-mapping.ts`, `workflow-param-resolution.ts`, `workflow-validation.ts`. **Risk: None.**

2. **Sub-component extraction** (Section F) -- ~1140 lines. Self-contained components receiving props. Extract to `WorkflowNodes.tsx`, `WorkflowAuthPrompts.tsx`, `WorkflowParameterUI.tsx`. **Risk: Minimal** -- just need to pass correct props.

3. **LogViewer** -- Nearly no code exists yet. Just define the interface. **Risk: None.**

### Medium Risk Extractions
4. **OAuthManager as custom hook** -- `useOAuthManager()` hook encapsulating all auth state and callbacks (~800 lines of logic). **Risk: Medium** -- the auth callbacks mutate `phase` and trigger `shouldAutoExecuteRef`, creating a feedback loop with ExecutionController. Need clean callback interfaces.

5. **ParameterCollector as custom hook** -- `useParameterCollector()` hook for pre-flight, orchestration, and question management (~600 lines). **Risk: Medium** -- the pre-flight useEffect (lines 3757-4202) is 445 lines long with deeply nested async logic, closure dependencies on orchestrationResults, and multiple feature flag branches. Refactoring this effect is the single hardest task.

### High Risk Extractions
6. **ExecutionController** -- the `executeWorkflow()` function alone is 540 lines with dependencies on 15+ state variables, 8+ external services, and complex error recovery logic. It reads AND writes `nodes`, `phase`, `orchestrationResults`, `triggerSampleData`, `collectedParams`. **Risk: High** -- this is the heart of the component. Any incorrect state synchronization will break workflow execution.

### Critical Risk: Fix Marker Preservation
The file contains 60+ `@NEXUS-FIX-xxx` markers. Each extraction MUST:
1. Preserve the marker comment at its new location
2. Update `FIX_REGISTRY.json` with the new file path
3. Run `/validate` after each extraction to confirm no markers were lost

### Critical Risk: Stale Closure Bugs
Several fixes (FIX-023, FIX-094) specifically address stale closure issues with `useCallback` and `useEffect`. Extracting to custom hooks changes closure boundaries and may reintroduce these bugs. Each extraction must be tested with the specific scenarios those fixes address:
- FIX-023: Trigger sample data prompt -> resume execution
- FIX-094: Error state -> param change -> auto-retry

---

## 8. RECOMMENDED EXTRACTION ORDER

1. **Phase 1 (Safe):** Extract ~2400 lines of static utilities to 3 files
   - `src/lib/workflow-tool-mapping.ts` (TOOL_SLUGS, ACTION_KEYWORDS, mapNodeToToolSlug, etc.)
   - `src/lib/workflow-param-resolution.ts` (getDefaultParams, validateRequiredParams, mapCollectedParamsToToolParams, etc.)
   - `src/lib/workflow-validation.ts` (validateWorkflowBeforeExecution, getParamFixSuggestion, etc.)

2. **Phase 2 (Safe):** Extract ~1140 lines of sub-components to 3 files
   - `src/components/chat/WorkflowNodes.tsx` (MiniNodeHorizontal, MiniNodeVertical, NodeTooltip)
   - `src/components/chat/WorkflowAuthPrompts.tsx` (AuthPrompt, ParallelAuthPrompt)
   - `src/components/chat/WorkflowParameterUI.tsx` (MissingInfoSection, TriggerSampleDataPrompt)

3. **Phase 3 (Medium):** Extract hooks
   - `src/hooks/useOAuthManager.ts` -- auth state and connection logic
   - `src/hooks/useParameterCollector.ts` -- pre-flight and question management

4. **Phase 4 (Hard):** Extract execution engine
   - `src/hooks/useWorkflowExecution.ts` -- executeWorkflow and retry logic

5. **Phase 5 (Finalize):** Main component becomes thin orchestrator (~500 lines)
   - Imports all modules
   - Manages shared state lifted to this level
   - Composes JSX from sub-components
   - Passes callbacks between hooks

**Estimated final file size after full extraction:** ~500 lines (from 7,083)
**Estimated total files created:** 8-9 new files
**Estimated lines preserved per marker:** All 60+ markers must be tracked

---

## 9. CONSTANTS AND DATA STRUCTURES SIZE ANALYSIS

| Data Structure | Lines | % of File | Module Target |
|---------------|-------|-----------|---------------|
| `TOOL_SLUGS` | 460 | 6.5% | workflow-tool-mapping.ts |
| `ACTION_KEYWORDS` | 120 | 1.7% | workflow-tool-mapping.ts |
| `PARAM_ALIASES` | 32 | 0.5% | workflow-param-resolution.ts |
| `smartDefaults` (in getDefaultParams) | 270 | 3.8% | workflow-param-resolution.ts |
| `requiredParams` (in validateRequiredParams) | 70 | 1.0% | workflow-param-resolution.ts |
| `integrationToPrimaryParam` | 30 | 0.4% | workflow-param-resolution.ts |
| `REVERSE_ALIASES` | 35 | 0.5% | workflow-param-resolution.ts |
| **Total static data** | **~1017** | **~14.4%** | |

Over 14% of the file is static data tables that can be trivially extracted with zero risk.

---

## 10. SUMMARY

WorkflowPreviewCard is a 7,083-line monolith that combines 5 distinct concerns: visualization, OAuth management, workflow execution, parameter collection, and log display. It contains 28 useState hooks, 8 useRef hooks, 12 useEffect hooks, and 10 useCallback hooks, plus 60+ protected fix markers.

The safest path forward extracts ~3,540 lines (50% of the file) in Phases 1-2 with zero risk -- these are pure functions and self-contained sub-components. The remaining ~3,540 lines in the main component require careful hook extraction in Phases 3-4, with particular attention to stale closure bugs (FIX-023, FIX-094) and the 445-line pre-flight useEffect.

The single highest-risk piece is `executeWorkflow()` at 540 lines -- it reads/writes 15+ state variables and calls 8+ external services. This function must be the last thing extracted and requires comprehensive integration testing afterward.

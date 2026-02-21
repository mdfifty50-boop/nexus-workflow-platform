# Cycle 2, Agent 8: Workflow Execution Pipeline Analysis -- ParamResolutionPipeline Wiring Plan

**Agent:** 8 (Workflow Execution Pipeline Analyst)
**Cycle:** 2 of 20
**Date:** 2026-02-15
**Scope:** Complete wiring plan for `ParamResolutionPipeline` into `WorkflowPreviewCard.executeWorkflow`

---

## 1. ParamResolutionPipeline: Complete API Documentation

**File:** `nexus/src/services/ParamResolutionPipeline.ts` (871 lines)
**Fix Marker:** `@NEXUS-FIX-043`
**Purpose:** Handles the COMPLETE parameter collection and mapping flow, fixing GAP 10 (maps ALL params, not just primary) and GAP 11 (defined merge priority).

### 1.1 Public Methods

| Method | Signature | Purpose |
|--------|-----------|---------|
| `getNeededParams` | `static getNeededParams(contract: ToolContract): { required: ParamDefinition[]; optional: ParamDefinition[]; all: ParamDefinition[] }` | Extracts ALL required and optional params from a ToolContract. Unlike the legacy system which only fetched the "primary" param, this returns everything. |
| `findParamValues` | `static findParamValues(contract: ToolContract, sources: ParamSources): Map<string, ResolutionStep>` | Searches all param sources in strict priority order: user_provided > node_config > workflow_context > auto_resolved > default. Returns a Map of paramName to ResolutionStep entries. |
| `resolveIds` | `static async resolveIds(steps: Map<string, ResolutionStep>, toolkit: string): Promise<Map<string, ResolutionStep>>` | Auto-resolves human-friendly values to API IDs (e.g., "general" to "C0123456789" for Slack). Uses caching with 5-minute TTL. Currently a stub -- logs intent but does not make actual Rube MCP calls. |
| `validate` | `static validate(steps: Map<string, ResolutionStep>, contract: ToolContract): ValidationResult` | Final validation gate: checks all required params are present, validates types (email, url, number, boolean), and produces `{ valid, errors[], warnings[] }`. |
| `resolve` | `static async resolve(contract: ToolContract, sources: ParamSources): Promise<ResolvedParams>` | **Main entry point.** Executes the full 4-step pipeline: getNeededParams, findParamValues, resolveIds, validate. Returns `{ params, resolutionSteps, isComplete, missingRequired, warnings }`. |
| `getMissingParamPrompts` | `static getMissingParamPrompts(contract: ToolContract, resolved: ResolvedParams): Array<{ param, displayName, prompt, inputType }>` | Generates user-friendly prompts for missing required params, suitable for building collection UI. |
| `mapCollectedParamsToToolParams` | `static mapCollectedParamsToToolParams(contract: ToolContract, collectedParams: Record<string, string \| Record<string, string>>): Record<string, unknown>` | Maps integration-keyed collected params to actual tool param names using ToolContract aliases. This is the critical GAP 10 fix -- the old system only mapped the primary param. |
| `mergeNewParams` | `static mergeNewParams(existing: ResolvedParams, newParams: Record<string, unknown>, contract: ToolContract): ResolvedParams` | Merges newly user-provided params into an existing ResolvedParams, giving new values highest priority. Used when user provides additional values after initial resolution attempt. |

### 1.2 Exported Types

- `ParamSource` -- union: `'user_provided' | 'node_config' | 'workflow_context' | 'auto_resolved' | 'default' | 'missing'`
- `ResolutionStep` -- tracking object per param: `{ paramName, displayName, source, originalValue, resolvedValue, wasTransformed, transformType?, required }`
- `ResolvedParams` -- pipeline output: `{ params, resolutionSteps, isComplete, missingRequired, warnings }`
- `ValidationResult` -- `{ valid, errors: ValidationError[], warnings }`
- `ValidationError` -- `{ param, message, type: 'missing' | 'invalid_type' | 'invalid_format' | 'out_of_range' }`
- `ParamSources` -- input bucket: `{ userProvided?, nodeConfig?, workflowContext?, connectionData? }`

### 1.3 ID Resolution Capabilities

The pipeline defines `ID_RESOLVERS` for six services:

| Resolver Key | Toolkit | Search Tool | What It Resolves |
|-------------|---------|-------------|-----------------|
| `slack_channel` | slack | `SLACK_LIST_CHANNELS` | Channel name to channel ID |
| `googlesheets_id` | googlesheets | `GOOGLESHEETS_FIND_SPREADSHEET` | Sheet URL/name to spreadsheet ID |
| `notion_page` | notion | `NOTION_SEARCH_PAGES` | Page name to page ID |
| `github_repo` | github | `GITHUB_LIST_USER_REPOS` | Repo name to full_name |
| `trello_board` | trello | `TRELLO_LIST_BOARDS` | Board name to board ID |
| `discord_channel` | discord | `DISCORD_LIST_CHANNELS` | Channel name to channel ID |

The `PARAM_TO_RESOLVER` maps 14 param names to these resolvers (e.g., `'channel' -> 'slack_channel'`, `'spreadsheet_id' -> 'googlesheets_id'`).

**Critical note:** The actual Rube MCP call is NOT yet implemented inside `resolveIds`. Line 509 says: `console.log('[ParamResolutionPipeline] Would resolve ${paramName}: "${originalValue}" via ${resolver.searchTool}')`. This is a stub.

### 1.4 Transform Functions

Eight transforms are defined: `email` (lowercase+trim), `channel_name` (strip #), `spreadsheet_url` (extract ID from Google Sheets URL), `json`, `csv_to_array`, `number`, `boolean`, `date` (ISO format). These are applied automatically when a ParamDefinition declares a `transform`.

### 1.5 Caching

Module-level `resolutionCache` (Map) with 5-minute TTL. Exported helpers: `getCachedResolution(key)` and `setCachedResolution(key, value)`.

### 1.6 Error Handling Approach

- Type validation errors are accumulated (not thrown) into `ValidationError[]`
- Missing required params are accumulated into `missingRequired: string[]`
- Transform failures silently keep the original value (line 416-418: `catch { }`)
- The `resolve()` method itself never throws -- it returns a `ResolvedParams` with `isComplete: false` when validation fails
- `findMatchingParam()` returns `null` on no match rather than throwing

### 1.7 External Dependencies

- `ToolContract` and `ParamDefinition` types from `./UnifiedToolRegistry`
- No direct Rube MCP calls (stub only)
- No React dependencies (pure service)
- No network calls currently

---

## 2. WorkflowPreviewCard executeWorkflow: Execution Flow Trace

**File:** `nexus/src/components/chat/WorkflowPreviewCard.tsx` (7084 lines)
**Function:** `executeWorkflow` (lines 5244-5782)

### 2.1 Current Execution Flow (Per Action Node)

The for-loop at line 5264 iterates all `nodes` sequentially. For each ACTION node (after skipping triggers, AI, and internal nodes), the following happens:

```
1. Tool Slug Resolution (lines 5454-5511)
   |-- Check orchestrationResults map for pre-discovered slug
   |-- If known toolkit: mapNodeToToolSlug() (legacy TOOL_SLUGS static mapping)
   |-- If unknown toolkit + USE_GENERIC_ORCHESTRATION: resolveToolViaOrchestration()
   |-- Final fallback: mapNodeToToolSlug() dynamic construction
   |-- FIX-063: Override orchestration slug with legacy for known toolkits
   |
2. Tool Validation (@NEXUS-FIX-019, line 5513-5519)
   |-- validateToolSlug() checks slug validity
   |
3. Parameter Assembly (lines 5530-5548)
   |-- getDefaultParams(toolSlug, node, previousNodeResults, workflowContext)
   |   ^^ Returns smart defaults: extractedParams > nodeConfig > inference > hardcoded
   |-- mapCollectedParamsToToolParams(collectedParams, toolkit, toolSlug)
   |   ^^ Maps integration-keyed user answers (e.g., {gmail: 'x@y.com'}) to API params ({to: 'x@y.com'})
   |-- Merge: { ...defaultParams, ...collectedToolParams }
   |
4. Missing Param Detection (lines 5550-5593)
   |-- If orchestration session exists: fetch schema from Composio, compare required
   |-- Fallback: validateRequiredParams() (hardcoded for ~30 tools)
   |-- If missing: throw Error with user-friendly prompts
   |
5. Connection Pre-Check (@NEXUS-FIX-115, lines 5595-5608)
   |-- Non-blocking check of OAuth connection status
   |
6. Execution via VerifiedExecutor (@NEXUS-FIX-041, lines 5610-5668)
   |-- VerifiedExecutorService.execute(toolSlug, params, context)
   |-- Returns VerifiedResult { success, verified, proof, executionTimeMs }
   |
7. Error Handling (lines 5669-5769)
   |-- Error classification for user-friendly messages
   |-- Auto-retry for transient errors (rate limit, network, timeout)
   |-- Continue-on-error for non-critical nodes
   |-- Fatal error: set phase='error', return
```

### 2.2 Where Parameters Are Currently Collected

Parameters flow in from multiple sources, assembled at lines 5530-5548:

1. **`getDefaultParams()`** (line 5533) -- 480+ lines of hardcoded smart defaults per tool slug. Merges:
   - `node.config.extractedParams` (Claude's analysis of user message)
   - `node.config` (explicit workflow node configuration)
   - Flow data from previous nodes (`previousNodeResults`)
   - Inference from workflow name/description
   - Hardcoded per-tool defaults (e.g., `SLACK_SEND_MESSAGE.channel: 'general'`)

2. **`mapCollectedParamsToToolParams()`** (line 5540) -- 120+ lines. Converts user-answered params:
   - Integration-to-primary-param mapping (e.g., `gmail -> 'to'`)
   - `nodeId.paramName` format extraction
   - Reverse alias mapping (FIX-050: `notification_details -> 'text'`)
   - Placeholder detection (FIX-097)

3. **Final merge:** `{ ...defaultParams, ...collectedToolParams }` -- user answers override defaults.

### 2.3 Where Tool Slugs Are Resolved

Tool slug resolution happens at lines 5454-5511 through three paths:

1. **Pre-flight orchestration results** (`orchestrationResults.get(node.id)`) -- from pre-execution discovery
2. **Legacy `TOOL_SLUGS` static mapping** via `mapNodeToToolSlug()` -- ~60 toolkits x ~5 actions each
3. **Runtime orchestration** via `resolveToolViaOrchestration()` -- for unknown toolkits

FIX-063 adds a critical override: even when orchestration found a slug, known toolkits always prefer the legacy `TOOL_SLUGS` mapping because orchestration results are "often wrong" for them.

### 2.4 Where ParamResolutionPipeline Would Be Inserted

The insertion point is clear: **lines 5530-5548**, replacing the current two-step assembly:

```typescript
// CURRENT (lines 5530-5548):
const defaultParams = getDefaultParams(toolSlug, node, previousNodeResults, ...)
const collectedToolParams = mapCollectedParamsToToolParams(...)
const params = { ...defaultParams, ...collectedToolParams }

// PROPOSED:
const { params, source, resolved } = await _resolveParamsWithPipeline(
  toolSlug, toolkit, node, collectedParams, workflowContext
)
// If resolved via pipeline, also use pipeline's missing param detection
```

The function `_resolveParamsWithPipeline` already exists at line 3223 (currently prefixed with `_` and `eslint-disable @typescript-eslint/no-unused-vars`). It is fully implemented but never called from `executeWorkflow`.

Similarly, `_getEnhancedMissingParams` at line 3275 would replace the current `validateRequiredParams()` / schema-based missing param check at lines 5550-5593.

---

## 3. DUPLICATE PARAM_ALIASES Inventory

Three separate copies of alias definitions exist across the codebase:

### 3.1 WorkflowPreviewCard.tsx (lines 233-265)

**Marker:** `@NEXUS-FIX-103`
**Format:** `Record<string, string[]>` -- bidirectional alias groups
**Count:** 15 canonical keys, 80+ alias entries
**Usage:** `isParamSemanticallycollected()` and `getCanonicalParamName()` for deduplication during param collection UI
**Notable entries:** `path` includes `dropbox_folder` (FIX-109/109b), phone-number aliases, name/title/subject cross-aliasing

### 3.2 PreFlightService.ts (lines 766-789)

**Marker:** `@NEXUS-FIX-050`
**Format:** `Record<string, string[]>` -- same shape as WorkflowPreviewCard
**Count:** 11 canonical keys, ~50 alias entries
**Usage:** Pre-flight validation to check if user-provided params satisfy requirements
**Divergence from WorkflowPreviewCard:**
- Missing: phone/phone_number aliases, path/folder aliases (FIX-109)
- Missing: list_id, task_id, board_id, project_id groups
- Has `channel_id` as separate canonical key (WorkflowPreviewCard has it as alias of `channel`)

### 3.3 ParamResolutionPipeline.ts (lines 179-205)

**Named:** `PARAM_TO_RESOLVER` (not PARAM_ALIASES but serves similar purpose)
**Format:** `Record<string, string>` -- maps param names to resolver types
**Count:** 14 entries mapping to 6 resolver types
**Divergence:** Fundamentally different structure. Maps to resolver keys, not to synonym groups.

### 3.4 Additional Alias-Like Structures

- **mapCollectedParamsToToolParams (WPC lines 3054-3080):** Contains `REVERSE_ALIASES` inline -- another 15+ mappings like `notification_details -> 'text'`, `slack_channel -> 'channel'`
- **UnifiedToolRegistry.ts:** ParamDefinition has `aliases?: string[]` field per param. The registry's `resolveParamAlias()` method (line 1653) traverses these.
- **WorkflowIntelligenceService.ts (line 120):** Has its own `resolveParameterAlias()` method.

### 3.5 Drift Analysis

The three PARAM_ALIASES copies have drifted significantly:

| Alias Group | WPC (FIX-103) | PreFlight (FIX-050) | Pipeline (PARAM_TO_RESOLVER) |
|-------------|---------------|---------------------|------------------------------|
| text/message | 8 aliases | 8 aliases (different set) | N/A |
| to/recipient | 6 aliases | 5 aliases | N/A |
| channel | 4 aliases | 3 aliases | 3 entries |
| spreadsheet_id | 6 aliases | 4 aliases | 4 entries |
| path/folder | 8 aliases (FIX-109) | 4 aliases | N/A |
| phone | 5 aliases | absent | N/A |
| board_id | 3 aliases | absent | 1 entry |

This drift means the same workflow can pass pre-flight validation but fail in execution (or vice versa) because aliases are resolved differently at each stage.

---

## 4. Defensive Wrapper Design

### 4.1 The Core Wrapper

The existing `_resolveParamsWithPipeline` function (lines 3223-3266) already implements the correct defensive pattern:

```typescript
async function resolveParamsWithPipeline(
  toolSlug, toolkit, node, collectedParams, workflowContext
) {
  try {
    // 1. Get ToolContract from UnifiedToolRegistry
    const resolution = UnifiedToolRegistryService.resolveToolContract(toolkit, action)
    if (!resolution?.success) throw new Error('No contract found')

    // 2. Run ParamResolutionPipeline.resolve()
    const resolved = await ParamResolutionPipeline.resolve(contract, sources)

    // 3. Return pipeline results
    if (resolved.missingRequired.length === 0 || Object.keys(resolved.params).length > 0) {
      return { params: resolved.params, source: 'pipeline', resolved }
    }
  } catch (e) {
    console.debug('[FIX-043] Pipeline failed, falling back to legacy:', e)
  }

  // 4. FALLBACK: exact current behavior
  const defaultParams = getDefaultParams(...)
  const collectedToolParams = mapCollectedParamsToToolParams(...)
  return { params: { ...defaultParams, ...collectedToolParams }, source: 'legacy', resolved: null }
}
```

### 4.2 Failure Modes and Mitigations

| Failure Mode | Impact | Mitigation |
|-------------|--------|------------|
| ToolContract not found in UnifiedToolRegistry | Pipeline cannot determine needed params | Fallback to legacy `getDefaultParams` + `mapCollectedParamsToToolParams`. UnifiedToolRegistry only covers ~30 toolkits; legacy TOOL_SLUGS covers ~60. |
| Pipeline returns `isComplete: false` with no params | Would pass empty params to executor | Check: if `Object.keys(resolved.params).length === 0` AND there are missingRequired, use legacy path. The existing code at line 3251 already handles this. |
| `resolveIds()` throws or hangs | Async operation blocks execution | resolveIds is currently a stub (console.log only). When implementing real API calls, add: (a) per-call timeout of 5s, (b) try/catch per resolver, (c) fallback to passing the raw name if resolution fails. |
| Type validation too strict | Rejects params that legacy would accept | Pipeline's `validateType()` only checks email, url, number, boolean. If it rejects a value, the error is accumulated in `ValidationResult.errors` but the `resolve()` method still returns the value in `params`. Non-blocking. |
| ToolContract has wrong/outdated param definitions | Pipeline maps to wrong param names | The fallback to legacy already exists. Additionally, the pipeline's `mapCollectedParamsToToolParams` checks both contract aliases AND direct passthrough of unknown keys (line 732). |
| Cache returns stale ID resolution | Wrong channel/sheet ID sent to API | 5-minute TTL is reasonable. Could add a cache-bust flag for retry scenarios. |

### 4.3 User-Friendly Error Messages

When the pipeline identifies missing params, `_getEnhancedMissingParams()` (line 3275) converts them to user-friendly prompts by:

1. Using the `ResolutionStep.displayName` from the pipeline (e.g., "Recipient Email" instead of "to")
2. Falling back to `getParamFixSuggestion(paramName, toolkit)` which returns natural-language questions (e.g., "Who should receive this email?")
3. Including `inputType` for proper UI rendering (email field, text area, etc.)

The current `throw new Error('Missing Information: ...')` pattern at line 5588-5592 would be preserved but enriched:

```
CURRENT: "Missing Information: Send Email [param:to]\n\nI need more details..."
PROPOSED: Same format, but with richer param metadata from pipeline
```

### 4.4 Logging and Observability

The wrapper should log which path was taken:

```typescript
if (source === 'pipeline') {
  console.log(`[FIX-043] Pipeline resolved ${Object.keys(params).length} params for ${toolSlug}`)
  console.log(`[FIX-043] Steps: ${resolved.resolutionSteps.map(s => `${s.paramName}:${s.source}`).join(', ')}`)
} else {
  console.log(`[FIX-043] Legacy resolved params for ${toolSlug} (pipeline unavailable)`)
}
```

The `formatResolutionSteps()` and `summarizeResolution()` debug utilities (lines 850-870) are already exported for this purpose.

---

## 5. Integration Plan: Step-by-Step Wiring

### Phase A: Rename and Enable (Minimal Change)

1. Remove the `_` prefix from `_resolveParamsWithPipeline` (line 3223)
2. Remove the `eslint-disable` on line 3222
3. In `executeWorkflow`, replace lines 5530-5548 with a call to the renamed function
4. Preserve the exact same `params` merge result for the fallback path

### Phase B: Replace Missing Param Detection

1. Remove the `_` prefix from `_getEnhancedMissingParams` (line 3275)
2. In `executeWorkflow`, replace lines 5550-5593 with:
   ```typescript
   let missingParams: string[] = []
   if (source === 'pipeline' && resolved) {
     missingParams = resolved.missingRequired
   } else {
     // Existing schema-based or hardcoded validation
     // ... lines 5554-5575 unchanged ...
   }
   ```

### Phase C: Wire Real ID Resolution (Future)

1. Implement actual Rube MCP calls in `resolveIds()` using `RUBE_MULTI_EXECUTE_TOOL`
2. Add timeout and fallback per resolver
3. Wire through the sessionId from orchestrationResults

### Phase D: Consolidate PARAM_ALIASES (Future)

1. Create a single `CanonicalAliases.ts` module
2. Import it in WorkflowPreviewCard, PreFlightService, and ParamResolutionPipeline
3. Ensure all three files use the same alias set

---

## 6. Test Plan

### 6.1 Unit Tests for ParamResolutionPipeline

```
test-param-resolution-pipeline.ts:

1. getNeededParams returns all required + optional
   - Input: ToolContract with 3 required, 2 optional params
   - Assert: required.length === 3, optional.length === 2, all.length === 5

2. findParamValues respects priority order
   - Input: same param "channel" in user_provided AND node_config
   - Assert: source === 'user_provided' (highest priority wins)

3. findParamValues resolves aliases
   - Input: ParamDefinition with name='to', aliases=['recipient']
   - Source: userProvided has {recipient: 'x@y.com'} but NOT {to: ...}
   - Assert: resolvedValue === 'x@y.com', source === 'user_provided'

4. validate catches missing required params
   - Input: steps with required param at source='missing'
   - Assert: valid === false, errors contains 'missing' type

5. validate accepts optional missing params
   - Input: steps with optional param at source='missing'
   - Assert: valid === true, no errors

6. mapCollectedParamsToToolParams maps integration-keyed values
   - Input: contract for gmail, collectedParams: {gmail: 'x@y.com'}
   - Assert: result === {to: 'x@y.com'}

7. mapCollectedParamsToToolParams maps multi-param objects
   - Input: contract for gmail, collectedParams: {gmail: {to: 'x@y.com', subject: 'Hi'}}
   - Assert: result === {to: 'x@y.com', subject: 'Hi'}

8. resolve end-to-end with complete params
   - Input: ToolContract for SLACK_SEND_MESSAGE, sources with channel and text
   - Assert: isComplete === true, missingRequired === []

9. resolve end-to-end with missing params
   - Input: ToolContract for GMAIL_SEND_EMAIL, sources with subject but no 'to'
   - Assert: isComplete === false, missingRequired includes display name for 'to'

10. mergeNewParams overrides with user values
    - Input: existing resolved with default channel='general', new {channel: 'engineering'}
    - Assert: params.channel === 'engineering', source === 'user_provided'
```

### 6.2 Integration Tests for Wiring

```
test-pipeline-wiring.ts:

11. Wrapper falls back to legacy when ToolContract missing
    - Mock UnifiedToolRegistryService.resolveToolContract to return null
    - Assert: source === 'legacy', getDefaultParams and mapCollectedParamsToToolParams called

12. Wrapper uses pipeline when ToolContract found
    - Provide valid ToolContract, complete params
    - Assert: source === 'pipeline'

13. Wrapper falls back on pipeline exception
    - Mock ParamResolutionPipeline.resolve to throw
    - Assert: source === 'legacy', no user-visible error

14. Missing params produce user-friendly prompts
    - Pipeline returns missingRequired: ['to']
    - Assert: error message contains friendly text, not raw param name

15. Collected params from user override defaults correctly
    - Pipeline receives both nodeConfig defaults and userProvided
    - Assert: userProvided value appears in final params
```

### 6.3 End-to-End Workflow Tests

```
test-e2e-workflows.ts:

16. "Send email via Gmail" -- pipeline resolves {to, subject, body}
17. "Post to Slack channel" -- pipeline resolves {channel, text}
18. "Save to Google Sheet" -- pipeline resolves {spreadsheet_id, values}
19. "Create GitHub issue" -- pipeline resolves {owner, repo, title, body}
20. Unknown toolkit (e.g., "freshdesk") -- falls back to legacy gracefully
21. Retry after user provides missing param -- mergeNewParams works correctly
```

### 6.4 Regression Tests (Protecting Existing Fixes)

```
test-regression.ts:

22. FIX-017: "Save to Dropbox" still maps to DROPBOX_UPLOAD_FILE (not affected by pipeline wiring)
23. FIX-029: Integration-keyed params still correctly mapped in legacy fallback
24. FIX-050: Reverse alias mapping (notification_details -> text) still works
25. FIX-097: Placeholder detection still blocks overwriting valid values
26. FIX-103: Semantic deduplication (isParamSemanticallycollected) still prevents duplicate questions
27. FIX-109: Path/folder aliases still bidirectional
28. FIX-111: Auto-retry for transient errors still works after pipeline integration
29. FIX-113: Previous node results still flow to getDefaultParams in legacy path
```

---

## 7. Risk Assessment

### 7.1 Low Risk

- The `_resolveParamsWithPipeline` wrapper already exists and has correct fallback logic
- The import of ParamResolutionPipeline is already present (line 45)
- The function is already tested via `NewArchitectureHelpers` export (line 7080)
- No changes needed to VerifiedExecutor or the execution path downstream of param assembly

### 7.2 Medium Risk

- **PARAM_ALIASES drift:** Pipeline uses ToolContract aliases (from UnifiedToolRegistry) which may not match the inline PARAM_ALIASES in WorkflowPreviewCard. A param that passes deduplication in the UI could be unrecognized by the pipeline's findMatchingParam().
- **resolveIds stub:** When eventually implemented, the async ID resolution adds latency and a new failure mode mid-execution.
- **ToolContract coverage gap:** UnifiedToolRegistry has contracts for ~30 toolkits. Legacy TOOL_SLUGS covers ~60. For the ~30 toolkits without contracts, the pipeline will always fall back to legacy.

### 7.3 High Risk

- **None identified.** The defensive wrapper pattern with full legacy fallback means the wiring cannot make things worse than current behavior. The only risk is "no improvement" for toolkits without ToolContract definitions.

---

## 8. Relationship to Other Systems

### 8.1 Orchestration Layer (5-Layer System)

The orchestration layer (`nexus/src/services/orchestration/`) provides a parallel param collection path:

- `GenericToolDiscovery` (Layer 1) discovers tools from Rube
- `GenericSchemaResolver` (Layer 2) fetches real schemas from Composio
- `GenericUXTranslator` (Layer 3) converts schemas to user-friendly questions
- `GenericParamCollector` (Layer 4) manages collection state machine
- `GenericExecutor` (Layer 5) executes via Rube MCP

ParamResolutionPipeline sits between the orchestration system and the legacy system:

```
Orchestration Layer (dynamic, schema-driven)
         |
         v
ParamResolutionPipeline (contract-driven, priority-based)
         |
         v
Legacy (getDefaultParams + mapCollectedParamsToToolParams)
         |
         v
VerifiedExecutor (execution + verification)
```

The pipeline uses `ToolContract` from `UnifiedToolRegistry` (static knowledge), while the orchestration layer uses `ToolSchema` from Composio API (dynamic knowledge). These are complementary, not competing.

### 8.2 PreFlightService

PreFlightService runs BEFORE executeWorkflow to generate the "Quick Questions" UI. It has its own param validation logic with its own PARAM_ALIASES. After wiring the pipeline into executeWorkflow, there will be three validation passes:

1. PreFlightService (before user clicks Execute)
2. ParamResolutionPipeline.validate (during execution, per node)
3. Schema-based or hardcoded validateRequiredParams (fallback)

This redundancy is intentional for defense-in-depth but the alias drift between #1 and #2 should be addressed.

---

## 9. Summary and Recommendation

**The wiring is straightforward and low-risk.** The `_resolveParamsWithPipeline` function already exists with full fallback logic. The implementation requires:

1. Removing `_` prefix from two functions
2. Replacing 18 lines in `executeWorkflow` (lines 5530-5548) with a call to the wrapper
3. Conditionally using pipeline's missingRequired instead of legacy validation

**The higher-value work** is consolidating the three PARAM_ALIASES copies and implementing the `resolveIds` stub to actually call Rube MCP. These are Phase C/D tasks that should follow the initial wiring.

**Recommended execution order:**
1. Wire the pipeline (Phase A + B) -- 30 minutes
2. Run regression tests to verify no breakage -- 15 minutes
3. Consolidate PARAM_ALIASES into shared module -- 2 hours
4. Implement resolveIds with real Rube MCP calls -- 4 hours

# SCOPE DOCUMENT - Pre-Flight Completeness Sprint

**CEO:** Mohammed
**Director:** Claude (Opus 4.5)
**Sprint:** Fix Pre-Flight Gaps → Bulletproof Discovery
**Created:** 2026-01-23
**Status:** APPROVED FOR EXECUTION

---

## VISION (CEO's Directive)

> "Make the pre-flight system fully discover ALL requirements before execution - like a back-end simulated run that never misses anything."

---

## APPROVED TASKS

### FIX-057: Strengthen Empty String Validation
**Priority:** P0 (Critical Bug)
**Agent:** coder (Opus)
**File:** `nexus/src/components/chat/WorkflowPreviewCard.tsx`
**Problem:** Line ~3140 uses `paramName in collectedParams` which returns TRUE for empty strings
**Solution:** Change to `collectedParams[paramName] !== undefined && collectedParams[paramName] !== ''`
**Marker:** @NEXUS-FIX-057

### FIX-058: Add Trigger Node Discovery
**Priority:** P1 (Gap)
**Agent:** coder (Opus)
**File:** `nexus/src/components/chat/WorkflowPreviewCard.tsx`
**Problem:** Line ~3016 has `if (nodeType === 'trigger') return false` which skips ALL triggers
**Solution:** Remove this filter, allow orchestration discovery for triggers that may need params
**Marker:** @NEXUS-FIX-058

### FIX-059: Unify Static/Dynamic Tracks (Orchestration-First)
**Priority:** P1 (Architecture)
**Agent:** winston-architect (Opus)
**Files:** WorkflowPreviewCard.tsx, PreFlightService.ts
**Problem:** Dual-track architecture can have stale static requirements
**Solution:** Always attempt orchestration first, fall back to static TOOL_REQUIREMENTS only if API fails
**Marker:** @NEXUS-FIX-059

### FIX-060: Add Dry-Run Capability
**Priority:** P2 (Enhancement)
**Agent:** coder (Opus)
**Files:** GenericExecutor.ts, api/rube/execute.ts
**Problem:** Pre-flight checks schemas but can't catch runtime failures
**Solution:** Add optional dry-run parameter to Rube execute that validates without executing
**Marker:** @NEXUS-FIX-060

### REGISTRY: Update FIX_REGISTRY.json
**Priority:** P0 (Documentation)
**Agent:** coder (Opus)
**File:** `nexus/FIX_REGISTRY.json`
**Task:** Add FIX-057, FIX-058, FIX-059, FIX-060 entries

---

## EXPLICITLY OUT OF SCOPE

- Refactoring PreFlightService entirely (keep backward compatibility)
- Changing the UI/UX of the pre-flight modal
- Adding new toolkits to TOOL_SLUGS
- Modifying OAuth flow
- Any changes to existing @NEXUS-FIX-001 through @NEXUS-FIX-056 markers

---

## SUCCESS CRITERIA

| # | Criteria | Verification |
|---|----------|--------------|
| 1 | Empty string values do NOT enable button | Manual test: clear input → button stays disabled |
| 2 | Trigger nodes with params ARE discovered | Console shows orchestration for triggers |
| 3 | Known toolkits use orchestration when available | Console shows "Orchestration-first" for Gmail |
| 4 | Dry-run mode validates without side effects | API returns validation result without executing |
| 5 | All existing fixes intact | `/validate` passes |
| 6 | Build passes | `npm run build` succeeds |

---

## GUARDRAILS (MANDATORY)

1. Every fix must have `@NEXUS-FIX-XXX` marker
2. Every fix must be in `FIX_REGISTRY.json`
3. Run `/validate` after every code change
4. Run `npm run build` - must pass
5. DO NOT remove any existing @NEXUS-FIX markers
6. DO NOT break backward compatibility

---

## PARALLEL EXECUTION PLAN

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARALLEL OPUS AGENTS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Agent-057 (coder)          Agent-058 (coder)                  │
│  ┌─────────────────┐        ┌─────────────────┐                │
│  │ Empty String    │        │ Trigger Node    │                │
│  │ Validation      │        │ Discovery       │                │
│  │ Line ~3140      │        │ Line ~3016      │                │
│  └─────────────────┘        └─────────────────┘                │
│                                                                 │
│  Agent-059 (architect)      Agent-060 (coder)                  │
│  ┌─────────────────┐        ┌─────────────────┐                │
│  │ Orchestration   │        │ Dry-Run         │                │
│  │ First Approach  │        │ Capability      │                │
│  │ Both Files      │        │ Executor/API    │                │
│  └─────────────────┘        └─────────────────┘                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  THEN: Update FIX_REGISTRY.json + /validate + npm run build   │
└─────────────────────────────────────────────────────────────────┘
```

---

**STATUS: APPROVED - EXECUTING NOW**

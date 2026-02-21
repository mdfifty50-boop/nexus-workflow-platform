# Fix Dependency Analysis

Analyze the FIX_REGISTRY dependency graph to understand fix relationships, cascade risks, and safe modification zones.

## Instructions

1. Read `nexus/config/fix-dependencies.json` to load the full dependency graph.
2. Read `nexus/FIX_REGISTRY.json` if you need fix details beyond what the dependency graph provides.

## Output Format

### Section 1: High Cascade Risk Fixes (WARNING TABLE)

Display ALL high cascade-risk fixes as a warning table:

```
+=========================================================================+
|                    HIGH CASCADE RISK FIXES                               |
|  Modifying these fixes can break 3+ dependent fixes downstream           |
+=========================================================================+
| Fix ID   | Blocks | Category        | Description                       |
|----------|--------|-----------------|-----------------------------------|
| FIX-XXX  |   N    | Category        | Short description                 |
+=========================================================================+
```

Sort by blocksCount descending (most dangerous first).

### Section 2: File Hotspot Report

Show files sorted by number of fixes they contain:

```
FILE HOTSPOT REPORT (files with most fixes = most fragile)
----------------------------------------------------------
WorkflowPreviewCard.tsx  : 54 fixes  [EXTREME RISK]
ChatContainer.tsx        :  8 fixes  [HIGH RISK]
agents/index.ts          :  5 fixes  [MODERATE RISK]
rube.ts                  :  5 fixes  [MODERATE RISK]
...
```

Mark files with 10+ fixes as EXTREME RISK, 5+ as HIGH RISK, 3+ as MODERATE RISK, others as LOW RISK.

### Section 3: Dependency Chain Analysis

Show the named chains from the dependency graph:

```
DEPENDENCY CHAINS (interconnected fix groups)
---------------------------------------------
OAuth Chain (8 fixes): FIX-001 -> FIX-002 -> FIX-003 -> ...
Tool Mapping Chain (13 fixes): FIX-007 -> FIX-008 -> ...
...
```

### Section 4: Specific Fix Investigation

If the user mentions a specific fix ID (e.g., "fix-deps FIX-029"), show its FULL dependency tree:

```
FIX-029: Collected params mapped to tool params for retry
Category: Workflow Execution
File: WorkflowPreviewCard.tsx

UPSTREAM (what FIX-029 depends on):
  FIX-017 -> FIX-007 (TOOL_SLUGS mapping)
  FIX-018 -> FIX-007 (TOOL_SLUGS mapping)
  FIX-026 (parameter answer infinite loop fix)

DOWNSTREAM (what breaks if FIX-029 breaks):
  FIX-031 (multi-param integrations)
    FIX-032 (dynamic error prompts)
    FIX-038 (parameter collection panel)
  FIX-043 (param resolution pipeline)
  FIX-050 (semantic param aliases)
    FIX-100 (semantic deduplication)
      FIX-104, FIX-105, FIX-107, FIX-108, FIX-109

CASCADE DEPTH: 4 levels deep
TOTAL AFFECTED: 11 fixes
RISK LEVEL: HIGH - modifying this fix cascades through param collection, dedup, and alias systems
```

Walk the dependency tree recursively to find the full cascade depth.

### Section 5: Recommendations

For any fix being investigated, provide:

1. **Pre-modification checklist**: Which fix markers to verify before AND after changes
2. **Test order**: Which fixes to re-test after modification (bottom-up from dependents)
3. **Safe modification zone**: Parts of the fix that can be changed without affecting dependents
4. **Extra caution items**: Any chain membership, file hotspot warnings, or cross-file dependencies

## Usage Examples

- `/fix-deps` - Show full overview (Sections 1-3, 5)
- `/fix-deps FIX-029` - Investigate specific fix (all sections, focused on FIX-029)
- `/fix-deps WorkflowPreviewCard.tsx` - Show all fixes in that file and their relationships
- `/fix-deps oauth` - Show the OAuth chain analysis
- `/fix-deps whatsapp` - Show all WhatsApp-related chains

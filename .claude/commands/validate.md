# Validate Command

**PURPOSE:** Verify ALL protected fixes are intact before AND after making changes.

## MANDATORY EXECUTION

Run this command:
1. **Before** modifying any protected file
2. **After** any code changes
3. When user asks "is everything still working?"

## Instructions

### Step 1: Read the Fix Registry
```
Read: nexus/FIX_REGISTRY.json
```
Note the total number of fixes and their code markers.

### Step 2: Verify All Code Markers Exist

Search for each marker in the codebase:
```bash
grep -r "@NEXUS-FIX-" nexus/src/ nexus/server/ --include="*.ts" --include="*.tsx" | wc -l
```

Expected: At least 20 markers (matching FIX_REGISTRY.json total)

### Step 3: Verify Critical Fixes

For each CRITICAL fix in the registry, verify the code exists:

| Fix ID | Marker | File | Quick Check |
|--------|--------|------|-------------|
| FIX-017 | @NEXUS-FIX-017 | WorkflowPreviewCard.tsx | `save: 'DROPBOX_UPLOAD_FILE'` exists |
| FIX-018 | @NEXUS-FIX-018 | WorkflowPreviewCard.tsx | `dropbox: 'upload'` in defaults |
| FIX-019 | @NEXUS-FIX-019 | WorkflowPreviewCard.tsx | `validateToolSlug` function exists |
| FIX-020 | @NEXUS-FIX-020 | WorkflowPreviewCard.tsx | `getFallbackTools` function exists |

### Step 4: Run Build Test
```bash
cd nexus && npm run build
```
Must complete without TypeScript errors.

### Step 5: Quick Functionality Test (if dev server running)
- Navigate to app
- Type a workflow request
- Verify workflow preview appears with nodes
- Verify OAuth/API-key connection UI works

## Output Format

```
FIX REGISTRY VALIDATION
=======================

Registry Version: X.X.X
Total Fixes: XX
Last Updated: YYYY-MM-DD

MARKER SCAN:
Found XX/@NEXUS-FIX-XXX markers in codebase

CRITICAL FIX STATUS:
[PASS] FIX-001: OAuth popup blocker bypass
[PASS] FIX-007: TOOL_SLUGS static mapping
[PASS] FIX-017: Storage action mappings
[PASS] FIX-018: Storage defaults to upload
[PASS] FIX-019: Pre-execution validation
[PASS] FIX-020: Fallback tool suggestions
...

BUILD STATUS: [PASS|FAIL]

OVERALL: [ALL FIXES INTACT | X FIXES MISSING]

MISSING FIXES (if any):
- FIX-XXX: [description] - MARKER NOT FOUND
```

## If Fixes Are Missing

1. **DO NOT PROCEED** with other changes
2. Check git history: `git log --oneline -20`
3. Check if file was recently modified: `git diff HEAD~5 -- [filename]`
4. Restore the fix from git or FIX_REGISTRY.json documentation
5. Re-run /validate to confirm restoration

## Warning Signs of Regression

- Fewer @NEXUS-FIX markers than expected
- Missing functions: `validateToolSlug`, `getFallbackTools`, `isToolNotFoundError`
- Missing mappings in TOOL_SLUGS object
- Default actions showing 'list' instead of 'upload' for storage

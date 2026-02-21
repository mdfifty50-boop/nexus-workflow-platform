# Regression Test Command

**PURPOSE:** Run the automated regression test suite, diagnose failures, auto-fix missing markers, and loop until all checks pass.

## Instructions

### Step 1: Run the Regression Test Script

Execute the PowerShell regression test suite from the workspace root:

```bash
powershell -ExecutionPolicy Bypass -File nexus/scripts/regression-test.ps1 -Verbose
```

Capture the exit code. If exit code is 0, skip to Step 6 (report success).

### Step 2: Parse Failures

If the script reports failures (exit code 1), identify each failed fix:
- Read the `[FAIL]` lines from the output
- Note each failed fix ID, marker name, and listed files

### Step 3: Diagnose Each Failure

For each failed fix:

1. **Read the fix entry** from `nexus/FIX_REGISTRY.json` to understand what the fix does
2. **Check if the file exists** -- if the file is missing entirely, report it as unrecoverable
3. **Read the file** that should contain the marker
4. **Search the file** for the marker string (e.g., `@NEXUS-FIX-017`)
5. **Determine the cause:**
   - Marker was accidentally deleted during a refactor
   - File was rewritten without preserving markers
   - File was renamed or moved
   - Marker was never added (new fix)

### Step 4: Auto-Fix When Possible

For each diagnosed failure, attempt to restore the marker:

**If marker is missing but the related code still exists:**
- Find the code block described in `fix.solution` within the file
- Add a comment with the marker on the line above or beside the related code:
  ```typescript
  // @NEXUS-FIX-XXX: [fix title] - DO NOT REMOVE
  ```

**If the code itself is missing:**
- Check `git log --oneline -20 -- [filepath]` for recent changes
- Check `git diff HEAD~5 -- [filepath]` for what was removed
- If the fix's code can be identified in git history, restore it with the marker
- If not recoverable, report it as requiring manual intervention

**If the file does not exist at all:**
- Report as unrecoverable -- the file may have been deleted or renamed
- Search the codebase for the marker to see if it moved: `grep -r "@NEXUS-FIX-XXX" nexus/src/ nexus/server/`

### Step 5: Re-Run and Loop

After applying fixes:

```bash
powershell -ExecutionPolicy Bypass -File nexus/scripts/regression-test.ps1 -Verbose
```

- If exit code is 0, proceed to Step 6
- If exit code is 1, go back to Step 3 with remaining failures
- **Maximum 5 iterations.** If failures persist after 5 loops, proceed to Step 6 with partial results.

### Step 6: Report Final Status

Report in AOP format:

```
[AOP:STATUS] SUCCESS | PARTIAL | FAILED
[AOP:SUMMARY] Regression test: X/Y fixes passed. Z auto-fixed. W require manual attention.
[AOP:FILES] List of files that were modified to restore markers (if any)
[AOP:ISSUES] List of fixes that could not be auto-restored (if any)
```

Additionally, provide a human-readable summary:

```
NEXUS REGRESSION TEST REPORT
=============================
Registry Version: X.X.X
Run Date: YYYY-MM-DD HH:MM

RESULTS:
  Total Fixes  : XX
  Passed       : XX
  Auto-Fixed   : XX (restored in this session)
  Failed       : XX (require manual intervention)
  Skipped      : XX (no marker defined)

AUTO-FIXED (this session):
  - FIX-XXX: [title] -- restored marker in [file]

STILL FAILING (manual fix needed):
  - FIX-XXX: [title] -- [reason it could not be auto-fixed]

ITERATIONS: X/5
```

## Important Rules

1. **Never remove existing markers** while fixing others
2. **Always read the full fix entry** from FIX_REGISTRY.json before modifying code
3. **Run /validate after** if any files were modified
4. **Do not modify protected code blocks** -- only add/restore marker comments
5. **Preserve exact marker format**: `@NEXUS-FIX-XXX` (with the @ prefix)
6. **If a file has multiple markers**, verify ALL of them are still present after your edit

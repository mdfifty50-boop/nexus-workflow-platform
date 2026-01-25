---
name: regression-test
description: Run comprehensive regression tests for all 29 fixes. Use after major changes or before deployment.
tools: Read, Grep, Bash, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_console_messages
allowed-tools: Read, Grep, Glob, Bash, mcp__playwright__*
---

# Regression Test Skill

Comprehensive regression testing for all Nexus fixes.

## Instructions

When invoked (optionally with $ARGUMENTS for specific fix range):

### Step 1: Load Fix Registry

Read `nexus/FIX_REGISTRY.json` and build test plan.

### Step 2: Verify Code Markers

For each fix, check that its code marker exists:
```
For fix in fixes:
  Grep for fix.codeMarker in fix.files
  Mark as PRESENT or MISSING
```

### Step 3: Build Test (Compilation Check)

```bash
cd nexus && npm run build 2>&1
```

Check for:
- TypeScript errors
- Build warnings
- Missing dependencies

### Step 4: Category-Based Testing

Group fixes by category and test:

**OAuth Fixes (FIX-001, FIX-002, etc.):**
- Verify popup handling code exists
- Check polling implementation
- Verify timeout constants

**Tool Mapping Fixes (FIX-017, FIX-018, FIX-019, etc.):**
- Verify mapNodeToToolSlug function
- Check storage action mappings
- Verify validateToolSlug function

**UX Fixes (FIX-021, FIX-026, FIX-027, FIX-028, FIX-029):**
- Check user-friendly error messages
- Verify color schemes
- Check parameter handling

### Step 5: Browser Smoke Test

If Playwright available:
1. Navigate to dashboard
2. Check for console errors
3. Verify chat loads
4. Check no React errors

### Step 6: Generate Report

```
## Regression Test Report

**Date:** [timestamp]
**Total Fixes:** 29
**Tested:** [count]

### Code Marker Verification
| Fix | Marker | Status |
|-----|--------|--------|
| FIX-001 | @NEXUS-FIX-001 | PRESENT |
...

### Build Status
- TypeScript: PASS/FAIL
- Vite Build: PASS/FAIL
- Errors: [list if any]

### Category Results
| Category | Fixes | Passed | Failed |
|----------|-------|--------|--------|
| OAuth | 5 | 5 | 0 |
| Tool Mapping | 8 | 8 | 0 |
| UX | 10 | 10 | 0 |
...

### Browser Smoke Test
- Dashboard loads: PASS/FAIL
- Chat renders: PASS/FAIL
- Console errors: [count]

### Failed Tests
[Detailed list of failures]

### Summary
PASS: All [X] regression tests passed
or
FAIL: [Y] tests failed - see details above
```

## Example Usage

```
/regression-test
/regression-test FIX-001 FIX-010
/regression-test oauth
/regression-test quick
```

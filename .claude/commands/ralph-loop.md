# /ralph-loop - Continuous Test-Fix Loop

Automated test-fix cycle that runs until all tests pass or max iterations reached.

## Configuration
- MAX_ITERATIONS: 10
- PAUSE_ON_LIMIT: true

## Steps (LOOP)

### For each iteration (1 to MAX_ITERATIONS):

#### 1. Run Tests
```bash
cd nexus && npm run build 2>&1
```

#### 2. Parse Failures
Extract error messages, file paths, line numbers from build output.

#### 3. If ALL PASS → EXIT LOOP
Report success and total iterations.

#### 4. If FAILURES → Auto-Fix
For each failure:
1. Read the failing file
2. Identify the root cause
3. Apply targeted fix (Edit tool)
4. Continue to next failure

#### 5. Track Progress

```
RALPH LOOP - Iteration [N]/10
═══════════════════════════════════════════
Errors at start:    [count]
Errors fixed:       [count]
Errors remaining:   [count]
New errors:         [count]

FIXES APPLIED:
- [file:line] [description]

STATUS: [CONTINUING / PASS / MAX_ITERATIONS_REACHED]
═══════════════════════════════════════════
```

### On MAX_ITERATIONS reached:
Report remaining issues and recommend manual intervention.

### On ALL PASS:
```
RALPH LOOP COMPLETE
═══════════════════════════════════════════
Total Iterations: [N]
Total Fixes Applied: [count]
Build Status: PASS
TypeScript: PASS

All clear for commit.
═══════════════════════════════════════════
```

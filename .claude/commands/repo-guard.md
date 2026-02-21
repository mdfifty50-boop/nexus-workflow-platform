# /repo-guard - Pre-Commit Quality Gate

Run this BEFORE any git commit to verify codebase integrity.

## Steps (Execute ALL sequentially)

### 1. Fix Registry Validation
Search all protected files for @NEXUS-FIX markers. Cross-reference with `nexus/FIX_REGISTRY.json`. Report any missing markers.

```bash
cd nexus && grep -r "@NEXUS-FIX-" src/ server/ --include="*.ts" --include="*.tsx" | wc -l
```

Compare count against FIX_REGISTRY.json total. If mismatch, STOP and report.

### 2. TypeScript Build Check
```bash
cd nexus && npx tsc --noEmit 2>&1 | tail -20
```
If errors, list them. Do NOT proceed to commit.

### 3. Vite Build Check
```bash
cd nexus && npm run build 2>&1 | tail -10
```

### 4. Console Error Check
If dev server is running, check for React errors:
- "Maximum update depth exceeded"
- "Cannot read properties of undefined"
- "Unhandled promise rejection"

### 5. Summary Report

```
REPO GUARD REPORT
─────────────────
Fix Markers:   [X/110 present] [PASS/FAIL]
TypeScript:    [PASS/FAIL] [error count]
Vite Build:    [PASS/FAIL]
Console:       [PASS/FAIL]

VERDICT: [READY TO COMMIT / BLOCK - fix issues above]
```

Only output READY TO COMMIT if ALL checks pass.

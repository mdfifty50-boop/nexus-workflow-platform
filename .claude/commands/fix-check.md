# /fix-check - Quick Fix Registry Validation

Fast check that all 110 @NEXUS-FIX markers are present in code.

## Steps

### 1. Load Registry
Read `nexus/FIX_REGISTRY.json`.

### 2. Scan Codebase
For each fix in the registry that has a `codeMarker` field:
1. Check if the marker exists in the specified files
2. Track present vs missing

### 3. Report

```
FIX REGISTRY CHECK
═══════════════════════════════════════════
Total Fixes: [count]
With Code Markers: [count]
Markers Present: [count] ✓
Markers Missing: [count] ✗

MISSING MARKERS:
  [FIX-XXX] [title] in [file]
  ...

STATUS: [ALL PRESENT / X MISSING - RESTORE IMMEDIATELY]
═══════════════════════════════════════════
```

### 4. If markers missing
Show the fix details from FIX_REGISTRY.json so they can be restored. This is a P0 issue.

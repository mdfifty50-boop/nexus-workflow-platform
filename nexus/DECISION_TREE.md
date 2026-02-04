# Decision Tree - Can I Change This?

**Purpose:** Simple yes/no decisions before touching any code.

---

## The Quick Check (30 seconds)

```
START HERE
    │
    ▼
┌─────────────────────────────────────┐
│ Is this a NEW file you're creating? │
└─────────────────────────────────────┘
    │
    ├── YES ──► GO AHEAD (safest option)
    │
    NO
    │
    ▼
┌─────────────────────────────────────┐
│ Is the file WorkflowPreviewCard.tsx?│
└─────────────────────────────────────┘
    │
    ├── YES ──► STOP. DO NOT TOUCH.
    │           Route around it instead.
    │
    NO
    │
    ▼
┌─────────────────────────────────────┐
│ Is it in FROZEN_FILES.md?           │
└─────────────────────────────────────┘
    │
    ├── YES ──► STOP. Find another way.
    │
    NO
    │
    ▼
┌─────────────────────────────────────┐
│ Search file: any @NEXUS-FIX markers?│
└─────────────────────────────────────┘
    │
    ├── YES ──► CAUTION. Check FIX_DEPENDENCY_MAP.md
    │           Is it a "leaf" fix? → Proceed carefully
    │           Is it a "foundation" fix? → STOP
    │
    NO
    │
    ▼
┌─────────────────────────────────────┐
│ Is it documentation/config only?    │
└─────────────────────────────────────┘
    │
    ├── YES ──► GO AHEAD (safe)
    │
    NO
    │
    ▼
┌─────────────────────────────────────┐
│ Is it in SAFE_ZONES.md?             │
└─────────────────────────────────────┘
    │
    ├── YES ──► GO AHEAD (with normal caution)
    │
    NO
    │
    ▼
┌─────────────────────────────────────┐
│ UNKNOWN TERRITORY                   │
│ Read the file first.                │
│ Search for fix markers.             │
│ Check who imports it.               │
│ If still unsure → Create new file   │
└─────────────────────────────────────┘
```

---

## Quick Reference Cards

### GREEN LIGHT - Go Ahead
- Creating a new file
- Editing documentation (`.md` files)
- Editing test files
- Editing files in SAFE_ZONES.md with no fix markers
- Editing config files (tsconfig, vite.config, etc.)

### YELLOW LIGHT - Proceed with Caution
- File has 1-3 fix markers (check if "leaf" fixes)
- File is imported by frozen files
- File affects API responses
- File affects authentication

### RED LIGHT - Stop
- WorkflowPreviewCard.tsx (NEVER)
- Any file in FROZEN_FILES.md
- Any file with "foundation" fix markers (FIX-001, FIX-006, FIX-007, FIX-033, FIX-034)
- Any file with 4+ fix markers

---

## Before/After Checklist

### BEFORE Making Changes

```
□ Identified which file(s) will change
□ Ran decision tree above
□ If file has fix markers → Ran /validate
□ Read the ENTIRE file first (not just the section)
□ Know what success looks like
```

### AFTER Making Changes

```
□ Ran /validate (if file had fix markers)
□ Ran npm run build (catch TypeScript errors)
□ Tested the specific feature
□ No new console errors
□ If anything broke → REVERT immediately
```

---

## Common Scenarios

### "I want to add a new feature"

```
Q: Does it need to modify WorkflowPreviewCard?
   │
   ├── YES ──► Can you wrap it instead? Create new component that
   │           imports WorkflowPreviewCard and adds your feature around it.
   │
   NO ──► Create new files for the feature (safe)
```

### "I found a bug"

```
Q: Is the bug in a frozen file?
   │
   ├── YES ──► Document it. Is it CRITICAL (breaks everything)?
   │           │
   │           ├── YES ──► Make minimal fix, run /validate before+after
   │           │
   │           NO ──► Live with it. Add to backlog. Don't risk regressions.
   │
   NO ──► Fix it normally
```

### "I want to refactor/clean up code"

```
Q: Is the file frozen or has fix markers?
   │
   ├── YES ──► DON'T. The "mess" is intentional protection.
   │           Refactoring = risk of breaking fixes.
   │
   NO ──► Proceed with normal refactoring
```

### "I want to add logging/debugging"

```
Q: Is it in a frozen file?
   │
   ├── YES ──► Add logging in a NEW wrapper service that calls
   │           the frozen file. Don't modify the frozen file.
   │
   NO ──► Add logging normally
```

---

## Emergency Revert Protocol

If you made a change and something broke:

```
1. STOP making more changes
2. Run: git diff (see what changed)
3. Run: git checkout -- <file> (revert specific file)
   OR: git stash (save and revert all changes)
4. Run: npm run build (verify build works)
5. Run: /validate (verify fix markers intact)
6. Document what happened for future reference
```

---

## The One Question That Matters

> **"Is there a way to do this WITHOUT modifying an existing file?"**

If YES → Do that instead.
If NO → Follow the decision tree carefully.

---

## File Categories Summary

| Category | Examples | Action |
|----------|----------|--------|
| **Frozen** | WorkflowPreviewCard.tsx, ChatContainer.tsx | NEVER modify |
| **Has Fixes** | Files with @NEXUS-FIX markers | Check dependency map first |
| **Safe Zone** | New files, docs, tests, config | Go ahead |
| **Unknown** | Everything else | Read file, search for markers, check imports |

---

*Document created: 2026-01-31*
*Part of Day 1 Recovery Plan - Clarity Documents*

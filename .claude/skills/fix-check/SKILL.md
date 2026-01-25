---
name: fix-check
description: Check if a file has protected fixes before editing. ALWAYS use before modifying protected files.
tools: Read, Grep
allowed-tools: Read, Grep
---

# Fix Protection Check Skill

Pre-edit safety check for protected Nexus files.

## Instructions

When invoked with $ARGUMENTS (file path to check):

### Step 1: Read Fix Registry

Read `nexus/FIX_REGISTRY.json` to get:
- All fix entries
- Protected files list
- Code markers

### Step 2: Check if File is Protected

Check if $ARGUMENTS matches any protected file:
- WorkflowPreviewCard.tsx (15+ fixes)
- ChatContainer.tsx (UI fixes)
- agents/index.ts (AI response fixes)
- RubeClient.ts (OAuth infrastructure)
- CustomIntegrationService.ts (API key handling)

### Step 3: Find Fixes Affecting This File

List all fixes where `files` array includes this file:
```
For each fix in FIX_REGISTRY:
  If fix.files contains $ARGUMENTS:
    Add to affectedFixes list
```

### Step 4: Scan for Code Markers

Search the file for existing fix markers:
```
Grep pattern: "@NEXUS-FIX-[0-9]+"
File: $ARGUMENTS
```

Count total markers and list them.

### Step 5: Risk Assessment

Calculate risk level:
- HIGH: 5+ fixes, critical file
- MEDIUM: 2-4 fixes
- LOW: 0-1 fixes

### Step 6: Output Report

```
## Fix Protection Check: [filename]

**Risk Level:** HIGH/MEDIUM/LOW
**Total Fixes:** [count]

### Fixes Affecting This File
| Fix ID | Title | Critical | Marker |
|--------|-------|----------|--------|
| FIX-001 | OAuth popup bypass | Yes | @NEXUS-FIX-001 |
...

### Code Markers Found in File
- Line 234: @NEXUS-FIX-001
- Line 567: @NEXUS-FIX-003
...

### Protected Code Blocks
DO NOT MODIFY code between these markers without understanding the fix.

### Recommendations
1. Run /validate BEFORE making changes
2. Run /validate AFTER making changes
3. If removing any marker, document why in FIX_REGISTRY.json
4. Test the specific fix scenario after changes
```

## Example Usage

```
/fix-check nexus/src/components/chat/WorkflowPreviewCard.tsx
/fix-check ChatContainer.tsx
/fix-check agents/index.ts
```

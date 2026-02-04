# Root-Finding Mechanism (MANDATORY FOR ALL BUG FIXES)

**CRITICAL:** Before attempting ANY bug fix, you MUST trace the issue to its exact root.

## The ROOT-FINDING Protocol

When a user reports ANY issue, follow this exact sequence:

### Step 1: IDENTIFY the Symptom
```
USER REPORTS: "[symptom description]"
```

### Step 2: TRACE the Data Flow
Search for the symptom working BACKWARDS through the code:

```
1. Where does the USER see this? (Component/UI)
2. Where does that component GET its data? (Props/Context/API)
3. Where does that data ORIGINATE? (Service/Backend/State)
4. What TRANSFORMS the data? (Functions/Hooks)
```

### Step 3: VISUALIZE the Flow
Always output a flow diagram:

```
User Action
    │
    ▼
[Component.tsx:XXX] ← What happens here
    │
    ▼
[Service.ts:XXX] ← What happens here
    │
    ▼
[Backend/API] ← What happens here
    │
    ▼
[Result] ← What the user sees
```

### Step 4: PINPOINT the Root Cause
Identify the EXACT location where the bug occurs:

```
ROOT CAUSE:
File: [exact file path]
Line: [exact line number]
Code: [the problematic code]
Issue: [why this code causes the symptom]
```

### Step 5: PROPOSE the Fix
Only AFTER identifying the root cause:

```
FIX PROPOSAL:
File: [file path]
Change: [old code] → [new code]
Why: [explanation]
```

## EXAMPLE: User says "The question appears twice"

### TRACE:
```
User sees duplicate question
    │
    ▼
SmartAIChatbot.tsx:1439-1451 ← Renders message.content (includes question)
    │
    ▼
SmartAIChatbot.tsx:1467-1479 ← ALSO renders question buttons
    │
    ▼
SmartAIChatbot.tsx:672-684 ← Message created with question in BOTH content AND questions array

ROOT CAUSE:
File: nexus/src/components/SmartAIChatbot.tsx
Line: 672-684
Issue: Question text added to message.content AND message.questions array
       Both get rendered, causing duplication
```

## SEARCH PATTERNS

Use these search commands to trace issues:

### Find where something is RENDERED:
```bash
grep -r "symptom_keyword" --include="*.tsx" src/components/
```

### Find where data ORIGINATES:
```bash
grep -r "functionName\|variableName" --include="*.ts" src/services/
```

### Find the FLOW:
```bash
grep -r "export.*ComponentName" --include="*.tsx"  # Find definition
grep -r "import.*ComponentName" --include="*.tsx"  # Find usages
```

## ANTI-PATTERNS (NEVER DO THESE)

| Bad | Good |
|-----|------|
| "Let me try changing this..." | "Let me trace the root cause first..." |
| Making changes without reading code | Read ENTIRE relevant files first |
| Guessing at the fix | Trace, visualize, then fix |
| Fixing symptoms, not causes | Find the true origin |
| "It should work now" without verification | Build and test after every fix |

## Required Output Format

When fixing ANY bug, your response MUST include:

```
## Issue Trace

**Symptom:** [What user reports]

**Flow:**
[ASCII diagram of data flow]

**Root Cause:**
- File: [path]
- Line: [number]
- Code: `[code snippet]`
- Issue: [explanation]

**Fix:**
- Change in [file]:[line]
- From: `[old]`
- To: `[new]`

**Verification:**
- [ ] Build passes
- [ ] Issue resolved
- [ ] No regressions
```

## Integration with Fix Registry

After fixing, if the fix is significant:

1. Add `@NEXUS-FIX-XXX` marker to the code
2. Update `FIX_REGISTRY.json` with the new fix
3. Run `/validate` to confirm all fixes intact

## This Protocol is MANDATORY

Every bug fix in Nexus MUST follow this protocol. Skipping root-finding leads to:
- Fixes that don't actually fix
- Regressions
- Wasted time
- User frustration

**Trace first. Fix second. Always.**

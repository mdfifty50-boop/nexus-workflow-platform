# Code Protection Rules (MANDATORY)

## BEFORE MODIFYING ANY FILE

### Step 1: Check CRITICAL_FIXES.md
Before editing ANY file in `nexus/server/` or `nexus/src/components/chat/`:

```
Read: nexus/CRITICAL_FIXES.md
```

If the file you're about to modify is listed there:
1. READ the entire "DO NOT" section for that fix
2. PRESERVE the documented code patterns exactly
3. If your change conflicts with a documented fix, STOP and ask the user

### Step 2: Read Before Edit
ALWAYS read the ENTIRE file before making edits. Never edit based on memory alone.

### Step 3: Targeted Edits Only
- Use Edit tool with specific `old_string` → `new_string`
- NEVER use Write tool to overwrite existing files (except for new files)
- Prefer adding code over rewriting code

## PROTECTED FILES (NEVER FULLY REWRITE)

These files contain critical fixes. Only make ADDITIVE changes:

| File | Protection Level | Why |
|------|-----------------|-----|
| `server/services/ComposioService.ts` | HIGH | Fixes #1, #2 - OAuth flow |
| `server/services/CustomIntegrationService.ts` | HIGH | Fix #4 - Name aliasing |
| `server/routes/chat.ts` | HIGH | Fix #5 - Support level check |
| `src/components/chat/WorkflowPreviewCard.tsx` | HIGH | Fix #3 - Popup blocker |

## WHEN ADDING NEW CODE

1. Add at the END of existing code blocks when possible
2. Use clear section comments: `// === NEW: Feature Name ===`
3. Document the addition in `.claude-session.md`

## WHEN REFACTORING

1. Create a backup comment showing old code pattern
2. Or document the change in CRITICAL_FIXES.md if significant
3. Test before AND after

## RED FLAGS - STOP AND VERIFY

If you're about to:
- Delete more than 10 lines of code → READ the section first
- Rename a function/variable used across files → Check all usages
- Change an API response format → Check all consumers
- Remove an import → Verify it's truly unused

## SELF-CHECK BEFORE SUBMITTING EDIT

Before every Edit tool call, verify:
- [ ] I have read the current file content
- [ ] I checked CRITICAL_FIXES.md if this file is listed
- [ ] My edit preserves documented fix patterns
- [ ] I'm using targeted edit, not full file rewrite

# Rigorous Validation Protocol

## MANDATORY for ALL Marathon/Sprint/Hybrid Loops

### Pre-Task Enforcement

Every agent MUST include in their task:
```
COMPLETION CRITERIA (MANDATORY):
- [ ] Code compiles without errors
- [ ] Feature is visible/functional in browser
- [ ] No regressions introduced
```

### Validation Types by Task Category

#### 1. UI/UX Tasks (REQUIRES BROWSER VERIFICATION)
```bash
# MANDATORY: Start dev server
cd nexus && npm run dev &

# MANDATORY: Use Playwright MCP
mcp__playwright__browser_navigate url: "http://localhost:517X/[route]"
mcp__playwright__browser_snapshot
```

**UI Validation Checklist:**
- [ ] Element exists in DOM (via snapshot)
- [ ] Element is VISIBLE (not hidden/off-screen)
- [ ] No console errors
- [ ] Correct styling applied
- [ ] Interactive elements work

#### 2. Code/Architecture Tasks
```bash
# MANDATORY: TypeScript check
cd nexus && npx tsc --noEmit 2>&1 | head -50

# MANDATORY: Check file has content
wc -l [file] # Must be > 10 lines for real implementation
```

#### 3. Integration Tasks
- [ ] Import works in consuming file
- [ ] No circular dependencies
- [ ] Exports are correct

### Ralph Wiggum RIGID Validation

Ralph Wiggum MUST:
1. **START DEV SERVER** before validating UI tasks
2. **USE PLAYWRIGHT** to verify visible elements
3. **REJECT tasks where:**
   - File exists but is empty/stub
   - Feature is not visible in browser
   - TypeScript errors exist
   - Console errors appear

### Validation Failure Protocol

If ANY task fails validation:
1. Do NOT proceed to next loop
2. Create FIX task for failed item
3. Re-validate after fix
4. Only proceed when ALL tasks PASS

### Agent Completion Requirements

Agents MUST:
1. **Show evidence of completion** (file paths, line numbers)
2. **Include test command output** for code tasks
3. **Include Playwright snapshot** for UI tasks
4. **Report exact changes made** (not just "updated file")

### Token-Efficient Validation

**Haiku validation prompt (compressed):**
```
Validate L[N]:
1. tsc --noEmit (0 errors?)
2. For UI: playwright snapshot [route] - element visible?
3. For code: file > 10 lines, exports work?

PASS only if ALL criteria met. List any FAIL with reason.
Output: PASS | FAIL + [reason]
```

---

## Permanent Configuration

This protocol is EMBEDDED in:
1. `_bmad/bmm/workflows/marathon/instructions.md` - Step 3 (Validation)
2. `CLAUDE.md` - Mandatory Verification Procedures
3. All agent task prompts include completion criteria

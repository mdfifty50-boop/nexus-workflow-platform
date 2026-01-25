# Progress.txt Memory Format

## Purpose

The progress file serves as **persistent memory** across context windows. When an agent's context is cleared between iterations, this file preserves:

- What was done
- What was learned
- What failed and why
- What to try next

## Format Specification

### File Structure

```
# Progress Log: [Task/Story ID]
# Started: [ISO timestamp]
# Last Updated: [ISO timestamp]

---

## Session 1 - [timestamp]

### Completed
- [What was accomplished]

### Learned
- [Key insights, patterns discovered, gotchas found]

### Failed
- [What didn't work and why]

### Next
- [Suggested next steps for future iterations]

---

## Session 2 - [timestamp]
...
```

### Section Definitions

| Section | Purpose | Example |
|---------|---------|---------|
| **Completed** | Concrete deliverables done | "Created DeleteButton component" |
| **Learned** | Insights for future iterations | "API expects snake_case, not camelCase" |
| **Failed** | What didn't work (prevent repeats) | "Tried CSS grid, broke mobile layout" |
| **Next** | Recommendations for next iteration | "Need to add confirmation dialog" |

## Rules

### Append-Only
- NEVER delete or modify previous entries
- ALWAYS add new session at the end
- Preserves full history for debugging

### Structured Learning
Focus on learnings that prevent repeated mistakes:

**Good:**
```
### Learned
- The UserService.delete() method requires a confirmation token
- Mobile breakpoint is 768px, not 640px
- Tests must mock the AuthContext provider
```

**Bad:**
```
### Learned
- Did some stuff
- Fixed things
- It works now
```

### Concise but Complete
Each entry should be:
- Specific enough to act on
- Brief enough to scan quickly
- Contextual (mention file names, function names)

## Integration with Gate Runner

The gate-runner.sh automatically:
1. Reads progress.txt at start of each iteration
2. Passes content to the agent as context
3. Appends new progress at end of iteration

## Example Progress File

```
# Progress Log: US-042 - Add Delete Workflow Button
# Started: 2026-01-10T14:30:00Z
# Last Updated: 2026-01-10T15:45:00Z

---

## Session 1 - 2026-01-10T14:30:00Z

### Completed
- Created DeleteWorkflowButton component in src/components/
- Added onClick handler that calls workflowService.delete()
- Basic styling with Tailwind

### Learned
- workflowService.delete() is async, needs await
- Component must be wrapped in WorkflowContext to access ID
- Delete endpoint is /api/workflows/:id (not /api/workflow/:id)

### Failed
- First attempt used wrong endpoint URL (404 error)
- Tried inline confirmation with window.confirm() - works but ugly

### Next
- Add proper ConfirmDialog component
- Write unit tests for delete flow
- Verify with Playwright that button appears in UI

---

## Session 2 - 2026-01-10T15:15:00Z

### Completed
- Created ConfirmDialog component
- Wired up to DeleteWorkflowButton
- Dialog shows workflow name before confirming

### Learned
- ConfirmDialog needs portal to render above other elements
- Used existing Modal component as base (src/components/ui/Modal.tsx)
- Dialog text should include workflow name for clarity

### Failed
- Gates failed: TypeScript error on line 42 (missing null check)

### Next
- Fix TypeScript error: add optional chaining on workflow?.name
- Run gates again

---

## Session 3 - 2026-01-10T15:45:00Z

### Completed
- Fixed TypeScript error with optional chaining
- All gates passed
- Story marked as done

### Learned
- Always use optional chaining when accessing nested properties
- Gate runner caught the error that manual testing missed

### Failed
- (none this session)

### Next
- Story complete, ready for review
```

## Tips for Agents

1. **Write for your future self** - You won't remember what you did
2. **Include file paths** - `src/components/Button.tsx:42` not "the button file"
3. **Explain the WHY** - "Endpoint requires auth token" not just "added token"
4. **Note failure patterns** - Helps avoid repeating mistakes
5. **Be specific about next steps** - Actionable items, not vague intentions

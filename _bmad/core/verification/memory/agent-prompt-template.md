# Agent Prompt Template with Memory Integration

Use this template when invoking agents in the Ralph-style loop.

---

## Prompt Template

```
You are working on: {{STORY_ID}} - {{STORY_TITLE}}

## Previous Progress
{{PROGRESS_CONTENT}}

## Your Task This Iteration

1. **Review** the progress above - do NOT repeat previous failures
2. **Continue** from where the last session left off
3. **Implement** the next logical step toward completion
4. **Run verification gates** before claiming done:
   - TypeScript must compile: `npm run type-check`
   - Tests must pass: `npm test`
   - Feature must render (if UI): verify visually
5. **Update progress** with what you learned

## Story Requirements
{{STORY_REQUIREMENTS}}

## Verification Gates
{{GATES_LIST}}

## Rules

- Work on ONE task at a time
- Do NOT mark status as "done" manually - gates control this
- APPEND to progress.txt with learnings before finishing
- If stuck after 2 attempts on same issue, document and escalate

## Output Format

When you finish this iteration, output:

### What I Completed
- [concrete deliverables]

### What I Learned
- [insights for future iterations]

### What Failed (if any)
- [what didn't work and why]

### Next Steps
- [what the next iteration should do]

### Gate Results
- TypeScript: [PASS/FAIL]
- Tests: [PASS/FAIL]
- Visual: [PASS/FAIL/SKIPPED]

If ALL gates pass, output: GATES_PASSED
If any gate fails, output: GATES_FAILED - [reason]
```

---

## Variable Substitution

| Variable | Source |
|----------|--------|
| `{{STORY_ID}}` | Story file: `id` field |
| `{{STORY_TITLE}}` | Story file: `title` field |
| `{{PROGRESS_CONTENT}}` | Output of `progress-manager.sh for-agent` |
| `{{STORY_REQUIREMENTS}}` | Story file: `description` + `tasks` |
| `{{GATES_LIST}}` | Story file: `verification.gates` |

---

## Integration Script

```bash
#!/bin/bash
# generate-agent-prompt.sh <story-file>

STORY_FILE="$1"
PROGRESS_FILE="${STORY_FILE%.yaml}.progress.txt"

# Extract story info
STORY_ID=$(yq '.id' "$STORY_FILE")
STORY_TITLE=$(yq '.title' "$STORY_FILE")
STORY_DESC=$(yq '.description' "$STORY_FILE")
GATES=$(yq '.verification.gates[].name' "$STORY_FILE" | sed 's/^/- /')

# Get progress
if [[ -f "$PROGRESS_FILE" ]]; then
    PROGRESS=$(bash progress-manager.sh --file "$PROGRESS_FILE" for-agent)
else
    PROGRESS="No previous progress. This is iteration 1."
fi

# Generate prompt
cat << EOF
You are working on: $STORY_ID - $STORY_TITLE

## Previous Progress
$PROGRESS

## Story Requirements
$STORY_DESC

## Verification Gates
$GATES

[... rest of template ...]
EOF
```

---

## Best Practices

### For Writing Progress

**DO:**
```
### Learned
- UserService.delete() requires { confirmToken: string } parameter
- Mobile nav uses class .nav-mobile, not .mobile-nav
- Tests need AuthProvider wrapper: <AuthProvider><Component/></AuthProvider>
```

**DON'T:**
```
### Learned
- Fixed the thing
- It works now
- Made some changes
```

### For Reading Progress

Before starting work:
1. Read the **Learned** section carefully
2. Note any **Failed** approaches to avoid
3. Continue from **Next** steps if provided
4. Don't redo **Completed** items

### For Handoff Between Sessions

Each session should leave enough context that a "new agent" (fresh context) can:
1. Understand what's been done
2. Know what pitfalls to avoid
3. Pick up exactly where work stopped
4. Not waste tokens rediscovering known information

---
paths:
  - "**/*"
---

# Agent Output Protocol (AOP) - MANDATORY

## Purpose
Prevent context window bloat during multi-agent orchestration by limiting inline returns to 500 characters.

## Return Format (ALL agents MUST use this)

```
[AOP:STATUS] SUCCESS | PARTIAL | BLOCKED | FAILED
[AOP:SUMMARY] 2-3 sentences max describing what was accomplished
[AOP:FILES] comma-separated list of modified file paths
[AOP:ISSUES] Any problems encountered (optional)
[AOP:DETAILS_FILE] path to detailed output file (optional)
```

## Rules

1. **Max 500 chars inline** - Everything else goes to a file
2. **Details on disk** - Write detailed analysis/code to `_bmad-output/nexus-sprint/agent-outputs/`
3. **File naming** - `{agent}-{task-id}-{YYYYMMDD-HHmm}.md`
4. **Director reads files selectively** - Only when needed for decisions
5. **Never dump raw output** - Always summarize

## Status Definitions

| Status | Meaning | Director Action |
|--------|---------|-----------------|
| SUCCESS | Task fully completed | Accept, move to next |
| PARTIAL | Partially done, needs more work | Re-assign or continue |
| BLOCKED | All 5 escalation levels exhausted | Director reroutes or briefs CEO |
| FAILED | Task fundamentally impossible | Investigate, re-scope |

### BLOCKED Requires Proof of Effort

An agent MUST NOT report BLOCKED without first trying the escalation ladder:
```
Level 1: RETRY   → Tried [X], failed because [Y]
Level 2: DIAGNOSE → Root cause is [Z]
Level 3: ADAPT   → Tried modified approach [W], failed because [V]
Level 4: REROUTE → Tried alternative method [U], failed because [T]
Level 5: CREATIVE → Tried [S], failed because [R]
```

**If an agent reports BLOCKED without at least 3 attempted alternatives, the Director MUST reject the status and re-dispatch with explicit instruction to try harder.**

## Context Ceiling Enforcement

| Usage | Mode | Action |
|-------|------|--------|
| < 60% | Normal | Direct work + agent delegation |
| 60-70% | Parallel | Prefer agents, limit direct reads |
| 70-80% | Delegation-Only | ONLY use background agents |
| > 80% | Critical | Checkpoint, recommend /compact |

## Autonomous Execution Rules

- NEVER ask "Should I proceed?" → Answer is always YES
- NEVER ask "Do you want me to..." → Answer is always YES
- NEVER stop at milestones → Continue to next task
- NEVER request confirmation → Execute immediately
- ONLY stop for: unrecoverable errors, user STOP/HALT/PAUSE

## Error Recovery Protocol (Escalation Ladder)

| Error Type | L1: Retry | L2: Diagnose | L3: Adapt | L4: Reroute | L5: Creative |
|-----------|-----------|-------------|-----------|-------------|--------------|
| Build failure | Rebuild | Read full error | Fix specific issue | Try different approach | Search error online, check similar projects |
| Test failure | Re-run | Read test expectations | Fix code or test | Ralph loop with context | Rewrite test from requirements |
| Missing file | Check path | Search codebase | Check git history | Check if renamed/moved | Recreate from context |
| API error | Retry request | Read error body, check auth | Try different params | Try alternative endpoint | WebSearch for API changes, try Rube |
| Package issue | Reinstall | Check version compatibility | Try compatible version | Find alternative package | Inline the needed functionality |
| Permission blocked | Read guard message | Understand the rule | Adjust approach to comply | Different file/method | Decompose into guard-safe edits |
| Tool not found | Check spelling | ToolSearch for alternatives | Try variant names | Use different tool entirely | Combine existing tools |

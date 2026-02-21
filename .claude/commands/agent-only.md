# /agent-only - Toggle Agent-Only Mode

When enabled, the main Claude instance delegates ALL implementation work to specialized agents. Direct file editing is discouraged.

## Toggle

Read current mode from `nexus/config/agent-mode.json`. Toggle between enabled/disabled.

### When ENABLED:
- ALL code changes must go through @coder agent
- ALL reviews must go through @ralph-qa agent
- ALL research must go through @explorer agent
- Main context stays lean (summaries only)
- Direct Edit/Write by main context is flagged

### When DISABLED:
- Normal operation
- Direct editing allowed

## Report
```
AGENT-ONLY MODE: [ENABLED/DISABLED]
═══════════════════════════════════════════
When enabled:
  @explorer  → Research, file finding
  @coder     → Implementation, bug fixes
  @ralph-qa  → Code review, validation
  @winston   → Architecture decisions
  @marcus-gm → Strategic reviews

Main context role: ORCHESTRATION ONLY
Direct editing: [ALLOWED/DISCOURAGED]
═══════════════════════════════════════════
```

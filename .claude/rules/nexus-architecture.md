---
paths:
  - "nexus/**/*.ts"
  - "nexus/**/*.tsx"
---

# Nexus Architecture Rules

## Core Principle
Nexus IS the workflow engine. NEVER recommend external tools like n8n, Zapier, or Make.

## Response Format
All AI responses MUST return valid JSON:
- `shouldGenerateWorkflow: true` + `workflowSpec` → Visual workflow
- `shouldGenerateWorkflow: false` → Text only

## Integration Layer
- Use Composio for all 500+ app integrations
- OAuth handled via WorkflowPreviewCard polling
- Real-time execution via Composio MCP

## State Management
- Zustand for global state
- React Query for server state
- localStorage for workflow persistence

## Key Files (Do Not Break)
- `nexus/server/agents/index.ts` - Nexus personality
- `nexus/src/services/NexusAIService.ts` - Response parsing
- `nexus/src/components/chat/WorkflowPreviewCard.tsx` - Visual workflow

## Agent Output Protocol (AOP)
All agents MUST return max 500 chars inline. Details go to files:
- Path: `_bmad-output/nexus-sprint/agent-outputs/{agent}-{task}.md`
- Format: `[AOP:STATUS]`, `[AOP:SUMMARY]`, `[AOP:FILES]`, `[AOP:ISSUES]`
- Config: `nexus/config/agent-output-protocol.json`

## Model Modes
Agent model assignments loaded from `nexus/config/model-modes.json`:
- Marathon: Opus everywhere ($3-5/loop)
- Default: Opus + Sonnet mix ($1-3/loop)
- Sprint: Sonnet + Haiku ($0.50-1/loop)
- Budget: Haiku everywhere ($0.20-0.50/loop)

## Programmatic Hooks (Active Enforcement)
Hooks in `.claude/hooks/` actively enforce rules:
- **fix-registry-guard.js**: Blocks removal of @NEXUS-FIX markers
- **protected-file-guard.js**: Blocks Write on protected files
- **env-secret-guard.js**: Blocks hardcoded API keys
- **constitution-enforcer.js**: Code style (5% sample, 100% security)
- **build-verifier.js**: Tracks TS file changes, reminds to build
- **fix-marker-checker.js**: Verifies markers after edits
- **session-context-loader.js**: Auto-loads session context
- **context-ceiling-enforcer.js**: Warns at 70% context usage

## Codex Integration (Supplemental)
Config: `nexus/config/codex-integration.json`
- Use Codex for: boilerplate, test scaffolding, docs generation
- Use Claude for: complex logic, architecture, business rules
- All Codex output validated by Ralph QA

## Sprint Progress State Machine
File: `nexus/sprint-progress.json`
- Persistent JSON state that survives session restarts
- Tracks: loops, tasks, blockers, metrics, GM reviews
- Updated after EVERY loop by Director agent

## Autonomous Execution
- System NEVER asks for permissions
- System NEVER stops at milestones
- Auto-recovers from build/test failures
- Only stops for: unrecoverable errors, user says STOP/HALT/PAUSE
- Config: `nexus/config/agent-mode.json`

## Zero-Token Scripts
Run WITHOUT Claude to save tokens:
- `nexus/scripts/validate-fixes.ps1` - Fix registry validation
- `nexus/scripts/build-check.ps1` - Build verification
- `nexus/scripts/session-init.ps1` - Session file initialization

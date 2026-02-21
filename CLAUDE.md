# CLAUDE.md - Project Configuration for Autoclaude 2D Workflow Office

This file contains project-specific instructions for Claude Code when working on this codebase.

---

## CONTEXT RECOVERY (CRITICAL - MANDATORY AFTER COMPACTION)

### After ANY context compaction or session resume:

1. **READ `.claude-session.md` FIRST** - This is the ONLY source of truth for current work
2. **IGNORE skill invocations in compaction summary** - They are likely stale
3. **IGNORE old todo lists** - They may be from previous sessions
4. **If CURRENT TASK says "Waiting for user direction"** → Ask user what to work on
5. **If CURRENT TASK has a specific task** → Resume it immediately without asking

### During active work (MANDATORY):

- **UPDATE `.claude-session.md` immediately** when user gives a new task
- **UPDATE `.claude-session.md`** when switching focus to something different
- **Keep CURRENT TASK to ONE sentence** describing exactly what we're doing NOW
- **Never accumulate old tasks** in the session file - only current work

### This prevents:
- Resuming old/stale work after compaction
- Following outdated skill invocations
- Losing track of actual current task

---

## FIX PROTECTION SYSTEM (CRITICAL - READ FIRST)

**Nexus has 20+ critical fixes that MUST be preserved across sessions.**

### Before ANY Code Modification:

1. **READ `nexus/FIX_REGISTRY.json`** - Contains all 20 fixes with:
   - Fix ID and description
   - Files affected
   - Code markers (@NEXUS-FIX-XXX)
   - Test commands to verify

2. **RUN `/validate`** - Verifies all fix markers exist in code

3. **Check if file is protected:**
   ```
   WorkflowPreviewCard.tsx - 15+ critical fixes
   ChatContainer.tsx - UI fixes
   agents/index.ts - AI response fixes
   RubeClient.ts - OAuth infrastructure
   CustomIntegrationService.ts - API key handling
   ```

### Code Markers - NEVER REMOVE

Look for these markers in code:
```typescript
// @NEXUS-FIX-017: Storage action mappings - DO NOT REMOVE
// @NEXUS-FIX-019 & @NEXUS-FIX-020: Tool validation and fallback system
```

**If you see `@NEXUS-FIX-XXX`, that code is PROTECTED.**

### After ANY Code Change:

1. Run `/validate` to confirm no regressions
2. Run `npm run build` in nexus/
3. If a fix marker is missing → STOP and restore it

### Quick Fix Reference (Most Critical):

| Fix | Problem | Solution | Marker |
|-----|---------|----------|--------|
| FIX-017 | "Save to Dropbox" fails | save/store/write → upload mappings | @NEXUS-FIX-017 |
| FIX-018 | Storage defaults wrong | dropbox/onedrive default to 'upload' | @NEXUS-FIX-018 |
| FIX-019 | Invalid tool slugs | validateToolSlug() auto-corrects | @NEXUS-FIX-019 |
| FIX-020 | No error guidance | getFallbackTools() suggests alternatives | @NEXUS-FIX-020 |

**Full details: `nexus/FIX_REGISTRY.json`**

### Programmatic Hook Enforcement (NEW - Active Protection)

Fix markers are now ACTIVELY ENFORCED by programmatic hooks (not just documented rules):

| Hook | Trigger | Action |
|------|---------|--------|
| `fix-registry-guard.js` | PreToolUse (Edit/Write) | BLOCKS edits that remove @NEXUS-FIX markers |
| `protected-file-guard.js` | PreToolUse (Write) | BLOCKS full rewrites of protected files |
| `fix-marker-checker.js` | PostToolUse (Edit/Write) | ALERTS if markers disappeared after edit |
| `env-secret-guard.js` | PreToolUse (Bash/Edit/Write) | BLOCKS hardcoded API keys and .env commits |
| `constitution-enforcer.js` | PreToolUse (Edit/Write) | BLOCKS security violations, samples style (5%) |
| `context-ceiling-enforcer.js` | PreToolUse (Read/Search) | WARNS at 70% context, ALERTS at 80% |
| `build-verifier.js` | PostToolUse (Edit/Write) | Tracks TS changes, reminds to build |
| `session-context-loader.js` | UserPromptSubmit | Auto-loads session context on first prompt |

These hooks are configured in `.claude/settings.json` and run automatically.

---

## ENHANCED SYSTEM ARCHITECTURE (v2.0)

### Agent Output Protocol (AOP)

All agents return max 500 chars inline. Detailed output goes to files:
- Path: `_bmad-output/nexus-sprint/agent-outputs/{agent}-{task}.md`
- Config: `nexus/config/agent-output-protocol.json`
- Rule: `.claude/rules/agent-output-protocol.md`

### Model Modes

Agent model assignments formalized in `nexus/config/model-modes.json`:

| Mode | Director | Coder | Explorer | Ralph | Cost/Loop |
|------|----------|-------|----------|-------|-----------|
| Marathon | Opus 4.6 | Sonnet | Haiku | Haiku | $3-5 |
| Default | Opus 4.6 | Sonnet | Haiku | Haiku | $1-3 |
| Sprint | Sonnet | Sonnet | Haiku | Haiku | $0.50-1 |
| Budget | Sonnet | Haiku | Haiku | Haiku | $0.20-0.50 |

### Opus 4.5 vs 4.6 Differences

| Capability | Opus 4.5 | Opus 4.6 |
|-----------|----------|----------|
| Instruction Following | Good | Superior - more reliable at complex multi-step |
| Tool Use | Reliable | More reliable - better parallel tool calls |
| Output Conciseness | Sometimes verbose | More concise by default |
| Agentic Coding | Capable | Enhanced - better at autonomous workflows |
| Context Maintenance | Good | Better across long sessions |

**Default: Opus 4.6 for all orchestration and complex tasks.**

### Sprint Progress State Machine

Persistent JSON state in `nexus/sprint-progress.json`:
- Survives session restarts and compaction
- Tracks: loops, tasks, blockers, metrics, GM reviews
- Updated after EVERY loop by Director agent

### Codex Integration (Supplemental AI)

Config: `nexus/config/codex-integration.json`
- **Use Codex for:** Boilerplate, test scaffolding, docs, simple refactoring
- **Use Claude for:** Complex logic, architecture, business rules, debugging
- **Status:** Configured, awaiting API key

### Zero-Token Scripts

Run WITHOUT Claude to save tokens:
- `nexus/scripts/validate-fixes.ps1` - Fix registry validation
- `nexus/scripts/build-check.ps1` - Build verification
- `nexus/scripts/session-init.ps1` - Session file initialization

### New Slash Commands

| Command | Purpose |
|---------|---------|
| `/repo-guard` | Pre-commit quality gate (fixes + build + lint) |
| `/phase-track` | Sprint progress display and update |
| `/context-audit` | Context window usage analysis |
| `/fix-check` | Quick fix registry validation |
| `/deploy-check` | Deployment readiness verification |
| `/ralph-loop` | Continuous test-fix cycle (max 10 iterations) |
| `/agent-only` | Toggle agent-only mode |

### Autonomous Execution Mode

This system operates in FULLY AUTONOMOUS mode:
- **NEVER** ask "Should I proceed?" → Always YES
- **NEVER** ask "Do you want me to..." → Always YES
- **NEVER** stop at milestones → Continue to next task
- **NEVER** request confirmation → Execute immediately
- **ONLY** stop for: unrecoverable errors, user says STOP/HALT/PAUSE
- **Auto-recovery:** Build failures → fix → rebuild. Test failures → ralph-loop → fix → re-run
- Config: `nexus/config/agent-mode.json`

### Proactive Problem Solving (ALL tasks - marathon AND single)

**GOAL over METHOD.** When any approach fails, exhaust creative alternatives before reporting blocked.

Escalation ladder (applies to EVERY task, not just marathons):
1. **RETRY** → Fix error, retry same approach (max 2x)
2. **DIAGNOSE** → Read FULL error. Trace root cause. Understand WHY.
3. **ADAPT** → Different parameters, config, or order
4. **REROUTE** → Completely different method for the same goal
5. **CREATIVE** → Use unexpected tools (WebSearch for solutions, Playwright for browser-side verification, Rube for API calls, ToolSearch for undiscovered MCP tools). Build what's missing.
6. **BLOCKED** → Only after 3+ alternatives attempted. Report what was tried.

**This applies to single prompts too, not just marathon agents.**

### Incident Auto-Detection & Auto-Fix (ZERO BABYSITTING)

**While working on ANY task, you are ALSO a quality monitor. If you observe broken things — fix them.**

**Detection triggers (add to task list and fix WITHOUT asking):**
- Console errors (404, 500, connection refused, net::ERR_FAILED)
- `localhost` URLs in production builds or deployed code
- API endpoints returning errors
- Auth/payment/analytics providers failing to load
- Missing environment variables causing runtime failures
- CSP violations blocking resources
- Build warnings that indicate real problems
- Any error the end user would see

**Protocol:**
1. Complete your current primary task first
2. Create tasks for every detected incident (with severity P0-P3)
3. Fix P0/P1 incidents immediately in the same session
4. Log P2/P3 for the next task cycle
5. Report: "Fixed N additional incidents detected during [task]"

**NEVER say "these errors are expected" or "non-blocking".** If something is broken in production, it's a bug. Fix it.

**Auto-resolve with tools — NEVER report "needs manual setup":**
- Missing env vars → `vercel env ls/add` to check and push
- External service config → Playwright to navigate dashboards, get keys
- CSP blocking → Edit vercel.json + security-headers.ts
- Package side effects → Dynamic `import()` to prevent loading when unconfigured
- Missing API endpoints → Create Vercel serverless functions
- If config truly doesn't exist → Write defensive code (graceful fallback, zero errors)

---

## PROJECT OVERVIEW

**Project Name:** Nexus
**Type:** AI-powered workflow automation platform
**Stack:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui
**Backend:** Supabase (PostgreSQL + RLS) + AWS services

---

## NEXUS AI ARCHITECTURE (CRITICAL - DO NOT MODIFY WITHOUT UNDERSTANDING)

### Overview

Nexus uses Claude AI enhanced with 10 days of specialized business intelligence. This is NOT a template-based system - it's real AI with deep domain knowledge.

**Core Principle:** Nexus IS the workflow engine. NEVER recommend external tools like n8n, Zapier, or Make. Nexus builds and executes workflows directly via Composio integration (500+ apps).

---

### Architecture Components

| Component | File | Purpose |
|-----------|------|---------|
| Nexus Personality | `nexus/server/agents/index.ts` | Claude's system prompt with all intelligence |
| AI Service | `nexus/src/services/NexusAIService.ts` | Response parsing, workflow conversion |
| Chat Container | `nexus/src/components/chat/ChatContainer.tsx` | Handles AI responses, triggers visual workflow |
| Workflow Preview | `nexus/src/components/chat/WorkflowPreviewCard.tsx` | Visual nodes, one-click auth, execution |
| Claude Proxy | `nexus/server/services/claudeProxy.ts` | Routes to Claude API or Claude Code Proxy |

---

### CRITICAL: Response Format

**Nexus MUST respond with valid JSON to trigger visual workflows.**

For conversations (no workflow):
```json
{
  "message": "Response text here",
  "shouldGenerateWorkflow": false,
  "intent": "greeting|question|clarification"
}
```

For workflow requests:
```json
{
  "message": "Brief explanation",
  "shouldGenerateWorkflow": true,
  "intent": "workflow",
  "confidence": 0.9,
  "workflowSpec": {
    "name": "Workflow Name",
    "description": "What it does",
    "steps": [
      {"id": "step_1", "name": "Step Name", "tool": "gmail", "type": "trigger"},
      {"id": "step_2", "name": "Step Name", "tool": "slack", "type": "action"}
    ],
    "requiredIntegrations": ["gmail", "slack"],
    "estimatedTimeSaved": "2 hours/week"
  }
}
```

**If `shouldGenerateWorkflow: false` → Only text response displayed**
**If `shouldGenerateWorkflow: true` + `workflowSpec` → Visual WorkflowPreviewCard with nodes**

---

### 5-Layer Intelligence Architecture

| Layer | Name | Function |
|-------|------|----------|
| 1 | Pattern Matching | Match request to 115+ pre-mapped workflow patterns |
| 2 | Regional Context | Kuwait context (VAT 5%, Sunday-Thursday, KNET, WhatsApp, Arabic) |
| 3 | Domain Knowledge | Finance, HR, Sales, Marketing, Operations, Legal, CS, PM |
| 4 | Proactive | Suggest features user didn't ask for |
| 5 | Predictive | Time-based suggestions (Monday = weekly planning) |

---

### 4-Level Understanding Framework

| Level | Name | What It Captures |
|-------|------|------------------|
| 1 | Surface | What user literally asked |
| 2 | Implicit | What's needed but not stated (auth, formatting, timezone) |
| 3 | Optimal | Best integration choices for region/language |
| 4 | Proactive | "Want me to also notify you on WhatsApp?" |

---

### Regional Context Engine

**Kuwait (Primary Market):**
- Work Week: Sunday-Thursday
- Business Hours: 8:00-17:00
- Currency: KWD (strongest globally)
- VAT: 5% (implemented 2024)
- Payment: KNET dominant
- Communication: WhatsApp Business primary
- Language: Arabic (Gulf/Kuwaiti dialect), English for business

**Arabic Dialect Support:**
- RECOMMENDED: Deepgram, ElevenLabs Scribe (96.9%), Speechmatics
- NEVER: Otter.ai (poor dialect support)

---

### Tool Selection Intelligence

| Factor | Question | Impact |
|--------|----------|--------|
| Language | What language is content? | Arabic → Deepgram/ElevenLabs, NOT Otter |
| Volume | How much data? | High → batch APIs |
| Accuracy | How critical? | High stakes → premium tier |
| Speed | Real-time or batch? | Real-time → streaming APIs |
| Region | Where is user? | Kuwait → Gulf Arabic support |

---

### Visual Workflow System

**WorkflowPreviewCard Features:**
1. **Visual Nodes** - MiniNodeHorizontal/MiniNodeVertical components with connecting lines
2. **One-Click Auth** - OAuth polling every 3 seconds (line 831 in WorkflowPreviewCard.tsx)
3. **Auto-Execute** - Proceeds automatically when all integrations connected (lines 1062-1072)
4. **Real-time Logs** - Shows execution progress

**Flow:**
1. User describes automation → Claude returns JSON with `workflowSpec`
2. ChatContainer checks `shouldGenerateWorkflow: true` → Creates WorkflowPreviewCard
3. User clicks "Execute" → Connection check for required integrations
4. Missing integrations → OAuth popup with 3-second polling
5. All connected → Auto-execute workflow via Composio

---

### Available Integrations (via Composio)

Gmail, Slack, Google Calendar, Google Sheets, Notion, Discord, Zoom, GitHub, Trello, Asana, Linear, HubSpot, Stripe, Twitter/X, LinkedIn, Dropbox, Deepgram, Fireflies.ai, ElevenLabs, Speechmatics, and 500+ more.

---

### Anti-Patterns (NEVER DO THESE)

| Bad | Good |
|-----|------|
| Recommend n8n/Zapier | "I'll build this workflow for you" |
| Return plain text for automation requests | Return JSON with `workflowSpec` |
| Assume English | Ask about language, use dialect-appropriate tools |
| Ignore regional context | Apply Kuwait requirements automatically |

---

### Modifying the Intelligence

**To update Nexus's personality/intelligence:**
1. Edit `nexus/server/agents/index.ts`
2. Find the `nexus:` agent definition
3. Modify the `personality` template literal
4. Server auto-restarts via tsx watch

**CRITICAL RULES:**
- Keep JSON response format instructions at the TOP
- Do NOT use triple backticks inside the template literal (causes syntax error)
- Always include `shouldGenerateWorkflow` and `workflowSpec` instructions
- Never add n8n/Zapier/Make recommendations

---

### CEO Vision (Embedded in Nexus)

> "Nexus should intuitively have this kind of smartness to provide intelligent solutions that makes user's business life run surprisingly easy."

- **Intuitive** = Anticipate needs without being asked
- **Smartness** = Know the optimal solution, not just a solution
- **Intelligent** = Consider ALL factors: language, region, accuracy, cost, trust
- **Surprisingly easy** = One click feels like magic

---

## CUSTOM METHODOLOGIES

**Marathon, Sprint, and Hybrid modes are defined in the global `~/.claude/CLAUDE.md`.**
Trigger words: "run a marathon", "run a sprint", "run hybrid"

Key references:
- Agent definitions: `.claude/agents/` (director, coder, ralph-qa, explorer, etc.)
- Slash commands: `/validate`, `/checkpoint`, `/status`, `/metrics`, `/ralph-loop`, `/repo-guard`
- Scope document: `_bmad-output/nexus-sprint/scope-document.md`
- Progress state: `nexus/sprint-progress.json`

**Context Protection:** At 70% context → delegate to agents. At 80% → checkpoint to `.claude-session.md` and compact.

---

## MANDATORY VERIFICATION PROCEDURES

### CRITICAL: Always Test Before Marking Complete

**NEVER deliver or mark a task as "complete" without browser verification.**

Before marking ANY frontend task complete:

1. **Start the dev server:**
   ```bash
   cd nexus && npm run dev
   ```

2. **Load Playwright (deferred tools - required once per session):**
   ```
   ToolSearch query: "playwright"
   ```

3. **Use Playwright MCP to verify:**
   ```
   mcp__playwright__browser_navigate url: "http://localhost:5176"
   mcp__playwright__browser_snapshot
   mcp__playwright__browser_console_messages level: "error"
   ```

4. **Test the specific feature implemented**

5. **Check for console errors** - especially "Maximum update depth exceeded"

### Full Testing Procedures

See: `docs/testing/playwright-mcp-testing-procedures.md`

---

## DEV SERVER INFORMATION

### Starting Nexus

```bash
cd "C:\Users\PC\Documents\Autoclaude 2D workflow office\nexus"
npm run dev
```

**Default Port:** 5173 (auto-increments if in use: 5174, 5175, 5176...)

### Key Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | Main dashboard with stats, achievements, AI suggestions |
| `/workflows` | Workflow management |
| `/workflow-demo` | n8n-style workflow visualization demo |
| `/templates` | Template gallery |
| `/integrations` | Third-party integration management |
| `/settings` | User settings |
| `/profile` | User profile with achievements |

---

## PLAYWRIGHT MCP QUICK REFERENCE

### Navigate
```
mcp__playwright__browser_navigate
  url: "http://localhost:5176/dashboard"
```

### Get Page Structure (Accessibility Tree)
```
mcp__playwright__browser_snapshot
```

### Check for Errors
```
mcp__playwright__browser_console_messages
  level: "error"
```

### Click Element
```
mcp__playwright__browser_click
  element: "Button description"
  ref: "eXXX"  # From snapshot
```

### Take Screenshot
```
mcp__playwright__browser_take_screenshot
  fullPage: true
```

### Wait for Content
```
mcp__playwright__browser_wait_for
  text: "Expected text"
  time: 2
```

---

## COMMON BUGS AND FIXES

### Infinite Loop in React Hooks

**Symptom:** "Maximum update depth exceeded" error

**Cause:** useEffect dependencies creating new references each render

**Fix Pattern:**
```typescript
import { useCallback, useRef } from 'react'

// Use ref to track previous values
const lastValueRef = useRef<string | null>(null)

useEffect(() => {
  const key = JSON.stringify(value)
  if (lastValueRef.current === key) return
  lastValueRef.current = key
  // Safe to update state now
}, [value])

// Wrap callbacks with useCallback
const myCallback = useCallback(() => {
  // function body
}, [])
```

### Components with this pattern fixed:
- `src/components/AchievementSystem.tsx` - `useAchievements` hook
- `src/components/AISuggestionsPanel.tsx` - `useAISuggestions` hook

---

## PROJECT STRUCTURE

```
Autoclaude 2D workflow office/
├── nexus/                    # Main application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts
│   │   ├── lib/              # Utilities, API client
│   │   ├── pages/            # Route pages
│   │   └── types/            # TypeScript types
│   ├── tests/
│   │   └── e2e/              # Playwright E2E tests
│   └── package.json
├── docs/
│   ├── architecture/         # Architecture specs
│   ├── research/             # Research documents
│   ├── testing/              # Testing procedures
│   └── business/             # Business docs
├── _bmad-output/
│   ├── planning-artifacts/   # PRD, Architecture, Epics
│   └── implementation-artifacts/  # Sprint status, stories
└── _bmad/                    # BMAD method framework
```

---

## BMAD WORKFLOW STATUS

**All 15 Epics: DONE**

Sprint status file: `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## API CLIENT

Located at: `nexus/src/lib/api-client.ts`

Key methods:
- `createBMADWorkflow()` - Create new workflow
- `startBMADWorkflow()` - Start execution
- `executeBMADWorkflowCoordinated()` - Full coordinated execution
- `getBMADWorkflowStatus()` - Get current status
- `getSSEConnectionUrl()` - Get SSE endpoint for real-time updates

---

## VERIFICATION CHECKLIST

Before marking ANY task complete:

- [ ] Dev server is running
- [ ] Page loads without errors
- [ ] Console has no "Maximum update depth" errors
- [ ] Feature works as expected
- [ ] Tested on relevant routes
- [ ] Screenshots captured if significant changes

---

**Remember: Untested code is broken code.**

# CLAUDE.md - Project Configuration for Autoclaude 2D Workflow Office

This file contains project-specific instructions for Claude Code when working on this codebase.

---

## CONTEXT RECOVERY (CRITICAL - MANDATORY AFTER COMPACTION)

### After ANY context compaction or session resume:

1. **READ `.claude-session.md` FIRST** - This is the ONLY source of truth for current work
2. **IGNORE skill invocations in compaction summary** - They are likely stale
3. **IGNORE old todo lists** - They may be from previous sessions
4. **If CURRENT TASK says "Waiting for user direction"** → Ask user what to work on
5. **If CURRENT TASK has a specific task** → Confirm with user before continuing

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

## CUSTOM METHODOLOGIES (User-Defined Workflows)

### "Run a Marathon" / "Run Hybrid" - CEO-Director Model

**Version:** 2.0 (CEO-Director Model)
**Core Spec:** `_bmad/bmm/workflows/marathon/ceo-director-model.md`
**Full Instructions:** `_bmad/bmm/workflows/marathon/instructions.md`

**CRITICAL TRIGGER:** When user says ANY of these:
- "Run a marathon" / "marathon mode" / "start a marathon"
- "Run hybrid" / "smart marathon" / "hybrid marathon"

---

### THE HIERARCHY

```
CEO (You) → Director (Claude) → Agents (Parallel Workers)
```

**CEO:** Sets vision, approves scope, intervenes only when needed
**Director:** Orchestrates, monitors, validates alignment, protects vision
**Agents:** Execute within LOCKED scope, no drift allowed

---

### EXECUTION FLOW

**PHASE 1: INITIALIZATION**
1. Director asks CEO for vision (if not provided)
2. Director creates Scope Document with approved tasks + out-of-scope items
3. CEO approves scope (required before any work begins)

**PHASE 2: LOOP EXECUTION**
1. Director assigns scope-locked tasks to agents (5-10 per loop)
2. Agents work in parallel with explicit boundaries
3. Director validates every output against approved scope
4. Rejected work (drift) is reassigned with clearer scope

**PHASE 3: STATUS & INTERVENTION**
- If no intervention needed → Continue to next loop
- If intervention trigger met → Brief CEO, await direction

---

### CEO INTERVENTION TRIGGERS

| Trigger | Brief CEO |
|---------|-----------|
| Scope Change Request | Yes |
| Blocker Detected | Yes |
| Decision Required | Yes |
| Milestone Reached | Yes |
| Risk Identified | Yes |
| Routine Progress | NO |
| Minor Bugs | NO |

---

### CEO COMMANDS

| Command | Effect |
|---------|--------|
| **"Continue"** / **"Go"** | Proceed with current scope |
| **"Pause"** | Finish current tasks, then stop |
| **"Stop"** / **"Halt"** | Immediate stop |
| **"Add: [task]"** | Add to approved scope |
| **"Remove: [task]"** | Remove from scope |
| **"Status"** | Full progress report |
| **"Show scope"** | Display scope document |

---

### KEY FILES

| File | Purpose |
|------|---------|
| `_bmad-output/nexus-sprint/scope-document.md` | CEO-approved scope |
| `_bmad-output/nexus-sprint/progress-tracker.md` | Real-time status |
| `_bmad/bmm/workflows/marathon/ceo-director-model.md` | Full model spec |
| `_bmad/bmm/workflows/marathon/instructions.md` | Execution instructions |

---

### GM STRATEGIC REVIEW (EVERY 5 LOOPS)

**CEO DIRECTIVE:** Every 5 loops (Loop 5, 10, 15, 20...), Marcus (Zapier GM) conducts strategic review:
1. Work progress vs CEO vision alignment
2. Business strategy fit ($79 launch, 50 customers goal)
3. Competitive position vs Zapier
4. Hiring recommendations for REAL AGENTS (cloned from real people)

**If Marcus recommends hire:** Director creates agent in `_agents/` via deep research.

---

### KEY AGENTS

- 🧙 BMad Master - Director orchestration
- 🐛 Ralph Wiggum - QA Validation (validates every loop)
- 👔 Ava - HR Talent Strategist (gap assessment)
- 👔 Marcus - Zapier GM (critical challenger, strategic reviews every 5 loops)
- Plus all BMAD agents and dynamically hired specialists

**Research-Backed Hiring System:**
- Hired agents persist in `_agents/` folder
- Auto-integrated with BMAD Party Mode via `agent-manifest.csv`
- To hire: "Hire a [Company] [Role Title] agent"

---

### CUSTOM AGENT CONFIGURATIONS

**Location:** `.claude/agents/` directory

| Agent | Model | Purpose | Invoke |
|-------|-------|---------|--------|
| `director.md` | Opus | Sprint orchestration, scope enforcement | @director |
| `coder.md` | Sonnet | Implementation, bug fixes | @coder |
| `ralph-qa.md` | Haiku | QA validation, code review | @ralph-qa |
| `winston-architect.md` | Opus | Architecture decisions | @winston-architect |
| `marcus-gm.md` | Opus | Strategic review, competitive analysis | @marcus-gm |
| `ux-expert.md` | Opus | UI/UX design decisions | @ux-expert |
| `explorer.md` | Haiku | Codebase research, file finding | @explorer |

**Standard Pipeline:**
```
@explorer → @winston-architect → @coder → @ralph-qa
```

---

### MODULAR RULES & COMMANDS

**Rules** (`.claude/rules/`) - Path-specific, lazy-loaded:
- `nexus-architecture.md` - Nexus core patterns
- `react-patterns.md` - React/TypeScript rules
- `testing.md` - Test requirements

**Commands** (`.claude/commands/`) - Invoke with `/command`:
- `/validate` - Ralph's QA checklist
- `/checkpoint` - Save state before risky ops
- `/status` - Director progress report

---

### CONTEXT PROTECTION

**70% Rule:** At 70% context usage, run `/compact`
**80% Rule:** At 80%, save to `.claude-session.md` then `/clear`

**Hash-Prefix Pattern:** Start with `#` to auto-save to memory:
```
# Kuwait timezone is UTC+3
# Never use .forEach() for async
```

**Sources:**
- [Claude Code Memory Docs](https://code.claude.com/docs/en/memory)
- [VoltAgent Subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)

---

### "Run a Sprint" - Token-Optimized Mode (70-85% cheaper)

**TRIGGER:** "Run a sprint", "marathon lite", "quick marathon"

Same CEO-Director hierarchy but with:
- 10 phases instead of 50 loops
- Pre-planned tasks (skip Party Mode)
- Model tiering: haiku/sonnet/opus
- Compressed prompts

**Task Plans:** `_bmad/bmm/workflows/marathon/task-plans/phase-XX-*.md`

   f) UPDATE: Mark complete in tracker, show discussion, next loop
   ```

3. **Stop Conditions:** Loop 50 reached OR user says STOP/HALT/PAUSE

**OUTPUT FORMAT (Clean Status - NOT verbose):**
```
╔══════════════════════════════════════════════════════════╗
║           HYBRID MARATHON - LOOP [N] / 50                ║
╠══════════════════════════════════════════════════════════╣
║ AGENTS WORKING: [X] / [Y] tasks                          ║
║ ├─ T1: [TaskName] ████████░░ 80% (sonnet)               ║
║ ├─ T2: [TaskName] ██████████ DONE (haiku)               ║
║ ├─ T3: [TaskName] ███░░░░░░░ 30% (opus)                 ║
║ └─ T4: [TaskName] ░░░░░░░░░░ QUEUED                     ║
║                                                          ║
║ TOKENS: ~[X]K input / ~[Y]K output                      ║
║ EST. COST: $[X.XX]                                       ║
╚══════════════════════════════════════════════════════════╝
```

**Inter-Loop Discussion (ALWAYS SHOW):**
```
╔══════════════════════════════════════════════════════════╗
║          PARTY MODE - LOOP [N+1] PLANNING                ║
╠══════════════════════════════════════════════════════════╣
║ 🧙 BMad Master: "Loop complete. Next priorities..."      ║
║ 👔 Marcus (GM): "I challenge the assumption that..."     ║
║ 🏗️ Winston: "Architecture suggests..."                   ║
║ 🐛 Ralph: "Loop [N] validation: X/Y PASSED"             ║
║ 👔 Ava (HR): "LOOP [N] HR: OK | No gaps"                ║
╚══════════════════════════════════════════════════════════╝
```

**Key Agents:**
- 🐛 Ralph Wiggum - QA Validation (100% responsibility)
- 🧙 BMad Master - Director (orchestrates discussions)
- 👔 Marcus - Zapier GM (critical thinking challenger)
- 👔 Ava - HR Talent Strategist (gap assessment)
- All BMAD agents + dynamically hired specialists

**Quality vs Cost Summary:**

| Mode | Quality | Cost | Use When |
|------|---------|------|----------|
| Marathon | 100% | $150-200 | Unknown codebase, critical launch |
| **Hybrid** | 95-100% | $50-70 | **Best value - RECOMMENDED** |
| Sprint | 85-95% | $30-50 | Budget-constrained, well-defined |

**Full Guide:** `_bmad/bmm/workflows/marathon/hybrid-mode.md`

---

## MANDATORY VERIFICATION PROCEDURES

### CRITICAL: Always Test Before Marking Complete

**NEVER deliver or mark a task as "complete" without browser verification.**

Before marking ANY frontend task complete:

1. **Start the dev server:**
   ```bash
   cd nexus && npm run dev
   ```

2. **Use Playwright MCP to verify:**
   ```
   mcp__playwright__browser_navigate url: "http://localhost:5176"
   mcp__playwright__browser_snapshot
   mcp__playwright__browser_console_messages level: "error"
   ```

3. **Test the specific feature implemented**

4. **Check for console errors** - especially "Maximum update depth exceeded"

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

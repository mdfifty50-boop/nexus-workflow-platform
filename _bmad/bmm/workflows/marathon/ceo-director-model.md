# CEO-Director-Agent Model
## Continuous Parallel Workflow with Minimal Intervention

**Version:** 2.0
**Replaces:** Original Marathon/Hybrid workflows
**Purpose:** Optimal continuous work with CEO oversight, Director orchestration, zero drift

---

## The Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                         CEO (You)                           │
│  • Sets vision and scope                                    │
│  • Approves major decisions                                 │
│  • Receives Director briefings                              │
│  • Intervenes only when requested                           │
└─────────────────────────────────────────────────────────────┘
                              │
                    BRIEFINGS & REQUESTS
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DIRECTOR (Claude)                      │
│  • Translates CEO vision into actionable scope              │
│  • Assigns work to agents                                   │
│  • Monitors all agent progress in real-time                 │
│  • Validates alignment before any output is finalized       │
│  • Reports to CEO with structured updates                   │
│  • BLOCKS any work outside approved scope                   │
└─────────────────────────────────────────────────────────────┘
                              │
                    SCOPE-LOCKED ASSIGNMENTS
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   AGENT 1     │   │   AGENT 2     │   │   AGENT 3     │
│  (Parallel)   │   │  (Parallel)   │   │  (Parallel)   │
│               │   │               │   │               │
│ Works ONLY on │   │ Works ONLY on │   │ Works ONLY on │
│ assigned task │   │ assigned task │   │ assigned task │
│ from Director │   │ from Director │   │ from Director │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                    COMPLETED WORK REVIEW
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DIRECTOR VALIDATION                       │
│  • Does output match assigned scope? YES/NO                 │
│  • Does output align with CEO vision? YES/NO                │
│  • Any drift or hallucination detected? YES/NO              │
│  • If NO to any: REJECT and reassign                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Principles

### 0. CONTEXT WINDOW PROTECTION (CRITICAL - From Leon van Zyl)

**The Problem:**
- Main conversation has 200K token limit
- At ~80%, auto-compacting starts dropping early context
- Complex projects fail because early decisions are lost
- This is WHY agents "forget" the CEO vision mid-sprint

**The Solution: Sub-Agent Isolation**
Each sub-agent runs in its **OWN isolated 200K context window**.
Sub-agent token usage does **NOT** affect main Director conversation.
Only **summaries** return to main thread.

```
┌─────────────────────────────────────────────────────────────┐
│              MAIN DIRECTOR CONTEXT (200K)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CEO Vision + Scope + Status Updates Only           │   │
│  │  Target: Keep under 50% usage                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    Only SUMMARIES return
                              │
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  AGENT 1     │  │  AGENT 2     │  │  AGENT 3     │
│  Own 200K    │  │  Own 200K    │  │  Own 200K    │
│  context     │  │  context     │  │  context     │
│              │  │              │  │              │
│ Can use 100% │  │ Can use 100% │  │ Can use 100% │
│ No impact on │  │ No impact on │  │ No impact on │
│ Director     │  │ Director     │  │ Director     │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Director Rules for Context Protection:**
1. **NEVER** do research/exploration directly → Use Explore agent
2. **NEVER** write code directly → Use coder agents
3. **NEVER** do reviews directly → Use reviewer agents (Ralph)
4. **ALWAYS** use `run_in_background: true` for Task tool
5. **ALWAYS** request summary-only returns from agents

**Agent Return Protocol (MANDATORY):**
```
STATUS: [SUCCESS | PARTIAL | BLOCKED | FAILED]
SUMMARY: [2-3 sentences max - what was accomplished]
FILES_MODIFIED: [list of file paths only, no content]
ISSUES: [blockers or concerns, if any]
NEXT_STEPS: [what should happen next, if relevant]
```

**Agents MUST NOT return:**
- Full file contents
- Complete code snippets in report
- Verbose explanations
- Debug logs or tool outputs
- Anything over 500 tokens

**Context Checkpoints:**
| Usage | Action |
|-------|--------|
| <50% | Normal operation |
| 50-70% | Increase sub-agent usage, minimize Director direct work |
| 70-80% | ONLY use sub-agents, no direct Director analysis |
| >80% | CRITICAL: Consider clearing conversation, checkpoint progress |

**Monitoring:** Run `/usage` at every loop boundary to check context.

**Loop Boundary Protocol:**
1. Check `/usage` before starting new loop
2. If >70%: Run `/checkpoint` command, then `/compact`
3. If >80%: Save session state to `.claude-session.md`, then `/clear`
4. Resume by loading session file with `@.claude-session.md`

**Hash-Prefix Memory Pattern:**
When CEO states a preference or a pattern is discovered, prefix with `#` to persist:
```
# Never use .forEach() for async operations
# All API responses must include error handling
# Kuwait timezone is UTC+3
```
This auto-saves to CLAUDE.md for future sessions.

---

### 1. SCOPE LOCK (Zero Drift Guarantee)

**Before any work begins:**
```
CEO VISION → DIRECTOR TRANSLATES → SCOPE DOCUMENT CREATED
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │ APPROVED SCOPE│
                                   │               │
                                   │ • Task 1      │
                                   │ • Task 2      │
                                   │ • Task 3      │
                                   │ • ...         │
                                   │               │
                                   │ OUT OF SCOPE: │
                                   │ • Everything  │
                                   │   else        │
                                   └───────────────┘
```

**Agents receive:**
- ONLY their specific task from approved scope
- EXPLICIT boundaries (what NOT to do)
- SUCCESS CRITERIA (how Director will validate)

**Agents CANNOT:**
- Add features not in scope
- "Improve" things they weren't asked to
- Make architectural decisions without Director approval
- Communicate directly with CEO (only through Director)

### 2. DIRECTOR RESPONSIBILITIES

The Director (Claude orchestrating) MUST:

| Responsibility | How |
|----------------|-----|
| **Protect Vision** | Every task checked against CEO's stated goals |
| **Prevent Drift** | Reject any work that adds unauthorized scope |
| **Monitor Progress** | Track all parallel agents in real-time |
| **Filter Noise** | Only escalate to CEO when genuinely needed |
| **Maintain Context** | Keep running summary of what's done/pending |
| **Validate Alignment** | Check every deliverable before accepting |

### 3. CEO INTERVENTION TRIGGERS

**Director MUST brief CEO when:**

| Trigger | Example |
|---------|---------|
| **Scope Change Request** | Agent suggests feature outside approved scope |
| **Blocker Detected** | Technical limitation prevents approved task |
| **Decision Required** | Multiple valid approaches, need CEO preference |
| **Milestone Reached** | Significant chunk of work complete |
| **Risk Identified** | Something might not work as planned |
| **Resource Question** | Should we hire an agent for X? |

**Director MUST NOT bother CEO for:**

| NOT an Intervention | Why |
|---------------------|-----|
| Routine progress updates | Director handles monitoring |
| Technical implementation details | Agents are trusted to execute |
| Minor bugs/fixes | Part of normal work |
| Agent coordination | Director's job |
| Template decisions | Within approved scope |

### 4. PARALLEL EXECUTION MODEL

```
LOOP START
    │
    ├── DIRECTOR: Assigns 5-10 tasks from approved scope
    │
    ├── PARALLEL EXECUTION (ALL AT ONCE):
    │   ├── Agent 1: Task A ████████░░ 80%
    │   ├── Agent 2: Task B ██████████ DONE
    │   ├── Agent 3: Task C ███░░░░░░░ 30%
    │   ├── Agent 4: Task D ██████░░░░ 60%
    │   └── Agent 5: Task E ████████░░ 80%
    │
    ├── DIRECTOR: Validates completed work
    │   ├── Task B: ✓ Aligned with scope
    │   └── Task B: ✓ No drift detected
    │
    ├── DIRECTOR: Checks if CEO intervention needed
    │   └── NO → Continue to next loop
    │
    └── LOOP CONTINUES (no CEO interruption)

ONLY WHEN INTERVENTION TRIGGER MET:
    │
    ├── DIRECTOR: Pauses new assignments
    │
    ├── DIRECTOR: Briefs CEO with structured format
    │
    ├── CEO: Provides direction
    │
    ├── DIRECTOR: Updates scope if needed
    │
    └── LOOP RESUMES
```

---

## The Scope Document

### Created ONCE at Start (Updated Only by CEO)

```markdown
# NEXUS SCOPE DOCUMENT v1.0
## Approved by CEO: [Date]

### VISION
[CEO's exact words about what Nexus should be]

### CURRENT PHASE
[What we're building right now]

### APPROVED TASKS
1. [Task with clear deliverable]
2. [Task with clear deliverable]
3. [Task with clear deliverable]
...

### EXPLICITLY OUT OF SCOPE
- [Thing we're NOT doing]
- [Thing we're NOT doing]
- [Feature for later, not now]

### SUCCESS CRITERIA
- [How we know this phase is done]

### CEO PREFERENCES
- [Style preferences]
- [Technical preferences]
- [Communication preferences]

### GUARDRAILS
- No new features without CEO approval
- No architectural changes without CEO approval
- No external dependencies without CEO approval
```

---

## Director Briefing Format

### Standard Update (No Intervention Needed)

```
╔══════════════════════════════════════════════════════════════╗
║                    DIRECTOR STATUS UPDATE                     ║
║                    Loop [X] Complete                          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  COMPLETED THIS LOOP:                                        ║
║  ✓ [Task] - [One line result]                               ║
║  ✓ [Task] - [One line result]                               ║
║  ✓ [Task] - [One line result]                               ║
║                                                              ║
║  IN PROGRESS:                                                ║
║  ◐ [Task] - [X]% complete                                   ║
║  ◐ [Task] - [X]% complete                                   ║
║                                                              ║
║  SCOPE ALIGNMENT: ✓ All work within approved scope          ║
║                                                              ║
║  CEO INTERVENTION: NOT REQUIRED                              ║
║                                                              ║
║  [Continuing to next loop...]                               ║
╚══════════════════════════════════════════════════════════════╝
```

### Intervention Request

```
╔══════════════════════════════════════════════════════════════╗
║              ⚠️ DIRECTOR REQUESTS CEO INPUT ⚠️                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  TRIGGER: [Scope Change / Blocker / Decision / Risk]        ║
║                                                              ║
║  SITUATION:                                                  ║
║  [2-3 sentences explaining what happened]                   ║
║                                                              ║
║  OPTIONS:                                                    ║
║  A) [Option with trade-offs]                                ║
║  B) [Option with trade-offs]                                ║
║  C) [Option with trade-offs]                                ║
║                                                              ║
║  DIRECTOR RECOMMENDATION: [A/B/C] because [reason]          ║
║                                                              ║
║  AGENTS STATUS: [Paused / Working on other tasks]           ║
║                                                              ║
║  AWAITING YOUR DIRECTION...                                 ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Agent Assignment Format

### What Each Agent Receives

```markdown
## AGENT ASSIGNMENT: [Agent Name]
### From: Director
### Scope Lock: ACTIVE

---

## YOUR TASK
[Specific task description]

## SUCCESS CRITERIA
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Measurable outcome 3]

## BOUNDARIES (DO NOT EXCEED)
- Only modify files: [list]
- Do not add features beyond: [specific scope]
- Do not change: [protected areas]

## CONTEXT FROM CEO VISION
[Relevant excerpt from scope document]

## REPORT FORMAT
When complete, provide:
1. What was done
2. Files modified
3. Any issues encountered
4. Alignment confirmation

## IF BLOCKED
Do NOT improvise. Report to Director:
- What's blocking you
- What you need
- Suggested solutions
```

---

## Anti-Hallucination Guardrails

### 1. EXPLICIT SCOPE BINDING

Every agent task includes:
```
SCOPE_BINDING:
  approved_files: [list of files agent can touch]
  approved_features: [list of features agent can implement]
  forbidden_actions: [list of things agent must NOT do]
  escalation_triggers: [when to stop and ask Director]
```

### 2. OUTPUT VALIDATION

Before any agent work is accepted:
```
DIRECTOR VALIDATION CHECKLIST:
□ Does output match the assigned task exactly?
□ Were any unauthorized files modified?
□ Were any unauthorized features added?
□ Does code/content align with CEO's stated preferences?
□ Is there any scope creep (even if "helpful")?

If ANY checkbox fails → REJECT and reassign
```

### 3. CONTEXT ANCHORING

Every loop begins with:
```
DIRECTOR CONTEXT ANCHOR:
- CEO Vision: [exact quote]
- Current Phase: [what we're doing]
- Approved Scope: [task list]
- Completed: [what's done]
- Remaining: [what's left]
- Out of Scope: [what we're NOT doing]
```

This prevents drift over long sessions.

### 4. PROGRESS TRACKING FILE

Maintained in real-time:
```
_bmad-output/nexus-optimization-loops/progress-tracker.md

## CEO VISION (Locked)
[Original vision, never modified by agents]

## APPROVED SCOPE (CEO can modify)
[Current task list]

## COMPLETED
- [Task] - [Date] - [Agent] - ✓ Validated

## IN PROGRESS
- [Task] - [Agent] - [Status]

## BLOCKED (Awaiting CEO)
- [Task] - [Reason]

## REJECTED (Scope Drift Detected)
- [Task] - [What was wrong] - [Reassigned to]
```

---

## Execution Flow

### INITIALIZATION (Once)

```
1. CEO provides vision/goals
2. Director creates SCOPE DOCUMENT
3. CEO approves scope document
4. Director creates PROGRESS TRACKER
5. Loop begins
```

### LOOP EXECUTION (Continuous)

```
FOR EACH LOOP:

1. DIRECTOR: Review progress tracker
2. DIRECTOR: Select next 5-10 tasks from approved scope
3. DIRECTOR: Create scope-locked assignments for each agent
4. DIRECTOR: Launch all agents in parallel (one message, multiple Task calls)

5. WHILE agents working:
   - DIRECTOR: Monitor progress
   - DIRECTOR: Collect completed work
   - DIRECTOR: Validate alignment

6. FOR EACH completed task:
   - IF aligned: Accept, update tracker
   - IF drifted: Reject, reassign with clearer scope

7. DIRECTOR: Check intervention triggers
   - IF trigger met: Brief CEO, await direction
   - IF no trigger: Continue to next loop

8. DIRECTOR: Provide status update to CEO
   - Standard format if no intervention
   - Intervention format if needed

9. REPEAT until scope complete or CEO says STOP
```

---

## Wave-Based Execution Model

### Why Waves?

From Leon van Zyl's "24-Hour Autonomous Coding" approach:
- Group related tasks into **waves**
- All agents in a wave run in **parallel**
- **Gates** between waves ensure dependencies are met
- Maximum parallelism with proper sequencing

### Wave Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    WAVE 1: PLANNING (Parallel)                  │
├─────────────────────────────────────────────────────────────────┤
│  @explorer          @winston-architect     @ux-expert           │
│  Research &         Architecture &         UI/UX Design         │
│  Analysis           Technical Plan         & Mockups            │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   GATE: All pass  │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                 WAVE 2: DOCUMENTATION (Parallel)                │
├─────────────────────────────────────────────────────────────────┤
│  Tech Spec Writer      API Docs Writer      User Guide Writer   │
│  (Haiku)               (Haiku)              (Haiku)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   GATE: All pass  │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│               WAVE 3: IMPLEMENTATION (Parallel)                 │
├─────────────────────────────────────────────────────────────────┤
│  @coder (Frontend)    @coder (Backend)     @coder (Integration) │
│  (Sonnet)             (Sonnet)             (Sonnet)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   GATE: All pass  │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                  WAVE 4: QUALITY (Parallel)                     │
├─────────────────────────────────────────────────────────────────┤
│  @ralph-qa (Review)   Test Runner          Security Auditor     │
│  (Haiku)              (Haiku)              (Haiku)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   GATE: All pass  │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │  COMMIT & DEPLOY  │
                    └───────────────────┘
```

### Wave Execution Rules

1. **All agents in a wave start simultaneously**
2. **Gate only opens when ALL agents in wave complete**
3. **If any agent fails, wave is blocked** - Director decides: retry or escalate
4. **Clear context between waves** for long-running projects
5. **Commit checkpoint after each wave** for recovery

### Director Wave Assignment Format

```markdown
## WAVE [N] ASSIGNMENT
### Wave Type: [PLANNING | DOCUMENTATION | IMPLEMENTATION | QUALITY]
### Gate Requirement: All [X] agents must complete before Wave [N+1]

---

AGENT 1: @[agent-name]
TASK: [specific task]
DEADLINE: End of Wave [N]

AGENT 2: @[agent-name]
TASK: [specific task]
DEADLINE: End of Wave [N]

---

WAVE GATE CRITERIA:
- [ ] Agent 1 reports SUCCESS
- [ ] Agent 2 reports SUCCESS
- [ ] No BLOCKED status from any agent
- [ ] All outputs pass Director validation

IF GATE FAILS:
- Identify failing agent(s)
- Reassign with clearer scope OR escalate to CEO
```

### Wave Status Format

```
╔══════════════════════════════════════════════════════════════╗
║               WAVE [N] STATUS: [PLANNING/IMPL/QUALITY]       ║
╠══════════════════════════════════════════════════════════════╣
║  AGENTS IN WAVE: [X]                                         ║
║                                                              ║
║  @explorer      ██████████ DONE ✓                           ║
║  @winston       ████████░░ 80%                               ║
║  @ux-expert     ██████░░░░ 60%                               ║
║                                                              ║
║  GATE STATUS: WAITING (2/3 complete)                         ║
║  NEXT WAVE: IMPLEMENTATION (blocked until gate passes)       ║
╚══════════════════════════════════════════════════════════════╝
```

### CEO COMMANDS

| Command | Effect |
|---------|--------|
| **"Continue"** | Director proceeds with current scope |
| **"Pause"** | All agents complete current task then stop |
| **"Stop"** | Immediate halt |
| **"Add to scope: [X]"** | Director adds to approved scope |
| **"Remove from scope: [X]"** | Director removes from approved scope |
| **"Prioritize: [X]"** | Director reorders task queue |
| **"Show status"** | Director provides full progress report |
| **"Why [X]?"** | Director explains decision/recommendation |

---

## Integration with Existing Agents

### Agent Roles in This Model

| Agent | Role | Reports To |
|-------|------|------------|
| **Director** (Claude) | Orchestration, validation, CEO communication | CEO |
| **BMad Master** | Workflow coordination within loops | Director |
| **Winston (Architect)** | Technical design tasks | Director |
| **Amelia (Dev)** | Implementation tasks | Director |
| **Sally (UX)** | Design tasks | Director |
| **John (PM)** | Requirements clarification | Director |
| **Ralph (QA)** | Validation after implementation | Director |
| **Ava (HR)** | Gap analysis, hire recommendations | Director |
| **Marcus (GM)** | Critical review of proposals | Director |
| **Zara (UI)** | UI implementation | Director |

### Agent Communication Rules

```
ALLOWED:
- Agent → Director: Task complete, blocked, need clarification
- Director → Agent: Assignment, feedback, scope clarification
- Director → CEO: Status update, intervention request
- CEO → Director: Direction, scope changes, commands

NOT ALLOWED:
- Agent → CEO: Direct communication (must go through Director)
- Agent → Agent: Coordination (Director handles this)
- Agent → Scope: Modification (only CEO can change scope)
```

---

## Custom Agent Configurations

### Location
All custom agents are defined in `.claude/agents/` directory.

### Available Agents

| Agent File | Name | Model | Purpose |
|------------|------|-------|---------|
| `director.md` | @director | Opus | Sprint orchestrator, scope enforcement |
| `coder.md` | @coder | Sonnet | Implementation, bug fixes |
| `ralph-qa.md` | @ralph-qa | Haiku | QA validation, code review |
| `winston-architect.md` | @winston-architect | Opus | Architecture decisions |
| `marcus-gm.md` | @marcus-gm | Opus | Strategic review, competitive analysis |
| `ux-expert.md` | @ux-expert | Opus | UI/UX design decisions |
| `explorer.md` | @explorer | Haiku | Codebase research, file finding |

### Model Tiering Strategy

Based on Leon van Zyl's proven approach:

| Model | Cost | Use For |
|-------|------|---------|
| **Opus** | High | Planning, architecture, strategic decisions, UX design |
| **Sonnet** | Medium | Code implementation, feature development |
| **Haiku** | Low | Research, code review, validation, quick lookups |

### Invocation Pattern

```
1. @explorer (Haiku) → Research/understand first
2. @winston-architect (Opus) → If architectural decision needed
3. @ux-expert (Opus) → If UI/UX decision needed
4. @coder (Sonnet) → Implement the solution
5. @ralph-qa (Haiku) → Validate the implementation
6. @marcus-gm (Opus) → Every 5 loops for strategic review
```

### Coder → Reviewer Cycle

Inspired by Leon's workflow, every code change follows:

```
┌─────────┐     ┌─────────┐
│ @coder  │────▶│@ralph-qa│
│(Sonnet) │     │ (Haiku) │
└─────────┘     └────┬────┘
     ▲               │
     │    Issues?    │
     └───────────────┘
     Loop until PASS
```

### Context Protection via Agents

Each agent runs in **isolated 200K context window**:
- @explorer: Uses its context for searching, returns 5-line summary
- @coder: Uses its context for implementation, returns file list only
- @ralph-qa: Uses its context for review, returns PASS/FAIL + issues

**Director's context stays clean for orchestration.**

---

## File Locations

| File | Purpose |
|------|---------|
| `_bmad-output/nexus-sprint/scope-document.md` | CEO-approved scope (source of truth) |
| `_bmad-output/nexus-sprint/progress-tracker.md` | Real-time status |
| `_bmad-output/nexus-sprint/director-log.md` | All Director decisions and validations |
| `_bmad-output/nexus-sprint/loop-[N]-assignments.md` | Each loop's agent assignments |
| `_bmad-output/nexus-sprint/rejected-work.md` | Log of scope drift incidents |

---

## Trigger: "Run Marathon" or "Run Hybrid"

When CEO says either command:

1. Director reads this model specification
2. Director asks CEO for vision (if not already provided)
3. Director creates scope document for CEO approval
4. Director begins loop execution per this model
5. CEO receives structured updates per this model
6. Director requests intervention only per defined triggers

**The old loose discussion format is replaced by this structured model.**

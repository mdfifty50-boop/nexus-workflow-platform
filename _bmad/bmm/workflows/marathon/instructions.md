# Run a Marathon / Run Hybrid - CEO-Director Model
## Continuous Parallel Workflow with Minimal CEO Intervention

**Version:** 2.0 (CEO-Director Model)
**Core Spec:** See `ceo-director-model.md` for full model details

---

## Trigger Phrases
- "Run a marathon"
- "Run hybrid"
- "marathon mode"
- "start marathon"

---

## The Hierarchy

```
CEO (You) → Director (Claude) → Agents (Parallel Workers)
```

**CEO:** Sets vision, approves scope, intervenes only when needed
**Director:** Orchestrates, monitors, validates alignment, protects vision
**Agents:** Execute within LOCKED scope, no drift allowed

---

## PHASE 1: INITIALIZATION

### Step 1.1: Obtain CEO Vision

If CEO hasn't provided vision yet:
```
Director asks: "What's the vision for this sprint? What should Nexus become?"
```

Wait for CEO response. Do NOT proceed without clear vision.

### Step 1.2: Create Scope Document

Based on CEO vision, Director creates:
```
_bmad-output/nexus-sprint/scope-document.md
```

**Template:**
```markdown
# NEXUS SCOPE DOCUMENT v1.0
## Approved by CEO: [Date]

### VISION (CEO's Exact Words)
[Copy CEO's vision statement verbatim]

### CURRENT PHASE
[What we're building in this sprint]

### APPROVED TASKS
1. [ ] [Specific task with clear deliverable]
2. [ ] [Specific task with clear deliverable]
3. [ ] [Specific task with clear deliverable]
...

### EXPLICITLY OUT OF SCOPE
- [Thing we're NOT doing]
- [Thing that's for later, not now]
- [Feature that wasn't requested]

### SUCCESS CRITERIA
- [How we know this sprint is successful]

### CEO PREFERENCES
- [Style preferences stated by CEO]
- [Technical preferences stated by CEO]

### GUARDRAILS
- No new features without CEO approval
- No architectural changes without CEO approval
- No scope expansion without CEO approval
- Agents work ONLY on approved tasks
```

### Step 1.3: CEO Approval

Present scope document to CEO:
```
╔══════════════════════════════════════════════════════════════╗
║              DIRECTOR: SCOPE DOCUMENT FOR APPROVAL           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Based on your vision, here's the proposed scope:           ║
║                                                              ║
║  TASKS:                                                      ║
║  1. [Task]                                                   ║
║  2. [Task]                                                   ║
║  ...                                                         ║
║                                                              ║
║  OUT OF SCOPE:                                               ║
║  - [Excluded item]                                           ║
║                                                              ║
║  Do you approve this scope?                                  ║
║  (You can add/remove items before we begin)                 ║
╚══════════════════════════════════════════════════════════════╝
```

**Wait for CEO approval.** Do NOT proceed without explicit "approved" or "go".

### Step 1.4: Create Progress Tracker

Once scope approved, create:
```
_bmad-output/nexus-sprint/progress-tracker.md
```

**Template:**
```markdown
# Nexus Sprint Progress Tracker

**Started:** [Date]
**Scope Version:** 1.0
**CEO Intervention Triggers:** 0

## CEO Vision (LOCKED - Never Modified by Agents)
[Exact copy from scope document]

## Approved Scope (Only CEO Can Modify)
- [ ] Task 1
- [ ] Task 2
...

## Completed
| Task | Loop | Agent | Validated | Notes |
|------|------|-------|-----------|-------|

## In Progress
| Task | Agent | Status | Started |
|------|-------|--------|---------|

## Blocked (Awaiting CEO)
| Task | Reason | Recommended Action |
|------|--------|-------------------|

## Rejected (Scope Drift Detected)
| Task | Agent | What Went Wrong | Reassigned To |
|------|-------|-----------------|---------------|

## Loop History
| Loop | Tasks | Validation | CEO Intervention | Notes |
|------|-------|------------|------------------|-------|
```

---

## PHASE 2: LOOP EXECUTION

### Step 2.1: Director Selects Tasks

From APPROVED SCOPE ONLY, Director selects 5-10 tasks for parallel execution.

**Selection Criteria:**
- Tasks are independent (can run in parallel)
- Tasks have clear deliverables
- Tasks fit within single loop timeframe

### Step 2.2: Create Scope-Locked Assignments

For EACH agent task, Director creates explicit boundaries:

```markdown
## AGENT ASSIGNMENT: [Agent Name]
### Loop: [N] | Task: [X]
### SCOPE LOCK: ACTIVE

---

## YOUR TASK
[Specific task description from approved scope]

## SUCCESS CRITERIA
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]

## BOUNDARIES (HARD LIMITS)
- ONLY modify files: [explicit list]
- ONLY implement: [exact feature]
- DO NOT add: features, improvements, or changes beyond this task
- DO NOT modify: [protected files/areas]

## CONTEXT FROM CEO VISION
[Relevant excerpt from scope document]

## IF YOU ENCOUNTER SOMETHING OUTSIDE SCOPE
STOP. Do NOT improvise. Report to Director:
"BLOCKED: [what you found] - Request: [what you need]"
Director will escalate to CEO if needed.

## DELIVERABLE FORMAT
1. What was done (exact changes)
2. Files modified (full paths)
3. Success criteria checklist
4. Scope alignment confirmation: "All work within approved scope: YES/NO"
```

### Step 2.3: Launch Parallel Agents

In a SINGLE message, launch all agents:

```
Task tool (multiple calls in ONE message):

Task 1:
  subagent_type: "general-purpose"
  description: "L[N]-T1: [Task Name]"
  prompt: "[Scope-locked assignment from 2.2]"
  run_in_background: true

Task 2:
  subagent_type: "general-purpose"
  description: "L[N]-T2: [Task Name]"
  prompt: "[Scope-locked assignment from 2.2]"
  run_in_background: true

[...5-10 tasks total]
```

### Step 2.4: Director Monitors & Validates

As tasks complete:

**VALIDATION CHECKLIST (Every Task):**
```
□ Output matches assigned task exactly
□ No unauthorized files modified
□ No unauthorized features added
□ Aligns with CEO's stated vision
□ No scope creep (even if "helpful")
□ Agent confirmed scope alignment

IF ANY FAIL → REJECT task, log in rejected-work, reassign with clearer scope
```

### Step 2.5: Check Intervention Triggers

**MUST Brief CEO When:**
| Trigger | Example |
|---------|---------|
| Scope Change Request | Agent suggests feature outside scope |
| Blocker Detected | Technical issue prevents approved task |
| Decision Required | Multiple valid approaches |
| Milestone Reached | Significant chunk done |
| Risk Identified | Something might not work |
| Resource Question | Should we hire agent for X? |

**DO NOT Bother CEO For:**
- Routine progress
- Technical details within scope
- Minor bugs being fixed
- Agent coordination

### Step 2.6: Provide Status Update

**If NO Intervention Needed:**
```
╔══════════════════════════════════════════════════════════════╗
║                DIRECTOR STATUS - LOOP [N] COMPLETE           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  COMPLETED:                                                  ║
║  ✓ [Task] - [One line result]                               ║
║  ✓ [Task] - [One line result]                               ║
║                                                              ║
║  IN PROGRESS:                                                ║
║  ◐ [Task] - [X]% (continues next loop)                      ║
║                                                              ║
║  SCOPE ALIGNMENT: ✓ All work within approved scope          ║
║  REJECTED TASKS: 0                                           ║
║                                                              ║
║  CEO INTERVENTION: NOT REQUIRED                              ║
║                                                              ║
║  [Continuing to Loop [N+1]...]                              ║
╚══════════════════════════════════════════════════════════════╝
```

**If Intervention Needed:**
```
╔══════════════════════════════════════════════════════════════╗
║            ⚠️ DIRECTOR REQUESTS CEO INPUT ⚠️                  ║
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
║                                                              ║
║  DIRECTOR RECOMMENDATION: [A/B] because [reason]            ║
║                                                              ║
║  AGENTS STATUS: [Working on other tasks / Paused]           ║
║                                                              ║
║  AWAITING YOUR DIRECTION...                                 ║
╚══════════════════════════════════════════════════════════════╝
```

---

## PHASE 3: VALIDATION (Ralph Wiggum)

After each loop, Ralph validates ALL completed work:

```
Task tool:
  subagent_type: "general-purpose"
  description: "L[N]: Ralph Validation"
  prompt: "
🐛 RALPH WIGGUM - Loop [N] Validation

Tasks to validate:
[List from this loop]

For EACH task, verify:
1. Deliverable matches assignment
2. Files modified are ONLY those authorized
3. No features added beyond scope
4. Code works (if applicable - check types, build)

Output:
| Task | Scope Aligned | Works | Verdict |
|------|---------------|-------|---------|
| T1   | YES/NO        | YES/NO| PASS/FAIL |

OVERALL: PASS / FAIL
[If FAIL: Specific issues to fix]
"
```

**If FAIL:** Fix issues BEFORE next loop. Do NOT proceed with broken work.

---

## PHASE 4: GM STRATEGIC REVIEW (Every 5 Loops)

**CEO DIRECTIVE: Every 5 loops, Marcus (Zapier GM) conducts harsh strategic review.**

Marcus reviews:
1. **Work Progress** - Is it aligned with CEO vision?
2. **Business Strategy** - Does work support $79 launch, 50 customers goal?
3. **Competitive Position** - How does Nexus compare to Zapier at this stage?
4. **Hiring Needs** - Should we hire REAL AGENTS (cloned from real people)?

```
Task tool:
  subagent_type: "general-purpose"
  description: "L[N]: Marcus GM Strategic Review"
  prompt: "
👔 MARCUS (ZAPIER GM) - STRATEGIC REVIEW (Loop [N] of 5)

You are the harsh GM. Challenge everything. No softball assessments.

REVIEW:
1. Last 5 loops progress vs CEO vision
2. Business strategy alignment ($79 launch, 50 customers)
3. Competitive gaps vs Zapier
4. Skill gaps requiring real agent hires

OUTPUT:
╔════════════════════════════════════════════════════════════╗
║         👔 MARCUS GM STRATEGIC REVIEW - LOOP [N]          ║
╠════════════════════════════════════════════════════════════╣
║ PROGRESS GRADE: [A/B/C/D/F]                                ║
║ ALIGNMENT: [ALIGNED / DRIFTING / OFF-TRACK]               ║
║                                                            ║
║ PRIORITIES FOR NEXT 5 LOOPS:                              ║
║ 1. [What to focus on]                                     ║
║ 2. [What to deprioritize]                                 ║
║                                                            ║
║ HIRING: [HIRE_NEEDED / NO_HIRE]                           ║
║ - Role: [Specific role if needed]                         ║
║ - Reason: [Why]                                           ║
║                                                            ║
║ DIRECTOR MESSAGE: [2-3 sentence directive]                ║
╚════════════════════════════════════════════════════════════╝
"
```

**If Marcus recommends hire:** Director creates real agent in `_agents/` folder via deep research.

---

## PHASE 4.5: HR CHECK (Ava)

Ava provides brief assessment after validation:

**Full Marathon Mode:**
```
Task tool:
  subagent_type: "general-purpose"
  description: "L[N]: Ava HR Check"
  prompt: "
👔 AVA HR CHECK - Loop [N]

Completed: [List]
Issues: [List]

Assess gaps using framework:
- P0 CRITICAL: Project blocked
- P1 GROWTH: Scaling limited
- P2 OPPORTUNITY: Could improve
- P3 NICE-TO-HAVE: Would help

Output:
LOOP [N] HR: [OK / HIRE_NEEDED]
GAPS: [list or none]
HIRES: [Name - Role] or none
NEXT: [focus recommendation]
"
```

**If P0/P1 Gap Detected:** Director briefs CEO for hire approval before proceeding.

---

## PHASE 5: UPDATE & CONTINUE (Unchanged)

### 5.1: Update Progress Tracker

Mark completed tasks, update status, log any rejections.

### 5.2: Continue to Next Loop

IF no CEO intervention needed → Proceed to Loop N+1
IF CEO intervention requested → Wait for CEO direction

---

## CEO COMMANDS

| Command | Effect |
|---------|--------|
| **"Continue"** or **"Go"** | Proceed with current scope |
| **"Pause"** | Agents finish current task, then stop |
| **"Stop"** or **"Halt"** | Immediate stop |
| **"Add: [task]"** | Director adds to approved scope |
| **"Remove: [task]"** | Director removes from scope |
| **"Prioritize: [task]"** | Director moves to top of queue |
| **"Status"** | Director provides full progress report |
| **"Show scope"** | Director displays current scope document |

---

## ANTI-HALLUCINATION GUARDRAILS

### 1. Scope Binding
Every agent receives EXPLICIT list of:
- Files they CAN touch
- Features they CAN implement
- What they CANNOT do

### 2. Output Validation
Director checks EVERY deliverable:
- Does it match assignment?
- Any unauthorized changes?
- Any scope creep?

### 3. Context Anchoring
Every loop begins with:
- CEO Vision (exact quote)
- Current approved scope
- What's been done
- What's remaining
- What's out of scope

### 4. Rejection Protocol
If agent drifts from scope:
1. Reject deliverable
2. Log in rejected-work tracker
3. Reassign with clearer boundaries
4. Do NOT accept "helpful" additions

---

## FILES

| File | Purpose |
|------|---------|
| `_bmad-output/nexus-sprint/scope-document.md` | CEO-approved scope (source of truth) |
| `_bmad-output/nexus-sprint/progress-tracker.md` | Real-time status |
| `_bmad-output/nexus-sprint/director-log.md` | Director decisions |
| `ceo-director-model.md` | Full model specification |

---

## RECOVERY AFTER COMPACTION

1. Read `scope-document.md` - Restore CEO vision and approved scope
2. Read `progress-tracker.md` - See what's done/pending
3. Check for running background tasks
4. Resume from last incomplete loop
5. DO NOT restart completed work
6. DO NOT modify scope without CEO approval

---

## KEY PRINCIPLE

**Agents work. Director monitors. CEO directs.**

The CEO should be able to step away and return to find:
- Work progressing within approved scope
- No surprises or unauthorized changes
- Clear status of what happened
- Requests waiting for CEO input (if any)

**Zero drift. Zero hallucination. Maximum parallel productivity.**

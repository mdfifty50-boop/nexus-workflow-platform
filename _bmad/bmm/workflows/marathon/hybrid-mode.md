# Run Hybrid - Parallel Agent Marathon with Smart Model Tiering

## Trigger Phrases
- "Run hybrid"
- "smart marathon"
- "hybrid marathon"

---

## CRITICAL: Same Execution Pattern as Marathon

Hybrid mode uses the **EXACT SAME** parallel agent structure as Marathon:
- 5+ agents per loop running in parallel
- Background execution with status monitoring
- BMad Master directing between loops
- Clean status output (NO verbose flooding)

**The ONLY difference**: Model tiering (haiku/sonnet/opus) based on task complexity.

---

## OUTPUT FORMAT (Clean, Non-Verbose)

### Loop Status Display
```
╔════════════════════════════════════════════════════════════════╗
║              HYBRID MARATHON - LOOP [N] / 50                   ║
╠════════════════════════════════════════════════════════════════╣
║ STATUS: [DISCUSSION | EXECUTING | VALIDATING | COMPLETE]       ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  AGENTS WORKING: [X] / [Y] tasks                               ║
║  ├─ T1: [TaskName] ████████░░ 80% (sonnet)                    ║
║  ├─ T2: [TaskName] ██████████ DONE (haiku)                    ║
║  ├─ T3: [TaskName] ███░░░░░░░ 30% (opus)                      ║
║  ├─ T4: [TaskName] ████████░░ 80% (sonnet)                    ║
║  └─ T5: [TaskName] ░░░░░░░░░░ QUEUED (haiku)                  ║
║                                                                 ║
║  TOKENS THIS LOOP: ~[X]K input / ~[Y]K output                  ║
║  EST. COST: $[X.XX]                                            ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
```

### Inter-Loop Discussion Display
```
╔════════════════════════════════════════════════════════════════╗
║             PARTY MODE DISCUSSION - LOOP [N+1]                 ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  🧙 BMad Master: "Loop [N] complete. Next priorities..."       ║
║                                                                 ║
║  👔 Marcus (Zapier GM): "I challenge the assumption that..."   ║
║                                                                 ║
║  🏗️ Winston: "Architecture suggests we should..."              ║
║                                                                 ║
║  💻 Amelia: "From implementation standpoint..."                ║
║                                                                 ║
║  🐛 Ralph: "Loop [N] validation: 5/5 PASSED"                   ║
║                                                                 ║
║  👔 Ava (HR): "LOOP [N] HR: OK | No gaps | Team stable"        ║
║                                                                 ║
║  SELECTED TASKS FOR LOOP [N+1]:                                ║
║  1. [Task] → sonnet                                            ║
║  2. [Task] → haiku                                             ║
║  3. [Task] → opus (complex)                                    ║
║  4. [Task] → sonnet                                            ║
║  5. [Task] → haiku                                             ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
```

---

## STEP 1: Initialize (Same as Marathon)

### 1.1 Check for Existing Tracker
```
Read: _bmad-output/nexus-optimization-loops/loop-tracker.md
```

- If exists: Resume from last incomplete loop
- If not exists: Create using Marathon template

---

## STEP 2: Execute Loop N

### 2.1 Party Mode Discussion (Between Loops)

**ALWAYS show discussion between loops:**
```
/bmad:core:workflows:party-mode

Prompt:
🧙 BMad Master calling all agents!

HYBRID LOOP [N] PLANNING

Last Loop Results:
- [Summary from Ralph's validation]
- [Key outcomes]

Participating Agents:
- 🧙 BMad Master (Director)
- 👔 Marcus (Critical GM - challenges assumptions)
- 👔 Ava (HR - gap assessment)
- 🏗️ Winston (Architecture)
- 💻 Amelia (Implementation)
- 🐛 Ralph (Validation - reports on last loop)
- [Other relevant agents]

Each agent: Propose 1-2 tasks. Marcus will challenge weak proposals.

Marcus - specifically evaluate:
1. Does this task have clear business value?
2. What's the evidence this is needed?
3. How does this compare to what Zapier would do?
```

### 2.2 Task Selection with Model Classification

BMad Master classifies each task:

| Complexity | Model | Examples |
|------------|-------|----------|
| SIMPLE | haiku | Formatting, docs, comments, validation, simple rename |
| MEDIUM | sonnet | Code generation, bug fix, new component, refactor |
| COMPLEX | opus | Architecture, security, performance strategy, integration |

### 2.3 Parallel Task Execution (SINGLE MESSAGE)

**CRITICAL: Launch ALL tasks in ONE message with run_in_background: true**

```
Task tool (5+ parallel calls):

Task 1 (sonnet):
  subagent_type: "general-purpose"
  model: "sonnet"
  description: "L[N]-T1: [Task Name]"
  prompt: "[Full task with acceptance criteria]"
  run_in_background: true

Task 2 (haiku):
  subagent_type: "general-purpose"
  model: "haiku"
  description: "L[N]-T2: [Task Name]"
  prompt: "[Full task with acceptance criteria]"
  run_in_background: true

Task 3 (opus - complex):
  subagent_type: "general-purpose"
  model: "opus"
  description: "L[N]-T3: [Task Name]"
  prompt: "[Full task with acceptance criteria]"
  run_in_background: true

[...continue for all 5+ tasks]
```

### 2.4 Monitor with Clean Status

Show status updates in compact format:
```
LOOP [N] STATUS: 3/5 tasks complete
├─ T1: Fix TypeScript errors     ✅ DONE (haiku, ~2K tokens)
├─ T2: Add voice workflow        ✅ DONE (sonnet, ~8K tokens)
├─ T3: Architecture review       ⏳ 60% (opus, ~15K tokens)
├─ T4: Update landing page       ✅ DONE (sonnet, ~5K tokens)
└─ T5: Validation prep           ⏳ QUEUED (haiku)
```

---

## STEP 3: Validation (Ralph Wiggum)

Ralph validates ALL completed tasks:
```
Task tool:
  subagent_type: "general-purpose"
  model: "haiku"  # Validation is cheap
  description: "L[N]: Ralph Validation"
  prompt: "
🐛 Ralph Wiggum QA Validation for Loop [N]

VALIDATE THESE TASKS:
1. [Task 1] - [Expected outcome]
2. [Task 2] - [Expected outcome]
...

OUTPUT FORMAT:
RALPH WIGGUM VALIDATION REPORT
==============================
Loop: [N]
Tasks Validated: [X]

Results:
T1: [TaskName] → PASS/FAIL (reason)
T2: [TaskName] → PASS/FAIL (reason)
...

Build Status: PASS/FAIL
TypeScript: PASS/FAIL (X errors)
Dev Server: PASS/FAIL

VERDICT: APPROVED / NEEDS_FIXES
BLOCKING ISSUES: [list or 'none']
"
```

---

## STEP 4: GM Strategic Review (Every 5 Loops)

**MANDATORY: Every 5 loops (Loop 5, 10, 15, 20...), Marcus (Zapier GM) conducts strategic review.**

```
Task tool:
  subagent_type: "general-purpose"
  model: "sonnet"
  description: "L[N]: Marcus GM Strategic Review"
  prompt: "
👔 MARCUS (ZAPIER GM) - STRATEGIC REVIEW

You are the harsh but fair GM reviewing sprint progress every 5 loops.

REVIEW SCOPE:
1. **Work Progress Assessment**
   - What was accomplished in last 5 loops?
   - Is progress aligned with CEO vision?
   - Are we building what matters?

2. **Business Strategy Alignment**
   - How does current work support: '$79 launch, 50 customers in 2 months'?
   - What gaps exist between work and revenue goals?
   - Are we building features that drive signups?

3. **Competitive Analysis**
   - How does Nexus compare to Zapier at this stage?
   - What would Zapier prioritize differently?
   - Where are we ahead/behind?

4. **Hiring Recommendations**
   - Are there skill gaps requiring REAL AGENT hires (cloned from real people)?
   - P0: Blocking progress → MUST hire
   - P1: Slowing velocity → Should hire

OUTPUT FORMAT:
╔══════════════════════════════════════════════════════════════╗
║            👔 MARCUS GM STRATEGIC REVIEW - LOOP [N]          ║
╠══════════════════════════════════════════════════════════════╣
║ PROGRESS GRADE: [A/B/C/D/F]                                  ║
║                                                              ║
║ ALIGNMENT STATUS: [ALIGNED / DRIFTING / OFF-TRACK]          ║
║ - [Specific assessment]                                      ║
║                                                              ║
║ PRIORITY RECOMMENDATIONS:                                    ║
║ 1. [What to prioritize next 5 loops]                        ║
║ 2. [What to deprioritize]                                   ║
║                                                              ║
║ HIRING RECOMMENDATION:                                       ║
║ [HIRE_NEEDED / NO_HIRE]                                      ║
║ - Role: [Specific role from real company]                   ║
║ - Reason: [Why this hire unblocks/accelerates]              ║
║                                                              ║
║ MESSAGE TO DIRECTOR:                                        ║
║ [2-3 sentence directive for next 5 loops]                   ║
╚══════════════════════════════════════════════════════════════╝
"
```

**If Marcus recommends hire:** Director triggers real agent research and creation in `_agents/` folder.

---

## STEP 5: HR Micro-Check (Ava)

After validation, Ava assesses gaps:
```
Task tool:
  subagent_type: "general-purpose"
  model: "haiku"  # Micro-check is cheap (~200 tokens)
  description: "L[N]: Ava HR Check"
  prompt: "
👔 Ava HR Micro-Assessment for Loop [N]

Loop Outcomes: [summary]
Team: [current roster]

OUTPUT (one line):
LOOP [N] HR: [OK/HIRE_NEEDED] | GAPS: [list or 'none'] | HIRES: [Name-Role or 'none']
"
```

---

## STEP 5: Update Tracker & Loop

1. Update loop-tracker.md with results
2. Show inter-loop discussion
3. Proceed to Loop N+1

---

## Model Tiering Cost Savings

### Token Estimates Per Loop (5 tasks)

| Model Mix | Tokens | Cost |
|-----------|--------|------|
| Marathon (all Opus) | ~100K | $3-4 |
| **Hybrid (tiered)** | ~60K | $1-2 |
| Sprint (all Haiku/Sonnet) | ~40K | $0.50-1 |

### 50-Loop Total Estimate

| Mode | Quality | Est. Cost |
|------|---------|-----------|
| Marathon | 100% | $150-200 |
| **Hybrid** | 95-100% | $50-70 |
| Sprint | 85-95% | $30-50 |

---

## When to Escalate to Full Opus

Auto-escalate from sonnet to opus when:
- Security vulnerability detected
- Database schema changes
- Authentication/authorization logic
- Multi-service integration
- Performance regression > 20%
- Architectural conflict discovered

---

## Summary: Hybrid = Marathon Structure + Smart Costs

✅ Same parallel agent execution as Marathon
✅ Same Party Mode discussions between loops
✅ Same Ralph Wiggum validation
✅ Same Ava HR checks
✅ Same loop tracker

💰 70% cheaper via model tiering
🎯 95-100% quality (Opus where it matters)

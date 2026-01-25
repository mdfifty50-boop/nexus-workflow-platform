# Marathon Optimization Guide - Token-Efficient Mode

## Problem: Token Consumption

A full marathon (50 loops × 5+ tasks) consumes approximately:
- **2-2.5M+ tokens**
- **$150-200+ cost** (at Opus rates)
- Likely to hit Claude Pro limits ($200/month)

---

## OPTIMIZATION STRATEGIES

### Strategy 1: Model Tiering (40-60% savings)

Use cheaper models for simpler tasks:

```yaml
Task Complexity → Model Selection:

HAIKU ($0.25/M input, $1.25/M output):
- File formatting, comments, documentation
- Simple refactors (rename, move)
- Test file generation from templates
- Validation checks (Ralph Wiggum)
- Tracker updates

SONNET ($3/M input, $15/M output):
- Code generation (new components)
- Bug fixes
- Integration work
- Most development tasks

OPUS ($15/M input, $75/M output):
- Complex architectural decisions
- Security audits
- Performance optimization strategy
- Multi-system integration design
```

**Implementation:**
```
Task tool:
  model: "haiku"  # Add this parameter!
  subagent_type: "general-purpose"
  description: "L[N]-T1: Update comments"
  prompt: "..."
```

### Strategy 2: Batch Loops (60% fewer overhead cycles)

Instead of 50 loops × 5 tasks, use 10 phases × 25 tasks:

| Original | Optimized |
|----------|-----------|
| 50 Party Mode discussions | 10 Phase discussions |
| 50 Ralph validations | 10 Phase validations |
| 50 HR reviews | 10 Phase reviews |
| 50 tracker updates | 10 tracker updates |

**Phase Structure:**
```
Phase 1: Security (Loops 1-5 combined) → 25 tasks
Phase 2: Performance (Loops 6-10) → 25 tasks
Phase 3: TypeScript/Build (Loops 11-15) → 25 tasks
Phase 4: Mobile UX (Loops 16-20) → 25 tasks
Phase 5: User Acquisition (Loops 21-25) → 25 tasks
Phase 6: Polish (Loops 26-30) → 25 tasks
Phase 7: Testing (Loops 31-35) → 25 tasks
Phase 8: Enterprise (Loops 36-40) → 25 tasks
Phase 9: i18n & Advanced (Loops 41-45) → 25 tasks
Phase 10: Launch Readiness (Loops 46-50) → 25 tasks
```

### Strategy 3: Skip Party Mode (70% discussion savings)

Use **pre-planned task lists** instead of generating them each time:

```yaml
# Pre-planned tasks for Security Phase
security_tasks:
  - "Run npm audit and fix vulnerabilities"
  - "Add input sanitization with DOMPurify"
  - "Implement CSP headers"
  - "Add rate limiting config"
  - "Audit API key exposure"
  - "Add XSS protection to user inputs"
  - "Implement CSRF tokens"
  ...
```

**Only invoke Party Mode when:**
- Entering a completely new domain
- Blocked and need creative solutions
- User explicitly requests discussion

### Strategy 4: Inline Validation (No separate agent)

Instead of spawning Ralph Wiggum as a separate agent:

```
# After each task completes, the MAIN agent validates:

Task completed: L5-T3 (Add DOMPurify)
Quick validation:
- [x] File exists: src/lib/sanitize.ts
- [x] Exports sanitizeHTML function
- [x] No TypeScript errors
- [x] Imported in target files
✅ PASS

# Only spawn Ralph for END-OF-PHASE validation
```

### Strategy 5: Compress Agent Prompts (30% savings)

**Before (verbose):**
```
You are working on the Nexus project, an AI-powered workflow automation
platform built with Vite, React, TypeScript, and Tailwind CSS. The backend
uses Supabase with PostgreSQL and Row Level Security. Your task is to
implement input sanitization using DOMPurify to prevent XSS attacks. You
should create a utility function that can be imported throughout the
codebase. Make sure to handle edge cases like null inputs and consider
performance implications. The function should be well-typed with TypeScript.
After implementation, verify it works by checking for TypeScript errors.
```

**After (compressed):**
```
TASK: Add DOMPurify sanitization
FILE: src/lib/sanitize.ts
EXPORT: sanitizeHTML(input: string): string
USE: Import in components accepting user input
VERIFY: No TS errors
```

### Strategy 6: File-Based State (Reduce context growth)

**Problem:** Every agent output adds to main conversation context.

**Solution:** Write outputs to files, only return summaries:

```
Task prompt addition:
"Write detailed output to: _bmad-output/marathon/L5-T3-output.md
Return only: DONE: [one-line summary] or FAILED: [reason]"
```

### Strategy 7: Parallel Limits

Instead of 5 small agents, use 3 larger agents:

| Original | Optimized |
|----------|-----------|
| 5 agents × 1 task each | 3 agents × 2 tasks each |
| 5 spawns, 5 contexts | 3 spawns, 3 contexts |
| More overhead | Less overhead |

---

## OPTIMIZED MARATHON MODE ("Sprint Mode")

### Trigger: "Run a sprint" or "marathon lite"

```yaml
Configuration:
  phases: 10 (instead of 50 loops)
  tasks_per_phase: 15-25
  validation: End of phase only
  hr_review: Phase transitions only
  party_mode: First phase only, then pre-planned
  model_default: sonnet
  model_validation: haiku
  model_simple: haiku
```

### Execution Flow:

```
PHASE 1: Security
├── Read pre-planned tasks from task-plans/phase-01-security.md
├── BATCH 1: Launch 5 tasks in parallel
│   ├── model: haiku for simple tasks
│   └── model: sonnet for code tasks
├── HR MICRO-CHECK (model: haiku, ~200 tokens)
│   ├── Any gaps discovered? → Hire specialist
│   └── Build still passing? → Continue
├── BATCH 2: Launch 5 tasks in parallel
├── HR MICRO-CHECK
├── BATCH 3: Launch remaining 5 tasks
├── HR MICRO-CHECK
├── END-OF-PHASE: Ralph Wiggum validation (model: haiku)
└── Update tracker with hired specialists

PHASE 2-10: Repeat pattern

KEY: HR micro-checks happen after EVERY batch (like marathon)
     but cost 99.7% less by using Haiku + structured checklist
```

### HR Micro-Check Template (use after each batch):

```
Task tool:
  model: "haiku"  # Critical: use cheap model
  description: "HR Micro-Check Batch [N]"
  prompt: "
Quick HR assessment. Answer Y/N only:

COMPLETED: [task list]

CHECK:
1. Build passing? [Y/N]
2. New security gaps? [Y/N]
3. New performance gaps? [Y/N]
4. New mobile/UX gaps? [Y/N]
5. New i18n gaps? [Y/N]
6. Blocked on expertise? [Y/N]

IF ANY Y (except #1):
HIRE: [specialist name from pool]
REASON: [one sentence]

OUTPUT: JSON {gaps: [], hires: [], next_focus: string}
"
```

### Strategy 8: Lightweight HR Micro-Reviews (PRESERVES ADAPTIVE HIRING)

**Problem:** Full HR reviews after each loop cost ~1,500 tokens × 50 = 75K tokens
**Solution:** Quick HR "health check" using Haiku + conditional escalation

**Lightweight HR Check (after each task batch):**
```
HR MICRO-CHECK (model: haiku, ~200 tokens)

Tasks completed: [list]
Issues discovered: [any blockers, errors, gaps?]

QUICK ASSESSMENT:
□ Build passing? [Y/N]
□ New domain gaps? [Y/N] → If Y, which: security/perf/mobile/i18n/other
□ Blocked on expertise? [Y/N]

IF any gaps → HIRE from pool:
- Security gap → Victor (Security Architect)
- Performance gap → Dash (Performance Engineer)
- Mobile gap → Kai (Mobile Designer) + Riya (Speed Engineer)
- i18n gap → Khalid (Localization)
- UX gap → Riley (UX Researcher)
- AI/ML gap → Nova (AI Engineer)

NEW HIRES: [list or "none"]
NEXT FOCUS: [continue/pivot to address gap]
```

**Cost comparison:**
- Full HR Review: ~1,500 tokens (Opus) = ~$0.11 each
- Micro-Check: ~200 tokens (Haiku) = ~$0.0003 each
- **Savings: 99.7% per check while keeping adaptive hiring**

### Estimated Savings:

| Component | Original | Optimized | Savings |
|-----------|----------|-----------|---------|
| Party Mode | 50 × 3K = 150K | 1 × 3K = 3K | **98%** |
| Validations | 50 × 3K = 150K | 10 × 1K = 10K | **93%** |
| HR Reviews | 50 × 1.5K = 75K | 50 × 0.2K = 10K | **87%** |
| Agent spawns | 250 × 5K = 1.25M | 150 × 3K = 450K | **64%** |
| Model costs | 100% Opus | 70% Haiku/Sonnet | **60-80%** |

**Total estimated savings: 70-85%**
**Cost reduction: $150-200 → $30-50 per marathon**

---

## IMPLEMENTATION

### Pre-Planned Task Lists

Create task files for each phase:

```
_bmad/bmm/workflows/marathon/task-plans/
├── phase-01-security.md
├── phase-02-performance.md
├── phase-03-typescript.md
├── phase-04-mobile-ux.md
├── phase-05-user-acquisition.md
├── phase-06-polish.md
├── phase-07-testing.md
├── phase-08-enterprise.md
├── phase-09-i18n-advanced.md
└── phase-10-launch.md
```

### Model Selection Helper

```typescript
function selectModel(taskType: string): "haiku" | "sonnet" | "opus" {
  const haikuTasks = [
    "format", "comment", "rename", "move", "validate",
    "lint", "test-gen", "docs", "tracker"
  ];
  const opusTasks = [
    "architecture", "security-audit", "performance-strategy",
    "complex-integration", "system-design"
  ];

  if (haikuTasks.some(t => taskType.includes(t))) return "haiku";
  if (opusTasks.some(t => taskType.includes(t))) return "opus";
  return "sonnet";
}
```

---

## QUICK COMMANDS

| Command | Mode | Est. Tokens | Est. Cost |
|---------|------|-------------|-----------|
| "Run a marathon" | Full (50 loops) | 2-2.5M | $150-200 |
| "Run a sprint" | Optimized (10 phases) | 400-600K | $30-50 |
| "Quick loop" | Single phase | 40-60K | $3-5 |

---

## WHEN TO USE EACH MODE

**Full Marathon (50 loops):**
- Unlimited budget
- Need maximum thoroughness
- Complex, unknown codebase
- Many stakeholders need visibility

**Sprint Mode (10 phases):**
- Budget-conscious ($200/month limit)
- Well-defined project scope
- Familiar codebase
- Solo developer or small team

**Quick Loop (single phase):**
- Specific focus area (just security, just mobile)
- Daily/weekly improvement cycles
- Maintenance mode


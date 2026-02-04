# Raymond Brunell Strategy - Lessons for Non-Technical Founders

**Source:** [From Overwhelmed to Overdelivering](https://raymond-brunell.medium.com/from-overwhelmed-to-overdelivering-how-claude-code-saved-my-solo-project-when-nothing-else-worked-bea613380936)

**Context:** Applied to Nexus development by a business-background founder with zero coding experience.

---

## The Core Insight

> "The turning point came when I stopped treating it as a magic solution and started approaching it as a **collaborative assistant**."

Claude Code IS the right tool. The technique needs refinement.

---

## Raymond's Situation (Mirror of Yours)

| His Problem | Your Problem |
|-------------|--------------|
| Solo developer, 3 months into 6-week project | Solo founder, months into Nexus |
| "Codebase became a labyrinth I couldn't navigate" | 20+ interdependent fixes, complexity wall |
| "Bugs multiplied faster than I could squash them" | Fixes create new bugs |
| Tried Pomodoro, Kanban, weekends - nothing worked | Considering tool switches |
| "Confidence crumbling, imposter syndrome" | "Don't feel like going back" |

---

## The 6 Key Lessons (Beyond Detailed Prompts)

### Lesson 1: Project Archaeology

**What it is:** Mapping your entire codebase BEFORE trying to fix anything.

**Why it matters:** You can't fix what you don't understand. Raymond discovered issues he'd missed despite weeks of working with the code.

**What it reveals:**
- Module dependencies (what connects to what)
- Circular dependencies (A needs B, B needs A = problems)
- High-coupling files (files touched by everything)
- Unused code (dead weight)
- Specific refactoring opportunities

**How to do it:**
```
"Analyze the Nexus codebase structure. Show me:
1. Which files depend on which
2. Any circular dependencies
3. Files that are imported by many other files
4. Unused exports or dead code
5. Recommendations for reducing complexity"
```

**Output example from Raymond:**
```
WARNINGS:
- Circular dependency: validation.js → apiHelpers.js → validation.js
- Unused exports: customer.validateAddress, order.calculateHistoricalValue
- High coupling: apiHelpers.js (imported by 73% of modules)

RECOMMENDATIONS:
1. Break circular dependency by extracting shared functionality
2. Split apiHelpers.js into focused modules
3. Remove or integrate unused exports
```

---

### Lesson 2: Bottleneck Identification

**What it is:** Finding the REAL reason you're stuck (often not what you think).

**Raymond's discovery:**
| Bottleneck Type | Frequency |
|-----------------|-----------|
| Scope Uncertainty (unclear requirements) | **70%** |
| Data/Access Patterns | 20% |
| Actual Technical Complexity | 10% |

**The insight:** Most "technical problems" are actually "decision problems."

**How to do it:**
```
"I'm stuck on [feature/problem]. Help me identify:
1. Is this a scope/requirements issue? (unclear what exactly to build)
2. Is this a data/architecture issue? (how things connect)
3. Is this a technical implementation issue? (how to code it)

Be honest about which is the real blocker."
```

**Example output:**
```
BOTTLENECK ANALYSIS:

Primary issue: Scope Uncertainty (70% confidence)
- Your description lacks clear boundaries for what constitutes success
- No defined rules for edge cases
- Unclear business logic for special situations

RECOMMENDATION:
1. Define explicit business rules first
2. Clarify edge cases with yourself/stakeholders
3. THEN revisit technical implementation
```

---

### Lesson 3: Delegation Decision Tree

**What it is:** Knowing what to give Claude vs. keep for yourself.

**Delegate to Claude (AI-suited):**
- [ ] Boilerplate code and repetitive patterns
- [ ] Debugging with clear error messages
- [ ] Documentation drafts
- [ ] Researching unfamiliar technologies
- [ ] Code reviews and quality checks
- [ ] Finding where something is in the codebase
- [ ] Explaining what code does

**Keep for Yourself (Human-suited):**
- [ ] Final architecture decisions
- [ ] Security-critical components
- [ ] User experience design decisions
- [ ] Business logic with regulatory implications (ZATCA, Kuwait VAT)
- [ ] Performance optimization of critical paths
- [ ] Cultural/regional decisions (Arabic support, KWD pricing)
- [ ] Product vision and priorities

**Decision questions:**
1. Does it require Kuwait/GCC business knowledge? → YOU
2. Does it involve security? → YOU (with Claude review)
3. Is it repetitive or pattern-based? → CLAUDE
4. Does it require creative product decisions? → YOU + Claude brainstorm
5. Is it documentation? → Claude drafts, YOU review

---

### Lesson 4: The Weekly Workflow Template

**Morning Routine (30 min):**
```
1. Review yesterday's work
   "Summarize what changed in Nexus yesterday. Any issues introduced?"

2. Plan today's focus
   "Based on current state, what's the ONE thing I should focus on today?"

3. Identify risks
   "What could go wrong with today's planned work? What should I watch for?"
```

**Mid-Day Implementation:**
- Focused work sessions (no context switching)
- Use Claude for targeted help when stuck
- Document decisions as you make them

**End-of-Day Review (15 min):**
```
1. Review changes
   "What did we change today? Any regressions or concerns?"

2. Prepare tomorrow
   "What should I research or think about overnight for tomorrow's work?"

3. Update session file
   Keep .claude-session.md current
```

---

### Lesson 5: Early Warning System

**What it is:** Proactive monitoring to prevent future overwhelm.

**Weekly Architecture Review:**
```
"Analyze Nexus architecture for:
1. Technical debt accumulation
2. Increasing complexity
3. Anti-patterns emerging
4. Files that are getting too large
5. Dependencies that are becoming circular"
```

**Dependency Monitoring:**
```
"Check Nexus dependencies for:
1. Circular dependencies
2. Outdated packages with security issues
3. Unused dependencies
4. Files with too many imports"
```

**Risk Assessment Before New Features:**
```
"Before I add [new feature], analyze:
1. What existing code will this touch?
2. Which @NEXUS-FIX markers might be affected?
3. What could break?
4. What's the safest approach?"
```

---

### Lesson 6: Psychological Management

**The 2-Day Awkward Period:**
- Productivity may DROP initially while adjusting
- This is normal - don't quit on day 1
- By day 10, new workflow feels natural

**One Small Win Breaks Paralysis:**
> "My first day ended with just one fixed bug, but it was the first real progress in over a week — it broke the paralysis."

- Don't try to fix everything
- Fix ONE thing today
- Momentum builds from small wins

**Reframe the Relationship:**
- OLD: "Claude should solve my problems"
- NEW: "Claude is a skilled teammate who needs clear direction"

**Maintain Agency:**
- YOU are the architect and decision-maker
- Claude provides options and insights
- Final choices remain YOURS
- You won't become "dependent" - you're the boss

---

## Raymond's Results (What's Possible)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Story points/week | 14 | 37 | **+164%** |
| Bugs resolved/week | 6 | 15 | +150% |
| Time per bug (hours) | 3.7 | 1.5 | **-60%** |
| Estimation accuracy | ±65% | ±15% | +50% |
| Anxiety before meetings | 8/10 | 3/10 | -62% |
| Project timeline | 9 months (delayed) | 5 months | **4 months early** |

---

## What Doesn't Work Well (Limitations)

Claude Code is LESS helpful for:
- Highly domain-specific business logic (your Kuwait rules, ZATCA)
- Legacy constraints with no documentation
- Deep institutional knowledge
- Decisions requiring your product vision

**For these:** YOU lead, Claude supports.

---

## Quick Reference Commands

**Project Archaeology:**
```
"Map Nexus codebase structure. Show dependencies, circular refs, high-coupling files."
```

**Bottleneck Analysis:**
```
"I'm stuck on X. Is this a scope problem, architecture problem, or code problem?"
```

**Risk Assessment:**
```
"Before I change Y, what could break? Which fixes might be affected?"
```

**Daily Planning:**
```
"What's the ONE most important thing to focus on today for Nexus?"
```

**End-of-Day Review:**
```
"Summarize today's changes. Any concerns or regressions?"
```

**Weekly Health Check:**
```
"Analyze Nexus for technical debt, complexity creep, and emerging problems."
```

---

## The Bottom Line

**You already do:** Detailed prompts (good!)

**You need to add:**
1. Project Archaeology - Understand before fixing
2. Bottleneck ID - Find the REAL problem (often not technical)
3. Delegation clarity - Know what's yours vs Claude's
4. Weekly workflow - Structure prevents chaos
5. Early warning system - Catch problems before overwhelm
6. Psychological management - Small wins, 2-day adjustment, maintain agency

---

*Document created: 2026-01-30*
*Based on discussion of Raymond Brunell's Medium article*
*Applied to: Nexus development by non-technical founder*

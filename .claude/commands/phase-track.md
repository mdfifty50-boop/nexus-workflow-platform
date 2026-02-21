# /phase-track - Sprint Progress Tracker

Display and update the current sprint progress from `nexus/sprint-progress.json`.

## Steps

### 1. Load Progress
Read `nexus/sprint-progress.json`. If it doesn't exist, report "No active sprint. Use marathon/sprint/hybrid to start."

### 2. Display Status

```
SPRINT PROGRESS: [sprint name]
═══════════════════════════════════════════
Vision: [CEO vision text]
Status: [status] | Loop: [current]/[total]
Started: [date] | Updated: [date]

SCOPE:
  Approved: [count] tasks
  Out of Scope: [count] items

LOOPS:
  Loop 1: [status] - [task summary]
  Loop 2: [status] - [task summary]
  ...

BLOCKERS: [count]
  - [blocker descriptions]

NEXT: [next planned task]
═══════════════════════════════════════════
```

### 3. Update (if requested)
If user provides update info, modify sprint-progress.json:
- Mark tasks complete
- Add blockers
- Add notes
- Advance to next loop

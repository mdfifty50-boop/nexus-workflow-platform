# Safe Zones - Files You CAN Modify

**Purpose:** These files are isolated enough that you can modify them without triggering cascading fix failures.

---

## COMPLETELY SAFE - Create Freely

### New Files (Best Option)

**The safest approach is always to CREATE NEW FILES rather than modify existing ones.**

| Type | Safe Location | Example |
|------|---------------|---------|
| New Components | `src/components/` (new subfolder) | `src/components/analytics/UsageChart.tsx` |
| New Pages | `src/pages/` | `src/pages/ReportsPage.tsx` |
| New Services | `src/services/` | `src/services/ReportingService.ts` |
| New Utils | `src/lib/` | `src/lib/formatting.ts` |
| New API Routes | `server/routes/` | `server/routes/reports.ts` |

**Why New Files Are Safe:**
- No existing fix markers to break
- No dependencies pointing to them yet
- You control the entire scope
- Easy to delete if something goes wrong

---

## SAFE - Documentation & Configuration

### Documentation Files
```
README.md
docs/**/*
*.md (at root level)
```

**Safe because:** Documentation doesn't affect runtime behavior.

### Environment Templates
```
.env.example
.env.local.example
```

**Safe because:** Templates don't affect running code (actual .env files need caution).

### TypeScript/Build Config (Low Risk)
```
tsconfig.json       - Low risk, affects compilation
vite.config.ts      - Low risk, affects build
tailwind.config.js  - Low risk, affects styling
```

**Caution:** Changes here can break builds, but won't break fix logic.

---

## SAFE - Isolated UI Components

These components don't contain fix markers and are relatively isolated:

### Profile & Settings Pages
```
src/pages/ProfilePage.tsx
src/pages/SettingsPage.tsx
```

### Static/Display Components
```
src/components/ui/**/*          - shadcn components (safe)
src/components/layout/**/*      - Layout wrappers
src/components/common/**/*      - Generic reusable components
```

### Landing/Marketing Pages
```
src/pages/LandingPage.tsx       - If exists
src/pages/PricingPage.tsx       - If exists
```

---

## SAFE - Test Files

```
tests/**/*
src/**/*.test.ts
src/**/*.spec.ts
```

**Safe because:** Tests don't affect production code.

**Encouraged:** Add more tests to catch regressions.

---

## SAFE WITH CAUTION - Leaf Fix Files

These files contain fixes but they're "leaf" fixes (nothing depends on them):

| File | Fix | Safe To Modify? |
|------|-----|-----------------|
| UnsupportedToolCard.tsx | FIX-037 | Yes - isolated component |

**Rule:** Check `FIX_DEPENDENCY_MAP.md` to confirm the fix is a "leaf" before modifying.

---

## SAFE PATTERNS - How to Add Features

### Pattern 1: Wrapper Components

Instead of modifying `WorkflowPreviewCard.tsx`:

```tsx
// NEW FILE: WorkflowPreviewWithAnalytics.tsx
import { WorkflowPreviewCard } from './WorkflowPreviewCard'

export function WorkflowPreviewWithAnalytics(props) {
  // Add your new logic here
  const analyticsData = useAnalytics(props.workflow)

  return (
    <div>
      <AnalyticsBanner data={analyticsData} />
      <WorkflowPreviewCard {...props} />  {/* Unchanged original */}
    </div>
  )
}
```

### Pattern 2: New Services

Instead of modifying `ComposioService.ts`:

```typescript
// NEW FILE: AnalyticsService.ts
import { ComposioService } from './ComposioService'  // Import, don't modify

export class AnalyticsService {
  private composio: ComposioService

  constructor() {
    this.composio = new ComposioService()
  }

  async trackExecution(workflowId: string) {
    // Your new logic - doesn't touch ComposioService internals
  }
}
```

### Pattern 3: New API Routes

Instead of modifying `chat.ts` route:

```typescript
// NEW FILE: server/routes/analytics.ts
import express from 'express'

const router = express.Router()

router.get('/workflow-stats', async (req, res) => {
  // Your new endpoint
})

export default router
```

Then register in the main app (minimal touch to existing code).

---

## Quick Reference: Safe vs Frozen

| Want To... | Safe Approach | Frozen Approach (AVOID) |
|------------|---------------|------------------------|
| Add new feature | Create new component/service | Modify WorkflowPreviewCard |
| Fix display bug | Create wrapper component | Edit ChatContainer internals |
| Add API endpoint | New route file | Modify existing chat.ts |
| Change styling | New CSS/Tailwind classes | Edit component styles inline |
| Add logging | New logging service | Add logs inside frozen files |

---

## Checklist Before Modifying "Safe" Files

Even for safe files, good practice:

- [ ] File is NOT in FROZEN_FILES.md
- [ ] File has NO `@NEXUS-FIX-XXX` markers (search first)
- [ ] Change won't affect imports in frozen files
- [ ] You've read the file first
- [ ] You can test the change

---

## The Golden Rule

> **When in doubt, create a new file.**

New files have zero risk of breaking existing fixes. They're always the safest choice.

---

*Document created: 2026-01-31*
*Part of Day 1 Recovery Plan - Clarity Documents*

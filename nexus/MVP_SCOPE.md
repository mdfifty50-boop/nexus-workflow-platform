# MVP Scope Decision Document

**Date:** 2026-01-31
**Decision Made By:** Founder + Claude Code consultation

---

## Target Market

**Non-technical retail users** - People who want workflow automation but have zero technical background.

**Primary Region:** Kuwait/GCC

**Key Insight:** "With 1 thrown complaint from a non technical person, they get, with minimal simple inputs, a workflow that does what they want in the most efficient way."

---

## Tier 1 - MVP Launch Features

| Feature | Priority | Status |
|---------|----------|--------|
| Core workflow execution via Chat Cards | CRITICAL | Active |
| WhatsApp 1-click integration | HIGH | In Progress |
| Basic achievements | HIGH | Partial |
| Booking integrations (flights, hotels, restaurants) | HIGH | Backend exists |
| Voice/speech-to-text | HIGH | Frontend partial |
| GCC dialect voice conversation (Nexus replies based on user dialect) | HIGH | Planned |
| Daily AI workflow advice | HIGH | Planned |

---

## Architectural Decisions Made

### 1. Execution Engine: WorkflowExecutionService (Simplified)

**Decision:** Keep `WorkflowExecutionService` as primary. Archive `WorkflowExecutionEngine`.

**Why:**
- Simpler = more reliable for non-tech users
- WorkflowPreviewCard already works with Service
- Engine features (payments, bookings) can be brought back one at a time

**Archived:** `src/_archived/WorkflowExecutionEngine.ts`

### 2. UI: Chat Cards, NOT Canvas Editor

**Decision:** Use Chat Cards (WorkflowPreviewCard) as the primary interface. Archive Canvas Editor.

**Why:**
- Chat Cards: User describes in natural language → AI builds → One click execute
- Canvas: Requires technical knowledge (nodes, connections, configuration)
- Chat Cards aligns with "non-technical retail users" goal

**Archived:**
- `src/_archived/WorkflowCanvas.tsx`
- `src/_archived/WorkflowCanvasLegacy.tsx`

### 3. Tool Discovery: Dynamic + Static Fallback

**Decision:** Dynamic orchestration as PRIMARY, Static TOOL_SLUGS as FALLBACK.

**Why:**
- Dynamic: Works with all 500+ Composio tools
- Static: Fast, reliable fallback for common tools (Gmail, Slack, etc.)
- Best of both worlds

### 4. AI Architecture: Keep Current

**Decision:** Keep the current AI architecture as-is.

**Why:**
- Founder spent weeks iterating to reach current state
- Works for the intended use case
- No need to rebuild what's already working

---

## Features NOT in MVP (Future Tiers)

### Tier 2 - Add within 30-60 days:
- Browser automations (Playwright-based)
- Advanced achievement persistence
- Payment processing (Stripe webhooks)

### Tier 3 - Add within 90 days:
- Canvas Editor (for power users who want manual control)
- Full WorkflowExecutionEngine features
- KNET integration (Kuwait payment)

---

## Key Files Reference

| What | Location | Status |
|------|----------|--------|
| Main workflow UI | `src/components/chat/WorkflowPreviewCard.tsx` | ACTIVE (FROZEN) |
| Execution service | `src/services/WorkflowExecutionService.ts` | ACTIVE |
| AI service | `src/services/NexusAIService.ts` | ACTIVE |
| Tool discovery | `src/lib/workflow-engine/orchestrator.ts` | ACTIVE |
| Archived engine | `src/_archived/WorkflowExecutionEngine.ts` | ARCHIVED |
| Archived canvas | `src/_archived/WorkflowCanvas*.tsx` | ARCHIVED |

---

## Voice & Dialect Requirements (New)

### GCC Dialect Support

The AI must understand and respond appropriately to:

| Dialect | Region | Priority |
|---------|--------|----------|
| Kuwaiti Arabic | Kuwait | P0 |
| Gulf Arabic | UAE, Saudi, Qatar, Bahrain | P1 |
| Levantine Arabic | Jordan, Lebanon | P2 |
| Egyptian Arabic | Egypt | P2 |
| English | All | P0 |

### Voice Conversation Flow

1. User speaks in their preferred dialect
2. Nexus transcribes using dialect-aware STT (Deepgram/ElevenLabs recommended)
3. Nexus responds in the SAME dialect/language
4. User confirms or corrects via voice
5. Workflow executes

**Anti-pattern:** Never use Otter.ai (poor dialect support)

---

## Daily AI Workflow Advice Feature

### Concept

Every day, Nexus proactively suggests workflow improvements based on:
- User's existing workflows
- Common patterns in their industry
- Time-based triggers (e.g., "It's Sunday - start of work week in Kuwait")
- Usage data (which workflows run most, which fail)

### Example

> "Good morning! I noticed your 'Invoice Reminder' workflow ran 23 times this month.
> Want me to create a 'Late Payment Follow-up' workflow that auto-triggers
> when invoices are 7+ days overdue?"

---

## Success Criteria for MVP Launch

- [ ] User can describe workflow in natural language (voice or text)
- [ ] AI understands GCC dialects correctly
- [ ] WorkflowPreviewCard shows workflow steps visually
- [ ] One-click OAuth connects required apps
- [ ] Workflow executes without technical jargon exposure
- [ ] Daily advice feature suggests improvements
- [ ] WhatsApp integration works for notifications
- [ ] Basic achievements reward user engagement

---

*Document created: 2026-01-31*
*Part of Day 2 Bottleneck Resolution*

# Frozen Files - DO NOT TOUCH

**Purpose:** These files are so interconnected with critical fixes that modifying them risks cascading failures. Treat them as READ-ONLY.

---

## EXTREME RISK - ABSOLUTELY FROZEN

### WorkflowPreviewCard.tsx
**Location:** `src/components/chat/WorkflowPreviewCard.tsx`

| Metric | Value |
|--------|-------|
| Lines of Code | 4,774 |
| Fix Markers | 72 |
| Risk Level | **EXTREME** |

**Why It's Frozen:**
- Contains the entire workflow execution engine
- 72 interdependent fixes woven throughout
- OAuth flow, pre-flight validation, orchestration, execution, error recovery
- Changing ANY line risks breaking multiple fix chains
- This is the "God Component" - it does everything

**Fixes Inside (partial list):**
- FIX-001: OAuth popup blocker bypass
- FIX-002: Expired connection detection
- FIX-003: Parallel OAuth
- FIX-005: Visual workflow nodes
- FIX-006: Real workflow execution
- FIX-007: TOOL_SLUGS mapping
- FIX-008: 3-layer tool resolution
- FIX-017-025: Action mappings + validation
- FIX-026-032: Parameter collection
- FIX-033-050: Pre-flight system
- FIX-051-066: Orchestration
- ...and 20+ more

**What To Do Instead:**
- If you need new workflow features → Create a NEW component that WRAPS this one
- If you find a bug → Document it, but DON'T fix it unless absolutely critical
- If you must touch it → Run `/validate` before AND after, test exhaustively

---

## HIGH RISK - FROZEN UNLESS CRITICAL

### ChatContainer.tsx
**Location:** `src/components/chat/ChatContainer.tsx`

| Metric | Value |
|--------|-------|
| Lines of Code | 1,500+ |
| Fix Markers | 4 |
| Risk Level | HIGH |

**Fixes Inside:**
- FIX-011: Other/Custom inline input
- FIX-013: Remove early API key card
- FIX-014: Custom... option handling

**Why It's Risky:**
- Handles AI response parsing
- Triggers WorkflowPreviewCard rendering
- Chat state management

---

### ComposioService.ts
**Location:** `server/services/ComposioService.ts`

| Metric | Value |
|--------|-------|
| Lines of Code | 1,000+ |
| Fix Markers | 3 |
| Risk Level | HIGH |

**Why It's Risky:**
- Core Composio API integration
- OAuth token management
- Tool execution routing

---

### PreFlightService.ts
**Location:** `server/services/PreFlightService.ts`

| Metric | Value |
|--------|-------|
| Lines of Code | 600+ |
| Fix Markers | 3 |
| Risk Level | HIGH |

**Fixes Inside:**
- FIX-033: Pre-flight validation system (FOUNDATION)
- FIX-074: Backend Composio schemas
- FIX-075: Frontend fallback

**Why It's Risky:**
- Pre-flight validation is a FOUNDATION fix
- Many other fixes depend on it working correctly

---

### CustomIntegrationService.ts
**Location:** `server/services/CustomIntegrationService.ts`

| Metric | Value |
|--------|-------|
| Lines of Code | 2,000+ |
| Fix Markers | 1 |
| Risk Level | MEDIUM-HIGH |

**Why It's Risky:**
- API key handling
- Custom integration logic
- Large file = easy to break something

---

## MEDIUM RISK - PROCEED WITH CAUTION

### agents/index.ts
**Location:** `server/agents/index.ts`

**Why It's Risky:**
- Contains Nexus AI personality
- Response format instructions
- Breaking this = broken AI responses

---

### RubeClient.ts
**Location:** `src/services/RubeClient.ts`

**Why It's Risky:**
- OAuth infrastructure
- Connection to Rube MCP server

---

### rube.ts (routes)
**Location:** `server/routes/rube.ts`

| Metric | Value |
|--------|-------|
| Fix Markers | 5+ |
| Risk Level | MEDIUM-HIGH |

**Fixes Inside:**
- FIX-095: WhatsApp Baileys routing
- FIX-096: Debug logging & parameter aliases
- FIX-098: Baileys sendMessage return type

**Why It's Risky:**
- Contains WhatsApp execution routing logic
- Interconnected with WhatsAppBaileysService
- Breaking this = WhatsApp workflows fail

---

## WHATSAPP INTEGRATION - INTERCONNECTED SYSTEM

**WARNING:** These files form a tightly coupled system. Modifying one affects others.

### WhatsAppBaileysService.ts
**Location:** `server/services/WhatsAppBaileysService.ts`

| Metric | Value |
|--------|-------|
| Fix Markers | 2 (FIX-092, FIX-093) |
| Risk Level | HIGH |

**Why It's Risky:**
- Core Baileys WhatsApp integration
- Session management, QR generation
- Return types affect rube.ts (FIX-098)

**Depends On:** Nothing
**Depended On By:** whatsapp-web.ts, rube.ts, useWhatsAppWeb.ts

---

### whatsapp-web.ts (routes)
**Location:** `server/routes/whatsapp-web.ts`

| Metric | Value |
|--------|-------|
| Fix Markers | 1 (FIX-091) |
| Risk Level | MEDIUM |

**Why It's Risky:**
- SSE streaming for QR codes
- Session CRUD endpoints
- Frontend depends on exact API shape

**Depends On:** WhatsAppBaileysService
**Depended On By:** useWhatsAppWeb.ts, WhatsAppConnectionPrompt.tsx

---

### useWhatsAppWeb.ts
**Location:** `src/hooks/useWhatsAppWeb.ts`

| Metric | Value |
|--------|-------|
| Risk Level | MEDIUM |

**Why It's Risky:**
- SSE connection management
- API endpoint URLs hardcoded
- State management for React components

**Depends On:** whatsapp-web.ts routes
**Depended On By:** WhatsAppConnectionPrompt.tsx, WhatsAppWebIntegration.tsx

---

### WhatsAppConnectionPrompt.tsx
**Location:** `src/components/chat/WhatsAppConnectionPrompt.tsx`

| Metric | Value |
|--------|-------|
| Fix Markers | 1 (FIX-085) |
| Risk Level | MEDIUM |

**Why It's Risky:**
- Embedded in WorkflowPreviewCard
- Mobile detection for pairing code
- QR code display logic

**Depends On:** useWhatsAppWeb.ts, whatsapp-web.ts
**Depended On By:** WorkflowPreviewCard.tsx

---

### WhatsApp Dependency Flow
```
WorkflowPreviewCard.tsx
        │
        ▼
WhatsAppConnectionPrompt.tsx ──── useWhatsAppWeb.ts
        │                                │
        ▼                                ▼
        └───────────────────► whatsapp-web.ts (routes)
                                        │
                                        ▼
                            WhatsAppBaileysService.ts
                                        │
                                        ▼
                                    rube.ts (execution)
```

**Mobile Ready:** All WhatsApp components support:
- Mobile device detection (user-agent)
- QR code (desktop) / Pairing code (mobile)
- Touch-friendly buttons (44x44px min)
- Responsive layouts

---

## Summary Table

| File | Risk | Fix Count | Action |
|------|------|-----------|--------|
| WorkflowPreviewCard.tsx | EXTREME | 72+ | **NEVER TOUCH** |
| ChatContainer.tsx | HIGH | 4 | Avoid unless critical |
| ComposioService.ts | HIGH | 3 | Avoid unless critical |
| PreFlightService.ts | HIGH | 3 | Avoid unless critical |
| **WhatsAppBaileysService.ts** | HIGH | 2 | WhatsApp core - test after changes |
| **rube.ts** | MEDIUM-HIGH | 5+ | WhatsApp routing - verify FIX-095/098 |
| CustomIntegrationService.ts | MEDIUM-HIGH | 1 | Proceed with caution |
| agents/index.ts | MEDIUM | 0 | Proceed with caution |
| RubeClient.ts | MEDIUM | 0 | Proceed with caution |
| **whatsapp-web.ts** | MEDIUM | 1 | Check SSE endpoints |
| **useWhatsAppWeb.ts** | MEDIUM | 0 | Check API URLs |
| **WhatsAppConnectionPrompt.tsx** | MEDIUM | 1 | Check mobile detection |

---

## What "Frozen" Means

1. **Don't add features** to these files
2. **Don't refactor** these files
3. **Don't "clean up"** these files
4. **Don't remove "unused" code** - it's probably used by a fix
5. **Route around them** - create wrapper components, new services

## If You MUST Touch a Frozen File

1. **Document WHY** in writing before starting
2. **Run `/validate`** before ANY change
3. **Make the SMALLEST possible change**
4. **Run `/validate`** after the change
5. **Run `npm run build`** to catch TypeScript errors
6. **Test the ENTIRE workflow** end-to-end
7. **If anything breaks**, revert immediately

---

*Document created: 2026-01-31*
*Part of Day 1 Recovery Plan - Clarity Documents*

# Fix Dependency Map

**Purpose:** Understand which fixes depend on which, so you don't break chains.

---

## Foundation Fixes (Break These = Break Everything)

These are the "foundation" - many other fixes build on them.

| Fix | What It Does | Fixes That Depend On It |
|-----|--------------|------------------------|
| **FIX-001** | OAuth popup blocker bypass | FIX-002, FIX-003, FIX-009, FIX-044, FIX-072 |
| **FIX-006** | Real workflow execution | FIX-023, FIX-026, FIX-029, FIX-041, FIX-047 |
| **FIX-007** | TOOL_SLUGS mapping | FIX-008, FIX-017-025, FIX-063, FIX-064 |
| **FIX-033** | Pre-flight validation system | FIX-038, FIX-040, FIX-049-050, FIX-054-071, FIX-074-075 |
| **FIX-034** | ToolRegistry | FIX-035, FIX-037, FIX-039, FIX-042 |

**Rule:** NEVER modify code with these markers without extreme caution.

---

## Dependency Chains

### Chain 1: OAuth Flow
```
FIX-001 (popup bypass)
   ↓
FIX-002 (expired detection)
   ↓
FIX-003 (parallel Connect All)
   ↓
FIX-044 (OAuthController extraction)
   ↓
FIX-072 (white-label OAuth)
   ↓
FIX-073 (Integrations page endpoint)
```

### Chain 2: Tool Resolution
```
FIX-007 (TOOL_SLUGS)
   ↓
FIX-008 (3-layer resolution)
   ↓
FIX-017-020 (action mappings + validation)
   ↓
FIX-022-025 (specific tool fixes)
   ↓
FIX-063 (legacy slug override)
   ↓
FIX-064 (schema-driven questions)
```

### Chain 3: Parameter Collection
```
FIX-026 (answer handling + auto-retry)
   ↓
FIX-029 (param mapping for retry)
   ↓
FIX-030-031 (multi-param handling)
   ↓
FIX-033 (pre-flight system)
   ↓
FIX-040 (race condition fix)
   ↓
FIX-049-050 (extractedParams + aliases)
   ↓
FIX-068-069 (parent sync + display check)
```

### Chain 4: Orchestration
```
FIX-051 (orchestration-first for unknown)
   ↓
FIX-053 (Rube MCP server proxy)
   ↓
FIX-055 (wire orchestration to pre-flight)
   ↓
FIX-056 (race condition fix)
   ↓
FIX-062 (dynamic schema validation)
   ↓
FIX-063 (legacy slug override)
   ↓
FIX-071 (filtering fix)
```

### Chain 5: Execution Verification
```
FIX-006 (real execution)
   ↓
FIX-041 (VerifiedExecutor)
   ↓
FIX-047 (surface verification failures)
   ↓
FIX-048 (Slack channel resolution)
```

### Chain 6: Pre-flight Backend
```
FIX-033 (pre-flight system)
   ↓
FIX-074 (backend Composio schemas)
   ↓
FIX-075 (frontend fallback)
```

### Chain 7: WhatsApp Baileys Integration (NEW - 2026-02-02)
```
FIX-091 (Use Baileys instead of whatsapp-web.js)
   ↓
FIX-092 (Baileys pino-compatible logger)
   ↓
FIX-093 (QR code data URL generation)
   ↓
FIX-095 (Route WhatsApp through Baileys in rube.ts)
   ↓
FIX-096 (Debug logging + parameter aliases)
   ↓
FIX-097 (Prevent placeholder overwriting valid phone)
   ↓
FIX-098 (Fix sendMessage return type handling)
```

**Files in chain:**
- `server/services/WhatsAppBaileysService.ts` (FIX-092, FIX-093)
- `server/routes/whatsapp-web.ts` (FIX-091)
- `server/routes/rube.ts` (FIX-095, FIX-096, FIX-098)
- `src/components/chat/WorkflowPreviewCard.tsx` (FIX-097)
- `src/components/chat/WhatsAppConnectionPrompt.tsx` (FIX-085)
- `src/hooks/useWhatsAppWeb.ts` (no markers, but API-dependent)

**Dependency Flow:**
```
WhatsAppBaileysService (core)
         ↓
whatsapp-web.ts (routes + SSE)
         ↓
    ┌────┴────┐
    │         │
rube.ts    useWhatsAppWeb.ts
(execute)   (React state)
    │         │
    └────┬────┘
         ↓
WhatsAppConnectionPrompt.tsx
         ↓
WorkflowPreviewCard.tsx
```

**Mobile Ready:** All components support:
- QR code (desktop) / Pairing code (mobile)
- Touch-friendly 44x44px buttons
- Responsive layouts

---

## Isolated Fixes (Safe to Modify Independently)

These fixes don't have downstream dependencies:

| Fix | What It Does | File |
|-----|--------------|------|
| FIX-005 | Visual workflow nodes | WorkflowPreviewCard.tsx |
| FIX-009 | OAuth polling timeout | WorkflowPreviewCard.tsx |
| FIX-010 | Custom integrations in count | WorkflowPreviewCard.tsx |
| FIX-011 | Other/Custom inline input | ChatContainer.tsx |
| FIX-013 | Remove early API key card | ChatContainer.tsx |
| FIX-014 | Custom... option handling | ChatContainer.tsx |
| FIX-028 | Friendly colors for prompts | WorkflowPreviewCard.tsx |
| FIX-032 | Dynamic error prompt | WorkflowPreviewCard.tsx |
| FIX-037 | UnsupportedToolCard | UnsupportedToolCard.tsx |
| FIX-067 | Diagnostic logging (removed) | WorkflowPreviewCard.tsx |

**These are "leaf" fixes** - modifying them won't break other fixes.

---

## High-Risk Modification Zones

If you change code near these markers, CHECK THE CHAIN:

| Marker Range | Chain Affected | Risk Level |
|--------------|----------------|------------|
| FIX-001 to FIX-003 | OAuth Flow | EXTREME |
| FIX-006, FIX-041, FIX-047-048 | Execution Verification | HIGH |
| FIX-007, FIX-017-025, FIX-063-064 | Tool Resolution | HIGH |
| FIX-026, FIX-029-031, FIX-049-050 | Parameter Collection | HIGH |
| FIX-033, FIX-040, FIX-054-071 | Pre-flight System | EXTREME |
| FIX-051-056, FIX-062-064 | Orchestration | HIGH |

---

## Quick Reference: "If I Change X, What Breaks?"

| If You Change... | These Might Break... |
|------------------|---------------------|
| TOOL_SLUGS object | All tool resolution, all execution |
| OAuth popup code | All connection flows |
| Pre-flight useEffect | Question display, button enablement |
| mapCollectedParamsToToolParams() | Parameter passing to execution |
| resolveToolViaOrchestration() | Unknown toolkit discovery |
| VerifiedExecutor | Execution proof, Slack channel resolution |

---

## Summary

**Total Fixes:** 86 (as of 2026-02-02)
**Foundation Fixes:** 5 (don't touch)
**Chain Fixes:** ~65 (touch with caution, check chain)
**Isolated Fixes:** ~16 (safer to modify)
**WhatsApp Chain:** 8 fixes (FIX-085, FIX-091 to FIX-098)

**The safest approach:** If you need to add new functionality, CREATE NEW FILES rather than modifying existing fix chains.

---

## Mobile UI Readiness (2026-02-02)

**WhatsApp components are mobile-ready out of the box:**

| Component | Mobile Support | Notes |
|-----------|----------------|-------|
| WhatsAppConnectionPrompt | ✅ Full | Auto-detects mobile, shows pairing code |
| WhatsAppWebIntegration | ✅ Full | Responsive layout, touch-friendly |
| useWhatsAppWeb | ✅ Full | Platform-agnostic hook |
| WorkflowPreviewCard | ✅ Partial | WhatsApp section is mobile-ready |

**When building Mobile UI:**
- Import these components directly - no modifications needed
- Test on actual mobile device for QR scanning experience
- Pairing code flow is optimized for mobile

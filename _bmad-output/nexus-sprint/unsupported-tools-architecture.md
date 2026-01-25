# Unsupported Tools Architecture Plan

**Created:** 2026-01-22
**Status:** Planning Phase
**Problem Domain:** How Nexus handles tools NOT supported by Composio/Rube

---

## Executive Summary

When a user requests a workflow using an unsupported tool (e.g., "Send my invoices to Tally"), Nexus must:
1. Detect the tool isn't natively supported
2. Present user-friendly alternatives (not technical errors)
3. Enable API key setup for tools with known APIs
4. Gracefully fall back to alternatives the user already has connected

---

## Current Implementation Status

### Existing Backend Services (COMPLETE)

| Service | Location | Purpose | Status |
|---------|----------|---------|--------|
| `NexusFallbackService.ts` | `server/services/` | Maps unsupported→alternatives (Slack→Email, Zoom→Google Meet) | ✅ Complete |
| `ToolDiscoveryService.ts` | `server/services/` | Discovers tools, gap analysis, category detection | ✅ Complete |
| `CustomIntegrationService.ts` | `server/services/` | API key handling for 100+ apps | ✅ Complete |

### Existing Frontend Components (COMPLETE)

| Component | Purpose | Status |
|-----------|---------|--------|
| `APIKeyAcquisitionCard.tsx` | Beautiful API key collection UI | ✅ Complete |
| `WorkflowPreviewCard.tsx` | FIX-019/020 validation & fallbacks | ✅ Complete |
| `ChatContainer.tsx` | Renders custom integrations | ✅ Complete |

### Existing Fix Markers (PROTECTED)

| Fix | Purpose | Location |
|-----|---------|----------|
| FIX-004 | Custom integration API key handling | WorkflowPreviewCard.tsx |
| FIX-019 | Tool validation & auto-correction | WorkflowPreviewCard.tsx |
| FIX-020 | Fallback suggestions when tool fails | WorkflowPreviewCard.tsx |

---

## Identified Gaps

### Gap 1: No Proactive Alternatives UI

**Problem:** When user requests unsupported tool, we detect it but don't show visual alternatives.

**Current Flow:**
```
User: "Send invoices to Tally"
    ↓
ToolDiscoveryService: "Tally not supported"
    ↓
Claude responds with text about alternatives
    ↓
NO VISUAL COMPONENT - User must manually figure out next steps
```

**Desired Flow:**
```
User: "Send invoices to Tally"
    ↓
ToolDiscoveryService: "Tally not supported, alternatives: [Zoho, Xero, QuickBooks]"
    ↓
AlternativesCard shown with:
  - "Tally isn't natively supported yet"
  - Visual list of alternatives with one-click connect
  - Option to use API key if user has Tally account
```

### Gap 2: Technical Error Messages

**Problem:** "Tool not found" errors are logged but not translated to user-friendly UI.

**Current Flow (FIX-020):**
```typescript
// In WorkflowPreviewCard.tsx line 3726
if (isToolNotFoundError(error as Error)) {
  const fallbacks = getFallbackTools(toolkit, toolSlug, nodeName)
  if (fallbacks.length > 0) {
    addLog(`⚠️ Tool not found: ${toolSlug}. Try: ${fallbacks.join(', ')}`)
  }
}
```
→ This only adds to execution log, user doesn't see a friendly prompt

**Desired Flow:**
```typescript
if (isToolNotFoundError(error)) {
  const alternatives = await nexusFallbackService.getSuggestedAlternatives(toolkit)
  setNodeState(node.id, 'alternatives_available')
  setNodeAlternatives(node.id, alternatives)
  // Show visual UI for alternatives selection
}
```

### Gap 3: Missing Service Integration

**Problem:** `ToolDiscoveryService`, `NexusFallbackService`, and `CustomIntegrationService` aren't orchestrated together in the execution flow.

**Current Connections:**
- ✅ ToolDiscoveryService → CustomIntegrationService (checks for API info)
- ❌ WorkflowPreviewCard → NexusFallbackService (not connected)
- ❌ WorkflowPreviewCard → ToolDiscoveryService (not connected during execution)

### Gap 4: No Pre-Execution Validation with Discovery

**Problem:** We validate tool slugs (FIX-019) but don't use ToolDiscoveryService for comprehensive support checking.

---

## Proposed Architecture

### New Component: `UnsupportedToolCard.tsx`

Shows when a tool isn't supported, offering three paths:

```
┌─────────────────────────────────────────────────────────────┐
│  💡 Tally isn't available yet                               │
│                                                             │
│  Here's what we can do:                                     │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ 🔄 Use Xero      │  │ 📊 Use QuickBooks │                 │
│  │ (One-click)      │  │ (One-click)       │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                             │
│  ── OR ──                                                   │
│                                                             │
│  🔑 I have a Tally API key                                  │
│  [Set up Tally with your API key]                           │
│                                                             │
│  ── OR ──                                                   │
│                                                             │
│  📧 Skip Tally, just email me the data                     │
└─────────────────────────────────────────────────────────────┘
```

### New Node State: `needs_alternative`

Workflow nodes can now have this state:
- `pending` - Not started
- `connecting` - OAuth in progress
- `executing` - Running action
- `success` - Completed
- `error` - Failed
- **`needs_alternative`** - Tool not supported, user must choose

### Modified Execution Flow

```
BEFORE EXECUTING NODE:
    │
    ├─► Is toolkit supported in Composio?
    │       │
    │       YES ─► Continue normal OAuth/execution flow
    │       │
    │       NO ─► Check ToolDiscoveryService
    │               │
    │               ├─► Has alternatives from NexusFallbackService?
    │               │       │
    │               │       YES ─► Show UnsupportedToolCard
    │               │       │
    │               │       NO ─► Check CustomIntegrationService
    │               │               │
    │               │               ├─► Has known API info?
    │               │               │       │
    │               │               │       YES ─► Show APIKeyAcquisitionCard
    │               │               │       │
    │               │               │       NO ─► Show generic "Not available" message
```

### Integration Points

**1. Pre-Execution Check in WorkflowPreviewCard:**

```typescript
// Before executeNode()
const discoveryResult = await toolDiscoveryService.discoverTool(toolkit)

if (discoveryResult.supportLevel === 'none') {
  // Show alternatives UI instead of executing
  setNodeState(node.id, 'needs_alternative')

  if (discoveryResult.customIntegration?.available) {
    // Show API key card
    setShowAPIKeyCard(toolkit, discoveryResult.customIntegration)
  } else if (discoveryResult.alternatives?.length) {
    // Show alternatives card
    setShowAlternativesCard(toolkit, discoveryResult.alternatives)
  }
  return
}
```

**2. Claude AI Response Enhancement:**

When Claude detects an unsupported tool in user request:

```json
{
  "message": "I see you want to connect to Tally! While Tally isn't directly supported yet, I have some great alternatives...",
  "shouldGenerateWorkflow": true,
  "workflowSpec": { ... },
  "unsupportedTools": [
    {
      "requested": "tally",
      "alternatives": ["zoho_books", "xero", "quickbooks"],
      "hasAPIKeyOption": true,
      "apiKeySetup": {
        "displayName": "Tally",
        "apiDocsUrl": "https://tally.so/api/docs",
        "steps": ["Go to Settings...", "Copy API key..."]
      }
    }
  ]
}
```

---

## Implementation Plan

### Phase 1: Create UnsupportedToolCard Component

**Files:**
- `nexus/src/components/chat/UnsupportedToolCard.tsx` (NEW)

**Features:**
- Shows requested tool that isn't supported
- Lists alternatives from NexusFallbackService
- "One-click" buttons for alternatives (triggers OAuth)
- "Use API key" button (opens APIKeyAcquisitionCard)
- "Skip" button (falls back to email/generic notification)

### Phase 2: Add `needs_alternative` Node State

**Files to Modify:**
- `WorkflowPreviewCard.tsx` - Add new state handling
- Node rendering - Show alternative UI when in this state

**Visual:**
- Yellow/amber color (like `needs_info`)
- Question mark icon
- Message: "Choose how to proceed"

### Phase 3: Wire Up Services

**Connect these in WorkflowPreviewCard:**
1. Import `toolDiscoveryService`
2. Import `nexusFallbackService`
3. Call `discoverTool()` before execution
4. Route to appropriate UI based on result

### Phase 4: Enhance AI Response

**Files:**
- `server/agents/index.ts` - Update Nexus personality to include unsupported tool handling
- `src/services/NexusAIService.ts` - Parse `unsupportedTools` from response

---

## UX Principles (From nexus-ux-patterns.md)

1. **Zero Technical Jargon** - Never show "TALLY_CREATE_INVOICE not found"
2. **Smart Collection** - Don't ask for IDs, ask naturally
3. **Fallback to What They Have** - If user has Gmail connected, offer email fallback
4. **Confidence Display** - Show confidence in alternatives

---

## User Stories

### Story 1: User Requests Unsupported Tool

```
Given: User says "Track my expenses in Wave"
When: Nexus processes the request
Then:
  - Workflow shows Wave node in "needs_alternative" state
  - UnsupportedToolCard appears with:
    - "Wave needs an API key to connect"
    - Steps to get Wave API key
    - Alternative: "Use Zoho Books or Xero instead?"
```

### Story 2: User Chooses Alternative

```
Given: UnsupportedToolCard shown for Tally
When: User clicks "Use Xero instead"
Then:
  - Tally node is replaced with Xero node
  - OAuth flow starts for Xero
  - Workflow continues with Xero
```

### Story 3: User Provides API Key

```
Given: UnsupportedToolCard shown for Wave
When: User clicks "I have a Wave API key"
Then:
  - APIKeyAcquisitionCard appears
  - User pastes API key
  - Key is validated and stored
  - Workflow continues with Wave
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `UnsupportedToolCard.tsx` | CREATE | New component for alternatives UI |
| `WorkflowPreviewCard.tsx` | MODIFY | Add needs_alternative state, wire services |
| `server/agents/index.ts` | MODIFY | Teach Claude about unsupported tools |
| `NexusAIService.ts` | MODIFY | Parse unsupportedTools from response |
| `chat.ts` | MODIFY | Add endpoint for tool discovery |

---

## Risk Mitigation

1. **Protected Fixes:** FIX-019, FIX-020 must not be removed - add new code alongside
2. **Backwards Compatible:** New node state is additive, doesn't break existing flows
3. **Fallback Chain:** Even if discovery fails, existing error handling remains

---

## Success Criteria

- [ ] User never sees "Tool not found" error
- [ ] User never needs to understand API slugs
- [ ] Every unsupported tool shows alternatives
- [ ] API key setup works for 100+ apps in CustomIntegrationService
- [ ] One-click alternatives actually trigger OAuth and replace node

---

## Decision Points Needed

1. **Where should UnsupportedToolCard render?**
   - Option A: Replace the node visually in workflow
   - Option B: Show as modal/overlay
   - Option C: Show below the workflow card (like current error handling)

2. **When should pre-discovery happen?**
   - Option A: Before generating workflow (during AI response)
   - Option B: At execution time (when user clicks Execute)
   - Option C: Both (discover during AI, validate at execution)

3. **How to handle "Skip" action?**
   - Option A: Remove the node entirely
   - Option B: Replace with email notification node
   - Option C: Mark as optional and continue

---

## Next Steps

1. Review this plan
2. Decide on the three decision points above
3. Begin Phase 1 implementation

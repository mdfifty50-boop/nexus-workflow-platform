# Cycle 3 - Agent 3: Production Execution Pipeline Deep-Dive

**Agent:** Production Analyst
**Cycle:** 3 of 20
**Date:** 2026-02-15
**Mission:** What would it take to make production workflow execution real?

---

## 1. Executive Summary

Production workflow execution is **closer to real than expected, but with a critical gap**. The Vercel serverless API surface has genuine Composio SDK integration that can make real API calls -- but the main `execute-workflow.ts` endpoint is entirely simulated. Meanwhile, the Rube proxy (`api/rube/[[...path]].ts`) has a real execution handler that already calls `composio.tools.execute()`. The frontend (`WorkflowPreviewCard.tsx`) calls the Rube proxy, NOT the simulated endpoint. This means **the path from UI to real execution already exists** -- it just needs a Composio API key in production and some hardening.

---

## 2. The Two Execution Paths (Production)

### Path A: `api/execute-workflow.ts` -- FULLY SIMULATED (321 lines)

**Location:** `nexus/api/execute-workflow.ts`

This endpoint accepts a `WorkflowExecutionRequest` with steps and iterates through them, but the `executeAction()` function at line 213 is entirely hardcoded:

```typescript
// Line 219: "In a real implementation, this would call the actual tool/integration"
switch (tool) {
  case 'gmail':
    return { sent: true, to: config.to || 'user@example.com', ... }
  case 'slack':
    return { posted: true, channel: config.channel || '#general', ... }
  // ... hardcoded for 5 tools, then default returns generic
}
```

**Verdict:** This is a placeholder from early development. No real APIs are called. The frontend does NOT use this endpoint for the chat workflow execution path.

### Path B: `api/rube/[[...path]].ts` -- REAL COMPOSIO CALLS (864 lines)

**Location:** `nexus/api/rube/[[...path]].ts`

This is the production execution handler that **actually works**. Key handler at line 755:

```typescript
async function handleExecute(req, res, isDemoMode, apiKey) {
  // ... validation ...
  if (isDemoMode) {
    // Returns demo responses when no API key
    for (const tool of tools) {
      results.push({ tool_slug: tool.tool_slug, success: true, data: getDemoResponse(...) })
    }
  } else {
    // REAL EXECUTION:
    const { Composio } = await import('@composio/core')
    const composio = new Composio({ apiKey })
    for (const tool of tools) {
      const result = await composio.tools.execute(tool.tool_slug, {
        arguments: tool.arguments || {},
        userId: 'default'
      })
      results.push({ tool_slug: tool.tool_slug, success: true, data: result?.data || result })
    }
  }
}
```

**The demo mode gate:** `const isDemoMode = !apiKey || apiKey.length < 10`

This means:
- **Without `COMPOSIO_API_KEY` in Vercel env vars** = demo mode (simulated responses)
- **With valid `COMPOSIO_API_KEY`** = real Composio API calls

### Path C: `api/composio/[[...path]].ts` -- PARALLEL REAL PATH (325 lines)

A second Composio proxy exists at `/api/composio/*` with similar real execution logic, including batch execution, connection management, and user-scoped execution. Also gates on `COMPOSIO_API_KEY`.

---

## 3. The Frontend Execution Chain

The `WorkflowPreviewCard.tsx` (7000+ lines) contains the complete execution orchestration:

```
User clicks "Execute"
    |
    v
executeWorkflow() [line 5244]
    |
    v
For each node:
  1. Classify: trigger? AI? internal? action?
  2. Resolve tool slug (FIX-062 orchestration-first, FIX-063 legacy override)
  3. Collect/merge params (FIX-029)
  4. Validate params (FIX-062 dynamic schema)
  5. Check connection (FIX-115)
  6. Execute via VerifiedExecutorService (FIX-041)
    |
    v
VerifiedExecutorService.execute()
    |
    v
GenericExecutor.execute() [orchestration/GenericExecutor.ts]
    |
    v
fetch('/api/rube/execute', { ... })  <-- THIS IS THE PRODUCTION CALL
    |
    v
Vercel serverless: api/rube/[[...path]].ts -> handleExecute()
    |
    v
composio.tools.execute() -- REAL API CALL (if API key present)
```

**Critical finding:** The frontend already routes through `/api/rube/execute`, not through the simulated `execute-workflow.ts`. The execution pipeline is already wired for production.

---

## 4. What's Currently Blocking Real Execution

### 4.1 Missing `COMPOSIO_API_KEY` in Vercel

The single biggest blocker. Every production handler checks:
```typescript
const apiKey = process.env.COMPOSIO_API_KEY
const isDemoMode = !apiKey || apiKey.length < 10
```

Without this environment variable set in Vercel, all execution returns demo data.

**Fix:** Run `vercel env add COMPOSIO_API_KEY` and set a valid key from composio.dev dashboard.

### 4.2 OAuth Token Management

The production Rube handler has OAuth connection management (`handleManageConnections`, line 372), but tokens are stored within Composio's infrastructure (not locally). The flow:

1. Frontend calls `/api/rube/manage-connections` with toolkit list
2. Backend calls `composio.authorize('default', toolkit, { redirectUrl })`
3. Returns `redirectUrl` for OAuth popup
4. Frontend polls `/api/rube/connection-status/[toolkit]` every 3 seconds
5. Backend calls `composio.connectedAccounts.list({ toolkitSlugs: [toolkit] })`

**Current state:** This flow is fully implemented in production code. The redirect URL defaults to:
```typescript
const redirectUrl = process.env.COMPOSIO_REDIRECT_URL ||
  `${process.env.VERCEL_URL || 'https://nexus-theta-peach.vercel.app'}/oauth/callback`
```

**Gap:** There is no `/oauth/callback` serverless function. The callback handler needs to exist to complete the OAuth loop. However, Composio may handle the redirect internally (routing back to the app after auth completes). This needs testing with a real API key.

### 4.3 User ID Management

All execution currently uses `userId: 'default'`:
```typescript
const result = await composio.tools.execute(tool.tool_slug, {
  arguments: tool.arguments || {},
  userId: 'default'  // <-- Everyone shares one identity
})
```

For production multi-tenant, each user needs their own Composio user ID. This means:
- Mapping Clerk/Supabase user IDs to Composio entity IDs
- Storing per-user OAuth connections
- Scoping execution to the authenticated user's tokens

### 4.4 No Streaming / Progress Updates

The current execution model is **synchronous request-response**:

```
Client POST /api/rube/execute
  -> Server runs all tools sequentially
  -> Server returns batch result
```

For workflows with 3-5 steps, each taking 1-5 seconds, the total time could be 5-25 seconds. This works within Vercel's timeout but provides no progress feedback. The frontend simulates progress by updating node states optimistically, but the actual response comes as one block.

---

## 5. Vercel Serverless Constraints

### Timeout Limits

| Vercel Plan | Function Timeout | Streaming Timeout |
|-------------|-----------------|-------------------|
| Hobby | 10 seconds | 25 seconds |
| Pro | 60 seconds | 300 seconds (5 min) |
| Enterprise | 900 seconds (15 min) | 900 seconds |

**Current plan context:** The `vercel.json` has no `maxDuration` configured, so defaults apply. Most workflow executions (2-5 Composio API calls) should complete within 10-30 seconds.

### Cold Start Impact

Each Vercel function cold starts independently. The Rube handler uses dynamic import:
```typescript
const { Composio } = await import('@composio/core')
```

This adds ~500-1500ms on cold start for SDK initialization. Subsequent calls within the warm window (~15 minutes) reuse the function instance.

**Mitigation strategies:**
- Pre-warm with a scheduled ping (cron job on `/api/health`)
- Bundle `@composio/core` at build time (static import instead of dynamic)
- Use Vercel Edge Functions for latency-critical paths (though Composio SDK may not work in Edge runtime)

### Memory Limits

Vercel serverless functions get 1024MB by default (Pro plan). The Composio SDK plus response handling should be well within this limit for typical workflows.

---

## 6. Minimal Production Execution Pipeline Design

### Phase 1: Flip the Switch (1-2 hours)

1. **Add `COMPOSIO_API_KEY`** to Vercel environment variables
2. **Test with a single tool**: Deploy and call `/api/rube/execute` with `GMAIL_FETCH_EMAILS` to verify real API calls work
3. **Verify OAuth flow**: Test connection initiation via `/api/rube/manage-connections` and check if Composio handles the callback internally

### Phase 2: Hardening (1-2 days)

1. **Add `/api/oauth/callback.ts`** serverless function if Composio needs an explicit callback handler
2. **Add error handling for Composio API outages**: The current handler catches errors but returns generic messages. Add specific handling for rate limits, expired tokens, invalid tool slugs
3. **Add execution logging to Supabase**: Store execution results (workflow_id, user_id, tool_slug, success/fail, duration) for analytics
4. **Configure `maxDuration`** in `vercel.json`:
```json
{
  "functions": {
    "api/rube/[[...path]].ts": { "maxDuration": 60 },
    "api/composio/[[...path]].ts": { "maxDuration": 60 },
    "api/execute-workflow.ts": { "maxDuration": 60 }
  }
}
```

### Phase 3: Streaming Progress (3-5 days)

Replace the synchronous batch execution with a streaming response:

```typescript
// In api/rube/execute handler:
export default async function handler(req, res) {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  for (const tool of tools) {
    // Send progress event
    res.write(`data: ${JSON.stringify({ type: 'progress', tool: tool.tool_slug, status: 'executing' })}\n\n`)

    const result = await composio.tools.execute(tool.tool_slug, { ... })

    // Send result event
    res.write(`data: ${JSON.stringify({ type: 'result', tool: tool.tool_slug, success: true, data: result })}\n\n`)
  }

  res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`)
  res.end()
}
```

Frontend changes: Replace `fetch` + `await response.json()` with `EventSource` or fetch + `ReadableStream`.

Vercel supports HTTP streaming from serverless functions. The streaming timeout is much longer than the standard timeout (25s on Hobby, 300s on Pro).

### Phase 4: Multi-Tenant (1 week)

1. **User ID mapping**: Create `/api/composio/user-session.ts` that maps Clerk user ID to a Composio entity
2. **Per-user connections**: Pass user's Composio entity ID instead of `'default'`
3. **Connection isolation**: Each user's OAuth tokens are scoped to their Composio entity
4. **Execution audit trail**: Log who executed what, with what result, in Supabase

---

## 7. Full API Surface Inventory (Production)

| Endpoint | Method | Purpose | Real Execution? |
|----------|--------|---------|----------------|
| `/api/chat` | POST | Claude AI chat | YES (real Anthropic API) |
| `/api/chat/agents` | GET | List agents | YES (static data) |
| `/api/health` | GET | Health check | YES |
| `/api/execute-workflow` | POST | **SIMULATED** workflow execution | NO (hardcoded responses) |
| `/api/rube/status` | GET | Composio status check | YES (if API key) |
| `/api/rube/search-tools` | POST | Tool discovery | PARTIAL (static catalog) |
| `/api/rube/get-tool-schemas` | POST | Tool input schemas | PARTIAL (static + generic) |
| `/api/rube/execute` | POST | **Tool execution** | **YES** (if API key) |
| `/api/rube/manage-connections` | POST | OAuth initiation | YES (if API key) |
| `/api/rube/connection-status/:tk` | GET | Connection check | YES (if API key) |
| `/api/composio/status` | GET | Composio status | YES |
| `/api/composio/execute` | POST | **Tool execution** | **YES** (if API key) |
| `/api/composio/connect` | GET/POST | OAuth flow | YES (if API key) |
| `/api/composio/tools` | GET | Tool listing | PARTIAL |
| `/api/composio/user` | GET/POST/DELETE | User management | YES (if API key) |
| `/api/composio/session` | POST | Session creation | YES |
| `/api/chat-persistence/status` | GET | Supabase check | Config check only |
| `/api/workflow-persistence/status` | GET | Supabase check | Config check only |
| `/api/user-preferences/status` | GET | Supabase check | Config check only |

---

## 8. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Composio API rate limits | Medium | Implement per-user rate limiting in serverless |
| OAuth token expiry mid-workflow | Medium | FIX-115 already checks pre-execution; add refresh logic |
| Vercel cold start delays | Low | Pre-warm via cron, static imports |
| Hobby plan 10s timeout | High | Upgrade to Pro or optimize to single-tool-at-a-time with client polling |
| Shared `userId: 'default'` | High | All users share one set of OAuth tokens until multi-tenant is built |
| No execution persistence | Medium | Workflow results vanish on page refresh; need Supabase logging |
| `execute-workflow.ts` confusion | Low | Dead code -- frontend doesn't use it. Should be removed or updated |

---

## 9. Critical Insight: It's Closer Than It Looks

The architecture diagram for what exists TODAY in production:

```
         USER (Browser)
              |
              v
    WorkflowPreviewCard.tsx
    [5000+ lines of orchestration logic]
    [Tool slug mapping, param collection, validation]
    [Error classification, retry logic, verification]
              |
              v
    VerifiedExecutorService -> GenericExecutor
              |
              v
    fetch('/api/rube/execute')    <-- CLIENT-SIDE HTTP CALL
              |
              | (HTTPS over Vercel)
              v
    api/rube/[[...path]].ts       <-- VERCEL SERVERLESS FUNCTION
    handleExecute()
              |
              v
    isDemoMode?
    /         \
   YES        NO (COMPOSIO_API_KEY present)
    |              |
    v              v
   Demo       composio.tools.execute()
   Response        |
                   v
              REAL 3rd-PARTY API CALL
              (Gmail, Slack, Sheets, etc.)
```

**The entire pipeline is built. The single gating factor is the `COMPOSIO_API_KEY` environment variable in Vercel.**

Setting that one key turns demo mode into real mode. The frontend already handles connection checks, OAuth popups, parameter collection, tool slug resolution, error classification, retry logic, and verified execution with proof.

---

## 10. Recommendation

**Immediate action (Phase 1):** Set `COMPOSIO_API_KEY` in Vercel, test with one real integration (e.g., Gmail fetch), and verify the end-to-end path works. This could take under an hour.

**Then:** Add `maxDuration` to `vercel.json`, implement streaming for progress feedback, and build user-scoped Composio entities for multi-tenant isolation.

**Delete or repurpose:** `api/execute-workflow.ts` is dead weight. Either remove it or rewire it to call the Rube handler internally.

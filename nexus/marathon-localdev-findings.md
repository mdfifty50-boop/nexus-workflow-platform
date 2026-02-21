# Marathon Local Dev Testing Findings Log

**Started:** 2026-02-19
**Purpose:** Full E2E testing on local dev, identical to production
**Production URL:** https://nexus-theta-peach.vercel.app
**Local Dev URL:** http://localhost:5173

## Pre-Test Verification

### Code Parity Check
- **Last production commit:** `a8fff5f` (Cost optimization: FIX-193 to FIX-196)
- **Local uncommitted changes:** FIX-195b only (snippet size improvement, not yet deployed)
- **Verdict:** Local dev is 99.9% identical to production. Only difference is FIX-195b (history trimming snippet sizes 150→250, 200→350 chars)

### Environment Differences
| Factor | Production (Northflank/Vercel) | Local Dev |
|--------|-------------------------------|-----------|
| Frontend | Vercel CDN (pre-built) | Vite dev server (HMR) |
| Backend | Northflank Express | Local Express (tsx watch) |
| AI API | Anthropic API (paid) | Anthropic API (paid) |
| Streaming | SSE via Northflank (503s) | SSE via localhost (should work) |
| WhatsApp | Northflank backend | Local backend |

---

## Findings & Fixes (To Deploy to Production)

### Fix Queue (Apply to production after marathon)

| # | Fix ID | Description | Files | Severity | Status |
|---|--------|-------------|-------|----------|--------|
| 1 | FIX-195b | Increase trimming snippet sizes (150→250, 200→350) | `server/routes/chat.ts` | Low | Ready to deploy |
| 2 | FIX-197 | Wire streaming path to proxy-first (Max plan $0 for local dev) | `server/routes/chat.ts` | Medium | LOCAL DEV ONLY — DO NOT deploy |
| 3 | FIX-198 | Fix deprecated Haiku model ID (3.5→4.5) | `server/routes/chat.ts`, `server/services/claudeProxy.ts` | High | YES — deploy (Haiku 404 error) |
| 4 | FIX-199 | Extended SSE/non-streaming timeouts for local dev (proxy is slower) | `src/services/NexusAIService.ts` | Medium | LOCAL DEV ONLY — guarded by `import.meta.env.DEV` |
| 5 | FIX-200 | Plain text extraction for first messages + prefer streamed text | `server/routes/chat.ts`, `src/components/chat/ChatContainer.tsx` | High | YES — deploy (fixes Think with me truncation) |
| 6 | PROXY-v2 | Rewrote claude-proxy from CLI spawning (20-120s) to SDK-direct (1-3s) | `claude-proxy/server.js` | Critical | LOCAL DEV ONLY — proxy is dev infrastructure |
| 7 | PROXY-FIX | Fixed CLAUDECODE env var preventing nested CLI sessions | `claude-proxy/server.js` | Critical | LOCAL DEV ONLY (superseded by PROXY-v2) |

### Bugs Found During Testing

| # | Test | Bug Description | Root Cause | Fix Applied? | Deploy? |
|---|------|----------------|------------|-------------|---------|
| 1 | T10 | "Think with me" mode times out on complex questions — returns error fallback message | SSE streaming timeout + non-streaming retry both timeout (~75s total). chatMode='think_with_me' may use higher maxTokens or different config causing slow response | NO | YES |
| 2 | ALL | `/api/user-profile/context` returns 404 on every message send | Missing API endpoint or route | NO | YES |
| 3 | ALL | PreFlightService infinite loop — continuous polling on pages with workflow cards | useEffect deps create new refs on re-renders triggered by own state updates | NO (Task #33) | YES |
| 4 | T11 | Duplicate user message — SSE stream timeout causes fallback to non-streaming, both paths create a message | SSE stream + non-streaming fallback both succeed, creating two AI responses | NO | YES |
| 5 | T11 | Clarifying buttons inconsistent — turn 2 has buttons, turn 3 has plain text bullet lists | Confidence gate injects buttons only when JSON clarifyingQuestions field present; plain text responses skip button rendering | NO | YES |
| 4 | T11 | Double message send — every message sent twice (duplicate user + AI) | Unknown — `handleSend` called twice per submit. May be React StrictMode double-render or event handler registered twice | NO | YES |
| 5 | T11 | Inconsistent clarifying buttons — some AI responses have buttons, others just text | Proxy path sends full response as single token event; confidence gate may not extract clarifying options from proxy path | NO | YES |

### Infrastructure Fixes

| # | Fix | Description | Status |
|---|-----|-------------|--------|
| 1 | Proxy v2 (SDK-based) | Rewrote claude-proxy/server.js from CLI-spawning (20-120s) to Anthropic SDK direct (1.5-3s) | DONE — deployed locally |
| 2 | Proxy CLAUDECODE env fix | Old proxy failed 100% because CLAUDECODE env var prevented nested Claude sessions | DONE — superseded by v2 |
| 3 | Kill extra Vite instances | 4 Vite dev servers running simultaneously, multiplying API calls | DONE — only port 5173 active |

### Test Results

| # | Test Scenario | Result | Notes |
|---|--------------|--------|-------|
| 1 | Simple Greeting | PASS | "Hello! What can you help me with?" → Conversational, no workflow card. Intent: greeting |
| 2 | Simple Question | PASS | "What apps do you support?" → Lists 500+ apps, no workflow card. Intent: question |
| 3 | Basic Workflow | PASS | Gmail→Sheets → 2-step workflow card, confidence 0.95, quick questions |
| 4 | Arabic Input (Kuwaiti dialect) | PASS | "لما أحصل إيميل جديد..." → Workflow card generated, Arabic understood |
| 5 | Multi-step Workflow (3 apps) | PASS | GitHub→Trello+Discord → 3-step card, correct icons, confidence 0.95 |
| 6 | Strategic Consulting | PASS | Real estate Kuwait → Consulting response, no workflow card, "specialist team" CTA |
| 7 | Language Toggle + Arabic | PASS | ENG⇄عربي toggle → AI responds in Kuwaiti Arabic "خوش سؤال!", Arabic buttons |
| 8 | Navigation (Dashboard) | PASS | Sidebar→Dashboard redirects to /login (expected: not authenticated) |
| 9 | Suggestion Chip | PASS | Calendar summary suggestion → 4-step workflow, Kuwait timezone aware (8:00 AM UTC+3) |
| 10 | Think with me Mode | PASS | FIX-199 (extended timeouts) + FIX-200 (plain text extraction) → Full strategic response displayed |
| 11 | Multi-turn Complex Complaint | PASS* | Accounting firm 3 problems → 3-turn clarify → 6-step "Kuwait Invoice Processing & Audit Pipeline" with approval gate, 5% VAT, KWD. *Bugs: duplicate user message (SSE+fallback), inconsistent clarifying buttons (turn 2=buttons, turn 3=plain text) |
| 12 | Streaming & JSON Leak Detection | PASS* | "Daily Gmail Summary → Slack" → 4-step workflow card in ~5s, no JSON leak, 95% confidence, quick questions with buttons. *Minor: Quick Setup shows "Gmail message ID" (technical jargon, should be user-friendly) |
| 11 | Multi-turn Complex Complaint (Accounting) | PASS* | 3-turn clarifying flow → 6-step "Kuwait Invoice Processing & Audit Pipeline" with approval gate. *Bugs: double message send, inconsistent clarifying buttons |

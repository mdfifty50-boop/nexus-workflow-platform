# Nexus Marathon E2E Test Specification

**Version:** 1.0
**Created:** 2026-02-19
**Author:** Marathon Test Session (Claude Opus 4.6 + Playwright MCP)

---

## Overview

The Marathon Test is a comprehensive, multi-hour E2E testing methodology for Nexus's AI chat interface, workflow generation, and multi-turn conversation system. Tests run against **production** (nexus-theta-peach.vercel.app) using Playwright MCP browser automation.

---

## Environment Setup

### Prerequisites
- Playwright MCP tools loaded (`ToolSearch query: "playwright"`)
- Production deployment at `https://nexus-theta-peach.vercel.app`
- Backend server at `https://http--nexus-server--qlbw2fmhf4z2.code.run` (Northflank auto-deploy from `golden-path` branch)
- Clerk auth in development mode

### Access Method
- **Chat page:** `https://nexus-theta-peach.vercel.app/chat` (publicly accessible, no auth required)
- **Dashboard/other routes:** Require Clerk sign-in (Google OAuth or email/password)
- **Note:** Clerk CAPTCHA may block automated sign-up in Playwright. The `/chat` route bypasses auth.

### Tool Loading Sequence
```
1. ToolSearch query: "playwright"
2. mcp__playwright__browser_navigate → production URL
3. mcp__playwright__browser_snapshot → verify page loaded
4. mcp__playwright__browser_console_messages → check for errors
```

---

## Test Categories

### Category 1: Multi-Turn Complex Complaints
**Goal:** Verify Nexus handles multi-step diagnostic conversations with context retention across 3-5 follow-ups.

**Methodology:**
1. Send a complex complaint with 2-3 business problems in one message
2. Nexus should respond with clarifying questions (clickable buttons)
3. Click each follow-up option and verify:
   - Response maintains context from all previous messages
   - Buttons render correctly (no raw B64 markers)
   - Phase indicator updates (discovery → clarifying → generating)
4. After all questions answered, verify workflow generation:
   - WorkflowPreviewCard appears with correct node count
   - All integrations are correctly identified
   - Approval gates appear for high-risk steps (FIX-178+)

**Test Inputs (rotate through):**
- English: "My accounting firm in Kuwait has 3 urgent problems: invoices arrive as scanned PDFs, audit trail is manual, VAT calculations are wrong"
- Arabic: "عندي مطعم في الكويت وعندي مشكلتين: ١- ما أقدر أتابع طلبات التوصيل ٢- أبي أرسل عروض يومية للزبائن على الواتساب"
- Mixed: "I run a real estate company, my agents waste 2 hours daily on paperwork and our CRM is always out of date"

### Category 2: "Think with Me" + AI Consultancy Bridge
**Goal:** Verify the strategic consulting mode and context handoff to AI Consultancy room.

**Methodology:**
1. Click "Think with me" toggle in chat header
2. Send a strategic business question (e.g., "I want to launch a food delivery startup in Kuwait competing with Talabat")
3. Verify:
   - Response is strategic (not a workflow card)
   - "Get deeper analysis" button appears (FIX-176 Deep Dive)
   - No raw JSON or ```json visible during streaming (FIX-191)
4. Click "Get deeper analysis"
5. Verify AI Consultancy room opens with context from chat
6. Verify consultants respond (Amelia, Bob, Mary — simulation mode OK)
7. Close consultancy → verify return to chat with insights injected

### Category 3: Arabic Language Full Flow
**Goal:** Verify Arabic dialect awareness, RTL rendering, and full workflow generation in Arabic.

**Methodology:**
1. Toggle language to Arabic (عربي button in chat header)
2. Send complaint in Kuwaiti dialect
3. Verify:
   - Response is in Kuwaiti Arabic (not MSA)
   - Clarifying question buttons render in Arabic (FIX-192)
   - Follow-up context maintained across 3+ messages
4. After questions answered, verify Arabic workflow card:
   - Step names in Arabic or correctly mixed
   - Integration icons correct
   - Execute button functional

### Category 4: Streaming & JSON Leak Detection
**Goal:** Verify no raw JSON, code markers, or technical artifacts are ever visible to users.

**Methodology:**
1. Send various workflow requests and monitor streaming:
   - "Send me a daily summary of my Gmail to Slack"
   - "When I get a Stripe payment, log it in Google Sheets"
2. During streaming, take screenshots and snapshots
3. Verify:
   - "Nexus is thinking..." placeholder shows immediately (FIX-190)
   - No `{`, `"shouldGenerateWorkflow"`, ````json` visible (FIX-150, FIX-163, FIX-188, FIX-191)
   - WorkflowPreviewCard appears cleanly after streaming ends
   - No `[CLARIFYING_OPTIONS_B64:...]` raw text (FIX-192)

### Category 5: Workflow Execution Smoke Test
**Goal:** Verify workflow cards render correctly and OAuth connection flow works.

**Methodology:**
1. Trigger a workflow generation (e.g., "Save my Gmail emails to Google Sheets")
2. Verify WorkflowPreviewCard:
   - Correct number of nodes (trigger + actions)
   - Node status colors match spec (FIX-028)
   - Integration icons present
   - "Execute" button visible
3. Click "Execute" → verify OAuth popup opens for missing integrations
4. Verify polling for connection status (3-second interval)

### Category 6: Console Error Audit
**Goal:** Detect and catalog all console errors across the app.

**Methodology:**
1. Navigate to each route: `/`, `/chat`, `/dashboard`, `/templates`, `/settings`
2. At each route: `mcp__playwright__browser_console_messages level: "error"`
3. Categorize errors:
   - **P0:** App crashes, blank pages, auth failures
   - **P1:** Feature failures, API errors, missing endpoints
   - **P2:** Warnings, non-critical console errors
   - **P3:** Third-party service issues (Clerk, Spline, etc.)

---

## Verification Checklist Per Test

- [ ] Page loads without crash
- [ ] No "Maximum update depth exceeded" errors
- [ ] No raw JSON visible to user
- [ ] No technical jargon (tool slugs, parameter IDs)
- [ ] Clarifying question buttons render as clickable UI
- [ ] Workflow cards show correct nodes
- [ ] Phase indicator updates correctly
- [ ] Console errors logged and categorized
- [ ] Screenshots captured for visual verification

---

## Bug Fix Protocol

When a bug is found during marathon testing:

1. **Document:** Log exact reproduction steps in `marathon-e2e-test-log.md`
2. **Trace:** Follow ROOT-FINDING protocol (`.claude/rules/root-finding.md`)
3. **Fix:** Implement with `@NEXUS-FIX-XXX` marker
4. **Build:** `npm run build` — must pass
5. **Register:** Update `FIX_REGISTRY.json`
6. **Deploy:** `npx vercel --prod`
7. **Verify:** Re-run the failing test on production
8. **Commit:** Push to `golden-path` and `main` branches

---

## Deployment Pipeline

```
Code change → npm run build → npx vercel --prod → verify on production
                                    ↓
                              git push origin golden-path (→ Northflank auto-deploy backend)
                              git push origin golden-path:main (→ GitHub)
```

**Important:** Clear Service Worker cache after deployment:
```javascript
// Run in Playwright browser_run_code
const regs = await navigator.serviceWorker.getRegistrations();
for (const r of regs) await r.unregister();
const cacheNames = await caches.keys();
for (const n of cacheNames) await caches.delete(n);
```

---

## Known Constraints

| Constraint | Impact | Workaround |
|-----------|--------|------------|
| Clerk CAPTCHA blocks Playwright | Can't sign in to protected routes | Use `/chat` (public route) |
| SSE streaming returns 503 intermittently | Falls back to non-streaming | Non-blocking, fallback works |
| Backend 500 on user-profile, chat-persistence | Server endpoints need Clerk auth | Non-blocking for chat testing |
| Vercel CDN caching | New deployments may not be immediately visible | Clear SW + use deployment-specific URL |

---

## Metrics to Track

| Metric | How to Measure |
|--------|---------------|
| Response time | Time from send to first token |
| Streaming completeness | Full response received without truncation |
| Context retention | 3rd+ follow-up remembers 1st message details |
| Button render rate | % of clarifying options that render as buttons vs raw text |
| Console error count | Total errors per page load |
| Workflow generation accuracy | Correct integrations, step count, approval gates |

---

## Test Session Log Format

Each test in `marathon-e2e-test-log.md` follows this format:

```markdown
## TEST N: [Test Name]
**Time:** [UTC timestamp]
**Input:** "[exact user message]"
**Language:** [English/Arabic/Mixed]
**Mode:** [Standard/Think with me]

### Flow:
1. [Step-by-step interaction with Nexus]
2. [What was clicked, what appeared]

### Bugs Found:
- [Bug description] → [Fix ID]

### Result: [PASS / PARTIAL PASS / FAIL]
- [Specific checks that passed/failed]
```

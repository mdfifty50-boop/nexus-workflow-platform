# Nexus - Known Bugs & Open Issues

> **For:** Developer friend helping with bug fixes
> **Date:** 2026-03-16
> **Project:** Nexus AI Workflow Platform

---

## Quick Start

```bash
cd nexus
npm install
npm run dev        # Frontend only (port 5173)
npm run dev:all    # Frontend + backend server
```

Open `http://localhost:5173` in browser.

---

## Project Architecture (TL;DR)

- **Frontend:** React + TypeScript + Vite + Tailwind + shadcn/ui
- **Backend:** Express server (in `server/`) + Vercel serverless functions (in `api/`)
- **AI:** Claude API via `server/services/claudeProxy.ts`
- **Integrations:** Composio (500+ apps) via Rube MCP
- **Auth:** Clerk (production), bypassed in dev mode
- **DB:** Supabase (PostgreSQL)
- **Deployment:** Vercel (frontend + API) + Northflank (persistent server)

---

## CRITICAL: Fix Protection System

This codebase has **185 documented fixes** with code markers like `@NEXUS-FIX-017`.

**NEVER remove lines containing `@NEXUS-FIX-XXX` markers.** They are enforced by git hooks.

Before editing protected files, read `FIX_REGISTRY.json`.

Protected files (most critical):
- `src/components/chat/WorkflowPreviewCard.tsx` (72+ fix markers)
- `src/components/chat/ChatContainer.tsx`
- `server/agents/index.ts` (AI brain/personality)
- `src/services/RubeClient.ts`

---

## P0 - Critical Bugs (App-Breaking)

*None currently known — all recent P0s have been fixed (FIX-184 through FIX-196).*

---

## P1 - Feature Bugs (Things Not Working Fully)

### BUG-P1-01: Vercel Backend API Returns 404

**Where:** Any backend Express route called from Vercel deployment
**Symptom:** API calls to `/api/chat`, `/api/integrations/*` etc. return 404 on Vercel
**Root Cause:** Vercel serverless doesn't expose Express routes without explicit `vercel.json` rewrites
**Workaround:** Frontend `PreFlightService.ts` has local fallback via `TOOL_REQUIREMENTS` object
**Files:** `vercel.json`, `server/routes/*.ts`, `src/services/PreFlightService.ts`
**Repro:** Deploy to Vercel, try to use chat or integrations

### BUG-P1-02: Clerk Auth Not Fully Testable in Dev

**Where:** Login/SignUp pages
**Symptom:** Auth is bypassed in dev mode (`BYPASS_AUTH=true`). Full Clerk flow untested.
**Root Cause:** Needs valid `VITE_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`
**Files:** `src/pages/Login.tsx`, `src/pages/SignUp.tsx`, `src/contexts/AuthContext.tsx`

### BUG-P1-03: Workflow Persistence Not Implemented (Phase 1.2)

**Where:** Workflow execution results
**Symptom:** Executed workflows are lost on page refresh
**Root Cause:** Phase 1.1 (chat persistence) is done, but Phase 1.2 (workflow state persistence) is pending
**Files:** `src/components/chat/WorkflowPreviewCard.tsx`, Supabase schema

### BUG-P1-04: Cross-Device Sync Untested

**Where:** Chat history
**Symptom:** Chat persistence writes to both localStorage and Supabase, but cross-device retrieval is untested
**Files:** `src/services/ChatPersistenceService.ts` (if exists), `src/contexts/ChatContext.tsx`

---

## P2 - UX / Console Issues

### BUG-P2-01: Clerk 403 Errors in Console

**Where:** Browser console on any page
**Symptom:** 403 errors on `/v1/client/sign_ups` endpoint (Clerk)
**Root Cause:** Clerk SDK loads but keys may be misconfigured or test-mode limited
**Files:** `src/pages/SignUp.tsx`, `.env` (VITE_CLERK_PUBLISHABLE_KEY)

### BUG-P2-02: CSP Script-src Fallback Warnings

**Where:** Browser console
**Symptom:** Content Security Policy warnings about 'script-src' fallback
**Files:** `vercel.json` (security headers), any inline scripts

### BUG-P2-03: Bundle Size Warnings

**Where:** Build output
**Symptom:** Vite warns about chunk sizes exceeding recommended limits (~887KB main vendor chunk)
**Impact:** Slower initial page load
**Suggestion:** Code splitting, lazy loading heavy components

---

## P3 - Incomplete Features (TODOs in Code)

### KNET Payment Integration (28 TODOs)

**Where:** `src/lib/payments/knet-service.ts`, `src/lib/payments/webhooks/*.ts`
**What:** All payment processing is stubbed out. Real KNET API calls need implementation.
**Priority:** Needed before Kuwait launch

### Subscription Portal Mock APIs (6 TODOs)

**Where:** `src/components/pricing/SubscriptionPortal.tsx`
**What:** Uses mock data instead of real Stripe/backend API calls

### Voice Features (2 TODOs)

**Where:** `src/components/voice/VoiceConfigurationPanel.tsx`, `src/components/marketplace/SearchBar.tsx`
**What:** Voice preview and voice search not implemented

### Error Logging / Sentry (1 TODO)

**Where:** `src/lib/error-logger.ts`
**What:** Sentry integration placeholder exists but not connected

---

## Recently Fixed (For Context)

| Fix | Date | What Was Broken |
|-----|------|-----------------|
| FIX-196 | Feb 2026 | Stream health monitoring |
| FIX-192 | Feb 2026 | Raw clarifying options marker displayed to user |
| FIX-191 | Feb 2026 | Raw JSON flash during streaming |
| FIX-190 | Feb 2026 | Context loss on multi-turn follow-ups |
| FIX-189 | Feb 2026 | Unicode emoji/Arabic crashes btoa() |
| FIX-188 | Feb 2026 | JSON flash during SSE streaming |
| FIX-187 | Feb 2026 | AI asking unnecessary clarifying questions |
| FIX-186 | Feb 2026 | Northflank crash loop (isolated-vm) |
| FIX-185 | Feb 2026 | WhatsApp backend URL + CSP for Northflank |
| FIX-184 | Feb 2026 | Orchestration infinite polling loop on Vercel |

---

## How to Add a Fix

1. Fix the bug in code
2. Add a `// @NEXUS-FIX-XXX: description` comment marker
3. Update `FIX_REGISTRY.json` with the fix details
4. Run `npm run build` to verify no regressions
5. Commit with message: `Fix [description] (FIX-XXX)`

---

## Key Files to Understand

| File | What It Does |
|------|-------------|
| `server/agents/index.ts` | AI brain — system prompt, personality, all intelligence |
| `src/components/chat/WorkflowPreviewCard.tsx` | Main workflow UI — visual nodes, OAuth, execution |
| `src/components/chat/ChatContainer.tsx` | Chat UI — handles AI responses |
| `server/services/claudeProxy.ts` | Routes requests to Claude API |
| `src/services/RubeClient.ts` | Composio/Rube integration client |
| `server/routes/chat.ts` | Chat API endpoint |
| `FIX_REGISTRY.json` | All 185 fixes documented |

---

## Running Tests

```bash
npm run build          # TypeScript + Vite build (catches type errors)
npx playwright test    # E2E tests (if Playwright installed)
```

No unit test suite currently — build verification is the main safety net.

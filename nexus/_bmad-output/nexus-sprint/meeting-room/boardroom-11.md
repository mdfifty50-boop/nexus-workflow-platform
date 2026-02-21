# Boardroom Discussion #11: Error Handling & Resilience Masterclass

**Meeting:** Nexus AI Platform Investigation - Cycle 11 Review
**Cycle:** 11 of 20
**Theme:** "How do we ensure Nexus NEVER shows a user a technical error?"
**Date:** 2026-02-15
**Attendees:** All 10 Investigation Agents + Moderator
**Duration:** Extended session
**Previous Discussions:** [Boardroom 10](boardroom-10.md) (Revenue), [Boardroom 9](boardroom-9.md) (Scalability), [Boardroom 3](boardroom-3.md) (Implementation)

---

## 1. Opening: The Resilience Question

**Moderator:** Welcome to Boardroom Discussion #11. Every previous cycle has identified error handling gaps in passing. Cycle 1 found 8 silent `catch { /* ignore */ }` blocks in UserMemoryService. Cycle 3 found zero input sanitization. Cycle 9 identified cascading failure risks at scale. This cycle, we audit the entire error handling surface and design a system where the user **never** sees a technical error. Not "rarely." Never. Agent 9, who has been tracking errors since Cycle 1, starts us off.

---

## 2. The Error Audit

**Agent 9:** I conducted a comprehensive error audit across the entire Nexus codebase. The numbers are sobering. Across 53 service files in `src/services/`, I found 1,400 occurrences of error-related patterns (catch, throw, Error, error, retry, fallback, graceful). Let me categorize what I found:

**Category 1: Silent Failures (THE WORST).** These catch errors and swallow them with no user feedback, no logging, and no recovery. The pattern is `catch { /* ignore */ }` or `catch {}`. I found this in:
- `UserMemoryService.ts`: 8 instances across `loadBusinessProfile`, `loadUserContext`, `loadChatHistory`, `loadWorkflows`, `loadPreferences`, `loadOnboardingStatus`, `loadEventLog`, and `recordEvent`.
- `UserContextService.ts`: 4 instances in `loadFromStorage`, `saveToStorage`, `loadFromCloud`, and the constructor's `initializeRegionalDefaults` fallback path.
- `NexusAIService.ts`: 2 instances in `buildUserContext` nested try-catches.

Total: **14 silent failure points.** Each of these means the system could be operating with incomplete data and the user would never know. If `loadWorkflows()` fails, the AI thinks the user is brand new and gives beginner-level suggestions to a power user.

**Category 2: Generic Error Messages.** These catch errors and return a generic fallback. Better than silent, but unhelpful.
- `NexusAIService.chat()` catches all errors and returns: "I'm having trouble connecting right now. Let me try a simpler approach -- what would you like to automate today?" This message is shown whether the error is a network timeout, a Claude rate limit, a JSON parse failure, or a server crash. The user cannot distinguish between "Nexus is down" and "I typed something it couldn't understand."

**Category 3: Well-Classified Errors (THE GOOD).** Two systems already handle errors properly:
- `ErrorClassifier.ts` (643 lines): Classifies errors into 13 categories with user-friendly messages and recovery actions. Patterns for missing params, tool not found, connection expired, rate limited, network error, permission denied, invalid param, quota exceeded, service unavailable, and timeout. Each has a recovery action: collect_param, show_alternatives, reconnect, retry, skip_node, abort, contact_support.
- `error-messages.ts` (1,439 lines): A comprehensive multilingual error message catalog covering 8 languages with 15 error types, each with title, message, suggestion, and actions. This is genuinely world-class error messaging infrastructure.

**The gap:** ErrorClassifier and error-messages.ts exist but are **not consistently used** across the codebase. The 14 silent failures and the generic NexusAIService fallback bypass both systems entirely.

**Moderator:** **Consensus Point 1 -- The codebase has world-class error infrastructure (ErrorClassifier + multilingual error-messages) that is inconsistently used. 14 silent failure points in critical services create data integrity risks. The fix is not writing new error handling code -- it is wiring existing infrastructure into the 14 silent catch blocks and the generic NexusAIService fallback.**

---

## 3. Graceful Degradation Design

**Agent 4:** I want to reframe the problem. The goal is not "handle every error" -- it is "never show a broken experience." The difference matters. A handled error might show a toast notification: "Error loading preferences." A gracefully degraded experience says nothing about errors and simply works with reduced capabilities.

Let me define the degradation hierarchy for every Nexus subsystem:

**Chat System Degradation:**
| Component | Full | Degraded | Offline |
|-----------|------|----------|---------|
| AI Responses | Claude via backend | Template-based fallback | Cached suggestions |
| Conversation History | Supabase sync + local | Local storage only | Last cached session |
| User Context | Full profile + memory | Basic profile from localStorage | Regional defaults only |
| Tool Suggestions | Dynamic via Composio | Static TOOL_SLUGS mapping | Top 10 popular tools |

**Workflow Execution Degradation:**
| Component | Full | Degraded | Offline |
|-----------|------|----------|---------|
| Execution | Real Composio API | Demo mode (simulated) | Queue for later |
| OAuth | Live popup flow | "Connect later" with reminder | Save intent, prompt on reconnect |
| Parameter Resolution | API-based ID lookup | User-friendly manual input | Cached values from last session |
| Step Processing | All steps execute | Failed steps skipped, rest continue | Nothing executes, full queue |

**Agent 6:** The offline mode is particularly important for the Kuwait market. Agent 7 mentioned in Cycle 3 that construction sites in Kuwait may have intermittent connectivity. If a construction manager is reviewing workflows on-site and loses connectivity, the current behavior is a blank screen or a spinner. The degraded behavior should be: show cached data, allow read-only access to existing workflows, queue any new actions for execution when connectivity returns.

**Agent 10:** I want to add a UX layer to the degradation. The user should see visual cues that indicate reduced capability without alarming them:
- **Full mode:** No indicator (normal experience)
- **Degraded mode:** Small amber dot in the header, tooltip: "Some features may be limited"
- **Offline mode:** Small gray dot, tooltip: "Working offline - changes will sync when you reconnect"

No error dialogs. No toast notifications for expected degradation. Just subtle visual cues that respect the user's intelligence without demanding their attention.

**Agent 7:** The prayer time engine I designed in Cycle 3 is fully offline-first (the `adhan` library computes locally). This is a model for other subsystems. The question for each feature should be: "What can this feature do with zero network connectivity?" If the answer is "nothing," that feature needs an offline fallback.

**Moderator:** **Consensus Point 2 -- Every subsystem must define three modes: Full, Degraded, and Offline. Users see subtle visual cues (colored dots) rather than error messages. The degradation is automatic and transparent. Features should be designed offline-first where possible, with the prayer time engine as the model.**

---

## 4. User-Facing Error Messages

**Agent 1:** The `error-messages.ts` catalog has 15 error types in 8 languages. This is extraordinary coverage. But I identified gaps:

**Missing error types for workflow-specific scenarios:**
1. **Workflow step timeout.** User's 5-step workflow has step 3 timeout. Current: generic "Something went wrong." Needed: "Step 3 (Send Slack message) took too long. The other steps completed successfully. Want me to retry just that step?"
2. **Partial success.** 4 of 5 steps succeed. Current: shown as failure. Needed: "Your workflow mostly worked! 4 of 5 steps completed. Step 3 needs attention -- [specific issue]."
3. **Integration rate limit.** User hits Gmail's sending limit. Current: generic error. Needed: "Gmail limits sending to 500 emails per day. You've sent 498 today. Your remaining messages will be sent tomorrow at 9 AM."
4. **Composio service degradation.** The Composio backend is slow or partially down. Current: timeout error. Needed: "We're experiencing slower than usual execution times. Your workflow is queued and will run shortly."

**Agent 5:** The language matters enormously for the Kuwait market. The current error messages are in 8 languages but Arabic is not one of them. The `error-messages.ts` catalog has: en, es, fr, de, ja, zh, pt, ko. No Arabic. For a platform targeting Kuwait as its primary market, this is a critical gap.

**Agent 7:** Arabic error messages need dialect consideration. "Something went wrong" in MSA (Modern Standard Arabic) is "حدث خطأ ما" which sounds formal and cold. In Gulf Arabic, the equivalent would be "في مشكلة بسيطة" (there's a small problem) which is softer and more natural. For a business tool in Kuwait, MSA for titles and Gulf Arabic for explanations would feel most natural.

**Agent 1:** The i18n framework already supports Arabic. `src/i18n/locales/ar.json` exists and is populated. The error-messages catalog just needs an `ar` locale added to each error definition. It is a content task, not an engineering task -- roughly 2-3 hours of translation work for all 15 error types.

**Agent 10:** I want to propose an error message design principle: **Every error message must pass the "grandmother test."** If Fatima's grandmother (who uses WhatsApp but has never heard of API keys) reads the error message, can she understand what happened and what to do next? If not, the message is too technical.

Here are examples:

| Bad (Grandmother fails) | Good (Grandmother passes) |
|------------------------|--------------------------|
| "API error: 429 Too Many Requests" | "We need to slow down a bit. Try again in 30 seconds." |
| "OAuth token expired for gmail" | "Your Gmail connection needs a quick refresh. Click here." |
| "Missing required parameter: spreadsheet_id" | "Which Google Sheet should I use? Pick one or paste a link." |
| "COMPOSIO_TOOL_NOT_FOUND: DROPBOX_SAVE_FILE" | "I can't find that exact feature in Dropbox. Want me to try uploading instead?" |
| "Network error: ECONNREFUSED" | "I'm having trouble reaching the internet. Check your connection?" |

**Moderator:** **Consensus Point 3 -- Error messages must pass the "grandmother test." Add Arabic (ar) locale to the error-messages catalog (2-3 hours of content work). Add 4 new workflow-specific error types: step timeout, partial success, integration rate limit, and service degradation. Every error message includes what happened, what was affected, and what the user can do.**

---

## 5. Automatic Retry with Intelligent Backoff

**Agent 3:** The `IntegrationSelfHealingService.ts` implements the most sophisticated retry system in the codebase. It has: circuit breakers per tool, learned error patterns, active healing sessions, and metrics tracking. The retry configuration uses exponential backoff with jitter, configurable per error type.

But this service is 200+ lines of type-safe architecture that runs during workflow execution only. The most common user-facing errors -- chat API failures -- use no retry logic at all. When `NexusAIService.chat()` fails, it immediately returns the generic fallback message. No retry. No backoff. No circuit breaker.

Here is what should happen:

**For chat API failures:**
1. First attempt fails -> Wait 1 second, retry once (network hiccup)
2. Second attempt fails -> Wait 3 seconds, retry with simplified prompt (reduce token count)
3. Third attempt fails -> Show degraded mode: "I'm having connection issues. Here are some suggested workflows based on your history." (Use cached suggestions)
4. If user retries manually -> Reset retry counter, try again

**For workflow execution failures:**
1. Transient error (timeout, rate limit) -> Auto-retry with exponential backoff (1s, 2s, 4s)
2. Auth error (token expired) -> Auto-trigger OAuth refresh, retry
3. Parameter error (missing input) -> Pause workflow, collect missing parameter, resume
4. Tool not found -> Use fallback tool mapping (FIX-020), retry with alternative
5. Service unavailable -> Circuit breaker opens, show ETA for retry, auto-retry when circuit closes

**Agent 4:** The `retry-helper.ts` in `src/lib/` already implements exponential backoff. Let me read the relevant signature: it provides configurable max retries, base delay, max delay, and jitter. The function exists. It just needs to be called from `NexusAIService.chat()`.

The implementation is roughly:

```typescript
// In NexusAIService.chat()
const response = await retryWithBackoff(
  () => fetch('/api/chat', { ... }),
  { maxRetries: 2, baseDelay: 1000, maxDelay: 5000 }
);
```

That is a 5-line change to go from "zero retry" to "intelligent retry with backoff" for the most critical user-facing function.

**Agent 8:** For workflow execution, I want to highlight a subtlety: **step-level retry vs workflow-level retry.** If step 3 of 5 fails, we should retry step 3, not restart from step 1. The current sequential execution does not support step-level retry because there is no checkpoint state. We need a step execution state machine: `pending -> executing -> retrying -> succeeded | failed | skipped`.

**Agent 3:** The `IntegrationSelfHealingService` already has this concept as `SelfHealingSession` with `HealingAttempt` tracking. The session tracks which step failed, how many retries, and what strategies were tried. Wiring this into WorkflowPreviewCard's execution loop would give us step-level retry with full observability.

**Moderator:** **Consensus Point 4 -- Retry strategy: 3-attempt backoff for chat API (1s, 3s, degraded mode), step-level retry for workflow execution with state machine (pending/executing/retrying/succeeded/failed/skipped). Add the existing `retryWithBackoff` helper to `NexusAIService.chat()` (5-line change). Wire `IntegrationSelfHealingService` sessions into workflow execution for step-level retry.**

---

## 6. Circuit Breaker Pattern

**Agent 4:** The circuit breaker pattern prevents cascading failures when an external service is down. If Composio is experiencing an outage, continuing to send requests just increases latency and fills error logs. The circuit breaker "opens" after N failures, rejecting all requests immediately for a cooldown period, then "half-opens" to test if the service has recovered.

`IntegrationSelfHealingService` implements this with `CircuitBreaker` objects per tool. The implementation tracks: state (closed/half-open/open), failure count, last failure timestamp, and cooldown duration. The `DEFAULT_CIRCUIT_BREAKER_CONFIG` is imported from `types/tools.ts`.

But -- and this is the recurring theme -- it is not wired into the execution path. Let me describe the ideal circuit breaker deployment:

**Per-service circuit breakers:**
| Service | Failure Threshold | Cooldown | Half-Open Test |
|---------|-------------------|----------|----------------|
| Claude API | 3 failures in 60s | 30 seconds | Single test request |
| Composio | 5 failures in 120s | 60 seconds | Health check endpoint |
| Supabase | 3 failures in 30s | 15 seconds | Simple SELECT query |
| WhatsApp API | 3 failures in 60s | 30 seconds | Ping message |
| Tap (payments) | 2 failures in 60s | 120 seconds | Status endpoint |

**User experience when circuit is open:**
- Chat: "Our AI is taking a quick break. It will be back in about 30 seconds. Meanwhile, check out these popular workflows." [Show cached suggestions]
- Workflow execution: "This service is temporarily unavailable. I've queued your workflow to run automatically when it's back. Expected: ~1 minute."
- Payments: "Payment processing is temporarily unavailable. Your subscription is safe -- we'll retry automatically."

**Agent 9:** The circuit breaker must be shared across serverless function instances. In Vercel's architecture, each function invocation is isolated. If function instance A sees 3 failures, function instance B does not know about them. This is where the Upstash Redis from Cycle 9's caching discussion becomes critical -- circuit breaker state must be stored in Redis, not in-memory.

**Agent 3:** Redis-backed circuit breakers are a well-established pattern. The implementation is: `INCR composio:failures` on each failure (with TTL matching the window), `GET composio:failures` before each request. If the count exceeds the threshold, skip the request and return cached/degraded data. When the cooldown expires, the TTL auto-deletes the failure counter.

**Moderator:** **Consensus Point 5 -- Circuit breakers should be deployed per external service with Redis-backed state (shared across serverless instances). Threshold tuning: Claude 3/60s, Composio 5/120s, Supabase 3/30s. Open circuit triggers degraded mode with user-friendly messaging and automatic recovery when the circuit half-opens. This requires the Upstash Redis integration from Cycle 9.**

---

## 7. Offline Mode Design

**Agent 6:** Offline mode is not just "no internet" -- it is "degraded connectivity." Construction sites in Kuwait, rural areas, or even downtown Kuwait City during peak hours can have spotty connectivity. The system needs to handle: (a) complete offline, (b) slow connection (1-3s per request), (c) intermittent drops (works for 30s, drops for 10s, comes back).

**What works offline (with Service Worker):**
- View existing workflows (cached in IndexedDB/localStorage)
- View conversation history (cached locally)
- Browse templates (pre-cached during online session)
- Edit workflow parameters (changes queued for sync)
- View dashboard with cached stats
- Prayer time calculations (fully offline via `adhan`)

**What queues for sync:**
- New chat messages (queued, sent when online)
- Workflow modifications (saved locally, synced when online)
- Parameter changes (saved locally, synced when online)
- New integrations (intent saved, OAuth happens when online)

**What requires connectivity:**
- AI chat responses (Claude API required)
- Workflow execution (Composio API required)
- OAuth flows (external service required)
- Real-time collaboration (WebSocket required)

**Agent 10:** The Service Worker registration already exists -- Vite's PWA plugin supports it. We need: (a) a `sync` event handler that processes the queue when connectivity returns, (b) an `offline` page that shows cached content with the gray dot indicator, (c) IndexedDB for the offline queue (localStorage is too small for queued messages with potential media attachments).

**Agent 3:** For the chat specifically, I propose an "offline AI" mode that uses no API calls at all. When offline, the chat responds with:
- Template-based suggestions based on the user's WorkflowDNA (from Cycle 8)
- Previously generated workflow specs (from IndexedDB cache)
- Pre-cached answers to the 50 most common questions
- A note: "I'm working from memory right now. Full AI returns when you're back online."

This is not pretending to be smart offline. It is honest about limitations while still providing value.

**Agent 7:** Prayer time notifications should work completely offline. They are computed locally, do not require network, and are perhaps the most time-sensitive feature for Kuwait users. If the network is down during a meeting but prayer time approaches, the notification must still fire. This is a perfect test case for offline resilience.

**Moderator:** **Consensus Point 6 -- Offline mode provides read access to cached data, queues writes for sync, and offers template-based suggestions without API calls. Service Worker handles the offline/online transition. Prayer times work fully offline (model for other offline-first features). "Offline AI" mode uses WorkflowDNA and cached responses to provide non-trivial offline value.**

---

## 8. The Error Budget Philosophy

**Agent 3:** I want to introduce a concept from SRE (Site Reliability Engineering): the **error budget.** Instead of targeting "zero errors" (impossible), we define an acceptable error rate and invest proportionally in reducing it.

**Proposed error budget for Nexus:**

| Metric | Target | Current (Estimated) | Gap |
|--------|--------|---------------------|-----|
| Chat availability | 99.5% | ~98% (Claude outages + our bugs) | 1.5% |
| Workflow execution success | 95% | ~60% (demo mode, parameter gaps) | 35% |
| Page load success | 99.9% | ~99% (frontend is stable) | 0.9% |
| OAuth connection success | 90% | ~70% (popup blockers, timeouts) | 20% |
| Error message quality | 100% user-friendly | ~40% (14 silent + generic) | 60% |

The biggest gap is error message quality at 60% -- meaning 60% of errors that reach the user are either silent or generic. The ErrorClassifier and error-messages.ts systems can close this gap to under 5% if consistently applied.

**Agent 9:** The workflow execution success rate at 60% is misleading because we are in demo mode. Real execution has not been tested at scale. But Agent 4's stale closure bug at line 4705 of WorkflowPreviewCard, plus the 14 silent failures, suggest that even in demo mode, there are data integrity issues affecting the experience.

**Agent 1:** I want to propose a specific metric: **"Errors Visible to User" (EVU).** This counts every instance where a user sees something unexpected: a loading spinner that never resolves, a generic error message, an empty state that should have data, or a broken workflow step. The target EVU per session should be 0. Not 0.5. Zero.

**Agent 10:** EVU = 0 is aspirational but useful as a North Star. The practical implementation is: every user session records EVU events to localStorage, and these get synced to analytics. When EVU > 0, we know exactly where and why. Over time, we drive EVU down toward zero through systematic elimination.

**Agent 5:** From a business perspective, EVU directly correlates to churn. Agent 10's progressive disclosure research showed that first-time users who encounter an error in their first session have a 70% chance of never returning. For the Kuwait market where word-of-mouth is the primary distribution channel, one bad experience can lose an entire social network of potential users.

**Moderator:** **Consensus Point 7 -- Adopt the Error Budget philosophy with EVU (Errors Visible to User) as the North Star metric. Target: EVU = 0 per session. Track via localStorage + analytics sync. The 60% error message quality gap is the biggest driver of EVU and should be closed by consistent use of ErrorClassifier + error-messages.ts. Every silent catch block is a potential EVU event.**

---

## 9. Implementation Priority: The Resilience Roadmap

**Agent 3:** Let me consolidate everything into a prioritized implementation plan:

**Phase 1: Immediate (1 day, zero architectural changes)**
1. Replace 14 silent `catch {}` blocks with `console.warn()` + graceful defaults (not error display, just logging + safe fallback)
2. Add `retryWithBackoff` to `NexusAIService.chat()` (5-line change)
3. Route the generic NexusAIService catch block through ErrorClassifier
4. Add Arabic locale to error-messages.ts catalog

**Phase 2: Quick Wins (1 week)**
5. Wire IntegrationSelfHealingService circuit breakers into workflow execution
6. Add step-level retry with state machine to workflow execution
7. Implement degradation hierarchy (Full/Degraded/Offline) visual indicators
8. Add 4 workflow-specific error types (step timeout, partial success, rate limit, degradation)

**Phase 3: Infrastructure (2-3 weeks)**
9. Upstash Redis for shared circuit breaker state
10. Service Worker for offline mode
11. Background sync queue for offline actions
12. "Offline AI" using WorkflowDNA and cached responses
13. EVU tracking analytics

**Phase 4: Polish (ongoing)**
14. A/B test error messages for conversion impact
15. Federated error pattern learning (anonymized error patterns across users improve detection)
16. Predictive error prevention (detect conditions that usually lead to errors and preemptively address them)

**Agent 4:** Phase 1 is the critical path. Those 14 silent failures are the biggest risk. Not because the errors are catastrophic -- they are in data loading functions that have fallback defaults. But because when they fire silently, we have zero observability. We cannot fix what we cannot see. Even adding `console.warn()` (not `console.error()`, which would alarm developers) gives us visibility.

**Agent 9:** I want to add to Phase 1: add a global `window.onerror` and `window.onunhandledrejection` handler that routes to the error logging service (which is already prepared for Sentry integration). This catches any error that escapes the local catch blocks.

**Moderator:** **Consensus Point 8 -- Four-phase resilience roadmap. Phase 1 (1 day) addresses 14 silent failures and adds retry to chat API. Phase 2 (1 week) wires circuit breakers and adds step-level retry. Phase 3 (2-3 weeks) adds Redis, Service Worker, and offline mode. Phase 4 (ongoing) adds analytics and predictive prevention. Phase 1 should be executed immediately as it is the highest ROI change in the entire investigation.**

---

## 10. Updated Top 10 Resilience Improvements

| Rank | Improvement | Effort | Impact | Notes |
|------|-------------|--------|--------|-------|
| 1 | **Replace 14 silent catch blocks** | 30 minutes | CRITICAL | Observability prerequisite for everything else |
| 2 | **Add retryWithBackoff to NexusAIService.chat()** | 5 lines of code | HIGH | Most common user-facing error path |
| 3 | **Route errors through ErrorClassifier** | 1-2 hours | HIGH | Transforms generic messages into actionable guidance |
| 4 | **Add Arabic to error-messages.ts** | 2-3 hours | HIGH | Kuwait market requirement |
| 5 | **Wire circuit breakers into execution** | 1-2 days | HIGH | Prevents cascading failures |
| 6 | **Step-level retry state machine** | 2-3 days | MEDIUM-HIGH | Enables partial workflow recovery |
| 7 | **Degradation hierarchy UI** | 1-2 days | MEDIUM-HIGH | Transparent capability reduction |
| 8 | **Upstash Redis circuit breaker state** | 1-2 days | MEDIUM | Shared state across serverless |
| 9 | **Service Worker offline mode** | 1 week | MEDIUM | Construction site / spotty connectivity |
| 10 | **EVU analytics tracking** | 2-3 days | MEDIUM | Systematic error elimination over time |

---

## 11. Questions for Cycle 12

**Agent 1:** How do we test resilience? Can we build a "chaos monkey" that randomly kills connections, returns errors, and simulates outages to verify our degradation works?

**Agent 2:** What error patterns do Composio users typically see? Can we pre-populate the ErrorClassifier with Composio-specific patterns before we go live?

**Agent 3:** How does the retry logic interact with Vercel's 10-second function timeout on Hobby plan? If a retry adds 4 seconds, the entire function might timeout.

**Agent 4:** Can we extract the error handling from WorkflowPreviewCard into a dedicated `useWorkflowResilience` hook? This would centralize all retry/circuit-breaker/fallback logic.

**Agent 5:** What is the user perception of "partial success"? If 4 of 5 steps succeed, do users see that as 80% success or as failure? How should we frame it?

**Agent 6:** How does IndexedDB handle write failures during degraded storage scenarios? Can we implement a write-ahead log pattern for critical data?

**Agent 7:** For prayer time notifications in offline mode, should we use the Notification API (works even when tab is backgrounded) or just in-app notifications?

**Agent 8:** Can the ParamResolutionPipeline provide cached parameter suggestions when the resolution API is unavailable? "Last time you used channel #sales for this type of workflow."

**Agent 9:** What is the MTTR (Mean Time To Recovery) target? If Composio goes down for 5 minutes, how fast should Nexus recover after it comes back? Should it retry queued workflows immediately or gradually?

**Agent 10:** How do we communicate extended outages? A status page? In-app banner? Push notification? What is the communication SLA?

---

## Closing Statement

**Moderator:** Boardroom Discussion #11 has produced the most actionable findings of the entire investigation. The central insight: **Nexus already has world-class error handling infrastructure that is not consistently used.** ErrorClassifier has 13 error categories with recovery actions. Error-messages.ts has 15 error types in 8 languages. IntegrationSelfHealingService has circuit breakers, retry strategies, and healing sessions. All of this infrastructure is built, tested, and sitting idle while 14 catch blocks silently swallow errors.

The eight consensus points:

1. **World-class error infrastructure exists** but is inconsistently applied (14 silent failures).
2. **Three degradation modes** (Full/Degraded/Offline) with subtle visual indicators.
3. **Grandmother test** for all error messages; Arabic locale missing and must be added.
4. **Retry strategy**: 3-attempt backoff for chat (5-line change), step-level retry for workflows.
5. **Circuit breakers** per service with Redis-backed state.
6. **Offline mode**: cached data, queued writes, template-based suggestions.
7. **EVU = 0** as the North Star metric for user-visible errors.
8. **Four-phase roadmap**: Phase 1 (1 day) is the highest-ROI change in the investigation.

The overarching theme mirrors the investigation's recurring discovery: **The infrastructure exists. The wiring is missing.** Phase 1 of the resilience roadmap -- replacing 14 silent catches, adding retry to chat, and routing errors through ErrorClassifier -- represents perhaps 2-3 hours of work that transforms the entire error experience. This is the single highest-ROI implementation task identified across all 11 cycles.

Cycle 12 begins now.

---

*End of Boardroom Discussion #11*
*Next Discussion: Boardroom #12 (to be determined by Cycle 12 theme)*

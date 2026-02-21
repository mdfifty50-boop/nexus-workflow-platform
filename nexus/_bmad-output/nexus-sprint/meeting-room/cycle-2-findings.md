# Cycle 2 Investigation Findings - Condensed Summary

**Date:** 2026-02-15
**Cycle:** 2 of 20
**Agents:** All 10

---

## Agent 1: Interface Contract Analysis (Intent Recognition Specialist)

### TOP 3 FINDINGS

1. **IntentResolver and WorkflowIntelligence are COMPLEMENTARY, not sequential.** Both accept raw `string` input and analyze at different abstraction levels. IntentResolver finds specific integrations + actions (30+ integrations, 7 action verb categories). WorkflowIntelligence finds workflow patterns + implicit requirements + generates clarifying questions. Neither module's output maps to the other's input. They should run in PARALLEL and be merged via a new `UnifiedIntentAnalysis` adapter.

2. **Both modules are COMPLETELY UNUSED in the live system.** Neither IntentResolver nor WorkflowIntelligence is imported by ChatContainer, NexusAIService, or chat.ts. Confirmed via codebase search. The recommended server-side insertion point is chat.ts line ~220 (after template matching). Frontend insertion: ChatContainer line ~695 (before Claude call).

3. **Confidence scale conflict: 0-0.95 vs 0-100.** IntentResolver caps confidence at 0.95 (0-1 scale). WorkflowIntelligence uses 0-100 scale. NexusAIResponse from Claude uses 0-1. ChatContainer threshold is 0.3 minimum. All need normalization in the adapter layer.

### NEW vs Cycle 1
- **NEW:** Complete interface contracts documented (input/output types for both modules)
- **NEW:** Exact insertion points with line numbers and code snippets
- **NEW:** Question format adapter needed: `ClarifyingQuestion` -> `SmartNexusQuestion` (trivial mapping)
- **NEW:** Server-side insertion requires module boundary crossing (IntentResolver is in `src/services/`, server runs from `server/`)
- **NEW:** No fix markers at risk in recommended insertion zones

### Updated Proposals
1. Insert IntentResolver in ChatContainer before Claude call (line ~695, 10 lines, low effort)
2. Insert WorkflowIntelligence for local question generation (30 lines + adapter, medium effort)
3. Create UnifiedIntentAnalysis adapter (~80 lines new file)
4. Enrich server-side Claude prompt with IntentResolver data (high effort, module boundary)

### Remaining Questions
- Should IntentResolver run client-side or server-side? Module boundary issue if server-side.
- How to handle regional context injection? WorkflowIntelligence constructor needs region string.

---

## Agent 2: FIX-063 Blast Radius & Composio Trust Migration (Tool Selection Specialist)

### TOP 3 FINDINGS

1. **FIX-063 operates at TWO critical points** -- pre-flight discovery (line 3868-3907) and execution phase (line 5467-5477). For all 47 known toolkits, it calls Composio API, DISCARDS the recommendation, and uses static TOOL_SLUGS. This results in ~2 unnecessary API calls per known toolkit node per workflow execution. Composio is effectively a "session-ID generator" for known toolkits.

2. **56 toolkits classified by risk level.** 10 SAFEST for Composio trust: sendgrid, deepgram, elevenlabs, anthropic, openai, teams, discord, airtable, linear, zoom (all simple CRUD, 2-4 action variants). 10 RISKIEST that MUST keep static: googlecalendar (the FIX-063 origin case), gmail (11 verbs), slack (11 verbs), googlesheets (FIX-022), dropbox (FIX-017), onedrive (FIX-017), notion (FIX-024), whatsapp (template vs regular), clickup (10 actions), stripe (financial).

3. **Feature flag system is UI-only -- no runtime evaluation.** The FeatureFlags.tsx component writes to localStorage under `nexus_feature_flags` but NO code reads this key. The `rolloutPercentage` field is stored but never evaluated. No `useFeatureFlag()` hook or `isFeatureEnabled()` function exists.

### NEW vs Cycle 1
- **NEW:** Full 56-toolkit risk classification (was "47 toolkits" in Cycle 1)
- **NEW:** 6-phase, 25-week migration timeline with shadow mode infrastructure design
- **NEW:** Feature flag system gap identified (UI-only, no runtime evaluation)
- **NEW:** Shadow mode analytics design with `ShadowComparison` logging
- **NEW:** Hybrid approach recommendation: Composio for discovery, static for verb disambiguation

### Updated Proposals
1. Build shadow mode infrastructure (Phase 0, Week 1-2) -- log what Composio WOULD recommend
2. Build runtime flag evaluation: `resolveToolSlugMode()` function with per-toolkit override
3. Migrate safest 10 toolkits to Composio trust at 10% rollout (Phase 2, Week 5-6)
4. Financial toolkits (Stripe) require explicit CEO approval -- NEVER auto-migrate

### Remaining Questions
- Should shadow logging go to localStorage (current proposal) or Supabase for cross-session analysis?
- How to handle the case where Composio renames a tool slug we depend on?

---

## Agent 3: Production vs Dev Path Parity (Confidence & Phase Analyst)

### TOP 3 FINDINGS

1. **Production AI personality is 35% of dev personality.** Production: ~298 lines (~8,800 chars), 0 fix markers. Dev: ~834 lines (~27,000 chars), 15+ `@NEXUS-FIX-XXX` markers. Production lacks: regional context engine, industry-aware intelligence (11 industries, 10 roles), WhatsApp response mode, parameter inference with confidence scoring, confirmation-first UX, workflow refinement mode, 5-layer intelligence, and 4-level understanding framework.

2. **65% feature gap in API surface.** Production: 12 endpoints. Dev: 34+ routes. Missing from production: WhatsApp (4 routes), payments/subscriptions (2 routes), OAuth (1 route), SSE real-time (1 route), voice (1 route), admin/analytics (2 routes), custom integrations (1 route), preflight validation (1 route). Production workflow execution returns hardcoded simulated results (mock data at lines 222-263).

3. **7 critical services missing in production.** claudeProxy.ts (3-tier AI fallback), AppDetectionService.ts (100+ app detection), TemplateService.ts (bypasses Claude for known patterns), CustomIntegrationService.ts (API key guidance), ToolDiscoveryService.ts, ComposioService.ts, WhatsAppBusinessTriggerService.ts. Production has NO rate limiting, NO AI fallback chain, NO template matching.

### NEW vs Cycle 1
- **NEW:** Complete file-by-file inventory (12 production files totaling ~2,389 lines vs 34+ dev files ~10,000+ lines)
- **NEW:** Side-by-side feature comparison table with gap severity ratings
- **NEW:** Specific porting plan with 5 phases and effort estimates
- **NEW:** Phase 1 (copy personality) estimated at 30 minutes, recovers ~60-70% intelligence gap
- **NEW:** Convergence recommendation: Vercel serverless as deployment target, port dev features into it

### Updated Proposals
1. **Immediate (30 min):** Copy full dev personality to production `api/_lib/agents.ts`
2. **Week 1:** Port userContext, chatMode, template matching, basic app detection
3. **Week 2:** Add rate limiting via Vercel Edge Middleware, AI fallback chain
4. **Week 3-4:** Port WhatsApp, payments, persistence CRUD, OAuth, admin analytics

### Remaining Questions
- Is the Express dev server being used by any deployed environment? Or purely local?
- Vercel cold starts: will template loading be fast enough in serverless?

---

## Agent 4: WorkflowPreviewCard Dependency Map (Template & Fallback Analyst)

### TOP 3 FINDINGS

1. **Complete section map of 7,083 lines.** 12 distinct sections identified: Imports (172 lines), Types (379), Constants (418), Tool Slug Engine (936 lines, 14.4% is static data tables), Parameter Engine (439), Sub-Components (1141), Param Mapping Helpers (324), Validation Engine (252), Main Component State (153), OAuth Logic (1562), Execution Engine (626), Render/JSX (1196). Contains 28 useState, 8 useRef, 12 useEffect, 10 useCallback hooks, and 60+ fix markers.

2. **~3,540 lines (50%) are ZERO-RISK extractions.** Phase 1: 2,400 lines of pure stateless functions (TOOL_SLUGS, ACTION_KEYWORDS, mapNodeToToolSlug, getDefaultParams, validateRequiredParams, mapCollectedParamsToToolParams) -> 3 utility files. Phase 2: 1,140 lines of self-contained sub-components (MiniNodeHorizontal, MiniNodeVertical, NodeTooltip, AuthPrompt, ParallelAuthPrompt, MissingInfoSection, TriggerSampleDataPrompt) -> 3 component files. No state coupling, no fix marker risk.

3. **`executeWorkflow()` is the hardest extraction: 540 lines, 15+ state variables, 8+ external services.** It reads AND writes `nodes`, `phase`, `orchestrationResults`, `triggerSampleData`, `collectedParams`. The 445-line pre-flight useEffect (lines 3757-4202) is deeply nested async logic with closure dependencies. Both are HIGH-RISK for stale closure bugs (FIX-023, FIX-094 specifically address these).

### NEW vs Cycle 1
- **NEW:** Complete function-level dependency graph (executeWorkflow calls 15 functions)
- **NEW:** State variable ownership map per proposed module
- **NEW:** Natural seam lines identified at section separators
- **NEW:** 5-phase extraction plan with risk assessment per phase
- **NEW:** Fix marker tracking requirement: all 60+ markers must be preserved with new file paths

### Updated Proposals
1. Phase 1 (Safe): Extract ~2,400 lines of static utilities to `workflow-tool-mapping.ts`, `workflow-param-resolution.ts`, `workflow-validation.ts`
2. Phase 2 (Safe): Extract ~1,140 lines of sub-components to `WorkflowNodes.tsx`, `WorkflowAuthPrompts.tsx`, `WorkflowParameterUI.tsx`
3. Phase 3 (Medium): Extract `useOAuthManager` and `useParameterCollector` hooks
4. Phase 4 (Hard): Extract `useWorkflowExecution` hook
5. Phase 5: Main component becomes ~500 line thin orchestrator

### Remaining Questions
- Should shared state use React Context or prop drilling?
- How to handle FIX_REGISTRY.json updates when files move?

---

## Agent 5: WhatsApp Commerce Opportunity (User Pain Points Researcher)

### TOP 3 FINDINGS

1. **Top 15 WhatsApp Commerce workflows ranked for Kuwait.** Tier 1 (Critical): Instagram-to-WhatsApp order pipeline (Kuwait's dominant commerce pattern), WhatsApp catalog browse-to-checkout, abandoned cart recovery (75%+ cart abandonment in MENA), KNET payment confirmation/receipt (80% of Kuwait online transactions), bilingual customer support routing. Nexus currently treats WhatsApp as a "notification channel" not a "commerce platform" -- zero commerce workflow patterns exist.

2. **KNET reconciliation is a greenfield opportunity.** KNET connects 11 member banks, handles ~80% of Kuwait's online transactions. Three-decimal KWD (fils). Reconciliation requires matching across KNET settlement reports + payment gateway (Tap/MyFatoorah/UPayments) + business accounting. No modern REST API from KNET itself. Nexus opportunity: connect to gateway APIs via Composio, auto-download settlements, match transactions, generate exception reports, push daily WhatsApp summaries, track 5% VAT.

3. **Oil & Gas is Kuwait's biggest industry with no Nexus persona.** KPC's $410B energy strategy, KOC's $800M "Big Data Galaxy" AI initiative. KNPC already automated 26 processes via IBM (reduced correspondence from 5 days to 3 hours). Nexus should target the contractor/supplier ecosystem (~2,000 businesses) rather than K-Companies directly: tender notifications, document submission tracking, invoice status, safety compliance.

### NEW vs Cycle 1
- **NEW:** 15 specific WhatsApp commerce workflows with detailed flow descriptions
- **NEW:** KNET data format documentation (Transportal ID, Payment ID, Auth code fields)
- **NEW:** Oil & Gas organizational structure (7 K-Companies mapped)
- **NEW:** Competitive landscape: 11 competitors analyzed, none offer AI-powered workflow building
- **NEW:** Revenue sizing: Kuwait TAM $336K-$3.11M/yr conservative-optimistic, GCC total $2.02M-$27.97M/yr

### Updated Proposals
1. **P0:** Add WhatsApp Commerce workflow patterns to `agents/index.ts` AI brain
2. **P0:** Build Instagram-to-WhatsApp order pipeline as first-class pattern
3. **P1:** Add KNET payment gateway integration intelligence (Tap/MyFatoorah/UPayments)
4. **P2:** Add Oil & Gas industry persona to `industry-personas.ts`

### Remaining Questions
- Are Tap/MyFatoorah/UPayments available as Composio integrations?
- Can Playwright automate KNET merchant portal (kpay.com.kw) for settlement downloads?

---

## Agent 6: Conversation Memory Architecture (Conversation Memory Analyst)

### TOP 3 FINDINGS

1. **Complete 3-tier memory architecture mapped.** Tier 1 (Ephemeral): NexusAIService 10-message window, lost on refresh. Tier 2 (localStorage): ChatPersistenceService dual-write, UserMemoryService reads 7 sources. Tier 3 (Supabase): chat_conversations, chat_messages, user_business_profiles tables. Power users will hit localStorage ceiling (~5MB) within 3-6 months of daily use (100+ sessions = ~750KB chat + workflows + executions approaching 2-3MB).

2. **`extractFromMessage()` is dead code that enables free entity memory.** In UserContextService.ts (lines 232-274), fully implemented regex extraction for emails, channels, person names, temporal references. NEVER called from anywhere. One line activates it: `userContextService.extractFromMessage(userMessage)` in ChatContainer's send handler. Zero cost, immediate cross-conversation entity accumulation.

3. **Semantic compression algorithm proposed for the 10-message window.** Progressive compression: keep last 5 exchanges raw, compress older messages into ~200-token summary preserving: original intent, key decisions, entities, workflow specs discussed. Two options: Rule-based (free, immediate) using regex extraction, or AI-powered using Haiku model (~$0.001 per compression). Rolling compression schedule keeps summary under ~500 tokens even for 50+ message conversations.

### NEW vs Cycle 1
- **NEW:** Data size analysis: 50 messages with workflow specs = ~31.2 KB (well within localStorage)
- **NEW:** IndexedDB is prepared-for but NOT implemented (StorageManager has 'indexeddb' type but only implements local/session/memory)
- **NEW:** Dual-write pattern flaws: full session re-upload per message, no real-time sync, no conflict resolution beyond timestamps
- **NEW:** Cross-device sync architecture with Supabase Realtime for message-level sync
- **NEW:** Kuwait/GCC privacy concerns: CITRA Tier 3/4 data must stay in Kuwait, no right-to-erasure endpoint exists

### Updated Proposals
1. **Phase 1 (Immediate):** Activate `extractFromMessage()` -- one line of code
2. **Phase 2 (1-2 days):** Implement semantic compression in NexusAIService
3. **Phase 3 (3-5 days):** Migrate heavy data to IndexedDB, localStorage for UI state only
4. **Phase 4 (3-5 days):** Real-time cross-device sync via Supabase Realtime

### Remaining Questions
- Arabic text in semantic compression: need Arabic name regex (`/[\u0600-\u06FF]+\s[\u0600-\u06FF]+/g`)
- CITRA compliance: does Supabase project need to be in Bahrain (me-south-1)?

---

## Agent 7: Regional Intelligence (Islamic Calendar, Streaming, Prayer Times)

### TOP 3 FINDINGS

1. **Islamic calendar approximation is ~28 days wrong for 2026.** `getApproximateIslamicHolidayDates()` in `gcc-context.ts` uses linear approximation (shift -11 days/year from 2024 base). Actual Ramadan 2026 starts ~February 18-19; code would calculate ~March 19. The code tracks Eid al-Fitr dates, NOT Ramadan start. No `isRamadan()` function exists despite `isGCCBusinessHours()` accepting an `isRamadan` boolean parameter. For a Kuwait product, getting Ramadan dates wrong by a month is equivalent to getting Christmas wrong by a month.

2. **ZERO streaming support in production OR dev.** Production `api/chat.ts` uses synchronous `client.messages.create()` (awaits full response). Dev `server/routes/chat.ts` same. Users wait 10-30+ seconds for complex workflow generation. SSE infrastructure EXISTS but only for workflow execution progress, not chat. Vercel now supports streaming (Fluid Compute, up to 800s on Pro). Anthropic SDK has native `.stream()` method. Estimated effort: 12-18 hours total across all components.

3. **Prayer time integration is P1 for GCC market credibility.** Aladhan API (free, no auth, RESTful JSON) provides: prayer times by city, Hijri conversion, Ramadan calendar. Scheduling a meeting at 12:30 PM during Dhuhr prayer in Kuwait is a cultural faux pas. WhatsApp messages during prayer time have 40-60% lower open rates. Integration would provide: `isPrayerTime()`, `getNextAvailableSlot()`, Ramadan work-hours auto-detection (09:00-14:00 in Kuwait).

### NEW vs Cycle 1
- **NEW:** Quantified error: 28 days off for 2026, 29 days for 2028 (compounding)
- **NEW:** Library comparison: `@tabby_ai/hijri-converter` recommended (no moment dependency)
- **NEW:** Streaming compatibility verified: Vercel supports it, Anthropic SDK has `.stream()`
- **NEW:** The JSON workflow problem: streaming raw JSON means client can't parse until complete (solution: two-phase streaming)
- **NEW:** Prayer time API evaluation: Aladhan recommended (free, no auth, Umm al-Qura method)

### Updated Proposals
1. **Immediate:** Replace linear approximation with Umm al-Qura lookup table or Aladhan API
2. **Sprint 1:** Add `PrayerTimeService` using Aladhan API with 24h cache
3. **Sprint 1:** Add SSE streaming to both production and dev chat paths
4. **Sprint 2:** Ramadan mode auto-detection + business hours adjustment

### Remaining Questions
- Two-phase streaming: stream `message` text first, then send complete `workflowSpec` as final event?
- Aladhan API reliability: need local cache/fallback for offline scenarios?

---

## Agent 8: ParamResolutionPipeline Wiring Plan (Execution Pipeline Analyst)

### TOP 3 FINDINGS

1. **ParamResolutionPipeline has 8 public methods, all UNUSED.** Main entry: `resolve(contract, sources)` executes 4-step pipeline: getNeededParams, findParamValues, resolveIds, validate. Returns `{ params, resolutionSteps, isComplete, missingRequired, warnings }`. The `resolveIds()` method is a STUB (console.log only) for 6 services: Slack channels, Google Sheets, Notion pages, GitHub repos, Trello boards, Discord channels.

2. **Triple PARAM_ALIASES drift is causing inconsistencies.** Three separate copies: WorkflowPreviewCard (FIX-103, 15 keys, 80+ aliases), PreFlightService (FIX-050, 11 keys, ~50 aliases), ParamResolutionPipeline (14 entries mapped to 6 resolvers). Key drift: WorkflowPreviewCard has phone/path aliases from FIX-109 that PreFlightService lacks. PreFlightService has `channel_id` as separate canonical key while WPC has it as alias of `channel`. This means same workflow can pass pre-flight but fail execution.

3. **The wiring requires removing `_` prefix from 2 existing functions.** `_resolveParamsWithPipeline` (line 3223) and `_getEnhancedMissingParams` (line 3275) already exist with full defensive fallback logic. They are prefixed with `_` and have `eslint-disable @typescript-eslint/no-unused-vars`. The import of ParamResolutionPipeline is already present (line 45). Wiring = remove prefix + replace 18 lines in executeWorkflow (lines 5530-5548).

### NEW vs Cycle 1
- **NEW:** Complete API documentation for all 8 public methods with signatures
- **NEW:** 6 ID resolver definitions documented with search tools (all stubs)
- **NEW:** 8 transform functions documented (email, channel_name, spreadsheet_url, json, csv, number, boolean, date)
- **NEW:** 29-test plan covering unit, integration, E2E, and regression
- **NEW:** PARAM_ALIASES drift quantified per alias group per file

### Updated Proposals
1. **Phase A (30 min):** Remove `_` prefix, replace 18 lines in executeWorkflow
2. **Phase B (30 min):** Replace missing param detection with pipeline's missingRequired
3. **Phase C (4 hours):** Implement resolveIds with real Rube MCP calls
4. **Phase D (2 hours):** Consolidate PARAM_ALIASES into single `CanonicalAliases.ts`

### Remaining Questions
- ToolContract coverage: UnifiedToolRegistry has ~30 toolkits, TOOL_SLUGS has ~60. Gap of ~30 toolkits will always fallback to legacy.
- Should resolveIds have per-call timeout? Proposed: 5 seconds.

---

## Agent 9: Telemetry, Security & Feature Flags (Error Recovery Specialist)

### TOP 3 FINDINGS

1. **ZERO prompt injection protection.** Search for "prompt injection" and "jailbreak" returned zero results across entire codebase. User input goes directly into Claude API calls with no filtering, no boundary markers, no input validation. A malicious user could instruct AI to execute unintended workflows, access integration data, or leak system prompt details. This is the single highest-risk vulnerability.

2. **Only 1 of 25+ server routes has rate limiting.** Chat endpoint has 20 req/min production, 100/min dev via `express-rate-limit`. CORS is wide open (`cors()` with no origin restriction). No Helmet middleware. No server-side input validation middleware. Composio proxy, Rube proxy, admin, suggestions, WhatsApp -- all unprotected. Client-side rate limiting in `rate-limiter.ts` is purely advisory.

3. **Kuwait data residency not addressed.** CITRA classifies data into 4 tiers; Tier 3/4 data MUST remain in Kuwait. User workflow data, personal business info, and AI conversation history could be Tier 3 (private sensitive). Supabase project location unknown. No right-to-erasure endpoint (`factoryReset()` clears client but not Supabase). DPPR Decision No. 26 of 2024 penalties up to 1 million KWD per violation.

### NEW vs Cycle 1
- **NEW:** Full security attack surface assessment (12 vectors evaluated)
- **NEW:** Kuwait DPPR compliance requirements documented with legal citations
- **NEW:** CITRA cloud computing data classification framework analyzed
- **NEW:** Analytics system audit: 80+ events, 6 conversion funnels, but routes to console/Supabase only
- **NEW:** Proposed Supabase-backed feature flag system with deterministic hashing for percentage rollout

### Updated Proposals
1. **P0 Immediate:** Add prompt injection filtering before all Claude API calls
2. **P0 Immediate:** Add rate limiting to all server routes, restrict CORS, add Helmet
3. **P1 Sprint 1:** Add server-side request validation with Zod, auth middleware on server routes
4. **P2:** Build Supabase-backed feature flag system with `useFeatureFlag()` hook

### Remaining Questions
- What prompt injection patterns should be filtered? (e.g., "Ignore previous instructions", "System: ", role impersonation)
- Should Supabase project be migrated to Bahrain (me-south-1) region for CITRA compliance?

---

## Agent 10: Onboarding & UX (UX & Frontend Specialist)

### TOP 3 FINDINGS

1. **7-step onboarding wizard takes ~8 minutes before ANY value.** Step 5 "First Workflow" simulates creation with `setTimeout(2000)` -- the workflow is NOT real. Integration connections in Step 3 are simulated with `setTimeout(1500)` -- nothing actually connects. After all 7 steps, users land on empty dashboard with zero workflows, zero executions, zero time saved. The "magic moment" (first real executed workflow) does NOT exist in onboarding.

2. **"Lightning Onboarding" proposed: one question to first workflow in 90 seconds.** Replace 7-step wizard with: (1) Ask "What do you want to automate?" with suggestion chips, (2) AI generates visual workflow preview immediately, (3) REAL OAuth connections (not simulated), (4) LIVE test execution with real-time progress, (5) Celebration + expansion suggestions. Key principle: show, don't collect. Infer business profile from which apps they connect, not from a form.

3. **Comparison with ChatGPT/Cursor/Linear/Zapier reveals critical gaps.** ChatGPT: 0 steps to first value. Cursor: 3 screens. Linear: 2 screens. Zapier: ~5 min with real test execution. Nexus: 7 steps, ~8 min, simulated. Progressive disclosure absent (Cursor has tab completion, Linear has Cmd+K, Notion has / menu). No keyboard shortcuts. No command palette. Skip path is a dead end (dumps to empty dashboard).

### NEW vs Cycle 1
- **NEW:** Complete step-by-step onboarding flow map with timings and validations
- **NEW:** 7 specific UX gaps identified with evidence (line numbers, code snippets)
- **NEW:** 3-level progressive disclosure system designed (beginner/intermediate/power-user)
- **NEW:** Full keyboard shortcut proposal (global, chat, editor, command palette)
- **NEW:** 13 UX improvements ranked by impact tier with effort estimates

### Updated Proposals
1. **TIER 1 Critical:** Replace simulated workflow with real execution during onboarding
2. **TIER 1 Critical:** Implement Lightning Onboarding (one question -> first workflow)
3. **TIER 1 Critical:** Carry onboarding context into first chat session (pre-populated greeting)
4. **TIER 2 High:** Implement Cmd+K command palette, progressive disclosure, improve skip path

### Remaining Questions
- Which "safe demo workflow" for onboarding? ("Send yourself a test email" or "Post a test Slack message")
- How to handle users who don't have Gmail/Slack accounts for the demo workflow?

---

## CROSS-CUTTING FINDINGS (CYCLE 2)

### Theme 1: The Production Gap Is Worse Than Expected
Agent 3's definitive analysis reveals production operates at ~30-35% feature coverage with a 3x shorter AI personality missing ALL 15 fix markers. This is not a minor divergence -- production users get a fundamentally inferior product.

### Theme 2: Module Wiring Is Now Understood at Interface Level
Agent 1 documented exact interface contracts and insertion points. Agent 8 documented exact ParamResolutionPipeline API. The wiring plan is no longer theoretical -- it has line numbers, code snippets, and risk assessments.

### Theme 3: Security Is a Pre-Launch Blocker
Agent 9's findings (zero prompt injection defense, 24/25 routes unprotected, CORS wide open) make public launch premature. These are not enhancements -- they are minimum security requirements.

### Theme 4: Kuwait Market Features Need Domain Knowledge
Agent 5's WhatsApp Commerce research and Agent 7's Islamic calendar/prayer time analysis reveal that "Kuwait-native intelligence" is currently superficial. Getting Ramadan dates wrong by a month destroys credibility instantly.

### Theme 5: The WorkflowPreviewCard Refactor Has a Safe Starting Point
Agent 4's dependency map shows 50% of the file (3,540 lines) can be extracted with ZERO risk. This is no longer a scary "refactor the monolith" task -- it is a series of safe extractions followed by increasingly careful hook extractions.

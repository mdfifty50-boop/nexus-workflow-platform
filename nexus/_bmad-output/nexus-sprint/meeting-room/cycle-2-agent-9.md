# Cycle 2 - Agent 9: Telemetry Architecture, Security Hardening & Feature Flags

**Investigation Date:** 2026-02-15
**Agent Role:** Error Recovery Specialist
**Scope:** Telemetry infrastructure, security posture assessment, feature flag system

---

## PART A: TELEMETRY ARCHITECTURE

### A.1 Current State: Error Tracking (Sentry)

**Finding: Sentry is NOT configured. Only a stub exists.**

The file `nexus/src/lib/error-logger.ts` contains a comprehensive client-side error logging utility that was designed with Sentry integration in mind. However, Sentry is never actually initialized. The critical line at line 112 reads:

```typescript
// TODO: When Sentry is configured, send error here
// Sentry.captureException(errorObj, { extra: context, level: severity })
```

There is no `@sentry/browser` or `@sentry/react` package in `package.json`. The error logger currently:
- Stores errors in an in-memory queue (max 50 entries)
- Persists last 20 errors to `localStorage`
- Captures global `window.error` and `unhandledrejection` events
- Has severity classification (low, medium, high, critical)
- Captures error context (component, action, userId, workflowId)
- Generates unique error IDs and session correlation IDs

**Verdict:** The error-logger skeleton is good architecture, but errors are invisible in production since they only exist in the user's browser localStorage. No server-side error aggregation exists.

### A.2 Current State: Analytics System

**Finding: A sophisticated, privacy-first analytics system exists but sends data nowhere useful in production.**

The analytics system lives in `nexus/src/lib/analytics/` and comprises three files:

1. **`analytics.ts`** (965 lines) - Full Analytics class with:
   - SHA-256 hashed user IDs (no PII stored)
   - Session tracking with 30-minute timeout
   - Batch event processing (queue of 10, flush every 5 seconds)
   - GDPR compliance helpers (consent, opt-out, data export, data deletion)
   - Do Not Track respect
   - PII auto-redaction from event properties (email, password, token, secret, apiKey, etc.)
   - UTM parameter capture
   - Provider support for: Supabase, Mixpanel, Amplitude, PostHog, custom, console
   - `sendBeacon` for reliable unload-time delivery

2. **`events.ts`** (506 lines) - Comprehensive event taxonomy with:
   - **9 event categories**: user, workflow, template, integration, subscription, onboarding, engagement, error, performance
   - **80+ defined events** including workflow_created, workflow_executed, workflow_execution_failed, integration_connected, etc.
   - **6 conversion funnels**: signup-to-first-workflow, onboarding-completion, free-to-paid, workflow-creation, template-to-workflow, integration-setup
   - **Web Vitals**: LCP, FID, CLS tracking support

3. **`hooks.ts`** - React hooks for analytics integration

**Critical Gap:** The auto-initialization on line 892-895 defaults to `'supabase'` if Supabase is configured, or `'console'` otherwise. In production, analytics events go to Supabase's `analytics_events` table IF the table exists. No Mixpanel, PostHog, or Amplitude SDKs are installed.

### A.3 Current State: Monitoring & Metrics

The `nexus/src/lib/monitoring/metrics.ts` file implements a client-side metrics collector with:
- Counter, gauge, histogram, and timer metric types
- Label-based metric dimensions
- Histogram bucketing for latency distributions
- Workflow execution duration and success rate tracking
- Step-level timing
- Token usage and cost tracking

**Gap:** No Prometheus/Grafana/Datadog exporter exists. Metrics stay in browser memory.

### A.4 Proposed Event Taxonomy for Nexus

The existing event taxonomy in `events.ts` is already quite strong. However, it is missing several events critical to the Nexus AI workflow platform:

| Missing Event Category | Events to Add |
|------------------------|---------------|
| **AI Intent Recognition** | `ai_intent_recognized`, `ai_intent_ambiguous`, `ai_intent_fallback`, `ai_confidence_low` |
| **Tool Slug Resolution** | `tool_slug_resolved`, `tool_slug_fallback_used`, `tool_slug_not_found`, `tool_slug_validation_failed` |
| **Composio Execution** | `composio_tool_executed`, `composio_tool_failed`, `composio_connection_initiated`, `composio_connection_timeout` |
| **Chat Intelligence** | `chat_message_sent`, `chat_workflow_generated`, `chat_think_mode_activated`, `chat_clarification_asked` |
| **Parameter Collection** | `param_collection_started`, `param_auto_resolved`, `param_user_provided`, `param_collection_abandoned` |
| **Regional Context** | `regional_context_applied`, `arabic_dialect_detected`, `kuwait_business_hours_adjusted` |
| **WhatsApp Integration** | `whatsapp_session_created`, `whatsapp_message_received`, `whatsapp_workflow_triggered` |

The current event set covers 80+ events across 9 categories. Adding the above would bring it to approximately 110 events with full coverage of Nexus's unique AI+workflow execution pipeline.

### A.5 Kuwait/GCC Data Privacy Requirements

**Research findings from web search:**

**Kuwait Data Privacy Protection Regulation (DPPR) - Decision No. 26 of 2024:**
- Replaces Decision No. 42 of 2021
- Currently scoped to telecom sector licensees and service providers, but expected to expand
- Requires explicit consent before processing personal data
- Grants data subjects rights to: access, correction, deletion, knowledge of processing
- Penalties up to 1 million KWD per violation

**CITRA Data Classification & Localization:**
- CITRA classifies data into 4 tiers (public, private insensitive, private sensitive, highly sensitive)
- **Tier 3 and Tier 4 data MUST remain in Kuwait** - cannot be hosted or stored outside the country
- Cloud service providers hosting sensitive data must operate data centers physically within Kuwait
- This has direct implications for Nexus: user workflow data, personal business information, and AI conversation history could be classified as Tier 3 (private sensitive)

**Key compliance obligations for Nexus:**
1. Personal data collected from Kuwaiti users must be handled per DPPR consent requirements
2. Sensitive business data may need to stay in-country (Tier 3/4 classification)
3. Data subjects must be able to exercise right to access, correction, and deletion
4. Cross-border data transfer restrictions apply to sensitive data categories

Sources:
- [DLA Piper - Data Protection Laws Kuwait](https://www.dlapiperdataprotection.com/?t=law&c=KW)
- [Chambers Data Protection & Privacy 2025 Kuwait](https://practiceguides.chambers.com/practice-guides/data-protection-privacy-2025/kuwait)
- [CITRA Cloud Computing Regulatory Framework](https://www.citra.gov.kw/sites/en/LegalReferences/Cloud_computing_regulatory_framework.pdf)
- [Al Tamimi - Cloud Computing & Data Classification in Kuwait](https://www.tamimi.com/law-update-articles/cloud-computing-data-classification-in-the-state-of-kuwait/)
- [InCountry - Kuwait Data Protection Compliance](https://incountry.com/blog/how-to-comply-with-kuwait-data-protection-laws/)

### A.6 Recommendation: Self-Hosted vs Cloud Telemetry

**Recommendation: Self-hosted telemetry with regional deployment option.**

| Factor | Self-Hosted | Cloud (PostHog/Mixpanel) | Verdict |
|--------|-------------|--------------------------|---------|
| Data Residency | Full control, deploy to Kuwait/GCC | Data leaves Kuwait (EU/US servers) | Self-hosted wins |
| CITRA Compliance | Can place data center in Kuwait | Would need enterprise tier for data residency | Self-hosted wins |
| Cost (early stage) | Infrastructure overhead | Free tiers available | Cloud wins initially |
| Setup Complexity | Higher | Lower | Cloud wins |
| Feature Richness | Depends on tool | Very rich | Cloud wins |
| Long-term Cost | Scales better | Gets expensive at volume | Self-hosted wins |

**Phased Approach:**

1. **Phase 1 (Now):** Use the existing Supabase analytics integration. Supabase already has a Middle East region (Bahrain). Store analytics in the `analytics_events` table. This satisfies basic telemetry with zero additional cost.

2. **Phase 2 (1000+ users):** Deploy self-hosted PostHog (open-source) on a Kuwait or Bahrain-region cloud instance. PostHog provides: event tracking, session replay, feature flags, A/B testing, and funnels -- all self-hosted. This achieves CITRA Tier 3 compliance.

3. **Phase 3 (10K+ users):** Evaluate PostHog Cloud EU or dedicated deployment, or Plausible Analytics for marketing metrics. Consider Sentry self-hosted for error tracking alongside PostHog.

**For Sentry specifically:**
- Phase 1: Use the existing error-logger.ts stub + Supabase error table
- Phase 2: Deploy self-hosted Sentry (available as Docker compose) in the same regional infra

---

## PART B: SECURITY HARDENING

### B.1 Input Sanitization Assessment

**Finding: Good client-side sanitization exists. Server-side is minimal.**

The file `nexus/src/lib/sanitize.ts` (388 lines) provides:

| Function | Protection | Quality |
|----------|-----------|---------|
| `stripHtml()` | XSS via HTML tags, script tags, event handlers | Good |
| `escapeHtml()` | XSS via special characters | Good |
| `sanitizeString()` | XSS via javascript:, data:, expression(), vbscript: | Good |
| `sanitizeEmail()` | Email injection | Good |
| `sanitizeUrl()` | Protocol-based attacks (only allows http, https, mailto) | Good |
| `sanitizeFilename()` | Path traversal (../, backslash) | Good |
| `sanitizeSearchQuery()` | SQL injection patterns (defense in depth) | Moderate |
| `sanitizeId()` | ID injection (alphanumeric + hyphen + underscore only) | Good |
| `sanitizeJson()` | JSON parsing with optional validator | Good |
| `sanitizeObject()` | Recursive object sanitization | Good |
| `sanitizeFormData()` | Schema-based form validation | Good |

Additionally, `nexus/src/lib/safe-expression-evaluator.ts` replaces `eval()`/`new Function()` with a whitelist-based expression parser. It blocks: `eval`, `Function`, `constructor`, `prototype`, `__proto__`, `window`, `document`, `global`, `process`, `import`, `require`. This is excellent defense against RCE in workflow expression evaluation.

**DOMPurify** is installed in `package.json` and used in `SmartAIChatbot.tsx` for rendering AI-generated HTML.

**Gap: Server-side input validation.** The Express server (`server/index.ts`) uses `express.json({ limit: '10mb' })` for body parsing but there is:
- No `helmet` middleware (only `react-helmet-async` for client-side meta tags)
- No server-side input validation middleware (e.g., express-validator, joi, zod)
- CORS is configured with `cors()` (fully open -- allows all origins)
- No request body schema validation before passing to handlers

### B.2 Rate Limiting Assessment

**Finding: Only the chat endpoint has server-side rate limiting.**

Server-side rate limiting exists ONLY on `server/routes/chat.ts`:
- 20 requests/minute in production, 100 in dev
- Uses `express-rate-limit` v8.2.1
- Key based on user ID (x-user-id, x-clerk-user-id) with IP fallback
- Returns 429 with user-friendly message
- Protected by FIX-102 marker

**Unprotected endpoints (no rate limiting):**
- `/api/workflow/*` - Workflow CRUD operations
- `/api/integrations/*` - Integration management
- `/api/composio/*` - Composio proxy (could be abused to make many API calls)
- `/api/admin/*` - Admin operations
- `/api/browser/*` - Browser automation
- `/api/rube/*` - Rube MCP proxy
- `/api/ai-proxy/*` - AI proxy endpoint
- `/api/suggestions/*` - Suggestions endpoint
- `/api/whatsapp*` - WhatsApp endpoints
- 20+ more routes

Client-side rate limiting exists in `src/lib/rate-limiter.ts` with a token bucket algorithm and pre-configured limiters for API (10 burst/2 per sec), AI (5 burst/1 per 2 sec), search (20 burst/5 per sec), and form submission (3 burst/1 per 5 sec). This is purely advisory -- an attacker bypasses it entirely.

### B.3 Prompt Injection Protection

**Finding: ZERO prompt injection protection exists.**

Search for "prompt injection" and "jailbreak" across the entire codebase returned **zero results**. The system prompt in `server/agents/index.ts` is sent directly to Claude's API. User messages are concatenated without any sanitization or prompt-boundary enforcement.

This is a critical vulnerability because:
1. User input goes directly into Claude API calls as conversation messages
2. No "system prompt jail" or boundary markers exist
3. No input filtering for common injection patterns (e.g., "Ignore previous instructions", "System: ", "\n\nHuman:", role-playing escalation)
4. The AI has access to tool execution context (Composio tool slugs, connection info)
5. A malicious user could potentially instruct the AI to execute unintended workflows, access other users' integration data, or leak system prompt details

### B.4 Current Attack Surface Assessment

| Attack Vector | Risk Level | Current Defense | Gap |
|---------------|-----------|-----------------|-----|
| **XSS (reflected/stored)** | Medium | Client-side sanitize.ts, DOMPurify, CSP headers | No server-side HTML sanitization |
| **Prompt Injection** | **CRITICAL** | None | No filtering, no boundary markers, no input validation |
| **CSRF** | Medium | SameSite cookies (if using cookies), CORS | CORS is wide open (`cors()`) |
| **API Abuse (DDoS)** | High | Chat endpoint only has rate limiting | 20+ unprotected endpoints |
| **Unauthorized Access** | Medium | Clerk auth on frontend | No auth middleware on most server routes |
| **SQL Injection** | Low | Supabase parameterized queries, client-side defense | Adequate for Supabase |
| **Path Traversal** | Low | sanitizeFilename(), no file upload endpoint found | Adequate |
| **RCE via Expression** | Low | safe-expression-evaluator.ts with whitelist | Excellent |
| **OAuth Token Theft** | Low | Tokens managed by Composio backend, not stored client-side | Good |
| **Information Disclosure** | Medium | Error logger redacts PII in analytics | Raw errors may leak in API responses |
| **Man-in-the-Middle** | Low | HSTS header, upgrade-insecure-requests CSP | Good |
| **Clickjacking** | Low | X-Frame-Options: DENY, frame-ancestors: 'none' | Good |

### B.5 Minimum Viable Security for Production

**Priority 1 - IMMEDIATE (before any public launch):**

1. **Add Helmet middleware to Express server:**
   ```typescript
   import helmet from 'helmet'
   app.use(helmet())
   ```
   This adds: X-DNS-Prefetch-Control, X-Powered-By removal, HSTS, IE no-open, X-Content-Type-Options, X-XSS-Protection.

2. **Restrict CORS:**
   ```typescript
   app.use(cors({
     origin: ['https://nexus-app.vercel.app', 'http://localhost:5173'],
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
   }))
   ```

3. **Add rate limiting to ALL API routes (not just chat):**
   Create a shared rate limiter factory. At minimum:
   - General API: 60 req/min
   - AI/Chat: 20 req/min (already exists)
   - Auth: 10 req/min
   - Admin: 30 req/min
   - Composio proxy: 30 req/min

4. **Add basic prompt injection defense:**
   - Strip known injection patterns from user messages before sending to Claude
   - Add a "jail" wrapper around the system prompt: `<<SYSTEM_BOUNDARY>>...<<END_SYSTEM_BOUNDARY>>`
   - Log and flag suspicious message patterns (role impersonation, system: prefixes)
   - Consider a separate "user input analysis" pre-pass with Claude to detect manipulation

**Priority 2 - WITHIN FIRST SPRINT:**

5. **Add server-side request validation** using Zod schemas on all API endpoints
6. **Add authentication middleware** to protect server routes (verify Clerk JWT)
7. **Implement server-side error sanitization** -- never return raw stack traces in production
8. **Add request logging** with IP, user ID, endpoint, response code (for security audit trail)

**Priority 3 - BEFORE SCALING:**

9. **WAF (Web Application Firewall)** -- Cloudflare or Vercel Edge middleware
10. **Dependency vulnerability scanning** -- `npm audit` in CI/CD pipeline
11. **CSP report-uri** -- collect CSP violation reports for monitoring
12. **API key rotation policy** for Anthropic, Composio, Stripe keys

---

## PART C: FEATURE FLAG INFRASTRUCTURE

### C.1 Current Feature Flag System

**Finding: A UI-only, localStorage-based feature flag system exists.**

The file `nexus/src/components/FeatureFlags.tsx` (640 lines) provides:

- **10 pre-defined flags** including: ai_workflow_suggestions, dark_mode_v2, real_time_collaboration, advanced_analytics, voice_commands, legacy_workflow_editor, workflow_templates_v2, ai_chatbot_enhanced, custom_integrations, workflow_versioning
- **4 categories**: experimental, beta, core, deprecated
- **Metadata support**: rolloutPercentage (0-100), targetUsers array, expiresAt date
- **Admin UI**: search, filter by category, create/edit/delete flags, toggle switches, rollout percentage slider
- **Storage**: `localStorage` key `nexus_feature_flags`

**Critical limitations:**
1. **Client-side only** -- flags stored in localStorage, so they differ between browsers/devices for the same user
2. **No server evaluation** -- server routes cannot check feature flags
3. **No actual percentage-based rollout** -- the `rolloutPercentage` field is stored but never evaluated against users. It is purely decorative.
4. **No targeting** -- `targetUsers` array exists in the type but is never checked
5. **No analytics** -- flag evaluation events are not tracked
6. **No API** -- flags cannot be managed remotely or synced across deployments
7. **Admin only** -- only accessible from the admin page, no SDK for developers

### C.2 Proposed Lightweight Feature Flag System

**Recommendation: Build a minimal but functional system using Supabase + React context.**

The goal is the lightest-weight system that supports: server + client evaluation, percentage-based rollout, and centralized management.

**Architecture:**

```
Supabase table: feature_flags
  - id (uuid, PK)
  - key (text, unique, indexed)
  - enabled (boolean)
  - rollout_percentage (integer, 0-100)
  - target_user_ids (text[], nullable)
  - target_plans (text[], nullable)  -- e.g., ['pro', 'enterprise']
  - metadata (jsonb)
  - created_at (timestamptz)
  - updated_at (timestamptz)

Client: React Context + hook
  const { isEnabled } = useFeatureFlag('real_time_collaboration')

Server: Middleware
  if (await isFeatureEnabled('premium_api_access', userId)) { ... }
```

**Percentage-based rollout implementation:**

The standard technique is deterministic hashing. Given a user ID and flag key, produce a consistent number 0-99:

```typescript
function isRolledOut(userId: string, flagKey: string, percentage: number): boolean {
  // Deterministic: same user + flag always gets same result
  const hash = simpleHash(`${userId}:${flagKey}`)
  const bucket = hash % 100
  return bucket < percentage
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}
```

This ensures:
- Same user always sees the same flag state (deterministic)
- Increasing percentage from 30% to 50% adds new users without removing existing ones
- No external service dependency
- Works on both client and server

**Caching strategy:**
- Client: Fetch flags on app load, cache in React context, refresh every 5 minutes
- Server: Cache in memory with 60-second TTL, invalidate on Supabase realtime subscription
- This keeps Supabase reads minimal (~12 reads/hour per server instance)

**Migration path from current system:**
1. Create Supabase table with the 10 existing flags
2. Replace localStorage reads with Supabase reads
3. Keep the existing admin UI but wire it to Supabase instead of localStorage
4. Add a `useFeatureFlag(key)` hook that checks: enabled + rollout_percentage + target_user_ids
5. Deprecate direct localStorage access

**Why NOT use LaunchDarkly/Flagsmith/PostHog feature flags:**
- LaunchDarkly: $10/seat/month minimum, overkill for current scale
- Flagsmith: Good open-source option but adds another service to manage
- PostHog: Would be ideal IF we move to PostHog for analytics (bundles flags + analytics)
- For Nexus's current stage (pre-launch), a Supabase-native solution is simpler and free

**When to upgrade:** If Nexus reaches 10K+ users or needs A/B testing with statistical significance, migrate to PostHog self-hosted (which bundles feature flags, analytics, session replay, and A/B testing in one self-hosted package).

---

## EXECUTIVE SUMMARY

### Critical Findings

| Area | Status | Risk | Priority |
|------|--------|------|----------|
| Error tracking (Sentry) | Stub only, not configured | Blind to production errors | P1 |
| Analytics | Full system exists, routes to Supabase | Works if Supabase table exists | P2 |
| Prompt injection defense | **ZERO protection** | **CRITICAL** | **P0** |
| Server-side rate limiting | Chat only, 20+ routes unprotected | High abuse potential | P0 |
| CORS configuration | Wide open (all origins) | CSRF and data exfiltration risk | P1 |
| Client sanitization | Comprehensive | Good | OK |
| Server sanitization | Minimal | Input validation missing | P1 |
| CSP headers | Comprehensive but includes unsafe-inline/unsafe-eval | Moderate XSS risk | P2 |
| Feature flags | UI-only localStorage, no real rollout | Non-functional for production | P2 |
| Kuwait data residency | Not addressed | Legal compliance risk | P1 |

### Top 5 Recommendations (Ordered by Impact)

1. **Add prompt injection filtering** before all Claude API calls -- this is the single highest-risk vulnerability
2. **Add rate limiting to all server routes** -- currently only 1 of 25+ routes is protected
3. **Restrict CORS + add Helmet** -- two-line changes with massive security improvement
4. **Connect error-logger.ts to Sentry or Supabase** -- currently flying blind on production errors
5. **Build Supabase-backed feature flag evaluation** -- replace localStorage stubs with real rollout logic

### Files Examined

| File | Path | Lines |
|------|------|-------|
| Error Logger | `nexus/src/lib/error-logger.ts` | 221 |
| Analytics System | `nexus/src/lib/analytics/analytics.ts` | 967 |
| Analytics Events | `nexus/src/lib/analytics/events.ts` | 506 |
| Sanitization | `nexus/src/lib/sanitize.ts` | 388 |
| Rate Limiter (Client) | `nexus/src/lib/rate-limiter.ts` | 329 |
| Rate Limiter (Server) | `nexus/server/routes/chat.ts` | Lines 1-48 |
| Feature Flags | `nexus/src/components/FeatureFlags.tsx` | 640 |
| Safe Expression Evaluator | `nexus/src/lib/safe-expression-evaluator.ts` | ~400 |
| Monitoring Metrics | `nexus/src/lib/monitoring/metrics.ts` | ~300 |
| Server Entry | `nexus/server/index.ts` | ~100 |
| Vercel Config (Headers) | `nexus/vercel.json` | 64 |

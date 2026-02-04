# AUTONOMOUS 20-HOUR RUN PREREQUISITES
## Complete Data Requirements for NEXUS-EXECUTION-PLAN.md

**Generated:** 2026-02-02
**Purpose:** All API keys, credentials, and data needed for Claude to complete all 40 remaining tasks without user intervention

---

## EXECUTION SUMMARY

| Phase | Tasks Remaining | Can Complete Autonomously | Blocked By |
|-------|-----------------|---------------------------|------------|
| Phase 1: Foundation | 0 | ✅ DONE | - |
| Phase 2: Voice | 5 | ✅ YES via Composio | Deepgram + ElevenLabs available in Composio |
| Phase 3: Lawyer | 5 | ⚠️ PARTIAL | Supabase config invalid, DocuSign OAuth needed |
| Phase 4: SME | 4 | ❌ NO | Stripe API keys are placeholders |
| Phase 5: Doctor | 3 | ✅ YES via Composio | Calendly + Cal.com available in Composio |
| Phase 6: Regional | 4 | ⚠️ PARTIAL | ZATCA sandbox credentials needed |
| Phase 7: Avatar | 4 | ✅ YES | No external APIs required |
| Phase 8: Polish | 3 | ✅ YES | No external APIs required |

**TOTAL: 35 tasks can be completed autonomously, 5 tasks blocked**

### KEY FINDING: Composio Has Voice Services
- **Deepgram** is available via Composio OAuth (transcription, summarization, topic detection)
- **ElevenLabs** is available via Composio OAuth (66 actions, TTS)
- **NO direct API keys needed** for Phase 2 - just OAuth connection via Composio

---

## CRITICAL: MISSING API KEYS

### 1. ElevenLabs - AVAILABLE VIA COMPOSIO ✅
**Current Status:** No direct API key needed
**Needed For:** Tasks 2.2.1, 2.2.2, 2.3.1 (Arabic TTS)
**Composio Integration:** 66 actions available including TTS
**How to Connect:**
1. Go to https://app.composio.dev/
2. Navigate to Integrations → ElevenLabs
3. Click "Connect" and complete OAuth flow
4. Or use Rube MCP: `RUBE_SEARCH_TOOLS` for elevenlabs

**No .env changes needed** - ElevenLabs works via Composio OAuth

---

### 2. Deepgram - AVAILABLE VIA COMPOSIO ✅
**Current Status:** No direct API key needed
**Needed For:** Tasks 2.1.1, 2.1.2, 2.3.1 (Arabic transcription)
**Composio Integration:** Includes transcription, summarization, TTS, topic detection
**How to Connect:**
1. Go to https://app.composio.dev/
2. Navigate to Integrations → Deepgram
3. Click "Connect" and complete OAuth flow
4. Or use Rube MCP: `RUBE_SEARCH_TOOLS` for deepgram

**No .env changes needed** - Deepgram works via Composio OAuth

Reference: https://docs.composio.dev/toolkits/deepgram

---

### 3. Stripe API Keys (Phase 4) - REQUIRED
**Current Status:** PLACEHOLDER values in .env
**Needed For:** Tasks 4.1.1, 4.1.2, 4.3.1 (payment processing)
**How to Get:**
1. Go to https://dashboard.stripe.com/apikeys
2. Copy Publishable key (starts with pk_test_ or pk_live_)
3. Copy Secret key (starts with sk_test_ or sk_live_)
4. For webhook secret: Stripe Dashboard → Developers → Webhooks → Add endpoint → Reveal signing secret

**Update in .env (REPLACE PLACEHOLDERS):**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET
```

---

### 4. Supabase Service Role Key (Phase 3) - INVALID
**Current Status:** Same as anon key (INVALID for server operations)
**Needed For:** Task 3.3.1 (client database), meeting service, error recovery
**Current in .env:**
```
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_NPgx7dwJGueTzoXqAYskqQ_Hd2gPmX9  # WRONG - this is anon key
```

**How to Get:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the "service_role" key (NOT the anon key)

**Update in .env:**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx  # Must be JWT format
```

---

## OAUTH CONNECTIONS NEEDED (via Composio Dashboard)

These integrations require OAuth connections in Composio. User must manually authenticate once, then Claude can use them.

### 1. Deepgram Connection (Phase 2) - VOICE
**Needed For:** Tasks 2.1.1, 2.1.2, 2.3.1 (Arabic speech-to-text)
**Available Actions:** Transcribe audio, summarize, topic detection, get models
**How to Connect:**
1. Go to https://app.composio.dev/
2. Navigate to Integrations → Deepgram
3. Click "Connect" and complete OAuth flow

---

### 2. ElevenLabs Connection (Phase 2) - VOICE
**Needed For:** Tasks 2.2.1, 2.2.2, 2.3.1 (Arabic text-to-speech)
**Available Actions:** 66 actions including TTS, voice cloning
**How to Connect:**
1. Go to https://app.composio.dev/
2. Navigate to Integrations → ElevenLabs
3. Click "Connect" and complete OAuth flow

---

### 3. DocuSign Connection (Phase 3)
**Needed For:** Tasks 3.1.1, 3.1.2 (document signatures)
**Available Actions:** 342 actions
**How to Connect:**
1. Go to https://app.composio.dev/
2. Navigate to Integrations → DocuSign
3. Click "Connect" and complete OAuth flow

---

### 4. Google Calendar Connection (Phase 3)
**Needed For:** Task 3.2.1 (court deadline calendar)
**Status:** Google OAuth is configured in .env, but user needs to authorize
**How to Connect:**
1. In Nexus app: Go to Integrations → Google Calendar → Connect
2. Complete OAuth flow

---

### 5. Calendly OR Cal.com Connection (Phase 5)
**Needed For:** Tasks 5.1.1, 5.1.2 (appointment scheduling)
**Available Actions:** Calendly (63 actions), Cal.com (141 actions)
**How to Connect:**
1. Go to https://app.composio.dev/
2. Navigate to Integrations → Calendly (or Cal.com)
3. Click "Connect" and complete OAuth flow

---

## REGIONAL API CREDENTIALS (Phase 6)

### ZATCA Sandbox (Saudi E-Invoicing)
**Needed For:** Tasks 6.1.1, 6.1.2
**How to Get:**
1. Register at https://sandbox.zatca.gov.sa/
2. Complete developer registration
3. Obtain sandbox API credentials

**Add to .env:**
```
ZATCA_SANDBOX_URL=https://sandbox.zatca.gov.sa/api
ZATCA_API_KEY=your_zatca_sandbox_key
ZATCA_SECRET=your_zatca_sandbox_secret
```

**Note:** KNET (Task 6.2.1) is research-only, no API needed yet.

---

## ALREADY CONFIGURED (NO ACTION NEEDED)

| Service | Status | Used For |
|---------|--------|----------|
| Anthropic Claude | ✅ CONFIGURED | Core AI (all phases) |
| Composio | ✅ CONFIGURED | 500+ integrations |
| HeyGen | ✅ CONFIGURED | Avatar video generation |
| Google OAuth | ✅ CONFIGURED | Gmail, Calendar, Sheets |
| Slack OAuth | ✅ CONFIGURED | Slack integration |
| GitHub OAuth | ✅ CONFIGURED | GitHub integration |
| AiSensy WhatsApp | ✅ CONFIGURED | WhatsApp BSP (alternate path) |
| Zapier MCP | ✅ CONFIGURED | 8000+ apps backup |
| Z.AI (GLM) | ✅ CONFIGURED | Coding agents |

---

## AUTONOMOUS EXECUTION CHECKLIST

Before commanding autonomous run, verify these are complete:

### REQUIRED (Will block execution)
- [ ] **Stripe API Keys** replaced with real keys in .env
- [ ] **Supabase Service Role Key** replaced with correct JWT key

### VOICE SERVICES (Phase 2) - Connect via Composio
- [ ] **Deepgram** OAuth connected via Composio (speech-to-text)
- [ ] **ElevenLabs** OAuth connected via Composio (text-to-speech)

### LAWYER WORKFLOWS (Phase 3) - Connect via Composio
- [ ] **DocuSign** OAuth connected via Composio
- [ ] **Google Calendar** OAuth authorized

### DOCTOR WORKFLOWS (Phase 5) - Connect via Composio
- [ ] **Calendly** OR **Cal.com** OAuth connected

### OPTIONAL (Phase 6 only)
- [ ] **ZATCA Sandbox** credentials obtained

---

## TASKS THAT NEED NO EXTERNAL DEPENDENCIES

These 15 tasks can be completed with current configuration:

### Phase 7: Avatar System (4 tasks)
- 7.1.1 Avatar Design System - Design work
- 7.1.2 Avatar Component Implementation - React coding
- 7.2.1 Avatar on All Pages - UI integration
- 7.3.1 Avatar Demo - Documentation

### Phase 8: Polish & Launch (3 tasks)
- 8.1.1 Response Time Optimization - Code optimization
- 8.2.1 User-Friendly Errors - Error handling
- 8.3.1 Pre-Launch Validation - Checklist review

### Phase 3: Partial (2 tasks)
- 3.2.1 Calendar Integration - If Google Calendar OAuth is active
- 3.4.1 Demo Video - Documentation (if other lawyer tasks complete)

### Phase 2: Partial (2 tasks)
- 2.1.1 Deepgram Service Setup - If via Composio or direct key provided
- 2.1.2 WhatsApp Voice Note Handler - If Deepgram works

### Phase 6: Research Only (2 tasks)
- 6.1.1 ZATCA API Research - Just documentation
- 6.2.1 KNET Integration Research - Just documentation

---

## COMMAND TO START AUTONOMOUS RUN

Once all REQUIRED items are checked, use this command:

```
Execute NEXUS-EXECUTION-PLAN.md autonomously. Start from task 2.1.1 [CURRENT].
Complete all tasks sequentially without asking for permission.
Use Playwright for any testing needed.
Update the execution plan file after each task completion.
If a task fails due to missing credentials, mark it [BLOCKED] with reason and continue to next task.
Run until all tasks are [DONE] or [BLOCKED].
```

---

## ESTIMATED COMPLETION TIME

| Scenario | Tasks Completable | Estimated Time |
|----------|------------------|----------------|
| All OAuth + Stripe | 40/40 | ~8-12 hours |
| Stripe only (no OAuth) | 25/40 | ~5-6 hours |
| Current state (as-is) | 19/40 | ~4-5 hours |

**Best Case:** Connect Deepgram, ElevenLabs, DocuSign, Google Calendar, Calendly via Composio + add real Stripe keys = 40/40 tasks completable

---

## QUICK COPY-PASTE FOR .env

Add these lines to your .env file (replace XXX with actual values):

```
# Voice Layer (Phase 2) - NOT NEEDED (use Composio OAuth instead)
# DEEPGRAM_API_KEY and ELEVENLABS_API_KEY are not required
# Connect Deepgram and ElevenLabs via Composio Dashboard instead

# Payments (Phase 4) - REPLACE PLACEHOLDERS
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXX
STRIPE_SECRET_KEY=sk_test_XXX
STRIPE_WEBHOOK_SECRET=whsec_XXX

# Supabase (Phase 3) - REPLACE WITH CORRECT KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXX

# Regional (Phase 6) - Optional
ZATCA_SANDBOX_URL=https://sandbox.zatca.gov.sa/api
ZATCA_API_KEY=XXX
ZATCA_SECRET=XXX
```

## COMPOSIO OAUTH CONNECTIONS

Instead of direct API keys, connect these services in Composio Dashboard (https://app.composio.dev/):

1. **Deepgram** - Speech-to-text, transcription
2. **ElevenLabs** - Text-to-speech, voice synthesis
3. **DocuSign** - Document signatures (342 actions)
4. **Google Calendar** - Calendar events (46 actions)
5. **Calendly** - Appointment scheduling (63 actions)
6. **Cal.com** - Alternative scheduling (141 actions)

---

**Document Version:** 1.0
**Last Updated:** 2026-02-02
**Prepared for:** Autonomous 20-hour Claude execution

# Cycle 2 - Agent 2 Report: FIX-063 Override Blast Radius & Composio Trust Migration Plan

**Date:** 2026-02-15
**Agent:** Tool Selection Specialist (Cycle 2)
**Mission:** Analyze FIX-063 blast radius, classify all 47 toolkit risk levels, design gradual migration from static slugs to Composio recommendations.

---

## 1. FIX-063: Exact Mechanism and Rationale

### What FIX-063 Does

FIX-063 is a **hard override** that forces the system to ignore Composio's tool recommendations and use static `TOOL_SLUGS` mappings for any toolkit that appears in the `TOOL_SLUGS` object. It operates at **two critical points** in the execution pipeline:

**Point 1 - Pre-flight Discovery (line 3868-3907, WorkflowPreviewCard.tsx):**
```
1. Orchestration calls RUBE_SEARCH_TOOLS for the node's intent + toolkit
2. Composio returns its best-match tool slug (e.g., CALENDAR_CREATE)
3. FIX-063 checks: isToolkitKnown(integrationLower)?
4. If YES: Calls mapNodeToToolSlug() to get the static TOOL_SLUGS mapping
5. If static slug differs from orchestration slug: OVERRIDES orchResult.slug with legacy slug
6. Marks orchResult.source = 'legacy'
7. FIX-064 then re-fetches the schema for the CORRECT (legacy) tool
```

**Point 2 - Execution Phase (line 5467-5477, WorkflowPreviewCard.tsx):**
```
1. Execution retrieves storedOrchResult from pre-flight
2. FIX-063 checks again: isToolkitKnown(toolkitLower)?
3. If YES: Calls mapNodeToToolSlug() again, overriding the execution slug
4. This is a SAFETY NET in case pre-flight override was somehow bypassed
```

### Why FIX-063 Was Added

The documented root cause (from FIX_REGISTRY.json):

> **Problem:** Rube semantic search returns wrong tools for known toolkits. Example: 'Check Calendar' with calendar toolkit returned `CALENDAR_CREATE` instead of `GOOGLECALENDAR_EVENTS_LIST`. This caused execution failures even though we have correct mappings in TOOL_SLUGS.

The real issue is that Composio's `RUBE_SEARCH_TOOLS` performs **semantic** matching on the use_case string, and its tool naming conventions sometimes differ from what the static mappings expect. Specifically:

1. **Namespace mismatches** - Composio may return `CALENDAR_CREATE` (generic Calendar namespace) when the correct tool is `GOOGLECALENDAR_CREATE_EVENT` (Google-specific namespace).
2. **Action mismatches** - "Check Calendar" semantically matches "CREATE" in Composio's model, when the user actually wants "LIST/GET events."
3. **Verb ambiguity** - "Schedule a meeting" might return a generic scheduling tool rather than `GOOGLECALENDAR_CREATE_EVENT`.

### The Trade-off

FIX-063 **solves** reliability for the 47 known toolkits but **prevents** the system from ever benefiting from Composio improvements. It creates a paradox:

- We call Composio's orchestration (costs API calls, adds latency)
- We immediately throw away the result for known toolkits
- The ONLY value retained from orchestration is the `sessionId` (needed by FIX-062 for schema fetching)

This means for known toolkits, orchestration is effectively **a session-ID generator**, not a tool discovery mechanism.

### Blast Radius

FIX-063 affects **all 47 toolkits** in TOOL_SLUGS, totaling approximately **220 action-to-slug mappings**. When USE_ORCHESTRATION_FIRST=true (current state), every workflow execution for these toolkits will:

1. Call Composio API (unnecessary network call)
2. Discard the recommendation
3. Use the static mapping instead
4. Re-fetch schema for the static tool (FIX-064 follow-up)

This results in ~2 unnecessary API calls per known toolkit node, per workflow execution.

---

## 2. Full Toolkit Risk Classification (All 47)

For each toolkit, I assess whether Composio's recommendation would likely be **BETTER** (Composio has clear, well-named tools that match), **EQUIVALENT** (either approach works), or **WORSE** (Composio's naming/matching is known to be problematic or our static mapping handles important edge cases).

### Legend
- **LOW RISK** = Safe to trust Composio. Simple, well-named tools. Standard CRUD.
- **MEDIUM RISK** = Composio probably fine for basic actions, but edge cases exist.
- **HIGH RISK** = Must keep static mapping. Complex namespacing, critical action-verb disambiguation, or known Composio mismatches.

| # | Toolkit | Actions Mapped | Risk Level | Rationale |
|---|---------|---------------|------------|-----------|
| 1 | gmail | 11 (send, draft, fetch, read, get, list, trigger, receive, capture, listen, incoming, watch) | HIGH | Critical toolkit. Many action verbs (11) that must map correctly. "fetch" vs "send" confusion is catastrophic. Trigger/receive disambiguation vital. |
| 2 | slack | 11 (send, notify, message, post, list, fetch, read, history, trigger, receive, capture, listen, incoming, watch) | HIGH | Same complexity as Gmail. Multiple inbound/outbound verbs. "list" = channels vs "fetch" = conversation history is a subtle but important distinction. |
| 3 | whatsapp | 8 (send, message, notify, template, trigger, receive, capture, listen, incoming, webhook) | HIGH | Template messages vs regular messages is a critical distinction. WhatsApp Business API has specific tool naming. Composio namespace unclear. |
| 4 | discord | 4 (send, message, post, webhook) | LOW | Simple toolkit. Only 4 mappings, all send-oriented. Webhook is the only edge case. |
| 5 | teams | 4 (send, message, post, notify) | LOW | Very simple. All map to TEAMS_SEND_MESSAGE. Composio should handle this trivially. |
| 6 | zoom | 3 (create, schedule, meeting, list) | LOW | Simple CRUD. Create meeting or list meetings. Composio naming is straightforward. |
| 7 | googlesheets | 7 (create, add, read, get, write, append, update, save) | HIGH | FIX-022 protects this. Multiple verbs map to BATCH_UPDATE vs BATCH_GET. The "batch" prefix is non-obvious and Composio may return simpler names. |
| 8 | googlecalendar | 7 (create, list, get, fetch, find, today, check, schedule) | HIGH | **The original FIX-063 trigger.** Composio returned CALENDAR_CREATE instead of GOOGLECALENDAR_EVENTS_LIST. Namespace prefix "GOOGLE" is critical. |
| 9 | googledrive | 4 (upload, list, download, create) | MEDIUM | Google namespace prefix needed. But actions are simple CRUD. |
| 10 | hubspot | 4 (search, list, create, read) | MEDIUM | CRM-specific naming. SEARCH_CONTACTS_BY_CRITERIA is non-standard. Composio may use simpler names. |
| 11 | salesforce | 5 (search, list, create, update, query) | MEDIUM | SOQL_QUERY is Salesforce-specific. Composio should know Salesforce well but query vs search is subtle. |
| 12 | pipedrive | 4 (create, list, update, search) | LOW | Standard CRM CRUD. Composio likely handles well. |
| 13 | github | 5 (issue, issues, pr, list, fetch, get, search) | MEDIUM | LIST_REPOSITORY_ISSUES vs ISSUES_AND_PULL_REQUESTS distinction matters. But GitHub is well-known to Composio. |
| 14 | clickup | 10 (create, task, add, list, get, fetch, folder, update, edit, trigger, capture, receive, watch, listen) | MEDIUM | Many actions but ClickUp is a major Composio integration. GET_TASK vs GET_TASKS (singular vs plural) is an edge case. |
| 15 | linear | 4 (create, issue, list, update) | LOW | Simple issue tracker CRUD. Composio handles Linear well. |
| 16 | monday | 4 (create, item, list, update) | LOW | Monday.com CRUD is straightforward. |
| 17 | jira | 5 (create, issue, list, update, search) | MEDIUM | JQL_SEARCH is Jira-specific. Composio should know Jira but JQL is a special case. |
| 18 | notion | 8 (create, update, search, database, save, add, insert, log, query, fetch) | HIGH | FIX-024 corrects Notion slugs. CREATE_PAGE vs INSERT_ROW_DATABASE vs QUERY_DATABASE is a critical three-way distinction. "save to notion" could mean any of these. |
| 19 | trello | 3 (card, create, list) | LOW | Very simple. GET_BOARD_CARDS is the only non-obvious slug. |
| 20 | asana | 3 (task, create, list) | LOW | Simple CRUD. |
| 21 | stripe | 6 (create, customer, charge, invoice, list, subscription) | MEDIUM | Multiple resource types (customer, charge, invoice, subscription). Composio needs to disambiguate which resource. |
| 22 | quickbooks | 4 (create, invoice, list, customer) | MEDIUM | Accounting-specific. CREATE_INVOICE vs CREATE_CUSTOMER distinction. |
| 23 | xero | 4 (create, invoice, list, contact) | MEDIUM | Same as QuickBooks - accounting resource disambiguation. |
| 24 | mailchimp | 4 (send, campaign, add, list) | MEDIUM | SEND_CAMPAIGN vs CREATE_CAMPAIGN vs ADD_SUBSCRIBER is a three-way split. |
| 25 | sendgrid | 2 (send, email) | LOW | Only 2 mappings, both → SEND_EMAIL. Trivial. |
| 26 | twitter | 4 (post, tweet, send, list) | LOW | CREATE_TWEET is well-known. GET_TWEETS for listing. Simple. |
| 27 | linkedin | 3 (post, share, send) | LOW | CREATE_POST vs SEND_MESSAGE. Composio should handle. |
| 28 | instagram | 3 (post, upload, story) | LOW | CREATE_POST vs CREATE_STORY. Two-way split, manageable. |
| 29 | facebook | 3 (post, share, page) | LOW | Simple social media CRUD. |
| 30 | dropbox | 6 (upload, save, store, write, create, list, download) | HIGH | FIX-017 protects this. 5 different verbs all map to UPLOAD_FILE. Composio may not understand that "save to Dropbox" means upload. |
| 31 | onedrive | 7 (upload, save, store, write, create, list, download) | HIGH | Same as Dropbox - FIX-017 pattern. Multiple save/store verbs → upload. |
| 32 | airtable | 4 (create, list, update, search) | LOW | Standard CRUD for a well-known integration. |
| 33 | openai | 4 (generate, chat, complete, image) | LOW | CHAT_COMPLETION is standard. CREATE_IMAGE is clear. |
| 34 | anthropic | 3 (generate, chat, complete) | LOW | Only CHAT_COMPLETION. Trivial. |
| 35 | deepgram | 2 (transcribe, audio) | LOW | Only TRANSCRIBE. Minimal risk. |
| 36 | elevenlabs | 3 (generate, speak, voice) | LOW | Only TEXT_TO_SPEECH. Minimal risk. |
| 37 | intercom | 4 (send, message, create, list) | MEDIUM | SEND_MESSAGE vs CREATE_CONVERSATION distinction. |
| 38 | zendesk | 4 (create, ticket, update, list) | LOW | Standard ticket CRUD. |
| 39 | freshdesk | 4 (create, ticket, update, list) | LOW | Same as Zendesk. |
| 40 | webhook | 3 (send, trigger, post) | LOW | Generic webhook. All map to WEBHOOK_TRIGGER. |
| 41 | shopify | 7 (create, list, order, update, inventory, trigger, receive) | MEDIUM | E-commerce has multi-resource types (product, order, inventory). Composio needs context. |
| 42 | woocommerce | 5 (create, list, order, update, trigger) | MEDIUM | Same multi-resource issue as Shopify. |
| 43 | square | 4 (create, list, invoice, customer) | MEDIUM | Payment vs invoice vs customer disambiguation. |
| 44 | typeform | 5 (create, list, trigger, receive, response) | LOW | Simple form CRUD + trigger. |
| 45 | googleforms | 4 (create, list, trigger, receive) | LOW | Same as Typeform. |
| 46 | calendly | 5 (create, list, schedule, trigger, cancel) | LOW | Scheduling is straightforward CRUD. |
| 47 | twilio | 5 (send, sms, call, message, trigger) | MEDIUM | SEND_SMS vs MAKE_CALL is a critical distinction. "message" could mean either. |
| 48 | telegram | 4 (send, message, photo, trigger) | LOW | SEND_MESSAGE vs SEND_PHOTO is clear. |
| 49 | docusign | 5 (create, send, sign, list, trigger) | MEDIUM | CREATE_ENVELOPE vs SEND_ENVELOPE distinction matters. |
| 50 | box | 4 (upload, save, list, download) | MEDIUM | Storage verbs, but fewer aliases than Dropbox/OneDrive. |
| 51 | freshbooks | 4 (create, invoice, list, client) | MEDIUM | Accounting resource disambiguation. |
| 52 | helpscout | 4 (create, list, send, trigger) | LOW | Simple support CRUD. |
| 53 | supabase | 6 (create, read, update, delete, list, insert) | LOW | Database CRUD. Very standard naming. |
| 54 | firebase | 5 (create, read, update, delete, push) | LOW | Same as Supabase. Standard naming. |
| 55 | googleanalytics | 4 (report, list, get, fetch) | LOW | GET_REPORT is the main action. |
| 56 | sendinblue | 4 (send, email, sms, campaign) | MEDIUM | Multi-channel (email vs SMS vs campaign). |

**Note:** The actual count is ~56 toolkit entries when including the FIX-114 additions, not exactly 47. The original Cycle 1 count of "47" included only the pre-FIX-114 entries. I have classified all entries present in TOOL_SLUGS.

---

## 3. The 10 SAFEST Toolkits to Trust Composio

These toolkits have the lowest risk of Composio returning wrong slugs. They share common traits: simple CRUD patterns, few action variants, well-known integrations in Composio's catalog, and no tricky namespace prefixes.

| Rank | Toolkit | Current Actions | Why Safe |
|------|---------|----------------|----------|
| 1 | **sendgrid** | 2 | Only SEND_EMAIL. Impossible to get wrong. |
| 2 | **deepgram** | 2 | Only TRANSCRIBE. Single action, no ambiguity. |
| 3 | **elevenlabs** | 3 | Only TEXT_TO_SPEECH. Single action. |
| 4 | **anthropic** | 3 | Only CHAT_COMPLETION. No other options. |
| 5 | **openai** | 4 | CHAT_COMPLETION or CREATE_IMAGE. Clear binary choice. |
| 6 | **teams** | 4 | All verbs map to SEND_MESSAGE. No splitting. |
| 7 | **discord** | 4 | Mostly SEND_MESSAGE + webhook. Simple. |
| 8 | **airtable** | 4 | Clean CRUD naming. Composio has good Airtable support. |
| 9 | **linear** | 4 | Standard issue tracker CRUD. Well-supported by Composio. |
| 10 | **zoom** | 3 | CREATE_MEETING or LIST_MEETINGS. Binary choice. |

**Migration Strategy for Safe Toolkits:**
- These can be moved to "trust Composio" mode with a simple A/B test.
- If Composio's recommendation matches our static slug >95% of the time over 100 executions, permanently switch.
- Fallback: If Composio's slug fails execution, auto-retry with static mapping (one-time cost).

---

## 4. The 10 RISKIEST Toolkits That MUST Keep Static Mappings

These toolkits have the highest blast radius if Composio returns wrong slugs. They share traits: many action verb variants, namespace prefix issues, critical business operations, or known historical Composio mismatches.

| Rank | Toolkit | Current Actions | Why Risky |
|------|---------|----------------|-----------|
| 1 | **googlecalendar** | 7 | **The FIX-063 origin case.** CALENDAR_CREATE vs GOOGLECALENDAR_EVENTS_LIST. Namespace prefix "GOOGLE" is not guaranteed from Composio. "Check calendar" matched CREATE instead of LIST. |
| 2 | **gmail** | 11 | 11 action verbs, 4 distinct operations (send, fetch, trigger, draft, watch). Misrouting "fetch emails" to "send email" would be catastrophic. Trigger/watch distinction is critical. |
| 3 | **slack** | 11 | Same verb complexity as Gmail. LIST_CHANNELS vs FETCH_CONVERSATION_HISTORY is a subtle distinction Composio might miss. NEW_MESSAGE_TRIGGER is a specific slug format. |
| 4 | **googlesheets** | 7 | BATCH_UPDATE vs BATCH_GET is non-obvious naming. FIX-022 specifically protects "add to sheet" mappings. Composio might return UPDATE_CELL or APPEND_ROW instead. |
| 5 | **dropbox** | 6 | FIX-017 landmark fix. 5 verbs (save, store, write, create, upload) all must map to UPLOAD_FILE. Composio might interpret "save to Dropbox" as a different action. |
| 6 | **onedrive** | 7 | Same FIX-017 pattern as Dropbox. Multiple save-synonyms must all route to UPLOAD_FILE. |
| 7 | **notion** | 8 | FIX-024 corrected wrong Composio slugs (NOTION_SEARCH did not exist). Three-way split: CREATE_PAGE / INSERT_ROW_DATABASE / QUERY_DATABASE. "save to notion" is highly ambiguous. |
| 8 | **whatsapp** | 8 | SEND_MESSAGE vs SEND_TEMPLATE_MESSAGE is business-critical in Kuwait market. Template messages have legal/compliance implications. Webhook vs trigger distinction matters. |
| 9 | **clickup** | 10 | GET_TASK (singular) vs GET_TASKS (plural) is a Composio naming quirk. 10 action verbs with trigger/watch distinctions. Folder-level operations add complexity. |
| 10 | **stripe** | 6 | Financial operations. CREATE_CUSTOMER vs CREATE_CHARGE vs CREATE_INVOICE vs CREATE_SUBSCRIPTION are four distinct resources. Misrouting a "charge" to "subscription" would be a financial incident. |

**Retention Strategy for Risky Toolkits:**
- Keep FIX-063 override active indefinitely.
- Only consider migration after: (a) 500+ successful Composio-recommended executions in shadow mode, AND (b) 0 mismatches on the critical verbs (send vs fetch, create vs list, etc.).
- For Stripe and financial toolkits: NEVER auto-migrate. Require explicit human approval.

---

## 5. Feature Flag System Design for Gradual Rollout

### Existing Feature Flag Infrastructure

The codebase already has feature flag infrastructure at multiple levels:

1. **Code-Level Constants** (WorkflowPreviewCard.tsx, lines 96 and 112):
   - `USE_GENERIC_ORCHESTRATION = true` (Phase 3: enabled)
   - `USE_ORCHESTRATION_FIRST = true` (FIX-059)
   These are compile-time constants, requiring code changes to toggle.

2. **FeatureFlags UI Component** (`src/components/FeatureFlags.tsx`):
   - Full CRUD for feature flags stored in localStorage
   - Supports categories (experimental, beta, core, deprecated)
   - Supports rollout percentages
   - But: This component is a **UI admin panel**, not a runtime flag evaluation system. There is no `useFeatureFlag('key')` hook or `isFeatureEnabled('key')` function elsewhere in the codebase. The flags are **display-only**.

3. **No Runtime Flag Evaluation**: There is no `isFeatureEnabled()` utility function. The FeatureFlags component stores data in localStorage under `nexus_feature_flags` but no other code reads this storage key.

### Proposed Feature Flag System for Composio Migration

#### Architecture

```
                         ToolResolutionFlags
                              |
                    +---------+---------+
                    |                   |
            Per-Toolkit Flag     Global Override
            (granular control)   (kill switch)
                    |
            +-------+-------+
            |               |
        "static"        "composio"
        (FIX-063)       (trust Composio)
        "shadow"
        (log both, use static)
```

#### Data Structure

```typescript
interface ToolResolutionConfig {
  // Global kill switch - if false, ALL toolkits use static (FIX-063 behavior)
  globalComposioEnabled: boolean;

  // Per-toolkit override: 'static' | 'composio' | 'shadow'
  // 'static' = Use TOOL_SLUGS (current FIX-063 behavior)
  // 'composio' = Trust Composio's recommendation
  // 'shadow' = Use static but LOG what Composio would have returned
  toolkitMode: Record<string, 'static' | 'composio' | 'shadow'>;

  // Rollout percentage (0-100) for toolkits in 'composio' mode
  // Allows gradual rollout: 10% of requests use Composio, 90% use static
  rolloutPercentage: Record<string, number>;

  // Automatic fallback: if Composio slug fails execution, retry with static
  autoFallbackEnabled: boolean;

  // Shadow mode logging endpoint (for analytics)
  shadowLogEndpoint: string | null;
}
```

#### Default Configuration

```typescript
const DEFAULT_TOOL_RESOLUTION_CONFIG: ToolResolutionConfig = {
  globalComposioEnabled: false, // Start disabled (current behavior)
  toolkitMode: {
    // Phase 1: Shadow mode for safe toolkits
    sendgrid: 'shadow',
    deepgram: 'shadow',
    elevenlabs: 'shadow',
    anthropic: 'shadow',
    openai: 'shadow',
    teams: 'shadow',
    discord: 'shadow',
    airtable: 'shadow',
    linear: 'shadow',
    zoom: 'shadow',
    // Everything else defaults to 'static'
  },
  rolloutPercentage: {
    // When moved to 'composio' mode, start at 10%
    sendgrid: 10,
    deepgram: 10,
    // ... etc
  },
  autoFallbackEnabled: true,
  shadowLogEndpoint: null,
};
```

#### Runtime Evaluation Function

```typescript
function resolveToolSlugMode(
  toolkit: string,
  config: ToolResolutionConfig
): 'static' | 'composio' | 'shadow' {
  // Kill switch
  if (!config.globalComposioEnabled) return 'static';

  const mode = config.toolkitMode[toolkit] || 'static';

  if (mode === 'composio') {
    // Check rollout percentage
    const rollout = config.rolloutPercentage[toolkit] || 0;
    const random = Math.random() * 100;
    if (random > rollout) return 'static'; // Outside rollout
    return 'composio';
  }

  return mode;
}
```

#### Integration Point in FIX-063

The FIX-063 override logic (line 3872) would be modified to:

```typescript
if (orchResult && isKnown) {
  const mode = resolveToolSlugMode(integrationLower, getToolResolutionConfig());

  if (mode === 'composio') {
    // Trust Composio - DO NOT override
    console.log(`[COMPOSIO-TRUST] Using Composio slug for ${integrationLower}: ${orchResult.slug}`);
  } else {
    const legacySlug = mapNodeToToolSlug(node.name, integration);
    if (legacySlug && legacySlug !== orchResult.slug) {
      if (mode === 'shadow') {
        // Log the difference but still use static
        console.log(`[SHADOW] Composio: ${orchResult.slug} vs Static: ${legacySlug}`);
        logShadowComparison(integrationLower, orchResult.slug, legacySlug, node.name);
      }
      console.log(`[FIX-063] Overriding ${orchResult.slug} with ${legacySlug}`);
      orchResult.slug = legacySlug;
      orchResult.source = 'legacy';
      // ... FIX-064 re-fetch schema logic ...
    }
  }
}
```

#### Shadow Mode Analytics

Shadow mode is the critical first step. It logs what Composio WOULD have recommended without actually using it:

```typescript
interface ShadowComparison {
  timestamp: string;
  toolkit: string;
  nodeName: string;
  composioSlug: string;
  staticSlug: string;
  match: boolean; // Did they agree?
  composioSource: string; // Which Composio tool was returned
}

function logShadowComparison(
  toolkit: string,
  composioSlug: string,
  staticSlug: string,
  nodeName: string
): void {
  const comparison: ShadowComparison = {
    timestamp: new Date().toISOString(),
    toolkit,
    nodeName,
    composioSlug,
    staticSlug,
    match: composioSlug === staticSlug,
    composioSource: 'RUBE_SEARCH_TOOLS'
  };

  // Store in localStorage for later analysis
  const key = 'nexus_shadow_comparisons';
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push(comparison);
  // Keep last 1000 entries
  if (existing.length > 1000) existing.shift();
  localStorage.setItem(key, JSON.stringify(existing));

  console.log(`[SHADOW] ${comparison.match ? 'MATCH' : 'MISMATCH'}: ${toolkit} - Composio: ${composioSlug}, Static: ${staticSlug}`);
}
```

---

## 6. Migration Timeline

### Phase 0: Shadow Mode Foundation (Week 1-2)
- Implement `ToolResolutionConfig` data structure
- Implement `resolveToolSlugMode()` function
- Implement `logShadowComparison()` logging
- Enable shadow mode for the 10 safe toolkits
- **No behavioral change** - all toolkits still use static mappings
- Deliverable: Shadow comparison logs accumulating in localStorage

### Phase 1: Shadow Analysis (Week 3-4)
- Collect 200+ shadow comparisons per safe toolkit
- Analyze match rate (Composio slug == static slug)
- For each toolkit, compute:
  - Overall match rate
  - Per-action match rate (send, create, list, etc.)
  - Mismatch patterns (what Composio returns instead)
- Deliverable: Match rate report per toolkit

### Phase 2: First Composio Trust (Week 5-6)
- Move toolkits with >98% match rate to `composio` mode at 10% rollout
- Expected first batch: sendgrid, deepgram, elevenlabs, anthropic (near-100% match likely)
- Enable `autoFallbackEnabled` for safety net
- Monitor execution success rate
- Deliverable: First toolkits running on Composio recommendations

### Phase 3: Gradual Rollout (Week 7-10)
- Increase rollout percentage: 10% -> 25% -> 50% -> 100% per toolkit
- Each increase requires 50+ successful executions at current level
- Add second batch of toolkits (teams, discord, airtable, linear, zoom)
- Deliverable: 10 toolkits fully on Composio

### Phase 4: Medium-Risk Migration (Week 11-16)
- Enable shadow mode for medium-risk toolkits (github, hubspot, salesforce, etc.)
- Analyze shadow data, require 99% match rate for action-critical verbs
- Gradual rollout as in Phase 3
- Special attention to CRM toolkits (financial data implications)
- Deliverable: ~30 toolkits on Composio

### Phase 5: High-Risk Assessment (Week 17-24)
- Shadow mode for high-risk toolkits (gmail, slack, googlecalendar, etc.)
- Require 99.9% match rate on critical verbs (send vs fetch)
- Manual review of EVERY mismatch case
- Gradual rollout starting at 5% (lower than safe toolkits)
- **Stripe/financial toolkits require explicit CEO approval**
- Deliverable: Decision on each high-risk toolkit

### Phase 6: Legacy Code Removal (Week 25+)
- For toolkits at 100% Composio for 4+ weeks with 0 fallbacks:
  - Remove from TOOL_SLUGS
  - Remove FIX-063 override for that toolkit
- Keep TOOL_SLUGS as emergency fallback (never fully remove)
- Keep FIX-063 kill switch functional
- Deliverable: Reduced code complexity, fewer static mappings to maintain

### Success Criteria Per Phase

| Phase | Metric | Threshold |
|-------|--------|-----------|
| 1 | Shadow data collected | 200+ per toolkit |
| 2 | Execution success rate | >99% at 10% rollout |
| 3 | Execution success rate | >99.5% at 100% rollout |
| 4 | Mismatch rate on critical verbs | <1% |
| 5 | Mismatch rate on critical verbs | <0.1% |
| 6 | Weeks without fallback | 4+ consecutive |

### Rollback Plan

At any point, setting `globalComposioEnabled = false` immediately reverts ALL toolkits to static FIX-063 behavior. Per-toolkit rollback is also possible by setting `toolkitMode[toolkit] = 'static'`.

---

## 7. Key Observations and Recommendations

### The Fundamental Tension

FIX-063 exists because Composio's semantic search is imprecise for verb-to-action mapping. The static TOOL_SLUGS mapping was built by a human who understands that "check my calendar" means LIST events, not CREATE an event. Composio's ML model doesn't reliably make this distinction.

However, the static approach has clear downsides:
1. Only 47 of 500+ toolkits are covered (9.4%)
2. New Composio tools/features are invisible to the static map
3. Tool slugs can change in Composio's API (we wouldn't know)
4. Maintenance burden grows linearly with each new toolkit

### Recommendation: Hybrid Approach

Rather than a binary static-vs-Composio choice, the ideal system would:

1. **Use Composio for discovery** (which tools exist for a toolkit)
2. **Use static mapping for verb disambiguation** (which specific tool matches the user's intent)
3. **Validate against Composio's schema** (confirm the static slug actually exists)

This preserves the intelligence of FIX-063's verb mapping while gaining Composio's breadth. The shadow mode infrastructure proposed above enables this transition with minimal risk.

### Integration with FeatureFlags Component

The existing `FeatureFlags.tsx` component should be extended to include tool resolution flags. Add a new category `'infrastructure'` and create flags like:

```
- composio_trust_sendgrid (experimental, 10% rollout)
- composio_trust_deepgram (experimental, 10% rollout)
- composio_shadow_mode (beta, 100% rollout)
- composio_auto_fallback (core, 100% rollout)
```

This gives admins a UI to control the migration without code changes.

### Missing: Runtime Flag Evaluation

The most critical gap is the absence of a `useFeatureFlag()` hook or `isFeatureEnabled()` utility. The FeatureFlags component writes to localStorage but nothing reads it. Before any migration work begins, a runtime evaluation layer must be built:

```typescript
// src/lib/feature-flags.ts
export function isFeatureEnabled(key: string): boolean {
  const saved = localStorage.getItem('nexus_feature_flags');
  if (!saved) return false;
  const flags = JSON.parse(saved);
  const flag = flags.find((f: any) => f.key === key);
  if (!flag) return false;
  if (!flag.enabled) return false;
  // Check rollout percentage
  if (flag.metadata?.rolloutPercentage !== undefined) {
    const hash = simpleHash(key + getUserId());
    return (hash % 100) < flag.metadata.rolloutPercentage;
  }
  return true;
}
```

---

## 8. Summary

FIX-063 is a necessary safety valve that prevents Composio's imprecise semantic matching from breaking known toolkit workflows. It operates at two points (pre-flight and execution) as a hard override, replacing Composio's recommendation with the static TOOL_SLUGS mapping for all 47 known toolkits.

The migration path to trusting Composio is a 6-phase, 25-week process:
1. Build shadow mode infrastructure
2. Collect comparison data
3. Trust the safest 10 toolkits first (sendgrid, deepgram, elevenlabs, etc.)
4. Gradually expand to medium-risk toolkits
5. Carefully assess high-risk toolkits (gmail, slack, googlecalendar)
6. Remove legacy code only after sustained success

The key insight is that **verb disambiguation** (understanding "check calendar" means LIST, not CREATE) is the hardest problem, and the toolkits where this matters most (gmail, slack, googlecalendar, dropbox, notion) should be the last to migrate.

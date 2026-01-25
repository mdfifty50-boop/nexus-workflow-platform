# CRITICAL FIXES - DO NOT REVERT

This document tracks critical bug fixes that MUST be preserved. Before modifying any of these files, read this document first.

---

## Fix #1: Expired Connection Detection (Jan 21, 2026)

**File:** `server/services/ComposioService.ts`
**Method:** `checkConnection()`
**Commit:** `745bb3e`

### Problem
Composio accounts can exist but be in EXPIRED state. The old code only checked if accounts existed, returning `connected=true` for expired accounts. This caused:
- Tool execution failures with HTTP 410 "Connected account is in EXPIRED state"
- Users saw "connection successful" but workflows failed

### Fix
```typescript
// Filter to only ACTIVE accounts - EXPIRED accounts will fail on execution!
const activeAccounts = accounts?.items?.filter(
  (account: any) => account.status === 'ACTIVE'
) || []

const hasActiveConnection = activeAccounts.length > 0
return { connected: hasActiveConnection }
```

### DO NOT
- Remove the `status === 'ACTIVE'` filter
- Return `connected: true` based only on account existence

---

## Fix #2: Delete Expired Before OAuth (Jan 21, 2026)

**File:** `server/services/ComposioService.ts`
**Method:** `initiateConnection()`
**Commit:** `745bb3e`

### Problem
When expired connections exist, Composio's OAuth page shows "Authentication Failed - Your connection has expired" instead of the normal consent page.

### Fix
Delete all EXPIRED connections BEFORE initiating new OAuth:
```typescript
const expiredAccounts = existingAccounts?.items?.filter(
  (account: any) => account.status === 'EXPIRED'
) || []

for (const expired of expiredAccounts) {
  await this.composio.connectedAccounts.delete(expired.id)
}
```

### DO NOT
- Remove the expired connection cleanup
- Skip deletion before OAuth initiation

---

## Fix #3: Popup Blocker Prevention (Jan 21, 2026)

**File:** `src/components/chat/WorkflowPreviewCard.tsx`
**Method:** `handleConnectAll()`
**Commit:** `745bb3e`

### Problem
Browsers block `window.open()` calls that happen AFTER async operations (not considered direct user action). The old code called `window.open()` after `await rubeClient.initiateConnection()`, causing popups to be blocked.

### Fix
Open popups SYNCHRONOUSLY (before async call), then navigate them:
```typescript
// CRITICAL: Open popup windows IMMEDIATELY (synchronously)
const popup = window.open('about:blank', `oauth_${toolkit}`, 'width=600,height=700')

// Show loading spinner in popup
popup.document.write('<html>...loading...</html>')

// After API returns, navigate to OAuth URL
const results = await rubeClient.initiateConnection(toolkits)
popup.location.href = results[toolkit].authUrl
```

### DO NOT
- Move `window.open()` after any `await` call
- Remove the synchronous popup opening pattern

---

## Universal Applicability

All three fixes apply to ALL 500+ Composio integrations:
- Gmail, Slack, Notion, GitHub, Trello, Asana, HubSpot, Salesforce, etc.
- Any toolkit that uses Composio OAuth

---

## How to Verify Fixes Are Working

1. **Expired Detection:** Backend logs show `active=false, expiredCount=N` for expired connections
2. **Delete Before OAuth:** Backend logs show `Deleted expired X connection: ca_XXX`
3. **Popup Opens:** Multiple popup windows open immediately when clicking "Connect All"

---

## Related Files (May Need Updates Together)

- `server/routes/rube.ts` - Calls ComposioService methods
- `src/services/RubeClient.ts` - Frontend client for connection checks
- `src/pages/OAuthCallback.tsx` - Handles OAuth redirects

---

## Fix #4: Custom Integration Name Aliasing (Jan 21, 2026)

**File:** `server/services/CustomIntegrationService.ts`
**Location:** `APP_NAME_ALIASES` constant + `getAppAPIInfo()` method

### Problem
When users mentioned apps like "Pipeline CRM", the `AppDetectionService` detected `pipeline` but `KNOWN_APP_APIS` had key `pipeline_crm`. This mismatch caused custom integration cards to not appear.

### Fix
Added `APP_NAME_ALIASES` map to handle name variations:
```typescript
const APP_NAME_ALIASES: Record<string, string> = {
  'pipeline': 'pipeline_crm',
  'pipelinecrm': 'pipeline_crm',
  'pipelines': 'pipeline_crm',
  'close.io': 'close',
  'closeio': 'close',
  // ... more aliases
}

// In getAppAPIInfo():
const normalizedName = APP_NAME_ALIASES[lowerAppName] || lowerAppName
```

### DO NOT
- Remove the `APP_NAME_ALIASES` map
- Remove the alias lookup in `getAppAPIInfo()`
- Change the format of `KNOWN_APP_APIS` keys without updating aliases

---

## Fix #5: Support Level Check for Custom Integrations (Jan 21, 2026)

**File:** `server/routes/chat.ts`
**Location:** Lines ~151-181 (custom integration detection logic)

### Problem
Code was checking non-existent `app.composioSupported` property. Should check `toolDiscoveryResults` for actual support level.

### Fix
```typescript
const discoveryResult = appDetection.toolDiscoveryResults.find(
  r => r.toolName.toLowerCase() === app.name.toLowerCase() ||
       r.toolName.toLowerCase().includes(app.name.toLowerCase())
)
const hasLimitedComposioSupport = !discoveryResult ||
  discoveryResult.supportLevel === 'none' ||
  discoveryResult.supportLevel === 'partial' ||
  discoveryResult.supportLevel === 'browser_only'
```

### DO NOT
- Use `app.composioSupported` (doesn't exist)
- Remove the `toolDiscoveryResults` support level check
- Remove any of the three checked levels: `none`, `partial`, `browser_only`

---

## Fix #6: Custom Integrations Inside WorkflowPreviewCard (Jan 21, 2026)

**Files:**
- `src/components/chat/WorkflowPreviewCard.tsx` - Props, state, handler, UI
- `src/components/chat/ChatContainer.tsx` - Passing customIntegrations to WorkflowPreviewCard

### Problem
Custom integration API key buttons were displaying separately in the chat, not within the workflow card. User wanted them INSIDE the workflow card.

### Fix
1. Added `customIntegrations` and `onCustomIntegrationKeySubmit` props to WorkflowPreviewCardProps
2. Added state: `customIntegrationKeys`, `customIntegrationStatus`
3. Added handler: `handleCustomIntegrationSubmit`
4. Added UI section after auth prompts with API key input fields
5. Updated ChatContainer to pass `customIntegrations` from `pendingCustomIntegrations`
6. Removed `[CUSTOM_INTEGRATION:appName]` markers from workflow summary (only kept for non-workflow responses)

### Key Code Locations
- Props: lines 82-83
- Function signature: lines 2218-2219
- State: lines 2281-2283
- Handler: lines 2443-2473
- UI: lines 3475-3568

### DO NOT
- Remove the `customIntegrations` prop
- Remove the API key UI section from WorkflowPreviewCard
- Re-add `[CUSTOM_INTEGRATION:appName]` markers to workflow summaries

---

## Fix #7: Expanded KNOWN_APP_APIS Database (Jan 21, 2026)

**File:** `server/services/CustomIntegrationService.ts`
**Location:** `KNOWN_APP_APIS` constant (lines ~30-1970)

### Problem
The original database only had ~18 apps. Users needed support for many more apps that Composio doesn't natively support.

### Fix
Expanded KNOWN_APP_APIS from 18 to 100+ apps across 19 categories:

**Categories Added:**
| Category | Apps Count | Examples |
|----------|------------|----------|
| ACCOUNTING | 3 | Wave, FreshBooks, Kashoo |
| CRM | 6 | Pipeline CRM, Close, Freshsales, Zoho CRM, Agile CRM, Capsule |
| MARKETING | 12 | Mailchimp, ActiveCampaign, ConvertKit, Brevo, Klaviyo |
| ECOMMERCE | 8 | Shopify, WooCommerce, Gumroad, LemonSqueezy, BigCommerce |
| SUPPORT | 7 | Freshdesk, Intercom, HelpScout, Front, LiveChat |
| ANALYTICS | 7 | Plausible, Fathom, Amplitude, Mixpanel, PostHog, Heap |
| HR | 6 | Gusto, Rippling, BambooHR, Personio, Deel, HiBob |
| PAYMENTS | 4 | Chargebee, Recurly, Square, PayPal |
| PROJECT | 10 | Monday, ClickUp, Smartsheet, Airtable, Notion, Linear |
| COMMUNICATION | 6 | Twilio, SendGrid, Mailgun, Postmark, MessageBird |
| SCHEDULING | 3 | Calendly, Cal.com, Acuity |
| FORMS | 3 | Typeform, JotForm, Tally |
| SURVEYS | 3 | SurveyMonkey, Delighted, Hotjar |
| SOCIAL | 1 | Buffer |
| VIDEO | 3 | Loom, Wistia, Mux |
| DOCUMENTS | 3 | DocuSign, HelloSign, PandaDoc |
| STORAGE | 3 | Box, Cloudinary, Uploadcare |
| SEARCH | 2 | Algolia, Meilisearch |
| AI | 3 | OpenAI, Anthropic, Replicate |
| DATABASE | 3 | Supabase External, PlanetScale, Neon |

### DO NOT
- Delete any app from KNOWN_APP_APIS
- Remove the "DO NOT DELETE" protection comments
- Change the AppAPIInfo structure without updating all apps
- Remove any category of apps

---

## Fix #8: Expanded APP_NAME_ALIASES (Jan 21, 2026)

**File:** `server/services/CustomIntegrationService.ts`
**Location:** `APP_NAME_ALIASES` constant (lines ~1978-2172)

### Problem
Users might refer to apps by various names (e.g., "monday.com" vs "monday", "Sendinblue" vs "Brevo"). Need comprehensive aliases to match all variations.

### Fix
Expanded APP_NAME_ALIASES from ~15 to 120+ aliases covering:
- Company name variations (e.g., `monday.com` → `monday`)
- Rebranded names (e.g., `sendinblue` → `brevo`, `dropbox_sign` → `hellosign`)
- Common abbreviations (e.g., `chatgpt` → `openai`, `claude` → `anthropic`)
- Underscore vs camelCase variations
- API suffix variations

### DO NOT
- Remove any alias mapping
- Remove the "DO NOT DELETE" protection comments
- Break the mapping by changing KNOWN_APP_APIS keys without updating aliases

---

## Fix #9: Clipboard Auto-Paste for API Keys (Jan 21, 2026)

**File:** `src/components/chat/WorkflowPreviewCard.tsx`
**Location:** Lines ~3531-3549 (inside custom integrations UI section)

### Problem
After clicking "Get API Key" and copying the key, users had to manually paste it. This was inconvenient.

### Fix
Added a clipboard paste button that:
1. Uses `navigator.clipboard.readText()` to read from clipboard
2. Auto-fills the API key input field
3. Shows log message confirming paste
4. Handles clipboard permission errors gracefully

```typescript
<button
  onClick={async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      if (clipboardText && clipboardText.trim()) {
        setCustomIntegrationKeys(prev => ({ ...prev, [integration.appName]: clipboardText.trim() }))
        addLog?.(`📋 Pasted API key from clipboard for ${integration.displayName}`)
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err)
      addLog?.(`⚠️ Clipboard access denied - please paste manually`)
    }
  }}
  // ... button styling
>
  <Clipboard className="w-4 h-4" />
</button>
```

Also added `Clipboard` to lucide-react imports (line 26).

### DO NOT
- Remove the clipboard paste button
- Remove the error handling for clipboard permission
- Remove the `Clipboard` icon import

---

## Fix #10: Custom Integrations in Connect All Count (Jan 21, 2026)

**File:** `src/components/chat/WorkflowPreviewCard.tsx`
**Location:** `ParallelAuthPrompt` component (lines ~1546-1743)

### Problem
Custom integrations (API key apps) were shown separately from OAuth apps, creating a confusing UX. Users saw "Connect All (3 remaining)" for OAuth apps, then a separate "Connect API Keys" section - making it unclear how many total integrations needed setup.

### Fix
1. **Merged custom integrations into the "Connect All" count:**
   - Button now shows total: OAuth + API key apps (e.g., "Connect All (5 remaining)")
   - Progress bar reflects total connected / total required

2. **Custom integrations appear in the integration grid:**
   - Shows alongside OAuth apps with 🔑 icon and "Requires API key" label
   - Connected ones show green checkmark like OAuth apps

3. **API key input section only shows AFTER OAuth is complete:**
   - Condition changed from `customIntegrations.length > 0` to also require `authState.pendingIntegrations.length === 0`
   - Prevents confusion about order of operations

4. **Removed "unsupported apps" labeling:**
   - Changed to "Additional connections needed" and "apps that need API keys"
   - No negative connotation

### Key Code Changes

**ParallelAuthPromptProps** (line ~1546):
```typescript
// Added new props
customIntegrations?: CustomIntegrationInfo[]
customIntegrationStatus?: Record<string, 'pending' | 'submitting' | 'connected' | 'error'>
```

**Count calculation** (line ~1568):
```typescript
const totalRequired = integrations.length + connectedCount + customIntegrations.length
const totalConnected = connectedCount + connectedCustomCount
```

**Button text** (line ~1725):
```typescript
Connect All ({pendingOAuthCount + pendingCustomCount} remaining)
```

**API key section condition** (line ~3547):
```typescript
{customIntegrations.length > 0 && authState.pendingIntegrations.length === 0 && (
```

### DO NOT
- Remove customIntegrations from ParallelAuthPrompt props
- Show API key section before OAuth is complete
- Revert to showing custom integrations separately
- Add "unsupported" labeling back

---

## Fix #11: "Other..." Inline Custom Input (Jan 21, 2026)

**File:** `src/components/chat/ChatContainer.tsx`
**Location:** `ClarifyingOptionsWithCustomInput` component (lines ~171-262)

### Problem
The "Other..." button in clarifying questions only focused the main chat input - users couldn't type directly inline. This was confusing and broken UX.

### Fix
Created new `ClarifyingOptionsWithCustomInput` component that:
1. Shows option buttons for predefined choices
2. When "Other..." is clicked, expands into an inline text input
3. User can type custom value and press Enter or click Send
4. "Back to options" button returns to option buttons
5. Properly calls `handleSend` with the custom value

```typescript
function ClarifyingOptionsWithCustomInput({ data, onSelect }) {
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customValue, setCustomValue] = useState('')

  if (showCustomInput) {
    return (
      <input
        onKeyDown={(e) => e.key === 'Enter' && onSelect(customValue)}
        placeholder={`Type your ${data.field}...`}
      />
    )
  }

  return (
    <div>{/* Option buttons + "Other..." button */}</div>
  )
}
```

### DO NOT
- Remove the `ClarifyingOptionsWithCustomInput` component
- Revert to the old "focus main input" behavior
- Remove the inline text input functionality

---

## Fix #12: Three-Phase Workflow Generation with Tool Discovery (Jan 21, 2026)

**File:** `server/agents/index.ts`
**Location:** "THREE-PHASE WORKFLOW GENERATION" section

### Problem
Nexus generated workflows without understanding user's existing tools/apps. The first question was good, but the process didn't fully grasp the user's workspace and intent, resulting in workflows that were "far off" from what users wanted.

### Fix
Enhanced the AI prompt with three-phase approach:

**Phase 1 - Discovery (confidence < 0.60):**
- FIRST question MUST ask about current tools/apps user uses
- Ask 2-3 clarifying questions before generating ANY workflow
- Questions include: current tools, pain point, trigger source

**Phase 2 - Generation (confidence 0.60-0.84):**
- Generate workflow using user's MENTIONED tools
- ALWAYS include 2-3 `missingInfo` questions for post-workflow refinement
- missingInfo questions appear INSIDE the workflow card

**Phase 3 - Refinement (confidence >= 0.85):**
- After user answers missingInfo questions, update workflow
- Confidence high enough to execute

**Key Changes:**
- First clarifying question ALWAYS asks about current tools
- All options include "Custom..." as last choice
- missingInfo questions generated for every workflow (not just low confidence)
- Examples updated to show proper tool discovery flow

### DO NOT
- Remove the "What tools do you currently use" question from clarification
- Skip missingInfo questions for workflows (they enable post-workflow refinement)
- Remove "Custom..." option from clarifying question options
- Revert to two-phase generation

---

## Fix #13: Remove Early API Key Card from Chat (Jan 21, 2026)

**File:** `src/components/chat/ChatContainer.tsx`
**Location:** Lines ~534-539 (removed code)

### Problem
"Additional connections needed" API key card was appearing BEFORE the workflow card during clarifying questions. This was intimidating and premature - users don't need to see API key requirements until the workflow is generated.

### Fix
Removed the code that added `[CUSTOM_INTEGRATION:appName]` markers to chat messages during clarifying questions. Custom integrations are now ONLY displayed inside WorkflowPreviewCard.

```typescript
// REMOVED: "Additional connections needed" section
// Custom integrations are ONLY displayed inside WorkflowPreviewCard now.
// During clarifying questions, the workflow hasn't been generated yet, so
// showing API key requirements is premature and intimidating to users.
// The integrations are stored in pendingCustomIntegrations state and will
// be passed to WorkflowPreviewCard when the workflow is generated.
```

### DO NOT
- Re-add the "Additional connections needed" section to chat messages
- Show API key requirements before the workflow card appears

---

## Fix #14: Custom... Option Expands to Input (Jan 21, 2026)

**File:** `src/components/chat/ChatContainer.tsx`
**Location:** `ClarifyingOptionsWithCustomInput` component (lines ~242-278)

### Problem
When AI generated clarifying questions with "Custom..." as an option, clicking it submitted "Custom..." as literal text instead of expanding into an inline input field.

### Fix
Added logic to detect and filter out "custom" type options from AI responses, treating them as triggers for inline input mode:

```typescript
// Helper to detect if an option is a "custom/other" type that should trigger inline input
const isCustomOption = (option: string): boolean => {
  const lower = option.toLowerCase().trim()
  return (
    lower === 'custom' ||
    lower === 'custom...' ||
    lower === 'other' ||
    lower === 'other...' ||
    lower.startsWith('custom ') ||
    lower.startsWith('other ')
  )
}

// Filter out custom-type options from regular options (we'll handle them specially)
const regularOptions = data.options.filter(opt => !isCustomOption(opt))
const hasCustomOptionFromAI = data.options.some(opt => isCustomOption(opt))
```

### DO NOT
- Remove the `isCustomOption` helper function
- Allow "Custom..." to be submitted as literal text
- Remove the inline input expansion behavior

---

## Fix #15: Concise Response Style (Jan 21, 2026)

**File:** `server/agents/index.ts`
**Location:** "RESPONSE STYLE: BE CONCISE" section (lines ~166-191)

### Problem
AI responses were too verbose with preambles like "Perfect! I'd love to help...", "Great! I can work with...", and unnecessary technical explanations about "partial support" or action counts.

### Fix
Added explicit "RESPONSE STYLE: BE CONCISE" instructions to AI prompt:

```
DO NOT:
- Start with "Perfect!", "Great!", "I'd love to...", "Absolutely!"
- Add preamble like "To build the perfect workflow for YOUR setup..."
- Explain technical details like "partial support", "X actions available", "limited API"
- Add unnecessary context about tool capabilities
- Say "I should note..." or give disclaimers

DO:
- Get straight to the point
- Ask questions directly without fluff
- Keep message text under 2 sentences when possible
- Let the workflow card speak for itself
```

Also updated all example messages to be concise (e.g., "Here's your workflow:" instead of "Perfect! Based on your setup, here's an automated workflow. A few quick details to perfect it:")

### DO NOT
- Remove the "RESPONSE STYLE: BE CONCISE" section
- Add verbose example messages back
- Allow the AI to explain technical support levels to users

---

## Fix #16: Context-Aware missingInfo Questions (Jan 21, 2026)

**File:** `server/agents/index.ts`
**Location:** "missingInfo Questions" and "CONTEXT-AWARE QUESTIONS" sections

### Problem
AI was asking redundant questions in missingInfo that user had already answered. For example, asking "Which CRM are you using?" when user already said "Pipeline CRM" in their request.

### Fix
Added explicit instructions to make questions context-aware:

```
**missingInfo Questions (POST-WORKFLOW) Best Practices:**
- ONLY ask for information NOT YET PROVIDED by the user
- If user said "Pipeline CRM" → DO NOT ask "Which CRM?" (you already know!)
- If user said "sync to Dropbox" → DO NOT ask "Which cloud storage?" (you already know!)

**CONTEXT-AWARE QUESTIONS - CRITICAL:**
Review the ENTIRE conversation before generating missingInfo questions. If the user already mentioned:
- A specific tool → Don't ask which tool
- A specific frequency → Don't ask how often
- A specific destination → Don't ask where to send
- A specific trigger → Don't ask what triggers it

Questions should INCREASE CONFIDENCE, not ask for already-known information.
```

### DO NOT
- Remove the context-awareness instructions
- Allow missingInfo to ask redundant questions
- Generate questions for information already in the conversation

---

**Last Updated:** January 21, 2026
**Author:** Claude Opus 4.5 + Human CEO

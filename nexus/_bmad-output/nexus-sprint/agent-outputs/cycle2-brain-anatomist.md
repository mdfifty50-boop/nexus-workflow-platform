# Cycle 2: Brain Anatomist Report - Complete System Prompt Anatomy

**Agent:** Brain Anatomist (replacing Cycle 1 brain-surgeon)
**Source Files:**
- `nexus/server/agents/index.ts` (lines 156-951) - Nexus personality/system prompt
- `nexus/server/routes/chat.ts` (lines 1-899) - Server-side enrichment & delivery

---

## 1. STRUCTURE MAP - Nexus Personality Prompt Sections

The `nexus:` agent definition is at `server/agents/index.ts:156-951`. The `personality` field spans lines 164-950. Here is every section in order:

| # | Section Heading | Line Range | Purpose |
|---|----------------|------------|---------|
| 1 | Opening Identity | 164 | "You are Nexus..." identity declaration |
| 2 | `## RESPONSE STYLE: BE CONCISE` | 166-193 | @NEXUS-FIX-015 - Anti-verbosity rules |
| 3 | `## CRITICAL: CONVERSATION MEMORY` | 194-202 | Remember user details from conversation |
| 4 | `## THREE-PHASE WORKFLOW GENERATION` | 204-346 | @NEXUS-FIX-012 - Discovery/Generation/Refinement |
| 5 | `## WORKFLOW REFINEMENT MODE` | 348-354 | Updating existing workflows |
| 6 | `## RESPONSE FORMAT` | 355-395 | JSON format rules with examples |
| 7 | `## NEXUS IS THE WORKFLOW ENGINE` | 397-405 | "NEVER recommend external tools" |
| 8 | `## INTELLIGENCE LAYERS` | 407-414 | 5-layer internal reasoning framework |
| 9 | `## UNDERSTANDING FRAMEWORK` | 415-421 | 4-level understanding (Surface/Implicit/Optimal/Proactive) |
| 10 | `## SMART TOOL SELECTION` | 422-427 | Arabic tools, Kuwait defaults |
| 11 | `## WORKFLOW STEP TYPES` | 428-434 | Tool IDs for triggers/actions/payments/AI |
| 12 | `## AI-POWERED STEPS` | 436-455 | @NEXUS-FIX-144 - `tool: "ai"` steps with complexity |
| 13 | `## WHATSAPP PERSONAL` | 456-468 | @NEXUS-FIX-146 - Native WhatsApp via Baileys |
| 14 | `## KUWAIT PAYMENT LINK WORKFLOWS` | 470-489 | @NEXUS-FIX-048 - KNET/MyFatoorah |
| 15 | `## WHATSAPP INTEGRATIONS (TWO OPTIONS)` | 491-515 | Personal vs Business WhatsApp |
| 16 | `## WHATSAPP RESPONSE MODE` | 517-584 | @NEXUS-FIX-079 - WhatsApp formatting rules |
| 17 | `## CRITICAL: CONFIRMATION-FIRST UX` | 586-664 | @NEXUS-FIX-125 - Infer params, never tools |
| 18 | `## EXAMPLE RESPONSES` | 665-685 | Concrete JSON response examples |
| 19 | `## RULES` | 687-707 | 7 core rules + Legal/CS/PM domain patterns |
| 20 | `## REGIONAL CONTEXT ENGINE` | 709-726 | Kuwait & GCC context tables |
| 21 | `## TOOL SELECTION INTELLIGENCE` | 727-741 | Arabic dialect support, factor matrix |
| 22 | `## MOBILE-FIRST THINKING` | 743-760 | Time-to-first-workflow targets |
| 23 | `## SMART QUESTIONS LIBRARY` | 762-770 | Lookup table for clarifying questions |
| 24 | `## ANTI-PATTERNS TO AVOID` | 772-788 | 5 critical do/don't pairs |
| 25 | `## RESPONSE PATTERNS` | 789-836 | Greetings, Workflow, Generation patterns |
| 26 | `## AI AGENCY CONTEXT` | 837-891 | Industry-aware intelligence + role adaptation |
| 27 | `## ARABIC COMMUNICATION MODE` | 893-912 | Gulf/Kuwaiti dialect rules |
| 28 | `## BILINGUAL CODE-SWITCHING PROTOCOL` | 914-936 | Mixed Arabic+English handling |
| 29 | `## CEO VISION` | 938-945 | Guiding philosophy |
| 30 | `## AVAILABLE INTEGRATIONS` | 947-948 | Integration list |
| 31 | Closing Statement | 950 | "Remember: You ARE Claude AI..." |

---

## 2. JSON FORMAT INSTRUCTIONS

### Exact Quote (lines 355-395):

```
## RESPONSE FORMAT

**CRITICAL RULE:** You MUST respond with valid JSON. NO natural language outside JSON structure.

**ENFORCEMENT RULES:**
1. When intent is "clarifying" → you MUST include "clarifyingQuestions" array with 2-3 questions
2. Each clarifyingQuestions item MUST have: question, options (array of 4-5 choices), field
3. NEVER put questions in "message" without also putting them in "clarifyingQuestions" array
4. If you're asking questions, intent MUST be "clarifying" AND clarifyingQuestions MUST exist

**ONLY for pure greetings (hi, hello, thanks) - NO automation intent:**
{"message": "Your response", "shouldGenerateWorkflow": false, "intent": "greeting"}

**For VAGUE automation requests (confidence < 0.60) - ASK QUESTIONS FIRST:**
[...full JSON example with clarifyingQuestions array...]

**For SPECIFIC automation requests (confidence >= 0.60) - GENERATE WORKFLOW WITH ONLY USER-MENTIONED TOOLS:**
[...full JSON example with workflowSpec...]
```

### Key JSON Fields Expected:
- `message` (string) - Response text
- `shouldGenerateWorkflow` (boolean) - Controls card display
- `intent` (string) - "greeting" | "question" | "clarifying" | "workflow"
- `confidence` (number 0-1) - Workflow confidence score
- `workflowSpec` (object) - Full workflow specification
- `clarifyingQuestions` (array) - Questions with options
- `missingInfo` (array) - Post-workflow refinement questions
- `assumptions` (array) - What was assumed
- `refiningWorkflowId` (string) - For updating existing workflows
- `inferredParams` (array) - Parameter inference with confidence
- `whatsappFormat` (object) - WhatsApp-specific formatting

---

## 3. THREE-PHASE SYSTEM

### Exact Quotes (lines 204-309):

**Phase 1 - DISCOVERY (confidence < 0.60):**
```
For vague requests like "help me onboard clients" or "automate my business":
- DO NOT generate a workflow yet
- Ask 2-3 targeted clarifying questions to understand:
  1. **Source Tools** - What apps/tools they ALREADY use for the INPUT data
  2. **Destination Tools** - How they want to be NOTIFIED or where they want OUTPUT to go
  3. **Specific Pain Point** - What exact problem they want solved
- Return: shouldGenerateWorkflow: false, intent: "clarifying", clarifyingQuestions: [...]
```

**Phase 2 - GENERATION (confidence 0.60-0.84):**
```
Once you have enough info from Phase 1:
- Generate the workflow using ONLY their MENTIONED tools — no extras
- Every tool in workflowSpec.steps MUST have been explicitly stated or confirmed by the user
- ALWAYS include 2-3 "missingInfo" questions for post-workflow refinement
- These questions appear INSIDE the workflow card for quick refinement
- If you need an additional tool not yet discussed, put it in missingInfo as a question, NOT as an assumed step
```

**Phase 3 - REFINEMENT (confidence >= 0.85):**
```
After user answers missingInfo questions:
- Update the workflow with their answers
- Confidence should now be high enough to execute
```

---

## 4. VAGUENESS TRIGGERS

### Exact Quote (lines 244-287):

```
**VAGUENESS TRIGGERS - ASK QUESTIONS FOR THESE:**
@NEXUS-FIX-102: Enhanced vagueness detection - DO NOT REMOVE
If user's request contains ANY of these patterns, it's TOO VAGUE - ask clarifying questions FIRST:

Generic verbs (without specifics):
- "automate", "help me", "manage", "track", "handle", "streamline", "optimize"
- "set up", "create", "build" (without clear output)
- "monitor", "alert", "notify" (without specifying the notification channel)

Missing specifics:
- No tool/app mentioned (e.g., "send emails" but which email service?)
- No data source mentioned (e.g., "track expenses" but from where?)
- No destination mentioned (e.g., "save files" but to where?)
- No notification channel mentioned (e.g., "alert me" but via what?)

Vague scope references:
- "my emails", "my files", "my data", "my business"
- "customer data", "client info", "team stuff"
- "everything", "all of it", "the whole thing"

Ambiguous timing:
- "regularly", "when needed", "sometimes", "often"
- "automatically" (without trigger specified)

Examples that REQUIRE Phase 1 questions:
- "Help me with emails" → ASK: What do you want to do with emails?
- "Automate my business" → ASK: What's the most time-consuming task?
- "Track my customers" → ASK: What tool do you use for customer data? AND Where should I send updates?
- "Send notifications" → ASK: What should trigger the notification? AND Via what channel?
- "Monitor nurses" → ASK: What system tracks their schedules? AND How should supervisors be alerted?
```

---

## 5. COMPLAINT PATTERNS (FIX-165)

### Exact Quote (lines 253-264):

```
@NEXUS-FIX-165: Complaint/problem patterns - DO NOT REMOVE
Business problem descriptions (user is reporting an issue, NOT requesting a specific workflow):
- "dropping", "declining", "going down", "decreasing", "falling", "losing"
- "تنخفض", "ينخفض", "تراجع", "انخفاض", "خسارة" (Arabic complaint patterns)
- "struggling", "problem with", "issue with", "not working", "broken"
- "too slow", "too expensive", "too manual", "wasting time"
- "how do I", "what should I", "should I" (strategic questions, not automation requests)
When user describes a PROBLEM or asks a STRATEGIC QUESTION:
- This is NOT a workflow request — do NOT generate shouldGenerateWorkflow: true
- Instead, ask DIAGNOSTIC questions: "What changed?", "When did this start?", "What metrics are you tracking?"
- Think like a business consultant FIRST, then suggest automation AFTER understanding the problem
- confidence MUST be < 0.40 for complaint/problem patterns
```

---

## 6. CONFIDENCE RULES

### Exact Quotes:

**Confidence Scoring (lines 301-304):**
```
- < 0.60: TOO VAGUE - Ask clarifying questions FIRST
- 0.60-0.84: Generate workflow with ONLY user-confirmed tools + include 2-3 missingInfo questions
- 0.85-1.0: High confidence - workflow ready to execute
```

**Complaint confidence cap (line 264):**
```
- confidence MUST be < 0.40 for complaint/problem patterns
```

**Think-with-me mode confidence (chat.ts line 63):**
```
5. **HIGH BAR FOR CONFIDENCE**: Only suggest workflow when confidence > 0.85
```

**Parameter inference confidence thresholds (lines 646-649):**
```
- 0.9+ → Auto-fill, show as confirmed
- 0.7-0.89 → Show as suggestion, easy to change
- <0.7 → Show with alternatives prominently displayed
```

---

## 7. TOOL SELECTION INTELLIGENCE

### Exact Quote (lines 727-741):

```
## TOOL SELECTION INTELLIGENCE

**Pick the RIGHT tool, not just any tool.**

| Factor | Question | Impact |
|--------|----------|--------|
| Language | What language is content? | Arabic dialect → Deepgram/Speechmatics/ElevenLabs Scribe (96.9%), NOT Otter |
| Volume | How much data? | High volume → batch APIs, not per-item |
| Accuracy | How critical? | High stakes → premium tier |
| Speed | Real-time or batch? | Real-time → streaming APIs |
| Region | Where is user? | Kuwait → Gulf Arabic support essential |

### Arabic Dialect Support Excellence
For Kuwaiti/Gulf Arabic: Deepgram, ElevenLabs Scribe (96.9% accuracy), Speechmatics, Voiser (ar-KW specific)
NEVER recommend: Otter.ai for Arabic (poor dialect support)
```

### Smart Tool Selection Section (lines 422-427):
```
## SMART TOOL SELECTION

For Arabic content: Use Deepgram, ElevenLabs Scribe, Speechmatics (NOT Otter.ai)
For Kuwait: Apply VAT 5%, KWD currency, Sunday-Thursday week
For notifications: Prefer WhatsApp (dominant in Kuwait) - use personal WhatsApp by default
```

---

## 8. REGIONAL CONTEXT

### Exact Quote (lines 709-726):

```
## REGIONAL CONTEXT ENGINE

### Kuwait (Primary Market)
| Context | Intelligence |
|---------|-------------|
| Work Week | Sunday-Thursday |
| Business Hours | 8:00-17:00 (some split shifts) |
| Holidays | Islamic calendar + National days |
| Currency | KWD (strongest currency globally) |
| VAT | 5% (implemented 2024) |
| Payment | KNET dominant (90% of online payments), MyFatoorah aggregator, payment links via WhatsApp |
| Communication | WhatsApp Business primary |
| Language | Arabic (Gulf/Kuwaiti dialect), English for business |
| Regulations | Kuwait Labor Law, Commercial Companies Law, MOCI |

### GCC Context
UAE/Saudi/Qatar/Bahrain/Oman: Fri-Sat weekend, different workforce compositions, Vision 2030 initiatives
```

---

## 9. AI NODE INSTRUCTIONS (Feb 16 Additions)

### Exact Quote (lines 436-455):

```
## AI-POWERED STEPS (CRITICAL - READ CAREFULLY)
@NEXUS-FIX-144: AI step classification for universal execution - DO NOT REMOVE

When a workflow step requires AI to GENERATE, SUMMARIZE, TRANSLATE, ANALYZE, or TRANSFORM content (not fetch from an external service), you MUST use:
- tool: "ai" (NOT "generate", NOT "openai", NOT "anthropic" - just "ai")
- type: "action"
- description: A DETAILED prompt for what the AI should produce. This IS the prompt that Claude will execute. Be specific!
- config: { "executorHint": "ai", "complexity": "simple|moderate|complex" }

Complexity guide (controls which Claude model runs the step):
- "simple": quotes, greetings, one-liners, labels, tags, short translations, jokes, tips → Uses Haiku ($0.80/1M tokens)
- "moderate": summaries, reports, email drafts, longer translations, content creation → Uses Sonnet ($3/1M tokens)
- "complex": business analysis, strategic planning, multi-factor evaluation, research → Uses Opus ($15/1M tokens)
```

---

## 10. WHATSAPP INSTRUCTIONS

### Personal WhatsApp (lines 456-468):
```
## WHATSAPP PERSONAL (CRITICAL)
@NEXUS-FIX-146: Native WhatsApp via Baileys - DO NOT REMOVE

When a workflow sends to the user's PERSONAL WhatsApp (connected via QR code), ALWAYS use:
- tool: "whatsapp" (NOT "whatsapp-business")
- type: "action"
- config: { "executorHint": "native-whatsapp" }
- The message content flows automatically from previous steps (AI output → WhatsApp message)
```

### Two Options (lines 491-515):
```
**Option 1: WhatsApp Web (Personal) - tool: "whatsapp"**
- For PERSONAL WhatsApp accounts
- Uses QR code or pairing code authentication (whatsapp-web.js)
- Best for: Personal notifications, individual users, testing

**Option 2: WhatsApp Business API - tool: "whatsapp-business"**
- For BUSINESS accounts via AiSensy BSP
- Uses API key authentication (Composio integration)
- Best for: Business automation, bulk messaging, customer support
```

### Default Routing (lines 506-511):
```
- DEFAULT for all WhatsApp mentions → tool: "whatsapp" (personal WhatsApp Web)
- ONLY when user explicitly says "WhatsApp Business" or "WA Business" → tool: "whatsapp-business"
- When in doubt, ALWAYS default to tool: "whatsapp" (personal)
```

---

## 11. ANTI-PATTERNS

### Exact Quote (lines 772-788):

```
## ANTI-PATTERNS TO AVOID

- DON'T: Execute partial workflows
  DO: Complete chain (Recording→Transcription→Summary→Storage→Notification)

- DON'T: Assume English
  DO: Ask about language, recommend dialect-appropriate tools

- DON'T: Recommend available over optimal
  DO: Recommend BEST tool for specific use case with trust score

- DON'T: Ignore regional context
  DO: Apply Kuwait SME requirements (VAT, work week, KNET, WhatsApp)

- DON'T: Show all complexity on mobile
  DO: Progressive disclosure, voice-first, one-tap actions
```

### Response Style Anti-Patterns (lines 171-193):
```
DO NOT:
- Start with "Perfect!", "Great!", "I'd love to...", "Absolutely!"
- Add preamble like "To build the perfect workflow for YOUR setup..."
- Explain technical details like "partial support", "X actions available", "limited API"
- Add unnecessary context about tool capabilities
- Say "I should note..." or give disclaimers

**Examples of BAD messages (NEVER DO THESE):**
- "Perfect! I'd love to help you with that! Let me understand your setup better..."
- "Great! I can work with both tools, though I should note that X has partial support with 50 actions..."
- "I'd love to help streamline your client onboarding! To build the perfect workflow for YOUR specific setup, I have a few quick questions:"
```

### Zero-Assumed-Tools Rule (lines 210-216):
```
@NEXUS-FIX-121: Zero assumed tools - DO NOT REMOVE
NEVER include a tool/app in a workflow that the user has NOT explicitly mentioned or selected.
- User said "BambooHR" → Use BambooHR. Do NOT add Slack, ClickUp, or any other tool they didn't mention.
- User said "notify me" → ASK HOW (Email? Slack? WhatsApp? SMS?) — do NOT assume Slack.
- User said "log it" → ASK WHERE (Sheets? Notion? ClickUp? Their existing system?) — do NOT assume ClickUp.
- If you need a tool the user hasn't mentioned, ASK first via clarifyingQuestions. NEVER silently add it.
```

---

## 12. SERVER-SIDE ENRICHMENT (chat.ts - buildCachedSystemPrompt)

### Function: `buildCachedSystemPrompt` (chat.ts lines 112-143)

This function constructs the final system prompt sent to Claude. It injects additional context BEYOND what's in the personality field.

**What it does:**

1. **User Context Injection (lines 118-124):**
   - If personality contains `{{USER_CONTEXT}}` placeholder, replaces it with `userContext`
   - Otherwise, APPENDS user context as: `## USER CONTEXT (for inference)\n${userContext}`
   - User context comes from `UserContextService` on the frontend (business profile, industry, role)

2. **Think-With-Me Mode Injection (lines 127-130):**
   - When `chatMode === 'think_with_me'`, PREPENDS the `THINK_WITH_ME_DIRECTIVE` constant
   - This overrides normal behavior to be more focused/question-driven

3. **Team Context Block (lines 137-142):**
   - Static `TEAM_CONTEXT` string listing all 8 BMAD agents
   - Marked with `cache_control: { type: 'ephemeral' }` for Anthropic prompt caching
   - Tells Claude it can route users to other agent specialists

### Additional Context Injected in Route Handler (chat.ts lines 332-370):

Before `buildCachedSystemPrompt` is called, the route handler enriches `userContext` with:

4. **Language Directive (lines 337-366):**
   - For Arabic (`ar-*`): Injects massive `CRITICAL LANGUAGE RULE` block with:
     - Explicit instruction to respond in Arabic (Gulf/Kuwaiti dialect)
     - JSON field name rules (keys in English, values in Arabic)
     - Complete Arabic workflow response example
     - Complete Arabic greeting response example
     - Rule: "Do NOT wrap JSON in markdown code blocks. Return ONLY the raw JSON object."
   - For other non-English languages: Simple instruction to respond in that language
   - **@NEXUS-FIX-160**: Improved Arabic language instruction
   - **@NEXUS-FIX-161**: Arabic workflow step names and descriptions

5. **Tool Context from App Detection (line 367):**
   - `appDetectionService.detectAndAnalyze()` scans the message for app mentions
   - Returns `contextEnrichment` string with Composio support levels, available actions, etc.
   - Appended to enriched user context

6. **Pre-Parsed Intent Context (line 369):**
   - `intentContext` from `IntentResolver` on the frontend
   - Appended as `## Pre-Parsed Intent\n${intentContext}`

### Think-With-Me Directive (chat.ts lines 53-81):

Full text of the injected directive:

```
## MODE: THINK WITH ME (ACTIVE)

You are in FOCUSED PROBLEM-SOLVING mode. Your approach MUST be:

1. **ASK FIRST, ALWAYS**: Before ANY workflow suggestion, ask 2-3 precise questions
2. **BE DIRECT**: No fluff, no pleasantries, no extra words
3. **ONE QUESTION AT A TIME**: Don't overwhelm
4. **BUILD UNDERSTANDING**: Each question should build on previous answers
5. **HIGH BAR FOR CONFIDENCE**: Only suggest workflow when confidence > 0.85

**DO NOT in this mode:**
- Generate workflow cards until you have HIGH confidence (>0.85)
- Add conversational words ("Great question!", "I understand...", "I'd love to help!")
- Ask more than 2-3 questions per response
- Show workflow until you fully understand the problem
```

### Team Context (chat.ts lines 84-96):

```
You are part of the BMAD team at Nexus. Your colleagues are:
- Larry (Business Analyst) - requirements and user stories
- Mary (Product Manager) - strategy and prioritization
- Alex (Solutions Architect) - system design and architecture
- Sam (Senior Developer) - coding and implementation
- Emma (UX Designer) - user experience and design
- David (DevOps Engineer) - deployment and infrastructure
- Olivia (QA Lead) - testing and quality
- Nexus (AI Orchestrator) - coordination and general help

If a question is better suited for a colleague, suggest the user speak with them directly.
```

### Template Short-Circuit (chat.ts lines 232-250):

Before Claude is even called, a template matching system runs:
- `templateService.matchUserInput()` checks the first user message against pre-built templates
- If match score >= 0.8, returns a pre-built response **bypassing Claude entirely**
- Only runs on the FIRST user message (`userMessageCount <= 1`)
- @NEXUS-FIX-126: Prevents templates from overriding mid-conversation tool preferences

### Prompt Guard (chat.ts lines 198-225):

Before sending to Claude:
- **Rate limiting**: Per-user rate check via `promptGuardService.checkRateLimit()`
- **Input sanitization**: `promptGuardService.sanitizeUserInput()` strips invisible chars, flags injection patterns
- **Output validation**: `promptGuardService.validateOutput()` checks for leaked secrets/keys

---

## 13. COMPLETE FIX MARKERS IN THE PROMPT

These `@NEXUS-FIX-XXX` markers appear in the personality field:

| Marker | Line | Purpose |
|--------|------|---------|
| @NEXUS-FIX-015 | 167 | Concise response style |
| @NEXUS-FIX-012 | 205 | Three-phase workflow generation |
| @NEXUS-FIX-121 | 211 | Zero assumed tools |
| @NEXUS-FIX-122 | 238 | Input AND output tool discovery |
| @NEXUS-FIX-102 | 245 | Enhanced vagueness detection |
| @NEXUS-FIX-165 | 253 | Complaint/problem patterns |
| @NEXUS-FIX-016 | 325 | Context-aware missingInfo questions |
| @NEXUS-FIX-123 | 335 | Defaults only for parameters, never for tools |
| @NEXUS-FIX-144 | 437 | AI step classification |
| @NEXUS-FIX-146 | 457 | Native WhatsApp via Baileys |
| @NEXUS-FIX-048 | 471 | Kuwait payment gateway knowledge |
| @NEXUS-FIX-079 | 518 | WhatsApp-optimized responses |
| @NEXUS-FIX-125 | 652 | Infer parameters not tools |
| @NEXUS-FIX-124 | 795 | Accuracy over speed |

Fix markers in `chat.ts`:
| Marker | Line | Purpose |
|--------|------|---------|
| @NEXUS-FIX-022 | 10, 286, 677 | Multi-tenant per-user entity ID |
| @NEXUS-FIX-102 | 20, 29-30 | Rate limiter IPv6 validation |
| @NEXUS-FIX-101 | 54, 126-129 | Think-with-me mode |
| @NEXUS-FIX-126 | 229-231, 624 | Template first-message-only |
| @NEXUS-FIX-160 | 334, 715-716, 797 | Arabic language instruction |
| @NEXUS-FIX-161 | 335, 716 | Arabic workflow step names |
| @NEXUS-FIX-164 | 828-830 | Safe fallback prevents raw JSON dump |

---

## 14. GAPS - What's MISSING From the Prompt

### GAP 1: No Error Recovery Instructions
The prompt tells Claude how to generate workflows but has ZERO guidance on what to say when:
- A workflow execution fails
- An integration returns an error
- A tool is unavailable or down
- The user's OAuth connection expired

**Impact:** Claude will improvise error messages, leading to inconsistent UX.

### GAP 2: No Multi-Step Conversation State Machine
The three-phase system describes phases but there is NO explicit instruction about:
- How to handle user going BACK (changing a previous answer)
- What to do if user provides PARTIAL answers (answers 1 of 3 questions)
- How to handle conversation CONTEXT LOSS (very long conversations)
- Maximum conversation turns before defaulting to best-guess

**Impact:** Long conversations may drift or repeat questions.

### GAP 3: No Explicit Token/Cost Awareness
The prompt says nothing about:
- Keeping responses concise to save API costs
- When to use shorter vs. longer responses
- Cost implications of very long workflowSpec objects

**Impact:** The RESPONSE STYLE section covers conciseness for UX, but not for cost.

### GAP 4: No Multi-Language Workflow Names Beyond Arabic
The personality only has Arabic-specific instructions. For other languages (French, Hindi, Spanish, etc.):
- No guidance on whether workflow names should be localized
- No guidance on step name localization
- The server-side enrichment (chat.ts) has a generic fallback but it's minimal

**Impact:** Non-Arabic, non-English users get inconsistent localization.

### GAP 5: No Rate/Quota Messaging
The prompt has no instructions for what to say when:
- User hits rate limit (the server returns 429, but Claude doesn't know about it)
- User is on a free tier with limited workflows
- Composio connection limits reached

**Impact:** Not relevant if Claude never sees these states, but if it does, it has no guidance.

### GAP 6: No Onboarding/First-Time User Flow
The prompt has no special instructions for:
- Brand new users who have never used Nexus
- Users who haven't connected any integrations yet
- Progressive disclosure of features

**Impact:** First interaction may overwhelm new users with capability descriptions.

### GAP 7: No Explicit Workflow EXECUTION Instructions
The prompt extensively covers workflow GENERATION (JSON format) but says nothing about:
- What to say when a workflow is executing
- How to present execution results
- How to handle partial execution (3 of 5 steps succeeded)
- Post-execution follow-up suggestions

**Impact:** The execution UX is handled entirely by frontend code, but Claude could provide better contextual messages.

### GAP 8: No Guardrails Against Hallucinated Tool Names
The prompt lists valid tool IDs (line 431-434, 692) but there is no explicit instruction like:
- "ONLY use tool IDs from this list"
- "If a user mentions a tool not in this list, say X"

The `requiredIntegrations` and `tool` fields could contain hallucinated values like "bamboohr" or "pipedrive" that don't match any Composio toolkit.

**Impact:** The execution engine may fail on invalid tool IDs with no graceful recovery.

### GAP 9: No Data Privacy Instructions
The prompt has no guidance on:
- Not asking for passwords or API keys
- Not storing sensitive data in workflow descriptions
- PII handling in workflow parameters
- GDPR/data residency considerations

**Impact:** Claude could inadvertently encourage users to paste sensitive data.

### GAP 10: No Timeout/Availability Instructions
The prompt assumes all tools are always available. No guidance for:
- What to say if a tool integration is in maintenance
- How to handle slow API responses
- Fallback suggestions when a preferred tool is unavailable

**Impact:** Claude cannot gracefully handle service outages.

### GAP 11: Missing `{{USER_CONTEXT}}` Placeholder
The personality field does NOT contain a `{{USER_CONTEXT}}` placeholder. The code at chat.ts:119 checks for it:
```typescript
if (userContext && agent.personality.includes('{{USER_CONTEXT}}')) {
    personalityWithContext = agent.personality.replace('{{USER_CONTEXT}}', userContext)
} else if (userContext) {
    // Append user context if no placeholder exists
    personalityWithContext = agent.personality + `\n\n## USER CONTEXT (for inference)\n${userContext}`
}
```
It always falls through to the `else` branch, appending user context at the END. This means user context (industry, role, preferences) appears AFTER all prompt instructions, which may reduce its influence on Claude's reasoning.

**Recommendation:** Add `{{USER_CONTEXT}}` placeholder in the personality, ideally right before the RESPONSE FORMAT section so Claude has industry context before generating responses.

### GAP 12: No Streaming JSON Parsing Recovery
The prompt assumes Claude always returns perfect JSON. But in streaming mode (chat.ts lines 797-824), the brace-depth parser can fail on:
- Escaped quotes in Arabic text
- Unicode edge cases
- Claude starting with natural language before JSON

The fallback (line 830) is a generic message, which loses all Claude reasoning.

---

## 15. FINAL SYSTEM PROMPT ASSEMBLY ORDER

When a user sends a chat message, the COMPLETE system prompt is assembled in this order:

```
[IF think_with_me mode]
  1. THINK_WITH_ME_DIRECTIVE (82 lines of focused problem-solving rules)

[ALWAYS]
  2. Agent Personality (787 lines for Nexus agent)
     - Identity declaration
     - Response style rules
     - Conversation memory
     - Three-phase workflow generation
     - JSON format with examples
     - Tool types and AI steps
     - WhatsApp instructions
     - Payment instructions
     - Confirmation-first UX
     - Example responses
     - Regional context
     - Industry/role adaptation
     - Arabic/bilingual rules
     - CEO vision

[IF language !== 'en-US']
  3. Language directive (injected into personality via append)
     - For Arabic: 30+ lines of JSON format examples
     - For other: 1 line

[IF app detection found tools]
  4. Tool context enrichment (appended to user context)

[IF intentContext provided]
  5. Pre-parsed intent data (appended to user context)

[IF userContext provided (always for logged-in users)]
  6. User context (industry, role, business profile) - appended at END

[ALWAYS - separate cache block]
  7. TEAM_CONTEXT (8 agent descriptions, cache_control: ephemeral)
```

**Total estimated prompt size:** ~4,000-5,000 tokens for the base personality, plus ~500-2,000 tokens for enrichments.

---

## 16. PROMPT CACHING STRATEGY

From `chat.ts` lines 98-143:

- **Block 1 (text):** Agent personality + all injected context (NOT cached - changes per request due to user context)
- **Block 2 (text, cache_control: ephemeral):** Team context (CACHED - identical across all requests)

This means only ~100 tokens of team context get cached. The 4,000+ token personality is re-sent every request.

**Optimization opportunity:** If user context were injected via a placeholder in the MIDDLE of the personality, the personality text BEFORE the placeholder could be cached in its own block.

---

*Report generated by Brain Anatomist agent, Cycle 2*
*Source: server/agents/index.ts (lines 156-951), server/routes/chat.ts (lines 1-899)*

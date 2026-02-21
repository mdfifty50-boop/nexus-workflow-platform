# Signal Tracer: Complete Message Flow Audit

## Scenario: User types "my sales are dropping" and hits Enter

---

## ASCII FLOW DIAGRAM (Complete Path)

```
USER TYPES "my sales are dropping" → hits Enter
    |
    v
ChatInput.tsx onSend(content)
    |
    v
ChatContainer.tsx:753 handleSend(content)
    |
    +--[1] parseNodeEditCommand(content) → null (not an edit command)
    |
    +--[2] addMessage(content, 'user') → adds user bubble to chat
    |       setIsLoading(true)
    |       userMemoryService.recordEvent('chat_sent')
    |
    +--[3] Check: conversationState === 'asking_questions'? → NO (idle)
    |
    +--[4] SYNC conversation history into NexusAIService (line 850-851)
    |       nexusAIService.setConversationHistory(messages)
    |
    +--[5] Create empty assistant message for streaming (line 856)
    |       streamingMsg = addMessage('', 'assistant')
    |       updateMessage(streamingMsg.id, { isStreaming: true })
    |       setIsLoading(false)  ← hides ThinkingIndicator
    |
    +--[6] nexusAIService.chatStream(content, onToken, {chatMode, language})
    |       |
    |       v
    |   NexusAIService.ts:424 chatStream()
    |       |
    |       +--[6a] Push user msg to conversationHistory (with dedup guard, FIX-166)
    |       +--[6b] Cap history to last 10 messages (line 442-444)
    |       +--[6c] persistHistory() to localStorage
    |       +--[6d] _explicitLanguageSet = false (language is 'en-US')
    |       +--[6e] buildUserContext() → returns temporal, memory, industry, maturity, language
    |       +--[6f] userContextService.extractFromMessage() → extracts entities
    |       +--[6g] IntentResolverService.resolve(userMessage) → pre-parse integrations
    |       |       For "my sales are dropping" → likely: no integrations detected,
    |       |       confidence low, no unsupportedTools
    |       |
    |       +--[6h] fetch('/api/chat/stream', { POST })
    |               |
    |               v
    |           SERVER: chat.ts:551 POST /stream handler
    |               |
    |               +--[S1] Set SSE headers (Content-Type: text/event-stream)
    |               +--[S2] Check ANTHROPIC_API_KEY exists
    |               +--[S3] Rate limit check (promptGuardService.checkRateLimit)
    |               +--[S4] Input sanitization (promptGuardService.sanitizeUserInput)
    |               |
    |               +--[S5] TEMPLATE MATCH CHECK (lines 625-643)
    |               |       userMessageCount = 1 (first message)
    |               |       templateService.matchUserInput("my sales are dropping")
    |               |       Score must be >= 0.8 to match
    |               |       "my sales are dropping" → unlikely to match any template
    |               |       (templates are for specific patterns like "gmail to sheets")
    |               |       → SKIP template, continue to Claude
    |               |
    |               +--[S6] Determine agent: agentId='nexus' → getAgent('nexus')
    |               |
    |               +--[S7] App detection (appDetectionService.detectAndAnalyze)
    |               |       "my sales are dropping" → likely no apps detected
    |               |
    |               +--[S8] Build enriched context
    |               |       language = undefined or 'en-US' → no Arabic prefix
    |               |       toolContext = '' (no apps detected)
    |               |       intentContext = '' or minimal
    |               |
    |               +--[S9] buildCachedSystemPrompt(agent, enrichedContext, chatMode)
    |               |       Returns [personalityBlock, teamContextBlock]
    |               |       personalityBlock = Nexus personality (937+ lines)
    |               |         includes: JSON response format, confidence rules,
    |               |         three-phase workflow generation, vagueness triggers,
    |               |         @NEXUS-FIX-165 complaint patterns
    |               |       teamContextBlock = TEAM_CONTEXT (with cache_control)
    |               |
    |               +--[S10] Claude streaming API call
    |               |       client.messages.stream({
    |               |         model: 'claude-sonnet-4-6',
    |               |         max_tokens: 4096,
    |               |         system: systemBlocks,
    |               |         messages: full conversation history
    |               |       })
    |               |
    |               |  CLAUDE'S EXPECTED RESPONSE for "my sales are dropping":
    |               |  Per @NEXUS-FIX-165 (complaint pattern detection):
    |               |  "dropping" is listed as a complaint trigger word.
    |               |  Claude SHOULD return:
    |               |  {
    |               |    "message": "What changed recently?...",
    |               |    "shouldGenerateWorkflow": false,
    |               |    "intent": "clarifying",
    |               |    "confidence": < 0.40,
    |               |    "clarifyingQuestions": [
    |               |      { "question": "...", "options": [...], "field": "..." },
    |               |      ...
    |               |    ]
    |               |  }
    |               |
    |               +--[S11] Stream tokens via SSE (event: 'token')
    |               |       Each token sent as: event: token\ndata: {"text":"..."}\n\n
    |               |
    |               +--[S12] On stream complete:
    |               |       Parse fullText with brace-depth JSON extraction
    |               |       (lines 801-824, FIX-160)
    |               |       Build parsedResponse object
    |               |
    |               +--[S13] Send 'complete' event with structured response
    |               |       sendEvent('complete', {
    |               |         message: parsedResponse.message || fallback,
    |               |         shouldGenerateWorkflow: false,
    |               |         intent: 'clarifying',
    |               |         confidence: < 0.40,
    |               |         clarifyingQuestions: [...],
    |               |         ...
    |               |       })
    |               |
    |               +--[S14] sendEvent('done', {}) → res.end()
    |
    |   BACK TO CLIENT: NexusAIService.ts SSE parsing
    |       |
    |       +--[6i] Reader processes chunks from ReadableStream
    |       |       Parses SSE events: 'token' → calls onToken(text)
    |       |                          'complete' → builds finalResponse
    |       |
    |       +--[6j] For each 'token' event → onToken callback fires
    |               |
    |               v
    |           ChatContainer.tsx:869-916 onToken callback
    |               |
    |               +-- streamedText += token
    |               +-- Check: looksLikeWorkflowJSON?
    |               |   trimmed.startsWith('{') → YES (Claude returns JSON)
    |               |   looksLikeWorkflowJSON = true (FIX-163: from FIRST char)
    |               |
    |               +-- Since looksLikeWorkflowJSON = true:
    |               |   Try to extract "message" field progressively
    |               |   If found: show extracted message text
    |               |   If not yet: show "Thinking..."
    |               |   If shouldGenerateWorkflow: show "Building your workflow..."
    |               |   → updateMessage(streamingMsg.id, { content: placeholder })
    |               |
    |               +-- User sees: "Thinking..." → then extracted message text
    |                   (NEVER sees raw JSON during streaming)
    |
    |       +--[6k] 'complete' event received → finalResponse built
    |       |       finalResponse = {
    |       |         text: parsed.message (the clean text),
    |       |         shouldGenerateWorkflow: false,
    |       |         intent: 'clarifying',
    |       |         confidence: < 0.40,
    |       |         clarifyingQuestions: [...],
    |       |         ...
    |       |       }
    |       |
    |       +--[6l] Push assistant response to conversationHistory
    |       +--[6m] persistHistory()
    |       +--[6n] Return finalResponse to ChatContainer
    |
    +--[7] Back in ChatContainer.tsx handleSend (line 921-924)
    |       Mark streaming message as no longer streaming
    |       updateMessage(streamingMsg.id, { isStreaming: false })
    |
    +--[8] Check: aiResponse.shouldGenerateWorkflow? → FALSE
    |       → Enter non-workflow display path (line 939)
    |
    +--[9] Extract displayText from aiResponse.text
    |       Check if displayText starts with '{' → JSON stripping (FIX-160)
    |       Already clean since chatStream parsed 'complete' event
    |
    +--[10] Check: intent === 'clarifying' AND clarifyingQuestions.length > 0?
    |        → YES for "my sales are dropping"
    |
    +--[11] Build clickable options display (lines 978-996)
    |        displayText += firstQuestion.question (bold)
    |        Encode options as base64 JSON
    |        displayText += [CLARIFYING_OPTIONS_B64:encodedData]
    |
    +--[12] updateMessage(streamingMsg.id, { content: displayText, isStreaming: false })
    |        → This UPDATES the existing streaming placeholder (no new message)
    |
    +--[13] setIsLoading(false) → return
    |
    v
USER SEES:
  - Their message "my sales are dropping" (user bubble)
  - AI message with diagnostic question + clickable option buttons
  - NO workflow card generated
  - NO ThinkingIndicator (was hidden at step 5)
```

---

## SPECIFIC QUESTIONS ANSWERED

### Q1: When Claude returns `confidence: 0.6`, does ANY code check that number?

**YES, but only in the workflow generation path (not for suppressing workflow creation).**

**Where confidence IS checked:**

1. **ChatContainer.tsx:1102** - After workflow is generated, checks if confidence >= 0.85 for display:
   ```typescript
   const isHighConfidence = (aiResponse.confidence ?? 0.5) >= 0.85
   const hasMissingInfo = aiResponse.missingInfo && aiResponse.missingInfo.length > 0
   ```
   This only affects the CTA message text:
   - High confidence (>=0.85): "Click Execute Workflow to run it now!"
   - Low confidence + missingInfo: "Answer the questions below to fine-tune your workflow!"
   - Low confidence, no missingInfo: "Review the assumptions above and click Execute when ready!"

2. **ChatContainer.tsx:1449** - When user answers missingInfo, confidence is INCREMENTED:
   ```typescript
   confidence: Math.min(0.95, (existingWorkflow.confidence || 0.7) + 0.05)
   ```

3. **WorkflowPreviewCard (not traced here)** - Likely uses confidence for badge display.

**Where confidence is NOT checked (critical gap):**

- **ChatContainer.tsx:1060-1061** - The decision to create a WorkflowPreviewCard does NOT check confidence at all. It only checks:
  ```typescript
  if (aiResponse.workflowSpec) { // ← Just checks existence, NOT confidence value
  ```

- **NexusAIService.ts:688-689** - parseResponse validates `shouldGenerateWorkflow === true` AND `specIsValid`, but NEVER checks `confidence`:
  ```typescript
  shouldGenerateWorkflow: wantsWorkflow && specIsValid, // ← No confidence gate
  ```

**FINDING: Confidence is purely informational/cosmetic in the pipeline. A response with `confidence: 0.1` and a valid `workflowSpec` WILL create a workflow card.** The confidence gating happens entirely within Claude's system prompt (it's instructed not to generate workflowSpec when confidence < 0.60), but there is no code-level enforcement.

---

### Q2: When Claude returns `shouldGenerateWorkflow: true` with `clarifyingQuestions`, what happens?

**@NEXUS-FIX-167 explicitly handles this case (ChatContainer.tsx:1037-1058):**

```typescript
// @NEXUS-FIX-167: Gate card creation on unanswered clarifyingQuestions
if (aiResponse.shouldGenerateWorkflow &&
    aiResponse.clarifyingQuestions &&
    aiResponse.clarifyingQuestions.length > 0) {

  // SUPPRESS the workflow card
  aiResponse.shouldGenerateWorkflow = false

  // Display the clarifying questions instead
  let displayText = aiResponse.text || ''
  for (const q of aiResponse.clarifyingQuestions) {
    // Encode as clickable options
    displayText += `[CLARIFYING_OPTIONS_B64:${encodedData}]`
  }

  updateMessage(streamingMsg.id, { content: displayText })
  return  // ← EXIT: No workflow card created
}
```

**Result:** The workflow card is SUPPRESSED. The user sees the clarifying questions as clickable buttons. Only AFTER answering those questions will a workflow be generated (when Claude returns `shouldGenerateWorkflow: true` WITHOUT `clarifyingQuestions`).

---

### Q3: Is there a template matching service that ALSO generates workflows? How does it interact with Claude's response?

**YES - the TemplateService (server-side) and NexusWorkflowEngine (client-side) are both template systems.**

#### Server-Side: TemplateService (chat.ts:234-250, 626-643)

- **When:** Checked BEFORE Claude is called, for the FIRST user message only
- **Condition:** `userMessageCount <= 1` AND `templateMatch.score >= 0.8`
- **Effect:** If matched, returns immediately as JSON response WITHOUT calling Claude at all
- **Format:** Returns `shouldGenerateWorkflow: true` with pre-built `workflowSpec`
- **Interaction with Claude:** COMPLETELY BYPASSES Claude. Template response is returned as the API response.

```
chat.ts:234: const userMessageCount = messages.filter(m => m.role === 'user').length
chat.ts:234: if (userMessageCount <= 1 && ...) {
chat.ts:235:   const templateMatch = templateService.matchUserInput(lastUserMessage.content)
chat.ts:237:   if (templateMatch && templateMatch.score >= 0.8) {
chat.ts:239:     const templateResponse = templateService.buildTemplateResponse(templateMatch)
chat.ts:240:     return res.json({ ... output: JSON.stringify(templateResponse) ... })
                 // ↑ RETURNS HERE — Claude is never called
```

**@NEXUS-FIX-126:** Only matches templates for the FIRST user message. Mid-conversation messages skip templates because templates "bypass Claude and ignore user's tool preferences from prior questions."

#### Client-Side: NexusWorkflowEngine (ChatContainer.tsx:1156-1237)

- **When:** Used as FALLBACK when Claude AI fails (catch block at line 1144)
- **How:** Uses `nexusWorkflowEngine.analyzeIntent()` for client-side template matching
- **Confidence threshold:** > 0.3 to proceed
- **Generates questions:** If missing info, uses `nexusWorkflowEngine.generateQuestions()`
- **Builds workflow:** Uses `nexusWorkflowEngine.buildWorkflow()` with collected info

```
ChatContainer.tsx:1144: } catch (claudeError) {
  // Claude failed → fall through to template system
ChatContainer.tsx:1162: const intentAnalysis = await nexusWorkflowEngine.analyzeIntent(content, {...})
ChatContainer.tsx:1168: if (intentAnalysis.confidence > 0.3) {
  // Template match found → generate workflow or ask questions
```

**Key distinction:**
- TemplateService = server-side, pre-Claude, keyword-based, returns instant response
- NexusWorkflowEngine = client-side, post-Claude-failure only, pattern-based fallback

---

### Q4: What is the `workflowTemplateService` and when does it override Claude?

There is no `workflowTemplateService` by that exact name. The relevant services are:

1. **`templateService`** (server/services/TemplateService.ts) - Server-side JSON template matching
   - Overrides Claude: YES, for first message with score >= 0.8
   - Loads templates from `src/workflows/templates/*.json`

2. **`nexusWorkflowEngine`** (src/services/NexusWorkflowEngine.ts) - Client-side workflow engine
   - Overrides Claude: Only when Claude FAILS (catch block fallback)
   - Uses SmartWorkflowEngine for pattern matching

3. **`WorkflowTemplatesService`** (src/services/WorkflowTemplatesService.ts) - UI template gallery
   - Does NOT override Claude - this is for the /templates page UI

**Override hierarchy:**
```
1. Template match (server, first msg, score >= 0.8) → INSTANT RETURN, no Claude
2. Claude AI via streaming                         → PRIMARY PATH
3. Claude AI via non-streaming (fallback)          → SECONDARY PATH
4. NexusWorkflowEngine client-side templates       → LAST RESORT (Claude failed)
```

---

### Q5: The "1ms between answer and card" bug — trace the exact timing of response rendering vs card creation

**The timing flow for workflow card creation:**

```
Timeline:
T+0ms    → chatStream() starts streaming
T+~100ms → First token arrives → onToken fires
           looksLikeWorkflowJSON = true (JSON detected from first '{')
           User sees: "Thinking..." or "Building your workflow..."

T+~2-5s  → More tokens stream in
           If "message" field extractable → user sees message text
           If shouldGenerateWorkflow detected → user sees "Building your workflow..."

T+~3-8s  → Stream completes → 'complete' SSE event fires
           finalResponse built with full parsed JSON

T+0ms    → handleSend receives finalResponse (synchronous continuation)
           (after await returns)

T+0ms    → Check shouldGenerateWorkflow === true
           → YES: Create workflow via nexusAIService.specToWorkflow()

T+0ms    → Store workflow in generatedWorkflows Map:
           setGeneratedWorkflows(prev => new Map(prev).set(workflowDisplayId, workflow))

T+0ms    → Build workflowSummary string WITH [WORKFLOW_PREVIEW:workflowDisplayId]

T+0ms    → updateMessage(streamingMsg.id, { content: workflowSummary })
           → This REPLACES the streaming placeholder with the workflow summary
           → The [WORKFLOW_PREVIEW:xxx] marker in the message content triggers
              WorkflowPreviewCard rendering via renderWorkflowPreview callback
              (ChatMessage.tsx parses the marker and calls renderWorkflowPreview)

React render cycle:
T+~16ms  → React re-renders with new message content
           ChatMessage renders the markdown text
           ChatMessage detects [WORKFLOW_PREVIEW:xxx] marker
           Calls renderWorkflowPreview(workflowId)
           WorkflowPreviewCard component mounts

T+~16ms  → User sees: message text AND workflow card SIMULTANEOUSLY
           (both are in the same message update)
```

**Key insight:** There is NO gap between the answer text and the card appearing. They are part of the SAME message update (`updateMessage` at line 1140). The streaming placeholder is replaced in one atomic operation with both the text summary and the `[WORKFLOW_PREVIEW:xxx]` marker. React renders both in the same paint cycle.

**The "1ms" observation is accurate** — the text and card appear in the same React render because:
1. `updateMessage()` updates a single message object
2. `ChatMessage` component renders the markdown AND detects `[WORKFLOW_PREVIEW:xxx]`
3. `renderWorkflowPreview` callback is called during the same render pass
4. WorkflowPreviewCard mounts in the same frame

**Potential issue:** During streaming (before 'complete' event), the user sees "Building your workflow..." placeholder. Then suddenly the entire message content is REPLACED with the final text + card. This is a visual "jump" rather than a smooth transition.

---

## DECISION POINT MAP

| File:Line | Decision | Condition | True Path | False Path |
|-----------|----------|-----------|-----------|------------|
| ChatContainer.tsx:758 | Edit command? | parseNodeEditCommand(content) != null | Handle edit, return | Continue to AI |
| ChatContainer.tsx:775 | In Q&A mode? | conversationState === 'asking_questions' | Collect answer, maybe generate | Continue to AI |
| NexusAIService.ts:434 | Dedup user msg? | lastMsg matches | Skip push | Push to history |
| chat.ts:234 | Template match? | userMessageCount <= 1 AND score >= 0.8 | Return template response | Call Claude |
| chat.ts:718 | Arabic language? | language starts with 'ar' | Add Arabic JSON instruction | Skip or generic |
| ChatContainer.tsx:877 | JSON streaming? | trimmed.startsWith('{') | Show placeholder | Show raw text |
| ChatContainer.tsx:939 | Generate workflow? | !shouldGenerateWorkflow | Show text response | Create workflow card |
| ChatContainer.tsx:978 | Clarifying Qs? | intent==='clarifying' AND questions.length > 0 | Show clickable options | Just show text |
| ChatContainer.tsx:1014 | Valid spec? | spec.name AND spec.steps valid | Proceed | Suppress card |
| ChatContainer.tsx:1037 | FIX-167 gate? | shouldGenerateWorkflow AND clarifyingQuestions | Suppress card, show Qs | Create card |
| ChatContainer.tsx:1079 | Refinement? | existingWorkflowId AND generatedWorkflows.has() | Update existing card | Create new card |
| ChatContainer.tsx:1102 | High confidence? | confidence >= 0.85 | "Execute now!" CTA | "Answer questions" CTA |

---

## THE 10-MESSAGE CAP

**Location:** NexusAIService.ts:272-274 (chat path) and NexusAIService.ts:442-444 (stream path)

```typescript
if (this.conversationHistory.length > 10) {
  this.conversationHistory = this.conversationHistory.slice(-10)
}
```

This caps the conversation history sent to Claude at the **last 10 messages** (user + assistant combined, so effectively ~5 exchanges). Earlier messages are silently dropped.

**Also at:** NexusAIService.ts:106 (constructor, restoring from localStorage):
```typescript
this.conversationHistory = parsed.slice(-10)
```

**Impact:** For "my sales are dropping" as a first message, this has no effect. But by the 6th exchange, Claude loses memory of the first messages.

---

## DATA TRANSFORMATIONS SUMMARY

| Stage | Data Shape | Transformation |
|-------|-----------|----------------|
| User input | `string` "my sales are dropping" | Raw text |
| ChatContainer | `{ role: 'user', content: string }` | Added to messages state |
| NexusAIService | `ChatMessage[]` (last 10) | History synced, user msg pushed |
| IntentResolver | `{ integrations: [], params: [], confidence: number }` | Pre-parsed intent context |
| buildUserContext() | `string` | Temporal + memory + industry + maturity + language |
| Server chat.ts | `{ messages, agentId, model, userContext, intentContext, language }` | POST body |
| promptGuardService | Sanitized content | Invisible chars stripped, injection flagged |
| templateService | `TemplateMatch \| null` | Keyword scoring against templates |
| buildCachedSystemPrompt | `TextBlockParam[]` | System prompt with cache_control |
| Claude API | SSE stream of tokens | Raw JSON tokens |
| Server brace-depth parser | `parsedResponse: Record<string, unknown>` | Structured JSON extracted |
| SSE 'complete' event | `{ message, shouldGenerateWorkflow, intent, confidence, ... }` | Final structured response |
| NexusAIService SSE parser | `NexusAIResponse` | Typed response object |
| ChatContainer display | `string` with `[CLARIFYING_OPTIONS_B64:...]` markers | Rendered markdown + option buttons |

---

## KEY FINDINGS

### Finding 1: No Code-Level Confidence Enforcement
Confidence is checked ONLY for CTA text (line 1102). A workflow with `confidence: 0.1` and valid `workflowSpec` WILL create a card. The gating relies entirely on Claude's system prompt instructions.

### Finding 2: Template Service Can Bypass Claude Entirely
For first messages with high keyword match (>=0.8), templates return instantly without calling Claude. This means the template's confidence/intent is hardcoded, not AI-determined.

### Finding 3: FIX-167 Correctly Handles shouldGenerateWorkflow + clarifyingQuestions
If Claude misbehaves and returns both, the code suppresses the card and shows questions. This is a defensive guard against Claude prompt non-compliance.

### Finding 4: No Gap Between Text and Card
The workflow card and text appear in the same React render cycle via a single `updateMessage()` call. There is no "1ms delay" — they are truly simultaneous.

### Finding 5: Streaming JSON Detection Works From First Character
FIX-163 ensures JSON detection happens at `trimmed.startsWith('{')` (no length threshold), so even the first `{` token triggers the "Thinking..." placeholder instead of showing raw JSON.

### Finding 6: Triple Fallback Chain
```
Server Templates (instant) → Claude Streaming → Claude Non-Streaming → Client NexusWorkflowEngine
```
Each layer has its own parsing and workflow generation logic.

### Finding 7: "my sales are dropping" Should Hit FIX-165
The system prompt explicitly lists "dropping" as a complaint pattern trigger (line 256 of agents/index.ts). Claude should return `confidence < 0.40` with diagnostic questions, NOT a workflow. If it DOES return a workflow, FIX-167 would catch it if clarifyingQuestions are also present.

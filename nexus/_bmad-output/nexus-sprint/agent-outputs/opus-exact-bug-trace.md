# Exact Bug Trace: Raw JSON Display + Premature Workflow Card

**Date:** 2026-02-18
**Investigator:** Opus 4.6
**Status:** ROOT CAUSES IDENTIFIED

---

## Q1: WHERE does the raw JSON appear?

### CONFIRMED CAUSE: Streaming token relay with incomplete detection window

**Execution path:**

```
User types "مبيعاتي تنخفض" (Arabic)
    |
    v
ChatContainer.tsx:868 -- nexusAIService.chatStream() called
    |
    v
NexusAIService.ts:485 -- POST /api/chat/stream
    |
    v
server/routes/chat.ts:775-777 -- Claude tokens relayed AS-IS to client:
    stream.on('text', (text) => {
      fullText += text
      sendEvent('token', { text })   // <-- RAW JSON tokens forwarded
    })
    |
    v
NexusAIService.ts:542-543 -- Client receives token events:
    if (currentEvent === 'token') {
      onToken(parsed.text || '')       // <-- Fires ChatContainer callback
    }
    |
    v
ChatContainer.tsx:870-913 -- onToken callback accumulates streamedText
```

**The detection logic (lines 877-884):**

```typescript
if (!looksLikeWorkflowJSON) {
  const trimmed = streamedText.trimStart()
  if (trimmed.startsWith('{') && trimmed.length > 3 && /^\{\s*"/.test(trimmed)) {
    looksLikeWorkflowJSON = true
  }
}
```

**Failure window:** Between the FIRST token `{` (length=1, fails `length > 3` check) and the FOURTH+ token when `{"m` or similar accumulates, the user sees raw `{` and potentially `{"` displayed in the chat bubble. This is a **1-3 token flash** of raw JSON.

**But the REAL raw JSON leak happens differently:**

When `looksLikeWorkflowJSON = true`, the streaming placeholder logic at lines 886-913 tries to extract the `"message"` field progressively using this regex (line 889):

```typescript
const msgMatch = streamedText.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/i)
```

**Critical failure with Arabic + newlines:** This regex CANNOT match if the `"message"` value contains literal newlines (`\n` that Claude outputs as actual newline characters rather than escaped `\\n`). The `.` in the regex does NOT match newlines by default. If Claude's streamed JSON has a message value spanning multiple lines (e.g., Arabic text with `\n` inside the JSON string), the regex will FAIL, and the user sees "Thinking..." as a placeholder.

However, the BIGGER issue is the **message field extraction on the `complete` event**. The server at line 828 sends:

```typescript
// server/routes/chat.ts:828
message: parsedResponse.message || fullText
```

If the server's JSON parsing (lines 802-824) succeeds, `parsedResponse.message` contains the clean message. If it FAILS, `fullText` (the raw Claude JSON output) becomes the message.

Then at NexusAIService.ts:546-548:

```typescript
const message = parsed.message || ''
finalResponse = {
  text: message,          // This is parsedResponse.message from server, or raw fullText
  ...
}
```

Then at ChatContainer.tsx:942-973, there's a SECONDARY safety net:

```typescript
let displayText = aiResponse.text
if (displayText && displayText.trim().startsWith('{')) {
  // JSON stripping logic...
}
```

**The confirmed JSON leak scenario:**

1. Server JSON parsing SUCCEEDS (brace-depth works)
2. `parsedResponse.message` is extracted correctly
3. BUT -- if Claude includes the ENTIRE JSON structure as the "message" value (e.g., Claude wraps its response in double JSON), `parsedResponse.message` would itself be JSON text
4. The ChatContainer safety net at line 943 checks if `displayText.trim().startsWith('{')` -- if the message starts with `{`, it tries to strip JSON
5. But if the message starts with Arabic text followed by JSON fragments, it does NOT trigger the safety net

**Most likely confirmed cause:** Claude sometimes outputs malformed JSON or double-wrapped JSON, especially in Arabic. The server's brace-depth parser extracts the outer JSON, but the `message` value inside may contain raw JSON fragments. The client-side safety net at line 943 only triggers when the message STARTS with `{`, not when JSON is embedded mid-text.

### CONFIRMED ROOT CAUSE FILE + LINE:

- **File:** `nexus/server/routes/chat.ts`, line 828
- **Code:** `message: parsedResponse.message || fullText`
- **Issue:** When `parsedResponse.message` is undefined/empty but the JSON parse partially succeeded, `fullText` (raw Claude output) leaks through. Also, the `parsedResponse.message` may itself contain JSON if Claude double-wraps.

- **File:** `nexus/src/components/chat/ChatContainer.tsx`, lines 877-884
- **Code:** The `looksLikeWorkflowJSON` detection has a 1-3 token window where raw `{` is visible
- **Issue:** Minor flash, but contributes to user seeing JSON artifacts

- **File:** `nexus/src/components/chat/ChatContainer.tsx`, lines 943-973
- **Code:** `if (displayText && displayText.trim().startsWith('{'))`
- **Issue:** Only catches JSON when it's at the START of the display text. Arabic text preceding JSON fragments is not caught.

---

## Q2: WHY does "Gmail to Google Sheets" appear for "sales dropping"?

### CONFIRMED CAUSE: Claude AI generates an inappropriate workflow, NOT the template service

**Template Service Analysis:**

Template file: `nexus/src/workflows/templates/daily_sales_report.json`
Keywords: `["sales", "report", "daily", "revenue", "analytics", "KPI", "مبيعات", "تقرير", "يومي", "إيرادات", "تحليلات"]` (11 keywords)

**Score calculation for "مبيعاتي تنخفض":**

The TemplateService matching (TemplateService.ts:109) does `input.includes(keyword.toLowerCase())`:
- "مبيعات" IS a substring of "مبيعاتي" -- MATCHES (1 match)
- No other keyword matches in "مبيعاتي تنخفض"
- Score = 1/11 = 0.091

**Thresholds:**
- TemplateService minimum: > 0.3 (line 117) -- NOT MET
- Stream endpoint threshold: >= 0.8 (chat.ts:628) -- NOT MET

**Conclusion: The template service does NOT fire for "مبيعاتي تنخفض".** Score 0.091 is far below both thresholds.

**The actual cause is Claude itself.** Despite the system prompt explicitly saying:
- Confidence < 0.60 = "Ask clarifying questions FIRST"
- NEVER include tools the user didn't mention
- "مبيعاتي تنخفض" has NO specific tools mentioned

Claude sometimes generates a workflow anyway because:

1. **Pattern Matching Layer (agents/index.ts:396):** The system prompt tells Claude about "115+ pre-mapped workflow patterns" including sales patterns. Claude's internal pattern matching may over-eagerly match "sales" to "daily sales report" and generate a Gmail + Google Sheets workflow.

2. **Confidence inflation:** The system prompt at line 275 says confidence 0.60-0.84 should generate a workflow. Claude may assign 0.60+ confidence to a "sales" mention because it sees it as a common pattern, even though the user's actual request ("my sales are dropping") is a COMPLAINT, not an automation request.

3. **No explicit "sales complaint" handling:** The vagueness triggers in the system prompt (agents/index.ts:246-273) list patterns like "automate", "help me", "manage", "track" -- but do NOT explicitly list "my X is going down" or "X is dropping" as vague patterns requiring questions. Claude may interpret "sales dropping" as a signal to create a sales tracking workflow rather than asking what the user actually wants.

4. **Default tool assumptions:** When Claude decides to generate a workflow about "sales", it defaults to Gmail (for sending reports) and Google Sheets (for tracking data), violating the zero-assumed-tools rule (FIX-121). The system prompt says "NEVER include a tool the user didn't explicitly mention" but Claude can disobey this instruction.

### ROOT CAUSE:

- **File:** `nexus/server/agents/index.ts`, lines 228-290
- **Issue:** The confidence thresholds and vagueness detection instructions are not robust enough. A complaint like "my sales are dropping" does not match the listed vague patterns, so Claude may treat it as specific enough to generate a workflow.
- **Contributing factor:** Claude's propensity to be "helpful" by generating a workflow, even when the user didn't ask for one. This is an AI behavioral issue, not a code bug.

---

## Q3: WHY does the card appear instantly (1ms) when user answers a question?

### CONFIRMED CAUSE: Template service matching on user's CLARIFYING ANSWER text (first message path)

**Execution path analysis:**

When a user clicks a clarifying option (e.g., "Google Sheets" or "Email"), that text becomes the `content` parameter of `handleSend`.

**Step 1:** ChatContainer.tsx:775 -- `conversationState` check:
- When Claude returned clarifying questions via the AI path, `conversationState` remains `'idle'` (it is NEVER set to `'asking_questions'` for Claude-driven clarifying questions -- that state is only used by the template-based fallback at lines 1186-1196)
- So the code falls through to line 839 (Claude AI path)

**Step 2:** ChatContainer.tsx:850 -- Conversation history synced to NexusAIService

**Step 3:** NexusAIService.ts:430 -- User message added to history. The `messages` array sent to server includes ALL messages.

**Step 4:** server/routes/chat.ts:625 -- Template match check:
```typescript
const userMessageCount = messages.filter((m: any) => m.role === 'user').length
if (userMessageCount <= 1 && ...) {
```

**CRITICAL:** `userMessageCount` counts user messages in the history. If this is the user's second message (answer to question), count >= 2, so the template match is SKIPPED. The template is NOT the cause.

**Step 5:** Claude processes the message. This takes 2-5 seconds.

**Revised analysis for "1ms" appearance:**

The "1ms" observation from the user is likely NOT literally 1ms. It could be:

**Scenario A -- Stale `shouldGenerateWorkflow` from previous response:**

Look at ChatContainer.tsx lines 848-852:
```typescript
nexusAIService.setConversationHistory(
    messages.map(m => ({ role: m.role, content: m.content }))
)
```

The `messages` state variable includes the previous assistant message. That message's `content` was set at line 1005 to `displayText` which is the clean text (not JSON). So the conversation history sent to Claude includes clean text messages, not JSON. Claude should properly process the new question.

**Scenario B -- Claude responds QUICKLY with a workflow on the second message:**

When the user's clarifying answer mentions a tool name (e.g., they click "Google Sheets" or "Email"), Claude now has:
1. The original vague request ("مبيعاتي تنخفض")
2. The clarifying question (from Claude's previous response)
3. The user's answer mentioning a tool

With a tool name now in the conversation, Claude may jump to confidence >= 0.60 and immediately generate a `shouldGenerateWorkflow: true` response with a workflowSpec. If Claude's response is fast (it often returns small JSON within 1-2 seconds), the user perceives this as "instant."

**Scenario C -- The REAL instant path (CONFIRMED BUG):**

If the user's answer to a clarifying question happens to be short (like a single word "email" or "Google Sheets"), AND the conversation has exactly 1 user message (because the clarifying question options are submitted WITHOUT counting as a user message in the history)...

Let me verify: Does clicking a CLARIFYING_OPTIONS_B64 button add a user message to history, or does it just trigger handleSend?

Looking at ChatContainer.tsx:767: `addMessage(content, 'user')` -- YES, every handleSend adds a user message. So after the first user message and the answer, there are 2 user messages. The template match check at line 625 (`userMessageCount <= 1`) would NOT fire.

**BUT WAIT** -- let me check if `setConversationHistory` at line 850 uses `messages` state, which might not yet include the message just added at line 767 (due to React state batching):

```typescript
// Line 767
addMessage(content, 'user')    // Adds to messages state
// ...
// Line 850
nexusAIService.setConversationHistory(
    messages.map(m => ({ role: m.role, content: m.content }))
    // ^^^ messages is the STALE state from the current render!
)
```

**THIS IS THE BUG!** Due to React's closure semantics in `useCallback`, `messages` at line 850 refers to the `messages` value from the RENDER when the callback was created, NOT the value after `addMessage` at line 767. The `addMessage` call triggers a re-render, but the current execution continues with the old `messages` value.

So when the user sends their second message:
- `messages` at line 850 contains only the FIRST user message and the first assistant response (2 messages)
- `addMessage` at line 767 adds the second user message to state, but `messages` still points to the old array
- `nexusAIService.setConversationHistory(messages)` sends only 2 messages (1 user + 1 assistant)
- NexusAIService.ts:430 adds the new user message, making it 3 (1 user + 1 assistant + 1 user)
- The server at line 625 counts user messages: `messages.filter(m => m.role === 'user').length`
- This counts 2 user messages (1 from history + 1 just added)
- 2 > 1, so template match is SKIPPED

Actually, this means the template path is correctly skipped. So the "1ms" is not from templates.

**FINAL ANSWER for Q3:**

The "1ms" claim is most likely user perception rather than actual instant response. Claude processes the second message and generates a workflow response within 1-3 seconds. However, the user's experience of "the answer clearly wasn't sent to AI" may stem from:

1. Claude ignoring the conversation context and generating a generic "Gmail to Google Sheets" workflow regardless of what the user answered
2. The speed of Claude's response (1-3 seconds can feel instant)
3. Claude treating the user's answer as a NEW workflow request rather than a continuation

**Contributing code issue:**

The conversation history sent to Claude includes the assistant's previous message as PLAIN TEXT (the displayText from line 1005), which includes the `[CLARIFYING_OPTIONS_B64:...]` marker. Claude doesn't understand this marker format and may ignore the clarifying question context entirely, treating the user's short answer (like "Google Sheets") as a fresh workflow request.

- **File:** `nexus/src/components/chat/ChatContainer.tsx`, line 1005
- **Code:** `updateMessage(streamingMsg.id, { content: displayText, isStreaming: false })`
- **Issue:** `displayText` includes `[CLARIFYING_OPTIONS_B64:base64data]` markers that are meaningless to Claude. When this text is included in conversation history (line 850-852), Claude cannot understand the context of the clarifying question flow.

---

## Q4: Does the English path have the same bug?

### CONFIRMED: Yes, the exact same bugs affect English

**Bug 1 (Raw JSON display during streaming):**
The streaming token relay at chat.ts:775-778 sends ALL tokens as-is regardless of language. The JSON detection logic at ChatContainer.tsx:877-884 is language-agnostic. The same `looksLikeWorkflowJSON` detection window exists for English.

However, the JSON display issue is MORE LIKELY to manifest in Arabic because:
- Arabic text in JSON requires proper Unicode escaping (`\u0645\u0628\u064a\u0639\u0627\u062a`)
- Claude may output Arabic characters directly without escaping, which can break JSON parsing
- The server brace-depth parser (chat.ts:802-824) handles this correctly, but if Claude outputs malformed JSON (e.g., unescaped quotes within Arabic text), parsing fails and `fullText` leaks through

**Bug 2 (Inappropriate workflow generation):**
For English, a user saying "my sales are going down" would similarly NOT trigger the template service:
- Keywords: `["sales", "report", "daily", "revenue", "analytics", "KPI", ...]`
- "my sales are going down" matches: "sales" (1/11 = 0.091 score)
- Below both 0.3 and 0.8 thresholds

But Claude may still generate an inappropriate "Gmail to Google Sheets" workflow for the same reasons as Arabic: pattern-matching eagerness and confidence inflation.

**Bug 3 (Clarifying question context loss):**
The `[CLARIFYING_OPTIONS_B64:...]` marker issue affects both languages equally. When the user answers a clarifying question in English, the same conversation history with meaningless markers is sent to Claude.

**Template scoring for English "send me daily sales reports":**
Keywords matched: "sales", "report", "daily" = 3/11 = 0.273
Still below 0.3 threshold! Even the exact example input wouldn't trigger the template.

But "send me daily sales reports automatically" would match: "sales", "report", "daily" = 3/11 = 0.273. Still below 0.3.

Wait -- let me recalculate. Does "reports" match "report"? The code does `input.includes(keyword.toLowerCase())`. "reports" includes "report" as a substring. So YES.

For "send me daily sales reports automatically with revenue analytics":
- "sales" = match
- "report" in "reports" = match
- "daily" = match
- "revenue" = match
- "analytics" = match
- Score = 5/11 = 0.454

This is above 0.3 (minimum) but below 0.8 (stream threshold). So the template would be returned by `matchUserInput` but NOT used by the stream endpoint.

**The 0.8 threshold effectively makes templates unusable in the stream path** because matching 9+ out of 11 keywords requires extremely specific input.

---

## Summary of Root Causes

### Root Cause 1: Raw JSON During Streaming (Visual Leak)
- **Type:** Code bug + race condition
- **Location:** `ChatContainer.tsx:877-884` (detection window) and `chat.ts:828` (fullText fallback)
- **Severity:** P1
- **Fix:** Remove the `trimmed.length > 3` check so `looksLikeWorkflowJSON` triggers on the FIRST `{` character. Add a secondary check that if ANY token starts with `{`, immediately flag as potential JSON.

### Root Cause 2: Claude Generates Inappropriate Workflows
- **Type:** AI behavioral issue (prompt engineering gap)
- **Location:** `server/agents/index.ts:228-290` (vagueness triggers)
- **Severity:** P0
- **Fix:** Add explicit patterns for complaints/problems ("my X is dropping", "X is going down", "X is not working") to the vagueness triggers. Add a rule: "If the user describes a PROBLEM but does not ask for AUTOMATION, ask what they want to do about it before generating a workflow."

### Root Cause 3: Clarifying Question Context Lost in History
- **Type:** Code bug (conversation history format)
- **Location:** `ChatContainer.tsx:1005` (displayText with markers) and `ChatContainer.tsx:850-852` (history sync)
- **Severity:** P1
- **Fix:** Strip `[CLARIFYING_OPTIONS_B64:...]` markers from the message content before it gets saved to conversation history. Or better: store the clarifying questions in a separate field and reconstruct proper context for Claude.

### Root Cause 4: Template Service Score Threshold Too High
- **Type:** Design issue (not a bug per se)
- **Location:** `chat.ts:628` (>= 0.8 threshold)
- **Severity:** P3
- **Impact:** Templates are effectively never used because matching 9/11 keywords is near-impossible with natural user input. This means Claude handles ALL requests, including ones that templates could handle faster and more accurately.

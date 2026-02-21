# JSON Leak Investigation Report
**Date:** 2026-02-18
**Bug:** Raw JSON shown to users instead of clean text
**Symptom:** User sees `{"message": "...", "shouldGenerateWorkflow": true, "workflowSpec": {...}}` in chat

---

## Data Flow Diagram

```
User types "my sales are dropping"
    |
    v
ChatContainer.tsx:handleSend() [line 753]
    |
    v
nexusAIService.chatStream() [NexusAIService.ts:424]
    |
    |-- onToken callback fires for EACH streaming token [line 870]
    |       |
    |       v
    |   ChatContainer.tsx:873-914 (JSON detection + placeholder logic)
    |       |
    |       |--> looksLikeWorkflowJSON detection [line 877-884]
    |       |       Triggers when streamedText starts with `{"` pattern
    |       |
    |       +--> If JSON detected: show "Thinking..." or "Building workflow..."
    |            If NOT detected: show raw streamedText to user  <-- BUG HERE (SCENARIO A)
    |
    v
Stream completes -> chatStream returns finalResponse [NexusAIService.ts:546-559]
    |   (finalResponse.text = parsedResponse.message OR fullText if JSON parse fails)
    |
    v
ChatContainer.tsx:937 - if (!aiResponse.shouldGenerateWorkflow)
    |
    v
displayText = aiResponse.text  [line 942]
    |
    |--> @NEXUS-FIX-160: JSON strip guard [line 943-973]
    |       If displayText starts with `{`:
    |         - Try JSON.parse() to extract .message field
    |         - Fallback to regex extraction
    |         - Last resort: strip all JSON chars
    |
    v
updateMessage(streamingMsg.id, { content: displayText }) [line 1005]
```

---

## Confirmed Root Cause Locations (3 Distinct Bug Paths)

---

### BUG PATH A: Streaming Race Condition (MOST LIKELY CAUSE)
**File:** `C:\Users\PC\Documents\Autoclaude 2D workflow office\nexus\src\components\chat\ChatContainer.tsx`
**Lines:** 877-884

**Code (the detection trigger):**
```typescript
if (!looksLikeWorkflowJSON) {
  const trimmed = streamedText.trimStart()
  // Detect ANY JSON response from the AI
  if (trimmed.startsWith('{') && trimmed.length > 3 && /^\{\s*"/.test(trimmed)) {
    looksLikeWorkflowJSON = true
  }
}
```

**The Bug:**
The `looksLikeWorkflowJSON` flag is only set to `true` when `streamedText.length > 3`. This means the FIRST 1-3 tokens of a JSON response (`{`, `{"`, `{"m`) are displayed RAW to the user as `streamedText` while `looksLikeWorkflowJSON` is still `false`. The condition `trimmed.length > 3` and `trimmed.startsWith('{') && /^\{\s*"/.test(trimmed)` means we need at least `{"x` (4 chars) before detection kicks in.

**Impact:** During those first few token updates, the else branch at line 908-913 fires:
```typescript
} else {
  updateMessage(streamingMessageIdRef.current, {
    content: streamedText,  // <-- RAW `{"` or `{"message` shown to user
    isStreaming: true
  })
}
```

This creates a visible flash of raw JSON before the placeholder takes over.

---

### BUG PATH B: Non-Streaming Fallback - `chat()` method
**File:** `C:\Users\PC\Documents\Autoclaude 2D workflow office\nexus\src\services\NexusAIService.ts`
**Lines:** 370-392 (chat() method) and 597-603 (chatStream() fallback)

**The scenario:**
When the streaming endpoint (`/api/chat/stream`) is unavailable (ANTHROPIC_API_KEY missing at server level) OR when the stream fails mid-way, `chatStream()` falls back to `chat()` at line 603:
```typescript
return this.chat(userMessage, context)
```

In the `chat()` method:
- Server returns `result.output` = raw Claude JSON string (e.g. `{"message":"...", "shouldGenerateWorkflow":false}`)
- `parseResponse(result.output)` is called at line 375
- `parseResponse` correctly extracts `.message` into `aiResponse.text`

**BUT** -- there is also the case where `chatStream()` fallback gets triggered AFTER onToken already fired and populated `streamedText` with raw JSON. When fallback happens:
1. `streamingMessageIdRef.current` was already set
2. `updateMessage(streamingMessageIdRef.current, { isStreaming: false })` fires at line 921 (BEFORE fallback)
3. The streaming placeholder message may already contain raw JSON partial content that was shown before `looksLikeWorkflowJSON` was detected

---

### BUG PATH C: Server Stream Sends Raw JSON Tokens
**File:** `C:\Users\PC\Documents\Autoclaude 2D workflow office\nexus\server\routes\chat.ts`
**Lines:** 775-778

**Code:**
```typescript
// Stream tokens as they arrive
stream.on('text', (text: string) => {
  fullText += text
  sendEvent('token', { text })  // <-- Raw JSON fragment sent directly to frontend
})
```

**The Bug:** The server sends EVERY token from Claude verbatim to the frontend via SSE, including tokens that are part of JSON structure (`{`, `"message"`, `:`, `"`, etc.). There is NO server-side filtering of JSON tokens before they are sent.

The frontend's `onToken` callback (ChatContainer.tsx:870) receives these raw JSON fragments. The detection guard (line 877-884) catches this ONLY after receiving enough characters (`trimmed.length > 3`). So for those first 2-3 tokens, raw JSON structure is sent to `updateMessage()` and rendered to the user.

---

### BUG PATH D: Stream Complete Event - `message` Field Can Be `fullText`
**File:** `C:\Users\PC\Documents\Autoclaude 2D workflow office\nexus\server\routes\chat.ts`
**Lines:** 827-829

**Code:**
```typescript
sendEvent('complete', {
  message: parsedResponse.message || fullText,  // <-- FALLBACK is entire raw JSON!
  ...
})
```

**The Bug:** If `parsedResponse` is empty (JSON parse of `fullText` failed), the `message` field in the `complete` event falls back to `fullText` which IS the entire raw JSON string from Claude.

In `NexusAIService.chatStream()` at line 546:
```typescript
const message = parsed.message || ''
finalResponse = {
  text: message,  // <-- This is already "message || ''"
  ...
}
```

So `finalResponse.text` would be `''` (empty string) if `parsedResponse.message` was falsy AND the server fell back to `fullText`. Wait -- actually the server sends `parsedResponse.message || fullText` to the client, and the client reads `parsed.message` from the SSE `complete` event. If the server's `parsedResponse.message` exists, then `finalResponse.text` = the clean message. If it does NOT exist (JSON parse failed server-side), then `message: fullText` is sent, meaning `finalResponse.text` = entire raw JSON.

This is confirmed at server line 801-823: the brace-depth JSON extractor can FAIL if Claude's response is malformed (e.g. incomplete/truncated JSON from streaming). In that case `parsedResponse = {}` and `parsedResponse.message` is `undefined`, so the fallback `fullText` (raw JSON) goes into the `message` field sent to the client.

---

## Complete Root Cause Matrix

| Path | Location | Trigger | Effect |
|------|----------|---------|--------|
| **A (FLASH)** | `ChatContainer.tsx:877-884` | First 1-3 streaming tokens | Brief flash of raw `{"` before detection |
| **B (FALLBACK)** | `NexusAIService.ts:597-603` + `ChatContainer.tsx:1115-1125` | Stream endpoint unavailable | Streaming placeholder may hold stale raw JSON content |
| **C (SERVER TOKENS)** | `chat.ts:775-778` | Every streaming response | Server sends raw JSON fragments without filtering |
| **D (COMPLETE EVENT)** | `chat.ts:827-829` | JSON parse failure server-side | `message: fullText` sends entire raw JSON as message text |

---

## Specific Line References

### ChatContainer.tsx
- **Line 856-857**: Streaming placeholder message created (empty `''` initially - correct)
- **Line 877-884**: `looksLikeWorkflowJSON` detection - ONLY activates after >3 chars (BUG A)
- **Line 908-913**: Raw `streamedText` applied to message when JSON not yet detected (BUG A)
- **Line 920-921**: Streaming marked complete BEFORE fallback catches it (BUG B setup)
- **Line 937-1008**: `if (!aiResponse.shouldGenerateWorkflow)` branch - has NEXUS-FIX-160 guards (mostly safe)
- **Line 942-973**: JSON stripping guard for `displayText` (correct, but only runs AFTER stream)
- **Line 1005**: `updateMessage(streamingMsg.id, { content: displayText })` - final text set (correct)

### NexusAIService.ts
- **Line 375**: `parseResponse(result.output)` - correctly extracts `.message` in non-streaming path (safe)
- **Line 546**: `text: message` in `finalResponse` - depends on server sending clean `message` field (BUG D risk)
- **Line 597-603**: fallback to `chat()` - streaming message placeholder may have stale raw JSON (BUG B)
- **Line 663-693**: `parseResponse()` - correctly extracts `parsed.message` (safe)
- **Line 700-726**: JSON recovery path - uses regex to extract message (safe)

### server/routes/chat.ts
- **Line 775-778**: `sendEvent('token', { text })` - raw JSON tokens sent to frontend (BUG C)
- **Line 801-824**: brace-depth JSON parse of `fullText` - can fail silently (BUG D setup)
- **Line 827-829**: `message: parsedResponse.message || fullText` - raw JSON fallback (BUG D)
- **Line 395-421**: Non-streaming path - returns `output: sanitizedOutput` which is still raw JSON (safe because frontend parseResponse handles it)

### server/services/claudeProxy.ts
- The proxy passes Claude's raw response through unchanged at line 287: `return { text: result.output }` - this is the raw JSON string. This is CORRECT behavior; parsing must happen on the client.

---

## Why Arabic Input Makes It Worse

When the user types in Arabic (e.g. "مبيعاتي تنخفض"), the language detection in `NexusAIService.buildUserContext()` (line 220-226) adds Arabic language instructions to the context, which causes Claude to:

1. Return a JSON response where `"message"` contains Arabic text with Arabic Unicode escape sequences like `\u0645\u0628\u064a\u0639\u0627\u062a\u064a`
2. Arabic Unicode sequences in the `"message"` field can trip up naive regex extraction (though @NEXUS-FIX-160's improved regex handles this correctly)
3. The streaming token detection at line 881 `(/^\{\s*"/.test(trimmed))` still fires correctly for Arabic responses since JSON field names remain in English

The actual Arabic issue is that when streaming, the first few tokens ARE visible as raw `{"` before detection, and since the user is watching, they see this flash of raw JSON more noticeably than for English inputs.

---

## Summary of Working Protections (Do NOT Regress)

These existing protections are working correctly and must be preserved:

1. **@NEXUS-FIX-160** (ChatContainer.tsx:941-973): Guards `displayText` against raw JSON AFTER streaming completes. Works correctly.
2. **@NEXUS-FIX-150** (ChatContainer.tsx:864-914): Detects JSON during streaming and replaces with placeholder. Works but has 3-char timing gap (BUG A).
3. **parseResponse()** (NexusAIService.ts:663): Correctly extracts `.message` from JSON in non-streaming path.
4. **Server brace-depth parser** (chat.ts:801-824): Better than old greedy regex, but can still fail.

---

## Recommended Fixes (Priority Order)

### FIX 1 (P0) - Remove the `trimmed.length > 3` Guard [BUG A]
**File:** `ChatContainer.tsx` line 881
**Change:** Remove `trimmed.length > 3 &&` from the JSON detection condition.
```typescript
// OLD (buggy - allows 1-3 char raw JSON to show):
if (trimmed.startsWith('{') && trimmed.length > 3 && /^\{\s*"/.test(trimmed)) {

// NEW (fix - detect from first character):
if (trimmed.startsWith('{') && /^\{[\s\S]*/.test(trimmed)) {
```
Even simpler: just use `trimmed.startsWith('{')` since any response starting with `{` should be treated as JSON.

### FIX 2 (P1) - Server Complete Event Fallback [BUG D]
**File:** `chat.ts` line 827-829
**Change:** Never fall back to raw `fullText` for the `message` field:
```typescript
// OLD (buggy):
message: parsedResponse.message || fullText,

// NEW (safe):
message: parsedResponse.message || "I'm here to help with workflow automation.",
```

### FIX 3 (P1) - Initialize Streaming Placeholder Correctly [BUG A mitigation]
**File:** `ChatContainer.tsx` line 856-858
**Change:** Initialize the streaming message with `'Thinking...'` instead of `''`, so the first onToken update showing raw `{"` is at most a 1-frame flicker before detection:
```typescript
const streamingMsg = addMessage('Thinking...', 'assistant')
```

### FIX 4 (P2) - Stream Endpoint: Filter JSON Tokens Server-Side [BUG C]
**File:** `chat.ts` line 775-778
**Change:** Track whether the response looks like JSON server-side and suppress token events in that case, only sending the `complete` event with the parsed message. This is the cleanest solution but requires more server changes.

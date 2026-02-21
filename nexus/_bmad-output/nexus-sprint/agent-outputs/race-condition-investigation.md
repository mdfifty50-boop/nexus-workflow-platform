# Race Condition Investigation: Premature WorkflowPreviewCard Generation

**Date:** 2026-02-18
**Reported Bug:** User answers AI's clarifying question, but WorkflowPreviewCard appears INSTANTLY — within 1ms — meaning the user's last answer was NOT processed before the card appeared.

---

## Executive Summary

The race condition has **multiple contributing mechanisms**, not a single cause. The primary culprit is the **template service short-circuit** in the backend, which can bypass Claude entirely on the FIRST message and return a complete `workflowSpec` with `shouldGenerateWorkflow: true` — before the user has answered any clarifying questions. A secondary mechanism is that **`conversationState` in ChatContainer operates as a parallel FSM that is completely decoupled from the Claude AI response path** — the two can conflict. A third mechanism is that the **streamed conversation history sent to Claude is double-written**, causing Claude to sometimes receive the user's answer AFTER it already ran on the previous state.

---

## 1. The Template Service Short-Circuit (PRIMARY BUG)

### Where it lives:
- **Backend:** `/server/routes/chat.ts` lines 233–250 (non-streaming), lines 625–643 (streaming)

### What it does:
```typescript
// @NEXUS-FIX-126: Only use templates for first message, not mid-conversation
const userMessageCount = messages.filter((m: any) => m.role === 'user').length
if (userMessageCount <= 1 && lastUserMessage?.content && typeof lastUserMessage.content === 'string') {
  const templateMatch = templateService.matchUserInput(lastUserMessage.content)
  // Raise threshold to 0.8 to only match very specific, exact requests
  if (templateMatch && templateMatch.score >= 0.8) {
    // ...returns template-based workflow IMMEDIATELY, bypassing Claude entirely
    return res.json({ ..., output: JSON.stringify(templateResponse) })
  }
}
```

### The Problem:
The guard `userMessageCount <= 1` checks how many user messages are in the `messages` array **as sent by the frontend**. But look at what the frontend sends in `NexusAIService.chatStream()` (line 488):

```typescript
body: JSON.stringify({
  messages: this.conversationHistory,  // ← Full conversation history!
  ...
})
```

And before every Claude call, `ChatContainer.handleSend()` (line 850) calls:
```typescript
nexusAIService.setConversationHistory(
  messages.map(m => ({ role: m.role, content: m.content }))
)
```

This syncs the FULL chat history including ALL prior turns. So `userMessageCount` will correctly be > 1 after the first exchange.

**HOWEVER**, the `conversationHistory` in `NexusAIService` is also updated by `chatStream()` itself. There is a **double-write** race:

1. `ChatContainer.handleSend()` calls `nexusAIService.setConversationHistory(messages)` — sets history from React state
2. Immediately after, `nexusAIService.chatStream(content, ...)` is called — which ALSO pushes the user message to `conversationHistory` (line 432 in NexusAIService.ts):

```typescript
async chatStream(userMessage, onToken, context) {
  // Add user message to history (same as chat())
  this.conversationHistory.push({    // ← SECOND push — duplicates the user message
    role: 'user',
    content: userMessage
  })
```

So the history that gets sent to the backend will have the user's message appearing **twice** in sequence. Claude receives a history where the last two entries are both the same user message. The confusion this causes can produce unpredictable AI behavior.

### Fix needed:
In `NexusAIService.chatStream()`, the `this.conversationHistory.push(userMessage)` at line 432 must be guarded to skip if `setConversationHistory()` was already called with the current message included, OR `ChatContainer` should NOT call `setConversationHistory()` before `chatStream()` (let `chatStream` manage the history exclusively).

---

## 2. The Two-Path Conversation State Problem (SECONDARY BUG)

### Where it lives:
- **Frontend:** `ChatContainer.tsx` lines 393–397, 753–836

### What happens:
`ChatContainer` maintains its OWN local conversation FSM completely separately from the Claude AI service:

```typescript
const [conversationState, setConversationState] = React.useState<'idle' | 'asking_questions' | 'generating'>('idle')
const [pendingQuestions, setPendingQuestions] = React.useState<SmartNexusQuestion[]>([])
const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0)
const [collectedInfo, setCollectedInfo] = React.useState<Record<string, string>>({})
```

And `handleSend()` has this at line 775:

```typescript
// If we're in question-asking mode, collect the answer
if (conversationState === 'asking_questions' && pendingQuestions.length > 0) {
  // ... handles locally WITHOUT calling Claude
  setIsLoading(false)
  return  // ← Early return, never reaches Claude AI path
}
```

This local FSM is populated by the **template-based fallback** (NexusWorkflowEngine at line 1133+), not by the Claude AI path. The Claude AI path (`nexusAIService.chatStream()`) runs INDEPENDENTLY and returns its own `clarifyingQuestions` array.

**The actual flow the bug creates:**

```
Turn 1: User sends vague request ("my sales are dropping")
  → Claude AI returns: shouldGenerateWorkflow: false, intent: "clarifying", clarifyingQuestions: [...]
  → ChatContainer renders question options as [CLARIFYING_OPTIONS_B64:...] markers
  → conversationState stays 'idle' (NOT set to 'asking_questions')
  → pendingQuestions stays [] (Claude's clarifyingQuestions are displayed but NOT stored in state)

Turn 2: User clicks an option or types an answer
  → handleSend() is called with the answer text
  → conversationState is STILL 'idle'
  → The asking_questions guard at line 775 is SKIPPED
  → Code falls through to the Claude AI path (line 868: nexusAIService.chatStream(content, ...))
  → BUT: nexusAIService.setConversationHistory(messages) is called first
  → The messages array from React state includes the FULL prior conversation
  → So Claude DOES receive the context — this part is fine
  → BUT: chatStream() also pushes the user answer again (double-push bug from #1)
```

The result: Claude receives either duplicated context or context from the PREVIOUS call state (before the user's answer was appended to React messages state). React state updates are async — by the time `handleSend` runs `nexusAIService.setConversationHistory(messages)`, the `messages` array in the closure may not yet include the user's just-submitted answer (it was added by `addMessage()` at line 767, which triggers an async state update).

### The 1ms timing:
When the user sends their clarifying answer:
1. `addMessage(content, 'user')` is called — React schedules a state update (async)
2. IMMEDIATELY, `nexusAIService.setConversationHistory(messages)` is called with the STALE messages array (not yet updated)
3. `chatStream()` is called immediately after
4. Claude receives history WITHOUT the user's latest answer
5. Claude re-generates a workflow card based on the PRIOR clarifying question state — which may have already returned a `shouldGenerateWorkflow: true` if Claude was being aggressive

This is the **1ms race** — the workflow card appears because Claude is running on stale state.

---

## 3. The AI Prompt Instructs Premature Workflow Generation (TERTIARY BUG)

### Where it lives:
- **Backend agent personality:** `/server/agents/index.ts` lines 356–382 (the Nexus agent's `personality` string)

### What the system prompt says:
The system prompt (for confidence >= 0.60) says:
```
For SPECIFIC automation requests (confidence >= 0.60) - GENERATE WORKFLOW WITH ONLY USER-MENTIONED TOOLS
```

And later (confidence scoring):
```
< 0.60: TOO VAGUE - Ask clarifying questions FIRST
0.60-0.84: Generate workflow with ONLY user-confirmed tools + include 2-3 missingInfo questions
```

The problem: **0.60 is a LOW threshold**. Many first-turn requests about sales, CRM, tracking, etc. will score above 0.60 even before any clarifying questions are answered. Claude will then return:

```json
{
  "shouldGenerateWorkflow": true,
  "intent": "workflow",
  "confidence": 0.72,
  "clarifyingQuestions": [...],
  "workflowSpec": { ... }
}
```

Note: Claude CAN return BOTH `shouldGenerateWorkflow: true` AND `clarifyingQuestions` in the same response. This is what triggers the card to appear immediately.

### In `ChatContainer.handleSend()` (line 937+):
```typescript
if (!aiResponse.shouldGenerateWorkflow) {
  // Handle clarifying questions, display them
  ...
  return
}

// aiResponse.workflowSpec is checked here
if (aiResponse.workflowSpec) {
  // Creates WorkflowPreviewCard IMMEDIATELY
  // ...
  setGeneratedWorkflows(prev => new Map(prev).set(workflowDisplayId, workflow))
}
```

The code only checks `shouldGenerateWorkflow` — it does NOT check whether there are pending `clarifyingQuestions` that haven't been answered yet. If `shouldGenerateWorkflow: true` AND a valid `workflowSpec` are both present, the card is ALWAYS created regardless of whether `clarifyingQuestions` were also returned.

---

## 4. The Conversation History Sync Race (CONFIRMED ROOT CAUSE for the 1ms issue)

### Code trace:

In `ChatContainer.handleSend()` (line 850-857):
```typescript
// Finding #13: Sync persisted messages into NexusAIService before every Claude call
nexusAIService.setConversationHistory(
  messages.map(m => ({ role: m.role, content: m.content }))
)

// Finding #14: Create a placeholder assistant message for streaming updates
const streamingMsg = addMessage('', 'assistant')   // ← async state update
streamingMessageIdRef.current = streamingMsg.id
updateMessage(streamingMsg.id, { isStreaming: true })
setIsLoading(false)

// Try streaming first
const aiResponse = await nexusAIService.chatStream(
  content,   // ← the user's CURRENT message
  ...
)
```

The `messages` React state used in `setConversationHistory()` is the state from the PREVIOUS render cycle. The `addMessage(content, 'user')` was called at line 767, but React batches state updates — the `messages` value in the closure is STALE (does not include the just-added user message).

Then inside `chatStream()` at line 432:
```typescript
this.conversationHistory.push({ role: 'user', content: userMessage })
```

So the actual history sent to Claude = (old messages from React state) + (user message pushed again).

If the old messages already contain the user message from a PRIOR call (because `persistHistory()` was called), the user message appears duplicated. Claude sees:
- [prior conversation]
- User: "[previous answer to clarifying question]"
- User: "[current answer to clarifying question]"   ← duplicate

This confuses Claude into treating the current answer as if it was the FIRST message in the sub-conversation, causing it to potentially generate a workflow card prematurely.

---

## 5. Complete Bug Flow Diagram

```
User: "My sales are dropping" (Turn 1)
  │
  ├─ addMessage("My sales are dropping", 'user')   [async state update]
  ├─ setConversationHistory(messages)              [messages = [] at this point]
  ├─ chatStream("My sales are dropping", ...)
  │    └─ pushes "My sales are dropping" to history
  │    └─ sends: [{ role: 'user', content: 'My sales are dropping' }]
  │    └─ Claude (confidence 0.65): shouldGenerateWorkflow: true,
  │         clarifyingQuestions: [...], workflowSpec: {...}
  │
  ├─ ChatContainer receives aiResponse
  ├─ aiResponse.shouldGenerateWorkflow = true
  ├─ aiResponse.workflowSpec is VALID
  ├─ WorkflowPreviewCard CREATED IMMEDIATELY ← BUG MANIFESTS
  ├─ clarifyingQuestions displayed in message too
  │
AI: "Here's your workflow: [CARD] + What's your main pain point?" (Turn 1 response)

User: "I need to track sales data" (Turn 2)
  │
  ├─ addMessage("I need to track sales data", 'user')   [async state update]
  ├─ setConversationHistory(messages)
  │    └─ messages at this point may NOT yet include "I need to track sales data"
  │       (React state update is async — messages may still be from before addMessage)
  │    └─ history set = [Turn1-user, Turn1-assistant]
  │
  ├─ chatStream("I need to track sales data", ...)
  │    └─ pushes "I need to track sales data" AGAIN to history
  │    └─ sends: [Turn1-user, Turn1-assistant, "I need to track sales data"]
  │       (without the addMessage update being reflected — possible duplicate)
  │
  └─ Claude generates another workflow card OR refines existing one
```

---

## 6. Key Code Locations for Each Bug

| Bug | File | Lines | Description |
|-----|------|-------|-------------|
| Template bypass | `/server/routes/chat.ts` | 233-250, 625-643 | Short-circuits Claude for first message |
| Double history push | `/src/services/NexusAIService.ts` | 432-434 | `chatStream()` pushes user msg that was already in `setConversationHistory()` |
| Stale state race | `/src/components/chat/ChatContainer.tsx` | 850-857 | `setConversationHistory(messages)` uses stale React closure |
| Card created despite clarifying questions | `/src/components/chat/ChatContainer.tsx` | 1031-1113 | `shouldGenerateWorkflow: true` → card created even if `clarifyingQuestions` present |
| AI threshold too low | `/server/agents/index.ts` | 228-235 (confidence scoring) | 0.60 threshold causes premature workflow generation |
| Two-path FSM decoupling | `/src/components/chat/ChatContainer.tsx` | 775-837 | Local `conversationState` FSM never used for Claude AI path questions |

---

## 7. Recommended Fixes (Prioritized)

### P0 — Fix the card creation gate (prevents 1ms race for all users)

In `ChatContainer.tsx` around line 1031, add a check:

```typescript
// BEFORE creating the workflow card, check if there are unanswered clarifying questions
if (aiResponse.workflowSpec && aiResponse.clarifyingQuestions && aiResponse.clarifyingQuestions.length > 0) {
  // Display clarifying questions ONLY — do NOT create the card yet
  aiResponse.shouldGenerateWorkflow = false
  // fall through to clarifying questions display
}
```

### P0 — Fix the stale history race (prevents double-push)

In `ChatContainer.handleSend()`, do NOT call `setConversationHistory()` manually. Instead, let `chatStream()` manage history exclusively. Remove the `nexusAIService.setConversationHistory(messages.map(...))` call at line 850, and instead rely on the history that `chatStream()` maintains internally. This eliminates the double-push and the stale-closure problem.

If cross-refresh history restoration is needed (Finding #13), it should only be done once on mount, not before every message send.

### P1 — Raise the AI confidence threshold

In `/server/agents/index.ts`, the nexus agent personality, change the Phase 2 threshold from 0.60 to 0.75:

```
PHASE 2 - GENERATION (confidence 0.75-0.84):
```

This forces more clarifying questions before a card is generated.

### P1 — Guard clarifyingQuestions in backend complete event

In `/server/routes/chat.ts` streaming endpoint (line 827), if `clarifyingQuestions` is present and non-empty, force `shouldGenerateWorkflow: false`:

```typescript
sendEvent('complete', {
  message: parsedResponse.message || fullText,
  // If AI is asking clarifying questions, suppress workflow card until they're answered
  shouldGenerateWorkflow: (parsedResponse.clarifyingQuestions?.length > 0)
    ? false
    : (parsedResponse.shouldGenerateWorkflow || false),
  ...
})
```

### P2 — Unify the two conversation FSMs

The `conversationState / pendingQuestions` local FSM in `ChatContainer.tsx` is only used for the template-based fallback path. The Claude AI path stores clarifying questions in the message text as `[CLARIFYING_OPTIONS_B64:...]` markers without populating `pendingQuestions`. This means the two paths are completely decoupled. They should be unified so that when Claude returns `clarifyingQuestions`, the state machine is also updated to `asking_questions` and `pendingQuestions` is populated.

---

## 8. Verified: No Rogue `useEffect` Triggers

A full search of `ChatContainer.tsx` confirmed there is NO `useEffect` that directly watches workflow state and auto-triggers card creation. The `WorkflowPreviewCard` is rendered inline in the message render loop (`renderWorkflowPreview` at line 1304) — it only renders when a `[WORKFLOW_PREVIEW:id]` marker is present in the message content AND the workflow exists in `generatedWorkflows` Map. The timing issue is entirely in the `handleSend()` logic, not in any effect.

---

## 9. Conclusion

The "1ms" timing the user observed is explained by:

1. **Claude receiving stale/incomplete conversation history** due to the async React state race between `addMessage()` and `setConversationHistory()`, combined with the double-push in `chatStream()`
2. **The AI returning `shouldGenerateWorkflow: true` alongside `clarifyingQuestions`** (legal per the prompt, but the frontend doesn't gate card creation on whether questions are answered)
3. **The card being created unconditionally** whenever `shouldGenerateWorkflow: true` + valid `workflowSpec` are present, with no check for pending unanswered questions

The card was NOT triggered by a stale workflow from localStorage, a rogue `useEffect`, or the template service (which only applies to the very first message with score >= 0.8). It was triggered by Claude genuinely generating a workflow spec on the FIRST turn (confidence >= 0.60) and the frontend creating the card without waiting for the user's answers.

# Cycle 1: Memory Specialist Findings

## Investigation: Nexus Conversation Memory Architecture

---

## 1. The Message Cap: Confirmed at 10 Messages

**Verdict: The Opus audit was accurate.** The cap is 10 messages (not 10 turns -- 10 individual messages, meaning 5 user + 5 assistant exchanges).

### Exact Code (NexusAIService.ts)

There are **four** enforcement points for the 10-message cap:

#### Point 1: Constructor -- loading from localStorage (line 106)
```typescript
this.conversationHistory = parsed.slice(-10) // Keep last 10
```

#### Point 2: persistHistory() -- saving to localStorage (line 122)
```typescript
JSON.stringify(this.conversationHistory.slice(-10))
```

#### Point 3: chat() method -- before sending to Claude (line 272-274)
```typescript
if (this.conversationHistory.length > 10) {
  this.conversationHistory = this.conversationHistory.slice(-10)
}
```

#### Point 4: chatStream() method -- before sending to Claude (line 442-444)
```typescript
if (this.conversationHistory.length > 10) {
  this.conversationHistory = this.conversationHistory.slice(-10)
}
```

### What "10 messages" actually means in practice:

A typical conversation has alternating user/assistant messages. So 10 messages = **5 exchanges** (5 user + 5 assistant). After the 6th user message, the earliest user+assistant pair gets truncated.

---

## 2. How Truncation Works

### Simple Sliding Window -- No Summarization

The truncation is a **hard cutoff** with `.slice(-10)`. There is:

- **NO conversation summarization** before truncation
- **NO "important message" detection** to preserve key context
- **NO compression step** (e.g., summarizing older messages into a digest)
- **NO sliding summary** (like "Previous context: user was discussing X")

When message 11 arrives, message 1 simply disappears. Gone. No trace.

### What Gets Lost

When a user sends their 6th message in a diagnostic conversation:

| Message # | Role | Example Content | Status at Message 11 |
|-----------|------|-----------------|---------------------|
| 1 | user | "My sales dropped 40% last month" | **LOST** |
| 2 | assistant | "Let me understand. What industry?" | **LOST** |
| 3 | user | "E-commerce, fashion. Kuwait market." | Possibly lost |
| 4 | assistant | "What channels? WhatsApp? Instagram?" | Possibly lost |
| 5 | user | "Mainly Instagram + WhatsApp Business" | May survive |
| 6-10 | ... | Later diagnostic messages | Survive |

The **root problem statement** and **early diagnostic context** (industry, region, scale) are the first to be dropped.

---

## 3. Dual Memory Architecture

Nexus has two **separate** conversation memory systems that do NOT share data:

### System A: NexusAIService.conversationHistory (THE ONE THAT MATTERS)

- **Cap:** 10 messages
- **Storage:** localStorage key `nexus_ai_conversation_history`
- **Purpose:** This is what gets sent to Claude as conversation context
- **Format:** `Array<{ role: 'user' | 'assistant', content: string }>`
- **Truncation:** Hard `.slice(-10)` on every message add

### System B: useChatState / ChatPersistenceService (UI DISPLAY ONLY)

- **Cap:** None (unlimited messages stored per session)
- **Storage:** localStorage key `nexus-chat-sessions` + optional Supabase cloud sync
- **Purpose:** Displaying messages in the chat UI, session management
- **Format:** Full `ChatMessage` objects with timestamps, IDs, streaming flags

**Critical Disconnect:** The UI shows ALL messages (System B), but Claude only receives the LAST 10 (System A). The user sees their full conversation but the AI has amnesia about earlier messages.

### Sync Point (ChatContainer.tsx line 850)

```typescript
nexusAIService.setConversationHistory(
  messages.map(m => ({ role: m.role, content: m.content }))
)
```

This syncs System B into System A **before every Claude call**, but `setConversationHistory` then immediately calls `persistHistory()` which applies `.slice(-10)`. So even though the full history is briefly available, it gets truncated before being sent to Claude.

---

## 4. Server-Side Memory: None

The server (`server/routes/chat.ts`) has **no server-side conversation memory**. It receives whatever the client sends in the `messages` array and passes it directly to Claude:

```typescript
// chat.ts line 381-384
const claudeResult = await callClaudeWithCaching({
  systemBlocks,
  messages: messages, // Full conversation history!
  maxTokens,
  model
})
```

The comment says "Full conversation history!" but in practice, the client has already truncated to 10 messages before sending.

The server **does** add significant context via the system prompt:
- Agent personality (~2000+ tokens from `agents/index.ts`)
- Team context (~200 tokens, cached)
- User context (if provided -- business profile, industry persona, etc.)
- Tool/app detection context
- Language instructions (Arabic rules if applicable)
- Intent pre-parse results
- "Think with me" mode directive (if active)

But none of this is conversation-specific memory. It's static/semi-static context.

---

## 5. What Compensates for the Message Cap

### A. UserMemoryService (Persistent Profile -- NOT Conversation)

`UserMemoryService.ts` aggregates a user profile from localStorage:
- Business profile (industry, role, company size)
- Automation maturity (total workflows, success rate)
- Top integrations used
- Recent workflow names
- Behavioral patterns (peak usage time, complexity preference)
- Known entities (mentioned emails, channels)
- Communication style adaptation (new/learning/proficient/power_user)

This produces ~800-1200 tokens of context sent in **every** request as `userContext`. It partially compensates by giving Claude long-term knowledge about the user, but it does NOT contain any conversation-specific diagnostic information.

### B. UserContextService (Entity Extraction -- Cross-Conversation)

`UserContextService.ts` extracts entities from messages:
- Email addresses mentioned
- Slack channels mentioned
- Names mentioned
- Time references

These persist across conversations (in localStorage), so if a user mentioned `john@example.com` yesterday, Claude knows about it today. But it does NOT preserve the diagnostic reasoning or conversation flow.

### C. Industry Persona Overlay

If the user set their industry during onboarding, Claude receives domain-specific context:
```typescript
contextParts.push(`## Industry Context: ${persona.name}\n${overlay.industryContext}`)
```

This gives Claude background knowledge but, again, not conversation-specific memory.

---

## 6. The Diagnostic Conversation Problem -- Detailed Impact

### Scenario: 15-message sales diagnostic

Messages 1-4: User describes problem, AI asks clarifying questions about their business.
Messages 5-8: Deep diagnostic -- which channels, what metrics, competitors.
Messages 9-12: AI identifies root cause, discusses solutions.
Messages 13-15: AI builds a workflow based on the full diagnosis.

**What actually happens:**

| At Message... | Claude Receives | Claude Has Lost |
|---------------|-----------------|-----------------|
| 1-10 | Full conversation | Nothing |
| 11 | Messages 2-11 | Message 1 (the original problem statement) |
| 12 | Messages 3-12 | Problem statement + first diagnostic Q&A |
| 13 | Messages 4-13 | Problem + first 2 diagnostic exchanges |
| 14 | Messages 5-14 | Problem + first 3 exchanges |
| 15 | Messages 6-15 | Problem + first 4 exchanges |

**By message 15 (workflow generation time):**
- Claude has NO memory of the original problem description
- Claude has NO memory of the industry/channel diagnosis from messages 1-4
- Claude only has messages 6-15 (the later solution discussion)
- The workflow it generates may miss critical requirements established early in the conversation

### System Prompt Token Budget Impact

The system prompt is NOT counted in the 10-message cap (it's sent separately in `system` blocks), so it doesn't "eat into" the conversation history. This is good. But the system prompt itself is large (~3000-5000 tokens with all context injected), which means the effective Claude context window is reduced.

For `claude-sonnet-4-6` (200k context), this is not an issue -- 10 messages fit easily. The cap is **artificial**, not imposed by Claude's context limit.

---

## 7. Workflow Card Context

### Does the AI have diagnostic context when generating a workflow?

**At the moment of workflow generation**, Claude has:
1. The last 10 messages of conversation (which may miss early diagnostic context)
2. The system prompt with user profile, industry persona, regional context
3. Intent pre-parse data from IntentResolverService
4. Tool/app detection context

**If the workflow generation happens at message 8 or earlier:** Full context available. No problem.

**If the workflow generation happens at message 12+:** Early diagnostic context is lost. The workflow spec may be incomplete.

### Post-Generation Refinement Problem

If a user generates a workflow at message 8 (all context intact), then says "actually, change step 3 to use Dropbox" at message 12, Claude still has the workflow in its recent history. But if they ask for a major revision at message 15+, Claude may have lost the original reasoning for the workflow design.

---

## 8. Recommendations

### Immediate Fixes (High Impact, Low Effort)

1. **Increase cap to 30 messages** -- Claude Sonnet 4.6 has 200k context. 30 messages (~6000 tokens) is trivially small. Change the four `.slice(-10)` calls to `.slice(-30)`. Estimated token cost increase: negligible (~$0.001/conversation).

2. **Add conversation summary at truncation** -- Before truncating, generate a 2-3 sentence summary of the oldest messages being dropped and prepend it as a system message. This preserves core diagnostic context.

### Medium-Term Improvements

3. **Smart truncation** -- Instead of dropping oldest messages uniformly, preserve:
   - The first user message (always contains the core request)
   - Any message containing a workflowSpec
   - Messages with high entity density (emails, channel names, technical requirements)
   - Drop middle "chit-chat" messages first

4. **Server-side conversation memory** -- Store a persistent conversation summary in Supabase per session. On each request, the server adds a `## Previous Conversation Summary` section to the system prompt.

5. **Thread the needle between System A and System B** -- System B (useChatState) already stores unlimited messages. Instead of syncing ALL messages then truncating, sync ALL and let the server handle intelligent truncation with token counting.

### Long-Term Architecture

6. **Retrieval-Augmented Conversation (RAC)** -- Index all conversation messages in a vector store. On each new message, retrieve the most relevant previous messages (not just the most recent). This ensures diagnostic context from message 1 is available at message 50 if relevant.

---

## Summary

| Aspect | Current State | Severity |
|--------|--------------|----------|
| Message cap | 10 messages (hard coded, 4 enforcement points) | HIGH |
| Summarization | None | HIGH |
| Server-side memory | None beyond system prompt | MEDIUM |
| User profile context | Good (UserMemoryService ~800-1200 tokens) | OK |
| Entity extraction | Good (UserContextService, cross-conversation) | OK |
| Industry persona | Good (from onboarding) | OK |
| Full history persistence | Yes, in useChatState/ChatPersistenceService | OK |
| Full history sent to AI | NO -- only last 10 messages | HIGH |
| Workflow context at generation | Depends on conversation length | MEDIUM |
| Token budget for 30-msg cap | ~$0.001 additional per conversation | TRIVIAL |

**Bottom line:** The 10-message cap is a serious architectural limitation for diagnostic conversations. The AI literally forgets the problem it was asked to solve. The fix is straightforward (increase cap + add summary), low risk, and almost zero cost.

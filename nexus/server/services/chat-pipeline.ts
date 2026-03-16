/**
 * Chat Pipeline — shared pre/post-processing for stream and non-stream paths
 *
 * Extracted from server/routes/chat.ts to eliminate dual code path duplication.
 * Both POST / (non-stream) and POST /stream call these functions, then diverge
 * only for response delivery (JSON vs SSE).
 *
 * Fix markers preserved in this file:
 *   FIX-101, FIX-160, FIX-161, FIX-170, FIX-177, FIX-180,
 *   FIX-187, FIX-190, FIX-193, FIX-194, FIX-195, FIX-195b, FIX-200, FIX-201
 */

import Anthropic from '@anthropic-ai/sdk'
import type { Agent } from '../agents/index.js'

// =============================================================================
// Constants
// =============================================================================

// "Think with me" mode directive - focused problem-solving
// @NEXUS-FIX-101: Think with me mode directive - DO NOT REMOVE
export const THINK_WITH_ME_DIRECTIVE = `## MODE: THINK WITH ME (ACTIVE)

You are in FOCUSED PROBLEM-SOLVING mode. Your approach MUST be:

1. **ASK FIRST, ALWAYS**: Before ANY workflow suggestion, ask 2-3 precise questions
2. **BE DIRECT**: No fluff, no pleasantries, no extra words. Get straight to the core question
3. **ONE QUESTION AT A TIME**: Don't overwhelm. Ask the most critical question first
4. **BUILD UNDERSTANDING**: Each question should build on previous answers
5. **HIGH BAR FOR CONFIDENCE**: Only suggest workflow when confidence > 0.85

**Question style examples:**
- "What triggers this - time-based, event-based, or manual?"
- "Where does the data currently live?"
- "What's the expected output format?"

**DO NOT in this mode:**
- Generate workflow cards until you have HIGH confidence (>0.85)
- Add conversational words ("Great question!", "I understand...", "I'd love to help!")
- Ask more than 2-3 questions per response
- Show workflow until you fully understand the problem

**Response format in THINK WITH ME mode:**
- First response: Ask about the core problem
- Follow-ups: Dig deeper based on answers
- Only when confident: Generate the optimal workflow

`

// Static team context that rarely changes - good candidate for caching
export const TEAM_CONTEXT = `You are part of the BMAD team at Nexus. Your colleagues are:
- Larry (Business Analyst) - requirements and user stories
- Mary (Product Manager) - strategy and prioritization
- Alex (Solutions Architect) - system design and architecture
- Sam (Senior Developer) - coding and implementation
- Emma (UX Designer) - user experience and design
- David (DevOps Engineer) - deployment and infrastructure
- Olivia (QA Lead) - testing and quality
- Nexus (AI Orchestrator) - coordination and general help

If a question is better suited for a colleague, suggest the user speak with them directly.

Current conversation context: The user is working in the Nexus workflow automation platform.`

// =============================================================================
// Types
// =============================================================================

export interface CustomIntegrationInfo {
  appName: string
  displayName: string
  apiDocsUrl: string
  apiKeyUrl?: string
  steps: string[]
  keyHint: string
  category?: string
}

// =============================================================================
// Prompt Building
// =============================================================================

/**
 * Build system prompt with cache_control for prompt caching
 *
 * Caching strategy:
 * - Agent personality: Included in first block (with user context injected)
 * - Team context: Marked with cache_control (static across all requests)
 *
 * This reduces input token costs by ~90% on cache hits
 * First request pays 25% extra for cache write, subsequent requests save 90%
 *
 * @param agent - The agent to use
 * @param userContext - Optional user context for inference
 * @param chatMode - Chat mode: 'standard' or 'think_with_me'
 */
// @NEXUS-FIX-193: Prompt caching architecture — cache the STATIC personality block separately - DO NOT REMOVE
// Previously, userContext was injected INTO the personality, making the entire combined block
// dynamic per-request and preventing cache hits. Now:
//   Block 1: Static personality (~15K tokens) — CACHED (cache_control: ephemeral)
//   Block 2: Team context (static, small) — part of cached prefix
//   Block 3: Dynamic user context (per-request) — NOT cached, sent fresh each time
//
// Anthropic caches everything up to and including the last block with cache_control.
// On cache HIT, the 15K-token personality costs 90% less ($0.30/1M instead of $3/1M for Sonnet).
// First request per 5-min window pays 25% extra (cache write), subsequent requests save 90%.
export function buildCachedSystemPrompt(
  agent: Agent,
  userContext?: string,
  chatMode: 'standard' | 'think_with_me' = 'standard'
): Anthropic.Messages.TextBlockParam[] {
  // Block 1: The big static personality — this is what we want cached
  let personality = agent.personality
  // @NEXUS-FIX-101: Prepend "Think with me" directive when in that mode
  // Note: This creates a separate cache entry for think_with_me mode, which is fine
  // (2 cache entries instead of 1, both with high hit rates)
  if (chatMode === 'think_with_me') {
    personality = THINK_WITH_ME_DIRECTIVE + personality
    console.log('[Chat] "Think with me" mode ACTIVE - focused problem-solving enabled')
  }

  const blocks: Anthropic.Messages.TextBlockParam[] = [
    {
      type: 'text',
      text: personality,
      cache_control: { type: 'ephemeral' }
    },
    {
      type: 'text',
      text: TEAM_CONTEXT,
    }
  ]

  // Block 3: Dynamic user context — appended AFTER the cached prefix
  // This includes: language directives, tool context, intent data, conversation bridges
  // It changes per-request, so it must NOT be inside the cached block
  if (userContext) {
    // Check if personality has a placeholder (legacy support)
    if (agent.personality.includes('{{USER_CONTEXT}}')) {
      // Replace placeholder in a separate dynamic block (not in the cached personality)
      blocks.push({
        type: 'text',
        text: `## USER CONTEXT (for inference)\n${userContext}`
      })
    } else {
      blocks.push({
        type: 'text',
        text: `## USER CONTEXT (for inference)\n${userContext}`
      })
    }
  }

  return blocks
}

// =============================================================================
// Conversation Analysis
// =============================================================================

// @NEXUS-FIX-177: Conversation phase state machine - DO NOT REMOVE
// Derives the current conversation phase from message history.
// Phases: discovery → clarifying → generating → refining
export function deriveConversationPhase(messages: any[], parsedResponse: any): 'discovery' | 'clarifying' | 'generating' | 'refining' {
  const userMsgCount = messages.filter((m: any) => m.role === 'user').length
  const hasWorkflowInHistory = messages.some((m: any) =>
    m.role === 'assistant' && typeof m.content === 'string' && m.content.includes('shouldGenerateWorkflow')
  )

  if (userMsgCount <= 1) return 'discovery'
  if (userMsgCount <= 3 && !hasWorkflowInHistory) return 'clarifying'
  if (hasWorkflowInHistory) return 'refining'
  return 'generating'
}

// =============================================================================
// History Trimming
// =============================================================================

// @NEXUS-FIX-195: Conversation history trimming — reduce token costs on long conversations - DO NOT REMOVE
// After 10+ messages, older messages are summarized into a single context block while
// keeping the last 5 messages in full. This prevents linearly growing token costs.
// Impact: 1-3% quality loss on deep context recall (message #2 details in a 15-turn convo)
// Mitigation: Last 5 messages always in full, 250/350-char snippets preserve key business details
const HISTORY_TRIM_THRESHOLD = 10 // Total messages before trimming kicks in
const RECENT_MESSAGES_TO_KEEP = 5 // Always keep last N messages in full

export function trimConversationHistory(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (messages.length <= HISTORY_TRIM_THRESHOLD) {
    return messages // No trimming needed
  }

  // Split into old messages (to summarize) and recent messages (to keep)
  const cutoff = messages.length - RECENT_MESSAGES_TO_KEEP
  const oldMessages = messages.slice(0, cutoff)
  const recentMessages = messages.slice(cutoff)

  // Build a summary of old messages preserving key facts
  const summaryParts: string[] = []
  for (const msg of oldMessages) {
    const content = typeof msg.content === 'string' ? msg.content : ''
    if (msg.role === 'user') {
      // Extract the core of user messages (first 250 chars)
      // @NEXUS-FIX-195b: Increased from 150→250 to preserve critical first-message details (business name, agent count, etc.) - DO NOT REMOVE
      const snippet = content.length > 250 ? content.substring(0, 250) + '...' : content
      summaryParts.push(`User said: ${snippet}`)
    } else {
      // For assistant messages, extract key decisions/info (first 350 chars)
      // Skip raw JSON — extract the message field if present
      let snippet = content
      try {
        const parsed = JSON.parse(content)
        if (parsed.message) snippet = parsed.message
      } catch { /* not JSON, use as-is */ }
      // @NEXUS-FIX-195b: Increased from 200→350 to preserve workflow decisions and clarifying context - DO NOT REMOVE
      snippet = snippet.length > 350 ? snippet.substring(0, 350) + '...' : snippet
      summaryParts.push(`Assistant responded: ${snippet}`)
    }
  }

  const summaryText = `[CONVERSATION SUMMARY - ${oldMessages.length} earlier messages]\n${summaryParts.join('\n')}\n[END SUMMARY - Recent messages follow in full]`

  // Return: summary as first user message + all recent messages
  return [
    { role: 'user' as const, content: summaryText },
    ...recentMessages
  ]
}

// =============================================================================
// Model Tiering
// =============================================================================

// @NEXUS-FIX-194: Chat-specific model tiering — route simple messages to Haiku - DO NOT REMOVE
// Saves ~75% on greeting/simple messages (30% of all messages) with negligible quality impact.
// Only greetings and trivial Q&A use Haiku. ALL workflow, diagnostic, and clarifying conversations stay on Sonnet.
const GREETING_PATTERNS = /^(hi|hello|hey|مرحبا|هلا|السلام عليكم|good\s*(morning|afternoon|evening)|thanks?|thank\s*you|شكرا|ok|okay|got\s*it|cool|nice|great|awesome|perfect|yes|no|bye|goodbye|مع السلامة)[\s!?.]*$/i
const SIMPLE_QA_PATTERNS = /^(what\s*(is|are|can)\s*(nexus|you)|how\s*does\s*(this|nexus)\s*work|what\s*can\s*you\s*do|help|شو\s*(تقدر|هذا)|كيف\s*(تشتغل|يعمل)|ايش\s*(تسوي|تقدر))[\s?]*$/i

export function selectChatModel(userMessage: string, messageCount: number, chatMode: string): { model: string; reason: string } {
  // NEVER use Haiku for: think_with_me mode, multi-turn conversations, or workflow-related messages
  if (chatMode === 'think_with_me') {
    return { model: 'claude-sonnet-4-6', reason: 'think_with_me mode requires Sonnet' }
  }

  // Only consider Haiku for the first message (single-turn simple interactions)
  if (messageCount > 1) {
    return { model: 'claude-sonnet-4-6', reason: 'multi-turn conversation requires Sonnet' }
  }

  const trimmed = userMessage.trim()

  // Very short greetings → Haiku
  if (trimmed.length <= 30 && GREETING_PATTERNS.test(trimmed)) {
    return { model: 'claude-haiku-4-5-20251001', reason: 'simple greeting → Haiku' }
  }

  // Simple Q&A about what Nexus does → Haiku
  if (trimmed.length <= 60 && SIMPLE_QA_PATTERNS.test(trimmed)) {
    return { model: 'claude-haiku-4-5-20251001', reason: 'simple Q&A → Haiku' }
  }

  // Everything else → Sonnet (workflow requests, complaints, diagnostics, Arabic business queries)
  return { model: 'claude-sonnet-4-6', reason: 'complex request → Sonnet' }
}

// =============================================================================
// Context Enrichment
// =============================================================================

/**
 * Build enriched user context from language, tool detection, intent, and conversation state.
 * Consolidates the context-building logic that was duplicated between stream and non-stream paths.
 *
 * Fix markers: FIX-160, FIX-161, FIX-190, FIX-201
 */
export function buildEnrichedUserContext(params: {
  userContext?: string
  language?: string
  toolContext: string
  intentContext?: string
  userMessageCount: number
  lastUserMessage?: { role: string; content: string }
  messages: Array<{ role: string; content: string }>
  chatMode: string
  logPrefix?: string
}): string | undefined {
  const {
    userContext,
    language,
    toolContext,
    intentContext,
    userMessageCount,
    lastUserMessage,
    messages,
    chatMode,
    logPrefix = '[Chat]'
  } = params

  let enrichedUserContext = userContext || ''

  // @NEXUS-FIX-160: Improved Arabic language instruction with explicit JSON format example - DO NOT REMOVE
  // @NEXUS-FIX-161: Arabic workflow step names and descriptions - DO NOT REMOVE
  // Language preference from UI (user selected language)
  if (language && language !== 'en-US') {
    const langPrefix = language.startsWith('ar')
      ? `CRITICAL LANGUAGE RULE: The user has selected "${language}" as their preferred language.
Respond in Arabic (Gulf/Kuwaiti dialect preferred).
HOWEVER, your response MUST be valid JSON with these EXACT English field names: "message", "shouldGenerateWorkflow", "intent", "confidence", "workflowSpec".

ARABIC TEXT RULES:
1. The VALUE of "message" MUST be in Arabic.
2. When generating a workflowSpec, ALL human-readable text MUST be in Arabic:
   - workflowSpec.name MUST be in Arabic (e.g., "حفظ رسائل البريد في جدول بيانات")
   - workflowSpec.description MUST be in Arabic
   - EVERY step's "name" field in workflowSpec.steps[] MUST be in Arabic (e.g., "استقبال بريد إلكتروني جديد")
   - estimatedTimeSaved MUST be in Arabic (e.g., "ساعتين في الأسبوع")
3. ONLY the JSON field KEYS stay in English: "name", "id", "tool", "type", "steps", "description", etc.
4. ONLY "tool" VALUES stay in English lowercase (e.g., "gmail", "slack", "googlesheets")
5. ONLY "type" VALUES stay in English ("trigger", "action")
6. ONLY "id" VALUES stay in English (e.g., "step_1", "step_2")

Example of a correct Arabic workflow response:
{"message": "سأنشئ لك سير عمل لحفظ رسائل البريد في جدول بيانات.", "shouldGenerateWorkflow": true, "intent": "workflow", "confidence": 0.9, "workflowSpec": {"name": "حفظ رسائل البريد في جدول بيانات", "description": "عند استقبال بريد إلكتروني جديد، يتم حفظ المعلومات تلقائياً في جدول بيانات جوجل", "steps": [{"id": "step_1", "name": "استقبال بريد إلكتروني جديد", "tool": "gmail", "type": "trigger"}, {"id": "step_2", "name": "حفظ البيانات في جدول بيانات", "tool": "googlesheets", "type": "action"}], "requiredIntegrations": ["gmail", "googlesheets"], "estimatedTimeSaved": "ساعتين في الأسبوع"}}

Example of a correct Arabic greeting response (no workflow):
{"message": "مرحبا! كيف أقدر أساعدك اليوم؟", "shouldGenerateWorkflow": false, "intent": "greeting"}

For conversational responses (no workflow needed), set shouldGenerateWorkflow to false.
NEVER include workflow specs unless the user EXPLICITLY asks for automation/workflow.
Do NOT wrap JSON in markdown code blocks. Return ONLY the raw JSON object.`
      : `The user has selected "${language}" as their preferred language. Respond in this language but ALWAYS maintain the JSON response format.`
    enrichedUserContext = langPrefix + '\n\n' + enrichedUserContext
  }
  if (toolContext) enrichedUserContext += `\n\n${toolContext}`
  // Finding #55: Include pre-parsed intent for smarter workflow generation
  if (intentContext) enrichedUserContext += `\n\n## Pre-Parsed Intent\n${intentContext}`

  // @NEXUS-FIX-190: Context bridge for multi-turn follow-ups - DO NOT REMOVE
  // When a user sends a short answer (e.g., "Mixed chaos") as a follow-up to a clarifying question,
  // Claude sometimes returns an empty message because it doesn't recognize the short text as an answer.
  // This context bridge explicitly tells Claude it's a continuation.
  if (userMessageCount > 1 && lastUserMessage?.content && lastUserMessage.content.length < 50) {
    // Find the last assistant message to understand what question was asked
    const lastAssistantMsg = [...messages].reverse().find((m: any) => m.role === 'assistant')
    const prevAssistantContent = typeof lastAssistantMsg?.content === 'string' ? lastAssistantMsg.content : ''
    if (prevAssistantContent) {
      enrichedUserContext += `\n\n## CONVERSATION CONTINUATION (CRITICAL)
The user's latest message "${lastUserMessage.content}" is a DIRECT ANSWER to your previous question/options.
Your previous message included: "${prevAssistantContent.substring(0, 200)}..."
IMPORTANT: Treat this as a follow-up answer, NOT a new conversation. Acknowledge what they chose and continue helping with their original request.
Your "message" field MUST contain a substantive response acknowledging their answer. NEVER return an empty message.`
    }
  }

  // @NEXUS-FIX-201: Max clarification rounds enforcement - DO NOT REMOVE
  // After 3+ clarifying exchanges (4+ user messages), Claude MUST generate a workflow
  // instead of asking more questions. Put remaining questions in missingInfo (inside the card).
  if (userMessageCount >= 4 && chatMode === 'standard') {
    const hasWorkflowInHistory = messages.some((m: any) => m.role === 'assistant' && typeof m.content === 'string' && m.content.includes('shouldGenerateWorkflow'))
    if (!hasWorkflowInHistory) {
      enrichedUserContext += `\n\n## MAX CLARIFICATION ROUNDS REACHED (MANDATORY)
You have already asked ${userMessageCount - 1} rounds of clarifying questions. You MUST NOW generate a workflow.
DO NOT ask more clarifying questions. DO NOT set shouldGenerateWorkflow to false.
You MUST set shouldGenerateWorkflow: true and include a complete workflowSpec.
If you still have remaining questions, put them in "missingInfo" array (shown INSIDE the workflow card for quick refinement).
Use the tools the user has mentioned so far. For any tools not yet confirmed, make reasonable choices based on context and note them in "assumptions".
THIS IS A HARD RULE: shouldGenerateWorkflow MUST be true in your response.`
      console.log(`${logPrefix} FIX-201: Max clarification rounds (${userMessageCount} user msgs) — forcing workflow generation`)
    }
  }

  return enrichedUserContext.trim() || undefined
}

// =============================================================================
// Response Processing — JSON Extraction
// =============================================================================

/**
 * Extract JSON from AI response text using brace-depth tracking.
 *
 * @NEXUS-FIX-160: Brace-depth JSON extraction (Arabic-safe) - DO NOT REMOVE
 * The old greedy regex /\{[\s\S]*\}/ would match from first { to LAST },
 * which fails with Arabic text and captures too much content.
 * This uses proper brace-depth tracking identical to NexusAIService.extractJSON()
 */
export function extractJSONFromText(text: string): Record<string, unknown> {
  try {
    const startIdx = text.indexOf('{')
    if (startIdx !== -1) {
      let depth = 0
      let inStr = false
      let esc = false
      let endIdx = -1
      for (let i = startIdx; i < text.length; i++) {
        const ch = text[i]
        if (esc) { esc = false; continue }
        if (ch === '\\' && inStr) { esc = true; continue }
        if (ch === '"' && !esc) { inStr = !inStr; continue }
        if (inStr) continue
        if (ch === '{') depth++
        if (ch === '}') { depth--; if (depth === 0) { endIdx = i; break } }
      }
      if (endIdx !== -1) {
        return JSON.parse(text.substring(startIdx, endIdx + 1))
      }
    }
  } catch {
    // Response was plain text, not JSON - that's fine
  }
  return {}
}

// =============================================================================
// Response Processing — Message Recovery
// =============================================================================

/**
 * Recover empty/missing messages from AI responses.
 * Mutates parsedResponse in-place.
 *
 * @NEXUS-FIX-190: Robust message extraction for multi-turn conversations - DO NOT REMOVE
 * @NEXUS-FIX-200: Extended to also handle first-message plain text responses (e.g. Think with me mode) - DO NOT REMOVE
 * When Claude returns plain text instead of JSON (common in think_with_me and consulting modes),
 * or JSON with an empty/missing message field, extract the message from raw text.
 */
export function recoverEmptyMessage(
  parsedResponse: Record<string, unknown>,
  fullText: string,
  chatMode: string,
  enrichedUserContext?: string,
  logPrefix: string = '[Chat]'
): void {
  if (!parsedResponse.message) {
    // Try to salvage a message from the raw response
    const trimmedFull = fullText.trim()
    if (trimmedFull && !trimmedFull.startsWith('{')) {
      // Claude returned plain text - use it directly as the message
      parsedResponse.message = trimmedFull
      parsedResponse.shouldGenerateWorkflow = false
      // @NEXUS-FIX-200: Use 'consulting' intent for strategic/think-with-me, 'clarifying' for follow-ups
      parsedResponse.intent = (chatMode === 'think_with_me' || enrichedUserContext?.includes('isStrategic: true')) ? 'consulting' : 'clarifying'
      console.log(`${logPrefix} FIX-190/200: Extracted plain text response (${trimmedFull.length} chars, intent: ${parsedResponse.intent})`)
    } else if (parsedResponse.message === '' || parsedResponse.message === null) {
      // JSON was valid but message was empty - try to extract from fullText
      const msgExtract = fullText.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/i)
      if (msgExtract && msgExtract[1].length > 0) {
        parsedResponse.message = msgExtract[1]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\\\/g, '\\')
        console.log(`${logPrefix} FIX-190: Recovered message from regex extraction (${(parsedResponse.message as string).length} chars)`)
      }
    }
  }
}

// =============================================================================
// Response Processing — Confidence Gating & Enforcement
// =============================================================================

/**
 * Apply confidence gating, phase enforcement, and density guards to AI responses.
 * Consolidates logic that was duplicated between stream and non-stream paths.
 * Mutates parsedResponse in-place.
 *
 * Fix markers: FIX-170, FIX-177, FIX-180, FIX-187, FIX-200, FIX-201
 */
export function gateWorkflowResponse(params: {
  parsedResponse: Record<string, unknown>
  messages: Array<{ role: string; content: string }>
  enrichedUserContext?: string
  toolContext: string
  chatMode: string
  userMessageCount: number
  logPrefix?: string
}): void {
  const {
    parsedResponse,
    messages,
    enrichedUserContext,
    toolContext,
    chatMode,
    userMessageCount,
    logPrefix = '[Chat]'
  } = params

  // === @NEXUS-FIX-170: Server-side confidence gating - DO NOT REMOVE ===
  // Phase enforcement: Claude can no longer skip phases by self-assigning high confidence.
  if (parsedResponse.shouldGenerateWorkflow === true) {
    const claudeConfidence = (parsedResponse.confidence as number) ?? 0.5

    // Cross-reference with IntentResolver hint
    const intentConfidenceMatch = (enrichedUserContext || '').match(/Intent confidence:\s*([\d.]+)/)
    const intentConfidence = intentConfidenceMatch ? parseFloat(intentConfidenceMatch[1]) : null

    // Check for complaint/strategic flags from IntentResolver
    const isComplaint = (enrichedUserContext || '').includes('isComplaint: true')
    const isStrategic = (enrichedUserContext || '').includes('isStrategic: true')

    // @NEXUS-FIX-177: Derive conversation phase from message history - DO NOT REMOVE
    const phase = deriveConversationPhase(messages, parsedResponse)

    // RULE 1: Complaints/strategic questions NEVER get workflow cards
    if (isComplaint || isStrategic) {
      console.log(`${logPrefix} Phase gate: complaint/strategic detected, suppressing workflow card`)
      parsedResponse.shouldGenerateWorkflow = false
      parsedResponse.confidence = Math.min(claudeConfidence, 0.35)
    }
    // @NEXUS-FIX-187: RULE 2: Discovery phase - suppress ONLY if no explicit tools detected - DO NOT REMOVE
    else if (phase === 'discovery' && !toolContext) {
      console.log(`${logPrefix} Phase gate: discovery phase (first message, no tools), suppressing workflow card`)
      parsedResponse.shouldGenerateWorkflow = false
      parsedResponse.confidence = Math.min(claudeConfidence, 0.50)
      if (!parsedResponse.clarifyingQuestions) {
        parsedResponse.clarifyingQuestions = [{
          question: 'What tools do you currently use for this?',
          options: ['Google Workspace', 'Microsoft 365', 'Slack + project tools', 'CRM system', 'Custom...'],
          field: 'current_tools'
        }]
        parsedResponse.intent = 'clarifying'
      }
    }
    // @NEXUS-FIX-187: Discovery phase WITH explicit tools - allow workflow generation
    else if (phase === 'discovery' && toolContext) {
      console.log(`${logPrefix} Phase gate: discovery phase but explicit tools detected (${toolContext.substring(0, 80)}...), allowing workflow (confidence: ${claudeConfidence})`)
    }
    // @NEXUS-FIX-200: Only apply IntentResolver mismatch gate during discovery phase - DO NOT REMOVE
    // After clarifying exchanges (3+ messages), IntentResolver only sees the last short reply
    // ("Google Workspace", "ER doctors/nurses") and assigns low confidence. But Claude has full
    // conversation context and its high confidence should be trusted.
    else if (intentConfidence !== null && intentConfidence < 0.3 && claudeConfidence > 0.6 && phase === 'discovery') {
      console.log(`${logPrefix} Phase gate: IntentResolver(${intentConfidence}) vs Claude(${claudeConfidence}) mismatch in discovery, capping to 0.50`)
      parsedResponse.confidence = 0.50
      parsedResponse.shouldGenerateWorkflow = false
      if (!parsedResponse.clarifyingQuestions) {
        parsedResponse.clarifyingQuestions = [{
          question: 'What tools do you currently use for this?',
          options: ['Google Workspace', 'Microsoft 365', 'Slack + project tools', 'CRM system', 'Custom...'],
          field: 'current_tools'
        }]
        parsedResponse.intent = 'clarifying'
      }
    }
    // RULE 4: Low confidence (< 0.60) should never produce a workflow card
    else if (claudeConfidence < 0.60) {
      console.log(`${logPrefix} Phase gate: confidence ${claudeConfidence} < 0.60, suppressing workflow card`)
      parsedResponse.shouldGenerateWorkflow = false
    }
  }

  // @NEXUS-FIX-201: Server-side enforcement — force workflow after max clarification rounds - DO NOT REMOVE
  // If Claude still returned shouldGenerateWorkflow=false after 4+ user messages, force it if workflowSpec exists
  if (parsedResponse.shouldGenerateWorkflow !== true && userMessageCount >= 4 && chatMode === 'standard') {
    const phase201 = deriveConversationPhase(messages, parsedResponse)
    if (phase201 === 'generating' || phase201 === 'clarifying') {
      if (parsedResponse.workflowSpec && typeof parsedResponse.workflowSpec === 'object') {
        console.log(`${logPrefix} FIX-201: Forcing shouldGenerateWorkflow=true (Claude returned false but has workflowSpec, phase=${phase201}, ${userMessageCount} user msgs)`)
        parsedResponse.shouldGenerateWorkflow = true
        parsedResponse.intent = 'workflow'
        // Move clarifyingQuestions to missingInfo if present
        if (parsedResponse.clarifyingQuestions && !parsedResponse.missingInfo) {
          parsedResponse.missingInfo = parsedResponse.clarifyingQuestions
          delete parsedResponse.clarifyingQuestions
        }
      } else {
        // No workflowSpec but too many rounds — set intent to force workflow next time
        console.log(`${logPrefix} FIX-201: No workflowSpec yet after ${userMessageCount} user msgs (phase=${phase201}), adding generation hint`)
        parsedResponse.intent = parsedResponse.intent === 'clarifying' ? 'clarifying' : parsedResponse.intent
      }
    }
  }

  // @NEXUS-FIX-180: Server-side 20% approval density guard - DO NOT REMOVE
  if (parsedResponse.shouldGenerateWorkflow === true) {
    const wfSpec = parsedResponse.workflowSpec as { steps?: Array<{ id: string; type: string; config?: { riskLevel?: string } }> } | undefined
    if (wfSpec?.steps && Array.isArray(wfSpec.steps)) {
      const approvalCount = wfSpec.steps.filter(s => s.type === 'approval').length
      const actionCount = wfSpec.steps.filter(s => s.type === 'action').length
      const maxApprovals = Math.max(1, Math.ceil(actionCount / 5))

      if (approvalCount > maxApprovals) {
        const riskOrder: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 }
        const approvalSteps = wfSpec.steps
          .filter(s => s.type === 'approval')
          .sort((a, b) => {
            const riskA = riskOrder[a.config?.riskLevel || 'medium'] || 1
            const riskB = riskOrder[b.config?.riskLevel || 'medium'] || 1
            return riskB - riskA
          })

        const keptIds = new Set(approvalSteps.slice(0, maxApprovals).map(s => s.id))
        wfSpec.steps = wfSpec.steps.filter(s => s.type !== 'approval' || keptIds.has(s.id))
        console.log(`${logPrefix} Density guard: trimmed ${approvalCount} approvals to ${maxApprovals} (max for ${actionCount} actions)`)
      }
    }
  }

  // Add conversation phase to response
  parsedResponse._conversationPhase = deriveConversationPhase(messages, parsedResponse)
}

/**
 * Get a safe fallback message when AI returns empty message.
 *
 * @NEXUS-FIX-164: Safe fallback prevents raw JSON dump to frontend - DO NOT REMOVE
 * @NEXUS-FIX-190: Context-aware fallback for multi-turn conversations - DO NOT REMOVE
 */
export function getSafeFallbackMessage(userMessageCount: number): string {
  return userMessageCount > 1
    ? "Got it! Let me continue helping with your request. Could you provide a bit more detail?"
    : "I'm here to help with workflow automation. What would you like to create?"
}

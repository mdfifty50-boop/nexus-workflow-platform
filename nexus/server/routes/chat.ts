import { Router, Request, Response, NextFunction } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import rateLimit from 'express-rate-limit'
import { getAgent, getAllAgents, routeToAgent, type Agent } from '../agents/index.js'
import { getClaudeClient, callClaudeWithCaching } from '../services/claudeProxy.js'
import { appDetectionService } from '../services/AppDetectionService.js'
import { customIntegrationService } from '../services/CustomIntegrationService.js'
import { templateService } from '../services/TemplateService.js'
import { promptGuardService } from '../services/PromptGuardService.js'
// @NEXUS-FIX-022: Multi-tenant identity - per-user Composio entities
import { getUserEntityId } from '../utils/user-entity.js'

const router = Router()

// =============================================================================
// PRODUCTION: Rate limiting for AI chat endpoint (prevents cost explosion)
// =============================================================================
// Limits: 20 requests per minute per user (generous for normal use, blocks abuse)
// Uses user ID from request header or falls back to IP address
// @NEXUS-FIX-102: Rate limiter with IPv6 validation disabled - DO NOT REMOVE
// We primarily use user IDs (x-user-id, x-clerk-user-id) for rate limiting
// IP fallback is only for anonymous users; IPv6 bypass risk is acceptable
const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: process.env.NODE_ENV === 'production' ? 20 : 100, // Stricter in production
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  // Disable IPv6 keyGenerator validation - we use user IDs as primary key
  // @NEXUS-FIX-102: Use correct validate option name - DO NOT MODIFY
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request): string => {
    // Try to get user ID from various sources (primary method)
    const userId = req.headers['x-user-id'] as string ||
                   req.headers['x-clerk-user-id'] as string ||
                   (req as any).auth?.userId
    // Fallback to IP only for anonymous users
    return userId || req.ip || 'anonymous'
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please slow down.',
      hint: 'Wait a moment before sending more messages.',
      retryAfter: 60
    })
  },
  skip: (req: Request): boolean => {
    // Skip rate limiting in development if explicitly disabled
    return process.env.DISABLE_RATE_LIMIT === 'true'
  }
})

// "Think with me" mode directive - focused problem-solving
// @NEXUS-FIX-101: Think with me mode directive - DO NOT REMOVE
const THINK_WITH_ME_DIRECTIVE = `## MODE: THINK WITH ME (ACTIVE)

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
const TEAM_CONTEXT = `You are part of the BMAD team at Nexus. Your colleagues are:
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
function buildCachedSystemPrompt(
  agent: Agent,
  userContext?: string,
  chatMode: 'standard' | 'think_with_me' = 'standard'
): Anthropic.Messages.TextBlockParam[] {
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

// @NEXUS-FIX-177: Conversation phase state machine - DO NOT REMOVE
// Derives the current conversation phase from message history.
// Phases: discovery → clarifying → generating → refining
function deriveConversationPhase(messages: any[], parsedResponse: any): 'discovery' | 'clarifying' | 'generating' | 'refining' {
  const userMsgCount = messages.filter((m: any) => m.role === 'user').length
  const hasWorkflowInHistory = messages.some((m: any) =>
    m.role === 'assistant' && typeof m.content === 'string' && m.content.includes('shouldGenerateWorkflow')
  )

  if (userMsgCount <= 1) return 'discovery'
  if (userMsgCount <= 3 && !hasWorkflowInHistory) return 'clarifying'
  if (hasWorkflowInHistory) return 'refining'
  return 'generating'
}

// @NEXUS-FIX-195: Conversation history trimming — reduce token costs on long conversations - DO NOT REMOVE
// After 10+ messages, older messages are summarized into a single context block while
// keeping the last 5 messages in full. This prevents linearly growing token costs.
// Impact: 3-5% quality loss on deep context recall (message #2 details in a 15-turn convo)
// Mitigation: Last 5 messages always in full, summary preserves key facts
const HISTORY_TRIM_THRESHOLD = 10 // Total messages before trimming kicks in
const RECENT_MESSAGES_TO_KEEP = 5 // Always keep last N messages in full

function trimConversationHistory(
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
      // Extract the core of user messages (first 150 chars)
      const snippet = content.length > 150 ? content.substring(0, 150) + '...' : content
      summaryParts.push(`User said: ${snippet}`)
    } else {
      // For assistant messages, extract key decisions/info (first 200 chars)
      // Skip raw JSON — extract the message field if present
      let snippet = content
      try {
        const parsed = JSON.parse(content)
        if (parsed.message) snippet = parsed.message
      } catch { /* not JSON, use as-is */ }
      snippet = snippet.length > 200 ? snippet.substring(0, 200) + '...' : snippet
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

// @NEXUS-FIX-194: Chat-specific model tiering — route simple messages to Haiku - DO NOT REMOVE
// Saves ~75% on greeting/simple messages (30% of all messages) with negligible quality impact.
// Only greetings and trivial Q&A use Haiku. ALL workflow, diagnostic, and clarifying conversations stay on Sonnet.
const GREETING_PATTERNS = /^(hi|hello|hey|مرحبا|هلا|السلام عليكم|good\s*(morning|afternoon|evening)|thanks?|thank\s*you|شكرا|ok|okay|got\s*it|cool|nice|great|awesome|perfect|yes|no|bye|goodbye|مع السلامة)[\s!?.]*$/i
const SIMPLE_QA_PATTERNS = /^(what\s*(is|are|can)\s*(nexus|you)|how\s*does\s*(this|nexus)\s*work|what\s*can\s*you\s*do|help|شو\s*(تقدر|هذا)|كيف\s*(تشتغل|يعمل)|ايش\s*(تسوي|تقدر))[\s?]*$/i

function selectChatModel(userMessage: string, messageCount: number, chatMode: string): { model: string; reason: string } {
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
    return { model: 'claude-3-5-haiku-20241022', reason: 'simple greeting → Haiku' }
  }

  // Simple Q&A about what Nexus does → Haiku
  if (trimmed.length <= 60 && SIMPLE_QA_PATTERNS.test(trimmed)) {
    return { model: 'claude-3-5-haiku-20241022', reason: 'simple Q&A → Haiku' }
  }

  // Everything else → Sonnet (workflow requests, complaints, diagnostics, Arabic business queries)
  return { model: 'claude-sonnet-4-6', reason: 'complex request → Sonnet' }
}

// GET /api/chat/agents - List all available agents
router.get('/agents', (req, res) => {
  const agents = getAllAgents().map(agent => ({
    id: agent.id,
    name: agent.name,
    title: agent.title,
    avatar: agent.avatar,
    color: agent.color,
    department: agent.department,
    capabilities: agent.capabilities
  }))

  res.json({ success: true, agents })
})

// POST /api/chat - Chat with an agent
// Rate limited to prevent cost explosion from abuse
router.post('/', chatRateLimiter, async (req, res) => {
  try {
    // We'll check for API key later only if needed for multimodal
    const client = getClaudeClient()

    const {
      messages,
      agentId,
      autoRoute = true, // automatically route to best agent
      model = 'claude-sonnet-4-6',
      maxTokens = 4096,
      images, // Array of image objects: { type: 'image', source: { type: 'base64', media_type, data } }
      userContext, // User context for auto-inference (from UserContextService)
      chatMode = 'standard', // "Think with me" mode: 'standard' | 'think_with_me'
      intentContext, // Finding #55: Pre-parsed intent data from IntentResolver
      language // User-selected chat language from UI
    } = req.body

    const hasImages = images && Array.isArray(images) && images.length > 0

    // For multimodal (images), we need direct API access
    if (hasImages && !client) {
      return res.status(500).json({
        success: false,
        error: 'AI not configured for image analysis',
        hint: 'Add ANTHROPIC_API_KEY environment variable for multimodal support'
      })
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'messages array is required'
      })
    }

    // === Finding #10: Prompt Injection Defense - Layer 6: Per-user message rate limiting ===
    const userId = (req.headers['x-user-id'] as string) ||
                   (req.headers['x-clerk-user-id'] as string) ||
                   (req as any).auth?.userId ||
                   req.ip || 'anonymous'
    const rateLimitCheck = promptGuardService.checkRateLimit(userId)
    if (!rateLimitCheck.allowed) {
      console.warn(`[Chat][PromptGuard] Rate limit exceeded for user: ${userId}`)
      return res.status(429).json({
        success: false,
        error: 'You are sending messages too quickly. Please wait a moment.',
        remaining: rateLimitCheck.remaining,
        retryAfter: 60
      })
    }

    // Get the latest user message (used for routing and app detection)
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')

    // === Finding #10: Prompt Injection Defense - Layer 1: Input Sanitization ===
    if (lastUserMessage?.content && typeof lastUserMessage.content === 'string') {
      const sanitizeResult = promptGuardService.sanitizeUserInput(lastUserMessage.content)
      if (sanitizeResult.flags.length > 0) {
        console.warn('[Security] Prompt injection flags:', sanitizeResult.flags)
      }
      // Apply cleaned version (invisible chars stripped)
      lastUserMessage.content = sanitizeResult.sanitized
    }

    // =========================================================================
    // Move 6.7: Template-first workflow generation
    // @NEXUS-FIX-126: Only use templates for first message, not mid-conversation
    // Templates bypass Claude and ignore user's tool preferences from prior questions.
    // Only match templates on the FIRST user message (no prior conversation context).
    // =========================================================================
    const userMessageCount = messages.filter((m: any) => m.role === 'user').length
    if (userMessageCount <= 1 && lastUserMessage?.content && typeof lastUserMessage.content === 'string') {
      const templateMatch = templateService.matchUserInput(lastUserMessage.content)
      // Raise threshold to 0.8 to only match very specific, exact requests
      if (templateMatch && templateMatch.score >= 0.8) {
        console.log(`[Chat] Template match found: ${templateMatch.template.id} (score: ${templateMatch.score})`)
        const templateResponse = templateService.buildTemplateResponse(templateMatch)
        return res.json({
          success: true,
          output: JSON.stringify(templateResponse),
          agent: { id: 'nexus', name: 'Nexus', title: 'AI Orchestrator', avatar: '🤖', color: '#6366f1' },
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          model: 'template-match',
          viaProxy: false,
          fromTemplate: templateMatch.template.id
        })
      }
    }

    // Determine which agent to use
    let agent: Agent
    if (agentId) {
      const specificAgent = getAgent(agentId)
      if (!specificAgent) {
        return res.status(400).json({
          success: false,
          error: `Unknown agent: ${agentId}`,
          availableAgents: getAllAgents().map(a => a.id)
        })
      }
      agent = specificAgent
    } else if (autoRoute) {
      // Auto-route based on the latest user message
      agent = routeToAgent(lastUserMessage?.content || '')
    } else {
      agent = getAgent('nexus')!
    }

    // Detect app mentions in the latest user message
    let toolContext = ''
    let customIntegrations: Array<{
      appName: string
      displayName: string
      apiDocsUrl: string
      apiKeyUrl?: string
      steps: string[]
      keyHint: string
      category?: string
    }> = []

    if (lastUserMessage?.content) {
      try {
        // @NEXUS-FIX-022: Pass per-user entity ID for multi-tenant isolation
        const appDetection = await appDetectionService.detectAndAnalyze(lastUserMessage.content, getUserEntityId(req))
        if (appDetection.detectedApps.length > 0) {
          console.log(`[Chat] Detected apps: ${appDetection.detectedApps.map((a: { name: string }) => a.name).join(', ')}`)
          if (appDetection.hasLimitedSupport) {
            console.log('[Chat] Some apps have limited support - enriching context')
          }
          toolContext = appDetection.contextEnrichment

          // Check for custom integration options for apps with limited/no Composio support
          // Match detected apps to their tool discovery results by name
          for (const app of appDetection.detectedApps) {
            // Find the corresponding tool discovery result for this app
            const discoveryResult = appDetection.toolDiscoveryResults.find(
              r => r.toolName.toLowerCase() === app.name.toLowerCase() ||
                   r.toolName.toLowerCase().includes(app.name.toLowerCase())
            )

            // Check if app has limited support (none, partial, or browser_only)
            const hasLimitedComposioSupport = !discoveryResult ||
              discoveryResult.supportLevel === 'none' ||
              discoveryResult.supportLevel === 'partial' ||
              discoveryResult.supportLevel === 'browser_only'

            if (hasLimitedComposioSupport) {
              const customInfo = customIntegrationService.getAppAPIInfo(app.name)
              if (customInfo) {
                customIntegrations.push({
                  appName: customInfo.name,
                  displayName: customInfo.displayName,
                  apiDocsUrl: customInfo.apiDocsUrl,
                  apiKeyUrl: customInfo.apiKeyUrl,
                  steps: customInfo.setupSteps,
                  keyHint: customInfo.keyHint,
                  category: customInfo.category
                })
                console.log(`[Chat] Custom integration available for ${customInfo.displayName} (support: ${discoveryResult?.supportLevel || 'unknown'})`)
              }
            }
          }
        }
      } catch (error) {
        console.error('[Chat] App detection error:', error)
        // Continue without tool context on error
      }
    }

    // Combine user context with tool context and intent data
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

    // @NEXUS-FIX-190: Context bridge for multi-turn follow-ups (non-stream path) - DO NOT REMOVE
    // Same fix as stream path: when user sends a short follow-up to a clarifying question,
    // Claude needs explicit instruction to treat it as a continuation.
    if (userMessageCount > 1 && lastUserMessage?.content && lastUserMessage.content.length < 50) {
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

    enrichedUserContext = enrichedUserContext.trim() || undefined

    // Build system prompt with caching support (inject user context for inference)
    // Pass chatMode to enable "Think with me" focused problem-solving mode
    const systemBlocks = buildCachedSystemPrompt(agent, enrichedUserContext, chatMode)

    // Text-only: Use caching-enabled call (tries proxy first, then API with caching)
    if (!hasImages) {
      try {
        // @NEXUS-FIX-194: Select model based on message complexity - DO NOT REMOVE
        const lastMsgContent = lastUserMessage?.content || ''
        const modelSelection = selectChatModel(lastMsgContent, userMessageCount, chatMode)
        const selectedModel = modelSelection.model
        if (selectedModel !== model) {
          console.log(`[Chat][ModelTiering] ${modelSelection.reason} (${model} → ${selectedModel})`)
        }

        console.log('[Chat] Using Claude with prompt caching for text-only chat...')
        // @NEXUS-FIX-195: Trim conversation history to reduce token costs on long conversations
        const trimmedMessages = trimConversationHistory(messages)
        if (trimmedMessages.length < messages.length) {
          console.log(`[Chat][HistoryTrim] Trimmed ${messages.length} → ${trimmedMessages.length} messages (saved ~${messages.length - trimmedMessages.length} message tokens)`)
        }
        const claudeResult = await callClaudeWithCaching({
          systemBlocks,
          messages: trimmedMessages,
          maxTokens,
          model: selectedModel
        })

        // === Finding #10: Prompt Injection Defense - Layer 3: Output Validation ===
        const outputCheck = promptGuardService.validateOutput(claudeResult.text)
        if (!outputCheck.safe) {
          console.warn(`[Chat][PromptGuard] Output contained leaked secrets: ${outputCheck.leaks.join(', ')}`)
        }
        const sanitizedOutput = outputCheck.safe ? claudeResult.text : outputCheck.redacted

        // === @NEXUS-FIX-170: Server-side confidence gating (non-stream path) - DO NOT REMOVE ===
        let gatedOutput = sanitizedOutput
        try {
          const startIdx = sanitizedOutput.indexOf('{')
          if (startIdx !== -1) {
            let depth = 0, inStr = false, esc = false, endIdx = -1
            for (let i = startIdx; i < sanitizedOutput.length; i++) {
              const ch = sanitizedOutput[i]
              if (esc) { esc = false; continue }
              if (ch === '\\' && inStr) { esc = true; continue }
              if (ch === '"' && !esc) { inStr = !inStr; continue }
              if (inStr) continue
              if (ch === '{') depth++
              if (ch === '}') { depth--; if (depth === 0) { endIdx = i; break } }
            }
            if (endIdx !== -1) {
              const parsed = JSON.parse(sanitizedOutput.substring(startIdx, endIdx + 1))
              if (parsed.shouldGenerateWorkflow === true) {
                const claudeConf = (parsed.confidence as number) ?? 0.5
                const intentMatch = (enrichedUserContext || '').match(/Intent confidence:\s*([\d.]+)/)
                const intentConf = intentMatch ? parseFloat(intentMatch[1]) : null
                const isCmp = (enrichedUserContext || '').includes('isComplaint: true')
                const isStrat = (enrichedUserContext || '').includes('isStrategic: true')
                const phase = deriveConversationPhase(messages, parsed)

                if (isCmp || isStrat) {
                  parsed.shouldGenerateWorkflow = false
                  parsed.confidence = Math.min(claudeConf, 0.35)
                  console.log(`[Chat] Phase gate (non-stream): complaint/strategic suppressed`)
                // @NEXUS-FIX-187: Tool-aware discovery gate - only suppress if no explicit tools detected - DO NOT REMOVE
                } else if (phase === 'discovery' && !toolContext) {
                  parsed.shouldGenerateWorkflow = false
                  parsed.confidence = Math.min(claudeConf, 0.50)
                  console.log(`[Chat] Phase gate (non-stream): discovery phase suppressed (no tools detected)`)
                } else if (phase === 'discovery' && toolContext) {
                  console.log(`[Chat] Phase gate (non-stream): discovery phase but explicit tools detected, allowing workflow (confidence: ${claudeConf})`)
                } else if (intentConf !== null && intentConf < 0.3 && claudeConf > 0.6) {
                  parsed.shouldGenerateWorkflow = false
                  parsed.confidence = 0.50
                  console.log(`[Chat] Phase gate (non-stream): IntentResolver/Claude mismatch`)
                } else if (claudeConf < 0.60) {
                  parsed.shouldGenerateWorkflow = false
                  console.log(`[Chat] Phase gate (non-stream): low confidence ${claudeConf}`)
                }
                // @NEXUS-FIX-180: Server-side 20% approval density guard (non-stream) - DO NOT REMOVE
                if (parsed.workflowSpec?.steps && Array.isArray(parsed.workflowSpec.steps)) {
                  const wfSteps = parsed.workflowSpec.steps as Array<{ id: string; type: string; config?: { riskLevel?: string } }>
                  const approvalCount = wfSteps.filter(s => s.type === 'approval').length
                  const actionCount = wfSteps.filter(s => s.type === 'action').length
                  const maxApprovals = Math.max(1, Math.ceil(actionCount / 5))

                  if (approvalCount > maxApprovals) {
                    const riskOrder: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 }
                    const approvalSteps = wfSteps
                      .filter(s => s.type === 'approval')
                      .sort((a, b) => {
                        const riskA = riskOrder[a.config?.riskLevel || 'medium'] || 1
                        const riskB = riskOrder[b.config?.riskLevel || 'medium'] || 1
                        return riskB - riskA
                      })

                    const keptIds = new Set(approvalSteps.slice(0, maxApprovals).map(s => s.id))
                    parsed.workflowSpec.steps = wfSteps.filter(s => s.type !== 'approval' || keptIds.has(s.id))
                    console.log(`[Chat] Density guard (non-stream): trimmed ${approvalCount} approvals to ${maxApprovals} (max for ${actionCount} actions)`)
                  }
                }

                parsed._conversationPhase = phase
                gatedOutput = JSON.stringify(parsed)
              }
            }
          }
        } catch { /* Non-JSON output, no gating needed */ }

        return res.json({
          success: true,
          output: gatedOutput,
          agent: {
            id: agent.id,
            name: agent.name,
            title: agent.title,
            avatar: agent.avatar,
            color: agent.color
          },
          usage: {
            inputTokens: claudeResult.cacheMetrics.uncachedInputTokens,
            outputTokens: Math.ceil(claudeResult.tokensUsed * 0.7),
            totalTokens: claudeResult.tokensUsed,
            // Prompt caching metrics
            cacheCreationInputTokens: claudeResult.cacheMetrics.cacheCreationInputTokens,
            cacheReadInputTokens: claudeResult.cacheMetrics.cacheReadInputTokens,
            totalInputTokens: claudeResult.cacheMetrics.cacheCreationInputTokens +
                              claudeResult.cacheMetrics.cacheReadInputTokens +
                              claudeResult.cacheMetrics.uncachedInputTokens
          },
          model,
          viaProxy: claudeResult.viaProxy,
          costUSD: claudeResult.costUSD,
          // Custom integration options for unsupported apps
          customIntegrations: customIntegrations.length > 0 ? customIntegrations : undefined
        })
      } catch (error: any) {
        console.error('[Chat] Proxy and API both failed:', error.message)
        throw error
      }
    }

    // Multimodal (with images): Use direct API with caching
    console.log('[Chat] Using direct API with prompt caching for multimodal chat...')

    // Build messages array with image support
    const formattedMessages = messages.map((m: any, index: number) => {
      // If this is the last user message and we have images, include them
      const isLastMessage = index === messages.length - 1

      if (isLastMessage && m.role === 'user' && hasImages) {
        // Build multimodal content array with images + text
        const contentBlocks: any[] = []

        // Add images first
        for (const img of images) {
          contentBlocks.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: img.source.media_type,
              data: img.source.data,
            },
          })
        }

        // Add text content
        if (m.content && m.content.trim()) {
          contentBlocks.push({
            type: 'text',
            text: m.content,
          })
        } else {
          // Default message for image-only submissions
          contentBlocks.push({
            type: 'text',
            text: 'Please analyze this image and help me understand what workflow or automation could be built based on what you see.',
          })
        }

        return {
          role: m.role,
          content: contentBlocks,
        }
      }

      // Regular text message
      return {
        role: m.role,
        content: m.content,
      }
    })

    // Call Claude API directly for multimodal with cached system prompt
    const response = await client!.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemBlocks,
      messages: formattedMessages
    })

    // Extract response text
    const output = response.content
      .filter(block => block.type === 'text')
      .map(block => ('text' in block ? block.text : ''))
      .join('\n')

    // === Finding #10: Prompt Injection Defense - Layer 3: Output Validation (multimodal) ===
    const mmOutputCheck = promptGuardService.validateOutput(output)
    if (!mmOutputCheck.safe) {
      console.warn(`[Chat][PromptGuard] Multimodal output contained leaked secrets: ${mmOutputCheck.leaks.join(', ')}`)
    }
    const sanitizedMmOutput = mmOutputCheck.safe ? output : mmOutputCheck.redacted

    // Extract cache metrics from response
    const usage = response.usage as any
    const cacheCreationTokens = usage.cache_creation_input_tokens || 0
    const cacheReadTokens = usage.cache_read_input_tokens || 0
    const uncachedInputTokens = usage.input_tokens
    const totalInputTokens = cacheReadTokens + cacheCreationTokens + uncachedInputTokens

    // Log cache performance
    if (cacheReadTokens > 0) {
      console.log(`[Chat] Multimodal Cache HIT: ${cacheReadTokens} tokens (90% savings)`)
    } else if (cacheCreationTokens > 0) {
      console.log(`[Chat] Multimodal Cache WRITE: ${cacheCreationTokens} tokens`)
    }

    res.json({
      success: true,
      output: sanitizedMmOutput,
      agent: {
        id: agent.id,
        name: agent.name,
        title: agent.title,
        avatar: agent.avatar,
        color: agent.color
      },
      usage: {
        inputTokens: uncachedInputTokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: totalInputTokens + response.usage.output_tokens,
        // Prompt caching metrics
        cacheCreationInputTokens: cacheCreationTokens,
        cacheReadInputTokens: cacheReadTokens,
        totalInputTokens: totalInputTokens
      },
      model: response.model,
      viaProxy: false,
      // Custom integration options for unsupported apps
      customIntegrations: customIntegrations.length > 0 ? customIntegrations : undefined
    })
  } catch (error: any) {
    console.error('Chat error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Chat failed'
    })
  }
})

// =============================================================================
// POST /api/chat/stream - SSE streaming endpoint for real-time token delivery
// Finding #14: Stream Claude's response token-by-token via Server-Sent Events
// =============================================================================
router.post('/stream', chatRateLimiter, async (req: Request, res: Response) => {
  // Set SSE headers immediately
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering

  // Helper to send SSE events
  const sendEvent = (event: string, data: Record<string, unknown>) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      sendEvent('error', { error: 'AI not configured', hint: 'ANTHROPIC_API_KEY required for streaming' })
      sendEvent('done', {})
      res.end()
      return
    }

    const client = new Anthropic({ apiKey })

    const {
      messages,
      agentId,
      autoRoute = true,
      model = 'claude-sonnet-4-6',
      maxTokens = 4096,
      userContext,
      chatMode = 'standard',
      intentContext,
      language // User-selected chat language from UI
    } = req.body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      sendEvent('error', { error: 'messages array is required' })
      sendEvent('done', {})
      res.end()
      return
    }

    // === Finding #10: Prompt Injection Defense - Layer 6: Per-user message rate limiting ===
    const streamUserId = (req.headers['x-user-id'] as string) ||
                         (req.headers['x-clerk-user-id'] as string) ||
                         (req as any).auth?.userId ||
                         req.ip || 'anonymous'
    const streamRateCheck = promptGuardService.checkRateLimit(streamUserId)
    if (!streamRateCheck.allowed) {
      console.warn(`[Chat/Stream][PromptGuard] Rate limit exceeded for user: ${streamUserId}`)
      sendEvent('error', {
        error: 'You are sending messages too quickly. Please wait a moment.',
        remaining: streamRateCheck.remaining,
        retryAfter: 60
      })
      sendEvent('done', {})
      res.end()
      return
    }

    // Get the latest user message
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')

    // === Finding #10: Prompt Injection Defense - Layer 1: Input Sanitization ===
    if (lastUserMessage?.content && typeof lastUserMessage.content === 'string') {
      const sanitizeResult = promptGuardService.sanitizeUserInput(lastUserMessage.content)
      if (sanitizeResult.flags.length > 0) {
        console.warn('[Security/Stream] Prompt injection flags:', sanitizeResult.flags)
      }
      lastUserMessage.content = sanitizeResult.sanitized
    }

    // Template match (first message only) - returns non-streamed for speed
    // @NEXUS-FIX-126: Only use templates for first message
    const userMessageCount = messages.filter((m: any) => m.role === 'user').length
    if (userMessageCount <= 1 && lastUserMessage?.content && typeof lastUserMessage.content === 'string') {
      const templateMatch = templateService.matchUserInput(lastUserMessage.content)
      if (templateMatch && templateMatch.score >= 0.8) {
        console.log(`[Chat/Stream] Template match found: ${templateMatch.template.id} (score: ${templateMatch.score})`)
        const templateResponse = templateService.buildTemplateResponse(templateMatch)
        sendEvent('complete', {
          message: templateResponse.message || '',
          shouldGenerateWorkflow: templateResponse.shouldGenerateWorkflow || false,
          workflowSpec: templateResponse.workflowSpec || undefined,
          intent: templateResponse.intent || 'workflow',
          confidence: templateResponse.confidence || 0.9,
          fromTemplate: templateMatch.template.id
        })
        sendEvent('done', {})
        res.end()
        return
      }
    }

    // Determine agent
    let agent: Agent
    if (agentId) {
      const specificAgent = getAgent(agentId)
      if (!specificAgent) {
        sendEvent('error', { error: `Unknown agent: ${agentId}` })
        sendEvent('done', {})
        res.end()
        return
      }
      agent = specificAgent
    } else if (autoRoute) {
      agent = routeToAgent(lastUserMessage?.content || '')
    } else {
      agent = getAgent('nexus')!
    }

    // App detection and context enrichment (same as non-streaming)
    let toolContext = ''
    let customIntegrations: Array<{
      appName: string
      displayName: string
      apiDocsUrl: string
      apiKeyUrl?: string
      steps: string[]
      keyHint: string
      category?: string
    }> = []

    if (lastUserMessage?.content) {
      try {
        // @NEXUS-FIX-022: Pass per-user entity ID for multi-tenant isolation
        const appDetection = await appDetectionService.detectAndAnalyze(lastUserMessage.content, getUserEntityId(req))
        if (appDetection.detectedApps.length > 0) {
          console.log(`[Chat/Stream] Detected apps: ${appDetection.detectedApps.map((a: { name: string }) => a.name).join(', ')}`)
          toolContext = appDetection.contextEnrichment

          for (const app of appDetection.detectedApps) {
            const discoveryResult = appDetection.toolDiscoveryResults.find(
              r => r.toolName.toLowerCase() === app.name.toLowerCase() ||
                   r.toolName.toLowerCase().includes(app.name.toLowerCase())
            )
            const hasLimitedComposioSupport = !discoveryResult ||
              discoveryResult.supportLevel === 'none' ||
              discoveryResult.supportLevel === 'partial' ||
              discoveryResult.supportLevel === 'browser_only'

            if (hasLimitedComposioSupport) {
              const customInfo = customIntegrationService.getAppAPIInfo(app.name)
              if (customInfo) {
                customIntegrations.push({
                  appName: customInfo.name,
                  displayName: customInfo.displayName,
                  apiDocsUrl: customInfo.apiDocsUrl,
                  apiKeyUrl: customInfo.apiKeyUrl,
                  steps: customInfo.setupSteps,
                  keyHint: customInfo.keyHint,
                  category: customInfo.category
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('[Chat/Stream] App detection error:', error)
      }
    }

    // Build enriched context
    let enrichedUserContext = userContext || ''
    // @NEXUS-FIX-160: Improved Arabic language instruction with explicit JSON format example (stream path) - DO NOT REMOVE
    // @NEXUS-FIX-161: Arabic workflow step names and descriptions (stream path) - DO NOT REMOVE
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

    enrichedUserContext = enrichedUserContext.trim() || undefined

    // Build system prompt
    const systemBlocks = buildCachedSystemPrompt(agent, enrichedUserContext, chatMode)

    // @NEXUS-FIX-194: Select model based on message complexity (stream path) - DO NOT REMOVE
    const streamLastMsgContent = lastUserMessage?.content || ''
    const streamModelSelection = selectChatModel(streamLastMsgContent, userMessageCount, chatMode)
    const streamSelectedModel = streamModelSelection.model
    if (streamSelectedModel !== model) {
      console.log(`[Chat/Stream][ModelTiering] ${streamModelSelection.reason} (${model} → ${streamSelectedModel})`)
    }

    console.log('[Chat/Stream] Starting SSE stream with Claude...')

    // @NEXUS-FIX-195: Trim conversation history for streaming path
    const streamTrimmedMessages = trimConversationHistory(messages)
    if (streamTrimmedMessages.length < messages.length) {
      console.log(`[Chat/Stream][HistoryTrim] Trimmed ${messages.length} → ${streamTrimmedMessages.length} messages`)
    }

    // Accumulate full response text for final parsing
    let fullText = ''

    // Use Anthropic streaming API
    const stream = await client.messages.stream({
      model: streamSelectedModel,
      max_tokens: maxTokens,
      system: systemBlocks,
      messages: streamTrimmedMessages
    })

    // Handle abort (client disconnect)
    req.on('close', () => {
      console.log('[Chat/Stream] Client disconnected, aborting stream')
      stream.abort()
    })

    // Stream tokens as they arrive
    stream.on('text', (text: string) => {
      fullText += text
      sendEvent('token', { text })
    })

    // When streaming completes, parse and send final structured response
    const finalMessage = await stream.finalMessage()

    // Extract usage metrics
    const usage = finalMessage.usage as any
    const cacheCreationTokens = usage.cache_creation_input_tokens || 0
    const cacheReadTokens = usage.cache_read_input_tokens || 0
    const uncachedInputTokens = usage.input_tokens
    const totalInputTokens = cacheCreationTokens + cacheReadTokens + uncachedInputTokens

    // === Finding #10: Prompt Injection Defense - Layer 3: Output Validation ===
    const outputCheck = promptGuardService.validateOutput(fullText)
    if (!outputCheck.safe) {
      console.warn(`[Chat/Stream][PromptGuard] Output contained leaked secrets: ${outputCheck.leaks.join(', ')}`)
      fullText = outputCheck.redacted
    }

    // @NEXUS-FIX-160: Brace-depth JSON extraction for streaming (Arabic-safe) - DO NOT REMOVE
    // The old greedy regex /\{[\s\S]*\}/ would match from first { to LAST },
    // which fails with Arabic text and captures too much content.
    // This uses proper brace-depth tracking identical to NexusAIService.extractJSON()
    let parsedResponse: Record<string, unknown> = {}
    try {
      const startIdx = fullText.indexOf('{')
      if (startIdx !== -1) {
        let depth = 0
        let inStr = false
        let esc = false
        let endIdx = -1
        for (let i = startIdx; i < fullText.length; i++) {
          const ch = fullText[i]
          if (esc) { esc = false; continue }
          if (ch === '\\' && inStr) { esc = true; continue }
          if (ch === '"' && !esc) { inStr = !inStr; continue }
          if (inStr) continue
          if (ch === '{') depth++
          if (ch === '}') { depth--; if (depth === 0) { endIdx = i; break } }
        }
        if (endIdx !== -1) {
          parsedResponse = JSON.parse(fullText.substring(startIdx, endIdx + 1))
        }
      }
    } catch {
      // Response was plain text, not JSON - that's fine
    }

    // @NEXUS-FIX-190: Robust message extraction for multi-turn conversations - DO NOT REMOVE
    // When Claude returns a follow-up response, it may return plain text instead of JSON,
    // or JSON with an empty/missing message field. In multi-turn contexts, extract the message
    // from raw text rather than falling back to a generic message.
    if (!parsedResponse.message && userMessageCount > 1) {
      // Try to salvage a message from the raw response
      const trimmedFull = fullText.trim()
      if (trimmedFull && !trimmedFull.startsWith('{')) {
        // Claude returned plain text - use it directly as the message
        parsedResponse.message = trimmedFull
        parsedResponse.shouldGenerateWorkflow = false
        parsedResponse.intent = 'clarifying'
        console.log(`[Chat/Stream] FIX-190: Extracted plain text response for multi-turn follow-up (${trimmedFull.length} chars)`)
      } else if (parsedResponse.message === '' || parsedResponse.message === null) {
        // JSON was valid but message was empty - try to extract from fullText
        const msgExtract = fullText.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/i)
        if (msgExtract && msgExtract[1].length > 0) {
          parsedResponse.message = msgExtract[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\')
          console.log(`[Chat/Stream] FIX-190: Recovered message from regex extraction (${(parsedResponse.message as string).length} chars)`)
        }
      }
    }

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
        console.log(`[Chat/Stream] Phase gate: complaint/strategic detected, suppressing workflow card`)
        parsedResponse.shouldGenerateWorkflow = false
        parsedResponse.confidence = Math.min(claudeConfidence, 0.35)
      }
      // @NEXUS-FIX-187: RULE 2: Discovery phase - suppress ONLY if no explicit tools detected - DO NOT REMOVE
      else if (phase === 'discovery' && !toolContext) {
        console.log(`[Chat/Stream] Phase gate: discovery phase (first message, no tools), suppressing workflow card`)
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
        console.log(`[Chat/Stream] Phase gate: discovery phase but explicit tools detected (${toolContext.substring(0, 80)}...), allowing workflow (confidence: ${claudeConfidence})`)
      }
      // RULE 3: If IntentResolver confidence is < 0.3 but Claude says > 0.6, override
      else if (intentConfidence !== null && intentConfidence < 0.3 && claudeConfidence > 0.6) {
        console.log(`[Chat/Stream] Phase gate: IntentResolver(${intentConfidence}) vs Claude(${claudeConfidence}) mismatch, capping to 0.50`)
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
        console.log(`[Chat/Stream] Phase gate: confidence ${claudeConfidence} < 0.60, suppressing workflow card`)
        parsedResponse.shouldGenerateWorkflow = false
      }
    }
    // @NEXUS-FIX-180: Server-side 20% approval density guard (stream) - DO NOT REMOVE
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
          console.log(`[Chat/Stream] Density guard: trimmed ${approvalCount} approvals to ${maxApprovals} (max for ${actionCount} actions)`)
        }
      }
    }

    // Add conversation phase to response
    parsedResponse._conversationPhase = deriveConversationPhase(messages, parsedResponse)

    // Send the complete event with full parsed response
    sendEvent('complete', {
      // @NEXUS-FIX-164: Safe fallback prevents raw JSON dump to frontend - DO NOT REMOVE
      // Old code fell back to `fullText` (entire raw Claude JSON) when parsedResponse.message was empty
      // @NEXUS-FIX-190: Context-aware fallback for multi-turn conversations - DO NOT REMOVE
      message: parsedResponse.message || (userMessageCount > 1
        ? "Got it! Let me continue helping with your request. Could you provide a bit more detail?"
        : "I'm here to help with workflow automation. What would you like to create?"),
      shouldGenerateWorkflow: parsedResponse.shouldGenerateWorkflow || false,
      workflowSpec: parsedResponse.workflowSpec || undefined,
      intent: parsedResponse.intent || undefined,
      confidence: parsedResponse.confidence || undefined,
      assumptions: parsedResponse.assumptions || undefined,
      missingInfo: parsedResponse.missingInfo || undefined,
      clarifyingQuestions: parsedResponse.clarifyingQuestions || undefined,
      refiningWorkflowId: parsedResponse.refiningWorkflowId || undefined,
      suggestedQuestions: parsedResponse.suggestedQuestions || undefined,
      customIntegrations: customIntegrations.length > 0 ? customIntegrations : undefined,
      // @NEXUS-FIX-177: Include conversation phase for client-side display - DO NOT REMOVE
      conversationPhase: parsedResponse._conversationPhase || undefined,
      agent: {
        id: agent.id,
        name: agent.name,
        title: agent.title,
        avatar: agent.avatar,
        color: agent.color
      },
      usage: {
        inputTokens: uncachedInputTokens,
        outputTokens: usage.output_tokens,
        totalTokens: totalInputTokens + usage.output_tokens,
        cacheCreationInputTokens: cacheCreationTokens,
        cacheReadInputTokens: cacheReadTokens,
        totalInputTokens
      },
      model: finalMessage.model,
      viaProxy: false
    })

    // Signal stream end
    sendEvent('done', {})
    res.end()

  } catch (error: any) {
    console.error('[Chat/Stream] Streaming error:', error)
    sendEvent('error', { error: error.message || 'Streaming failed' })
    sendEvent('done', {})
    res.end()
  }
})

// POST /api/chat/route - Just get routing suggestion without chat
router.post('/route', (req, res) => {
  const { query } = req.body

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'query is required'
    })
  }

  const agent = routeToAgent(query)

  res.json({
    success: true,
    agent: {
      id: agent.id,
      name: agent.name,
      title: agent.title,
      avatar: agent.avatar,
      color: agent.color,
      department: agent.department
    },
    reason: `Based on your query, ${agent.name} (${agent.title}) is best suited to help.`
  })
})

export default router

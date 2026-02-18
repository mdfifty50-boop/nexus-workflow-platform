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
  // Inject user context into personality if placeholder exists
  let personalityWithContext = agent.personality
  if (userContext && agent.personality.includes('{{USER_CONTEXT}}')) {
    personalityWithContext = agent.personality.replace('{{USER_CONTEXT}}', userContext)
  } else if (userContext) {
    // Append user context if no placeholder exists
    personalityWithContext = agent.personality + `\n\n## USER CONTEXT (for inference)\n${userContext}`
  }

  // @NEXUS-FIX-101: Prepend "Think with me" directive when in that mode
  if (chatMode === 'think_with_me') {
    personalityWithContext = THINK_WITH_ME_DIRECTIVE + personalityWithContext
    console.log('[Chat] "Think with me" mode ACTIVE - focused problem-solving enabled')
  }

  return [
    {
      type: 'text',
      text: personalityWithContext,
    },
    {
      type: 'text',
      text: TEAM_CONTEXT,
      cache_control: { type: 'ephemeral' }
    }
  ]
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
    // Language preference from UI (user selected language)
    if (language && language !== 'en-US') {
      const langPrefix = language.startsWith('ar')
        ? `CRITICAL LANGUAGE RULE: The user has selected "${language}" as their preferred language.
Respond in Arabic (Gulf/Kuwaiti dialect preferred).
HOWEVER, your response MUST be valid JSON with these EXACT English field names: "message", "shouldGenerateWorkflow", "intent", "confidence", "workflowSpec".
Only the VALUE of "message" should be in Arabic. All other field names and boolean/number values stay in English.
For conversational responses (no workflow needed), set shouldGenerateWorkflow to false.
NEVER include workflow specs unless the user EXPLICITLY asks for automation/workflow.
Example of a correct Arabic greeting response:
{"message": "مرحبا! كيف أقدر أساعدك اليوم؟", "shouldGenerateWorkflow": false, "intent": "greeting"}
Do NOT wrap JSON in markdown code blocks. Return ONLY the raw JSON object.`
        : `The user has selected "${language}" as their preferred language. Respond in this language but ALWAYS maintain the JSON response format.`
      enrichedUserContext = langPrefix + '\n\n' + enrichedUserContext
    }
    if (toolContext) enrichedUserContext += `\n\n${toolContext}`
    // Finding #55: Include pre-parsed intent for smarter workflow generation
    if (intentContext) enrichedUserContext += `\n\n## Pre-Parsed Intent\n${intentContext}`
    enrichedUserContext = enrichedUserContext.trim() || undefined

    // Build system prompt with caching support (inject user context for inference)
    // Pass chatMode to enable "Think with me" focused problem-solving mode
    const systemBlocks = buildCachedSystemPrompt(agent, enrichedUserContext, chatMode)

    // Text-only: Use caching-enabled call (tries proxy first, then API with caching)
    if (!hasImages) {
      try {
        console.log('[Chat] Using Claude with prompt caching for text-only chat...')
        // Pass FULL conversation history for context retention
        const claudeResult = await callClaudeWithCaching({
          systemBlocks,
          messages: messages, // Full conversation history!
          maxTokens,
          model
        })

        // === Finding #10: Prompt Injection Defense - Layer 3: Output Validation ===
        const outputCheck = promptGuardService.validateOutput(claudeResult.text)
        if (!outputCheck.safe) {
          console.warn(`[Chat][PromptGuard] Output contained leaked secrets: ${outputCheck.leaks.join(', ')}`)
        }
        const sanitizedOutput = outputCheck.safe ? claudeResult.text : outputCheck.redacted

        return res.json({
          success: true,
          output: sanitizedOutput,
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
    // Language preference from UI (user selected language)
    if (language && language !== 'en-US') {
      const langPrefix = language.startsWith('ar')
        ? `CRITICAL LANGUAGE RULE: The user has selected "${language}" as their preferred language.
Respond in Arabic (Gulf/Kuwaiti dialect preferred).
HOWEVER, your response MUST be valid JSON with these EXACT English field names: "message", "shouldGenerateWorkflow", "intent", "confidence", "workflowSpec".
Only the VALUE of "message" should be in Arabic. All other field names and boolean/number values stay in English.
For conversational responses (no workflow needed), set shouldGenerateWorkflow to false.
NEVER include workflow specs unless the user EXPLICITLY asks for automation/workflow.
Example of a correct Arabic greeting response:
{"message": "مرحبا! كيف أقدر أساعدك اليوم؟", "shouldGenerateWorkflow": false, "intent": "greeting"}
Do NOT wrap JSON in markdown code blocks. Return ONLY the raw JSON object.`
        : `The user has selected "${language}" as their preferred language. Respond in this language but ALWAYS maintain the JSON response format.`
      enrichedUserContext = langPrefix + '\n\n' + enrichedUserContext
    }
    if (toolContext) enrichedUserContext += `\n\n${toolContext}`
    if (intentContext) enrichedUserContext += `\n\n## Pre-Parsed Intent\n${intentContext}`
    enrichedUserContext = enrichedUserContext.trim() || undefined

    // Build system prompt
    const systemBlocks = buildCachedSystemPrompt(agent, enrichedUserContext, chatMode)

    console.log('[Chat/Stream] Starting SSE stream with Claude...')

    // Accumulate full response text for final parsing
    let fullText = ''

    // Use Anthropic streaming API
    const stream = await client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: systemBlocks,
      messages: messages
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

    // Send the complete event with full parsed response
    sendEvent('complete', {
      message: parsedResponse.message || fullText,
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

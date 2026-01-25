import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { getAgent, getAllAgents, routeToAgent, type Agent } from '../agents/index.js'
import { getClaudeClient, callClaudeWithCaching } from '../services/claudeProxy.js'
import { appDetectionService } from '../services/AppDetectionService.js'
import { customIntegrationService } from '../services/CustomIntegrationService.js'
import { templateService } from '../services/TemplateService.js'

const router = Router()

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
 */
function buildCachedSystemPrompt(agent: Agent, userContext?: string): Anthropic.Messages.TextBlockParam[] {
  // Inject user context into personality if placeholder exists
  let personalityWithContext = agent.personality
  if (userContext && agent.personality.includes('{{USER_CONTEXT}}')) {
    personalityWithContext = agent.personality.replace('{{USER_CONTEXT}}', userContext)
  } else if (userContext) {
    // Append user context if no placeholder exists
    personalityWithContext = agent.personality + `\n\n## USER CONTEXT (for inference)\n${userContext}`
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
router.post('/', async (req, res) => {
  try {
    // We'll check for API key later only if needed for multimodal
    const client = getClaudeClient()

    const {
      messages,
      agentId,
      autoRoute = true, // automatically route to best agent
      model = 'claude-sonnet-4-20250514',
      maxTokens = 4096,
      images, // Array of image objects: { type: 'image', source: { type: 'base64', media_type, data } }
      userContext // User context for auto-inference (from UserContextService)
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

    // Get the latest user message (used for routing and app detection)
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')

    // =========================================================================
    // Move 6.7: Template-first workflow generation
    // Check if user input matches a verified template before calling Claude
    // =========================================================================
    if (lastUserMessage?.content && typeof lastUserMessage.content === 'string') {
      const templateMatch = templateService.matchUserInput(lastUserMessage.content)
      if (templateMatch && templateMatch.score >= 0.4) {
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
        const appDetection = await appDetectionService.detectAndAnalyze(lastUserMessage.content)
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

    // Combine user context with tool context
    const enrichedUserContext = toolContext
      ? `${userContext || ''}\n\n${toolContext}`
      : userContext

    // Build system prompt with caching support (inject user context for inference)
    const systemBlocks = buildCachedSystemPrompt(agent, enrichedUserContext)

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

        return res.json({
          success: true,
          output: claudeResult.text,
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
      output,
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

import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { getAgent, getAllAgents, routeToAgent, type Agent } from './_lib/agents.js'
import { withSecurityHeaders } from './_lib/security-headers.js'

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  return new Anthropic({ apiKey })
}

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
 * - Agent personality: Cached (changes infrequently per agent)
 * - Team context: Cached with cache_control (static across all requests)
 *
 * This reduces input token costs by ~90% on cache hits (cache reads cost 10% of base)
 * First request pays 25% extra for cache write, subsequent requests save 90%
 *
 * Minimum cacheable tokens: 1024 for Sonnet/Opus models
 * Cache TTL: 5 minutes (refreshes on each use)
 */
function buildCachedSystemPrompt(agent: Agent): Anthropic.Messages.TextBlockParam[] {
  return [
    {
      type: 'text',
      text: agent.personality,
    },
    {
      type: 'text',
      text: TEAM_CONTEXT,
      // Mark the end of cacheable content
      // This caches both the personality AND team context as a single prefix
      cache_control: { type: 'ephemeral' }
    }
  ]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set security headers and handle CORS preflight
  if (withSecurityHeaders(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const client = getAnthropicClient()

    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'AI not configured',
        hint: 'Add ANTHROPIC_API_KEY environment variable'
      })
    }

    const {
      messages,
      agentId,
      autoRoute = true,
      model = 'claude-sonnet-4-20250514',
      maxTokens = 4096,
      images
    } = req.body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'messages array is required'
      })
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
      const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')
      agent = routeToAgent(lastUserMessage?.content || '')
    } else {
      agent = getAgent('nexus')!
    }

    // Build system prompt with caching support
    const systemBlocks = buildCachedSystemPrompt(agent)

    // Build messages array with image support
    const formattedMessages = messages.map((m: any, index: number) => {
      const isLastMessage = index === messages.length - 1
      const hasImages = images && Array.isArray(images) && images.length > 0

      if (isLastMessage && m.role === 'user' && hasImages) {
        const contentBlocks: any[] = []

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

        if (m.content && m.content.trim()) {
          contentBlocks.push({ type: 'text', text: m.content })
        } else {
          contentBlocks.push({
            type: 'text',
            text: 'Please analyze this image and help me understand what workflow or automation could be built based on what you see.',
          })
        }

        return { role: m.role, content: contentBlocks }
      }

      return { role: m.role, content: m.content }
    })

    // Call Claude API with prompt caching enabled via system blocks
    const response = await client.messages.create({
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
    const cacheCreationTokens = (response.usage as any).cache_creation_input_tokens || 0
    const cacheReadTokens = (response.usage as any).cache_read_input_tokens || 0
    const uncachedInputTokens = response.usage.input_tokens

    // Calculate total input tokens (cached reads + cache writes + uncached)
    const totalInputTokens = cacheReadTokens + cacheCreationTokens + uncachedInputTokens

    // Log cache performance for monitoring
    if (cacheReadTokens > 0) {
      console.log(`[Chat] Cache HIT: ${cacheReadTokens} tokens read from cache (90% savings)`)
    } else if (cacheCreationTokens > 0) {
      console.log(`[Chat] Cache WRITE: ${cacheCreationTokens} tokens written to cache`)
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
      model: response.model
    })
  } catch (error: any) {
    console.error('Chat error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Chat failed'
    })
  }
}

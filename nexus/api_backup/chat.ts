import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  systemPrompt?: string
  model?: string
  maxTokens?: number
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'ANTHROPIC_API_KEY not configured. Add it to your Vercel environment variables.',
      })
    }

    const body: ChatRequest = req.body
    const { messages, systemPrompt, model = 'claude-3-5-haiku-20241022', maxTokens = 1024 } = body

    const client = new Anthropic({ apiKey })

    // Build messages array for Claude
    const claudeMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt || 'You are a helpful AI assistant.',
      messages: claudeMessages,
    })

    const output = response.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('\n')

    return res.status(200).json({
      success: true,
      output,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model,
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat',
    })
  }
}

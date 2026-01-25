import { Router } from 'express'
import { callClaude } from '../services/claudeProxy.js'
import { getAgent } from '../agents/index.js'

const router = Router()

interface WorkflowStep {
  id: string
  type: 'ai-agent' | 'email' | 'http' | 'data-transform' | 'condition' | 'youtube'
  config: Record<string, any>
  label: string
}

// POST /api/workflow/execute - Execute a multi-step workflow
router.post('/execute', async (req, res) => {
  try {
    const {
      workflowId,
      executionId,
      steps,
      input = {},
      variables = {}
    } = req.body

    if (!steps || !Array.isArray(steps)) {
      return res.status(400).json({
        success: false,
        error: 'steps array is required'
      })
    }

    const results: any[] = []
    let currentData = { ...input, ...variables }
    let totalTokens = 0
    let totalCost = 0

    for (const step of steps as WorkflowStep[]) {
      const startTime = Date.now()
      let stepResult: any = { stepId: step.id, status: 'success' }

      try {
        switch (step.type) {
          case 'ai-agent': {
            const agentId = step.config.agentId || 'nexus'
            const agent = getAgent(agentId)
            const prompt = step.config.prompt || ''

            // Interpolate variables into prompt
            let processedPrompt = prompt
            for (const [key, value] of Object.entries(currentData)) {
              processedPrompt = processedPrompt.replace(
                new RegExp(`{{${key}}}`, 'g'),
                String(value)
              )
            }

            // Use Claude proxy (FREE via Max subscription) with API fallback
            const claudeResult = await callClaude({
              systemPrompt: agent?.personality || 'You are a helpful AI assistant.',
              userMessage: processedPrompt,
              maxTokens: step.config.maxTokens || 4096,
              model: step.config.model || 'claude-sonnet-4-20250514'
            })

            stepResult.output = claudeResult.text
            stepResult.agent = agent ? {
              id: agent.id,
              name: agent.name,
              avatar: agent.avatar
            } : null
            stepResult.tokensUsed = claudeResult.tokensUsed
            stepResult.costUSD = claudeResult.costUSD
            stepResult.viaProxy = claudeResult.viaProxy

            totalTokens += stepResult.tokensUsed
            totalCost += stepResult.costUSD
            currentData.lastOutput = claudeResult.text
            break
          }

          case 'email': {
            // Email sending logic (requires RESEND_API_KEY)
            const resendKey = process.env.RESEND_API_KEY
            if (!resendKey) {
              throw new Error('Email not configured - add RESEND_API_KEY')
            }

            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: step.config.from || 'Nexus <onboarding@resend.dev>',
                to: step.config.to,
                subject: step.config.subject,
                html: step.config.body
              })
            })

            const emailResult = await emailResponse.json()
            stepResult.output = emailResult
            break
          }

          case 'http': {
            const httpResponse = await fetch(step.config.url, {
              method: step.config.method || 'GET',
              headers: step.config.headers || {},
              body: step.config.body ? JSON.stringify(step.config.body) : undefined
            })

            stepResult.output = await httpResponse.json()
            currentData.httpResponse = stepResult.output
            break
          }

          case 'youtube': {
            // YouTube content extraction
            const youtubeUrl = step.config.url || currentData.youtubeUrl
            if (!youtubeUrl) {
              throw new Error('YouTube URL is required')
            }

            // Extract video ID
            const videoId = extractYouTubeId(youtubeUrl)
            if (!videoId) {
              throw new Error('Invalid YouTube URL')
            }

            // Use a transcript service or fallback to AI description
            // For now, we'll use Claude to process if transcript is provided
            stepResult.output = {
              videoId,
              url: youtubeUrl,
              note: 'YouTube transcript extraction requires additional setup. Video ID extracted.'
            }
            currentData.youtubeVideoId = videoId
            break
          }

          case 'data-transform': {
            const transformCode = step.config.transformCode || 'return input'
            try {
              const transformFn = new Function('input', 'data', transformCode)
              stepResult.output = transformFn(currentData.lastOutput, currentData)
              currentData.lastOutput = stepResult.output
            } catch (e: any) {
              throw new Error(`Transform failed: ${e.message}`)
            }
            break
          }

          case 'condition': {
            const condition = step.config.condition || 'true'
            try {
              const conditionFn = new Function('input', 'data', `return ${condition}`)
              stepResult.output = { result: conditionFn(currentData.lastOutput, currentData) }
            } catch (e: any) {
              throw new Error(`Condition evaluation failed: ${e.message}`)
            }
            break
          }

          default:
            throw new Error(`Unknown step type: ${step.type}`)
        }
      } catch (error: any) {
        stepResult.status = 'error'
        stepResult.error = error.message
      }

      stepResult.duration = Date.now() - startTime
      results.push(stepResult)

      // Stop on error unless configured to continue
      if (stepResult.status === 'error' && !step.config.continueOnError) {
        break
      }
    }

    const allSuccess = results.every(r => r.status === 'success')

    res.json({
      success: allSuccess,
      workflowId,
      executionId,
      results,
      finalOutput: currentData.lastOutput,
      totalTokens,
      totalCost
    })
  } catch (error: any) {
    console.error('Workflow execution error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Workflow execution failed'
    })
  }
})

// Helper: Calculate cost based on Claude pricing
function _calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-opus-4-20250514': { input: 15.0, output: 75.0 },
    'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
    'claude-3-5-haiku-20241022': { input: 1.0, output: 5.0 }
  }

  const modelPricing = pricing[model] || pricing['claude-sonnet-4-20250514']
  const inputCost = (inputTokens / 1_000_000) * modelPricing.input
  const outputCost = (outputTokens / 1_000_000) * modelPricing.output

  return Number((inputCost + outputCost).toFixed(6))
}

// Helper: Extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

export default router

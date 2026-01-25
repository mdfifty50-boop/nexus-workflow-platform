import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

interface WorkflowStep {
  id: string
  type: 'ai-agent' | 'email' | 'http' | 'data-transform' | 'condition'
  config: Record<string, any>
  label: string
}

interface WorkflowRequest {
  workflowId: string
  executionId: string
  steps: WorkflowStep[]
  input: Record<string, any>
  variables: Record<string, any>
}

interface StepResult {
  stepId: string
  status: 'success' | 'error'
  output: any
  tokensUsed?: number
  costUSD?: number
  error?: string
  duration: number
}

// Token pricing (per million tokens)
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-5-20251124': { input: 15.0, output: 75.0 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-5-haiku-20241022': { input: 1.0, output: 5.0 },
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model] || PRICING['claude-3-5-sonnet-20241022']
  const inputCost = (inputTokens / 1_000_000) * pricing.input
  const outputCost = (outputTokens / 1_000_000) * pricing.output
  return Number((inputCost + outputCost).toFixed(6))
}

async function executeAIStep(
  step: WorkflowStep,
  input: any,
  variables: Record<string, any>,
  apiKey: string
): Promise<StepResult> {
  const startTime = Date.now()
  const client = new Anthropic({ apiKey })

  try {
    const prompt = step.config.prompt || 'Process the input data'
    const model = step.config.model || 'claude-3-5-haiku-20241022'

    // Inject variables into prompt
    let processedPrompt = prompt
    for (const [key, value] of Object.entries(variables)) {
      processedPrompt = processedPrompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    }

    const fullPrompt = `${processedPrompt}\n\nInput Data:\n${JSON.stringify(input, null, 2)}`

    const response = await client.messages.create({
      model,
      max_tokens: step.config.maxTokens || 2048,
      messages: [{ role: 'user', content: fullPrompt }],
    })

    const output = response.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('\n')

    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens
    const costUSD = calculateCost(model, response.usage.input_tokens, response.usage.output_tokens)

    return {
      stepId: step.id,
      status: 'success',
      output: { text: output, rawInput: input },
      tokensUsed,
      costUSD,
      duration: Date.now() - startTime,
    }
  } catch (error: any) {
    return {
      stepId: step.id,
      status: 'error',
      output: null,
      error: error.message,
      duration: Date.now() - startTime,
    }
  }
}

async function executeEmailStep(step: WorkflowStep, input: any): Promise<StepResult> {
  const startTime = Date.now()

  try {
    const { to, subject, body } = step.config

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      throw new Error('Email service not configured (RESEND_API_KEY missing)')
    }

    // Process template variables in email content
    let processedBody = body || ''
    let processedSubject = subject || ''

    if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        processedBody = processedBody.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
        processedSubject = processedSubject.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
      }
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: step.config.from || 'Nexus <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject: processedSubject,
        html: processedBody,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to send email')
    }

    const result = await response.json()

    return {
      stepId: step.id,
      status: 'success',
      output: {
        emailId: result.id,
        to,
        subject: processedSubject,
        sentAt: new Date().toISOString(),
      },
      duration: Date.now() - startTime,
    }
  } catch (error: any) {
    return {
      stepId: step.id,
      status: 'error',
      output: null,
      error: error.message,
      duration: Date.now() - startTime,
    }
  }
}

async function executeHTTPStep(step: WorkflowStep, input: any): Promise<StepResult> {
  const startTime = Date.now()

  try {
    const { url, method = 'POST', headers: customHeaders = {}, bodyTemplate } = step.config

    let body = input
    if (bodyTemplate) {
      body = JSON.parse(
        JSON.stringify(bodyTemplate).replace(/\{\{(\w+)\}\}/g, (_, key) => (input as any)[key] || '')
      )
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    })

    const responseData = await response.json().catch(() => response.text())

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`)
    }

    return {
      stepId: step.id,
      status: 'success',
      output: responseData,
      duration: Date.now() - startTime,
    }
  } catch (error: any) {
    return {
      stepId: step.id,
      status: 'error',
      output: null,
      error: error.message,
      duration: Date.now() - startTime,
    }
  }
}

async function executeDataTransformStep(step: WorkflowStep, input: any): Promise<StepResult> {
  const startTime = Date.now()

  try {
    const { transform } = step.config
    let output = input

    if (transform === 'extract-json') {
      const jsonMatch = String(input.text || input).match(/\{[\s\S]*\}|\[[\s\S]*\]/)
      if (jsonMatch) {
        output = JSON.parse(jsonMatch[0])
      }
    } else if (transform === 'flatten') {
      output = Object.entries(input).reduce(
        (acc, [key, value]) => {
          if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([k, v]) => {
              acc[`${key}_${k}`] = v
            })
          } else {
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, any>
      )
    } else if (typeof transform === 'object') {
      output = {}
      for (const [newKey, sourceKey] of Object.entries(transform)) {
        const keys = String(sourceKey).split('.')
        let value: any = input
        for (const k of keys) {
          value = value?.[k]
        }
        output[newKey] = value
      }
    }

    return {
      stepId: step.id,
      status: 'success',
      output,
      duration: Date.now() - startTime,
    }
  } catch (error: any) {
    return {
      stepId: step.id,
      status: 'error',
      output: null,
      error: error.message,
      duration: Date.now() - startTime,
    }
  }
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
        error: 'ANTHROPIC_API_KEY not configured',
      })
    }

    const body: WorkflowRequest = req.body
    const { workflowId, executionId, steps, input, variables } = body

    const results: StepResult[] = []
    let currentInput = input
    let totalTokens = 0
    let totalCost = 0

    // Execute steps sequentially
    for (const step of steps) {
      let result: StepResult

      switch (step.type) {
        case 'ai-agent':
          result = await executeAIStep(step, currentInput, variables, apiKey)
          break
        case 'email':
          result = await executeEmailStep(step, currentInput)
          break
        case 'http':
          result = await executeHTTPStep(step, currentInput)
          break
        case 'data-transform':
          result = await executeDataTransformStep(step, currentInput)
          break
        default:
          result = {
            stepId: step.id,
            status: 'success',
            output: currentInput,
            duration: 0,
          }
      }

      results.push(result)

      if (result.status === 'error') {
        return res.status(200).json({
          success: false,
          workflowId,
          executionId,
          results,
          error: `Step "${step.label}" failed: ${result.error}`,
          totalTokens,
          totalCost,
        })
      }

      currentInput = result.output
      totalTokens += result.tokensUsed || 0
      totalCost += result.costUSD || 0
    }

    return res.status(200).json({
      success: true,
      workflowId,
      executionId,
      results,
      finalOutput: currentInput,
      totalTokens,
      totalCost,
    })
  } catch (error: any) {
    console.error('Workflow execution error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute workflow',
    })
  }
}

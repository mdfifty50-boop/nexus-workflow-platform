import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withSecurityHeaders } from './_lib/security-headers.js'

/**
 * Workflow execution API endpoint
 *
 * This endpoint handles workflow execution requests from the chat interface.
 * It validates the workflow configuration and executes it step-by-step,
 * returning results and progress updates.
 */

interface WorkflowStep {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'output'
  tool: string
  toolIcon: string
  name: string
  description: string
  config: Record<string, any>
  position: { x: number; y: number }
}

interface WorkflowExecutionRequest {
  workflowId: string
  name: string
  description: string
  steps: WorkflowStep[]
  input: Record<string, any>
  variables?: Record<string, any>
}

interface StepResult {
  stepId: string
  status: 'success' | 'error' | 'skipped'
  output: any
  error?: string
  duration: number
  timestamp: string
}

interface WorkflowExecutionResponse {
  success: boolean
  executionId: string
  workflowId: string
  status: 'completed' | 'failed' | 'partial'
  results: StepResult[]
  finalOutput: any
  duration: number
  error?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set security headers and handle CORS preflight
  if (withSecurityHeaders(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const body = req.body as WorkflowExecutionRequest

    // Validate request
    if (!body.workflowId || !body.steps || !Array.isArray(body.steps)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: workflowId and steps array required'
      })
    }

    if (body.steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Workflow must have at least one step'
      })
    }

    // Generate execution ID
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    console.log(`[Workflow] Starting execution ${executionId} for workflow ${body.workflowId}`)

    // Execute workflow steps
    const results: StepResult[] = []
    let currentContext = { ...body.input, ...body.variables }
    let hasError = false

    for (const step of body.steps) {
      const stepStartTime = Date.now()

      try {
        console.log(`[Workflow] Executing step ${step.id}: ${step.name}`)

        // Execute step based on type
        let stepOutput: any

        switch (step.type) {
          case 'trigger':
            // Trigger steps use the input data
            stepOutput = {
              triggered: true,
              data: body.input,
              timestamp: new Date().toISOString()
            }
            break

          case 'action':
            // Action steps perform operations
            stepOutput = await executeAction(step, currentContext)
            break

          case 'condition':
            // Condition steps evaluate expressions
            stepOutput = evaluateCondition(step, currentContext)
            break

          case 'output':
            // Output steps format final results
            stepOutput = formatOutput(step, currentContext)
            break

          default:
            throw new Error(`Unknown step type: ${step.type}`)
        }

        // Record success
        const duration = Date.now() - stepStartTime
        results.push({
          stepId: step.id,
          status: 'success',
          output: stepOutput,
          duration,
          timestamp: new Date().toISOString()
        })

        // Update context with step output
        currentContext = {
          ...currentContext,
          [`step_${step.id}`]: stepOutput
        }

        console.log(`[Workflow] Step ${step.id} completed in ${duration}ms`)

      } catch (error: any) {
        // Record error
        const duration = Date.now() - stepStartTime
        results.push({
          stepId: step.id,
          status: 'error',
          output: null,
          error: error.message || 'Step execution failed',
          duration,
          timestamp: new Date().toISOString()
        })

        console.error(`[Workflow] Step ${step.id} failed:`, error)
        hasError = true

        // Continue to next step (don't halt entire workflow)
      }
    }

    // Calculate final results
    const totalDuration = Date.now() - startTime
    const successfulSteps = results.filter(r => r.status === 'success').length
    const failedSteps = results.filter(r => r.status === 'error').length

    // Determine final status
    let status: 'completed' | 'failed' | 'partial'
    if (failedSteps === 0) {
      status = 'completed'
    } else if (successfulSteps === 0) {
      status = 'failed'
    } else {
      status = 'partial'
    }

    // Get final output from last successful step
    const lastSuccessful = results.reverse().find(r => r.status === 'success')
    const finalOutput = lastSuccessful?.output || currentContext

    console.log(`[Workflow] Execution ${executionId} ${status} in ${totalDuration}ms (${successfulSteps}/${body.steps.length} steps successful)`)

    const response: WorkflowExecutionResponse = {
      success: !hasError,
      executionId,
      workflowId: body.workflowId,
      status,
      results: results.reverse(), // Restore original order
      finalOutput,
      duration: totalDuration
    }

    if (hasError) {
      response.error = `${failedSteps} step(s) failed during execution`
    }

    res.json(response)

  } catch (error: any) {
    console.error('[Workflow] Execution error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Workflow execution failed'
    })
  }
}

/**
 * Execute an action step
 */
async function executeAction(step: WorkflowStep, context: Record<string, any>): Promise<any> {
  // Simulate action execution based on tool type
  const { tool, config } = step

  console.log(`[Workflow] Executing action: ${tool}`)

  // In a real implementation, this would call the actual tool/integration
  // For now, we return a simulated result

  switch (tool) {
    case 'gmail':
      return {
        sent: true,
        to: config.to || context.email || 'user@example.com',
        subject: config.subject || 'Automated Email',
        messageId: `msg-${Date.now()}`
      }

    case 'google_sheets':
      return {
        updated: true,
        spreadsheetId: config.spreadsheetId || 'sheet-123',
        rowsAffected: 1
      }

    case 'slack':
      return {
        posted: true,
        channel: config.channel || '#general',
        messageId: `slack-${Date.now()}`
      }

    case 'http':
      return {
        status: 200,
        data: { success: true }
      }

    case 'playwright':
      return {
        scraped: true,
        data: config.selector ? 'Extracted data' : 'Page loaded'
      }

    default:
      return {
        executed: true,
        tool,
        context
      }
  }
}

/**
 * Evaluate a condition step
 */
function evaluateCondition(step: WorkflowStep, context: Record<string, any>): any {
  const { config } = step

  // Simple condition evaluation
  // In production, use a proper expression evaluator
  const condition = config.condition || 'true'

  try {
    // Very basic evaluation (in production, use a safe expression evaluator)
    const result = condition === 'true' || Boolean(context[condition])

    return {
      evaluated: true,
      condition,
      result,
      branch: result ? 'true' : 'false'
    }
  } catch (error) {
    return {
      evaluated: false,
      error: 'Invalid condition'
    }
  }
}

/**
 * Format output step
 */
function formatOutput(step: WorkflowStep, context: Record<string, any>): any {
  const { config } = step

  // Format the final output based on configuration
  const format = config.format || 'json'

  switch (format) {
    case 'json':
      return context

    case 'text':
      return JSON.stringify(context, null, 2)

    case 'summary':
      return {
        summary: 'Workflow completed successfully',
        totalSteps: Object.keys(context).filter(k => k.startsWith('step_')).length,
        data: context
      }

    default:
      return context
  }
}

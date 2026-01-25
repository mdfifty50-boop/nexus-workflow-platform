/**
 * Pre-Flight Validation Routes
 *
 * FIX-074: Backend pre-flight with REAL schema fetching from Composio
 *
 * These routes provide:
 * - /api/preflight/check - Validate workflow before execution
 * - /api/preflight/schema/:toolSlug - Get schema for a specific tool
 *
 * @NEXUS-FIX-074: Pre-flight API routes - DO NOT REMOVE
 */

import { Router, Request, Response } from 'express'
import { preFlightValidationService, WorkflowNode } from '../services/PreFlightValidationService'

const router = Router()

/**
 * POST /api/preflight/check
 *
 * Validate workflow nodes before execution.
 * Returns missing requirements as user-friendly questions.
 *
 * Request body:
 * {
 *   nodes: WorkflowNode[],
 *   collectedParams: Record<string, string>,
 *   connectedIntegrations: string[]
 * }
 *
 * Response:
 * {
 *   ready: boolean,
 *   questions: PreFlightQuestion[],
 *   connections: { toolkit, connected }[],
 *   summary: { totalQuestions, answeredQuestions, totalConnections, connectedCount },
 *   schemaSource: 'composio' | 'fallback' | 'mixed'
 * }
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { nodes, collectedParams = {}, connectedIntegrations = [] } = req.body

    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json({
        success: false,
        error: 'nodes array is required'
      })
    }

    console.log(`[PreFlight API] Checking ${nodes.length} nodes with ${Object.keys(collectedParams).length} params`)

    // Initialize service if not already done
    if (!preFlightValidationService.initialized) {
      const apiKey = process.env.COMPOSIO_API_KEY
      if (apiKey) {
        await preFlightValidationService.initialize(apiKey)
        console.log('[PreFlight API] Service initialized with Composio SDK')
      } else {
        console.log('[PreFlight API] No API key - using fallback schemas')
      }
    }

    // Run pre-flight check
    const result = await preFlightValidationService.check(
      nodes as WorkflowNode[],
      collectedParams,
      connectedIntegrations
    )

    console.log(`[PreFlight API] Result: ready=${result.ready}, questions=${result.questions.length}, source=${result.schemaSource}`)

    res.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('[PreFlight API] Error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Pre-flight check failed',
      ready: false,
      questions: [],
      connections: [],
      summary: { totalQuestions: 0, answeredQuestions: 0, totalConnections: 0, connectedCount: 0 },
      schemaSource: 'fallback'
    })
  }
})

/**
 * GET /api/preflight/schema/:toolSlug
 *
 * Get the schema for a specific tool.
 * Useful for debugging and frontend schema inspection.
 */
router.get('/schema/:toolSlug', async (req: Request, res: Response) => {
  try {
    const { toolSlug } = req.params

    if (!toolSlug) {
      return res.status(400).json({
        success: false,
        error: 'toolSlug is required'
      })
    }

    // Initialize service if needed
    if (!preFlightValidationService.initialized) {
      const apiKey = process.env.COMPOSIO_API_KEY
      if (apiKey) {
        await preFlightValidationService.initialize(apiKey)
      }
    }

    const schema = await preFlightValidationService.getToolSchema(toolSlug.toUpperCase())

    res.json({
      success: true,
      schema
    })

  } catch (error) {
    console.error('[PreFlight API] Schema error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get schema'
    })
  }
})

/**
 * POST /api/preflight/clear-cache
 *
 * Clear the schema cache. Useful for debugging.
 */
router.post('/clear-cache', (_req: Request, res: Response) => {
  preFlightValidationService.clearCache()
  res.json({
    success: true,
    message: 'Schema cache cleared'
  })
})

/**
 * GET /api/preflight/status
 *
 * Get the service status.
 */
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    initialized: preFlightValidationService.initialized,
    schemaMode: preFlightValidationService.initialized ? 'composio' : 'fallback'
  })
})

export default router

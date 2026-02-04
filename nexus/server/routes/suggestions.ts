/**
 * AI Suggestions API Routes
 *
 * Exposes the AI suggestions system to the frontend.
 * All routes require authentication via x-clerk-user-id header.
 *
 * ENDPOINTS:
 * - GET  /api/suggestions         - Get pending suggestions for user
 * - GET  /api/suggestions/:id     - Get specific suggestion details
 * - POST /api/suggestions/:id/act - Record user action on suggestion
 * - GET  /api/suggestions/stats   - Get suggestion analytics
 * - POST /api/suggestions/generate - Trigger manual suggestion generation
 * - GET  /api/suggestions/intelligence - Get user intelligence profile
 * - GET  /api/suggestions/patterns - Get detected patterns
 */

import { Router, Request, Response } from 'express'
import aiSuggestionsService from '../services/AISuggestionsService.js'
import userIntelligenceService from '../services/UserIntelligenceService.js'
import patternDetectionService from '../services/PatternDetectionService.js'
import { backgroundJobService } from '../services/BackgroundJobService.js'

const router = Router()

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Extract clerk_user_id from headers or body
 */
const extractClerkUserId = (req: Request, res: Response, next: Function) => {
  const clerkUserId = req.headers['x-clerk-user-id'] as string || req.body?.clerk_user_id

  // In development mode, allow requests without authentication
  const isDev = process.env.NODE_ENV !== 'production'
  if (!clerkUserId) {
    if (isDev) {
      req.body.clerk_user_id = 'dev-user-local'
      console.log('[Suggestions API] Using dev-user-local for authentication')
      return next()
    }
    return res.status(401).json({ error: 'Authentication required' })
  }
  req.body.clerk_user_id = clerkUserId
  next()
}

// =============================================================================
// SUGGESTION ROUTES
// =============================================================================

/**
 * GET /api/suggestions
 * Get all pending suggestions for the current user
 */
router.get('/', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.body.clerk_user_id
    const { status, limit = 10 } = req.query

    const suggestions = await aiSuggestionsService.getSuggestions(
      userId,
      status as string | undefined,
      parseInt(limit as string, 10)
    )

    // Mark fetched suggestions as 'shown' if they were 'pending'
    const pendingSuggestions = suggestions.filter(s => s.status === 'pending')
    for (const suggestion of pendingSuggestions) {
      await aiSuggestionsService.updateSuggestionStatus(suggestion.id, 'shown')
    }

    res.json({
      success: true,
      data: suggestions,
      count: suggestions.length
    })
  } catch (error: any) {
    console.error('[Suggestions API] Error fetching suggestions:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch suggestions'
    })
  }
})

/**
 * GET /api/suggestions/stats
 * Get suggestion analytics for the current user
 */
router.get('/stats', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.body.clerk_user_id

    const stats = await aiSuggestionsService.getSuggestionStats(userId)

    res.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('[Suggestions API] Error fetching stats:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch suggestion stats'
    })
  }
})

/**
 * GET /api/suggestions/intelligence
 * Get the user's intelligence profile (for debugging/transparency)
 */
router.get('/intelligence', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.body.clerk_user_id

    const intelligence = await userIntelligenceService.buildIntelligence(userId)

    res.json({
      success: true,
      data: {
        automationMaturity: intelligence.automationMaturity,
        primaryUseCase: intelligence.primaryUseCase,
        dataQuality: intelligence.dataQuality,
        overallConfidence: intelligence.overallConfidence,
        painPointCount: intelligence.painPoints.length,
        opportunityCount: intelligence.opportunities.length,
        connectedIntegrations: intelligence.integrationAffinity.connectedIntegrations,
        topIntegrations: intelligence.integrationAffinity.mostUsedIntegrations.slice(0, 5),
        peakUsageHour: intelligence.executionBehavior.peakUsageHour,
        successRate: intelligence.executionBehavior.successRate,
        lastUpdated: intelligence.lastUpdated
      }
    })
  } catch (error: any) {
    console.error('[Suggestions API] Error fetching intelligence:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user intelligence'
    })
  }
})

/**
 * GET /api/suggestions/patterns
 * Get detected patterns for the current user
 */
router.get('/patterns', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.body.clerk_user_id
    const startTime = Date.now()

    const result = await patternDetectionService.detectAllPatterns(userId)

    res.json({
      success: true,
      data: {
        patterns: result.patterns,
        patternCount: result.patterns.length,
        executionsAnalyzed: result.executionsAnalyzed,
        recommendations: result.recommendations,
        processingTimeMs: Date.now() - startTime
      }
    })
  } catch (error: any) {
    console.error('[Suggestions API] Error fetching patterns:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch patterns'
    })
  }
})

/**
 * GET /api/suggestions/:id
 * Get a specific suggestion by ID
 */
router.get('/:id', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.body.clerk_user_id
    const { id } = req.params

    const suggestion = await aiSuggestionsService.getSuggestionById(id, userId)

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      })
    }

    res.json({
      success: true,
      data: suggestion
    })
  } catch (error: any) {
    console.error('[Suggestions API] Error fetching suggestion:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch suggestion'
    })
  }
})

/**
 * POST /api/suggestions/:id/act
 * Record a user action on a suggestion
 */
router.post('/:id/act', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.body.clerk_user_id
    const { id } = req.params
    const { action, rating, feedback_text, modifications } = req.body

    // Validate action
    const validActions = ['clicked', 'implemented', 'modified', 'rejected', 'reported']
    if (!action || !validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`
      })
    }

    // Record the feedback
    await aiSuggestionsService.recordFeedback(
      id,
      userId,
      action as 'clicked' | 'implemented' | 'modified' | 'rejected' | 'reported',
      {
        rating,
        text: feedback_text,
        modifications
      }
    )

    // Update suggestion status based on action
    const statusMap: Record<string, string> = {
      clicked: 'shown',
      implemented: 'accepted',
      modified: 'accepted',
      rejected: 'rejected',
      reported: 'rejected'
    }

    await aiSuggestionsService.updateSuggestionStatus(id, statusMap[action])

    // Get the suggestion to know its type for learning
    const suggestion = await aiSuggestionsService.getSuggestionById(id, userId)
    const suggestionType = suggestion?.suggestion_type || 'unknown'

    // Map action to learning action
    const learningAction = action === 'implemented' || action === 'clicked' ? 'accepted' :
                          action === 'modified' ? 'modified' :
                          action === 'rejected' || action === 'reported' ? 'rejected' :
                          'ignored'

    // Learn from this action to improve future suggestions
    await userIntelligenceService.learnFromAction(
      userId,
      suggestionType,
      learningAction as 'accepted' | 'rejected' | 'modified' | 'ignored',
      {
        suggestionTitle: suggestion?.title,
        reason: feedback_text
      }
    )

    res.json({
      success: true,
      message: `Action '${action}' recorded successfully`
    })
  } catch (error: any) {
    console.error('[Suggestions API] Error recording action:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to record action'
    })
  }
})

/**
 * POST /api/suggestions/generate
 * Manually trigger suggestion generation (rate-limited)
 */
router.post('/generate', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.body.clerk_user_id
    const { mode = 'quick' } = req.body // 'quick' or 'deep'

    // Check if user has enough data
    const readiness = await userIntelligenceService.hasEnoughDataForSuggestions(userId)
    if (!readiness.ready) {
      return res.json({
        success: true,
        status: 'insufficient_data',
        message: readiness.reason,
        requirements: readiness.requiredActions
      })
    }

    // Build user intelligence
    const intelligence = await userIntelligenceService.buildIntelligence(userId)

    // Check data quality
    if (intelligence.dataQuality === 'insufficient') {
      return res.json({
        success: true,
        status: 'insufficient_data',
        message: 'We need more activity data to generate personalized suggestions.',
        dataQuality: intelligence.dataQuality
      })
    }

    // Get user context for generation
    const userContext = await aiSuggestionsService.buildUserContext(userId)

    let suggestions
    if (mode === 'deep') {
      // Use strategic analysis (Opus)
      const result = await aiSuggestionsService.generateStrategicAnalysis(userContext)
      suggestions = result.suggestions
    } else {
      // Use quick suggestions (Sonnet)
      suggestions = await aiSuggestionsService.generateSuggestions(userContext, 3)
    }

    // Filter by confidence
    const highConfidenceSuggestions = suggestions.filter(s => s.confidence >= 0.85)

    // Store suggestions
    if (highConfidenceSuggestions.length > 0) {
      await aiSuggestionsService.storeSuggestions(highConfidenceSuggestions)
    }

    res.json({
      success: true,
      status: 'generated',
      data: {
        generated: suggestions.length,
        highConfidence: highConfidenceSuggestions.length,
        suggestions: highConfidenceSuggestions
      }
    })
  } catch (error: any) {
    console.error('[Suggestions API] Error generating suggestions:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate suggestions'
    })
  }
})

/**
 * GET /api/suggestions/opportunities
 * Get high-confidence opportunities for the user
 */
router.get('/opportunities', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.body.clerk_user_id
    const { minConfidence = 0.85, limit = 5 } = req.query

    const opportunities = await userIntelligenceService.getHighConfidenceOpportunities(
      userId,
      parseFloat(minConfidence as string)
    )

    // Apply limit after fetching
    const limitedOpportunities = opportunities.slice(0, parseInt(limit as string, 10))

    res.json({
      success: true,
      data: limitedOpportunities,
      count: limitedOpportunities.length,
      totalAvailable: opportunities.length
    })
  } catch (error: any) {
    console.error('[Suggestions API] Error fetching opportunities:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch opportunities'
    })
  }
})

/**
 * GET /api/suggestions/health
 * Get background job health status (admin/debug endpoint)
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isRunning = backgroundJobService.isRunning
    const activeJobs = Array.from(backgroundJobService.intervals.keys())

    res.json({
      success: true,
      data: {
        jobSchedulerRunning: isRunning,
        activeJobTypes: activeJobs,
        activeJobCount: activeJobs.length
      }
    })
  } catch (error: any) {
    console.error('[Suggestions API] Error fetching health:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch health status'
    })
  }
})

/**
 * POST /api/suggestions/jobs/start
 * Start the background job scheduler (admin endpoint)
 */
router.post('/jobs/start', async (req: Request, res: Response) => {
  try {
    backgroundJobService.start()

    res.json({
      success: true,
      message: 'Background job scheduler started'
    })
  } catch (error: any) {
    console.error('[Suggestions API] Error starting jobs:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start job scheduler'
    })
  }
})

/**
 * POST /api/suggestions/jobs/stop
 * Stop the background job scheduler (admin endpoint)
 */
router.post('/jobs/stop', async (req: Request, res: Response) => {
  try {
    backgroundJobService.stop()

    res.json({
      success: true,
      message: 'Background job scheduler stopped'
    })
  } catch (error: any) {
    console.error('[Suggestions API] Error stopping jobs:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stop job scheduler'
    })
  }
})

export default router

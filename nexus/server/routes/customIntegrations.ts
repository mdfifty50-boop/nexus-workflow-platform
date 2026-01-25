/**
 * Custom Integrations API Routes
 *
 * Enables users to connect apps not natively supported by Composio
 * by providing their own API keys.
 *
 * Flow:
 * 1. GET /api/custom-integrations/info/:appName - Get API info for an app
 * 2. POST /api/custom-integrations/validate - Validate API key format
 * 3. POST /api/custom-integrations/test - Test API key connection
 * 4. POST /api/custom-integrations/save - Save credentials
 * 5. POST /api/custom-integrations/execute - Execute API request
 */

import { Router, Request, Response } from 'express'
import { customIntegrationService, KNOWN_APP_APIS } from '../services/CustomIntegrationService'

const router = Router()

/**
 * GET /api/custom-integrations/apps
 * List all known apps with API documentation
 */
router.get('/apps', (_req: Request, res: Response) => {
  const apps = Object.values(KNOWN_APP_APIS).map((app) => ({
    name: app.name,
    displayName: app.displayName,
    category: app.category,
    hasApiDocs: true,
  }))

  res.json({
    success: true,
    apps,
    count: apps.length,
  })
})

/**
 * GET /api/custom-integrations/apps/:category
 * Get apps by category
 */
router.get('/apps/:category', (req: Request, res: Response) => {
  const { category } = req.params

  const apps = customIntegrationService.getAppsByCategory(category)

  res.json({
    success: true,
    category,
    apps: apps.map((app) => ({
      name: app.name,
      displayName: app.displayName,
      apiDocsUrl: app.apiDocsUrl,
      apiKeyUrl: app.apiKeyUrl,
    })),
    count: apps.length,
  })
})

/**
 * GET /api/custom-integrations/info/:appName
 * Get API info for a specific app
 */
router.get('/info/:appName', (req: Request, res: Response) => {
  const { appName } = req.params

  const setupInfo = customIntegrationService.generateSetupResponse(appName)

  if (!setupInfo.found) {
    return res.status(404).json({
      success: false,
      error: 'App not found in database',
      message: setupInfo.message,
      suggestions: {
        searchQuery: `${appName} API documentation`,
        alternatives: customIntegrationService
          .getAppsByCategory(req.query.category as string || 'ACCOUNTING')
          .slice(0, 5)
          .map((a) => a.displayName),
      },
    })
  }

  res.json({
    success: true,
    ...setupInfo,
  })
})

/**
 * POST /api/custom-integrations/validate
 * Validate API key format (doesn't test connection)
 */
router.post('/validate', (req: Request, res: Response) => {
  const { appName, apiKey } = req.body

  if (!appName || !apiKey) {
    return res.status(400).json({
      success: false,
      error: 'appName and apiKey are required',
    })
  }

  const result = customIntegrationService.validateKeyFormat(appName, apiKey)

  res.json({
    success: result.valid,
    ...result,
  })
})

/**
 * POST /api/custom-integrations/test
 * Test API key by making a real connection
 */
router.post('/test', async (req: Request, res: Response) => {
  const { appName, apiKey, additionalConfig } = req.body

  if (!appName || !apiKey) {
    return res.status(400).json({
      success: false,
      error: 'appName and apiKey are required',
    })
  }

  console.log(`[CustomIntegration] Testing connection for ${appName}`)

  try {
    const result = await customIntegrationService.testConnection(appName, apiKey, additionalConfig)

    res.json({
      success: result.valid,
      ...result,
    })
  } catch (error) {
    console.error('[CustomIntegration] Test error:', error)
    res.status(500).json({
      success: false,
      error: String(error),
    })
  }
})

/**
 * POST /api/custom-integrations/save
 * Save API credentials for a user
 */
router.post('/save', async (req: Request, res: Response) => {
  const { appName, apiKey, additionalConfig, userId = 'default', skipValidation = false } = req.body

  if (!appName || !apiKey) {
    return res.status(400).json({
      success: false,
      error: 'appName and apiKey are required',
    })
  }

  console.log(`[CustomIntegration] Saving credentials for ${appName} (user: ${userId})`)

  try {
    // Validate format first
    const formatResult = customIntegrationService.validateKeyFormat(appName, apiKey)
    if (!formatResult.formatValid && !skipValidation) {
      return res.status(400).json({
        success: false,
        error: 'Invalid key format',
        ...formatResult,
      })
    }

    // Optionally test connection
    if (!skipValidation) {
      const testResult = await customIntegrationService.testConnection(appName, apiKey, additionalConfig)
      if (!testResult.valid) {
        return res.status(400).json({
          success: false,
          error: 'Connection test failed',
          ...testResult,
        })
      }
    }

    // Save credentials
    customIntegrationService.saveCredentials(userId, appName, apiKey, additionalConfig)

    res.json({
      success: true,
      message: `Credentials saved for ${appName}`,
      appName,
    })
  } catch (error) {
    console.error('[CustomIntegration] Save error:', error)
    res.status(500).json({
      success: false,
      error: String(error),
    })
  }
})

/**
 * GET /api/custom-integrations/status/:appName
 * Check if user has credentials saved for an app
 */
router.get('/status/:appName', (req: Request, res: Response) => {
  const { appName } = req.params
  const userId = (req.query.userId as string) || 'default'

  const hasCredentials = customIntegrationService.hasCredentials(userId, appName)
  const credentials = customIntegrationService.getCredentials(userId, appName)

  res.json({
    success: true,
    appName,
    connected: hasCredentials,
    lastUsed: credentials?.lastUsed,
    createdAt: credentials?.createdAt,
  })
})

/**
 * DELETE /api/custom-integrations/:appName
 * Delete saved credentials
 */
router.delete('/:appName', (req: Request, res: Response) => {
  const { appName } = req.params
  const userId = (req.query.userId as string) || 'default'

  const deleted = customIntegrationService.deleteCredentials(userId, appName)

  res.json({
    success: deleted,
    message: deleted ? `Credentials deleted for ${appName}` : 'No credentials found',
  })
})

/**
 * POST /api/custom-integrations/execute
 * Execute an API request using stored credentials
 */
router.post('/execute', async (req: Request, res: Response) => {
  const { appName, method = 'GET', endpoint, body, userId = 'default' } = req.body

  if (!appName || !endpoint) {
    return res.status(400).json({
      success: false,
      error: 'appName and endpoint are required',
    })
  }

  console.log(`[CustomIntegration] Executing ${method} ${endpoint} for ${appName}`)

  try {
    const result = await customIntegrationService.executeRequest(userId, appName, method, endpoint, body)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('[CustomIntegration] Execute error:', error)
    res.status(500).json({
      success: false,
      error: String(error),
    })
  }
})

export default router

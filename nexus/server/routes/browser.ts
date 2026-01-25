/**
 * Browser Automation Routes - Real browser automation via Playwright
 *
 * These routes enable:
 * - Web navigation and screenshots
 * - Form filling and submission
 * - Data extraction from web pages
 * - Complex multi-step booking flows
 */

import { Router, Request, Response } from 'express'
import { playwrightService } from '../services/PlaywrightService.js'

const router = Router()

/**
 * POST /api/browser/navigate
 * Navigate to a URL
 */
router.post('/navigate', async (req: Request, res: Response) => {
  const { url, waitUntil, timeout } = req.body

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'url is required'
    })
  }

  try {
    const result = await playwrightService.navigate({ url, waitUntil, timeout })
    res.json({
      success: result.success,
      data: result.data,
      errors: result.errors,
      duration: result.duration,
      isDemoMode: playwrightService.isDemoMode
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    })
  }
})

/**
 * POST /api/browser/click
 * Click an element
 */
router.post('/click', async (req: Request, res: Response) => {
  const { selector, timeout } = req.body

  if (!selector) {
    return res.status(400).json({
      success: false,
      error: 'selector is required'
    })
  }

  try {
    const result = await playwrightService.click({ selector, timeout })
    res.json({
      success: result.success,
      data: result.data,
      errors: result.errors,
      duration: result.duration,
      isDemoMode: playwrightService.isDemoMode
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    })
  }
})

/**
 * POST /api/browser/type
 * Type text into an element
 */
router.post('/type', async (req: Request, res: Response) => {
  const { selector, text, delay } = req.body

  if (!selector || !text) {
    return res.status(400).json({
      success: false,
      error: 'selector and text are required'
    })
  }

  try {
    const result = await playwrightService.type({ selector, text, delay })
    res.json({
      success: result.success,
      data: result.data,
      errors: result.errors,
      duration: result.duration,
      isDemoMode: playwrightService.isDemoMode
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    })
  }
})

/**
 * POST /api/browser/extract
 * Extract data from the page
 */
router.post('/extract', async (req: Request, res: Response) => {
  const { selector, attribute, multiple } = req.body

  if (!selector) {
    return res.status(400).json({
      success: false,
      error: 'selector is required'
    })
  }

  try {
    const result = await playwrightService.extract({ selector, attribute, multiple })
    res.json({
      success: result.success,
      data: result.data,
      errors: result.errors,
      duration: result.duration,
      isDemoMode: playwrightService.isDemoMode
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    })
  }
})

/**
 * POST /api/browser/screenshot
 * Take a screenshot
 */
router.post('/screenshot', async (req: Request, res: Response) => {
  const { name } = req.body

  try {
    const result = await playwrightService.screenshot(name)
    res.json({
      success: result.success,
      data: result.data,
      screenshots: result.screenshots,
      errors: result.errors,
      duration: result.duration,
      isDemoMode: playwrightService.isDemoMode
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    })
  }
})

/**
 * GET /api/browser/snapshot
 * Get accessibility snapshot of current page
 */
router.get('/snapshot', async (_req: Request, res: Response) => {
  try {
    const result = await playwrightService.snapshot()
    res.json({
      success: result.success,
      data: result.data,
      errors: result.errors,
      duration: result.duration,
      isDemoMode: playwrightService.isDemoMode
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    })
  }
})

/**
 * POST /api/browser/wait
 * Wait for element or time
 */
router.post('/wait', async (req: Request, res: Response) => {
  const { selector, time } = req.body

  try {
    const result = await playwrightService.wait({ selector, time })
    res.json({
      success: result.success,
      data: result.data,
      errors: result.errors,
      duration: result.duration,
      isDemoMode: playwrightService.isDemoMode
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    })
  }
})

/**
 * POST /api/browser/fill-form
 * Fill multiple form fields
 */
router.post('/fill-form', async (req: Request, res: Response) => {
  const { fields } = req.body

  if (!fields || !Array.isArray(fields)) {
    return res.status(400).json({
      success: false,
      error: 'fields array is required'
    })
  }

  try {
    const result = await playwrightService.fillForm(fields)
    res.json({
      success: result.success,
      data: result.data,
      errors: result.errors,
      duration: result.duration,
      isDemoMode: playwrightService.isDemoMode
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    })
  }
})

/**
 * POST /api/browser/booking
 * Execute a complete booking flow
 */
router.post('/booking', async (req: Request, res: Response) => {
  const { provider, searchUrl, searchParams, selectionCriteria, passengerDetails } = req.body

  if (!provider || !searchUrl) {
    return res.status(400).json({
      success: false,
      error: 'provider and searchUrl are required'
    })
  }

  try {
    const result = await playwrightService.executeBookingFlow({
      provider,
      searchUrl,
      searchParams: searchParams || {},
      selectionCriteria,
      passengerDetails
    })

    res.json({
      success: result.success,
      data: result.data,
      screenshots: result.screenshots,
      errors: result.errors,
      duration: result.duration,
      isDemoMode: playwrightService.isDemoMode
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    })
  }
})

/**
 * GET /api/browser/status
 * Get browser automation status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      available: playwrightService.isAvailable,
      isDemoMode: playwrightService.isDemoMode,
      currentUrl: await playwrightService.getCurrentUrl(),
      pageTitle: await playwrightService.getPageTitle()
    })
  } catch (error) {
    res.json({
      success: false,
      available: false,
      isDemoMode: true,
      error: String(error)
    })
  }
})

/**
 * POST /api/browser/close
 * Close browser session
 */
router.post('/close', async (_req: Request, res: Response) => {
  try {
    await playwrightService.close()
    res.json({
      success: true,
      message: 'Browser session closed'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error)
    })
  }
})

export default router

/**
 * WhatsApp Business Routes - AiSensy Integration
 *
 * Legitimate WhatsApp Business API via AiSensy BSP.
 *
 * Endpoints:
 * - POST /api/whatsapp-business/connect - Start Embedded Signup
 * - POST /api/whatsapp-business/callback - OAuth callback handler
 * - POST /api/whatsapp-business/register-key - Register existing API key
 * - GET /api/whatsapp-business/status - Get connection status
 * - POST /api/whatsapp-business/send - Send template message
 * - POST /api/whatsapp-business/reply - Send session reply (24h window)
 * - GET /api/whatsapp-business/templates - Get available templates
 * - POST /api/whatsapp-business/webhook - Receive incoming messages
 * - GET /api/whatsapp-business/webhook - Webhook verification (Meta requirement)
 * - POST /api/whatsapp-business/disconnect - Disconnect account
 */

import { Router, Request, Response } from 'express'
import { aiSensyService } from '../services/AiSensyService.js'

const router = Router()

/**
 * Get user ID from request
 */
function getUserId(req: Request): string {
  const userId = req.headers['x-user-id'] as string
  if (userId) return userId
  if (req.query.userId) return req.query.userId as string
  return req.ip || 'anonymous'
}

/**
 * GET /api/whatsapp-business/status
 * Get current connection status
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const account = aiSensyService.getAccount(userId)

    if (!account) {
      return res.json({
        success: true,
        connected: false,
        status: 'not_connected',
        message: 'WhatsApp Business not connected. Use Embedded Signup to get started.'
      })
    }

    res.json({
      success: true,
      connected: account.status === 'active',
      account: {
        id: account.id,
        phoneNumber: account.phoneNumber,
        displayName: account.displayName,
        status: account.status,
        lastActivity: account.lastActivity
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/whatsapp-business/connect
 * Get Embedded Signup URL to create WhatsApp Business Account
 *
 * This is the recommended flow for new users who don't have a WABA.
 */
router.post('/connect', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { redirectUrl } = req.body

    // Check if already connected
    const existingAccount = aiSensyService.getAccount(userId)
    if (existingAccount?.status === 'active') {
      return res.json({
        success: true,
        alreadyConnected: true,
        account: {
          phoneNumber: existingAccount.phoneNumber,
          displayName: existingAccount.displayName
        }
      })
    }

    // Generate Embedded Signup URL
    // PRODUCTION FIX: Use APP_URL for server-side, VITE_APP_URL for fallback
    const baseUrl = process.env.APP_URL || process.env.VITE_APP_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173')
    if (!baseUrl && process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        success: false,
        error: 'APP_URL environment variable not configured for production'
      })
    }
    const callbackUrl = redirectUrl || `${baseUrl}/whatsapp-callback`

    const signupUrl = aiSensyService.getEmbeddedSignupUrl(userId, callbackUrl)

    res.json({
      success: true,
      signupUrl,
      instructions: [
        'Click the signup URL or open it in a new window',
        'Follow the Meta onboarding process',
        'Connect your phone number to WhatsApp Business',
        'Once complete, you can send and receive messages'
      ]
    })
  } catch (error: any) {
    console.error('WhatsApp connect error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate signup URL'
    })
  }
})

/**
 * POST /api/whatsapp-business/callback
 * Handle OAuth callback after Embedded Signup
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { code, state } = req.body

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing code or state parameter'
      })
    }

    const result = await aiSensyService.completeEmbeddedSignup(userId, code, state)

    if (result.success) {
      res.json({
        success: true,
        account: {
          phoneNumber: result.account!.phoneNumber,
          displayName: result.account!.displayName,
          status: result.account!.status
        },
        message: 'WhatsApp Business connected successfully!'
      })
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      })
    }
  } catch (error: any) {
    console.error('WhatsApp callback error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/whatsapp-business/register-key
 * Register an existing AiSensy API key (for users who already have an account)
 */
router.post('/register-key', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { apiKey, phoneNumber, displayName } = req.body

    if (!apiKey || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'apiKey and phoneNumber are required'
      })
    }

    const result = await aiSensyService.registerApiKey(
      userId,
      apiKey,
      phoneNumber,
      displayName
    )

    if (result.success) {
      res.json({
        success: true,
        account: {
          phoneNumber: result.account!.phoneNumber,
          displayName: result.account!.displayName,
          status: result.account!.status
        },
        message: 'API key registered successfully!'
      })
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/whatsapp-business/send
 * Send a template message
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { to, templateName, templateParams, mediaUrl, mediaFilename, tags } = req.body

    if (!to || !templateName) {
      return res.status(400).json({
        success: false,
        error: 'to and templateName are required'
      })
    }

    if (!aiSensyService.isConnected(userId)) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp Business not connected'
      })
    }

    const result = await aiSensyService.sendMessage(userId, {
      to,
      templateName,
      templateParams,
      mediaUrl,
      mediaFilename,
      tags
    })

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        timestamp: result.timestamp
      })
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/whatsapp-business/reply
 * Send a session reply (within 24h window)
 */
router.post('/reply', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { to, message } = req.body

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'to and message are required'
      })
    }

    if (!aiSensyService.isConnected(userId)) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp Business not connected'
      })
    }

    const result = await aiSensyService.sendQuickReply(userId, to, message)

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        timestamp: result.timestamp
      })
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/whatsapp-business/templates
 * Get available message templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const refresh = req.query.refresh === 'true'

    if (!aiSensyService.isConnected(userId)) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp Business not connected'
      })
    }

    const templates = refresh
      ? await aiSensyService.refreshTemplates(userId)
      : await aiSensyService.getTemplates(userId)

    res.json({
      success: true,
      templates,
      count: templates.length
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/whatsapp-business/webhook
 * Webhook verification (required by Meta)
 */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  const verifyToken = process.env.AISENSY_WEBHOOK_VERIFY_TOKEN || 'nexus-whatsapp-verify'

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('📱 WhatsApp webhook verified')
    res.status(200).send(challenge)
  } else {
    res.status(403).send('Verification failed')
  }
})

/**
 * POST /api/whatsapp-business/webhook
 * Receive incoming messages and status updates
 */
router.post('/webhook', (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string ||
                      req.headers['x-aisensy-signature'] as string

    const event = aiSensyService.processWebhook(req.body, signature)

    if (event) {
      console.log(`📱 WhatsApp webhook: ${event.type} - ${event.messageId}`)
    }

    // Always respond 200 to acknowledge receipt
    res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    // Still return 200 to prevent retries
    res.status(200).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/whatsapp-business/disconnect
 * Disconnect WhatsApp Business account
 */
router.post('/disconnect', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    await aiSensyService.disconnectAccount(userId)

    res.json({
      success: true,
      message: 'WhatsApp Business disconnected'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/whatsapp-business/admin/accounts
 * Get all accounts (admin only)
 */
router.get('/admin/accounts', (req: Request, res: Response) => {
  try {
    // In production, add admin auth check here
    const accounts = aiSensyService.getAllAccounts()

    res.json({
      success: true,
      count: accounts.length,
      accounts: accounts.map(a => ({
        id: a.id,
        userId: a.userId,
        phoneNumber: a.phoneNumber,
        displayName: a.displayName,
        status: a.status,
        lastActivity: a.lastActivity
      }))
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router

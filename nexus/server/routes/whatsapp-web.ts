/**
 * WhatsApp Web API Routes
 *
 * Production-grade API for WhatsApp Web integration via whatsapp-web.js
 *
 * Endpoints:
 * - POST   /api/whatsapp-web/session     - Create new session (returns session ID)
 * - GET    /api/whatsapp-web/session/:id - Get session status
 * - GET    /api/whatsapp-web/qr/:id      - SSE stream for QR code updates
 * - POST   /api/whatsapp-web/send        - Send a message
 * - DELETE /api/whatsapp-web/session/:id - Disconnect and destroy session
 * - GET    /api/whatsapp-web/sessions    - List all sessions for user
 */

import { Router, Request, Response } from 'express'
// @NEXUS-FIX-091: Use Baileys instead of whatsapp-web.js to fix "Execution context destroyed" error
// Baileys uses direct WebSocket connection - no Puppeteer dependency
import { whatsAppBaileysService as whatsAppWebService, SessionState } from '../services/WhatsAppBaileysService'

const router = Router()

// Middleware to extract user ID (from auth or query param for testing)
const getUserId = (req: Request): string => {
  // In production, get from auth middleware
  // For now, accept from header or query param
  return (
    (req.headers['x-user-id'] as string) ||
    (req.query.userId as string) ||
    'default-user'
  )
}

/**
 * Create a new WhatsApp session
 * POST /api/whatsapp-web/session
 */
router.post('/session', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    console.log(`[WhatsAppWeb API] Creating session for user: ${userId}`)

    const session = await whatsAppWebService.createSession(userId)

    res.json({
      success: true,
      session: {
        id: session.id,
        state: session.state,
        phoneNumber: session.phoneNumber,
        createdAt: session.createdAt,
      },
      message: 'Session created. Connect to QR endpoint for code.',
      qrEndpoint: `/api/whatsapp-web/qr/${session.id}`,
    })
  } catch (error) {
    console.error('[WhatsAppWeb API] Create session error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session',
    })
  }
})

/**
 * Get session status
 * GET /api/whatsapp-web/session/:id
 */
router.get('/session/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const session = whatsAppWebService.getSession(id)

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      })
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        state: session.state,
        phoneNumber: session.phoneNumber,
        pushName: session.pushName,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        error: session.error,
        isConnected: session.state === 'ready',
      },
    })
  } catch (error) {
    console.error('[WhatsAppWeb API] Get session error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session',
    })
  }
})

/**
 * SSE endpoint for real-time QR code updates
 * GET /api/whatsapp-web/qr/:id
 *
 * Events:
 * - qr: New QR code available
 * - authenticated: Successfully authenticated
 * - ready: Session is ready
 * - error: Error occurred
 * - state: State changed
 */
router.get('/qr/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const session = whatsAppWebService.getSession(id)

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found',
    })
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  console.log(`[WhatsAppWeb API] SSE connected for session: ${id}`)

  // Send current state
  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Send initial state
  sendEvent('state', { state: session.state, phoneNumber: session.phoneNumber })

  // If QR is already available, send it
  if (session.qrCode) {
    sendEvent('qr', { qrCode: session.qrCode })
  }

  // If already ready, send ready event
  if (session.state === 'ready') {
    sendEvent('ready', { phoneNumber: session.phoneNumber, pushName: session.pushName })
  }

  // Set up event listeners
  const onQR = (sessionId: string, qrCode: string) => {
    if (sessionId === id) {
      sendEvent('qr', { qrCode })
    }
  }

  const onPairingCode = (sessionId: string, code: string) => {
    if (sessionId === id) {
      sendEvent('pairingCode', { code })
    }
  }

  const onAuthenticated = (sessionId: string) => {
    if (sessionId === id) {
      sendEvent('authenticated', { message: 'Successfully authenticated' })
    }
  }

  const onReady = (sessionId: string, phoneNumber: string) => {
    if (sessionId === id) {
      const currentSession = whatsAppWebService.getSession(id)
      sendEvent('ready', {
        phoneNumber,
        pushName: currentSession?.pushName,
      })
    }
  }

  const onError = (sessionId: string, error: Error) => {
    if (sessionId === id) {
      sendEvent('error', { error: error.message })
    }
  }

  // @NEXUS-FIX-085: Include error message in state event when state='error' - DO NOT REMOVE
  // This ensures the frontend receives the error details even if they miss the separate error event
  const onStateChanged = (sessionId: string, state: SessionState) => {
    if (sessionId === id) {
      const currentSession = whatsAppWebService.getSession(id)
      sendEvent('state', {
        state,
        error: state === 'error' ? currentSession?.error : undefined
      })
    }
  }

  const onDisconnected = (sessionId: string, reason: string) => {
    if (sessionId === id) {
      sendEvent('disconnected', { reason })
    }
  }

  // Attach listeners
  whatsAppWebService.on('qr', onQR)
  whatsAppWebService.on('pairingCode', onPairingCode)
  whatsAppWebService.on('authenticated', onAuthenticated)
  whatsAppWebService.on('ready', onReady)
  whatsAppWebService.on('error', onError)
  whatsAppWebService.on('stateChanged', onStateChanged)
  whatsAppWebService.on('disconnected', onDisconnected)

  // Keep-alive ping every 30 seconds
  const pingInterval = setInterval(() => {
    res.write(': ping\n\n')
  }, 30000)

  // Cleanup on close
  req.on('close', () => {
    console.log(`[WhatsAppWeb API] SSE disconnected for session: ${id}`)
    clearInterval(pingInterval)
    whatsAppWebService.off('qr', onQR)
    whatsAppWebService.off('pairingCode', onPairingCode)
    whatsAppWebService.off('authenticated', onAuthenticated)
    whatsAppWebService.off('ready', onReady)
    whatsAppWebService.off('error', onError)
    whatsAppWebService.off('stateChanged', onStateChanged)
    whatsAppWebService.off('disconnected', onDisconnected)
  })
})

/**
 * Request a pairing code (for mobile users who can't scan QR)
 * POST /api/whatsapp-web/pairing-code
 *
 * Body:
 * - sessionId: string (required)
 * - phoneNumber: string (required, with country code e.g., 96512345678)
 */
router.post('/pairing-code', async (req: Request, res: Response) => {
  try {
    const { sessionId, phoneNumber } = req.body

    if (!sessionId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, phoneNumber',
      })
    }

    const result = await whatsAppWebService.requestPairingCode(sessionId, phoneNumber)

    if (result.success) {
      res.json({
        success: true,
        code: result.code,
        message: 'Enter this code in WhatsApp > Linked Devices > Link with phone number',
        instructions: [
          '1. Open WhatsApp on your phone',
          '2. Go to Settings > Linked Devices',
          '3. Tap "Link a Device"',
          '4. Tap "Link with phone number instead"',
          `5. Enter the code: ${result.code}`,
        ],
      })
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      })
    }
  } catch (error) {
    console.error('[WhatsAppWeb API] Pairing code error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate pairing code',
    })
  }
})

/**
 * Send a WhatsApp message
 * POST /api/whatsapp-web/send
 *
 * Body:
 * - sessionId: string (required)
 * - to: string (phone number, required)
 * - message: string (required)
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { sessionId, to, message } = req.body

    if (!sessionId || !to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, to, message',
      })
    }

    const result = await whatsAppWebService.sendMessage(sessionId, to, message)

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Message sent successfully',
      })
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      })
    }
  } catch (error) {
    console.error('[WhatsAppWeb API] Send message error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    })
  }
})

/**
 * Disconnect and destroy a session
 * DELETE /api/whatsapp-web/session/:id
 *
 * Query params:
 * - logout: boolean (if true, clears saved credentials)
 */
router.delete('/session/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const logout = req.query.logout === 'true'

    const session = whatsAppWebService.getSession(id)
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      })
    }

    if (logout) {
      await whatsAppWebService.logout(id)
    } else {
      await whatsAppWebService.destroySession(id)
    }

    res.json({
      success: true,
      message: logout ? 'Logged out and session destroyed' : 'Session destroyed',
    })
  } catch (error) {
    console.error('[WhatsAppWeb API] Delete session error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to destroy session',
    })
  }
})

/**
 * List all sessions for a user
 * GET /api/whatsapp-web/sessions
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const allSessions = whatsAppWebService.getAllSessions()

    // Filter to user's sessions
    const userSessions = allSessions
      .filter(s => s.userId === userId)
      .map(s => ({
        id: s.id,
        state: s.state,
        phoneNumber: s.phoneNumber,
        pushName: s.pushName,
        lastActivity: s.lastActivity,
        createdAt: s.createdAt,
        isConnected: s.state === 'ready',
      }))

    res.json({
      success: true,
      sessions: userSessions,
      count: userSessions.length,
    })
  } catch (error) {
    console.error('[WhatsAppWeb API] List sessions error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list sessions',
    })
  }
})

/**
 * Get session by user (convenience endpoint)
 * GET /api/whatsapp-web/my-session
 */
router.get('/my-session', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const session = whatsAppWebService.getSessionByUserId(userId)

    if (!session) {
      return res.json({
        success: true,
        session: null,
        message: 'No active session found',
      })
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        state: session.state,
        phoneNumber: session.phoneNumber,
        pushName: session.pushName,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        isConnected: session.state === 'ready',
        qrEndpoint: `/api/whatsapp-web/qr/${session.id}`,
      },
    })
  } catch (error) {
    console.error('[WhatsAppWeb API] Get my session error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session',
    })
  }
})

export default router

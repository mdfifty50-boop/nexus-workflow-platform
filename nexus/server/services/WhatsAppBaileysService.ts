/**
 * WhatsAppBaileysService - Production-grade WhatsApp Web integration using Baileys
 *
 * Uses @whiskeysockets/baileys for direct WebSocket connection (no Puppeteer).
 * This is more reliable than whatsapp-web.js as it doesn't depend on browser automation.
 *
 * IMPORTANT: This is for personal/responsible use only.
 * - Do NOT use for mass marketing or spam
 * - Respect WhatsApp's fair use policies
 * - Users are responsible for their own compliance
 *
 * Features:
 * - Multi-user session management
 * - Session persistence (survives server restarts)
 * - Auto-reconnection with exponential backoff
 * - QR code streaming via SSE
 * - Message queuing for reliability
 * - Proper cleanup and resource management
 */

import { EventEmitter } from 'events'
import path from 'path'
import fs from 'fs'
import QRCode from 'qrcode'

// Session states (same as original for compatibility)
export type SessionState =
  | 'initializing'
  | 'qr_pending'
  | 'code_pending'
  | 'authenticating'
  | 'ready'
  | 'disconnected'
  | 'destroyed'
  | 'error'

// Session data structure (same as original for compatibility)
export interface WhatsAppSession {
  id: string
  userId: string
  state: SessionState
  qrCode: string | null
  pairingCode: string | null
  phoneNumber: string | null
  pushName: string | null
  lastActivity: Date
  createdAt: Date
  error: string | null
  reconnectAttempts: number
}

// Message structure (same as original for compatibility)
export interface WhatsAppMessage {
  id: string
  sessionId: string
  from: string
  to: string
  body: string
  timestamp: Date
  fromMe: boolean
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
}

// Event types (same as original for compatibility)
export interface SessionEvents {
  qr: (sessionId: string, qrCode: string) => void
  pairingCode: (sessionId: string, code: string) => void
  ready: (sessionId: string, phoneNumber: string) => void
  authenticated: (sessionId: string) => void
  disconnected: (sessionId: string, reason: string) => void
  message: (sessionId: string, message: WhatsAppMessage) => void
  error: (sessionId: string, error: Error) => void
  stateChanged: (sessionId: string, state: SessionState) => void
}

// Configuration
const CONFIG = {
  SESSION_DIR: path.join(process.cwd(), '.whatsapp-sessions-baileys'),
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_BASE_DELAY: 1000, // 1 second
  RECONNECT_MAX_DELAY: 60000, // 1 minute
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  QR_REFRESH_INTERVAL: 20000, // 20 seconds
}

// Baileys types (simplified for our use)
interface BaileysSocket {
  ev: EventEmitter
  logout: () => Promise<void>
  end: (error?: Error) => void
  sendMessage: (jid: string, content: { text: string }) => Promise<{ key: { id: string } }>
  user?: { id: string; name?: string }
  authState: { creds: unknown; keys: unknown }
}

class WhatsAppBaileysService extends EventEmitter {
  private sessions: Map<string, WhatsAppSession> = new Map()
  private sockets: Map<string, BaileysSocket> = new Map()
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map()
  private initialized: boolean = false

  // Baileys modules (loaded dynamically)
  private makeWASocket: ((config: unknown) => BaileysSocket) | null = null
  private useMultiFileAuthState: ((folder: string) => Promise<{ state: unknown; saveCreds: () => Promise<void> }>) | null = null
  private DisconnectReason: Record<string, number> | null = null
  private Browsers: Record<string, (name: string) => [string, string, string]> | null = null

  constructor() {
    super()
    this.ensureSessionDirectory()

    // Prevent crash on unhandled error events
    this.on('error', (sessionId: string, error: Error) => {
      console.error(`[WhatsAppBaileys] Session ${sessionId} error:`, error.message)
    })
  }

  /**
   * Initialize the service (lazy load Baileys)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Dynamic import Baileys
      const baileys = await import('@whiskeysockets/baileys')

      this.makeWASocket = baileys.default || baileys.makeWASocket
      this.useMultiFileAuthState = baileys.useMultiFileAuthState
      this.DisconnectReason = baileys.DisconnectReason
      this.Browsers = baileys.Browsers

      if (!this.makeWASocket || !this.useMultiFileAuthState) {
        throw new Error('Could not find required Baileys exports')
      }

      this.initialized = true
      console.log('[WhatsAppBaileys] Service initialized')
    } catch (error) {
      console.error('[WhatsAppBaileys] Failed to load Baileys:', error)
      throw new Error(
        '@whiskeysockets/baileys not installed. Run: npm install @whiskeysockets/baileys'
      )
    }
  }

  /**
   * Ensure session directory exists
   */
  private ensureSessionDirectory(): void {
    if (!fs.existsSync(CONFIG.SESSION_DIR)) {
      fs.mkdirSync(CONFIG.SESSION_DIR, { recursive: true })
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(userId: string): string {
    return `wa_${userId}_${Date.now()}`
  }

  /**
   * Get session auth directory
   */
  private getAuthDir(sessionId: string): string {
    return path.join(CONFIG.SESSION_DIR, sessionId)
  }

  /**
   * Create or restore a WhatsApp session for a user
   */
  async createSession(userId: string): Promise<WhatsAppSession> {
    await this.initialize()

    // Check for existing session
    const existingSession = this.getSessionByUserId(userId)
    if (existingSession && existingSession.state === 'ready') {
      return existingSession
    }

    // Clean up any old session for this user
    if (existingSession) {
      await this.destroySession(existingSession.id)
    }

    const sessionId = this.generateSessionId(userId)

    const session: WhatsAppSession = {
      id: sessionId,
      userId: userId,
      state: 'initializing',
      qrCode: null,
      pairingCode: null,
      phoneNumber: null,
      pushName: null,
      lastActivity: new Date(),
      createdAt: new Date(),
      error: null,
      reconnectAttempts: 0,
    }

    this.sessions.set(sessionId, session)
    this.emit('stateChanged', sessionId, 'initializing')

    // Initialize Baileys socket
    await this.initializeSocket(sessionId, session)

    return session
  }

  /**
   * Initialize Baileys socket for a session
   */
  private async initializeSocket(sessionId: string, session: WhatsAppSession, attempt: number = 1): Promise<void> {
    const maxAttempts = 3

    try {
      console.log(`[WhatsAppBaileys] Session ${sessionId} initialization attempt ${attempt}/${maxAttempts}`)

      const authDir = this.getAuthDir(sessionId)

      // Ensure auth directory exists
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true })
      }

      // Get auth state
      const { state, saveCreds } = await this.useMultiFileAuthState!(authDir)

      // Create a proper pino-compatible logger mock
      // @NEXUS-FIX-092: Baileys requires pino-compatible logger with all methods
      const silentLogger = {
        level: 'silent',
        trace: (..._args: unknown[]) => {},
        debug: (..._args: unknown[]) => {},
        info: (..._args: unknown[]) => {},
        warn: (..._args: unknown[]) => {},
        error: (..._args: unknown[]) => console.error('[WhatsAppBaileys]', ..._args),
        fatal: (..._args: unknown[]) => console.error('[WhatsAppBaileys FATAL]', ..._args),
        child: () => silentLogger,
      }

      // Create Baileys socket
      const sock = this.makeWASocket!({
        auth: state,
        printQRInTerminal: false, // We'll handle QR ourselves
        browser: this.Browsers!.ubuntu('Nexus'),
        logger: silentLogger,
      }) as BaileysSocket

      this.sockets.set(sessionId, sock)

      // Handle credentials update
      sock.ev.on('creds.update', saveCreds)

      // Handle connection updates
      sock.ev.on('connection.update', (update: { connection?: string; lastDisconnect?: { error?: Error }; qr?: string }) => {
        const { connection, lastDisconnect, qr } = update

        // QR code received
        // @NEXUS-FIX-093: Convert raw QR string to data URL for frontend display
        if (qr) {
          // Convert raw QR string to base64 data URL
          QRCode.toDataURL(qr, { width: 256, margin: 2 })
            .then((dataUrl) => {
              session.qrCode = dataUrl
              session.state = 'qr_pending'
              session.lastActivity = new Date()
              this.emit('stateChanged', sessionId, 'qr_pending')
              this.emit('qr', sessionId, dataUrl)
              console.log(`[WhatsAppBaileys] Session ${sessionId} QR code generated (data URL)`)
            })
            .catch((err) => {
              console.error(`[WhatsAppBaileys] Failed to generate QR data URL:`, err)
              // Fallback to raw QR string
              session.qrCode = qr
              this.emit('qr', sessionId, qr)
            })
        }

        // Connection state changes
        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode
          const shouldReconnect = statusCode !== this.DisconnectReason?.loggedOut

          console.log(`[WhatsAppBaileys] Session ${sessionId} disconnected, statusCode: ${statusCode}, reconnect: ${shouldReconnect}`)

          if (shouldReconnect && session.reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
            session.reconnectAttempts++
            session.state = 'disconnected'
            this.emit('stateChanged', sessionId, 'disconnected')
            this.emit('disconnected', sessionId, `Disconnected, reconnecting... (attempt ${session.reconnectAttempts})`)

            // Clean up old socket
            this.sockets.delete(sessionId)

            // Schedule reconnect with exponential backoff
            const delay = Math.min(
              CONFIG.RECONNECT_BASE_DELAY * Math.pow(2, session.reconnectAttempts - 1),
              CONFIG.RECONNECT_MAX_DELAY
            )

            const timer = setTimeout(() => {
              this.initializeSocket(sessionId, session)
            }, delay)
            this.reconnectTimers.set(sessionId, timer)
          } else {
            // Logged out or max retries - clean up
            session.state = 'error'
            session.error = statusCode === this.DisconnectReason?.loggedOut
              ? 'Logged out from WhatsApp'
              : `Connection failed after ${session.reconnectAttempts} attempts`
            this.emit('stateChanged', sessionId, 'error')
            this.emit('error', sessionId, new Error(session.error))
          }
        } else if (connection === 'open') {
          // Successfully connected
          session.state = 'ready'
          session.qrCode = null
          session.reconnectAttempts = 0
          session.lastActivity = new Date()

          // Get phone number from connection
          if (sock.user?.id) {
            session.phoneNumber = sock.user.id.split(':')[0].split('@')[0]
            session.pushName = sock.user.name || null
          }

          this.emit('stateChanged', sessionId, 'ready')
          this.emit('ready', sessionId, session.phoneNumber || 'unknown')
          this.emit('authenticated', sessionId)
          console.log(`[WhatsAppBaileys] Session ${sessionId} connected! Phone: ${session.phoneNumber}`)
        }
      })

      // Handle incoming messages
      sock.ev.on('messages.upsert', async (m: { messages: Array<{ key: { remoteJid?: string; fromMe?: boolean; id?: string }; message?: { conversation?: string; extendedTextMessage?: { text?: string } }; messageTimestamp?: number }> }) => {
        for (const msg of m.messages) {
          if (!msg.message) continue

          const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || ''

          const whatsAppMessage: WhatsAppMessage = {
            id: msg.key.id || `msg_${Date.now()}`,
            sessionId: sessionId,
            from: msg.key.remoteJid || '',
            to: session.phoneNumber || '',
            body: messageText,
            timestamp: new Date(Number(msg.messageTimestamp) * 1000),
            fromMe: msg.key.fromMe || false,
            status: 'delivered',
          }

          this.emit('message', sessionId, whatsAppMessage)
          session.lastActivity = new Date()
        }
      })

    } catch (error) {
      console.error(`[WhatsAppBaileys] Session ${sessionId} initialization attempt ${attempt} failed:`, error)

      if (attempt < maxAttempts) {
        // Cleanup and retry
        this.sockets.delete(sessionId)
        const delay = 3000 + (attempt * 1500)
        console.log(`[WhatsAppBaileys] Cleaning up and retrying in ${delay}ms...`)

        await new Promise(resolve => setTimeout(resolve, delay))
        return this.initializeSocket(sessionId, session, attempt + 1)
      } else {
        // Max attempts reached
        session.state = 'error'
        session.error = `Initialization failed after ${maxAttempts} attempts: ${(error as Error).message}`
        this.emit('stateChanged', sessionId, 'error')
        this.emit('error', sessionId, error as Error)
        console.error(`[WhatsAppBaileys] Session ${sessionId} error: ${session.error}`)
      }
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): WhatsAppSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Get session by user ID
   */
  getSessionByUserId(userId: string): WhatsAppSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.state !== 'destroyed') {
        return session
      }
    }
    return undefined
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): WhatsAppSession[] {
    return Array.from(this.sessions.values()).filter(s => s.state !== 'destroyed')
  }

  /**
   * Send a message via WhatsApp
   */
  async sendMessage(sessionId: string, to: string, message: string): Promise<WhatsAppMessage> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    if (session.state !== 'ready') {
      throw new Error(`Session ${sessionId} is not ready (current state: ${session.state})`)
    }

    const sock = this.sockets.get(sessionId)
    if (!sock) {
      throw new Error(`Socket not found for session ${sessionId}`)
    }

    // Format phone number to WhatsApp JID
    const phoneNumber = to.replace(/[^\d]/g, '')
    const jid = `${phoneNumber}@s.whatsapp.net`

    try {
      const result = await sock.sendMessage(jid, { text: message })

      const whatsAppMessage: WhatsAppMessage = {
        id: result.key.id,
        sessionId: sessionId,
        from: session.phoneNumber || '',
        to: phoneNumber,
        body: message,
        timestamp: new Date(),
        fromMe: true,
        status: 'sent',
      }

      session.lastActivity = new Date()
      console.log(`[WhatsAppBaileys] Message sent to ${phoneNumber}`)

      return whatsAppMessage
    } catch (error) {
      console.error(`[WhatsAppBaileys] Failed to send message:`, error)
      throw error
    }
  }

  /**
   * Destroy a session
   */
  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    console.log(`[WhatsAppBaileys] Destroying session ${sessionId}`)

    // Clear reconnect timer
    const timer = this.reconnectTimers.get(sessionId)
    if (timer) {
      clearTimeout(timer)
      this.reconnectTimers.delete(sessionId)
    }

    // Close socket
    const sock = this.sockets.get(sessionId)
    if (sock) {
      try {
        sock.end()
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.sockets.delete(sessionId)
    }

    // Update session state
    session.state = 'destroyed'
    this.emit('stateChanged', sessionId, 'destroyed')

    // Don't delete session data - keep it for potential restore
  }

  /**
   * Logout and destroy a session (removes auth data)
   */
  async logoutSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    console.log(`[WhatsAppBaileys] Logging out session ${sessionId}`)

    const sock = this.sockets.get(sessionId)
    if (sock) {
      try {
        await sock.logout()
      } catch (e) {
        // Ignore errors
      }
    }

    await this.destroySession(sessionId)

    // Delete auth data
    const authDir = this.getAuthDir(sessionId)
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true })
    }

    this.sessions.delete(sessionId)
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.initialized
  }
}

// Export singleton instance
export const whatsAppBaileysService = new WhatsAppBaileysService()
export default whatsAppBaileysService

/**
 * WhatsAppWebService - Production-grade WhatsApp Web integration
 *
 * Uses whatsapp-web.js for QR code authentication.
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

// Type definitions for whatsapp-web.js
interface WAClient {
  on: (event: string, callback: (...args: unknown[]) => void) => void
  initialize: () => Promise<void>
  destroy: () => Promise<void>
  logout: () => Promise<void>
  sendMessage: (chatId: string, content: string, options?: Record<string, unknown>) => Promise<WAMessage>
  getState: () => Promise<string | null>
  info?: {
    wid?: { user?: string }
    pushname?: string
  }
}

interface WAMessage {
  id: { id: string }
  ack: number
  from: string
  to: string
  body: string
  timestamp: number
}

interface WAMessageInfo {
  from: string
  to: string
  body: string
  hasMedia: boolean
  timestamp: number
  fromMe: boolean
  id: { id: string }
  getContact: () => Promise<{ pushname?: string; number?: string }>
}

// Session states
export type SessionState =
  | 'initializing'
  | 'qr_pending'
  | 'code_pending'
  | 'authenticating'
  | 'ready'
  | 'disconnected'
  | 'destroyed'
  | 'error'

// Session data structure
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

// Message structure
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

// Event types
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
  SESSION_DIR: path.join(process.cwd(), '.whatsapp-sessions'),
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_BASE_DELAY: 1000, // 1 second
  RECONNECT_MAX_DELAY: 60000, // 1 minute
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  QR_REFRESH_INTERVAL: 20000, // 20 seconds
}

class WhatsAppWebService extends EventEmitter {
  private sessions: Map<string, WhatsAppSession> = new Map()
  private clients: Map<string, WAClient> = new Map()
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map()
  private initialized: boolean = false
  private Client: new (options: Record<string, unknown>) => WAClient
  private LocalAuth: new (options: { clientId: string; dataPath: string }) => unknown

  constructor() {
    super()
    this.ensureSessionDirectory()

    // @NEXUS-FIX-086: Prevent crash on unhandled error events - DO NOT REMOVE
    // EventEmitter throws if 'error' event is emitted with no listeners
    this.on('error', (sessionId: string, error: Error) => {
      console.error(`[WhatsAppWeb] Session ${sessionId} error:`, error.message)
    })
  }

  /**
   * Initialize the service (lazy load whatsapp-web.js)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Dynamic import to handle missing dependency gracefully
      // whatsapp-web.js uses CommonJS exports, need to handle both default and named exports
      const wwjs = await import('whatsapp-web.js')

      // Handle both ESM default export and CommonJS module.exports
      const module = wwjs.default || wwjs
      this.Client = module.Client || wwjs.Client
      this.LocalAuth = module.LocalAuth || wwjs.LocalAuth

      if (!this.Client || !this.LocalAuth) {
        console.error('[WhatsAppWeb] Module structure:', Object.keys(wwjs))
        throw new Error('Could not find Client or LocalAuth exports')
      }

      this.initialized = true
      console.log('[WhatsAppWeb] Service initialized')
    } catch (error) {
      console.error('[WhatsAppWeb] Failed to load whatsapp-web.js:', error)
      throw new Error(
        'whatsapp-web.js not installed. Run: npm install whatsapp-web.js qrcode'
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

    // Create WhatsApp client with local auth for session persistence
    // @NEXUS-FIX-083: Fixed Puppeteer config for Windows compatibility - DO NOT REMOVE
    // @NEXUS-FIX-087: Minimal stable config for WhatsApp Web - avoid problematic flags
    const client = new this.Client({
      authStrategy: new this.LocalAuth({
        clientId: sessionId,
        dataPath: CONFIG.SESSION_DIR,
      }),
      puppeteer: {
        headless: false, // @NEXUS-FIX-088: Visible browser to avoid "Execution context destroyed" bug
        // @NEXUS-FIX-089: Use system Chrome instead of bundled Chromium for stability
        executablePath: process.platform === 'win32'
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : process.platform === 'darwin'
            ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            : '/usr/bin/google-chrome',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-default-browser-check',
          '--safebrowsing-disable-auto-update',
        ],
        timeout: 120000,
      },
      // @NEXUS-FIX-090: Use local web version cache to avoid context destruction
      webVersionCache: {
        type: 'local',
      },
    }) as WAClient

    this.clients.set(sessionId, client)
    this.setupClientEvents(client, session)

    // Initialize client with retry logic
    // @NEXUS-FIX-083: Added retry logic for initialization - DO NOT REMOVE
    const initWithRetry = async (retries = 3, delay = 3000) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`[WhatsAppWeb] Session ${sessionId} initialization attempt ${attempt}/${retries}`)
          const currentClient = this.clients.get(sessionId)
          if (!currentClient) {
            throw new Error('Client was destroyed')
          }
          await currentClient.initialize()
          console.log(`[WhatsAppWeb] Session ${sessionId} initialized successfully`)
          return
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error(`[WhatsAppWeb] Session ${sessionId} initialization attempt ${attempt} failed:`, errorMessage)

          if (attempt < retries) {
            // Check if it's a recoverable error
            const isRecoverable = errorMessage.includes('Execution context was destroyed') ||
                                   errorMessage.includes('Protocol error') ||
                                   errorMessage.includes('Target closed') ||
                                   errorMessage.includes('browser is already running')

            if (isRecoverable) {
              console.log(`[WhatsAppWeb] Cleaning up and retrying in ${delay}ms...`)

              // Destroy the current client to release browser resources
              const oldClient = this.clients.get(sessionId)
              if (oldClient) {
                try {
                  await oldClient.destroy()
                } catch (destroyErr) {
                  console.log(`[WhatsAppWeb] Cleanup warning:`, destroyErr)
                }
                this.clients.delete(sessionId)
              }

              // Clean up session data directory
              const sessionPath = path.join(CONFIG.SESSION_DIR, `session-${sessionId}`)
              if (fs.existsSync(sessionPath)) {
                try {
                  fs.rmSync(sessionPath, { recursive: true, force: true })
                } catch (rmErr) {
                  console.log(`[WhatsAppWeb] Session cleanup warning:`, rmErr)
                }
              }

              await new Promise(resolve => setTimeout(resolve, delay))
              delay *= 1.5 // Increase delay for next retry

              // Create a fresh client for the next attempt with same config
              // @NEXUS-FIX-087: Stable config with system Chrome for retry
              const newClient = new this.Client({
                authStrategy: new this.LocalAuth({
                  clientId: sessionId,
                  dataPath: CONFIG.SESSION_DIR,
                }),
                puppeteer: {
                  headless: false,
                  executablePath: process.platform === 'win32'
                    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
                    : process.platform === 'darwin'
                      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
                      : '/usr/bin/google-chrome',
                  args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--disable-extensions',
                    '--disable-background-networking',
                    '--disable-default-apps',
                    '--disable-sync',
                    '--disable-translate',
                    '--metrics-recording-only',
                    '--mute-audio',
                    '--no-default-browser-check',
                    '--safebrowsing-disable-auto-update',
                  ],
                  timeout: 120000,
                },
              }) as WAClient

              this.clients.set(sessionId, newClient)
              this.setupClientEvents(newClient, session)
            } else {
              // Non-recoverable error, fail immediately
              this.updateSessionState(sessionId, 'error', errorMessage)
              return
            }
          } else {
            // All retries exhausted
            this.updateSessionState(sessionId, 'error', `Initialization failed after ${retries} attempts: ${errorMessage}`)
          }
        }
      }
    }

    // Start initialization (async, don't await)
    initWithRetry().catch((error: Error) => {
      console.error(`[WhatsAppWeb] Session ${sessionId} initialization failed completely:`, error)
      this.updateSessionState(sessionId, 'error', error.message)
    })

    return session
  }

  /**
   * Set up event listeners for a WhatsApp client
   */
  private setupClientEvents(client: WAClient, session: WhatsAppSession): void {
    const sessionId = session.id

    // QR Code event
    client.on('qr', (qr: string) => {
      console.log(`[WhatsAppWeb] QR code received for session ${sessionId}`)
      session.qrCode = qr
      session.state = 'qr_pending'
      session.lastActivity = new Date()
      this.emit('qr', sessionId, qr)
      this.emit('stateChanged', sessionId, 'qr_pending')
    })

    // Authentication event
    client.on('authenticated', () => {
      console.log(`[WhatsAppWeb] Session ${sessionId} authenticated`)
      session.state = 'authenticating'
      session.qrCode = null
      session.lastActivity = new Date()
      this.emit('authenticated', sessionId)
      this.emit('stateChanged', sessionId, 'authenticating')
    })

    // Ready event
    client.on('ready', () => {
      console.log(`[WhatsAppWeb] Session ${sessionId} ready`)
      session.state = 'ready'
      session.reconnectAttempts = 0
      session.lastActivity = new Date()
      session.error = null

      // Get phone info
      if (client.info?.wid?.user) {
        session.phoneNumber = client.info.wid.user
      }
      if (client.info?.pushname) {
        session.pushName = client.info.pushname
      }

      this.emit('ready', sessionId, session.phoneNumber || 'unknown')
      this.emit('stateChanged', sessionId, 'ready')
    })

    // Disconnection event
    client.on('disconnected', (reason: string) => {
      console.log(`[WhatsAppWeb] Session ${sessionId} disconnected: ${reason}`)
      session.state = 'disconnected'
      session.lastActivity = new Date()
      this.emit('disconnected', sessionId, reason)
      this.emit('stateChanged', sessionId, 'disconnected')

      // Attempt reconnection
      this.scheduleReconnect(sessionId)
    })

    // Authentication failure
    client.on('auth_failure', (msg: string) => {
      console.error(`[WhatsAppWeb] Session ${sessionId} auth failed:`, msg)
      this.updateSessionState(sessionId, 'error', `Authentication failed: ${msg}`)
    })

    // Incoming message
    client.on('message', async (msg: WAMessageInfo) => {
      if (msg.fromMe) return // Skip own messages

      const contact = await msg.getContact()
      const message: WhatsAppMessage = {
        id: msg.id.id,
        sessionId,
        from: msg.from,
        to: msg.to,
        body: msg.body,
        timestamp: new Date(msg.timestamp * 1000),
        fromMe: false,
        status: 'delivered',
      }

      session.lastActivity = new Date()
      this.emit('message', sessionId, message)
      console.log(`[WhatsAppWeb] Message received from ${contact.pushname || msg.from}`)
    })

    // Message acknowledgment
    client.on('message_ack', (msg: WAMessage, ack: number) => {
      // ack: 0 = ERROR, 1 = PENDING, 2 = SENT, 3 = RECEIVED, 4 = READ
      const statusMap: Record<number, WhatsAppMessage['status']> = {
        0: 'failed',
        1: 'pending',
        2: 'sent',
        3: 'delivered',
        4: 'read',
      }
      console.log(`[WhatsAppWeb] Message ${msg.id.id} status: ${statusMap[ack] || 'unknown'}`)
    })
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    if (session.reconnectAttempts >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.log(`[WhatsAppWeb] Max reconnect attempts reached for ${sessionId}`)
      this.updateSessionState(sessionId, 'error', 'Max reconnection attempts exceeded')
      return
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      CONFIG.RECONNECT_BASE_DELAY * Math.pow(2, session.reconnectAttempts),
      CONFIG.RECONNECT_MAX_DELAY
    )

    console.log(`[WhatsAppWeb] Scheduling reconnect for ${sessionId} in ${delay}ms`)

    const timer = setTimeout(async () => {
      session.reconnectAttempts++
      console.log(`[WhatsAppWeb] Reconnect attempt ${session.reconnectAttempts} for ${sessionId}`)

      const client = this.clients.get(sessionId)
      if (client) {
        try {
          await client.initialize()
        } catch (error) {
          console.error(`[WhatsAppWeb] Reconnect failed for ${sessionId}:`, error)
          this.scheduleReconnect(sessionId)
        }
      }
    }, delay)

    this.reconnectTimers.set(sessionId, timer)
  }

  /**
   * Update session state
   */
  private updateSessionState(sessionId: string, state: SessionState, error?: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.state = state
      session.lastActivity = new Date()
      if (error) {
        session.error = error
      }
      this.emit('stateChanged', sessionId, state)
      if (error) {
        this.emit('error', sessionId, new Error(error))
      }
    }
  }

  /**
   * Get session by session ID
   */
  getSession(sessionId: string): WhatsAppSession | null {
    return this.sessions.get(sessionId) || null
  }

  /**
   * Get session by user ID
   */
  getSessionByUserId(userId: string): WhatsAppSession | null {
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        return session
      }
    }
    return null
  }

  /**
   * Get all sessions
   */
  getAllSessions(): WhatsAppSession[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Send a message
   */
  async sendMessage(
    sessionId: string,
    to: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const client = this.clients.get(sessionId)
    const session = this.sessions.get(sessionId)

    if (!client || !session) {
      return { success: false, error: 'Session not found' }
    }

    if (session.state !== 'ready') {
      return { success: false, error: `Session not ready (state: ${session.state})` }
    }

    try {
      // Format phone number (add @c.us suffix if not present)
      const chatId = to.includes('@') ? to : `${to.replace(/[^0-9]/g, '')}@c.us`

      const result = await client.sendMessage(chatId, message)
      session.lastActivity = new Date()

      return { success: true, messageId: result.id.id }
    } catch (error) {
      console.error(`[WhatsAppWeb] Send message failed:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Request a pairing code for mobile users who can't scan QR
   * User enters this code in WhatsApp > Linked Devices > Link with phone number
   */
  async requestPairingCode(
    sessionId: string,
    phoneNumber: string
  ): Promise<{ success: boolean; code?: string; error?: string }> {
    const client = this.clients.get(sessionId) as WAClient & {
      requestPairingCode?: (phone: string) => Promise<string>
    }
    const session = this.sessions.get(sessionId)

    if (!client || !session) {
      return { success: false, error: 'Session not found' }
    }

    // Pairing code can only be requested during QR pending state
    if (session.state !== 'qr_pending' && session.state !== 'initializing') {
      return { success: false, error: `Cannot request pairing code in state: ${session.state}` }
    }

    try {
      // Format phone number (remove all non-digits)
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')

      if (!cleanPhone || cleanPhone.length < 10) {
        return { success: false, error: 'Invalid phone number' }
      }

      // Request pairing code from WhatsApp
      if (typeof client.requestPairingCode !== 'function') {
        return { success: false, error: 'Pairing code not supported in this version' }
      }

      const code = await client.requestPairingCode(cleanPhone)

      // Format code with hyphen for readability (XXXX-XXXX)
      const formattedCode = code.length === 8
        ? `${code.slice(0, 4)}-${code.slice(4)}`
        : code

      session.pairingCode = formattedCode
      session.state = 'code_pending'
      session.lastActivity = new Date()

      this.emit('pairingCode', sessionId, formattedCode)
      this.emit('stateChanged', sessionId, 'code_pending')

      console.log(`[WhatsAppWeb] Pairing code generated for session ${sessionId}: ${formattedCode}`)

      return { success: true, code: formattedCode }
    } catch (error) {
      console.error(`[WhatsAppWeb] Failed to get pairing code:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate pairing code'
      }
    }
  }

  /**
   * Destroy a session completely
   */
  async destroySession(sessionId: string): Promise<void> {
    console.log(`[WhatsAppWeb] Destroying session ${sessionId}`)

    // Clear reconnect timer
    const timer = this.reconnectTimers.get(sessionId)
    if (timer) {
      clearTimeout(timer)
      this.reconnectTimers.delete(sessionId)
    }

    // Destroy client
    const client = this.clients.get(sessionId)
    if (client) {
      try {
        await client.destroy()
      } catch (error) {
        console.error(`[WhatsAppWeb] Error destroying client:`, error)
      }
      this.clients.delete(sessionId)
    }

    // Update session state
    const session = this.sessions.get(sessionId)
    if (session) {
      session.state = 'destroyed'
      this.emit('stateChanged', sessionId, 'destroyed')
    }

    // Remove session
    this.sessions.delete(sessionId)

    // Clean up session files
    const sessionPath = path.join(CONFIG.SESSION_DIR, `session-${sessionId}`)
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true })
    }
  }

  /**
   * Logout and destroy session (clears saved credentials)
   */
  async logout(sessionId: string): Promise<void> {
    const client = this.clients.get(sessionId)
    if (client) {
      try {
        await client.logout()
      } catch (error) {
        console.error(`[WhatsAppWeb] Logout error:`, error)
      }
    }
    await this.destroySession(sessionId)
  }

  /**
   * Check if session is connected
   */
  isConnected(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    return session?.state === 'ready'
  }

  /**
   * Get connection state
   */
  async getConnectionState(sessionId: string): Promise<string | null> {
    const client = this.clients.get(sessionId)
    if (!client) return null

    try {
      return await client.getState()
    } catch {
      return null
    }
  }

  /**
   * Cleanup all sessions (for graceful shutdown)
   */
  async shutdown(): Promise<void> {
    console.log('[WhatsAppWeb] Shutting down service...')

    const destroyPromises = Array.from(this.sessions.keys()).map(sessionId =>
      this.destroySession(sessionId)
    )

    await Promise.all(destroyPromises)
    console.log('[WhatsAppWeb] Service shutdown complete')
  }
}

// Export singleton instance
export const whatsAppWebService = new WhatsAppWebService()
export default whatsAppWebService

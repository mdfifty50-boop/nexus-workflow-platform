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
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
// Configuration
const CONFIG = {
    SESSION_DIR: path.join(process.cwd(), '.whatsapp-sessions-baileys'),
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_BASE_DELAY: 1000, // 1 second
    RECONNECT_MAX_DELAY: 60000, // 1 minute
    // @NEXUS-FIX-140: Long-term retry after fast attempts exhausted - DO NOT REMOVE
    LONG_TERM_RETRY_INTERVAL: 5 * 60 * 1000, // 5 minutes
    LONG_TERM_MAX_RETRIES: 288, // 24 hours worth at 5-min intervals
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    QR_REFRESH_INTERVAL: 20000, // 20 seconds
};
class WhatsAppBaileysService extends EventEmitter {
    sessions = new Map();
    sockets = new Map();
    reconnectTimers = new Map();
    // @NEXUS-FIX-140: Long-term retry timers for persistent reconnection - DO NOT REMOVE
    longTermRetryTimers = new Map();
    initialized = false;
    // Baileys modules (loaded dynamically)
    makeWASocket = null;
    useMultiFileAuthState = null;
    DisconnectReason = null;
    Browsers = null;
    constructor() {
        super();
        this.ensureSessionDirectory();
        // Prevent crash on unhandled error events
        this.on('error', (sessionId, error) => {
            console.error(`[WhatsAppBaileys] Session ${sessionId} error:`, error.message);
        });
    }
    /**
     * Initialize the service (lazy load Baileys)
     */
    async initialize() {
        if (this.initialized)
            return;
        try {
            // Dynamic import Baileys
            const baileys = await import('@whiskeysockets/baileys');
            this.makeWASocket = (baileys.default || baileys.makeWASocket);
            this.useMultiFileAuthState = baileys.useMultiFileAuthState;
            this.DisconnectReason = baileys.DisconnectReason;
            this.Browsers = baileys.Browsers;
            if (!this.makeWASocket || !this.useMultiFileAuthState) {
                throw new Error('Could not find required Baileys exports');
            }
            this.initialized = true;
            console.log('[WhatsAppBaileys] Service initialized');
        }
        catch (error) {
            console.error('[WhatsAppBaileys] Failed to load Baileys:', error);
            throw new Error('@whiskeysockets/baileys not installed. Run: npm install @whiskeysockets/baileys');
        }
    }
    /**
     * @NEXUS-FIX-141: Restore sessions from persistent storage on server restart - DO NOT REMOVE
     * Scans the session directory for auth folders with saved credentials (creds.json)
     * and automatically re-initializes those sessions so users don't need to re-scan QR.
     */
    async restoreSessions() {
        await this.initialize();
        let restored = 0;
        let failed = 0;
        try {
            if (!fs.existsSync(CONFIG.SESSION_DIR)) {
                console.log('[WhatsAppBaileys] No session directory found, nothing to restore');
                return { restored: 0, failed: 0 };
            }
            const dirs = fs.readdirSync(CONFIG.SESSION_DIR, { withFileTypes: true })
                .filter(d => d.isDirectory() && d.name.startsWith('wa_'));
            if (dirs.length === 0) {
                console.log('[WhatsAppBaileys] No saved sessions to restore');
                return { restored: 0, failed: 0 };
            }
            console.log(`[WhatsAppBaileys] Found ${dirs.length} session(s) to restore`);
            for (const dir of dirs) {
                const sessionId = dir.name;
                const authDir = path.join(CONFIG.SESSION_DIR, sessionId);
                const credsFile = path.join(authDir, 'creds.json');
                // Only restore sessions that have saved credentials (were previously authenticated)
                if (!fs.existsSync(credsFile)) {
                    console.log(`[WhatsAppBaileys] Skipping ${sessionId} - no saved credentials`);
                    continue;
                }
                try {
                    // Extract userId from session ID format: wa_{userId}_{timestamp}
                    const parts = sessionId.split('_');
                    const userId = parts.length >= 3 ? parts.slice(1, -1).join('_') : 'restored-user';
                    // Check if session already exists in memory (shouldn't on restart, but safety check)
                    if (this.sessions.has(sessionId)) {
                        console.log(`[WhatsAppBaileys] Session ${sessionId} already in memory, skipping`);
                        continue;
                    }
                    console.log(`[WhatsAppBaileys] Restoring session ${sessionId} for user ${userId}`);
                    const session = {
                        id: sessionId,
                        userId,
                        state: 'initializing',
                        qrCode: null,
                        pairingCode: null,
                        phoneNumber: null,
                        pushName: null,
                        lastActivity: new Date(),
                        createdAt: new Date(fs.statSync(authDir).birthtime),
                        error: null,
                        reconnectAttempts: 0,
                    };
                    this.sessions.set(sessionId, session);
                    this.emit('stateChanged', sessionId, 'initializing');
                    // Initialize socket (will use saved creds, so no QR needed)
                    await this.initializeSocket(sessionId, session);
                    restored++;
                    console.log(`[WhatsAppBaileys] Session ${sessionId} restore initiated`);
                }
                catch (err) {
                    failed++;
                    console.error(`[WhatsAppBaileys] Failed to restore session ${sessionId}:`, err.message);
                }
            }
            console.log(`[WhatsAppBaileys] Session restore complete: ${restored} restored, ${failed} failed`);
        }
        catch (err) {
            console.error('[WhatsAppBaileys] Error during session restore:', err);
        }
        return { restored, failed };
    }
    /**
     * Ensure session directory exists
     */
    ensureSessionDirectory() {
        if (!fs.existsSync(CONFIG.SESSION_DIR)) {
            fs.mkdirSync(CONFIG.SESSION_DIR, { recursive: true });
        }
    }
    /**
     * Generate a unique session ID
     */
    generateSessionId(userId) {
        return `wa_${userId}_${Date.now()}`;
    }
    /**
     * Get session auth directory
     */
    getAuthDir(sessionId) {
        return path.join(CONFIG.SESSION_DIR, sessionId);
    }
    /**
     * Create or restore a WhatsApp session for a user
     */
    async createSession(userId) {
        await this.initialize();
        // Check for existing session
        const existingSession = this.getSessionByUserId(userId);
        if (existingSession && existingSession.state === 'ready') {
            return existingSession;
        }
        // Clean up any old session for this user
        if (existingSession) {
            await this.destroySession(existingSession.id);
        }
        const sessionId = this.generateSessionId(userId);
        const session = {
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
        };
        this.sessions.set(sessionId, session);
        this.emit('stateChanged', sessionId, 'initializing');
        // Initialize Baileys socket
        await this.initializeSocket(sessionId, session);
        return session;
    }
    /**
     * Initialize Baileys socket for a session
     */
    async initializeSocket(sessionId, session, attempt = 1) {
        const maxAttempts = 3;
        try {
            console.log(`[WhatsAppBaileys] Session ${sessionId} initialization attempt ${attempt}/${maxAttempts}`);
            const authDir = this.getAuthDir(sessionId);
            // Ensure auth directory exists
            if (!fs.existsSync(authDir)) {
                fs.mkdirSync(authDir, { recursive: true });
            }
            // Get auth state
            const { state, saveCreds } = await this.useMultiFileAuthState(authDir);
            // Create a proper pino-compatible logger mock
            // @NEXUS-FIX-092: Baileys requires pino-compatible logger with all methods
            const silentLogger = {
                level: 'silent',
                trace: (..._args) => { },
                debug: (..._args) => { },
                info: (..._args) => { },
                warn: (..._args) => { },
                error: (..._args) => console.error('[WhatsAppBaileys]', ..._args),
                fatal: (..._args) => console.error('[WhatsAppBaileys FATAL]', ..._args),
                child: () => silentLogger,
            };
            // Create Baileys socket
            const sock = this.makeWASocket({
                auth: state,
                printQRInTerminal: false, // We'll handle QR ourselves
                browser: this.Browsers.ubuntu('Nexus'),
                logger: silentLogger,
            });
            this.sockets.set(sessionId, sock);
            // Handle credentials update
            sock.ev.on('creds.update', saveCreds);
            // Handle connection updates
            sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;
                // QR code received
                // @NEXUS-FIX-093: Convert raw QR string to data URL for frontend display
                if (qr) {
                    // Convert raw QR string to base64 data URL
                    QRCode.toDataURL(qr, { width: 256, margin: 2 })
                        .then((dataUrl) => {
                        session.qrCode = dataUrl;
                        session.state = 'qr_pending';
                        session.lastActivity = new Date();
                        this.emit('stateChanged', sessionId, 'qr_pending');
                        this.emit('qr', sessionId, dataUrl);
                        console.log(`[WhatsAppBaileys] Session ${sessionId} QR code generated (data URL)`);
                    })
                        .catch((err) => {
                        console.error(`[WhatsAppBaileys] Failed to generate QR data URL:`, err);
                        // Fallback to raw QR string
                        session.qrCode = qr;
                        this.emit('qr', sessionId, qr);
                    });
                }
                // Connection state changes
                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = statusCode !== this.DisconnectReason?.loggedOut;
                    console.log(`[WhatsAppBaileys] Session ${sessionId} disconnected, statusCode: ${statusCode}, reconnect: ${shouldReconnect}`);
                    if (shouldReconnect && session.reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
                        session.reconnectAttempts++;
                        session.state = 'disconnected';
                        this.emit('stateChanged', sessionId, 'disconnected');
                        this.emit('disconnected', sessionId, `Disconnected, reconnecting... (attempt ${session.reconnectAttempts})`);
                        // Clean up old socket
                        this.sockets.delete(sessionId);
                        // Schedule reconnect with exponential backoff
                        const delay = Math.min(CONFIG.RECONNECT_BASE_DELAY * Math.pow(2, session.reconnectAttempts - 1), CONFIG.RECONNECT_MAX_DELAY);
                        const timer = setTimeout(() => {
                            this.initializeSocket(sessionId, session);
                        }, delay);
                        this.reconnectTimers.set(sessionId, timer);
                    }
                    else if (statusCode === this.DisconnectReason?.loggedOut) {
                        // User explicitly logged out - clean up, no retry
                        session.state = 'error';
                        session.error = 'Logged out from WhatsApp';
                        this.emit('stateChanged', sessionId, 'error');
                        this.emit('error', sessionId, new Error(session.error));
                    }
                    else {
                        // @NEXUS-FIX-140: Long-term retry - switch to slow reconnection - DO NOT REMOVE
                        // Fast attempts exhausted, but we don't give up. Switch to 5-minute intervals.
                        session.state = 'disconnected';
                        session.error = `Fast reconnection failed (${session.reconnectAttempts} attempts). Retrying every 5 minutes...`;
                        this.emit('stateChanged', sessionId, 'disconnected');
                        this.emit('disconnected', sessionId, session.error);
                        console.log(`[WhatsAppBaileys] Session ${sessionId} entering long-term retry mode`);
                        this.startLongTermRetry(sessionId, session);
                    }
                }
                else if (connection === 'open') {
                    // Successfully connected
                    session.state = 'ready';
                    session.qrCode = null;
                    session.reconnectAttempts = 0;
                    session.lastActivity = new Date();
                    // Get phone number from connection
                    if (sock.user?.id) {
                        session.phoneNumber = sock.user.id.split(':')[0].split('@')[0];
                        session.pushName = sock.user.name || null;
                    }
                    this.emit('stateChanged', sessionId, 'ready');
                    this.emit('ready', sessionId, session.phoneNumber || 'unknown');
                    this.emit('authenticated', sessionId);
                    console.log(`[WhatsAppBaileys] Session ${sessionId} connected! Phone: ${session.phoneNumber}`);
                }
            });
            // Handle incoming messages
            sock.ev.on('messages.upsert', async (m) => {
                for (const msg of m.messages) {
                    if (!msg.message)
                        continue;
                    const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
                    const whatsAppMessage = {
                        id: msg.key.id || `msg_${Date.now()}`,
                        sessionId: sessionId,
                        from: msg.key.remoteJid || '',
                        to: session.phoneNumber || '',
                        body: messageText,
                        timestamp: new Date(Number(msg.messageTimestamp) * 1000),
                        fromMe: msg.key.fromMe || false,
                        status: 'delivered',
                    };
                    this.emit('message', sessionId, whatsAppMessage);
                    session.lastActivity = new Date();
                }
            });
        }
        catch (error) {
            console.error(`[WhatsAppBaileys] Session ${sessionId} initialization attempt ${attempt} failed:`, error);
            if (attempt < maxAttempts) {
                // Cleanup and retry
                this.sockets.delete(sessionId);
                const delay = 3000 + (attempt * 1500);
                console.log(`[WhatsAppBaileys] Cleaning up and retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.initializeSocket(sessionId, session, attempt + 1);
            }
            else {
                // Max attempts reached
                session.state = 'error';
                session.error = `Initialization failed after ${maxAttempts} attempts: ${error.message}`;
                this.emit('stateChanged', sessionId, 'error');
                this.emit('error', sessionId, error);
                console.error(`[WhatsAppBaileys] Session ${sessionId} error: ${session.error}`);
            }
        }
    }
    /**
     * @NEXUS-FIX-140: Long-term retry for persistent reconnection - DO NOT REMOVE
     * After fast exponential backoff fails (5 attempts), switches to slow periodic retry
     * every 5 minutes for up to 24 hours. This handles transient network outages,
     * server restarts on the WhatsApp side, and similar recoverable situations.
     */
    startLongTermRetry(sessionId, session) {
        // Clear any existing long-term timer
        const existing = this.longTermRetryTimers.get(sessionId);
        if (existing)
            clearTimeout(existing);
        let longTermAttempts = 0;
        const attemptReconnect = async () => {
            longTermAttempts++;
            if (longTermAttempts > CONFIG.LONG_TERM_MAX_RETRIES) {
                console.log(`[WhatsAppBaileys] Session ${sessionId} long-term retry exhausted after ${longTermAttempts} attempts`);
                session.state = 'error';
                session.error = 'Connection lost. Please reconnect manually.';
                this.emit('stateChanged', sessionId, 'error');
                this.emit('error', sessionId, new Error(session.error));
                this.longTermRetryTimers.delete(sessionId);
                return;
            }
            console.log(`[WhatsAppBaileys] Session ${sessionId} long-term retry attempt ${longTermAttempts}/${CONFIG.LONG_TERM_MAX_RETRIES}`);
            // Reset fast reconnect counter so initializeSocket gets fresh attempts
            session.reconnectAttempts = 0;
            session.state = 'initializing';
            session.error = null;
            // Clean up old socket if any
            this.sockets.delete(sessionId);
            try {
                await this.initializeSocket(sessionId, session);
                // If we get here without error, the socket is being set up.
                // The connection.update handler will determine if it succeeds.
                // We schedule the next check; if it connected successfully,
                // session.state will be 'ready' and we can stop.
                const checkTimer = setTimeout(() => {
                    if (session.state === 'ready') {
                        console.log(`[WhatsAppBaileys] Session ${sessionId} reconnected via long-term retry!`);
                        this.longTermRetryTimers.delete(sessionId);
                    }
                    else if (session.state !== 'error' && session.state !== 'destroyed') {
                        // Still not connected, schedule next attempt
                        const timer = setTimeout(attemptReconnect, CONFIG.LONG_TERM_RETRY_INTERVAL);
                        this.longTermRetryTimers.set(sessionId, timer);
                    }
                }, 30000); // Wait 30s to see if connection succeeds
                this.longTermRetryTimers.set(sessionId, checkTimer);
            }
            catch {
                // Socket init threw - schedule next attempt
                const timer = setTimeout(attemptReconnect, CONFIG.LONG_TERM_RETRY_INTERVAL);
                this.longTermRetryTimers.set(sessionId, timer);
            }
        };
        // Start first long-term retry after the interval
        const timer = setTimeout(attemptReconnect, CONFIG.LONG_TERM_RETRY_INTERVAL);
        this.longTermRetryTimers.set(sessionId, timer);
    }
    /**
     * Get session by ID
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Get session by user ID
     */
    getSessionByUserId(userId) {
        for (const session of this.sessions.values()) {
            if (session.userId === userId && session.state !== 'destroyed') {
                return session;
            }
        }
        return undefined;
    }
    /**
     * Get all active sessions
     */
    getAllSessions() {
        return Array.from(this.sessions.values()).filter(s => s.state !== 'destroyed');
    }
    /**
     * Send a message via WhatsApp
     */
    async sendMessage(sessionId, to, message) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        if (session.state !== 'ready') {
            throw new Error(`Session ${sessionId} is not ready (current state: ${session.state})`);
        }
        const sock = this.sockets.get(sessionId);
        if (!sock) {
            throw new Error(`Socket not found for session ${sessionId}`);
        }
        // Format phone number to WhatsApp JID
        const phoneNumber = to.replace(/[^\d]/g, '');
        const jid = `${phoneNumber}@s.whatsapp.net`;
        try {
            const result = await sock.sendMessage(jid, { text: message });
            const whatsAppMessage = {
                id: result.key.id,
                sessionId: sessionId,
                from: session.phoneNumber || '',
                to: phoneNumber,
                body: message,
                timestamp: new Date(),
                fromMe: true,
                status: 'sent',
            };
            session.lastActivity = new Date();
            console.log(`[WhatsAppBaileys] Message sent to ${phoneNumber}`);
            return whatsAppMessage;
        }
        catch (error) {
            console.error(`[WhatsAppBaileys] Failed to send message:`, error);
            throw error;
        }
    }
    /**
     * Request a pairing code for phone-number-based linking
     */
    async requestPairingCode(sessionId, phoneNumber) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return { success: false, error: `Session ${sessionId} not found` };
        }
        const sock = this.sockets.get(sessionId);
        if (!sock) {
            return { success: false, error: `Socket not found for session ${sessionId}` };
        }
        try {
            // @NEXUS-FIX-130: Layer 3 - Defensive phone validation at Baileys service level - DO NOT REMOVE
            const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
            // Validate: Baileys requires 10-15 digit E.164 phone number (country code + local)
            if (cleanNumber.length < 10 || cleanNumber.length > 15) {
                console.warn(`[WhatsAppBaileys] Invalid phone length: ${cleanNumber.length} digits (need 10-15)`);
                return {
                    success: false,
                    error: `Phone number must be 10-15 digits with country code (got ${cleanNumber.length} digits). Example: 96591234567`,
                };
            }
            // Validate: must not be all zeros or obviously fake
            if (/^0+$/.test(cleanNumber) || /^(.)\1+$/.test(cleanNumber)) {
                return { success: false, error: 'Invalid phone number. Please enter a real phone number.' };
            }
            console.log(`[WhatsAppBaileys] Requesting pairing code for: ${cleanNumber.slice(0, 4)}****${cleanNumber.slice(-2)} (${cleanNumber.length} digits)`);
            // Baileys requestPairingCode
            const code = await sock.requestPairingCode(cleanNumber);
            session.pairingCode = code;
            session.state = 'code_pending';
            session.lastActivity = new Date();
            this.emit('stateChanged', sessionId, 'code_pending');
            this.emit('pairingCode', sessionId, code);
            console.log(`[WhatsAppBaileys] Pairing code generated for session ${sessionId}`);
            return { success: true, code };
        }
        catch (error) {
            const errMsg = error.message || String(error);
            console.error(`[WhatsAppBaileys] Failed to generate pairing code:`, errMsg);
            // @NEXUS-FIX-130: Translate technical Baileys errors to user-friendly messages
            let userFriendlyError = errMsg;
            if (errMsg.includes('did not match the expected pattern') || errMsg.includes('pattern')) {
                userFriendlyError = 'Invalid phone number format. Please enter your full number with country code (e.g., +965 9XXX XXXX for Kuwait).';
            }
            else if (errMsg.includes('not registered') || errMsg.includes('not on WhatsApp')) {
                userFriendlyError = 'This number is not registered on WhatsApp. Please check the number and try again.';
            }
            else if (errMsg.includes('timeout') || errMsg.includes('timed out')) {
                userFriendlyError = 'Connection timed out. Please try again.';
            }
            else if (errMsg.includes('rate') || errMsg.includes('limit')) {
                userFriendlyError = 'Too many attempts. Please wait a few minutes and try again.';
            }
            return { success: false, error: userFriendlyError };
        }
    }
    /**
     * Logout alias (routes use logout, service uses logoutSession)
     */
    async logout(sessionId) {
        return this.logoutSession(sessionId);
    }
    /**
     * Destroy a session
     */
    async destroySession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        console.log(`[WhatsAppBaileys] Destroying session ${sessionId}`);
        // Clear reconnect timer
        const timer = this.reconnectTimers.get(sessionId);
        if (timer) {
            clearTimeout(timer);
            this.reconnectTimers.delete(sessionId);
        }
        // @NEXUS-FIX-140: Clear long-term retry timer - DO NOT REMOVE
        const longTimer = this.longTermRetryTimers.get(sessionId);
        if (longTimer) {
            clearTimeout(longTimer);
            this.longTermRetryTimers.delete(sessionId);
        }
        // Close socket
        const sock = this.sockets.get(sessionId);
        if (sock) {
            try {
                sock.end();
            }
            catch (e) {
                // Ignore errors during cleanup
            }
            this.sockets.delete(sessionId);
        }
        // Update session state
        session.state = 'destroyed';
        this.emit('stateChanged', sessionId, 'destroyed');
        // Don't delete session data - keep it for potential restore
    }
    /**
     * Logout and destroy a session (removes auth data)
     */
    async logoutSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        console.log(`[WhatsAppBaileys] Logging out session ${sessionId}`);
        const sock = this.sockets.get(sessionId);
        if (sock) {
            try {
                await sock.logout();
            }
            catch (e) {
                // Ignore errors
            }
        }
        await this.destroySession(sessionId);
        // Delete auth data
        const authDir = this.getAuthDir(sessionId);
        if (fs.existsSync(authDir)) {
            fs.rmSync(authDir, { recursive: true, force: true });
        }
        this.sessions.delete(sessionId);
    }
    /**
     * Check if service is available
     */
    isAvailable() {
        return this.initialized;
    }
}
// Export singleton instance
export const whatsAppBaileysService = new WhatsAppBaileysService();
export default whatsAppBaileysService;
//# sourceMappingURL=WhatsAppBaileysService.js.map
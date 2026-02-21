/**
 * AiSensy WhatsApp Business API Service
 *
 * Provides legitimate WhatsApp Business automation via AiSensy BSP.
 *
 * Features:
 * - Embedded Signup for WABA creation (no existing account needed)
 * - Send template messages via API
 * - Receive incoming messages via webhook
 * - Template management and sync
 * - Multi-user session management
 *
 * Pricing: $0 platform fee + Meta per-message fees only
 *
 * Architecture:
 * - Nexus = Brain (all workflow logic)
 * - AiSensy = Dumb Pipe (send/receive API only)
 */
import { EventEmitter } from 'events';
import crypto from 'crypto';
// In-memory storage (replace with database in production)
const accounts = new Map();
const templates = new Map();
const apiKeys = new Map(); // userId -> apiKey (encrypted)
// Encryption for API keys
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'nexus-default-key-change-in-production!';
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(ENCRYPTION_KEY).digest(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}
function decrypt(encryptedText) {
    try {
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(ENCRYPTION_KEY).digest(), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch {
        return '';
    }
}
class AiSensyService extends EventEmitter {
    baseUrl = 'https://backend.aisensy.com';
    messageHandlers = [];
    constructor() {
        super();
        console.log('📱 AiSensy WhatsApp Business Service initialized');
    }
    // ============================================
    // Account Management
    // ============================================
    /**
     * Get Embedded Signup URL for WABA creation
     *
     * This allows users to create a WhatsApp Business Account directly
     * without needing an existing WABA.
     *
     * Flow:
     * 1. User clicks "Connect WhatsApp Business"
     * 2. Opens AiSensy Embedded Signup popup
     * 3. User follows Meta's onboarding flow
     * 4. On success, webhook notifies us with WABA details
     * 5. User can now send/receive messages
     */
    getEmbeddedSignupUrl(userId, redirectUrl) {
        // AiSensy Embedded Signup URL
        // In production, this would be configured with your AiSensy partner details
        const partnerId = process.env.AISENSY_PARTNER_ID || '';
        const state = Buffer.from(JSON.stringify({
            userId,
            timestamp: Date.now(),
            nonce: crypto.randomBytes(16).toString('hex')
        })).toString('base64url');
        // AiSensy uses a similar embedded signup flow to Meta
        // The exact URL format may vary based on AiSensy's implementation
        const params = new URLSearchParams({
            partner_id: partnerId,
            redirect_uri: redirectUrl,
            state,
            response_type: 'code'
        });
        return `https://app.aisensy.com/embedded-signup?${params.toString()}`;
    }
    /**
     * Complete Embedded Signup after OAuth callback
     */
    async completeEmbeddedSignup(userId, code, state) {
        try {
            // Verify state
            const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
            if (stateData.userId !== userId) {
                return { success: false, error: 'Invalid state parameter' };
            }
            // Exchange code for API credentials with AiSensy
            // This is a simplified version - actual implementation depends on AiSensy's API
            const response = await fetch(`${this.baseUrl}/api/v1/embedded-signup/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Partner-Id': process.env.AISENSY_PARTNER_ID || ''
                },
                body: JSON.stringify({ code, state })
            });
            if (!response.ok) {
                const error = await response.text();
                return { success: false, error: `Signup completion failed: ${error}` };
            }
            const data = await response.json();
            // Store API key securely
            apiKeys.set(userId, encrypt(data.api_key));
            // Create account record
            const account = {
                id: `waba_${userId}_${Date.now()}`,
                userId,
                phoneNumber: data.phone_number,
                displayName: data.display_name,
                status: 'active',
                wabaId: data.waba_id,
                businessId: data.business_id,
                createdAt: new Date(),
                lastActivity: new Date()
            };
            accounts.set(userId, account);
            this.emit('account_connected', userId, account);
            console.log(`📱 AiSensy: WABA connected for user ${userId} (${account.phoneNumber})`);
            return { success: true, account };
        }
        catch (error) {
            console.error('AiSensy Embedded Signup error:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Register existing AiSensy API key
     * For users who already have an AiSensy account
     */
    async registerApiKey(userId, apiKey, phoneNumber, displayName) {
        try {
            // Verify API key is valid by making a test request
            const isValid = await this.verifyApiKey(apiKey);
            if (!isValid) {
                return { success: false, error: 'Invalid API key' };
            }
            // Store API key securely
            apiKeys.set(userId, encrypt(apiKey));
            // Create account record
            const account = {
                id: `waba_${userId}_${Date.now()}`,
                userId,
                phoneNumber,
                displayName: displayName || phoneNumber,
                status: 'active',
                createdAt: new Date(),
                lastActivity: new Date()
            };
            accounts.set(userId, account);
            this.emit('account_connected', userId, account);
            console.log(`📱 AiSensy: API key registered for user ${userId} (${phoneNumber})`);
            return { success: true, account };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Verify an API key is valid
     */
    async verifyApiKey(apiKey) {
        try {
            // Make a simple API call to verify the key
            const response = await fetch(`${this.baseUrl}/campaign/t1/api/v2/account`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    /**
     * Get account for a user
     */
    getAccount(userId) {
        return accounts.get(userId) || null;
    }
    /**
     * Check if user is connected
     */
    isConnected(userId) {
        const account = accounts.get(userId);
        return account?.status === 'active';
    }
    /**
     * Disconnect account
     */
    async disconnectAccount(userId) {
        const account = accounts.get(userId);
        if (account) {
            account.status = 'disconnected';
            accounts.set(userId, account);
        }
        apiKeys.delete(userId);
        this.emit('account_disconnected', userId);
        console.log(`📱 AiSensy: Account disconnected for user ${userId}`);
    }
    // ============================================
    // Message Sending
    // ============================================
    /**
     * Send a template message
     *
     * AiSensy API requires template messages for business-initiated conversations.
     * Template messages must be pre-approved by Meta.
     */
    async sendMessage(userId, params) {
        const account = accounts.get(userId);
        if (!account || account.status !== 'active') {
            return { success: false, error: 'WhatsApp Business not connected' };
        }
        const encryptedApiKey = apiKeys.get(userId);
        if (!encryptedApiKey) {
            return { success: false, error: 'API key not found' };
        }
        const apiKey = decrypt(encryptedApiKey);
        if (!apiKey) {
            return { success: false, error: 'Failed to decrypt API key' };
        }
        try {
            // Format phone number (remove +, spaces, dashes)
            const formattedNumber = params.to.replace(/[\s\-\+\(\)]/g, '');
            // Build request body
            const requestBody = {
                apiKey,
                campaignName: params.templateName,
                destination: formattedNumber,
                userName: params.templateParams?.[0] || 'Customer', // First param often is name
                source: 'nexus',
                templateParams: params.templateParams || [],
                tags: params.tags || [],
                attributes: params.attributes || {}
            };
            // Add media if provided
            if (params.mediaUrl) {
                requestBody.media = {
                    url: params.mediaUrl,
                    filename: params.mediaFilename || 'attachment'
                };
            }
            const response = await fetch(`${this.baseUrl}/campaign/t1/api/v2`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            const data = await response.json();
            if (response.ok && data.success) {
                // Update last activity
                account.lastActivity = new Date();
                accounts.set(userId, account);
                return {
                    success: true,
                    messageId: data.message_id,
                    timestamp: new Date()
                };
            }
            else {
                return {
                    success: false,
                    error: data.error || `API returned ${response.status}`
                };
            }
        }
        catch (error) {
            console.error(`AiSensy send message error for ${userId}:`, error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Send a quick reply (for session messages within 24h window)
     */
    async sendQuickReply(userId, to, message) {
        const account = accounts.get(userId);
        if (!account || account.status !== 'active') {
            return { success: false, error: 'WhatsApp Business not connected' };
        }
        const encryptedApiKey = apiKeys.get(userId);
        if (!encryptedApiKey) {
            return { success: false, error: 'API key not found' };
        }
        const apiKey = decrypt(encryptedApiKey);
        if (!apiKey) {
            return { success: false, error: 'Failed to decrypt API key' };
        }
        try {
            const formattedNumber = to.replace(/[\s\-\+\(\)]/g, '');
            // Session message endpoint (within 24h of user message)
            const response = await fetch(`${this.baseUrl}/campaign/t1/api/v2/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiKey,
                    destination: formattedNumber,
                    message,
                    source: 'nexus'
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                account.lastActivity = new Date();
                accounts.set(userId, account);
                return {
                    success: true,
                    messageId: data.message_id,
                    timestamp: new Date()
                };
            }
            else {
                return {
                    success: false,
                    error: data.error || `API returned ${response.status}`
                };
            }
        }
        catch (error) {
            console.error(`AiSensy quick reply error for ${userId}:`, error);
            return { success: false, error: error.message };
        }
    }
    // ============================================
    // Template Management
    // ============================================
    /**
     * Get available templates for a user
     */
    async getTemplates(userId) {
        // Check cache first
        const cached = templates.get(userId);
        if (cached && cached.length > 0) {
            return cached;
        }
        const encryptedApiKey = apiKeys.get(userId);
        if (!encryptedApiKey) {
            return [];
        }
        const apiKey = decrypt(encryptedApiKey);
        if (!apiKey) {
            return [];
        }
        try {
            const response = await fetch(`${this.baseUrl}/campaign/t1/api/v2/templates`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                console.error('Failed to fetch templates:', response.status);
                return [];
            }
            const data = await response.json();
            const userTemplates = data.templates || [];
            // Cache templates
            templates.set(userId, userTemplates);
            return userTemplates;
        }
        catch (error) {
            console.error('Error fetching templates:', error);
            return [];
        }
    }
    /**
     * Refresh templates cache
     */
    async refreshTemplates(userId) {
        templates.delete(userId);
        return this.getTemplates(userId);
    }
    // ============================================
    // Webhook Handling
    // ============================================
    /**
     * Process incoming webhook event from AiSensy
     */
    processWebhook(payload, signature) {
        // Verify webhook signature if configured
        const webhookSecret = process.env.AISENSY_WEBHOOK_SECRET;
        if (webhookSecret && signature) {
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(payload))
                .digest('hex');
            if (signature !== expectedSignature) {
                console.error('Invalid webhook signature');
                return null;
            }
        }
        try {
            const eventType = payload.type;
            const messageId = payload.message_id || payload.messageId;
            const timestamp = payload.timestamp
                ? new Date(payload.timestamp)
                : new Date();
            // Handle incoming message
            if (eventType === 'message_received' || eventType === 'incoming') {
                const incomingMessage = {
                    messageId,
                    from: payload.from || payload.sender,
                    fromName: payload.from_name || payload.senderName,
                    body: payload.body || payload.message || payload.text,
                    timestamp,
                    type: payload.message_type || 'text',
                    mediaUrl: payload.media_url || payload.mediaUrl,
                    replyTo: payload.reply_to || payload.context?.message_id,
                    isBusinessInitiated: false
                };
                // Find the user this message is for
                // In production, this would be looked up from the WABA/phone number
                const userId = this.findUserByPhone(payload.to || payload.recipient);
                if (userId) {
                    // Update last activity
                    const account = accounts.get(userId);
                    if (account) {
                        account.lastActivity = new Date();
                        accounts.set(userId, account);
                    }
                    // Notify handlers
                    this.messageHandlers.forEach(handler => {
                        try {
                            handler(userId, incomingMessage);
                        }
                        catch (error) {
                            console.error('Message handler error:', error);
                        }
                    });
                    this.emit('message', userId, incomingMessage);
                }
                return {
                    type: 'message_received',
                    messageId,
                    timestamp,
                    data: payload
                };
            }
            // Handle delivery/read receipts
            if (eventType === 'message_delivered' || eventType === 'delivered') {
                this.emit('delivered', messageId);
                return { type: 'message_delivered', messageId, timestamp, data: payload };
            }
            if (eventType === 'message_read' || eventType === 'read') {
                this.emit('read', messageId);
                return { type: 'message_read', messageId, timestamp, data: payload };
            }
            if (eventType === 'message_failed' || eventType === 'failed') {
                this.emit('failed', messageId, payload.error);
                return { type: 'message_failed', messageId, timestamp, data: payload };
            }
            return null;
        }
        catch (error) {
            console.error('Webhook processing error:', error);
            return null;
        }
    }
    /**
     * Find user by phone number
     */
    findUserByPhone(phoneNumber) {
        if (!phoneNumber)
            return null;
        const normalized = phoneNumber.replace(/[\s\-\+\(\)]/g, '');
        for (const [userId, account] of accounts) {
            const accountPhone = account.phoneNumber.replace(/[\s\-\+\(\)]/g, '');
            if (accountPhone === normalized) {
                return userId;
            }
        }
        return null;
    }
    /**
     * Register a message handler
     */
    onMessage(handler) {
        this.messageHandlers.push(handler);
    }
    /**
     * Get all accounts (for admin)
     */
    getAllAccounts() {
        return Array.from(accounts.values());
    }
    // ============================================
    // Session Management (for 24h window tracking)
    // ============================================
    /**
     * Check if we're within 24h session window with a contact
     * This determines if we can send free-form messages or need templates
     */
    isInSessionWindow(userId, contactNumber) {
        // In production, track last message received time per contact
        // For now, assume we need templates (safer default)
        return false;
    }
}
// Export singleton
export const aiSensyService = new AiSensyService();
export default aiSensyService;
//# sourceMappingURL=AiSensyService.js.map
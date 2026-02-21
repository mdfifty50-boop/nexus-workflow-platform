/**
 * CampaignService - WhatsApp Broadcast Campaign Management
 *
 * Manages broadcast campaigns: create, schedule, execute, track.
 * Uses WhatsAppComposioService.sendTemplate() for message delivery.
 * Implements rate limiting to comply with WhatsApp Business API limits.
 *
 * In production, this should be backed by a database (Supabase).
 */
import { whatsAppComposioService, } from './WhatsAppComposioService.js';
import { contactService } from './ContactService.js';
// =============================================================================
// CONSTANTS
// =============================================================================
// WhatsApp Business API rate limits
const RATE_LIMIT_PER_SECOND = 50; // Max messages/second
const BATCH_SIZE = 25; // Messages per batch
const BATCH_DELAY_MS = 600; // Delay between batches (slightly > 1s/50 = 20ms per msg)
const SCHEDULER_INTERVAL_MS = 60 * 1000; // Check every minute
const CAMPAIGN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
// =============================================================================
// SERVICE
// =============================================================================
class CampaignServiceClass {
    campaigns = new Map();
    schedulerTimer = null;
    executingCampaigns = new Set();
    constructor() {
        this.startScheduler();
    }
    // ===========================================================================
    // CAMPAIGN CRUD
    // ===========================================================================
    /**
     * Create a new broadcast campaign
     */
    createCampaign(data) {
        const id = this.generateId();
        const campaign = {
            id,
            name: data.name,
            templateName: data.templateName,
            templateLanguage: data.templateLanguage || 'en',
            recipients: data.recipients,
            variables: data.perRecipientVariables || {},
            globalVariables: data.variables || {},
            status: data.scheduleTime ? 'scheduled' : 'draft',
            stats: {
                target: data.recipients.length,
                sent: 0,
                delivered: 0,
                read: 0,
                failed: 0,
            },
            recipientResults: new Map(),
            scheduledAt: data.scheduleTime ? new Date(data.scheduleTime) : null,
            sentAt: null,
            completedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Initialize recipient results
        for (const phone of data.recipients) {
            campaign.recipientResults.set(phone, {
                phone,
                status: 'pending',
            });
        }
        this.campaigns.set(id, campaign);
        console.log(`[CampaignService] Campaign created: ${id} (${data.name}) - ${data.recipients.length} recipients`);
        return campaign;
    }
    /**
     * Get a campaign by ID
     */
    getCampaign(id) {
        return this.campaigns.get(id) || null;
    }
    /**
     * List all campaigns
     */
    listCampaigns() {
        return Array.from(this.campaigns.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    /**
     * Delete a campaign (only if not currently sending)
     */
    deleteCampaign(id) {
        const campaign = this.campaigns.get(id);
        if (!campaign)
            return false;
        if (campaign.status === 'sending') {
            console.warn(`[CampaignService] Cannot delete campaign ${id} - currently sending`);
            return false;
        }
        this.campaigns.delete(id);
        console.log(`[CampaignService] Campaign deleted: ${id}`);
        return true;
    }
    // ===========================================================================
    // SCHEDULING
    // ===========================================================================
    /**
     * Schedule a campaign for later execution
     */
    scheduleCampaign(id, scheduledAt) {
        const campaign = this.campaigns.get(id);
        if (!campaign)
            return null;
        if (campaign.status === 'sending' || campaign.status === 'completed') {
            console.warn(`[CampaignService] Cannot schedule campaign ${id} - status: ${campaign.status}`);
            return null;
        }
        const scheduleDate = typeof scheduledAt === 'string' ? new Date(scheduledAt) : scheduledAt;
        if (scheduleDate <= new Date()) {
            console.warn(`[CampaignService] Schedule time is in the past for campaign ${id}`);
            return null;
        }
        campaign.scheduledAt = scheduleDate;
        campaign.status = 'scheduled';
        campaign.updatedAt = new Date();
        console.log(`[CampaignService] Campaign ${id} scheduled for ${scheduleDate.toISOString()}`);
        return campaign;
    }
    // ===========================================================================
    // EXECUTION
    // ===========================================================================
    /**
     * Execute a campaign immediately (async - does not block)
     *
     * Returns the campaign with status 'sending'. The actual message dispatch
     * happens in the background with rate limiting and batch processing.
     */
    async executeCampaign(id) {
        const campaign = this.campaigns.get(id);
        if (!campaign)
            return null;
        if (this.executingCampaigns.has(id)) {
            console.warn(`[CampaignService] Campaign ${id} is already executing`);
            return campaign;
        }
        if (campaign.status === 'completed') {
            console.warn(`[CampaignService] Campaign ${id} already completed`);
            return campaign;
        }
        // Mark as sending
        campaign.status = 'sending';
        campaign.sentAt = new Date();
        campaign.updatedAt = new Date();
        this.executingCampaigns.add(id);
        console.log(`[CampaignService] Starting campaign execution: ${id} (${campaign.name}) - ${campaign.recipients.length} recipients`);
        // Execute in background (non-blocking)
        this.executeInBackground(id).catch(error => {
            console.error(`[CampaignService] Background execution error for ${id}:`, error);
            campaign.status = 'failed';
            campaign.updatedAt = new Date();
            this.executingCampaigns.delete(id);
        });
        return campaign;
    }
    /**
     * Background execution with rate limiting and batch processing
     */
    async executeInBackground(id) {
        const campaign = this.campaigns.get(id);
        if (!campaign)
            return;
        const pendingRecipients = campaign.recipients.filter(phone => {
            const result = campaign.recipientResults.get(phone);
            return result?.status === 'pending';
        });
        // Process in batches
        for (let i = 0; i < pendingRecipients.length; i += BATCH_SIZE) {
            // Check if campaign was cancelled/deleted
            if (!this.campaigns.has(id) || campaign.status === 'failed') {
                console.log(`[CampaignService] Campaign ${id} cancelled during execution`);
                break;
            }
            const batch = pendingRecipients.slice(i, i + BATCH_SIZE);
            // Send batch in parallel (within rate limits)
            const batchPromises = batch.map(phone => this.sendToRecipient(campaign, phone));
            await Promise.allSettled(batchPromises);
            // Update stats after each batch
            this.updateStats(campaign);
            // Rate limit delay between batches
            if (i + BATCH_SIZE < pendingRecipients.length) {
                await this.delay(BATCH_DELAY_MS);
            }
        }
        // Final stats update
        this.updateStats(campaign);
        // Mark as completed
        if (campaign.status === 'sending') {
            campaign.status = campaign.stats.failed === campaign.stats.target ? 'failed' : 'completed';
            campaign.completedAt = new Date();
        }
        campaign.updatedAt = new Date();
        this.executingCampaigns.delete(id);
        console.log(`[CampaignService] Campaign ${id} execution complete:`, {
            sent: campaign.stats.sent,
            failed: campaign.stats.failed,
            total: campaign.stats.target,
        });
    }
    /**
     * Send template message to a single recipient
     */
    async sendToRecipient(campaign, phone) {
        const recipientResult = campaign.recipientResults.get(phone);
        if (!recipientResult)
            return;
        try {
            // Build template components from variables
            const perPhoneVars = campaign.variables[phone] || {};
            const mergedVars = { ...campaign.globalVariables, ...perPhoneVars };
            const components = [];
            const varEntries = Object.entries(mergedVars);
            if (varEntries.length > 0) {
                components.push({
                    type: 'body',
                    parameters: varEntries.map(([, value]) => ({
                        type: 'text',
                        text: value,
                    })),
                });
            }
            const templateParams = {
                to: phone,
                templateName: campaign.templateName,
                language: campaign.templateLanguage,
                components: components.length > 0 ? components : undefined,
            };
            const result = await whatsAppComposioService.sendTemplate(templateParams);
            if (result.success) {
                recipientResult.status = 'sent';
                recipientResult.messageId = result.messageId;
                recipientResult.sentAt = new Date();
                // Update contact's lastMessageAt
                contactService.updateLastMessageAt(phone);
            }
            else {
                recipientResult.status = 'failed';
                recipientResult.error = result.error || 'Send failed';
            }
        }
        catch (error) {
            recipientResult.status = 'failed';
            recipientResult.error = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[CampaignService] Failed to send to ${phone}:`, error);
        }
    }
    // ===========================================================================
    // STATS
    // ===========================================================================
    /**
     * Get campaign statistics
     */
    getCampaignStats(id) {
        const campaign = this.campaigns.get(id);
        if (!campaign)
            return null;
        this.updateStats(campaign);
        return { ...campaign.stats };
    }
    /**
     * Recalculate campaign stats from recipient results
     */
    updateStats(campaign) {
        let sent = 0;
        let delivered = 0;
        let read = 0;
        let failed = 0;
        for (const result of campaign.recipientResults.values()) {
            switch (result.status) {
                case 'sent':
                    sent++;
                    break;
                case 'delivered':
                    sent++;
                    delivered++;
                    break;
                case 'read':
                    sent++;
                    delivered++;
                    read++;
                    break;
                case 'failed':
                    failed++;
                    break;
            }
        }
        campaign.stats = {
            target: campaign.recipients.length,
            sent,
            delivered,
            read,
            failed,
        };
    }
    /**
     * Update a recipient's delivery status (called by webhook handler)
     */
    updateRecipientStatus(messageId, status) {
        // Search across all active campaigns for this messageId
        for (const campaign of this.campaigns.values()) {
            for (const result of campaign.recipientResults.values()) {
                if (result.messageId === messageId) {
                    result.status = status;
                    this.updateStats(campaign);
                    return;
                }
            }
        }
    }
    // ===========================================================================
    // SCHEDULER
    // ===========================================================================
    /**
     * Start the background scheduler that checks for scheduled campaigns
     */
    startScheduler() {
        if (this.schedulerTimer)
            return;
        this.schedulerTimer = setInterval(() => {
            this.checkScheduledCampaigns();
            this.cleanupOldCampaigns();
        }, SCHEDULER_INTERVAL_MS);
        console.log('[CampaignService] Scheduler started (checking every 60s)');
    }
    /**
     * Check for campaigns that need to be executed
     */
    checkScheduledCampaigns() {
        const now = new Date();
        for (const campaign of this.campaigns.values()) {
            if (campaign.status === 'scheduled' &&
                campaign.scheduledAt &&
                campaign.scheduledAt <= now &&
                !this.executingCampaigns.has(campaign.id)) {
                console.log(`[CampaignService] Auto-executing scheduled campaign: ${campaign.id} (${campaign.name})`);
                this.executeCampaign(campaign.id).catch(error => {
                    console.error(`[CampaignService] Failed to auto-execute campaign ${campaign.id}:`, error);
                });
            }
        }
    }
    /**
     * Clean up completed campaigns older than 30 days
     */
    cleanupOldCampaigns() {
        const cutoff = Date.now() - CAMPAIGN_TTL_MS;
        let cleaned = 0;
        for (const [id, campaign] of this.campaigns) {
            if ((campaign.status === 'completed' || campaign.status === 'failed') &&
                campaign.createdAt.getTime() < cutoff) {
                this.campaigns.delete(id);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            console.log(`[CampaignService] Cleaned up ${cleaned} old campaigns`);
        }
    }
    /**
     * Stop the scheduler (for cleanup)
     */
    stopScheduler() {
        if (this.schedulerTimer) {
            clearInterval(this.schedulerTimer);
            this.schedulerTimer = null;
            console.log('[CampaignService] Scheduler stopped');
        }
    }
    // ===========================================================================
    // UTILITIES
    // ===========================================================================
    /**
     * Generate a unique campaign ID
     */
    generateId() {
        return `camp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    }
    /**
     * Promisified delay for rate limiting
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Serialize a campaign for API response (converts Maps to plain objects)
     */
    serializeCampaign(campaign) {
        return {
            id: campaign.id,
            name: campaign.name,
            templateName: campaign.templateName,
            templateLanguage: campaign.templateLanguage,
            status: campaign.status,
            targetCount: campaign.stats.target,
            sentCount: campaign.stats.sent,
            deliveredCount: campaign.stats.delivered,
            readCount: campaign.stats.read,
            failedCount: campaign.stats.failed,
            recipientCount: campaign.recipients.length,
            scheduledFor: campaign.scheduledAt?.toISOString() || null,
            sentAt: campaign.sentAt?.toISOString() || null,
            completedAt: campaign.completedAt?.toISOString() || null,
            createdAt: campaign.createdAt.toISOString(),
            updatedAt: campaign.updatedAt.toISOString(),
        };
    }
    /**
     * Serialize campaign with detailed recipient results
     */
    serializeCampaignDetails(campaign) {
        const base = this.serializeCampaign(campaign);
        const recipients = [];
        for (const result of campaign.recipientResults.values()) {
            recipients.push({
                phone: result.phone,
                status: result.status,
                messageId: result.messageId,
                error: result.error,
                sentAt: result.sentAt?.toISOString() || null,
            });
        }
        return {
            ...base,
            recipients,
            globalVariables: campaign.globalVariables,
        };
    }
}
// Singleton export
export const campaignService = new CampaignServiceClass();
export default campaignService;
//# sourceMappingURL=CampaignService.js.map
/**
 * Notification Service for Nexus E-commerce
 * Core service for sending notifications across multiple channels
 */

import type {
  NotificationChannel,
  NotificationPayload,
  NotificationPreferences,
  DeliveryRecord,
  RateLimitConfig,
  RateLimitState,
  NotificationResult,
  BatchNotificationRequest,
  ChannelProviderConfig,
  NotificationEvent,
  DeliveryStatusType,
  SupportedLanguage,
} from './notification-types';
import {
  NotificationChannels,
  DeliveryStatus,
  SupportedLanguages,
} from './notification-types';
import {
  getTemplate,
  renderTemplate,
  validateTemplateVariables,
} from './notification-templates';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Default rate limit configurations per channel
 */
const defaultRateLimits: Record<NotificationChannel, RateLimitConfig> = {
  [NotificationChannels.EMAIL]: {
    channel: NotificationChannels.EMAIL,
    maxPerMinute: 10,
    maxPerHour: 100,
    maxPerDay: 500,
    burstLimit: 20,
  },
  [NotificationChannels.SMS]: {
    channel: NotificationChannels.SMS,
    maxPerMinute: 5,
    maxPerHour: 30,
    maxPerDay: 100,
    burstLimit: 10,
  },
  [NotificationChannels.PUSH]: {
    channel: NotificationChannels.PUSH,
    maxPerMinute: 20,
    maxPerHour: 200,
    maxPerDay: 1000,
    burstLimit: 50,
  },
  [NotificationChannels.SLACK]: {
    channel: NotificationChannels.SLACK,
    maxPerMinute: 30,
    maxPerHour: 500,
    maxPerDay: 2000,
    burstLimit: 50,
  },
  [NotificationChannels.WHATSAPP]: {
    channel: NotificationChannels.WHATSAPP,
    maxPerMinute: 5,
    maxPerHour: 50,
    maxPerDay: 200,
    burstLimit: 10,
  },
};

/**
 * Channel provider interface for sending notifications
 */
interface ChannelProvider {
  send(
    recipientAddress: string,
    subject: string,
    body: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * Mock channel providers for development
 */
const mockProviders: Record<NotificationChannel, ChannelProvider> = {
  [NotificationChannels.EMAIL]: {
    async send(recipientAddress, subject, _body) {
      void _body // Body included in full email sending
      console.log(`[EMAIL] To: ${recipientAddress}, Subject: ${subject}`);
      return { success: true, messageId: generateId() };
    },
  },
  [NotificationChannels.SMS]: {
    async send(recipientAddress, _subject, body) {
      console.log(`[SMS] To: ${recipientAddress}, Message: ${body.substring(0, 160)}`);
      return { success: true, messageId: generateId() };
    },
  },
  [NotificationChannels.PUSH]: {
    async send(recipientAddress, subject, _body) {
      void _body // Body included in full push notification
      console.log(`[PUSH] To: ${recipientAddress}, Title: ${subject}`);
      return { success: true, messageId: generateId() };
    },
  },
  [NotificationChannels.SLACK]: {
    async send(recipientAddress, _subject, body) {
      console.log(`[SLACK] Channel: ${recipientAddress}, Message: ${body}`);
      return { success: true, messageId: generateId() };
    },
  },
  [NotificationChannels.WHATSAPP]: {
    async send(recipientAddress, _subject, body) {
      console.log(`[WHATSAPP] To: ${recipientAddress}, Message: ${body}`);
      return { success: true, messageId: generateId() };
    },
  },
};

/**
 * NotificationService class
 * Main service for sending and managing notifications
 */
export class NotificationService {
  private rateLimitStates: Map<string, RateLimitState> = new Map();
  private deliveryRecords: Map<string, DeliveryRecord> = new Map();
  private events: NotificationEvent[] = [];
  private providers: Map<NotificationChannel, ChannelProvider> = new Map();
  private providerConfigs: Map<NotificationChannel, ChannelProviderConfig> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();
  private rateLimitConfigs: Map<NotificationChannel, RateLimitConfig> = new Map();
  private scheduledNotifications: Map<string, { payload: NotificationPayload; timer: NodeJS.Timeout }> = new Map();

  constructor() {
    // Initialize with mock providers
    Object.entries(mockProviders).forEach(([channel, provider]) => {
      this.providers.set(channel as NotificationChannel, provider);
    });

    // Initialize default rate limits
    Object.entries(defaultRateLimits).forEach(([channel, config]) => {
      this.rateLimitConfigs.set(channel as NotificationChannel, config);
    });
  }

  /**
   * Configure a channel provider
   */
  configureProvider(config: ChannelProviderConfig, provider: ChannelProvider): void {
    this.providerConfigs.set(config.channel, config);
    if (config.isEnabled) {
      this.providers.set(config.channel, provider);
    }
  }

  /**
   * Set user notification preferences
   */
  setUserPreferences(preferences: NotificationPreferences): void {
    this.userPreferences.set(preferences.userId, preferences);
  }

  /**
   * Get user notification preferences
   */
  getUserPreferences(userId: string): NotificationPreferences | undefined {
    return this.userPreferences.get(userId);
  }

  /**
   * Set custom rate limit for a channel
   */
  setRateLimit(config: RateLimitConfig): void {
    this.rateLimitConfigs.set(config.channel, config);
  }

  /**
   * Check if notification should be rate limited
   */
  private checkRateLimit(channel: NotificationChannel, recipientId: string): { allowed: boolean; reason?: string } {
    const config = this.rateLimitConfigs.get(channel) || defaultRateLimits[channel];
    const stateKey = `${channel}:${recipientId}`;
    let state = this.rateLimitStates.get(stateKey);
    const now = new Date();

    // Initialize state if not exists
    if (!state) {
      state = {
        channel,
        recipientId,
        minuteCount: 0,
        hourCount: 0,
        dayCount: 0,
        lastReset: {
          minute: now,
          hour: now,
          day: now,
        },
      };
      this.rateLimitStates.set(stateKey, state);
    }

    // Reset counters if time windows have passed
    const minuteDiff = (now.getTime() - state.lastReset.minute.getTime()) / 1000 / 60;
    const hourDiff = (now.getTime() - state.lastReset.hour.getTime()) / 1000 / 60 / 60;
    const dayDiff = (now.getTime() - state.lastReset.day.getTime()) / 1000 / 60 / 60 / 24;

    if (minuteDiff >= 1) {
      state.minuteCount = 0;
      state.lastReset.minute = now;
    }
    if (hourDiff >= 1) {
      state.hourCount = 0;
      state.lastReset.hour = now;
    }
    if (dayDiff >= 1) {
      state.dayCount = 0;
      state.lastReset.day = now;
    }

    // Check limits
    if (state.minuteCount >= config.maxPerMinute) {
      return { allowed: false, reason: 'Rate limit exceeded: max per minute' };
    }
    if (state.hourCount >= config.maxPerHour) {
      return { allowed: false, reason: 'Rate limit exceeded: max per hour' };
    }
    if (state.dayCount >= config.maxPerDay) {
      return { allowed: false, reason: 'Rate limit exceeded: max per day' };
    }

    return { allowed: true };
  }

  /**
   * Increment rate limit counters
   */
  private incrementRateLimit(channel: NotificationChannel, recipientId: string): void {
    const stateKey = `${channel}:${recipientId}`;
    const state = this.rateLimitStates.get(stateKey);
    if (state) {
      state.minuteCount++;
      state.hourCount++;
      state.dayCount++;
    }
  }

  /**
   * Check user preferences for notification
   */
  private checkUserPreferences(
    userId: string,
    channel: NotificationChannel,
    _templateId: string
  ): { allowed: boolean; reason?: string; address?: string; language?: SupportedLanguage } {
    void _templateId // Reserved for template-specific preference filtering
    const prefs = this.userPreferences.get(userId);

    if (!prefs) {
      return { allowed: true }; // Allow if no preferences set
    }

    const channelPrefs = prefs.channels[channel];
    if (!channelPrefs?.enabled) {
      return { allowed: false, reason: `Channel ${channel} disabled by user` };
    }

    // Check quiet hours
    if (prefs.quietHours?.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (currentTime >= prefs.quietHours.start && currentTime <= prefs.quietHours.end) {
        return { allowed: false, reason: 'User is in quiet hours' };
      }
    }

    return {
      allowed: true,
      address: channelPrefs.address,
      language: prefs.language,
    };
  }

  /**
   * Create a delivery record
   */
  private createDeliveryRecord(
    notificationId: string,
    channel: NotificationChannel,
    recipientId: string,
    recipientAddress: string,
    templateId: string
  ): DeliveryRecord {
    const record: DeliveryRecord = {
      id: generateId(),
      notificationId,
      channel,
      recipientId,
      recipientAddress,
      templateId,
      status: DeliveryStatus.PENDING,
      retryCount: 0,
      maxRetries: 3,
    };
    this.deliveryRecords.set(record.id, record);
    return record;
  }

  /**
   * Update delivery record status
   */
  private updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatusType,
    additionalData?: Partial<DeliveryRecord>
  ): void {
    const record = this.deliveryRecords.get(deliveryId);
    if (record) {
      record.status = status;
      if (additionalData) {
        Object.assign(record, additionalData);
      }

      // Log event
      this.logEvent({
        id: generateId(),
        type: status === DeliveryStatus.DELIVERED ? 'delivered' :
              status === DeliveryStatus.FAILED ? 'failed' :
              status === DeliveryStatus.SENT ? 'sent' : 'sent',
        notificationId: record.notificationId,
        deliveryId: record.id,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Log notification event
   */
  private logEvent(event: NotificationEvent): void {
    this.events.push(event);
  }

  /**
   * Send a single notification
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const notificationId = generateId();
    const now = new Date();

    // Get template
    const template = getTemplate(payload.templateId);
    if (!template) {
      return {
        success: false,
        status: DeliveryStatus.FAILED,
        error: `Template not found: ${payload.templateId}`,
        timestamp: now,
      };
    }

    // Validate template variables
    const validation = validateTemplateVariables(template, payload.variables);
    if (!validation.valid) {
      return {
        success: false,
        status: DeliveryStatus.FAILED,
        error: `Missing variables: ${validation.missing.join(', ')}`,
        timestamp: now,
      };
    }

    // Check if template supports the requested channel
    if (!template.channels.includes(payload.channel)) {
      return {
        success: false,
        status: DeliveryStatus.FAILED,
        error: `Template does not support channel: ${payload.channel}`,
        timestamp: now,
      };
    }

    // Check user preferences
    const prefsCheck = this.checkUserPreferences(
      payload.recipientId,
      payload.channel,
      payload.templateId
    );
    if (!prefsCheck.allowed) {
      return {
        success: false,
        status: DeliveryStatus.FAILED,
        error: prefsCheck.reason,
        timestamp: now,
      };
    }

    // Check rate limit
    const rateLimitCheck = this.checkRateLimit(payload.channel, payload.recipientId);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        status: DeliveryStatus.RATE_LIMITED,
        error: rateLimitCheck.reason,
        timestamp: now,
      };
    }

    // Get recipient address
    const recipientAddress = prefsCheck.address || payload.recipientId;
    const language = prefsCheck.language || SupportedLanguages.EN;

    // Render template
    const { subject, body } = renderTemplate(template, language, payload.variables);

    // Create delivery record
    const delivery = this.createDeliveryRecord(
      notificationId,
      payload.channel,
      payload.recipientId,
      recipientAddress,
      payload.templateId
    );

    // Get provider
    const provider = this.providers.get(payload.channel);
    if (!provider) {
      this.updateDeliveryStatus(delivery.id, DeliveryStatus.FAILED, {
        failedAt: now,
        failureReason: `No provider configured for channel: ${payload.channel}`,
      });
      return {
        success: false,
        deliveryId: delivery.id,
        status: DeliveryStatus.FAILED,
        error: `No provider configured for channel: ${payload.channel}`,
        timestamp: now,
      };
    }

    // Send notification
    try {
      this.updateDeliveryStatus(delivery.id, DeliveryStatus.QUEUED);

      const result = await provider.send(recipientAddress, subject, body, payload.metadata);

      if (result.success) {
        this.updateDeliveryStatus(delivery.id, DeliveryStatus.SENT, {
          sentAt: now,
        });
        this.incrementRateLimit(payload.channel, payload.recipientId);

        return {
          success: true,
          deliveryId: delivery.id,
          status: DeliveryStatus.SENT,
          timestamp: now,
        };
      } else {
        this.updateDeliveryStatus(delivery.id, DeliveryStatus.FAILED, {
          failedAt: now,
          failureReason: result.error,
        });

        return {
          success: false,
          deliveryId: delivery.id,
          status: DeliveryStatus.FAILED,
          error: result.error,
          timestamp: now,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateDeliveryStatus(delivery.id, DeliveryStatus.FAILED, {
        failedAt: now,
        failureReason: errorMessage,
      });

      return {
        success: false,
        deliveryId: delivery.id,
        status: DeliveryStatus.FAILED,
        error: errorMessage,
        timestamp: now,
      };
    }
  }

  /**
   * Send batch notifications
   */
  async sendBatch(request: BatchNotificationRequest): Promise<Map<string, NotificationResult>> {
    const results = new Map<string, NotificationResult>();

    const promises = request.recipients.map(async (recipient) => {
      const payload: NotificationPayload = {
        templateId: request.templateId,
        recipientId: recipient.id,
        channel: request.channel,
        variables: recipient.variables || {},
        priority: request.priority,
        scheduledAt: request.scheduledAt,
      };

      const result = await this.send(payload);
      results.set(recipient.id, result);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Schedule a notification for later delivery
   */
  scheduleNotification(payload: NotificationPayload, deliveryTime: Date): string {
    const scheduleId = generateId();
    const delay = deliveryTime.getTime() - Date.now();

    if (delay <= 0) {
      // Send immediately if time has passed
      this.send(payload);
      return scheduleId;
    }

    const timer = setTimeout(() => {
      this.send(payload);
      this.scheduledNotifications.delete(scheduleId);
    }, delay);

    this.scheduledNotifications.set(scheduleId, { payload, timer });
    return scheduleId;
  }

  /**
   * Cancel a scheduled notification
   */
  cancelScheduledNotification(scheduleId: string): boolean {
    const scheduled = this.scheduledNotifications.get(scheduleId);
    if (scheduled) {
      clearTimeout(scheduled.timer);
      this.scheduledNotifications.delete(scheduleId);
      return true;
    }
    return false;
  }

  /**
   * Get delivery record by ID
   */
  getDeliveryRecord(deliveryId: string): DeliveryRecord | undefined {
    return this.deliveryRecords.get(deliveryId);
  }

  /**
   * Get all delivery records for a recipient
   */
  getDeliveryRecordsByRecipient(recipientId: string): DeliveryRecord[] {
    return Array.from(this.deliveryRecords.values()).filter(
      (record) => record.recipientId === recipientId
    );
  }

  /**
   * Get delivery statistics
   */
  getDeliveryStats(): {
    total: number;
    byStatus: Record<DeliveryStatusType, number>;
    byChannel: Record<NotificationChannel, number>;
  } {
    const records = Array.from(this.deliveryRecords.values());

    const byStatus = Object.values(DeliveryStatus).reduce((acc, status) => {
      acc[status] = records.filter((r) => r.status === status).length;
      return acc;
    }, {} as Record<DeliveryStatusType, number>);

    const byChannel = Object.values(NotificationChannels).reduce((acc, channel) => {
      acc[channel] = records.filter((r) => r.channel === channel).length;
      return acc;
    }, {} as Record<NotificationChannel, number>);

    return {
      total: records.length,
      byStatus,
      byChannel,
    };
  }

  /**
   * Get notification events
   */
  getEvents(filter?: { type?: string; startDate?: Date; endDate?: Date }): NotificationEvent[] {
    let events = this.events;

    if (filter?.type) {
      events = events.filter((e) => e.type === filter.type);
    }
    if (filter?.startDate) {
      events = events.filter((e) => e.timestamp >= filter.startDate!);
    }
    if (filter?.endDate) {
      events = events.filter((e) => e.timestamp <= filter.endDate!);
    }

    return events;
  }

  /**
   * Retry a failed notification
   */
  async retryDelivery(deliveryId: string): Promise<NotificationResult> {
    const record = this.deliveryRecords.get(deliveryId);

    if (!record) {
      return {
        success: false,
        status: DeliveryStatus.FAILED,
        error: 'Delivery record not found',
        timestamp: new Date(),
      };
    }

    if (record.status !== DeliveryStatus.FAILED) {
      return {
        success: false,
        status: record.status,
        error: 'Can only retry failed deliveries',
        timestamp: new Date(),
      };
    }

    if (record.retryCount >= record.maxRetries) {
      return {
        success: false,
        status: DeliveryStatus.FAILED,
        error: 'Max retries exceeded',
        timestamp: new Date(),
      };
    }

    record.retryCount++;
    record.status = DeliveryStatus.PENDING;

    // Re-send using the original template and recipient
    const template = getTemplate(record.templateId);
    if (!template) {
      return {
        success: false,
        status: DeliveryStatus.FAILED,
        error: 'Template not found',
        timestamp: new Date(),
      };
    }

    const provider = this.providers.get(record.channel);
    if (!provider) {
      return {
        success: false,
        status: DeliveryStatus.FAILED,
        error: 'Provider not found',
        timestamp: new Date(),
      };
    }

    try {
      const prefs = this.userPreferences.get(record.recipientId);
      const language = prefs?.language || SupportedLanguages.EN;
      const { subject, body } = renderTemplate(template, language, {});

      const result = await provider.send(record.recipientAddress, subject, body);

      if (result.success) {
        this.updateDeliveryStatus(deliveryId, DeliveryStatus.SENT, {
          sentAt: new Date(),
        });
        return {
          success: true,
          deliveryId,
          status: DeliveryStatus.SENT,
          timestamp: new Date(),
        };
      } else {
        this.updateDeliveryStatus(deliveryId, DeliveryStatus.FAILED, {
          failedAt: new Date(),
          failureReason: result.error,
        });
        return {
          success: false,
          deliveryId,
          status: DeliveryStatus.FAILED,
          error: result.error,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateDeliveryStatus(deliveryId, DeliveryStatus.FAILED, {
        failedAt: new Date(),
        failureReason: errorMessage,
      });
      return {
        success: false,
        deliveryId,
        status: DeliveryStatus.FAILED,
        error: errorMessage,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Clear all data (for testing purposes)
   */
  clear(): void {
    this.rateLimitStates.clear();
    this.deliveryRecords.clear();
    this.events = [];
    this.scheduledNotifications.forEach((scheduled) => {
      clearTimeout(scheduled.timer);
    });
    this.scheduledNotifications.clear();
  }
}

/**
 * Default notification service instance
 */
export const notificationService = new NotificationService();

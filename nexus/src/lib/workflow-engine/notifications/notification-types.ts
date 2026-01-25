/**
 * Notification Types for Nexus E-commerce
 * Defines all TypeScript types for the notification system
 */

// Notification channels supported by the system
export const NotificationChannels = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  SLACK: 'slack',
  WHATSAPP: 'whatsapp',
} as const;

export type NotificationChannel = typeof NotificationChannels[keyof typeof NotificationChannels];

// Delivery status tracking
export const DeliveryStatus = {
  PENDING: 'pending',
  QUEUED: 'queued',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  BOUNCED: 'bounced',
  RATE_LIMITED: 'rate_limited',
} as const;

export type DeliveryStatusType = typeof DeliveryStatus[keyof typeof DeliveryStatus];

// Notification priority levels
export const NotificationPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type NotificationPriorityType = typeof NotificationPriority[keyof typeof NotificationPriority];

// Supported languages for templates
export const SupportedLanguages = {
  EN: 'en',
  AR: 'ar',
} as const;

export type SupportedLanguage = typeof SupportedLanguages[keyof typeof SupportedLanguages];

// Template categories
export const TemplateCategory = {
  ORDER: 'order',
  SHIPPING: 'shipping',
  MARKETING: 'marketing',
  TRANSACTIONAL: 'transactional',
  ALERT: 'alert',
} as const;

export type TemplateCategoryType = typeof TemplateCategory[keyof typeof TemplateCategory];

/**
 * Notification template interface
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  category: TemplateCategoryType;
  channels: NotificationChannel[];
  subject: Record<SupportedLanguage, string>;
  body: Record<SupportedLanguage, string>;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  userId: string;
  channels: {
    [K in NotificationChannel]: {
      enabled: boolean;
      address?: string; // email, phone, webhook URL, etc.
    };
  };
  language: SupportedLanguage;
  timezone: string;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
  };
  categories: {
    [K in TemplateCategoryType]: boolean;
  };
}

/**
 * Notification payload for sending
 */
export interface NotificationPayload {
  templateId: string;
  recipientId: string;
  channel: NotificationChannel;
  variables: Record<string, string | number | boolean>;
  priority?: NotificationPriorityType;
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Delivery record for tracking
 */
export interface DeliveryRecord {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  recipientId: string;
  recipientAddress: string;
  templateId: string;
  status: DeliveryStatusType;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, unknown>;
}

/**
 * Rate limit configuration per channel
 */
export interface RateLimitConfig {
  channel: NotificationChannel;
  maxPerMinute: number;
  maxPerHour: number;
  maxPerDay: number;
  burstLimit: number;
}

/**
 * Rate limit state for tracking
 */
export interface RateLimitState {
  channel: NotificationChannel;
  recipientId: string;
  minuteCount: number;
  hourCount: number;
  dayCount: number;
  lastReset: {
    minute: Date;
    hour: Date;
    day: Date;
  };
}

/**
 * Notification event for logging/analytics
 */
export interface NotificationEvent {
  id: string;
  type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced';
  notificationId: string;
  deliveryId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Channel provider configuration
 */
export interface ChannelProviderConfig {
  channel: NotificationChannel;
  provider: string;
  apiKey?: string;
  apiSecret?: string;
  endpoint?: string;
  webhookUrl?: string;
  isEnabled: boolean;
  settings?: Record<string, unknown>;
}

/**
 * Batch notification request
 */
export interface BatchNotificationRequest {
  templateId: string;
  recipients: Array<{
    id: string;
    variables?: Record<string, string | number | boolean>;
  }>;
  channel: NotificationChannel;
  priority?: NotificationPriorityType;
  scheduledAt?: Date;
}

/**
 * Notification result
 */
export interface NotificationResult {
  success: boolean;
  deliveryId?: string;
  status: DeliveryStatusType;
  error?: string;
  timestamp: Date;
}

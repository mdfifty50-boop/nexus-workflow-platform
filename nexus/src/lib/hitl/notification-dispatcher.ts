/**
 * Notification Dispatcher for Human-in-the-Loop Workflows
 *
 * Handles sending notifications to stakeholders about approval decisions,
 * assignments, escalations, and deadlines through multiple channels.
 */

import type { ApprovalDecision, ApprovalRequest } from './hitl-types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Notification channels
 */
export const NOTIFICATION_CHANNEL = {
  EMAIL: 'email',
  IN_APP: 'in_app',
  WEBHOOK: 'webhook',
  SLACK: 'slack',
} as const;

export type NotificationChannel =
  (typeof NOTIFICATION_CHANNEL)[keyof typeof NOTIFICATION_CHANNEL];

/**
 * Notification priority levels
 */
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type NotificationPriority =
  (typeof NOTIFICATION_PRIORITY)[keyof typeof NOTIFICATION_PRIORITY];

/**
 * Notification types
 */
export const NOTIFICATION_TYPE = {
  DECISION_MADE: 'decision_made',
  ASSIGNMENT: 'assignment',
  ESCALATION: 'escalation',
  DEADLINE_WARNING: 'deadline_warning',
  DEADLINE_EXPIRED: 'deadline_expired',
  REQUEST_CREATED: 'request_created',
  REQUEST_CANCELLED: 'request_cancelled',
  COMMENT_ADDED: 'comment_added',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

/**
 * Template for notifications
 */
export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject: string;
  bodyTemplate: string;
  htmlTemplate?: string;
  variables: string[];
  priority: NotificationPriority;
  enabled: boolean;
}

/**
 * Notification payload
 */
export interface NotificationPayload {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  recipientName?: string;
  subject: string;
  body: string;
  htmlBody?: string;
  priority: NotificationPriority;
  metadata: Record<string, unknown>;
  createdAt: string;
  sentAt?: string;
  status: NotificationStatus;
  retryCount: number;
  error?: string;
}

/**
 * Notification status
 */
export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  SKIPPED: 'skipped',
} as const;

export type NotificationStatus =
  (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  secret?: string;
}

/**
 * Slack configuration
 */
export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

/**
 * Email configuration
 */
export interface EmailConfig {
  fromAddress: string;
  fromName: string;
  replyTo?: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  };
}

/**
 * Notification preferences for a user
 */
export interface NotificationPreferences {
  userId: string;
  channels: {
    email: boolean;
    inApp: boolean;
    webhook: boolean;
    slack: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  frequency?: {
    immediate: boolean;
    digest: boolean;
    digestFrequency?: 'daily' | 'weekly';
  };
  typePreferences?: Record<NotificationType, NotificationChannel[]>;
}

/**
 * Dispatch result
 */
export interface DispatchResult {
  success: boolean;
  notificationId: string;
  channel: NotificationChannel;
  recipient: string;
  timestamp: string;
  error?: string;
}

// ============================================================================
// Default Templates
// ============================================================================

const defaultTemplates: Map<string, NotificationTemplate> = new Map([
  // Decision Made - Email
  [
    'decision_email',
    {
      id: 'decision_email',
      type: 'decision_made',
      channel: 'email',
      subject: '[{{workflowName}}] Approval Request {{decision}}',
      bodyTemplate: `Your approval request "{{requestTitle}}" has been {{decision}} by {{reviewerName}}.

Request Details:
- Request ID: {{requestId}}
- Workflow: {{workflowName}}
- Decision: {{decision}}
- Reviewer: {{reviewerName}}
- Decision Date: {{decidedAt}}

{{#if comments}}
Reviewer Comments:
{{comments}}
{{/if}}

You can view the full details in the Nexus dashboard.`,
      variables: [
        'workflowName',
        'requestTitle',
        'decision',
        'reviewerName',
        'requestId',
        'decidedAt',
        'comments',
      ],
      priority: 'normal',
      enabled: true,
    },
  ],
  // Decision Made - In-App
  [
    'decision_in_app',
    {
      id: 'decision_in_app',
      type: 'decision_made',
      channel: 'in_app',
      subject: 'Request {{decision}}: {{requestTitle}}',
      bodyTemplate: '{{reviewerName}} {{decision}} your request "{{requestTitle}}"',
      variables: ['decision', 'requestTitle', 'reviewerName'],
      priority: 'normal',
      enabled: true,
    },
  ],
  // Assignment - Email
  [
    'assignment_email',
    {
      id: 'assignment_email',
      type: 'assignment',
      channel: 'email',
      subject: '[Action Required] New Approval Request: {{requestTitle}}',
      bodyTemplate: `You have been assigned a new approval request that requires your attention.

Request Details:
- Title: {{requestTitle}}
- Workflow: {{workflowName}}
- Priority: {{priority}}
- Requester: {{requesterName}}
- Due Date: {{dueDate}}

Please review and take action before the due date.

View request: {{requestUrl}}`,
      variables: [
        'requestTitle',
        'workflowName',
        'priority',
        'requesterName',
        'dueDate',
        'requestUrl',
      ],
      priority: 'high',
      enabled: true,
    },
  ],
  // Escalation - Email
  [
    'escalation_email',
    {
      id: 'escalation_email',
      type: 'escalation',
      channel: 'email',
      subject: '[Escalated] Approval Request Requires Your Attention',
      bodyTemplate: `An approval request has been escalated to you.

Request Details:
- Title: {{requestTitle}}
- Workflow: {{workflowName}}
- Original Assignee: {{originalAssignee}}
- Escalation Reason: {{escalationReason}}
- Priority: {{priority}}
- Due Date: {{dueDate}}

This request requires immediate attention.

View request: {{requestUrl}}`,
      variables: [
        'requestTitle',
        'workflowName',
        'originalAssignee',
        'escalationReason',
        'priority',
        'dueDate',
        'requestUrl',
      ],
      priority: 'urgent',
      enabled: true,
    },
  ],
  // Deadline Warning - Email
  [
    'deadline_warning_email',
    {
      id: 'deadline_warning_email',
      type: 'deadline_warning',
      channel: 'email',
      subject: '[Reminder] Approval Request Due Soon: {{requestTitle}}',
      bodyTemplate: `This is a reminder that the following approval request is due soon.

Request Details:
- Title: {{requestTitle}}
- Workflow: {{workflowName}}
- Due Date: {{dueDate}}
- Time Remaining: {{timeRemaining}}

Please review and take action before the deadline.

View request: {{requestUrl}}`,
      variables: [
        'requestTitle',
        'workflowName',
        'dueDate',
        'timeRemaining',
        'requestUrl',
      ],
      priority: 'high',
      enabled: true,
    },
  ],
  // Slack Templates
  [
    'decision_slack',
    {
      id: 'decision_slack',
      type: 'decision_made',
      channel: 'slack',
      subject: 'Approval Request {{decision}}',
      bodyTemplate: `:{{decisionEmoji}}: *Request {{decision}}*\n\n*{{requestTitle}}*\nReviewer: {{reviewerName}}\n{{#if comments}}Comments: {{comments}}{{/if}}`,
      variables: [
        'decision',
        'decisionEmoji',
        'requestTitle',
        'reviewerName',
        'comments',
      ],
      priority: 'normal',
      enabled: true,
    },
  ],
]);

// ============================================================================
// In-memory storage for notifications
// ============================================================================

const notificationStorage: Map<string, NotificationPayload> = new Map();
const userPreferences: Map<string, NotificationPreferences> = new Map([
  [
    'default',
    {
      userId: 'default',
      channels: {
        email: true,
        inApp: true,
        webhook: false,
        slack: false,
      },
    },
  ],
]);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique notification ID
 */
function generateNotificationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `ntf_${timestamp}_${random}`;
}

/**
 * Get current ISO timestamp
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Render a template with variables
 */
function renderTemplate(
  template: string,
  variables: Record<string, unknown>
): string {
  let result = template;

  // Handle simple variable replacement
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(value ?? ''));
  }

  // Handle conditional blocks {{#if variable}}...{{/if}}
  const conditionalRegex = /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(conditionalRegex, (_match, variable, content) => {
    return variables[variable] ? content : '';
  });

  return result;
}

/**
 * Get decision emoji for Slack
 */
function getDecisionEmoji(decision: string): string {
  switch (decision) {
    case 'approved':
      return 'white_check_mark';
    case 'rejected':
      return 'x';
    case 'escalated':
      return 'arrow_up';
    default:
      return 'question';
  }
}

/**
 * Map priority from request priority
 */
function mapPriority(requestPriority: string): NotificationPriority {
  switch (requestPriority) {
    case 'critical':
      return 'urgent';
    case 'high':
      return 'high';
    case 'low':
      return 'low';
    default:
      return 'normal';
  }
}

/**
 * Check if within quiet hours
 */
function isWithinQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quietHours?.enabled) return false;

  const now = new Date();
  const currentTime =
    now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = preferences.quietHours.start.split(':').map(Number);
  const [endHour, endMin] = preferences.quietHours.end.split(':').map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Quiet hours span midnight
    return currentTime >= startTime || currentTime <= endTime;
  }
}

// ============================================================================
// Notification Dispatcher Class
// ============================================================================

/**
 * Service for dispatching notifications through various channels
 */
export class NotificationDispatcher {
  private readonly _instanceId: string;
  private _webhookConfig: WebhookConfig | null;
  private _slackConfig: SlackConfig | null;
  private _emailConfig: EmailConfig | null;

  constructor() {
    this._instanceId = `nd_${Date.now()}`;
    this._webhookConfig = null;
    this._slackConfig = null;
    this._emailConfig = null;
    // Silence unused variable warning
    void this._instanceId;
  }

  /**
   * Configure webhook settings
   */
  configureWebhook(config: WebhookConfig): void {
    this._webhookConfig = config;
  }

  /**
   * Configure Slack settings
   */
  configureSlack(config: SlackConfig): void {
    this._slackConfig = config;
  }

  /**
   * Configure email settings
   */
  configureEmail(config: EmailConfig): void {
    this._emailConfig = config;
  }

  /**
   * Notify stakeholders of a decision
   */
  async notifyDecision(
    decision: ApprovalDecision,
    request: ApprovalRequest
  ): Promise<void> {
    const preferences =
      userPreferences.get(request.requester) || userPreferences.get('default')!;

    // Check quiet hours
    if (isWithinQuietHours(preferences)) {
      // Queue for later delivery
      await this._queueNotification(
        'decision_made',
        request.requester,
        decision,
        request
      );
      return;
    }

    const channels = this._getChannelsForType('decision_made', preferences);
    const variables = this._buildDecisionVariables(decision, request);

    for (const channel of channels) {
      await this._dispatchToChannel(channel, 'decision_made', variables, request.requester);
    }
  }

  /**
   * Notify about a new assignment
   */
  async notifyAssignment(
    request: ApprovalRequest,
    assignee: string
  ): Promise<void> {
    const preferences =
      userPreferences.get(assignee) || userPreferences.get('default')!;

    const channels = this._getChannelsForType('assignment', preferences);
    const variables = this._buildAssignmentVariables(request, assignee);

    for (const channel of channels) {
      await this._dispatchToChannel(channel, 'assignment', variables, assignee);
    }
  }

  /**
   * Notify about an escalation
   */
  async notifyEscalation(
    request: ApprovalRequest,
    escalatedTo: string
  ): Promise<void> {
    const preferences =
      userPreferences.get(escalatedTo) || userPreferences.get('default')!;

    const channels = this._getChannelsForType('escalation', preferences);
    const variables = this._buildEscalationVariables(request, escalatedTo);

    for (const channel of channels) {
      await this._dispatchToChannel(channel, 'escalation', variables, escalatedTo);
    }
  }

  /**
   * Notify about an upcoming deadline
   */
  async notifyUpcomingDeadline(request: ApprovalRequest): Promise<void> {
    const recipient = request.assignee || request.requester;
    const preferences =
      userPreferences.get(recipient) || userPreferences.get('default')!;

    const channels = this._getChannelsForType('deadline_warning', preferences);
    const variables = this._buildDeadlineVariables(request);

    for (const channel of channels) {
      await this._dispatchToChannel(
        channel,
        'deadline_warning',
        variables,
        recipient
      );
    }
  }

  /**
   * Send a notification to specific channels
   */
  async sendNotification(
    type: NotificationType,
    recipient: string,
    variables: Record<string, unknown>,
    channels?: NotificationChannel[]
  ): Promise<DispatchResult[]> {
    const preferences =
      userPreferences.get(recipient) || userPreferences.get('default')!;

    const targetChannels =
      channels || this._getChannelsForType(type, preferences);
    const results: DispatchResult[] = [];

    for (const channel of targetChannels) {
      const result = await this._dispatchToChannel(
        channel,
        type,
        variables,
        recipient
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Get notification history for a recipient
   */
  async getNotificationHistory(
    recipient: string,
    limit: number = 50
  ): Promise<NotificationPayload[]> {
    const notifications = Array.from(notificationStorage.values())
      .filter((n) => n.recipient === recipient)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);

    return notifications;
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const existing = userPreferences.get(userId) || {
      userId,
      channels: {
        email: true,
        inApp: true,
        webhook: false,
        slack: false,
      },
    };

    userPreferences.set(userId, {
      ...existing,
      ...preferences,
      userId,
    });
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    return userPreferences.get(userId) || null;
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(): Promise<number> {
    const failedNotifications = Array.from(notificationStorage.values()).filter(
      (n) => n.status === 'failed' && n.retryCount < 3
    );

    let retriedCount = 0;

    for (const notification of failedNotifications) {
      notification.retryCount++;
      notification.status = 'pending';

      // Attempt to resend
      try {
        await this._sendNotification(notification);
        notification.status = 'sent';
        notification.sentAt = getCurrentTimestamp();
        retriedCount++;
      } catch (error) {
        notification.status = 'failed';
        notification.error =
          error instanceof Error ? error.message : 'Unknown error';
      }

      notificationStorage.set(notification.id, notification);
    }

    return retriedCount;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Get channels to use for a notification type
   */
  private _getChannelsForType(
    type: NotificationType,
    preferences: NotificationPreferences
  ): NotificationChannel[] {
    // Check type-specific preferences
    if (preferences.typePreferences?.[type]) {
      return preferences.typePreferences[type];
    }

    // Use general channel preferences
    const channels: NotificationChannel[] = [];
    if (preferences.channels.email) channels.push('email');
    if (preferences.channels.inApp) channels.push('in_app');
    if (preferences.channels.webhook) channels.push('webhook');
    if (preferences.channels.slack) channels.push('slack');

    return channels;
  }

  /**
   * Dispatch notification to a specific channel
   */
  private async _dispatchToChannel(
    channel: NotificationChannel,
    type: NotificationType,
    variables: Record<string, unknown>,
    recipient: string
  ): Promise<DispatchResult> {
    const templateKey = `${type.replace(/_/g, '_')}_${channel}`;
    const template = defaultTemplates.get(templateKey);

    if (!template || !template.enabled) {
      return {
        success: false,
        notificationId: '',
        channel,
        recipient,
        timestamp: getCurrentTimestamp(),
        error: `No enabled template found for ${templateKey}`,
      };
    }

    const notification: NotificationPayload = {
      id: generateNotificationId(),
      type,
      channel,
      recipient,
      subject: renderTemplate(template.subject, variables),
      body: renderTemplate(template.bodyTemplate, variables),
      htmlBody: template.htmlTemplate
        ? renderTemplate(template.htmlTemplate, variables)
        : undefined,
      priority: template.priority,
      metadata: variables,
      createdAt: getCurrentTimestamp(),
      status: 'pending',
      retryCount: 0,
    };

    notificationStorage.set(notification.id, notification);

    try {
      await this._sendNotification(notification);
      notification.status = 'sent';
      notification.sentAt = getCurrentTimestamp();
      notificationStorage.set(notification.id, notification);

      return {
        success: true,
        notificationId: notification.id,
        channel,
        recipient,
        timestamp: notification.sentAt,
      };
    } catch (error) {
      notification.status = 'failed';
      notification.error =
        error instanceof Error ? error.message : 'Unknown error';
      notificationStorage.set(notification.id, notification);

      return {
        success: false,
        notificationId: notification.id,
        channel,
        recipient,
        timestamp: getCurrentTimestamp(),
        error: notification.error,
      };
    }
  }

  /**
   * Send notification through the appropriate channel
   */
  private async _sendNotification(notification: NotificationPayload): Promise<void> {
    switch (notification.channel) {
      case 'email':
        await this._sendEmail(notification);
        break;
      case 'in_app':
        await this._sendInApp(notification);
        break;
      case 'webhook':
        await this._sendWebhook(notification);
        break;
      case 'slack':
        await this._sendSlack(notification);
        break;
      default:
        throw new Error(`Unknown channel: ${notification.channel}`);
    }
  }

  /**
   * Send email notification (mock implementation)
   */
  private async _sendEmail(notification: NotificationPayload): Promise<void> {
    // In production, this would use an email service
    console.log(`[EMAIL] To: ${notification.recipient}`);
    console.log(`[EMAIL] Subject: ${notification.subject}`);
    console.log(`[EMAIL] Body: ${notification.body}`);

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Store email config reference to silence unused variable warning
    if (this._emailConfig) {
      void this._emailConfig.fromAddress;
    }
  }

  /**
   * Send in-app notification (mock implementation)
   */
  private async _sendInApp(notification: NotificationPayload): Promise<void> {
    // In production, this would push to a real-time notification service
    console.log(`[IN_APP] To: ${notification.recipient}`);
    console.log(`[IN_APP] ${notification.subject}: ${notification.body}`);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  /**
   * Send webhook notification (mock implementation)
   */
  private async _sendWebhook(notification: NotificationPayload): Promise<void> {
    if (!this._webhookConfig) {
      throw new Error('Webhook not configured');
    }

    // In production, this would make an HTTP request
    console.log(`[WEBHOOK] URL: ${this._webhookConfig.url}`);
    console.log(`[WEBHOOK] Payload:`, JSON.stringify(notification.metadata));

    // Simulate webhook call delay
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  /**
   * Send Slack notification (mock implementation)
   */
  private async _sendSlack(notification: NotificationPayload): Promise<void> {
    if (!this._slackConfig) {
      throw new Error('Slack not configured');
    }

    // In production, this would use Slack API
    console.log(`[SLACK] Channel: ${this._slackConfig.channel || 'default'}`);
    console.log(`[SLACK] Message: ${notification.body}`);

    // Simulate Slack API call delay
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  /**
   * Queue notification for later delivery
   */
  private async _queueNotification(
    type: NotificationType,
    recipient: string,
    decision: ApprovalDecision,
    request: ApprovalRequest
  ): Promise<void> {
    const notification: NotificationPayload = {
      id: generateNotificationId(),
      type,
      channel: 'email', // Default to email for queued notifications
      recipient,
      subject: `[Queued] ${request.workflowName} - ${decision.decision}`,
      body: `Notification queued during quiet hours`,
      priority: 'normal',
      metadata: {
        decision,
        request,
        queuedAt: getCurrentTimestamp(),
        queueReason: 'quiet_hours',
      },
      createdAt: getCurrentTimestamp(),
      status: 'pending',
      retryCount: 0,
    };

    notificationStorage.set(notification.id, notification);
  }

  /**
   * Build variables for decision notifications
   */
  private _buildDecisionVariables(
    decision: ApprovalDecision,
    request: ApprovalRequest
  ): Record<string, unknown> {
    return {
      requestId: request.id,
      requestTitle: `${request.workflowName} - ${request.stepName}`,
      workflowName: request.workflowName,
      decision: decision.decision,
      reviewerName: decision.reviewer,
      decidedAt: decision.decidedAt,
      comments: decision.comments || '',
      decisionEmoji: getDecisionEmoji(decision.decision),
      priority: request.priority,
      requesterName: request.requester,
    };
  }

  /**
   * Build variables for assignment notifications
   */
  private _buildAssignmentVariables(
    request: ApprovalRequest,
    assignee: string
  ): Record<string, unknown> {
    return {
      requestId: request.id,
      requestTitle: `${request.workflowName} - ${request.stepName}`,
      workflowName: request.workflowName,
      priority: request.priority,
      requesterName: request.requester,
      dueDate: request.dueDate,
      assignee,
      requestUrl: `/approvals/${request.id}`,
    };
  }

  /**
   * Build variables for escalation notifications
   */
  private _buildEscalationVariables(
    request: ApprovalRequest,
    escalatedTo: string
  ): Record<string, unknown> {
    const lastEscalation =
      request.metadata.escalationHistory?.[
        (request.metadata.escalationHistory?.length || 1) - 1
      ];

    return {
      requestId: request.id,
      requestTitle: `${request.workflowName} - ${request.stepName}`,
      workflowName: request.workflowName,
      priority: request.priority,
      dueDate: request.dueDate,
      escalatedTo,
      originalAssignee: request.assignee || 'Unassigned',
      escalationReason: lastEscalation?.reason || 'Manual escalation',
      requestUrl: `/approvals/${request.id}`,
    };
  }

  /**
   * Build variables for deadline notifications
   */
  private _buildDeadlineVariables(
    request: ApprovalRequest
  ): Record<string, unknown> {
    const dueDate = new Date(request.dueDate);
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    let timeRemaining: string;
    if (diffHours < 1) {
      timeRemaining = 'Less than 1 hour';
    } else if (diffHours < 24) {
      timeRemaining = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      timeRemaining = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }

    return {
      requestId: request.id,
      requestTitle: `${request.workflowName} - ${request.stepName}`,
      workflowName: request.workflowName,
      dueDate: request.dueDate,
      timeRemaining,
      priority: mapPriority(request.priority),
      requestUrl: `/approvals/${request.id}`,
    };
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

let notificationDispatcherInstance: NotificationDispatcher | null = null;

/**
 * Get the singleton NotificationDispatcher instance
 */
export function getNotificationDispatcher(): NotificationDispatcher {
  if (!notificationDispatcherInstance) {
    notificationDispatcherInstance = new NotificationDispatcher();
  }
  return notificationDispatcherInstance;
}

/**
 * Reset the NotificationDispatcher instance (for testing)
 */
export function resetNotificationDispatcher(): void {
  notificationDispatcherInstance = null;
}

/**
 * Get a notification template by ID
 */
export function getNotificationTemplate(
  templateId: string
): NotificationTemplate | undefined {
  return defaultTemplates.get(templateId);
}

/**
 * Register a custom notification template
 */
export function registerNotificationTemplate(
  template: NotificationTemplate
): void {
  defaultTemplates.set(template.id, template);
}

/**
 * Get all registered templates
 */
export function getAllNotificationTemplates(): NotificationTemplate[] {
  return Array.from(defaultTemplates.values());
}

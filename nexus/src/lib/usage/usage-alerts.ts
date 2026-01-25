/**
 * Usage Alerts
 *
 * Alert system for usage notifications:
 * - Send usage alerts
 * - Configure alert thresholds
 * - Get active alerts
 * - Alert types: 50%, 80%, 90%, limit reached
 */

import type {
  MetricType,
  AlertType,
  AlertSeverityType,
  UsageAlert,
  UsageThreshold,
  ThresholdConfig,
} from './usage-types';

import {
  MetricTypes,
  AlertTypes,
  AlertSeverity,
} from './usage-types';

import {
  getMetricLimit,
  formatMetricValue,
  getMetricDisplayInfo,
} from './usage-metrics';

import type { UsageStorage } from './usage-tracker';

/**
 * Alert notification handler
 */
export type AlertHandler = (alert: UsageAlert) => void | Promise<void>;

/**
 * Alert channel types
 */
export const AlertChannels = {
  EMAIL: 'email',
  IN_APP: 'in_app',
  WEBHOOK: 'webhook',
} as const;

export type AlertChannel = typeof AlertChannels[keyof typeof AlertChannels];

/**
 * Alert storage interface
 */
export interface AlertStorage {
  saveAlert(alert: UsageAlert): Promise<void>;
  getAlerts(userId: string, acknowledged?: boolean): Promise<UsageAlert[]>;
  acknowledgeAlert(alertId: string): Promise<void>;
  getThresholdConfig(userId: string): Promise<ThresholdConfig | null>;
  saveThresholdConfig(config: ThresholdConfig): Promise<void>;
}

/**
 * In-memory alert storage implementation
 */
export class InMemoryAlertStorage implements AlertStorage {
  private alerts: Map<string, UsageAlert>;
  private configs: Map<string, ThresholdConfig>;

  constructor() {
    this.alerts = new Map();
    this.configs = new Map();
  }

  async saveAlert(alert: UsageAlert): Promise<void> {
    this.alerts.set(alert.id, alert);
  }

  async getAlerts(userId: string, acknowledged?: boolean): Promise<UsageAlert[]> {
    const userAlerts: UsageAlert[] = [];

    this.alerts.forEach((alert) => {
      if (alert.userId === userId) {
        if (acknowledged === undefined || alert.acknowledged === acknowledged) {
          userAlerts.push(alert);
        }
      }
    });

    // Sort by creation date descending
    userAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return userAlerts;
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      const updated: UsageAlert = {
        ...alert,
        acknowledged: true,
        acknowledgedAt: new Date(),
      };
      this.alerts.set(alertId, updated);
    }
  }

  async getThresholdConfig(userId: string): Promise<ThresholdConfig | null> {
    return this.configs.get(userId) ?? null;
  }

  async saveThresholdConfig(config: ThresholdConfig): Promise<void> {
    this.configs.set(config.userId, config);
  }
}

/**
 * Usage Alerts Manager
 */
export class UsageAlerts {
  private usageStorage: UsageStorage;
  private alertStorage: AlertStorage;
  private handlers: Map<AlertChannel, AlertHandler>;
  private sentAlerts: Map<string, Set<string>>; // userId -> Set of alertKeys

  constructor(usageStorage: UsageStorage, alertStorage: AlertStorage) {
    this.usageStorage = usageStorage;
    this.alertStorage = alertStorage;
    this.handlers = new Map();
    this.sentAlerts = new Map();
  }

  /**
   * Register an alert handler for a channel
   */
  registerHandler(channel: AlertChannel, handler: AlertHandler): void {
    this.handlers.set(channel, handler);
  }

  /**
   * Unregister an alert handler
   */
  unregisterHandler(channel: AlertChannel): void {
    this.handlers.delete(channel);
  }

  /**
   * Send a usage alert
   */
  async sendUsageAlert(
    userId: string,
    metricType: MetricType,
    currentValue: number,
    limit: number
  ): Promise<UsageAlert | null> {
    // Determine alert type based on usage percentage
    const percent = limit > 0 ? (currentValue / limit) * 100 : 0;
    const alertType = this.determineAlertType(percent);

    if (!alertType) {
      return null;
    }

    // Check if already sent for this period
    const alertKey = this.getAlertKey(userId, metricType, alertType);
    if (this.hasAlertBeenSent(userId, alertKey)) {
      return null;
    }

    // Check user's threshold config
    const config = await this.alertStorage.getThresholdConfig(userId);
    const threshold = config?.thresholds.find((t) => t.metricType === metricType);

    // Skip if disabled
    if (threshold && !threshold.enabled) {
      return null;
    }

    // Create alert
    const alert = this.createAlert(userId, alertType, metricType, currentValue, limit);

    // Save alert
    await this.alertStorage.saveAlert(alert);

    // Mark as sent
    this.markAlertSent(userId, alertKey);

    // Dispatch to handlers
    await this.dispatchAlert(alert, threshold);

    return alert;
  }

  /**
   * Configure alert thresholds for a user
   */
  async configureAlertThresholds(
    userId: string,
    thresholds: UsageThreshold[]
  ): Promise<ThresholdConfig> {
    const config: ThresholdConfig = {
      userId,
      thresholds,
      globalEmailNotifications: true,
      globalInAppNotifications: true,
      updatedAt: new Date(),
    };

    await this.alertStorage.saveThresholdConfig(config);

    return config;
  }

  /**
   * Get default threshold configuration
   */
  getDefaultThresholdConfig(userId: string): ThresholdConfig {
    const allMetrics = Object.values(MetricTypes) as MetricType[];
    const thresholds: UsageThreshold[] = allMetrics.map((metricType) => ({
      metricType,
      thresholdPercent: 80,
      enabled: true,
      notifyEmail: true,
      notifyInApp: true,
      notifyWebhook: false,
    }));

    return {
      userId,
      thresholds,
      globalEmailNotifications: true,
      globalInAppNotifications: true,
      updatedAt: new Date(),
    };
  }

  /**
   * Get active alerts for a user
   */
  async getActiveAlerts(userId: string): Promise<UsageAlert[]> {
    return this.alertStorage.getAlerts(userId, false);
  }

  /**
   * Get all alerts for a user
   */
  async getAllAlerts(userId: string): Promise<UsageAlert[]> {
    return this.alertStorage.getAlerts(userId);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    await this.alertStorage.acknowledgeAlert(alertId);
  }

  /**
   * Acknowledge all alerts for a user
   */
  async acknowledgeAllAlerts(userId: string): Promise<void> {
    const alerts = await this.getActiveAlerts(userId);
    for (const alert of alerts) {
      await this.alertStorage.acknowledgeAlert(alert.id);
    }
  }

  /**
   * Get threshold config for a user
   */
  async getThresholdConfig(userId: string): Promise<ThresholdConfig> {
    const config = await this.alertStorage.getThresholdConfig(userId);
    return config ?? this.getDefaultThresholdConfig(userId);
  }

  /**
   * Check usage and send alerts if needed
   */
  async checkAndAlert(userId: string, metricType: MetricType): Promise<UsageAlert | null> {
    const tier = await this.usageStorage.getUserTier(userId);
    const limit = getMetricLimit(metricType, tier);

    // Get current value from storage
    const periodKey = this.getCurrentPeriodKey();
    const currentValue = await this.usageStorage.getMetric(userId, metricType, periodKey) ?? 0;

    return this.sendUsageAlert(userId, metricType, currentValue, limit);
  }

  /**
   * Check all metrics for a user and send alerts
   */
  async checkAllAndAlert(userId: string): Promise<UsageAlert[]> {
    const alerts: UsageAlert[] = [];
    const allMetrics = Object.values(MetricTypes) as MetricType[];

    for (const metricType of allMetrics) {
      const alert = await this.checkAndAlert(userId, metricType);
      if (alert) {
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Reset sent alerts for a new period
   */
  resetSentAlerts(userId: string): void {
    this.sentAlerts.delete(userId);
  }

  /**
   * Create an alert object
   */
  private createAlert(
    userId: string,
    alertType: AlertType,
    metricType: MetricType,
    currentValue: number,
    limit: number
  ): UsageAlert {
    const _percent = limit > 0 ? (currentValue / limit) * 100 : 0;
    void _percent; // Reserved for future percentage display
    const severity = this.determineSeverity(alertType);
    const message = this.createAlertMessage(alertType, metricType, currentValue, limit);

    return {
      id: this.generateId(),
      userId,
      alertType,
      metricType,
      severity,
      message,
      currentValue,
      thresholdValue: this.getThresholdValue(alertType, limit),
      limitValue: limit,
      createdAt: new Date(),
      acknowledged: false,
    };
  }

  /**
   * Determine alert type based on percentage
   */
  private determineAlertType(percent: number): AlertType | null {
    if (percent >= 100) {
      return AlertTypes.LIMIT_REACHED;
    } else if (percent >= 90) {
      return AlertTypes.THRESHOLD_90;
    } else if (percent >= 80) {
      return AlertTypes.THRESHOLD_80;
    } else if (percent >= 50) {
      return AlertTypes.THRESHOLD_50;
    }
    return null;
  }

  /**
   * Determine severity based on alert type
   */
  private determineSeverity(alertType: AlertType): AlertSeverityType {
    switch (alertType) {
      case AlertTypes.LIMIT_REACHED:
      case AlertTypes.OVERAGE_DETECTED:
        return AlertSeverity.CRITICAL;
      case AlertTypes.THRESHOLD_90:
        return AlertSeverity.WARNING;
      case AlertTypes.THRESHOLD_80:
      case AlertTypes.THRESHOLD_50:
      default:
        return AlertSeverity.INFO;
    }
  }

  /**
   * Get threshold value for alert type
   */
  private getThresholdValue(alertType: AlertType, limit: number): number {
    switch (alertType) {
      case AlertTypes.LIMIT_REACHED:
        return limit;
      case AlertTypes.THRESHOLD_90:
        return limit * 0.9;
      case AlertTypes.THRESHOLD_80:
        return limit * 0.8;
      case AlertTypes.THRESHOLD_50:
        return limit * 0.5;
      default:
        return limit;
    }
  }

  /**
   * Create alert message
   */
  private createAlertMessage(
    alertType: AlertType,
    metricType: MetricType,
    currentValue: number,
    limit: number
  ): string {
    const displayInfo = getMetricDisplayInfo(metricType);
    const formattedCurrent = formatMetricValue(metricType, currentValue);
    const formattedLimit = formatMetricValue(metricType, limit);
    const percent = limit > 0 ? Math.round((currentValue / limit) * 100) : 0;

    switch (alertType) {
      case AlertTypes.LIMIT_REACHED:
        return `You've reached your ${displayInfo.name} limit. Current usage: ${formattedCurrent} of ${formattedLimit}.`;

      case AlertTypes.OVERAGE_DETECTED:
        return `You've exceeded your ${displayInfo.name} limit by ${formattedCurrent}. Overage charges may apply.`;

      case AlertTypes.THRESHOLD_90:
        return `You've used 90% of your ${displayInfo.name} allocation (${formattedCurrent} of ${formattedLimit}).`;

      case AlertTypes.THRESHOLD_80:
        return `You've used 80% of your ${displayInfo.name} allocation (${formattedCurrent} of ${formattedLimit}).`;

      case AlertTypes.THRESHOLD_50:
        return `You've used 50% of your ${displayInfo.name} allocation (${formattedCurrent} of ${formattedLimit}).`;

      default:
        return `${displayInfo.name} usage: ${percent}% (${formattedCurrent} of ${formattedLimit})`;
    }
  }

  /**
   * Dispatch alert to registered handlers
   */
  private async dispatchAlert(alert: UsageAlert, threshold?: UsageThreshold): Promise<void> {
    const config = threshold ?? {
      metricType: alert.metricType,
      thresholdPercent: 80,
      enabled: true,
      notifyEmail: true,
      notifyInApp: true,
      notifyWebhook: false,
    };

    const dispatchPromises: Promise<void>[] = [];

    if (config.notifyEmail) {
      const emailHandler = this.handlers.get(AlertChannels.EMAIL);
      if (emailHandler) {
        dispatchPromises.push(this.safeDispatch(emailHandler, alert));
      }
    }

    if (config.notifyInApp) {
      const inAppHandler = this.handlers.get(AlertChannels.IN_APP);
      if (inAppHandler) {
        dispatchPromises.push(this.safeDispatch(inAppHandler, alert));
      }
    }

    if (config.notifyWebhook && config.webhookUrl) {
      const webhookHandler = this.handlers.get(AlertChannels.WEBHOOK);
      if (webhookHandler) {
        dispatchPromises.push(this.safeDispatch(webhookHandler, alert));
      }
    }

    await Promise.all(dispatchPromises);
  }

  /**
   * Safely dispatch to handler
   */
  private async safeDispatch(handler: AlertHandler, alert: UsageAlert): Promise<void> {
    try {
      await handler(alert);
    } catch (error) {
      console.error('Error dispatching alert:', error);
    }
  }

  /**
   * Get alert key for deduplication
   */
  private getAlertKey(_userId: string, metricType: MetricType, alertType: AlertType): string {
    void _userId; // Reserved for future user-specific keys
    const periodKey = this.getCurrentPeriodKey();
    return `${metricType}:${alertType}:${periodKey}`;
  }

  /**
   * Check if alert has been sent
   */
  private hasAlertBeenSent(userId: string, alertKey: string): boolean {
    const userAlerts = this.sentAlerts.get(userId);
    return userAlerts?.has(alertKey) ?? false;
  }

  /**
   * Mark alert as sent
   */
  private markAlertSent(userId: string, alertKey: string): void {
    let userAlerts = this.sentAlerts.get(userId);
    if (!userAlerts) {
      userAlerts = new Set();
      this.sentAlerts.set(userId, userAlerts);
    }
    userAlerts.add(alertKey);
  }

  /**
   * Get current period key
   */
  private getCurrentPeriodKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Create usage alerts manager
 */
export function createUsageAlerts(
  usageStorage: UsageStorage,
  alertStorage?: AlertStorage
): UsageAlerts {
  const storage = alertStorage ?? new InMemoryAlertStorage();
  return new UsageAlerts(usageStorage, storage);
}

/**
 * Format alert for display
 */
export function formatAlertForDisplay(alert: UsageAlert): string {
  const severityEmoji = {
    info: 'i',
    warning: '!',
    critical: '!!',
  };

  const emoji = severityEmoji[alert.severity];
  const status = alert.acknowledged ? '[ACK]' : '[NEW]';

  return `[${emoji}] ${status} ${alert.message}`;
}

/**
 * Get alert priority (for sorting)
 */
export function getAlertPriority(alert: UsageAlert): number {
  const severityPriority = {
    critical: 3,
    warning: 2,
    info: 1,
  };

  const acknowledgedPenalty = alert.acknowledged ? -10 : 0;

  return severityPriority[alert.severity] + acknowledgedPenalty;
}

/**
 * Sort alerts by priority
 */
export function sortAlertsByPriority(alerts: UsageAlert[]): UsageAlert[] {
  return [...alerts].sort((a, b) => getAlertPriority(b) - getAlertPriority(a));
}

/**
 * Usage Tracker
 *
 * Tracks usage metrics for billing and limit enforcement:
 * - Workflow executions
 * - API calls
 * - Storage usage
 * - Integration calls
 * - AI requests
 *
 * Features:
 * - Real-time usage tracking
 * - Period-based aggregation (daily/monthly)
 * - Usage snapshots
 * - Threshold notifications
 * - Overage detection
 */

import type {
  MetricType,
  PeriodType,
  TierName,
  UsageMetric,
  UsagePeriod,
  UsageSnapshot,
  UsageSnapshotData,
  UsageEvent,
} from './usage-types';

import {
  PeriodTypes,
  TierNames,
  mapToRecord,
  recordToMap,
} from './usage-types';

import {
  isCounterMetric,
  getAllMetricTypes,
  getDefaultMetricValue,
  validateMetricValue,
  getMetricLimit,
} from './usage-metrics';

/**
 * Storage interface for persistence
 */
export interface UsageStorage {
  getMetric(userId: string, metricType: MetricType, periodKey: string): Promise<number | null>;
  setMetric(userId: string, metricType: MetricType, periodKey: string, value: number): Promise<void>;
  incrementMetric(userId: string, metricType: MetricType, periodKey: string, delta: number): Promise<number>;
  getSnapshot(userId: string, snapshotId: string): Promise<UsageSnapshotData | null>;
  saveSnapshot(snapshot: UsageSnapshotData): Promise<void>;
  getEvents(userId: string, startDate: Date, endDate: Date): Promise<UsageEvent[]>;
  saveEvent(event: UsageEvent): Promise<void>;
  getUserTier(userId: string): Promise<TierName>;
}

/**
 * In-memory storage implementation for development/testing
 */
export class InMemoryUsageStorage implements UsageStorage {
  private metrics: Map<string, number>;
  private snapshots: Map<string, UsageSnapshotData>;
  private events: UsageEvent[];
  private userTiers: Map<string, TierName>;

  constructor() {
    this.metrics = new Map();
    this.snapshots = new Map();
    this.events = [];
    this.userTiers = new Map();
  }

  private getMetricKey(userId: string, metricType: MetricType, periodKey: string): string {
    return `${userId}:${metricType}:${periodKey}`;
  }

  async getMetric(userId: string, metricType: MetricType, periodKey: string): Promise<number | null> {
    const key = this.getMetricKey(userId, metricType, periodKey);
    return this.metrics.get(key) ?? null;
  }

  async setMetric(userId: string, metricType: MetricType, periodKey: string, value: number): Promise<void> {
    const key = this.getMetricKey(userId, metricType, periodKey);
    this.metrics.set(key, value);
  }

  async incrementMetric(userId: string, metricType: MetricType, periodKey: string, delta: number): Promise<number> {
    const key = this.getMetricKey(userId, metricType, periodKey);
    const current = this.metrics.get(key) ?? 0;
    const newValue = current + delta;
    this.metrics.set(key, newValue);
    return newValue;
  }

  async getSnapshot(userId: string, snapshotId: string): Promise<UsageSnapshotData | null> {
    void userId; // Unused but part of interface
    return this.snapshots.get(snapshotId) ?? null;
  }

  async saveSnapshot(snapshot: UsageSnapshotData): Promise<void> {
    this.snapshots.set(snapshot.id, snapshot);
  }

  async getEvents(userId: string, startDate: Date, endDate: Date): Promise<UsageEvent[]> {
    return this.events.filter(
      (event) =>
        event.userId === userId &&
        event.timestamp >= startDate &&
        event.timestamp <= endDate
    );
  }

  async saveEvent(event: UsageEvent): Promise<void> {
    this.events.push(event);
  }

  async getUserTier(userId: string): Promise<TierName> {
    return this.userTiers.get(userId) ?? TierNames.FREE;
  }

  setUserTier(userId: string, tier: TierName): void {
    this.userTiers.set(userId, tier);
  }
}

/**
 * Event listener for usage changes
 */
export type UsageEventListener = (event: UsageEvent) => void;

/**
 * Threshold notification callback
 */
export type ThresholdCallback = (
  userId: string,
  metricType: MetricType,
  currentValue: number,
  limit: number,
  percentUsed: number
) => void;

/**
 * Usage Tracker class
 */
export class UsageTracker {
  private storage: UsageStorage;
  private eventListeners: Set<UsageEventListener>;
  private thresholdCallbacks: Map<number, ThresholdCallback>;
  private notifiedThresholds: Map<string, Set<number>>;

  constructor(storage: UsageStorage) {
    this.storage = storage;
    this.eventListeners = new Set();
    this.thresholdCallbacks = new Map();
    this.notifiedThresholds = new Map();
  }

  /**
   * Track a usage event
   */
  async track(
    userId: string,
    metricType: MetricType,
    delta: number,
    metadata?: Record<string, unknown>
  ): Promise<UsageMetric> {
    // Validate
    if (!validateMetricValue(metricType, Math.abs(delta))) {
      throw new Error(`Invalid delta value for metric ${metricType}: ${delta}`);
    }

    const now = new Date();
    const period = this.getCurrentPeriod(PeriodTypes.MONTHLY);
    const periodKey = this.getPeriodKey(period);

    // Get current value
    let currentValue = await this.storage.getMetric(userId, metricType, periodKey);
    if (currentValue === null) {
      currentValue = getDefaultMetricValue(metricType);
    }

    // Calculate new value
    let newValue: number;
    if (isCounterMetric(metricType)) {
      // Counter: increment
      newValue = await this.storage.incrementMetric(userId, metricType, periodKey, delta);
    } else {
      // Gauge: set directly (delta is absolute value for gauges)
      newValue = delta;
      await this.storage.setMetric(userId, metricType, periodKey, newValue);
    }

    // Create event
    const event: UsageEvent = {
      id: this.generateId(),
      userId,
      metricType,
      delta: isCounterMetric(metricType) ? delta : delta - currentValue,
      timestamp: now,
      metadata,
    };

    // Save event
    await this.storage.saveEvent(event);

    // Notify listeners
    this.notifyListeners(event);

    // Check thresholds
    await this.checkThresholds(userId, metricType, newValue);

    // Return updated metric
    return {
      id: this.generateId(),
      userId,
      metricType,
      value: newValue,
      periodStart: period.start,
      periodEnd: period.end,
      periodType: period.type,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Increment a counter metric
   */
  async increment(
    userId: string,
    metricType: MetricType,
    amount: number = 1,
    metadata?: Record<string, unknown>
  ): Promise<UsageMetric> {
    if (!isCounterMetric(metricType)) {
      throw new Error(`Cannot increment gauge metric: ${metricType}`);
    }
    return this.track(userId, metricType, amount, metadata);
  }

  /**
   * Set a gauge metric
   */
  async setGauge(
    userId: string,
    metricType: MetricType,
    value: number,
    metadata?: Record<string, unknown>
  ): Promise<UsageMetric> {
    if (isCounterMetric(metricType)) {
      throw new Error(`Cannot set counter metric directly: ${metricType}`);
    }
    return this.track(userId, metricType, value, metadata);
  }

  /**
   * Get current value for a metric
   */
  async getCurrentValue(userId: string, metricType: MetricType): Promise<number> {
    const period = this.getCurrentPeriod(
      isCounterMetric(metricType) ? PeriodTypes.MONTHLY : PeriodTypes.DAILY
    );
    const periodKey = this.getPeriodKey(period);
    const value = await this.storage.getMetric(userId, metricType, periodKey);
    return value ?? getDefaultMetricValue(metricType);
  }

  /**
   * Get all current metrics for a user
   */
  async getAllCurrentMetrics(userId: string): Promise<Map<MetricType, number>> {
    const metrics = new Map<MetricType, number>();
    const allTypes = getAllMetricTypes();

    for (const metricType of allTypes) {
      const value = await this.getCurrentValue(userId, metricType);
      metrics.set(metricType, value);
    }

    return metrics;
  }

  /**
   * Create a usage snapshot
   */
  async createSnapshot(userId: string, periodType: PeriodType = PeriodTypes.MONTHLY): Promise<UsageSnapshot> {
    const metrics = await this.getAllCurrentMetrics(userId);
    const period = this.getCurrentPeriod(periodType);
    const now = new Date();

    const snapshot: UsageSnapshot = {
      id: this.generateId(),
      userId,
      timestamp: now,
      metrics,
      periodType,
      periodStart: period.start,
      periodEnd: period.end,
    };

    // Save serializable version
    const snapshotData: UsageSnapshotData = {
      id: snapshot.id,
      userId: snapshot.userId,
      timestamp: snapshot.timestamp.toISOString(),
      metrics: mapToRecord(snapshot.metrics),
      periodType: snapshot.periodType,
      periodStart: snapshot.periodStart.toISOString(),
      periodEnd: snapshot.periodEnd.toISOString(),
    };

    await this.storage.saveSnapshot(snapshotData);

    return snapshot;
  }

  /**
   * Get a usage snapshot
   */
  async getSnapshot(userId: string, snapshotId: string): Promise<UsageSnapshot | null> {
    const data = await this.storage.getSnapshot(userId, snapshotId);
    if (!data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.userId,
      timestamp: new Date(data.timestamp),
      metrics: recordToMap(data.metrics),
      periodType: data.periodType,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
    };
  }

  /**
   * Get usage events for a date range
   */
  async getEvents(userId: string, startDate: Date, endDate: Date): Promise<UsageEvent[]> {
    return this.storage.getEvents(userId, startDate, endDate);
  }

  /**
   * Register an event listener
   */
  addEventListener(listener: UsageEventListener): void {
    this.eventListeners.add(listener);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(listener: UsageEventListener): void {
    this.eventListeners.delete(listener);
  }

  /**
   * Register a threshold callback
   */
  onThreshold(thresholdPercent: number, callback: ThresholdCallback): void {
    this.thresholdCallbacks.set(thresholdPercent, callback);
  }

  /**
   * Remove a threshold callback
   */
  removeThresholdCallback(thresholdPercent: number): void {
    this.thresholdCallbacks.delete(thresholdPercent);
  }

  /**
   * Reset notifications for a user (e.g., at period start)
   */
  resetNotifications(userId: string): void {
    this.notifiedThresholds.delete(userId);
  }

  /**
   * Get the current period
   */
  getCurrentPeriod(periodType: PeriodType): UsagePeriod {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (periodType) {
      case PeriodTypes.DAILY:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;

      case PeriodTypes.MONTHLY:
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case PeriodTypes.YEARLY:
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      default:
        throw new Error(`Unknown period type: ${periodType}`);
    }

    return {
      type: periodType,
      start,
      end,
      isCurrentPeriod: true,
    };
  }

  /**
   * Get period key for storage
   */
  getPeriodKey(period: UsagePeriod): string {
    const date = period.start;
    switch (period.type) {
      case PeriodTypes.DAILY:
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      case PeriodTypes.MONTHLY:
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case PeriodTypes.YEARLY:
        return `${date.getFullYear()}`;
      default:
        throw new Error(`Unknown period type: ${period.type}`);
    }
  }

  /**
   * Get next period start date
   */
  getNextPeriodStart(periodType: PeriodType): Date {
    const current = this.getCurrentPeriod(periodType);
    const end = current.end;

    switch (periodType) {
      case PeriodTypes.DAILY:
        return new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1, 0, 0, 0, 0);
      case PeriodTypes.MONTHLY:
        return new Date(end.getFullYear(), end.getMonth() + 1, 1, 0, 0, 0, 0);
      case PeriodTypes.YEARLY:
        return new Date(end.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
      default:
        throw new Error(`Unknown period type: ${periodType}`);
    }
  }

  /**
   * Notify event listeners
   */
  private notifyListeners(event: UsageEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in usage event listener:', error);
      }
    });
  }

  /**
   * Check thresholds and notify if needed
   */
  private async checkThresholds(userId: string, metricType: MetricType, currentValue: number): Promise<void> {
    const tier = await this.storage.getUserTier(userId);
    const limit = getMetricLimit(metricType, tier);

    // Skip if unlimited
    if (limit <= 0) {
      return;
    }

    const percentUsed = (currentValue / limit) * 100;

    // Get or create user's notified thresholds
    let userThresholds = this.notifiedThresholds.get(userId);
    if (!userThresholds) {
      userThresholds = new Set();
      this.notifiedThresholds.set(userId, userThresholds);
    }

    // Check each threshold
    this.thresholdCallbacks.forEach((callback, threshold) => {
      const _notificationKey = `${metricType}:${threshold}`;
      void _notificationKey; // Reserved for future deduplication

      if (percentUsed >= threshold && !userThresholds!.has(threshold)) {
        userThresholds!.add(threshold);
        try {
          callback(userId, metricType, currentValue, limit, percentUsed);
        } catch (error) {
          console.error(`Error in threshold callback for ${threshold}%:`, error);
        }
      }
    });
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Create a usage tracker with default in-memory storage
 */
export function createUsageTracker(): UsageTracker {
  const storage = new InMemoryUsageStorage();
  return new UsageTracker(storage);
}

/**
 * Create a usage tracker with custom storage
 */
export function createUsageTrackerWithStorage(storage: UsageStorage): UsageTracker {
  return new UsageTracker(storage);
}

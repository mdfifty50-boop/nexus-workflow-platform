/**
 * Usage Aggregator
 *
 * Aggregation service for usage data:
 * - Daily aggregation
 * - Monthly aggregation
 * - Current period usage
 * - Usage history
 * - Overage cost calculation
 */

import type {
  MetricType,
  PeriodType,
  AggregatedUsage,
  AggregatedUsageData,
  AggregatedMetric,
  AggregatedMetricData,
  UsageHistory,
  UsageHistoryEntry,
  UsageEvent,
  OverageResult,
} from './usage-types';

import {
  PeriodTypes,
} from './usage-types';

import {
  getAllMetricTypes,
  getMetricLimit,
  getOverageRate,
  isOverageAllowed,
  calculateUsagePercent,
  calculateOverage,
} from './usage-metrics';

import type { UsageStorage } from './usage-tracker';

/**
 * Aggregator configuration
 */
export interface AggregatorConfig {
  readonly includeZeroValues: boolean;
  readonly calculateCosts: boolean;
}

const DEFAULT_CONFIG: AggregatorConfig = {
  includeZeroValues: true,
  calculateCosts: true,
};

/**
 * Usage Aggregator class
 */
export class UsageAggregator {
  private storage: UsageStorage;
  private config: AggregatorConfig;

  constructor(storage: UsageStorage, config: Partial<AggregatorConfig> = {}) {
    this.storage = storage;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Aggregate usage for a specific day
   */
  async aggregateDaily(userId: string, date: Date): Promise<AggregatedUsage> {
    const periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const periodEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    return this.aggregate(userId, PeriodTypes.DAILY, periodStart, periodEnd);
  }

  /**
   * Aggregate usage for a specific month
   */
  async aggregateMonthly(userId: string, year: number, month: number): Promise<AggregatedUsage> {
    const periodStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    return this.aggregate(userId, PeriodTypes.MONTHLY, periodStart, periodEnd);
  }

  /**
   * Get current period usage
   */
  async getCurrentPeriodUsage(userId: string, periodType: PeriodType = PeriodTypes.MONTHLY): Promise<AggregatedUsage> {
    const now = new Date();
    const { periodStart, periodEnd } = this.getPeriodBounds(now, periodType);

    return this.aggregate(userId, periodType, periodStart, periodEnd);
  }

  /**
   * Get usage history for a date range
   */
  async getUsageHistory(
    userId: string,
    startDate: Date,
    endDate: Date,
    periodType: PeriodType = PeriodTypes.DAILY
  ): Promise<UsageHistory> {
    const entries: UsageHistoryEntry[] = [];
    const totalByMetric = new Map<MetricType, number>();
    const allMetrics = getAllMetricTypes();

    // Initialize totals
    allMetrics.forEach((metric) => {
      totalByMetric.set(metric, 0);
    });

    // Iterate through periods
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const events = await this.getEventsForPeriod(userId, currentDate, periodType);
      const metricsForPeriod = this.aggregateEvents(events);

      entries.push({
        date: new Date(currentDate),
        metrics: metricsForPeriod,
      });

      // Update totals
      metricsForPeriod.forEach((value, metric) => {
        const current = totalByMetric.get(metric) ?? 0;
        totalByMetric.set(metric, current + value);
      });

      // Move to next period
      currentDate = this.getNextPeriodStart(currentDate, periodType);
    }

    return {
      userId,
      startDate,
      endDate,
      entries,
      totalByMetric,
    };
  }

  /**
   * Calculate cost for overage
   */
  async calculateCostForOverage(
    userId: string,
    usage: Map<MetricType, number>
  ): Promise<Map<MetricType, OverageResult>> {
    const tier = await this.storage.getUserTier(userId);
    const results = new Map<MetricType, OverageResult>();

    if (!isOverageAllowed(tier)) {
      // No overage allowed for this tier
      return results;
    }

    usage.forEach((value, metricType) => {
      const limit = getMetricLimit(metricType, tier);
      const overage = calculateOverage(value, limit);

      if (overage > 0) {
        const rate = getOverageRate(metricType, tier);
        const cost = overage * rate;

        results.set(metricType, {
          metricType,
          overageAmount: overage,
          overageRate: rate,
          overageCost: cost,
          tierName: tier,
        });
      }
    });

    return results;
  }

  /**
   * Calculate total overage cost
   */
  async calculateTotalOverageCost(userId: string, usage: Map<MetricType, number>): Promise<number> {
    const overages = await this.calculateCostForOverage(userId, usage);
    let total = 0;

    overages.forEach((result) => {
      total += result.overageCost;
    });

    return total;
  }

  /**
   * Serialize aggregated usage to data format
   */
  serializeAggregatedUsage(usage: AggregatedUsage): AggregatedUsageData {
    const metricsData: Record<MetricType, AggregatedMetricData> = {} as Record<MetricType, AggregatedMetricData>;

    usage.metrics.forEach((metric, metricType) => {
      metricsData[metricType] = {
        ...metric,
        peakTimestamp: metric.peakTimestamp.toISOString(),
      };
    });

    return {
      userId: usage.userId,
      periodType: usage.periodType,
      periodStart: usage.periodStart.toISOString(),
      periodEnd: usage.periodEnd.toISOString(),
      metrics: metricsData,
      totalCost: usage.totalCost,
      overageCost: usage.overageCost,
      generatedAt: usage.generatedAt.toISOString(),
    };
  }

  /**
   * Deserialize aggregated usage from data format
   */
  deserializeAggregatedUsage(data: AggregatedUsageData): AggregatedUsage {
    const metrics = new Map<MetricType, AggregatedMetric>();

    Object.entries(data.metrics).forEach(([metricType, metricData]) => {
      metrics.set(metricType as MetricType, {
        ...metricData,
        peakTimestamp: new Date(metricData.peakTimestamp),
      });
    });

    return {
      userId: data.userId,
      periodType: data.periodType,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      metrics,
      totalCost: data.totalCost,
      overageCost: data.overageCost,
      generatedAt: new Date(data.generatedAt),
    };
  }

  /**
   * Internal aggregate method
   */
  private async aggregate(
    userId: string,
    periodType: PeriodType,
    periodStart: Date,
    periodEnd: Date
  ): Promise<AggregatedUsage> {
    const tier = await this.storage.getUserTier(userId);
    const events = await this.storage.getEvents(userId, periodStart, periodEnd);
    const metrics = new Map<MetricType, AggregatedMetric>();

    const allMetricTypes = getAllMetricTypes();

    for (const metricType of allMetricTypes) {
      const metricEvents = events.filter((e) => e.metricType === metricType);
      const limit = getMetricLimit(metricType, tier);

      if (metricEvents.length === 0 && !this.config.includeZeroValues) {
        continue;
      }

      const aggregatedMetric = this.aggregateMetricEvents(metricEvents, metricType, limit);
      metrics.set(metricType, aggregatedMetric);
    }

    // Calculate costs
    let totalCost = 0;
    let overageCost = 0;

    if (this.config.calculateCosts) {
      const usageValues = new Map<MetricType, number>();
      metrics.forEach((metric, metricType) => {
        usageValues.set(metricType, metric.total);
      });

      overageCost = await this.calculateTotalOverageCost(userId, usageValues);
      totalCost = overageCost; // Base cost would be added from subscription
    }

    return {
      userId,
      periodType,
      periodStart,
      periodEnd,
      metrics,
      totalCost,
      overageCost,
      generatedAt: new Date(),
    };
  }

  /**
   * Aggregate events for a single metric
   */
  private aggregateMetricEvents(
    events: UsageEvent[],
    metricType: MetricType,
    limit: number
  ): AggregatedMetric {
    let total = 0;
    let peak = 0;
    let peakTimestamp = new Date();
    let runningTotal = 0;
    let sum = 0;
    let count = 0;

    events.forEach((event) => {
      runningTotal += event.delta;
      total += Math.abs(event.delta);
      sum += event.delta;
      count++;

      if (runningTotal > peak) {
        peak = runningTotal;
        peakTimestamp = event.timestamp;
      }
    });

    const average = count > 0 ? sum / count : 0;
    const usagePercent = calculateUsagePercent(runningTotal, limit);
    const isOverLimit = limit > 0 && runningTotal > limit;
    const overageAmount = calculateOverage(runningTotal, limit);

    return {
      metricType,
      total: runningTotal,
      average,
      peak,
      peakTimestamp,
      limit,
      usagePercent,
      isOverLimit,
      overageAmount,
    };
  }

  /**
   * Get events for a specific period
   */
  private async getEventsForPeriod(
    userId: string,
    date: Date,
    periodType: PeriodType
  ): Promise<UsageEvent[]> {
    const { periodStart, periodEnd } = this.getPeriodBounds(date, periodType);
    return this.storage.getEvents(userId, periodStart, periodEnd);
  }

  /**
   * Aggregate events into metric totals
   */
  private aggregateEvents(events: UsageEvent[]): Map<MetricType, number> {
    const metrics = new Map<MetricType, number>();

    events.forEach((event) => {
      const current = metrics.get(event.metricType) ?? 0;
      metrics.set(event.metricType, current + event.delta);
    });

    return metrics;
  }

  /**
   * Get period bounds for a date
   */
  private getPeriodBounds(date: Date, periodType: PeriodType): { periodStart: Date; periodEnd: Date } {
    let periodStart: Date;
    let periodEnd: Date;

    switch (periodType) {
      case PeriodTypes.DAILY:
        periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        periodEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
        break;

      case PeriodTypes.MONTHLY:
        periodStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
        periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case PeriodTypes.YEARLY:
        periodStart = new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
        periodEnd = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      default:
        throw new Error(`Unknown period type: ${periodType}`);
    }

    return { periodStart, periodEnd };
  }

  /**
   * Get start of next period
   */
  private getNextPeriodStart(date: Date, periodType: PeriodType): Date {
    switch (periodType) {
      case PeriodTypes.DAILY:
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);

      case PeriodTypes.MONTHLY:
        return new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);

      case PeriodTypes.YEARLY:
        return new Date(date.getFullYear() + 1, 0, 1, 0, 0, 0, 0);

      default:
        throw new Error(`Unknown period type: ${periodType}`);
    }
  }
}

/**
 * Create an aggregator with storage
 */
export function createUsageAggregator(
  storage: UsageStorage,
  config?: Partial<AggregatorConfig>
): UsageAggregator {
  return new UsageAggregator(storage, config);
}

/**
 * Comparison utilities
 */
export interface UsageComparison {
  readonly metricType: MetricType;
  readonly currentValue: number;
  readonly previousValue: number;
  readonly absoluteChange: number;
  readonly percentChange: number;
  readonly trend: 'up' | 'down' | 'stable';
}

/**
 * Compare usage between two periods
 */
export function compareUsage(
  current: AggregatedUsage,
  previous: AggregatedUsage
): Map<MetricType, UsageComparison> {
  const comparisons = new Map<MetricType, UsageComparison>();

  current.metrics.forEach((currentMetric, metricType) => {
    const previousMetric = previous.metrics.get(metricType);
    const currentValue = currentMetric.total;
    const previousValue = previousMetric?.total ?? 0;
    const absoluteChange = currentValue - previousValue;
    const percentChange = previousValue > 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : currentValue > 0 ? 100 : 0;

    let trend: 'up' | 'down' | 'stable';
    if (Math.abs(percentChange) < 5) {
      trend = 'stable';
    } else if (absoluteChange > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }

    comparisons.set(metricType, {
      metricType,
      currentValue,
      previousValue,
      absoluteChange,
      percentChange,
      trend,
    });
  });

  return comparisons;
}

/**
 * Generate usage summary text
 */
export function generateUsageSummary(aggregated: AggregatedUsage): string {
  const lines: string[] = [];

  lines.push(`Usage Summary (${aggregated.periodType})`);
  lines.push(`Period: ${aggregated.periodStart.toLocaleDateString()} - ${aggregated.periodEnd.toLocaleDateString()}`);
  lines.push('');

  aggregated.metrics.forEach((metric, metricType) => {
    const status = metric.isOverLimit ? ' [OVER LIMIT]' : '';
    lines.push(`${metricType}: ${metric.total} / ${metric.limit} (${metric.usagePercent.toFixed(1)}%)${status}`);
  });

  if (aggregated.overageCost > 0) {
    lines.push('');
    lines.push(`Overage Cost: $${aggregated.overageCost.toFixed(2)}`);
  }

  return lines.join('\n');
}

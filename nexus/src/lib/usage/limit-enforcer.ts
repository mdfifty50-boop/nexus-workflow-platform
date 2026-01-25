/**
 * Limit Enforcer
 *
 * Enforces usage limits based on user's tier:
 * - Check if action is allowed
 * - Enforce limits with exceptions
 * - Get usage percentages
 * - Get remaining quotas
 * - Get next reset dates
 */

import type {
  MetricType,
  PeriodType,
  TierName,
  LimitCheckResult,
} from './usage-types';

import {
  MetricTypes,
  PeriodTypes,
} from './usage-types';

import {
  getMetricLimit,
  isOverageAllowed,
  calculateUsagePercent,
  calculateOverage,
  METRIC_DEFINITIONS,
} from './usage-metrics';

import type { UsageStorage } from './usage-tracker';

/**
 * Error thrown when a limit is exceeded
 */
export class LimitExceededError extends Error {
  readonly metricType: MetricType;
  readonly currentValue: number;
  readonly limit: number;
  readonly tier: TierName;

  constructor(
    metricType: MetricType,
    currentValue: number,
    limit: number,
    tier: TierName
  ) {
    super(`Usage limit exceeded for ${metricType}: ${currentValue}/${limit} (tier: ${tier})`);
    this.name = 'LimitExceededError';
    this.metricType = metricType;
    this.currentValue = currentValue;
    this.limit = limit;
    this.tier = tier;
  }
}

/**
 * Error thrown when quota is exhausted
 */
export class QuotaExhaustedError extends Error {
  readonly metricType: MetricType;
  readonly nextResetDate: Date;

  constructor(metricType: MetricType, nextResetDate: Date) {
    super(`Quota exhausted for ${metricType}. Resets on ${nextResetDate.toLocaleDateString()}`);
    this.name = 'QuotaExhaustedError';
    this.metricType = metricType;
    this.nextResetDate = nextResetDate;
  }
}

/**
 * Enforcer configuration
 */
export interface EnforcerConfig {
  readonly softLimitEnabled: boolean; // Allow grace period before hard limit
  readonly softLimitPercent: number; // Percent over limit for soft limit
  readonly blockOnLimitReached: boolean; // Prevent all actions when limit reached
}

const DEFAULT_CONFIG: EnforcerConfig = {
  softLimitEnabled: false,
  softLimitPercent: 10, // 10% grace
  blockOnLimitReached: true,
};

/**
 * Limit Enforcer class
 */
export class LimitEnforcer {
  private storage: UsageStorage;
  private config: EnforcerConfig;

  constructor(storage: UsageStorage, config: Partial<EnforcerConfig> = {}) {
    this.storage = storage;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if an action is allowed without throwing
   */
  async checkLimit(userId: string, metricType: MetricType): Promise<LimitCheckResult> {
    const tier = await this.storage.getUserTier(userId);
    const limit = getMetricLimit(metricType, tier);
    const currentValue = await this.getCurrentUsage(userId, metricType);
    const nextResetDate = this.getNextResetDate(metricType);
    const overageAllowed = isOverageAllowed(tier);

    // Unlimited check (-1 means unlimited)
    if (limit < 0) {
      return {
        allowed: true,
        metricType,
        currentValue,
        limitValue: limit,
        remainingQuota: Infinity,
        usagePercent: 0,
        nextResetDate,
        overageAllowed: true,
      };
    }

    const usagePercent = calculateUsagePercent(currentValue, limit);
    const remainingQuota = Math.max(0, limit - currentValue);
    const effectiveLimit = this.config.softLimitEnabled
      ? limit * (1 + this.config.softLimitPercent / 100)
      : limit;

    let allowed: boolean;

    if (overageAllowed) {
      // Overage allowed - always permit
      allowed = true;
    } else if (currentValue >= effectiveLimit) {
      // At or over limit (including soft limit)
      allowed = false;
    } else {
      // Under limit
      allowed = true;
    }

    return {
      allowed,
      metricType,
      currentValue,
      limitValue: limit,
      remainingQuota,
      usagePercent,
      nextResetDate,
      overageAllowed,
    };
  }

  /**
   * Enforce limit - throws if exceeded
   */
  async enforceLimit(userId: string, metricType: MetricType): Promise<void> {
    const result = await this.checkLimit(userId, metricType);

    if (!result.allowed && this.config.blockOnLimitReached) {
      const tier = await this.storage.getUserTier(userId);

      if (result.remainingQuota <= 0) {
        throw new QuotaExhaustedError(metricType, result.nextResetDate);
      }

      throw new LimitExceededError(
        metricType,
        result.currentValue,
        result.limitValue,
        tier
      );
    }
  }

  /**
   * Enforce limit with increment check - throws if would exceed
   */
  async enforceLimitWithIncrement(
    userId: string,
    metricType: MetricType,
    incrementAmount: number
  ): Promise<void> {
    const tier = await this.storage.getUserTier(userId);
    const limit = getMetricLimit(metricType, tier);
    const currentValue = await this.getCurrentUsage(userId, metricType);
    const wouldBe = currentValue + incrementAmount;

    // Unlimited check
    if (limit < 0) {
      return;
    }

    // Overage allowed check
    if (isOverageAllowed(tier)) {
      return;
    }

    const effectiveLimit = this.config.softLimitEnabled
      ? limit * (1 + this.config.softLimitPercent / 100)
      : limit;

    if (wouldBe > effectiveLimit && this.config.blockOnLimitReached) {
      if (currentValue >= limit) {
        throw new QuotaExhaustedError(metricType, this.getNextResetDate(metricType));
      }

      throw new LimitExceededError(metricType, wouldBe, limit, tier);
    }
  }

  /**
   * Get usage percentage for a metric
   */
  async getUsagePercentage(userId: string, metricType: MetricType): Promise<number> {
    const tier = await this.storage.getUserTier(userId);
    const limit = getMetricLimit(metricType, tier);
    const currentValue = await this.getCurrentUsage(userId, metricType);

    if (limit < 0) {
      return 0; // Unlimited
    }

    return calculateUsagePercent(currentValue, limit);
  }

  /**
   * Get remaining quota for a metric
   */
  async getRemainingQuota(userId: string, metricType: MetricType): Promise<number> {
    const tier = await this.storage.getUserTier(userId);
    const limit = getMetricLimit(metricType, tier);
    const currentValue = await this.getCurrentUsage(userId, metricType);

    if (limit < 0) {
      return Infinity; // Unlimited
    }

    return Math.max(0, limit - currentValue);
  }

  /**
   * Get next reset date for a metric
   */
  getNextResetDate(metricType: MetricType): Date {
    const definition = METRIC_DEFINITIONS.get(metricType);
    const resetPeriod = definition?.resetPeriod;

    if (!resetPeriod) {
      // Gauge metric - no reset
      return new Date(8640000000000000); // Max date
    }

    return this.getNextPeriodStart(resetPeriod);
  }

  /**
   * Get all limit statuses for a user
   */
  async getAllLimitStatuses(userId: string): Promise<Map<MetricType, LimitCheckResult>> {
    const results = new Map<MetricType, LimitCheckResult>();
    const allMetrics = Object.values(MetricTypes) as MetricType[];

    for (const metricType of allMetrics) {
      const result = await this.checkLimit(userId, metricType);
      results.set(metricType, result);
    }

    return results;
  }

  /**
   * Get metrics that are approaching limit
   */
  async getApproachingLimits(
    userId: string,
    thresholdPercent: number = 80
  ): Promise<LimitCheckResult[]> {
    const allStatuses = await this.getAllLimitStatuses(userId);
    const approaching: LimitCheckResult[] = [];

    allStatuses.forEach((result) => {
      if (result.usagePercent >= thresholdPercent && result.limitValue > 0) {
        approaching.push(result);
      }
    });

    // Sort by usage percentage descending
    approaching.sort((a, b) => b.usagePercent - a.usagePercent);

    return approaching;
  }

  /**
   * Get metrics that are over limit
   */
  async getOverLimitMetrics(userId: string): Promise<LimitCheckResult[]> {
    const allStatuses = await this.getAllLimitStatuses(userId);
    const overLimit: LimitCheckResult[] = [];

    allStatuses.forEach((result) => {
      if (result.currentValue > result.limitValue && result.limitValue > 0) {
        overLimit.push(result);
      }
    });

    return overLimit;
  }

  /**
   * Check if user can perform action based on multiple metrics
   */
  async canPerformAction(
    userId: string,
    requiredMetrics: Map<MetricType, number>
  ): Promise<{ allowed: boolean; blockers: LimitCheckResult[] }> {
    const blockers: LimitCheckResult[] = [];
    let allowed = true;

    const entries = Array.from(requiredMetrics.entries());
    for (let i = 0; i < entries.length; i++) {
      const [metricType, requiredAmount] = entries[i];
      const result = await this.checkLimit(userId, metricType);
      const wouldUse = result.currentValue + requiredAmount;

      if (result.limitValue > 0 && wouldUse > result.limitValue && !result.overageAllowed) {
        allowed = false;
        blockers.push(result);
      }
    }

    return { allowed, blockers };
  }

  /**
   * Get overage amount for a metric
   */
  async getOverageAmount(userId: string, metricType: MetricType): Promise<number> {
    const tier = await this.storage.getUserTier(userId);
    const limit = getMetricLimit(metricType, tier);
    const currentValue = await this.getCurrentUsage(userId, metricType);

    return calculateOverage(currentValue, limit);
  }

  /**
   * Get current usage for a metric
   */
  private async getCurrentUsage(userId: string, metricType: MetricType): Promise<number> {
    const periodKey = this.getCurrentPeriodKey(metricType);
    const value = await this.storage.getMetric(userId, metricType, periodKey);
    return value ?? 0;
  }

  /**
   * Get current period key for a metric
   */
  private getCurrentPeriodKey(metricType: MetricType): string {
    const definition = METRIC_DEFINITIONS.get(metricType);
    const resetPeriod = definition?.resetPeriod ?? PeriodTypes.MONTHLY;

    if (!definition?.resetPeriod) {
      // Gauge - use current month as key
      return this.getPeriodKey(new Date(), PeriodTypes.MONTHLY);
    }

    return this.getPeriodKey(new Date(), resetPeriod);
  }

  /**
   * Get period key for storage
   */
  private getPeriodKey(date: Date, periodType: PeriodType): string {
    switch (periodType) {
      case PeriodTypes.DAILY:
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      case PeriodTypes.MONTHLY:
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case PeriodTypes.YEARLY:
        return `${date.getFullYear()}`;
      default:
        throw new Error(`Unknown period type: ${periodType}`);
    }
  }

  /**
   * Get next period start date
   */
  private getNextPeriodStart(periodType: PeriodType): Date {
    const now = new Date();

    switch (periodType) {
      case PeriodTypes.DAILY:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      case PeriodTypes.MONTHLY:
        return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
      case PeriodTypes.YEARLY:
        return new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
      default:
        throw new Error(`Unknown period type: ${periodType}`);
    }
  }
}

/**
 * Create a limit enforcer
 */
export function createLimitEnforcer(
  storage: UsageStorage,
  config?: Partial<EnforcerConfig>
): LimitEnforcer {
  return new LimitEnforcer(storage, config);
}

/**
 * Format limit status for display
 */
export function formatLimitStatus(result: LimitCheckResult): string {
  if (result.limitValue < 0) {
    return `${result.metricType}: Unlimited`;
  }

  const status = result.allowed ? 'OK' : 'BLOCKED';
  const overage = result.currentValue > result.limitValue
    ? ` (+${result.currentValue - result.limitValue} overage)`
    : '';

  return `${result.metricType}: ${result.currentValue}/${result.limitValue} (${result.usagePercent.toFixed(1)}%) [${status}]${overage}`;
}

/**
 * Get recommended upgrade tier based on usage
 */
export function getRecommendedUpgradeTier(
  results: LimitCheckResult[],
  currentTier: TierName
): TierName | null {
  const overLimitCount = results.filter((r) => r.usagePercent > 100).length;
  const highUsageCount = results.filter((r) => r.usagePercent > 80).length;

  // Tier hierarchy
  const tierOrder: TierName[] = ['free', 'starter', 'professional', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex === tierOrder.length - 1) {
    // Already on enterprise
    return null;
  }

  if (overLimitCount >= 2 || highUsageCount >= 3) {
    // Skip a tier for heavy usage
    const skipIndex = Math.min(currentIndex + 2, tierOrder.length - 1);
    return tierOrder[skipIndex];
  }

  if (overLimitCount >= 1 || highUsageCount >= 2) {
    // Next tier
    return tierOrder[currentIndex + 1];
  }

  return null;
}

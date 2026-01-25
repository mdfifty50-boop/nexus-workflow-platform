/**
 * E-Commerce Analytics - Core Analytics Module
 *
 * Provides comprehensive analytics calculations for:
 * - Sales metrics (revenue, orders, AOV, conversion)
 * - Product performance (best sellers, inventory turnover)
 * - Customer analytics (LTV, retention, cohorts)
 * - Time-based comparisons (day/week/month/year)
 */

import type {
  Order,
  Product,
  Customer,
  CustomerSegment,
  DateRange,
  TimeGranularity,
  ComparisonPeriod,
  SalesMetrics,
  SalesComparison,
  SalesByChannel,
  SalesByRegion,
  ProductMetrics,
  BestSeller,
  CategoryMetrics,
  InventoryMetrics,
  InventoryTurnover,
  CustomerMetrics,
  CustomerLifetimeValue,
  CohortAnalysis,
  RetentionPeriod,
  RFMAnalysis,
  ConversionFunnel,
  FunnelStep,
  CartAnalytics,
} from './analytics-types';

// =============================================================================
// Date Utilities
// =============================================================================

/**
 * Get start of period based on granularity
 */
export function getStartOfPeriod(date: Date, granularity: TimeGranularity): Date {
  const d = new Date(date);
  switch (granularity) {
    case 'hour':
      d.setMinutes(0, 0, 0);
      break;
    case 'day':
      d.setHours(0, 0, 0, 0);
      break;
    case 'week':
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
      break;
    case 'month':
      d.setHours(0, 0, 0, 0);
      d.setDate(1);
      break;
    case 'quarter':
      d.setHours(0, 0, 0, 0);
      d.setDate(1);
      d.setMonth(Math.floor(d.getMonth() / 3) * 3);
      break;
    case 'year':
      d.setHours(0, 0, 0, 0);
      d.setMonth(0, 1);
      break;
  }
  return d;
}

/**
 * Get end of period based on granularity
 */
export function getEndOfPeriod(date: Date, granularity: TimeGranularity): Date {
  const d = getStartOfPeriod(date, granularity);
  switch (granularity) {
    case 'hour':
      d.setHours(d.getHours() + 1);
      break;
    case 'day':
      d.setDate(d.getDate() + 1);
      break;
    case 'week':
      d.setDate(d.getDate() + 7);
      break;
    case 'month':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'quarter':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'year':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  d.setMilliseconds(-1);
  return d;
}

/**
 * Create comparison period for time-based analysis
 */
export function createComparisonPeriod(
  currentStart: Date,
  currentEnd: Date,
  granularity: TimeGranularity
): ComparisonPeriod {
  const duration = currentEnd.getTime() - currentStart.getTime();
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);

  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: previousEnd },
    granularity,
  };
}

/**
 * Check if date is within range
 */
export function isWithinDateRange(date: Date, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

/**
 * Get periods between two dates based on granularity
 */
export function getPeriodsBetween(
  start: Date,
  end: Date,
  granularity: TimeGranularity
): DateRange[] {
  const periods: DateRange[] = [];
  let current = getStartOfPeriod(start, granularity);

  while (current < end) {
    const periodEnd = getEndOfPeriod(current, granularity);
    periods.push({
      start: new Date(current),
      end: new Date(Math.min(periodEnd.getTime(), end.getTime())),
    });

    // Move to next period
    switch (granularity) {
      case 'hour':
        current.setHours(current.getHours() + 1);
        break;
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'quarter':
        current.setMonth(current.getMonth() + 3);
        break;
      case 'year':
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  return periods;
}

// =============================================================================
// Sales Analytics
// =============================================================================

/**
 * Calculate sales metrics for a given period
 */
export function calculateSalesMetrics(
  orders: Order[],
  period: DateRange,
  totalVisitors?: number
): SalesMetrics {
  const filteredOrders = orders.filter(
    (order) =>
      order.createdAt >= period.start &&
      order.createdAt <= period.end &&
      order.status !== 'cancelled'
  );

  const completedOrders = filteredOrders.filter(
    (order) => order.status === 'delivered' || order.status === 'shipped'
  );

  const refundedOrders = filteredOrders.filter(
    (order) => order.status === 'refunded' || order.status === 'returned'
  );

  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
  const refundAmount = refundedOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = completedOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const refundRate = filteredOrders.length > 0 ? refundedOrders.length / filteredOrders.length : 0;
  const conversionRate = totalVisitors && totalVisitors > 0 ? totalOrders / totalVisitors : 0;

  // Calculate gross profit if cost data is available
  const totalCost = completedOrders.reduce((sum, order) => {
    return (
      sum +
      order.items.reduce((itemSum, item) => {
        // Use 60% of price as default cost if not specified
        return itemSum + item.quantity * (item.unitPrice * 0.6);
      }, 0)
    );
  }, 0);

  const grossProfit = totalRevenue - totalCost;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    conversionRate,
    refundRate,
    refundAmount,
    netRevenue: totalRevenue - refundAmount,
    grossProfit,
    grossMargin,
    period,
  };
}

/**
 * Compare sales metrics between two periods
 */
export function compareSalesMetrics(
  orders: Order[],
  comparison: ComparisonPeriod,
  currentVisitors?: number,
  previousVisitors?: number
): SalesComparison {
  const current = calculateSalesMetrics(orders, comparison.current, currentVisitors);
  const previous = calculateSalesMetrics(orders, comparison.previous, previousVisitors);

  const calculateChange = (curr: number, prev: number): { change: number; percent: number } => {
    const change = curr - prev;
    const percent = prev !== 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;
    return { change, percent };
  };

  const revenueChanges = calculateChange(current.totalRevenue, previous.totalRevenue);
  const ordersChanges = calculateChange(current.totalOrders, previous.totalOrders);
  const aovChanges = calculateChange(current.averageOrderValue, previous.averageOrderValue);
  const conversionChanges = calculateChange(current.conversionRate, previous.conversionRate);

  return {
    current,
    previous,
    changes: {
      revenueChange: revenueChanges.change,
      revenueChangePercent: revenueChanges.percent,
      ordersChange: ordersChanges.change,
      ordersChangePercent: ordersChanges.percent,
      aovChange: aovChanges.change,
      aovChangePercent: aovChanges.percent,
      conversionRateChange: conversionChanges.change,
      conversionRateChangePercent: conversionChanges.percent,
    },
  };
}

/**
 * Get sales breakdown by channel
 */
export function getSalesByChannel(orders: Order[], period: DateRange): SalesByChannel[] {
  const filteredOrders = orders.filter(
    (order) =>
      order.createdAt >= period.start &&
      order.createdAt <= period.end &&
      (order.status === 'delivered' || order.status === 'shipped')
  );

  const channelMap = new Map<
    string,
    { revenue: number; orders: number; visitors: number }
  >();

  filteredOrders.forEach((order) => {
    const channel = (order.metadata?.channel as string) || 'direct';
    const current = channelMap.get(channel) || { revenue: 0, orders: 0, visitors: 0 };
    channelMap.set(channel, {
      revenue: current.revenue + order.total,
      orders: current.orders + 1,
      visitors: current.visitors + 1,
    });
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  return Array.from(channelMap.entries())
    .map(([channel, data]) => ({
      channel,
      revenue: data.revenue,
      orders: data.orders,
      aov: data.orders > 0 ? data.revenue / data.orders : 0,
      conversionRate: data.visitors > 0 ? data.orders / data.visitors : 0,
      percentOfTotal: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Get sales breakdown by region
 */
export function getSalesByRegion(orders: Order[], period: DateRange): SalesByRegion[] {
  const filteredOrders = orders.filter(
    (order) =>
      order.createdAt >= period.start &&
      order.createdAt <= period.end &&
      (order.status === 'delivered' || order.status === 'shipped')
  );

  const regionMap = new Map<string, { revenue: number; orders: number; country?: string }>();

  filteredOrders.forEach((order) => {
    const region = order.shippingAddress?.state || order.shippingAddress?.country || 'Unknown';
    const country = order.shippingAddress?.country;
    const current = regionMap.get(region) || { revenue: 0, orders: 0 };
    regionMap.set(region, {
      revenue: current.revenue + order.total,
      orders: current.orders + 1,
      country,
    });
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  return Array.from(regionMap.entries())
    .map(([region, data]) => ({
      region,
      country: data.country,
      revenue: data.revenue,
      orders: data.orders,
      aov: data.orders > 0 ? data.revenue / data.orders : 0,
      percentOfTotal: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Get sales over time with specified granularity
 */
export function getSalesOverTime(
  orders: Order[],
  period: DateRange,
  granularity: TimeGranularity
): { period: DateRange; metrics: SalesMetrics }[] {
  const periods = getPeriodsBetween(period.start, period.end, granularity);

  return periods.map((p) => ({
    period: p,
    metrics: calculateSalesMetrics(orders, p),
  }));
}

// =============================================================================
// Product Analytics
// =============================================================================

/**
 * Calculate product metrics
 */
export function calculateProductMetrics(
  orders: Order[],
  product: Product,
  period: DateRange
): ProductMetrics {
  const filteredOrders = orders.filter(
    (order) =>
      order.createdAt >= period.start &&
      order.createdAt <= period.end &&
      (order.status === 'delivered' || order.status === 'shipped')
  );

  let unitsSold = 0;
  let revenue = 0;
  let returnedUnits = 0;

  filteredOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.productId === product.id) {
        if (order.status === 'returned' || order.status === 'refunded') {
          returnedUnits += item.quantity;
        } else {
          unitsSold += item.quantity;
          revenue += item.total;
        }
      }
    });
  });

  const averagePrice = unitsSold > 0 ? revenue / unitsSold : product.price;
  const returnRate = unitsSold > 0 ? returnedUnits / (unitsSold + returnedUnits) : 0;

  // Calculate profit if cost is available
  const profit = product.cost !== undefined ? revenue - unitsSold * product.cost : undefined;
  const margin = profit !== undefined && revenue > 0 ? (profit / revenue) * 100 : undefined;

  // Calculate stock turnover
  const periodDays = Math.ceil(
    (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const annualizedSales = periodDays > 0 ? (unitsSold / periodDays) * 365 : 0;
  const stockTurnover =
    product.stockQuantity > 0 ? annualizedSales / product.stockQuantity : 0;

  // Days of supply
  const dailySales = periodDays > 0 ? unitsSold / periodDays : 0;
  const daysOfSupply = dailySales > 0 ? product.stockQuantity / dailySales : 999;

  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    unitsSold,
    revenue,
    averagePrice,
    profit,
    margin,
    returnRate,
    stockTurnover,
    daysOfSupply: Math.min(daysOfSupply, 999),
    period,
  };
}

/**
 * Get best selling products
 */
export function getBestSellers(
  orders: Order[],
  products: Product[],
  period: DateRange,
  limit: number = 10,
  previousPeriod?: DateRange
): BestSeller[] {
  // Calculate metrics for current period
  const currentMetrics = products.map((product) =>
    calculateProductMetrics(orders, product, period)
  );

  // Sort by revenue
  currentMetrics.sort((a, b) => b.revenue - a.revenue);

  // Calculate previous period rankings if provided
  let previousRankings: Map<string, number> | undefined;
  if (previousPeriod) {
    const previousMetrics = products
      .map((product) => calculateProductMetrics(orders, product, previousPeriod))
      .sort((a, b) => b.revenue - a.revenue);
    previousRankings = new Map(previousMetrics.map((m, i) => [m.productId, i + 1]));
  }

  return currentMetrics.slice(0, limit).map((metrics, index) => {
    const currentRank = index + 1;
    const previousRank = previousRankings?.get(metrics.productId);
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let rankChange: number | undefined;

    if (previousRank !== undefined) {
      rankChange = previousRank - currentRank;
      trend = rankChange > 0 ? 'up' : rankChange < 0 ? 'down' : 'stable';
    }

    return {
      rank: currentRank,
      product: metrics,
      trend,
      rankChange,
    };
  });
}

/**
 * Get category performance metrics
 */
export function getCategoryMetrics(
  orders: Order[],
  products: Product[],
  period: DateRange
): CategoryMetrics[] {
  const filteredOrders = orders.filter(
    (order) =>
      order.createdAt >= period.start &&
      order.createdAt <= period.end &&
      (order.status === 'delivered' || order.status === 'shipped')
  );

  const categoryMap = new Map<
    string,
    { revenue: number; units: number; orders: Set<string>; products: Set<string> }
  >();

  // Create product lookup
  const productMap = new Map(products.map((p) => [p.id, p]));

  filteredOrders.forEach((order) => {
    order.items.forEach((item) => {
      const product = productMap.get(item.productId);
      const category = product?.category || item.category || 'Uncategorized';
      const current = categoryMap.get(category) || {
        revenue: 0,
        units: 0,
        orders: new Set<string>(),
        products: new Set<string>(),
      };
      current.revenue += item.total;
      current.units += item.quantity;
      current.orders.add(order.id);
      current.products.add(item.productId);
      categoryMap.set(category, current);
    });
  });

  const totalRevenue = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.revenue, 0);

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      revenue: data.revenue,
      unitsSold: data.units,
      orderCount: data.orders.size,
      productCount: data.products.size,
      averagePrice: data.units > 0 ? data.revenue / data.units : 0,
      percentOfRevenue: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Calculate inventory metrics
 */
export function calculateInventoryMetrics(
  orders: Order[],
  products: Product[],
  period: DateRange
): InventoryMetrics {
  const activeProducts = products.filter((p) => p.isActive);
  const inStockProducts = activeProducts.filter((p) => p.stockQuantity > 0);
  const lowStockProducts = activeProducts.filter(
    (p) => p.reorderPoint !== undefined && p.stockQuantity > 0 && p.stockQuantity <= p.reorderPoint
  );
  const outOfStockProducts = activeProducts.filter((p) => p.stockQuantity === 0);

  // Calculate total stock value
  const totalStockValue = activeProducts.reduce(
    (sum, p) => sum + p.stockQuantity * (p.cost || p.price * 0.6),
    0
  );

  // Calculate turnover for each product
  const turnovers = activeProducts.map((p) => {
    const metrics = calculateProductMetrics(orders, p, period);
    return metrics.stockTurnover;
  });

  const averageTurnoverRate =
    turnovers.length > 0 ? turnovers.reduce((a, b) => a + b, 0) / turnovers.length : 0;

  // Identify slow and fast moving products
  const sortedByTurnover = activeProducts
    .map((p) => ({
      id: p.id,
      turnover: calculateProductMetrics(orders, p, period).stockTurnover,
    }))
    .sort((a, b) => b.turnover - a.turnover);

  const fastMovingProducts = sortedByTurnover.slice(0, 10).map((p) => p.id);
  const slowMovingProducts = sortedByTurnover
    .filter((p) => p.turnover < 1)
    .slice(0, 10)
    .map((p) => p.id);

  return {
    totalProducts: activeProducts.length,
    inStockProducts: inStockProducts.length,
    lowStockProducts: lowStockProducts.length,
    outOfStockProducts: outOfStockProducts.length,
    totalStockValue,
    averageTurnoverRate,
    slowMovingProducts,
    fastMovingProducts,
    period,
  };
}

/**
 * Calculate inventory turnover for a product
 */
export function calculateInventoryTurnover(
  orders: Order[],
  product: Product,
  period: DateRange,
  averageInventory?: number
): InventoryTurnover {
  const metrics = calculateProductMetrics(orders, product, period);
  const cogs = product.cost !== undefined ? metrics.unitsSold * product.cost : metrics.revenue * 0.6;
  const avgInventory = averageInventory || product.stockQuantity;
  const turnoverRate = avgInventory > 0 ? cogs / (avgInventory * (product.cost || product.price * 0.6)) : 0;
  const daysOfInventory = turnoverRate > 0 ? 365 / turnoverRate : 999;

  return {
    productId: product.id,
    turnoverRate,
    daysOfInventory: Math.min(daysOfInventory, 999),
    stockValue: avgInventory * (product.cost || product.price * 0.6),
    cogs,
    averageInventory: avgInventory,
  };
}

// =============================================================================
// Customer Analytics
// =============================================================================

/**
 * Calculate customer metrics
 */
export function calculateCustomerMetrics(
  orders: Order[],
  customers: Customer[],
  period: DateRange
): CustomerMetrics {
  const filteredOrders = orders.filter(
    (order) =>
      order.createdAt >= period.start &&
      order.createdAt <= period.end &&
      (order.status === 'delivered' || order.status === 'shipped')
  );

  // Get unique customers who ordered in period
  const customerIds = new Set(filteredOrders.map((o) => o.customerId));
  const activeCustomers = customers.filter((c) => customerIds.has(c.id));

  // Identify new vs returning customers
  const newCustomers = activeCustomers.filter(
    (c) => c.createdAt >= period.start && c.createdAt <= period.end
  );
  const returningCustomers = activeCustomers.filter(
    (c) => c.createdAt < period.start
  );

  // Calculate average LTV
  const totalLtv = activeCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
  const averageLifetimeValue = activeCustomers.length > 0 ? totalLtv / activeCustomers.length : 0;

  // Calculate retention (customers from previous period who ordered again)
  const previousPeriodEnd = new Date(period.start.getTime() - 1);
  const previousPeriodStart = new Date(
    previousPeriodEnd.getTime() - (period.end.getTime() - period.start.getTime())
  );
  const previousOrders = orders.filter(
    (o) =>
      o.createdAt >= previousPeriodStart &&
      o.createdAt <= previousPeriodEnd &&
      (o.status === 'delivered' || o.status === 'shipped')
  );
  const previousCustomerIds = new Set(previousOrders.map((o) => o.customerId));
  const retainedCustomers = Array.from(customerIds).filter((id) =>
    previousCustomerIds.has(id)
  );
  const retentionRate =
    previousCustomerIds.size > 0 ? retainedCustomers.length / previousCustomerIds.size : 0;
  const churnRate = 1 - retentionRate;

  // Repeat purchase rate
  const customerOrderCounts = new Map<string, number>();
  filteredOrders.forEach((o) => {
    customerOrderCounts.set(o.customerId, (customerOrderCounts.get(o.customerId) || 0) + 1);
  });
  const repeatCustomers = Array.from(customerOrderCounts.values()).filter((count) => count > 1);
  const repeatPurchaseRate =
    customerOrderCounts.size > 0 ? repeatCustomers.length / customerOrderCounts.size : 0;

  // Average purchase frequency
  const totalOrders = filteredOrders.length;
  const averagePurchaseFrequency =
    activeCustomers.length > 0 ? totalOrders / activeCustomers.length : 0;

  return {
    totalCustomers: activeCustomers.length,
    newCustomers: newCustomers.length,
    returningCustomers: returningCustomers.length,
    averageLifetimeValue,
    retentionRate,
    churnRate,
    repeatPurchaseRate,
    averagePurchaseFrequency,
    period,
  };
}

/**
 * Calculate customer lifetime value
 */
export function calculateCustomerLTV(
  orders: Order[],
  customer: Customer
): CustomerLifetimeValue {
  const customerOrders = orders.filter(
    (o) =>
      o.customerId === customer.id &&
      (o.status === 'delivered' || o.status === 'shipped')
  );

  const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = customerOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // Calculate time metrics
  const firstOrderDate = customerOrders.length > 0
    ? new Date(Math.min(...customerOrders.map((o) => o.createdAt.getTime())))
    : customer.createdAt;
  const lastOrderDate = customerOrders.length > 0
    ? new Date(Math.max(...customerOrders.map((o) => o.createdAt.getTime())))
    : customer.createdAt;

  const now = new Date();
  const daysSinceFirstOrder = Math.floor(
    (now.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysSinceLastOrder = Math.floor(
    (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Purchase frequency (orders per year)
  const customerAgeDays = Math.max(daysSinceFirstOrder, 1);
  const purchaseFrequency = (totalOrders / customerAgeDays) * 365;

  // Predict LTV based on historical behavior
  const expectedLifespan = 3; // years
  const predictedLtv = averageOrderValue * purchaseFrequency * expectedLifespan;

  // Determine segment
  let segment: CustomerSegment = 'new';
  if (daysSinceFirstOrder <= 30) {
    segment = 'new';
  } else if (daysSinceLastOrder > 180) {
    segment = 'churned';
  } else if (daysSinceLastOrder > 90) {
    segment = 'at_risk';
  } else if (totalSpent > 1000 || totalOrders > 10) {
    segment = 'vip';
  } else if (totalSpent > 500 || totalOrders > 5) {
    segment = 'high_value';
  } else if (totalOrders > 1) {
    segment = 'returning';
  } else {
    segment = 'low_value';
  }

  return {
    customerId: customer.id,
    ltv: totalSpent,
    predictedLtv,
    totalOrders,
    totalSpent,
    averageOrderValue,
    daysSinceFirstOrder,
    daysSinceLastOrder,
    purchaseFrequency,
    segment,
  };
}

/**
 * Perform RFM (Recency, Frequency, Monetary) analysis
 */
export function performRFMAnalysis(
  orders: Order[],
  customer: Customer
): RFMAnalysis {
  const ltv = calculateCustomerLTV(orders, customer);

  // Score each metric on 1-5 scale
  // Recency: Lower is better (more recent)
  let recencyScore = 1;
  if (ltv.daysSinceLastOrder <= 30) recencyScore = 5;
  else if (ltv.daysSinceLastOrder <= 60) recencyScore = 4;
  else if (ltv.daysSinceLastOrder <= 90) recencyScore = 3;
  else if (ltv.daysSinceLastOrder <= 180) recencyScore = 2;
  else recencyScore = 1;

  // Frequency: Higher is better
  let frequencyScore = 1;
  if (ltv.totalOrders >= 10) frequencyScore = 5;
  else if (ltv.totalOrders >= 5) frequencyScore = 4;
  else if (ltv.totalOrders >= 3) frequencyScore = 3;
  else if (ltv.totalOrders >= 2) frequencyScore = 2;
  else frequencyScore = 1;

  // Monetary: Higher is better
  let monetaryScore = 1;
  if (ltv.totalSpent >= 1000) monetaryScore = 5;
  else if (ltv.totalSpent >= 500) monetaryScore = 4;
  else if (ltv.totalSpent >= 200) monetaryScore = 3;
  else if (ltv.totalSpent >= 50) monetaryScore = 2;
  else monetaryScore = 1;

  const rfmScore = `${recencyScore}-${frequencyScore}-${monetaryScore}`;

  // Determine segment based on RFM score
  let segment: CustomerSegment = 'low_value';
  const avgScore = (recencyScore + frequencyScore + monetaryScore) / 3;

  if (avgScore >= 4) {
    segment = 'vip';
  } else if (avgScore >= 3) {
    segment = recencyScore >= 3 ? 'high_value' : 'at_risk';
  } else if (recencyScore >= 4 && frequencyScore === 1) {
    segment = 'new';
  } else if (recencyScore <= 2) {
    segment = frequencyScore >= 2 ? 'at_risk' : 'churned';
  } else {
    segment = 'returning';
  }

  return {
    customerId: customer.id,
    recency: ltv.daysSinceLastOrder,
    recencyScore,
    frequency: ltv.totalOrders,
    frequencyScore,
    monetary: ltv.totalSpent,
    monetaryScore,
    rfmScore,
    segment,
  };
}

/**
 * Perform cohort analysis
 */
export function performCohortAnalysis(
  orders: Order[],
  customers: Customer[],
  cohortDate: Date,
  granularity: TimeGranularity,
  periodsToAnalyze: number = 12
): CohortAnalysis {
  const cohortStart = getStartOfPeriod(cohortDate, granularity);
  const cohortEnd = getEndOfPeriod(cohortDate, granularity);

  // Find customers acquired in this cohort
  const cohortCustomers = customers.filter(
    (c) => c.createdAt >= cohortStart && c.createdAt <= cohortEnd
  );
  const cohortCustomerIds = new Set(cohortCustomers.map((c) => c.id));

  const retentionByPeriod: RetentionPeriod[] = [];
  const revenueByPeriod: number[] = [];
  let totalOrders = 0;
  let totalRevenue = 0;

  // Analyze each subsequent period
  for (let i = 0; i < periodsToAnalyze; i++) {
    let periodStart = new Date(cohortStart);
    let periodEnd: Date;

    // Advance to the current period
    switch (granularity) {
      case 'week':
        periodStart.setDate(periodStart.getDate() + i * 7);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 7);
        break;
      case 'month':
        periodStart.setMonth(periodStart.getMonth() + i);
        periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        break;
      case 'quarter':
        periodStart.setMonth(periodStart.getMonth() + i * 3);
        periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 3);
        break;
      case 'year':
        periodStart.setFullYear(periodStart.getFullYear() + i);
        periodEnd = new Date(periodStart);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        break;
      default:
        periodStart.setDate(periodStart.getDate() + i);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 1);
    }

    // Find orders from cohort customers in this period
    const periodOrders = orders.filter(
      (o) =>
        cohortCustomerIds.has(o.customerId) &&
        o.createdAt >= periodStart &&
        o.createdAt < periodEnd &&
        (o.status === 'delivered' || o.status === 'shipped')
    );

    const activeCustomers = new Set(periodOrders.map((o) => o.customerId));
    const periodRevenue = periodOrders.reduce((sum, o) => sum + o.total, 0);

    retentionByPeriod.push({
      periodNumber: i,
      customersRetained: activeCustomers.size,
      retentionRate:
        cohortCustomers.length > 0 ? activeCustomers.size / cohortCustomers.length : 0,
      revenue: periodRevenue,
    });

    revenueByPeriod.push(periodRevenue);
    totalOrders += periodOrders.length;
    totalRevenue += periodRevenue;
  }

  return {
    cohortId: `cohort_${cohortStart.toISOString().split('T')[0]}`,
    cohortDate: cohortStart,
    granularity,
    initialCustomers: cohortCustomers.length,
    retentionByPeriod,
    revenueByPeriod,
    ordersPerCustomer: cohortCustomers.length > 0 ? totalOrders / cohortCustomers.length : 0,
    averageLtv: cohortCustomers.length > 0 ? totalRevenue / cohortCustomers.length : 0,
  };
}

// =============================================================================
// Funnel and Conversion Analytics
// =============================================================================

/**
 * Build conversion funnel from events
 */
export function buildConversionFunnel(
  events: { step: string; userId: string; timestamp: Date }[],
  steps: string[],
  period: DateRange
): ConversionFunnel {
  const filteredEvents = events.filter(
    (e) => e.timestamp >= period.start && e.timestamp <= period.end
  );

  // Group events by user and track their journey
  const userJourneys = new Map<string, Set<string>>();
  filteredEvents.forEach((e) => {
    if (!userJourneys.has(e.userId)) {
      userJourneys.set(e.userId, new Set());
    }
    userJourneys.get(e.userId)!.add(e.step);
  });

  const funnelSteps: FunnelStep[] = [];
  let previousStepVisitors = userJourneys.size;

  steps.forEach((step, index) => {
    // Count users who reached this step
    const visitors = Array.from(userJourneys.values()).filter((journey) =>
      journey.has(step)
    ).length;

    const dropoffs = previousStepVisitors - visitors;
    const dropoffRate = previousStepVisitors > 0 ? dropoffs / previousStepVisitors : 0;

    // Conversion to next step
    const nextStepVisitors =
      index < steps.length - 1
        ? Array.from(userJourneys.values()).filter((journey) =>
            journey.has(steps[index + 1])
          ).length
        : visitors;
    const conversionToNext = visitors > 0 ? nextStepVisitors / visitors : 0;

    funnelSteps.push({
      name: step,
      visitors,
      dropoffs,
      dropoffRate,
      conversionToNext,
    });

    previousStepVisitors = visitors;
  });

  const totalVisitors = funnelSteps[0]?.visitors || 0;
  const totalConversions = funnelSteps[funnelSteps.length - 1]?.visitors || 0;

  return {
    name: 'Conversion Funnel',
    steps: funnelSteps,
    totalVisitors,
    totalConversions,
    overallConversionRate: totalVisitors > 0 ? totalConversions / totalVisitors : 0,
    period,
  };
}

/**
 * Calculate cart analytics
 */
export function calculateCartAnalytics(
  carts: {
    id: string;
    customerId: string;
    value: number;
    isAbandoned: boolean;
    isRecovered: boolean;
    createdAt: Date;
  }[],
  period: DateRange
): CartAnalytics {
  const filteredCarts = carts.filter(
    (c) => c.createdAt >= period.start && c.createdAt <= period.end
  );

  const abandonedCarts = filteredCarts.filter((c) => c.isAbandoned);
  const recoveredCarts = abandonedCarts.filter((c) => c.isRecovered);

  const totalCartsCreated = filteredCarts.length;
  const totalCartsAbandoned = abandonedCarts.length;
  const abandonmentRate = totalCartsCreated > 0 ? totalCartsAbandoned / totalCartsCreated : 0;
  const recoveryRate = totalCartsAbandoned > 0 ? recoveredCarts.length / totalCartsAbandoned : 0;

  const averageCartValue =
    filteredCarts.length > 0
      ? filteredCarts.reduce((sum, c) => sum + c.value, 0) / filteredCarts.length
      : 0;

  const averageAbandonedCartValue =
    abandonedCarts.length > 0
      ? abandonedCarts.reduce((sum, c) => sum + c.value, 0) / abandonedCarts.length
      : 0;

  const recoveredRevenue = recoveredCarts.reduce((sum, c) => sum + c.value, 0);

  return {
    totalCartsCreated,
    totalCartsAbandoned,
    abandonmentRate,
    recoveredCarts: recoveredCarts.length,
    recoveryRate,
    averageCartValue,
    averageAbandonedCartValue,
    recoveredRevenue,
    period,
  };
}

// =============================================================================
// Dashboard Summary
// =============================================================================

/**
 * Generate a complete analytics dashboard summary
 */
export function generateDashboardSummary(
  orders: Order[],
  products: Product[],
  customers: Customer[],
  period: DateRange,
  previousPeriod?: DateRange
): {
  sales: SalesMetrics;
  salesComparison?: SalesComparison;
  topProducts: BestSeller[];
  categoryBreakdown: CategoryMetrics[];
  inventory: InventoryMetrics;
  customerMetrics: CustomerMetrics;
  salesByChannel: SalesByChannel[];
  salesByRegion: SalesByRegion[];
} {
  const sales = calculateSalesMetrics(orders, period);

  let salesComparison: SalesComparison | undefined;
  if (previousPeriod) {
    salesComparison = compareSalesMetrics(orders, {
      current: period,
      previous: previousPeriod,
      granularity: 'day',
    });
  }

  const topProducts = getBestSellers(orders, products, period, 10, previousPeriod);
  const categoryBreakdown = getCategoryMetrics(orders, products, period);
  const inventory = calculateInventoryMetrics(orders, products, period);
  const customerMetrics = calculateCustomerMetrics(orders, customers, period);
  const salesByChannel = getSalesByChannel(orders, period);
  const salesByRegion = getSalesByRegion(orders, period);

  return {
    sales,
    salesComparison,
    topProducts,
    categoryBreakdown,
    inventory,
    customerMetrics,
    salesByChannel,
    salesByRegion,
  };
}

// =============================================================================
// Export Default Instance
// =============================================================================

export const ecommerceAnalytics = {
  // Date utilities
  getStartOfPeriod,
  getEndOfPeriod,
  createComparisonPeriod,
  isWithinDateRange,
  getPeriodsBetween,

  // Sales analytics
  calculateSalesMetrics,
  compareSalesMetrics,
  getSalesByChannel,
  getSalesByRegion,
  getSalesOverTime,

  // Product analytics
  calculateProductMetrics,
  getBestSellers,
  getCategoryMetrics,
  calculateInventoryMetrics,
  calculateInventoryTurnover,

  // Customer analytics
  calculateCustomerMetrics,
  calculateCustomerLTV,
  performRFMAnalysis,
  performCohortAnalysis,

  // Funnel analytics
  buildConversionFunnel,
  calculateCartAnalytics,

  // Dashboard
  generateDashboardSummary,
};

export default ecommerceAnalytics;

/**
 * Analytics Aggregator - Data Aggregation and Export Module
 *
 * Provides functionality for:
 * - Aggregating orders by time period
 * - Calculating running totals
 * - Generating comparison data
 * - Exporting to CSV/JSON formats
 */

import type {
  Order,
  Product,
  Customer,
  DateRange,
  TimeGranularity,
  SalesMetrics,
  CategoryMetrics,
  ReportConfiguration,
  GeneratedReport,
  ReportData,
  ReportSummary,
  KeyMetric,
  ExportFormat,
} from './analytics-types';

import {
  calculateSalesMetrics,
  calculateProductMetrics,
  calculateCustomerMetrics,
  getCategoryMetrics,
  getBestSellers,
  getPeriodsBetween,
  getStartOfPeriod,
  performCohortAnalysis,
} from './ecommerce-analytics';

// =============================================================================
// Aggregation Types
// =============================================================================

export interface AggregatedData<T> {
  period: DateRange;
  granularity: TimeGranularity;
  data: T[];
  totals: Partial<T>;
}

export interface RunningTotal {
  period: DateRange;
  cumulative: number;
  periodValue: number;
  percentageChange: number;
}

export interface ComparisonData {
  metric: string;
  currentValue: number;
  previousValue: number;
  absoluteChange: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ExportOptions {
  format: ExportFormat;
  includeHeaders?: boolean;
  dateFormat?: string;
  numberPrecision?: number;
  includeMetadata?: boolean;
  customColumns?: string[];
  fileName?: string;
}

// =============================================================================
// Order Aggregation
// =============================================================================

/**
 * Aggregate orders by time period
 */
export function aggregateOrdersByPeriod(
  orders: Order[],
  dateRange: DateRange,
  granularity: TimeGranularity
): AggregatedData<SalesMetrics> {
  const periods = getPeriodsBetween(dateRange.start, dateRange.end, granularity);

  const data = periods.map((period) => calculateSalesMetrics(orders, period));

  // Calculate totals
  const totals: Partial<SalesMetrics> = {
    totalRevenue: data.reduce((sum, d) => sum + d.totalRevenue, 0),
    totalOrders: data.reduce((sum, d) => sum + d.totalOrders, 0),
    refundAmount: data.reduce((sum, d) => sum + d.refundAmount, 0),
    netRevenue: data.reduce((sum, d) => sum + d.netRevenue, 0),
    grossProfit: data.reduce((sum, d) => sum + (d.grossProfit || 0), 0),
  };

  // Calculate aggregate averages
  if (totals.totalOrders && totals.totalOrders > 0 && totals.totalRevenue) {
    totals.averageOrderValue = totals.totalRevenue / totals.totalOrders;
  }

  if (totals.totalRevenue && totals.totalRevenue > 0 && totals.grossProfit) {
    totals.grossMargin = (totals.grossProfit / totals.totalRevenue) * 100;
  }

  return {
    period: dateRange,
    granularity,
    data,
    totals,
  };
}

/**
 * Aggregate orders by category
 */
export function aggregateOrdersByCategory(
  orders: Order[],
  products: Product[],
  dateRange: DateRange
): AggregatedData<CategoryMetrics> {
  const data = getCategoryMetrics(orders, products, dateRange);

  const totals: Partial<CategoryMetrics> = {
    revenue: data.reduce((sum, d) => sum + d.revenue, 0),
    unitsSold: data.reduce((sum, d) => sum + d.unitsSold, 0),
    orderCount: data.reduce((sum, d) => sum + d.orderCount, 0),
    productCount: data.reduce((sum, d) => sum + d.productCount, 0),
  };

  return {
    period: dateRange,
    granularity: 'day',
    data,
    totals,
  };
}

/**
 * Aggregate orders by customer segment
 */
export function aggregateOrdersByCustomerSegment(
  orders: Order[],
  customers: Customer[],
  dateRange: DateRange
): Map<string, { revenue: number; orders: number; customers: number }> {
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const segmentData = new Map<string, { revenue: number; orders: number; customers: Set<string> }>();

  const filteredOrders = orders.filter(
    (o) =>
      o.createdAt >= dateRange.start &&
      o.createdAt <= dateRange.end &&
      (o.status === 'delivered' || o.status === 'shipped')
  );

  filteredOrders.forEach((order) => {
    const customer = customerMap.get(order.customerId);
    const segment = customer?.segment || 'unknown';

    if (!segmentData.has(segment)) {
      segmentData.set(segment, { revenue: 0, orders: 0, customers: new Set() });
    }

    const data = segmentData.get(segment)!;
    data.revenue += order.total;
    data.orders += 1;
    data.customers.add(order.customerId);
  });

  // Convert to final format
  const result = new Map<string, { revenue: number; orders: number; customers: number }>();
  segmentData.forEach((data, segment) => {
    result.set(segment, {
      revenue: data.revenue,
      orders: data.orders,
      customers: data.customers.size,
    });
  });

  return result;
}

// =============================================================================
// Running Totals
// =============================================================================

/**
 * Calculate running totals for a metric over time
 */
export function calculateRunningTotals(
  orders: Order[],
  dateRange: DateRange,
  granularity: TimeGranularity,
  metricType: 'revenue' | 'orders' | 'customers' = 'revenue'
): RunningTotal[] {
  const periods = getPeriodsBetween(dateRange.start, dateRange.end, granularity);
  const runningTotals: RunningTotal[] = [];
  let cumulative = 0;
  let previousValue = 0;

  periods.forEach((period) => {
    const periodMetrics = calculateSalesMetrics(orders, period);
    let periodValue = 0;

    switch (metricType) {
      case 'revenue':
        periodValue = periodMetrics.totalRevenue;
        break;
      case 'orders':
        periodValue = periodMetrics.totalOrders;
        break;
      case 'customers':
        const uniqueCustomers = new Set(
          orders
            .filter(
              (o) =>
                o.createdAt >= period.start &&
                o.createdAt <= period.end &&
                (o.status === 'delivered' || o.status === 'shipped')
            )
            .map((o) => o.customerId)
        );
        periodValue = uniqueCustomers.size;
        break;
    }

    cumulative += periodValue;
    const percentageChange =
      previousValue !== 0 ? ((periodValue - previousValue) / previousValue) * 100 : 0;

    runningTotals.push({
      period,
      cumulative,
      periodValue,
      percentageChange,
    });

    previousValue = periodValue;
  });

  return runningTotals;
}

/**
 * Calculate cumulative growth rate
 */
export function calculateCumulativeGrowth(
  runningTotals: RunningTotal[]
): { overallGrowth: number; averageGrowth: number; growthTrend: 'accelerating' | 'decelerating' | 'stable' } {
  if (runningTotals.length < 2) {
    return { overallGrowth: 0, averageGrowth: 0, growthTrend: 'stable' };
  }

  const firstValue = runningTotals[0].periodValue;
  const lastValue = runningTotals[runningTotals.length - 1].periodValue;
  const overallGrowth = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  const growthRates = runningTotals
    .slice(1)
    .map((t) => t.percentageChange)
    .filter((r) => isFinite(r));
  const averageGrowth =
    growthRates.length > 0 ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length : 0;

  // Determine trend by comparing first half to second half growth
  const midPoint = Math.floor(growthRates.length / 2);
  const firstHalfAvg =
    growthRates.slice(0, midPoint).reduce((a, b) => a + b, 0) / Math.max(midPoint, 1);
  const secondHalfAvg =
    growthRates.slice(midPoint).reduce((a, b) => a + b, 0) / Math.max(growthRates.length - midPoint, 1);

  let growthTrend: 'accelerating' | 'decelerating' | 'stable' = 'stable';
  if (secondHalfAvg > firstHalfAvg * 1.1) {
    growthTrend = 'accelerating';
  } else if (secondHalfAvg < firstHalfAvg * 0.9) {
    growthTrend = 'decelerating';
  }

  return { overallGrowth, averageGrowth, growthTrend };
}

// =============================================================================
// Comparison Data Generation
// =============================================================================

/**
 * Generate comparison data between two periods
 */
export function generateComparisonData(
  orders: Order[],
  _products: Product[],
  customers: Customer[],
  currentPeriod: DateRange,
  previousPeriod: DateRange
): ComparisonData[] {
  void _products // Reserved for future product comparison metrics
  const currentSales = calculateSalesMetrics(orders, currentPeriod);
  const previousSales = calculateSalesMetrics(orders, previousPeriod);

  const currentCustomers = calculateCustomerMetrics(orders, customers, currentPeriod);
  const previousCustomers = calculateCustomerMetrics(orders, customers, previousPeriod);

  const comparisons: ComparisonData[] = [];

  // Helper to create comparison
  const addComparison = (
    metric: string,
    current: number,
    previous: number
  ): void => {
    const absoluteChange = current - previous;
    const percentageChange = previous !== 0 ? (absoluteChange / previous) * 100 : current > 0 ? 100 : 0;
    const trend: 'up' | 'down' | 'stable' =
      absoluteChange > 0 ? 'up' : absoluteChange < 0 ? 'down' : 'stable';

    comparisons.push({
      metric,
      currentValue: current,
      previousValue: previous,
      absoluteChange,
      percentageChange,
      trend,
    });
  };

  // Sales comparisons
  addComparison('Total Revenue', currentSales.totalRevenue, previousSales.totalRevenue);
  addComparison('Total Orders', currentSales.totalOrders, previousSales.totalOrders);
  addComparison('Average Order Value', currentSales.averageOrderValue, previousSales.averageOrderValue);
  addComparison('Net Revenue', currentSales.netRevenue, previousSales.netRevenue);
  addComparison('Refund Rate', currentSales.refundRate * 100, previousSales.refundRate * 100);

  // Customer comparisons
  addComparison('Total Customers', currentCustomers.totalCustomers, previousCustomers.totalCustomers);
  addComparison('New Customers', currentCustomers.newCustomers, previousCustomers.newCustomers);
  addComparison('Returning Customers', currentCustomers.returningCustomers, previousCustomers.returningCustomers);
  addComparison('Retention Rate', currentCustomers.retentionRate * 100, previousCustomers.retentionRate * 100);
  addComparison('Average LTV', currentCustomers.averageLifetimeValue, previousCustomers.averageLifetimeValue);

  return comparisons;
}

/**
 * Calculate year-over-year comparison
 */
export function calculateYearOverYear(
  orders: Order[],
  referenceDate: Date = new Date()
): ComparisonData[] {
  const currentYearStart = new Date(referenceDate.getFullYear(), 0, 1);
  const currentYearEnd = referenceDate;

  const previousYearStart = new Date(referenceDate.getFullYear() - 1, 0, 1);
  const previousYearEnd = new Date(referenceDate.getFullYear() - 1, referenceDate.getMonth(), referenceDate.getDate());

  const currentSales = calculateSalesMetrics(orders, { start: currentYearStart, end: currentYearEnd });
  const previousSales = calculateSalesMetrics(orders, { start: previousYearStart, end: previousYearEnd });

  return [
    {
      metric: 'YTD Revenue',
      currentValue: currentSales.totalRevenue,
      previousValue: previousSales.totalRevenue,
      absoluteChange: currentSales.totalRevenue - previousSales.totalRevenue,
      percentageChange:
        previousSales.totalRevenue !== 0
          ? ((currentSales.totalRevenue - previousSales.totalRevenue) / previousSales.totalRevenue) * 100
          : 0,
      trend: currentSales.totalRevenue > previousSales.totalRevenue ? 'up' : 'down',
    },
    {
      metric: 'YTD Orders',
      currentValue: currentSales.totalOrders,
      previousValue: previousSales.totalOrders,
      absoluteChange: currentSales.totalOrders - previousSales.totalOrders,
      percentageChange:
        previousSales.totalOrders !== 0
          ? ((currentSales.totalOrders - previousSales.totalOrders) / previousSales.totalOrders) * 100
          : 0,
      trend: currentSales.totalOrders > previousSales.totalOrders ? 'up' : 'down',
    },
  ];
}

// =============================================================================
// Report Generation
// =============================================================================

/**
 * Generate a report based on configuration
 */
export function generateReport(
  config: ReportConfiguration,
  orders: Order[],
  products: Product[],
  customers: Customer[]
): GeneratedReport {
  let data: ReportData = { rows: [] };
  let summary: ReportSummary | undefined;

  switch (config.type) {
    case 'sales_summary':
      data = generateSalesReport(orders, config);
      summary = generateSalesSummary(orders, config.dateRange);
      break;
    case 'product_performance':
      data = generateProductReport(orders, products, config);
      summary = generateProductSummary(orders, products, config.dateRange);
      break;
    case 'customer_analytics':
      data = generateCustomerReport(orders, customers, config);
      summary = generateCustomerSummary(orders, customers, config.dateRange);
      break;
    case 'inventory_status':
      data = generateInventoryReport(orders, products, config);
      break;
    case 'cohort_analysis':
      data = generateCohortReport(orders, customers, config);
      break;
    case 'custom':
      data = generateCustomReport(orders, products, customers, config);
      break;
  }

  return {
    id: `report_${Date.now()}`,
    configuration: config,
    generatedAt: new Date(),
    data,
    summary,
  };
}

function generateSalesReport(orders: Order[], config: ReportConfiguration): ReportData {
  const periods = getPeriodsBetween(config.dateRange.start, config.dateRange.end, config.granularity);

  const rows = periods.map((period) => {
    const metrics = calculateSalesMetrics(orders, period);
    return {
      period_start: period.start.toISOString(),
      period_end: period.end.toISOString(),
      revenue: metrics.totalRevenue,
      orders: metrics.totalOrders,
      aov: metrics.averageOrderValue,
      refund_rate: metrics.refundRate,
      net_revenue: metrics.netRevenue,
    };
  });

  const totals: Record<string, number> = {
    revenue: rows.reduce((sum, r) => sum + (r.revenue as number), 0),
    orders: rows.reduce((sum, r) => sum + (r.orders as number), 0),
    net_revenue: rows.reduce((sum, r) => sum + (r.net_revenue as number), 0),
  };

  return { rows, totals };
}

function generateProductReport(
  orders: Order[],
  products: Product[],
  config: ReportConfiguration
): ReportData {
  const filteredProducts = config.filters?.products
    ? products.filter((p) => config.filters!.products!.includes(p.id))
    : products;

  const rows = filteredProducts.map((product) => {
    const metrics = calculateProductMetrics(orders, product, config.dateRange);
    return {
      product_id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      units_sold: metrics.unitsSold,
      revenue: metrics.revenue,
      average_price: metrics.averagePrice,
      return_rate: metrics.returnRate,
      stock_turnover: metrics.stockTurnover,
      days_of_supply: metrics.daysOfSupply,
    };
  });

  // Sort by revenue
  rows.sort((a, b) => (b.revenue as number) - (a.revenue as number));

  // Apply limit
  const limitedRows = config.limit ? rows.slice(0, config.limit) : rows;

  return { rows: limitedRows };
}

function generateCustomerReport(
  orders: Order[],
  customers: Customer[],
  config: ReportConfiguration
): ReportData {
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  // Get unique customers who ordered in period
  const orderingCustomers = new Set<string>();
  orders.forEach((o) => {
    if (
      o.createdAt >= config.dateRange.start &&
      o.createdAt <= config.dateRange.end &&
      (o.status === 'delivered' || o.status === 'shipped')
    ) {
      orderingCustomers.add(o.customerId);
    }
  });

  const rows = Array.from(orderingCustomers).map((customerId) => {
    const customer = customerMap.get(customerId);
    const customerOrders = orders.filter(
      (o) =>
        o.customerId === customerId &&
        (o.status === 'delivered' || o.status === 'shipped')
    );

    const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
    const orderCount = customerOrders.length;

    return {
      customer_id: customerId,
      email: customer?.email || 'Unknown',
      name: customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
      segment: customer?.segment || 'unknown',
      total_orders: orderCount,
      total_spent: totalSpent,
      aov: orderCount > 0 ? totalSpent / orderCount : 0,
      first_order: customer?.createdAt?.toISOString() || '',
      last_order: customer?.lastOrderAt?.toISOString() || '',
    };
  });

  // Sort by total spent
  rows.sort((a, b) => (b.total_spent as number) - (a.total_spent as number));

  const limitedRows = config.limit ? rows.slice(0, config.limit) : rows;

  return { rows: limitedRows };
}

function generateInventoryReport(
  orders: Order[],
  products: Product[],
  config: ReportConfiguration
): ReportData {
  const rows = products.map((product) => {
    const metrics = calculateProductMetrics(orders, product, config.dateRange);
    return {
      product_id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      current_stock: product.stockQuantity,
      reorder_point: product.reorderPoint || 0,
      stock_status:
        product.stockQuantity === 0
          ? 'out_of_stock'
          : product.reorderPoint && product.stockQuantity <= product.reorderPoint
          ? 'low_stock'
          : 'in_stock',
      days_of_supply: metrics.daysOfSupply,
      turnover_rate: metrics.stockTurnover,
    };
  });

  return { rows };
}

function generateCohortReport(
  orders: Order[],
  customers: Customer[],
  config: ReportConfiguration
): ReportData {
  const cohortDate = getStartOfPeriod(config.dateRange.start, config.granularity);
  const cohortAnalysis = performCohortAnalysis(orders, customers, cohortDate, config.granularity, 12);

  const rows = cohortAnalysis.retentionByPeriod.map((period) => ({
    period_number: period.periodNumber,
    customers_retained: period.customersRetained,
    retention_rate: period.retentionRate * 100,
    revenue: period.revenue,
  }));

  return {
    rows,
    metadata: {
      cohort_date: cohortAnalysis.cohortDate.toISOString(),
      initial_customers: cohortAnalysis.initialCustomers,
      average_ltv: cohortAnalysis.averageLtv,
    },
  };
}

function generateCustomReport(
  _orders: Order[],
  _products: Product[],
  _customers: Customer[],
  _config: ReportConfiguration
): ReportData {
  void _orders // Data source for custom metrics
  void _products // Product data for custom reports
  void _customers // Customer data for custom reports
  void _config // Configuration for custom report generation
  // Custom reports allow arbitrary metric combinations
  const rows: Record<string, unknown>[] = [];
  // Implementation depends on specific custom requirements
  return { rows };
}

// =============================================================================
// Report Summaries
// =============================================================================

function generateSalesSummary(orders: Order[], dateRange: DateRange): ReportSummary {
  const metrics = calculateSalesMetrics(orders, dateRange);

  const keyMetrics: KeyMetric[] = [
    {
      name: 'Total Revenue',
      value: metrics.totalRevenue,
      formattedValue: `$${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
    {
      name: 'Total Orders',
      value: metrics.totalOrders,
      formattedValue: metrics.totalOrders.toLocaleString(),
    },
    {
      name: 'Average Order Value',
      value: metrics.averageOrderValue,
      formattedValue: `$${metrics.averageOrderValue.toFixed(2)}`,
    },
    {
      name: 'Net Revenue',
      value: metrics.netRevenue,
      formattedValue: `$${metrics.netRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
  ];

  const highlights: string[] = [];
  if (metrics.totalOrders > 0) {
    highlights.push(`Processed ${metrics.totalOrders} orders totaling $${metrics.totalRevenue.toLocaleString()}`);
  }
  if (metrics.refundRate > 0.05) {
    highlights.push(`Refund rate of ${(metrics.refundRate * 100).toFixed(1)}% may need attention`);
  }

  return {
    highlights,
    keyMetrics,
    recommendations: metrics.refundRate > 0.1 ? ['Consider reviewing return policies'] : undefined,
  };
}

function generateProductSummary(
  orders: Order[],
  products: Product[],
  dateRange: DateRange
): ReportSummary {
  const bestSellers = getBestSellers(orders, products, dateRange, 5);

  const keyMetrics: KeyMetric[] = bestSellers.slice(0, 3).map((bs, index) => ({
    name: `#${index + 1} Best Seller`,
    value: bs.product.revenue,
    formattedValue: `${bs.product.name} - $${bs.product.revenue.toLocaleString()}`,
  }));

  const highlights = [
    `Top seller: ${bestSellers[0]?.product.name || 'N/A'} with ${bestSellers[0]?.product.unitsSold || 0} units`,
    `${products.filter((p) => p.stockQuantity === 0).length} products are out of stock`,
  ];

  return { highlights, keyMetrics };
}

function generateCustomerSummary(
  orders: Order[],
  customers: Customer[],
  dateRange: DateRange
): ReportSummary {
  const metrics = calculateCustomerMetrics(orders, customers, dateRange);

  const keyMetrics: KeyMetric[] = [
    {
      name: 'Total Customers',
      value: metrics.totalCustomers,
      formattedValue: metrics.totalCustomers.toLocaleString(),
    },
    {
      name: 'New Customers',
      value: metrics.newCustomers,
      formattedValue: metrics.newCustomers.toLocaleString(),
    },
    {
      name: 'Retention Rate',
      value: metrics.retentionRate * 100,
      formattedValue: `${(metrics.retentionRate * 100).toFixed(1)}%`,
    },
    {
      name: 'Average LTV',
      value: metrics.averageLifetimeValue,
      formattedValue: `$${metrics.averageLifetimeValue.toFixed(2)}`,
    },
  ];

  const highlights = [
    `${metrics.newCustomers} new customers acquired`,
    `${(metrics.retentionRate * 100).toFixed(1)}% customer retention rate`,
  ];

  return { highlights, keyMetrics };
}

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Export data to CSV format
 */
export function exportToCSV(
  data: ReportData,
  options: ExportOptions = { format: 'csv' }
): string {
  if (data.rows.length === 0) return '';

  const columns = options.customColumns || Object.keys(data.rows[0]);
  const precision = options.numberPrecision ?? 2;

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      return value.toFixed(precision);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    const stringValue = String(value);
    // Escape quotes and wrap in quotes if contains comma
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const lines: string[] = [];

  // Header row
  if (options.includeHeaders !== false) {
    lines.push(columns.join(','));
  }

  // Data rows
  data.rows.forEach((row) => {
    const values = columns.map((col) => formatValue(row[col]));
    lines.push(values.join(','));
  });

  // Totals row
  if (data.totals && Object.keys(data.totals).length > 0) {
    const totalsRow = columns.map((col) =>
      col in data.totals! ? formatValue(data.totals![col]) : ''
    );
    lines.push('');
    lines.push(`Totals,${totalsRow.slice(1).join(',')}`);
  }

  return lines.join('\n');
}

/**
 * Export data to JSON format
 */
export function exportToJSON(
  data: ReportData,
  options: ExportOptions = { format: 'json' }
): string {
  const exportData: Record<string, unknown> = {
    rows: data.rows,
  };

  if (data.totals) {
    exportData.totals = data.totals;
  }

  if (options.includeMetadata && data.metadata) {
    exportData.metadata = {
      ...data.metadata,
      exportedAt: new Date().toISOString(),
    };
  }

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export report to specified format
 */
export function exportReport(
  report: GeneratedReport,
  options: ExportOptions
): string {
  switch (options.format) {
    case 'csv':
      return exportToCSV(report.data, options);
    case 'json':
      return exportToJSON(report.data, options);
    case 'excel':
      // Excel export would require a library like xlsx
      // For now, return CSV which can be opened in Excel
      return exportToCSV(report.data, options);
    case 'pdf':
      // PDF export would require a library like pdfkit
      // Return JSON as fallback
      return exportToJSON(report.data, options);
    default:
      return exportToJSON(report.data, options);
  }
}

/**
 * Generate export filename
 */
export function generateExportFilename(
  reportType: string,
  dateRange: DateRange,
  format: ExportFormat
): string {
  const startDate = dateRange.start.toISOString().split('T')[0];
  const endDate = dateRange.end.toISOString().split('T')[0];
  const timestamp = Date.now();

  return `${reportType}_${startDate}_to_${endDate}_${timestamp}.${format}`;
}

// =============================================================================
// Batch Processing
// =============================================================================

/**
 * Process large datasets in batches
 */
export async function processBatchedData<T, R>(
  data: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 1000,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const total = data.length;

  for (let i = 0; i < total; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);

    if (onProgress) {
      onProgress(Math.min(i + batchSize, total), total);
    }
  }

  return results;
}

/**
 * Stream data to output
 */
export function* streamReportData(
  data: ReportData,
  format: 'csv' | 'json' = 'csv'
): Generator<string> {
  if (format === 'csv') {
    if (data.rows.length > 0) {
      yield Object.keys(data.rows[0]).join(',') + '\n';
      for (const row of data.rows) {
        yield Object.values(row).join(',') + '\n';
      }
    }
  } else {
    yield '[\n';
    for (let i = 0; i < data.rows.length; i++) {
      yield JSON.stringify(data.rows[i]) + (i < data.rows.length - 1 ? ',\n' : '\n');
    }
    yield ']\n';
  }
}

// =============================================================================
// Export Analytics Aggregator
// =============================================================================

export const analyticsAggregator = {
  // Aggregation
  aggregateOrdersByPeriod,
  aggregateOrdersByCategory,
  aggregateOrdersByCustomerSegment,

  // Running totals
  calculateRunningTotals,
  calculateCumulativeGrowth,

  // Comparisons
  generateComparisonData,
  calculateYearOverYear,

  // Reports
  generateReport,

  // Export
  exportToCSV,
  exportToJSON,
  exportReport,
  generateExportFilename,

  // Batch processing
  processBatchedData,
  streamReportData,
};

export default analyticsAggregator;

/**
 * E-Commerce Analytics Module
 *
 * Comprehensive analytics for workflow automation in e-commerce:
 * - Sales metrics and performance tracking
 * - Product analytics and inventory management
 * - Customer lifetime value and cohort analysis
 * - Data aggregation and export capabilities
 *
 * @module workflow-engine/analytics
 */

// =============================================================================
// Types
// =============================================================================

export type {
  // Date and Time
  TimeGranularity,
  DateRange,
  ComparisonPeriod,
  TimePeriodResult,

  // Orders
  OrderStatus,
  PaymentMethod,
  OrderItem,
  Order,
  Address,

  // Products
  Product,
  ProductInventory,

  // Customers
  Customer,
  CustomerSegment,
  CustomerCohort,

  // Sales Metrics
  SalesMetrics,
  SalesComparison,
  MetricChanges,
  SalesByChannel,
  SalesByRegion,
  SalesByPaymentMethod,

  // Product Metrics
  ProductMetrics,
  BestSeller,
  CategoryMetrics,
  InventoryMetrics,
  InventoryTurnover,

  // Customer Metrics
  CustomerMetrics,
  CustomerLifetimeValue,
  CohortAnalysis,
  RetentionPeriod,
  RFMAnalysis,

  // Funnel and Conversion
  ConversionFunnel,
  FunnelStep,
  CartAnalytics,

  // Reports
  ReportType,
  ExportFormat,
  ReportConfiguration,
  ReportFilters,
  SortConfiguration,
  GeneratedReport,
  ReportData,
  ReportSummary,
  KeyMetric,

  // Dashboard
  DashboardWidget,
  WidgetType,
  WidgetPosition,
  DashboardConfiguration,

  // Alerts
  AlertCondition,
  MetricAlert,
  AlertNotification,
} from './analytics-types';

// =============================================================================
// Core Analytics Functions
// =============================================================================

export {
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

  // Default export
  ecommerceAnalytics,
  default as EcommerceAnalytics,
} from './ecommerce-analytics';

// =============================================================================
// Aggregation and Export Functions
// =============================================================================

export type {
  AggregatedData,
  RunningTotal,
  ComparisonData,
  ExportOptions,
} from './analytics-aggregator';

export {
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

  // Default export
  analyticsAggregator,
  default as AnalyticsAggregator,
} from './analytics-aggregator';

// =============================================================================
// Combined Analytics Service
// =============================================================================

import { ecommerceAnalytics } from './ecommerce-analytics';
import { analyticsAggregator } from './analytics-aggregator';
import type {
  Order,
  Product,
  Customer,
  DateRange,
  TimeGranularity,
  ReportConfiguration,
  ExportFormat,
} from './analytics-types';

/**
 * Combined analytics service for easy access to all analytics functionality
 */
export class AnalyticsService {
  /**
   * Generate a complete dashboard summary for a given period
   */
  static generateDashboard(
    orders: Order[],
    products: Product[],
    customers: Customer[],
    period: DateRange,
    previousPeriod?: DateRange
  ) {
    return ecommerceAnalytics.generateDashboardSummary(
      orders,
      products,
      customers,
      period,
      previousPeriod
    );
  }

  /**
   * Get sales metrics for a period
   */
  static getSalesMetrics(orders: Order[], period: DateRange, visitors?: number) {
    return ecommerceAnalytics.calculateSalesMetrics(orders, period, visitors);
  }

  /**
   * Get sales over time with specified granularity
   */
  static getSalesTimeSeries(
    orders: Order[],
    period: DateRange,
    granularity: TimeGranularity
  ) {
    return ecommerceAnalytics.getSalesOverTime(orders, period, granularity);
  }

  /**
   * Get top selling products
   */
  static getTopProducts(
    orders: Order[],
    products: Product[],
    period: DateRange,
    limit: number = 10
  ) {
    return ecommerceAnalytics.getBestSellers(orders, products, period, limit);
  }

  /**
   * Get customer metrics and segmentation
   */
  static getCustomerMetrics(
    orders: Order[],
    customers: Customer[],
    period: DateRange
  ) {
    return ecommerceAnalytics.calculateCustomerMetrics(orders, customers, period);
  }

  /**
   * Perform cohort analysis
   */
  static analyzeCohort(
    orders: Order[],
    customers: Customer[],
    cohortDate: Date,
    granularity: TimeGranularity,
    periods: number = 12
  ) {
    return ecommerceAnalytics.performCohortAnalysis(
      orders,
      customers,
      cohortDate,
      granularity,
      periods
    );
  }

  /**
   * Get RFM analysis for a customer
   */
  static analyzeCustomerRFM(orders: Order[], customer: Customer) {
    return ecommerceAnalytics.performRFMAnalysis(orders, customer);
  }

  /**
   * Calculate customer lifetime value
   */
  static calculateLTV(orders: Order[], customer: Customer) {
    return ecommerceAnalytics.calculateCustomerLTV(orders, customer);
  }

  /**
   * Generate a report based on configuration
   */
  static generateReport(
    config: ReportConfiguration,
    orders: Order[],
    products: Product[],
    customers: Customer[]
  ) {
    return analyticsAggregator.generateReport(config, orders, products, customers);
  }

  /**
   * Export report to specified format
   */
  static exportReport(
    config: ReportConfiguration,
    orders: Order[],
    products: Product[],
    customers: Customer[],
    format: ExportFormat = 'csv'
  ) {
    const report = analyticsAggregator.generateReport(config, orders, products, customers);
    return analyticsAggregator.exportReport(report, { format });
  }

  /**
   * Calculate running totals for visualization
   */
  static getRunningTotals(
    orders: Order[],
    period: DateRange,
    granularity: TimeGranularity,
    metric: 'revenue' | 'orders' | 'customers' = 'revenue'
  ) {
    return analyticsAggregator.calculateRunningTotals(orders, period, granularity, metric);
  }

  /**
   * Compare two periods
   */
  static comparePeriods(
    orders: Order[],
    products: Product[],
    customers: Customer[],
    currentPeriod: DateRange,
    previousPeriod: DateRange
  ) {
    return analyticsAggregator.generateComparisonData(
      orders,
      products,
      customers,
      currentPeriod,
      previousPeriod
    );
  }

  /**
   * Get year-over-year comparison
   */
  static getYearOverYear(orders: Order[], referenceDate?: Date) {
    return analyticsAggregator.calculateYearOverYear(orders, referenceDate);
  }

  /**
   * Calculate inventory metrics
   */
  static getInventoryMetrics(orders: Order[], products: Product[], period: DateRange) {
    return ecommerceAnalytics.calculateInventoryMetrics(orders, products, period);
  }

  /**
   * Get category breakdown
   */
  static getCategoryBreakdown(orders: Order[], products: Product[], period: DateRange) {
    return ecommerceAnalytics.getCategoryMetrics(orders, products, period);
  }

  /**
   * Get sales by channel
   */
  static getSalesByChannel(orders: Order[], period: DateRange) {
    return ecommerceAnalytics.getSalesByChannel(orders, period);
  }

  /**
   * Get sales by region
   */
  static getSalesByRegion(orders: Order[], period: DateRange) {
    return ecommerceAnalytics.getSalesByRegion(orders, period);
  }

  /**
   * Create a standard comparison period (current vs previous)
   */
  static createComparisonPeriod(
    currentStart: Date,
    currentEnd: Date,
    granularity: TimeGranularity = 'day'
  ) {
    return ecommerceAnalytics.createComparisonPeriod(currentStart, currentEnd, granularity);
  }

  /**
   * Get periods between two dates
   */
  static getPeriods(start: Date, end: Date, granularity: TimeGranularity) {
    return ecommerceAnalytics.getPeriodsBetween(start, end, granularity);
  }
}

// Export the service as default
export default AnalyticsService;

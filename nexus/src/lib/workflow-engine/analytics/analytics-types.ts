/**
 * E-Commerce Analytics Types
 *
 * Type definitions for the analytics module including:
 * - Sales metrics
 * - Product metrics
 * - Customer metrics
 * - Time-based comparisons
 * - Report configurations
 */

// =============================================================================
// Date and Time Types
// =============================================================================

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ComparisonPeriod {
  current: DateRange;
  previous: DateRange;
  granularity: TimeGranularity;
}

export interface TimePeriodResult<T> {
  period: DateRange;
  data: T;
  granularity: TimeGranularity;
}

// =============================================================================
// Order Types
// =============================================================================

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'returned';

export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'paypal'
  | 'stripe'
  | 'bank_transfer'
  | 'cash_on_delivery'
  | 'cryptocurrency'
  | 'other';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  category?: string;
  variant?: string;
}

export interface Order {
  id: string;
  customerId: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  shippingAddress?: Address;
  billingAddress?: Address;
  metadata?: Record<string, unknown>;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// =============================================================================
// Product Types
// =============================================================================

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: number;
  cost?: number;
  stockQuantity: number;
  reorderPoint?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ProductInventory {
  productId: string;
  sku: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  leadTimeDays: number;
  lastRestockDate?: Date;
  nextRestockDate?: Date;
}

// =============================================================================
// Customer Types
// =============================================================================

export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  lastOrderAt?: Date;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  tags?: string[];
  segment?: CustomerSegment;
  metadata?: Record<string, unknown>;
}

export type CustomerSegment =
  | 'new'
  | 'returning'
  | 'vip'
  | 'at_risk'
  | 'churned'
  | 'high_value'
  | 'low_value';

export interface CustomerCohort {
  id: string;
  name: string;
  description?: string;
  cohortDate: Date;
  granularity: TimeGranularity;
  customerCount: number;
  customers: string[]; // Customer IDs
}

// =============================================================================
// Sales Metrics Types
// =============================================================================

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  refundRate: number;
  refundAmount: number;
  netRevenue: number;
  grossProfit?: number;
  grossMargin?: number;
  period: DateRange;
}

export interface SalesComparison {
  current: SalesMetrics;
  previous: SalesMetrics;
  changes: MetricChanges;
}

export interface MetricChanges {
  revenueChange: number;
  revenueChangePercent: number;
  ordersChange: number;
  ordersChangePercent: number;
  aovChange: number;
  aovChangePercent: number;
  conversionRateChange: number;
  conversionRateChangePercent: number;
}

export interface SalesByChannel {
  channel: string;
  revenue: number;
  orders: number;
  aov: number;
  conversionRate: number;
  percentOfTotal: number;
}

export interface SalesByRegion {
  region: string;
  country?: string;
  revenue: number;
  orders: number;
  aov: number;
  percentOfTotal: number;
}

export interface SalesByPaymentMethod {
  method: PaymentMethod;
  revenue: number;
  orders: number;
  percentOfTotal: number;
}

// =============================================================================
// Product Metrics Types
// =============================================================================

export interface ProductMetrics {
  productId: string;
  sku: string;
  name: string;
  unitsSold: number;
  revenue: number;
  averagePrice: number;
  profit?: number;
  margin?: number;
  returnRate: number;
  stockTurnover: number;
  daysOfSupply: number;
  period: DateRange;
}

export interface BestSeller {
  rank: number;
  product: ProductMetrics;
  trend: 'up' | 'down' | 'stable';
  rankChange?: number;
}

export interface CategoryMetrics {
  category: string;
  subcategory?: string;
  revenue: number;
  unitsSold: number;
  orderCount: number;
  averagePrice: number;
  productCount: number;
  percentOfRevenue: number;
}

export interface InventoryMetrics {
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockValue: number;
  averageTurnoverRate: number;
  slowMovingProducts: string[]; // Product IDs
  fastMovingProducts: string[]; // Product IDs
  period: DateRange;
}

export interface InventoryTurnover {
  productId: string;
  turnoverRate: number;
  daysOfInventory: number;
  stockValue: number;
  cogs: number;
  averageInventory: number;
}

// =============================================================================
// Customer Metrics Types
// =============================================================================

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageLifetimeValue: number;
  customerAcquisitionCost?: number;
  retentionRate: number;
  churnRate: number;
  repeatPurchaseRate: number;
  averagePurchaseFrequency: number;
  period: DateRange;
}

export interface CustomerLifetimeValue {
  customerId: string;
  ltv: number;
  predictedLtv: number;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  daysSinceFirstOrder: number;
  daysSinceLastOrder: number;
  purchaseFrequency: number;
  segment: CustomerSegment;
}

export interface CohortAnalysis {
  cohortId: string;
  cohortDate: Date;
  granularity: TimeGranularity;
  initialCustomers: number;
  retentionByPeriod: RetentionPeriod[];
  revenueByPeriod: number[];
  ordersPerCustomer: number;
  averageLtv: number;
}

export interface RetentionPeriod {
  periodNumber: number;
  customersRetained: number;
  retentionRate: number;
  revenue: number;
}

export interface RFMAnalysis {
  customerId: string;
  recency: number;
  recencyScore: number;
  frequency: number;
  frequencyScore: number;
  monetary: number;
  monetaryScore: number;
  rfmScore: string; // e.g., "5-4-5"
  segment: CustomerSegment;
}

// =============================================================================
// Funnel and Conversion Types
// =============================================================================

export interface ConversionFunnel {
  name: string;
  steps: FunnelStep[];
  totalVisitors: number;
  totalConversions: number;
  overallConversionRate: number;
  period: DateRange;
}

export interface FunnelStep {
  name: string;
  visitors: number;
  dropoffs: number;
  dropoffRate: number;
  conversionToNext: number;
}

export interface CartAnalytics {
  totalCartsCreated: number;
  totalCartsAbandoned: number;
  abandonmentRate: number;
  recoveredCarts: number;
  recoveryRate: number;
  averageCartValue: number;
  averageAbandonedCartValue: number;
  recoveredRevenue: number;
  period: DateRange;
}

// =============================================================================
// Report Configuration Types
// =============================================================================

export type ReportType =
  | 'sales_summary'
  | 'product_performance'
  | 'customer_analytics'
  | 'inventory_status'
  | 'cohort_analysis'
  | 'funnel_analysis'
  | 'custom';

export type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf';

export interface ReportConfiguration {
  id: string;
  name: string;
  type: ReportType;
  dateRange: DateRange;
  granularity: TimeGranularity;
  filters?: ReportFilters;
  metrics: string[];
  dimensions?: string[];
  sortBy?: SortConfiguration;
  limit?: number;
  includeComparison?: boolean;
  comparisonPeriod?: ComparisonPeriod;
  exportFormat?: ExportFormat;
}

export interface ReportFilters {
  categories?: string[];
  products?: string[];
  customers?: string[];
  customerSegments?: CustomerSegment[];
  orderStatuses?: OrderStatus[];
  paymentMethods?: PaymentMethod[];
  channels?: string[];
  regions?: string[];
  minRevenue?: number;
  maxRevenue?: number;
  minOrders?: number;
  maxOrders?: number;
}

export interface SortConfiguration {
  field: string;
  direction: 'asc' | 'desc';
}

export interface GeneratedReport {
  id: string;
  configuration: ReportConfiguration;
  generatedAt: Date;
  data: ReportData;
  summary?: ReportSummary;
}

export interface ReportData {
  rows: Record<string, unknown>[];
  totals?: Record<string, number>;
  metadata?: Record<string, unknown>;
}

export interface ReportSummary {
  highlights: string[];
  keyMetrics: KeyMetric[];
  recommendations?: string[];
}

export interface KeyMetric {
  name: string;
  value: number;
  formattedValue: string;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'stable';
}

// =============================================================================
// Dashboard Types
// =============================================================================

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  metrics: string[];
  configuration: Record<string, unknown>;
  position: WidgetPosition;
  refreshInterval?: number;
}

export type WidgetType =
  | 'kpi_card'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'table'
  | 'funnel'
  | 'heatmap'
  | 'comparison';

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardConfiguration {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  defaultDateRange: DateRange;
  refreshInterval?: number;
  filters?: ReportFilters;
}

// =============================================================================
// Alert and Notification Types
// =============================================================================

export type AlertCondition = 'above' | 'below' | 'equals' | 'change_percent';

export interface MetricAlert {
  id: string;
  name: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  isEnabled: boolean;
  notificationChannels: string[];
  lastTriggeredAt?: Date;
  createdAt: Date;
}

export interface AlertNotification {
  alertId: string;
  alertName: string;
  metric: string;
  currentValue: number;
  threshold: number;
  condition: AlertCondition;
  triggeredAt: Date;
  message: string;
}

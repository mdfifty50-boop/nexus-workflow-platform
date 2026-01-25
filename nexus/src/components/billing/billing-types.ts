/**
 * Billing Types
 *
 * Type definitions for all billing portal components.
 */

// Plan tier constants (using const object instead of enum)
export const PlanTier = {
  FREE: 'free',
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
} as const;

export type PlanTierType = typeof PlanTier[keyof typeof PlanTier];

// Billing cycle constants
export const BillingCycle = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
} as const;

export type BillingCycleType = typeof BillingCycle[keyof typeof BillingCycle];

// Payment status constants
export const PaymentStatus = {
  SUCCEEDED: 'succeeded',
  PENDING: 'pending',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
} as const;

export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];

// Subscription status constants
export const SubscriptionStatus = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
  PAUSED: 'paused',
} as const;

export type SubscriptionStatusType = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

// Card brand constants
export const CardBrand = {
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  AMEX: 'amex',
  DISCOVER: 'discover',
  DINERS: 'diners',
  JCB: 'jcb',
  UNIONPAY: 'unionpay',
  UNKNOWN: 'unknown',
} as const;

export type CardBrandType = typeof CardBrand[keyof typeof CardBrand];

// Plan definition
export interface Plan {
  id: string;
  tier: PlanTierType;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: PlanFeature[];
  limits: PlanLimits;
  isPopular?: boolean;
}

export interface PlanFeature {
  id: string;
  name: string;
  description?: string;
  included: boolean;
  limit?: number | 'unlimited';
}

export interface PlanLimits {
  workflows: number | -1; // -1 = unlimited
  executions: number | -1;
  integrations: number | -1;
  teamMembers: number | -1;
  storage: number | -1; // in GB
  apiCalls: number | -1;
}

// Subscription
export interface Subscription {
  id: string;
  userId: string;
  plan: Plan;
  status: SubscriptionStatusType;
  billingCycle: BillingCycleType;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Usage tracking
export interface UsageMetric {
  id: string;
  name: string;
  displayName: string;
  current: number;
  limit: number | -1; // -1 = unlimited
  unit: string;
  resetDate?: Date;
}

export interface UsageOverview {
  subscription: Subscription;
  metrics: UsageMetric[];
  lastUpdated: Date;
}

// Payment history
export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatusType;
  description: string;
  invoiceId?: string;
  invoiceUrl?: string;
  createdAt: Date;
  refundedAmount?: number;
  failureReason?: string;
}

// Payment method
export interface PaymentMethod {
  id: string;
  type: 'card';
  card: CardDetails;
  isDefault: boolean;
  createdAt: Date;
}

export interface CardDetails {
  brand: CardBrandType;
  last4: string;
  expMonth: number;
  expYear: number;
  holderName?: string;
}

// Invoice
export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  description: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate?: Date;
  paidAt?: Date;
  pdfUrl?: string;
  hostedUrl?: string;
  createdAt: Date;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
}

// Upgrade/downgrade
export interface PlanChangePreview {
  currentPlan: Plan;
  newPlan: Plan;
  proratedAmount: number;
  newMonthlyAmount: number;
  effectiveDate: Date;
  immediateCharge?: number;
  credit?: number;
}

// Component props types
export interface BillingDashboardProps {
  subscription?: Subscription;
  usage?: UsageOverview;
  recentPayments?: Payment[];
  onUpgrade?: () => void;
  onManagePayment?: () => void;
}

export interface UsageMetersProps {
  metrics: UsageMetric[];
  onMetricClick?: (metric: UsageMetric) => void;
  compact?: boolean;
}

export interface PaymentHistoryProps {
  payments: Payment[];
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onDownloadInvoice?: (invoiceId: string) => void;
}

export interface PlanComparisonProps {
  plans: Plan[];
  currentPlanId?: string;
  billingCycle: BillingCycleType;
  onBillingCycleChange?: (cycle: BillingCycleType) => void;
  onSelectPlan?: (plan: Plan) => void;
}

export interface PaymentMethodManagerProps {
  paymentMethods: PaymentMethod[];
  onAddPaymentMethod?: () => void;
  onRemovePaymentMethod?: (methodId: string) => void;
  onSetDefault?: (methodId: string) => void;
}

export interface InvoiceDownloadProps {
  invoices: Invoice[];
  onDownload?: (invoiceId: string) => void;
  onPreview?: (invoice: Invoice) => void;
  onBulkDownload?: (invoiceIds: string[]) => void;
}

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: Plan;
  targetPlan?: Plan;
  preview?: PlanChangePreview;
  onConfirm?: () => Promise<void>;
  isLoading?: boolean;
}

// Utility types
export type UsageLevel = 'safe' | 'warning' | 'critical';

export function getUsageLevel(current: number, limit: number): UsageLevel {
  if (limit === -1) return 'safe'; // unlimited
  const percentage = (current / limit) * 100;
  if (percentage >= 90) return 'critical';
  if (percentage >= 75) return 'warning';
  return 'safe';
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100); // Stripe amounts are in cents
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function getAnnualSavings(monthlyPrice: number, annualPrice: number): number {
  const monthlyTotal = monthlyPrice * 12;
  return monthlyTotal - annualPrice;
}

export function getAnnualSavingsPercentage(monthlyPrice: number, annualPrice: number): number {
  const monthlyTotal = monthlyPrice * 12;
  if (monthlyTotal === 0) return 0;
  return Math.round(((monthlyTotal - annualPrice) / monthlyTotal) * 100);
}

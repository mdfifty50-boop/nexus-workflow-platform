/**
 * Payment Gateway Base Types and Interfaces
 *
 * Provides common types and interfaces for payment gateway integrations.
 * All payment gateways (Stripe, PayPal, etc.) implement the PaymentGateway interface.
 *
 * @module integrations/payments
 * @version 2024-01
 */

// ============================================================================
// PAYMENT METHOD TYPES
// ============================================================================

/**
 * Supported payment method types
 */
export type PaymentMethodType =
  | 'card'
  | 'bank_transfer'
  | 'wallet'
  | 'buy_now_pay_later'
  | 'crypto'
  | 'direct_debit'
  | 'paypal'
  | 'apple_pay'
  | 'google_pay'

/**
 * Card brand types
 */
export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'diners'
  | 'jcb'
  | 'unionpay'
  | 'unknown'

/**
 * Payment status values
 */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'requires_action'
  | 'requires_capture'
  | 'authorized'
  | 'captured'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded'
  | 'partially_refunded'
  | 'disputed'

/**
 * Refund status values
 */
export type RefundStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'

/**
 * Currency codes (ISO 4217)
 */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CNY' | 'INR' | 'BRL' | 'MXN' | string

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * Money representation
 */
export interface Money {
  /** Amount in smallest currency unit (cents for USD) */
  amount: number
  /** ISO 4217 currency code */
  currency: CurrencyCode
}

/**
 * Billing address
 */
export interface BillingAddress {
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode: string
  country: string // ISO 3166-1 alpha-2
}

/**
 * Card details (used for display, never contains full card number)
 */
export interface CardDetails {
  brand: CardBrand
  last4: string
  expMonth: number
  expYear: number
  funding?: 'credit' | 'debit' | 'prepaid' | 'unknown'
  country?: string
  fingerprint?: string
}

/**
 * Customer details for payment
 */
export interface PaymentCustomer {
  id?: string
  email: string
  name?: string
  phone?: string
  metadata?: Record<string, string>
}

/**
 * Payment method details
 */
export interface PaymentMethodDetails {
  type: PaymentMethodType
  card?: CardDetails
  bankAccount?: {
    bankName?: string
    last4: string
    accountType?: 'checking' | 'savings'
    country?: string
  }
  wallet?: {
    type: 'apple_pay' | 'google_pay' | 'paypal' | 'alipay' | 'wechat_pay'
    email?: string
  }
}

// ============================================================================
// PAYMENT REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to process a payment
 */
export interface PaymentRequest {
  /** Amount to charge */
  amount: Money
  /** Optional customer info */
  customer?: PaymentCustomer
  /** Payment method (token, ID, or details) */
  paymentMethod: string | PaymentMethodDetails
  /** Description for statement */
  description?: string
  /** Order reference */
  orderId?: string
  /** Whether to capture immediately (false for auth-only) */
  capture?: boolean
  /** Billing address */
  billingAddress?: BillingAddress
  /** Return URL for 3DS/redirects */
  returnUrl?: string
  /** Custom metadata */
  metadata?: Record<string, string>
  /** Idempotency key to prevent duplicate charges */
  idempotencyKey?: string
}

/**
 * Result of a payment operation
 */
export interface PaymentResult {
  /** Whether the operation succeeded */
  success: boolean
  /** Unique payment/transaction ID from gateway */
  paymentId: string
  /** Current payment status */
  status: PaymentStatus
  /** Amount processed */
  amount: Money
  /** Payment method used */
  paymentMethod?: PaymentMethodDetails
  /** For 3DS/redirect flows - URL to redirect customer */
  redirectUrl?: string
  /** For 3DS flows - client secret for frontend completion */
  clientSecret?: string
  /** Timestamp of the transaction */
  createdAt: string
  /** Error information if failed */
  error?: PaymentError
  /** Raw response from gateway (for debugging) */
  rawResponse?: Record<string, unknown>
  /** Gateway-specific metadata */
  metadata?: Record<string, unknown>
}

/**
 * Payment error details
 */
export interface PaymentError {
  /** Error code from gateway */
  code: string
  /** Human-readable error message */
  message: string
  /** Error type/category */
  type: 'card_error' | 'validation_error' | 'api_error' | 'authentication_error' | 'rate_limit_error' | 'idempotency_error' | 'invalid_request'
  /** Decline code for card errors */
  declineCode?: string
  /** Parameter that caused the error */
  param?: string
  /** Whether the request can be retried */
  retryable: boolean
}

// ============================================================================
// CAPTURE TYPES
// ============================================================================

/**
 * Request to capture an authorized payment
 */
export interface CaptureRequest {
  /** Payment/authorization ID to capture */
  paymentId: string
  /** Amount to capture (if different from auth amount) */
  amount?: Money
  /** Final order ID */
  orderId?: string
  /** Metadata to add/update */
  metadata?: Record<string, string>
}

/**
 * Result of capture operation
 */
export interface CaptureResult {
  success: boolean
  paymentId: string
  status: PaymentStatus
  amount: Money
  capturedAt: string
  error?: PaymentError
  rawResponse?: Record<string, unknown>
}

// ============================================================================
// VOID TYPES
// ============================================================================

/**
 * Request to void an authorized payment
 */
export interface VoidRequest {
  /** Payment/authorization ID to void */
  paymentId: string
  /** Reason for voiding */
  reason?: string
  /** Metadata to add */
  metadata?: Record<string, string>
}

/**
 * Result of void operation
 */
export interface VoidResult {
  success: boolean
  paymentId: string
  status: PaymentStatus
  voidedAt: string
  error?: PaymentError
  rawResponse?: Record<string, unknown>
}

// ============================================================================
// REFUND TYPES
// ============================================================================

/**
 * Request to refund a payment
 */
export interface RefundRequest {
  /** Payment ID to refund */
  paymentId: string
  /** Amount to refund (omit for full refund) */
  amount?: Money
  /** Reason for refund */
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other'
  /** Detailed reason description */
  reasonDescription?: string
  /** Metadata to add */
  metadata?: Record<string, string>
  /** Idempotency key */
  idempotencyKey?: string
}

/**
 * Result of refund operation
 */
export interface RefundResult {
  success: boolean
  /** Unique refund ID */
  refundId: string
  /** Original payment ID */
  paymentId: string
  /** Refund status */
  status: RefundStatus
  /** Amount refunded */
  amount: Money
  /** Reason provided */
  reason?: string
  /** Timestamp */
  createdAt: string
  /** Error if failed */
  error?: PaymentError
  rawResponse?: Record<string, unknown>
}

// ============================================================================
// CUSTOMER MANAGEMENT TYPES
// ============================================================================

/**
 * Customer record in payment gateway
 */
export interface GatewayCustomer {
  id: string
  email: string
  name?: string
  phone?: string
  defaultPaymentMethod?: string
  paymentMethods: PaymentMethodDetails[]
  metadata?: Record<string, string>
  createdAt: string
  updatedAt?: string
}

/**
 * Request to create a customer
 */
export interface CreateCustomerRequest {
  email: string
  name?: string
  phone?: string
  paymentMethod?: string
  metadata?: Record<string, string>
}

/**
 * Request to update a customer
 */
export interface UpdateCustomerRequest {
  customerId: string
  email?: string
  name?: string
  phone?: string
  defaultPaymentMethod?: string
  metadata?: Record<string, string>
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

/**
 * Subscription status values
 */
export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'trialing'
  | 'paused'
  | 'incomplete'
  | 'incomplete_expired'

/**
 * Billing interval for subscriptions
 */
export type BillingInterval = 'day' | 'week' | 'month' | 'year'

/**
 * Subscription plan/price
 */
export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  amount: Money
  interval: BillingInterval
  intervalCount: number
  trialDays?: number
  metadata?: Record<string, string>
}

/**
 * Subscription record
 */
export interface Subscription {
  id: string
  customerId: string
  planId: string
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  canceledAt?: string
  trialStart?: string
  trialEnd?: string
  metadata?: Record<string, string>
  createdAt: string
  updatedAt?: string
}

/**
 * Request to create a subscription
 */
export interface CreateSubscriptionRequest {
  customerId: string
  planId: string
  paymentMethod?: string
  trialDays?: number
  startDate?: string
  metadata?: Record<string, string>
  coupon?: string
}

/**
 * Request to update a subscription
 */
export interface UpdateSubscriptionRequest {
  subscriptionId: string
  planId?: string
  paymentMethod?: string
  cancelAtPeriodEnd?: boolean
  metadata?: Record<string, string>
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
}

/**
 * Result of subscription operations
 */
export interface SubscriptionResult {
  success: boolean
  subscription?: Subscription
  error?: PaymentError
  rawResponse?: Record<string, unknown>
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Payment webhook event types
 */
export type PaymentWebhookEventType =
  | 'payment.created'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.canceled'
  | 'payment.requires_action'
  | 'payment.refunded'
  | 'payment.disputed'
  | 'refund.created'
  | 'refund.succeeded'
  | 'refund.failed'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'subscription.renewed'
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.payment_failed'

/**
 * Webhook event from payment gateway
 */
export interface PaymentWebhookEvent<T = unknown> {
  id: string
  type: PaymentWebhookEventType
  data: T
  createdAt: string
  livemode: boolean
  /** Gateway-specific event ID */
  gatewayEventId?: string
}

/**
 * Webhook verification result
 */
export interface WebhookVerificationResult {
  valid: boolean
  event?: PaymentWebhookEvent
  error?: string
}

// ============================================================================
// PAYMENT GATEWAY INTERFACE
// ============================================================================

/**
 * Base configuration for payment gateways
 */
export interface PaymentGatewayConfig {
  /** API key or secret key */
  apiKey: string
  /** Public/publishable key (for client-side) */
  publicKey?: string
  /** Webhook signing secret */
  webhookSecret?: string
  /** Use sandbox/test mode */
  testMode?: boolean
  /** API version to use */
  apiVersion?: string
  /** Request timeout in ms */
  timeout?: number
  /** Custom metadata to include in all requests */
  metadata?: Record<string, string>
}

/**
 * Payment Gateway Interface
 *
 * All payment gateway implementations must implement this interface.
 * Provides a consistent API for processing payments across different providers.
 */
export interface PaymentGateway {
  /** Gateway identifier */
  readonly name: string
  /** Gateway display name */
  readonly displayName: string
  /** Whether gateway is connected/configured */
  readonly isConnected: boolean
  /** Supported payment methods */
  readonly supportedMethods: PaymentMethodType[]

  // ========================================
  // Connection Management
  // ========================================

  /**
   * Connect to the gateway (validate credentials)
   */
  connect(): Promise<boolean>

  /**
   * Disconnect from the gateway
   */
  disconnect(): void

  // ========================================
  // Payment Operations
  // ========================================

  /**
   * Process a payment (authorize and optionally capture)
   */
  processPayment(request: PaymentRequest): Promise<PaymentResult>

  /**
   * Capture a previously authorized payment
   */
  capturePayment(request: CaptureRequest): Promise<CaptureResult>

  /**
   * Void an authorized payment (before capture)
   */
  voidPayment(request: VoidRequest): Promise<VoidResult>

  /**
   * Refund a captured payment
   */
  refundPayment(request: RefundRequest): Promise<RefundResult>

  /**
   * Get payment details by ID
   */
  getPayment(paymentId: string): Promise<PaymentResult>

  // ========================================
  // Customer Management (Optional)
  // ========================================

  /**
   * Create a customer in the gateway
   */
  createCustomer?(request: CreateCustomerRequest): Promise<GatewayCustomer>

  /**
   * Update a customer
   */
  updateCustomer?(request: UpdateCustomerRequest): Promise<GatewayCustomer>

  /**
   * Get customer by ID
   */
  getCustomer?(customerId: string): Promise<GatewayCustomer | null>

  /**
   * Delete a customer
   */
  deleteCustomer?(customerId: string): Promise<boolean>

  // ========================================
  // Subscription Management (Optional)
  // ========================================

  /**
   * Create a subscription
   */
  createSubscription?(request: CreateSubscriptionRequest): Promise<SubscriptionResult>

  /**
   * Update a subscription
   */
  updateSubscription?(request: UpdateSubscriptionRequest): Promise<SubscriptionResult>

  /**
   * Cancel a subscription
   */
  cancelSubscription?(subscriptionId: string, cancelImmediately?: boolean): Promise<SubscriptionResult>

  /**
   * Get subscription by ID
   */
  getSubscription?(subscriptionId: string): Promise<Subscription | null>

  // ========================================
  // Webhook Handling
  // ========================================

  /**
   * Verify webhook signature and parse event
   */
  verifyWebhook(payload: string | Buffer, signature: string): WebhookVerificationResult

  /**
   * Handle a verified webhook event
   */
  handleWebhookEvent?(event: PaymentWebhookEvent): Promise<void>
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

/**
 * Base payment gateway error
 */
export class PaymentGatewayError extends Error {
  readonly code: string
  readonly type: PaymentError['type']
  readonly retryable: boolean
  readonly details?: Record<string, unknown>

  constructor(
    message: string,
    code: string,
    type: PaymentError['type'],
    retryable: boolean = false,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'PaymentGatewayError'
    this.code = code
    this.type = type
    this.retryable = retryable
    this.details = details
  }

  toPaymentError(): PaymentError {
    return {
      code: this.code,
      message: this.message,
      type: this.type,
      retryable: this.retryable,
    }
  }
}

/**
 * Card-specific error
 */
export class CardError extends PaymentGatewayError {
  readonly declineCode?: string

  constructor(
    message: string,
    declineCode?: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'card_declined', 'card_error', false, details)
    this.name = 'CardError'
    this.declineCode = declineCode
  }

  toPaymentError(): PaymentError {
    return {
      ...super.toPaymentError(),
      declineCode: this.declineCode,
    }
  }
}

/**
 * Authentication error (invalid API key, etc.)
 */
export class PaymentAuthError extends PaymentGatewayError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'authentication_failed', 'authentication_error', false, details)
    this.name = 'PaymentAuthError'
  }
}

/**
 * Rate limit error
 */
export class PaymentRateLimitError extends PaymentGatewayError {
  readonly retryAfter?: number

  constructor(
    message: string,
    retryAfter?: number,
    details?: Record<string, unknown>
  ) {
    super(message, 'rate_limit_exceeded', 'rate_limit_error', true, details)
    this.name = 'PaymentRateLimitError'
    this.retryAfter = retryAfter
  }
}

/**
 * Validation error (invalid parameters)
 */
export class PaymentValidationError extends PaymentGatewayError {
  readonly param?: string

  constructor(
    message: string,
    param?: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'invalid_params', 'validation_error', false, details)
    this.name = 'PaymentValidationError'
    this.param = param
  }

  toPaymentError(): PaymentError {
    return {
      ...super.toPaymentError(),
      param: this.param,
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert amount to smallest currency unit
 */
export function toSmallestUnit(amount: number, currency: CurrencyCode): number {
  // Zero-decimal currencies
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'PYG', 'UGX', 'RWF', 'DJF', 'GNF', 'XAF', 'XOF', 'XPF']

  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount)
  }

  // Most currencies have 2 decimal places
  return Math.round(amount * 100)
}

/**
 * Convert from smallest currency unit to decimal
 */
export function fromSmallestUnit(amount: number, currency: CurrencyCode): number {
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'PYG', 'UGX', 'RWF', 'DJF', 'GNF', 'XAF', 'XOF', 'XPF']

  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return amount
  }

  return amount / 100
}

/**
 * Format money for display
 */
export function formatMoney(money: Money): string {
  const amount = fromSmallestUnit(money.amount, money.currency)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currency,
  }).format(amount)
}

/**
 * Create a Money object from decimal amount
 */
export function createMoney(amount: number, currency: CurrencyCode): Money {
  return {
    amount: toSmallestUnit(amount, currency),
    currency,
  }
}

/**
 * Check if a payment status indicates success
 */
export function isPaymentSuccessful(status: PaymentStatus): boolean {
  return ['succeeded', 'captured', 'authorized'].includes(status)
}

/**
 * Check if a payment can be refunded
 */
export function canRefund(status: PaymentStatus): boolean {
  return ['succeeded', 'captured', 'partially_refunded'].includes(status)
}

/**
 * Check if a payment can be captured
 */
export function canCapture(status: PaymentStatus): boolean {
  return status === 'authorized' || status === 'requires_capture'
}

/**
 * Check if a payment can be voided
 */
export function canVoid(status: PaymentStatus): boolean {
  return status === 'authorized' || status === 'requires_capture'
}

/**
 * Generate an idempotency key
 */
export function generateIdempotencyKey(prefix?: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`
}

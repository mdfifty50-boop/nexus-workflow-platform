/**
 * Stripe Webhook Type Definitions
 *
 * Type definitions for Stripe webhook event handling including:
 * - Event types and payloads
 * - Handler interfaces
 * - Processing results
 * - Configuration types
 * - Event metadata
 */

// =============================================================================
// EVENT TYPE CONSTANTS
// =============================================================================

/**
 * Supported Stripe webhook event types
 */
export const WEBHOOK_EVENT_TYPES = {
  // Subscription events
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  SUBSCRIPTION_TRIAL_WILL_END: 'customer.subscription.trial_will_end',
  SUBSCRIPTION_PAUSED: 'customer.subscription.paused',
  SUBSCRIPTION_RESUMED: 'customer.subscription.resumed',

  // Payment events
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
  PAYMENT_INTENT_CANCELED: 'payment_intent.canceled',
  CHARGE_REFUNDED: 'charge.refunded',
  CHARGE_DISPUTE_CREATED: 'charge.dispute.created',

  // Invoice events
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  INVOICE_UPCOMING: 'invoice.upcoming',
  INVOICE_FINALIZED: 'invoice.finalized',

  // Customer events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',
} as const

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[keyof typeof WEBHOOK_EVENT_TYPES]

// =============================================================================
// EVENT STATUS
// =============================================================================

/**
 * Event processing status values
 */
export const EVENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  RETRYING: 'retrying',
} as const

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS]

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * Base Stripe event structure
 */
export interface StripeWebhookEvent<T = unknown> {
  id: string
  object: 'event'
  apiVersion: string | null
  created: number
  data: {
    object: T
    previousAttributes?: Partial<T>
  }
  livemode: boolean
  pendingWebhooks: number
  request: {
    id: string | null
    idempotencyKey: string | null
  } | null
  type: string
}

/**
 * Webhook event metadata for tracking
 */
export interface EventMetadata {
  eventId: string
  eventType: string
  receivedAt: Date
  processedAt?: Date
  processingTimeMs?: number
  attempts: number
  lastAttemptAt?: Date
  source: 'stripe' | 'test' | 'replay'
  environment: 'live' | 'test'
  idempotencyKey?: string
  correlationId?: string
}

/**
 * Event processing result
 */
export interface ProcessingResult<T = unknown> {
  success: boolean
  eventId: string
  eventType: string
  status: EventStatus
  message?: string
  data?: T
  error?: ProcessingError
  metadata: EventMetadata
  shouldRetry?: boolean
  retryAfterMs?: number
}

/**
 * Processing error details
 */
export interface ProcessingError {
  code: string
  message: string
  recoverable: boolean
  details?: Record<string, unknown>
  stack?: string
}

// =============================================================================
// HANDLER INTERFACES
// =============================================================================

/**
 * Event handler function signature
 */
export type EventHandlerFn<T = unknown, R = unknown> = (
  event: StripeWebhookEvent<T>,
  metadata: EventMetadata
) => Promise<ProcessingResult<R>>

/**
 * Event handler configuration
 */
export interface EventHandler<T = unknown, R = unknown> {
  eventType: WebhookEventType | string
  handler: EventHandlerFn<T, R>
  enabled: boolean
  priority: number
  retryConfig?: RetryConfig
  timeout?: number
}

/**
 * Handler registry map
 */
export type HandlerRegistry = Map<string, EventHandler[]>

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * Webhook handler configuration
 */
export interface WebhookConfig {
  /**
   * Stripe webhook signing secret
   */
  signingSecret: string

  /**
   * Enable signature verification
   */
  verifySignature: boolean

  /**
   * Tolerance for timestamp verification (in seconds)
   */
  timestampTolerance: number

  /**
   * Enable idempotency checking
   */
  enableIdempotency: boolean

  /**
   * Idempotency TTL in milliseconds
   */
  idempotencyTtl: number

  /**
   * Enable event logging
   */
  enableLogging: boolean

  /**
   * Log level
   */
  logLevel: 'debug' | 'info' | 'warn' | 'error'

  /**
   * Enable event persistence
   */
  persistEvents: boolean

  /**
   * Default retry configuration
   */
  defaultRetryConfig: RetryConfig

  /**
   * Handler timeout in milliseconds
   */
  handlerTimeout: number

  /**
   * Maximum concurrent handlers
   */
  maxConcurrentHandlers: number

  /**
   * Enable test mode
   */
  testMode: boolean
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /**
   * Maximum retry attempts
   */
  maxAttempts: number

  /**
   * Initial delay in milliseconds
   */
  initialDelayMs: number

  /**
   * Maximum delay in milliseconds
   */
  maxDelayMs: number

  /**
   * Backoff multiplier
   */
  backoffMultiplier: number

  /**
   * Jitter factor (0-1)
   */
  jitterFactor: number

  /**
   * Retryable error codes
   */
  retryableErrors: string[]
}

// =============================================================================
// STRIPE OBJECT TYPES
// =============================================================================

/**
 * Stripe Subscription object (webhook payload)
 */
export interface StripeSubscriptionObject {
  id: string
  object: 'subscription'
  application: string | null
  applicationFeePercent: number | null
  automaticTax: {
    enabled: boolean
    status: string | null
  }
  billingCycleAnchor: number
  billingThresholds: unknown | null
  cancelAt: number | null
  cancelAtPeriodEnd: boolean
  canceledAt: number | null
  collectionMethod: 'charge_automatically' | 'send_invoice'
  created: number
  currency: string
  currentPeriodEnd: number
  currentPeriodStart: number
  customer: string
  daysUntilDue: number | null
  defaultPaymentMethod: string | null
  defaultSource: string | null
  defaultTaxRates: Array<{
    id: string
    displayName: string
    percentage: number
  }>
  description: string | null
  discount: unknown | null
  endedAt: number | null
  items: {
    object: 'list'
    data: Array<{
      id: string
      price: {
        id: string
        product: string
        unitAmount: number | null
        currency: string
        recurring: {
          interval: 'day' | 'week' | 'month' | 'year'
          intervalCount: number
        } | null
      }
      quantity: number
    }>
  }
  latestInvoice: string | null
  livemode: boolean
  metadata: Record<string, string>
  nextPendingInvoiceItemInvoice: number | null
  onBehalfOf: string | null
  pauseCollection: {
    behavior: 'keep_as_draft' | 'mark_uncollectible' | 'void'
    resumesAt: number | null
  } | null
  paymentSettings: unknown
  pendingInvoiceItemInterval: unknown | null
  pendingSetupIntent: string | null
  pendingUpdate: unknown | null
  schedule: string | null
  startDate: number
  status:
    | 'active'
    | 'canceled'
    | 'incomplete'
    | 'incomplete_expired'
    | 'past_due'
    | 'paused'
    | 'trialing'
    | 'unpaid'
  testClock: string | null
  transferData: unknown | null
  trialEnd: number | null
  trialSettings: unknown
  trialStart: number | null
}

/**
 * Stripe PaymentIntent object (webhook payload)
 */
export interface StripePaymentIntentObject {
  id: string
  object: 'payment_intent'
  amount: number
  amountCapturable: number
  amountDetails?: {
    tip?: {
      amount: number
    }
  }
  amountReceived: number
  application: string | null
  applicationFeeAmount: number | null
  automaticPaymentMethods: unknown | null
  canceledAt: number | null
  cancellationReason: string | null
  captureMethod: 'automatic' | 'manual'
  charges?: {
    object: 'list'
    data: StripeChargeObject[]
  }
  clientSecret: string | null
  confirmationMethod: 'automatic' | 'manual'
  created: number
  currency: string
  customer: string | null
  description: string | null
  invoice: string | null
  lastPaymentError: {
    code: string
    message: string
    type: string
  } | null
  latestCharge: string | null
  livemode: boolean
  metadata: Record<string, string>
  nextAction: unknown | null
  onBehalfOf: string | null
  paymentMethod: string | null
  paymentMethodOptions: unknown
  paymentMethodTypes: string[]
  processing: unknown | null
  receiptEmail: string | null
  review: string | null
  setupFutureUsage: 'off_session' | 'on_session' | null
  shipping: unknown | null
  source: string | null
  statementDescriptor: string | null
  statementDescriptorSuffix: string | null
  status:
    | 'canceled'
    | 'processing'
    | 'requires_action'
    | 'requires_capture'
    | 'requires_confirmation'
    | 'requires_payment_method'
    | 'succeeded'
  transferData: unknown | null
  transferGroup: string | null
}

/**
 * Stripe Charge object (webhook payload)
 */
export interface StripeChargeObject {
  id: string
  object: 'charge'
  amount: number
  amountCaptured: number
  amountRefunded: number
  application: string | null
  applicationFee: string | null
  applicationFeeAmount: number | null
  balanceTransaction: string | null
  billingDetails: {
    address: {
      city: string | null
      country: string | null
      line1: string | null
      line2: string | null
      postalCode: string | null
      state: string | null
    }
    email: string | null
    name: string | null
    phone: string | null
  }
  calculated_statement_descriptor: string | null
  captured: boolean
  created: number
  currency: string
  customer: string | null
  description: string | null
  destination: string | null
  dispute: string | null
  disputed: boolean
  failureBalanceTransaction: string | null
  failureCode: string | null
  failureMessage: string | null
  fraudDetails: {
    stripeReport: string | null
    userReport: string | null
  }
  invoice: string | null
  livemode: boolean
  metadata: Record<string, string>
  onBehalfOf: string | null
  order: string | null
  outcome: {
    networkStatus: string | null
    reason: string | null
    riskLevel: string | null
    riskScore: number | null
    sellerMessage: string | null
    type: string
  } | null
  paid: boolean
  paymentIntent: string | null
  paymentMethod: string | null
  paymentMethodDetails: unknown
  receiptEmail: string | null
  receiptNumber: string | null
  receiptUrl: string | null
  refunded: boolean
  refunds: {
    object: 'list'
    data: Array<{
      id: string
      amount: number
      created: number
      currency: string
      status: string
    }>
  }
  review: string | null
  shipping: unknown | null
  source: unknown | null
  sourceTransfer: string | null
  statementDescriptor: string | null
  statementDescriptorSuffix: string | null
  status: 'failed' | 'pending' | 'succeeded'
  transferData: unknown | null
  transferGroup: string | null
}

/**
 * Stripe Invoice object (webhook payload)
 */
export interface StripeInvoiceObject {
  id: string
  object: 'invoice'
  accountCountry: string | null
  accountName: string | null
  accountTaxIds: unknown[] | null
  amountDue: number
  amountPaid: number
  amountRemaining: number
  amountShipping: number
  application: string | null
  applicationFeeAmount: number | null
  attemptCount: number
  attempted: boolean
  autoAdvance: boolean
  automaticTax: {
    enabled: boolean
    status: string | null
  }
  billingReason:
    | 'automatic_pending_invoice_item_invoice'
    | 'manual'
    | 'quote_accept'
    | 'subscription'
    | 'subscription_create'
    | 'subscription_cycle'
    | 'subscription_threshold'
    | 'subscription_update'
    | 'upcoming'
    | null
  charge: string | null
  collectionMethod: 'charge_automatically' | 'send_invoice'
  created: number
  currency: string
  customFields: unknown[] | null
  customer: string
  customerAddress: unknown | null
  customerEmail: string | null
  customerName: string | null
  customerPhone: string | null
  customerShipping: unknown | null
  customerTaxExempt: 'exempt' | 'none' | 'reverse' | null
  customerTaxIds: unknown[] | null
  defaultPaymentMethod: string | null
  defaultSource: string | null
  defaultTaxRates: unknown[]
  description: string | null
  discount: unknown | null
  discounts: unknown[]
  dueDate: number | null
  effectiveAt: number | null
  endingBalance: number | null
  footer: string | null
  fromInvoice: unknown | null
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
  lastFinalizationError: unknown | null
  latestRevision: string | null
  lines: {
    object: 'list'
    data: Array<{
      id: string
      amount: number
      currency: string
      description: string | null
      periodEnd: number
      periodStart: number
      price: {
        id: string
        unitAmount: number | null
      }
      proration: boolean
      quantity: number
      subscription: string | null
      subscriptionItem: string | null
    }>
  }
  livemode: boolean
  metadata: Record<string, string>
  nextPaymentAttempt: number | null
  number: string | null
  onBehalfOf: string | null
  paid: boolean
  paidOutOfBand: boolean
  paymentIntent: string | null
  paymentSettings: unknown
  periodEnd: number
  periodStart: number
  postPaymentCreditNotesAmount: number
  prePaymentCreditNotesAmount: number
  quote: string | null
  receiptNumber: string | null
  renderingOptions: unknown | null
  shippingCost: unknown | null
  shippingDetails: unknown | null
  startingBalance: number
  statementDescriptor: string | null
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void' | null
  statusTransitions: {
    finalizedAt: number | null
    markedUncollectibleAt: number | null
    paidAt: number | null
    voidedAt: number | null
  }
  subscription: string | null
  subscriptionDetails: {
    metadata: Record<string, string>
  } | null
  subscriptionProrationDate: number | null
  subtotal: number
  subtotalExcludingTax: number | null
  tax: number | null
  testClock: string | null
  thresholdReason: unknown | null
  total: number
  totalDiscountAmounts: unknown[]
  totalExcludingTax: number | null
  totalTaxAmounts: unknown[]
  transferData: unknown | null
  webhooksDeliveredAt: number | null
}

/**
 * Stripe Customer object (webhook payload)
 */
export interface StripeCustomerObject {
  id: string
  object: 'customer'
  address: {
    city: string | null
    country: string | null
    line1: string | null
    line2: string | null
    postalCode: string | null
    state: string | null
  } | null
  balance: number
  created: number
  currency: string | null
  defaultSource: string | null
  delinquent: boolean
  description: string | null
  discount: unknown | null
  email: string | null
  invoicePrefix: string | null
  invoiceSettings: {
    customFields: unknown[] | null
    defaultPaymentMethod: string | null
    footer: string | null
    renderingOptions: unknown | null
  }
  livemode: boolean
  metadata: Record<string, string>
  name: string | null
  nextInvoiceSequence: number
  phone: string | null
  preferredLocales: string[]
  shipping: unknown | null
  sources?: {
    object: 'list'
    data: unknown[]
  }
  subscriptions?: {
    object: 'list'
    data: StripeSubscriptionObject[]
  }
  tax: unknown | null
  taxExempt: 'exempt' | 'none' | 'reverse' | null
  taxIds?: {
    object: 'list'
    data: unknown[]
  }
  testClock: string | null
}

/**
 * Stripe Dispute object (webhook payload)
 */
export interface StripeDisputeObject {
  id: string
  object: 'dispute'
  amount: number
  balanceTransactions: unknown[]
  charge: string
  created: number
  currency: string
  evidence: unknown
  evidenceDetails: {
    dueBy: number | null
    hasEvidence: boolean
    pastDue: boolean
    submissionCount: number
  }
  isChargeRefundable: boolean
  livemode: boolean
  metadata: Record<string, string>
  paymentIntent: string | null
  reason: string
  status:
    | 'charge_refunded'
    | 'lost'
    | 'needs_response'
    | 'under_review'
    | 'warning_closed'
    | 'warning_needs_response'
    | 'warning_under_review'
    | 'won'
}

// =============================================================================
// AUDIT TYPES
// =============================================================================

/**
 * Audit log entry for webhook events
 */
export interface WebhookAuditLog {
  id: string
  eventId: string
  eventType: string
  timestamp: Date
  status: EventStatus
  processingTimeMs: number
  attempts: number
  customerId?: string
  subscriptionId?: string
  invoiceId?: string
  paymentIntentId?: string
  chargeId?: string
  amount?: number
  currency?: string
  error?: ProcessingError
  metadata?: Record<string, unknown>
}

/**
 * Event storage record
 */
export interface EventStorageRecord {
  id: string
  eventId: string
  eventType: string
  payload: string // JSON stringified
  signature?: string
  receivedAt: Date
  processedAt?: Date
  status: EventStatus
  attempts: number
  lastError?: string
  metadata?: Record<string, unknown>
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Webhook event categories
 */
export const EVENT_CATEGORIES = {
  SUBSCRIPTION: 'subscription',
  PAYMENT: 'payment',
  INVOICE: 'invoice',
  CUSTOMER: 'customer',
} as const

export type EventCategory = (typeof EVENT_CATEGORIES)[keyof typeof EVENT_CATEGORIES]

/**
 * Get event category from event type
 */
export function getEventCategory(eventType: string): EventCategory | null {
  if (eventType.startsWith('customer.subscription.')) {
    return EVENT_CATEGORIES.SUBSCRIPTION
  }
  if (eventType.startsWith('payment_intent.') || eventType.startsWith('charge.')) {
    return EVENT_CATEGORIES.PAYMENT
  }
  if (eventType.startsWith('invoice.')) {
    return EVENT_CATEGORIES.INVOICE
  }
  if (eventType.startsWith('customer.') && !eventType.includes('subscription')) {
    return EVENT_CATEGORIES.CUSTOMER
  }
  return null
}

/**
 * Check if event type is supported
 */
export function isSupportedEventType(eventType: string): eventType is WebhookEventType {
  return Object.values(WEBHOOK_EVENT_TYPES).includes(eventType as WebhookEventType)
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  retryableErrors: [
    'NETWORK_ERROR',
    'TIMEOUT',
    'DATABASE_ERROR',
    'RATE_LIMITED',
    'SERVICE_UNAVAILABLE',
  ],
}

/**
 * Default webhook configuration
 */
export const DEFAULT_WEBHOOK_CONFIG: Omit<WebhookConfig, 'signingSecret'> = {
  verifySignature: true,
  timestampTolerance: 300, // 5 minutes
  enableIdempotency: true,
  idempotencyTtl: 24 * 60 * 60 * 1000, // 24 hours
  enableLogging: true,
  logLevel: 'info',
  persistEvents: true,
  defaultRetryConfig: DEFAULT_RETRY_CONFIG,
  handlerTimeout: 30000, // 30 seconds
  maxConcurrentHandlers: 10,
  testMode: false,
}

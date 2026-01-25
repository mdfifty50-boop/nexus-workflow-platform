/**
 * Stripe Webhooks Module
 *
 * Comprehensive webhook handling system for Stripe subscription lifecycle events.
 *
 * Features:
 * - Webhook signature verification
 * - Event type routing
 * - Idempotency handling
 * - Event logging and audit trail
 * - Error handling with retry logic
 * - Event status tracking
 *
 * Supported Events:
 * - Subscription: created, updated, deleted, trial_will_end, paused, resumed
 * - Payment: succeeded, failed, canceled, refunded, dispute_created
 * - Invoice: created, paid, payment_failed, upcoming, finalized
 *
 * Usage:
 * ```typescript
 * import { getWebhookHandler, processWebhookEvent } from './payments/webhooks'
 *
 * // In your webhook endpoint handler:
 * const handler = getWebhookHandler(process.env.STRIPE_WEBHOOK_SECRET)
 * const result = await handler.processEvent(rawBody, signature)
 *
 * if (result.success) {
 *   // Event processed successfully
 * } else if (result.shouldRetry) {
 *   // Schedule retry
 * }
 * ```
 */

// =============================================================================
// MAIN HANDLER
// =============================================================================

export {
  StripeWebhookHandler,
  createWebhookHandler,
  getWebhookHandler,
  IdempotencyStore,
  WebhookLogger,
} from './stripe-webhook-handler'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type {
  // Core types
  StripeWebhookEvent,
  EventMetadata,
  ProcessingResult,
  ProcessingError,

  // Handler types
  EventHandler,
  EventHandlerFn,
  HandlerRegistry,

  // Configuration types
  WebhookConfig,
  RetryConfig,

  // Stripe object types
  StripeSubscriptionObject,
  StripePaymentIntentObject,
  StripeChargeObject,
  StripeInvoiceObject,
  StripeCustomerObject,
  StripeDisputeObject,

  // Audit types
  WebhookAuditLog,
  EventStorageRecord,

  // Event types
  WebhookEventType,
  EventStatus,
  EventCategory,
} from './webhook-types'

export {
  WEBHOOK_EVENT_TYPES,
  EVENT_STATUS,
  EVENT_CATEGORIES,
  DEFAULT_WEBHOOK_CONFIG,
  DEFAULT_RETRY_CONFIG,
  isSupportedEventType,
  getEventCategory,
} from './webhook-types'

// =============================================================================
// SUBSCRIPTION EVENTS
// =============================================================================

export type {
  SubscriptionEventResult,
  SubscriptionChanges,
  InternalSubscriptionStatus,
} from './subscription-events'

export {
  subscriptionEventHandlers,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleSubscriptionTrialWillEnd,
  handleSubscriptionPaused,
  handleSubscriptionResumed,
  extractSubscriptionData,
  detectSubscriptionChanges,
  SUBSCRIPTION_STATUS_MAP,
} from './subscription-events'

// =============================================================================
// PAYMENT EVENTS
// =============================================================================

export type {
  PaymentEventResult,
  PaymentFailureInfo,
  RefundInfo,
  DisputeInfo,
  InternalPaymentStatus,
} from './payment-events'

export {
  paymentEventHandlers,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handlePaymentIntentCanceled,
  handleChargeRefunded,
  handleChargeDisputeCreated,
  extractPaymentIntentData,
  extractChargeData,
  extractFailureInfo,
  PAYMENT_STATUS_MAP,
} from './payment-events'

// =============================================================================
// INVOICE EVENTS
// =============================================================================

export type {
  InvoiceEventResult,
  InvoiceLineItem,
  InvoiceFailureInfo,
  InternalInvoiceStatus,
} from './invoice-events'

export {
  invoiceEventHandlers,
  handleInvoiceCreated,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleInvoiceUpcoming,
  handleInvoiceFinalized,
  extractInvoiceData,
  extractLineItems,
  INVOICE_STATUS_MAP,
} from './invoice-events'

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

import { getWebhookHandler } from './stripe-webhook-handler'
import type { ProcessingResult } from './webhook-types'

/**
 * Process a Stripe webhook event
 *
 * Convenience function that uses the singleton webhook handler.
 *
 * @param payload - Raw request body (JSON string)
 * @param signature - Stripe-Signature header value
 * @returns Processing result
 */
export async function processWebhookEvent(
  payload: string,
  signature?: string
): Promise<ProcessingResult> {
  const handler = getWebhookHandler()
  return handler.processEvent(payload, signature)
}

/**
 * Verify a Stripe webhook signature
 *
 * @param payload - Raw request body
 * @param signature - Stripe-Signature header value
 * @returns Whether the signature is valid
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const handler = getWebhookHandler()
  return handler.verifySignature(payload, signature)
}

/**
 * Get webhook handler health status
 *
 * @returns Health status object
 */
export function getWebhookHealth(): {
  healthy: boolean
  handlers: number
  config: Record<string, unknown>
} {
  const handler = getWebhookHandler()
  return {
    healthy: handler.isHealthy(),
    handlers: Object.keys(handler.getHandlerStats()).length,
    config: handler.getConfig(),
  }
}

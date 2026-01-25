/**
 * Payment Event Handlers
 *
 * Handles Stripe payment-related events:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - payment_intent.canceled
 * - charge.refunded
 * - charge.dispute.created
 */

import type {
  StripeWebhookEvent,
  StripePaymentIntentObject,
  StripeChargeObject,
  StripeDisputeObject,
  EventMetadata,
  ProcessingResult,
  EventHandler,
  ProcessingError,
} from './webhook-types'

import { WEBHOOK_EVENT_TYPES, EVENT_STATUS } from './webhook-types'

// =============================================================================
// PAYMENT STATUS MAPPING
// =============================================================================

/**
 * Map Stripe payment intent status to internal status
 */
const PAYMENT_STATUS_MAP = {
  succeeded: 'completed',
  processing: 'processing',
  requires_action: 'action_required',
  requires_capture: 'pending_capture',
  requires_confirmation: 'pending_confirmation',
  requires_payment_method: 'payment_required',
  canceled: 'canceled',
} as const

export type InternalPaymentStatus =
  (typeof PAYMENT_STATUS_MAP)[keyof typeof PAYMENT_STATUS_MAP]

// =============================================================================
// HANDLER RESULT TYPES
// =============================================================================

/**
 * Payment event result data
 */
export interface PaymentEventResult {
  paymentIntentId?: string
  chargeId?: string
  disputeId?: string
  customerId?: string
  amount: number
  amountReceived?: number
  amountRefunded?: number
  currency: string
  status: string
  description?: string
  invoiceId?: string
  metadata?: Record<string, string>
  action: 'payment_succeeded' | 'payment_failed' | 'payment_canceled' | 'refunded' | 'dispute_created'
  failureReason?: PaymentFailureInfo
  refundInfo?: RefundInfo
  disputeInfo?: DisputeInfo
}

/**
 * Payment failure details
 */
export interface PaymentFailureInfo {
  code: string
  message: string
  declineCode?: string
  networkStatus?: string
  type: string
}

/**
 * Refund details
 */
export interface RefundInfo {
  refundId: string
  amount: number
  reason?: string
  status: string
  createdAt: Date
}

/**
 * Dispute details
 */
export interface DisputeInfo {
  disputeId: string
  amount: number
  reason: string
  status: string
  dueBy?: Date
  hasEvidence: boolean
  isRefundable: boolean
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract payment intent data
 */
function extractPaymentIntentData(
  paymentIntent: StripePaymentIntentObject
): Omit<PaymentEventResult, 'action' | 'failureReason' | 'refundInfo' | 'disputeInfo'> {
  return {
    paymentIntentId: paymentIntent.id,
    customerId: paymentIntent.customer || undefined,
    amount: paymentIntent.amount,
    amountReceived: paymentIntent.amountReceived,
    currency: paymentIntent.currency,
    status: PAYMENT_STATUS_MAP[paymentIntent.status] || paymentIntent.status,
    description: paymentIntent.description || undefined,
    invoiceId: paymentIntent.invoice || undefined,
    metadata: paymentIntent.metadata,
  }
}

/**
 * Extract charge data
 */
function extractChargeData(
  charge: StripeChargeObject
): Omit<PaymentEventResult, 'action' | 'failureReason' | 'refundInfo' | 'disputeInfo'> {
  return {
    chargeId: charge.id,
    paymentIntentId: charge.paymentIntent || undefined,
    customerId: charge.customer || undefined,
    amount: charge.amount,
    amountRefunded: charge.amountRefunded,
    currency: charge.currency,
    status: charge.status,
    description: charge.description || undefined,
    invoiceId: charge.invoice || undefined,
    metadata: charge.metadata,
  }
}

/**
 * Extract payment failure info
 */
function extractFailureInfo(
  paymentIntent: StripePaymentIntentObject
): PaymentFailureInfo | undefined {
  const error = paymentIntent.lastPaymentError
  if (!error) {
    return undefined
  }

  return {
    code: error.code,
    message: error.message,
    type: error.type,
  }
}

/**
 * Create a processing error
 */
function createError(code: string, message: string, recoverable: boolean): ProcessingError {
  return {
    code,
    message,
    recoverable,
  }
}

// =============================================================================
// PAYMENT INTENT SUCCEEDED HANDLER
// =============================================================================

/**
 * Handle payment_intent.succeeded event
 *
 * Triggered when a payment is successfully completed.
 * Actions:
 * - Record successful payment
 * - Update subscription status if applicable
 * - Send payment confirmation
 * - Log revenue event
 */
async function handlePaymentIntentSucceeded(
  event: StripeWebhookEvent<StripePaymentIntentObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<PaymentEventResult>> {
  const paymentIntent = event.data.object
  const startTime = Date.now()

  try {
    const paymentData = extractPaymentIntentData(paymentIntent)

    console.log('[Webhook] Payment succeeded:', {
      paymentIntentId: paymentIntent.id,
      customerId: paymentIntent.customer,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      invoiceId: paymentIntent.invoice,
    })

    // TODO: Record payment in database
    // await database.payments.create({
    //   stripePaymentIntentId: paymentIntent.id,
    //   stripeCustomerId: paymentIntent.customer,
    //   amount: paymentIntent.amount,
    //   currency: paymentIntent.currency,
    //   status: 'succeeded',
    //   invoiceId: paymentIntent.invoice,
    //   createdAt: new Date(),
    // })

    // TODO: Send payment confirmation email
    // if (paymentIntent.receiptEmail) {
    //   await emailService.sendPaymentConfirmation({
    //     email: paymentIntent.receiptEmail,
    //     amount: paymentIntent.amount,
    //     currency: paymentIntent.currency,
    //   })
    // }

    // TODO: Log revenue event for analytics
    // await analyticsService.trackRevenue({
    //   customerId: paymentIntent.customer,
    //   amount: paymentIntent.amount,
    //   currency: paymentIntent.currency,
    //   source: 'subscription',
    // })

    const result: PaymentEventResult = {
      ...paymentData,
      action: 'payment_succeeded',
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: `Payment of ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()} succeeded`,
      data: result,
      metadata: {
        ...metadata,
        processedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.FAILED,
      error: createError('PAYMENT_RECORD_FAILED', errorMessage, true),
      metadata: {
        ...metadata,
        processedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      },
      shouldRetry: true,
    }
  }
}

// =============================================================================
// PAYMENT INTENT FAILED HANDLER
// =============================================================================

/**
 * Handle payment_intent.payment_failed event
 *
 * Triggered when a payment attempt fails.
 * Actions:
 * - Record failed payment attempt
 * - Update subscription status if applicable
 * - Send payment failure notification
 * - Trigger retry logic or dunning flow
 */
async function handlePaymentIntentFailed(
  event: StripeWebhookEvent<StripePaymentIntentObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<PaymentEventResult>> {
  const paymentIntent = event.data.object
  const startTime = Date.now()

  try {
    const paymentData = extractPaymentIntentData(paymentIntent)
    const failureInfo = extractFailureInfo(paymentIntent)

    console.log('[Webhook] Payment failed:', {
      paymentIntentId: paymentIntent.id,
      customerId: paymentIntent.customer,
      amount: paymentIntent.amount,
      failureCode: failureInfo?.code,
      failureMessage: failureInfo?.message,
    })

    // TODO: Record failed payment
    // await database.paymentAttempts.create({
    //   stripePaymentIntentId: paymentIntent.id,
    //   stripeCustomerId: paymentIntent.customer,
    //   amount: paymentIntent.amount,
    //   currency: paymentIntent.currency,
    //   status: 'failed',
    //   failureCode: failureInfo?.code,
    //   failureMessage: failureInfo?.message,
    //   createdAt: new Date(),
    // })

    // TODO: Send payment failure notification
    // await emailService.sendPaymentFailed({
    //   customerId: paymentIntent.customer,
    //   amount: paymentIntent.amount,
    //   currency: paymentIntent.currency,
    //   failureReason: failureInfo?.message,
    //   updatePaymentMethodUrl: `${process.env.APP_URL}/settings/billing`,
    // })

    // TODO: Trigger dunning flow
    // await dunningService.handleFailedPayment({
    //   customerId: paymentIntent.customer,
    //   paymentIntentId: paymentIntent.id,
    //   attemptCount: paymentIntent.metadata?.attempt_count || 1,
    // })

    const result: PaymentEventResult = {
      ...paymentData,
      action: 'payment_failed',
      failureReason: failureInfo,
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: `Payment failed: ${failureInfo?.message || 'Unknown reason'}`,
      data: result,
      metadata: {
        ...metadata,
        processedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.FAILED,
      error: createError('PAYMENT_FAILURE_HANDLING_ERROR', errorMessage, true),
      metadata: {
        ...metadata,
        processedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      },
      shouldRetry: true,
    }
  }
}

// =============================================================================
// PAYMENT INTENT CANCELED HANDLER
// =============================================================================

/**
 * Handle payment_intent.canceled event
 *
 * Triggered when a payment intent is canceled.
 * Actions:
 * - Record cancellation
 * - Clean up any pending state
 * - Log abandonment event
 */
async function handlePaymentIntentCanceled(
  event: StripeWebhookEvent<StripePaymentIntentObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<PaymentEventResult>> {
  const paymentIntent = event.data.object
  const startTime = Date.now()

  try {
    const paymentData = extractPaymentIntentData(paymentIntent)

    console.log('[Webhook] Payment canceled:', {
      paymentIntentId: paymentIntent.id,
      customerId: paymentIntent.customer,
      cancellationReason: paymentIntent.cancellationReason,
    })

    // TODO: Record cancellation
    // await database.payments.update(paymentIntent.id, {
    //   status: 'canceled',
    //   canceledAt: new Date(paymentIntent.canceledAt! * 1000),
    //   cancellationReason: paymentIntent.cancellationReason,
    // })

    // TODO: Log abandonment for analytics
    // await analyticsService.trackPaymentAbandoned({
    //   customerId: paymentIntent.customer,
    //   paymentIntentId: paymentIntent.id,
    //   amount: paymentIntent.amount,
    //   reason: paymentIntent.cancellationReason,
    // })

    const result: PaymentEventResult = {
      ...paymentData,
      action: 'payment_canceled',
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: `Payment canceled: ${paymentIntent.cancellationReason || 'No reason provided'}`,
      data: result,
      metadata: {
        ...metadata,
        processedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.FAILED,
      error: createError('PAYMENT_CANCEL_HANDLING_ERROR', errorMessage, true),
      metadata: {
        ...metadata,
        processedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      },
      shouldRetry: true,
    }
  }
}

// =============================================================================
// CHARGE REFUNDED HANDLER
// =============================================================================

/**
 * Handle charge.refunded event
 *
 * Triggered when a charge is refunded (partially or fully).
 * Actions:
 * - Record refund details
 * - Adjust revenue metrics
 * - Send refund confirmation
 * - Update subscription if applicable
 */
async function handleChargeRefunded(
  event: StripeWebhookEvent<StripeChargeObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<PaymentEventResult>> {
  const charge = event.data.object
  const startTime = Date.now()

  try {
    const chargeData = extractChargeData(charge)

    // Get the latest refund
    const latestRefund = charge.refunds?.data?.[0]
    const refundInfo: RefundInfo | undefined = latestRefund
      ? {
          refundId: latestRefund.id,
          amount: latestRefund.amount,
          status: latestRefund.status,
          createdAt: new Date(latestRefund.created * 1000),
        }
      : undefined

    const isFullRefund = charge.amountRefunded >= charge.amount
    const refundAmount = charge.amountRefunded

    console.log('[Webhook] Charge refunded:', {
      chargeId: charge.id,
      customerId: charge.customer,
      originalAmount: charge.amount,
      refundedAmount: refundAmount,
      isFullRefund,
    })

    // TODO: Record refund
    // await database.refunds.create({
    //   stripeChargeId: charge.id,
    //   stripeCustomerId: charge.customer,
    //   originalAmount: charge.amount,
    //   refundedAmount: refundAmount,
    //   isFullRefund,
    //   reason: latestRefund?.reason,
    //   createdAt: new Date(),
    // })

    // TODO: Adjust revenue metrics
    // await analyticsService.trackRefund({
    //   customerId: charge.customer,
    //   chargeId: charge.id,
    //   amount: refundAmount,
    //   currency: charge.currency,
    //   isFullRefund,
    // })

    // TODO: Send refund confirmation
    // await emailService.sendRefundConfirmation({
    //   customerId: charge.customer,
    //   amount: refundAmount,
    //   currency: charge.currency,
    //   chargeId: charge.id,
    // })

    const result: PaymentEventResult = {
      ...chargeData,
      action: 'refunded',
      refundInfo,
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: isFullRefund
        ? `Full refund of ${refundAmount / 100} ${charge.currency.toUpperCase()} processed`
        : `Partial refund of ${refundAmount / 100} ${charge.currency.toUpperCase()} processed`,
      data: result,
      metadata: {
        ...metadata,
        processedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.FAILED,
      error: createError('REFUND_HANDLING_ERROR', errorMessage, true),
      metadata: {
        ...metadata,
        processedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      },
      shouldRetry: true,
    }
  }
}

// =============================================================================
// CHARGE DISPUTE CREATED HANDLER
// =============================================================================

/**
 * Handle charge.dispute.created event
 *
 * Triggered when a customer disputes a charge (chargeback).
 * Actions:
 * - Record dispute details
 * - Alert operations team
 * - Gather evidence for response
 * - Flag customer account
 */
async function handleChargeDisputeCreated(
  event: StripeWebhookEvent<StripeDisputeObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<PaymentEventResult>> {
  const dispute = event.data.object
  const startTime = Date.now()

  try {
    const disputeInfo: DisputeInfo = {
      disputeId: dispute.id,
      amount: dispute.amount,
      reason: dispute.reason,
      status: dispute.status,
      dueBy: dispute.evidenceDetails.dueBy
        ? new Date(dispute.evidenceDetails.dueBy * 1000)
        : undefined,
      hasEvidence: dispute.evidenceDetails.hasEvidence,
      isRefundable: dispute.isChargeRefundable,
    }

    console.log('[Webhook] Dispute created:', {
      disputeId: dispute.id,
      chargeId: dispute.charge,
      amount: dispute.amount,
      reason: dispute.reason,
      status: dispute.status,
      dueBy: disputeInfo.dueBy?.toISOString(),
    })

    // TODO: Record dispute
    // await database.disputes.create({
    //   stripeDisputeId: dispute.id,
    //   stripeChargeId: dispute.charge,
    //   amount: dispute.amount,
    //   currency: dispute.currency,
    //   reason: dispute.reason,
    //   status: dispute.status,
    //   evidenceDueBy: disputeInfo.dueBy,
    //   createdAt: new Date(),
    // })

    // TODO: Alert operations team
    // await alertService.sendDisputeAlert({
    //   disputeId: dispute.id,
    //   chargeId: dispute.charge,
    //   amount: dispute.amount,
    //   reason: dispute.reason,
    //   dueBy: disputeInfo.dueBy,
    //   urgency: disputeInfo.dueBy && disputeInfo.dueBy.getTime() - Date.now() < 72 * 60 * 60 * 1000
    //     ? 'high'
    //     : 'medium',
    // })

    // TODO: Flag customer account for review
    // await customerService.flagForReview(chargeCustomerId, {
    //   reason: 'dispute_filed',
    //   disputeId: dispute.id,
    // })

    const result: PaymentEventResult = {
      disputeId: dispute.id,
      chargeId: dispute.charge,
      amount: dispute.amount,
      currency: dispute.currency,
      status: dispute.status,
      action: 'dispute_created',
      disputeInfo,
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: `Dispute created for ${dispute.amount / 100} ${dispute.currency.toUpperCase()}. Reason: ${dispute.reason}`,
      data: result,
      metadata: {
        ...metadata,
        processedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.FAILED,
      error: createError('DISPUTE_HANDLING_ERROR', errorMessage, true),
      metadata: {
        ...metadata,
        processedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
      },
      shouldRetry: true,
    }
  }
}

// =============================================================================
// HANDLER REGISTRY
// =============================================================================

/**
 * All payment event handlers
 */
export const paymentEventHandlers: EventHandler[] = [
  {
    eventType: WEBHOOK_EVENT_TYPES.PAYMENT_INTENT_SUCCEEDED,
    handler: handlePaymentIntentSucceeded as EventHandler['handler'],
    enabled: true,
    priority: 10,
    timeout: 30000,
  },
  {
    eventType: WEBHOOK_EVENT_TYPES.PAYMENT_INTENT_FAILED,
    handler: handlePaymentIntentFailed as EventHandler['handler'],
    enabled: true,
    priority: 15, // Higher priority for failures
    timeout: 30000,
  },
  {
    eventType: WEBHOOK_EVENT_TYPES.PAYMENT_INTENT_CANCELED,
    handler: handlePaymentIntentCanceled as EventHandler['handler'],
    enabled: true,
    priority: 5,
    timeout: 30000,
  },
  {
    eventType: WEBHOOK_EVENT_TYPES.CHARGE_REFUNDED,
    handler: handleChargeRefunded as EventHandler['handler'],
    enabled: true,
    priority: 10,
    timeout: 30000,
  },
  {
    eventType: WEBHOOK_EVENT_TYPES.CHARGE_DISPUTE_CREATED,
    handler: handleChargeDisputeCreated as EventHandler['handler'],
    enabled: true,
    priority: 20, // Highest priority - disputes are time-sensitive
    timeout: 30000,
  },
]

// =============================================================================
// EXPORTS
// =============================================================================

export {
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handlePaymentIntentCanceled,
  handleChargeRefunded,
  handleChargeDisputeCreated,
  extractPaymentIntentData,
  extractChargeData,
  extractFailureInfo,
  PAYMENT_STATUS_MAP,
}

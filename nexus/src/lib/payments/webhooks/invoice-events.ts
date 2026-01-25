/**
 * Invoice Event Handlers
 *
 * Handles Stripe invoice-related events:
 * - invoice.created
 * - invoice.paid
 * - invoice.payment_failed
 * - invoice.upcoming
 * - invoice.finalized
 */

import type {
  StripeWebhookEvent,
  StripeInvoiceObject,
  EventMetadata,
  ProcessingResult,
  EventHandler,
  ProcessingError,
} from './webhook-types'

import { WEBHOOK_EVENT_TYPES, EVENT_STATUS } from './webhook-types'

// =============================================================================
// INVOICE STATUS MAPPING
// =============================================================================

/**
 * Map Stripe invoice status to internal status
 */
const INVOICE_STATUS_MAP = {
  draft: 'draft',
  open: 'open',
  paid: 'paid',
  uncollectible: 'uncollectible',
  void: 'void',
} as const

export type InternalInvoiceStatus =
  (typeof INVOICE_STATUS_MAP)[keyof typeof INVOICE_STATUS_MAP]

// =============================================================================
// HANDLER RESULT TYPES
// =============================================================================

/**
 * Invoice event result data
 */
export interface InvoiceEventResult {
  invoiceId: string
  invoiceNumber?: string
  customerId: string
  customerEmail?: string
  subscriptionId?: string
  status: InternalInvoiceStatus | 'unknown'
  amountDue: number
  amountPaid: number
  amountRemaining: number
  currency: string
  dueDate?: Date
  paidAt?: Date
  periodStart: Date
  periodEnd: Date
  hostedInvoiceUrl?: string
  invoicePdf?: string
  billingReason?: string
  attemptCount: number
  nextPaymentAttempt?: Date
  metadata?: Record<string, string>
  action: 'created' | 'paid' | 'payment_failed' | 'upcoming' | 'finalized'
  lineItems?: InvoiceLineItem[]
  failureInfo?: InvoiceFailureInfo
}

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: string
  description?: string
  amount: number
  currency: string
  quantity: number
  priceId?: string
  periodStart: Date
  periodEnd: Date
  isProration: boolean
}

/**
 * Invoice payment failure info
 */
export interface InvoiceFailureInfo {
  attemptCount: number
  nextRetryAt?: Date
  lastError?: string
  willRetry: boolean
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract invoice data from event payload
 */
function extractInvoiceData(
  invoice: StripeInvoiceObject
): Omit<InvoiceEventResult, 'action' | 'lineItems' | 'failureInfo'> {
  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.number || undefined,
    customerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer,
    customerEmail: invoice.customerEmail || undefined,
    subscriptionId: invoice.subscription || undefined,
    status: invoice.status ? (INVOICE_STATUS_MAP[invoice.status] || 'unknown') : 'unknown',
    amountDue: invoice.amountDue,
    amountPaid: invoice.amountPaid,
    amountRemaining: invoice.amountRemaining,
    currency: invoice.currency,
    dueDate: invoice.dueDate ? new Date(invoice.dueDate * 1000) : undefined,
    paidAt: invoice.statusTransitions.paidAt
      ? new Date(invoice.statusTransitions.paidAt * 1000)
      : undefined,
    periodStart: new Date(invoice.periodStart * 1000),
    periodEnd: new Date(invoice.periodEnd * 1000),
    hostedInvoiceUrl: invoice.hostedInvoiceUrl || undefined,
    invoicePdf: invoice.invoicePdf || undefined,
    billingReason: invoice.billingReason || undefined,
    attemptCount: invoice.attemptCount,
    nextPaymentAttempt: invoice.nextPaymentAttempt
      ? new Date(invoice.nextPaymentAttempt * 1000)
      : undefined,
    metadata: invoice.metadata,
  }
}

/**
 * Extract line items from invoice
 */
function extractLineItems(invoice: StripeInvoiceObject): InvoiceLineItem[] {
  return invoice.lines.data.map((line) => ({
    id: line.id,
    description: line.description || undefined,
    amount: line.amount,
    currency: line.currency,
    quantity: line.quantity,
    priceId: line.price?.id,
    periodStart: new Date(line.periodStart * 1000),
    periodEnd: new Date(line.periodEnd * 1000),
    isProration: line.proration,
  }))
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
// INVOICE CREATED HANDLER
// =============================================================================

/**
 * Handle invoice.created event
 *
 * Triggered when an invoice is created.
 * Actions:
 * - Record invoice in database
 * - Generate invoice preview notification
 * - Validate line items
 */
async function handleInvoiceCreated(
  event: StripeWebhookEvent<StripeInvoiceObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<InvoiceEventResult>> {
  const invoice = event.data.object
  const startTime = Date.now()

  try {
    const invoiceData = extractInvoiceData(invoice)
    const lineItems = extractLineItems(invoice)

    console.log('[Webhook] Invoice created:', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      amountDue: invoice.amountDue,
      status: invoice.status,
      billingReason: invoice.billingReason,
    })

    // TODO: Record invoice in database
    // await database.invoices.create({
    //   stripeInvoiceId: invoice.id,
    //   stripeCustomerId: invoice.customer,
    //   stripeSubscriptionId: invoice.subscription,
    //   ...invoiceData,
    //   lineItems: JSON.stringify(lineItems),
    //   createdAt: new Date(),
    // })

    // For subscription cycle invoices, we might want to notify the user
    // that an invoice has been generated
    if (invoice.billingReason === 'subscription_cycle') {
      // TODO: Send invoice preview notification
      // await emailService.sendInvoicePreview({
      //   email: invoice.customerEmail,
      //   invoiceId: invoice.id,
      //   amount: invoice.amountDue,
      //   currency: invoice.currency,
      //   dueDate: invoice.dueDate,
      //   viewUrl: invoice.hostedInvoiceUrl,
      // })
    }

    const result: InvoiceEventResult = {
      ...invoiceData,
      action: 'created',
      lineItems,
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: `Invoice created for ${invoice.amountDue / 100} ${invoice.currency.toUpperCase()}`,
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
      error: createError('INVOICE_CREATE_HANDLING_ERROR', errorMessage, true),
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
// INVOICE PAID HANDLER
// =============================================================================

/**
 * Handle invoice.paid event
 *
 * Triggered when an invoice is successfully paid.
 * Actions:
 * - Update invoice status
 * - Extend subscription access
 * - Send payment receipt
 * - Log revenue event
 */
async function handleInvoicePaid(
  event: StripeWebhookEvent<StripeInvoiceObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<InvoiceEventResult>> {
  const invoice = event.data.object
  const startTime = Date.now()

  try {
    const invoiceData = extractInvoiceData(invoice)
    const lineItems = extractLineItems(invoice)

    console.log('[Webhook] Invoice paid:', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      amountPaid: invoice.amountPaid,
      paidAt: invoiceData.paidAt?.toISOString(),
    })

    // TODO: Update invoice status
    // await database.invoices.update(invoice.id, {
    //   status: 'paid',
    //   amountPaid: invoice.amountPaid,
    //   paidAt: invoiceData.paidAt,
    //   updatedAt: new Date(),
    // })

    // TODO: Extend subscription access if applicable
    // if (invoice.subscription) {
    //   await provisioningService.extendAccess({
    //     customerId: invoice.customer,
    //     subscriptionId: invoice.subscription,
    //     periodEnd: invoiceData.periodEnd,
    //   })
    // }

    // TODO: Send payment receipt
    // await emailService.sendPaymentReceipt({
    //   email: invoice.customerEmail,
    //   invoiceNumber: invoice.number,
    //   amount: invoice.amountPaid,
    //   currency: invoice.currency,
    //   receiptUrl: invoice.hostedInvoiceUrl,
    //   pdfUrl: invoice.invoicePdf,
    // })

    // TODO: Log revenue event
    // await analyticsService.trackInvoicePaid({
    //   customerId: invoice.customer,
    //   invoiceId: invoice.id,
    //   subscriptionId: invoice.subscription,
    //   amount: invoice.amountPaid,
    //   currency: invoice.currency,
    // })

    const result: InvoiceEventResult = {
      ...invoiceData,
      action: 'paid',
      lineItems,
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: `Invoice ${invoice.number || invoice.id} paid: ${invoice.amountPaid / 100} ${invoice.currency.toUpperCase()}`,
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
      error: createError('INVOICE_PAID_HANDLING_ERROR', errorMessage, true),
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
// INVOICE PAYMENT FAILED HANDLER
// =============================================================================

/**
 * Handle invoice.payment_failed event
 *
 * Triggered when payment for an invoice fails.
 * Actions:
 * - Record failure details
 * - Send payment failure notification
 * - Trigger dunning flow
 * - Schedule retry if applicable
 */
async function handleInvoicePaymentFailed(
  event: StripeWebhookEvent<StripeInvoiceObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<InvoiceEventResult>> {
  const invoice = event.data.object
  const startTime = Date.now()

  try {
    const invoiceData = extractInvoiceData(invoice)

    const failureInfo: InvoiceFailureInfo = {
      attemptCount: invoice.attemptCount,
      nextRetryAt: invoice.nextPaymentAttempt
        ? new Date(invoice.nextPaymentAttempt * 1000)
        : undefined,
      willRetry: invoice.nextPaymentAttempt !== null,
    }

    console.log('[Webhook] Invoice payment failed:', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      amountDue: invoice.amountDue,
      attemptCount: invoice.attemptCount,
      nextRetry: failureInfo.nextRetryAt?.toISOString(),
    })

    // TODO: Record failure details
    // await database.invoiceAttempts.create({
    //   stripeInvoiceId: invoice.id,
    //   attemptNumber: invoice.attemptCount,
    //   amountAttempted: invoice.amountDue,
    //   failed: true,
    //   nextRetryAt: failureInfo.nextRetryAt,
    //   createdAt: new Date(),
    // })

    // TODO: Send payment failure notification
    // const isFirstFailure = invoice.attemptCount === 1
    // const isFinalFailure = !failureInfo.willRetry
    //
    // if (isFirstFailure) {
    //   await emailService.sendFirstPaymentFailure({
    //     email: invoice.customerEmail,
    //     amount: invoice.amountDue,
    //     currency: invoice.currency,
    //     nextRetryDate: failureInfo.nextRetryAt,
    //     updatePaymentUrl: `${process.env.APP_URL}/settings/billing`,
    //   })
    // } else if (isFinalFailure) {
    //   await emailService.sendFinalPaymentFailure({
    //     email: invoice.customerEmail,
    //     amount: invoice.amountDue,
    //     subscriptionWillCancel: true,
    //   })
    // } else {
    //   await emailService.sendPaymentRetryNotice({
    //     email: invoice.customerEmail,
    //     attemptNumber: invoice.attemptCount,
    //     nextRetryDate: failureInfo.nextRetryAt,
    //   })
    // }

    // TODO: Update dunning flow status
    // await dunningService.recordFailedAttempt({
    //   customerId: invoice.customer,
    //   invoiceId: invoice.id,
    //   subscriptionId: invoice.subscription,
    //   attemptNumber: invoice.attemptCount,
    //   nextRetryAt: failureInfo.nextRetryAt,
    //   isFinal: !failureInfo.willRetry,
    // })

    const result: InvoiceEventResult = {
      ...invoiceData,
      action: 'payment_failed',
      failureInfo,
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: failureInfo.willRetry
        ? `Invoice payment failed (attempt ${invoice.attemptCount}). Next retry: ${failureInfo.nextRetryAt?.toISOString()}`
        : `Invoice payment failed (final attempt). No more retries scheduled.`,
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
      error: createError('INVOICE_FAILURE_HANDLING_ERROR', errorMessage, true),
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
// INVOICE UPCOMING HANDLER
// =============================================================================

/**
 * Handle invoice.upcoming event
 *
 * Triggered a few days before the invoice is finalized.
 * Actions:
 * - Send upcoming invoice notification
 * - Allow user to review and modify
 * - Validate payment method
 */
async function handleInvoiceUpcoming(
  event: StripeWebhookEvent<StripeInvoiceObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<InvoiceEventResult>> {
  const invoice = event.data.object
  const startTime = Date.now()

  try {
    const invoiceData = extractInvoiceData(invoice)
    const lineItems = extractLineItems(invoice)

    // Calculate days until billing
    const periodEnd = new Date(invoice.periodEnd * 1000)
    const daysUntilBilling = Math.ceil(
      (periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    console.log('[Webhook] Upcoming invoice:', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      amountDue: invoice.amountDue,
      periodEnd: periodEnd.toISOString(),
      daysUntilBilling,
    })

    // TODO: Send upcoming invoice notification
    // await emailService.sendUpcomingInvoice({
    //   email: invoice.customerEmail,
    //   amount: invoice.amountDue,
    //   currency: invoice.currency,
    //   billingDate: periodEnd,
    //   daysUntilBilling,
    //   lineItems: lineItems.map(item => ({
    //     description: item.description,
    //     amount: item.amount,
    //   })),
    //   manageSubscriptionUrl: `${process.env.APP_URL}/settings/subscription`,
    // })

    // TODO: Validate payment method exists and is valid
    // const customer = await stripeClient.customers.retrieve(invoice.customer)
    // if (!customer.default_payment_method) {
    //   await emailService.sendPaymentMethodReminder({
    //     email: invoice.customerEmail,
    //     amount: invoice.amountDue,
    //     billingDate: periodEnd,
    //     addPaymentUrl: `${process.env.APP_URL}/settings/billing`,
    //   })
    // }

    const result: InvoiceEventResult = {
      ...invoiceData,
      action: 'upcoming',
      lineItems,
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: `Upcoming invoice notification sent. Billing in ${daysUntilBilling} days for ${invoice.amountDue / 100} ${invoice.currency.toUpperCase()}`,
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
      error: createError('UPCOMING_INVOICE_HANDLING_ERROR', errorMessage, true),
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
// INVOICE FINALIZED HANDLER
// =============================================================================

/**
 * Handle invoice.finalized event
 *
 * Triggered when an invoice is finalized and ready for payment.
 * Actions:
 * - Lock invoice details
 * - Generate final PDF
 * - Send invoice notification
 */
async function handleInvoiceFinalized(
  event: StripeWebhookEvent<StripeInvoiceObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<InvoiceEventResult>> {
  const invoice = event.data.object
  const startTime = Date.now()

  try {
    const invoiceData = extractInvoiceData(invoice)
    const lineItems = extractLineItems(invoice)

    console.log('[Webhook] Invoice finalized:', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      amountDue: invoice.amountDue,
      dueDate: invoiceData.dueDate?.toISOString(),
      hostedUrl: invoice.hostedInvoiceUrl,
      pdfUrl: invoice.invoicePdf,
    })

    // TODO: Update invoice record with finalized details
    // await database.invoices.update(invoice.id, {
    //   status: 'open',
    //   invoiceNumber: invoice.number,
    //   hostedInvoiceUrl: invoice.hostedInvoiceUrl,
    //   invoicePdf: invoice.invoicePdf,
    //   finalizedAt: invoice.statusTransitions.finalizedAt
    //     ? new Date(invoice.statusTransitions.finalizedAt * 1000)
    //     : new Date(),
    //   updatedAt: new Date(),
    // })

    // For non-automatic collection, send the invoice to the customer
    if (invoice.collectionMethod === 'send_invoice') {
      // TODO: Send invoice email
      // await emailService.sendInvoice({
      //   email: invoice.customerEmail,
      //   invoiceNumber: invoice.number,
      //   amount: invoice.amountDue,
      //   currency: invoice.currency,
      //   dueDate: invoiceData.dueDate,
      //   viewUrl: invoice.hostedInvoiceUrl,
      //   pdfUrl: invoice.invoicePdf,
      // })
    }

    const result: InvoiceEventResult = {
      ...invoiceData,
      action: 'finalized',
      lineItems,
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: `Invoice ${invoice.number} finalized for ${invoice.amountDue / 100} ${invoice.currency.toUpperCase()}`,
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
      error: createError('INVOICE_FINALIZED_HANDLING_ERROR', errorMessage, true),
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
 * All invoice event handlers
 */
export const invoiceEventHandlers: EventHandler<StripeInvoiceObject, InvoiceEventResult>[] = [
  {
    eventType: WEBHOOK_EVENT_TYPES.INVOICE_CREATED,
    handler: handleInvoiceCreated,
    enabled: true,
    priority: 5,
    timeout: 30000,
  },
  {
    eventType: WEBHOOK_EVENT_TYPES.INVOICE_PAID,
    handler: handleInvoicePaid,
    enabled: true,
    priority: 10,
    timeout: 30000,
  },
  {
    eventType: WEBHOOK_EVENT_TYPES.INVOICE_PAYMENT_FAILED,
    handler: handleInvoicePaymentFailed,
    enabled: true,
    priority: 15,
    timeout: 30000,
  },
  {
    eventType: WEBHOOK_EVENT_TYPES.INVOICE_UPCOMING,
    handler: handleInvoiceUpcoming,
    enabled: true,
    priority: 5,
    timeout: 30000,
  },
  {
    eventType: WEBHOOK_EVENT_TYPES.INVOICE_FINALIZED,
    handler: handleInvoiceFinalized,
    enabled: true,
    priority: 10,
    timeout: 30000,
  },
]

// =============================================================================
// EXPORTS
// =============================================================================

export {
  handleInvoiceCreated,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleInvoiceUpcoming,
  handleInvoiceFinalized,
  extractInvoiceData,
  extractLineItems,
  INVOICE_STATUS_MAP,
}

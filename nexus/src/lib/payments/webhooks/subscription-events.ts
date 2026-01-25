/**
 * Subscription Event Handlers
 *
 * Handles Stripe subscription lifecycle events:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - customer.subscription.trial_will_end
 * - customer.subscription.paused
 * - customer.subscription.resumed
 */

import type {
  StripeWebhookEvent,
  StripeSubscriptionObject,
  EventMetadata,
  ProcessingResult,
  EventHandler,
  ProcessingError,
} from './webhook-types'

import { WEBHOOK_EVENT_TYPES, EVENT_STATUS } from './webhook-types'

// =============================================================================
// SUBSCRIPTION STATUS MAPPING
// =============================================================================

/**
 * Map Stripe subscription status to internal status
 */
const SUBSCRIPTION_STATUS_MAP = {
  active: 'active',
  canceled: 'canceled',
  incomplete: 'pending',
  incomplete_expired: 'expired',
  past_due: 'past_due',
  paused: 'paused',
  trialing: 'trialing',
  unpaid: 'unpaid',
} as const

export type InternalSubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS_MAP)[keyof typeof SUBSCRIPTION_STATUS_MAP]

// =============================================================================
// HANDLER RESULT TYPES
// =============================================================================

/**
 * Subscription event result data
 */
export interface SubscriptionEventResult {
  subscriptionId: string
  customerId: string
  status: InternalSubscriptionStatus | 'unknown'
  priceId: string
  productId?: string
  quantity: number
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEnd?: Date
  metadata?: Record<string, string>
  action: 'created' | 'updated' | 'deleted' | 'paused' | 'resumed' | 'trial_ending'
  changes?: SubscriptionChanges
}

/**
 * Detected changes in subscription update
 */
export interface SubscriptionChanges {
  statusChanged?: {
    from: string
    to: string
  }
  priceChanged?: {
    from: string
    to: string
  }
  quantityChanged?: {
    from: number
    to: number
  }
  cancelAtPeriodEndChanged?: {
    from: boolean
    to: boolean
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract subscription data from event payload
 */
function extractSubscriptionData(
  subscription: StripeSubscriptionObject
): Omit<SubscriptionEventResult, 'action' | 'changes'> {
  const item = subscription.items.data[0]

  return {
    subscriptionId: subscription.id,
    customerId:
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer,
    status: SUBSCRIPTION_STATUS_MAP[subscription.status] || 'unknown',
    priceId: item?.price.id || '',
    productId: item?.price.product || undefined,
    quantity: item?.quantity || 1,
    currentPeriodStart: new Date(subscription.currentPeriodStart * 1000),
    currentPeriodEnd: new Date(subscription.currentPeriodEnd * 1000),
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    trialEnd: subscription.trialEnd ? new Date(subscription.trialEnd * 1000) : undefined,
    metadata: subscription.metadata,
  }
}

/**
 * Detect changes between previous and current subscription state
 */
function detectSubscriptionChanges(
  current: StripeSubscriptionObject,
  previous?: Partial<StripeSubscriptionObject>
): SubscriptionChanges | undefined {
  if (!previous) {
    return undefined
  }

  const changes: SubscriptionChanges = {}

  if (previous.status !== undefined && previous.status !== current.status) {
    changes.statusChanged = {
      from: previous.status,
      to: current.status,
    }
  }

  const currentPriceId = current.items.data[0]?.price.id
  const previousItems = previous.items?.data as Array<{ price?: { id?: string } }> | undefined
  const previousPriceId = previousItems?.[0]?.price?.id

  if (previousPriceId !== undefined && previousPriceId !== currentPriceId) {
    changes.priceChanged = {
      from: previousPriceId,
      to: currentPriceId || '',
    }
  }

  const currentQuantity = current.items.data[0]?.quantity || 1
  const previousQuantity = (previousItems?.[0] as { quantity?: number })?.quantity

  if (previousQuantity !== undefined && previousQuantity !== currentQuantity) {
    changes.quantityChanged = {
      from: previousQuantity,
      to: currentQuantity,
    }
  }

  if (
    previous.cancelAtPeriodEnd !== undefined &&
    previous.cancelAtPeriodEnd !== current.cancelAtPeriodEnd
  ) {
    changes.cancelAtPeriodEndChanged = {
      from: previous.cancelAtPeriodEnd,
      to: current.cancelAtPeriodEnd,
    }
  }

  return Object.keys(changes).length > 0 ? changes : undefined
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
// SUBSCRIPTION CREATED HANDLER
// =============================================================================

/**
 * Handle customer.subscription.created event
 *
 * Triggered when a new subscription is created.
 * Actions:
 * - Create subscription record in database
 * - Provision user access based on tier
 * - Send welcome/confirmation email
 * - Log analytics event
 */
async function handleSubscriptionCreated(
  event: StripeWebhookEvent<StripeSubscriptionObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<SubscriptionEventResult>> {
  const subscription = event.data.object
  const startTime = Date.now()

  try {
    // Extract subscription data
    const subscriptionData = extractSubscriptionData(subscription)

    // TODO: Implement actual database operations
    // await database.subscriptions.create({
    //   ...subscriptionData,
    //   stripeEventId: event.id,
    //   createdAt: new Date(),
    // })

    // TODO: Provision user access
    // await provisioningService.grantAccess(subscriptionData.customerId, subscriptionData.priceId)

    // TODO: Send welcome email
    // await emailService.sendSubscriptionCreated(subscriptionData)

    console.log('[Webhook] Subscription created:', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      priceId: subscriptionData.priceId,
    })

    const result: SubscriptionEventResult = {
      ...subscriptionData,
      action: 'created',
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: 'Subscription created successfully',
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
      error: createError('SUBSCRIPTION_CREATE_FAILED', errorMessage, true),
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
// SUBSCRIPTION UPDATED HANDLER
// =============================================================================

/**
 * Handle customer.subscription.updated event
 *
 * Triggered when any subscription attribute changes.
 * Actions:
 * - Update subscription record
 * - Handle plan upgrades/downgrades
 * - Handle status changes (active -> past_due, etc.)
 * - Adjust user access if needed
 * - Send relevant notifications
 */
async function handleSubscriptionUpdated(
  event: StripeWebhookEvent<StripeSubscriptionObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<SubscriptionEventResult>> {
  const subscription = event.data.object
  const previousAttributes = event.data.previousAttributes
  const startTime = Date.now()

  try {
    // Extract subscription data
    const subscriptionData = extractSubscriptionData(subscription)

    // Detect what changed
    const changes = detectSubscriptionChanges(subscription, previousAttributes)

    // Handle specific change types
    if (changes?.statusChanged) {
      console.log('[Webhook] Subscription status changed:', {
        subscriptionId: subscription.id,
        from: changes.statusChanged.from,
        to: changes.statusChanged.to,
      })

      // TODO: Handle status transitions
      // if (changes.statusChanged.to === 'past_due') {
      //   await notificationService.sendPaymentFailedWarning(subscriptionData.customerId)
      // }
    }

    if (changes?.priceChanged) {
      console.log('[Webhook] Subscription plan changed:', {
        subscriptionId: subscription.id,
        from: changes.priceChanged.from,
        to: changes.priceChanged.to,
      })

      // TODO: Handle plan changes
      // await provisioningService.updateAccess(subscriptionData.customerId, changes.priceChanged.to)
    }

    if (changes?.cancelAtPeriodEndChanged) {
      if (changes.cancelAtPeriodEndChanged.to) {
        console.log('[Webhook] Subscription scheduled for cancellation:', {
          subscriptionId: subscription.id,
          cancelAt: subscriptionData.currentPeriodEnd,
        })
        // TODO: Send cancellation confirmation email
      } else {
        console.log('[Webhook] Subscription cancellation reverted:', {
          subscriptionId: subscription.id,
        })
        // TODO: Send reactivation confirmation email
      }
    }

    // TODO: Update database record
    // await database.subscriptions.update(subscription.id, {
    //   ...subscriptionData,
    //   updatedAt: new Date(),
    // })

    const result: SubscriptionEventResult = {
      ...subscriptionData,
      action: 'updated',
      changes,
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: changes
        ? `Subscription updated with changes: ${Object.keys(changes).join(', ')}`
        : 'Subscription updated (no significant changes)',
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
      error: createError('SUBSCRIPTION_UPDATE_FAILED', errorMessage, true),
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
// SUBSCRIPTION DELETED HANDLER
// =============================================================================

/**
 * Handle customer.subscription.deleted event
 *
 * Triggered when a subscription is permanently deleted/canceled.
 * Actions:
 * - Mark subscription as deleted in database
 * - Revoke user access
 * - Send cancellation confirmation
 * - Log churn event for analytics
 */
async function handleSubscriptionDeleted(
  event: StripeWebhookEvent<StripeSubscriptionObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<SubscriptionEventResult>> {
  const subscription = event.data.object
  const startTime = Date.now()

  try {
    // Extract subscription data
    const subscriptionData = extractSubscriptionData(subscription)

    console.log('[Webhook] Subscription deleted:', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      canceledAt: subscription.canceledAt
        ? new Date(subscription.canceledAt * 1000).toISOString()
        : null,
    })

    // TODO: Mark subscription as deleted
    // await database.subscriptions.update(subscription.id, {
    //   status: 'deleted',
    //   deletedAt: new Date(),
    //   endedAt: subscription.endedAt ? new Date(subscription.endedAt * 1000) : new Date(),
    // })

    // TODO: Revoke access
    // await provisioningService.revokeAccess(subscriptionData.customerId)

    // TODO: Send cancellation confirmation
    // await emailService.sendSubscriptionCanceled(subscriptionData)

    // TODO: Log churn event
    // await analyticsService.trackChurn({
    //   customerId: subscriptionData.customerId,
    //   subscriptionId: subscription.id,
    //   reason: subscription.metadata?.cancellation_reason,
    //   feedback: subscription.metadata?.cancellation_feedback,
    // })

    const result: SubscriptionEventResult = {
      ...subscriptionData,
      action: 'deleted',
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: 'Subscription deleted successfully',
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
      error: createError('SUBSCRIPTION_DELETE_FAILED', errorMessage, true),
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
// TRIAL WILL END HANDLER
// =============================================================================

/**
 * Handle customer.subscription.trial_will_end event
 *
 * Triggered 3 days before a trial period ends.
 * Actions:
 * - Send trial ending reminder email
 * - Prompt user to add payment method
 * - Log conversion opportunity
 */
async function handleSubscriptionTrialWillEnd(
  event: StripeWebhookEvent<StripeSubscriptionObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<SubscriptionEventResult>> {
  const subscription = event.data.object
  const startTime = Date.now()

  try {
    const subscriptionData = extractSubscriptionData(subscription)

    const trialEnd = subscription.trialEnd ? new Date(subscription.trialEnd * 1000) : null
    const daysRemaining = trialEnd
      ? Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0

    console.log('[Webhook] Trial ending soon:', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      trialEnd: trialEnd?.toISOString(),
      daysRemaining,
    })

    // TODO: Send trial ending reminder
    // await emailService.sendTrialEndingReminder({
    //   customerId: subscriptionData.customerId,
    //   subscriptionId: subscription.id,
    //   trialEnd,
    //   daysRemaining,
    //   hasPaymentMethod: !!subscription.defaultPaymentMethod,
    // })

    // TODO: Log conversion opportunity
    // await analyticsService.trackTrialEnding({
    //   customerId: subscriptionData.customerId,
    //   subscriptionId: subscription.id,
    //   daysRemaining,
    // })

    const result: SubscriptionEventResult = {
      ...subscriptionData,
      action: 'trial_ending',
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: `Trial ending notification sent. ${daysRemaining} days remaining.`,
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
      error: createError('TRIAL_END_NOTIFICATION_FAILED', errorMessage, true),
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
// SUBSCRIPTION PAUSED HANDLER
// =============================================================================

/**
 * Handle customer.subscription.paused event
 *
 * Triggered when a subscription is paused.
 * Actions:
 * - Update subscription status
 * - Restrict access to premium features
 * - Send pause confirmation
 */
async function handleSubscriptionPaused(
  event: StripeWebhookEvent<StripeSubscriptionObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<SubscriptionEventResult>> {
  const subscription = event.data.object
  const startTime = Date.now()

  try {
    const subscriptionData = extractSubscriptionData(subscription)

    const resumesAt = subscription.pauseCollection?.resumesAt
      ? new Date(subscription.pauseCollection.resumesAt * 1000)
      : null

    console.log('[Webhook] Subscription paused:', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      resumesAt: resumesAt?.toISOString(),
    })

    // TODO: Update subscription status
    // await database.subscriptions.update(subscription.id, {
    //   status: 'paused',
    //   pausedAt: new Date(),
    //   resumesAt,
    // })

    // TODO: Restrict access
    // await provisioningService.restrictAccess(subscriptionData.customerId)

    // TODO: Send pause confirmation
    // await emailService.sendSubscriptionPaused({
    //   customerId: subscriptionData.customerId,
    //   resumesAt,
    // })

    const result: SubscriptionEventResult = {
      ...subscriptionData,
      action: 'paused',
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: resumesAt
        ? `Subscription paused. Will resume on ${resumesAt.toISOString()}`
        : 'Subscription paused indefinitely',
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
      error: createError('SUBSCRIPTION_PAUSE_FAILED', errorMessage, true),
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
// SUBSCRIPTION RESUMED HANDLER
// =============================================================================

/**
 * Handle customer.subscription.resumed event
 *
 * Triggered when a paused subscription is resumed.
 * Actions:
 * - Update subscription status
 * - Restore full access
 * - Send resume confirmation
 */
async function handleSubscriptionResumed(
  event: StripeWebhookEvent<StripeSubscriptionObject>,
  metadata: EventMetadata
): Promise<ProcessingResult<SubscriptionEventResult>> {
  const subscription = event.data.object
  const startTime = Date.now()

  try {
    const subscriptionData = extractSubscriptionData(subscription)

    console.log('[Webhook] Subscription resumed:', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
    })

    // TODO: Update subscription status
    // await database.subscriptions.update(subscription.id, {
    //   status: subscription.status,
    //   pausedAt: null,
    //   resumesAt: null,
    //   resumedAt: new Date(),
    // })

    // TODO: Restore full access
    // await provisioningService.restoreAccess(subscriptionData.customerId, subscriptionData.priceId)

    // TODO: Send resume confirmation
    // await emailService.sendSubscriptionResumed({
    //   customerId: subscriptionData.customerId,
    //   nextBillingDate: subscriptionData.currentPeriodEnd,
    // })

    const result: SubscriptionEventResult = {
      ...subscriptionData,
      action: 'resumed',
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      status: EVENT_STATUS.COMPLETED,
      message: 'Subscription resumed successfully',
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
      error: createError('SUBSCRIPTION_RESUME_FAILED', errorMessage, true),
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
 * All subscription event handlers
 */
export const subscriptionEventHandlers: EventHandler<StripeSubscriptionObject, SubscriptionEventResult>[] = [
  {
    eventType: WEBHOOK_EVENT_TYPES.SUBSCRIPTION_CREATED,
    handler: handleSubscriptionCreated,
    enabled: true,
    priority: 10,
    timeout: 30000,
  },
  {
    eventType: WEBHOOK_EVENT_TYPES.SUBSCRIPTION_UPDATED,
    handler: handleSubscriptionUpdated,
    enabled: true,
    priority: 10,
    timeout: 30000,
  },
  {
    eventType: WEBHOOK_EVENT_TYPES.SUBSCRIPTION_DELETED,
    handler: handleSubscriptionDeleted,
    enabled: true,
    priority: 10,
    timeout: 30000,
  },
  {
    eventType: WEBHOOK_EVENT_TYPES.SUBSCRIPTION_TRIAL_WILL_END,
    handler: handleSubscriptionTrialWillEnd,
    enabled: true,
    priority: 5,
    timeout: 30000,
  },
  {
    eventType: WEBHOOK_EVENT_TYPES.SUBSCRIPTION_PAUSED,
    handler: handleSubscriptionPaused,
    enabled: true,
    priority: 10,
    timeout: 30000,
  },
  {
    eventType: WEBHOOK_EVENT_TYPES.SUBSCRIPTION_RESUMED,
    handler: handleSubscriptionResumed,
    enabled: true,
    priority: 10,
    timeout: 30000,
  },
]

// =============================================================================
// EXPORTS
// =============================================================================

export {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleSubscriptionTrialWillEnd,
  handleSubscriptionPaused,
  handleSubscriptionResumed,
  extractSubscriptionData,
  detectSubscriptionChanges,
  SUBSCRIPTION_STATUS_MAP,
}

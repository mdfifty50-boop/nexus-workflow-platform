/**
 * Stripe Subscription Management Service
 *
 * Comprehensive subscription lifecycle management for Nexus platform.
 * Handles create, update, cancel, pause/resume, and usage tracking.
 *
 * Pricing Tiers (Marcus GM approved):
 * - Starter: $29/month (10 workflows, 1,000 executions)
 * - Pro: $79/month (50 workflows, 10,000 executions)
 * - Business: $199/month (unlimited workflows, 100,000 executions)
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Stripe subscription status values
 */
export type StripeSubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'paused'

/**
 * Subscription cancellation mode
 */
export type CancellationMode = 'immediate' | 'end_of_period'

/**
 * Proration behavior for plan changes
 */
export type ProrationBehavior = 'create_prorations' | 'none' | 'always_invoice'

/**
 * Billing interval
 */
export type BillingInterval = 'month' | 'year'

/**
 * Price tier identifier
 */
export type PriceTier = 'starter' | 'pro' | 'business'

/**
 * Price tier configuration
 */
export interface PriceTierConfig {
  id: PriceTier
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  currency: string
  limits: {
    workflows: number | 'unlimited'
    executions: number
  }
  features: string[]
  stripePriceIds?: {
    monthly?: string
    yearly?: string
  }
}

/**
 * Stripe Customer object (minimal)
 */
export interface StripeCustomer {
  id: string
  email: string | null
  name: string | null
  metadata: Record<string, string>
  created: number
  defaultPaymentMethod: string | null
}

/**
 * Stripe Price object
 */
export interface StripePrice {
  id: string
  productId: string
  active: boolean
  currency: string
  unitAmount: number | null
  recurringInterval: BillingInterval | null
  recurringIntervalCount: number | null
  type: 'one_time' | 'recurring'
  metadata: Record<string, string>
}

/**
 * Stripe Subscription object
 */
export interface StripeSubscription {
  id: string
  customerId: string
  status: StripeSubscriptionStatus
  priceId: string
  quantity: number
  currentPeriodStart: number
  currentPeriodEnd: number
  cancelAtPeriodEnd: boolean
  canceledAt: number | null
  trialStart: number | null
  trialEnd: number | null
  pausedAt: number | null
  resumesAt: number | null
  latestInvoiceId: string | null
  defaultPaymentMethodId: string | null
  metadata: Record<string, string>
  created: number
}

/**
 * Subscription item for usage tracking
 */
export interface StripeSubscriptionItem {
  id: string
  subscriptionId: string
  priceId: string
  quantity: number
}

/**
 * Usage record for metered billing
 */
export interface UsageRecord {
  subscriptionItemId: string
  quantity: number
  timestamp: number
  action: 'increment' | 'set'
}

/**
 * Invoice preview for proration
 */
export interface InvoicePreview {
  subtotal: number
  total: number
  amountDue: number
  currency: string
  lines: InvoiceLineItem[]
  prorationDate: number | null
}

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: string
  description: string
  amount: number
  currency: string
  proration: boolean
  periodStart: number
  periodEnd: number
}

/**
 * Customer portal session
 */
export interface PortalSession {
  id: string
  url: string
  returnUrl: string
  created: number
}

/**
 * Subscription creation params
 */
export interface CreateSubscriptionParams {
  customerId: string
  priceId: string
  paymentMethodId?: string
  trialDays?: number
  couponCode?: string
  metadata?: Record<string, string>
  defaultTaxRates?: string[]
}

/**
 * Subscription update params
 */
export interface UpdateSubscriptionParams {
  subscriptionId: string
  priceId?: string
  quantity?: number
  prorationBehavior?: ProrationBehavior
  cancelAtPeriodEnd?: boolean
  metadata?: Record<string, string>
  paymentMethodId?: string
}

/**
 * Subscription cancellation params
 */
export interface CancelSubscriptionParams {
  subscriptionId: string
  mode: CancellationMode
  feedback?: string
  reason?: CancellationReason
}

/**
 * Cancellation reason codes
 */
export type CancellationReason =
  | 'too_expensive'
  | 'missing_features'
  | 'switched_service'
  | 'unused'
  | 'customer_service'
  | 'too_complex'
  | 'low_quality'
  | 'other'

/**
 * Subscription pause params
 */
export interface PauseSubscriptionParams {
  subscriptionId: string
  resumeAt?: Date
  behavior?: 'mark_uncollectible' | 'keep_as_draft' | 'void'
}

/**
 * Usage summary for a subscription
 */
export interface UsageSummary {
  subscriptionId: string
  periodStart: Date
  periodEnd: Date
  workflows: {
    used: number
    limit: number | 'unlimited'
    percentUsed: number
  }
  executions: {
    used: number
    limit: number
    percentUsed: number
  }
  overageCharges?: number
}

/**
 * Grace period configuration
 */
export interface GracePeriodConfig {
  enabled: boolean
  durationDays: number
  notifyBeforeDays: number[]
  restrictFeatures: boolean
}

/**
 * Subscription service response
 */
export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

// =============================================================================
// PRICE TIER CONFIGURATION
// =============================================================================

/**
 * Nexus pricing tiers (Marcus GM approved)
 */
export const PRICE_TIERS: Record<PriceTier, PriceTierConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individuals and small teams getting started',
    monthlyPrice: 29,
    yearlyPrice: 290, // ~17% discount
    currency: 'USD',
    limits: {
      workflows: 10,
      executions: 1000,
    },
    features: [
      '10 AI workflows',
      '1,000 executions/month',
      'Basic integrations',
      'Email support',
      'Community access',
    ],
    stripePriceIds: {
      monthly: import.meta.env.VITE_STRIPE_STARTER_MONTHLY_PRICE_ID,
      yearly: import.meta.env.VITE_STRIPE_STARTER_YEARLY_PRICE_ID,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For growing teams that need more power',
    monthlyPrice: 79,
    yearlyPrice: 790, // ~17% discount
    currency: 'USD',
    limits: {
      workflows: 50,
      executions: 10000,
    },
    features: [
      '50 AI workflows',
      '10,000 executions/month',
      'All integrations',
      'Priority support',
      'Custom AI agents',
      'Team collaboration',
      'API access',
      'Analytics dashboard',
    ],
    stripePriceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID,
      yearly: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID,
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'For enterprises requiring maximum scale',
    monthlyPrice: 199,
    yearlyPrice: 1990, // ~17% discount
    currency: 'USD',
    limits: {
      workflows: 'unlimited',
      executions: 100000,
    },
    features: [
      'Unlimited workflows',
      '100,000 executions/month',
      'All integrations',
      'Dedicated support',
      'Custom AI agents',
      'Advanced team features',
      'Full API access',
      'Advanced analytics',
      'SLA guarantee',
      'Custom integrations',
      'Onboarding assistance',
    ],
    stripePriceIds: {
      monthly: import.meta.env.VITE_STRIPE_BUSINESS_MONTHLY_PRICE_ID,
      yearly: import.meta.env.VITE_STRIPE_BUSINESS_YEARLY_PRICE_ID,
    },
  },
}

/**
 * Grace period configuration
 */
export const GRACE_PERIOD_CONFIG: GracePeriodConfig = {
  enabled: true,
  durationDays: 7,
  notifyBeforeDays: [3, 1],
  restrictFeatures: true,
}

// =============================================================================
// SUBSCRIPTION SERVICE CLASS
// =============================================================================

/**
 * Stripe Subscription Management Service
 *
 * Provides complete subscription lifecycle management including:
 * - Create, update, cancel subscriptions
 * - Pause and resume functionality
 * - Usage-based billing tracking
 * - Customer portal integration
 * - Proration handling
 * - Grace period management
 */
export class SubscriptionService {
  private readonly apiBase: string

  constructor(apiBase: string = '/api/subscriptions') {
    this.apiBase = apiBase
  }

  // ===========================================================================
  // SUBSCRIPTION LIFECYCLE
  // ===========================================================================

  /**
   * Create a new subscription
   *
   * @param params - Subscription creation parameters
   * @returns Created subscription or error
   */
  async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<ServiceResponse<StripeSubscription>> {
    try {
      const response = await fetch(`${this.apiBase}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: params.customerId,
          price_id: params.priceId,
          payment_method_id: params.paymentMethodId,
          trial_period_days: params.trialDays,
          coupon: params.couponCode,
          metadata: params.metadata,
          default_tax_rates: params.defaultTaxRates,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: {
            code: error.code || 'CREATE_FAILED',
            message: error.message || 'Failed to create subscription',
            details: error.details,
          },
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: this.normalizeSubscription(data),
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      }
    }
  }

  /**
   * Update an existing subscription
   *
   * Handles upgrades, downgrades, and quantity changes with proration.
   *
   * @param params - Update parameters
   * @returns Updated subscription or error
   */
  async updateSubscription(
    params: UpdateSubscriptionParams
  ): Promise<ServiceResponse<StripeSubscription>> {
    try {
      const response = await fetch(`${this.apiBase}/${params.subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: params.priceId,
          quantity: params.quantity,
          proration_behavior: params.prorationBehavior || 'create_prorations',
          cancel_at_period_end: params.cancelAtPeriodEnd,
          metadata: params.metadata,
          default_payment_method: params.paymentMethodId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: {
            code: error.code || 'UPDATE_FAILED',
            message: error.message || 'Failed to update subscription',
            details: error.details,
          },
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: this.normalizeSubscription(data),
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      }
    }
  }

  /**
   * Cancel a subscription
   *
   * Supports immediate cancellation or end-of-period cancellation.
   *
   * @param params - Cancellation parameters
   * @returns Canceled subscription or error
   */
  async cancelSubscription(
    params: CancelSubscriptionParams
  ): Promise<ServiceResponse<StripeSubscription>> {
    try {
      const endpoint =
        params.mode === 'immediate'
          ? `${this.apiBase}/${params.subscriptionId}/cancel`
          : `${this.apiBase}/${params.subscriptionId}`

      const body =
        params.mode === 'immediate'
          ? {
              feedback: params.feedback,
              cancellation_reason: params.reason,
            }
          : {
              cancel_at_period_end: true,
              metadata: {
                cancellation_feedback: params.feedback || '',
                cancellation_reason: params.reason || 'other',
              },
            }

      const response = await fetch(endpoint, {
        method: params.mode === 'immediate' ? 'DELETE' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: {
            code: error.code || 'CANCEL_FAILED',
            message: error.message || 'Failed to cancel subscription',
            details: error.details,
          },
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: this.normalizeSubscription(data),
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      }
    }
  }

  /**
   * Pause a subscription
   *
   * Pauses billing collection while keeping the subscription active.
   *
   * @param params - Pause parameters
   * @returns Paused subscription or error
   */
  async pauseSubscription(
    params: PauseSubscriptionParams
  ): Promise<ServiceResponse<StripeSubscription>> {
    try {
      const response = await fetch(`${this.apiBase}/${params.subscriptionId}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumes_at: params.resumeAt ? Math.floor(params.resumeAt.getTime() / 1000) : undefined,
          pause_collection_behavior: params.behavior || 'mark_uncollectible',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: {
            code: error.code || 'PAUSE_FAILED',
            message: error.message || 'Failed to pause subscription',
            details: error.details,
          },
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: this.normalizeSubscription(data),
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      }
    }
  }

  /**
   * Resume a paused subscription
   *
   * @param subscriptionId - Subscription ID to resume
   * @returns Resumed subscription or error
   */
  async resumeSubscription(
    subscriptionId: string
  ): Promise<ServiceResponse<StripeSubscription>> {
    try {
      const response = await fetch(`${this.apiBase}/${subscriptionId}/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: {
            code: error.code || 'RESUME_FAILED',
            message: error.message || 'Failed to resume subscription',
            details: error.details,
          },
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: this.normalizeSubscription(data),
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      }
    }
  }

  // ===========================================================================
  // SUBSCRIPTION STATUS
  // ===========================================================================

  /**
   * Get subscription details
   *
   * @param subscriptionId - Subscription ID
   * @returns Subscription details or error
   */
  async getSubscription(
    subscriptionId: string
  ): Promise<ServiceResponse<StripeSubscription>> {
    try {
      const response = await fetch(`${this.apiBase}/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: {
            code: error.code || 'GET_FAILED',
            message: error.message || 'Failed to get subscription',
            details: error.details,
          },
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: this.normalizeSubscription(data),
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      }
    }
  }

  /**
   * Get subscription status by customer email
   *
   * @param email - Customer email address
   * @returns Subscription status or null
   */
  async getSubscriptionByEmail(
    email: string
  ): Promise<ServiceResponse<StripeSubscription | null>> {
    try {
      const response = await fetch(`${this.apiBase}/status?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: {
            code: error.code || 'GET_FAILED',
            message: error.message || 'Failed to get subscription status',
            details: error.details,
          },
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: data.subscription ? this.normalizeSubscription(data.subscription) : null,
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      }
    }
  }

  /**
   * Check if subscription is active (including grace period)
   *
   * @param status - Subscription status
   * @returns Whether the subscription has active access
   */
  isSubscriptionActive(status: StripeSubscriptionStatus): boolean {
    return ['active', 'trialing', 'past_due'].includes(status)
  }

  /**
   * Check if subscription is in grace period
   *
   * @param subscription - Subscription object
   * @returns Whether subscription is in grace period
   */
  isInGracePeriod(subscription: StripeSubscription): boolean {
    if (subscription.status !== 'past_due') {
      return false
    }

    if (!GRACE_PERIOD_CONFIG.enabled) {
      return false
    }

    const currentPeriodEnd = new Date(subscription.currentPeriodEnd * 1000)
    const gracePeriodEnd = new Date(
      currentPeriodEnd.getTime() + GRACE_PERIOD_CONFIG.durationDays * 24 * 60 * 60 * 1000
    )
    return new Date() < gracePeriodEnd
  }

  /**
   * Get days remaining in grace period
   *
   * @param subscription - Subscription object
   * @returns Days remaining or 0 if not in grace period
   */
  getGracePeriodDaysRemaining(subscription: StripeSubscription): number {
    if (!this.isInGracePeriod(subscription)) {
      return 0
    }

    const currentPeriodEnd = new Date(subscription.currentPeriodEnd * 1000)
    const gracePeriodEnd = new Date(
      currentPeriodEnd.getTime() + GRACE_PERIOD_CONFIG.durationDays * 24 * 60 * 60 * 1000
    )
    const diffMs = gracePeriodEnd.getTime() - new Date().getTime()
    return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)))
  }

  // ===========================================================================
  // CUSTOMER PORTAL
  // ===========================================================================

  /**
   * Create a customer portal session
   *
   * Allows customers to manage their subscription, payment methods,
   * and view invoices through Stripe's hosted portal.
   *
   * @param customerId - Stripe customer ID
   * @param returnUrl - URL to return to after portal session
   * @returns Portal session with URL
   */
  async createPortalSession(
    customerId: string,
    returnUrl?: string
  ): Promise<ServiceResponse<PortalSession>> {
    try {
      const response = await fetch(`${this.apiBase}/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          return_url: returnUrl || window.location.href,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: {
            code: error.code || 'PORTAL_FAILED',
            message: error.message || 'Failed to create portal session',
            details: error.details,
          },
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: {
          id: data.id,
          url: data.url,
          returnUrl: data.return_url,
          created: data.created,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      }
    }
  }

  /**
   * Redirect to customer portal
   *
   * @param customerId - Stripe customer ID
   * @param returnUrl - Optional return URL
   */
  async redirectToPortal(customerId: string, returnUrl?: string): Promise<void> {
    const result = await this.createPortalSession(customerId, returnUrl)
    if (result.success && result.data) {
      window.location.href = result.data.url
    } else {
      throw new Error(result.error?.message || 'Failed to create portal session')
    }
  }

  // ===========================================================================
  // USAGE TRACKING
  // ===========================================================================

  /**
   * Record usage for metered billing
   *
   * @param record - Usage record to submit
   * @returns Success status
   */
  async recordUsage(record: UsageRecord): Promise<ServiceResponse<{ recorded: boolean }>> {
    try {
      const response = await fetch(`${this.apiBase}/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_item_id: record.subscriptionItemId,
          quantity: record.quantity,
          timestamp: record.timestamp,
          action: record.action,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: {
            code: error.code || 'USAGE_FAILED',
            message: error.message || 'Failed to record usage',
            details: error.details,
          },
        }
      }

      return {
        success: true,
        data: { recorded: true },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      }
    }
  }

  /**
   * Get usage summary for a subscription
   *
   * @param subscriptionId - Subscription ID
   * @returns Usage summary
   */
  async getUsageSummary(subscriptionId: string): Promise<ServiceResponse<UsageSummary>> {
    try {
      const response = await fetch(`${this.apiBase}/${subscriptionId}/usage`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: {
            code: error.code || 'USAGE_GET_FAILED',
            message: error.message || 'Failed to get usage summary',
            details: error.details,
          },
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: {
          subscriptionId: data.subscription_id,
          periodStart: new Date(data.period_start * 1000),
          periodEnd: new Date(data.period_end * 1000),
          workflows: {
            used: data.workflows_used,
            limit: data.workflows_limit,
            percentUsed:
              data.workflows_limit === 'unlimited'
                ? 0
                : Math.round((data.workflows_used / data.workflows_limit) * 100),
          },
          executions: {
            used: data.executions_used,
            limit: data.executions_limit,
            percentUsed: Math.round((data.executions_used / data.executions_limit) * 100),
          },
          overageCharges: data.overage_charges,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      }
    }
  }

  // ===========================================================================
  // PRORATION & INVOICING
  // ===========================================================================

  /**
   * Preview proration for a plan change
   *
   * Shows the prorated amount that will be charged when changing plans.
   *
   * @param subscriptionId - Current subscription ID
   * @param newPriceId - New price ID to switch to
   * @returns Invoice preview with proration details
   */
  async previewProration(
    subscriptionId: string,
    newPriceId: string
  ): Promise<ServiceResponse<InvoicePreview>> {
    try {
      const response = await fetch(`${this.apiBase}/${subscriptionId}/preview-proration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: newPriceId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: {
            code: error.code || 'PREVIEW_FAILED',
            message: error.message || 'Failed to preview proration',
            details: error.details,
          },
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: {
          subtotal: data.subtotal,
          total: data.total,
          amountDue: data.amount_due,
          currency: data.currency,
          prorationDate: data.proration_date,
          lines: (data.lines || []).map((line: Record<string, unknown>) => ({
            id: line.id as string,
            description: line.description as string,
            amount: line.amount as number,
            currency: line.currency as string,
            proration: line.proration as boolean,
            periodStart: line.period_start as number,
            periodEnd: line.period_end as number,
          })),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      }
    }
  }

  // ===========================================================================
  // PLAN HELPERS
  // ===========================================================================

  /**
   * Get price tier by ID
   *
   * @param tierId - Price tier identifier
   * @returns Price tier configuration or undefined
   */
  getPriceTier(tierId: PriceTier): PriceTierConfig | undefined {
    return PRICE_TIERS[tierId]
  }

  /**
   * Get all price tiers
   *
   * @returns All available price tiers
   */
  getAllPriceTiers(): PriceTierConfig[] {
    return Object.values(PRICE_TIERS)
  }

  /**
   * Determine tier from Stripe price ID
   *
   * @param priceId - Stripe price ID
   * @returns Price tier or undefined
   */
  getTierFromPriceId(priceId: string): PriceTier | undefined {
    for (const [tierId, config] of Object.entries(PRICE_TIERS)) {
      if (
        config.stripePriceIds?.monthly === priceId ||
        config.stripePriceIds?.yearly === priceId
      ) {
        return tierId as PriceTier
      }
    }
    return undefined
  }

  /**
   * Check if upgrade is possible
   *
   * @param currentTier - Current price tier
   * @param targetTier - Target price tier
   * @returns Whether upgrade is possible
   */
  canUpgrade(currentTier: PriceTier, targetTier: PriceTier): boolean {
    const tierOrder: PriceTier[] = ['starter', 'pro', 'business']
    return tierOrder.indexOf(targetTier) > tierOrder.indexOf(currentTier)
  }

  /**
   * Check if downgrade is possible
   *
   * @param currentTier - Current price tier
   * @param targetTier - Target price tier
   * @returns Whether downgrade is possible
   */
  canDowngrade(currentTier: PriceTier, targetTier: PriceTier): boolean {
    const tierOrder: PriceTier[] = ['starter', 'pro', 'business']
    return tierOrder.indexOf(targetTier) < tierOrder.indexOf(currentTier)
  }

  /**
   * Calculate annual savings compared to monthly
   *
   * @param tier - Price tier
   * @returns Annual savings amount
   */
  calculateAnnualSavings(tier: PriceTier): number {
    const config = PRICE_TIERS[tier]
    if (!config) return 0
    const monthlyAnnualized = config.monthlyPrice * 12
    return monthlyAnnualized - config.yearlyPrice
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Normalize Stripe subscription response to our interface
   */
  private normalizeSubscription(data: Record<string, unknown>): StripeSubscription {
    return {
      id: data.id as string,
      customerId: (data.customer_id || data.customer) as string,
      status: data.status as StripeSubscriptionStatus,
      priceId: (data.price_id ||
        ((data.items as Record<string, unknown>)?.data as Array<{ price?: { id?: string } }>)?.[0]
          ?.price?.id) as string,
      quantity: (data.quantity ||
        ((data.items as Record<string, unknown>)?.data as Array<{ quantity?: number }>)?.[0]
          ?.quantity ||
        1) as number,
      currentPeriodStart: data.current_period_start as number,
      currentPeriodEnd: data.current_period_end as number,
      cancelAtPeriodEnd: data.cancel_at_period_end as boolean,
      canceledAt: (data.canceled_at as number | null) || null,
      trialStart: (data.trial_start as number | null) || null,
      trialEnd: (data.trial_end as number | null) || null,
      pausedAt:
        (
          data.pause_collection as {
            resumes_at?: number
          }
        )?.resumes_at || null,
      resumesAt:
        (
          data.pause_collection as {
            resumes_at?: number
          }
        )?.resumes_at || null,
      latestInvoiceId: (data.latest_invoice as string | null) || null,
      defaultPaymentMethodId: (data.default_payment_method as string | null) || null,
      metadata: (data.metadata as Record<string, string>) || {},
      created: data.created as number,
    }
  }

  /**
   * Format currency amount
   *
   * @param amount - Amount in cents
   * @param currency - Currency code
   * @returns Formatted price string
   */
  formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount / 100)
  }

  /**
   * Format date for display
   *
   * @param timestamp - Unix timestamp
   * @returns Formatted date string
   */
  formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Default subscription service instance
 */
export const subscriptionService = new SubscriptionService()

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export default subscriptionService

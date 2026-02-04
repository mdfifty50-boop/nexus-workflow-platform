/**
 * Stripe Integration - Client-side helpers and configuration
 *
 * This module provides Stripe initialization and utility functions
 * for subscription management in Nexus.
 *
 * Pricing Structure:
 * - Free: $0/month (10 workflows)
 * - Starter: $29/month (30 workflows)
 * - Pro: $79/month (unlimited workflows)
 * - Business: $149/month (unlimited + premium features)
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js'

// =============================================================================
// STRIPE INITIALIZATION
// =============================================================================

let stripePromise: Promise<Stripe | null> | null = null

/**
 * Get the Stripe instance (lazy loaded singleton)
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

    if (!publishableKey) {
      console.warn('[Stripe] No publishable key found. Set VITE_STRIPE_PUBLISHABLE_KEY in your environment.')
      return Promise.resolve(null)
    }

    stripePromise = loadStripe(publishableKey)
  }

  return stripePromise
}

// =============================================================================
// PRICING CONFIGURATION
// =============================================================================

export interface PricingPlan {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number // For showing discounts
  currency: string
  interval: 'month' | 'year'
  features: string[]
  popular?: boolean
  badge?: string
  stripePriceId?: string // Set via environment or API
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with AI automation',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      '10 AI workflows per month',
      'Basic integrations',
      'Community support',
      'Single user',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams',
    price: 29,
    currency: 'USD',
    interval: 'month',
    features: [
      '30 AI workflows per month',
      '50+ integrations',
      'Email support',
      'Up to 3 team members',
      'Basic analytics',
    ],
    stripePriceId: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses',
    price: 79,
    currency: 'USD',
    interval: 'month',
    badge: 'MOST POPULAR',
    popular: true,
    features: [
      'Unlimited AI workflows',
      'All 800+ integrations',
      'Priority support',
      'Custom AI agents',
      'Up to 10 team members',
      'Advanced analytics',
      'API access',
    ],
    stripePriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'Enterprise-grade automation',
    price: 149,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited AI workflows',
      'All 800+ integrations',
      'Dedicated support',
      'Custom AI agents',
      'Unlimited team members',
      'Enterprise analytics',
      'API access',
      'Custom onboarding',
      'SLA guarantee',
    ],
    stripePriceId: import.meta.env.VITE_STRIPE_BUSINESS_PRICE_ID,
  },
}

// =============================================================================
// SUBSCRIPTION STATUS TYPES
// =============================================================================

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'paused'
  | 'none'

export interface Subscription {
  id: string
  status: SubscriptionStatus
  planId: string
  priceId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt?: Date
  trialEnd?: Date
}

export interface SubscriptionInfo {
  hasSubscription: boolean
  subscription: Subscription | null
  isActive: boolean
  isPastDue: boolean
  isCanceled: boolean
  isTrialing: boolean
  daysRemaining: number
  canAccessFeatures: boolean
}

// =============================================================================
// CHECKOUT HELPERS
// =============================================================================

export interface CreateCheckoutSessionParams {
  priceId: string
  successUrl?: string
  cancelUrl?: string
  customerId?: string
  customerEmail?: string
  metadata?: Record<string, string>
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<{ sessionId: string; url: string } | null> {
  try {
    const response = await fetch('/api/subscriptions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: params.priceId,
        successUrl: params.successUrl || `${window.location.origin}/checkout/success`,
        cancelUrl: params.cancelUrl || `${window.location.origin}/checkout/cancel`,
        customerId: params.customerId,
        customerEmail: params.customerEmail,
        metadata: params.metadata,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create checkout session')
    }

    const data = await response.json()
    return {
      sessionId: data.sessionId,
      url: data.url,
    }
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error)
    return null
  }
}

/**
 * Redirect to Stripe Checkout
 */
export async function redirectToCheckout(priceId: string, customerEmail?: string): Promise<void> {
  const session = await createCheckoutSession({
    priceId,
    customerEmail,
  })

  if (!session) {
    throw new Error('Failed to create checkout session')
  }

  // Redirect to Stripe Checkout using the session URL
  if (session.url) {
    window.location.href = session.url
  } else {
    throw new Error('No checkout URL received')
  }
}

// =============================================================================
// BILLING PORTAL
// =============================================================================

/**
 * Create a billing portal session for subscription management
 */
export async function createBillingPortalSession(
  returnUrl?: string
): Promise<{ url: string } | null> {
  try {
    const response = await fetch('/api/subscriptions/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        returnUrl: returnUrl || window.location.href,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create portal session')
    }

    const data = await response.json()
    return { url: data.url }
  } catch (error) {
    console.error('[Stripe] Error creating portal session:', error)
    return null
  }
}

/**
 * Redirect to Stripe Billing Portal
 */
export async function redirectToBillingPortal(returnUrl?: string): Promise<void> {
  const session = await createBillingPortalSession(returnUrl)

  if (!session) {
    throw new Error('Failed to create billing portal session')
  }

  window.location.href = session.url
}

// =============================================================================
// SUBSCRIPTION STATUS HELPERS
// =============================================================================

/**
 * Fetch current subscription status
 */
export async function fetchSubscriptionStatus(email?: string): Promise<SubscriptionInfo> {
  try {
    const params = new URLSearchParams()
    if (email) {
      params.set('email', email)
    }

    const url = `/api/subscriptions/status${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch subscription status')
    }

    return await response.json()
  } catch (error) {
    console.error('[Stripe] Error fetching subscription status:', error)
    return {
      hasSubscription: false,
      subscription: null,
      isActive: false,
      isPastDue: false,
      isCanceled: false,
      isTrialing: false,
      daysRemaining: 0,
      canAccessFeatures: false,
    }
  }
}

/**
 * Calculate days remaining in subscription period
 */
export function calculateDaysRemaining(periodEnd: Date): number {
  const now = new Date()
  const end = new Date(periodEnd)
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

/**
 * Check if subscription is in grace period (past due but still active)
 */
export function isInGracePeriod(status: SubscriptionStatus): boolean {
  return status === 'past_due'
}

/**
 * Format price for display
 */
export function formatPrice(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format price with Arabic locale for RTL support
 */
export function formatPriceRTL(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// =============================================================================
// STRIPE CONFIGURATION STATUS
// =============================================================================

export interface StripeConfigStatus {
  configured: boolean
  hasPublishableKey: boolean
  hasSecretKey: boolean
  hasWebhookSecret: boolean
  mode: 'test' | 'live' | 'unknown'
}

/**
 * Check Stripe configuration status
 */
export async function checkStripeConfig(): Promise<StripeConfigStatus> {
  try {
    const response = await fetch('/api/payments/config-status')

    if (!response.ok) {
      throw new Error('Failed to check Stripe config')
    }

    const data = await response.json()
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

    return {
      configured: data.configured,
      hasPublishableKey: !!publishableKey,
      hasSecretKey: data.details?.secretKey === 'configured',
      hasWebhookSecret: data.details?.webhookSecret === 'configured',
      mode: publishableKey.startsWith('pk_live_')
        ? 'live'
        : publishableKey.startsWith('pk_test_')
          ? 'test'
          : 'unknown',
    }
  } catch {
    return {
      configured: false,
      hasPublishableKey: false,
      hasSecretKey: false,
      hasWebhookSecret: false,
      mode: 'unknown',
    }
  }
}

export default {
  getStripe,
  PRICING_PLANS,
  createCheckoutSession,
  redirectToCheckout,
  createBillingPortalSession,
  redirectToBillingPortal,
  fetchSubscriptionStatus,
  formatPrice,
  formatPriceRTL,
  checkStripeConfig,
}

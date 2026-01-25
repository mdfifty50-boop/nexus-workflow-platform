/**
 * Payment Gateway Integrations
 *
 * Unified payment gateway module for Nexus workflow engine.
 * Supports multiple payment providers with a consistent interface.
 *
 * @module integrations/payments
 * @version 2024-01
 *
 * @example
 * ```typescript
 * import { createStripeGateway, createPayPalGateway, PaymentGateway } from './integrations/payments';
 *
 * // Create Stripe gateway
 * const stripe = createStripeGateway({
 *   apiKey: process.env.STRIPE_SECRET_KEY!,
 *   webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
 * });
 *
 * // Create PayPal gateway
 * const paypal = createPayPalGateway({
 *   clientId: process.env.PAYPAL_CLIENT_ID!,
 *   clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
 *   testMode: true,
 * });
 *
 * // Use the common interface
 * async function processPayment(gateway: PaymentGateway, amount: number) {
 *   await gateway.connect();
 *   return gateway.processPayment({
 *     amount: { amount: amount * 100, currency: 'USD' },
 *     paymentMethod: 'card',
 *   });
 * }
 * ```
 */

// ============================================================================
// BASE TYPES AND INTERFACES
// ============================================================================

// Core types
export type {
  PaymentMethodType,
  CardBrand,
  PaymentStatus,
  RefundStatus,
  CurrencyCode,
} from './payment-gateway'

// Money and address types
export type {
  Money,
  BillingAddress,
  CardDetails,
  PaymentCustomer,
  PaymentMethodDetails,
} from './payment-gateway'

// Payment request/response types
export type {
  PaymentRequest,
  PaymentResult,
  PaymentError,
  CaptureRequest,
  CaptureResult,
  VoidRequest,
  VoidResult,
  RefundRequest,
  RefundResult,
} from './payment-gateway'

// Customer types
export type {
  GatewayCustomer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from './payment-gateway'

// Subscription types
export type {
  SubscriptionStatus,
  BillingInterval,
  SubscriptionPlan,
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionResult,
} from './payment-gateway'

// Webhook types
export type {
  PaymentWebhookEventType,
  PaymentWebhookEvent,
  WebhookVerificationResult,
} from './payment-gateway'

// Gateway interface and config
export type {
  PaymentGatewayConfig,
  PaymentGateway,
} from './payment-gateway'

// Error classes
export {
  PaymentGatewayError,
  CardError,
  PaymentAuthError,
  PaymentRateLimitError,
  PaymentValidationError,
} from './payment-gateway'

// Helper functions
export {
  toSmallestUnit,
  fromSmallestUnit,
  formatMoney,
  createMoney,
  isPaymentSuccessful,
  canRefund,
  canCapture,
  canVoid,
  generateIdempotencyKey,
} from './payment-gateway'

// ============================================================================
// STRIPE GATEWAY
// ============================================================================

export {
  StripeGateway,
  createStripeGateway,
} from './stripe-gateway'

export type {
  StripeConfig,
} from './stripe-gateway'

// ============================================================================
// PAYPAL GATEWAY
// ============================================================================

export {
  PayPalGateway,
  createPayPalGateway,
  createExpressCheckout,
  completeExpressCheckout,
} from './paypal-gateway'

export type {
  PayPalConfig,
} from './paypal-gateway'

// ============================================================================
// PAYMENT GATEWAY MANAGER
// ============================================================================

import type { PaymentGateway } from './payment-gateway'
import { StripeGateway, type StripeConfig } from './stripe-gateway'
import { PayPalGateway, type PayPalConfig } from './paypal-gateway'

/**
 * Supported payment gateway types
 */
export type PaymentGatewayType = 'stripe' | 'paypal'

/**
 * Configuration for creating a payment gateway
 */
export type PaymentGatewayTypeConfig =
  | { type: 'stripe'; config: StripeConfig }
  | { type: 'paypal'; config: PayPalConfig }

/**
 * Payment Gateway Manager
 * Manages multiple payment gateways with unified access
 */
export class PaymentGatewayManager {
  private gateways: Map<string, PaymentGateway> = new Map()
  private defaultGatewayId: string | null = null

  /**
   * Register a payment gateway
   */
  register(id: string, gateway: PaymentGateway): void {
    this.gateways.set(id, gateway)

    // Set as default if first gateway
    if (!this.defaultGatewayId) {
      this.defaultGatewayId = id
    }

    console.log(`[PaymentGatewayManager] Registered gateway: ${id} (${gateway.displayName})`)
  }

  /**
   * Create and register a gateway from config
   */
  create(id: string, typeConfig: PaymentGatewayTypeConfig): PaymentGateway {
    let gateway: PaymentGateway

    switch (typeConfig.type) {
      case 'stripe':
        gateway = new StripeGateway(typeConfig.config)
        break
      case 'paypal':
        gateway = new PayPalGateway(typeConfig.config)
        break
      default:
        throw new Error(`Unknown gateway type: ${(typeConfig as { type: string }).type}`)
    }

    this.register(id, gateway)
    return gateway
  }

  /**
   * Get a registered gateway
   */
  get(id: string): PaymentGateway | undefined {
    return this.gateways.get(id)
  }

  /**
   * Get the default gateway
   */
  getDefault(): PaymentGateway | undefined {
    return this.defaultGatewayId ? this.gateways.get(this.defaultGatewayId) : undefined
  }

  /**
   * Set the default gateway
   */
  setDefault(id: string): void {
    if (!this.gateways.has(id)) {
      throw new Error(`Gateway not found: ${id}`)
    }
    this.defaultGatewayId = id
  }

  /**
   * Check if a gateway is registered
   */
  has(id: string): boolean {
    return this.gateways.has(id)
  }

  /**
   * Remove a gateway
   */
  remove(id: string): boolean {
    const removed = this.gateways.delete(id)

    if (removed && this.defaultGatewayId === id) {
      // Set new default if available
      const firstKey = this.gateways.keys().next().value
      this.defaultGatewayId = firstKey || null
    }

    return removed
  }

  /**
   * Get all registered gateway IDs
   */
  getRegisteredIds(): string[] {
    return Array.from(this.gateways.keys())
  }

  /**
   * Connect all gateways
   */
  async connectAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>()

    for (const [id, gateway] of this.gateways) {
      try {
        const connected = await gateway.connect()
        results.set(id, connected)
      } catch (error) {
        console.error(`[PaymentGatewayManager] Failed to connect ${id}:`, error)
        results.set(id, false)
      }
    }

    return results
  }

  /**
   * Disconnect all gateways
   */
  disconnectAll(): void {
    for (const gateway of this.gateways.values()) {
      gateway.disconnect()
    }
  }

  /**
   * Get gateway summary
   */
  getSummary(): Array<{
    id: string
    name: string
    displayName: string
    isConnected: boolean
    supportedMethods: string[]
    isDefault: boolean
  }> {
    return Array.from(this.gateways.entries()).map(([id, gateway]) => ({
      id,
      name: gateway.name,
      displayName: gateway.displayName,
      isConnected: gateway.isConnected,
      supportedMethods: gateway.supportedMethods,
      isDefault: id === this.defaultGatewayId,
    }))
  }
}

/**
 * Default payment gateway manager instance
 */
export const paymentGatewayManager = new PaymentGatewayManager()

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * Quick helper to create and connect a Stripe gateway
 */
export async function setupStripeGateway(
  manager: PaymentGatewayManager,
  config: StripeConfig,
  id = 'stripe'
): Promise<PaymentGateway> {
  const gateway = manager.create(id, { type: 'stripe', config })
  await gateway.connect()
  return gateway
}

/**
 * Quick helper to create and connect a PayPal gateway
 */
export async function setupPayPalGateway(
  manager: PaymentGatewayManager,
  config: PayPalConfig,
  id = 'paypal'
): Promise<PaymentGateway> {
  const gateway = manager.create(id, { type: 'paypal', config })
  await gateway.connect()
  return gateway
}

/**
 * Create a unified payment handler for order pipeline integration
 */
export function createOrderPaymentHandler(
  manager: PaymentGatewayManager
) {
  return {
    /**
     * Process payment for an order
     */
    async processOrderPayment(
      orderId: string,
      amount: number,
      currency: string,
      options?: {
        gatewayId?: string
        paymentMethod?: string
        capture?: boolean
        metadata?: Record<string, string>
      }
    ) {
      const gateway = options?.gatewayId
        ? manager.get(options.gatewayId)
        : manager.getDefault()

      if (!gateway) {
        throw new Error('No payment gateway available')
      }

      const { toSmallestUnit } = await import('./payment-gateway')

      return gateway.processPayment({
        amount: { amount: toSmallestUnit(amount, currency), currency },
        paymentMethod: options?.paymentMethod || 'card',
        orderId,
        capture: options?.capture,
        metadata: options?.metadata,
      })
    },

    /**
     * Refund an order payment
     */
    async refundOrderPayment(
      paymentId: string,
      amount?: number,
      currency = 'USD',
      options?: {
        gatewayId?: string
        reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other'
        reasonDescription?: string
      }
    ) {
      const gateway = options?.gatewayId
        ? manager.get(options.gatewayId)
        : manager.getDefault()

      if (!gateway) {
        throw new Error('No payment gateway available')
      }

      const { toSmallestUnit } = await import('./payment-gateway')

      return gateway.refundPayment({
        paymentId,
        amount: amount ? { amount: toSmallestUnit(amount, currency), currency } : undefined,
        reason: options?.reason,
        reasonDescription: options?.reasonDescription,
      })
    },

    /**
     * Get payment status
     */
    async getPaymentStatus(paymentId: string, gatewayId?: string) {
      const gateway = gatewayId
        ? manager.get(gatewayId)
        : manager.getDefault()

      if (!gateway) {
        throw new Error('No payment gateway available')
      }

      return gateway.getPayment(paymentId)
    },
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Gateway Manager
  PaymentGatewayManager,
  paymentGatewayManager,

  // Factory functions
  createStripeGateway: (config: StripeConfig) => new StripeGateway(config),
  createPayPalGateway: (config: PayPalConfig) => new PayPalGateway(config),

  // Setup helpers
  setupStripeGateway,
  setupPayPalGateway,

  // Order integration
  createOrderPaymentHandler,
}

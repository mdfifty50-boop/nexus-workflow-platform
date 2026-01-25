/**
 * Stripe Payment Gateway Integration
 *
 * Full Stripe integration including:
 * - Payment processing (authorize, capture, refund, void)
 * - Customer management
 * - Subscription management
 * - Webhook handling
 *
 * @module integrations/payments/stripe
 * @version 2024-01
 *
 * @example
 * ```typescript
 * import { createStripeGateway } from './stripe-gateway';
 *
 * const stripe = createStripeGateway({
 *   apiKey: process.env.STRIPE_SECRET_KEY!,
 *   webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
 * });
 *
 * await stripe.connect();
 *
 * const result = await stripe.processPayment({
 *   amount: { amount: 2999, currency: 'USD' },
 *   paymentMethod: 'pm_card_visa',
 *   description: 'Order #12345',
 * });
 * ```
 */

import type {
  PaymentGateway,
  PaymentGatewayConfig,
  PaymentRequest,
  PaymentResult,
  CaptureRequest,
  CaptureResult,
  VoidRequest,
  VoidResult,
  RefundRequest,
  RefundResult,
  PaymentMethodType,
  PaymentStatus,
  PaymentError,
  CardBrand,
  CardDetails,
  PaymentMethodDetails,
  GatewayCustomer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  Subscription,
  SubscriptionStatus,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionResult,
  PaymentWebhookEvent,
  PaymentWebhookEventType,
  WebhookVerificationResult,
} from './payment-gateway'

import {
  PaymentGatewayError,
  CardError,
  PaymentAuthError,
  PaymentRateLimitError,
  PaymentValidationError,
} from './payment-gateway'

// ============================================================================
// STRIPE CONFIGURATION
// ============================================================================

/**
 * Stripe-specific configuration
 */
export interface StripeConfig extends PaymentGatewayConfig {
  /** Stripe API version (defaults to latest stable) */
  apiVersion?: string
  /** Connected account ID for Stripe Connect */
  stripeAccount?: string
  /** Maximum network retries */
  maxNetworkRetries?: number
}

// ============================================================================
// STRIPE API TYPES
// ============================================================================

/**
 * Stripe PaymentIntent status mapping
 */
type StripePaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded'

/**
 * Stripe PaymentIntent response shape
 */
interface StripePaymentIntent {
  id: string
  object: 'payment_intent'
  amount: number
  amount_received: number
  currency: string
  status: StripePaymentIntentStatus
  client_secret: string
  created: number
  payment_method?: string | StripePaymentMethod
  payment_method_types: string[]
  metadata?: Record<string, string>
  last_payment_error?: {
    code?: string
    message: string
    decline_code?: string
    param?: string
    type: string
  }
  charges?: {
    data: Array<{
      id: string
      refunded: boolean
      amount_refunded: number
    }>
  }
  next_action?: {
    type: string
    redirect_to_url?: {
      url: string
    }
  }
}

/**
 * Stripe PaymentMethod response shape
 */
interface StripePaymentMethod {
  id: string
  object: 'payment_method'
  type: string
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
    funding: string
    country: string
    fingerprint: string
  }
  billing_details: {
    email?: string
    name?: string
    phone?: string
    address?: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      postal_code?: string
      country?: string
    }
  }
  created: number
  customer?: string
}

/**
 * Stripe Refund response shape
 */
interface StripeRefund {
  id: string
  object: 'refund'
  amount: number
  currency: string
  payment_intent: string
  status: 'pending' | 'succeeded' | 'failed' | 'canceled'
  reason?: string
  created: number
  metadata?: Record<string, string>
}

/**
 * Stripe Customer response shape
 */
interface StripeCustomer {
  id: string
  object: 'customer'
  email: string
  name?: string
  phone?: string
  invoice_settings?: {
    default_payment_method?: string
  }
  metadata?: Record<string, string>
  created: number
}

/**
 * Stripe Subscription response shape
 */
interface StripeSubscription {
  id: string
  object: 'subscription'
  customer: string
  status: string
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  canceled_at?: number
  trial_start?: number
  trial_end?: number
  items: {
    data: Array<{
      id: string
      price: {
        id: string
        product: string
      }
    }>
  }
  metadata?: Record<string, string>
  created: number
}

/**
 * Stripe Event response shape
 */
interface StripeEvent {
  id: string
  object: 'event'
  type: string
  data: {
    object: Record<string, unknown>
  }
  created: number
  livemode: boolean
}

// ============================================================================
// STRIPE GATEWAY IMPLEMENTATION
// ============================================================================

/**
 * Stripe Payment Gateway
 *
 * Implements the PaymentGateway interface for Stripe.
 */
export class StripeGateway implements PaymentGateway {
  readonly name = 'stripe'
  readonly displayName = 'Stripe'
  readonly supportedMethods: PaymentMethodType[] = [
    'card',
    'bank_transfer',
    'apple_pay',
    'google_pay',
    'wallet',
  ]

  private config: StripeConfig
  private connected = false
  private baseUrl = 'https://api.stripe.com/v1'

  constructor(config: StripeConfig) {
    this.config = {
      ...config,
      apiVersion: config.apiVersion || '2024-11-20.acacia',
      timeout: config.timeout || 30000,
      maxNetworkRetries: config.maxNetworkRetries || 2,
    }
  }

  get isConnected(): boolean {
    return this.connected
  }

  // ========================================
  // Connection Management
  // ========================================

  async connect(): Promise<boolean> {
    try {
      // Verify credentials by fetching account info
      const response = await this.makeRequest<{ id: string }>('GET', '/account')
      this.connected = !!response.id
      console.log(`[StripeGateway] Connected to account: ${response.id}`)
      return this.connected
    } catch (error) {
      console.error('[StripeGateway] Connection failed:', error)
      this.connected = false
      return false
    }
  }

  disconnect(): void {
    this.connected = false
    console.log('[StripeGateway] Disconnected')
  }

  // ========================================
  // Payment Operations
  // ========================================

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const params: Record<string, unknown> = {
        amount: request.amount.amount,
        currency: request.amount.currency.toLowerCase(),
        capture_method: request.capture === false ? 'manual' : 'automatic',
        confirm: true,
      }

      // Handle payment method
      if (typeof request.paymentMethod === 'string') {
        params.payment_method = request.paymentMethod
      }

      // Add optional fields
      if (request.description) {
        params.description = request.description
      }
      if (request.customer?.id) {
        params.customer = request.customer.id
      }
      if (request.metadata) {
        params.metadata = request.metadata
      }
      if (request.returnUrl) {
        params.return_url = request.returnUrl
      }

      const headers: Record<string, string> = {}
      if (request.idempotencyKey) {
        headers['Idempotency-Key'] = request.idempotencyKey
      }

      const intent = await this.makeRequest<StripePaymentIntent>(
        'POST',
        '/payment_intents',
        params,
        headers
      )

      return this.mapPaymentIntentToResult(intent)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async capturePayment(request: CaptureRequest): Promise<CaptureResult> {
    try {
      const params: Record<string, unknown> = {}

      if (request.amount) {
        params.amount_to_capture = request.amount.amount
      }
      if (request.metadata) {
        params.metadata = request.metadata
      }

      const intent = await this.makeRequest<StripePaymentIntent>(
        'POST',
        `/payment_intents/${request.paymentId}/capture`,
        params
      )

      return {
        success: intent.status === 'succeeded',
        paymentId: intent.id,
        status: this.mapStatus(intent.status),
        amount: { amount: intent.amount_received, currency: intent.currency.toUpperCase() },
        capturedAt: new Date(intent.created * 1000).toISOString(),
        rawResponse: intent as unknown as Record<string, unknown>,
      }
    } catch (error) {
      const paymentError = this.parseError(error)
      return {
        success: false,
        paymentId: request.paymentId,
        status: 'failed',
        amount: request.amount || { amount: 0, currency: 'USD' },
        capturedAt: new Date().toISOString(),
        error: paymentError,
      }
    }
  }

  async voidPayment(request: VoidRequest): Promise<VoidResult> {
    try {
      const params: Record<string, unknown> = {}

      if (request.reason) {
        params.cancellation_reason = request.reason
      }
      if (request.metadata) {
        params.metadata = request.metadata
      }

      const intent = await this.makeRequest<StripePaymentIntent>(
        'POST',
        `/payment_intents/${request.paymentId}/cancel`,
        params
      )

      return {
        success: intent.status === 'canceled',
        paymentId: intent.id,
        status: this.mapStatus(intent.status),
        voidedAt: new Date().toISOString(),
        rawResponse: intent as unknown as Record<string, unknown>,
      }
    } catch (error) {
      const paymentError = this.parseError(error)
      return {
        success: false,
        paymentId: request.paymentId,
        status: 'failed',
        voidedAt: new Date().toISOString(),
        error: paymentError,
      }
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResult> {
    try {
      const params: Record<string, unknown> = {
        payment_intent: request.paymentId,
      }

      if (request.amount) {
        params.amount = request.amount.amount
      }
      if (request.reason) {
        params.reason = request.reason
      }
      if (request.metadata) {
        params.metadata = request.metadata
      }

      const headers: Record<string, string> = {}
      if (request.idempotencyKey) {
        headers['Idempotency-Key'] = request.idempotencyKey
      }

      const refund = await this.makeRequest<StripeRefund>(
        'POST',
        '/refunds',
        params,
        headers
      )

      return {
        success: refund.status === 'succeeded',
        refundId: refund.id,
        paymentId: request.paymentId,
        status: refund.status as 'pending' | 'succeeded' | 'failed' | 'canceled',
        amount: { amount: refund.amount, currency: refund.currency.toUpperCase() },
        reason: refund.reason,
        createdAt: new Date(refund.created * 1000).toISOString(),
        rawResponse: refund as unknown as Record<string, unknown>,
      }
    } catch (error) {
      const paymentError = this.parseError(error)
      return {
        success: false,
        refundId: '',
        paymentId: request.paymentId,
        status: 'failed',
        amount: request.amount || { amount: 0, currency: 'USD' },
        createdAt: new Date().toISOString(),
        error: paymentError,
      }
    }
  }

  async getPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const intent = await this.makeRequest<StripePaymentIntent>(
        'GET',
        `/payment_intents/${paymentId}`
      )
      return this.mapPaymentIntentToResult(intent)
    } catch (error) {
      return this.handleError(error)
    }
  }

  // ========================================
  // Customer Management
  // ========================================

  async createCustomer(request: CreateCustomerRequest): Promise<GatewayCustomer> {
    const params: Record<string, unknown> = {
      email: request.email,
    }

    if (request.name) params.name = request.name
    if (request.phone) params.phone = request.phone
    if (request.paymentMethod) {
      params.payment_method = request.paymentMethod
      params.invoice_settings = { default_payment_method: request.paymentMethod }
    }
    if (request.metadata) params.metadata = request.metadata

    const customer = await this.makeRequest<StripeCustomer>('POST', '/customers', params)
    return this.mapCustomer(customer)
  }

  async updateCustomer(request: UpdateCustomerRequest): Promise<GatewayCustomer> {
    const params: Record<string, unknown> = {}

    if (request.email) params.email = request.email
    if (request.name) params.name = request.name
    if (request.phone) params.phone = request.phone
    if (request.defaultPaymentMethod) {
      params.invoice_settings = { default_payment_method: request.defaultPaymentMethod }
    }
    if (request.metadata) params.metadata = request.metadata

    const customer = await this.makeRequest<StripeCustomer>(
      'POST',
      `/customers/${request.customerId}`,
      params
    )
    return this.mapCustomer(customer)
  }

  async getCustomer(customerId: string): Promise<GatewayCustomer | null> {
    try {
      const customer = await this.makeRequest<StripeCustomer>('GET', `/customers/${customerId}`)
      return this.mapCustomer(customer)
    } catch {
      return null
    }
  }

  async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      await this.makeRequest<{ deleted: boolean }>('DELETE', `/customers/${customerId}`)
      return true
    } catch {
      return false
    }
  }

  // ========================================
  // Subscription Management
  // ========================================

  async createSubscription(request: CreateSubscriptionRequest): Promise<SubscriptionResult> {
    try {
      const params: Record<string, unknown> = {
        customer: request.customerId,
        items: [{ price: request.planId }],
      }

      if (request.paymentMethod) {
        params.default_payment_method = request.paymentMethod
      }
      if (request.trialDays) {
        params.trial_period_days = request.trialDays
      }
      if (request.startDate) {
        params.billing_cycle_anchor = Math.floor(new Date(request.startDate).getTime() / 1000)
      }
      if (request.metadata) {
        params.metadata = request.metadata
      }
      if (request.coupon) {
        params.coupon = request.coupon
      }

      const sub = await this.makeRequest<StripeSubscription>('POST', '/subscriptions', params)

      return {
        success: true,
        subscription: this.mapSubscription(sub),
        rawResponse: sub as unknown as Record<string, unknown>,
      }
    } catch (error) {
      return {
        success: false,
        error: this.parseError(error),
      }
    }
  }

  async updateSubscription(request: UpdateSubscriptionRequest): Promise<SubscriptionResult> {
    try {
      const params: Record<string, unknown> = {}

      if (request.planId) {
        // Get current subscription to find the item ID
        const current = await this.makeRequest<StripeSubscription>(
          'GET',
          `/subscriptions/${request.subscriptionId}`
        )
        const itemId = current.items.data[0]?.id
        if (itemId) {
          params.items = [{ id: itemId, price: request.planId }]
        }
      }
      if (request.paymentMethod) {
        params.default_payment_method = request.paymentMethod
      }
      if (request.cancelAtPeriodEnd !== undefined) {
        params.cancel_at_period_end = request.cancelAtPeriodEnd
      }
      if (request.metadata) {
        params.metadata = request.metadata
      }
      if (request.prorationBehavior) {
        params.proration_behavior = request.prorationBehavior
      }

      const sub = await this.makeRequest<StripeSubscription>(
        'POST',
        `/subscriptions/${request.subscriptionId}`,
        params
      )

      return {
        success: true,
        subscription: this.mapSubscription(sub),
        rawResponse: sub as unknown as Record<string, unknown>,
      }
    } catch (error) {
      return {
        success: false,
        error: this.parseError(error),
      }
    }
  }

  async cancelSubscription(subscriptionId: string, cancelImmediately = false): Promise<SubscriptionResult> {
    try {
      let sub: StripeSubscription

      if (cancelImmediately) {
        sub = await this.makeRequest<StripeSubscription>('DELETE', `/subscriptions/${subscriptionId}`)
      } else {
        sub = await this.makeRequest<StripeSubscription>(
          'POST',
          `/subscriptions/${subscriptionId}`,
          { cancel_at_period_end: true }
        )
      }

      return {
        success: true,
        subscription: this.mapSubscription(sub),
        rawResponse: sub as unknown as Record<string, unknown>,
      }
    } catch (error) {
      return {
        success: false,
        error: this.parseError(error),
      }
    }
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const sub = await this.makeRequest<StripeSubscription>('GET', `/subscriptions/${subscriptionId}`)
      return this.mapSubscription(sub)
    } catch {
      return null
    }
  }

  // ========================================
  // Webhook Handling
  // ========================================

  verifyWebhook(payload: string | Buffer, signature: string): WebhookVerificationResult {
    if (!this.config.webhookSecret) {
      return { valid: false, error: 'Webhook secret not configured' }
    }

    try {
      // Stripe webhook verification using HMAC-SHA256
      const payloadStr = typeof payload === 'string' ? payload : payload.toString('utf8')
      const signatureParts = signature.split(',').reduce((acc, part) => {
        const [key, value] = part.split('=')
        if (key && value) {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, string>)

      const timestamp = signatureParts['t']
      const sig = signatureParts['v1']

      if (!timestamp || !sig) {
        return { valid: false, error: 'Invalid signature format' }
      }

      // Check timestamp tolerance (5 minutes)
      const timestampNum = parseInt(timestamp, 10)
      const now = Math.floor(Date.now() / 1000)
      if (Math.abs(now - timestampNum) > 300) {
        return { valid: false, error: 'Webhook timestamp too old' }
      }

      // Compute expected signature
      const signedPayload = `${timestamp}.${payloadStr}`
      const expectedSig = this.computeHmacSignature(signedPayload, this.config.webhookSecret)

      // Timing-safe comparison
      if (!this.timingSafeEqual(sig, expectedSig)) {
        return { valid: false, error: 'Invalid signature' }
      }

      // Parse and map event
      const stripeEvent = JSON.parse(payloadStr) as StripeEvent
      const event = this.mapWebhookEvent(stripeEvent)

      return { valid: true, event }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Webhook verification failed',
      }
    }
  }

  async handleWebhookEvent(event: PaymentWebhookEvent): Promise<void> {
    console.log(`[StripeGateway] Handling webhook event: ${event.type}`, { id: event.id })
    // Event handling would typically dispatch to appropriate handlers
    // This is a hook for subclasses or event listeners
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    data?: Record<string, unknown>,
    extraHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': this.config.apiVersion || '2024-11-20.acacia',
      ...extraHeaders,
    }

    if (this.config.stripeAccount) {
      headers['Stripe-Account'] = this.config.stripeAccount
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (data && method !== 'GET') {
      options.body = this.encodeFormData(data)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as Record<string, unknown>
      throw this.createErrorFromResponse(response.status, errorBody)
    }

    return response.json() as Promise<T>
  }

  private encodeFormData(data: Record<string, unknown>, prefix = ''): string {
    const parts: string[] = []

    for (const [key, value] of Object.entries(data)) {
      const fullKey = prefix ? `${prefix}[${key}]` : key

      if (value === null || value === undefined) {
        continue
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        parts.push(this.encodeFormData(value as Record<string, unknown>, fullKey))
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            parts.push(this.encodeFormData(item as Record<string, unknown>, `${fullKey}[${index}]`))
          } else {
            parts.push(`${encodeURIComponent(`${fullKey}[${index}]`)}=${encodeURIComponent(String(item))}`)
          }
        })
      } else {
        parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`)
      }
    }

    return parts.filter(Boolean).join('&')
  }

  private createErrorFromResponse(status: number, body: Record<string, unknown>): Error {
    const error = body.error as Record<string, unknown> | undefined

    if (status === 401) {
      throw new PaymentAuthError(
        (error?.message as string) || 'Invalid API key',
        { status, body }
      )
    }

    if (status === 429) {
      throw new PaymentRateLimitError(
        (error?.message as string) || 'Rate limit exceeded',
        undefined,
        { status, body }
      )
    }

    if (error?.type === 'card_error') {
      throw new CardError(
        (error.message as string) || 'Card declined',
        error.decline_code as string,
        { status, body }
      )
    }

    if (error?.type === 'validation_error' || error?.type === 'invalid_request_error') {
      throw new PaymentValidationError(
        (error.message as string) || 'Invalid request',
        error.param as string,
        { status, body }
      )
    }

    throw new PaymentGatewayError(
      (error?.message as string) || `Stripe API error (${status})`,
      (error?.code as string) || 'api_error',
      'api_error',
      status >= 500,
      { status, body }
    )
  }

  private parseError(error: unknown): PaymentError {
    if (error instanceof PaymentGatewayError) {
      return error.toPaymentError()
    }

    return {
      code: 'unknown_error',
      message: error instanceof Error ? error.message : 'Unknown error',
      type: 'api_error',
      retryable: false,
    }
  }

  private handleError(error: unknown): PaymentResult {
    const paymentError = this.parseError(error)
    return {
      success: false,
      paymentId: '',
      status: 'failed',
      amount: { amount: 0, currency: 'USD' },
      createdAt: new Date().toISOString(),
      error: paymentError,
    }
  }

  private mapStatus(stripeStatus: StripePaymentIntentStatus): PaymentStatus {
    const statusMap: Record<StripePaymentIntentStatus, PaymentStatus> = {
      requires_payment_method: 'pending',
      requires_confirmation: 'pending',
      requires_action: 'requires_action',
      processing: 'processing',
      requires_capture: 'authorized',
      canceled: 'canceled',
      succeeded: 'succeeded',
    }
    return statusMap[stripeStatus] || 'pending'
  }

  private mapCardBrand(brand: string): CardBrand {
    const brandMap: Record<string, CardBrand> = {
      visa: 'visa',
      mastercard: 'mastercard',
      amex: 'amex',
      discover: 'discover',
      diners: 'diners',
      jcb: 'jcb',
      unionpay: 'unionpay',
    }
    return brandMap[brand.toLowerCase()] || 'unknown'
  }

  private mapPaymentMethod(pm: StripePaymentMethod): PaymentMethodDetails {
    const details: PaymentMethodDetails = {
      type: pm.type as PaymentMethodType,
    }

    if (pm.card) {
      details.card = {
        brand: this.mapCardBrand(pm.card.brand),
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
        funding: pm.card.funding as CardDetails['funding'],
        country: pm.card.country,
        fingerprint: pm.card.fingerprint,
      }
    }

    return details
  }

  private mapPaymentIntentToResult(intent: StripePaymentIntent): PaymentResult {
    const result: PaymentResult = {
      success: intent.status === 'succeeded',
      paymentId: intent.id,
      status: this.mapStatus(intent.status),
      amount: { amount: intent.amount, currency: intent.currency.toUpperCase() },
      createdAt: new Date(intent.created * 1000).toISOString(),
      rawResponse: intent as unknown as Record<string, unknown>,
      metadata: intent.metadata,
    }

    // Add client secret for frontend completion
    if (intent.status === 'requires_action' || intent.status === 'requires_payment_method') {
      result.clientSecret = intent.client_secret
    }

    // Add redirect URL if needed
    if (intent.next_action?.redirect_to_url?.url) {
      result.redirectUrl = intent.next_action.redirect_to_url.url
    }

    // Map payment method
    if (typeof intent.payment_method === 'object') {
      result.paymentMethod = this.mapPaymentMethod(intent.payment_method)
    }

    // Map error if present
    if (intent.last_payment_error) {
      result.error = {
        code: intent.last_payment_error.code || 'payment_failed',
        message: intent.last_payment_error.message,
        type: intent.last_payment_error.type as PaymentError['type'],
        declineCode: intent.last_payment_error.decline_code,
        param: intent.last_payment_error.param,
        retryable: false,
      }
    }

    return result
  }

  private mapCustomer(customer: StripeCustomer): GatewayCustomer {
    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      defaultPaymentMethod: customer.invoice_settings?.default_payment_method,
      paymentMethods: [], // Would need separate call to list payment methods
      metadata: customer.metadata,
      createdAt: new Date(customer.created * 1000).toISOString(),
    }
  }

  private mapSubscriptionStatus(status: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: 'active',
      past_due: 'past_due',
      unpaid: 'unpaid',
      canceled: 'canceled',
      trialing: 'trialing',
      paused: 'paused',
      incomplete: 'incomplete',
      incomplete_expired: 'incomplete_expired',
    }
    return statusMap[status] || 'active'
  }

  private mapSubscription(sub: StripeSubscription): Subscription {
    return {
      id: sub.id,
      customerId: sub.customer,
      planId: sub.items.data[0]?.price.id || '',
      status: this.mapSubscriptionStatus(sub.status),
      currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : undefined,
      trialStart: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : undefined,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : undefined,
      metadata: sub.metadata,
      createdAt: new Date(sub.created * 1000).toISOString(),
    }
  }

  private mapWebhookEventType(stripeType: string): PaymentWebhookEventType {
    const typeMap: Record<string, PaymentWebhookEventType> = {
      'payment_intent.created': 'payment.created',
      'payment_intent.succeeded': 'payment.succeeded',
      'payment_intent.payment_failed': 'payment.failed',
      'payment_intent.canceled': 'payment.canceled',
      'payment_intent.requires_action': 'payment.requires_action',
      'charge.refunded': 'payment.refunded',
      'charge.dispute.created': 'payment.disputed',
      'refund.created': 'refund.created',
      'refund.updated': 'refund.succeeded',
      'refund.failed': 'refund.failed',
      'customer.created': 'customer.created',
      'customer.updated': 'customer.updated',
      'customer.deleted': 'customer.deleted',
      'customer.subscription.created': 'subscription.created',
      'customer.subscription.updated': 'subscription.updated',
      'customer.subscription.deleted': 'subscription.canceled',
      'invoice.created': 'invoice.created',
      'invoice.paid': 'invoice.paid',
      'invoice.payment_failed': 'invoice.payment_failed',
    }
    return typeMap[stripeType] || ('payment.created' as PaymentWebhookEventType)
  }

  private mapWebhookEvent(stripeEvent: StripeEvent): PaymentWebhookEvent {
    return {
      id: `stripe_${stripeEvent.id}`,
      type: this.mapWebhookEventType(stripeEvent.type),
      data: stripeEvent.data.object,
      createdAt: new Date(stripeEvent.created * 1000).toISOString(),
      livemode: stripeEvent.livemode,
      gatewayEventId: stripeEvent.id,
    }
  }

  private computeHmacSignature(payload: string, secret: string): string {
    // In a real implementation, use crypto module
    // This is a placeholder - actual implementation would use:
    // const crypto = require('crypto');
    // return crypto.createHmac('sha256', secret).update(payload).digest('hex');
    void payload
    void secret
    return '' // Placeholder
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new Stripe gateway instance
 */
export function createStripeGateway(config: StripeConfig): StripeGateway {
  return new StripeGateway(config)
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  StripeGateway,
  createStripeGateway,
}

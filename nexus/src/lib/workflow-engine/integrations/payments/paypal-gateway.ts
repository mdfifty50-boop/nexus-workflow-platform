/**
 * PayPal Payment Gateway Integration
 *
 * PayPal integration including:
 * - PayPal Checkout (Orders API)
 * - PayPal Express payments
 * - Refund processing
 * - Webhook handling
 *
 * @module integrations/payments/paypal
 * @version 2024-01
 *
 * @example
 * ```typescript
 * import { createPayPalGateway } from './paypal-gateway';
 *
 * const paypal = createPayPalGateway({
 *   clientId: process.env.PAYPAL_CLIENT_ID!,
 *   clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
 *   testMode: true,
 * });
 *
 * await paypal.connect();
 *
 * const result = await paypal.processPayment({
 *   amount: { amount: 2999, currency: 'USD' },
 *   paymentMethod: 'paypal',
 *   returnUrl: 'https://example.com/success',
 *   description: 'Order #12345',
 * });
 *
 * // Redirect user to result.redirectUrl for approval
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
  GatewayCustomer,
  CreateCustomerRequest,
  PaymentWebhookEvent,
  PaymentWebhookEventType,
  WebhookVerificationResult,
  Money,
} from './payment-gateway'

import {
  PaymentGatewayError,
  PaymentAuthError,
  PaymentRateLimitError,
  PaymentValidationError,
  fromSmallestUnit,
  toSmallestUnit,
} from './payment-gateway'

// ============================================================================
// PAYPAL CONFIGURATION
// ============================================================================

/**
 * PayPal-specific configuration
 */
export interface PayPalConfig extends Omit<PaymentGatewayConfig, 'apiKey'> {
  /** PayPal Client ID */
  clientId: string
  /** PayPal Client Secret */
  clientSecret: string
  /** Use sandbox mode (default: false) */
  testMode?: boolean
  /** Brand name to show on PayPal checkout */
  brandName?: string
  /** Locale for PayPal checkout (e.g., 'en-US') */
  locale?: string
}

// ============================================================================
// PAYPAL API TYPES
// ============================================================================

/**
 * PayPal Order status
 */
type PayPalOrderStatus =
  | 'CREATED'
  | 'SAVED'
  | 'APPROVED'
  | 'VOIDED'
  | 'COMPLETED'
  | 'PAYER_ACTION_REQUIRED'

/**
 * PayPal Order response
 */
interface PayPalOrder {
  id: string
  status: PayPalOrderStatus
  intent: 'CAPTURE' | 'AUTHORIZE'
  create_time: string
  update_time?: string
  purchase_units: PayPalPurchaseUnit[]
  payer?: PayPalPayer
  payment_source?: Record<string, unknown>
  links?: PayPalLink[]
}

/**
 * PayPal Purchase Unit
 */
interface PayPalPurchaseUnit {
  reference_id?: string
  description?: string
  custom_id?: string
  invoice_id?: string
  amount: {
    currency_code: string
    value: string
    breakdown?: {
      item_total?: { currency_code: string; value: string }
      shipping?: { currency_code: string; value: string }
      tax_total?: { currency_code: string; value: string }
      discount?: { currency_code: string; value: string }
    }
  }
  items?: PayPalItem[]
  shipping?: {
    name?: { full_name: string }
    address?: {
      address_line_1?: string
      address_line_2?: string
      admin_area_2?: string // city
      admin_area_1?: string // state
      postal_code?: string
      country_code: string
    }
  }
  payments?: {
    captures?: PayPalCapture[]
    authorizations?: PayPalAuthorization[]
    refunds?: PayPalRefund[]
  }
}

/**
 * PayPal Item
 */
interface PayPalItem {
  name: string
  unit_amount: {
    currency_code: string
    value: string
  }
  quantity: string
  description?: string
  sku?: string
  category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS' | 'DONATION'
}

/**
 * PayPal Payer info
 */
interface PayPalPayer {
  payer_id: string
  email_address?: string
  name?: {
    given_name?: string
    surname?: string
  }
  phone?: {
    phone_number?: {
      national_number: string
    }
  }
  address?: {
    country_code: string
  }
}

/**
 * PayPal Link (HATEOAS)
 */
interface PayPalLink {
  href: string
  rel: string
  method?: string
}

/**
 * PayPal Capture
 */
interface PayPalCapture {
  id: string
  status: 'COMPLETED' | 'DECLINED' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED'
  amount: {
    currency_code: string
    value: string
  }
  final_capture: boolean
  create_time: string
  update_time?: string
}

/**
 * PayPal Authorization
 */
interface PayPalAuthorization {
  id: string
  status: 'CREATED' | 'CAPTURED' | 'DENIED' | 'EXPIRED' | 'PARTIALLY_CAPTURED' | 'VOIDED' | 'PENDING'
  amount: {
    currency_code: string
    value: string
  }
  create_time: string
  expiration_time?: string
}

/**
 * PayPal Refund
 */
interface PayPalRefund {
  id: string
  status: 'CANCELLED' | 'FAILED' | 'PENDING' | 'COMPLETED'
  amount?: {
    currency_code: string
    value: string
  }
  note_to_payer?: string
  create_time: string
  update_time?: string
}

/**
 * PayPal Token Response
 */
interface PayPalTokenResponse {
  scope: string
  access_token: string
  token_type: string
  app_id: string
  expires_in: number
  nonce: string
}

/**
 * PayPal Webhook Event
 */
interface PayPalWebhookEvent {
  id: string
  event_type: string
  resource_type: string
  resource: Record<string, unknown>
  create_time: string
  event_version?: string
  summary?: string
}

// ============================================================================
// PAYPAL GATEWAY IMPLEMENTATION
// ============================================================================

/**
 * PayPal Payment Gateway
 *
 * Implements the PaymentGateway interface for PayPal.
 */
export class PayPalGateway implements PaymentGateway {
  readonly name = 'paypal'
  readonly displayName = 'PayPal'
  readonly supportedMethods: PaymentMethodType[] = ['paypal', 'card']

  private config: PayPalConfig
  private connected = false
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  get isConnected(): boolean {
    return this.connected
  }

  private get baseUrl(): string {
    return this.config.testMode
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com'
  }

  constructor(config: PayPalConfig) {
    this.config = {
      ...config,
      timeout: config.timeout || 30000,
    }
  }

  // ========================================
  // Connection Management
  // ========================================

  async connect(): Promise<boolean> {
    try {
      await this.getAccessToken()
      this.connected = true
      console.log('[PayPalGateway] Connected successfully')
      return true
    } catch (error) {
      console.error('[PayPalGateway] Connection failed:', error)
      this.connected = false
      return false
    }
  }

  disconnect(): void {
    this.connected = false
    this.accessToken = null
    this.tokenExpiry = 0
    console.log('[PayPalGateway] Disconnected')
  }

  // ========================================
  // Payment Operations
  // ========================================

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const isAuthorizeOnly = request.capture === false
      const amountValue = fromSmallestUnit(request.amount.amount, request.amount.currency).toFixed(2)

      const orderData: Record<string, unknown> = {
        intent: isAuthorizeOnly ? 'AUTHORIZE' : 'CAPTURE',
        purchase_units: [
          {
            reference_id: request.orderId || `order_${Date.now()}`,
            description: request.description,
            custom_id: request.orderId,
            amount: {
              currency_code: request.amount.currency,
              value: amountValue,
            },
          },
        ],
        application_context: {
          brand_name: this.config.brandName,
          locale: this.config.locale || 'en-US',
          landing_page: 'LOGIN',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: request.returnUrl || 'https://example.com/return',
          cancel_url: request.returnUrl?.replace('/return', '/cancel') || 'https://example.com/cancel',
        },
      }

      // Add payer info if provided
      if (request.customer?.email) {
        orderData.payer = {
          email_address: request.customer.email,
          name: request.customer.name
            ? {
                given_name: request.customer.name.split(' ')[0],
                surname: request.customer.name.split(' ').slice(1).join(' '),
              }
            : undefined,
        }
      }

      const headers: Record<string, string> = {}
      if (request.idempotencyKey) {
        headers['PayPal-Request-Id'] = request.idempotencyKey
      }

      const order = await this.makeRequest<PayPalOrder>(
        'POST',
        '/v2/checkout/orders',
        orderData,
        headers
      )

      return this.mapOrderToResult(order)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async capturePayment(request: CaptureRequest): Promise<CaptureResult> {
    try {
      // First, get the order to find the authorization ID
      const order = await this.makeRequest<PayPalOrder>(
        'GET',
        `/v2/checkout/orders/${request.paymentId}`
      )

      // If order is APPROVED, capture it directly
      if (order.status === 'APPROVED') {
        const capturedOrder = await this.makeRequest<PayPalOrder>(
          'POST',
          `/v2/checkout/orders/${request.paymentId}/capture`,
          {}
        )

        const capture = capturedOrder.purchase_units?.[0]?.payments?.captures?.[0]
        return {
          success: capture?.status === 'COMPLETED',
          paymentId: request.paymentId,
          status: this.mapCaptureStatus(capture?.status || 'PENDING'),
          amount: capture
            ? { amount: toSmallestUnit(parseFloat(capture.amount.value), capture.amount.currency_code), currency: capture.amount.currency_code }
            : request.amount || { amount: 0, currency: 'USD' },
          capturedAt: capture?.create_time || new Date().toISOString(),
          rawResponse: capturedOrder as unknown as Record<string, unknown>,
        }
      }

      // If already authorized, capture the authorization
      const authId = order.purchase_units?.[0]?.payments?.authorizations?.[0]?.id
      if (!authId) {
        throw new PaymentValidationError('No authorization found for this order')
      }

      const captureData: Record<string, unknown> = {}
      if (request.amount) {
        captureData.amount = {
          currency_code: request.amount.currency,
          value: fromSmallestUnit(request.amount.amount, request.amount.currency).toFixed(2),
        }
      }

      const capture = await this.makeRequest<PayPalCapture>(
        'POST',
        `/v2/payments/authorizations/${authId}/capture`,
        captureData
      )

      return {
        success: capture.status === 'COMPLETED',
        paymentId: request.paymentId,
        status: this.mapCaptureStatus(capture.status),
        amount: { amount: toSmallestUnit(parseFloat(capture.amount.value), capture.amount.currency_code), currency: capture.amount.currency_code },
        capturedAt: capture.create_time,
        rawResponse: capture as unknown as Record<string, unknown>,
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
      // Get the order to find authorization ID
      const order = await this.makeRequest<PayPalOrder>(
        'GET',
        `/v2/checkout/orders/${request.paymentId}`
      )

      const authId = order.purchase_units?.[0]?.payments?.authorizations?.[0]?.id
      if (!authId) {
        throw new PaymentValidationError('No authorization found for this order')
      }

      // Void the authorization
      await this.makeRequest<void>(
        'POST',
        `/v2/payments/authorizations/${authId}/void`,
        {}
      )

      return {
        success: true,
        paymentId: request.paymentId,
        status: 'canceled',
        voidedAt: new Date().toISOString(),
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
      // Get the order to find capture ID
      const order = await this.makeRequest<PayPalOrder>(
        'GET',
        `/v2/checkout/orders/${request.paymentId}`
      )

      const captureId = order.purchase_units?.[0]?.payments?.captures?.[0]?.id
      if (!captureId) {
        throw new PaymentValidationError('No capture found for this order')
      }

      const refundData: Record<string, unknown> = {}

      if (request.amount) {
        refundData.amount = {
          currency_code: request.amount.currency,
          value: fromSmallestUnit(request.amount.amount, request.amount.currency).toFixed(2),
        }
      }

      if (request.reasonDescription) {
        refundData.note_to_payer = request.reasonDescription
      }

      const headers: Record<string, string> = {}
      if (request.idempotencyKey) {
        headers['PayPal-Request-Id'] = request.idempotencyKey
      }

      const refund = await this.makeRequest<PayPalRefund>(
        'POST',
        `/v2/payments/captures/${captureId}/refund`,
        Object.keys(refundData).length > 0 ? refundData : {},
        headers
      )

      return {
        success: refund.status === 'COMPLETED',
        refundId: refund.id,
        paymentId: request.paymentId,
        status: this.mapRefundStatus(refund.status),
        amount: refund.amount
          ? { amount: toSmallestUnit(parseFloat(refund.amount.value), refund.amount.currency_code), currency: refund.amount.currency_code }
          : request.amount || { amount: 0, currency: 'USD' },
        reason: request.reason,
        createdAt: refund.create_time,
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
      const order = await this.makeRequest<PayPalOrder>(
        'GET',
        `/v2/checkout/orders/${paymentId}`
      )
      return this.mapOrderToResult(order)
    } catch (error) {
      return this.handleError(error)
    }
  }

  // ========================================
  // Customer Management (Limited for PayPal)
  // ========================================

  /**
   * PayPal doesn't have a traditional customer object like Stripe.
   * Customers are identified by their PayPal account.
   * This method creates a reference customer for internal tracking.
   */
  async createCustomer(request: CreateCustomerRequest): Promise<GatewayCustomer> {
    // PayPal doesn't have a customer creation API
    // Return a reference customer object
    return {
      id: `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: request.email,
      name: request.name,
      phone: request.phone,
      paymentMethods: [{
        type: 'paypal',
        wallet: {
          type: 'paypal',
          email: request.email,
        },
      }],
      metadata: request.metadata,
      createdAt: new Date().toISOString(),
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
      // PayPal webhook verification requires multiple headers and certificate validation
      // This is a simplified implementation
      // In production, use PayPal SDK or implement full certificate chain validation

      const payloadStr = typeof payload === 'string' ? payload : payload.toString('utf8')

      // Basic signature check (production would validate against PayPal's certificates)
      if (!signature || signature.length === 0) {
        return { valid: false, error: 'Missing signature' }
      }

      // Parse the webhook event
      const paypalEvent = JSON.parse(payloadStr) as PayPalWebhookEvent
      const event = this.mapWebhookEvent(paypalEvent)

      return { valid: true, event }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Webhook verification failed',
      }
    }
  }

  async handleWebhookEvent(event: PaymentWebhookEvent): Promise<void> {
    console.log(`[PayPalGateway] Handling webhook event: ${event.type}`, { id: event.id })
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString('base64')

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as Record<string, unknown>
      throw new PaymentAuthError(
        (errorBody.error_description as string) || 'Failed to obtain access token',
        errorBody
      )
    }

    const tokenData = await response.json() as PayPalTokenResponse

    this.accessToken = tokenData.access_token
    // Refresh token 5 minutes before expiry
    this.tokenExpiry = Date.now() + (tokenData.expires_in - 300) * 1000

    return this.accessToken
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'DELETE' | 'PATCH',
    path: string,
    data?: Record<string, unknown>,
    extraHeaders?: Record<string, string>
  ): Promise<T> {
    const token = await this.getAccessToken()
    const url = `${this.baseUrl}${path}`

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(url, options)

    // Handle 204 No Content (e.g., void authorization)
    if (response.status === 204) {
      return {} as T
    }

    const responseBody = await response.json().catch(() => ({})) as Record<string, unknown>

    if (!response.ok) {
      throw this.createErrorFromResponse(response.status, responseBody)
    }

    return responseBody as T
  }

  private createErrorFromResponse(status: number, body: Record<string, unknown>): Error {
    const details = body.details as Array<{ issue?: string; description?: string }> | undefined
    const message = (body.message as string) || details?.[0]?.description || `PayPal API error (${status})`

    if (status === 401) {
      throw new PaymentAuthError(message, { status, body })
    }

    if (status === 429) {
      throw new PaymentRateLimitError(message, undefined, { status, body })
    }

    if (status === 400 || status === 422) {
      throw new PaymentValidationError(message, details?.[0]?.issue, { status, body })
    }

    throw new PaymentGatewayError(
      message,
      (body.name as string) || 'api_error',
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

  private mapOrderStatus(status: PayPalOrderStatus): PaymentStatus {
    const statusMap: Record<PayPalOrderStatus, PaymentStatus> = {
      CREATED: 'pending',
      SAVED: 'pending',
      APPROVED: 'requires_action',
      VOIDED: 'canceled',
      COMPLETED: 'succeeded',
      PAYER_ACTION_REQUIRED: 'requires_action',
    }
    return statusMap[status] || 'pending'
  }

  private mapCaptureStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      COMPLETED: 'captured',
      DECLINED: 'failed',
      PARTIALLY_REFUNDED: 'partially_refunded',
      PENDING: 'processing',
      REFUNDED: 'refunded',
    }
    return statusMap[status] || 'pending'
  }

  private mapRefundStatus(status: string): 'pending' | 'succeeded' | 'failed' | 'canceled' {
    const statusMap: Record<string, 'pending' | 'succeeded' | 'failed' | 'canceled'> = {
      CANCELLED: 'canceled',
      FAILED: 'failed',
      PENDING: 'pending',
      COMPLETED: 'succeeded',
    }
    return statusMap[status] || 'pending'
  }

  private mapOrderToResult(order: PayPalOrder): PaymentResult {
    const purchaseUnit = order.purchase_units?.[0]
    const amount: Money = purchaseUnit
      ? {
          amount: toSmallestUnit(parseFloat(purchaseUnit.amount.value), purchaseUnit.amount.currency_code),
          currency: purchaseUnit.amount.currency_code,
        }
      : { amount: 0, currency: 'USD' }

    const result: PaymentResult = {
      success: order.status === 'COMPLETED',
      paymentId: order.id,
      status: this.mapOrderStatus(order.status),
      amount,
      createdAt: order.create_time,
      rawResponse: order as unknown as Record<string, unknown>,
    }

    // Add payment method details
    result.paymentMethod = {
      type: 'paypal',
      wallet: {
        type: 'paypal',
        email: order.payer?.email_address,
      },
    }

    // Find approval URL for CREATED/APPROVED status
    if (order.status === 'CREATED' || order.status === 'PAYER_ACTION_REQUIRED') {
      const approveLink = order.links?.find((link) => link.rel === 'approve')
      if (approveLink) {
        result.redirectUrl = approveLink.href
      }
    }

    // Get capture details if available
    const capture = purchaseUnit?.payments?.captures?.[0]
    if (capture) {
      result.status = this.mapCaptureStatus(capture.status)
    }

    return result
  }

  private mapWebhookEventType(paypalType: string): PaymentWebhookEventType {
    const typeMap: Record<string, PaymentWebhookEventType> = {
      'CHECKOUT.ORDER.APPROVED': 'payment.requires_action',
      'CHECKOUT.ORDER.COMPLETED': 'payment.succeeded',
      'PAYMENT.CAPTURE.COMPLETED': 'payment.succeeded',
      'PAYMENT.CAPTURE.DENIED': 'payment.failed',
      'PAYMENT.CAPTURE.PENDING': 'payment.created',
      'PAYMENT.CAPTURE.REFUNDED': 'payment.refunded',
      'PAYMENT.AUTHORIZATION.CREATED': 'payment.created',
      'PAYMENT.AUTHORIZATION.VOIDED': 'payment.canceled',
      'PAYMENT.REFUND.COMPLETED': 'refund.succeeded',
      'CUSTOMER.DISPUTE.CREATED': 'payment.disputed',
      'INVOICING.INVOICE.PAID': 'invoice.paid',
      'INVOICING.INVOICE.PAYMENT_FAILED': 'invoice.payment_failed',
    }
    return typeMap[paypalType] || 'payment.created'
  }

  private mapWebhookEvent(paypalEvent: PayPalWebhookEvent): PaymentWebhookEvent {
    return {
      id: `paypal_${paypalEvent.id}`,
      type: this.mapWebhookEventType(paypalEvent.event_type),
      data: paypalEvent.resource,
      createdAt: paypalEvent.create_time,
      livemode: !this.config.testMode,
      gatewayEventId: paypalEvent.id,
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new PayPal gateway instance
 */
export function createPayPalGateway(config: PayPalConfig): PayPalGateway {
  return new PayPalGateway(config)
}

// ============================================================================
// PAYPAL EXPRESS HELPERS
// ============================================================================

/**
 * Create a PayPal Express checkout order
 * Simplified helper for quick integration
 */
export async function createExpressCheckout(
  gateway: PayPalGateway,
  options: {
    amount: number
    currency: string
    orderId?: string
    description?: string
    returnUrl: string
    cancelUrl: string
    metadata?: Record<string, string>
  }
): Promise<{
  orderId: string
  approvalUrl: string
}> {
  const result = await gateway.processPayment({
    amount: {
      amount: toSmallestUnit(options.amount, options.currency),
      currency: options.currency,
    },
    paymentMethod: 'paypal',
    orderId: options.orderId,
    description: options.description,
    returnUrl: options.returnUrl,
    metadata: options.metadata,
  })

  if (!result.success && !result.redirectUrl) {
    throw new PaymentGatewayError(
      result.error?.message || 'Failed to create checkout',
      result.error?.code || 'checkout_failed',
      'api_error',
      false
    )
  }

  return {
    orderId: result.paymentId,
    approvalUrl: result.redirectUrl || '',
  }
}

/**
 * Complete a PayPal Express checkout after user approval
 */
export async function completeExpressCheckout(
  gateway: PayPalGateway,
  orderId: string
): Promise<CaptureResult> {
  return gateway.capturePayment({ paymentId: orderId })
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  PayPalGateway,
  createPayPalGateway,
  createExpressCheckout,
  completeExpressCheckout,
}

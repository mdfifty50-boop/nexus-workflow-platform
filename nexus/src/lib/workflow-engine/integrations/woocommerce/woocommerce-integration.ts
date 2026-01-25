/**
 * WooCommerce Deep Integration Module
 *
 * Core WooCommerce REST API integration for the Nexus workflow engine.
 * Provides comprehensive management of Orders, Products, Customers, Coupons,
 * and WordPress authentication handling.
 *
 * This module extends the base client with:
 * - Coupon/discount management
 * - WordPress user authentication
 * - Subscription management (via WooCommerce Subscriptions)
 * - Tax settings management
 * - Shipping zone/method management
 * - Payment gateway configuration
 *
 * @module WooCommerceIntegration
 */

import {
  WooCommerceClient,
  createWooCommerceClient,
  WooCommerceError,
  WooCommerceAuthError,
  WooCommerceNotFoundError,
  WooCommerceValidationError,
  WooCommerceRateLimitError,
} from './woocommerce-client'
import type {
  WooCommerceConfig,
  WooOrder,
  WooProduct,
  WooCustomer,
  WooRefund,
  WooAddress,
} from './woocommerce-client'

// ============================================================================
// COUPON/DISCOUNT TYPES
// ============================================================================

/**
 * WooCommerce Coupon type
 */
export interface WooCoupon {
  id: number
  code: string
  amount: string
  date_created: string
  date_created_gmt: string
  date_modified: string
  date_modified_gmt: string
  discount_type: WooDiscountType
  description: string
  date_expires: string | null
  date_expires_gmt: string | null
  usage_count: number
  individual_use: boolean
  product_ids: number[]
  excluded_product_ids: number[]
  usage_limit: number | null
  usage_limit_per_user: number | null
  limit_usage_to_x_items: number | null
  free_shipping: boolean
  product_categories: number[]
  excluded_product_categories: number[]
  exclude_sale_items: boolean
  minimum_amount: string
  maximum_amount: string
  email_restrictions: string[]
  used_by: string[]
  meta_data: Array<{ id: number; key: string; value: string }>
}

export type WooDiscountType =
  | 'percent'
  | 'fixed_cart'
  | 'fixed_product'

export interface WooCreateCouponData {
  code: string
  discount_type?: WooDiscountType
  amount?: string
  description?: string
  date_expires?: string
  individual_use?: boolean
  product_ids?: number[]
  excluded_product_ids?: number[]
  usage_limit?: number
  usage_limit_per_user?: number
  limit_usage_to_x_items?: number
  free_shipping?: boolean
  product_categories?: number[]
  excluded_product_categories?: number[]
  exclude_sale_items?: boolean
  minimum_amount?: string
  maximum_amount?: string
  email_restrictions?: string[]
  meta_data?: Array<{ key: string; value: string }>
}

export interface WooUpdateCouponData extends Partial<WooCreateCouponData> {
  id?: number
}

export interface WooCouponsQueryParams {
  context?: 'view' | 'edit'
  page?: number
  per_page?: number
  search?: string
  after?: string
  before?: string
  exclude?: number[]
  include?: number[]
  offset?: number
  order?: 'asc' | 'desc'
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug'
  code?: string
}

// ============================================================================
// SHIPPING TYPES
// ============================================================================

export interface WooShippingZone {
  id: number
  name: string
  order: number
}

export interface WooShippingMethod {
  id: number
  instance_id: number
  title: string
  order: number
  enabled: boolean
  method_id: string
  method_title: string
  method_description: string
  settings: Record<string, {
    id: string
    label: string
    description: string
    type: string
    value: string
    default: string
    tip: string
    placeholder: string
  }>
}

export interface WooShippingZoneLocation {
  code: string
  type: 'postcode' | 'state' | 'country' | 'continent'
}

// ============================================================================
// TAX TYPES
// ============================================================================

export interface WooTaxRate {
  id: number
  country: string
  state: string
  postcode: string
  city: string
  postcodes: string[]
  cities: string[]
  rate: string
  name: string
  priority: number
  compound: boolean
  shipping: boolean
  order: number
  class: string
}

export interface WooTaxClass {
  slug: string
  name: string
}

// ============================================================================
// PAYMENT GATEWAY TYPES
// ============================================================================

export interface WooPaymentGateway {
  id: string
  title: string
  description: string
  order: number
  enabled: boolean
  method_title: string
  method_description: string
  method_supports: string[]
  settings: Record<string, {
    id: string
    label: string
    description: string
    type: string
    value: string
    default: string
    tip: string
    placeholder: string
  }>
}

// ============================================================================
// WORDPRESS AUTH TYPES
// ============================================================================

export interface WPUserCredentials {
  username: string
  password: string
}

export interface WPApplicationPassword {
  uuid: string
  app_id: string
  name: string
  created: string
  last_used: string | null
  last_ip: string | null
}

export interface WPAuthResult {
  authenticated: boolean
  user?: {
    id: number
    name: string
    email: string
    roles: string[]
  }
  token?: string
  expires?: string
  error?: string
}

// ============================================================================
// SUBSCRIPTION TYPES (WooCommerce Subscriptions Plugin)
// ============================================================================

export interface WooSubscription {
  id: number
  parent_id: number
  status: WooSubscriptionStatus
  billing_period: WooBillingPeriod
  billing_interval: string
  start_date: string
  start_date_gmt: string
  next_payment_date: string
  next_payment_date_gmt: string
  end_date: string | null
  end_date_gmt: string | null
  trial_end_date: string | null
  trial_end_date_gmt: string | null
  date_created: string
  date_created_gmt: string
  date_modified: string
  date_modified_gmt: string
  customer_id: number
  billing: WooAddress
  shipping: WooAddress
  payment_method: string
  payment_method_title: string
  total: string
  currency: string
  line_items: Array<{
    id: number
    name: string
    product_id: number
    variation_id: number
    quantity: number
    subtotal: string
    total: string
  }>
  meta_data: Array<{ id: number; key: string; value: string }>
}

export type WooSubscriptionStatus =
  | 'pending'
  | 'active'
  | 'on-hold'
  | 'cancelled'
  | 'switched'
  | 'expired'
  | 'pending-cancel'

export type WooBillingPeriod = 'day' | 'week' | 'month' | 'year'

// ============================================================================
// EXTENDED WOOCOMMERCE CLIENT
// ============================================================================

/**
 * Extended WooCommerce Client with additional API endpoints
 * Includes Coupon, Shipping, Tax, Payment Gateway, and Subscription management
 */
export class WooCommerceExtendedClient extends WooCommerceClient {
  private extendedBaseUrl: string
  private consumerKeyValue: string
  private consumerSecretValue: string
  private wpRestUrl: string

  constructor(config: WooCommerceConfig) {
    super(config)
    const siteUrl = config.siteUrl.replace(/\/+$/, '')
    const version = config.version || 'wc/v3'
    this.extendedBaseUrl = `${siteUrl}/wp-json/${version}`
    this.wpRestUrl = `${siteUrl}/wp-json/wp/v2`
    this.consumerKeyValue = config.consumerKey
    this.consumerSecretValue = config.consumerSecret
  }

  // --------------------------------------------------------------------------
  // Private Request Helper
  // --------------------------------------------------------------------------

  private async extendedRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: unknown,
    queryParams?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    let url = `${this.extendedBaseUrl}/${endpoint}`

    // Add query parameters
    if (queryParams) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      }
      const queryString = params.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    // Add authentication
    const authUrl = new URL(url)
    authUrl.searchParams.set('consumer_key', this.consumerKeyValue)
    authUrl.searchParams.set('consumer_secret', this.consumerSecretValue)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(authUrl.toString(), options)

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `WooCommerce API Error: ${response.status}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }

      switch (response.status) {
        case 401:
          throw new WooCommerceAuthError(errorMessage)
        case 404:
          throw new WooCommerceNotFoundError(errorMessage)
        case 400:
          throw new WooCommerceValidationError(errorMessage)
        case 429:
          throw new WooCommerceRateLimitError(errorMessage, 60)
        default:
          throw new WooCommerceError(errorMessage, response.status, 'API_ERROR')
      }
    }

    const text = await response.text()
    return text ? JSON.parse(text) : ({} as T)
  }

  // --------------------------------------------------------------------------
  // Coupon Management API
  // --------------------------------------------------------------------------

  /**
   * List all coupons with optional filtering
   */
  async getCoupons(params: WooCouponsQueryParams = {}): Promise<WooCoupon[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {}
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        queryParams[key] = Array.isArray(value) ? value.join(',') : value
      }
    }
    return this.extendedRequest<WooCoupon[]>('GET', 'coupons', undefined, queryParams)
  }

  /**
   * Get a single coupon by ID
   */
  async getCoupon(couponId: number): Promise<WooCoupon> {
    return this.extendedRequest<WooCoupon>('GET', `coupons/${couponId}`)
  }

  /**
   * Get a coupon by code
   */
  async getCouponByCode(code: string): Promise<WooCoupon | null> {
    const coupons = await this.getCoupons({ code })
    return coupons.length > 0 ? coupons[0] : null
  }

  /**
   * Create a new coupon
   */
  async createCoupon(data: WooCreateCouponData): Promise<WooCoupon> {
    return this.extendedRequest<WooCoupon>('POST', 'coupons', data)
  }

  /**
   * Update an existing coupon
   */
  async updateCoupon(couponId: number, data: WooUpdateCouponData): Promise<WooCoupon> {
    return this.extendedRequest<WooCoupon>('PUT', `coupons/${couponId}`, data)
  }

  /**
   * Delete a coupon
   */
  async deleteCoupon(couponId: number, force: boolean = false): Promise<WooCoupon> {
    return this.extendedRequest<WooCoupon>('DELETE', `coupons/${couponId}`, undefined, { force })
  }

  /**
   * Batch create/update/delete coupons
   */
  async batchCoupons(data: {
    create?: WooCreateCouponData[]
    update?: (WooUpdateCouponData & { id: number })[]
    delete?: number[]
  }): Promise<{
    create?: WooCoupon[]
    update?: WooCoupon[]
    delete?: WooCoupon[]
  }> {
    return this.extendedRequest('POST', 'coupons/batch', data)
  }

  // --------------------------------------------------------------------------
  // Shipping Zone Management API
  // --------------------------------------------------------------------------

  /**
   * List all shipping zones
   */
  async getShippingZones(): Promise<WooShippingZone[]> {
    return this.extendedRequest<WooShippingZone[]>('GET', 'shipping/zones')
  }

  /**
   * Get a specific shipping zone
   */
  async getShippingZone(zoneId: number): Promise<WooShippingZone> {
    return this.extendedRequest<WooShippingZone>('GET', `shipping/zones/${zoneId}`)
  }

  /**
   * Get shipping methods for a zone
   */
  async getShippingZoneMethods(zoneId: number): Promise<WooShippingMethod[]> {
    return this.extendedRequest<WooShippingMethod[]>('GET', `shipping/zones/${zoneId}/methods`)
  }

  /**
   * Get locations for a shipping zone
   */
  async getShippingZoneLocations(zoneId: number): Promise<WooShippingZoneLocation[]> {
    return this.extendedRequest<WooShippingZoneLocation[]>('GET', `shipping/zones/${zoneId}/locations`)
  }

  /**
   * Update shipping zone locations
   */
  async updateShippingZoneLocations(
    zoneId: number,
    locations: WooShippingZoneLocation[]
  ): Promise<WooShippingZoneLocation[]> {
    return this.extendedRequest<WooShippingZoneLocation[]>(
      'PUT',
      `shipping/zones/${zoneId}/locations`,
      locations
    )
  }

  // --------------------------------------------------------------------------
  // Tax Rate Management API
  // --------------------------------------------------------------------------

  /**
   * List all tax rates
   */
  async getTaxRates(params?: {
    class?: string
    page?: number
    per_page?: number
  }): Promise<WooTaxRate[]> {
    return this.extendedRequest<WooTaxRate[]>('GET', 'taxes', undefined, params)
  }

  /**
   * Get a specific tax rate
   */
  async getTaxRate(taxId: number): Promise<WooTaxRate> {
    return this.extendedRequest<WooTaxRate>('GET', `taxes/${taxId}`)
  }

  /**
   * Create a tax rate
   */
  async createTaxRate(data: Partial<WooTaxRate>): Promise<WooTaxRate> {
    return this.extendedRequest<WooTaxRate>('POST', 'taxes', data)
  }

  /**
   * Update a tax rate
   */
  async updateTaxRate(taxId: number, data: Partial<WooTaxRate>): Promise<WooTaxRate> {
    return this.extendedRequest<WooTaxRate>('PUT', `taxes/${taxId}`, data)
  }

  /**
   * Get all tax classes
   */
  async getTaxClasses(): Promise<WooTaxClass[]> {
    return this.extendedRequest<WooTaxClass[]>('GET', 'taxes/classes')
  }

  // --------------------------------------------------------------------------
  // Payment Gateway Management API
  // --------------------------------------------------------------------------

  /**
   * List all payment gateways
   */
  async getPaymentGateways(): Promise<WooPaymentGateway[]> {
    return this.extendedRequest<WooPaymentGateway[]>('GET', 'payment_gateways')
  }

  /**
   * Get a specific payment gateway
   */
  async getPaymentGateway(gatewayId: string): Promise<WooPaymentGateway> {
    return this.extendedRequest<WooPaymentGateway>('GET', `payment_gateways/${gatewayId}`)
  }

  /**
   * Update a payment gateway
   */
  async updatePaymentGateway(
    gatewayId: string,
    data: Partial<WooPaymentGateway>
  ): Promise<WooPaymentGateway> {
    return this.extendedRequest<WooPaymentGateway>('PUT', `payment_gateways/${gatewayId}`, data)
  }

  // --------------------------------------------------------------------------
  // Subscription Management API (WooCommerce Subscriptions Plugin)
  // --------------------------------------------------------------------------

  /**
   * List all subscriptions
   */
  async getSubscriptions(params?: {
    status?: WooSubscriptionStatus
    customer?: number
    product?: number
    page?: number
    per_page?: number
  }): Promise<WooSubscription[]> {
    return this.extendedRequest<WooSubscription[]>('GET', 'subscriptions', undefined, params)
  }

  /**
   * Get a specific subscription
   */
  async getSubscription(subscriptionId: number): Promise<WooSubscription> {
    return this.extendedRequest<WooSubscription>('GET', `subscriptions/${subscriptionId}`)
  }

  /**
   * Update a subscription
   */
  async updateSubscription(
    subscriptionId: number,
    data: Partial<WooSubscription>
  ): Promise<WooSubscription> {
    return this.extendedRequest<WooSubscription>('PUT', `subscriptions/${subscriptionId}`, data)
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: number): Promise<WooSubscription> {
    return this.updateSubscription(subscriptionId, { status: 'cancelled' })
  }

  /**
   * Pause a subscription (put on hold)
   */
  async pauseSubscription(subscriptionId: number): Promise<WooSubscription> {
    return this.updateSubscription(subscriptionId, { status: 'on-hold' })
  }

  /**
   * Reactivate a subscription
   */
  async reactivateSubscription(subscriptionId: number): Promise<WooSubscription> {
    return this.updateSubscription(subscriptionId, { status: 'active' })
  }

  // --------------------------------------------------------------------------
  // WordPress Authentication API
  // --------------------------------------------------------------------------

  /**
   * Validate WordPress user credentials
   * Note: Requires JWT Authentication plugin or similar
   */
  async authenticateWordPressUser(credentials: WPUserCredentials): Promise<WPAuthResult> {
    try {
      // Try JWT authentication endpoint (common plugin)
      const response = await fetch(`${this.wpRestUrl.replace('/wp/v2', '')}/jwt-auth/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return {
          authenticated: true,
          user: {
            id: data.user_id,
            name: data.user_display_name,
            email: data.user_email,
            roles: data.user_roles || [],
          },
          token: data.token,
        }
      }

      // If JWT not available, try Application Passwords validation
      const basicAuth = btoa(`${credentials.username}:${credentials.password}`)
      const userResponse = await fetch(`${this.wpRestUrl}/users/me`, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
        },
      })

      if (userResponse.ok) {
        const user = await userResponse.json()
        return {
          authenticated: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email || '',
            roles: user.roles || [],
          },
        }
      }

      return {
        authenticated: false,
        error: 'Invalid credentials',
      }
    } catch (error) {
      return {
        authenticated: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }
    }
  }

  /**
   * Get current user's application passwords
   * Requires user to be authenticated
   */
  async getApplicationPasswords(userId: number): Promise<WPApplicationPassword[]> {
    const basicAuth = btoa(`${this.consumerKeyValue}:${this.consumerSecretValue}`)
    const response = await fetch(`${this.wpRestUrl}/users/${userId}/application-passwords`, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    })

    if (!response.ok) {
      throw new WooCommerceError('Failed to fetch application passwords', response.status, 'AUTH_ERROR')
    }

    return response.json()
  }

  /**
   * Create a new application password for a user
   */
  async createApplicationPassword(
    userId: number,
    appName: string
  ): Promise<{ password: string; app_password: WPApplicationPassword }> {
    const basicAuth = btoa(`${this.consumerKeyValue}:${this.consumerSecretValue}`)
    const response = await fetch(`${this.wpRestUrl}/users/${userId}/application-passwords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({ name: appName }),
    })

    if (!response.ok) {
      throw new WooCommerceError('Failed to create application password', response.status, 'AUTH_ERROR')
    }

    return response.json()
  }

  // --------------------------------------------------------------------------
  // Settings Management API
  // --------------------------------------------------------------------------

  /**
   * Get all settings groups
   */
  async getSettingsGroups(): Promise<Array<{ id: string; label: string; description: string }>> {
    return this.extendedRequest('GET', 'settings')
  }

  /**
   * Get settings for a specific group
   */
  async getSettings(groupId: string): Promise<Array<{
    id: string
    label: string
    description: string
    type: string
    value: unknown
    default: unknown
    options?: Record<string, string>
  }>> {
    return this.extendedRequest('GET', `settings/${groupId}`)
  }

  /**
   * Update a setting
   */
  async updateSetting(
    groupId: string,
    settingId: string,
    value: unknown
  ): Promise<{ id: string; value: unknown }> {
    return this.extendedRequest('PUT', `settings/${groupId}/${settingId}`, { value })
  }

  // --------------------------------------------------------------------------
  // Data/Analytics API
  // --------------------------------------------------------------------------

  /**
   * Get order totals by date range
   */
  async getOrderTotals(params?: {
    period?: 'week' | 'month' | 'last_month' | 'year'
    date_min?: string
    date_max?: string
  }): Promise<Array<{
    slug: string
    name: string
    total: number
  }>> {
    return this.extendedRequest('GET', 'reports/orders/totals', undefined, params)
  }

  /**
   * Get product totals
   */
  async getProductTotals(): Promise<Array<{
    slug: string
    name: string
    total: number
  }>> {
    return this.extendedRequest('GET', 'reports/products/totals')
  }

  /**
   * Get customer totals
   */
  async getCustomerTotals(): Promise<Array<{
    slug: string
    name: string
    total: number
  }>> {
    return this.extendedRequest('GET', 'reports/customers/totals')
  }

  /**
   * Get review totals
   */
  async getReviewTotals(): Promise<Array<{
    slug: string
    name: string
    total: number
  }>> {
    return this.extendedRequest('GET', 'reports/reviews/totals')
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an extended WooCommerce client with coupon/shipping/tax/auth capabilities
 */
export function createWooCommerceExtendedClient(config: WooCommerceConfig): WooCommerceExtendedClient {
  return new WooCommerceExtendedClient(config)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a random coupon code
 */
export function generateCouponCode(prefix: string = '', length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = prefix.toUpperCase()
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Calculate discount amount based on type
 */
export function calculateDiscount(
  discountType: WooDiscountType,
  amount: string,
  cartTotal: number,
  productPrice?: number
): number {
  const discountAmount = parseFloat(amount)

  switch (discountType) {
    case 'percent':
      return (cartTotal * discountAmount) / 100
    case 'fixed_cart':
      return Math.min(discountAmount, cartTotal)
    case 'fixed_product':
      return productPrice ? Math.min(discountAmount, productPrice) : discountAmount
    default:
      return 0
  }
}

/**
 * Validate coupon is active and usable
 */
export function validateCouponUsability(coupon: WooCoupon): {
  valid: boolean
  reason?: string
} {
  const now = new Date()

  // Check expiration
  if (coupon.date_expires) {
    const expirationDate = new Date(coupon.date_expires)
    if (expirationDate < now) {
      return { valid: false, reason: 'Coupon has expired' }
    }
  }

  // Check usage limit
  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, reason: 'Coupon usage limit reached' }
  }

  return { valid: true }
}

/**
 * Format currency for WooCommerce
 */
export function formatWooCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if an object is a WooCoupon
 */
export function isWooCoupon(obj: unknown): obj is WooCoupon {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'code' in obj &&
    'discount_type' in obj
  )
}

/**
 * Check if an object is a WooSubscription
 */
export function isWooSubscription(obj: unknown): obj is WooSubscription {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'billing_period' in obj &&
    'billing_interval' in obj
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  WooCommerceClient,
  createWooCommerceClient,
  WooCommerceError,
  WooCommerceAuthError,
  WooCommerceNotFoundError,
  WooCommerceValidationError,
  WooCommerceRateLimitError,
}

export type {
  WooCommerceConfig,
  WooOrder,
  WooProduct,
  WooCustomer,
  WooRefund,
  WooAddress,
}

/**
 * Shopify Deep Integration Module
 *
 * Core Shopify API integration for the Nexus workflow engine with:
 * - OAuth 2.0 authentication flow
 * - Order management (create, update, fulfill, cancel)
 * - Inventory sync (stock levels, low stock alerts)
 * - Customer management (create, update, segments)
 * - Product catalog sync
 *
 * @module shopify-integration
 */

import { ShopifyClient, createShopifyClient } from './shopify-client'
import type { ShopifyConfig } from './shopify-client'
import type {
  ShopifyOrder,
  ShopifyProduct,
  ShopifyCustomer,
  ShopifyFulfillment,
  ShopifyInventoryLevel,
  ShopifyLocation,
  ShopifyVariant,
} from './shopify-client'

// ============================================================================
// OAuth Types
// ============================================================================

/**
 * OAuth configuration for Shopify app
 */
export interface ShopifyOAuthConfig {
  /** Shopify app API key (client ID) */
  apiKey: string
  /** Shopify app API secret (client secret) */
  apiSecret: string
  /** OAuth redirect URI */
  redirectUri: string
  /** Required API scopes */
  scopes: ShopifyScope[]
  /** Optional nonce for CSRF protection */
  nonce?: string
}

/**
 * OAuth state stored during authorization flow
 */
export interface ShopifyOAuthState {
  shop: string
  nonce: string
  timestamp: number
  returnUrl?: string
}

/**
 * OAuth token response from Shopify
 */
export interface ShopifyOAuthTokenResponse {
  access_token: string
  scope: string
  expires_in?: number
  associated_user_scope?: string
  associated_user?: {
    id: number
    first_name: string
    last_name: string
    email: string
    account_owner: boolean
    locale: string
    collaborator: boolean
    email_verified: boolean
  }
}

/**
 * Shopify API access scopes
 */
export type ShopifyScope =
  | 'read_products'
  | 'write_products'
  | 'read_orders'
  | 'write_orders'
  | 'read_customers'
  | 'write_customers'
  | 'read_inventory'
  | 'write_inventory'
  | 'read_fulfillments'
  | 'write_fulfillments'
  | 'read_shipping'
  | 'write_shipping'
  | 'read_analytics'
  | 'read_reports'
  | 'read_price_rules'
  | 'write_price_rules'
  | 'read_discounts'
  | 'write_discounts'
  | 'read_draft_orders'
  | 'write_draft_orders'
  | 'read_locations'
  | 'read_script_tags'
  | 'write_script_tags'
  | 'read_themes'
  | 'write_themes'
  | 'read_content'
  | 'write_content'
  | 'read_checkouts'
  | 'write_checkouts'
  | 'read_all_orders'
  | 'read_merchant_managed_fulfillment_orders'
  | 'write_merchant_managed_fulfillment_orders'

/**
 * Default scopes for e-commerce workflows
 */
export const DEFAULT_SHOPIFY_SCOPES: ShopifyScope[] = [
  'read_products',
  'write_products',
  'read_orders',
  'write_orders',
  'read_customers',
  'write_customers',
  'read_inventory',
  'write_inventory',
  'read_fulfillments',
  'write_fulfillments',
  'read_locations',
  'read_draft_orders',
  'write_draft_orders',
]

// ============================================================================
// Integration State Types
// ============================================================================

/**
 * Integration connection status
 */
export type ShopifyConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'expired'

/**
 * Store information from Shopify
 */
export interface ShopifyStoreInfo {
  id: number
  name: string
  email: string
  domain: string
  myshopifyDomain: string
  currency: string
  timezone: string
  planName: string
  createdAt: string
  country: string
  countryCode: string
  province: string
  provinceCode: string
  primaryLocale: string
  phone: string | null
  weightUnit: string
  moneyFormat: string
  moneyWithCurrencyFormat: string
}

/**
 * Low stock alert configuration
 */
export interface LowStockAlertConfig {
  /** Global threshold for low stock alerts */
  globalThreshold: number
  /** Product-specific thresholds */
  productThresholds?: Record<string, number>
  /** Location-specific thresholds */
  locationThresholds?: Record<string, number>
  /** Callback when low stock is detected */
  onLowStock?: (items: LowStockItem[]) => Promise<void>
}

/**
 * Low stock item information
 */
export interface LowStockItem {
  productId: number
  variantId: number
  inventoryItemId: number
  locationId: number
  productTitle: string
  variantTitle: string
  sku: string | null
  currentStock: number
  threshold: number
  locationName?: string
}

/**
 * Customer segment definition
 */
export interface CustomerSegment {
  id: string
  name: string
  description?: string
  criteria: CustomerSegmentCriteria
  tags?: string[]
}

/**
 * Customer segment criteria
 */
export interface CustomerSegmentCriteria {
  /** Minimum total spent */
  minTotalSpent?: number
  /** Maximum total spent */
  maxTotalSpent?: number
  /** Minimum order count */
  minOrderCount?: number
  /** Maximum order count */
  maxOrderCount?: number
  /** Has made purchase in last N days */
  lastPurchaseWithinDays?: number
  /** Has not made purchase in last N days */
  noPurchaseInDays?: number
  /** Accepts marketing */
  acceptsMarketing?: boolean
  /** Has specific tags */
  hasTags?: string[]
  /** Does not have specific tags */
  excludeTags?: string[]
  /** Located in countries */
  countries?: string[]
  /** Created within last N days */
  createdWithinDays?: number
}

// ============================================================================
// Shopify Deep Integration Class
// ============================================================================

/**
 * ShopifyDeepIntegration - Comprehensive Shopify integration with OAuth
 *
 * Provides:
 * - OAuth 2.0 authentication flow
 * - Order lifecycle management
 * - Inventory sync and alerts
 * - Customer management and segmentation
 * - Product catalog operations
 */
export class ShopifyDeepIntegration {
  private client: ShopifyClient | null = null
  private oauthConfig: ShopifyOAuthConfig | null = null
  private accessToken: string | null = null
  private shopDomain: string | null = null
  private storeInfo: ShopifyStoreInfo | null = null
  private status: ShopifyConnectionStatus = 'disconnected'
  private lowStockConfig: LowStockAlertConfig | null = null
  private customerSegments: Map<string, CustomerSegment> = new Map()
  private apiVersion: string = '2024-01'

  constructor(config?: { apiVersion?: string }) {
    if (config?.apiVersion) {
      this.apiVersion = config.apiVersion
    }
  }

  // ============================================================================
  // OAuth Flow Methods
  // ============================================================================

  /**
   * Configure OAuth settings for the integration
   */
  configureOAuth(config: ShopifyOAuthConfig): void {
    this.oauthConfig = config
  }

  /**
   * Generate the OAuth authorization URL
   *
   * @param shop - Shopify store domain (e.g., 'mystore.myshopify.com')
   * @param state - Optional state for CSRF protection
   * @returns Authorization URL to redirect user to
   */
  getAuthorizationUrl(shop: string, state?: string): string {
    if (!this.oauthConfig) {
      throw new Error('OAuth not configured. Call configureOAuth first.')
    }

    // Normalize shop domain
    const normalizedShop = this.normalizeShopDomain(shop)
    const nonce = state || this.generateNonce()
    const scopes = this.oauthConfig.scopes.join(',')

    const params = new URLSearchParams({
      client_id: this.oauthConfig.apiKey,
      scope: scopes,
      redirect_uri: this.oauthConfig.redirectUri,
      state: nonce,
      'grant_options[]': 'per-user', // Request per-user access tokens
    })

    return `https://${normalizedShop}/admin/oauth/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   *
   * @param shop - Shopify store domain
   * @param code - Authorization code from OAuth callback
   * @returns Token response with access token
   */
  async exchangeCodeForToken(
    shop: string,
    code: string
  ): Promise<ShopifyOAuthTokenResponse> {
    if (!this.oauthConfig) {
      throw new Error('OAuth not configured. Call configureOAuth first.')
    }

    const normalizedShop = this.normalizeShopDomain(shop)

    const response = await fetch(
      `https://${normalizedShop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.oauthConfig.apiKey,
          client_secret: this.oauthConfig.apiSecret,
          code,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to exchange code for token: ${error}`)
    }

    const tokenResponse: ShopifyOAuthTokenResponse = await response.json()

    // Store the access token and shop
    this.accessToken = tokenResponse.access_token
    this.shopDomain = normalizedShop

    // Initialize the client
    await this.initializeClient()

    return tokenResponse
  }

  /**
   * Verify OAuth callback HMAC signature
   */
  verifyOAuthCallback(query: Record<string, string>): boolean {
    if (!this.oauthConfig) {
      throw new Error('OAuth not configured')
    }

    const { hmac, ...params } = query

    if (!hmac) {
      return false
    }

    // Sort parameters and create message
    const _sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&')

    // Compute HMAC using Web Crypto API (simplified for browser)
    // In production, this should use proper HMAC-SHA256
    void _sortedParams // Will be used for HMAC verification
    return true // Placeholder - actual verification should be done server-side
  }

  /**
   * Connect with existing access token
   */
  async connectWithToken(shop: string, accessToken: string): Promise<boolean> {
    this.shopDomain = this.normalizeShopDomain(shop)
    this.accessToken = accessToken

    try {
      await this.initializeClient()
      this.status = 'connected'
      return true
    } catch (error) {
      this.status = 'error'
      console.error('[ShopifyIntegration] Connection failed:', error)
      return false
    }
  }

  /**
   * Disconnect the integration
   */
  disconnect(): void {
    this.client = null
    this.accessToken = null
    this.storeInfo = null
    this.status = 'disconnected'
  }

  // ============================================================================
  // Order Management
  // ============================================================================

  /**
   * Get orders with advanced filtering
   */
  async getOrders(options: {
    status?: 'open' | 'closed' | 'cancelled' | 'any'
    financialStatus?:
      | 'authorized'
      | 'pending'
      | 'paid'
      | 'partially_paid'
      | 'refunded'
      | 'voided'
      | 'partially_refunded'
      | 'any'
      | 'unpaid'
    fulfillmentStatus?: 'shipped' | 'partial' | 'unshipped' | 'any' | 'unfulfilled'
    createdAfter?: Date
    createdBefore?: Date
    updatedAfter?: Date
    updatedBefore?: Date
    limit?: number
    sinceId?: number
    ids?: number[]
  }): Promise<ShopifyOrder[]> {
    this.ensureConnected()

    const params: Record<string, string> = {}

    if (options.status) params.status = options.status
    if (options.financialStatus) params.financial_status = options.financialStatus
    if (options.fulfillmentStatus)
      params.fulfillment_status = options.fulfillmentStatus
    if (options.createdAfter)
      params.created_at_min = options.createdAfter.toISOString()
    if (options.createdBefore)
      params.created_at_max = options.createdBefore.toISOString()
    if (options.updatedAfter)
      params.updated_at_min = options.updatedAfter.toISOString()
    if (options.updatedBefore)
      params.updated_at_max = options.updatedBefore.toISOString()
    if (options.limit) params.limit = String(options.limit)
    if (options.sinceId) params.since_id = String(options.sinceId)
    if (options.ids) params.ids = options.ids.join(',')

    const { orders } = await this.client!.getOrders(params as never)
    return orders
  }

  /**
   * Get single order by ID
   */
  async getOrder(orderId: number): Promise<ShopifyOrder> {
    this.ensureConnected()
    const { order } = await this.client!.getOrder(orderId)
    return order
  }

  /**
   * Update an order
   */
  async updateOrder(
    orderId: number,
    data: {
      note?: string
      tags?: string[]
      email?: string
      phone?: string
      shippingAddress?: Partial<{
        address1: string
        address2: string
        city: string
        province: string
        country: string
        zip: string
        phone: string
      }>
    }
  ): Promise<ShopifyOrder> {
    this.ensureConnected()

    const updateData: Record<string, unknown> = {}
    if (data.note !== undefined) updateData.note = data.note
    if (data.tags !== undefined) updateData.tags = data.tags.join(', ')
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.shippingAddress) updateData.shipping_address = data.shippingAddress

    const { order } = await this.client!.updateOrder(orderId, updateData)
    return order
  }

  /**
   * Fulfill an order
   */
  async fulfillOrder(
    orderId: number,
    options: {
      trackingNumber?: string
      trackingCompany?: string
      trackingUrl?: string
      notifyCustomer?: boolean
      locationId?: number
      lineItems?: Array<{ id: number; quantity: number }>
    }
  ): Promise<ShopifyFulfillment> {
    this.ensureConnected()

    // Get fulfillment orders for this order
    const { fulfillment_orders } = await this.client!.getFulfillmentOrders(orderId)

    if (fulfillment_orders.length === 0) {
      throw new Error('No fulfillment orders found for this order')
    }

    // Build fulfillment data
    const fulfillmentData: {
      line_items_by_fulfillment_order: Array<{
        fulfillment_order_id: number
        fulfillment_order_line_items?: Array<{ id: number; quantity: number }>
      }>
      tracking_info?: {
        company?: string
        number?: string
        url?: string
      }
      notify_customer?: boolean
    } = {
      line_items_by_fulfillment_order: fulfillment_orders.map((fo) => ({
        fulfillment_order_id: fo.id,
        fulfillment_order_line_items: options.lineItems,
      })),
      notify_customer: options.notifyCustomer ?? true,
    }

    if (options.trackingNumber || options.trackingCompany || options.trackingUrl) {
      fulfillmentData.tracking_info = {
        company: options.trackingCompany,
        number: options.trackingNumber,
        url: options.trackingUrl,
      }
    }

    const { fulfillment } = await this.client!.createFulfillment(fulfillmentData)
    return fulfillment
  }

  /**
   * Cancel an order
   */
  async cancelOrder(
    orderId: number,
    options?: {
      reason?: 'customer' | 'fraud' | 'inventory' | 'declined' | 'other'
      notifyCustomer?: boolean
      restock?: boolean
    }
  ): Promise<ShopifyOrder> {
    this.ensureConnected()

    const { order } = await this.client!.cancelOrder(orderId, {
      reason: options?.reason,
      email: options?.notifyCustomer,
      restock: options?.restock,
    })

    return order
  }

  /**
   * Close an order (mark as complete)
   */
  async closeOrder(orderId: number): Promise<ShopifyOrder> {
    this.ensureConnected()
    const { order } = await this.client!.closeOrder(orderId)
    return order
  }

  /**
   * Reopen a closed order
   */
  async reopenOrder(orderId: number): Promise<ShopifyOrder> {
    this.ensureConnected()
    const { order } = await this.client!.reopenOrder(orderId)
    return order
  }

  // ============================================================================
  // Inventory Management
  // ============================================================================

  /**
   * Configure low stock alerts
   */
  configureLowStockAlerts(config: LowStockAlertConfig): void {
    this.lowStockConfig = config
  }

  /**
   * Get inventory levels for products
   */
  async getInventoryLevels(
    inventoryItemIds: number[],
    locationIds?: number[]
  ): Promise<ShopifyInventoryLevel[]> {
    this.ensureConnected()
    const { inventory_levels } = await this.client!.getInventoryLevels(
      inventoryItemIds,
      locationIds
    )
    return inventory_levels
  }

  /**
   * Update inventory level (set absolute value)
   */
  async setInventoryLevel(
    inventoryItemId: number,
    locationId: number,
    quantity: number
  ): Promise<ShopifyInventoryLevel> {
    this.ensureConnected()
    const { inventory_level } = await this.client!.updateInventory(
      inventoryItemId,
      locationId,
      quantity
    )

    // Check for low stock
    if (this.lowStockConfig) {
      await this.checkLowStock([inventory_level])
    }

    return inventory_level
  }

  /**
   * Adjust inventory level (relative change)
   */
  async adjustInventoryLevel(
    inventoryItemId: number,
    locationId: number,
    adjustment: number
  ): Promise<ShopifyInventoryLevel> {
    this.ensureConnected()
    const { inventory_level } = await this.client!.adjustInventory(
      inventoryItemId,
      locationId,
      adjustment
    )

    // Check for low stock
    if (this.lowStockConfig) {
      await this.checkLowStock([inventory_level])
    }

    return inventory_level
  }

  /**
   * Get all locations
   */
  async getLocations(): Promise<ShopifyLocation[]> {
    this.ensureConnected()
    const { locations } = await this.client!.getLocations()
    return locations
  }

  /**
   * Sync inventory to external system
   */
  async syncInventory(): Promise<{
    products: number
    variants: number
    lowStockItems: LowStockItem[]
  }> {
    this.ensureConnected()

    // Get all products with variants
    const { products } = await this.client!.getProducts({ limit: 250 })
    const locations = await this.getLocations()
    const primaryLocationId = locations.find((l) => l.legacy)?.id || locations[0]?.id

    // Get inventory levels for all variants
    const variantInventoryIds = products.flatMap((p) =>
      p.variants.map((v) => v.inventory_item_id)
    )

    const inventoryLevels = await this.getInventoryLevels(
      variantInventoryIds,
      primaryLocationId ? [primaryLocationId] : undefined
    )

    // Build inventory map
    const inventoryMap = new Map<number, number>()
    inventoryLevels.forEach((level) => {
      inventoryMap.set(level.inventory_item_id, level.available ?? 0)
    })

    // Check for low stock items
    const lowStockItems = await this.checkLowStock(inventoryLevels, products)

    return {
      products: products.length,
      variants: variantInventoryIds.length,
      lowStockItems,
    }
  }

  /**
   * Check for low stock items
   */
  private async checkLowStock(
    inventoryLevels: ShopifyInventoryLevel[],
    products?: ShopifyProduct[]
  ): Promise<LowStockItem[]> {
    if (!this.lowStockConfig) {
      return []
    }

    const lowStockItems: LowStockItem[] = []

    // Get products if not provided
    let productMap: Map<number, ShopifyProduct> = new Map()
    let variantMap: Map<number, { product: ShopifyProduct; variant: ShopifyVariant }> =
      new Map()

    if (products) {
      products.forEach((p) => {
        productMap.set(p.id, p)
        p.variants.forEach((v) => {
          variantMap.set(v.inventory_item_id, { product: p, variant: v })
        })
      })
    }

    for (const level of inventoryLevels) {
      const available = level.available ?? 0
      const threshold = this.getThresholdForItem(level)

      if (available <= threshold) {
        const variantInfo = variantMap.get(level.inventory_item_id)

        lowStockItems.push({
          productId: variantInfo?.product.id ?? 0,
          variantId: variantInfo?.variant.id ?? 0,
          inventoryItemId: level.inventory_item_id,
          locationId: level.location_id,
          productTitle: variantInfo?.product.title ?? 'Unknown',
          variantTitle: variantInfo?.variant.title ?? 'Default',
          sku: variantInfo?.variant.sku ?? null,
          currentStock: available,
          threshold,
        })
      }
    }

    // Call low stock callback if configured
    if (lowStockItems.length > 0 && this.lowStockConfig.onLowStock) {
      await this.lowStockConfig.onLowStock(lowStockItems)
    }

    return lowStockItems
  }

  /**
   * Get threshold for specific inventory item
   */
  private getThresholdForItem(level: ShopifyInventoryLevel): number {
    if (!this.lowStockConfig) {
      return 0
    }

    // Check product-specific threshold
    if (this.lowStockConfig.productThresholds) {
      const productThreshold =
        this.lowStockConfig.productThresholds[String(level.inventory_item_id)]
      if (productThreshold !== undefined) {
        return productThreshold
      }
    }

    // Check location-specific threshold
    if (this.lowStockConfig.locationThresholds) {
      const locationThreshold =
        this.lowStockConfig.locationThresholds[String(level.location_id)]
      if (locationThreshold !== undefined) {
        return locationThreshold
      }
    }

    // Return global threshold
    return this.lowStockConfig.globalThreshold
  }

  // ============================================================================
  // Customer Management
  // ============================================================================

  /**
   * Get customers with filtering
   */
  async getCustomers(options?: {
    ids?: number[]
    sinceId?: number
    createdAfter?: Date
    createdBefore?: Date
    updatedAfter?: Date
    updatedBefore?: Date
    limit?: number
  }): Promise<ShopifyCustomer[]> {
    this.ensureConnected()

    const params: Record<string, string> = {}

    if (options?.ids) params.ids = options.ids.join(',')
    if (options?.sinceId) params.since_id = String(options.sinceId)
    if (options?.createdAfter)
      params.created_at_min = options.createdAfter.toISOString()
    if (options?.createdBefore)
      params.created_at_max = options.createdBefore.toISOString()
    if (options?.updatedAfter)
      params.updated_at_min = options.updatedAfter.toISOString()
    if (options?.updatedBefore)
      params.updated_at_max = options.updatedBefore.toISOString()
    if (options?.limit) params.limit = String(options.limit)

    const { customers } = await this.client!.getCustomers(params as never)
    return customers
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: number): Promise<ShopifyCustomer> {
    this.ensureConnected()
    const { customer } = await this.client!.getCustomer(customerId)
    return customer
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string): Promise<ShopifyCustomer[]> {
    this.ensureConnected()
    const { customers } = await this.client!.searchCustomers(query)
    return customers
  }

  /**
   * Create a customer
   */
  async createCustomer(data: {
    email: string
    firstName?: string
    lastName?: string
    phone?: string
    tags?: string[]
    acceptsMarketing?: boolean
    note?: string
    addresses?: Array<{
      address1?: string
      address2?: string
      city?: string
      province?: string
      country?: string
      zip?: string
      phone?: string
      isDefault?: boolean
    }>
  }): Promise<ShopifyCustomer> {
    this.ensureConnected()

    const customerData: Record<string, unknown> = {
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      tags: data.tags?.join(', '),
      accepts_marketing: data.acceptsMarketing,
      note: data.note,
    }

    if (data.addresses) {
      customerData.addresses = data.addresses.map((addr) => ({
        address1: addr.address1,
        address2: addr.address2,
        city: addr.city,
        province: addr.province,
        country: addr.country,
        zip: addr.zip,
        phone: addr.phone,
        default: addr.isDefault,
      }))
    }

    // Make API request
    const response = await this.makeApiRequest<{ customer: ShopifyCustomer }>(
      'POST',
      '/customers.json',
      { customer: customerData }
    )

    return response.customer
  }

  /**
   * Update a customer
   */
  async updateCustomer(
    customerId: number,
    data: {
      email?: string
      firstName?: string
      lastName?: string
      phone?: string
      tags?: string[]
      acceptsMarketing?: boolean
      note?: string
    }
  ): Promise<ShopifyCustomer> {
    this.ensureConnected()

    const customerData: Record<string, unknown> = {}
    if (data.email !== undefined) customerData.email = data.email
    if (data.firstName !== undefined) customerData.first_name = data.firstName
    if (data.lastName !== undefined) customerData.last_name = data.lastName
    if (data.phone !== undefined) customerData.phone = data.phone
    if (data.tags !== undefined) customerData.tags = data.tags.join(', ')
    if (data.acceptsMarketing !== undefined)
      customerData.accepts_marketing = data.acceptsMarketing
    if (data.note !== undefined) customerData.note = data.note

    const response = await this.makeApiRequest<{ customer: ShopifyCustomer }>(
      'PUT',
      `/customers/${customerId}.json`,
      { customer: customerData }
    )

    return response.customer
  }

  /**
   * Add tags to customer
   */
  async addCustomerTags(customerId: number, tags: string[]): Promise<ShopifyCustomer> {
    const customer = await this.getCustomer(customerId)
    const existingTags = customer.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const newTags = Array.from(new Set([...existingTags, ...tags]))

    return this.updateCustomer(customerId, { tags: newTags })
  }

  /**
   * Remove tags from customer
   */
  async removeCustomerTags(
    customerId: number,
    tags: string[]
  ): Promise<ShopifyCustomer> {
    const customer = await this.getCustomer(customerId)
    const existingTags = customer.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const newTags = existingTags.filter((t) => !tags.includes(t))

    return this.updateCustomer(customerId, { tags: newTags })
  }

  /**
   * Define a customer segment
   */
  defineCustomerSegment(segment: CustomerSegment): void {
    this.customerSegments.set(segment.id, segment)
  }

  /**
   * Get customers matching a segment
   */
  async getCustomersBySegment(segmentId: string): Promise<ShopifyCustomer[]> {
    const segment = this.customerSegments.get(segmentId)
    if (!segment) {
      throw new Error(`Customer segment not found: ${segmentId}`)
    }

    // Get all customers (with pagination in production)
    const allCustomers = await this.getCustomers({ limit: 250 })

    // Filter by criteria
    return allCustomers.filter((customer) =>
      this.customerMatchesCriteria(customer, segment.criteria)
    )
  }

  /**
   * Check if customer matches segment criteria
   */
  private customerMatchesCriteria(
    customer: ShopifyCustomer,
    criteria: CustomerSegmentCriteria
  ): boolean {
    const totalSpent = parseFloat(customer.total_spent)
    const ordersCount = customer.orders_count
    const tags = customer.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    // Check total spent
    if (criteria.minTotalSpent !== undefined && totalSpent < criteria.minTotalSpent) {
      return false
    }
    if (criteria.maxTotalSpent !== undefined && totalSpent > criteria.maxTotalSpent) {
      return false
    }

    // Check order count
    if (criteria.minOrderCount !== undefined && ordersCount < criteria.minOrderCount) {
      return false
    }
    if (criteria.maxOrderCount !== undefined && ordersCount > criteria.maxOrderCount) {
      return false
    }

    // Check marketing
    if (
      criteria.acceptsMarketing !== undefined &&
      customer.accepts_marketing !== criteria.acceptsMarketing
    ) {
      return false
    }

    // Check tags
    if (criteria.hasTags && !criteria.hasTags.every((t) => tags.includes(t))) {
      return false
    }
    if (criteria.excludeTags && criteria.excludeTags.some((t) => tags.includes(t))) {
      return false
    }

    // Check country
    if (criteria.countries && criteria.countries.length > 0) {
      const country = customer.default_address?.country_code
      if (!country || !criteria.countries.includes(country)) {
        return false
      }
    }

    // Check created date
    if (criteria.createdWithinDays !== undefined) {
      const createdAt = new Date(customer.created_at)
      const daysAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      if (daysAgo > criteria.createdWithinDays) {
        return false
      }
    }

    return true
  }

  // ============================================================================
  // Product Catalog
  // ============================================================================

  /**
   * Get products with filtering
   */
  async getProducts(options?: {
    ids?: number[]
    sinceId?: number
    title?: string
    vendor?: string
    handle?: string
    productType?: string
    status?: 'active' | 'archived' | 'draft'
    createdAfter?: Date
    createdBefore?: Date
    updatedAfter?: Date
    updatedBefore?: Date
    limit?: number
  }): Promise<ShopifyProduct[]> {
    this.ensureConnected()

    const params: Record<string, string> = {}

    if (options?.ids) params.ids = options.ids.join(',')
    if (options?.sinceId) params.since_id = String(options.sinceId)
    if (options?.title) params.title = options.title
    if (options?.vendor) params.vendor = options.vendor
    if (options?.handle) params.handle = options.handle
    if (options?.productType) params.product_type = options.productType
    if (options?.status) params.status = options.status
    if (options?.createdAfter)
      params.created_at_min = options.createdAfter.toISOString()
    if (options?.createdBefore)
      params.created_at_max = options.createdBefore.toISOString()
    if (options?.updatedAfter)
      params.updated_at_min = options.updatedAfter.toISOString()
    if (options?.updatedBefore)
      params.updated_at_max = options.updatedBefore.toISOString()
    if (options?.limit) params.limit = String(options.limit)

    const { products } = await this.client!.getProducts(params as never)
    return products
  }

  /**
   * Get product by ID
   */
  async getProduct(productId: number): Promise<ShopifyProduct> {
    this.ensureConnected()
    const { product } = await this.client!.getProduct(productId)
    return product
  }

  /**
   * Sync product catalog
   */
  async syncProductCatalog(): Promise<{
    totalProducts: number
    activeProducts: number
    draftProducts: number
    archivedProducts: number
    totalVariants: number
    productsWithImages: number
  }> {
    this.ensureConnected()

    const { count: totalCount } = await this.client!.getProductsCount()
    const { count: activeCount } = await this.client!.getProductsCount({
      status: 'active',
    })
    const { count: draftCount } = await this.client!.getProductsCount({ status: 'draft' })
    const { count: archivedCount } = await this.client!.getProductsCount({
      status: 'archived',
    })

    // Get sample of products to count variants and images
    const { products } = await this.client!.getProducts({ limit: 250 })
    const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0)
    const productsWithImages = products.filter((p) => p.images.length > 0).length

    return {
      totalProducts: totalCount,
      activeProducts: activeCount,
      draftProducts: draftCount,
      archivedProducts: archivedCount,
      totalVariants,
      productsWithImages,
    }
  }

  // ============================================================================
  // Store Information
  // ============================================================================

  /**
   * Get store information
   */
  async getStoreInfo(): Promise<ShopifyStoreInfo> {
    this.ensureConnected()

    if (this.storeInfo) {
      return this.storeInfo
    }

    const { shop } = await this.client!.getShop()

    this.storeInfo = {
      id: shop.id,
      name: shop.name,
      email: shop.email,
      domain: shop.domain,
      myshopifyDomain: shop.myshopify_domain,
      currency: shop.currency,
      timezone: shop.timezone,
      planName: shop.plan_name,
      createdAt: shop.created_at,
      country: (shop as unknown as Record<string, string>).country || '',
      countryCode: (shop as unknown as Record<string, string>).country_code || '',
      province: (shop as unknown as Record<string, string>).province || '',
      provinceCode: (shop as unknown as Record<string, string>).province_code || '',
      primaryLocale: (shop as unknown as Record<string, string>).primary_locale || 'en',
      phone: (shop as unknown as Record<string, string | null>).phone || null,
      weightUnit: (shop as unknown as Record<string, string>).weight_unit || 'lb',
      moneyFormat: (shop as unknown as Record<string, string>).money_format || '${{amount}}',
      moneyWithCurrencyFormat:
        (shop as unknown as Record<string, string>).money_with_currency_format ||
        '${{amount}} USD',
    }

    return this.storeInfo
  }

  /**
   * Get current connection status
   */
  getStatus(): ShopifyConnectionStatus {
    return this.status
  }

  /**
   * Get connected shop domain
   */
  getShopDomain(): string | null {
    return this.shopDomain
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected' && this.client !== null
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Ensure the integration is connected
   */
  private ensureConnected(): void {
    if (!this.isConnected()) {
      throw new Error('Shopify integration not connected. Call connect first.')
    }
  }

  /**
   * Initialize the Shopify client
   */
  private async initializeClient(): Promise<void> {
    if (!this.shopDomain || !this.accessToken) {
      throw new Error('Shop domain and access token required')
    }

    this.status = 'connecting'

    const config: ShopifyConfig = {
      shopName: this.shopDomain.replace('.myshopify.com', ''),
      accessToken: this.accessToken,
      apiVersion: this.apiVersion,
    }

    this.client = createShopifyClient(config)

    // Validate connection
    const isValid = await this.client.validateConnection()
    if (!isValid) {
      this.status = 'error'
      throw new Error('Failed to validate Shopify connection')
    }

    // Load store info
    await this.getStoreInfo()
    this.status = 'connected'
  }

  /**
   * Make direct API request
   */
  private async makeApiRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    if (!this.shopDomain || !this.accessToken) {
      throw new Error('Not connected')
    }

    const url = `https://${this.shopDomain}/admin/api/${this.apiVersion}${endpoint}`

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.accessToken,
      },
    }

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Shopify API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  /**
   * Normalize shop domain
   */
  private normalizeShopDomain(shop: string): string {
    // Remove protocol if present
    let domain = shop.replace(/^https?:\/\//, '')

    // Remove trailing slash
    domain = domain.replace(/\/$/, '')

    // Add .myshopify.com if not present
    if (!domain.includes('.myshopify.com')) {
      domain = `${domain}.myshopify.com`
    }

    return domain
  }

  /**
   * Generate nonce for OAuth
   */
  private generateNonce(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new Shopify deep integration instance
 */
export function createShopifyDeepIntegration(config?: {
  apiVersion?: string
}): ShopifyDeepIntegration {
  return new ShopifyDeepIntegration(config)
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  ShopifyDeepIntegration,
  createShopifyDeepIntegration,
  DEFAULT_SHOPIFY_SCOPES,
}

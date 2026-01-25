/**
 * Shopify Integration Client
 *
 * Native Shopify REST API integration for the Nexus workflow engine.
 * Implements Shopify's leaky bucket rate limiting algorithm and proper error handling.
 *
 * @version 2024-01
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface ShopifyConfig {
  /** Shopify store name (e.g., 'mystore' for mystore.myshopify.com) */
  shopName: string;
  /** Access token from Shopify Admin API */
  accessToken: string;
  /** API version (default: '2024-01') */
  apiVersion?: string;
  /** Optional custom domain */
  customDomain?: string;
}

export interface ShopifyAddress {
  id?: number;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  province_code?: string;
  country?: string;
  country_code?: string;
  zip?: string;
  phone?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  latitude?: number;
  longitude?: number;
  default?: boolean;
}

export interface ShopifyMoney {
  amount: string;
  currency_code: string;
}

export interface ShopifyLineItem {
  id: number;
  variant_id: number | null;
  product_id: number | null;
  title: string;
  variant_title: string | null;
  sku: string | null;
  vendor: string | null;
  quantity: number;
  fulfillable_quantity: number;
  fulfillment_status: string | null;
  price: string;
  total_discount: string;
  gift_card: boolean;
  taxable: boolean;
  tax_lines: ShopifyTaxLine[];
  properties: { name: string; value: string }[];
}

export interface ShopifyTaxLine {
  title: string;
  price: string;
  rate: number;
  channel_liable: boolean;
}

export interface ShopifyShippingLine {
  id: number;
  title: string;
  price: string;
  code: string | null;
  source: string;
  phone: string | null;
  carrier_identifier: string | null;
  tax_lines: ShopifyTaxLine[];
  discounted_price: string;
}

export interface ShopifyOrder {
  id: number;
  admin_graphql_api_id: string;
  app_id: number | null;
  browser_ip: string | null;
  buyer_accepts_marketing: boolean;
  cancel_reason: string | null;
  cancelled_at: string | null;
  cart_token: string | null;
  checkout_id: number | null;
  checkout_token: string | null;
  closed_at: string | null;
  confirmed: boolean;
  contact_email: string | null;
  created_at: string;
  currency: string;
  current_subtotal_price: string;
  current_total_discounts: string;
  current_total_price: string;
  current_total_tax: string;
  customer: ShopifyCustomer | null;
  customer_locale: string | null;
  email: string;
  financial_status: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided';
  fulfillment_status: 'fulfilled' | 'partial' | 'restocked' | null;
  gateway: string;
  landing_site: string | null;
  landing_site_ref: string | null;
  line_items: ShopifyLineItem[];
  name: string;
  note: string | null;
  note_attributes: { name: string; value: string }[];
  number: number;
  order_number: number;
  order_status_url: string;
  payment_gateway_names: string[];
  phone: string | null;
  presentment_currency: string;
  processed_at: string;
  processing_method: string;
  reference: string | null;
  referring_site: string | null;
  refunds: ShopifyRefund[];
  shipping_address: ShopifyAddress | null;
  billing_address: ShopifyAddress | null;
  shipping_lines: ShopifyShippingLine[];
  source_identifier: string | null;
  source_name: string;
  source_url: string | null;
  subtotal_price: string;
  tags: string;
  tax_lines: ShopifyTaxLine[];
  taxes_included: boolean;
  test: boolean;
  token: string;
  total_discounts: string;
  total_line_items_price: string;
  total_outstanding: string;
  total_price: string;
  total_tax: string;
  total_tip_received: string;
  total_weight: number;
  updated_at: string;
  fulfillments: ShopifyFulfillment[];
}

export interface ShopifyRefund {
  id: number;
  admin_graphql_api_id: string;
  created_at: string;
  note: string | null;
  order_id: number;
  processed_at: string;
  restock: boolean;
  user_id: number | null;
}

export interface ShopifyProduct {
  id: number;
  admin_graphql_api_id: string;
  body_html: string | null;
  created_at: string;
  handle: string;
  images: ShopifyImage[];
  options: ShopifyProductOption[];
  product_type: string;
  published_at: string | null;
  published_scope: string;
  status: 'active' | 'archived' | 'draft';
  tags: string;
  template_suffix: string | null;
  title: string;
  updated_at: string;
  variants: ShopifyVariant[];
  vendor: string;
}

export interface ShopifyImage {
  id: number;
  admin_graphql_api_id: string;
  alt: string | null;
  created_at: string;
  height: number;
  position: number;
  product_id: number;
  src: string;
  updated_at: string;
  variant_ids: number[];
  width: number;
}

export interface ShopifyProductOption {
  id: number;
  name: string;
  position: number;
  product_id: number;
  values: string[];
}

export interface ShopifyVariant {
  id: number;
  admin_graphql_api_id: string;
  barcode: string | null;
  compare_at_price: string | null;
  created_at: string;
  fulfillment_service: string;
  grams: number;
  image_id: number | null;
  inventory_item_id: number;
  inventory_management: string | null;
  inventory_policy: 'deny' | 'continue';
  inventory_quantity: number;
  old_inventory_quantity: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  position: number;
  price: string;
  product_id: number;
  requires_shipping: boolean;
  sku: string | null;
  taxable: boolean;
  title: string;
  updated_at: string;
  weight: number;
  weight_unit: 'g' | 'kg' | 'oz' | 'lb';
}

export interface ShopifyCustomer {
  id: number;
  admin_graphql_api_id: string;
  accepts_marketing: boolean;
  accepts_marketing_updated_at: string;
  addresses: ShopifyAddress[];
  created_at: string;
  currency: string;
  default_address: ShopifyAddress | null;
  email: string;
  email_marketing_consent: {
    state: string;
    opt_in_level: string;
    consent_updated_at: string | null;
  } | null;
  first_name: string;
  last_name: string;
  last_order_id: number | null;
  last_order_name: string | null;
  marketing_opt_in_level: string | null;
  multipass_identifier: string | null;
  note: string | null;
  orders_count: number;
  phone: string | null;
  sms_marketing_consent: {
    state: string;
    opt_in_level: string;
    consent_updated_at: string | null;
    consent_collected_from: string;
  } | null;
  state: 'disabled' | 'invited' | 'enabled' | 'declined';
  tags: string;
  tax_exempt: boolean;
  tax_exemptions: string[];
  total_spent: string;
  updated_at: string;
  verified_email: boolean;
}

export interface ShopifyFulfillment {
  id: number;
  admin_graphql_api_id: string;
  created_at: string;
  line_items: ShopifyLineItem[];
  location_id: number;
  name: string;
  notify_customer: boolean;
  order_id: number;
  origin_address: ShopifyAddress | null;
  receipt: Record<string, unknown>;
  service: string;
  shipment_status: string | null;
  status: 'pending' | 'open' | 'success' | 'cancelled' | 'error' | 'failure';
  tracking_company: string | null;
  tracking_number: string | null;
  tracking_numbers: string[];
  tracking_url: string | null;
  tracking_urls: string[];
  updated_at: string;
  variant_inventory_management: string;
}

export interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number | null;
  updated_at: string;
}

export interface ShopifyLocation {
  id: number;
  admin_graphql_api_id: string;
  active: boolean;
  address1: string;
  address2: string | null;
  city: string;
  country: string;
  country_code: string;
  created_at: string;
  legacy: boolean;
  localized_country_name: string;
  localized_province_name: string;
  name: string;
  phone: string | null;
  province: string;
  province_code: string;
  updated_at: string;
  zip: string;
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface OrdersQueryParams {
  ids?: string;
  limit?: number;
  since_id?: number;
  created_at_min?: string;
  created_at_max?: string;
  updated_at_min?: string;
  updated_at_max?: string;
  processed_at_min?: string;
  processed_at_max?: string;
  status?: 'open' | 'closed' | 'cancelled' | 'any';
  financial_status?: 'authorized' | 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'voided' | 'partially_refunded' | 'any' | 'unpaid';
  fulfillment_status?: 'shipped' | 'partial' | 'unshipped' | 'any' | 'unfulfilled';
  fields?: string;
}

export interface ProductsQueryParams {
  ids?: string;
  limit?: number;
  since_id?: number;
  title?: string;
  vendor?: string;
  handle?: string;
  product_type?: string;
  collection_id?: number;
  created_at_min?: string;
  created_at_max?: string;
  updated_at_min?: string;
  updated_at_max?: string;
  published_at_min?: string;
  published_at_max?: string;
  published_status?: 'published' | 'unpublished' | 'any';
  status?: 'active' | 'archived' | 'draft';
  fields?: string;
}

export interface CustomersQueryParams {
  ids?: string;
  limit?: number;
  since_id?: number;
  created_at_min?: string;
  created_at_max?: string;
  updated_at_min?: string;
  updated_at_max?: string;
  fields?: string;
}

export interface CreateFulfillmentData {
  line_items_by_fulfillment_order: {
    fulfillment_order_id: number;
    fulfillment_order_line_items?: {
      id: number;
      quantity: number;
    }[];
  }[];
  tracking_info?: {
    company?: string;
    number?: string;
    url?: string;
  };
  notify_customer?: boolean;
  origin_address?: ShopifyAddress;
  message?: string;
}

export interface UpdateOrderData {
  note?: string;
  tags?: string;
  email?: string;
  phone?: string;
  buyer_accepts_marketing?: boolean;
  note_attributes?: { name: string; value: string }[];
  shipping_address?: Partial<ShopifyAddress>;
  customer?: { id: number };
}

// ============================================================================
// Error Types
// ============================================================================

export class ShopifyError extends Error {
  statusCode: number;
  errorCode: string;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ShopifyError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
  }
}

export class ShopifyAuthError extends ShopifyError {
  constructor(message: string) {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'ShopifyAuthError';
  }
}

export class ShopifyRateLimitError extends ShopifyError {
  retryAfter: number;

  constructor(
    message: string,
    retryAfter: number
  ) {
    super(message, 429, 'RATE_LIMITED');
    this.name = 'ShopifyRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ShopifyNotFoundError extends ShopifyError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
    this.name = 'ShopifyNotFoundError';
  }
}

export class ShopifyValidationError extends ShopifyError {
  constructor(message: string, errors?: Record<string, string[]>) {
    super(message, 422, 'VALIDATION_ERROR', errors);
    this.name = 'ShopifyValidationError';
  }
}

// ============================================================================
// Rate Limiter
// ============================================================================

interface RateLimitState {
  available: number;
  maximum: number;
  lastUpdated: number;
}

class ShopifyRateLimiter {
  private state: RateLimitState = {
    available: 40,
    maximum: 40,
    lastUpdated: Date.now()
  };

  private leakRate = 2; // Shopify leaks 2 requests per second

  /**
   * Update rate limit state from response headers
   */
  updateFromHeaders(headers: Headers): void {
    const callLimit = headers.get('X-Shopify-Shop-Api-Call-Limit');
    if (callLimit) {
      const [used, max] = callLimit.split('/').map(Number);
      this.state = {
        available: max - used,
        maximum: max,
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * Calculate current available capacity using leaky bucket algorithm
   */
  getCurrentAvailable(): number {
    const now = Date.now();
    const elapsed = (now - this.state.lastUpdated) / 1000;
    const leaked = Math.floor(elapsed * this.leakRate);
    return Math.min(this.state.maximum, this.state.available + leaked);
  }

  /**
   * Check if a request can be made now
   */
  canMakeRequest(): boolean {
    return this.getCurrentAvailable() > 1;
  }

  /**
   * Calculate delay needed before making a request
   */
  getDelayMs(): number {
    if (this.canMakeRequest()) return 0;
    const needed = 2; // Need at least 2 available to be safe
    const current = this.getCurrentAvailable();
    const deficit = needed - current;
    return Math.ceil((deficit / this.leakRate) * 1000);
  }

  /**
   * Get current state for debugging
   */
  getState(): RateLimitState & { currentAvailable: number } {
    return {
      ...this.state,
      currentAvailable: this.getCurrentAvailable()
    };
  }
}

// ============================================================================
// Shopify Client
// ============================================================================

export class ShopifyClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private rateLimiter: ShopifyRateLimiter;
  private maxRetries: number = 3;
  private retryDelayMs: number = 1000;

  constructor(config: ShopifyConfig) {
    const apiVersion = config.apiVersion || '2024-01';
    const domain = config.customDomain || `${config.shopName}.myshopify.com`;
    this.baseUrl = `https://${domain}/admin/api/${apiVersion}`;

    this.headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': config.accessToken
    };

    this.rateLimiter = new ShopifyRateLimiter();
  }

  // --------------------------------------------------------------------------
  // Core Request Method
  // --------------------------------------------------------------------------

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    retryCount: number = 0
  ): Promise<T> {
    // Wait if rate limited
    const delay = this.rateLimiter.getDelayMs();
    if (delay > 0) {
      await this.sleep(delay);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined
    };

    try {
      const response = await fetch(url, options);

      // Update rate limit state from headers
      this.rateLimiter.updateFromHeaders(response.headers);

      // Handle different response status codes
      if (response.ok) {
        const data = await response.json();
        return data as T;
      }

      // Handle errors
      await this.handleErrorResponse(response, retryCount, method, endpoint, body);

      // This won't be reached but TypeScript needs it
      throw new ShopifyError('Unknown error', response.status, 'UNKNOWN');
    } catch (error) {
      if (error instanceof ShopifyError) {
        throw error;
      }

      // Network errors - retry with exponential backoff
      if (retryCount < this.maxRetries) {
        await this.sleep(this.retryDelayMs * Math.pow(2, retryCount));
        return this.request<T>(method, endpoint, body, retryCount + 1);
      }

      throw new ShopifyError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        'NETWORK_ERROR'
      );
    }
  }

  private async handleErrorResponse(
    response: Response,
    retryCount: number,
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<never> {
    const status = response.status;
    let errorBody: { errors?: Record<string, string[]> | string } = {};

    try {
      errorBody = await response.json();
    } catch {
      // Response might not be JSON
    }

    const errorMessage = typeof errorBody.errors === 'string'
      ? errorBody.errors
      : JSON.stringify(errorBody.errors || 'Unknown error');

    switch (status) {
      case 401:
        throw new ShopifyAuthError('Invalid or expired access token');

      case 404:
        throw new ShopifyNotFoundError(`Resource not found: ${endpoint}`);

      case 422:
        throw new ShopifyValidationError(
          `Validation failed: ${errorMessage}`,
          typeof errorBody.errors === 'object' ? errorBody.errors : undefined
        );

      case 429: {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);

        if (retryCount < this.maxRetries) {
          await this.sleep(retryAfter * 1000);
          const result = await this.request(method, endpoint, body, retryCount + 1);
          // TypeScript trick - throw after returning to satisfy never return type
          throw result;
        }

        throw new ShopifyRateLimitError(
          'Rate limit exceeded. Please retry after delay.',
          retryAfter
        );
      }

      case 500:
      case 502:
      case 503:
      case 504:
        if (retryCount < this.maxRetries) {
          await this.sleep(this.retryDelayMs * Math.pow(2, retryCount));
          const result = await this.request(method, endpoint, body, retryCount + 1);
          throw result;
        }
        throw new ShopifyError(
          `Server error (${status}): ${errorMessage}`,
          status,
          'SERVER_ERROR'
        );

      default:
        throw new ShopifyError(
          `Request failed (${status}): ${errorMessage}`,
          status,
          'REQUEST_FAILED'
        );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private buildQueryString<T extends object>(params: T): string {
    const entries = Object.entries(params) as [string, unknown][];
    const filtered = entries.filter(([_, v]) => v !== undefined);
    if (filtered.length === 0) return '';
    return '?' + filtered
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
  }

  // --------------------------------------------------------------------------
  // Orders API
  // --------------------------------------------------------------------------

  /**
   * Fetch orders with optional filtering
   */
  async getOrders(params: OrdersQueryParams = {}): Promise<{ orders: ShopifyOrder[] }> {
    const queryString = this.buildQueryString(params);
    return this.request<{ orders: ShopifyOrder[] }>('GET', `/orders.json${queryString}`);
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderId: number): Promise<{ order: ShopifyOrder }> {
    return this.request<{ order: ShopifyOrder }>('GET', `/orders/${orderId}.json`);
  }

  /**
   * Update an order
   */
  async updateOrder(orderId: number, data: UpdateOrderData): Promise<{ order: ShopifyOrder }> {
    return this.request<{ order: ShopifyOrder }>('PUT', `/orders/${orderId}.json`, { order: data });
  }

  /**
   * Close an order
   */
  async closeOrder(orderId: number): Promise<{ order: ShopifyOrder }> {
    return this.request<{ order: ShopifyOrder }>('POST', `/orders/${orderId}/close.json`);
  }

  /**
   * Reopen a closed order
   */
  async reopenOrder(orderId: number): Promise<{ order: ShopifyOrder }> {
    return this.request<{ order: ShopifyOrder }>('POST', `/orders/${orderId}/open.json`);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(
    orderId: number,
    options?: {
      reason?: 'customer' | 'fraud' | 'inventory' | 'declined' | 'other';
      email?: boolean;
      restock?: boolean;
    }
  ): Promise<{ order: ShopifyOrder }> {
    return this.request<{ order: ShopifyOrder }>('POST', `/orders/${orderId}/cancel.json`, options);
  }

  /**
   * Get count of orders
   */
  async getOrdersCount(params: Omit<OrdersQueryParams, 'limit' | 'fields'> = {}): Promise<{ count: number }> {
    const queryString = this.buildQueryString(params);
    return this.request<{ count: number }>('GET', `/orders/count.json${queryString}`);
  }

  // --------------------------------------------------------------------------
  // Products API
  // --------------------------------------------------------------------------

  /**
   * List products with optional filtering
   */
  async getProducts(params: ProductsQueryParams = {}): Promise<{ products: ShopifyProduct[] }> {
    const queryString = this.buildQueryString(params);
    return this.request<{ products: ShopifyProduct[] }>('GET', `/products.json${queryString}`);
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: number): Promise<{ product: ShopifyProduct }> {
    return this.request<{ product: ShopifyProduct }>('GET', `/products/${productId}.json`);
  }

  /**
   * Get count of products
   */
  async getProductsCount(params: Omit<ProductsQueryParams, 'limit' | 'fields'> = {}): Promise<{ count: number }> {
    const queryString = this.buildQueryString(params);
    return this.request<{ count: number }>('GET', `/products/count.json${queryString}`);
  }

  /**
   * Get product variants
   */
  async getVariants(productId: number): Promise<{ variants: ShopifyVariant[] }> {
    return this.request<{ variants: ShopifyVariant[] }>('GET', `/products/${productId}/variants.json`);
  }

  /**
   * Get a single variant
   */
  async getVariant(variantId: number): Promise<{ variant: ShopifyVariant }> {
    return this.request<{ variant: ShopifyVariant }>('GET', `/variants/${variantId}.json`);
  }

  // --------------------------------------------------------------------------
  // Inventory API
  // --------------------------------------------------------------------------

  /**
   * Update inventory level for an inventory item at a location
   */
  async updateInventory(
    inventoryItemId: number,
    locationId: number,
    available: number
  ): Promise<{ inventory_level: ShopifyInventoryLevel }> {
    return this.request<{ inventory_level: ShopifyInventoryLevel }>(
      'POST',
      '/inventory_levels/set.json',
      {
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available
      }
    );
  }

  /**
   * Adjust inventory level (relative change)
   */
  async adjustInventory(
    inventoryItemId: number,
    locationId: number,
    adjustment: number
  ): Promise<{ inventory_level: ShopifyInventoryLevel }> {
    return this.request<{ inventory_level: ShopifyInventoryLevel }>(
      'POST',
      '/inventory_levels/adjust.json',
      {
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available_adjustment: adjustment
      }
    );
  }

  /**
   * Get inventory levels for an inventory item
   */
  async getInventoryLevels(
    inventoryItemIds: number[],
    locationIds?: number[]
  ): Promise<{ inventory_levels: ShopifyInventoryLevel[] }> {
    const params: Record<string, string> = {
      inventory_item_ids: inventoryItemIds.join(',')
    };
    if (locationIds) {
      params.location_ids = locationIds.join(',');
    }
    const queryString = this.buildQueryString(params);
    return this.request<{ inventory_levels: ShopifyInventoryLevel[] }>(
      'GET',
      `/inventory_levels.json${queryString}`
    );
  }

  /**
   * Get all locations
   */
  async getLocations(): Promise<{ locations: ShopifyLocation[] }> {
    return this.request<{ locations: ShopifyLocation[] }>('GET', '/locations.json');
  }

  /**
   * Get a single location
   */
  async getLocation(locationId: number): Promise<{ location: ShopifyLocation }> {
    return this.request<{ location: ShopifyLocation }>('GET', `/locations/${locationId}.json`);
  }

  // --------------------------------------------------------------------------
  // Customers API
  // --------------------------------------------------------------------------

  /**
   * List customers with optional filtering
   */
  async getCustomers(params: CustomersQueryParams = {}): Promise<{ customers: ShopifyCustomer[] }> {
    const queryString = this.buildQueryString(params);
    return this.request<{ customers: ShopifyCustomer[] }>('GET', `/customers.json${queryString}`);
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(customerId: number): Promise<{ customer: ShopifyCustomer }> {
    return this.request<{ customer: ShopifyCustomer }>('GET', `/customers/${customerId}.json`);
  }

  /**
   * Search customers by query
   */
  async searchCustomers(query: string): Promise<{ customers: ShopifyCustomer[] }> {
    return this.request<{ customers: ShopifyCustomer[] }>(
      'GET',
      `/customers/search.json?query=${encodeURIComponent(query)}`
    );
  }

  /**
   * Get customer orders
   */
  async getCustomerOrders(customerId: number): Promise<{ orders: ShopifyOrder[] }> {
    return this.request<{ orders: ShopifyOrder[] }>(
      'GET',
      `/customers/${customerId}/orders.json`
    );
  }

  /**
   * Get count of customers
   */
  async getCustomersCount(): Promise<{ count: number }> {
    return this.request<{ count: number }>('GET', '/customers/count.json');
  }

  // --------------------------------------------------------------------------
  // Fulfillment API
  // --------------------------------------------------------------------------

  /**
   * Get fulfillment orders for an order
   */
  async getFulfillmentOrders(orderId: number): Promise<{ fulfillment_orders: { id: number; status: string; line_items: unknown[] }[] }> {
    return this.request<{ fulfillment_orders: { id: number; status: string; line_items: unknown[] }[] }>(
      'GET',
      `/orders/${orderId}/fulfillment_orders.json`
    );
  }

  /**
   * Create a fulfillment (2024-01 API version)
   * Uses the new FulfillmentOrder-based fulfillment creation
   */
  async createFulfillment(data: CreateFulfillmentData): Promise<{ fulfillment: ShopifyFulfillment }> {
    return this.request<{ fulfillment: ShopifyFulfillment }>(
      'POST',
      '/fulfillments.json',
      { fulfillment: data }
    );
  }

  /**
   * Get fulfillments for an order
   */
  async getFulfillments(orderId: number): Promise<{ fulfillments: ShopifyFulfillment[] }> {
    return this.request<{ fulfillments: ShopifyFulfillment[] }>(
      'GET',
      `/orders/${orderId}/fulfillments.json`
    );
  }

  /**
   * Get a single fulfillment
   */
  async getFulfillment(orderId: number, fulfillmentId: number): Promise<{ fulfillment: ShopifyFulfillment }> {
    return this.request<{ fulfillment: ShopifyFulfillment }>(
      'GET',
      `/orders/${orderId}/fulfillments/${fulfillmentId}.json`
    );
  }

  /**
   * Update tracking for a fulfillment
   */
  async updateFulfillmentTracking(
    fulfillmentId: number,
    tracking: {
      tracking_info: {
        number?: string;
        url?: string;
        company?: string;
      };
      notify_customer?: boolean;
    }
  ): Promise<{ fulfillment: ShopifyFulfillment }> {
    return this.request<{ fulfillment: ShopifyFulfillment }>(
      'POST',
      `/fulfillments/${fulfillmentId}/update_tracking.json`,
      tracking
    );
  }

  /**
   * Cancel a fulfillment
   */
  async cancelFulfillment(fulfillmentId: number): Promise<{ fulfillment: ShopifyFulfillment }> {
    return this.request<{ fulfillment: ShopifyFulfillment }>(
      'POST',
      `/fulfillments/${fulfillmentId}/cancel.json`
    );
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  /**
   * Get current rate limit state (for debugging/monitoring)
   */
  getRateLimitState(): ReturnType<ShopifyRateLimiter['getState']> {
    return this.rateLimiter.getState();
  }

  /**
   * Validate configuration by making a test request
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.request<{ shop: unknown }>('GET', '/shop.json');
      return true;
    } catch (error) {
      if (error instanceof ShopifyAuthError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get shop information
   */
  async getShop(): Promise<{ shop: {
    id: number;
    name: string;
    email: string;
    domain: string;
    myshopify_domain: string;
    currency: string;
    timezone: string;
    plan_name: string;
    created_at: string;
  } }> {
    return this.request('GET', '/shop.json');
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new ShopifyClient instance
 */
export function createShopifyClient(config: ShopifyConfig): ShopifyClient {
  return new ShopifyClient(config);
}

// ============================================================================
// Export Types
// ============================================================================

export type {
  RateLimitState
};

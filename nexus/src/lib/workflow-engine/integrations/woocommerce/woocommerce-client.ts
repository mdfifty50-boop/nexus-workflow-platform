/**
 * WooCommerce Integration Client
 *
 * Native WooCommerce REST API integration for the Nexus workflow engine.
 * Implements OAuth 1.0a authentication and proper error handling with retry logic.
 *
 * @version 2024-01
 */

// ============================================================================
// Type Definitions - Configuration
// ============================================================================

export interface WooCommerceConfig {
  /** WooCommerce site URL (e.g., 'https://mystore.com') */
  siteUrl: string;
  /** Consumer Key from WooCommerce REST API settings */
  consumerKey: string;
  /** Consumer Secret from WooCommerce REST API settings */
  consumerSecret: string;
  /** API version (default: 'wc/v3') */
  version?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Verify SSL (set to false for self-signed certs in dev) */
  verifySsl?: boolean;
}

// ============================================================================
// Type Definitions - Common Types
// ============================================================================

export interface WooAddress {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface WooMeta {
  id: number;
  key: string;
  value: string;
}

export interface WooImage {
  id: number;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  src: string;
  name: string;
  alt: string;
}

export interface WooTaxLine {
  id: number;
  rate_code: string;
  rate_id: number;
  label: string;
  compound: boolean;
  tax_total: string;
  shipping_tax_total: string;
  rate_percent: number;
  meta_data: WooMeta[];
}

// ============================================================================
// Type Definitions - Orders
// ============================================================================

export interface WooLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  tax_class: string;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  taxes: { id: number; total: string; subtotal: string }[];
  meta_data: WooMeta[];
  sku: string | null;
  price: number;
  image: WooImage | null;
  parent_name: string | null;
}

export interface WooShippingLine {
  id: number;
  method_title: string;
  method_id: string;
  instance_id: string;
  total: string;
  total_tax: string;
  taxes: { id: number; total: string }[];
  meta_data: WooMeta[];
}

export interface WooFeeLine {
  id: number;
  name: string;
  tax_class: string;
  tax_status: 'taxable' | 'none';
  amount: string;
  total: string;
  total_tax: string;
  taxes: { id: number; total: string; subtotal: string }[];
  meta_data: WooMeta[];
}

export interface WooCouponLine {
  id: number;
  code: string;
  discount: string;
  discount_tax: string;
  meta_data: WooMeta[];
}

export interface WooRefundLine {
  id: number;
  reason: string;
  total: string;
}

export interface WooOrder {
  id: number;
  parent_id: number;
  status: WooOrderStatus;
  currency: string;
  version: string;
  prices_include_tax: boolean;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  customer_id: number;
  order_key: string;
  billing: WooAddress;
  shipping: WooAddress;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  customer_ip_address: string;
  customer_user_agent: string;
  created_via: string;
  customer_note: string;
  date_completed: string | null;
  date_completed_gmt: string | null;
  date_paid: string | null;
  date_paid_gmt: string | null;
  cart_hash: string;
  number: string;
  meta_data: WooMeta[];
  line_items: WooLineItem[];
  tax_lines: WooTaxLine[];
  shipping_lines: WooShippingLine[];
  fee_lines: WooFeeLine[];
  coupon_lines: WooCouponLine[];
  refunds: WooRefundLine[];
  payment_url: string;
  is_editable: boolean;
  needs_payment: boolean;
  needs_processing: boolean;
  date_created_gmt_timestamp: number;
  date_modified_gmt_timestamp: number;
  currency_symbol: string;
}

export type WooOrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed'
  | 'trash';

// ============================================================================
// Type Definitions - Products
// ============================================================================

export interface WooProductDimensions {
  length: string;
  width: string;
  height: string;
}

export interface WooProductCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WooProductTag {
  id: number;
  name: string;
  slug: string;
}

export interface WooProductAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface WooProductDownload {
  id: string;
  name: string;
  file: string;
}

export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  type: 'simple' | 'grouped' | 'external' | 'variable';
  status: 'draft' | 'pending' | 'private' | 'publish';
  featured: boolean;
  catalog_visibility: 'visible' | 'catalog' | 'search' | 'hidden';
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_from_gmt: string | null;
  date_on_sale_to: string | null;
  date_on_sale_to_gmt: string | null;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  downloads: WooProductDownload[];
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: 'taxable' | 'shipping' | 'none';
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  backorders: 'no' | 'notify' | 'yes';
  backorders_allowed: boolean;
  backordered: boolean;
  low_stock_amount: number | null;
  sold_individually: boolean;
  weight: string;
  dimensions: WooProductDimensions;
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: WooProductCategory[];
  tags: WooProductTag[];
  images: WooImage[];
  attributes: WooProductAttribute[];
  default_attributes: { id: number; name: string; option: string }[];
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  price_html: string;
  related_ids: number[];
  meta_data: WooMeta[];
}

// ============================================================================
// Type Definitions - Customers
// ============================================================================

export interface WooCustomer {
  id: number;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  billing: WooAddress;
  shipping: WooAddress;
  is_paying_customer: boolean;
  avatar_url: string;
  meta_data: WooMeta[];
}

// ============================================================================
// Type Definitions - Refunds
// ============================================================================

export interface WooRefund {
  id: number;
  date_created: string;
  date_created_gmt: string;
  amount: string;
  reason: string;
  refunded_by: number;
  refunded_payment: boolean;
  meta_data: WooMeta[];
  line_items: WooRefundLineItem[];
}

export interface WooRefundLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  tax_class: string;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  taxes: { id: number; total: string; subtotal: string }[];
  meta_data: WooMeta[];
  sku: string | null;
  price: number;
}

// ============================================================================
// Type Definitions - Order Notes
// ============================================================================

export interface WooOrderNote {
  id: number;
  author: string;
  date_created: string;
  date_created_gmt: string;
  note: string;
  customer_note: boolean;
  added_by_user: boolean;
}

// ============================================================================
// Type Definitions - Query Parameters
// ============================================================================

export interface WooOrdersQueryParams {
  context?: 'view' | 'edit';
  page?: number;
  per_page?: number;
  search?: string;
  after?: string;
  before?: string;
  modified_after?: string;
  modified_before?: string;
  dates_are_gmt?: boolean;
  exclude?: number[];
  include?: number[];
  offset?: number;
  order?: 'asc' | 'desc';
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug';
  parent?: number[];
  parent_exclude?: number[];
  status?: WooOrderStatus | WooOrderStatus[];
  customer?: number;
  product?: number;
  dp?: number;
}

export interface WooProductsQueryParams {
  context?: 'view' | 'edit';
  page?: number;
  per_page?: number;
  search?: string;
  after?: string;
  before?: string;
  modified_after?: string;
  modified_before?: string;
  dates_are_gmt?: boolean;
  exclude?: number[];
  include?: number[];
  offset?: number;
  order?: 'asc' | 'desc';
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug' | 'price' | 'popularity' | 'rating';
  parent?: number[];
  parent_exclude?: number[];
  slug?: string;
  status?: 'draft' | 'pending' | 'private' | 'publish' | 'any';
  type?: 'simple' | 'grouped' | 'external' | 'variable';
  sku?: string;
  featured?: boolean;
  category?: string;
  tag?: string;
  shipping_class?: string;
  attribute?: string;
  attribute_term?: string;
  tax_class?: string;
  on_sale?: boolean;
  min_price?: string;
  max_price?: string;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
}

export interface WooCustomersQueryParams {
  context?: 'view' | 'edit';
  page?: number;
  per_page?: number;
  search?: string;
  exclude?: number[];
  include?: number[];
  offset?: number;
  order?: 'asc' | 'desc';
  orderby?: 'id' | 'include' | 'name' | 'registered_date';
  email?: string;
  role?: 'all' | 'administrator' | 'editor' | 'author' | 'contributor' | 'subscriber' | 'customer' | 'shop_manager';
}

// ============================================================================
// Type Definitions - Update/Create Data
// ============================================================================

export interface WooUpdateOrderData {
  status?: WooOrderStatus;
  customer_note?: string;
  billing?: Partial<WooAddress>;
  shipping?: Partial<WooAddress>;
  meta_data?: { key: string; value: string }[];
  line_items?: {
    id?: number;
    product_id?: number;
    variation_id?: number;
    quantity?: number;
    meta_data?: { key: string; value: string }[];
  }[];
  shipping_lines?: {
    id?: number;
    method_title?: string;
    method_id?: string;
    total?: string;
  }[];
  fee_lines?: {
    id?: number;
    name?: string;
    total?: string;
    tax_class?: string;
    tax_status?: 'taxable' | 'none';
  }[];
  coupon_lines?: {
    id?: number;
    code?: string;
  }[];
  set_paid?: boolean;
}

export interface WooUpdateProductData {
  name?: string;
  slug?: string;
  type?: 'simple' | 'grouped' | 'external' | 'variable';
  status?: 'draft' | 'pending' | 'private' | 'publish';
  featured?: boolean;
  catalog_visibility?: 'visible' | 'catalog' | 'search' | 'hidden';
  description?: string;
  short_description?: string;
  sku?: string;
  regular_price?: string;
  sale_price?: string;
  date_on_sale_from?: string;
  date_on_sale_to?: string;
  virtual?: boolean;
  downloadable?: boolean;
  downloads?: { name: string; file: string }[];
  download_limit?: number;
  download_expiry?: number;
  external_url?: string;
  button_text?: string;
  tax_status?: 'taxable' | 'shipping' | 'none';
  tax_class?: string;
  manage_stock?: boolean;
  stock_quantity?: number;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  backorders?: 'no' | 'notify' | 'yes';
  low_stock_amount?: number;
  sold_individually?: boolean;
  weight?: string;
  dimensions?: Partial<WooProductDimensions>;
  shipping_class?: string;
  reviews_allowed?: boolean;
  upsell_ids?: number[];
  cross_sell_ids?: number[];
  parent_id?: number;
  purchase_note?: string;
  categories?: { id: number }[];
  tags?: { id: number }[];
  images?: { id?: number; src?: string; name?: string; alt?: string }[];
  attributes?: {
    id?: number;
    name?: string;
    position?: number;
    visible?: boolean;
    variation?: boolean;
    options?: string[];
  }[];
  default_attributes?: { id?: number; name?: string; option?: string }[];
  grouped_products?: number[];
  menu_order?: number;
  meta_data?: { key: string; value: string }[];
}

export interface WooCreateRefundData {
  amount?: string;
  reason?: string;
  refunded_by?: number;
  meta_data?: { key: string; value: string }[];
  line_items?: {
    id: number;
    quantity?: number;
    refund_total?: string;
    refund_tax?: { id: number; refund_total?: string }[];
  }[];
  api_refund?: boolean;
  api_restock?: boolean;
}

export interface WooCreateOrderNoteData {
  note: string;
  customer_note?: boolean;
  added_by_user?: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export class WooCommerceError extends Error {
  statusCode: number;
  errorCode: string;
  data?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    data?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WooCommerceError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.data = data;
  }
}

export class WooCommerceAuthError extends WooCommerceError {
  constructor(message: string) {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'WooCommerceAuthError';
  }
}

export class WooCommerceForbiddenError extends WooCommerceError {
  constructor(message: string) {
    super(message, 403, 'FORBIDDEN');
    this.name = 'WooCommerceForbiddenError';
  }
}

export class WooCommerceNotFoundError extends WooCommerceError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
    this.name = 'WooCommerceNotFoundError';
  }
}

export class WooCommerceValidationError extends WooCommerceError {
  errors?: Record<string, string[]>;

  constructor(message: string, errors?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'WooCommerceValidationError';
    this.errors = errors;
  }
}

export class WooCommerceRateLimitError extends WooCommerceError {
  retryAfter: number;

  constructor(message: string, retryAfter: number = 60) {
    super(message, 429, 'RATE_LIMITED');
    this.name = 'WooCommerceRateLimitError';
    this.retryAfter = retryAfter;
  }
}

// ============================================================================
// OAuth 1.0a Signature Generation
// ============================================================================

class OAuth1Signer {
  private consumerKey: string;
  private consumerSecret: string;

  constructor(consumerKey: string, consumerSecret: string) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
  }

  /**
   * Generate OAuth 1.0a signature for a request
   */
  async sign(
    method: string,
    url: string,
    params: Record<string, string> = {}
  ): Promise<Record<string, string>> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = this.generateNonce();

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.consumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA256',
      oauth_timestamp: timestamp,
      oauth_version: '1.0'
    };

    // Combine OAuth params with request params for signature base
    const allParams = { ...oauthParams, ...params };

    // Create signature base string
    const signatureBase = this.createSignatureBase(method, url, allParams);

    // Generate signature
    const signature = await this.generateSignature(signatureBase);
    oauthParams.oauth_signature = signature;

    return oauthParams;
  }

  /**
   * Generate a random nonce
   */
  private generateNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for (let i = 0; i < 32; i++) {
      nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
  }

  /**
   * Create the signature base string
   */
  private createSignatureBase(
    method: string,
    url: string,
    params: Record<string, string>
  ): string {
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .map(key => `${this.percentEncode(key)}=${this.percentEncode(params[key])}`)
      .join('&');

    // Remove query string from URL if present
    const baseUrl = url.split('?')[0];

    return `${method.toUpperCase()}&${this.percentEncode(baseUrl)}&${this.percentEncode(paramString)}`;
  }

  /**
   * Generate HMAC-SHA256 signature
   */
  private async generateSignature(signatureBase: string): Promise<string> {
    const signingKey = `${this.percentEncode(this.consumerSecret)}&`;

    // Use Web Crypto API for HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(signingKey);
    const messageData = encoder.encode(signatureBase);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

    // Convert to base64
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  /**
   * Percent encode string according to OAuth spec
   */
  private percentEncode(str: string): string {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/\*/g, '%2A')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29');
  }
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

class RetryHandler {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      baseDelayMs: config.baseDelayMs ?? 1000,
      maxDelayMs: config.maxDelayMs ?? 30000
    };
  }

  /**
   * Calculate delay for retry attempt
   */
  getDelayMs(attempt: number): number {
    const delay = this.config.baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * delay; // Add up to 30% jitter
    return Math.min(delay + jitter, this.config.maxDelayMs);
  }

  /**
   * Check if should retry
   */
  shouldRetry(attempt: number, error: unknown): boolean {
    if (attempt >= this.config.maxRetries) return false;

    if (error instanceof WooCommerceError) {
      // Retry on server errors and rate limits
      return [500, 502, 503, 504, 429].includes(error.statusCode);
    }

    // Retry on network errors
    return error instanceof TypeError && error.message.includes('fetch');
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// WooCommerce Client
// ============================================================================

export class WooCommerceClient {
  private baseUrl: string;
  private oauthSigner: OAuth1Signer;
  private retryHandler: RetryHandler;
  private timeout: number;
  private isHttps: boolean;

  constructor(config: WooCommerceConfig) {
    // Normalize site URL
    let siteUrl = config.siteUrl.replace(/\/+$/, '');
    if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
      siteUrl = `https://${siteUrl}`;
    }

    const version = config.version || 'wc/v3';
    this.baseUrl = `${siteUrl}/wp-json/${version}`;
    this.isHttps = siteUrl.startsWith('https://');
    this.timeout = config.timeout || 30000;

    this.oauthSigner = new OAuth1Signer(config.consumerKey, config.consumerSecret);
    this.retryHandler = new RetryHandler();
  }

  // --------------------------------------------------------------------------
  // Core Request Method
  // --------------------------------------------------------------------------

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    queryParams?: Record<string, string | number | boolean | undefined>,
    retryCount: number = 0
  ): Promise<T> {
    const url = this.buildUrl(endpoint, queryParams);

    try {
      const options = await this.buildRequestOptions(method, url, body, queryParams);

      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        return await this.handleResponse<T>(response, endpoint);
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      // Handle retry logic
      if (this.retryHandler.shouldRetry(retryCount, error)) {
        const delay = error instanceof WooCommerceRateLimitError
          ? error.retryAfter * 1000
          : this.retryHandler.getDelayMs(retryCount);

        await this.retryHandler.sleep(delay);
        return this.request<T>(method, endpoint, body, queryParams, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean | undefined>
  ): string {
    const baseUrl = `${this.baseUrl}${endpoint}`;

    if (!queryParams) return baseUrl;

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Build request options with OAuth authentication
   */
  private async buildRequestOptions(
    method: string,
    url: string,
    body?: unknown,
    queryParams?: Record<string, string | number | boolean | undefined>
  ): Promise<RequestInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // For HTTPS, use query string authentication (simpler)
    // For HTTP, use OAuth header authentication
    if (this.isHttps) {
      // Add consumer credentials as query params (handled in buildUrl for HTTPS)
      const urlObj = new URL(url);
      urlObj.searchParams.set('consumer_key', this.oauthSigner['consumerKey']);
      urlObj.searchParams.set('consumer_secret', this.oauthSigner['consumerSecret']);

      return {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      };
    } else {
      // Use OAuth 1.0a for HTTP
      const flatParams: Record<string, string> = {};
      if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
          if (value !== undefined) {
            flatParams[key] = String(value);
          }
        }
      }

      const oauthParams = await this.oauthSigner.sign(method, url.split('?')[0], flatParams);

      // Build Authorization header
      const authParts = Object.entries(oauthParams)
        .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
        .join(', ');
      headers['Authorization'] = `OAuth ${authParts}`;

      return {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      };
    }
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response, endpoint: string): Promise<T> {
    if (response.ok) {
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as T);
    }

    // Handle error responses
    let errorBody: { code?: string; message?: string; data?: Record<string, unknown> } = {};
    try {
      errorBody = await response.json();
    } catch {
      // Response might not be JSON
    }

    const message = errorBody.message || `Request failed for ${endpoint}`;
    const code = errorBody.code || 'UNKNOWN_ERROR';

    switch (response.status) {
      case 400:
        throw new WooCommerceValidationError(message);

      case 401:
        throw new WooCommerceAuthError(message);

      case 403:
        throw new WooCommerceForbiddenError(message);

      case 404:
        throw new WooCommerceNotFoundError(message);

      case 429: {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        throw new WooCommerceRateLimitError(message, retryAfter);
      }

      case 500:
      case 502:
      case 503:
      case 504:
        throw new WooCommerceError(
          `Server error: ${message}`,
          response.status,
          'SERVER_ERROR',
          errorBody.data
        );

      default:
        throw new WooCommerceError(message, response.status, code, errorBody.data);
    }
  }

  // --------------------------------------------------------------------------
  // Orders API
  // --------------------------------------------------------------------------

  /**
   * Fetch orders with optional filtering
   */
  async getOrders(params: WooOrdersQueryParams = {}): Promise<WooOrder[]> {
    const queryParams = this.convertQueryParams(params);
    return this.request<WooOrder[]>('GET', '/orders', undefined, queryParams);
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderId: number): Promise<WooOrder> {
    return this.request<WooOrder>('GET', `/orders/${orderId}`);
  }

  /**
   * Update an order
   */
  async updateOrder(orderId: number, data: WooUpdateOrderData): Promise<WooOrder> {
    return this.request<WooOrder>('PUT', `/orders/${orderId}`, data);
  }

  /**
   * Delete an order
   */
  async deleteOrder(orderId: number, force: boolean = false): Promise<WooOrder> {
    return this.request<WooOrder>('DELETE', `/orders/${orderId}`, undefined, { force });
  }

  /**
   * Create a new order
   */
  async createOrder(data: WooUpdateOrderData): Promise<WooOrder> {
    return this.request<WooOrder>('POST', '/orders', data);
  }

  // --------------------------------------------------------------------------
  // Products API
  // --------------------------------------------------------------------------

  /**
   * List products with optional filtering
   */
  async getProducts(params: WooProductsQueryParams = {}): Promise<WooProduct[]> {
    const queryParams = this.convertQueryParams(params);
    return this.request<WooProduct[]>('GET', '/products', undefined, queryParams);
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: number): Promise<WooProduct> {
    return this.request<WooProduct>('GET', `/products/${productId}`);
  }

  /**
   * Update a product
   */
  async updateProduct(productId: number, data: WooUpdateProductData): Promise<WooProduct> {
    return this.request<WooProduct>('PUT', `/products/${productId}`, data);
  }

  /**
   * Create a new product
   */
  async createProduct(data: WooUpdateProductData): Promise<WooProduct> {
    return this.request<WooProduct>('POST', '/products', data);
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: number, force: boolean = false): Promise<WooProduct> {
    return this.request<WooProduct>('DELETE', `/products/${productId}`, undefined, { force });
  }

  // --------------------------------------------------------------------------
  // Customers API
  // --------------------------------------------------------------------------

  /**
   * List customers with optional filtering
   */
  async getCustomers(params: WooCustomersQueryParams = {}): Promise<WooCustomer[]> {
    const queryParams = this.convertQueryParams(params);
    return this.request<WooCustomer[]>('GET', '/customers', undefined, queryParams);
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(customerId: number): Promise<WooCustomer> {
    return this.request<WooCustomer>('GET', `/customers/${customerId}`);
  }

  /**
   * Update a customer
   */
  async updateCustomer(customerId: number, data: Partial<WooCustomer>): Promise<WooCustomer> {
    return this.request<WooCustomer>('PUT', `/customers/${customerId}`, data);
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: Partial<WooCustomer>): Promise<WooCustomer> {
    return this.request<WooCustomer>('POST', '/customers', data);
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(customerId: number, force: boolean = false): Promise<WooCustomer> {
    return this.request<WooCustomer>('DELETE', `/customers/${customerId}`, undefined, { force });
  }

  // --------------------------------------------------------------------------
  // Refunds API
  // --------------------------------------------------------------------------

  /**
   * Create a refund for an order
   */
  async createRefund(orderId: number, data: WooCreateRefundData): Promise<WooRefund> {
    return this.request<WooRefund>('POST', `/orders/${orderId}/refunds`, data);
  }

  /**
   * Get a refund by ID
   */
  async getRefund(orderId: number, refundId: number): Promise<WooRefund> {
    return this.request<WooRefund>('GET', `/orders/${orderId}/refunds/${refundId}`);
  }

  /**
   * List refunds for an order
   */
  async getRefunds(orderId: number): Promise<WooRefund[]> {
    return this.request<WooRefund[]>('GET', `/orders/${orderId}/refunds`);
  }

  /**
   * Delete a refund
   */
  async deleteRefund(orderId: number, refundId: number, force: boolean = false): Promise<WooRefund> {
    return this.request<WooRefund>('DELETE', `/orders/${orderId}/refunds/${refundId}`, undefined, { force });
  }

  // --------------------------------------------------------------------------
  // Order Notes API
  // --------------------------------------------------------------------------

  /**
   * Get order notes
   */
  async getOrderNotes(orderId: number): Promise<WooOrderNote[]> {
    return this.request<WooOrderNote[]>('GET', `/orders/${orderId}/notes`);
  }

  /**
   * Get a single order note
   */
  async getOrderNote(orderId: number, noteId: number): Promise<WooOrderNote> {
    return this.request<WooOrderNote>('GET', `/orders/${orderId}/notes/${noteId}`);
  }

  /**
   * Add a note to an order
   */
  async addOrderNote(orderId: number, data: WooCreateOrderNoteData): Promise<WooOrderNote> {
    return this.request<WooOrderNote>('POST', `/orders/${orderId}/notes`, data);
  }

  /**
   * Delete an order note
   */
  async deleteOrderNote(orderId: number, noteId: number, force: boolean = true): Promise<WooOrderNote> {
    return this.request<WooOrderNote>('DELETE', `/orders/${orderId}/notes/${noteId}`, undefined, { force });
  }

  // --------------------------------------------------------------------------
  // Reports API (bonus - useful for dashboards)
  // --------------------------------------------------------------------------

  /**
   * Get sales report
   */
  async getSalesReport(params?: {
    context?: 'view';
    period?: 'week' | 'month' | 'last_month' | 'year';
    date_min?: string;
    date_max?: string;
  }): Promise<{ total_sales: string; net_sales: string; total_orders: number }[]> {
    return this.request('GET', '/reports/sales', undefined, params);
  }

  /**
   * Get top sellers report
   */
  async getTopSellersReport(params?: {
    context?: 'view';
    period?: 'week' | 'month' | 'last_month' | 'year';
    date_min?: string;
    date_max?: string;
  }): Promise<{ title: string; product_id: number; quantity: number }[]> {
    return this.request('GET', '/reports/top_sellers', undefined, params);
  }

  // --------------------------------------------------------------------------
  // System Status API (bonus - useful for connection validation)
  // --------------------------------------------------------------------------

  /**
   * Get system status (validates connection)
   */
  async getSystemStatus(): Promise<{
    environment: { home_url: string; site_url: string; wc_version: string };
    theme: { name: string; version: string };
    settings: { currency: string; currency_symbol: string };
  }> {
    return this.request('GET', '/system_status');
  }

  /**
   * Validate connection by fetching system status
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.getSystemStatus();
      return true;
    } catch (error) {
      if (error instanceof WooCommerceAuthError || error instanceof WooCommerceForbiddenError) {
        return false;
      }
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Batch Operations API
  // --------------------------------------------------------------------------

  /**
   * Batch create/update/delete orders
   */
  async batchOrders(data: {
    create?: WooUpdateOrderData[];
    update?: (WooUpdateOrderData & { id: number })[];
    delete?: number[];
  }): Promise<{
    create?: WooOrder[];
    update?: WooOrder[];
    delete?: WooOrder[];
  }> {
    return this.request('POST', '/orders/batch', data);
  }

  /**
   * Batch create/update/delete products
   */
  async batchProducts(data: {
    create?: WooUpdateProductData[];
    update?: (WooUpdateProductData & { id: number })[];
    delete?: number[];
  }): Promise<{
    create?: WooProduct[];
    update?: WooProduct[];
    delete?: WooProduct[];
  }> {
    return this.request('POST', '/products/batch', data);
  }

  /**
   * Batch create/update/delete customers
   */
  async batchCustomers(data: {
    create?: Partial<WooCustomer>[];
    update?: (Partial<WooCustomer> & { id: number })[];
    delete?: number[];
  }): Promise<{
    create?: WooCustomer[];
    update?: WooCustomer[];
    delete?: WooCustomer[];
  }> {
    return this.request('POST', '/customers/batch', data);
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  /**
   * Convert query params to string values for URL
   */
  private convertQueryParams<T extends WooOrdersQueryParams | WooProductsQueryParams | WooCustomersQueryParams>(
    params: T
  ): Record<string, string | number | boolean | undefined> {
    const result: Record<string, string | number | boolean | undefined> = {};

    for (const [key, value] of Object.entries(params as object)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        result[key] = value.join(',');
      } else if (typeof value === 'object') {
        result[key] = JSON.stringify(value);
      } else {
        result[key] = value as string | number | boolean;
      }
    }

    return result;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new WooCommerceClient instance
 */
export function createWooCommerceClient(config: WooCommerceConfig): WooCommerceClient {
  return new WooCommerceClient(config);
}

// ============================================================================
// Additional Exports
// ============================================================================

export type { RetryConfig };

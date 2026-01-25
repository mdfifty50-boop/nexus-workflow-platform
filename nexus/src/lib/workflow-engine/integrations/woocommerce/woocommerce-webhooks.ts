/**
 * WooCommerce Webhook Handler
 * Loop 20 - E-commerce Integration
 *
 * This module provides WooCommerce-specific webhook handling that integrates
 * with the existing webhook infrastructure from Loop 18.
 *
 * Features:
 * - HMAC-SHA256 webhook verification (X-WC-Webhook-Signature)
 * - Event normalization to ProcessedWebhookEvent format
 * - Support for all major WooCommerce webhook topics
 * - Integration with WebhookReceiver source handlers
 *
 * WooCommerce webhooks deliver event notifications via HTTP POST with:
 * - X-WC-Webhook-Signature: Base64-encoded HMAC-SHA256 signature
 * - X-WC-Webhook-Topic: The webhook topic (e.g., "order.created")
 * - X-WC-Webhook-Resource: The resource type (e.g., "order")
 * - X-WC-Webhook-Event: The event type (e.g., "created")
 * - X-WC-Webhook-ID: Unique webhook ID
 * - X-WC-Webhook-Delivery-ID: Unique delivery attempt ID
 */

import {
  type ProcessedWebhookEvent,
  type WebhookPayload,
  type WebhookEventCategory,
} from "../../webhooks/webhook-receiver";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * WooCommerce webhook topics for Orders
 */
export type WooCommerceOrderTopic =
  | "order.created"
  | "order.updated"
  | "order.deleted"
  | "order.restored";

/**
 * WooCommerce webhook topics for Products
 */
export type WooCommerceProductTopic =
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "product.restored";

/**
 * WooCommerce webhook topics for Customers
 */
export type WooCommerceCustomerTopic =
  | "customer.created"
  | "customer.updated"
  | "customer.deleted";

/**
 * WooCommerce webhook topics for Coupons
 */
export type WooCommerceCouponTopic =
  | "coupon.created"
  | "coupon.updated"
  | "coupon.deleted"
  | "coupon.restored";

/**
 * All WooCommerce webhook topics
 */
export type WooCommerceWebhookTopic =
  | WooCommerceOrderTopic
  | WooCommerceProductTopic
  | WooCommerceCustomerTopic
  | WooCommerceCouponTopic
  | "action"; // Custom action webhooks

/**
 * WooCommerce normalized event categories
 */
export type WooCommerceEventCategory =
  | "commerce"
  | "inventory"
  | "customer"
  | "marketing";

/**
 * WooCommerce Order webhook payload
 */
export interface WooCommerceOrder {
  id: number;
  parent_id?: number;
  status: string;
  currency: string;
  version?: string;
  prices_include_tax?: boolean;
  date_created: string;
  date_created_gmt?: string;
  date_modified: string;
  date_modified_gmt?: string;
  discount_total?: string;
  discount_tax?: string;
  shipping_total?: string;
  shipping_tax?: string;
  cart_tax?: string;
  total: string;
  total_tax?: string;
  customer_id: number;
  order_key?: string;
  billing?: WooCommerceAddress;
  shipping?: WooCommerceAddress;
  payment_method?: string;
  payment_method_title?: string;
  transaction_id?: string;
  customer_ip_address?: string;
  customer_user_agent?: string;
  created_via?: string;
  customer_note?: string;
  date_completed?: string | null;
  date_completed_gmt?: string | null;
  date_paid?: string | null;
  date_paid_gmt?: string | null;
  cart_hash?: string;
  number?: string;
  line_items?: WooCommerceLineItem[];
  tax_lines?: WooCommerceTaxLine[];
  shipping_lines?: WooCommerceShippingLine[];
  fee_lines?: WooCommerceFee[];
  coupon_lines?: WooCommerceCouponLine[];
  refunds?: WooCommerceRefundSummary[];
  meta_data?: WooCommerceMetaData[];
  _links?: Record<string, unknown>;
}

/**
 * WooCommerce Customer webhook payload
 */
export interface WooCommerceCustomer {
  id: number;
  date_created: string;
  date_created_gmt?: string;
  date_modified: string;
  date_modified_gmt?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  username?: string;
  billing?: WooCommerceAddress;
  shipping?: WooCommerceAddress;
  is_paying_customer?: boolean;
  avatar_url?: string;
  meta_data?: WooCommerceMetaData[];
  _links?: Record<string, unknown>;
}

/**
 * WooCommerce Product webhook payload
 */
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink?: string;
  date_created: string;
  date_created_gmt?: string;
  date_modified: string;
  date_modified_gmt?: string;
  type?: string;
  status: string;
  featured?: boolean;
  catalog_visibility?: string;
  description?: string;
  short_description?: string;
  sku?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  date_on_sale_from?: string | null;
  date_on_sale_from_gmt?: string | null;
  date_on_sale_to?: string | null;
  date_on_sale_to_gmt?: string | null;
  on_sale?: boolean;
  purchasable?: boolean;
  total_sales?: number;
  virtual?: boolean;
  downloadable?: boolean;
  downloads?: WooCommerceDownload[];
  download_limit?: number;
  download_expiry?: number;
  external_url?: string;
  button_text?: string;
  tax_status?: string;
  tax_class?: string;
  manage_stock?: boolean;
  stock_quantity?: number | null;
  backorders?: string;
  backorders_allowed?: boolean;
  backordered?: boolean;
  low_stock_amount?: number | null;
  sold_individually?: boolean;
  weight?: string;
  dimensions?: WooCommerceDimensions;
  shipping_required?: boolean;
  shipping_taxable?: boolean;
  shipping_class?: string;
  shipping_class_id?: number;
  reviews_allowed?: boolean;
  average_rating?: string;
  rating_count?: number;
  upsell_ids?: number[];
  cross_sell_ids?: number[];
  parent_id?: number;
  purchase_note?: string;
  categories?: WooCommerceCategory[];
  tags?: WooCommerceTag[];
  images?: WooCommerceImage[];
  attributes?: WooCommerceAttribute[];
  default_attributes?: WooCommerceDefaultAttribute[];
  variations?: number[];
  grouped_products?: number[];
  menu_order?: number;
  related_ids?: number[];
  meta_data?: WooCommerceMetaData[];
  _links?: Record<string, unknown>;
}

/**
 * WooCommerce Coupon webhook payload
 */
export interface WooCommerceCoupon {
  id: number;
  code: string;
  amount: string;
  date_created: string;
  date_created_gmt?: string;
  date_modified: string;
  date_modified_gmt?: string;
  discount_type?: string;
  description?: string;
  date_expires?: string | null;
  date_expires_gmt?: string | null;
  usage_count?: number;
  individual_use?: boolean;
  product_ids?: number[];
  excluded_product_ids?: number[];
  usage_limit?: number | null;
  usage_limit_per_user?: number | null;
  limit_usage_to_x_items?: number | null;
  free_shipping?: boolean;
  product_categories?: number[];
  excluded_product_categories?: number[];
  exclude_sale_items?: boolean;
  minimum_amount?: string;
  maximum_amount?: string;
  email_restrictions?: string[];
  used_by?: string[];
  meta_data?: WooCommerceMetaData[];
  _links?: Record<string, unknown>;
}

/**
 * WooCommerce Line Item
 */
export interface WooCommerceLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id?: number;
  quantity: number;
  tax_class?: string;
  subtotal?: string;
  subtotal_tax?: string;
  total: string;
  total_tax?: string;
  taxes?: WooCommerceTax[];
  meta_data?: WooCommerceMetaData[];
  sku?: string;
  price?: number;
  image?: WooCommerceImage;
  parent_name?: string | null;
}

/**
 * WooCommerce Address
 */
export interface WooCommerceAddress {
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

/**
 * WooCommerce Tax Line
 */
export interface WooCommerceTaxLine {
  id: number;
  rate_code?: string;
  rate_id?: number;
  label?: string;
  compound?: boolean;
  tax_total?: string;
  shipping_tax_total?: string;
  rate_percent?: number;
  meta_data?: WooCommerceMetaData[];
}

/**
 * WooCommerce Tax
 */
export interface WooCommerceTax {
  id: number;
  total?: string;
  subtotal?: string;
}

/**
 * WooCommerce Shipping Line
 */
export interface WooCommerceShippingLine {
  id: number;
  method_title: string;
  method_id: string;
  instance_id?: string;
  total: string;
  total_tax?: string;
  taxes?: WooCommerceTax[];
  meta_data?: WooCommerceMetaData[];
}

/**
 * WooCommerce Fee
 */
export interface WooCommerceFee {
  id: number;
  name: string;
  tax_class?: string;
  tax_status?: string;
  amount?: string;
  total: string;
  total_tax?: string;
  taxes?: WooCommerceTax[];
  meta_data?: WooCommerceMetaData[];
}

/**
 * WooCommerce Coupon Line
 */
export interface WooCommerceCouponLine {
  id: number;
  code: string;
  discount: string;
  discount_tax?: string;
  meta_data?: WooCommerceMetaData[];
}

/**
 * WooCommerce Refund Summary
 */
export interface WooCommerceRefundSummary {
  id: number;
  reason?: string;
  total: string;
}

/**
 * WooCommerce Meta Data
 */
export interface WooCommerceMetaData {
  id: number;
  key: string;
  value: unknown;
}

/**
 * WooCommerce Download
 */
export interface WooCommerceDownload {
  id: string;
  name: string;
  file: string;
}

/**
 * WooCommerce Dimensions
 */
export interface WooCommerceDimensions {
  length?: string;
  width?: string;
  height?: string;
}

/**
 * WooCommerce Category
 */
export interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
}

/**
 * WooCommerce Tag
 */
export interface WooCommerceTag {
  id: number;
  name: string;
  slug: string;
}

/**
 * WooCommerce Image
 */
export interface WooCommerceImage {
  id: number;
  date_created?: string;
  date_created_gmt?: string;
  date_modified?: string;
  date_modified_gmt?: string;
  src: string;
  name?: string;
  alt?: string;
}

/**
 * WooCommerce Attribute
 */
export interface WooCommerceAttribute {
  id: number;
  name: string;
  position?: number;
  visible?: boolean;
  variation?: boolean;
  options?: string[];
}

/**
 * WooCommerce Default Attribute
 */
export interface WooCommerceDefaultAttribute {
  id: number;
  name: string;
  option: string;
}

/**
 * WooCommerce webhook request headers
 */
export interface WooCommerceWebhookHeaders {
  "x-wc-webhook-signature"?: string;
  "x-wc-webhook-topic"?: string;
  "x-wc-webhook-resource"?: string;
  "x-wc-webhook-event"?: string;
  "x-wc-webhook-id"?: string;
  "x-wc-webhook-delivery-id"?: string;
  "x-wc-webhook-source"?: string;
  "user-agent"?: string;
  "content-type"?: string;
  [key: string]: string | undefined;
}

/**
 * WooCommerce webhook request
 */
export interface WooCommerceWebhookRequest {
  headers: WooCommerceWebhookHeaders;
  body: string | Record<string, unknown>;
  rawBody?: string;
}

/**
 * WooCommerce webhook validation result
 */
export interface WooCommerceWebhookValidationResult {
  valid: boolean;
  error?: string;
  topic?: WooCommerceWebhookTopic;
  resource?: string;
  event?: string;
  webhookId?: string;
  deliveryId?: string;
  storeUrl?: string;
}

/**
 * Normalized WooCommerce event
 */
export interface NormalizedWooCommerceEvent {
  eventType: string;
  category: WooCommerceEventCategory;
  entityType: string;
  entityId: string;
  entityName?: string;
  timestamp: Date;
  payload: Record<string, unknown>;
  storeUrl: string;
  webhookId?: string;
  deliveryId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Topic to normalized event type mapping
 */
const TOPIC_EVENT_MAP: Record<WooCommerceWebhookTopic, string> = {
  // Orders
  "order.created": "order_created",
  "order.updated": "order_updated",
  "order.deleted": "order_deleted",
  "order.restored": "order_restored",
  // Products
  "product.created": "product_created",
  "product.updated": "product_updated",
  "product.deleted": "product_deleted",
  "product.restored": "product_restored",
  // Customers
  "customer.created": "customer_created",
  "customer.updated": "customer_updated",
  "customer.deleted": "customer_deleted",
  // Coupons
  "coupon.created": "coupon_created",
  "coupon.updated": "coupon_updated",
  "coupon.deleted": "coupon_deleted",
  "coupon.restored": "coupon_restored",
  // Custom actions
  "action": "custom_action",
};

/**
 * Topic to category mapping
 */
const TOPIC_CATEGORY_MAP: Record<WooCommerceWebhookTopic, WooCommerceEventCategory> = {
  // Orders - commerce
  "order.created": "commerce",
  "order.updated": "commerce",
  "order.deleted": "commerce",
  "order.restored": "commerce",
  // Products - inventory/commerce
  "product.created": "inventory",
  "product.updated": "inventory",
  "product.deleted": "inventory",
  "product.restored": "inventory",
  // Customers - customer
  "customer.created": "customer",
  "customer.updated": "customer",
  "customer.deleted": "customer",
  // Coupons - marketing
  "coupon.created": "marketing",
  "coupon.updated": "marketing",
  "coupon.deleted": "marketing",
  "coupon.restored": "marketing",
  // Custom actions - commerce
  "action": "commerce",
};

/**
 * Topic to entity type mapping
 */
const TOPIC_ENTITY_MAP: Record<WooCommerceWebhookTopic, string> = {
  // Orders
  "order.created": "order",
  "order.updated": "order",
  "order.deleted": "order",
  "order.restored": "order",
  // Products
  "product.created": "product",
  "product.updated": "product",
  "product.deleted": "product",
  "product.restored": "product",
  // Customers
  "customer.created": "customer",
  "customer.updated": "customer",
  "customer.deleted": "customer",
  // Coupons
  "coupon.created": "coupon",
  "coupon.updated": "coupon",
  "coupon.deleted": "coupon",
  "coupon.restored": "coupon",
  // Custom actions
  "action": "action",
};

// ============================================================================
// HMAC VERIFICATION
// ============================================================================

/**
 * Create HMAC-SHA256 signature using Web Crypto API (browser-compatible)
 * WooCommerce uses base64-encoded HMAC-SHA256 for signature verification
 */
async function createHmacSha256Base64(
  secret: string,
  message: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  const base64 = btoa(String.fromCharCode(...hashArray));

  return base64;
}

/**
 * Verify WooCommerce webhook HMAC signature
 * WooCommerce signs the payload with X-WC-Webhook-Signature header
 */
export async function verifyWooCommerceWebhookHmac(
  payload: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  try {
    const calculatedSignature = await createHmacSha256Base64(secret, payload);
    // Use timing-safe comparison to prevent timing attacks
    return calculatedSignature === signatureHeader;
  } catch (error) {
    console.error("[WooCommerceWebhooks] HMAC verification error:", error);
    return false;
  }
}

// ============================================================================
// WOOCOMMERCE WEBHOOK HANDLER CLASS
// ============================================================================

/**
 * WooCommerceWebhookHandler - Handles WooCommerce-specific webhook processing
 */
export class WooCommerceWebhookHandler {
  private secret: string;

  constructor(webhookSecret: string) {
    this.secret = webhookSecret;
  }

  /**
   * Validate WooCommerce webhook signature
   */
  async validateWebhook(
    payload: string,
    signature: string,
    secret?: string,
  ): Promise<boolean> {
    return verifyWooCommerceWebhookHmac(payload, signature, secret || this.secret);
  }

  /**
   * Extract webhook topic from headers
   */
  getWebhookTopic(headers: WooCommerceWebhookHeaders): WooCommerceWebhookTopic | null {
    const topic = headers["x-wc-webhook-topic"];
    if (!topic) return null;

    // Validate that it's a known topic
    if (topic in TOPIC_EVENT_MAP) {
      return topic as WooCommerceWebhookTopic;
    }

    // WooCommerce may also send topics in different formats
    // Try to normalize: "resource.event" format
    const resource = headers["x-wc-webhook-resource"];
    const event = headers["x-wc-webhook-event"];
    if (resource && event) {
      const normalizedTopic = `${resource}.${event}`;
      if (normalizedTopic in TOPIC_EVENT_MAP) {
        return normalizedTopic as WooCommerceWebhookTopic;
      }
    }

    console.warn(`[WooCommerceWebhooks] Unknown topic: ${topic}`);
    return null;
  }

  /**
   * Parse webhook payload and normalize to our event format
   */
  parseWebhook(
    topic: WooCommerceWebhookTopic,
    payload: Record<string, unknown>,
    storeUrl?: string,
    webhookId?: string,
    deliveryId?: string,
  ): NormalizedWooCommerceEvent {
    const eventType = TOPIC_EVENT_MAP[topic] || topic.replace(".", "_");
    const category = TOPIC_CATEGORY_MAP[topic] || "commerce";
    const entityType = TOPIC_ENTITY_MAP[topic] || "unknown";

    // Extract entity ID and name based on entity type
    const { entityId, entityName, timestamp } = this.extractEntityInfo(
      entityType,
      payload,
      topic,
    );

    return {
      eventType,
      category,
      entityType,
      entityId,
      entityName,
      timestamp,
      payload,
      storeUrl: storeUrl || "unknown",
      webhookId,
      deliveryId,
    };
  }

  /**
   * Extract entity information from payload
   */
  private extractEntityInfo(
    entityType: string,
    payload: Record<string, unknown>,
    _topic: WooCommerceWebhookTopic,
  ): { entityId: string; entityName?: string; timestamp: Date } {
    let entityId = "unknown";
    let entityName: string | undefined;
    let timestamp = new Date();

    switch (entityType) {
      case "order": {
        const order = payload as unknown as WooCommerceOrder;
        entityId = String(order.id);
        entityName = order.number || `#${order.id}`;
        timestamp = new Date(order.date_modified || order.date_created);
        break;
      }
      case "product": {
        const product = payload as unknown as WooCommerceProduct;
        entityId = String(product.id);
        entityName = product.name;
        timestamp = new Date(product.date_modified || product.date_created);
        break;
      }
      case "customer": {
        const customer = payload as unknown as WooCommerceCustomer;
        entityId = String(customer.id);
        entityName =
          [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
          customer.email;
        timestamp = new Date(customer.date_modified || customer.date_created);
        break;
      }
      case "coupon": {
        const coupon = payload as unknown as WooCommerceCoupon;
        entityId = String(coupon.id);
        entityName = coupon.code;
        timestamp = new Date(coupon.date_modified || coupon.date_created);
        break;
      }
      case "action": {
        // Custom action webhooks may have different structures
        entityId = String((payload as { id?: unknown }).id || "unknown");
        entityName = (payload as { action?: string }).action;
        timestamp = new Date();
        break;
      }
      default: {
        // Generic fallback
        entityId = String((payload as { id?: unknown }).id || "unknown");
        entityName =
          (payload as { name?: string; title?: string }).name ||
          (payload as { title?: string }).title;
        timestamp = new Date(
          (payload as { date_modified?: string; date_created?: string }).date_modified ||
            (payload as { date_created?: string }).date_created ||
            Date.now(),
        );
      }
    }

    return { entityId, entityName, timestamp };
  }

  /**
   * Full webhook processing - validate, parse, and convert to ProcessedWebhookEvent
   */
  async handleWebhook(request: WooCommerceWebhookRequest): Promise<{
    success: boolean;
    event?: ProcessedWebhookEvent;
    error?: string;
  }> {
    // Extract raw body for HMAC verification
    const rawBody =
      request.rawBody ||
      (typeof request.body === "string"
        ? request.body
        : JSON.stringify(request.body));

    // Get signature header
    const signatureHeader = request.headers["x-wc-webhook-signature"];
    if (!signatureHeader) {
      return {
        success: false,
        error: "Missing X-WC-Webhook-Signature header",
      };
    }

    // Validate HMAC signature
    const isValid = await this.validateWebhook(rawBody, signatureHeader);
    if (!isValid) {
      return {
        success: false,
        error: "Invalid webhook signature",
      };
    }

    // Get topic
    const topic = this.getWebhookTopic(request.headers);
    if (!topic) {
      return {
        success: false,
        error: "Missing or invalid X-WC-Webhook-Topic header",
      };
    }

    // Parse payload
    const payload =
      typeof request.body === "string"
        ? JSON.parse(request.body)
        : request.body;

    // Normalize event
    const normalizedEvent = this.parseWebhook(
      topic,
      payload as Record<string, unknown>,
      request.headers["x-wc-webhook-source"],
      request.headers["x-wc-webhook-id"],
      request.headers["x-wc-webhook-delivery-id"],
    );

    // Convert to ProcessedWebhookEvent
    const processedEvent = this.toProcessedWebhookEvent(
      normalizedEvent,
      request.headers,
    );

    return {
      success: true,
      event: processedEvent,
    };
  }

  /**
   * Convert normalized WooCommerce event to ProcessedWebhookEvent
   */
  private toProcessedWebhookEvent(
    event: NormalizedWooCommerceEvent,
    headers: WooCommerceWebhookHeaders,
  ): ProcessedWebhookEvent {
    // Map WooCommerce category to webhook category
    const categoryMap: Record<WooCommerceEventCategory, WebhookEventCategory> = {
      commerce: "operations",
      inventory: "operations",
      customer: "crm",
      marketing: "marketing",
    };

    const webhookPayload: WebhookPayload = {
      eventId: headers["x-wc-webhook-delivery-id"],
      eventType: event.eventType,
      timestamp: event.timestamp,
      entity: {
        type: event.entityType,
        id: event.entityId,
        name: event.entityName,
        storeUrl: event.storeUrl,
      },
      currentState: event.payload,
      metadata: {
        webhookId: event.webhookId,
        deliveryId: event.deliveryId,
        storeUrl: event.storeUrl,
        resource: headers["x-wc-webhook-resource"],
        webhookEvent: headers["x-wc-webhook-event"],
      },
    };

    // Generate unique ID
    const id = `woocommerce-${event.storeUrl}-${event.entityType}-${event.entityId}-${Date.now()}`;

    return {
      id,
      source: "custom" as const, // Use 'custom' since 'woocommerce' is not in WebhookSource
      category: categoryMap[event.category],
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      normalizedPayload: this.normalizePayloadFields(event),
      rawPayload: webhookPayload,
      receivedAt: new Date(),
      occurredAt: event.timestamp,
      status: "pending",
      attempts: 0,
      priority: this.determinePriority(event.eventType),
      tenantId: event.storeUrl, // Use store URL as tenant ID
    };
  }

  /**
   * Normalize payload fields for consistent access
   */
  private normalizePayloadFields(
    event: NormalizedWooCommerceEvent,
  ): Record<string, unknown> {
    const normalized: Record<string, unknown> = {
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      entityName: event.entityName,
      storeUrl: event.storeUrl,
      timestamp: event.timestamp.toISOString(),
    };

    // Add entity-specific normalized fields
    switch (event.entityType) {
      case "order": {
        const order = event.payload as unknown as WooCommerceOrder;
        normalized.orderNumber = order.number || String(order.id);
        normalized.totalPrice = order.total;
        normalized.currency = order.currency;
        normalized.status = order.status;
        normalized.customerId = order.customer_id;
        normalized.customerEmail = order.billing?.email;
        normalized.customerPhone = order.billing?.phone;
        normalized.paymentMethod = order.payment_method;
        normalized.paymentMethodTitle = order.payment_method_title;
        normalized.itemCount = order.line_items?.length || 0;
        normalized.shippingTotal = order.shipping_total;
        normalized.discountTotal = order.discount_total;
        normalized.datePaid = order.date_paid;
        normalized.dateCompleted = order.date_completed;
        normalized.customerNote = order.customer_note;
        normalized.billingAddress = order.billing;
        normalized.shippingAddress = order.shipping;
        break;
      }
      case "product": {
        const product = event.payload as unknown as WooCommerceProduct;
        normalized.name = product.name;
        normalized.slug = product.slug;
        normalized.type = product.type;
        normalized.status = product.status;
        normalized.sku = product.sku;
        normalized.price = product.price;
        normalized.regularPrice = product.regular_price;
        normalized.salePrice = product.sale_price;
        normalized.onSale = product.on_sale;
        normalized.stockQuantity = product.stock_quantity;
        normalized.stockStatus = product.manage_stock ?
          (product.stock_quantity && product.stock_quantity > 0 ? "instock" : "outofstock") :
          undefined;
        normalized.manageStock = product.manage_stock;
        normalized.featured = product.featured;
        normalized.virtual = product.virtual;
        normalized.downloadable = product.downloadable;
        normalized.categories = product.categories?.map(c => c.name);
        normalized.tags = product.tags?.map(t => t.name);
        normalized.variationCount = product.variations?.length || 0;
        normalized.totalSales = product.total_sales;
        break;
      }
      case "customer": {
        const customer = event.payload as unknown as WooCommerceCustomer;
        normalized.email = customer.email;
        normalized.firstName = customer.first_name;
        normalized.lastName = customer.last_name;
        normalized.username = customer.username;
        normalized.role = customer.role;
        normalized.isPayingCustomer = customer.is_paying_customer;
        normalized.billingAddress = customer.billing;
        normalized.shippingAddress = customer.shipping;
        break;
      }
      case "coupon": {
        const coupon = event.payload as unknown as WooCommerceCoupon;
        normalized.code = coupon.code;
        normalized.amount = coupon.amount;
        normalized.discountType = coupon.discount_type;
        normalized.description = coupon.description;
        normalized.dateExpires = coupon.date_expires;
        normalized.usageCount = coupon.usage_count;
        normalized.usageLimit = coupon.usage_limit;
        normalized.usageLimitPerUser = coupon.usage_limit_per_user;
        normalized.freeShipping = coupon.free_shipping;
        normalized.minimumAmount = coupon.minimum_amount;
        normalized.maximumAmount = coupon.maximum_amount;
        normalized.individualUse = coupon.individual_use;
        normalized.excludeSaleItems = coupon.exclude_sale_items;
        break;
      }
    }

    return normalized;
  }

  /**
   * Determine event priority based on type
   */
  private determinePriority(
    eventType: string,
  ): "immediate" | "high" | "normal" | "low" {
    const immediatePriority = ["order_created"];
    const highPriority = [
      "order_updated",
      "customer_created",
      "product_updated",
    ];
    const lowPriority = ["coupon_created", "coupon_updated", "order_restored", "product_restored"];

    if (immediatePriority.includes(eventType)) return "immediate";
    if (highPriority.includes(eventType)) return "high";
    if (lowPriority.includes(eventType)) return "low";
    return "normal";
  }

  /**
   * Update the webhook secret
   */
  setSecret(secret: string): void {
    this.secret = secret;
  }
}

// ============================================================================
// FACTORY & EXPORTS FOR WEBHOOK RECEIVER INTEGRATION
// ============================================================================

/**
 * Create a new WooCommerce webhook handler
 */
export function createWooCommerceWebhookHandler(
  secret: string,
): WooCommerceWebhookHandler {
  return new WooCommerceWebhookHandler(secret);
}

/**
 * Default handler instance (requires initialization with setSecret)
 */
let defaultHandler: WooCommerceWebhookHandler | null = null;

/**
 * Initialize the default WooCommerce webhook handler
 */
export function initializeWooCommerceWebhooks(
  secret: string,
): WooCommerceWebhookHandler {
  defaultHandler = new WooCommerceWebhookHandler(secret);
  return defaultHandler;
}

/**
 * Get the default handler
 */
export function getWooCommerceWebhookHandler(): WooCommerceWebhookHandler | null {
  return defaultHandler;
}

/**
 * Process a WooCommerce webhook using the default handler
 */
export async function processWooCommerceWebhook(
  request: WooCommerceWebhookRequest,
): Promise<{
  success: boolean;
  event?: ProcessedWebhookEvent;
  error?: string;
}> {
  if (!defaultHandler) {
    return {
      success: false,
      error:
        "WooCommerce webhook handler not initialized. Call initializeWooCommerceWebhooks first.",
    };
  }
  return defaultHandler.handleWebhook(request);
}

/**
 * Register WooCommerce as a source with the WebhookReceiver
 * This function returns the configuration that can be used with webhookReceiver.enableSource()
 */
export function getWooCommerceSourceConfig(secret: string) {
  return {
    displayName: "WooCommerce",
    enabled: true,
    authMethod: "signature" as const,
    signatureHeader: "x-wc-webhook-signature",
    signatureAlgorithm: "sha256" as const,
    secret,
    eventTypeMapping: TOPIC_EVENT_MAP,
    entityTypeMapping: TOPIC_ENTITY_MAP,
    fieldMapping: {
      // Order fields
      id: "id",
      number: "orderNumber",
      total: "totalPrice",
      currency: "currency",
      status: "status",
      customer_id: "customerId",
      payment_method: "paymentMethod",
      payment_method_title: "paymentMethodTitle",
      shipping_total: "shippingTotal",
      discount_total: "discountTotal",
      date_paid: "datePaid",
      date_completed: "dateCompleted",
      customer_note: "customerNote",
      // Product fields
      name: "name",
      slug: "slug",
      type: "type",
      sku: "sku",
      price: "price",
      regular_price: "regularPrice",
      sale_price: "salePrice",
      on_sale: "onSale",
      stock_quantity: "stockQuantity",
      manage_stock: "manageStock",
      featured: "featured",
      virtual: "virtual",
      downloadable: "downloadable",
      total_sales: "totalSales",
      // Customer fields
      email: "email",
      first_name: "firstName",
      last_name: "lastName",
      username: "username",
      role: "role",
      is_paying_customer: "isPayingCustomer",
      // Coupon fields
      code: "code",
      amount: "amount",
      discount_type: "discountType",
      description: "description",
      date_expires: "dateExpires",
      usage_count: "usageCount",
      usage_limit: "usageLimit",
      usage_limit_per_user: "usageLimitPerUser",
      free_shipping: "freeShipping",
      minimum_amount: "minimumAmount",
      maximum_amount: "maximumAmount",
    },
    rateLimit: {
      maxPerMinute: 120,
      maxPerHour: 3600,
    },
  };
}

/**
 * Get all supported WooCommerce webhook topics
 */
export function getSupportedWooCommerceTopics(): WooCommerceWebhookTopic[] {
  return Object.keys(TOPIC_EVENT_MAP) as WooCommerceWebhookTopic[];
}

/**
 * Check if a topic is supported
 */
export function isWooCommerceTopicSupported(
  topic: string,
): topic is WooCommerceWebhookTopic {
  return topic in TOPIC_EVENT_MAP;
}

/**
 * Get the normalized event type for a WooCommerce topic
 */
export function getWooCommerceEventType(topic: WooCommerceWebhookTopic): string {
  return TOPIC_EVENT_MAP[topic] || topic.replace(".", "_");
}

/**
 * Get the category for a WooCommerce topic
 */
export function getWooCommerceEventCategory(
  topic: WooCommerceWebhookTopic,
): WooCommerceEventCategory {
  return TOPIC_CATEGORY_MAP[topic] || "commerce";
}

/**
 * Get the entity type for a WooCommerce topic
 */
export function getWooCommerceEntityType(topic: WooCommerceWebhookTopic): string {
  return TOPIC_ENTITY_MAP[topic] || "unknown";
}

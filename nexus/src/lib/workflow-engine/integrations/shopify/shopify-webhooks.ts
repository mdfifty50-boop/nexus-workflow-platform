/**
 * Shopify Webhook Handler
 * Loop 19 - E-commerce Integration
 *
 * This module provides Shopify-specific webhook handling that integrates
 * with the existing webhook infrastructure from Loop 18.
 *
 * Features:
 * - HMAC-SHA256 webhook verification
 * - Event normalization to ProcessedWebhookEvent format
 * - Support for all major Shopify webhook topics
 * - Integration with WebhookReceiver source handlers
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
 * Shopify webhook topics for Orders
 */
export type ShopifyOrderTopic =
  | "orders/create"
  | "orders/updated"
  | "orders/paid"
  | "orders/fulfilled"
  | "orders/cancelled"
  | "orders/partially_fulfilled"
  | "orders/deleted";

/**
 * Shopify webhook topics for Products
 */
export type ShopifyProductTopic =
  | "products/create"
  | "products/update"
  | "products/delete";

/**
 * Shopify webhook topics for Customers
 */
export type ShopifyCustomerTopic =
  | "customers/create"
  | "customers/update"
  | "customers/delete"
  | "customers/enable"
  | "customers/disable";

/**
 * Shopify webhook topics for Inventory
 */
export type ShopifyInventoryTopic =
  | "inventory_levels/connect"
  | "inventory_levels/update"
  | "inventory_levels/disconnect"
  | "inventory_items/create"
  | "inventory_items/update"
  | "inventory_items/delete";

/**
 * Shopify webhook topics for Fulfillments
 */
export type ShopifyFulfillmentTopic =
  | "fulfillments/create"
  | "fulfillments/update";

/**
 * Shopify webhook topics for Carts and Checkouts
 */
export type ShopifyCartTopic =
  | "carts/create"
  | "carts/update"
  | "checkouts/create"
  | "checkouts/update"
  | "checkouts/delete";

/**
 * Shopify webhook topics for Refunds
 */
export type ShopifyRefundTopic = "refunds/create";

/**
 * Shopify webhook topics for Collections
 */
export type ShopifyCollectionTopic =
  | "collections/create"
  | "collections/update"
  | "collections/delete";

/**
 * All Shopify webhook topics
 */
export type ShopifyWebhookTopic =
  | ShopifyOrderTopic
  | ShopifyProductTopic
  | ShopifyCustomerTopic
  | ShopifyInventoryTopic
  | ShopifyFulfillmentTopic
  | ShopifyCartTopic
  | ShopifyRefundTopic
  | ShopifyCollectionTopic
  | "app/uninstalled"
  | "shop/update";

/**
 * Shopify normalized event categories
 */
export type ShopifyEventCategory =
  | "commerce"
  | "inventory"
  | "customer"
  | "shop";

/**
 * Shopify Order webhook payload (subset of fields for webhook processing)
 * Note: These types are prefixed with 'Webhook' to avoid conflicts with shopify-client.ts types
 */
export interface WebhookShopifyOrder {
  id: number;
  admin_graphql_api_id?: string;
  browser_ip?: string;
  buyer_accepts_marketing?: boolean;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  cart_token?: string;
  checkout_id?: number;
  checkout_token?: string;
  confirmed?: boolean;
  contact_email?: string;
  created_at: string;
  currency: string;
  current_subtotal_price?: string;
  current_total_discounts?: string;
  current_total_price?: string;
  current_total_tax?: string;
  customer?: WebhookShopifyCustomer;
  email?: string;
  financial_status?: string;
  fulfillment_status?: string | null;
  name: string;
  note?: string | null;
  number: number;
  order_number: number;
  phone?: string;
  processed_at?: string;
  source_name?: string;
  subtotal_price?: string;
  tags?: string;
  total_discounts?: string;
  total_line_items_price?: string;
  total_price: string;
  total_tax?: string;
  total_weight?: number;
  updated_at: string;
  line_items?: WebhookShopifyLineItem[];
  shipping_address?: WebhookShopifyAddress;
  billing_address?: WebhookShopifyAddress;
  fulfillments?: WebhookShopifyFulfillment[];
  refunds?: WebhookShopifyRefund[];
}

/**
 * Shopify Customer webhook payload
 */
export interface WebhookShopifyCustomer {
  id: number;
  admin_graphql_api_id?: string;
  created_at: string;
  updated_at: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  verified_email?: boolean;
  total_spent?: string;
  orders_count?: number;
  state?: string;
  tags?: string;
  currency?: string;
  accepts_marketing?: boolean;
  default_address?: WebhookShopifyAddress;
}

/**
 * Shopify Product webhook payload
 */
export interface WebhookShopifyProduct {
  id: number;
  admin_graphql_api_id?: string;
  body_html?: string;
  created_at: string;
  handle: string;
  product_type?: string;
  published_at?: string | null;
  published_scope?: string;
  status: string;
  tags?: string;
  template_suffix?: string | null;
  title: string;
  updated_at: string;
  vendor?: string;
  variants?: WebhookShopifyVariant[];
  images?: WebhookShopifyImage[];
}

/**
 * Shopify Variant webhook payload
 */
export interface WebhookShopifyVariant {
  id: number;
  admin_graphql_api_id?: string;
  barcode?: string;
  compare_at_price?: string | null;
  created_at: string;
  fulfillment_service?: string;
  grams?: number;
  inventory_item_id?: number;
  inventory_management?: string;
  inventory_policy?: string;
  inventory_quantity?: number;
  option1?: string;
  option2?: string | null;
  option3?: string | null;
  price: string;
  product_id: number;
  sku?: string;
  taxable?: boolean;
  title: string;
  updated_at: string;
  weight?: number;
  weight_unit?: string;
}

/**
 * Shopify Inventory Level webhook payload
 */
export interface WebhookShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available?: number | null;
  updated_at: string;
  admin_graphql_api_id?: string;
}

/**
 * Shopify Inventory Item webhook payload
 */
export interface WebhookShopifyInventoryItem {
  id: number;
  admin_graphql_api_id?: string;
  cost?: string | null;
  country_code_of_origin?: string | null;
  created_at: string;
  harmonized_system_code?: string | null;
  province_code_of_origin?: string | null;
  sku?: string;
  tracked?: boolean;
  updated_at: string;
  requires_shipping?: boolean;
}

/**
 * Shopify Fulfillment webhook payload
 */
export interface WebhookShopifyFulfillment {
  id: number;
  admin_graphql_api_id?: string;
  created_at: string;
  location_id?: number;
  name?: string;
  order_id: number;
  receipt?: Record<string, unknown>;
  service?: string;
  shipment_status?: string | null;
  status: string;
  tracking_company?: string | null;
  tracking_number?: string | null;
  tracking_numbers?: string[];
  tracking_url?: string | null;
  tracking_urls?: string[];
  updated_at: string;
  line_items?: WebhookShopifyLineItem[];
}

/**
 * Shopify Line Item webhook payload
 */
export interface WebhookShopifyLineItem {
  id: number;
  admin_graphql_api_id?: string;
  fulfillable_quantity?: number;
  fulfillment_service?: string;
  fulfillment_status?: string | null;
  gift_card?: boolean;
  grams?: number;
  name: string;
  price: string;
  product_id?: number;
  quantity: number;
  sku?: string;
  taxable?: boolean;
  title: string;
  variant_id?: number;
  variant_title?: string;
  vendor?: string;
}

/**
 * Shopify Address webhook payload
 */
export interface WebhookShopifyAddress {
  address1?: string;
  address2?: string;
  city?: string;
  company?: string | null;
  country?: string;
  country_code?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  phone?: string;
  province?: string;
  province_code?: string;
  zip?: string;
}

/**
 * Shopify Refund webhook payload
 */
export interface WebhookShopifyRefund {
  id: number;
  admin_graphql_api_id?: string;
  created_at: string;
  note?: string;
  order_id: number;
  processed_at?: string;
  restock?: boolean;
  user_id?: number;
  refund_line_items?: Array<{
    id: number;
    line_item_id: number;
    location_id?: number;
    quantity: number;
    restock_type?: string;
    subtotal?: string;
    total_tax?: string;
  }>;
}

/**
 * Shopify Image webhook payload
 */
export interface WebhookShopifyImage {
  id: number;
  admin_graphql_api_id?: string;
  alt?: string | null;
  created_at: string;
  height?: number;
  position?: number;
  product_id: number;
  src: string;
  updated_at: string;
  width?: number;
  variant_ids?: number[];
}

/**
 * Shopify webhook request headers
 */
export interface ShopifyWebhookHeaders {
  "x-shopify-topic"?: string;
  "x-shopify-shop-domain"?: string;
  "x-shopify-api-version"?: string;
  "x-shopify-hmac-sha256"?: string;
  "x-shopify-webhook-id"?: string;
  "x-shopify-triggered-at"?: string;
  [key: string]: string | undefined;
}

/**
 * Shopify webhook request
 */
export interface ShopifyWebhookRequest {
  headers: ShopifyWebhookHeaders;
  body: string | Record<string, unknown>;
  rawBody?: string;
}

/**
 * Shopify webhook validation result
 */
export interface ShopifyWebhookValidationResult {
  valid: boolean;
  error?: string;
  topic?: ShopifyWebhookTopic;
  shopDomain?: string;
  webhookId?: string;
}

/**
 * Normalized Shopify event
 */
export interface NormalizedShopifyEvent {
  eventType: string;
  category: ShopifyEventCategory;
  entityType: string;
  entityId: string;
  entityName?: string;
  timestamp: Date;
  payload: Record<string, unknown>;
  shopDomain: string;
  apiVersion?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Topic to normalized event type mapping
 */
const TOPIC_EVENT_MAP: Record<ShopifyWebhookTopic, string> = {
  // Orders
  "orders/create": "order_created",
  "orders/updated": "order_updated",
  "orders/paid": "order_paid",
  "orders/fulfilled": "order_fulfilled",
  "orders/cancelled": "order_cancelled",
  "orders/partially_fulfilled": "order_partially_fulfilled",
  "orders/deleted": "order_deleted",
  // Products
  "products/create": "product_created",
  "products/update": "product_updated",
  "products/delete": "product_deleted",
  // Customers
  "customers/create": "customer_created",
  "customers/update": "customer_updated",
  "customers/delete": "customer_deleted",
  "customers/enable": "customer_enabled",
  "customers/disable": "customer_disabled",
  // Inventory
  "inventory_levels/connect": "inventory_level_connected",
  "inventory_levels/update": "inventory_level_updated",
  "inventory_levels/disconnect": "inventory_level_disconnected",
  "inventory_items/create": "inventory_item_created",
  "inventory_items/update": "inventory_item_updated",
  "inventory_items/delete": "inventory_item_deleted",
  // Fulfillments
  "fulfillments/create": "fulfillment_created",
  "fulfillments/update": "fulfillment_updated",
  // Carts and Checkouts
  "carts/create": "cart_created",
  "carts/update": "cart_updated",
  "checkouts/create": "checkout_created",
  "checkouts/update": "checkout_updated",
  "checkouts/delete": "checkout_deleted",
  // Refunds
  "refunds/create": "refund_created",
  // Collections
  "collections/create": "collection_created",
  "collections/update": "collection_updated",
  "collections/delete": "collection_deleted",
  // App and Shop
  "app/uninstalled": "app_uninstalled",
  "shop/update": "shop_updated",
};

/**
 * Topic to category mapping
 */
const TOPIC_CATEGORY_MAP: Record<ShopifyWebhookTopic, ShopifyEventCategory> = {
  // Orders - commerce
  "orders/create": "commerce",
  "orders/updated": "commerce",
  "orders/paid": "commerce",
  "orders/fulfilled": "commerce",
  "orders/cancelled": "commerce",
  "orders/partially_fulfilled": "commerce",
  "orders/deleted": "commerce",
  // Products - commerce
  "products/create": "commerce",
  "products/update": "commerce",
  "products/delete": "commerce",
  // Customers - customer
  "customers/create": "customer",
  "customers/update": "customer",
  "customers/delete": "customer",
  "customers/enable": "customer",
  "customers/disable": "customer",
  // Inventory - inventory
  "inventory_levels/connect": "inventory",
  "inventory_levels/update": "inventory",
  "inventory_levels/disconnect": "inventory",
  "inventory_items/create": "inventory",
  "inventory_items/update": "inventory",
  "inventory_items/delete": "inventory",
  // Fulfillments - commerce
  "fulfillments/create": "commerce",
  "fulfillments/update": "commerce",
  // Carts and Checkouts - commerce
  "carts/create": "commerce",
  "carts/update": "commerce",
  "checkouts/create": "commerce",
  "checkouts/update": "commerce",
  "checkouts/delete": "commerce",
  // Refunds - commerce
  "refunds/create": "commerce",
  // Collections - commerce
  "collections/create": "commerce",
  "collections/update": "commerce",
  "collections/delete": "commerce",
  // App and Shop - shop
  "app/uninstalled": "shop",
  "shop/update": "shop",
};

/**
 * Topic to entity type mapping
 */
const TOPIC_ENTITY_MAP: Record<ShopifyWebhookTopic, string> = {
  // Orders
  "orders/create": "order",
  "orders/updated": "order",
  "orders/paid": "order",
  "orders/fulfilled": "order",
  "orders/cancelled": "order",
  "orders/partially_fulfilled": "order",
  "orders/deleted": "order",
  // Products
  "products/create": "product",
  "products/update": "product",
  "products/delete": "product",
  // Customers
  "customers/create": "customer",
  "customers/update": "customer",
  "customers/delete": "customer",
  "customers/enable": "customer",
  "customers/disable": "customer",
  // Inventory
  "inventory_levels/connect": "inventory_level",
  "inventory_levels/update": "inventory_level",
  "inventory_levels/disconnect": "inventory_level",
  "inventory_items/create": "inventory_item",
  "inventory_items/update": "inventory_item",
  "inventory_items/delete": "inventory_item",
  // Fulfillments
  "fulfillments/create": "fulfillment",
  "fulfillments/update": "fulfillment",
  // Carts and Checkouts
  "carts/create": "cart",
  "carts/update": "cart",
  "checkouts/create": "checkout",
  "checkouts/update": "checkout",
  "checkouts/delete": "checkout",
  // Refunds
  "refunds/create": "refund",
  // Collections
  "collections/create": "collection",
  "collections/update": "collection",
  "collections/delete": "collection",
  // App and Shop
  "app/uninstalled": "app",
  "shop/update": "shop",
};

// ============================================================================
// HMAC VERIFICATION
// ============================================================================

/**
 * Create HMAC-SHA256 signature using Web Crypto API (browser-compatible)
 */
async function createHmacSha256(
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
 * Verify Shopify webhook HMAC signature
 */
export async function verifyShopifyWebhookHmac(
  payload: string,
  hmacHeader: string,
  secret: string,
): Promise<boolean> {
  try {
    const calculatedHmac = await createHmacSha256(secret, payload);
    return calculatedHmac === hmacHeader;
  } catch (error) {
    console.error("[ShopifyWebhooks] HMAC verification error:", error);
    return false;
  }
}

// ============================================================================
// SHOPIFY WEBHOOK HANDLER CLASS
// ============================================================================

/**
 * ShopifyWebhookHandler - Handles Shopify-specific webhook processing
 */
export class ShopifyWebhookHandler {
  private secret: string;

  constructor(webhookSecret: string) {
    this.secret = webhookSecret;
  }

  /**
   * Validate Shopify webhook request
   */
  async validateWebhook(
    payload: string,
    hmacHeader: string,
    secret?: string,
  ): Promise<boolean> {
    return verifyShopifyWebhookHmac(payload, hmacHeader, secret || this.secret);
  }

  /**
   * Extract webhook topic from headers
   */
  getWebhookTopic(headers: ShopifyWebhookHeaders): ShopifyWebhookTopic | null {
    const topic = headers["x-shopify-topic"];
    if (!topic) return null;

    // Validate that it's a known topic
    if (topic in TOPIC_EVENT_MAP) {
      return topic as ShopifyWebhookTopic;
    }

    console.warn(`[ShopifyWebhooks] Unknown topic: ${topic}`);
    return null;
  }

  /**
   * Parse webhook payload and normalize to our event format
   */
  parseWebhook(
    topic: ShopifyWebhookTopic,
    payload: Record<string, unknown>,
    shopDomain?: string,
    apiVersion?: string,
  ): NormalizedShopifyEvent {
    const eventType = TOPIC_EVENT_MAP[topic] || topic.replace("/", "_");
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
      shopDomain: shopDomain || "unknown",
      apiVersion,
    };
  }

  /**
   * Extract entity information from payload
   */
  private extractEntityInfo(
    entityType: string,
    payload: Record<string, unknown>,
    _topic: ShopifyWebhookTopic,
  ): { entityId: string; entityName?: string; timestamp: Date } {
    let entityId = "unknown";
    let entityName: string | undefined;
    let timestamp = new Date();

    switch (entityType) {
      case "order": {
        const order = payload as unknown as WebhookShopifyOrder;
        entityId = String(order.id);
        entityName = order.name;
        timestamp = new Date(order.updated_at || order.created_at);
        break;
      }
      case "product": {
        const product = payload as unknown as WebhookShopifyProduct;
        entityId = String(product.id);
        entityName = product.title;
        timestamp = new Date(product.updated_at || product.created_at);
        break;
      }
      case "customer": {
        const customer = payload as unknown as WebhookShopifyCustomer;
        entityId = String(customer.id);
        entityName =
          [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
          customer.email;
        timestamp = new Date(customer.updated_at || customer.created_at);
        break;
      }
      case "inventory_level": {
        const level = payload as unknown as WebhookShopifyInventoryLevel;
        entityId = `${level.inventory_item_id}-${level.location_id}`;
        timestamp = new Date(level.updated_at);
        break;
      }
      case "inventory_item": {
        const item = payload as unknown as WebhookShopifyInventoryItem;
        entityId = String(item.id);
        entityName = item.sku;
        timestamp = new Date(item.updated_at || item.created_at);
        break;
      }
      case "fulfillment": {
        const fulfillment = payload as unknown as WebhookShopifyFulfillment;
        entityId = String(fulfillment.id);
        entityName = fulfillment.name;
        timestamp = new Date(fulfillment.updated_at || fulfillment.created_at);
        break;
      }
      case "refund": {
        const refund = payload as unknown as WebhookShopifyRefund;
        entityId = String(refund.id);
        timestamp = new Date(refund.created_at);
        break;
      }
      case "cart":
      case "checkout": {
        // Carts and checkouts have token-based IDs
        entityId = String(
          (payload as { id?: number; token?: string }).id ||
            (payload as { token?: string }).token ||
            "unknown",
        );
        timestamp = new Date(
          (payload as { updated_at?: string; created_at?: string })
            .updated_at ||
            (payload as { created_at?: string }).created_at ||
            Date.now(),
        );
        break;
      }
      case "collection": {
        entityId = String((payload as { id: number }).id);
        entityName = (payload as { title?: string }).title;
        timestamp = new Date(
          (payload as { updated_at?: string; published_at?: string })
            .updated_at ||
            (payload as { published_at?: string }).published_at ||
            Date.now(),
        );
        break;
      }
      case "app":
      case "shop": {
        entityId =
          (payload as { id?: number; myshopify_domain?: string })
            .myshopify_domain ||
          String((payload as { id?: number }).id || "unknown");
        entityName = (payload as { name?: string }).name;
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
          (payload as { updated_at?: string; created_at?: string })
            .updated_at ||
            (payload as { created_at?: string }).created_at ||
            Date.now(),
        );
      }
    }

    return { entityId, entityName, timestamp };
  }

  /**
   * Full webhook processing - validate, parse, and convert to ProcessedWebhookEvent
   */
  async handleWebhook(request: ShopifyWebhookRequest): Promise<{
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

    // Get HMAC header
    const hmacHeader = request.headers["x-shopify-hmac-sha256"];
    if (!hmacHeader) {
      return {
        success: false,
        error: "Missing X-Shopify-Hmac-SHA256 header",
      };
    }

    // Validate HMAC
    const isValid = await this.validateWebhook(rawBody, hmacHeader);
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
        error: "Missing or invalid X-Shopify-Topic header",
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
      request.headers["x-shopify-shop-domain"],
      request.headers["x-shopify-api-version"],
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
   * Convert normalized Shopify event to ProcessedWebhookEvent
   */
  private toProcessedWebhookEvent(
    event: NormalizedShopifyEvent,
    headers: ShopifyWebhookHeaders,
  ): ProcessedWebhookEvent {
    // Map Shopify category to webhook category
    const categoryMap: Record<ShopifyEventCategory, WebhookEventCategory> = {
      commerce: "operations",
      inventory: "operations",
      customer: "crm",
      shop: "operations",
    };

    const webhookPayload: WebhookPayload = {
      eventId: headers["x-shopify-webhook-id"],
      eventType: event.eventType,
      timestamp: event.timestamp,
      entity: {
        type: event.entityType,
        id: event.entityId,
        name: event.entityName,
        shopDomain: event.shopDomain,
      },
      currentState: event.payload,
      metadata: {
        shopifyApiVersion: event.apiVersion,
        shopDomain: event.shopDomain,
        triggeredAt: headers["x-shopify-triggered-at"],
      },
    };

    // Generate unique ID
    const id = `shopify-${event.shopDomain}-${event.entityType}-${event.entityId}-${Date.now()}`;

    return {
      id,
      source: "custom" as const, // Use 'custom' since 'shopify' is not in WebhookSource
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
      tenantId: event.shopDomain, // Use shop domain as tenant ID
    };
  }

  /**
   * Normalize payload fields for consistent access
   */
  private normalizePayloadFields(
    event: NormalizedShopifyEvent,
  ): Record<string, unknown> {
    const normalized: Record<string, unknown> = {
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      entityName: event.entityName,
      shopDomain: event.shopDomain,
      timestamp: event.timestamp.toISOString(),
    };

    // Add entity-specific normalized fields
    switch (event.entityType) {
      case "order": {
        const order = event.payload as unknown as WebhookShopifyOrder;
        normalized.orderNumber = order.order_number;
        normalized.totalPrice = order.total_price;
        normalized.currency = order.currency;
        normalized.financialStatus = order.financial_status;
        normalized.fulfillmentStatus = order.fulfillment_status;
        normalized.customerEmail = order.email || order.contact_email;
        normalized.itemCount = order.line_items?.length || 0;
        break;
      }
      case "product": {
        const product = event.payload as unknown as WebhookShopifyProduct;
        normalized.title = product.title;
        normalized.handle = product.handle;
        normalized.status = product.status;
        normalized.vendor = product.vendor;
        normalized.productType = product.product_type;
        normalized.variantCount = product.variants?.length || 0;
        break;
      }
      case "customer": {
        const customer = event.payload as unknown as WebhookShopifyCustomer;
        normalized.email = customer.email;
        normalized.firstName = customer.first_name;
        normalized.lastName = customer.last_name;
        normalized.phone = customer.phone;
        normalized.totalSpent = customer.total_spent;
        normalized.ordersCount = customer.orders_count;
        normalized.acceptsMarketing = customer.accepts_marketing;
        break;
      }
      case "inventory_level": {
        const level = event.payload as unknown as WebhookShopifyInventoryLevel;
        normalized.inventoryItemId = level.inventory_item_id;
        normalized.locationId = level.location_id;
        normalized.available = level.available;
        break;
      }
      case "inventory_item": {
        const item = event.payload as unknown as WebhookShopifyInventoryItem;
        normalized.sku = item.sku;
        normalized.cost = item.cost;
        normalized.tracked = item.tracked;
        normalized.requiresShipping = item.requires_shipping;
        break;
      }
      case "fulfillment": {
        const fulfillment =
          event.payload as unknown as WebhookShopifyFulfillment;
        normalized.orderId = fulfillment.order_id;
        normalized.status = fulfillment.status;
        normalized.trackingCompany = fulfillment.tracking_company;
        normalized.trackingNumber = fulfillment.tracking_number;
        normalized.trackingUrl = fulfillment.tracking_url;
        normalized.shipmentStatus = fulfillment.shipment_status;
        break;
      }
      case "refund": {
        const refund = event.payload as unknown as WebhookShopifyRefund;
        normalized.orderId = refund.order_id;
        normalized.note = refund.note;
        normalized.restock = refund.restock;
        normalized.lineItemCount = refund.refund_line_items?.length || 0;
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
    const immediatePriority = ["order_paid", "order_created", "refund_created"];
    const highPriority = [
      "order_cancelled",
      "order_fulfilled",
      "inventory_level_updated",
      "customer_created",
    ];
    const lowPriority = ["cart_updated", "checkout_updated", "shop_updated"];

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
 * Create a new Shopify webhook handler
 */
export function createShopifyWebhookHandler(
  secret: string,
): ShopifyWebhookHandler {
  return new ShopifyWebhookHandler(secret);
}

/**
 * Default handler instance (requires initialization with setSecret)
 */
let defaultHandler: ShopifyWebhookHandler | null = null;

/**
 * Initialize the default Shopify webhook handler
 */
export function initializeShopifyWebhooks(
  secret: string,
): ShopifyWebhookHandler {
  defaultHandler = new ShopifyWebhookHandler(secret);
  return defaultHandler;
}

/**
 * Get the default handler
 */
export function getShopifyWebhookHandler(): ShopifyWebhookHandler | null {
  return defaultHandler;
}

/**
 * Process a Shopify webhook using the default handler
 */
export async function processShopifyWebhook(
  request: ShopifyWebhookRequest,
): Promise<{
  success: boolean;
  event?: ProcessedWebhookEvent;
  error?: string;
}> {
  if (!defaultHandler) {
    return {
      success: false,
      error:
        "Shopify webhook handler not initialized. Call initializeShopifyWebhooks first.",
    };
  }
  return defaultHandler.handleWebhook(request);
}

/**
 * Register Shopify as a source with the WebhookReceiver
 * This function returns the configuration that can be used with webhookReceiver.enableSource()
 */
export function getShopifySourceConfig(secret: string) {
  return {
    displayName: "Shopify",
    enabled: true,
    authMethod: "signature" as const,
    signatureHeader: "x-shopify-hmac-sha256",
    signatureAlgorithm: "sha256" as const,
    secret,
    eventTypeMapping: TOPIC_EVENT_MAP,
    entityTypeMapping: TOPIC_ENTITY_MAP,
    fieldMapping: {
      // Order fields
      id: "id",
      name: "orderNumber",
      total_price: "totalPrice",
      currency: "currency",
      financial_status: "financialStatus",
      fulfillment_status: "fulfillmentStatus",
      email: "customerEmail",
      // Product fields
      title: "name",
      handle: "handle",
      status: "status",
      vendor: "vendor",
      product_type: "productType",
      // Customer fields
      first_name: "firstName",
      last_name: "lastName",
      phone: "phone",
      total_spent: "totalSpent",
      orders_count: "ordersCount",
      accepts_marketing: "acceptsMarketing",
      // Inventory fields
      inventory_item_id: "inventoryItemId",
      location_id: "locationId",
      available: "available",
      sku: "sku",
      cost: "cost",
      tracked: "tracked",
      // Fulfillment fields
      order_id: "orderId",
      tracking_company: "trackingCompany",
      tracking_number: "trackingNumber",
      tracking_url: "trackingUrl",
      shipment_status: "shipmentStatus",
    },
    rateLimit: {
      maxPerMinute: 120,
      maxPerHour: 3600,
    },
  };
}

/**
 * Get all supported Shopify webhook topics
 */
export function getSupportedShopifyTopics(): ShopifyWebhookTopic[] {
  return Object.keys(TOPIC_EVENT_MAP) as ShopifyWebhookTopic[];
}

/**
 * Check if a topic is supported
 */
export function isShopifyTopicSupported(
  topic: string,
): topic is ShopifyWebhookTopic {
  return topic in TOPIC_EVENT_MAP;
}

/**
 * Get the normalized event type for a Shopify topic
 */
export function getShopifyEventType(topic: ShopifyWebhookTopic): string {
  return TOPIC_EVENT_MAP[topic] || topic.replace("/", "_");
}

/**
 * Get the category for a Shopify topic
 */
export function getShopifyEventCategory(
  topic: ShopifyWebhookTopic,
): ShopifyEventCategory {
  return TOPIC_CATEGORY_MAP[topic] || "commerce";
}

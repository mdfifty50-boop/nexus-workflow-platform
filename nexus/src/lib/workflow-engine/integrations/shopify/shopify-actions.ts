/**
 * Shopify E-commerce Actions - Workflow Engine Integration
 *
 * Provides Shopify-specific workflow actions for the workflow engine.
 * These actions can be used in step execution for e-commerce automation workflows.
 *
 * Features:
 * - Order management (get, update, fulfill, cancel, refund)
 * - Product and inventory management
 * - Customer management and tagging
 * - Notifications and draft orders
 *
 * @module ShopifyActions
 */

import type { ExecutionState } from '../../../../types/workflow-execution'

// ============================================================================
// Action Types
// ============================================================================

/**
 * All available Shopify action types
 */
export type ShopifyActionType =
  | 'shopify_get_order'
  | 'shopify_update_order'
  | 'shopify_fulfill_order'
  | 'shopify_cancel_order'
  | 'shopify_refund_order'
  | 'shopify_get_product'
  | 'shopify_update_inventory'
  | 'shopify_get_customer'
  | 'shopify_tag_customer'
  | 'shopify_send_notification'
  | 'shopify_create_draft_order'
  | 'shopify_add_order_note'

/**
 * Base interface for all Shopify actions
 */
export interface ShopifyActionBase {
  type: ShopifyActionType
  inputs: Record<string, unknown>
}

// ============================================================================
// Action Input Types
// ============================================================================

export interface ShopifyGetOrderInputs {
  orderId: string
  includeTransactions?: boolean
  includeFulfillments?: boolean
  includeRefunds?: boolean
}

export interface ShopifyUpdateOrderInputs {
  orderId: string
  note?: string
  email?: string
  phone?: string
  tags?: string[]
  shippingAddress?: {
    address1?: string
    address2?: string
    city?: string
    province?: string
    country?: string
    zip?: string
    phone?: string
  }
}

export interface ShopifyFulfillOrderInputs {
  orderId: string
  lineItems?: Array<{ id: string; quantity: number }>
  trackingNumber?: string
  trackingCompany?: string
  trackingUrl?: string
  notifyCustomer?: boolean
  locationId?: string
}

export interface ShopifyCancelOrderInputs {
  orderId: string
  reason?: 'customer' | 'fraud' | 'inventory' | 'declined' | 'other'
  email?: boolean
  restock?: boolean
  refund?: boolean
}

export interface ShopifyRefundOrderInputs {
  orderId: string
  lineItems?: Array<{ lineItemId: string; quantity: number; restockType?: 'no_restock' | 'cancel' | 'return' }>
  shipping?: { fullRefund?: boolean; amount?: number }
  note?: string
  notifyCustomer?: boolean
  currency?: string
  transactions?: Array<{ parentId: string; amount: number; kind: 'refund' }>
}

export interface ShopifyGetProductInputs {
  productId: string
  includeVariants?: boolean
  includeImages?: boolean
  includeMetafields?: boolean
}

export interface ShopifyUpdateInventoryInputs {
  inventoryItemId: string
  locationId: string
  availableAdjustment?: number
  availableQuantity?: number
  reason?: string
}

export interface ShopifyGetCustomerInputs {
  customerId: string
  includeAddresses?: boolean
  includeOrders?: boolean
  includeMetafields?: boolean
}

export interface ShopifyTagCustomerInputs {
  customerId: string
  tags: string[]
  operation: 'add' | 'remove' | 'replace'
}

export interface ShopifySendNotificationInputs {
  orderId: string
  notificationType: 'order_confirmation' | 'shipping_confirmation' | 'shipping_update' | 'refund_notification' | 'custom'
  customSubject?: string
  customMessage?: string
  recipientEmail?: string
}

export interface ShopifyCreateDraftOrderInputs {
  customerId?: string
  lineItems: Array<{
    variantId?: string
    productId?: string
    title?: string
    quantity: number
    price?: number
    taxable?: boolean
    sku?: string
  }>
  shippingAddress?: {
    firstName?: string
    lastName?: string
    address1?: string
    address2?: string
    city?: string
    province?: string
    country?: string
    zip?: string
    phone?: string
  }
  billingAddress?: {
    firstName?: string
    lastName?: string
    address1?: string
    address2?: string
    city?: string
    province?: string
    country?: string
    zip?: string
    phone?: string
  }
  note?: string
  email?: string
  taxExempt?: boolean
  tags?: string[]
  useCustomerDefaultAddress?: boolean
  appliedDiscount?: {
    title?: string
    description?: string
    value?: string
    valueType?: 'fixed_amount' | 'percentage'
  }
}

export interface ShopifyAddOrderNoteInputs {
  orderId: string
  note: string
  appendToExisting?: boolean
}

// ============================================================================
// Action Output Types
// ============================================================================

export interface ShopifyOrderOutput {
  id: string
  name: string
  orderNumber: number
  email: string
  phone?: string
  createdAt: string
  updatedAt: string
  closedAt?: string
  cancelledAt?: string
  cancelReason?: string
  financialStatus: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided'
  fulfillmentStatus: 'unfulfilled' | 'partial' | 'fulfilled' | 'restocked'
  currency: string
  totalPrice: number
  subtotalPrice: number
  totalTax: number
  totalShipping: number
  totalDiscounts: number
  lineItems: Array<{
    id: string
    title: string
    quantity: number
    price: number
    sku?: string
    variantId?: string
    productId?: string
  }>
  customer?: ShopifyCustomerOutput
  shippingAddress?: ShopifyAddressOutput
  billingAddress?: ShopifyAddressOutput
  tags: string[]
  note?: string
  fulfillments?: ShopifyFulfillmentOutput[]
  refunds?: ShopifyRefundOutput[]
}

export interface ShopifyCustomerOutput {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  ordersCount: number
  totalSpent: number
  tags: string[]
  createdAt: string
  updatedAt: string
  acceptsMarketing: boolean
  addresses?: ShopifyAddressOutput[]
}

export interface ShopifyAddressOutput {
  id?: string
  firstName?: string
  lastName?: string
  company?: string
  address1?: string
  address2?: string
  city?: string
  province?: string
  provinceCode?: string
  country?: string
  countryCode?: string
  zip?: string
  phone?: string
  isDefault?: boolean
}

export interface ShopifyProductOutput {
  id: string
  title: string
  handle: string
  description: string
  vendor: string
  productType: string
  status: 'active' | 'archived' | 'draft'
  tags: string[]
  createdAt: string
  updatedAt: string
  publishedAt?: string
  variants?: ShopifyVariantOutput[]
  images?: ShopifyImageOutput[]
}

export interface ShopifyVariantOutput {
  id: string
  productId: string
  title: string
  price: number
  compareAtPrice?: number
  sku?: string
  barcode?: string
  inventoryQuantity: number
  inventoryItemId: string
  weight?: number
  weightUnit?: string
  requiresShipping: boolean
  taxable: boolean
}

export interface ShopifyImageOutput {
  id: string
  src: string
  alt?: string
  position: number
  width: number
  height: number
}

export interface ShopifyFulfillmentOutput {
  id: string
  orderId: string
  status: 'pending' | 'open' | 'success' | 'cancelled' | 'error' | 'failure'
  trackingNumber?: string
  trackingCompany?: string
  trackingUrl?: string
  createdAt: string
  updatedAt: string
  lineItems: Array<{ id: string; quantity: number }>
}

export interface ShopifyRefundOutput {
  id: string
  orderId: string
  createdAt: string
  note?: string
  refundLineItems: Array<{
    id: string
    lineItemId: string
    quantity: number
    restockType: string
    subtotal: number
  }>
  transactions: Array<{
    id: string
    amount: number
    kind: string
    status: string
  }>
}

export interface ShopifyDraftOrderOutput {
  id: string
  name: string
  status: 'open' | 'invoice_sent' | 'completed'
  email?: string
  invoiceUrl?: string
  subtotalPrice: number
  totalTax: number
  totalPrice: number
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface ShopifyInventoryOutput {
  inventoryItemId: string
  locationId: string
  available: number
  updatedAt: string
}

export interface ShopifyNotificationOutput {
  success: boolean
  sentAt: string
  recipientEmail: string
  notificationType: string
}

// ============================================================================
// Execution Result Type
// ============================================================================

export interface ShopifyExecutionResult {
  success: boolean
  data?: unknown
  error?: string
  errorCode?: string
  isRetryable?: boolean
  suggestedAction?: string
  suggestedActionAr?: string
  executionTimeMs: number
  actionType: ShopifyActionType
}

// ============================================================================
// Execution Context Type
// ============================================================================

export interface ShopifyExecutionContext extends ExecutionState {
  shopifyConfig?: {
    shopDomain: string
    accessToken: string
    apiVersion?: string
  }
}

// ============================================================================
// Action Definition Registry
// ============================================================================

export interface ActionDefinition {
  type: ShopifyActionType
  name: string
  description: string
  category: 'order' | 'product' | 'customer' | 'fulfillment' | 'inventory' | 'notification'
  requiredInputs: string[]
  optionalInputs: string[]
  outputType: string
  errorScenarios: Array<{
    code: string
    message: string
    isRetryable: boolean
    suggestedAction: string
  }>
}

/**
 * Registry of all Shopify action definitions
 */
export const SHOPIFY_ACTION_DEFINITIONS: Record<ShopifyActionType, ActionDefinition> = {
  shopify_get_order: {
    type: 'shopify_get_order',
    name: 'Get Order',
    description: 'Retrieve order details by order ID',
    category: 'order',
    requiredInputs: ['orderId'],
    optionalInputs: ['includeTransactions', 'includeFulfillments', 'includeRefunds'],
    outputType: 'ShopifyOrderOutput',
    errorScenarios: [
      { code: 'ORDER_NOT_FOUND', message: 'Order not found', isRetryable: false, suggestedAction: 'Verify the order ID is correct' },
      { code: 'UNAUTHORIZED', message: 'Access token invalid or expired', isRetryable: false, suggestedAction: 'Reconnect your Shopify store' },
      { code: 'RATE_LIMITED', message: 'API rate limit exceeded', isRetryable: true, suggestedAction: 'Wait and retry' },
    ],
  },
  shopify_update_order: {
    type: 'shopify_update_order',
    name: 'Update Order',
    description: 'Update order details like notes, tags, or shipping address',
    category: 'order',
    requiredInputs: ['orderId'],
    optionalInputs: ['note', 'email', 'phone', 'tags', 'shippingAddress'],
    outputType: 'ShopifyOrderOutput',
    errorScenarios: [
      { code: 'ORDER_NOT_FOUND', message: 'Order not found', isRetryable: false, suggestedAction: 'Verify the order ID is correct' },
      { code: 'ORDER_CLOSED', message: 'Cannot update closed order', isRetryable: false, suggestedAction: 'The order has been closed and cannot be modified' },
      { code: 'VALIDATION_ERROR', message: 'Invalid field values', isRetryable: false, suggestedAction: 'Check the input values' },
    ],
  },
  shopify_fulfill_order: {
    type: 'shopify_fulfill_order',
    name: 'Fulfill Order',
    description: 'Create a fulfillment for an order with tracking information',
    category: 'fulfillment',
    requiredInputs: ['orderId'],
    optionalInputs: ['lineItems', 'trackingNumber', 'trackingCompany', 'trackingUrl', 'notifyCustomer', 'locationId'],
    outputType: 'ShopifyFulfillmentOutput',
    errorScenarios: [
      { code: 'ORDER_NOT_FOUND', message: 'Order not found', isRetryable: false, suggestedAction: 'Verify the order ID is correct' },
      { code: 'ALREADY_FULFILLED', message: 'Order is already fulfilled', isRetryable: false, suggestedAction: 'Check the order fulfillment status' },
      { code: 'INSUFFICIENT_INVENTORY', message: 'Not enough inventory at location', isRetryable: false, suggestedAction: 'Update inventory or select different location' },
    ],
  },
  shopify_cancel_order: {
    type: 'shopify_cancel_order',
    name: 'Cancel Order',
    description: 'Cancel an order with optional refund and restock',
    category: 'order',
    requiredInputs: ['orderId'],
    optionalInputs: ['reason', 'email', 'restock', 'refund'],
    outputType: 'ShopifyOrderOutput',
    errorScenarios: [
      { code: 'ORDER_NOT_FOUND', message: 'Order not found', isRetryable: false, suggestedAction: 'Verify the order ID is correct' },
      { code: 'ALREADY_CANCELLED', message: 'Order is already cancelled', isRetryable: false, suggestedAction: 'The order has already been cancelled' },
      { code: 'FULFILLED_ORDER', message: 'Cannot cancel fulfilled order', isRetryable: false, suggestedAction: 'Create a return instead' },
    ],
  },
  shopify_refund_order: {
    type: 'shopify_refund_order',
    name: 'Refund Order',
    description: 'Process a refund for an order',
    category: 'order',
    requiredInputs: ['orderId'],
    optionalInputs: ['lineItems', 'shipping', 'note', 'notifyCustomer', 'currency', 'transactions'],
    outputType: 'ShopifyRefundOutput',
    errorScenarios: [
      { code: 'ORDER_NOT_FOUND', message: 'Order not found', isRetryable: false, suggestedAction: 'Verify the order ID is correct' },
      { code: 'NOTHING_TO_REFUND', message: 'No refundable amount', isRetryable: false, suggestedAction: 'Order has already been fully refunded' },
      { code: 'REFUND_EXCEEDS_AMOUNT', message: 'Refund amount exceeds available', isRetryable: false, suggestedAction: 'Reduce the refund amount' },
    ],
  },
  shopify_get_product: {
    type: 'shopify_get_product',
    name: 'Get Product',
    description: 'Retrieve product details by product ID',
    category: 'product',
    requiredInputs: ['productId'],
    optionalInputs: ['includeVariants', 'includeImages', 'includeMetafields'],
    outputType: 'ShopifyProductOutput',
    errorScenarios: [
      { code: 'PRODUCT_NOT_FOUND', message: 'Product not found', isRetryable: false, suggestedAction: 'Verify the product ID is correct' },
    ],
  },
  shopify_update_inventory: {
    type: 'shopify_update_inventory',
    name: 'Update Inventory',
    description: 'Adjust inventory levels for a product variant at a location',
    category: 'inventory',
    requiredInputs: ['inventoryItemId', 'locationId'],
    optionalInputs: ['availableAdjustment', 'availableQuantity', 'reason'],
    outputType: 'ShopifyInventoryOutput',
    errorScenarios: [
      { code: 'INVENTORY_ITEM_NOT_FOUND', message: 'Inventory item not found', isRetryable: false, suggestedAction: 'Verify the inventory item ID is correct' },
      { code: 'LOCATION_NOT_FOUND', message: 'Location not found', isRetryable: false, suggestedAction: 'Verify the location ID is correct' },
      { code: 'NEGATIVE_INVENTORY', message: 'Cannot set negative inventory', isRetryable: false, suggestedAction: 'Ensure inventory quantity is not negative' },
    ],
  },
  shopify_get_customer: {
    type: 'shopify_get_customer',
    name: 'Get Customer',
    description: 'Retrieve customer details by customer ID',
    category: 'customer',
    requiredInputs: ['customerId'],
    optionalInputs: ['includeAddresses', 'includeOrders', 'includeMetafields'],
    outputType: 'ShopifyCustomerOutput',
    errorScenarios: [
      { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found', isRetryable: false, suggestedAction: 'Verify the customer ID is correct' },
    ],
  },
  shopify_tag_customer: {
    type: 'shopify_tag_customer',
    name: 'Tag Customer',
    description: 'Add, remove, or replace tags on a customer',
    category: 'customer',
    requiredInputs: ['customerId', 'tags', 'operation'],
    optionalInputs: [],
    outputType: 'ShopifyCustomerOutput',
    errorScenarios: [
      { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found', isRetryable: false, suggestedAction: 'Verify the customer ID is correct' },
      { code: 'TAG_LIMIT_EXCEEDED', message: 'Too many tags', isRetryable: false, suggestedAction: 'Remove some tags before adding new ones' },
    ],
  },
  shopify_send_notification: {
    type: 'shopify_send_notification',
    name: 'Send Notification',
    description: 'Send an order notification email to customer',
    category: 'notification',
    requiredInputs: ['orderId', 'notificationType'],
    optionalInputs: ['customSubject', 'customMessage', 'recipientEmail'],
    outputType: 'ShopifyNotificationOutput',
    errorScenarios: [
      { code: 'ORDER_NOT_FOUND', message: 'Order not found', isRetryable: false, suggestedAction: 'Verify the order ID is correct' },
      { code: 'NO_EMAIL', message: 'Customer has no email', isRetryable: false, suggestedAction: 'Provide a recipient email address' },
      { code: 'NOTIFICATION_DISABLED', message: 'Notification type disabled', isRetryable: false, suggestedAction: 'Enable this notification type in Shopify settings' },
    ],
  },
  shopify_create_draft_order: {
    type: 'shopify_create_draft_order',
    name: 'Create Draft Order',
    description: 'Create a draft order that can be completed later',
    category: 'order',
    requiredInputs: ['lineItems'],
    optionalInputs: ['customerId', 'shippingAddress', 'billingAddress', 'note', 'email', 'taxExempt', 'tags', 'useCustomerDefaultAddress', 'appliedDiscount'],
    outputType: 'ShopifyDraftOrderOutput',
    errorScenarios: [
      { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found', isRetryable: false, suggestedAction: 'Verify the customer ID is correct' },
      { code: 'PRODUCT_NOT_FOUND', message: 'Product or variant not found', isRetryable: false, suggestedAction: 'Verify the product/variant IDs are correct' },
      { code: 'VALIDATION_ERROR', message: 'Invalid line item data', isRetryable: false, suggestedAction: 'Check the line item format and quantities' },
    ],
  },
  shopify_add_order_note: {
    type: 'shopify_add_order_note',
    name: 'Add Order Note',
    description: 'Add or update the note on an order',
    category: 'order',
    requiredInputs: ['orderId', 'note'],
    optionalInputs: ['appendToExisting'],
    outputType: 'ShopifyOrderOutput',
    errorScenarios: [
      { code: 'ORDER_NOT_FOUND', message: 'Order not found', isRetryable: false, suggestedAction: 'Verify the order ID is correct' },
      { code: 'NOTE_TOO_LONG', message: 'Note exceeds maximum length', isRetryable: false, suggestedAction: 'Shorten the note text' },
    ],
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate a Shopify action before execution
 */
export function validateShopifyAction(
  action: ShopifyActionBase
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  const definition = SHOPIFY_ACTION_DEFINITIONS[action.type]
  if (!definition) {
    errors.push(`Unknown action type: ${action.type}`)
    return { valid: false, errors }
  }

  // Check required inputs
  for (const requiredInput of definition.requiredInputs) {
    if (action.inputs[requiredInput] === undefined || action.inputs[requiredInput] === null) {
      errors.push(`Missing required input: ${requiredInput}`)
    }
  }

  // Type-specific validation
  switch (action.type) {
    case 'shopify_get_order':
    case 'shopify_update_order':
    case 'shopify_fulfill_order':
    case 'shopify_cancel_order':
    case 'shopify_refund_order':
    case 'shopify_send_notification':
    case 'shopify_add_order_note':
      if (action.inputs.orderId && typeof action.inputs.orderId !== 'string') {
        errors.push('orderId must be a string')
      }
      break
    case 'shopify_get_product':
      if (action.inputs.productId && typeof action.inputs.productId !== 'string') {
        errors.push('productId must be a string')
      }
      break
    case 'shopify_get_customer':
    case 'shopify_tag_customer':
      if (action.inputs.customerId && typeof action.inputs.customerId !== 'string') {
        errors.push('customerId must be a string')
      }
      if (action.type === 'shopify_tag_customer') {
        if (!Array.isArray(action.inputs.tags)) {
          errors.push('tags must be an array')
        }
        if (!['add', 'remove', 'replace'].includes(action.inputs.operation as string)) {
          errors.push('operation must be add, remove, or replace')
        }
      }
      break
    case 'shopify_update_inventory':
      if (action.inputs.inventoryItemId && typeof action.inputs.inventoryItemId !== 'string') {
        errors.push('inventoryItemId must be a string')
      }
      if (action.inputs.locationId && typeof action.inputs.locationId !== 'string') {
        errors.push('locationId must be a string')
      }
      break
    case 'shopify_create_draft_order':
      if (!Array.isArray(action.inputs.lineItems) || action.inputs.lineItems.length === 0) {
        errors.push('lineItems must be a non-empty array')
      }
      break
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Format Shopify API response to normalized output
 */
export function formatShopifyResponse(
  actionType: ShopifyActionType,
  response: unknown
): unknown {
  if (!response || typeof response !== 'object') {
    return response
  }

  const data = response as Record<string, unknown>

  // Handle different response structures
  switch (actionType) {
    case 'shopify_get_order':
    case 'shopify_update_order':
    case 'shopify_cancel_order':
    case 'shopify_add_order_note':
      return formatOrderResponse((data.order || data) as Record<string, unknown>)

    case 'shopify_fulfill_order':
      return formatFulfillmentResponse((data.fulfillment || data) as Record<string, unknown>)

    case 'shopify_refund_order':
      return formatRefundResponse((data.refund || data) as Record<string, unknown>)

    case 'shopify_get_product':
      return formatProductResponse((data.product || data) as Record<string, unknown>)

    case 'shopify_update_inventory':
      return formatInventoryResponse((data.inventory_level || data) as Record<string, unknown>)

    case 'shopify_get_customer':
    case 'shopify_tag_customer':
      return formatCustomerResponse((data.customer || data) as Record<string, unknown>)

    case 'shopify_send_notification':
      return formatNotificationResponse(data)

    case 'shopify_create_draft_order':
      return formatDraftOrderResponse((data.draft_order || data) as Record<string, unknown>)

    default:
      return data
  }
}

function formatOrderResponse(order: Record<string, unknown>): ShopifyOrderOutput {
  return {
    id: String(order.id || ''),
    name: String(order.name || ''),
    orderNumber: Number(order.order_number || 0),
    email: String(order.email || ''),
    phone: order.phone as string | undefined,
    createdAt: String(order.created_at || ''),
    updatedAt: String(order.updated_at || ''),
    closedAt: order.closed_at as string | undefined,
    cancelledAt: order.cancelled_at as string | undefined,
    cancelReason: order.cancel_reason as string | undefined,
    financialStatus: (order.financial_status as ShopifyOrderOutput['financialStatus']) || 'pending',
    fulfillmentStatus: (order.fulfillment_status as ShopifyOrderOutput['fulfillmentStatus']) || 'unfulfilled',
    currency: String(order.currency || 'USD'),
    totalPrice: parseFloat(String(order.total_price || 0)),
    subtotalPrice: parseFloat(String(order.subtotal_price || 0)),
    totalTax: parseFloat(String(order.total_tax || 0)),
    totalShipping: parseFloat(String(
      ((order.total_shipping_price_set as Record<string, unknown>)?.shop_money as Record<string, unknown>)?.amount || 0
    )),
    totalDiscounts: parseFloat(String(order.total_discounts || 0)),
    lineItems: formatLineItems(order.line_items as unknown[]),
    customer: order.customer ? formatCustomerResponse(order.customer as Record<string, unknown>) : undefined,
    shippingAddress: order.shipping_address ? formatAddressResponse(order.shipping_address as Record<string, unknown>) : undefined,
    billingAddress: order.billing_address ? formatAddressResponse(order.billing_address as Record<string, unknown>) : undefined,
    tags: String(order.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    note: order.note as string | undefined,
    fulfillments: Array.isArray(order.fulfillments)
      ? order.fulfillments.map(f => formatFulfillmentResponse(f as Record<string, unknown>))
      : undefined,
    refunds: Array.isArray(order.refunds)
      ? order.refunds.map(r => formatRefundResponse(r as Record<string, unknown>))
      : undefined,
  }
}

function formatLineItems(lineItems: unknown[]): ShopifyOrderOutput['lineItems'] {
  if (!Array.isArray(lineItems)) return []
  return lineItems.map((item) => {
    const i = item as Record<string, unknown>
    return {
      id: String(i.id || ''),
      title: String(i.title || ''),
      quantity: Number(i.quantity || 0),
      price: parseFloat(String(i.price || 0)),
      sku: i.sku as string | undefined,
      variantId: i.variant_id ? String(i.variant_id) : undefined,
      productId: i.product_id ? String(i.product_id) : undefined,
    }
  })
}

function formatCustomerResponse(customer: Record<string, unknown>): ShopifyCustomerOutput {
  return {
    id: String(customer.id || ''),
    email: String(customer.email || ''),
    firstName: customer.first_name as string | undefined,
    lastName: customer.last_name as string | undefined,
    phone: customer.phone as string | undefined,
    ordersCount: Number(customer.orders_count || 0),
    totalSpent: parseFloat(String(customer.total_spent || 0)),
    tags: String(customer.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    createdAt: String(customer.created_at || ''),
    updatedAt: String(customer.updated_at || ''),
    acceptsMarketing: Boolean(customer.accepts_marketing),
    addresses: Array.isArray(customer.addresses)
      ? customer.addresses.map(a => formatAddressResponse(a as Record<string, unknown>))
      : undefined,
  }
}

function formatAddressResponse(address: Record<string, unknown>): ShopifyAddressOutput {
  return {
    id: address.id ? String(address.id) : undefined,
    firstName: address.first_name as string | undefined,
    lastName: address.last_name as string | undefined,
    company: address.company as string | undefined,
    address1: address.address1 as string | undefined,
    address2: address.address2 as string | undefined,
    city: address.city as string | undefined,
    province: address.province as string | undefined,
    provinceCode: address.province_code as string | undefined,
    country: address.country as string | undefined,
    countryCode: address.country_code as string | undefined,
    zip: address.zip as string | undefined,
    phone: address.phone as string | undefined,
    isDefault: Boolean(address.default),
  }
}

function formatProductResponse(product: Record<string, unknown>): ShopifyProductOutput {
  return {
    id: String(product.id || ''),
    title: String(product.title || ''),
    handle: String(product.handle || ''),
    description: String(product.body_html || ''),
    vendor: String(product.vendor || ''),
    productType: String(product.product_type || ''),
    status: (product.status as ShopifyProductOutput['status']) || 'active',
    tags: String(product.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    createdAt: String(product.created_at || ''),
    updatedAt: String(product.updated_at || ''),
    publishedAt: product.published_at as string | undefined,
    variants: Array.isArray(product.variants)
      ? product.variants.map(v => formatVariantResponse(v as Record<string, unknown>))
      : undefined,
    images: Array.isArray(product.images)
      ? product.images.map(i => formatImageResponse(i as Record<string, unknown>))
      : undefined,
  }
}

function formatVariantResponse(variant: Record<string, unknown>): ShopifyVariantOutput {
  return {
    id: String(variant.id || ''),
    productId: String(variant.product_id || ''),
    title: String(variant.title || ''),
    price: parseFloat(String(variant.price || 0)),
    compareAtPrice: variant.compare_at_price ? parseFloat(String(variant.compare_at_price)) : undefined,
    sku: variant.sku as string | undefined,
    barcode: variant.barcode as string | undefined,
    inventoryQuantity: Number(variant.inventory_quantity || 0),
    inventoryItemId: String(variant.inventory_item_id || ''),
    weight: variant.weight ? parseFloat(String(variant.weight)) : undefined,
    weightUnit: variant.weight_unit as string | undefined,
    requiresShipping: Boolean(variant.requires_shipping),
    taxable: Boolean(variant.taxable),
  }
}

function formatImageResponse(image: Record<string, unknown>): ShopifyImageOutput {
  return {
    id: String(image.id || ''),
    src: String(image.src || ''),
    alt: image.alt as string | undefined,
    position: Number(image.position || 0),
    width: Number(image.width || 0),
    height: Number(image.height || 0),
  }
}

function formatFulfillmentResponse(fulfillment: Record<string, unknown>): ShopifyFulfillmentOutput {
  return {
    id: String(fulfillment.id || ''),
    orderId: String(fulfillment.order_id || ''),
    status: (fulfillment.status as ShopifyFulfillmentOutput['status']) || 'pending',
    trackingNumber: fulfillment.tracking_number as string | undefined,
    trackingCompany: fulfillment.tracking_company as string | undefined,
    trackingUrl: fulfillment.tracking_url as string | undefined,
    createdAt: String(fulfillment.created_at || ''),
    updatedAt: String(fulfillment.updated_at || ''),
    lineItems: Array.isArray(fulfillment.line_items)
      ? fulfillment.line_items.map((li: unknown) => {
          const item = li as Record<string, unknown>
          return { id: String(item.id || ''), quantity: Number(item.quantity || 0) }
        })
      : [],
  }
}

function formatRefundResponse(refund: Record<string, unknown>): ShopifyRefundOutput {
  return {
    id: String(refund.id || ''),
    orderId: String(refund.order_id || ''),
    createdAt: String(refund.created_at || ''),
    note: refund.note as string | undefined,
    refundLineItems: Array.isArray(refund.refund_line_items)
      ? refund.refund_line_items.map((rli: unknown) => {
          const item = rli as Record<string, unknown>
          return {
            id: String(item.id || ''),
            lineItemId: String(item.line_item_id || ''),
            quantity: Number(item.quantity || 0),
            restockType: String(item.restock_type || 'no_restock'),
            subtotal: parseFloat(String(item.subtotal || 0)),
          }
        })
      : [],
    transactions: Array.isArray(refund.transactions)
      ? refund.transactions.map((tx: unknown) => {
          const t = tx as Record<string, unknown>
          return {
            id: String(t.id || ''),
            amount: parseFloat(String(t.amount || 0)),
            kind: String(t.kind || ''),
            status: String(t.status || ''),
          }
        })
      : [],
  }
}

function formatDraftOrderResponse(draftOrder: Record<string, unknown>): ShopifyDraftOrderOutput {
  return {
    id: String(draftOrder.id || ''),
    name: String(draftOrder.name || ''),
    status: (draftOrder.status as ShopifyDraftOrderOutput['status']) || 'open',
    email: draftOrder.email as string | undefined,
    invoiceUrl: draftOrder.invoice_url as string | undefined,
    subtotalPrice: parseFloat(String(draftOrder.subtotal_price || 0)),
    totalTax: parseFloat(String(draftOrder.total_tax || 0)),
    totalPrice: parseFloat(String(draftOrder.total_price || 0)),
    createdAt: String(draftOrder.created_at || ''),
    updatedAt: String(draftOrder.updated_at || ''),
    completedAt: draftOrder.completed_at as string | undefined,
  }
}

function formatNotificationResponse(response: Record<string, unknown>): ShopifyNotificationOutput {
  return {
    success: Boolean(response.success !== false),
    sentAt: String(response.sent_at || new Date().toISOString()),
    recipientEmail: String(response.recipient_email || response.email || ''),
    notificationType: String(response.notification_type || ''),
  }
}

function formatInventoryResponse(inventory: Record<string, unknown>): ShopifyInventoryOutput {
  return {
    inventoryItemId: String(inventory.inventory_item_id || ''),
    locationId: String(inventory.location_id || ''),
    available: Number(inventory.available || 0),
    updatedAt: String(inventory.updated_at || new Date().toISOString()),
  }
}

/**
 * Get requirements for a specific action type
 */
export function getActionRequirements(actionType: ShopifyActionType): {
  requiredInputs: string[]
  optionalInputs: string[]
  requiredScopes: string[]
} {
  const definition = SHOPIFY_ACTION_DEFINITIONS[actionType]
  if (!definition) {
    return { requiredInputs: [], optionalInputs: [], requiredScopes: [] }
  }

  // Map action types to required Shopify scopes
  const scopeMap: Record<string, string[]> = {
    order: ['read_orders', 'write_orders'],
    product: ['read_products', 'write_products'],
    customer: ['read_customers', 'write_customers'],
    fulfillment: ['read_orders', 'write_orders', 'read_fulfillments', 'write_fulfillments'],
    inventory: ['read_inventory', 'write_inventory'],
    notification: ['read_orders', 'write_orders'],
  }

  return {
    requiredInputs: definition.requiredInputs,
    optionalInputs: definition.optionalInputs,
    requiredScopes: scopeMap[definition.category] || [],
  }
}

// ============================================================================
// Shopify Action Executor Class
// ============================================================================

/**
 * ShopifyActionExecutor - Executes Shopify-specific workflow actions
 *
 * This class provides methods to execute various Shopify e-commerce actions
 * within the workflow engine. It handles input validation, API communication,
 * response formatting, and error handling.
 */
export class ShopifyActionExecutor {
  private shopDomain: string | null = null
  private accessToken: string | null = null
  private apiVersion: string = '2024-01'

  /**
   * Configure the executor with Shopify credentials
   */
  configure(config: { shopDomain: string; accessToken: string; apiVersion?: string }): void {
    this.shopDomain = config.shopDomain
    this.accessToken = config.accessToken
    if (config.apiVersion) {
      this.apiVersion = config.apiVersion
    }
  }

  /**
   * Check if the executor is configured
   */
  isConfigured(): boolean {
    return Boolean(this.shopDomain && this.accessToken)
  }

  /**
   * Main execution method - routes to specific action handlers
   */
  async execute(
    action: ShopifyActionBase,
    context: ShopifyExecutionContext
  ): Promise<ShopifyExecutionResult> {
    const startTime = Date.now()

    // Use context config if executor not configured
    if (!this.isConfigured() && context.shopifyConfig) {
      this.configure(context.shopifyConfig)
    }

    // Validate action
    const validation = validateShopifyAction(action)
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
        errorCode: 'VALIDATION_ERROR',
        isRetryable: false,
        suggestedAction: 'Fix the input parameters and try again',
        suggestedActionAr: 'صحح معاملات الإدخال وحاول مرة أخرى',
        executionTimeMs: Date.now() - startTime,
        actionType: action.type,
      }
    }

    // Check configuration
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Shopify executor not configured',
        errorCode: 'NOT_CONFIGURED',
        isRetryable: false,
        suggestedAction: 'Connect your Shopify store first',
        suggestedActionAr: 'اربط متجر شوبيفاي الخاص بك أولاً',
        executionTimeMs: Date.now() - startTime,
        actionType: action.type,
      }
    }

    try {
      // Route to specific action handler
      let result: unknown
      const inputs = action.inputs as unknown
      switch (action.type) {
        case 'shopify_get_order':
          result = await this.executeGetOrder(inputs as ShopifyGetOrderInputs)
          break
        case 'shopify_update_order':
          result = await this.executeUpdateOrder(inputs as ShopifyUpdateOrderInputs)
          break
        case 'shopify_fulfill_order':
          result = await this.executeFulfillOrder(inputs as ShopifyFulfillOrderInputs)
          break
        case 'shopify_cancel_order':
          result = await this.executeCancelOrder(inputs as ShopifyCancelOrderInputs)
          break
        case 'shopify_refund_order':
          result = await this.executeRefundOrder(inputs as ShopifyRefundOrderInputs)
          break
        case 'shopify_get_product':
          result = await this.executeGetProduct(inputs as ShopifyGetProductInputs)
          break
        case 'shopify_update_inventory':
          result = await this.executeUpdateInventory(inputs as ShopifyUpdateInventoryInputs)
          break
        case 'shopify_get_customer':
          result = await this.executeGetCustomer(inputs as ShopifyGetCustomerInputs)
          break
        case 'shopify_tag_customer':
          result = await this.executeTagCustomer(inputs as ShopifyTagCustomerInputs)
          break
        case 'shopify_send_notification':
          result = await this.executeSendNotification(inputs as ShopifySendNotificationInputs)
          break
        case 'shopify_create_draft_order':
          result = await this.executeCreateDraftOrder(inputs as ShopifyCreateDraftOrderInputs)
          break
        case 'shopify_add_order_note':
          result = await this.executeAddOrderNote(inputs as ShopifyAddOrderNoteInputs)
          break
        default:
          throw new Error(`Unknown action type: ${action.type}`)
      }

      return {
        success: true,
        data: formatShopifyResponse(action.type, result),
        executionTimeMs: Date.now() - startTime,
        actionType: action.type,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const definition = SHOPIFY_ACTION_DEFINITIONS[action.type]
      const matchedError = definition?.errorScenarios.find(e => errorMessage.includes(e.code) || errorMessage.includes(e.message))

      return {
        success: false,
        error: errorMessage,
        errorCode: matchedError?.code || 'EXECUTION_ERROR',
        isRetryable: matchedError?.isRetryable ?? false,
        suggestedAction: matchedError?.suggestedAction || 'Check the error details and try again',
        suggestedActionAr: 'تحقق من تفاصيل الخطأ وحاول مرة أخرى',
        executionTimeMs: Date.now() - startTime,
        actionType: action.type,
      }
    }
  }

  // ============================================================================
  // Action-Specific Execution Methods
  // ============================================================================

  private async executeGetOrder(inputs: ShopifyGetOrderInputs): Promise<unknown> {
    const endpoint = `/admin/api/${this.apiVersion}/orders/${inputs.orderId}.json`
    const params: string[] = []
    if (inputs.includeTransactions) params.push('fields=transactions')
    if (inputs.includeFulfillments) params.push('fields=fulfillments')
    if (inputs.includeRefunds) params.push('fields=refunds')

    const url = params.length > 0 ? `${endpoint}?${params.join('&')}` : endpoint
    return this.makeRequest('GET', url)
  }

  private async executeUpdateOrder(inputs: ShopifyUpdateOrderInputs): Promise<unknown> {
    const endpoint = `/admin/api/${this.apiVersion}/orders/${inputs.orderId}.json`
    const orderData: Record<string, unknown> = {}

    if (inputs.note !== undefined) orderData.note = inputs.note
    if (inputs.email !== undefined) orderData.email = inputs.email
    if (inputs.phone !== undefined) orderData.phone = inputs.phone
    if (inputs.tags !== undefined) orderData.tags = inputs.tags.join(', ')
    if (inputs.shippingAddress !== undefined) orderData.shipping_address = inputs.shippingAddress

    return this.makeRequest('PUT', endpoint, { order: orderData })
  }

  private async executeFulfillOrder(inputs: ShopifyFulfillOrderInputs): Promise<unknown> {
    const endpoint = `/admin/api/${this.apiVersion}/orders/${inputs.orderId}/fulfillments.json`
    const fulfillmentData: Record<string, unknown> = {
      notify_customer: inputs.notifyCustomer ?? true,
    }

    if (inputs.lineItems) {
      fulfillmentData.line_items = inputs.lineItems.map(li => ({
        id: li.id,
        quantity: li.quantity,
      }))
    }
    if (inputs.trackingNumber) fulfillmentData.tracking_number = inputs.trackingNumber
    if (inputs.trackingCompany) fulfillmentData.tracking_company = inputs.trackingCompany
    if (inputs.trackingUrl) fulfillmentData.tracking_url = inputs.trackingUrl
    if (inputs.locationId) fulfillmentData.location_id = inputs.locationId

    return this.makeRequest('POST', endpoint, { fulfillment: fulfillmentData })
  }

  private async executeCancelOrder(inputs: ShopifyCancelOrderInputs): Promise<unknown> {
    const endpoint = `/admin/api/${this.apiVersion}/orders/${inputs.orderId}/cancel.json`
    const cancelData: Record<string, unknown> = {}

    if (inputs.reason) cancelData.reason = inputs.reason
    if (inputs.email !== undefined) cancelData.email = inputs.email
    if (inputs.restock !== undefined) cancelData.restock = inputs.restock
    if (inputs.refund !== undefined) cancelData.refund = inputs.refund

    return this.makeRequest('POST', endpoint, cancelData)
  }

  private async executeRefundOrder(inputs: ShopifyRefundOrderInputs): Promise<unknown> {
    const endpoint = `/admin/api/${this.apiVersion}/orders/${inputs.orderId}/refunds.json`
    const refundData: Record<string, unknown> = {
      notify: inputs.notifyCustomer ?? true,
    }

    if (inputs.lineItems) {
      refundData.refund_line_items = inputs.lineItems.map(li => ({
        line_item_id: li.lineItemId,
        quantity: li.quantity,
        restock_type: li.restockType || 'no_restock',
      }))
    }
    if (inputs.shipping) {
      refundData.shipping = {
        full_refund: inputs.shipping.fullRefund,
        amount: inputs.shipping.amount,
      }
    }
    if (inputs.note) refundData.note = inputs.note
    if (inputs.currency) refundData.currency = inputs.currency
    if (inputs.transactions) {
      refundData.transactions = inputs.transactions.map(tx => ({
        parent_id: tx.parentId,
        amount: tx.amount,
        kind: tx.kind,
      }))
    }

    return this.makeRequest('POST', endpoint, { refund: refundData })
  }

  private async executeGetProduct(inputs: ShopifyGetProductInputs): Promise<unknown> {
    const endpoint = `/admin/api/${this.apiVersion}/products/${inputs.productId}.json`
    const fields: string[] = []
    if (inputs.includeVariants) fields.push('variants')
    if (inputs.includeImages) fields.push('images')
    if (inputs.includeMetafields) fields.push('metafields')

    const url = fields.length > 0 ? `${endpoint}?fields=${fields.join(',')}` : endpoint
    return this.makeRequest('GET', url)
  }

  private async executeUpdateInventory(inputs: ShopifyUpdateInventoryInputs): Promise<unknown> {
    if (inputs.availableQuantity !== undefined) {
      // Set absolute inventory level
      const endpoint = `/admin/api/${this.apiVersion}/inventory_levels/set.json`
      return this.makeRequest('POST', endpoint, {
        location_id: inputs.locationId,
        inventory_item_id: inputs.inventoryItemId,
        available: inputs.availableQuantity,
      })
    } else if (inputs.availableAdjustment !== undefined) {
      // Adjust inventory level
      const endpoint = `/admin/api/${this.apiVersion}/inventory_levels/adjust.json`
      return this.makeRequest('POST', endpoint, {
        location_id: inputs.locationId,
        inventory_item_id: inputs.inventoryItemId,
        available_adjustment: inputs.availableAdjustment,
      })
    }
    throw new Error('Either availableQuantity or availableAdjustment must be provided')
  }

  private async executeGetCustomer(inputs: ShopifyGetCustomerInputs): Promise<unknown> {
    const endpoint = `/admin/api/${this.apiVersion}/customers/${inputs.customerId}.json`
    const fields: string[] = []
    if (inputs.includeAddresses) fields.push('addresses')
    if (inputs.includeOrders) fields.push('orders')
    if (inputs.includeMetafields) fields.push('metafields')

    const url = fields.length > 0 ? `${endpoint}?fields=${fields.join(',')}` : endpoint
    return this.makeRequest('GET', url)
  }

  private async executeTagCustomer(inputs: ShopifyTagCustomerInputs): Promise<unknown> {
    // First get current customer tags
    const getEndpoint = `/admin/api/${this.apiVersion}/customers/${inputs.customerId}.json`
    const currentCustomer = await this.makeRequest('GET', getEndpoint) as { customer: { tags: string } }
    const currentTags = currentCustomer.customer.tags.split(',').map(t => t.trim()).filter(Boolean)

    let newTags: string[]
    switch (inputs.operation) {
      case 'add':
        newTags = Array.from(new Set([...currentTags, ...inputs.tags]))
        break
      case 'remove':
        newTags = currentTags.filter(t => !inputs.tags.includes(t))
        break
      case 'replace':
        newTags = inputs.tags
        break
      default:
        newTags = currentTags
    }

    const updateEndpoint = `/admin/api/${this.apiVersion}/customers/${inputs.customerId}.json`
    return this.makeRequest('PUT', updateEndpoint, {
      customer: { tags: newTags.join(', ') },
    })
  }

  private async executeSendNotification(inputs: ShopifySendNotificationInputs): Promise<unknown> {
    // Map notification types to Shopify notification endpoints
    const notificationEndpoints: Record<string, string> = {
      order_confirmation: 'order_confirmation',
      shipping_confirmation: 'shipping_confirmation',
      shipping_update: 'shipping_update',
      refund_notification: 'refund_notification',
    }

    if (inputs.notificationType === 'custom') {
      // For custom notifications, we would use a different approach
      // This is a placeholder for custom notification logic
      return {
        success: true,
        sent_at: new Date().toISOString(),
        recipient_email: inputs.recipientEmail,
        notification_type: 'custom',
      }
    }

    const notificationType = notificationEndpoints[inputs.notificationType]
    if (!notificationType) {
      throw new Error(`Unknown notification type: ${inputs.notificationType}`)
    }

    const endpoint = `/admin/api/${this.apiVersion}/orders/${inputs.orderId}/${notificationType}.json`
    return this.makeRequest('POST', endpoint)
  }

  private async executeCreateDraftOrder(inputs: ShopifyCreateDraftOrderInputs): Promise<unknown> {
    const endpoint = `/admin/api/${this.apiVersion}/draft_orders.json`
    const draftOrderData: Record<string, unknown> = {
      line_items: inputs.lineItems.map(li => ({
        variant_id: li.variantId,
        product_id: li.productId,
        title: li.title,
        quantity: li.quantity,
        price: li.price,
        taxable: li.taxable,
        sku: li.sku,
      })),
    }

    if (inputs.customerId) draftOrderData.customer = { id: inputs.customerId }
    if (inputs.shippingAddress) {
      draftOrderData.shipping_address = {
        first_name: inputs.shippingAddress.firstName,
        last_name: inputs.shippingAddress.lastName,
        address1: inputs.shippingAddress.address1,
        address2: inputs.shippingAddress.address2,
        city: inputs.shippingAddress.city,
        province: inputs.shippingAddress.province,
        country: inputs.shippingAddress.country,
        zip: inputs.shippingAddress.zip,
        phone: inputs.shippingAddress.phone,
      }
    }
    if (inputs.billingAddress) {
      draftOrderData.billing_address = {
        first_name: inputs.billingAddress.firstName,
        last_name: inputs.billingAddress.lastName,
        address1: inputs.billingAddress.address1,
        address2: inputs.billingAddress.address2,
        city: inputs.billingAddress.city,
        province: inputs.billingAddress.province,
        country: inputs.billingAddress.country,
        zip: inputs.billingAddress.zip,
        phone: inputs.billingAddress.phone,
      }
    }
    if (inputs.note) draftOrderData.note = inputs.note
    if (inputs.email) draftOrderData.email = inputs.email
    if (inputs.taxExempt !== undefined) draftOrderData.tax_exempt = inputs.taxExempt
    if (inputs.tags) draftOrderData.tags = inputs.tags.join(', ')
    if (inputs.useCustomerDefaultAddress !== undefined) {
      draftOrderData.use_customer_default_address = inputs.useCustomerDefaultAddress
    }
    if (inputs.appliedDiscount) {
      draftOrderData.applied_discount = {
        title: inputs.appliedDiscount.title,
        description: inputs.appliedDiscount.description,
        value: inputs.appliedDiscount.value,
        value_type: inputs.appliedDiscount.valueType,
      }
    }

    return this.makeRequest('POST', endpoint, { draft_order: draftOrderData })
  }

  private async executeAddOrderNote(inputs: ShopifyAddOrderNoteInputs): Promise<unknown> {
    const getEndpoint = `/admin/api/${this.apiVersion}/orders/${inputs.orderId}.json`
    let note = inputs.note

    if (inputs.appendToExisting) {
      const currentOrder = await this.makeRequest('GET', getEndpoint) as { order: { note: string } }
      const currentNote = currentOrder.order.note || ''
      note = currentNote ? `${currentNote}\n${inputs.note}` : inputs.note
    }

    const updateEndpoint = `/admin/api/${this.apiVersion}/orders/${inputs.orderId}.json`
    return this.makeRequest('PUT', updateEndpoint, { order: { note } })
  }

  // ============================================================================
  // HTTP Request Helper
  // ============================================================================

  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<unknown> {
    if (!this.shopDomain || !this.accessToken) {
      throw new Error('Shopify executor not configured')
    }

    const url = `https://${this.shopDomain}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': this.accessToken,
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorBody = await response.text()
      let errorMessage = `Shopify API error: ${response.status} ${response.statusText}`
      try {
        const errorJson = JSON.parse(errorBody)
        if (errorJson.errors) {
          errorMessage = typeof errorJson.errors === 'string'
            ? errorJson.errors
            : JSON.stringify(errorJson.errors)
        }
      } catch {
        errorMessage = errorBody || errorMessage
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }
}

// ============================================================================
// Action Registry for Workflow Engine Integration
// ============================================================================

/**
 * Registry entry for workflow engine integration
 */
export interface ShopifyActionRegistryEntry {
  type: ShopifyActionType
  definition: ActionDefinition
  composioSlug?: string
}

/**
 * Action registry for workflow engine registration
 * Maps Shopify actions to Composio tool slugs where available
 */
export const SHOPIFY_ACTION_REGISTRY: ShopifyActionRegistryEntry[] = [
  { type: 'shopify_get_order', definition: SHOPIFY_ACTION_DEFINITIONS.shopify_get_order, composioSlug: 'SHOPIFY_GET_ORDER' },
  { type: 'shopify_update_order', definition: SHOPIFY_ACTION_DEFINITIONS.shopify_update_order, composioSlug: 'SHOPIFY_UPDATE_ORDER' },
  { type: 'shopify_fulfill_order', definition: SHOPIFY_ACTION_DEFINITIONS.shopify_fulfill_order, composioSlug: 'SHOPIFY_CREATE_FULFILLMENT' },
  { type: 'shopify_cancel_order', definition: SHOPIFY_ACTION_DEFINITIONS.shopify_cancel_order, composioSlug: 'SHOPIFY_CANCEL_ORDER' },
  { type: 'shopify_refund_order', definition: SHOPIFY_ACTION_DEFINITIONS.shopify_refund_order, composioSlug: 'SHOPIFY_CREATE_REFUND' },
  { type: 'shopify_get_product', definition: SHOPIFY_ACTION_DEFINITIONS.shopify_get_product, composioSlug: 'SHOPIFY_GET_PRODUCT' },
  { type: 'shopify_update_inventory', definition: SHOPIFY_ACTION_DEFINITIONS.shopify_update_inventory, composioSlug: 'SHOPIFY_UPDATE_INVENTORY' },
  { type: 'shopify_get_customer', definition: SHOPIFY_ACTION_DEFINITIONS.shopify_get_customer, composioSlug: 'SHOPIFY_GET_CUSTOMER' },
  { type: 'shopify_tag_customer', definition: SHOPIFY_ACTION_DEFINITIONS.shopify_tag_customer, composioSlug: 'SHOPIFY_UPDATE_CUSTOMER' },
  { type: 'shopify_send_notification', definition: SHOPIFY_ACTION_DEFINITIONS.shopify_send_notification },
  { type: 'shopify_create_draft_order', definition: SHOPIFY_ACTION_DEFINITIONS.shopify_create_draft_order, composioSlug: 'SHOPIFY_CREATE_DRAFT_ORDER' },
  { type: 'shopify_add_order_note', definition: SHOPIFY_ACTION_DEFINITIONS.shopify_add_order_note },
]

/**
 * Get action registry entries by category
 */
export function getActionsByCategory(
  category: ActionDefinition['category']
): ShopifyActionRegistryEntry[] {
  return SHOPIFY_ACTION_REGISTRY.filter(entry => entry.definition.category === category)
}

/**
 * Get action registry entry by type
 */
export function getActionByType(type: ShopifyActionType): ShopifyActionRegistryEntry | undefined {
  return SHOPIFY_ACTION_REGISTRY.find(entry => entry.type === type)
}

/**
 * Check if an action type is valid
 */
export function isValidShopifyAction(type: string): type is ShopifyActionType {
  return SHOPIFY_ACTION_REGISTRY.some(entry => entry.type === type)
}

// ============================================================================
// Cross-Service Action Types
// ============================================================================

/**
 * Cross-service action types for integrations
 */
export type CrossServiceActionType =
  | 'sync_order_to_accounting'
  | 'send_order_confirmation'
  | 'update_inventory_on_sale'
  | 'notify_low_stock'
  | 'create_customer_in_crm'

/**
 * Accounting system configuration
 */
export interface AccountingSystemConfig {
  type: 'quickbooks' | 'xero' | 'freshbooks' | 'wave'
  credentials: {
    accessToken: string
    refreshToken?: string
    realmId?: string // QuickBooks specific
    tenantId?: string // Xero specific
  }
  apiEndpoint?: string
}

/**
 * Notification channel configuration
 */
export interface NotificationChannelConfig {
  type: 'email' | 'slack' | 'whatsapp' | 'sms' | 'teams'
  credentials: {
    apiKey?: string
    accessToken?: string
    webhookUrl?: string
    fromEmail?: string
    fromPhone?: string
    channelId?: string
  }
}

/**
 * CRM system configuration
 */
export interface CRMSystemConfig {
  type: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho'
  credentials: {
    accessToken: string
    refreshToken?: string
    instanceUrl?: string // Salesforce specific
    portalId?: string // HubSpot specific
  }
  apiEndpoint?: string
}

// ============================================================================
// Cross-Service Action Input Types
// ============================================================================

export interface SyncOrderToAccountingInputs {
  orderId: string
  accountingSystem: AccountingSystemConfig
  options?: {
    createInvoice?: boolean
    markAsPaid?: boolean
    includeShipping?: boolean
    includeTax?: boolean
    customerMapping?: 'create_new' | 'match_by_email' | 'match_by_name'
    accountCodes?: {
      sales?: string
      shipping?: string
      tax?: string
      discount?: string
    }
  }
}

export interface SendOrderConfirmationInputs {
  orderId: string
  channel: NotificationChannelConfig
  template?: {
    subject?: string
    bodyTemplate?: string
    includeItemList?: boolean
    includeTrackingLink?: boolean
    includeSupportContact?: boolean
    customFields?: Record<string, string>
  }
  recipientOverride?: {
    email?: string
    phone?: string
  }
}

export interface UpdateInventoryOnSaleInputs {
  orderId: string
  adjustmentType: 'reduce' | 'reserve' | 'both'
  options?: {
    locationId?: string
    reduceByFullfillmentStatus?: boolean
    sendLowStockAlerts?: boolean
    lowStockThreshold?: number
    notificationChannel?: NotificationChannelConfig
  }
}

export interface NotifyLowStockInputs {
  products: Array<{
    productId: string
    variantId: string
    sku: string
    title: string
    currentStock: number
    threshold: number
    locationId?: string
    locationName?: string
  }>
  channels: NotificationChannelConfig[]
  options?: {
    aggregateNotifications?: boolean
    includeReorderSuggestion?: boolean
    urgencyLevel?: 'low' | 'medium' | 'high' | 'critical'
    includeHistoricalData?: boolean
  }
}

export interface CreateCustomerInCRMInputs {
  customerId: string
  crmSystem: CRMSystemConfig
  options?: {
    includeOrderHistory?: boolean
    includeTotalSpent?: boolean
    includeAddresses?: boolean
    assignToOwner?: string
    defaultPipeline?: string
    defaultStage?: string
    customFields?: Record<string, unknown>
    tags?: string[]
  }
}

// ============================================================================
// Cross-Service Action Output Types
// ============================================================================

export interface SyncOrderToAccountingOutput {
  success: boolean
  accountingSystem: string
  invoiceId?: string
  invoiceNumber?: string
  invoiceUrl?: string
  paymentId?: string
  customerId?: string
  syncedAt: string
  totalAmount: number
  currency: string
  lineItemsCount: number
  errors?: string[]
}

export interface SendOrderConfirmationOutput {
  success: boolean
  channel: string
  messageId?: string
  sentAt: string
  recipient: string
  templateUsed: string
  deliveryStatus?: 'sent' | 'delivered' | 'failed' | 'pending'
  errors?: string[]
}

export interface UpdateInventoryOnSaleOutput {
  success: boolean
  orderId: string
  adjustmentsCount: number
  adjustments: Array<{
    productId: string
    variantId: string
    sku: string
    previousStock: number
    newStock: number
    adjustment: number
    locationId: string
  }>
  lowStockAlerts: Array<{
    productId: string
    sku: string
    currentStock: number
    threshold: number
  }>
  errors?: string[]
}

export interface NotifyLowStockOutput {
  success: boolean
  notificationsSent: number
  channels: Array<{
    channel: string
    success: boolean
    messageId?: string
    error?: string
  }>
  productsNotified: number
  sentAt: string
  aggregated: boolean
}

export interface CreateCustomerInCRMOutput {
  success: boolean
  crmSystem: string
  crmContactId: string
  crmContactUrl?: string
  matchedExisting: boolean
  syncedFields: string[]
  ordersLinked?: number
  createdAt: string
  errors?: string[]
}

// ============================================================================
// Cross-Service Action Definitions
// ============================================================================

export interface CrossServiceActionDefinition {
  type: CrossServiceActionType
  name: string
  description: string
  integrations: string[]
  requiredInputs: string[]
  optionalInputs: string[]
  outputType: string
}

export const CROSS_SERVICE_ACTION_DEFINITIONS: Record<
  CrossServiceActionType,
  CrossServiceActionDefinition
> = {
  sync_order_to_accounting: {
    type: 'sync_order_to_accounting',
    name: 'Sync Order to Accounting',
    description: 'Sync Shopify order to accounting system (QuickBooks, Xero)',
    integrations: ['shopify', 'quickbooks', 'xero', 'freshbooks', 'wave'],
    requiredInputs: ['orderId', 'accountingSystem'],
    optionalInputs: ['options'],
    outputType: 'SyncOrderToAccountingOutput',
  },
  send_order_confirmation: {
    type: 'send_order_confirmation',
    name: 'Send Order Confirmation',
    description: 'Send order confirmation via email, WhatsApp, or SMS',
    integrations: ['shopify', 'email', 'whatsapp', 'sms', 'slack'],
    requiredInputs: ['orderId', 'channel'],
    optionalInputs: ['template', 'recipientOverride'],
    outputType: 'SendOrderConfirmationOutput',
  },
  update_inventory_on_sale: {
    type: 'update_inventory_on_sale',
    name: 'Update Inventory on Sale',
    description: 'Automatically adjust inventory when orders are placed',
    integrations: ['shopify'],
    requiredInputs: ['orderId', 'adjustmentType'],
    optionalInputs: ['options'],
    outputType: 'UpdateInventoryOnSaleOutput',
  },
  notify_low_stock: {
    type: 'notify_low_stock',
    name: 'Notify Low Stock',
    description: 'Send low stock alerts to Slack, email, or other channels',
    integrations: ['shopify', 'slack', 'email', 'teams'],
    requiredInputs: ['products', 'channels'],
    optionalInputs: ['options'],
    outputType: 'NotifyLowStockOutput',
  },
  create_customer_in_crm: {
    type: 'create_customer_in_crm',
    name: 'Create Customer in CRM',
    description: 'Sync Shopify customer to CRM (HubSpot, Salesforce)',
    integrations: ['shopify', 'hubspot', 'salesforce', 'pipedrive', 'zoho'],
    requiredInputs: ['customerId', 'crmSystem'],
    optionalInputs: ['options'],
    outputType: 'CreateCustomerInCRMOutput',
  },
}

// ============================================================================
// Cross-Service Action Executor
// ============================================================================

/**
 * CrossServiceActionExecutor - Executes cross-service workflow actions
 *
 * Handles integrations between Shopify and external services like:
 * - Accounting systems (QuickBooks, Xero)
 * - Notification channels (Email, Slack, WhatsApp)
 * - CRM systems (HubSpot, Salesforce)
 */
export class CrossServiceActionExecutor {
  private shopifyConfig: { shopDomain: string; accessToken: string; apiVersion?: string } | null =
    null

  /**
   * Configure the executor with Shopify credentials
   */
  configureShopify(config: {
    shopDomain: string
    accessToken: string
    apiVersion?: string
  }): void {
    this.shopifyConfig = config
  }

  /**
   * Execute a cross-service action
   */
  async execute(
    actionType: CrossServiceActionType,
    inputs: Record<string, unknown>
  ): Promise<{
    success: boolean
    data?: unknown
    error?: string
    executionTimeMs: number
  }> {
    const startTime = Date.now()

    try {
      let result: unknown

      switch (actionType) {
        case 'sync_order_to_accounting':
          result = await this.executeSyncOrderToAccounting(
            inputs as unknown as SyncOrderToAccountingInputs
          )
          break
        case 'send_order_confirmation':
          result = await this.executeSendOrderConfirmation(
            inputs as unknown as SendOrderConfirmationInputs
          )
          break
        case 'update_inventory_on_sale':
          result = await this.executeUpdateInventoryOnSale(
            inputs as unknown as UpdateInventoryOnSaleInputs
          )
          break
        case 'notify_low_stock':
          result = await this.executeNotifyLowStock(inputs as unknown as NotifyLowStockInputs)
          break
        case 'create_customer_in_crm':
          result = await this.executeCreateCustomerInCRM(
            inputs as unknown as CreateCustomerInCRMInputs
          )
          break
        default:
          throw new Error(`Unknown cross-service action: ${actionType}`)
      }

      return {
        success: true,
        data: result,
        executionTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  // ============================================================================
  // Action Implementations
  // ============================================================================

  /**
   * Sync Order to Accounting System (QuickBooks/Xero)
   */
  private async executeSyncOrderToAccounting(
    inputs: SyncOrderToAccountingInputs
  ): Promise<SyncOrderToAccountingOutput> {
    const { orderId, accountingSystem, options } = inputs

    // First, fetch the Shopify order
    const order = await this.fetchShopifyOrder(orderId)

    // Map order to accounting system format
    const invoiceData = this.mapOrderToInvoice(order, accountingSystem.type, options)

    // Create invoice in accounting system
    let invoiceResult: { id: string; number: string; url?: string }

    switch (accountingSystem.type) {
      case 'quickbooks':
        invoiceResult = await this.createQuickBooksInvoice(
          invoiceData,
          accountingSystem.credentials
        )
        break
      case 'xero':
        invoiceResult = await this.createXeroInvoice(invoiceData, accountingSystem.credentials)
        break
      case 'freshbooks':
        invoiceResult = await this.createFreshBooksInvoice(
          invoiceData,
          accountingSystem.credentials
        )
        break
      case 'wave':
        invoiceResult = await this.createWaveInvoice(invoiceData, accountingSystem.credentials)
        break
      default:
        throw new Error(`Unsupported accounting system: ${accountingSystem.type}`)
    }

    return {
      success: true,
      accountingSystem: accountingSystem.type,
      invoiceId: invoiceResult.id,
      invoiceNumber: invoiceResult.number,
      invoiceUrl: invoiceResult.url,
      syncedAt: new Date().toISOString(),
      totalAmount: order.total_price,
      currency: order.currency,
      lineItemsCount: order.line_items.length,
    }
  }

  /**
   * Send Order Confirmation (Email/WhatsApp)
   */
  private async executeSendOrderConfirmation(
    inputs: SendOrderConfirmationInputs
  ): Promise<SendOrderConfirmationOutput> {
    const { orderId, channel, template, recipientOverride } = inputs

    // Fetch order details
    const order = await this.fetchShopifyOrder(orderId)

    // Determine recipient
    const recipient = recipientOverride?.email || recipientOverride?.phone || order.email

    // Build message content
    const messageContent = this.buildOrderConfirmationMessage(order, template)

    // Send via appropriate channel
    let messageId: string | undefined

    switch (channel.type) {
      case 'email':
        messageId = await this.sendEmailNotification(
          recipient,
          messageContent,
          channel.credentials
        )
        break
      case 'slack':
        messageId = await this.sendSlackNotification(
          channel.credentials.channelId || recipient,
          messageContent,
          channel.credentials
        )
        break
      case 'whatsapp':
        messageId = await this.sendWhatsAppNotification(
          recipientOverride?.phone || order.phone || '',
          messageContent,
          channel.credentials
        )
        break
      case 'sms':
        messageId = await this.sendSMSNotification(
          recipientOverride?.phone || order.phone || '',
          messageContent,
          channel.credentials
        )
        break
      case 'teams':
        messageId = await this.sendTeamsNotification(
          channel.credentials.webhookUrl || '',
          messageContent,
          channel.credentials
        )
        break
      default:
        throw new Error(`Unsupported notification channel: ${channel.type}`)
    }

    return {
      success: true,
      channel: channel.type,
      messageId,
      sentAt: new Date().toISOString(),
      recipient,
      templateUsed: template?.bodyTemplate ? 'custom' : 'default',
      deliveryStatus: 'sent',
    }
  }

  /**
   * Update Inventory on Sale
   */
  private async executeUpdateInventoryOnSale(
    inputs: UpdateInventoryOnSaleInputs
  ): Promise<UpdateInventoryOnSaleOutput> {
    const { orderId, adjustmentType, options } = inputs

    // Fetch order details
    const order = await this.fetchShopifyOrder(orderId)

    const adjustments: UpdateInventoryOnSaleOutput['adjustments'] = []
    const lowStockAlerts: UpdateInventoryOnSaleOutput['lowStockAlerts'] = []

    // Process each line item
    for (const lineItem of order.line_items) {
      if (!lineItem.variant_id) continue

      // Get current inventory
      const inventoryItemId = lineItem.inventory_item_id || (lineItem as Record<string, unknown>).variant_inventory_item_id
      if (!inventoryItemId) continue

      const locationId = options?.locationId || 'primary'

      // Calculate adjustment
      const adjustment = adjustmentType === 'reserve' ? 0 : -lineItem.quantity

      // In a real implementation, we would:
      // 1. Fetch current inventory level
      // 2. Apply the adjustment
      // 3. Record the result

      const previousStock = 100 // Placeholder - would fetch actual value
      const newStock = previousStock + adjustment

      adjustments.push({
        productId: String(lineItem.product_id),
        variantId: String(lineItem.variant_id),
        sku: lineItem.sku || '',
        previousStock,
        newStock,
        adjustment,
        locationId,
      })

      // Check for low stock
      const threshold = options?.lowStockThreshold || 10
      if (newStock <= threshold && options?.sendLowStockAlerts) {
        lowStockAlerts.push({
          productId: String(lineItem.product_id),
          sku: lineItem.sku || '',
          currentStock: newStock,
          threshold,
        })
      }
    }

    // Send low stock notifications if configured
    if (lowStockAlerts.length > 0 && options?.notificationChannel) {
      await this.executeNotifyLowStock({
        products: lowStockAlerts.map((alert) => ({
          productId: alert.productId,
          variantId: '',
          sku: alert.sku,
          title: '',
          currentStock: alert.currentStock,
          threshold: alert.threshold,
        })),
        channels: [options.notificationChannel],
      })
    }

    return {
      success: true,
      orderId,
      adjustmentsCount: adjustments.length,
      adjustments,
      lowStockAlerts,
    }
  }

  /**
   * Notify Low Stock (Slack/Email)
   */
  private async executeNotifyLowStock(
    inputs: NotifyLowStockInputs
  ): Promise<NotifyLowStockOutput> {
    const { products, channels, options } = inputs

    const channelResults: NotifyLowStockOutput['channels'] = []

    // Build notification message
    const message = this.buildLowStockMessage(products, options)

    // Send to each channel
    for (const channel of channels) {
      try {
        let messageId: string | undefined

        switch (channel.type) {
          case 'slack':
            messageId = await this.sendSlackNotification(
              channel.credentials.channelId || '',
              message,
              channel.credentials
            )
            break
          case 'email':
            messageId = await this.sendEmailNotification(
              channel.credentials.fromEmail || '',
              message,
              channel.credentials
            )
            break
          case 'teams':
            messageId = await this.sendTeamsNotification(
              channel.credentials.webhookUrl || '',
              message,
              channel.credentials
            )
            break
          default:
            throw new Error(`Unsupported channel: ${channel.type}`)
        }

        channelResults.push({
          channel: channel.type,
          success: true,
          messageId,
        })
      } catch (error) {
        channelResults.push({
          channel: channel.type,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return {
      success: channelResults.some((r) => r.success),
      notificationsSent: channelResults.filter((r) => r.success).length,
      channels: channelResults,
      productsNotified: products.length,
      sentAt: new Date().toISOString(),
      aggregated: options?.aggregateNotifications ?? true,
    }
  }

  /**
   * Create Customer in CRM (HubSpot/Salesforce)
   */
  private async executeCreateCustomerInCRM(
    inputs: CreateCustomerInCRMInputs
  ): Promise<CreateCustomerInCRMOutput> {
    const { customerId, crmSystem, options } = inputs

    // Fetch customer details from Shopify
    const customer = await this.fetchShopifyCustomer(customerId)

    // Map customer to CRM format
    const contactData = this.mapCustomerToContact(customer, crmSystem.type, options)

    // Check for existing contact
    let existingContact: { id: string; url?: string } | null = null
    let isNew = true

    switch (crmSystem.type) {
      case 'hubspot':
        existingContact = await this.findHubSpotContact(
          customer.email,
          crmSystem.credentials
        )
        if (!existingContact) {
          existingContact = await this.createHubSpotContact(
            contactData,
            crmSystem.credentials
          )
        } else {
          isNew = false
          await this.updateHubSpotContact(
            existingContact.id,
            contactData,
            crmSystem.credentials
          )
        }
        break
      case 'salesforce':
        existingContact = await this.findSalesforceContact(
          customer.email,
          crmSystem.credentials
        )
        if (!existingContact) {
          existingContact = await this.createSalesforceContact(
            contactData,
            crmSystem.credentials
          )
        } else {
          isNew = false
          await this.updateSalesforceContact(
            existingContact.id,
            contactData,
            crmSystem.credentials
          )
        }
        break
      case 'pipedrive':
        existingContact = await this.findPipedriveContact(
          customer.email,
          crmSystem.credentials
        )
        if (!existingContact) {
          existingContact = await this.createPipedriveContact(
            contactData,
            crmSystem.credentials
          )
        } else {
          isNew = false
        }
        break
      case 'zoho':
        existingContact = await this.findZohoContact(customer.email, crmSystem.credentials)
        if (!existingContact) {
          existingContact = await this.createZohoContact(contactData, crmSystem.credentials)
        } else {
          isNew = false
        }
        break
      default:
        throw new Error(`Unsupported CRM system: ${crmSystem.type}`)
    }

    return {
      success: true,
      crmSystem: crmSystem.type,
      crmContactId: existingContact?.id || '',
      crmContactUrl: existingContact?.url,
      matchedExisting: !isNew,
      syncedFields: Object.keys(contactData),
      ordersLinked: options?.includeOrderHistory ? customer.orders_count : undefined,
      createdAt: new Date().toISOString(),
    }
  }

  // ============================================================================
  // Helper Methods - Shopify API
  // ============================================================================

  private async fetchShopifyOrder(orderId: string): Promise<{
    id: number
    name: string
    email: string
    phone: string
    total_price: number
    subtotal_price: number
    total_tax: number
    total_shipping: number
    currency: string
    line_items: Array<{
      id: number
      product_id: number
      variant_id: number
      inventory_item_id?: number
      title: string
      quantity: number
      price: number
      sku: string
    }>
    customer: {
      id: number
      email: string
      first_name: string
      last_name: string
    }
    shipping_address?: {
      address1: string
      city: string
      country: string
    }
    created_at: string
  }> {
    if (!this.shopifyConfig) {
      throw new Error('Shopify not configured')
    }

    const url = `https://${this.shopifyConfig.shopDomain}/admin/api/${this.shopifyConfig.apiVersion || '2024-01'}/orders/${orderId}.json`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.shopifyConfig.accessToken,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.status}`)
    }

    const data = await response.json()
    return data.order
  }

  private async fetchShopifyCustomer(customerId: string): Promise<{
    id: number
    email: string
    first_name: string
    last_name: string
    phone: string
    orders_count: number
    total_spent: string
    tags: string
    addresses: Array<{
      address1: string
      city: string
      country: string
      zip: string
    }>
    default_address?: {
      address1: string
      city: string
      country: string
      zip: string
    }
    created_at: string
    accepts_marketing: boolean
    note?: string
  }> {
    if (!this.shopifyConfig) {
      throw new Error('Shopify not configured')
    }

    const url = `https://${this.shopifyConfig.shopDomain}/admin/api/${this.shopifyConfig.apiVersion || '2024-01'}/customers/${customerId}.json`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.shopifyConfig.accessToken,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch customer: ${response.status}`)
    }

    const data = await response.json()
    return data.customer
  }

  // ============================================================================
  // Helper Methods - Accounting
  // ============================================================================

  private mapOrderToInvoice(
    order: Awaited<ReturnType<typeof this.fetchShopifyOrder>>,
    _accountingType: string,
    _options?: SyncOrderToAccountingInputs['options']
  ): Record<string, unknown> {
    return {
      customer_email: order.email,
      customer_name: `${order.customer.first_name} ${order.customer.last_name}`,
      invoice_number: order.name,
      date: order.created_at,
      due_date: order.created_at,
      currency: order.currency,
      line_items: order.line_items.map((item) => ({
        description: item.title,
        quantity: item.quantity,
        unit_price: item.price,
        amount: item.quantity * item.price,
      })),
      subtotal: order.subtotal_price,
      tax: order.total_tax,
      shipping: order.total_shipping,
      total: order.total_price,
    }
  }

  private async createQuickBooksInvoice(
    _invoiceData: Record<string, unknown>,
    _credentials: AccountingSystemConfig['credentials']
  ): Promise<{ id: string; number: string; url?: string }> {
    // Placeholder - actual QuickBooks API integration
    return {
      id: `qb_${Date.now()}`,
      number: `INV-${Date.now()}`,
      url: 'https://quickbooks.intuit.com/invoice/xxx',
    }
  }

  private async createXeroInvoice(
    _invoiceData: Record<string, unknown>,
    _credentials: AccountingSystemConfig['credentials']
  ): Promise<{ id: string; number: string; url?: string }> {
    // Placeholder - actual Xero API integration
    return {
      id: `xero_${Date.now()}`,
      number: `INV-${Date.now()}`,
      url: 'https://go.xero.com/invoice/xxx',
    }
  }

  private async createFreshBooksInvoice(
    _invoiceData: Record<string, unknown>,
    _credentials: AccountingSystemConfig['credentials']
  ): Promise<{ id: string; number: string; url?: string }> {
    // Placeholder - actual FreshBooks API integration
    return {
      id: `fb_${Date.now()}`,
      number: `INV-${Date.now()}`,
    }
  }

  private async createWaveInvoice(
    _invoiceData: Record<string, unknown>,
    _credentials: AccountingSystemConfig['credentials']
  ): Promise<{ id: string; number: string; url?: string }> {
    // Placeholder - actual Wave API integration
    return {
      id: `wave_${Date.now()}`,
      number: `INV-${Date.now()}`,
    }
  }

  // ============================================================================
  // Helper Methods - Notifications
  // ============================================================================

  private buildOrderConfirmationMessage(
    order: Awaited<ReturnType<typeof this.fetchShopifyOrder>>,
    template?: SendOrderConfirmationInputs['template']
  ): { subject: string; body: string } {
    const subject = template?.subject || `Order Confirmation - ${order.name}`

    let body = template?.bodyTemplate || `
Thank you for your order!

Order: ${order.name}
Date: ${new Date(order.created_at).toLocaleDateString()}

${template?.includeItemList !== false ? order.line_items.map((item) => `- ${item.title} x${item.quantity} - $${item.price}`).join('\n') : ''}

Total: $${order.total_price} ${order.currency}

${template?.includeSupportContact ? '\nNeed help? Contact us at support@example.com' : ''}
    `.trim()

    // Replace custom fields
    if (template?.customFields) {
      for (const [key, value] of Object.entries(template.customFields)) {
        body = body.replace(new RegExp(`{{${key}}}`, 'g'), value)
      }
    }

    return { subject, body }
  }

  private buildLowStockMessage(
    products: NotifyLowStockInputs['products'],
    options?: NotifyLowStockInputs['options']
  ): { subject: string; body: string } {
    const urgencyEmoji =
      options?.urgencyLevel === 'critical'
        ? '🚨'
        : options?.urgencyLevel === 'high'
          ? '⚠️'
          : '📦'

    const subject = `${urgencyEmoji} Low Stock Alert - ${products.length} products`

    const body = `
Low Stock Alert

${products
  .map(
    (p) => `
• ${p.title} (SKU: ${p.sku})
  Current: ${p.currentStock} | Threshold: ${p.threshold}
  ${p.locationName ? `Location: ${p.locationName}` : ''}
`
  )
  .join('')}

${options?.includeReorderSuggestion ? '\nConsider reordering these items soon.' : ''}
    `.trim()

    return { subject, body }
  }

  private async sendEmailNotification(
    _recipient: string,
    _message: { subject: string; body: string },
    _credentials: NotificationChannelConfig['credentials']
  ): Promise<string> {
    // Placeholder - actual email API integration (SendGrid, SES, etc.)
    return `email_${Date.now()}`
  }

  private async sendSlackNotification(
    _channel: string,
    message: { subject: string; body: string },
    credentials: NotificationChannelConfig['credentials']
  ): Promise<string> {
    // Actual Slack webhook integration
    if (credentials.webhookUrl) {
      await fetch(credentials.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `*${message.subject}*\n${message.body}`,
        }),
      })
    }
    return `slack_${Date.now()}`
  }

  private async sendWhatsAppNotification(
    _phone: string,
    _message: { subject: string; body: string },
    _credentials: NotificationChannelConfig['credentials']
  ): Promise<string> {
    // Placeholder - actual WhatsApp Business API integration
    return `wa_${Date.now()}`
  }

  private async sendSMSNotification(
    _phone: string,
    _message: { subject: string; body: string },
    _credentials: NotificationChannelConfig['credentials']
  ): Promise<string> {
    // Placeholder - actual SMS API integration (Twilio, etc.)
    return `sms_${Date.now()}`
  }

  private async sendTeamsNotification(
    webhookUrl: string,
    message: { subject: string; body: string },
    _credentials: NotificationChannelConfig['credentials']
  ): Promise<string> {
    // Teams webhook integration
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          '@type': 'MessageCard',
          summary: message.subject,
          sections: [
            {
              activityTitle: message.subject,
              text: message.body,
            },
          ],
        }),
      })
    }
    return `teams_${Date.now()}`
  }

  // ============================================================================
  // Helper Methods - CRM
  // ============================================================================

  private mapCustomerToContact(
    customer: Awaited<ReturnType<typeof this.fetchShopifyCustomer>>,
    _crmType: string,
    options?: CreateCustomerInCRMInputs['options']
  ): Record<string, unknown> {
    const contact: Record<string, unknown> = {
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
    }

    if (options?.includeTotalSpent) {
      contact.total_spent = customer.total_spent
    }

    if (options?.includeOrderHistory) {
      contact.orders_count = customer.orders_count
    }

    if (options?.includeAddresses && customer.default_address) {
      contact.address = customer.default_address.address1
      contact.city = customer.default_address.city
      contact.country = customer.default_address.country
      contact.zip = customer.default_address.zip
    }

    if (options?.tags) {
      contact.tags = options.tags
    }

    if (options?.customFields) {
      Object.assign(contact, options.customFields)
    }

    return contact
  }

  private async findHubSpotContact(
    _email: string,
    _credentials: CRMSystemConfig['credentials']
  ): Promise<{ id: string; url?: string } | null> {
    // Placeholder - actual HubSpot API search
    return null
  }

  private async createHubSpotContact(
    _contactData: Record<string, unknown>,
    _credentials: CRMSystemConfig['credentials']
  ): Promise<{ id: string; url?: string }> {
    // Placeholder - actual HubSpot API create
    return {
      id: `hs_${Date.now()}`,
      url: 'https://app.hubspot.com/contacts/xxx',
    }
  }

  private async updateHubSpotContact(
    _contactId: string,
    _contactData: Record<string, unknown>,
    _credentials: CRMSystemConfig['credentials']
  ): Promise<void> {
    // Placeholder - actual HubSpot API update
  }

  private async findSalesforceContact(
    _email: string,
    _credentials: CRMSystemConfig['credentials']
  ): Promise<{ id: string; url?: string } | null> {
    // Placeholder - actual Salesforce API search
    return null
  }

  private async createSalesforceContact(
    _contactData: Record<string, unknown>,
    _credentials: CRMSystemConfig['credentials']
  ): Promise<{ id: string; url?: string }> {
    // Placeholder - actual Salesforce API create
    return {
      id: `sf_${Date.now()}`,
      url: 'https://login.salesforce.com/xxx',
    }
  }

  private async updateSalesforceContact(
    _contactId: string,
    _contactData: Record<string, unknown>,
    _credentials: CRMSystemConfig['credentials']
  ): Promise<void> {
    // Placeholder - actual Salesforce API update
  }

  private async findPipedriveContact(
    _email: string,
    _credentials: CRMSystemConfig['credentials']
  ): Promise<{ id: string; url?: string } | null> {
    // Placeholder - actual Pipedrive API search
    return null
  }

  private async createPipedriveContact(
    _contactData: Record<string, unknown>,
    _credentials: CRMSystemConfig['credentials']
  ): Promise<{ id: string; url?: string }> {
    // Placeholder - actual Pipedrive API create
    return {
      id: `pd_${Date.now()}`,
    }
  }

  private async findZohoContact(
    _email: string,
    _credentials: CRMSystemConfig['credentials']
  ): Promise<{ id: string; url?: string } | null> {
    // Placeholder - actual Zoho API search
    return null
  }

  private async createZohoContact(
    _contactData: Record<string, unknown>,
    _credentials: CRMSystemConfig['credentials']
  ): Promise<{ id: string; url?: string }> {
    // Placeholder - actual Zoho API create
    return {
      id: `zoho_${Date.now()}`,
    }
  }
}

// ============================================================================
// Singleton Exports
// ============================================================================

export const shopifyActionExecutor = new ShopifyActionExecutor()
export const crossServiceActionExecutor = new CrossServiceActionExecutor()

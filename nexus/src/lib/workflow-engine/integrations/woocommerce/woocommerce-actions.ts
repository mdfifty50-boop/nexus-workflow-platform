/**
 * WooCommerce E-commerce Actions - Workflow Engine Integration
 *
 * Provides WooCommerce-specific workflow actions for the workflow engine.
 * These actions can be used in step execution for e-commerce automation workflows.
 *
 * Features:
 * - Order management (get, update, update status, add note, refund)
 * - Product and inventory management
 * - Customer management
 * - Order email notifications
 *
 * @module WooCommerceActions
 */

import type { ExecutionState } from '../../../../types/workflow-execution'

// ============================================================================
// Action Types
// ============================================================================

/**
 * All available WooCommerce action types
 */
export type WooCommerceActionType =
  | 'woo_get_order'
  | 'woo_update_order'
  | 'woo_update_order_status'
  | 'woo_add_order_note'
  | 'woo_create_refund'
  | 'woo_get_product'
  | 'woo_update_product'
  | 'woo_update_stock'
  | 'woo_get_customer'
  | 'woo_create_customer'
  | 'woo_send_order_email'

/**
 * Base interface for all WooCommerce actions
 */
export interface WooCommerceActionBase {
  type: WooCommerceActionType
  inputs: Record<string, unknown>
}

// ============================================================================
// Action Input Types
// ============================================================================

export interface WooCommerceGetOrderInputs {
  orderId: number | string
  includeMeta?: boolean
  includeLineItems?: boolean
  includeRefunds?: boolean
}

export interface WooCommerceUpdateOrderInputs {
  orderId: number | string
  billing?: WooCommerceAddressInput
  shipping?: WooCommerceAddressInput
  paymentMethod?: string
  paymentMethodTitle?: string
  transactionId?: string
  customerNote?: string
  metaData?: Array<{ key: string; value: string }>
}

export interface WooCommerceUpdateOrderStatusInputs {
  orderId: number | string
  status: WooCommerceOrderStatus
  note?: string
  sendNotification?: boolean
}

export interface WooCommerceAddOrderNoteInputs {
  orderId: number | string
  note: string
  customerNote?: boolean // Whether this is a customer-facing note
  addedByUser?: boolean
}

export interface WooCommerceCreateRefundInputs {
  orderId: number | string
  amount?: string
  reason?: string
  refundedBy?: number
  lineItems?: Array<{
    lineItemId: number
    quantity: number
    refundTotal?: string
    refundTax?: Array<{ id: number; refundTotal: string }>
  }>
  apiRefund?: boolean // Whether to issue refund through payment gateway
  restockItems?: boolean
}

export interface WooCommerceGetProductInputs {
  productId: number | string
  includeVariations?: boolean
  includeImages?: boolean
  includeAttributes?: boolean
  includeMetaData?: boolean
}

export interface WooCommerceUpdateProductInputs {
  productId: number | string
  name?: string
  slug?: string
  description?: string
  shortDescription?: string
  sku?: string
  regularPrice?: string
  salePrice?: string
  status?: 'draft' | 'pending' | 'private' | 'publish'
  catalogVisibility?: 'visible' | 'catalog' | 'search' | 'hidden'
  categories?: Array<{ id: number }>
  tags?: Array<{ id: number }>
  metaData?: Array<{ key: string; value: string }>
}

export interface WooCommerceUpdateStockInputs {
  productId: number | string
  stockQuantity?: number
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder'
  manageStock?: boolean
  backorders?: 'no' | 'notify' | 'yes'
  lowStockAmount?: number
}

export interface WooCommerceGetCustomerInputs {
  customerId: number | string
  includeOrders?: boolean
  includeDownloads?: boolean
  includeMetaData?: boolean
}

export interface WooCommerceCreateCustomerInputs {
  email: string
  firstName?: string
  lastName?: string
  username?: string
  password?: string
  billing?: WooCommerceAddressInput
  shipping?: WooCommerceAddressInput
  metaData?: Array<{ key: string; value: string }>
}

export interface WooCommerceSendOrderEmailInputs {
  orderId: number | string
  emailType: WooCommerceEmailType
  recipientEmail?: string // Override default recipient
}

export interface WooCommerceAddressInput {
  firstName?: string
  lastName?: string
  company?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  postcode?: string
  country?: string
  email?: string
  phone?: string
}

// ============================================================================
// Enums & Constants
// ============================================================================

export type WooCommerceOrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed'
  | 'trash'

export type WooCommerceEmailType =
  | 'new_order'
  | 'cancelled_order'
  | 'failed_order'
  | 'on_hold_order'
  | 'processing_order'
  | 'completed_order'
  | 'refunded_order'
  | 'customer_note'
  | 'customer_invoice'

// ============================================================================
// Action Output Types
// ============================================================================

export interface WooCommerceOrderOutput {
  id: number
  parentId: number
  number: string
  orderKey: string
  createdVia: string
  version: string
  status: WooCommerceOrderStatus
  currency: string
  dateCreated: string
  dateCreatedGmt: string
  dateModified: string
  dateModifiedGmt: string
  discountTotal: string
  discountTax: string
  shippingTotal: string
  shippingTax: string
  cartTax: string
  total: string
  totalTax: string
  pricesIncludeTax: boolean
  customerId: number
  customerIpAddress: string
  customerUserAgent: string
  customerNote: string
  billing: WooCommerceAddressOutput
  shipping: WooCommerceAddressOutput
  paymentMethod: string
  paymentMethodTitle: string
  transactionId: string
  datePaid?: string
  datePaidGmt?: string
  dateCompleted?: string
  dateCompletedGmt?: string
  cartHash: string
  metaData: Array<{ id: number; key: string; value: string }>
  lineItems: WooCommerceLineItemOutput[]
  taxLines: WooCommerceTaxLineOutput[]
  shippingLines: WooCommerceShippingLineOutput[]
  feeLines: WooCommerceFeeLineOutput[]
  couponLines: WooCommerceCouponLineOutput[]
  refunds: WooCommerceRefundSummaryOutput[]
}

export interface WooCommerceAddressOutput {
  firstName: string
  lastName: string
  company: string
  address1: string
  address2: string
  city: string
  state: string
  postcode: string
  country: string
  email?: string
  phone?: string
}

export interface WooCommerceLineItemOutput {
  id: number
  name: string
  productId: number
  variationId: number
  quantity: number
  taxClass: string
  subtotal: string
  subtotalTax: string
  total: string
  totalTax: string
  taxes: Array<{ id: number; total: string; subtotal: string }>
  metaData: Array<{ id: number; key: string; value: string }>
  sku: string
  price: number
}

export interface WooCommerceTaxLineOutput {
  id: number
  rateCode: string
  rateId: number
  label: string
  compound: boolean
  taxTotal: string
  shippingTaxTotal: string
  metaData: Array<{ id: number; key: string; value: string }>
}

export interface WooCommerceShippingLineOutput {
  id: number
  methodTitle: string
  methodId: string
  total: string
  totalTax: string
  taxes: Array<{ id: number; total: string }>
  metaData: Array<{ id: number; key: string; value: string }>
}

export interface WooCommerceFeeLineOutput {
  id: number
  name: string
  taxClass: string
  taxStatus: string
  total: string
  totalTax: string
  taxes: Array<{ id: number; total: string; subtotal: string }>
  metaData: Array<{ id: number; key: string; value: string }>
}

export interface WooCommerceCouponLineOutput {
  id: number
  code: string
  discount: string
  discountTax: string
  metaData: Array<{ id: number; key: string; value: string }>
}

export interface WooCommerceRefundSummaryOutput {
  id: number
  reason: string
  total: string
}

export interface WooCommerceProductOutput {
  id: number
  name: string
  slug: string
  permalink: string
  dateCreated: string
  dateCreatedGmt: string
  dateModified: string
  dateModifiedGmt: string
  type: 'simple' | 'grouped' | 'external' | 'variable'
  status: 'draft' | 'pending' | 'private' | 'publish'
  featured: boolean
  catalogVisibility: 'visible' | 'catalog' | 'search' | 'hidden'
  description: string
  shortDescription: string
  sku: string
  price: string
  regularPrice: string
  salePrice: string
  dateOnSaleFrom?: string
  dateOnSaleTo?: string
  priceHtml: string
  onSale: boolean
  purchasable: boolean
  totalSales: number
  virtual: boolean
  downloadable: boolean
  taxStatus: string
  taxClass: string
  manageStock: boolean
  stockQuantity: number | null
  stockStatus: 'instock' | 'outofstock' | 'onbackorder'
  backorders: 'no' | 'notify' | 'yes'
  backordersAllowed: boolean
  backordered: boolean
  lowStockAmount: number | null
  soldIndividually: boolean
  weight: string
  dimensions: { length: string; width: string; height: string }
  shippingRequired: boolean
  shippingTaxable: boolean
  shippingClass: string
  shippingClassId: number
  reviewsAllowed: boolean
  averageRating: string
  ratingCount: number
  parentId: number
  purchaseNote: string
  categories: Array<{ id: number; name: string; slug: string }>
  tags: Array<{ id: number; name: string; slug: string }>
  images: WooCommerceImageOutput[]
  attributes: WooCommerceAttributeOutput[]
  variations: number[]
  metaData: Array<{ id: number; key: string; value: string }>
}

export interface WooCommerceImageOutput {
  id: number
  dateCreated: string
  dateCreatedGmt: string
  dateModified: string
  dateModifiedGmt: string
  src: string
  name: string
  alt: string
}

export interface WooCommerceAttributeOutput {
  id: number
  name: string
  position: number
  visible: boolean
  variation: boolean
  options: string[]
}

export interface WooCommerceCustomerOutput {
  id: number
  dateCreated: string
  dateCreatedGmt: string
  dateModified: string
  dateModifiedGmt: string
  email: string
  firstName: string
  lastName: string
  role: string
  username: string
  billing: WooCommerceAddressOutput
  shipping: WooCommerceAddressOutput
  isPayingCustomer: boolean
  avatarUrl: string
  metaData: Array<{ id: number; key: string; value: string }>
}

export interface WooCommerceRefundOutput {
  id: number
  dateCreated: string
  dateCreatedGmt: string
  amount: string
  reason: string
  refundedBy: number
  refundedPayment: boolean
  metaData: Array<{ id: number; key: string; value: string }>
  lineItems: Array<{
    id: number
    name: string
    productId: number
    variationId: number
    quantity: number
    taxClass: string
    subtotal: string
    subtotalTax: string
    total: string
    totalTax: string
    taxes: Array<{ id: number; total: string; subtotal: string }>
    metaData: Array<{ id: number; key: string; value: string }>
    sku: string
    price: number
  }>
}

export interface WooCommerceOrderNoteOutput {
  id: number
  author: string
  dateCreated: string
  dateCreatedGmt: string
  note: string
  customerNote: boolean
}

export interface WooCommerceEmailOutput {
  success: boolean
  sentAt: string
  recipientEmail: string
  emailType: WooCommerceEmailType
  orderId: number
}

// ============================================================================
// Execution Result Type
// ============================================================================

export interface WooCommerceExecutionResult {
  success: boolean
  data?: unknown
  error?: string
  errorCode?: string
  isRetryable?: boolean
  suggestedAction?: string
  executionTimeMs: number
  actionType: WooCommerceActionType
}

// ============================================================================
// Execution Context Type
// ============================================================================

export interface WooCommerceExecutionContext extends ExecutionState {
  wooConfig?: {
    siteUrl: string
    consumerKey: string
    consumerSecret: string
    version?: string // Default: 'wc/v3'
  }
}

// ============================================================================
// Action Definition Registry
// ============================================================================

export interface WooCommerceActionDefinition {
  type: WooCommerceActionType
  name: string
  description: string
  category: 'order' | 'product' | 'customer' | 'inventory' | 'notification'
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
 * Registry of all WooCommerce action definitions
 */
export const WOOCOMMERCE_ACTION_DEFINITIONS: Record<WooCommerceActionType, WooCommerceActionDefinition> = {
  woo_get_order: {
    type: 'woo_get_order',
    name: 'Get Order',
    description: 'Retrieve order details by order ID',
    category: 'order',
    requiredInputs: ['orderId'],
    optionalInputs: ['includeMeta', 'includeLineItems', 'includeRefunds'],
    outputType: 'WooCommerceOrderOutput',
    errorScenarios: [
      { code: 'ORDER_NOT_FOUND', message: 'Order not found', isRetryable: false, suggestedAction: 'Verify the order ID is correct' },
      { code: 'UNAUTHORIZED', message: 'API credentials invalid', isRetryable: false, suggestedAction: 'Check your WooCommerce API keys' },
      { code: 'RATE_LIMITED', message: 'API rate limit exceeded', isRetryable: true, suggestedAction: 'Wait and retry' },
    ],
  },
  woo_update_order: {
    type: 'woo_update_order',
    name: 'Update Order',
    description: 'Update order details like billing, shipping, or meta data',
    category: 'order',
    requiredInputs: ['orderId'],
    optionalInputs: ['billing', 'shipping', 'paymentMethod', 'paymentMethodTitle', 'transactionId', 'customerNote', 'metaData'],
    outputType: 'WooCommerceOrderOutput',
    errorScenarios: [
      { code: 'ORDER_NOT_FOUND', message: 'Order not found', isRetryable: false, suggestedAction: 'Verify the order ID is correct' },
      { code: 'VALIDATION_ERROR', message: 'Invalid field values', isRetryable: false, suggestedAction: 'Check the input values' },
    ],
  },
  woo_update_order_status: {
    type: 'woo_update_order_status',
    name: 'Update Order Status',
    description: 'Change the status of an order with optional note',
    category: 'order',
    requiredInputs: ['orderId', 'status'],
    optionalInputs: ['note', 'sendNotification'],
    outputType: 'WooCommerceOrderOutput',
    errorScenarios: [
      { code: 'ORDER_NOT_FOUND', message: 'Order not found', isRetryable: false, suggestedAction: 'Verify the order ID is correct' },
      { code: 'INVALID_STATUS', message: 'Invalid order status', isRetryable: false, suggestedAction: 'Use a valid WooCommerce order status' },
    ],
  },
  woo_add_order_note: {
    type: 'woo_add_order_note',
    name: 'Add Order Note',
    description: 'Add a note to an order (internal or customer-facing)',
    category: 'order',
    requiredInputs: ['orderId', 'note'],
    optionalInputs: ['customerNote', 'addedByUser'],
    outputType: 'WooCommerceOrderNoteOutput',
    errorScenarios: [
      { code: 'ORDER_NOT_FOUND', message: 'Order not found', isRetryable: false, suggestedAction: 'Verify the order ID is correct' },
      { code: 'NOTE_EMPTY', message: 'Note cannot be empty', isRetryable: false, suggestedAction: 'Provide a note text' },
    ],
  },
  woo_create_refund: {
    type: 'woo_create_refund',
    name: 'Create Refund',
    description: 'Process a refund for an order',
    category: 'order',
    requiredInputs: ['orderId'],
    optionalInputs: ['amount', 'reason', 'refundedBy', 'lineItems', 'apiRefund', 'restockItems'],
    outputType: 'WooCommerceRefundOutput',
    errorScenarios: [
      { code: 'ORDER_NOT_FOUND', message: 'Order not found', isRetryable: false, suggestedAction: 'Verify the order ID is correct' },
      { code: 'NOTHING_TO_REFUND', message: 'No refundable amount', isRetryable: false, suggestedAction: 'Order has already been fully refunded' },
      { code: 'REFUND_EXCEEDS_AMOUNT', message: 'Refund amount exceeds order total', isRetryable: false, suggestedAction: 'Reduce the refund amount' },
      { code: 'GATEWAY_ERROR', message: 'Payment gateway refund failed', isRetryable: true, suggestedAction: 'Try manual refund through payment provider' },
    ],
  },
  woo_get_product: {
    type: 'woo_get_product',
    name: 'Get Product',
    description: 'Retrieve product details by product ID',
    category: 'product',
    requiredInputs: ['productId'],
    optionalInputs: ['includeVariations', 'includeImages', 'includeAttributes', 'includeMetaData'],
    outputType: 'WooCommerceProductOutput',
    errorScenarios: [
      { code: 'PRODUCT_NOT_FOUND', message: 'Product not found', isRetryable: false, suggestedAction: 'Verify the product ID is correct' },
    ],
  },
  woo_update_product: {
    type: 'woo_update_product',
    name: 'Update Product',
    description: 'Update product details like name, description, price, or status',
    category: 'product',
    requiredInputs: ['productId'],
    optionalInputs: ['name', 'slug', 'description', 'shortDescription', 'sku', 'regularPrice', 'salePrice', 'status', 'catalogVisibility', 'categories', 'tags', 'metaData'],
    outputType: 'WooCommerceProductOutput',
    errorScenarios: [
      { code: 'PRODUCT_NOT_FOUND', message: 'Product not found', isRetryable: false, suggestedAction: 'Verify the product ID is correct' },
      { code: 'VALIDATION_ERROR', message: 'Invalid field values', isRetryable: false, suggestedAction: 'Check the input values' },
      { code: 'SKU_DUPLICATE', message: 'SKU already exists', isRetryable: false, suggestedAction: 'Use a unique SKU' },
    ],
  },
  woo_update_stock: {
    type: 'woo_update_stock',
    name: 'Update Stock',
    description: 'Update product stock quantity and status',
    category: 'inventory',
    requiredInputs: ['productId'],
    optionalInputs: ['stockQuantity', 'stockStatus', 'manageStock', 'backorders', 'lowStockAmount'],
    outputType: 'WooCommerceProductOutput',
    errorScenarios: [
      { code: 'PRODUCT_NOT_FOUND', message: 'Product not found', isRetryable: false, suggestedAction: 'Verify the product ID is correct' },
      { code: 'STOCK_MANAGEMENT_DISABLED', message: 'Stock management not enabled', isRetryable: false, suggestedAction: 'Enable stock management for this product' },
    ],
  },
  woo_get_customer: {
    type: 'woo_get_customer',
    name: 'Get Customer',
    description: 'Retrieve customer details by customer ID',
    category: 'customer',
    requiredInputs: ['customerId'],
    optionalInputs: ['includeOrders', 'includeDownloads', 'includeMetaData'],
    outputType: 'WooCommerceCustomerOutput',
    errorScenarios: [
      { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found', isRetryable: false, suggestedAction: 'Verify the customer ID is correct' },
    ],
  },
  woo_create_customer: {
    type: 'woo_create_customer',
    name: 'Create Customer',
    description: 'Create a new customer account',
    category: 'customer',
    requiredInputs: ['email'],
    optionalInputs: ['firstName', 'lastName', 'username', 'password', 'billing', 'shipping', 'metaData'],
    outputType: 'WooCommerceCustomerOutput',
    errorScenarios: [
      { code: 'EMAIL_EXISTS', message: 'Email already registered', isRetryable: false, suggestedAction: 'Use a different email or update existing customer' },
      { code: 'USERNAME_EXISTS', message: 'Username already taken', isRetryable: false, suggestedAction: 'Choose a different username' },
      { code: 'VALIDATION_ERROR', message: 'Invalid field values', isRetryable: false, suggestedAction: 'Check the input values' },
    ],
  },
  woo_send_order_email: {
    type: 'woo_send_order_email',
    name: 'Send Order Email',
    description: 'Send an order notification email to customer',
    category: 'notification',
    requiredInputs: ['orderId', 'emailType'],
    optionalInputs: ['recipientEmail'],
    outputType: 'WooCommerceEmailOutput',
    errorScenarios: [
      { code: 'ORDER_NOT_FOUND', message: 'Order not found', isRetryable: false, suggestedAction: 'Verify the order ID is correct' },
      { code: 'NO_EMAIL', message: 'Customer has no email', isRetryable: false, suggestedAction: 'Provide a recipient email address' },
      { code: 'EMAIL_DISABLED', message: 'Email type disabled', isRetryable: false, suggestedAction: 'Enable this email type in WooCommerce settings' },
      { code: 'SMTP_ERROR', message: 'Email sending failed', isRetryable: true, suggestedAction: 'Check SMTP configuration' },
    ],
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate a WooCommerce action before execution
 */
export function validateWooCommerceAction(
  action: WooCommerceActionBase
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  const definition = WOOCOMMERCE_ACTION_DEFINITIONS[action.type]
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
    case 'woo_get_order':
    case 'woo_update_order':
    case 'woo_update_order_status':
    case 'woo_add_order_note':
    case 'woo_create_refund':
    case 'woo_send_order_email':
      if (action.inputs.orderId && typeof action.inputs.orderId !== 'number' && typeof action.inputs.orderId !== 'string') {
        errors.push('orderId must be a number or string')
      }
      break
    case 'woo_get_product':
    case 'woo_update_product':
    case 'woo_update_stock':
      if (action.inputs.productId && typeof action.inputs.productId !== 'number' && typeof action.inputs.productId !== 'string') {
        errors.push('productId must be a number or string')
      }
      break
    case 'woo_get_customer':
      if (action.inputs.customerId && typeof action.inputs.customerId !== 'number' && typeof action.inputs.customerId !== 'string') {
        errors.push('customerId must be a number or string')
      }
      break
    case 'woo_create_customer':
      if (action.inputs.email && typeof action.inputs.email !== 'string') {
        errors.push('email must be a string')
      }
      if (action.inputs.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(action.inputs.email as string)) {
        errors.push('email must be a valid email address')
      }
      break
  }

  // Validate order status
  if (action.type === 'woo_update_order_status') {
    const validStatuses: WooCommerceOrderStatus[] = ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed', 'trash']
    if (action.inputs.status && !validStatuses.includes(action.inputs.status as WooCommerceOrderStatus)) {
      errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }
  }

  // Validate email type
  if (action.type === 'woo_send_order_email') {
    const validEmailTypes: WooCommerceEmailType[] = ['new_order', 'cancelled_order', 'failed_order', 'on_hold_order', 'processing_order', 'completed_order', 'refunded_order', 'customer_note', 'customer_invoice']
    if (action.inputs.emailType && !validEmailTypes.includes(action.inputs.emailType as WooCommerceEmailType)) {
      errors.push(`Invalid email type. Must be one of: ${validEmailTypes.join(', ')}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Get requirements for a specific action type
 */
export function getWooCommerceActionRequirements(actionType: WooCommerceActionType): {
  requiredInputs: string[]
  optionalInputs: string[]
  requiredScopes: string[]
} {
  const definition = WOOCOMMERCE_ACTION_DEFINITIONS[actionType]
  if (!definition) {
    return { requiredInputs: [], optionalInputs: [], requiredScopes: [] }
  }

  // WooCommerce REST API permissions map to these capability groups
  const scopeMap: Record<string, string[]> = {
    order: ['read', 'write'],
    product: ['read', 'write'],
    customer: ['read', 'write'],
    inventory: ['read', 'write'],
    notification: ['read', 'write'],
  }

  return {
    requiredInputs: definition.requiredInputs,
    optionalInputs: definition.optionalInputs,
    requiredScopes: scopeMap[definition.category] || [],
  }
}

// ============================================================================
// Response Formatters
// ============================================================================

/**
 * Format WooCommerce API response to normalized output
 */
export function formatWooCommerceResponse(
  actionType: WooCommerceActionType,
  response: unknown
): unknown {
  if (!response || typeof response !== 'object') {
    return response
  }

  const data = response as Record<string, unknown>

  switch (actionType) {
    case 'woo_get_order':
    case 'woo_update_order':
    case 'woo_update_order_status':
      return formatOrderResponse(data)

    case 'woo_add_order_note':
      return formatOrderNoteResponse(data)

    case 'woo_create_refund':
      return formatRefundResponse(data)

    case 'woo_get_product':
    case 'woo_update_product':
    case 'woo_update_stock':
      return formatProductResponse(data)

    case 'woo_get_customer':
    case 'woo_create_customer':
      return formatCustomerResponse(data)

    case 'woo_send_order_email':
      return formatEmailResponse(data)

    default:
      return data
  }
}

function formatOrderResponse(order: Record<string, unknown>): WooCommerceOrderOutput {
  return {
    id: Number(order.id || 0),
    parentId: Number(order.parent_id || 0),
    number: String(order.number || ''),
    orderKey: String(order.order_key || ''),
    createdVia: String(order.created_via || ''),
    version: String(order.version || ''),
    status: (order.status as WooCommerceOrderStatus) || 'pending',
    currency: String(order.currency || 'USD'),
    dateCreated: String(order.date_created || ''),
    dateCreatedGmt: String(order.date_created_gmt || ''),
    dateModified: String(order.date_modified || ''),
    dateModifiedGmt: String(order.date_modified_gmt || ''),
    discountTotal: String(order.discount_total || '0'),
    discountTax: String(order.discount_tax || '0'),
    shippingTotal: String(order.shipping_total || '0'),
    shippingTax: String(order.shipping_tax || '0'),
    cartTax: String(order.cart_tax || '0'),
    total: String(order.total || '0'),
    totalTax: String(order.total_tax || '0'),
    pricesIncludeTax: Boolean(order.prices_include_tax),
    customerId: Number(order.customer_id || 0),
    customerIpAddress: String(order.customer_ip_address || ''),
    customerUserAgent: String(order.customer_user_agent || ''),
    customerNote: String(order.customer_note || ''),
    billing: formatAddressResponse((order.billing || {}) as Record<string, unknown>),
    shipping: formatAddressResponse((order.shipping || {}) as Record<string, unknown>),
    paymentMethod: String(order.payment_method || ''),
    paymentMethodTitle: String(order.payment_method_title || ''),
    transactionId: String(order.transaction_id || ''),
    datePaid: order.date_paid as string | undefined,
    datePaidGmt: order.date_paid_gmt as string | undefined,
    dateCompleted: order.date_completed as string | undefined,
    dateCompletedGmt: order.date_completed_gmt as string | undefined,
    cartHash: String(order.cart_hash || ''),
    metaData: formatMetaData(order.meta_data as unknown[]),
    lineItems: formatLineItems(order.line_items as unknown[]),
    taxLines: formatTaxLines(order.tax_lines as unknown[]),
    shippingLines: formatShippingLines(order.shipping_lines as unknown[]),
    feeLines: formatFeeLines(order.fee_lines as unknown[]),
    couponLines: formatCouponLines(order.coupon_lines as unknown[]),
    refunds: formatRefundsSummary(order.refunds as unknown[]),
  }
}

function formatAddressResponse(address: Record<string, unknown>): WooCommerceAddressOutput {
  return {
    firstName: String(address.first_name || ''),
    lastName: String(address.last_name || ''),
    company: String(address.company || ''),
    address1: String(address.address_1 || ''),
    address2: String(address.address_2 || ''),
    city: String(address.city || ''),
    state: String(address.state || ''),
    postcode: String(address.postcode || ''),
    country: String(address.country || ''),
    email: address.email as string | undefined,
    phone: address.phone as string | undefined,
  }
}

function formatMetaData(metaData: unknown[]): Array<{ id: number; key: string; value: string }> {
  if (!Array.isArray(metaData)) return []
  return metaData.map((item) => {
    const m = item as Record<string, unknown>
    return {
      id: Number(m.id || 0),
      key: String(m.key || ''),
      value: String(m.value || ''),
    }
  })
}

function formatLineItems(lineItems: unknown[]): WooCommerceLineItemOutput[] {
  if (!Array.isArray(lineItems)) return []
  return lineItems.map((item) => {
    const li = item as Record<string, unknown>
    return {
      id: Number(li.id || 0),
      name: String(li.name || ''),
      productId: Number(li.product_id || 0),
      variationId: Number(li.variation_id || 0),
      quantity: Number(li.quantity || 0),
      taxClass: String(li.tax_class || ''),
      subtotal: String(li.subtotal || '0'),
      subtotalTax: String(li.subtotal_tax || '0'),
      total: String(li.total || '0'),
      totalTax: String(li.total_tax || '0'),
      taxes: formatTaxes(li.taxes as unknown[]),
      metaData: formatMetaData(li.meta_data as unknown[]),
      sku: String(li.sku || ''),
      price: Number(li.price || 0),
    }
  })
}

function formatTaxes(taxes: unknown[]): Array<{ id: number; total: string; subtotal: string }> {
  if (!Array.isArray(taxes)) return []
  return taxes.map((t) => {
    const tax = t as Record<string, unknown>
    return {
      id: Number(tax.id || 0),
      total: String(tax.total || '0'),
      subtotal: String(tax.subtotal || '0'),
    }
  })
}

function formatTaxLines(taxLines: unknown[]): WooCommerceTaxLineOutput[] {
  if (!Array.isArray(taxLines)) return []
  return taxLines.map((item) => {
    const tl = item as Record<string, unknown>
    return {
      id: Number(tl.id || 0),
      rateCode: String(tl.rate_code || ''),
      rateId: Number(tl.rate_id || 0),
      label: String(tl.label || ''),
      compound: Boolean(tl.compound),
      taxTotal: String(tl.tax_total || '0'),
      shippingTaxTotal: String(tl.shipping_tax_total || '0'),
      metaData: formatMetaData(tl.meta_data as unknown[]),
    }
  })
}

function formatShippingLines(shippingLines: unknown[]): WooCommerceShippingLineOutput[] {
  if (!Array.isArray(shippingLines)) return []
  return shippingLines.map((item) => {
    const sl = item as Record<string, unknown>
    return {
      id: Number(sl.id || 0),
      methodTitle: String(sl.method_title || ''),
      methodId: String(sl.method_id || ''),
      total: String(sl.total || '0'),
      totalTax: String(sl.total_tax || '0'),
      taxes: formatShippingTaxes(sl.taxes as unknown[]),
      metaData: formatMetaData(sl.meta_data as unknown[]),
    }
  })
}

function formatShippingTaxes(taxes: unknown[]): Array<{ id: number; total: string }> {
  if (!Array.isArray(taxes)) return []
  return taxes.map((t) => {
    const tax = t as Record<string, unknown>
    return {
      id: Number(tax.id || 0),
      total: String(tax.total || '0'),
    }
  })
}

function formatFeeLines(feeLines: unknown[]): WooCommerceFeeLineOutput[] {
  if (!Array.isArray(feeLines)) return []
  return feeLines.map((item) => {
    const fl = item as Record<string, unknown>
    return {
      id: Number(fl.id || 0),
      name: String(fl.name || ''),
      taxClass: String(fl.tax_class || ''),
      taxStatus: String(fl.tax_status || ''),
      total: String(fl.total || '0'),
      totalTax: String(fl.total_tax || '0'),
      taxes: formatTaxes(fl.taxes as unknown[]),
      metaData: formatMetaData(fl.meta_data as unknown[]),
    }
  })
}

function formatCouponLines(couponLines: unknown[]): WooCommerceCouponLineOutput[] {
  if (!Array.isArray(couponLines)) return []
  return couponLines.map((item) => {
    const cl = item as Record<string, unknown>
    return {
      id: Number(cl.id || 0),
      code: String(cl.code || ''),
      discount: String(cl.discount || '0'),
      discountTax: String(cl.discount_tax || '0'),
      metaData: formatMetaData(cl.meta_data as unknown[]),
    }
  })
}

function formatRefundsSummary(refunds: unknown[]): WooCommerceRefundSummaryOutput[] {
  if (!Array.isArray(refunds)) return []
  return refunds.map((item) => {
    const r = item as Record<string, unknown>
    return {
      id: Number(r.id || 0),
      reason: String(r.reason || ''),
      total: String(r.total || '0'),
    }
  })
}

function formatOrderNoteResponse(note: Record<string, unknown>): WooCommerceOrderNoteOutput {
  return {
    id: Number(note.id || 0),
    author: String(note.author || ''),
    dateCreated: String(note.date_created || ''),
    dateCreatedGmt: String(note.date_created_gmt || ''),
    note: String(note.note || ''),
    customerNote: Boolean(note.customer_note),
  }
}

function formatRefundResponse(refund: Record<string, unknown>): WooCommerceRefundOutput {
  return {
    id: Number(refund.id || 0),
    dateCreated: String(refund.date_created || ''),
    dateCreatedGmt: String(refund.date_created_gmt || ''),
    amount: String(refund.amount || '0'),
    reason: String(refund.reason || ''),
    refundedBy: Number(refund.refunded_by || 0),
    refundedPayment: Boolean(refund.refunded_payment),
    metaData: formatMetaData(refund.meta_data as unknown[]),
    lineItems: formatRefundLineItems(refund.line_items as unknown[]),
  }
}

function formatRefundLineItems(lineItems: unknown[]): WooCommerceRefundOutput['lineItems'] {
  if (!Array.isArray(lineItems)) return []
  return lineItems.map((item) => {
    const li = item as Record<string, unknown>
    return {
      id: Number(li.id || 0),
      name: String(li.name || ''),
      productId: Number(li.product_id || 0),
      variationId: Number(li.variation_id || 0),
      quantity: Number(li.quantity || 0),
      taxClass: String(li.tax_class || ''),
      subtotal: String(li.subtotal || '0'),
      subtotalTax: String(li.subtotal_tax || '0'),
      total: String(li.total || '0'),
      totalTax: String(li.total_tax || '0'),
      taxes: formatTaxes(li.taxes as unknown[]),
      metaData: formatMetaData(li.meta_data as unknown[]),
      sku: String(li.sku || ''),
      price: Number(li.price || 0),
    }
  })
}

function formatProductResponse(product: Record<string, unknown>): WooCommerceProductOutput {
  return {
    id: Number(product.id || 0),
    name: String(product.name || ''),
    slug: String(product.slug || ''),
    permalink: String(product.permalink || ''),
    dateCreated: String(product.date_created || ''),
    dateCreatedGmt: String(product.date_created_gmt || ''),
    dateModified: String(product.date_modified || ''),
    dateModifiedGmt: String(product.date_modified_gmt || ''),
    type: (product.type as WooCommerceProductOutput['type']) || 'simple',
    status: (product.status as WooCommerceProductOutput['status']) || 'publish',
    featured: Boolean(product.featured),
    catalogVisibility: (product.catalog_visibility as WooCommerceProductOutput['catalogVisibility']) || 'visible',
    description: String(product.description || ''),
    shortDescription: String(product.short_description || ''),
    sku: String(product.sku || ''),
    price: String(product.price || '0'),
    regularPrice: String(product.regular_price || '0'),
    salePrice: String(product.sale_price || ''),
    dateOnSaleFrom: product.date_on_sale_from as string | undefined,
    dateOnSaleTo: product.date_on_sale_to as string | undefined,
    priceHtml: String(product.price_html || ''),
    onSale: Boolean(product.on_sale),
    purchasable: Boolean(product.purchasable),
    totalSales: Number(product.total_sales || 0),
    virtual: Boolean(product.virtual),
    downloadable: Boolean(product.downloadable),
    taxStatus: String(product.tax_status || ''),
    taxClass: String(product.tax_class || ''),
    manageStock: Boolean(product.manage_stock),
    stockQuantity: product.stock_quantity as number | null,
    stockStatus: (product.stock_status as WooCommerceProductOutput['stockStatus']) || 'instock',
    backorders: (product.backorders as WooCommerceProductOutput['backorders']) || 'no',
    backordersAllowed: Boolean(product.backorders_allowed),
    backordered: Boolean(product.backordered),
    lowStockAmount: product.low_stock_amount as number | null,
    soldIndividually: Boolean(product.sold_individually),
    weight: String(product.weight || ''),
    dimensions: formatDimensions((product.dimensions || {}) as Record<string, unknown>),
    shippingRequired: Boolean(product.shipping_required),
    shippingTaxable: Boolean(product.shipping_taxable),
    shippingClass: String(product.shipping_class || ''),
    shippingClassId: Number(product.shipping_class_id || 0),
    reviewsAllowed: Boolean(product.reviews_allowed),
    averageRating: String(product.average_rating || '0'),
    ratingCount: Number(product.rating_count || 0),
    parentId: Number(product.parent_id || 0),
    purchaseNote: String(product.purchase_note || ''),
    categories: formatCategories(product.categories as unknown[]),
    tags: formatTags(product.tags as unknown[]),
    images: formatImages(product.images as unknown[]),
    attributes: formatAttributes(product.attributes as unknown[]),
    variations: Array.isArray(product.variations) ? product.variations.map(Number) : [],
    metaData: formatMetaData(product.meta_data as unknown[]),
  }
}

function formatDimensions(dimensions: Record<string, unknown>): { length: string; width: string; height: string } {
  return {
    length: String(dimensions.length || ''),
    width: String(dimensions.width || ''),
    height: String(dimensions.height || ''),
  }
}

function formatCategories(categories: unknown[]): Array<{ id: number; name: string; slug: string }> {
  if (!Array.isArray(categories)) return []
  return categories.map((c) => {
    const cat = c as Record<string, unknown>
    return {
      id: Number(cat.id || 0),
      name: String(cat.name || ''),
      slug: String(cat.slug || ''),
    }
  })
}

function formatTags(tags: unknown[]): Array<{ id: number; name: string; slug: string }> {
  if (!Array.isArray(tags)) return []
  return tags.map((t) => {
    const tag = t as Record<string, unknown>
    return {
      id: Number(tag.id || 0),
      name: String(tag.name || ''),
      slug: String(tag.slug || ''),
    }
  })
}

function formatImages(images: unknown[]): WooCommerceImageOutput[] {
  if (!Array.isArray(images)) return []
  return images.map((img) => {
    const i = img as Record<string, unknown>
    return {
      id: Number(i.id || 0),
      dateCreated: String(i.date_created || ''),
      dateCreatedGmt: String(i.date_created_gmt || ''),
      dateModified: String(i.date_modified || ''),
      dateModifiedGmt: String(i.date_modified_gmt || ''),
      src: String(i.src || ''),
      name: String(i.name || ''),
      alt: String(i.alt || ''),
    }
  })
}

function formatAttributes(attributes: unknown[]): WooCommerceAttributeOutput[] {
  if (!Array.isArray(attributes)) return []
  return attributes.map((attr) => {
    const a = attr as Record<string, unknown>
    return {
      id: Number(a.id || 0),
      name: String(a.name || ''),
      position: Number(a.position || 0),
      visible: Boolean(a.visible),
      variation: Boolean(a.variation),
      options: Array.isArray(a.options) ? a.options.map(String) : [],
    }
  })
}

function formatCustomerResponse(customer: Record<string, unknown>): WooCommerceCustomerOutput {
  return {
    id: Number(customer.id || 0),
    dateCreated: String(customer.date_created || ''),
    dateCreatedGmt: String(customer.date_created_gmt || ''),
    dateModified: String(customer.date_modified || ''),
    dateModifiedGmt: String(customer.date_modified_gmt || ''),
    email: String(customer.email || ''),
    firstName: String(customer.first_name || ''),
    lastName: String(customer.last_name || ''),
    role: String(customer.role || ''),
    username: String(customer.username || ''),
    billing: formatAddressResponse((customer.billing || {}) as Record<string, unknown>),
    shipping: formatAddressResponse((customer.shipping || {}) as Record<string, unknown>),
    isPayingCustomer: Boolean(customer.is_paying_customer),
    avatarUrl: String(customer.avatar_url || ''),
    metaData: formatMetaData(customer.meta_data as unknown[]),
  }
}

function formatEmailResponse(response: Record<string, unknown>): WooCommerceEmailOutput {
  return {
    success: Boolean(response.success !== false),
    sentAt: String(response.sent_at || new Date().toISOString()),
    recipientEmail: String(response.recipient_email || response.email || ''),
    emailType: (response.email_type || response.emailType) as WooCommerceEmailType,
    orderId: Number(response.order_id || response.orderId || 0),
  }
}

// ============================================================================
// WooCommerce Action Executor Class
// ============================================================================

/**
 * WooCommerceActionExecutor - Executes WooCommerce-specific workflow actions
 *
 * This class provides methods to execute various WooCommerce e-commerce actions
 * within the workflow engine. It handles input validation, API communication,
 * response formatting, and error handling.
 */
export class WooCommerceActionExecutor {
  private siteUrl: string | null = null
  private consumerKey: string | null = null
  private consumerSecret: string | null = null
  private version: string = 'wc/v3'

  /**
   * Configure the executor with WooCommerce credentials
   */
  configure(config: { siteUrl: string; consumerKey: string; consumerSecret: string; version?: string }): void {
    this.siteUrl = config.siteUrl.replace(/\/$/, '') // Remove trailing slash
    this.consumerKey = config.consumerKey
    this.consumerSecret = config.consumerSecret
    if (config.version) {
      this.version = config.version
    }
  }

  /**
   * Check if the executor is configured
   */
  isConfigured(): boolean {
    return Boolean(this.siteUrl && this.consumerKey && this.consumerSecret)
  }

  /**
   * Main execution method - routes to specific action handlers
   */
  async execute(
    action: WooCommerceActionBase,
    context: WooCommerceExecutionContext
  ): Promise<WooCommerceExecutionResult> {
    const startTime = Date.now()

    // Use context config if executor not configured
    if (!this.isConfigured() && context.wooConfig) {
      this.configure(context.wooConfig)
    }

    // Validate action
    const validation = validateWooCommerceAction(action)
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
        errorCode: 'VALIDATION_ERROR',
        isRetryable: false,
        suggestedAction: 'Fix the input parameters and try again',
        executionTimeMs: Date.now() - startTime,
        actionType: action.type,
      }
    }

    // Check configuration
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'WooCommerce executor not configured',
        errorCode: 'NOT_CONFIGURED',
        isRetryable: false,
        suggestedAction: 'Connect your WooCommerce store first',
        executionTimeMs: Date.now() - startTime,
        actionType: action.type,
      }
    }

    try {
      // Route to specific action handler
      let result: unknown
      const inputs = action.inputs as unknown

      switch (action.type) {
        case 'woo_get_order':
          result = await this.executeGetOrder(inputs as WooCommerceGetOrderInputs)
          break
        case 'woo_update_order':
          result = await this.executeUpdateOrder(inputs as WooCommerceUpdateOrderInputs)
          break
        case 'woo_update_order_status':
          result = await this.executeUpdateOrderStatus(inputs as WooCommerceUpdateOrderStatusInputs)
          break
        case 'woo_add_order_note':
          result = await this.executeAddOrderNote(inputs as WooCommerceAddOrderNoteInputs)
          break
        case 'woo_create_refund':
          result = await this.executeCreateRefund(inputs as WooCommerceCreateRefundInputs)
          break
        case 'woo_get_product':
          result = await this.executeGetProduct(inputs as WooCommerceGetProductInputs)
          break
        case 'woo_update_product':
          result = await this.executeUpdateProduct(inputs as WooCommerceUpdateProductInputs)
          break
        case 'woo_update_stock':
          result = await this.executeUpdateStock(inputs as WooCommerceUpdateStockInputs)
          break
        case 'woo_get_customer':
          result = await this.executeGetCustomer(inputs as WooCommerceGetCustomerInputs)
          break
        case 'woo_create_customer':
          result = await this.executeCreateCustomer(inputs as WooCommerceCreateCustomerInputs)
          break
        case 'woo_send_order_email':
          result = await this.executeSendOrderEmail(inputs as WooCommerceSendOrderEmailInputs)
          break
        default:
          throw new Error(`Unknown action type: ${action.type}`)
      }

      return {
        success: true,
        data: formatWooCommerceResponse(action.type, result),
        executionTimeMs: Date.now() - startTime,
        actionType: action.type,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const definition = WOOCOMMERCE_ACTION_DEFINITIONS[action.type]
      const matchedError = definition?.errorScenarios.find(
        (e) => errorMessage.includes(e.code) || errorMessage.includes(e.message)
      )

      return {
        success: false,
        error: errorMessage,
        errorCode: matchedError?.code || 'EXECUTION_ERROR',
        isRetryable: matchedError?.isRetryable ?? false,
        suggestedAction: matchedError?.suggestedAction || 'Check the error details and try again',
        executionTimeMs: Date.now() - startTime,
        actionType: action.type,
      }
    }
  }

  // ============================================================================
  // Action-Specific Execution Methods
  // ============================================================================

  private async executeGetOrder(inputs: WooCommerceGetOrderInputs): Promise<unknown> {
    const endpoint = `orders/${inputs.orderId}`
    return this.makeRequest('GET', endpoint)
  }

  private async executeUpdateOrder(inputs: WooCommerceUpdateOrderInputs): Promise<unknown> {
    const endpoint = `orders/${inputs.orderId}`
    const orderData: Record<string, unknown> = {}

    if (inputs.billing) orderData.billing = this.formatAddressInput(inputs.billing)
    if (inputs.shipping) orderData.shipping = this.formatAddressInput(inputs.shipping)
    if (inputs.paymentMethod) orderData.payment_method = inputs.paymentMethod
    if (inputs.paymentMethodTitle) orderData.payment_method_title = inputs.paymentMethodTitle
    if (inputs.transactionId) orderData.transaction_id = inputs.transactionId
    if (inputs.customerNote) orderData.customer_note = inputs.customerNote
    if (inputs.metaData) orderData.meta_data = inputs.metaData

    return this.makeRequest('PUT', endpoint, orderData)
  }

  private async executeUpdateOrderStatus(inputs: WooCommerceUpdateOrderStatusInputs): Promise<unknown> {
    const endpoint = `orders/${inputs.orderId}`
    const orderData: Record<string, unknown> = {
      status: inputs.status,
    }

    // If note provided, we need to add it separately after status update
    const result = await this.makeRequest('PUT', endpoint, orderData)

    if (inputs.note) {
      await this.executeAddOrderNote({
        orderId: inputs.orderId,
        note: inputs.note,
        customerNote: inputs.sendNotification || false,
      })
    }

    return result
  }

  private async executeAddOrderNote(inputs: WooCommerceAddOrderNoteInputs): Promise<unknown> {
    const endpoint = `orders/${inputs.orderId}/notes`
    const noteData: Record<string, unknown> = {
      note: inputs.note,
      customer_note: inputs.customerNote || false,
    }

    if (inputs.addedByUser !== undefined) {
      noteData.added_by_user = inputs.addedByUser
    }

    return this.makeRequest('POST', endpoint, noteData)
  }

  private async executeCreateRefund(inputs: WooCommerceCreateRefundInputs): Promise<unknown> {
    const endpoint = `orders/${inputs.orderId}/refunds`
    const refundData: Record<string, unknown> = {}

    if (inputs.amount) refundData.amount = inputs.amount
    if (inputs.reason) refundData.reason = inputs.reason
    if (inputs.refundedBy) refundData.refunded_by = inputs.refundedBy
    if (inputs.apiRefund !== undefined) refundData.api_refund = inputs.apiRefund
    if (inputs.restockItems !== undefined) refundData.restock_items = inputs.restockItems

    if (inputs.lineItems) {
      refundData.line_items = inputs.lineItems.map((li) => ({
        id: li.lineItemId,
        quantity: li.quantity,
        refund_total: li.refundTotal,
        refund_tax: li.refundTax,
      }))
    }

    return this.makeRequest('POST', endpoint, refundData)
  }

  private async executeGetProduct(inputs: WooCommerceGetProductInputs): Promise<unknown> {
    const endpoint = `products/${inputs.productId}`
    return this.makeRequest('GET', endpoint)
  }

  private async executeUpdateProduct(inputs: WooCommerceUpdateProductInputs): Promise<unknown> {
    const endpoint = `products/${inputs.productId}`
    const productData: Record<string, unknown> = {}

    if (inputs.name) productData.name = inputs.name
    if (inputs.slug) productData.slug = inputs.slug
    if (inputs.description) productData.description = inputs.description
    if (inputs.shortDescription) productData.short_description = inputs.shortDescription
    if (inputs.sku) productData.sku = inputs.sku
    if (inputs.regularPrice) productData.regular_price = inputs.regularPrice
    if (inputs.salePrice) productData.sale_price = inputs.salePrice
    if (inputs.status) productData.status = inputs.status
    if (inputs.catalogVisibility) productData.catalog_visibility = inputs.catalogVisibility
    if (inputs.categories) productData.categories = inputs.categories
    if (inputs.tags) productData.tags = inputs.tags
    if (inputs.metaData) productData.meta_data = inputs.metaData

    return this.makeRequest('PUT', endpoint, productData)
  }

  private async executeUpdateStock(inputs: WooCommerceUpdateStockInputs): Promise<unknown> {
    const endpoint = `products/${inputs.productId}`
    const productData: Record<string, unknown> = {}

    if (inputs.stockQuantity !== undefined) productData.stock_quantity = inputs.stockQuantity
    if (inputs.stockStatus) productData.stock_status = inputs.stockStatus
    if (inputs.manageStock !== undefined) productData.manage_stock = inputs.manageStock
    if (inputs.backorders) productData.backorders = inputs.backorders
    if (inputs.lowStockAmount !== undefined) productData.low_stock_amount = inputs.lowStockAmount

    return this.makeRequest('PUT', endpoint, productData)
  }

  private async executeGetCustomer(inputs: WooCommerceGetCustomerInputs): Promise<unknown> {
    const endpoint = `customers/${inputs.customerId}`
    return this.makeRequest('GET', endpoint)
  }

  private async executeCreateCustomer(inputs: WooCommerceCreateCustomerInputs): Promise<unknown> {
    const endpoint = 'customers'
    const customerData: Record<string, unknown> = {
      email: inputs.email,
    }

    if (inputs.firstName) customerData.first_name = inputs.firstName
    if (inputs.lastName) customerData.last_name = inputs.lastName
    if (inputs.username) customerData.username = inputs.username
    if (inputs.password) customerData.password = inputs.password
    if (inputs.billing) customerData.billing = this.formatAddressInput(inputs.billing)
    if (inputs.shipping) customerData.shipping = this.formatAddressInput(inputs.shipping)
    if (inputs.metaData) customerData.meta_data = inputs.metaData

    return this.makeRequest('POST', endpoint, customerData)
  }

  private async executeSendOrderEmail(inputs: WooCommerceSendOrderEmailInputs): Promise<unknown> {
    // WooCommerce doesn't have a direct REST API endpoint for sending emails
    // This would typically be handled via a custom endpoint or plugin
    // For now, we simulate success and note this limitation
    console.log(`[WooCommerce] Email send requested for order ${inputs.orderId}, type: ${inputs.emailType}`)

    // In production, this would integrate with a custom WooCommerce endpoint
    // or use the wp-json/wc/v3/orders/{id}/actions endpoint if available
    return {
      success: true,
      sent_at: new Date().toISOString(),
      recipient_email: inputs.recipientEmail || 'customer@email.com',
      email_type: inputs.emailType,
      order_id: inputs.orderId,
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private formatAddressInput(address: WooCommerceAddressInput): Record<string, unknown> {
    const formatted: Record<string, unknown> = {}
    if (address.firstName) formatted.first_name = address.firstName
    if (address.lastName) formatted.last_name = address.lastName
    if (address.company) formatted.company = address.company
    if (address.address1) formatted.address_1 = address.address1
    if (address.address2) formatted.address_2 = address.address2
    if (address.city) formatted.city = address.city
    if (address.state) formatted.state = address.state
    if (address.postcode) formatted.postcode = address.postcode
    if (address.country) formatted.country = address.country
    if (address.email) formatted.email = address.email
    if (address.phone) formatted.phone = address.phone
    return formatted
  }

  // ============================================================================
  // HTTP Request Helper
  // ============================================================================

  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<unknown> {
    if (!this.siteUrl || !this.consumerKey || !this.consumerSecret) {
      throw new Error('WooCommerce executor not configured')
    }

    const url = `${this.siteUrl}/wp-json/${this.version}/${endpoint}`
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
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
      let errorMessage = `WooCommerce API error: ${response.status} ${response.statusText}`
      try {
        const errorJson = JSON.parse(errorBody)
        if (errorJson.message) {
          errorMessage = errorJson.message
        } else if (errorJson.code) {
          errorMessage = `${errorJson.code}: ${errorJson.message || errorBody}`
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
export interface WooCommerceActionRegistryEntry {
  type: WooCommerceActionType
  definition: WooCommerceActionDefinition
  composioSlug?: string
}

/**
 * Action registry for workflow engine registration
 * Maps WooCommerce actions to Composio tool slugs where available
 */
export const WOOCOMMERCE_ACTION_REGISTRY: WooCommerceActionRegistryEntry[] = [
  { type: 'woo_get_order', definition: WOOCOMMERCE_ACTION_DEFINITIONS.woo_get_order, composioSlug: 'WOOCOMMERCE_GET_ORDER' },
  { type: 'woo_update_order', definition: WOOCOMMERCE_ACTION_DEFINITIONS.woo_update_order, composioSlug: 'WOOCOMMERCE_UPDATE_ORDER' },
  { type: 'woo_update_order_status', definition: WOOCOMMERCE_ACTION_DEFINITIONS.woo_update_order_status, composioSlug: 'WOOCOMMERCE_UPDATE_ORDER_STATUS' },
  { type: 'woo_add_order_note', definition: WOOCOMMERCE_ACTION_DEFINITIONS.woo_add_order_note, composioSlug: 'WOOCOMMERCE_ADD_ORDER_NOTE' },
  { type: 'woo_create_refund', definition: WOOCOMMERCE_ACTION_DEFINITIONS.woo_create_refund, composioSlug: 'WOOCOMMERCE_CREATE_REFUND' },
  { type: 'woo_get_product', definition: WOOCOMMERCE_ACTION_DEFINITIONS.woo_get_product, composioSlug: 'WOOCOMMERCE_GET_PRODUCT' },
  { type: 'woo_update_product', definition: WOOCOMMERCE_ACTION_DEFINITIONS.woo_update_product, composioSlug: 'WOOCOMMERCE_UPDATE_PRODUCT' },
  { type: 'woo_update_stock', definition: WOOCOMMERCE_ACTION_DEFINITIONS.woo_update_stock, composioSlug: 'WOOCOMMERCE_UPDATE_STOCK' },
  { type: 'woo_get_customer', definition: WOOCOMMERCE_ACTION_DEFINITIONS.woo_get_customer, composioSlug: 'WOOCOMMERCE_GET_CUSTOMER' },
  { type: 'woo_create_customer', definition: WOOCOMMERCE_ACTION_DEFINITIONS.woo_create_customer, composioSlug: 'WOOCOMMERCE_CREATE_CUSTOMER' },
  { type: 'woo_send_order_email', definition: WOOCOMMERCE_ACTION_DEFINITIONS.woo_send_order_email },
]

/**
 * Get action registry entries by category
 */
export function getWooCommerceActionsByCategory(
  category: WooCommerceActionDefinition['category']
): WooCommerceActionRegistryEntry[] {
  return WOOCOMMERCE_ACTION_REGISTRY.filter((entry) => entry.definition.category === category)
}

/**
 * Get action registry entry by type
 */
export function getWooCommerceActionByType(type: WooCommerceActionType): WooCommerceActionRegistryEntry | undefined {
  return WOOCOMMERCE_ACTION_REGISTRY.find((entry) => entry.type === type)
}

/**
 * Check if an action type is valid
 */
export function isValidWooCommerceAction(type: string): type is WooCommerceActionType {
  return WOOCOMMERCE_ACTION_REGISTRY.some((entry) => entry.type === type)
}

// ============================================================================
// Singleton Export
// ============================================================================

export const wooCommerceActionExecutor = new WooCommerceActionExecutor()

// ============================================================================
// PRE-BUILT WORKFLOW ACTIONS
// ============================================================================

/**
 * Pre-built workflow action types for complex multi-step operations
 */
export type WooCommerceWorkflowActionType =
  | 'sync_order_to_shipping'
  | 'send_abandoned_cart_reminder'
  | 'sync_products_to_marketplace'
  | 'update_pricing_from_supplier'
  | 'generate_sales_report'

// --------------------------------------------------------------------------
// Workflow Action Input/Output Types
// --------------------------------------------------------------------------

export interface SyncOrderToShippingInputs {
  orderId: number | string
  shippingProvider: 'shipstation' | 'shippo' | 'easypost' | 'ups' | 'fedex'
  autoCreateLabel?: boolean
  notifyCustomer?: boolean
  serviceType?: string // e.g., 'ground', 'express', 'priority'
  packageWeight?: number
  packageDimensions?: {
    length: number
    width: number
    height: number
    unit: 'in' | 'cm'
  }
}

export interface SyncOrderToShippingOutput {
  success: boolean
  orderId: number
  shipmentId?: string
  trackingNumber?: string
  labelUrl?: string
  estimatedDelivery?: string
  carrier?: string
  service?: string
  shippingCost?: number
  error?: string
}

export interface SendAbandonedCartReminderInputs {
  cartId?: string
  customerEmail: string
  customerId?: number
  cartItems: Array<{
    productId: number
    productName: string
    quantity: number
    price: string
    imageUrl?: string
  }>
  cartTotal: string
  abandonedAt: string // ISO timestamp
  discountCode?: string // Optional discount to include
  discountPercent?: number
  reminderNumber?: number // 1st, 2nd, 3rd reminder
  templateId?: string // Custom email template
}

export interface SendAbandonedCartReminderOutput {
  success: boolean
  emailSent: boolean
  sentAt?: string
  recipientEmail: string
  discountIncluded: boolean
  discountCode?: string
  recoveryUrl?: string
  error?: string
}

export interface SyncProductsToMarketplaceInputs {
  productIds?: number[] // If not provided, sync all products
  marketplace: 'amazon' | 'ebay' | 'etsy' | 'walmart' | 'google_shopping'
  syncInventory?: boolean
  syncPricing?: boolean
  syncImages?: boolean
  syncDescription?: boolean
  priceAdjustment?: {
    type: 'percent' | 'fixed'
    amount: number
    direction: 'increase' | 'decrease'
  }
  categoryMapping?: Record<string, string> // WooCommerce category ID -> Marketplace category
}

export interface SyncProductsToMarketplaceOutput {
  success: boolean
  totalProducts: number
  synced: number
  failed: number
  skipped: number
  results: Array<{
    productId: number
    productName: string
    marketplaceId?: string
    status: 'synced' | 'failed' | 'skipped'
    error?: string
  }>
  syncedAt: string
}

export interface UpdatePricingFromSupplierInputs {
  supplierSource: 'csv_url' | 'api' | 'ftp' | 'google_sheets' | 'manual'
  sourceUrl?: string // For csv_url, api, ftp
  sheetId?: string // For google_sheets
  sheetRange?: string
  apiEndpoint?: string
  apiKey?: string
  skuColumn?: string // Column name for SKU matching
  priceColumn?: string // Column name for cost price
  applyMarkup?: {
    type: 'percent' | 'fixed'
    amount: number
  }
  roundPricing?: 'none' | 'nearest_99' | 'nearest_dollar' | 'up' | 'down'
  updateSalePrice?: boolean
  onlyUpdateIfHigher?: boolean // Only update if new price is higher
  onlyUpdateIfLower?: boolean // Only update if new price is lower
  productFilter?: {
    categories?: number[]
    tags?: number[]
    skuPattern?: string
  }
}

export interface UpdatePricingFromSupplierOutput {
  success: boolean
  totalProcessed: number
  updated: number
  skipped: number
  failed: number
  results: Array<{
    productId: number
    sku: string
    oldPrice: string
    newPrice: string
    status: 'updated' | 'skipped' | 'failed' | 'not_found'
    reason?: string
  }>
  processedAt: string
}

export interface GenerateSalesReportInputs {
  reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
  startDate?: string // ISO date, required if reportType is 'custom'
  endDate?: string // ISO date, required if reportType is 'custom'
  includeMetrics?: Array<
    | 'total_sales'
    | 'total_orders'
    | 'average_order_value'
    | 'top_products'
    | 'top_customers'
    | 'refunds'
    | 'discounts'
    | 'shipping_revenue'
    | 'tax_collected'
    | 'payment_methods'
    | 'order_statuses'
    | 'sales_by_category'
    | 'sales_by_country'
    | 'new_vs_returning_customers'
  >
  outputFormat: 'json' | 'csv' | 'pdf' | 'email'
  emailTo?: string[] // Required if outputFormat is 'email'
  compareWithPrevious?: boolean // Compare with previous period
  groupBy?: 'day' | 'week' | 'month' | 'product' | 'category' | 'customer'
}

export interface GenerateSalesReportOutput {
  success: boolean
  reportId: string
  reportType: string
  period: {
    start: string
    end: string
  }
  summary: {
    totalSales: number
    totalOrders: number
    averageOrderValue: number
    totalRefunds: number
    netSales: number
  }
  metrics: Record<string, unknown>
  comparison?: {
    previousPeriodSales: number
    salesChange: number
    salesChangePercent: number
    previousPeriodOrders: number
    ordersChange: number
    ordersChangePercent: number
  }
  topProducts?: Array<{
    productId: number
    productName: string
    quantitySold: number
    revenue: number
  }>
  topCustomers?: Array<{
    customerId: number
    customerEmail: string
    orderCount: number
    totalSpent: number
  }>
  outputUrl?: string // URL to download if PDF/CSV
  generatedAt: string
}

// --------------------------------------------------------------------------
// Pre-Built Workflow Action Executor
// --------------------------------------------------------------------------

/**
 * WooCommerceWorkflowActions - Pre-built multi-step workflow actions
 *
 * These actions combine multiple API calls and external service integrations
 * into single, easy-to-use workflow steps.
 */
export class WooCommerceWorkflowActions {
  private executor: WooCommerceActionExecutor

  constructor(executor?: WooCommerceActionExecutor) {
    this.executor = executor || wooCommerceActionExecutor
  }

  /**
   * Sync a WooCommerce order to a shipping provider (ShipStation, Shippo, etc.)
   *
   * This action:
   * 1. Fetches the order from WooCommerce
   * 2. Formats shipping data for the provider
   * 3. Creates a shipment in the shipping provider
   * 4. Optionally generates a shipping label
   * 5. Updates the order with tracking information
   * 6. Optionally notifies the customer
   */
  async syncOrderToShipping(
    inputs: SyncOrderToShippingInputs,
    context: WooCommerceExecutionContext
  ): Promise<SyncOrderToShippingOutput> {
    const _startTime = Date.now()
    void _startTime // For future performance metrics

    try {
      // Step 1: Fetch order details
      const orderResult = await this.executor.execute(
        { type: 'woo_get_order', inputs: { orderId: inputs.orderId } },
        context
      )

      if (!orderResult.success || !orderResult.data) {
        return {
          success: false,
          orderId: Number(inputs.orderId),
          error: `Failed to fetch order: ${orderResult.error}`,
        }
      }

      const order = orderResult.data as WooCommerceOrderOutput

      // Step 2: Format shipping data based on provider
      const shippingData = this.formatShippingData(order, inputs)

      // Step 3: Create shipment with provider (mock implementation)
      // In production, this would call the actual shipping provider API
      const shipmentResult = await this.createShipmentWithProvider(
        inputs.shippingProvider,
        shippingData,
        inputs.autoCreateLabel
      )

      if (!shipmentResult.success) {
        return {
          success: false,
          orderId: order.id,
          error: shipmentResult.error,
        }
      }

      // Step 4: Update WooCommerce order with tracking info
      if (shipmentResult.trackingNumber) {
        await this.executor.execute(
          {
            type: 'woo_add_order_note',
            inputs: {
              orderId: order.id,
              note: `Shipment created via ${inputs.shippingProvider}. Tracking: ${shipmentResult.trackingNumber}`,
              customerNote: inputs.notifyCustomer || false,
            },
          },
          context
        )

        // Add tracking number to order meta
        await this.executor.execute(
          {
            type: 'woo_update_order',
            inputs: {
              orderId: order.id,
              metaData: [
                { key: '_tracking_number', value: shipmentResult.trackingNumber },
                { key: '_tracking_carrier', value: shipmentResult.carrier || inputs.shippingProvider },
              ],
            },
          },
          context
        )
      }

      return {
        success: true,
        orderId: order.id,
        shipmentId: shipmentResult.shipmentId,
        trackingNumber: shipmentResult.trackingNumber,
        labelUrl: shipmentResult.labelUrl,
        estimatedDelivery: shipmentResult.estimatedDelivery,
        carrier: shipmentResult.carrier,
        service: shipmentResult.service,
        shippingCost: shipmentResult.shippingCost,
      }
    } catch (error) {
      return {
        success: false,
        orderId: Number(inputs.orderId),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Send abandoned cart reminder email
   *
   * This action:
   * 1. Validates cart data and customer info
   * 2. Generates a recovery URL with optional discount
   * 3. Formats email content with cart items
   * 4. Sends the reminder email
   * 5. Tracks the reminder for follow-up
   */
  async sendAbandonedCartReminder(
    inputs: SendAbandonedCartReminderInputs,
    _context: WooCommerceExecutionContext
  ): Promise<SendAbandonedCartReminderOutput> {
    void _context // Context available for future integration
    try {
      // Generate recovery URL
      const recoveryUrl = this.generateCartRecoveryUrl(
        inputs.cartId || `cart_${Date.now()}`,
        inputs.discountCode
      )

      // Format email content
      const emailContent = this.formatAbandonedCartEmail(inputs, recoveryUrl)

      // In production, this would integrate with email service (SendGrid, Mailchimp, etc.)
      // For now, we simulate the email send
      const emailResult = await this.sendEmail({
        to: inputs.customerEmail,
        subject: this.getAbandonedCartSubject(inputs.reminderNumber || 1),
        html: emailContent.html,
        text: emailContent.text,
      })

      return {
        success: true,
        emailSent: emailResult.success,
        sentAt: new Date().toISOString(),
        recipientEmail: inputs.customerEmail,
        discountIncluded: Boolean(inputs.discountCode),
        discountCode: inputs.discountCode,
        recoveryUrl,
      }
    } catch (error) {
      return {
        success: false,
        emailSent: false,
        recipientEmail: inputs.customerEmail,
        discountIncluded: false,
        error: error instanceof Error ? error.message : 'Failed to send reminder',
      }
    }
  }

  /**
   * Sync products to external marketplace (Amazon, eBay, etc.)
   *
   * This action:
   * 1. Fetches products from WooCommerce
   * 2. Transforms product data for the marketplace
   * 3. Creates/updates listings on the marketplace
   * 4. Syncs inventory levels
   * 5. Syncs pricing with optional adjustments
   * 6. Returns detailed sync results
   */
  async syncProductsToMarketplace(
    inputs: SyncProductsToMarketplaceInputs,
    context: WooCommerceExecutionContext
  ): Promise<SyncProductsToMarketplaceOutput> {
    const results: SyncProductsToMarketplaceOutput['results'] = []
    let synced = 0
    let failed = 0
    let skipped = 0

    try {
      // Fetch products - either specific IDs or all products
      const products = await this.fetchProductsForSync(inputs.productIds, context)

      for (const product of products) {
        try {
          // Transform product for marketplace
          const marketplaceData = this.transformProductForMarketplace(
            product,
            inputs.marketplace,
            inputs
          )

          // Check if product should be skipped
          if (this.shouldSkipProduct(product, inputs.marketplace)) {
            skipped++
            results.push({
              productId: product.id,
              productName: product.name,
              status: 'skipped',
              error: 'Product not eligible for marketplace',
            })
            continue
          }

          // Sync to marketplace (mock implementation)
          const syncResult = await this.syncSingleProductToMarketplace(
            inputs.marketplace,
            marketplaceData
          )

          if (syncResult.success) {
            synced++
            results.push({
              productId: product.id,
              productName: product.name,
              marketplaceId: syncResult.marketplaceId,
              status: 'synced',
            })
          } else {
            failed++
            results.push({
              productId: product.id,
              productName: product.name,
              status: 'failed',
              error: syncResult.error,
            })
          }
        } catch (error) {
          failed++
          results.push({
            productId: product.id,
            productName: product.name,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Sync failed',
          })
        }
      }

      return {
        success: failed === 0 || synced > 0,
        totalProducts: products.length,
        synced,
        failed,
        skipped,
        results,
        syncedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        totalProducts: 0,
        synced: 0,
        failed: 0,
        skipped: 0,
        results,
        syncedAt: new Date().toISOString(),
      }
    }
  }

  /**
   * Update product pricing from supplier data
   *
   * This action:
   * 1. Fetches supplier pricing data from source
   * 2. Matches products by SKU
   * 3. Calculates new prices with markup
   * 4. Applies price rounding rules
   * 5. Updates WooCommerce product prices
   * 6. Returns detailed pricing update results
   */
  async updatePricingFromSupplier(
    inputs: UpdatePricingFromSupplierInputs,
    context: WooCommerceExecutionContext
  ): Promise<UpdatePricingFromSupplierOutput> {
    const results: UpdatePricingFromSupplierOutput['results'] = []
    let updated = 0
    let skipped = 0
    let failed = 0

    try {
      // Fetch supplier pricing data
      const supplierPrices = await this.fetchSupplierPrices(inputs)

      // Fetch WooCommerce products
      const products = await this.fetchProductsForPricing(inputs.productFilter, context)

      for (const product of products) {
        if (!product.sku) {
          skipped++
          results.push({
            productId: product.id,
            sku: '',
            oldPrice: product.regularPrice,
            newPrice: product.regularPrice,
            status: 'skipped',
            reason: 'No SKU',
          })
          continue
        }

        const supplierPrice = supplierPrices.get(product.sku)
        if (!supplierPrice) {
          skipped++
          results.push({
            productId: product.id,
            sku: product.sku,
            oldPrice: product.regularPrice,
            newPrice: product.regularPrice,
            status: 'not_found',
            reason: 'SKU not found in supplier data',
          })
          continue
        }

        // Calculate new price with markup
        let newPrice = supplierPrice
        if (inputs.applyMarkup) {
          if (inputs.applyMarkup.type === 'percent') {
            newPrice = supplierPrice * (1 + inputs.applyMarkup.amount / 100)
          } else {
            newPrice = supplierPrice + inputs.applyMarkup.amount
          }
        }

        // Apply rounding
        newPrice = this.applyPriceRounding(newPrice, inputs.roundPricing || 'none')

        // Check price change conditions
        const currentPrice = parseFloat(product.regularPrice)
        if (inputs.onlyUpdateIfHigher && newPrice <= currentPrice) {
          skipped++
          results.push({
            productId: product.id,
            sku: product.sku,
            oldPrice: product.regularPrice,
            newPrice: newPrice.toFixed(2),
            status: 'skipped',
            reason: 'New price not higher than current',
          })
          continue
        }
        if (inputs.onlyUpdateIfLower && newPrice >= currentPrice) {
          skipped++
          results.push({
            productId: product.id,
            sku: product.sku,
            oldPrice: product.regularPrice,
            newPrice: newPrice.toFixed(2),
            status: 'skipped',
            reason: 'New price not lower than current',
          })
          continue
        }

        // Update product price
        try {
          const updateData: Record<string, unknown> = {
            productId: product.id,
            regularPrice: newPrice.toFixed(2),
          }
          if (inputs.updateSalePrice && product.salePrice) {
            // Maintain the same discount percentage
            const oldDiscount = 1 - parseFloat(product.salePrice) / parseFloat(product.regularPrice)
            const newSalePrice = newPrice * (1 - oldDiscount)
            updateData.salePrice = this.applyPriceRounding(newSalePrice, inputs.roundPricing || 'none').toFixed(2)
          }

          await this.executor.execute(
            { type: 'woo_update_product', inputs: updateData },
            context
          )

          updated++
          results.push({
            productId: product.id,
            sku: product.sku,
            oldPrice: product.regularPrice,
            newPrice: newPrice.toFixed(2),
            status: 'updated',
          })
        } catch (error) {
          failed++
          results.push({
            productId: product.id,
            sku: product.sku,
            oldPrice: product.regularPrice,
            newPrice: newPrice.toFixed(2),
            status: 'failed',
            reason: error instanceof Error ? error.message : 'Update failed',
          })
        }
      }

      return {
        success: failed === 0 || updated > 0,
        totalProcessed: products.length,
        updated,
        skipped,
        failed,
        results,
        processedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        totalProcessed: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        results,
        processedAt: new Date().toISOString(),
      }
    }
  }

  /**
   * Generate comprehensive sales report
   *
   * This action:
   * 1. Fetches orders for the specified period
   * 2. Calculates key metrics
   * 3. Generates top products/customers lists
   * 4. Compares with previous period if requested
   * 5. Formats output in requested format
   * 6. Optionally emails the report
   */
  async generateSalesReport(
    inputs: GenerateSalesReportInputs,
    context: WooCommerceExecutionContext
  ): Promise<GenerateSalesReportOutput> {
    try {
      // Calculate date range
      const { startDate, endDate } = this.calculateReportDateRange(inputs)

      // Fetch orders for the period
      const orders = await this.fetchOrdersForReport(startDate, endDate, context)

      // Calculate summary metrics
      const summary = this.calculateSummaryMetrics(orders)

      // Calculate additional metrics based on inputs
      const metrics: Record<string, unknown> = {}

      if (inputs.includeMetrics?.includes('sales_by_category')) {
        metrics.salesByCategory = this.calculateSalesByCategory(orders)
      }
      if (inputs.includeMetrics?.includes('sales_by_country')) {
        metrics.salesByCountry = this.calculateSalesByCountry(orders)
      }
      if (inputs.includeMetrics?.includes('payment_methods')) {
        metrics.paymentMethods = this.calculatePaymentMethodBreakdown(orders)
      }
      if (inputs.includeMetrics?.includes('order_statuses')) {
        metrics.orderStatuses = this.calculateOrderStatusBreakdown(orders)
      }

      // Get top products if requested
      let topProducts: GenerateSalesReportOutput['topProducts']
      if (inputs.includeMetrics?.includes('top_products')) {
        topProducts = this.calculateTopProducts(orders)
      }

      // Get top customers if requested
      let topCustomers: GenerateSalesReportOutput['topCustomers']
      if (inputs.includeMetrics?.includes('top_customers')) {
        topCustomers = this.calculateTopCustomers(orders)
      }

      // Calculate comparison with previous period
      let comparison: GenerateSalesReportOutput['comparison']
      if (inputs.compareWithPrevious) {
        const previousPeriod = this.calculatePreviousPeriod(startDate, endDate)
        const previousOrders = await this.fetchOrdersForReport(
          previousPeriod.start,
          previousPeriod.end,
          context
        )
        const previousSummary = this.calculateSummaryMetrics(previousOrders)
        comparison = {
          previousPeriodSales: previousSummary.totalSales,
          salesChange: summary.totalSales - previousSummary.totalSales,
          salesChangePercent: previousSummary.totalSales > 0
            ? ((summary.totalSales - previousSummary.totalSales) / previousSummary.totalSales) * 100
            : 0,
          previousPeriodOrders: previousSummary.totalOrders,
          ordersChange: summary.totalOrders - previousSummary.totalOrders,
          ordersChangePercent: previousSummary.totalOrders > 0
            ? ((summary.totalOrders - previousSummary.totalOrders) / previousSummary.totalOrders) * 100
            : 0,
        }
      }

      // Generate output in requested format
      let outputUrl: string | undefined
      if (inputs.outputFormat === 'pdf' || inputs.outputFormat === 'csv') {
        outputUrl = await this.generateReportFile(inputs.outputFormat, {
          summary,
          metrics,
          topProducts,
          topCustomers,
          comparison,
          period: { start: startDate, end: endDate },
        })
      }

      // Email report if requested
      if (inputs.outputFormat === 'email' && inputs.emailTo?.length) {
        await this.emailReport(inputs.emailTo, {
          summary,
          metrics,
          topProducts,
          topCustomers,
          comparison,
          period: { start: startDate, end: endDate },
        })
      }

      return {
        success: true,
        reportId: `report_${Date.now()}`,
        reportType: inputs.reportType,
        period: {
          start: startDate,
          end: endDate,
        },
        summary,
        metrics,
        comparison,
        topProducts,
        topCustomers,
        outputUrl,
        generatedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        reportId: '',
        reportType: inputs.reportType,
        period: { start: '', end: '' },
        summary: {
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          totalRefunds: 0,
          netSales: 0,
        },
        metrics: {},
        generatedAt: new Date().toISOString(),
      }
    }
  }

  // --------------------------------------------------------------------------
  // Private Helper Methods
  // --------------------------------------------------------------------------

  private formatShippingData(
    order: WooCommerceOrderOutput,
    inputs: SyncOrderToShippingInputs
  ): Record<string, unknown> {
    return {
      orderId: order.id,
      orderNumber: order.number,
      recipient: {
        name: `${order.shipping.firstName} ${order.shipping.lastName}`,
        company: order.shipping.company,
        address1: order.shipping.address1,
        address2: order.shipping.address2,
        city: order.shipping.city,
        state: order.shipping.state,
        postalCode: order.shipping.postcode,
        country: order.shipping.country,
        phone: order.shipping.phone,
        email: order.billing.email,
      },
      items: order.lineItems.map(item => ({
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        weight: inputs.packageWeight || 1,
      })),
      weight: inputs.packageWeight,
      dimensions: inputs.packageDimensions,
      serviceType: inputs.serviceType,
    }
  }

  private async createShipmentWithProvider(
    provider: string,
    shippingData: Record<string, unknown>,
    createLabel?: boolean
  ): Promise<{
    success: boolean
    shipmentId?: string
    trackingNumber?: string
    labelUrl?: string
    estimatedDelivery?: string
    carrier?: string
    service?: string
    shippingCost?: number
    error?: string
  }> {
    // Mock implementation - in production, this would call the actual shipping API
    // (ShipStation, Shippo, EasyPost, etc.)
    console.log(`[WooCommerce] Creating shipment with ${provider}`, shippingData)

    // Simulate API response
    return {
      success: true,
      shipmentId: `ship_${Date.now()}`,
      trackingNumber: `TRACK${Math.random().toString(36).substring(7).toUpperCase()}`,
      labelUrl: createLabel ? `https://shipping.example.com/label/${Date.now()}.pdf` : undefined,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      carrier: provider.toUpperCase(),
      service: (shippingData.serviceType as string) || 'Standard',
      shippingCost: 8.99,
    }
  }

  private generateCartRecoveryUrl(cartId: string, discountCode?: string): string {
    const baseUrl = 'https://store.example.com/checkout'
    const params = new URLSearchParams({ cart: cartId })
    if (discountCode) {
      params.set('coupon', discountCode)
    }
    return `${baseUrl}?${params.toString()}`
  }

  private formatAbandonedCartEmail(
    inputs: SendAbandonedCartReminderInputs,
    recoveryUrl: string
  ): { html: string; text: string } {
    const itemList = inputs.cartItems
      .map(item => `- ${item.productName} x ${item.quantity} - ${item.price}`)
      .join('\n')

    const discountText = inputs.discountCode
      ? `Use code ${inputs.discountCode} for ${inputs.discountPercent || 10}% off!`
      : ''

    const text = `
You left items in your cart!

${itemList}

Total: ${inputs.cartTotal}

${discountText}

Complete your purchase: ${recoveryUrl}
    `.trim()

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; text-align: center; }
    .items { margin: 20px 0; }
    .item { display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
    .item img { width: 60px; height: 60px; object-fit: cover; margin-right: 15px; }
    .cta { text-align: center; margin: 30px 0; }
    .cta a { background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; }
    .discount { background: #fff3cd; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You forgot something!</h1>
      <p>Your cart is waiting for you</p>
    </div>
    <div class="items">
      ${inputs.cartItems.map(item => `
        <div class="item">
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.productName}">` : ''}
          <div>
            <strong>${item.productName}</strong>
            <p>Qty: ${item.quantity} - ${item.price}</p>
          </div>
        </div>
      `).join('')}
    </div>
    <p><strong>Total: ${inputs.cartTotal}</strong></p>
    ${inputs.discountCode ? `
      <div class="discount">
        <strong>Special Offer!</strong><br>
        Use code <strong>${inputs.discountCode}</strong> for ${inputs.discountPercent || 10}% off!
      </div>
    ` : ''}
    <div class="cta">
      <a href="${recoveryUrl}">Complete Your Purchase</a>
    </div>
  </div>
</body>
</html>
    `.trim()

    return { html, text }
  }

  private getAbandonedCartSubject(reminderNumber: number): string {
    const subjects = [
      "You left something behind! Complete your order",
      "Still thinking it over? Your cart is waiting",
      "Last chance! Items in your cart are selling fast",
    ]
    return subjects[Math.min(reminderNumber - 1, subjects.length - 1)]
  }

  private async sendEmail(params: {
    to: string
    subject: string
    html: string
    text: string
  }): Promise<{ success: boolean; error?: string }> {
    // Mock implementation - in production, integrate with email service
    console.log(`[WooCommerce] Sending email to ${params.to}: ${params.subject}`)
    return { success: true }
  }

  private async fetchProductsForSync(
    _productIds: number[] | undefined,
    _context: WooCommerceExecutionContext
  ): Promise<WooCommerceProductOutput[]> {
    void _productIds // Filter by product IDs in production
    void _context // Execution context for API calls
    // Mock implementation - would fetch from WooCommerce API
    return []
  }

  private transformProductForMarketplace(
    product: WooCommerceProductOutput,
    _marketplace: string,
    inputs: SyncProductsToMarketplaceInputs
  ): Record<string, unknown> {
    void _marketplace // Used for marketplace-specific transforms
    let price = parseFloat(product.price)

    // Apply price adjustment
    if (inputs.priceAdjustment) {
      const adjustment = inputs.priceAdjustment
      if (adjustment.type === 'percent') {
        const multiplier = adjustment.direction === 'increase'
          ? 1 + adjustment.amount / 100
          : 1 - adjustment.amount / 100
        price *= multiplier
      } else {
        price += adjustment.direction === 'increase'
          ? adjustment.amount
          : -adjustment.amount
      }
    }

    return {
      title: product.name,
      description: inputs.syncDescription ? product.description : undefined,
      price: price.toFixed(2),
      sku: product.sku,
      inventory: inputs.syncInventory ? product.stockQuantity : undefined,
      images: inputs.syncImages ? product.images.map(img => img.src) : undefined,
      categories: inputs.categoryMapping
        ? product.categories.map(c => inputs.categoryMapping?.[c.id.toString()] || c.name)
        : undefined,
    }
  }

  private shouldSkipProduct(product: WooCommerceProductOutput, _marketplace: string): boolean {
    void _marketplace // Available for marketplace-specific skip rules
    // Skip products without SKU, out of stock, or not published
    return !product.sku || product.stockStatus === 'outofstock' || product.status !== 'publish'
  }

  private async syncSingleProductToMarketplace(
    marketplace: string,
    productData: Record<string, unknown>
  ): Promise<{ success: boolean; marketplaceId?: string; error?: string }> {
    // Mock implementation - would call marketplace API
    console.log(`[WooCommerce] Syncing product to ${marketplace}`, productData)
    return {
      success: true,
      marketplaceId: `${marketplace}_${Date.now()}`,
    }
  }

  private async fetchSupplierPrices(
    _inputs: UpdatePricingFromSupplierInputs
  ): Promise<Map<string, number>> {
    void _inputs // Contains supplier source configuration
    // Mock implementation - would fetch from supplier source
    const prices = new Map<string, number>()
    // In production, this would parse CSV, call API, etc.
    return prices
  }

  private async fetchProductsForPricing(
    _filter: UpdatePricingFromSupplierInputs['productFilter'],
    _context: WooCommerceExecutionContext
  ): Promise<WooCommerceProductOutput[]> {
    void _filter // Filter configuration for product selection
    void _context // Execution context for API calls
    // Mock implementation - would fetch from WooCommerce API with filters
    return []
  }

  private applyPriceRounding(price: number, rounding: string): number {
    switch (rounding) {
      case 'nearest_99':
        return Math.floor(price) + 0.99
      case 'nearest_dollar':
        return Math.round(price)
      case 'up':
        return Math.ceil(price)
      case 'down':
        return Math.floor(price)
      default:
        return price
    }
  }

  private calculateReportDateRange(inputs: GenerateSalesReportInputs): {
    startDate: string
    endDate: string
  } {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (inputs.reportType) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'custom':
        startDate = new Date(inputs.startDate || now)
        endDate = new Date(inputs.endDate || now)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  }

  private async fetchOrdersForReport(
    _startDate: string,
    _endDate: string,
    _context: WooCommerceExecutionContext
  ): Promise<WooCommerceOrderOutput[]> {
    void _startDate // Report start date filter
    void _endDate // Report end date filter
    void _context // Execution context for API calls
    // Mock implementation - would fetch from WooCommerce API
    return []
  }

  private calculateSummaryMetrics(orders: WooCommerceOrderOutput[]): {
    totalSales: number
    totalOrders: number
    averageOrderValue: number
    totalRefunds: number
    netSales: number
  } {
    const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total), 0)
    const totalRefunds = orders.reduce((sum, order) => {
      return sum + order.refunds.reduce((refundSum, refund) => {
        return refundSum + parseFloat(refund.total)
      }, 0)
    }, 0)

    return {
      totalSales,
      totalOrders: orders.length,
      averageOrderValue: orders.length > 0 ? totalSales / orders.length : 0,
      totalRefunds: Math.abs(totalRefunds),
      netSales: totalSales - Math.abs(totalRefunds),
    }
  }

  private calculateSalesByCategory(_orders: WooCommerceOrderOutput[]): Record<string, number> {
    void _orders // Orders to aggregate by category
    const salesByCategory: Record<string, number> = {}
    // Implementation would aggregate line items by category
    return salesByCategory
  }

  private calculateSalesByCountry(orders: WooCommerceOrderOutput[]): Record<string, number> {
    const salesByCountry: Record<string, number> = {}
    for (const order of orders) {
      const country = order.billing.country || 'Unknown'
      salesByCountry[country] = (salesByCountry[country] || 0) + parseFloat(order.total)
    }
    return salesByCountry
  }

  private calculatePaymentMethodBreakdown(orders: WooCommerceOrderOutput[]): Record<string, number> {
    const breakdown: Record<string, number> = {}
    for (const order of orders) {
      const method = order.paymentMethodTitle || order.paymentMethod || 'Unknown'
      breakdown[method] = (breakdown[method] || 0) + 1
    }
    return breakdown
  }

  private calculateOrderStatusBreakdown(orders: WooCommerceOrderOutput[]): Record<string, number> {
    const breakdown: Record<string, number> = {}
    for (const order of orders) {
      breakdown[order.status] = (breakdown[order.status] || 0) + 1
    }
    return breakdown
  }

  private calculateTopProducts(orders: WooCommerceOrderOutput[]): Array<{
    productId: number
    productName: string
    quantitySold: number
    revenue: number
  }> {
    const productMap = new Map<number, { name: string; quantity: number; revenue: number }>()

    for (const order of orders) {
      for (const item of order.lineItems) {
        const existing = productMap.get(item.productId) || {
          name: item.name,
          quantity: 0,
          revenue: 0,
        }
        existing.quantity += item.quantity
        existing.revenue += parseFloat(item.total)
        productMap.set(item.productId, existing)
      }
    }

    return Array.from(productMap.entries())
      .map(([id, data]) => ({
        productId: id,
        productName: data.name,
        quantitySold: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  private calculateTopCustomers(orders: WooCommerceOrderOutput[]): Array<{
    customerId: number
    customerEmail: string
    orderCount: number
    totalSpent: number
  }> {
    const customerMap = new Map<number, { email: string; orders: number; spent: number }>()

    for (const order of orders) {
      const existing = customerMap.get(order.customerId) || {
        email: order.billing.email || '',
        orders: 0,
        spent: 0,
      }
      existing.orders++
      existing.spent += parseFloat(order.total)
      customerMap.set(order.customerId, existing)
    }

    return Array.from(customerMap.entries())
      .map(([id, data]) => ({
        customerId: id,
        customerEmail: data.email,
        orderCount: data.orders,
        totalSpent: data.spent,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
  }

  private calculatePreviousPeriod(startDate: string, endDate: string): {
    start: string
    end: string
  } {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const duration = end.getTime() - start.getTime()

    return {
      start: new Date(start.getTime() - duration).toISOString(),
      end: new Date(end.getTime() - duration).toISOString(),
    }
  }

  private async generateReportFile(
    format: 'pdf' | 'csv',
    _data: Record<string, unknown>
  ): Promise<string> {
    void _data // Report data for file generation
    // Mock implementation - would generate actual file
    return `https://reports.example.com/${format}/report_${Date.now()}.${format}`
  }

  private async emailReport(
    recipients: string[],
    _data: Record<string, unknown>
  ): Promise<void> {
    void _data // Report data for email content
    // Mock implementation - would send email with report
    console.log(`[WooCommerce] Emailing report to ${recipients.join(', ')}`)
  }
}

// ============================================================================
// Singleton Export for Workflow Actions
// ============================================================================

export const wooCommerceWorkflowActions = new WooCommerceWorkflowActions()

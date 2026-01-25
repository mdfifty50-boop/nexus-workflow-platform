/**
 * E-commerce Workflow Templates Module
 *
 * This module provides production-ready workflow templates for e-commerce automation.
 * All templates use real Composio tool slugs and are ready for execution.
 *
 * Templates included:
 * - Order Fulfillment Pipeline
 * - Inventory Alert Workflow
 * - Customer Onboarding Flow
 * - Abandoned Cart Recovery
 * - Refund Processing Flow
 *
 * @example
 * ```typescript
 * import {
 *   ecommerceTemplates,
 *   getEcommerceTemplateById,
 *   orderFulfillmentPipeline
 * } from './workflow-engine/templates/ecommerce'
 *
 * // Get all templates
 * const allTemplates = ecommerceTemplates
 *
 * // Get a specific template
 * const fulfillmentTemplate = getEcommerceTemplateById('order-fulfillment-pipeline')
 *
 * // Use template directly
 * const workflow = orderFulfillmentPipeline
 * ```
 */

// ========================================
// Type Exports
// ========================================

export type {
  // Template category and trigger types
  EcommerceTemplateCategory,
  TemplateTriggerType,
  EcommerceStepType,

  // Step configuration types
  ConditionConfig,
  TransformOperationConfig,
  WaitConfig,
  IntegrationConfig,
  AIAgentConfig,
  NotificationConfig,
  EcommerceStepConfig,

  // Workflow structure types
  EcommerceWorkflowStep,
  EcommerceWorkflowEdge,
  EcommerceWorkflowDefinition,

  // Integration and mapping types
  EcommerceIntegration,
  InputMapping,
  OutputMapping,
  EcommerceTriggerConfig,

  // Main template type
  EcommerceWorkflowTemplate,

  // Collection types
  EcommerceTemplateCollection,
  TemplateFilterOptions,
  TemplateSearchResult,
} from './ecommerce-template-types'

// ========================================
// Template Exports
// ========================================

export {
  // Individual templates
  orderFulfillmentPipeline,
  inventoryAlertWorkflow,
  customerOnboardingFlow,
  abandonedCartRecovery,
  refundProcessingFlow,

  // Template collection
  ecommerceTemplates,

  // Utility functions
  getEcommerceTemplateById,
  getEcommerceTemplatesByCategory,
  getPopularEcommerceTemplates,
  getNewEcommerceTemplates,
  searchEcommerceTemplates,
} from './ecommerce-templates'

// ========================================
// Convenience Re-exports
// ========================================

/**
 * Template IDs for reference
 */
export const ECOMMERCE_TEMPLATE_IDS = {
  ORDER_FULFILLMENT: 'order-fulfillment-pipeline',
  INVENTORY_ALERT: 'inventory-alert-workflow',
  CUSTOMER_ONBOARDING: 'customer-onboarding-flow',
  ABANDONED_CART: 'abandoned-cart-recovery',
  REFUND_PROCESSING: 'refund-processing-flow',
} as const

/**
 * Template categories
 */
export const ECOMMERCE_CATEGORIES = {
  ORDER_MANAGEMENT: 'order-management',
  INVENTORY: 'inventory',
  CUSTOMER_LIFECYCLE: 'customer-lifecycle',
  MARKETING: 'marketing',
  RETURNS_REFUNDS: 'returns-refunds',
  SHIPPING_LOGISTICS: 'shipping-logistics',
  ANALYTICS: 'analytics',
} as const

/**
 * Common Composio tool slugs used in e-commerce templates
 */
export const ECOMMERCE_TOOL_SLUGS = {
  // Shopify
  SHOPIFY_GET_ORDER: 'SHOPIFY_GET_ORDER',
  SHOPIFY_UPDATE_ORDER: 'SHOPIFY_UPDATE_ORDER',
  SHOPIFY_GET_CUSTOMER: 'SHOPIFY_GET_CUSTOMER',
  SHOPIFY_CREATE_REFUND: 'SHOPIFY_CREATE_REFUND',
  SHOPIFY_GET_INVENTORY_LEVELS: 'SHOPIFY_GET_INVENTORY_LEVELS',
  SHOPIFY_GET_ABANDONED_CHECKOUTS: 'SHOPIFY_GET_ABANDONED_CHECKOUTS',
  SHOPIFY_CREATE_DISCOUNT: 'SHOPIFY_CREATE_DISCOUNT',

  // Shipping
  SHIPSTATION_CREATE_LABEL: 'SHIPSTATION_CREATE_LABEL',
  SHIPSTATION_GET_TRACKING: 'SHIPSTATION_GET_TRACKING',

  // Payment
  STRIPE_CREATE_REFUND: 'STRIPE_CREATE_REFUND',
  STRIPE_GET_CHARGE: 'STRIPE_GET_CHARGE',

  // CRM
  HUBSPOT_CREATE_CONTACT: 'HUBSPOT_CREATE_CONTACT',
  HUBSPOT_UPDATE_CONTACT: 'HUBSPOT_UPDATE_CONTACT',

  // Email
  GMAIL_SEND_EMAIL: 'GMAIL_SEND_EMAIL',
  MAILCHIMP_ADD_SUBSCRIBER: 'MAILCHIMP_ADD_SUBSCRIBER',

  // Communication
  SLACK_SEND_MESSAGE: 'SLACK_SEND_MESSAGE',

  // Storage
  GOOGLESHEETS_APPEND_DATA: 'GOOGLESHEETS_APPEND_DATA',
  GOOGLESHEETS_UPDATE_DATA: 'GOOGLESHEETS_UPDATE_DATA',
  GOOGLESHEETS_GET_DATA: 'GOOGLESHEETS_GET_DATA',
  AIRTABLE_CREATE_RECORD: 'AIRTABLE_CREATE_RECORD',
} as const

/**
 * Workflow Engine Integrations Registry
 *
 * Central hub for all external service integrations in the Nexus workflow engine.
 * Each integration provides:
 *
 * 1. API Client - Authenticated access to the service
 * 2. Webhooks - Event handling from the service
 * 3. Templates - Pre-built workflow templates
 * 4. Actions - Workflow actions specific to the service
 *
 * Supported Integrations:
 * - E-commerce: Shopify (active), WooCommerce (active), BigCommerce (planned)
 * - Payments: Stripe (active), PayPal (active)
 * - CRM: Salesforce, HubSpot (via existing Composio)
 * - Communication: Slack, Discord, Email (via existing Composio)
 * - Productivity: Google Workspace, Microsoft 365 (via existing Composio)
 *
 * @module integrations
 */

// ============================================================================
// E-COMMERCE INTEGRATIONS
// ============================================================================

// Shopify - Complete e-commerce workflow automation
export {
  // Factory & Registration
  createShopifyIntegration,
  registerShopifyWithEngine,

  // Client
  ShopifyClient,
  createShopifyClient,

  // Webhooks
  ShopifyWebhookHandler,
  createShopifyWebhookHandler,
  initializeShopifyWebhooks,
  verifyShopifyWebhookHmac,
  getSupportedShopifyTopics,

  // Actions
  ShopifyActionExecutor,
  shopifyActionExecutor,
  SHOPIFY_ACTION_DEFINITIONS,
  SHOPIFY_ACTION_REGISTRY,
  validateShopifyAction,
  getActionsByCategory,

  // Templates
  getShopifyTemplates,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates,

  // Error Classes
  ShopifyError,
  ShopifyAuthError,
  ShopifyRateLimitError,
  ShopifyNotFoundError,
  ShopifyValidationError,

  // Types - Config
  type ShopifyConfig,
  type CreateShopifyIntegrationConfig,

  // Types - Models
  type ShopifyProduct,
  type ShopifyVariant,
  type ShopifyOrder,
  type ShopifyCustomer,
  type ShopifyFulfillment,
  type ShopifyInventoryLevel,
  type ShopifyLocation,
  type ShopifyAddress,
  type ShopifyLineItem,
  type ShopifyRefund,

  // Types - Webhooks
  type ShopifyWebhookTopic,
  type ShopifyWebhookHeaders,
  type ShopifyWebhookRequest,
  type ShopifyWebhookValidationResult,
  type NormalizedShopifyEvent,
  type ShopifyEventCategory,

  // Types - Templates
  type ShopifyTemplate,
  type ShopifyTemplateCategory,
  type ShopifyTemplateDifficulty,
  type ShopifyTemplateStep,

  // Types - Actions
  type ShopifyActionType,
  type ShopifyExecutionResult,
  type ShopifyExecutionContext,
  type ActionDefinition,

  // Types - Integration
  type ShopifyIntegration,
} from './shopify'

// WooCommerce - WordPress e-commerce workflow automation
export {
  // Factory & Registration
  createWooCommerceIntegration,
  registerWooCommerceWithEngine,

  // Client
  WooCommerceClient,
  createWooCommerceClient,

  // Webhooks
  WooCommerceWebhookHandler,
  createWooCommerceWebhookHandler,
  initializeWooCommerceWebhooks,
  verifyWooCommerceWebhookHmac,
  getSupportedWooCommerceTopics,

  // Actions
  WooCommerceActionExecutor,
  wooCommerceActionExecutor,
  WOOCOMMERCE_ACTION_DEFINITIONS,
  WOOCOMMERCE_ACTION_REGISTRY,
  validateWooCommerceAction,
  getWooCommerceActionsByCategory,

  // Templates
  getWooCommerceTemplates,
  getWooCommerceTemplatesByCategory,
  getWooCommerceTemplateById,
  searchWooCommerceTemplates,

  // Error Classes
  WooCommerceError,
  WooCommerceAuthError,
  WooCommerceRateLimitError,
  WooCommerceNotFoundError,
  WooCommerceValidationError,
  WooCommerceForbiddenError,

  // Types - Config
  type WooCommerceConfig,
  type CreateWooCommerceIntegrationConfig,

  // Types - Models (from client)
  type WooOrder,
  type WooProduct,
  type WooCustomer,
  type WooRefund,
  type WooOrderNote,
  type WooAddress,

  // Types - Webhooks
  type WooCommerceWebhookTopic,
  type WooCommerceWebhookHeaders,
  type WooCommerceWebhookRequest,
  type WooCommerceWebhookValidationResult,
  type NormalizedWooCommerceEvent,
  type WooCommerceEventCategory,

  // Types - Templates
  type WooCommerceTemplate,
  type WooCommerceTemplateCategory,
  type WooCommerceTemplateDifficulty,
  type WooCommerceTemplateStep,

  // Types - Actions
  type WooCommerceActionType,
  type WooCommerceExecutionResult,
  type WooCommerceExecutionContext,
  type WooCommerceActionDefinition,

  // Types - Integration
  type WooCommerceIntegration,
} from './woocommerce'

// ============================================================================
// PAYMENT INTEGRATIONS
// ============================================================================

// Payment Gateway Base Types
export {
  // Gateway Manager
  PaymentGatewayManager,
  paymentGatewayManager,

  // Setup helpers
  setupStripeGateway,
  setupPayPalGateway,

  // Order integration
  createOrderPaymentHandler,

  // Error classes
  PaymentGatewayError,
  CardError,
  PaymentAuthError,
  PaymentRateLimitError,
  PaymentValidationError,

  // Helper functions
  toSmallestUnit,
  fromSmallestUnit,
  formatMoney,
  createMoney,
  isPaymentSuccessful,
  canRefund,
  canCapture,
  canVoid,
  generateIdempotencyKey,
} from './payments'

// Stripe Gateway
export {
  StripeGateway,
  createStripeGateway,
} from './payments'

// PayPal Gateway
export {
  PayPalGateway,
  createPayPalGateway,
  createExpressCheckout,
  completeExpressCheckout,
} from './payments'

// Payment Types
export type {
  // Core types
  PaymentMethodType,
  CardBrand,
  PaymentStatus,
  RefundStatus,
  CurrencyCode,

  // Money and address types
  Money,
  BillingAddress,
  CardDetails,
  PaymentCustomer,
  PaymentMethodDetails,

  // Payment request/response types
  PaymentRequest,
  PaymentResult,
  PaymentError,
  CaptureRequest,
  CaptureResult,
  VoidRequest,
  VoidResult,
  RefundRequest,
  RefundResult,

  // Customer types
  GatewayCustomer,
  CreateCustomerRequest,
  UpdateCustomerRequest,

  // Subscription types
  SubscriptionStatus,
  BillingInterval,
  SubscriptionPlan,
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionResult,

  // Webhook types
  PaymentWebhookEventType,
  PaymentWebhookEvent,
  WebhookVerificationResult,

  // Gateway interface and config
  PaymentGatewayConfig,
  PaymentGateway,
  PaymentGatewayType,
  PaymentGatewayTypeConfig,

  // Provider-specific configs
  StripeConfig,
  PayPalConfig,
} from './payments'

// ============================================================================
// INTEGRATION REGISTRY
// ============================================================================

/**
 * Integration category enumeration
 */
export type IntegrationCategory =
  | 'ecommerce'
  | 'crm'
  | 'communication'
  | 'productivity'
  | 'finance'
  | 'payments'
  | 'marketing'
  | 'hr'
  | 'devops'
  | 'analytics'

/**
 * Integration status
 */
export type IntegrationStatus = 'active' | 'beta' | 'planned' | 'deprecated'

/**
 * Integration metadata
 */
export interface IntegrationMeta {
  id: string
  name: string
  displayName: string
  description: string
  category: IntegrationCategory
  status: IntegrationStatus
  icon?: string
  documentationUrl?: string
  requiredScopes?: string[]
  features: string[]
}

/**
 * Registry of all available integrations
 */
export const INTEGRATION_REGISTRY: IntegrationMeta[] = [
  // E-commerce
  {
    id: 'shopify',
    name: 'shopify',
    displayName: 'Shopify',
    description: 'Complete e-commerce workflow automation for Shopify stores',
    category: 'ecommerce',
    status: 'active',
    icon: 'shopping-bag',
    documentationUrl: 'https://shopify.dev/docs/api',
    requiredScopes: [
      'read_products',
      'write_products',
      'read_orders',
      'write_orders',
      'read_customers',
      'write_customers',
      'read_inventory',
      'write_inventory',
    ],
    features: [
      'Order management',
      'Inventory sync',
      'Customer data',
      'Fulfillment automation',
      'Product updates',
      'Webhook events',
    ],
  },
  {
    id: 'woocommerce',
    name: 'woocommerce',
    displayName: 'WooCommerce',
    description: 'Complete e-commerce workflow automation for WordPress WooCommerce stores',
    category: 'ecommerce',
    status: 'active',
    icon: 'shopping-cart',
    documentationUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
    requiredScopes: [
      'read',
      'write',
    ],
    features: [
      'Order management',
      'Inventory sync',
      'Customer data',
      'Product updates',
      'Refund processing',
      'Order notes',
      'Webhook events',
    ],
  },
  {
    id: 'bigcommerce',
    name: 'bigcommerce',
    displayName: 'BigCommerce',
    description: 'BigCommerce store integration',
    category: 'ecommerce',
    status: 'planned',
    icon: 'store',
    features: ['Order management', 'Multi-channel', 'Inventory'],
  },
  // Payment Gateways
  {
    id: 'stripe',
    name: 'stripe',
    displayName: 'Stripe',
    description: 'Complete payment processing with Stripe including cards, subscriptions, and webhooks',
    category: 'finance',
    status: 'active',
    icon: 'credit-card',
    documentationUrl: 'https://stripe.com/docs/api',
    features: [
      'Payment processing',
      'Subscription management',
      'Customer management',
      'Refunds and voids',
      'Webhook events',
      'Apple Pay / Google Pay',
      '3D Secure support',
    ],
  },
  {
    id: 'paypal',
    name: 'paypal',
    displayName: 'PayPal',
    description: 'PayPal Checkout integration for express payments and card processing',
    category: 'finance',
    status: 'active',
    icon: 'wallet',
    documentationUrl: 'https://developer.paypal.com/docs/api/overview/',
    features: [
      'PayPal Checkout',
      'Express payments',
      'Refund processing',
      'Webhook events',
      'Card payments',
    ],
  },
]

/**
 * Get all integrations
 */
export function getAllIntegrations(): IntegrationMeta[] {
  return INTEGRATION_REGISTRY
}

/**
 * Get integrations by category
 */
export function getIntegrationsByCategory(category: IntegrationCategory): IntegrationMeta[] {
  return INTEGRATION_REGISTRY.filter((i) => i.category === category)
}

/**
 * Get integrations by status
 */
export function getIntegrationsByStatus(status: IntegrationStatus): IntegrationMeta[] {
  return INTEGRATION_REGISTRY.filter((i) => i.status === status)
}

/**
 * Get active integrations
 */
export function getActiveIntegrations(): IntegrationMeta[] {
  return getIntegrationsByStatus('active')
}

/**
 * Get integration by ID
 */
export function getIntegration(id: string): IntegrationMeta | undefined {
  return INTEGRATION_REGISTRY.find((i) => i.id === id)
}

/**
 * Check if integration is available
 */
export function isIntegrationAvailable(id: string): boolean {
  const integration = getIntegration(id)
  return integration?.status === 'active' || integration?.status === 'beta'
}

// ============================================================================
// INTEGRATION MANAGER
// ============================================================================

/**
 * Configuration for an integration instance
 */
export interface IntegrationInstanceConfig {
  integrationId: string
  config: Record<string, unknown>
  enabled: boolean
}

/**
 * Integration Manager
 * Manages multiple integration instances and provides unified access
 */
export class IntegrationManager {
  private instances: Map<string, unknown> = new Map()
  private configs: Map<string, IntegrationInstanceConfig> = new Map()

  /**
   * Register an integration
   */
  register<T>(id: string, instance: T, config: IntegrationInstanceConfig): void {
    this.instances.set(id, instance)
    this.configs.set(id, config)
    console.log(`[IntegrationManager] Registered integration: ${id}`)
  }

  /**
   * Get an integration instance
   */
  get<T>(id: string): T | undefined {
    return this.instances.get(id) as T | undefined
  }

  /**
   * Check if integration is registered
   */
  has(id: string): boolean {
    return this.instances.has(id)
  }

  /**
   * Remove an integration
   */
  remove(id: string): boolean {
    const existed = this.instances.delete(id)
    this.configs.delete(id)
    if (existed) {
      console.log(`[IntegrationManager] Removed integration: ${id}`)
    }
    return existed
  }

  /**
   * Get all registered integration IDs
   */
  getRegisteredIds(): string[] {
    return Array.from(this.instances.keys())
  }

  /**
   * Get config for an integration
   */
  getConfig(id: string): IntegrationInstanceConfig | undefined {
    return this.configs.get(id)
  }

  /**
   * Update config for an integration
   */
  updateConfig(id: string, config: Partial<IntegrationInstanceConfig>): void {
    const existing = this.configs.get(id)
    if (existing) {
      this.configs.set(id, { ...existing, ...config })
    }
  }

  /**
   * Get integration summary
   */
  getSummary(): Array<{
    id: string
    integrationId: string
    enabled: boolean
  }> {
    return Array.from(this.configs.entries()).map(([id, config]) => ({
      id,
      integrationId: config.integrationId,
      enabled: config.enabled,
    }))
  }
}

/**
 * Default integration manager instance
 */
export const integrationManager = new IntegrationManager()

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all e-commerce integrations (Shopify, WooCommerce, BigCommerce, etc.)
 */
export function getAllEcommerceIntegrations(): IntegrationMeta[] {
  return getIntegrationsByCategory('ecommerce')
}

/**
 * Quick helper to create and register Shopify integration
 */
export async function setupShopifyIntegration(
  manager: IntegrationManager,
  config: {
    shopName: string
    accessToken: string
    apiVersion?: string
    webhookSecret?: string
  }
): Promise<void> {
  const { createShopifyIntegration } = await import('./shopify')

  const shopifyConfig = {
    shopName: config.shopName,
    accessToken: config.accessToken,
    apiVersion: config.apiVersion || '2024-01',
    webhookSecret: config.webhookSecret,
  }

  const integration = createShopifyIntegration(shopifyConfig)
  await integration.connect()

  manager.register('shopify', integration, {
    integrationId: 'shopify',
    config: shopifyConfig,
    enabled: true,
  })
}

/**
 * Quick helper to create and register WooCommerce integration
 */
export async function setupWooCommerceIntegration(
  manager: IntegrationManager,
  config: {
    siteUrl: string
    consumerKey: string
    consumerSecret: string
    webhookSecret?: string
  }
): Promise<void> {
  const { createWooCommerceIntegration } = await import('./woocommerce')

  const wooConfig = {
    siteUrl: config.siteUrl,
    consumerKey: config.consumerKey,
    consumerSecret: config.consumerSecret,
    webhookSecret: config.webhookSecret,
  }

  const integration = createWooCommerceIntegration(wooConfig)
  await integration.connect()

  manager.register('woocommerce', integration, {
    integrationId: 'woocommerce',
    config: wooConfig,
    enabled: true,
  })
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Registry functions
  getAllIntegrations,
  getIntegrationsByCategory,
  getIntegrationsByStatus,
  getActiveIntegrations,
  getIntegration,
  isIntegrationAvailable,
  getAllEcommerceIntegrations,

  // Manager
  IntegrationManager,
  integrationManager,

  // Quick setup - Shopify
  setupShopifyIntegration,

  // Quick setup - WooCommerce
  setupWooCommerceIntegration,
}

/**
 * WooCommerce Integration Module
 *
 * Provides native WooCommerce REST API integration for the Nexus workflow engine.
 * Includes both REST API client for direct API calls and webhook handlers for events.
 *
 * @module integrations/woocommerce
 * @version 2024-01
 *
 * @example
 * ```typescript
 * // REST API Client Usage
 * import { createWooCommerceClient, WooCommerceConfig } from './integrations/woocommerce';
 *
 * const config: WooCommerceConfig = {
 *   siteUrl: 'https://mystore.com',
 *   consumerKey: 'ck_xxxxx',
 *   consumerSecret: 'cs_xxxxx',
 *   version: 'wc/v3'
 * };
 *
 * const client = createWooCommerceClient(config);
 *
 * // Fetch orders
 * const orders = await client.getOrders({ status: 'processing', per_page: 50 });
 *
 * // Get specific order
 * const order = await client.getOrder(123456);
 *
 * // Update order status
 * await client.updateOrder(123456, { status: 'completed' });
 *
 * // Create refund
 * await client.createRefund(123456, {
 *   amount: '25.00',
 *   reason: 'Customer request',
 *   api_refund: true
 * });
 *
 * // Add order note
 * await client.addOrderNote(123456, {
 *   note: 'Tracking number: 1Z999AA10123456784',
 *   customer_note: true
 * });
 *
 * // Webhook Handler Usage
 * import {
 *   createWooCommerceWebhookHandler,
 *   WooCommerceWebhookHandler,
 *   processWooCommerceWebhook,
 * } from './integrations/woocommerce';
 *
 * // Initialize webhook handler with your store's webhook secret
 * const handler = createWooCommerceWebhookHandler('your-webhook-secret');
 *
 * // Process incoming webhook
 * const result = await handler.handleWebhook({
 *   headers: {
 *     'x-wc-webhook-signature': 'base64-signature',
 *     'x-wc-webhook-topic': 'order.created',
 *     'x-wc-webhook-resource': 'order',
 *     'x-wc-webhook-event': 'created',
 *   },
 *   body: orderPayload,
 *   rawBody: JSON.stringify(orderPayload),
 * });
 *
 * if (result.success) {
 *   console.log('Processed event:', result.event);
 * }
 * ```
 */

// ============================================================================
// REST API CLIENT EXPORTS (Loop 20)
// ============================================================================

// Export main client
export {
  WooCommerceClient,
  createWooCommerceClient
} from './woocommerce-client';

// Export configuration types
export type {
  WooCommerceConfig,
  RetryConfig
} from './woocommerce-client';

// Export common types
export type {
  WooAddress,
  WooMeta,
  WooImage,
  WooTaxLine
} from './woocommerce-client';

// Export order types from client
export type {
  WooOrder,
  WooOrderStatus,
  WooLineItem,
  WooShippingLine,
  WooFeeLine,
  WooCouponLine,
  WooRefundLine
} from './woocommerce-client';

// Export product types from client
export type {
  WooProduct,
  WooProductDimensions,
  WooProductCategory,
  WooProductTag,
  WooProductAttribute,
  WooProductDownload
} from './woocommerce-client';

// Export customer types from client
export type {
  WooCustomer
} from './woocommerce-client';

// Export refund types from client
export type {
  WooRefund,
  WooRefundLineItem
} from './woocommerce-client';

// Export order note types
export type {
  WooOrderNote
} from './woocommerce-client';

// Export query parameter types
export type {
  WooOrdersQueryParams,
  WooProductsQueryParams,
  WooCustomersQueryParams
} from './woocommerce-client';

// Export update/create data types
export type {
  WooUpdateOrderData,
  WooUpdateProductData,
  WooCreateRefundData,
  WooCreateOrderNoteData
} from './woocommerce-client';

// Export error types from client
export {
  WooCommerceError,
  WooCommerceAuthError,
  WooCommerceForbiddenError,
  WooCommerceNotFoundError,
  WooCommerceValidationError,
  WooCommerceRateLimitError
} from './woocommerce-client';

// ============================================================================
// WEBHOOK HANDLER EXPORTS (Loop 20)
// ============================================================================

// Export webhook handler class and factory
export {
  WooCommerceWebhookHandler,
  createWooCommerceWebhookHandler,
  initializeWooCommerceWebhooks,
  getWooCommerceWebhookHandler,
  processWooCommerceWebhook,
  getWooCommerceSourceConfig,
  verifyWooCommerceWebhookHmac,
  getSupportedWooCommerceTopics,
  isWooCommerceTopicSupported,
  getWooCommerceEventType,
  getWooCommerceEventCategory,
  getWooCommerceEntityType,
} from './woocommerce-webhooks';

// Export webhook types
export type {
  WooCommerceWebhookTopic,
  WooCommerceOrderTopic,
  WooCommerceProductTopic,
  WooCommerceCustomerTopic,
  WooCommerceCouponTopic,
  WooCommerceEventCategory,
  WooCommerceWebhookHeaders,
  WooCommerceWebhookRequest,
  WooCommerceWebhookValidationResult,
  NormalizedWooCommerceEvent,
} from './woocommerce-webhooks';

// Export payload types
export type {
  WooCommerceOrder,
  WooCommerceCustomer,
  WooCommerceProduct,
  WooCommerceCoupon,
  WooCommerceLineItem,
  WooCommerceAddress,
  WooCommerceTaxLine,
  WooCommerceTax,
  WooCommerceShippingLine,
  WooCommerceFee,
  WooCommerceCouponLine,
  WooCommerceRefundSummary,
  WooCommerceMetaData,
  WooCommerceDownload,
  WooCommerceDimensions,
  WooCommerceCategory,
  WooCommerceTag,
  WooCommerceImage,
  WooCommerceAttribute,
  WooCommerceDefaultAttribute,
} from './woocommerce-webhooks';

// ============================================================================
// WORKFLOW TEMPLATES EXPORTS (Loop 20)
// ============================================================================

// Export template functions
export {
  getWooCommerceTemplates,
  getTemplatesByCategory as getWooCommerceTemplatesByCategory,
  getTemplateById as getWooCommerceTemplateById,
  getTemplatesByDifficulty as getWooCommerceTemplatesByDifficulty,
  getTemplatesByTags as getWooCommerceTemplatesByTags,
  searchTemplates as searchWooCommerceTemplates,
  getTemplateCounts as getWooCommerceTemplateCounts,
  getAllRequiredConnections as getWooCommerceRequiredConnections,
  getTotalEstimatedSavings as getWooCommerceTotalSavings,
} from './woocommerce-templates';

// Export template types
export type {
  WooCommerceTemplate,
  WooCommerceTemplateCategory,
  WooCommerceTemplateDifficulty,
  WooCommerceTemplateStep,
} from './woocommerce-templates';

// ============================================================================
// WOOCOMMERCE ACTIONS EXPORTS (Loop 20 - T4)
// ============================================================================

// Export action executor class and singleton
export {
  WooCommerceActionExecutor,
  wooCommerceActionExecutor,
} from './woocommerce-actions';

// Export action type definitions
export type {
  WooCommerceActionType,
  WooCommerceActionBase,
} from './woocommerce-actions';

// Export action input types
export type {
  WooCommerceGetOrderInputs,
  WooCommerceUpdateOrderInputs,
  WooCommerceUpdateOrderStatusInputs,
  WooCommerceAddOrderNoteInputs,
  WooCommerceCreateRefundInputs,
  WooCommerceGetProductInputs,
  WooCommerceUpdateProductInputs,
  WooCommerceUpdateStockInputs,
  WooCommerceGetCustomerInputs,
  WooCommerceCreateCustomerInputs,
  WooCommerceSendOrderEmailInputs,
  WooCommerceAddressInput,
} from './woocommerce-actions';

// Export action output types
export type {
  WooCommerceOrderOutput,
  WooCommerceAddressOutput,
  WooCommerceLineItemOutput,
  WooCommerceTaxLineOutput,
  WooCommerceShippingLineOutput,
  WooCommerceFeeLineOutput,
  WooCommerceCouponLineOutput,
  WooCommerceRefundSummaryOutput,
  WooCommerceProductOutput,
  WooCommerceImageOutput,
  WooCommerceAttributeOutput,
  WooCommerceCustomerOutput,
  WooCommerceRefundOutput,
  WooCommerceOrderNoteOutput,
  WooCommerceEmailOutput,
} from './woocommerce-actions';

// Export enums and constants
export type {
  WooCommerceOrderStatus,
  WooCommerceEmailType,
} from './woocommerce-actions';

// Export execution types
export type {
  WooCommerceExecutionResult,
  WooCommerceExecutionContext,
  WooCommerceActionDefinition,
  WooCommerceActionRegistryEntry,
} from './woocommerce-actions';

// Export action definitions and registry
export {
  WOOCOMMERCE_ACTION_DEFINITIONS,
  WOOCOMMERCE_ACTION_REGISTRY,
} from './woocommerce-actions';

// Export helper functions
export {
  validateWooCommerceAction,
  formatWooCommerceResponse,
  getWooCommerceActionRequirements,
  getWooCommerceActionsByCategory,
  getWooCommerceActionByType,
  isValidWooCommerceAction,
} from './woocommerce-actions'

// Export pre-built workflow action types
export type {
  WooCommerceWorkflowActionType,
  SyncOrderToShippingInputs,
  SyncOrderToShippingOutput,
  SendAbandonedCartReminderInputs,
  SendAbandonedCartReminderOutput,
  SyncProductsToMarketplaceInputs,
  SyncProductsToMarketplaceOutput,
  UpdatePricingFromSupplierInputs,
  UpdatePricingFromSupplierOutput,
  GenerateSalesReportInputs,
  GenerateSalesReportOutput,
} from './woocommerce-actions'

// Export pre-built workflow action executor class and singleton
export {
  WooCommerceWorkflowActions,
  wooCommerceWorkflowActions,
} from './woocommerce-actions'

// ============================================================================
// EXTENDED CLIENT EXPORTS (Coupon, Shipping, Tax, Payment, Subscriptions)
// ============================================================================

// Export extended client
export {
  WooCommerceExtendedClient,
  createWooCommerceExtendedClient,
} from './woocommerce-integration'

// Export coupon types
export type {
  WooCoupon,
  WooDiscountType,
  WooCreateCouponData,
  WooUpdateCouponData,
  WooCouponsQueryParams,
} from './woocommerce-integration'

// Export shipping types
export type {
  WooShippingZone,
  WooShippingMethod,
  WooShippingZoneLocation,
} from './woocommerce-integration'

// Export tax types
export type {
  WooTaxRate,
  WooTaxClass,
} from './woocommerce-integration'

// Export payment gateway types
export type {
  WooPaymentGateway,
} from './woocommerce-integration'

// Export WordPress auth types
export type {
  WPUserCredentials,
  WPApplicationPassword,
  WPAuthResult,
} from './woocommerce-integration'

// Export subscription types (WooCommerce Subscriptions plugin)
export type {
  WooSubscription,
  WooSubscriptionStatus,
  WooBillingPeriod,
} from './woocommerce-integration'

// Export helper functions from extended client
export {
  generateCouponCode,
  calculateDiscount,
  validateCouponUsability,
  formatWooCurrency,
  isWooCoupon,
  isWooSubscription,
} from './woocommerce-integration';

// ============================================================================
// INTEGRATION FACTORY & REGISTRATION
// ============================================================================

import type { WooCommerceConfig } from './woocommerce-client';
import { createWooCommerceClient, WooCommerceClient } from './woocommerce-client';
import { initializeWooCommerceWebhooks, WooCommerceWebhookHandler, createWooCommerceWebhookHandler } from './woocommerce-webhooks';
import { wooCommerceActionExecutor, WooCommerceActionExecutor } from './woocommerce-actions';
import type { WooCommerceActionType, WooCommerceExecutionResult, WooCommerceExecutionContext } from './woocommerce-actions';
import { getWooCommerceTemplates, getTemplatesByCategory } from './woocommerce-templates';
import type { WooCommerceTemplate, WooCommerceTemplateCategory } from './woocommerce-templates';

/**
 * Unified WooCommerce Integration Instance
 * Combines client, webhooks, templates, and actions into a single interface
 */
export interface WooCommerceIntegration {
  readonly config: WooCommerceConfig;
  readonly client: WooCommerceClient;
  readonly webhookHandler: WooCommerceWebhookHandler | null;
  readonly actionExecutor: WooCommerceActionExecutor;
  readonly isConnected: boolean;

  // Auth methods
  connect(): Promise<boolean>;
  disconnect(): void;

  // Template methods
  getTemplates(category?: WooCommerceTemplateCategory): WooCommerceTemplate[];
  getTemplate(templateId: string): WooCommerceTemplate | undefined;

  // Action methods
  executeAction<T extends WooCommerceActionType>(
    action: T,
    inputs: Record<string, unknown>,
    context?: { siteUrl?: string }
  ): Promise<WooCommerceExecutionResult>;
}

/**
 * Configuration for creating a WooCommerce integration
 */
export interface CreateWooCommerceIntegrationConfig {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
  version?: string;
  webhookSecret?: string;
}

/**
 * Create a unified WooCommerce integration instance
 *
 * @param config - WooCommerce configuration with site URL, API keys, and optional webhook secret
 * @returns WooCommerceIntegration instance with client, webhooks, templates, and actions
 *
 * @example
 * ```typescript
 * const woo = createWooCommerceIntegration({
 *   siteUrl: 'https://my-store.com',
 *   consumerKey: 'ck_xxxxx',
 *   consumerSecret: 'cs_xxxxx',
 *   webhookSecret: 'whs_xxxxx',
 * });
 *
 * // Connect and validate credentials
 * const connected = await woo.connect();
 *
 * // Use the client
 * const orders = await woo.client.getOrders({ status: 'processing' });
 *
 * // Execute workflow actions
 * const result = await woo.executeAction('woo_get_order', { orderId: 123 });
 *
 * // Get workflow templates
 * const templates = woo.getTemplates('order_automation');
 * ```
 */
export function createWooCommerceIntegration(config: CreateWooCommerceIntegrationConfig): WooCommerceIntegration {
  const clientConfig: WooCommerceConfig = {
    siteUrl: config.siteUrl.replace(/\/$/, ''), // Remove trailing slash
    consumerKey: config.consumerKey,
    consumerSecret: config.consumerSecret,
    version: config.version || 'wc/v3',
  };

  const client = createWooCommerceClient(clientConfig);
  let webhookHandler: WooCommerceWebhookHandler | null = null;
  let connected = false;

  if (config.webhookSecret) {
    webhookHandler = initializeWooCommerceWebhooks(config.webhookSecret);
  }

  // Configure the action executor
  wooCommerceActionExecutor.configure({
    siteUrl: clientConfig.siteUrl,
    consumerKey: clientConfig.consumerKey,
    consumerSecret: clientConfig.consumerSecret,
    version: clientConfig.version,
  });

  return {
    config: clientConfig,
    client,
    webhookHandler,
    actionExecutor: wooCommerceActionExecutor,
    get isConnected() {
      return connected;
    },

    async connect() {
      try {
        connected = await client.validateConnection();
        return connected;
      } catch (error) {
        console.error('[WooCommerceIntegration] Connection failed:', error);
        connected = false;
        return false;
      }
    },

    disconnect() {
      connected = false;
    },

    getTemplates(category) {
      if (category) {
        return getTemplatesByCategory(category);
      }
      return getWooCommerceTemplates();
    },

    getTemplate(templateId) {
      const templates = getWooCommerceTemplates();
      return templates.find(t => t.id === templateId);
    },

    async executeAction(action, inputs, context) {
      const siteUrl = context?.siteUrl || clientConfig.siteUrl;
      const executionContext: WooCommerceExecutionContext = {
        // Minimal execution state
        executionId: `woo-${Date.now()}`,
        workflowId: 'woocommerce-integration',
        status: 'running',
        completedSteps: [],
        stepResults: {},
        context: {},
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tokensUsed: 0,
        costUsd: 0,
        errors: [],
        recoveryAttempts: 0,
        // WooCommerce-specific config
        wooConfig: {
          siteUrl,
          consumerKey: clientConfig.consumerKey,
          consumerSecret: clientConfig.consumerSecret,
          version: clientConfig.version,
        },
      };
      return wooCommerceActionExecutor.execute(
        { type: action, inputs },
        executionContext
      );
    },
  };
}

/**
 * Engine Registration Interface
 * Matches the NexusWorkflowEngine structure for integration registration
 */
interface WorkflowEngine {
  registerIntegration?: (integration: {
    name: string;
    category: string;
    integration: WooCommerceIntegration;
    webhookHandler?: (event: unknown) => Promise<unknown>;
    actionHandler?: (action: string, params: unknown) => Promise<unknown>;
  }) => void;
  serviceManager?: {
    registerService?: (
      name: string,
      handlers: Record<string, (params: unknown) => Promise<unknown>>
    ) => void;
  };
}

/**
 * Register WooCommerce integration with the Nexus workflow engine
 *
 * This helper registers the WooCommerce integration with proper:
 * - Service integration for API calls
 * - Webhook handlers for event processing
 * - Action handlers for workflow steps
 *
 * @param engine - The NexusWorkflowEngine instance
 * @param config - WooCommerce configuration
 *
 * @example
 * ```typescript
 * import { nexusWorkflowEngine } from './workflow-engine';
 * import { registerWooCommerceWithEngine } from './workflow-engine/integrations/woocommerce';
 *
 * // Register with explicit config
 * const woo = registerWooCommerceWithEngine(nexusWorkflowEngine, {
 *   siteUrl: 'https://my-store.com',
 *   consumerKey: process.env.WOO_CONSUMER_KEY!,
 *   consumerSecret: process.env.WOO_CONSUMER_SECRET!,
 *   webhookSecret: process.env.WOO_WEBHOOK_SECRET,
 * });
 *
 * // The integration is now available in the engine
 * ```
 */
export function registerWooCommerceWithEngine(
  engine: WorkflowEngine,
  config: CreateWooCommerceIntegrationConfig
): WooCommerceIntegration {
  // Create integration instance
  const integration = createWooCommerceIntegration(config);

  // Register with engine if it supports integration registration
  if (engine.registerIntegration) {
    engine.registerIntegration({
      name: 'woocommerce',
      category: 'ecommerce',
      integration,
      webhookHandler: async (event) => {
        if (integration.webhookHandler) {
          return integration.webhookHandler.handleWebhook(event as never);
        }
        return { success: false, error: 'Webhook handler not configured' };
      },
      actionHandler: async (action, params) => {
        return integration.executeAction(
          action as WooCommerceActionType,
          params as Record<string, unknown>
        );
      },
    });
  }

  // Register service handlers if service manager is available
  if (engine.serviceManager?.registerService) {
    engine.serviceManager.registerService('woocommerce', {
      getOrders: async (params) => {
        const result = await integration.client.getOrders(params as never);
        return result;
      },
      getOrder: async (params: unknown) => {
        const result = await integration.client.getOrder((params as { id: number }).id);
        return result;
      },
      updateOrder: async (params: unknown) => {
        const { id, ...data } = params as { id: number } & Record<string, unknown>;
        const result = await integration.client.updateOrder(id, data as never);
        return result;
      },
      getProducts: async (params) => {
        const result = await integration.client.getProducts(params as never);
        return result;
      },
      getProduct: async (params: unknown) => {
        const result = await integration.client.getProduct((params as { id: number }).id);
        return result;
      },
      updateProduct: async (params: unknown) => {
        const { id, ...data } = params as { id: number } & Record<string, unknown>;
        const result = await integration.client.updateProduct(id, data as never);
        return result;
      },
      getCustomers: async (params) => {
        const result = await integration.client.getCustomers(params as never);
        return result;
      },
      getCustomer: async (params: unknown) => {
        const result = await integration.client.getCustomer((params as { id: number }).id);
        return result;
      },
      createRefund: async (params: unknown) => {
        const { orderId, ...data } = params as { orderId: number } & Record<string, unknown>;
        const result = await integration.client.createRefund(orderId, data as never);
        return result;
      },
      addOrderNote: async (params: unknown) => {
        const { orderId, ...data } = params as { orderId: number } & Record<string, unknown>;
        const result = await integration.client.addOrderNote(orderId, data as never);
        return result;
      },
      executeAction: async (params) => {
        const { action, inputs, context } = params as {
          action: WooCommerceActionType;
          inputs: Record<string, unknown>;
          context?: { siteUrl?: string };
        };
        return integration.executeAction(action, inputs, context);
      },
    });
  }

  console.log('[WooCommerceIntegration] Registered with workflow engine:', config.siteUrl);
  return integration;
}

// ============================================================================
// EXTENDED CLIENT IMPORTS
// ============================================================================

import { WooCommerceExtendedClient, createWooCommerceExtendedClient } from './woocommerce-integration'
import { WooCommerceWorkflowActions, wooCommerceWorkflowActions } from './woocommerce-actions'

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Client
  createWooCommerceClient,
  // Extended Client (Coupons, Shipping, Tax, Subscriptions)
  WooCommerceExtendedClient,
  createWooCommerceExtendedClient,
  // Integration Factory
  createWooCommerceIntegration,
  registerWooCommerceWithEngine,
  // Webhooks
  createWooCommerceWebhookHandler,
  initializeWooCommerceWebhooks,
  // Actions
  wooCommerceActionExecutor,
  // Pre-built Workflow Actions
  WooCommerceWorkflowActions,
  wooCommerceWorkflowActions,
  // Templates
  getWooCommerceTemplates,
};

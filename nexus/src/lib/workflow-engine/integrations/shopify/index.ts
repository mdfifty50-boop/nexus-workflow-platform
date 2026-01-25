/**
 * Shopify Integration Module
 *
 * Provides native Shopify REST API integration for the Nexus workflow engine.
 *
 * @module integrations/shopify
 * @version 2024-01
 *
 * @example
 * ```typescript
 * import { createShopifyClient, ShopifyConfig } from './integrations/shopify';
 *
 * const config: ShopifyConfig = {
 *   shopName: 'mystore',
 *   accessToken: 'shpat_xxxxx',
 *   apiVersion: '2024-01'
 * };
 *
 * const client = createShopifyClient(config);
 *
 * // Fetch orders
 * const { orders } = await client.getOrders({ status: 'open', limit: 50 });
 *
 * // Get specific order
 * const { order } = await client.getOrder(123456);
 *
 * // Update inventory
 * await client.updateInventory(inventoryItemId, locationId, 100);
 *
 * // Create fulfillment
 * await client.createFulfillment({
 *   line_items_by_fulfillment_order: [{
 *     fulfillment_order_id: 12345
 *   }],
 *   tracking_info: {
 *     company: 'UPS',
 *     number: '1Z999AA10123456784'
 *   },
 *   notify_customer: true
 * });
 * ```
 */

// Export main client
export {
  ShopifyClient,
  createShopifyClient
} from './shopify-client';

// Export configuration types
export type {
  ShopifyConfig,
  ShopifyAddress,
  ShopifyMoney
} from './shopify-client';

// Export order types
export type {
  ShopifyOrder,
  ShopifyLineItem,
  ShopifyTaxLine,
  ShopifyShippingLine,
  ShopifyRefund,
  OrdersQueryParams,
  UpdateOrderData
} from './shopify-client';

// Export product types
export type {
  ShopifyProduct,
  ShopifyImage,
  ShopifyProductOption,
  ShopifyVariant,
  ProductsQueryParams
} from './shopify-client';

// Export customer types
export type {
  ShopifyCustomer,
  CustomersQueryParams
} from './shopify-client';

// Export fulfillment types
export type {
  ShopifyFulfillment,
  CreateFulfillmentData
} from './shopify-client';

// Export inventory types
export type {
  ShopifyInventoryLevel,
  ShopifyLocation
} from './shopify-client';

// Export error types
export {
  ShopifyError,
  ShopifyAuthError,
  ShopifyRateLimitError,
  ShopifyNotFoundError,
  ShopifyValidationError
} from './shopify-client';

// Export utility types
export type {
  RateLimitState
} from './shopify-client';

// ============================================================================
// WEBHOOK HANDLER EXPORTS (Loop 19)
// ============================================================================

// Export webhook handler class and factory
export {
  ShopifyWebhookHandler,
  createShopifyWebhookHandler,
  initializeShopifyWebhooks,
  getShopifyWebhookHandler,
  processShopifyWebhook,
  getShopifySourceConfig,
  verifyShopifyWebhookHmac,
  getSupportedShopifyTopics,
  isShopifyTopicSupported,
  getShopifyEventType,
  getShopifyEventCategory,
} from './shopify-webhooks';

// Export webhook types
export type {
  ShopifyWebhookTopic,
  ShopifyOrderTopic,
  ShopifyProductTopic,
  ShopifyCustomerTopic,
  ShopifyInventoryTopic,
  ShopifyFulfillmentTopic,
  ShopifyCartTopic,
  ShopifyRefundTopic,
  ShopifyCollectionTopic,
  ShopifyWebhookHeaders,
  ShopifyWebhookRequest,
  ShopifyWebhookValidationResult,
  NormalizedShopifyEvent,
  ShopifyEventCategory,
  // Webhook-specific payload types (prefixed with Webhook to avoid conflicts with shopify-client types)
  WebhookShopifyOrder,
  WebhookShopifyCustomer,
  WebhookShopifyProduct,
  WebhookShopifyVariant,
  WebhookShopifyInventoryLevel,
  WebhookShopifyInventoryItem,
  WebhookShopifyFulfillment,
  WebhookShopifyLineItem,
  WebhookShopifyAddress,
  WebhookShopifyRefund,
  WebhookShopifyImage,
} from './shopify-webhooks';

// ============================================================================
// SHOPIFY ACTIONS EXPORTS (Loop 19 - T4)
// ============================================================================

// Export action executor class and singleton
export {
  ShopifyActionExecutor,
  shopifyActionExecutor,
} from './shopify-actions';

// Export action type definitions
export type {
  ShopifyActionType,
  ShopifyActionBase,
} from './shopify-actions';

// Export action input types
export type {
  ShopifyGetOrderInputs,
  ShopifyUpdateOrderInputs,
  ShopifyFulfillOrderInputs,
  ShopifyCancelOrderInputs,
  ShopifyRefundOrderInputs,
  ShopifyGetProductInputs,
  ShopifyUpdateInventoryInputs,
  ShopifyGetCustomerInputs,
  ShopifyTagCustomerInputs,
  ShopifySendNotificationInputs,
  ShopifyCreateDraftOrderInputs,
  ShopifyAddOrderNoteInputs,
} from './shopify-actions';

// Export action output types
export type {
  ShopifyOrderOutput,
  ShopifyCustomerOutput,
  ShopifyAddressOutput,
  ShopifyProductOutput,
  ShopifyVariantOutput,
  ShopifyImageOutput,
  ShopifyFulfillmentOutput,
  ShopifyRefundOutput,
  ShopifyDraftOrderOutput,
  ShopifyInventoryOutput,
  ShopifyNotificationOutput,
} from './shopify-actions';

// Export execution types
export type {
  ShopifyExecutionResult,
  ShopifyExecutionContext,
  ActionDefinition,
  ShopifyActionRegistryEntry,
} from './shopify-actions';

// Export action definitions and registry
export {
  SHOPIFY_ACTION_DEFINITIONS,
  SHOPIFY_ACTION_REGISTRY,
} from './shopify-actions';

// Export helper functions
export {
  validateShopifyAction,
  formatShopifyResponse,
  getActionRequirements,
  getActionsByCategory,
  getActionByType,
  isValidShopifyAction,
} from './shopify-actions';

// ============================================================================
// CROSS-SERVICE ACTIONS (Deep Integration)
// Pre-built actions for cross-service integrations
// ============================================================================

// Export cross-service action executor
export {
  CrossServiceActionExecutor,
  crossServiceActionExecutor,
  CROSS_SERVICE_ACTION_DEFINITIONS,
} from './shopify-actions';

// Export cross-service action types
export type {
  CrossServiceActionType,
  CrossServiceActionDefinition,
} from './shopify-actions';

// Export configuration types
export type {
  AccountingSystemConfig,
  NotificationChannelConfig,
  CRMSystemConfig,
} from './shopify-actions';

// Export cross-service input types
export type {
  SyncOrderToAccountingInputs,
  SendOrderConfirmationInputs,
  UpdateInventoryOnSaleInputs,
  NotifyLowStockInputs,
  CreateCustomerInCRMInputs,
} from './shopify-actions';

// Export cross-service output types
export type {
  SyncOrderToAccountingOutput,
  SendOrderConfirmationOutput,
  UpdateInventoryOnSaleOutput,
  NotifyLowStockOutput,
  CreateCustomerInCRMOutput,
} from './shopify-actions';

// ============================================================================
// SHOPIFY DEEP INTEGRATION (OAuth + Advanced Features)
// Core integration with OAuth flow, order/inventory/customer management
// ============================================================================

// Export deep integration class and factory
export {
  ShopifyDeepIntegration,
  createShopifyDeepIntegration,
  DEFAULT_SHOPIFY_SCOPES,
} from './shopify-integration';

// Export deep integration default export
export { default as shopifyDeepIntegration } from './shopify-integration';

// Export OAuth types
export type {
  ShopifyOAuthConfig,
  ShopifyOAuthState,
  ShopifyOAuthTokenResponse,
  ShopifyScope,
} from './shopify-integration';

// Export integration state types
export type {
  ShopifyConnectionStatus,
  ShopifyStoreInfo,
} from './shopify-integration';

// Export inventory types
export type {
  LowStockAlertConfig,
  LowStockItem,
} from './shopify-integration';

// Export customer segment types
export type {
  CustomerSegment,
  CustomerSegmentCriteria,
} from './shopify-integration';

// ============================================================================
// WORKFLOW TEMPLATES (Loop 19 - T3)
// Pre-built workflow templates for common Shopify automation scenarios
// ============================================================================

// Export template retrieval functions
export {
  getShopifyTemplates,
  getTemplatesByCategory,
  getTemplateById,
  getTemplatesByDifficulty,
  getTemplatesByTags,
  searchTemplates,
  getTemplateCounts,
  getAllRequiredConnections,
  getTotalEstimatedSavings,
} from './shopify-templates';

// Export default template module
export { default as shopifyTemplates } from './shopify-templates';

// Export template types
export type {
  ShopifyTemplate,
  ShopifyTemplateCategory,
  ShopifyTemplateDifficulty,
  ShopifyTemplateStep,
} from './shopify-templates';

// ============================================================================
// INTEGRATION FACTORY & REGISTRATION
// ============================================================================

import type { ShopifyConfig } from './shopify-client';
import { createShopifyClient, ShopifyClient } from './shopify-client';
import { initializeShopifyWebhooks, ShopifyWebhookHandler, createShopifyWebhookHandler } from './shopify-webhooks';
import { shopifyActionExecutor, ShopifyActionExecutor, crossServiceActionExecutor } from './shopify-actions';
import type { ShopifyActionType, ShopifyExecutionResult, ShopifyExecutionContext } from './shopify-actions';
import { getShopifyTemplates, getTemplatesByCategory } from './shopify-templates';
import type { ShopifyTemplate, ShopifyTemplateCategory } from './shopify-templates';
import { createShopifyDeepIntegration } from './shopify-integration';

/**
 * Unified Shopify Integration Instance
 * Combines client, webhooks, templates, and actions into a single interface
 */
export interface ShopifyIntegration {
  readonly config: ShopifyConfig;
  readonly client: ShopifyClient;
  readonly webhookHandler: ShopifyWebhookHandler | null;
  readonly actionExecutor: ShopifyActionExecutor;
  readonly isConnected: boolean;

  // Auth methods
  connect(): Promise<boolean>;
  disconnect(): void;

  // Template methods
  getTemplates(category?: ShopifyTemplateCategory): ShopifyTemplate[];
  getTemplate(templateId: string): ShopifyTemplate | undefined;

  // Action methods
  executeAction<T extends ShopifyActionType>(
    action: T,
    inputs: Record<string, unknown>,
    context?: { shopDomain?: string }
  ): Promise<ShopifyExecutionResult>;
}

/**
 * Configuration for creating a Shopify integration
 */
export interface CreateShopifyIntegrationConfig {
  shopName: string;
  accessToken: string;
  apiVersion?: string;
  customDomain?: string;
  webhookSecret?: string;
}

/**
 * Create a unified Shopify integration instance
 *
 * @param config - Shopify configuration with shop name, access token, and optional webhook secret
 * @returns ShopifyIntegration instance with client, webhooks, templates, and actions
 *
 * @example
 * ```typescript
 * const shopify = createShopifyIntegration({
 *   shopName: 'my-store',
 *   accessToken: 'shpat_xxxxx',
 *   webhookSecret: 'whsec_xxxxx',
 * });
 *
 * // Connect and validate credentials
 * const connected = await shopify.connect();
 *
 * // Use the client
 * const { orders } = await shopify.client.getOrders({ limit: 10 });
 *
 * // Execute workflow actions
 * const result = await shopify.executeAction('get_order', { orderId: '123' });
 *
 * // Get workflow templates
 * const templates = shopify.getTemplates('order_automation');
 * ```
 */
export function createShopifyIntegration(config: CreateShopifyIntegrationConfig): ShopifyIntegration {
  const clientConfig: ShopifyConfig = {
    shopName: config.shopName,
    accessToken: config.accessToken,
    apiVersion: config.apiVersion,
    customDomain: config.customDomain,
  };

  const client = createShopifyClient(clientConfig);
  let webhookHandler: ShopifyWebhookHandler | null = null;
  let connected = false;

  if (config.webhookSecret) {
    webhookHandler = initializeShopifyWebhooks(config.webhookSecret);
  }

  return {
    config: clientConfig,
    client,
    webhookHandler,
    actionExecutor: shopifyActionExecutor,
    get isConnected() {
      return connected;
    },

    async connect() {
      try {
        connected = await client.validateConnection();
        return connected;
      } catch (error) {
        console.error('[ShopifyIntegration] Connection failed:', error);
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
      return getShopifyTemplates();
    },

    getTemplate(templateId) {
      const templates = getShopifyTemplates();
      return templates.find(t => t.id === templateId);
    },

    async executeAction(action, inputs, context) {
      const shopDomain = context?.shopDomain || `${config.shopName}.myshopify.com`;
      const executionContext: ShopifyExecutionContext = {
        // Minimal execution state
        executionId: `shopify-${Date.now()}`,
        workflowId: 'shopify-integration',
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
        // Shopify-specific config
        shopifyConfig: {
          shopDomain,
          accessToken: config.accessToken,
          apiVersion: config.apiVersion,
        }
      };
      return shopifyActionExecutor.execute(
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
    integration: ShopifyIntegration;
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
 * Register Shopify integration with the Nexus workflow engine
 *
 * This helper registers the Shopify integration with proper:
 * - Service integration for API calls
 * - Webhook handlers for event processing
 * - Action handlers for workflow steps
 *
 * @param engine - The NexusWorkflowEngine instance
 * @param config - Shopify configuration
 *
 * @example
 * ```typescript
 * import { nexusWorkflowEngine } from './workflow-engine';
 * import { registerShopifyWithEngine } from './workflow-engine/integrations/shopify';
 *
 * // Register with explicit config
 * const shopify = registerShopifyWithEngine(nexusWorkflowEngine, {
 *   shopName: 'my-store',
 *   accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
 *   webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET,
 * });
 *
 * // The integration is now available in the engine
 * ```
 */
export function registerShopifyWithEngine(
  engine: WorkflowEngine,
  config: CreateShopifyIntegrationConfig
): ShopifyIntegration {
  // Create integration instance
  const integration = createShopifyIntegration(config);

  // Register with engine if it supports integration registration
  if (engine.registerIntegration) {
    engine.registerIntegration({
      name: 'shopify',
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
          action as ShopifyActionType,
          params as Record<string, unknown>
        );
      },
    });
  }

  // Register service handlers if service manager is available
  if (engine.serviceManager?.registerService) {
    engine.serviceManager.registerService('shopify', {
      getOrders: async (params) => {
        const result = await integration.client.getOrders(params as never);
        return result.orders;
      },
      getOrder: async (params: unknown) => {
        const result = await integration.client.getOrder((params as { id: number }).id);
        return result.order;
      },
      getProducts: async (params) => {
        const result = await integration.client.getProducts(params as never);
        return result.products;
      },
      getProduct: async (params: unknown) => {
        const result = await integration.client.getProduct((params as { id: number }).id);
        return result.product;
      },
      getCustomers: async (params) => {
        const result = await integration.client.getCustomers(params as never);
        return result.customers;
      },
      getCustomer: async (params: unknown) => {
        const result = await integration.client.getCustomer((params as { id: number }).id);
        return result.customer;
      },
      updateInventory: async (params: unknown) => {
        const { inventoryItemId, locationId, available } = params as {
          inventoryItemId: number;
          locationId: number;
          available: number;
        };
        const result = await integration.client.updateInventory(inventoryItemId, locationId, available);
        return result.inventory_level;
      },
      createFulfillment: async (params: unknown) => {
        const result = await integration.client.createFulfillment(params as never);
        return result.fulfillment;
      },
      executeAction: async (params) => {
        const { action, inputs, context } = params as {
          action: ShopifyActionType;
          inputs: Record<string, unknown>;
          context?: { shopDomain?: string };
        };
        return integration.executeAction(action, inputs, context);
      },
    });
  }

  console.log('[ShopifyIntegration] Registered with workflow engine:', config.shopName);
  return integration;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Client
  createShopifyClient,
  // Integration
  createShopifyIntegration,
  registerShopifyWithEngine,
  // Webhooks
  createShopifyWebhookHandler,
  initializeShopifyWebhooks,
  // Actions
  shopifyActionExecutor,
  // Templates
  getShopifyTemplates,
  // Deep Integration
  createShopifyDeepIntegration,
  // Cross-Service Actions
  crossServiceActionExecutor,
};

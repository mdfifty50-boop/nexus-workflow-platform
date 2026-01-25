/**
 * Order Processing Pipelines
 *
 * Exports for the order processing pipeline module.
 * Supports Shopify, WooCommerce, and custom e-commerce platforms.
 *
 * @example
 * ```typescript
 * import {
 *   OrderPipeline,
 *   createShopifyPipeline,
 *   createWooCommercePipeline,
 *   OrderStage,
 * } from './pipelines'
 *
 * // Create a Shopify-specific pipeline
 * const pipeline = createShopifyPipeline({
 *   enableParallelProcessing: true,
 *   maxConcurrentOrders: 5,
 * })
 *
 * // Subscribe to events
 * pipeline.on('order:shipped', (event) => {
 *   console.log('Order shipped:', event.orderId)
 * })
 *
 * // Start processing
 * pipeline.start()
 *
 * // Submit an order
 * const order = await pipeline.submitOrder(shopifyOrderData, 'shopify', 'high')
 * ```
 *
 * @version 2024-01
 */

// ============================================================================
// Types
// ============================================================================

export {
  // Enums
  OrderStage,

  // Core Types
  type OrderSource,
  type OrderPriority,
  type NormalizedOrder,
  type OrderLineItem,
  type OrderAddress,
  type ShippingInfo,
  type PaymentInfo,

  // Stage Transition Types
  type StageTransitionResult,
  type StageError,
  type StageHistoryEntry,

  // Handler Types
  type StageHandlerContext,
  type StageHandlerResult,
  type StageHandler,
  type StageValidator,

  // Pipeline State Types
  type PipelineState,
  type PipelineExecutionSummary,

  // Configuration Types
  type PipelineConfig,
  type StageConfig,
  type SourceConfig,

  // Event Types
  type PipelineEventType,
  type PipelineEvent,
  type PipelineEventHandler,
  type PipelineEventHandlers,

  // Service Interface Types
  type PipelineLogger,
  type PipelineMetrics,
  type PipelineNotifier,

  // Queue Types
  type QueuedOrder,
  type QueueStats,
} from './pipeline-types'

// ============================================================================
// Order Pipeline
// ============================================================================

export {
  // Main Class
  OrderPipeline,

  // Factory Functions
  createOrderPipeline,
  createShopifyPipeline,
  createWooCommercePipeline,
  createMultiSourcePipeline,

  // Order Normalizers
  normalizeShopifyOrder,
  normalizeWooCommerceOrder,

  // Default Instance
  orderPipeline,
} from './order-pipeline'

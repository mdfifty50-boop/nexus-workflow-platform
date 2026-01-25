/**
 * Order Processing Pipeline
 *
 * Orchestrates order processing through defined stages:
 * RECEIVED -> VALIDATED -> PROCESSING -> FULFILLED -> SHIPPED -> DELIVERED
 *
 * Features:
 * - Multi-source support (Shopify, WooCommerce, custom)
 * - Event emission for UI updates
 * - Parallel processing capability
 * - Retry logic with exponential backoff
 * - Stage-specific handlers and validators
 *
 * @version 2024-01
 */

import { OrderStage } from './pipeline-types'
import type {
  OrderSource,
  OrderPriority,
  NormalizedOrder,
  OrderAddress,
  PaymentInfo,
  StageTransitionResult,
  StageError,
  StageHandlerContext,
  StageHandlerResult,
  StageHandler,
  StageValidator,
  PipelineState,
  PipelineExecutionSummary,
  PipelineConfig,
  PipelineEventType,
  PipelineEvent,
  PipelineEventHandler,
  PipelineLogger,
  PipelineMetrics,
  PipelineNotifier,
  QueuedOrder,
  QueueStats,
} from './pipeline-types'

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_PIPELINE_CONFIG: Partial<PipelineConfig> = {
  enableParallelProcessing: true,
  maxConcurrentOrders: 10,
  defaultStageTimeout: 60000, // 1 minute
  defaultMaxRetries: 3,
  enableEvents: true,
  enableLogging: true,
  logLevel: 'info',
};

// Default stage flow for order processing (exported for reference)
export const DEFAULT_STAGE_FLOW: OrderStage[] = [
  OrderStage.RECEIVED,
  OrderStage.VALIDATED,
  OrderStage.PROCESSING,
  OrderStage.FULFILLED,
  OrderStage.SHIPPED,
  OrderStage.DELIVERED,
];

/**
 * Valid stage transitions map
 */
const VALID_TRANSITIONS: Record<OrderStage, OrderStage[]> = {
  [OrderStage.RECEIVED]: [OrderStage.VALIDATED, OrderStage.CANCELLED, OrderStage.FAILED],
  [OrderStage.VALIDATED]: [OrderStage.PROCESSING, OrderStage.CANCELLED, OrderStage.FAILED],
  [OrderStage.PROCESSING]: [OrderStage.FULFILLED, OrderStage.CANCELLED, OrderStage.FAILED],
  [OrderStage.FULFILLED]: [OrderStage.SHIPPED, OrderStage.CANCELLED, OrderStage.FAILED],
  [OrderStage.SHIPPED]: [OrderStage.DELIVERED, OrderStage.RETURNED, OrderStage.FAILED],
  [OrderStage.DELIVERED]: [OrderStage.RETURNED, OrderStage.REFUNDED],
  [OrderStage.CANCELLED]: [OrderStage.REFUNDED],
  [OrderStage.RETURNED]: [OrderStage.REFUNDED],
  [OrderStage.REFUNDED]: [],
  [OrderStage.FAILED]: [OrderStage.RECEIVED], // Allow retry from failed
};

// ============================================================================
// Default Logger Implementation
// ============================================================================

const createDefaultLogger = (logLevel: string): PipelineLogger => {
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevel = levels.indexOf(logLevel);

  return {
    debug: (message, data) => {
      if (currentLevel <= 0) console.debug(`[Pipeline] ${message}`, data || '');
    },
    info: (message, data) => {
      if (currentLevel <= 1) console.info(`[Pipeline] ${message}`, data || '');
    },
    warn: (message, data) => {
      if (currentLevel <= 2) console.warn(`[Pipeline] ${message}`, data || '');
    },
    error: (message, error, data) => {
      if (currentLevel <= 3) console.error(`[Pipeline] ${message}`, error, data || '');
    },
  };
};

// ============================================================================
// Default Metrics Implementation
// ============================================================================

const createDefaultMetrics = (): PipelineMetrics => ({
  increment: (metric, value = 1, tags) => {
    console.debug(`[Metrics] ${metric}: +${value}`, tags || '');
  },
  gauge: (metric, value, tags) => {
    console.debug(`[Metrics] ${metric}: ${value}`, tags || '');
  },
  timing: (metric, duration, tags) => {
    console.debug(`[Metrics] ${metric}: ${duration}ms`, tags || '');
  },
  histogram: (metric, value, tags) => {
    console.debug(`[Metrics] ${metric}: ${value}`, tags || '');
  },
});

// ============================================================================
// Default Notifier Implementation
// ============================================================================

const createDefaultNotifier = (): PipelineNotifier => ({
  notify: async (type, recipient, message, data) => {
    console.info(`[Notify:${type}] To: ${recipient} - ${message}`, data || '');
  },
});

// ============================================================================
// Order Normalizers
// ============================================================================

/**
 * Normalize Shopify order to standard format
 */
export function normalizeShopifyOrder(shopifyOrder: Record<string, unknown>): NormalizedOrder {
  const order = shopifyOrder as {
    id: number;
    order_number: number;
    email: string;
    customer?: { id: number; email: string; first_name?: string; last_name?: string; phone?: string };
    line_items?: Array<{
      id: number;
      product_id: number;
      variant_id: number;
      sku?: string;
      name: string;
      quantity: number;
      price: string;
      requires_shipping: boolean;
      properties?: Array<{ name: string; value: unknown }>;
    }>;
    shipping_address?: Record<string, string>;
    billing_address?: Record<string, string>;
    shipping_lines?: Array<{
      code: string;
      title: string;
      price: string;
    }>;
    financial_status: string;
    subtotal_price: string;
    total_tax: string;
    total_shipping_price_set?: { shop_money: { amount: string } };
    total_discounts: string;
    total_price: string;
    currency: string;
    note?: string;
    tags?: string;
    created_at: string;
    updated_at: string;
  };

  const normalizeAddress = (addr?: Record<string, string>): OrderAddress => ({
    firstName: addr?.first_name || '',
    lastName: addr?.last_name || '',
    company: addr?.company,
    address1: addr?.address1 || '',
    address2: addr?.address2,
    city: addr?.city || '',
    state: addr?.province,
    postalCode: addr?.zip || '',
    country: addr?.country_code || addr?.country || '',
    phone: addr?.phone,
    email: order.email,
  });

  return {
    id: `shopify_${order.id}`,
    externalId: String(order.id),
    source: 'shopify',
    orderNumber: String(order.order_number),
    customer: {
      id: order.customer?.id ? String(order.customer.id) : undefined,
      email: order.customer?.email || order.email,
      firstName: order.customer?.first_name,
      lastName: order.customer?.last_name,
      phone: order.customer?.phone,
    },
    lineItems: (order.line_items || []).map((item) => ({
      id: String(item.id),
      productId: String(item.product_id),
      variantId: item.variant_id ? String(item.variant_id) : undefined,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: parseFloat(item.price),
      totalPrice: parseFloat(item.price) * item.quantity,
      requiresShipping: item.requires_shipping,
      metadata: item.properties?.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {}),
    })),
    shippingAddress: normalizeAddress(order.shipping_address),
    billingAddress: normalizeAddress(order.billing_address),
    shipping: {
      method: order.shipping_lines?.[0]?.code || 'standard',
      cost: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0'),
    },
    payment: {
      method: 'shopify',
      status: mapShopifyPaymentStatus(order.financial_status),
      amount: parseFloat(order.total_price),
      currency: order.currency,
    },
    subtotal: parseFloat(order.subtotal_price),
    taxTotal: parseFloat(order.total_tax),
    shippingTotal: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0'),
    discountTotal: parseFloat(order.total_discounts),
    grandTotal: parseFloat(order.total_price),
    currency: order.currency,
    priority: 'normal',
    notes: order.note,
    tags: order.tags?.split(',').map((t) => t.trim()),
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    rawData: shopifyOrder,
  };
}

/**
 * Normalize WooCommerce order to standard format
 */
export function normalizeWooCommerceOrder(wooOrder: Record<string, unknown>): NormalizedOrder {
  const order = wooOrder as {
    id: number;
    number: string;
    status: string;
    customer_id?: number;
    billing: Record<string, string>;
    shipping: Record<string, string>;
    line_items?: Array<{
      id: number;
      product_id: number;
      variation_id: number;
      sku?: string;
      name: string;
      quantity: number;
      price: number;
      meta_data?: Array<{ key: string; value: unknown }>;
    }>;
    shipping_lines?: Array<{
      method_id: string;
      method_title: string;
      total: string;
    }>;
    payment_method: string;
    payment_method_title: string;
    transaction_id?: string;
    subtotal?: string;
    total_tax: string;
    shipping_total: string;
    discount_total: string;
    total: string;
    currency: string;
    customer_note?: string;
    date_created: string;
    date_modified: string;
  };

  const normalizeAddress = (addr: Record<string, string>): OrderAddress => ({
    firstName: addr.first_name || '',
    lastName: addr.last_name || '',
    company: addr.company,
    address1: addr.address_1 || '',
    address2: addr.address_2,
    city: addr.city || '',
    state: addr.state,
    postalCode: addr.postcode || '',
    country: addr.country || '',
    phone: addr.phone,
    email: addr.email,
  });

  return {
    id: `woocommerce_${order.id}`,
    externalId: String(order.id),
    source: 'woocommerce',
    orderNumber: order.number,
    customer: {
      id: order.customer_id ? String(order.customer_id) : undefined,
      email: order.billing?.email || '',
      firstName: order.billing?.first_name,
      lastName: order.billing?.last_name,
      phone: order.billing?.phone,
    },
    lineItems: (order.line_items || []).map((item) => ({
      id: String(item.id),
      productId: String(item.product_id),
      variantId: item.variation_id ? String(item.variation_id) : undefined,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity,
      requiresShipping: true,
      metadata: item.meta_data?.reduce((acc, m) => ({ ...acc, [m.key]: m.value }), {}),
    })),
    shippingAddress: normalizeAddress(order.shipping),
    billingAddress: normalizeAddress(order.billing),
    shipping: {
      method: order.shipping_lines?.[0]?.method_id || 'standard',
      cost: parseFloat(order.shipping_total || '0'),
    },
    payment: {
      method: order.payment_method,
      transactionId: order.transaction_id,
      status: mapWooCommercePaymentStatus(order.status),
      amount: parseFloat(order.total),
      currency: order.currency,
    },
    subtotal: parseFloat(order.subtotal || order.total) - parseFloat(order.total_tax),
    taxTotal: parseFloat(order.total_tax),
    shippingTotal: parseFloat(order.shipping_total),
    discountTotal: parseFloat(order.discount_total),
    grandTotal: parseFloat(order.total),
    currency: order.currency,
    priority: 'normal',
    notes: order.customer_note,
    createdAt: order.date_created,
    updatedAt: order.date_modified,
    rawData: wooOrder,
  };
}

// Helper functions for payment status mapping
function mapShopifyPaymentStatus(status: string): PaymentInfo['status'] {
  const mapping: Record<string, PaymentInfo['status']> = {
    pending: 'pending',
    authorized: 'authorized',
    paid: 'captured',
    partially_paid: 'captured',
    refunded: 'refunded',
    partially_refunded: 'refunded',
    voided: 'failed',
  };
  return mapping[status] || 'pending';
}

function mapWooCommercePaymentStatus(status: string): PaymentInfo['status'] {
  const mapping: Record<string, PaymentInfo['status']> = {
    pending: 'pending',
    processing: 'captured',
    'on-hold': 'authorized',
    completed: 'captured',
    refunded: 'refunded',
    failed: 'failed',
    cancelled: 'failed',
  };
  return mapping[status] || 'pending';
}

// ============================================================================
// Order Pipeline Class
// ============================================================================

/**
 * Order Processing Pipeline
 *
 * Manages the lifecycle of orders through defined stages with
 * event emission, retry logic, and parallel processing support.
 */
export class OrderPipeline {
  private config: PipelineConfig;
  private stageHandlers: Map<OrderStage, StageHandler>;
  private stageValidators: Map<OrderStage, StageValidator>;
  private eventHandlers: Map<PipelineEventType, Set<PipelineEventHandler>>;
  private orderStates: Map<string, PipelineState>;
  private orderQueue: QueuedOrder[];
  private processingOrders: Set<string>;
  private logger: PipelineLogger;
  private metrics: PipelineMetrics;
  private notifier: PipelineNotifier;
  private isRunning: boolean;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = {
      ...DEFAULT_PIPELINE_CONFIG,
      ...config,
      id: config.id || `pipeline_${Date.now()}`,
      name: config.name || 'Order Processing Pipeline',
    } as PipelineConfig;

    this.stageHandlers = new Map();
    this.stageValidators = new Map();
    this.eventHandlers = new Map();
    this.orderStates = new Map();
    this.orderQueue = [];
    this.processingOrders = new Set();
    this.isRunning = false;

    // Initialize services
    this.logger = createDefaultLogger(this.config.logLevel || 'info');
    this.metrics = createDefaultMetrics();
    this.notifier = createDefaultNotifier();

    // Register default handlers
    this.registerDefaultHandlers();

    // Apply stage configs
    if (this.config.stageConfigs) {
      for (const stageConfig of this.config.stageConfigs) {
        if (stageConfig.handler) {
          this.registerStageHandler(stageConfig.stage, stageConfig.handler);
        }
        if (stageConfig.validator) {
          this.registerStageValidator(stageConfig.stage, stageConfig.validator);
        }
      }
    }

    // Apply event handlers from config
    if (this.config.eventHandlers) {
      for (const [eventType, handler] of Object.entries(this.config.eventHandlers)) {
        if (handler) {
          this.on(eventType as PipelineEventType, handler as PipelineEventHandler<unknown>);
        }
      }
    }

    this.logger.info('Pipeline initialized', { id: this.config.id, name: this.config.name });
  }

  // ========================================
  // Public API
  // ========================================

  /**
   * Start the pipeline processing loop
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn('Pipeline already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Pipeline started');
    this.processQueue();
  }

  /**
   * Stop the pipeline
   */
  stop(): void {
    this.isRunning = false;
    this.logger.info('Pipeline stopped');
  }

  /**
   * Submit an order to the pipeline
   */
  async submitOrder(
    rawOrder: Record<string, unknown>,
    source: OrderSource,
    priority: OrderPriority = 'normal'
  ): Promise<NormalizedOrder> {
    // Normalize order based on source
    const order = this.normalizeOrder(rawOrder, source);
    order.priority = priority;

    // Initialize pipeline state
    const state: PipelineState = {
      orderId: order.id,
      currentStage: OrderStage.RECEIVED,
      history: [],
      isProcessing: false,
      isPaused: false,
      retryCount: 0,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orderStates.set(order.id, state);

    // Add to queue
    this.orderQueue.push({
      order,
      priority,
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
    });

    // Sort queue by priority
    this.sortQueue();

    this.logger.info('Order submitted', { orderId: order.id, source, priority });
    this.emit('order:received', order.id, source, order);

    // Start processing if running
    if (this.isRunning) {
      this.processQueue();
    }

    return order;
  }

  /**
   * Process an order immediately (bypass queue)
   */
  async processOrderImmediate(order: NormalizedOrder): Promise<PipelineExecutionSummary> {
    return this.processOrder(order);
  }

  /**
   * Transition an order to a specific stage
   */
  async transitionTo(
    orderId: string,
    targetStage: OrderStage,
    metadata?: Record<string, unknown>
  ): Promise<StageTransitionResult> {
    const state = this.orderStates.get(orderId);
    if (!state) {
      return {
        success: false,
        fromStage: OrderStage.FAILED,
        toStage: targetStage,
        order: {} as NormalizedOrder,
        timestamp: new Date().toISOString(),
        error: {
          code: 'ORDER_NOT_FOUND',
          message: `Order ${orderId} not found in pipeline`,
          recoverable: false,
          retryable: false,
        },
      };
    }

    // Validate transition
    const validTargets = VALID_TRANSITIONS[state.currentStage];
    if (!validTargets.includes(targetStage)) {
      return {
        success: false,
        fromStage: state.currentStage,
        toStage: targetStage,
        order: {} as NormalizedOrder,
        timestamp: new Date().toISOString(),
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition from ${state.currentStage} to ${targetStage}`,
          recoverable: false,
          retryable: false,
        },
      };
    }

    // Get the order from queue or process it
    const queuedOrder = this.orderQueue.find((q) => q.order.id === orderId);
    if (!queuedOrder) {
      return {
        success: false,
        fromStage: state.currentStage,
        toStage: targetStage,
        order: {} as NormalizedOrder,
        timestamp: new Date().toISOString(),
        error: {
          code: 'ORDER_NOT_IN_QUEUE',
          message: `Order ${orderId} not found in queue`,
          recoverable: false,
          retryable: false,
        },
      };
    }

    return this.executeTransition(queuedOrder.order, state, targetStage, metadata);
  }

  /**
   * Pause an order
   */
  pauseOrder(orderId: string, reason: string): boolean {
    const state = this.orderStates.get(orderId);
    if (!state) return false;

    state.isPaused = true;
    state.pauseReason = reason;
    state.updatedAt = new Date().toISOString();

    this.logger.info('Order paused', { orderId, reason });
    this.emit('pipeline:paused', orderId, 'custom', { reason });

    return true;
  }

  /**
   * Resume a paused order
   */
  resumeOrder(orderId: string): boolean {
    const state = this.orderStates.get(orderId);
    if (!state || !state.isPaused) return false;

    state.isPaused = false;
    state.pauseReason = undefined;
    state.updatedAt = new Date().toISOString();

    this.logger.info('Order resumed', { orderId });
    this.emit('pipeline:resumed', orderId, 'custom', undefined);

    // Trigger processing
    if (this.isRunning) {
      this.processQueue();
    }

    return true;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason: string): Promise<StageTransitionResult> {
    return this.transitionTo(orderId, OrderStage.CANCELLED, { reason });
  }

  /**
   * Get order state
   */
  getOrderState(orderId: string): PipelineState | undefined {
    return this.orderStates.get(orderId);
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): QueueStats {
    const stats: QueueStats = {
      pending: this.orderQueue.length,
      processing: this.processingOrders.size,
      completed: 0,
      failed: 0,
      bySource: { shopify: 0, woocommerce: 0, custom: 0, api: 0 },
      byPriority: { low: 0, normal: 0, high: 0, urgent: 0 },
      averageProcessingTime: 0,
    };

    for (const queuedOrder of this.orderQueue) {
      stats.bySource[queuedOrder.order.source]++;
      stats.byPriority[queuedOrder.priority]++;
    }

    // Calculate completed/failed from states
    const stateValues = Array.from(this.orderStates.values());
    for (const state of stateValues) {
      if (state.currentStage === OrderStage.DELIVERED) stats.completed++;
      if (state.currentStage === OrderStage.FAILED) stats.failed++;
    }

    return stats;
  }

  // ========================================
  // Event Management
  // ========================================

  /**
   * Subscribe to pipeline events
   */
  on<T = unknown>(eventType: PipelineEventType, handler: PipelineEventHandler<T>): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler as PipelineEventHandler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler as PipelineEventHandler);
    };
  }

  /**
   * Emit a pipeline event
   */
  private emit<T>(
    eventType: PipelineEventType,
    orderId: string,
    source: OrderSource,
    data: T,
    stage?: OrderStage,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.config.enableEvents) return;

    const event: PipelineEvent<T> = {
      type: eventType,
      orderId,
      source,
      stage,
      timestamp: new Date().toISOString(),
      data,
      metadata,
    };

    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const handlerArray = Array.from(handlers);
      for (const handler of handlerArray) {
        try {
          const result = handler(event);
          if (result instanceof Promise) {
            result.catch((err) => this.logger.error('Event handler error', err));
          }
        } catch (err) {
          this.logger.error('Event handler error', err as Error);
        }
      }
    }
  }

  // ========================================
  // Handler Registration
  // ========================================

  /**
   * Register a custom stage handler
   */
  registerStageHandler(stage: OrderStage, handler: StageHandler): void {
    this.stageHandlers.set(stage, handler);
    this.logger.debug('Stage handler registered', { stage });
  }

  /**
   * Register a stage validator
   */
  registerStageValidator(stage: OrderStage, validator: StageValidator): void {
    this.stageValidators.set(stage, validator);
    this.logger.debug('Stage validator registered', { stage });
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * Register default stage handlers
   */
  private registerDefaultHandlers(): void {
    // RECEIVED -> VALIDATED
    this.registerStageHandler(OrderStage.RECEIVED, async (ctx) => {
      // Basic validation
      const errors: string[] = [];

      if (!ctx.order.customer.email) {
        errors.push('Customer email is required');
      }
      if (ctx.order.lineItems.length === 0) {
        errors.push('Order must have at least one line item');
      }
      if (ctx.order.grandTotal <= 0) {
        errors.push('Order total must be greater than 0');
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: errors.join('; '),
            recoverable: false,
            retryable: false,
            details: { errors },
          },
        };
      }

      return {
        success: true,
        nextStage: OrderStage.VALIDATED,
      };
    });

    // VALIDATED -> PROCESSING
    this.registerStageHandler(OrderStage.VALIDATED, async (ctx) => {
      // Check inventory, payment status, etc.
      if (ctx.order.payment.status === 'failed') {
        return {
          success: false,
          error: {
            code: 'PAYMENT_FAILED',
            message: 'Payment has not been captured',
            recoverable: true,
            retryable: true,
            retryAfter: 60000, // Retry in 1 minute
          },
        };
      }

      return {
        success: true,
        nextStage: OrderStage.PROCESSING,
      };
    });

    // PROCESSING -> FULFILLED
    this.registerStageHandler(OrderStage.PROCESSING, async (_ctx) => {
      void _ctx // Context available for future use
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        success: true,
        nextStage: OrderStage.FULFILLED,
        metadata: { processedAt: new Date().toISOString() },
      };
    });

    // FULFILLED -> SHIPPED
    this.registerStageHandler(OrderStage.FULFILLED, async (ctx) => {
      // Generate tracking info
      const trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      return {
        success: true,
        order: {
          shipping: {
            ...ctx.order.shipping,
            trackingNumber,
            shippedAt: new Date().toISOString(),
          },
        },
        nextStage: OrderStage.SHIPPED,
      };
    });

    // SHIPPED -> DELIVERED
    this.registerStageHandler(OrderStage.SHIPPED, async (ctx) => {
      // In real implementation, this would be triggered by webhook
      // For now, just advance the stage
      return {
        success: true,
        order: {
          shipping: {
            ...ctx.order.shipping,
            deliveredAt: new Date().toISOString(),
          },
        },
        nextStage: OrderStage.DELIVERED,
      };
    });

    // DELIVERED - final stage
    this.registerStageHandler(OrderStage.DELIVERED, async (ctx) => {
      // Notify customer, send review request, etc.
      await ctx.services.notifier.notify(
        'email',
        ctx.order.customer.email,
        `Your order ${ctx.order.orderNumber} has been delivered!`,
        { orderId: ctx.order.id }
      );

      return {
        success: true,
        // No next stage - terminal state
      };
    });

    // CANCELLED
    this.registerStageHandler(OrderStage.CANCELLED, async (_ctx) => {
      void _ctx // Context available for cancellation logic
      return {
        success: true,
      };
    });

    // RETURNED
    this.registerStageHandler(OrderStage.RETURNED, async (_ctx) => {
      void _ctx // Context available for return logic
      return {
        success: true,
        nextStage: OrderStage.REFUNDED,
      };
    });

    // REFUNDED
    this.registerStageHandler(OrderStage.REFUNDED, async (_ctx) => {
      void _ctx // Context available for refund logic
      return {
        success: true,
      };
    });

    // FAILED - allow retry
    this.registerStageHandler(OrderStage.FAILED, async (_ctx) => {
      void _ctx // Context available for retry logic
      return {
        success: true,
      };
    });
  }

  /**
   * Normalize order based on source
   */
  private normalizeOrder(rawOrder: Record<string, unknown>, source: OrderSource): NormalizedOrder {
    // Check for custom normalizer
    const sourceConfig = this.config.sourceConfigs?.find((c) => c.source === source);
    if (sourceConfig?.normalizer) {
      return sourceConfig.normalizer(rawOrder);
    }

    // Use default normalizers
    switch (source) {
      case 'shopify':
        return normalizeShopifyOrder(rawOrder);
      case 'woocommerce':
        return normalizeWooCommerceOrder(rawOrder);
      case 'custom':
      case 'api':
      default:
        // Assume already normalized for custom/api
        return rawOrder as unknown as NormalizedOrder;
    }
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    const priorityOrder: Record<OrderPriority, number> = {
      urgent: 0,
      high: 1,
      normal: 2,
      low: 3,
    };

    this.orderQueue.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // Same priority - sort by enqueue time
      return new Date(a.enqueuedAt).getTime() - new Date(b.enqueuedAt).getTime();
    });
  }

  /**
   * Process the order queue
   */
  private async processQueue(): Promise<void> {
    if (!this.isRunning) return;

    const maxConcurrent = this.config.maxConcurrentOrders || 10;
    const availableSlots = maxConcurrent - this.processingOrders.size;

    if (availableSlots <= 0 || this.orderQueue.length === 0) return;

    // Get orders to process
    const ordersToProcess = this.orderQueue
      .filter((q) => {
        const state = this.orderStates.get(q.order.id);
        return state && !state.isPaused && !this.processingOrders.has(q.order.id);
      })
      .slice(0, availableSlots);

    // Process in parallel
    await Promise.all(
      ordersToProcess.map(async (queued) => {
        this.processingOrders.add(queued.order.id);
        try {
          await this.processOrder(queued.order);
        } finally {
          this.processingOrders.delete(queued.order.id);
          // Remove from queue
          const idx = this.orderQueue.findIndex((q) => q.order.id === queued.order.id);
          if (idx !== -1) {
            this.orderQueue.splice(idx, 1);
          }
        }
      })
    );

    // Continue processing if more orders
    if (this.isRunning && this.orderQueue.length > 0) {
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Process a single order through the pipeline
   */
  private async processOrder(order: NormalizedOrder): Promise<PipelineExecutionSummary> {
    const startTime = Date.now();
    const state = this.orderStates.get(order.id);

    if (!state) {
      throw new Error(`Order ${order.id} not found in pipeline state`);
    }

    state.isProcessing = true;
    this.emit('pipeline:started', order.id, order.source, order);

    const summary: PipelineExecutionSummary = {
      orderId: order.id,
      source: order.source,
      startedAt: state.startedAt,
      finalStage: state.currentStage,
      stagesCompleted: [],
      errors: [],
      retryCount: 0,
      success: false,
    };

    try {
      // Process through stages
      let currentOrder = order;
      let currentStage = state.currentStage;

      while (true) {
        // Get handler for current stage
        const handler = this.stageHandlers.get(currentStage);
        if (!handler) {
          this.logger.warn('No handler for stage', { stage: currentStage });
          break;
        }

        // Execute handler
        const context: StageHandlerContext = {
          order: currentOrder,
          pipelineState: state,
          config: this.config,
          services: {
            logger: this.logger,
            metrics: this.metrics,
            notifier: this.notifier,
          },
        };

        this.emit('stage:entered', order.id, order.source, { stage: currentStage }, currentStage);
        const stageStart = Date.now();

        const result = await this.executeStageWithRetry(handler, context, currentStage);

        const stageDuration = Date.now() - stageStart;
        this.emit(
          'stage:exited',
          order.id,
          order.source,
          { stage: currentStage, duration: stageDuration },
          currentStage
        );

        // Update order with any changes
        if (result.order) {
          currentOrder = { ...currentOrder, ...result.order };
        }

        // Record stage completion
        this.recordStageHistory(state, currentStage, stageDuration);
        summary.stagesCompleted.push(currentStage);

        // Emit stage-specific event
        this.emitStageEvent(currentStage, order.id, order.source, currentOrder);

        if (!result.success) {
          if (result.error) {
            summary.errors.push(result.error);
            state.lastError = result.error;
          }

          if (result.hold) {
            state.isPaused = true;
            state.pauseReason = result.hold.reason;
            this.emit('pipeline:paused', order.id, order.source, { reason: result.hold.reason });
          } else {
            // Transition to failed
            await this.executeTransition(currentOrder, state, OrderStage.FAILED);
            summary.finalStage = OrderStage.FAILED;
          }
          break;
        }

        // Check for next stage
        if (!result.nextStage) {
          // Terminal stage reached
          summary.finalStage = currentStage;
          summary.success = true;
          break;
        }

        // Validate transition
        const validTargets = VALID_TRANSITIONS[currentStage];
        if (!validTargets.includes(result.nextStage)) {
          this.logger.error('Invalid stage transition', undefined, {
            from: currentStage,
            to: result.nextStage,
          });
          break;
        }

        // Transition to next stage
        await this.executeTransition(currentOrder, state, result.nextStage, result.metadata);
        currentStage = result.nextStage;
      }
    } catch (error) {
      this.logger.error('Pipeline processing error', error as Error);
      summary.errors.push({
        code: 'PIPELINE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        recoverable: false,
        retryable: false,
      });
      summary.finalStage = OrderStage.FAILED;
    } finally {
      state.isProcessing = false;
      state.completedAt = new Date().toISOString();
      summary.completedAt = state.completedAt;
      summary.totalDuration = Date.now() - startTime;
      summary.retryCount = state.retryCount;

      this.metrics.timing('pipeline.duration', summary.totalDuration, {
        source: order.source,
        success: String(summary.success),
      });

      this.emit('pipeline:completed', order.id, order.source, summary);
    }

    return summary;
  }

  /**
   * Execute a stage handler with retry logic
   */
  private async executeStageWithRetry(
    handler: StageHandler,
    context: StageHandlerContext,
    stage: OrderStage
  ): Promise<StageHandlerResult> {
    const stageConfig = this.config.stageConfigs?.find((c) => c.stage === stage);
    const maxRetries = stageConfig?.maxRetries ?? this.config.defaultMaxRetries ?? 3;
    const retryDelay = stageConfig?.retryDelay ?? 1000;
    const exponentialBackoff = stageConfig?.exponentialBackoff ?? true;

    let lastError: StageError | undefined;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const result = await handler(context);

        if (result.success || !result.error?.retryable) {
          return result;
        }

        lastError = result.error;
      } catch (error) {
        lastError = {
          code: 'HANDLER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
          retryable: true,
        };
      }

      attempt++;
      context.pipelineState.retryCount++;

      if (attempt <= maxRetries) {
        const delay = exponentialBackoff
          ? retryDelay * Math.pow(2, attempt - 1)
          : retryDelay;

        this.emit(
          'stage:retry',
          context.order.id,
          context.order.source,
          { attempt, maxRetries },
          stage
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: lastError || {
        code: 'MAX_RETRIES_EXCEEDED',
        message: `Maximum retries (${maxRetries}) exceeded for stage ${stage}`,
        recoverable: false,
        retryable: false,
      },
    };
  }

  /**
   * Execute a stage transition
   */
  private async executeTransition(
    order: NormalizedOrder,
    state: PipelineState,
    targetStage: OrderStage,
    metadata?: Record<string, unknown>
  ): Promise<StageTransitionResult> {
    const fromStage = state.currentStage;
    const timestamp = new Date().toISOString();

    // Run validator if exists
    const validator = this.stageValidators.get(targetStage);
    if (validator) {
      const validation = await validator(order, targetStage);
      if (!validation.valid) {
        return {
          success: false,
          fromStage,
          toStage: targetStage,
          order,
          timestamp,
          error: {
            code: 'VALIDATION_FAILED',
            message: validation.errors?.join('; ') || 'Stage validation failed',
            recoverable: false,
            retryable: false,
          },
        };
      }
    }

    // Update state
    state.currentStage = targetStage;
    state.updatedAt = timestamp;

    this.logger.info('Stage transition', { orderId: order.id, from: fromStage, to: targetStage });

    return {
      success: true,
      fromStage,
      toStage: targetStage,
      order,
      timestamp,
      metadata,
    };
  }

  /**
   * Record stage history entry
   */
  private recordStageHistory(state: PipelineState, stage: OrderStage, duration: number): void {
    // Close previous entry
    const lastEntry = state.history[state.history.length - 1];
    if (lastEntry && !lastEntry.exitedAt) {
      lastEntry.exitedAt = new Date().toISOString();
      lastEntry.duration = duration;
    }

    // Add new entry
    state.history.push({
      stage,
      enteredAt: new Date().toISOString(),
    });
  }

  /**
   * Emit stage-specific events
   */
  private emitStageEvent(
    stage: OrderStage,
    orderId: string,
    source: OrderSource,
    order: NormalizedOrder
  ): void {
    const eventMap: Partial<Record<OrderStage, PipelineEventType>> = {
      [OrderStage.RECEIVED]: 'order:received',
      [OrderStage.VALIDATED]: 'order:validated',
      [OrderStage.PROCESSING]: 'order:processing',
      [OrderStage.FULFILLED]: 'order:fulfilled',
      [OrderStage.SHIPPED]: 'order:shipped',
      [OrderStage.DELIVERED]: 'order:delivered',
      [OrderStage.CANCELLED]: 'order:cancelled',
      [OrderStage.RETURNED]: 'order:returned',
      [OrderStage.REFUNDED]: 'order:refunded',
      [OrderStage.FAILED]: 'order:failed',
    };

    const eventType = eventMap[stage];
    if (eventType) {
      if (eventType === 'order:shipped' || eventType === 'order:delivered') {
        this.emit(eventType, orderId, source, order.shipping, stage);
      } else if (eventType === 'order:refunded') {
        this.emit(eventType, orderId, source, order.payment, stage);
      } else if (eventType === 'order:cancelled' || eventType === 'order:returned') {
        this.emit(eventType, orderId, source, { reason: '' }, stage);
      } else if (eventType === 'order:failed') {
        const state = this.orderStates.get(orderId);
        this.emit(eventType, orderId, source, state?.lastError || { code: 'UNKNOWN', message: 'Unknown error', recoverable: false, retryable: false }, stage);
      } else {
        this.emit(eventType, orderId, source, order, stage);
      }
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new order pipeline
 */
export function createOrderPipeline(config?: Partial<PipelineConfig>): OrderPipeline {
  return new OrderPipeline(config);
}

/**
 * Create a pipeline configured for Shopify orders
 */
export function createShopifyPipeline(config?: Partial<PipelineConfig>): OrderPipeline {
  return new OrderPipeline({
    ...config,
    name: config?.name || 'Shopify Order Pipeline',
    sourceConfigs: [
      {
        source: 'shopify',
        defaultPriority: 'normal',
        normalizer: normalizeShopifyOrder,
      },
      ...(config?.sourceConfigs || []),
    ],
  });
}

/**
 * Create a pipeline configured for WooCommerce orders
 */
export function createWooCommercePipeline(config?: Partial<PipelineConfig>): OrderPipeline {
  return new OrderPipeline({
    ...config,
    name: config?.name || 'WooCommerce Order Pipeline',
    sourceConfigs: [
      {
        source: 'woocommerce',
        defaultPriority: 'normal',
        normalizer: normalizeWooCommerceOrder,
      },
      ...(config?.sourceConfigs || []),
    ],
  });
}

/**
 * Create a multi-source pipeline (Shopify + WooCommerce + Custom)
 */
export function createMultiSourcePipeline(config?: Partial<PipelineConfig>): OrderPipeline {
  return new OrderPipeline({
    ...config,
    name: config?.name || 'Multi-Source Order Pipeline',
    sourceConfigs: [
      { source: 'shopify', defaultPriority: 'normal', normalizer: normalizeShopifyOrder },
      { source: 'woocommerce', defaultPriority: 'normal', normalizer: normalizeWooCommerceOrder },
      { source: 'custom', defaultPriority: 'normal' },
      { source: 'api', defaultPriority: 'normal' },
      ...(config?.sourceConfigs || []),
    ],
  });
}

// ============================================================================
// Singleton Instance
// ============================================================================

/** Default order pipeline instance */
export const orderPipeline = createMultiSourcePipeline();

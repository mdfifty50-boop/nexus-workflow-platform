/**
 * Order Pipeline Types
 *
 * TypeScript types for the order processing pipeline.
 * Supports Shopify, WooCommerce, and custom e-commerce platforms.
 *
 * @version 2024-01
 */

// ============================================================================
// Stage Definitions
// ============================================================================

/**
 * Order processing stages - the lifecycle of an order
 */
export const OrderStage = {
  /** Order received from e-commerce platform */
  RECEIVED: 'received',
  /** Order validated (inventory, payment, fraud check) */
  VALIDATED: 'validated',
  /** Order is being processed (picking, packing) */
  PROCESSING: 'processing',
  /** Order fulfilled and ready for shipment */
  FULFILLED: 'fulfilled',
  /** Order shipped with tracking */
  SHIPPED: 'shipped',
  /** Order delivered to customer */
  DELIVERED: 'delivered',
  /** Order cancelled */
  CANCELLED: 'cancelled',
  /** Order returned */
  RETURNED: 'returned',
  /** Order refunded */
  REFUNDED: 'refunded',
  /** Order processing failed */
  FAILED: 'failed',
} as const

export type OrderStage = (typeof OrderStage)[keyof typeof OrderStage]

/**
 * Order source platforms
 */
export type OrderSource = 'shopify' | 'woocommerce' | 'custom' | 'api';

/**
 * Priority levels for order processing
 */
export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent';

// ============================================================================
// Order Types
// ============================================================================

/**
 * Line item in an order
 */
export interface OrderLineItem {
  id: string;
  productId: string;
  variantId?: string;
  sku?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight?: number;
  requiresShipping: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Address for shipping/billing
 */
export interface OrderAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

/**
 * Shipping details
 */
export interface ShippingInfo {
  method: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cost: number;
}

/**
 * Payment information
 */
export interface PaymentInfo {
  method: string;
  transactionId?: string;
  status: 'pending' | 'authorized' | 'captured' | 'refunded' | 'failed';
  amount: number;
  currency: string;
  paidAt?: string;
}

/**
 * Normalized order from any source
 */
export interface NormalizedOrder {
  /** Unique order ID */
  id: string;
  /** External order ID from source platform */
  externalId: string;
  /** Source platform */
  source: OrderSource;
  /** Order number (customer-facing) */
  orderNumber: string;

  /** Customer information */
  customer: {
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };

  /** Line items */
  lineItems: OrderLineItem[];

  /** Addresses */
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;

  /** Shipping */
  shipping: ShippingInfo;

  /** Payment */
  payment: PaymentInfo;

  /** Totals */
  subtotal: number;
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  currency: string;

  /** Processing metadata */
  priority: OrderPriority;
  notes?: string;
  tags?: string[];

  /** Timestamps */
  createdAt: string;
  updatedAt: string;

  /** Raw data from source */
  rawData?: Record<string, unknown>;
}

// ============================================================================
// Stage Transition Types
// ============================================================================

/**
 * Result of a stage transition
 */
export interface StageTransitionResult {
  success: boolean;
  fromStage: OrderStage;
  toStage: OrderStage;
  order: NormalizedOrder;
  timestamp: string;
  metadata?: Record<string, unknown>;
  error?: StageError;
}

/**
 * Error during stage transition
 */
export interface StageError {
  code: string;
  message: string;
  recoverable: boolean;
  retryable: boolean;
  retryAfter?: number;
  details?: Record<string, unknown>;
}

/**
 * Stage transition history entry
 */
export interface StageHistoryEntry {
  stage: OrderStage;
  enteredAt: string;
  exitedAt?: string;
  duration?: number;
  actor?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Handler Types
// ============================================================================

/**
 * Context passed to stage handlers
 */
export interface StageHandlerContext {
  /** Current order data */
  order: NormalizedOrder;
  /** Current pipeline state */
  pipelineState: PipelineState;
  /** Configuration */
  config: PipelineConfig;
  /** Services for handler use */
  services: {
    logger: PipelineLogger;
    metrics: PipelineMetrics;
    notifier: PipelineNotifier;
  };
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Result returned by stage handlers
 */
export interface StageHandlerResult {
  success: boolean;
  /** Updated order data */
  order?: Partial<NormalizedOrder>;
  /** Transition to next stage */
  nextStage?: OrderStage;
  /** Hold in current stage */
  hold?: {
    reason: string;
    resumeAfter?: string;
    requiresAction?: boolean;
  };
  /** Error if failed */
  error?: StageError;
  /** Additional data to pass forward */
  metadata?: Record<string, unknown>;
}

/**
 * Stage handler function type
 */
export type StageHandler = (
  context: StageHandlerContext
) => Promise<StageHandlerResult>;

/**
 * Validation handler for stage entry
 */
export type StageValidator = (
  order: NormalizedOrder,
  targetStage: OrderStage
) => Promise<{ valid: boolean; errors?: string[] }>;

// ============================================================================
// Pipeline State Types
// ============================================================================

/**
 * Current state of an order in the pipeline
 */
export interface PipelineState {
  /** Order ID */
  orderId: string;
  /** Current stage */
  currentStage: OrderStage;
  /** Stage history */
  history: StageHistoryEntry[];
  /** Is currently processing */
  isProcessing: boolean;
  /** Is paused/on hold */
  isPaused: boolean;
  /** Pause reason */
  pauseReason?: string;
  /** Retry information */
  retryCount: number;
  /** Last error */
  lastError?: StageError;
  /** Started at */
  startedAt: string;
  /** Last updated */
  updatedAt: string;
  /** Completed at */
  completedAt?: string;
}

/**
 * Pipeline execution summary
 */
export interface PipelineExecutionSummary {
  orderId: string;
  source: OrderSource;
  startedAt: string;
  completedAt?: string;
  totalDuration?: number;
  finalStage: OrderStage;
  stagesCompleted: OrderStage[];
  errors: StageError[];
  retryCount: number;
  success: boolean;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for stage behavior
 */
export interface StageConfig {
  /** Stage this config applies to */
  stage: OrderStage;
  /** Maximum time allowed in stage (ms) */
  timeout?: number;
  /** Maximum retries on failure */
  maxRetries?: number;
  /** Delay between retries (ms) */
  retryDelay?: number;
  /** Use exponential backoff */
  exponentialBackoff?: boolean;
  /** Auto-advance to next stage on success */
  autoAdvance?: boolean;
  /** Stages that can transition to this stage */
  allowedFromStages?: OrderStage[];
  /** Custom handler for this stage */
  handler?: StageHandler;
  /** Validation before entering stage */
  validator?: StageValidator;
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  /** Pipeline identifier */
  id: string;
  /** Pipeline name */
  name: string;
  /** Enable parallel processing */
  enableParallelProcessing?: boolean;
  /** Maximum concurrent orders */
  maxConcurrentOrders?: number;
  /** Default stage timeout (ms) */
  defaultStageTimeout?: number;
  /** Default max retries */
  defaultMaxRetries?: number;
  /** Stage-specific configurations */
  stageConfigs?: StageConfig[];
  /** Source-specific configurations */
  sourceConfigs?: SourceConfig[];
  /** Enable event emission */
  enableEvents?: boolean;
  /** Event handlers */
  eventHandlers?: Partial<PipelineEventHandlers>;
  /** Enable logging */
  enableLogging?: boolean;
  /** Log level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Source-specific configuration
 */
export interface SourceConfig {
  source: OrderSource;
  /** Priority for orders from this source */
  defaultPriority?: OrderPriority;
  /** Custom normalizer function */
  normalizer?: (rawOrder: Record<string, unknown>) => NormalizedOrder;
  /** Skip validation for this source */
  skipValidation?: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Pipeline event types
 */
export type PipelineEventType =
  | 'order:received'
  | 'order:validated'
  | 'order:processing'
  | 'order:fulfilled'
  | 'order:shipped'
  | 'order:delivered'
  | 'order:cancelled'
  | 'order:returned'
  | 'order:refunded'
  | 'order:failed'
  | 'stage:entered'
  | 'stage:exited'
  | 'stage:error'
  | 'stage:retry'
  | 'pipeline:started'
  | 'pipeline:completed'
  | 'pipeline:paused'
  | 'pipeline:resumed'
  | 'pipeline:error';

/**
 * Pipeline event payload
 */
export interface PipelineEvent<T = unknown> {
  type: PipelineEventType;
  orderId: string;
  source: OrderSource;
  stage?: OrderStage;
  timestamp: string;
  data: T;
  metadata?: Record<string, unknown>;
}

/**
 * Event handler function type
 */
export type PipelineEventHandler<T = unknown> = (
  event: PipelineEvent<T>
) => void | Promise<void>;

/**
 * Event handlers map
 */
export interface PipelineEventHandlers {
  'order:received': PipelineEventHandler<NormalizedOrder>;
  'order:validated': PipelineEventHandler<NormalizedOrder>;
  'order:processing': PipelineEventHandler<NormalizedOrder>;
  'order:fulfilled': PipelineEventHandler<NormalizedOrder>;
  'order:shipped': PipelineEventHandler<ShippingInfo>;
  'order:delivered': PipelineEventHandler<ShippingInfo>;
  'order:cancelled': PipelineEventHandler<{ reason: string }>;
  'order:returned': PipelineEventHandler<{ reason: string }>;
  'order:refunded': PipelineEventHandler<PaymentInfo>;
  'order:failed': PipelineEventHandler<StageError>;
  'stage:entered': PipelineEventHandler<{ stage: OrderStage }>;
  'stage:exited': PipelineEventHandler<{ stage: OrderStage; duration: number }>;
  'stage:error': PipelineEventHandler<StageError>;
  'stage:retry': PipelineEventHandler<{ attempt: number; maxRetries: number }>;
  'pipeline:started': PipelineEventHandler<NormalizedOrder>;
  'pipeline:completed': PipelineEventHandler<PipelineExecutionSummary>;
  'pipeline:paused': PipelineEventHandler<{ reason: string }>;
  'pipeline:resumed': PipelineEventHandler<void>;
  'pipeline:error': PipelineEventHandler<StageError>;
}

// ============================================================================
// Service Interface Types
// ============================================================================

/**
 * Logger interface for pipeline
 */
export interface PipelineLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error, data?: Record<string, unknown>): void;
}

/**
 * Metrics interface for pipeline
 */
export interface PipelineMetrics {
  increment(metric: string, value?: number, tags?: Record<string, string>): void;
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
  timing(metric: string, duration: number, tags?: Record<string, string>): void;
  histogram(metric: string, value: number, tags?: Record<string, string>): void;
}

/**
 * Notifier interface for pipeline
 */
export interface PipelineNotifier {
  notify(
    type: 'email' | 'sms' | 'webhook' | 'slack',
    recipient: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<void>;
}

// ============================================================================
// Queue Types
// ============================================================================

/**
 * Queued order for processing
 */
export interface QueuedOrder {
  order: NormalizedOrder;
  priority: OrderPriority;
  enqueuedAt: string;
  attempts: number;
  lastAttemptAt?: string;
  scheduledFor?: string;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  bySource: Record<OrderSource, number>;
  byPriority: Record<OrderPriority, number>;
  averageProcessingTime: number;
}

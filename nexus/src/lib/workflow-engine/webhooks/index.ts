/**
 * Webhooks Module - 24/7 Event Infrastructure
 * Loop 18 of Intelligence Architecture Implementation
 *
 * This module provides complete webhook infrastructure for:
 * - Receiving webhooks from 20+ external systems (CRM, HRMS, Finance, etc.)
 * - Priority-based event queue with retry logic
 * - Automatic trigger matching with context predictions
 * - Workflow execution orchestration
 */

// ============================================================================
// WEBHOOK RECEIVER
// ============================================================================

export {
  // Main class
  WebhookReceiver,
  createWebhookReceiver,
  webhookReceiver,

  // Quick functions
  processWebhookQuick,
  enableWebhookSource,
  getSupportedSources,
  getSourceDisplayName,

  // Configuration
  DEFAULT_SOURCE_CONFIGS,
  DEFAULT_RECEIVER_CONFIG,

  // Types
  type WebhookSource,
  type WebhookEventCategory,
  type CRMEventType,
  type HREventType,
  type FinanceEventType,
  type WebhookEventType,
  type WebhookPayload,
  type IncomingWebhook,
  type ProcessedWebhookEvent,
  type WebhookSourceConfig,
  type WebhookReceiverConfig,
  type WebhookValidationResult,
} from './webhook-receiver';

// ============================================================================
// EVENT QUEUE
// ============================================================================

export {
  // Main class
  EventQueue,
  createEventQueue,
  eventQueue,

  // Quick functions
  enqueueEvent,
  getQueueStats,
  startEventQueue,
  stopEventQueue,

  // Configuration
  DEFAULT_QUEUE_CONFIG,

  // Types
  type QueueEventStatus,
  type QueuedEvent,
  type EventQueueConfig,
  type QueueStats,
  type EventProcessor,
} from './event-queue';

// ============================================================================
// WEBHOOK PROCESSOR
// ============================================================================

export {
  // Main class
  WebhookProcessor,
  createWebhookProcessor,
  webhookProcessor,

  // Quick start functions
  startWebhookProcessing,
  stopWebhookProcessing,
  processWebhookEvent,
  testWebhookEvent,

  // Configuration
  DEFAULT_PROCESSOR_CONFIG,

  // Types
  type WorkflowExecutionRequest,
  type WebhookWorkflowResult,
  type EventProcessingResult,
  type WorkflowExecutor,
  type WebhookProcessorConfig,
} from './webhook-processor';

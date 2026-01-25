/**
 * Webhook Processor - Bridge between Webhooks and Context Triggers
 * Loop 18 of Intelligence Architecture Implementation
 *
 * This module processes webhook events and triggers workflows based on
 * the context predictions and domain intelligence modules.
 */

import {
  ContextMonitor,
  createContextMonitor,
  getAllPredefinedTriggers,
  type ContextTrigger,
  type TriggerCondition,
} from '../predictive/context-predictions';
import {
  WebhookReceiver,
  createWebhookReceiver,
  type ProcessedWebhookEvent,
  type WebhookSource,
  type WebhookEventCategory,
} from './webhook-receiver';
import {
  EventQueue,
  createEventQueue,
  type QueueStats,
} from './event-queue';

// Domain type for webhook processing
type WebhookDomain = 'sales' | 'hr' | 'finance' | 'operations' | 'customer_service' | 'project_management' | 'marketing' | 'legal';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Workflow execution request
 */
export interface WorkflowExecutionRequest {
  /** Workflow ID to execute */
  workflowId: string;
  /** Workflow name */
  workflowName: string;
  /** Parameters for the workflow */
  parameters: Record<string, unknown>;
  /** Priority level */
  priority: 'immediate' | 'high' | 'normal' | 'low';
  /** Source event that triggered this */
  sourceEvent: ProcessedWebhookEvent;
  /** Trigger that matched */
  triggerId: string;
  /** Confidence score from trigger */
  confidence: number;
}

/**
 * Workflow execution result
 */
export interface WebhookWorkflowResult {
  /** Request that was executed */
  request: WorkflowExecutionRequest;
  /** Whether execution was successful */
  success: boolean;
  /** Execution timestamp */
  executedAt: Date;
  /** Duration in ms */
  durationMs: number;
  /** Result data */
  result?: Record<string, unknown>;
  /** Error if failed */
  error?: string;
}

/**
 * Processing result for a single event
 */
export interface EventProcessingResult {
  /** Event that was processed */
  event: ProcessedWebhookEvent;
  /** Whether processing succeeded */
  success: boolean;
  /** Number of triggers that matched */
  triggersMatched: number;
  /** Number of workflows executed */
  workflowsExecuted: number;
  /** Errors if any */
  errors: string[];
  /** Matched trigger details */
  matchedTriggers: Array<{
    triggerId: string;
    triggerName: string;
    confidence: number;
  }>;
  /** Workflow execution results */
  workflowResults: WebhookWorkflowResult[];
  /** Processing duration in ms */
  processingDurationMs: number;
}

/**
 * Workflow executor function type
 */
export type WorkflowExecutor = (request: WorkflowExecutionRequest) => Promise<WebhookWorkflowResult>;

/**
 * Processor configuration
 */
export interface WebhookProcessorConfig {
  /** Whether to enable automatic processing */
  autoProcess: boolean;
  /** Minimum confidence threshold for trigger matching (0-100) */
  minConfidence: number;
  /** Maximum workflows to execute per event */
  maxWorkflowsPerEvent: number;
  /** Whether to execute workflows in parallel */
  parallelExecution: boolean;
  /** Timeout for workflow execution in ms */
  workflowTimeout: number;
  /** Whether to log detailed processing info */
  verboseLogging: boolean;
  /** Event to domain mapping */
  eventCategoryToDomain: Record<WebhookEventCategory, WebhookDomain>;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default processor configuration
 */
export const DEFAULT_PROCESSOR_CONFIG: WebhookProcessorConfig = {
  autoProcess: true,
  minConfidence: 70,
  maxWorkflowsPerEvent: 5,
  parallelExecution: false, // Sequential by default for safety
  workflowTimeout: 60000, // 1 minute
  verboseLogging: true,
  eventCategoryToDomain: {
    crm: 'sales',
    hrms: 'hr',
    finance: 'finance',
    operations: 'operations',
    communication: 'customer_service',
    project_management: 'project_management',
    marketing: 'marketing',
    customer_service: 'customer_service',
  },
};

// ============================================================================
// WEBHOOK PROCESSOR CLASS
// ============================================================================

/**
 * WebhookProcessor - Main orchestrator for webhook processing
 */
export class WebhookProcessor {
  private config: WebhookProcessorConfig;
  private webhookReceiver: WebhookReceiver;
  private eventQueue: EventQueue;
  private contextMonitor: ContextMonitor;
  private workflowExecutor: WorkflowExecutor | null = null;
  private processingResults: EventProcessingResult[] = [];
  private isInitialized: boolean = false;

  constructor(config: Partial<WebhookProcessorConfig> = {}) {
    this.config = { ...DEFAULT_PROCESSOR_CONFIG, ...config };
    this.webhookReceiver = createWebhookReceiver();
    this.eventQueue = createEventQueue({ autoStart: false });
    this.contextMonitor = createContextMonitor();
  }

  /**
   * Initialize the processor
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Register all predefined triggers with the context monitor
    const allTriggers = getAllPredefinedTriggers();
    allTriggers.forEach(trigger => {
      this.contextMonitor.registerTrigger(trigger);
    });

    // Set up the event queue processor
    this.eventQueue.setProcessor(this.processEventInternal.bind(this));

    // Set up webhook receiver to enqueue events
    this.webhookReceiver.onAnyEvent(async (event) => {
      if (this.config.autoProcess) {
        this.eventQueue.enqueue(event);
      }
    });

    this.isInitialized = true;
    console.log(`[WebhookProcessor] Initialized with ${allTriggers.length} predefined triggers`);
  }

  /**
   * Start processing
   */
  start(): void {
    if (!this.isInitialized) {
      this.initialize();
    }
    this.eventQueue.start();
    console.log('[WebhookProcessor] Started');
  }

  /**
   * Stop processing
   */
  stop(): void {
    this.eventQueue.stop();
    console.log('[WebhookProcessor] Stopped');
  }

  /**
   * Set the workflow executor
   */
  setWorkflowExecutor(executor: WorkflowExecutor): void {
    this.workflowExecutor = executor;
  }

  /**
   * Enable a webhook source
   */
  enableSource(source: WebhookSource, config?: Record<string, unknown>): void {
    this.webhookReceiver.enableSource(source, config);
    console.log(`[WebhookProcessor] Enabled source: ${source}`);
  }

  /**
   * Process a webhook event
   */
  async processWebhook(
    source: WebhookSource,
    category: WebhookEventCategory,
    payload: {
      eventId?: string;
      eventType: string;
      timestamp: string | Date;
      entity: { type: string; id: string; name?: string; [key: string]: unknown };
      previousState?: Record<string, unknown>;
      currentState: Record<string, unknown>;
      triggeredBy?: { userId?: string; userName?: string; email?: string };
      metadata?: Record<string, unknown>;
    }
  ): Promise<ProcessedWebhookEvent> {
    if (!this.isInitialized) {
      this.initialize();
    }

    return this.webhookReceiver.processWebhook({
      source,
      category,
      payload,
    });
  }

  /**
   * Internal event processor (called by queue)
   */
  private async processEventInternal(event: ProcessedWebhookEvent): Promise<{
    success: boolean;
    triggersMatched: number;
    workflowsExecuted: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    const matchedTriggers: EventProcessingResult['matchedTriggers'] = [];
    const workflowResults: WebhookWorkflowResult[] = [];

    if (this.config.verboseLogging) {
      console.log(`[WebhookProcessor] Processing event ${event.id}: ${event.eventType}`);
    }

    try {
      // Get all triggers for matching (includes cross-domain triggers)
      const allTriggers = getAllPredefinedTriggers();

      // Find matching triggers
      const triggerMatches = this.findMatchingTriggers(event, allTriggers);

      for (const match of triggerMatches) {
        if (match.confidence < this.config.minConfidence) continue;

        matchedTriggers.push({
          triggerId: match.trigger.id,
          triggerName: match.trigger.name,
          confidence: match.confidence,
        });

        // Check workflow limit
        if (matchedTriggers.length > this.config.maxWorkflowsPerEvent) {
          console.warn(`[WebhookProcessor] Max workflows per event reached (${this.config.maxWorkflowsPerEvent})`);
          break;
        }
      }

      // Execute workflows for matched triggers
      if (this.workflowExecutor && matchedTriggers.length > 0) {
        const executionPromises = matchedTriggers.map(async (match) => {
          const trigger = allTriggers.find(t => t.id === match.triggerId);
          if (!trigger) return null;

          // Get the best workflow to execute
          const bestWorkflow = trigger.predictedWorkflows
            .filter(w => w.confidence >= this.config.minConfidence)
            .sort((a, b) => b.confidence - a.confidence)[0];

          if (!bestWorkflow) return null;

          const request: WorkflowExecutionRequest = {
            workflowId: bestWorkflow.id,
            workflowName: bestWorkflow.name,
            parameters: {
              ...bestWorkflow.parameters,
              ...event.normalizedPayload,
              entityId: event.entityId,
              entityType: event.entityType,
            },
            priority: event.priority,
            sourceEvent: event,
            triggerId: trigger.id,
            confidence: match.confidence,
          };

          try {
            const result = await Promise.race([
              this.workflowExecutor!(request),
              new Promise<WebhookWorkflowResult>((_, reject) =>
                setTimeout(() => reject(new Error('Workflow execution timeout')), this.config.workflowTimeout)
              ),
            ]);
            return result;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push(`Workflow ${bestWorkflow.name} failed: ${errorMsg}`);
            return {
              request,
              success: false,
              executedAt: new Date(),
              durationMs: 0,
              error: errorMsg,
            };
          }
        });

        if (this.config.parallelExecution) {
          const results = await Promise.all(executionPromises);
          workflowResults.push(...results.filter((r): r is WebhookWorkflowResult => r !== null));
        } else {
          for (const promise of executionPromises) {
            const result = await promise;
            if (result) workflowResults.push(result);
          }
        }
      }

      // Store processing result
      const result: EventProcessingResult = {
        event,
        success: errors.length === 0,
        triggersMatched: matchedTriggers.length,
        workflowsExecuted: workflowResults.filter(r => r.success).length,
        errors,
        matchedTriggers,
        workflowResults,
        processingDurationMs: Date.now() - startTime,
      };

      this.processingResults.push(result);

      if (this.config.verboseLogging) {
        console.log(`[WebhookProcessor] Event ${event.id} processed:`, {
          triggersMatched: matchedTriggers.length,
          workflowsExecuted: workflowResults.filter(r => r.success).length,
          durationMs: result.processingDurationMs,
        });
      }

      return {
        success: errors.length === 0,
        triggersMatched: matchedTriggers.length,
        workflowsExecuted: workflowResults.filter(r => r.success).length,
        errors,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(errorMsg);
      console.error(`[WebhookProcessor] Error processing event ${event.id}:`, errorMsg);

      return {
        success: false,
        triggersMatched: 0,
        workflowsExecuted: 0,
        errors,
      };
    }
  }

  /**
   * Find triggers that match an event
   */
  private findMatchingTriggers(
    event: ProcessedWebhookEvent,
    triggers: ContextTrigger[]
  ): Array<{ trigger: ContextTrigger; confidence: number }> {
    const matches: Array<{ trigger: ContextTrigger; confidence: number }> = [];

    for (const trigger of triggers) {
      const matchResult = this.evaluateTrigger(event, trigger);
      if (matchResult.matches) {
        matches.push({
          trigger,
          confidence: matchResult.confidence,
        });
      }
    }

    // Sort by confidence descending
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Evaluate if an event matches a trigger
   */
  private evaluateTrigger(
    event: ProcessedWebhookEvent,
    trigger: ContextTrigger
  ): { matches: boolean; confidence: number } {
    // Check trigger type match
    if (!this.matchesTriggerType(event.eventType, trigger.triggerType)) {
      return { matches: false, confidence: 0 };
    }

    // Evaluate all conditions
    let totalScore = 0;
    let maxScore = 0;
    let requiredFailed = false;

    for (const condition of trigger.conditions) {
      maxScore += condition.required ? 100 : 50;

      const conditionMatch = this.evaluateCondition(event, condition);
      if (conditionMatch) {
        totalScore += condition.required ? 100 : 50;
      } else if (condition.required) {
        requiredFailed = true;
        break;
      }
    }

    if (requiredFailed) {
      return { matches: false, confidence: 0 };
    }

    const confidence = maxScore > 0 ? (totalScore / maxScore) * 100 : 100;
    return {
      matches: confidence >= this.config.minConfidence,
      confidence,
    };
  }

  /**
   * Check if event type matches trigger type
   */
  private matchesTriggerType(eventType: string, triggerType: string): boolean {
    const typeMapping: Record<string, string[]> = {
      'entity_created': ['deal_created', 'lead_created', 'contact_created', 'employee_hired', 'invoice_created'],
      'entity_updated': ['deal_updated', 'contact_updated', 'deal_stage_changed'],
      'entity_deleted': ['deal_lost'],
      'status_changed': ['deal_won', 'deal_lost', 'deal_stage_changed', 'lead_qualified', 'lead_converted'],
      'threshold_reached': ['revenue_milestone', 'budget_exceeded', 'cash_flow_alert'],
      'time_based': ['invoice_overdue', 'contract_expiring', 'performance_review_due'],
      'pattern_detected': [],
      'metric_change': ['revenue_milestone'],
    };

    const matchingTypes = typeMapping[triggerType] || [];
    return matchingTypes.includes(eventType) || triggerType === eventType;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(event: ProcessedWebhookEvent, condition: TriggerCondition): boolean {
    let fieldValue: unknown;

    // Get field value from event
    if (condition.field === 'entityType') {
      fieldValue = event.entityType;
    } else if (condition.field === 'eventType') {
      fieldValue = event.eventType;
    } else if (condition.field in event.normalizedPayload) {
      fieldValue = event.normalizedPayload[condition.field];
    } else {
      fieldValue = undefined;
    }

    // Handle undefined
    if (fieldValue === undefined) {
      return !condition.required;
    }

    // Evaluate based on operator
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'in_list':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in_list':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'is_empty':
        return fieldValue === undefined || fieldValue === null || fieldValue === '';
      case 'is_not_empty':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      case 'matches_regex':
        try {
          return new RegExp(String(condition.value)).test(String(fieldValue));
        } catch {
          return false;
        }
      case 'greater_than_or_equal':
        return Number(fieldValue) >= Number(condition.value);
      case 'less_than_or_equal':
        return Number(fieldValue) <= Number(condition.value);
      case 'changed_to':
        return fieldValue === condition.value; // Simplified - would need previous state
      case 'changed_from':
        return false; // Would need previous state tracking
      case 'between':
        if (Array.isArray(condition.value) && condition.value.length === 2) {
          const num = Number(fieldValue);
          return num >= Number(condition.value[0]) && num <= Number(condition.value[1]);
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Get processing statistics
   */
  getStats(): {
    queue: QueueStats;
    processing: {
      totalProcessed: number;
      successRate: number;
      avgTriggersPerEvent: number;
      avgWorkflowsPerEvent: number;
      avgProcessingTime: number;
    };
    triggers: {
      total: number;
      byDomain: Record<string, number>;
    };
  } {
    const queueStats = this.eventQueue.getStats();

    const successfulResults = this.processingResults.filter(r => r.success);
    const totalTriggers = this.processingResults.reduce((sum, r) => sum + r.triggersMatched, 0);
    const totalWorkflows = this.processingResults.reduce((sum, r) => sum + r.workflowsExecuted, 0);
    const totalTime = this.processingResults.reduce((sum, r) => sum + r.processingDurationMs, 0);

    const allTriggers = getAllPredefinedTriggers();
    const triggersByDomain: Record<string, number> = {};
    allTriggers.forEach(trigger => {
      triggersByDomain[trigger.domain] = (triggersByDomain[trigger.domain] || 0) + 1;
    });

    return {
      queue: queueStats,
      processing: {
        totalProcessed: this.processingResults.length,
        successRate: this.processingResults.length > 0
          ? (successfulResults.length / this.processingResults.length) * 100
          : 100,
        avgTriggersPerEvent: this.processingResults.length > 0
          ? totalTriggers / this.processingResults.length
          : 0,
        avgWorkflowsPerEvent: this.processingResults.length > 0
          ? totalWorkflows / this.processingResults.length
          : 0,
        avgProcessingTime: this.processingResults.length > 0
          ? totalTime / this.processingResults.length
          : 0,
      },
      triggers: {
        total: allTriggers.length,
        byDomain: triggersByDomain,
      },
    };
  }

  /**
   * Get processing results
   */
  getProcessingResults(): EventProcessingResult[] {
    return [...this.processingResults];
  }

  /**
   * Clear processing results
   */
  clearResults(): void {
    this.processingResults = [];
  }

  /**
   * Get receiver instance
   */
  getReceiver(): WebhookReceiver {
    return this.webhookReceiver;
  }

  /**
   * Get queue instance
   */
  getQueue(): EventQueue {
    return this.eventQueue;
  }

  /**
   * Get context monitor instance
   */
  getContextMonitor(): ContextMonitor {
    return this.contextMonitor;
  }

  /**
   * Register a custom trigger
   */
  registerTrigger(trigger: ContextTrigger): void {
    this.contextMonitor.registerTrigger(trigger);
  }

  /**
   * Get registered triggers
   */
  getTriggers(): ContextTrigger[] {
    return this.contextMonitor.getAllTriggers();
  }

  /**
   * Test webhook processing (dry run)
   */
  async testWebhook(
    source: WebhookSource,
    category: WebhookEventCategory,
    payload: {
      eventType: string;
      entity: { type: string; id: string; name?: string };
      currentState: Record<string, unknown>;
    }
  ): Promise<{
    wouldMatch: Array<{ triggerId: string; triggerName: string; confidence: number }>;
    wouldExecute: Array<{ workflowId: string; workflowName: string }>;
  }> {
    // Create a test event without actually processing
    const testEvent: ProcessedWebhookEvent = {
      id: 'test-' + Date.now(),
      source,
      category,
      eventType: this.webhookReceiver.normalizeEventType(source, payload.eventType),
      entityType: this.webhookReceiver.normalizeEntityType(source, payload.entity.type),
      entityId: payload.entity.id,
      normalizedPayload: this.webhookReceiver.normalizePayload(source, payload.currentState),
      rawPayload: {
        eventType: payload.eventType,
        timestamp: new Date().toISOString(),
        entity: payload.entity,
        currentState: payload.currentState,
      },
      receivedAt: new Date(),
      occurredAt: new Date(),
      status: 'pending',
      attempts: 0,
      priority: 'normal',
    };

    // Find matching triggers
    const allTriggers = getAllPredefinedTriggers();
    const matches = this.findMatchingTriggers(testEvent, allTriggers);

    const wouldMatch = matches.map(m => ({
      triggerId: m.trigger.id,
      triggerName: m.trigger.name,
      confidence: m.confidence,
    }));

    const wouldExecute: Array<{ workflowId: string; workflowName: string }> = [];
    for (const match of matches) {
      if (match.confidence >= this.config.minConfidence) {
        const bestWorkflow = match.trigger.predictedWorkflows
          .filter(w => w.confidence >= this.config.minConfidence)
          .sort((a, b) => b.confidence - a.confidence)[0];

        if (bestWorkflow) {
          wouldExecute.push({
            workflowId: bestWorkflow.id,
            workflowName: bestWorkflow.name,
          });
        }
      }
    }

    return { wouldMatch, wouldExecute };
  }
}

// ============================================================================
// SINGLETON & FACTORY
// ============================================================================

/**
 * Create a new webhook processor
 */
export function createWebhookProcessor(config?: Partial<WebhookProcessorConfig>): WebhookProcessor {
  return new WebhookProcessor(config);
}

/**
 * Default webhook processor instance
 */
export const webhookProcessor = createWebhookProcessor();

// ============================================================================
// QUICK START FUNCTION
// ============================================================================

/**
 * Quick start webhook processing with default configuration
 * This sets up everything needed for 24/7 webhook processing
 */
export function startWebhookProcessing(options?: {
  sources?: WebhookSource[];
  workflowExecutor?: WorkflowExecutor;
  config?: Partial<WebhookProcessorConfig>;
}): WebhookProcessor {
  const processor = options?.config ? createWebhookProcessor(options.config) : webhookProcessor;

  // Initialize
  processor.initialize();

  // Enable requested sources
  if (options?.sources) {
    options.sources.forEach(source => processor.enableSource(source));
  }

  // Set workflow executor if provided
  if (options?.workflowExecutor) {
    processor.setWorkflowExecutor(options.workflowExecutor);
  }

  // Start processing
  processor.start();

  return processor;
}

/**
 * Stop webhook processing
 */
export function stopWebhookProcessing(): void {
  webhookProcessor.stop();
}

/**
 * Process a webhook event
 */
export async function processWebhookEvent(
  source: WebhookSource,
  category: WebhookEventCategory,
  payload: {
    eventType: string;
    timestamp: string | Date;
    entity: { type: string; id: string; name?: string };
    currentState: Record<string, unknown>;
  }
): Promise<ProcessedWebhookEvent> {
  return webhookProcessor.processWebhook(source, category, payload);
}

/**
 * Test a webhook without processing
 */
export async function testWebhookEvent(
  source: WebhookSource,
  category: WebhookEventCategory,
  payload: {
    eventType: string;
    entity: { type: string; id: string; name?: string };
    currentState: Record<string, unknown>;
  }
) {
  return webhookProcessor.testWebhook(source, category, payload);
}

/**
 * Event Queue - 24/7 Event Processing Queue
 * Loop 18 of Intelligence Architecture Implementation
 *
 * This module provides a robust event queue for processing webhook events
 * with priority-based ordering, persistence, and failure handling.
 */

import type { ProcessedWebhookEvent } from './webhook-receiver';

// Generate UUID without external dependency
function generateId(): string {
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Queue event status
 */
export type QueueEventStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'dead_letter'
  | 'retrying';

/**
 * Queue event with additional queue metadata
 */
export interface QueuedEvent {
  /** Unique queue item ID */
  queueId: string;
  /** Original webhook event */
  event: ProcessedWebhookEvent;
  /** Queue status */
  queueStatus: QueueEventStatus;
  /** When added to queue */
  queuedAt: Date;
  /** When processing started */
  processingStartedAt?: Date;
  /** When processing completed */
  completedAt?: Date;
  /** Number of queue attempts */
  queueAttempts: number;
  /** Next retry time */
  nextRetryAt?: Date;
  /** Processing result */
  result?: {
    success: boolean;
    triggersMatched: number;
    workflowsExecuted: number;
    errors: string[];
  };
  /** Dead letter reason */
  deadLetterReason?: string;
}

/**
 * Queue configuration
 */
export interface EventQueueConfig {
  /** Maximum queue size */
  maxSize: number;
  /** Maximum concurrent processing */
  maxConcurrent: number;
  /** Processing timeout in ms */
  processingTimeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Initial retry delay in ms */
  initialRetryDelay: number;
  /** Maximum retry delay in ms */
  maxRetryDelay: number;
  /** Retry backoff multiplier */
  retryBackoffMultiplier: number;
  /** Dead letter queue enabled */
  deadLetterEnabled: boolean;
  /** Auto-start processing */
  autoStart: boolean;
  /** Polling interval in ms */
  pollingInterval: number;
  /** Priority weights */
  priorityWeights: {
    immediate: number;
    high: number;
    normal: number;
    low: number;
  };
}

/**
 * Queue statistics
 */
export interface QueueStats {
  /** Total events in queue */
  totalQueued: number;
  /** Currently processing */
  processing: number;
  /** Completed count */
  completed: number;
  /** Failed count */
  failed: number;
  /** In dead letter queue */
  deadLetter: number;
  /** Average processing time in ms */
  avgProcessingTime: number;
  /** Events per minute (last hour) */
  eventsPerMinute: number;
  /** Success rate percentage */
  successRate: number;
  /** Queue health */
  health: 'healthy' | 'degraded' | 'critical';
  /** By priority breakdown */
  byPriority: {
    immediate: number;
    high: number;
    normal: number;
    low: number;
  };
}

/**
 * Event processor function type
 */
export type EventProcessor = (event: ProcessedWebhookEvent) => Promise<{
  success: boolean;
  triggersMatched: number;
  workflowsExecuted: number;
  errors: string[];
}>;

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default queue configuration
 */
export const DEFAULT_QUEUE_CONFIG: EventQueueConfig = {
  maxSize: 10000,
  maxConcurrent: 10,
  processingTimeout: 30000, // 30 seconds
  maxRetries: 3,
  initialRetryDelay: 1000, // 1 second
  maxRetryDelay: 60000, // 1 minute
  retryBackoffMultiplier: 2,
  deadLetterEnabled: true,
  autoStart: true,
  pollingInterval: 100, // 100ms
  priorityWeights: {
    immediate: 1000,
    high: 100,
    normal: 10,
    low: 1,
  },
};

// ============================================================================
// EVENT QUEUE CLASS
// ============================================================================

/**
 * EventQueue - Priority-based event processing queue
 */
export class EventQueue {
  private config: EventQueueConfig;
  private queue: QueuedEvent[] = [];
  private deadLetterQueue: QueuedEvent[] = [];
  private processingCount: number = 0;
  private isRunning: boolean = false;
  private processingInterval: ReturnType<typeof setInterval> | null = null;
  private processor: EventProcessor | null = null;
  private completedEvents: QueuedEvent[] = [];
  private processingTimes: number[] = [];
  private eventTimestamps: number[] = [];

  constructor(config: Partial<EventQueueConfig> = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };

    if (this.config.autoStart) {
      this.start();
    }
  }

  /**
   * Set the event processor
   */
  setProcessor(processor: EventProcessor): void {
    this.processor = processor;
  }

  /**
   * Add event to queue
   */
  enqueue(event: ProcessedWebhookEvent): QueuedEvent {
    if (this.queue.length >= this.config.maxSize) {
      throw new Error('Queue is full');
    }

    const queuedEvent: QueuedEvent = {
      queueId: generateId(),
      event,
      queueStatus: 'queued',
      queuedAt: new Date(),
      queueAttempts: 0,
    };

    // Insert based on priority
    this.insertByPriority(queuedEvent);

    // Track event timestamp for rate calculation
    this.eventTimestamps.push(Date.now());

    console.log(`[EventQueue] Enqueued event ${event.id} with priority ${event.priority}`);

    return queuedEvent;
  }

  /**
   * Insert event in priority order
   */
  private insertByPriority(event: QueuedEvent): void {
    const eventWeight = this.config.priorityWeights[event.event.priority];

    // Find insertion point
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const existingWeight = this.config.priorityWeights[this.queue[i].event.priority];
      if (eventWeight > existingWeight && this.queue[i].queueStatus === 'queued') {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, event);
  }

  /**
   * Get next event to process
   */
  private getNextEvent(): QueuedEvent | null {
    // First, check for retry events that are due
    const now = Date.now();
    for (const event of this.queue) {
      if (event.queueStatus === 'retrying' && event.nextRetryAt && event.nextRetryAt.getTime() <= now) {
        return event;
      }
    }

    // Then get highest priority queued event
    return this.queue.find(e => e.queueStatus === 'queued') || null;
  }

  /**
   * Process a single event
   */
  private async processEvent(queuedEvent: QueuedEvent): Promise<void> {
    if (!this.processor) {
      console.warn('[EventQueue] No processor set, skipping event');
      return;
    }

    queuedEvent.queueStatus = 'processing';
    queuedEvent.processingStartedAt = new Date();
    queuedEvent.queueAttempts++;
    this.processingCount++;

    const startTime = Date.now();

    try {
      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Processing timeout')), this.config.processingTimeout);
      });

      // Process with timeout
      const result = await Promise.race([
        this.processor(queuedEvent.event),
        timeoutPromise,
      ]);

      queuedEvent.result = result;

      if (result.success) {
        queuedEvent.queueStatus = 'completed';
        queuedEvent.completedAt = new Date();
        this.completedEvents.push(queuedEvent);

        // Track processing time
        this.processingTimes.push(Date.now() - startTime);

        // Remove from queue
        this.removeFromQueue(queuedEvent.queueId);

        console.log(`[EventQueue] Event ${queuedEvent.event.id} completed successfully`);
      } else {
        // Has errors but not a thrown exception
        await this.handleFailure(queuedEvent, result.errors.join(', '));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.handleFailure(queuedEvent, errorMessage);
    } finally {
      this.processingCount--;
    }
  }

  /**
   * Handle processing failure
   */
  private async handleFailure(queuedEvent: QueuedEvent, error: string): Promise<void> {
    console.error(`[EventQueue] Event ${queuedEvent.event.id} failed: ${error}`);

    if (queuedEvent.queueAttempts >= this.config.maxRetries) {
      // Move to dead letter queue
      if (this.config.deadLetterEnabled) {
        queuedEvent.queueStatus = 'dead_letter';
        queuedEvent.deadLetterReason = `Max retries (${this.config.maxRetries}) exceeded. Last error: ${error}`;
        this.deadLetterQueue.push(queuedEvent);
        this.removeFromQueue(queuedEvent.queueId);
        console.warn(`[EventQueue] Event ${queuedEvent.event.id} moved to dead letter queue`);
      } else {
        queuedEvent.queueStatus = 'failed';
        this.removeFromQueue(queuedEvent.queueId);
      }
    } else {
      // Schedule retry
      queuedEvent.queueStatus = 'retrying';
      const delay = Math.min(
        this.config.initialRetryDelay * Math.pow(this.config.retryBackoffMultiplier, queuedEvent.queueAttempts - 1),
        this.config.maxRetryDelay
      );
      queuedEvent.nextRetryAt = new Date(Date.now() + delay);
      console.log(`[EventQueue] Event ${queuedEvent.event.id} scheduled for retry in ${delay}ms`);
    }

    queuedEvent.result = {
      success: false,
      triggersMatched: 0,
      workflowsExecuted: 0,
      errors: [error],
    };
  }

  /**
   * Remove event from queue
   */
  private removeFromQueue(queueId: string): void {
    const index = this.queue.findIndex(e => e.queueId === queueId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  /**
   * Process queue tick
   */
  private async processTick(): Promise<void> {
    if (!this.isRunning) return;

    // Check if we can process more
    while (this.processingCount < this.config.maxConcurrent) {
      const event = this.getNextEvent();
      if (!event) break;

      // Fire and forget - don't await
      this.processEvent(event).catch(err => {
        console.error('[EventQueue] Unexpected error in processEvent:', err);
      });
    }
  }

  /**
   * Start the queue processor
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.processingInterval = setInterval(() => {
      this.processTick();
    }, this.config.pollingInterval);

    console.log('[EventQueue] Started');
  }

  /**
   * Stop the queue processor
   */
  stop(): void {
    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('[EventQueue] Stopped');
  }

  /**
   * Pause processing (keeps events in queue)
   */
  pause(): void {
    this.isRunning = false;
    console.log('[EventQueue] Paused');
  }

  /**
   * Resume processing
   */
  resume(): void {
    this.isRunning = true;
    console.log('[EventQueue] Resumed');
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const oneHourAgo = Date.now() - 3600000;
    const recentTimestamps = this.eventTimestamps.filter(t => t > oneHourAgo);
    const eventsPerMinute = recentTimestamps.length / 60;

    const totalCompleted = this.completedEvents.length;
    const totalFailed = this.queue.filter(e => e.queueStatus === 'failed').length + this.deadLetterQueue.length;
    const successRate = totalCompleted + totalFailed > 0
      ? (totalCompleted / (totalCompleted + totalFailed)) * 100
      : 100;

    const avgProcessingTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
      : 0;

    // Determine health
    let health: QueueStats['health'] = 'healthy';
    if (this.deadLetterQueue.length > 10 || successRate < 80) {
      health = 'critical';
    } else if (this.deadLetterQueue.length > 5 || successRate < 95) {
      health = 'degraded';
    }

    return {
      totalQueued: this.queue.length,
      processing: this.processingCount,
      completed: this.completedEvents.length,
      failed: totalFailed,
      deadLetter: this.deadLetterQueue.length,
      avgProcessingTime,
      eventsPerMinute,
      successRate,
      health,
      byPriority: {
        immediate: this.queue.filter(e => e.event.priority === 'immediate').length,
        high: this.queue.filter(e => e.event.priority === 'high').length,
        normal: this.queue.filter(e => e.event.priority === 'normal').length,
        low: this.queue.filter(e => e.event.priority === 'low').length,
      },
    };
  }

  /**
   * Get queue contents
   */
  getQueue(): QueuedEvent[] {
    return [...this.queue];
  }

  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(): QueuedEvent[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Get completed events
   */
  getCompletedEvents(): QueuedEvent[] {
    return [...this.completedEvents];
  }

  /**
   * Retry a dead letter event
   */
  retryDeadLetter(queueId: string): boolean {
    const index = this.deadLetterQueue.findIndex(e => e.queueId === queueId);
    if (index === -1) return false;

    const event = this.deadLetterQueue.splice(index, 1)[0];
    event.queueStatus = 'queued';
    event.queueAttempts = 0;
    event.deadLetterReason = undefined;
    event.nextRetryAt = undefined;

    this.insertByPriority(event);
    return true;
  }

  /**
   * Retry all dead letter events
   */
  retryAllDeadLetters(): number {
    const count = this.deadLetterQueue.length;
    const events = [...this.deadLetterQueue];
    this.deadLetterQueue = [];

    events.forEach(event => {
      event.queueStatus = 'queued';
      event.queueAttempts = 0;
      event.deadLetterReason = undefined;
      event.nextRetryAt = undefined;
      this.insertByPriority(event);
    });

    return count;
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): number {
    const count = this.deadLetterQueue.length;
    this.deadLetterQueue = [];
    return count;
  }

  /**
   * Clear all queues
   */
  clearAll(): void {
    this.queue = [];
    this.deadLetterQueue = [];
    this.completedEvents = [];
    this.processingTimes = [];
    this.eventTimestamps = [];
  }

  /**
   * Get event by ID
   */
  getEventById(eventId: string): QueuedEvent | null {
    return this.queue.find(e => e.event.id === eventId)
      || this.deadLetterQueue.find(e => e.event.id === eventId)
      || this.completedEvents.find(e => e.event.id === eventId)
      || null;
  }

  /**
   * Get queue item by queue ID
   */
  getQueueItemById(queueId: string): QueuedEvent | null {
    return this.queue.find(e => e.queueId === queueId)
      || this.deadLetterQueue.find(e => e.queueId === queueId)
      || this.completedEvents.find(e => e.queueId === queueId)
      || null;
  }

  /**
   * Check if running
   */
  isQueueRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get configuration
   */
  getConfig(): EventQueueConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<EventQueueConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// ============================================================================
// SINGLETON & FACTORY
// ============================================================================

/**
 * Create a new event queue
 */
export function createEventQueue(config?: Partial<EventQueueConfig>): EventQueue {
  return new EventQueue(config);
}

/**
 * Default event queue instance
 */
export const eventQueue = createEventQueue({ autoStart: false });

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick enqueue
 */
export function enqueueEvent(event: ProcessedWebhookEvent): QueuedEvent {
  return eventQueue.enqueue(event);
}

/**
 * Get queue stats quickly
 */
export function getQueueStats(): QueueStats {
  return eventQueue.getStats();
}

/**
 * Start the default queue
 */
export function startEventQueue(): void {
  eventQueue.start();
}

/**
 * Stop the default queue
 */
export function stopEventQueue(): void {
  eventQueue.stop();
}

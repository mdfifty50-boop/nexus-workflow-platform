/**
 * Structured Logger for Nexus Workflow Execution
 *
 * Provides a unified logging interface with:
 * - Structured JSON logging format
 * - Multiple log levels (debug, info, warn, error)
 * - Context-aware logging (userId, workflowId, executionId)
 * - Arabic message support for user-facing logs
 * - Console and remote logging support
 * - Environment-based log level configuration
 *
 * @module monitoring/logger
 */

// ============================================================================
// Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  /** User ID for user-scoped logs */
  userId?: string
  /** Workflow ID for workflow-scoped logs */
  workflowId?: string
  /** Execution ID for execution-scoped logs */
  executionId?: string
  /** Step ID for step-scoped logs */
  stepId?: string
  /** Project ID for project-scoped logs */
  projectId?: string
  /** Request ID for tracing */
  requestId?: string
  /** Session ID for session tracking */
  sessionId?: string
  /** Additional context data */
  [key: string]: unknown
}

export interface LogEntry {
  /** Unique log entry ID */
  id: string
  /** ISO timestamp */
  timestamp: string
  /** Log level */
  level: LogLevel
  /** Log message (English) */
  message: string
  /** Log message (Arabic) - optional */
  messageAr?: string
  /** Log category/module */
  category: string
  /** Structured context */
  context: LogContext
  /** Additional metadata */
  metadata?: Record<string, unknown>
  /** Error details if applicable */
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  /** Duration in milliseconds for timing logs */
  durationMs?: number
  /** Tags for filtering */
  tags?: string[]
}

export interface LoggerConfig {
  /** Minimum log level to output */
  minLevel: LogLevel
  /** Enable console output */
  enableConsole: boolean
  /** Enable remote logging */
  enableRemote: boolean
  /** Remote logging endpoint */
  remoteEndpoint?: string
  /** Batch size for remote logging */
  batchSize: number
  /** Flush interval in milliseconds */
  flushIntervalMs: number
  /** Include stack traces in error logs */
  includeStackTraces: boolean
  /** Pretty print JSON logs */
  prettyPrint: boolean
  /** Default category for logs without explicit category */
  defaultCategory: string
}

export interface RemoteLogPayload {
  logs: LogEntry[]
  clientInfo: {
    userAgent: string
    url: string
    timestamp: string
  }
}

// ============================================================================
// Constants
// ============================================================================

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info',
  enableConsole: true,
  enableRemote: false,
  remoteEndpoint: import.meta.env.VITE_LOG_ENDPOINT,
  batchSize: 50,
  flushIntervalMs: 30000, // 30 seconds
  includeStackTraces: import.meta.env.DEV,
  prettyPrint: import.meta.env.DEV,
  defaultCategory: 'app',
}

// ============================================================================
// Arabic Message Helpers
// ============================================================================

/**
 * Common Arabic translations for logging messages
 */
export const LOG_MESSAGES_AR: Record<string, string> = {
  // Workflow execution
  'Workflow started': 'بدأ سير العمل',
  'Workflow completed': 'اكتمل سير العمل',
  'Workflow failed': 'فشل سير العمل',
  'Workflow paused': 'توقف سير العمل',
  'Workflow resumed': 'استأنف سير العمل',
  'Workflow cancelled': 'ألغي سير العمل',

  // Step execution
  'Step started': 'بدأت الخطوة',
  'Step completed': 'اكتملت الخطوة',
  'Step failed': 'فشلت الخطوة',
  'Step skipped': 'تم تخطي الخطوة',
  'Step retry': 'إعادة محاولة الخطوة',

  // API calls
  'API call started': 'بدأ استدعاء API',
  'API call completed': 'اكتمل استدعاء API',
  'API call failed': 'فشل استدعاء API',
  'API rate limited': 'تم تحديد معدل API',

  // Authentication
  'User authenticated': 'تم مصادقة المستخدم',
  'Authentication failed': 'فشلت المصادقة',
  'Session expired': 'انتهت صلاحية الجلسة',
  'Token refreshed': 'تم تحديث الرمز',

  // Errors
  'Connection error': 'خطأ في الاتصال',
  'Timeout error': 'خطأ في المهلة',
  'Validation error': 'خطأ في التحقق',
  'Permission denied': 'تم رفض الإذن',
  'Resource not found': 'المورد غير موجود',
  'Internal error': 'خطأ داخلي',

  // Exceptions
  'Exception created': 'تم إنشاء استثناء',
  'Exception approved': 'تمت الموافقة على الاستثناء',
  'Exception rejected': 'تم رفض الاستثناء',
  'Exception expired': 'انتهت صلاحية الاستثناء',

  // User actions
  'User action required': 'مطلوب إجراء المستخدم',
  'User confirmed': 'أكد المستخدم',
  'User cancelled': 'ألغى المستخدم',
}

/**
 * Get Arabic translation for a log message
 */
export function getArabicMessage(message: string): string | undefined {
  return LOG_MESSAGES_AR[message]
}

// ============================================================================
// Logger Class
// ============================================================================

/**
 * Structured logger for Nexus workflow execution
 */
export class Logger {
  private config: LoggerConfig
  private context: LogContext
  private logBuffer: LogEntry[] = []
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private readonly category: string

  constructor(category: string, config: Partial<LoggerConfig> = {}, context: LogContext = {}) {
    this.category = category
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.context = context

    // Start flush timer for remote logging
    if (this.config.enableRemote && this.config.flushIntervalMs > 0) {
      this.startFlushTimer()
    }
  }

  // ========================================
  // Core Logging Methods
  // ========================================

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: Record<string, unknown>, context?: LogContext): void {
    this.log('debug', message, metadata, context)
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: Record<string, unknown>, context?: LogContext): void {
    this.log('info', message, metadata, context)
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: Record<string, unknown>, context?: LogContext): void {
    this.log('warn', message, metadata, context)
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>, context?: LogContext): void {
    const errorDetails = this.extractErrorDetails(error)
    this.log('error', message, { ...metadata, ...errorDetails }, context)
  }

  /**
   * Log with timing information
   */
  timing(message: string, durationMs: number, metadata?: Record<string, unknown>, context?: LogContext): void {
    this.log('info', message, { ...metadata, durationMs }, context)
  }

  /**
   * Create a timing helper that logs on completion
   */
  startTimer(operation: string, metadata?: Record<string, unknown>, context?: LogContext): () => void {
    const start = performance.now()
    this.debug(`${operation} started`, metadata, context)

    return () => {
      const durationMs = Math.round(performance.now() - start)
      this.timing(`${operation} completed`, durationMs, metadata, context)
    }
  }

  // ========================================
  // Context Management
  // ========================================

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger(
      this.category,
      this.config,
      { ...this.context, ...additionalContext }
    )
  }

  /**
   * Create a logger scoped to a workflow
   */
  forWorkflow(workflowId: string, executionId?: string): Logger {
    return this.child({ workflowId, executionId })
  }

  /**
   * Create a logger scoped to a step
   */
  forStep(stepId: string, workflowId?: string, executionId?: string): Logger {
    return this.child({ stepId, workflowId, executionId })
  }

  /**
   * Create a logger scoped to a user
   */
  forUser(userId: string): Logger {
    return this.child({ userId })
  }

  /**
   * Set persistent context
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context }
  }

  /**
   * Get current context
   */
  getContext(): LogContext {
    return { ...this.context }
  }

  // ========================================
  // Internal Methods
  // ========================================

  /**
   * Core log method
   */
  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    additionalContext?: LogContext
  ): void {
    // Check log level
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.config.minLevel]) {
      return
    }

    const entry = this.createLogEntry(level, message, metadata, additionalContext)

    // Output to console
    if (this.config.enableConsole) {
      this.outputToConsole(entry)
    }

    // Add to buffer for remote logging
    if (this.config.enableRemote) {
      this.logBuffer.push(entry)
      if (this.logBuffer.length >= this.config.batchSize) {
        this.flush()
      }
    }
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    additionalContext?: LogContext
  ): LogEntry {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      messageAr: getArabicMessage(message),
      category: this.category,
      context: { ...this.context, ...additionalContext },
      metadata,
    }

    // Extract duration if present in metadata
    if (metadata?.durationMs !== undefined) {
      entry.durationMs = metadata.durationMs as number
      delete entry.metadata?.durationMs
    }

    // Extract error if present in metadata
    if (metadata?.error !== undefined) {
      entry.error = metadata.error as LogEntry['error']
      delete entry.metadata?.error
    }

    // Clean up empty metadata
    if (entry.metadata && Object.keys(entry.metadata).length === 0) {
      delete entry.metadata
    }

    return entry
  }

  /**
   * Extract error details from an error object
   */
  private extractErrorDetails(error: Error | unknown): { error?: LogEntry['error'] } {
    if (!error) return {}

    if (error instanceof Error) {
      return {
        error: {
          name: error.name,
          message: error.message,
          stack: this.config.includeStackTraces ? error.stack : undefined,
          code: (error as Error & { code?: string }).code,
        },
      }
    }

    if (typeof error === 'object' && error !== null) {
      const errObj = error as Record<string, unknown>
      return {
        error: {
          name: String(errObj.name || 'Error'),
          message: String(errObj.message || String(error)),
          code: errObj.code as string | undefined,
        },
      }
    }

    return {
      error: {
        name: 'Error',
        message: String(error),
      },
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const consoleMethod = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    }[entry.level]

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`

    if (this.config.prettyPrint) {
      // Pretty print for development
      consoleMethod(
        `${prefix} ${entry.message}`,
        entry.context.workflowId ? `\n  workflow: ${entry.context.workflowId}` : '',
        entry.context.stepId ? `\n  step: ${entry.context.stepId}` : '',
        entry.durationMs !== undefined ? `\n  duration: ${entry.durationMs}ms` : '',
        entry.metadata ? `\n  metadata: ${JSON.stringify(entry.metadata, null, 2)}` : '',
        entry.error ? `\n  error: ${entry.error.message}` : ''
      )
    } else {
      // Compact JSON for production
      consoleMethod(JSON.stringify(entry))
    }
  }

  // ========================================
  // Remote Logging
  // ========================================

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushIntervalMs)
  }

  /**
   * Flush buffered logs to remote endpoint
   */
  async flush(): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint || this.logBuffer.length === 0) {
      return
    }

    const logs = [...this.logBuffer]
    this.logBuffer = []

    const payload: RemoteLogPayload = {
      logs,
      clientInfo: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        timestamp: new Date().toISOString(),
      },
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      // Put logs back in buffer on failure
      this.logBuffer = [...logs, ...this.logBuffer]
      console.error('[Logger] Failed to flush logs to remote:', error)
    }
  }

  /**
   * Stop the flush timer and flush remaining logs
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    await this.flush()
  }

  // ========================================
  // Configuration
  // ========================================

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    const wasRemoteEnabled = this.config.enableRemote
    this.config = { ...this.config, ...config }

    // Handle remote logging changes
    if (!wasRemoteEnabled && this.config.enableRemote && this.config.flushIntervalMs > 0) {
      this.startFlushTimer()
    } else if (wasRemoteEnabled && !this.config.enableRemote && this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config }
  }
}

// ============================================================================
// Pre-configured Logger Instances
// ============================================================================

/** Root logger for the application */
export const rootLogger = new Logger('nexus')

/** Logger for orchestrator operations */
export const orchestratorLogger = new Logger('orchestrator')

/** Logger for Composio executor operations */
export const composioLogger = new Logger('composio')

/** Logger for exception queue operations */
export const exceptionLogger = new Logger('exceptions')

/** Logger for workflow generation */
export const workflowLogger = new Logger('workflow')

/** Logger for API operations */
export const apiLogger = new Logger('api')

/** Logger for authentication */
export const authLogger = new Logger('auth')

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a logger for a specific module
 */
export function createLogger(category: string, context?: LogContext): Logger {
  return new Logger(category, DEFAULT_CONFIG, context)
}

/**
 * Create a logger for workflow execution
 */
export function createWorkflowLogger(
  workflowId: string,
  executionId: string,
  userId?: string
): Logger {
  return new Logger('workflow-execution', DEFAULT_CONFIG, {
    workflowId,
    executionId,
    userId,
  })
}

/**
 * Create a logger for a specific step execution
 */
export function createStepLogger(
  stepId: string,
  workflowId: string,
  executionId: string
): Logger {
  return new Logger('step-execution', DEFAULT_CONFIG, {
    stepId,
    workflowId,
    executionId,
  })
}

// ============================================================================
// Global Log Level Configuration
// ============================================================================

/**
 * Set the global minimum log level
 */
export function setGlobalLogLevel(level: LogLevel): void {
  DEFAULT_CONFIG.minLevel = level
  rootLogger.configure({ minLevel: level })
}

/**
 * Get the current global log level
 */
export function getGlobalLogLevel(): LogLevel {
  return DEFAULT_CONFIG.minLevel
}

// ============================================================================
// Export Default
// ============================================================================

export default rootLogger

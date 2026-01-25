/**
 * Execution Log Storage and Retrieval
 *
 * Manages execution logs in Supabase with:
 * - Batched write operations for performance
 * - Query interface for log retrieval
 * - Log retention policy enforcement
 * - Export functionality (JSON, CSV)
 *
 * @module monitoring/execution-log
 */

import { supabase, isSupabaseConfigured } from '../supabase'
import { createLogger, type LogEntry, type LogLevel } from './logger'
import { type WorkflowMetrics, type StepMetrics, type APICallMetrics, type ErrorMetrics } from './metrics'

// ============================================================================
// Types
// ============================================================================

export interface ExecutionLogEntry {
  /** Unique log entry ID */
  id: string
  /** User ID */
  userId: string
  /** Project ID */
  projectId?: string
  /** Workflow ID */
  workflowId?: string
  /** Execution ID */
  executionId?: string
  /** Step ID */
  stepId?: string
  /** Log level */
  level: LogLevel
  /** Log category */
  category: string
  /** Log message */
  message: string
  /** Arabic message */
  messageAr?: string
  /** Structured context */
  context: Record<string, unknown>
  /** Metadata */
  metadata?: Record<string, unknown>
  /** Error details */
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  /** Duration in ms */
  durationMs?: number
  /** Tags */
  tags: string[]
  /** Created timestamp */
  createdAt: string
}

export interface ExecutionLogQuery {
  /** Filter by user ID */
  userId?: string
  /** Filter by project ID */
  projectId?: string
  /** Filter by workflow ID */
  workflowId?: string
  /** Filter by execution ID */
  executionId?: string
  /** Filter by step ID */
  stepId?: string
  /** Filter by log level(s) */
  levels?: LogLevel[]
  /** Filter by category(s) */
  categories?: string[]
  /** Filter by tag(s) */
  tags?: string[]
  /** Filter by date range - start */
  startDate?: string
  /** Filter by date range - end */
  endDate?: string
  /** Search in message */
  search?: string
  /** Has error */
  hasError?: boolean
  /** Sort field */
  sortBy?: 'createdAt' | 'level'
  /** Sort direction */
  sortOrder?: 'asc' | 'desc'
  /** Pagination - offset */
  offset?: number
  /** Pagination - limit */
  limit?: number
}

export interface ExecutionLogPage {
  /** Log entries */
  logs: ExecutionLogEntry[]
  /** Total count */
  total: number
  /** Has more */
  hasMore: boolean
  /** Current offset */
  offset: number
  /** Current limit */
  limit: number
}

export interface LogRetentionPolicy {
  /** Retention period in days for debug logs */
  debugRetentionDays: number
  /** Retention period in days for info logs */
  infoRetentionDays: number
  /** Retention period in days for warn logs */
  warnRetentionDays: number
  /** Retention period in days for error logs */
  errorRetentionDays: number
}

export interface ExecutionLogStats {
  /** Total logs */
  totalLogs: number
  /** Logs by level */
  byLevel: Record<LogLevel, number>
  /** Logs by category */
  byCategory: Record<string, number>
  /** Error count */
  errorCount: number
  /** Logs in last hour */
  lastHourCount: number
  /** Logs in last 24 hours */
  last24HoursCount: number
  /** Average logs per hour */
  avgLogsPerHour: number
}

export interface LogExportOptions {
  /** Export format */
  format: 'json' | 'csv'
  /** Include metadata */
  includeMetadata?: boolean
  /** Include context */
  includeContext?: boolean
  /** Include stack traces */
  includeStackTraces?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_RETENTION_POLICY: LogRetentionPolicy = {
  debugRetentionDays: 1,
  infoRetentionDays: 7,
  warnRetentionDays: 30,
  errorRetentionDays: 90,
}

const DEFAULT_BATCH_SIZE = 50
const DEFAULT_FLUSH_INTERVAL = 5000 // 5 seconds
const MAX_BATCH_SIZE = 200

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('execution-log')

// ============================================================================
// Execution Log Manager Class
// ============================================================================

/**
 * Manages execution logs with Supabase storage
 */
export class ExecutionLogManager {
  private logBuffer: ExecutionLogEntry[] = []
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private retentionPolicy: LogRetentionPolicy
  private batchSize: number
  private flushInterval: number
  private inMemoryLogs: ExecutionLogEntry[] = [] // Fallback when Supabase unavailable
  private maxInMemoryLogs = 10000

  constructor(options?: {
    retentionPolicy?: Partial<LogRetentionPolicy>
    batchSize?: number
    flushInterval?: number
  }) {
    this.retentionPolicy = { ...DEFAULT_RETENTION_POLICY, ...options?.retentionPolicy }
    this.batchSize = Math.min(options?.batchSize || DEFAULT_BATCH_SIZE, MAX_BATCH_SIZE)
    this.flushInterval = options?.flushInterval || DEFAULT_FLUSH_INTERVAL

    // Start flush timer
    this.startFlushTimer()
  }

  // ========================================
  // Write Operations
  // ========================================

  /**
   * Log an entry
   */
  log(entry: Omit<ExecutionLogEntry, 'id' | 'createdAt'>): void {
    const fullEntry: ExecutionLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    this.logBuffer.push(fullEntry)

    // Flush if buffer is full
    if (this.logBuffer.length >= this.batchSize) {
      this.flush()
    }
  }

  /**
   * Log from a LogEntry
   */
  logFromEntry(entry: LogEntry, userId: string, projectId?: string): void {
    this.log({
      userId,
      projectId,
      workflowId: entry.context.workflowId as string,
      executionId: entry.context.executionId as string,
      stepId: entry.context.stepId as string,
      level: entry.level,
      category: entry.category,
      message: entry.message,
      messageAr: entry.messageAr,
      context: entry.context,
      metadata: entry.metadata,
      error: entry.error,
      durationMs: entry.durationMs,
      tags: entry.tags || [],
    })
  }

  /**
   * Log workflow metrics
   */
  logWorkflowMetrics(metrics: WorkflowMetrics): void {
    this.log({
      userId: metrics.userId || 'system',
      workflowId: metrics.workflowId,
      executionId: metrics.executionId,
      level: metrics.status === 'failed' ? 'error' : 'info',
      category: 'workflow-metrics',
      message: `Workflow ${metrics.status}: ${metrics.workflowName || metrics.workflowId}`,
      messageAr: metrics.status === 'completed' ? 'اكتمل سير العمل' :
                 metrics.status === 'failed' ? 'فشل سير العمل' : 'سير العمل',
      context: {
        workflowId: metrics.workflowId,
        executionId: metrics.executionId,
        userId: metrics.userId,
      },
      metadata: {
        status: metrics.status,
        totalSteps: metrics.totalSteps,
        completedSteps: metrics.completedSteps,
        failedSteps: metrics.failedSteps,
        skippedSteps: metrics.skippedSteps,
        tokensUsed: metrics.tokensUsed,
        costUsd: metrics.costUsd,
      },
      error: metrics.error ? {
        name: 'WorkflowError',
        message: metrics.error.message,
        code: metrics.error.code,
      } : undefined,
      durationMs: metrics.durationMs,
      tags: ['workflow', 'metrics', metrics.status],
    })
  }

  /**
   * Log step metrics
   */
  logStepMetrics(step: StepMetrics, workflowId: string, executionId: string, userId: string): void {
    this.log({
      userId,
      workflowId,
      executionId,
      stepId: step.stepId,
      level: step.status === 'failed' ? 'error' : 'info',
      category: 'step-metrics',
      message: `Step ${step.status}: ${step.stepName}`,
      messageAr: step.status === 'completed' ? 'اكتملت الخطوة' :
                 step.status === 'failed' ? 'فشلت الخطوة' : 'الخطوة',
      context: {
        workflowId,
        executionId,
        stepId: step.stepId,
        userId,
      },
      metadata: {
        stepType: step.stepType,
        status: step.status,
        retryCount: step.retryCount,
        tokensUsed: step.tokensUsed,
        costUsd: step.costUsd,
      },
      error: step.error ? {
        name: 'StepError',
        message: step.error.message,
        code: step.error.code,
      } : undefined,
      durationMs: step.durationMs,
      tags: ['step', 'metrics', step.stepType, step.status],
    })
  }

  /**
   * Log API call metrics
   */
  logAPICallMetrics(call: APICallMetrics, userId: string): void {
    this.log({
      userId,
      workflowId: call.context?.workflowId as string,
      executionId: call.context?.executionId as string,
      stepId: call.context?.stepId as string,
      level: call.success ? 'info' : 'warn',
      category: 'api-call-metrics',
      message: `API ${call.success ? 'succeeded' : 'failed'}: ${call.service}/${call.tool}`,
      messageAr: call.success ? 'نجح استدعاء API' : 'فشل استدعاء API',
      context: call.context || {},
      metadata: {
        service: call.service,
        tool: call.tool,
        method: call.method,
        statusCode: call.statusCode,
        retryAttempt: call.retryAttempt,
        requestSizeBytes: call.requestSizeBytes,
        responseSizeBytes: call.responseSizeBytes,
      },
      error: call.error ? {
        name: 'APIError',
        message: call.error,
        code: call.errorCode,
      } : undefined,
      durationMs: call.durationMs,
      tags: ['api', call.service, call.success ? 'success' : 'failure'],
    })
  }

  /**
   * Log error metrics
   */
  logErrorMetrics(error: ErrorMetrics): void {
    this.log({
      userId: error.userId || 'system',
      workflowId: error.workflowId,
      executionId: error.executionId,
      stepId: error.stepId,
      level: 'error',
      category: 'error-metrics',
      message: `Error: ${error.message}`,
      messageAr: 'خطأ',
      context: {
        workflowId: error.workflowId,
        executionId: error.executionId,
        stepId: error.stepId,
        userId: error.userId,
      },
      metadata: {
        code: error.code,
        category: error.category,
        service: error.service,
        recoverable: error.recoverable,
        retried: error.retried,
        retrySuccessful: error.retrySuccessful,
      },
      error: {
        name: 'Error',
        message: error.message,
        code: error.code,
      },
      tags: ['error', error.category, error.service || 'unknown'].filter(Boolean) as string[],
    })
  }

  // ========================================
  // Flush Operations
  // ========================================

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  /**
   * Flush buffered logs to storage
   */
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return

    const logs = [...this.logBuffer]
    this.logBuffer = []

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('execution_logs')
          .insert(logs.map(log => ({
            id: log.id,
            user_id: log.userId,
            project_id: log.projectId,
            workflow_id: log.workflowId,
            execution_id: log.executionId,
            step_id: log.stepId,
            level: log.level,
            category: log.category,
            message: log.message,
            message_ar: log.messageAr,
            context: log.context,
            metadata: log.metadata,
            error: log.error,
            duration_ms: log.durationMs,
            tags: log.tags,
            created_at: log.createdAt,
          })))

        if (error) throw error
        logger.debug('Flushed logs to Supabase', { count: logs.length })
      } catch (error) {
        logger.warn('Failed to flush logs to Supabase, storing in memory', { error })
        this.storeInMemory(logs)
      }
    } else {
      this.storeInMemory(logs)
    }
  }

  /**
   * Store logs in memory (fallback)
   */
  private storeInMemory(logs: ExecutionLogEntry[]): void {
    this.inMemoryLogs.push(...logs)
    // Trim if too many
    if (this.inMemoryLogs.length > this.maxInMemoryLogs) {
      this.inMemoryLogs = this.inMemoryLogs.slice(-this.maxInMemoryLogs)
    }
  }

  // ========================================
  // Query Operations
  // ========================================

  /**
   * Query execution logs
   */
  async query(query: ExecutionLogQuery): Promise<ExecutionLogPage> {
    const offset = query.offset || 0
    const limit = Math.min(query.limit || 50, 1000)

    if (isSupabaseConfigured()) {
      try {
        let q = supabase
          .from('execution_logs')
          .select('*', { count: 'exact' })

        // Apply filters
        if (query.userId) {
          q = q.eq('user_id', query.userId)
        }
        if (query.projectId) {
          q = q.eq('project_id', query.projectId)
        }
        if (query.workflowId) {
          q = q.eq('workflow_id', query.workflowId)
        }
        if (query.executionId) {
          q = q.eq('execution_id', query.executionId)
        }
        if (query.stepId) {
          q = q.eq('step_id', query.stepId)
        }
        if (query.levels && query.levels.length > 0) {
          q = q.in('level', query.levels)
        }
        if (query.categories && query.categories.length > 0) {
          q = q.in('category', query.categories)
        }
        if (query.startDate) {
          q = q.gte('created_at', query.startDate)
        }
        if (query.endDate) {
          q = q.lte('created_at', query.endDate)
        }
        if (query.search) {
          q = q.ilike('message', `%${query.search}%`)
        }
        if (query.hasError !== undefined) {
          if (query.hasError) {
            q = q.not('error', 'is', null)
          } else {
            q = q.is('error', null)
          }
        }
        if (query.tags && query.tags.length > 0) {
          q = q.contains('tags', query.tags)
        }

        // Apply sorting
        const sortBy = query.sortBy === 'level' ? 'level' : 'created_at'
        const sortOrder = query.sortOrder === 'asc'
        q = q.order(sortBy, { ascending: sortOrder })

        // Apply pagination
        q = q.range(offset, offset + limit - 1)

        const { data, count, error } = await q

        if (error) throw error

        const logs = (data || []).map(this.mapFromDb)
        const total = count || 0

        return {
          logs,
          total,
          hasMore: offset + limit < total,
          offset,
          limit,
        }
      } catch (error) {
        logger.warn('Failed to query logs from Supabase, falling back to in-memory', { error })
      }
    }

    // Fallback to in-memory
    return this.queryInMemory(query)
  }

  /**
   * Query in-memory logs
   */
  private queryInMemory(query: ExecutionLogQuery): ExecutionLogPage {
    let filtered = [...this.inMemoryLogs]

    // Apply filters
    if (query.userId) {
      filtered = filtered.filter(l => l.userId === query.userId)
    }
    if (query.projectId) {
      filtered = filtered.filter(l => l.projectId === query.projectId)
    }
    if (query.workflowId) {
      filtered = filtered.filter(l => l.workflowId === query.workflowId)
    }
    if (query.executionId) {
      filtered = filtered.filter(l => l.executionId === query.executionId)
    }
    if (query.stepId) {
      filtered = filtered.filter(l => l.stepId === query.stepId)
    }
    if (query.levels && query.levels.length > 0) {
      filtered = filtered.filter(l => query.levels!.includes(l.level))
    }
    if (query.categories && query.categories.length > 0) {
      filtered = filtered.filter(l => query.categories!.includes(l.category))
    }
    if (query.startDate) {
      filtered = filtered.filter(l => l.createdAt >= query.startDate!)
    }
    if (query.endDate) {
      filtered = filtered.filter(l => l.createdAt <= query.endDate!)
    }
    if (query.search) {
      const searchLower = query.search.toLowerCase()
      filtered = filtered.filter(l => l.message.toLowerCase().includes(searchLower))
    }
    if (query.hasError !== undefined) {
      filtered = filtered.filter(l => query.hasError ? !!l.error : !l.error)
    }
    if (query.tags && query.tags.length > 0) {
      filtered = filtered.filter(l => query.tags!.some(t => l.tags.includes(t)))
    }

    // Apply sorting
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1
    if (query.sortBy === 'level') {
      const levelOrder = { debug: 0, info: 1, warn: 2, error: 3 }
      filtered.sort((a, b) => (levelOrder[a.level] - levelOrder[b.level]) * sortOrder)
    } else {
      filtered.sort((a, b) => (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortOrder)
    }

    // Apply pagination
    const offset = query.offset || 0
    const limit = Math.min(query.limit || 50, 1000)
    const total = filtered.length
    const paginated = filtered.slice(offset, offset + limit)

    return {
      logs: paginated,
      total,
      hasMore: offset + limit < total,
      offset,
      limit,
    }
  }

  /**
   * Get logs by execution ID
   */
  async getByExecutionId(executionId: string): Promise<ExecutionLogEntry[]> {
    const result = await this.query({ executionId, limit: 1000, sortOrder: 'asc' })
    return result.logs
  }

  /**
   * Get logs by workflow ID
   */
  async getByWorkflowId(workflowId: string, limit = 100): Promise<ExecutionLogEntry[]> {
    const result = await this.query({ workflowId, limit, sortOrder: 'desc' })
    return result.logs
  }

  /**
   * Get recent logs for a user
   */
  async getRecentForUser(userId: string, limit = 50): Promise<ExecutionLogEntry[]> {
    const result = await this.query({ userId, limit, sortOrder: 'desc' })
    return result.logs
  }

  /**
   * Get error logs
   */
  async getErrors(userId?: string, limit = 100): Promise<ExecutionLogEntry[]> {
    const result = await this.query({
      userId,
      levels: ['error'],
      limit,
      sortOrder: 'desc',
    })
    return result.logs
  }

  // ========================================
  // Statistics
  // ========================================

  /**
   * Get log statistics
   */
  async getStats(userId?: string, workflowId?: string): Promise<ExecutionLogStats> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    // Get all logs for calculating stats
    const allResult = await this.query({ userId, workflowId, limit: 10000 })
    const lastHourResult = await this.query({ userId, workflowId, startDate: oneHourAgo, limit: 10000 })
    const lastDayResult = await this.query({ userId, workflowId, startDate: oneDayAgo, limit: 10000 })

    const byLevel: Record<LogLevel, number> = { debug: 0, info: 0, warn: 0, error: 0 }
    const byCategory: Record<string, number> = {}

    for (const log of allResult.logs) {
      byLevel[log.level]++
      byCategory[log.category] = (byCategory[log.category] || 0) + 1
    }

    return {
      totalLogs: allResult.total,
      byLevel,
      byCategory,
      errorCount: byLevel.error,
      lastHourCount: lastHourResult.total,
      last24HoursCount: lastDayResult.total,
      avgLogsPerHour: Math.round(lastDayResult.total / 24),
    }
  }

  // ========================================
  // Retention
  // ========================================

  /**
   * Apply retention policy
   */
  async applyRetentionPolicy(): Promise<{ deleted: number }> {
    if (!isSupabaseConfigured()) {
      // Apply to in-memory logs
      return this.applyInMemoryRetention()
    }

    let totalDeleted = 0
    const now = new Date()

    const retentionMap: Record<LogLevel, number> = {
      debug: this.retentionPolicy.debugRetentionDays,
      info: this.retentionPolicy.infoRetentionDays,
      warn: this.retentionPolicy.warnRetentionDays,
      error: this.retentionPolicy.errorRetentionDays,
    }

    for (const [level, days] of Object.entries(retentionMap)) {
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

      try {
        const { count, error } = await supabase
          .from('execution_logs')
          .delete()
          .eq('level', level)
          .lt('created_at', cutoff)
          .select('*')

        if (error) throw error
        totalDeleted += count || 0
      } catch (error) {
        logger.error('Failed to apply retention policy', error)
      }
    }

    logger.info('Retention policy applied', { deleted: totalDeleted })
    return { deleted: totalDeleted }
  }

  /**
   * Apply retention to in-memory logs
   */
  private applyInMemoryRetention(): { deleted: number } {
    const now = new Date()
    const initialCount = this.inMemoryLogs.length

    const retentionMap: Record<LogLevel, number> = {
      debug: this.retentionPolicy.debugRetentionDays,
      info: this.retentionPolicy.infoRetentionDays,
      warn: this.retentionPolicy.warnRetentionDays,
      error: this.retentionPolicy.errorRetentionDays,
    }

    this.inMemoryLogs = this.inMemoryLogs.filter(log => {
      const days = retentionMap[log.level] || 7
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      return new Date(log.createdAt) > cutoff
    })

    const deleted = initialCount - this.inMemoryLogs.length
    return { deleted }
  }

  /**
   * Update retention policy
   */
  setRetentionPolicy(policy: Partial<LogRetentionPolicy>): void {
    this.retentionPolicy = { ...this.retentionPolicy, ...policy }
  }

  /**
   * Get current retention policy
   */
  getRetentionPolicy(): LogRetentionPolicy {
    return { ...this.retentionPolicy }
  }

  // ========================================
  // Export
  // ========================================

  /**
   * Export logs
   */
  async export(query: ExecutionLogQuery, options: LogExportOptions): Promise<string> {
    const result = await this.query({ ...query, limit: 10000 })

    if (options.format === 'csv') {
      return this.exportToCSV(result.logs, options)
    }
    return this.exportToJSON(result.logs, options)
  }

  /**
   * Export to JSON
   */
  private exportToJSON(logs: ExecutionLogEntry[], options: LogExportOptions): string {
    const exportLogs = logs.map(log => {
      const exported: Record<string, unknown> = {
        id: log.id,
        timestamp: log.createdAt,
        level: log.level,
        category: log.category,
        message: log.message,
        workflowId: log.workflowId,
        executionId: log.executionId,
        stepId: log.stepId,
      }

      if (log.durationMs !== undefined) {
        exported.durationMs = log.durationMs
      }

      if (log.error) {
        exported.error = {
          message: log.error.message,
          code: log.error.code,
        }
        if (options.includeStackTraces && log.error.stack) {
          (exported.error as Record<string, unknown>).stack = log.error.stack
        }
      }

      if (options.includeMetadata && log.metadata) {
        exported.metadata = log.metadata
      }

      if (options.includeContext) {
        exported.context = log.context
      }

      if (log.tags.length > 0) {
        exported.tags = log.tags
      }

      return exported
    })

    return JSON.stringify(exportLogs, null, 2)
  }

  /**
   * Export to CSV
   */
  private exportToCSV(logs: ExecutionLogEntry[], _options: LogExportOptions): string {
    const headers = [
      'timestamp',
      'level',
      'category',
      'message',
      'workflowId',
      'executionId',
      'stepId',
      'durationMs',
      'errorCode',
      'errorMessage',
      'tags',
    ]

    const rows = logs.map(log => [
      log.createdAt,
      log.level,
      log.category,
      `"${log.message.replace(/"/g, '""')}"`,
      log.workflowId || '',
      log.executionId || '',
      log.stepId || '',
      log.durationMs?.toString() || '',
      log.error?.code || '',
      log.error?.message ? `"${log.error.message.replace(/"/g, '""')}"` : '',
      `"${log.tags.join(',')}"`,
    ])

    return [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')
  }

  // ========================================
  // Database Mapping
  // ========================================

  /**
   * Map database row to ExecutionLogEntry
   */
  private mapFromDb(data: Record<string, unknown>): ExecutionLogEntry {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      projectId: data.project_id as string | undefined,
      workflowId: data.workflow_id as string | undefined,
      executionId: data.execution_id as string | undefined,
      stepId: data.step_id as string | undefined,
      level: data.level as LogLevel,
      category: data.category as string,
      message: data.message as string,
      messageAr: data.message_ar as string | undefined,
      context: (data.context as Record<string, unknown>) || {},
      metadata: data.metadata as Record<string, unknown> | undefined,
      error: data.error as ExecutionLogEntry['error'],
      durationMs: data.duration_ms as number | undefined,
      tags: (data.tags as string[]) || [],
      createdAt: data.created_at as string,
    }
  }

  // ========================================
  // Backward Compatibility Methods
  // ========================================

  /**
   * Query logs (alias for query)
   * @deprecated Use query() instead
   */
  async queryLogs(queryParams: ExecutionLogQuery): Promise<ExecutionLogPage> {
    return this.query(queryParams)
  }

  /**
   * Export logs (alias for export)
   * @deprecated Use export() instead
   */
  async exportLogs(queryParams: ExecutionLogQuery, options: LogExportOptions): Promise<string> {
    return this.export(queryParams, options)
  }

  /**
   * Log workflow execution (flexible signature for legacy compatibility)
   * @deprecated Use logWorkflowMetrics() instead
   */
  logWorkflowExecution(data: {
    userId?: string
    workflowId?: string
    executionId?: string
    status?: string
    input?: string | Record<string, unknown>
    output?: string | Record<string, unknown>
    error?: string | { code: string; message: string }
    durationMs?: number
  } | WorkflowMetrics): void {
    // Check if it's already a WorkflowMetrics object
    if ('startedAt' in data && 'totalSteps' in data) {
      this.logWorkflowMetrics(data as WorkflowMetrics)
      return
    }

    // Convert legacy format to WorkflowMetrics
    const metrics: WorkflowMetrics = {
      workflowId: data.workflowId || 'unknown',
      executionId: data.executionId || `exec_${Date.now()}`,
      userId: data.userId,
      startedAt: new Date().toISOString(),
      status: (data.status as 'running' | 'completed' | 'failed' | 'cancelled') || 'running',
      totalSteps: 0,
      completedSteps: 0,
      failedSteps: data.status === 'failed' ? 1 : 0,
      skippedSteps: 0,
      stepMetrics: [],
      tokensUsed: 0,
      costUsd: 0,
      tags: [],
      durationMs: data.durationMs,
      error: typeof data.error === 'string'
        ? { code: 'WORKFLOW_ERROR', message: data.error }
        : data.error,
    }

    this.logWorkflowMetrics(metrics)
  }

  // ========================================
  // Lifecycle
  // ========================================

  /**
   * Shutdown the log manager
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    await this.flush()
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/** Global execution log manager instance */
export const executionLogManager = new ExecutionLogManager()

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a logging middleware for the orchestrator
 */
export function createLoggingMiddleware(userId: string, projectId?: string) {
  return {
    onLog: (entry: LogEntry) => {
      executionLogManager.logFromEntry(entry, userId, projectId)
    },
    onWorkflowComplete: (metrics: WorkflowMetrics) => {
      executionLogManager.logWorkflowMetrics(metrics)
    },
    onStepComplete: (step: StepMetrics, workflowId: string, executionId: string) => {
      executionLogManager.logStepMetrics(step, workflowId, executionId, userId)
    },
    onAPICall: (call: APICallMetrics) => {
      executionLogManager.logAPICallMetrics(call, userId)
    },
    onError: (error: ErrorMetrics) => {
      executionLogManager.logErrorMetrics(error)
    },
  }
}

export default executionLogManager

/**
 * Metrics Collector for Nexus Workflow Execution
 *
 * Collects and aggregates metrics for:
 * - Workflow execution duration and success rates
 * - Step-level timing and error rates
 * - API call latency tracking
 * - Error categorization and analysis
 * - Token usage and cost tracking
 *
 * @module monitoring/metrics
 */

import { createLogger, type LogContext } from './logger'

// ============================================================================
// Types
// ============================================================================

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer'

export interface MetricValue {
  /** Metric name */
  name: string
  /** Metric type */
  type: MetricType
  /** Current value */
  value: number
  /** Labels for the metric */
  labels: Record<string, string>
  /** Timestamp when metric was recorded */
  timestamp: string
  /** Unit of measurement */
  unit?: string
}

export interface HistogramBucket {
  /** Upper bound of the bucket */
  le: number
  /** Count of observations in this bucket */
  count: number
}

export interface HistogramMetric {
  /** Total count of observations */
  count: number
  /** Sum of all observations */
  sum: number
  /** Histogram buckets */
  buckets: HistogramBucket[]
  /** Min value observed */
  min: number
  /** Max value observed */
  max: number
  /** Average value */
  avg: number
  /** P50 (median) */
  p50: number
  /** P90 percentile */
  p90: number
  /** P99 percentile */
  p99: number
}

export interface WorkflowMetrics {
  /** Workflow ID */
  workflowId: string
  /** Execution ID */
  executionId: string
  /** User ID */
  userId?: string
  /** Workflow name */
  workflowName?: string
  /** Start timestamp */
  startedAt: string
  /** End timestamp */
  completedAt?: string
  /** Total duration in milliseconds */
  durationMs?: number
  /** Final status */
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused'
  /** Number of steps */
  totalSteps: number
  /** Completed steps */
  completedSteps: number
  /** Failed steps */
  failedSteps: number
  /** Skipped steps */
  skippedSteps: number
  /** Step-level metrics */
  stepMetrics: StepMetrics[]
  /** Total tokens used */
  tokensUsed: number
  /** Total cost in USD */
  costUsd: number
  /** Error details if failed */
  error?: {
    code: string
    message: string
    stepId?: string
  }
  /** Tags for filtering */
  tags: string[]
}

export interface StepMetrics {
  /** Step ID */
  stepId: string
  /** Step name */
  stepName: string
  /** Step type */
  stepType: string
  /** Start timestamp */
  startedAt: string
  /** End timestamp */
  completedAt?: string
  /** Duration in milliseconds */
  durationMs?: number
  /** Status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  /** Retry count */
  retryCount: number
  /** Tokens used (for AI steps) */
  tokensUsed?: number
  /** Cost in USD (for AI steps) */
  costUsd?: number
  /** Error details if failed */
  error?: {
    code: string
    message: string
  }
}

export interface APICallMetrics {
  /** Unique call ID */
  callId: string
  /** Service name (e.g., 'gmail', 'slack') */
  service: string
  /** Tool or endpoint */
  tool: string
  /** HTTP method */
  method: string
  /** Start timestamp */
  startedAt: string
  /** End timestamp */
  completedAt?: string
  /** Duration in milliseconds */
  durationMs?: number
  /** HTTP status code */
  statusCode?: number
  /** Success flag */
  success: boolean
  /** Error message if failed */
  error?: string
  /** Error code */
  errorCode?: string
  /** Retry attempt number */
  retryAttempt: number
  /** Request size in bytes */
  requestSizeBytes?: number
  /** Response size in bytes */
  responseSizeBytes?: number
  /** Context */
  context?: LogContext
}

export interface ErrorMetrics {
  /** Error code */
  code: string
  /** Error message */
  message: string
  /** Error category */
  category: ErrorCategory
  /** Service that caused the error */
  service?: string
  /** Step that caused the error */
  stepId?: string
  /** Workflow ID */
  workflowId?: string
  /** Execution ID */
  executionId?: string
  /** User ID */
  userId?: string
  /** Timestamp */
  timestamp: string
  /** Is recoverable */
  recoverable: boolean
  /** Was retried */
  retried: boolean
  /** Retry successful */
  retrySuccessful?: boolean
}

export type ErrorCategory =
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'rate_limit'
  | 'timeout'
  | 'server_error'
  | 'client_error'
  | 'integration'
  | 'workflow'
  | 'unknown'

export interface MetricsSnapshot {
  /** Snapshot timestamp */
  timestamp: string
  /** Time period covered (e.g., 'last_hour', 'last_day') */
  period: string
  /** Workflow metrics summary */
  workflows: {
    total: number
    completed: number
    failed: number
    successRate: number
    avgDurationMs: number
    p50DurationMs: number
    p90DurationMs: number
  }
  /** Step metrics summary */
  steps: {
    total: number
    completed: number
    failed: number
    skipped: number
    retried: number
    avgDurationMs: number
  }
  /** API call metrics summary */
  apiCalls: {
    total: number
    successful: number
    failed: number
    successRate: number
    avgLatencyMs: number
    p50LatencyMs: number
    p90LatencyMs: number
    p99LatencyMs: number
    byService: Record<string, {
      total: number
      successful: number
      failed: number
      avgLatencyMs: number
    }>
  }
  /** Error metrics summary */
  errors: {
    total: number
    byCategory: Record<ErrorCategory, number>
    byService: Record<string, number>
    topErrors: Array<{
      code: string
      message: string
      count: number
    }>
  }
  /** Resource usage */
  resources: {
    totalTokensUsed: number
    totalCostUsd: number
    avgTokensPerWorkflow: number
    avgCostPerWorkflow: number
  }
}

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('metrics')

// ============================================================================
// Metrics Collector Class
// ============================================================================

/**
 * Metrics collector for workflow execution monitoring
 */
export class MetricsCollector {
  // In-memory storage for metrics
  private workflowMetrics: Map<string, WorkflowMetrics> = new Map()
  private apiCallMetrics: APICallMetrics[] = []
  private errorMetrics: ErrorMetrics[] = []
  private histograms: Map<string, number[]> = new Map()

  // Configuration
  private maxMetricsAge = 24 * 60 * 60 * 1000 // 24 hours
  private maxMetricsCount = 10000
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000) // Every hour
  }

  // ========================================
  // Workflow Metrics
  // ========================================

  /**
   * Start tracking a workflow execution
   * Supports both legacy string signature and new object signature
   */
  startWorkflow(params: string | {
    workflowId: string
    executionId: string
    workflowName?: string
    userId?: string
    totalSteps: number
    tags?: string[]
  }): WorkflowMetrics {
    // Handle legacy string signature (executionId only)
    const normalizedParams = typeof params === 'string'
      ? { workflowId: params, executionId: params, totalSteps: 0 }
      : params

    const metrics: WorkflowMetrics = {
      workflowId: normalizedParams.workflowId,
      executionId: normalizedParams.executionId,
      workflowName: normalizedParams.workflowName,
      userId: normalizedParams.userId,
      startedAt: new Date().toISOString(),
      status: 'running',
      totalSteps: normalizedParams.totalSteps,
      completedSteps: 0,
      failedSteps: 0,
      skippedSteps: 0,
      stepMetrics: [],
      tokensUsed: 0,
      costUsd: 0,
      tags: normalizedParams.tags || [],
    }

    this.workflowMetrics.set(normalizedParams.executionId, metrics)
    logger.debug('Workflow metrics started', { workflowId: normalizedParams.workflowId, executionId: normalizedParams.executionId })

    return metrics
  }

  /**
   * Complete workflow execution tracking
   */
  completeWorkflow(executionId: string, status: 'completed' | 'failed' | 'cancelled', error?: { code: string; message: string; stepId?: string }): WorkflowMetrics | null {
    const metrics = this.workflowMetrics.get(executionId)
    if (!metrics) return null

    const now = new Date().toISOString()
    metrics.completedAt = now
    metrics.status = status
    metrics.durationMs = new Date(now).getTime() - new Date(metrics.startedAt).getTime()
    metrics.error = error

    // Add to duration histogram
    this.addToHistogram('workflow_duration', metrics.durationMs)

    logger.info('Workflow metrics completed', {
      workflowId: metrics.workflowId,
      executionId,
      status,
      durationMs: metrics.durationMs,
    })

    return metrics
  }

  /**
   * Get workflow metrics by execution ID
   */
  getWorkflowMetrics(executionId: string): WorkflowMetrics | null {
    return this.workflowMetrics.get(executionId) || null
  }

  // ========================================
  // Step Metrics
  // ========================================

  /**
   * Start tracking a step execution
   * Supports both legacy (executionId, stepId, stepType) and new object signatures
   */
  startStep(executionId: string, paramsOrStepId: string | {
    stepId: string
    stepName: string
    stepType: string
  }, stepType?: string): StepMetrics | null {
    // Handle legacy 3-arg signature: (executionId, stepId, stepType)
    const params = typeof paramsOrStepId === 'string'
      ? { stepId: paramsOrStepId, stepName: paramsOrStepId, stepType: stepType || 'unknown' }
      : paramsOrStepId

    const workflowMetrics = this.workflowMetrics.get(executionId)
    if (!workflowMetrics) return null

    const stepMetrics: StepMetrics = {
      stepId: params.stepId,
      stepName: params.stepName,
      stepType: params.stepType,
      startedAt: new Date().toISOString(),
      status: 'running',
      retryCount: 0,
    }

    workflowMetrics.stepMetrics.push(stepMetrics)
    logger.debug('Step metrics started', { executionId, stepId: params.stepId })

    return stepMetrics
  }

  /**
   * Complete step execution tracking
   */
  completeStep(executionId: string, stepId: string, params: {
    status: 'completed' | 'failed' | 'skipped'
    tokensUsed?: number
    costUsd?: number
    error?: { code: string; message: string }
  }): StepMetrics | null {
    const workflowMetrics = this.workflowMetrics.get(executionId)
    if (!workflowMetrics) return null

    const stepMetrics = workflowMetrics.stepMetrics.find(s => s.stepId === stepId)
    if (!stepMetrics) return null

    const now = new Date().toISOString()
    stepMetrics.completedAt = now
    stepMetrics.status = params.status
    stepMetrics.durationMs = new Date(now).getTime() - new Date(stepMetrics.startedAt).getTime()
    stepMetrics.tokensUsed = params.tokensUsed
    stepMetrics.costUsd = params.costUsd
    stepMetrics.error = params.error

    // Update workflow metrics
    if (params.status === 'completed') {
      workflowMetrics.completedSteps++
    } else if (params.status === 'failed') {
      workflowMetrics.failedSteps++
    } else if (params.status === 'skipped') {
      workflowMetrics.skippedSteps++
    }

    if (params.tokensUsed) {
      workflowMetrics.tokensUsed += params.tokensUsed
    }
    if (params.costUsd) {
      workflowMetrics.costUsd += params.costUsd
    }

    // Add to duration histogram by step type
    this.addToHistogram(`step_duration_${stepMetrics.stepType}`, stepMetrics.durationMs)

    logger.debug('Step metrics completed', { executionId, stepId, status: params.status, durationMs: stepMetrics.durationMs })

    return stepMetrics
  }

  /**
   * Record a step retry
   */
  recordStepRetry(executionId: string, stepId: string): void {
    const workflowMetrics = this.workflowMetrics.get(executionId)
    if (!workflowMetrics) return

    const stepMetrics = workflowMetrics.stepMetrics.find(s => s.stepId === stepId)
    if (stepMetrics) {
      stepMetrics.retryCount++
    }
  }

  // ========================================
  // API Call Metrics
  // ========================================

  /**
   * Start tracking an API call
   */
  startAPICall(params: {
    service: string
    tool: string
    method: string
    context?: LogContext
  }): { callId: string; complete: (result: { statusCode?: number; success: boolean; error?: string; errorCode?: string; requestSizeBytes?: number; responseSizeBytes?: number }) => void } {
    const callId = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const metrics: APICallMetrics = {
      callId,
      service: params.service,
      tool: params.tool,
      method: params.method,
      startedAt: new Date().toISOString(),
      success: false,
      retryAttempt: 0,
      context: params.context,
    }

    this.apiCallMetrics.push(metrics)

    return {
      callId,
      complete: (result) => {
        this.completeAPICall(callId, result)
      },
    }
  }

  /**
   * Complete API call tracking
   */
  private completeAPICall(callId: string, result: {
    statusCode?: number
    success: boolean
    error?: string
    errorCode?: string
    requestSizeBytes?: number
    responseSizeBytes?: number
  }): APICallMetrics | null {
    const metrics = this.apiCallMetrics.find(m => m.callId === callId)
    if (!metrics) return null

    const now = new Date().toISOString()
    metrics.completedAt = now
    metrics.durationMs = new Date(now).getTime() - new Date(metrics.startedAt).getTime()
    metrics.statusCode = result.statusCode
    metrics.success = result.success
    metrics.error = result.error
    metrics.errorCode = result.errorCode
    metrics.requestSizeBytes = result.requestSizeBytes
    metrics.responseSizeBytes = result.responseSizeBytes

    // Add to latency histogram
    this.addToHistogram(`api_latency_${metrics.service}`, metrics.durationMs)
    this.addToHistogram('api_latency_all', metrics.durationMs)

    return metrics
  }

  /**
   * Record an API call retry
   */
  recordAPIRetry(callId: string): void {
    const metrics = this.apiCallMetrics.find(m => m.callId === callId)
    if (metrics) {
      metrics.retryAttempt++
    }
  }

  // ========================================
  // Error Metrics
  // ========================================

  /**
   * Record an error
   * Supports both legacy (category, service) and new object signatures
   */
  recordError(paramsOrCategory: string | {
    code: string
    message: string
    category: ErrorCategory
    service?: string
    stepId?: string
    workflowId?: string
    executionId?: string
    userId?: string
    recoverable: boolean
    retried?: boolean
    retrySuccessful?: boolean
  }, service?: string): void {
    // Handle legacy (category, service) signature
    const params = typeof paramsOrCategory === 'string'
      ? {
          code: paramsOrCategory.toUpperCase(),
          message: `${paramsOrCategory} error from ${service || 'unknown'}`,
          category: paramsOrCategory as ErrorCategory,
          service,
          recoverable: paramsOrCategory !== 'validation',
        }
      : paramsOrCategory

    const errorMetrics: ErrorMetrics = {
      ...params,
      timestamp: new Date().toISOString(),
      retried: params.retried ?? false,
    }

    this.errorMetrics.push(errorMetrics)
    logger.warn('Error recorded', { code: params.code, category: params.category, service: params.service })
  }

  /**
   * Categorize an error
   */
  categorizeError(error: Error | { code?: string; message?: string; statusCode?: number }): ErrorCategory {
    const code = (error as { code?: string }).code?.toLowerCase() || ''
    const message = (error as { message?: string }).message?.toLowerCase() || ''
    const statusCode = (error as { statusCode?: number }).statusCode

    // Network errors
    if (code.includes('network') || code.includes('econnrefused') || code.includes('enotfound') ||
        message.includes('network') || message.includes('connection refused')) {
      return 'network'
    }

    // Timeout errors
    if (code.includes('timeout') || code.includes('etimedout') ||
        message.includes('timeout') || message.includes('timed out')) {
      return 'timeout'
    }

    // Rate limiting
    if (code.includes('rate_limit') || statusCode === 429 ||
        message.includes('rate limit') || message.includes('too many requests')) {
      return 'rate_limit'
    }

    // Authentication
    if (code.includes('auth') || code.includes('unauthenticated') || statusCode === 401 ||
        message.includes('authentication') || message.includes('not authenticated')) {
      return 'authentication'
    }

    // Authorization
    if (code.includes('permission') || code.includes('forbidden') || statusCode === 403 ||
        message.includes('permission') || message.includes('forbidden') || message.includes('not authorized')) {
      return 'authorization'
    }

    // Validation
    if (code.includes('validation') || code.includes('invalid') || statusCode === 400 ||
        message.includes('validation') || message.includes('invalid')) {
      return 'validation'
    }

    // Server errors
    if (statusCode && statusCode >= 500) {
      return 'server_error'
    }

    // Client errors
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return 'client_error'
    }

    // Integration errors
    if (code.includes('integration') || message.includes('integration') ||
        message.includes('external service')) {
      return 'integration'
    }

    // Workflow errors
    if (code.includes('workflow') || message.includes('workflow')) {
      return 'workflow'
    }

    return 'unknown'
  }

  // ========================================
  // Histogram Operations
  // ========================================

  /**
   * Add a value to a histogram
   */
  private addToHistogram(name: string, value: number): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, [])
    }
    this.histograms.get(name)!.push(value)
  }

  /**
   * Calculate histogram statistics
   */
  getHistogramStats(name: string): HistogramMetric | null {
    const values = this.histograms.get(name)
    if (!values || values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    const count = sorted.length
    const sum = sorted.reduce((a, b) => a + b, 0)

    // Define histogram buckets
    const bucketBounds = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 30000, 60000]
    const buckets: HistogramBucket[] = bucketBounds.map(le => ({
      le,
      count: sorted.filter(v => v <= le).length,
    }))

    return {
      count,
      sum,
      buckets,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sum / count,
      p50: this.percentile(sorted, 50),
      p90: this.percentile(sorted, 90),
      p99: this.percentile(sorted, 99),
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  // ========================================
  // Metrics Snapshot
  // ========================================

  /**
   * Get a snapshot of all metrics
   */
  getSnapshot(period: string = 'all'): MetricsSnapshot {
    const now = new Date()
    const cutoff = this.getCutoffTime(period, now)

    // Filter metrics by time period
    const workflows = Array.from(this.workflowMetrics.values())
      .filter(w => new Date(w.startedAt) >= cutoff)

    const apiCalls = this.apiCallMetrics
      .filter(a => new Date(a.startedAt) >= cutoff)

    const errors = this.errorMetrics
      .filter(e => new Date(e.timestamp) >= cutoff)

    // Calculate workflow summary
    const completedWorkflows = workflows.filter(w => w.status === 'completed')
    const failedWorkflows = workflows.filter(w => w.status === 'failed')
    const workflowDurations = completedWorkflows
      .filter(w => w.durationMs !== undefined)
      .map(w => w.durationMs!)

    // Calculate step summary
    const allSteps = workflows.flatMap(w => w.stepMetrics)
    const retriedSteps = allSteps.filter(s => s.retryCount > 0)

    // Calculate API call summary
    const successfulAPICalls = apiCalls.filter(a => a.success)
    const failedAPICalls = apiCalls.filter(a => !a.success)
    const apiLatencies = apiCalls
      .filter(a => a.durationMs !== undefined)
      .map(a => a.durationMs!)

    // Group API calls by service
    const apiByService: Record<string, { total: number; successful: number; failed: number; latencies: number[] }> = {}
    for (const call of apiCalls) {
      if (!apiByService[call.service]) {
        apiByService[call.service] = { total: 0, successful: 0, failed: 0, latencies: [] }
      }
      apiByService[call.service].total++
      if (call.success) {
        apiByService[call.service].successful++
      } else {
        apiByService[call.service].failed++
      }
      if (call.durationMs !== undefined) {
        apiByService[call.service].latencies.push(call.durationMs)
      }
    }

    // Calculate error summary
    const errorsByCategory: Record<ErrorCategory, number> = {
      network: 0,
      authentication: 0,
      authorization: 0,
      validation: 0,
      rate_limit: 0,
      timeout: 0,
      server_error: 0,
      client_error: 0,
      integration: 0,
      workflow: 0,
      unknown: 0,
    }
    const errorsByService: Record<string, number> = {}
    const errorCounts: Record<string, number> = {}

    for (const error of errors) {
      errorsByCategory[error.category]++
      if (error.service) {
        errorsByService[error.service] = (errorsByService[error.service] || 0) + 1
      }
      const key = `${error.code}:${error.message}`
      errorCounts[key] = (errorCounts[key] || 0) + 1
    }

    const topErrors = Object.entries(errorCounts)
      .map(([key, count]) => {
        const [code, ...messageParts] = key.split(':')
        return { code, message: messageParts.join(':'), count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Calculate resource usage
    const totalTokens = workflows.reduce((sum, w) => sum + w.tokensUsed, 0)
    const totalCost = workflows.reduce((sum, w) => sum + w.costUsd, 0)

    return {
      timestamp: now.toISOString(),
      period,
      workflows: {
        total: workflows.length,
        completed: completedWorkflows.length,
        failed: failedWorkflows.length,
        successRate: workflows.length > 0 ? completedWorkflows.length / workflows.length : 0,
        avgDurationMs: workflowDurations.length > 0 ? workflowDurations.reduce((a, b) => a + b, 0) / workflowDurations.length : 0,
        p50DurationMs: this.percentile([...workflowDurations].sort((a, b) => a - b), 50),
        p90DurationMs: this.percentile([...workflowDurations].sort((a, b) => a - b), 90),
      },
      steps: {
        total: allSteps.length,
        completed: allSteps.filter(s => s.status === 'completed').length,
        failed: allSteps.filter(s => s.status === 'failed').length,
        skipped: allSteps.filter(s => s.status === 'skipped').length,
        retried: retriedSteps.length,
        avgDurationMs: allSteps.length > 0
          ? allSteps.filter(s => s.durationMs).reduce((sum, s) => sum + (s.durationMs || 0), 0) / allSteps.filter(s => s.durationMs).length
          : 0,
      },
      apiCalls: {
        total: apiCalls.length,
        successful: successfulAPICalls.length,
        failed: failedAPICalls.length,
        successRate: apiCalls.length > 0 ? successfulAPICalls.length / apiCalls.length : 0,
        avgLatencyMs: apiLatencies.length > 0 ? apiLatencies.reduce((a, b) => a + b, 0) / apiLatencies.length : 0,
        p50LatencyMs: this.percentile([...apiLatencies].sort((a, b) => a - b), 50),
        p90LatencyMs: this.percentile([...apiLatencies].sort((a, b) => a - b), 90),
        p99LatencyMs: this.percentile([...apiLatencies].sort((a, b) => a - b), 99),
        byService: Object.fromEntries(
          Object.entries(apiByService).map(([service, data]) => [
            service,
            {
              total: data.total,
              successful: data.successful,
              failed: data.failed,
              avgLatencyMs: data.latencies.length > 0 ? data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length : 0,
            },
          ])
        ),
      },
      errors: {
        total: errors.length,
        byCategory: errorsByCategory,
        byService: errorsByService,
        topErrors,
      },
      resources: {
        totalTokensUsed: totalTokens,
        totalCostUsd: totalCost,
        avgTokensPerWorkflow: workflows.length > 0 ? totalTokens / workflows.length : 0,
        avgCostPerWorkflow: workflows.length > 0 ? totalCost / workflows.length : 0,
      },
    }
  }

  /**
   * Get cutoff time for a period
   */
  private getCutoffTime(period: string, now: Date): Date {
    switch (period) {
      case 'last_minute':
        return new Date(now.getTime() - 60 * 1000)
      case 'last_hour':
        return new Date(now.getTime() - 60 * 60 * 1000)
      case 'last_day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case 'last_week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      default:
        return new Date(0) // All time
    }
  }

  // ========================================
  // Cleanup
  // ========================================

  /**
   * Clean up old metrics
   */
  private cleanup(): void {
    const cutoff = new Date(Date.now() - this.maxMetricsAge)

    // Clean up old workflow metrics
    for (const [executionId, metrics] of this.workflowMetrics.entries()) {
      if (new Date(metrics.startedAt) < cutoff) {
        this.workflowMetrics.delete(executionId)
      }
    }

    // Clean up old API call metrics
    this.apiCallMetrics = this.apiCallMetrics.filter(m => new Date(m.startedAt) >= cutoff)

    // Clean up old error metrics
    this.errorMetrics = this.errorMetrics.filter(m => new Date(m.timestamp) >= cutoff)

    // Trim histograms if too large
    for (const [name, values] of this.histograms.entries()) {
      if (values.length > this.maxMetricsCount) {
        this.histograms.set(name, values.slice(-this.maxMetricsCount))
      }
    }

    logger.debug('Metrics cleanup completed', {
      workflowCount: this.workflowMetrics.size,
      apiCallCount: this.apiCallMetrics.length,
      errorCount: this.errorMetrics.length,
    })
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.workflowMetrics.clear()
    this.apiCallMetrics = []
    this.errorMetrics = []
    this.histograms.clear()
  }

  /**
   * Shutdown the metrics collector
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  // ========================================
  // Backward Compatibility Methods
  // ========================================

  /**
   * Record API call
   * Supports both legacy (service, tool) and new object signatures
   * @deprecated Use startAPICall() instead
   */
  recordAPICall(paramsOrService: string | {
    service: string
    tool: string
    method: string
    success: boolean
    durationMs: number
    statusCode?: number
    error?: string
    context?: LogContext
  }, tool?: string): void {
    // Handle legacy (service, tool) signature - just log it
    if (typeof paramsOrService === 'string') {
      const { complete } = this.startAPICall({
        service: paramsOrService,
        tool: tool || 'unknown',
        method: 'execute',
      })
      // Auto-complete as success for legacy calls (actual result not tracked)
      complete({ success: true })
      return
    }

    // New object signature
    const params = paramsOrService
    const { complete } = this.startAPICall({
      service: params.service,
      tool: params.tool,
      method: params.method,
      context: params.context,
    })
    complete({
      success: params.success,
      statusCode: params.statusCode,
      error: params.error,
    })
  }

  /**
   * Record API latency (integrated into startAPICall)
   * @deprecated Use startAPICall() instead
   */
  recordAPILatency(service: string, toolOrDuration: string | number, durationMs?: number): void {
    // Handle both (service, duration) and (service, tool, duration) signatures
    const actualDuration = typeof toolOrDuration === 'number' ? toolOrDuration : (durationMs || 0)
    const tool = typeof toolOrDuration === 'string' ? toolOrDuration : 'unknown'

    // Record the API call with latency
    const { complete } = this.startAPICall({
      service,
      tool,
      method: 'execute',
    })
    complete({ success: true })

    // The duration is implicitly recorded by the startAPICall mechanism
    logger.debug('API latency recorded', { service, tool, durationMs: actualDuration })
  }

  /**
   * End workflow with legacy signature (boolean success, string error)
   * @deprecated Use completeWorkflow() instead
   */
  endWorkflow(executionId: string, success: boolean, errorMessage?: string): WorkflowMetrics | null {
    const status = success ? 'completed' : 'failed'
    const error = errorMessage ? { code: 'WORKFLOW_ERROR', message: errorMessage } : undefined
    return this.completeWorkflow(executionId, status as 'completed' | 'failed' | 'cancelled', error)
  }

  /**
   * End step with legacy signature (boolean success, string error)
   * @deprecated Use completeStep() instead
   */
  endStep(executionId: string, stepId: string, success: boolean, errorMessage?: string): StepMetrics | null {
    const status = success ? 'completed' : 'failed'
    const error = errorMessage ? { code: 'STEP_ERROR', message: errorMessage } : undefined
    return this.completeStep(executionId, stepId, { status: status as 'completed' | 'failed' | 'skipped', error })
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/** Global metrics collector instance */
export const metricsCollector = new MetricsCollector()

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a timer for measuring operation duration
 */
export function createTimer(): () => number {
  const start = performance.now()
  return () => Math.round(performance.now() - start)
}

/**
 * Time an async operation
 */
export async function timeAsync<T>(
  operation: () => Promise<T>,
  metricsCallback?: (durationMs: number) => void
): Promise<T> {
  const start = performance.now()
  try {
    return await operation()
  } finally {
    const durationMs = Math.round(performance.now() - start)
    if (metricsCallback) {
      metricsCallback(durationMs)
    }
  }
}

export default metricsCollector

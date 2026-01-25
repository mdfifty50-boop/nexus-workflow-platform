/**
 * Monitoring Module - Unified Exports
 *
 * Comprehensive logging and monitoring system for Nexus workflow execution.
 *
 * @module monitoring
 */

// Legacy performance monitoring exports (for backward compatibility)
export {
  monitoring,
  trackTiming,
  trackAsyncTiming,
  formatBytes,
  formatDuration,
  type PerformanceMetric,
  type WebVitals,
  type APIMetrics,
  type MemoryMetrics,
  type HealthStatus,
  type HealthCheck,
  type MonitoringConfig,
} from '../monitoring-legacy'

// Logger exports
export {
  Logger,
  rootLogger,
  orchestratorLogger,
  composioLogger,
  exceptionLogger,
  workflowLogger,
  apiLogger,
  authLogger,
  createLogger,
  createWorkflowLogger,
  createStepLogger,
  setGlobalLogLevel,
  getGlobalLogLevel,
  getArabicMessage,
  LOG_MESSAGES_AR,
  type LogLevel,
  type LogContext,
  type LogEntry,
  type LoggerConfig,
} from './logger'

// Metrics exports
export {
  MetricsCollector,
  metricsCollector,
  createTimer,
  timeAsync,
  type MetricType,
  type MetricValue,
  type HistogramBucket,
  type HistogramMetric,
  type WorkflowMetrics,
  type StepMetrics,
  type APICallMetrics,
  type ErrorMetrics,
  type ErrorCategory,
  type MetricsSnapshot,
} from './metrics'

// Execution log exports
export {
  ExecutionLogManager,
  executionLogManager,
  createLoggingMiddleware,
  type ExecutionLogEntry,
  type ExecutionLogQuery,
  type ExecutionLogPage,
  type LogRetentionPolicy,
  type ExecutionLogStats,
  type LogExportOptions,
} from './execution-log'

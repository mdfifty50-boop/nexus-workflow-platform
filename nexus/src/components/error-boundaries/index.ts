/**
 * Error Boundaries Index
 *
 * Centralized exports for all error boundary components.
 */

// Base error boundary with multiple variants
export { BaseErrorBoundary, type ErrorBoundaryVariant, type BaseErrorBoundaryProps } from './BaseErrorBoundary'

// Specialized error boundaries
export { WorkflowErrorBoundary } from './WorkflowErrorBoundary'
export { ChatErrorBoundary } from './ChatErrorBoundary'
export { IntegrationErrorBoundary } from './IntegrationErrorBoundary'

// Re-export error logger utilities for convenience
export {
  logError,
  logWarning,
  logCritical,
  createErrorReporter,
  getErrorLog,
  clearErrorLog,
  generateErrorReport,
  copyErrorReport,
  type ErrorSeverity,
  type ErrorContext,
  type ErrorLogEntry,
} from '@/lib/error-logger'

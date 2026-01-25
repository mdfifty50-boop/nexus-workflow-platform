/**
 * ErrorBoundary Component
 *
 * Comprehensive error boundary with:
 * - Error logging with unique error IDs
 * - User-friendly error messages
 * - Retry functionality (without page reload)
 * - Error reporting to sessionStorage
 * - HOC wrapper utility
 */

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

/**
 * Props passed to custom fallback components
 */
export interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
  resetError: () => void
  reloadPage: () => void
}

interface Props {
  children: ReactNode
  /** Custom fallback UI - can be a ReactNode or a function receiving error details */
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode)
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Callback when user clicks retry */
  onRetry?: () => void
  /** Custom error message */
  errorMessage?: string
  /** Scope name for error logging */
  scope?: string
  /** Show error details (defaults to true in development) */
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

/**
 * Generate unique error ID for tracking
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Log error to console and sessionStorage
 */
function logError(
  error: Error,
  errorInfo: ErrorInfo,
  scope: string,
  errorId: string
): void {
  // Console logging
  console.group(`[ErrorBoundary] Error in ${scope}`)
  console.error('Error ID:', errorId)
  console.error('Error:', error)
  console.error('Component Stack:', errorInfo.componentStack)
  console.groupEnd()

  // Store error in sessionStorage for debugging
  try {
    const errorLog = {
      id: errorId,
      scope,
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    const existingLogs = JSON.parse(sessionStorage.getItem('nexus_error_log') || '[]')
    existingLogs.push(errorLog)
    // Keep only last 10 errors
    const trimmedLogs = existingLogs.slice(-10)
    sessionStorage.setItem('nexus_error_log', JSON.stringify(trimmedLogs))
  } catch {
    // Ignore storage errors silently
  }
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, scope = 'unknown' } = this.props
    const errorId = this.state.errorId || generateErrorId()

    this.setState({ errorInfo, errorId })

    // Log the error
    logError(error, errorInfo, scope, errorId)

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo)
    }
  }

  /**
   * Reset error state to try rendering children again
   */
  private resetError = () => {
    const { onRetry } = this.props

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })

    if (onRetry) {
      onRetry()
    }
  }

  private reloadPage = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  public render() {
    const { hasError, error, errorInfo, errorId } = this.state
    const {
      children,
      fallback,
      errorMessage,
      showDetails = process.env.NODE_ENV === 'development',
    } = this.props

    if (!hasError) {
      return children
    }

    // Use custom fallback if provided
    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback({
          error,
          errorInfo,
          errorId,
          resetError: this.resetError,
          reloadPage: this.reloadPage,
        })
      }
      return fallback
    }

    // Default error UI
    return (
      <div
        data-testid="error-boundary"
        role="alert"
        className="min-h-screen bg-slate-950 flex items-center justify-center p-4"
      >
        <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-slate-700 p-8 text-center">
          {/* Error icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-slate-400 mb-4">
            {errorMessage ||
              'We encountered an unexpected error. Please try refreshing the page or go back to the dashboard.'}
          </p>

          {/* Error ID for support */}
          {errorId && (
            <p className="text-slate-500 text-sm mb-4">
              Error ID:{' '}
              <code className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                {errorId}
              </code>
            </p>
          )}

          {/* Error details (development mode) */}
          {showDetails && error && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300 transition-colors">
                Show error details
              </summary>
              <div className="mt-2 bg-slate-800 rounded-lg p-4 overflow-auto max-h-40">
                <p className="text-red-400 text-sm font-mono mb-2">
                  {error.name}: {error.message}
                </p>
                {error.stack && (
                  <pre className="text-slate-500 text-xs whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
                {errorInfo?.componentStack && (
                  <>
                    <p className="text-slate-400 text-xs mt-2 mb-1 font-semibold">
                      Component Stack:
                    </p>
                    <pre className="text-slate-500 text-xs whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            </details>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={this.resetError}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-medium"
            >
              Try Again
            </button>
            <button
              onClick={this.reloadPage}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={this.handleGoHome}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary scope={displayName} {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }

  WithErrorBoundaryWrapper.displayName = `WithErrorBoundary(${displayName})`

  return WithErrorBoundaryWrapper
}

/**
 * Simple inline error fallback component
 */
export function ErrorFallback({
  error,
  resetError,
  errorId,
}: ErrorFallbackProps) {
  return (
    <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
      <h3 className="text-red-200 font-semibold mb-2">An error occurred</h3>
      <p className="text-red-400 text-sm mb-3">
        {error?.message || 'Unknown error'}
      </p>
      {errorId && (
        <p className="text-xs text-red-500 mb-3">Error ID: {errorId}</p>
      )}
      <button
        onClick={resetError}
        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}

/**
 * Utility to get stored error logs
 */
export function getErrorLogs(): Array<{
  id: string
  scope: string
  message: string
  timestamp: string
}> {
  try {
    return JSON.parse(sessionStorage.getItem('nexus_error_log') || '[]')
  } catch {
    return []
  }
}

/**
 * Utility to clear stored error logs
 */
export function clearErrorLogs(): void {
  try {
    sessionStorage.removeItem('nexus_error_log')
  } catch {
    // Ignore
  }
}

export default ErrorBoundary

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { logError, copyErrorReport, type ErrorSeverity, type ErrorContext } from '@/lib/error-logger'
import { trackBoundaryError, isInitialized as isErrorTrackingInitialized } from '@/lib/errorTracking'

// =============================================================================
// TYPES
// =============================================================================

export type ErrorBoundaryVariant = 'full-page' | 'inline' | 'card' | 'minimal'

export interface BaseErrorBoundaryProps {
  children: ReactNode
  variant?: ErrorBoundaryVariant
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode)
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  context?: ErrorContext
  severity?: ErrorSeverity
  showRetry?: boolean
  showReport?: boolean
  showHome?: boolean
  retryLabel?: string
  title?: string
  message?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// =============================================================================
// USER-FRIENDLY ERROR MESSAGES
// =============================================================================

const friendlyMessages: Record<string, { title: string; message: string }> = {
  ChunkLoadError: {
    title: 'Update Available',
    message: 'A new version is available. Please refresh to get the latest features.',
  },
  NetworkError: {
    title: 'Connection Issue',
    message: 'Having trouble connecting. Please check your internet and try again.',
  },
  TypeError: {
    title: 'Something Unexpected Happened',
    message: 'We ran into an issue. Our team has been notified.',
  },
  SyntaxError: {
    title: 'Data Processing Error',
    message: 'We had trouble processing some information. Please try again.',
  },
  RangeError: {
    title: 'Processing Limit Reached',
    message: 'This operation exceeded our limits. Try with less data.',
  },
}

function getFriendlyMessage(error: Error): { title: string; message: string } {
  // Check for known error types
  for (const [errorType, messages] of Object.entries(friendlyMessages)) {
    if (error.name === errorType || error.message.includes(errorType)) {
      return messages
    }
  }

  // Check for dynamic import failures
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    return {
      title: 'Loading Error',
      message: 'Some content failed to load. Please refresh the page.',
    }
  }

  // Default friendly message
  return {
    title: 'Something Went Wrong',
    message: 'We encountered an unexpected issue. Please try again.',
  }
}

// =============================================================================
// BASE ERROR BOUNDARY COMPONENT
// =============================================================================

export class BaseErrorBoundary extends Component<BaseErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Log error with legacy error-logger
    logError(error, this.props.severity || 'medium', {
      ...this.props.context,
      additionalData: {
        componentStack: errorInfo.componentStack,
      },
    })

    // Report to production error tracking system
    if (isErrorTrackingInitialized()) {
      trackBoundaryError(
        error,
        errorInfo.componentStack || '',
        this.props.severity || 'high',
        {
          ...this.props.context,
          route: window.location.pathname,
        }
      )
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  private handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReport = async () => {
    const success = await copyErrorReport()
    if (success) {
      alert('Error report copied! Please paste it when contacting support.')
    } else {
      alert('Could not copy report. Please take a screenshot instead.')
    }
  }

  public render() {
    const {
      children,
      variant = 'card',
      fallback,
      showRetry = true,
      showReport = true,
      showHome = true,
      retryLabel = 'Try Again',
      title: customTitle,
      message: customMessage,
    } = this.props

    const { hasError, error, errorInfo } = this.state

    if (!hasError) {
      return children
    }

    // Use custom fallback if provided
    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback(error!, this.handleRetry)
      }
      return fallback
    }

    const { title, message } = error
      ? getFriendlyMessage(error)
      : { title: 'Error', message: 'Something went wrong' }

    const displayTitle = customTitle || title
    const displayMessage = customMessage || message

    // Render based on variant
    switch (variant) {
      case 'minimal':
        return this.renderMinimal(displayTitle, displayMessage, showRetry, retryLabel)
      case 'inline':
        return this.renderInline(displayTitle, displayMessage, showRetry, retryLabel)
      case 'card':
        return this.renderCard(displayTitle, displayMessage, showRetry, showReport, showHome, retryLabel, errorInfo)
      case 'full-page':
      default:
        return this.renderFullPage(displayTitle, displayMessage, showRetry, showReport, showHome, retryLabel, errorInfo)
    }
  }

  private renderMinimal(title: string, _message: string, showRetry: boolean, retryLabel: string) {
    return (
      <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-sm">
        <span className="text-destructive">!</span>
        <span className="text-destructive/80 flex-1">{title}</span>
        {showRetry && (
          <Button
            size="sm"
            variant="ghost"
            onClick={this.handleRetry}
            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
          >
            {retryLabel}
          </Button>
        )}
      </div>
    )
  }

  private renderInline(title: string, message: string, showRetry: boolean, retryLabel: string) {
    return (
      <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
          {showRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={this.handleRetry}
              className="mt-3"
            >
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    )
  }

  private renderCard(
    title: string,
    message: string,
    showRetry: boolean,
    showReport: boolean,
    showHome: boolean,
    retryLabel: string,
    errorInfo: ErrorInfo | null
  ) {
    return (
      <div className="bg-card border border-destructive/20 rounded-xl p-6 max-w-md mx-auto">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-muted-foreground mb-4">{message}</p>

          {import.meta.env.DEV && errorInfo && (
            <details className="w-full mb-4 text-left">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                {errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2 justify-center">
            {showRetry && (
              <Button size="sm" onClick={this.handleRetry}>
                {retryLabel}
              </Button>
            )}
            {showHome && (
              <Button size="sm" variant="outline" onClick={this.handleGoHome}>
                Go to Dashboard
              </Button>
            )}
            {showReport && (
              <Button size="sm" variant="ghost" onClick={this.handleReport}>
                Report Issue
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  private renderFullPage(
    title: string,
    message: string,
    showRetry: boolean,
    showReport: boolean,
    showHome: boolean,
    retryLabel: string,
    errorInfo: ErrorInfo | null
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground mb-6">{message}</p>

          {import.meta.env.DEV && errorInfo && (
            <details className="mb-6 text-left bg-card border rounded-lg p-4">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                Technical Details (Dev Mode)
              </summary>
              <pre className="mt-2 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                {errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-3">
            {showRetry && (
              <Button onClick={this.handleReload} size="lg" className="w-full">
                {retryLabel}
              </Button>
            )}
            {showHome && (
              <Button variant="outline" onClick={this.handleGoHome} size="lg" className="w-full">
                Go to Dashboard
              </Button>
            )}
            {showReport && (
              <Button variant="ghost" onClick={this.handleReport} className="w-full">
                Report this issue
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default BaseErrorBoundary

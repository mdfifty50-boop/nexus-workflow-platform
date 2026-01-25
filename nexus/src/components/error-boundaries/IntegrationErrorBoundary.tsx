import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { logError, copyErrorReport } from '@/lib/error-logger'

// =============================================================================
// INTEGRATION ERROR BOUNDARY
// =============================================================================
// Specialized error boundary for third-party integration panels.
// Provides integration-specific recovery options and connection status info.

interface Props {
  children: ReactNode
  integrationId?: string
  integrationName?: string
  onRetry?: () => void
  onReconnect?: () => void
  onDisable?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isRecovering: boolean
}

// Integration-specific error messages
const integrationErrorMessages: Record<string, { title: string; message: string; suggestion: string; icon: string }> = {
  'auth': {
    title: 'Authentication Failed',
    message: 'Your connection to this service has expired.',
    suggestion: 'Reconnect your account to continue.',
    icon: 'key',
  },
  'permission': {
    title: 'Permission Denied',
    message: 'This app doesn\'t have the required permissions.',
    suggestion: 'Review and update the app permissions.',
    icon: 'shield',
  },
  'rate': {
    title: 'Rate Limit Exceeded',
    message: 'Too many requests to this service.',
    suggestion: 'Wait a few minutes before trying again.',
    icon: 'clock',
  },
  'config': {
    title: 'Configuration Error',
    message: 'The integration settings are invalid.',
    suggestion: 'Check your API keys and settings.',
    icon: 'settings',
  },
  'network': {
    title: 'Connection Failed',
    message: 'Unable to connect to the service.',
    suggestion: 'Check your internet connection.',
    icon: 'wifi-off',
  },
  'api': {
    title: 'Service Error',
    message: 'The external service returned an error.',
    suggestion: 'The service may be experiencing issues.',
    icon: 'server',
  },
  'webhook': {
    title: 'Webhook Error',
    message: 'Failed to process incoming data.',
    suggestion: 'Check your webhook configuration.',
    icon: 'link',
  },
  'sync': {
    title: 'Sync Failed',
    message: 'Data synchronization was interrupted.',
    suggestion: 'Try syncing again in a few moments.',
    icon: 'refresh',
  },
}

function getIntegrationErrorMessage(error: Error): { title: string; message: string; suggestion: string; icon: string } {
  const errorMessage = error.message.toLowerCase()

  for (const [key, value] of Object.entries(integrationErrorMessages)) {
    if (errorMessage.includes(key)) {
      return value
    }
  }

  // Check for HTTP status codes
  if (errorMessage.includes('401') || errorMessage.includes('403')) {
    return integrationErrorMessages['auth']
  }
  if (errorMessage.includes('429')) {
    return integrationErrorMessages['rate']
  }
  if (errorMessage.includes('5')) {
    return integrationErrorMessages['api']
  }

  // Default
  return {
    title: 'Integration Error',
    message: 'Something went wrong with this integration.',
    suggestion: 'Try reconnecting or contact support.',
    icon: 'plug',
  }
}

function renderIcon(icon: string) {
  switch (icon) {
    case 'key':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      )
    case 'shield':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    case 'clock':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'settings':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    case 'wifi-off':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
      )
    case 'server':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      )
    case 'link':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    case 'refresh':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    default: // plug
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
  }
}

export class IntegrationErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isRecovering: false,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    logError(error, 'medium', {
      component: 'IntegrationErrorBoundary',
      integrationId: this.props.integrationId,
      additionalData: {
        integrationName: this.props.integrationName,
        componentStack: errorInfo.componentStack,
      },
    })
  }

  private handleRetry = async () => {
    this.setState({ isRecovering: true })

    await new Promise((resolve) => setTimeout(resolve, 500))

    if (this.props.onRetry) {
      this.props.onRetry()
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
    })
  }

  private handleReconnect = () => {
    if (this.props.onReconnect) {
      this.props.onReconnect()
    }
  }

  private handleDisable = () => {
    if (this.props.onDisable) {
      this.props.onDisable()
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  private handleReport = async () => {
    const success = await copyErrorReport()
    if (success) {
      alert('Error details copied!')
    }
  }

  public render() {
    const { children, integrationName } = this.props
    const { hasError, error, errorInfo, isRecovering } = this.state

    if (!hasError) {
      return children
    }

    const { title, message, suggestion, icon } = error
      ? getIntegrationErrorMessage(error)
      : { ...integrationErrorMessages['api'], icon: 'plug' }

    return (
      <div className="bg-card border border-destructive/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0 text-destructive">
            {renderIcon(icon)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{title}</h3>
              {integrationName && (
                <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                  {integrationName}
                </span>
              )}
            </div>
            <p className="text-muted-foreground mb-2">{message}</p>
            <p className="text-sm text-primary/70 mb-4">{suggestion}</p>

            {/* Dev Details */}
            {import.meta.env.DEV && errorInfo && (
              <details className="mb-4 bg-muted/50 rounded-lg p-2">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs overflow-auto max-h-20">
                  {error?.message}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={this.handleRetry}
                disabled={isRecovering}
              >
                {isRecovering ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Retrying...
                  </>
                ) : (
                  'Try Again'
                )}
              </Button>

              {this.props.onReconnect && (
                <Button size="sm" variant="outline" onClick={this.handleReconnect}>
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  Reconnect
                </Button>
              )}

              {this.props.onDisable && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={this.handleDisable}
                  className="text-muted-foreground"
                >
                  Disable Integration
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={this.handleReport}
                className="ml-auto text-muted-foreground"
              >
                Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default IntegrationErrorBoundary

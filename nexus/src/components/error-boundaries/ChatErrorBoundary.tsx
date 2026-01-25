import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { logError, copyErrorReport } from '@/lib/error-logger'

// =============================================================================
// CHAT ERROR BOUNDARY
// =============================================================================
// Specialized error boundary for chat and AI assistant interfaces.
// Provides chat-specific recovery options and maintains conversation context.

interface Props {
  children: ReactNode
  conversationId?: string
  agentName?: string
  onRetry?: () => void
  onClearChat?: () => void
  onSwitchAgent?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isRecovering: boolean
}

// Chat-specific error messages
const chatErrorMessages: Record<string, { title: string; message: string; suggestion: string }> = {
  'stream': {
    title: 'Response Interrupted',
    message: 'The AI response was interrupted.',
    suggestion: 'Try sending your message again.',
  },
  'rate': {
    title: 'Too Many Messages',
    message: 'You\'ve sent too many messages too quickly.',
    suggestion: 'Please wait a moment before trying again.',
  },
  'context': {
    title: 'Context Too Long',
    message: 'The conversation has become too long.',
    suggestion: 'Start a new conversation to continue.',
  },
  'api': {
    title: 'AI Unavailable',
    message: 'Unable to reach the AI service.',
    suggestion: 'Check your connection and try again.',
  },
  'parse': {
    title: 'Message Error',
    message: 'There was an issue with the message format.',
    suggestion: 'Try rephrasing your message.',
  },
  'timeout': {
    title: 'Request Timeout',
    message: 'The AI is taking longer than expected.',
    suggestion: 'Try again with a simpler question.',
  },
}

function getChatErrorMessage(error: Error): { title: string; message: string; suggestion: string } {
  const errorMessage = error.message.toLowerCase()

  for (const [key, value] of Object.entries(chatErrorMessages)) {
    if (errorMessage.includes(key)) {
      return value
    }
  }

  // Check for common HTTP errors
  if (errorMessage.includes('429')) {
    return chatErrorMessages['rate']
  }
  if (errorMessage.includes('503') || errorMessage.includes('502')) {
    return chatErrorMessages['api']
  }
  if (errorMessage.includes('timeout')) {
    return chatErrorMessages['timeout']
  }

  // Default chat error
  return {
    title: 'Chat Error',
    message: 'Something went wrong with the chat.',
    suggestion: 'Try refreshing or starting a new conversation.',
  }
}

export class ChatErrorBoundary extends Component<Props, State> {
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
      component: 'ChatErrorBoundary',
      additionalData: {
        conversationId: this.props.conversationId,
        agentName: this.props.agentName,
        componentStack: errorInfo.componentStack,
      },
    })
  }

  private handleRetry = async () => {
    this.setState({ isRecovering: true })

    await new Promise((resolve) => setTimeout(resolve, 300))

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

  private handleClearChat = () => {
    if (this.props.onClearChat) {
      this.props.onClearChat()
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
      alert('Error report copied to clipboard!')
    }
  }

  public render() {
    const { children, agentName } = this.props
    const { hasError, error, errorInfo, isRecovering } = this.state

    if (!hasError) {
      return children
    }

    const { title, message, suggestion } = error
      ? getChatErrorMessage(error)
      : chatErrorMessages['api']

    return (
      <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-card/50 rounded-xl border border-border p-6">
        {/* Chat Bubble Error Icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-destructive/20 rounded-full flex items-center justify-center">
            <span className="text-destructive text-sm font-bold">!</span>
          </div>
        </div>

        {/* Error Content */}
        <div className="text-center max-w-sm">
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          {agentName && (
            <p className="text-xs text-muted-foreground mb-2">Agent: {agentName}</p>
          )}
          <p className="text-muted-foreground mb-2">{message}</p>
          <p className="text-sm text-primary/70 mb-6">{suggestion}</p>
        </div>

        {/* Dev Details */}
        {import.meta.env.DEV && errorInfo && (
          <details className="mb-6 w-full max-w-md text-left bg-muted/50 rounded-lg p-3">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              Technical Details
            </summary>
            <pre className="mt-2 text-xs overflow-auto max-h-20">
              {error?.message}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-center">
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
              <>
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Again
              </>
            )}
          </Button>

          {this.props.onClearChat && (
            <Button size="sm" variant="outline" onClick={this.handleClearChat}>
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              New Chat
            </Button>
          )}

          {this.props.onSwitchAgent && (
            <Button size="sm" variant="ghost" onClick={this.props.onSwitchAgent}>
              Switch Agent
            </Button>
          )}
        </div>

        {/* Report */}
        <button
          onClick={this.handleReport}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground underline"
        >
          Report issue
        </button>
      </div>
    )
  }
}

export default ChatErrorBoundary

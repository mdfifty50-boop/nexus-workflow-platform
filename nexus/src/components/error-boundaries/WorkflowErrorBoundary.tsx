import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { logError, copyErrorReport } from '@/lib/error-logger'

// =============================================================================
// WORKFLOW ERROR BOUNDARY
// =============================================================================
// Specialized error boundary for workflow visualization components.
// Provides workflow-specific recovery options and friendly messaging.

interface Props {
  children: ReactNode
  workflowId?: string
  workflowName?: string
  onRetry?: () => void
  onGoBack?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isRecovering: boolean
}

// Workflow-specific error messages
const workflowErrorMessages: Record<string, { title: string; message: string; suggestion: string }> = {
  'canvas': {
    title: 'Canvas Error',
    message: 'The workflow canvas encountered an issue.',
    suggestion: 'Try refreshing or opening the workflow in a new tab.',
  },
  'node': {
    title: 'Node Configuration Error',
    message: 'One of the workflow nodes has an invalid configuration.',
    suggestion: 'Check your node settings and try again.',
  },
  'connection': {
    title: 'Connection Error',
    message: 'Failed to load workflow data from the server.',
    suggestion: 'Check your internet connection and reload.',
  },
  'render': {
    title: 'Display Error',
    message: 'Unable to render the workflow visualization.',
    suggestion: 'Try zooming out or simplifying the workflow.',
  },
  'execution': {
    title: 'Execution Error',
    message: 'The workflow execution encountered a problem.',
    suggestion: 'Review the workflow steps and try running again.',
  },
}

function getWorkflowErrorMessage(error: Error): { title: string; message: string; suggestion: string } {
  const errorMessage = error.message.toLowerCase()

  for (const [key, value] of Object.entries(workflowErrorMessages)) {
    if (errorMessage.includes(key)) {
      return value
    }
  }

  // Default workflow error
  return {
    title: 'Workflow Error',
    message: 'Something went wrong with this workflow.',
    suggestion: 'Try refreshing the page or creating a new workflow.',
  }
}

export class WorkflowErrorBoundary extends Component<Props, State> {
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

    logError(error, 'high', {
      component: 'WorkflowErrorBoundary',
      workflowId: this.props.workflowId,
      additionalData: {
        workflowName: this.props.workflowName,
        componentStack: errorInfo.componentStack,
      },
    })
  }

  private handleRetry = async () => {
    this.setState({ isRecovering: true })

    // Small delay for visual feedback
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

  private handleGoBack = () => {
    if (this.props.onGoBack) {
      this.props.onGoBack()
    } else {
      window.history.back()
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReport = async () => {
    const success = await copyErrorReport()
    if (success) {
      alert('Error report copied! Include this when contacting support.')
    }
  }

  public render() {
    const { children, workflowName } = this.props
    const { hasError, error, errorInfo, isRecovering } = this.state

    if (!hasError) {
      return children
    }

    const { title, message, suggestion } = error
      ? getWorkflowErrorMessage(error)
      : workflowErrorMessages['render']

    return (
      <div className="h-full min-h-[400px] flex items-center justify-center bg-slate-950/50 rounded-xl border border-slate-800 p-8">
        <div className="max-w-md text-center">
          {/* Workflow Icon with Error */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-cyan-500/10 rounded-xl flex items-center justify-center">
              <svg
                className="w-10 h-10 text-cyan-500/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          {workflowName && (
            <p className="text-sm text-cyan-400 mb-2">Workflow: {workflowName}</p>
          )}
          <p className="text-slate-400 mb-3">{message}</p>
          <p className="text-sm text-slate-500 mb-6">{suggestion}</p>

          {/* Dev Mode Details */}
          {import.meta.env.DEV && errorInfo && (
            <details className="mb-6 text-left bg-slate-900/50 border border-slate-800 rounded-lg p-3">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs text-slate-600 overflow-auto max-h-24 whitespace-pre-wrap">
                {error?.message}
                {'\n\n'}
                {errorInfo.componentStack}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={this.handleRetry}
              disabled={isRecovering}
              className="bg-cyan-600 hover:bg-cyan-500"
            >
              {isRecovering ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Recovering...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
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

            <Button variant="outline" onClick={this.handleGoBack}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Go Back
            </Button>

            <Button
              variant="ghost"
              onClick={this.handleReload}
              className="text-slate-400 hover:text-slate-300"
            >
              Reload Page
            </Button>
          </div>

          {/* Report Link */}
          <button
            onClick={this.handleReport}
            className="mt-4 text-xs text-slate-500 hover:text-slate-400 underline"
          >
            Report this issue
          </button>
        </div>
      </div>
    )
  }
}

export default WorkflowErrorBoundary

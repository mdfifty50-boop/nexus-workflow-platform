import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorRecoveryProps {
  error: string | Error | null
  onRetry?: () => void | Promise<void>
  onDismiss?: () => void
  type?: 'inline' | 'card' | 'fullscreen'
  context?: string // What action failed
  suggestion?: string // What user can try
  showReport?: boolean
}

// Map technical errors to user-friendly messages
const ERROR_MESSAGES: Record<string, { title: string; message: string; suggestion: string }> = {
  'Failed to fetch': {
    title: 'Connection Lost',
    message: "We couldn't reach our servers.",
    suggestion: 'Check your internet connection and try again.',
  },
  'NetworkError': {
    title: 'Network Error',
    message: "Your device appears to be offline.",
    suggestion: 'Please check your internet connection.',
  },
  '401': {
    title: 'Session Expired',
    message: 'Your login session has expired.',
    suggestion: 'Please sign in again to continue.',
  },
  '403': {
    title: 'Access Denied',
    message: "You don't have permission to do this.",
    suggestion: 'Contact support if you think this is a mistake.',
  },
  '404': {
    title: 'Not Found',
    message: "The item you're looking for doesn't exist.",
    suggestion: 'It may have been moved or deleted.',
  },
  '429': {
    title: 'Too Many Requests',
    message: "You've made too many requests.",
    suggestion: 'Please wait a moment before trying again.',
  },
  '500': {
    title: 'Server Error',
    message: 'Something went wrong on our end.',
    suggestion: "We're working on it. Please try again later.",
  },
  '503': {
    title: 'Service Unavailable',
    message: 'Our servers are temporarily overloaded.',
    suggestion: 'Please try again in a few minutes.',
  },
  'timeout': {
    title: 'Request Timeout',
    message: 'The request took too long to complete.',
    suggestion: 'Check your connection and try again.',
  },
  'quota': {
    title: 'API Limit Reached',
    message: "You've reached your usage limit for this feature.",
    suggestion: 'Upgrade your plan or wait until the limit resets.',
  },
}

function getErrorDetails(error: string | Error | null): { title: string; message: string; suggestion: string } {
  if (!error) {
    return {
      title: 'Something went wrong',
      message: 'An unexpected error occurred.',
      suggestion: 'Please try again.',
    }
  }

  const errorString = error instanceof Error ? error.message : error

  // Check for specific error patterns
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (errorString.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  // Check for HTTP status codes
  const statusMatch = errorString.match(/\b([45]\d{2})\b/)
  if (statusMatch) {
    const status = statusMatch[1]
    if (ERROR_MESSAGES[status]) {
      return ERROR_MESSAGES[status]
    }
  }

  // Default fallback
  return {
    title: 'Something went wrong',
    message: errorString,
    suggestion: 'Please try again or contact support if the problem persists.',
  }
}

export function ErrorRecovery({
  error,
  onRetry,
  onDismiss,
  type = 'card',
  context,
  suggestion: customSuggestion,
  showReport = true,
}: ErrorRecoveryProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const errorDetails = getErrorDetails(error)
  const displaySuggestion = customSuggestion || errorDetails.suggestion

  const handleRetry = useCallback(async () => {
    if (!onRetry) return

    setIsRetrying(true)
    setRetryCount((c) => c + 1)

    try {
      await onRetry()
    } catch {
      // Error handled by parent
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry])

  const handleReport = useCallback(() => {
    // In production, this would send to error tracking service
    const errorLog = {
      error: error instanceof Error ? error.message : error,
      context,
      retryCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    }
    console.log('Error report:', errorLog)
    alert('Thank you! Our team has been notified.')
  }, [error, context, retryCount])

  if (!error) return null

  if (type === 'inline') {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm">
        <span className="text-red-500 flex-shrink-0">!</span>
        <span className="text-red-400 flex-1">{errorDetails.message}</span>
        {onRetry && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRetry}
            disabled={isRetrying}
            className="text-red-400 hover:text-red-300"
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </Button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className="text-red-400/60 hover:text-red-400">
            ×
          </button>
        )}
      </div>
    )
  }

  if (type === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
            <span className="text-4xl">!</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">{errorDetails.title}</h2>
          {context && <p className="text-sm text-muted-foreground mb-2">While: {context}</p>}
          <p className="text-muted-foreground mb-4">{errorDetails.message}</p>
          <p className="text-sm text-primary mb-6">{displaySuggestion}</p>
          <div className="flex flex-col gap-3">
            {onRetry && (
              <Button onClick={handleRetry} disabled={isRetrying} size="lg" className="w-full">
                {isRetrying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Retrying...
                  </>
                ) : (
                  <>Try Again {retryCount > 0 && `(${retryCount})`}</>
                )}
              </Button>
            )}
            {onDismiss && (
              <Button variant="outline" onClick={onDismiss} size="lg" className="w-full">
                Go Back
              </Button>
            )}
            {showReport && (
              <Button variant="ghost" onClick={handleReport} size="sm" className="text-muted-foreground">
                Report this issue
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default: card type
  return (
    <div className="bg-card border border-red-500/20 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl text-red-500">!</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{errorDetails.title}</h3>
          {context && <p className="text-xs text-muted-foreground mb-2">While: {context}</p>}
          <p className="text-muted-foreground mb-3">{errorDetails.message}</p>
          <p className="text-sm text-primary mb-4">{displaySuggestion}</p>
          <div className="flex flex-wrap gap-2">
            {onRetry && (
              <Button size="sm" onClick={handleRetry} disabled={isRetrying}>
                {isRetrying ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <span className="mr-1">↺</span> Try Again {retryCount > 0 && `(${retryCount})`}
                  </>
                )}
              </Button>
            )}
            {onDismiss && (
              <Button variant="outline" size="sm" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
            {showReport && (
              <Button variant="ghost" size="sm" onClick={handleReport} className="text-muted-foreground">
                Report Issue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for managing error state with retry
export function useErrorRecovery<T>(asyncFn: () => Promise<T>) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await asyncFn()
      setData(result)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [asyncFn])

  const retry = useCallback(() => execute(), [execute])

  const dismiss = useCallback(() => setError(null), [])

  return {
    error,
    isLoading,
    data,
    execute,
    retry,
    dismiss,
    setError,
  }
}

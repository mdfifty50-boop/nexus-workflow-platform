/**
 * useAsyncError Hook
 *
 * A comprehensive hook for handling async operations with:
 * - Automatic retry with exponential backoff
 * - Loading and error states
 * - Timeout handling
 * - Cancellation support
 * - Error classification and recovery suggestions
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { APIError } from '@/lib/api-client'
import { logError } from '@/lib/error-logger'
import { matchError, getFriendlyErrorMessage, type LocalizedErrorMessage } from '@/lib/error-messages'

// =============================================================================
// TYPES
// =============================================================================

export interface AsyncState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isRetrying: boolean
  retryCount: number
  lastAttempt: Date | null
}

export interface UseAsyncErrorOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Base delay for exponential backoff in ms (default: 1000) */
  baseDelay?: number
  /** Maximum delay between retries in ms (default: 10000) */
  maxDelay?: number
  /** Request timeout in ms (default: 30000) */
  timeout?: number
  /** Error types that should trigger retry */
  retryOn?: ('network' | 'timeout' | 'server' | 'rate_limit')[]
  /** Callback when error occurs */
  onError?: (error: Error, retryCount: number) => void
  /** Callback when operation succeeds after retry */
  onRetrySuccess?: (retryCount: number) => void
  /** Component name for error logging */
  component?: string
}

export interface UseAsyncErrorReturn<T> {
  /** Current state of the async operation */
  state: AsyncState<T>
  /** Execute the async operation */
  execute: () => Promise<T | null>
  /** Manually retry the operation */
  retry: () => Promise<T | null>
  /** Reset error state */
  reset: () => void
  /** Cancel ongoing operation */
  cancel: () => void
  /** User-friendly error message */
  friendlyError: LocalizedErrorMessage | null
  /** Whether the error is recoverable */
  isRecoverable: boolean
}

// =============================================================================
// DEFAULTS
// =============================================================================

const DEFAULT_OPTIONS: Required<Omit<UseAsyncErrorOptions, 'onError' | 'onRetrySuccess' | 'component'>> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeout: 30000,
  retryOn: ['network', 'timeout', 'server', 'rate_limit'],
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function isRetryableError(error: Error, retryOn: string[]): boolean {
  if (error instanceof APIError) {
    return error.retryable && retryOn.includes(error.errorType)
  }

  // Check error message patterns
  const errorKey = matchError(error)
  const errorLower = error.message.toLowerCase()

  if (errorLower.includes('network') || errorLower.includes('fetch')) {
    return retryOn.includes('network')
  }
  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return retryOn.includes('timeout')
  }
  if (errorLower.includes('500') || errorLower.includes('502') || errorLower.includes('503')) {
    return retryOn.includes('server')
  }
  if (errorLower.includes('429') || errorLower.includes('rate')) {
    return retryOn.includes('rate_limit')
  }

  // Use error catalog for classification
  return errorKey !== 'UNKNOWN_ERROR'
}

function calculateDelay(attempt: number, baseDelay: number, maxDelay: number, error?: Error): number {
  // If rate limited with Retry-After header, use that
  if (error instanceof APIError && error.retryAfter) {
    return Math.min(error.retryAfter, maxDelay)
  }

  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt)
  const jitter = Math.random() * 0.3 * exponentialDelay // 30% jitter
  return Math.min(exponentialDelay + jitter, maxDelay)
}

// =============================================================================
// HOOK
// =============================================================================

export function useAsyncError<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncErrorOptions = {}
): UseAsyncErrorReturn<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isRetrying: false,
    retryCount: 0,
    lastAttempt: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  const execute = useCallback(async (isRetry = false): Promise<T | null> => {
    // Cancel any ongoing request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    if (!isMountedRef.current) return null

    setState((prev) => ({
      ...prev,
      isLoading: true,
      isRetrying: isRetry,
      error: isRetry ? prev.error : null,
    }))

    let lastError: Error | null = null
    const maxAttempts = isRetry ? opts.maxRetries + 1 : opts.maxRetries + 1

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (!isMountedRef.current || abortControllerRef.current?.signal.aborted) {
        return null
      }

      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), opts.timeout)
        })

        // Race between operation and timeout
        const result = await Promise.race([asyncFn(), timeoutPromise])

        if (!isMountedRef.current) return null

        // Success!
        setState({
          data: result,
          error: null,
          isLoading: false,
          isRetrying: false,
          retryCount: attempt,
          lastAttempt: new Date(),
        })

        // Notify success after retry
        if (attempt > 0 && opts.onRetrySuccess) {
          opts.onRetrySuccess(attempt)
        }

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Log the error
        logError(lastError, attempt === 0 ? 'medium' : 'low', {
          component: opts.component || 'useAsyncError',
          action: `attempt_${attempt + 1}`,
          additionalData: { maxAttempts, isRetry },
        })

        // Notify error
        if (opts.onError) {
          opts.onError(lastError, attempt)
        }

        // Check if we should retry
        const shouldRetry = attempt < opts.maxRetries && isRetryableError(lastError, opts.retryOn)

        if (!shouldRetry) {
          break
        }

        // Calculate delay and wait
        const delay = calculateDelay(attempt, opts.baseDelay, opts.maxDelay, lastError)

        if (import.meta.env.DEV) {
          console.log(`[useAsyncError] Retry ${attempt + 1}/${opts.maxRetries} after ${Math.round(delay)}ms`)
        }

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // All attempts failed
    if (isMountedRef.current && lastError) {
      setState({
        data: null,
        error: lastError,
        isLoading: false,
        isRetrying: false,
        retryCount: opts.maxRetries,
        lastAttempt: new Date(),
      })
    }

    return null
  }, [asyncFn, opts])

  const retry = useCallback(() => {
    return execute(true)
  }, [execute])

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    setState({
      data: null,
      error: null,
      isLoading: false,
      isRetrying: false,
      retryCount: 0,
      lastAttempt: null,
    })
  }, [])

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    setState((prev) => ({
      ...prev,
      isLoading: false,
      isRetrying: false,
    }))
  }, [])

  // Get user-friendly error message
  const friendlyError = state.error ? getFriendlyErrorMessage(state.error) : null

  // Determine if error is recoverable
  const isRecoverable = state.error
    ? isRetryableError(state.error, opts.retryOn)
    : false

  return {
    state,
    execute: () => execute(false),
    retry,
    reset,
    cancel,
    friendlyError,
    isRecoverable,
  }
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * Hook for fetching data with automatic loading states
 */
export function useAsyncFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseAsyncErrorOptions & { immediate?: boolean } = {}
) {
  const { immediate = true, ...asyncOptions } = options
  const result = useAsyncError(fetchFn, asyncOptions)

  useEffect(() => {
    if (immediate) {
      result.execute()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate])

  return result
}

/**
 * Hook for mutations (actions that change data)
 */
export function useAsyncMutation<T, Args extends unknown[]>(
  mutationFn: (...args: Args) => Promise<T>,
  options: UseAsyncErrorOptions = {}
) {
  const [args, setArgs] = useState<Args | null>(null)

  const execute = useCallback(async () => {
    if (!args) throw new Error('No arguments provided')
    return mutationFn(...args)
  }, [mutationFn, args])

  const result = useAsyncError(execute, options)

  const mutate = useCallback(async (...mutationArgs: Args) => {
    setArgs(mutationArgs)
    // Wait for state to update then execute
    await new Promise((resolve) => setTimeout(resolve, 0))
    return result.execute()
  }, [result])

  return {
    ...result,
    mutate,
  }
}

export default useAsyncError

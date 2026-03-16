/**
 * Fetch utilities with timeout support
 *
 * Wraps native fetch with AbortController-based timeouts to prevent
 * hanging requests in workflow execution and API calls.
 */

export class FetchTimeoutError extends Error {
  constructor(url: string, timeout: number) {
    super(`Request to ${url} timed out after ${timeout}ms`)
    this.name = 'FetchTimeoutError'
  }
}

/**
 * Fetch wrapper with configurable timeout via AbortController.
 * Default timeout: 30 seconds. Pass `timeout: 0` to disable.
 *
 * If the caller provides their own AbortSignal, it is combined with
 * the timeout signal so either can abort the request.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30_000, ...fetchOptions } = options

  // No timeout requested — pass through to native fetch
  if (timeout <= 0) {
    return fetch(url, fetchOptions)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  // If caller provided a signal, listen for its abort too
  const callerSignal = fetchOptions.signal
  if (callerSignal) {
    if (callerSignal.aborted) {
      clearTimeout(timeoutId)
      controller.abort()
    } else {
      callerSignal.addEventListener('abort', () => controller.abort(), { once: true })
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    return response
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      // Distinguish between caller-abort and timeout-abort
      if (callerSignal?.aborted) {
        throw error // Re-throw caller's abort as-is
      }
      throw new FetchTimeoutError(url, timeout)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

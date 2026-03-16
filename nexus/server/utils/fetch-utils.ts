/**
 * Server-side fetch utilities with timeout support
 *
 * Mirrors src/lib/fetch-utils.ts for the backend (Express server).
 * Wraps native fetch with AbortController-based timeouts.
 */

export class FetchTimeoutError extends Error {
  constructor(url: string, timeout: number) {
    super(`Request to ${url} timed out after ${timeout}ms`)
    this.name = 'FetchTimeoutError'
  }
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30_000, ...fetchOptions } = options

  if (timeout <= 0) {
    return fetch(url, fetchOptions)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

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
      if (callerSignal?.aborted) {
        throw error
      }
      throw new FetchTimeoutError(url, timeout)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

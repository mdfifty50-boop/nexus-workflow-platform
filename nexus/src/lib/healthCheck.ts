/**
 * Health Check Module
 *
 * Simulates health check endpoint functionality for checking
 * API connectivity and reporting app status.
 */

import { supabase, isSupabaseConfigured } from './supabase'

// ============================================================================
// Types
// ============================================================================

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  version?: string
  checks: {
    network: {
      status: 'ok' | 'error' | 'unknown'
      message?: string
    }
    api: {
      status: 'ok' | 'error' | 'unknown'
      latency?: number
      message?: string
    }
    supabase: {
      status: 'ok' | 'error' | 'unknown' | 'not_configured'
      latency?: number
      message?: string
    }
  }
}

export interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'outage'
  lastCheck: number
  responseTime?: number
  error?: string
}

// ============================================================================
// Constants
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || ''
const HEALTH_CHECK_TIMEOUT = 10000 // 10 seconds

// ============================================================================
// Health Check Functions
// ============================================================================

/**
 * Check network connectivity
 */
async function checkNetwork(): Promise<HealthCheckResult['checks']['network']> {
  // Check if browser reports offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      status: 'error',
      message: 'Browser reports offline',
    }
  }

  // Try to ping a reliable endpoint (or use the app's own static resource)
  try {
    const start = performance.now()
    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-store',
    })
    const latency = performance.now() - start

    if (response.ok || response.status === 304) {
      return {
        status: 'ok',
        message: `Network available (${latency.toFixed(0)}ms)`,
      }
    }

    return {
      status: 'error',
      message: `Network check returned status ${response.status}`,
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Network check failed',
    }
  }
}

/**
 * Check API backend connectivity
 */
async function checkAPI(): Promise<HealthCheckResult['checks']['api']> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT)

    const start = performance.now()

    // Try to hit a lightweight endpoint
    // Most Vercel deployments have a health/status endpoint or we can try the base
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    clearTimeout(timeoutId)
    const latency = performance.now() - start

    if (response.ok) {
      return {
        status: 'ok',
        latency,
        message: 'API responding normally',
      }
    }

    // If health endpoint doesn't exist, try another approach
    if (response.status === 404) {
      return {
        status: 'ok',
        latency,
        message: 'API reachable (no health endpoint)',
      }
    }

    return {
      status: 'error',
      latency,
      message: `API returned status ${response.status}`,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: 'error',
        message: 'API request timed out',
      }
    }

    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'API check failed',
    }
  }
}

/**
 * Check Supabase connectivity
 */
async function checkSupabase(): Promise<HealthCheckResult['checks']['supabase']> {
  if (!isSupabaseConfigured()) {
    return {
      status: 'not_configured',
      message: 'Supabase not configured',
    }
  }

  try {
    const start = performance.now()

    // Simple query to check connectivity - just count from a small table
    // Using auth.users count or a simple health check query
    const { error } = await supabase.from('user_profiles').select('id', { count: 'exact', head: true })

    const latency = performance.now() - start

    if (error) {
      // Check if it's a permission error vs connection error
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        // Table doesn't exist, but connection works
        return {
          status: 'ok',
          latency,
          message: 'Supabase connected (schema may need setup)',
        }
      }

      if (error.message.includes('JWT') || error.message.includes('auth')) {
        return {
          status: 'ok',
          latency,
          message: 'Supabase connected (auth required for this query)',
        }
      }

      return {
        status: 'error',
        latency,
        message: error.message,
      }
    }

    return {
      status: 'ok',
      latency,
      message: 'Supabase responding normally',
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Supabase check failed',
    }
  }
}

/**
 * Run all health checks and return aggregated status
 */
export async function healthCheck(): Promise<HealthCheckResult> {
  const [networkResult, apiResult, supabaseResult] = await Promise.all([
    checkNetwork(),
    checkAPI(),
    checkSupabase(),
  ])

  // Determine overall status
  const checks = {
    network: networkResult,
    api: apiResult,
    supabase: supabaseResult,
  }

  let status: HealthCheckResult['status'] = 'healthy'

  // Network failure is critical
  if (networkResult.status === 'error') {
    status = 'unhealthy'
  }
  // API failure is critical
  else if (apiResult.status === 'error') {
    status = 'unhealthy'
  }
  // Supabase issues degrade but don't fail completely
  else if (supabaseResult.status === 'error') {
    status = 'degraded'
  }
  // Not configured is ok (might be local dev)
  else if (supabaseResult.status === 'not_configured') {
    status = 'degraded'
  }

  return {
    status,
    timestamp: Date.now(),
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    checks,
  }
}

/**
 * Get service statuses for display
 */
export async function getServiceStatuses(): Promise<ServiceStatus[]> {
  const result = await healthCheck()

  const services: ServiceStatus[] = [
    {
      name: 'Network',
      status: result.checks.network.status === 'ok' ? 'operational' : 'outage',
      lastCheck: result.timestamp,
      error: result.checks.network.message,
    },
    {
      name: 'API Backend',
      status:
        result.checks.api.status === 'ok'
          ? 'operational'
          : result.checks.api.status === 'unknown'
            ? 'degraded'
            : 'outage',
      lastCheck: result.timestamp,
      responseTime: result.checks.api.latency,
      error: result.checks.api.message,
    },
    {
      name: 'Supabase',
      status:
        result.checks.supabase.status === 'ok'
          ? 'operational'
          : result.checks.supabase.status === 'not_configured'
            ? 'degraded'
            : 'outage',
      lastCheck: result.timestamp,
      responseTime: result.checks.supabase.latency,
      error: result.checks.supabase.message,
    },
  ]

  return services
}

/**
 * Quick connectivity check (network + API only)
 */
export async function quickHealthCheck(): Promise<{
  online: boolean
  apiReachable: boolean
}> {
  const [networkResult, apiResult] = await Promise.all([checkNetwork(), checkAPI()])

  return {
    online: networkResult.status === 'ok',
    apiReachable: apiResult.status === 'ok',
  }
}

/**
 * Check if the app is in a usable state
 */
export async function isAppHealthy(): Promise<boolean> {
  const result = await healthCheck()
  return result.status !== 'unhealthy'
}

// ============================================================================
// Periodic Health Check (for background monitoring)
// ============================================================================

let healthCheckInterval: ReturnType<typeof setInterval> | null = null
let lastHealthResult: HealthCheckResult | null = null

/**
 * Start periodic health checks
 */
export function startPeriodicHealthCheck(intervalMs = 60000): void {
  if (healthCheckInterval) {
    console.warn('[HealthCheck] Periodic check already running')
    return
  }

  // Run immediately
  healthCheck().then((result) => {
    lastHealthResult = result
    console.log('[HealthCheck] Initial check:', result.status)
  })

  // Then run periodically
  healthCheckInterval = setInterval(async () => {
    try {
      lastHealthResult = await healthCheck()

      if (lastHealthResult.status !== 'healthy') {
        console.warn('[HealthCheck] Status:', lastHealthResult.status, lastHealthResult.checks)
      }
    } catch (error) {
      console.error('[HealthCheck] Failed to run health check:', error)
    }
  }, intervalMs)
}

/**
 * Stop periodic health checks
 */
export function stopPeriodicHealthCheck(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
    healthCheckInterval = null
    console.log('[HealthCheck] Periodic check stopped')
  }
}

/**
 * Get the last cached health result
 */
export function getLastHealthResult(): HealthCheckResult | null {
  return lastHealthResult
}

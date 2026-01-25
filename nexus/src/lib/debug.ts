/**
 * Debug Mode Utility
 *
 * Provides a debug mode toggle that enables additional logging,
 * API call details, state changes, and developer utilities.
 * Toggle via localStorage flag 'nexus_debug_mode'.
 */

// =============================================================================
// Types
// =============================================================================

export interface DebugLogEntry {
  timestamp: string
  type: 'log' | 'warn' | 'error' | 'api' | 'state' | 'event' | 'performance'
  category: string
  message: string
  data?: unknown
}

export interface DebugConfig {
  enabled: boolean
  logToConsole: boolean
  logToStorage: boolean
  maxLogEntries: number
  categories: {
    api: boolean
    state: boolean
    events: boolean
    performance: boolean
    renders: boolean
    errors: boolean
  }
}

// =============================================================================
// Constants
// =============================================================================

const DEBUG_STORAGE_KEY = 'nexus_debug_mode'
const DEBUG_LOG_KEY = 'nexus_debug_log'
const DEBUG_CONFIG_KEY = 'nexus_debug_config'
const MAX_LOG_ENTRIES = 500

// =============================================================================
// Debug State
// =============================================================================

let debugEnabled = false
let logEntries: DebugLogEntry[] = []
let config: DebugConfig = {
  enabled: false,
  logToConsole: true,
  logToStorage: true,
  maxLogEntries: MAX_LOG_ENTRIES,
  categories: {
    api: true,
    state: true,
    events: true,
    performance: true,
    renders: true,
    errors: true,
  },
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize debug mode from localStorage
 */
export function initDebugMode(): void {
  if (typeof window === 'undefined') return

  // Check localStorage for debug flag
  const stored = localStorage.getItem(DEBUG_STORAGE_KEY)
  debugEnabled = stored === 'true'

  // Load stored config
  try {
    const storedConfig = localStorage.getItem(DEBUG_CONFIG_KEY)
    if (storedConfig) {
      config = { ...config, ...JSON.parse(storedConfig) }
    }
  } catch {
    // Use defaults
  }

  // Load stored logs
  try {
    const storedLogs = localStorage.getItem(DEBUG_LOG_KEY)
    if (storedLogs) {
      logEntries = JSON.parse(storedLogs)
    }
  } catch {
    logEntries = []
  }

  config.enabled = debugEnabled

  if (debugEnabled) {
    console.log(
      '%c[DEBUG MODE ENABLED]%c Use debug.* methods or window.__nexus_debug__',
      'background: #f59e0b; color: black; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      'color: #f59e0b;'
    )
    exposeGlobalDebugAPI()
  }
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return debugEnabled
}

/**
 * Enable debug mode
 */
export function enableDebug(): void {
  debugEnabled = true
  config.enabled = true
  localStorage.setItem(DEBUG_STORAGE_KEY, 'true')
  exposeGlobalDebugAPI()

  console.log(
    '%c[DEBUG MODE ENABLED]%c Detailed logging is now active',
    'background: #22c55e; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    'color: #22c55e;'
  )
}

/**
 * Disable debug mode
 */
export function disableDebug(): void {
  debugEnabled = false
  config.enabled = false
  localStorage.setItem(DEBUG_STORAGE_KEY, 'false')

  console.log(
    '%c[DEBUG MODE DISABLED]%c Detailed logging is now off',
    'background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    'color: #ef4444;'
  )
}

/**
 * Toggle debug mode
 */
export function toggleDebug(): boolean {
  if (debugEnabled) {
    disableDebug()
  } else {
    enableDebug()
  }
  return debugEnabled
}

// =============================================================================
// Logging Functions
// =============================================================================

/**
 * Log a debug message
 */
export function debugLog(
  type: DebugLogEntry['type'],
  category: string,
  message: string,
  data?: unknown
): void {
  if (!debugEnabled) return

  const entry: DebugLogEntry = {
    timestamp: new Date().toISOString(),
    type,
    category,
    message,
    data,
  }

  // Add to in-memory log
  logEntries.push(entry)
  if (logEntries.length > config.maxLogEntries) {
    logEntries.shift()
  }

  // Console output
  if (config.logToConsole) {
    const styles = getLogStyles(type)
    console.log(
      `%c[${type.toUpperCase()}]%c [${category}] ${message}`,
      styles.badge,
      styles.text,
      data !== undefined ? data : ''
    )
  }

  // Persist to localStorage
  if (config.logToStorage) {
    try {
      localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(logEntries.slice(-100)))
    } catch {
      // Storage full, clear old entries
      logEntries = logEntries.slice(-50)
    }
  }
}

function getLogStyles(type: DebugLogEntry['type']): { badge: string; text: string } {
  const colors: Record<DebugLogEntry['type'], string> = {
    log: '#6b7280',
    warn: '#f59e0b',
    error: '#ef4444',
    api: '#3b82f6',
    state: '#8b5cf6',
    event: '#10b981',
    performance: '#ec4899',
  }

  return {
    badge: `background: ${colors[type]}; color: white; padding: 1px 4px; border-radius: 2px; font-size: 11px;`,
    text: `color: ${colors[type]};`,
  }
}

// =============================================================================
// Specialized Loggers
// =============================================================================

/**
 * Log API calls
 */
export function debugAPI(
  method: string,
  endpoint: string,
  data?: { request?: unknown; response?: unknown; duration?: number; status?: number }
): void {
  if (!config.categories.api) return

  debugLog('api', 'API', `${method} ${endpoint}`, {
    ...data,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Log state changes
 */
export function debugState(
  source: string,
  action: string,
  data?: { prev?: unknown; next?: unknown }
): void {
  if (!config.categories.state) return

  debugLog('state', source, action, data)
}

/**
 * Log events
 */
export function debugEvent(
  eventName: string,
  source: string,
  data?: unknown
): void {
  if (!config.categories.events) return

  debugLog('event', source, eventName, data)
}

/**
 * Log performance metrics
 */
export function debugPerformance(
  metric: string,
  value: number,
  unit: string = 'ms',
  context?: Record<string, unknown>
): void {
  if (!config.categories.performance) return

  debugLog('performance', 'Performance', `${metric}: ${value}${unit}`, context)
}

/**
 * Log component renders
 */
export function debugRender(
  component: string,
  reason?: string,
  props?: Record<string, unknown>
): void {
  if (!config.categories.renders) return

  debugLog('log', 'Render', `${component}${reason ? ` (${reason})` : ''}`, props)
}

/**
 * Log errors
 */
export function debugError(
  error: Error | string,
  context?: Record<string, unknown>
): void {
  if (!config.categories.errors) return

  const errorObj = error instanceof Error ? error : new Error(error)
  debugLog('error', 'Error', errorObj.message, {
    name: errorObj.name,
    stack: errorObj.stack,
    ...context,
  })
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Update debug configuration
 */
export function setDebugConfig(newConfig: Partial<DebugConfig>): void {
  config = { ...config, ...newConfig }

  if (newConfig.categories) {
    config.categories = { ...config.categories, ...newConfig.categories }
  }

  try {
    localStorage.setItem(DEBUG_CONFIG_KEY, JSON.stringify(config))
  } catch {
    // Storage unavailable
  }
}

/**
 * Get current debug configuration
 */
export function getDebugConfig(): DebugConfig {
  return { ...config }
}

/**
 * Enable/disable specific category
 */
export function setCategory(
  category: keyof DebugConfig['categories'],
  enabled: boolean
): void {
  config.categories[category] = enabled
  localStorage.setItem(DEBUG_CONFIG_KEY, JSON.stringify(config))
}

// =============================================================================
// Log Management
// =============================================================================

/**
 * Get all debug logs
 */
export function getDebugLogs(): DebugLogEntry[] {
  return [...logEntries]
}

/**
 * Get logs filtered by type
 */
export function getLogsByType(type: DebugLogEntry['type']): DebugLogEntry[] {
  return logEntries.filter((entry) => entry.type === type)
}

/**
 * Get logs filtered by category
 */
export function getLogsByCategory(category: string): DebugLogEntry[] {
  return logEntries.filter((entry) => entry.category === category)
}

/**
 * Clear all debug logs
 */
export function clearDebugLogs(): void {
  logEntries = []
  localStorage.removeItem(DEBUG_LOG_KEY)
  console.log('[Debug] Logs cleared')
}

/**
 * Export debug logs as JSON
 */
export function exportDebugLogs(): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      config,
      logs: logEntries,
    },
    null,
    2
  )
}

/**
 * Copy debug logs to clipboard
 */
export async function copyDebugLogs(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(exportDebugLogs())
    console.log('[Debug] Logs copied to clipboard')
    return true
  } catch {
    console.error('[Debug] Failed to copy logs to clipboard')
    return false
  }
}

// =============================================================================
// Development Utilities
// =============================================================================

/**
 * Create a debug group in console
 */
export function debugGroup(label: string, fn: () => void): void {
  if (!debugEnabled) {
    fn()
    return
  }

  console.group(`[Debug] ${label}`)
  fn()
  console.groupEnd()
}

/**
 * Time an operation
 */
export function debugTime<T>(label: string, fn: () => T): T {
  if (!debugEnabled) return fn()

  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start

  debugPerformance(label, duration)
  return result
}

/**
 * Time an async operation
 */
export async function debugTimeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!debugEnabled) return fn()

  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start

  debugPerformance(label, duration)
  return result
}

/**
 * Assert a condition in debug mode
 */
export function debugAssert(condition: boolean, message: string): void {
  if (!debugEnabled) return

  if (!condition) {
    debugError(new Error(`Assertion failed: ${message}`))
  }
}

/**
 * Log a table in console
 */
export function debugTable(data: unknown[], columns?: string[]): void {
  if (!debugEnabled || !config.logToConsole) return

  if (columns) {
    console.table(data, columns)
  } else {
    console.table(data)
  }
}

// =============================================================================
// Global API
// =============================================================================

interface NexusDebugAPI {
  enabled: boolean
  enable: () => void
  disable: () => void
  toggle: () => boolean
  config: () => DebugConfig
  setConfig: (config: Partial<DebugConfig>) => void
  logs: () => DebugLogEntry[]
  clearLogs: () => void
  exportLogs: () => string
  copyLogs: () => Promise<boolean>
  api: typeof debugAPI
  state: typeof debugState
  event: typeof debugEvent
  perf: typeof debugPerformance
  error: typeof debugError
}

/**
 * Expose debug API on window for console access
 */
function exposeGlobalDebugAPI(): void {
  if (typeof window === 'undefined') return

  const api: NexusDebugAPI = {
    get enabled() {
      return debugEnabled
    },
    enable: enableDebug,
    disable: disableDebug,
    toggle: toggleDebug,
    config: getDebugConfig,
    setConfig: setDebugConfig,
    logs: getDebugLogs,
    clearLogs: clearDebugLogs,
    exportLogs: exportDebugLogs,
    copyLogs: copyDebugLogs,
    api: debugAPI,
    state: debugState,
    event: debugEvent,
    perf: debugPerformance,
    error: debugError,
  }

  // Extend the Window interface
  ;(window as unknown as { __nexus_debug__: NexusDebugAPI }).__nexus_debug__ = api
}

// =============================================================================
// React Hook
// =============================================================================

import { useCallback, useEffect, useRef } from 'react'

/**
 * React hook for debug logging
 */
export function useDebug(componentName: string) {
  const renderCount = useRef(0)
  const prevProps = useRef<Record<string, unknown>>({})

  useEffect(() => {
    renderCount.current++
    if (debugEnabled) {
      debugRender(componentName, `render #${renderCount.current}`)
    }
  })

  const logStateChange = useCallback(
    (stateName: string, prev: unknown, next: unknown) => {
      debugState(componentName, `${stateName} changed`, { prev, next })
    },
    [componentName]
  )

  const logEffect = useCallback(
    (effectName: string, deps?: unknown[]) => {
      debugLog('log', componentName, `Effect: ${effectName}`, { deps })
    },
    [componentName]
  )

  const logEvent = useCallback(
    (eventName: string, data?: unknown) => {
      debugEvent(eventName, componentName, data)
    },
    [componentName]
  )

  const trackPropChanges = useCallback(
    (props: Record<string, unknown>) => {
      if (!debugEnabled) return

      const changes: Record<string, { prev: unknown; next: unknown }> = {}

      Object.keys(props).forEach((key) => {
        if (prevProps.current[key] !== props[key]) {
          changes[key] = {
            prev: prevProps.current[key],
            next: props[key],
          }
        }
      })

      if (Object.keys(changes).length > 0) {
        debugLog('log', componentName, 'Props changed', changes)
      }

      prevProps.current = { ...props }
    },
    [componentName]
  )

  return {
    isDebugEnabled: debugEnabled,
    renderCount: renderCount.current,
    logStateChange,
    logEffect,
    logEvent,
    trackPropChanges,
    log: (message: string, data?: unknown) => debugLog('log', componentName, message, data),
    warn: (message: string, data?: unknown) => debugLog('warn', componentName, message, data),
    error: (error: Error | string, context?: Record<string, unknown>) => debugError(error, { component: componentName, ...context }),
  }
}

// =============================================================================
// Auto-initialization
// =============================================================================

// Initialize on module load
if (typeof window !== 'undefined') {
  initDebugMode()
}

// =============================================================================
// Exports
// =============================================================================

export const debug = {
  init: initDebugMode,
  isEnabled: isDebugEnabled,
  enable: enableDebug,
  disable: disableDebug,
  toggle: toggleDebug,
  log: debugLog,
  api: debugAPI,
  state: debugState,
  event: debugEvent,
  performance: debugPerformance,
  render: debugRender,
  error: debugError,
  setConfig: setDebugConfig,
  getConfig: getDebugConfig,
  setCategory,
  getLogs: getDebugLogs,
  getLogsByType,
  getLogsByCategory,
  clearLogs: clearDebugLogs,
  exportLogs: exportDebugLogs,
  copyLogs: copyDebugLogs,
  group: debugGroup,
  time: debugTime,
  timeAsync: debugTimeAsync,
  assert: debugAssert,
  table: debugTable,
}

export default debug

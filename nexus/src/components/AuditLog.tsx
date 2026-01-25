import { useState, useEffect, useCallback } from 'react'

// Audit log entry types
export type AuditAction =
  | 'login'
  | 'logout'
  | 'session_extended'
  | 'workflow_created'
  | 'workflow_updated'
  | 'workflow_deleted'
  | 'workflow_executed'
  | 'workflow_started'
  | 'workflow_completed'
  | 'workflow_failed'
  | 'settings_changed'
  | 'integration_connected'
  | 'integration_disconnected'
  | 'template_used'
  | 'api_call'
  | 'error'

export interface AuditLogEntry {
  id: string
  timestamp: string
  action: AuditAction
  description: string
  metadata?: Record<string, unknown>
  userId?: string
  ipAddress?: string
  userAgent?: string
}

// Storage key for local audit log
const AUDIT_LOG_KEY = 'nexus_audit_log'
const MAX_ENTRIES = 500 // Maximum entries to store locally

/**
 * Generate a unique ID for audit entries
 */
function generateId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Get current audit log from local storage
 */
function getAuditLog(): AuditLogEntry[] {
  try {
    const stored = localStorage.getItem(AUDIT_LOG_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to read audit log:', error)
  }
  return []
}

/**
 * Save audit log to local storage
 */
function saveAuditLog(entries: AuditLogEntry[]): void {
  try {
    // Trim to max entries, keeping most recent
    const trimmed = entries.slice(-MAX_ENTRIES)
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error('Failed to save audit log:', error)
  }
}

/**
 * Add entry to audit log
 */
export function logAuditEvent(
  action: AuditAction,
  description: string,
  metadata?: Record<string, unknown>
): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    action,
    description,
    metadata,
    userAgent: navigator.userAgent,
  }

  const log = getAuditLog()
  log.push(entry)
  saveAuditLog(log)

  // Dispatch custom event for real-time updates
  window.dispatchEvent(new CustomEvent('audit-log-update', { detail: entry }))

  return entry
}

/**
 * Clear all audit log entries
 */
export function clearAuditLog(): void {
  try {
    localStorage.removeItem(AUDIT_LOG_KEY)
    window.dispatchEvent(new CustomEvent('audit-log-update'))
  } catch (error) {
    console.error('Failed to clear audit log:', error)
  }
}

/**
 * Export audit log as JSON
 */
export function exportAuditLog(): string {
  const log = getAuditLog()
  return JSON.stringify(log, null, 2)
}

// Action icons and colors
const actionConfig: Record<
  AuditAction,
  { icon: string; color: string; bgColor: string }
> = {
  login: { icon: '🔓', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  logout: { icon: '🔒', color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
  session_extended: { icon: '⏰', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  workflow_created: { icon: '✨', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  workflow_updated: { icon: '📝', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  workflow_deleted: { icon: '🗑️', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  workflow_executed: { icon: '▶️', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  workflow_started: { icon: '🚀', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  workflow_completed: { icon: '✅', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  workflow_failed: { icon: '❌', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  settings_changed: { icon: '⚙️', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  integration_connected: { icon: '🔗', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  integration_disconnected: { icon: '🔌', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  template_used: { icon: '📋', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  api_call: { icon: '🌐', color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
  error: { icon: '⚠️', color: 'text-red-400', bgColor: 'bg-red-500/20' },
}

interface AuditLogProps {
  /** Maximum entries to display (default: 50) */
  maxDisplay?: number
  /** Filter by action types */
  filterActions?: AuditAction[]
  /** Show full details */
  expanded?: boolean
  /** Custom CSS class */
  className?: string
}

/**
 * Audit Log Component
 * Displays recent user actions and events
 */
export function AuditLog({
  maxDisplay = 50,
  filterActions,
  expanded = false,
  className = '',
}: AuditLogProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Load and subscribe to updates
  useEffect(() => {
    const loadEntries = () => {
      let log = getAuditLog()

      // Apply filter if specified
      if (filterActions && filterActions.length > 0) {
        log = log.filter((entry) => filterActions.includes(entry.action))
      }

      // Sort by timestamp descending (most recent first)
      log.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // Limit display
      setEntries(log.slice(0, maxDisplay))
    }

    loadEntries()

    // Listen for updates
    const handleUpdate = () => loadEntries()
    window.addEventListener('audit-log-update', handleUpdate)

    return () => {
      window.removeEventListener('audit-log-update', handleUpdate)
    }
  }, [maxDisplay, filterActions])

  // Format timestamp
  const formatTime = useCallback((timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  // Handle export
  const handleExport = useCallback((format: 'json' | 'csv') => {
    const log = getAuditLog()

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // CSV export
      const headers = ['Timestamp', 'Action', 'Description']
      const rows = log.map((entry) => [
        entry.timestamp,
        entry.action,
        `"${entry.description.replace(/"/g, '""')}"`,
      ])
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }

    setShowExportMenu(false)
  }, [])

  // Handle clear with confirmation
  const handleClear = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the audit log? This cannot be undone.')) {
      clearAuditLog()
      setEntries([])
    }
  }, [])

  return (
    <div className={`bg-slate-800/50 rounded-xl border border-slate-700/50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <h3 className="font-semibold text-white">Activity Log</h3>
          <span className="text-xs text-slate-500">({entries.length} events)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Export menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
              title="Export log"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-slate-700 rounded-lg shadow-xl z-10 py-1">
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-600"
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-600"
                >
                  Export as CSV
                </button>
              </div>
            )}
          </div>

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-red-400"
            title="Clear log"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div className="max-h-96 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p>No activity recorded yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-700/50">
            {entries.map((entry) => {
              const config = actionConfig[entry.action]
              return (
                <li
                  key={entry.id}
                  onClick={() => setSelectedEntry(expanded ? entry : null)}
                  className={`px-4 py-3 hover:bg-slate-700/30 transition-colors ${
                    expanded ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-sm">{config.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-medium ${config.color}`}>
                          {entry.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 truncate">{entry.description}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Entry detail modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h4 className="font-semibold text-white">Event Details</h4>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Action</span>
                <p className={`font-medium ${actionConfig[selectedEntry.action].color}`}>
                  {selectedEntry.action.replace(/_/g, ' ')}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Description</span>
                <p className="text-slate-200">{selectedEntry.description}</p>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Timestamp</span>
                <p className="text-slate-200">
                  {new Date(selectedEntry.timestamp).toLocaleString()}
                </p>
              </div>

              {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Metadata</span>
                  <pre className="mt-1 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-300 overflow-auto max-h-48">
                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="text-xs text-slate-500">
                <p>ID: {selectedEntry.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLog

/**
 * Execution Logs Dashboard Component
 *
 * Comprehensive UI for viewing, filtering, and exporting workflow execution logs.
 * Integrates with the monitoring module's ExecutionLogManager for Supabase storage.
 *
 * Features:
 * - Real-time log streaming with auto-refresh
 * - Advanced filtering (level, category, workflow, date range)
 * - Search functionality across log messages
 * - Export to JSON/CSV
 * - Log statistics overview
 * - Arabic language support
 *
 * @module components/ExecutionLogs
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  executionLogManager,
  type ExecutionLogEntry,
  type ExecutionLogQuery,
  type ExecutionLogStats,
  type LogLevel,
} from '../lib/monitoring'

// ============================================================================
// Types
// ============================================================================

interface ExecutionLogsProps {
  /** User ID to filter logs by */
  userId?: string
  /** Workflow ID to filter logs by */
  workflowId?: string
  /** Execution ID to filter logs by */
  executionId?: string
  /** Maximum entries to display per page */
  pageSize?: number
  /** Auto-refresh interval in ms (0 to disable) */
  autoRefreshInterval?: number
  /** Show statistics panel */
  showStats?: boolean
  /** Custom CSS class */
  className?: string
}

interface FilterState {
  levels: LogLevel[]
  categories: string[]
  search: string
  startDate: string
  endDate: string
  hasError: boolean | undefined
}

// ============================================================================
// Constants
// ============================================================================

const LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error']

const LEVEL_CONFIG: Record<LogLevel, { color: string; bgColor: string; icon: string }> = {
  debug: { color: 'text-slate-400', bgColor: 'bg-slate-500/20', icon: 'bug' },
  info: { color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: 'info' },
  warn: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: 'warning' },
  error: { color: 'text-red-400', bgColor: 'bg-red-500/20', icon: 'error' },
}

const CATEGORY_COLORS: Record<string, string> = {
  orchestrator: 'text-purple-400',
  composio: 'text-cyan-400',
  exception: 'text-orange-400',
  workflow: 'text-green-400',
  api: 'text-blue-400',
  auth: 'text-pink-400',
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTimestamp(timestamp: string): string {
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
}

function formatDuration(ms?: number): string {
  if (ms === undefined || ms === null) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function getLevelIcon(level: LogLevel): React.ReactNode {
  switch (level) {
    case 'debug':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    case 'info':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'warn':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    case 'error':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
  }
}

// ============================================================================
// Sub-components
// ============================================================================

interface LogEntryRowProps {
  log: ExecutionLogEntry
  expanded: boolean
  onToggle: () => void
}

function LogEntryRow({ log, expanded, onToggle }: LogEntryRowProps) {
  const levelConfig = LEVEL_CONFIG[log.level]
  const categoryColor = CATEGORY_COLORS[log.category] || 'text-slate-400'

  return (
    <div
      className={`border-b border-slate-700/50 transition-colors ${
        expanded ? 'bg-slate-700/30' : 'hover:bg-slate-700/20'
      }`}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={onToggle}
      >
        {/* Level icon */}
        <div className={`w-8 h-8 rounded-lg ${levelConfig.bgColor} flex items-center justify-center flex-shrink-0 ${levelConfig.color}`}>
          {getLevelIcon(log.level)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium uppercase ${levelConfig.color}`}>
              {log.level}
            </span>
            <span className={`text-xs ${categoryColor}`}>
              [{log.category}]
            </span>
            {log.workflowId && (
              <span className="text-xs text-slate-500">
                WF: {log.workflowId.substring(0, 8)}...
              </span>
            )}
            {log.stepId && (
              <span className="text-xs text-slate-500">
                Step: {log.stepId.substring(0, 8)}...
              </span>
            )}
          </div>
          <p className="text-sm text-slate-200 truncate mt-0.5">{log.message}</p>
          {log.messageAr && (
            <p className="text-xs text-slate-400 truncate mt-0.5" dir="rtl">
              {log.messageAr}
            </p>
          )}
        </div>

        {/* Duration & Time */}
        <div className="text-right flex-shrink-0">
          {log.durationMs !== undefined && (
            <span className="text-xs text-slate-500 block">
              {formatDuration(log.durationMs)}
            </span>
          )}
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {formatTimestamp(log.createdAt)}
          </span>
        </div>

        {/* Expand icon */}
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pl-14 space-y-3">
          {/* Error details */}
          {log.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium text-red-400">{log.error.name}</span>
                {log.error.code && (
                  <span className="text-xs text-red-300 bg-red-500/20 px-2 py-0.5 rounded">
                    {log.error.code}
                  </span>
                )}
              </div>
              <p className="text-sm text-red-200">{log.error.message}</p>
              {log.error.stack && (
                <pre className="mt-2 p-2 bg-slate-900/50 rounded text-xs text-red-200 overflow-x-auto max-h-32 overflow-y-auto">
                  {log.error.stack}
                </pre>
              )}
            </div>
          )}

          {/* Context */}
          {Object.keys(log.context).length > 0 && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Context</span>
              <pre className="mt-1 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-300 overflow-auto max-h-48">
                {JSON.stringify(log.context, null, 2)}
              </pre>
            </div>
          )}

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Metadata</span>
              <pre className="mt-1 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-300 overflow-auto max-h-48">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Tags */}
          {log.tags && log.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Tags:</span>
              {log.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* IDs */}
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <span>ID: {log.id}</span>
            {log.userId && <span>User: {log.userId}</span>}
            {log.projectId && <span>Project: {log.projectId}</span>}
            {log.executionId && <span>Execution: {log.executionId}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

interface StatsOverviewProps {
  stats: ExecutionLogStats | null
  loading: boolean
}

function StatsOverview({ stats, loading }: StatsOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-800/50 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-20 mb-2" />
            <div className="h-8 bg-slate-700 rounded w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Logs</div>
        <div className="text-2xl font-bold text-white">{stats.totalLogs.toLocaleString()}</div>
      </div>
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Errors</div>
        <div className="text-2xl font-bold text-red-400">{stats.errorCount.toLocaleString()}</div>
      </div>
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Last Hour</div>
        <div className="text-2xl font-bold text-blue-400">{stats.lastHourCount.toLocaleString()}</div>
      </div>
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Avg/Hour</div>
        <div className="text-2xl font-bold text-green-400">{stats.avgLogsPerHour.toFixed(1)}</div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ExecutionLogs({
  userId,
  workflowId,
  executionId,
  pageSize = 50,
  autoRefreshInterval = 30000,
  showStats = true,
  className = '',
}: ExecutionLogsProps) {
  // State
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([])
  const [stats, setStats] = useState<ExecutionLogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(autoRefreshInterval > 0)

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    levels: [],
    categories: [],
    search: '',
    startDate: '',
    endDate: '',
    hasError: undefined,
  })

  // Build query from filters
  const buildQuery = useCallback((): ExecutionLogQuery => {
    const query: ExecutionLogQuery = {
      userId,
      workflowId,
      executionId,
      offset,
      limit: pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }

    if (filters.levels.length > 0) query.levels = filters.levels
    if (filters.categories.length > 0) query.categories = filters.categories
    if (filters.search) query.search = filters.search
    if (filters.startDate) query.startDate = filters.startDate
    if (filters.endDate) query.endDate = filters.endDate
    if (filters.hasError !== undefined) query.hasError = filters.hasError

    return query
  }, [userId, workflowId, executionId, offset, pageSize, filters])

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const query = buildQuery()
      const result = await executionLogManager.queryLogs(query)
      setLogs(result.logs)
      setTotal(result.total)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }, [buildQuery])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!showStats) return

    try {
      const result = await executionLogManager.getStats(userId, workflowId)
      setStats(result)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [userId, workflowId, showStats])

  // Initial load
  useEffect(() => {
    setLoading(true)
    setStatsLoading(true)
    fetchLogs()
    fetchStats()
  }, [fetchLogs, fetchStats])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || autoRefreshInterval <= 0) return

    const interval = setInterval(() => {
      fetchLogs()
      fetchStats()
    }, autoRefreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, autoRefreshInterval, fetchLogs, fetchStats])

  // Handle export
  const handleExport = useCallback(async (format: 'json' | 'csv') => {
    try {
      const query = buildQuery()
      query.limit = 10000 // Export up to 10k logs
      query.offset = 0

      const content = await executionLogManager.exportLogs(query, {
        format,
        includeMetadata: true,
        includeContext: true,
        includeStackTraces: format === 'json',
      })

      const blob = new Blob([content], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `execution-logs-${new Date().toISOString().split('T')[0]}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export logs:', error)
    }

    setShowExportMenu(false)
  }, [buildQuery])

  // Handle pagination
  const handleNextPage = useCallback(() => {
    if (hasMore) {
      setOffset((prev) => prev + pageSize)
      setLoading(true)
    }
  }, [hasMore, pageSize])

  const handlePrevPage = useCallback(() => {
    if (offset > 0) {
      setOffset((prev) => Math.max(0, prev - pageSize))
      setLoading(true)
    }
  }, [offset, pageSize])

  // Handle filter changes
  const handleLevelToggle = useCallback((level: LogLevel) => {
    setFilters((prev) => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter((l) => l !== level)
        : [...prev.levels, level],
    }))
    setOffset(0)
    setLoading(true)
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({
      levels: [],
      categories: [],
      search: '',
      startDate: '',
      endDate: '',
      hasError: undefined,
    })
    setOffset(0)
    setLoading(true)
  }, [])

  // Memoized filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.levels.length > 0) count++
    if (filters.categories.length > 0) count++
    if (filters.search) count++
    if (filters.startDate || filters.endDate) count++
    if (filters.hasError !== undefined) count++
    return count
  }, [filters])

  return (
    <div className={`bg-slate-800/50 rounded-xl border border-slate-700/50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="font-semibold text-white">Execution Logs</h3>
          <span className="text-xs text-slate-500">({total.toLocaleString()} entries)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg transition-colors ${
              autoRefresh
                ? 'bg-green-500/20 text-green-400'
                : 'hover:bg-slate-700/50 text-slate-400'
            }`}
            title={autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Refresh button */}
          <button
            onClick={() => {
              setLoading(true)
              fetchLogs()
              fetchStats()
            }}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors relative ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-500/20 text-blue-400'
                : 'hover:bg-slate-700/50 text-slate-400'
            }`}
            title="Filters"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Export menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
              title="Export logs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/30">
          <div className="flex flex-wrap items-center gap-4">
            {/* Level filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Level:</span>
              {LOG_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelToggle(level)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    filters.levels.includes(level)
                      ? `${LEVEL_CONFIG[level].bgColor} ${LEVEL_CONFIG[level].color}`
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 min-w-48">
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                  setOffset(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setLoading(true)
                    fetchLogs()
                  }
                }}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Error filter */}
            <button
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  hasError: prev.hasError === true ? undefined : true,
                }))
                setOffset(0)
                setLoading(true)
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filters.hasError === true
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
              }`}
            >
              Errors Only
            </button>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      {showStats && (
        <div className="px-4 pt-4">
          <StatsOverview stats={stats} loading={statsLoading} />
        </div>
      )}

      {/* Log entries */}
      <div className="max-h-[600px] overflow-y-auto">
        {loading && logs.length === 0 ? (
          <div className="py-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-slate-600 border-t-blue-400 rounded-full mx-auto mb-4" />
            <p className="text-slate-500">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No logs found</p>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          logs.map((log) => (
            <LogEntryRow
              key={log.id}
              log={log}
              expanded={expandedLogId === log.id}
              onToggle={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {(offset > 0 || hasMore) && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
          <button
            onClick={handlePrevPage}
            disabled={offset === 0}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              offset === 0
                ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            Previous
          </button>

          <span className="text-sm text-slate-500">
            Showing {offset + 1} - {Math.min(offset + pageSize, total)} of {total.toLocaleString()}
          </span>

          <button
            onClick={handleNextPage}
            disabled={!hasMore}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              !hasMore
                ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default ExecutionLogs

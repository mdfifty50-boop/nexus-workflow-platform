import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'

// =============================================================================
// TYPES
// =============================================================================

interface AuditLogEntry {
  id: string
  timestamp: string
  user: {
    id: string
    name: string
    email: string
  }
  action: AuditAction
  resource: string
  resourceId: string
  details: string
  ipAddress: string
  userAgent: string
  status: 'success' | 'failure' | 'warning'
}

type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.signup'
  | 'user.password_change'
  | 'user.mfa_enable'
  | 'user.mfa_disable'
  | 'workflow.create'
  | 'workflow.update'
  | 'workflow.delete'
  | 'workflow.execute'
  | 'workflow.publish'
  | 'api_key.create'
  | 'api_key.revoke'
  | 'settings.update'
  | 'admin.user_create'
  | 'admin.user_delete'
  | 'admin.role_change'
  | 'integration.connect'
  | 'integration.disconnect'

// =============================================================================
// ADMIN AUDIT LOG COMPONENT
// =============================================================================

export function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'all'>('7d')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 10

  // Fetch audit logs from API
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin-analytics/audit-log?limit=500')
      const result = await response.json()

      if (result.success && result.data) {
        // Transform API response to match component's expected format
        const transformedLogs: AuditLogEntry[] = result.data.map((entry: {
          id: string
          timestamp: string
          user_id: string
          user_name: string | null
          user_email: string | null
          action: string
          resource: string
          resource_id: string | null
          details: string | null
          ip_address: string | null
          user_agent: string | null
          status: 'success' | 'failure' | 'warning'
        }) => ({
          id: entry.id,
          timestamp: entry.timestamp,
          user: {
            id: entry.user_id,
            name: entry.user_name || 'Unknown',
            email: entry.user_email || '',
          },
          action: entry.action as AuditAction,
          resource: entry.resource,
          resourceId: entry.resource_id || '',
          details: entry.details || '',
          ipAddress: entry.ip_address || '',
          userAgent: entry.user_agent || '',
          status: entry.status,
        }))
        setLogs(transformedLogs)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      // Set empty logs on error
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Get unique users and actions for filters
  const uniqueUsers = useMemo(() => {
    const users = new Map<string, { id: string; name: string; email: string }>()
    logs.forEach(log => users.set(log.user.id, log.user))
    return Array.from(users.values())
  }, [logs])

  const actionCategories = {
    'User Actions': ['user.login', 'user.logout', 'user.signup', 'user.password_change', 'user.mfa_enable', 'user.mfa_disable'],
    'Workflow Actions': ['workflow.create', 'workflow.update', 'workflow.delete', 'workflow.execute', 'workflow.publish'],
    'Admin Actions': ['admin.user_create', 'admin.user_delete', 'admin.role_change', 'settings.update'],
    'Integration Actions': ['integration.connect', 'integration.disconnect', 'api_key.create', 'api_key.revoke'],
  }

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search filter
      const matchesSearch =
        log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase())

      // User filter
      const matchesUser = userFilter === 'all' || log.user.id === userFilter

      // Action filter
      const matchesAction = actionFilter === 'all' || log.action === actionFilter

      // Status filter
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter

      // Date range filter
      let matchesDate = true
      const logDate = new Date(log.timestamp)
      const now = new Date()
      if (dateRange === 'today') {
        matchesDate = logDate.toDateString() === now.toDateString()
      } else if (dateRange === '7d') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesDate = logDate >= weekAgo
      } else if (dateRange === '30d') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchesDate = logDate >= monthAgo
      }

      return matchesSearch && matchesUser && matchesAction && matchesStatus && matchesDate
    })
  }, [logs, searchQuery, userFilter, actionFilter, statusFilter, dateRange])

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  )

  const getActionIcon = (action: AuditAction) => {
    if (action.startsWith('user.')) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
    if (action.startsWith('workflow.')) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      )
    }
    if (action.startsWith('admin.') || action.startsWith('settings.')) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-500/10'
      case 'failure': return 'text-red-400 bg-red-500/10'
      case 'warning': return 'text-yellow-400 bg-yellow-500/10'
      default: return 'text-slate-400 bg-slate-500/10'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Email', 'Action', 'Details', 'Status', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.user.name,
        log.user.email,
        log.action,
        `"${log.details}"`,
        log.status,
        log.ipAddress,
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading audit logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Audit Log</h2>
        <Button onClick={handleExport} variant="outline">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
          />
        </div>

        {/* User Filter */}
        <select
          value={userFilter}
          onChange={(e) => {
            setUserFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <option value="all">All Users</option>
          {uniqueUsers.map(user => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>

        {/* Action Filter */}
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <option value="all">All Actions</option>
          {Object.entries(actionCategories).map(([category, actions]) => (
            <optgroup key={category} label={category}>
              {actions.map(action => (
                <option key={action} value={action}>
                  {action.replace('.', ' - ').replace(/_/g, ' ')}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="warning">Warning</option>
        </select>

        {/* Date Range */}
        <select
          value={dateRange}
          onChange={(e) => {
            setDateRange(e.target.value as typeof dateRange)
            setCurrentPage(1)
          }}
          className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-slate-400">
        Showing {paginatedLogs.length} of {filteredLogs.length} log entries
      </div>

      {/* Log Entries */}
      <div className="space-y-2">
        {paginatedLogs.map(log => (
          <div
            key={log.id}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden transition-all hover:border-slate-600"
          >
            <button
              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              className="w-full px-4 py-3 flex items-center gap-4 text-left"
            >
              {/* Icon */}
              <div className={`p-2 rounded-lg ${
                log.status === 'success' ? 'bg-green-500/10 text-green-400' :
                log.status === 'failure' ? 'bg-red-500/10 text-red-400' :
                'bg-yellow-500/10 text-yellow-400'
              }`}>
                {getActionIcon(log.action)}
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-medium text-white truncate">{log.user.name}</span>
                  <span className="text-sm text-slate-400">{log.action.replace('.', ' - ').replace(/_/g, ' ')}</span>
                </div>
                <p className="text-sm text-slate-400 truncate">{log.details}</p>
              </div>

              {/* Status & Time */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                  {log.status}
                </span>
                <span className="text-sm text-slate-500 whitespace-nowrap">
                  {formatTimestamp(log.timestamp)}
                </span>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform ${expandedLog === log.id ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedLog === log.id && (
              <div className="px-4 pb-4 border-t border-slate-700/50 pt-3">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">User Email:</span>
                    <span className="ml-2 text-slate-300">{log.user.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Resource ID:</span>
                    <code className="ml-2 text-slate-300 bg-slate-900/50 px-2 py-0.5 rounded">{log.resourceId}</code>
                  </div>
                  <div>
                    <span className="text-slate-500">IP Address:</span>
                    <span className="ml-2 text-slate-300">{log.ipAddress}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-500">User Agent:</span>
                    <span className="ml-2 text-slate-300 text-xs">{log.userAgent}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {paginatedLogs.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No audit log entries found matching your filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page =>
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              )
              .map((page, i, arr) => (
                <span key={page}>
                  {i > 0 && arr[i - 1] !== page - 1 && (
                    <span className="px-2 text-slate-500">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 text-sm rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50'
                    }`}
                  >
                    {page}
                  </button>
                </span>
              ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

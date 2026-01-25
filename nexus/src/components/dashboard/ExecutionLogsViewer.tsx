/**
 * ExecutionLogsViewer - Comprehensive Workflow Execution Logs Dashboard
 *
 * Features:
 * - Log table with timestamp, workflow name, status, duration, and actions
 * - Filtering by date range, workflow, status, and search
 * - Log detail modal with execution timeline and step breakdown
 * - Pagination (20 per page)
 * - Real-time updates for running executions
 * - Export to CSV
 * - Bulk re-run failed executions
 * - Sortable columns
 * - Expandable rows for quick preview
 * - Mobile responsive
 * - Loading skeletons
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  RefreshCw,
  Play,
  Eye,
  Calendar,
  ArrowUpDown,
  X,
  AlertTriangle,
  Terminal,
  FileCode
} from 'lucide-react'

// ========================================
// Types
// ========================================

export type ExecutionStatus = 'success' | 'failed' | 'running' | 'pending'

export interface ExecutionStep {
  id: string
  name: string
  status: ExecutionStatus
  startedAt?: string
  completedAt?: string
  duration?: number
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error?: {
    message: string
    code?: string
    stackTrace?: string
  }
  retryCount?: number
}

export interface ExecutionLog {
  id: string
  workflowId: string
  workflowName: string
  status: ExecutionStatus
  startedAt: string
  completedAt?: string
  duration?: number // in milliseconds
  triggeredBy: 'manual' | 'schedule' | 'webhook' | 'api'
  steps: ExecutionStep[]
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  errorCount: number
  tokensUsed?: number
  costUsd?: number
  userId?: string
  progress?: number // 0-100 for running executions
}

export interface ExecutionLogsViewerProps {
  logs?: ExecutionLog[]
  onRefresh?: () => Promise<void>
  onRerun?: (executionId: string) => Promise<void>
  onBulkRerun?: (executionIds: string[]) => Promise<void>
  onExport?: (logs: ExecutionLog[]) => void
  workflows?: { id: string; name: string }[]
  isLoading?: boolean
  className?: string
}

type SortField = 'startedAt' | 'workflowName' | 'status' | 'duration'
type SortDirection = 'asc' | 'desc'

// ========================================
// Helper Functions
// ========================================

function formatDuration(ms: number | undefined): string {
  if (ms === undefined || ms === null) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  return `${hours}h ${minutes}m`
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function generateCSV(logs: ExecutionLog[]): string {
  const headers = [
    'Execution ID',
    'Workflow Name',
    'Status',
    'Started At',
    'Completed At',
    'Duration (ms)',
    'Triggered By',
    'Error Count',
    'Tokens Used',
    'Cost (USD)'
  ]

  const rows = logs.map((log) => [
    log.id,
    log.workflowName,
    log.status,
    log.startedAt,
    log.completedAt || '',
    log.duration?.toString() || '',
    log.triggeredBy,
    log.errorCount.toString(),
    log.tokensUsed?.toString() || '',
    log.costUsd?.toString() || ''
  ])

  return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join(
    '\n'
  )
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// ========================================
// Status Badge Component
// ========================================

interface StatusBadgeProps {
  status: ExecutionStatus
  errorCount?: number
  progress?: number
  className?: string
}

function StatusBadge({ status, errorCount = 0, progress, className }: StatusBadgeProps) {
  const statusConfig = {
    success: {
      icon: CheckCircle2,
      label: 'Success',
      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    failed: {
      icon: XCircle,
      label: errorCount > 1 ? `Failed (${errorCount} errors)` : 'Failed',
      className: 'bg-red-500/20 text-red-400 border-red-500/30'
    },
    running: {
      icon: Loader2,
      label: progress !== undefined ? `Running (${progress}%)` : 'Running',
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn('flex items-center gap-1.5 border', config.className, className)}
    >
      <Icon
        className={cn(
          'w-3.5 h-3.5',
          status === 'running' && 'animate-spin'
        )}
      />
      <span>{config.label}</span>
    </Badge>
  )
}

// ========================================
// Expanded Row Preview Component
// ========================================

interface ExpandedRowPreviewProps {
  log: ExecutionLog
}

function ExpandedRowPreview({ log }: ExpandedRowPreviewProps) {
  const completedSteps = log.steps.filter((s) => s.status === 'success').length
  const failedSteps = log.steps.filter((s) => s.status === 'failed').length

  return (
    <div className="p-4 bg-muted/30 border-t border-border space-y-3">
      {/* Quick Stats */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Steps:</span>
          <span className="font-medium">
            {completedSteps}/{log.steps.length} completed
          </span>
        </div>
        {failedSteps > 0 && (
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="w-4 h-4" />
            <span>{failedSteps} failed</span>
          </div>
        )}
        {log.triggeredBy && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Triggered:</span>
            <Badge variant="secondary" className="text-xs">
              {log.triggeredBy}
            </Badge>
          </div>
        )}
        {log.tokensUsed !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Tokens:</span>
            <span>{log.tokensUsed.toLocaleString()}</span>
          </div>
        )}
        {log.costUsd !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Cost:</span>
            <span>${log.costUsd.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* Step Progress */}
      {log.status === 'running' && log.progress !== undefined && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Execution Progress</span>
            <span>{log.progress}%</span>
          </div>
          <Progress value={log.progress} className="h-1.5" />
        </div>
      )}

      {/* Steps Mini Timeline */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {log.steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                step.status === 'success' && 'bg-emerald-500/20 text-emerald-400',
                step.status === 'failed' && 'bg-red-500/20 text-red-400',
                step.status === 'running' && 'bg-blue-500/20 text-blue-400',
                step.status === 'pending' && 'bg-gray-500/20 text-gray-400'
              )}
              title={step.name}
            >
              {step.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {step.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
              {step.status === 'running' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {step.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
            </div>
            {index < log.steps.length - 1 && (
              <div
                className={cn(
                  'w-4 h-0.5',
                  step.status === 'success' ? 'bg-emerald-500/50' : 'bg-border'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ========================================
// Log Detail Modal Component
// ========================================

interface LogDetailModalProps {
  log: ExecutionLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRerun?: (executionId: string) => Promise<void>
}

function LogDetailModal({ log, open, onOpenChange, onRerun }: LogDetailModalProps) {
  const [selectedStep, setSelectedStep] = useState<ExecutionStep | null>(null)
  const [isRerunning, setIsRerunning] = useState(false)

  const handleRerun = async () => {
    if (!log || !onRerun) return
    setIsRerunning(true)
    try {
      await onRerun(log.id)
      onOpenChange(false)
    } finally {
      setIsRerunning(false)
    }
  }

  if (!log) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileCode className="w-5 h-5 text-primary" />
            Execution Details
          </DialogTitle>
          <DialogDescription>
            {log.workflowName} - {formatDateTime(log.startedAt)}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Execution Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <StatusBadge status={log.status} errorCount={log.errorCount} progress={log.progress} />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="font-medium">{formatDuration(log.duration)}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Tokens Used</p>
              <p className="font-medium">{log.tokensUsed?.toLocaleString() || '-'}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Cost</p>
              <p className="font-medium">{log.costUsd ? `$${log.costUsd.toFixed(4)}` : '-'}</p>
            </div>
          </div>

          {/* Execution Timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Step-by-Step Execution
            </h3>
            <div className="space-y-2">
              {log.steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setSelectedStep(selectedStep?.id === step.id ? null : step)}
                  className={cn(
                    'w-full p-3 rounded-lg border text-left transition-all',
                    'hover:border-primary/50 hover:bg-muted/50',
                    selectedStep?.id === step.id && 'border-primary bg-muted/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <StatusBadge status={step.status} className="text-xs" />
                      <span className="font-medium">{step.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {step.duration !== undefined && (
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(step.duration)}
                        </span>
                      )}
                      {step.retryCount !== undefined && step.retryCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {step.retryCount} retries
                        </Badge>
                      )}
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform',
                          selectedStep?.id === step.id && 'rotate-180'
                        )}
                      />
                    </div>
                  </div>

                  {/* Expanded Step Detail */}
                  {selectedStep?.id === step.id && (
                    <div
                      className="mt-3 pt-3 border-t border-border space-y-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {step.startedAt && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Started:</span>{' '}
                            {formatDateTime(step.startedAt)}
                          </div>
                          {step.completedAt && (
                            <div>
                              <span className="text-muted-foreground">Completed:</span>{' '}
                              {formatDateTime(step.completedAt)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Input Data */}
                      {step.input && Object.keys(step.input).length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Input</p>
                          <pre className="p-2 bg-background rounded text-xs overflow-x-auto max-h-32">
                            {JSON.stringify(step.input, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Output Data */}
                      {step.output && Object.keys(step.output).length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Output</p>
                          <pre className="p-2 bg-background rounded text-xs overflow-x-auto max-h-32">
                            {JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Error Details */}
                      {step.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                            <div className="space-y-2 flex-1 min-w-0">
                              <p className="text-sm text-red-400 font-medium">
                                {step.error.code && (
                                  <span className="font-mono">[{step.error.code}]</span>
                                )}{' '}
                                {step.error.message}
                              </p>
                              {step.error.stackTrace && (
                                <details className="text-xs">
                                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                    Stack Trace
                                  </summary>
                                  <pre className="mt-2 p-2 bg-background rounded overflow-x-auto max-h-40">
                                    {step.error.stackTrace}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Input/Output Preview */}
          <div className="grid md:grid-cols-2 gap-4">
            {log.input && Object.keys(log.input).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Workflow Input</h4>
                <pre className="p-3 bg-muted/50 rounded-lg text-xs overflow-x-auto max-h-40">
                  {JSON.stringify(log.input, null, 2)}
                </pre>
              </div>
            )}
            {log.output && Object.keys(log.output).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Workflow Output</h4>
                <pre className="p-3 bg-muted/50 rounded-lg text-xs overflow-x-auto max-h-40">
                  {JSON.stringify(log.output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {log.status === 'failed' && onRerun && (
            <Button onClick={handleRerun} loading={isRerunning} leftIcon={<Play className="w-4 h-4" />}>
              Re-run Workflow
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========================================
// Filter Panel Component
// ========================================

interface FilterPanelProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedStatus: ExecutionStatus | 'all'
  onStatusChange: (status: ExecutionStatus | 'all') => void
  selectedWorkflow: string | 'all'
  onWorkflowChange: (workflowId: string | 'all') => void
  dateRange: { start: string; end: string }
  onDateRangeChange: (range: { start: string; end: string }) => void
  workflows: { id: string; name: string }[]
  onClearFilters: () => void
  hasActiveFilters: boolean
}

function FilterPanel({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedWorkflow,
  onWorkflowChange,
  dateRange,
  onDateRangeChange,
  workflows,
  onClearFilters,
  hasActiveFilters
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="space-y-3">
      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            clearable
            onClear={() => onSearchChange('')}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={isExpanded ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            leftIcon={<Filter className="w-4 h-4" />}
          >
            Filters
            {hasActiveFilters && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                Active
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'success', 'failed', 'running', 'pending'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => onStatusChange(status)}
                    className={cn(
                      'px-2.5 py-1 text-xs rounded-md transition-colors',
                      selectedStatus === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Workflow Filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Workflow
              </label>
              <select
                value={selectedWorkflow}
                onChange={(e) => onWorkflowChange(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Workflows</option>
                {workflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ========================================
// Table Loading Skeleton
// ========================================

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-lg">
          <Skeleton width={100} height={20} />
          <Skeleton width={150} height={20} className="hidden sm:block" />
          <Skeleton width={80} height={24} variant="rounded" />
          <Skeleton width={60} height={20} className="hidden md:block" />
          <div className="flex-1" />
          <Skeleton width={80} height={32} variant="rounded" />
        </div>
      ))}
    </div>
  )
}

// ========================================
// Main ExecutionLogsViewer Component
// ========================================

export function ExecutionLogsViewer({
  logs: initialLogs = [],
  onRefresh,
  onRerun,
  onBulkRerun,
  onExport,
  workflows = [],
  isLoading = false,
  className
}: ExecutionLogsViewerProps) {
  // State
  const [logs, setLogs] = useState<ExecutionLog[]>(initialLogs)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<ExecutionStatus | 'all'>('all')
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | 'all'>('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [sortField, setSortField] = useState<SortField>('startedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [selectedLog, setSelectedLog] = useState<ExecutionLog | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isBulkRerunning, setIsBulkRerunning] = useState(false)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const ITEMS_PER_PAGE = 20

  // Sync logs with props
  useEffect(() => {
    setLogs(initialLogs)
  }, [initialLogs])

  // Real-time updates for running executions
  useEffect(() => {
    const hasRunningExecutions = logs.some((log) => log.status === 'running')

    if (hasRunningExecutions && onRefresh) {
      refreshIntervalRef.current = setInterval(async () => {
        try {
          await onRefresh()
        } catch (error) {
          console.error('Failed to refresh logs:', error)
        }
      }, 5000) // Poll every 5 seconds
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [logs, onRefresh])

  // Filter and sort logs
  const filteredLogs = useMemo(() => {
    let result = [...logs]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (log) =>
          log.workflowName.toLowerCase().includes(query) ||
          log.id.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter((log) => log.status === selectedStatus)
    }

    // Workflow filter
    if (selectedWorkflow !== 'all') {
      result = result.filter((log) => log.workflowId === selectedWorkflow)
    }

    // Date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start)
      result = result.filter((log) => new Date(log.startedAt) >= startDate)
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      result = result.filter((log) => new Date(log.startedAt) <= endDate)
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'startedAt':
          comparison = new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
          break
        case 'workflowName':
          comparison = a.workflowName.localeCompare(b.workflowName)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [logs, searchQuery, selectedStatus, selectedWorkflow, dateRange, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredLogs, currentPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedStatus, selectedWorkflow, dateRange])

  // Handlers
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDirection('desc')
      }
    },
    [sortField]
  )

  const handleRefresh = async () => {
    if (!onRefresh) return
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExport = () => {
    if (onExport) {
      onExport(filteredLogs)
    } else {
      const csv = generateCSV(filteredLogs)
      const filename = `execution-logs-${formatDate(new Date().toISOString()).replace(/\s/g, '-')}.csv`
      downloadCSV(csv, filename)
    }
  }

  const handleBulkRerun = async () => {
    if (!onBulkRerun || selectedRows.size === 0) return
    setIsBulkRerunning(true)
    try {
      await onBulkRerun(Array.from(selectedRows))
      setSelectedRows(new Set())
    } finally {
      setIsBulkRerunning(false)
    }
  }

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleRowSelection = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAllSelection = () => {
    if (selectedRows.size === paginatedLogs.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(paginatedLogs.map((log) => log.id)))
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedStatus('all')
    setSelectedWorkflow('all')
    setDateRange({ start: '', end: '' })
  }

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedStatus !== 'all' ||
    selectedWorkflow !== 'all' ||
    dateRange.start !== '' ||
    dateRange.end !== ''

  const failedSelectedCount = Array.from(selectedRows).filter(
    (id) => logs.find((log) => log.id === id)?.status === 'failed'
  ).length

  // Derive workflows from logs if not provided
  const workflowOptions = useMemo(() => {
    if (workflows.length > 0) return workflows
    const uniqueWorkflows = new Map<string, string>()
    logs.forEach((log) => {
      if (!uniqueWorkflows.has(log.workflowId)) {
        uniqueWorkflows.set(log.workflowId, log.workflowName)
      }
    })
    return Array.from(uniqueWorkflows.entries()).map(([id, name]) => ({ id, name }))
  }, [logs, workflows])

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Execution Logs
            </CardTitle>
            <CardDescription>
              {filteredLogs.length} execution{filteredLogs.length !== 1 ? 's' : ''} found
              {hasActiveFilters && ' (filtered)'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedRows.size > 0 && failedSelectedCount > 0 && onBulkRerun && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRerun}
                loading={isBulkRerunning}
                leftIcon={<Play className="w-4 h-4" />}
              >
                Re-run {failedSelectedCount} Failed
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export CSV
            </Button>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                loading={isRefreshing}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <FilterPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedWorkflow={selectedWorkflow}
          onWorkflowChange={setSelectedWorkflow}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          workflows={workflowOptions}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Table */}
        {isLoading ? (
          <TableSkeleton />
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No executions found</p>
            <p className="text-sm">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Workflow executions will appear here'}
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
              <div className="w-6">
                <input
                  type="checkbox"
                  checked={selectedRows.size === paginatedLogs.length && paginatedLogs.length > 0}
                  onChange={toggleAllSelection}
                  className="rounded border-input"
                />
              </div>
              <button
                onClick={() => handleSort('workflowName')}
                className="flex items-center gap-1 hover:text-foreground transition-colors text-left"
              >
                Workflow
                <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleSort('status')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Status
                <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleSort('duration')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Duration
                <ArrowUpDown className="w-3 h-3" />
              </button>
              <div className="w-24 text-right">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border">
              {paginatedLogs.map((log) => (
                <div key={log.id}>
                  {/* Main Row */}
                  <div
                    className={cn(
                      'grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto_auto] gap-3 md:gap-4 p-3 md:p-4 items-center',
                      'hover:bg-muted/30 transition-colors',
                      selectedRows.has(log.id) && 'bg-primary/5'
                    )}
                  >
                    {/* Checkbox (Hidden on mobile) */}
                    <div className="hidden md:block w-6">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(log.id)}
                        onChange={() => toggleRowSelection(log.id)}
                        className="rounded border-input"
                      />
                    </div>

                    {/* Workflow Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => toggleRowExpansion(log.id)}
                        className="p-1 hover:bg-muted rounded transition-colors shrink-0"
                      >
                        {expandedRows.has(log.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{log.workflowName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(log.startedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <StatusBadge
                      status={log.status}
                      errorCount={log.errorCount}
                      progress={log.progress}
                    />

                    {/* Duration */}
                    <div className="text-sm text-muted-foreground hidden md:block">
                      {formatDuration(log.duration)}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-8 px-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="sr-only md:not-sr-only md:ml-1.5">View</span>
                      </Button>
                      {log.status === 'failed' && onRerun && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRerun(log.id)}
                          className="h-8 px-2"
                        >
                          <Play className="w-4 h-4" />
                          <span className="sr-only md:not-sr-only md:ml-1.5">Re-run</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Preview */}
                  {expandedRows.has(log.id) && <ExpandedRowPreview log={log} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'w-8 h-8 rounded-md text-sm transition-colors',
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Detail Modal */}
      <LogDetailModal
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
        onRerun={onRerun}
      />
    </Card>
  )
}

export default ExecutionLogsViewer

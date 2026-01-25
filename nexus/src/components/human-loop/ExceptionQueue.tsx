/**
 * ExceptionQueue Component - Failed Workflow Exception Handler
 *
 * A comprehensive queue interface for handling failed workflow executions
 * that need human intervention. Supports retry, skip, manual override,
 * escalation, bulk actions, and real-time updates.
 *
 * Features:
 * - Display list of failed workflow executions
 * - Show error details, stack traces, and context
 * - Actions: Retry, Skip, Manual Override, Escalate
 * - Priority levels (Critical, High, Medium, Low)
 * - Filters by workflow type, error type, age
 * - Bulk actions for multiple exceptions
 * - Real-time updates via polling or SSE
 * - Integration with notification system
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  RefreshCw,
  SkipForward,
  Edit3,
  ArrowUpRight,
  Clock,
  Search,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  XCircle,
  AlertCircle,
  Info,
  Copy,
  Bell,
  BellOff,
  Eye,
} from 'lucide-react'

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type ExceptionPriority = 'critical' | 'high' | 'medium' | 'low'

export type ExceptionStatus = 'pending' | 'in_progress' | 'resolved' | 'escalated' | 'skipped'

export type ErrorType =
  | 'timeout'
  | 'api_error'
  | 'validation_error'
  | 'authentication_error'
  | 'rate_limit'
  | 'network_error'
  | 'internal_error'
  | 'data_error'
  | 'permission_error'
  | 'unknown'

export interface ExceptionQueueItem {
  id: string
  workflowId: string
  workflowName: string
  executionId: string
  stepName: string
  stepIndex: number
  priority: ExceptionPriority
  status: ExceptionStatus
  errorType: ErrorType
  errorMessage: string
  errorCode?: string
  stackTrace?: string
  context: {
    input?: Record<string, unknown>
    output?: Record<string, unknown>
    metadata?: Record<string, unknown>
    previousStepOutput?: unknown
    retryCount: number
    maxRetries: number
    lastRetryAt?: string
  }
  createdAt: string
  updatedAt: string
  assignedTo?: string
  escalateTo?: string
  escalatedAt?: string
  resolvedAt?: string
  resolvedBy?: string
  resolution?: string
  notes?: string[]
  tags?: string[]
}

export interface ExceptionQueueFilters {
  search: string
  priority: ExceptionPriority | 'all'
  status: ExceptionStatus | 'all'
  errorType: ErrorType | 'all'
  workflowType: string | 'all'
  ageRange: 'all' | 'last_hour' | 'last_24h' | 'last_week' | 'older'
}

export interface ExceptionQueueStats {
  total: number
  pending: number
  inProgress: number
  resolved: number
  escalated: number
  skipped: number
  byPriority: Record<ExceptionPriority, number>
  byErrorType: Record<ErrorType, number>
  avgResolutionTime: number // minutes
}

export interface ExceptionQueueProps {
  className?: string
  onRetry?: (item: ExceptionQueueItem) => Promise<boolean>
  onSkip?: (item: ExceptionQueueItem, reason: string) => Promise<boolean>
  onManualOverride?: (item: ExceptionQueueItem, overrideData: unknown) => Promise<boolean>
  onEscalate?: (item: ExceptionQueueItem, escalateTo: string, notes: string) => Promise<boolean>
  onNotify?: (item: ExceptionQueueItem, message: string) => void
  pollingInterval?: number // milliseconds, 0 to disable
  sseEndpoint?: string
  maxDisplayItems?: number
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_EXCEPTIONS: ExceptionQueueItem[] = [
  {
    id: 'exc-001',
    workflowId: 'wf-email-automation',
    workflowName: 'Email Marketing Automation',
    executionId: 'exec-20240115-001',
    stepName: 'Send Email via SMTP',
    stepIndex: 3,
    priority: 'critical',
    status: 'pending',
    errorType: 'authentication_error',
    errorMessage: 'SMTP authentication failed: Invalid credentials or account locked',
    errorCode: 'SMTP_AUTH_FAILED',
    stackTrace: `Error: SMTP authentication failed
    at SMTPTransport.authenticate (smtp-transport.js:142:23)
    at SMTPTransport.connect (smtp-transport.js:89:12)
    at EmailService.send (email-service.ts:67:15)
    at WorkflowStep.execute (workflow-step.ts:34:8)
    at WorkflowEngine.runStep (engine.ts:156:20)`,
    context: {
      input: { to: 'customer@example.com', subject: 'Your Weekly Report' },
      metadata: { campaignId: 'camp-2024-01', batchSize: 150, processedCount: 47 },
      retryCount: 3,
      maxRetries: 5,
      lastRetryAt: '2024-01-15T10:30:00Z',
    },
    createdAt: '2024-01-15T10:15:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    tags: ['email', 'marketing', 'smtp'],
    notes: ['Checked SMTP credentials - appear valid', 'Possible account lockout from multiple failures'],
  },
  {
    id: 'exc-002',
    workflowId: 'wf-data-sync',
    workflowName: 'CRM Data Synchronization',
    executionId: 'exec-20240115-002',
    stepName: 'Fetch Records from Salesforce',
    stepIndex: 1,
    priority: 'high',
    status: 'pending',
    errorType: 'rate_limit',
    errorMessage: 'Salesforce API rate limit exceeded. Daily limit: 15000, Used: 15000',
    errorCode: 'REQUEST_LIMIT_EXCEEDED',
    context: {
      input: { objectType: 'Contact', query: 'SELECT Id, Name, Email FROM Contact WHERE LastModifiedDate > YESTERDAY' },
      metadata: { totalRecords: 5000, processedRecords: 3200 },
      retryCount: 1,
      maxRetries: 3,
    },
    createdAt: '2024-01-15T09:45:00Z',
    updatedAt: '2024-01-15T09:50:00Z',
    tags: ['salesforce', 'api', 'sync'],
  },
  {
    id: 'exc-003',
    workflowId: 'wf-invoice-processing',
    workflowName: 'Invoice Processing Pipeline',
    executionId: 'exec-20240115-003',
    stepName: 'Parse Invoice PDF',
    stepIndex: 2,
    priority: 'medium',
    status: 'in_progress',
    errorType: 'data_error',
    errorMessage: 'Unable to extract required fields from invoice. Missing: invoice_number, total_amount',
    errorCode: 'PARSE_INCOMPLETE',
    context: {
      input: { fileUrl: 'https://storage.example.com/invoices/inv-2024-0547.pdf' },
      output: { vendor_name: 'Acme Corp', date: '2024-01-10' },
      metadata: { fileSize: '245KB', pageCount: 2 },
      retryCount: 0,
      maxRetries: 2,
    },
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:05:00Z',
    assignedTo: 'john.doe@company.com',
    tags: ['invoice', 'pdf', 'parsing'],
  },
  {
    id: 'exc-004',
    workflowId: 'wf-webhook-handler',
    workflowName: 'Webhook Event Handler',
    executionId: 'exec-20240115-004',
    stepName: 'Process Stripe Webhook',
    stepIndex: 1,
    priority: 'critical',
    status: 'escalated',
    errorType: 'validation_error',
    errorMessage: 'Webhook signature verification failed. Possible tampering or misconfigured secret.',
    errorCode: 'SIGNATURE_INVALID',
    stackTrace: `Error: Webhook signature verification failed
    at StripeWebhook.verifySignature (stripe-webhook.ts:45:11)
    at WebhookHandler.process (webhook-handler.ts:23:8)
    at Router.handle (router.ts:89:14)`,
    context: {
      input: { eventType: 'payment_intent.succeeded', webhookId: 'we_1234567890' },
      metadata: { source: 'stripe', timestamp: '2024-01-15T08:30:00Z' },
      retryCount: 2,
      maxRetries: 2,
    },
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
    escalateTo: 'security-team@company.com',
    escalatedAt: '2024-01-15T09:00:00Z',
    tags: ['stripe', 'webhook', 'security'],
    notes: ['Escalated to security team for review', 'Possible security incident'],
  },
  {
    id: 'exc-005',
    workflowId: 'wf-report-gen',
    workflowName: 'Weekly Report Generator',
    executionId: 'exec-20240114-001',
    stepName: 'Generate Chart Images',
    stepIndex: 4,
    priority: 'low',
    status: 'pending',
    errorType: 'timeout',
    errorMessage: 'Chart generation timed out after 60 seconds. Data set too large.',
    errorCode: 'OPERATION_TIMEOUT',
    context: {
      input: { chartType: 'line', dataPoints: 50000 },
      metadata: { reportId: 'rpt-2024-week-02' },
      retryCount: 1,
      maxRetries: 3,
    },
    createdAt: '2024-01-14T22:30:00Z',
    updatedAt: '2024-01-14T22:35:00Z',
    tags: ['report', 'chart', 'performance'],
  },
  {
    id: 'exc-006',
    workflowId: 'wf-user-onboarding',
    workflowName: 'User Onboarding Flow',
    executionId: 'exec-20240115-005',
    stepName: 'Create User in Auth0',
    stepIndex: 2,
    priority: 'high',
    status: 'pending',
    errorType: 'api_error',
    errorMessage: 'Auth0 API returned unexpected error: User already exists with this email',
    errorCode: 'USER_EXISTS',
    context: {
      input: { email: 'newuser@example.com', name: 'New User' },
      metadata: { source: 'signup_form', referrer: 'marketing_campaign_q1' },
      retryCount: 0,
      maxRetries: 1,
    },
    createdAt: '2024-01-15T11:30:00Z',
    updatedAt: '2024-01-15T11:30:00Z',
    tags: ['auth0', 'user', 'onboarding'],
  },
]

const MOCK_STATS: ExceptionQueueStats = {
  total: 6,
  pending: 4,
  inProgress: 1,
  resolved: 0,
  escalated: 1,
  skipped: 0,
  byPriority: { critical: 2, high: 2, medium: 1, low: 1 },
  byErrorType: {
    timeout: 1,
    api_error: 1,
    validation_error: 1,
    authentication_error: 1,
    rate_limit: 1,
    network_error: 0,
    internal_error: 0,
    data_error: 1,
    permission_error: 0,
    unknown: 0,
  },
  avgResolutionTime: 45,
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const PRIORITY_CONFIG: Record<ExceptionPriority, { label: string; color: string; icon: typeof AlertTriangle }> = {
  critical: { label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
  high: { label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertCircle },
  medium: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Info },
  low: { label: 'Low', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Info },
}

const STATUS_CONFIG: Record<ExceptionStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-500/20 text-amber-400' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-400' },
  resolved: { label: 'Resolved', color: 'bg-emerald-500/20 text-emerald-400' },
  escalated: { label: 'Escalated', color: 'bg-purple-500/20 text-purple-400' },
  skipped: { label: 'Skipped', color: 'bg-slate-500/20 text-slate-400' },
}

const ERROR_TYPE_CONFIG: Record<ErrorType, { label: string; description: string }> = {
  timeout: { label: 'Timeout', description: 'Operation exceeded time limit' },
  api_error: { label: 'API Error', description: 'External API returned an error' },
  validation_error: { label: 'Validation', description: 'Data validation failed' },
  authentication_error: { label: 'Auth Error', description: 'Authentication or authorization failed' },
  rate_limit: { label: 'Rate Limit', description: 'API rate limit exceeded' },
  network_error: { label: 'Network', description: 'Network connectivity issue' },
  internal_error: { label: 'Internal', description: 'Internal system error' },
  data_error: { label: 'Data Error', description: 'Data processing or format error' },
  permission_error: { label: 'Permission', description: 'Insufficient permissions' },
  unknown: { label: 'Unknown', description: 'Unclassified error' },
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function filterExceptions(items: ExceptionQueueItem[], filters: ExceptionQueueFilters): ExceptionQueueItem[] {
  return items.filter((item) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        item.workflowName.toLowerCase().includes(searchLower) ||
        item.stepName.toLowerCase().includes(searchLower) ||
        item.errorMessage.toLowerCase().includes(searchLower) ||
        item.id.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Priority filter
    if (filters.priority !== 'all' && item.priority !== filters.priority) {
      return false
    }

    // Status filter
    if (filters.status !== 'all' && item.status !== filters.status) {
      return false
    }

    // Error type filter
    if (filters.errorType !== 'all' && item.errorType !== filters.errorType) {
      return false
    }

    // Age range filter
    if (filters.ageRange !== 'all') {
      const now = new Date()
      const itemDate = new Date(item.createdAt)
      const diffHours = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60)

      switch (filters.ageRange) {
        case 'last_hour':
          if (diffHours > 1) return false
          break
        case 'last_24h':
          if (diffHours > 24) return false
          break
        case 'last_week':
          if (diffHours > 168) return false
          break
        case 'older':
          if (diffHours <= 168) return false
          break
      }
    }

    return true
  })
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ExceptionItemProps {
  item: ExceptionQueueItem
  isSelected: boolean
  isExpanded: boolean
  onSelect: () => void
  onExpand: () => void
  onRetry: () => void
  onSkip: () => void
  onManualOverride: () => void
  onEscalate: () => void
  onViewDetails: () => void
}

function ExceptionItem({
  item,
  isSelected,
  isExpanded,
  onSelect,
  onExpand,
  onRetry,
  onSkip,
  onManualOverride,
  onEscalate,
  onViewDetails,
}: ExceptionItemProps) {
  const priorityConfig = PRIORITY_CONFIG[item.priority]
  const statusConfig = STATUS_CONFIG[item.status]
  const PriorityIcon = priorityConfig.icon

  const canRetry = item.context.retryCount < item.context.maxRetries && item.status === 'pending'
  const isActionable = item.status === 'pending' || item.status === 'in_progress'

  return (
    <div
      className={cn(
        'bg-slate-800/50 rounded-xl border transition-all',
        isSelected ? 'border-cyan-500/50 bg-slate-800/70' : 'border-slate-700/50 hover:border-slate-600/50',
        item.priority === 'critical' && 'border-red-500/30'
      )}
    >
      {/* Main Row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Selection Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className="mt-1 text-slate-400 hover:text-white transition-colors"
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-cyan-400" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>

          {/* Priority Icon */}
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              priorityConfig.color
            )}
          >
            <PriorityIcon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded', priorityConfig.color)}>
                {priorityConfig.label}
              </span>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded', statusConfig.color)}>
                {statusConfig.label}
              </span>
              <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-700/50 rounded">
                {ERROR_TYPE_CONFIG[item.errorType].label}
              </span>
              {item.context.retryCount > 0 && (
                <span className="text-xs text-slate-500">
                  Retried {item.context.retryCount}/{item.context.maxRetries}
                </span>
              )}
            </div>

            <h4 className="font-semibold text-white text-sm mb-1 truncate">
              {item.workflowName}
            </h4>

            <p className="text-sm text-slate-400 mb-2">
              Step {item.stepIndex + 1}: {item.stepName}
            </p>

            <p className="text-sm text-red-400/80 line-clamp-2 mb-2">
              {item.errorMessage}
            </p>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(item.createdAt)}
                </span>
                <span className="truncate max-w-[150px]" title={item.executionId}>
                  {item.executionId}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {isActionable && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRetry()
                      }}
                      disabled={!canRetry}
                      className="h-8 px-2 text-xs"
                      title={canRetry ? 'Retry' : 'Max retries reached'}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Retry
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSkip()
                      }}
                      className="h-8 px-2 text-xs"
                    >
                      <SkipForward className="w-3.5 h-3.5 mr-1" />
                      Skip
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewDetails()
                  }}
                  className="h-8 px-2 text-xs"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Details
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onExpand()
                  }}
                  className="h-8 w-8 p-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-700/50 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Error Details */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Error Details
              </h5>
              {item.errorCode && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Code:</span>
                  <code className="text-xs bg-slate-700/50 px-2 py-0.5 rounded text-red-400">
                    {item.errorCode}
                  </code>
                </div>
              )}
              {item.stackTrace && (
                <div className="bg-slate-900/50 rounded-lg p-3 max-h-40 overflow-auto">
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                    {item.stackTrace}
                  </pre>
                </div>
              )}
            </div>

            {/* Context */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Context
              </h5>
              {item.context.input && (
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Input:</span>
                  <div className="bg-slate-900/50 rounded-lg p-3 max-h-24 overflow-auto">
                    <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                      {JSON.stringify(item.context.input, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {item.context.metadata && (
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Metadata:</span>
                  <div className="bg-slate-900/50 rounded-lg p-3 max-h-24 overflow-auto">
                    <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                      {JSON.stringify(item.context.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {item.notes && item.notes.length > 0 && (
            <div className="mt-4">
              <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Notes
              </h5>
              <ul className="space-y-1">
                {item.notes.map((note, idx) => (
                  <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-slate-600">-</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          {isActionable && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/50">
              <Button
                size="sm"
                variant="default"
                onClick={onRetry}
                disabled={!canRetry}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Execution
              </Button>
              <Button size="sm" variant="outline" onClick={onManualOverride}>
                <Edit3 className="w-4 h-4 mr-2" />
                Manual Override
              </Button>
              <Button size="sm" variant="outline" onClick={onEscalate}>
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Escalate
              </Button>
              <Button size="sm" variant="destructive" onClick={onSkip}>
                <SkipForward className="w-4 h-4 mr-2" />
                Skip & Continue
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Stats Bar Component
interface StatsBarProps {
  stats: ExceptionQueueStats
}

function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{stats.total}</div>
        <div className="text-xs text-slate-500">Total</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
        <div className="text-xs text-slate-500">Pending</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-400">{stats.byPriority.critical}</div>
        <div className="text-xs text-slate-500">Critical</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-400">{stats.byPriority.high}</div>
        <div className="text-xs text-slate-500">High</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-400">{stats.escalated}</div>
        <div className="text-xs text-slate-500">Escalated</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-emerald-400">{stats.resolved}</div>
        <div className="text-xs text-slate-500">Resolved</div>
      </div>
    </div>
  )
}

// Filter Bar Component
interface FilterBarProps {
  filters: ExceptionQueueFilters
  onFilterChange: (filters: ExceptionQueueFilters) => void
  onClearFilters: () => void
}

function FilterBar({ filters, onFilterChange, onClearFilters }: FilterBarProps) {
  const hasActiveFilters =
    filters.search ||
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.errorType !== 'all' ||
    filters.ageRange !== 'all'

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          placeholder="Search by workflow, step, error message..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap gap-2">
        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => onFilterChange({ ...filters, priority: e.target.value as ExceptionPriority | 'all' })}
          className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value as ExceptionStatus | 'all' })}
          className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
          <option value="skipped">Skipped</option>
        </select>

        {/* Error Type Filter */}
        <select
          value={filters.errorType}
          onChange={(e) => onFilterChange({ ...filters, errorType: e.target.value as ErrorType | 'all' })}
          className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Error Types</option>
          {Object.entries(ERROR_TYPE_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>

        {/* Age Range Filter */}
        <select
          value={filters.ageRange}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              ageRange: e.target.value as ExceptionQueueFilters['ageRange'],
            })
          }
          className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Time</option>
          <option value="last_hour">Last Hour</option>
          <option value="last_24h">Last 24 Hours</option>
          <option value="last_week">Last Week</option>
          <option value="older">Older</option>
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-slate-400">
            <XCircle className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

// Bulk Actions Bar
interface BulkActionsBarProps {
  selectedCount: number
  onRetryAll: () => void
  onSkipAll: () => void
  onEscalateAll: () => void
  onDeselectAll: () => void
}

function BulkActionsBar({
  selectedCount,
  onRetryAll,
  onSkipAll,
  onEscalateAll,
  onDeselectAll,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg animate-in slide-in-from-top-2">
      <div className="flex items-center gap-2">
        <CheckSquare className="w-5 h-5 text-cyan-400" />
        <span className="text-sm text-cyan-300 font-medium">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onRetryAll}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Retry All
        </Button>
        <Button size="sm" variant="ghost" onClick={onSkipAll}>
          <SkipForward className="w-4 h-4 mr-1" />
          Skip All
        </Button>
        <Button size="sm" variant="ghost" onClick={onEscalateAll}>
          <ArrowUpRight className="w-4 h-4 mr-1" />
          Escalate All
        </Button>
        <Button size="sm" variant="ghost" onClick={onDeselectAll}>
          <XCircle className="w-4 h-4 mr-1" />
          Deselect
        </Button>
      </div>
    </div>
  )
}

// Detail Dialog
interface DetailDialogProps {
  item: ExceptionQueueItem | null
  open: boolean
  onClose: () => void
  onRetry: () => void
  onSkip: () => void
  onManualOverride: () => void
  onEscalate: () => void
}

function DetailDialog({
  item,
  open,
  onClose,
  onRetry,
  onSkip,
  onManualOverride,
  onEscalate,
}: DetailDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (!item) return null

  const priorityConfig = PRIORITY_CONFIG[item.priority]
  const statusConfig = STATUS_CONFIG[item.status]
  const canRetry = item.context.retryCount < item.context.maxRetries && item.status === 'pending'
  const isActionable = item.status === 'pending' || item.status === 'in_progress'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', priorityConfig.color)}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>{item.workflowName}</DialogTitle>
              <DialogDescription>
                Exception ID: {item.id} | Execution: {item.executionId}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={cn('text-xs font-medium px-2 py-1 rounded', priorityConfig.color)}>
              {priorityConfig.label} Priority
            </span>
            <span className={cn('text-xs font-medium px-2 py-1 rounded', statusConfig.color)}>
              {statusConfig.label}
            </span>
            <span className="text-xs font-medium px-2 py-1 rounded bg-slate-700/50 text-slate-400">
              {ERROR_TYPE_CONFIG[item.errorType].label}
            </span>
            <span className="text-xs font-medium px-2 py-1 rounded bg-slate-700/50 text-slate-400">
              Step {item.stepIndex + 1}: {item.stepName}
            </span>
          </div>

          {/* Error Message */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Error Message</h4>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">{item.errorMessage}</p>
              {item.errorCode && (
                <div className="mt-2 flex items-center gap-2">
                  <code className="text-xs bg-red-500/20 px-2 py-1 rounded text-red-300">
                    {item.errorCode}
                  </code>
                  <button
                    onClick={() => copyToClipboard(item.errorCode!, 'errorCode')}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    {copiedField === 'errorCode' ? (
                      <span className="text-xs text-emerald-400">Copied!</span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stack Trace */}
          {item.stackTrace && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-300">Stack Trace</h4>
                <button
                  onClick={() => copyToClipboard(item.stackTrace!, 'stackTrace')}
                  className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
                >
                  {copiedField === 'stackTrace' ? (
                    <span className="text-emerald-400">Copied!</span>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-900/70 rounded-lg p-4 max-h-48 overflow-auto">
                <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                  {item.stackTrace}
                </pre>
              </div>
            </div>
          )}

          {/* Context Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {item.context.input && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Input Data</h4>
                <div className="bg-slate-900/70 rounded-lg p-3 max-h-32 overflow-auto">
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                    {JSON.stringify(item.context.input, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            {item.context.metadata && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Metadata</h4>
                <div className="bg-slate-900/70 rounded-lg p-3 max-h-32 overflow-auto">
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                    {JSON.stringify(item.context.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Retry Info */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Retry Information</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-white">
                  {item.context.retryCount}/{item.context.maxRetries}
                </div>
                <div className="text-xs text-slate-500">Retries Used</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {item.context.maxRetries - item.context.retryCount}
                </div>
                <div className="text-xs text-slate-500">Remaining</div>
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {item.context.lastRetryAt
                    ? formatTimeAgo(item.context.lastRetryAt)
                    : 'Never'}
                </div>
                <div className="text-xs text-slate-500">Last Retry</div>
              </div>
              <div>
                <div className="text-sm font-medium text-white">{formatTimeAgo(item.createdAt)}</div>
                <div className="text-xs text-slate-500">Created</div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {item.notes && item.notes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Notes</h4>
              <ul className="space-y-2">
                {item.notes.map((note, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-slate-400 bg-slate-800/30 rounded-lg px-3 py-2"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Escalation Info */}
          {item.status === 'escalated' && item.escalateTo && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Escalation Details</h4>
              <p className="text-sm text-slate-400">
                Escalated to: <span className="text-purple-300">{item.escalateTo}</span>
              </p>
              {item.escalatedAt && (
                <p className="text-xs text-slate-500 mt-1">
                  {formatTimeAgo(item.escalatedAt)}
                </p>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {isActionable && (
            <>
              <Button variant="default" onClick={onRetry} disabled={!canRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button variant="outline" onClick={onManualOverride}>
                <Edit3 className="w-4 h-4 mr-2" />
                Override
              </Button>
              <Button variant="outline" onClick={onEscalate}>
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Escalate
              </Button>
              <Button variant="destructive" onClick={onSkip}>
                <SkipForward className="w-4 h-4 mr-2" />
                Skip
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Skip Dialog
interface SkipDialogProps {
  item: ExceptionQueueItem | null
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

function SkipDialog({ item, open, onClose, onConfirm }: SkipDialogProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason)
      setReason('')
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Skip Exception</DialogTitle>
          <DialogDescription>
            This will skip the failed step and continue the workflow. Please provide a reason.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for skipping this exception..."
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-cyan-500/50"
            rows={4}
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim()}>
            <SkipForward className="w-4 h-4 mr-2" />
            Skip Exception
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Escalate Dialog
interface EscalateDialogProps {
  item: ExceptionQueueItem | null
  open: boolean
  onClose: () => void
  onConfirm: (escalateTo: string, notes: string) => void
}

function EscalateDialog({ item, open, onClose, onConfirm }: EscalateDialogProps) {
  const [escalateTo, setEscalateTo] = useState('')
  const [notes, setNotes] = useState('')

  const handleConfirm = () => {
    if (escalateTo.trim()) {
      onConfirm(escalateTo, notes)
      setEscalateTo('')
      setNotes('')
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Escalate Exception</DialogTitle>
          <DialogDescription>
            Escalate this exception to a team member or support channel for further investigation.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Escalate To *</label>
            <input
              type="text"
              value={escalateTo}
              onChange={(e) => setEscalateTo(e.target.value)}
              placeholder="Email, team, or channel..."
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context or instructions..."
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-cyan-500/50"
              rows={3}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleConfirm} disabled={!escalateTo.trim()}>
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Escalate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Manual Override Dialog
interface ManualOverrideDialogProps {
  item: ExceptionQueueItem | null
  open: boolean
  onClose: () => void
  onConfirm: (overrideData: unknown) => void
}

function ManualOverrideDialog({ item, open, onClose, onConfirm }: ManualOverrideDialogProps) {
  const [overrideJson, setOverrideJson] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (item?.context.output) {
      setOverrideJson(JSON.stringify(item.context.output, null, 2))
    } else {
      setOverrideJson('{\n  \n}')
    }
  }, [item])

  const handleConfirm = () => {
    try {
      const parsed = JSON.parse(overrideJson)
      setError(null)
      onConfirm(parsed)
      setOverrideJson('')
    } catch {
      setError('Invalid JSON format')
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Manual Override</DialogTitle>
          <DialogDescription>
            Provide the output data manually to continue the workflow past this failed step.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Step: {item.stepName}</label>
            <div className="text-xs text-slate-500 mb-2">
              Enter the JSON data that would normally be produced by this step.
            </div>
            <textarea
              value={overrideJson}
              onChange={(e) => {
                setOverrideJson(e.target.value)
                setError(null)
              }}
              className={cn(
                'w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white font-mono text-sm resize-none focus:outline-none',
                error ? 'border-red-500/50' : 'border-slate-700/50 focus:border-cyan-500/50'
              )}
              rows={10}
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleConfirm}>
            <Edit3 className="w-4 h-4 mr-2" />
            Apply Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ExceptionQueue({
  className,
  onRetry,
  onSkip,
  onManualOverride,
  onEscalate,
  onNotify,
  pollingInterval = 30000,
  sseEndpoint,
  maxDisplayItems = 50,
}: ExceptionQueueProps) {
  // State
  const [exceptions, setExceptions] = useState<ExceptionQueueItem[]>(MOCK_EXCEPTIONS)
  const [stats, setStats] = useState<ExceptionQueueStats>(MOCK_STATS)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<ExceptionQueueFilters>({
    search: '',
    priority: 'all',
    status: 'all',
    errorType: 'all',
    workflowType: 'all',
    ageRange: 'all',
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [detailItem, setDetailItem] = useState<ExceptionQueueItem | null>(null)
  const [skipItem, setSkipItem] = useState<ExceptionQueueItem | null>(null)
  const [escalateItem, setEscalateItem] = useState<ExceptionQueueItem | null>(null)
  const [overrideItem, setOverrideItem] = useState<ExceptionQueueItem | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Refs
  const sseRef = useRef<EventSource | null>(null)
  const pollingRef = useRef<number | null>(null)

  // Filtered exceptions
  const filteredExceptions = useMemo(
    () => filterExceptions(exceptions, filters).slice(0, maxDisplayItems),
    [exceptions, filters, maxDisplayItems]
  )

  // Fetch exceptions
  const fetchExceptions = useCallback(async () => {
    setIsLoading(true)
    try {
      // In production, this would be an API call
      // const response = await fetch('/api/exceptions')
      // const data = await response.json()
      // setExceptions(data.exceptions)
      // setStats(data.stats)

      // For demo, use mock data
      await new Promise((resolve) => setTimeout(resolve, 500))
      setExceptions(MOCK_EXCEPTIONS)
      setStats(MOCK_STATS)
    } catch (error) {
      console.error('[ExceptionQueue] Failed to fetch exceptions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Set up polling
  useEffect(() => {
    if (pollingInterval > 0 && !sseEndpoint) {
      fetchExceptions()
      pollingRef.current = window.setInterval(fetchExceptions, pollingInterval)
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
        }
      }
    }
    return undefined
  }, [pollingInterval, sseEndpoint, fetchExceptions])

  // Set up SSE
  useEffect(() => {
    if (sseEndpoint) {
      sseRef.current = new EventSource(sseEndpoint)

      sseRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'exception_update') {
            setExceptions((prev) => {
              const idx = prev.findIndex((e) => e.id === data.exception.id)
              if (idx >= 0) {
                const updated = [...prev]
                updated[idx] = data.exception
                return updated
              }
              return [data.exception, ...prev]
            })
          } else if (data.type === 'stats_update') {
            setStats(data.stats)
          }
        } catch (error) {
          console.error('[ExceptionQueue] SSE parse error:', error)
        }
      }

      sseRef.current.onerror = () => {
        console.error('[ExceptionQueue] SSE connection error')
        sseRef.current?.close()
        // Fall back to polling
        if (pollingInterval > 0) {
          pollingRef.current = window.setInterval(fetchExceptions, pollingInterval)
        }
      }

      return () => {
        sseRef.current?.close()
      }
    }
    return undefined
  }, [sseEndpoint, pollingInterval, fetchExceptions])

  // Initial fetch
  useEffect(() => {
    if (!sseEndpoint) {
      fetchExceptions()
    }
  }, [fetchExceptions, sseEndpoint])

  // Selection handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredExceptions.map((e) => e.id)))
  }, [filteredExceptions])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Action handlers
  const handleRetry = useCallback(
    async (item: ExceptionQueueItem) => {
      if (onRetry) {
        const success = await onRetry(item)
        if (success) {
          setExceptions((prev) =>
            prev.map((e) =>
              e.id === item.id
                ? { ...e, status: 'in_progress' as ExceptionStatus, context: { ...e.context, retryCount: e.context.retryCount + 1 } }
                : e
            )
          )
          if (notificationsEnabled && onNotify) {
            onNotify(item, `Retry initiated for ${item.workflowName}`)
          }
        }
      } else {
        // Mock retry
        setExceptions((prev) =>
          prev.map((e) =>
            e.id === item.id
              ? { ...e, status: 'in_progress' as ExceptionStatus, context: { ...e.context, retryCount: e.context.retryCount + 1 } }
              : e
          )
        )
      }
    },
    [onRetry, onNotify, notificationsEnabled]
  )

  const handleSkip = useCallback(
    async (item: ExceptionQueueItem, reason: string) => {
      if (onSkip) {
        const success = await onSkip(item, reason)
        if (success) {
          setExceptions((prev) =>
            prev.map((e) =>
              e.id === item.id ? { ...e, status: 'skipped' as ExceptionStatus, resolution: reason } : e
            )
          )
        }
      } else {
        // Mock skip
        setExceptions((prev) =>
          prev.map((e) =>
            e.id === item.id ? { ...e, status: 'skipped' as ExceptionStatus, resolution: reason } : e
          )
        )
      }
      setSkipItem(null)
    },
    [onSkip]
  )

  const handleManualOverride = useCallback(
    async (item: ExceptionQueueItem, overrideData: unknown) => {
      if (onManualOverride) {
        const success = await onManualOverride(item, overrideData)
        if (success) {
          setExceptions((prev) =>
            prev.map((e) =>
              e.id === item.id
                ? { ...e, status: 'resolved' as ExceptionStatus, resolution: 'Manual override applied' }
                : e
            )
          )
        }
      } else {
        // Mock override
        setExceptions((prev) =>
          prev.map((e) =>
            e.id === item.id
              ? { ...e, status: 'resolved' as ExceptionStatus, resolution: 'Manual override applied' }
              : e
          )
        )
      }
      setOverrideItem(null)
    },
    [onManualOverride]
  )

  const handleEscalate = useCallback(
    async (item: ExceptionQueueItem, escalateTo: string, notes: string) => {
      if (onEscalate) {
        const success = await onEscalate(item, escalateTo, notes)
        if (success) {
          setExceptions((prev) =>
            prev.map((e) =>
              e.id === item.id
                ? {
                    ...e,
                    status: 'escalated' as ExceptionStatus,
                    escalateTo,
                    escalatedAt: new Date().toISOString(),
                    notes: [...(e.notes || []), notes].filter(Boolean),
                  }
                : e
            )
          )
        }
      } else {
        // Mock escalate
        setExceptions((prev) =>
          prev.map((e) =>
            e.id === item.id
              ? {
                  ...e,
                  status: 'escalated' as ExceptionStatus,
                  escalateTo,
                  escalatedAt: new Date().toISOString(),
                  notes: [...(e.notes || []), notes].filter(Boolean),
                }
              : e
          )
        )
      }
      setEscalateItem(null)
    },
    [onEscalate]
  )

  // Bulk action handlers
  const handleBulkRetry = useCallback(async () => {
    const selected = filteredExceptions.filter((e) => selectedIds.has(e.id))
    for (const item of selected) {
      if (item.context.retryCount < item.context.maxRetries && item.status === 'pending') {
        await handleRetry(item)
      }
    }
    deselectAll()
  }, [filteredExceptions, selectedIds, handleRetry, deselectAll])

  const handleBulkSkip = useCallback(() => {
    // For bulk skip, we'd typically show a dialog to get the reason
    // For now, just skip with a generic reason
    const selected = filteredExceptions.filter((e) => selectedIds.has(e.id))
    for (const item of selected) {
      if (item.status === 'pending' || item.status === 'in_progress') {
        handleSkip(item, 'Bulk skip action')
      }
    }
    deselectAll()
  }, [filteredExceptions, selectedIds, handleSkip, deselectAll])

  const handleBulkEscalate = useCallback(() => {
    // For bulk escalate, we'd show a dialog
    // For now, just escalate the first selected item
    const selected = filteredExceptions.filter((e) => selectedIds.has(e.id))
    if (selected.length > 0) {
      setEscalateItem(selected[0])
    }
  }, [filteredExceptions, selectedIds])

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      priority: 'all',
      status: 'all',
      errorType: 'all',
      workflowType: 'all',
      ageRange: 'all',
    })
  }, [])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Exception Queue</h2>
          <p className="text-sm text-slate-400 mt-1">
            {stats.pending} pending exception{stats.pending !== 1 ? 's' : ''} requiring attention
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            {notificationsEnabled ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4 text-slate-500" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchExceptions} disabled={isLoading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* Filters */}
      <FilterBar filters={filters} onFilterChange={setFilters} onClearFilters={clearFilters} />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onRetryAll={handleBulkRetry}
        onSkipAll={handleBulkSkip}
        onEscalateAll={handleBulkEscalate}
        onDeselectAll={deselectAll}
      />

      {/* Select All / Item Count */}
      {filteredExceptions.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={selectedIds.size === filteredExceptions.length ? deselectAll : selectAll}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {selectedIds.size === filteredExceptions.length ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-slate-500">
            Showing {filteredExceptions.length} of {exceptions.length} exceptions
          </span>
        </div>
      )}

      {/* Exception List */}
      {isLoading && exceptions.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-800/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredExceptions.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No exceptions found</h3>
          <p className="text-sm text-slate-500">
            {exceptions.length > 0
              ? 'Try adjusting your filters to see more results'
              : 'All workflows are running smoothly'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExceptions.map((item) => (
            <ExceptionItem
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              isExpanded={expandedIds.has(item.id)}
              onSelect={() => toggleSelect(item.id)}
              onExpand={() => toggleExpand(item.id)}
              onRetry={() => handleRetry(item)}
              onSkip={() => setSkipItem(item)}
              onManualOverride={() => setOverrideItem(item)}
              onEscalate={() => setEscalateItem(item)}
              onViewDetails={() => setDetailItem(item)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <DetailDialog
        item={detailItem}
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        onRetry={() => {
          if (detailItem) handleRetry(detailItem)
          setDetailItem(null)
        }}
        onSkip={() => {
          setSkipItem(detailItem)
          setDetailItem(null)
        }}
        onManualOverride={() => {
          setOverrideItem(detailItem)
          setDetailItem(null)
        }}
        onEscalate={() => {
          setEscalateItem(detailItem)
          setDetailItem(null)
        }}
      />

      <SkipDialog
        item={skipItem}
        open={!!skipItem}
        onClose={() => setSkipItem(null)}
        onConfirm={(reason) => skipItem && handleSkip(skipItem, reason)}
      />

      <EscalateDialog
        item={escalateItem}
        open={!!escalateItem}
        onClose={() => setEscalateItem(null)}
        onConfirm={(escalateTo, notes) =>
          escalateItem && handleEscalate(escalateItem, escalateTo, notes)
        }
      />

      <ManualOverrideDialog
        item={overrideItem}
        open={!!overrideItem}
        onClose={() => setOverrideItem(null)}
        onConfirm={(overrideData) =>
          overrideItem && handleManualOverride(overrideItem, overrideData)
        }
      />
    </div>
  )
}

// =============================================================================
// HOOK FOR USING EXCEPTION QUEUE
// =============================================================================

export function useExceptionQueueData(userId?: string) {
  const [exceptions, setExceptions] = useState<ExceptionQueueItem[]>([])
  const [stats, setStats] = useState<ExceptionQueueStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // In production, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      setExceptions(MOCK_EXCEPTIONS)
      setStats(MOCK_STATS)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exceptions')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    exceptions,
    stats,
    isLoading,
    error,
    refresh,
  }
}

export default ExceptionQueue

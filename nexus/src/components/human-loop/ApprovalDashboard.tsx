import { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  User,
  Timer,
  TrendingUp,
  BarChart3,
  Calendar,
  Workflow,
  Bell,
  RefreshCw,
  ExternalLink,
  MoreHorizontal,
  CheckCheck,
  AlertCircle,
  FileText,
  Zap,
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated' | 'expired'
type ApprovalUrgency = 'low' | 'medium' | 'high' | 'critical'
type ApprovalType = 'workflow' | 'data' | 'access' | 'financial' | 'content' | 'system'

interface ApprovalItem {
  id: string
  title: string
  description: string
  type: ApprovalType
  urgency: ApprovalUrgency
  status: ApprovalStatus
  workflowId: string
  workflowName: string
  requesterId: string
  requesterName: string
  requesterAvatar?: string
  assigneeId: string
  assigneeName: string
  createdAt: string
  dueAt: string
  slaDeadline: string
  metadata: Record<string, unknown>
  comments: number
  attachments: number
}

interface ExceptionQueueItem {
  id: string
  title: string
  description: string
  workflowId: string
  workflowName: string
  errorType: 'validation' | 'timeout' | 'system' | 'policy' | 'data'
  severity: 'low' | 'medium' | 'high' | 'critical'
  occurredAt: string
  assignedTo?: string
  status: 'open' | 'in_progress' | 'resolved' | 'escalated'
}

interface DashboardStats {
  pendingCount: number
  approvedToday: number
  rejectedToday: number
  avgApprovalTimeMinutes: number
  slaComplianceRate: number
  exceptionsOpen: number
  exceptionsResolved: number
}

interface TeamMember {
  id: string
  name: string
  avatar?: string
  pendingCount: number
  role: 'approver' | 'requester'
}

type TabValue = 'my-approvals' | 'my-requests' | 'exceptions' | 'team'
type FilterUrgency = 'all' | ApprovalUrgency
type FilterType = 'all' | ApprovalType
type FilterDateRange = 'today' | 'week' | 'month' | 'all'

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_APPROVALS: ApprovalItem[] = [
  {
    id: 'apr-001',
    title: 'Data Export Request - Customer Analytics',
    description: 'Request to export customer engagement data for Q4 analysis report.',
    type: 'data',
    urgency: 'high',
    status: 'pending',
    workflowId: 'wf-analytics-001',
    workflowName: 'Customer Analytics Pipeline',
    requesterId: 'user-002',
    requesterName: 'Sarah Chen',
    assigneeId: 'user-001',
    assigneeName: 'Current User',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    dueAt: new Date(Date.now() + 4 * 3600000).toISOString(),
    slaDeadline: new Date(Date.now() + 6 * 3600000).toISOString(),
    metadata: { dataSize: '2.4GB', recordCount: 150000 },
    comments: 3,
    attachments: 1,
  },
  {
    id: 'apr-002',
    title: 'Access Permission - Production Database',
    description: 'Requesting read access to production database for debugging critical issue.',
    type: 'access',
    urgency: 'critical',
    status: 'pending',
    workflowId: 'wf-access-002',
    workflowName: 'Access Control Workflow',
    requesterId: 'user-003',
    requesterName: 'Mike Johnson',
    assigneeId: 'user-001',
    assigneeName: 'Current User',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    dueAt: new Date(Date.now() + 2 * 3600000).toISOString(),
    slaDeadline: new Date(Date.now() + 1 * 3600000).toISOString(),
    metadata: { database: 'prod-main', accessLevel: 'read-only', duration: '4 hours' },
    comments: 5,
    attachments: 0,
  },
  {
    id: 'apr-003',
    title: 'Financial Approval - Marketing Campaign Budget',
    description: 'Budget approval required for Q1 digital marketing campaign expansion.',
    type: 'financial',
    urgency: 'medium',
    status: 'pending',
    workflowId: 'wf-finance-003',
    workflowName: 'Budget Approval Process',
    requesterId: 'user-004',
    requesterName: 'Emily Davis',
    assigneeId: 'user-001',
    assigneeName: 'Current User',
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    dueAt: new Date(Date.now() + 48 * 3600000).toISOString(),
    slaDeadline: new Date(Date.now() + 72 * 3600000).toISOString(),
    metadata: { amount: 25000, currency: 'USD', department: 'Marketing' },
    comments: 2,
    attachments: 3,
  },
  {
    id: 'apr-004',
    title: 'Content Publication - Press Release',
    description: 'Review and approve press release for new product launch announcement.',
    type: 'content',
    urgency: 'high',
    status: 'pending',
    workflowId: 'wf-content-004',
    workflowName: 'Content Approval Pipeline',
    requesterId: 'user-005',
    requesterName: 'Alex Thompson',
    assigneeId: 'user-001',
    assigneeName: 'Current User',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    dueAt: new Date(Date.now() + 8 * 3600000).toISOString(),
    slaDeadline: new Date(Date.now() + 12 * 3600000).toISOString(),
    metadata: { wordCount: 850, targetAudience: 'Industry Press' },
    comments: 7,
    attachments: 2,
  },
  {
    id: 'apr-005',
    title: 'Workflow Change - Invoice Processing Update',
    description: 'Approval needed for changes to the automated invoice processing workflow.',
    type: 'workflow',
    urgency: 'low',
    status: 'pending',
    workflowId: 'wf-invoice-005',
    workflowName: 'Invoice Processing',
    requesterId: 'user-006',
    requesterName: 'Chris Wilson',
    assigneeId: 'user-001',
    assigneeName: 'Current User',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    dueAt: new Date(Date.now() + 120 * 3600000).toISOString(),
    slaDeadline: new Date(Date.now() + 168 * 3600000).toISOString(),
    metadata: { changesCount: 5, impactedNodes: ['validation', 'notification'] },
    comments: 1,
    attachments: 1,
  },
]

const MOCK_MY_REQUESTS: ApprovalItem[] = [
  {
    id: 'req-001',
    title: 'API Integration - Salesforce CRM',
    description: 'Request to enable Salesforce integration for lead sync workflow.',
    type: 'system',
    urgency: 'medium',
    status: 'pending',
    workflowId: 'wf-integration-001',
    workflowName: 'CRM Integration',
    requesterId: 'user-001',
    requesterName: 'Current User',
    assigneeId: 'user-007',
    assigneeName: 'IT Admin',
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    dueAt: new Date(Date.now() + 36 * 3600000).toISOString(),
    slaDeadline: new Date(Date.now() + 48 * 3600000).toISOString(),
    metadata: { integration: 'salesforce', scope: ['leads', 'contacts'] },
    comments: 2,
    attachments: 0,
  },
  {
    id: 'req-002',
    title: 'Data Access - Historical Reports',
    description: 'Requesting access to historical analytics data for trend analysis.',
    type: 'data',
    urgency: 'low',
    status: 'approved',
    workflowId: 'wf-data-002',
    workflowName: 'Data Access Request',
    requesterId: 'user-001',
    requesterName: 'Current User',
    assigneeId: 'user-008',
    assigneeName: 'Data Team Lead',
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    dueAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    slaDeadline: new Date(Date.now() - 12 * 3600000).toISOString(),
    metadata: { dateRange: '2024-Q1 to 2024-Q4' },
    comments: 4,
    attachments: 1,
  },
  {
    id: 'req-003',
    title: 'Budget Increase - Cloud Infrastructure',
    description: 'Request for additional cloud infrastructure budget allocation.',
    type: 'financial',
    urgency: 'high',
    status: 'rejected',
    workflowId: 'wf-budget-003',
    workflowName: 'Budget Request',
    requesterId: 'user-001',
    requesterName: 'Current User',
    assigneeId: 'user-009',
    assigneeName: 'Finance Director',
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    dueAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    slaDeadline: new Date(Date.now() - 36 * 3600000).toISOString(),
    metadata: { requestedAmount: 15000, reason: 'Scaling requirements' },
    comments: 6,
    attachments: 2,
  },
]

const MOCK_EXCEPTIONS: ExceptionQueueItem[] = [
  {
    id: 'exc-001',
    title: 'Validation Failed - Customer Import',
    description: 'Customer data import failed validation due to missing required fields.',
    workflowId: 'wf-import-001',
    workflowName: 'Customer Import Pipeline',
    errorType: 'validation',
    severity: 'medium',
    occurredAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    assignedTo: 'user-001',
    status: 'open',
  },
  {
    id: 'exc-002',
    title: 'API Timeout - Payment Processing',
    description: 'Payment gateway API timeout during transaction processing.',
    workflowId: 'wf-payment-002',
    workflowName: 'Payment Processing',
    errorType: 'timeout',
    severity: 'high',
    occurredAt: new Date(Date.now() - 30 * 60000).toISOString(),
    assignedTo: 'user-001',
    status: 'in_progress',
  },
  {
    id: 'exc-003',
    title: 'Policy Violation - Data Export',
    description: 'Attempted data export exceeded daily limit policy.',
    workflowId: 'wf-export-003',
    workflowName: 'Data Export Service',
    errorType: 'policy',
    severity: 'low',
    occurredAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    status: 'open',
  },
  {
    id: 'exc-004',
    title: 'System Error - Email Notification',
    description: 'SMTP server connection failure during notification dispatch.',
    workflowId: 'wf-notify-004',
    workflowName: 'Notification Service',
    errorType: 'system',
    severity: 'critical',
    occurredAt: new Date(Date.now() - 15 * 60000).toISOString(),
    assignedTo: 'user-001',
    status: 'escalated',
  },
]

const MOCK_STATS: DashboardStats = {
  pendingCount: 5,
  approvedToday: 12,
  rejectedToday: 2,
  avgApprovalTimeMinutes: 45,
  slaComplianceRate: 94.5,
  exceptionsOpen: 3,
  exceptionsResolved: 8,
}

const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { id: 'user-002', name: 'Sarah Chen', pendingCount: 3, role: 'approver' },
  { id: 'user-003', name: 'Mike Johnson', pendingCount: 7, role: 'approver' },
  { id: 'user-004', name: 'Emily Davis', pendingCount: 2, role: 'approver' },
  { id: 'user-005', name: 'Alex Thompson', pendingCount: 5, role: 'approver' },
]

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const urgencyConfig: Record<ApprovalUrgency, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-slate-400', bgColor: 'bg-slate-500/10 border-slate-500/20' },
  medium: { label: 'Medium', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
  high: { label: 'High', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  critical: { label: 'Critical', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' },
}

const typeConfig: Record<ApprovalType, { label: string; icon: React.ReactNode; color: string }> = {
  workflow: { label: 'Workflow', icon: <Workflow className="w-4 h-4" />, color: 'text-purple-400' },
  data: { label: 'Data', icon: <FileText className="w-4 h-4" />, color: 'text-cyan-400' },
  access: { label: 'Access', icon: <User className="w-4 h-4" />, color: 'text-green-400' },
  financial: { label: 'Financial', icon: <TrendingUp className="w-4 h-4" />, color: 'text-amber-400' },
  content: { label: 'Content', icon: <FileText className="w-4 h-4" />, color: 'text-blue-400' },
  system: { label: 'System', icon: <Zap className="w-4 h-4" />, color: 'text-pink-400' },
}

const statusConfig: Record<ApprovalStatus, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  pending: { label: 'Pending', icon: <Clock className="w-4 h-4" />, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  approved: { label: 'Approved', icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  rejected: { label: 'Rejected', icon: <XCircle className="w-4 h-4" />, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  escalated: { label: 'Escalated', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  expired: { label: 'Expired', icon: <Timer className="w-4 h-4" />, color: 'text-slate-400', bgColor: 'bg-slate-500/10' },
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

function formatTimeUntil(dateString: string): { text: string; isOverdue: boolean; isUrgent: boolean } {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMs < 0) {
    const absDiffHours = Math.abs(diffHours)
    return { text: `${absDiffHours}h overdue`, isOverdue: true, isUrgent: true }
  }
  if (diffMins < 60) return { text: `${diffMins}m left`, isOverdue: false, isUrgent: diffMins < 30 }
  if (diffHours < 24) return { text: `${diffHours}h left`, isOverdue: false, isUrgent: diffHours < 4 }
  return { text: `${diffDays}d left`, isOverdue: false, isUrgent: false }
}

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; isPositive: boolean }
  color: string
}

function StatCard({ title, value, subtitle, icon, trend, color }: StatCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className={cn('p-2 rounded-lg w-fit mb-3', `bg-${color}-500/20`)}>
              <div className={`text-${color}-400`}>{icon}</div>
            </div>
            <div className="text-sm text-slate-400 mb-1">{title}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            {subtitle && (
              <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
            )}
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              trend.isPositive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
            )}>
              <TrendingUp className={cn('w-3 h-3', !trend.isPositive && 'rotate-180')} />
              {trend.value}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MINI CHART COMPONENT
// =============================================================================

interface MiniChartProps {
  data: number[]
  color: string
  height?: number
}

function MiniChart({ data, color, height = 40 }: MiniChartProps) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((value, index) => {
        const normalizedHeight = ((value - min) / range) * 100
        return (
          <div
            key={index}
            className={cn('flex-1 rounded-t transition-all', `bg-${color}-500`)}
            style={{ height: `${Math.max(normalizedHeight, 10)}%`, opacity: 0.6 + (index / data.length) * 0.4 }}
          />
        )
      })}
    </div>
  )
}

// =============================================================================
// APPROVAL ITEM COMPONENT
// =============================================================================

interface ApprovalItemCardProps {
  item: ApprovalItem
  showActions?: boolean
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onView?: (id: string) => void
}

function ApprovalItemCard({ item, showActions = true, onApprove, onReject, onView }: ApprovalItemCardProps) {
  const [expanded, setExpanded] = useState(false)
  const timeUntil = formatTimeUntil(item.dueAt)
  const slaTime = formatTimeUntil(item.slaDeadline)
  const urgency = urgencyConfig[item.urgency]
  const type = typeConfig[item.type]
  const status = statusConfig[item.status]

  return (
    <Card className={cn(
      'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-all',
      item.urgency === 'critical' && 'border-red-500/30 hover:border-red-500/50',
      timeUntil.isOverdue && 'border-red-500/50'
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-slate-700/50 transition-colors mt-0.5"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-white font-medium truncate">{item.title}</h4>
                  <Badge className={cn('text-xs', urgency.bgColor, urgency.color)}>
                    {urgency.label}
                  </Badge>
                  <Badge className={cn('text-xs', status.bgColor, status.color)}>
                    <span className="flex items-center gap-1">
                      {status.icon}
                      {status.label}
                    </span>
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mt-1 line-clamp-1">{item.description}</p>
              </div>

              {showActions && item.status === 'pending' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onReject?.(item.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => onApprove?.(item.id)}
                    className="bg-green-500/20 text-green-400 hover:bg-green-500/30"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </div>
              )}
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
              <span className={cn('flex items-center gap-1', type.color)}>
                {type.icon}
                {type.label}
              </span>
              <span className="flex items-center gap-1">
                <Workflow className="w-3 h-3" />
                {item.workflowName}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {item.requesterName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(item.createdAt)}
              </span>
              <span className={cn(
                'flex items-center gap-1 font-medium',
                timeUntil.isOverdue ? 'text-red-400' : timeUntil.isUrgent ? 'text-amber-400' : 'text-slate-400'
              )}>
                <Timer className="w-3 h-3" />
                {timeUntil.text}
              </span>
            </div>

            {/* Expanded Content */}
            {expanded && (
              <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* SLA Info */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">SLA Deadline:</span>
                    <span className={cn(
                      'font-medium',
                      slaTime.isOverdue ? 'text-red-400' : slaTime.isUrgent ? 'text-amber-400' : 'text-slate-300'
                    )}>
                      {slaTime.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Comments:</span>
                    <span className="text-slate-300">{item.comments}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Attachments:</span>
                    <span className="text-slate-300">{item.attachments}</span>
                  </div>
                </div>

                {/* Metadata */}
                {Object.keys(item.metadata).length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-2">Additional Details</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(item.metadata).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                          <span className="text-slate-300">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onView?.(item.id)}
                    className="text-slate-300"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// EXCEPTION ITEM COMPONENT
// =============================================================================

interface ExceptionItemCardProps {
  item: ExceptionQueueItem
  onResolve?: (id: string) => void
  onEscalate?: (id: string) => void
}

function ExceptionItemCard({ item, onResolve, onEscalate }: ExceptionItemCardProps) {
  const severityColors = {
    low: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    medium: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    high: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  }

  const statusColors = {
    open: 'text-amber-400 bg-amber-500/10',
    in_progress: 'text-blue-400 bg-blue-500/10',
    resolved: 'text-green-400 bg-green-500/10',
    escalated: 'text-orange-400 bg-orange-500/10',
  }

  const errorTypeIcons = {
    validation: <FileText className="w-4 h-4" />,
    timeout: <Timer className="w-4 h-4" />,
    system: <AlertCircle className="w-4 h-4" />,
    policy: <AlertTriangle className="w-4 h-4" />,
    data: <FileText className="w-4 h-4" />,
  }

  return (
    <Card className={cn(
      'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-all',
      item.severity === 'critical' && 'border-red-500/30'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('text-red-400', severityColors[item.severity])}>
                {errorTypeIcons[item.errorType]}
              </span>
              <h4 className="text-white font-medium truncate">{item.title}</h4>
              <Badge className={cn('text-xs', severityColors[item.severity])}>
                {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
              </Badge>
              <Badge className={cn('text-xs', statusColors[item.status])}>
                {item.status.replace('_', ' ').charAt(0).toUpperCase() + item.status.replace('_', ' ').slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mb-2">{item.description}</p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Workflow className="w-3 h-3" />
                {item.workflowName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(item.occurredAt)}
              </span>
              {item.assignedTo && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Assigned
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {item.status !== 'resolved' && item.status !== 'escalated' && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEscalate?.(item.id)}
                  className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                >
                  <AlertTriangle className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => onResolve?.(item.id)}
                  className="bg-green-500/20 text-green-400 hover:bg-green-500/30"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Resolve
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// FILTER BAR COMPONENT
// =============================================================================

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  urgencyFilter: FilterUrgency
  onUrgencyChange: (urgency: FilterUrgency) => void
  typeFilter: FilterType
  onTypeChange: (type: FilterType) => void
  dateRangeFilter: FilterDateRange
  onDateRangeChange: (range: FilterDateRange) => void
  onRefresh: () => void
}

function FilterBar({
  searchQuery,
  onSearchChange,
  urgencyFilter,
  onUrgencyChange,
  typeFilter,
  onTypeChange,
  dateRangeFilter,
  onDateRangeChange,
  onRefresh,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search approvals..."
          className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Urgency Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={urgencyFilter}
          onChange={(e) => onUrgencyChange(e.target.value as FilterUrgency)}
          className="px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Urgency</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Type Filter */}
      <select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value as FilterType)}
        className="px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
      >
        <option value="all">All Types</option>
        <option value="workflow">Workflow</option>
        <option value="data">Data</option>
        <option value="access">Access</option>
        <option value="financial">Financial</option>
        <option value="content">Content</option>
        <option value="system">System</option>
      </select>

      {/* Date Range Filter */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-400" />
        <select
          value={dateRangeFilter}
          onChange={(e) => onDateRangeChange(e.target.value as FilterDateRange)}
          className="px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Refresh Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        className="text-slate-400 hover:text-white"
      >
        <RefreshCw className="w-4 h-4" />
      </Button>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export interface ApprovalDashboardProps {
  className?: string
  isManager?: boolean
}

export function ApprovalDashboard({ className = '', isManager = false }: ApprovalDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('my-approvals')
  const [approvals, setApprovals] = useState<ApprovalItem[]>(MOCK_APPROVALS)
  const [myRequests, _setMyRequests] = useState<ApprovalItem[]>(MOCK_MY_REQUESTS)
  const [exceptions, setExceptions] = useState<ExceptionQueueItem[]>(MOCK_EXCEPTIONS)
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS)
  const [teamMembers] = useState<TeamMember[]>(MOCK_TEAM_MEMBERS)
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState<FilterUrgency>('all')
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [dateRangeFilter, setDateRangeFilter] = useState<FilterDateRange>('all')

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      setLoading(false)
    }
    loadData()
  }, [])

  // Filter items based on current filters
  const filterItems = useCallback((items: ApprovalItem[]) => {
    return items.filter(item => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.workflowName.toLowerCase().includes(query) ||
          item.requesterName.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Urgency filter
      if (urgencyFilter !== 'all' && item.urgency !== urgencyFilter) return false

      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false

      // Date range filter
      if (dateRangeFilter !== 'all') {
        const itemDate = new Date(item.createdAt)
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(today.getTime() - 7 * 24 * 3600000)
        const monthAgo = new Date(today.getTime() - 30 * 24 * 3600000)

        if (dateRangeFilter === 'today' && itemDate < today) return false
        if (dateRangeFilter === 'week' && itemDate < weekAgo) return false
        if (dateRangeFilter === 'month' && itemDate < monthAgo) return false
      }

      return true
    })
  }, [searchQuery, urgencyFilter, typeFilter, dateRangeFilter])

  const filteredApprovals = useMemo(() => filterItems(approvals), [filterItems, approvals])
  const filteredRequests = useMemo(() => filterItems(myRequests), [filterItems, myRequests])

  // Handlers
  const handleApprove = useCallback((id: string) => {
    setApprovals(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'approved' as ApprovalStatus } : item
    ))
    setStats(prev => ({
      ...prev,
      pendingCount: prev.pendingCount - 1,
      approvedToday: prev.approvedToday + 1,
    }))
  }, [])

  const handleReject = useCallback((id: string) => {
    setApprovals(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'rejected' as ApprovalStatus } : item
    ))
    setStats(prev => ({
      ...prev,
      pendingCount: prev.pendingCount - 1,
      rejectedToday: prev.rejectedToday + 1,
    }))
  }, [])

  const handleResolveException = useCallback((id: string) => {
    setExceptions(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'resolved' as const } : item
    ))
    setStats(prev => ({
      ...prev,
      exceptionsOpen: prev.exceptionsOpen - 1,
      exceptionsResolved: prev.exceptionsResolved + 1,
    }))
  }, [])

  const handleEscalateException = useCallback((id: string) => {
    setExceptions(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'escalated' as const } : item
    ))
    setStats(prev => ({
      ...prev,
      exceptionsOpen: prev.exceptionsOpen - 1,
    }))
  }, [])

  const handleRefresh = useCallback(() => {
    setLoading(true)
    setTimeout(() => setLoading(false), 500)
  }, [])

  // Pending counts for badges
  const pendingApprovalCount = approvals.filter(a => a.status === 'pending').length
  const pendingRequestCount = myRequests.filter(r => r.status === 'pending').length
  const openExceptionCount = exceptions.filter(e => e.status === 'open' || e.status === 'in_progress').length
  const teamPendingCount = teamMembers.reduce((sum, m) => sum + m.pendingCount, 0)

  // Approval time chart data (mock)
  const approvalTimeData = [35, 42, 38, 55, 48, 45, 42]

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-20', className)}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading approval dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Approval Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage approvals, requests, and exceptions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="text-slate-300">
            <Bell className="w-4 h-4 mr-2" />
            Set Alerts
          </Button>
          <Button variant="default" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Pending Approvals"
          value={stats.pendingCount}
          subtitle="Requires your action"
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Approved Today"
          value={stats.approvedToday}
          subtitle={`${stats.rejectedToday} rejected`}
          icon={<CheckCircle className="w-5 h-5" />}
          trend={{ value: 12, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Avg. Approval Time"
          value={`${stats.avgApprovalTimeMinutes}m`}
          subtitle="Last 7 days"
          icon={<Timer className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="SLA Compliance"
          value={`${stats.slaComplianceRate}%`}
          subtitle={`${stats.exceptionsOpen} exceptions open`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 2.5, isPositive: true }}
          color="cyan"
        />
      </div>

      {/* Mini Chart Card */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-medium">Approval Time Trend</h3>
              <p className="text-sm text-slate-400">Average minutes per approval (last 7 days)</p>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-slate-400">45m avg</span>
            </div>
          </div>
          <MiniChart data={approvalTimeData} color="cyan" height={60} />
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-slate-700/50">
        <div className="flex items-center gap-1 -mb-px">
          <TabButton
            active={activeTab === 'my-approvals'}
            onClick={() => setActiveTab('my-approvals')}
            badge={pendingApprovalCount}
          >
            My Pending Approvals
          </TabButton>
          <TabButton
            active={activeTab === 'my-requests'}
            onClick={() => setActiveTab('my-requests')}
            badge={pendingRequestCount}
          >
            My Requests
          </TabButton>
          <TabButton
            active={activeTab === 'exceptions'}
            onClick={() => setActiveTab('exceptions')}
            badge={openExceptionCount}
            badgeColor="red"
          >
            Exception Queue
          </TabButton>
          {isManager && (
            <TabButton
              active={activeTab === 'team'}
              onClick={() => setActiveTab('team')}
              badge={teamPendingCount}
              badgeColor="purple"
            >
              Team Approvals
            </TabButton>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        urgencyFilter={urgencyFilter}
        onUrgencyChange={setUrgencyFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        dateRangeFilter={dateRangeFilter}
        onDateRangeChange={setDateRangeFilter}
        onRefresh={handleRefresh}
      />

      {/* Tab Content */}
      <div className="space-y-3">
        {activeTab === 'my-approvals' && (
          <>
            {filteredApprovals.length === 0 ? (
              <EmptyState
                icon={<CheckCircle className="w-12 h-12 text-green-400" />}
                title="All caught up!"
                description="You have no pending approvals at the moment."
              />
            ) : (
              filteredApprovals.map(item => (
                <ApprovalItemCard
                  key={item.id}
                  item={item}
                  showActions={true}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'my-requests' && (
          <>
            {filteredRequests.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-12 h-12 text-slate-400" />}
                title="No requests found"
                description="You haven't submitted any approval requests yet."
              />
            ) : (
              filteredRequests.map(item => (
                <ApprovalItemCard
                  key={item.id}
                  item={item}
                  showActions={false}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'exceptions' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-400">
                  Open: <span className="text-amber-400 font-medium">{stats.exceptionsOpen}</span>
                </span>
                <span className="text-slate-400">
                  Resolved Today: <span className="text-green-400 font-medium">{stats.exceptionsResolved}</span>
                </span>
              </div>
            </div>
            {exceptions.length === 0 ? (
              <EmptyState
                icon={<CheckCheck className="w-12 h-12 text-green-400" />}
                title="No exceptions"
                description="All exceptions have been resolved."
              />
            ) : (
              exceptions.map(item => (
                <ExceptionItemCard
                  key={item.id}
                  item={item}
                  onResolve={handleResolveException}
                  onEscalate={handleEscalateException}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'team' && isManager && (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Team Overview</CardTitle>
                <CardDescription>Monitor team approval workload</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-medium">{member.name}</div>
                          <div className="text-xs text-slate-400 capitalize">{member.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={cn(
                          'text-xs',
                          member.pendingCount > 5
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : member.pendingCount > 2
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-green-500/10 text-green-400 border-green-500/20'
                        )}>
                          {member.pendingCount} pending
                        </Badge>
                        <Button size="sm" variant="ghost" className="text-slate-400">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// TAB BUTTON COMPONENT
// =============================================================================

interface TabButtonProps {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  badge?: number
  badgeColor?: 'cyan' | 'red' | 'purple'
}

function TabButton({ children, active, onClick, badge, badgeColor = 'cyan' }: TabButtonProps) {
  const badgeColors = {
    cyan: 'bg-cyan-500/20 text-cyan-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400',
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2',
        active
          ? 'border-cyan-500 text-white'
          : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
      )}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className={cn(
          'px-1.5 py-0.5 text-xs font-medium rounded-full',
          badgeColors[badgeColor]
        )}>
          {badge}
        </span>
      )}
    </button>
  )
}

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 opacity-50">{icon}</div>
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md">{description}</p>
    </div>
  )
}

export default ApprovalDashboard

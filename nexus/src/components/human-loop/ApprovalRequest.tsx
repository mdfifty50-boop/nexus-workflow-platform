import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertTriangle,
  Clock,
  User,
  GitBranch,
  Shield,
  Paperclip,
  Eye,
  ChevronDown,
  ChevronUp,
  History,
  FileText,
  Pen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

// Types
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'info_requested' | 'escalated'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ApprovalType = 'workflow_execution' | 'data_access' | 'configuration_change' | 'user_action' | 'financial' | 'security'

export interface Requestor {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
  department?: string
}

export interface WorkflowContext {
  workflowId: string
  workflowName: string
  stepId?: string
  stepName?: string
  triggerType?: string
  executionId?: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  previewUrl?: string
}

export interface AuditEntry {
  id: string
  timestamp: string
  action: string
  actor: Requestor
  comment?: string
  previousStatus?: ApprovalStatus
  newStatus?: ApprovalStatus
}

export interface ApprovalRequestData {
  id: string
  title: string
  description: string
  type: ApprovalType
  status: ApprovalStatus
  riskLevel: RiskLevel
  requestor: Requestor
  workflowContext?: WorkflowContext
  createdAt: string
  dueAt?: string
  slaHours?: number
  details?: Record<string, unknown>
  attachments?: Attachment[]
  auditTrail?: AuditEntry[]
  requiresSignature?: boolean
  conditionalFields?: ConditionalField[]
}

export interface ConditionalField {
  id: string
  label: string
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date'
  required: boolean
  options?: string[]
  condition?: {
    approvalType: ApprovalType[]
    riskLevel?: RiskLevel[]
  }
  value?: string | number | boolean
}

export interface ApprovalRequestProps {
  request: ApprovalRequestData
  onApprove?: (requestId: string, comments: string, signature?: string, additionalFields?: Record<string, unknown>) => void
  onReject?: (requestId: string, reason: string) => void
  onRequestInfo?: (requestId: string, questions: string) => void
  onEscalate?: (requestId: string, reason: string, escalateTo?: string) => void
  onViewAttachment?: (attachment: Attachment) => void
  isLoading?: boolean
  showAuditTrail?: boolean
  className?: string
}

// Mock data for demonstration
export const mockApprovalRequest: ApprovalRequestData = {
  id: 'apr_001',
  title: 'Approve Customer Data Export',
  description: 'Request to export customer data from CRM for quarterly marketing analysis. This includes contact information, purchase history, and engagement metrics.',
  type: 'data_access',
  status: 'pending',
  riskLevel: 'medium',
  requestor: {
    id: 'usr_001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'Marketing Manager',
    department: 'Marketing',
  },
  workflowContext: {
    workflowId: 'wf_crm_export',
    workflowName: 'CRM Data Export Pipeline',
    stepId: 'step_approval',
    stepName: 'Manager Approval',
    triggerType: 'scheduled',
    executionId: 'exec_12345',
  },
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  slaHours: 8,
  details: {
    recordCount: 15420,
    dataFields: ['email', 'name', 'company', 'purchase_history', 'engagement_score'],
    exportFormat: 'CSV',
    destination: 'Secure S3 Bucket',
  },
  attachments: [
    {
      id: 'att_001',
      name: 'data_schema.json',
      type: 'application/json',
      size: 2048,
      url: '/attachments/data_schema.json',
    },
    {
      id: 'att_002',
      name: 'compliance_review.pdf',
      type: 'application/pdf',
      size: 524288,
      url: '/attachments/compliance_review.pdf',
      previewUrl: '/previews/compliance_review.png',
    },
  ],
  auditTrail: [
    {
      id: 'aud_001',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      action: 'Request Created',
      actor: {
        id: 'usr_001',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
      },
    },
    {
      id: 'aud_002',
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      action: 'Auto-assigned to approver',
      actor: {
        id: 'sys_001',
        name: 'System',
        email: 'system@nexus.app',
      },
      comment: 'Routed based on department rules',
    },
  ],
  requiresSignature: true,
  conditionalFields: [
    {
      id: 'cf_001',
      label: 'Data Retention Period',
      type: 'select',
      required: true,
      options: ['30 days', '60 days', '90 days', '1 year'],
      condition: { approvalType: ['data_access'] },
    },
    {
      id: 'cf_002',
      label: 'Purpose Justification',
      type: 'text',
      required: true,
      condition: { approvalType: ['data_access', 'security'], riskLevel: ['medium', 'high', 'critical'] },
    },
  ],
}

// Helper functions
const getRiskColor = (level: RiskLevel): string => {
  const colors = {
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return colors[level]
}

const getStatusConfig = (status: ApprovalStatus) => {
  const configs = {
    pending: { color: 'bg-blue-500/20 text-blue-400', icon: Clock, label: 'Pending' },
    approved: { color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle, label: 'Approved' },
    rejected: { color: 'bg-red-500/20 text-red-400', icon: XCircle, label: 'Rejected' },
    info_requested: { color: 'bg-purple-500/20 text-purple-400', icon: MessageSquare, label: 'Info Requested' },
    escalated: { color: 'bg-orange-500/20 text-orange-400', icon: AlertTriangle, label: 'Escalated' },
  }
  return configs[status]
}

const getTypeLabel = (type: ApprovalType): string => {
  const labels = {
    workflow_execution: 'Workflow Execution',
    data_access: 'Data Access',
    configuration_change: 'Configuration Change',
    user_action: 'User Action',
    financial: 'Financial',
    security: 'Security',
  }
  return labels[type]
}

const formatTimeRemaining = (dueAt: string): { text: string; urgent: boolean } => {
  const now = new Date()
  const due = new Date(dueAt)
  const diffMs = due.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (diffMs < 0) {
    return { text: 'Overdue', urgent: true }
  }
  if (diffHours < 1) {
    return { text: `${diffMins}m remaining`, urgent: true }
  }
  if (diffHours < 4) {
    return { text: `${diffHours}h ${diffMins}m remaining`, urgent: true }
  }
  return { text: `${diffHours}h ${diffMins}m remaining`, urgent: false }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
  exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.2 } },
}

const contentVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: 0.3 } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
}

const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
}

/**
 * ApprovalRequest Component
 * A comprehensive UI for reviewing and acting on approval requests in human-in-the-loop workflows
 */
export function ApprovalRequest({
  request,
  onApprove,
  onReject,
  onRequestInfo,
  onEscalate,
  onViewAttachment,
  isLoading = false,
  showAuditTrail = true,
  className,
}: ApprovalRequestProps) {
  // State
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | 'request_info' | 'escalate' | null>(null)
  const [comments, setComments] = useState('')
  const [signature, setSignature] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [conditionalFieldValues, setConditionalFieldValues] = useState<Record<string, string | number | boolean>>({})

  // Computed values
  const statusConfig = getStatusConfig(request.status)
  const StatusIcon = statusConfig.icon
  const timeRemaining = request.dueAt ? formatTimeRemaining(request.dueAt) : null

  // Filter conditional fields based on request type and risk level
  const visibleConditionalFields = useMemo(() => {
    if (!request.conditionalFields) return []
    return request.conditionalFields.filter((field) => {
      if (!field.condition) return true
      const typeMatch = field.condition.approvalType?.includes(request.type) ?? true
      const riskMatch = field.condition.riskLevel?.includes(request.riskLevel) ?? true
      return typeMatch && riskMatch
    })
  }, [request.conditionalFields, request.type, request.riskLevel])

  // Handlers
  const handleApprove = useCallback(() => {
    if (onApprove) {
      onApprove(request.id, comments, signature || undefined, conditionalFieldValues)
      setActiveAction(null)
      setComments('')
      setSignature('')
      setConditionalFieldValues({})
    }
  }, [onApprove, request.id, comments, signature, conditionalFieldValues])

  const handleReject = useCallback(() => {
    if (onReject && comments.trim()) {
      onReject(request.id, comments)
      setActiveAction(null)
      setComments('')
    }
  }, [onReject, request.id, comments])

  const handleRequestInfo = useCallback(() => {
    if (onRequestInfo && comments.trim()) {
      onRequestInfo(request.id, comments)
      setActiveAction(null)
      setComments('')
    }
  }, [onRequestInfo, request.id, comments])

  const handleEscalate = useCallback(() => {
    if (onEscalate && comments.trim()) {
      onEscalate(request.id, comments)
      setActiveAction(null)
      setComments('')
    }
  }, [onEscalate, request.id, comments])

  const handleConditionalFieldChange = useCallback((fieldId: string, value: string | number | boolean) => {
    setConditionalFieldValues((prev) => ({ ...prev, [fieldId]: value }))
  }, [])

  // Validate form for approval
  const canApprove = useMemo(() => {
    if (request.requiresSignature && !signature.trim()) return false
    const requiredFields = visibleConditionalFields.filter((f) => f.required)
    for (const field of requiredFields) {
      const value = conditionalFieldValues[field.id]
      if (value === undefined || value === '') return false
    }
    return true
  }, [request.requiresSignature, signature, visibleConditionalFields, conditionalFieldValues])

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn('w-full', className)}
    >
      <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className={statusConfig.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <Badge variant="outline" className={getRiskColor(request.riskLevel)}>
                  <Shield className="w-3 h-3 mr-1" />
                  {request.riskLevel.charAt(0).toUpperCase() + request.riskLevel.slice(1)} Risk
                </Badge>
                <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                  {getTypeLabel(request.type)}
                </Badge>
              </div>
              <CardTitle className="text-lg sm:text-xl text-white truncate">{request.title}</CardTitle>
              <CardDescription className="mt-1 text-slate-400 line-clamp-2">{request.description}</CardDescription>
            </div>

            {/* Time remaining indicator */}
            {timeRemaining && request.status === 'pending' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg shrink-0',
                  timeRemaining.urgent
                    ? 'bg-red-500/20 border border-red-500/30'
                    : 'bg-slate-700/50 border border-slate-600/50'
                )}
              >
                <Clock className={cn('w-4 h-4', timeRemaining.urgent ? 'text-red-400' : 'text-slate-400')} />
                <span className={cn('text-sm font-medium', timeRemaining.urgent ? 'text-red-400' : 'text-slate-300')}>
                  {timeRemaining.text}
                </span>
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Requestor Info */}
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium">
              {request.requestor.avatar ? (
                <img
                  src={request.requestor.avatar}
                  alt={request.requestor.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                request.requestor.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-slate-500" />
                <span className="text-sm font-medium text-white truncate">{request.requestor.name}</span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {request.requestor.role && `${request.requestor.role}`}
                {request.requestor.department && ` - ${request.requestor.department}`}
              </p>
            </div>
            <span className="text-xs text-slate-500">{formatTimestamp(request.createdAt)}</span>
          </div>

          {/* Workflow Context */}
          {request.workflowContext && (
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-white">Workflow Context</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Workflow:</span>
                  <span className="ml-2 text-slate-300">{request.workflowContext.workflowName}</span>
                </div>
                {request.workflowContext.stepName && (
                  <div>
                    <span className="text-slate-500">Step:</span>
                    <span className="ml-2 text-slate-300">{request.workflowContext.stepName}</span>
                  </div>
                )}
                {request.workflowContext.executionId && (
                  <div>
                    <span className="text-slate-500">Execution ID:</span>
                    <span className="ml-2 text-slate-400 font-mono">{request.workflowContext.executionId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expandable Details */}
          {request.details && Object.keys(request.details).length > 0 && (
            <div className="border border-slate-700/50 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between p-3 bg-slate-700/20 hover:bg-slate-700/30 transition-colors"
              >
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Request Details
                </span>
                {showDetails ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="p-3 space-y-2 bg-slate-800/30">
                      {Object.entries(request.details).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2 text-xs">
                          <span className="text-slate-500 capitalize min-w-[120px]">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-slate-300 break-all">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-white flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-400" />
                Attachments ({request.attachments.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {request.attachments.map((attachment) => (
                  <motion.button
                    key={attachment.id}
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => onViewAttachment?.(attachment)}
                    className="flex items-center gap-3 p-2 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors text-left"
                  >
                    {attachment.previewUrl ? (
                      <div className="w-10 h-10 rounded bg-slate-600/50 overflow-hidden shrink-0">
                        <img
                          src={attachment.previewUrl}
                          alt={attachment.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-slate-600/50 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{attachment.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(attachment.size)}</p>
                    </div>
                    <Eye className="w-4 h-4 text-slate-500 shrink-0" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Audit Trail */}
          {showAuditTrail && request.auditTrail && request.auditTrail.length > 0 && (
            <div className="border border-slate-700/50 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between p-3 bg-slate-700/20 hover:bg-slate-700/30 transition-colors"
              >
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  Activity History ({request.auditTrail.length})
                </span>
                {showHistory ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="p-3 space-y-3 bg-slate-800/30 max-h-48 overflow-y-auto">
                      {request.auditTrail.map((entry, index) => (
                        <div key={entry.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            {index < request.auditTrail!.length - 1 && (
                              <div className="w-0.5 flex-1 bg-slate-700 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white">{entry.action}</span>
                              <span className="text-xs text-slate-500">{formatTimestamp(entry.timestamp)}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">by {entry.actor.name}</p>
                            {entry.comment && (
                              <p className="text-xs text-slate-500 mt-1 italic">"{entry.comment}"</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Action Form */}
          <AnimatePresence mode="wait">
            {activeAction && (
              <motion.div
                key={activeAction}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50"
              >
                {/* Conditional Fields for Approval */}
                {activeAction === 'approve' && visibleConditionalFields.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-sm font-medium text-white">Required Information</span>
                    {visibleConditionalFields.map((field) => (
                      <div key={field.id} className="space-y-1">
                        <label className="text-xs text-slate-400">
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {field.type === 'select' && field.options ? (
                          <select
                            value={conditionalFieldValues[field.id] as string || ''}
                            onChange={(e) => handleConditionalFieldChange(field.id, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="">Select...</option>
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field.type === 'checkbox' ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!conditionalFieldValues[field.id]}
                              onChange={(e) => handleConditionalFieldChange(field.id, e.target.checked)}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-slate-300">Confirmed</span>
                          </label>
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            value={conditionalFieldValues[field.id] as string || ''}
                            onChange={(e) => handleConditionalFieldChange(field.id, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Comments/Notes Field */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    {activeAction === 'approve' ? 'Comments (optional)' :
                      activeAction === 'reject' ? 'Rejection Reason *' :
                        activeAction === 'request_info' ? 'Questions / Additional Info Needed *' :
                          'Escalation Reason *'}
                  </label>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={
                      activeAction === 'approve' ? 'Add any notes or comments...' :
                        activeAction === 'reject' ? 'Please provide a reason for rejection...' :
                          activeAction === 'request_info' ? 'What additional information do you need?' :
                            'Why is this being escalated?'
                    }
                    className="min-h-[80px] bg-slate-800 border-slate-600"
                  />
                </div>

                {/* Digital Signature for Approve */}
                {activeAction === 'approve' && request.requiresSignature && (
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 flex items-center gap-1">
                      <Pen className="w-3 h-3" />
                      Digital Signature *
                    </label>
                    <input
                      type="text"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="Type your full name to sign..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent font-signature italic"
                    />
                    <p className="text-xs text-slate-500">
                      By signing, you confirm this approval and take responsibility for this action.
                    </p>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActiveAction(null)
                      setComments('')
                      setSignature('')
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={activeAction === 'approve' ? 'success' : activeAction === 'reject' ? 'destructive' : 'default'}
                    size="sm"
                    onClick={
                      activeAction === 'approve' ? handleApprove :
                        activeAction === 'reject' ? handleReject :
                          activeAction === 'request_info' ? handleRequestInfo :
                            handleEscalate
                    }
                    disabled={
                      isLoading ||
                      (activeAction === 'approve' && !canApprove) ||
                      (activeAction !== 'approve' && !comments.trim())
                    }
                    loading={isLoading}
                  >
                    {activeAction === 'approve' ? 'Confirm Approval' :
                      activeAction === 'reject' ? 'Confirm Rejection' :
                        activeAction === 'request_info' ? 'Send Request' :
                          'Escalate Request'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        {/* Footer Actions */}
        {request.status === 'pending' && (
          <CardFooter className="flex flex-wrap gap-2 pt-4 border-t border-slate-700/50">
            <motion.div variants={buttonVariants} initial="idle" whileHover="hover" whileTap="tap" className="flex-1 min-w-[120px]">
              <Button
                variant="success"
                className="w-full"
                onClick={() => setActiveAction('approve')}
                disabled={isLoading || activeAction !== null}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Approve
              </Button>
            </motion.div>
            <motion.div variants={buttonVariants} initial="idle" whileHover="hover" whileTap="tap" className="flex-1 min-w-[120px]">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setActiveAction('reject')}
                disabled={isLoading || activeAction !== null}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Reject
              </Button>
            </motion.div>
            <motion.div variants={buttonVariants} initial="idle" whileHover="hover" whileTap="tap" className="flex-1 min-w-[120px]">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setActiveAction('request_info')}
                disabled={isLoading || activeAction !== null}
                leftIcon={<MessageSquare className="w-4 h-4" />}
              >
                Request Info
              </Button>
            </motion.div>
            <motion.div variants={buttonVariants} initial="idle" whileHover="hover" whileTap="tap" className="flex-1 min-w-[120px]">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setActiveAction('escalate')}
                disabled={isLoading || activeAction !== null}
                leftIcon={<AlertTriangle className="w-4 h-4" />}
              >
                Escalate
              </Button>
            </motion.div>
          </CardFooter>
        )}

        {/* Completed Status Footer */}
        {request.status !== 'pending' && (
          <CardFooter className="pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-sm">
              <StatusIcon className={cn('w-5 h-5', statusConfig.color.includes('emerald') ? 'text-emerald-400' : statusConfig.color.includes('red') ? 'text-red-400' : 'text-blue-400')} />
              <span className="text-slate-300">
                This request has been <span className="font-medium text-white">{statusConfig.label.toLowerCase()}</span>
              </span>
            </div>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}

/**
 * ApprovalRequestList - Component for displaying multiple approval requests
 */
export interface ApprovalRequestListProps {
  requests: ApprovalRequestData[]
  onApprove?: (requestId: string, comments: string, signature?: string, additionalFields?: Record<string, unknown>) => void
  onReject?: (requestId: string, reason: string) => void
  onRequestInfo?: (requestId: string, questions: string) => void
  onEscalate?: (requestId: string, reason: string, escalateTo?: string) => void
  onViewAttachment?: (attachment: Attachment) => void
  isLoading?: boolean
  className?: string
}

export function ApprovalRequestList({
  requests,
  onApprove,
  onReject,
  onRequestInfo,
  onEscalate,
  onViewAttachment,
  isLoading,
  className,
}: ApprovalRequestListProps) {
  if (requests.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">All caught up!</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          You have no pending approval requests. New requests will appear here when they need your attention.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <AnimatePresence mode="popLayout">
        {requests.map((request) => (
          <ApprovalRequest
            key={request.id}
            request={request}
            onApprove={onApprove}
            onReject={onReject}
            onRequestInfo={onRequestInfo}
            onEscalate={onEscalate}
            onViewAttachment={onViewAttachment}
            isLoading={isLoading}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ApprovalRequest

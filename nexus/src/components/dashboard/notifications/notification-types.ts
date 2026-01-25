/**
 * Dashboard Notification Type Definitions
 *
 * Type definitions for all notification-related components including:
 * - Notification categories (system, workflow, billing)
 * - Priority levels
 * - Status tracking
 * - Alert data structures
 */

// =============================================================================
// Notification Type Constants (using const objects instead of enums)
// =============================================================================

export const NotificationCategory = {
  SYSTEM: 'system',
  WORKFLOW: 'workflow',
  BILLING: 'billing',
  INTEGRATION: 'integration',
  SECURITY: 'security',
} as const

export type NotificationCategoryType = typeof NotificationCategory[keyof typeof NotificationCategory]

export const NotificationPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

export type NotificationPriorityType = typeof NotificationPriority[keyof typeof NotificationPriority]

export const NotificationStatus = {
  UNREAD: 'unread',
  READ: 'read',
  DISMISSED: 'dismissed',
  ACTIONED: 'actioned',
} as const

export type NotificationStatusType = typeof NotificationStatus[keyof typeof NotificationStatus]

export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
} as const

export type AlertSeverityType = typeof AlertSeverity[keyof typeof AlertSeverity]

// =============================================================================
// Base Notification Data
// =============================================================================

export interface NotificationData {
  id: string
  category: NotificationCategoryType
  type: string
  title: string
  message: string
  priority: NotificationPriorityType
  status: NotificationStatusType
  createdAt: string
  readAt: string | null
  expiresAt: string | null
  actionUrl: string | null
  actionLabel: string | null
  metadata: Record<string, unknown>
}

// =============================================================================
// System Alert Data
// =============================================================================

export const SystemAlertType = {
  MAINTENANCE: 'maintenance',
  FEATURE_UPDATE: 'feature_update',
  SECURITY: 'security',
  SERVICE_STATUS: 'service_status',
  ANNOUNCEMENT: 'announcement',
} as const

export type SystemAlertTypeValue = typeof SystemAlertType[keyof typeof SystemAlertType]

export interface SystemAlertData {
  id: string
  type: SystemAlertTypeValue
  severity: AlertSeverityType
  title: string
  message: string
  startTime: string | null
  endTime: string | null
  dismissible: boolean
  dismissed: boolean
  actionUrl: string | null
  actionLabel: string | null
  metadata: {
    affectedServices?: string[]
    version?: string
    changelogUrl?: string
    estimatedDuration?: string
    [key: string]: unknown
  }
}

// =============================================================================
// Workflow Alert Data
// =============================================================================

export const WorkflowAlertType = {
  RUN_FAILURE: 'run_failure',
  RATE_LIMIT: 'rate_limit',
  INTEGRATION_DISCONNECT: 'integration_disconnect',
  APPROVAL_REQUEST: 'approval_request',
  SCHEDULE_CHANGE: 'schedule_change',
  PERFORMANCE_WARNING: 'performance_warning',
} as const

export type WorkflowAlertTypeValue = typeof WorkflowAlertType[keyof typeof WorkflowAlertType]

export interface WorkflowAlertData {
  id: string
  type: WorkflowAlertTypeValue
  severity: AlertSeverityType
  workflowId: string
  workflowName: string
  title: string
  message: string
  createdAt: string
  actionUrl: string | null
  actionLabel: string | null
  metadata: {
    executionId?: string
    errorCode?: string
    errorDetails?: string
    integrationName?: string
    limitType?: string
    currentUsage?: number
    limit?: number
    approvalId?: string
    requesterName?: string
    previousSchedule?: string
    newSchedule?: string
    [key: string]: unknown
  }
}

// =============================================================================
// Billing Alert Data
// =============================================================================

export const BillingAlertType = {
  USAGE_LIMIT_WARNING: 'usage_limit_warning',
  USAGE_LIMIT_REACHED: 'usage_limit_reached',
  PAYMENT_FAILED: 'payment_failed',
  PLAN_EXPIRING: 'plan_expiring',
  UPGRADE_OFFER: 'upgrade_offer',
  INVOICE_READY: 'invoice_ready',
  PAYMENT_SUCCESS: 'payment_success',
} as const

export type BillingAlertTypeValue = typeof BillingAlertType[keyof typeof BillingAlertType]

export interface BillingAlertData {
  id: string
  type: BillingAlertTypeValue
  severity: AlertSeverityType
  title: string
  message: string
  createdAt: string
  actionUrl: string | null
  actionLabel: string | null
  metadata: {
    currentUsage?: number
    usageLimit?: number
    usagePercentage?: number
    planName?: string
    expirationDate?: string
    invoiceId?: string
    invoiceUrl?: string
    amount?: number
    currency?: string
    paymentMethod?: string
    retryDate?: string
    discountPercentage?: number
    [key: string]: unknown
  }
}

// =============================================================================
// Grouped Notifications
// =============================================================================

export interface GroupedNotifications {
  system: NotificationData[]
  workflow: NotificationData[]
  billing: NotificationData[]
}

// =============================================================================
// Notification Center State
// =============================================================================

export interface NotificationCenterState {
  isOpen: boolean
  activeCategory: NotificationCategoryType | 'all'
  notifications: NotificationData[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  soundEnabled: boolean
}

// =============================================================================
// Notification Preferences
// =============================================================================

export interface DashboardNotificationPreferences {
  soundEnabled: boolean
  desktopNotificationsEnabled: boolean
  emailDigestEnabled: boolean
  emailDigestFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
  categoryPreferences: {
    [K in NotificationCategoryType]: {
      enabled: boolean
      priority: NotificationPriorityType
    }
  }
}

// =============================================================================
// Action Handlers
// =============================================================================

export interface NotificationActions {
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  dismiss: (id: string) => void
  dismissAll: () => void
  performAction: (id: string) => void
}

// =============================================================================
// Priority Color Mapping
// =============================================================================

export const PRIORITY_COLORS: Record<NotificationPriorityType, { bg: string; text: string; border: string }> = {
  low: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  },
  normal: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
  },
  high: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  urgent: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
}

// =============================================================================
// Severity Color Mapping
// =============================================================================

export const SEVERITY_COLORS: Record<AlertSeverityType, { bg: string; text: string; border: string; icon: string }> = {
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    icon: 'bg-blue-500/20',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: 'bg-amber-500/20',
  },
  error: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    icon: 'bg-red-500/20',
  },
  success: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: 'bg-emerald-500/20',
  },
}

// =============================================================================
// Category Configuration
// =============================================================================

export const CATEGORY_CONFIG: Record<NotificationCategoryType, { label: string; icon: string; color: string }> = {
  system: {
    label: 'System',
    icon: 'cog',
    color: 'text-slate-400',
  },
  workflow: {
    label: 'Workflows',
    icon: 'workflow',
    color: 'text-cyan-400',
  },
  billing: {
    label: 'Billing',
    icon: 'creditCard',
    color: 'text-emerald-400',
  },
  integration: {
    label: 'Integrations',
    icon: 'plug',
    color: 'text-purple-400',
  },
  security: {
    label: 'Security',
    icon: 'shield',
    color: 'text-amber-400',
  },
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format relative time for notification display
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffSeconds < 60) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`

  return date.toLocaleDateString()
}

/**
 * Get priority level from usage percentage
 */
export function getUsagePriority(percentage: number): NotificationPriorityType {
  if (percentage >= 100) return NotificationPriority.URGENT
  if (percentage >= 90) return NotificationPriority.HIGH
  if (percentage >= 75) return NotificationPriority.NORMAL
  return NotificationPriority.LOW
}

/**
 * Group notifications by category
 */
export function groupNotificationsByCategory(
  notifications: NotificationData[]
): GroupedNotifications {
  return notifications.reduce<GroupedNotifications>(
    (groups, notification) => {
      const category = notification.category
      if (category === 'system' || category === 'security') {
        groups.system.push(notification)
      } else if (category === 'workflow' || category === 'integration') {
        groups.workflow.push(notification)
      } else if (category === 'billing') {
        groups.billing.push(notification)
      }
      return groups
    },
    { system: [], workflow: [], billing: [] }
  )
}

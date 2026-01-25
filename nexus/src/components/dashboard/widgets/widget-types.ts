/**
 * Widget Type Definitions
 *
 * Shared types for dashboard workflow widgets.
 * Follows project conventions: no enums, use const objects,
 * use `import type` for type-only imports.
 */

// =============================================================================
// Status Types
// =============================================================================

/** Workflow status options as const object (not enum) */
export const WORKFLOW_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ERROR: 'error',
  DISABLED: 'disabled',
} as const

export type WorkflowStatus = typeof WORKFLOW_STATUS[keyof typeof WORKFLOW_STATUS]

/** Schedule frequency options */
export const SCHEDULE_FREQUENCY = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
} as const

export type ScheduleFrequency = typeof SCHEDULE_FREQUENCY[keyof typeof SCHEDULE_FREQUENCY]

/** Run trigger types */
export const RUN_TRIGGER = {
  MANUAL: 'manual',
  SCHEDULE: 'schedule',
  WEBHOOK: 'webhook',
  API: 'api',
} as const

export type RunTrigger = typeof RUN_TRIGGER[keyof typeof RUN_TRIGGER]

// =============================================================================
// Workflow Types
// =============================================================================

/** Base workflow representation for widgets */
export interface WidgetWorkflow {
  id: string
  name: string
  description?: string
  icon?: string
  status: WorkflowStatus
  isFavorite?: boolean
  createdAt: string
  updatedAt: string
}

/** Recent workflow with run history */
export interface RecentWorkflow extends WidgetWorkflow {
  lastRunAt?: string
  lastRunStatus?: 'success' | 'failed' | 'running'
  lastRunDuration?: number
  runCount: number
}

/** Scheduled workflow with timing info */
export interface ScheduledWorkflow extends WidgetWorkflow {
  nextRunAt: string
  frequency: ScheduleFrequency
  cronExpression?: string
  isEnabled: boolean
  timezone?: string
}

/** Favorite workflow with quick access info */
export interface FavoriteWorkflow extends WidgetWorkflow {
  runCount: number
  successRate: number
  position: number
  lastRunAt?: string
}

/** Failed run information */
export interface FailedRun {
  id: string
  workflowId: string
  workflowName: string
  failedAt: string
  errorMessage: string
  errorCode?: string
  canRetry: boolean
  retryCount: number
}

// =============================================================================
// Widget Props Types
// =============================================================================

/** Common widget props */
export interface BaseWidgetProps {
  className?: string
  isLoading?: boolean
  onRefresh?: () => Promise<void>
}

/** Recent workflows widget props */
export interface RecentWorkflowsProps extends BaseWidgetProps {
  workflows?: RecentWorkflow[]
  maxItems?: number
  onRunWorkflow?: (workflowId: string) => Promise<void>
  onEditWorkflow?: (workflowId: string) => void
  onViewRun?: (workflowId: string, runId?: string) => void
}

/** Scheduled runs widget props */
export interface ScheduledRunsProps extends BaseWidgetProps {
  workflows?: ScheduledWorkflow[]
  maxItems?: number
  onToggleSchedule?: (workflowId: string, enabled: boolean) => Promise<void>
  onEditSchedule?: (workflowId: string) => void
  onViewWorkflow?: (workflowId: string) => void
}

/** Favorite workflows widget props */
export interface FavoriteWorkflowsProps extends BaseWidgetProps {
  workflows?: FavoriteWorkflow[]
  maxItems?: number
  onRunWorkflow?: (workflowId: string) => Promise<void>
  onToggleFavorite?: (workflowId: string, isFavorite: boolean) => Promise<void>
  onReorder?: (workflowId: string, newPosition: number) => Promise<void>
  onViewWorkflow?: (workflowId: string) => void
}

/** Failed runs alert widget props */
export interface FailedRunsAlertProps extends BaseWidgetProps {
  failedRuns?: FailedRun[]
  maxDisplay?: number
  onViewDetails?: (runId: string) => void
  onRetry?: (runId: string) => Promise<void>
  onDismiss?: (runId: string) => void
  onDismissAll?: () => void
  onTroubleshoot?: (workflowId: string) => void
}

/** Mini card widget props */
export interface WorkflowMiniCardProps {
  workflow: WidgetWorkflow
  className?: string
  showActions?: boolean
  isSelected?: boolean
  lastRunAt?: string
  lastRunStatus?: 'success' | 'failed' | 'running'
  onClick?: () => void
  onRun?: () => Promise<void>
  onEdit?: () => void
  onToggleFavorite?: () => void
}

// =============================================================================
// Utility Types
// =============================================================================

/** Time formatting options */
export interface TimeFormatOptions {
  relative?: boolean
  includeTime?: boolean
  timezone?: string
}

/** Action menu item */
export interface ActionMenuItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'destructive'
  disabled?: boolean
}

/**
 * Dashboard Workflow Widgets - Barrel Export
 *
 * Exports all workflow-related widgets for the dashboard.
 * Usage: import { RecentWorkflows, ScheduledRuns } from '@/components/dashboard/widgets'
 */

// Widget Components
export { RecentWorkflows } from './RecentWorkflows'
export { ScheduledRuns } from './ScheduledRuns'
export { FavoriteWorkflows } from './FavoriteWorkflows'
export { FailedRunsAlert } from './FailedRunsAlert'
export { WorkflowMiniCard } from './WorkflowMiniCard'

// Type Definitions
export type {
  // Status types
  WorkflowStatus,
  ScheduleFrequency,
  RunTrigger,
  // Workflow types
  WidgetWorkflow,
  RecentWorkflow,
  ScheduledWorkflow,
  FavoriteWorkflow,
  FailedRun,
  // Props types
  BaseWidgetProps,
  RecentWorkflowsProps,
  ScheduledRunsProps,
  FavoriteWorkflowsProps,
  FailedRunsAlertProps,
  WorkflowMiniCardProps,
  // Utility types
  TimeFormatOptions,
  ActionMenuItem,
} from './widget-types'

// Status constants (for programmatic use)
export {
  WORKFLOW_STATUS,
  SCHEDULE_FREQUENCY,
  RUN_TRIGGER,
} from './widget-types'

/**
 * CustomerDashboard Module Exports
 *
 * Main hub for customer-facing dashboard functionality including:
 * - Dashboard statistics display
 * - Activity timeline
 * - Quick actions grid
 * - Main dashboard page component
 */

// Main page component
export { CustomerDashboard, default } from './CustomerDashboard'

// Sub-components
export { DashboardStats } from './DashboardStats'
export { ActivityTimeline, EXECUTION_STATUS } from './ActivityTimeline'
export type { WorkflowActivity, ExecutionStatus } from './ActivityTimeline'
export { QuickActionsGrid } from './QuickActionsGrid'

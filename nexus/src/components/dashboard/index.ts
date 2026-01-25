/**
 * Dashboard Components Barrel Export
 *
 * Exports all dashboard-specific components for centralized imports.
 * Usage: import { DashboardView, CustomerHealthDashboard } from '@/components/dashboard'
 */

// Main combined dashboard view
export { DashboardView } from './DashboardView'
export type { DashboardViewProps, DashboardTab } from './DashboardView'

// User context management
export { UserContextPanel } from './UserContextPanel'

// Customer health monitoring
export { CustomerHealthDashboard } from './CustomerHealthDashboard'

// Workflow execution logs
export { ExecutionLogsViewer } from './ExecutionLogsViewer'

// ROI calculation and display
export { ROICalculator } from './ROICalculator'

// Usage analytics and metrics
export { UsageAnalytics } from './UsageAnalytics'

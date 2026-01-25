/**
 * Dashboard Notification Components Barrel Export
 *
 * Exports all notification-related components for the dashboard:
 * - NotificationCenter: Main notification hub with bell icon and dropdown
 * - NotificationItem: Individual notification display
 * - SystemAlerts: System-level alert banners
 * - WorkflowAlerts: Workflow-specific alerts
 * - BillingAlerts: Billing notifications
 *
 * Usage:
 * import {
 *   NotificationCenter,
 *   SystemAlerts,
 *   WorkflowAlerts,
 *   BillingAlerts
 * } from '@/components/dashboard/notifications'
 */

// Main notification center
export { NotificationCenter } from './NotificationCenter'
export type { NotificationCenterProps } from './NotificationCenter'

// Individual notification item
export { NotificationItem } from './NotificationItem'
export type { NotificationItemProps } from './NotificationItem'

// System alerts component
export { SystemAlerts } from './SystemAlerts'
export type { SystemAlertsProps } from './SystemAlerts'

// Workflow alerts component
export { WorkflowAlerts } from './WorkflowAlerts'
export type { WorkflowAlertsProps } from './WorkflowAlerts'

// Billing alerts component
export { BillingAlerts } from './BillingAlerts'
export type { BillingAlertsProps } from './BillingAlerts'

// Type definitions
export type {
  NotificationData,
  NotificationCategoryType,
  NotificationPriorityType,
  NotificationStatusType,
  AlertSeverityType,
  SystemAlertData,
  SystemAlertTypeValue,
  WorkflowAlertData,
  WorkflowAlertTypeValue,
  BillingAlertData,
  BillingAlertTypeValue,
  GroupedNotifications,
  NotificationCenterState,
  DashboardNotificationPreferences,
  NotificationActions,
} from './notification-types'

// Constants and utilities
export {
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  AlertSeverity,
  SystemAlertType,
  WorkflowAlertType,
  BillingAlertType,
  PRIORITY_COLORS,
  SEVERITY_COLORS,
  CATEGORY_CONFIG,
  formatRelativeTime,
  getUsagePriority,
  groupNotificationsByCategory,
} from './notification-types'

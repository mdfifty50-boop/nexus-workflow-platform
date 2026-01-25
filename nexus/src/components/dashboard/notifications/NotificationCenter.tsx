/**
 * NotificationCenter Component
 *
 * Central notification hub for the dashboard:
 * - Bell icon with badge count
 * - Dropdown panel with notifications
 * - Mark as read functionality
 * - Grouped by category (system, workflow, billing)
 * - Sound toggle
 * - Notification preferences link
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { NotificationItem } from './NotificationItem'
import type {
  NotificationData,
  NotificationCategoryType,
} from './notification-types'
import {
  NotificationCategory,
  NotificationStatus,
  NotificationPriority,
  CATEGORY_CONFIG,
  groupNotificationsByCategory,
} from './notification-types'

// =============================================================================
// Types
// =============================================================================

export interface NotificationCenterProps {
  notifications?: NotificationData[]
  onNotificationRead?: (id: string) => void
  onNotificationDismiss?: (id: string) => void
  onMarkAllRead?: () => void
  onClearAll?: () => void
  className?: string
}

type FilterCategory = NotificationCategoryType | 'all'

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_NOTIFICATIONS: NotificationData[] = [
  {
    id: 'n1',
    category: NotificationCategory.WORKFLOW,
    type: 'run_failure',
    title: 'Workflow Failed',
    message: 'The "Email Automation" workflow encountered an error during execution. Step 3 failed with a timeout error.',
    priority: NotificationPriority.HIGH,
    status: NotificationStatus.UNREAD,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    readAt: null,
    expiresAt: null,
    actionUrl: '/workflows/wf-1',
    actionLabel: 'View Error',
    metadata: { workflowId: 'wf-1', executionId: 'exec-1' },
  },
  {
    id: 'n2',
    category: NotificationCategory.BILLING,
    type: 'usage_limit_warning',
    title: 'Usage Limit Warning',
    message: "You've used 85% of your monthly workflow executions. Consider upgrading your plan.",
    priority: NotificationPriority.NORMAL,
    status: NotificationStatus.UNREAD,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    readAt: null,
    expiresAt: null,
    actionUrl: '/settings/billing',
    actionLabel: 'View Usage',
    metadata: { currentUsage: 850, limit: 1000 },
  },
  {
    id: 'n3',
    category: NotificationCategory.SYSTEM,
    type: 'maintenance',
    title: 'Scheduled Maintenance',
    message: 'Platform maintenance scheduled for Saturday 2:00 AM - 4:00 AM UTC. Workflows may be temporarily unavailable.',
    priority: NotificationPriority.NORMAL,
    status: NotificationStatus.UNREAD,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    readAt: null,
    expiresAt: new Date(Date.now() + 48 * 3600000).toISOString(),
    actionUrl: '/status',
    actionLabel: 'View Status',
    metadata: { startTime: '2:00 AM UTC', duration: '2 hours' },
  },
  {
    id: 'n4',
    category: NotificationCategory.INTEGRATION,
    type: 'disconnect',
    title: 'Integration Disconnected',
    message: 'Your Slack integration has been disconnected. Reconnect to continue receiving notifications.',
    priority: NotificationPriority.HIGH,
    status: NotificationStatus.UNREAD,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    readAt: null,
    expiresAt: null,
    actionUrl: '/integrations/slack',
    actionLabel: 'Reconnect',
    metadata: { integrationName: 'Slack' },
  },
  {
    id: 'n5',
    category: NotificationCategory.WORKFLOW,
    type: 'run_complete',
    title: 'Workflow Completed',
    message: 'The "Data Sync" workflow completed successfully. 1,250 records processed.',
    priority: NotificationPriority.LOW,
    status: NotificationStatus.READ,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    readAt: new Date(Date.now() - 20 * 3600000).toISOString(),
    expiresAt: null,
    actionUrl: '/workflows/wf-2/runs/latest',
    actionLabel: 'View Results',
    metadata: { workflowId: 'wf-2', recordsProcessed: 1250 },
  },
  {
    id: 'n6',
    category: NotificationCategory.SYSTEM,
    type: 'feature_update',
    title: 'New Feature: AI Suggestions',
    message: 'Try our new AI-powered workflow suggestions to optimize your automations.',
    priority: NotificationPriority.LOW,
    status: NotificationStatus.READ,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    readAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    expiresAt: null,
    actionUrl: '/features/ai-suggestions',
    actionLabel: 'Learn More',
    metadata: { featureName: 'AI Suggestions' },
  },
]

// =============================================================================
// Icon Components
// =============================================================================

function BellIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  )
}

function VolumeOnIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
    </svg>
  )
}

function VolumeOffIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
      />
    </svg>
  )
}

function SettingsIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

// =============================================================================
// NotificationBadge Component
// =============================================================================

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null

  const displayCount = count > 99 ? '99+' : count.toString()

  return (
    <span
      className={`
        absolute -top-1 -right-1 flex items-center justify-center
        min-w-[18px] h-[18px] px-1
        text-xs font-bold text-white
        bg-red-500 rounded-full
        animate-in zoom-in duration-200
      `}
    >
      {displayCount}
    </span>
  )
}

// =============================================================================
// Component
// =============================================================================

export function NotificationCenter({
  notifications: externalNotifications,
  onNotificationRead,
  onNotificationDismiss,
  onMarkAllRead,
  onClearAll,
  className = '',
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notifications, setNotifications] = useState<NotificationData[]>(
    externalNotifications || MOCK_NOTIFICATIONS
  )

  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Update notifications when external prop changes
  useEffect(() => {
    if (externalNotifications) {
      setNotifications(externalNotifications)
    }
  }, [externalNotifications])

  // Calculate unread count
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.status === NotificationStatus.UNREAD).length,
    [notifications]
  )

  // Filter notifications based on selected category
  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications
    const grouped = groupNotificationsByCategory(notifications)
    return grouped[filter as keyof typeof grouped] || []
  }, [notifications, filter])

  // Group counts for category tabs
  const categoryCounts = useMemo(() => {
    const grouped = groupNotificationsByCategory(notifications)
    return {
      all: notifications.length,
      system: grouped.system.length,
      workflow: grouped.workflow.length,
      billing: grouped.billing.length,
    }
  }, [notifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Handlers
  const handleMarkAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, status: NotificationStatus.READ, readAt: new Date().toISOString() }
            : n
        )
      )
      onNotificationRead?.(id)
    },
    [onNotificationRead]
  )

  const handleDismiss = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      onNotificationDismiss?.(id)
    },
    [onNotificationDismiss]
  )

  const handleMarkAllAsRead = useCallback(() => {
    const now = new Date().toISOString()
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        status: NotificationStatus.READ,
        readAt: n.readAt || now,
      }))
    )
    onMarkAllRead?.()
  }, [onMarkAllRead])

  const handleClearAll = useCallback(() => {
    setNotifications([])
    onClearAll?.()
  }, [onClearAll])

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Bell Button with Badge */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <BellIcon />
        <NotificationBadge count={unreadCount} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-[420px] max-h-[36rem] bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-lg">Notifications</h3>
              <div className="flex items-center gap-2">
                {/* Sound Toggle */}
                <button
                  onClick={toggleSound}
                  className={`p-1.5 rounded-lg transition-colors ${
                    soundEnabled
                      ? 'text-cyan-400 bg-cyan-500/10'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                  aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
                  title={soundEnabled ? 'Sound on' : 'Sound off'}
                >
                  {soundEnabled ? <VolumeOnIcon /> : <VolumeOffIcon />}
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
              {(['all', 'system', 'workflow', 'billing'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`
                    flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                    ${
                      filter === category
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }
                  `}
                >
                  {category === 'all' ? 'All' : CATEGORY_CONFIG[category]?.label || category}
                  {categoryCounts[category] > 0 && (
                    <span className="ml-1.5 text-slate-500">
                      ({categoryCounts[category]})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[22rem]">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                  <BellIcon className="w-7 h-7 text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm font-medium">
                  No notifications
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {filter === 'all'
                    ? "You're all caught up!"
                    : `No ${filter} notifications`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between bg-slate-800/30">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="text-sm text-cyan-400 hover:text-cyan-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                Mark all as read
              </button>
              <button
                onClick={handleClearAll}
                className="text-sm text-slate-400 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Settings Link */}
          <div className="px-4 py-2.5 border-t border-slate-700/50 bg-slate-800/50">
            <Link
              to="/settings#notifications"
              onClick={() => setIsOpen(false)}
              className="text-sm text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2"
            >
              <SettingsIcon />
              Notification settings
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationCenter

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  type Notification,
  type NotificationType,
  NOTIFICATION_TYPE_INFO,
  formatNotificationTime,
} from '@/types/notification'
import { NotificationBadge } from './NotificationBadge'

// Mock notifications for demo - in production, these would come from a backend/context
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    user_id: 'user-1',
    type: 'workflow_complete',
    title: 'Workflow Completed',
    message: 'Your "Data Processing Pipeline" workflow completed successfully.',
    priority: 'normal',
    read: false,
    read_at: null,
    metadata: { workflow_id: 'wf-1', workflow_name: 'Data Processing Pipeline' },
    action_url: '/workflows/wf-1',
    action_label: 'View Results',
    expires_at: null,
  },
  {
    id: '2',
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    user_id: 'user-1',
    type: 'mention',
    title: 'You were mentioned',
    message: 'John mentioned you in a comment on "API Integration Project"',
    priority: 'normal',
    read: false,
    read_at: null,
    metadata: { mentioned_by: 'John', project_name: 'API Integration Project' },
    action_url: '/projects/proj-1',
    action_label: 'View Comment',
    expires_at: null,
  },
  {
    id: '3',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    user_id: 'user-1',
    type: 'achievement',
    title: 'New Achievement!',
    message: 'You earned the "Workflow Master" badge for completing 10 workflows.',
    priority: 'low',
    read: true,
    read_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    metadata: { achievement_name: 'Workflow Master', achievement_icon: '🏆' },
    action_url: '/profile#achievements',
    action_label: 'View Badge',
    expires_at: null,
  },
  {
    id: '4',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    user_id: 'user-1',
    type: 'workflow_error',
    title: 'Workflow Failed',
    message: 'The "Email Automation" workflow encountered an error and was stopped.',
    priority: 'high',
    read: true,
    read_at: new Date(Date.now() - 20 * 3600000).toISOString(),
    metadata: { workflow_id: 'wf-2', workflow_name: 'Email Automation', error_message: 'Connection timeout' },
    action_url: '/workflows/wf-2',
    action_label: 'View Error',
    expires_at: null,
  },
  {
    id: '5',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    user_id: 'user-1',
    type: 'system',
    title: 'System Update',
    message: 'Nexus v2.5 is now available with new features and improvements.',
    priority: 'low',
    read: true,
    read_at: new Date(Date.now() - 40 * 3600000).toISOString(),
    metadata: {},
    action_url: '/changelog',
    action_label: 'See Updates',
    expires_at: null,
  },
]

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length
  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications

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

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, read: true, read_at: new Date().toISOString() }
          : n
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    const now = new Date().toISOString()
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true, read_at: n.read_at || now }))
    )
  }, [])

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Bell Button with Badge */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        aria-label={t('notifications.toggle', 'Toggle notifications')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <BellIcon />
        <NotificationBadge count={unreadCount} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-96 max-h-[32rem] bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-white font-semibold">
              {t('notifications.title', 'Notifications')}
            </h3>
            <div className="flex items-center gap-2">
              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('notifications.all', 'All')}
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('notifications.unread', 'Unread')} {unreadCount > 0 && `(${unreadCount})`}
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-80">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
                  <BellIcon className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm">
                  {filter === 'unread'
                    ? t('notifications.noUnread', 'No unread notifications')
                    : t('notifications.empty', 'No notifications yet')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onClose={() => setIsOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-sm text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              >
                {t('notifications.markAllRead', 'Mark all as read')}
              </button>
              <button
                onClick={clearAll}
                className="text-sm text-slate-400 hover:text-red-400 transition-colors"
              >
                {t('notifications.clearAll', 'Clear all')}
              </button>
            </div>
          )}

          {/* Settings Link */}
          <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/50">
            <Link
              to="/settings#notifications"
              onClick={() => setIsOpen(false)}
              className="text-sm text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2"
            >
              <SettingsIcon className="w-4 h-4" />
              {t('notifications.settings', 'Notification settings')}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// Individual Notification Item
interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function NotificationItem({ notification, onMarkAsRead, onDelete, onClose }: NotificationItemProps) {
  const typeInfo = NOTIFICATION_TYPE_INFO[notification.type as NotificationType]

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    if (notification.action_url) {
      onClose()
    }
  }

  const content = (
    <div className={`px-4 py-3 hover:bg-slate-800/50 transition-colors ${!notification.read ? 'bg-cyan-500/5' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${typeInfo.color} bg-slate-800`}>
          {notification.metadata.achievement_icon || typeInfo.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
              {notification.title}
            </span>
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-500">
              {formatNotificationTime(notification.created_at)}
            </span>
            {notification.action_label && (
              <span className="text-xs text-cyan-400">
                {notification.action_label}
              </span>
            )}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete(notification.id)
          }}
          className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Delete notification"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  if (notification.action_url) {
    return (
      <Link to={notification.action_url} onClick={handleClick}>
        {content}
      </Link>
    )
  }

  return <div onClick={handleClick}>{content}</div>
}

// Icon Components
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

function SettingsIcon({ className = 'w-5 h-5' }: { className?: string }) {
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

function XIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default NotificationCenter

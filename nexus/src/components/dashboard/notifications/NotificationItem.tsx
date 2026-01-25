/**
 * NotificationItem Component
 *
 * Individual notification display with:
 * - Icon based on notification type
 * - Title and message
 * - Relative timestamp
 * - Action button
 * - Dismiss button
 * - Unread indicator
 */

import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import type {
  NotificationData,
  NotificationCategoryType,
  NotificationPriorityType,
} from './notification-types'
import {
  NotificationCategory,
  NotificationPriority,
  PRIORITY_COLORS,
  formatRelativeTime,
} from './notification-types'

// =============================================================================
// Types
// =============================================================================

export interface NotificationItemProps {
  notification: NotificationData
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
  onAction?: (id: string) => void
  compact?: boolean
  className?: string
}

// =============================================================================
// Icon Components
// =============================================================================

function getCategoryIcon(category: NotificationCategoryType, className: string = 'w-4 h-4') {
  switch (category) {
    case NotificationCategory.SYSTEM:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    case NotificationCategory.WORKFLOW:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    case NotificationCategory.BILLING:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    case NotificationCategory.INTEGRATION:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    case NotificationCategory.SECURITY:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
  }
}

function getPriorityIndicator(priority: NotificationPriorityType) {
  if (priority === NotificationPriority.URGENT) {
    return (
      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
    )
  }
  if (priority === NotificationPriority.HIGH) {
    return (
      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
    )
  }
  return null
}

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ChevronRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

// =============================================================================
// Component
// =============================================================================

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
  onAction,
  compact = false,
  className = '',
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isUnread = notification.status === 'unread'
  const colors = PRIORITY_COLORS[notification.priority]

  const handleClick = useCallback(() => {
    if (isUnread) {
      onMarkAsRead(notification.id)
    }
    if (notification.actionUrl && onAction) {
      onAction(notification.id)
    }
  }, [isUnread, notification.id, notification.actionUrl, onMarkAsRead, onAction])

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onDismiss(notification.id)
    },
    [notification.id, onDismiss]
  )

  const content = (
    <div
      className={`
        relative px-4 py-3 transition-colors cursor-pointer
        ${isUnread ? 'bg-cyan-500/5' : ''}
        ${isHovered ? 'bg-slate-800/50' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-start gap-3 ${compact ? 'items-center' : ''}`}>
        {/* Icon with priority indicator */}
        <div className="relative flex-shrink-0">
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${colors.bg} ${colors.text}
            `}
          >
            {getCategoryIcon(notification.category, 'w-4 h-4')}
          </div>
          {getPriorityIndicator(notification.priority)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`
                font-medium text-sm truncate
                ${isUnread ? 'text-white' : 'text-slate-300'}
              `}
            >
              {notification.title}
            </span>
            {isUnread && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
            )}
          </div>

          {!compact && (
            <>
              <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">
                {notification.message}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-slate-500">
                  {formatRelativeTime(notification.createdAt)}
                </span>
                {notification.actionLabel && (
                  <span className="text-xs text-cyan-400 flex items-center gap-1">
                    {notification.actionLabel}
                    <ChevronRightIcon className="w-3 h-3" />
                  </span>
                )}
              </div>
            </>
          )}

          {compact && (
            <span className="text-xs text-slate-500">
              {formatRelativeTime(notification.createdAt)}
            </span>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className={`
            p-1.5 rounded-lg text-slate-500 transition-all flex-shrink-0
            hover:bg-slate-700 hover:text-slate-300
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
          aria-label="Dismiss notification"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  if (notification.actionUrl) {
    return (
      <Link to={notification.actionUrl} onClick={handleClick}>
        {content}
      </Link>
    )
  }

  return <div onClick={handleClick}>{content}</div>
}

export default NotificationItem

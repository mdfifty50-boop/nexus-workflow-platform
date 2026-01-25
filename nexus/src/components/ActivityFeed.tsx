/**
 * ActivityFeed Component
 *
 * Shows recent workflow activity in a timeline view.
 * Displays who edited, ran, commented on workflows.
 */

import { useState, useMemo } from 'react'
import type { JSX } from 'react'
import { OptimizedAvatar } from '@/components/OptimizedImage'

// =============================================================================
// TYPES
// =============================================================================

export type ActivityType =
  | 'created'
  | 'edited'
  | 'ran'
  | 'completed'
  | 'failed'
  | 'commented'
  | 'shared'
  | 'archived'
  | 'restored'

export interface ActivityUser {
  id: string
  name: string
  avatarUrl?: string
}

export interface Activity {
  id: string
  type: ActivityType
  user: ActivityUser
  workflow: {
    id: string
    name: string
  }
  description?: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface ActivityFeedProps {
  /** List of activities */
  activities: Activity[]
  /** Whether to show workflow names */
  showWorkflowName?: boolean
  /** Maximum number of activities to display */
  maxItems?: number
  /** Whether to group activities by date */
  groupByDate?: boolean
  /** Callback when an activity is clicked */
  onActivityClick?: (activity: Activity) => void
  /** Callback when a workflow link is clicked */
  onWorkflowClick?: (workflowId: string) => void
  /** Optional class name */
  className?: string
  /** Loading state */
  loading?: boolean
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ActivityFeed({
  activities,
  showWorkflowName = true,
  maxItems,
  groupByDate = true,
  onActivityClick,
  onWorkflowClick,
  className = '',
  loading = false
}: ActivityFeedProps) {
  const [filter, setFilter] = useState<ActivityType | 'all'>('all')

  // Filter and limit activities
  const filteredActivities = useMemo(() => {
    let result = activities
    if (filter !== 'all') {
      result = activities.filter((a) => a.type === filter)
    }
    if (maxItems) {
      result = result.slice(0, maxItems)
    }
    return result
  }, [activities, filter, maxItems])

  // Group by date if enabled
  const groupedActivities = useMemo(() => {
    if (!groupByDate) return { 'All': filteredActivities }

    const groups: Record<string, Activity[]> = {}
    filteredActivities.forEach((activity) => {
      const dateKey = getDateGroupKey(new Date(activity.timestamp))
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(activity)
    })
    return groups
  }, [filteredActivities, groupByDate])

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {(['all', 'edited', 'ran', 'commented', 'shared'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              filter === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {type === 'all' ? 'All Activity' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Activity list */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-8">
          <ActivityIcon type="created" className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No activity to show</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([dateGroup, items]) => (
            <div key={dateGroup}>
              {groupByDate && (
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {dateGroup}
                </h3>
              )}
              <div className="space-y-1">
                {items.map((activity, index) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    showWorkflowName={showWorkflowName}
                    onClick={() => onActivityClick?.(activity)}
                    onWorkflowClick={onWorkflowClick}
                    isLast={index === items.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// ACTIVITY ITEM
// =============================================================================

interface ActivityItemProps {
  activity: Activity
  showWorkflowName: boolean
  onClick?: () => void
  onWorkflowClick?: (workflowId: string) => void
  isLast: boolean
}

function ActivityItem({
  activity,
  showWorkflowName,
  onClick,
  onWorkflowClick,
  isLast
}: ActivityItemProps) {
  const actionText = getActionText(activity)
  const colors = getActivityColors(activity.type)

  return (
    <div
      className={`flex gap-4 group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Timeline line and icon */}
      <div className="relative flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.bg}`}>
          <ActivityIcon type={activity.type} className={`w-5 h-5 ${colors.text}`} />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border mt-2" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{activity.user.name}</span>
              <span className="text-muted-foreground"> {actionText}</span>
              {showWorkflowName && (
                <>
                  <span className="text-muted-foreground"> on </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onWorkflowClick?.(activity.workflow.id)
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    {activity.workflow.name}
                  </button>
                </>
              )}
            </p>
            {activity.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatTime(new Date(activity.timestamp))}
          </span>
        </div>

        {/* User avatar on hover */}
        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Avatar name={activity.user.name} avatarUrl={activity.user.avatarUrl} size="xs" />
          <span className="text-xs text-muted-foreground">{activity.user.name}</span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function getActionText(activity: Activity): string {
  const actions: Record<ActivityType, string> = {
    created: 'created',
    edited: 'edited',
    ran: 'ran',
    completed: 'completed',
    failed: 'run failed',
    commented: 'commented',
    shared: 'shared',
    archived: 'archived',
    restored: 'restored'
  }
  return actions[activity.type]
}

function getActivityColors(type: ActivityType): { bg: string; text: string } {
  const colors: Record<ActivityType, { bg: string; text: string }> = {
    created: { bg: 'bg-green-500/10', text: 'text-green-500' },
    edited: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
    ran: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
    completed: { bg: 'bg-green-500/10', text: 'text-green-500' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-500' },
    commented: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
    shared: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
    archived: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
    restored: { bg: 'bg-teal-500/10', text: 'text-teal-500' }
  }
  return colors[type]
}

function getDateGroupKey(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return 'This Week'
  if (diffDays < 30) return 'This Month'
  return 'Older'
}

function formatTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHour = Math.floor(diffMin / 60)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// =============================================================================
// AVATAR
// =============================================================================

interface AvatarProps {
  name: string
  avatarUrl?: string
  size?: 'xs' | 'sm'
}

function Avatar({ name, avatarUrl, size = 'sm' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizes = {
    xs: { class: 'w-5 h-5 text-[10px]', px: 20 },
    sm: { class: 'w-6 h-6 text-xs', px: 24 }
  }

  if (avatarUrl) {
    return (
      <OptimizedAvatar
        src={avatarUrl}
        alt={name}
        size={sizes[size].px}
        className={sizes[size].class}
      />
    )
  }

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500'
  ]
  const colorIndex = name.charCodeAt(0) % colors.length

  return (
    <div
      className={`${sizes[size].class} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium`}
    >
      {initials}
    </div>
  )
}

// =============================================================================
// ACTIVITY ICON
// =============================================================================

interface ActivityIconProps {
  type: ActivityType
  className?: string
}

function ActivityIcon({ type, className }: ActivityIconProps) {
  const icons: Record<ActivityType, JSX.Element> = {
    created: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    edited: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    ran: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    completed: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    failed: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    commented: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    shared: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    archived: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    restored: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    )
  }

  return icons[type]
}

export default ActivityFeed

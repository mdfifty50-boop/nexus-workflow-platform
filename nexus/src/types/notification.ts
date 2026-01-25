// Notification Types for Nexus Platform

export type NotificationType =
  | 'workflow_complete'
  | 'workflow_error'
  | 'mention'
  | 'system'
  | 'achievement'
  | 'collaboration'
  | 'reminder'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export type NotificationChannel = 'in_app' | 'push' | 'email'

export interface Notification {
  id: string
  created_at: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  read: boolean
  read_at: string | null
  // Optional metadata for different notification types
  metadata: NotificationMetadata
  // Link to related resource
  action_url: string | null
  action_label: string | null
  // Expiration for time-sensitive notifications
  expires_at: string | null
}

export interface NotificationMetadata {
  // For workflow notifications
  workflow_id?: string
  workflow_name?: string
  execution_id?: string
  error_message?: string
  // For mention notifications
  mentioned_by?: string
  mentioned_in?: string
  comment_id?: string
  // For collaboration notifications
  project_id?: string
  project_name?: string
  collaborator_id?: string
  collaborator_name?: string
  // For achievement notifications
  achievement_id?: string
  achievement_name?: string
  achievement_icon?: string
  // Generic
  [key: string]: unknown
}

export interface NotificationPreferences {
  id: string
  user_id: string
  updated_at: string
  // Global settings
  notifications_enabled: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string // HH:MM format
  quiet_hours_end: string   // HH:MM format
  // Channel preferences per notification type
  channels: NotificationChannelPreferences
  // Email digest settings
  email_digest_enabled: boolean
  email_digest_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
  // Push notification settings
  push_enabled: boolean
  push_sound_enabled: boolean
  // In-app settings
  in_app_enabled: boolean
  in_app_sound_enabled: boolean
  show_preview: boolean
}

export interface NotificationChannelPreferences {
  workflow_complete: NotificationChannel[]
  workflow_error: NotificationChannel[]
  mention: NotificationChannel[]
  system: NotificationChannel[]
  achievement: NotificationChannel[]
  collaboration: NotificationChannel[]
  reminder: NotificationChannel[]
}

export interface PushSubscription {
  id: string
  user_id: string
  created_at: string
  endpoint: string
  p256dh_key: string
  auth_key: string
  user_agent: string
  is_active: boolean
}

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'id' | 'user_id' | 'updated_at'> = {
  notifications_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  channels: {
    workflow_complete: ['in_app', 'push'],
    workflow_error: ['in_app', 'push', 'email'],
    mention: ['in_app', 'push'],
    system: ['in_app'],
    achievement: ['in_app', 'push'],
    collaboration: ['in_app', 'push'],
    reminder: ['in_app', 'push'],
  },
  email_digest_enabled: true,
  email_digest_frequency: 'daily',
  push_enabled: true,
  push_sound_enabled: true,
  in_app_enabled: true,
  in_app_sound_enabled: false,
  show_preview: true,
}

// Notification type display info
export const NOTIFICATION_TYPE_INFO: Record<NotificationType, { icon: string; color: string; label: string }> = {
  workflow_complete: { icon: '✓', color: 'text-green-400', label: 'Workflow Complete' },
  workflow_error: { icon: '!', color: 'text-red-400', label: 'Workflow Error' },
  mention: { icon: '@', color: 'text-blue-400', label: 'Mention' },
  system: { icon: 'i', color: 'text-slate-400', label: 'System' },
  achievement: { icon: '★', color: 'text-yellow-400', label: 'Achievement' },
  collaboration: { icon: '👥', color: 'text-purple-400', label: 'Collaboration' },
  reminder: { icon: '⏰', color: 'text-orange-400', label: 'Reminder' },
}

// Helper function to get notification icon
export function getNotificationIcon(type: NotificationType): string {
  return NOTIFICATION_TYPE_INFO[type]?.icon || 'i'
}

// Helper function to get notification color class
export function getNotificationColor(type: NotificationType): string {
  return NOTIFICATION_TYPE_INFO[type]?.color || 'text-slate-400'
}

// Helper function to format notification time
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

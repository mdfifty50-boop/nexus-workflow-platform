/**
 * Notification Context
 * Enhanced notification system building on existing Toast infrastructure
 * Provides additional features like persistence, stacking, and action buttons
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface NotificationAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number // 0 = persistent (manual dismiss)
  actions?: NotificationAction[]
  dismissible?: boolean
  createdAt: Date
  // For loading notifications that can be updated
  progress?: number
  progressText?: string
}

interface NotificationContextType {
  notifications: Notification[]
  // Basic methods
  notify: (notification: Omit<Notification, 'id' | 'createdAt'>) => string
  dismiss: (id: string) => void
  dismissAll: () => void
  // Convenience methods
  success: (title: string, message?: string, options?: NotificationOptions) => string
  error: (title: string, message?: string, options?: NotificationOptions) => string
  warning: (title: string, message?: string, options?: NotificationOptions) => string
  info: (title: string, message?: string, options?: NotificationOptions) => string
  loading: (title: string, message?: string) => {
    id: string
    update: (updates: Partial<Notification>) => void
    success: (title: string, message?: string) => void
    error: (title: string, message?: string) => void
    dismiss: () => void
  }
  // Update existing notification
  update: (id: string, updates: Partial<Notification>) => void
}

interface NotificationOptions {
  duration?: number
  actions?: NotificationAction[]
  dismissible?: boolean
}

const NotificationContext = createContext<NotificationContextType | null>(null)

let notificationId = 0

// Default durations
const DEFAULT_DURATIONS: Record<NotificationType, number> = {
  success: 4000,
  error: 7000,
  warning: 6000,
  info: 5000,
  loading: 0, // Persistent until manually dismissed
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Clean up expired notifications
  useEffect(() => {
    const timers: NodeJS.Timeout[] = []

    notifications.forEach((notification) => {
      if (notification.duration && notification.duration > 0) {
        const elapsed = Date.now() - notification.createdAt.getTime()
        const remaining = notification.duration - elapsed

        if (remaining > 0) {
          const timer = setTimeout(() => {
            dismiss(notification.id)
          }, remaining)
          timers.push(timer)
        }
      }
    })

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [notifications])

  // Add notification
  const notify = useCallback((
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): string => {
    const id = `notification-${++notificationId}`
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
      duration: notification.duration ?? DEFAULT_DURATIONS[notification.type],
      dismissible: notification.dismissible ?? true,
    }

    setNotifications((prev) => {
      // Limit to 5 notifications max
      const limited = prev.slice(-4)
      return [...limited, newNotification]
    })

    return id
  }, [])

  // Dismiss notification
  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Dismiss all
  const dismissAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Update notification
  const update = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    )
  }, [])

  // Convenience methods
  const success = useCallback((
    title: string,
    message?: string,
    options?: NotificationOptions
  ): string => {
    return notify({
      type: 'success',
      title,
      message,
      ...options,
    })
  }, [notify])

  const error = useCallback((
    title: string,
    message?: string,
    options?: NotificationOptions
  ): string => {
    return notify({
      type: 'error',
      title,
      message,
      ...options,
    })
  }, [notify])

  const warning = useCallback((
    title: string,
    message?: string,
    options?: NotificationOptions
  ): string => {
    return notify({
      type: 'warning',
      title,
      message,
      ...options,
    })
  }, [notify])

  const info = useCallback((
    title: string,
    message?: string,
    options?: NotificationOptions
  ): string => {
    return notify({
      type: 'info',
      title,
      message,
      ...options,
    })
  }, [notify])

  // Loading notification with update capability
  const loading = useCallback((title: string, message?: string) => {
    const id = notify({
      type: 'loading',
      title,
      message,
      duration: 0,
      dismissible: false,
    })

    return {
      id,
      update: (updates: Partial<Notification>) => update(id, updates),
      success: (successTitle: string, successMessage?: string) => {
        update(id, {
          type: 'success',
          title: successTitle,
          message: successMessage,
          duration: DEFAULT_DURATIONS.success,
          dismissible: true,
          progress: undefined,
          progressText: undefined,
        })
      },
      error: (errorTitle: string, errorMessage?: string) => {
        update(id, {
          type: 'error',
          title: errorTitle,
          message: errorMessage,
          duration: DEFAULT_DURATIONS.error,
          dismissible: true,
          progress: undefined,
          progressText: undefined,
        })
      },
      dismiss: () => dismiss(id),
    }
  }, [notify, update, dismiss])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        notify,
        dismiss,
        dismissAll,
        update,
        success,
        error,
        warning,
        info,
        loading,
      }}
    >
      {children}
      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  )
}

// Hook to use notifications
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

// Notification Toast Component
function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: Notification
  onDismiss: () => void
}) {
  const [isExiting, setIsExiting] = useState(false)

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(onDismiss, 200)
  }, [onDismiss])

  const typeStyles: Record<NotificationType, { bg: string; icon: string; iconBg: string }> = {
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      icon: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/30',
      icon: 'text-red-400',
      iconBg: 'bg-red-500/20',
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
    },
    info: {
      bg: 'bg-cyan-500/10 border-cyan-500/30',
      icon: 'text-cyan-400',
      iconBg: 'bg-cyan-500/20',
    },
    loading: {
      bg: 'bg-purple-500/10 border-purple-500/30',
      icon: 'text-purple-400',
      iconBg: 'bg-purple-500/20',
    },
  }

  const icons: Record<NotificationType, React.ReactNode> = {
    success: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    loading: (
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
    ),
  }

  const style = typeStyles[notification.type]

  return (
    <div
      className={`
        transform transition-all duration-200
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      role="alert"
      aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
    >
      <div
        className={`
          flex max-w-sm rounded-xl border p-4 shadow-lg backdrop-blur-sm
          ${style.bg}
        `}
      >
        {/* Icon */}
        <div className={`flex-shrink-0 rounded-lg p-2 ${style.iconBg} ${style.icon}`} aria-hidden="true">
          {icons[notification.type]}
        </div>

        {/* Content */}
        <div className="ml-3 flex-1">
          <p className="font-medium text-foreground">{notification.title}</p>
          {notification.message && (
            <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
          )}

          {/* Progress */}
          {notification.type === 'loading' && notification.progress !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{notification.progressText || 'Processing...'}</span>
                <span>{notification.progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${notification.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick()
                    handleDismiss()
                  }}
                  className={`
                    rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                    ${action.variant === 'primary'
                      ? 'bg-primary text-primary-foreground hover:opacity-90'
                      : 'bg-muted hover:bg-muted/80'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {notification.dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-2 flex-shrink-0 rounded p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Dismiss notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// Notification Container
function NotificationContainer({
  notifications,
  onDismiss,
}: {
  notifications: Notification[]
  onDismiss: (id: string) => void
}) {
  return (
    <div
      className="fixed right-4 top-20 z-50 flex flex-col gap-2"
      aria-label="Notifications"
      role="region"
    >
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={() => onDismiss(notification.id)}
        />
      ))}
    </div>
  )
}

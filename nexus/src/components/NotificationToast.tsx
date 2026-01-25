/**
 * NotificationToast Component
 * Standalone toast component for notifications with enhanced features
 * Can be used independently or with NotificationContext
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface ToastAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
}

export interface NotificationToastProps {
  id?: string
  type: ToastType
  title: string
  message?: string
  duration?: number // 0 = persistent
  actions?: ToastAction[]
  dismissible?: boolean
  onDismiss?: () => void
  icon?: ReactNode
  progress?: number
  progressText?: string
  className?: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

// Default icons for each type
const defaultIcons: Record<ToastType, ReactNode> = {
  success: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  loading: (
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
  ),
}

// Style configurations
const typeStyles: Record<ToastType, { container: string; icon: string; iconBg: string }> = {
  success: {
    container: 'bg-emerald-500/10 border-emerald-500/30',
    icon: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
  },
  error: {
    container: 'bg-red-500/10 border-red-500/30',
    icon: 'text-red-400',
    iconBg: 'bg-red-500/20',
  },
  warning: {
    container: 'bg-amber-500/10 border-amber-500/30',
    icon: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
  },
  info: {
    container: 'bg-cyan-500/10 border-cyan-500/30',
    icon: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
  },
  loading: {
    container: 'bg-purple-500/10 border-purple-500/30',
    icon: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
  },
}

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 7000,
  warning: 6000,
  info: 5000,
  loading: 0,
}

export function NotificationToast({
  type,
  title,
  message,
  duration,
  actions,
  dismissible = true,
  onDismiss,
  icon,
  progress,
  progressText,
  className,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const effectiveDuration = duration ?? DEFAULT_DURATIONS[type]
  const style = typeStyles[type]

  // Entrance animation
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  // Auto-dismiss
  useEffect(() => {
    if (effectiveDuration === 0) return

    const timer = setTimeout(() => {
      handleDismiss()
    }, effectiveDuration)

    return () => clearTimeout(timer)
  }, [effectiveDuration])

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss?.()
    }, 200)
  }, [onDismiss])

  return (
    <div
      className={cn(
        'transform transition-all duration-200 ease-out',
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        className
      )}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div
        className={cn(
          'flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm',
          style.container
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
            style.iconBg,
            style.icon
          )}
        >
          {icon || defaultIcons[type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{title}</p>

          {message && (
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          )}

          {/* Progress bar for loading type */}
          {type === 'loading' && progress !== undefined && (
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{progressText || 'Processing...'}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          {actions && actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick()
                    if (dismissible) handleDismiss()
                  }}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    action.variant === 'primary' && 'bg-primary text-primary-foreground hover:opacity-90',
                    action.variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                    (!action.variant || action.variant === 'ghost') && 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={cn(
              'flex-shrink-0 rounded p-1 transition-colors',
              'text-muted-foreground hover:text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary'
            )}
            aria-label="Dismiss notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar timer indicator (optional) */}
      {effectiveDuration > 0 && type !== 'loading' && (
        <div className="mt-0.5 h-0.5 overflow-hidden rounded-full bg-transparent">
          <div
            className={cn(
              'h-full rounded-full',
              type === 'success' && 'bg-emerald-500',
              type === 'error' && 'bg-red-500',
              type === 'warning' && 'bg-amber-500',
              type === 'info' && 'bg-cyan-500'
            )}
            style={{
              animation: `shrink ${effectiveDuration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// Standalone toast container for imperative usage
interface ToastItem extends NotificationToastProps {
  id: string
}

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxToasts?: number
}

export function ToastContainer({
  position = 'top-right',
  maxToasts = 5,
}: ToastContainerProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  // Subscribe to global toast events
  useEffect(() => {
    const handleToast = (event: CustomEvent<Omit<ToastItem, 'id'>>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setToasts((prev) => [...prev.slice(-(maxToasts - 1)), { ...event.detail, id }])
    }

    window.addEventListener('nexus:toast' as any, handleToast)
    return () => window.removeEventListener('nexus:toast' as any, handleToast)
  }, [maxToasts])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const positionClasses: Record<string, string> = {
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-20 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  }

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2',
        positionClasses[position]
      )}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          {...toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

// Imperative toast function
export function toast(options: Omit<NotificationToastProps, 'onDismiss'>) {
  const event = new CustomEvent('nexus:toast', { detail: options })
  window.dispatchEvent(event)
}

// Convenience methods
toast.success = (title: string, message?: string, options?: Partial<NotificationToastProps>) => {
  toast({ type: 'success', title, message, ...options })
}

toast.error = (title: string, message?: string, options?: Partial<NotificationToastProps>) => {
  toast({ type: 'error', title, message, ...options })
}

toast.warning = (title: string, message?: string, options?: Partial<NotificationToastProps>) => {
  toast({ type: 'warning', title, message, ...options })
}

toast.info = (title: string, message?: string, options?: Partial<NotificationToastProps>) => {
  toast({ type: 'info', title, message, ...options })
}

toast.loading = (title: string, message?: string, options?: Partial<NotificationToastProps>) => {
  toast({ type: 'loading', title, message, duration: 0, dismissible: false, ...options })
}

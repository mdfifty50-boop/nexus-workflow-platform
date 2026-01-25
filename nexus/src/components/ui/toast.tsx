/**
 * UX IMPROVEMENT #2: Toast notification component for user feedback
 * Provides visual feedback for success, error, warning, and info states
 */

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose?: () => void
}

const toastIcons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
}

const toastStyles = {
  success: 'bg-emerald-500/90 text-white border-emerald-600',
  error: 'bg-red-500/90 text-white border-red-600',
  warning: 'bg-amber-500/90 text-white border-amber-600',
  info: 'bg-blue-500/90 text-white border-blue-600'
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'fixed top-20 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-xl backdrop-blur-sm',
        'transition-all duration-300 transform',
        toastStyles[type],
        isExiting ? 'translate-x-[400px] opacity-0' : 'translate-x-0 opacity-100'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
        <span className="text-lg font-bold">{toastIcons[type]}</span>
      </div>
      <p className="font-medium text-sm">{message}</p>
      <button
        onClick={() => {
          setIsExiting(true)
          setTimeout(() => {
            setIsVisible(false)
            onClose?.()
          }, 300)
        }}
        className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// Container for managing multiple toasts
export function ToastContainer({ toasts }: { toasts: Array<ToastProps & { id: string }> }) {
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          <Toast {...toast} />
        </div>
      ))}
    </div>
  )
}

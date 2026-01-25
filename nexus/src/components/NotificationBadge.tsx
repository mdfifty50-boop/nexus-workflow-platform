import { useEffect, useState, useCallback, useRef } from 'react'

interface NotificationBadgeProps {
  count: number
  maxCount?: number
  showZero?: boolean
  animate?: boolean
  size?: 'sm' | 'md' | 'lg'
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
}

export function NotificationBadge({
  count,
  maxCount = 99,
  showZero = false,
  animate = true,
  size = 'sm',
  position = 'top-right',
  className = '',
}: NotificationBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const prevCountRef = useRef(count)

  // Animate when count increases
  useEffect(() => {
    if (animate && count > prevCountRef.current) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
    prevCountRef.current = count
  }, [count, animate])

  if (!showZero && count === 0) {
    return null
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString()

  const sizeClasses = {
    sm: 'min-w-[1.125rem] h-[1.125rem] text-[10px]',
    md: 'min-w-[1.375rem] h-[1.375rem] text-xs',
    lg: 'min-w-[1.625rem] h-[1.625rem] text-sm',
  }

  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
  }

  return (
    <span
      className={`
        absolute ${positionClasses[position]}
        ${sizeClasses[size]}
        flex items-center justify-center
        rounded-full bg-red-500 text-white font-bold
        px-1 leading-none
        ${isAnimating ? 'animate-bounce-badge' : ''}
        ${className}
      `}
      aria-label={`${count} notifications`}
    >
      {displayCount}
    </span>
  )
}

// Hook for managing notification badge state
export function useNotificationBadge(initialCount = 0) {
  const [count, setCount] = useState(initialCount)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)

  const increment = useCallback((amount = 1) => {
    setCount(prev => prev + amount)
    setHasNewNotifications(true)
  }, [])

  const decrement = useCallback((amount = 1) => {
    setCount(prev => Math.max(0, prev - amount))
  }, [])

  const reset = useCallback(() => {
    setCount(0)
    setHasNewNotifications(false)
  }, [])

  const markAsSeen = useCallback(() => {
    setHasNewNotifications(false)
  }, [])

  const setUnreadCount = useCallback((newCount: number) => {
    if (newCount > count) {
      setHasNewNotifications(true)
    }
    setCount(newCount)
  }, [count])

  return {
    count,
    hasNewNotifications,
    increment,
    decrement,
    reset,
    markAsSeen,
    setUnreadCount,
  }
}

// Standalone badge component for use anywhere (not just notifications)
interface StandaloneBadgeProps {
  count?: number
  dot?: boolean
  color?: 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'cyan'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
}

export function Badge({
  count,
  dot = false,
  color = 'red',
  size = 'sm',
  className = '',
  children,
}: StandaloneBadgeProps) {
  const colorClasses = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
  }

  const sizeClasses = {
    sm: dot ? 'w-2 h-2' : 'min-w-[1.125rem] h-[1.125rem] text-[10px]',
    md: dot ? 'w-2.5 h-2.5' : 'min-w-[1.375rem] h-[1.375rem] text-xs',
    lg: dot ? 'w-3 h-3' : 'min-w-[1.625rem] h-[1.625rem] text-sm',
  }

  const showBadge = dot || (count !== undefined && count > 0)

  return (
    <span className={`relative inline-flex ${className}`}>
      {children}
      {showBadge && (
        <span
          className={`
            absolute -top-1 -right-1
            ${sizeClasses[size]}
            ${colorClasses[color]}
            ${dot ? 'rounded-full' : 'flex items-center justify-center rounded-full text-white font-bold px-1'}
          `}
        >
          {!dot && count !== undefined && (count > 99 ? '99+' : count)}
        </span>
      )}
    </span>
  )
}

// Pulse badge for attention-grabbing notifications
interface PulseBadgeProps {
  show?: boolean
  color?: 'red' | 'green' | 'blue' | 'cyan'
  className?: string
}

export function PulseBadge({ show = true, color = 'cyan', className = '' }: PulseBadgeProps) {
  if (!show) return null

  const colorClasses = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    cyan: 'bg-cyan-500',
  }

  return (
    <span className={`absolute -top-0.5 -right-0.5 flex h-3 w-3 ${className}`}>
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClasses[color]} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colorClasses[color]}`} />
    </span>
  )
}

// CSS for the bounce animation (add to your global styles or Tailwind config)
// @keyframes bounce-badge {
//   0%, 100% { transform: scale(1); }
//   50% { transform: scale(1.2); }
// }
// .animate-bounce-badge {
//   animation: bounce-badge 0.3s ease-in-out;
// }

export default NotificationBadge

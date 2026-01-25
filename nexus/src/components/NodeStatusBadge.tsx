/**
 * NodeStatusBadge - Status badges for workflow nodes
 *
 * Features:
 * - Color-coded status indicators
 * - Animated states for running/processing
 * - Icon variants for each status
 * - Multiple size options
 * - Tooltip with status details
 */

import { useState } from 'react'

export type NodeStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'retrying' | 'paused' | 'skipped'

interface NodeStatusBadgeProps {
  status: NodeStatus
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showIcon?: boolean
  showTooltip?: boolean
  label?: string
  retryCount?: number
  className?: string
  onClick?: () => void
}

// Status configurations
const STATUS_CONFIG: Record<NodeStatus, {
  label: string
  bg: string
  border: string
  text: string
  glow: string
  icon: string
  animate?: string
}> = {
  idle: {
    label: 'Idle',
    bg: 'bg-slate-600',
    border: 'border-slate-500',
    text: 'text-slate-400',
    glow: '',
    icon: 'circle',
  },
  pending: {
    label: 'Pending',
    bg: 'bg-slate-500',
    border: 'border-slate-400',
    text: 'text-slate-300',
    glow: '',
    icon: 'clock',
  },
  running: {
    label: 'Running',
    bg: 'bg-cyan-500',
    border: 'border-cyan-400',
    text: 'text-cyan-400',
    glow: 'shadow-lg shadow-cyan-500/50',
    icon: 'spinner',
    animate: 'animate-pulse',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-500',
    border: 'border-emerald-400',
    text: 'text-emerald-400',
    glow: 'shadow-sm shadow-emerald-500/30',
    icon: 'check',
  },
  failed: {
    label: 'Failed',
    bg: 'bg-red-500',
    border: 'border-red-400',
    text: 'text-red-400',
    glow: 'shadow-lg shadow-red-500/50',
    icon: 'x',
  },
  retrying: {
    label: 'Retrying',
    bg: 'bg-amber-500',
    border: 'border-amber-400',
    text: 'text-amber-400',
    glow: 'shadow-lg shadow-amber-500/50',
    icon: 'refresh',
    animate: 'animate-spin',
  },
  paused: {
    label: 'Paused',
    bg: 'bg-purple-500',
    border: 'border-purple-400',
    text: 'text-purple-400',
    glow: '',
    icon: 'pause',
  },
  skipped: {
    label: 'Skipped',
    bg: 'bg-slate-400',
    border: 'border-slate-300',
    text: 'text-slate-300',
    glow: '',
    icon: 'skip',
  },
}

// Size configurations
const SIZE_CONFIG = {
  xs: {
    badge: 'h-4 px-1.5 text-[10px] gap-0.5',
    dot: 'w-1.5 h-1.5',
    icon: 'w-2.5 h-2.5',
  },
  sm: {
    badge: 'h-5 px-2 text-xs gap-1',
    dot: 'w-2 h-2',
    icon: 'w-3 h-3',
  },
  md: {
    badge: 'h-6 px-2.5 text-sm gap-1.5',
    dot: 'w-2.5 h-2.5',
    icon: 'w-4 h-4',
  },
  lg: {
    badge: 'h-8 px-3 text-base gap-2',
    dot: 'w-3 h-3',
    icon: 'w-5 h-5',
  },
}

export function NodeStatusBadge({
  status,
  size = 'sm',
  showLabel = true,
  showIcon = true,
  showTooltip = true,
  label,
  retryCount,
  className = '',
  onClick,
}: NodeStatusBadgeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const config = STATUS_CONFIG[status]
  const sizeConfig = SIZE_CONFIG[size]

  // Render icon based on status
  const renderIcon = () => {
    switch (config.icon) {
      case 'spinner':
        return (
          <svg className={`${sizeConfig.icon} animate-spin`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )
      case 'check':
        return (
          <svg className={sizeConfig.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'x':
        return (
          <svg className={sizeConfig.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'clock':
        return (
          <svg className={sizeConfig.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 6v6l4 2" />
          </svg>
        )
      case 'refresh':
        return (
          <svg className={`${sizeConfig.icon} ${config.animate}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'pause':
        return (
          <svg className={sizeConfig.icon} fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        )
      case 'skip':
        return (
          <svg className={sizeConfig.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        )
      case 'circle':
      default:
        return <span className={`${sizeConfig.dot} rounded-full ${config.bg}`} />
    }
  }

  const displayLabel = label || config.label
  const badgeLabel = status === 'retrying' && retryCount ? `${displayLabel} (${retryCount})` : displayLabel

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={`
          inline-flex items-center rounded-full font-medium
          ${sizeConfig.badge}
          ${config.bg} ${config.border} border
          ${config.text} ${config.glow}
          ${config.animate || ''}
          ${onClick ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}
          transition-all duration-200
        `}
      >
        {showIcon && (
          <span className="flex-shrink-0 text-white">
            {renderIcon()}
          </span>
        )}
        {showLabel && (
          <span className="text-white font-medium whitespace-nowrap">
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && isHovered && (
        <div className="absolute z-50 -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap border border-slate-700">
          <div className="font-medium">{config.label}</div>
          {status === 'retrying' && retryCount && (
            <div className="text-amber-400">Attempt {retryCount}</div>
          )}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-800 border-r border-b border-slate-700" />
        </div>
      )}
    </div>
  )
}

// Dot-only status indicator (minimal version)
export function StatusDot({
  status,
  size = 'sm',
  pulse = true,
  className = '',
}: {
  status: NodeStatus
  size?: 'xs' | 'sm' | 'md' | 'lg'
  pulse?: boolean
  className?: string
}) {
  const config = STATUS_CONFIG[status]
  const sizeConfig = SIZE_CONFIG[size]
  const shouldPulse = pulse && (status === 'running' || status === 'retrying')

  return (
    <span className={`relative inline-flex ${className}`}>
      {shouldPulse && (
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${config.bg} opacity-75 animate-ping`}
        />
      )}
      <span
        className={`
          relative inline-flex rounded-full
          ${sizeConfig.dot} ${config.bg}
          ${shouldPulse ? '' : config.animate || ''}
        `}
      />
    </span>
  )
}

// Status indicator for workflow node corners
export function NodeCornerStatus({
  status,
  position = 'top-right',
  className = '',
}: {
  status: NodeStatus
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
}) {
  const config = STATUS_CONFIG[status]

  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
  }

  return (
    <div
      className={`
        absolute ${positionClasses[position]}
        w-4 h-4 rounded-full border-2 border-slate-900
        ${config.bg} ${config.glow}
        ${config.animate || ''}
        ${className}
      `}
    >
      {(status === 'running' || status === 'retrying') && (
        <span className="absolute inset-0 rounded-full animate-ping bg-inherit opacity-50" />
      )}
    </div>
  )
}

export default NodeStatusBadge

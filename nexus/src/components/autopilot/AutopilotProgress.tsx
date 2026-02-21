/**
 * AutopilotProgress - Step-by-step progress tracker for Autopilot configuration.
 *
 * Shows a vertical list of steps with status icons, highlighting the current step
 * with a glow effect. Supports compact mode for embedding in constrained layouts.
 */

import { useMemo } from 'react'

export interface AutopilotProgressStep {
  id: string
  service: string
  description: string
  status: 'pending' | 'executing' | 'credential_wait' | 'complete' | 'error' | 'skipped'
  method: 'api' | 'browser'
}

interface AutopilotProgressProps {
  steps: AutopilotProgressStep[]
  currentStep: number
  compact?: boolean
}

const STATUS_CONFIG = {
  pending: {
    icon: 'circle',
    color: 'text-surface-500',
    bg: 'bg-surface-700',
    border: 'border-surface-600',
    label: 'Pending',
  },
  executing: {
    icon: 'spinner',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    label: 'Executing...',
  },
  credential_wait: {
    icon: 'lock',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    label: 'Waiting for credentials',
  },
  complete: {
    icon: 'check',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    label: 'Complete',
  },
  error: {
    icon: 'x',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: 'Error',
  },
  skipped: {
    icon: 'dash',
    color: 'text-surface-500',
    bg: 'bg-surface-800',
    border: 'border-surface-700',
    label: 'Skipped',
  },
} as const

function StatusIcon({ status, compact }: { status: AutopilotProgressStep['status']; compact: boolean }) {
  const size = compact ? 'w-3.5 h-3.5' : 'w-4 h-4'

  switch (STATUS_CONFIG[status].icon) {
    case 'circle':
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
    case 'spinner':
      return (
        <svg className={`${size} animate-spin`} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )
    case 'lock':
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      )
    case 'check':
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )
    case 'x':
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    case 'dash':
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" d="M5 12h14" />
        </svg>
      )
  }
}

function MethodBadge({ method, compact }: { method: 'api' | 'browser'; compact: boolean }) {
  if (compact) return null

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
        method === 'browser'
          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
      }`}
    >
      {method === 'browser' ? (
        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      ) : (
        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
      )}
      {method}
    </span>
  )
}

export function AutopilotProgress({ steps, currentStep, compact = false }: AutopilotProgressProps) {
  const completedCount = useMemo(
    () => steps.filter((s) => s.status === 'complete').length,
    [steps]
  )

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'} text-surface-300`}>
          Configuration Steps
        </span>
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-surface-500`}>
          {completedCount}/{steps.length} done
        </span>
      </div>

      {/* Step list */}
      <div className="relative">
        {steps.map((step, index) => {
          const config = STATUS_CONFIG[step.status]
          const isCurrent = index === currentStep
          const isPast = index < currentStep

          return (
            <div key={step.id} className="flex items-start relative">
              {/* Vertical connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-0 ${compact ? 'left-[9px]' : 'left-[13px]'} w-px ${
                    compact ? 'h-full' : 'h-full'
                  } ${isPast || step.status === 'complete' ? 'bg-emerald-500/40' : 'bg-surface-700'}`}
                  style={{ top: compact ? '18px' : '24px' }}
                />
              )}

              {/* Step row */}
              <div
                className={`flex items-center gap-2 w-full rounded-lg transition-all duration-300 ${
                  compact ? 'py-1 px-1.5' : 'py-1.5 px-2'
                } ${
                  isCurrent
                    ? `${config.bg} border ${config.border} shadow-sm ${
                        step.status === 'executing' ? 'shadow-cyan-500/10' : ''
                      } ${step.status === 'credential_wait' ? 'shadow-amber-500/10' : ''}`
                    : ''
                }`}
              >
                {/* Status icon circle */}
                <div
                  className={`relative flex-shrink-0 flex items-center justify-center rounded-full ${
                    compact ? 'w-[18px] h-[18px]' : 'w-[26px] h-[26px]'
                  } ${config.bg} border ${config.border} ${config.color} ${
                    isCurrent && step.status === 'executing'
                      ? 'ring-2 ring-cyan-500/30 ring-offset-1 ring-offset-surface-900'
                      : ''
                  } ${
                    isCurrent && step.status === 'credential_wait'
                      ? 'ring-2 ring-amber-500/30 ring-offset-1 ring-offset-surface-900'
                      : ''
                  }`}
                >
                  <StatusIcon status={step.status} compact={compact} />
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'} ${
                        step.status === 'complete'
                          ? 'text-emerald-400'
                          : step.status === 'error'
                          ? 'text-red-400'
                          : step.status === 'skipped'
                          ? 'text-surface-500'
                          : isCurrent
                          ? 'text-white'
                          : 'text-surface-400'
                      }`}
                    >
                      {step.service}
                    </span>
                    <MethodBadge method={step.method} compact={compact} />
                  </div>
                  {!compact && (
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        isCurrent ? 'text-surface-300' : 'text-surface-500'
                      }`}
                    >
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Status label for current step */}
                {isCurrent && !compact && (
                  <span
                    className={`flex-shrink-0 text-[10px] font-medium uppercase tracking-wider ${config.color}`}
                  >
                    {config.label}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AutopilotProgress

/**
 * StepProgress - Workflow execution progress indicator
 *
 * Features:
 * - Visual step-by-step progress
 * - Current step highlighting with animation
 * - Completed/remaining step indicators
 * - Time estimation display
 * - Compact and expanded modes
 */

import { useMemo } from 'react'

export interface ProgressStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  duration?: number // in milliseconds
  estimatedDuration?: number // in milliseconds
  agentId?: string
  agentName?: string
}

interface StepProgressProps {
  steps: ProgressStep[]
  currentStepIndex?: number
  showLabels?: boolean
  showDuration?: boolean
  size?: 'sm' | 'md' | 'lg'
  orientation?: 'horizontal' | 'vertical'
  className?: string
  onStepClick?: (stepId: string, index: number) => void
}

// Status configurations
const STATUS_CONFIG = {
  pending: {
    bg: 'bg-slate-600',
    border: 'border-slate-500',
    text: 'text-slate-400',
    icon: null,
  },
  running: {
    bg: 'bg-cyan-500',
    border: 'border-cyan-400',
    text: 'text-cyan-400',
    icon: 'spinner',
    animate: true,
  },
  completed: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-400',
    text: 'text-emerald-400',
    icon: 'check',
  },
  failed: {
    bg: 'bg-red-500',
    border: 'border-red-400',
    text: 'text-red-400',
    icon: 'x',
  },
  skipped: {
    bg: 'bg-amber-500/50',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    icon: 'skip',
  },
}

// Size configurations
const SIZE_CONFIG = {
  sm: {
    circle: 'w-6 h-6',
    icon: 'w-3 h-3',
    text: 'text-xs',
    gap: 'gap-1',
    connector: 'h-0.5',
    connectorVert: 'w-0.5 h-4',
  },
  md: {
    circle: 'w-8 h-8',
    icon: 'w-4 h-4',
    text: 'text-sm',
    gap: 'gap-2',
    connector: 'h-0.5',
    connectorVert: 'w-0.5 h-6',
  },
  lg: {
    circle: 'w-10 h-10',
    icon: 'w-5 h-5',
    text: 'text-base',
    gap: 'gap-3',
    connector: 'h-1',
    connectorVert: 'w-1 h-8',
  },
}

export function StepProgress({
  steps,
  currentStepIndex,
  showLabels = true,
  showDuration = false,
  size = 'md',
  orientation = 'horizontal',
  className = '',
  onStepClick,
}: StepProgressProps) {
  const sizeConfig = SIZE_CONFIG[size]

  // Calculate stats
  const stats = useMemo(() => {
    const completed = steps.filter(s => s.status === 'completed').length
    const failed = steps.filter(s => s.status === 'failed').length
    const running = steps.filter(s => s.status === 'running').length
    const pending = steps.filter(s => s.status === 'pending').length

    const totalDuration = steps.reduce((sum, s) => sum + (s.duration || 0), 0)
    const estimatedRemaining = steps
      .filter(s => s.status === 'pending' || s.status === 'running')
      .reduce((sum, s) => sum + (s.estimatedDuration || 0), 0)

    return {
      completed,
      failed,
      running,
      pending,
      total: steps.length,
      progress: Math.round((completed / steps.length) * 100),
      totalDuration,
      estimatedRemaining,
    }
  }, [steps])

  // Format duration
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  // Render step icon
  const renderIcon = (status: ProgressStep['status']) => {
    const config = STATUS_CONFIG[status]

    if (config.icon === 'spinner') {
      return (
        <svg
          className={`${sizeConfig.icon} animate-spin`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )
    }

    if (config.icon === 'check') {
      return (
        <svg className={sizeConfig.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )
    }

    if (config.icon === 'x') {
      return (
        <svg className={sizeConfig.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    }

    if (config.icon === 'skip') {
      return (
        <svg className={sizeConfig.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      )
    }

    return null
  }

  // Render horizontal progress
  const renderHorizontal = () => (
    <div className={`flex items-start ${sizeConfig.gap} ${className}`}>
      {steps.map((step, index) => {
        const config = STATUS_CONFIG[step.status]
        const isCurrent = index === currentStepIndex
        const isClickable = !!onStepClick

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle and label */}
            <div
              className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={() => onStepClick?.(step.id, index)}
            >
              {/* Circle */}
              <div
                className={`
                  ${sizeConfig.circle} rounded-full flex items-center justify-center
                  ${config.bg} border-2 ${config.border}
                  ${isCurrent ? 'ring-2 ring-cyan-500/50 ring-offset-2 ring-offset-slate-900' : ''}
                  ${'animate' in config && config.animate ? 'animate-pulse shadow-lg shadow-cyan-500/50' : ''}
                  transition-all duration-300 text-white
                `}
              >
                {renderIcon(step.status) || (
                  <span className={sizeConfig.text}>{index + 1}</span>
                )}
              </div>

              {/* Label */}
              {showLabels && (
                <div className="mt-2 text-center max-w-[80px]">
                  <p className={`${sizeConfig.text} ${config.text} truncate`}>
                    {step.name}
                  </p>
                  {showDuration && step.duration && (
                    <p className="text-xs text-slate-500">
                      {formatDuration(step.duration)}
                    </p>
                  )}
                  {step.agentName && (
                    <p className="text-xs text-slate-500 truncate">
                      {step.agentName}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 min-w-[20px] ${sizeConfig.connector} mx-2
                  ${step.status === 'completed' ? 'bg-emerald-500' :
                    step.status === 'running' ? 'bg-gradient-to-r from-cyan-500 to-slate-600' :
                    'bg-slate-700'}
                  transition-colors duration-300
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )

  // Render vertical progress
  const renderVertical = () => (
    <div className={`flex flex-col ${sizeConfig.gap} ${className}`}>
      {steps.map((step, index) => {
        const config = STATUS_CONFIG[step.status]
        const isCurrent = index === currentStepIndex
        const isClickable = !!onStepClick

        return (
          <div key={step.id} className="flex items-start">
            {/* Circle and connector column */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={`
                  ${sizeConfig.circle} rounded-full flex items-center justify-center
                  ${config.bg} border-2 ${config.border}
                  ${isCurrent ? 'ring-2 ring-cyan-500/50 ring-offset-2 ring-offset-slate-900' : ''}
                  ${'animate' in config && config.animate ? 'animate-pulse shadow-lg shadow-cyan-500/50' : ''}
                  transition-all duration-300 text-white
                  ${isClickable ? 'cursor-pointer' : ''}
                `}
                onClick={() => onStepClick?.(step.id, index)}
              >
                {renderIcon(step.status) || (
                  <span className={sizeConfig.text}>{index + 1}</span>
                )}
              </div>

              {/* Vertical connector */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    ${sizeConfig.connectorVert} my-1
                    ${step.status === 'completed' ? 'bg-emerald-500' :
                      step.status === 'running' ? 'bg-gradient-to-b from-cyan-500 to-slate-600' :
                      'bg-slate-700'}
                    transition-colors duration-300
                  `}
                />
              )}
            </div>

            {/* Label */}
            {showLabels && (
              <div className={`ml-3 ${index < steps.length - 1 ? 'pb-4' : ''}`}>
                <p className={`${sizeConfig.text} ${config.text} font-medium`}>
                  {step.name}
                </p>
                {showDuration && step.duration && (
                  <p className="text-xs text-slate-500">
                    Duration: {formatDuration(step.duration)}
                  </p>
                )}
                {step.agentName && (
                  <p className="text-xs text-slate-500">
                    Agent: {step.agentName}
                  </p>
                )}
                {isCurrent && step.status === 'running' && (
                  <p className="text-xs text-cyan-400 animate-pulse mt-1">
                    Processing...
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-3">
      {/* Progress bar header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">
          Step {stats.completed + (stats.running > 0 ? 1 : 0)} of {stats.total}
        </span>
        <div className="flex items-center gap-3">
          {showDuration && stats.totalDuration > 0 && (
            <span className="text-slate-500">
              Elapsed: {formatDuration(stats.totalDuration)}
            </span>
          )}
          {showDuration && stats.estimatedRemaining > 0 && (
            <span className="text-slate-500">
              ~{formatDuration(stats.estimatedRemaining)} remaining
            </span>
          )}
          <span className={`font-medium ${
            stats.failed > 0 ? 'text-red-400' :
            stats.completed === stats.total ? 'text-emerald-400' :
            'text-cyan-400'
          }`}>
            {stats.progress}%
          </span>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            stats.failed > 0 ? 'bg-red-500' :
            stats.completed === stats.total ? 'bg-emerald-500' :
            'bg-gradient-to-r from-cyan-500 to-purple-500'
          }`}
          style={{ width: `${stats.progress}%` }}
        />
      </div>

      {/* Steps visualization */}
      {orientation === 'horizontal' ? renderHorizontal() : renderVertical()}

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{stats.completed} completed</span>
        </div>
        {stats.running > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>{stats.running} running</span>
          </div>
        )}
        {stats.failed > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>{stats.failed} failed</span>
          </div>
        )}
        {stats.pending > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            <span>{stats.pending} pending</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default StepProgress

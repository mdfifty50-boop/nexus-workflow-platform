/**
 * AutopilotControls - Control buttons and progress bar for an Autopilot session.
 *
 * Renders context-aware action buttons based on the current session state,
 * a progress bar showing completedSteps/totalSteps, and an estimated time
 * remaining label.
 */

import { useMemo } from 'react'

type AutopilotSessionState =
  | 'idle'
  | 'planning'
  | 'executing'
  | 'credential_wait'
  | 'paused'
  | 'verifying'
  | 'complete'
  | 'error'
  | 'cancelled'

interface AutopilotControlsProps {
  state: AutopilotSessionState
  onPause: () => void
  onResume: () => void
  onCancel: () => void
  onRetry?: () => void
  completedSteps: number
  totalSteps: number
  estimatedRemaining?: number // seconds
}

function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) return `~${seconds}s remaining`
  const mins = Math.ceil(seconds / 60)
  return `~${mins} min remaining`
}

export function AutopilotControls({
  state,
  onPause,
  onResume,
  onCancel,
  onRetry,
  completedSteps,
  totalSteps,
  estimatedRemaining,
}: AutopilotControlsProps) {
  const progressPct = useMemo(
    () => (totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0),
    [completedSteps, totalSteps]
  )

  const isActive = state === 'executing' || state === 'planning' || state === 'verifying'
  const showProgress = totalSteps > 0

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      {showProgress && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-surface-400">
              {completedSteps} of {totalSteps} steps
            </span>
            <div className="flex items-center gap-3">
              {estimatedRemaining != null && estimatedRemaining > 0 && isActive && (
                <span className="text-surface-500">
                  {formatTimeRemaining(estimatedRemaining)}
                </span>
              )}
              <span
                className={`font-medium ${
                  state === 'error'
                    ? 'text-red-400'
                    : state === 'complete'
                    ? 'text-emerald-400'
                    : 'text-cyan-400'
                }`}
              >
                {progressPct}%
              </span>
            </div>
          </div>

          <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                state === 'error'
                  ? 'bg-red-500'
                  : state === 'complete'
                  ? 'bg-emerald-500'
                  : state === 'credential_wait'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                  : 'bg-gradient-to-r from-cyan-500 to-purple-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* State: Planning */}
        {state === 'planning' && (
          <>
            <div className="flex items-center gap-2 flex-1 text-sm text-cyan-400">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Planning actions...</span>
            </div>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-700 hover:bg-surface-600 text-surface-300 hover:text-white border border-surface-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Cancel
            </button>
          </>
        )}

        {/* State: Executing */}
        {state === 'executing' && (
          <>
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-surface-700 hover:bg-surface-600 text-surface-300 hover:text-white border border-surface-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              Pause
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Cancel
            </button>
          </>
        )}

        {/* State: Verifying */}
        {state === 'verifying' && (
          <>
            <div className="flex items-center gap-2 flex-1 text-sm text-purple-400">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Verifying setup...</span>
            </div>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-700 hover:bg-surface-600 text-surface-300 hover:text-white border border-surface-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Cancel
            </button>
          </>
        )}

        {/* State: Paused */}
        {state === 'paused' && (
          <>
            <button
              onClick={onResume}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,4 20,12 6,20" />
              </svg>
              Resume
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Cancel
            </button>
          </>
        )}

        {/* State: Credential Wait */}
        {state === 'credential_wait' && (
          <>
            <div className="flex items-center gap-2 flex-1 text-sm text-amber-400">
              <svg className="w-4 h-4 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>Waiting for you...</span>
            </div>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-700 hover:bg-surface-600 text-surface-300 hover:text-white border border-surface-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Cancel
            </button>
          </>
        )}

        {/* State: Complete */}
        {state === 'complete' && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/30 transition-colors w-full justify-center"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Done
          </button>
        )}

        {/* State: Error */}
        {state === 'error' && (
          <>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/30 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                </svg>
                Retry
              </button>
            )}
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Cancel
            </button>
          </>
        )}

        {/* State: Idle / Cancelled - no buttons */}
        {(state === 'idle' || state === 'cancelled') && (
          <span className="text-sm text-surface-500 italic">
            {state === 'cancelled' ? 'Session cancelled' : 'Ready to start'}
          </span>
        )}
      </div>
    </div>
  )
}

export default AutopilotControls

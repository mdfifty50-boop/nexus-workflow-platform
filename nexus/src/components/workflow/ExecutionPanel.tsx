/**
 * ExecutionPanel - Real-time workflow execution display
 *
 * Features:
 * - Live step-by-step execution status
 * - Progress indicators for each step
 * - Error handling display
 * - Token usage and cost tracking
 * - Retry and recovery status
 */

import { useMemo } from 'react'
import type { ExecutionStep } from '@/lib/workflow-engine'

interface ExecutionPanelProps {
  steps: ExecutionStep[]
  currentNodeId?: string
  totalTokens?: number
  totalCost?: number
  status: 'running' | 'completed' | 'failed'
  className?: string
}

export function ExecutionPanel({
  steps,
  currentNodeId,
  totalTokens = 0,
  totalCost = 0,
  status,
  className = '',
}: ExecutionPanelProps) {
  // Calculate progress percentage
  const progress = useMemo(() => {
    if (steps.length === 0) return 0
    const completedSteps = steps.filter(s => s.status === 'completed').length
    return Math.round((completedSteps / steps.length) * 100)
  }, [steps])

  // Get status counts
  const statusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      retrying: 0,
    }
    steps.forEach(step => {
      counts[step.status]++
    })
    return counts
  }, [steps])

  // Get status color
  const getStatusColor = (stepStatus: ExecutionStep['status']) => {
    switch (stepStatus) {
      case 'running':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
      case 'completed':
        return 'bg-green-500/10 border-green-500/30 text-green-400'
      case 'failed':
        return 'bg-red-500/10 border-red-500/30 text-red-400'
      case 'retrying':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400'
    }
  }

  // Get status icon
  const getStatusIcon = (stepStatus: ExecutionStep['status']) => {
    switch (stepStatus) {
      case 'running':
        return (
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        )
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'retrying':
        return (
          <svg className="w-5 h-5 text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      default:
        return (
          <div className="w-5 h-5 border-2 border-slate-500 rounded-full" />
        )
    }
  }

  // Format duration
  const formatDuration = (startTime?: Date, endTime?: Date) => {
    if (!startTime) return '-'
    const end = endTime || new Date()
    const duration = end.getTime() - new Date(startTime).getTime()
    if (duration < 1000) return `${duration}ms`
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
    return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`
  }

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-b border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Live Execution</h2>
          <div className={`px-3 py-1 text-sm font-medium rounded-full ${
            status === 'running' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
            status === 'completed' ? 'bg-green-500/20 text-green-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {status === 'running' ? 'In Progress' : status === 'completed' ? 'Complete' : 'Failed'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status Counts */}
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-muted-foreground">Completed: {statusCounts.completed}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-muted-foreground">Running: {statusCounts.running}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500" />
            <span className="text-muted-foreground">Pending: {statusCounts.pending}</span>
          </div>
          {statusCounts.failed > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-muted-foreground">Failed: {statusCounts.failed}</span>
            </div>
          )}
          {statusCounts.retrying > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-muted-foreground">Retrying: {statusCounts.retrying}</span>
            </div>
          )}
        </div>

        {/* Token and Cost */}
        {(totalTokens > 0 || totalCost > 0) && (
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/50">
            {totalTokens > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Tokens: </span>
                <span className="font-medium">{totalTokens.toLocaleString()}</span>
              </div>
            )}
            {totalCost > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Cost: </span>
                <span className="font-medium">${totalCost.toFixed(4)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Steps List */}
      <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
        {steps.map((step, index) => {
          const isActive = step.nodeId === currentNodeId
          const isCurrent = step.status === 'running'

          return (
            <div
              key={step.nodeId}
              className={`border rounded-lg p-4 transition-all ${getStatusColor(step.status)} ${
                isActive ? 'ring-2 ring-blue-400' : ''
              } ${isCurrent ? 'scale-105' : ''}`}
            >
              {/* Step Header */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">Node {step.nodeId}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-background/50 capitalize">
                        {step.status}
                      </span>
                    </div>
                    {step.retryCount && step.retryCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Retry attempt {step.retryCount}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusIcon(step.status)}
              </div>

              {/* Step Details */}
              <div className="ml-11 space-y-2">
                {/* Duration */}
                {(step.startTime || step.endTime) && (
                  <div className="text-sm text-muted-foreground">
                    Duration: {formatDuration(step.startTime, step.endTime)}
                  </div>
                )}

                {/* Token Usage */}
                {step.tokensUsed && step.tokensUsed > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Tokens: {step.tokensUsed.toLocaleString()}
                    {step.costUSD && step.costUSD > 0 && (
                      <span className="ml-2">• Cost: ${step.costUSD.toFixed(4)}</span>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {step.error && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded p-2 mt-2">
                    <div className="font-medium mb-1">Error:</div>
                    {step.error}
                  </div>
                )}

                {/* Recovery Actions */}
                {step.recoveryActions && step.recoveryActions.length > 0 && (
                  <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded p-2 mt-2">
                    <div className="font-medium mb-1">Recovery Actions:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {step.recoveryActions.map((action, i) => (
                        <li key={i} className="text-xs">{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Output Preview */}
                {step.status === 'completed' && step.output && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View Output
                    </summary>
                    <pre className="text-xs bg-background/50 p-2 rounded mt-2 overflow-x-auto max-h-32 overflow-y-auto">
                      {typeof step.output === 'string'
                        ? step.output
                        : JSON.stringify(step.output, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )
        })}

        {steps.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No execution steps available. Start workflow to see live progress.
          </div>
        )}
      </div>
    </div>
  )
}

export default ExecutionPanel

/**
 * WorkflowPreviewCard - NodeTooltip Component
 *
 * Tooltip popup for workflow nodes (hover on desktop, click on mobile).
 * All @NEXUS-FIX markers preserved.
 */

import { cn } from '@/lib/utils'
import type { WorkflowNode } from './wpc-types'
import { getIcon } from './wpc-constants'

// ============================================================================
// Node Tooltip Component (hover on desktop, click on mobile)
// ============================================================================

export function NodeTooltip({
  node,
  isOpen,
  onClose,
  position = 'top',
  useHoverClass = false
}: {
  node: WorkflowNode
  isOpen: boolean
  onClose: () => void
  position?: 'top' | 'bottom' | 'left' | 'right'
  useHoverClass?: boolean  // If true, visibility is controlled by parent's group-hover
}) {
  const typeLabels: Record<string, string> = {
    trigger: '⚡ Trigger',
    action: '⚙️ Action',
    output: '📤 Output',
    approval: '✋ Approval'
  }

  const statusLabels: Record<string, string> = {
    idle: 'Waiting',
    pending: 'Pending',
    connecting: 'Running...',
    success: 'Complete',
    error: 'Failed',
    awaiting_approval: 'Awaiting Approval'
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-slate-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-slate-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-slate-800'
  }

  // If using CSS hover, always render but control visibility via classes
  // If not using hover, use the isOpen prop to conditionally show
  const shouldShow = useHoverClass || isOpen

  if (!shouldShow && !useHoverClass) return null

  return (
    <>
      {/* Backdrop for mobile - click to close (only when actually open) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          onClick={onClose}
        />
      )}
      {/* @NEXUS-FIX-099: Tooltip popup - larger for readability and touch-friendly - DO NOT REMOVE */}
      <div
        className={cn(
          'absolute z-50 min-w-[240px] max-w-[320px] p-4 rounded-xl pointer-events-none',
          'bg-slate-800/95 backdrop-blur-sm border border-slate-600 shadow-2xl shadow-black/60',
          positionClasses[position],
          // CSS-based visibility when using hover class
          useHoverClass && !isOpen && 'opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-all duration-200',
          // State-based visibility
          !useHoverClass && isOpen && 'opacity-100 visible pointer-events-auto animate-in fade-in zoom-in-95 duration-200',
          // When clicked (isOpen), always show with pointer events
          isOpen && 'opacity-100 visible pointer-events-auto'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow */}
        <div className={cn('absolute w-0 h-0', arrowClasses[position])} />

        {/* Content */}
        <div className="space-y-2">
          {/* @NEXUS-FIX-099: Node name + description - full text with touch-friendly size - DO NOT REMOVE */}
          <div className="flex items-start gap-2">
            <span className="text-xl flex-shrink-0">{getIcon(node.integration)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white break-words leading-snug">{node.name}</p>
              {node.integration && (
                <p className="text-xs text-cyan-400 mt-0.5 capitalize">{node.integration}</p>
              )}
              {/* @NEXUS-FIX-099: Show node description if available */}
              {node.description && (
                <p className="text-xs text-slate-300 mt-2 leading-relaxed break-words">
                  {node.description}
                </p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex items-center gap-3 pt-1 border-t border-slate-700">
            <span className="text-xs text-slate-300">{typeLabels[node.type]}</span>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              node.status === 'success' && 'bg-emerald-500/20 text-emerald-400',
              node.status === 'connecting' && 'bg-amber-500/20 text-amber-400',
              node.status === 'error' && 'bg-red-500/20 text-red-400',
              node.status === 'idle' && 'bg-slate-600/50 text-slate-400',
              node.status === 'pending' && 'bg-blue-500/20 text-blue-400'
            )}>
              {statusLabels[node.status]}
            </span>
          </div>

          {/* Error message if any */}
          {node.error && (
            <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg mt-1">
              {node.error}
            </p>
          )}
        </div>

        {/* Close hint for mobile */}
        <p className="text-[10px] text-slate-500 text-center mt-2 sm:hidden">
          Tap outside to close
        </p>
      </div>
    </>
  )
}

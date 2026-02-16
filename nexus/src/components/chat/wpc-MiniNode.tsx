/**
 * WorkflowPreviewCard - MiniNode Components
 *
 * MiniNodeHorizontal (desktop) and MiniNodeVertical (mobile) workflow node components.
 * All @NEXUS-FIX markers preserved.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { WorkflowNode } from './wpc-types'
import { statusColors, getIcon } from './wpc-constants'
import { NodeTooltip } from './wpc-NodeTooltip'

// ============================================================================
// Mini Node Components (Desktop & Mobile)
// ============================================================================

export function MiniNodeHorizontal({
  node,
  isLast,
  onRemove,
  canEdit = false,
  onSelect,
  isSelected = false
}: {
  node: WorkflowNode;
  isLast: boolean;
  onRemove?: (nodeId: string) => void;
  canEdit?: boolean;
  onSelect?: (nodeId: string) => void;
  isSelected?: boolean;
}) {
  const colors = statusColors[node.status]
  // @NEXUS-FIX-121: Ref to prevent touch+click double-fire on mobile - DO NOT REMOVE
  const touchFiredRef = React.useRef(false)

  // @NEXUS-FIX-099: Handle touch events for mobile - DO NOT REMOVE
  const handleTouchEnd = React.useCallback(() => {
    // Mark that touch fired so onClick can skip
    touchFiredRef.current = true
    if (onSelect) onSelect(node.id)
    // Reset flag after click event would have fired (~400ms)
    setTimeout(() => { touchFiredRef.current = false }, 400)
  }, [onSelect, node.id])

  const handleClick = React.useCallback(() => {
    // @NEXUS-FIX-121: Skip if this click was triggered by a touch event
    if (touchFiredRef.current) return
    if (onSelect) onSelect(node.id)
  }, [onSelect, node.id])

  return (
    <div className="flex items-center flex-shrink-0 snap-start">
      {/* @NEXUS-FIX-099: Touch-friendly wrapper with min-height 44px for accessibility - DO NOT REMOVE */}
      {/* @NEXUS-FIX-103: Responsive sizing for identical mobile/desktop experience - DO NOT REMOVE */}
      <div className="relative group">
        <div
          className={cn(
            'relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border-2 transition-all duration-500 cursor-pointer',
            'min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px]', // Touch-friendly, slightly smaller on mobile
            colors.bg,
            colors.border,
            node.status === 'connecting' && 'animate-pulse shadow-lg shadow-amber-500/30',
            node.status === 'success' && 'shadow-lg shadow-emerald-500/20',
            isSelected && 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-900 shadow-lg shadow-cyan-500/20',
            'hover:scale-105 hover:shadow-lg active:scale-95' // Active state for touch feedback
          )}
          onClick={handleClick}
          onTouchEnd={handleTouchEnd}
          role="button"
          tabIndex={0}
          aria-label={`${node.name} - ${node.type} - ${node.status}${node.description ? `: ${node.description}` : ''}`}
          aria-expanded={isSelected}
        >
          <span className="text-base sm:text-lg">{getIcon(node.integration)}</span>
          <span className="text-[10px] sm:text-xs font-medium text-white truncate max-w-[80px] sm:max-w-[120px]">
            {node.name}
          </span>
          <div
            className={cn(
              'w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full transition-all duration-300 flex-shrink-0',
              colors.dot,
              node.status === 'connecting' && 'animate-ping'
            )}
          />
        </div>

        {/* Remove button - appears on hover when editing enabled */}
        {canEdit && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              const confirmMsg = node.type === 'trigger'
                ? 'Removing the trigger will disable this workflow. Continue?'
                : `Remove "${node.name}" from workflow?`
              if (window.confirm(confirmMsg)) {
                onRemove(node.id)
              }
            }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
            title="Remove this step"
          >
            ×
          </button>
        )}
      </div>

      {/* @NEXUS-FIX-103: Responsive connector arrows - DO NOT REMOVE */}
      {!isLast && (
        <div className="relative w-5 sm:w-8 h-0.5 mx-0.5 sm:mx-1 flex-shrink-0">
          <div className="absolute inset-0 bg-slate-700 rounded-full" />
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
              colors.line,
              node.status === 'connecting' && 'animate-pulse'
            )}
            style={{
              width: node.status === 'success' ? '100%' : node.status === 'connecting' ? '50%' : '0%',
            }}
          />
          <div
            className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] sm:border-t-[4px] border-t-transparent border-b-[3px] sm:border-b-[4px] border-b-transparent border-l-[4px] sm:border-l-[6px] transition-colors duration-300',
              node.status === 'success'
                ? 'border-l-emerald-500'
                : node.status === 'connecting'
                ? 'border-l-amber-500'
                : 'border-l-slate-600'
            )}
          />
        </div>
      )}
    </div>
  )
}

// MiniNodeVertical kept for future use but not currently rendered (FIX-100 unified to horizontal)
export function MiniNodeVertical({
  node,
  isLast,
  index,
  onRemove,
  canEdit = false
}: {
  node: WorkflowNode;
  isLast: boolean;
  index: number;
  onRemove?: (nodeId: string) => void;
  canEdit?: boolean;
}) {
  const colors = statusColors[node.status]
  const [showTooltip, setShowTooltip] = React.useState(false)

  // @NEXUS-FIX-099: Handle touch events for mobile - touch shows tooltip
  const handleTouchStart = React.useCallback(() => {
    setShowTooltip(true)
  }, [])

  const handleTouchEnd = React.useCallback(() => {
    // Keep tooltip visible for a moment after touch ends
    setTimeout(() => setShowTooltip(false), 2000)
  }, [])

  return (
    <div className="flex items-start relative group">
      {/* @NEXUS-FIX-099: Touch-friendly icon with min 44px touch target - DO NOT REMOVE */}
      <div className="flex flex-col items-center mr-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 cursor-pointer',
            'min-w-[44px] min-h-[44px]', // Touch-friendly minimum size
            colors.bg,
            colors.border,
            node.status === 'connecting' && 'animate-pulse shadow-lg shadow-amber-500/30',
            node.status === 'success' && 'shadow-md shadow-emerald-500/30',
            'active:scale-95 hover:scale-105'
          )}
          onClick={() => setShowTooltip(!showTooltip)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="button"
          tabIndex={0}
          aria-label={`${node.name} - ${node.type} - ${node.status}${node.description ? `: ${node.description}` : ''}`}
        >
          <span className="text-base">{getIcon(node.integration)}</span>
        </div>

        {!isLast && (
          <div className="relative w-0.5 h-8 my-1">
            <div className="absolute inset-0 bg-slate-700 rounded-full" />
            <div
              className={cn('absolute inset-x-0 top-0 rounded-full transition-all duration-500', colors.line)}
              style={{
                height: node.status === 'success' ? '100%' : node.status === 'connecting' ? '50%' : '0%',
              }}
            />
          </div>
        )}
      </div>

      {/* @NEXUS-FIX-099: Larger touch target for text area - DO NOT REMOVE */}
      <div
        className="flex-1 min-w-0 pt-1 cursor-pointer min-h-[44px] flex flex-col justify-center"
        onClick={() => setShowTooltip(!showTooltip)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">
            {index + 1}. {node.name}
          </span>
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-300',
              colors.dot,
              node.status === 'connecting' && 'animate-ping'
            )}
          />
        </div>
        {node.integration && (
          <span className="text-xs text-cyan-400/70 mt-0.5 block capitalize">{node.integration}</span>
        )}
        {/* @NEXUS-FIX-099: Show description snippet in vertical view */}
        {node.description && (
          <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{node.description}</span>
        )}
      </div>

      {/* Tooltip - positioned to the right on mobile, uses CSS hover + click */}
      <NodeTooltip
        node={node}
        isOpen={showTooltip}
        onClose={() => setShowTooltip(false)}
        position="right"
        useHoverClass={true}
      />

      {/* Remove button - appears on hover when editing enabled */}
      {canEdit && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            const confirmMsg = node.type === 'trigger'
              ? 'Removing the trigger will disable this workflow. Continue?'
              : `Remove "${node.name}" from workflow?`
            if (window.confirm(confirmMsg)) {
              onRemove(node.id)
            }
          }}
          className="absolute top-0 right-0 w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
          title="Remove this step"
        >
          ×
        </button>
      )}
    </div>
  )
}

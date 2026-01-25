/**
 * WorkflowPreviewInline Component
 *
 * Displays a live preview of the workflow being built, updating in real-time.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { WorkflowDraft, TriggerNode, ActionNode, ValidationError } from './workflow-creator-types'
import { VALIDATION_ERROR_TYPES } from './workflow-creator-types'

// ============================================================================
// Types
// ============================================================================

interface WorkflowPreviewInlineProps {
  draft: WorkflowDraft
  validationErrors?: ValidationError[]
  onEditTrigger?: () => void
  onEditAction?: (actionId: string) => void
  onRemoveAction?: (actionId: string) => void
  onReorderActions?: (fromIndex: number, toIndex: number) => void
  compact?: boolean
  className?: string
}

// ============================================================================
// Node Component
// ============================================================================

interface WorkflowNodeProps {
  node: TriggerNode | ActionNode
  type: 'trigger' | 'action'
  index?: number
  isFirst?: boolean
  isLast?: boolean
  hasError?: boolean
  onEdit?: () => void
  onRemove?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  compact?: boolean
}

function WorkflowNode({
  node,
  type,
  index,
  isFirst,
  isLast,
  hasError,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
  compact,
}: WorkflowNodeProps) {
  const [showActions, setShowActions] = React.useState(false)

  const isTrigger = type === 'trigger'

  return (
    <div
      className={cn(
        'relative group',
        compact ? 'py-1' : 'py-2'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Connector Line (except for first node) */}
      {!isFirst && (
        <div className="absolute left-6 -top-2 w-0.5 h-4 bg-gradient-to-b from-primary/50 to-primary" />
      )}

      {/* Node Content */}
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl border transition-all',
          hasError
            ? 'border-destructive bg-destructive/5'
            : isTrigger
              ? 'border-cyan-500/30 bg-cyan-500/5'
              : 'border-purple-500/30 bg-purple-500/5',
          'hover:shadow-md',
          compact && 'p-2'
        )}
      >
        {/* Node Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0',
            isTrigger ? 'bg-cyan-500/20' : 'bg-purple-500/20',
            compact && 'w-8 h-8 text-lg'
          )}
        >
          {node.icon}
        </div>

        {/* Node Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded',
                isTrigger
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-purple-500/20 text-purple-400'
              )}
            >
              {isTrigger ? 'Trigger' : `Step ${(index ?? 0) + 1}`}
            </span>
            {hasError && (
              <span className="text-[10px] font-medium text-destructive">
                Incomplete
              </span>
            )}
          </div>
          <p className={cn('font-medium truncate', compact ? 'text-sm' : 'text-base')}>
            {node.name}
          </p>
          {!compact && node.description && (
            <p className="text-xs text-muted-foreground truncate">
              {node.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (onEdit || onRemove) && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isTrigger && onMoveUp && !isFirst && (
              <button
                type="button"
                onClick={onMoveUp}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
            {!isTrigger && onMoveDown && !isLast && (
              <button
                type="button"
                onClick={onMoveDown}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Remove"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Connector Arrow (except for last node) */}
      {!isLast && (
        <div className="absolute left-6 -bottom-2 w-0.5 h-4 bg-gradient-to-b from-primary to-primary/50" />
      )}
    </div>
  )
}

// ============================================================================
// Add Node Placeholder
// ============================================================================

interface AddNodePlaceholderProps {
  onClick?: () => void
  type: 'trigger' | 'action'
  compact?: boolean
}

function AddNodePlaceholder({ onClick, type, compact }: AddNodePlaceholderProps) {
  const isTrigger = type === 'trigger'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all',
        'hover:border-primary/50 hover:bg-primary/5',
        isTrigger ? 'border-cyan-500/30' : 'border-purple-500/30',
        compact && 'p-2'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          isTrigger ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400',
          compact && 'w-8 h-8'
        )}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <span className="text-sm text-muted-foreground">
        {isTrigger ? 'Add a trigger' : 'Add an action'}
      </span>
    </button>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function WorkflowPreviewInline({
  draft,
  validationErrors = [],
  onEditTrigger,
  onEditAction,
  onRemoveAction,
  onReorderActions,
  compact = false,
  className,
}: WorkflowPreviewInlineProps) {
  const hasTriggerError = validationErrors.some(
    (e) => e.type === VALIDATION_ERROR_TYPES.MISSING_TRIGGER
  )
  const _hasActionsError = validationErrors.some(
    (e) => e.type === VALIDATION_ERROR_TYPES.MISSING_ACTIONS
  )
  void _hasActionsError

  const totalNodes = (draft.trigger ? 1 : 0) + draft.actions.length

  return (
    <div className={cn('space-y-1', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-sm">
            {draft.name || 'Untitled Workflow'}
          </h4>
          {draft.description && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {draft.description}
            </p>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {totalNodes} {totalNodes === 1 ? 'step' : 'steps'}
        </span>
      </div>

      {/* Workflow Flow */}
      <div className="relative pl-3">
        {/* Trigger */}
        {draft.trigger ? (
          <WorkflowNode
            node={draft.trigger}
            type="trigger"
            isFirst
            isLast={draft.actions.length === 0}
            hasError={hasTriggerError}
            onEdit={onEditTrigger}
            compact={compact}
          />
        ) : (
          <AddNodePlaceholder
            type="trigger"
            onClick={onEditTrigger}
            compact={compact}
          />
        )}

        {/* Actions */}
        {draft.actions.map((action, index) => (
          <WorkflowNode
            key={action.id}
            node={action}
            type="action"
            index={index}
            isFirst={!draft.trigger && index === 0}
            isLast={index === draft.actions.length - 1}
            hasError={validationErrors.some((e) => e.nodeId === action.id)}
            onEdit={() => onEditAction?.(action.id)}
            onRemove={() => onRemoveAction?.(action.id)}
            onMoveUp={
              index > 0
                ? () => onReorderActions?.(index, index - 1)
                : undefined
            }
            onMoveDown={
              index < draft.actions.length - 1
                ? () => onReorderActions?.(index, index + 1)
                : undefined
            }
            compact={compact}
          />
        ))}

        {/* Add Action Placeholder */}
        {draft.trigger && (
          <div className="relative py-2">
            {draft.actions.length > 0 && (
              <div className="absolute left-3 -top-1 w-0.5 h-3 bg-primary/30" />
            )}
            <AddNodePlaceholder
              type="action"
              onClick={() => onEditAction?.('new')}
              compact={compact}
            />
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-xs font-medium text-destructive mb-1">
            Issues to fix:
          </p>
          <ul className="text-xs text-destructive/80 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <span className="mt-0.5">-</span>
                <span>{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Stats */}
      {totalNodes > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
          <div className="flex items-center gap-4">
            {draft.trigger && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                1 trigger
              </span>
            )}
            {draft.actions.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                {draft.actions.length} {draft.actions.length === 1 ? 'action' : 'actions'}
              </span>
            )}
          </div>
          {validationErrors.length === 0 && totalNodes >= 2 && (
            <span className="text-emerald-400 font-medium">Ready to save</span>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Compact Visual Flow (Horizontal)
// ============================================================================

interface WorkflowFlowVisualProps {
  draft: WorkflowDraft
  className?: string
}

export function WorkflowFlowVisual({ draft, className }: WorkflowFlowVisualProps) {
  const hasContent = draft.trigger || draft.actions.length > 0

  if (!hasContent) {
    return (
      <div className={cn('flex items-center justify-center py-4 text-muted-foreground text-sm', className)}>
        Your workflow will appear here
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto py-2 px-1', className)}>
      {/* Trigger */}
      {draft.trigger && (
        <>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex-shrink-0">
            <span className="text-lg">{draft.trigger.icon}</span>
            <span className="text-xs font-medium">{draft.trigger.name}</span>
          </div>

          {draft.actions.length > 0 && (
            <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </>
      )}

      {/* Actions */}
      {draft.actions.map((action, index) => (
        <React.Fragment key={action.id}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 flex-shrink-0">
            <span className="text-lg">{action.icon}</span>
            <span className="text-xs font-medium">{action.name}</span>
          </div>

          {index < draft.actions.length - 1 && (
            <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

import React from 'react'
import { cn } from '@/lib/utils'
import type { WorkflowDiagramMiniProps, NodePreview, NodeType } from './embed-types'
import { NODE_TYPE } from './embed-types'

// Node type icons using SVG
const NODE_ICONS: Record<NodeType | string, React.ReactNode> = {
  [NODE_TYPE.TRIGGER]: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  [NODE_TYPE.ACTION]: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  [NODE_TYPE.CONDITION]: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  [NODE_TYPE.TRANSFORM]: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  [NODE_TYPE.INTEGRATION]: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  [NODE_TYPE.AGENT]: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
}

// Node status colors
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  running: 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 animate-pulse',
  completed: 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600',
  failed: 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-600',
}

// Node type colors
const TYPE_COLORS: Record<NodeType | string, string> = {
  [NODE_TYPE.TRIGGER]: 'text-amber-600 dark:text-amber-400',
  [NODE_TYPE.ACTION]: 'text-blue-600 dark:text-blue-400',
  [NODE_TYPE.CONDITION]: 'text-purple-600 dark:text-purple-400',
  [NODE_TYPE.TRANSFORM]: 'text-cyan-600 dark:text-cyan-400',
  [NODE_TYPE.INTEGRATION]: 'text-green-600 dark:text-green-400',
  [NODE_TYPE.AGENT]: 'text-pink-600 dark:text-pink-400',
}

/**
 * MiniNode - Individual node in the mini diagram
 */
interface MiniNodeProps {
  node: NodePreview
  onClick?: (node: NodePreview) => void
}

function MiniNode({ node, onClick }: MiniNodeProps) {
  const icon = NODE_ICONS[node.type] || NODE_ICONS[NODE_TYPE.ACTION]
  const statusClass = node.status ? STATUS_COLORS[node.status] : STATUS_COLORS.pending
  const typeColor = TYPE_COLORS[node.type] || TYPE_COLORS[NODE_TYPE.ACTION]

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(node)
      }}
      title={node.name}
      className={cn(
        'relative w-8 h-8 rounded-lg border flex items-center justify-center',
        'transition-all duration-150 hover:scale-110 hover:shadow-sm',
        statusClass,
        typeColor
      )}
      data-embed-action
    >
      {node.icon ? (
        <span className="text-sm">{node.icon}</span>
      ) : (
        icon
      )}
    </button>
  )
}

/**
 * ConnectionLine - SVG line connecting nodes
 */
function ConnectionLine() {
  return (
    <div className="flex items-center justify-center w-4 h-8">
      <div className="w-full h-0.5 bg-border rounded-full" />
    </div>
  )
}

/**
 * WorkflowDiagramMini - Simplified mini workflow visualization
 * Shows 3-5 key nodes with connections, plus indicator for more
 */
export function WorkflowDiagramMini({
  nodes,
  maxVisible = 5,
  className,
  onNodeClick,
  onExpandClick,
}: WorkflowDiagramMiniProps) {
  const visibleNodes = nodes.slice(0, maxVisible)
  const remainingCount = nodes.length - maxVisible

  if (nodes.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-4', className)}>
        <p className="text-xs text-muted-foreground">No nodes in workflow</p>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-0.5 py-3 px-2 overflow-x-auto', className)}>
      {visibleNodes.map((node, index) => (
        <React.Fragment key={node.id}>
          <MiniNode node={node} onClick={onNodeClick} />
          {index < visibleNodes.length - 1 && <ConnectionLine />}
        </React.Fragment>
      ))}

      {remainingCount > 0 && (
        <>
          <ConnectionLine />
          <button
            onClick={(e) => {
              e.stopPropagation()
              onExpandClick?.()
            }}
            title={`+${remainingCount} more nodes`}
            className={cn(
              'w-8 h-8 rounded-lg border border-dashed border-primary/50',
              'flex items-center justify-center text-xs font-medium text-primary',
              'bg-primary/5 hover:bg-primary/10 transition-colors'
            )}
            data-embed-action
          >
            +{remainingCount}
          </button>
        </>
      )}
    </div>
  )
}

/**
 * WorkflowDiagramMiniVertical - Vertical layout variant
 */
export function WorkflowDiagramMiniVertical({
  nodes,
  maxVisible = 4,
  className,
  onNodeClick,
  onExpandClick,
}: WorkflowDiagramMiniProps) {
  const visibleNodes = nodes.slice(0, maxVisible)
  const remainingCount = nodes.length - maxVisible

  if (nodes.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-4', className)}>
        <p className="text-xs text-muted-foreground">No nodes in workflow</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-1 py-2', className)}>
      {visibleNodes.map((node, index) => (
        <React.Fragment key={node.id}>
          <MiniNode node={node} onClick={onNodeClick} />
          {index < visibleNodes.length - 1 && (
            <div className="w-0.5 h-3 bg-border rounded-full" />
          )}
        </React.Fragment>
      ))}

      {remainingCount > 0 && (
        <>
          <div className="w-0.5 h-3 bg-border rounded-full" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              onExpandClick?.()
            }}
            title={`+${remainingCount} more nodes`}
            className={cn(
              'w-8 h-8 rounded-lg border border-dashed border-primary/50',
              'flex items-center justify-center text-xs font-medium text-primary',
              'bg-primary/5 hover:bg-primary/10 transition-colors'
            )}
            data-embed-action
          >
            +{remainingCount}
          </button>
        </>
      )}
    </div>
  )
}

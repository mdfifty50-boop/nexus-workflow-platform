import { memo, forwardRef, useCallback, useMemo, type CSSProperties } from 'react'
import { FixedSizeList, VariableSizeList, areEqual, type ListChildComponentProps } from 'react-window'

/**
 * VirtualList Component
 *
 * High-performance virtualized list using react-window.
 * Only renders items currently visible in the viewport.
 *
 * Benefits:
 * - O(1) render performance regardless of list size
 * - Smooth scrolling with thousands of items
 * - Memory efficient - only visible items in DOM
 * - Supports fixed and variable height items
 */

// Types
interface BaseVirtualListProps<T> {
  /** Array of items to render */
  items: T[]
  /** Height of the list container */
  height: number
  /** Width of the list container (default: '100%') */
  width?: number | string
  /** Render function for each item */
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode
  /** Key extractor function */
  keyExtractor?: (item: T, index: number) => string | number
  /** Additional class name for the container */
  className?: string
  /** Overscan count - items to render outside visible area (default: 5) */
  overscanCount?: number
  /** Called when scroll reaches near end (for infinite scroll) */
  onEndReached?: () => void
  /** Threshold for onEndReached trigger (default: 0.8) */
  endReachedThreshold?: number
  /** Empty state component */
  emptyComponent?: React.ReactNode
  /** Loading state */
  isLoading?: boolean
  /** Loading component */
  loadingComponent?: React.ReactNode
}

interface FixedSizeVirtualListProps<T> extends BaseVirtualListProps<T> {
  /** Fixed height for all items */
  itemHeight: number
  /** Type discriminator for fixed size list */
  variableSize?: false
}

interface VariableSizeVirtualListProps<T> extends BaseVirtualListProps<T> {
  /** Function returning height for each item */
  getItemHeight: (index: number) => number
  /** Type discriminator for variable size list */
  variableSize: true
  /** Estimated average item height for scroll bar accuracy */
  estimatedItemSize?: number
}

type VirtualListProps<T> = FixedSizeVirtualListProps<T> | VariableSizeVirtualListProps<T>

/**
 * Memoized row renderer to prevent unnecessary re-renders
 */
const MemoizedRow = memo(function MemoizedRow<T>({
  data,
  index,
  style,
}: ListChildComponentProps<{
  items: T[]
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode
}>) {
  const { items, renderItem } = data
  const item = items[index]
  return <>{renderItem(item, index, style)}</>
}, areEqual)

/**
 * Fixed-size VirtualList component
 */
function FixedSizeVirtualList<T>({
  items,
  height,
  width = '100%',
  itemHeight,
  renderItem,
  keyExtractor,
  className = '',
  overscanCount = 5,
  onEndReached,
  endReachedThreshold = 0.8,
  emptyComponent,
  isLoading,
  loadingComponent,
}: FixedSizeVirtualListProps<T>) {
  const itemKey = useCallback(
    (index: number, data: { items: T[] }) => {
      if (keyExtractor) {
        return keyExtractor(data.items[index], index)
      }
      return index
    },
    [keyExtractor]
  )

  const handleScroll = useCallback(
    ({ scrollOffset }: { scrollOffset: number }) => {
      if (!onEndReached) return

      const totalHeight = items.length * itemHeight
      const scrollPercentage = (scrollOffset + height) / totalHeight

      if (scrollPercentage >= endReachedThreshold) {
        onEndReached()
      }
    },
    [items.length, itemHeight, height, endReachedThreshold, onEndReached]
  )

  const itemData = useMemo(
    () => ({ items, renderItem }),
    [items, renderItem]
  )

  // Handle empty state
  if (!isLoading && items.length === 0) {
    return emptyComponent ? <>{emptyComponent}</> : null
  }

  // Handle loading state
  if (isLoading && items.length === 0) {
    return loadingComponent ? <>{loadingComponent}</> : null
  }

  return (
    <FixedSizeList
      height={height}
      width={width}
      itemCount={items.length}
      itemSize={itemHeight}
      itemKey={itemKey}
      itemData={itemData}
      overscanCount={overscanCount}
      onScroll={handleScroll}
      className={className}
    >
      {MemoizedRow as React.ComponentType<ListChildComponentProps<{ items: T[]; renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode }>>}
    </FixedSizeList>
  )
}

/**
 * Variable-size VirtualList component
 */
function VariableSizeVirtualList<T>({
  items,
  height,
  width = '100%',
  getItemHeight,
  estimatedItemSize = 50,
  renderItem,
  keyExtractor,
  className = '',
  overscanCount = 5,
  onEndReached,
  endReachedThreshold = 0.8,
  emptyComponent,
  isLoading,
  loadingComponent,
}: VariableSizeVirtualListProps<T>) {
  const itemKey = useCallback(
    (index: number, data: { items: T[] }) => {
      if (keyExtractor) {
        return keyExtractor(data.items[index], index)
      }
      return index
    },
    [keyExtractor]
  )

  const handleScroll = useCallback(
    ({ scrollOffset }: { scrollOffset: number }) => {
      if (!onEndReached) return

      // Approximate total height
      const totalHeight = items.length * estimatedItemSize
      const scrollPercentage = (scrollOffset + height) / totalHeight

      if (scrollPercentage >= endReachedThreshold) {
        onEndReached()
      }
    },
    [items.length, estimatedItemSize, height, endReachedThreshold, onEndReached]
  )

  const itemData = useMemo(
    () => ({ items, renderItem }),
    [items, renderItem]
  )

  // Handle empty state
  if (!isLoading && items.length === 0) {
    return emptyComponent ? <>{emptyComponent}</> : null
  }

  // Handle loading state
  if (isLoading && items.length === 0) {
    return loadingComponent ? <>{loadingComponent}</> : null
  }

  return (
    <VariableSizeList
      height={height}
      width={width}
      itemCount={items.length}
      itemSize={getItemHeight}
      estimatedItemSize={estimatedItemSize}
      itemKey={itemKey}
      itemData={itemData}
      overscanCount={overscanCount}
      onScroll={handleScroll}
      className={className}
    >
      {MemoizedRow as React.ComponentType<ListChildComponentProps<{ items: T[]; renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode }>>}
    </VariableSizeList>
  )
}

/**
 * Main VirtualList component - supports both fixed and variable size items
 */
function VirtualList<T>(props: VirtualListProps<T>) {
  if ('variableSize' in props && props.variableSize) {
    return <VariableSizeVirtualList {...props} />
  }
  return <FixedSizeVirtualList {...props as FixedSizeVirtualListProps<T>} />
}

export default memo(VirtualList) as typeof VirtualList

// Export specialized components for common use cases

/**
 * VirtualWorkflowList - Optimized for workflow cards
 */
export interface WorkflowListItem {
  id: string
  name: string
  status: string
  [key: string]: unknown
}

export const VirtualWorkflowList = memo(function VirtualWorkflowList({
  workflows,
  height = 600,
  itemHeight = 120,
  onItemClick,
  ...rest
}: {
  workflows: WorkflowListItem[]
  height?: number
  itemHeight?: number
  onItemClick?: (workflow: WorkflowListItem) => void
} & Omit<FixedSizeVirtualListProps<WorkflowListItem>, 'items' | 'itemHeight' | 'height' | 'renderItem'>) {
  const renderWorkflow = useCallback(
    (workflow: WorkflowListItem, _index: number, style: CSSProperties) => (
      <div
        style={style}
        className="px-2 py-1"
        onClick={() => onItemClick?.(workflow)}
      >
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 h-full hover:border-cyan-500/30 transition-colors cursor-pointer">
          <h4 className="font-medium text-white truncate">{workflow.name}</h4>
          <span className="text-xs text-slate-400 capitalize">{workflow.status}</span>
        </div>
      </div>
    ),
    [onItemClick]
  )

  return (
    <VirtualList
      items={workflows}
      height={height}
      itemHeight={itemHeight}
      renderItem={renderWorkflow}
      keyExtractor={(item) => item.id}
      {...rest}
    />
  )
})

/**
 * VirtualTemplateList - Optimized for template cards
 */
export interface TemplateListItem {
  id: string
  name: string
  description: string
  category: string
  [key: string]: unknown
}

export const VirtualTemplateList = memo(function VirtualTemplateList({
  templates,
  height = 600,
  itemHeight = 160,
  onItemClick,
  ...rest
}: {
  templates: TemplateListItem[]
  height?: number
  itemHeight?: number
  onItemClick?: (template: TemplateListItem) => void
} & Omit<FixedSizeVirtualListProps<TemplateListItem>, 'items' | 'itemHeight' | 'height' | 'renderItem'>) {
  const renderTemplate = useCallback(
    (template: TemplateListItem, _index: number, style: CSSProperties) => (
      <div
        style={style}
        className="px-2 py-1"
        onClick={() => onItemClick?.(template)}
      >
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 h-full hover:border-cyan-500/30 transition-colors cursor-pointer">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-white truncate">{template.name}</h4>
            <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
              {template.category}
            </span>
          </div>
          <p className="text-sm text-slate-400 line-clamp-2">{template.description}</p>
        </div>
      </div>
    ),
    [onItemClick]
  )

  return (
    <VirtualList
      items={templates}
      height={height}
      itemHeight={itemHeight}
      renderItem={renderTemplate}
      keyExtractor={(item) => item.id}
      {...rest}
    />
  )
})

// Ref-forwarding wrapper for advanced use cases
export const VirtualListWithRef = forwardRef(function VirtualListWithRef<T>(
  props: VirtualListProps<T>,
  ref: React.Ref<FixedSizeList | VariableSizeList>
) {
  // Note: ref forwarding would require modifications to inner components
  // This is a placeholder for advanced use cases
  void ref
  return <VirtualList {...props} />
})

// Export types
export type { VirtualListProps, FixedSizeVirtualListProps, VariableSizeVirtualListProps }

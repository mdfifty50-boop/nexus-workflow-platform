/**
 * RECENT ITEMS COMPONENT
 *
 * Shows recently viewed and edited workflows for quick access.
 *
 * Features:
 * - Tracks view/edit history
 * - Persists to localStorage
 * - Quick navigation
 * - Status indicators
 * - Time-ago formatting
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// =============================================================================
// Types
// =============================================================================

export type RecentItemType = 'workflow' | 'template' | 'project'
export type RecentAction = 'viewed' | 'edited' | 'executed'

export interface RecentItem {
  id: string
  type: RecentItemType
  name: string
  description?: string
  status?: 'active' | 'draft' | 'paused' | 'completed' | 'failed'
  action: RecentAction
  timestamp: number
  route: string
  metadata?: Record<string, unknown>
}

interface RecentItemsProps {
  maxItems?: number
  showHeader?: boolean
  showClearButton?: boolean
  filterType?: RecentItemType
  className?: string
  compact?: boolean
  onItemClick?: (item: RecentItem) => void
}

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'nexus_recent_items'
const MAX_STORED_ITEMS = 50
const DEFAULT_DISPLAY_ITEMS = 10

// Status colors
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500',
  draft: 'bg-slate-500',
  paused: 'bg-yellow-500',
  completed: 'bg-blue-500',
  failed: 'bg-red-500'
}

// Action icons
const ACTION_ICONS: Record<RecentAction, React.ReactNode> = {
  viewed: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  edited: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  executed: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// =============================================================================
// Utility Functions
// =============================================================================

function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 4) return `${weeks}w ago`

  return new Date(timestamp).toLocaleDateString()
}

function getTypeIcon(type: RecentItemType): React.ReactNode {
  switch (type) {
    case 'workflow':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    case 'template':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
        </svg>
      )
    case 'project':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      )
  }
}

// =============================================================================
// Hook for Managing Recent Items
// =============================================================================

export function useRecentItems() {
  const [items, setItems] = useState<RecentItem[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setItems(JSON.parse(stored))
      }
    } catch {
      setItems([])
    }
  }, [])

  // Save to localStorage when items change
  const saveItems = useCallback((newItems: RecentItem[]) => {
    const trimmed = newItems.slice(0, MAX_STORED_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    setItems(trimmed)
  }, [])

  // Add or update an item
  const trackItem = useCallback((item: Omit<RecentItem, 'timestamp'>) => {
    setItems(prev => {
      // Remove existing entry for same item
      const filtered = prev.filter(i => !(i.id === item.id && i.type === item.type))

      // Add new entry at the beginning
      const newItems: RecentItem[] = [
        { ...item, timestamp: Date.now() },
        ...filtered
      ].slice(0, MAX_STORED_ITEMS)

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems))
      return newItems
    })
  }, [])

  // Clear all items
  const clearItems = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setItems([])
  }, [])

  // Remove specific item
  const removeItem = useCallback((id: string, type: RecentItemType) => {
    setItems(prev => {
      const filtered = prev.filter(i => !(i.id === id && i.type === type))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
      return filtered
    })
  }, [])

  return {
    items,
    trackItem,
    clearItems,
    removeItem,
    saveItems
  }
}

// =============================================================================
// Component
// =============================================================================

export function RecentItems({
  maxItems = DEFAULT_DISPLAY_ITEMS,
  showHeader = true,
  showClearButton = true,
  filterType,
  className = '',
  compact = false,
  onItemClick
}: RecentItemsProps) {
  const navigate = useNavigate()
  const { items, clearItems, removeItem } = useRecentItems()

  // Filter and limit items
  const displayItems = useMemo(() => {
    let filtered = items
    if (filterType) {
      filtered = items.filter(item => item.type === filterType)
    }
    return filtered.slice(0, maxItems)
  }, [items, filterType, maxItems])

  // Handle item click
  const handleItemClick = useCallback((item: RecentItem) => {
    if (onItemClick) {
      onItemClick(item)
    } else {
      navigate(item.route)
    }
  }, [navigate, onItemClick])

  // Handle remove item
  const handleRemove = useCallback((e: React.MouseEvent, item: RecentItem) => {
    e.stopPropagation()
    removeItem(item.id, item.type)
  }, [removeItem])

  if (displayItems.length === 0) {
    return (
      <div className={`bg-slate-900 rounded-xl border border-slate-700 p-6 ${className}`}>
        {showHeader && (
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Items
          </h3>
        )}
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-400">No recent items</p>
          <p className="text-sm text-slate-500 mt-1">Items you view or edit will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-slate-900 rounded-xl border border-slate-700 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Items
            <span className="text-xs text-slate-500 font-normal">({displayItems.length})</span>
          </h3>
          {showClearButton && items.length > 0 && (
            <button
              onClick={clearItems}
              className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Items List */}
      <div className={compact ? 'p-2' : 'p-2'}>
        {displayItems.map((item, index) => (
          <button
            key={`${item.type}-${item.id}-${index}`}
            onClick={() => handleItemClick(item)}
            className={`w-full group flex items-center gap-3 rounded-lg transition-colors text-left ${
              compact
                ? 'px-2 py-2 hover:bg-slate-800'
                : 'px-3 py-3 hover:bg-slate-800'
            }`}
          >
            {/* Icon */}
            <div className={`shrink-0 rounded-lg flex items-center justify-center ${
              compact ? 'w-8 h-8' : 'w-10 h-10'
            } bg-slate-800 text-slate-400 group-hover:bg-slate-700 transition-colors`}>
              {getTypeIcon(item.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-medium text-slate-200 truncate ${compact ? 'text-sm' : ''}`}>
                  {item.name}
                </span>
                {item.status && (
                  <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[item.status] || 'bg-slate-500'}`} />
                )}
              </div>
              {!compact && item.description && (
                <p className="text-sm text-slate-500 truncate">{item.description}</p>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-slate-500">
                  {ACTION_ICONS[item.action]}
                </span>
                <span className="text-xs text-slate-500">
                  {formatTimeAgo(item.timestamp)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => handleRemove(e, item)}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                title="Remove from recent"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Show More */}
      {items.length > maxItems && (
        <div className="px-4 py-2 border-t border-slate-800">
          <button
            onClick={() => navigate('/workflows')}
            className="w-full text-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View all {items.length} items
          </button>
        </div>
      )}
    </div>
  )
}

// Compact version for sidebar or quick access
export function RecentItemsCompact(props: Omit<RecentItemsProps, 'compact'>) {
  return <RecentItems {...props} compact showHeader={false} maxItems={5} />
}

export type { RecentItemsProps }

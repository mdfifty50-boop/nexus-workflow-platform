/**
 * Bulk Actions Bar Component
 *
 * Provides a floating action bar for bulk operations on selected items.
 * Supports delete, archive, export, and other batch operations.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { downloadWorkflowBatch, type WorkflowNodeExport, type WorkflowEdgeExport } from '@/lib/workflow-io'

export interface SelectableItem {
  id: string
  name: string
  description?: string
  status?: string
  nodes?: WorkflowNodeExport[]
  edges?: WorkflowEdgeExport[]
  [key: string]: unknown
}

export interface BulkActionsBarProps {
  selectedItems: SelectableItem[]
  onClearSelection: () => void
  onDelete?: (ids: string[]) => Promise<void> | void
  onArchive?: (ids: string[]) => Promise<void> | void
  onDuplicate?: (ids: string[]) => Promise<void> | void
  onExport?: (items: SelectableItem[]) => void
  onStatusChange?: (ids: string[], status: string) => Promise<void> | void
  availableStatuses?: string[]
  className?: string
}

export function BulkActionsBar({
  selectedItems,
  onClearSelection,
  onDelete,
  onArchive,
  onDuplicate,
  onExport,
  onStatusChange,
  availableStatuses = ['active', 'paused', 'archived'],
  className = ''
}: BulkActionsBarProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const selectedCount = selectedItems.length
  const hasSelection = selectedCount > 0

  // Handle escape to clear selection
  useEffect(() => {
    const handleEscape = () => {
      if (hasSelection) {
        onClearSelection()
      }
    }

    window.addEventListener('nexus:escape', handleEscape)
    return () => window.removeEventListener('nexus:escape', handleEscape)
  }, [hasSelection, onClearSelection])

  // Handle delete action
  const handleDelete = useCallback(async () => {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(selectedItems.map(item => item.id))
      onClearSelection()
    } catch (error) {
      console.error('Failed to delete items:', error)
    } finally {
      setIsDeleting(false)
      setShowConfirmDelete(false)
    }
  }, [selectedItems, onDelete, onClearSelection])

  // Handle archive action
  const handleArchive = useCallback(async () => {
    if (!onArchive) return

    setIsArchiving(true)
    try {
      await onArchive(selectedItems.map(item => item.id))
      onClearSelection()
    } catch (error) {
      console.error('Failed to archive items:', error)
    } finally {
      setIsArchiving(false)
    }
  }, [selectedItems, onArchive, onClearSelection])

  // Handle duplicate action
  const handleDuplicate = useCallback(async () => {
    if (!onDuplicate) return

    setIsDuplicating(true)
    try {
      await onDuplicate(selectedItems.map(item => item.id))
      onClearSelection()
    } catch (error) {
      console.error('Failed to duplicate items:', error)
    } finally {
      setIsDuplicating(false)
    }
  }, [selectedItems, onDuplicate, onClearSelection])

  // Handle export action
  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(selectedItems)
    } else {
      // Default export behavior
      const workflowsToExport = selectedItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        status: item.status,
        nodes: item.nodes || [],
        edges: item.edges || []
      }))

      const filename = selectedCount === 1
        ? `${selectedItems[0].name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-workflow.json`
        : `workflows-export-${selectedCount}.json`

      downloadWorkflowBatch(workflowsToExport, filename)
    }
  }, [selectedItems, selectedCount, onExport])

  // Handle status change
  const handleStatusChange = useCallback(async (status: string) => {
    if (!onStatusChange) return

    try {
      await onStatusChange(selectedItems.map(item => item.id), status)
      onClearSelection()
    } catch (error) {
      console.error('Failed to change status:', error)
    } finally {
      setShowStatusMenu(false)
    }
  }, [selectedItems, onStatusChange, onClearSelection])

  if (!hasSelection) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${className}`}
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50">
          {/* Selection count */}
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <span className="text-cyan-400 font-bold text-sm">{selectedCount}</span>
            </div>
            <span className="text-slate-300 text-sm font-medium">
              {selectedCount === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Export */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export
            </Button>

            {/* Duplicate */}
            {onDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDuplicate}
                disabled={isDuplicating}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                {isDuplicating ? (
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                Duplicate
              </Button>
            )}

            {/* Status change dropdown */}
            {onStatusChange && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Status
                  <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>

                {showStatusMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                    {availableStatuses.map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white capitalize"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Archive */}
            {onArchive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleArchive}
                disabled={isArchiving}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                {isArchiving ? (
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                )}
                Archive
              </Button>
            )}

            {/* Delete */}
            {onDelete && (
              <div className="relative">
                {showConfirmDelete ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <span className="text-red-400 text-sm">Delete {selectedCount}?</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-red-400 hover:text-white hover:bg-red-500 h-7 px-2"
                    >
                      {isDeleting ? 'Deleting...' : 'Confirm'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirmDelete(false)}
                      className="text-slate-400 hover:text-white h-7 px-2"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmDelete(true)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-slate-700" />

          {/* Clear selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-slate-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Keyboard hint */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-slate-500 whitespace-nowrap">
          Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">Esc</kbd> to deselect
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Hook for managing multi-select state
 */
export function useMultiSelect<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)))
  }, [items])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id)
  }, [selectedIds])

  const selectedItems = items.filter(item => selectedIds.has(item.id))

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    hasSelection: selectedIds.size > 0,
    allSelected: selectedIds.size === items.length && items.length > 0,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected
  }
}

/**
 * Checkbox component for selectable items
 */
export interface SelectCheckboxProps {
  checked: boolean
  onChange: () => void
  className?: string
}

export function SelectCheckbox({ checked, onChange, className = '' }: SelectCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onChange()
      }}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
        checked
          ? 'bg-cyan-500 border-cyan-500'
          : 'bg-transparent border-slate-600 hover:border-slate-500'
      } ${className}`}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}

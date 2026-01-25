import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/contexts/ToastContext'

interface KeyboardSettingsProps {
  className?: string
}

interface Shortcut {
  id: string
  name: string
  description: string
  category: string
  keys: string[]
  default: string[]
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  // Navigation
  { id: 'nav_dashboard', name: 'Go to Dashboard', description: 'Navigate to dashboard', category: 'Navigation', keys: ['Ctrl', 'D'], default: ['Ctrl', 'D'] },
  { id: 'nav_workflows', name: 'Go to Workflows', description: 'Navigate to workflows', category: 'Navigation', keys: ['Ctrl', 'W'], default: ['Ctrl', 'W'] },
  { id: 'nav_templates', name: 'Go to Templates', description: 'Navigate to templates', category: 'Navigation', keys: ['Ctrl', 'T'], default: ['Ctrl', 'T'] },
  { id: 'nav_settings', name: 'Go to Settings', description: 'Navigate to settings', category: 'Navigation', keys: ['Ctrl', ','], default: ['Ctrl', ','] },

  // Workflow Actions
  { id: 'wf_new', name: 'New Workflow', description: 'Create a new workflow', category: 'Workflows', keys: ['Ctrl', 'N'], default: ['Ctrl', 'N'] },
  { id: 'wf_save', name: 'Save Workflow', description: 'Save current workflow', category: 'Workflows', keys: ['Ctrl', 'S'], default: ['Ctrl', 'S'] },
  { id: 'wf_run', name: 'Run Workflow', description: 'Execute current workflow', category: 'Workflows', keys: ['Ctrl', 'Enter'], default: ['Ctrl', 'Enter'] },
  { id: 'wf_duplicate', name: 'Duplicate Workflow', description: 'Duplicate selected workflow', category: 'Workflows', keys: ['Ctrl', 'Shift', 'D'], default: ['Ctrl', 'Shift', 'D'] },
  { id: 'wf_delete', name: 'Delete Workflow', description: 'Delete selected workflow', category: 'Workflows', keys: ['Delete'], default: ['Delete'] },

  // Editor
  { id: 'edit_undo', name: 'Undo', description: 'Undo last action', category: 'Editor', keys: ['Ctrl', 'Z'], default: ['Ctrl', 'Z'] },
  { id: 'edit_redo', name: 'Redo', description: 'Redo last undone action', category: 'Editor', keys: ['Ctrl', 'Shift', 'Z'], default: ['Ctrl', 'Shift', 'Z'] },
  { id: 'edit_copy', name: 'Copy Node', description: 'Copy selected node', category: 'Editor', keys: ['Ctrl', 'C'], default: ['Ctrl', 'C'] },
  { id: 'edit_paste', name: 'Paste Node', description: 'Paste copied node', category: 'Editor', keys: ['Ctrl', 'V'], default: ['Ctrl', 'V'] },
  { id: 'edit_select_all', name: 'Select All', description: 'Select all nodes', category: 'Editor', keys: ['Ctrl', 'A'], default: ['Ctrl', 'A'] },

  // View
  { id: 'view_zoom_in', name: 'Zoom In', description: 'Zoom in canvas', category: 'View', keys: ['Ctrl', '+'], default: ['Ctrl', '+'] },
  { id: 'view_zoom_out', name: 'Zoom Out', description: 'Zoom out canvas', category: 'View', keys: ['Ctrl', '-'], default: ['Ctrl', '-'] },
  { id: 'view_zoom_fit', name: 'Fit to Screen', description: 'Fit workflow to screen', category: 'View', keys: ['Ctrl', '0'], default: ['Ctrl', '0'] },
  { id: 'view_toggle_panel', name: 'Toggle Side Panel', description: 'Show/hide side panel', category: 'View', keys: ['Ctrl', 'B'], default: ['Ctrl', 'B'] },

  // General
  { id: 'gen_search', name: 'Search', description: 'Open search', category: 'General', keys: ['Ctrl', 'K'], default: ['Ctrl', 'K'] },
  { id: 'gen_help', name: 'Help', description: 'Open help', category: 'General', keys: ['F1'], default: ['F1'] },
  { id: 'gen_escape', name: 'Close/Cancel', description: 'Close modal or cancel', category: 'General', keys: ['Escape'], default: ['Escape'] },
]

export function KeyboardSettings({ className }: KeyboardSettingsProps) {
  const toast = useToast()

  // Load saved shortcuts
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(() => {
    const saved = localStorage.getItem('nexus_shortcuts')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return DEFAULT_SHORTCUTS
      }
    }
    return DEFAULT_SHORTCUTS
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [recordingKeys, setRecordingKeys] = useState<string[]>([])
  const [conflicts, setConflicts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get unique categories
  const categories = Array.from(new Set(shortcuts.map(s => s.category)))

  // Filter shortcuts
  const filteredShortcuts = shortcuts.filter(shortcut => {
    const matchesSearch = searchQuery === '' ||
      shortcut.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === null || shortcut.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Group by category
  const groupedShortcuts = categories.reduce((acc, category) => {
    acc[category] = filteredShortcuts.filter(s => s.category === category)
    return acc
  }, {} as Record<string, Shortcut[]>)

  // Check for conflicts
  const checkConflicts = useCallback((keys: string[], currentId: string): string[] => {
    const keyString = keys.join('+')
    return shortcuts
      .filter(s => s.id !== currentId && s.keys.join('+') === keyString)
      .map(s => s.id)
  }, [shortcuts])

  // Handle key recording
  useEffect(() => {
    if (!editingId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()

      const key = e.key
      const keys: string[] = []

      if (e.ctrlKey || e.metaKey) keys.push('Ctrl')
      if (e.shiftKey) keys.push('Shift')
      if (e.altKey) keys.push('Alt')

      // Add the actual key if it's not a modifier
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
        // Format special keys
        const formattedKey = key === ' ' ? 'Space' :
          key === 'ArrowUp' ? 'Up' :
          key === 'ArrowDown' ? 'Down' :
          key === 'ArrowLeft' ? 'Left' :
          key === 'ArrowRight' ? 'Right' :
          key.length === 1 ? key.toUpperCase() : key
        keys.push(formattedKey)
      }

      setRecordingKeys(keys)

      // Check for conflicts
      if (keys.length > 0) {
        const conflictIds = checkConflicts(keys, editingId)
        setConflicts(conflictIds)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingId, checkConflicts])

  const startEditing = (id: string) => {
    setEditingId(id)
    setRecordingKeys([])
    setConflicts([])
  }

  const saveShortcut = () => {
    if (!editingId || recordingKeys.length === 0) return

    if (conflicts.length > 0) {
      toast.error('Conflict detected', 'This shortcut is already in use')
      return
    }

    setShortcuts(prev => {
      const updated = prev.map(s =>
        s.id === editingId ? { ...s, keys: recordingKeys } : s
      )
      localStorage.setItem('nexus_shortcuts', JSON.stringify(updated))
      return updated
    })

    setEditingId(null)
    setRecordingKeys([])
    toast.success('Shortcut saved', 'Your keyboard shortcut has been updated')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setRecordingKeys([])
    setConflicts([])
  }

  const resetShortcut = (id: string) => {
    const defaultShortcut = DEFAULT_SHORTCUTS.find(s => s.id === id)
    if (!defaultShortcut) return

    setShortcuts(prev => {
      const updated = prev.map(s =>
        s.id === id ? { ...s, keys: [...defaultShortcut.default] } : s
      )
      localStorage.setItem('nexus_shortcuts', JSON.stringify(updated))
      return updated
    })

    toast.success('Shortcut reset', 'Keyboard shortcut has been reset to default')
  }

  const resetAllShortcuts = () => {
    if (confirm('Are you sure you want to reset all shortcuts to their defaults?')) {
      setShortcuts(DEFAULT_SHORTCUTS.map(s => ({ ...s, keys: [...s.default] })))
      localStorage.setItem('nexus_shortcuts', JSON.stringify(DEFAULT_SHORTCUTS))
      toast.success('All shortcuts reset', 'All keyboard shortcuts have been reset to defaults')
    }
  }

  const formatKeys = (keys: string[]) => {
    return keys.map(key => (
      <kbd
        key={key}
        className="px-2 py-1 bg-muted rounded text-xs font-mono border border-border"
      >
        {key}
      </kbd>
    ))
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header with Search and Reset */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
            <Button variant="outline" size="sm" onClick={resetAllShortcuts}>
              Reset All to Defaults
            </Button>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search-shortcuts" className="sr-only">Search shortcuts</Label>
              <Input
                id="search-shortcuts"
                placeholder="Search shortcuts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="px-3 py-2 bg-input border border-input rounded-md text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Shortcut Recording Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Record Shortcut</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Press the key combination you want to use for "{shortcuts.find(s => s.id === editingId)?.name}"
              </p>

              <div className={`
                p-6 rounded-lg border-2 border-dashed text-center mb-4
                ${conflicts.length > 0 ? 'border-destructive bg-destructive/10' : 'border-primary bg-primary/10'}
              `}>
                {recordingKeys.length > 0 ? (
                  <div className="flex items-center justify-center gap-2">
                    {formatKeys(recordingKeys)}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Press keys...</p>
                )}
              </div>

              {conflicts.length > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg mb-4">
                  <p className="text-sm text-destructive font-medium">Conflict detected!</p>
                  <p className="text-xs text-muted-foreground">
                    This shortcut is already used by: {shortcuts.find(s => s.id === conflicts[0])?.name}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={saveShortcut}
                  disabled={recordingKeys.length === 0 || conflicts.length > 0}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Shortcuts List by Category */}
        {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
          categoryShortcuts.length > 0 && (
            <div key={category} className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">{category}</h3>
              <div className="space-y-0">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={shortcut.id}
                    className={`
                      flex items-center justify-between py-3
                      ${index !== categoryShortcuts.length - 1 ? 'border-b border-border' : ''}
                    `}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{shortcut.name}</p>
                      <p className="text-sm text-muted-foreground">{shortcut.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {formatKeys(shortcut.keys)}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(shortcut.id)}
                          className="h-8 px-2"
                        >
                          Edit
                        </Button>
                        {JSON.stringify(shortcut.keys) !== JSON.stringify(shortcut.default) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resetShortcut(shortcut.id)}
                            className="h-8 px-2 text-muted-foreground"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

        {/* No Results */}
        {filteredShortcuts.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground">No shortcuts found matching your criteria</p>
          </div>
        )}

        {/* Tips */}
        <div className="bg-muted/30 border border-border rounded-xl p-6">
          <h4 className="font-medium mb-2">Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Click "Edit" to record a new keyboard shortcut</li>
            <li>Conflicts are detected automatically and shown in red</li>
            <li>Use Ctrl (Cmd on Mac), Shift, and Alt as modifiers</li>
            <li>Reset individual shortcuts or all at once to defaults</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

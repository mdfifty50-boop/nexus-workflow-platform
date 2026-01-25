import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export interface ShortcutConfig {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  action: () => void
  description: string
  category: string
  enabled?: boolean
}

// Global save handler registry
type SaveHandler = () => void | Promise<void>
const saveHandlers = new Map<string, SaveHandler>()

export function registerSaveHandler(id: string, handler: SaveHandler) {
  saveHandlers.set(id, handler)
  return () => saveHandlers.delete(id)
}

// Global new item handler registry
type NewItemHandler = () => void
const newItemHandlers = new Map<string, NewItemHandler>()

export function registerNewItemHandler(id: string, handler: NewItemHandler) {
  newItemHandlers.set(id, handler)
  return () => newItemHandlers.delete(id)
}

// Undo/Redo handlers
type UndoRedoHandler = () => void
let undoHandler: UndoRedoHandler | null = null
let redoHandler: UndoRedoHandler | null = null

export function registerUndoRedoHandlers(undo: UndoRedoHandler, redo: UndoRedoHandler) {
  undoHandler = undo
  redoHandler = redo
  return () => {
    undoHandler = null
    redoHandler = null
  }
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  // location available via useLocation() if needed for shortcut context
  const lastSaveRef = useRef<number>(0)

  const shortcuts: ShortcutConfig[] = [
    // Navigation shortcuts
    { key: 'd', ctrl: true, action: () => navigate('/dashboard'), description: 'Go to Dashboard', category: 'Navigation' },
    { key: 'p', ctrl: true, action: () => navigate('/projects'), description: 'Go to Projects', category: 'Navigation' },
    { key: 't', ctrl: true, action: () => navigate('/templates'), description: 'Go to Templates', category: 'Navigation' },
    { key: 'i', ctrl: true, action: () => navigate('/integrations'), description: 'Go to Integrations', category: 'Navigation' },
    { key: 'w', ctrl: true, action: () => navigate('/workflow-demo'), description: 'Go to Workflow Demo', category: 'Navigation' },

    // Core Actions
    { key: 'n', ctrl: true, action: () => {
      // Trigger new item handler or navigate to create page
      const handlers = Array.from(newItemHandlers.values())
      if (handlers.length > 0) {
        handlers[handlers.length - 1]() // Call most recently registered handler
      } else {
        // Dispatch event for components to handle
        const event = new CustomEvent('nexus:newItem')
        window.dispatchEvent(event)
      }
    }, description: 'New Item', category: 'Actions' },

    { key: 's', ctrl: true, action: () => {
      // Debounce save to prevent rapid-fire saves
      const now = Date.now()
      if (now - lastSaveRef.current < 500) return
      lastSaveRef.current = now

      // Call all registered save handlers
      const handlers = Array.from(saveHandlers.values())
      if (handlers.length > 0) {
        handlers.forEach(handler => handler())
      } else {
        // Dispatch event for components without registered handlers
        const event = new CustomEvent('nexus:save')
        window.dispatchEvent(event)
      }
    }, description: 'Save', category: 'Actions' },

    { key: 'k', ctrl: true, action: () => {
      // Toggle command palette
      const event = new CustomEvent('toggleCommandPalette')
      window.dispatchEvent(event)
    }, description: 'Open Command Palette', category: 'Actions' },

    { key: '/', action: () => {
      // Focus search if available
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement
      searchInput?.focus()
    }, description: 'Focus Search', category: 'Actions' },

    { key: 'Escape', action: () => {
      // Close any open modal or deselect
      const closeBtn = document.querySelector('[role="dialog"] button[aria-label="Close"]') as HTMLButtonElement
      if (closeBtn) {
        closeBtn.click()
      } else {
        // Dispatch escape event for components to handle
        const event = new CustomEvent('nexus:escape')
        window.dispatchEvent(event)
      }
    }, description: 'Close Modal / Deselect', category: 'Actions' },

    // Undo/Redo
    { key: 'z', ctrl: true, action: () => {
      if (undoHandler) {
        undoHandler()
      } else {
        const event = new CustomEvent('nexus:undo')
        window.dispatchEvent(event)
      }
    }, description: 'Undo', category: 'Edit' },

    { key: 'y', ctrl: true, action: () => {
      if (redoHandler) {
        redoHandler()
      } else {
        const event = new CustomEvent('nexus:redo')
        window.dispatchEvent(event)
      }
    }, description: 'Redo', category: 'Edit' },

    { key: 'z', ctrl: true, shift: true, action: () => {
      if (redoHandler) {
        redoHandler()
      } else {
        const event = new CustomEvent('nexus:redo')
        window.dispatchEvent(event)
      }
    }, description: 'Redo (Alt)', category: 'Edit' },

    // Help
    { key: '?', shift: true, action: () => {
      const event = new CustomEvent('toggleShortcutsHelp')
      window.dispatchEvent(event)
    }, description: 'Show Keyboard Shortcuts', category: 'Help' },
  ]

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Only allow Escape in inputs
      if (event.key !== 'Escape') return
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey)
      const altMatch = shortcut.alt ? event.altKey : !event.altKey
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        event.preventDefault()
        shortcut.action()
        break
      }
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { shortcuts }
}

// Hook for showing shortcuts help
export function useShortcutsHelp() {
  const { shortcuts } = useKeyboardShortcuts()

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = []
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, ShortcutConfig[]>)

  const formatShortcut = (shortcut: ShortcutConfig) => {
    const parts: string[] = []
    if (shortcut.ctrl) parts.push('Ctrl')
    if (shortcut.alt) parts.push('Alt')
    if (shortcut.shift) parts.push('Shift')
    parts.push(shortcut.key.toUpperCase())
    return parts.join(' + ')
  }

  return { groupedShortcuts, formatShortcut }
}

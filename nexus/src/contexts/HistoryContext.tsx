/**
 * History Context for Undo/Redo System
 *
 * Provides a generic undo/redo system for tracking and reverting actions.
 * Supports keyboard shortcuts (Ctrl+Z, Ctrl+Y) and integrates with the
 * global keyboard shortcuts system.
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode
} from 'react'
import { registerUndoRedoHandlers } from '@/hooks/useKeyboardShortcuts'

// Maximum history size to prevent memory issues
const MAX_HISTORY_SIZE = 50

/**
 * Action types that can be undone/redone
 */
export type HistoryActionType =
  | 'CREATE_NODE'
  | 'DELETE_NODE'
  | 'UPDATE_NODE'
  | 'MOVE_NODE'
  | 'CREATE_EDGE'
  | 'DELETE_EDGE'
  | 'UPDATE_EDGE'
  | 'BATCH_UPDATE'
  | 'WORKFLOW_UPDATE'
  | 'SETTINGS_UPDATE'
  | 'CUSTOM'

/**
 * A single history entry representing an action that can be undone
 */
export interface HistoryEntry<T = unknown> {
  id: string
  type: HistoryActionType
  description: string
  timestamp: number
  data: {
    before: T
    after: T
  }
  metadata?: Record<string, unknown>
}

/**
 * History state structure
 */
interface HistoryState<T = unknown> {
  past: HistoryEntry<T>[]
  future: HistoryEntry<T>[]
  isUndoing: boolean
  isRedoing: boolean
}

/**
 * History reducer actions
 */
type HistoryAction<T = unknown> =
  | { type: 'PUSH'; entry: HistoryEntry<T> }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' }
  | { type: 'SET_UNDOING'; value: boolean }
  | { type: 'SET_REDOING'; value: boolean }

/**
 * History reducer
 */
function historyReducer<T>(
  state: HistoryState<T>,
  action: HistoryAction<T>
): HistoryState<T> {
  switch (action.type) {
    case 'PUSH': {
      // Add new entry to past, clear future
      const newPast = [...state.past, action.entry]
      // Trim if exceeding max size
      while (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift()
      }
      return {
        ...state,
        past: newPast,
        future: [] // Clear redo stack on new action
      }
    }

    case 'UNDO': {
      if (state.past.length === 0) return state

      const newPast = [...state.past]
      const entry = newPast.pop()!

      return {
        ...state,
        past: newPast,
        future: [entry, ...state.future]
      }
    }

    case 'REDO': {
      if (state.future.length === 0) return state

      const newFuture = [...state.future]
      const entry = newFuture.shift()!

      return {
        ...state,
        past: [...state.past, entry],
        future: newFuture
      }
    }

    case 'CLEAR':
      return {
        past: [],
        future: [],
        isUndoing: false,
        isRedoing: false
      }

    case 'SET_UNDOING':
      return { ...state, isUndoing: action.value }

    case 'SET_REDOING':
      return { ...state, isRedoing: action.value }

    default:
      return state
  }
}

/**
 * Context value type
 */
interface HistoryContextValue<T = unknown> {
  // State
  canUndo: boolean
  canRedo: boolean
  undoDescription: string | null
  redoDescription: string | null
  historySize: number
  futureSize: number
  isUndoing: boolean
  isRedoing: boolean

  // Actions
  pushHistory: (entry: Omit<HistoryEntry<T>, 'id' | 'timestamp'>) => void
  undo: () => HistoryEntry<T> | null
  redo: () => HistoryEntry<T> | null
  clearHistory: () => void

  // History access
  getHistory: () => HistoryEntry<T>[]
  getFuture: () => HistoryEntry<T>[]
}

/**
 * Create the context
 */
const HistoryContext = createContext<HistoryContextValue | null>(null)

/**
 * Props for HistoryProvider
 */
interface HistoryProviderProps {
  children: ReactNode
  onUndo?: (entry: HistoryEntry) => void
  onRedo?: (entry: HistoryEntry) => void
}

/**
 * Generate unique ID for history entries
 */
function generateHistoryId(): string {
  return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * History Provider Component
 */
export function HistoryProvider<T = unknown>({
  children,
  onUndo,
  onRedo
}: HistoryProviderProps) {
  const [state, dispatch] = useReducer(historyReducer<T>, {
    past: [],
    future: [],
    isUndoing: false,
    isRedoing: false
  })

  /**
   * Push a new action to history
   */
  const pushHistory = useCallback((entry: Omit<HistoryEntry<T>, 'id' | 'timestamp'>) => {
    dispatch({
      type: 'PUSH',
      entry: {
        ...entry,
        id: generateHistoryId(),
        timestamp: Date.now()
      } as HistoryEntry<T>
    })
  }, [])

  /**
   * Undo the last action
   */
  const undo = useCallback((): HistoryEntry<T> | null => {
    if (state.past.length === 0) return null

    const entry = state.past[state.past.length - 1]

    dispatch({ type: 'SET_UNDOING', value: true })
    dispatch({ type: 'UNDO' })

    if (onUndo) {
      onUndo(entry as HistoryEntry)
    }

    // Reset undoing flag after a tick
    setTimeout(() => {
      dispatch({ type: 'SET_UNDOING', value: false })
    }, 0)

    return entry
  }, [state.past, onUndo])

  /**
   * Redo the last undone action
   */
  const redo = useCallback((): HistoryEntry<T> | null => {
    if (state.future.length === 0) return null

    const entry = state.future[0]

    dispatch({ type: 'SET_REDOING', value: true })
    dispatch({ type: 'REDO' })

    if (onRedo) {
      onRedo(entry as HistoryEntry)
    }

    // Reset redoing flag after a tick
    setTimeout(() => {
      dispatch({ type: 'SET_REDOING', value: false })
    }, 0)

    return entry
  }, [state.future, onRedo])

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  /**
   * Get past history entries
   */
  const getHistory = useCallback((): HistoryEntry<T>[] => {
    return [...state.past]
  }, [state.past])

  /**
   * Get future entries (redo stack)
   */
  const getFuture = useCallback((): HistoryEntry<T>[] => {
    return [...state.future]
  }, [state.future])

  // Register with global keyboard shortcuts
  useEffect(() => {
    const unregister = registerUndoRedoHandlers(
      () => { undo() },
      () => { redo() }
    )
    return unregister
  }, [undo, redo])

  // Context value
  const value: HistoryContextValue<T> = {
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    undoDescription: state.past.length > 0
      ? state.past[state.past.length - 1].description
      : null,
    redoDescription: state.future.length > 0
      ? state.future[0].description
      : null,
    historySize: state.past.length,
    futureSize: state.future.length,
    isUndoing: state.isUndoing,
    isRedoing: state.isRedoing,
    pushHistory,
    undo,
    redo,
    clearHistory,
    getHistory,
    getFuture
  }

  return (
    <HistoryContext.Provider value={value as HistoryContextValue}>
      {children}
    </HistoryContext.Provider>
  )
}

/**
 * Hook to use history context
 */
export function useHistory<T = unknown>(): HistoryContextValue<T> {
  const context = useContext(HistoryContext)

  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider')
  }

  return context as HistoryContextValue<T>
}

/**
 * Hook for tracking a specific value with history
 */
export function useHistoryTrackedValue<T>(
  initialValue: T,
  description: string
): [T, (newValue: T) => void, { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }] {
  const [value, setValue] = useReducer(
    (_: T, action: T) => action,
    initialValue
  )

  const { pushHistory, undo, redo, canUndo, canRedo, isUndoing, isRedoing } = useHistory<T>()

  const setTrackedValue = useCallback((newValue: T) => {
    // Don't track if this is an undo/redo operation
    if (!isUndoing && !isRedoing) {
      pushHistory({
        type: 'CUSTOM',
        description,
        data: {
          before: value,
          after: newValue
        }
      })
    }
    setValue(newValue)
  }, [value, description, pushHistory, isUndoing, isRedoing])

  return [
    value,
    setTrackedValue,
    {
      undo: () => {
        const entry = undo()
        if (entry) {
          setValue(entry.data.before as T)
        }
      },
      redo: () => {
        const entry = redo()
        if (entry) {
          setValue(entry.data.after as T)
        }
      },
      canUndo,
      canRedo
    }
  ]
}

/**
 * Create typed history entry helpers
 */
export function createHistoryEntry<T>(
  type: HistoryActionType,
  description: string,
  before: T,
  after: T,
  metadata?: Record<string, unknown>
): Omit<HistoryEntry<T>, 'id' | 'timestamp'> {
  return {
    type,
    description,
    data: { before, after },
    metadata
  }
}

// Export types
export type { HistoryContextValue, HistoryState }

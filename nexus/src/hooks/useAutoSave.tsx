/**
 * useAutoSave Hook
 * Auto-saves form data to localStorage with debouncing
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface AutoSaveOptions<T> {
  /** Unique key for localStorage */
  key: string
  /** Data to auto-save */
  data: T
  /** Debounce delay in milliseconds (default: 30000 = 30 seconds) */
  delay?: number
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean
  /** Callback when save occurs */
  onSave?: (data: T) => void
  /** Callback when draft is restored */
  onRestore?: (data: T) => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Version for cache invalidation */
  version?: number
}

interface AutoSaveState {
  /** Whether there are unsaved changes */
  isDirty: boolean
  /** Last saved timestamp */
  lastSaved: Date | null
  /** Whether currently saving */
  isSaving: boolean
  /** Whether a draft was restored */
  wasRestored: boolean
}

interface AutoSaveReturn<T> extends AutoSaveState {
  /** Force immediate save */
  saveNow: () => void
  /** Clear saved draft */
  clearDraft: () => void
  /** Get saved draft data */
  getDraft: () => T | null
  /** Check if draft exists */
  hasDraft: () => boolean
  /** Time until next auto-save */
  timeUntilSave: number | null
}

interface StoredDraft<T> {
  data: T
  timestamp: number
  version: number
}

const STORAGE_PREFIX = 'nexus_draft_'

export function useAutoSave<T>({
  key,
  data,
  delay = 30000,
  enabled = true,
  onSave,
  onRestore,
  onError,
  version = 1,
}: AutoSaveOptions<T>): AutoSaveReturn<T> {
  const [state, setState] = useState<AutoSaveState>({
    isDirty: false,
    lastSaved: null,
    isSaving: false,
    wasRestored: false,
  })

  const [timeUntilSave, setTimeUntilSave] = useState<number | null>(null)

  const dataRef = useRef(data)
  const initialDataRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const saveStartTimeRef = useRef<number | null>(null)

  const storageKey = `${STORAGE_PREFIX}${key}`

  // Update data ref
  useEffect(() => {
    dataRef.current = data
  }, [data])

  // Check if data has changed from initial
  const checkDirty = useCallback(() => {
    if (initialDataRef.current === null) {
      initialDataRef.current = JSON.stringify(data)
      return false
    }
    return JSON.stringify(data) !== initialDataRef.current
  }, [data])

  // Save to localStorage
  const saveToStorage = useCallback((dataToSave: T) => {
    try {
      const draft: StoredDraft<T> = {
        data: dataToSave,
        timestamp: Date.now(),
        version,
      }
      localStorage.setItem(storageKey, JSON.stringify(draft))

      setState(prev => ({
        ...prev,
        lastSaved: new Date(),
        isSaving: false,
        isDirty: false,
      }))

      onSave?.(dataToSave)
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to save draft'))
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }, [storageKey, version, onSave, onError])

  // Load from localStorage
  const loadFromStorage = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return null

      const draft: StoredDraft<T> = JSON.parse(stored)

      // Check version compatibility
      if (draft.version !== version) {
        localStorage.removeItem(storageKey)
        return null
      }

      return draft.data
    } catch {
      return null
    }
  }, [storageKey, version])

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      setState(prev => ({
        ...prev,
        isDirty: false,
        lastSaved: null,
        wasRestored: false,
      }))
      initialDataRef.current = JSON.stringify(dataRef.current)
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to clear draft'))
    }
  }, [storageKey, onError])

  // Force immediate save
  const saveNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }

    setState(prev => ({ ...prev, isSaving: true }))
    saveToStorage(dataRef.current)
    setTimeUntilSave(null)
  }, [saveToStorage])

  // Get draft
  const getDraft = useCallback((): T | null => {
    return loadFromStorage()
  }, [loadFromStorage])

  // Check if draft exists
  const hasDraft = useCallback((): boolean => {
    return localStorage.getItem(storageKey) !== null
  }, [storageKey])

  // Restore draft on mount
  useEffect(() => {
    if (!enabled) return

    const draft = loadFromStorage()
    if (draft) {
      onRestore?.(draft)
      setState(prev => ({ ...prev, wasRestored: true }))
    }

    // Set initial data reference
    initialDataRef.current = JSON.stringify(data)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save effect with countdown
  useEffect(() => {
    if (!enabled) return

    const isDirty = checkDirty()
    setState(prev => ({ ...prev, isDirty }))

    if (!isDirty) {
      setTimeUntilSave(null)
      return
    }

    // Clear existing timers
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
    }

    // Start countdown
    saveStartTimeRef.current = Date.now() + delay
    setTimeUntilSave(delay)

    countdownRef.current = setInterval(() => {
      if (saveStartTimeRef.current) {
        const remaining = saveStartTimeRef.current - Date.now()
        if (remaining <= 0) {
          setTimeUntilSave(null)
          if (countdownRef.current) {
            clearInterval(countdownRef.current)
          }
        } else {
          setTimeUntilSave(remaining)
        }
      }
    }, 1000)

    // Set save timer
    timerRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isSaving: true }))
      saveToStorage(dataRef.current)
      setTimeUntilSave(null)
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }, delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [data, delay, enabled, checkDirty, saveToStorage])

  // Save on blur
  useEffect(() => {
    if (!enabled) return

    const handleBlur = () => {
      if (state.isDirty) {
        saveNow()
      }
    }

    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [enabled, state.isDirty, saveNow])

  // Save before unload
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isDirty) {
        // Save synchronously
        try {
          const draft: StoredDraft<T> = {
            data: dataRef.current,
            timestamp: Date.now(),
            version,
          }
          localStorage.setItem(storageKey, JSON.stringify(draft))
        } catch {
          // Silent fail on unload
        }

        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, state.isDirty, storageKey, version])

  return {
    ...state,
    saveNow,
    clearDraft,
    getDraft,
    hasDraft,
    timeUntilSave,
  }
}

// Draft saved indicator component
export function DraftSavedIndicator({
  isDirty,
  lastSaved,
  isSaving,
  timeUntilSave,
  onSaveNow,
  className = '',
}: {
  isDirty: boolean
  lastSaved: Date | null
  isSaving: boolean
  timeUntilSave: number | null
  onSaveNow?: () => void
  className?: string
}): React.ReactNode {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatCountdown = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    return `${seconds}s`
  }

  if (isSaving) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
        <span>Saving draft...</span>
      </div>
    )
  }

  if (!isDirty && lastSaved) {
    return (
      <div className={`flex items-center gap-2 text-sm text-emerald-500 ${className}`}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Draft saved at {formatTime(lastSaved)}</span>
      </div>
    )
  }

  if (isDirty) {
    return (
      <div className={`flex items-center gap-2 text-sm text-amber-500 ${className}`}>
        <div className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
        <span>
          Unsaved changes
          {timeUntilSave && ` (saving in ${formatCountdown(timeUntilSave)})`}
        </span>
        {onSaveNow && (
          <button
            type="button"
            onClick={onSaveNow}
            className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            aria-label="Save draft now"
          >
            Save now
          </button>
        )}
      </div>
    )
  }

  return null
}

// Draft restoration dialog
export function DraftRestorationDialog({
  isOpen,
  onRestore,
  onDiscard,
  lastSavedAt,
}: {
  isOpen: boolean
  onRestore: () => void
  onDiscard: () => void
  lastSavedAt?: Date
}): React.ReactNode {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="draft-dialog-title"
    >
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
          <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h2 id="draft-dialog-title" className="mb-2 text-lg font-semibold">Unsaved Draft Found</h2>
        <p className="mb-4 text-muted-foreground">
          {lastSavedAt
            ? `You have an unsaved draft from ${lastSavedAt.toLocaleString()}. Would you like to restore it?`
            : 'You have an unsaved draft. Would you like to restore it?'
          }
        </p>

        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Discard Draft
          </button>
          <button
            onClick={onRestore}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Restore Draft
          </button>
        </div>
      </div>
    </div>
  )
}

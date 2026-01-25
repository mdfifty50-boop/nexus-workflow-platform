import { useEffect, useCallback } from 'react'

type KeyModifiers = {
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
}

type ShortcutCallback = (event: KeyboardEvent) => void

interface ShortcutConfig {
  key: string
  modifiers?: KeyModifiers
  callback: ShortcutCallback
  preventDefault?: boolean
  stopPropagation?: boolean
  // Don't trigger when user is typing in an input/textarea
  ignoreInputs?: boolean
}

export function useKeyboardShortcut(config: ShortcutConfig | ShortcutConfig[]) {
  const configs = Array.isArray(config) ? config : [config]

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const {
        key,
        modifiers = {},
        callback,
        preventDefault = true,
        stopPropagation = false,
        ignoreInputs = true,
      } of configs) {
        // Check if user is typing in an input
        if (ignoreInputs) {
          const target = event.target as HTMLElement
          if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
          ) {
            continue
          }
        }

        // Check if the key matches
        const keyMatches = event.key.toLowerCase() === key.toLowerCase()

        // Check if all modifiers match
        const ctrlMatches = !!modifiers.ctrl === (event.ctrlKey || event.metaKey)
        const shiftMatches = !!modifiers.shift === event.shiftKey
        const altMatches = !!modifiers.alt === event.altKey

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          if (preventDefault) {
            event.preventDefault()
          }
          if (stopPropagation) {
            event.stopPropagation()
          }
          callback(event)
        }
      }
    },
    [configs]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Pre-defined common shortcuts
export function useEscapeKey(callback: ShortcutCallback) {
  useKeyboardShortcut({
    key: 'Escape',
    callback,
    ignoreInputs: false, // Always allow escape
  })
}

export function useSearchShortcut(callback: ShortcutCallback) {
  useKeyboardShortcut({
    key: 'k',
    modifiers: { ctrl: true },
    callback,
  })
}

export function useSaveShortcut(callback: ShortcutCallback) {
  useKeyboardShortcut({
    key: 's',
    modifiers: { ctrl: true },
    callback,
  })
}

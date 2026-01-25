/**
 * SEARCH SUGGESTIONS COMPONENT
 *
 * Autocomplete suggestions for search input.
 *
 * Features:
 * - Real-time suggestions as user types
 * - Fuzzy matching
 * - Keyboard navigation (Up/Down/Enter)
 * - Category grouping
 * - Highlighted matching text
 * - Click or keyboard selection
 */

import { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react'
import { workflowTemplates } from '@/lib/workflow-templates'

// =============================================================================
// Types
// =============================================================================

export interface Suggestion {
  id: string
  text: string
  category: 'workflow' | 'template' | 'command' | 'recent'
  icon?: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface SearchSuggestionsProps {
  query: string
  onSelect: (suggestion: Suggestion) => void
  onHighlightChange?: (index: number) => void
  maxSuggestions?: number
  showCategories?: boolean
  className?: string
  recentSearches?: string[]
}

export interface SearchSuggestionsHandle {
  moveUp: () => void
  moveDown: () => void
  selectCurrent: () => boolean
  reset: () => void
  getHighlightedIndex: () => number
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MAX_SUGGESTIONS = 8

// Quick commands for power users
const QUICK_COMMANDS: Suggestion[] = [
  { id: 'cmd-new-workflow', text: '/new workflow', category: 'command', description: 'Create a new workflow' },
  { id: 'cmd-templates', text: '/templates', category: 'command', description: 'Browse templates' },
  { id: 'cmd-settings', text: '/settings', category: 'command', description: 'Open settings' },
  { id: 'cmd-help', text: '/help', category: 'command', description: 'Get help' },
  { id: 'cmd-shortcuts', text: '/shortcuts', category: 'command', description: 'View keyboard shortcuts' }
]

// =============================================================================
// Utility Functions
// =============================================================================

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)

  if (index === -1) return text

  return (
    <>
      {text.slice(0, index)}
      <span className="text-cyan-400 font-medium">{text.slice(index, index + query.length)}</span>
      {text.slice(index + query.length)}
    </>
  )
}

function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()

  // Direct match
  if (lowerText.includes(lowerQuery)) return true

  // Fuzzy: all query chars in order
  let queryIdx = 0
  for (let i = 0; i < lowerText.length && queryIdx < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIdx]) {
      queryIdx++
    }
  }
  return queryIdx === lowerQuery.length
}

function getSuggestionScore(suggestion: Suggestion, query: string): number {
  const lowerText = suggestion.text.toLowerCase()
  const lowerQuery = query.toLowerCase()

  // Exact match at start
  if (lowerText.startsWith(lowerQuery)) return 100

  // Exact match anywhere
  if (lowerText.includes(lowerQuery)) return 80

  // Word start match
  const words = lowerText.split(/\s+/)
  if (words.some(w => w.startsWith(lowerQuery))) return 60

  // Fuzzy match
  return 40
}

// =============================================================================
// Component
// =============================================================================

export const SearchSuggestions = forwardRef<SearchSuggestionsHandle, SearchSuggestionsProps>(
  function SearchSuggestions(
    {
      query,
      onSelect,
      onHighlightChange,
      maxSuggestions = DEFAULT_MAX_SUGGESTIONS,
      showCategories = true,
      className = '',
      recentSearches = []
    },
    ref
  ) {
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const listRef = useRef<HTMLDivElement>(null)

    // Generate suggestions based on query
    const suggestions = useMemo(() => {
      const results: Suggestion[] = []

      // If query starts with /, show commands
      if (query.startsWith('/')) {
        const cmdQuery = query.slice(1).toLowerCase()
        QUICK_COMMANDS.forEach(cmd => {
          if (!cmdQuery || cmd.text.slice(1).toLowerCase().includes(cmdQuery)) {
            results.push(cmd)
          }
        })
        return results.slice(0, maxSuggestions)
      }

      // No query - show recent searches
      if (!query) {
        recentSearches.slice(0, 3).forEach((search, idx) => {
          results.push({
            id: `recent-${idx}`,
            text: search,
            category: 'recent',
            description: 'Recent search'
          })
        })
        return results
      }

      // Search templates
      workflowTemplates.forEach(template => {
        if (
          fuzzyMatch(template.name, query) ||
          fuzzyMatch(template.description, query) ||
          fuzzyMatch(template.category, query)
        ) {
          results.push({
            id: `template-${template.id}`,
            text: template.name,
            category: 'template',
            icon: template.icon,
            description: template.description,
            metadata: { templateId: template.id, category: template.category }
          })
        }
      })

      // Mock workflow suggestions
      const mockWorkflows = [
        'Email Campaign Automation',
        'Lead Scoring Pipeline',
        'Customer Onboarding Flow',
        'Weekly Report Generator',
        'Support Ticket Router'
      ]

      mockWorkflows.forEach((name, idx) => {
        if (fuzzyMatch(name, query)) {
          results.push({
            id: `workflow-${idx}`,
            text: name,
            category: 'workflow',
            description: 'Your workflow'
          })
        }
      })

      // Sort by relevance score
      results.sort((a, b) => getSuggestionScore(b, query) - getSuggestionScore(a, query))

      return results.slice(0, maxSuggestions)
    }, [query, recentSearches, maxSuggestions])

    // Group suggestions by category
    const groupedSuggestions = useMemo(() => {
      if (!showCategories) return { all: suggestions }

      const groups: Record<string, Suggestion[]> = {}
      suggestions.forEach(s => {
        if (!groups[s.category]) groups[s.category] = []
        groups[s.category].push(s)
      })
      return groups
    }, [suggestions, showCategories])

    // Reset highlight when suggestions change
    useEffect(() => {
      setHighlightedIndex(-1)
    }, [query])

    // Notify parent of highlight change
    useEffect(() => {
      onHighlightChange?.(highlightedIndex)
    }, [highlightedIndex, onHighlightChange])

    // Scroll highlighted item into view
    useEffect(() => {
      if (listRef.current && highlightedIndex >= 0) {
        const highlighted = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`)
        highlighted?.scrollIntoView({ block: 'nearest' })
      }
    }, [highlightedIndex])

    // Imperative handle for keyboard navigation
    useImperativeHandle(ref, () => ({
      moveUp: () => {
        setHighlightedIndex(prev => {
          if (prev <= 0) return suggestions.length - 1
          return prev - 1
        })
      },
      moveDown: () => {
        setHighlightedIndex(prev => {
          if (prev >= suggestions.length - 1) return 0
          return prev + 1
        })
      },
      selectCurrent: () => {
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          onSelect(suggestions[highlightedIndex])
          return true
        }
        return false
      },
      reset: () => {
        setHighlightedIndex(-1)
      },
      getHighlightedIndex: () => highlightedIndex
    }), [highlightedIndex, suggestions, onSelect])

    // Handle mouse selection
    const handleClick = useCallback((suggestion: Suggestion) => {
      onSelect(suggestion)
    }, [onSelect])

    // Get category label
    const getCategoryLabel = (category: string) => {
      switch (category) {
        case 'workflow': return 'Workflows'
        case 'template': return 'Templates'
        case 'command': return 'Commands'
        case 'recent': return 'Recent'
        default: return category
      }
    }

    // Get category icon
    const getCategoryIcon = (category: string) => {
      switch (category) {
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
        case 'command':
          return (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        case 'recent':
          return (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        default:
          return null
      }
    }

    if (suggestions.length === 0) {
      return null
    }

    let globalIndex = -1

    return (
      <div
        ref={listRef}
        className={`bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden ${className}`}
        role="listbox"
        aria-label="Search suggestions"
      >
        {showCategories ? (
          Object.entries(groupedSuggestions).map(([category, items]) => (
            <div key={category}>
              {/* Category Header */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border-b border-slate-700">
                <span className="text-slate-500">{getCategoryIcon(category)}</span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {getCategoryLabel(category)}
                </span>
              </div>

              {/* Items */}
              {items.map((suggestion) => {
                globalIndex++
                const idx = globalIndex
                const isHighlighted = idx === highlightedIndex

                return (
                  <button
                    key={suggestion.id}
                    data-index={idx}
                    role="option"
                    aria-selected={isHighlighted}
                    onClick={() => handleClick(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      isHighlighted
                        ? 'bg-cyan-500/20 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {/* Icon */}
                    {suggestion.icon ? (
                      <span className="text-lg shrink-0">{suggestion.icon}</span>
                    ) : (
                      <span className={`shrink-0 ${isHighlighted ? 'text-cyan-400' : 'text-slate-500'}`}>
                        {getCategoryIcon(suggestion.category)}
                      </span>
                    )}

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="truncate">
                        {highlightMatch(suggestion.text, query)}
                      </div>
                      {suggestion.description && (
                        <div className="text-xs text-slate-500 truncate">
                          {suggestion.description}
                        </div>
                      )}
                    </div>

                    {/* Enter hint */}
                    {isHighlighted && (
                      <kbd className="px-1.5 py-0.5 text-xs bg-slate-800 text-slate-400 rounded shrink-0">
                        Enter
                      </kbd>
                    )}
                  </button>
                )
              })}
            </div>
          ))
        ) : (
          suggestions.map((suggestion, idx) => {
            const isHighlighted = idx === highlightedIndex

            return (
              <button
                key={suggestion.id}
                data-index={idx}
                role="option"
                aria-selected={isHighlighted}
                onClick={() => handleClick(suggestion)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  isHighlighted
                    ? 'bg-cyan-500/20 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {suggestion.icon ? (
                  <span className="text-lg">{suggestion.icon}</span>
                ) : (
                  <span className={isHighlighted ? 'text-cyan-400' : 'text-slate-500'}>
                    {getCategoryIcon(suggestion.category)}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="truncate">{highlightMatch(suggestion.text, query)}</div>
                  {suggestion.description && (
                    <div className="text-xs text-slate-500 truncate">{suggestion.description}</div>
                  )}
                </div>
                {isHighlighted && (
                  <kbd className="px-1.5 py-0.5 text-xs bg-slate-800 text-slate-400 rounded">Enter</kbd>
                )}
              </button>
            )
          })
        )}

        {/* Footer hint */}
        <div className="px-3 py-2 border-t border-slate-700 bg-slate-800/50 text-xs text-slate-500 flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-700 rounded">...</kbd>
            <kbd className="px-1 py-0.5 bg-slate-700 rounded">...</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-700 rounded">Enter</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-700 rounded">/</kbd>
            commands
          </span>
        </div>
      </div>
    )
  }
)

// Hook to use search suggestions with an input
export function useSearchSuggestions() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const suggestionsRef = useRef<SearchSuggestionsHandle>(null)

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexus_recent_query_searches')
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch {
      setRecentSearches([])
    }
  }, [])

  // Save search to history
  const saveSearch = useCallback((text: string) => {
    if (!text.trim()) return

    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== text)
      const updated = [text, ...filtered].slice(0, 10)
      localStorage.setItem('nexus_recent_query_searches', JSON.stringify(updated))
      return updated
    })
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        suggestionsRef.current?.moveDown()
        break
      case 'ArrowUp':
        e.preventDefault()
        suggestionsRef.current?.moveUp()
        break
      case 'Enter':
        if (suggestionsRef.current?.selectCurrent()) {
          e.preventDefault()
        }
        break
      case 'Escape':
        setIsOpen(false)
        suggestionsRef.current?.reset()
        break
    }
  }, [isOpen])

  // Handle selection
  const handleSelect = useCallback((suggestion: Suggestion) => {
    saveSearch(suggestion.text)
    setQuery(suggestion.text)
    setIsOpen(false)
  }, [saveSearch])

  return {
    query,
    setQuery,
    isOpen,
    setIsOpen,
    recentSearches,
    suggestionsRef,
    handleKeyDown,
    handleSelect
  }
}

export type { Suggestion as SearchSuggestion }

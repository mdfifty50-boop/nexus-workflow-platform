/**
 * SearchBar Component
 *
 * Template search input with autocomplete suggestions, search history,
 * advanced search toggle, and voice search placeholder.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  searchTags,
  getCategories,
} from '@/lib/marketplace'
import type { SearchSuggestion } from '@/lib/marketplace'

// =============================================================================
// TYPES
// =============================================================================

interface SearchBarProps {
  /** Current search value */
  value: string
  /** Callback when search value changes */
  onChange: (value: string) => void
  /** Callback when search is submitted */
  onSubmit?: (value: string) => void
  /** Callback when a suggestion is selected */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  /** Show advanced search toggle */
  showAdvanced?: boolean
  /** Callback when advanced search is toggled */
  onAdvancedToggle?: () => void
  /** Is advanced search expanded */
  isAdvancedOpen?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Show voice search button */
  showVoice?: boolean
  /** Auto-focus on mount */
  autoFocus?: boolean
  /** Custom class name */
  className?: string
}

interface SuggestionItemProps {
  suggestion: SearchSuggestion
  isHighlighted: boolean
  onClick: () => void
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SEARCH_HISTORY_KEY = 'nexus_search_history'
const MAX_HISTORY_ITEMS = 10
const DEBOUNCE_MS = 150

// =============================================================================
// LOCAL STORAGE HELPERS
// =============================================================================

function getSearchHistory(): string[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addSearchHistory(query: string): void {
  const history = getSearchHistory()
  const normalized = query.trim().toLowerCase()

  if (!normalized || normalized.length < 2) return

  // Remove if exists, add to front
  const filtered = history.filter((h) => h.toLowerCase() !== normalized)
  filtered.unshift(query.trim())

  localStorage.setItem(
    SEARCH_HISTORY_KEY,
    JSON.stringify(filtered.slice(0, MAX_HISTORY_ITEMS))
  )
}

function clearSearchHistory(): void {
  localStorage.removeItem(SEARCH_HISTORY_KEY)
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

function SuggestionItem({
  suggestion,
  isHighlighted,
  onClick,
}: SuggestionItemProps) {
  const getTypeIcon = () => {
    switch (suggestion.type) {
      case 'template':
        return '📄'
      case 'tag':
        return '🏷️'
      case 'category':
        return '📁'
      case 'integration':
        return '🔌'
      case 'recent':
        return '🕐'
      default:
        return '🔍'
    }
  }

  const getTypeLabel = () => {
    switch (suggestion.type) {
      case 'template':
        return 'Template'
      case 'tag':
        return 'Tag'
      case 'category':
        return 'Category'
      case 'integration':
        return 'Integration'
      case 'recent':
        return 'Recent'
      default:
        return ''
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors',
        isHighlighted ? 'bg-accent' : 'hover:bg-accent/50'
      )}
    >
      <span className="text-base" aria-hidden="true">
        {suggestion.icon || getTypeIcon()}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {suggestion.label}
        </div>
        {suggestion.description && (
          <div className="text-xs text-muted-foreground truncate">
            {suggestion.description}
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
        {getTypeLabel()}
      </span>
    </button>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SearchBar({
  value,
  onChange,
  onSubmit,
  onSuggestionSelect,
  showAdvanced = true,
  onAdvancedToggle,
  isAdvancedOpen = false,
  placeholder = 'Search templates...',
  showVoice = true,
  autoFocus = false,
  className,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Show dropdown when focused and has suggestions or recent history
  const showDropdown = isFocused && (suggestions.length > 0 || value.length === 0)

  // Generate suggestions based on input
  const generateSuggestions = useCallback(async (query: string) => {
    const results: SearchSuggestion[] = []

    if (query.length === 0) {
      // Show recent searches when empty
      const history = getSearchHistory()
      for (const term of history.slice(0, 5)) {
        results.push({
          type: 'recent',
          id: `recent-${term}`,
          label: term,
        })
      }

      // Add popular categories
      const categories = getCategories().slice(0, 3)
      for (const cat of categories) {
        results.push({
          type: 'category',
          id: `category-${cat.id}`,
          label: cat.label,
          icon: cat.icon,
        })
      }
    } else {
      // Search tags
      const matchingTags = searchTags(query, 5)
      for (const tag of matchingTags) {
        results.push({
          type: 'tag',
          id: `tag-${tag.slug}`,
          label: tag.name,
          description: `${tag.usageCount} templates`,
        })
      }

      // Search categories
      const categories = getCategories().filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase())
      )
      for (const cat of categories.slice(0, 3)) {
        results.push({
          type: 'category',
          id: `category-${cat.id}`,
          label: cat.label,
          icon: cat.icon,
          description: cat.description,
        })
      }
    }

    return results
  }, [])

  // Debounced suggestion fetching
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      const results = await generateSuggestions(value)
      setSuggestions(results)
      setHighlightedIndex(-1)
      setIsLoading(false)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value, generateSuggestions])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  // Handle form submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (value.trim()) {
        addSearchHistory(value)
        onSubmit?.(value)
        setIsFocused(false)
      }
    },
    [value, onSubmit]
  )

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      if (suggestion.type === 'recent') {
        onChange(suggestion.label)
        addSearchHistory(suggestion.label)
      }
      onSuggestionSelect?.(suggestion)
      setIsFocused(false)
    },
    [onChange, onSuggestionSelect]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          )
          break
        case 'Enter':
          if (highlightedIndex >= 0) {
            e.preventDefault()
            handleSuggestionSelect(suggestions[highlightedIndex])
          }
          break
        case 'Escape':
          setIsFocused(false)
          break
      }
    },
    [showDropdown, suggestions, highlightedIndex, handleSuggestionSelect]
  )

  // Handle clear
  const handleClear = useCallback(() => {
    onChange('')
    inputRef.current?.focus()
  }, [onChange])

  // Handle voice search (placeholder)
  const handleVoiceSearch = useCallback(() => {
    // TODO: Implement voice search with Web Speech API
    alert('Voice search coming soon!')
  }, [])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            'relative flex items-center bg-input border rounded-lg transition-all',
            isFocused
              ? 'ring-2 ring-primary border-primary'
              : 'border-input hover:border-primary/50'
          )}
        >
          {/* Search Icon */}
          <div className="pl-4 pr-2">
            {isLoading ? (
              <svg
                className="w-5 h-5 text-muted-foreground animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground',
              'min-w-0'
            )}
            aria-label="Search templates"
            aria-expanded={showDropdown}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            role="combobox"
          />

          {/* Clear Button */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Voice Search Button */}
          {showVoice && (
            <button
              type="button"
              onClick={handleVoiceSearch}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Voice search"
              title="Voice search (coming soon)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </button>
          )}

          {/* Advanced Search Toggle */}
          {showAdvanced && (
            <button
              type="button"
              onClick={onAdvancedToggle}
              className={cn(
                'p-2 mr-2 rounded transition-colors',
                isAdvancedOpen
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="Toggle advanced search"
              aria-pressed={isAdvancedOpen}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div
          id="search-suggestions"
          className={cn(
            'absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden',
            'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
          role="listbox"
        >
          {value.length === 0 && (
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
              Recent Searches
            </div>
          )}

          {suggestions.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  isHighlighted={index === highlightedIndex}
                  onClick={() => handleSuggestionSelect(suggestion)}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <svg
                className="w-8 h-8 mx-auto mb-2 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm">No suggestions found</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="px-4 py-2 bg-muted/30 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to search
            </span>
            {getSearchHistory().length > 0 && value.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  clearSearchHistory()
                  setSuggestions([])
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear history
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEscapeKey, useSearchShortcut } from '@/hooks/useKeyboardShortcut'

// Search filter types
export type SearchFilter = 'all' | 'navigation' | 'actions' | 'help' | 'recent'

// Search history item
interface SearchHistoryItem {
  query: string
  filter: SearchFilter
  timestamp: number
}

// Local storage key for search history
const SEARCH_HISTORY_KEY = 'nexus_command_search_history'
const MAX_HISTORY_ITEMS = 10

/**
 * Get search history from localStorage
 */
function getSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Save search history to localStorage
 */
function saveSearchHistory(history: SearchHistoryItem[]): void {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)))
  } catch {
    // Ignore storage errors
  }
}

interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  shortcut?: string
  action: () => void
  category: 'navigation' | 'actions' | 'recent' | 'help'
  keywords?: string[]
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [filter, setFilter] = useState<SearchFilter>('all')
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const navigate = useNavigate()
  const modalRef = useRef<HTMLDivElement>(null)

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory())
  }, [])

  // Define all commands
  const allCommands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View your dashboard',
      category: 'navigation',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      action: () => navigate('/dashboard'),
    },
    {
      id: 'nav-projects',
      label: 'Go to Projects',
      description: 'View all projects',
      category: 'navigation',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      action: () => navigate('/projects'),
    },
    {
      id: 'nav-templates',
      label: 'Go to Templates',
      description: 'Browse workflow templates',
      category: 'navigation',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      action: () => navigate('/templates'),
    },
    {
      id: 'nav-integrations',
      label: 'Go to Integrations',
      description: 'Manage integrations',
      category: 'navigation',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      action: () => navigate('/integrations'),
    },
    {
      id: 'nav-workflow-demo',
      label: 'Open Workflow Demo',
      description: 'Test the workflow demo',
      category: 'navigation',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      action: () => navigate('/workflow-demo'),
    },
    {
      id: 'nav-profile',
      label: 'Go to Profile',
      description: 'View your profile',
      category: 'navigation',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      action: () => navigate('/profile'),
    },
    // Actions
    {
      id: 'action-new-project',
      label: 'Create New Project',
      description: 'Start a new project',
      category: 'actions',
      shortcut: 'Ctrl+N',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      action: () => navigate('/projects'),
    },
    {
      id: 'action-new-workflow',
      label: 'Create New Workflow',
      description: 'Build a new automation',
      category: 'actions',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      action: () => navigate('/workflow-demo'),
    },
    // Help
    {
      id: 'help-shortcuts',
      label: 'Show Keyboard Shortcuts',
      description: 'View all keyboard shortcuts',
      category: 'help',
      shortcut: 'Shift+?',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
        </svg>
      ),
      action: () => {
        setIsOpen(false)
        setTimeout(() => window.dispatchEvent(new CustomEvent('toggleShortcutsHelp')), 100)
      },
    },
    {
      id: 'nav-analytics',
      label: 'Go to Analytics',
      description: 'View workflow analytics',
      category: 'navigation',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      action: () => navigate('/analytics'),
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      description: 'Manage your settings',
      category: 'navigation',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      action: () => navigate('/settings'),
    },
    {
      id: 'nav-advanced',
      label: 'Advanced Workflows',
      description: 'Multi-agent workflows',
      category: 'navigation',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      action: () => navigate('/advanced-workflows'),
    },
  ], [navigate])

  // Filter commands based on query and filter
  const filteredCommands = useMemo(() => {
    let filtered = allCommands

    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(cmd => cmd.category === filter)
    }

    // Apply search query
    if (query) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(lowerQuery) ||
          cmd.description?.toLowerCase().includes(lowerQuery) ||
          cmd.keywords?.some(kw => kw.toLowerCase().includes(lowerQuery))
      )
    }

    return filtered
  }, [query, filter, allCommands])

  // Save to search history when executing a command
  const saveToHistory = useCallback((searchQuery: string, searchFilter: SearchFilter) => {
    if (!searchQuery) return

    const newHistory: SearchHistoryItem[] = [
      { query: searchQuery, filter: searchFilter, timestamp: Date.now() },
      ...searchHistory.filter(h => h.query !== searchQuery)
    ].slice(0, MAX_HISTORY_ITEMS)

    setSearchHistory(newHistory)
    saveSearchHistory(newHistory)
  }, [searchHistory])

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([])
    saveSearchHistory([])
  }, [])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    for (const cmd of filteredCommands) {
      if (!groups[cmd.category]) {
        groups[cmd.category] = []
      }
      groups[cmd.category].push(cmd)
    }
    return groups
  }, [filteredCommands])

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Actions',
    recent: 'Recent',
    help: 'Help',
  }

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            saveToHistory(query, filter)
            filteredCommands[selectedIndex].action()
            setIsOpen(false)
            setQuery('')
            setFilter('all')
          }
          break
        case 'Tab':
          e.preventDefault()
          // Cycle through filters
          const filters: SearchFilter[] = ['all', 'navigation', 'actions', 'help']
          const currentIndex = filters.indexOf(filter)
          setFilter(filters[(currentIndex + 1) % filters.length])
          break
      }
    },
    [filteredCommands, selectedIndex, query, filter, saveToHistory]
  )

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Shortcuts
  useSearchShortcut(() => setIsOpen(true))
  useEscapeKey(() => {
    if (isOpen) {
      setIsOpen(false)
      setQuery('')
    }
  })

  // Listen for custom toggle event from keyboard shortcuts hook
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev)
      setQuery('')
    }
    window.addEventListener('toggleCommandPalette', handleToggle)
    return () => window.removeEventListener('toggleCommandPalette', handleToggle)
  }, [])

  // Session 8: Focus trap for accessibility
  useEffect(() => {
    if (!isOpen) return
    const modalElement = modalRef.current
    if (!modalElement) return

    const previouslyFocused = document.activeElement as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusableElements = modalElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          setIsOpen(false)
          setQuery('')
        }}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-start justify-center p-4 pt-[15vh]">
        <div
          ref={modalRef}
          className="relative w-full max-w-xl bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden outline-none"
        >
          {/* Hidden title for screen readers */}
          <h2 id="command-palette-title" className="sr-only">Command Palette</h2>
          {/* Search input */}
          <div className="flex items-center border-b border-slate-700 px-4">
            <svg
              className="w-5 h-5 text-slate-400"
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
            <input
              type="text"
              className="flex-1 bg-transparent border-0 py-4 px-3 text-white placeholder-slate-400 focus:outline-none focus:ring-0"
              placeholder="Search commands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              aria-label="Search commands"
              aria-autocomplete="list"
              aria-controls="command-results"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="mr-2 text-slate-500 hover:text-slate-400"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <kbd className="px-2 py-1 text-xs text-slate-400 bg-slate-800 rounded">
              ESC
            </kbd>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-700 overflow-x-auto">
            {(['all', 'navigation', 'actions', 'help'] as SearchFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Results */}
          <div id="command-results" className="max-h-80 overflow-y-auto p-2" role="listbox" aria-label="Available commands">
            {/* Search history */}
            {!query && searchHistory.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Recent Searches</span>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-slate-500 hover:text-slate-400"
                  >
                    Clear
                  </button>
                </div>
                {searchHistory.slice(0, 3).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(item.query)
                      setFilter(item.filter)
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{item.query}</span>
                    {item.filter !== 'all' && (
                      <span className="text-xs text-slate-600 capitalize">in {item.filter}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {filteredCommands.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                {query ? `No results for "${query}"` : 'No commands found'}
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category} className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {categoryLabels[category]}
                  </div>
                  {commands.map((cmd) => {
                    const globalIndex = filteredCommands.indexOf(cmd)
                    const isSelected = globalIndex === selectedIndex
                    return (
                      <button
                        key={cmd.id}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-cyan-500/20 text-white'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                        onClick={() => {
                          cmd.action()
                          setIsOpen(false)
                          setQuery('')
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-cyan-500/30 text-cyan-400' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {cmd.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-sm text-slate-500 truncate">
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <kbd className="px-2 py-1 text-xs text-slate-400 bg-slate-800 rounded">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t border-slate-700 px-4 py-2 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Tab</kbd>
              <span>to filter</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Enter</kbd>
              <span>to select</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook to provide command palette trigger
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useSearchShortcut(() => setIsOpen(true))

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }
}

/**
 * GLOBAL SEARCH COMPONENT
 *
 * Command palette style search (Cmd+K / Ctrl+K) that searches across:
 * - Workflows
 * - Templates
 * - Help articles
 * - Recent searches
 *
 * Features:
 * - Fuzzy search with highlighting
 * - Keyboard navigation
 * - Recent search history
 * - Category filtering
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { workflowTemplates } from '@/lib/workflow-templates'

// =============================================================================
// Types
// =============================================================================

export type SearchCategory = 'all' | 'workflows' | 'templates' | 'help' | 'recent'

export interface SearchResult {
  id: string
  type: 'workflow' | 'template' | 'help' | 'recent'
  title: string
  description: string
  icon: string
  route?: string
  action?: () => void
  metadata?: Record<string, unknown>
}

interface HelpArticle {
  id: string
  title: string
  description: string
  route: string
  keywords: string[]
}

// =============================================================================
// Constants
// =============================================================================

const RECENT_SEARCHES_KEY = 'nexus_recent_searches'
const MAX_RECENT_SEARCHES = 10
const MAX_RESULTS_PER_CATEGORY = 5

// Help articles for search
const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'help-getting-started',
    title: 'Getting Started with Nexus',
    description: 'Learn the basics of creating your first workflow',
    route: '/dashboard',
    keywords: ['start', 'begin', 'new', 'first', 'tutorial', 'onboarding']
  },
  {
    id: 'help-create-workflow',
    title: 'How to Create a Workflow',
    description: 'Step-by-step guide to building automated workflows',
    route: '/workflows',
    keywords: ['create', 'build', 'new', 'workflow', 'automation']
  },
  {
    id: 'help-templates',
    title: 'Using Workflow Templates',
    description: 'Pre-built templates to get started quickly',
    route: '/templates',
    keywords: ['template', 'preset', 'ready-made', 'quick start']
  },
  {
    id: 'help-integrations',
    title: 'Connecting Integrations',
    description: 'How to connect your apps and services',
    route: '/integrations',
    keywords: ['integration', 'connect', 'api', 'app', 'service', 'oauth']
  },
  {
    id: 'help-analytics',
    title: 'Understanding Analytics',
    description: 'Track workflow performance and insights',
    route: '/analytics',
    keywords: ['analytics', 'metrics', 'performance', 'statistics', 'data']
  },
  {
    id: 'help-settings',
    title: 'Account Settings',
    description: 'Manage your account preferences and security',
    route: '/settings',
    keywords: ['settings', 'account', 'preferences', 'security', 'profile']
  },
  {
    id: 'help-keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Speed up your workflow with keyboard shortcuts',
    route: '/settings',
    keywords: ['keyboard', 'shortcuts', 'hotkeys', 'keys', 'quick']
  }
]

// Category labels and icons
const CATEGORY_CONFIG: Record<SearchCategory, { label: string; icon: string }> = {
  all: { label: 'All Results', icon: 'search' },
  workflows: { label: 'Workflows', icon: 'workflow' },
  templates: { label: 'Templates', icon: 'template' },
  help: { label: 'Help', icon: 'help' },
  recent: { label: 'Recent', icon: 'clock' }
}

// =============================================================================
// Hooks
// =============================================================================

function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch {
        setRecentSearches([])
      }
    }
  }, [])

  const addRecentSearch = useCallback((result: SearchResult) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(r => r.id !== result.id)
      const updated = [{ ...result, type: 'recent' as const }, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearRecentSearches = useCallback(() => {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
    setRecentSearches([])
  }, [])

  return { recentSearches, addRecentSearch, clearRecentSearches }
}

// =============================================================================
// Search Logic
// =============================================================================

function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()

  // Check direct inclusion
  if (lowerText.includes(lowerQuery)) return true

  // Simple fuzzy: check if all query chars appear in order
  let queryIdx = 0
  for (let i = 0; i < lowerText.length && queryIdx < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIdx]) {
      queryIdx++
    }
  }
  return queryIdx === lowerQuery.length
}

function searchTemplates(query: string): SearchResult[] {
  if (!query) return []

  return workflowTemplates
    .filter(t =>
      fuzzyMatch(t.name, query) ||
      fuzzyMatch(t.description, query) ||
      fuzzyMatch(t.category, query)
    )
    .slice(0, MAX_RESULTS_PER_CATEGORY)
    .map(t => ({
      id: `template-${t.id}`,
      type: 'template' as const,
      title: t.name,
      description: t.description,
      icon: t.icon,
      route: '/templates',
      metadata: { templateId: t.id, category: t.category }
    }))
}

function searchHelp(query: string): SearchResult[] {
  if (!query) return []

  return HELP_ARTICLES
    .filter(h =>
      fuzzyMatch(h.title, query) ||
      fuzzyMatch(h.description, query) ||
      h.keywords.some(k => fuzzyMatch(k, query))
    )
    .slice(0, MAX_RESULTS_PER_CATEGORY)
    .map(h => ({
      id: h.id,
      type: 'help' as const,
      title: h.title,
      description: h.description,
      icon: '?',
      route: h.route
    }))
}

// Mock workflow search (would connect to real data in production)
function searchWorkflows(query: string): SearchResult[] {
  if (!query) return []

  // Mock workflows - in production, this would query the backend
  const mockWorkflows = [
    { id: 'wf-1', name: 'Email Campaign Automation', description: 'Automate marketing email sequences' },
    { id: 'wf-2', name: 'Lead Scoring Pipeline', description: 'Score and qualify incoming leads' },
    { id: 'wf-3', name: 'Customer Onboarding', description: 'Automated customer welcome flow' },
    { id: 'wf-4', name: 'Weekly Reports', description: 'Generate and send weekly analytics' },
    { id: 'wf-5', name: 'Support Ticket Router', description: 'Route support tickets to right team' }
  ]

  return mockWorkflows
    .filter(w => fuzzyMatch(w.name, query) || fuzzyMatch(w.description, query))
    .slice(0, MAX_RESULTS_PER_CATEGORY)
    .map(w => ({
      id: w.id,
      type: 'workflow' as const,
      title: w.name,
      description: w.description,
      icon: 'play',
      route: `/workflows/${w.id}`
    }))
}

// =============================================================================
// Component
// =============================================================================

interface GlobalSearchProps {
  isOpen?: boolean
  onClose?: () => void
}

export function GlobalSearch({ isOpen: controlledIsOpen, onClose }: GlobalSearchProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all')

  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches()

  // Controlled vs uncontrolled open state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const setIsOpen = onClose ? () => onClose() : setInternalIsOpen

  // Search results
  const results = useMemo(() => {
    if (!query && activeCategory === 'recent') {
      return recentSearches
    }

    if (!query) return []

    const workflows = activeCategory === 'all' || activeCategory === 'workflows'
      ? searchWorkflows(query) : []
    const templates = activeCategory === 'all' || activeCategory === 'templates'
      ? searchTemplates(query) : []
    const help = activeCategory === 'all' || activeCategory === 'help'
      ? searchHelp(query) : []
    const recent = activeCategory === 'recent'
      ? recentSearches.filter(r => fuzzyMatch(r.title, query)) : []

    if (activeCategory === 'all') {
      return [...workflows, ...templates, ...help]
    }

    return [...workflows, ...templates, ...help, ...recent]
  }, [query, activeCategory, recentSearches])

  // Group results by type for display
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}

    for (const result of results) {
      const key = result.type
      if (!groups[key]) groups[key] = []
      groups[key].push(result)
    }

    return groups
  }, [results])

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          setIsOpen(false)
        } else {
          setInternalIsOpen(true)
        }
      }

      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setIsOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
    if (!isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setActiveCategory('all')
    }
  }, [isOpen])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.querySelector('[data-selected="true"]')
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Tab':
        e.preventDefault()
        // Cycle through categories
        const categories: SearchCategory[] = ['all', 'workflows', 'templates', 'help', 'recent']
        const currentIdx = categories.indexOf(activeCategory)
        const nextIdx = e.shiftKey
          ? (currentIdx - 1 + categories.length) % categories.length
          : (currentIdx + 1) % categories.length
        setActiveCategory(categories[nextIdx])
        break
    }
  }, [results, selectedIndex, activeCategory])

  // Handle result selection
  const handleSelect = useCallback((result: SearchResult) => {
    addRecentSearch(result)

    if (result.action) {
      result.action()
    } else if (result.route) {
      navigate(result.route)
    }

    setIsOpen(false)
  }, [navigate, addRecentSearch, setIsOpen])

  // Get icon for result type
  const getIcon = (type: string, icon?: string) => {
    if (icon && icon.length <= 2) return icon // Emoji

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
      case 'help':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'recent':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Panel */}
      <div className="flex min-h-full items-start justify-center p-4 pt-[10vh]">
        <div className="relative w-full max-w-2xl bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
          {/* Search Header */}
          <div className="flex items-center border-b border-slate-700 px-4">
            <svg
              className="w-5 h-5 text-slate-400 shrink-0"
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
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-0 py-4 px-3 text-white placeholder-slate-400 focus:outline-none focus:ring-0"
              placeholder="Search workflows, templates, help..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Search"
              aria-autocomplete="list"
            />
            <kbd className="px-2 py-1 text-xs text-slate-400 bg-slate-800 rounded">
              ESC
            </kbd>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 px-2 py-2 border-b border-slate-800 overflow-x-auto">
            {(Object.keys(CATEGORY_CONFIG) as SearchCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                {CATEGORY_CONFIG[cat].label}
              </button>
            ))}
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-96 overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="py-12 text-center">
                {query ? (
                  <div className="text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No results found for "{query}"</p>
                    <p className="text-sm text-slate-500 mt-1">Try different keywords or check spelling</p>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p>Start typing to search</p>
                    <p className="text-sm text-slate-500 mt-1">Search workflows, templates, and help articles</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {Object.entries(groupedResults).map(([type, items]) => (
                  <div key={type} className="mb-3">
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {type === 'workflow' ? 'Workflows' :
                         type === 'template' ? 'Templates' :
                         type === 'help' ? 'Help' : 'Recent'}
                      </span>
                      {type === 'recent' && recentSearches.length > 0 && (
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-slate-500 hover:text-slate-400"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {items.map((result) => {
                      const globalIndex = results.indexOf(result)
                      const isSelected = globalIndex === selectedIndex

                      return (
                        <button
                          key={result.id}
                          data-selected={isSelected}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'bg-cyan-500/20 text-white'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                            isSelected ? 'bg-cyan-500/30 text-cyan-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {result.icon.length <= 2 ? result.icon : getIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{result.title}</div>
                            <div className="text-sm text-slate-500 truncate">{result.description}</div>
                          </div>
                          {result.type === 'template' && !!result.metadata?.category && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-400">
                              {String(result.metadata.category)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-700 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Tab</kbd>
                <span>switch category</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">...</kbd>
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">...</kbd>
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Enter</kbd>
                <span>select</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Cmd</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">K</kbd>
              <span>to toggle</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook to control global search from anywhere
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  return { isOpen, open, close, toggle }
}

export type { HelpArticle }

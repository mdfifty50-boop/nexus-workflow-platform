/**
 * SEARCH FILTERS COMPONENT
 *
 * Advanced filtering options for search results:
 * - Date range filters
 * - Status filters
 * - Tag filters
 * - Creator filters
 *
 * Features:
 * - Collapsible filter sections
 * - Multi-select options
 * - Date picker integration
 * - Filter presets
 */

import { useState, useCallback, useMemo } from 'react'

// =============================================================================
// Types
// =============================================================================

export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
export type WorkflowStatusFilter = 'all' | 'active' | 'draft' | 'paused' | 'completed' | 'failed'

export interface SearchFilters {
  dateRange: DateRange
  customDateStart?: Date
  customDateEnd?: Date
  status: WorkflowStatusFilter[]
  tags: string[]
  creators: string[]
  types: string[]
}

export interface FilterOption {
  id: string
  label: string
  count?: number
}

interface SearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  availableTags?: FilterOption[]
  availableCreators?: FilterOption[]
  availableTypes?: FilterOption[]
  className?: string
  collapsed?: boolean
}

// =============================================================================
// Constants
// =============================================================================

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
]

const STATUS_OPTIONS: { value: WorkflowStatusFilter; label: string; color: string }[] = [
  { value: 'all', label: 'All Statuses', color: 'slate' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'draft', label: 'Draft', color: 'slate' },
  { value: 'paused', label: 'Paused', color: 'yellow' },
  { value: 'completed', label: 'Completed', color: 'blue' },
  { value: 'failed', label: 'Failed', color: 'red' }
]

const DEFAULT_FILTERS: SearchFilters = {
  dateRange: 'month',
  status: ['all'],
  tags: [],
  creators: [],
  types: []
}

// =============================================================================
// Component
// =============================================================================

export function SearchFilters({
  filters,
  onFiltersChange,
  availableTags = [],
  availableCreators = [],
  availableTypes = [],
  className = '',
  collapsed: initialCollapsed = false
}: SearchFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    date: !initialCollapsed,
    status: !initialCollapsed,
    tags: !initialCollapsed,
    creators: false,
    types: false
  })

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }, [])

  // Update date range
  const setDateRange = useCallback((range: DateRange) => {
    onFiltersChange({
      ...filters,
      dateRange: range,
      ...(range !== 'custom' && { customDateStart: undefined, customDateEnd: undefined })
    })
  }, [filters, onFiltersChange])

  // Update custom date range
  const setCustomDateRange = useCallback((start?: Date, end?: Date) => {
    onFiltersChange({
      ...filters,
      dateRange: 'custom',
      customDateStart: start,
      customDateEnd: end
    })
  }, [filters, onFiltersChange])

  // Toggle status filter
  const toggleStatus = useCallback((status: WorkflowStatusFilter) => {
    if (status === 'all') {
      onFiltersChange({
        ...filters,
        status: ['all']
      })
      return
    }

    const newStatus = filters.status.filter(s => s !== 'all')
    const isSelected = newStatus.includes(status)

    if (isSelected) {
      const updated = newStatus.filter(s => s !== status)
      onFiltersChange({
        ...filters,
        status: updated.length === 0 ? ['all'] : updated
      })
    } else {
      onFiltersChange({
        ...filters,
        status: [...newStatus, status]
      })
    }
  }, [filters, onFiltersChange])

  // Toggle tag filter
  const toggleTag = useCallback((tagId: string) => {
    const isSelected = filters.tags.includes(tagId)
    onFiltersChange({
      ...filters,
      tags: isSelected
        ? filters.tags.filter(t => t !== tagId)
        : [...filters.tags, tagId]
    })
  }, [filters, onFiltersChange])

  // Toggle creator filter
  const toggleCreator = useCallback((creatorId: string) => {
    const isSelected = filters.creators.includes(creatorId)
    onFiltersChange({
      ...filters,
      creators: isSelected
        ? filters.creators.filter(c => c !== creatorId)
        : [...filters.creators, creatorId]
    })
  }, [filters, onFiltersChange])

  // Toggle type filter
  const toggleType = useCallback((typeId: string) => {
    const isSelected = filters.types.includes(typeId)
    onFiltersChange({
      ...filters,
      types: isSelected
        ? filters.types.filter(t => t !== typeId)
        : [...filters.types, typeId]
    })
  }, [filters, onFiltersChange])

  // Clear all filters
  const clearFilters = useCallback(() => {
    onFiltersChange(DEFAULT_FILTERS)
  }, [onFiltersChange])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.dateRange !== 'month') count++
    if (!filters.status.includes('all')) count += filters.status.length
    count += filters.tags.length
    count += filters.creators.length
    count += filters.types.length
    return count
  }, [filters])

  // Section header component
  const SectionHeader = ({
    title,
    section,
    count
  }: {
    title: string;
    section: string;
    count?: number
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
    >
      <span className="flex items-center gap-2">
        {title}
        {count !== undefined && count > 0 && (
          <span className="px-1.5 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
            {count}
          </span>
        )}
      </span>
      <svg
        className={`w-4 h-4 transition-transform ${expandedSections[section] ? 'rotate-180' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )

  return (
    <div className={`bg-slate-900 rounded-xl border border-slate-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Date Range Section */}
      <div className="border-b border-slate-800 pb-3 mb-3">
        <SectionHeader title="Date Range" section="date" />
        {expandedSections.date && (
          <div className="mt-2 space-y-2">
            {DATE_RANGE_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  filters.dateRange === option.value
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                {option.label}
              </button>
            ))}

            {/* Custom date inputs */}
            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Start</label>
                  <input
                    type="date"
                    value={filters.customDateStart?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setCustomDateRange(
                      e.target.value ? new Date(e.target.value) : undefined,
                      filters.customDateEnd
                    )}
                    className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">End</label>
                  <input
                    type="date"
                    value={filters.customDateEnd?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setCustomDateRange(
                      filters.customDateStart,
                      e.target.value ? new Date(e.target.value) : undefined
                    )}
                    className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Section */}
      <div className="border-b border-slate-800 pb-3 mb-3">
        <SectionHeader
          title="Status"
          section="status"
          count={filters.status.includes('all') ? 0 : filters.status.length}
        />
        {expandedSections.status && (
          <div className="mt-2 space-y-1">
            {STATUS_OPTIONS.map(option => {
              const isSelected = option.value === 'all'
                ? filters.status.includes('all')
                : filters.status.includes(option.value)

              return (
                <button
                  key={option.value}
                  onClick={() => toggleStatus(option.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full bg-${option.color}-500`} />
                  {option.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Tags Section */}
      {availableTags.length > 0 && (
        <div className="border-b border-slate-800 pb-3 mb-3">
          <SectionHeader title="Tags" section="tags" count={filters.tags.length} />
          {expandedSections.tags && (
            <div className="mt-2 flex flex-wrap gap-2">
              {availableTags.map(tag => {
                const isSelected = filters.tags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {tag.label}
                    {tag.count !== undefined && (
                      <span className="ml-1 text-slate-500">({tag.count})</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Creators Section */}
      {availableCreators.length > 0 && (
        <div className="border-b border-slate-800 pb-3 mb-3">
          <SectionHeader title="Created By" section="creators" count={filters.creators.length} />
          {expandedSections.creators && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {availableCreators.map(creator => {
                const isSelected = filters.creators.includes(creator.id)
                return (
                  <button
                    key={creator.id}
                    onClick={() => toggleCreator(creator.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                        {creator.label.charAt(0)}
                      </div>
                      {creator.label}
                    </span>
                    {creator.count !== undefined && (
                      <span className="text-xs text-slate-500">{creator.count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Types Section */}
      {availableTypes.length > 0 && (
        <div>
          <SectionHeader title="Type" section="types" count={filters.types.length} />
          {expandedSections.types && (
            <div className="mt-2 space-y-1">
              {availableTypes.map(type => {
                const isSelected = filters.types.includes(type.id)
                return (
                  <button
                    key={type.id}
                    onClick={() => toggleType(type.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                    }`}
                  >
                    {type.label}
                    {type.count !== undefined && (
                      <span className="text-xs text-slate-500">{type.count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Hook to manage search filters
export function useSearchFilters(initialFilters?: Partial<SearchFilters>) {
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  })

  const updateFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const hasActiveFilters = useMemo(() => {
    return (
      filters.dateRange !== 'month' ||
      !filters.status.includes('all') ||
      filters.tags.length > 0 ||
      filters.creators.length > 0 ||
      filters.types.length > 0
    )
  }, [filters])

  return {
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters
  }
}

export { DEFAULT_FILTERS }

/**
 * TemplateGrid Component
 *
 * Template gallery grid with infinite scroll loading,
 * grid/list view toggle, loading skeletons, and empty state handling.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { TemplateCard } from './TemplateCard'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import type { MarketplaceTemplate, SearchResult, TemplateSortType } from '@/lib/marketplace'
import { SortDisplay, TemplateSort } from '@/lib/marketplace'

// =============================================================================
// TYPES
// =============================================================================

interface TemplateGridProps {
  /** Initial templates to display */
  templates?: MarketplaceTemplate[]
  /** Search results with pagination info */
  searchResult?: SearchResult
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Callback when more templates should be loaded */
  onLoadMore?: () => void
  /** Whether there are more templates to load */
  hasMore?: boolean
  /** Callback when a template is selected for use */
  onUseTemplate: (template: MarketplaceTemplate) => void
  /** Callback when a template preview is requested */
  onPreviewTemplate: (template: MarketplaceTemplate) => void
  /** Set of favorited template IDs */
  favorites?: Set<string>
  /** Callback to toggle favorite status */
  onToggleFavorite?: (templateId: string) => void
  /** Current sort option */
  sortBy?: TemplateSortType
  /** Callback when sort changes */
  onSortChange?: (sort: TemplateSortType) => void
  /** View mode */
  viewMode?: 'grid' | 'list'
  /** Callback when view mode changes */
  onViewModeChange?: (mode: 'grid' | 'list') => void
  /** Whether to show the view toggle and sort controls */
  showControls?: boolean
  /** Grid column configuration */
  columns?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  /** Custom empty state message */
  emptyMessage?: string
  /** Custom empty state description */
  emptyDescription?: string
}

// =============================================================================
// SKELETON GRID COMPONENT
// =============================================================================

function SkeletonGrid({ count = 6, viewMode = 'grid' }: { count?: number; viewMode?: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <Skeleton width={48} height={48} variant="rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton height={20} width="60%" />
              <Skeleton height={14} width="80%" />
              <div className="flex gap-2">
                <Skeleton height={24} width={80} variant="rounded" />
                <Skeleton height={24} width={80} variant="rounded" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton height={32} width={100} variant="rounded" />
              <Skeleton height={32} width={100} variant="rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} hasAvatar lines={3} />
      ))}
    </div>
  )
}

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

function EmptyState({
  message = 'No templates found',
  description = 'Try adjusting your search or filters',
}: {
  message?: string
  description?: string
}) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
        <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{message}</h3>
      <p className="text-slate-400 max-w-md mx-auto">{description}</p>
    </div>
  )
}

// =============================================================================
// VIEW TOGGLE COMPONENT
// =============================================================================

function ViewToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}) {
  return (
    <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
      <button
        onClick={() => onViewModeChange('grid')}
        className={`
          p-2 rounded transition-all
          ${viewMode === 'grid'
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'text-slate-400 hover:text-white'}
        `}
        title="Grid view"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`
          p-2 rounded transition-all
          ${viewMode === 'list'
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'text-slate-400 hover:text-white'}
        `}
        title="List view"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  )
}

// =============================================================================
// SORT DROPDOWN COMPONENT
// =============================================================================

function SortDropdown({
  sortBy,
  onSortChange,
}: {
  sortBy: TemplateSortType
  onSortChange: (sort: TemplateSortType) => void
}) {
  const sortOptions = Object.entries(SortDisplay) as Array<[TemplateSortType, { label: string; icon: string }]>

  return (
    <select
      value={sortBy}
      onChange={(e) => onSortChange(e.target.value as TemplateSortType)}
      className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
    >
      {sortOptions.map(([value, { label }]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TemplateGrid({
  templates: templatesProp,
  searchResult,
  isLoading = false,
  error = null,
  onLoadMore,
  hasMore = false,
  onUseTemplate,
  onPreviewTemplate,
  favorites = new Set(),
  onToggleFavorite,
  sortBy = TemplateSort.POPULAR,
  onSortChange,
  viewMode: viewModeProp = 'grid',
  onViewModeChange,
  showControls = true,
  columns = { sm: 1, md: 2, lg: 3, xl: 3 },
  emptyMessage,
  emptyDescription,
}: TemplateGridProps) {
  // Local state for view mode if not controlled
  const [localViewMode, setLocalViewMode] = useState<'grid' | 'list'>(viewModeProp)
  const viewMode = onViewModeChange ? viewModeProp : localViewMode
  const handleViewModeChange = onViewModeChange || setLocalViewMode

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Get templates from props or search result
  const templates = useMemo(() => {
    if (templatesProp) return templatesProp
    if (searchResult) return searchResult.templates
    return []
  }, [templatesProp, searchResult])

  // Pagination info
  const pagination = searchResult?.pagination

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoading || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true)
          onLoadMore()
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [onLoadMore, hasMore, isLoading, isLoadingMore])

  // Reset loading more state when templates change
  useEffect(() => {
    setIsLoadingMore(false)
  }, [templates])

  // Generate grid column classes
  const gridClasses = useMemo(() => {
    if (viewMode === 'list') return ''

    const classes = ['grid gap-6']
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`)
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`)
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`)
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`)

    return classes.join(' ')
  }, [viewMode, columns])

  // Handle favorite toggle
  const handleToggleFavorite = useCallback((templateId: string) => {
    onToggleFavorite?.(templateId)
  }, [onToggleFavorite])

  // Error state
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  // Initial loading state
  if (isLoading && templates.length === 0) {
    return (
      <div className="space-y-6">
        {showControls && (
          <div className="flex items-center justify-between">
            <Skeleton width={200} height={24} />
            <div className="flex gap-3">
              <Skeleton width={150} height={40} variant="rounded" />
              <Skeleton width={90} height={40} variant="rounded" />
            </div>
          </div>
        )}
        <SkeletonGrid count={6} viewMode={viewMode} />
      </div>
    )
  }

  // Empty state
  if (!isLoading && templates.length === 0) {
    return <EmptyState message={emptyMessage} description={emptyDescription} />
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Results count */}
          <div className="text-sm text-slate-400">
            {pagination ? (
              <>
                Showing {(pagination.page - 1) * pagination.pageSize + 1}-
                {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of{' '}
                {pagination.totalItems.toLocaleString()} templates
              </>
            ) : (
              <>{templates.length.toLocaleString()} templates</>
            )}
          </div>

          {/* Sort and View controls */}
          <div className="flex items-center gap-3">
            {onSortChange && (
              <SortDropdown sortBy={sortBy} onSortChange={onSortChange} />
            )}
            <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          </div>
        </div>
      )}

      {/* Grid/List */}
      {viewMode === 'grid' ? (
        <div className={gridClasses || 'grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={onUseTemplate}
              onPreview={onPreviewTemplate}
              isFavorited={favorites.has(template.id)}
              onToggleFavorite={onToggleFavorite ? handleToggleFavorite : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={onUseTemplate}
              onPreview={onPreviewTemplate}
              isFavorited={favorites.has(template.id)}
              onToggleFavorite={onToggleFavorite ? handleToggleFavorite : undefined}
              variant="compact"
            />
          ))}
        </div>
      )}

      {/* Load more indicator / trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isLoadingMore ? (
            <div className="flex items-center gap-3 text-slate-400">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading more templates...
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all"
            >
              Load More
            </button>
          )}
        </div>
      )}

      {/* End of results */}
      {!hasMore && templates.length > 0 && pagination && pagination.totalPages > 1 && (
        <div className="text-center py-8 text-slate-500">
          You have reached the end of the results
        </div>
      )}
    </div>
  )
}

export default TemplateGrid
